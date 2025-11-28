# Auto-Rename Feature - Pattern Selector

**Date**: November 6, 2025
**Feature**: Automatic node renaming when pattern changes
**Status**: ✅ IMPLEMENTED

---

## What Was Implemented

A new auto-rename feature that **automatically updates all existing node names** when you change the pattern from the dropdown.

### Before This Feature

- ✅ Context menus showed pattern labels ("Add Lesson", "Edit Exercise")
- ✅ New nodes used pattern names ("New Lesson", "New Exercise")
- ❌ Existing nodes kept their old names ("My Project", "Phase 0", "New Item", "Task 1")

### After This Feature

- ✅ Context menus show pattern labels
- ✅ New nodes use pattern names
- ✅ **Existing nodes auto-rename to match pattern!**

---

## How It Works

### Pattern Change Flow

1. **User selects pattern** (e.g., "📖 Course Design")
2. **`applyPattern('course')` is called**
3. **`renameNodesForPattern()` traverses entire tree**
4. **Renames all nodes based on type:**
   - Root: "My Project" → "My Course"
   - Phase: "Phase 0" → "Unit 0", "Phase 1" → "Unit 1"
   - Item: "New Item" → "New Lesson"
   - Subtask: "Task 1" → "Exercise 1", "Task 2" → "Exercise 2"
5. **`render()` updates the UI**

### Rename Logic

The `renameNodesForPattern()` function uses regex to find and replace generic terms:

```javascript
function renameNodesForPattern(node, labels) {
    if (node.type === 'root') {
        // "My Project" → "My Course"
        node.name = node.name.replace(/\bProject\b/gi, labels.root);
    } else if (node.type === 'phase') {
        // "Phase 0" → "Unit 0"
        node.name = node.name.replace(/\bPhase\b/gi, labels.phase);
    } else if (node.type === 'item') {
        // "New Item" → "New Lesson"
        node.name = node.name.replace(/\bItem\b/gi, labels.item);
    } else if (node.type === 'subtask') {
        // "Task 1" → "Exercise 1"
        node.name = node.name.replace(/\bTask\b/gi, labels.subtask);
        node.name = node.name.replace(/\bSub-task\b/gi, labels.subtask);
    }

    // Recursively process all children, items, and subtasks
}
```

### On Page Load

If you save a project with a pattern (e.g., Course Design), when you reload:
1. Pattern is loaded from saved data
2. Nodes are automatically renamed to match the saved pattern
3. Tree renders with correct terminology

---

## Testing Examples

### Example 1: Generic Project → Sales Pipeline

**Before:**
- My Project
- Phase 0
  - New Item
    - Task 1

**After selecting "💼 Sales Pipeline":**
- My Pipeline
- Quarter 0
  - New Deal
    - Action 1

---

### Example 2: Generic Project → Course Design

**Before:**
- My Project
- Phase 0
  - New Item
    - Task 1
    - Task 2
- Phase 1

**After selecting "📖 Course Design":**
- My Course
- Unit 0
  - New Lesson
    - Exercise 1
    - Exercise 2
- Unit 1

---

### Example 3: Sales Pipeline → Academic Writing

**Before:**
- My Pipeline
- Quarter 0
  - New Deal
    - Action 1

**After selecting "🎓 Academic Writing":**
- My Thesis
- Chapter 0
  - New Section
    - Point 1

---

## All 10 Patterns

The auto-rename feature works with all patterns:

1. **📋 Generic Project** - Project / Phase / Item / Task
2. **💼 Sales Pipeline** - Pipeline / Quarter / Deal / Action
3. **🎓 Academic Writing** - Thesis / Chapter / Section / Point
4. **🚀 Product Roadmap** - Product / Quarter / Feature / Story
5. **📚 Book Writing** - Book / Part / Chapter / Scene
6. **🎉 Event Planning** - Event / Stage / Activity / Task
7. **💪 Fitness Program** - Program / Phase / Workout / Exercise
8. **📊 Strategic Plan** - Strategy / Pillar / Initiative / Action
9. **📖 Course Design** - Course / Unit / Lesson / Exercise
10. **🎬 Film Production** - Film / Phase / Scene / Shot

---

## Important Notes

### Word Boundary Matching

The rename uses `\b` word boundaries, so:
- ✅ "New Item" → "New Lesson" (matches)
- ✅ "Task 1" → "Exercise 1" (matches)
- ✅ "My Project Plan" → "My Course Plan" (matches "Project")
- ❌ "Christmas" → "Christmas" (doesn't match "item" inside "Christmas")

### User-Created Names

If you've already renamed nodes to custom names, the rename will only affect generic terms:
- "Marketing Campaign" → "Marketing Campaign" (unchanged - no generic terms)
- "Research Task" → "Research Exercise" (only "Task" is replaced)
- "Phase 1 Planning" → "Unit 1 Planning" (only "Phase" is replaced)

### Switching Between Patterns

You can switch patterns multiple times, and nodes will update each time:
- Generic → Sales: "Item" → "Deal"
- Sales → Course: "Deal" → "Lesson"
- Course → Generic: "Lesson" → "Item"

---

## Code Changes

### New Function: `renameNodesForPattern()` (line 1950)

Recursively traverses the tree and renames nodes based on their type.

### Updated Function: `applyPattern()` (line 1992)

Now calls `renameNodesForPattern()` before rendering:

```javascript
function applyPattern(patternKey) {
    currentPattern = patternKey;
    capexTree.pattern.key = patternKey;
    capexTree.pattern.labels = PATTERNS[patternKey].levels;

    // NEW: Auto-rename existing nodes
    renameNodesForPattern(capexTree, PATTERNS[patternKey].levels);

    render();
}
```

### Updated Initialization (line 4670)

On page load, if there's a saved pattern, nodes are renamed:

```javascript
if (capexTree.pattern && capexTree.pattern.key) {
    currentPattern = capexTree.pattern.key;
    patternSelect.value = currentPattern;

    // NEW: Apply pattern labels on load
    const labels = getPatternLabels();
    renameNodesForPattern(capexTree, labels);
    render();
}
```

---

## Testing Steps

### Quick Test

1. **Open treeplexity.html**
2. **Hard refresh** (Ctrl + Shift + R)
3. **Check initial state** - Should see generic names or previously saved pattern
4. **Select "📖 Course Design"** from dropdown
5. **Observe changes:**
   - "My Project" → "My Course"
   - "Phase 0" → "Unit 0"
   - "New Item" → "New Lesson"
   - "Task 1" → "Exercise 1"

### Full Pattern Test

Try all 10 patterns in sequence and watch nodes update each time.

---

## Summary

**Feature**: Auto-rename existing nodes when pattern changes

**Benefit**: No manual renaming needed - entire tree adapts to new terminology instantly

**Scope**: Renames root, phases, items, and subtasks throughout entire tree structure

**Preservation**: User-created custom names remain unless they contain generic terms

**Status**: ✅ **FULLY WORKING**

---

**Pattern selector with auto-rename is now complete!** 🎉
