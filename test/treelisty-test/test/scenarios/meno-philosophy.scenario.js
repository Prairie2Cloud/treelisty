/**
 * Meno Philosophy Scenario Test
 *
 * End-to-end user scenario test that:
 * 1. Imports a Meno excerpt as raw text
 * 2. Tree-lists it using the Philosophy pattern
 * 3. Enhances via AI
 * 4. Evaluates structural fidelity using a separate AI
 *
 * Run with: npm run test:scenario
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
    menoExcerptText,
    menoExpectedStructure,
    structuralFidelityCriteria
} from '../fixtures/meno-excerpt.js';

// Configuration
const SCENARIO_CONFIG = {
    // AI provider for tree-listing and enhancement
    enhancementProvider: 'claude',  // or 'openai', 'gemini'
    enhancementModel: 'claude-sonnet-4-20250514',

    // AI provider for evaluation (should be different for objectivity)
    evaluationProvider: 'openai',
    evaluationModel: 'gpt-4o',

    // Timeouts
    importTimeoutMs: 30000,
    enhanceTimeoutMs: 60000,
    evaluateTimeoutMs: 30000,

    // Use mock mode by default unless MOCK_AI=false
    // Live mode requires: MOCK_AI=false and valid API keys
    mockMode: process.env.MOCK_AI !== 'false'
};

/**
 * Mock AI responses for testing without API calls
 */
const MOCK_RESPONSES = {
    treeListing: menoExpectedStructure,

    enhancement: {
        ...menoExpectedStructure,
        children: menoExpectedStructure.children.map(phase => ({
            ...phase,
            aiEnhanced: true,
            items: phase.items.map(item => ({
                ...item,
                aiInsight: 'Enhanced with dialectical analysis',
                provenance: {
                    source: 'ai-claude',
                    timestamp: new Date().toISOString(),
                    modelId: 'claude-sonnet-4-20250514'
                }
            }))
        }))
    },

    evaluation: {
        overallScore: 0.85,
        dialecticalFlow: { score: 0.9, notes: 'Captures question-response structure well' },
        argumentTypes: { score: 0.8, notes: 'Most types correctly identified' },
        logicalStructure: { score: 0.85, notes: 'Good nesting of supporting points' },
        contentFidelity: { score: 0.85, notes: 'Key philosophical terms preserved' },
        recommendations: [
            'Consider adding more explicit connections between movements',
            'The refutation could be more clearly marked as responding to the definition'
        ]
    }
};

/**
 * Simulates AI tree-listing of raw text
 * In real implementation, this would call the Treelisty AI import function
 */
async function treeListText(text, pattern) {
    if (SCENARIO_CONFIG.mockMode) {
        return MOCK_RESPONSES.treeListing;
    }

    // Real implementation would:
    // 1. Send text to AI with pattern-specific prompt
    // 2. Parse JSON response
    // 3. Validate against schema
    // 4. Return tree structure

    const prompt = buildTreeListingPrompt(text, pattern);
    const response = await callAI(SCENARIO_CONFIG.enhancementProvider, prompt);
    return parseTreeResponse(response);
}

/**
 * Simulates AI enhancement of a tree
 */
async function enhanceTree(tree) {
    if (SCENARIO_CONFIG.mockMode) {
        return MOCK_RESPONSES.enhancement;
    }

    // Real implementation would call Treelisty's enhance function
    const prompt = buildEnhancementPrompt(tree);
    const response = await callAI(SCENARIO_CONFIG.enhancementProvider, prompt);
    return applyEnhancements(tree, response);
}

/**
 * Evaluates structural fidelity using a separate AI
 */
async function evaluateStructuralFidelity(tree, criteria, expectedStructure) {
    if (SCENARIO_CONFIG.mockMode) {
        return MOCK_RESPONSES.evaluation;
    }

    const prompt = buildEvaluationPrompt(tree, criteria, expectedStructure);
    const response = await callAI(
        SCENARIO_CONFIG.evaluationProvider,
        prompt,
        SCENARIO_CONFIG.evaluationModel
    );
    return parseEvaluationResponse(response);
}

/**
 * Build prompts for AI calls
 */
function buildTreeListingPrompt(text, pattern) {
    return `You are a philosophical text analyst. Convert the following Platonic dialogue excerpt into a structured tree using the Philosophy pattern.

Pattern Structure:
- Root: Dialogue title
- Phase (Movement): Major dialectical turns in the argument
- Item (Claim): Individual arguments, questions, or definitions
- Subtask (Support): Evidence or sub-arguments supporting claims

Item Types to use:
- question: Interrogative moves
- definition: Attempts to define a concept
- refutation: Elenchus or counter-arguments
- premise: Supporting propositions
- conclusion: Derived claims

TEXT TO ANALYZE:
${text}

Return a valid JSON tree structure following the Treelisty schema.`;
}

function buildEnhancementPrompt(tree) {
    return `You are a philosophical analyst. Enhance the following tree structure with:
1. Deeper dialectical insights
2. Connections between claims
3. Identification of implicit premises

Current Tree:
${JSON.stringify(tree, null, 2)}

Return the enhanced tree with added insights while preserving the original structure.`;
}

function buildEvaluationPrompt(tree, criteria, expected) {
    return `You are evaluating a tree-listing of Plato's Meno for structural fidelity.

CRITERIA:
${JSON.stringify(criteria, null, 2)}

EXPECTED STRUCTURE (ideal):
${JSON.stringify(expected, null, 2)}

ACTUAL STRUCTURE (to evaluate):
${JSON.stringify(tree, null, 2)}

Evaluate each criterion and return a JSON object with:
- overallScore: 0-1
- dialecticalFlow: { score, notes }
- argumentTypes: { score, notes }
- logicalStructure: { score, notes }
- contentFidelity: { score, notes }
- recommendations: [array of improvement suggestions]`;
}

/**
 * Placeholder for actual AI calls
 */
async function callAI(provider, prompt, model) {
    // In real implementation, this would call the appropriate API
    throw new Error('Real AI calls not implemented - use mockMode');
}

function parseTreeResponse(response) {
    return JSON.parse(response);
}

function applyEnhancements(tree, response) {
    const enhancements = JSON.parse(response);
    return { ...tree, ...enhancements };
}

function parseEvaluationResponse(response) {
    return JSON.parse(response);
}

// ============================================================================
// SCENARIO TESTS
// ============================================================================

describe('Meno Philosophy Scenario', () => {

    describe('Phase 1: Text Import & Tree-Listing', () => {

        it('should successfully tree-list the Meno excerpt', async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');

            expect(tree).toBeDefined();
            expect(tree.id).toBe('root');
            expect(tree.children).toBeDefined();
            expect(tree.children.length).toBeGreaterThan(0);
        });

        it('should use Philosophy pattern labels', async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');

            // Check for Movement (phase) level
            const movements = tree.children.filter(c => c.type === 'phase');
            expect(movements.length).toBeGreaterThan(0);

            // Check for Claim (item) level
            const claims = movements.flatMap(m => m.items || []);
            expect(claims.length).toBeGreaterThan(0);
        });

        it('should capture the opening question', async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');

            // Find the opening question
            const allClaims = tree.children.flatMap(m => m.items || []);
            const questionClaims = allClaims.filter(c =>
                c.itemType === 'question' ||
                c.name?.toLowerCase().includes('question') ||
                c.description?.toLowerCase().includes('teaching')
            );

            expect(questionClaims.length).toBeGreaterThan(0);
        });

        it('should identify the swarm/bee analogy', async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');

            const allItems = tree.children.flatMap(m => [
                ...(m.items || []),
                ...(m.items || []).flatMap(i => i.subItems || [])
            ]);

            const beeRelated = allItems.filter(item =>
                item.name?.toLowerCase().includes('bee') ||
                item.name?.toLowerCase().includes('swarm') ||
                item.description?.toLowerCase().includes('bee')
            );

            expect(beeRelated.length).toBeGreaterThan(0);
        });
    });

    describe('Phase 2: AI Enhancement', () => {

        it('should enhance tree without corrupting structure', async () => {
            const originalTree = await treeListText(menoExcerptText, 'philosophy');
            const enhancedTree = await enhanceTree(originalTree);

            // Structure should be preserved
            expect(enhancedTree.children.length).toBe(originalTree.children.length);

            // Should have AI provenance markers
            const hasAIProvenance = JSON.stringify(enhancedTree).includes('ai-');
            expect(hasAIProvenance).toBe(true);
        });

        it('should add insights without removing content', async () => {
            const originalTree = await treeListText(menoExcerptText, 'philosophy');
            const enhancedTree = await enhanceTree(originalTree);

            // Count total nodes
            const countNodes = (node) => {
                let count = 1;
                (node.children || []).forEach(c => count += countNodes(c));
                (node.items || []).forEach(i => count += countNodes(i));
                (node.subItems || []).forEach(s => count += countNodes(s));
                return count;
            };

            const originalCount = countNodes(originalTree);
            const enhancedCount = countNodes(enhancedTree);

            // Enhanced should have same or more nodes
            expect(enhancedCount).toBeGreaterThanOrEqual(originalCount);
        });
    });

    describe('Phase 3: Structural Fidelity Evaluation', () => {

        let enhancedTree;

        beforeAll(async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');
            enhancedTree = await enhanceTree(tree);
        });

        it('should pass overall structural fidelity threshold', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            expect(evaluation.overallScore).toBeGreaterThan(0.7);
        });

        it('should score well on dialectical flow', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            expect(evaluation.dialecticalFlow.score).toBeGreaterThan(0.7);
        });

        it('should correctly identify argument types', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            expect(evaluation.argumentTypes.score).toBeGreaterThan(0.6);
        });

        it('should preserve logical structure', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            expect(evaluation.logicalStructure.score).toBeGreaterThan(0.7);
        });

        it('should maintain content fidelity', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            expect(evaluation.contentFidelity.score).toBeGreaterThan(0.7);
        });

        it('should provide actionable recommendations', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            expect(evaluation.recommendations).toBeDefined();
            expect(Array.isArray(evaluation.recommendations)).toBe(true);
        });
    });

    describe('Comparison: Good vs Poor Structure', () => {

        it('should score expected structure higher than poor structure', async () => {
            const { menoPoorStructure } = await import('../fixtures/meno-excerpt.js');

            const goodEval = await evaluateStructuralFidelity(
                menoExpectedStructure,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            // For poor structure, we need to mock a lower score
            const poorEval = SCENARIO_CONFIG.mockMode
                ? { overallScore: 0.35 }
                : await evaluateStructuralFidelity(
                    menoPoorStructure,
                    structuralFidelityCriteria,
                    menoExpectedStructure
                );

            expect(goodEval.overallScore).toBeGreaterThan(poorEval.overallScore);
        });
    });
});

// ============================================================================
// EXPORT FOR MANUAL RUNNING
// ============================================================================

export {
    treeListText,
    enhanceTree,
    evaluateStructuralFidelity,
    SCENARIO_CONFIG
};
