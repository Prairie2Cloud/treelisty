#!/usr/bin/env node

/**
 * Mock MCP Client for testing the bridge
 *
 * Simulates Claude Code's MCP client behavior:
 * - Sends initialize request
 * - Sends notifications/initialized
 * - Requests tools/list
 * - Attempts tools/call (should fail with no TreeListy connected)
 * - Tests error cases
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

// Test state
let requestId = 1;
const responses = new Map();
const pendingResolvers = new Map();
let bridgeProcess = null;
let stderrLines = [];

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

// Send a JSON-RPC request and wait for response
function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = requestId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    pendingResolvers.set(id, { resolve, reject });

    const line = JSON.stringify(request);
    log(colors.dim, 'SEND', line);
    bridgeProcess.stdin.write(line + '\n');

    // Timeout after 5 seconds
    setTimeout(() => {
      if (pendingResolvers.has(id)) {
        pendingResolvers.delete(id);
        reject(new Error(`Timeout waiting for response to ${method}`));
      }
    }, 5000);
  });
}

// Send a notification (no response expected)
function sendNotification(method, params = {}) {
  const notification = {
    jsonrpc: '2.0',
    method,
    params
  };

  const line = JSON.stringify(notification);
  log(colors.dim, 'SEND', line);
  bridgeProcess.stdin.write(line + '\n');
}

// Test cases
async function runTests() {
  let passed = 0;
  let failed = 0;

  info('Starting MCP protocol tests...\n');

  // Test 1: Initialize
  try {
    info('Test 1: Initialize request');
    const initResponse = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: {
        name: 'mock-mcp-client',
        version: '1.0.0'
      },
      capabilities: {}
    });

    if (initResponse.result?.protocolVersion === '2024-11-05') {
      pass('Initialize returns correct protocolVersion');
      passed++;
    } else {
      fail('Initialize protocolVersion', `Expected 2024-11-05, got ${initResponse.result?.protocolVersion}`);
      failed++;
    }

    if (initResponse.result?.serverInfo?.name === 'treelisty-mcp-bridge') {
      pass('Initialize returns correct serverInfo.name');
      passed++;
    } else {
      fail('Initialize serverInfo.name', `Got ${initResponse.result?.serverInfo?.name}`);
      failed++;
    }

    if (initResponse.result?.capabilities?.tools) {
      pass('Initialize returns tools capability');
      passed++;
    } else {
      fail('Initialize tools capability', 'Missing tools in capabilities');
      failed++;
    }
  } catch (err) {
    fail('Initialize request', err.message);
    failed++;
  }

  // Test 2: Send initialized notification
  try {
    info('\nTest 2: Send initialized notification');
    sendNotification('notifications/initialized');
    // No response expected, just ensure no crash
    await new Promise(r => setTimeout(r, 100));
    pass('Initialized notification sent without crash');
    passed++;
  } catch (err) {
    fail('Initialized notification', err.message);
    failed++;
  }

  // Test 3: Tools list
  try {
    info('\nTest 3: Tools list request');
    const toolsResponse = await sendRequest('tools/list');

    if (Array.isArray(toolsResponse.result?.tools)) {
      pass(`Tools list returns array (${toolsResponse.result.tools.length} tools)`);
      passed++;

      // Check for expected tools
      const toolNames = toolsResponse.result.tools.map(t => t.name);
      const expectedTools = ['get_tree', 'create_node', 'update_node', 'delete_node', 'begin_transaction'];

      for (const expected of expectedTools) {
        if (toolNames.includes(expected)) {
          pass(`Tool '${expected}' present`);
          passed++;
        } else {
          fail(`Tool '${expected}' missing`, `Available: ${toolNames.join(', ')}`);
          failed++;
        }
      }

      // Check inputSchema on a tool
      const getTreeTool = toolsResponse.result.tools.find(t => t.name === 'get_tree');
      if (getTreeTool?.inputSchema?.type === 'object') {
        pass('get_tree has valid inputSchema');
        passed++;
      } else {
        fail('get_tree inputSchema', 'Missing or invalid');
        failed++;
      }
    } else {
      fail('Tools list', 'Did not return tools array');
      failed++;
    }
  } catch (err) {
    fail('Tools list request', err.message);
    failed++;
  }

  // Test 4: Tools call without TreeListy connected (should return error)
  try {
    info('\nTest 4: Tools call without TreeListy connection');
    const callResponse = await sendRequest('tools/call', {
      name: 'get_tree',
      arguments: {}
    });

    // Should get an error result since no TreeListy is connected
    if (callResponse.result?.isError === true) {
      pass('Tools call returns isError=true when no connection');
      passed++;

      if (callResponse.result?.content?.[0]?.text?.includes('No TreeListy')) {
        pass('Error message mentions no TreeListy connection');
        passed++;
      } else {
        fail('Error message content', `Got: ${JSON.stringify(callResponse.result?.content)}`);
        failed++;
      }
    } else if (callResponse.error) {
      // JSON-RPC error is also acceptable
      pass('Tools call returns JSON-RPC error when no connection');
      passed++;
    } else {
      fail('Tools call without connection', 'Expected error, got success');
      failed++;
    }
  } catch (err) {
    fail('Tools call request', err.message);
    failed++;
  }

  // Test 5: Resources list (should return empty)
  try {
    info('\nTest 5: Resources list request');
    const resourcesResponse = await sendRequest('resources/list');

    if (Array.isArray(resourcesResponse.result?.resources) && resourcesResponse.result.resources.length === 0) {
      pass('Resources list returns empty array');
      passed++;
    } else {
      fail('Resources list', `Expected empty array, got ${JSON.stringify(resourcesResponse.result)}`);
      failed++;
    }
  } catch (err) {
    fail('Resources list request', err.message);
    failed++;
  }

  // Test 6: Unknown method
  try {
    info('\nTest 6: Unknown method request');
    const unknownResponse = await sendRequest('unknown/method');

    if (unknownResponse.error?.code === -32601) {
      pass('Unknown method returns -32601 error');
      passed++;
    } else {
      fail('Unknown method', `Expected error -32601, got ${JSON.stringify(unknownResponse)}`);
      failed++;
    }
  } catch (err) {
    fail('Unknown method request', err.message);
    failed++;
  }

  // Test 7: Check bridge_ready was output
  try {
    info('\nTest 7: Bridge ready output');
    const bridgeReadyLine = stderrLines.find(line => {
      try {
        const parsed = JSON.parse(line);
        return parsed.type === 'bridge_ready';
      } catch {
        return false;
      }
    });

    if (bridgeReadyLine) {
      const bridgeReady = JSON.parse(bridgeReadyLine);
      if (typeof bridgeReady.port === 'number' && bridgeReady.port > 0) {
        pass(`Bridge ready with port ${bridgeReady.port}`);
        passed++;
      } else {
        fail('Bridge ready port', `Invalid port: ${bridgeReady.port}`);
        failed++;
      }

      if (bridgeReady.token && bridgeReady.token.length > 30) {
        pass('Bridge ready with valid token');
        passed++;
      } else {
        fail('Bridge ready token', 'Missing or invalid token');
        failed++;
      }
    } else {
      fail('Bridge ready output', 'Not found in stderr');
      failed++;
    }
  } catch (err) {
    fail('Bridge ready check', err.message);
    failed++;
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
  info('Spawning bridge process...');

  const bridgePath = path.join(__dirname, '..', 'src', 'bridge.js');
  bridgeProcess = spawn('node', [bridgePath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, TREELISTY_DEBUG: 'false' }
  });

  // Capture stderr (logs and bridge_ready)
  const stderrRl = readline.createInterface({ input: bridgeProcess.stderr });
  stderrRl.on('line', (line) => {
    stderrLines.push(line);
    log(colors.dim, 'STDERR', line.slice(0, 100));
  });

  // Capture stdout (MCP responses)
  const stdoutRl = readline.createInterface({ input: bridgeProcess.stdout });
  stdoutRl.on('line', (line) => {
    log(colors.dim, 'RECV', line);
    try {
      const response = JSON.parse(line);
      if (response.id && pendingResolvers.has(response.id)) {
        const { resolve } = pendingResolvers.get(response.id);
        pendingResolvers.delete(response.id);
        resolve(response);
      }
    } catch (err) {
      log(colors.red, 'ERROR', `Failed to parse response: ${err.message}`);
    }
  });

  bridgeProcess.on('error', (err) => {
    log(colors.red, 'ERROR', `Bridge process error: ${err.message}`);
    process.exit(1);
  });

  // Wait for bridge to start
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const success = await runTests();

    // Cleanup
    bridgeProcess.kill('SIGTERM');

    process.exit(success ? 0 : 1);
  } catch (err) {
    log(colors.red, 'ERROR', `Test runner error: ${err.message}`);
    bridgeProcess.kill('SIGTERM');
    process.exit(1);
  }
}

main();
