/**
 * Synthesizer Module - NBLM Integration Layer
 *
 * Provides abstraction over NotebookLM and fallback LLM providers
 * for clustering, queries, and content generation.
 *
 * @module synthesizer
 */

const { SynthesisProvider, SynthesizerManager } = require('./abstract-synthesizer');

// Lazy-load providers to avoid import errors if dependencies missing
let NBLMProvider = null;
let LLMFallbackProvider = null;

function getNBLMProvider() {
  if (!NBLMProvider) {
    try {
      NBLMProvider = require('./nblm-provider');
    } catch (e) {
      console.warn('[Synthesizer] NBLMProvider not available:', e.message);
    }
  }
  return NBLMProvider;
}

function getLLMFallbackProvider() {
  if (!LLMFallbackProvider) {
    try {
      LLMFallbackProvider = require('./llm-fallback-provider');
    } catch (e) {
      console.warn('[Synthesizer] LLMFallbackProvider not available:', e.message);
    }
  }
  return LLMFallbackProvider;
}

/**
 * Create a configured SynthesizerManager with default providers
 * @param {object} config
 * @param {object} config.nblm - NBLM provider config
 * @param {object} config.llm - LLM fallback config (apiKey, model)
 * @returns {SynthesizerManager}
 */
function createSynthesizerManager(config = {}) {
  const manager = new SynthesizerManager();

  // Register NBLM as primary if available
  const NBLM = getNBLMProvider();
  if (NBLM) {
    manager.registerProvider('nblm', new NBLM(config.nblm || {}), 'primary');
  }

  // Register LLM fallback
  const LLMFallback = getLLMFallbackProvider();
  if (LLMFallback) {
    manager.registerProvider('llm-fallback', new LLMFallback(config.llm || {}), 'fallback');
  }

  return manager;
}

module.exports = {
  SynthesisProvider,
  SynthesizerManager,
  createSynthesizerManager,
  getNBLMProvider,
  getLLMFallbackProvider
};
