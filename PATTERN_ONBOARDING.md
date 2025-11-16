# TreeListy Pattern Onboarding Guide for AI Assistants

**Version:** 2.0
**Last Updated:** 2025-11-16
**Audience:** AI assistants adding new patterns to TreeListy

---

## Table of Contents

1. [Overview](#overview)
2. [Pattern Anatomy](#pattern-anatomy)
3. [Step-by-Step Pattern Creation](#step-by-step-pattern-creation)
4. [AI Integration (Critical!)](#ai-integration-critical)
5. [Pattern Detection Setup](#pattern-detection-setup)
6. [Field Definition Best Practices](#field-definition-best-practices)
7. [Testing Checklist](#testing-checklist)
8. [Code Reference Map](#code-reference-map)
9. [Examples](#examples)

---

## Overview

TreeListy supports 13+ specialized patterns (Philosophy, Sales, Fitness, etc.) that customize the UI, terminology, fields, and AI behavior for different use cases.

**Adding a new pattern requires 6 key integrations:**

1. ✅ Pattern definition in `PATTERNS` object
2. ✅ Add to hardcoded UI dropdowns (2 locations)
3. ✅ AI Review expert persona
4. ✅ AI Suggest expert persona
5. ✅ AI Analysis pattern-specific prompt
6. ✅ Pattern detection keywords (optional but recommended)

**Critical:** All 4 AI features MUST be pattern-aware or users will get generic CFO/PM advice regardless of pattern context.

---

## Pattern Anatomy

Each pattern has this structure:

```javascript
patternKey: {
    // Basic Metadata
    name: 'Display Name',
    icon: '🎯',

    // Hierarchical Labels (REQUIRED)
    levels: {
        root: 'What users call the top level',
        phase: 'What users call major sections',
        item: 'What users call individual entries',
        subtask: 'What users call sub-items'
    },

    // Pre-populated Phase Names (RECOMMENDED)
    phaseSubtitles: ['Phase 1 Name', 'Phase 2 Name', ...],

    // Item Type Dropdown Options (RECOMMENDED)
    types: [
        { value: 'type-key', label: '🎯 Display Label' },
        // 5-10 options typical
    ],

    // Description (shown in pattern selector)
    description: 'Brief explanation of what this pattern is for',

    // Field Definitions (THE HEART OF THE PATTERN)
    fields: {
        fieldName: {
            label: 'User-facing Label',
            type: 'text|textarea|number|select|date',
            placeholder: 'Example text...',
            helpText: 'Explain what this field is for',
            // For select types:
            options: ['Option 1', 'Option 2'],
            // For number types:
            min: 0, max: 100, step: 1
        },
        // ... more fields

        // Special flags (OPTIONAL)
        includeDependencies: true,  // Add dependencies field
        includeTracking: true,       // Add % complete, status, priority
        trackingFor: ['item', 'subtask']  // Which levels get tracking
    }
}
```

---

## Step-by-Step Pattern Creation

### Step 1: Define Pattern Object

**Location:** `treeplexity.html` around line 5000-6000 (inside `const PATTERNS = { ... }`)

**Template:**
```javascript
yourpattern: {
    name: 'Your Pattern Name',
    icon: '🎯',  // Choose relevant emoji

    levels: {
        root: 'Collection',      // E.g., "Research Library"
        phase: 'Category',       // E.g., "Topic Area"
        item: 'Entry',          // E.g., "Paper"
        subtask: 'Component'     // E.g., "Section"
    },

    phaseSubtitles: [
        'Category 1',
        'Category 2',
        'Category 3'
    ],

    types: [
        { value: 'type1', label: '📄 Type 1 Name' },
        { value: 'type2', label: '📊 Type 2 Name' },
        { value: 'type3', label: '🎯 Type 3 Name' }
    ],

    description: 'Clear explanation of when to use this pattern',

    fields: {
        // Core field (every pattern should have at least name/description)
        title: {
            label: 'Title',
            type: 'text',
            placeholder: 'Enter a clear, descriptive title...',
            helpText: 'The main identifier for this entry'
        },

        description: {
            label: 'Description',
            type: 'textarea',
            placeholder: 'Detailed description...',
            helpText: 'Explain the purpose and key details'
        },

        // Domain-specific fields (3-10 recommended)
        customField1: {
            label: 'Custom Field 1',
            type: 'text',
            placeholder: 'Example...',
            helpText: 'What this field captures and why it matters'
        },

        // Example: dropdown field
        category: {
            label: 'Category',
            type: 'select',
            options: ['Option A', 'Option B', 'Option C'],
            helpText: 'Choose the most relevant category'
        },

        // Example: number field
        priority: {
            label: 'Priority',
            type: 'number',
            min: 1,
            max: 10,
            step: 1,
            placeholder: '5',
            helpText: '1 = lowest, 10 = highest priority'
        },

        // Example: date field
        dueDate: {
            label: 'Due Date',
            type: 'date',
            helpText: 'Target completion date'
        },

        // Optional: add tracking fields
        includeDependencies: true,
        includeTracking: true,
        trackingFor: ['item', 'subtask']
    }
}
```

**Best Practices:**
- **5-10 fields** is ideal (not counting tracking/dependencies)
- **Required fields:** name, description, itemType (built-in)
- **Use clear labels:** "Target Audience" not "Audience"
- **Write helpful helpText:** Explain WHY the field matters, not just WHAT it is
- **Good placeholder examples:** Show realistic sample data
- **Icon choice matters:** Pick emoji that instantly communicates the pattern's purpose

---

### Step 2: Add Pattern to Hardcoded Dropdowns (CRITICAL!)

**⚠️ IMPORTANT:** Pattern dropdowns are hardcoded in 2 locations. If you skip this step, your pattern won't appear in the UI!

**Location 1: Main Pattern Selector** (around line 1373)

Find this dropdown:
```html
<select class="pattern-select" id="pattern-select" title="Choose naming pattern">
    <option value="generic" data-desc="Universal: Project → Phase → Item → Task">📋 Generic Project</option>
    <option value="sales" data-desc="Sales: Pipeline → Quarter → Deal → Action">💼 Sales Pipeline</option>
    <!-- ... more patterns ... -->
    <option value="familytree" data-desc="Genealogy: Family → Generation → Person → Event">👨‍👩‍👧‍👦 Family Tree</option>
    <option value="custom" data-desc="Custom: Define your own level names">✏️ Custom Names</option>
</select>
```

Add your pattern **before** the `custom` option:
```html
<option value="yourpattern" data-desc="YourPattern: Root → Phase → Item → Subtask">🎯 Your Pattern Name</option>
<option value="custom" data-desc="Custom: Define your own level names">✏️ Custom Names</option>
```

**Location 2: Analyze Text Pattern Selector** (around line 1534)

Find this dropdown:
```html
<select id="analysis-pattern-select" style="...">
    <option value="auto" style="...">🤖 Auto-detect (AI chooses best pattern)</option>
    <option value="generic" style="...">📦 Generic Project - Universal structure</option>
    <!-- ... more patterns ... -->
    <option value="familytree" style="...">👨‍👩‍👧‍👦 Family Tree - Genealogy</option>
</select>
```

Add your pattern at the end **before** the closing `</select>`:
```html
<option value="yourpattern" style="background: #1a1a2e; color: #ffffff;">🎯 Your Pattern Name - Brief description</option>
</select>
```

**Example (Dialogue pattern):**
```html
<!-- Location 1 -->
<option value="dialogue" data-desc="Rhetoric: Conversation → Speaker → Statement → Point">💬 Dialogue & Rhetoric</option>

<!-- Location 2 -->
<option value="dialogue" style="background: #1a1a2e; color: #ffffff;">💬 Dialogue & Rhetoric - Debate analysis</option>
```

**Tips:**
- Use the same icon emoji in both dropdowns
- Keep descriptions concise (under 40 characters)
- Pattern `value` must match your pattern key exactly
- Add your pattern alphabetically for organization (optional but recommended)

---

### Step 3: Add AI Review Expert Persona

**Location:** `treeplexity.html` around line 12578 (inside `aiReview` function)

**Find this object:**
```javascript
const reviewExperts = {
    philosophy: 'You are a philosophy professor...',
    sales: 'You are a sales strategist...',
    // ... other patterns
    generic: 'You are an expert...'
};
```

**Add your pattern:**
```javascript
const reviewExperts = {
    philosophy: 'You are a philosophy professor...',
    sales: 'You are a sales strategist...',
    yourpattern: 'You are a [domain expert role] with [credentials/experience]. Review for [key quality criteria 1], [criteria 2], and [criteria 3].',
    generic: 'You are an expert...'
};
```

**Example:**
```javascript
research: 'You are a research scientist with expertise in academic methodology and peer review. Review for research validity, methodology rigor, citation quality, and reproducibility.',
```

**Tips:**
- Define a **credible expert role** (professor, strategist, trainer, etc.)
- Specify **3-5 review criteria** specific to this domain
- Make it **actionable** - what should the AI look for?

---

### Step 4: Add AI Suggest Expert Persona

**Location:** `treeplexity.html` around line 7685 (inside `buildPatternExpertPrompt` function)

**Find this object:**
```javascript
const expertPersonas = {
    philosophy: 'You are a philosophy professor...',
    sales: 'You are a sales strategist...',
    // ... other patterns
    generic: 'You are an experienced Project Manager...'
};
```

**Add your pattern:**
```javascript
const expertPersonas = {
    philosophy: 'You are a philosophy professor...',
    sales: 'You are a sales strategist...',
    yourpattern: 'You are a [domain expert] specializing in [specific expertise area].',
    generic: 'You are an experienced Project Manager...'
};
```

**Example:**
```javascript
research: 'You are a research scientist specializing in experimental design and academic publishing.',
```

**Tips:**
- Keep it **concise** (1-2 sentences max)
- Focus on the **core expertise** needed for suggestions
- Should align with AI Review persona but can be slightly different

---

### Step 5: Add AI Analysis Pattern-Specific Prompt

**Location:** `treeplexity.html` around line 3076 (inside `generateAIAnalysis` function)

**Find the pattern detection block:**
```javascript
if (pattern.id === 'philosophy') {
    systemPrompt = `You are a philosophy professor...`;
    userPrompt = `Analyze this ${levels.item.toLowerCase()}:...`;
} else if (pattern.id === 'sales') {
    systemPrompt = `You are a sales strategist...`;
    userPrompt = `Analyze this ${levels.item.toLowerCase()}:...`;
}
// ... more patterns
else {
    // Generic fallback
}
```

**Add your pattern block:**
```javascript
} else if (pattern.id === 'yourpattern') {
    systemPrompt = `You are a [domain expert role] with expertise in [specific areas].`;

    userPrompt = `Analyze this ${levels.item.toLowerCase()}:

**${levels.item}:** ${item.name}
**Type:** ${item.itemType || 'N/A'}
**Description:** ${item.description || 'N/A'}
${item.customField1 ? `**Custom Field 1:** ${item.customField1}\n` : ''}
${item.customField2 ? `**Custom Field 2:** ${item.customField2}\n` : ''}

Provide a [domain-specific] analysis covering:
1. **[Criterion 1]** - What to evaluate
2. **[Criterion 2]** - What to evaluate
3. **[Criterion 3]** - What to evaluate
4. **[Criterion 4]** - What to evaluate
5. **[Criterion 5]** - What to evaluate
6. **Recommendations** - Specific actionable improvements`;

} else if (pattern.id === 'nextpattern') {
```

**Example (Research pattern):**
```javascript
} else if (pattern.id === 'research') {
    systemPrompt = `You are a research scientist with expertise in academic methodology, peer review, and experimental design.`;

    userPrompt = `Analyze this ${levels.item.toLowerCase()}:

**${levels.item}:** ${item.name}
**Type:** ${item.itemType || 'N/A'}
**Description:** ${item.description || 'N/A'}
${item.hypothesis ? `**Hypothesis:** ${item.hypothesis}\n` : ''}
${item.methodology ? `**Methodology:** ${item.methodology}\n` : ''}
${item.sampleSize ? `**Sample Size:** ${item.sampleSize}\n` : ''}
${item.results ? `**Results:** ${item.results}\n` : ''}

Provide a research analysis covering:
1. **Research Design** - Is the methodology appropriate for the research question?
2. **Validity** - Are there threats to internal/external validity?
3. **Statistical Power** - Is the sample size adequate?
4. **Reproducibility** - Can others replicate this study?
5. **Ethics** - Are there ethical considerations addressed?
6. **Recommendations** - How to strengthen the research`;

} else if (pattern.id === 'nextpattern') {
```

**Tips:**
- **Display relevant fields** using `${item.fieldName ? \`**Label:** ${item.fieldName}\\n\` : ''}`
- **5-6 analysis criteria** is ideal
- Make criteria **specific to the domain** (not generic)
- Last criterion should always be **"Recommendations"**

---

### Step 6: Add Pattern Detection Keywords (Optional)

**Location:** `treeplexity.html` around line 13070 (inside `detectPattern` function)

**Find the system prompt:**
```javascript
const systemPrompt = `You are an expert at analyzing text and determining the best TreeListy pattern...

Available patterns:
- Philosophy
- Sales Pipeline
- Fitness Program
- Event Planning
- Strategy & Planning
- Prompt Engineering  // <-- Add your pattern here
- Family Tree
// ... etc
`;
```

**Add pattern detection hints around line 13100:**
```javascript
Detection hints:
- Philosophy: "argument", "premise", "conclusion", "thesis", "logic"
- Sales: "deal", "prospect", "pipeline", "quota", "revenue"
- Fitness: "workout", "exercise", "reps", "sets", "training"
- Research: "hypothesis", "methodology", "experiment", "data", "p-value"  // <-- Example
- Prompt: "system prompt", "LLM", "few-shot", "Claude", "GPT"
```

**Tips:**
- Include **5-10 keywords** that uniquely identify this pattern
- Mix **domain jargon** with common terms
- Think: "What words appear in this domain but not others?"

---

## AI Integration (Critical!)

**TreeListy has 4 AI-powered features. ALL FOUR must be pattern-aware:**

| Feature | Location | What to Add |
|---------|----------|-------------|
| **AI Review** | Line ~12578 | Expert persona in `reviewExperts` object |
| **AI Suggest** | Line ~7685 | Expert persona in `expertPersonas` object |
| **AI Wizard (Enhance)** | Line ~12578 | Uses same `reviewExperts` - no separate add needed |
| **AI Analysis** | Line ~3076 | Full if/else block with systemPrompt + userPrompt |

**Common Mistake:** Only adding the pattern definition without AI integration. This causes users to get generic CFO/PM advice in Fitness, Philosophy, or other non-business patterns.

**Validation Test:**
1. Create a tree with your new pattern
2. Right-click any item → "AI Analysis"
3. Verify the analysis uses domain-specific language
4. Try "AI Review" and "AI Suggest" - both should use expert personas

---

## Pattern Detection Setup

Pattern detection helps AI choose the right pattern when analyzing text/files.

**Location:** `treeplexity.html` line ~13070 in `detectPattern` function

### Step 1: Add to Available Patterns List
```javascript
const systemPrompt = `You are an expert at analyzing text and determining the best TreeListy pattern...

Available patterns:
- Philosophy: Deep philosophical arguments with premises and conclusions
- Sales Pipeline: B2B/B2C sales deals and customer relationships
- Your Pattern: [Clear description of when to use it]
- Generic: Universal project structure
`;
```

### Step 2: Add Detection Keywords
```javascript
Detection hints:
- Philosophy: "argument", "premise", "conclusion", "thesis"
- Sales: "deal", "prospect", "pipeline", "quota"
- yourpattern: "keyword1", "keyword2", "keyword3", "keyword4"
```

### Step 3: Map Pattern Key in Response
The AI returns pattern keys like "philosophy", "sales", etc. Make sure your pattern key matches exactly.

**Example:**
```javascript
// Pattern defined as:
research: { name: 'Research Study', ... }

// Detection should return:
return { patternKey: 'research', confidence: 0.85, ... }
```

---

## Field Definition Best Practices

### Field Types

```javascript
// TEXT - Single line input
fieldName: {
    label: 'Field Label',
    type: 'text',
    placeholder: 'Example input...',
    helpText: 'What this captures'
}

// TEXTAREA - Multi-line input
fieldName: {
    label: 'Field Label',
    type: 'textarea',
    placeholder: 'Longer example...',
    helpText: 'What this captures'
}

// NUMBER - Numeric input with validation
fieldName: {
    label: 'Field Label',
    type: 'number',
    min: 0,
    max: 100,
    step: 1,
    placeholder: '50',
    helpText: 'What this measures'
}

// SELECT - Dropdown menu
fieldName: {
    label: 'Field Label',
    type: 'select',
    options: ['Option 1', 'Option 2', 'Option 3'],
    helpText: 'Choose the best fit'
}

// DATE - Date picker
fieldName: {
    label: 'Field Label',
    type: 'date',
    helpText: 'When this occurs'
}
```

### Field Naming Conventions

✅ **Good:**
- `targetAudience` (camelCase)
- `estimatedCost` (clear, specific)
- `deliveryDate` (unambiguous)

❌ **Bad:**
- `target_audience` (snake_case - don't use)
- `audience` (too vague)
- `date` (which date?)

### helpText Writing

✅ **Good helpText:**
```javascript
helpText: 'Define who will benefit from this feature. Be specific about demographics, use cases, and pain points.'
```

❌ **Bad helpText:**
```javascript
helpText: 'The target audience'  // Just repeats the label
```

**Formula:** `[Action verb] + [What to include] + [Why it matters]`

### Placeholder Best Practices

✅ **Good placeholders:**
```javascript
placeholder: 'e.g., Enterprise B2B companies with 100+ employees'
placeholder: 'Bench press: 3 sets × 8 reps @ 185 lbs'
placeholder: 'You are an expert Python developer with 10 years of experience...'
```

❌ **Bad placeholders:**
```javascript
placeholder: 'Enter text here'  // Too generic
placeholder: 'Description'      // Just repeats label
placeholder: ''                 // Empty - missed opportunity
```

### Field Organization

**Recommended order:**
1. **Identity fields:** name, title, description
2. **Core domain fields:** Most important 3-5 fields
3. **Metadata fields:** dates, priorities, categories
4. **Optional fields:** Nice-to-have information
5. **Tracking flags:** includeDependencies, includeTracking

**Example:**
```javascript
fields: {
    // 1. Identity
    name: { ... },
    description: { ... },

    // 2. Core domain
    hypothesis: { ... },
    methodology: { ... },
    sampleSize: { ... },

    // 3. Metadata
    status: { ... },
    startDate: { ... },

    // 4. Optional
    notes: { ... },

    // 5. Tracking
    includeDependencies: true,
    includeTracking: true
}
```

---

## Testing Checklist

After adding a new pattern, verify:

### ✅ Pattern Definition
- [ ] Pattern appears in Tree View → Pattern dropdown
- [ ] Icon displays correctly
- [ ] All field labels are clear and grammatically correct
- [ ] Placeholder text is helpful and realistic
- [ ] helpText provides actionable guidance
- [ ] Types dropdown has 5-10 relevant options
- [ ] phaseSubtitles make sense for this domain

### ✅ UI Integration
- [ ] Create new tree with pattern → all fields appear
- [ ] Edit item → all fields are editable
- [ ] Fields save and reload correctly
- [ ] Number fields enforce min/max validation
- [ ] Select fields show all options
- [ ] Date fields open date picker

### ✅ AI Integration
- [ ] **AI Analysis:** Right-click item → AI Analysis uses domain expert
- [ ] **AI Review:** Right-click item → AI Review uses domain expert
- [ ] **AI Suggest:** Right-click item → AI Suggest uses domain expert
- [ ] **AI Wizard:** Enhance mode preserves pattern and uses expert advice
- [ ] No generic CFO/PM language appears in any AI feature

### ✅ Pattern Detection (if implemented)
- [ ] Analyze Text with pattern-specific content → AI detects pattern
- [ ] Manual pattern selection → overrides detection correctly
- [ ] Generic content → doesn't incorrectly trigger pattern

### ✅ Export/Import
- [ ] Save tree → pattern preserved in JSON
- [ ] Load tree → pattern correctly restored
- [ ] Generate Prompt → uses pattern-specific fields
- [ ] Share URL → pattern persists

---

## Code Reference Map

Quick reference for where to make changes:

| Feature | File | Line Range | Object/Function |
|---------|------|------------|-----------------|
| Pattern Definition | `treeplexity.html` | ~5000-6000 | `const PATTERNS = { ... }` |
| **Main Dropdown** | `treeplexity.html` | **~1373-1388** | **`<select id="pattern-select">`** |
| **Analyze Dropdown** | `treeplexity.html` | **~1534-1549** | **`<select id="analysis-pattern-select">`** |
| AI Review Persona | `treeplexity.html` | ~12578-12591 | `reviewExperts` object in `aiReview` |
| AI Suggest Persona | `treeplexity.html` | ~7685-7698 | `expertPersonas` in `buildPatternExpertPrompt` |
| AI Analysis Prompt | `treeplexity.html` | ~3076-3150 | if/else blocks in `generateAIAnalysis` |
| Pattern Detection | `treeplexity.html` | ~13070-13100 | System prompt in `detectPattern` |
| Pattern Icons | `treeplexity.html` | ~5000 | `icon` field in pattern definition |

**Search Strings:**
- Pattern definition: `const PATTERNS = {`
- **Main dropdown: `<select class="pattern-select" id="pattern-select"`**
- **Analyze dropdown: `<select id="analysis-pattern-select"`**
- AI Review: `const reviewExperts = {`
- AI Suggest: `const expertPersonas = {`
- AI Analysis: `function generateAIAnalysis`
- Pattern Detection: `function detectPattern`

---

## Examples

### Example 1: Research Study Pattern (Complete)

```javascript
// 1. PATTERN DEFINITION (line ~5000)
research: {
    name: 'Research Study',
    icon: '🔬',

    levels: {
        root: 'Research Program',
        phase: 'Study Area',
        item: 'Study',
        subtask: 'Experiment'
    },

    phaseSubtitles: [
        'Clinical Trials',
        'Behavioral Studies',
        'Data Analysis',
        'Literature Review'
    ],

    types: [
        { value: 'experimental', label: '🧪 Experimental' },
        { value: 'observational', label: '👁️ Observational' },
        { value: 'meta-analysis', label: '📊 Meta-Analysis' },
        { value: 'case-study', label: '📋 Case Study' },
        { value: 'longitudinal', label: '📈 Longitudinal' }
    ],

    description: 'Academic research studies with hypothesis, methodology, and results',

    fields: {
        hypothesis: {
            label: 'Research Hypothesis',
            type: 'textarea',
            placeholder: 'H1: Regular exercise reduces cortisol levels by 20% in stressed adults',
            helpText: 'State your testable prediction clearly. Use null hypothesis (H0) and alternative (H1) if applicable.'
        },

        methodology: {
            label: 'Methodology',
            type: 'textarea',
            placeholder: 'Randomized controlled trial with 200 participants over 12 weeks...',
            helpText: 'Describe your research design, data collection methods, and analysis approach'
        },

        sampleSize: {
            label: 'Sample Size',
            type: 'number',
            min: 1,
            placeholder: '200',
            helpText: 'Number of participants/observations in your study'
        },

        variables: {
            label: 'Variables',
            type: 'textarea',
            placeholder: 'IV: Exercise frequency (3x/week vs control)\nDV: Cortisol levels (measured via saliva sample)',
            helpText: 'List independent variables (IV), dependent variables (DV), and confounding variables'
        },

        results: {
            label: 'Results',
            type: 'textarea',
            placeholder: 'Mean cortisol reduction: 22.5% (p < 0.001), 95% CI [18.2%, 26.8%]',
            helpText: 'Report key findings with statistical significance (p-values, confidence intervals)'
        },

        limitations: {
            label: 'Limitations',
            type: 'textarea',
            placeholder: 'Self-reported exercise compliance, limited to urban populations...',
            helpText: 'Acknowledge threats to validity and generalizability'
        },

        status: {
            label: 'Research Status',
            type: 'select',
            options: ['Design', 'IRB Review', 'Data Collection', 'Analysis', 'Writing', 'Published'],
            helpText: 'Current stage of the research process'
        },

        includeDependencies: true,
        includeTracking: true,
        trackingFor: ['item', 'subtask']
    }
},

// 2. AI REVIEW PERSONA (line ~12578)
const reviewExperts = {
    philosophy: 'You are a philosophy professor...',
    research: 'You are a research scientist with expertise in experimental design, statistical analysis, and peer review. Review for research validity, methodology rigor, statistical power, ethical considerations, and reproducibility.',
    generic: '...'
};

// 3. AI SUGGEST PERSONA (line ~7685)
const expertPersonas = {
    philosophy: 'You are a philosophy professor...',
    research: 'You are a research scientist specializing in experimental design and academic publishing.',
    generic: '...'
};

// 4. AI ANALYSIS PROMPT (line ~3076)
} else if (pattern.id === 'research') {
    systemPrompt = `You are a research scientist with expertise in experimental design, statistical analysis, and peer review.`;

    userPrompt = `Analyze this ${levels.item.toLowerCase()}:

**${levels.item}:** ${item.name}
**Type:** ${item.itemType || 'N/A'}
**Hypothesis:** ${item.hypothesis || 'N/A'}
**Methodology:** ${item.methodology || 'N/A'}
${item.sampleSize ? `**Sample Size:** ${item.sampleSize}\n` : ''}
${item.variables ? `**Variables:** ${item.variables}\n` : ''}
${item.results ? `**Results:** ${item.results}\n` : ''}

Provide a research analysis covering:
1. **Research Design** - Is the methodology appropriate for testing the hypothesis?
2. **Validity** - Are there threats to internal or external validity?
3. **Statistical Power** - Is the sample size adequate for detecting effects?
4. **Reproducibility** - Can other researchers replicate this study?
5. **Ethics** - Are ethical considerations and IRB approval addressed?
6. **Recommendations** - How to strengthen the research design and analysis`;

} else if (pattern.id === 'nextpattern') {

// 5. PATTERN DETECTION (line ~13070)
Available patterns:
- Research Study: Academic research with hypothesis, methodology, and statistical analysis
- Philosophy: Deep philosophical arguments with premises and conclusions
...

Detection hints:
- Research: "hypothesis", "methodology", "p-value", "sample", "IRB", "experiment"
- Philosophy: "argument", "premise", "conclusion"
...
```

### Example 2: Recipe Collection Pattern (Minimal)

```javascript
// 1. PATTERN DEFINITION
recipes: {
    name: 'Recipe Collection',
    icon: '🍳',

    levels: {
        root: 'Cookbook',
        phase: 'Cuisine',
        item: 'Recipe',
        subtask: 'Preparation Step'
    },

    phaseSubtitles: ['Italian', 'Asian', 'Mexican', 'Desserts', 'Appetizers'],

    types: [
        { value: 'breakfast', label: '🌅 Breakfast' },
        { value: 'lunch', label: '🥗 Lunch' },
        { value: 'dinner', label: '🍽️ Dinner' },
        { value: 'dessert', label: '🍰 Dessert' },
        { value: 'snack', label: '🍿 Snack' }
    ],

    description: 'Organize recipes with ingredients, instructions, and cooking notes',

    fields: {
        ingredients: {
            label: 'Ingredients',
            type: 'textarea',
            placeholder: '2 cups flour\n1 cup sugar\n3 eggs\n...',
            helpText: 'List all ingredients with quantities. One per line.'
        },

        instructions: {
            label: 'Instructions',
            type: 'textarea',
            placeholder: '1. Preheat oven to 350°F\n2. Mix dry ingredients...',
            helpText: 'Step-by-step cooking instructions'
        },

        prepTime: {
            label: 'Prep Time (minutes)',
            type: 'number',
            min: 0,
            placeholder: '15',
            helpText: 'Time needed for preparation before cooking'
        },

        cookTime: {
            label: 'Cook Time (minutes)',
            type: 'number',
            min: 0,
            placeholder: '30',
            helpText: 'Active cooking time'
        },

        servings: {
            label: 'Servings',
            type: 'number',
            min: 1,
            placeholder: '4',
            helpText: 'Number of servings this recipe yields'
        },

        difficulty: {
            label: 'Difficulty',
            type: 'select',
            options: ['Easy', 'Medium', 'Hard', 'Expert'],
            helpText: 'Skill level required'
        }
    }
},

// 2. AI REVIEW
recipes: 'You are a professional chef and culinary instructor. Review for recipe clarity, ingredient proportions, cooking technique accuracy, and completeness of instructions.',

// 3. AI SUGGEST
recipes: 'You are a professional chef specializing in recipe development and cooking instruction.',

// 4. AI ANALYSIS
} else if (pattern.id === 'recipes') {
    systemPrompt = `You are a professional chef and culinary instructor with expertise in recipe development.`;

    userPrompt = `Analyze this ${levels.item.toLowerCase()}:

**${levels.item}:** ${item.name}
**Type:** ${item.itemType || 'N/A'}
${item.ingredients ? `**Ingredients:** ${item.ingredients}\n` : ''}
${item.instructions ? `**Instructions:** ${item.instructions}\n` : ''}
${item.prepTime ? `**Prep Time:** ${item.prepTime} min\n` : ''}
${item.cookTime ? `**Cook Time:** ${item.cookTime} min\n` : ''}

Provide a culinary analysis covering:
1. **Recipe Clarity** - Are instructions clear and easy to follow?
2. **Ingredient Balance** - Are proportions and quantities correct?
3. **Technique** - Are cooking methods appropriate and well-explained?
4. **Timing** - Are prep and cook times realistic?
5. **Completeness** - Are there missing steps or ingredients?
6. **Recommendations** - How to improve the recipe`;
}

// 5. PATTERN DETECTION
- Recipes: "ingredients", "cook", "bake", "servings", "prep time"
```

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Skipping AI Integration
**Problem:** Adding pattern definition but forgetting AI Review/Suggest/Analysis
**Result:** Users get generic CFO advice in cooking/fitness/philosophy patterns
**Fix:** ALWAYS add all 4 AI integrations (review, suggest, analysis, detection)

### ❌ Pitfall 2: Vague Field Labels
**Problem:** Labels like "Details", "Info", "Data"
**Result:** Users don't know what to enter
**Fix:** Be specific: "Target Muscle Groups", "Exercise Form Cues", "Progressive Overload Plan"

### ❌ Pitfall 3: Missing helpText
**Problem:** Leaving helpText empty or just repeating the label
**Result:** Users guess at what's expected
**Fix:** Explain what to include and why it matters

### ❌ Pitfall 4: Too Many Fields
**Problem:** Creating 20+ fields because "more is better"
**Result:** Users overwhelmed, forms feel like homework
**Fix:** 5-10 core fields. Ask: "Is this field essential or nice-to-have?"

### ❌ Pitfall 5: Wrong Field Types
**Problem:** Using textarea for a number, or text for a date
**Result:** No validation, messy data
**Fix:** Match field type to data type (number → type: 'number', dates → type: 'date')

### ❌ Pitfall 6: Generic Pattern Names
**Problem:** Naming a pattern "Business" or "General"
**Result:** Users don't understand when to use it
**Fix:** Be specific: "Sales Pipeline", "Marketing Campaign", "Product Roadmap"

### ❌ Pitfall 7: Inconsistent Terminology
**Problem:** Using "Task" in some places, "Action Item" in others
**Result:** Confusing UI
**Fix:** Pick ONE term per level and stick to it (defined in `levels` object)

---

## Deployment Checklist

Before committing a new pattern:

- [ ] Pattern definition complete with all required fields
- [ ] All 4 AI integrations added (Review, Suggest, Analysis, Detection)
- [ ] Tested creating tree with new pattern
- [ ] Tested AI Analysis → domain-specific advice confirmed
- [ ] Tested AI Review → expert persona confirmed
- [ ] Tested AI Suggest → expert persona confirmed
- [ ] Tested pattern detection (if applicable)
- [ ] All fields have clear labels, placeholders, and helpText
- [ ] Icon is relevant and displays correctly
- [ ] Pattern appears in pattern selector dropdown
- [ ] Documentation updated (if creating official pattern)

---

## Quick Reference: Minimum Viable Pattern

**Absolute minimum to ship a functional pattern:**

```javascript
// 1. Pattern definition with 5 fields
yourpattern: {
    name: 'Pattern Name',
    icon: '🎯',
    levels: { root: 'Collection', phase: 'Category', item: 'Entry', subtask: 'Detail' },
    phaseSubtitles: ['Cat 1', 'Cat 2', 'Cat 3'],
    types: [
        { value: 'type1', label: '📄 Type 1' },
        { value: 'type2', label: '📊 Type 2' }
    ],
    description: 'Clear one-sentence description',
    fields: {
        field1: { label: 'Field 1', type: 'text', placeholder: 'Example', helpText: 'Why this matters' },
        field2: { label: 'Field 2', type: 'textarea', placeholder: 'Example', helpText: 'Why this matters' },
        field3: { label: 'Field 3', type: 'select', options: ['A', 'B'], helpText: 'Why this matters' },
        field4: { label: 'Field 4', type: 'number', min: 0, helpText: 'Why this matters' },
        field5: { label: 'Field 5', type: 'date', helpText: 'Why this matters' }
    }
},

// 2. AI Review persona (1 line)
yourpattern: 'You are a [expert role]. Review for [criteria 1], [criteria 2], and [criteria 3].',

// 3. AI Suggest persona (1 line)
yourpattern: 'You are a [expert role] specializing in [domain].',

// 4. AI Analysis prompt (15 lines)
} else if (pattern.id === 'yourpattern') {
    systemPrompt = `You are a [expert role] with expertise in [domain].`;
    userPrompt = `Analyze this ${levels.item.toLowerCase()}:
**${levels.item}:** ${item.name}
**Field 1:** ${item.field1 || 'N/A'}
Provide analysis covering:
1. **Criterion 1** - What to check
2. **Criterion 2** - What to check
3. **Recommendations** - How to improve`;
}
```

**Total time to add minimal pattern:** ~15-20 minutes

---

## Support & Questions

**For AI Assistants:**
- If field structure is unclear, read the existing `philosophy` or `sales` pattern as reference
- If AI integration location is unclear, search for `const reviewExperts` or `function generateAIAnalysis`
- When in doubt, model new patterns after the most similar existing pattern

**For Humans:**
- See `treeplexity.html` source code for complete examples
- All 13 current patterns follow this structure
- Pattern order in code doesn't matter (alphabetical recommended)

---

**Last Updated:** 2025-11-16
**TreeListy Version:** 2.0
**Patterns Currently Supported:** 13 (Philosophy, Sales, Fitness, Event, Strategy, Prompting, Family Tree, Recipe, Decision Tree, Product Roadmap, Marketing Campaign, Lesson Plan, Generic)

