/**
 * Abstract Synthesizer - Base class for NBLM integration
 *
 * Provides abstraction layer so TreeListy never depends on NBLM directly.
 * Implementations: NBLMProvider (primary), LLMFallbackProvider (fallback)
 *
 * @module synthesizer/abstract-synthesizer
 */

class SynthesisProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'abstract';
    this.healthy = false;
    this.lastHealthCheck = null;
    this.failureCount = 0;
  }

  /**
   * Check if provider is healthy and authenticated
   * @returns {Promise<{healthy: boolean, message: string, details?: object}>}
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by subclass');
  }

  /**
   * Cluster items into context groups
   * @param {Array<{id: string, type: string, content: string, metadata: object}>} items
   * @returns {Promise<Array<{id: string, name: string, briefing: string, items: Array}>>}
   */
  async clusterItems(items) {
    throw new Error('clusterItems() must be implemented by subclass');
  }

  /**
   * Query context for grounded answer with citations
   * @param {string} query - The question to answer
   * @param {Array<string>} sourceIds - Optional source IDs to scope the query
   * @returns {Promise<{answer: string, citations: Array<{text: string, source: string, page?: number}>, confidence: number}>}
   */
  async queryContext(query, sourceIds = []) {
    throw new Error('queryContext() must be implemented by subclass');
  }

  /**
   * Generate podcast audio from text content
   * @param {string} text - Content to convert to podcast
   * @param {object} options - Generation options (voices, style, duration)
   * @returns {Promise<{audioUrl: string, duration: number, transcript: string}>}
   */
  async generatePodcast(text, options = {}) {
    throw new Error('generatePodcast() must be implemented by subclass');
  }

  /**
   * Generate briefing document from content
   * @param {string} text - Content to convert to briefing
   * @param {object} options - Format options (length, style, sections)
   * @returns {Promise<{markdown: string, wordCount: number}>}
   */
  async generateBriefing(text, options = {}) {
    throw new Error('generateBriefing() must be implemented by subclass');
  }

  /**
   * List available notebooks/sources
   * @returns {Promise<Array<{id: string, name: string, sourceCount: number, lastModified: string}>>}
   */
  async listNotebooks() {
    throw new Error('listNotebooks() must be implemented by subclass');
  }

  /**
   * Select active notebook for queries
   * @param {string} notebookId
   * @returns {Promise<{success: boolean, notebook: object}>}
   */
  async selectNotebook(notebookId) {
    throw new Error('selectNotebook() must be implemented by subclass');
  }

  /**
   * Add source to a notebook
   * @param {string} notebookId
   * @param {object} source - {type: 'text'|'url'|'file', content: string}
   * @returns {Promise<{success: boolean, sourceId: string}>}
   */
  async addSource(notebookId, source) {
    throw new Error('addSource() must be implemented by subclass');
  }

  /**
   * Remove source from a notebook (with verification)
   * @param {string} notebookId
   * @param {string} sourceId
   * @returns {Promise<{success: boolean, verified: boolean}>}
   */
  async removeSource(notebookId, sourceId) {
    throw new Error('removeSource() must be implemented by subclass');
  }

  /**
   * Get provider capabilities
   * @returns {{clustering: boolean, queries: boolean, podcasts: boolean, briefings: boolean}}
   */
  getCapabilities() {
    return {
      clustering: false,
      queries: false,
      podcasts: false,
      briefings: false
    };
  }

  /**
   * Record a failure (for circuit breaker)
   */
  recordFailure() {
    this.failureCount++;
    this.healthy = false;
  }

  /**
   * Record a success (resets failure count)
   */
  recordSuccess() {
    this.failureCount = 0;
    this.healthy = true;
  }

  /**
   * Check if circuit is open (too many failures)
   * @param {number} threshold - Failures before circuit opens (default: 3)
   * @returns {boolean}
   */
  isCircuitOpen(threshold = 3) {
    return this.failureCount >= threshold;
  }
}

/**
 * Synthesizer Manager - Handles provider selection and fallback
 */
class SynthesizerManager {
  constructor() {
    this.providers = new Map();
    this.primary = null;
    this.fallback = null;
    this.circuitBreakerThreshold = 3;
    this.circuitResetMs = 5 * 60 * 1000; // 5 minutes
    this.lastCircuitOpen = null;
  }

  /**
   * Register a provider
   * @param {string} name
   * @param {SynthesisProvider} provider
   * @param {'primary'|'fallback'} role
   */
  registerProvider(name, provider, role = 'fallback') {
    this.providers.set(name, provider);
    if (role === 'primary') {
      this.primary = name;
    } else if (role === 'fallback' && !this.fallback) {
      this.fallback = name;
    }
  }

  /**
   * Get the active provider (handles circuit breaker logic)
   * @returns {SynthesisProvider}
   */
  getActiveProvider() {
    const primary = this.providers.get(this.primary);

    // Check if circuit should reset
    if (this.lastCircuitOpen &&
        Date.now() - this.lastCircuitOpen > this.circuitResetMs) {
      primary.failureCount = 0;
      this.lastCircuitOpen = null;
    }

    // Use primary if healthy
    if (primary && !primary.isCircuitOpen(this.circuitBreakerThreshold)) {
      return primary;
    }

    // Circuit is open - use fallback
    if (!this.lastCircuitOpen) {
      this.lastCircuitOpen = Date.now();
      console.log(`[SynthesizerManager] Circuit open for ${this.primary}, switching to ${this.fallback}`);
    }

    const fallback = this.providers.get(this.fallback);
    if (fallback) {
      return fallback;
    }

    // No fallback available - return primary anyway
    return primary;
  }

  /**
   * Execute operation with automatic fallback
   * @param {string} method - Method name to call
   * @param {Array} args - Arguments to pass
   * @returns {Promise<any>}
   */
  async execute(method, ...args) {
    const provider = this.getActiveProvider();

    try {
      const result = await provider[method](...args);
      provider.recordSuccess();
      return result;
    } catch (error) {
      provider.recordFailure();

      // Try fallback if available and not already on fallback
      if (provider.name === this.primary && this.fallback) {
        const fallback = this.providers.get(this.fallback);
        if (fallback && typeof fallback[method] === 'function') {
          console.log(`[SynthesizerManager] Falling back to ${this.fallback} for ${method}`);
          return await fallback[method](...args);
        }
      }

      throw error;
    }
  }

  /**
   * Run health checks on all providers
   * @returns {Promise<Map<string, {healthy: boolean, message: string}>>}
   */
  async healthCheckAll() {
    const results = new Map();

    for (const [name, provider] of this.providers) {
      try {
        const result = await provider.healthCheck();
        results.set(name, result);
      } catch (error) {
        results.set(name, { healthy: false, message: error.message });
      }
    }

    return results;
  }

  /**
   * Get status summary
   * @returns {{primary: string, fallback: string, activeProvider: string, circuitOpen: boolean}}
   */
  getStatus() {
    const active = this.getActiveProvider();
    return {
      primary: this.primary,
      fallback: this.fallback,
      activeProvider: active?.name,
      circuitOpen: this.lastCircuitOpen !== null
    };
  }
}

module.exports = {
  SynthesisProvider,
  SynthesizerManager
};
