# Pause Session

Save current session state for later resume with `/resume`.

## Instructions

### Step 1: Get Current Context

Ask yourself: "What am I currently working on?"
Summarize in 1-2 sentences.

### Step 2: Capture Git State

Run these commands:
```bash
git branch --show-current
git status --short
git diff --stat
```

### Step 3: Capture Todo State

If you have active todos (from TodoWrite), note them down:
- Status (pending/in_progress/completed)
- Content
- Any verification steps

### Step 4: Write Session File

Create `.claude/session.local.md` with this format:

```markdown
# Paused Session

```yaml
paused_at: [current ISO timestamp]
working_on: [1-2 sentence summary of current task]
branch: [git branch name]
```

## Uncommitted Changes

[paste git status --short output, or "None" if clean]

## Pending Todos

[List todos with checkboxes]
- [ ] pending task
- [-] in_progress task
- [x] completed task

## Context Summary

[2-3 sentences: what you were doing, what the next step would be]

## Key Files

[List files being worked on with brief notes]
- path/to/file - what you were changing
```

### Step 5: Confirm

Report to user:

```
Session paused and saved to .claude/session.local.md

Summary:
- Working on: [brief description]
- Branch: [branch]
- Uncommitted files: [count]
- Pending todos: [count]

To continue later, run `/resume` in a new conversation.
```

## Notes

- This file is gitignored (ends in .local.md)
- Only one paused session at a time
- Running `/pause` again overwrites the previous session
