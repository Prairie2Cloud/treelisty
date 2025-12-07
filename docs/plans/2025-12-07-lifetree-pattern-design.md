# LifeTree Pattern Design

**Date:** 2025-12-07
**Status:** Design Complete
**Pattern:** New biographical timeline pattern for TreeListy

---

## Overview

LifeTree is a biographical timeline pattern for documenting and exploring a person's life story. It enables collaborative family sessions (e.g., building Mom's life story with siblings), solo autobiographical work, and historical biographies (e.g., Plato).

### Core Use Cases
- Live collaborative session with family members contributing memories
- Async autobiographical journaling with AI as gentle interviewer
- Historical biography research with AI providing context
- Photo/document import triggering memory capture

---

## Structure

### Hierarchy

| Level | Name | Example |
|-------|------|---------|
| Root | Life | "Mom's Life" |
| Phase | Decade | 1950s, 1960s, 1970s... |
| Item | Event | "Met Dad at Polish church dance" |
| Subtask | Detail | "She wore a blue dress" |

### Orientation
- **Left-to-right timeline** (leverages existing Canvas layout)
- Birth on left, present/death on right
- Decades as phases, auto-generated from birth year

### Hyperedge Overlays
Same events can be viewed through multiple lenses:
- **Eras**: Life stages spanning decades (Childhood, College Years, Career)
- **Chapters**: User-named narrative arcs ("The Brooklyn Years", "When We Lived in California")

---

## Initialization Flow

1. **Subject name** (required) - "Who is this LifeTree for?"
2. **Birth year** (required) - Can be approximate ("~428 BC" for Plato)
3. **Still living?** - Yes/No
4. **Death year** (if not living) - Required
5. **Core family prompts**:
   - Parents' names
   - Siblings
   - Spouse(s)
   - Children

Decades auto-generate from birth year through present (or death year).

---

## Event Fields

| Field | Type | Notes |
|-------|------|-------|
| **When** | text (flexible) | "Summer 1965", "age 7", "before we moved to Queens" |
| **Age** | computed | Auto-calculated from birth year |
| **Where** | text | Location of event |
| **Who** | text → links | People involved, links to people list |
| **Feeling** | select | Joyful, Proud, Bittersweet, Difficult, Routine, Milestone |
| **Remembered by** | text | Source/contributor (Mom, sister, family letter) |
| **Certainty** | select | Exact, Approximate, Family legend |
| **Historical context** | computed | AI-generated world events for that time |
| **Location context** | computed | AI-generated local context (neighborhood, era) |
| **Photo/Document** | attachment | Media URL or file |

### Event Types
- Birth
- Family
- Education
- Career
- Relationship
- Residence/Move
- Health
- Milestone
- Loss
- Travel
- Achievement
- Memory/Story

---

## People System

### Dual Model
1. **People list (metadata)** - For filtering, relationship map, quick reference
2. **Timeline events** - Major relationships appear as milestone events

### Data Structure
```javascript
lifetree.people = [
    {
        id: 'p1',
        name: 'Stanley',
        relationship: 'father',
        yearsActive: '1952-1998',
        notes: ''
    },
    ...
]
```

### Core Family (Prompted on Creation)
- Parents
- Siblings
- Spouse(s)
- Children

### Emerging People
As events are added, AI detects new names:
- "Aunt Rose" → "Is Rose your mother's sister or father's sister?"
- "friend Betty" → "Who was Betty? When did they meet?"

### Relationship Views (Future Features)
1. **Timeline presence** - Who was active in each era (like a Gantt chart)
2. **Network graph** - Subject at center, people radiating out
3. **People panel** - Sidebar list, click to filter timeline

---

## Date Handling

Flexible natural language input, AI parses:

| Input | Parsed As |
|-------|-----------|
| "March 15, 1965" | Exact date |
| "Summer 1965" | June-August 1965 range |
| "1965" | Year only |
| "Mid-1960s" | ~1964-1966 |
| "When I was about 7" | Calculated from birth year |
| "Before we moved to Queens" | Relative to anchor event (AI asks when the move was) |

Confidence field captures certainty: Exact / Approximate / Family legend

---

## TreeBeard Biographer Modes

### Mode Definitions

| Mode | Use Case | AI Behavior |
|------|----------|-------------|
| **Guided Interview** | Solo/async autobiographical work | Asks one question at a time, patient, subtle, gentle |
| **Open Listening** | Deep storytelling, emotional processing | Minimal interruption, absorbs story, extracts events after |
| **Timeline Scaffolding** | Live collab sessions | Rapid anchor points: "Major moves? Marriages? Jobs?" |
| **Artifact Import** | Photos, letters, documents | Curious archivist: "What am I looking at? When was this?" |

### Mode Selection
- **Auto-detect** based on input type (default)
- Subtle mode indicator shows current mode
- User can override by clicking indicator or saying "switch to interview mode"

### Auto-Detection Logic
- Photo/file dropped → Artifact Import mode
- Long text pasted → Open Listening mode
- Short input or question → Guided Interview mode
- Collab session or "build structure" → Timeline Scaffolding mode

---

## Quick-Add Input

In LifeTree pattern, TreeBeard input adapts:

**Normal TreeBeard:**
```
"Ask TreeBeard anything..."
```

**LifeTree mode:**
```
"Add a memory, photo, or ask TreeBeard..." [camera icon]
```

Same input, context-aware handling. Memories are integrated, not treated as questions.

### Example Flow
```
User: "Mom met Dad at a dance at the Polish church hall"

TreeBeard:
├── Extracts: event type (relationship), people (Mom, Dad)
├── Asks: "Roughly when was this?"
├── User: "She was maybe 19 or 20"
├── AI: Calculates ~1958-1959, places in 1950s decade
├── AI: "Was this in Brooklyn?"
├── User: "Yes, Greenpoint"
├── AI: Generates location context (Polish community in Greenpoint 1950s)
├── Creates event, slots into timeline
└── "Got it! Want to add more about how they met?"
```

---

## Pattern Definition

```javascript
lifetree: {
    name: 'LifeTree',
    icon: '🌳',
    levels: {
        root: 'Life',
        phase: 'Decade',
        item: 'Event',
        subtask: 'Detail'
    },
    phaseSubtitles: [], // Auto-generated from birth year
    types: [
        { value: 'birth', label: 'Birth' },
        { value: 'family', label: 'Family' },
        { value: 'education', label: 'Education' },
        { value: 'career', label: 'Career' },
        { value: 'relationship', label: 'Relationship' },
        { value: 'residence', label: 'Residence/Move' },
        { value: 'health', label: 'Health' },
        { value: 'milestone', label: 'Milestone' },
        { value: 'loss', label: 'Loss' },
        { value: 'travel', label: 'Travel' },
        { value: 'achievement', label: 'Achievement' },
        { value: 'memory', label: 'Memory/Story' }
    ],
    description: 'Biographical timeline for a life story',
    fields: {
        eventDate: {
            label: 'When',
            type: 'text',
            placeholder: 'March 1965, Summer 1952, age 7...',
            helpText: 'Date or approximate time'
        },
        age: {
            label: 'Age',
            type: 'number',
            computed: true,
            helpText: 'Auto-calculated from birth year'
        },
        location: {
            label: 'Where',
            type: 'text',
            placeholder: 'Brooklyn, NY...',
            helpText: 'Location of this event'
        },
        people: {
            label: 'Who',
            type: 'text',
            placeholder: 'Dad, Aunt Rose, friend Betty...',
            helpText: 'People involved'
        },
        emotion: {
            label: 'Feeling',
            type: 'select',
            options: ['Joyful', 'Proud', 'Bittersweet', 'Difficult', 'Routine', 'Milestone'],
            helpText: 'Emotional tone'
        },
        source: {
            label: 'Remembered by',
            type: 'text',
            placeholder: 'Mom, sister, family letter...',
            helpText: 'Who contributed this memory'
        },
        confidence: {
            label: 'Certainty',
            type: 'select',
            options: ['Exact', 'Approximate', 'Family legend'],
            helpText: 'How certain is this?'
        },
        historicalContext: {
            label: 'Historical Context',
            type: 'textarea',
            computed: true,
            helpText: 'AI-generated world events'
        },
        locationContext: {
            label: 'Location Context',
            type: 'textarea',
            computed: true,
            helpText: 'AI-generated local context'
        },
        mediaUrl: {
            label: 'Photo/Document',
            type: 'text',
            placeholder: 'URL or attachment...',
            helpText: 'Attach image or document'
        },
        includeDependencies: false,
        includeTracking: false
    },
    // LifeTree-specific metadata
    requiresBirthYear: true,
    supportsDeathYear: true,
    autoGenerateDecades: true
}
```

---

## Stretch Goals (Future Phases)

### Phase 2: Relationship Visualization
- Timeline presence view (who was active when)
- Network graph (subject at center)
- People panel with filtering

### Phase 3: Map Integration
- Location pins for residence/moves
- Travel routes visualization
- Historical maps for context

### Phase 4: Export & Storytelling
- Narrative export (book-style prose from AI)
- Integration with Veo/Sora patterns for biographical film
- Story → Theme → Scenes → Shots pipeline

---

## Implementation Notes

### Leverages Existing TreeListy
- Left-to-right Canvas layout (no changes needed)
- Hyperedge system for Eras/Chapters
- TreeBeard chat for input
- Pattern field system
- Collaboration (Firebase sync for family sessions)

### New Components Required
1. Birth year initialization flow
2. Decade auto-generation from birth year
3. Flexible date parsing (AI-assisted)
4. People list data structure
5. Biographer mode detection
6. Context generation prompts (historical/location)

---

## Open Questions

1. **BC dates**: How to handle historical figures with BC birth years? (e.g., Plato ~428 BC)
2. **Media storage**: Where do photos/documents get stored? (Local? Cloud?)
3. **Privacy**: LifeTrees contain sensitive data - any special handling?

---

*Design completed through collaborative brainstorming session, 2025-12-07*
