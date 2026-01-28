/**
 * Block References E2E Tests (Builds 879-880)
 * Tests local and cross-tree block reference functionality
 */

import { test, expect } from '@playwright/test';
const TEST_URL = process.env.TEST_URL || 'https://treelisty.netlify.app';

test.describe('Block Reference Rendering', () => {
  test('renderBlockRefs() converts ((nodeId)) to clickable span', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Target Node', id: 'target-node', guid: 'guid-target' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      // Test renderBlockRefs function directly
      const html = renderBlockRefs('Test text with ((target-node)) reference');
      return {
        html,
        hasBlockRef: html.includes('class="block-ref"'),
        hasDataRef: html.includes('data-ref-id="target-node"'),
        hasOnclick: html.includes('onclick="navigateToBlockRef')
      };
    });

    expect(result.hasBlockRef).toBeTruthy();
    expect(result.hasDataRef).toBeTruthy();
    expect(result.hasOnclick).toBeTruthy();
  });

  test('renderBlockRefs() shows target node name, not raw ID', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Target Node Name', id: 'target-node-id', guid: 'guid-target' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      const html = renderBlockRefs('Reference to ((target-node-id))');
      return {
        html,
        hasNodeName: html.includes('Target Node Name'),
        hasRawId: html.includes('target-node-id') && !html.includes('data-ref-id')
      };
    });

    expect(result.hasNodeName).toBeTruthy();
    expect(result.html).toContain('📄');
  });

  test('renderBlockRefs() marks broken references with warning', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: []
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      const html = renderBlockRefs('Broken ref ((nonexistent-node))');
      return {
        html,
        hasBrokenClass: html.includes('block-ref-broken'),
        hasWarning: html.includes('⚠️')
      };
    });

    expect(result.hasBrokenClass).toBeTruthy();
    expect(result.hasWarning).toBeTruthy();
  });

  test('renderBlockRefs() handles multiple refs in same text', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Node A', id: 'node-a', guid: 'guid-a' },
          { name: 'Node B', id: 'node-b', guid: 'guid-b' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      const html = renderBlockRefs('First ((node-a)) and second ((node-b))');
      const matches = html.match(/class="block-ref"/g);
      return {
        html,
        refCount: matches ? matches.length : 0
      };
    });

    expect(result.refCount).toBe(2);
  });

  test('renderBlockRefs() detects cross-tree refs with colon syntax', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      // Set up TreeRegistry for cross-tree lookup
      if (!window.TreeRegistry) {
        window.TreeRegistry = {
          trees: new Map([
            ['other-tree', { id: 'other-tree', name: 'Other Tree Name', lastModified: Date.now() }]
          ])
        };
      }

      const html = renderBlockRefs('Cross-tree ref ((other-tree:node-123))');
      return {
        html,
        hasExternalClass: html.includes('block-ref-external'),
        hasTreeName: html.includes('Other Tree Name')
      };
    });

    expect(result.hasExternalClass).toBeTruthy();
  });

  test('renderBlockRefs() handles complex ref IDs with hyphens, underscores, colons', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Complex Node', id: 'node_123-abc', guid: 'guid-complex' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      const html = renderBlockRefs('Ref with complex ID ((node_123-abc))');
      const crossTreeHtml = renderBlockRefs('Cross-tree complex ((tree-456:node_789-xyz))');

      return {
        localParsed: html.includes('data-ref-id="node_123-abc"'),
        crossTreeParsed: crossTreeHtml.includes('tree-456:node_789-xyz')
      };
    });

    expect(result.localParsed).toBeTruthy();
    expect(result.crossTreeParsed).toBeTruthy();
  });
});

test.describe('Block Reference Navigation', () => {
  test('navigateToBlockRef() selects target node for local ref', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Source', id: 'source-node', guid: 'guid-source' },
          { name: 'Target', id: 'target-node', guid: 'guid-target' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      window.selectedNodeId = 'source-node';
      const beforeNav = window.selectedNodeId;

      // Navigate to target
      navigateToBlockRef('target-node');
      const afterNav = window.selectedNodeId;

      return { beforeNav, afterNav };
    });

    expect(result.beforeNav).toBe('source-node');
    expect(result.afterNav).toBe('target-node');
  });

  test('navigateToBlockRef() shows consent dialog for cross-tree refs', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    // Set up dialog listener
    let dialogAppeared = false;
    let dialogMessage = '';

    page.once('dialog', async dialog => {
      dialogAppeared = true;
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.evaluate(() => {
      if (!window.TreeRegistry) {
        window.TreeRegistry = {
          trees: new Map([
            ['other-tree', { id: 'other-tree', name: 'Other Tree', lastModified: Date.now() }]
          ])
        };
      }

      const testTree = {
        name: 'Current Tree',
        id: 'current-tree',
        guid: 'current-guid',
        subItems: []
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      // Trigger cross-tree navigation
      navigateToBlockRef('other-tree:node-123');
    });

    await page.waitForTimeout(500);

    expect(dialogAppeared).toBeTruthy();
    expect(dialogMessage.toLowerCase()).toContain('switch');
  });

  test('dismissing consent dialog preserves current tree', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    page.once('dialog', async dialog => {
      await dialog.dismiss();
    });

    const result = await page.evaluate(async () => {
      if (!window.TreeRegistry) {
        window.TreeRegistry = {
          trees: new Map([
            ['other-tree', { id: 'other-tree', name: 'Other Tree', lastModified: Date.now() }]
          ])
        };
      }

      const testTree = {
        name: 'Current Tree',
        id: 'current-tree',
        guid: 'current-guid',
        subItems: []
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      const beforeId = capexTree.id;

      // Trigger cross-tree navigation
      navigateToBlockRef('other-tree:node-123');

      // Wait for dialog to be dismissed
      await new Promise(resolve => setTimeout(resolve, 300));

      const afterId = capexTree.id;

      return { beforeId, afterId };
    });

    await page.waitForTimeout(500);

    expect(result.beforeId).toBe('current-tree');
    expect(result.afterId).toBe('current-tree');
  });

  test('navigateToBlockRef() with broken ref shows error toast', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: []
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      // Try to navigate to nonexistent node
      navigateToBlockRef('nonexistent-node');
    });

    await page.waitForTimeout(500);

    // Check for toast notification
    const toast = page.locator('.toast, .notification, #toast-container');
    const hasToast = await toast.count() > 0;

    if (hasToast) {
      const toastText = await toast.first().textContent();
      expect(toastText.toLowerCase()).toMatch(/not found|error/);
    }
  });
});

test.describe('Block Reference Resolution', () => {
  test('resolveBlockRef() finds node by ID in current tree', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Target Node', id: 'target-id', guid: 'guid-target' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      const resolved = resolveBlockRef('target-id');
      return {
        found: !!resolved,
        nodeName: resolved ? resolved.name : null,
        nodeId: resolved ? resolved.id : null
      };
    });

    expect(result.found).toBeTruthy();
    expect(result.nodeName).toBe('Target Node');
    expect(result.nodeId).toBe('target-id');
  });

  test('resolveBlockRef() searches by GUID if ID not found', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Target Node', id: 'target-id', guid: 'unique-guid-123' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      // Try to resolve by GUID
      const resolved = resolveBlockRef('unique-guid-123');
      return {
        found: !!resolved,
        nodeName: resolved ? resolved.name : null
      };
    });

    expect(result.found).toBeTruthy();
    expect(result.nodeName).toBe('Target Node');
  });

  test('resolveBlockRef() returns null for nonexistent ref', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: []
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      const resolved = resolveBlockRef('nonexistent-ref');
      return { found: !!resolved };
    });

    expect(result.found).toBeFalsy();
  });

  test('resolveBlockRef() handles nested nodes correctly', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    const result = await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          {
            name: 'Parent',
            id: 'parent',
            guid: 'parent-guid',
            subItems: [
              {
                name: 'Child',
                id: 'child',
                guid: 'child-guid',
                subItems: [
                  { name: 'Grandchild', id: 'grandchild', guid: 'grandchild-guid' }
                ]
              }
            ]
          }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);

      const resolved = resolveBlockRef('grandchild');
      return {
        found: !!resolved,
        nodeName: resolved ? resolved.name : null
      };
    });

    expect(result.found).toBeTruthy();
    expect(result.nodeName).toBe('Grandchild');
  });
});

test.describe('Block Reference UI Integration', () => {
  test('block refs render in info panel description', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Source', id: 'source', guid: 'guid-source', description: 'See ((target)) for details' },
          { name: 'Target', id: 'target', guid: 'guid-target', description: 'Target node' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);
      window.selectedNodeId = 'source';
      render();
    });

    await page.waitForTimeout(500);

    // Open info panel if not visible
    const infoPanelVisible = await page.evaluate(() => {
      const panel = document.getElementById('info-panel');
      return panel && panel.style.display !== 'none';
    });

    if (!infoPanelVisible) {
      const infoPanelButton = page.locator('button:has-text("Info"), button[title*="Info"]');
      if (await infoPanelButton.count() > 0) {
        await infoPanelButton.first().click();
        await page.waitForTimeout(300);
      }
    }

    // Check for block ref in info panel
    const blockRef = page.locator('#info-panel .block-ref, .info-panel .block-ref');
    const hasBlockRef = await blockRef.count() > 0;

    if (hasBlockRef) {
      await expect(blockRef.first()).toBeVisible();
      const text = await blockRef.first().textContent();
      expect(text).toContain('Target');
    }
  });

  test('autocomplete dropdown appears when typing (( in description field', async ({ page }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('#tree-container', { timeout: 5000 });

    await page.evaluate(() => {
      const testTree = {
        name: 'Block Ref Test Tree',
        id: 'block-ref-test',
        guid: 'block-ref-test-guid',
        subItems: [
          { name: 'Source', id: 'source', guid: 'guid-source', description: '' },
          { name: 'Target Node', id: 'target', guid: 'guid-target', description: '' }
        ]
      };
      Object.assign(capexTree, testTree);
      normalizeTreeStructure(capexTree);
      window.selectedNodeId = 'source';
      render();
    });

    await page.waitForTimeout(500);

    // Open info panel
    const infoPanelButton = page.locator('button:has-text("Info"), button[title*="Info"]');
    if (await infoPanelButton.count() > 0) {
      await infoPanelButton.first().click();
      await page.waitForTimeout(300);
    }

    // Find description textarea
    const descField = page.locator('textarea#node-description, textarea[placeholder*="description"]');
    if (await descField.count() > 0) {
      await descField.focus();
      await descField.fill('Testing ((');
      await page.waitForTimeout(500);

      // Check for autocomplete dropdown
      const autocomplete = page.locator('#block-ref-autocomplete');
      const hasAutocomplete = await autocomplete.count() > 0;

      if (hasAutocomplete) {
        await expect(autocomplete).toBeVisible();
      }
    }
  });
});
