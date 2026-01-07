/**
 * Google Drive Handler for TreeListy MCP Bridge
 * Build 771 - GDrive RAG Integration Phase 2
 *
 * Handles Google Drive API operations for file listing, content extraction, and file actions.
 * Uses separate token (token-drive.json) from Gmail.
 *
 * Supports:
 * - gdrive_check_auth: Check Drive authentication status
 * - gdrive_list_files: List files in a folder
 * - gdrive_extract_content: Extract text content from files (calls Python script)
 * - gdrive_open_file: Open file in browser or system handler
 * - gdrive_get_file_info: Get metadata for a specific file
 *
 * Copyright 2024-2025 Prairie2Cloud LLC
 * Licensed under Apache-2.0
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { google } = require('googleapis');

// =============================================================================
// Configuration
// =============================================================================

// Token path - look in treeplexity root
const TREEPLEXITY_ROOT = path.resolve(__dirname, '..', '..', '..');
const TOKEN_PATH = path.join(TREEPLEXITY_ROOT, 'token-drive.json');
const CREDENTIALS_PATH = path.join(TREEPLEXITY_ROOT, 'credentials.json');
const EXTRACT_SCRIPT = path.join(TREEPLEXITY_ROOT, 'export_gdrive_content_to_treelisty.py');

// Required scope for Drive read-only
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly'
];

// File type icons for display
const FILE_ICONS = {
  'application/vnd.google-apps.folder': '📁',
  'application/vnd.google-apps.document': '📘',
  'application/vnd.google-apps.spreadsheet': '📗',
  'application/vnd.google-apps.presentation': '📙',
  'application/pdf': '📕',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📗',
  'text/plain': '📝',
  'text/markdown': '📝',
  'image/': '🖼️',
  'video/': '🎬',
  'audio/': '🎵'
};

// =============================================================================
// Authentication
// =============================================================================

let driveClient = null;
let authClient = null;

/**
 * Get icon for file type
 */
function getFileIcon(mimeType) {
  if (FILE_ICONS[mimeType]) return FILE_ICONS[mimeType];

  // Check prefixes for media types
  for (const [prefix, icon] of Object.entries(FILE_ICONS)) {
    if (mimeType.startsWith(prefix)) return icon;
  }

  return '📄'; // Default
}

/**
 * Load OAuth2 credentials and create Drive client
 * Returns null if not authenticated
 */
async function getDriveClient() {
  if (driveClient) return driveClient;

  try {
    // Check for credentials
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return {
        error: 'credentials_missing',
        message: 'credentials.json not found. Download from Google Cloud Console.'
      };
    }

    // Check for token
    if (!fs.existsSync(TOKEN_PATH)) {
      return {
        error: 'token_missing',
        message: 'Not authenticated. Run: python export_gdrive_content_to_treelisty.py'
      };
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
    const tokenScopes = token.scopes || (token.scope ? token.scope.split(' ') : []);
    const hasDriveScope = tokenScopes.some(s => s.includes('drive.readonly') || s.includes('drive'));

    if (!hasDriveScope) {
      return {
        error: 'scope_missing',
        message: 'Drive scope not granted. Re-authorize with: python export_gdrive_content_to_treelisty.py',
        needsScopes: ['drive.readonly']
      };
    }

    // Create Drive client
    driveClient = google.drive({ version: 'v3', auth: authClient });
    return driveClient;

  } catch (err) {
    return { error: 'auth_error', message: err.message };
  }
}

// =============================================================================
// Authentication Status
// =============================================================================

/**
 * Check Drive authentication status
 */
async function checkAuthStatus() {
  const result = {
    authenticated: false,
    hasToken: fs.existsSync(TOKEN_PATH),
    hasCredentials: fs.existsSync(CREDENTIALS_PATH),
    hasExtractScript: fs.existsSync(EXTRACT_SCRIPT),
    scopes: [],
    error: null
  };

  if (!result.hasCredentials) {
    result.error = 'Missing credentials.json. Download from Google Cloud Console.';
    return result;
  }

  if (!result.hasToken) {
    result.error = 'Not authenticated. Run: python export_gdrive_content_to_treelisty.py';
    return result;
  }

  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    result.scopes = token.scopes || (token.scope ? token.scope.split(' ') : []);

    const hasDriveScope = result.scopes.some(s => s.includes('drive'));
    if (!hasDriveScope) {
      result.error = 'Token missing drive scope. Re-run authentication.';
      return result;
    }

    // Test the connection
    const client = await getDriveClient();
    if (client.error) {
      result.error = client.message;
      return result;
    }

    // Try a simple API call to verify
    await client.about.get({ fields: 'user' });
    result.authenticated = true;

  } catch (err) {
    result.error = `Auth test failed: ${err.message}`;
  }

  return result;
}

// =============================================================================
// File Operations
// =============================================================================

/**
 * List files in a folder
 */
async function listFiles(folderId = 'root', options = {}) {
  const client = await getDriveClient();
  if (client.error) return client;

  try {
    const query = options.query || `'${folderId}' in parents and trashed=false`;
    const pageSize = options.pageSize || 50;
    const orderBy = options.orderBy || 'folder,name';

    const response = await client.files.list({
      q: query,
      pageSize,
      orderBy,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, parents)',
      pageToken: options.pageToken
    });

    const files = response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      icon: getFileIcon(file.mimeType),
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      size: file.size ? parseInt(file.size) : null,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      parents: file.parents
    }));

    return {
      success: true,
      folderId,
      files,
      nextPageToken: response.data.nextPageToken,
      count: files.length
    };

  } catch (err) {
    return { error: 'list_error', message: err.message };
  }
}

/**
 * Get file metadata
 */
async function getFileInfo(fileId) {
  const client = await getDriveClient();
  if (client.error) return client;

  try {
    const response = await client.files.get({
      fileId,
      fields: 'id, name, mimeType, size, modifiedTime, createdTime, webViewLink, parents, description'
    });

    const file = response.data;
    return {
      success: true,
      file: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        icon: getFileIcon(file.mimeType),
        isFolder: file.mimeType === 'application/vnd.google-apps.folder',
        size: file.size ? parseInt(file.size) : null,
        modifiedTime: file.modifiedTime,
        createdTime: file.createdTime,
        webViewLink: file.webViewLink,
        parents: file.parents,
        description: file.description
      }
    };

  } catch (err) {
    return { error: 'get_error', message: err.message };
  }
}

/**
 * Search files by name or content
 */
async function searchFiles(query, options = {}) {
  const client = await getDriveClient();
  if (client.error) return client;

  try {
    // Build search query
    let driveQuery = `name contains '${query}' and trashed=false`;
    if (options.mimeType) {
      driveQuery += ` and mimeType='${options.mimeType}'`;
    }
    if (options.folderId) {
      driveQuery += ` and '${options.folderId}' in parents`;
    }

    return await listFiles('search', {
      query: driveQuery,
      pageSize: options.limit || 20
    });

  } catch (err) {
    return { error: 'search_error', message: err.message };
  }
}

// =============================================================================
// Content Extraction
// =============================================================================

/**
 * Extract content from a file or folder using the Python script
 */
async function extractContent(folderId = 'root', options = {}) {
  // Check if script exists
  if (!fs.existsSync(EXTRACT_SCRIPT)) {
    return {
      error: 'script_missing',
      message: `Content extraction script not found: ${EXTRACT_SCRIPT}`
    };
  }

  // Check auth first
  const authStatus = await checkAuthStatus();
  if (!authStatus.authenticated) {
    return {
      error: 'not_authenticated',
      message: authStatus.error || 'Drive not authenticated'
    };
  }

  return new Promise((resolve) => {
    const args = [EXTRACT_SCRIPT, folderId];

    if (options.maxDepth) {
      args.push('--max-depth', options.maxDepth.toString());
    }
    if (options.chunkSize) {
      args.push('--chunk-size', options.chunkSize.toString());
    }

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    const proc = spawn('python', args, {
      cwd: TREEPLEXITY_ROOT,
      env: { ...process.env }
    });

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      const duration = Date.now() - startTime;

      if (code !== 0) {
        resolve({
          error: 'extraction_failed',
          message: stderr || 'Extraction script failed',
          exitCode: code,
          duration
        });
        return;
      }

      // Find the output file from stdout
      const outputMatch = stdout.match(/Exported to: ([\w\-\.]+\.json)/);
      const outputFile = outputMatch ? outputMatch[1] : null;

      // Parse stats from stdout
      const statsMatch = stdout.match(/Files processed: (\d+).*Files extracted: (\d+).*Total chunks: (\d+)/s);
      const stats = statsMatch ? {
        filesProcessed: parseInt(statsMatch[1]),
        filesExtracted: parseInt(statsMatch[2]),
        totalChunks: parseInt(statsMatch[3])
      } : null;

      // Read the output file if found
      let tree = null;
      if (outputFile) {
        const outputPath = path.join(TREEPLEXITY_ROOT, outputFile);
        if (fs.existsSync(outputPath)) {
          try {
            tree = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      resolve({
        success: true,
        folderId,
        outputFile,
        stats,
        tree,
        duration,
        message: `Extracted ${stats?.filesExtracted || 0} files with ${stats?.totalChunks || 0} chunks in ${(duration/1000).toFixed(1)}s`
      });
    });

    proc.on('error', (err) => {
      resolve({
        error: 'spawn_error',
        message: `Failed to run extraction: ${err.message}`
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      proc.kill();
      resolve({
        error: 'timeout',
        message: 'Extraction timed out after 5 minutes'
      });
    }, 300000);
  });
}

// =============================================================================
// File Actions
// =============================================================================

/**
 * Open a file in the browser
 */
async function openFile(fileId) {
  const client = await getDriveClient();
  if (client.error) return client;

  try {
    const response = await client.files.get({
      fileId,
      fields: 'webViewLink'
    });

    const url = response.data.webViewLink;
    if (!url) {
      return { error: 'no_url', message: 'File has no web view link' };
    }

    // Use system open command
    const { exec } = require('child_process');
    const command = process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;

    return new Promise((resolve) => {
      exec(command, (err) => {
        if (err) {
          resolve({ error: 'open_error', message: err.message });
        } else {
          resolve({ success: true, fileId, url, message: `Opened in browser: ${url}` });
        }
      });
    });

  } catch (err) {
    return { error: 'get_error', message: err.message };
  }
}

/**
 * Get the download/export link for a file
 */
async function getDownloadLink(fileId) {
  const client = await getDriveClient();
  if (client.error) return client;

  try {
    const response = await client.files.get({
      fileId,
      fields: 'id, name, mimeType, webContentLink, exportLinks'
    });

    const file = response.data;

    // For Google Workspace files, use export links
    if (file.exportLinks) {
      return {
        success: true,
        fileId,
        name: file.name,
        mimeType: file.mimeType,
        exportLinks: file.exportLinks
      };
    }

    // For regular files, use webContentLink
    return {
      success: true,
      fileId,
      name: file.name,
      mimeType: file.mimeType,
      downloadLink: file.webContentLink
    };

  } catch (err) {
    return { error: 'get_error', message: err.message };
  }
}

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  checkAuthStatus,
  listFiles,
  getFileInfo,
  searchFiles,
  extractContent,
  openFile,
  getDownloadLink
};
