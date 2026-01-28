/**
 * TreeListy E2E Tests: User Macros, CommandTelemetry, and Agent-Authored Macros (Build 882)
 *
 * Tests for:
 * - User-created macros (create, run, delete, persist)
 * - CommandTelemetry (record, retrieve, no localStorage per Article V)
 * - Agent-authored macros (provenance, pattern detection)
 */

import { test, expect } from '@playwright/test';

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

        // Clear existing macros
        await page.evaluate(() => {
            localStorage.setItem('treelisty-macros', '[]');
        });
    });

    test('1. MacroManager object exists on window', async ({ page }) => {
        const hasMacroManager = await page.evaluate(() => {
            return typeof window.MacroManager === 'object' && window.MacroManager !== null;
        });
        expect(hasMacroManager).toBe(true);
    });

    test('2. MacroManager has required methods', async ({ page }) => {
        const hasMethods = await page.evaluate(() => {
            return typeof window.MacroManager.getMacros === 'function' &&
                   typeof window.MacroManager.saveMacros === 'function' &&
                   typeof window.MacroManager.createFromCommands === 'function' &&
                   typeof window.MacroManager.run === 'function' &&
                   typeof window.MacroManager.remove === 'function' &&
                   typeof window.MacroManager.runByName === 'function';
        });
        expect(hasMethods).toBe(true);
    });

    test('3. Can create a macro via createFromCommands()', async ({ page }) => {
        const macroCreated = await page.evaluate(() => {
            const macro = window.MacroManager.createFromCommands(
                'Test Macro',
                '⚡',
                ['expand_all', 'collapse_all'],
                { source: 'user', timestamp: new Date().toISOString() }
            );
            return macro && macro.name === 'Test Macro' && macro.commands.length === 2;
        });
        expect(macroCreated).toBe(true);
    });

    test('4. Macro appears in getMacros() list', async ({ page }) => {
        const macroInList = await page.evaluate(() => {
            window.MacroManager.createFromCommands(
                'Visible Macro',
                '🔥',
                ['expand_all'],
                { source: 'user' }
            );

            const macros = window.MacroManager.getMacros();
            return macros.some(m => m.name === 'Visible Macro' && m.icon === '🔥');
        });
        expect(macroInList).toBe(true);
    });

    test('5. Running a macro executes its commands', async ({ page }) => {
        const executed = await page.evaluate(async () => {
            // Create macro
            window.MacroManager.createFromCommands(
                'Expand Macro',
                '⚡',
                ['expand_all'],
                { source: 'user' }
            );

            // Collapse all first
            window.capexTree.expanded = false;
            if (window.capexTree.subItems) {
                window.capexTree.subItems.forEach(n => n.expanded = false);
            }

            // Run the macro
            await window.MacroManager.run(0);

            // Check if root is expanded
            return window.capexTree.expanded === true;
        });
        expect(executed).toBe(true);
    });

    test('6. Can delete a macro', async ({ page }) => {
        const deleted = await page.evaluate(() => {
            // Create macro
            window.MacroManager.createFromCommands('Delete Me', '🗑️', ['expand_all']);

            // Verify it exists
            let macros = window.MacroManager.getMacros();
            const hadMacro = macros.some(m => m.name === 'Delete Me');

            // Delete it
            window.MacroManager.remove(0);

            // Verify it's gone
            macros = window.MacroManager.getMacros();
            const stillHas = macros.some(m => m.name === 'Delete Me');

            return hadMacro && !stillHas;
        });
        expect(deleted).toBe(true);
    });

    test('7. Macros persist in localStorage', async ({ page }) => {
        await page.evaluate(() => {
            window.MacroManager.createFromCommands(
                'Persistent Macro',
                '💾',
                ['expand_all', 'collapse_all'],
                { source: 'user' }
            );
        });

        const persisted = await page.evaluate(() => {
            const stored = localStorage.getItem('treelisty-macros');
            if (!stored) return false;
            const macros = JSON.parse(stored);
            return macros.some(m => m.name === 'Persistent Macro' && m.icon === '💾');
        });
        expect(persisted).toBe(true);
    });

    test('8. Macro with multiple commands runs all sequentially', async ({ page }) => {
        const allExecuted = await page.evaluate(async () => {
            window.MacroManager.createFromCommands(
                'Multi-Command',
                '⚡',
                ['expand_all', 'collapse_all', 'expand_all'],
                { source: 'user' }
            );

            await window.MacroManager.run(0);

            // After expand → collapse → expand, should be expanded
            return window.capexTree.expanded === true;
        });
        expect(allExecuted).toBe(true);
    });

    test('9. runByName() executes macro by name', async ({ page }) => {
        const ranByName = await page.evaluate(() => {
            window.MacroManager.createFromCommands(
                'Named Macro',
                '🎯',
                ['expand_all'],
                { source: 'user' }
            );

            // Collapse first
            window.capexTree.expanded = false;

            // Run by name
            const result = window.MacroManager.runByName('Named Macro');

            // Should return true if found
            return result === true;
        });
        expect(ranByName).toBe(true);
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

    test('10. CommandTelemetry object exists on window', async ({ page }) => {
        const hasTelemetry = await page.evaluate(() => {
            return typeof window.CommandTelemetry === 'object' && window.CommandTelemetry !== null;
        });
        expect(hasTelemetry).toBe(true);
    });

    test('11. CommandTelemetry has required methods', async ({ page }) => {
        const hasMethods = await page.evaluate(() => {
            return typeof window.CommandTelemetry.record === 'function' &&
                   typeof window.CommandTelemetry.getRecent === 'function' &&
                   typeof window.CommandTelemetry.getSequences === 'function' &&
                   typeof window.CommandTelemetry.clear === 'function' &&
                   typeof window.CommandTelemetry.toJSON === 'function';
        });
        expect(hasMethods).toBe(true);
    });

    test('12. CommandTelemetry.record() stores command in buffer', async ({ page }) => {
        const recorded = await page.evaluate(() => {
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: 'gantt' });

            const recent = window.CommandTelemetry.getRecent(10);
            return recent.length === 2 &&
                   recent[0].command === 'expand_all' &&
                   recent[1].command === 'switch_view';
        });
        expect(recorded).toBe(true);
    });

    test('13. CommandTelemetry.getRecent(n) returns last N commands in order', async ({ page }) => {
        const correctOrder = await page.evaluate(() => {
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: 'gantt' });
            window.CommandTelemetry.record('collapse_all', {});

            const recent = window.CommandTelemetry.getRecent(2);
            // getRecent returns slice(-n), so last 2 in chronological order
            return recent.length === 2 &&
                   recent[0].command === 'switch_view' &&
                   recent[1].command === 'collapse_all';
        });
        expect(correctOrder).toBe(true);
    });

    test('14. CommandTelemetry does NOT persist to localStorage (Article V: Anti-Enframing)', async ({ page }) => {
        await page.evaluate(() => {
            window.CommandTelemetry.record('expand_all', {});
            window.CommandTelemetry.record('switch_view', { view: 'gantt' });
            window.CommandTelemetry.record('collapse_all', {});
        });

        const hasLocalStorage = await page.evaluate(() => {
            return localStorage.getItem('commandTelemetry') !== null;
        });
        expect(hasLocalStorage).toBe(false);
    });

    test('15. CommandTelemetry enforces 100-command buffer limit', async ({ page }) => {
        const enforcesLimit = await page.evaluate(() => {
            // Record 150 commands
            for (let i = 0; i < 150; i++) {
                window.CommandTelemetry.record(`command_${i}`, {});
            }

            const recent = window.CommandTelemetry.getRecent(200);
            // Should only have last 100
            return recent.length === 100 &&
                   recent[0].command === 'command_50' && // First kept
                   recent[99].command === 'command_149'; // Last recorded
        });
        expect(enforcesLimit).toBe(true);
    });
});

test.describe('Agent-Authored Macros (Build 882)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_URL);
        await page.waitForSelector('#tree-container', { timeout: 10000 });
        await loadTestTree(page);

        // Clear macros
        await page.evaluate(() => {
            localStorage.setItem('treelisty-macros', '[]');
        });
    });

    test('16. createFromCommands() with provenance creates AI-attributed macro', async ({ page }) => {
        const hasProvenance = await page.evaluate(() => {
            const macro = window.MacroManager.createFromCommands(
                'AI Macro',
                '🤖',
                ['expand_all'],
                {
                    source: 'ai_generated',
                    model: 'claude-opus-4-5',
                    confidence: 0.90,
                    timestamp: new Date().toISOString()
                }
            );

            return macro.provenance &&
                   macro.provenance.source === 'ai_generated' &&
                   macro.provenance.model === 'claude-opus-4-5';
        });
        expect(hasProvenance).toBe(true);
    });

    test('17. AI-generated macros default to 🤖 icon if not specified', async ({ page }) => {
        const hasRobotIcon = await page.evaluate(() => {
            const macro = window.MacroManager.createFromCommands(
                'AI Macro',
                null, // No icon specified
                ['expand_all'],
                { source: 'ai_generated' }
            );

            return macro.icon === '🤖';
        });
        expect(hasRobotIcon).toBe(true);
    });

    test('18. AI-generated macros show provenance in list (via renderList)', async ({ page }) => {
        // Create AI macro
        await page.evaluate(() => {
            window.MacroManager.createFromCommands(
                'AI Macro with Badge',
                '⚡',
                ['expand_all'],
                { source: 'ai_generated', timestamp: new Date().toISOString() }
            );
        });

        // Verify provenance in data
        const hasProvenanceInData = await page.evaluate(() => {
            const macros = window.MacroManager.getMacros();
            const macro = macros.find(m => m.name === 'AI Macro with Badge');
            return macro && macro.provenance && macro.provenance.source === 'ai_generated';
        });
        expect(hasProvenanceInData).toBe(true);
    });

    test('19. CommandTelemetry.getSequences() detects repeated command patterns', async ({ page }) => {
        const detectsPattern = await page.evaluate(() => {
            window.CommandTelemetry.clear();

            // Record same sequence 3 times
            for (let i = 0; i < 3; i++) {
                window.CommandTelemetry.record('expand_all', {});
                window.CommandTelemetry.record('switch_view', { view: 'gantt' });
                window.CommandTelemetry.record('collapse_all', {});
            }

            const sequences = window.CommandTelemetry.getSequences(2, 3);

            // Should detect sequences that occur 3+ times
            return sequences && sequences.length > 0 &&
                   sequences.some(seq =>
                       seq.sequence.includes('expand_all') &&
                       seq.sequence.includes('switch_view') &&
                       seq.count >= 3
                   );
        });
        expect(detectsPattern).toBe(true);
    });

    test('20. getSequences() returns sequences sorted by count (descending)', async ({ page }) => {
        const sortedByCount = await page.evaluate(() => {
            window.CommandTelemetry.clear();

            // Pattern A: 5 times
            for (let i = 0; i < 5; i++) {
                window.CommandTelemetry.record('expand_all', {});
                window.CommandTelemetry.record('collapse_all', {});
            }

            // Pattern B: 3 times
            for (let i = 0; i < 3; i++) {
                window.CommandTelemetry.record('switch_view', { view: 'gantt' });
                window.CommandTelemetry.record('focus_root', {});
            }

            const sequences = window.CommandTelemetry.getSequences(2, 3);

            // First sequence should have higher count than second
            return sequences.length >= 2 &&
                   sequences[0].count >= sequences[1].count;
        });
        expect(sortedByCount).toBe(true);
    });

    test('21. createFromCommands() accepts string commands (split by newline)', async ({ page }) => {
        const acceptsString = await page.evaluate(() => {
            const macro = window.MacroManager.createFromCommands(
                'String Commands',
                '📝',
                'expand_all\nswitch_view:gantt\ncollapse_all', // String instead of array
                { source: 'user' }
            );

            return macro.commands.length === 3 &&
                   macro.commands[0] === 'expand_all' &&
                   macro.commands[1] === 'switch_view:gantt' &&
                   macro.commands[2] === 'collapse_all';
        });
        expect(acceptsString).toBe(true);
    });

    test('22. createFromCommands() accepts array of commands', async ({ page }) => {
        const acceptsArray = await page.evaluate(() => {
            const macro = window.MacroManager.createFromCommands(
                'Array Commands',
                '📋',
                ['expand_all', 'switch_view:gantt', 'collapse_all'],
                { source: 'user' }
            );

            return macro.commands.length === 3 &&
                   Array.isArray(macro.commands);
        });
        expect(acceptsArray).toBe(true);
    });

    test('23. getSequences() respects minLength parameter', async ({ page }) => {
        const respectsMinLength = await page.evaluate(() => {
            window.CommandTelemetry.clear();

            // Record pattern 4 times
            for (let i = 0; i < 4; i++) {
                window.CommandTelemetry.record('a', {});
                window.CommandTelemetry.record('b', {});
                window.CommandTelemetry.record('c', {});
            }

            const sequences = window.CommandTelemetry.getSequences(3, 3);

            // All sequences should have at least 3 commands
            return sequences.every(seq => seq.commands.length >= 3);
        });
        expect(respectsMinLength).toBe(true);
    });

    test('24. getSequences() respects minOccurrences parameter', async ({ page }) => {
        const respectsMinOccurrences = await page.evaluate(() => {
            window.CommandTelemetry.clear();

            // Pattern appears 5 times
            for (let i = 0; i < 5; i++) {
                window.CommandTelemetry.record('expand_all', {});
                window.CommandTelemetry.record('collapse_all', {});
            }

            const sequences = window.CommandTelemetry.getSequences(2, 4);

            // All sequences should appear at least 4 times
            return sequences.every(seq => seq.count >= 4);
        });
        expect(respectsMinOccurrences).toBe(true);
    });
});
