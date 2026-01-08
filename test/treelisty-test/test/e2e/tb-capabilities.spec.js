/**
 * TREEBEARD CAPABILITIES TEST SUITE
 *
 * Tests TB's ability to understand commands and complete tasks.
 * Covers primary (core) and secondary (extended) capabilities.
 *
 * RUN: npm run test:tb-caps
 *
 * STRUCTURE:
 * - TB-CORE: Fast-path commands (navigation, view, edit)
 * - TB-NL: Natural language understanding
 * - TB-BUILD: Tree building capabilities
 * - TB-ACTION: Multi-step task completion
 * - TB-GMAIL: Email-specific commands (when Gmail tree loaded)
 */

import { test, expect } from '@playwright/test';

const TEST_URL = process.env.TEST_URL || 'https://treelisty.netlify.app';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const TEST_TREE = {
    id: 'tb-test-tree',
    name: 'TB Capability Test Tree',
    treeId: 'tb-test-' + Date.now(),
    pattern: 'generic',
    children: [
        {
            id: 'phase-1',
            name: 'Phase 1: Research',
            type: 'phase',
            expanded: false,
            items: [
                { id: 'item-1-1', name: 'Literature review', type: 'item', description: 'Review existing papers' },
                { id: 'item-1-2', name: 'Market analysis', type: 'item' }
            ]
        },
        {
            id: 'phase-2',
            name: 'Phase 2: Development',
            type: 'phase',
            expanded: false,
            items: [
                { id: 'item-2-1', name: 'Build prototype', type: 'item' },
                { id: 'item-2-2', name: 'Test features', type: 'item' }
            ]
        },
        {
            id: 'phase-3',
            name: 'Phase 3: Launch',
            type: 'phase',
            expanded: false,
            items: []
        }
    ]
};

// Helper to send TB command
async function sendTBCommand(page, command) {
    // Open TB if not open
    const tbPanel = page.locator('#chat-assistant-panel, #floating-chat-container');
    if (!await tbPanel.first().isVisible()) {
        await page.keyboard.press('Control+/');
        await page.waitForTimeout(500);
    }

    // Clear and type command
    const input = page.locator('#chat-assistant-input').first();
    await input.fill('');
    await input.fill(command);

    // Send
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500); // Wait for response
}

// Helper to get TB response
async function getTBResponse(page) {
    const messages = page.locator('#chat-assistant-messages .message, #chat-messages .message');
    const count = await messages.count();
    if (count === 0) return null;

    const lastMessage = messages.last();
    return await lastMessage.textContent();
}

// ============================================================================
// TB-CORE: FAST-PATH COMMANDS
// ============================================================================

test.describe('TB-CORE: Fast-Path Commands', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 30000 });
        await page.waitForTimeout(1000);

        // Load test tree
        await page.evaluate((tree) => {
            window.capexTree = tree;
            if (typeof normalizeTreeStructure === 'function') normalizeTreeStructure(window.capexTree);
            if (typeof render === 'function') render();
        }, TEST_TREE);
        await page.waitForTimeout(500);
    });

    test('TB-CORE-001: expand_all expands all nodes', async ({ page }) => {
        // Verify nodes start collapsed
        const initialExpanded = await page.evaluate(() => {
            let count = 0;
            function check(node) {
                if (node.expanded) count++;
                (node.children || []).forEach(check);
                (node.items || []).forEach(check);
            }
            check(window.capexTree);
            return count;
        });

        await sendTBCommand(page, 'expand_all');

        // Verify all expandable nodes are now expanded
        const afterExpanded = await page.evaluate(() => {
            let count = 0;
            function check(node) {
                if (node.expanded) count++;
                (node.children || []).forEach(check);
                (node.items || []).forEach(check);
            }
            check(window.capexTree);
            return count;
        });

        expect(afterExpanded).toBeGreaterThan(initialExpanded);
    });

    test('TB-CORE-002: collapse_all collapses all nodes', async ({ page }) => {
        // First expand all
        await sendTBCommand(page, 'expand_all');
        await page.waitForTimeout(500);

        // Then collapse
        await sendTBCommand(page, 'collapse_all');

        // Verify collapsed
        const expandedCount = await page.evaluate(() => {
            let count = 0;
            function check(node) {
                if (node.expanded) count++;
                (node.children || []).forEach(check);
                (node.items || []).forEach(check);
            }
            check(window.capexTree);
            return count;
        });

        expect(expandedCount).toBe(0);
    });

    test('TB-CORE-003: focus_node:name focuses specific node', async ({ page }) => {
        await sendTBCommand(page, 'focus_node:Phase 2');

        // Verify selectedNode is set
        const focusedName = await page.evaluate(() => {
            return window.selectedNode?.name || window.selectedNodeId;
        });

        expect(focusedName).toContain('Phase 2');
    });

    test('TB-CORE-004: focus_root returns to root', async ({ page }) => {
        // First focus a child
        await sendTBCommand(page, 'focus_node:Phase 2');
        await page.waitForTimeout(500);

        // Then focus root
        await sendTBCommand(page, 'focus_root');

        const focusedName = await page.evaluate(() => {
            return window.selectedNode?.name || window.capexTree?.name;
        });

        expect(focusedName).toContain('TB Capability Test');
    });

    test('TB-CORE-005: switch_view:canvas switches to canvas', async ({ page }) => {
        await sendTBCommand(page, 'switch_view:canvas');

        const viewMode = await page.evaluate(() => window.viewMode);
        expect(viewMode).toBe('canvas');

        const canvasVisible = await page.locator('#canvas-container').isVisible();
        expect(canvasVisible).toBe(true);
    });

    test('TB-CORE-006: switch_view:tree switches to tree', async ({ page }) => {
        // Start in canvas
        await sendTBCommand(page, 'switch_view:canvas');
        await page.waitForTimeout(1000);

        // Switch to tree
        await sendTBCommand(page, 'switch_view:tree');

        const viewMode = await page.evaluate(() => window.viewMode);
        expect(viewMode).toBe('tree');
    });

    test('TB-CORE-007: undo reverts last change', async ({ page }) => {
        const originalName = await page.evaluate(() => window.capexTree?.name);

        // Make a change
        await page.evaluate(() => {
            window.capexTree.name = 'CHANGED';
            if (typeof saveState === 'function') saveState('Test change');
            if (typeof render === 'function') render();
        });

        // Undo via TB
        await sendTBCommand(page, 'undo');

        const afterUndo = await page.evaluate(() => window.capexTree?.name);
        expect(afterUndo).toBe(originalName);
    });
});

// ============================================================================
// TB-NL: NATURAL LANGUAGE UNDERSTANDING
// ============================================================================

test.describe('TB-NL: Natural Language Commands', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 30000 });
        await page.waitForTimeout(1000);

        await page.evaluate((tree) => {
            window.capexTree = tree;
            if (typeof normalizeTreeStructure === 'function') normalizeTreeStructure(window.capexTree);
            if (typeof render === 'function') render();
        }, TEST_TREE);
    });

    test('TB-NL-001: "expand everything" expands all', async ({ page }) => {
        await sendTBCommand(page, 'expand everything');

        const expandedCount = await page.evaluate(() => {
            let count = 0;
            function check(node) {
                if (node.expanded) count++;
                (node.children || []).forEach(check);
            }
            check(window.capexTree);
            return count;
        });

        expect(expandedCount).toBeGreaterThan(0);
    });

    test('TB-NL-002: "show me the canvas view" switches view', async ({ page }) => {
        await sendTBCommand(page, 'show me the canvas view');

        const viewMode = await page.evaluate(() => window.viewMode);
        expect(viewMode).toBe('canvas');
    });

    test('TB-NL-003: "go to the root" focuses root', async ({ page }) => {
        // First focus something else
        await sendTBCommand(page, 'focus_node:Phase 2');
        await page.waitForTimeout(500);

        await sendTBCommand(page, 'go to the root');

        const isRoot = await page.evaluate(() => {
            const sel = window.selectedNode || window.capexTree;
            return sel?.id === window.capexTree?.id || sel?.type === 'root';
        });

        expect(isRoot).toBe(true);
    });

    test('TB-NL-004: "open 3D mode" switches to 3D', async ({ page }) => {
        await sendTBCommand(page, 'open 3D mode');
        await page.waitForTimeout(2000); // 3D takes longer

        const viewMode = await page.evaluate(() => window.viewMode);
        expect(viewMode).toBe('3d');
    });

    test('TB-NL-005: "take me to Phase 1" focuses node', async ({ page }) => {
        await sendTBCommand(page, 'take me to Phase 1');

        const focusedName = await page.evaluate(() => {
            return window.selectedNode?.name;
        });

        expect(focusedName).toContain('Phase 1');
    });
});

// ============================================================================
// TB-EDIT: EDITING COMMANDS
// ============================================================================

test.describe('TB-EDIT: Editing Commands', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 30000 });
        await page.waitForTimeout(1000);

        await page.evaluate((tree) => {
            window.capexTree = JSON.parse(JSON.stringify(tree)); // Deep copy
            if (typeof normalizeTreeStructure === 'function') normalizeTreeStructure(window.capexTree);
            if (typeof render === 'function') render();
        }, TEST_TREE);
    });

    test('TB-EDIT-001: add_child adds new child node', async ({ page }) => {
        const initialCount = await page.evaluate(() => {
            function count(node) {
                let c = 1;
                (node.children || []).forEach(n => c += count(n));
                (node.items || []).forEach(n => c += count(n));
                return c;
            }
            return count(window.capexTree);
        });

        await sendTBCommand(page, 'add_child:New Task');

        const afterCount = await page.evaluate(() => {
            function count(node) {
                let c = 1;
                (node.children || []).forEach(n => c += count(n));
                (node.items || []).forEach(n => c += count(n));
                return c;
            }
            return count(window.capexTree);
        });

        expect(afterCount).toBe(initialCount + 1);
    });

    test('TB-EDIT-002: rename_node renames current node', async ({ page }) => {
        // Focus a specific node first
        await sendTBCommand(page, 'focus_node:Phase 1');
        await page.waitForTimeout(500);

        await sendTBCommand(page, 'rename_node:Renamed Phase');

        const newName = await page.evaluate(() => {
            return window.selectedNode?.name;
        });

        expect(newName).toBe('Renamed Phase');
    });

    test('TB-EDIT-003: set_description sets node description', async ({ page }) => {
        await sendTBCommand(page, 'focus_node:Phase 1');
        await page.waitForTimeout(500);

        await sendTBCommand(page, 'set_description:This is a test description');

        const desc = await page.evaluate(() => {
            return window.selectedNode?.description;
        });

        expect(desc).toBe('This is a test description');
    });

    test('TB-EDIT-004: delete_node removes node', async ({ page }) => {
        const initialCount = await page.evaluate(() => {
            return (window.capexTree.children || []).length;
        });

        await sendTBCommand(page, 'focus_node:Phase 3');
        await page.waitForTimeout(500);
        await sendTBCommand(page, 'delete_node');

        const afterCount = await page.evaluate(() => {
            return (window.capexTree.children || []).length;
        });

        expect(afterCount).toBe(initialCount - 1);
    });
});

// ============================================================================
// TB-BUILD: TREE BUILDING CAPABILITIES
// ============================================================================

test.describe('TB-BUILD: Tree Building', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 30000 });
        await page.waitForTimeout(1000);
    });

    test('TB-BUILD-001: create_tree creates new tree', async ({ page }) => {
        await sendTBCommand(page, 'create_tree:My New Project');

        const treeName = await page.evaluate(() => window.capexTree?.name);
        expect(treeName).toBe('My New Project');
    });

    test('TB-BUILD-002: Can add multiple children in sequence', async ({ page }) => {
        await sendTBCommand(page, 'create_tree:Sequential Test');
        await page.waitForTimeout(500);

        await sendTBCommand(page, 'add_child:Task 1');
        await page.waitForTimeout(500);

        await sendTBCommand(page, 'add_child:Task 2');
        await page.waitForTimeout(500);

        await sendTBCommand(page, 'add_child:Task 3');
        await page.waitForTimeout(500);

        const childCount = await page.evaluate(() => {
            return (window.capexTree.children || []).length +
                   (window.capexTree.items || []).length;
        });

        expect(childCount).toBeGreaterThanOrEqual(3);
    });
});

// ============================================================================
// TB-ACTION: MULTI-STEP TASK COMPLETION
// ============================================================================

test.describe('TB-ACTION: Task Completion', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 30000 });
        await page.waitForTimeout(1000);

        await page.evaluate((tree) => {
            window.capexTree = JSON.parse(JSON.stringify(tree));
            if (typeof normalizeTreeStructure === 'function') normalizeTreeStructure(window.capexTree);
            if (typeof render === 'function') render();
        }, TEST_TREE);
    });

    test('TB-ACTION-001: Can navigate, edit, and return', async ({ page }) => {
        // Navigate to node
        await sendTBCommand(page, 'focus_node:Literature review');
        await page.waitForTimeout(500);

        // Edit it
        await sendTBCommand(page, 'set_description:Completed review of 50 papers');
        await page.waitForTimeout(500);

        // Return to root
        await sendTBCommand(page, 'focus_root');
        await page.waitForTimeout(500);

        // Verify the edit persisted
        const desc = await page.evaluate(() => {
            function find(node, name) {
                if (node.name?.includes(name)) return node;
                for (const c of (node.children || [])) {
                    const r = find(c, name);
                    if (r) return r;
                }
                for (const i of (node.items || [])) {
                    const r = find(i, name);
                    if (r) return r;
                }
                return null;
            }
            const node = find(window.capexTree, 'Literature review');
            return node?.description;
        });

        expect(desc).toBe('Completed review of 50 papers');
    });

    test('TB-ACTION-002: Can switch views and maintain state', async ({ page }) => {
        // Make a change
        await sendTBCommand(page, 'focus_node:Phase 2');
        await page.waitForTimeout(500);

        const nodeName = await page.evaluate(() => window.selectedNode?.name);

        // Switch to canvas
        await sendTBCommand(page, 'switch_view:canvas');
        await page.waitForTimeout(1000);

        // Switch back
        await sendTBCommand(page, 'switch_view:tree');
        await page.waitForTimeout(1000);

        // Verify tree state
        const treeIntact = await page.evaluate(() => {
            return window.capexTree?.name === 'TB Capability Test Tree';
        });

        expect(treeIntact).toBe(true);
    });

    test('TB-ACTION-003: Undo/redo cycle works correctly', async ({ page }) => {
        const original = await page.evaluate(() => window.capexTree?.name);

        // Make changes
        await page.evaluate(() => {
            window.capexTree.name = 'Change 1';
            if (typeof saveState === 'function') saveState('Change 1');
        });

        await page.evaluate(() => {
            window.capexTree.name = 'Change 2';
            if (typeof saveState === 'function') saveState('Change 2');
        });

        // Undo twice
        await sendTBCommand(page, 'undo');
        await page.waitForTimeout(500);

        const afterFirstUndo = await page.evaluate(() => window.capexTree?.name);
        expect(afterFirstUndo).toBe('Change 1');

        await sendTBCommand(page, 'undo');
        await page.waitForTimeout(500);

        const afterSecondUndo = await page.evaluate(() => window.capexTree?.name);
        expect(afterSecondUndo).toBe(original);

        // Redo
        await sendTBCommand(page, 'redo');
        await page.waitForTimeout(500);

        const afterRedo = await page.evaluate(() => window.capexTree?.name);
        expect(afterRedo).toBe('Change 1');
    });
});

// ============================================================================
// TB-SEARCH: Search Capabilities
// ============================================================================

test.describe('TB-SEARCH: Search Commands', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 30000 });
        await page.waitForTimeout(1000);

        await page.evaluate((tree) => {
            window.capexTree = JSON.parse(JSON.stringify(tree));
            if (typeof normalizeTreeStructure === 'function') normalizeTreeStructure(window.capexTree);
            if (typeof render === 'function') render();
        }, TEST_TREE);
    });

    test('TB-SEARCH-001: search_tree finds matching nodes', async ({ page }) => {
        await sendTBCommand(page, 'search_tree:Phase');

        // Should highlight or list matching nodes
        const response = await getTBResponse(page);
        expect(response).toBeTruthy();
        // Response should mention found nodes
    });

    test('TB-SEARCH-002: find_node locates specific node', async ({ page }) => {
        await sendTBCommand(page, 'find_node:Literature review');

        const focused = await page.evaluate(() => window.selectedNode?.name);
        expect(focused).toContain('Literature');
    });
});

// ============================================================================
// SUMMARY REPORTER
// ============================================================================

test.afterAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('TREEBEARD CAPABILITIES TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('TB-CORE: Fast-path commands');
    console.log('TB-NL: Natural language understanding');
    console.log('TB-EDIT: Editing commands');
    console.log('TB-BUILD: Tree building');
    console.log('TB-ACTION: Multi-step tasks');
    console.log('TB-SEARCH: Search capabilities');
    console.log('='.repeat(60) + '\n');
});
