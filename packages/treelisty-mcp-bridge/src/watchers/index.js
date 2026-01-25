/**
 * Watchers Module - Unified data source polling for Dashboard
 * Build 877 - Phase 2: Dashboard MVP
 *
 * Coordinates Gmail, GDrive, and Calendar watchers with NBLM sync.
 * Supports smart polling that backs off when user is idle.
 *
 * @module watchers
 */

const { GmailWatcher, createGmailWatcher } = require('./gmail-watcher');
const { GDriveWatcher, createGDriveWatcher } = require('./gdrive-watcher');
const { CalendarWatcher, createCalendarWatcher } = require('./calendar-watcher');
const { NBLMSyncManager } = require('../notebooklm/sync');

/**
 * Dashboard Watcher Manager - Coordinates all watchers with NBLM sync
 */
class DashboardWatcherManager {
  constructor(config = {}) {
    this.config = config;

    // Initialize watchers
    this.gmail = createGmailWatcher({
      pollInterval: config.gmailPollInterval || 5 * 60 * 1000,
      idlePollInterval: config.gmailIdlePollInterval || 15 * 60 * 1000,
      onNewMessages: (items) => this.handleNewItems('email', items),
      onError: (msg, err) => this.handleError('gmail', msg, err)
    });

    this.gdrive = createGDriveWatcher({
      pollInterval: config.gdrivePollInterval || 15 * 60 * 1000,
      idlePollInterval: config.gdriveIdlePollInterval || 30 * 60 * 1000,
      watchedFolders: config.watchedFolders || [],
      onNewFiles: (items) => this.handleNewItems('document', items),
      onError: (msg, err) => this.handleError('gdrive', msg, err)
    });

    this.calendar = createCalendarWatcher({
      pollInterval: config.calendarPollInterval || 30 * 60 * 1000,
      idlePollInterval: config.calendarIdlePollInterval || 60 * 60 * 1000,
      lookAheadDays: config.lookAheadDays || 7,
      onNewEvents: (items) => this.handleNewItems('event', items),
      onError: (msg, err) => this.handleError('calendar', msg, err)
    });

    // NBLM sync manager (optional - for syncing to Daily Triage notebook)
    this.nblmSync = config.enableNblmSync ? new NBLMSyncManager({
      dailyTriageNotebook: config.dailyTriageNotebook,
      maxAgeHours: config.maxAgeHours || 48
    }) : null;

    // Collected items for dashboard
    this.dashboardCache = {
      emails: [],
      documents: [],
      events: [],
      lastUpdated: null
    };

    // Callbacks
    this.onDashboardUpdate = config.onDashboardUpdate || null;
    this.onError = config.onError || console.error;

    // Activity tracking shared across watchers
    this.lastActivityTime = Date.now();
  }

  /**
   * Start all watchers
   */
  async startAll() {
    const results = {
      gmail: await this.gmail.start(),
      gdrive: await this.gdrive.start(),
      calendar: await this.calendar.start()
    };

    // Initialize NBLM sync if enabled
    if (this.nblmSync) {
      try {
        await this.nblmSync.initialize();
        results.nblmSync = { success: true };
      } catch (err) {
        results.nblmSync = { success: false, error: err.message };
      }
    }

    console.log('[DashboardWatcher] All watchers started:', results);
    return results;
  }

  /**
   * Stop all watchers
   */
  stopAll() {
    return {
      gmail: this.gmail.stop(),
      gdrive: this.gdrive.stop(),
      calendar: this.calendar.stop()
    };
  }

  /**
   * Start specific watcher
   */
  async start(watcher) {
    switch (watcher) {
      case 'gmail': return this.gmail.start();
      case 'gdrive': return this.gdrive.start();
      case 'calendar': return this.calendar.start();
      default: throw new Error(`Unknown watcher: ${watcher}`);
    }
  }

  /**
   * Stop specific watcher
   */
  stop(watcher) {
    switch (watcher) {
      case 'gmail': return this.gmail.stop();
      case 'gdrive': return this.gdrive.stop();
      case 'calendar': return this.calendar.stop();
      default: throw new Error(`Unknown watcher: ${watcher}`);
    }
  }

  /**
   * Handle new items from any watcher
   */
  async handleNewItems(type, items) {
    console.log(`[DashboardWatcher] Received ${items.length} new ${type} items`);

    // Add to cache
    switch (type) {
      case 'email':
        this.dashboardCache.emails = [...items, ...this.dashboardCache.emails].slice(0, 100);
        break;
      case 'document':
        this.dashboardCache.documents = [...items, ...this.dashboardCache.documents].slice(0, 100);
        break;
      case 'event':
        this.dashboardCache.events = [...items, ...this.dashboardCache.events].slice(0, 100);
        break;
    }

    this.dashboardCache.lastUpdated = new Date().toISOString();

    // Sync to NBLM if enabled
    if (this.nblmSync) {
      try {
        const syncResult = await this.nblmSync.syncBatch(items);
        console.log(`[DashboardWatcher] NBLM sync: ${syncResult.synced} synced, ${syncResult.filtered} filtered`);
      } catch (err) {
        console.error('[DashboardWatcher] NBLM sync error:', err.message);
      }
    }

    // Notify callback
    if (this.onDashboardUpdate) {
      this.onDashboardUpdate({
        type,
        items,
        cache: this.dashboardCache
      });
    }
  }

  /**
   * Handle errors from watchers
   */
  handleError(source, message, error) {
    console.error(`[DashboardWatcher/${source}]`, message, error);
    if (this.onError) {
      this.onError({ source, message, error });
    }
  }

  /**
   * Record user activity (propagates to all watchers)
   */
  recordActivity() {
    this.lastActivityTime = Date.now();
    this.gmail.recordActivity();
    this.gdrive.recordActivity();
    this.calendar.recordActivity();
  }

  /**
   * Force poll all watchers now
   */
  async pollAllNow() {
    return {
      gmail: await this.gmail.pollNow(),
      gdrive: await this.gdrive.pollNow(),
      calendar: await this.calendar.pollNow()
    };
  }

  /**
   * Get dashboard data
   */
  getDashboardData() {
    return {
      ...this.dashboardCache,
      status: this.getStatus()
    };
  }

  /**
   * Get combined status
   */
  getStatus() {
    return {
      gmail: this.gmail.getStatus(),
      gdrive: this.gdrive.getStatus(),
      calendar: this.calendar.getStatus(),
      nblmSync: this.nblmSync?.getStatus() || null,
      lastActivityTime: this.lastActivityTime
    };
  }

  /**
   * Clean up expired items from NBLM
   */
  async cleanupExpired() {
    if (this.nblmSync) {
      return this.nblmSync.cleanupExpiredSources();
    }
    return { deleted: 0, failed: 0, verified: 0 };
  }
}

/**
 * Create a dashboard watcher manager
 */
function createDashboardWatcher(config = {}) {
  return new DashboardWatcherManager(config);
}

module.exports = {
  // Individual watchers
  GmailWatcher,
  createGmailWatcher,
  GDriveWatcher,
  createGDriveWatcher,
  CalendarWatcher,
  createCalendarWatcher,

  // Combined dashboard watcher
  DashboardWatcherManager,
  createDashboardWatcher
};
