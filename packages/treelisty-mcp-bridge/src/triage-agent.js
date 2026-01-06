/**
 * Triage Agent for MCP Bridge
 *
 * Background worker that continuously monitors GitHub notifications,
 * categorizes them, and sends summaries to TreeListy browser.
 *
 * Build 751: Initial implementation
 *
 * Copyright 2024-2025 Prairie2Cloud LLC
 * Licensed under Apache-2.0
 */

const githubHandler = require('./github-handler');

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_CONFIG = {
  // Polling interval in milliseconds (default: 5 minutes)
  pollInterval: 5 * 60 * 1000,

  // Minimum interval to prevent API abuse (1 minute)
  minPollInterval: 60 * 1000,

  // Auto-approve low-risk actions
  autoApprove: false,

  // Categories considered low-risk for auto-approval
  lowRiskCategories: ['subscribed', 'ci_notifications'],

  // Maximum notifications to process per cycle
  maxPerCycle: 100,

  // Enable/disable specific monitors
  monitors: {
    github: true,
    // Future: gmail, calendar, etc.
  }
};

// =============================================================================
// Triage Agent Class
// =============================================================================

class TriageAgent {
  constructor(bridge) {
    this.bridge = bridge;
    this.config = { ...DEFAULT_CONFIG };
    this.running = false;
    this.intervalId = null;
    this.lastRun = null;
    this.lastResults = null;
    this.stats = {
      cyclesRun: 0,
      notificationsProcessed: 0,
      actionsAutoApproved: 0,
      errors: 0
    };
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  /**
   * Start the triage agent
   * @param {Object} options - Override default config
   */
  start(options = {}) {
    if (this.running) {
      this.log('warn', 'Triage agent already running');
      return { success: false, reason: 'already_running' };
    }

    // Merge options with config
    this.config = { ...this.config, ...options };

    // Validate interval
    if (this.config.pollInterval < this.config.minPollInterval) {
      this.config.pollInterval = this.config.minPollInterval;
      this.log('warn', `Poll interval too low, using minimum: ${this.config.minPollInterval}ms`);
    }

    this.running = true;
    this.log('info', `Starting triage agent (interval: ${this.config.pollInterval / 1000}s)`);

    // Run immediately, then on interval
    this.runCycle();
    this.intervalId = setInterval(() => this.runCycle(), this.config.pollInterval);

    // Notify browser
    this.notifyBrowser({
      type: 'triage_started',
      config: {
        pollInterval: this.config.pollInterval,
        autoApprove: this.config.autoApprove,
        monitors: this.config.monitors
      }
    });

    return { success: true, config: this.config };
  }

  /**
   * Stop the triage agent
   */
  stop() {
    if (!this.running) {
      return { success: false, reason: 'not_running' };
    }

    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.log('info', 'Triage agent stopped');

    // Notify browser
    this.notifyBrowser({
      type: 'triage_stopped',
      stats: this.stats
    });

    return { success: true, stats: this.stats };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      running: this.running,
      config: this.config,
      lastRun: this.lastRun,
      lastResults: this.lastResults ? {
        timestamp: this.lastResults.timestamp,
        totalNotifications: this.lastResults.totalNotifications,
        categories: Object.keys(this.lastResults.breakdown || {})
      } : null,
      stats: this.stats,
      nextRun: this.running && this.lastRun
        ? new Date(this.lastRun.getTime() + this.config.pollInterval).toISOString()
        : null
    };
  }

  // ===========================================================================
  // Core Triage Cycle
  // ===========================================================================

  /**
   * Run one triage cycle
   */
  async runCycle() {
    if (!this.running) return;

    this.log('info', 'Running triage cycle...');
    this.lastRun = new Date();
    this.stats.cyclesRun++;

    try {
      const results = await this.triageGitHub();

      if (results.success) {
        this.lastResults = results;
        this.stats.notificationsProcessed += results.totalNotifications || 0;

        // Send to browser
        this.notifyBrowser({
          type: 'triage_update',
          source: 'github',
          ...results
        });

        // Auto-approve if enabled
        if (this.config.autoApprove && results.suggestedActions) {
          await this.processAutoApprovals(results.suggestedActions);
        }
      }
    } catch (err) {
      this.stats.errors++;
      this.log('error', `Triage cycle error: ${err.message}`);

      this.notifyBrowser({
        type: 'triage_error',
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Triage GitHub notifications
   */
  async triageGitHub() {
    if (!this.config.monitors.github) {
      return { success: true, skipped: true, reason: 'github_disabled' };
    }

    // Check auth first
    const authStatus = await githubHandler.checkAuthStatus();
    if (!authStatus.authenticated) {
      return {
        success: false,
        error: 'not_authenticated',
        message: authStatus.message || 'GitHub CLI not authenticated'
      };
    }

    // Get triage summary
    const summary = await githubHandler.generateTriageSummary();

    if (!summary.success) {
      return summary;
    }

    // Enhance with actionable suggestions
    const enhanced = this.enhanceTriageSummary(summary);

    return enhanced;
  }

  /**
   * Enhance triage summary with more specific actions
   */
  enhanceTriageSummary(summary) {
    const actions = [];

    // CI Failures - high priority
    if (summary.breakdown?.ci_failures > 0) {
      actions.push({
        id: `ci-${Date.now()}`,
        priority: 'high',
        category: 'ci_failures',
        action: 'investigate_ci',
        label: `🔴 ${summary.breakdown.ci_failures} CI failure(s)`,
        description: 'View failed workflows and error logs',
        autoApprovable: false,
        command: 'github_ci_status'
      });
    }

    // Review Requests - high priority
    if (summary.breakdown?.review_requests > 0) {
      actions.push({
        id: `review-${Date.now()}`,
        priority: 'high',
        category: 'review_requests',
        action: 'start_reviews',
        label: `📝 ${summary.breakdown.review_requests} PR(s) need review`,
        description: 'Start PR review session',
        autoApprovable: false,
        command: 'github_prs'
      });
    }

    // Mentions - medium priority
    if (summary.breakdown?.mentions > 0) {
      actions.push({
        id: `mentions-${Date.now()}`,
        priority: 'medium',
        category: 'mentions',
        action: 'check_mentions',
        label: `💬 ${summary.breakdown.mentions} mention(s)`,
        description: 'Check mentions that may need response',
        autoApprovable: false,
        command: 'github_notifications'
      });
    }

    // Low-priority bulk cleanup
    const lowPriorityCount =
      (summary.breakdown?.subscribed || 0) +
      (summary.breakdown?.other || 0);

    if (lowPriorityCount > 5) {
      actions.push({
        id: `cleanup-${Date.now()}`,
        priority: 'low',
        category: 'subscribed',
        action: 'bulk_mark_read',
        label: `📭 ${lowPriorityCount} low-priority notifications`,
        description: 'Mark subscribed/other notifications as read',
        autoApprovable: true,
        command: 'github_mark_read'
      });
    }

    return {
      ...summary,
      suggestedActions: actions,
      enhancedAt: new Date().toISOString()
    };
  }

  /**
   * Process auto-approvals for low-risk actions
   */
  async processAutoApprovals(actions) {
    const autoApprovable = actions.filter(a =>
      a.autoApprovable &&
      this.config.lowRiskCategories.includes(a.category)
    );

    for (const action of autoApprovable) {
      this.log('info', `Auto-approving: ${action.label}`);

      try {
        // Execute the action
        if (action.action === 'bulk_mark_read') {
          await githubHandler.markAllRead();
        }

        this.stats.actionsAutoApproved++;

        // Notify browser of auto-approval
        this.notifyBrowser({
          type: 'triage_auto_approved',
          action: action,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        this.log('error', `Auto-approval failed for ${action.action}: ${err.message}`);
      }
    }
  }

  // ===========================================================================
  // Browser Communication
  // ===========================================================================

  /**
   * Send notification to all connected browsers
   */
  notifyBrowser(data) {
    if (!this.bridge || !this.bridge.broadcastToBrowser) {
      this.log('warn', 'No bridge available for browser notification');
      return;
    }

    this.bridge.broadcastToBrowser({
      source: 'triage_agent',
      ...data
    });
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  log(level, message) {
    const timestamp = new Date().toISOString();
    const prefix = '[TriageAgent]';

    switch (level) {
      case 'error':
        console.error(`${timestamp} ${prefix} ERROR: ${message}`);
        break;
      case 'warn':
        console.warn(`${timestamp} ${prefix} WARN: ${message}`);
        break;
      case 'info':
      default:
        console.log(`${timestamp} ${prefix} ${message}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    const wasRunning = this.running;

    // Stop if running
    if (wasRunning) {
      this.stop();
    }

    // Update config
    this.config = { ...this.config, ...newConfig };

    // Restart if was running
    if (wasRunning) {
      this.start();
    }

    return { success: true, config: this.config };
  }

  /**
   * Trigger immediate triage (manual)
   */
  async triggerNow() {
    this.log('info', 'Manual triage triggered');
    await this.runCycle();
    return {
      success: true,
      results: this.lastResults
    };
  }
}

// =============================================================================
// Exports
// =============================================================================

module.exports = TriageAgent;
