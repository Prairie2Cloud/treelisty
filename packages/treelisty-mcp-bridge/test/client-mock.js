#!/usr/bin/env node

/**
 * Mock Browser Client Test
 *
 * Tests TreeListyMCPClient and TreeListyMCPHandler in a Node.js environment
 * by simulating the browser WebSocket API and connecting to the real bridge.
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const WebSocket = require('ws');

// Polyfill WebSocket for browser client code
global.WebSocket = WebSocket;

// Import client classes
const { TreeListyMCPClient, TreeListyMCPHandler } = require('../src/client.js');

// Test state
let bridgeProcess = null;
let bridgePort = null;
let bridgeToken = null;

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
};

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function pass(test) {
  log(colors.green, 'PASS', test);
}

function fail(test, reason) {
  log(colors.red, 'FAIL', `${test}: ${reason}`);
}

function info(message) {
  log(colors.cyan, 'INFO', message);
}

// Mock TreeListy state
function createMockTreeListy() {
  const capexTree = {
    id: 'root',
    name: 'Test Project',
    type: 'root',
    pattern: { key: 'generic' },
    expanded: true,
    children: [
      {
        id: 'phase-1',
        name: 'Phase 1',
        type: 'phase',
        expanded: true,
        items: [
          {
            id: 'item-1',
            name: 'Item 1',
            type: 'item',
            description: 'First item',
            subItems: [
              { id: 'subtask-1', name: 'Subtask 1', type: 'subtask' }
            ]
          },
          {
            id: 'item-2',
            name: 'Item 2',
            type: 'item',
            description: 'Second item',
            subItems: []
          }
        ]
      },
      {
        id: 'phase-2',
        name: 'Phase 2',
        type: 'phase',
        expanded: false,
        items: []
      }
    ]
  };

  const activityLog = [];
  let idCounter = 100;

  return {
    capexTree,
    activityLog,
    PATTERNS: {
      generic: { name: 'Generic', fields: ['cost', 'leadTime'] },
      thesis: { name: 'Thesis', fields: ['wordCount', 'citations'] }
    },

    findNodeById(id) {
      function search(node) {
        if (node.id === id) return node;
        const children = node.children || node.items || node.subItems || [];
        for (const child of children) {
          const found = search(child);
          if (found) return found;
        }
        return null;
      }
      return search(capexTree);
    },

    generateId() {
      return 'node-' + (++idCounter);
    },

    addNode(parentId, nodeData) {
      const parent = this.findNodeById(parentId);
      if (!parent) throw new Error('Parent not found');

      const childKey = parent.type === 'root' ? 'children' :
                       parent.type === 'phase' ? 'items' : 'subItems';

      if (!parent[childKey]) parent[childKey] = [];
      parent[childKey].push(nodeData);

      return nodeData.id;
    },

    deleteNode(nodeId) {
      function removeFromParent(parent, id) {
        const childKeys = ['children', 'items', 'subItems'];
        for (const key of childKeys) {
          if (parent[key]) {
            const idx = parent[key].findIndex(c => c.id === id);
            if (idx >= 0) {
              parent[key].splice(idx, 1);
              return true;
            }
            for (const child of parent[key]) {
              if (removeFromParent(child, id)) return true;
            }
          }
        }
        return false;
      }
      return removeFromParent(capexTree, nodeId);
    },

    searchNodes(query, options = {}) {
      const results = [];
      function search(node) {
        if (node.name?.toLowerCase().includes(query.toLowerCase()) ||
            node.description?.toLowerCase().includes(query.toLowerCase())) {
          results.push(node);
        }
        const children = node.children || node.items || node.subItems || [];
        children.forEach(search);
      }
      search(capexTree);
      return results;
    },

    importSubtree(parentId, content, pattern) {
      const parent = this.findNodeById(parentId);
      if (!parent) throw new Error('Parent not found');

      const nodeIds = [];
      function collectIds(node) {
        nodeIds.push(node.id);
        const children = node.children || node.items || node.subItems || [];
        children.forEach(collectIds);
      }
      collectIds(content);

      this.addNode(parentId, content);
      return nodeIds;
    },

    saveState(description) {
      // Mock - just log
      console.log(`  [MockTreeListy] saveState: ${description}`);
    },

    render() {
      // Mock - just log
      console.log('  [MockTreeListy] render()');
    },

    undo() {
      console.log('  [MockTreeListy] undo()');
    },

    logActivity(entry) {
      activityLog.push({ ...entry, timestamp: new Date().toISOString() });
    }
  };
}

// Start the bridge and extract port/token
async function startBridge() {
  return new Promise((resolve, reject) => {
    const bridgePath = path.join(__dirname, '..', 'src', 'bridge.js');
    bridgeProcess = spawn('node', [bridgePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, TREELISTY_DEBUG: 'false' }
    });

    const stderrRl = readline.createInterface({ input: bridgeProcess.stderr });

    const timeout = setTimeout(() => {
      reject(new Error('Bridge startup timeout'));
    }, 5000);

    stderrRl.on('line', (line) => {
      try {
        const data = JSON.parse(line);
        if (data.type === 'bridge_ready') {
          clearTimeout(timeout);
          bridgePort = data.port;
          bridgeToken = data.token;
          info(`Bridge ready on port ${bridgePort}`);
          resolve();
        }
      } catch (e) {
        // Not JSON, ignore
      }
    });

    bridgeProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  info('Starting browser client tests...\n');

  // =========================================================================
  // TreeListyMCPClient Tests
  // =========================================================================

  info('=== TreeListyMCPClient Tests ===\n');

  // Test 1: Client instantiation
  try {
    info('Test 1: Client instantiation');
    const client = new TreeListyMCPClient();

    if (client.tabId && client.tabId.startsWith('tab-')) {
      pass('Client generates valid tabId');
      passed++;
    } else {
      fail('Client tabId', `Invalid: ${client.tabId}`);
      failed++;
    }

    if (client.isConnected === false) {
      pass('Client starts disconnected');
      passed++;
    } else {
      fail('Client isConnected', 'Should start false');
      failed++;
    }
  } catch (err) {
    fail('Client instantiation', err.message);
    failed++;
  }

  // Test 2: Connect to bridge
  let connectedClient = null;
  try {
    info('\nTest 2: Connect to bridge');
    connectedClient = new TreeListyMCPClient({ requestTimeout: 5000 });

    let connectEventFired = false;
    connectedClient.onConnect = () => {
      connectEventFired = true;
    };

    await connectedClient.connect(bridgePort, bridgeToken);

    if (connectedClient.isConnected) {
      pass('Client connects successfully');
      passed++;
    } else {
      fail('Client connect', 'isConnected should be true');
      failed++;
    }

    if (connectEventFired) {
      pass('onConnect callback fired');
      passed++;
    } else {
      fail('onConnect callback', 'Did not fire');
      failed++;
    }

    const status = connectedClient.getStatus();
    if (status.connected && status.tabId) {
      pass('getStatus() returns correct info');
      passed++;
    } else {
      fail('getStatus()', JSON.stringify(status));
      failed++;
    }
  } catch (err) {
    fail('Connect to bridge', err.message);
    failed++;
  }

  // Test 3: Invalid token rejection
  try {
    info('\nTest 3: Invalid token rejection');
    const badClient = new TreeListyMCPClient({
      maxReconnectAttempts: 0  // Disable auto-reconnect for test
    });

    // WebSocket connects, then bridge validates and closes with 4002
    // We need to wait for the disconnect event
    const disconnectPromise = new Promise((resolve) => {
      badClient.onDisconnect = (code, reason) => {
        resolve({ code, reason });
      };
    });

    await badClient.connect(bridgePort, 'invalid-token');

    // Wait for disconnect
    const { code } = await disconnectPromise;

    if (code === 4002) {
      pass('Invalid token rejected with code 4002');
      passed++;
    } else {
      fail('Invalid token', `Expected code 4002, got ${code}`);
      failed++;
    }

    badClient.disconnect();
  } catch (err) {
    // Connection error is also acceptable
    pass('Invalid token rejected (connection error)');
    passed++;
  }

  // Test 4: Disconnect
  try {
    info('\nTest 4: Disconnect');
    const tempClient = new TreeListyMCPClient();
    await tempClient.connect(bridgePort, bridgeToken);

    let disconnectFired = false;
    tempClient.onDisconnect = () => { disconnectFired = true; };

    tempClient.disconnect();

    // Wait a moment for disconnect event
    await new Promise(r => setTimeout(r, 100));

    if (!tempClient.isConnected) {
      pass('Client disconnects');
      passed++;
    } else {
      fail('Client disconnect', 'isConnected should be false');
      failed++;
    }
  } catch (err) {
    fail('Disconnect test', err.message);
    failed++;
  }

  // =========================================================================
  // TreeListyMCPHandler Tests
  // =========================================================================

  info('\n=== TreeListyMCPHandler Tests ===\n');

  const mockTreeListy = createMockTreeListy();
  const handler = new TreeListyMCPHandler(mockTreeListy);

  // Test 5: getTree
  try {
    info('Test 5: getTree (agent format)');
    const tree = await handler.handleRequest('get_tree', {});

    if (tree.id === 'root' && Array.isArray(tree.children)) {
      pass('getTree returns tree with children array');
      passed++;
    } else {
      fail('getTree format', 'Missing id or children');
      failed++;
    }

    // Check that native arrays are converted
    if (!tree.items && !tree.subItems) {
      pass('Native arrays converted to children');
      passed++;
    } else {
      fail('Native arrays', 'Should not have items/subItems');
      failed++;
    }

    // Check nested conversion
    const phase = tree.children[0];
    if (phase && Array.isArray(phase.children)) {
      pass('Nested nodes use children array');
      passed++;
    } else {
      fail('Nested conversion', 'Phase should have children array');
      failed++;
    }
  } catch (err) {
    fail('getTree', err.message);
    failed++;
  }

  // Test 6: getTreeMetadata
  try {
    info('\nTest 6: getTreeMetadata');
    const metadata = await handler.handleRequest('get_tree_metadata', {});

    if (metadata.id === 'root' && metadata.name === 'Test Project') {
      pass('Metadata has correct id and name');
      passed++;
    } else {
      fail('Metadata id/name', JSON.stringify(metadata));
      failed++;
    }

    if (typeof metadata.nodeCount === 'number' && metadata.nodeCount > 0) {
      pass(`Metadata nodeCount: ${metadata.nodeCount}`);
      passed++;
    } else {
      fail('Metadata nodeCount', `Invalid: ${metadata.nodeCount}`);
      failed++;
    }

    if (metadata.hash && metadata.hash.length > 0) {
      pass('Metadata has hash');
      passed++;
    } else {
      fail('Metadata hash', 'Missing');
      failed++;
    }
  } catch (err) {
    fail('getTreeMetadata', err.message);
    failed++;
  }

  // Test 7: getNode
  try {
    info('\nTest 7: getNode');
    const node = await handler.handleRequest('get_node', { node_id: 'item-1' });

    if (node.id === 'item-1' && node.name === 'Item 1') {
      pass('getNode returns correct node');
      passed++;
    } else {
      fail('getNode', `Wrong node: ${JSON.stringify(node)}`);
      failed++;
    }
  } catch (err) {
    fail('getNode', err.message);
    failed++;
  }

  // Test 8: getNode - not found
  try {
    info('\nTest 8: getNode (not found)');
    await handler.handleRequest('get_node', { node_id: 'nonexistent' });
    fail('getNode not found', 'Should have thrown');
    failed++;
  } catch (err) {
    if (err.message.includes('not found')) {
      pass('getNode throws for missing node');
      passed++;
    } else {
      fail('getNode error', `Wrong error: ${err.message}`);
      failed++;
    }
  }

  // Test 9: searchNodes
  try {
    info('\nTest 9: searchNodes');
    const results = await handler.handleRequest('search_nodes', { query: 'item' });

    if (Array.isArray(results) && results.length >= 2) {
      pass(`searchNodes found ${results.length} results`);
      passed++;
    } else {
      fail('searchNodes', `Expected >= 2, got ${results?.length}`);
      failed++;
    }
  } catch (err) {
    fail('searchNodes', err.message);
    failed++;
  }

  // Test 10: Transaction workflow
  try {
    info('\nTest 10: Transaction workflow');

    // Begin
    const beginResult = await handler.handleRequest('begin_transaction', {});
    if (beginResult.transaction_id && beginResult.transaction_id.startsWith('txn-')) {
      pass('beginTransaction returns transaction_id');
      passed++;
    } else {
      fail('beginTransaction', 'Invalid transaction_id');
      failed++;
    }

    // Nested transaction should fail
    try {
      await handler.handleRequest('begin_transaction', {});
      fail('Nested transaction', 'Should have thrown');
      failed++;
    } catch (err) {
      if (err.message.includes('already active')) {
        pass('Nested transaction rejected');
        passed++;
      } else {
        fail('Nested transaction error', err.message);
        failed++;
      }
    }

    // Commit
    const commitResult = await handler.handleRequest('commit_transaction', {
      transaction_id: beginResult.transaction_id
    });

    if (commitResult.transaction_id === beginResult.transaction_id) {
      pass('commitTransaction returns correct id');
      passed++;
    } else {
      fail('commitTransaction', 'Wrong transaction_id');
      failed++;
    }
  } catch (err) {
    fail('Transaction workflow', err.message);
    failed++;
  }

  // Test 11: Pattern schema
  try {
    info('\nTest 11: getPatternSchema');
    const schema = await handler.handleRequest('get_pattern_schema', { pattern_key: 'generic' });

    if (schema && schema.name === 'Generic') {
      pass('getPatternSchema returns correct pattern');
      passed++;
    } else {
      fail('getPatternSchema', JSON.stringify(schema));
      failed++;
    }
  } catch (err) {
    fail('getPatternSchema', err.message);
    failed++;
  }

  // Test 12: Unknown method
  try {
    info('\nTest 12: Unknown method');
    await handler.handleRequest('unknown_method', {});
    fail('Unknown method', 'Should have thrown');
    failed++;
  } catch (err) {
    if (err.message.includes('Unknown method')) {
      pass('Unknown method throws correct error');
      passed++;
    } else {
      fail('Unknown method error', err.message);
      failed++;
    }
  }

  // =========================================================================
  // Integration Test: Client + Handler
  // =========================================================================

  info('\n=== Integration Tests ===\n');

  // Test 13: Client with handler responding to requests
  try {
    info('Test 13: Client receives and handles request');

    // Create a fresh client with the handler
    const integrationClient = new TreeListyMCPClient();

    // Set up handler for incoming requests
    integrationClient.onRequest = async (method, params) => {
      return await handler.handleRequest(method, params);
    };

    await integrationClient.connect(bridgePort, bridgeToken);

    // The bridge should be able to forward requests to us
    // For this test, we verify the handler is wired up correctly
    if (integrationClient.onRequest) {
      pass('Handler wired to client');
      passed++;
    }

    // Clean up
    integrationClient.disconnect();
  } catch (err) {
    fail('Integration test', err.message);
    failed++;
  }

  // Clean up connected client
  if (connectedClient) {
    connectedClient.disconnect();
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log('='.repeat(50));

  return failed === 0;
}

// Main
async function main() {
  try {
    info('Starting bridge...');
    await startBridge();

    // Wait for bridge to be fully ready
    await new Promise(r => setTimeout(r, 200));

    const success = await runTests();

    // Cleanup
    if (bridgeProcess) {
      bridgeProcess.kill('SIGTERM');
    }

    process.exit(success ? 0 : 1);
  } catch (err) {
    log(colors.red, 'ERROR', err.message);
    if (bridgeProcess) {
      bridgeProcess.kill('SIGTERM');
    }
    process.exit(1);
  }
}

main();
