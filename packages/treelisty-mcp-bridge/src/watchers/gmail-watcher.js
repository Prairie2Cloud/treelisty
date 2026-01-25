/**
 * Gmail Watcher - Polls Gmail for new messages and syncs to NBLM
 * Build 877 - Phase 2: Dashboard MVP
 *
 * Features:
 * - Configurable polling interval (default: 5 min)
 * - PII filter (blocks password resets, 2FA codes)
 * - Incremental sync (only new messages since last poll)
 * - Smart polling (backs off when user idle)
 * - Syncs to NBLM Daily Triage notebook
 *
 * @module watchers/gmail-watcher
 */

const { getGmailClient, checkAuth, listThreads } = require('../gmail-handler');
const { containsSensitivePII } = require('../notebooklm/sync');

/**
 * Gmail Watcher class
 */
class GmailWatcher {
  constructor(options = {}) {
    this.pollInterval = options.pollInterval || 5 * 60 * 1000; // 5 minutes default
    this.idlePollInterval = options.idlePollInterval || 15 * 60 * 1000; // 15 minutes when idle
    this.maxResults = options.maxResults || 20;
    this.lastHistoryId = null;
    this.lastPollTime = null;
    this.isRunning = false;
    this.pollTimer = null;
    this.onNewMessages = options.onNewMessages || null;
    this.onError = options.onError || console.error;
    this.stats = {
      pollCount: 0,
      messagesFound: 0,
      messagesFiltered: 0,
      lastPollDuration: 0,
      errors: 0
    };

    // Activity tracking for smart polling
    this.lastActivityTime = Date.now();
    this.isUserActive = true;
    this.idleThreshold = options.idleThreshold || 10 * 60 * 1000; // 10 min = idle
  }

  /**
   * Start the watcher
   */
  async start() {
    if (this.isRunning) {
      console.log('[GmailWatcher] Already running');
      return { success: false, reason: 'already_running' };
    }

    // Check authentication first
    const authStatus = await this.checkGmailAuth();
    if (!authStatus.authenticated) {
      console.error('[GmailWatcher] Not authenticated:', authStatus.error);
      return { success: false, reason: 'not_authenticated', error: authStatus.error };
    }

    this.isRunning = true;
    console.log(`[GmailWatcher] Started (polling every ${this.pollInterval / 1000}s)`);

    // Initial poll
    await this.poll();

    // Schedule next poll
    this.scheduleNextPoll();

    return { success: true, pollInterval: this.pollInterval };
  }

  /**
   * Stop the watcher
   */
  stop() {
    if (!this.isRunning) {
      return { success: false, reason: 'not_running' };
    }

    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    console.log('[GmailWatcher] Stopped');
    return { success: true, stats: this.stats };
  }

  /**
   * Check Gmail authentication status
   */
  async checkGmailAuth() {
    try {
      const client = await getGmailClient();
      if (client.error) {
        return { authenticated: false, error: client.error, message: client.message };
      }
      return { authenticated: true };
    } catch (error) {
      return { authenticated: false, error: 'exception', message: error.message };
    }
  }

  /**
   * Schedule the next poll based on activity state
   */
  scheduleNextPoll() {
    if (!this.isRunning) return;

    // Check if user is idle
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    this.isUserActive = timeSinceActivity < this.idleThreshold;

    // Use longer interval when idle
    const interval = this.isUserActive ? this.pollInterval : this.idlePollInterval;

    this.pollTimer = setTimeout(() => this.poll(), interval);

    if (!this.isUserActive) {
      console.log(`[GmailWatcher] User idle, backing off to ${interval / 1000}s interval`);
    }
  }

  /**
   * Record user activity (call this on user interactions)
   */
  recordActivity() {
    this.lastActivityTime = Date.now();
    this.isUserActive = true;
  }

  /**
   * Poll for new messages
   */
  async poll() {
    if (!this.isRunning) return;

    const startTime = Date.now();
    this.stats.pollCount++;

    try {
      const client = await getGmailClient();
      if (client.error) {
        throw new Error(client.message);
      }

      // Build query for recent unread messages
      const query = this.buildQuery();

      // Fetch messages
      const response = await client.users.messages.list({
        userId: 'me',
        maxResults: this.maxResults,
        q: query
      });

      const messages = response.data.messages || [];
      console.log(`[GmailWatcher] Poll #${this.stats.pollCount}: Found ${messages.length} messages`);

      // Process messages
      const processed = await this.processMessages(client, messages);

      // Update stats
      this.stats.messagesFound += messages.length;
      this.stats.messagesFiltered += processed.filtered;
      this.stats.lastPollDuration = Date.now() - startTime;
      this.lastPollTime = new Date().toISOString();

      // Notify callback if new messages
      if (processed.items.length > 0 && this.onNewMessages) {
        this.onNewMessages(processed.items);
      }

    } catch (error) {
      this.stats.errors++;
      this.onError('[GmailWatcher] Poll error:', error.message);
    }

    // Schedule next poll
    this.scheduleNextPoll();
  }

  /**
   * Build Gmail query for relevant messages
   */
  buildQuery() {
    const parts = ['is:inbox'];

    // Only messages newer than last poll (if we have a timestamp)
    if (this.lastPollTime) {
      // Gmail uses epoch seconds for after: query
      const afterDate = new Date(this.lastPollTime);
      const epochSeconds = Math.floor(afterDate.getTime() / 1000);
      parts.push(`after:${epochSeconds}`);
    }

    return parts.join(' ');
  }

  /**
   * Process fetched messages with PII filtering
   */
  async processMessages(client, messages) {
    const items = [];
    let filtered = 0;

    for (const msg of messages) {
      try {
        // Fetch full message
        const full = await client.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date', 'To']
        });

        const headers = full.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        // Get snippet for PII check
        const snippet = full.data.snippet || '';

        // PII Filter - skip sensitive messages
        if (containsSensitivePII(subject, snippet)) {
          console.log(`[GmailWatcher] Filtered PII: ${subject.slice(0, 40)}...`);
          filtered++;
          continue;
        }

        // Extract labels
        const labels = full.data.labelIds || [];

        items.push({
          id: msg.id,
          threadId: full.data.threadId,
          type: 'email',
          subject,
          from,
          date,
          snippet,
          labels,
          metadata: {
            from,
            date,
            labels,
            messageId: msg.id,
            threadId: full.data.threadId
          }
        });

      } catch (err) {
        console.error(`[GmailWatcher] Error processing message ${msg.id}:`, err.message);
      }
    }

    return { items, filtered };
  }

  /**
   * Force an immediate poll (ignores schedule)
   */
  async pollNow() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    return this.poll();
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isUserActive: this.isUserActive,
      pollInterval: this.isUserActive ? this.pollInterval : this.idlePollInterval,
      lastPollTime: this.lastPollTime,
      stats: this.stats
    };
  }
}

/**
 * Create a Gmail watcher with NBLM sync integration
 */
function createGmailWatcher(options = {}) {
  return new GmailWatcher(options);
}

module.exports = {
  GmailWatcher,
  createGmailWatcher
};
