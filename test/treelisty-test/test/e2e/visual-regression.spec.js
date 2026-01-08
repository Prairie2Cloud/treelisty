/**
 * Visual Regression Tests for TreeListy
 *
 * These tests capture screenshots at key states to detect visual regressions.
 * They complement functional tests by ensuring the UI renders correctly.
 *
 * Usage:
 *   npm run test:visual          - Run visual tests
 *   npm run test:visual:update   - Update baseline screenshots
 *
 * Note: First run will create baseline screenshots. Subsequent runs compare against baselines.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Use live site if TEST_URL is set, otherwise localhost
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Visual test configuration
const VISUAL_TEST_CONFIG = {
    threshold: 0.2,           // Allow 20% pixel difference
    maxDiffPixels: 500,       // Allow up to 500 different pixels
    animations: 'disabled'    // Disable animations for consistent screenshots
};

// Helper to load test fixture
function loadFixture(name) {
    const fixturePath = path.join(__dirname, '..', 'fixtures', `${name}.json`);
    if (fs.existsSync(fixturePath)) {
        return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    }
    throw new Error(`Fixture not found: ${fixturePath}`);
}

test.describe('Visual Regression - App States', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to app
        await page.goto(BASE_URL + '/treeplexity.html');

        // Wait for app initialization
        await page.waitForFunction(() =>
            typeof window.render === 'function',
            { timeout: 15000 }
        );

        // Disable animations for consistent screenshots
        await page.addStyleTag({
            content: `
                *, *::before, *::after {
                    transition: none !important;
                    animation: none !important;
                }
            `
        });
    });

    test('VR-1: Default app state (welcome tree)', async ({ page }) => {
        // Wait for welcome tree to render
        await page.waitForSelector('.tree-node, #tree-container', { timeout: 10000 });
        await page.waitForTimeout(500); // Allow render to complete

        // Take screenshot of full page
        await expect(page).toHaveScreenshot('vr-01-default-state.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });

    test('VR-2: Tree view with expanded nodes', async ({ page }) => {
        // Expand all nodes
        await page.evaluate(() => {
            if (typeof window.expandAll === 'function') {
                window.expandAll();
            }
        });
        await page.waitForTimeout(300);

        // Screenshot tree container
        const treeContainer = page.locator('#tree-container');
        await expect(treeContainer).toHaveScreenshot('vr-02-expanded-tree.png', {
            ...VISUAL_TEST_CONFIG
        });
    });

    test('VR-3: Node info panel open', async ({ page }) => {
        // Click on first tree node to open info panel
        const firstNode = page.locator('.tree-node').first();
        await firstNode.click();
        await page.waitForTimeout(300);

        // Check info panel is visible
        const infoPanel = page.locator('#info-panel');
        await expect(infoPanel).toBeVisible({ timeout: 5000 });

        await expect(page).toHaveScreenshot('vr-03-info-panel.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });

    test('VR-4: TreeBeard panel open', async ({ page }) => {
        // Open TreeBeard with keyboard shortcut
        await page.keyboard.press('Control+/');
        await page.waitForTimeout(300);

        // Verify panel is open
        const tbPanel = page.locator('#tb-panel, [class*="treebeard"]').first();
        await expect(tbPanel).toBeVisible({ timeout: 5000 });

        await expect(page).toHaveScreenshot('vr-04-treebeard-panel.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });

    test('VR-5: Dashboard modal', async ({ page }) => {
        // Open dashboard with keyboard shortcut
        await page.keyboard.press('Control+d');
        await page.waitForTimeout(300);

        // Verify modal is open
        const dashboardModal = page.locator('#dashboard-modal, [class*="dashboard"]').first();
        await expect(dashboardModal).toBeVisible({ timeout: 5000 });

        await expect(page).toHaveScreenshot('vr-05-dashboard-modal.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });
});

test.describe('Visual Regression - View Modes', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL + '/treeplexity.html');
        await page.waitForFunction(() =>
            typeof window.render === 'function',
            { timeout: 15000 }
        );

        // Disable animations
        await page.addStyleTag({
            content: `*, *::before, *::after { transition: none !important; animation: none !important; }`
        });
    });

    test('VR-10: Canvas view', async ({ page }) => {
        // Switch to canvas view
        await page.evaluate(() => {
            if (typeof window.switchView === 'function') {
                window.switchView('canvas');
            }
        });
        await page.waitForTimeout(500);

        // Verify canvas is visible
        const canvasContainer = page.locator('#canvas-container, canvas').first();
        await expect(canvasContainer).toBeVisible({ timeout: 5000 });

        await expect(page).toHaveScreenshot('vr-10-canvas-view.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });

    test('VR-11: Gantt view', async ({ page }) => {
        // Switch to Gantt view
        await page.evaluate(() => {
            if (typeof window.switchView === 'function') {
                window.switchView('gantt');
            }
        });
        await page.waitForTimeout(500);

        // Verify Gantt container visible
        const ganttContainer = page.locator('#gantt-container, [class*="gantt"]').first();
        await expect(ganttContainer).toBeVisible({ timeout: 5000 });

        await expect(page).toHaveScreenshot('vr-11-gantt-view.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });

    test('VR-12: Mind Map view', async ({ page }) => {
        // Switch to mind map view
        await page.evaluate(() => {
            if (typeof window.switchView === 'function') {
                window.switchView('mindmap');
            }
        });
        await page.waitForTimeout(500);

        await expect(page).toHaveScreenshot('vr-12-mindmap-view.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });
});

test.describe('Visual Regression - Import States', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL + '/treeplexity.html');
        await page.waitForFunction(() =>
            typeof window.render === 'function' && typeof window.capexTree !== 'undefined',
            { timeout: 15000 }
        );

        await page.addStyleTag({
            content: `*, *::before, *::after { transition: none !important; animation: none !important; }`
        });
    });

    test('VR-20: After importing generic tree', async ({ page }) => {
        // Load and inject generic test tree
        const testTree = loadFixture('generic-test-tree');

        await page.evaluate((tree) => {
            window.capexTree = tree;
            if (typeof window.render === 'function') window.render();
        }, testTree);
        await page.waitForTimeout(300);

        // CRITICAL: Verify tree is VISIBLE (Build 790 regression test)
        const treeContent = page.locator('.tree-node, .node-name').first();
        await expect(treeContent).toBeVisible({ timeout: 5000 });

        await expect(page).toHaveScreenshot('vr-20-generic-tree-imported.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });

    test('VR-21: After importing Gmail tree', async ({ page }) => {
        // Load and inject Gmail test tree
        const gmailTree = loadFixture('gmail-test-tree');

        await page.evaluate((tree) => {
            window.capexTree = tree;
            if (typeof window.render === 'function') window.render();
            if (typeof window.populateInboxPanel === 'function') window.populateInboxPanel();
        }, gmailTree);
        await page.waitForTimeout(300);

        // CRITICAL: Verify Gmail tree is VISIBLE (Build 790 regression)
        const gmailContent = page.locator('text=/Gmail|Meeting|Invoice/i').first();
        await expect(gmailContent).toBeVisible({ timeout: 5000 });

        await expect(page).toHaveScreenshot('vr-21-gmail-tree-imported.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });
});

test.describe('Visual Regression - Mobile Viewport', () => {
    test.use({
        viewport: { width: 375, height: 667 } // iPhone SE dimensions
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL + '/treeplexity.html');
        await page.waitForFunction(() =>
            typeof window.render === 'function',
            { timeout: 15000 }
        );

        await page.addStyleTag({
            content: `*, *::before, *::after { transition: none !important; animation: none !important; }`
        });
    });

    test('VR-30: Mobile tree view', async ({ page }) => {
        await page.waitForSelector('.tree-node, #tree-container', { timeout: 10000 });
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot('vr-30-mobile-tree.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });

    test('VR-31: Mobile TreeBeard panel', async ({ page }) => {
        await page.keyboard.press('Control+/');
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot('vr-31-mobile-treebeard.png', {
            fullPage: true,
            ...VISUAL_TEST_CONFIG
        });
    });
});
