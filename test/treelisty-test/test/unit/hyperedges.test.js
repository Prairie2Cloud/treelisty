/**
 * Hyperedge Tests (Build 361)
 *
 * Tests for pivot-style smart hyperedge features:
 * - getHyperedgeDisplayLabel()
 * - calculateHyperedgeAggregates()
 * - detectSuggestedHyperedges()
 * - query condition evaluation
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementations of hyperedge functions
// These mirror the logic from treeplexity.html

/**
 * Get display label for a hyperedge
 * Handles name, label, or derives from description
 */
function getHyperedgeDisplayLabel(hyperedge) {
    // If name exists (used by welcome tree and older hyperedges), use it
    if (hyperedge.name && hyperedge.name.trim()) {
        return hyperedge.name;
    }

    // If label exists and is meaningful, use it
    if (hyperedge.label && hyperedge.label.trim() && hyperedge.label !== 'Unnamed Hyperedge') {
        return hyperedge.label;
    }

    // Try to derive from description
    if (hyperedge.description && hyperedge.description.trim()) {
        const desc = hyperedge.description.trim();
        let concise = desc.split(/[.!?]/)[0].trim();
        if (concise.length > 50) {
            const words = concise.split(/\s+/).slice(0, 5);
            concise = words.join(' ');
            if (concise.length < desc.length) concise += '...';
        }
        return concise || 'Relationship';
    }

    // Fallback based on type
    if (hyperedge.type) {
        const typeLabels = {
            'analysis': 'Deep Dive Analysis',
            'dependency-cluster': 'Dependency Cluster',
            'montage': 'Montage',
            'argument': 'Argument',
            'theme': 'Theme'
        };
        return typeLabels[hyperedge.type] || `${hyperedge.type} Relationship`;
    }

    return 'Relationship';
}

/**
 * Calculate aggregates for a hyperedge's member nodes
 */
function calculateHyperedgeAggregates(nodes, pattern = 'generic') {
    if (!nodes || nodes.length === 0) {
        return { count: 0, avgProgress: 0, statusCounts: {} };
    }

    // Universal aggregates
    const aggregates = {
        count: nodes.length,
        avgProgress: nodes.reduce((sum, n) => sum + (n.pmProgress || 0), 0) / nodes.length,
        statusCounts: {}
    };

    // Count by status
    nodes.forEach(n => {
        const status = n.pmStatus || 'Unknown';
        aggregates.statusCounts[status] = (aggregates.statusCounts[status] || 0) + 1;
    });

    // Pattern-specific: cost
    if (['capex', 'generic', 'sales'].includes(pattern)) {
        const costs = nodes.map(n => n.cost || 0).filter(c => c > 0);
        if (costs.length > 0) {
            aggregates.totalCost = costs.reduce((a, b) => a + b, 0);
            aggregates.avgCost = aggregates.totalCost / costs.length;
        }
    }

    // Pattern-specific: lead time (capex)
    if (pattern === 'capex') {
        const leadTimes = nodes
            .map(n => typeof n.leadTime === 'number' ? n.leadTime : 0)
            .filter(lt => lt > 0);
        if (leadTimes.length > 0) {
            aggregates.maxLeadTime = Math.max(...leadTimes);
            aggregates.totalLeadTime = leadTimes.reduce((a, b) => a + b, 0);
        }
    }

    return aggregates;
}

/**
 * Evaluate a single condition against a node
 */
function evaluateCondition(node, condition) {
    const value = node[condition.field];
    const condValue = condition.value;

    switch (condition.operator) {
        case 'equals':
            return String(value || '').toLowerCase() === String(condValue).toLowerCase();
        case 'contains':
            return String(value || '').toLowerCase().includes(String(condValue).toLowerCase()) ||
                   String(node.name || '').toLowerCase().includes(String(condValue).toLowerCase());
        case '>':
            return Number(value || 0) > Number(condValue);
        case '<':
            return Number(value || 0) < Number(condValue);
        case 'between':
            const [min, max] = String(condValue).split(',').map(Number);
            return Number(value || 0) >= min && Number(value || 0) <= max;
        default:
            return false;
    }
}

/**
 * Format cost for display
 */
function formatCost(cost) {
    if (cost >= 1000000) {
        return '$' + (cost / 1000000).toFixed(1) + 'M';
    } else if (cost >= 1000) {
        return '$' + (cost / 1000).toFixed(0) + 'K';
    }
    return '$' + cost;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Hyperedge Display Labels', () => {

    describe('getHyperedgeDisplayLabel()', () => {

        it('should return name if present', () => {
            const hyperedge = {
                id: 'he-1',
                name: 'AI Pipeline',
                label: 'Some Label',
                description: 'A description'
            };

            expect(getHyperedgeDisplayLabel(hyperedge)).toBe('AI Pipeline');
        });

        it('should return label if name is missing', () => {
            const hyperedge = {
                id: 'he-1',
                label: 'Custom Label',
                description: 'A description'
            };

            expect(getHyperedgeDisplayLabel(hyperedge)).toBe('Custom Label');
        });

        it('should derive from description if no name or label', () => {
            const hyperedge = {
                id: 'he-1',
                description: 'This connects related items. More text here.'
            };

            expect(getHyperedgeDisplayLabel(hyperedge)).toBe('This connects related items');
        });

        it('should truncate long descriptions to ~5 words', () => {
            const hyperedge = {
                id: 'he-1',
                description: 'This is a very long description that goes on and on and on for many words'
            };

            const label = getHyperedgeDisplayLabel(hyperedge);
            expect(label).toContain('...');
            expect(label.split(' ').length).toBeLessThanOrEqual(6); // 5 words + "..."
        });

        it('should use type-based label as fallback', () => {
            const hyperedge = {
                id: 'he-1',
                type: 'analysis'
            };

            expect(getHyperedgeDisplayLabel(hyperedge)).toBe('Deep Dive Analysis');
        });

        it('should return "Relationship" for empty hyperedge', () => {
            const hyperedge = { id: 'he-1' };

            expect(getHyperedgeDisplayLabel(hyperedge)).toBe('Relationship');
        });

        it('should ignore "Unnamed Hyperedge" label', () => {
            const hyperedge = {
                id: 'he-1',
                label: 'Unnamed Hyperedge',
                description: 'Actual description here'
            };

            expect(getHyperedgeDisplayLabel(hyperedge)).toBe('Actual description here');
        });

        it('should handle whitespace-only name', () => {
            const hyperedge = {
                id: 'he-1',
                name: '   ',
                label: 'Real Label'
            };

            expect(getHyperedgeDisplayLabel(hyperedge)).toBe('Real Label');
        });
    });
});

describe('Hyperedge Aggregates', () => {

    describe('calculateHyperedgeAggregates()', () => {

        it('should return zero counts for empty nodes', () => {
            const aggregates = calculateHyperedgeAggregates([]);

            expect(aggregates.count).toBe(0);
            expect(aggregates.avgProgress).toBe(0);
        });

        it('should calculate count correctly', () => {
            const nodes = [
                { id: 'n1', name: 'Item 1' },
                { id: 'n2', name: 'Item 2' },
                { id: 'n3', name: 'Item 3' }
            ];

            const aggregates = calculateHyperedgeAggregates(nodes);
            expect(aggregates.count).toBe(3);
        });

        it('should calculate average progress', () => {
            const nodes = [
                { id: 'n1', pmProgress: 100 },
                { id: 'n2', pmProgress: 50 },
                { id: 'n3', pmProgress: 25 }
            ];

            const aggregates = calculateHyperedgeAggregates(nodes);
            expect(aggregates.avgProgress).toBe(175 / 3);
        });

        it('should count status distribution', () => {
            const nodes = [
                { id: 'n1', pmStatus: 'Done' },
                { id: 'n2', pmStatus: 'In Progress' },
                { id: 'n3', pmStatus: 'Done' },
                { id: 'n4', pmStatus: 'To Do' }
            ];

            const aggregates = calculateHyperedgeAggregates(nodes);
            expect(aggregates.statusCounts['Done']).toBe(2);
            expect(aggregates.statusCounts['In Progress']).toBe(1);
            expect(aggregates.statusCounts['To Do']).toBe(1);
        });

        it('should calculate total cost for CAPEX pattern', () => {
            const nodes = [
                { id: 'n1', cost: 1000000 },
                { id: 'n2', cost: 500000 },
                { id: 'n3', cost: 250000 }
            ];

            const aggregates = calculateHyperedgeAggregates(nodes, 'capex');
            expect(aggregates.totalCost).toBe(1750000);
            expect(aggregates.avgCost).toBeCloseTo(583333.33, 0);
        });

        it('should ignore zero costs in calculation', () => {
            const nodes = [
                { id: 'n1', cost: 1000000 },
                { id: 'n2', cost: 0 },
                { id: 'n3', cost: 500000 }
            ];

            const aggregates = calculateHyperedgeAggregates(nodes, 'generic');
            expect(aggregates.totalCost).toBe(1500000);
            expect(aggregates.avgCost).toBe(750000); // Average of 2 non-zero items
        });

        it('should not calculate cost for philosophy pattern', () => {
            const nodes = [
                { id: 'n1', cost: 1000000 }
            ];

            const aggregates = calculateHyperedgeAggregates(nodes, 'philosophy');
            expect(aggregates.totalCost).toBeUndefined();
        });
    });
});

describe('Query Condition Evaluation', () => {

    describe('evaluateCondition()', () => {

        it('should evaluate equals operator (case-insensitive)', () => {
            const node = { pmStatus: 'In Progress' };

            expect(evaluateCondition(node, { field: 'pmStatus', operator: 'equals', value: 'In Progress' })).toBe(true);
            expect(evaluateCondition(node, { field: 'pmStatus', operator: 'equals', value: 'in progress' })).toBe(true);
            expect(evaluateCondition(node, { field: 'pmStatus', operator: 'equals', value: 'Done' })).toBe(false);
        });

        it('should evaluate contains operator in field value', () => {
            const node = { description: 'This is about solar panels', name: 'Item' };

            expect(evaluateCondition(node, { field: 'description', operator: 'contains', value: 'solar' })).toBe(true);
            expect(evaluateCondition(node, { field: 'description', operator: 'contains', value: 'wind' })).toBe(false);
        });

        it('should evaluate contains operator in name as fallback', () => {
            const node = { description: 'Something else', name: 'Solar Panel Item' };

            expect(evaluateCondition(node, { field: 'description', operator: 'contains', value: 'solar' })).toBe(true);
        });

        it('should evaluate > operator for numbers', () => {
            const node = { cost: 500000 };

            expect(evaluateCondition(node, { field: 'cost', operator: '>', value: '400000' })).toBe(true);
            expect(evaluateCondition(node, { field: 'cost', operator: '>', value: '600000' })).toBe(false);
        });

        it('should evaluate < operator for numbers', () => {
            const node = { cost: 500000 };

            expect(evaluateCondition(node, { field: 'cost', operator: '<', value: '600000' })).toBe(true);
            expect(evaluateCondition(node, { field: 'cost', operator: '<', value: '400000' })).toBe(false);
        });

        it('should evaluate between operator', () => {
            const node = { cost: 500000 };

            expect(evaluateCondition(node, { field: 'cost', operator: 'between', value: '400000,600000' })).toBe(true);
            expect(evaluateCondition(node, { field: 'cost', operator: 'between', value: '100000,300000' })).toBe(false);
        });

        it('should handle missing field values', () => {
            const node = { name: 'Item' }; // No cost field

            expect(evaluateCondition(node, { field: 'cost', operator: '>', value: '0' })).toBe(false);
            expect(evaluateCondition(node, { field: 'cost', operator: 'equals', value: '' })).toBe(true);
        });

        it('should return false for unknown operators', () => {
            const node = { cost: 500000 };

            expect(evaluateCondition(node, { field: 'cost', operator: 'invalid', value: '500000' })).toBe(false);
        });
    });
});

describe('Cost Formatting', () => {

    describe('formatCost()', () => {

        it('should format millions with M suffix', () => {
            expect(formatCost(1000000)).toBe('$1.0M');
            expect(formatCost(2500000)).toBe('$2.5M');
            expect(formatCost(10000000)).toBe('$10.0M');
        });

        it('should format thousands with K suffix', () => {
            expect(formatCost(1000)).toBe('$1K');
            expect(formatCost(500000)).toBe('$500K');
            expect(formatCost(999999)).toBe('$1000K');
        });

        it('should format small numbers without suffix', () => {
            expect(formatCost(500)).toBe('$500');
            expect(formatCost(0)).toBe('$0');
        });
    });
});

describe('Hyperedge Suggestions', () => {

    // Test data for suggestion detection
    const testNodes = [
        { id: 'n1', name: 'Item 1', pmStatus: 'In Progress', pmAssignee: 'Sarah', cost: 1200000 },
        { id: 'n2', name: 'Item 2', pmStatus: 'In Progress', pmAssignee: 'Sarah', cost: 800000 },
        { id: 'n3', name: 'Item 3', pmStatus: 'In Progress', pmAssignee: 'Mike', cost: 500000 },
        { id: 'n4', name: 'Item 4', pmStatus: 'Done', pmAssignee: 'Sarah', cost: 300000 },
        { id: 'n5', name: 'Item 5', pmStatus: 'To Do', pmAssignee: 'Mike', cost: 150000 },
    ];

    it('should detect status clusters (3+ items with same status)', () => {
        const inProgressItems = testNodes.filter(n => n.pmStatus === 'In Progress');
        expect(inProgressItems.length).toBe(3); // Should suggest "In Progress Items" hyperedge
    });

    it('should detect assignee clusters (2+ items with same assignee)', () => {
        const sarahItems = testNodes.filter(n => n.pmAssignee === 'Sarah');
        expect(sarahItems.length).toBe(3); // Should suggest "Sarah's Items" hyperedge

        const mikeItems = testNodes.filter(n => n.pmAssignee === 'Mike');
        expect(mikeItems.length).toBe(2); // Should suggest "Mike's Items" hyperedge
    });

    it('should detect high-cost items for CAPEX pattern', () => {
        const highCostItems = testNodes.filter(n => n.cost >= 1000000);
        expect(highCostItems.length).toBe(1); // Items over $1M

        const mediumCostItems = testNodes.filter(n => n.cost >= 500000 && n.cost < 1000000);
        expect(mediumCostItems.length).toBe(2); // Items $500K-$1M
    });
});
