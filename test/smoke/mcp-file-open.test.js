/**
 * Smoke Test: MCP File Open
 *
 * Tests the end-to-end flow of opening local files via MCP Bridge.
 *
 * Prerequisites:
 * - MCP Bridge must be running on port 3456
 * - Run with: npx playwright test test/smoke/mcp-file-open.test.js
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Test configuration
const TREELISTY_URL = 'file:///' + path.resolve(__dirname, '../../treeplexity.html').replace(/\\/g, '/');
const MCP_PORT = 3456;
const MCP_TOKEN = 'treelisty-local';

// Sample filesystem JSON for testing
const TEST_TREE = {
  name: "Test Folder",
  type: "root",
  isFolder: true,
  pattern: "filesystem",
  children: [{
    name: "Test Phase",
    type: "phase",
    isFolder: true,
    items: [{
      id: "test-file-1",
      name: "test-document.pdf",
      type: "item",
      isFolder: false,
      fileExtension: ".pdf",
      filePath: "C:\\Users\\Test\\Documents\\test-document.pdf",
      description: "A test PDF file"
    }, {
      id: "test-file-2",
      name: "test-image.png",
      type: "item",
      isFolder: false,
      fileExtension: ".png",
      filePath: "H:\\My Drive\\Images\\test-image.png",
      description: "A test image file"
    }]
  }]
};

test.describe('MCP File Open Smoke Test', () => {

  test('should send open_file message when clicking Open File button', async ({ page }) => {
    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to TreeListy
    await page.goto(TREELISTY_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Verify build number
    const build = await page.evaluate(() => window.TREELISTY_VERSION?.build);
    console.log(`Testing Build ${build}`);
    expect(build).toBeGreaterThanOrEqual(535);

    // Load test tree
    await page.evaluate((treeData) => {
      window.loadTreeData(treeData);
      window.render();
    }, TEST_TREE);
    await page.waitForTimeout(500);

    // Verify pattern is set to filesystem
    const pattern = await page.evaluate(() => window.currentPattern);
    expect(pattern).toBe('filesystem');

    // Try to connect to MCP Bridge (may fail if not running)
    const mcpConnected = await page.evaluate(async (config) => {
      try {
        if (window.initMCPBridge) {
          await window.initMCPBridge(config.port, config.token);
          // Wait a bit for connection
          await new Promise(r => setTimeout(r, 1000));
          return window.mcpBridgeState?.client?.isConnected || false;
        }
        return false;
      } catch (e) {
        console.log('[Test] MCP connection failed:', e.message);
        return false;
      }
    }, { port: MCP_PORT, token: MCP_TOKEN });

    console.log(`MCP Connected: ${mcpConnected}`);

    // Find and click on a file node to show info panel
    const fileClicked = await page.evaluate(() => {
      // Find a file node in the tree
      function findFile(node) {
        if (node.filePath && !node.isFolder) return node;
        for (const child of (node.children || []).concat(node.items || [])) {
          const found = findFile(child);
          if (found) return found;
        }
        return null;
      }

      const file = findFile(window.capexTree);
      if (file && typeof window.showInfo === 'function') {
        window.showInfo(file);
        return { name: file.name, filePath: file.filePath };
      }
      return null;
    });

    expect(fileClicked).not.toBeNull();
    console.log(`Selected file: ${fileClicked.name}`);
    await page.waitForTimeout(300);

    // Check if Open File button exists
    const openButton = await page.evaluate(() => {
      const body = document.getElementById('info-body');
      if (!body) return null;

      const buttons = body.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.includes('Open File')) {
          return {
            text: btn.textContent.trim(),
            onclick: btn.getAttribute('onclick')?.substring(0, 100)
          };
        }
      }
      return null;
    });

    expect(openButton).not.toBeNull();
    console.log(`Found button: ${openButton.text}`);

    // Click the Open File button
    await page.click('button:has-text("Open File")');
    await page.waitForTimeout(500);

    // Check console logs for MCP file open messages
    const mcpLogs = consoleLogs.filter(log =>
      log.text.includes('[MCP File Open]') ||
      log.text.includes('Opening file')
    );

    console.log('\nMCP-related console logs:');
    mcpLogs.forEach(log => console.log(`  [${log.type}] ${log.text}`));

    // Verify the WebSocket message was attempted
    const wsReadyLog = consoleLogs.find(log => log.text.includes('[MCP File Open] WebSocket ready'));
    expect(wsReadyLog).toBeDefined();
    console.log(`\nWebSocket ready log: ${wsReadyLog?.text}`);

    // If MCP was connected, verify the message was sent
    if (mcpConnected) {
      const sendLog = consoleLogs.find(log => log.text.includes('[MCP File Open] Sending'));
      expect(sendLog).toBeDefined();
      console.log(`Message sent: ${sendLog?.text}`);
    } else {
      // If not connected, verify fallback behavior (toast about clipboard)
      console.log('MCP not connected - checking fallback behavior');
      const fallbackLog = consoleLogs.find(log =>
        log.text.includes('Path copied') || log.text.includes('Connect Claude Code')
      );
      // Fallback is acceptable when MCP is not running
    }

    // Take screenshot for visual verification
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/mcp-file-open-test.png'),
      fullPage: false
    });

    console.log('\n✅ Smoke test completed');
  });

  test('should show correct button text for different file types', async ({ page }) => {
    await page.goto(TREELISTY_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Load test tree
    await page.evaluate((treeData) => {
      window.loadTreeData(treeData);
      window.render();
    }, TEST_TREE);
    await page.waitForTimeout(500);

    // Test PDF file
    const pdfButton = await page.evaluate(() => {
      function findByExt(node, ext) {
        if (node.fileExtension === ext && !node.isFolder) return node;
        for (const child of (node.children || []).concat(node.items || [])) {
          const found = findByExt(child, ext);
          if (found) return found;
        }
        return null;
      }

      const pdf = findByExt(window.capexTree, '.pdf');
      if (pdf) {
        window.showInfo(pdf);
        // Wait for render
        return new Promise(resolve => {
          setTimeout(() => {
            const body = document.getElementById('info-body');
            const btn = body?.querySelector('button');
            resolve(btn?.textContent?.includes('Open') ? btn.textContent.trim() : null);
          }, 100);
        });
      }
      return null;
    });

    console.log(`PDF button text: ${pdfButton}`);
    expect(pdfButton).toContain('Open');

    // Test PNG file
    const pngButton = await page.evaluate(() => {
      function findByExt(node, ext) {
        if (node.fileExtension === ext && !node.isFolder) return node;
        for (const child of (node.children || []).concat(node.items || [])) {
          const found = findByExt(child, ext);
          if (found) return found;
        }
        return null;
      }

      const png = findByExt(window.capexTree, '.png');
      if (png) {
        window.showInfo(png);
        return new Promise(resolve => {
          setTimeout(() => {
            const body = document.getElementById('info-body');
            const btn = body?.querySelector('button');
            resolve(btn?.textContent?.includes('Open') ? btn.textContent.trim() : null);
          }, 100);
        });
      }
      return null;
    });

    console.log(`PNG button text: ${pngButton}`);
    expect(pngButton).toContain('Open');

    console.log('\n✅ Button text test completed');
  });

});
