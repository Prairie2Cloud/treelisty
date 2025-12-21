#!/usr/bin/env node
/**
 * Standalone MCP File Open Smoke Test
 *
 * Run with: node test/smoke/run-mcp-test.js
 *
 * This test validates the MCP Bridge file open functionality by:
 * 1. Opening TreeListy in a headless browser
 * 2. Loading a test filesystem tree
 * 3. Clicking on a file to show info panel
 * 4. Verifying the Open File button exists and works
 * 5. Checking console logs for proper message flow
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - adjusted for test/treelisty-test/test/smoke location
const TREELISTY_PATH = path.resolve(__dirname, '../../../../treeplexity.html');
const TREELISTY_URL = 'file:///' + TREELISTY_PATH.replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Test tree data
const TEST_TREE = {
  name: "Smoke Test Files",
  type: "root",
  isFolder: true,
  pattern: "filesystem",
  children: [{
    name: "Test Documents",
    type: "phase",
    isFolder: true,
    items: [{
      id: "test-pdf",
      name: "test-document.pdf",
      type: "item",
      isFolder: false,
      fileExtension: ".pdf",
      filePath: "C:\\Users\\Test\\Documents\\test-document.pdf",
      description: "A test PDF file"
    }, {
      id: "test-xlsx",
      name: "budget-report.xlsx",
      type: "item",
      isFolder: false,
      fileExtension: ".xlsx",
      filePath: "H:\\My Drive\\Reports\\budget-report.xlsx",
      description: "An Excel spreadsheet"
    }]
  }]
};

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('MCP File Open Smoke Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  try {
    // Step 1: Load TreeListy
    console.log('1. Loading TreeListy...');
    await page.goto(TREELISTY_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const build = await page.evaluate(() => window.TREELISTY_VERSION?.build);
    console.log(`   Build: ${build}`);

    if (build < 535) {
      console.log('   ⚠️  Build < 535, socket fix may not be present');
    }

    // Step 2: Load test tree
    console.log('2. Loading test tree...');
    await page.evaluate((treeData) => {
      window.loadTreeData(treeData);
      window.render();
    }, TEST_TREE);
    await page.waitForTimeout(500);

    const pattern = await page.evaluate(() => window.currentPattern);
    console.log(`   Pattern: ${pattern}`);

    // Step 3: Click on a file
    console.log('3. Selecting file node...');
    const fileInfo = await page.evaluate(() => {
      const file = window.capexTree.children[0].items[0];
      window.showInfo(file);
      return { name: file.name, filePath: file.filePath };
    });
    console.log(`   Selected: ${fileInfo.name}`);
    await page.waitForTimeout(300);

    // Step 4: Check for Open File button
    console.log('4. Checking for Open File button...');
    const buttonInfo = await page.evaluate(() => {
      const body = document.getElementById('info-body');
      if (!body) return { error: 'info-body not found' };

      const buttons = Array.from(body.querySelectorAll('button'));
      const openBtn = buttons.find(b => b.textContent.includes('Open File'));

      if (!openBtn) {
        return {
          error: 'Open File button not found',
          foundButtons: buttons.map(b => b.textContent.trim().substring(0, 30))
        };
      }

      return {
        text: openBtn.textContent.trim(),
        onclick: openBtn.getAttribute('onclick')?.substring(0, 80)
      };
    });

    if (buttonInfo.error) {
      console.log(`   ❌ ${buttonInfo.error}`);
      if (buttonInfo.foundButtons) {
        console.log(`   Found buttons: ${buttonInfo.foundButtons.join(', ')}`);
      }
      throw new Error(buttonInfo.error);
    }

    console.log(`   ✓ Found: "${buttonInfo.text}"`);
    console.log(`   onclick: ${buttonInfo.onclick}...`);

    // Step 5: Click the button and check logs
    console.log('5. Clicking Open File button...');
    await page.click('button:has-text("Open File")');
    await page.waitForTimeout(500);

    // Step 6: Analyze console logs
    console.log('6. Analyzing console logs...\n');

    const mcpLogs = consoleLogs.filter(l => l.text.includes('[MCP File Open]'));

    console.log('   MCP File Open logs:');
    mcpLogs.forEach(l => console.log(`   ${l.text}`));

    // Check for WebSocket ready log
    const wsReadyLog = mcpLogs.find(l => l.text.includes('WebSocket ready'));
    if (wsReadyLog) {
      console.log(`\n   WebSocket check: ${wsReadyLog.text}`);

      // Parse the ready state
      const isReady = wsReadyLog.text.includes('ready: true');
      if (isReady) {
        console.log('   ✓ WebSocket IS connected');

        const sendLog = mcpLogs.find(l => l.text.includes('Sending'));
        if (sendLog) {
          console.log(`   ✓ Message sent: ${sendLog.text}`);
        } else {
          console.log('   ❌ No send log found');
        }
      } else {
        console.log('   ⚠️  WebSocket NOT connected (expected if MCP Bridge not running)');
        console.log('   Fallback behavior should apply (clipboard copy)');
      }
    } else {
      console.log('   ❌ No WebSocket ready log - openFileFromInfoPanel may not have been called');
    }

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, 'mcp-smoke-test.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`\n   Screenshot: ${screenshotPath}`);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Test Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Build: ${build}`);
    console.log(`Open File button: ${buttonInfo.text ? '✓ Found' : '❌ Missing'}`);
    console.log(`WebSocket check: ${wsReadyLog ? '✓ Logged' : '❌ Not logged'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (buttonInfo.text && wsReadyLog) {
      console.log('✅ Smoke test PASSED\n');
    } else {
      console.log('⚠️  Smoke test INCOMPLETE - some checks failed\n');
    }

  } catch (err) {
    console.error('\n❌ Test FAILED:', err.message);

    // Take error screenshot
    const errorScreenshot = path.join(SCREENSHOT_DIR, 'mcp-smoke-test-error.png');
    await page.screenshot({ path: errorScreenshot });
    console.log(`Error screenshot: ${errorScreenshot}`);

    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

// Run the test
runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
