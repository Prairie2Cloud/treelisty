/**
 * ARTICLE II: Provenance Tests
 * "Owned thought is distinguishable from generated thought"
 * 
 * Tests verify:
 * - AI content is marked
 * - Provenance survives operations
 * - Claiming mechanism works
 */

describe('ARTICLE II: Provenance', () => {
  
  describe('AI Attribution', () => {
    
    test('AI-generated nodes have provenance metadata', () => {
      const aiNode = createAINode({
        name: 'Generated Node',
        model: 'claude-opus-4-5',
        confidence: 0.87
      });
      
      expect(aiNode.provenance).toBeDefined();
      expect(aiNode.provenance.source).toBe('ai_generated');
      expect(aiNode.provenance.model).toBe('claude-opus-4-5');
      expect(aiNode.provenance.confidence).toBe(0.87);
      expect(aiNode.provenance.timestamp).toBeDefined();
      expect(aiNode.provenance.claimed).toBe(false);
    });
    
    test('human-created nodes have human provenance', () => {
      const humanNode = createHumanNode({
        name: 'Manual Node'
      });
      
      expect(humanNode.provenance).toBeDefined();
      expect(humanNode.provenance.source).toBe('human');
      expect(humanNode.provenance.claimed).toBe(true); // Human nodes are auto-claimed
    });
    
    test('imported nodes have import provenance', () => {
      const importedNode = createImportedNode({
        name: 'Imported Node',
        sourceFile: 'external-tree.json'
      });
      
      expect(importedNode.provenance).toBeDefined();
      expect(importedNode.provenance.source).toBe('imported');
      expect(importedNode.provenance.sourceFile).toBe('external-tree.json');
    });
    
    test('atlas-linked nodes have atlas provenance', () => {
      const linkedNode = createAtlasLinkedNode({
        name: 'Linked Node',
        sourceUid: 'other-tree:node-456'
      });
      
      expect(linkedNode.provenance).toBeDefined();
      expect(linkedNode.provenance.source).toBe('atlas_link');
      expect(linkedNode.provenance.sourceUid).toBe('other-tree:node-456');
    });
    
  });
  
  describe('Provenance Survival', () => {
    
    test('provenance survives JSON export/import', () => {
      const original = {
        name: 'Test Node',
        provenance: {
          source: 'ai_generated',
          model: 'gemini-2.5-pro',
          confidence: 0.72,
          timestamp: '2026-01-07T12:00:00Z',
          claimed: false
        }
      };
      
      const exported = JSON.stringify(original);
      const reimported = JSON.parse(exported);
      
      expect(reimported.provenance.source).toBe(original.provenance.source);
      expect(reimported.provenance.model).toBe(original.provenance.model);
      expect(reimported.provenance.confidence).toBe(original.provenance.confidence);
      expect(reimported.provenance.claimed).toBe(original.provenance.claimed);
    });
    
    test('provenance survives copy/paste', () => {
      const original = {
        name: 'Original',
        nodeGuid: 'orig-123',
        provenance: {
          source: 'ai_generated',
          model: 'claude-opus-4-5',
          confidence: 0.90,
          claimed: false
        }
      };
      
      const copied = copyNode(original);
      
      // Original provenance preserved
      expect(copied.provenance.source).toBe('ai_generated');
      expect(copied.provenance.model).toBe('claude-opus-4-5');
      
      // Copy metadata added
      expect(copied.provenance.copiedFrom).toBe('orig-123');
      expect(copied.nodeGuid).not.toBe(original.nodeGuid); // New GUID
    });
    
    test('provenance survives move operation', () => {
      const node = {
        name: 'Movable',
        parentId: 'parent-1',
        provenance: {
          source: 'ai_generated',
          claimed: false
        }
      };
      
      const moved = moveNode(node, 'parent-2');
      
      expect(moved.parentId).toBe('parent-2');
      expect(moved.provenance.source).toBe('ai_generated');
      expect(moved.provenance.claimed).toBe(false);
    });
    
    test('provenance survives tree merge', () => {
      const treeA = {
        treeId: 'tree-a',
        phases: [{
          name: 'Phase A',
          provenance: { source: 'human', claimed: true }
        }]
      };
      
      const treeB = {
        treeId: 'tree-b', 
        phases: [{
          name: 'Phase B',
          provenance: { source: 'ai_generated', model: 'claude', claimed: false }
        }]
      };
      
      const merged = mergeTrees(treeA, treeB);
      
      // Both provenances should be preserved
      const phaseA = merged.phases.find(p => p.name === 'Phase A');
      const phaseB = merged.phases.find(p => p.name === 'Phase B');
      
      expect(phaseA.provenance.source).toBe('human');
      expect(phaseB.provenance.source).toBe('ai_generated');
    });
    
  });
  
  describe('Claiming Mechanism', () => {
    
    test('unclaimed AI nodes are marked as unclaimed', () => {
      const aiNode = createAINode({ name: 'Unclaimed' });
      
      expect(aiNode.provenance.claimed).toBe(false);
      expect(isUnclaimed(aiNode)).toBe(true);
    });
    
    test('editing a node claims it', () => {
      const aiNode = createAINode({ name: 'Will Edit' });
      expect(aiNode.provenance.claimed).toBe(false);
      
      const edited = editNode(aiNode, { name: 'Edited Name' });
      
      expect(edited.provenance.claimed).toBe(true);
      expect(edited.provenance.claimedAt).toBeDefined();
      expect(edited.provenance.claimedBy).toBe('edit');
    });
    
    test('explicit claim action claims node', () => {
      const aiNode = createAINode({ name: 'Will Claim' });
      expect(aiNode.provenance.claimed).toBe(false);
      
      const claimed = claimNode(aiNode);
      
      expect(claimed.provenance.claimed).toBe(true);
      expect(claimed.provenance.claimedAt).toBeDefined();
      expect(claimed.provenance.claimedBy).toBe('explicit');
    });
    
    test('view-only interactions do NOT claim', () => {
      const aiNode = createAINode({ name: 'View Only' });
      
      // These should NOT claim
      viewNode(aiNode);
      expandNode(aiNode);
      collapseNode(aiNode);
      selectNode(aiNode);
      
      expect(aiNode.provenance.claimed).toBe(false);
    });
    
    test('claimed nodes lose AI badge in rendering', () => {
      const unclaimed = createAINode({ name: 'Unclaimed' });
      const claimed = claimNode(createAINode({ name: 'Claimed' }));
      
      const unclaimedRender = renderNode(unclaimed);
      const claimedRender = renderNode(claimed);
      
      expect(unclaimedRender).toContain('🤖');
      expect(claimedRender).not.toContain('🤖');
    });
    
  });
  
});

// Helper functions (would be imported from actual codebase)
function createAINode({ name, model = 'claude', confidence = 0.85 }) {
  return {
    name,
    nodeGuid: `node-${Date.now()}`,
    provenance: {
      source: 'ai_generated',
      model,
      confidence,
      timestamp: new Date().toISOString(),
      claimed: false
    }
  };
}

function createHumanNode({ name }) {
  return {
    name,
    nodeGuid: `node-${Date.now()}`,
    provenance: {
      source: 'human',
      timestamp: new Date().toISOString(),
      claimed: true
    }
  };
}

function createImportedNode({ name, sourceFile }) {
  return {
    name,
    nodeGuid: `node-${Date.now()}`,
    provenance: {
      source: 'imported',
      sourceFile,
      timestamp: new Date().toISOString(),
      claimed: false
    }
  };
}

function createAtlasLinkedNode({ name, sourceUid }) {
  return {
    name,
    nodeGuid: `node-${Date.now()}`,
    provenance: {
      source: 'atlas_link',
      sourceUid,
      timestamp: new Date().toISOString(),
      claimed: false
    }
  };
}

function copyNode(node) {
  return {
    ...node,
    nodeGuid: `node-${Date.now()}`,
    provenance: {
      ...node.provenance,
      copiedFrom: node.nodeGuid,
      copiedAt: new Date().toISOString()
    }
  };
}

function moveNode(node, newParentId) {
  return {
    ...node,
    parentId: newParentId
  };
}

function mergeTrees(treeA, treeB) {
  return {
    treeId: treeA.treeId,
    phases: [...treeA.phases, ...treeB.phases]
  };
}

function isUnclaimed(node) {
  return node.provenance?.source === 'ai_generated' && !node.provenance?.claimed;
}

function editNode(node, updates) {
  return {
    ...node,
    ...updates,
    provenance: {
      ...node.provenance,
      claimed: true,
      claimedAt: new Date().toISOString(),
      claimedBy: 'edit'
    }
  };
}

function claimNode(node) {
  return {
    ...node,
    provenance: {
      ...node.provenance,
      claimed: true,
      claimedAt: new Date().toISOString(),
      claimedBy: 'explicit'
    }
  };
}

function viewNode(node) { /* no-op for claiming */ }
function expandNode(node) { /* no-op for claiming */ }
function collapseNode(node) { /* no-op for claiming */ }
function selectNode(node) { /* no-op for claiming */ }

function renderNode(node) {
  const badge = isUnclaimed(node) ? '🤖 ' : '';
  return `${badge}${node.name}`;
}

module.exports = {
  createAINode,
  createHumanNode,
  isUnclaimed,
  claimNode
};
