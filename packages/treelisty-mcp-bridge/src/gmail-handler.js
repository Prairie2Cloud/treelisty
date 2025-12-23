/**
 * Gmail Handler for TreeListy MCP Bridge
 * Build 551 - Gmail Bidirectional Sync Phase 2 (Drafts)
 *
 * Handles Gmail API operations with tokens stored locally.
 * Tokens NEVER sent to browser - all API calls happen here.
 *
 * Supports:
 * - gmail_archive: Remove from inbox (archive)
 * - gmail_trash: Move to trash
 * - gmail_star: Add/remove star
 * - gmail_mark_read: Mark as read/unread
 * - gmail_create_draft: Create a new draft
 * - gmail_update_draft: Update an existing draft
 * - gmail_get_draft: Get draft details (for conflict detection)
 * - gmail_delete_draft: Delete a draft
 *
 * Copyright 2024-2025 Prairie2Cloud LLC
 * Licensed under Apache-2.0
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// =============================================================================
// Configuration
// =============================================================================

// Token path - same location as export_gmail_to_treelisty.py uses
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Required scopes for bidirectional sync
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose'
];

// =============================================================================
// Authentication
// =============================================================================

let gmailClient = null;
let authClient = null;

/**
 * Load OAuth2 credentials and create Gmail client
 * Returns null if not authenticated or missing scopes
 */
async function getGmailClient() {
  if (gmailClient) return gmailClient;

  try {
    // Check for credentials
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return { error: 'credentials_missing', message: 'credentials.json not found. Run export_gmail_to_treelisty.py first.' };
    }

    // Check for token
    if (!fs.existsSync(TOKEN_PATH)) {
      return { error: 'token_missing', message: 'Not authenticated. Run export_gmail_to_treelisty.py to authenticate.' };
    }

    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    // Create OAuth2 client
    authClient = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Load token
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    authClient.setCredentials(token);

    // Check scopes
    const tokenScopes = token.scope ? token.scope.split(' ') : [];
    const hasModify = tokenScopes.some(s => s.includes('gmail.modify'));
    const hasCompose = tokenScopes.some(s => s.includes('gmail.compose'));

    if (!hasModify) {
      return {
        error: 'scope_missing',
        message: 'Gmail modify scope not granted. Re-authorize to enable sync.',
        hasReadOnly: true,
        needsScopes: ['gmail.modify', 'gmail.compose']
      };
    }

    // Create Gmail client
    gmailClient = google.gmail({ version: 'v1', auth: authClient });
    return gmailClient;

  } catch (err) {
    return { error: 'auth_error', message: err.message };
  }
}

/**
 * Check current auth status and scopes
 */
async function checkAuthStatus() {
  if (!fs.existsSync(TOKEN_PATH)) {
    return {
      authenticated: false,
      message: 'Not authenticated. Run export_gmail_to_treelisty.py first.'
    };
  }

  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    const scopes = token.scope ? token.scope.split(' ') : [];

    const hasReadOnly = scopes.some(s => s.includes('gmail.readonly'));
    const hasModify = scopes.some(s => s.includes('gmail.modify'));
    const hasCompose = scopes.some(s => s.includes('gmail.compose'));

    return {
      authenticated: true,
      scopes: {
        readonly: hasReadOnly,
        modify: hasModify,
        compose: hasCompose
      },
      canSync: hasModify,
      canDraft: hasCompose,
      needsReauth: !hasModify || !hasCompose,
      message: hasModify && hasCompose
        ? 'Full sync enabled'
        : 'Re-authorize to enable Gmail sync features'
    };
  } catch (err) {
    return {
      authenticated: false,
      error: err.message
    };
  }
}

// =============================================================================
// Gmail Operations
// =============================================================================

/**
 * Archive a thread (remove from inbox)
 */
async function archiveThread(threadId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        removeLabelIds: ['INBOX']
      }
    });

    return {
      success: true,
      action: 'archive',
      threadId,
      message: 'Thread archived'
    };
  } catch (err) {
    return {
      success: false,
      action: 'archive',
      threadId,
      error: err.message
    };
  }
}

/**
 * Unarchive a thread (add back to inbox)
 */
async function unarchiveThread(threadId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        addLabelIds: ['INBOX']
      }
    });

    return {
      success: true,
      action: 'unarchive',
      threadId,
      message: 'Thread moved to inbox'
    };
  } catch (err) {
    return {
      success: false,
      action: 'unarchive',
      threadId,
      error: err.message
    };
  }
}

/**
 * Move thread to trash
 */
async function trashThread(threadId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.trash({
      userId: 'me',
      id: threadId
    });

    return {
      success: true,
      action: 'trash',
      threadId,
      message: 'Thread moved to trash (recoverable for 30 days)'
    };
  } catch (err) {
    return {
      success: false,
      action: 'trash',
      threadId,
      error: err.message
    };
  }
}

/**
 * Remove thread from trash
 */
async function untrashThread(threadId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.untrash({
      userId: 'me',
      id: threadId
    });

    return {
      success: true,
      action: 'untrash',
      threadId,
      message: 'Thread restored from trash'
    };
  } catch (err) {
    return {
      success: false,
      action: 'untrash',
      threadId,
      error: err.message
    };
  }
}

/**
 * Star a thread
 */
async function starThread(threadId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        addLabelIds: ['STARRED']
      }
    });

    return {
      success: true,
      action: 'star',
      threadId,
      message: 'Thread starred'
    };
  } catch (err) {
    return {
      success: false,
      action: 'star',
      threadId,
      error: err.message
    };
  }
}

/**
 * Unstar a thread
 */
async function unstarThread(threadId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        removeLabelIds: ['STARRED']
      }
    });

    return {
      success: true,
      action: 'unstar',
      threadId,
      message: 'Thread unstarred'
    };
  } catch (err) {
    return {
      success: false,
      action: 'unstar',
      threadId,
      error: err.message
    };
  }
}

/**
 * Mark thread as read
 */
async function markRead(threadId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });

    return {
      success: true,
      action: 'mark_read',
      threadId,
      message: 'Thread marked as read'
    };
  } catch (err) {
    return {
      success: false,
      action: 'mark_read',
      threadId,
      error: err.message
    };
  }
}

/**
 * Mark thread as unread
 */
async function markUnread(threadId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        addLabelIds: ['UNREAD']
      }
    });

    return {
      success: true,
      action: 'mark_unread',
      threadId,
      message: 'Thread marked as unread'
    };
  } catch (err) {
    return {
      success: false,
      action: 'mark_unread',
      threadId,
      error: err.message
    };
  }
}

/**
 * Add a label to a thread
 */
async function addLabel(threadId, labelId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        addLabelIds: [labelId]
      }
    });

    return {
      success: true,
      action: 'add_label',
      threadId,
      labelId,
      message: `Label ${labelId} added`
    };
  } catch (err) {
    return {
      success: false,
      action: 'add_label',
      threadId,
      labelId,
      error: err.message
    };
  }
}

/**
 * Remove a label from a thread
 */
async function removeLabel(threadId, labelId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        removeLabelIds: [labelId]
      }
    });

    return {
      success: true,
      action: 'remove_label',
      threadId,
      labelId,
      message: `Label ${labelId} removed`
    };
  } catch (err) {
    return {
      success: false,
      action: 'remove_label',
      threadId,
      labelId,
      error: err.message
    };
  }
}

/**
 * List available labels
 */
async function listLabels() {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    const response = await gmail.users.labels.list({
      userId: 'me'
    });

    return {
      success: true,
      labels: response.data.labels.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type
      }))
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// =============================================================================
// Draft Operations (Build 551)
// =============================================================================

/**
 * Create a draft message (reply or new)
 * @param {string} threadId - Thread ID to reply to (optional for new message)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @param {string} cc - CC recipients (optional)
 * @param {string} bcc - BCC recipients (optional)
 * @param {string} inReplyTo - Message-ID to reply to (optional)
 */
async function createDraft({ threadId, to, subject, body, cc, bcc, inReplyTo }) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    // Build email headers
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`
    ];

    if (cc) headers.push(`Cc: ${cc}`);
    if (bcc) headers.push(`Bcc: ${bcc}`);
    if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);

    // Build raw email (RFC 2822 format)
    const email = [
      ...headers,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\r\n');

    // Base64 URL-safe encode
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const requestBody = {
      message: {
        raw: encodedEmail
      }
    };

    // If replying to a thread, include threadId
    if (threadId) {
      requestBody.message.threadId = threadId;
    }

    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody
    });

    return {
      success: true,
      action: 'create_draft',
      draftId: response.data.id,
      messageId: response.data.message.id,
      threadId: response.data.message.threadId,
      message: 'Draft created'
    };
  } catch (err) {
    return {
      success: false,
      action: 'create_draft',
      error: err.message
    };
  }
}

/**
 * Update an existing draft
 * @param {string} draftId - Draft ID to update
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @param {string} cc - CC recipients (optional)
 * @param {string} bcc - BCC recipients (optional)
 */
async function updateDraft({ draftId, to, subject, body, cc, bcc }) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    // Build email headers
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`
    ];

    if (cc) headers.push(`Cc: ${cc}`);
    if (bcc) headers.push(`Bcc: ${bcc}`);

    // Build raw email
    const email = [
      ...headers,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\r\n');

    // Base64 URL-safe encode
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.drafts.update({
      userId: 'me',
      id: draftId,
      requestBody: {
        message: {
          raw: encodedEmail
        }
      }
    });

    return {
      success: true,
      action: 'update_draft',
      draftId: response.data.id,
      messageId: response.data.message.id,
      message: 'Draft updated'
    };
  } catch (err) {
    return {
      success: false,
      action: 'update_draft',
      draftId,
      error: err.message
    };
  }
}

/**
 * Get a draft by ID (for conflict detection)
 * @param {string} draftId - Draft ID to fetch
 */
async function getDraft(draftId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    const response = await gmail.users.drafts.get({
      userId: 'me',
      id: draftId,
      format: 'full'
    });

    const draft = response.data;
    const message = draft.message;

    // Extract headers
    const headers = {};
    if (message.payload && message.payload.headers) {
      for (const header of message.payload.headers) {
        headers[header.name.toLowerCase()] = header.value;
      }
    }

    // Extract body
    let body = '';
    if (message.payload) {
      if (message.payload.body && message.payload.body.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      } else if (message.payload.parts) {
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
        }
      }
    }

    return {
      success: true,
      draftId: draft.id,
      messageId: message.id,
      threadId: message.threadId,
      to: headers['to'] || '',
      cc: headers['cc'] || '',
      bcc: headers['bcc'] || '',
      subject: headers['subject'] || '',
      body,
      internalDate: message.internalDate,
      // For conflict detection - use message history ID
      historyId: message.historyId
    };
  } catch (err) {
    if (err.code === 404) {
      return {
        success: false,
        action: 'get_draft',
        draftId,
        error: 'Draft not found - may have been deleted or sent'
      };
    }
    return {
      success: false,
      action: 'get_draft',
      draftId,
      error: err.message
    };
  }
}

/**
 * Delete a draft
 * @param {string} draftId - Draft ID to delete
 */
async function deleteDraft(draftId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    await gmail.users.drafts.delete({
      userId: 'me',
      id: draftId
    });

    return {
      success: true,
      action: 'delete_draft',
      draftId,
      message: 'Draft deleted'
    };
  } catch (err) {
    return {
      success: false,
      action: 'delete_draft',
      draftId,
      error: err.message
    };
  }
}

/**
 * List all drafts
 */
async function listDrafts() {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    const response = await gmail.users.drafts.list({
      userId: 'me',
      maxResults: 100
    });

    const drafts = response.data.drafts || [];

    return {
      success: true,
      drafts: drafts.map(d => ({
        id: d.id,
        messageId: d.message.id,
        threadId: d.message.threadId
      })),
      resultSizeEstimate: response.data.resultSizeEstimate
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Send a draft (Build 552 - Phase 3)
 * @param {string} draftId - Draft ID to send
 */
async function sendDraft(draftId) {
  const gmail = await getGmailClient();
  if (gmail.error) return gmail;

  try {
    const response = await gmail.users.drafts.send({
      userId: 'me',
      requestBody: {
        id: draftId
      }
    });

    return {
      success: true,
      action: 'send_draft',
      messageId: response.data.id,
      threadId: response.data.threadId,
      message: 'Email sent successfully'
    };
  } catch (err) {
    return {
      success: false,
      action: 'send_draft',
      draftId,
      error: err.message
    };
  }
}

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  checkAuthStatus,
  archiveThread,
  unarchiveThread,
  trashThread,
  untrashThread,
  starThread,
  unstarThread,
  markRead,
  markUnread,
  addLabel,
  removeLabel,
  listLabels,
  // Draft operations (Build 551)
  createDraft,
  updateDraft,
  getDraft,
  deleteDraft,
  listDrafts,
  // Send operation (Build 552)
  sendDraft
};
