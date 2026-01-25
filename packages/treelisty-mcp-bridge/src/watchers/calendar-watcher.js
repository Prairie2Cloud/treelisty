/**
 * Calendar Watcher - Polls Google Calendar for upcoming events
 * Build 877 - Phase 2: Dashboard MVP
 *
 * Features:
 * - Configurable polling interval (default: 30 min)
 * - Watch events in configurable time window (default: 7 days)
 * - Incremental sync (only new/modified events)
 * - Smart polling (backs off when user idle)
 * - Syncs to NBLM Daily Triage notebook
 *
 * @module watchers/calendar-watcher
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Token paths
const TREEPLEXITY_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const TOKEN_PATH = path.join(TREEPLEXITY_ROOT, 'token-calendar.json');
const CREDENTIALS_PATH = path.join(TREEPLEXITY_ROOT, 'credentials.json');

let calendarClient = null;
let authClient = null;

/**
 * Get authenticated Calendar client
 */
async function getCalendarClient() {
  if (calendarClient) return calendarClient;

  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return { error: 'credentials_missing', message: 'credentials.json not found' };
    }

    if (!fs.existsSync(TOKEN_PATH)) {
      return { error: 'token_missing', message: 'Calendar not authenticated. Run export_gcalendar_to_treelisty.py' };
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    authClient = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    authClient.setCredentials(token);

    calendarClient = google.calendar({ version: 'v3', auth: authClient });
    return calendarClient;

  } catch (err) {
    return { error: 'auth_error', message: err.message };
  }
}

/**
 * Calendar Watcher class
 */
class CalendarWatcher {
  constructor(options = {}) {
    this.pollInterval = options.pollInterval || 30 * 60 * 1000; // 30 minutes default
    this.idlePollInterval = options.idlePollInterval || 60 * 60 * 1000; // 60 minutes when idle
    this.lookAheadDays = options.lookAheadDays || 7; // Watch 7 days ahead
    this.maxResults = options.maxResults || 50;
    this.calendarId = options.calendarId || 'primary';
    this.lastSyncToken = null;
    this.lastPollTime = null;
    this.isRunning = false;
    this.pollTimer = null;
    this.onNewEvents = options.onNewEvents || null;
    this.onError = options.onError || console.error;
    this.stats = {
      pollCount: 0,
      eventsFound: 0,
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

    const authStatus = await this.checkCalendarAuth();
    if (!authStatus.authenticated) {
      return { success: false, reason: 'not_authenticated', error: authStatus.error };
    }

    this.isRunning = true;
    console.log(`[CalendarWatcher] Started (polling every ${this.pollInterval / 1000}s, ${this.lookAheadDays} days ahead)`);

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

    console.log('[CalendarWatcher] Stopped');
    return { success: true, stats: this.stats };
  }

  /**
   * Check Calendar authentication
   */
  async checkCalendarAuth() {
    try {
      const client = await getCalendarClient();
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
      console.log(`[CalendarWatcher] User idle, backing off to ${interval / 1000}s interval`);
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
   * Poll for events
   */
  async poll() {
    if (!this.isRunning) return;

    const startTime = Date.now();
    this.stats.pollCount++;

    try {
      const client = await getCalendarClient();
      if (client.error) {
        throw new Error(client.message);
      }

      // Calculate time range
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + this.lookAheadDays * 24 * 60 * 60 * 1000).toISOString();

      const response = await client.events.list({
        calendarId: this.calendarId,
        timeMin,
        timeMax,
        maxResults: this.maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        // Use sync token for incremental updates if available
        ...(this.lastSyncToken ? { syncToken: this.lastSyncToken } : {})
      });

      // Store sync token for next incremental sync
      if (response.data.nextSyncToken) {
        this.lastSyncToken = response.data.nextSyncToken;
      }

      const events = response.data.items || [];
      console.log(`[CalendarWatcher] Poll #${this.stats.pollCount}: Found ${events.length} events`);

      // Process events
      const items = events.map(event => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;

        return {
          id: event.id,
          type: 'event',
          subject: event.summary || '(No title)',
          content: event.description || '',
          metadata: {
            start,
            end,
            location: event.location,
            attendees: event.attendees?.map(a => a.email) || [],
            status: event.status,
            htmlLink: event.htmlLink,
            isAllDay: !!event.start?.date,
            organizer: event.organizer?.email
          }
        };
      });

      // Update stats
      this.stats.eventsFound += events.length;
      this.stats.lastPollDuration = Date.now() - startTime;
      this.lastPollTime = new Date().toISOString();

      // Notify callback
      if (items.length > 0 && this.onNewEvents) {
        this.onNewEvents(items);
      }

    } catch (error) {
      // Handle sync token invalidation
      if (error.message?.includes('Sync token') || error.code === 410) {
        console.log('[CalendarWatcher] Sync token expired, doing full sync');
        this.lastSyncToken = null;
        return this.poll();
      }

      this.stats.errors++;
      this.onError('[CalendarWatcher] Poll error:', error.message);
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
   * Get events for specific date
   */
  async getEventsForDate(date) {
    const client = await getCalendarClient();
    if (client.error) {
      throw new Error(client.message);
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await client.events.list({
      calendarId: this.calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items || [];
  }

  /**
   * Get today's events
   */
  async getTodayEvents() {
    return this.getEventsForDate(new Date());
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isUserActive: this.isUserActive,
      pollInterval: this.isUserActive ? this.pollInterval : this.idlePollInterval,
      lookAheadDays: this.lookAheadDays,
      calendarId: this.calendarId,
      lastPollTime: this.lastPollTime,
      stats: this.stats
    };
  }
}

/**
 * Create a Calendar watcher
 */
function createCalendarWatcher(options = {}) {
  return new CalendarWatcher(options);
}

module.exports = {
  CalendarWatcher,
  createCalendarWatcher,
  getCalendarClient
};
