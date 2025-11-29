/**
 * Meta-Prompt A/B Testing Framework
 *
 * Tests different prompting techniques for philosophical analysis:
 * 1. BASELINE - Current production prompt
 * 2. SOCRATIC - 10 classical Socratic principles
 * 3. CHAIN_OF_REASONING - Hypothesis-driven inquiry with iterative refinement
 * 4. TREE_OF_THOUGHTS - Multiple reasoning paths with self-evaluation
 * 5. METACOGNITIVE - 5-stage process with confidence evaluation
 * 6. MULTI_PERSONA - Multiple philosophical roles cross-examining
 *
 * Tracks all 12 sub-metrics across 3 tiers to find improvement trends.
 */

import { config } from 'dotenv';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '..', '.env') });

import { menoExcerptText } from '../fixtures/meno-excerpt.js';
import { descartesExcerptText } from '../fixtures/descartes-excerpt.js';

const OUTPUT_DIR = join(__dirname, '..', '..', 'test-results', 'metaprompt-ab');

// ============================================================================
// PHILOSOPHICAL CONTEXT (Ground Truth for Evaluation)
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

// ============================================================================
// META-PROMPTING TECHNIQUES
// ============================================================================

const PROMPT_TECHNIQUES = {
    // Current baseline prompt
    BASELINE: {
        name: 'Baseline (Current)',
        description: 'Current production philosophy prompt with 3-tier depth instructions',
        buildPrompt: (text) => `You are a professor of philosophy with expertise in argument reconstruction, history of philosophy, and textual analysis.

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

Remember: Capture PHILOSOPHICAL DEPTH, not just surface structure. Include implicit premises, situate historically, note standard objections.`
    },

    // Socratic prompting with 10 classical principles
    SOCRATIC: {
        name: 'Socratic Prompting',
        description: '10 classical Socratic principles: Definition, Elenchus, Dialectic, Maieutics, Aporia, Irony, Induction, Generalization, Hypothesis, Counterexample',
        buildPrompt: (text) => `You are engaging in SOCRATIC INQUIRY on this philosophical text. Apply these 10 classical Socratic principles:

## SOCRATIC METHODOLOGY

1. **DEFINITION (ti esti)**: For each key concept, ask "What IS it?" Seek essential definitions, not mere examples.

2. **ELENCHUS (refutation)**: Test each claim by finding counterexamples. If someone says "virtue is X", find cases where X exists without virtue or virtue without X.

3. **DIALECTIC**: Engage the text as a dialogue. What question prompts each claim? What would an interlocutor object?

4. **MAIEUTICS (midwifery)**: Help the argument "give birth" to its own conclusions. What implications are implicit in the premises?

5. **APORIA (puzzlement)**: Identify where the argument reaches an impasse. What tensions remain unresolved?

6. **IRONY**: Consider what the author might be concealing or understating. Is there deeper meaning beneath the surface?

7. **INDUCTION (epagoge)**: How does the author move from particular examples to general claims? Is this warranted?

8. **GENERALIZATION**: Test universal claims. Do they hold in all cases, or are qualifications needed?

9. **HYPOTHESIS**: What assumptions is the argument resting on? Make these explicit.

10. **COUNTEREXAMPLE**: For each major claim, provide the strongest counterexample. How might the author respond?

## YOUR TASK

Using these Socratic principles, reconstruct the philosophical argument as a structured tree.

For each movement in the argument:
- Begin with the QUESTION being investigated (ti esti)
- Identify PREMISES (explicit and IMPLICIT/hypothetical)
- Apply ELENCHUS: note counterexamples and refutations
- Show DIALECTICAL structure: claim → objection → response
- Mark points of APORIA (unresolved puzzlement)
- Note the TRADITION and INTERLOCUTORS
- Reference SECONDARY SOURCES who have addressed these issues
- Identify STANDARD OBJECTIONS from the philosophical literature

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
      "subtitle": "<Socratic question driving this phase>",
      "argumentForm": "<logical pattern>",
      "items": [
        {
          "id": "item-0-0",
          "name": "<Claim>",
          "type": "item",
          "itemType": "question|premise|implicit-premise|definition|refutation|objection|conclusion",
          "description": "<Full description>",
          "socraticPrinciple": "<which of the 10 principles applies>",
          "subItems": []
        }
      ]
    }
  ]
}

## TEXT TO ANALYZE:
${text}`
    },

    // Chain-of-Reasoning with hypothesis testing
    CHAIN_OF_REASONING: {
        name: 'Chain-of-Reasoning (CoR)',
        description: 'Hypothesis-driven inquiry with iterative refinement and explicit reasoning chains',
        buildPrompt: (text) => `You are a philosophical analyst using CHAIN-OF-REASONING methodology.

## CHAIN-OF-REASONING PROTOCOL

Work through this text using explicit reasoning chains. For each step:

### STEP 1: INITIAL HYPOTHESIS
After reading, form an initial hypothesis about the text's main argument:
- "I hypothesize that this text argues [X] because [Y]"
- State your confidence level (high/medium/low)

### STEP 2: EVIDENCE GATHERING
List all evidence from the text that:
- SUPPORTS your hypothesis
- CHALLENGES your hypothesis
- Remains AMBIGUOUS

### STEP 3: REASONING CHAIN
Build the argument step by step:
- "Given [premise 1], and [premise 2], it follows that [intermediate conclusion]"
- "This intermediate conclusion, combined with [premise 3], leads to [further conclusion]"
- Make each inferential step EXPLICIT

### STEP 4: HYPOTHESIS REFINEMENT
Based on the evidence, refine your hypothesis:
- "I now refine my hypothesis to [X'] because [new consideration]"
- Note what changed and why

### STEP 5: CONTEXTUALIZATION
Situate your refined understanding:
- Which philosophical TRADITION does this belong to?
- What INTERLOCUTORS is the author responding to?
- What SECONDARY SOURCES have addressed this?

### STEP 6: CRITICAL EVALUATION
Apply critical scrutiny:
- What are the STANDARD OBJECTIONS?
- What IMPLICIT PREMISES are required?
- What remains UNRESOLVED?

## OUTPUT FORMAT
Return your analysis as a structured tree in valid JSON:

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
    "standardObjections": ["<objection name>"],
    "initialHypothesis": "<your initial reading>",
    "refinedHypothesis": "<your refined understanding>"
  },
  "hyperedges": [],
  "children": [
    {
      "id": "movement-0",
      "name": "<Movement name>",
      "type": "phase",
      "phase": 0,
      "subtitle": "<Brief description>",
      "reasoningChain": "<explicit chain: A → B → C>",
      "items": [
        {
          "id": "item-0-0",
          "name": "<Claim>",
          "type": "item",
          "itemType": "premise|implicit-premise|definition|refutation|objection|conclusion",
          "description": "<Full description>",
          "evidenceType": "supporting|challenging|ambiguous",
          "confidence": "high|medium|low",
          "subItems": []
        }
      ]
    }
  ]
}

## TEXT TO ANALYZE:
${text}`
    },

    // Tree of Thoughts with self-evaluation
    TREE_OF_THOUGHTS: {
        name: 'Tree of Thoughts (ToT)',
        description: 'Multiple reasoning paths with self-evaluation and path selection',
        buildPrompt: (text) => `You are analyzing this philosophical text using TREE OF THOUGHTS methodology.

## TREE OF THOUGHTS PROTOCOL

Generate MULTIPLE possible interpretations, evaluate each, and select the best path.

### PHASE 1: BRANCH GENERATION
Generate 3 different possible readings of this text's main argument:

**Branch A**: [Conservative/Traditional Reading]
- How would a mainstream scholar in this tradition interpret this?

**Branch B**: [Critical/Revisionist Reading]
- What alternative interpretation challenges the standard view?

**Branch C**: [Synthetic Reading]
- Can elements from A and B be integrated into a richer interpretation?

### PHASE 2: PATH EVALUATION
For each branch, evaluate:
- TEXTUAL SUPPORT: How much evidence from the text supports this reading? (1-10)
- COHERENCE: Does this reading make the argument internally consistent? (1-10)
- SCHOLARLY CONSENSUS: How does this align with secondary literature? (1-10)
- PHILOSOPHICAL DEPTH: Does this reading capture philosophical nuance? (1-10)

### PHASE 3: PATH SELECTION
Based on evaluation, select the BEST PATH forward.
Explain: "I select Branch [X] because [reasons], though Branch [Y] has merit in [respects]"

### PHASE 4: DEEP ANALYSIS
Using the selected interpretation, construct a full analysis:
- ARGUMENT STRUCTURE: Premises, conclusions, inferential links
- CONTEXTUALIZATION: Tradition, method, interlocutors
- CRITICAL APPARATUS: Objections, sources, open questions

## OUTPUT FORMAT
Return valid JSON:

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
    "standardObjections": ["<objection name>"],
    "branchesConsidered": [
      { "name": "Branch A", "description": "<brief>", "score": <total 1-40> },
      { "name": "Branch B", "description": "<brief>", "score": <total 1-40> },
      { "name": "Branch C", "description": "<brief>", "score": <total 1-40> }
    ],
    "selectedBranch": "<A/B/C>",
    "selectionRationale": "<why this branch was chosen>"
  },
  "hyperedges": [],
  "children": [
    {
      "id": "movement-0",
      "name": "<Movement name>",
      "type": "phase",
      "phase": 0,
      "subtitle": "<Brief description>",
      "items": [
        {
          "id": "item-0-0",
          "name": "<Claim>",
          "type": "item",
          "itemType": "premise|implicit-premise|definition|refutation|objection|conclusion",
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

    // Metacognitive prompting with 5 stages
    METACOGNITIVE: {
        name: 'Metacognitive Prompting',
        description: '5-stage metacognitive process: Understand → Decompose → Execute → Monitor → Evaluate',
        buildPrompt: (text) => `You are a philosophical analyst using METACOGNITIVE PROMPTING methodology.

## METACOGNITIVE 5-STAGE PROCESS

### STAGE 1: UNDERSTANDING
Before analyzing, articulate what you need to do:
- What is the GOAL of this analysis?
- What makes philosophical analysis DIFFERENT from mere summarization?
- What CRITERIA distinguish a deep analysis from a shallow one?

Self-check: "I understand that I need to..."

### STAGE 2: DECOMPOSITION
Break the task into sub-tasks:
1. Identify the MAIN ARGUMENT (conclusion + key premises)
2. Trace INFERENTIAL STRUCTURE (how claims connect)
3. Locate in PHILOSOPHICAL TRADITION
4. Identify IMPLICIT PREMISES
5. Note STANDARD OBJECTIONS
6. Reference SECONDARY LITERATURE

Self-check: "My sub-tasks are clear. The most challenging will be..."

### STAGE 3: EXECUTION
Work through each sub-task methodically:
- For each sub-task, state what you're doing and why
- Make your reasoning EXPLICIT
- Note any DIFFICULTIES or UNCERTAINTIES

Self-check after each: "I am confident/uncertain about this because..."

### STAGE 4: MONITORING
As you work, monitor your progress:
- Am I addressing all three tiers (Argument, Context, Critical)?
- Have I captured IMPLICIT premises or just explicit ones?
- Am I naming specific SECONDARY SOURCES?
- Have I identified STANDARD OBJECTIONS?

Self-check: "I notice I'm missing... I should add..."

### STAGE 5: EVALUATION
Assess your final output:
- Does this analysis demonstrate PHILOSOPHICAL DEPTH?
- Would a philosophy professor find this satisfactory?
- What IMPROVEMENTS could be made?

Self-check: "My analysis is strong in... but could improve in..."

## OUTPUT FORMAT
Return valid JSON:

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
    "standardObjections": ["<objection name>"],
    "metacognitiveReflection": {
      "understanding": "<what I understood the task to be>",
      "challenges": "<most difficult aspects>",
      "strengths": "<what I did well>",
      "improvements": "<what could be better>"
    }
  },
  "hyperedges": [],
  "children": [
    {
      "id": "movement-0",
      "name": "<Movement name>",
      "type": "phase",
      "phase": 0,
      "subtitle": "<Brief description>",
      "items": [
        {
          "id": "item-0-0",
          "name": "<Claim>",
          "type": "item",
          "itemType": "premise|implicit-premise|definition|refutation|objection|conclusion",
          "description": "<Full description>",
          "confidence": "high|medium|low",
          "subItems": []
        }
      ]
    }
  ]
}

## TEXT TO ANALYZE:
${text}`
    },

    // Multi-persona with cross-examination
    MULTI_PERSONA: {
        name: 'Multi-Persona Dialectic',
        description: 'Multiple philosophical roles (Historian, Logician, Critic) cross-examining the text',
        buildPrompt: (text) => `You will analyze this philosophical text by adopting MULTIPLE PERSONAS that cross-examine each other.

## PERSONA DIALECTIC

### PERSONA 1: THE HISTORIAN OF PHILOSOPHY
Your role: Situate the argument in its intellectual context.
- What TRADITION does this belong to?
- Who are the INTERLOCUTORS (predecessors, opponents)?
- What SECONDARY SOURCES are essential for understanding?
- What INFLUENCE did this have on later thought?

Speak: "As a historian, I observe that..."

### PERSONA 2: THE LOGICIAN
Your role: Reconstruct the argument's formal structure.
- What are the PREMISES (explicit and implicit)?
- What is the CONCLUSION?
- What is the ARGUMENT FORM (modus ponens, reductio, etc.)?
- Is the argument VALID? Are there hidden assumptions?

Speak: "As a logician, I note that..."

### PERSONA 3: THE CRITICAL PHILOSOPHER
Your role: Challenge and probe the argument.
- What are the STANDARD OBJECTIONS?
- What are the WEAKEST POINTS?
- What COUNTEREXAMPLES threaten the argument?
- What remains UNRESOLVED?

Speak: "As a critic, I challenge..."

### CROSS-EXAMINATION
Now have the personas DIALOGUE:
- LOGICIAN to HISTORIAN: "You claim this is in [tradition]. Does the argument form support that?"
- CRITIC to LOGICIAN: "You say the argument is valid, but what about [objection]?"
- HISTORIAN to CRITIC: "The objection you raise was addressed by [source]. Here's how..."

### SYNTHESIS
After cross-examination, synthesize the insights from all three perspectives.

## OUTPUT FORMAT
Return valid JSON:

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
    "standardObjections": ["<objection name>"],
    "personaInsights": {
      "historian": "<key insight from historian>",
      "logician": "<key insight from logician>",
      "critic": "<key insight from critic>"
    }
  },
  "hyperedges": [],
  "children": [
    {
      "id": "movement-0",
      "name": "<Movement name>",
      "type": "phase",
      "phase": 0,
      "subtitle": "<Brief description>",
      "items": [
        {
          "id": "item-0-0",
          "name": "<Claim>",
          "type": "item",
          "itemType": "premise|implicit-premise|definition|refutation|objection|conclusion",
          "description": "<Full description>",
          "subItems": []
        }
      ]
    }
  ]
}

## TEXT TO ANALYZE:
${text}`
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
// EVALUATION (Same 3-tier system)
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
  "philosophicalDepthAssessment": "<2-3 sentence overall assessment>"
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
        // Generate tree
        const startTree = Date.now();
        const prompt = technique.buildPrompt(context.text);
        const treeResponse = await callClaude(prompt);
        result.tree = parseJSON(treeResponse.content);
        result.timing.treeListing = Date.now() - startTree;

        // Evaluate
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
    console.log('🧪 Meta-Prompt A/B Testing Framework');
    console.log('═'.repeat(70));
    console.log('Testing 6 prompting techniques across 2 philosophical texts\n');

    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const allResults = [];
    const techniqueNames = Object.keys(PROMPT_TECHNIQUES);
    const textKeys = Object.keys(PHILOSOPHICAL_CONTEXT);

    let testNum = 0;
    const totalTests = techniqueNames.length * textKeys.length;

    for (const techniqueName of techniqueNames) {
        const technique = PROMPT_TECHNIQUES[techniqueName];
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
// ANALYSIS & REPORTING
// ============================================================================

function analyzeResults(results) {
    const analysis = {
        byTechnique: {},
        byText: {},
        byMetric: {
            tier1: { premiseIdentification: [], conclusionClarity: [], inferentialLinks: [], argumentForm: [] },
            tier2: { traditionIdentification: [], keyConceptsAccuracy: [], interlocutorAwareness: [], methodRecognition: [] },
            tier3: { objectionsNoted: [], sourcesReferenced: [], influenceTracked: [], openQuestionsIdentified: [] }
        },
        ranking: [],
        trends: []
    };

    // Aggregate by technique
    for (const r of results) {
        if (!r.success) continue;

        if (!analysis.byTechnique[r.technique]) {
            analysis.byTechnique[r.technique] = {
                name: PROMPT_TECHNIQUES[r.technique].name,
                description: PROMPT_TECHNIQUES[r.technique].description,
                results: [],
                avgOverall: 0,
                avgTier1: 0,
                avgTier2: 0,
                avgTier3: 0
            };
        }
        analysis.byTechnique[r.technique].results.push(r);

        // Aggregate by text
        if (!analysis.byText[r.textKey]) {
            analysis.byText[r.textKey] = { name: r.textName, results: [] };
        }
        analysis.byText[r.textKey].results.push(r);

        // Aggregate metrics
        const e = r.evaluation;
        const t1 = e.tier1_argumentReconstruction || {};
        const t2 = e.tier2_contextualization || {};
        const t3 = e.tier3_criticalApparatus || {};

        analysis.byMetric.tier1.premiseIdentification.push({ technique: r.technique, text: r.textKey, score: t1.premiseIdentification?.score || 0 });
        analysis.byMetric.tier1.conclusionClarity.push({ technique: r.technique, text: r.textKey, score: t1.conclusionClarity?.score || 0 });
        analysis.byMetric.tier1.inferentialLinks.push({ technique: r.technique, text: r.textKey, score: t1.inferentialLinks?.score || 0 });
        analysis.byMetric.tier1.argumentForm.push({ technique: r.technique, text: r.textKey, score: t1.argumentForm?.score || 0 });

        analysis.byMetric.tier2.traditionIdentification.push({ technique: r.technique, text: r.textKey, score: t2.traditionIdentification?.score || 0 });
        analysis.byMetric.tier2.keyConceptsAccuracy.push({ technique: r.technique, text: r.textKey, score: t2.keyConceptsAccuracy?.score || 0 });
        analysis.byMetric.tier2.interlocutorAwareness.push({ technique: r.technique, text: r.textKey, score: t2.interlocutorAwareness?.score || 0 });
        analysis.byMetric.tier2.methodRecognition.push({ technique: r.technique, text: r.textKey, score: t2.methodRecognition?.score || 0 });

        analysis.byMetric.tier3.objectionsNoted.push({ technique: r.technique, text: r.textKey, score: t3.objectionsNoted?.score || 0 });
        analysis.byMetric.tier3.sourcesReferenced.push({ technique: r.technique, text: r.textKey, score: t3.sourcesReferenced?.score || 0 });
        analysis.byMetric.tier3.influenceTracked.push({ technique: r.technique, text: r.textKey, score: t3.influenceTracked?.score || 0 });
        analysis.byMetric.tier3.openQuestionsIdentified.push({ technique: r.technique, text: r.textKey, score: t3.openQuestionsIdentified?.score || 0 });
    }

    // Calculate averages and ranking
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
    }

    // Sort ranking by overall score
    analysis.ranking.sort((a, b) => b.avgOverall - a.avgOverall);

    // Identify trends
    const baseline = analysis.ranking.find(r => r.technique === 'BASELINE');
    if (baseline) {
        for (const r of analysis.ranking) {
            if (r.technique === 'BASELINE') continue;
            const delta = ((r.avgOverall - baseline.avgOverall) * 100).toFixed(1);
            analysis.trends.push({
                technique: r.name,
                deltaVsBaseline: delta,
                tier1Delta: ((r.avgTier1 - baseline.avgTier1) * 100).toFixed(1),
                tier2Delta: ((r.avgTier2 - baseline.avgTier2) * 100).toFixed(1),
                tier3Delta: ((r.avgTier3 - baseline.avgTier3) * 100).toFixed(1),
                assessment: delta > 0 ? '📈 IMPROVEMENT' : delta < 0 ? '📉 REGRESSION' : '➡️ NO CHANGE'
            });
        }
    }

    return analysis;
}

function generateDashboard(results, analysis) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meta-Prompt A/B Test Results</title>
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
            min-height: 100vh;
        }
        .dashboard { max-width: 1600px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header .subtitle { color: var(--text-secondary); }

        .section { margin-bottom: 32px; }
        .section h2 { font-size: 20px; margin-bottom: 16px; color: var(--text-primary); }

        .ranking-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-card);
            border-radius: 12px;
            overflow: hidden;
        }
        .ranking-table th, .ranking-table td {
            padding: 16px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }
        .ranking-table th { background: var(--bg-secondary); color: var(--text-secondary); font-size: 12px; text-transform: uppercase; }
        .ranking-table tr:last-child td { border-bottom: none; }
        .ranking-table .rank { font-weight: 700; font-size: 18px; }
        .ranking-table .score { font-weight: 600; }
        .ranking-table .delta { font-size: 12px; padding: 4px 8px; border-radius: 4px; }
        .delta.positive { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .delta.negative { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .delta.neutral { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }

        .technique-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .technique-card {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid var(--border);
        }
        .technique-card h3 { font-size: 16px; margin-bottom: 8px; }
        .technique-card .desc { color: var(--text-secondary); font-size: 12px; margin-bottom: 16px; }
        .technique-card .scores { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .score-box { text-align: center; padding: 12px; border-radius: 8px; }
        .score-box.t1 { background: rgba(245, 158, 11, 0.15); }
        .score-box.t2 { background: rgba(139, 92, 246, 0.15); }
        .score-box.t3 { background: rgba(6, 182, 212, 0.15); }
        .score-box.overall { background: rgba(16, 185, 129, 0.15); }
        .score-box .label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; }
        .score-box .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
        .score-box.t1 .value { color: var(--tier1); }
        .score-box.t2 .value { color: var(--tier2); }
        .score-box.t3 .value { color: var(--tier3); }
        .score-box.overall .value { color: var(--success); }

        .trend-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .trend-card {
            background: var(--bg-card);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid var(--border);
        }
        .trend-card h4 { font-size: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .trend-card .metric { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
        .trend-card .metric:last-child { border-bottom: none; }
        .trend-card .metric-label { color: var(--text-secondary); font-size: 13px; }
        .trend-card .metric-value { font-weight: 600; }

        .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 12px;
        }

        @media (max-width: 1200px) {
            .technique-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 800px) {
            .technique-grid, .trend-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🧪 Meta-Prompt A/B Test Results</h1>
            <div class="subtitle">Comparing ${Object.keys(PROMPT_TECHNIQUES).length} prompting techniques across ${Object.keys(PHILOSOPHICAL_CONTEXT).length} texts</div>
        </div>

        <div class="section">
            <h2>🏆 Technique Ranking (by Overall Score)</h2>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Technique</th>
                        <th>Overall</th>
                        <th>Tier 1 (Argument)</th>
                        <th>Tier 2 (Context)</th>
                        <th>Tier 3 (Critical)</th>
                        <th>vs Baseline</th>
                    </tr>
                </thead>
                <tbody>
                    ${analysis.ranking.map((r, i) => {
                        const trend = analysis.trends.find(t => t.technique === r.name);
                        const deltaClass = !trend ? 'neutral' : parseFloat(trend.deltaVsBaseline) > 0 ? 'positive' : parseFloat(trend.deltaVsBaseline) < 0 ? 'negative' : 'neutral';
                        const deltaText = !trend ? '—' : `${trend.deltaVsBaseline > 0 ? '+' : ''}${trend.deltaVsBaseline}%`;
                        return `
                        <tr>
                            <td class="rank">#${i + 1}</td>
                            <td><strong>${r.name}</strong></td>
                            <td class="score">${(r.avgOverall * 100).toFixed(0)}%</td>
                            <td>${(r.avgTier1 * 100).toFixed(0)}%</td>
                            <td>${(r.avgTier2 * 100).toFixed(0)}%</td>
                            <td>${(r.avgTier3 * 100).toFixed(0)}%</td>
                            <td><span class="delta ${deltaClass}">${deltaText}</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📊 Technique Details</h2>
            <div class="technique-grid">
                ${Object.entries(analysis.byTechnique).map(([tech, data]) => `
                    <div class="technique-card">
                        <h3>${data.name}</h3>
                        <div class="desc">${data.description}</div>
                        <div class="scores">
                            <div class="score-box t1">
                                <div class="label">Argument</div>
                                <div class="value">${(data.avgTier1 * 100).toFixed(0)}%</div>
                            </div>
                            <div class="score-box t2">
                                <div class="label">Context</div>
                                <div class="value">${(data.avgTier2 * 100).toFixed(0)}%</div>
                            </div>
                            <div class="score-box t3">
                                <div class="label">Critical</div>
                                <div class="value">${(data.avgTier3 * 100).toFixed(0)}%</div>
                            </div>
                            <div class="score-box overall">
                                <div class="label">Overall</div>
                                <div class="value">${(data.avgOverall * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>📈 Improvement Trends vs Baseline</h2>
            <div class="trend-grid">
                ${analysis.trends.map(t => `
                    <div class="trend-card">
                        <h4>${t.assessment} ${t.technique}</h4>
                        <div class="metric">
                            <span class="metric-label">Overall Delta</span>
                            <span class="metric-value" style="color: ${parseFloat(t.deltaVsBaseline) > 0 ? '#10b981' : parseFloat(t.deltaVsBaseline) < 0 ? '#ef4444' : '#8b5cf6'}">${t.deltaVsBaseline > 0 ? '+' : ''}${t.deltaVsBaseline}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Tier 1 (Argument) Delta</span>
                            <span class="metric-value">${t.tier1Delta > 0 ? '+' : ''}${t.tier1Delta}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Tier 2 (Context) Delta</span>
                            <span class="metric-value">${t.tier2Delta > 0 ? '+' : ''}${t.tier2Delta}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Tier 3 (Critical) Delta</span>
                            <span class="metric-value">${t.tier3Delta > 0 ? '+' : ''}${t.tier3Delta}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <div>Treelisty v2.10.0 Build 166 | Meta-Prompt A/B Test</div>
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
    console.log('\n🧪 Meta-Prompt A/B Testing Framework');
    console.log('Testing creative prompting techniques for philosophical analysis\n');

    const results = await runAllTests();
    const analysis = analyzeResults(results);

    console.log('\n\n' + '═'.repeat(70));
    console.log('📊 ANALYSIS & TRENDS');
    console.log('═'.repeat(70));

    console.log('\n🏆 RANKING BY OVERALL SCORE:');
    analysis.ranking.forEach((r, i) => {
        console.log(`   #${i+1} ${r.name}: ${(r.avgOverall * 100).toFixed(0)}%`);
    });

    console.log('\n📈 IMPROVEMENTS VS BASELINE:');
    for (const t of analysis.trends) {
        console.log(`   ${t.assessment} ${t.technique}: ${t.deltaVsBaseline > 0 ? '+' : ''}${t.deltaVsBaseline}%`);
        console.log(`      T1: ${t.tier1Delta}% | T2: ${t.tier2Delta}% | T3: ${t.tier3Delta}%`);
    }

    // Save results
    const html = generateDashboard(results, analysis);
    writeFileSync(join(OUTPUT_DIR, 'ab-test-dashboard.html'), html);
    writeFileSync(join(OUTPUT_DIR, 'all-results.json'), JSON.stringify({ results, analysis }, null, 2));

    console.log(`\n✅ Results saved to:`);
    console.log(`   ${join(OUTPUT_DIR, 'ab-test-dashboard.html')}`);
}

main().catch(console.error);
