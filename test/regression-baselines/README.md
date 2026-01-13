# Visual Regression Baselines

This directory contains baseline screenshots for visual regression testing.

## Structure

```
regression-baselines/
├── baselines/          # Approved baseline screenshots (committed to git)
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
├── current/            # Current test run (gitignored)
│   └── (same structure)
└── README.md
```

## Usage

Run `/regression-check` in Claude Code to:
1. Capture screenshots of all 10 views
2. Compare against baselines
3. Report any visual differences

Run `/regression-check update` to update baselines after intentional changes.

## When to Update Baselines

- After intentional UI changes
- After adding new views
- After layout improvements
- NOT to silence failing tests without understanding why

## Hotspot Areas

Historical data shows these areas need extra attention:
- View switching (44 fixes)
- Canvas connections (15 fixes)
- Zoom behavior (15 fixes)

## Test Tree

For consistent results, use `welcome-to-treelisty.json` as the test tree.
