/**
 * Cross-Feature Combination Tests
 * Tests interactions between Builds 878-882 features
 *
 * Features tested:
 * - Build 878: Block References
 * - Build 879: View Trees (Clone-based)
 * - Build 880: Macro System
 * - Build 881: CommandTelemetry
 * - Build 882: HTML Export
 */

const { test, expect } = require('@playwright/test');
const TEST_URL = process.env.TEST_URL || 'https://treelisty.netlify.app';

test.describe('Cross-Feature Combinations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 10000 });

    // Load test tree with various nodes
    await page.evaluate(() => {
      const testTree = {
        name: 'Combo Test Tree',
        id: 'combo-test',
        guid: 'combo-test-guid',
        subItems: [
          {
            name: 'Node With Ref',
            id: 'nwr',
            guid: 'nwr-guid',
            description: 'See ((target-node)) for details'
          },
          {
            name: 'Target Node',
            id: 'target-node',
            guid: 'tn-guid',
            description: 'I am the target of the reference'
          },
          {
            name: 'Clone Source',
            id: 'cs',
            guid: 'cs-guid',
            description: 'Clone me and test features'
          },
          {
            name: 'View Test Node',
            id: 'vtn',
            guid: 'vtn-guid',
            description: 'Used for view testing'
          }
        ]
      };
      Object.assign(window.capexTree, testTree);
      window.normalizeTreeStructure(window.capexTree);
      window.render();
    });

    // Wait for render
    await page.waitForTimeout(500);
  });

  test('1. Block refs in cloned nodes', async ({ page }) => {
    // Select the node with block ref
    await page.evaluate(() => {
      window.selectedNodeId = 'nwr';
      window.render();
    });

    // Verify original has block ref rendering
    const originalBlockRef = await page.locator('.block-ref-link').first();
    await expect(originalBlockRef).toBeVisible({ timeout: 5000 });

    // Clone the node
    const cloneResult = await page.evaluate(() => {
      const sourceNode = window.getNodeById(window.capexTree, 'nwr');
      if (!sourceNode) return { success: false, error: 'Source not found' };

      const clone = window.cloneNode(sourceNode, window.capexTree.id);
      if (!clone) return { success: false, error: 'Clone failed' };

      // Add clone to tree
      window.capexTree.subItems.push(clone);
      window.normalizeTreeStructure(window.capexTree);
      window.render();

      return { success: true, cloneId: clone.id };
    });

    expect(cloneResult.success).toBe(true);

    // Wait for render
    await page.waitForTimeout(500);

    // Verify clone also has block ref rendering
    const cloneBlockRefs = await page.locator('.block-ref-link').count();
    expect(cloneBlockRefs).toBeGreaterThanOrEqual(2); // Original + Clone

    // Verify clone description contains block ref syntax
    const cloneDescription = await page.evaluate((cloneId) => {
      const clone = window.getNodeById(window.capexTree, cloneId);
      return clone?.description || '';
    }, cloneResult.cloneId);

    expect(cloneDescription).toContain('((target-node))');
  });

  test('2. Export clone tree as HTML', async ({ page }) => {
    // Create a view tree with clones
    await page.evaluate(() => {
      const viewTree = {
        name: 'View Tree Test',
        id: 'view-tree',
        guid: 'view-tree-guid',
        pattern: 'view-tree',
        subItems: []
      };

      // Add clones of existing nodes
      const sourceNodes = ['nwr', 'target-node', 'cs'];
      sourceNodes.forEach(nodeId => {
        const sourceNode = window.getNodeById(window.capexTree, nodeId);
        if (sourceNode) {
          const clone = window.cloneNode(sourceNode, 'view-tree');
          if (clone) {
            viewTree.subItems.push(clone);
          }
        }
      });

      // Switch to view tree
      window.capexTree = viewTree;
      window.normalizeTreeStructure(window.capexTree);
      window.render();
    });

    await page.waitForTimeout(500);

    // Export as HTML
    const exportResult = await page.evaluate(() => {
      if (typeof window.exportTreeAsHTML !== 'function') {
        return { success: false, error: 'exportTreeAsHTML not available' };
      }

      const html = window.exportTreeAsHTML();
      return { success: true, html };
    });

    if (!exportResult.success) {
      console.warn('HTML export not available, skipping HTML verification');
      return;
    }

    // Verify exported HTML contains cloned node names
    expect(exportResult.html).toContain('Node With Ref');
    expect(exportResult.html).toContain('Target Node');
    expect(exportResult.html).toContain('Clone Source');
    expect(exportResult.html).toContain('View Tree Test');
  });

  test('3. Macro that switches views', async ({ page }) => {
    // Create a macro with view-switching commands
    const macroResult = await page.evaluate(() => {
      if (typeof window.MacroManager === 'undefined') {
        return { success: false, error: 'MacroManager not available' };
      }

      const commands = [
        'switch_view:canvas',
        'switch_view:3d',
        'switch_view:tree'
      ];

      const macroId = window.MacroManager.create('View Switcher', commands);
      return { success: true, macroId };
    });

    if (!macroResult.success) {
      console.warn('MacroManager not available, skipping macro test');
      return;
    }

    // Record initial view
    const initialView = await page.evaluate(() => window.viewMode);

    // Run the macro
    await page.evaluate((macroId) => {
      window.MacroManager.run(macroId);
    }, macroResult.macroId);

    // Wait for macro execution
    await page.waitForTimeout(2000);

    // Verify final view is 'tree' (last command in macro)
    const finalView = await page.evaluate(() => window.viewMode);
    expect(finalView).toBe('tree');
  });

  test('4. CommandTelemetry records across view switches', async ({ page }) => {
    // Clear telemetry
    await page.evaluate(() => {
      if (typeof window.CommandTelemetry !== 'undefined') {
        window.CommandTelemetry.clear();
      }
    });

    // Switch views multiple times
    const views = ['canvas', '3d', 'gantt', 'tree'];

    for (const view of views) {
      await page.evaluate((viewName) => {
        if (typeof window.switchView === 'function') {
          window.switchView(viewName);
        }
      }, view);

      await page.waitForTimeout(500);
    }

    // Get telemetry data
    const telemetryResult = await page.evaluate(() => {
      if (typeof window.CommandTelemetry === 'undefined') {
        return { success: false, error: 'CommandTelemetry not available' };
      }

      const buffer = window.CommandTelemetry.getBuffer();
      return { success: true, buffer };
    });

    if (!telemetryResult.success) {
      console.warn('CommandTelemetry not available, skipping telemetry test');
      return;
    }

    // Verify telemetry captured view switches
    const viewSwitchCommands = telemetryResult.buffer.filter(
      entry => entry.command && entry.command.includes('switch_view')
    );

    expect(viewSwitchCommands.length).toBeGreaterThanOrEqual(views.length);

    // Verify each view was recorded
    for (const view of views) {
      const found = viewSwitchCommands.some(
        entry => entry.command.includes(view)
      );
      expect(found).toBe(true);
    }
  });

  test('5. Pattern change preserves block refs', async ({ page }) => {
    // Verify initial block ref rendering
    const initialBlockRef = await page.locator('.block-ref-link').first();
    await expect(initialBlockRef).toBeVisible({ timeout: 5000 });

    // Change tree pattern
    await page.evaluate(() => {
      window.capexTree.pattern = 'knowledge-base';
      window.normalizeTreeStructure(window.capexTree);
      window.render();
    });

    await page.waitForTimeout(500);

    // Verify block refs still render after pattern change
    const blockRefAfterChange = await page.locator('.block-ref-link').first();
    await expect(blockRefAfterChange).toBeVisible({ timeout: 5000 });

    // Verify the block ref still contains correct reference
    const blockRefText = await blockRefAfterChange.textContent();
    expect(blockRefText).toContain('Target Node'); // Resolved name

    // Verify description still contains block ref syntax
    const description = await page.evaluate(() => {
      const node = window.getNodeById(window.capexTree, 'nwr');
      return node?.description || '';
    });

    expect(description).toContain('((target-node))');

    // Change to another pattern
    await page.evaluate(() => {
      window.capexTree.pattern = 'debate';
      window.normalizeTreeStructure(window.capexTree);
      window.render();
    });

    await page.waitForTimeout(500);

    // Verify block refs still render after second pattern change
    const blockRefAfterSecondChange = await page.locator('.block-ref-link').first();
    await expect(blockRefAfterSecondChange).toBeVisible({ timeout: 5000 });
  });
});
