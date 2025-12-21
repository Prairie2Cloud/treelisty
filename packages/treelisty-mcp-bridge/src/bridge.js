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
const { exec } = require('child_process');
const path = require('path');

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
// Security: Session Token & Port
// =============================================================================

// Use env vars for persistent config, with sensible defaults for local use
const SESSION_TOKEN = process.env.TREELISTY_MCP_TOKEN || 'treelisty-local';
const FIXED_PORT = parseInt(process.env.TREELISTY_MCP_PORT, 10) || 3456;

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
// Task Queue (Build 522 - Agent Dispatch Protocol)
// =============================================================================

// Task queue for agent dispatch (browser submits, Claude Code claims)
const taskQueue = [];

// Active tasks being processed
const activeTasks = new Map();

// Task results waiting for browser to fetch
const taskResults = new Map();

/**
 * Generate unique task ID
 */
function generateTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Submit a task to the queue (called from browser via WebSocket)
 */
function submitTask(task) {
  const taskId = generateTaskId();
  const fullTask = {
    taskId,
    status: 'pending',
    createdAt: Date.now(),
    ...task
  };
  taskQueue.push(fullTask);
  log('info', `Task submitted: ${taskId} (${task.agentId || 'unknown agent'})`);

  // Notify browser that task was queued
  broadcastToBrowser({
    type: 'task_queued',
    taskId,
    position: taskQueue.length
  });

  return { taskId, status: 'queued', position: taskQueue.length };
}

/**
 * Claim next task matching capabilities
 */
function claimNextTask(capabilities = []) {
  // Find first pending task that matches capabilities
  const taskIndex = taskQueue.findIndex(t => {
    if (t.status !== 'pending') return false;
    // If task requires specific capabilities, check them
    if (t.requestedCapabilities && t.requestedCapabilities.length > 0) {
      return t.requestedCapabilities.every(cap => capabilities.includes(cap));
    }
    return true; // No specific requirements
  });

  if (taskIndex === -1) {
    return null; // No matching tasks
  }

  const task = taskQueue.splice(taskIndex, 1)[0];
  task.status = 'in_progress';
  task.claimedAt = Date.now();
  activeTasks.set(task.taskId, task);

  log('info', `Task claimed: ${task.taskId}`);

  // Notify browser
  broadcastToBrowser({
    type: 'task_claimed',
    taskId: task.taskId
  });

  return task;
}

/**
 * Report progress on a task
 */
function reportTaskProgress(taskId, message, percent) {
  const task = activeTasks.get(taskId);
  if (!task) {
    return { error: 'Task not found or not active' };
  }

  task.lastProgress = { message, percent, timestamp: Date.now() };

  // Forward progress to browser
  broadcastToBrowser({
    type: 'task_progress',
    taskId,
    message,
    percent
  });

  return { success: true };
}

/**
 * Complete a task with proposed operations
 */
function completeTask(taskId, proposedOps, summary, sources = []) {
  const task = activeTasks.get(taskId);
  if (!task) {
    return { error: 'Task not found or not active' };
  }

  task.status = 'completed';
  task.completedAt = Date.now();
  task.result = {
    proposed_ops: proposedOps,
    summary,
    sources,
    rationale: summary
  };

  activeTasks.delete(taskId);
  taskResults.set(taskId, task);

  log('info', `Task completed: ${taskId} (${proposedOps.length} ops)`);

  // Send result to browser for Inbox
  broadcastToBrowser({
    type: 'task_completed',
    taskId,
    result: task.result
  });

  return { success: true, opsCount: proposedOps.length };
}

/**
 * Broadcast message to all connected browsers
 */
function broadcastToBrowser(message) {
  const data = JSON.stringify(message);
  for (const [tabId, ws] of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// =============================================================================
// WebSocket Server
// =============================================================================

// Use fixed port for consistent connection (configurable via env var)
const wss = new WebSocket.Server({ port: FIXED_PORT });
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
    },
    // ═══════════════════════════════════════════════════════════════
    // Structure Operations (Build 520)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'move_node',
      description: 'Move a node to a new parent (reparent). The node and all its children are moved.',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'ID of node to move' },
          new_parent_id: { type: 'string', description: 'ID of new parent node' },
          position: { type: 'number', description: 'Position among siblings (0 = first, omit for end)' }
        },
        required: ['node_id', 'new_parent_id']
      }
    },
    {
      name: 'reorder_node',
      description: 'Change a node\'s position among its siblings without changing parent.',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'ID of node to reorder' },
          position: { type: 'number', description: 'New position (0 = first)' }
        },
        required: ['node_id', 'position']
      }
    },
    {
      name: 'duplicate_node',
      description: 'Create a deep copy of a node and its descendants with new IDs.',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'ID of node to duplicate' },
          new_parent_id: { type: 'string', description: 'Parent for the copy (omit to use same parent)' },
          include_children: { type: 'boolean', description: 'Include children in copy (default: true)' }
        },
        required: ['node_id']
      }
    },
    {
      name: 'bulk_update',
      description: 'Update multiple nodes in a single operation.',
      inputSchema: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            description: 'Array of {node_id, updates} objects',
            items: {
              type: 'object',
              properties: {
                node_id: { type: 'string' },
                updates: { type: 'object' }
              },
              required: ['node_id', 'updates']
            }
          }
        },
        required: ['updates']
      }
    },
    {
      name: 'bulk_create',
      description: 'Create multiple nodes in a single operation.',
      inputSchema: {
        type: 'object',
        properties: {
          parent_id: { type: 'string', description: 'Parent for all new nodes' },
          nodes: {
            type: 'array',
            description: 'Array of node data objects',
            items: { type: 'object' }
          }
        },
        required: ['parent_id', 'nodes']
      }
    },
    {
      name: 'bulk_delete',
      description: 'Delete multiple nodes in a single operation.',
      inputSchema: {
        type: 'object',
        properties: {
          node_ids: {
            type: 'array',
            description: 'Array of node IDs to delete',
            items: { type: 'string' }
          }
        },
        required: ['node_ids']
      }
    },
    // ═══════════════════════════════════════════════════════════════
    // UI Control Operations (Build 520)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'select_node',
      description: 'Select and focus a node in the UI. Also scrolls to make it visible.',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'ID of node to select' }
        },
        required: ['node_id']
      }
    },
    {
      name: 'get_selected_node',
      description: 'Get the currently selected node.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'expand_node',
      description: 'Expand a node to show its children in tree view.',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'ID of node to expand' },
          recursive: { type: 'boolean', description: 'Expand all descendants (default: false)' }
        },
        required: ['node_id']
      }
    },
    {
      name: 'collapse_node',
      description: 'Collapse a node to hide its children in tree view.',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'ID of node to collapse' },
          recursive: { type: 'boolean', description: 'Collapse all descendants (default: false)' }
        },
        required: ['node_id']
      }
    },
    {
      name: 'set_view',
      description: 'Switch the active view mode.',
      inputSchema: {
        type: 'object',
        properties: {
          view: {
            type: 'string',
            description: 'View to switch to',
            enum: ['tree', 'canvas', '3d', 'gantt', 'calendar']
          }
        },
        required: ['view']
      }
    },
    {
      name: 'get_view',
      description: 'Get the current view mode.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'scroll_to_node',
      description: 'Scroll the view to make a node visible (works in tree and canvas views).',
      inputSchema: {
        type: 'object',
        properties: {
          node_id: { type: 'string', description: 'ID of node to scroll to' }
        },
        required: ['node_id']
      }
    },
    {
      name: 'undo',
      description: 'Undo the last operation.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'redo',
      description: 'Redo the last undone operation.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_undo_stack_info',
      description: 'Get information about undo/redo stack state.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    // ═══════════════════════════════════════════════════════════════
    // Task Queue Operations (Build 522 - Agent Dispatch Protocol)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'tasks_claimNext',
      description: 'Claim the next pending task from the queue. Call this to get work dispatched from TreeListy UI. Returns null if no tasks available.',
      inputSchema: {
        type: 'object',
        properties: {
          capabilities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Capabilities you can provide (e.g., ["webSearch", "fileRead", "treeWrite"])'
          }
        }
      }
    },
    {
      name: 'tasks_progress',
      description: 'Report progress on a task you are working on. Call this periodically to update the UI.',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'ID of the task' },
          message: { type: 'string', description: 'Progress message to display' },
          percent: { type: 'number', description: 'Progress percentage (0-100)' }
        },
        required: ['taskId', 'message']
      }
    },
    {
      name: 'tasks_complete',
      description: 'Complete a task with proposed operations. IMPORTANT: Never write directly to the tree. Return proposed_ops that the user will approve in the Inbox.',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'ID of the task' },
          proposed_ops: {
            type: 'array',
            description: 'Array of proposed operations (create_node, update_node, delete_node, etc.)',
            items: {
              type: 'object',
              properties: {
                op: { type: 'string', enum: ['create_node', 'update_node', 'delete_node', 'move_node', 'set_field'] },
                nodeId: { type: 'string' },
                parentId: { type: 'string' },
                data: { type: 'object' },
                field: { type: 'string' },
                value: {}
              },
              required: ['op']
            }
          },
          summary: { type: 'string', description: 'Summary of what was accomplished' },
          sources: {
            type: 'array',
            items: { type: 'string' },
            description: 'URLs or references used'
          }
        },
        required: ['taskId', 'proposed_ops', 'summary']
      }
    },
    {
      name: 'tasks_getQueue',
      description: 'Get current task queue status (pending, active, completed counts).',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    // ═══════════════════════════════════════════════════════════════
    // Local File Operations (Build 534)
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'open_local_file',
      description: 'Open a local file or folder with the system default application. Works on Windows (start), Mac (open), and Linux (xdg-open).',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Absolute path to the file or folder to open' }
        },
        required: ['file_path']
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
 * Handle tool call - task tools handled locally, others forwarded to browser
 */
function handleToolCall(id, params) {
  const { name, arguments: args } = params;

  // Handle task queue tools locally (not forwarded to browser)
  if (name.startsWith('tasks_')) {
    handleTaskTool(id, name, args || {});
    return;
  }

  // Handle local file operations (Build 534)
  if (name === 'open_local_file') {
    handleOpenLocalFile(id, args || {});
    return;
  }

  // Forward other tools to browser
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
 * Handle open_local_file tool (Build 534)
 * Opens a file or folder with the system default application
 */
function handleOpenLocalFile(id, args) {
  const filePath = args.file_path;

  if (!filePath) {
    sendMCPError(id, -32602, 'Missing required parameter: file_path');
    return;
  }

  // Determine the platform-specific command
  const platform = process.platform;
  let command;

  if (platform === 'win32') {
    // Windows: use start command with empty title
    // Use double quotes and escape properly
    command = `start "" "${filePath}"`;
  } else if (platform === 'darwin') {
    // macOS: use open command
    command = `open "${filePath}"`;
  } else {
    // Linux: use xdg-open
    command = `xdg-open "${filePath}"`;
  }

  log('info', `Opening file: ${filePath}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      log('error', `Failed to open file: ${error.message}`);
      sendMCPResponse({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              filePath: filePath
            }, null, 2)
          }]
        }
      });
    } else {
      sendMCPResponse({
        jsonrpc: '2.0',
        id: id,
        result: {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Opened: ${filePath}`,
              platform: platform
            }, null, 2)
          }]
        }
      });
    }
  });
}

/**
 * Handle task queue tools (processed by bridge, not browser)
 */
function handleTaskTool(id, name, args) {
  let result;

  switch (name) {
    case 'tasks_claimNext':
      result = claimNextTask(args.capabilities || []);
      break;

    case 'tasks_progress':
      if (!args.taskId) {
        sendMCPError(id, -32602, 'Missing required parameter: taskId');
        return;
      }
      result = reportTaskProgress(args.taskId, args.message || '', args.percent || 0);
      break;

    case 'tasks_complete':
      if (!args.taskId || !args.proposed_ops || !args.summary) {
        sendMCPError(id, -32602, 'Missing required parameters: taskId, proposed_ops, summary');
        return;
      }
      result = completeTask(args.taskId, args.proposed_ops, args.summary, args.sources || []);
      break;

    case 'tasks_getQueue':
      result = {
        pending: taskQueue.length,
        active: activeTasks.size,
        completed: taskResults.size,
        tasks: taskQueue.map(t => ({ taskId: t.taskId, agentId: t.agentId, status: t.status }))
      };
      break;

    default:
      sendMCPError(id, -32601, `Unknown task tool: ${name}`);
      return;
  }

  // Send result
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

/**
 * Handle message from browser (responses and task submissions)
 */
function handleBrowserMessage(tabId, message) {
  const { id, result, error, type } = message;
  log('info', `[handleBrowserMessage] Received type: ${type || 'response'}, id: ${id || 'none'}`);

  // Handle task submission from browser
  if (type === 'task.submit') {
    const taskResult = submitTask({
      agentId: message.agentId,
      prompt: message.prompt,
      targetNodeId: message.targetNodeId,
      treeContext: message.treeContext,
      requestedCapabilities: message.requestedCapabilities || [],
      options: message.options || {}
    });

    // Send confirmation back to browser
    const ws = connections.get(tabId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'task.submitted',
        ...taskResult
      }));
    }
    return;
  }

  // Handle file open request from browser (Build 534)
  if (type === 'open_file') {
    log('info', `[open_file] Received request, filePath: ${message.filePath}`);
    const filePath = message.filePath;
    if (!filePath) {
      log('error', '[open_file] Missing filePath');
      const ws = connections.get(tabId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'open_file_result',
          success: false,
          error: 'Missing filePath'
        }));
      }
      return;
    }

    // Determine the platform-specific command
    const platform = process.platform;
    let command;

    if (platform === 'win32') {
      command = `start "" "${filePath}"`;
    } else if (platform === 'darwin') {
      command = `open "${filePath}"`;
    } else {
      command = `xdg-open "${filePath}"`;
    }

    log('info', `[open_file] Platform: ${platform}, Command: ${command}`);

    exec(command, (error, stdout, stderr) => {
      log('info', `[open_file] exec completed, error: ${error?.message || 'none'}, stderr: ${stderr || 'none'}`);
      const ws = connections.get(tabId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'open_file_result',
          success: !error,
          filePath: filePath,
          error: error ? error.message : null
        }));
      }
    });
    return;
  }

  // Handle task result acknowledgment (user approved/rejected in Inbox)
  if (type === 'task.acknowledge') {
    const { taskId, action, selectedOps } = message;
    const task = taskResults.get(taskId);

    if (task) {
      task.userAction = action; // 'approved', 'rejected', 'partial'
      task.selectedOps = selectedOps;
      task.acknowledgedAt = Date.now();
      log('info', `Task ${taskId} acknowledged: ${action}`);

      // Clean up old results (keep last 50)
      if (taskResults.size > 50) {
        const oldest = [...taskResults.entries()]
          .sort((a, b) => a[1].completedAt - b[1].completedAt)[0];
        taskResults.delete(oldest[0]);
      }
    }
    return;
  }

  // Handle pending request responses (tool call results from browser)
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
