/**
 * Collaboration Tests
 *
 * Tests for branch extraction, sharing, and merging functionality.
 * Build 199+ - Tests the Share/Merge collaboration workflow.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    complexTree,
    deepTree,
    cloneTree,
    countNodes,
    createUserNode
} from '../fixtures/trees.js';

// Import from extracted module
import {
    getNodeById,
    extractSubtree,
    generateBranchURL,
    parseBranchFromURL,
    performBranchMerge,
    getAncestryPath,
    getDeviceFingerprint
} from '../treelisty-core.js';

// ============================================================================
// BRANCH FIXTURES
// ============================================================================

/**
 * Create a sample branch token for testing
 */
function createTestBranch(nodes, overrides = {}) {
    return {
        branchId: `branch-${Date.now()}-test`,
        sourceProjectId: 'root',
        sourceProjectName: 'Test Project',
        sourcePattern: 'generic',
        createdAt: new Date().toISOString(),
        createdBy: 'device-test-fingerprint',
        ancestry: [
            { id: 'root', name: 'Test Project', icon: '🌳' }
        ],
        hyperedgeId: null,
        selectedNodeIds: nodes.map(n => n.id),
        nodes: nodes,
        schemaVersion: 2,
        ...overrides
    };
}

// ============================================================================
// EXTRACTION TESTS
// ============================================================================

describe('Collaboration - Branch Extraction', () => {
    let tree;

    beforeEach(() => {
        tree = cloneTree(complexTree);
    });

    describe('extractSubtree()', () => {

        it('should extract a single node by ID', () => {
            const branch = extractSubtree(tree, ['item-0-0']);

            expect(branch).toBeDefined();
            expect(branch.error).toBeUndefined();
            expect(branch.nodes).toHaveLength(1);
            expect(branch.nodes[0].id).toBe('item-0-0');
            expect(branch.nodes[0].name).toBe('Literature Review');
        });

        it('should extract node with all current property values', () => {
            // Modify a node first
            const node = getNodeById(tree, 'item-0-0');
            node.description = 'MODIFIED DESCRIPTION';
            node.cost = 9999;

            const branch = extractSubtree(tree, ['item-0-0']);

            expect(branch.nodes[0].description).toBe('MODIFIED DESCRIPTION');
            expect(branch.nodes[0].cost).toBe(9999);
        });

        it('should deep clone nodes (not reference)', () => {
            const branch = extractSubtree(tree, ['item-0-0']);

            // Modify original after extraction
            const original = getNodeById(tree, 'item-0-0');
            original.name = 'Changed After Extract';

            // Branch should have original name
            expect(branch.nodes[0].name).toBe('Literature Review');
        });

        it('should include all descendants (subItems)', () => {
            const branch = extractSubtree(tree, ['item-0-0']);

            // item-0-0 has 2 subItems
            expect(branch.nodes[0].subItems).toHaveLength(2);
            expect(branch.nodes[0].subItems[0].id).toBe('sub-0-0-0');
            expect(branch.nodes[0].subItems[1].id).toBe('sub-0-0-1');
        });

        it('should extract multiple nodes', () => {
            const branch = extractSubtree(tree, ['item-0-0', 'item-0-1']);

            expect(branch.nodes).toHaveLength(2);
            expect(branch.nodes.map(n => n.id)).toContain('item-0-0');
            expect(branch.nodes.map(n => n.id)).toContain('item-0-1');
        });

        it('should extract a phase with all items', () => {
            const branch = extractSubtree(tree, ['phase-0']);

            expect(branch.nodes).toHaveLength(1);
            expect(branch.nodes[0].type).toBe('phase');
            expect(branch.nodes[0].items).toHaveLength(2);
        });

        it('should include ancestry path', () => {
            const branch = extractSubtree(tree, ['item-0-0']);

            expect(branch.ancestry).toBeDefined();
            expect(Array.isArray(branch.ancestry)).toBe(true);
            // Should include at least the root
            expect(branch.ancestry.some(a => a.id === 'root')).toBe(true);
        });

        it('should include source project info', () => {
            const branch = extractSubtree(tree, ['item-0-0']);

            expect(branch.sourceProjectId).toBe('root');
            expect(branch.sourceProjectName).toBe('Complex Project');
        });

        it('should include device fingerprint', () => {
            const branch = extractSubtree(tree, ['item-0-0']);

            expect(branch.createdBy).toBeDefined();
            expect(typeof branch.createdBy).toBe('string');
        });

        it('should return error for empty node list', () => {
            const branch = extractSubtree(tree, []);

            expect(branch.error).toBeDefined();
            expect(branch.error).toContain('No nodes');
        });

        it('should return error for non-existent node', () => {
            const branch = extractSubtree(tree, ['does-not-exist']);

            expect(branch.error).toBeDefined();
        });

        it('should handle deeply nested nodes', () => {
            const deep = cloneTree(deepTree);
            const branch = extractSubtree(deep, ['sub-0-0-0']);

            expect(branch.nodes).toHaveLength(1);
            expect(branch.nodes[0].subItems).toHaveLength(1);
            expect(branch.nodes[0].subItems[0].id).toBe('sub-0-0-0-0');
        });
    });
});

// ============================================================================
// URL ENCODING/DECODING TESTS
// ============================================================================

describe('Collaboration - URL Encoding', () => {

    describe('generateBranchURL()', () => {

        it('should generate a URL with branch parameter', () => {
            const branch = createTestBranch([createUserNode('item')]);
            const url = generateBranchURL(branch);

            expect(url).toContain('?branch=');
        });

        it('should encode the branch data', () => {
            const branch = createTestBranch([createUserNode('item')]);
            const url = generateBranchURL(branch);

            // URL should contain encoded branch data
            // Note: Test mock uses base64 (expands data), real impl uses LZ compression
            const urlParam = url.split('?branch=')[1];
            expect(urlParam.length).toBeGreaterThan(0);

            // Verify it's URL-safe (no special chars that need escaping)
            expect(urlParam).toMatch(/^[A-Za-z0-9+/=%-]+$/);
        });

        it('should produce URL-safe encoding', () => {
            const branch = createTestBranch([createUserNode('item', {
                name: 'Node with "quotes" & special <chars>'
            })]);
            const url = generateBranchURL(branch);

            // Should not contain raw special characters
            const param = url.split('?branch=')[1];
            expect(param).not.toContain('"');
            expect(param).not.toContain('&');
            expect(param).not.toContain('<');
        });
    });

    describe('parseBranchFromURL()', () => {

        it('should decode a valid branch URL', () => {
            const originalBranch = createTestBranch([
                createUserNode('item', { id: 'test-item', name: 'Test Item' })
            ]);
            const url = generateBranchURL(originalBranch);
            const encoded = url.split('?branch=')[1];

            const decoded = parseBranchFromURL(encoded);

            expect(decoded).toBeDefined();
            expect(decoded.branchId).toBe(originalBranch.branchId);
            expect(decoded.nodes).toHaveLength(1);
            expect(decoded.nodes[0].name).toBe('Test Item');
        });

        it('should preserve all node properties through encode/decode', () => {
            const node = createUserNode('item', {
                id: 'test-item',
                name: 'Full Node',
                description: 'Detailed description here',
                cost: 1500,
                pmStatus: 'In Progress',
                pmProgress: 50,
                dependencies: ['other-item']
            });
            const originalBranch = createTestBranch([node]);
            const url = generateBranchURL(originalBranch);
            const encoded = url.split('?branch=')[1];

            const decoded = parseBranchFromURL(encoded);

            expect(decoded.nodes[0].description).toBe('Detailed description here');
            expect(decoded.nodes[0].cost).toBe(1500);
            expect(decoded.nodes[0].pmStatus).toBe('In Progress');
            expect(decoded.nodes[0].pmProgress).toBe(50);
            expect(decoded.nodes[0].dependencies).toContain('other-item');
        });

        it('should preserve nested subItems through encode/decode', () => {
            const node = createUserNode('item', {
                id: 'parent',
                name: 'Parent Item',
                subItems: [
                    createUserNode('subtask', { id: 'child1', name: 'Child 1' }),
                    createUserNode('subtask', { id: 'child2', name: 'Child 2' })
                ]
            });
            const originalBranch = createTestBranch([node]);
            const url = generateBranchURL(originalBranch);
            const encoded = url.split('?branch=')[1];

            const decoded = parseBranchFromURL(encoded);

            expect(decoded.nodes[0].subItems).toHaveLength(2);
            expect(decoded.nodes[0].subItems[0].name).toBe('Child 1');
            expect(decoded.nodes[0].subItems[1].name).toBe('Child 2');
        });

        it('should return null for invalid encoded data', () => {
            const decoded = parseBranchFromURL('invalid-not-lz-compressed');

            expect(decoded).toBeNull();
        });

        it('should return null for empty string', () => {
            const decoded = parseBranchFromURL('');

            expect(decoded).toBeNull();
        });
    });
});

// ============================================================================
// MERGE TESTS
// ============================================================================

describe('Collaboration - Branch Merging', () => {
    let tree;

    beforeEach(() => {
        tree = cloneTree(complexTree);
    });

    describe('performBranchMerge()', () => {

        it('should update existing node with new values', () => {
            // Create a branch with modified item
            const modifiedItem = cloneTree(getNodeById(tree, 'item-0-0'));
            modifiedItem.name = 'UPDATED NAME';
            modifiedItem.description = 'UPDATED DESCRIPTION';
            modifiedItem.cost = 5000;

            const branch = createTestBranch([modifiedItem], {
                sourceProjectId: tree.id,
                sourceProjectName: tree.name
            });

            performBranchMerge(tree, branch);

            const merged = getNodeById(tree, 'item-0-0');
            expect(merged.name).toBe('UPDATED NAME');
            expect(merged.description).toBe('UPDATED DESCRIPTION');
            expect(merged.cost).toBe(5000);
        });

        it('should deep replace subItems', () => {
            // Get original item and add a new subItem
            const modifiedItem = cloneTree(getNodeById(tree, 'item-0-0'));
            modifiedItem.subItems.push(
                createUserNode('subtask', { id: 'new-sub', name: 'New Subtask' })
            );

            const branch = createTestBranch([modifiedItem], {
                sourceProjectId: tree.id,
                sourceProjectName: tree.name
            });

            performBranchMerge(tree, branch);

            const merged = getNodeById(tree, 'item-0-0');
            expect(merged.subItems).toHaveLength(3);
            expect(merged.subItems.some(s => s.id === 'new-sub')).toBe(true);
        });

        it('should update nested subItem properties', () => {
            // Modify a nested subtask
            const modifiedItem = cloneTree(getNodeById(tree, 'item-0-0'));
            modifiedItem.subItems[0].name = 'MODIFIED SUBTASK';
            modifiedItem.subItems[0].description = 'New subtask description';

            const branch = createTestBranch([modifiedItem], {
                sourceProjectId: tree.id,
                sourceProjectName: tree.name
            });

            performBranchMerge(tree, branch);

            const merged = getNodeById(tree, 'item-0-0');
            expect(merged.subItems[0].name).toBe('MODIFIED SUBTASK');
            expect(merged.subItems[0].description).toBe('New subtask description');
        });

        it('should preserve node ID after merge', () => {
            const modifiedItem = cloneTree(getNodeById(tree, 'item-0-0'));
            modifiedItem.name = 'New Name';

            const branch = createTestBranch([modifiedItem], {
                sourceProjectId: tree.id,
                sourceProjectName: tree.name
            });

            performBranchMerge(tree, branch);

            const merged = getNodeById(tree, 'item-0-0');
            expect(merged.id).toBe('item-0-0');
        });

        it('should handle merging multiple nodes', () => {
            const item1 = cloneTree(getNodeById(tree, 'item-0-0'));
            const item2 = cloneTree(getNodeById(tree, 'item-0-1'));
            item1.name = 'Updated Item 1';
            item2.name = 'Updated Item 2';

            const branch = createTestBranch([item1, item2], {
                sourceProjectId: tree.id,
                sourceProjectName: tree.name
            });

            performBranchMerge(tree, branch);

            expect(getNodeById(tree, 'item-0-0').name).toBe('Updated Item 1');
            expect(getNodeById(tree, 'item-0-1').name).toBe('Updated Item 2');
        });

        it('should add new node if not found in tree', () => {
            const newNode = createUserNode('item', {
                id: 'brand-new-item',
                name: 'Brand New Item'
            });

            const branch = createTestBranch([newNode], {
                sourceProjectId: tree.id,
                sourceProjectName: tree.name,
                ancestry: [
                    { id: 'root', name: tree.name },
                    { id: 'phase-0', name: 'Research' }
                ]
            });

            performBranchMerge(tree, branch);

            // Should be added somewhere in the tree
            const added = getNodeById(tree, 'brand-new-item');
            expect(added).toBeDefined();
            expect(added.name).toBe('Brand New Item');
        });

        it('should not merge if branch has no nodes', () => {
            const branch = createTestBranch([], {
                sourceProjectId: tree.id,
                sourceProjectName: tree.name
            });
            branch.nodes = [];

            // Should not throw
            expect(() => performBranchMerge(tree, branch)).not.toThrow();
        });

        it('should handle null branch gracefully', () => {
            expect(() => performBranchMerge(tree, null)).not.toThrow();
        });
    });
});

// ============================================================================
// ANCESTRY TESTS
// ============================================================================

describe('Collaboration - Ancestry Path', () => {
    let tree;

    beforeEach(() => {
        tree = cloneTree(complexTree);
    });

    describe('getAncestryPath()', () => {

        it('should return empty array for root', () => {
            const ancestry = getAncestryPath(tree, 'root');

            expect(ancestry).toEqual([]);
        });

        it('should return root for phase', () => {
            const ancestry = getAncestryPath(tree, 'phase-0');

            expect(ancestry).toHaveLength(1);
            expect(ancestry[0].id).toBe('root');
        });

        it('should return full path for item', () => {
            const ancestry = getAncestryPath(tree, 'item-0-0');

            expect(ancestry).toHaveLength(2);
            expect(ancestry[0].id).toBe('root');
            expect(ancestry[1].id).toBe('phase-0');
        });

        it('should return full path for deeply nested subtask', () => {
            const deep = cloneTree(deepTree);
            const ancestry = getAncestryPath(deep, 'sub-0-0-0-0');

            expect(ancestry).toHaveLength(4);
            expect(ancestry.map(a => a.id)).toEqual([
                'root', 'phase-0', 'item-0-0', 'sub-0-0-0'
            ]);
        });

        it('should include node names in ancestry', () => {
            const ancestry = getAncestryPath(tree, 'item-0-0');

            expect(ancestry[0].name).toBe('Complex Project');
            expect(ancestry[1].name).toBe('Research');
        });
    });
});

// ============================================================================
// DEVICE FINGERPRINT TESTS
// ============================================================================

describe('Collaboration - Device Fingerprint', () => {

    describe('getDeviceFingerprint()', () => {

        it('should return a string', () => {
            const fingerprint = getDeviceFingerprint();

            expect(typeof fingerprint).toBe('string');
        });

        it('should return consistent value', () => {
            const fp1 = getDeviceFingerprint();
            const fp2 = getDeviceFingerprint();

            expect(fp1).toBe(fp2);
        });

        it('should have reasonable length', () => {
            const fingerprint = getDeviceFingerprint();

            expect(fingerprint.length).toBeGreaterThan(10);
            expect(fingerprint.length).toBeLessThan(100);
        });
    });
});

// ============================================================================
// ROUND-TRIP TESTS (Full workflow)
// ============================================================================

describe('Collaboration - Full Round Trip', () => {
    let tree;

    beforeEach(() => {
        tree = cloneTree(complexTree);
    });

    it('should preserve all changes through extract → encode → decode → merge', () => {
        // Step 1: Modify a node
        const originalNode = getNodeById(tree, 'item-0-0');
        originalNode.name = 'Fully Modified Name';
        originalNode.description = 'Completely new description with special chars: "quotes" & <angles>';
        originalNode.cost = 12345;
        originalNode.pmStatus = 'Done';
        originalNode.pmProgress = 100;

        // Step 2: Extract to branch
        const branch = extractSubtree(tree, ['item-0-0']);
        expect(branch.nodes[0].name).toBe('Fully Modified Name');

        // Step 3: Encode to URL
        const url = generateBranchURL(branch);
        const encoded = url.split('?branch=')[1];

        // Step 4: Decode from URL
        const decoded = parseBranchFromURL(encoded);
        expect(decoded.nodes[0].name).toBe('Fully Modified Name');
        expect(decoded.nodes[0].description).toContain('"quotes"');

        // Step 5: Create fresh tree and merge
        const targetTree = cloneTree(complexTree);
        performBranchMerge(targetTree, decoded);

        // Step 6: Verify all properties merged
        const merged = getNodeById(targetTree, 'item-0-0');
        expect(merged.name).toBe('Fully Modified Name');
        expect(merged.description).toBe('Completely new description with special chars: "quotes" & <angles>');
        expect(merged.cost).toBe(12345);
        expect(merged.pmStatus).toBe('Done');
        expect(merged.pmProgress).toBe(100);
    });

    it('should preserve nested structure through full round trip', () => {
        // Modify nested structure
        const item = getNodeById(tree, 'item-0-0');
        item.subItems[0].name = 'Modified Child 1';
        item.subItems[1].name = 'Modified Child 2';
        item.subItems.push(createUserNode('subtask', {
            id: 'new-child',
            name: 'Added Child 3'
        }));

        // Full round trip
        const branch = extractSubtree(tree, ['item-0-0']);
        const url = generateBranchURL(branch);
        const decoded = parseBranchFromURL(url.split('?branch=')[1]);

        const targetTree = cloneTree(complexTree);
        performBranchMerge(targetTree, decoded);

        const merged = getNodeById(targetTree, 'item-0-0');
        expect(merged.subItems).toHaveLength(3);
        expect(merged.subItems[0].name).toBe('Modified Child 1');
        expect(merged.subItems[1].name).toBe('Modified Child 2');
        expect(merged.subItems[2].name).toBe('Added Child 3');
    });
});
