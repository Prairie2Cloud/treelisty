#!/usr/bin/env node

/**
 * TreeListy MCP Bridge
 *
 * Bridges Claude Code (MCP via stdio) to TreeListy (WebSocket in browser).
 *
 * Architecture:
 *   Claude Code <-- stdio --> Bridge <-- WebSocket --> TreeListy Browser
 *
 * Security:
 *   - Session token required for WebSocket connection
 *   - Origin validation against allowlist
 *   - Dynamic port allocation (OS-assigned)
 *   - Heartbeat with stale connection detection
 *
 * Copyright 2024-2025 Prairie2Cloud LLC
 * Licensed under Apache-2.0
 */

const WebSocket = require('ws');
const readline = require('readline');
const crypto = require('crypto');

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Origins allowed to connect via WebSocket
  allowedOrigins: [
    'https://treelisty.netlify.app',
    'http://localhost',
    'http://127.0.0.1'
  ],
  // Allow connections without origin header in debug mode
  debug: process.env.TREELISTY_DEBUG === '1',
  // Heartbeat interval (ms)
  heartbeatInterval: 30000,
  // Connection considered stale after this many ms without pong
  staleTimeout: 90000,
  // MCP protocol version
  mcpProtocolVersion: '2024-11-05'
};

// =============================================================================
// Security: Session Token
// =============================================================================

const SESSION_TOKEN = crypto.randomUUID();

// =============================================================================
// Connection State
// =============================================================================

// Map of tabId -> WebSocket connection (supports multiple TreeListy tabs)
const connections = new Map();

// Track last pong time per connection
const lastPongTimes = new Map();

// Pending requests waiting for browser response
const pendingRequests = new Map();

// =============================================================================
// WebSocket Server
// =============================================================================

// Dynamic port: 0 means OS assigns an available port
const wss = new WebSocket.Server({ port: 0 });
const actualPort = wss.address().port;

/**
 * Validate origin against allowlist
 */
function isOriginAllowed(origin) {
  if (!origin) {
    return CONFIG.debug; // Allow no-origin only in debug mode
  }
  return CONFIG.allowedOrigins.some(allowed =>
    origin === allowed ||
    origin.startsWith(allowed + '/') ||
    origin.startsWith(allowed + ':')
  );
}

/**
 * Extract token from WebSocket request URL
 */
function extractToken(req) {
  try {
    const url = new URL(req.url, `http://localhost:${actualPort}`);
    return url.searchParams.get('token');
  } catch {
    return null;
  }
}

/**
 * Extract tabId from WebSocket request URL
 */
function extractTabId(req) {
  try {
    const url = new URL(req.url, `http://localhost:${actualPort}`);
    return url.searchParams.get('tabId') || 'default';
  } catch {
    return 'default';
  }
}

// Handle new WebSocket connections
wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  const token = extractToken(req);
  const tabId = extractTabId(req);

  // Security: Validate origin
  if (!isOriginAllowed(origin)) {
    log('error', `Connection rejected: invalid origin "${origin}"`);
    ws.close(4001, 'Invalid origin');
    return;
  }

  // Security: Validate token
  if (token !== SESSION_TOKEN) {
    log('error', `Connection rejected: invalid token`);
    ws.close(4002, 'Invalid token');
    return;
  }

  // Store connection
  connections.set(tabId, ws);
  lastPongTimes.set(tabId, Date.now());
  log('info', `Browser connected (tabId: ${tabId})`);

  // Handle pong responses for heartbeat
  ws.on('pong', () => {
    lastPongTimes.set(tabId, Date.now());
  });

  // Handle incoming messages from browser
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleBrowserMessage(tabId, message);
    } catch (err) {
      log('error', `Failed to parse browser message: ${err.message}`);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    connections.delete(tabId);
    lastPongTimes.delete(tabId);
    log('info', `Browser disconnected (tabId: ${tabId})`);
  });

  // Handle errors
  ws.on('error', (err) => {
    log('error', `WebSocket error (tabId: ${tabId}): ${err.message}`);
  });
});

// =============================================================================
// Heartbeat: Detect stale connections
// =============================================================================

setInterval(() => {
  const now = Date.now();

  for (const [tabId, ws] of connections) {
    const lastPong = lastPongTimes.get(tabId) || 0;

    if (now - lastPong > CONFIG.staleTimeout) {
      log('warn', `Connection stale, closing (tabId: ${tabId})`);
      ws.terminate();
      connections.delete(tabId);
      lastPongTimes.delete(tabId);
    } else if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }
}, CONFIG.heartbeatInterval);

// =============================================================================
// MCP Protocol: stdio communication with Claude Code
// =============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

// Track if we've completed MCP initialization
let mcpInitialized = false;

/**
 * Handle incoming MCP messages from Claude Code (via stdin)
 */
rl.on('line', (line) => {
  try {
    const message = JSON.parse(line);
    handleMCPMessage(message);
  } catch (err) {
    log('error', `Failed to parse MCP message: ${err.message}`);
    sendMCPError(null, -32700, 'Parse error');
  }
});

/**
 * Process MCP message from Claude Code
 */
function handleMCPMessage(message) {
  const { method, id, params } = message;

  // Handle MCP initialization
  if (method === 'initialize') {
    handleMCPInitialize(message);
    return;
  }

  // Handle initialized notification
  if (method === 'initialized') {
    mcpInitialized = true;
    log('info', 'MCP initialization complete');
    return;
  }

  // Handle tool calls
  if (method === 'tools/call') {
    handleToolCall(id, params);
    return;
  }

  // Handle tool list request
  if (method === 'tools/list') {
    handleToolsList(id);
    return;
  }

  // Handle resource list request
  if (method === 'resources/list') {
    handleResourcesList(id);
    return;
  }

  // Unknown method
  sendMCPError(id, -32601, `Method not found: ${method}`);
}

/**
 * Handle MCP initialize request
 */
function handleMCPInitialize(message) {
  const response = {
    jsonrpc: '2.0',
    id: message.id,
    result: {
      protocolVersion: CONFIG.mcpProtocolVersion,
      serverInfo: {
        name: 'treelisty-mcp-bridge',
        version: '0.1.0'
      },
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  };
  sendMCPResponse(response);
}

/**
 * Handle tools/list request
 */
function handleToolsList(id) {
  const tools = [
    {
      name: 'get_tree',
      description: 'Get the current tree structure from TreeListy',
      inputSchema: {
        type: 'object',
        properties: {
          tree_id: { type: 'string', description: 'Optional tree ID' }
        }
      }
    },
    {
      name: 'get_tree_metadata',
      description: 'Get lightweight tree info (node count, hash, last modified)',
      inputSchema: {
        type: 'object',
        properties: {
          tree_id: { type: 'string', description: 'Optional tree ID' }
        }
      }
    },
    {
      name: 'get_node',
      description: 'Get a specific node by ID',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'Node ID to retrieve' }
        },
        required: ['node_id']
      }
    },
    {
      name: 'get_subtree',
      description: 'Get a node and its descendants to specified depth',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'Root node ID' },
          depth: { type: 'number', description: 'Max depth to traverse (default: unlimited)' }
        },
        required: ['node_id']
      }
    },
    {
      name: 'create_node',
      description: 'Create a new node in the tree',
      inputSchema: {
        type: 'object',
        properties: {
          parent_id: { type: 'string', description: 'Parent node ID' },
          node_data: { type: 'object', description: 'Node data (name, description, etc.)' },
          pattern: { type: 'string', description: 'Optional pattern key' }
        },
        required: ['parent_id', 'node_data']
      }
    },
    {
      name: 'update_node',
      description: 'Update an existing node',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'Node ID to update' },
          updates: { type: 'object', description: 'Fields to update' }
        },
        required: ['node_id', 'updates']
      }
    },
    {
      name: 'delete_node',
      description: 'Delete a node from the tree',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'Node ID to delete' }
        },
        required: ['node_id']
      }
    },
    {
      name: 'search_nodes',
      description: 'Search for nodes by content or pattern',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          pattern: { type: 'string', description: 'Optional pattern filter' }
        },
        required: ['query']
      }
    },
    {
      name: 'begin_transaction',
      description: 'Begin a batched transaction (single undo checkpoint)',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'commit_transaction',
      description: 'Commit the current transaction',
      inputSchema: {
        type: 'object',
        properties: {
          transaction_id: { type: 'string', description: 'Transaction ID' }
        },
        required: ['transaction_id']
      }
    },
    {
      name: 'rollback_transaction',
      description: 'Rollback the current transaction',
      inputSchema: {
        type: 'object',
        properties: {
          transaction_id: { type: 'string', description: 'Transaction ID' }
        },
        required: ['transaction_id']
      }
    },
    {
      name: 'import_structured_content',
      description: 'Import structured research content as a subtree',
      inputSchema: {
        type: 'object',
        properties: {
          parent_id: { type: 'string', description: 'Parent node ID' },
          content: { type: 'object', description: 'Structured content to import' },
          pattern: { type: 'string', description: 'Pattern key for the content' }
        },
        required: ['parent_id', 'content']
      }
    },
    {
      name: 'get_pattern_schema',
      description: 'Get the schema for a pattern',
      inputSchema: {
        type: 'object',
        properties: {
          pattern_key: { type: 'string', description: 'Pattern key' }
        },
        required: ['pattern_key']
      }
    },
    {
      name: 'retrieve_context',
      description: 'Search TreeListy nodes for relevant content. Returns matching nodes with their hierarchical context. Use this to find information in knowledge bases.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (keywords or phrase)' },
          max_results: { type: 'number', description: 'Maximum results to return (default: 10)' },
          include_context: { type: 'boolean', description: 'Include parent hierarchy for context (default: true)' },
          pattern_filter: { type: 'string', description: 'Only search nodes with this pattern (e.g., "knowledge-base")' },
          source_filter: { type: 'string', description: 'Only search nodes from this source (e.g., filename or URL)' }
        },
        required: ['query']
      }
    }
  ];

  sendMCPResponse({
    jsonrpc: '2.0',
    id: id,
    result: { tools }
  });
}

/**
 * Handle resources/list request
 */
function handleResourcesList(id) {
  const resources = [
    {
      uri: 'treelisty://tree',
      name: 'Current Tree',
      description: 'The current tree structure',
      mimeType: 'application/json'
    },
    {
      uri: 'treelisty://patterns',
      name: 'Available Patterns',
      description: 'List of available patterns',
      mimeType: 'application/json'
    }
  ];

  sendMCPResponse({
    jsonrpc: '2.0',
    id: id,
    result: { resources }
  });
}

/**
 * Handle tool call by forwarding to browser
 */
function handleToolCall(id, params) {
  const { name, arguments: args } = params;
  const tabId = args?.tabId || 'default';
  const ws = connections.get(tabId) || connections.values().next().value;

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    sendMCPError(id, -32000, 'No browser connected');
    return;
  }

  // Store pending request
  pendingRequests.set(id, { timestamp: Date.now() });

  // Forward to browser
  const browserRequest = {
    jsonrpc: '2.0',
    id: id,
    method: name,
    params: args
  };

  ws.send(JSON.stringify(browserRequest));
}

/**
 * Handle response from browser
 */
function handleBrowserMessage(tabId, message) {
  const { id, result, error } = message;

  if (id && pendingRequests.has(id)) {
    pendingRequests.delete(id);

    if (error) {
      sendMCPError(id, error.code || -32000, error.message);
    } else {
      sendMCPResponse({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      });
    }
  }
}

// =============================================================================
// MCP Response Helpers
// =============================================================================

/**
 * Send MCP response to Claude Code via stdout
 */
function sendMCPResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

/**
 * Send MCP error response
 */
function sendMCPError(id, code, message) {
  const response = {
    jsonrpc: '2.0',
    id: id,
    error: { code, message }
  };
  sendMCPResponse(response);
}

// =============================================================================
// Logging (to stderr so it doesn't interfere with MCP stdout)
// =============================================================================

function log(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({ timestamp, level, message });
  process.stderr.write(logEntry + '\n');
}

// =============================================================================
// Startup
// =============================================================================

// Output bridge ready info (to stderr for Claude Code to parse)
const bridgeInfo = {
  type: 'bridge_ready',
  port: actualPort,
  token: SESSION_TOKEN,
  version: '0.1.0'
};
process.stderr.write(JSON.stringify(bridgeInfo) + '\n');

log('info', `TreeListy MCP Bridge started on port ${actualPort}`);

// Handle process termination
process.on('SIGINT', () => {
  log('info', 'Shutting down...');
  wss.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Shutting down...');
  wss.close();
  process.exit(0);
});
