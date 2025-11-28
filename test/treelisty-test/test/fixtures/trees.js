/**
 * Test Fixtures - Sample Tree Data
 * 
 * These fixtures provide consistent test data across all tests.
 * Use cloneTree() before modifying to avoid test pollution.
 */

// ============================================================================
// TREE FIXTURES
// ============================================================================

/**
 * Empty tree - minimal valid structure
 */
export const emptyTree = {
    id: 'root',
    name: 'Empty Project',
    type: 'root',
    schemaVersion: 1,
    hyperedges: [],
    snapshotRefs: [],
    aiConfig: {},
    children: []
};

/**
 * Legacy tree - pre-v1 schema (no provenance, no schemaVersion)
 */
export const legacyTree = {
    id: 'root',
    name: 'Legacy Project',
    children: [
        {
            id: 'phase-0',
            name: 'Phase 1',
            type: 'phase',
            items: [
                {
                    id: 'item-0-0',
                    name: 'Old Item',
                    description: 'No provenance here'
                }
            ]
        }
    ]
};

/**
 * Minimal tree - one phase, one item
 */
export const minimalTree = {
    id: 'root',
    name: 'Minimal Project',
    type: 'root',
    schemaVersion: 1,
    hyperedges: [],
    snapshotRefs: [],
    aiConfig: {},
    children: [
        {
            id: 'phase-0',
            name: 'Phase 1',
            type: 'phase',
            phase: 0,
            expanded: true,
            provenance: {
                source: 'user',
                timestamp: '2025-01-01T00:00:00.000Z',
                modelId: null
            },
            items: [
                {
                    id: 'item-0-0',
                    name: 'Item 1',
                    type: 'item',
                    description: 'Test item',
                    provenance: {
                        source: 'user',
                        timestamp: '2025-01-01T00:00:00.000Z',
                        modelId: null
                    },
                    phenomenology: [],
                    metrics: {
                        editCount: 0,
                        focusTime: 0,
                        lastModified: 1704067200000
                    }
                }
            ]
        }
    ]
};

/**
 * Complex tree - multiple phases, items, subtasks, and features
 */
export const complexTree = {
    id: 'root',
    name: 'Complex Project',
    type: 'root',
    schemaVersion: 1,
    hyperedges: [
        {
            id: 'he-1',
            nodes: ['item-0-0', 'item-1-0'],
            label: 'Related',
            type: 'reference'
        }
    ],
    snapshotRefs: [
        {
            id: 'snap-1',
            label: 'Initial state',
            timestamp: '2025-01-01T00:00:00.000Z'
        }
    ],
    aiConfig: {
        tone: 'critical',
        verbosity: 'concise',
        creativity: 0.5,
        dialecticMode: true,
        customInstructions: 'Be thorough'
    },
    provenance: {
        source: 'user',
        timestamp: '2025-01-01T00:00:00.000Z',
        modelId: null
    },
    phenomenology: [],
    metrics: {
        editCount: 5,
        focusTime: 3600000,
        lastModified: 1704067200000
    },
    children: [
        {
            id: 'phase-0',
            name: 'Research',
            type: 'phase',
            phase: 0,
            subtitle: 'Discovery',
            expanded: true,
            provenance: {
                source: 'user',
                timestamp: '2025-01-01T00:00:00.000Z',
                modelId: null
            },
            items: [
                {
                    id: 'item-0-0',
                    name: 'Literature Review',
                    type: 'item',
                    description: 'Review existing research',
                    itemType: 'research',
                    cost: 1000,
                    expanded: true,
                    provenance: {
                        source: 'user',
                        timestamp: '2025-01-01T00:00:00.000Z',
                        modelId: null
                    },
                    phenomenology: [
                        {
                            id: 'ph-1',
                            content: 'Missing qualitative sources',
                            timestamp: '2025-01-02T00:00:00.000Z',
                            context: 'post-analysis'
                        }
                    ],
                    metrics: {
                        editCount: 3,
                        focusTime: 1800000,
                        lastModified: 1704153600000
                    },
                    subItems: [
                        {
                            id: 'sub-0-0-0',
                            name: 'Find academic papers',
                            type: 'subtask',
                            description: 'Search databases',
                            provenance: {
                                source: 'ai-claude',
                                timestamp: '2025-01-01T12:00:00.000Z',
                                modelId: 'claude-sonnet-4'
                            },
                            phenomenology: [],
                            metrics: {
                                editCount: 0,
                                focusTime: 0,
                                lastModified: 1704110400000
                            }
                        },
                        {
                            id: 'sub-0-0-1',
                            name: 'Summarize findings',
                            type: 'subtask',
                            description: 'Create summary document',
                            provenance: {
                                source: 'user',
                                timestamp: '2025-01-01T14:00:00.000Z',
                                modelId: null
                            },
                            phenomenology: [],
                            metrics: {
                                editCount: 1,
                                focusTime: 600000,
                                lastModified: 1704117600000
                            }
                        }
                    ]
                },
                {
                    id: 'item-0-1',
                    name: 'Competitive Analysis',
                    type: 'item',
                    description: 'Analyze competitors',
                    itemType: 'analysis',
                    cost: 500,
                    expanded: false,
                    provenance: {
                        source: 'ai-import',
                        timestamp: '2025-01-02T00:00:00.000Z',
                        modelId: null
                    },
                    phenomenology: [],
                    metrics: {
                        editCount: 0,
                        focusTime: 0,
                        lastModified: 1704153600000
                    },
                    subItems: []
                }
            ]
        },
        {
            id: 'phase-1',
            name: 'Development',
            type: 'phase',
            phase: 1,
            subtitle: 'Building',
            expanded: true,
            provenance: {
                source: 'user',
                timestamp: '2025-01-03T00:00:00.000Z',
                modelId: null
            },
            items: [
                {
                    id: 'item-1-0',
                    name: 'MVP Build',
                    type: 'item',
                    description: 'Build minimum viable product',
                    itemType: 'development',
                    cost: 5000,
                    expanded: false,
                    provenance: {
                        source: 'user',
                        timestamp: '2025-01-03T00:00:00.000Z',
                        modelId: null
                    },
                    phenomenology: [],
                    metrics: {
                        editCount: 2,
                        focusTime: 7200000,
                        lastModified: 1704326400000
                    },
                    subItems: []
                }
            ]
        },
        {
            id: 'phase-2',
            name: 'Launch',
            type: 'phase',
            phase: 2,
            subtitle: 'Go to market',
            expanded: false,
            provenance: {
                source: 'user',
                timestamp: '2025-01-05T00:00:00.000Z',
                modelId: null
            },
            items: []
        }
    ]
};

/**
 * AI-generated tree - all nodes from AI import
 */
export const aiGeneratedTree = {
    id: 'root',
    name: 'AI Generated Project',
    type: 'root',
    schemaVersion: 1,
    hyperedges: [],
    snapshotRefs: [],
    aiConfig: {},
    provenance: {
        source: 'ai-import',
        timestamp: '2025-01-01T00:00:00.000Z',
        modelId: 'gemini-2.5-pro'
    },
    children: [
        {
            id: 'phase-0',
            name: 'Planning',
            type: 'phase',
            phase: 0,
            provenance: {
                source: 'ai-import',
                timestamp: '2025-01-01T00:00:00.000Z',
                modelId: 'gemini-2.5-pro'
            },
            items: [
                {
                    id: 'item-0-0',
                    name: 'Define Requirements',
                    type: 'item',
                    provenance: {
                        source: 'ai-import',
                        timestamp: '2025-01-01T00:00:00.000Z',
                        modelId: 'gemini-2.5-pro'
                    },
                    phenomenology: [],
                    metrics: { editCount: 0, focusTime: 0, lastModified: Date.now() }
                }
            ]
        }
    ]
};

/**
 * Deep tree - 4 levels of nesting
 */
export const deepTree = {
    id: 'root',
    name: 'Deep Nested Project',
    type: 'root',
    schemaVersion: 1,
    hyperedges: [],
    snapshotRefs: [],
    aiConfig: {},
    children: [
        {
            id: 'phase-0',
            name: 'Phase 1',
            type: 'phase',
            phase: 0,
            items: [
                {
                    id: 'item-0-0',
                    name: 'Item 1',
                    type: 'item',
                    provenance: { source: 'user', timestamp: '2025-01-01T00:00:00Z' },
                    subItems: [
                        {
                            id: 'sub-0-0-0',
                            name: 'Subtask 1',
                            type: 'subtask',
                            provenance: { source: 'user', timestamp: '2025-01-01T00:00:00Z' },
                            subItems: [
                                {
                                    id: 'sub-0-0-0-0',
                                    name: 'Nested Subtask 1',
                                    type: 'subtask',
                                    provenance: { source: 'user', timestamp: '2025-01-01T00:00:00Z' }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// ============================================================================
// NODE FIXTURES
// ============================================================================

/**
 * Create a fresh user-created node
 */
export function createUserNode(type = 'item', overrides = {}) {
    return {
        id: `${type}-${Date.now()}`,
        name: `New ${type}`,
        type: type,
        description: '',
        provenance: {
            source: 'user',
            timestamp: new Date().toISOString(),
            modelId: null
        },
        phenomenology: [],
        metrics: {
            editCount: 0,
            focusTime: 0,
            lastModified: Date.now()
        },
        ...overrides
    };
}

/**
 * Create a fresh AI-generated node
 */
export function createAINode(type = 'item', modelId = 'claude-sonnet-4', overrides = {}) {
    return {
        id: `${type}-${Date.now()}`,
        name: `AI ${type}`,
        type: type,
        description: 'Generated by AI',
        provenance: {
            source: `ai-${modelId.split('-')[0]}`,
            timestamp: new Date().toISOString(),
            modelId: modelId
        },
        phenomenology: [],
        metrics: {
            editCount: 0,
            focusTime: 0,
            lastModified: Date.now()
        },
        ...overrides
    };
}

// ============================================================================
// AI CONFIG FIXTURES
// ============================================================================

export const defaultAIConfig = {
    tone: 'neutral',
    verbosity: 'concise',
    creativity: 0.5,
    dialecticMode: false,
    customInstructions: ''
};

export const dialecticAIConfig = {
    tone: 'neutral',
    verbosity: 'balanced',
    creativity: 0.5,
    dialecticMode: true,
    customInstructions: ''
};

export const criticalAIConfig = {
    tone: 'critical',
    verbosity: 'concise',
    creativity: 0.3,
    dialecticMode: true,
    customInstructions: 'Challenge all assumptions'
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Deep clone a fixture to avoid test pollution
 */
export function cloneTree(tree) {
    return JSON.parse(JSON.stringify(tree));
}

/**
 * Count total nodes in a tree
 */
export function countNodes(node) {
    let count = 1;
    
    const children = node.children || [];
    const items = node.items || [];
    const subItems = node.subItems || [];
    
    for (const child of [...children, ...items, ...subItems]) {
        count += countNodes(child);
    }
    
    return count;
}

/**
 * Find all nodes with a specific provenance source
 */
export function findNodesBySource(tree, source) {
    const results = [];
    
    function walk(node) {
        if (node.provenance?.source === source) {
            results.push(node);
        }
        
        const children = node.children || [];
        const items = node.items || [];
        const subItems = node.subItems || [];
        
        for (const child of [...children, ...items, ...subItems]) {
            walk(child);
        }
    }
    
    walk(tree);
    return results;
}
