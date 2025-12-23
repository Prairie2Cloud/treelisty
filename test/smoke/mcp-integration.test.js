/**
 * Integration Test: MCP Bridge + TreeListy File Open
 *
 * This test starts the MCP bridge, connects TreeListy, and verifies
 * the complete file open flow including WebSocket message exchange.
 *
 * Run with: npm run test:smoke:mcp
 */

const { test, expect } = require('@playwright/test');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');

// Paths
const BRIDGE_PATH = path.resolve(__dirname, '../../packages/treelisty-mcp-bridge/src/bridge.js');
const TREELISTY_PATH = path.resolve(__dirname, '../../treeplexity.html');
const TREELISTY_URL = 'file:///' + TREELISTY_PATH.replace(/\\/g, '/');

// Config
const MCP_PORT = 3457; // Use different port to avoid conflicts
const MCP_TOKEN = 'smoke-test-token';

// Test tree with local file paths
const TEST_TREE = {
  name: "Smoke Test Files",
  type: "root",
  isFolder: true,
  pattern: "filesystem",
  children: [{
    name: "Documents",
    type: "phase",
    isFolder: true,
    items: [{
      id: "smoke-test-file",
      name: "smoke-test.txt",
      type: "item",
      isFolder: false,
      fileExtension: ".txt",
      filePath: path.resolve(__dirname, 'smoke-test.txt').replace(/\\/g, '/'),
      description: "Smoke test file"
    }]
  }]
};

test.describe('MCP Bridge Integration', () => {
  let bridgeProcess = null;
  let bridgeLogs = [];

  test.beforeAll(async () => {
    // Create a test file to open
    const fs = require('fs');
    const testFilePath = path.resolve(__dirname, 'smoke-test.txt');
    fs.writeFileSync(testFilePath, 'This is a smoke test file.\nCreated by MCP integration test.');
    console.log(`Created test file: ${testFilePath}`);
  });

  test.beforeEach(async () => {
    // Start MCP Bridge with custom port/token
    bridgeLogs = [];

    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        TREELISTY_MCP_PORT: MCP_PORT.toString(),
        TREELISTY_MCP_TOKEN: MCP_TOKEN,
        TREELISTY_DEBUG: '1'
      };

      bridgeProcess = spawn('node', [BRIDGE_PATH], {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      bridgeProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        lines.forEach(line => {
          try {
            const log = JSON.parse(line);
            bridgeLogs.push(log);
            console.log(`[Bridge] ${log.message}`);
          } catch {
            console.log(`[Bridge Raw] ${line}`);
          }
        });
      });

      bridgeProcess.stdout.on('data', (data) => {
        // MCP stdout - ignore for this test
      });

      bridgeProcess.on('error', (err) => {
        console.error('Bridge process error:', err);
        reject(err);
      });

      // Wait for bridge to be ready
      setTimeout(() => {
        console.log('Bridge should be ready now');
        resolve();
      }, 2000);
    });
  });

  test.afterEach(async () => {
    if (bridgeProcess) {
      bridgeProcess.kill('SIGTERM');
      bridgeProcess = null;
    }
  });

  test.afterAll(async () => {
    // Clean up test file
    const fs = require('fs');
    const testFilePath = path.resolve(__dirname, 'smoke-test.txt');
    try {
      fs.unlinkSync(testFilePath);
    } catch {}
  });

  test('WebSocket connection to bridge', async () => {
    // Test direct WebSocket connection to bridge
    const ws = new WebSocket(`ws://localhost:${MCP_PORT}/?token=${MCP_TOKEN}&tabId=test-1`);

    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        console.log('WebSocket connected to bridge');
        resolve();
      });
      ws.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Send open_file message
    const openFileMsg = {
      type: 'open_file',
      filePath: path.resolve(__dirname, 'smoke-test.txt')
    };

    console.log('Sending open_file message:', openFileMsg);
    ws.send(JSON.stringify(openFileMsg));

    // Wait for response
    const response = await new Promise((resolve, reject) => {
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log('Received response:', msg);
        resolve(msg);
      });
      setTimeout(() => reject(new Error('Response timeout')), 5000);
    });

    expect(response.type).toBe('open_file_result');
    expect(response.success).toBe(true);

    ws.close();

    // Check bridge logs
    const openFileLogs = bridgeLogs.filter(l => l.message?.includes('[open_file]'));
    console.log('Bridge open_file logs:', openFileLogs.map(l => l.message));
    expect(openFileLogs.length).toBeGreaterThan(0);

    console.log('\n✅ WebSocket integration test passed');
  });

  test('Full browser flow with MCP connection', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to TreeListy
    await page.goto(TREELISTY_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify build
    const build = await page.evaluate(() => window.TREELISTY_VERSION?.build);
    console.log(`Testing Build ${build}`);

    // Load test tree
    await page.evaluate((treeData) => {
      window.loadTreeData(treeData);
      window.render();
    }, TEST_TREE);
    await page.waitForTimeout(500);

    // Connect to MCP Bridge
    const connected = await page.evaluate(async (config) => {
      try {
        await window.initMCPBridge(config.port, config.token);
        await new Promise(r => setTimeout(r, 1500));
        return window.mcpBridgeState?.client?.isConnected || false;
      } catch (e) {
        console.error('[Test] Connection failed:', e);
        return false;
      }
    }, { port: MCP_PORT, token: MCP_TOKEN });

    expect(connected).toBe(true);
    console.log('Connected to MCP Bridge');

    // Click on the test file
    await page.evaluate(() => {
      const file = window.capexTree.children[0].items[0];
      window.showInfo(file);
    });
    await page.waitForTimeout(300);

    // Verify Open File button exists
    const buttonExists = await page.evaluate(() => {
      const body = document.getElementById('info-body');
      const buttons = Array.from(body?.querySelectorAll('button') || []);
      return buttons.some(b => b.textContent.includes('Open File'));
    });
    expect(buttonExists).toBe(true);

    // Click Open File
    await page.click('button:has-text("Open File")');
    await page.waitForTimeout(1000);

    // Check console logs
    const mcpLogs = consoleLogs.filter(l => l.text.includes('[MCP File Open]'));
    console.log('Browser MCP logs:', mcpLogs.map(l => l.text));

    // Verify message was sent
    const sendLog = mcpLogs.find(l => l.text.includes('Sending'));
    expect(sendLog).toBeDefined();

    // Check bridge received and processed it
    const bridgeOpenLogs = bridgeLogs.filter(l => l.message?.includes('[open_file]'));
    console.log('Bridge processed:', bridgeOpenLogs.map(l => l.message));
    expect(bridgeOpenLogs.length).toBeGreaterThan(0);

    // Verify exec was called
    const execLog = bridgeLogs.find(l => l.message?.includes('exec completed'));
    expect(execLog).toBeDefined();

    // Take screenshot
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/mcp-integration-test.png')
    });

    console.log('\n✅ Full browser flow test passed');
  });
});
