# Tree View State Bugs

**Date:** 2025-12-30
**Discovered during:** Science of Logic tree debugging
**Build:** 659

---

## Bug 1: viewState.viewMode Not Respected on Load

**Severity:** Medium
**Status:** FIXED (Build 660)

### Description
When a tree JSON file contains `viewState.viewMode: "tree"`, TreeListy ignores this and always loads in Canvas view. The saved view mode preference is not restored.

### Steps to Reproduce
1. Save a tree with `viewState.viewMode: "tree"` in the JSON
2. Load the tree via file input
3. Observe: Tree loads in Canvas view, not Tree view

### Expected Behavior
Tree should load in the view mode specified in `viewState.viewMode`.

### Actual Behavior
Tree always loads in Canvas view regardless of saved viewMode.

### Location
Likely in `loadTreeData()` function around line 34723 in treeplexity.html - the viewState restoration logic.

---

## Bug 2: Tree View Pan/Zoom State Causes Off-Screen Rendering

**Severity:** High
**Status:** FIXED (Build 660)

### Description
When a tree is saved with extreme pan/zoom values in `viewState` (e.g., `treePanY: 9001`, `treeZoom: 0.25`), loading the tree and switching to Tree view causes the tree content to render at those coordinates, making it invisible (off-screen).

The `tree-transform-wrapper` element receives a CSS transform like:
```css
transform: matrix(0.25, 0, 0, 0.25, 945.75, 9001.2)
```

This positions the tree content ~9000px below the visible viewport, and the `tree-container` has `overflow: hidden`, so the content is completely invisible.

### Steps to Reproduce
1. Load a tree with large `treePanY` value (e.g., 9001)
2. Switch to Tree view
3. Observe: Tree view appears empty (content is 9000px off-screen)

### Expected Behavior
When switching to Tree view, pan/zoom should reset to sensible defaults (zoom=1, pan=0,0) or at minimum ensure content is visible.

### Actual Behavior
Tree view applies the saved pan/zoom state from Canvas view, which may position content off-screen.

### Workaround
Manually edit the JSON file to reset viewState:
```json
"viewState": {
  "viewMode": "tree",
  "treeZoom": 1,
  "treePanX": 0,
  "treePanY": 0,
  "canvasZoom": 1,
  "canvasPanX": 0,
  "canvasPanY": 0
}
```

### Suggested Fix
In the Tree view rendering code, either:
1. Reset tree pan/zoom to defaults when switching views
2. Clamp pan/zoom values to ensure content remains visible
3. Separate tree and canvas pan/zoom states (they serve different purposes)

### Location
- `tree-transform-wrapper` transform application
- View switching logic (around line 12163-12190)
- Pan/zoom state management

### Root Cause (Build 660 Fix)
The actual issue was `.tree { align-items: center }` in CSS, which vertically centered all tree columns. When one column was very tall (23,000px+), it pushed smaller columns to y=12,000px (off-screen).

**Fix:** Changed `.tree { align-items: flex-start }` so columns align to top.

---

## Bug 3: Tree Nodes Not Rendering for Nested Items

**Severity:** High
**Status:** FIXED (Build 660)

### Description
Nodes using `items` or `children` arrays weren't showing expand toggles, and clicking didn't expand them.

### Root Cause
Code only checked for `subItems`, not `items` or `children`.

### Fix
Updated all child array checks to use pattern:
```javascript
const childArray = node.subItems || node.items || node.children;
const hasChildren = childArray && childArray.length > 0;
```

---

## Related Files

- `treeplexity.html` - Main application
- `trees/treelisty-generic-science-of-logic-dialogue-one-the-doctrine-of-being-20251229-104214.json` - Example file with fixed viewState

---

*Filed: 2025-12-30*
*Fixed: Build 660 (2025-12-30)*
