/**
 * Provenance System Tests
 * 
 * Tests for tracking content origin (user vs AI vs import).
 * Critical for the Cognitive Citadel feature.
 */

import { describe, it, expect } from 'vitest';
import { 
    complexTree, 
    aiGeneratedTree,
    legacyTree,
    cloneTree,
    createUserNode,
    createAINode,
    findNodesBySource
} from '../fixtures/trees.js';

import { normalizeNode } from '../treelisty-core.js';

describe('Provenance System', () => {
    
    describe('provenance structure', () => {
        
        it('should have required fields', () => {
            const node = createUserNode('item');
            
            expect(node.provenance).toHaveProperty('source');
            expect(node.provenance).toHaveProperty('timestamp');
            expect(node.provenance).toHaveProperty('modelId');
        });

        it('should have valid source values', () => {
            const validSources = ['user', 'ai-import', 'ai-claude', 'ai-gemini', 'legacy'];
            
            validSources.forEach(source => {
                const node = { id: 'test' };
                normalizeNode(node, source);
                expect(node.provenance.source).toBe(source);
            });
        });

        it('should store modelId for AI sources', () => {
            const node = createAINode('item', 'claude-sonnet-4');
            
            expect(node.provenance.modelId).toBe('claude-sonnet-4');
        });

        it('should have null modelId for user sources', () => {
            const node = createUserNode('item');
            
            expect(node.provenance.modelId).toBeNull();
        });
    });

    describe('source tracking in trees', () => {
        
        it('should identify all user-created nodes', () => {
            const tree = cloneTree(complexTree);
            const userNodes = findNodesBySource(tree, 'user');
            
            // Complex tree has multiple user-created nodes
            expect(userNodes.length).toBeGreaterThan(0);
        });

        it('should identify all AI-imported nodes', () => {
            const tree = cloneTree(aiGeneratedTree);
            const aiNodes = findNodesBySource(tree, 'ai-import');
            
            // AI tree should have all AI nodes
            expect(aiNodes.length).toBeGreaterThan(0);
        });

        it('should identify legacy nodes after migration', () => {
            const tree = cloneTree(legacyTree);
            normalizeNode(tree, 'legacy');
            
            const legacyNodes = findNodesBySource(tree, 'legacy');
            
            // All nodes should be marked legacy
            expect(legacyNodes.length).toBeGreaterThan(0);
        });

        it('should track mixed provenance in single tree', () => {
            const tree = cloneTree(complexTree);
            
            const userNodes = findNodesBySource(tree, 'user');
            const aiNodes = findNodesBySource(tree, 'ai-claude');
            
            // Complex tree has both user and AI nodes
            expect(userNodes.length).toBeGreaterThan(0);
            expect(aiNodes.length).toBeGreaterThan(0);
        });
    });

    describe('timestamp validation', () => {
        
        it('should create valid ISO timestamp', () => {
            const node = createUserNode('item');
            const timestamp = node.provenance.timestamp;
            
            // Should be parseable
            const date = new Date(timestamp);
            expect(date.toString()).not.toBe('Invalid Date');
            
            // Should be ISO format
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it('should have recent timestamp', () => {
            const node = createUserNode('item');
            const timestamp = new Date(node.provenance.timestamp);
            const now = new Date();
            
            // Should be within last minute
            const diff = now - timestamp;
            expect(diff).toBeLessThan(60000);
        });

        it('should preserve existing timestamps', () => {
            const oldTimestamp = '2020-01-01T00:00:00.000Z';
            const node = {
                id: 'test',
                provenance: {
                    source: 'user',
                    timestamp: oldTimestamp,
                    modelId: null
                }
            };
            
            normalizeNode(node, 'user');
            
            expect(node.provenance.timestamp).toBe(oldTimestamp);
        });
    });

    describe('provenance preservation', () => {
        
        it('should not overwrite existing provenance on normalize', () => {
            const originalProvenance = {
                source: 'ai-claude',
                timestamp: '2025-01-01T00:00:00Z',
                modelId: 'claude-sonnet-4'
            };
            
            const node = {
                id: 'test',
                provenance: originalProvenance
            };
            
            normalizeNode(node, 'user'); // Try to override with 'user'
            
            expect(node.provenance.source).toBe('ai-claude');
            expect(node.provenance.modelId).toBe('claude-sonnet-4');
        });

        it('should preserve provenance through cloning', () => {
            const original = createAINode('item', 'gemini-2.5-pro');
            const cloned = JSON.parse(JSON.stringify(original));
            
            expect(cloned.provenance.source).toBe(original.provenance.source);
            expect(cloned.provenance.modelId).toBe(original.provenance.modelId);
        });
    });

    describe('provenance statistics', () => {
        
        it('should calculate AI vs human ratio', () => {
            const tree = cloneTree(complexTree);
            
            const userNodes = findNodesBySource(tree, 'user');
            const aiNodes = [
                ...findNodesBySource(tree, 'ai-claude'),
                ...findNodesBySource(tree, 'ai-import'),
                ...findNodesBySource(tree, 'ai-gemini')
            ];
            
            const total = userNodes.length + aiNodes.length;
            const aiRatio = aiNodes.length / total;
            
            expect(aiRatio).toBeGreaterThanOrEqual(0);
            expect(aiRatio).toBeLessThanOrEqual(1);
        });

        it('should identify fully AI-generated trees', () => {
            const tree = cloneTree(aiGeneratedTree);
            
            const userNodes = findNodesBySource(tree, 'user');
            const aiNodes = findNodesBySource(tree, 'ai-import');
            
            expect(userNodes.length).toBe(0);
            expect(aiNodes.length).toBeGreaterThan(0);
        });

        it('should identify fully user-created trees', () => {
            // Create tree with only user nodes
            const tree = {
                id: 'root',
                provenance: { source: 'user', timestamp: new Date().toISOString(), modelId: null },
                children: [{
                    id: 'phase',
                    provenance: { source: 'user', timestamp: new Date().toISOString(), modelId: null },
                    items: [{
                        id: 'item',
                        provenance: { source: 'user', timestamp: new Date().toISOString(), modelId: null }
                    }]
                }]
            };
            
            const userNodes = findNodesBySource(tree, 'user');
            const aiNodes = [
                ...findNodesBySource(tree, 'ai-claude'),
                ...findNodesBySource(tree, 'ai-import')
            ];
            
            expect(userNodes.length).toBe(3);
            expect(aiNodes.length).toBe(0);
        });
    });

    describe('model identification', () => {
        
        it('should distinguish between AI providers', () => {
            const claudeNode = createAINode('item', 'claude-sonnet-4');
            const geminiNode = createAINode('item', 'gemini-2.5-pro');
            const gptNode = createAINode('item', 'gpt-4o');
            
            expect(claudeNode.provenance.source).toContain('claude');
            expect(geminiNode.provenance.source).toContain('gemini');
            expect(gptNode.provenance.source).toContain('gpt');
        });

        it('should store full model identifier', () => {
            const node = createAINode('item', 'claude-sonnet-4-20250514');
            
            expect(node.provenance.modelId).toBe('claude-sonnet-4-20250514');
        });
    });
});
