# AI Prompt Adaptation Plan for Translated Nodes
**Date:** 2025-11-19
**Purpose:** Design AI prompt system that intelligently handles pattern-switched nodes
**Version:** 1.0

---

## Table of Contents
1. [Overview](#overview)
2. [Current AI Prompt System](#current-ai-prompt-system)
3. [Problems with Translated Nodes](#problems-with-translated-nodes)
4. [Proposed Solution](#proposed-solution)
5. [Implementation Details](#implementation-details)
6. [Translation-Aware Prompts](#translation-aware-prompts)
7. [Context Enhancement Strategies](#context-enhancement-strategies)
8. [Code Changes](#code-changes)
9. [Testing Strategy](#testing-strategy)

---

## Overview

### The Challenge

When a node is translated from one pattern to another (e.g., Generic → Philosophy), the AI must:
1. Understand the node's translation history
2. Work with potentially incomplete or auto-generated fields
3. Provide suggestions that respect the original context
4. Fill in gaps intelligently based on available data

### The Goal

AI prompts should be **translation-aware** and provide higher-quality suggestions by:
- Detecting when a node was translated
- Including original pattern context
- Adapting suggestions based on translation quality
- Explicitly instructing AI how to handle missing fields

---

## Current AI Prompt System

### Existing buildPatternExpertPrompt() Function

**Location:** treeplexity.html line 9397-9422

```javascript
function buildPatternExpertPrompt(pattern, treeContext, node) {
    let prompt = '';

    // CURRENT: Pattern-specific prompts assume native pattern
    if (pattern === 'philosophy') {
        prompt += `Speaker: ${node.speaker}\n`;
        prompt += `Premise 1: ${node.premise1}\n`;
        prompt += `Premise 2: ${node.premise2}\n`;
    }

    // PROBLEM: If node was translated from Generic pattern,
    // node.speaker and node.premise1 are likely auto-generated or empty!

    return prompt;
}
```

**Current Behavior:**
- Assumes all fields are user-authored
- No awareness of translation history
- Missing fields result in empty prompts
- AI gets incomplete context

---

## Problems with Translated Nodes

### Problem 1: Missing Context

**Scenario:**
```javascript
// Original Generic node:
{
    name: 'Secure Funding',
    description: 'Obtain $5M Series A from VCs',
    patternData: {
        generic: {
            cost: 5000000,
            leadTime: '6-9 months'
        }
    }
}

// After translation to Philosophy:
{
    name: 'Secure Funding',
    description: 'Obtain $5M Series A from VCs',
    patternData: {
        generic: { cost: 5000000, leadTime: '6-9 months' },
        philosophy: {
            speaker: '',  // EMPTY!
            premise1: 'Obtain $5M Series A from VCs',  // Auto-generated from description
            premise2: '',  // EMPTY!
            conclusion: ''  // EMPTY!
        }
    }
}
```

**Current AI Prompt (BAD):**
```
Speaker: [empty]
Premise 1: Obtain $5M Series A from VCs
Premise 2: [empty]
Conclusion: [empty]
```

**AI Response:**
"I don't have enough context to provide a meaningful philosophical analysis. Please provide the speaker and premises."

**Result:** ❌ AI refuses to help or provides generic answer

---

### Problem 2: Auto-Generated Fields Not Marked

**Scenario:**
```javascript
// After translation, some fields are auto-generated:
{
    philosophy: {
        speaker: '',  // USER LEFT EMPTY
        premise1: 'Obtain $5M Series A from VCs',  // AUTO-GENERATED
        argumentType: 'Inductive',  // AUTO-GENERATED
        validity: 'Uncertain'  // AUTO-GENERATED
    }
}
```

**Current AI Prompt:**
```
Speaker: [empty]
Premise 1: Obtain $5M Series A from VCs
Argument Type: Inductive
Validity: Uncertain
```

**AI Response:**
AI treats `premise1` as if user wrote it, when actually it was auto-generated from `description`.

**Result:** ⚠️ AI doesn't know which fields to trust vs which need improvement

---

### Problem 3: Lost Original Context

**Scenario:**
```javascript
// Original Generic node had rich context:
{
    generic: {
        cost: 5000000,
        leadTime: '6-9 months',
        alternateSource: 'Angel investors or debt financing',
        dependencies: ['Complete pitch deck', 'Financial projections']
    }
}

// Philosophy translation doesn't capture this:
{
    philosophy: {
        premise1: 'Obtain $5M Series A from VCs',
        premise2: '',
        conclusion: ''
    }
}
```

**Current AI Prompt:**
AI only sees philosophy fields, misses ALL the rich Generic context (cost, dependencies, alternate sources).

**Result:** ❌ AI suggestions are shallow because it doesn't see full picture

---

## Proposed Solution

### Three-Tier Prompt System

```
┌─────────────────────────────────────────────────────────────┐
│               TIER 1: TRANSLATION CONTEXT                   │
│        (Is this a translated node? From where?)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           TIER 2: ORIGINAL PATTERN CONTEXT                  │
│         (What was the original data? Rich context)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         TIER 3: CURRENT PATTERN EXPERT PROMPT               │
│    (Pattern-specific fields + adaptation instructions)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### New buildPatternExpertPrompt() Architecture

```javascript
function buildPatternExpertPrompt(pattern, treeContext, node) {
    let prompt = '';

    // ════════════════════════════════════════════════════════════
    // TIER 1: TRANSLATION CONTEXT
    // ════════════════════════════════════════════════════════════
    const isTranslated = node.originalPattern !== pattern;

    if (isTranslated) {
        prompt += addTranslationContext(node, pattern);
    }

    // ════════════════════════════════════════════════════════════
    // TIER 2: ORIGINAL PATTERN CONTEXT (if translated)
    // ════════════════════════════════════════════════════════════
    if (isTranslated) {
        prompt += addOriginalPatternContext(node, pattern);
    }

    // ════════════════════════════════════════════════════════════
    // TIER 3: CURRENT PATTERN EXPERT PROMPT
    // ════════════════════════════════════════════════════════════
    prompt += buildPatternSpecificPrompt(pattern, node, isTranslated);

    // ════════════════════════════════════════════════════════════
    // TIER 4: ADAPTATION INSTRUCTIONS (if translated)
    // ════════════════════════════════════════════════════════════
    if (isTranslated) {
        prompt += addAdaptationInstructions(node, pattern);
    }

    return prompt;
}
```

---

## Translation-Aware Prompts

### Tier 1: Translation Context

```javascript
function addTranslationContext(node, currentPattern) {
    const originalPatternName = PATTERNS[node.originalPattern].name;
    const currentPatternName = PATTERNS[currentPattern].name;

    // Get translation quality score from history
    const translationEntry = node.patternHistory.find(
        entry => entry.pattern === currentPattern && entry.action === 'switched'
    );
    const preservationScore = translationEntry?.preservationScore || 0;

    let prompt = `⚠️ TRANSLATION CONTEXT:\n`;
    prompt += `This node was originally created as a ${originalPatternName} item.\n`;
    prompt += `It was then translated to ${currentPatternName}.\n`;
    prompt += `Translation Quality: ${preservationScore}% of original data preserved.\n`;

    if (preservationScore < 70) {
        prompt += `⚠️ WARNING: Low preservation score (<70%). Many fields may be auto-generated or incomplete.\n`;
    }

    prompt += `\n`;
    prompt += `📋 YOUR TASK: Provide suggestions that respect the original ${originalPatternName} context while working within the ${currentPatternName} framework.\n`;
    prompt += `\n`;

    return prompt;
}
```

---

### Tier 2: Original Pattern Context

```javascript
function addOriginalPatternContext(node, currentPattern) {
    const originalPattern = node.originalPattern;
    const originalData = node.patternData[originalPattern];

    let prompt = `📦 ORIGINAL CONTEXT (${PATTERNS[originalPattern].name}):\n`;

    // Always include name and description
    prompt += `Name: ${node.name}\n`;
    prompt += `Description: ${node.description}\n`;

    // Include original pattern fields
    if (originalPattern === 'generic') {
        if (originalData.cost) {
            prompt += `Original Cost: $${originalData.cost.toLocaleString()}\n`;
        }
        if (originalData.leadTime) {
            prompt += `Original Lead Time: ${originalData.leadTime}\n`;
        }
        if (originalData.alternateSource) {
            prompt += `Alternate Source: ${originalData.alternateSource}\n`;
        }
    } else if (originalPattern === 'sales') {
        if (originalData.dealValue) {
            prompt += `Original Deal Value: $${originalData.dealValue.toLocaleString()}\n`;
        }
        if (originalData.stageProbability) {
            prompt += `Close Probability: ${originalData.stageProbability}%\n`;
        }
        if (originalData.contactPerson) {
            prompt += `Contact Person: ${originalData.contactPerson}\n`;
        }
        if (originalData.competitorInfo) {
            prompt += `Competitor Context: ${originalData.competitorInfo}\n`;
        }
    }
    // ... more patterns

    // Include common fields
    if (node.commonFields.monetaryValue) {
        prompt += `Financial Value: $${node.commonFields.monetaryValue.toLocaleString()}\n`;
    }
    if (node.commonFields.timeEstimate) {
        prompt += `Time Estimate: ${node.commonFields.timeEstimate}\n`;
    }
    if (node.commonFields.riskLevel) {
        prompt += `Risk Level: ${node.commonFields.riskLevel}\n`;
    }

    prompt += `\n`;
    return prompt;
}
```

---

### Tier 3: Pattern-Specific Prompt with Field Awareness

```javascript
function buildPatternSpecificPrompt(pattern, node, isTranslated) {
    let prompt = `🎯 CURRENT VIEW (${PATTERNS[pattern].name}):\n`;

    const currentData = node.patternData[pattern];

    if (pattern === 'philosophy') {
        // Mark auto-generated vs user-authored fields
        const speakerSource = isFieldAutoGenerated(node, 'speaker') ? '[auto]' : '';
        const premise1Source = isFieldAutoGenerated(node, 'premise1') ? '[auto]' : '';

        prompt += `Speaker: ${currentData.speaker || '[Not specified]'} ${speakerSource}\n`;
        prompt += `Argument Type: ${currentData.argumentType || 'Unknown'}\n`;
        prompt += `Premise 1: ${currentData.premise1 || '[Empty]'} ${premise1Source}\n`;
        prompt += `Premise 2: ${currentData.premise2 || '[Empty]'}\n`;
        prompt += `Conclusion: ${currentData.conclusion || '[Empty]'}\n`;

        if (currentData.objection) {
            prompt += `Objection: ${currentData.objection}\n`;
        }

        if (isTranslated) {
            prompt += `\n`;
            prompt += `📝 NOTE: Fields marked [auto] were auto-generated during translation and may need refinement.\n`;
        }
    } else if (pattern === 'film') {
        prompt += `Video Prompt: ${currentData.videoPrompt || '[Empty]'}\n`;
        prompt += `Visual Style: ${currentData.visualStyle || 'Cinematic'}\n`;
        prompt += `Camera Movement: ${currentData.cameraMovement || 'Static'}\n`;
        prompt += `Lighting Mood: ${currentData.lightingMood || 'Natural'}\n`;

        if (isTranslated) {
            prompt += `\n`;
            prompt += `📝 NOTE: This scene was translated from ${PATTERNS[node.originalPattern].name}. Consider the original narrative context when refining the video prompt.\n`;
        }
    }
    // ... more patterns

    prompt += `\n`;
    return prompt;
}

function isFieldAutoGenerated(node, fieldName) {
    const currentPattern = node.currentViewPattern;

    // Check pattern history to see if this field was auto-generated
    const translationEntry = node.patternHistory.find(
        entry => entry.pattern === currentPattern && entry.action === 'auto-translated'
    );

    if (!translationEntry) return false;

    // If field was in fieldsModified during auto-translation, it's auto-generated
    return translationEntry.fieldsModified?.includes(fieldName);
}
```

---

### Tier 4: Adaptation Instructions

```javascript
function addAdaptationInstructions(node, currentPattern) {
    const originalPattern = node.originalPattern;

    let prompt = `🧠 AI ADAPTATION INSTRUCTIONS:\n`;

    // Generic → Philosophy
    if (originalPattern === 'generic' && currentPattern === 'philosophy') {
        prompt += `This business/project item is being analyzed philosophically.\n`;
        prompt += `✅ DO: Extract logical arguments from business context (cost/benefit → premise/conclusion)\n`;
        prompt += `✅ DO: Identify decision-making frameworks and reasoning patterns\n`;
        prompt += `✅ DO: Suggest philosophical schools relevant to business decisions (Pragmatism, Utilitarianism)\n`;
        prompt += `❌ DON'T: Force academic philosophy terminology where business language is clearer\n`;
        prompt += `❌ DON'T: Lose sight of practical business goals in favor of abstract theory\n`;
    }

    // Sales → Philosophy
    else if (originalPattern === 'sales' && currentPattern === 'philosophy') {
        prompt += `This sales opportunity is being analyzed through a philosophical lens.\n`;
        prompt += `✅ DO: Extract arguments about value, probability, and risk\n`;
        prompt += `✅ DO: Identify persuasion strategies and rhetorical patterns\n`;
        prompt += `✅ DO: Consider ethical implications of sales strategies\n`;
        prompt += `❌ DON'T: Lose the commercial context and stakeholder motivations\n`;
    }

    // Philosophy → Film
    else if (originalPattern === 'philosophy' && currentPattern === 'film') {
        prompt += `This philosophical argument is being adapted for visual storytelling.\n`;
        prompt += `✅ DO: Translate abstract concepts into concrete visual metaphors\n`;
        prompt += `✅ DO: Use camera movement and lighting to convey logical relationships\n`;
        prompt += `✅ DO: Show argument progression through scene composition\n`;
        prompt += `❌ DON'T: Create generic talking-head philosophy videos\n`;
        prompt += `❌ DON'T: Lose the logical structure in favor of pure aesthetics\n`;
    }

    // Generic → Sales
    else if (originalPattern === 'generic' && currentPattern === 'sales') {
        prompt += `This project item is being reframed as a sales opportunity.\n`;
        prompt += `✅ DO: Identify stakeholders who would be interested in this\n`;
        prompt += `✅ DO: Frame costs as deal values and timelines as close dates\n`;
        prompt += `✅ DO: Consider competitive alternatives as competitor info\n`;
        prompt += `❌ DON'T: Lose technical or operational context that matters to buyers\n`;
    }

    // ... more pattern pair adaptations

    // Fallback for unspecified pairs
    else {
        prompt += `You are helping translate between ${PATTERNS[originalPattern].name} and ${PATTERNS[currentPattern].name}.\n`;
        prompt += `✅ DO: Preserve as much original context as possible\n`;
        prompt += `✅ DO: Fill in missing fields intelligently based on available data\n`;
        prompt += `✅ DO: Explain your reasoning when making inferences\n`;
        prompt += `❌ DON'T: Invent facts not supported by the original context\n`;
    }

    prompt += `\n`;
    return prompt;
}
```

---

## Context Enhancement Strategies

### Strategy 1: Sibling Context for Translated Nodes

**Problem:** Translated nodes lose narrative continuity.

**Solution:** Include previous sibling context (already implemented for Film/Book in Build 121, extend to translated nodes).

```javascript
function buildPatternExpertPrompt(pattern, treeContext, node) {
    // ... existing code ...

    // Add sibling continuity for translated nodes
    if (isTranslated && treeContext.siblingItems.length > 0) {
        const lastSibling = treeContext.siblingItems[treeContext.siblingItems.length - 1];

        prompt += `📚 PREVIOUS ITEM CONTEXT:\n`;
        prompt += `Previous: "${lastSibling.name}"\n`;

        if (lastSibling.description) {
            prompt += `Previous Description: ${lastSibling.description.substring(0, 150)}...\n`;
        }

        // If previous sibling was also translated, mention it
        if (lastSibling.originalPattern !== pattern) {
            prompt += `(Previous item was also translated from ${PATTERNS[lastSibling.originalPattern].name})\n`;
        }

        prompt += `\n`;
        prompt += `⚠️ Ensure your suggestion maintains continuity with the previous item.\n`;
        prompt += `\n`;
    }

    return prompt;
}
```

---

### Strategy 2: Parent Context for Translated Nodes

**Problem:** Translated child nodes lose connection to parent's theme.

**Solution:** Include parent node context.

```javascript
function buildPatternExpertPrompt(pattern, treeContext, node) {
    // ... existing code ...

    // Add parent context for translated nodes
    if (isTranslated && node.parentId) {
        const parent = findNodeById(node.parentId);

        if (parent) {
            prompt += `📂 PARENT CONTEXT:\n`;
            prompt += `Parent: "${parent.name}"\n`;

            if (parent.description) {
                prompt += `Parent Description: ${parent.description.substring(0, 150)}...\n`;
            }

            // Show parent's pattern data if different
            if (parent.originalPattern !== node.originalPattern) {
                prompt += `Parent Pattern: ${PATTERNS[parent.originalPattern].name}\n`;
            }

            prompt += `\n`;
            prompt += `⚠️ Ensure your suggestion aligns with the parent's overall theme.\n`;
            prompt += `\n`;
        }
    }

    return prompt;
}
```

---

### Strategy 3: Confidence Scoring for AI Suggestions

**Problem:** AI should indicate confidence when working with incomplete translated data.

**Solution:** Instruct AI to include confidence scores.

```javascript
function addAdaptationInstructions(node, currentPattern) {
    // ... existing code ...

    const translationEntry = node.patternHistory.find(
        entry => entry.pattern === currentPattern && entry.action === 'auto-translated'
    );

    const preservationScore = translationEntry?.preservationScore || 100;

    if (preservationScore < 80) {
        prompt += `\n`;
        prompt += `📊 CONFIDENCE SCORING:\n`;
        prompt += `Since this node has a ${preservationScore}% preservation score, please include a confidence rating (1-10) for your suggestion.\n`;
        prompt += `Lower confidence (1-4): Based mostly on inference from limited data\n`;
        prompt += `Medium confidence (5-7): Based on clear original context with some gaps\n`;
        prompt += `High confidence (8-10): Strong original context supports suggestion\n`;
        prompt += `\n`;
        prompt += `Format: End your response with "Confidence: [1-10]"\n`;
    }

    return prompt;
}
```

---

## Code Changes

### Location 1: buildPatternExpertPrompt() Function

**File:** treeplexity.html
**Line:** ~9397

**Current:**
```javascript
function buildPatternExpertPrompt(pattern, treeContext, node) {
    let prompt = '';

    if (pattern === 'philosophy') {
        prompt += `Speaker: ${node.speaker}\n`;
        prompt += `Premise 1: ${node.premise1}\n`;
    }

    return prompt;
}
```

**New:**
```javascript
function buildPatternExpertPrompt(pattern, treeContext, node) {
    let prompt = '';

    // Check if node was translated
    const isTranslated = node.originalPattern && node.originalPattern !== pattern;

    // TIER 1: Translation Context
    if (isTranslated) {
        prompt += addTranslationContext(node, pattern);
    }

    // TIER 2: Original Pattern Context
    if (isTranslated) {
        prompt += addOriginalPatternContext(node, pattern);
    }

    // TIER 3: Current Pattern Expert Prompt
    prompt += buildPatternSpecificPrompt(pattern, node, isTranslated, treeContext);

    // TIER 4: Adaptation Instructions
    if (isTranslated) {
        prompt += addAdaptationInstructions(node, pattern);
    }

    return prompt;
}

// ... implementation of helper functions ...
```

---

### Location 2: Smart Suggest API Call

**File:** treeplexity.html
**Line:** ~9500 (improvePromptWithAI function)

**Current:**
```javascript
async function improvePromptWithAI(userInput, pattern, treeContext, node) {
    const systemPrompt = buildPatternExpertPrompt(pattern, treeContext, node);
    // ... API call ...
}
```

**Enhancement:**
```javascript
async function improvePromptWithAI(userInput, pattern, treeContext, node) {
    const systemPrompt = buildPatternExpertPrompt(pattern, treeContext, node);

    // Log translation-aware prompt for debugging
    if (node.originalPattern && node.originalPattern !== pattern) {
        console.log(`[Translation-Aware AI] Prompting ${pattern} expert with ${node.originalPattern} context`);
        console.log('Preservation Score:', getPreservationScore(node, pattern));
    }

    // ... API call ...

    // Parse confidence score from response (if present)
    const confidenceMatch = response.match(/Confidence: (\d+)/i);
    if (confidenceMatch) {
        const confidence = parseInt(confidenceMatch[1]);
        console.log(`[AI Confidence] ${confidence}/10 for translated node`);

        // Optionally: Store confidence score in node metadata
        if (!node.metadata) node.metadata = {};
        node.metadata.lastAIConfidence = confidence;
    }

    return response;
}

function getPreservationScore(node, pattern) {
    const entry = node.patternHistory?.find(
        e => e.pattern === pattern && e.preservationScore !== undefined
    );
    return entry?.preservationScore || 100;
}
```

---

## Testing Strategy

### Test Case 1: Generic → Philosophy Translation

**Setup:**
```javascript
const testNode = {
    name: 'Secure Series A Funding',
    description: 'Raise $5M from VCs to fuel expansion',
    originalPattern: 'generic',
    currentViewPattern: 'philosophy',
    patternData: {
        generic: {
            cost: 5000000,
            leadTime: '6-9 months',
            alternateSource: 'Angel investors or debt'
        },
        philosophy: {
            speaker: '',
            premise1: 'Raise $5M from VCs to fuel expansion',
            premise2: 'Investment: $5,000,000 over 6-9 months',
            conclusion: '',
            argumentType: 'Inductive',
            validity: 'Uncertain'
        }
    },
    patternHistory: [
        { timestamp: 1700000000, pattern: 'generic', action: 'created' },
        { timestamp: 1700010000, pattern: 'philosophy', action: 'switched', preservationScore: 67 }
    ]
};
```

**Expected AI Prompt:**
```
⚠️ TRANSLATION CONTEXT:
This node was originally created as a Generic Project item.
It was then translated to Philosophy.
Translation Quality: 67% of original data preserved.
⚠️ WARNING: Low preservation score (<70%). Many fields may be auto-generated or incomplete.

📋 YOUR TASK: Provide suggestions that respect the original Generic Project context while working within the Philosophy framework.

📦 ORIGINAL CONTEXT (Generic Project):
Name: Secure Series A Funding
Description: Raise $5M from VCs to fuel expansion
Original Cost: $5,000,000
Original Lead Time: 6-9 months
Alternate Source: Angel investors or debt

🎯 CURRENT VIEW (Philosophy):
Speaker: [Not specified] [auto]
Argument Type: Inductive
Premise 1: Raise $5M from VCs to fuel expansion [auto]
Premise 2: Investment: $5,000,000 over 6-9 months
Conclusion: [Empty]

📝 NOTE: Fields marked [auto] were auto-generated during translation and may need refinement.

🧠 AI ADAPTATION INSTRUCTIONS:
This business/project item is being analyzed philosophically.
✅ DO: Extract logical arguments from business context (cost/benefit → premise/conclusion)
✅ DO: Identify decision-making frameworks and reasoning patterns
✅ DO: Suggest philosophical schools relevant to business decisions (Pragmatism, Utilitarianism)
❌ DON'T: Force academic philosophy terminology where business language is clearer
❌ DON'T: Lose sight of practical business goals in favor of abstract theory

📊 CONFIDENCE SCORING:
Since this node has a 67% preservation score, please include a confidence rating (1-10) for your suggestion.
```

**Expected AI Response:**
```
Given the business context, here's a philosophical framing:

Speaker: Entrepreneur/CEO
Argument Type: Pragmatic-Utilitarian
Premise 1: The company requires $5M in capital to achieve expansion goals
Premise 2: VC funding offers the highest probability of success (vs. alternative sources)
Conclusion: Securing Series A funding is the optimal strategic decision

Philosophical Analysis:
This argument follows pragmatist principles - judging the decision by its practical outcomes. The consideration of alternatives (angel investors, debt) shows Bayesian decision-making under uncertainty.

Confidence: 7/10
(High context from original business data, but philosophical framing is interpretive)
```

---

### Test Case 2: Philosophy → Film Translation

**Setup:**
```javascript
const testNode = {
    name: 'The Cave's Opening',
    description: 'Prisoner breaks chains and turns toward the fire',
    originalPattern: 'philosophy',
    currentViewPattern: 'film',
    patternData: {
        philosophy: {
            speaker: 'Plato',
            premise1: 'The prisoner has only known shadows on the wall',
            premise2: 'Breaking free causes pain and confusion',
            conclusion: 'Initial freedom is disorienting but necessary',
            argumentType: 'Dialectical'
        },
        film: {
            videoPrompt: '',  // User wants AI to generate this
            visualStyle: 'Cinematic',
            cameraMovement: 'Crane Up',
            lightingMood: 'Dramatic'
        }
    },
    patternHistory: [
        { timestamp: 1700000000, pattern: 'philosophy', action: 'created' },
        { timestamp: 1700010000, pattern: 'film', action: 'switched', preservationScore: 62 }
    ]
};
```

**User Request:** "Create a video prompt for this scene"

**Expected AI Prompt Includes:**
```
📦 ORIGINAL CONTEXT (Philosophy):
Name: The Cave's Opening
Description: Prisoner breaks chains and turns toward the fire
Speaker: Plato
Premise 1: The prisoner has only known shadows on the wall
Premise 2: Breaking free causes pain and confusion
Conclusion: Initial freedom is disorienting but necessary
Argument Type: Dialectical

🧠 AI ADAPTATION INSTRUCTIONS:
This philosophical argument is being adapted for visual storytelling.
✅ DO: Translate abstract concepts into concrete visual metaphors
✅ DO: Use camera movement and lighting to convey logical relationships
✅ DO: Show argument progression through scene composition
❌ DON'T: Create generic talking-head philosophy videos
❌ DON'T: Lose the logical structure in favor of pure aesthetics
```

**Expected AI Response:**
```
Video Prompt:
"Dark underground cave interior. Shirtless male prisoner (30s) sits chained to stone wall, facing away from flickering fire behind him. Only shadows visible on rough cave wall ahead. Sudden determination crosses his face. He strains against iron chains - they crack and fall. Slowly, painfully, he turns toward the fire for the first time. Blinding orange light floods his face, eyes squinting in pain and confusion. Camera cranes up as he rises to standing, silhouetted against flames. Dramatic chiaroscuro lighting emphasizes the contrast between shadow-knowledge and fire-truth. Cinematic, mythological atmosphere. 4K, photorealistic."

Visual-Philosophical Mapping:
- Chains breaking = Breaking free from false beliefs (Premise 2: "causes pain")
- Turning toward fire = Seeking truth despite discomfort
- Squinting, confusion = Initial freedom is disorienting (Conclusion)
- Camera crane up = Elevation from ignorance to enlightenment

Confidence: 9/10
(Strong philosophical source material translates well to visual metaphor)
```

---

### Test Case 3: Low Preservation Score (Fitness → Philosophy) ❌

**Setup:**
```javascript
const testNode = {
    name: 'Barbell Squat',
    description: 'Compound leg exercise',
    originalPattern: 'fitness',
    currentViewPattern: 'philosophy',
    patternData: {
        fitness: {
            sets: 5,
            reps: '5',
            equipment: 'Barbell, Squat Rack'
        },
        philosophy: {
            speaker: '',
            premise1: 'Compound leg exercise',  // Meaningless
            premise2: '',
            conclusion: ''
        }
    },
    patternHistory: [
        { timestamp: 1700000000, pattern: 'fitness', action: 'created' },
        { timestamp: 1700010000, pattern: 'philosophy', action: 'switched', preservationScore: 12 }
    ]
};
```

**Expected AI Prompt Includes:**
```
⚠️ TRANSLATION CONTEXT:
This node was originally created as a Fitness Program item.
It was then translated to Philosophy.
Translation Quality: 12% of original data preserved.
⚠️ WARNING: Low preservation score (<70%). Many fields may be auto-generated or incomplete.

📊 CONFIDENCE SCORING:
Since this node has a 12% preservation score, please include a confidence rating (1-10) for your suggestion.
```

**Expected AI Response:**
```
⚠️ WARNING: This translation has a very low semantic match between Fitness and Philosophy patterns.

The original fitness data (barbell squats, sets, reps) does not naturally map to philosophical argument structures. Any philosophical framing would be highly speculative.

Possible philosophical angle (low confidence):
If you're exploring philosophy of embodiment or phenomenology of physical training, I could frame this as:

Speaker: Athlete/Philosopher
Premise 1: Physical training develops both body and mind
Premise 2: Compound exercises like squats require mental focus and discipline
Conclusion: Physical practice is a form of philosophical inquiry into embodiment

However, this is a significant reinterpretation of the original fitness context.

Confidence: 2/10
(Very low - this is more creative interpretation than faithful translation)

RECOMMENDATION: Consider switching back to Fitness pattern or creating a new Philosophy node instead of forcing this translation.
```

---

## Conclusion

### Summary of Changes

1. ✅ **Translation Detection** - AI knows when node was translated
2. ✅ **Original Context Inclusion** - AI sees full original pattern data
3. ✅ **Field Source Marking** - AI knows which fields are auto-generated
4. ✅ **Pattern-Pair Adaptation** - AI gets specific instructions per translation pair
5. ✅ **Confidence Scoring** - AI reports certainty level for translated nodes
6. ✅ **Low-Preservation Warnings** - AI warns when translation quality is poor

### Implementation Checklist

- [ ] Update `buildPatternExpertPrompt()` with 4-tier architecture
- [ ] Implement `addTranslationContext()` helper
- [ ] Implement `addOriginalPatternContext()` helper
- [ ] Implement `addAdaptationInstructions()` with all pattern pairs
- [ ] Implement `isFieldAutoGenerated()` helper
- [ ] Update `improvePromptWithAI()` to parse confidence scores
- [ ] Add console logging for translation-aware prompts
- [ ] Write unit tests for all pattern pair translations
- [ ] User testing with translated nodes

### Success Metrics

✅ AI provides useful suggestions even with <70% preservation scores
✅ AI explicitly mentions when fields are auto-generated
✅ AI adapts tone/style based on pattern pair (business → philosophy, philosophy → film)
✅ Confidence scores correlate with translation quality (r > 0.7)
✅ Users report improved Smart Suggest quality for translated nodes

---

**Document Status:** ✅ Complete - Ready for Implementation

**Next Step:** Begin implementing translation-aware prompt system (Est. 1-2 weeks)
