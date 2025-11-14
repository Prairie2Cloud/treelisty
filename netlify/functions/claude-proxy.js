// Netlify serverless function to proxy Claude API requests
// This avoids CORS issues and keeps API key secure server-side

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Rate limiting configuration (high limits for heavy dev usage)
const RATE_LIMIT = {
  requestsPerHour: 200,        // High limit for development
  windowMs: 60 * 60 * 1000,    // 1 hour
  maxTokensPerRequest: 8192    // Max tokens (2x Haiku's 4096 for safety)
};

// In-memory rate limit tracking (resets on function cold start)
const rateLimitStore = new Map();

// Clean up old entries periodically
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.resetAt > RATE_LIMIT.windowMs) {
      rateLimitStore.delete(ip);
    }
  }
}

// Check rate limit for an IP
function checkRateLimit(ip, hasUserKey) {
  // Users with their own API keys bypass rate limits (they pay for their own usage)
  if (hasUserKey) {
    return { allowed: true, remaining: 'unlimited (user key)' };
  }

  cleanupRateLimitStore();

  const now = Date.now();
  let ipData = rateLimitStore.get(ip);

  // Initialize tracking for new IP
  if (!ipData) {
    ipData = {
      count: 0,
      resetAt: now + RATE_LIMIT.windowMs
    };
    rateLimitStore.set(ip, ipData);
  }

  // Reset window if expired
  if (now > ipData.resetAt) {
    ipData.count = 0;
    ipData.resetAt = now + RATE_LIMIT.windowMs;
  }

  // Check limit
  if (ipData.count >= RATE_LIMIT.requestsPerHour) {
    const resetInMinutes = Math.ceil((ipData.resetAt - now) / 60000);
    return {
      allowed: false,
      remaining: 0,
      resetInMinutes
    };
  }

  // Increment and allow
  ipData.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT.requestsPerHour - ipData.count
  };
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: true })
    };
  }

  // Only allow POST requests for actual calls
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get API key from environment variable
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY environment variable not set');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          message: 'API key not configured. Please set ANTHROPIC_API_KEY environment variable in Netlify.'
        }
      })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);

    // Extract userApiKey if provided (for users testing with their own key)
    const { userApiKey, ...anthropicRequestBody } = requestBody;

    // Get client IP for rate limiting
    const clientIP = event.headers['x-forwarded-for']?.split(',')[0] ||
                     event.headers['client-ip'] ||
                     'unknown';

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP, !!userApiKey);

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return {
        statusCode: 429,
        headers: {
          ...CORS_HEADERS,
          'X-RateLimit-Limit': RATE_LIMIT.requestsPerHour.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetInMinutes.toString()
        },
        body: JSON.stringify({
          error: {
            type: 'rate_limit_error',
            message: `Rate limit exceeded. Please try again in ${rateLimitResult.resetInMinutes} minutes. (Limit: ${RATE_LIMIT.requestsPerHour} requests/hour for server API key). Tip: Use your own API key to bypass rate limits.`
          }
        })
      };
    }

    // Log rate limit status
    console.log(`Rate limit: ${rateLimitResult.remaining} requests remaining`);

    // Check token limit
    if (anthropicRequestBody.max_tokens > RATE_LIMIT.maxTokensPerRequest) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            message: `max_tokens exceeds limit of ${RATE_LIMIT.maxTokensPerRequest}`
          }
        })
      };
    }

    // Use user's API key if provided, otherwise use server's key
    const apiKeyToUse = userApiKey || ANTHROPIC_API_KEY;

    if (!apiKeyToUse) {
      console.error('No API key available (neither user-provided nor server-side)');
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            message: 'API key required. Please set your API key in TreeListy (🔑 button) or configure ANTHROPIC_API_KEY environment variable in Netlify.'
          }
        })
      };
    }

    console.log(userApiKey ? 'Using user-provided API key (rate limit bypassed)' : 'Using server API key');
    console.log('Proxying request to Anthropic API...');

    // Forward request to Anthropic API (without userApiKey field)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyToUse,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicRequestBody)
    });

    const data = await response.json();

    // Return response with CORS headers
    return {
      statusCode: response.status,
      headers: CORS_HEADERS,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Claude API proxy error:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          message: error.message || 'Internal server error'
        }
      })
    };
  }
};
