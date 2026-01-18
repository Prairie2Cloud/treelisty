# TreeListy Release

Create a Build release commit with proper version bumping.

This command increments the build number, updates all version locations, and creates a release-ready commit.

## Usage

```
/release [description]
```

Examples:
- `/release Voice Interaction Selector fix`
- `/release Info panel UX streamlining`

## Instructions

### Step 1: Check Current State

```bash
git status --short
git log --oneline -5
```

Note any WIP commits since the last `Build XXX:` commit.

### Step 2: Get Current Build Number

Read `treeplexity.html` and search for:
```javascript
window.TREELISTY_VERSION = {
```

Extract the `build:` value. This is the current build number.

### Step 3: Calculate New Build

```
new_build = current_build + 1
```

### Step 4: Get Release Description

If user provided description, use it.

Otherwise:
- If there are WIP commits, summarize them
- Or ask: "What's the main feature for Build [new_build]?"

### Step 5: Update Version in 4 Locations

#### Location 1: Header Comment (~line 9)
Find:
```html
TreeListy v2.X.Y | Build [old] | [old-date]
```
Replace with:
```html
TreeListy v2.X.Y | Build [new_build] | [today YYYY-MM-DD]
```

#### Location 2: Changelog (~lines 21-50)
Find the changelog section and add new entry at top:
```
* Build [new_build]: [description]
```

#### Location 3: TREELISTY_VERSION Object (~line 740-750)
Find:
```javascript
build: [old],
```
Replace with:
```javascript
build: [new_build],
```

#### Location 4: KNOWN_LATEST Constant
Search for `const KNOWN_LATEST` and update to new build number.

### Step 6: Offer Regression Check

Ask:
```
Run /regression-check before committing? (recommended for UI changes)
```

If yes, run the regression check first.

### Step 7: Stage and Commit

```bash
git add -A
git commit -m "Build [new_build]: [description]

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### Step 8: Squash Option (if WIP commits exist)

If there were WIP commits since last Build:
```
Found [N] WIP commits. Squash them into this Build commit?
- Yes: Clean history, single Build commit
- No: Keep WIP commits visible in history
```

If yes:
```bash
# Find the hash of the last Build commit
git log --oneline | grep -m1 "Build [0-9]*:"
# Reset soft to that commit
git reset --soft [that-hash]
# Recommit with Build message
git commit -m "Build [new_build]: [description]..."
```

### Step 9: Push Option

Ask:
```
Push to main? (This deploys to Netlify)
```

If yes:
```bash
git push origin main
```

### Step 10: CLAUDE.md Update Option

For significant features:
```
Update CLAUDE.md with documentation for this feature?
```

If yes, add appropriate documentation.

### Step 11: Report

```
## Release Complete

**Build:** [new_build]
**Description:** [description]
**Files Modified:** [count]
**Pushed:** yes/no

Next steps:
- Monitor Netlify deployment (1-2 minutes)
- Verify at https://treelisty.netlify.app
- Self-tree will auto-update via post-commit hook
```

## Notes

- Always use this command instead of manual version bumping
- The post-commit hook will auto-update the self-tree
- If push fails, check for conflicts and resolve
- Build numbers are never reused - always increment
