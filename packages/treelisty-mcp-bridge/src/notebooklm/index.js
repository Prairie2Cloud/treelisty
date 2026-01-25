/**
 * NotebookLM Integration Module
 *
 * Provides sync and query capabilities for NBLM integration.
 *
 * @module notebooklm
 */

const { NBLMSyncManager, containsSensitivePII, SENSITIVE_PATTERNS } = require('./sync');
const { NBLMQueryManager, quickQuery } = require('./query');

module.exports = {
  // Sync
  NBLMSyncManager,
  containsSensitivePII,
  SENSITIVE_PATTERNS,

  // Query
  NBLMQueryManager,
  quickQuery
};
