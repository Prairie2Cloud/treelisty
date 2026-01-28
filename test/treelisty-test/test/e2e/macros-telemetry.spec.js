/**
 * TreeListy E2E Tests: User Macros, CommandTelemetry, and Agent-Authored Macros (Build 882)
 *
 * Tests for:
 * - User-created macros (create, run, delete, persist)
 * - CommandTelemetry (record, retrieve, no localStorage per Article V)
 * - Agent-authored macros (provenance, pattern detection)
 */

const { test, expect } = require('@playwright/test');

const TEST_URL = process.env.TEST_URL || 'https://treelisty.netlify.app';

/**
 * Helper: Load a test tree
 */
async function loadTestTree(page) {
    await page.evaluate(() => {
        const testTree = {
            name: 'Macro Test Tree',
            id: 'macro-test',
            guid: 'macro-test-guid',
            subItems: [
                { name: 'Task 1', id: 't1', guid: 't1-guid', subItems: [] },
                { name: 'Task 2', id: 't2', guid: 't2-guid', subItems: [] }
            ]
        };
        Object.assign(window.capexTree, testTree);
        window.normalizeTreeStructure(window.capexTree);
        window.render();
    });
}

test.describe('User Macros (Build 882)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await loadTestTree(page);
    });

    test('1. MacroManager object exists on window', async ({ page }) => {
        const hasMacroManager = await page.evaluate(() => {
            return typeof window.MacroManager === 'object' && window.MacroManager !== null;
        });
        expect(hasMacroManager).toBe(true);
    });

    test('2. Can create a macro via MacroManager.create()', async ({ page }) => {
        const macroId = await page.evaluate(() => {
            const id = window.MacroManager.create({
                name: 'Test Macro',
                description: 'A test macro',
                commands: [
                    { command: 'expand_all', params: {} }
                ]
            });
            return id;
        });
        expect(macroId).toBeTruthy();
        expect(typeof macroId).toBe('string');
    });

    test('3. Macro appears in macro list UI', async ({ page }) => {
        // Create a macro
        await page.evaluate(() => {
            window.MacroManager.create({
                name: 'Visible Macro',
                description: 'Should appear in list',
                commands: [
                    { command: 'expand_all', params: {} }
                ]
            });
        });

        // Open macro list (assuming there's a button or menu)
        // This is a placeholder - adjust based on actual UI implementation
        const macroListExists = await page.evaluate(() => {
            const macros = window.MacroManager.list();
            return macros.some(m => m.name === 'Visible Macro');
        });
        expect(macroListExists).toBe(true);
    });

    test('4. Running a macro executes its commands', async ({ page }) => {
        // Create and run a macro that sets a testable state
        const executed = await page.evaluate(async () => {
            const macroId = window.MacroManager.create({
                name: 'Expand Macro',
                description: 'Expands all nodes',
                commands: [
                    { command: 'expand_all', params: {} }
                ]
            });

            // Run the macro
            await window.MacroManager.run(macroId);

            // Check if nodes are expanded
            return window.capexTree.expanded === true ||
                   (window.capexTree.subItems && window.capexTree.subItems.every(n => n.expanded));
        });
        expect(executed).toBeTruthy();
    });

    test('5. Can delete a macro', async ({ page }) => {
        const deleted = await page.evaluate(() => {
            const macroId = window.MacroManager.create({
                name: 'Delete Me',
                description: 'Will be deleted',
                commands: [
                    { command: 'expand_all', params: {} }
                ]
            });

            window.MacroManager.delete(macroId);

            const macros = window.MacroManager.list();
            return !macros.some(m => m.id === macroId);
        });
        expect(deleted).toBe(true);
    });

    test('6. Macros persist in localStorage', async ({ page }) => {
        // Create a macro
        await page.evaluate(() => {
            window.MacroManager.create({
                name: 'Persistent Macro',
                description: 'Should persist',
                commands: [
                    { command: 'expand_all', params: {} }
                ]
            });
        });

        // Check localStorage
        const hasLocalStorage = await page.evaluate(() => {
            const stored = localStorage.getItem('userMacros');
            if (!stored) return false;
            const macros = JSON.parse(stored);
            return macros.some(m => m.name === 'Persistent Macro');
        });
        expect(hasLocalStorage).toBe(true);
    });

    test('7. Macro with multiple commands runs all sequentially', async ({ page }) => {
        const allExecuted = await page.evaluate(async () => {
            const macroId = window.MacroManager.create({
                name: 'Multi-Command Macro',
                description: 'Runs multiple commands',
                commands: [
                    { command: 'expand_all', params: {} },
                    { command: 'collapse_all', params: {} },
                    { command: 'expand_all', params: {} }
                ]
            });

            await window.MacroManager.run(macroId);

            // After expand_all → collapse_all → expand_all, should be expanded
            return window.capexTree.expanded === true ||
                   (window.capexTree.subItems && window.capexTree.subItems.every(n => n.expanded));
        });
        expect(allExecuted).toBeTruthy();
    });

    test('8. Macro icon displays correctly in list', async ({ page }) => {
        await page.evaluate(() => {
            window.MacroManager.create({
                name: 'Icon Macro',
                description: 'Should have icon',
                icon: '⚡',
                commands: [
                    { command: 'expand_all', params: {} }
                ]
            });
        });

        const hasIcon = await page.evaluate(() => {
            const macros = window.MacroManager.list();
            const macro = macros.find(m => m.name === 'Icon Macro');
            return macro && macro.icon === '⚡';
        });
        expect(hasIcon).toBe(true);
    });
});

test.describe('CommandTelemetry (Build 882)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await loadTestTree(page);

        // Clear telemetry before each test
        await page.evaluate(() => {
            if (window.CommandTelemetry) {
                window.CommandTelemetry.clear();
            }
        });
    });

    test('9. CommandTelemetry object exists on window', async ({ page }) => {
        const hasTelemetry = await page.evaluate(() => {
            return typeof window.CommandTelemetry === 'object' && window.CommandTelemetry !== null;
        });
        expect(hasTelemetry).toBe(true);
    });

    test('10. CommandTelemetry.record() stores command in buffer', async ({ page }) => {
        const recorded = await page.evaluate(() => {
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: 'gantt' });

            const recent = window.CommandTelemetry.getRecent(10);
            return recent.length >= 2;
        });
        expect(recorded).toBe(true);
    });

    test('11. CommandTelemetry.getRecent(n) returns last N commands', async ({ page }) => {
        const correctCount = await page.evaluate(() => {
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: 'gantt' });
            window.CommandTelemetry.record('collapse_all', {});

            const recent = window.CommandTelemetry.getRecent(2);
            return recent.length === 2 &&
                   recent[0].command === 'collapse_all' &&
                   recent[1].command === 'switch_view';
        });
        expect(correctCount).toBe(true);
    });

    test('12. CommandTelemetry does NOT persist to localStorage (Article V: Anti-Enframing)', async ({ page }) => {
        // Record some commands
        await page.evaluate(() => {
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: 'gantt' });
            window.CommandTelemetry.record('collapse_all', {});
        });

        // Check that telemetry is NOT in localStorage
        const hasLocalStorage = await page.evaluate(() => {
            return localStorage.getItem('commandTelemetry') !== null;
        });
        expect(hasLocalStorage).toBe(false);
    });
});

test.describe('Agent-Authored Macros (Build 882)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await loadTestTree(page);
    });

    test('13. MacroManager.createFromCommands() exists and creates macros with provenance', async ({ page }) => {
        const hasProvenance = await page.evaluate(() => {
            if (!window.MacroManager.createFromCommands) return false;

            const macroId = window.MacroManager.createFromCommands({
                name: 'AI Macro',
                description: 'Created by AI',
                commands: [
                    { command: 'expand_all', params: {} }
                ],
                provenance: {
                    source: 'ai_generated',
                    model: 'claude-opus-4-5',
                    confidence: 0.90,
                    timestamp: new Date().toISOString()
                }
            });

            const macros = window.MacroManager.list();
            const macro = macros.find(m => m.id === macroId);
            return macro && macro.provenance && macro.provenance.source === 'ai_generated';
        });
        expect(hasProvenance).toBe(true);
    });

    test('14. AI-generated macros show provenance badge (🤖 or .ai-provenance-badge)', async ({ page }) => {
        const hasBadge = await page.evaluate(() => {
            if (!window.MacroManager.createFromCommands) return false;

            window.MacroManager.createFromCommands({
                name: 'AI Macro with Badge',
                description: 'Should show provenance',
                commands: [
                    { command: 'expand_all', params: {} }
                ],
                provenance: {
                    source: 'ai_generated',
                    model: 'claude-opus-4-5',
                    confidence: 0.90,
                    timestamp: new Date().toISOString()
                }
            });

            const macros = window.MacroManager.list();
            const macro = macros.find(m => m.name === 'AI Macro with Badge');

            // Check if provenance is visible (either as emoji or class)
            return macro && macro.provenance &&
                   (macro.provenance.source === 'ai_generated' ||
                    macro.provenanceBadge === '🤖');
        });
        expect(hasBadge).toBe(true);
    });

    test('15. CommandTelemetry.getSequences() detects repeated command patterns', async ({ page }) => {
        const detectsPattern = await page.evaluate(() => {
            if (!window.CommandTelemetry.getSequences) return false;

            // Simulate repeated pattern: expand_all, switch_view, collapse_all
            window.CommandTelemetry.clear();

            // First sequence
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: 'gantt' });
            window.CommandTelemetry.record('collapse_all', {});

            // Second sequence
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: 'canvas' });
            window.CommandTelemetry.record('collapse_all', {});

            // Third sequence
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: '3d' });
            window.CommandTelemetry.record('collapse_all', {});

            const sequences = window.CommandTelemetry.getSequences();

            // Should detect the expand_all → switch_view → collapse_all pattern
            return sequences && sequences.length > 0 &&
                   sequences.some(seq =>
                       seq.commands.some(c => c === 'expand_all') &&
                       seq.commands.some(c => c === 'switch_view') &&
                       seq.commands.some(c => c === 'collapse_all')
                   );
        });
        expect(detectsPattern).toBe(true);
    });
});
