# Multi-Lens Storage Architecture
**Date:** 2025-11-19
**Purpose:** Design document for pattern-agnostic node storage enabling Mixture of Experts system
**Version:** 1.0

---

## Table of Contents
1. [Overview](#overview)
2. [Current Architecture Problems](#current-architecture-problems)
3. [Proposed Architecture](#proposed-architecture)
4. [Data Model Specification](#data-model-specification)
5. [Storage Schema](#storage-schema)
6. [Pattern View Layer](#pattern-view-layer)
7. [Translation Engine](#translation-engine)
8. [Code Implementation](#code-implementation)
9. [Migration Strategy](#migration-strategy)
10. [Performance Considerations](#performance-considerations)

---

## Overview

### The Problem
TreeListy currently locks each tree to a single pattern at creation. Users cannot:
- View same project through different pattern lenses
- Switch patterns without losing data
- Apply multiple pattern-specific AI experts to same content

### The Solution
**Multi-Lens Architecture:** Store nodes in pattern-agnostic format with translation layer enabling dynamic pattern switching.

**Key Insight:** Separate *data storage* from *data presentation*. A node should store ALL its information in a universal format, then be *rendered* through any pattern lens.

---

## Current Architecture Problems

### Problem 1: Pattern Lock-In

**Current Code (line 6598):**
```javascript
let currentPattern = 'generic';  // Set once, never changes
```

**Issue:** Once a tree is created with pattern "generic", it's stuck there forever.

---

### Problem 2: Pattern-Specific Field Storage

**Current Node Structure:**
```javascript
const node = {
    id: '123',
    name: 'My Item',
    description: 'Details...',
    type: 'corporate',

    // Generic-specific fields (hard-coded)
    cost: 50000,
    leadTime: '6 months',
    alternateSource: 'Vendor B',

    // No way to store Sales fields unless pattern = 'sales'
    // No way to store Philosophy fields unless pattern = 'philosophy'
};
```

**Issue:** Switching to Sales pattern would lose `cost, leadTime, alternateSource` OR fail to display `dealValue, expectedCloseDate, stageProbability`.

---

### Problem 3: AI Prompts Expect Specific Fields

**Current Code (line 9397-9422):**
```javascript
if (pattern === 'philosophy') {
    prompt += `Speaker: ${node.speaker}\n`;
    prompt += `Premise 1: ${node.premise1}\n`;
}
```

**Issue:** If node was created in Generic pattern, `node.speaker` and `node.premise1` are undefined → AI gets incomplete context.

---

## Proposed Architecture

### Three-Layer Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│              (Pattern-Specific Views)                       │
│                                                             │
│  [Generic View]  [Sales View]  [Philosophy View]  [...]    │
│        ↓              ↓               ↓                     │
└────────┬──────────────┬───────────────┬─────────────────────┘
         │              │               │
         │              │               │
┌────────┴──────────────┴───────────────┴─────────────────────┐
│                    TRANSLATION LAYER                        │
│           (Pattern-Specific Mappings)                       │
│                                                             │
│  translateToGeneric()  translateToSales()  translateTo...() │
│        ↕                    ↕                  ↕            │
└────────┬──────────────┬───────────────┬─────────────────────┘
         │              │               │
         │              │               │
┌────────┴──────────────┴───────────────┴─────────────────────┐
│                      STORAGE LAYER                          │
│         (Pattern-Agnostic Universal Model)                  │
│                                                             │
│  {                                                          │
│    id, name, description,                                   │
│    commonFields: { monetaryValue, timeEstimate, ... },     │
│    patternData: {                                           │
│      generic: { cost, leadTime, ... },                     │
│      sales: { dealValue, stageProbability, ... },          │
│      philosophy: { speaker, premise1, ... }                │
│    }                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Model Specification

### Layer 1: Universal Core (ALWAYS PRESENT)

```typescript
interface UniversalNode {
    // ────────────────────────────────────────────────────────────
    // IDENTITY
    // ────────────────────────────────────────────────────────────
    id: string;                    // Unique identifier (UUID)
    name: string;                  // Node name (user-visible)
    description: string;           // Node description

    // ────────────────────────────────────────────────────────────
    // TREE STRUCTURE
    // ────────────────────────────────────────────────────────────
    nodeType: 'root' | 'phase' | 'item' | 'subtask';
    parentId: string | null;       // Parent node ID
    children: string[];            // Child node IDs (references only)
    collapsed: boolean;            // UI state

    // ────────────────────────────────────────────────────────────
    // PATTERN CONTEXT
    // ────────────────────────────────────────────────────────────
    originalPattern: string;       // Pattern where node was created
    currentViewPattern: string;    // Currently active pattern view
    patternHistory: PatternHistoryEntry[];  // Translation history

    // ────────────────────────────────────────────────────────────
    // METADATA
    // ────────────────────────────────────────────────────────────
    createdAt: number;             // Unix timestamp
    lastModified: number;          // Unix timestamp
    createdBy: string;             // User ID (future: collaboration)

    // ────────────────────────────────────────────────────────────
    // LAYER 2: COMMON FIELDS
    // ────────────────────────────────────────────────────────────
    commonFields: CommonFields;

    // ────────────────────────────────────────────────────────────
    // LAYER 3: PATTERN-SPECIFIC DATA
    // ────────────────────────────────────────────────────────────
    patternData: PatternDataStore;
}
```

---

### Layer 2: Common Fields (Pattern-Agnostic)

```typescript
interface CommonFields {
    // ────────────────────────────────────────────────────────────
    // CATEGORIZATION
    // ────────────────────────────────────────────────────────────
    type: string;                  // Pattern-specific type (changes per view)
    pmStatus?: 'not-started' | 'in-progress' | 'on-hold' | 'completed';

    // ────────────────────────────────────────────────────────────
    // MONETARY & FINANCIAL
    // ────────────────────────────────────────────────────────────
    monetaryValue?: number;        // Maps to: cost, dealValue, budget, investment
    monetaryValueCurrency?: string;  // 'USD', 'EUR', etc.

    // ────────────────────────────────────────────────────────────
    // TIME & SCHEDULING
    // ────────────────────────────────────────────────────────────
    timeEstimate?: string;         // Maps to: leadTime, engineeringEstimate, duration
    targetDate?: string;           // Maps to: expectedCloseDate, bookingDeadline

    // ────────────────────────────────────────────────────────────
    // RISK & PROBABILITY
    // ────────────────────────────────────────────────────────────
    probability?: number;          // 0-100: Maps to stageProbability, confidence
    riskLevel?: 'low' | 'medium' | 'high';  // Maps to: technicalRisk, riskLevel

    // ────────────────────────────────────────────────────────────
    // PEOPLE & ROLES
    // ────────────────────────────────────────────────────────────
    personName?: string;           // Maps to: contactPerson, speaker, povCharacter
    responsibleParty?: string;     // Maps to: responsiblePerson, responsibleExecutive

    // ────────────────────────────────────────────────────────────
    // CONTENT & TEXT
    // ────────────────────────────────────────────────────────────
    textContent?: string;          // Maps to: keyArgument, videoPrompt, verbatimQuote
    textContentType?: 'argument' | 'prompt' | 'quote' | 'narrative';

    // ────────────────────────────────────────────────────────────
    // MEASUREMENT & METRICS
    // ────────────────────────────────────────────────────────────
    wordCount?: number;            // Maps to: wordCount (Thesis/Book)
    targetWordCount?: number;      // Maps to: targetWordCount
    numericValue?: number;         // Maps to: storyPoints, sets, guestCount

    // ────────────────────────────────────────────────────────────
    // STATUS & PROGRESS
    // ────────────────────────────────────────────────────────────
    draftStatus?: 'outline' | 'first-draft' | 'revision' | 'final';
    completionPercentage?: number; // 0-100

    // ────────────────────────────────────────────────────────────
    // IMPACT & IMPORTANCE
    // ────────────────────────────────────────────────────────────
    impactLevel?: 'low' | 'medium' | 'high';  // Maps to: userImpact, strategicTheme
    priorityScore?: number;        // 1-10 or 1-100
}
```

---

### Layer 3: Pattern-Specific Data Store

```typescript
interface PatternDataStore {
    // Each pattern gets its OWN namespace
    // Only populate the patterns that have been applied to this node

    generic?: {
        cost?: number;
        alternateSource?: string;
        leadTime?: string;
    };

    sales?: {
        dealValue?: number;
        expectedCloseDate?: string;
        leadSource?: string;
        contactPerson?: string;
        stageProbability?: number;
        competitorInfo?: string;
    };

    philosophy?: {
        speaker?: string;
        argumentType?: string;
        validity?: string;
        keyTerms?: string;
        premise1?: string;
        premise2?: string;
        conclusion?: string;
        objection?: string;
        response?: string;
        textualReference?: string;
        philosophicalSchool?: string;
    };

    film?: {
        aiPlatform?: string;
        videoPrompt?: string;
        visualStyle?: string;
        duration?: string;
        aspectRatio?: string;
        cameraMovement?: string;
        motionIntensity?: string;
        lightingMood?: string;
        iterationNotes?: string;
    };

    // ... all 16 patterns
}
```

---

### Pattern History Tracking

```typescript
interface PatternHistoryEntry {
    timestamp: number;             // When pattern was applied
    pattern: string;               // Which pattern ('generic', 'sales', etc.)
    action: 'created' | 'switched' | 'auto-translated' | 'user-edited';
    userId?: string;               // Who made the change
    fieldsModified?: string[];     // Which fields changed during translation
    preservationScore?: number;    // 0-100: How much data was preserved
}
```

**Example History:**
```javascript
patternHistory: [
    {
        timestamp: 1700000000000,
        pattern: 'generic',
        action: 'created',
        fieldsModified: ['cost', 'leadTime', 'alternateSource']
    },
    {
        timestamp: 1700010000000,
        pattern: 'sales',
        action: 'switched',
        fieldsModified: ['dealValue', 'stageProbability'],  // User manually added these
        preservationScore: 92  // 92% of Generic data mapped to Sales
    },
    {
        timestamp: 1700020000000,
        pattern: 'philosophy',
        action: 'switched',
        fieldsModified: ['premise1', 'conclusion'],
        preservationScore: 67  // Sales → Philosophy had less overlap
    }
]
```

---

## Storage Schema

### Complete Node Example

```javascript
{
    // ════════════════════════════════════════════════════════════
    // LAYER 1: UNIVERSAL CORE
    // ════════════════════════════════════════════════════════════
    id: 'node-123-abc',
    name: 'Secure Series A Funding',
    description: 'Raise $5M Series A from top-tier VCs to fuel expansion',
    nodeType: 'item',
    parentId: 'phase-456-def',
    children: ['subtask-789-ghi', 'subtask-790-jkl'],
    collapsed: false,

    // Pattern Context
    originalPattern: 'generic',
    currentViewPattern: 'sales',  // Currently viewing as Sales
    patternHistory: [
        {
            timestamp: 1700000000000,
            pattern: 'generic',
            action: 'created'
        },
        {
            timestamp: 1700010000000,
            pattern: 'sales',
            action: 'switched',
            preservationScore: 92
        }
    ],

    // Metadata
    createdAt: 1700000000000,
    lastModified: 1700010000000,
    createdBy: 'user-abc-123',

    // ════════════════════════════════════════════════════════════
    // LAYER 2: COMMON FIELDS (Pattern-Agnostic)
    // ════════════════════════════════════════════════════════════
    commonFields: {
        type: 'enterprise',  // Currently rendering as Sales type
        pmStatus: 'in-progress',
        monetaryValue: 5000000,
        monetaryValueCurrency: 'USD',
        timeEstimate: '6-9 months',
        targetDate: '2025-09-30',
        probability: 75,  // 75% chance of success
        riskLevel: 'medium',
        personName: 'Sarah Chen',
        responsibleParty: 'CEO',
        impactLevel: 'high'
    },

    // ════════════════════════════════════════════════════════════
    // LAYER 3: PATTERN-SPECIFIC DATA
    // ════════════════════════════════════════════════════════════
    patternData: {
        // ────────────────────────────────────────────────────────
        // GENERIC PATTERN (original creation)
        // ────────────────────────────────────────────────────────
        generic: {
            cost: 5000000,  // Same as commonFields.monetaryValue
            alternateSource: 'Angel investors or debt financing',
            leadTime: '6-9 months'  // Same as commonFields.timeEstimate
        },

        // ────────────────────────────────────────────────────────
        // SALES PATTERN (user switched to this view)
        // ────────────────────────────────────────────────────────
        sales: {
            dealValue: 5000000,  // Mapped from generic.cost
            expectedCloseDate: '2025-09-30',  // Calculated from leadTime
            leadSource: 'Internal Project',  // Auto-generated
            contactPerson: 'Sarah Chen',  // User manually added
            stageProbability: 75,  // User manually added
            competitorInfo: 'Competing with Venture Firm X and Y'  // User manually added
        },

        // ────────────────────────────────────────────────────────
        // PHILOSOPHY PATTERN (not yet viewed, but could be)
        // ────────────────────────────────────────────────────────
        // NOT POPULATED YET - would auto-generate on first switch
    }
}
```

---

## Pattern View Layer

### How Views Work

**Key Concept:** When user switches pattern, we DON'T modify the node. We just change how it's *rendered*.

### View Rendering Logic

```javascript
function renderNodeInPattern(node, targetPattern) {
    // 1. Check if target pattern data exists
    if (!node.patternData[targetPattern]) {
        // Auto-translate from current pattern
        node.patternData[targetPattern] = translateNode(
            node,
            node.currentViewPattern,
            targetPattern
        );
    }

    // 2. Update view context
    node.currentViewPattern = targetPattern;

    // 3. Merge commonFields + pattern-specific fields for rendering
    const viewData = {
        ...node,  // Universal fields (id, name, description)
        ...node.commonFields,  // Pattern-agnostic fields
        ...node.patternData[targetPattern]  // Pattern-specific fields
    };

    // 4. Render UI with pattern-specific field labels
    return generateNodeHTML(viewData, PATTERNS[targetPattern]);
}
```

---

### Example: Same Node, Three Views

**Storage (Layer 3):**
```javascript
{
    name: 'Secure Funding',
    commonFields: {
        monetaryValue: 5000000,
        timeEstimate: '6-9 months',
        personName: 'Sarah Chen',
        probability: 75
    },
    patternData: {
        generic: { cost: 5000000, leadTime: '6-9 months' },
        sales: { dealValue: 5000000, stageProbability: 75 },
        philosophy: { premise1: 'Company requires $5M...', conclusion: 'Funding is critical' }
    }
}
```

**View 1: Generic Pattern**
```
┌─────────────────────────────────────────┐
│ 📋 Secure Funding                       │
│ ─────────────────────────────────────── │
│ Cost: $5,000,000                        │
│ Lead Time: 6-9 months                   │
│ Alternate Source: Angel investors       │
│ Status: In Progress                     │
└─────────────────────────────────────────┘
```

**View 2: Sales Pattern**
```
┌─────────────────────────────────────────┐
│ 💼 Secure Funding                       │
│ ─────────────────────────────────────── │
│ Deal Value: $5,000,000                  │
│ Close Probability: 75%                  │
│ Contact: Sarah Chen                     │
│ Expected Close: 2025-09-30              │
│ Status: In Progress                     │
└─────────────────────────────────────────┘
```

**View 3: Philosophy Pattern**
```
┌─────────────────────────────────────────┐
│ 🤔 Secure Funding                       │
│ ─────────────────────────────────────── │
│ Speaker: Sarah Chen                     │
│ Argument Type: Inductive                │
│ Premise 1: Company requires $5M...      │
│ Conclusion: Funding is critical         │
│ Validity: Sound                         │
└─────────────────────────────────────────┘
```

**Same underlying data, three different presentations!**

---

## Translation Engine

### Core Translation Function

```javascript
/**
 * Translate node from one pattern to another
 * @param {UniversalNode} node - The node to translate
 * @param {string} fromPattern - Source pattern
 * @param {string} toPattern - Target pattern
 * @returns {object} - Pattern-specific fields for target pattern
 */
function translateNode(node, fromPattern, toPattern) {
    // 1. Get translation rules
    const translationRules = TRANSLATION_RULES[fromPattern][toPattern];

    if (!translationRules) {
        console.warn(`No translation rules from ${fromPattern} to ${toPattern}`);
        return generateDefaultFields(toPattern);
    }

    // 2. Apply field mappings
    const translatedFields = {};

    for (const [targetField, mapping] of Object.entries(translationRules.fieldMappings)) {
        if (mapping.source === 'commonFields') {
            // Map from common fields
            translatedFields[targetField] = node.commonFields[mapping.field];
        } else if (mapping.source === 'patternData') {
            // Map from source pattern data
            translatedFields[targetField] = node.patternData[fromPattern][mapping.field];
        } else if (mapping.source === 'computed') {
            // Run computation function
            translatedFields[targetField] = mapping.compute(node);
        }

        // Apply transformation if specified
        if (mapping.transform) {
            translatedFields[targetField] = mapping.transform(translatedFields[targetField]);
        }
    }

    // 3. Generate auto-fields
    for (const [targetField, generator] of Object.entries(translationRules.autoGenerate || {})) {
        if (!translatedFields[targetField]) {
            translatedFields[targetField] = generator(node);
        }
    }

    // 4. Calculate preservation score
    const preservationScore = calculatePreservationScore(
        node.patternData[fromPattern],
        translatedFields
    );

    // 5. Update pattern history
    node.patternHistory.push({
        timestamp: Date.now(),
        pattern: toPattern,
        action: 'auto-translated',
        fieldsModified: Object.keys(translatedFields),
        preservationScore
    });

    return translatedFields;
}
```

---

### Translation Rules Example

```javascript
const TRANSLATION_RULES = {
    generic: {
        sales: {
            // Field-to-field mappings
            fieldMappings: {
                dealValue: {
                    source: 'commonFields',
                    field: 'monetaryValue'
                },
                expectedCloseDate: {
                    source: 'computed',
                    compute: (node) => {
                        // Parse leadTime (e.g., "6-9 months") → add to current date
                        const leadTime = node.patternData.generic.leadTime;
                        const months = parseInt(leadTime.match(/\d+/)[0]);
                        const targetDate = new Date();
                        targetDate.setMonth(targetDate.getMonth() + months);
                        return targetDate.toISOString().split('T')[0];
                    }
                },
                stageProbability: {
                    source: 'commonFields',
                    field: 'probability',
                    transform: (val) => val || 50  // Default to 50% if not set
                }
            },

            // Auto-generated fields
            autoGenerate: {
                leadSource: () => 'Internal Project',
                contactPerson: (node) => node.commonFields.personName || '',
                competitorInfo: (node) => {
                    const altSource = node.patternData.generic?.alternateSource;
                    return altSource ? `Alternative: ${altSource}` : '';
                }
            }
        },

        philosophy: {
            fieldMappings: {
                speaker: {
                    source: 'commonFields',
                    field: 'personName'
                },
                premise1: {
                    source: 'computed',
                    compute: (node) => {
                        return `${node.name}: ${node.description}`;
                    }
                },
                premise2: {
                    source: 'computed',
                    compute: (node) => {
                        const cost = node.commonFields.monetaryValue;
                        const time = node.commonFields.timeEstimate;
                        return `Investment: $${cost?.toLocaleString()} over ${time}`;
                    }
                }
            },

            autoGenerate: {
                argumentType: () => 'Inductive',
                validity: () => 'Uncertain',
                philosophicalSchool: () => 'Pragmatist',
                keyTerms: (node) => {
                    // Extract key words from name + description
                    const text = `${node.name} ${node.description}`;
                    const words = text.toLowerCase().match(/\b\w{5,}\b/g) || [];
                    return words.slice(0, 5).join(', ');
                }
            }
        }
    },

    // ... more pattern pairs
};
```

---

## Code Implementation

### Step 1: Update Node Constructor

**Current Code (approximate line 7500):**
```javascript
function createNode(name, nodeType, parentId) {
    return {
        id: generateId(),
        name,
        nodeType,
        parentId,
        children: [],
        collapsed: false,
        description: '',
        type: '',

        // Pattern-specific fields (PROBLEM!)
        cost: 0,
        leadTime: '',
        // ...
    };
}
```

**New Code:**
```javascript
function createNode(name, nodeType, parentId, pattern = 'generic') {
    return {
        // ════════════════════════════════════════════════════════
        // LAYER 1: UNIVERSAL CORE
        // ════════════════════════════════════════════════════════
        id: generateId(),
        name,
        description: '',
        nodeType,
        parentId,
        children: [],
        collapsed: false,

        // Pattern Context
        originalPattern: pattern,
        currentViewPattern: pattern,
        patternHistory: [{
            timestamp: Date.now(),
            pattern: pattern,
            action: 'created'
        }],

        // Metadata
        createdAt: Date.now(),
        lastModified: Date.now(),
        createdBy: 'current-user',  // Future: real user tracking

        // ════════════════════════════════════════════════════════
        // LAYER 2: COMMON FIELDS
        // ════════════════════════════════════════════════════════
        commonFields: {
            type: '',
            pmStatus: 'not-started',
            monetaryValue: null,
            monetaryValueCurrency: 'USD',
            timeEstimate: null,
            targetDate: null,
            probability: null,
            riskLevel: null,
            personName: null,
            responsibleParty: null,
            textContent: null,
            textContentType: null,
            wordCount: null,
            targetWordCount: null,
            numericValue: null,
            draftStatus: null,
            completionPercentage: 0,
            impactLevel: null,
            priorityScore: null
        },

        // ════════════════════════════════════════════════════════
        // LAYER 3: PATTERN-SPECIFIC DATA
        // ════════════════════════════════════════════════════════
        patternData: {
            [pattern]: initializePatternFields(pattern)
        }
    };
}

function initializePatternFields(pattern) {
    // Return empty object with all pattern-specific fields
    const fields = {};
    const patternConfig = PATTERNS[pattern].fields;

    for (const [fieldKey, fieldConfig] of Object.entries(patternConfig)) {
        if (fieldConfig.type === 'number') {
            fields[fieldKey] = 0;
        } else if (fieldConfig.type === 'checkbox') {
            fields[fieldKey] = false;
        } else {
            fields[fieldKey] = '';
        }
    }

    return fields;
}
```

---

### Step 2: Pattern Switching Handler

**New Code:**
```javascript
// Add event listener to pattern dropdown
document.getElementById('pattern-select').addEventListener('change', function(e) {
    const newPattern = e.target.value;

    if (newPattern === currentPattern) return;  // No change

    // Show confirmation dialog
    showPatternSwitchDialog(currentPattern, newPattern);
});

function showPatternSwitchDialog(fromPattern, toPattern) {
    const modal = document.createElement('div');
    modal.className = 'modal pattern-switch-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Switch to ${PATTERNS[toPattern].name}?</h2>
            <p>This will translate your current tree from
               <strong>${PATTERNS[fromPattern].name}</strong> to
               <strong>${PATTERNS[toPattern].name}</strong></p>

            <div class="translation-preview">
                <h3>Translation Preview:</h3>
                <ul>
                    <li>✅ 3 fields will be preserved</li>
                    <li>🔄 2 fields will be mapped</li>
                    <li>✨ 4 fields will be auto-generated</li>
                </ul>
            </div>

            <div class="modal-actions">
                <button id="confirm-switch" class="primary">Switch Pattern</button>
                <button id="cancel-switch">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('confirm-switch').addEventListener('click', () => {
        switchTreePattern(fromPattern, toPattern);
        modal.remove();
    });

    document.getElementById('cancel-switch').addEventListener('click', () => {
        // Revert dropdown to original pattern
        document.getElementById('pattern-select').value = fromPattern;
        modal.remove();
    });
}

function switchTreePattern(fromPattern, toPattern) {
    // Recursively translate all nodes in tree
    const allNodes = getAllNodes(treeData[0]);  // Get root and all descendants

    allNodes.forEach(node => {
        // Translate node to new pattern
        if (!node.patternData[toPattern]) {
            node.patternData[toPattern] = translateNode(node, fromPattern, toPattern);
        }

        // Update current view
        node.currentViewPattern = toPattern;
    });

    // Update global pattern variable
    currentPattern = toPattern;

    // Re-render entire UI
    renderTree();
    renderCanvas();

    // Update sort dropdown options
    updateSortOptions(toPattern);

    // Show success message
    showToast(`Switched to ${PATTERNS[toPattern].name} pattern`);
}
```

---

### Step 3: Update Field Getters/Setters

**Current Code (scattered throughout):**
```javascript
const cost = node.cost;
node.cost = 50000;
```

**New Code:**
```javascript
// Get field value (respects current pattern view)
function getFieldValue(node, fieldName) {
    const currentPattern = node.currentViewPattern;

    // Check pattern-specific data first
    if (node.patternData[currentPattern]?.[fieldName] !== undefined) {
        return node.patternData[currentPattern][fieldName];
    }

    // Fall back to common fields
    if (node.commonFields[fieldName] !== undefined) {
        return node.commonFields[fieldName];
    }

    // Fall back to universal fields
    return node[fieldName];
}

// Set field value (updates both pattern-specific AND common fields)
function setFieldValue(node, fieldName, value) {
    const currentPattern = node.currentViewPattern;

    // Update pattern-specific data
    if (!node.patternData[currentPattern]) {
        node.patternData[currentPattern] = {};
    }
    node.patternData[currentPattern][fieldName] = value;

    // ALSO update common fields if applicable
    updateCommonFieldsFromPatternData(node, currentPattern);

    // Update lastModified timestamp
    node.lastModified = Date.now();
}

function updateCommonFieldsFromPatternData(node, pattern) {
    const patternFields = node.patternData[pattern];

    // Map pattern-specific fields → common fields
    if (pattern === 'generic') {
        if (patternFields.cost !== undefined) {
            node.commonFields.monetaryValue = patternFields.cost;
        }
        if (patternFields.leadTime !== undefined) {
            node.commonFields.timeEstimate = patternFields.leadTime;
        }
    } else if (pattern === 'sales') {
        if (patternFields.dealValue !== undefined) {
            node.commonFields.monetaryValue = patternFields.dealValue;
        }
        if (patternFields.stageProbability !== undefined) {
            node.commonFields.probability = patternFields.stageProbability;
        }
        if (patternFields.contactPerson !== undefined) {
            node.commonFields.personName = patternFields.contactPerson;
        }
    }
    // ... more pattern mappings
}
```

---

### Step 4: Update AI Prompt Builder

**Current Code (line 9397):**
```javascript
if (pattern === 'philosophy') {
    prompt += `Speaker: ${node.speaker}\n`;
    prompt += `Premise 1: ${node.premise1}\n`;
}
```

**New Code:**
```javascript
if (pattern === 'philosophy') {
    // Use getter that respects pattern view
    const speaker = getFieldValue(node, 'speaker');
    const premise1 = getFieldValue(node, 'premise1');
    const premise2 = getFieldValue(node, 'premise2');

    // Check if node was translated
    const isTranslated = node.originalPattern !== 'philosophy';

    if (isTranslated) {
        prompt += `⚠️ NOTE: This node was translated from ${PATTERNS[node.originalPattern].name} pattern.\n`;
        prompt += `Some fields may be auto-generated or incomplete.\n\n`;
    }

    prompt += `Speaker: ${speaker || '[Not specified]'}\n`;
    prompt += `Premise 1: ${premise1 || '[Not specified]'}\n`;
    prompt += `Premise 2: ${premise2 || '[Not specified]'}\n`;

    // Fall back to common fields if pattern-specific fields are empty
    if (!premise1 && !premise2) {
        prompt += `\n📝 Context from original pattern:\n`;
        prompt += `Description: ${node.description}\n`;
        if (node.commonFields.textContent) {
            prompt += `Additional Context: ${node.commonFields.textContent}\n`;
        }
    }
}
```

---

## Migration Strategy

### Phase 1: Add New Fields (Non-Breaking)

**Goal:** Add new architecture without breaking existing trees.

```javascript
function migrateNodeToUniversalModel(oldNode, pattern) {
    const newNode = {
        // Copy all existing fields
        ...oldNode,

        // Add new pattern context fields
        originalPattern: pattern,
        currentViewPattern: pattern,
        patternHistory: [{
            timestamp: Date.now(),
            pattern: pattern,
            action: 'migrated'
        }],

        // Create common fields from existing data
        commonFields: extractCommonFields(oldNode, pattern),

        // Move pattern-specific fields into patternData
        patternData: {
            [pattern]: extractPatternFields(oldNode, pattern)
        }
    };

    // KEEP old fields for backward compatibility (temporarily)
    // This allows old code to still work during transition
    return newNode;
}

function extractCommonFields(node, pattern) {
    const common = {
        type: node.type,
        pmStatus: node.pmStatus
    };

    if (pattern === 'generic') {
        common.monetaryValue = node.cost;
        common.timeEstimate = node.leadTime;
    } else if (pattern === 'sales') {
        common.monetaryValue = node.dealValue;
        common.probability = node.stageProbability;
        common.personName = node.contactPerson;
    }
    // ... more patterns

    return common;
}

function extractPatternFields(node, pattern) {
    const patternConfig = PATTERNS[pattern].fields;
    const patternFields = {};

    for (const fieldKey of Object.keys(patternConfig)) {
        if (node[fieldKey] !== undefined) {
            patternFields[fieldKey] = node[fieldKey];
        }
    }

    return patternFields;
}
```

---

### Phase 2: Migrate Existing Trees on Load

```javascript
function loadJSON(jsonData) {
    // Check if tree uses old format
    const isOldFormat = !jsonData[0].patternData;

    if (isOldFormat) {
        console.log('Migrating tree to universal data model...');
        jsonData = migrateTreeToUniversalModel(jsonData, currentPattern);

        // Optionally: Save migrated version
        saveJSON();  // Re-save in new format
    }

    // Continue with normal load
    treeData = jsonData;
    renderTree();
}

function migrateTreeToUniversalModel(tree, pattern) {
    return tree.map(node => {
        const migratedNode = migrateNodeToUniversalModel(node, pattern);

        // Recursively migrate children
        if (node.children && node.children.length > 0) {
            migratedNode.children = migrateTreeToUniversalModel(node.children, pattern);
        }

        return migratedNode;
    });
}
```

---

### Phase 3: Remove Old Fields (Breaking Change)

**Goal:** Clean up after all users have migrated.

```javascript
// After 2-3 versions, remove backward compatibility

function createNode(name, nodeType, parentId, pattern = 'generic') {
    return {
        // ONLY new fields
        id: generateId(),
        name,
        description: '',
        nodeType,
        parentId,
        children: [],
        collapsed: false,
        originalPattern: pattern,
        currentViewPattern: pattern,
        patternHistory: [{ timestamp: Date.now(), pattern, action: 'created' }],
        createdAt: Date.now(),
        lastModified: Date.now(),
        commonFields: {},
        patternData: { [pattern]: initializePatternFields(pattern) }

        // NO old fields (cost, leadTime, dealValue, etc.)
    };
}
```

---

## Performance Considerations

### 1. Translation Caching

**Problem:** Translating large trees repeatedly is expensive.

**Solution:** Cache translated pattern data.

```javascript
// When switching patterns, only translate nodes that haven't been translated yet
function switchTreePattern(fromPattern, toPattern) {
    const allNodes = getAllNodes(treeData[0]);

    // Only translate nodes that don't have target pattern data
    const nodesToTranslate = allNodes.filter(node => !node.patternData[toPattern]);

    console.log(`Translating ${nodesToTranslate.length} nodes to ${toPattern}`);

    nodesToTranslate.forEach(node => {
        node.patternData[toPattern] = translateNode(node, fromPattern, toPattern);
    });

    // Update view (instant, no translation needed)
    allNodes.forEach(node => {
        node.currentViewPattern = toPattern;
    });

    currentPattern = toPattern;
    renderTree();
}
```

---

### 2. Lazy Translation

**Problem:** User may never switch patterns, so pre-translating all patterns is wasteful.

**Solution:** Only translate when user switches pattern.

```javascript
// When rendering node in pattern view, check if translation exists
function renderNodeInPattern(node, targetPattern) {
    // Lazy translation: only translate if user actually switches to this pattern
    if (!node.patternData[targetPattern]) {
        console.log(`Lazily translating node ${node.id} to ${targetPattern}`);
        node.patternData[targetPattern] = translateNode(
            node,
            node.originalPattern,  // Always translate from original for best preservation
            targetPattern
        );
    }

    // ... render
}
```

---

### 3. JSON File Size

**Problem:** Storing ALL pattern data for ALL patterns could bloat JSON files.

**Solution:** Only store patterns that have been actively used.

```javascript
function saveJSON() {
    // Clean up unused pattern data before saving
    const cleanedTree = treeData.map(node => cleanUpNode(node));

    const json = JSON.stringify(cleanedTree, null, 2);
    downloadJSON(json, filename);
}

function cleanUpNode(node) {
    const cleaned = { ...node };

    // Only keep pattern data for patterns that have been viewed/edited
    const usedPatterns = new Set(node.patternHistory.map(entry => entry.pattern));

    cleaned.patternData = {};
    for (const pattern of usedPatterns) {
        cleaned.patternData[pattern] = node.patternData[pattern];
    }

    return cleaned;
}
```

---

## Conclusion

### Implementation Checklist

- [ ] **Week 1:** Update node structure (add commonFields, patternData)
- [ ] **Week 2:** Implement translation engine (TRANSLATION_RULES, translateNode())
- [ ] **Week 3:** Add pattern switching UI (event handler, confirmation dialog)
- [ ] **Week 4:** Update AI prompt builder (handle translated nodes)
- [ ] **Week 5:** Implement migration strategy (migrate old trees on load)
- [ ] **Week 6:** Test all pattern pairs (verify translation quality)
- [ ] **Week 7:** Performance optimization (caching, lazy translation)
- [ ] **Week 8:** Documentation and user testing

### Success Criteria

✅ User can switch patterns without losing data
✅ AI Smart Suggest works correctly with translated nodes
✅ JSON files remain reasonably sized (<5% size increase)
✅ Pattern switching is fast (<500ms for trees up to 100 nodes)
✅ Old trees automatically migrate to new format on load

---

**Document Status:** ✅ Complete - Ready for Implementation

**Next Step:** Begin Week 1 implementation (update node structure)
