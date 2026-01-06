---
name: tb-listener
description: Listen for and execute TreeBeard delegation requests. Run this to poll for TB requests and automatically handle gmail, github, files, and tree-planning tasks. Use when TB asks CC for help.
---

# TB Listener - Claude Code Delegation Handler

This skill makes CC actively listen for TreeBeard's delegation requests and execute them.

## When to Use

Run `/tb-listener` when:
- You want CC to actively handle TB delegation requests
- TB is saying "I can't" and delegating to CC
- You want automatic gmail/github/file operations from TB chat

## How It Works

1. **Poll for requests**: Check `tasks_claimNext` for pending `cc_action_request` tasks
2. **Route by capability**: Execute appropriate tools based on request type
3. **Report back**: Send results to TB via `cc_send_to_tb`

## Execution Steps

### Step 1: Check for Pending Requests

```
Use mcp__treelisty__tasks_claimNext to claim the next pending task.
If no tasks, report "No pending TB requests" and exit.
```

### Step 2: Route by Capability

Based on the task's `capability` field:

| Capability | Action | CC Tools to Use |
|------------|--------|-----------------|
| `gmail` | `cleanup` | `gmail_trash` or `gmail_archive` for matching emails |
| `gmail` | `archive` | `gmail_archive` for thread IDs |
| `gmail` | `trash` | `gmail_trash` for thread IDs |
| `gmail` | `star` | `gmail_star` for thread IDs |
| `gmail` | `label` | `gmail_add_label` |
| `github` | `mark_read` | `github_mark_read` |
| `github` | `ci_status` | `github_list_workflow_runs` |
| `github` | `prs` | `github_list_prs` |
| `files` | `write` | Use Edit or Write tools |
| `files` | `search` | Use Grep tool |
| `chrome` | `screenshot` | `ext_capture_screen` |
| `tree` | `plan` | Spawn `treebeard-task-planner` agent |
| `tree` | `build` | Execute TB tree-building commands via MCP |

### Step 3: Execute Tree Planning (Special Case)

When `capability === 'tree'` or description mentions building/planning:

```
Spawn a Task with subagent_type='treebeard-task-planner'
Pass the description as the planning prompt
Return the plan to TB for execution
```

### Step 4: Report Results

After executing:
```
Use mcp__treelisty__cc_send_to_tb to send results back:
{
  "message": "Completed: [description]. [summary of what was done]",
  "context": { "taskId": "...", "result": "..." }
}
```

### Step 5: Mark Task Complete

```
Use mcp__treelisty__tasks_complete to mark the task done
Include proposed_ops if any tree changes were made
```

## Gmail Cleanup Pattern

When TB delegates `gmail:cleanup`:

1. Parse description for filter criteria (e.g., "GitHub notifications")
2. Search existing gmail-threads exports or use tree nodes
3. Identify matching thread IDs
4. Call `gmail_trash` or `gmail_archive` for each
5. Report count: "Trashed 79 GitHub notification emails"

## Continuous Listening Mode

For continuous operation, run in a loop:

```
while true:
  1. Claim next task
  2. If task exists:
     - Execute based on capability
     - Report results
     - Mark complete
  3. If no task:
     - Wait 5 seconds
     - Continue loop
```

To start continuous mode, say: "listen for TB requests continuously"

## Example Delegation Flows

### Gmail Cleanup
```
TB: [DELEGATE: gmail:cleanup:Delete GitHub notification emails]
CC: Claims task
CC: Reads gmail-threads export, finds 79 GitHub threads
CC: Calls gmail_trash for each thread
CC: Sends "Deleted 79 GitHub notifications" to TB
```

### Tree Building Planning
```
TB: [DELEGATE: tree:plan:Build a philosophy tree about Kant's Critique]
CC: Claims task
CC: Spawns treebeard-task-planner agent with prompt
Agent: Returns structured plan using Semantic Onion Model
CC: Sends plan to TB for execution
```

### Screenshot Capture
```
TB: [DELEGATE: chrome:screenshot:Capture current tab]
CC: Claims task
CC: Calls ext_capture_screen
CC: Sends screenshot path/data to TB
```

## Error Handling

If execution fails:
1. Send error message to TB: "Failed to [action]: [error]"
2. Mark task as failed (don't use tasks_complete)
3. Log error for debugging

## Testing

To test the listener:
1. In TreeListy, tell TB: "clean up my inbox" (with MCP connected)
2. Run `/tb-listener` in Claude Code
3. Verify CC claims and executes the request
4. Check TB chat for result message
