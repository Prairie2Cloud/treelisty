/**
 * GDrive Watcher - Polls Google Drive for modified documents
 * Build 877 - Phase 2: Dashboard MVP
 *
 * Features:
 * - Configurable polling interval (default: 15 min)
 * - Watch specific folders or all recent changes
 * - Incremental sync (only modified since last poll)
 * - Smart polling (backs off when user idle)
 * - Syncs to NBLM Daily Triage notebook
 *
 * @module watchers/gdrive-watcher
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Token paths (same as gmail)
const TREEPLEXITY_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const TOKEN_PATH = path.join(TREEPLEXITY_ROOT, 'token-drive.json');
const CREDENTIALS_PATH = path.join(TREEPLEXITY_ROOT, 'credentials.json');

let driveClient = null;
let authClient = null;

/**
 * Get authenticated Drive client
 */
async function getDriveClient() {
  if (driveClient) return driveClient;

  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return { error: 'credentials_missing', message: 'credentials.json not found' };
    }

    if (!fs.existsSync(TOKEN_PATH)) {
      return { error: 'token_missing', message: 'Drive not authenticated. Run export_gdrive_content_to_treelisty.py' };
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    authClient = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    authClient.setCredentials(token);

    driveClient = google.drive({ version: 'v3', auth: authClient });
    return driveClient;

  } catch (err) {
    return { error: 'auth_error', message: err.message };
  }
}

/**
 * GDrive Watcher class
 */
class GDriveWatcher {
  constructor(options = {}) {
    this.pollInterval = options.pollInterval || 15 * 60 * 1000; // 15 minutes default
    this.idlePollInterval = options.idlePollInterval || 30 * 60 * 1000; // 30 minutes when idle
    this.watchedFolders = options.watchedFolders || []; // Empty = all recent files
    this.maxResults = options.maxResults || 20;
    this.lastPollTime = null;
    this.isRunning = false;
    this.pollTimer = null;
    this.onNewFiles = options.onNewFiles || null;
    this.onError = options.onError || console.error;
    this.stats = {
      pollCount: 0,
      filesFound: 0,
      lastPollDuration: 0,
      errors: 0
    };

    // Activity tracking
    this.lastActivityTime = Date.now();
    this.isUserActive = true;
    this.idleThreshold = options.idleThreshold || 10 * 60 * 1000;
  }

  /**
   * Start the watcher
   */
  async start() {
    if (this.isRunning) {
      return { success: false, reason: 'already_running' };
    }

    const authStatus = await this.checkDriveAuth();
    if (!authStatus.authenticated) {
      return { success: false, reason: 'not_authenticated', error: authStatus.error };
    }

    this.isRunning = true;
    console.log(`[GDriveWatcher] Started (polling every ${this.pollInterval / 1000}s)`);

    await this.poll();
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

    console.log('[GDriveWatcher] Stopped');
    return { success: true, stats: this.stats };
  }

  /**
   * Check Drive authentication
   */
  async checkDriveAuth() {
    try {
      const client = await getDriveClient();
      if (client.error) {
        return { authenticated: false, error: client.error, message: client.message };
      }
      return { authenticated: true };
    } catch (error) {
      return { authenticated: false, error: 'exception', message: error.message };
    }
  }

  /**
   * Schedule next poll
   */
  scheduleNextPoll() {
    if (!this.isRunning) return;

    const timeSinceActivity = Date.now() - this.lastActivityTime;
    this.isUserActive = timeSinceActivity < this.idleThreshold;

    const interval = this.isUserActive ? this.pollInterval : this.idlePollInterval;
    this.pollTimer = setTimeout(() => this.poll(), interval);

    if (!this.isUserActive) {
      console.log(`[GDriveWatcher] User idle, backing off to ${interval / 1000}s interval`);
    }
  }

  /**
   * Record user activity
   */
  recordActivity() {
    this.lastActivityTime = Date.now();
    this.isUserActive = true;
  }

  /**
   * Poll for modified files
   */
  async poll() {
    if (!this.isRunning) return;

    const startTime = Date.now();
    this.stats.pollCount++;

    try {
      const client = await getDriveClient();
      if (client.error) {
        throw new Error(client.message);
      }

      // Build query
      let query = 'trashed = false';

      // Only files modified since last poll
      if (this.lastPollTime) {
        query += ` and modifiedTime > '${this.lastPollTime}'`;
      }

      // Filter to watched folders if specified
      if (this.watchedFolders.length > 0) {
        const folderQueries = this.watchedFolders.map(f => `'${f}' in parents`).join(' or ');
        query += ` and (${folderQueries})`;
      }

      const response = await client.files.list({
        q: query,
        pageSize: this.maxResults,
        fields: 'files(id, name, mimeType, modifiedTime, parents, webViewLink, size)',
        orderBy: 'modifiedTime desc'
      });

      const files = response.data.files || [];
      console.log(`[GDriveWatcher] Poll #${this.stats.pollCount}: Found ${files.length} modified files`);

      // Process files
      const items = files.map(file => ({
        id: file.id,
        type: 'document',
        subject: file.name,
        content: '',  // Would need to extract content separately
        metadata: {
          mimeType: file.mimeType,
          modifiedTime: file.modifiedTime,
          webViewLink: file.webViewLink,
          size: file.size,
          parents: file.parents
        }
      }));

      // Update stats
      this.stats.filesFound += files.length;
      this.stats.lastPollDuration = Date.now() - startTime;
      this.lastPollTime = new Date().toISOString();

      // Notify callback
      if (items.length > 0 && this.onNewFiles) {
        this.onNewFiles(items);
      }

    } catch (error) {
      this.stats.errors++;
      this.onError('[GDriveWatcher] Poll error:', error.message);
    }

    this.scheduleNextPoll();
  }

  /**
   * Force immediate poll
   */
  async pollNow() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    return this.poll();
  }

  /**
   * Add folder to watch list
   */
  addWatchedFolder(folderId) {
    if (!this.watchedFolders.includes(folderId)) {
      this.watchedFolders.push(folderId);
    }
  }

  /**
   * Remove folder from watch list
   */
  removeWatchedFolder(folderId) {
    this.watchedFolders = this.watchedFolders.filter(f => f !== folderId);
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isUserActive: this.isUserActive,
      pollInterval: this.isUserActive ? this.pollInterval : this.idlePollInterval,
      watchedFolders: this.watchedFolders,
      lastPollTime: this.lastPollTime,
      stats: this.stats
    };
  }
}

/**
 * Create a GDrive watcher
 */
function createGDriveWatcher(options = {}) {
  return new GDriveWatcher(options);
}

module.exports = {
  GDriveWatcher,
  createGDriveWatcher,
  getDriveClient
};
