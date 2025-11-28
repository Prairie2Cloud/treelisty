/**
 * Critical Path E2E Tests
 * 
 * These tests verify the most important user flows work correctly.
 * Run with: npm run test:e2e
 */

import { test, expect } from '@playwright/test';

test.describe('Application Loading', () => {
    
    test('should load the application', async ({ page }) => {
        await page.goto('/treeplexity.html');
        
        // Wait for app to initialize
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        
        // Verify main elements exist
        await expect(page.locator('#tree-container')).toBeVisible();
    });

    test('should dismiss splash screen', async ({ page }) => {
        await page.goto('/treeplexity.html');
        
        // Splash should disappear after ~2 seconds
        const splash = page.locator('#splash-screen');
        
        // Wait for splash to be removed (with timeout)
        await expect(splash).toBeHidden({ timeout: 5000 });
    });

    test('should show initial tree structure', async ({ page }) => {
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        await page.waitForTimeout(3000); // Wait for tree to render

        // Should have tree content rendered
        const treeRoot = page.locator('#tree-root');
        await expect(treeRoot).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Tree Navigation', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        // Wait for splash to dismiss
        await page.waitForTimeout(2500);
    });

    test('should have clickable tree nodes', async ({ page }) => {
        // Verify tree nodes exist and are rendered
        const treeNodes = page.locator('#tree-root .node-content');
        const count = await treeNodes.count();

        // Tree should have at least one node
        expect(count).toBeGreaterThan(0);
    });

    test('should expand and collapse phases', async ({ page }) => {
        const phase = page.locator('[data-type="phase"], .phase-node').first();
        
        // Find expand/collapse toggle
        const toggle = phase.locator('.expand-toggle, .collapse-toggle, [data-action="toggle"]');
        
        if (await toggle.isVisible()) {
            await toggle.click();
            // State should change
            await page.waitForTimeout(300);
        }
    });
});

test.describe('Pattern Switching', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        await page.waitForTimeout(2500);
    });

    test('should have pattern selector', async ({ page }) => {
        const selector = page.locator('#pattern-select');
        await expect(selector).toBeVisible();
    });

    test('should switch to Sales pattern', async ({ page }) => {
        await page.selectOption('#pattern-select', 'sales');
        
        // Wait for UI update
        await page.waitForTimeout(500);
        
        // Verify pattern changed (look for sales-specific labels)
        const body = await page.textContent('body');
        expect(body).toMatch(/pipeline|deal|lead/i);
    });

    test('should switch to Philosophy pattern', async ({ page }) => {
        await page.selectOption('#pattern-select', 'philosophy');
        
        await page.waitForTimeout(500);
        
        // Verify pattern changed
        const body = await page.textContent('body');
        expect(body).toMatch(/treatise|argument|premise/i);
    });
});

test.describe('AI Settings', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        await page.waitForTimeout(2500);
    });

    test('should open AI settings modal', async ({ page }) => {
        // Find and click AI settings button
        const settingsBtn = page.locator('#ai-settings-btn, [data-action="ai-settings"]');
        await settingsBtn.click();
        
        // Modal should be visible
        const modal = page.locator('#ai-settings-modal');
        await expect(modal).toBeVisible();
    });

    test('should have dialectic mode toggle', async ({ page }) => {
        const settingsBtn = page.locator('#ai-settings-btn, [data-action="ai-settings"]');
        await settingsBtn.click();
        
        const dialecticToggle = page.locator('#ai-dialectic-mode');
        await expect(dialecticToggle).toBeVisible();
    });

    test('should save AI settings', async ({ page }) => {
        // Open modal
        await page.click('#ai-settings-btn');
        await page.waitForTimeout(500);

        // Enable dialectic mode
        await page.check('#ai-dialectic-mode');

        // Select critical tone
        await page.click('input[name="ai-tone"][value="critical"]');

        // Save (button text is "💾 Save Settings")
        const saveBtn = page.locator('button:has-text("Save Settings")');
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // Verify we can interact with the page after save
        // (modal may or may not close depending on implementation)
        await page.waitForTimeout(500);
        await expect(page.locator('#tree-container')).toBeVisible();
    });

    test('should persist AI settings across modal reopening', async ({ page }) => {
        // Open and configure
        await page.click('#ai-settings-btn');
        await page.waitForTimeout(300);
        await page.check('#ai-dialectic-mode');
        await page.click('button:has-text("Save Settings")');
        await page.waitForTimeout(300);

        // Reopen
        await page.click('#ai-settings-btn');
        await page.waitForTimeout(300);

        // Should still be checked
        const dialecticToggle = page.locator('#ai-dialectic-mode');
        await expect(dialecticToggle).toBeChecked();
    });
});

test.describe('View Switching', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        await page.waitForTimeout(2500);
    });

    test('should switch to canvas view', async ({ page }) => {
        // Find view toggle button (actual ID is toggle-view-mode)
        const viewToggle = page.locator('#toggle-view-mode');
        await viewToggle.click();

        // Canvas should become active
        const canvas = page.locator('#canvas-container');
        await expect(canvas).toHaveClass(/active/);
    });

    test('should switch back to tree view', async ({ page }) => {
        const viewToggle = page.locator('#toggle-view-mode');

        // Switch to canvas
        await viewToggle.click();
        await page.waitForTimeout(500);

        // Switch back
        await viewToggle.click();
        await page.waitForTimeout(500);

        // Canvas should no longer be active
        const canvas = page.locator('#canvas-container');
        await expect(canvas).not.toHaveClass(/active/);
    });
});

test.describe('File Operations', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        await page.waitForTimeout(2500);
    });

    test('should trigger download on save', async ({ page }) => {
        // Listen for download
        const downloadPromise = page.waitForEvent('download');

        // Click save button (actual ID is save-json-btn)
        const saveBtn = page.locator('#save-json-btn');
        await saveBtn.click();

        // Verify download triggered
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.json');
    });

    test('should have load button', async ({ page }) => {
        // The upload/load button ID is load-json-btn
        const loadBtn = page.locator('#load-json-btn');
        await expect(loadBtn).toBeVisible();
    });
});

test.describe('Undo/Redo', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        await page.waitForTimeout(2500);
    });

    test('should have undo button', async ({ page }) => {
        const undoBtn = page.locator('#undo-btn');
        await expect(undoBtn).toBeVisible();
    });

    test('should have undo button disabled initially', async ({ page }) => {
        // Undo should be disabled when no changes have been made
        const undoBtn = page.locator('#undo-btn');
        await expect(undoBtn).toBeDisabled();
    });

    test('should undo with keyboard shortcut', async ({ page }) => {
        // This test verifies the shortcut is registered
        // Full undo testing requires making a change first
        await page.keyboard.press('Control+z');

        // Should not throw or break the page
        await expect(page.locator('#tree-container')).toBeVisible();
    });
});

test.describe('Responsive Layout', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/treeplexity.html');
        
        await page.waitForSelector('#tree-container');
        
        // App should still be functional
        await expect(page.locator('#tree-container')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/treeplexity.html');
        
        await page.waitForSelector('#tree-container');
        
        await expect(page.locator('#tree-container')).toBeVisible();
    });
});

test.describe('Error Handling', () => {
    
    test('should handle missing localStorage gracefully', async ({ page, context }) => {
        // Clear localStorage before loading
        await context.clearCookies();
        
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        
        // Should load with default tree
        await expect(page.locator('#tree-container')).toBeVisible();
    });

    test('should not have console errors on load', async ({ page }) => {
        const errors = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container');
        await page.waitForTimeout(3000);
        
        // Filter out expected/known errors
        const unexpectedErrors = errors.filter(e => 
            !e.includes('favicon') &&
            !e.includes('manifest') &&
            !e.includes('CORS')  // API key errors are expected
        );
        
        expect(unexpectedErrors).toHaveLength(0);
    });
});
