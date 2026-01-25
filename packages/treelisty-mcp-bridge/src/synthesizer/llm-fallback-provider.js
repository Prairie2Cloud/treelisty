/**
 * LLM Fallback Provider - Direct LLM API for synthesis when NBLM unavailable
 *
 * Uses Gemini 1.5 Pro or Claude for clustering and queries.
 * No persistent notebook state - context injected per request.
 *
 * @module synthesizer/llm-fallback-provider
 */

const { SynthesisProvider } = require('./abstract-synthesizer');

class LLMFallbackProvider extends SynthesisProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'llm-fallback';
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    this.model = config.model || 'gemini-1.5-pro';
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.healthy = !!this.apiKey;
  }

  /**
   * Make a request to Gemini API
   */
  async callGemini(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('No API key configured for LLM fallback');
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxTokens ?? 4096
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // ============ SynthesisProvider Implementation ============

  async healthCheck() {
    if (!this.apiKey) {
      return {
        healthy: false,
        message: 'No API key configured (set GEMINI_API_KEY or GOOGLE_API_KEY)'
      };
    }

    try {
      // Quick test with minimal prompt
      await this.callGemini('Say "ok"', { maxTokens: 10 });
      this.healthy = true;
      this.lastHealthCheck = new Date().toISOString();

      return {
        healthy: true,
        message: `LLM fallback ready (${this.model})`
      };
    } catch (error) {
      this.healthy = false;
      return {
        healthy: false,
        message: `LLM fallback error: ${error.message}`
      };
    }
  }

  async clusterItems(items) {
    const itemsText = items.map((item, i) =>
      `[${i + 1}] Type: ${item.type}\n` +
      `    ID: ${item.id}\n` +
      `    ${item.metadata?.subject ? 'Subject: ' + item.metadata.subject : ''}\n` +
      `    ${item.metadata?.from ? 'From: ' + item.metadata.from : ''}\n` +
      `    Content: ${(item.content || '').slice(0, 300)}...`
    ).join('\n\n');

    const prompt = `You are organizing items into logical clusters for a morning dashboard.

Group these ${items.length} items by topic, project, or context. Create 2-5 clusters.

Items:
${itemsText}

Return ONLY valid JSON in this exact format:
[
  {
    "id": "cluster_1",
    "name": "Cluster Name",
    "briefing": "1-2 sentence summary of what this cluster is about and any urgent items",
    "items": [1, 2, 5]
  }
]

Use the item numbers (1, 2, 3...) in the items array. Every item must appear in exactly one cluster.`;

    try {
      const response = await this.callGemini(prompt);
      this.recordSuccess();

      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const clusters = JSON.parse(jsonMatch[0]);

        // Map item numbers back to IDs
        return clusters.map(cluster => ({
          ...cluster,
          items: cluster.items.map(num => items[num - 1]?.id).filter(Boolean)
        }));
      }

      // Fallback: single cluster
      return [{
        id: 'cluster_all',
        name: 'All Items',
        briefing: 'Items could not be clustered automatically.',
        items: items.map(i => i.id)
      }];
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async queryContext(query, sourceIds = []) {
    // Without NBLM, we can't provide grounded answers with citations
    // This is a degraded mode - answers without source verification

    const prompt = `Answer this question concisely. Note: This is a fallback response without access to the full knowledge base.

Question: ${query}

If you don't have enough information, say so clearly.`;

    try {
      const response = await this.callGemini(prompt);
      this.recordSuccess();

      return {
        answer: response,
        citations: [], // No citations in fallback mode
        confidence: 0.5 // Lower confidence without grounding
      };
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async generatePodcast(text, options = {}) {
    // Podcast generation not available in fallback mode
    throw new Error('Podcast generation requires NBLM - not available in fallback mode');
  }

  async generateBriefing(text, options = {}) {
    const prompt = `Create a concise briefing document from this content.

Format as markdown with these sections:
## Summary
(2-3 sentences)

## Key Points
- Point 1
- Point 2
- Point 3

## Action Items
- [ ] Action 1
- [ ] Action 2

Content:
${text.slice(0, 8000)}`;

    try {
      const response = await this.callGemini(prompt);
      this.recordSuccess();

      return {
        markdown: response,
        wordCount: response.split(/\s+/).length
      };
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  async listNotebooks() {
    // No notebook management in fallback mode
    return [];
  }

  async selectNotebook(notebookId) {
    // No notebook management in fallback mode
    return {
      success: false,
      notebook: null
    };
  }

  async addSource(notebookId, source) {
    // No source management in fallback mode
    throw new Error('Source management requires NBLM - not available in fallback mode');
  }

  async removeSource(notebookId, sourceId) {
    // No source management in fallback mode
    throw new Error('Source management requires NBLM - not available in fallback mode');
  }

  getCapabilities() {
    return {
      clustering: true,   // Via LLM prompt
      queries: true,      // Degraded (no citations)
      podcasts: false,    // Not available
      briefings: true     // Via LLM prompt
    };
  }
}

module.exports = LLMFallbackProvider;
