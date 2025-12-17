/**
 * Console Error Detection Tests
 *
 * These tests capture browser console errors during key user flows.
 * This catches runtime errors like "X is not defined" that unit tests miss.
 *
 * Run with: npm run test:e2e
 */

import { test, expect } from '@playwright/test';

test.describe('Console Error Detection', () => {

    test('should load without console errors', async ({ page }) => {
        const errors = [];

        // Capture console errors
        page.on('pageerror', error => {
            errors.push(error.message);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container', { timeout: 10000 });

        // Wait for initialization to complete
        await page.waitForTimeout(3000);

        // Filter out known non-critical errors (e.g., favicon, service worker, network)
        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('service-worker') &&
            !e.includes('chrome-extension') &&
            !e.includes('net::ERR') &&
            !e.includes('Failed to load resource') &&  // Network errors (403, 404)
            !e.includes('manifest')  // Manifest loading errors
        );

        if (criticalErrors.length > 0) {
            console.log('Console errors found:', criticalErrors);
        }

        expect(criticalErrors).toHaveLength(0);
    });

    test('should switch to Canvas View without errors', async ({ page }) => {
        const errors = [];

        page.on('pageerror', error => {
            errors.push(`PageError: ${error.message}`);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(`Console: ${msg.text()}`);
            }
        });

        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await page.waitForTimeout(2500); // Wait for splash

        // Click view toggle to switch to Canvas
        const viewToggle = page.locator('#view-mode-toggle, [data-action="toggle-view"]');
        if (await viewToggle.isVisible()) {
            await viewToggle.click();
            await page.waitForTimeout(1000);
        }

        // Filter non-critical errors
        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('service-worker') &&
            !e.includes('chrome-extension') &&
            !e.includes('net::ERR') &&
            !e.includes('Failed to load resource') &&
            !e.includes('manifest')
        );

        if (criticalErrors.length > 0) {
            console.log('Canvas View errors:', criticalErrors);
        }

        expect(criticalErrors).toHaveLength(0);
    });

    test('should use Canvas Search (Ctrl+F) without errors', async ({ page }) => {
        const errors = [];

        page.on('pageerror', error => {
            errors.push(`PageError: ${error.message}`);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(`Console: ${msg.text()}`);
            }
        });

        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await page.waitForTimeout(2500);

        // Switch to Canvas View
        const viewToggle = page.locator('#view-mode-toggle, [data-action="toggle-view"]');
        if (await viewToggle.isVisible()) {
            await viewToggle.click();
            await page.waitForTimeout(1000);
        }

        // Press Ctrl+F to open search
        await page.keyboard.press('Control+f');
        await page.waitForTimeout(500);

        // Check if search overlay is visible
        const searchOverlay = page.locator('#canvas-search-overlay');
        const isVisible = await searchOverlay.isVisible().catch(() => false);

        if (isVisible) {
            // Type in search box
            const searchInput = page.locator('#canvas-search-input');
            await searchInput.fill('test');
            await page.waitForTimeout(500);

            // Press Enter to navigate
            await searchInput.press('Enter');
            await page.waitForTimeout(300);

            // Press Escape to close
            await searchInput.press('Escape');
            await page.waitForTimeout(300);
        }

        // Filter non-critical errors
        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('service-worker') &&
            !e.includes('chrome-extension') &&
            !e.includes('net::ERR') &&
            !e.includes('Failed to load resource') &&
            !e.includes('manifest')
        );

        if (criticalErrors.length > 0) {
            console.log('Canvas Search errors:', criticalErrors);
        }

        expect(criticalErrors).toHaveLength(0);
    });

    test('should interact with Minimap without errors', async ({ page }) => {
        const errors = [];

        page.on('pageerror', error => {
            errors.push(`PageError: ${error.message}`);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(`Console: ${msg.text()}`);
            }
        });

        await page.goto('/treeplexity.html');
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await page.waitForTimeout(2500);

        // Switch to Canvas View
        const viewToggle = page.locator('#view-mode-toggle, [data-action="toggle-view"]');
        if (await viewToggle.isVisible()) {
            await viewToggle.click();
            await page.waitForTimeout(1000);
        }

        // Click on minimap
        const minimap = page.locator('#canvas-minimap');
        const isVisible = await minimap.isVisible().catch(() => false);

        if (isVisible) {
            // Click center of minimap
            await minimap.click({ position: { x: 100, y: 75 } });
            await page.waitForTimeout(500);
        }

        // Filter non-critical errors
        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('service-worker') &&
            !e.includes('chrome-extension') &&
            !e.includes('net::ERR') &&
            !e.includes('Failed to load resource') &&
            !e.includes('manifest')
        );

        if (criticalErrors.length > 0) {
            console.log('Minimap errors:', criticalErrors);
        }

        expect(criticalErrors).toHaveLength(0);
    });
});
