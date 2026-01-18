# Resume Session

Restore context from a previously paused session.

## Instructions

### Step 1: Check for Session File

Read `.claude/session.local.md`

If file doesn't exist:
```
No paused session found.

To pause a session, run `/pause` before ending your conversation.
```
Then stop.

### Step 2: Parse Session State

Extract from the file:
- `paused_at` timestamp
- `working_on` description
- `branch` name
- Uncommitted changes list
- Todo items
- Context summary
- Key files

### Step 3: Verify Git State

Run:
```bash
git branch --show-current
git status --short
```

Compare with saved state:
- Same branch? If not, note the difference
- Same uncommitted files? If different, note what changed

### Step 4: Restore Todos

If the session had pending todos, recreate them with TodoWrite:

```javascript
TodoWrite({
  todos: [
    { content: "[saved content]", status: "[saved status]", activeForm: "[derive from content]" },
    // ... more todos
  ]
})
```

### Step 5: Present Context

Display to user:

```
## Resuming Session

**Paused:** [relative time, e.g., "14 hours ago"]
**Working on:** [working_on from session]
**Branch:** [branch]

### Where We Left Off

[Context summary from session]

### Key Files
[List from session]

### Current Git State
[git status output - note any changes since pause]

### Restored Todos
[List restored todos, or "No todos to restore"]

---

Ready to continue. What would you like to do next?
```

### Step 6: Offer Cleanup

After successfully resuming:
```
Session restored. Delete the pause file? (It will be overwritten on next /pause anyway)
```

If user says yes, delete `.claude/session.local.md`

## Notes

- Always run `/bootstrap` after `/resume` for full context
- If git state changed significantly, review before continuing
- Todos are restored to TodoWrite for tracking
