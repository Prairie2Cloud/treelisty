/**
 * Netlify Edge Function: Claude API Streaming Proxy
 *
 * Solves the 10-second timeout limitation of regular Netlify Functions by using
 * Edge Functions with streaming responses (SSE). Edge Functions have no timeout
 * for streaming - only a 50ms CPU limit per chunk, which is fine for proxying.
 *
 * Why this is needed:
 * - Anthropic's Claude API blocks direct browser calls (CORS policy)
 * - Claude Sonnet/Opus can take 15-60+ seconds for complex requests
 * - Regular Netlify Functions timeout at 10 seconds
 * - Edge Functions can stream responses indefinitely
 *
 * Build 251: Initial implementation
 */

import type { Context } from "https://edge.netlify.com";

// CORS headers for browser requests
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async (request: Request, context: Context): Promise<Response> => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  // Only allow POST
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Get API key from environment
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();

    // Extract userApiKey if provided (user's own key bypasses rate limits)
    const { userApiKey, sessionToken, stream: clientWantsStream, ...anthropicBody } = body;

    // Use user's key if provided, otherwise server key
    const apiKeyToUse = userApiKey || ANTHROPIC_API_KEY;

    // Force streaming for the upstream request (we'll convert to SSE for client)
    const upstreamBody = {
      ...anthropicBody,
      stream: true, // Always stream from Claude
    };

    console.log(`[claude-stream] Starting streaming request, model: ${anthropicBody.model}`);

    // Make streaming request to Anthropic
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKeyToUse,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error(`[claude-stream] Anthropic error: ${anthropicResponse.status}`, errorText);
      return new Response(errorText, {
        status: anthropicResponse.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Check if client wants streaming or buffered response
    if (clientWantsStream === false) {
      // Client wants non-streaming: buffer entire response and return as JSON
      // This is useful for simpler integrations that don't handle SSE
      return await bufferStreamingResponse(anthropicResponse);
    }

    // Stream the response to client using SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process stream in background
    (async () => {
      try {
        const reader = anthropicResponse.body?.getReader();
        if (!reader) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: "No response body" })}\n\n`));
          await writer.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let messageId = "";
        let model = "";
        let inputTokens = 0;
        let outputTokens = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Send final message with complete response
            const finalEvent = {
              type: "message_complete",
              content: fullText,
              usage: { input_tokens: inputTokens, output_tokens: outputTokens },
              model: model,
              id: messageId,
            };
            await writer.write(encoder.encode(`data: ${JSON.stringify(finalEvent)}\n\n`));
            await writer.write(encoder.encode("data: [DONE]\n\n"));
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                continue;
              }

              try {
                const event = JSON.parse(data);

                // Extract metadata from message_start
                if (event.type === "message_start" && event.message) {
                  messageId = event.message.id;
                  model = event.message.model;
                  if (event.message.usage) {
                    inputTokens = event.message.usage.input_tokens || 0;
                  }
                }

                // Extract text from content_block_delta
                if (event.type === "content_block_delta" && event.delta?.text) {
                  fullText += event.delta.text;

                  // Forward delta to client
                  const clientEvent = {
                    type: "delta",
                    text: event.delta.text,
                    accumulated: fullText,
                  };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(clientEvent)}\n\n`));
                }

                // Extract usage from message_delta
                if (event.type === "message_delta" && event.usage) {
                  outputTokens = event.usage.output_tokens || 0;
                }

                // Handle thinking blocks (Extended Thinking)
                if (event.type === "content_block_start" && event.content_block?.type === "thinking") {
                  const thinkingEvent = {
                    type: "thinking_start",
                  };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(thinkingEvent)}\n\n`));
                }

                if (event.type === "content_block_delta" && event.delta?.type === "thinking_delta") {
                  const thinkingEvent = {
                    type: "thinking_delta",
                    thinking: event.delta.thinking,
                  };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(thinkingEvent)}\n\n`));
                }

              } catch (parseError) {
                // Skip malformed JSON
                console.warn("[claude-stream] Parse error:", parseError);
              }
            }
          }
        }

        await writer.close();
      } catch (streamError) {
        console.error("[claude-stream] Stream error:", streamError);
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: String(streamError) })}\n\n`));
          await writer.close();
        } catch {
          // Writer may already be closed
        }
      }
    })();

    return new Response(readable, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("[claude-stream] Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Buffer a streaming response and return as single JSON
 * For clients that don't want to handle SSE
 */
async function bufferStreamingResponse(response: Response): Promise<Response> {
  const reader = response.body?.getReader();
  if (!reader) {
    return new Response(
      JSON.stringify({ error: "No response body" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let messageId = "";
  let model = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let stopReason = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const event = JSON.parse(data);

          if (event.type === "message_start" && event.message) {
            messageId = event.message.id;
            model = event.message.model;
            inputTokens = event.message.usage?.input_tokens || 0;
          }

          if (event.type === "content_block_delta" && event.delta?.text) {
            fullText += event.delta.text;
          }

          if (event.type === "message_delta") {
            outputTokens = event.usage?.output_tokens || 0;
            stopReason = event.delta?.stop_reason || "";
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  // Return in Anthropic's standard response format
  const responseData = {
    id: messageId,
    type: "message",
    role: "assistant",
    model: model,
    content: [{ type: "text", text: fullText }],
    stop_reason: stopReason || "end_turn",
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
  };

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// Configure the edge function path
export const config = {
  path: "/api/claude-stream",
};
