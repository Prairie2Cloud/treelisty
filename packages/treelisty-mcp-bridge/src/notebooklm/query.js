/**
 * NBLM Query Module - Ask questions against NotebookLM
 *
 * Handles:
 * - Querying selected notebook for grounded answers
 * - Citation extraction and formatting
 * - Notebook selection and context scoping
 *
 * @module notebooklm/query
 */

const { createSynthesizerManager } = require('../synthesizer');

/**
 * Query Manager - Handles NBLM queries with citation tracking
 */
class NBLMQueryManager {
  constructor(config = {}) {
    this.config = config;
    this.synthesizer = null;
    this.selectedNotebook = null;
    this.queryHistory = [];
    this.maxHistory = config.maxHistory || 50;
  }

  /**
   * Initialize the query manager
   */
  async initialize() {
    this.synthesizer = createSynthesizerManager(this.config);
    const health = await this.synthesizer.healthCheckAll();
    return health;
  }

  /**
   * List available notebooks
   * @returns {Promise<Array<{id: string, name: string, sourceCount: number}>>}
   */
  async listNotebooks() {
    const provider = this.synthesizer.getActiveProvider();
    return provider.listNotebooks();
  }

  /**
   * Select a notebook for queries
   * @param {string} notebookId
   * @returns {Promise<{success: boolean, notebook: object}>}
   */
  async selectNotebook(notebookId) {
    const provider = this.synthesizer.getActiveProvider();
    const result = await provider.selectNotebook(notebookId);

    if (result.success) {
      this.selectedNotebook = notebookId;
    }

    return result;
  }

  /**
   * Query the selected notebook
   * @param {string} question
   * @param {object} options
   * @param {Array<string>} options.sourceIds - Limit to specific sources
   * @param {boolean} options.includeCitations - Include citation details (default: true)
   * @returns {Promise<{answer: string, citations: Array, confidence: number, provider: string}>}
   */
  async query(question, options = {}) {
    const { sourceIds = [], includeCitations = true } = options;

    const provider = this.synthesizer.getActiveProvider();

    const startTime = Date.now();
    const result = await provider.queryContext(question, sourceIds);
    const duration = Date.now() - startTime;

    // Format citations if available
    const formattedCitations = includeCitations
      ? this.formatCitations(result.citations || [])
      : [];

    // Record in history
    this.addToHistory({
      question,
      answer: result.answer,
      citations: formattedCitations,
      confidence: result.confidence,
      provider: provider.name,
      notebook: this.selectedNotebook,
      duration,
      timestamp: new Date().toISOString()
    });

    return {
      answer: result.answer,
      citations: formattedCitations,
      confidence: result.confidence,
      provider: provider.name,
      duration
    };
  }

  /**
   * Format citations for display
   * @param {Array} rawCitations
   * @returns {Array<{id: number, text: string, source: string, page?: number, url?: string}>}
   */
  formatCitations(rawCitations) {
    return rawCitations.map((citation, index) => ({
      id: index + 1,
      text: citation.text || citation.snippet || '',
      source: citation.source || citation.document || 'Unknown source',
      page: citation.page || citation.pageNumber,
      url: citation.url || citation.link,
      // For linking back to original files
      localPath: citation.localPath || null
    }));
  }

  /**
   * Generate a briefing from the current notebook
   * @param {string} topic - Optional topic to focus on
   * @returns {Promise<{markdown: string, wordCount: number, provider: string}>}
   */
  async generateBriefing(topic = null) {
    const provider = this.synthesizer.getActiveProvider();

    const prompt = topic
      ? `Generate a briefing about: ${topic}`
      : 'Generate a comprehensive briefing of all content in this notebook';

    const result = await provider.generateBriefing(prompt);

    return {
      ...result,
      provider: provider.name
    };
  }

  /**
   * Ask a follow-up question with context from previous answer
   * @param {string} followUp
   * @returns {Promise<object>}
   */
  async followUp(followUp) {
    const lastQuery = this.queryHistory[this.queryHistory.length - 1];

    if (!lastQuery) {
      return this.query(followUp);
    }

    // Include context from previous question
    const contextualQuestion = `Context from previous question: "${lastQuery.question}"
Previous answer summary: ${lastQuery.answer.slice(0, 500)}...

Follow-up question: ${followUp}`;

    return this.query(contextualQuestion);
  }

  /**
   * Add query to history
   */
  addToHistory(entry) {
    this.queryHistory.push(entry);

    // Trim history if too long
    if (this.queryHistory.length > this.maxHistory) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistory);
    }
  }

  /**
   * Get query history
   * @param {number} limit
   * @returns {Array}
   */
  getHistory(limit = 10) {
    return this.queryHistory.slice(-limit);
  }

  /**
   * Clear query history
   */
  clearHistory() {
    this.queryHistory = [];
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      selectedNotebook: this.selectedNotebook,
      queryCount: this.queryHistory.length,
      lastQuery: this.queryHistory[this.queryHistory.length - 1]?.timestamp,
      providerStatus: this.synthesizer?.getStatus()
    };
  }
}

/**
 * Quick query helper - for one-off queries without manager setup
 * @param {string} question
 * @param {string} notebookId
 * @param {object} config
 * @returns {Promise<object>}
 */
async function quickQuery(question, notebookId, config = {}) {
  const manager = new NBLMQueryManager(config);
  await manager.initialize();

  if (notebookId) {
    await manager.selectNotebook(notebookId);
  }

  return manager.query(question);
}

module.exports = {
  NBLMQueryManager,
  quickQuery
};
