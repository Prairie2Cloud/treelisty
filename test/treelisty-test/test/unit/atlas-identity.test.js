/**
 * Atlas Identity Tests (Build 575 - Phase-1 Link Resolution)
 *
 * Tests for the Atlas cross-tree intelligence infrastructure:
 * Phase-0 (Build 573):
 * - treeId: immutable tree identifier
 * - nodeGuid: stable node identifier
 * - uidOf(): single source of truth for Atlas UIDs
 * - parseUid(): UID parsing
 * - Link pattern matching
 * - Migration functions
 *
 * Phase-1 (Build 575):
 * - findNodeByName(): search nodes by name
 * - findNodeByGuid(): search nodes by nodeGuid
 * - resolveAtlasLink(): resolve [[link]] to target node
 * - renderAtlasLinks(): render links as clickable HTML
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Atlas Identity Infrastructure', () => {
    let htmlContent;
    let extractedFunctions;

    beforeAll(() => {
        // Read the main HTML file
        const htmlPath = resolve(__dirname, '../../../../treeplexity.html');
        htmlContent = readFileSync(htmlPath, 'utf-8');

        // Extract and evaluate the Atlas identity functions directly
        // This avoids JSDOM issues with localStorage, etc.
        const atlasCodeMatch = htmlContent.match(
            /\/\/ ATLAS IDENTITY INFRASTRUCTURE[\s\S]*?\/\/ END ATLAS IDENTITY INFRASTRUCTURE/
        );

        if (!atlasCodeMatch) {
            throw new Error('Could not find Atlas Identity Infrastructure in treeplexity.html');
        }

        // Create evaluation context with crypto polyfill
        const cryptoPolyfill = `
            const crypto = {
                getRandomValues: (arr) => {
                    for (let i = 0; i < arr.length; i++) {
                        arr[i] = Math.floor(Math.random() * 256);
                    }
                    return arr;
                }
            };
        `;

        // Extract function bodies and create a module-like object
        const code = cryptoPolyfill + atlasCodeMatch[0];
        const fn = new Function(code + `
            return {
                // Phase-0 functions
                generateTreeId,
                generateNodeGuid,
                uidOf,
                parseUid,
                ATLAS_LINK_PATTERN,
                parseAtlasLink,
                migrateNodeIdentity,
                migrateTreeIdentity,
                // Phase-1 functions
                findNodeByName,
                findNodeByGuid,
                resolveAtlasLink,
                escapeHtml
            };
        `);

        extractedFunctions = fn();
    });

    describe('generateTreeId()', () => {
        it('should generate a treeId starting with "tree_"', () => {
            const treeId = extractedFunctions.generateTreeId();
            expect(treeId).toMatch(/^tree_[0-9a-f]{8}$/);
        });

        it('should generate unique IDs on each call', () => {
            const id1 = extractedFunctions.generateTreeId();
            const id2 = extractedFunctions.generateTreeId();
            expect(id1).not.toBe(id2);
        });
    });

    describe('generateNodeGuid()', () => {
        it('should generate a nodeGuid starting with "n_"', () => {
            const guid = extractedFunctions.generateNodeGuid();
            expect(guid).toMatch(/^n_[0-9a-f]{8}$/);
        });

        it('should generate unique GUIDs on each call', () => {
            const guid1 = extractedFunctions.generateNodeGuid();
            const guid2 = extractedFunctions.generateNodeGuid();
            expect(guid1).not.toBe(guid2);
        });
    });

    describe('uidOf()', () => {
        it('should return composite UID in format treeId:nodeGuid', () => {
            const node = { id: 'test', nodeGuid: 'n_12345678' };
            const uid = extractedFunctions.uidOf('tree_abcdef00', node);
            expect(uid).toBe('tree_abcdef00:n_12345678');
        });

        it('should throw error if node is null', () => {
            expect(() => extractedFunctions.uidOf('tree_abc', null)).toThrow('[Atlas]');
        });

        it('should throw error if treeId is null', () => {
            const node = { id: 'test', nodeGuid: 'n_12345678' };
            expect(() => extractedFunctions.uidOf(null, node)).toThrow('[Atlas]');
        });

        it('should auto-generate nodeGuid if missing', () => {
            const node = { id: 'test-no-guid' };
            const uid = extractedFunctions.uidOf('tree_abc', node);
            expect(uid).toMatch(/^tree_abc:n_[0-9a-f]{8}$/);
            expect(node.nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
        });
    });

    describe('parseUid()', () => {
        it('should parse UID into treeId and nodeGuid', () => {
            const result = extractedFunctions.parseUid('tree_abcdef00:n_12345678');
            expect(result.treeId).toBe('tree_abcdef00');
            expect(result.nodeGuid).toBe('n_12345678');
        });

        it('should throw error for invalid UID format (no colon)', () => {
            expect(() => extractedFunctions.parseUid('invalid-uid')).toThrow('[Atlas]');
        });

        it('should throw error for null UID', () => {
            expect(() => extractedFunctions.parseUid(null)).toThrow('[Atlas]');
        });
    });

    describe('ATLAS_LINK_PATTERN', () => {
        it('should be a RegExp', () => {
            expect(extractedFunctions.ATLAS_LINK_PATTERN).toBeInstanceOf(RegExp);
        });

        it('should match soft links [[Title]]', () => {
            const text = 'See [[My Task]] for details';
            // Reset regex state by creating fresh regex
            const pattern = new RegExp(extractedFunctions.ATLAS_LINK_PATTERN.source, 'g');
            const matches = [...text.matchAll(pattern)];
            expect(matches.length).toBe(1);
            expect(matches[0][1]).toBe('My Task');
        });

        it('should match UID links [[uid:tree:node]]', () => {
            const text = 'See [[uid:tree_abc:n_123]] for details';
            const pattern = new RegExp(extractedFunctions.ATLAS_LINK_PATTERN.source, 'g');
            const matches = [...text.matchAll(pattern)];
            expect(matches.length).toBe(1);
            expect(matches[0][1]).toBe('uid:tree_abc:n_123');
        });

        it('should match UID links with alias [[uid:tree:node|Alias]]', () => {
            const text = 'See [[uid:tree_abc:n_123|My Task]] for details';
            const pattern = new RegExp(extractedFunctions.ATLAS_LINK_PATTERN.source, 'g');
            const matches = [...text.matchAll(pattern)];
            expect(matches.length).toBe(1);
            expect(matches[0][1]).toBe('uid:tree_abc:n_123|My Task');
        });

        it('should match multiple links in one string', () => {
            const text = 'Link to [[First]] and [[Second]] and [[uid:tree:n_x|Third]]';
            const pattern = new RegExp(extractedFunctions.ATLAS_LINK_PATTERN.source, 'g');
            const matches = [...text.matchAll(pattern)];
            expect(matches.length).toBe(3);
        });
    });

    describe('parseAtlasLink()', () => {
        it('should parse soft link', () => {
            const result = extractedFunctions.parseAtlasLink('My Task');
            expect(result.type).toBe('soft');
            expect(result.searchText).toBe('My Task');
            expect(result.displayText).toBe('My Task');
        });

        it('should parse soft link with alias', () => {
            const result = extractedFunctions.parseAtlasLink('Original Title|Display Name');
            expect(result.type).toBe('soft');
            expect(result.searchText).toBe('Original Title');
            expect(result.displayText).toBe('Display Name');
        });

        it('should parse UID link', () => {
            const result = extractedFunctions.parseAtlasLink('uid:tree_abc:n_123');
            expect(result.type).toBe('uid');
            expect(result.uid).toBe('tree_abc:n_123');
            expect(result.displayText).toBeNull();
        });

        it('should parse UID link with alias', () => {
            const result = extractedFunctions.parseAtlasLink('uid:tree_abc:n_123|My Task');
            expect(result.type).toBe('uid');
            expect(result.uid).toBe('tree_abc:n_123');
            expect(result.displayText).toBe('My Task');
        });
    });

    describe('migrateTreeIdentity()', () => {
        it('should add treeId if missing', () => {
            const tree = { id: 'root', name: 'Test' };
            extractedFunctions.migrateTreeIdentity(tree);
            expect(tree.treeId).toMatch(/^tree_[0-9a-f]{8}$/);
        });

        it('should not overwrite existing treeId', () => {
            const tree = { id: 'root', treeId: 'tree_existing1', name: 'Test' };
            extractedFunctions.migrateTreeIdentity(tree);
            expect(tree.treeId).toBe('tree_existing1');
        });

        it('should add nodeGuid to root', () => {
            const tree = { id: 'root', name: 'Test' };
            extractedFunctions.migrateTreeIdentity(tree);
            expect(tree.nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
        });

        it('should return true when migration occurs', () => {
            const tree = { id: 'root', name: 'Test' };
            const result = extractedFunctions.migrateTreeIdentity(tree);
            expect(result).toBe(true);
        });

        it('should return false for null tree', () => {
            const result = extractedFunctions.migrateTreeIdentity(null);
            expect(result).toBe(false);
        });
    });

    describe('migrateNodeIdentity()', () => {
        it('should add nodeGuid if missing', () => {
            const node = { id: 'test' };
            extractedFunctions.migrateNodeIdentity(node);
            expect(node.nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
        });

        it('should not overwrite existing nodeGuid', () => {
            const node = { id: 'test', nodeGuid: 'n_existing1' };
            extractedFunctions.migrateNodeIdentity(node);
            expect(node.nodeGuid).toBe('n_existing1');
        });

        it('should recursively add nodeGuid to children', () => {
            const tree = {
                id: 'root',
                children: [
                    { id: 'child1' },
                    { id: 'child2', children: [{ id: 'grandchild' }] }
                ]
            };
            extractedFunctions.migrateNodeIdentity(tree);
            expect(tree.children[0].nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
            expect(tree.children[1].nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
            expect(tree.children[1].children[0].nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
        });

        it('should handle items array', () => {
            const node = {
                id: 'phase',
                items: [{ id: 'item1' }, { id: 'item2' }]
            };
            extractedFunctions.migrateNodeIdentity(node);
            expect(node.items[0].nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
            expect(node.items[1].nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
        });

        it('should handle subtasks array', () => {
            const node = {
                id: 'item',
                subtasks: [{ id: 'sub1' }]
            };
            extractedFunctions.migrateNodeIdentity(node);
            expect(node.subtasks[0].nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
        });

        it('should handle subItems array', () => {
            const node = {
                id: 'item',
                subItems: [{ id: 'sub1' }]
            };
            extractedFunctions.migrateNodeIdentity(node);
            expect(node.subItems[0].nodeGuid).toMatch(/^n_[0-9a-f]{8}$/);
        });

        it('should return true when migration occurs', () => {
            const node = { id: 'test' };
            const result = extractedFunctions.migrateNodeIdentity(node);
            expect(result).toBe(true);
        });

        it('should return false when no migration needed', () => {
            const node = { id: 'test', nodeGuid: 'n_existing1' };
            const result = extractedFunctions.migrateNodeIdentity(node);
            expect(result).toBe(false);
        });
    });

    describe('Welcome tree identity (source code check)', () => {
        it('should have treeId in capexTree source', () => {
            expect(htmlContent).toContain("treeId: 'tree_welcome01'");
        });

        it('should have nodeGuid in capexTree source', () => {
            expect(htmlContent).toContain("nodeGuid: 'n_root0001'");
        });

        it('should have schemaVersion 2 in capexTree source', () => {
            expect(htmlContent).toContain('schemaVersion: 2');
        });
    });

    describe('Schema migration v2 (source code check)', () => {
        it('should have v2 migration in migrateTree function', () => {
            expect(htmlContent).toContain('currentVersion < 2');
            expect(htmlContent).toContain('Atlas Identity Lockdown');
            expect(htmlContent).toContain("tree.schemaVersion = 2");
        });

        it('should call migrateTreeIdentity in v2 migration', () => {
            expect(htmlContent).toContain('migrateTreeIdentity(tree)');
        });
    });

    describe('Node creation includes nodeGuid', () => {
        it('should add nodeGuid in MCP createNode', () => {
            expect(htmlContent).toContain('nodeGuid: node_data.nodeGuid || generateNodeGuid()');
        });

        it('should add nodeGuid in handleAddSubtask', () => {
            expect(htmlContent).toContain('nodeGuid: generateNodeGuid(), // Atlas: stable identity');
        });
    });

    // ========================================================================
    // Phase-1: Link Resolution Tests (Build 575)
    // ========================================================================

    describe('findNodeByName()', () => {
        const testTree = {
            id: 'root',
            name: 'Project Alpha',
            treeId: 'tree_test1234',
            nodeGuid: 'n_root0001',
            children: [
                {
                    id: 'phase1',
                    name: 'Phase One',
                    nodeGuid: 'n_phase001',
                    items: [
                        { id: 'item1', name: 'First Task', nodeGuid: 'n_item0001' },
                        { id: 'item2', name: 'Second Task', nodeGuid: 'n_item0002' }
                    ]
                },
                {
                    id: 'phase2',
                    name: 'Phase Two',
                    nodeGuid: 'n_phase002',
                    items: [
                        { id: 'item3', name: 'Third Task', nodeGuid: 'n_item0003' }
                    ]
                }
            ]
        };

        it('should find node by exact name match', () => {
            const result = extractedFunctions.findNodeByName(testTree, 'First Task');
            expect(result).not.toBeNull();
            expect(result.id).toBe('item1');
        });

        it('should be case-insensitive', () => {
            const result = extractedFunctions.findNodeByName(testTree, 'first task');
            expect(result).not.toBeNull();
            expect(result.id).toBe('item1');
        });

        it('should find root node', () => {
            const result = extractedFunctions.findNodeByName(testTree, 'Project Alpha');
            expect(result).not.toBeNull();
            expect(result.id).toBe('root');
        });

        it('should return null for non-existent node', () => {
            const result = extractedFunctions.findNodeByName(testTree, 'Does Not Exist');
            expect(result).toBeNull();
        });

        it('should handle null tree', () => {
            const result = extractedFunctions.findNodeByName(null, 'Test');
            expect(result).toBeNull();
        });

        it('should handle empty search text', () => {
            const result = extractedFunctions.findNodeByName(testTree, '');
            expect(result).toBeNull();
        });
    });

    describe('findNodeByGuid()', () => {
        const testTree = {
            id: 'root',
            name: 'Project',
            nodeGuid: 'n_root0001',
            children: [
                {
                    id: 'phase1',
                    name: 'Phase',
                    nodeGuid: 'n_phase001',
                    items: [
                        { id: 'item1', name: 'Task', nodeGuid: 'n_item0001' }
                    ]
                }
            ]
        };

        it('should find node by nodeGuid', () => {
            const result = extractedFunctions.findNodeByGuid(testTree, 'n_item0001');
            expect(result).not.toBeNull();
            expect(result.id).toBe('item1');
        });

        it('should find root by nodeGuid', () => {
            const result = extractedFunctions.findNodeByGuid(testTree, 'n_root0001');
            expect(result).not.toBeNull();
            expect(result.id).toBe('root');
        });

        it('should return null for non-existent guid', () => {
            const result = extractedFunctions.findNodeByGuid(testTree, 'n_nonexist');
            expect(result).toBeNull();
        });

        it('should handle null tree', () => {
            const result = extractedFunctions.findNodeByGuid(null, 'n_test');
            expect(result).toBeNull();
        });
    });

    describe('resolveAtlasLink()', () => {
        const testTree = {
            id: 'root',
            name: 'Test Project',
            treeId: 'tree_test1234',
            nodeGuid: 'n_root0001',
            children: [
                {
                    id: 'task1',
                    name: 'My Task',
                    nodeGuid: 'n_task0001'
                }
            ]
        };

        it('should resolve soft link to node', () => {
            const parsed = extractedFunctions.parseAtlasLink('My Task');
            const result = extractedFunctions.resolveAtlasLink(parsed, testTree);
            expect(result.resolved).toBe(true);
            expect(result.node.id).toBe('task1');
            expect(result.displayText).toBe('My Task');
        });

        it('should resolve soft link with alias', () => {
            const parsed = extractedFunctions.parseAtlasLink('My Task|Display Name');
            const result = extractedFunctions.resolveAtlasLink(parsed, testTree);
            expect(result.resolved).toBe(true);
            expect(result.node.id).toBe('task1');
            expect(result.displayText).toBe('Display Name');
        });

        it('should return unresolved for non-existent soft link', () => {
            const parsed = extractedFunctions.parseAtlasLink('Does Not Exist');
            const result = extractedFunctions.resolveAtlasLink(parsed, testTree);
            expect(result.resolved).toBe(false);
            expect(result.error).toContain('not found');
        });

        it('should resolve UID link in current tree', () => {
            const parsed = extractedFunctions.parseAtlasLink('uid:tree_test1234:n_task0001');
            const result = extractedFunctions.resolveAtlasLink(parsed, testTree);
            expect(result.resolved).toBe(true);
            expect(result.node.id).toBe('task1');
            expect(result.isLocal).toBe(true);
        });

        it('should resolve UID link with alias', () => {
            const parsed = extractedFunctions.parseAtlasLink('uid:tree_test1234:n_task0001|Custom Display');
            const result = extractedFunctions.resolveAtlasLink(parsed, testTree);
            expect(result.resolved).toBe(true);
            expect(result.displayText).toBe('Custom Display');
        });

        it('should mark cross-tree UID link as unresolved', () => {
            const parsed = extractedFunctions.parseAtlasLink('uid:tree_other:n_abc123');
            const result = extractedFunctions.resolveAtlasLink(parsed, testTree);
            expect(result.resolved).toBe(false);
            expect(result.isCrossTree).toBe(true);
            expect(result.targetTreeId).toBe('tree_other');
        });

        it('should handle null parsed link', () => {
            const result = extractedFunctions.resolveAtlasLink(null, testTree);
            expect(result.resolved).toBe(false);
            expect(result.error).toBe('No link provided');
        });
    });

    describe('escapeHtml()', () => {
        it('should escape HTML special characters', () => {
            expect(extractedFunctions.escapeHtml('<script>')).toBe('&lt;script&gt;');
            expect(extractedFunctions.escapeHtml('a & b')).toBe('a &amp; b');
            expect(extractedFunctions.escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
            expect(extractedFunctions.escapeHtml("it's")).toBe("it&#39;s");
        });

        it('should handle null/empty input', () => {
            expect(extractedFunctions.escapeHtml(null)).toBe('');
            expect(extractedFunctions.escapeHtml('')).toBe('');
        });
    });

    describe('Link resolution source code (Build 575)', () => {
        it('should have findNodeByName function', () => {
            expect(htmlContent).toContain('function findNodeByName(tree, searchText)');
        });

        it('should have findNodeByGuid function', () => {
            expect(htmlContent).toContain('function findNodeByGuid(tree, nodeGuid)');
        });

        it('should have resolveAtlasLink function', () => {
            expect(htmlContent).toContain('function resolveAtlasLink(parsedLink, currentTree)');
        });

        it('should have renderAtlasLinks function', () => {
            expect(htmlContent).toContain('function renderAtlasLinks(text)');
        });

        it('should have handleAtlasLinkClick function', () => {
            expect(htmlContent).toContain('function handleAtlasLinkClick(nodeId, nodeGuid)');
        });

        it('should integrate Atlas links in linkifyText', () => {
            expect(htmlContent).toContain('renderAtlasLinks(text)');
            expect(htmlContent).toContain('BUILD 575');
        });
    });
});
