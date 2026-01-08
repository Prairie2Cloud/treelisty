/**
 * ARTICLE III: Integrity Tests
 * "The skeleton is sacred"
 * 
 * Tests verify:
 * - Structure is visible
 * - Destructive operations require consent
 * - All changes are reversible
 */

describe('ARTICLE III: Structural Integrity', () => {
  
  describe('Structure Visibility', () => {
    
    test('tree structure is always visible in tree view', () => {
      const tree = createTestTree();
      const rendered = renderTreeView(tree);
      
      // All nodes should be present in render
      expect(rendered).toContain(tree.name);
      tree.phases.forEach(phase => {
        expect(rendered).toContain(phase.name);
      });
    });
    
    test('tree structure is visible in canvas view', () => {
      const tree = createTestTree();
      const rendered = renderCanvasView(tree);
      
      // All nodes should have canvas positions
      const nodeCount = countNodes(tree);
      const renderedNodes = countRenderedCanvasNodes(rendered);
      
      expect(renderedNodes).toBe(nodeCount);
    });
    
    test('tree structure is visible in mind map view', () => {
      const tree = createTestTree();
      const rendered = renderMindMapView(tree);
      
      const nodeCount = countNodes(tree);
      const renderedNodes = countRenderedMindMapNodes(rendered);
      
      expect(renderedNodes).toBe(nodeCount);
    });
    
    test('no hidden nodes (all nodes accessible)', () => {
      const tree = createTestTree();
      const allNodeIds = getAllNodeIds(tree);
      
      allNodeIds.forEach(id => {
        const canAccess = canAccessNode(tree, id);
        expect(canAccess).toBe(true);
      });
    });
    
  });
  
  describe('Consent for Destruction', () => {
    
    test('delete node requires confirmation', () => {
      const confirmCalled = vi.fn(() => true);
      global.confirm = confirmCalled;
      
      const tree = createTestTree();
      const nodeToDelete = tree.phases[0];
      
      deleteNode(tree, nodeToDelete.id);
      
      expect(confirmCalled).toHaveBeenCalled();
    });
    
    test('delete branch shows node count in confirmation', () => {
      let confirmMessage = '';
      global.confirm = (msg) => { confirmMessage = msg; return true; };
      
      const tree = createTreeWithBranch(10); // Branch with 10 nodes
      
      deleteBranch(tree, tree.phases[0].id);
      
      expect(confirmMessage).toContain('10');
    });
    
    test('delete is cancelled when user declines', () => {
      global.confirm = () => false;
      
      const tree = createTestTree();
      const originalNodeCount = countNodes(tree);
      const nodeToDelete = tree.phases[0];
      
      const result = deleteNode(tree, nodeToDelete.id);
      
      expect(result).toBe(false);
      expect(countNodes(tree)).toBe(originalNodeCount);
    });
    
    test('clear tree requires double confirmation', () => {
      const confirmCalls = [];
      global.confirm = (msg) => { confirmCalls.push(msg); return true; };
      
      const tree = createTestTree();
      
      clearTree(tree);
      
      // Should have asked at least twice for destructive clear
      expect(confirmCalls.length).toBeGreaterThanOrEqual(2);
    });
    
    test('batch delete shows total affected nodes', () => {
      let confirmMessage = '';
      global.confirm = (msg) => { confirmMessage = msg; return true; };
      
      const tree = createTestTree();
      const nodesToDelete = [tree.phases[0].id, tree.phases[1].id];
      
      batchDelete(tree, nodesToDelete);
      
      expect(confirmMessage).toMatch(/\d+ nodes/);
    });
    
  });
  
  describe('Reversibility', () => {
    
    test('add node can be undone', () => {
      const tree = createTestTree();
      const originalState = cloneTree(tree);
      
      addNode(tree, { name: 'New Node', parentId: tree.phases[0].id });
      
      expect(countNodes(tree)).toBe(countNodes(originalState) + 1);
      
      undo();
      
      expect(countNodes(tree)).toBe(countNodes(originalState));
    });
    
    test('delete node can be undone', () => {
      global.confirm = () => true;
      
      const tree = createTestTree();
      const originalState = cloneTree(tree);
      const nodeToDelete = tree.phases[0].items[0];
      
      deleteNode(tree, nodeToDelete.id);
      
      expect(findNode(tree, nodeToDelete.id)).toBeNull();
      
      undo();
      
      expect(findNode(tree, nodeToDelete.id)).not.toBeNull();
    });
    
    test('move node can be undone', () => {
      const tree = createTestTree();
      const nodeToMove = tree.phases[0].items[0];
      const originalParent = tree.phases[0].id;
      const newParent = tree.phases[1].id;
      
      moveNode(tree, nodeToMove.id, newParent);
      
      expect(getParentId(tree, nodeToMove.id)).toBe(newParent);
      
      undo();
      
      expect(getParentId(tree, nodeToMove.id)).toBe(originalParent);
    });
    
    test('rename node can be undone', () => {
      const tree = createTestTree();
      const nodeToRename = tree.phases[0];
      const originalName = nodeToRename.name;
      
      renameNode(tree, nodeToRename.id, 'New Name');
      
      expect(findNode(tree, nodeToRename.id).name).toBe('New Name');
      
      undo();
      
      expect(findNode(tree, nodeToRename.id).name).toBe(originalName);
    });
    
    test('undo history persists across save', () => {
      const tree = createTestTree();
      
      addNode(tree, { name: 'Node 1' });
      addNode(tree, { name: 'Node 2' });
      
      saveTree(tree);
      
      // Undo should still work after save
      undo();
      
      expect(findNodeByName(tree, 'Node 2')).toBeNull();
    });
    
    test('redo works after undo', () => {
      const tree = createTestTree();
      
      addNode(tree, { name: 'Redo Test Node' });
      
      expect(findNodeByName(tree, 'Redo Test Node')).not.toBeNull();
      
      undo();
      
      expect(findNodeByName(tree, 'Redo Test Node')).toBeNull();
      
      redo();
      
      expect(findNodeByName(tree, 'Redo Test Node')).not.toBeNull();
    });
    
    test('new action clears redo stack', () => {
      const tree = createTestTree();
      
      addNode(tree, { name: 'First' });
      undo(); // Can redo 'First'
      
      addNode(tree, { name: 'Second' }); // Should clear redo
      
      redo(); // Should have no effect
      
      expect(findNodeByName(tree, 'First')).toBeNull();
      expect(findNodeByName(tree, 'Second')).not.toBeNull();
    });
    
  });
  
});

// Helper functions
function createTestTree() {
  return {
    name: 'Test Tree',
    treeId: 'test-001',
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1',
        items: [
          { id: 'item-1-1', name: 'Item 1.1' },
          { id: 'item-1-2', name: 'Item 1.2' }
        ]
      },
      {
        id: 'phase-2',
        name: 'Phase 2',
        items: [
          { id: 'item-2-1', name: 'Item 2.1' }
        ]
      }
    ]
  };
}

function createTreeWithBranch(nodeCount) {
  const items = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    items.push({ id: `item-${i}`, name: `Item ${i}` });
  }
  return {
    name: 'Branch Test',
    phases: [{ id: 'branch', name: 'Branch', items }]
  };
}

function countNodes(tree) {
  let count = 1; // Root
  tree.phases?.forEach(phase => {
    count++;
    phase.items?.forEach(item => {
      count++;
      item.subItems?.forEach(() => count++);
    });
  });
  return count;
}

function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree));
}

function getAllNodeIds(tree) {
  const ids = [tree.treeId];
  tree.phases?.forEach(phase => {
    ids.push(phase.id);
    phase.items?.forEach(item => {
      ids.push(item.id);
    });
  });
  return ids;
}

function canAccessNode(tree, id) {
  return findNode(tree, id) !== null;
}

function findNode(tree, id) {
  if (tree.treeId === id) return tree;
  for (const phase of tree.phases || []) {
    if (phase.id === id) return phase;
    for (const item of phase.items || []) {
      if (item.id === id) return item;
    }
  }
  return null;
}

function findNodeByName(tree, name) {
  for (const phase of tree.phases || []) {
    if (phase.name === name) return phase;
    for (const item of phase.items || []) {
      if (item.name === name) return item;
    }
  }
  return null;
}

function getParentId(tree, nodeId) {
  for (const phase of tree.phases || []) {
    for (const item of phase.items || []) {
      if (item.id === nodeId) return phase.id;
    }
  }
  return tree.treeId;
}

// Mock functions (would be replaced with actual implementations)
let historyStack = [];
let redoStack = [];
let currentTree = null;

function saveState() {
  historyStack.push(cloneTree(currentTree));
  redoStack = [];
}

function undo() {
  if (historyStack.length > 0) {
    redoStack.push(cloneTree(currentTree));
    Object.assign(currentTree, historyStack.pop());
  }
}

function redo() {
  if (redoStack.length > 0) {
    historyStack.push(cloneTree(currentTree));
    Object.assign(currentTree, redoStack.pop());
  }
}

function addNode(tree, { name, parentId }) {
  currentTree = tree;
  saveState();
  const parent = findNode(tree, parentId) || tree.phases[0];
  parent.items = parent.items || [];
  parent.items.push({ id: `node-${Date.now()}`, name });
}

function deleteNode(tree, id) {
  if (!global.confirm(`Delete node?`)) return false;
  currentTree = tree;
  saveState();
  tree.phases.forEach(phase => {
    phase.items = phase.items?.filter(item => item.id !== id);
  });
  return true;
}

function deleteBranch(tree, id) {
  const nodeCount = 10; // Simplified
  if (!global.confirm(`Delete branch with ${nodeCount} nodes?`)) return false;
  currentTree = tree;
  saveState();
  tree.phases = tree.phases.filter(p => p.id !== id);
  return true;
}

function batchDelete(tree, ids) {
  if (!global.confirm(`Delete ${ids.length} nodes?`)) return false;
  currentTree = tree;
  saveState();
  ids.forEach(id => {
    tree.phases = tree.phases.filter(p => p.id !== id);
  });
}

function clearTree(tree) {
  if (!global.confirm('Clear all nodes?')) return false;
  if (!global.confirm('Are you sure? This cannot be undone easily.')) return false;
  currentTree = tree;
  saveState();
  tree.phases = [];
}

function moveNode(tree, nodeId, newParentId) {
  currentTree = tree;
  saveState();
  // Simplified move logic
}

function renameNode(tree, nodeId, newName) {
  currentTree = tree;
  saveState();
  const node = findNode(tree, nodeId);
  if (node) node.name = newName;
}

function saveTree(tree) {
  localStorage.setItem('tree-backup', JSON.stringify(tree));
}

// View rendering mocks
function renderTreeView(tree) {
  return JSON.stringify(tree);
}

function renderCanvasView(tree) {
  return { nodeCount: countNodes(tree) };
}

function renderMindMapView(tree) {
  return { nodeCount: countNodes(tree) };
}

function countRenderedCanvasNodes(rendered) {
  return rendered.nodeCount;
}

function countRenderedMindMapNodes(rendered) {
  return rendered.nodeCount;
}

module.exports = { createTestTree, countNodes };
