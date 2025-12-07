/**
 * Meno Philosophy Scenario Test
 *
 * End-to-end user scenario test that:
 * 1. Imports a Meno excerpt as raw text
 * 2. Tree-lists it using the Philosophy pattern
 * 3. Enhances via AI
 * 4. Evaluates structural fidelity using a separate AI
 *
 * Run with: npm run test:scenario (mock mode)
 *           npm run test:scenario:live (real AI calls)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { config } from 'dotenv';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '..', '.env') });

import {
    menoExcerptText,
    menoExpectedStructure,
    structuralFidelityCriteria
} from '../fixtures/meno-excerpt.js';

// Configuration
const SCENARIO_CONFIG = {
    // AI provider for tree-listing and enhancement
    enhancementProvider: 'claude',
    enhancementModel: 'claude-sonnet-4-20250514',

    // AI provider for evaluation (different for objectivity)
    evaluationProvider: 'openai',
    evaluationModel: 'gpt-4o',

    // Timeouts (increased for two-pass enhancement)
    importTimeoutMs: 60000,
    enhanceTimeoutMs: 180000,  // 3 min for multi-phase enhancement
    evaluateTimeoutMs: 60000,

    // Use mock mode by default unless MOCK_AI=false
    mockMode: process.env.MOCK_AI !== 'false',

    // Save outputs for analysis
    saveOutputs: true,
    outputDir: join(__dirname, '..', '..', 'test-results', 'scenario-outputs')
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
 * Save output to file for analysis
 */
function saveOutput(filename, data) {
    if (!SCENARIO_CONFIG.saveOutputs) return;

    if (!existsSync(SCENARIO_CONFIG.outputDir)) {
        mkdirSync(SCENARIO_CONFIG.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = join(SCENARIO_CONFIG.outputDir, `${timestamp}-${filename}`);
    writeFileSync(filepath, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log(`  📁 Saved: ${filepath}`);
}

/**
 * Call Claude API
 */
async function callClaude(prompt, model = SCENARIO_CONFIG.enhancementModel) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

    console.log(`  🤖 Calling Claude (${model})...`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 8192,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, model = SCENARIO_CONFIG.evaluationModel) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');

    console.log(`  🤖 Calling OpenAI (${model})...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Call appropriate AI provider
 */
async function callAI(provider, prompt, model) {
    if (provider === 'claude') {
        return callClaude(prompt, model || SCENARIO_CONFIG.enhancementModel);
    } else if (provider === 'openai') {
        return callOpenAI(prompt, model || SCENARIO_CONFIG.evaluationModel);
    } else {
        throw new Error(`Unknown provider: ${provider}`);
    }
}

/**
 * Build tree-listing prompt (matches Treelisty's actual prompt style)
 */
function buildTreeListingPrompt(text, pattern) {
    return `You are analyzing a philosophical dialogue. Convert it into a structured JSON tree using the Philosophy pattern.

## Output Schema
Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "id": "root",
  "name": "<Dialogue title>",
  "type": "root",
  "schemaVersion": 1,
  "pattern": "philosophy",
  "hyperedges": [],
  "snapshotRefs": [],
  "aiConfig": {},
  "children": [
    {
      "id": "movement-0",
      "name": "<Movement name>",
      "type": "phase",
      "phase": 0,
      "subtitle": "<Brief description>",
      "items": [
        {
          "id": "claim-0-0",
          "name": "<Claim name>",
          "type": "item",
          "itemType": "<question|definition|refutation|premise|conclusion>",
          "description": "<Full description>",
          "subItems": [
            {
              "id": "support-0-0-0",
              "name": "<Support point>",
              "type": "subtask",
              "description": "<Details>"
            }
          ]
        }
      ]
    }
  ]
}

## Item Types
- question: Interrogative moves that drive the dialogue
- definition: Attempts to define a concept
- refutation: Counter-arguments or elenchus
- premise: Supporting propositions
- conclusion: Derived claims

## Philosophy Pattern Labels
- Root = Dialogue
- Phase = Movement (major dialectical turns)
- Item = Claim (arguments, questions, definitions)
- Subtask = Support (evidence, sub-arguments)

## TEXT TO ANALYZE:
${text}

Remember: Return ONLY the JSON object, no other text.`;
}

/**
 * Build Pass 1 prompt: Enhance individual items with insights
 * Processes one phase at a time to avoid timeouts
 */
function buildPass1Prompt(phase, phaseIndex) {
    return `You are a philosophical analyst. Add insights to each claim in this movement.

For each item (claim), add an "aiInsight" field with:
- The dialectical significance (why this move matters in the argument)
- Any implicit premises not explicitly stated

Keep the structure EXACTLY as provided. Only ADD the "aiInsight" field to items.

Movement to enhance:
${JSON.stringify(phase, null, 2)}

Return ONLY valid JSON (the enhanced movement), no other text.`;
}

/**
 * Build Pass 2 prompt: Add cross-references between claims
 * Lightweight pass that only adds phenomenology connections
 */
function buildPass2Prompt(tree) {
    // Extract just the claim names and IDs for context
    const claimSummary = [];
    tree.children.forEach((phase, pi) => {
        (phase.items || []).forEach((item, ii) => {
            claimSummary.push({
                id: item.id,
                name: item.name,
                type: item.itemType,
                phase: phase.name
            });
        });
    });

    return `You are identifying connections between philosophical claims.

Given these claims from a dialogue analysis:
${JSON.stringify(claimSummary, null, 2)}

Identify 3-5 important cross-references where one claim relates to another.
Return a JSON array of connections:
[
  {
    "fromId": "<claim id>",
    "toId": "<claim id>",
    "relationship": "<responds-to|supports|contradicts|refines>",
    "note": "<brief explanation>"
  }
]

Focus on dialectical relationships (questions answered, definitions refuted, etc.)
Return ONLY the JSON array.`;
}

/**
 * Legacy single-pass prompt (kept for reference)
 */
function buildEnhancementPrompt(tree) {
    return `You are a philosophical analyst. Enhance the following tree structure with deeper insights.

For each claim, consider adding:
1. Implicit premises that aren't stated
2. Dialectical significance (why this move matters)
3. Connections to other claims (use phenomenology array)

IMPORTANT: Return the complete tree with enhancements. Preserve ALL original structure.
Add insights as "aiInsight" field on items. Add "phenomenology" entries for cross-references.

Current Tree:
${JSON.stringify(tree, null, 2)}

Return ONLY valid JSON (the enhanced tree), no other text.`;
}

/**
 * Build evaluation prompt
 */
function buildEvaluationPrompt(tree, criteria, expected) {
    return `You are evaluating a tree-listing of Plato's Meno for structural fidelity.

## Evaluation Criteria

### 1. Dialectical Flow (weight: 30%)
Does the tree capture the back-and-forth between Socrates and Meno?
- Question → Response → Counter patterns
- Progressive deepening of inquiry

### 2. Argument Types (weight: 25%)
Are claims correctly typed?
- question, definition, refutation, premise, conclusion

### 3. Logical Structure (weight: 25%)
Are supporting points correctly nested under parent claims?

### 4. Content Fidelity (weight: 20%)
Is the philosophical content accurately represented?
- Key terms: virtue, teaching, nature, form/eidos, swarm/bees

## ACTUAL STRUCTURE (to evaluate):
${JSON.stringify(tree, null, 2)}

## REFERENCE STRUCTURE (ideal):
${JSON.stringify(expected, null, 2)}

## Your Response
Return a JSON object with:
{
    "overallScore": <0-1 weighted composite>,
    "dialecticalFlow": {
        "score": <0-1>,
        "notes": "<specific observations>"
    },
    "argumentTypes": {
        "score": <0-1>,
        "notes": "<specific observations>"
    },
    "logicalStructure": {
        "score": <0-1>,
        "notes": "<specific observations>"
    },
    "contentFidelity": {
        "score": <0-1>,
        "notes": "<specific observations>"
    },
    "recommendations": [
        "<actionable improvement 1>",
        "<actionable improvement 2>"
    ]
}

Return ONLY the JSON object.`;
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
function parseJSONResponse(response) {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim());
}

/**
 * Tree-list raw text using AI
 */
async function treeListText(text, pattern) {
    if (SCENARIO_CONFIG.mockMode) {
        return MOCK_RESPONSES.treeListing;
    }

    const prompt = buildTreeListingPrompt(text, pattern);
    saveOutput('1-treelist-prompt.txt', prompt);

    const response = await callAI(SCENARIO_CONFIG.enhancementProvider, prompt);
    saveOutput('2-treelist-response.txt', response);

    const tree = parseJSONResponse(response);
    saveOutput('3-treelist-parsed.json', tree);

    return tree;
}

/**
 * Enhance tree using AI - Two-Pass Approach
 *
 * Pass 1: Enhance each phase individually (adds aiInsight to items)
 * Pass 2: Add cross-references between claims (lightweight)
 *
 * This avoids timeouts by processing smaller chunks serially.
 */
async function enhanceTree(tree) {
    if (SCENARIO_CONFIG.mockMode) {
        return MOCK_RESPONSES.enhancement;
    }

    console.log(`  📦 Two-pass enhancement starting...`);

    // Deep clone the tree to avoid mutations
    const enhancedTree = JSON.parse(JSON.stringify(tree));

    // ========================================
    // PASS 1: Enhance each phase individually
    // ========================================
    console.log(`  🔄 Pass 1: Enhancing ${enhancedTree.children.length} phases...`);

    for (let i = 0; i < enhancedTree.children.length; i++) {
        const phase = enhancedTree.children[i];
        console.log(`     Phase ${i + 1}/${enhancedTree.children.length}: ${phase.name}`);

        const prompt = buildPass1Prompt(phase, i);
        saveOutput(`4-pass1-phase${i}-prompt.txt`, prompt);

        try {
            const response = await callAI(SCENARIO_CONFIG.enhancementProvider, prompt);
            saveOutput(`4-pass1-phase${i}-response.txt`, response);

            const enhancedPhase = parseJSONResponse(response);
            enhancedTree.children[i] = enhancedPhase;
        } catch (error) {
            console.log(`     ⚠️ Phase ${i} enhancement failed: ${error.message}`);
            // Keep original phase if enhancement fails
        }
    }

    saveOutput('5-pass1-complete.json', enhancedTree);

    // ========================================
    // PASS 2: Add cross-references
    // ========================================
    console.log(`  🔗 Pass 2: Adding cross-references...`);

    const pass2Prompt = buildPass2Prompt(enhancedTree);
    saveOutput('6-pass2-prompt.txt', pass2Prompt);

    try {
        const pass2Response = await callAI(SCENARIO_CONFIG.enhancementProvider, pass2Prompt);
        saveOutput('6-pass2-response.txt', pass2Response);

        const connections = parseJSONResponse(pass2Response);

        // Apply connections to the tree as hyperedges
        if (Array.isArray(connections)) {
            enhancedTree.hyperedges = enhancedTree.hyperedges || [];
            connections.forEach((conn, idx) => {
                enhancedTree.hyperedges.push({
                    id: `he-ai-${idx}`,
                    nodes: [conn.fromId, conn.toId],
                    label: conn.note,
                    type: conn.relationship,
                    provenance: {
                        source: 'ai-claude',
                        timestamp: new Date().toISOString(),
                        modelId: SCENARIO_CONFIG.enhancementModel
                    }
                });
            });
        }
    } catch (error) {
        console.log(`     ⚠️ Pass 2 failed: ${error.message}`);
        // Continue without cross-references
    }

    // Mark as AI-enhanced
    enhancedTree.aiEnhanced = true;
    enhancedTree.enhancementTimestamp = new Date().toISOString();

    saveOutput('7-enhance-final.json', enhancedTree);
    console.log(`  ✅ Enhancement complete`);

    return enhancedTree;
}

/**
 * Evaluate structural fidelity using a separate AI
 */
async function evaluateStructuralFidelity(tree, criteria, expectedStructure) {
    if (SCENARIO_CONFIG.mockMode) {
        return MOCK_RESPONSES.evaluation;
    }

    const prompt = buildEvaluationPrompt(tree, criteria, expectedStructure);
    saveOutput('7-evaluate-prompt.txt', prompt);

    const response = await callAI(
        SCENARIO_CONFIG.evaluationProvider,
        prompt,
        SCENARIO_CONFIG.evaluationModel
    );
    saveOutput('8-evaluate-response.txt', response);

    const evaluation = parseJSONResponse(response);
    saveOutput('9-evaluation-result.json', evaluation);

    return evaluation;
}

// ============================================================================
// SCENARIO TESTS
// ============================================================================

describe('Meno Philosophy Scenario', () => {

    beforeAll(() => {
        console.log(`\n🔬 Running in ${SCENARIO_CONFIG.mockMode ? 'MOCK' : 'LIVE'} mode`);
        if (!SCENARIO_CONFIG.mockMode) {
            console.log(`   Enhancement: ${SCENARIO_CONFIG.enhancementProvider} (${SCENARIO_CONFIG.enhancementModel})`);
            console.log(`   Evaluation: ${SCENARIO_CONFIG.evaluationProvider} (${SCENARIO_CONFIG.evaluationModel})`);
            console.log(`   Outputs: ${SCENARIO_CONFIG.outputDir}\n`);
        }
    });

    describe('Phase 1: Text Import & Tree-Listing', () => {

        it('should successfully tree-list the Meno excerpt', async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');

            expect(tree).toBeDefined();
            expect(tree.id).toBe('root');
            expect(tree.children).toBeDefined();
            expect(tree.children.length).toBeGreaterThan(0);
        }, SCENARIO_CONFIG.importTimeoutMs);

        it('should use Philosophy pattern labels', async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');

            const movements = tree.children.filter(c => c.type === 'phase');
            expect(movements.length).toBeGreaterThan(0);

            const claims = movements.flatMap(m => m.items || []);
            expect(claims.length).toBeGreaterThan(0);
        }, SCENARIO_CONFIG.importTimeoutMs);

        it('should capture the opening question', async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');

            const allClaims = tree.children.flatMap(m => m.items || []);
            const questionClaims = allClaims.filter(c =>
                c.itemType === 'question' ||
                c.name?.toLowerCase().includes('question') ||
                c.description?.toLowerCase().includes('teaching')
            );

            expect(questionClaims.length).toBeGreaterThan(0);
        }, SCENARIO_CONFIG.importTimeoutMs);

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
        }, SCENARIO_CONFIG.importTimeoutMs);
    });

    describe('Phase 2: AI Enhancement', () => {

        it('should enhance tree without corrupting structure', async () => {
            const originalTree = await treeListText(menoExcerptText, 'philosophy');
            const enhancedTree = await enhanceTree(originalTree);

            expect(enhancedTree.children.length).toBeGreaterThanOrEqual(originalTree.children.length);

            const hasAIContent = JSON.stringify(enhancedTree).includes('aiInsight') ||
                                JSON.stringify(enhancedTree).includes('ai-') ||
                                JSON.stringify(enhancedTree).includes('enhanced');
            expect(hasAIContent).toBe(true);
        }, SCENARIO_CONFIG.enhanceTimeoutMs);

        it('should add insights without removing content', async () => {
            const originalTree = await treeListText(menoExcerptText, 'philosophy');
            const enhancedTree = await enhanceTree(originalTree);

            const countNodes = (node) => {
                let count = 1;
                (node.children || []).forEach(c => count += countNodes(c));
                (node.items || []).forEach(i => count += countNodes(i));
                (node.subItems || []).forEach(s => count += countNodes(s));
                return count;
            };

            const originalCount = countNodes(originalTree);
            const enhancedCount = countNodes(enhancedTree);

            expect(enhancedCount).toBeGreaterThanOrEqual(originalCount);
        }, SCENARIO_CONFIG.enhanceTimeoutMs);
    });

    describe('Phase 3: Structural Fidelity Evaluation', () => {

        let enhancedTree;

        beforeAll(async () => {
            const tree = await treeListText(menoExcerptText, 'philosophy');
            enhancedTree = await enhanceTree(tree);
        }, SCENARIO_CONFIG.importTimeoutMs + SCENARIO_CONFIG.enhanceTimeoutMs);

        it('should pass overall structural fidelity threshold', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            console.log(`\n📊 Overall Score: ${(evaluation.overallScore * 100).toFixed(1)}%`);
            expect(evaluation.overallScore).toBeGreaterThan(0.6);
        }, SCENARIO_CONFIG.evaluateTimeoutMs);

        it('should score well on dialectical flow', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            console.log(`   Dialectical Flow: ${(evaluation.dialecticalFlow.score * 100).toFixed(1)}%`);
            console.log(`   Notes: ${evaluation.dialecticalFlow.notes}`);
            expect(evaluation.dialecticalFlow.score).toBeGreaterThan(0.5);
        }, SCENARIO_CONFIG.evaluateTimeoutMs);

        it('should correctly identify argument types', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            console.log(`   Argument Types: ${(evaluation.argumentTypes.score * 100).toFixed(1)}%`);
            console.log(`   Notes: ${evaluation.argumentTypes.notes}`);
            expect(evaluation.argumentTypes.score).toBeGreaterThan(0.5);
        }, SCENARIO_CONFIG.evaluateTimeoutMs);

        it('should preserve logical structure', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            console.log(`   Logical Structure: ${(evaluation.logicalStructure.score * 100).toFixed(1)}%`);
            console.log(`   Notes: ${evaluation.logicalStructure.notes}`);
            expect(evaluation.logicalStructure.score).toBeGreaterThan(0.5);
        }, SCENARIO_CONFIG.evaluateTimeoutMs);

        it('should maintain content fidelity', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            console.log(`   Content Fidelity: ${(evaluation.contentFidelity.score * 100).toFixed(1)}%`);
            console.log(`   Notes: ${evaluation.contentFidelity.notes}`);
            expect(evaluation.contentFidelity.score).toBeGreaterThan(0.5);
        }, SCENARIO_CONFIG.evaluateTimeoutMs);

        it('should provide actionable recommendations', async () => {
            const evaluation = await evaluateStructuralFidelity(
                enhancedTree,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            console.log(`\n💡 Recommendations:`);
            evaluation.recommendations?.forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });

            expect(evaluation.recommendations).toBeDefined();
            expect(Array.isArray(evaluation.recommendations)).toBe(true);
        }, SCENARIO_CONFIG.evaluateTimeoutMs);
    });

    describe('Comparison: Good vs Poor Structure', () => {

        it('should score expected structure higher than poor structure', async () => {
            const { menoPoorStructure } = await import('../fixtures/meno-excerpt.js');

            const goodEval = await evaluateStructuralFidelity(
                menoExpectedStructure,
                structuralFidelityCriteria,
                menoExpectedStructure
            );

            const poorEval = SCENARIO_CONFIG.mockMode
                ? { overallScore: 0.35 }
                : await evaluateStructuralFidelity(
                    menoPoorStructure,
                    structuralFidelityCriteria,
                    menoExpectedStructure
                );

            console.log(`\n📈 Good structure: ${(goodEval.overallScore * 100).toFixed(1)}%`);
            console.log(`📉 Poor structure: ${(poorEval.overallScore * 100).toFixed(1)}%`);

            expect(goodEval.overallScore).toBeGreaterThan(poorEval.overallScore);
        }, SCENARIO_CONFIG.evaluateTimeoutMs * 2);
    });
});

// ============================================================================
// EXPORT FOR MANUAL RUNNING
// ============================================================================

export {
    treeListText,
    enhanceTree,
    evaluateStructuralFidelity,
    SCENARIO_CONFIG,
    buildTreeListingPrompt,
    buildEnhancementPrompt,
    buildEvaluationPrompt
};
