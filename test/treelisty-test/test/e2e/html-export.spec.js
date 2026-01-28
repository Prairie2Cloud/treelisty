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

const { test, expect } = require('@playwright/test');

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
}

test.describe('HTML Export with Block Refs', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await loadTestTree(page);
    });

    test('1. Export as HTML button exists in export dropdown', async ({ page }) => {
        // Open export dropdown
        const exportButton = page.locator('button:has-text("Export")');
        await exportButton.click();

        // Check for Export as HTML option
        const htmlExportOption = page.locator('text=Export as HTML');
        await expect(htmlExportOption).toBeVisible({ timeout: 5000 });
    });

    test('2. Exported HTML contains all node names from tree', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return exportAsStandaloneHTML();
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
            return exportAsStandaloneHTML();
        });

        // Check for self-contained structure
        expect(exportedHTML).toContain('<!DOCTYPE html>');
        expect(exportedHTML).toContain('<html');
        expect(exportedHTML).toContain('<head>');
        expect(exportedHTML).toContain('<body>');

        // Ensure CSS is inline (no external stylesheets)
        expect(exportedHTML).toContain('<style>');
        expect(exportedHTML).not.toContain('<link rel="stylesheet"');

        // Ensure no external script dependencies
        expect(exportedHTML).not.toContain('<script src="http');
    });

    test('4. Local block refs in export become anchor links', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return exportAsStandaloneHTML();
        });

        // Section A references Section B with ((sb))
        // Should become: <a href="#node-sb" class="tl-block-ref">
        const localRefPattern = /<a\s+href="#node-sb[^"]*"\s+class="tl-block-ref"/;
        expect(exportedHTML).toMatch(localRefPattern);
    });

    test('5. Cross-tree refs in export become styled spans (not clickable)', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return exportAsStandaloneHTML();
        });

        // Section B has cross-tree ref ((other-tree:node1))
        // Should become: <span class="tl-block-ref tl-block-ref-ext">
        expect(exportedHTML).toContain('tl-block-ref-ext');

        // Verify it's a span, not an anchor link to external tree
        const externalRefPattern = /<span[^>]*class="[^"]*tl-block-ref-ext[^"]*"[^>]*>/;
        expect(exportedHTML).toMatch(externalRefPattern);
    });

    test('6. Broken refs in export get .tl-block-ref-broken class', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return exportAsStandaloneHTML();
        });

        // Section C has broken ref ((nonexistent))
        // Should become: <span class="tl-block-ref tl-block-ref-broken">
        expect(exportedHTML).toContain('tl-block-ref-broken');

        // Verify broken ref is styled correctly
        const brokenRefPattern = /<span[^>]*class="[^"]*tl-block-ref-broken[^"]*"[^>]*>/;
        expect(exportedHTML).toMatch(brokenRefPattern);
    });

    test('7. Exported nodes have anchor IDs for linking', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return exportAsStandaloneHTML();
        });

        // Check that nodes have anchor IDs based on their guid
        expect(exportedHTML).toContain('id="node-sa');
        expect(exportedHTML).toContain('id="node-sb');
        expect(exportedHTML).toContain('id="node-sc');
        expect(exportedHTML).toContain('id="node-sd');
        expect(exportedHTML).toContain('id="node-sd1');
    });

    test('8. Export CSS includes block ref style classes', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return exportAsStandaloneHTML();
        });

        // Verify CSS includes all three block ref classes
        expect(exportedHTML).toContain('.tl-block-ref');
        expect(exportedHTML).toContain('.tl-block-ref-ext');
        expect(exportedHTML).toContain('.tl-block-ref-broken');

        // Check that styles are actually defined (not just class names in content)
        const styleSection = exportedHTML.match(/<style>([\s\S]*?)<\/style>/);
        expect(styleSection).toBeTruthy();
        if (styleSection) {
            const cssContent = styleSection[1];
            expect(cssContent).toContain('.tl-block-ref');
            expect(cssContent).toContain('.tl-block-ref-ext');
            expect(cssContent).toContain('.tl-block-ref-broken');
        }
    });

    test('9. Export preserves tree hierarchy (nested divs)', async ({ page }) => {
        const exportedHTML = await page.evaluate(() => {
            return exportAsStandaloneHTML();
        });

        // Section D should contain Subsection D.1 in nested structure
        // Look for pattern where parent div contains child div

        // Simplified check: parent and child nodes exist
        expect(exportedHTML).toContain('Section D');
        expect(exportedHTML).toContain('Subsection D.1');

        // Check for nested div structure (hierarchical indentation)
        // Parent should appear before child in document order
        const parentIndex = exportedHTML.indexOf('Section D');
        const childIndex = exportedHTML.indexOf('Subsection D.1');
        expect(parentIndex).toBeLessThan(childIndex);

        // Check that hierarchy is maintained in HTML structure
        // (Child should be within parent's content area)
        const parentToChildSection = exportedHTML.substring(parentIndex, childIndex);
        // Should not have a closing node div between parent and child
        const nodeClosingPattern = /<\/div>[\s\S]*<div[^>]*class="[^"]*tree-export-node/;
        expect(parentToChildSection).not.toMatch(nodeClosingPattern);
    });
});

test.describe('HTML Export Function Availability', () => {
    test('resolveBlockRefsForExport function exists', async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });

        const functionExists = await page.evaluate(() => {
            return typeof resolveBlockRefsForExport === 'function';
        });

        expect(functionExists).toBe(true);
    });

    test('exportAsStandaloneHTML function exists', async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });

        const functionExists = await page.evaluate(() => {
            return typeof exportAsStandaloneHTML === 'function';
        });

        expect(functionExists).toBe(true);
    });
});
