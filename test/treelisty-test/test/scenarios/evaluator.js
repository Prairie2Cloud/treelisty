/**
 * AI Structural Fidelity Evaluator
 *
 * Uses a separate AI (different from the one that created the tree)
 * to objectively evaluate structural fidelity of tree-listed content.
 *
 * This module can be used standalone or integrated into scenario tests.
 */

/**
 * Evaluation result structure
 * @typedef {Object} EvaluationResult
 * @property {number} overallScore - 0-1 composite score
 * @property {Object} dialecticalFlow - Evaluation of argument flow
 * @property {Object} argumentTypes - Evaluation of type accuracy
 * @property {Object} logicalStructure - Evaluation of nesting/dependencies
 * @property {Object} contentFidelity - Evaluation of content preservation
 * @property {string[]} recommendations - Improvement suggestions
 */

/**
 * Configuration for the evaluator
 */
export const EVALUATOR_CONFIG = {
    // Default provider/model for evaluation
    provider: process.env.EVAL_PROVIDER || 'openai',
    model: process.env.EVAL_MODEL || 'gpt-4o',

    // API endpoints
    endpoints: {
        openai: 'https://api.openai.com/v1/chat/completions',
        anthropic: 'https://api.anthropic.com/v1/messages',
        gemini: 'https://generativelanguage.googleapis.com/v1beta/models'
    },

    // Scoring thresholds
    thresholds: {
        excellent: 0.9,
        good: 0.75,
        acceptable: 0.6,
        poor: 0.4
    }
};

/**
 * Core evaluation prompt template
 */
const EVALUATION_PROMPT = `You are an expert evaluator of structured knowledge representations.
Your task is to assess the structural fidelity of a tree-listing against source material.

## Source Context
This tree represents a structured analysis of philosophical dialogue, specifically
from Plato's Meno. The Philosophy pattern uses:
- Movements (phases): Major dialectical turns
- Claims (items): Individual arguments, questions, definitions
- Support (subtasks): Evidence or sub-arguments

## Evaluation Criteria

### 1. Dialectical Flow (weight: 30%)
Does the tree capture the back-and-forth between interlocutors?
- Question → Response → Counter patterns
- Elenchus (refutation) sequences
- Progressive deepening of inquiry

### 2. Argument Types (weight: 25%)
Are claims correctly typed?
- question: Interrogative moves
- definition: Attempts to define concepts
- refutation: Counter-arguments or elenchus
- premise: Supporting propositions
- conclusion: Derived claims

### 3. Logical Structure (weight: 25%)
Are supporting points correctly nested under parent claims?
- Sub-arguments under main arguments
- Evidence under claims
- Proper dependency relationships

### 4. Content Fidelity (weight: 20%)
Is the philosophical content accurately represented?
- Key terms preserved (virtue, teaching, nature, form/eidos)
- No distortion of meaning
- No significant omissions

## Tree to Evaluate
\`\`\`json
{{TREE_JSON}}
\`\`\`

## Expected Structure (Reference)
\`\`\`json
{{EXPECTED_JSON}}
\`\`\`

## Your Response
Return a JSON object with:
{
    "overallScore": <0-1 weighted composite>,
    "dialecticalFlow": {
        "score": <0-1>,
        "notes": "<specific observations>",
        "captured": ["<elements captured>"],
        "missing": ["<elements missing>"]
    },
    "argumentTypes": {
        "score": <0-1>,
        "notes": "<specific observations>",
        "correct": ["<correctly typed>"],
        "incorrect": ["<mistyped items>"]
    },
    "logicalStructure": {
        "score": <0-1>,
        "notes": "<specific observations>",
        "wellNested": ["<good nesting examples>"],
        "problems": ["<structure issues>"]
    },
    "contentFidelity": {
        "score": <0-1>,
        "notes": "<specific observations>",
        "preserved": ["<key content kept>"],
        "distorted": ["<content issues>"]
    },
    "recommendations": [
        "<actionable improvement 1>",
        "<actionable improvement 2>",
        ...
    ]
}`;

/**
 * Builds the evaluation prompt with tree data
 */
export function buildEvaluationPrompt(tree, expectedStructure) {
    return EVALUATION_PROMPT
        .replace('{{TREE_JSON}}', JSON.stringify(tree, null, 2))
        .replace('{{EXPECTED_JSON}}', JSON.stringify(expectedStructure, null, 2));
}

/**
 * Calls the evaluation AI provider
 */
export async function callEvaluationAI(prompt, config = EVALUATOR_CONFIG) {
    const apiKey = getAPIKey(config.provider);

    if (!apiKey) {
        throw new Error(`No API key found for ${config.provider}. Set ${config.provider.toUpperCase()}_API_KEY environment variable.`);
    }

    const response = await fetch(config.endpoints[config.provider], {
        method: 'POST',
        headers: buildHeaders(config.provider, apiKey),
        body: buildRequestBody(config.provider, config.model, prompt)
    });

    if (!response.ok) {
        throw new Error(`Evaluation API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return extractContent(config.provider, data);
}

/**
 * Gets API key from environment
 */
function getAPIKey(provider) {
    const keyMap = {
        openai: process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
        gemini: process.env.GEMINI_API_KEY
    };
    return keyMap[provider];
}

/**
 * Builds request headers for provider
 */
function buildHeaders(provider, apiKey) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (provider === 'openai') {
        headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'gemini') {
        // Gemini uses query param, handled in endpoint
    }

    return headers;
}

/**
 * Builds request body for provider
 */
function buildRequestBody(provider, model, prompt) {
    if (provider === 'openai') {
        return JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,  // Low temp for consistent evaluation
            response_format: { type: 'json_object' }
        });
    } else if (provider === 'anthropic') {
        return JSON.stringify({
            model: model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
        });
    } else if (provider === 'gemini') {
        return JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
        });
    }
}

/**
 * Extracts content from provider response
 */
function extractContent(provider, data) {
    if (provider === 'openai') {
        return data.choices[0].message.content;
    } else if (provider === 'anthropic') {
        return data.content[0].text;
    } else if (provider === 'gemini') {
        return data.candidates[0].content.parts[0].text;
    }
}

/**
 * Parses evaluation response into structured result
 */
export function parseEvaluationResponse(content) {
    try {
        // Handle markdown code blocks if present
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                         content.match(/```\n?([\s\S]*?)\n?```/);

        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        return JSON.parse(jsonStr);
    } catch (error) {
        throw new Error(`Failed to parse evaluation response: ${error.message}`);
    }
}

/**
 * Main evaluation function
 */
export async function evaluateTree(tree, expectedStructure, config = EVALUATOR_CONFIG) {
    const prompt = buildEvaluationPrompt(tree, expectedStructure);
    const response = await callEvaluationAI(prompt, config);
    return parseEvaluationResponse(response);
}

/**
 * Calculates weighted overall score from component scores
 */
export function calculateOverallScore(evaluation) {
    const weights = {
        dialecticalFlow: 0.30,
        argumentTypes: 0.25,
        logicalStructure: 0.25,
        contentFidelity: 0.20
    };

    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
        if (evaluation[key]?.score !== undefined) {
            total += evaluation[key].score * weight;
        }
    }

    return Math.round(total * 100) / 100;
}

/**
 * Generates a human-readable report from evaluation
 */
export function generateReport(evaluation) {
    const lines = [];
    const threshold = EVALUATOR_CONFIG.thresholds;

    // Header
    lines.push('# Structural Fidelity Evaluation Report');
    lines.push('');

    // Overall score
    const rating = evaluation.overallScore >= threshold.excellent ? 'Excellent' :
                  evaluation.overallScore >= threshold.good ? 'Good' :
                  evaluation.overallScore >= threshold.acceptable ? 'Acceptable' : 'Needs Improvement';

    lines.push(`## Overall Score: ${(evaluation.overallScore * 100).toFixed(1)}% (${rating})`);
    lines.push('');

    // Component scores
    lines.push('## Component Scores');
    lines.push('');

    const components = [
        { key: 'dialecticalFlow', name: 'Dialectical Flow', weight: '30%' },
        { key: 'argumentTypes', name: 'Argument Types', weight: '25%' },
        { key: 'logicalStructure', name: 'Logical Structure', weight: '25%' },
        { key: 'contentFidelity', name: 'Content Fidelity', weight: '20%' }
    ];

    for (const { key, name, weight } of components) {
        const comp = evaluation[key];
        if (comp) {
            lines.push(`### ${name} (${weight}): ${(comp.score * 100).toFixed(1)}%`);
            lines.push(comp.notes || 'No notes provided');
            lines.push('');
        }
    }

    // Recommendations
    if (evaluation.recommendations?.length > 0) {
        lines.push('## Recommendations');
        lines.push('');
        evaluation.recommendations.forEach((rec, i) => {
            lines.push(`${i + 1}. ${rec}`);
        });
    }

    return lines.join('\n');
}

/**
 * Quick evaluation for CI/CD - returns pass/fail
 */
export async function quickEvaluate(tree, expectedStructure, minScore = 0.7) {
    try {
        const evaluation = await evaluateTree(tree, expectedStructure);
        return {
            pass: evaluation.overallScore >= minScore,
            score: evaluation.overallScore,
            summary: `Score: ${(evaluation.overallScore * 100).toFixed(1)}% (threshold: ${minScore * 100}%)`
        };
    } catch (error) {
        return {
            pass: false,
            score: 0,
            summary: `Evaluation failed: ${error.message}`
        };
    }
}
