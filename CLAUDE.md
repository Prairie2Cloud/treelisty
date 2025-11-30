# TreeListy - Claude Code Instructions

**Current Version**: v2.11.0 (Build 203)
**Repository**: https://github.com/Prairie2Cloud/treelisty
**Live Site**: https://treelisty.netlify.app

---

## ⚠️ CRITICAL: Deployment Process

**TreeListy deploys via GitHub → Netlify (auto-deploy on push)**

**DO NOT use `netlify deploy` directly!** Changes won't persist properly.

After making changes to `treeplexity.html`:

```bash
# 1. Stage the file
git add treeplexity.html

# 2. Commit with build number
git commit -m "Build XXX: Short description"

# 3. Push to GitHub (triggers Netlify auto-deploy)
git push
```

Netlify auto-deploys within 1-2 minutes of push to `main`.

**NEVER skip this process** - edits without git push won't be live!

---

## Project Overview

TreeListy is a **single-file HTML application** (~1.3MB) for hierarchical project decomposition with AI integration.

**Key files**:
- `treeplexity.html` - Main production file (edit this)
- `welcome-to-treelisty.json` - Default welcome tree
- `netlify/functions/claude-proxy.js` - Server proxy for Claude API
- `docs/AI-CONTEXT.md` - Extended documentation

---

## Build Versioning

When making changes:

1. **Increment build number** in header comment (line ~9):
   ```
   TreeListy v2.11.0 | Build XXX | YYYY-MM-DD
   ```

2. **Update changelog** in header (lines ~21-26)

3. **Update UI version display** (line ~2188-2189):
   ```html
   <div ... title="TreeListy v2.11.0 | Build XXX | YYYY-MM-DD">
       v2.11.0 • Build XXX
   </div>
   ```

4. **Commit with build number** in message

5. **Update `docs/AI-CONTEXT.md`** build history table

---

## Testing

Run unit tests before committing:

```bash
cd test/treelisty-test
npm run test:unit
```

All 141+ tests should pass.

---

## Architecture Quick Reference

```
treeplexity.html (single file ~1.3MB)
├── HTML structure (~2000 lines)
├── CSS styles (~3000 lines)
├── JavaScript (~19000+ lines)
│   ├── Data model (capexTree object)
│   ├── Rendering (Tree + Canvas views)
│   ├── AI integration (Claude, Gemini, ChatGPT)
│   ├── Pattern system (17 patterns)
│   ├── Collaboration (Branch & Merge)
│   └── Import/Export (JSON, Excel, URL)
└── Netlify function (claude-proxy.js)
```

---

## Common Patterns

### Variable naming
- `viewMode` (not `currentView`) - current view state
- `capexTree` - main tree data structure
- `PATTERNS` - pattern definitions object

### Key functions
- `render()` - re-render tree view
- `renderCanvas()` - re-render canvas view
- `saveState(description)` - save undo state
- `showToast(message, type)` - show notification

---

## Collaboration System (Build 185+)

- `extractSubtree(tree, nodeIds)` - extract nodes for sharing
- `generateBranchURL(branch)` - create shareable URL
- `parseBranchFromURL(param)` - decode branch from URL
- `enterBranchEditMode(branch)` - load branch for editing
- `performBranchMerge(branch)` - merge changes back

**Note**: Multi-collaborator merge is "last write wins" - document this to users.

---

## Extended Documentation

See `docs/AI-CONTEXT.md` for:
- Full pattern list with fields
- Data model details
- Build history
- Known constraints
