/**
 * TreeListy MCP Client
 *
 * Browser-side WebSocket client for connecting to the MCP Bridge.
 * This code is designed to be inlined into treeplexity.html.
 *
 * Usage:
 *   1. User clicks "Connect to Claude Code" button
 *   2. User enters port and token from bridge output
 *   3. TreeListy connects via WebSocket
 *   4. MCP requests from Claude Code are handled by TreeListyMCPHandler
 *
 * Copyright 2024-2025 Prairie2Cloud LLC
 * Licensed under Apache-2.0
 */

// =============================================================================
// MCP Client: WebSocket connection to bridge
// =============================================================================

class TreeListyMCPClient {
  constructor() {
    this.socket = null;
    this.status = 'disconnected'; // disconnected | connecting | connected
    this.tabId = this.generateTabId();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;

    // Callbacks
    this.onConnect = null;
    this.onDisconnect = null;
    this.onRequest = null;
    this.onStatusChange = null;
  }

  /**
   * Generate unique tab ID for multi-tab support
   */
  generateTabId() {
    return 'tab-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Connect to the MCP bridge
   */
  async connect(port, token) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('[MCP] Already connected');
      return;
    }

    this.port = port;
    this.token = token;
    this.setStatus('connecting');

    try {
      const url = `ws://localhost:${port}?token=${encodeURIComponent(token)}&tabId=${this.tabId}`;
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('[MCP] Connected to bridge');
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        if (this.onConnect) this.onConnect();
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = (event) => {
        console.log(`[MCP] Connection closed: ${event.code} ${event.reason}`);
        this.setStatus('disconnected');
        if (this.onDisconnect) this.onDisconnect(event.code, event.reason);

        // Auto-reconnect if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('[MCP] WebSocket error:', error);
      };

    } catch (err) {
      console.error('[MCP] Connection failed:', err);
      this.setStatus('disconnected');
      throw err;
    }
  }

  /**
   * Disconnect from the bridge
   */
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Handle incoming message from bridge
   */
  handleMessage(data) {
    try {
      const request = JSON.parse(data);
      console.log('[MCP] Received request:', request.method);

      if (this.onRequest) {
        const result = this.onRequest(request.method, request.params);

        // Send response back to bridge
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: result
        };
        this.send(response);
      }
    } catch (err) {
      console.error('[MCP] Failed to handle message:', err);

      // Send error response
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: err.message }
      };
      this.send(errorResponse);
    }
  }

  /**
   * Send message to bridge
   */
  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('[MCP] Cannot send: not connected');
    }
  }

  /**
   * Update connection status
   */
  setStatus(status) {
    this.status = status;
    if (this.onStatusChange) this.onStatusChange(status);
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(`[MCP] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.status === 'disconnected' && this.port && this.token) {
        this.connect(this.port, this.token);
      }
    }, delay);
  }
}

// =============================================================================
// MCP Handler: Process requests from Claude Code
// =============================================================================

class TreeListyMCPHandler {
  constructor(options) {
    // Required references from TreeListy
    this.capexTree = options.capexTree;
    this.findNodeById = options.findNodeById;
    this.addNode = options.addNode;
    this.deleteNode = options.deleteNode;
    this.saveState = options.saveState;
    this.render = options.render;
    this.PATTERNS = options.PATTERNS;
    this.activityLog = options.activityLog || [];

    // Transaction state
    this.activeTransaction = null;
    this.transactionChanges = [];
  }

  /**
   * Handle incoming MCP request
   */
  handleRequest(method, params) {
    console.log(`[MCP Handler] ${method}`, params);

    switch (method) {
      case 'get_tree':
        return this.getTree(params);

      case 'get_tree_metadata':
        return this.getTreeMetadata(params);

      case 'get_node':
        return this.getNode(params);

      case 'get_subtree':
        return this.getSubtree(params);

      case 'create_node':
        return this.createNode(params);

      case 'update_node':
        return this.updateNode(params);

      case 'delete_node':
        return this.deleteNodeHandler(params);

      case 'search_nodes':
        return this.searchNodes(params);

      case 'begin_transaction':
        return this.beginTransaction();

      case 'commit_transaction':
        return this.commitTransaction(params);

      case 'rollback_transaction':
        return this.rollbackTransaction(params);

      case 'import_structured_content':
        return this.importStructuredContent(params);

      case 'get_pattern_schema':
        return this.getPatternSchema(params);

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Tree Operations
  // ---------------------------------------------------------------------------

  getTree(params) {
    // Convert to agent-friendly format (uniform children[])
    return this.toAgentFormat(this.capexTree);
  }

  getTreeMetadata(params) {
    const nodeCount = this.countNodes(this.capexTree);
    const hash = this.hashTree(this.capexTree);
    return {
      nodeCount,
      hash,
      lastModified: new Date().toISOString(),
      pattern: this.capexTree.pattern?.key || 'generic'
    };
  }

  getNode(params) {
    const node = this.findNodeById(params.node_id);
    if (!node) {
      throw new Error(`Node not found: ${params.node_id}`);
    }
    return node;
  }

  getSubtree(params) {
    const node = this.findNodeById(params.node_id);
    if (!node) {
      throw new Error(`Node not found: ${params.node_id}`);
    }
    return this.toAgentFormat(node, 0, params.depth);
  }

  createNode(params) {
    const { parent_id, node_data, pattern } = params;

    // Find parent
    const parent = this.findNodeById(parent_id);
    if (!parent) {
      throw new Error(`Parent not found: ${parent_id}`);
    }

    // Generate ID if not provided
    const nodeId = node_data.id || this.generateId();

    // Create node with pattern
    const newNode = {
      id: nodeId,
      name: node_data.name || 'New Node',
      description: node_data.description || '',
      ...node_data,
      _provenance: {
        source: 'agent',
        timestamp: Date.now()
      }
    };

    // Add to parent's children array
    this.addNode(parent, newNode, pattern);

    // Handle transaction vs immediate save
    if (this.activeTransaction) {
      this.transactionChanges.push({ type: 'create', nodeId });
    } else {
      this.saveState('MCP: Created node');
      this.render();
    }

    this.logActivity('create_node', [nodeId]);

    return { node_id: nodeId };
  }

  updateNode(params) {
    const { node_id, updates } = params;

    const node = this.findNodeById(node_id);
    if (!node) {
      throw new Error(`Node not found: ${node_id}`);
    }

    // Apply updates
    Object.assign(node, updates, {
      _provenance: {
        source: 'agent',
        timestamp: Date.now()
      }
    });

    if (this.activeTransaction) {
      this.transactionChanges.push({ type: 'update', nodeId: node_id });
    } else {
      this.saveState('MCP: Updated node');
      this.render();
    }

    this.logActivity('update_node', [node_id]);

    return { success: true };
  }

  deleteNodeHandler(params) {
    const { node_id } = params;

    const node = this.findNodeById(node_id);
    if (!node) {
      throw new Error(`Node not found: ${node_id}`);
    }

    this.deleteNode(node_id);

    if (this.activeTransaction) {
      this.transactionChanges.push({ type: 'delete', nodeId: node_id });
    } else {
      this.saveState('MCP: Deleted node');
      this.render();
    }

    this.logActivity('delete_node', [node_id]);

    return { success: true };
  }

  searchNodes(params) {
    const { query, pattern } = params;
    const results = [];

    this.walkTree(this.capexTree, (node) => {
      // Check pattern filter
      if (pattern && node.pattern?.key !== pattern) {
        return;
      }

      // Search in name and description
      const searchText = `${node.name || ''} ${node.description || ''}`.toLowerCase();
      if (searchText.includes(query.toLowerCase())) {
        results.push({
          id: node.id,
          name: node.name,
          description: node.description?.substring(0, 100),
          pattern: node.pattern?.key
        });
      }
    });

    return { nodes: results };
  }

  // ---------------------------------------------------------------------------
  // Transaction Operations
  // ---------------------------------------------------------------------------

  beginTransaction() {
    if (this.activeTransaction) {
      throw new Error('Transaction already active');
    }

    this.activeTransaction = {
      id: 'txn-' + Math.random().toString(36).substr(2, 9),
      startTime: Date.now()
    };
    this.transactionChanges = [];

    return { transaction_id: this.activeTransaction.id };
  }

  commitTransaction(params) {
    if (!this.activeTransaction) {
      throw new Error('No active transaction');
    }

    if (params.transaction_id !== this.activeTransaction.id) {
      throw new Error('Transaction ID mismatch');
    }

    const changeCount = this.transactionChanges.length;

    // Single saveState for all changes
    this.saveState(`MCP: Transaction (${changeCount} changes)`);
    this.render();

    const result = {
      transaction_id: this.activeTransaction.id,
      changes: changeCount,
      duration_ms: Date.now() - this.activeTransaction.startTime
    };

    this.activeTransaction = null;
    this.transactionChanges = [];

    return result;
  }

  rollbackTransaction(params) {
    if (!this.activeTransaction) {
      throw new Error('No active transaction');
    }

    const result = {
      transaction_id: this.activeTransaction.id,
      discarded_changes: this.transactionChanges.length
    };

    this.activeTransaction = null;
    this.transactionChanges = [];

    // Note: True rollback would require storing pre-transaction state
    // For now, we just discard uncommitted changes

    return result;
  }

  // ---------------------------------------------------------------------------
  // Import Operations
  // ---------------------------------------------------------------------------

  importStructuredContent(params) {
    const { parent_id, content, pattern, context } = params;

    const parent = this.findNodeById(parent_id);
    if (!parent) {
      throw new Error(`Parent not found: ${parent_id}`);
    }

    // Convert agent format to TreeListy format and import
    const nodeIds = [];
    const importNode = (agentNode, targetParent, depth) => {
      const nodeId = agentNode.id || this.generateId();
      const treeListyNode = this.fromAgentFormat(agentNode, depth);
      treeListyNode.id = nodeId;
      treeListyNode._provenance = {
        source: 'agent',
        context: context,
        timestamp: Date.now()
      };

      this.addNode(targetParent, treeListyNode, pattern);
      nodeIds.push(nodeId);

      // Recursively import children
      if (agentNode.children) {
        const addedNode = this.findNodeById(nodeId);
        agentNode.children.forEach(child => {
          importNode(child, addedNode, depth + 1);
        });
      }
    };

    importNode(content, parent, 0);

    this.saveState('MCP: Imported structured content');
    this.render();

    this.logActivity('import_structured_content', nodeIds, context);

    return { node_ids: nodeIds };
  }

  getPatternSchema(params) {
    const { pattern_key } = params;
    const pattern = this.PATTERNS[pattern_key];

    if (!pattern) {
      throw new Error(`Pattern not found: ${pattern_key}`);
    }

    return {
      key: pattern_key,
      name: pattern.name,
      description: pattern.description,
      fields: pattern.fields || [],
      phases: pattern.phases || []
    };
  }

  // ---------------------------------------------------------------------------
  // Tree Adapter: Convert between TreeListy and agent-friendly formats
  // ---------------------------------------------------------------------------

  /**
   * Convert TreeListy native format to agent-friendly format
   * (items/subItems -> uniform children[])
   */
  toAgentFormat(node, depth = 0, maxDepth = Infinity) {
    if (depth > maxDepth) {
      return { ...node, children: [] };
    }

    const children = depth === 0 ? node.children :
                     depth === 1 ? node.items :
                     depth === 2 ? node.subItems : [];

    return {
      ...node,
      children: (children || []).map(c => this.toAgentFormat(c, depth + 1, maxDepth))
    };
  }

  /**
   * Convert agent-friendly format to TreeListy native format
   * (uniform children[] -> items/subItems based on depth)
   */
  fromAgentFormat(agentNode, depth = 0) {
    const childKey = depth === 0 ? 'children' :
                     depth === 1 ? 'items' : 'subItems';
    const { children, ...rest } = agentNode;

    const result = { ...rest };

    if (children && children.length > 0) {
      result[childKey] = children.map(c => this.fromAgentFormat(c, depth + 1));
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  generateId() {
    return 'node-' + Math.random().toString(36).substr(2, 9);
  }

  countNodes(node) {
    let count = 1;
    const children = node.children || node.items || node.subItems || [];
    children.forEach(child => {
      count += this.countNodes(child);
    });
    return count;
  }

  hashTree(node) {
    // Simple hash for change detection
    const str = JSON.stringify(node);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  walkTree(node, callback) {
    callback(node);
    const children = node.children || node.items || node.subItems || [];
    children.forEach(child => this.walkTree(child, callback));
  }

  logActivity(action, nodeIds, context = null) {
    this.activityLog.push({
      id: 'activity-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      actor: 'claude-code',
      action: action,
      target: { nodeIds },
      context: context
    });
  }
}

// =============================================================================
// Export for use in treeplexity.html
// =============================================================================

if (typeof window !== 'undefined') {
  window.TreeListyMCPClient = TreeListyMCPClient;
  window.TreeListyMCPHandler = TreeListyMCPHandler;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TreeListyMCPClient, TreeListyMCPHandler };
}
