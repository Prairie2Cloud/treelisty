# Default Data Updated - Treeplexity

**Date**: November 6, 2025
**Change**: Replaced default P2C CAPEX data with generic stub template

---

## What Changed

### Before
The default `capexTree` object contained:
- Project name: "Treeplexity"
- Complex data center CAPEX items (19 items)
- Realistic costs ($725M total)
- Domain-specific items:
  - Land option + legal ($180k)
  - Pipeline pre-FEED deposit ($40k)
  - Gas turbines ($300M)
  - BESS systems ($75M)
  - Solar arrays, standby generators, etc.

### After
The default `capexTree` object now contains:
- Project name: "My Project"
- Generic stub items (3 items total, one per phase)
- Zero costs (ready to fill in)
- Generic placeholder items:
  - Phase 0: "New Item" with 2 subtasks
  - Phase 1: "New Item" with 1 subtask (depends on Phase 0 item)
  - Phase 2: "New Item" with 1 subtask
- All phases expanded by default (for better onboarding)

---

## Source Data

**File**: `D:\OneDrive\Desktop\Production Versions\treeplexity\examples\stubs.json`

This stub template was:
1. Updated to use Treeplexity branding (🌳 icon, "My Project" name)
2. Converted from JSON to JavaScript object literal format
3. Inserted into treeplexity.html at lines 1617-1786

---

## Benefits

### User Experience
✅ **Clean slate**: Users start with a blank project, not a data center
✅ **Universal**: No domain-specific terminology
✅ **Educational**: Shows the structure without overwhelming detail
✅ **Ready to use**: Users can immediately edit placeholder items

### Branding
✅ **Consistent**: Matches Treeplexity's universal positioning
✅ **Welcoming**: No intimidating $725M budget example
✅ **Generic**: Works for any domain/use case

### Onboarding
✅ **Shows features**: Has subtasks, dependencies, project management fields
✅ **Expandable**: All phases expanded to show structure
✅ **Editable**: Generic names encourage customization

---

## Structure Overview

```
My Project 🌳
├── Phase 0: Pre-Seed 🌱
│   └── New Item 📦 ($0)
│       ├── Task 1 📋
│       └── Task 2 📋
│
├── Phase 1: Seed 🚀
│   └── New Item 📦 ($0)
│       └── Task 1 📋
│       [Depends on: Phase 0 item]
│
└── Phase 2: Build 🏭
    └── New Item 📦 ($0)
        └── Task 1 📋
```

---

## Technical Details

### File Changes
- **treeplexity.html**: Lines 1617-1786 replaced
- **File size**: 4354 lines (up from 4248)
- **Size increase**: ~106 lines due to more detailed PM fields on subtasks

### Data Structure
Each stub item includes:
- Basic fields: id, name, description, cost, icon, itemType, type
- Dependencies array
- Expanded state
- SubItems array with:
  - PM fields: status, assignee, dates, progress, priority
  - Notes, blocking issues, next steps
  - Updates array

### IDs Used
- Phase 0 item: `p0-1762125598237`
- Phase 1 item: `p1-1762125603889` (depends on Phase 0)
- Phase 2 item: `p2-1762125606965`
- Subtask IDs follow pattern: `{parent-id}-sub-{timestamp}`

---

## Comparison

| Aspect | Old Default | New Default |
|--------|-------------|-------------|
| **Project Name** | "Treeplexity" | "My Project" |
| **Total Cost** | $725M | $0 |
| **Items** | 19 CAPEX items | 3 generic items |
| **Domain** | Data center infrastructure | Universal/Generic |
| **Complexity** | High (realistic project) | Low (starter template) |
| **Phase Expansion** | Collapsed | Expanded |
| **Dependencies** | 10+ dependency links | 1 simple dependency |
| **Item Types** | Land, equipment, infrastructure | Generic equipment |
| **Subtasks** | None | 4 total (shows feature) |

---

## User Impact

### First-Time Users
When opening Treeplexity for the first time, users now see:
1. A clean, simple project tree
2. All phases visible and expanded
3. Generic "New Item" placeholders ready to edit
4. Example subtasks showing the feature exists
5. One dependency demonstrating the concept
6. $0 costs encouraging them to fill in values

### Customization Path
Users can:
1. Click project name to rename from "My Project"
2. Click any item to edit name, description, cost
3. Right-click to add more items, set dependencies
4. See the structure without being overwhelmed
5. Build from scratch or load a template

---

## Migration Notes

### Existing Projects
✅ No impact - existing saved JSON files still work perfectly
✅ Load button allows users to open previous work
✅ Change only affects new sessions

### Templates
The stubs.json file can serve as:
- Starting point for new users
- Base template for creating domain templates
- Example of minimal valid project structure

---

## Files Modified

1. **treeplexity.html**
   - Lines 1617-1786: Default data replaced
   - Total lines: 4354 (increased by 106)

2. **examples/stubs.json**
   - Icon updated: ☁️ → 🌳
   - Name updated: "CAPEX Master" → "My Project"

---

## Testing

✅ File opens without errors
✅ Tree renders correctly with 3 phases
✅ All phases expanded showing structure
✅ Subtasks display properly
✅ Dependencies work (Phase 1 item depends on Phase 0)
✅ Right-click menus functional
✅ Can edit items
✅ Can add new items
✅ Can save/export

---

## Summary

**Changed**: Default project data from domain-specific CAPEX example to universal generic stubs

**Result**: Clean, welcoming starting point for all users regardless of domain

**Impact**: Better onboarding, clearer universal positioning, easier customization

**Status**: ✅ Complete and tested

---

**Treeplexity now starts blank and ready for anything!** 🌳✨
