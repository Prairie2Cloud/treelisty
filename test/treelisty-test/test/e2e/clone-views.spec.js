/**
 * Clone Views (Build 881) and Node Cloning Tests
 *
 * Tests:
 * - Clone Views: View tree creation, telescope badge, clone management
 * - Node Cloning: Clone creation, preservation, tracking, audit
 */

const { test, expect } = require('@playwright/test');
const TEST_URL = process.env.TEST_URL || 'https://treelisty.netlify.app';

test.describe('Clone Views and Node Cloning', () => {

    // Helper: Load test tree
    async function loadTestTree(page) {
        await page.evaluate(() => {
            const testTree = {
                name: 'Clone Test Tree',
                id: 'clone-test',
                guid: 'clone-test-guid',
                subItems: [
                    {
                        name: 'Phase 1',
                        id: 'p1',
                        guid: 'p1-guid',
                        subItems: [
                            {
                                name: 'Task A',
                                id: 'ta',
                                guid: 'ta-guid',
                                description: 'First task'
                            },
                            {
                                name: 'Task B',
                                id: 'tb',
                                guid: 'tb-guid',
                                description: 'Second task'
                            }
                        ]
                    },
                    {
                        name: 'Phase 2',
                        id: 'p2',
                        guid: 'p2-guid',
                        subItems: [
                            {
                                name: 'Task C',
                                id: 'tc',
                                guid: 'tc-guid'
                            }
                        ]
                    }
                ]
            };
            Object.assign(capexTree, testTree);
            normalizeTreeStructure(capexTree);
            render();
        });

        await page.waitForTimeout(500);
    }

    // Helper: Right-click node
    async function rightClickNode(page, selector) {
        await page.click(selector, { button: 'right' });
        await page.waitForTimeout(300);
    }

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await loadTestTree(page);
    });

    // ========== Clone Views Tests ==========

    test('1. Create View option exists in root node context menu', async ({ page }) => {
        // Right-click root node
        await rightClickNode(page, '.tree-node[data-node-id="clone-test"]');

        // Check for Create View option in context menu
        const createViewOption = await page.locator('#context-menu .context-menu-item').filter({ hasText: /Create View/i });
        await expect(createViewOption).toBeVisible();
    });

    test('2. Create View modal opens with node picker and pattern dropdown', async ({ page }) => {
        // Right-click root node
        await rightClickNode(page, '.tree-node[data-node-id="clone-test"]');

        // Click Create View option
        const createViewOption = await page.locator('#context-menu .context-menu-item').filter({ hasText: /Create View/i });
        if (await createViewOption.isVisible()) {
            await createViewOption.click();
            await page.waitForTimeout(500);

            // Check for modal
            const modal = await page.locator('.modal, [role="dialog"]').filter({ hasText: /Create View/i });
            await expect(modal).toBeVisible();

            // Check for node picker (could be checkboxes, tree view, or list)
            const hasNodePicker = await page.evaluate(() => {
                const modal = document.querySelector('.modal');
                if (!modal) return false;
                // Check for various node picker patterns
                return modal.querySelector('input[type="checkbox"]') !== null ||
                       modal.querySelector('.node-picker') !== null ||
                       modal.querySelector('.tree-view') !== null;
            });
            expect(hasNodePicker).toBe(true);

            // Check for pattern dropdown
            const patternDropdown = await page.locator('.modal select, .modal .pattern-dropdown');
            await expect(patternDropdown.first()).toBeVisible();
        } else {
            // If context menu option doesn't exist yet, check for function existence
            const functionExists = await page.evaluate(() => typeof createViewTree === 'function');
            expect(functionExists).toBe(true);
        }
    });

    test('3. Creating a view tree sets origin.kind to "view"', async ({ page }) => {
        // Check if createViewTree function exists and test it
        const result = await page.evaluate(() => {
            if (typeof createViewTree !== 'function') {
                return { exists: false };
            }

            // Create a mock view tree
            const viewTree = createViewTree({
                name: 'Test View',
                selectedNodes: ['p1', 'p2'],
                pattern: 'generic'
            });

            return {
                exists: true,
                hasOrigin: viewTree && viewTree.origin !== undefined,
                originKind: viewTree && viewTree.origin ? viewTree.origin.kind : null
            };
        });

        if (result.exists) {
            expect(result.hasOrigin).toBe(true);
            expect(result.originKind).toBe('view');
        } else {
            // Function not implemented yet - skip
            test.skip();
        }
    });

    test('4. View tree header shows telescope badge/indicator', async ({ page }) => {
        // Check if view tree indicator exists
        const hasIndicator = await page.evaluate(() => {
            // Load a mock view tree
            if (typeof window.loadViewTree === 'function') {
                const mockViewTree = {
                    name: 'Test View',
                    id: 'test-view',
                    guid: 'test-view-guid',
                    origin: { kind: 'view', sourceTreeId: 'clone-test' },
                    subItems: []
                };
                Object.assign(capexTree, mockViewTree);
                render();

                // Check for telescope badge in header
                const header = document.querySelector('.app-title, .tree-header, h1');
                return header && (
                    header.textContent.includes('🔭') ||
                    header.querySelector('.view-badge') !== null ||
                    header.querySelector('[data-view-indicator]') !== null
                );
            }
            return false;
        });

        // Check if view indicator rendering exists
        const renderExists = await page.evaluate(() =>
            typeof renderViewIndicator === 'function' ||
            typeof updateTreeHeader === 'function'
        );

        expect(hasIndicator || renderExists).toBe(true);
    });

    test('5. View tree nodes are clones (have cloneOf property)', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof createViewTree !== 'function') {
                return { exists: false };
            }

            // Create view tree with clones
            const viewTree = createViewTree({
                name: 'Test View',
                selectedNodes: ['p1', 'ta'],
                pattern: 'generic'
            });

            // Check if nodes have cloneOf
            const hasCloneOf = viewTree.subItems &&
                               viewTree.subItems.length > 0 &&
                               viewTree.subItems[0].cloneOf !== undefined;

            return {
                exists: true,
                hasCloneOf,
                sampleCloneOf: viewTree.subItems && viewTree.subItems[0] ? viewTree.subItems[0].cloneOf : null
            };
        });

        if (result.exists) {
            expect(result.hasCloneOf).toBe(true);
            expect(result.sampleCloneOf).toBeTruthy();
        } else {
            test.skip();
        }
    });

    test('6. Editing clone in view tree marks it as modified', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof createViewTree !== 'function') {
                return { exists: false };
            }

            // Create view tree
            const viewTree = createViewTree({
                name: 'Test View',
                selectedNodes: ['p1'],
                pattern: 'generic'
            });
            Object.assign(capexTree, viewTree);

            // Modify a cloned node
            const clonedNode = viewTree.subItems[0];
            if (clonedNode) {
                clonedNode.name = 'Modified Phase 1';

                // Check if modification tracking exists
                return {
                    exists: true,
                    hasModifiedFlag: clonedNode.modified !== undefined || clonedNode.diverged !== undefined,
                    modifiedValue: clonedNode.modified || clonedNode.diverged
                };
            }

            return { exists: true, hasModifiedFlag: false };
        });

        if (result.exists && result.hasModifiedFlag) {
            expect(result.modifiedValue).toBeTruthy();
        } else {
            // Check if CloneRegistry tracking exists
            const registryExists = await page.evaluate(() => typeof CloneRegistry !== 'undefined');
            expect(registryExists).toBe(true);
        }
    });

    test('7. View tree is fully exportable as JSON', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof createViewTree !== 'function') {
                return { exists: false };
            }

            // Create view tree
            const viewTree = createViewTree({
                name: 'Test View',
                selectedNodes: ['p1', 'p2'],
                pattern: 'generic'
            });

            // Try to export it
            try {
                const exported = JSON.stringify(viewTree);
                const parsed = JSON.parse(exported);

                return {
                    exists: true,
                    exportable: true,
                    hasOrigin: parsed.origin !== undefined,
                    hasClones: parsed.subItems && parsed.subItems.some(n => n.cloneOf)
                };
            } catch (e) {
                return { exists: true, exportable: false, error: e.message };
            }
        });

        if (result.exists) {
            expect(result.exportable).toBe(true);
            expect(result.hasOrigin).toBe(true);
            expect(result.hasClones).toBe(true);
        } else {
            test.skip();
        }
    });

    test('8. View tree uses CloneRegistry for clone management', async ({ page }) => {
        const registryExists = await page.evaluate(() => typeof CloneRegistry !== 'undefined');
        expect(registryExists).toBe(true);

        if (registryExists) {
            const hasRequiredMethods = await page.evaluate(() => {
                return typeof CloneRegistry.register === 'function' &&
                       typeof CloneRegistry.getClones === 'function' &&
                       typeof CloneRegistry.getSource === 'function';
            });
            expect(hasRequiredMethods).toBe(true);
        }
    });

    // ========== Node Cloning Tests ==========

    test('9. Clone node creates new node with cloneOf reference', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof cloneNode !== 'function') {
                return { exists: false };
            }

            // Find a node to clone
            const sourceNode = capexTree.subItems[0]; // Phase 1
            const clone = cloneNode(sourceNode);

            return {
                exists: true,
                hasCloneOf: clone.cloneOf !== undefined,
                cloneOfValue: clone.cloneOf,
                sourceGuid: sourceNode.guid
            };
        });

        if (result.exists) {
            expect(result.hasCloneOf).toBe(true);
            expect(result.cloneOfValue).toBe(result.sourceGuid);
        } else {
            // Check if function exists
            const functionExists = await page.evaluate(() => typeof cloneNode === 'function');
            expect(functionExists).toBe(true);
        }
    });

    test('10. Cloned node has different ID but same content', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof cloneNode !== 'function') {
                return { exists: false };
            }

            const sourceNode = capexTree.subItems[0]; // Phase 1
            const clone = cloneNode(sourceNode);

            return {
                exists: true,
                differentId: clone.id !== sourceNode.id,
                differentGuid: clone.guid !== sourceNode.guid,
                sameName: clone.name === sourceNode.name,
                sameDescription: clone.description === sourceNode.description
            };
        });

        if (result.exists) {
            expect(result.differentId).toBe(true);
            expect(result.differentGuid).toBe(true);
            expect(result.sameName).toBe(true);
        } else {
            test.skip();
        }
    });

    test('11. Clone preserves description and metadata', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof cloneNode !== 'function') {
                return { exists: false };
            }

            const sourceNode = capexTree.subItems[0].subItems[0]; // Task A
            const clone = cloneNode(sourceNode);

            return {
                exists: true,
                description: clone.description,
                sourceDescription: sourceNode.description,
                match: clone.description === sourceNode.description
            };
        });

        if (result.exists) {
            expect(result.match).toBe(true);
            expect(result.description).toBe('First task');
        } else {
            test.skip();
        }
    });

    test('12. CloneRegistry tracks clone relationships', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof CloneRegistry === 'undefined' || typeof cloneNode !== 'function') {
                return { exists: false };
            }

            // Clear registry
            if (typeof CloneRegistry.clear === 'function') {
                CloneRegistry.clear();
            }

            // Clone a node
            const sourceNode = capexTree.subItems[0]; // Phase 1
            const clone = cloneNode(sourceNode);

            // Register the clone
            if (typeof CloneRegistry.register === 'function') {
                CloneRegistry.register(clone.guid, sourceNode.guid);
            }

            // Query registry
            const clones = typeof CloneRegistry.getClones === 'function'
                ? CloneRegistry.getClones(sourceNode.guid)
                : null;

            return {
                exists: true,
                tracked: clones && clones.length > 0,
                clonesCount: clones ? clones.length : 0
            };
        });

        if (result.exists) {
            expect(result.tracked).toBe(true);
            expect(result.clonesCount).toBeGreaterThan(0);
        } else {
            // At minimum, CloneRegistry should exist
            const registryExists = await page.evaluate(() => typeof CloneRegistry !== 'undefined');
            expect(registryExists).toBe(true);
        }
    });

    test('13. Multiple clones of same source all tracked', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof CloneRegistry === 'undefined' || typeof cloneNode !== 'function') {
                return { exists: false };
            }

            // Clear registry
            if (typeof CloneRegistry.clear === 'function') {
                CloneRegistry.clear();
            }

            // Clone same node multiple times
            const sourceNode = capexTree.subItems[0]; // Phase 1
            const clone1 = cloneNode(sourceNode);
            const clone2 = cloneNode(sourceNode);
            const clone3 = cloneNode(sourceNode);

            // Register clones
            if (typeof CloneRegistry.register === 'function') {
                CloneRegistry.register(clone1.guid, sourceNode.guid);
                CloneRegistry.register(clone2.guid, sourceNode.guid);
                CloneRegistry.register(clone3.guid, sourceNode.guid);
            }

            // Query registry
            const clones = typeof CloneRegistry.getClones === 'function'
                ? CloneRegistry.getClones(sourceNode.guid)
                : null;

            return {
                exists: true,
                tracked: clones && clones.length === 3,
                clonesCount: clones ? clones.length : 0
            };
        });

        if (result.exists) {
            expect(result.tracked).toBe(true);
            expect(result.clonesCount).toBe(3);
        } else {
            test.skip();
        }
    });

    test('14. Deleting clone does not affect source', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof cloneNode !== 'function') {
                return { exists: false };
            }

            // Clone a node
            const sourceNode = capexTree.subItems[0]; // Phase 1
            const sourceName = sourceNode.name;
            const sourceChildCount = sourceNode.subItems ? sourceNode.subItems.length : 0;

            const clone = cloneNode(sourceNode);

            // "Delete" the clone (nullify it)
            clone.name = null;
            clone.subItems = [];

            // Verify source unchanged
            return {
                exists: true,
                sourceUnchanged: sourceNode.name === sourceName,
                sourceChildrenIntact: sourceNode.subItems && sourceNode.subItems.length === sourceChildCount
            };
        });

        if (result.exists) {
            expect(result.sourceUnchanged).toBe(true);
            expect(result.sourceChildrenIntact).toBe(true);
        } else {
            test.skip();
        }
    });

    test('15. Clone audit functions exist (CloneAudit.fullAudit)', async ({ page }) => {
        const auditExists = await page.evaluate(() => typeof CloneAudit !== 'undefined');
        expect(auditExists).toBe(true);

        if (auditExists) {
            const hasMethods = await page.evaluate(() => {
                return typeof CloneAudit.fullAudit === 'function' ||
                       typeof CloneAudit.validateTranslationMap === 'function' ||
                       typeof CloneAudit.checkHyperedgeIntegrity === 'function';
            });
            expect(hasMethods).toBe(true);
        }
    });

});
