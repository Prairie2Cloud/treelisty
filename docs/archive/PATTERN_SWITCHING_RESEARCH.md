# Pattern Switching Research - Mixture of Experts Architecture
**Date:** 2025-11-19
**Purpose:** Research and design for cross-pattern "Mixture of Experts" system
**Goal:** Enable viewing same project through multiple pattern lenses (e.g., Sales → Philosophy → Thesis)

---

## Executive Summary

**Current State:** TreeListy locks each tree to a single pattern at creation. Pattern dropdown exists (line 1585) but has no switching handler.

**Challenge:** Patterns have incompatible field structures:
- Generic: `cost, leadTime, alternateSource`
- Philosophy: `speaker, premise1, premise2, conclusion`
- Film: `videoPrompt, cameraMovement, lightingMood`

**Research Question:** Can we enable pattern switching without data loss or AI confusion?

---

## Part 1: Complete Pattern Field Map

### 1. Generic (📋)
**Core Fields:**
- `cost` (number) - Budget allocated
- `alternateSource` (text) - Backup vendor/supplier
- `leadTime` (text) - Procurement timeline
- `includeDependencies: true`
- `includeTracking: true, trackingFor: ['subtask']`

**Common Fields:** name, description, type, pmStatus

---

### 2. Sales (💼)
**Core Fields:**
- `dealValue` (number) - Potential revenue
- `expectedCloseDate` (date) - Target close date
- `leadSource` (text) - How lead originated
- `contactPerson` (text) - Main decision maker
- `stageProbability` (number, 0-100) - Likelihood of closing
- `competitorInfo` (textarea) - Other vendors
- `includeDependencies: false`
- `includeTracking: true, trackingFor: ['subtask']`

**Common Fields:** name, description, type, pmStatus

---

### 3. Thesis (🎓)
**Core Fields:**
- `wordCount` (number) - Current word count
- `targetWordCount` (number) - Goal word count
- `draftStatus` (select: Outline, First Draft, Revision, Final)
- `citations` (textarea) - Main sources
- `keyArgument` (textarea) - Central claim
- `evidenceType` (select: Empirical, Theoretical, Mixed, N/A)
- `includeDependencies: true`
- `includeTracking: false`

**Common Fields:** name, description, type

---

### 4. Roadmap (🚀)
**Core Fields:**
- `storyPoints` (number) - Effort estimate
- `engineeringEstimate` (text) - Time estimate
- `userImpact` (select: High, Medium, Low)
- `technicalRisk` (select: Low, Medium, High, Unknown)
- `featureFlag` (text) - Feature flag name
- `includeDependencies: true`
- `includeTracking: true, trackingFor: ['subtask']`

**Common Fields:** name, description, type, pmStatus

---

### 5. Book (📚)
**Core Fields:**
- `wordCount` (number) - Current word count
- `targetWordCount` (number) - Goal word count
- `draftStatus` (select: Outline, First Draft, Revision, Final)
- `povCharacter` (text) - POV character
- `sceneSetting` (textarea) - Location, time, mood
- `plotFunction` (select: Setup, Conflict, Resolution, Transition)
- `includeDependencies: true`
- `includeTracking: false`

**Common Fields:** name, description, type

---

### 6. Event (🎉)
**Core Fields:**
- `budget` (number) - Budget for activity
- `vendor` (text) - External vendor/supplier
- `bookingDeadline` (date) - Last date to book
- `guestCount` (number) - Expected attendees
- `location` (text) - Venue, room, area
- `responsiblePerson` (text) - Team member handling
- `includeDependencies: true`
- `includeTracking: true, trackingFor: ['subtask']`

**Common Fields:** name, description, type, pmStatus

---

### 7. Fitness (💪)
**Core Fields:**
- `sets` (number) - Number of sets
- `reps` (text) - Reps per set (8-12, AMRAP)
- `duration` (text) - Time for exercise
- `intensity` (select: Light, Moderate, High, Max)
- `equipment` (text) - Required equipment
- `formCues` (textarea) - Technique reminders
- `restPeriod` (text) - Rest between sets
- `includeDependencies: true`
- `includeTracking: false`

**Common Fields:** name, description, type

---

### 8. Strategy (📊)
**Core Fields:**
- `investment` (number) - Capital investment
- `keyMetric` (text) - Success measurement
- `targetValue` (text) - Goal to achieve
- `responsibleExecutive` (text) - Executive sponsor
- `strategicTheme` (select: Growth, Efficiency, Innovation, Transformation, Risk Mitigation)
- `riskLevel` (select: Low, Medium, High)
- `includeDependencies: true`
- `includeTracking: true, trackingFor: ['subtask']`

**Common Fields:** name, description, type, pmStatus

---

### 9. Course (📖)
**Core Fields:**
- `learningObjectives` (textarea) - Expected outcomes
- `duration` (text) - Class time needed
- `difficultyLevel` (select: Beginner, Intermediate, Advanced)
- `prerequisites` (textarea) - Required background
- `assessmentType` (select: Quiz, Assignment, Project, Discussion, Exam, None)
- `resourcesNeeded` (textarea) - Required materials
- `homework` (textarea) - Out-of-class work
- `includeDependencies: true`
- `includeTracking: true, trackingFor: ['subtask']`

**Common Fields:** name, description, type, pmStatus

---

### 10. Film (🎬)
**Core Fields:**
- `aiPlatform` (select) - Sora, Veo, Runway, Pika, etc.
- `videoPrompt` (textarea) - Text-to-video prompt
- `visualStyle` (select: Photorealistic, Cinematic, Anime, etc.)
- `duration` (select: 2s, 4s, 6s, 10s, 20s, Extended)
- `aspectRatio` (select: 16:9, 9:16, 1:1, 2.39:1, 4:3)
- `cameraMovement` (select: Static, Pan, Dolly, Tracking, etc.)
- `motionIntensity` (select: Minimal, Subtle, Moderate, Dynamic, Intense)
- `lightingMood` (select: Golden Hour, Night, Neon, Dramatic, etc.)
- `iterationNotes` (textarea) - Prompt engineering insights
- `includeDependencies: true`
- `includeTracking: true, trackingFor: ['subtask']`

**Common Fields:** name, description, type, pmStatus

---

### 11. Philosophy (🤔)
**Core Fields:**
- `speaker` (text) - Who makes this claim
- `argumentType` (select: Deductive, Inductive, Abductive, etc.)
- `validity` (select: Valid, Invalid, Sound, Unsound, Uncertain)
- `keyTerms` (text) - Central concepts
- `premise1` (textarea) - First premise
- `premise2` (textarea) - Second premise
- `conclusion` (textarea) - Logical conclusion
- `objection` (textarea) - Main counterargument
- `response` (textarea) - Reply to objection
- `textualReference` (text) - Page reference (Stephanus)
- `philosophicalSchool` (select: Pre-Socratic, Platonic, etc.)
- `includeDependencies: true`
- `includeTracking: false`

**Common Fields:** name, description, type

---

### 12. Prompting (🧠 AI Prompt Design)
**Core Fields:**
- `systemPrompt` (textarea) - AI role definition
- `userPromptTemplate` (textarea) - Main instruction
- `fewShotExamples` (textarea) - 2-3 examples
- `outputFormat` (textarea) - Structured output spec
- `chainOfThought` (textarea) - Reasoning instructions
- `modelTarget` (select: Claude 3.5, GPT-4o, etc.)
- `temperature` (number, 0-1, step 0.1)
- `testResults` (textarea) - Performance metrics
- `testStatus` (select: Draft, Testing, Validated, Production, Deprecated)
- `includeDependencies: true`
- `includeTracking: true, trackingFor: ['subtask']`

**Common Fields:** name, description, type, pmStatus

---

### 13. FamilyTree (👨‍👩‍👧‍👦)
**Core Fields:**
- `fullName` (text) - Complete name
- `maidenName` (text) - Birth surname
- `gender` (select: Male, Female, Other, Unknown)
- `birthDate` (date)
- `birthPlace` (text) - City, state, country
- `livingStatus` (select: Living, Deceased, Unknown)
- `deathDate` (date)
- `deathPlace` (text)
- `marriageDate` (date)
- `marriagePlace` (text)
- `spouseName` (text)
- `occupation` (text)
- `photoURL` (text)
- `dnaInfo` (textarea) - Haplogroup, DNA matches
- `sources` (textarea) - Birth certificates, records
- `relationshipType` (select: Biological, Adopted, Step, etc.)
- `includeDependencies: true`
- `includeTracking: false`

**Common Fields:** name, description, type

---

### 14. Dialogue (💬 Rhetoric Analysis)
**Core Fields:**
- `speaker` (text) - Who makes statement
- `verbatimQuote` (textarea) - Exact words
- `rhetoricalDevice` (select: Logos, Pathos, Ethos, etc.)
- `logicalStructure` (textarea) - Premises → conclusion
- `fallaciesPresent` (textarea) - Ad hominem, straw man, etc.
- `hiddenMotivation` (textarea) - Unstated goals
- `emotionalTone` (select: Calm, Passionate, Angry, etc.)
- `counterargument` (textarea) - Strongest rebuttal
- `evidenceQuality` (select: Strong, Moderate, Weak, None, Misleading)
- `effectivenessRating` (number, 1-10)
- `includeDependencies: true`
- `includeTracking: false`

**Common Fields:** name, description, type

---

### 15. Filesystem (💾)
**Core Fields:**
- `fileSize` (number, bytes)
- `fileExtension` (text) - .pdf, .docx, etc.
- `filePath` (text) - Complete path
- `dateModified` (datetime-local)
- `dateCreated` (datetime-local)
- `fileOwner` (text) - Owner email
- `sharedWith` (textarea) - User list
- `permissions` (select: Read Only, Read/Write, Owner, etc.)
- `driveType` (select: Local, Google Drive, OneDrive, etc.)
- `mimeType` (text) - application/pdf, etc.
- `tags` (text) - Custom tags
- `fileUrl` (text) - Cloud URL
- `isFolder` (checkbox)
- `includeDependencies: false`
- `includeTracking: false`

**Common Fields:** name, description, type

---

### 16. Custom (✏️)
**No Fixed Fields** - User defines all level names

**Common Fields:** name, description, type, pmStatus

---

## Part 2: Universal Fields Analysis

### Universal Fields (ALL Patterns)
These fields exist on EVERY node regardless of pattern:

```javascript
{
    id: string,              // Unique identifier
    name: string,            // Node name (ALWAYS PRESENT)
    description: string,     // Node description (ALWAYS PRESENT)
    type: string,            // Pattern-specific type category
    nodeType: string,        // 'root' | 'phase' | 'item' | 'subtask'
    collapsed: boolean,      // UI state
    children: array,         // Child nodes
    parentId: string,        // Parent reference
    createdAt: timestamp,    // Creation time
    lastModified: timestamp  // Last edit time
}
```

### Common Field: pmStatus (Project Management)
**Patterns with Tracking:**
- Generic, Sales, Roadmap, Event, Strategy, Course, Film, Prompting

```javascript
pmStatus: 'not-started' | 'in-progress' | 'on-hold' | 'completed'
```

**Patterns WITHOUT pmStatus:**
- Thesis, Book, Fitness, Philosophy, FamilyTree, Dialogue, Filesystem

---

## Part 3: Field Type Taxonomy

### By Data Type

**Number Fields (Numeric Values):**
- `cost` (Generic, Event → budget, Strategy → investment)
- `dealValue` (Sales)
- `wordCount` (Thesis, Book)
- `targetWordCount` (Thesis, Book)
- `storyPoints` (Roadmap)
- `stageProbability` (Sales)
- `guestCount` (Event)
- `sets` (Fitness)
- `temperature` (Prompting)
- `effectivenessRating` (Dialogue)
- `fileSize` (Filesystem)

**Date Fields:**
- `expectedCloseDate` (Sales)
- `bookingDeadline` (Event)
- `birthDate, deathDate, marriageDate` (FamilyTree)
- `dateModified, dateCreated` (Filesystem)

**Select/Dropdown Fields:**
- `draftStatus` (Thesis, Book)
- `userImpact` (Roadmap)
- `intensity` (Fitness)
- `difficultyLevel` (Course)
- `aiPlatform` (Film)
- `argumentType` (Philosophy)
- `rhetoricalDevice` (Dialogue)

**Textarea Fields (Long Text):**
- `competitorInfo` (Sales)
- `citations` (Thesis)
- `sceneSetting` (Book)
- `videoPrompt` (Film)
- `premise1, premise2, conclusion` (Philosophy)
- `systemPrompt` (Prompting)
- `verbatimQuote` (Dialogue)

---

## Part 4: Pattern Compatibility Matrix

### Field Semantic Groups

#### Group A: Financial/Monetary
- Generic: `cost`
- Sales: `dealValue`
- Event: `budget`
- Strategy: `investment`

**Translation Potential:** ✅ HIGH - All represent monetary values

---

#### Group B: Writing/Content Creation
- Thesis: `wordCount, targetWordCount, draftStatus`
- Book: `wordCount, targetWordCount, draftStatus, povCharacter, sceneSetting`
- Philosophy: `premise1, premise2, conclusion, speaker`
- Dialogue: `speaker, verbatimQuote`

**Translation Potential:** ✅ HIGH - All involve textual content creation

---

#### Group C: Project Planning
- Generic: `cost, leadTime, alternateSource`
- Sales: `dealValue, expectedCloseDate, stageProbability`
- Roadmap: `storyPoints, engineeringEstimate, userImpact`
- Strategy: `investment, keyMetric, targetValue`

**Translation Potential:** ✅ MEDIUM - Similar planning concepts, different terminology

---

#### Group D: Creative Production
- Film: `videoPrompt, cameraMovement, lightingMood`
- Book: `sceneSetting, povCharacter, plotFunction`
- Course: `learningObjectives, duration, difficultyLevel`

**Translation Potential:** ⚠️ MEDIUM - Some conceptual overlap (scenes vs lessons)

---

#### Group E: Analytical/Research
- Philosophy: `argumentType, validity, premise1, premise2`
- Dialogue: `rhetoricalDevice, logicalStructure, fallaciesPresent`
- Thesis: `keyArgument, evidenceType, citations`

**Translation Potential:** ✅ HIGH - Strong conceptual overlap (logic, evidence, arguments)

---

#### Group F: Specialized/Unique
- Fitness: `sets, reps, equipment, formCues`
- FamilyTree: `birthDate, deathDate, dnaInfo`
- Filesystem: `fileSize, fileExtension, mimeType`
- Prompting: `systemPrompt, fewShotExamples, temperature`

**Translation Potential:** ❌ LOW - Highly domain-specific

---

## Part 5: Universal Data Model Design

### Proposed Architecture: Three-Layer Model

```javascript
// LAYER 1: Universal Core (ALL nodes)
const universalNode = {
    // Identity
    id: string,
    name: string,
    description: string,
    nodeType: 'root' | 'phase' | 'item' | 'subtask',

    // Tree Structure
    parentId: string | null,
    children: array,
    collapsed: boolean,

    // Metadata
    createdAt: timestamp,
    lastModified: timestamp,

    // Pattern Context
    originalPattern: string,        // Pattern where node was created
    currentViewPattern: string,     // Current pattern lens
    patternHistory: array,          // Track all patterns applied

    // LAYER 2: Pattern-Agnostic Fields (shared across many patterns)
    commonFields: {
        type: string,               // Pattern-specific type category
        pmStatus: string,           // Project tracking (if applicable)
        monetaryValue: number,      // Maps to: cost, dealValue, budget, investment
        timeEstimate: string,       // Maps to: leadTime, engineeringEstimate, duration
        probability: number,        // Maps to: stageProbability, technicalRisk
        personName: string,         // Maps to: contactPerson, speaker, povCharacter
        textContent: string,        // Maps to: keyArgument, videoPrompt, verbatimQuote
        wordCount: number,          // Maps to: wordCount (Thesis/Book)
        targetWordCount: number,    // Maps to: targetWordCount (Thesis/Book)
        draftStatus: string,        // Maps to: draftStatus (Thesis/Book)
        impact: string,             // Maps to: userImpact, strategicTheme
        risk: string                // Maps to: technicalRisk, riskLevel
    },

    // LAYER 3: Pattern-Specific Data (original fields preserved)
    patternData: {
        generic: { cost, alternateSource, leadTime },
        sales: { dealValue, expectedCloseDate, leadSource, contactPerson, stageProbability, competitorInfo },
        philosophy: { speaker, argumentType, premise1, premise2, conclusion, objection, response },
        film: { videoPrompt, cameraMovement, lightingMood, aiPlatform },
        // ... all other patterns
    }
};
```

---

## Part 6: Pattern Translation Rules

### Translation Strategy: Bi-Directional Mapping

#### Example 1: Generic → Philosophy

**Node in Generic Pattern:**
```javascript
{
    name: "Secure Funding",
    description: "Obtain $5M Series A from VCs",
    type: "corporate",
    cost: 5000000,
    leadTime: "6-9 months",
    alternateSource: "Bank loan or strategic partner"
}
```

**After Translation to Philosophy:**
```javascript
{
    name: "Secure Funding",
    description: "Obtain $5M Series A from VCs",
    type: "premise",  // AUTO-MAPPED: corporate → premise

    // COMMON FIELDS (preserved)
    commonFields: {
        monetaryValue: 5000000,      // FROM cost
        timeEstimate: "6-9 months",  // FROM leadTime
        personName: "",              // EMPTY (no equivalent)
    },

    // PATTERN-SPECIFIC (Philosophy fields now editable)
    patternData: {
        philosophy: {
            speaker: "",  // USER CAN FILL
            argumentType: "Inductive",  // USER CAN FILL
            premise1: "Obtaining $5M Series A funding from VCs",  // AUTO-POPULATED from description
            premise2: "Timeline: 6-9 months with backup options",  // AUTO-GENERATED from leadTime + alternateSource
            conclusion: "",  // USER CAN FILL
            objection: "",
            response: "",
            validity: "Uncertain",
            keyTerms: "funding, VCs, Series A",
            textualReference: "",
            philosophicalSchool: "Pragmatist"
        }
    }
}
```

**Translation Rules Applied:**
1. `name` → PRESERVED
2. `description` → PRESERVED
3. `type: "corporate"` → `type: "premise"` (heuristic mapping)
4. `cost` → `commonFields.monetaryValue`
5. `leadTime` → `commonFields.timeEstimate`
6. `description` → AUTO-POPULATE `premise1`
7. `leadTime + alternateSource` → AUTO-GENERATE `premise2`

---

#### Example 2: Sales → Philosophy

**Node in Sales Pattern:**
```javascript
{
    name: "Acme Corp - Enterprise Deal",
    description: "Full platform deployment for Acme Corp (500 seats)",
    type: "enterprise",
    dealValue: 250000,
    expectedCloseDate: "2025-12-15",
    leadSource: "Inbound - Conference",
    contactPerson: "Sarah Chen, VP Engineering",
    stageProbability: 75,
    competitorInfo: "Competing against Competitor X and Competitor Y"
}
```

**After Translation to Philosophy:**
```javascript
{
    name: "Acme Corp - Enterprise Deal",
    description: "Full platform deployment for Acme Corp (500 seats)",
    type: "premise",

    commonFields: {
        monetaryValue: 250000,
        timeEstimate: "2025-12-15",
        personName: "Sarah Chen",
        probability: 75,
        textContent: "Full platform deployment for Acme Corp (500 seats)"
    },

    patternData: {
        philosophy: {
            speaker: "Sarah Chen",  // AUTO-MAPPED from contactPerson
            argumentType: "Inductive",
            premise1: "Acme Corp requires enterprise platform deployment (500 seats)",  // FROM description
            premise2: "Deal value: $250,000 with 75% close probability",  // FROM dealValue + stageProbability
            conclusion: "Expected close: December 2025",  // FROM expectedCloseDate
            objection: "Competing against Competitor X and Competitor Y",  // FROM competitorInfo
            response: "",  // USER FILLS
            validity: "Uncertain",
            keyTerms: "enterprise, platform, deployment",
            textualReference: "",
            philosophicalSchool: "Pragmatist"
        }
    }
}
```

---

#### Example 3: Philosophy → Film

**Node in Philosophy Pattern:**
```javascript
{
    name: "Socrates' Elenchus",
    description: "Socrates refutes Meno's initial definition of virtue",
    type: "refutation",
    speaker: "Socrates",
    argumentType: "Socratic Elenchus",
    premise1: "Meno claims virtue is the ability to rule over men",
    premise2: "But slaves and children cannot rule, yet must have virtue",
    conclusion: "Therefore, Meno's definition fails",
    objection: "Virtue might vary by person's role",
    response: "But then there is no single essence of virtue",
    validity: "Valid",
    keyTerms: "virtue, definition, elenchus",
    philosophicalSchool: "Platonic"
}
```

**After Translation to Film:**
```javascript
{
    name: "Socrates' Elenchus",
    description: "Socrates refutes Meno's initial definition of virtue",
    type: "dialogue",  // refutation → dialogue

    commonFields: {
        personName: "Socrates",
        textContent: "Socrates refutes Meno's initial definition of virtue"
    },

    patternData: {
        film: {
            aiPlatform: "Sora (OpenAI)",
            videoPrompt: "Ancient Greek agora, late afternoon. Socrates (elderly philosopher in simple robes) debates with Meno (young nobleman in fine garments). Close-up on Socrates' face as he raises a questioning finger. Meno looks confused and frustrated. Marble columns in background. Photorealistic, cinematic style.",  // AUTO-GENERATED from description + speaker + scene context
            visualStyle: "Cinematic",
            duration: "10 seconds",
            aspectRatio: "16:9 (Widescreen)",
            cameraMovement: "Slow Pan",  // AUTO-SELECTED based on dialogue type
            motionIntensity: "Subtle",   // AUTO-SELECTED (philosophical debate = subtle)
            lightingMood: "Golden Hour", // AUTO-SELECTED (ancient Greece = golden hour)
            iterationNotes: "Original dialogue: Meno 71e-73c. Focus on Socrates' questioning technique."  // FROM textualReference + keyTerms
        }
    }
}
```

---

## Part 7: Implementation Challenges

### Challenge 1: Field Mapping Ambiguity

**Problem:** Many-to-many relationships between fields across patterns.

**Example:**
- `cost` (Generic) could map to:
  - `dealValue` (Sales)
  - `budget` (Event)
  - `investment` (Strategy)
  - OR... none of the above?

**Solution:**
- Use **commonFields.monetaryValue** as intermediary
- Store original field name in metadata
- Allow manual override during translation

---

### Challenge 2: Data Loss During Translation

**Problem:** Lossy conversions when patterns have non-overlapping fields.

**Example:** Philosophy → Fitness
- Philosophy has: `premise1, premise2, conclusion`
- Fitness has: `sets, reps, equipment`
- NO semantic overlap!

**Solution:**
1. **Preserve Original:** Keep `patternData[originalPattern]` intact
2. **Smart Defaults:** Populate new fields with sensible defaults or empty values
3. **User Prompt:** "This pattern has fields not present in Fitness. Would you like to map them manually?"

---

### Challenge 3: AI Prompt Adaptation

**Problem:** `buildPatternExpertPrompt()` expects specific fields.

**Current Code (line 9397-9422):**
```javascript
if (pattern === 'philosophy') {
    prompt += `Speaker: ${node.speaker}\n`;
    prompt += `Argument Type: ${node.argumentType}\n`;
    prompt += `Premise 1: ${node.premise1}\n`;
}
```

**Issue:** If node was originally Generic, it has NO `speaker` or `premise1` fields!

**Solution:**
1. **Check Original Pattern:** AI prompt should know node's translation history
2. **Fallback to Common Fields:** If `node.speaker` is empty, use `commonFields.personName`
3. **Translation Context:** Add note to AI: "This node was translated from Generic pattern"

---

### Challenge 4: UI Complexity

**Problem:** How does user trigger pattern switch?

**Current State:**
- Pattern dropdown exists (line 1585)
- No event handler for pattern change

**Proposed UX:**

**Option A: Pattern Switch Dialog**
```
User clicks pattern dropdown
→ Modal appears: "Switch to Philosophy?"
→ Preview translation: "3 fields will be preserved, 5 fields will be generated"
→ User confirms
→ Tree re-renders with new pattern
```

**Option B: Multi-Lens View (Advanced)**
```
User clicks "Add Pattern Lens"
→ Tree now shows BOTH Generic AND Philosophy views side-by-side
→ Changes in one lens update the other
→ Like viewing same data through 2 filters
```

---

## Part 8: Recommended Implementation Plan

### Phase 1: Universal Data Model (Week 1-2)
1. ✅ Complete pattern field mapping (THIS DOCUMENT)
2. Add `commonFields` object to node structure
3. Add `patternData` object to store all pattern-specific fields
4. Add `originalPattern` and `patternHistory` tracking
5. Update `saveJSON()` to include new fields
6. Update `loadJSON()` to migrate old nodes to new structure

### Phase 2: Translation Layer (Week 3-4)
1. Create `translateNode(node, fromPattern, toPattern)` function
2. Define translation rules for each pattern pair (16 x 16 = 256 rules!)
   - Start with high-priority pairs:
     - Generic ↔ Sales ↔ Strategy (business planning)
     - Philosophy ↔ Dialogue ↔ Thesis (analytical writing)
     - Film ↔ Book (storytelling)
3. Implement field mapping with fallbacks
4. Test lossy conversions and data preservation

### Phase 3: AI Prompt Adaptation (Week 5)
1. Update `buildPatternExpertPrompt()` to handle translated nodes
2. Add translation context to AI prompts
3. Add continuity checks for translated nodes
4. Test Smart Suggest with pattern-switched nodes

### Phase 4: UI Implementation (Week 6-7)
1. Add event listener to pattern dropdown (line 1585)
2. Create "Switch Pattern" confirmation dialog
3. Show translation preview (fields preserved vs generated)
4. Update UI to reflect new pattern fields
5. Test pattern switching across all 16 patterns

### Phase 5: Advanced Features (Week 8+)
1. Multi-lens view (split-screen with 2 pattern views)
2. Pattern recommendation engine ("This tree would work well as Philosophy")
3. Bulk pattern translation (switch entire subtree)
4. Pattern switching undo/redo

---

## Part 9: Proof of Concept - High-Value Pattern Pairs

### Tier 1: Immediate Value (Implement First)

**1. Generic ↔ Sales ↔ Strategy**
- **Use Case:** Transform CAPEX project into sales pipeline into strategic plan
- **Translation Quality:** ✅ HIGH (all have monetary, timeline, and risk fields)
- **Complexity:** LOW (field overlap is strong)

**2. Philosophy ↔ Dialogue ↔ Thesis**
- **Use Case:** Analyze philosophical dialogue → Structure as thesis → Identify rhetoric
- **Translation Quality:** ✅ HIGH (all involve arguments, evidence, logic)
- **Complexity:** MEDIUM (need to map premise1/premise2 ↔ verbatimQuote ↔ keyArgument)

**3. Film ↔ Book**
- **Use Case:** Write book scenes → Generate AI video prompts
- **Translation Quality:** ✅ HIGH (both storytelling formats)
- **Complexity:** MEDIUM (sceneSetting ↔ videoPrompt, povCharacter ↔ cameraMovement)

---

### Tier 2: Moderate Value

**4. Roadmap ↔ Strategy**
- **Use Case:** Product features → Strategic initiatives
- **Translation Quality:** ✅ MEDIUM (storyPoints ↔ investment, userImpact ↔ strategicTheme)

**5. Sales ↔ Event**
- **Use Case:** Sales deals → Event activities (conferences, launches)
- **Translation Quality:** ✅ MEDIUM (dealValue ↔ budget, contactPerson ↔ responsiblePerson)

---

### Tier 3: Low Value (Skip for Now)

**6. Fitness ↔ Philosophy** ❌ No semantic overlap
**7. FamilyTree ↔ Film** ❌ No semantic overlap
**8. Filesystem ↔ Dialogue** ❌ No semantic overlap

---

## Part 10: Success Metrics

### How Do We Know Pattern Switching Works?

**Metric 1: Data Preservation**
- Goal: ≥95% of data preserved after round-trip translation
- Test: Generic → Philosophy → Generic (all fields intact?)

**Metric 2: AI Coherence**
- Goal: AI Smart Suggest generates appropriate suggestions for translated nodes
- Test: Translate Sales node to Philosophy, run Smart Suggest, verify output makes sense

**Metric 3: User Comprehension**
- Goal: Users understand translation and don't feel confused
- Test: User testing with translation preview UI

**Metric 4: Performance**
- Goal: Translation happens instantly (<100ms for single node)
- Test: Benchmark `translateNode()` on large trees

---

## Part 11: Open Questions

### Questions for User/Stakeholders:

1. **Translation Trigger:** Should pattern switching apply to:
   - [ ] Single node only?
   - [ ] Node + all children (subtree)?
   - [ ] Entire tree?

2. **Data Loss Tolerance:** If translation loses data (e.g., Fitness → Philosophy), should we:
   - [ ] Warn user but allow it?
   - [ ] Block translation entirely?
   - [ ] Store original data invisibly for potential revert?

3. **AI Behavior:** When AI Smart Suggest encounters a translated node, should it:
   - [ ] Treat it as native pattern (ignore translation history)?
   - [ ] Be aware of translation and adapt suggestions?
   - [ ] Warn user that node was translated?

4. **UI Priority:** Which UI approach is preferred?
   - [ ] Option A: Simple dropdown with confirmation dialog
   - [ ] Option B: Advanced multi-lens split-screen view
   - [ ] Option C: Right-click context menu "View as..."

5. **Phase Gating:** Should we build this feature in phases?
   - [ ] Phase 1: Core translation (Generic ↔ Sales ↔ Strategy only)
   - [ ] Phase 2: Add more patterns (Philosophy, Film, Book)
   - [ ] Phase 3: Advanced multi-lens view

---

## Conclusion

**Pattern switching is architecturally feasible** but requires:
1. ✅ Universal data model (3-layer architecture)
2. ✅ Translation layer (256 pattern-pair rules)
3. ✅ AI prompt adaptation (handle translated nodes)
4. ✅ UI for pattern switching (event handler + confirmation dialog)

**Recommendation:**
- Start with **Tier 1 pattern pairs** (Generic/Sales/Strategy and Philosophy/Dialogue/Thesis)
- Implement **3-layer data model** first
- Build **translation layer** with high-value mappings
- Test thoroughly before expanding to all 16 patterns

**Estimated Effort:** 6-8 weeks for full implementation, 2-3 weeks for Tier 1 POC

---

**Next Steps:**
1. ✅ Review this research document
2. ⏸️ Decide which pattern pairs to prioritize
3. ⏸️ Design universal data model schema
4. ⏸️ Implement translation layer for Tier 1 patterns
5. ⏸️ Update UI with pattern switching handler

---

**Document Status:** ✅ Research Complete - Awaiting Stakeholder Review
