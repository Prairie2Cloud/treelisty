# WIP Commit

Create a work-in-progress checkpoint commit.

WIP commits are for saving progress during development. They stay local until you run `/release` to create a proper Build commit.

## Usage

```
/wip [description]
```

Examples:
- `/wip voice button handler`
- `/wip refactor info panel`
- `/wip test fixes`

## Instructions

### Step 1: Check for Changes

```bash
git status --short
```

If no changes:
```
Nothing to commit. Make some changes first.
```
Then stop.

### Step 2: Get Description

If user provided a description in the command, use it.

Otherwise, ask:
```
What should I call this WIP? (e.g., "voice button handler")
```

### Step 3: Stage and Commit

```bash
git add -A
git commit -m "WIP: [description]"
```

### Step 4: Report

```
WIP committed: "[description]"

Files changed:
[list of changed files]

Note: This is a checkpoint commit. When ready to release:
- Run `/release` to create the final Build commit
- Or continue working and run `/wip` again for another checkpoint
```

## Commit Format

```
WIP: [brief description]
```

Keep descriptions short (3-5 words).

## Notes

- WIP commits should NOT be pushed directly
- Multiple WIPs can accumulate before a `/release`
- `/release` can optionally squash WIP commits into one Build commit
- If you need to push urgently, use `/release` first
