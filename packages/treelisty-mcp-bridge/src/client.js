/**
 * TreeListy MCP Bridge Client
 *
 * Browser-side WebSocket client for connecting to the MCP bridge.
 * This code is intended to be integrated into treeplexity.html.
 *
 * Usage:
 *   const bridge = new TreeListyMCPClient();
 *   await bridge.connect(port, token);
 *   const tree = await bridge.call('get_tree');
 */

class TreeListyMCPClient {
  constructor(options = {}) {
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      requestTimeout: 30000,
      ...options
    };

    this.socket = null;
    this.tabId = this.generateTabId();
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.connectionInfo = null;

    // Event handlers
    this.onConnect = null;
    this.onDisconnect = null;
    this.onError = null;
    this.onRequest = null;  // Handler for incoming requests from Claude Code
  }

  generateTabId() {
    return 'tab-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Connect to the MCP bridge
   * @param {number} port - Bridge port
   * @param {string} token - Session token
   */
  async connect(port, token) {
    return new Promise((resolve, reject) => {
      const url = `ws://localhost:${port}/?token=${encodeURIComponent(token)}&tabId=${this.tabId}`;

      try {
        this.socket = new WebSocket(url);
      } catch (err) {
        reject(new Error(`Failed to create WebSocket: ${err.message}`));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.socket?.close();
      }, 10000);

      this.socket.onopen = () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionInfo = { port, token };

        console.log('[MCP Bridge] Connected');

        if (this.onConnect) {
          this.onConnect();
        }

        resolve();
      };

      this.socket.onclose = (event) => {
        clearTimeout(timeout);
        this.isConnected = false;

        console.log('[MCP Bridge] Disconnected:', event.code, event.reason);

        // Reject all pending requests
        for (const [id, { reject }] of this.pendingRequests) {
          reject(new Error('Connection closed'));
        }
        this.pendingRequests.clear();

        if (this.onDisconnect) {
          this.onDisconnect(event.code, event.reason);
        }

        // Auto-reconnect if we have connection info
        if (this.connectionInfo && this.reconnectAttempts < this.options.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.error('[MCP Bridge] Error:', err);

        if (this.onError) {
          this.onError(err);
        }
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    console.log(`[MCP Bridge] Reconnecting in ${this.options.reconnectInterval}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected && this.connectionInfo) {
        this.connect(this.connectionInfo.port, this.connectionInfo.token).catch(err => {
          console.error('[MCP Bridge] Reconnect failed:', err.message);
        });
      }
    }, this.options.reconnectInterval);
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      // Check if this is a response to a pending request
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);

        if (message.error) {
          reject(new Error(message.error.message || 'Unknown error'));
        } else {
          resolve(message.result);
        }
        return;
      }

      // This is an incoming request from Claude Code
      if (message.method && this.onRequest) {
        this.handleIncomingRequest(message);
      }

    } catch (err) {
      console.error('[MCP Bridge] Failed to parse message:', err);
    }
  }

  async handleIncomingRequest(request) {
    try {
      const result = await this.onRequest(request.method, request.params || {});

      // Send response
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
      this.socket.send(JSON.stringify(response));

    } catch (err) {
      // Send error response
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32000,
          message: err.message
        }
      };
      this.socket.send(JSON.stringify(response));
    }
  }

  /**
   * Call an MCP method (send request to Claude Code via bridge)
   * @param {string} method - Method name
   * @param {object} params - Method parameters
   * @returns {Promise<any>} - Response result
   */
  async call(method, params = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP bridge');
    }

    const id = ++this.requestId;

    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params: {
        ...params,
        tabId: this.tabId
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.options.requestTimeout);

      this.pendingRequests.set(id, {
        resolve: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        }
      });

      this.socket.send(JSON.stringify(request));
    });
  }

  /**
   * Send a notification (no response expected)
   * @param {string} method - Method name
   * @param {object} params - Method parameters
   */
  notify(method, params = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP bridge');
    }

    const notification = {
      jsonrpc: '2.0',
      method,
      params: {
        ...params,
        tabId: this.tabId
      }
    };

    this.socket.send(JSON.stringify(notification));
  }

  /**
   * Disconnect from the bridge
   */
  disconnect() {
    this.connectionInfo = null;  // Prevent auto-reconnect
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    this.isConnected = false;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      tabId: this.tabId,
      pendingRequests: this.pendingRequests.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// =============================================================================
// TreeListy Integration Helper
// =============================================================================

/**
 * MCP Request Handler for TreeListy
 *
 * Handles incoming requests from Claude Code and maps them to TreeListy functions.
 * This should be integrated with TreeListy's existing functionality.
 */
class TreeListyMCPHandler {
  constructor(treelisty) {
    // Reference to TreeListy's global state and functions
    this.treelisty = treelisty;

    // Transaction state
    this.activeTransaction = null;
    this.transactionChanges = [];
  }

  /**
   * Handle an incoming MCP request
   * @param {string} method - Method name
   * @param {object} params - Method parameters
   * @returns {Promise<any>} - Result
   */
  async handleRequest(method, params) {
    switch (method) {
      // Tree operations
      case 'get_tree':
        return this.getTree(params);

      case 'get_tree_metadata':
        return this.getTreeMetadata(params);

      case 'get_subtree':
        return this.getSubtree(params);

      case 'get_node':
        return this.getNode(params);

      case 'create_node':
        return this.createNode(params);

      case 'update_node':
        return this.updateNode(params);

      case 'delete_node':
        return this.deleteNode(params);

      case 'search_nodes':
        return this.searchNodes(params);

      case 'import_structured_content':
        return this.importStructuredContent(params);

      // Transaction operations
      case 'begin_transaction':
        return this.beginTransaction(params);

      case 'commit_transaction':
        return this.commitTransaction(params);

      case 'rollback_transaction':
        return this.rollbackTransaction(params);

      // Pattern operations
      case 'get_pattern_schema':
        return this.getPatternSchema(params);

      case 'list_patterns':
        return this.listPatterns(params);

      // Sync operations
      case 'get_sync_status':
        return this.getSyncStatus(params);

      case 'queue_sync_item':
        return this.queueSyncItem(params);

      // Activity log
      case 'get_activity_log':
        return this.getActivityLog(params);

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  // =========================================================================
  // Tree Operations
  // =========================================================================

  getTree(params) {
    const tree = this.treelisty.capexTree;
    return this.toAgentFormat(tree);
  }

  getTreeMetadata(params) {
    const tree = this.treelisty.capexTree;
    return {
      id: tree.id,
      name: tree.name,
      pattern: tree.pattern?.key,
      nodeCount: this.countNodes(tree),
      lastModified: tree.lastModified || new Date().toISOString(),
      hash: this.hashTree(tree)
    };
  }

  getSubtree(params) {
    const { node_id, depth = 3 } = params;
    const node = this.treelisty.findNodeById(node_id);
    if (!node) {
      throw new Error(`Node not found: ${node_id}`);
    }
    return this.toAgentFormat(node, 0, depth);
  }

  getNode(params) {
    const { node_id } = params;
    const node = this.treelisty.findNodeById(node_id);
    if (!node) {
      throw new Error(`Node not found: ${node_id}`);
    }
    // Return node without deep children
    return this.toAgentFormat(node, 0, 1);
  }

  createNode(params) {
    const { parent_id, node_data, pattern } = params;

    // Convert from agent format
    const nativeNode = this.fromAgentFormat(node_data, parent_id);

    // Apply pattern if specified
    if (pattern) {
      nativeNode.pattern = { key: pattern };
    }

    // Add to tree (TreeListy function)
    const nodeId = this.treelisty.addNode(parent_id, nativeNode);

    // Track for transaction
    if (this.activeTransaction) {
      this.transactionChanges.push({ type: 'create', nodeId });
    } else {
      this.treelisty.saveState('MCP: Created node');
      this.treelisty.render();
    }

    return { node_id: nodeId };
  }

  updateNode(params) {
    const { node_id, updates } = params;

    const node = this.treelisty.findNodeById(node_id);
    if (!node) {
      throw new Error(`Node not found: ${node_id}`);
    }

    // Apply updates
    Object.assign(node, updates);

    // Track for transaction
    if (this.activeTransaction) {
      this.transactionChanges.push({ type: 'update', nodeId: node_id });
    } else {
      this.treelisty.saveState('MCP: Updated node');
      this.treelisty.render();
    }

    return { success: true };
  }

  deleteNode(params) {
    const { node_id } = params;

    const result = this.treelisty.deleteNode(node_id);
    if (!result) {
      throw new Error(`Failed to delete node: ${node_id}`);
    }

    if (this.activeTransaction) {
      this.transactionChanges.push({ type: 'delete', nodeId: node_id });
    } else {
      this.treelisty.saveState('MCP: Deleted node');
      this.treelisty.render();
    }

    return { success: true };
  }

  searchNodes(params) {
    const { query, pattern } = params;
    const results = this.treelisty.searchNodes(query, { pattern });
    return results.map(node => this.toAgentFormat(node, 0, 1));
  }

  importStructuredContent(params) {
    const { parent_id, content, pattern } = params;

    // content is expected to be in agent format (with children[])
    const nativeContent = this.fromAgentFormat(content, parent_id);

    // Import as subtree
    const nodeIds = this.treelisty.importSubtree(parent_id, nativeContent, pattern);

    // Tag with provenance
    nodeIds.forEach(id => {
      const node = this.treelisty.findNodeById(id);
      if (node) {
        node._provenance = {
          source: 'agent',
          actor: 'claude-code',
          timestamp: Date.now(),
          context: params.context
        };
      }
    });

    // Log activity
    this.treelisty.logActivity({
      actor: 'claude-code',
      action: 'import_research',
      target: { nodeIds, treeId: this.treelisty.capexTree.id },
      context: params.context
    });

    if (this.activeTransaction) {
      this.transactionChanges.push({ type: 'import', nodeIds });
    } else {
      this.treelisty.saveState('MCP: Imported content');
      this.treelisty.render();
    }

    return { node_ids: nodeIds };
  }

  // =========================================================================
  // Transaction Operations
  // =========================================================================

  beginTransaction(params) {
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
    const { transaction_id } = params;

    if (!this.activeTransaction) {
      throw new Error('No active transaction');
    }

    if (this.activeTransaction.id !== transaction_id) {
      throw new Error('Transaction ID mismatch');
    }

    // Single saveState for all changes
    this.treelisty.saveState(`MCP: Transaction (${this.transactionChanges.length} changes)`);
    this.treelisty.render();

    const result = {
      transaction_id: this.activeTransaction.id,
      changes: this.transactionChanges.length,
      duration_ms: Date.now() - this.activeTransaction.startTime
    };

    this.activeTransaction = null;
    this.transactionChanges = [];

    return result;
  }

  rollbackTransaction(params) {
    const { transaction_id } = params;

    if (!this.activeTransaction) {
      throw new Error('No active transaction');
    }

    // TODO: Implement actual rollback by reverting changes
    // For now, just clear the transaction state
    const result = {
      transaction_id: this.activeTransaction.id,
      rolled_back_changes: this.transactionChanges.length
    };

    this.activeTransaction = null;
    this.transactionChanges = [];

    // Reload from last saved state
    this.treelisty.undo();

    return result;
  }

  // =========================================================================
  // Tree Adapter (4-level schema <-> children[])
  // =========================================================================

  toAgentFormat(node, depth = 0, maxDepth = Infinity) {
    if (depth >= maxDepth) {
      return { ...node, children: [] };
    }

    const children = depth === 0 ? node.children :
                     depth === 1 ? node.items :
                     depth === 2 ? node.subItems : [];

    const result = { ...node };

    // Remove native child arrays
    delete result.children;
    delete result.items;
    delete result.subItems;

    // Add uniform children array
    result.children = (children || []).map(child =>
      this.toAgentFormat(child, depth + 1, maxDepth)
    );

    return result;
  }

  fromAgentFormat(agentNode, parentId) {
    // Determine depth based on parent
    const depth = this.getNodeDepth(parentId);

    const childKey = depth === 0 ? 'children' :
                     depth === 1 ? 'items' : 'subItems';

    const { children, ...rest } = agentNode;

    const result = {
      ...rest,
      id: rest.id || this.treelisty.generateId()
    };

    if (children && children.length > 0) {
      result[childKey] = children.map(child =>
        this.fromAgentFormat(child, result.id)
      );
    }

    return result;
  }

  getNodeDepth(nodeId) {
    // Returns 0 for root, 1 for phase, 2 for item, 3 for subtask
    if (!nodeId || nodeId === this.treelisty.capexTree.id) return 0;

    const node = this.treelisty.findNodeById(nodeId);
    if (!node) return 0;

    switch (node.type) {
      case 'root': return 0;
      case 'phase': return 1;
      case 'item': return 2;
      case 'subtask': return 3;
      default: return 0;
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  countNodes(node) {
    let count = 1;
    const children = node.children || node.items || node.subItems || [];
    for (const child of children) {
      count += this.countNodes(child);
    }
    return count;
  }

  hashTree(tree) {
    // Simple hash based on JSON string
    const str = JSON.stringify(tree);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  getPatternSchema(params) {
    const { pattern_key } = params;
    return this.treelisty.PATTERNS[pattern_key] || null;
  }

  listPatterns(params) {
    return Object.keys(this.treelisty.PATTERNS);
  }

  getSyncStatus(params) {
    // TODO: Implement sync status tracking
    return {
      connected: true,
      integrations: []
    };
  }

  queueSyncItem(params) {
    // TODO: Implement sync queue
    return { queue_id: 'queue-' + Math.random().toString(36).substr(2, 9) };
  }

  getActivityLog(params) {
    const { since, limit = 50 } = params;
    let log = this.treelisty.activityLog || [];

    if (since) {
      log = log.filter(entry => new Date(entry.timestamp) > new Date(since));
    }

    return log.slice(-limit);
  }
}

// Export for use in TreeListy
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TreeListyMCPClient, TreeListyMCPHandler };
}
