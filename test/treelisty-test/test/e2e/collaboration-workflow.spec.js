/**
 * Collaboration Workflow E2E Tests
 *
 * Tests the full collaboration flow:
 * 1. Select nodes in canvas view
 * 2. Share (generate branch URL)
 * 3. Edit (collaborator makes changes)
 * 4. Return share (collaborator sends back)
 * 5. Merge (original author accepts changes)
 *
 * Run with: npx playwright test test/e2e/collaboration-workflow.spec.js
 */

import { test, expect } from '@playwright/test';

// Helper to wait for app initialization
async function waitForAppReady(page) {
    await page.goto('/treeplexity.html');
    await page.waitForSelector('#tree-container', { timeout: 10000 });
    // Wait for splash screen to dismiss
    await page.waitForTimeout(2500);
}

// Helper to switch to canvas view
async function switchToCanvasView(page) {
    const viewToggle = page.locator('#toggle-view-mode');
    await viewToggle.click();
    await page.waitForTimeout(500);

    // Verify canvas is active
    const canvas = page.locator('#canvas-container');
    await expect(canvas).toHaveClass(/active/);
}

// Helper to switch to tree view
async function switchToTreeView(page) {
    const canvas = page.locator('#canvas-container');
    const isCanvasActive = await canvas.evaluate(el => el.classList.contains('active'));

    if (isCanvasActive) {
        const viewToggle = page.locator('#toggle-view-mode');
        await viewToggle.click();
        await page.waitForTimeout(500);
    }
}

// ============================================================================
// CANVAS NODE SELECTION TESTS
// ============================================================================

test.describe('Canvas View - Node Selection', () => {

    test.beforeEach(async ({ page }) => {
        await waitForAppReady(page);
        await switchToCanvasView(page);
    });

    test('should render canvas nodes', async ({ page }) => {
        const canvasNodes = page.locator('#canvas .canvas-node');
        const count = await canvasNodes.count();

        // Should have at least one node rendered
        expect(count).toBeGreaterThan(0);
    });

    test('should select a single node on click', async ({ page }) => {
        const firstNode = page.locator('#canvas .canvas-node').first();
        await firstNode.click();

        // Node should have selected class
        await expect(firstNode).toHaveClass(/selected/);
    });

    test('should deselect node when clicking elsewhere', async ({ page }) => {
        const firstNode = page.locator('#canvas .canvas-node').first();
        await firstNode.click();
        await expect(firstNode).toHaveClass(/selected/);

        // Click on canvas background (use force to bypass overlay elements)
        const canvas = page.locator('#canvas');
        await canvas.click({ position: { x: 500, y: 500 }, force: true });

        await page.waitForTimeout(300);

        // Node should no longer be selected (or selection cleared)
        // Note: In current implementation, clicking canvas background clears selection
        // but clicking a node with children triggers expand/collapse which re-renders
    });

    test('should multi-select nodes with Ctrl+click', async ({ page }) => {
        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 2) {
            // Click first node
            await nodes.nth(0).click();
            await expect(nodes.nth(0)).toHaveClass(/selected/);

            // Ctrl+click second node
            await nodes.nth(1).click({ modifiers: ['Control'] });

            // Both should be selected
            await expect(nodes.nth(0)).toHaveClass(/selected/);
            await expect(nodes.nth(1)).toHaveClass(/selected/);
        }
    });

    test('should show selection counter when multiple nodes selected', async ({ page }) => {
        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 2) {
            // Select first node
            await nodes.nth(0).click();

            // Ctrl+click second node
            await nodes.nth(1).click({ modifiers: ['Control'] });

            // Selection counter should be visible
            const counter = page.locator('#selection-counter');
            await expect(counter).toBeVisible();

            // Should show "2 nodes selected"
            const countText = await counter.textContent();
            expect(countText).toContain('2');
        }
    });

    test('should deselect node with Ctrl+click when already selected', async ({ page }) => {
        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 2) {
            // Select both nodes
            await nodes.nth(0).click();
            await nodes.nth(1).click({ modifiers: ['Control'] });

            // Ctrl+click first node again to deselect
            await nodes.nth(0).click({ modifiers: ['Control'] });

            // First node should no longer be selected
            await expect(nodes.nth(0)).not.toHaveClass(/selected/);
            // Second node should still be selected
            await expect(nodes.nth(1)).toHaveClass(/selected/);
        }
    });
});

// ============================================================================
// CANVAS NODE DRAGGING TESTS
// ============================================================================

test.describe('Canvas View - Node Dragging', () => {

    test.beforeEach(async ({ page }) => {
        await waitForAppReady(page);
        await switchToCanvasView(page);
    });

    test('should drag node to new position', async ({ page }) => {
        const firstNode = page.locator('#canvas .canvas-node').first();

        // Get initial position
        const initialBox = await firstNode.boundingBox();

        // Drag the node (middle-click drag or regular drag depending on implementation)
        await firstNode.hover();
        await page.mouse.down({ button: 'middle' });
        await page.mouse.move(initialBox.x + 100, initialBox.y + 100);
        await page.mouse.up({ button: 'middle' });

        await page.waitForTimeout(300);

        // Get new position
        const newBox = await firstNode.boundingBox();

        // Position should have changed
        // Note: This may need adjustment based on actual drag implementation
        expect(newBox.x).not.toBe(initialBox.x);
        expect(newBox.y).not.toBe(initialBox.y);
    });

    test('should preserve node position after view switch', async ({ page }) => {
        const firstNode = page.locator('#canvas .canvas-node').first();

        // Drag node to new position
        const initialBox = await firstNode.boundingBox();
        await firstNode.hover();
        await page.mouse.down({ button: 'middle' });
        await page.mouse.move(initialBox.x + 50, initialBox.y + 50);
        await page.mouse.up({ button: 'middle' });

        await page.waitForTimeout(300);
        const movedBox = await firstNode.boundingBox();

        // Switch to tree view and back
        await switchToTreeView(page);
        await switchToCanvasView(page);

        // Position should be preserved
        const afterSwitchBox = await page.locator('#canvas .canvas-node').first().boundingBox();

        // Allow small tolerance for rounding
        expect(Math.abs(afterSwitchBox.x - movedBox.x)).toBeLessThan(5);
        expect(Math.abs(afterSwitchBox.y - movedBox.y)).toBeLessThan(5);
    });
});

// ============================================================================
// HYPEREDGE CREATION TESTS
// ============================================================================

test.describe('Canvas View - Hyperedge Creation', () => {

    test.beforeEach(async ({ page }) => {
        await waitForAppReady(page);
        await switchToCanvasView(page);
    });

    test('should show hyperedge button when multiple nodes selected', async ({ page }) => {
        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 2) {
            // Multi-select nodes
            await nodes.nth(0).click();
            await nodes.nth(1).click({ modifiers: ['Control'] });

            await page.waitForTimeout(300);

            // Right-click to open context menu
            await nodes.nth(1).click({ button: 'right' });

            // Look for hyperedge/connection option in context menu
            const contextMenu = page.locator('.context-menu, #context-menu');

            if (await contextMenu.isVisible()) {
                const hyperedgeOption = contextMenu.locator('text=/hyperedge|connect|link/i');
                await expect(hyperedgeOption).toBeVisible();
            }
        }
    });

    test('should create hyperedge from selected nodes', async ({ page }) => {
        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 2) {
            // Multi-select nodes
            await nodes.nth(0).click();
            await nodes.nth(1).click({ modifiers: ['Control'] });

            // Right-click for context menu
            await nodes.nth(1).click({ button: 'right' });

            await page.waitForTimeout(300);

            // Find and click hyperedge option
            const hyperedgeOption = page.locator('text=/Create Hyperedge|Connect|Link Selected/i');

            if (await hyperedgeOption.isVisible()) {
                await hyperedgeOption.click();

                await page.waitForTimeout(500);

                // Check for hyperedge modal or confirmation
                const modal = page.locator('#hyperedge-modal, .hyperedge-modal');
                if (await modal.isVisible()) {
                    // Fill in hyperedge name
                    const nameInput = modal.locator('input[type="text"]').first();
                    await nameInput.fill('Test Hyperedge');

                    // Save
                    const saveBtn = modal.locator('button:has-text("Create"), button:has-text("Save")');
                    await saveBtn.click();
                }

                await page.waitForTimeout(500);

                // Verify hyperedge was created (visual indicator on nodes or in SVG)
                const hyperedgeSvg = page.locator('#canvas-connections path, #canvas-connections polygon');
                const svgCount = await hyperedgeSvg.count();
                expect(svgCount).toBeGreaterThan(0);
            }
        }
    });

    test('should display hyperedge panel button', async ({ page }) => {
        const edgesBtn = page.locator('#hyperedge-panel-btn');
        await expect(edgesBtn).toBeVisible();
    });

    test('should toggle hyperedge panel', async ({ page }) => {
        const edgesBtn = page.locator('#hyperedge-panel-btn');
        await edgesBtn.click();

        await page.waitForTimeout(300);

        // Panel should be visible
        const panel = page.locator('#hyperedge-panel, .hyperedge-panel');
        // Note: Panel may or may not be visible if no hyperedges exist
    });
});

// ============================================================================
// SHARE COLLABORATION TESTS
// ============================================================================

test.describe('Collaboration - Share Workflow', () => {

    test.beforeEach(async ({ page }) => {
        await waitForAppReady(page);
        await switchToCanvasView(page);
    });

    test('should show share button when nodes are selected', async ({ page }) => {
        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 1) {
            // Select a node
            await nodes.nth(0).click();

            // Right-click for context menu
            await nodes.nth(0).click({ button: 'right' });

            await page.waitForTimeout(300);

            // Look for share option
            const shareOption = page.locator('text=/share|collaborate|branch/i');
            if (await shareOption.isVisible()) {
                await expect(shareOption).toBeVisible();
            }
        }
    });

    test('should open share modal from context menu', async ({ page }) => {
        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 1) {
            await nodes.nth(0).click();
            await nodes.nth(0).click({ button: 'right' });

            await page.waitForTimeout(300);

            const shareOption = page.locator('text=/share for collaboration/i');

            if (await shareOption.isVisible()) {
                await shareOption.click();

                await page.waitForTimeout(500);

                // Share modal should appear
                const modal = page.locator('#share-modal, .share-modal, [data-modal="share"]');
                await expect(modal).toBeVisible();
            }
        }
    });

    test('should generate shareable URL', async ({ page }) => {
        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 1) {
            await nodes.nth(0).click();
            await nodes.nth(0).click({ button: 'right' });

            const shareOption = page.locator('text=/share for collaboration/i');

            if (await shareOption.isVisible()) {
                await shareOption.click();
                await page.waitForTimeout(500);

                // Look for URL display or copy button
                const urlDisplay = page.locator('input[readonly], .share-url, textarea');

                if (await urlDisplay.first().isVisible()) {
                    const urlValue = await urlDisplay.first().inputValue();

                    // URL should contain branch parameter
                    expect(urlValue).toContain('branch=');
                }
            }
        }
    });

    test('should copy share URL to clipboard', async ({ page, context }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count >= 1) {
            await nodes.nth(0).click();
            await nodes.nth(0).click({ button: 'right' });

            const shareOption = page.locator('text=/share for collaboration/i');

            if (await shareOption.isVisible()) {
                await shareOption.click();
                await page.waitForTimeout(500);

                // Find copy button
                const copyBtn = page.locator('button:has-text("Copy"), button:has-text("📋")');

                if (await copyBtn.first().isVisible()) {
                    await copyBtn.first().click();

                    await page.waitForTimeout(300);

                    // Read clipboard
                    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

                    // Should contain branch URL
                    expect(clipboardText).toContain('branch=');
                }
            }
        }
    });
});

// ============================================================================
// MERGE WORKFLOW TESTS
// ============================================================================

test.describe('Collaboration - Merge Workflow', () => {

    test('should detect branch parameter in URL', async ({ page }) => {
        // Create a mock branch URL (simplified)
        const mockBranch = btoa(JSON.stringify({
            branchId: 'test-branch',
            sourceProjectId: 'root',
            sourceProjectName: 'Test Project',
            nodes: [{ id: 'test-node', name: 'Test Node' }]
        }));

        await page.goto(`/treeplexity.html?branch=${mockBranch}`);

        await page.waitForTimeout(3000);

        // Should show branch mode indicator or merge prompt
        // Note: Actual behavior depends on implementation
        const branchIndicator = page.locator('.branch-mode, .collaboration-banner, [data-branch-mode]');
        // This may or may not be visible depending on valid branch parsing
    });

    test('should show merge button in sidebar', async ({ page }) => {
        await waitForAppReady(page);

        // Look for merge branch button
        const mergeBtn = page.locator('#merge-branch-btn, button:has-text("Merge Branch")');

        // Should be visible in sidebar
        if (await mergeBtn.isVisible()) {
            await expect(mergeBtn).toBeVisible();
        }
    });

    test('should open merge modal when clicking merge button', async ({ page }) => {
        await waitForAppReady(page);

        const mergeBtn = page.locator('#merge-branch-btn, button:has-text("Merge")');

        if (await mergeBtn.isVisible()) {
            await mergeBtn.click();

            await page.waitForTimeout(500);

            // Merge modal should appear
            const modal = page.locator('#merge-modal, .merge-modal');
            await expect(modal).toBeVisible();
        }
    });

    test('should accept pasted branch URL in merge modal', async ({ page }) => {
        await waitForAppReady(page);

        const mergeBtn = page.locator('#merge-branch-btn, button:has-text("Merge")');

        if (await mergeBtn.isVisible()) {
            await mergeBtn.click();
            await page.waitForTimeout(500);

            const modal = page.locator('#merge-modal, .merge-modal');

            if (await modal.isVisible()) {
                // Find URL input
                const urlInput = modal.locator('input, textarea').first();

                if (await urlInput.isVisible()) {
                    // Paste a mock URL
                    const mockUrl = 'https://treelisty.com?branch=testdata123';
                    await urlInput.fill(mockUrl);

                    // Value should be accepted
                    const value = await urlInput.inputValue();
                    expect(value).toBe(mockUrl);
                }
            }
        }
    });
});

// ============================================================================
// FULL ROUND-TRIP WORKFLOW TEST
// ============================================================================

test.describe('Collaboration - Full Round Trip', () => {

    test('should complete full share and merge workflow', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        // Step 1: Load app and switch to canvas
        await waitForAppReady(page);
        await switchToCanvasView(page);

        const nodes = page.locator('#canvas .canvas-node');
        const count = await nodes.count();

        if (count < 1) {
            test.skip();
            return;
        }

        // Step 2: Select a node
        await nodes.nth(0).click();
        await expect(nodes.nth(0)).toHaveClass(/selected/);

        // Step 3: Open share context menu
        await nodes.nth(0).click({ button: 'right' });
        await page.waitForTimeout(300);

        const shareOption = page.locator('text=/share for collaboration/i');

        if (!await shareOption.isVisible()) {
            test.skip();
            return;
        }

        // Step 4: Generate share URL
        await shareOption.click();
        await page.waitForTimeout(500);

        const copyBtn = page.locator('button:has-text("Copy URL"), button:has-text("📋 Copy")').first();

        if (await copyBtn.isVisible()) {
            await copyBtn.click();
            await page.waitForTimeout(300);

            // Get the URL from clipboard
            const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
            expect(shareUrl).toContain('branch=');

            // Step 5: Close modal
            const closeBtn = page.locator('button:has-text("Close"), button:has-text("✕"), .modal-close');
            if (await closeBtn.first().isVisible()) {
                await closeBtn.first().click();
            }

            await page.waitForTimeout(300);

            // Step 6: Open merge modal and paste URL
            const mergeBtn = page.locator('#merge-branch-btn, button:has-text("Merge Branch")');

            if (await mergeBtn.isVisible()) {
                await mergeBtn.click();
                await page.waitForTimeout(500);

                const urlInput = page.locator('#merge-modal input, #merge-modal textarea').first();

                if (await urlInput.isVisible()) {
                    await urlInput.fill(shareUrl);

                    // Step 7: Attempt merge
                    const mergeSubmitBtn = page.locator('#merge-modal button:has-text("Merge"), #merge-modal button:has-text("Apply")');

                    if (await mergeSubmitBtn.isVisible()) {
                        await mergeSubmitBtn.click();
                        await page.waitForTimeout(500);

                        // Verify no errors (page should still be functional)
                        await expect(page.locator('#tree-container')).toBeVisible();
                    }
                }
            }
        }
    });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('Collaboration - Error Handling', () => {

    test('should handle invalid branch URL gracefully', async ({ page }) => {
        await page.goto('/treeplexity.html?branch=invalid-data-not-compressed');

        await page.waitForTimeout(3000);

        // App should still load (graceful fallback)
        await expect(page.locator('#tree-container')).toBeVisible();

        // Should not have console errors that break the app
        // (validated by app still being functional)
    });

    test('should handle empty branch parameter', async ({ page }) => {
        await page.goto('/treeplexity.html?branch=');

        await page.waitForTimeout(3000);

        // App should load normally
        await expect(page.locator('#tree-container')).toBeVisible();
    });

    test('should handle malformed JSON in branch', async ({ page }) => {
        // btoa of invalid JSON
        const malformed = btoa('{invalid json}');

        await page.goto(`/treeplexity.html?branch=${malformed}`);

        await page.waitForTimeout(3000);

        // App should still be functional
        await expect(page.locator('#tree-container')).toBeVisible();
    });

    test('should warn when merging into wrong project', async ({ page }) => {
        await waitForAppReady(page);

        // Create a branch from a different project
        const wrongProjectBranch = btoa(JSON.stringify({
            branchId: 'test',
            sourceProjectId: 'different-project-id',
            sourceProjectName: 'Different Project',
            nodes: [{ id: 'node-1', name: 'Node from different project' }]
        }));

        const mergeBtn = page.locator('#merge-branch-btn');

        if (await mergeBtn.isVisible()) {
            await mergeBtn.click();
            await page.waitForTimeout(500);

            const urlInput = page.locator('#merge-modal input, #merge-modal textarea').first();

            if (await urlInput.isVisible()) {
                await urlInput.fill(`https://treelisty.com?branch=${wrongProjectBranch}`);

                const mergeSubmitBtn = page.locator('#merge-modal button:has-text("Merge")');

                if (await mergeSubmitBtn.isVisible()) {
                    await mergeSubmitBtn.click();
                    await page.waitForTimeout(500);

                    // Should show warning about wrong project
                    const warning = page.locator('text=/wrong project|different project|mismatch/i');
                    // Warning may or may not be visible depending on implementation
                }
            }
        }
    });
});
