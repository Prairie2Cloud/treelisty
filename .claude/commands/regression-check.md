# Visual Regression Check

Capture screenshots of all TreeListy views and compare against baselines to detect visual regressions.

## When to Use

**Automatic Triggers** (skill suggests running):
- After any view-related code changes
- After CSS changes to tree, canvas, 3D, gantt, calendar, mindmap
- Before creating a release commit
- When `treelisty-release` skill is invoked

**Manual Triggers**:
- `/regression-check` - Run full regression suite
- `/regression-check update` - Update baselines with current screenshots

## Instructions

### Prerequisites
1. TreeListy must be open in Chrome at https://treelisty.netlify.app or localhost
2. Chrome extension must be connected (check via `ext_get_status`)
3. A test tree should be loaded (use `welcome-to-treelisty.json` for consistency)

### Step 1: Verify Chrome Extension
```
Call: mcp__treelisty__ext_get_status
Expected: { connected: true }
```

If not connected, inform user to:
1. Open Chrome
2. Navigate to TreeListy
3. Ensure extension is enabled

### Step 2: Load Baseline Tree
For consistent comparisons, load the welcome tree:
```
Call: mcp__treelisty__get_tree
Verify: Tree has multiple levels for meaningful screenshots
```

If tree is empty or minimal, suggest loading `welcome-to-treelisty.json`.

### Step 3: Capture All Views

Capture screenshots in this order (10 views):

| View | MCP Command | Key Elements to Verify |
|------|-------------|----------------------|
| 1. Tree | `set_view: tree`, then `ext_capture_screen` | Connection lines, cards, expand/collapse |
| 2. Canvas | `set_view: canvas`, then `ext_capture_screen` | Node layout, connections, toolbar |
| 3. 3D | `set_view: 3d`, then wait 2s, `ext_capture_screen` | WebGL renders, orbit controls |
| 4. Gantt | `set_view: gantt`, then `ext_capture_screen` | Timeline bars, dependencies |
| 5. Calendar | `set_view: calendar`, then `ext_capture_screen` | Month grid, events |
| 6. Mind Map | `set_view: mindmap`, then `ext_capture_screen` | Radial layout, connections |
| 7. Treemap | `set_view: treemap`, then `ext_capture_screen` | Squarified rectangles |
| 8. Checklist | `set_view: checklist`, then `ext_capture_screen` | Progress bar, checkboxes |
| 9. Tree Collapsed | Collapse root, `ext_capture_screen` | No artifacts, clean collapse |
| 10. Tree Expanded | Expand all, `ext_capture_screen` | Full tree, connection lines |

### Step 4: Save Screenshots

Save captured screenshots to:
```
test/regression-baselines/
├── current/           # Current run (always overwritten)
│   ├── 01-tree.png
│   ├── 02-canvas.png
│   ├── 03-3d.png
│   ├── 04-gantt.png
│   ├── 05-calendar.png
│   ├── 06-mindmap.png
│   ├── 07-treemap.png
│   ├── 08-checklist.png
│   ├── 09-tree-collapsed.png
│   └── 10-tree-expanded.png
└── baselines/         # Approved baselines (committed)
    └── (same structure)
```

### Step 5: Compare Against Baselines

If baselines exist:
1. Compare each screenshot against baseline
2. Report differences:
   - **PASS**: Screenshot matches baseline (within tolerance)
   - **DIFF**: Screenshot differs from baseline - requires review
   - **NEW**: No baseline exists - needs initial baseline

If `/regression-check update` was called:
- Copy `current/` to `baselines/`
- Report: "Baselines updated. Commit these files to establish new baselines."

### Step 6: Report Results

Format output as:

```
## Regression Check Results

| View | Status | Notes |
|------|--------|-------|
| Tree | PASS | |
| Canvas | DIFF | Connection line position changed |
| 3D | PASS | |
| ... | ... | ... |

**Summary**: 8/10 passed, 1 diff, 1 new

**Action Required**:
- Review Canvas diff: possible regression in node layout
- Approve Mind Map baseline (new view)
```

## Visual Comparison Approach

Since we don't have pixel-diff tools, compare visually:

1. Open baseline and current side-by-side
2. Check for:
   - Missing elements (nodes, lines, buttons)
   - Position shifts > 10px
   - Color/style changes
   - Layout breaks
   - Artifacts (stale elements)
   - Truncation issues

3. Ignore:
   - Minor anti-aliasing differences
   - Animation timing (3D rotation position)
   - Dynamic content (dates, counts)

## Integration with treelisty-release

When `treelisty-release` runs:
1. It should suggest: "Run /regression-check before committing?"
2. If user confirms, run this check first
3. If diffs found, pause release until reviewed

## Hotspot Areas (from historical analysis)

These areas have the most bugs - pay extra attention:

| Area | Fix Count | What to Check |
|------|-----------|---------------|
| View switching | 44 | Artifacts after switch, state preserved |
| Canvas | 15 | Node positions, connection lines |
| Zoom | 15 | Center point, scroll position |
| Mobile | 19 | (Manual check required) |

## Maintenance

Update baselines when:
- Intentional visual changes are made
- New views are added
- Layout improvements are shipped

Never update baselines to "fix" a failing check without understanding why it changed.
