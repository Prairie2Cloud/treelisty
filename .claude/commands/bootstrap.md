# Bootstrap Self-Tree Context

Read the TreeListy self-tree and provide a session context summary.

## Instructions

1. Read the self-tree file: `self-trees/treelisty-self-tree-v17-build700.json`

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
## TreeListy Context (Build 700)

**Metrics**: 4.42 MB | 93,770 lines | 469 tests | 9 views

**This Week (Now)**:
1. Complete Self-Tree Bootstrap Loop - In Progress
2. Whisper API Integration - Ready to Implement
3. E2E Test Coverage - Planning

**Key Gaps**:
- No shortcut help overlay (Shift+?)
- No e2e tests in CI
- Command count measurement broken

**Later (Don't Start Yet)**:
- Local Whisper WASM
- Multi-Tree Workspaces
- Code Splitting

Self-tree context loaded. Ready to assist with TreeListy development.
```
