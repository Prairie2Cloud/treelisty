/**
 * Tree Operations Tests
 * 
 * Tests for core tree traversal and manipulation functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
    minimalTree, 
    complexTree, 
    deepTree,
    cloneTree,
    countNodes
} from '../fixtures/trees.js';

// Import from extracted module
import { 
    getNodeById, 
    getAllNodes,
    findParent,
    createTestTree,
    createTestNode
} from '../treelisty-core.js';

describe('Tree Operations', () => {
    
    describe('getNodeById()', () => {
        let tree;
        
        beforeEach(() => {
            tree = cloneTree(complexTree);
        });

        it('should find root node', () => {
            const node = getNodeById(tree, 'root');
            
            expect(node).toBeDefined();
            expect(node.name).toBe('Complex Project');
        });

        it('should find phase by id', () => {
            const node = getNodeById(tree, 'phase-0');
            
            expect(node).toBeDefined();
            expect(node.name).toBe('Research');
            expect(node.type).toBe('phase');
        });

        it('should find item by id', () => {
            const node = getNodeById(tree, 'item-0-0');
            
            expect(node).toBeDefined();
            expect(node.name).toBe('Literature Review');
            expect(node.type).toBe('item');
        });

        it('should find subtask by id', () => {
            const node = getNodeById(tree, 'sub-0-0-0');
            
            expect(node).toBeDefined();
            expect(node.name).toBe('Find academic papers');
            expect(node.type).toBe('subtask');
        });

        it('should find deeply nested nodes', () => {
            const deep = cloneTree(deepTree);
            const node = getNodeById(deep, 'sub-0-0-0-0');
            
            expect(node).toBeDefined();
            expect(node.name).toBe('Nested Subtask 1');
        });

        it('should return null for non-existent id', () => {
            const node = getNodeById(tree, 'does-not-exist');
            
            expect(node).toBeNull();
        });

        it('should return null for empty string id', () => {
            const node = getNodeById(tree, '');
            
            expect(node).toBeNull();
        });

        it('should return null for null id', () => {
            const node = getNodeById(tree, null);
            
            expect(node).toBeNull();
        });

        it('should handle tree with no children', () => {
            const emptyTree = createTestTree({ children: [] });
            const node = getNodeById(emptyTree, 'root');
            
            expect(node).toBeDefined();
            expect(node.id).toBe('root');
        });
    });

    describe('getAllNodes()', () => {
        
        it('should return all nodes in minimal tree', () => {
            const tree = cloneTree(minimalTree);
            const nodes = getAllNodes(tree);
            
            // root + 1 phase + 1 item = 3 nodes
            expect(nodes.length).toBe(3);
        });

        it('should return all nodes in complex tree', () => {
            const tree = cloneTree(complexTree);
            const nodes = getAllNodes(tree);
            
            // Count using fixture utility
            const expectedCount = countNodes(tree);
            expect(nodes.length).toBe(expectedCount);
        });

        it('should include root node', () => {
            const tree = cloneTree(minimalTree);
            const nodes = getAllNodes(tree);
            
            const root = nodes.find(n => n.id === 'root');
            expect(root).toBeDefined();
        });

        it('should include all phases', () => {
            const tree = cloneTree(complexTree);
            const nodes = getAllNodes(tree);
            
            const phases = nodes.filter(n => n.type === 'phase');
            expect(phases.length).toBe(3); // Research, Development, Launch
        });

        it('should include all items', () => {
            const tree = cloneTree(complexTree);
            const nodes = getAllNodes(tree);
            
            const items = nodes.filter(n => n.type === 'item');
            expect(items.length).toBe(3);
        });

        it('should include all subtasks', () => {
            const tree = cloneTree(complexTree);
            const nodes = getAllNodes(tree);
            
            const subtasks = nodes.filter(n => n.type === 'subtask');
            expect(subtasks.length).toBe(2);
        });

        it('should return array for empty tree', () => {
            const tree = createTestTree({ children: [] });
            const nodes = getAllNodes(tree);
            
            expect(Array.isArray(nodes)).toBe(true);
            expect(nodes.length).toBe(1); // Just root
        });

        it('should handle deeply nested structures', () => {
            const tree = cloneTree(deepTree);
            const nodes = getAllNodes(tree);
            
            // root + phase + item + subtask + nested subtask = 5
            expect(nodes.length).toBe(5);
        });

        it('should not contain duplicates', () => {
            const tree = cloneTree(complexTree);
            const nodes = getAllNodes(tree);
            
            const ids = nodes.map(n => n.id);
            const uniqueIds = [...new Set(ids)];
            
            expect(ids.length).toBe(uniqueIds.length);
        });
    });

    describe('findParent()', () => {
        let tree;
        
        beforeEach(() => {
            tree = cloneTree(complexTree);
        });

        it('should return null for root node', () => {
            const parent = findParent(tree, 'root');
            
            expect(parent).toBeNull();
        });

        it('should find parent of phase (root)', () => {
            const parent = findParent(tree, 'phase-0');
            
            expect(parent).toBeDefined();
            expect(parent.id).toBe('root');
        });

        it('should find parent of item (phase)', () => {
            const parent = findParent(tree, 'item-0-0');
            
            expect(parent).toBeDefined();
            expect(parent.id).toBe('phase-0');
        });

        it('should find parent of subtask (item)', () => {
            const parent = findParent(tree, 'sub-0-0-0');
            
            expect(parent).toBeDefined();
            expect(parent.id).toBe('item-0-0');
        });

        it('should find parent in deep tree', () => {
            const deep = cloneTree(deepTree);
            const parent = findParent(deep, 'sub-0-0-0-0');
            
            expect(parent).toBeDefined();
            expect(parent.id).toBe('sub-0-0-0');
        });

        it('should return null for non-existent node', () => {
            const parent = findParent(tree, 'does-not-exist');
            
            expect(parent).toBeNull();
        });
    });

    describe('createTestTree()', () => {
        
        it('should create tree with default values', () => {
            const tree = createTestTree();
            
            expect(tree.id).toBe('root');
            expect(tree.schemaVersion).toBe(1);
            expect(tree.hyperedges).toEqual([]);
            expect(tree.children).toEqual([]);
        });

        it('should allow overriding properties', () => {
            const tree = createTestTree({
                name: 'Custom Project',
                schemaVersion: 2
            });
            
            expect(tree.name).toBe('Custom Project');
            expect(tree.schemaVersion).toBe(2);
        });

        it('should allow adding children', () => {
            const tree = createTestTree({
                children: [{ id: 'phase-0', name: 'Test Phase' }]
            });
            
            expect(tree.children.length).toBe(1);
            expect(tree.children[0].name).toBe('Test Phase');
        });
    });

    describe('createTestNode()', () => {
        
        it('should create node with provenance', () => {
            const node = createTestNode('item');
            
            expect(node.type).toBe('item');
            expect(node.provenance).toBeDefined();
            expect(node.provenance.source).toBe('user');
        });

        it('should create node with phenomenology array', () => {
            const node = createTestNode('item');
            
            expect(node.phenomenology).toEqual([]);
        });

        it('should create node with metrics', () => {
            const node = createTestNode('item');
            
            expect(node.metrics).toBeDefined();
            expect(node.metrics.editCount).toBe(0);
        });

        it('should allow overriding properties', () => {
            const node = createTestNode('subtask', {
                name: 'Custom Subtask',
                provenance: { source: 'ai-claude', timestamp: '2025-01-01' }
            });
            
            expect(node.name).toBe('Custom Subtask');
            expect(node.provenance.source).toBe('ai-claude');
        });

        it('should generate unique ids', () => {
            const node1 = createTestNode('item');
            const node2 = createTestNode('item');
            
            expect(node1.id).not.toBe(node2.id);
        });
    });
});
