/**
 * Philosophy Depth Test - Iteration 2
 *
 * A rethought evaluation system that measures PHILOSOPHICAL DEPTH
 * not just structural conformity.
 *
 * Three-tier evaluation:
 * 1. Argument Reconstruction (40%) - Logical structure
 * 2. Philosophical Contextualization (30%) - Tradition, concepts, interlocutors
 * 3. Critical Apparatus (30%) - Objections, sources, open questions
 */

import { config } from 'dotenv';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '..', '.env') });

import { menoExcerptText } from '../fixtures/meno-excerpt.js';
import { descartesExcerptText } from '../fixtures/descartes-excerpt.js';

const OUTPUT_DIR = join(__dirname, '..', '..', 'test-results', 'philosophy-depth');

// Philosophical context for each text (what a good analysis SHOULD capture)
const PHILOSOPHICAL_CONTEXT = {
    meno: {
        name: 'Meno (Platonic Dialogue)',
        text: menoExcerptText,
        tradition: 'Socratic/Platonic',
        keyMethod: 'Socratic Elenchus (refutation through questioning)',
        keyArguments: [
            'Priority of Definition: Cannot know attributes without knowing essence',
            'Unity of Virtue: Many instances must share one Form (eidos)',
            'Swarm Analogy: Multiplicity does not constitute definition'
        ],
        keyTerms: [
            { term: 'arete (virtue)', meaning: 'excellence or proper function' },
            { term: 'eidos (form)', meaning: 'the common nature shared by instances' },
            { term: 'ti esti (what is it?)', meaning: 'Socratic definitional question' }
        ],
        interlocutors: ['Gorgias (sophist)', 'Thessalian rhetoricians'],
        influence: ['Aristotle on definition', 'Theory of Forms', 'Socratic method'],
        standardObjections: [
            'Meno\'s Paradox: How can you search for what you don\'t know?',
            'Is the Priority of Definition too strict?'
        ],
        secondarySources: [
            'Vlastos - Socratic Studies',
            'Fine - The Possibility of Inquiry',
            'Scott - Plato\'s Meno'
        ]
    },
    descartes: {
        name: 'Descartes Meditation II (Cogito)',
        text: descartesExcerptText,
        tradition: 'Rationalism/Foundationalism',
        keyMethod: 'Method of Hyperbolic Doubt',
        keyArguments: [
            'Cogito: I think therefore I am (or: I am, I exist)',
            'Evil Demon Hypothesis: Even maximal deception presupposes a self',
            'Indubitability Criterion: Only what cannot be doubted counts as knowledge',
            'Mind-Body Distinction: Thinking is essential, body is not'
        ],
        keyTerms: [
            { term: 'cogito', meaning: 'the thinking self as first certainty' },
            { term: 'res cogitans', meaning: 'thinking substance (mind)' },
            { term: 'hyperbolic doubt', meaning: 'doubt extended to all possibly false beliefs' },
            { term: 'clear and distinct', meaning: 'criterion for true ideas' }
        ],
        interlocutors: ['Scholastics', 'Pyrrhonian skeptics', 'Augustine (si fallor sum)'],
        influence: ['Modern epistemology', 'Mind-body problem', 'Foundationalism'],
        standardObjections: [
            'Cartesian Circle: Uses God to validate reason, reason to prove God',
            'Lichtenberg: Should say "it thinks" not "I think"',
            'Is the Cogito an inference or immediate intuition?'
        ],
        secondarySources: [
            'Williams - Descartes: The Project of Pure Enquiry',
            'Frankfurt - Demons, Dreamers, and Madmen',
            'Cottingham - Descartes'
        ]
    }
};

/**
 * Call Claude API
 */
async function callClaude(prompt, maxTokens = 4096) {
    const start = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return {
        content: data.content[0].text,
        elapsed: Date.now() - start
    };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, maxTokens = 2048) {
    const start = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return {
        content: data.choices[0].message.content,
        elapsed: Date.now() - start
    };
}

/**
 * Parse JSON safely
 */
function parseJSON(text) {
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(jsonText);
}

/**
 * IMPROVED PROMPT: Philosophical Tree-Listing with Depth
 */
function buildPhilosophyPrompt(text) {
    return `You are a professor of philosophy with expertise in argument reconstruction, history of philosophy, and textual analysis.

Analyze this philosophical text and create a structured tree that captures its PHILOSOPHICAL DEPTH.

## YOUR TASK

### 1. ARGUMENT RECONSTRUCTION
Identify the logical structure:
- PREMISES: Both explicit (stated) and implicit (required but unstated)
- CONCLUSIONS: What follows from the premises
- ARGUMENT FORM: The logical pattern (modus ponens, reductio ad absurdum, transcendental argument, etc.)
- INFERENTIAL LINKS: How claims connect logically

### 2. PHILOSOPHICAL CONTEXTUALIZATION
Situate the argument:
- TRADITION: What school of thought? (Platonic, Rationalist, Empiricist, etc.)
- KEY TERMS: Technical vocabulary with definitions
- INTERLOCUTORS: Who is the author arguing against or responding to?
- METHOD: What argumentative strategy is employed?

### 3. CRITICAL APPARATUS
Scholarly engagement:
- STANDARD OBJECTIONS: Well-known criticisms of this argument
- SECONDARY SOURCES: Important commentators (name 2-3)
- OPEN QUESTIONS: Unresolved tensions or debates
- PHILOSOPHICAL LEGACY: Influence on subsequent thought

## ITEM TYPES (Use precisely)
- question: Driving inquiry that structures investigation
- premise: Explicit foundational claim
- implicit-premise: Unstated assumption required for validity
- definition: Attempt to characterize a concept
- distinction: Conceptual clarification separating two ideas
- thought-experiment: Hypothetical scenario testing intuitions
- refutation: Counter-argument challenging a position
- objection: Standard criticism from the literature
- conclusion: Claim derived from preceding reasoning

## OUTPUT SCHEMA
Return ONLY valid JSON:
{
  "id": "root",
  "name": "<Text title>",
  "type": "root",
  "schemaVersion": 1,
  "pattern": "philosophy",
  "metadata": {
    "tradition": "<Philosophical school>",
    "method": "<Argumentative strategy>",
    "keyTerms": [{ "term": "<term>", "definition": "<meaning>" }],
    "interlocutors": ["<thinker or school>"],
    "secondarySources": ["<Author - Title>"],
    "standardObjections": ["<objection name>"]
  },
  "hyperedges": [],
  "children": [
    {
      "id": "movement-0",
      "name": "<Movement name>",
      "type": "phase",
      "phase": 0,
      "subtitle": "<Brief description>",
      "argumentForm": "<logical pattern if applicable>",
      "items": [
        {
          "id": "claim-0-0",
          "name": "<Claim name>",
          "type": "item",
          "itemType": "<see types above>",
          "description": "<Full description>",
          "validity": "<valid|invalid|needs-premise>",
          "subItems": [
            {
              "id": "support-0-0-0",
              "name": "<Support or sub-argument>",
              "type": "subtask",
              "itemType": "<type>",
              "description": "<Details>"
            }
          ]
        }
      ]
    }
  ]
}

## TEXT TO ANALYZE:
${text}

Remember: Capture PHILOSOPHICAL DEPTH, not just surface structure. Include implicit premises, situate historically, note standard objections.`;
}

/**
 * IMPROVED EVALUATION: Three-Tier Philosophical Depth
 */
function buildDepthEvaluationPrompt(tree, context) {
    return `You are evaluating a philosophical tree-listing for DEPTH OF ANALYSIS.

## TREE TO EVALUATE:
${JSON.stringify(tree, null, 2)}

## PHILOSOPHICAL CONTEXT (Ground Truth):
- Tradition: ${context.tradition}
- Key Method: ${context.keyMethod}
- Key Arguments: ${context.keyArguments.join('; ')}
- Key Terms: ${context.keyTerms.map(t => t.term).join(', ')}
- Interlocutors: ${context.interlocutors.join(', ')}
- Standard Objections: ${context.standardObjections.join('; ')}
- Important Sources: ${context.secondarySources.join(', ')}

## EVALUATION CRITERIA

### TIER 1: ARGUMENT RECONSTRUCTION (40%)
Score each 0-1:
- premiseIdentification: Are ALL premises (explicit AND implicit) captured?
- conclusionClarity: Is the main conclusion correctly identified and stated?
- inferentialLinks: Are logical connections between claims made explicit?
- argumentForm: Is the argument's logical form (modus ponens, reductio, etc.) recognized?

### TIER 2: PHILOSOPHICAL CONTEXTUALIZATION (30%)
Score each 0-1:
- traditionIdentification: Is the philosophical school/tradition correctly noted?
- keyConceptsAccuracy: Are technical terms properly identified and defined?
- interlocutorAwareness: Are opposing views or influences mentioned?
- methodRecognition: Is the argumentative strategy (elenchus, hyperbolic doubt, etc.) identified?

### TIER 3: CRITICAL APPARATUS (30%)
Score each 0-1:
- objectionsNoted: Are standard objections from the literature mentioned?
- sourcesReferenced: Are relevant secondary sources or commentators named?
- influenceTracked: Is the argument's philosophical legacy noted?
- openQuestionsIdentified: Are unresolved tensions or debates flagged?

## SCORING
- 0.0-0.2: Missing entirely
- 0.3-0.5: Superficial/incomplete
- 0.6-0.7: Adequate but lacks depth
- 0.8-0.9: Good with minor gaps
- 1.0: Excellent, comprehensive

Return JSON:
{
  "tier1_argumentReconstruction": {
    "premiseIdentification": { "score": <0-1>, "notes": "<what's captured/missing>" },
    "conclusionClarity": { "score": <0-1>, "notes": "<assessment>" },
    "inferentialLinks": { "score": <0-1>, "notes": "<assessment>" },
    "argumentForm": { "score": <0-1>, "notes": "<assessment>" },
    "tierScore": <average 0-1>
  },
  "tier2_contextualization": {
    "traditionIdentification": { "score": <0-1>, "notes": "<assessment>" },
    "keyConceptsAccuracy": { "score": <0-1>, "notes": "<assessment>" },
    "interlocutorAwareness": { "score": <0-1>, "notes": "<assessment>" },
    "methodRecognition": { "score": <0-1>, "notes": "<assessment>" },
    "tierScore": <average 0-1>
  },
  "tier3_criticalApparatus": {
    "objectionsNoted": { "score": <0-1>, "notes": "<assessment>" },
    "sourcesReferenced": { "score": <0-1>, "notes": "<assessment>" },
    "influenceTracked": { "score": <0-1>, "notes": "<assessment>" },
    "openQuestionsIdentified": { "score": <0-1>, "notes": "<assessment>" },
    "tierScore": <average 0-1>
  },
  "overallScore": <weighted: tier1*0.4 + tier2*0.3 + tier3*0.3>,
  "philosophicalDepthAssessment": "<2-3 sentence overall assessment>",
  "majorStrengths": ["<strength>", "<strength>"],
  "majorWeaknesses": ["<weakness>", "<weakness>"],
  "suggestionsForImprovement": ["<specific suggestion>", "<specific suggestion>"]
}`;
}

/**
 * Run test for a single text
 */
async function runTest(textKey) {
    const context = PHILOSOPHICAL_CONTEXT[textKey];
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📚 Testing: ${context.name}`);
    console.log(`   Tradition: ${context.tradition}`);
    console.log(`   Method: ${context.keyMethod}`);
    console.log('═'.repeat(70));

    const result = {
        text: textKey,
        name: context.name,
        context: context,
        success: false,
        tree: null,
        evaluation: null,
        timing: {},
        error: null
    };

    try {
        // Step 1: Generate philosophically-deep tree
        console.log('\n  📝 Step 1: Generating philosophical tree with depth prompt...');
        const startTree = Date.now();
        const treePrompt = buildPhilosophyPrompt(context.text);
        const treeResponse = await callClaude(treePrompt);
        result.tree = parseJSON(treeResponse.content);
        result.timing.treeListing = Date.now() - startTree;
        console.log(`     ✓ Tree generated in ${result.timing.treeListing}ms`);

        // Log tree metadata if present
        if (result.tree.metadata) {
            console.log(`     📋 Tradition: ${result.tree.metadata.tradition || 'Not specified'}`);
            console.log(`     📋 Method: ${result.tree.metadata.method || 'Not specified'}`);
            console.log(`     📋 Key Terms: ${result.tree.metadata.keyTerms?.length || 0}`);
            console.log(`     📋 Objections: ${result.tree.metadata.standardObjections?.length || 0}`);
            console.log(`     📋 Sources: ${result.tree.metadata.secondarySources?.length || 0}`);
        }

        // Step 2: Three-tier depth evaluation
        console.log('\n  🔍 Step 2: Evaluating philosophical depth...');
        const startEval = Date.now();
        const evalPrompt = buildDepthEvaluationPrompt(result.tree, context);
        const evalResponse = await callOpenAI(evalPrompt, 3000);
        result.evaluation = parseJSON(evalResponse.content);
        result.timing.evaluation = Date.now() - startEval;

        // Display tier scores
        const t1 = result.evaluation.tier1_argumentReconstruction?.tierScore || 0;
        const t2 = result.evaluation.tier2_contextualization?.tierScore || 0;
        const t3 = result.evaluation.tier3_criticalApparatus?.tierScore || 0;
        const overall = result.evaluation.overallScore || 0;

        console.log(`     ✓ Evaluation complete in ${result.timing.evaluation}ms`);
        console.log(`\n  📊 DEPTH SCORES:`);
        console.log(`     Tier 1 - Argument Reconstruction: ${(t1 * 100).toFixed(0)}%`);
        console.log(`     Tier 2 - Contextualization:       ${(t2 * 100).toFixed(0)}%`);
        console.log(`     Tier 3 - Critical Apparatus:      ${(t3 * 100).toFixed(0)}%`);
        console.log(`     ─────────────────────────────────────`);
        console.log(`     OVERALL DEPTH SCORE:              ${(overall * 100).toFixed(0)}%`);

        result.success = true;

    } catch (error) {
        result.error = error.message;
        console.log(`  ❌ Error: ${error.message}`);
    }

    return result;
}

/**
 * Generate dashboard
 */
function generateDashboard(results) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Philosophy Depth Analysis</title>
    <style>
        :root {
            --bg-primary: #0f1419;
            --bg-secondary: #1a1f2e;
            --bg-card: #242938;
            --text-primary: #e7e9ea;
            --text-secondary: #8b98a5;
            --border: #2f3542;
            --tier1: #f59e0b;
            --tier2: #8b5cf6;
            --tier3: #06b6d4;
            --overall: #10b981;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 24px;
            min-height: 100vh;
        }
        .dashboard { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header .subtitle { color: var(--text-secondary); }

        .text-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .text-card {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid var(--border);
        }
        .text-card h2 { font-size: 20px; margin-bottom: 8px; }
        .text-card .tradition { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }

        .tier-scores { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        .tier-box {
            padding: 16px;
            border-radius: 8px;
            text-align: center;
        }
        .tier-box.t1 { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); }
        .tier-box.t2 { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); }
        .tier-box.t3 { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); }
        .tier-box .label { font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; text-transform: uppercase; }
        .tier-box .score { font-size: 28px; font-weight: 700; }
        .tier-box.t1 .score { color: var(--tier1); }
        .tier-box.t2 .score { color: var(--tier2); }
        .tier-box.t3 .score { color: var(--tier3); }

        .overall-score {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }
        .overall-score .label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
        .overall-score .score { font-size: 48px; font-weight: 700; color: var(--overall); }

        .details { margin-top: 16px; }
        .detail-section { margin-bottom: 16px; }
        .detail-section h4 { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
        .detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .detail-row .label { color: var(--text-secondary); }
        .detail-row .value { font-weight: 500; }

        .assessment {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
            font-size: 14px;
            line-height: 1.6;
            color: var(--text-secondary);
        }

        .strengths-weaknesses { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
        .sw-box { background: var(--bg-secondary); border-radius: 8px; padding: 12px; }
        .sw-box h5 { font-size: 12px; margin-bottom: 8px; }
        .sw-box.strengths h5 { color: #10b981; }
        .sw-box.weaknesses h5 { color: #f59e0b; }
        .sw-box ul { list-style: none; font-size: 12px; color: var(--text-secondary); }
        .sw-box li { padding: 4px 0; padding-left: 16px; position: relative; }
        .sw-box.strengths li::before { content: '✓'; position: absolute; left: 0; color: #10b981; }
        .sw-box.weaknesses li::before { content: '!'; position: absolute; left: 0; color: #f59e0b; }

        .metadata-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
        .metadata-section h4 { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
        .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .metadata-item { background: var(--bg-secondary); padding: 8px 12px; border-radius: 6px; font-size: 12px; }
        .metadata-item .label { color: var(--text-secondary); }
        .metadata-item .value { color: var(--text-primary); margin-top: 2px; }

        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
        }

        @media (max-width: 900px) {
            .text-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🎓 Philosophy Depth Analysis</h1>
            <div class="subtitle">Three-Tier Evaluation: Argument • Context • Critical Apparatus</div>
        </div>

        <div class="text-grid">
            ${results.filter(r => r.success).map(r => {
                const e = r.evaluation;
                const t1 = e.tier1_argumentReconstruction || {};
                const t2 = e.tier2_contextualization || {};
                const t3 = e.tier3_criticalApparatus || {};

                return `
                <div class="text-card">
                    <h2>📚 ${r.name}</h2>
                    <div class="tradition">${r.context.tradition} • ${r.context.keyMethod}</div>

                    <div class="overall-score">
                        <div class="label">Overall Philosophical Depth</div>
                        <div class="score">${(e.overallScore * 100).toFixed(0)}%</div>
                    </div>

                    <div class="tier-scores">
                        <div class="tier-box t1">
                            <div class="label">Argument</div>
                            <div class="score">${((t1.tierScore || 0) * 100).toFixed(0)}%</div>
                        </div>
                        <div class="tier-box t2">
                            <div class="label">Context</div>
                            <div class="score">${((t2.tierScore || 0) * 100).toFixed(0)}%</div>
                        </div>
                        <div class="tier-box t3">
                            <div class="label">Critical</div>
                            <div class="score">${((t3.tierScore || 0) * 100).toFixed(0)}%</div>
                        </div>
                    </div>

                    <div class="details">
                        <div class="detail-section">
                            <h4>Tier 1: Argument Reconstruction (40%)</h4>
                            <div class="detail-row"><span class="label">Premise Identification</span><span class="value">${((t1.premiseIdentification?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Conclusion Clarity</span><span class="value">${((t1.conclusionClarity?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Inferential Links</span><span class="value">${((t1.inferentialLinks?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Argument Form</span><span class="value">${((t1.argumentForm?.score || 0) * 100).toFixed(0)}%</span></div>
                        </div>

                        <div class="detail-section">
                            <h4>Tier 2: Philosophical Contextualization (30%)</h4>
                            <div class="detail-row"><span class="label">Tradition Identification</span><span class="value">${((t2.traditionIdentification?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Key Concepts</span><span class="value">${((t2.keyConceptsAccuracy?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Interlocutor Awareness</span><span class="value">${((t2.interlocutorAwareness?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Method Recognition</span><span class="value">${((t2.methodRecognition?.score || 0) * 100).toFixed(0)}%</span></div>
                        </div>

                        <div class="detail-section">
                            <h4>Tier 3: Critical Apparatus (30%)</h4>
                            <div class="detail-row"><span class="label">Objections Noted</span><span class="value">${((t3.objectionsNoted?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Sources Referenced</span><span class="value">${((t3.sourcesReferenced?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Influence Tracked</span><span class="value">${((t3.influenceTracked?.score || 0) * 100).toFixed(0)}%</span></div>
                            <div class="detail-row"><span class="label">Open Questions</span><span class="value">${((t3.openQuestionsIdentified?.score || 0) * 100).toFixed(0)}%</span></div>
                        </div>
                    </div>

                    <div class="assessment">
                        ${e.philosophicalDepthAssessment || 'No assessment provided.'}
                    </div>

                    <div class="strengths-weaknesses">
                        <div class="sw-box strengths">
                            <h5>Strengths</h5>
                            <ul>${(e.majorStrengths || []).map(s => `<li>${s}</li>`).join('')}</ul>
                        </div>
                        <div class="sw-box weaknesses">
                            <h5>Areas for Improvement</h5>
                            <ul>${(e.majorWeaknesses || []).map(w => `<li>${w}</li>`).join('')}</ul>
                        </div>
                    </div>

                    ${r.tree.metadata ? `
                    <div class="metadata-section">
                        <h4>Extracted Metadata</h4>
                        <div class="metadata-grid">
                            <div class="metadata-item">
                                <div class="label">Tradition</div>
                                <div class="value">${r.tree.metadata.tradition || 'Not specified'}</div>
                            </div>
                            <div class="metadata-item">
                                <div class="label">Method</div>
                                <div class="value">${r.tree.metadata.method || 'Not specified'}</div>
                            </div>
                            <div class="metadata-item">
                                <div class="label">Key Terms</div>
                                <div class="value">${r.tree.metadata.keyTerms?.length || 0} identified</div>
                            </div>
                            <div class="metadata-item">
                                <div class="label">Sources</div>
                                <div class="value">${r.tree.metadata.secondarySources?.length || 0} referenced</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                `;
            }).join('')}
        </div>

        <div class="footer">
            <div>Treelisty v2.10.0 Build 166 | Philosophy Depth Test - Iteration 2</div>
            <div style="margin-top: 8px;">Generator: Claude Sonnet 4 | Evaluator: GPT-4o | ${new Date().toISOString()}</div>
        </div>
    </div>
</body>
</html>`;

    return html;
}

/**
 * Main
 */
async function main() {
    console.log('🎓 Philosophy Depth Test - Iteration 2');
    console.log('Three-Tier Evaluation: Argument • Context • Critical Apparatus\n');

    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const results = [];

    for (const textKey of Object.keys(PHILOSOPHICAL_CONTEXT)) {
        const result = await runTest(textKey);
        results.push(result);
    }

    console.log('\n📊 Generating depth analysis dashboard...');
    const html = generateDashboard(results);
    writeFileSync(join(OUTPUT_DIR, 'philosophy-depth-dashboard.html'), html);
    writeFileSync(join(OUTPUT_DIR, 'all-results.json'), JSON.stringify(results, null, 2));

    console.log(`\n✅ Done! Dashboard saved to:`);
    console.log(`   ${join(OUTPUT_DIR, 'philosophy-depth-dashboard.html')}`);

    console.log('\n📈 Summary:');
    for (const r of results.filter(r => r.success)) {
        const e = r.evaluation;
        console.log(`\n   ${r.name}:`);
        console.log(`     Tier 1 (Argument):  ${((e.tier1_argumentReconstruction?.tierScore || 0) * 100).toFixed(0)}%`);
        console.log(`     Tier 2 (Context):   ${((e.tier2_contextualization?.tierScore || 0) * 100).toFixed(0)}%`);
        console.log(`     Tier 3 (Critical):  ${((e.tier3_criticalApparatus?.tierScore || 0) * 100).toFixed(0)}%`);
        console.log(`     OVERALL:            ${(e.overallScore * 100).toFixed(0)}%`);
    }
}

main().catch(console.error);
