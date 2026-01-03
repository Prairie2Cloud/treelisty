/**
 * Live Site Critical Path E2E Tests
 *
 * Tests against https://treelisty.netlify.app
 * Run with: TEST_URL=https://treelisty.netlify.app npx playwright test test/e2e/live-critical-paths.spec.js
 */

import { test, expect } from '@playwright/test';

const LIVE_URL = process.env.TEST_URL || 'https://treelisty.netlify.app';

// Sample tree for import testing
const TEST_TREE = {
    id: 'test-import-tree',
    name: 'E2E Test Import',
    type: 'root',
    children: [
        {
            id: 'phase-1',
            name: 'Phase 1',
            type: 'phase',
            items: [
                { id: 'item-1', name: 'Item 1', type: 'item' },
                { id: 'item-2', name: 'Item 2', type: 'item' }
            ]
        },
        {
            id: 'phase-2',
            name: 'Phase 2',
            type: 'phase',
            items: []
        }
    ]
};

test.describe('Live Site - Application Loading', () => {

    test('should load without JavaScript errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Filter known/acceptable errors
        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('ResizeObserver') &&
            !e.includes('Extension context')
        );

        expect(criticalErrors).toHaveLength(0);
    });

    test('should display tree structure', async ({ page }) => {
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-root', { timeout: 15000 });

        const treeRoot = page.locator('#tree-root');
        await expect(treeRoot).toBeVisible();

        // Should have at least one node
        const nodes = page.locator('#tree-root .node-content, #tree-root .phase, #tree-root .item');
        const count = await nodes.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should have correct build version', async ({ page }) => {
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });

        const version = await page.evaluate(() => window.TREELISTY_VERSION);
        expect(version).toBeDefined();
        expect(version.build).toBeGreaterThanOrEqual(700);
    });
});

test.describe('Live Site - Tree Import', () => {

    test('should import JSON tree via JavaScript', async ({ page }) => {
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Import tree via window function
        const result = await page.evaluate((tree) => {
            if (typeof loadTree === 'function') {
                loadTree(tree);
                return { success: true, method: 'loadTree' };
            } else if (typeof capexTree !== 'undefined') {
                Object.assign(capexTree, tree);
                if (typeof normalizeTreeStructure === 'function') {
                    normalizeTreeStructure(capexTree);
                }
                if (typeof render === 'function') {
                    render();
                }
                return { success: true, method: 'direct' };
            }
            return { success: false };
        }, TEST_TREE);

        expect(result.success).toBe(true);

        // Verify tree was imported
        await page.waitForTimeout(1000);
        const treeName = await page.evaluate(() => capexTree?.name);
        expect(treeName).toBe('E2E Test Import');
    });

    test('should count imported nodes correctly', async ({ page }) => {
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Import test tree
        await page.evaluate((tree) => {
            if (typeof loadTree === 'function') {
                loadTree(tree);
            } else {
                Object.assign(capexTree, tree);
                normalizeTreeStructure(capexTree);
                render();
            }
        }, TEST_TREE);

        await page.waitForTimeout(1000);

        // Count nodes
        const nodeCount = await page.evaluate(() => {
            function countNodes(node) {
                let count = 1;
                (node.children || []).forEach(c => count += countNodes(c));
                (node.items || []).forEach(c => count += countNodes(c));
                (node.subtasks || []).forEach(c => count += countNodes(c));
                return count;
            }
            return countNodes(capexTree);
        });

        // TEST_TREE has: root + 2 phases + 2 items = 5 nodes
        expect(nodeCount).toBe(5);
    });
});

test.describe('Live Site - View Switching', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });
        await page.waitForTimeout(2000);
    });

    test('should switch to Canvas view', async ({ page }) => {
        // Open view dropdown
        await page.click('#view-dropdown-btn');
        await page.waitForTimeout(200);

        // Click Canvas option
        await page.click('#view-canvas-btn');
        await page.waitForTimeout(1500);

        // Canvas container should be visible
        const canvas = page.locator('#canvas-container');
        await expect(canvas).toBeVisible();
    });

    test('should switch to 3D view', async ({ page }) => {
        await page.click('#view-dropdown-btn');
        await page.waitForTimeout(200);

        await page.click('#view-3d-btn');
        await page.waitForTimeout(3000); // 3D takes longer to load

        // Verify 3D mode is active by checking viewMode or container
        const is3DActive = await page.evaluate(() => {
            return window.viewMode === '3d' ||
                   document.querySelector('#three-container') !== null ||
                   document.querySelector('canvas') !== null;
        });
        expect(is3DActive).toBe(true);
    });

    test('should return to Tree view', async ({ page }) => {
        // Switch to Canvas first
        await page.click('#view-dropdown-btn');
        await page.waitForTimeout(200);
        await page.click('#view-canvas-btn');
        await page.waitForTimeout(1000);

        // Switch back to Tree
        await page.click('#view-dropdown-btn');
        await page.waitForTimeout(200);
        await page.click('#view-tree-btn');
        await page.waitForTimeout(1000);

        // Tree view should be active
        const treeContainer = page.locator('#tree-container');
        await expect(treeContainer).toBeVisible();
    });
});

test.describe('Live Site - TreeBeard Commands', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Import a clean test tree
        await page.evaluate((tree) => {
            if (typeof loadTree === 'function') {
                loadTree(tree);
            } else {
                Object.assign(capexTree, tree);
                normalizeTreeStructure(capexTree);
                render();
            }
        }, TEST_TREE);
        await page.waitForTimeout(1000);
    });

    test('should open TreeBeard panel', async ({ page }) => {
        // Click TreeBeard button or use Ctrl+/
        const tbBtn = page.locator('#chat-assistant-btn');
        if (await tbBtn.isVisible()) {
            await tbBtn.click();
        } else {
            await page.keyboard.press('Control+/');
        }

        await page.waitForTimeout(500);

        // TreeBeard panel should be visible
        const tbPanel = page.locator('#chat-assistant-panel, #floating-chat-container');
        await expect(tbPanel).toBeVisible();
    });

    test('should accept input in TreeBeard', async ({ page }) => {
        // Open TreeBeard
        const tbBtn = page.locator('#chat-assistant-btn');
        if (await tbBtn.isVisible()) {
            await tbBtn.click();
        } else {
            await page.keyboard.press('Control+/');
        }

        // Wait for panel animation to complete
        await page.waitForTimeout(1000);

        // Find input field - use the one inside the visible chat panel
        const input = page.locator('#chat-assistant-input').first();
        await expect(input).toBeVisible({ timeout: 5000 });

        await input.fill('expand_all');
        await expect(input).toHaveValue('expand_all');
    });

    test('should have send button in TreeBeard', async ({ page }) => {
        // Open TreeBeard
        const tbBtn = page.locator('#chat-assistant-btn');
        if (await tbBtn.isVisible()) {
            await tbBtn.click();
        } else {
            await page.keyboard.press('Control+/');
        }
        await page.waitForTimeout(500);

        // Send button should exist (use specific ID selector)
        const sendBtn = page.locator('#chat-send-btn');
        await expect(sendBtn).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Live Site - Export', () => {

    test('should export tree as JSON', async ({ page }) => {
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Import test tree
        await page.evaluate((tree) => {
            if (typeof loadTree === 'function') {
                loadTree(tree);
            } else {
                Object.assign(capexTree, tree);
                normalizeTreeStructure(capexTree);
                render();
            }
        }, TEST_TREE);

        await page.waitForTimeout(500);

        // Get exported JSON
        const exported = await page.evaluate(() => {
            return JSON.stringify(capexTree);
        });

        const parsed = JSON.parse(exported);
        expect(parsed.name).toBe('E2E Test Import');
        expect(parsed.children.length).toBe(2);
    });

    test('should have save functionality available', async ({ page }) => {
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // Verify save button exists in DOM (may be in dropdown menu)
        const hasSaveBtn = await page.evaluate(() => {
            return document.querySelector('#save-json-btn') !== null ||
                   document.querySelector('[data-action="save"]') !== null ||
                   document.querySelector('button[title*="Save"]') !== null;
        });
        expect(hasSaveBtn).toBe(true);
    });
});

test.describe('Live Site - Mobile Viewport', () => {

    test('should render on iPhone viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });

        // App should be functional
        await expect(page.locator('#tree-container')).toBeVisible();

        // No critical overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(375 + 50); // Allow small margin
    });

    test('should have functional controls on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(LIVE_URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });

        // Core controls should still be accessible on mobile
        // Pattern selector or view controls should be visible
        const hasControls = await page.evaluate(() => {
            const patternSelect = document.getElementById('pattern-select');
            const viewBtn = document.getElementById('view-dropdown-btn');
            const saveBtn = document.getElementById('save-json-btn');
            return !!(patternSelect || viewBtn || saveBtn);
        });
        expect(hasControls).toBe(true);
    });
});
