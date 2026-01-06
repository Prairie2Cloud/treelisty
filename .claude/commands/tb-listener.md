# TB Listener - Handle TreeBeard Delegation Requests

Listen for and execute pending TreeBeard delegation requests from the MCP Bridge.

## Instructions

### Step 1: Check Task Queue

Use `mcp__treelisty__tasks_claimNext` to claim the next pending task with capabilities:
```json
["gmail", "github", "files", "chrome", "tree", "webSearch"]
```

If no tasks are available, report: "No pending TB requests. TB can delegate by saying things like 'clean up my inbox' when MCP is connected."

### Step 2: Route by Capability

When a task is claimed, check its `type` and `capability` fields:

**Gmail Operations** (`capability: 'gmail'`):
- `cleanup`: Find and trash/archive matching emails
- `archive`: Archive specific threads
- `trash`: Trash specific threads
- `star`: Star threads
- `label`: Add labels to threads

Use `gmail_trash`, `gmail_archive`, `gmail_star`, `gmail_add_label` MCP tools.

**GitHub Operations** (`capability: 'github'`):
- `mark_read`: Mark notifications as read
- `ci_status`: Check workflow runs
- `prs`: List pull requests

Use `github_mark_read`, `github_list_workflow_runs`, `github_list_prs` MCP tools.

**File Operations** (`capability: 'files'`):
- `write`: Edit/write files using Edit or Write tools
- `search`: Search codebase using Grep tool

**Chrome Operations** (`capability: 'chrome'`):
- `screenshot`: Capture screen using `ext_capture_screen`

**Tree Planning** (`capability: 'tree'`):
- `plan`: Spawn `treebeard-task-planner` agent with the description
- `build`: Execute tree-building commands via MCP

### Step 3: Execute and Report

1. Execute the appropriate tools/actions
2. Send results to TB using `mcp__treelisty__cc_send_to_tb`:
   ```
   message: "Completed: [description]. [what was done]"
   ```
3. Mark task complete using `mcp__treelisty__tasks_complete`

### Step 4: Tree Planning (Special)

When `capability === 'tree'` or description mentions building/planning a tree:

```
Spawn a Task tool with:
- subagent_type: 'treebeard-task-planner'
- prompt: The task description + "Plan the tree structure and command sequence"

Return the plan to TB for user approval before execution.
```

## Continuous Mode

If user says "listen continuously" or "keep listening":

Loop with 5-second intervals:
1. Check for tasks
2. Execute if found
3. Wait 5 seconds
4. Repeat until user stops

## Example

```
User: /tb-listener

CC: Checking for TB delegation requests...
CC: Found task: gmail:cleanup - "Delete GitHub notification emails"
CC: Executing... Found 45 matching threads
CC: [Calling gmail_trash for each thread]
CC: Sent to TB: "Completed: Trashed 45 GitHub notification emails"
CC: Task marked complete.
```
