# Next Task

Claim and execute the next unchecked task from the active project tree in TreeListy.

## Instructions

### Step 1: Get Current Tree

Use `mcp__treelisty__get_tree` to fetch the current tree structure.

If no tree is loaded or it's not a project tree (no checklist-style tasks), report:
"No project tree loaded. Open a project tree in TreeListy first."

### Step 2: Find Next Task

Scan the tree for the first node where:
- `checked === false` or `checked` is undefined
- Node appears to be a task (leaf node or has actionable name)
- Parent is not itself unchecked (work top-down)

Priority order:
1. Nodes marked `priority: 'high'` or with 🔥 emoji
2. Nodes in "Now" or "Phase 1" sections
3. First unchecked leaf by tree order

### Step 3: Claim the Task

Report to user:
```
## Next: [task name]

[task description if any]

Parent: [parent node name]
```

Use `mcp__treelisty__select_node` to highlight it in the UI.

### Step 4: Assess Complexity

**Simple task** (do directly):
- Single file change
- Clear implementation
- No dependencies on other tasks

**Complex task** (spawn agent):
- Multiple files
- Needs exploration first
- Has subtasks

### Step 5: Execute

**For simple tasks:**
Work directly using Edit, Write, Bash tools.

**For complex tasks:**
Spawn `code-implementer` agent with:
```
prompt: |
  Task: [task name]
  Description: [description]
  Parent context: [parent node info]

  Implement this task. When done, report what was changed.
```

**For iterative tasks** (tests must pass, build must succeed):
Use ralph-loop pattern - keep working until verification passes.

### Step 6: Mark Complete

When task is done:

1. Use `mcp__treelisty__update_node` to set `checked: true`
2. Report completion:
   ```
   ✓ Completed: [task name]

   Changes:
   - [what was done]

   Run /next for the next task, or /pause to stop.
   ```

### Step 7: Auto-Continue (Optional)

If user previously said "keep going" or task was trivial:
- Automatically run /next again
- Stop on complex tasks or after 5 consecutive completions

## Examples

```
User: /next

CC: ## Next: Add synthesizer abstraction layer

Parent: Phase 1 - Foundation
Description: Create abstract-synthesizer.js with NBLMProvider and LLMFallbackProvider

This is a complex task (multiple files). Spawning code-implementer...

[agent works]

✓ Completed: Add synthesizer abstraction layer

Changes:
- Created packages/treelisty-mcp-bridge/src/synthesizer/abstract-synthesizer.js
- Created packages/treelisty-mcp-bridge/src/synthesizer/nblm-provider.js
- Created packages/treelisty-mcp-bridge/src/synthesizer/llm-fallback-provider.js

Run /next for the next task, or /pause to stop.
```

## Notes

- Tasks are worked in tree order (depth-first)
- Subtasks of an unchecked parent are skipped until parent is done
- Use `/pause` to save progress between sessions
- The tree in TreeListy is the source of truth
