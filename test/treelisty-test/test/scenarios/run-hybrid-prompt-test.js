/**
 * Hybrid Prompt Testing - Iteration 2
 *
 * Based on A/B test findings:
 * - Baseline performs best overall (88%)
 * - Socratic shows +1.5% in Tier 1 (Argument)
 * - Multi-Persona excels on some texts
 *
 * This iteration tests HYBRID approaches that combine winning elements:
 * 1. BASELINE+ : Enhanced baseline with Socratic questioning elements
 * 2. STRUCTURED_SCHOLAR: Academic rigor with explicit secondary source requirements
 * 3. ARGUMENT_FIRST: Prioritize logical structure before contextualization
 * 4. CRITICAL_DEPTH: Extra emphasis on objections and counter-arguments
 */

import { config } from 'dotenv';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '..', '.env') });

import { menoExcerptText } from '../fixtures/meno-excerpt.js';
import { descartesExcerptText } from '../fixtures/descartes-excerpt.js';

const OUTPUT_DIR = join(__dirname, '..', '..', 'test-results', 'hybrid-prompts');

// ============================================================================
// PHILOSOPHICAL CONTEXT
// ============================================================================

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
            'Cogito: I think therefore I am',
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

// ============================================================================
// HYBRID PROMPT TECHNIQUES
// ============================================================================

const HYBRID_TECHNIQUES = {
    // Enhanced baseline with Socratic elements
    BASELINE_PLUS: {
        name: 'Baseline+ (Socratic Enhanced)',
        description: 'Original baseline enhanced with Socratic elenchus principles for argument reconstruction',
        buildPrompt: (text) => `You are a professor of philosophy with expertise in argument reconstruction, history of philosophy, and textual analysis.

Analyze this philosophical text using SOCRATIC RIGOR to capture its PHILOSOPHICAL DEPTH.

## SOCRATIC PRINCIPLES TO APPLY

Before constructing your analysis, apply these Socratic methods:
1. **DEFINITION (ti esti)**: What is the central concept being investigated?
2. **ELENCHUS**: What counterexamples or objections challenge each claim?
3. **APORIA**: Where does the argument reach genuine puzzlement?

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
- STANDARD OBJECTIONS: Well-known criticisms of this argument (name 2-3 specific objections)
- SECONDARY SOURCES: Important commentators (name 2-3 specific scholars with works)
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
  "children": [/* movements with items */]
}

## TEXT TO ANALYZE:
${text}

CRITICAL: You MUST name specific secondary sources and standard objections. Do not use generic placeholders.`
    },

    // Academic rigor with explicit source requirements
    STRUCTURED_SCHOLAR: {
        name: 'Structured Scholar',
        description: 'Academic format with mandatory scholarly apparatus and explicit citation requirements',
        buildPrompt: (text) => `You are preparing a graduate seminar handout on this philosophical text. Your analysis must meet ACADEMIC STANDARDS.

## SCHOLARLY REQUIREMENTS

Your output must include:
1. **NAMED SECONDARY SOURCES**: Cite at least 3 specific scholars who have written on this text (e.g., "Vlastos (1991)", "Williams (1978)")
2. **STANDARD OBJECTIONS**: Name specific objections with their associated philosophers (e.g., "Lichtenberg's objection: it thinks, not I think")
3. **TRADITION PLACEMENT**: Identify the specific school of thought
4. **ARGUMENT FORMALIZATION**: State the argument in premise-conclusion form

## ARGUMENT RECONSTRUCTION (40% weight)

For each major argument:
P1: [First premise - explicit or implicit]
P2: [Second premise]
...
C: [Conclusion]
FORM: [Logical pattern - modus ponens, reductio, etc.]

Mark premises as EXPLICIT or IMPLICIT.

## CONTEXTUALIZATION (30% weight)

- TRADITION: What philosophical school?
- PERIOD: What historical context?
- INTERLOCUTORS: Who is being responded to?
- KEY CONCEPTS: Technical terms with precise definitions
- METHOD: What argumentative strategy?

## CRITICAL APPARATUS (30% weight)

STANDARD OBJECTIONS (at least 2):
1. [Objection name] - [Philosopher who raised it]: [Brief description]
2. [Objection name] - [Source]: [Brief description]

SECONDARY LITERATURE (at least 3):
1. [Author] - [Title/Year]: [Key contribution]
2. [Author] - [Title/Year]: [Key contribution]
3. [Author] - [Title/Year]: [Key contribution]

PHILOSOPHICAL LEGACY:
- How did this argument influence later thought?

OPEN QUESTIONS:
- What remains unresolved?

## OUTPUT FORMAT
Return valid JSON with the full tree structure including metadata.

{
  "id": "root",
  "name": "<Text title>",
  "type": "root",
  "schemaVersion": 1,
  "pattern": "philosophy",
  "metadata": {
    "tradition": "<School>",
    "method": "<Method>",
    "keyTerms": [{"term": "<>", "definition": "<>"}],
    "interlocutors": ["<>"],
    "secondarySources": ["<Author - Title (Year)>"],
    "standardObjections": ["<Name: Description>"]
  },
  "hyperedges": [],
  "children": [/* phases with items */]
}

## TEXT TO ANALYZE:
${text}`
    },

    // Argument-first approach
    ARGUMENT_FIRST: {
        name: 'Argument First',
        description: 'Prioritizes logical structure reconstruction before contextualization',
        buildPrompt: (text) => `You are a philosophical logician. Your PRIMARY task is to reconstruct the LOGICAL STRUCTURE of this argument with maximum precision.

## PHASE 1: LOGICAL RECONSTRUCTION (Priority)

STEP 1 - Identify the MAIN CONCLUSION:
What is the author ultimately trying to establish?

STEP 2 - Map the ARGUMENT STRUCTURE:
For each sub-argument, provide:
- Premises (P1, P2, ...)
- Intermediate conclusions
- How they connect to the main conclusion

STEP 3 - Identify IMPLICIT PREMISES:
What unstated assumptions are REQUIRED for the argument to be valid?

STEP 4 - Determine ARGUMENT FORM:
- Modus ponens? Modus tollens?
- Reductio ad absurdum?
- Transcendental argument?
- Dialectical synthesis?

STEP 5 - Assess VALIDITY:
Does the conclusion follow necessarily from the premises?

## PHASE 2: PHILOSOPHICAL CONTEXT

After establishing the logical structure:
- What TRADITION does this belong to?
- What KEY TERMS require definition?
- Who are the INTERLOCUTORS?
- What METHOD is being employed?

## PHASE 3: CRITICAL EVALUATION

- What are the STANDARD OBJECTIONS to this argument?
- Who are the major COMMENTATORS on this text?
- What is the PHILOSOPHICAL LEGACY?
- What remains UNRESOLVED?

## OUTPUT FORMAT
Return valid JSON:
{
  "id": "root",
  "name": "<Title>",
  "type": "root",
  "schemaVersion": 1,
  "pattern": "philosophy",
  "metadata": {
    "mainConclusion": "<The main thesis being argued>",
    "argumentForm": "<Primary logical form>",
    "tradition": "<School>",
    "method": "<Method>",
    "keyTerms": [{"term": "<>", "definition": "<>"}],
    "interlocutors": ["<>"],
    "secondarySources": ["<Author - Work>"],
    "standardObjections": ["<Objection>"]
  },
  "hyperedges": [],
  "children": [
    {
      "id": "movement-0",
      "name": "<Movement>",
      "type": "phase",
      "phase": 0,
      "argumentForm": "<Logical form of this section>",
      "items": [
        {
          "id": "item-0-0",
          "name": "<Claim>",
          "type": "item",
          "itemType": "premise|implicit-premise|conclusion|refutation|objection",
          "logicalRole": "<P1|P2|C|Sub-C>",
          "description": "<Full description>",
          "subItems": []
        }
      ]
    }
  ]
}

## TEXT TO ANALYZE:
${text}`
    },

    // Extra emphasis on critical depth
    CRITICAL_DEPTH: {
        name: 'Critical Depth',
        description: 'Extra emphasis on objections, counter-arguments, and scholarly debate',
        buildPrompt: (text) => `You are a CRITICAL philosopher. Your task is not just to understand this argument, but to INTERROGATE it.

## CRITICAL STANCE

For every claim in this text, ask:
1. What would an OPPONENT say?
2. What is the WEAKEST point?
3. What COUNTEREXAMPLE might apply?
4. What ASSUMPTION is being made?

## THE SCHOLARLY DEBATE

This text has been discussed by generations of scholars. You must:
1. NAME specific scholars who have written on this (minimum 3)
2. IDENTIFY the major interpretive controversies
3. NOTE which objections have been most influential
4. EXPLAIN how defenders have responded

## STRUCTURE YOUR ANALYSIS

### PART 1: THE ARGUMENT
- What is being claimed?
- What premises support it?
- What is implicit but required?

### PART 2: THE TRADITION
- What school of thought?
- What method is being used?
- Who is the author responding to?

### PART 3: THE CRITICAL CONVERSATION
This is where you demonstrate DEPTH:

**Major Objections** (name at least 3):
1. [Objection name] by [Philosopher]: [Substance of objection]
2. [Objection name] by [Philosopher]: [Substance of objection]
3. [Objection name] by [Philosopher]: [Substance of objection]

**Scholarly Interpretations** (name at least 3 sources):
1. [Scholar] argues that...
2. [Scholar] interprets this as...
3. [Scholar] criticizes/defends...

**Unresolved Questions**:
- What tensions remain in the argument?
- What would need to be established for the argument to succeed?
- Where does the philosophical conversation continue today?

## OUTPUT FORMAT
Return valid JSON:
{
  "id": "root",
  "name": "<Title>",
  "type": "root",
  "schemaVersion": 1,
  "pattern": "philosophy",
  "metadata": {
    "tradition": "<>",
    "method": "<>",
    "keyTerms": [{"term": "<>", "definition": "<>"}],
    "interlocutors": ["<>"],
    "secondarySources": ["<Author - Work>"],
    "standardObjections": ["<Name by Philosopher: Description>"],
    "majorDebates": ["<Key interpretive controversy>"]
  },
  "hyperedges": [],
  "children": [/* movements */]
}

## TEXT TO ANALYZE:
${text}

REMEMBER: A philosophically deep analysis must engage with the CRITICAL CONVERSATION around the text. Name names. Cite sources. Present objections.`
    }
};

// ============================================================================
// API CALLS
// ============================================================================

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

// ============================================================================
// EVALUATION
// ============================================================================

function buildEvaluationPrompt(tree, context) {
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
- argumentForm: Is the argument's logical form recognized?

### TIER 2: PHILOSOPHICAL CONTEXTUALIZATION (30%)
Score each 0-1:
- traditionIdentification: Is the philosophical school/tradition correctly noted?
- keyConceptsAccuracy: Are technical terms properly identified and defined?
- interlocutorAwareness: Are opposing views or influences mentioned?
- methodRecognition: Is the argumentative strategy identified?

### TIER 3: CRITICAL APPARATUS (30%)
Score each 0-1:
- objectionsNoted: Are standard objections mentioned? (Must name specific objections)
- sourcesReferenced: Are secondary sources named? (Must cite specific scholars)
- influenceTracked: Is the argument's philosophical legacy noted?
- openQuestionsIdentified: Are unresolved tensions flagged?

## SCORING GUIDE
- 0.0-0.2: Missing entirely
- 0.3-0.5: Superficial/incomplete
- 0.6-0.7: Adequate but lacks depth
- 0.8-0.9: Good with minor gaps
- 1.0: Excellent, comprehensive

IMPORTANT: For Tier 3, only score high if SPECIFIC names are given (e.g., "Vlastos" not just "scholars").

Return JSON:
{
  "tier1_argumentReconstruction": {
    "premiseIdentification": { "score": <0-1>, "notes": "<>" },
    "conclusionClarity": { "score": <0-1>, "notes": "<>" },
    "inferentialLinks": { "score": <0-1>, "notes": "<>" },
    "argumentForm": { "score": <0-1>, "notes": "<>" },
    "tierScore": <average>
  },
  "tier2_contextualization": {
    "traditionIdentification": { "score": <0-1>, "notes": "<>" },
    "keyConceptsAccuracy": { "score": <0-1>, "notes": "<>" },
    "interlocutorAwareness": { "score": <0-1>, "notes": "<>" },
    "methodRecognition": { "score": <0-1>, "notes": "<>" },
    "tierScore": <average>
  },
  "tier3_criticalApparatus": {
    "objectionsNoted": { "score": <0-1>, "notes": "<>" },
    "sourcesReferenced": { "score": <0-1>, "notes": "<>" },
    "influenceTracked": { "score": <0-1>, "notes": "<>" },
    "openQuestionsIdentified": { "score": <0-1>, "notes": "<>" },
    "tierScore": <average>
  },
  "overallScore": <weighted: tier1*0.4 + tier2*0.3 + tier3*0.3>,
  "philosophicalDepthAssessment": "<2-3 sentence assessment>"
}`;
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runSingleTest(techniqueName, technique, textKey, context) {
    const result = {
        technique: techniqueName,
        techniqueDescription: technique.description,
        textKey,
        textName: context.name,
        success: false,
        tree: null,
        evaluation: null,
        timing: {},
        error: null
    };

    try {
        const startTree = Date.now();
        const prompt = technique.buildPrompt(context.text);
        const treeResponse = await callClaude(prompt);
        result.tree = parseJSON(treeResponse.content);
        result.timing.treeListing = Date.now() - startTree;

        const startEval = Date.now();
        const evalPrompt = buildEvaluationPrompt(result.tree, context);
        const evalResponse = await callOpenAI(evalPrompt, 3000);
        result.evaluation = parseJSON(evalResponse.content);
        result.timing.evaluation = Date.now() - startEval;

        result.success = true;
    } catch (error) {
        result.error = error.message;
    }

    return result;
}

async function runAllTests() {
    console.log('🧪 Hybrid Prompt Testing - Iteration 2');
    console.log('═'.repeat(70));
    console.log('Testing 4 hybrid techniques derived from A/B test findings\n');

    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const allResults = [];
    const techniqueNames = Object.keys(HYBRID_TECHNIQUES);
    const textKeys = Object.keys(PHILOSOPHICAL_CONTEXT);

    let testNum = 0;
    const totalTests = techniqueNames.length * textKeys.length;

    for (const techniqueName of techniqueNames) {
        const technique = HYBRID_TECHNIQUES[techniqueName];
        console.log(`\n📋 Technique: ${technique.name}`);
        console.log(`   ${technique.description}`);
        console.log('─'.repeat(60));

        for (const textKey of textKeys) {
            testNum++;
            const context = PHILOSOPHICAL_CONTEXT[textKey];
            console.log(`\n   [${testNum}/${totalTests}] Testing on ${context.name}...`);

            const result = await runSingleTest(techniqueName, technique, textKey, context);
            allResults.push(result);

            if (result.success) {
                const t1 = result.evaluation.tier1_argumentReconstruction?.tierScore || 0;
                const t2 = result.evaluation.tier2_contextualization?.tierScore || 0;
                const t3 = result.evaluation.tier3_criticalApparatus?.tierScore || 0;
                const overall = result.evaluation.overallScore || 0;

                console.log(`      ✓ T1: ${(t1*100).toFixed(0)}% | T2: ${(t2*100).toFixed(0)}% | T3: ${(t3*100).toFixed(0)}% | Overall: ${(overall*100).toFixed(0)}%`);
            } else {
                console.log(`      ✗ Error: ${result.error}`);
            }
        }
    }

    return allResults;
}

// ============================================================================
// ANALYSIS
// ============================================================================

function analyzeResults(results) {
    const analysis = {
        byTechnique: {},
        ranking: [],
        baselineComparison: {
            baselineAvg: 0.88, // From previous test
            improvements: []
        }
    };

    for (const r of results) {
        if (!r.success) continue;

        if (!analysis.byTechnique[r.technique]) {
            analysis.byTechnique[r.technique] = {
                name: HYBRID_TECHNIQUES[r.technique].name,
                description: HYBRID_TECHNIQUES[r.technique].description,
                results: [],
                avgOverall: 0,
                avgTier1: 0,
                avgTier2: 0,
                avgTier3: 0
            };
        }
        analysis.byTechnique[r.technique].results.push(r);
    }

    for (const [tech, data] of Object.entries(analysis.byTechnique)) {
        const successResults = data.results.filter(r => r.success);
        if (successResults.length === 0) continue;

        data.avgOverall = successResults.reduce((sum, r) => sum + (r.evaluation.overallScore || 0), 0) / successResults.length;
        data.avgTier1 = successResults.reduce((sum, r) => sum + (r.evaluation.tier1_argumentReconstruction?.tierScore || 0), 0) / successResults.length;
        data.avgTier2 = successResults.reduce((sum, r) => sum + (r.evaluation.tier2_contextualization?.tierScore || 0), 0) / successResults.length;
        data.avgTier3 = successResults.reduce((sum, r) => sum + (r.evaluation.tier3_criticalApparatus?.tierScore || 0), 0) / successResults.length;

        analysis.ranking.push({
            technique: tech,
            name: data.name,
            avgOverall: data.avgOverall,
            avgTier1: data.avgTier1,
            avgTier2: data.avgTier2,
            avgTier3: data.avgTier3
        });

        const deltaVsBaseline = ((data.avgOverall - analysis.baselineComparison.baselineAvg) * 100).toFixed(1);
        analysis.baselineComparison.improvements.push({
            technique: data.name,
            delta: parseFloat(deltaVsBaseline),
            deltaStr: deltaVsBaseline,
            improved: parseFloat(deltaVsBaseline) > 0
        });
    }

    analysis.ranking.sort((a, b) => b.avgOverall - a.avgOverall);
    analysis.baselineComparison.improvements.sort((a, b) => b.delta - a.delta);

    return analysis;
}

function generateDashboard(results, analysis) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hybrid Prompt Test Results - Iteration 2</title>
    <style>
        :root {
            --bg-primary: #0f1419;
            --bg-secondary: #1a1f2e;
            --bg-card: #242938;
            --text-primary: #e7e9ea;
            --text-secondary: #8b98a5;
            --border: #2f3542;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --tier1: #f59e0b;
            --tier2: #8b5cf6;
            --tier3: #06b6d4;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 24px;
        }
        .dashboard { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header .subtitle { color: var(--text-secondary); }

        .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .summary-card {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid var(--border);
        }
        .summary-card .label { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
        .summary-card .value { font-size: 32px; font-weight: 700; }
        .summary-card.winner .value { color: var(--success); }
        .summary-card.improved .value { color: var(--success); }
        .summary-card.neutral .value { color: var(--warning); }

        .ranking-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-card);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 32px;
        }
        .ranking-table th, .ranking-table td { padding: 16px; text-align: left; border-bottom: 1px solid var(--border); }
        .ranking-table th { background: var(--bg-secondary); color: var(--text-secondary); font-size: 12px; text-transform: uppercase; }
        .ranking-table tr:last-child td { border-bottom: none; }
        .ranking-table .rank { font-weight: 700; font-size: 18px; }
        .delta { font-size: 12px; padding: 4px 8px; border-radius: 4px; }
        .delta.positive { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .delta.negative { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .comparison-section { margin-bottom: 32px; }
        .comparison-section h2 { font-size: 18px; margin-bottom: 16px; }
        .comparison-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .comparison-card {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid var(--border);
        }
        .comparison-card h3 { font-size: 16px; margin-bottom: 4px; }
        .comparison-card .desc { color: var(--text-secondary); font-size: 12px; margin-bottom: 16px; }
        .score-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
        .score-row:last-child { border-bottom: none; }
        .score-row .label { color: var(--text-secondary); font-size: 13px; }
        .score-row .value { font-weight: 600; }

        .footer {
            text-align: center;
            padding-top: 24px;
            border-top: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🧪 Hybrid Prompt Test Results</h1>
            <div class="subtitle">Iteration 2: Combining winning elements from A/B testing</div>
        </div>

        <div class="summary-cards">
            ${analysis.ranking.slice(0, 4).map((r, i) => `
                <div class="summary-card ${i === 0 ? 'winner' : ''}">
                    <div class="label">${i === 0 ? '🏆 Best' : `#${i+1}`} ${r.name}</div>
                    <div class="value">${(r.avgOverall * 100).toFixed(0)}%</div>
                </div>
            `).join('')}
        </div>

        <h2 style="margin-bottom: 16px;">📊 Full Ranking vs Baseline (88%)</h2>
        <table class="ranking-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Technique</th>
                    <th>Overall</th>
                    <th>Tier 1</th>
                    <th>Tier 2</th>
                    <th>Tier 3</th>
                    <th>vs Baseline</th>
                </tr>
            </thead>
            <tbody>
                ${analysis.ranking.map((r, i) => {
                    const delta = ((r.avgOverall - 0.88) * 100).toFixed(1);
                    const deltaClass = parseFloat(delta) > 0 ? 'positive' : 'negative';
                    return `
                    <tr>
                        <td class="rank">#${i+1}</td>
                        <td><strong>${r.name}</strong></td>
                        <td>${(r.avgOverall * 100).toFixed(0)}%</td>
                        <td>${(r.avgTier1 * 100).toFixed(0)}%</td>
                        <td>${(r.avgTier2 * 100).toFixed(0)}%</td>
                        <td>${(r.avgTier3 * 100).toFixed(0)}%</td>
                        <td><span class="delta ${deltaClass}">${delta > 0 ? '+' : ''}${delta}%</span></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>

        <div class="comparison-section">
            <h2>📋 Technique Details</h2>
            <div class="comparison-grid">
                ${Object.entries(analysis.byTechnique).map(([tech, data]) => `
                    <div class="comparison-card">
                        <h3>${data.name}</h3>
                        <div class="desc">${data.description}</div>
                        ${data.results.map(r => `
                            <div class="score-row">
                                <span class="label">${r.textName}</span>
                                <span class="value">${(r.evaluation.overallScore * 100).toFixed(0)}%</span>
                            </div>
                        `).join('')}
                        <div class="score-row" style="margin-top: 8px; border-top: 1px solid var(--border); padding-top: 8px;">
                            <span class="label"><strong>Average</strong></span>
                            <span class="value" style="color: var(--success);">${(data.avgOverall * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <div>Treelisty v2.10.0 Build 166 | Hybrid Prompt Test - Iteration 2</div>
            <div style="margin-top: 8px;">Generator: Claude Sonnet 4 | Evaluator: GPT-4o | ${new Date().toISOString()}</div>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log('\n🧪 Hybrid Prompt Testing - Iteration 2');
    console.log('Building on A/B test insights\n');

    const results = await runAllTests();
    const analysis = analyzeResults(results);

    console.log('\n\n' + '═'.repeat(70));
    console.log('📊 RESULTS vs BASELINE (88%)');
    console.log('═'.repeat(70));

    console.log('\n🏆 RANKING:');
    analysis.ranking.forEach((r, i) => {
        const delta = ((r.avgOverall - 0.88) * 100).toFixed(1);
        const indicator = delta > 0 ? '📈' : delta < 0 ? '📉' : '➡️';
        console.log(`   #${i+1} ${r.name}: ${(r.avgOverall * 100).toFixed(0)}% ${indicator} ${delta > 0 ? '+' : ''}${delta}%`);
    });

    console.log('\n📈 IMPROVEMENTS vs BASELINE:');
    for (const imp of analysis.baselineComparison.improvements) {
        const indicator = imp.improved ? '✅' : '❌';
        console.log(`   ${indicator} ${imp.technique}: ${imp.delta > 0 ? '+' : ''}${imp.deltaStr}%`);
    }

    const html = generateDashboard(results, analysis);
    writeFileSync(join(OUTPUT_DIR, 'hybrid-test-dashboard.html'), html);
    writeFileSync(join(OUTPUT_DIR, 'all-results.json'), JSON.stringify({ results, analysis }, null, 2));

    console.log(`\n✅ Results saved to:`);
    console.log(`   ${join(OUTPUT_DIR, 'hybrid-test-dashboard.html')}`);
}

main().catch(console.error);
