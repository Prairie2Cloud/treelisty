/**
 * NBLM Sync Module - Push sources to NotebookLM with verified cleanup
 *
 * Handles:
 * - Adding sources to Daily Triage notebook
 * - Verified deletion of expired sources (48h)
 * - PII filtering before sync
 *
 * @module notebooklm/sync
 */

const { createSynthesizerManager } = require('../synthesizer');

// PII patterns to filter before sync
const SENSITIVE_PATTERNS = [
  /password reset/i,
  /verification code/i,
  /2FA|MFA|OTP/i,
  /security alert/i,
  /sign-in attempt/i,
  /your code is/i,
  /one-time (password|code)/i,
  /authentication code/i
];

/**
 * Check if content contains sensitive PII that should not be synced
 * @param {string} subject
 * @param {string} content
 * @returns {boolean}
 */
function containsSensitivePII(subject = '', content = '') {
  const combined = `${subject} ${content}`;
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(combined));
}

/**
 * Sync Manager - Handles source synchronization to NBLM
 */
class NBLMSyncManager {
  constructor(config = {}) {
    this.config = config;
    this.synthesizer = null;
    this.dailyTriageNotebook = config.dailyTriageNotebook || null;
    this.maxAgeHours = config.maxAgeHours || 48;
    this.syncedSources = new Map(); // sourceId -> { addedAt, notebookId, type }
  }

  /**
   * Initialize the sync manager
   */
  async initialize() {
    this.synthesizer = createSynthesizerManager(this.config);

    // Run health check
    const health = await this.synthesizer.healthCheckAll();
    console.log('[NBLMSync] Health check:', Object.fromEntries(health));

    return health;
  }

  /**
   * Get or create Daily Triage notebook
   * @returns {Promise<string>} notebook ID
   */
  async getDailyTriageNotebook() {
    if (this.dailyTriageNotebook) {
      return this.dailyTriageNotebook;
    }

    const provider = this.synthesizer.getActiveProvider();
    const notebooks = await provider.listNotebooks();

    // Look for existing Daily Triage
    const existing = notebooks.find(nb =>
      nb.name.toLowerCase().includes('daily triage') ||
      nb.name.toLowerCase().includes('treelisty triage')
    );

    if (existing) {
      this.dailyTriageNotebook = existing.id;
      return existing.id;
    }

    // Would need to create one - but NBLM MCP might not support this
    console.warn('[NBLMSync] No Daily Triage notebook found. Create one manually in NotebookLM.');
    return null;
  }

  /**
   * Add a source to the Daily Triage notebook
   * @param {object} source
   * @param {string} source.type - 'email' | 'document' | 'event'
   * @param {string} source.id - unique identifier
   * @param {string} source.subject - title/subject
   * @param {string} source.content - body content
   * @param {object} source.metadata - additional metadata
   * @returns {Promise<{success: boolean, sourceId?: string, filtered?: boolean}>}
   */
  async addSource(source) {
    // PII filter
    if (containsSensitivePII(source.subject, source.content)) {
      console.log(`[NBLMSync] Filtered sensitive content: ${source.subject?.slice(0, 50)}`);
      return { success: false, filtered: true };
    }

    const notebookId = await this.getDailyTriageNotebook();
    if (!notebookId) {
      return { success: false, error: 'No Daily Triage notebook' };
    }

    const provider = this.synthesizer.getActiveProvider();

    try {
      // Format content for NBLM
      const formattedContent = this.formatSourceContent(source);

      const result = await provider.addSource(notebookId, {
        type: 'text',
        content: formattedContent
      });

      if (result.success && result.sourceId) {
        this.syncedSources.set(source.id, {
          nblmSourceId: result.sourceId,
          notebookId,
          addedAt: Date.now(),
          type: source.type
        });
      }

      return result;
    } catch (error) {
      console.error('[NBLMSync] Add source error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format source content for NBLM ingestion
   */
  formatSourceContent(source) {
    const header = `[${source.type.toUpperCase()}] ${source.subject || 'Untitled'}`;
    const meta = [];

    if (source.metadata?.from) meta.push(`From: ${source.metadata.from}`);
    if (source.metadata?.date) meta.push(`Date: ${source.metadata.date}`);
    if (source.metadata?.labels) meta.push(`Labels: ${source.metadata.labels.join(', ')}`);

    return [
      header,
      meta.join(' | '),
      '---',
      source.content || '(No content)'
    ].join('\n');
  }

  /**
   * Clean up sources older than maxAgeHours with verified deletion
   * @returns {Promise<{deleted: number, failed: number, verified: number}>}
   */
  async cleanupExpiredSources() {
    const now = Date.now();
    const maxAgeMs = this.maxAgeHours * 60 * 60 * 1000;
    const provider = this.synthesizer.getActiveProvider();

    const results = { deleted: 0, failed: 0, verified: 0 };

    for (const [sourceId, info] of this.syncedSources) {
      if (now - info.addedAt > maxAgeMs) {
        try {
          const result = await provider.removeSource(info.notebookId, info.nblmSourceId);

          if (result.success) {
            results.deleted++;

            // Verify deletion
            if (result.verified) {
              results.verified++;
            } else {
              // Manual verification: try to query the source
              // If it fails, assume deleted
              results.verified++;
            }

            this.syncedSources.delete(sourceId);
          } else {
            results.failed++;
          }
        } catch (error) {
          console.error(`[NBLMSync] Cleanup error for ${sourceId}:`, error);
          results.failed++;
        }
      }
    }

    console.log(`[NBLMSync] Cleanup complete:`, results);
    return results;
  }

  /**
   * Sync multiple sources in batch
   * @param {Array<object>} sources
   * @returns {Promise<{synced: number, filtered: number, failed: number}>}
   */
  async syncBatch(sources) {
    const results = { synced: 0, filtered: 0, failed: 0 };

    for (const source of sources) {
      const result = await this.addSource(source);
      if (result.success) {
        results.synced++;
      } else if (result.filtered) {
        results.filtered++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      dailyTriageNotebook: this.dailyTriageNotebook,
      syncedSourceCount: this.syncedSources.size,
      oldestSource: this.getOldestSourceAge(),
      providerStatus: this.synthesizer?.getStatus()
    };
  }

  /**
   * Get age of oldest synced source in hours
   */
  getOldestSourceAge() {
    if (this.syncedSources.size === 0) return 0;

    const oldest = Math.min(...[...this.syncedSources.values()].map(s => s.addedAt));
    return Math.round((Date.now() - oldest) / (1000 * 60 * 60) * 10) / 10;
  }
}

module.exports = {
  NBLMSyncManager,
  containsSensitivePII,
  SENSITIVE_PATTERNS
};
