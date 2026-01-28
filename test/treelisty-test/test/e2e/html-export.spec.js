/**
 * HTML Export with Block Refs E2E Tests (Build 880)
 *
 * Tests standalone HTML export functionality including:
 * - Export button presence
 * - Content completeness
 * - Self-contained nature (no external dependencies)
 * - Block reference resolution (local, cross-tree, broken)
 * - Anchor ID generation for linking
 * - CSS styling for different ref types
 * - Hierarchy preservation
 */

import { test, expect } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'https://treelisty.netlify.app';

// Test timeout for CI environments
test.setTimeout(30000);

/**
 * Load test tree with block references
 */
async function loadTestTree(page) {
    await page.evaluate(() => {
        const testTree = {
            name: 'Export Test Tree',
            id: 'export-test',
            guid: 'export-test-guid',
            subItems: [
                {
                    name: 'Section A',
                    id: 'sa',
                    guid: 'sa-guid',
                    description: 'See ((sb))'
                },
                {
                    name: 'Section B',
                    id: 'sb',
                    guid: 'sb-guid',
                    description: 'Has cross ref ((other-tree:node1))'
                },
                {
                    name: 'Section C',
                    id: 'sc',
                    guid: 'sc-guid',
                    description: 'Broken ref ((nonexistent))'
                },
                {
                    name: 'Section D',
                    id: 'sd',
                    guid: 'sd-guid',
                    description: 'Parent section',
                    subItems: [
                        {
                            name: 'Subsection D.1',
                            id: 'sd1',
                            guid: 'sd1-guid',
                            description: 'Child with ref to ((sa))'
                        }
                    ]
                }
            ]
        };
        Object.assign(capexTree, testTree);
        normalizeTreeStructure(capexTree);
        render();
    });
    // Wait for render to complete
    await page.waitForTimeout(1000);
}

/**
 * Wait for function to be available in global scope
 */
async function waitForFunction(page, functionName, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const exists = await page.evaluate((fname) => {
            return typeof window[fname] === 'function';
        }, functionName);
        if (exists) return true;
        await page.waitForTimeout(100);
    }
    return false;
}

test.describe('HTML Export with Block Refs', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await loadTestTree(page);

        // Wait for export functions to be available
        await waitForFunction(page, 'exportAsStandaloneHTML');
        await waitForFunction(page, 'resolveBlockRefsForExport');
    });

    test('1. Export as HTML button exists in export dropdown', async ({ page }) => {
        // Open export dropdown
        const exportButton = page.locator('button:has-text("Export")');
        await exportButton.click();
        await page.waitForTimeout(300);

        // Check for Export as HTML option
        const htmlExportOption = page.locator('#export-html-btn');
        await expect(htmlExportOption).toBeVisible({ timeout: 5000 });
    });

    test('2. Exported HTML contains all node names from tree', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return window.exportAsStandaloneHTML();
        });

        // Verify all node names are present
        expect(exportedHTML).toContain('Export Test Tree');
        expect(exportedHTML).toContain('Section A');
        expect(exportedHTML).toContain('Section B');
        expect(exportedHTML).toContain('Section C');
        expect(exportedHTML).toContain('Section D');
        expect(exportedHTML).toContain('Subsection D.1');
    });

    test('3. Exported HTML is self-contained (no external dependencies)', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return window.exportAsStandaloneHTML();
        });

        // Check for self-contained structure
        expect(exportedHTML).toContain('<!DOCTYPE html>');
        expect(exportedHTML).toContain('<html');
        expect(exportedHTML).toContain('<head>');
        expect(exportedHTML).toContain('<body>');

        // Ensure CSS is inline (no external stylesheets)
        expect(exportedHTML).toContain('<style>');
        expect(exportedHTML).not.toContain('<link rel="stylesheet"');

        // Ensure no external script dependencies (except TreeListy link which is just a link)
        const scriptSrcPattern = /<script[^>]+src="https?:\/\//;
        expect(exportedHTML).not.toMatch(scriptSrcPattern);
    });

    test('4. Local block refs in export become anchor links', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return window.exportAsStandaloneHTML();
        });

        // Section A references Section B with ((sb))
        // Should become: <a href="#node-sb" class="tl-block-ref">
        expect(exportedHTML).toContain('class="tl-block-ref"');
        expect(exportedHTML).toContain('href="#node-sb"');

        // Subsection D.1 references Section A with ((sa))
        expect(exportedHTML).toContain('href="#node-sa"');
    });

    test('5. Cross-tree refs in export become styled spans (not clickable)', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return window.exportAsStandaloneHTML();
        });

        // Section B has cross-tree ref ((other-tree:node1))
        // Should become: <span class="tl-block-ref-ext">
        expect(exportedHTML).toContain('tl-block-ref-ext');

        // Verify it's not an anchor link
        const crossTreeRefText = 'other-tree:node1';
        expect(exportedHTML).toContain(crossTreeRefText);

        // Should be in a span, not an <a> tag
        const hasAnchorToCrossTree = exportedHTML.includes(`<a href="#node-other-tree:node1"`);
        expect(hasAnchorToCrossTree).toBe(false);
    });

    test('6. Broken refs in export get .tl-block-ref-broken class', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return window.exportAsStandaloneHTML();
        });

        // Section C has broken ref ((nonexistent))
        // Should become: <span class="tl-block-ref-broken">
        expect(exportedHTML).toContain('tl-block-ref-broken');

        // Should preserve the ((nonexistent)) text
        expect(exportedHTML).toContain('nonexistent');
    });

    test('7. Exported nodes have anchor IDs for linking', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return window.exportAsStandaloneHTML();
        });

        // Check that nodes have anchor IDs based on their id
        expect(exportedHTML).toContain('id="node-sa"');
        expect(exportedHTML).toContain('id="node-sb"');
        expect(exportedHTML).toContain('id="node-sc"');
        expect(exportedHTML).toContain('id="node-sd"');
        expect(exportedHTML).toContain('id="node-sd1"');
    });

    test('8. Export CSS includes block ref style classes', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return window.exportAsStandaloneHTML();
        });

        // Extract CSS content from style tag
        const styleMatch = exportedHTML.match(/<style>([\s\S]*?)<\/style>/);
        expect(styleMatch).toBeTruthy();

        if (styleMatch) {
            const cssContent = styleMatch[1];

            // Verify CSS includes all three block ref classes
            expect(cssContent).toContain('.tl-block-ref');
            expect(cssContent).toContain('.tl-block-ref-ext');
            expect(cssContent).toContain('.tl-block-ref-broken');
        }
    });

    test('9. Export preserves tree hierarchy (nested divs)', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return window.exportAsStandaloneHTML();
        });

        // Section D should contain Subsection D.1 in nested structure
        expect(exportedHTML).toContain('Section D');
        expect(exportedHTML).toContain('Subsection D.1');

        // Check that parent appears before child in document order
        const parentIndex = exportedHTML.indexOf('id="node-sd"');
        const childIndex = exportedHTML.indexOf('id="node-sd1"');
        expect(parentIndex).toBeGreaterThan(0);
        expect(childIndex).toBeGreaterThan(0);
        expect(parentIndex).toBeLessThan(childIndex);

        // Check for tl-children wrapper around nested nodes
        expect(exportedHTML).toContain('class="tl-children"');
    });

    test('10. resolveBlockRefsForExport converts local refs correctly', async ({ page }) => {
        const result = await page.evaluate(() => {
            return window.resolveBlockRefsForExport('See ((sb)) for details');
        });

        // Should contain anchor link
        expect(result).toContain('<a href="#node-sb"');
        expect(result).toContain('class="tl-block-ref"');
        expect(result).toContain('📌');
    });

    test('11. resolveBlockRefsForExport converts cross-tree refs correctly', async ({ page }) => {
        const result = await page.evaluate(() => {
            return window.resolveBlockRefsForExport('See ((other-tree:node1)) in external tree');
        });

        // Should contain styled span for cross-tree ref
        expect(result).toContain('class="tl-block-ref-ext"');
        expect(result).not.toContain('<a href=');
    });
});

test.describe('HTML Export Function Availability', () => {
    test('resolveBlockRefsForExport function exists', async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await waitForFunction(page, 'resolveBlockRefsForExport');

        const functionExists = await page.evaluate(() => {
            return typeof window.resolveBlockRefsForExport === 'function';
        });

        expect(functionExists).toBe(true);
    });

    test('exportAsStandaloneHTML function exists', async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await waitForFunction(page, 'exportAsStandaloneHTML');

        const functionExists = await page.evaluate(() => {
            return typeof window.exportAsStandaloneHTML === 'function';
        });

        expect(functionExists).toBe(true);
    });
});
