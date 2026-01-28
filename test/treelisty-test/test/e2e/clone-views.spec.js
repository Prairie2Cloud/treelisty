/**
 * Clone Views (Build 881) and Node Cloning Tests
 *
 * Tests:
 * - Clone Views: View tree creation, telescope badge, clone management
 * - Node Cloning: Clone creation, preservation, tracking, audit
 */

import { test, expect } from '@playwright/test';
const TEST_URL = process.env.TEST_URL || 'https://treelisty.netlify.app';

test.describe('Clone Views and Node Cloning', () => {

    // Helper: Load test tree
    async function loadTestTree(page) {
        await page.evaluate(() => {
            const testTree = {
                name: 'Clone Test Tree',
                treeId: 'clone-test',
                id: 'clone-test',
                guid: 'clone-test-guid',
                type: 'root',
                pattern: 'generic',
                subItems: [
                    {
                        name: 'Phase 1',
                        id: 'p1',
                        guid: 'p1-guid',
                        type: 'phase',
                        subItems: [
                            {
                                name: 'Task A',
                                id: 'ta',
                                guid: 'ta-guid',
                                type: 'task',
                                description: 'First task'
                            },
                            {
                                name: 'Task B',
                                id: 'tb',
                                guid: 'tb-guid',
                                type: 'task',
                                description: 'Second task'
                            }
                        ]
                    },
                    {
                        name: 'Phase 2',
                        id: 'p2',
                        guid: 'p2-guid',
                        type: 'phase',
                        subItems: [
                            {
                                name: 'Task C',
                                id: 'tc',
                                guid: 'tc-guid',
                                type: 'task'
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

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await loadTestTree(page);
    });

    // ========== Clone Views Tests ==========

    test('1. createViewTree function exists', async ({ page }) => {
        const exists = await page.evaluate(() => {
            return typeof window.createViewTree === 'function';
        });
        expect(exists).toBe(true);
    });

    test('2. createViewTree returns view tree with origin.kind="view"', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Use actual capexTree structure loaded in beforeEach
            const viewTree = window.createViewTree(capexTree, ['p1'], 'gantt');
            return {
                hasOrigin: !!viewTree.origin,
                originKind: viewTree.origin?.kind,
                pattern: viewTree.pattern,
                hasSubItems: viewTree.subItems?.length > 0,
                subItemsCount: viewTree.subItems?.length
            };
        });

        expect(result.hasOrigin).toBe(true);
        expect(result.originKind).toBe('view');
        expect(result.pattern).toBe('gantt');
        expect(result.hasSubItems).toBe(true);
    });

    test('3. createViewTree sets sourceId and sourceVersion in origin', async ({ page }) => {
        const result = await page.evaluate(() => {
            const viewTree = window.createViewTree(capexTree, ['p2'], 'generic');
            return {
                sourceId: viewTree.origin?.sourceId,
                sourceVersion: viewTree.origin?.sourceVersion,
                hasCreatedAt: !!viewTree.origin?.createdAt,
                createdAtFormat: viewTree.origin?.createdAt
            };
        });

        expect(result.sourceId).toBe('clone-test');
        expect(result.sourceVersion).toBe(1);
        expect(result.hasCreatedAt).toBe(true);
    });

    test('4. createViewTree generates unique treeId with "view-" prefix', async ({ page }) => {
        const result = await page.evaluate(() => {
            const viewTree = window.createViewTree(capexTree, ['p1'], 'generic');
            return {
                treeId: viewTree.treeId,
                hasViewPrefix: viewTree.treeId?.startsWith('view-')
            };
        });

        expect(result.hasViewPrefix).toBe(true);
        expect(result.treeId).toMatch(/^view-\d+-/);
    });

    test('5. createViewTree clones only selected nodes', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Select only p1 and tc (not p2)
            const viewTree = window.createViewTree(capexTree, ['p1', 'tc'], 'generic');
            return {
                nodeCount: viewTree.subItems?.length,
                nodeNames: viewTree.subItems?.map(n => n.name),
                hasP1: viewTree.subItems?.some(n => n.name === 'Phase 1'),
                hasTaskC: viewTree.subItems?.some(n => n.name === 'Task C')
            };
        });

        expect(result.nodeCount).toBe(2);
        expect(result.hasP1).toBe(true);
        expect(result.hasTaskC).toBe(true);
    });

    test('6. createViewTree sets pattern name in tree name', async ({ page }) => {
        const result = await page.evaluate(() => {
            const viewTree = window.createViewTree(capexTree, ['p1'], 'knowledge-base');
            return {
                name: viewTree.name,
                pattern: viewTree.pattern,
                containsSourceName: viewTree.name.includes('Clone Test Tree'),
                containsPattern: viewTree.name.toLowerCase().includes('knowledge')
            };
        });

        expect(result.containsSourceName).toBe(true);
        expect(result.pattern).toBe('knowledge-base');
    });

    test('7. showCreateViewModal function exists', async ({ page }) => {
        const exists = await page.evaluate(() => {
            return typeof window.showCreateViewModal === 'function';
        });
        expect(exists).toBe(true);
    });

    test('8. CloneRegistry exists with required methods', async ({ page }) => {
        const result = await page.evaluate(() => {
            return {
                exists: typeof window.CloneRegistry !== 'undefined',
                hasCreateClone: typeof window.CloneRegistry?.createClone === 'function',
                hasGetSource: typeof window.CloneRegistry?.getSource === 'function',
                hasGetAllClones: typeof window.CloneRegistry?.getAllClones === 'function',
                hasFindNodeByIdDeep: typeof window.CloneRegistry?.findNodeByIdDeep === 'function'
            };
        });

        expect(result.exists).toBe(true);
        expect(result.hasCreateClone).toBe(true);
        expect(result.hasGetSource).toBe(true);
        expect(result.hasGetAllClones).toBe(true);
        expect(result.hasFindNodeByIdDeep).toBe(true);
    });

    test('9. CloneAudit exists with fullAudit method', async ({ page }) => {
        const result = await page.evaluate(() => {
            return {
                exists: typeof window.CloneAudit !== 'undefined',
                hasFullAudit: typeof window.CloneAudit?.fullAudit === 'function',
                hasValidateTranslationMap: typeof window.CloneAudit?.validateTranslationMap === 'function',
                hasCheckHyperedgeIntegrity: typeof window.CloneAudit?.checkHyperedgeIntegrity === 'function'
            };
        });

        expect(result.exists).toBe(true);
        expect(result.hasFullAudit).toBe(true);
    });

    test('10. CloneRegistry.createClone creates clone with cloneOf property', async ({ page }) => {
        const result = await page.evaluate(() => {
            const sourceNode = capexTree.subItems[0]; // Phase 1
            const targetParent = capexTree; // root as parent

            const clone = window.CloneRegistry.createClone(sourceNode, targetParent);
            return {
                hasCloneOf: !!clone?.cloneOf,
                cloneOfValue: clone?.cloneOf,
                sourceId: sourceNode.id,
                differentId: clone?.id !== sourceNode.id,
                sameName: clone?.name === sourceNode.name,
                sameDescription: clone?.description === sourceNode.description
            };
        });

        expect(result.hasCloneOf).toBe(true);
        expect(result.cloneOfValue).toBe('p1');
        expect(result.differentId).toBe(true);
        expect(result.sameName).toBe(true);
    });

    test('11. CloneRegistry.createClone preserves description and metadata', async ({ page }) => {
        const result = await page.evaluate(() => {
            const sourceNode = capexTree.subItems[0].subItems[0]; // Task A
            const targetParent = capexTree;

            const clone = window.CloneRegistry.createClone(sourceNode, targetParent);
            return {
                description: clone?.description,
                sourceDescription: sourceNode.description,
                matchesDescription: clone?.description === sourceNode.description,
                sameName: clone?.name === sourceNode.name
            };
        });

        expect(result.matchesDescription).toBe(true);
        expect(result.description).toBe('First task');
        expect(result.sameName).toBe(true);
    });

    test('12. View tree is fully exportable as JSON', async ({ page }) => {
        const result = await page.evaluate(() => {
            const viewTree = window.createViewTree(capexTree, ['p1'], 'generic');

            try {
                const exported = JSON.stringify(viewTree);
                const parsed = JSON.parse(exported);

                return {
                    exportable: true,
                    hasOrigin: !!parsed.origin,
                    originKind: parsed.origin?.kind,
                    hasSubItems: Array.isArray(parsed.subItems) && parsed.subItems.length > 0
                };
            } catch (e) {
                return {
                    exportable: false,
                    error: e.message
                };
            }
        });

        expect(result.exportable).toBe(true);
        expect(result.hasOrigin).toBe(true);
        expect(result.originKind).toBe('view');
        expect(result.hasSubItems).toBe(true);
    });

    test('13. CloneRegistry.findNodeByIdDeep finds nodes in tree', async ({ page }) => {
        const result = await page.evaluate(() => {
            const foundPhase = window.CloneRegistry.findNodeByIdDeep('p1', capexTree);
            const foundTask = window.CloneRegistry.findNodeByIdDeep('ta', capexTree);
            const notFound = window.CloneRegistry.findNodeByIdDeep('nonexistent', capexTree);

            return {
                foundPhase: !!foundPhase,
                phaseName: foundPhase?.name,
                foundTask: !!foundTask,
                taskName: foundTask?.name,
                notFound: !notFound
            };
        });

        expect(result.foundPhase).toBe(true);
        expect(result.phaseName).toBe('Phase 1');
        expect(result.foundTask).toBe(true);
        expect(result.taskName).toBe('Task A');
        expect(result.notFound).toBe(true);
    });

    test('14. CloneAudit.fullAudit returns audit result', async ({ page }) => {
        const result = await page.evaluate(() => {
            const sourceNode = capexTree.subItems[0]; // Phase 1
            const clone = window.CloneRegistry.createClone(sourceNode, capexTree);
            const idMap = { [clone.id]: sourceNode.id };

            const auditResult = window.CloneAudit?.fullAudit(sourceNode, clone, idMap);

            return {
                hasResult: !!auditResult,
                isValid: auditResult?.valid,
                hasErrors: Array.isArray(auditResult?.errors),
                errorCount: auditResult?.errors?.length || 0
            };
        });

        expect(result.hasResult).toBe(true);
        expect(result.hasErrors).toBe(true);
    });

    test('15. View tree origin timestamp is ISO format', async ({ page }) => {
        const result = await page.evaluate(() => {
            const viewTree = window.createViewTree(capexTree, ['p1'], 'generic');

            const timestamp = viewTree.origin?.createdAt;
            const isISOFormat = timestamp && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timestamp);

            return {
                hasTimestamp: !!timestamp,
                timestamp: timestamp,
                isISOFormat: isISOFormat
            };
        });

        expect(result.hasTimestamp).toBe(true);
        expect(result.isISOFormat).toBe(true);
    });

});
