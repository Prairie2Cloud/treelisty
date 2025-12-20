#!/usr/bin/env node

/**
 * TreeListy MCP-WebSocket Bridge
 *
 * Translates between MCP stdio (Claude Code) and WebSocket (TreeListy browser).
 *
 * Security features:
 * - Session token required for connection
 * - Origin validation (exact match + localhost any port)
 * - Host header validation (DNS rebinding protection)
 * - Rate limiting (20 connections/min/IP)
 * - Dynamic port selection
 * - Heartbeat mechanism
 *
 * Usage:
 *   npx treelisty-mcp-bridge
 *
 * Claude Code config (~/.claude/settings.json):
 *   {
 *     "mcpServers": {
 *       "treelisty": {
 *         "command": "npx",
 *         "args": ["treelisty-mcp-bridge"]
 *       }
 *     }
 *   }
 */

const { WebSocketServer, WebSocket } = require('ws');
const readline = require('readline');
const crypto = require('crypto');

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Port 0 = OS assigns an available port
  port: parseInt(process.env.TREELISTY_BRIDGE_PORT || '0', 10),

  // Allowed origins for WebSocket connections (exact match)
  allowedOrigins: new Set([
    'https://treelisty.netlify.app',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ]),

  // Allow local files to connect (Origin: null or file://)
  // WARNING: Relies heavily on token for security
  allowLocalFiles: true,

  // Allow any port on localhost (for development)
  allowLocalhostAnyPort: true,

  // Heartbeat interval in milliseconds
  heartbeatInterval: 30000,

  // Connection timeout (3 missed heartbeats)
  connectionTimeout: 90000,

  // Rate limiting: max connections per minute per IP
  rateLimitPerMinute: 20,

  // Enable debug logging
  debug: process.env.TREELISTY_DEBUG === 'true'
};

// =============================================================================
// Logging
// =============================================================================

function log(level, message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  };

  // Log to stderr so it doesn't interfere with MCP stdout
  console.error(JSON.stringify(entry));
}

function debug(message, data = {}) {
  if (CONFIG.debug) {
    log('debug', message, data);
  }
}

function info(message, data = {}) {
  log('info', message, data);
}

function error(message, data = {}) {
  log('error', message, data);
}

// =============================================================================
// MCP Protocol State
// =============================================================================

let mcpInitialized = false;

// =============================================================================
// MCP Tool Definitions (per OpenAI protocol review)
// =============================================================================

const TOOLS = [
  {
    name: 'get_tree',
    description: 'Get the full tree structure from TreeListy',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        format: { type: 'string', enum: ['native', 'agent'], description: 'Tree format (default: agent)' }
      },
      required: []
    }
  },
  {
    name: 'get_tree_metadata',
    description: 'Get tree metadata including hash, node count, and last modified time',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' }
      },
      required: []
    }
  },
  {
    name: 'get_subtree',
    description: 'Get a node and all its descendants',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        nodeId: { type: 'string', description: 'ID of the node to get subtree from' },
        format: { type: 'string', enum: ['native', 'agent'], description: 'Tree format (default: agent)' }
      },
      required: ['nodeId']
    }
  },
  {
    name: 'get_node',
    description: 'Get a single node by ID',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        nodeId: { type: 'string', description: 'ID of the node to retrieve' }
      },
      required: ['nodeId']
    }
  },
  {
    name: 'create_node',
    description: 'Create a new node in the tree',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        parentId: { type: 'string', description: 'ID of the parent node' },
        node: {
          type: 'object',
          description: 'Node data (name, description, type, etc.)',
          properties: {
            name: { type: 'string', description: 'Node name/title' },
            description: { type: 'string', description: 'Node description' },
            type: { type: 'string', enum: ['phase', 'item', 'subtask'], description: 'Node type' }
          },
          required: ['name']
        },
        position: { type: 'number', description: 'Insert position (default: end)' }
      },
      required: ['parentId', 'node']
    }
  },
  {
    name: 'update_node',
    description: 'Update an existing node',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        nodeId: { type: 'string', description: 'ID of the node to update' },
        updates: {
          type: 'object',
          description: 'Fields to update (name, description, status, etc.)'
        }
      },
      required: ['nodeId', 'updates']
    }
  },
  {
    name: 'delete_node',
    description: 'Delete a node and its descendants',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        nodeId: { type: 'string', description: 'ID of the node to delete' }
      },
      required: ['nodeId']
    }
  },
  {
    name: 'search_nodes',
    description: 'Search nodes by content, type, or pattern fields',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        query: { type: 'string', description: 'Search query' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields to search (default: name, description)'
        },
        type: { type: 'string', description: 'Filter by node type' }
      },
      required: ['query']
    }
  },
  {
    name: 'import_structured_content',
    description: 'Import structured content as a subtree',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        parentId: { type: 'string', description: 'ID of parent node for import' },
        content: {
          type: 'object',
          description: 'Structured content with children array'
        },
        source: { type: 'string', description: 'Source identifier (e.g., "web-research", "gmail")' }
      },
      required: ['parentId', 'content']
    }
  },
  {
    name: 'begin_transaction',
    description: 'Begin a batch transaction (groups multiple operations into single undo state)',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' }
      },
      required: []
    }
  },
  {
    name: 'commit_transaction',
    description: 'Commit the current transaction',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        transactionId: { type: 'string', description: 'Transaction ID from begin_transaction' }
      },
      required: ['transactionId']
    }
  },
  {
    name: 'rollback_transaction',
    description: 'Rollback the current transaction, discarding all changes',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        transactionId: { type: 'string', description: 'Transaction ID from begin_transaction' }
      },
      required: ['transactionId']
    }
  },
  {
    name: 'get_pattern_schema',
    description: 'Get the field schema for a specific pattern',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        pattern: { type: 'string', description: 'Pattern key (e.g., "generic", "thesis", "roadmap")' }
      },
      required: ['pattern']
    }
  },
  {
    name: 'get_activity_log',
    description: 'Get recent agent activity log',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'string', description: 'Target tab ID (optional if single tab)' },
        limit: { type: 'number', description: 'Maximum entries to return (default: 50)' },
        since: { type: 'string', description: 'ISO timestamp to filter entries after' }
      },
      required: []
    }
  }
];

// =============================================================================
// Session Management
// =============================================================================

const SESSION_TOKEN = crypto.randomUUID();

// Track connected clients by tabId
const connections = new Map();

// Track pending requests waiting for responses
const pendingRequests = new Map();

// =============================================================================
// WebSocket Server
// =============================================================================

const wss = new WebSocketServer({ port: CONFIG.port });

const actualPort = wss.address()?.port || CONFIG.port;

// Output connection info for TreeListy to discover
// This is the primary output - TreeListy will parse this
console.error(JSON.stringify({
  type: 'bridge_ready',
  port: actualPort,
  token: SESSION_TOKEN,
  version: '0.1.0'
}));

info('Bridge started', { port: actualPort });

// =============================================================================
// Origin Validation (Hardened per Gemini security audit)
// =============================================================================

function isOriginAllowed(origin) {
  // Handle "null" origin (common for local files, also sandboxed iframes)
  if (origin === 'null' || !origin) {
    // Local files rely heavily on token for security
    return CONFIG.allowLocalFiles;
  }

  // Exact match against allowlist
  if (CONFIG.allowedOrigins.has(origin)) {
    return true;
  }

  // Robust check for localhost with any port (development mode)
  if (CONFIG.allowLocalhostAnyPort) {
    try {
      const originUrl = new URL(origin);
      if (['localhost', '127.0.0.1'].includes(originUrl.hostname)) {
        return true;
      }
    } catch (e) {
      // Invalid URL, reject
      return false;
    }
  }

  return false;
}

// =============================================================================
// Host Header Validation (DNS Rebinding Protection)
// =============================================================================

function isHostValid(host, expectedPort) {
  if (!host) return false;

  const validHosts = [
    `localhost:${expectedPort}`,
    `127.0.0.1:${expectedPort}`,
    `[::1]:${expectedPort}`  // IPv6 localhost
  ];

  return validHosts.includes(host);
}

// =============================================================================
// Rate Limiting
// =============================================================================

const connectionAttempts = new Map(); // IP -> { count, timestamp }

function isRateLimited(ip) {
  const now = Date.now();
  let record = connectionAttempts.get(ip);

  if (!record || now - record.timestamp > 60000) {
    // Reset if > 1 minute passed
    record = { count: 0, timestamp: now };
  }

  record.count++;
  record.timestamp = now;
  connectionAttempts.set(ip, record);

  if (record.count > CONFIG.rateLimitPerMinute) {
    error('Rate limit exceeded', { ip, count: record.count });
    return true;
  }

  return false;
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of connectionAttempts) {
    if (now - record.timestamp > 300000) {
      connectionAttempts.delete(ip);
    }
  }
}, 300000);

// =============================================================================
// Heartbeat Management
// =============================================================================

function setupHeartbeat(ws, tabId) {
  ws.isAlive = true;
  ws.lastPong = Date.now();

  ws.on('pong', () => {
    ws.isAlive = true;
    ws.lastPong = Date.now();
    debug('Pong received', { tabId });
  });
}

// Heartbeat interval - ping all connections
const heartbeatTimer = setInterval(() => {
  for (const [tabId, ws] of connections) {
    if (!ws.isAlive || Date.now() - ws.lastPong > CONFIG.connectionTimeout) {
      info('Connection stale, terminating', { tabId });
      ws.terminate();
      connections.delete(tabId);
      continue;
    }

    ws.isAlive = false;
    ws.ping();
    debug('Ping sent', { tabId });
  }
}, CONFIG.heartbeatInterval);

// =============================================================================
// WebSocket Connection Handler
// =============================================================================

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress || 'unknown';
  const origin = req.headers.origin;
  const host = req.headers.host;
  const url = new URL(req.url, `http://localhost:${actualPort}`);
  const token = url.searchParams.get('token');
  const tabId = url.searchParams.get('tabId') || crypto.randomUUID();

  // Security: Rate limiting
  if (isRateLimited(ip)) {
    error('Connection rejected: rate limited', { ip });
    ws.close(4004, 'Rate limited');
    return;
  }

  // Security: Host header validation (DNS rebinding protection)
  if (!isHostValid(host, actualPort)) {
    error('Connection rejected: invalid host header', { host });
    ws.close(4003, 'Invalid host');
    return;
  }

  // Security: Validate origin
  if (!isOriginAllowed(origin)) {
    error('Connection rejected: invalid origin', { origin });
    ws.close(4001, 'Invalid origin');
    return;
  }

  // Security: Validate token
  if (token !== SESSION_TOKEN) {
    error('Connection rejected: invalid token', { providedToken: token?.slice(0, 8) + '...' });
    ws.close(4002, 'Invalid token');
    return;
  }

  // Check for existing connection with same tabId
  if (connections.has(tabId)) {
    const existing = connections.get(tabId);
    if (existing.readyState === WebSocket.OPEN) {
      info('Replacing existing connection', { tabId });
      existing.close(4003, 'Replaced by new connection');
    }
  }

  connections.set(tabId, ws);
  setupHeartbeat(ws, tabId);

  info('Client connected', { tabId, origin, totalConnections: connections.size });

  // Handle messages from TreeListy
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      debug('Received from TreeListy', { tabId, messageId: message.id });

      // If this is a response to a pending request, resolve it
      if (message.id && pendingRequests.has(message.id)) {
        const { resolve } = pendingRequests.get(message.id);
        pendingRequests.delete(message.id);
        resolve(message);
      }

      // Forward to Claude Code via stdout (MCP response)
      process.stdout.write(JSON.stringify(message) + '\n');

    } catch (err) {
      error('Failed to parse message from TreeListy', { error: err.message });
    }
  });

  ws.on('close', (code, reason) => {
    connections.delete(tabId);
    info('Client disconnected', { tabId, code, reason: reason.toString(), totalConnections: connections.size });
  });

  ws.on('error', (err) => {
    error('WebSocket error', { tabId, error: err.message });
  });
});

// =============================================================================
// MCP Response Helpers
// =============================================================================

function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id,
    result
  };
  process.stdout.write(JSON.stringify(response) + '\n');
}

function sendErrorResponse(id, code, message) {
  if (id) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: { code, message }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

function sendToolResult(id, content, isError = false) {
  const response = {
    jsonrpc: '2.0',
    id,
    result: {
      content: Array.isArray(content) ? content : [{ type: 'text', text: String(content) }],
      isError
    }
  };
  process.stdout.write(JSON.stringify(response) + '\n');
}

// =============================================================================
// MCP Message Handler (from Claude Code via stdin)
// =============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (!line.trim()) return;

  try {
    const message = JSON.parse(line);
    debug('Received from Claude Code', { method: message.method, id: message.id });

    // Handle MCP protocol messages
    if (handleMCPMessage(message)) {
      return; // Message was handled by MCP handler
    }

    // Forward to TreeListy via WebSocket
    forwardToTreeListy(message, line);

  } catch (err) {
    error('Failed to parse message from Claude Code', { error: err.message, line: line.slice(0, 100) });
  }
});

rl.on('close', () => {
  info('stdin closed, shutting down');
  cleanup();
});

// =============================================================================
// MCP Protocol Handler
// =============================================================================

function handleMCPMessage(message) {
  const { method, id, params } = message;

  // Notifications have no id - handle without response
  if (!id) {
    handleNotification(method, params);
    return true;
  }

  switch (method) {
    case 'initialize':
      handleInitialize(id, params);
      return true;

    case 'tools/list':
      handleToolsList(id);
      return true;

    case 'tools/call':
      // This will be forwarded to TreeListy, not handled here
      // But we validate initialization first
      if (!mcpInitialized) {
        sendErrorResponse(id, -32002, 'Server not initialized. Send initialize first.');
        return true;
      }
      return false; // Let it forward to TreeListy

    case 'resources/list':
      // We don't expose resources currently
      sendResponse(id, { resources: [] });
      return true;

    case 'prompts/list':
      // We don't expose prompts currently
      sendResponse(id, { prompts: [] });
      return true;

    default:
      // Unknown method - return error per JSON-RPC spec
      sendErrorResponse(id, -32601, `Method not found: ${method}`);
      return true;
  }
}

function handleNotification(method, params) {
  switch (method) {
    case 'notifications/initialized':
      // Client confirms initialization complete
      debug('Client confirmed initialization');
      break;

    case 'notifications/cancelled':
      // Request was cancelled
      const requestId = params?.requestId;
      if (requestId && pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        debug('Request cancelled', { requestId });
      }
      break;

    default:
      debug('Unknown notification', { method });
  }
}

function handleInitialize(id, params) {
  debug('Handling initialize', { clientInfo: params?.clientInfo });

  const response = {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: 'treelisty-mcp-bridge',
      version: '0.1.0'
    },
    capabilities: {
      tools: {
        listChanged: false // We don't dynamically change tool list
      },
      resources: {
        subscribe: false,
        listChanged: false
      }
    }
  };

  sendResponse(id, response);
  mcpInitialized = true;
  debug('Sent initialize response, server now initialized');
}

function handleToolsList(id) {
  if (!mcpInitialized) {
    sendErrorResponse(id, -32002, 'Server not initialized. Send initialize first.');
    return;
  }

  sendResponse(id, { tools: TOOLS });
  debug('Sent tools list', { toolCount: TOOLS.length });
}

// =============================================================================
// Forward to TreeListy
// =============================================================================

function forwardToTreeListy(message, rawLine) {
  const targetTabId = message.params?.tabId;

  if (targetTabId && connections.has(targetTabId)) {
    // Send to specific tab
    const ws = connections.get(targetTabId);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(rawLine);
      debug('Forwarded to specific tab', { tabId: targetTabId });
    } else {
      error('Target connection not open', { tabId: targetTabId });
      if (message.id) {
        sendToolResult(message.id, 'Target connection not available', true);
      }
    }
  } else if (connections.size === 1) {
    // Single connection - send to it
    const [tabId, ws] = connections.entries().next().value;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(rawLine);
      debug('Forwarded to single connection', { tabId });
    }
  } else if (connections.size === 0) {
    // No connections
    error('No TreeListy connections available');
    if (message.id) {
      sendToolResult(message.id, 'No TreeListy browser tabs connected. Open TreeListy and connect to the bridge.', true);
    }
  } else {
    // Multiple connections, no specific target
    error('Multiple connections, tabId required', { connectionCount: connections.size });
    if (message.id) {
      sendToolResult(message.id, `Multiple TreeListy tabs open (${connections.size}). Specify tabId parameter.`, true);
    }
  }
}

// =============================================================================
// Cleanup
// =============================================================================

function cleanup() {
  clearInterval(heartbeatTimer);

  for (const [tabId, ws] of connections) {
    ws.close(1001, 'Bridge shutting down');
  }
  connections.clear();

  wss.close(() => {
    info('Bridge shut down');
    process.exit(0);
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
