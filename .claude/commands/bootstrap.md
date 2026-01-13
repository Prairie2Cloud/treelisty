# Bootstrap Self-Tree Context

Read the TreeListy self-tree and provide a session context summary.

## Instructions

1. Find and read the latest self-tree file in `self-trees/` directory:
   - Look for files matching `treelisty-self-tree-v*.json`
   - Use the most recent one (highest build number)
   - Current: `self-trees/treelisty-self-tree-v17-build836.json`

2. Extract and summarize:
   - **Current Metrics**: File size, line count, test count, view count
   - **Now Items**: What's being worked on this week (max 3)
   - **Key Gaps**: From Improvement Suggestions section
   - **Architecture Reminder**: Key entry points and code locations

3. Present a concise summary (not the full tree) that answers:
   - What is TreeListy's current state?
   - What should I focus on?
   - What should I NOT do (Later items)?

4. End with: "Self-tree context loaded. Ready to assist with TreeListy development."

## Example Output Format

```
## TreeListy Context (Build 742)

**Metrics**: 4.59 MB | 96,692 lines | 469 tests | 9 views

**This Week (Now)**:
1. Gmail Tree UX Polish - ✅ Complete (Builds 732-741)
2. Zoom Centering Fixes - ✅ Complete (Builds 724-731)
3. Keyboard Shortcut Overlay - ✅ Complete (Build 742)

**Key Gaps**:
- Command count measurement broken
- No performance budget CI check
- No e2e Playwright tests in CI

**Later (Don't Start Yet)**:
- Local Whisper WASM
- Multi-Tree Workspaces
- Code Splitting

Self-tree context loaded. Ready to assist with TreeListy development.
```

## Maintenance

When self-tree becomes stale (36+ builds behind):
1. Run: `node scripts/measure-self-tree.js`
2. Run: `node scripts/generate-self-tree.js`
3. Update the "Current" path above
