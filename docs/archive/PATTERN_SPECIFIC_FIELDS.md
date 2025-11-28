# Pattern-Specific Field Architecture

**Date**: November 7, 2025
**Feature**: Dynamic field sets tailored to each pattern theme
**Status**: 🚧 IN PROGRESS

---

## The Problem

Current edit dialog uses universal PM/procurement fields that don't fit all themes:

### Current Universal Fields (ALL patterns):
- ❌ **Cost ($)** - Irrelevant to philosophy, academics, book writing, fitness
- ❌ **Alternate Source** - Supply chain concept for infrastructure/hardware
- ❌ **Lead Time** - Procurement timeline, doesn't apply to abstract work
- ✅ **Name, Description, Icon, Type** - Universal, keep these
- ⚠️ **Dependencies** - Useful for some patterns, not all
- ⚠️ **Context Notes** - Universal, but could be renamed per pattern

### Current Subtask-Only PM Fields:
- Status, Assignee, Progress %, Priority
- Start Date, Due Date
- Blocking Issue, Next Steps
- PM Notes, Latest Updates
- These should be **optional** and pattern-specific

---

## The Solution

Add `fields` property to each pattern with theme-appropriate metadata:

### Field Structure

```javascript
fields: {
    // Universal fields (always shown)
    universal: ['name', 'description', 'icon', 'type', 'notes'],

    // Custom fields specific to this pattern
    custom: [
        {
            id: 'fieldKey',
            label: 'Field Label',
            type: 'text' | 'number' | 'textarea' | 'select' | 'date',
            placeholder: 'Help text...',
            helpText: 'Explanation below field',
            options: [...], // for select fields
            showFor: ['item', 'subtask'] // which node types
        }
    ],

    // PM tracking fields (optional)
    includeTracking: true | false,
    trackingFor: ['subtask'] // which node types get PM fields
}
```

---

## Pattern-Specific Field Sets

### 📋 Generic Project (PM-focused)
**Keep all current fields** - this is the PM baseline

**Custom Fields**:
- Cost ($)
- Alternate Source
- Lead Time
- Dependencies
- Full PM tracking for subtasks

---

### 💼 Sales Pipeline
**No procurement fields** - focus on deal tracking

**Custom Fields**:
- **Deal Value ($)** - replaces "Cost"
- **Expected Close Date** - replaces "Lead Time"
- **Lead Source** - Origin of lead (Inbound, Referral, Cold Outreach)
- **Contact Person** - Primary contact name
- **Stage Probability (%)** - Likelihood of closing
- **Competitor Info** - Who else is in the deal
- **Next Action** - Single clear next step

**PM Tracking**: Optional for actions (subtasks)

---

### 🎓 Academic Writing (Thesis/Paper)
**No procurement/cost fields** - focus on content

**Custom Fields**:
- **Word Count** - Current section word count
- **Target Word Count** - Goal length
- **Draft Status** - Outline, First Draft, Revision, Final
- **Sources/Citations** - Number or list of key sources
- **Key Argument** - Main point of this section
- **Evidence Type** - Empirical, Theoretical, Mixed
- **Review Status** - Unreviewed, Peer Reviewed, Advisor Approved
- **Notes** - Research notes, todos

**Dependencies**: Keep (sections depend on other sections)
**PM Tracking**: NO - academic work doesn't fit PM paradigm

---

### 🚀 Product Roadmap
**No cost fields** - focus on features and delivery

**Custom Fields**:
- **Story Points** - Effort estimate
- **Engineering Estimate** - Time estimate
- **User Impact** - High, Medium, Low
- **Technical Risk** - Assessment of complexity
- **Feature Flag** - Name of flag for rollout
- **Target Release** - Q1 2025, Q2 2025, etc.
- **Dependencies** - Keep (features depend on each other)

**PM Tracking**: YES for stories (subtasks) - this IS project work

---

### 📚 Book Writing
**No cost/procurement** - focus on narrative

**Custom Fields**:
- **Word Count** - Current count
- **Target Word Count** - Goal
- **Draft Status** - Outline, First Draft, Revision, Final
- **POV Character** - Whose perspective
- **Scene Setting** - Location, time, mood
- **Plot Function** - Setup, Conflict, Resolution, Transition
- **Chapter Notes** - Writer notes, ideas
- **Revision Priority** - Major rewrite, minor edits, done

**Dependencies**: Could work (chapters follow each other)
**PM Tracking**: NO - creative writing doesn't fit PM

---

### 🎉 Event Planning
**Keep some PM fields** - events are project work

**Custom Fields**:
- **Budget ($)** - replaces "Cost"
- **Vendor/Supplier** - replaces "Alternate Source"
- **Booking Deadline** - replaces "Lead Time"
- **Guest Count** - Expected attendees
- **Location** - Where this happens
- **Responsible Person** - Who's handling it
- **Dependencies** - Keep (activities depend on each other)

**PM Tracking**: YES for tasks - events are time-sensitive projects

---

### 💪 Fitness Program
**No cost/procurement** - focus on exercise specs

**Custom Fields**:
- **Sets** - Number of sets
- **Reps** - Repetitions per set
- **Duration** - Time (e.g., "30 minutes", "45 sec")
- **Intensity Level** - Light, Moderate, High, Max
- **Equipment Needed** - Dumbbells, Barbell, Bodyweight, etc.
- **Form Cues** - Key technique reminders
- **Rest Period** - Time between sets
- **Progression Notes** - How to increase difficulty

**Dependencies**: Could work (exercises in sequence)
**PM Tracking**: NO - fitness tracking ≠ project management

---

### 📊 Strategic Plan
**Keep PM fields** - strategy execution is project work

**Custom Fields**:
- **Investment ($)** - replaces "Cost"
- **Key Metric** - What success looks like
- **Target Value** - Goal for metric
- **Responsible Executive** - C-level owner
- **Strategic Theme** - Growth, Efficiency, Innovation, etc.
- **Risk Level** - Low, Medium, High
- **Dependencies** - Keep

**PM Tracking**: YES for actions - strategy is project work

---

### 📖 Course Design
**No cost fields** - focus on learning

**Custom Fields**:
- **Learning Objectives** - What students will learn
- **Duration** - Class time (e.g., "50 minutes", "2 hours")
- **Difficulty Level** - Beginner, Intermediate, Advanced
- **Prerequisites** - Prior knowledge needed
- **Assessment Type** - Quiz, Assignment, Project, Discussion
- **Resources Needed** - Textbook chapters, videos, materials
- **Homework** - Out-of-class work
- **Notes** - Instructor notes

**Dependencies**: YES (lessons build on each other)
**PM Tracking**: Optional for exercises (subtasks)

---

### 🎬 Film Production
**Has budget** - filmmaking has costs

**Custom Fields**:
- **Budget ($)** - Keep cost concept
- **Shoot Duration** - Time needed to shoot
- **Location** - Where to shoot
- **Cast Required** - Which actors
- **Crew Needed** - Camera, sound, etc.
- **Equipment** - Camera, lighting, props
- **Shot Type** - Wide, Medium, Close-up, etc.
- **Scene Number** - For continuity
- **Dependencies** - Keep (scenes shot in order or not)

**PM Tracking**: YES - film production is project work

---

### 🤔 Philosophy
**No cost/procurement** - pure analysis

**Custom Fields**:
- **Philosopher** - Who made this argument
- **School of Thought** - Rationalism, Empiricism, Phenomenology, etc.
- **Time Period** - Ancient, Medieval, Modern, Contemporary
- **Primary Source** - Original text citation
- **Counterargument** - Main objection
- **Response** - How argument addresses objection
- **Supporting Evidence** - Logical or empirical support
- **Logical Form** - Deductive, Inductive, Abductive
- **Key Terms** - Technical vocabulary defined

**Dependencies**: YES (arguments build on premises)
**PM Tracking**: NO - philosophy is pure analysis

---

## Field Mapping: Universal → Pattern-Specific

| Universal Field | Generic | Sales | Academic | Book | Event | Fitness | Strategy | Course | Film | Philosophy |
|----------------|---------|-------|----------|------|-------|---------|----------|--------|------|------------|
| Cost ($) | Cost | Deal Value | — | — | Budget | — | Investment | — | Budget | — |
| Alternate Source | Alt Source | Competitor | — | — | Vendor | — | — | — | — | Counterargument |
| Lead Time | Lead Time | Close Date | — | — | Deadline | — | Timeline | — | Shoot Duration | — |
| Dependencies | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| PM Tracking | Subtasks | Actions | ❌ | ❌ | Tasks | ❌ | Actions | Exercises | Shots | ❌ |

**Legend**:
- ✅ Include field
- ⚠️ Optional/contextual
- ❌ Exclude field
- — Field doesn't apply, replaced or removed

---

## Implementation Plan

### 1. Add `fields` to PATTERNS Object
Each pattern gets custom field definitions

### 2. Refactor `handleEdit()` Function
- Build field HTML dynamically based on pattern
- Show universal fields first (name, description, icon, type)
- Show custom fields for current pattern
- Show PM tracking conditionally
- Rename field labels per pattern (e.g., "Cost" → "Deal Value")

### 3. Update Save Handlers
- Store custom field values in node object
- Use dynamic keys (e.g., `node.dealValue`, `node.wordCount`)

### 4. Update Excel Export
- Include custom fields in appropriate sheets
- Show pattern-specific columns

### 5. Update AI Suggestions
- Pass pattern context to AI
- Generate suggestions appropriate to theme

---

## Benefits

**Theme Appropriateness**: Each pattern has fields that make sense for its domain

**Reduced Clutter**: No irrelevant fields (philosophy won't show "Alternate Source")

**Better UX**: Users see fields that match their mental model

**Flexibility**: Easy to add new patterns with unique fields

**Maintains Compatibility**: Universal fields (name, description, icon, type) work across all patterns

---

## Next Steps

1. ✅ Design field sets for all 11 patterns
2. 🚧 Add `fields` property to PATTERNS object
3. 🚧 Refactor `handleEdit()` to build dynamic field HTML
4. 🚧 Update save/load/export to handle custom fields
5. ⏳ Test across all patterns

---

**Status**: Architecture designed, ready for implementation
