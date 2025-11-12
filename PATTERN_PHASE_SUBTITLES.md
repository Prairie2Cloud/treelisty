# Pattern-Specific Phase Subtitles

**Date**: November 6, 2025
**Feature**: Phase subtitles now change based on selected pattern
**Status**: ✅ IMPLEMENTED

---

## The Problem

Phase subtitles (Pre-Seed, Seed, Build) were hardcoded startup funding stages that didn't make sense for other themes:
- **Event Planning**: "Pre-Seed" doesn't relate to event stages
- **Academic Writing**: "Seed" has no meaning for thesis chapters
- **Course Design**: "Build" doesn't fit educational units
- **Fitness Program**: Startup terms irrelevant to training phases

---

## The Solution

Added pattern-specific phase subtitles to all 10 patterns:

### Phase Subtitles by Pattern

**📋 Generic Project**: Pre-Seed, Seed, Build
- Keeps startup/project focus for generic use

**💼 Sales Pipeline**: Q1, Q2, Q3, Q4
- Quarterly sales targets

**🎓 Academic Writing**: Introduction, Body, Conclusion
- Classic academic paper structure

**🚀 Product Roadmap**: Q1, Q2, Q3, Q4
- Quarterly product releases

**📚 Book Writing**: Act I, Act II, Act III
- Three-act narrative structure

**🎉 Event Planning**: Pre-Event, Event Day, Post-Event
- Event lifecycle phases

**💪 Fitness Program**: Foundation, Build, Peak
- Training periodization stages

**📊 Strategic Plan**: Planning, Execution, Review
- Strategic management cycle

**📖 Course Design**: Beginning, Middle, Advanced
- Progressive learning levels

**🎬 Film Production**: Pre-Production, Production, Post-Production
- Standard film workflow phases

---

## Implementation

### 1. Pattern Definitions Enhanced
**Lines 1813, 1834, 1856, 1878, 1900, 1922, 1944, 1966, 1988, 2010**

Added `phaseSubtitles` array to each pattern:

```javascript
fitness: {
    name: 'Fitness Program',
    icon: '💪',
    levels: {
        root: 'Program',
        phase: 'Phase',
        item: 'Workout',
        subtask: 'Exercise'
    },
    phaseSubtitles: ['Foundation', 'Build', 'Peak'],
    types: [...]
}
```

### 2. Auto-Update on Pattern Change
**Lines 2081-2087**

Updated `renameNodesForPattern()` to set phase subtitles:

```javascript
} else if (node.type === 'phase') {
    // Update phase name
    for (const term of allPhaseTerms) {
        node.name = node.name.replace(regex, labels.phase);
    }

    // Update phase subtitle based on pattern
    if (PATTERNS[currentPattern].phaseSubtitles && node.phase !== undefined) {
        const phaseIndex = parseInt(node.phase);
        if (!isNaN(phaseIndex) && phaseIndex < PATTERNS[currentPattern].phaseSubtitles.length) {
            node.subtitle = PATTERNS[currentPattern].phaseSubtitles[phaseIndex];
        }
    }
}
```

---

## How It Works

### Phase Index Mapping

Phases are numbered (0, 1, 2, 3...) and map to subtitle array indices:

**Generic Project**:
- Phase 0 → `phaseSubtitles[0]` → "Pre-Seed"
- Phase 1 → `phaseSubtitles[1]` → "Seed"
- Phase 2 → `phaseSubtitles[2]` → "Build"

**Event Planning**:
- Stage 0 → `phaseSubtitles[0]` → "Pre-Event"
- Stage 1 → `phaseSubtitles[1]` → "Event Day"
- Stage 2 → `phaseSubtitles[2]` → "Post-Event"

**Academic Writing**:
- Chapter 0 → `phaseSubtitles[0]` → "Introduction"
- Chapter 1 → `phaseSubtitles[1]` → "Body"
- Chapter 2 → `phaseSubtitles[2]` → "Conclusion"

### Pattern Switch Flow

1. User selects "🎉 Event Planning" from dropdown
2. `applyPattern('event')` is called
3. `renameNodesForPattern()` traverses entire tree
4. For each phase node:
   - Name updated: "Phase 0" → "Stage 0"
   - Subtitle updated: "Pre-Seed" → "Pre-Event"
5. Tree re-renders with new subtitles

---

## Testing Examples

### Test 1: Generic → Event Planning

**Before**:
```
Phase 0 (Pre-Seed)
Phase 1 (Seed)
Phase 2 (Build)
```

**After selecting Event Planning**:
```
Stage 0 (Pre-Event)
Stage 1 (Event Day)
Stage 2 (Post-Event)
```

### Test 2: Event → Academic Writing

**Before**:
```
Stage 0 (Pre-Event)
Stage 1 (Event Day)
Stage 2 (Post-Event)
```

**After selecting Academic Writing**:
```
Chapter 0 (Introduction)
Chapter 1 (Body)
Chapter 2 (Conclusion)
```

### Test 3: Academic → Fitness Program

**Before**:
```
Chapter 0 (Introduction)
Chapter 1 (Body)
Chapter 2 (Conclusion)
```

**After selecting Fitness Program**:
```
Phase 0 (Foundation)
Phase 1 (Build)
Phase 2 (Peak)
```

### Test 4: Sales Pipeline (4 Phases)

**Before** (if you have 4 phases):
```
Phase 0 (Pre-Seed)
Phase 1 (Seed)
Phase 2 (Build)
Phase 3 (?)
```

**After selecting Sales Pipeline**:
```
Quarter 0 (Q1)
Quarter 1 (Q2)
Quarter 2 (Q3)
Quarter 3 (Q4)
```

---

## Edge Cases Handled

### More Phases Than Subtitles

If you have 5 phases but pattern only defines 3 subtitles:
- Phase 0-2: Get pattern subtitles
- Phase 3-4: Keep existing subtitle or show blank

**Solution**: Index check prevents array out of bounds:
```javascript
if (!isNaN(phaseIndex) && phaseIndex < PATTERNS[currentPattern].phaseSubtitles.length) {
    node.subtitle = PATTERNS[currentPattern].phaseSubtitles[phaseIndex];
}
```

### Invalid Phase Number

If phase doesn't have a valid number:
- Subtitle unchanged
- No error thrown

### Custom Pattern

Custom pattern doesn't define `phaseSubtitles`:
- Subtitles remain as user entered them
- No automatic updates

---

## Save/Load Fidelity

### JSON Save
Phase subtitles are saved in the JSON:
```json
{
  "id": "phase-1",
  "name": "Stage 1",
  "subtitle": "Event Day",
  "type": "phase",
  "phase": "1"
}
```

### JSON Load
When loading a saved file:
1. Subtitles load from JSON as-is
2. If pattern is saved, it gets reapplied
3. Subtitles update to match pattern

### Excel Export
Phase subtitles appear in Excel export:
- Phase breakdown shows: "Stage 1 (Event Day)"
- Maintains context across all export sheets

---

## Benefits

**Context-Appropriate**: Each theme now has meaningful phase descriptors
- Sales: Quarterly planning (Q1-Q4)
- Fitness: Training progression (Foundation → Peak)
- Events: Timeline clarity (Pre-Event → Post-Event)

**Automatic Updates**: Switch patterns → subtitles update instantly

**Consistency**: Phase naming and subtitles stay aligned with theme

**Professional**: No more "Pre-Seed" on academic thesis or fitness plans

---

## Files Modified

**treeplexity.html**
- Lines 1813-2022: Added `phaseSubtitles` to all patterns
- Lines 2081-2087: Added subtitle update logic to `renameNodesForPattern()`

**No changes needed to**:
- stubs.json (default subtitles remain, get overwritten on pattern change)
- Excel export (already uses subtitle field)
- JSON save/load (already handles subtitle field)

---

## Summary

**Problem**: Phase subtitles (Pre-Seed, Seed, Build) were startup-specific and didn't fit all themes

**Solution**: Added pattern-specific phase subtitles to all 10 patterns

**Result**: Phase subtitles now auto-update when switching patterns, maintaining thematic consistency

**Example**: Select Event Planning → "Phase 0 (Pre-Seed)" becomes "Stage 0 (Pre-Event)" ✅

---

**Phase subtitles now contextual across all patterns!** 🎯
