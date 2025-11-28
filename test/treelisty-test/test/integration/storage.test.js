/**
 * Storage Integration Tests
 * 
 * Tests for localStorage persistence and data recovery.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
    minimalTree, 
    complexTree, 
    legacyTree,
    cloneTree 
} from '../fixtures/trees.js';

import { migrateTree, SCHEMA_VERSION } from '../treelisty-core.js';

describe('LocalStorage Integration', () => {
    
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Basic Storage Operations', () => {
        
        it('should store tree in localStorage', () => {
            const tree = cloneTree(minimalTree);
            const key = 'treelisty:tree:default';
            
            localStorage.setItem(key, JSON.stringify(tree));
            
            const stored = localStorage.getItem(key);
            expect(stored).not.toBeNull();
            
            const parsed = JSON.parse(stored);
            expect(parsed.name).toBe(tree.name);
        });

        it('should retrieve tree from localStorage', () => {
            const tree = cloneTree(minimalTree);
            const key = 'treelisty:tree:default';
            
            localStorage.setItem(key, JSON.stringify(tree));
            
            const retrieved = JSON.parse(localStorage.getItem(key));
            
            expect(retrieved.id).toBe(tree.id);
            expect(retrieved.schemaVersion).toBe(tree.schemaVersion);
        });

        it('should handle missing tree gracefully', () => {
            const key = 'treelisty:tree:nonexistent';
            
            const retrieved = localStorage.getItem(key);
            
            expect(retrieved).toBeNull();
        });

        it('should clear tree from localStorage', () => {
            const tree = cloneTree(minimalTree);
            const key = 'treelisty:tree:default';
            
            localStorage.setItem(key, JSON.stringify(tree));
            localStorage.removeItem(key);
            
            expect(localStorage.getItem(key)).toBeNull();
        });
    });

    describe('Schema Migration on Load', () => {
        
        it('should migrate legacy tree when loading', () => {
            const legacy = cloneTree(legacyTree);
            const key = 'treelisty:tree:default';
            
            // Store legacy (pre-migration) tree
            localStorage.setItem(key, JSON.stringify(legacy));
            
            // Load and migrate
            const loaded = JSON.parse(localStorage.getItem(key));
            migrateTree(loaded);
            
            expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
            expect(loaded.hyperedges).toBeDefined();
        });

        it('should add provenance to legacy nodes on load', () => {
            const legacy = cloneTree(legacyTree);
            const key = 'treelisty:tree:default';
            
            localStorage.setItem(key, JSON.stringify(legacy));
            
            const loaded = JSON.parse(localStorage.getItem(key));
            migrateTree(loaded);
            
            // Check that provenance was added
            expect(loaded.provenance).toBeDefined();
            expect(loaded.children[0].provenance).toBeDefined();
        });

        it('should preserve existing data during migration', () => {
            const legacy = cloneTree(legacyTree);
            const originalName = legacy.name;
            const originalItemName = legacy.children[0].items[0].name;
            
            localStorage.setItem('treelisty:tree:default', JSON.stringify(legacy));
            
            const loaded = JSON.parse(localStorage.getItem('treelisty:tree:default'));
            migrateTree(loaded);
            
            expect(loaded.name).toBe(originalName);
            expect(loaded.children[0].items[0].name).toBe(originalItemName);
        });
    });

    describe('Data Integrity', () => {
        
        it('should preserve complex tree structure', () => {
            const tree = cloneTree(complexTree);
            
            localStorage.setItem('treelisty:tree:test', JSON.stringify(tree));
            const loaded = JSON.parse(localStorage.getItem('treelisty:tree:test'));
            
            // Verify structure
            expect(loaded.children.length).toBe(tree.children.length);
            expect(loaded.children[0].items.length).toBe(tree.children[0].items.length);
            expect(loaded.children[0].items[0].subItems.length)
                .toBe(tree.children[0].items[0].subItems.length);
        });

        it('should preserve hyperedges', () => {
            const tree = cloneTree(complexTree);
            const originalHyperedges = tree.hyperedges.length;
            
            localStorage.setItem('treelisty:tree:test', JSON.stringify(tree));
            const loaded = JSON.parse(localStorage.getItem('treelisty:tree:test'));
            
            expect(loaded.hyperedges.length).toBe(originalHyperedges);
        });

        it('should preserve aiConfig', () => {
            const tree = cloneTree(complexTree);
            
            localStorage.setItem('treelisty:tree:test', JSON.stringify(tree));
            const loaded = JSON.parse(localStorage.getItem('treelisty:tree:test'));
            
            expect(loaded.aiConfig.dialecticMode).toBe(tree.aiConfig.dialecticMode);
            expect(loaded.aiConfig.tone).toBe(tree.aiConfig.tone);
        });

        it('should preserve provenance on all nodes', () => {
            const tree = cloneTree(complexTree);
            
            localStorage.setItem('treelisty:tree:test', JSON.stringify(tree));
            const loaded = JSON.parse(localStorage.getItem('treelisty:tree:test'));
            
            // Check provenance at various levels
            expect(loaded.children[0].provenance).toBeDefined();
            expect(loaded.children[0].items[0].provenance).toBeDefined();
            expect(loaded.children[0].items[0].subItems[0].provenance).toBeDefined();
        });

        it('should preserve phenomenology arrays', () => {
            const tree = cloneTree(complexTree);
            const originalPhenomenology = tree.children[0].items[0].phenomenology;
            
            localStorage.setItem('treelisty:tree:test', JSON.stringify(tree));
            const loaded = JSON.parse(localStorage.getItem('treelisty:tree:test'));
            
            expect(loaded.children[0].items[0].phenomenology)
                .toEqual(originalPhenomenology);
        });
    });

    describe('Storage Size Handling', () => {
        
        it('should handle large trees', () => {
            // Create a tree with many items
            const largeTree = cloneTree(minimalTree);
            for (let i = 0; i < 100; i++) {
                largeTree.children[0].items.push({
                    id: `item-${i}`,
                    name: `Item ${i}`,
                    description: 'A'.repeat(1000), // 1KB each
                    provenance: { source: 'user', timestamp: new Date().toISOString() }
                });
            }
            
            // Should not throw
            expect(() => {
                localStorage.setItem('treelisty:tree:large', JSON.stringify(largeTree));
            }).not.toThrow();
            
            const loaded = JSON.parse(localStorage.getItem('treelisty:tree:large'));
            expect(loaded.children[0].items.length).toBe(101); // 1 original + 100 added
        });

        it('should calculate approximate storage size', () => {
            const tree = cloneTree(complexTree);
            const json = JSON.stringify(tree);
            const sizeKB = json.length / 1024;
            
            // Complex tree should be reasonable size
            expect(sizeKB).toBeLessThan(100); // Less than 100KB
        });
    });

    describe('Multiple Trees', () => {
        
        it('should store multiple trees independently', () => {
            const tree1 = cloneTree(minimalTree);
            tree1.name = 'Project 1';
            
            const tree2 = cloneTree(minimalTree);
            tree2.name = 'Project 2';
            
            localStorage.setItem('treelisty:tree:project1', JSON.stringify(tree1));
            localStorage.setItem('treelisty:tree:project2', JSON.stringify(tree2));
            
            const loaded1 = JSON.parse(localStorage.getItem('treelisty:tree:project1'));
            const loaded2 = JSON.parse(localStorage.getItem('treelisty:tree:project2'));
            
            expect(loaded1.name).toBe('Project 1');
            expect(loaded2.name).toBe('Project 2');
        });

        it('should list all stored trees', () => {
            localStorage.setItem('treelisty:tree:a', JSON.stringify({ id: 'a' }));
            localStorage.setItem('treelisty:tree:b', JSON.stringify({ id: 'b' }));
            localStorage.setItem('other:key', 'not a tree');
            
            const treeKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('treelisty:tree:')) {
                    treeKeys.push(key);
                }
            }
            
            expect(treeKeys.length).toBe(2);
        });
    });

    describe('Error Handling', () => {
        
        it('should handle corrupted JSON gracefully', () => {
            localStorage.setItem('treelisty:tree:corrupt', '{invalid json');
            
            expect(() => {
                JSON.parse(localStorage.getItem('treelisty:tree:corrupt'));
            }).toThrow();
        });

        it('should handle null values', () => {
            localStorage.setItem('treelisty:tree:null', 'null');
            
            const loaded = JSON.parse(localStorage.getItem('treelisty:tree:null'));
            expect(loaded).toBeNull();
        });
    });
});
