# TreeListy - Claude Code Instructions

**Current Version**: v2.17.0 (Build 361)
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
- `.claude/skills/treelisty.md` - Claude Code skill definition (comprehensive)
- `docs/AI-CONTEXT.md` - Extended documentation

---

## Build Versioning

When making changes:

1. **Increment build number** in header comment (line ~9):
   ```
   TreeListy v2.17.0 | Build XXX | YYYY-MM-DD
   ```

2. **Update changelog** in header (lines ~21-26)

3. **Update UI version display** (line ~2937-2938):
   ```html
   <div ... title="TreeListy v2.17.0 | Build XXX | YYYY-MM-DD">
       v2.17.0 • Build XXX
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
├── JavaScript (~21000+ lines)
│   ├── Data model (capexTree object)
│   ├── Rendering (Tree + Canvas + 3D views)
│   ├── AI integration (Claude, Gemini, ChatGPT)
│   ├── Pattern system (19 patterns)
│   ├── Collaboration (Firebase Live Sync + Voice Chat)
│   └── Import/Export (JSON, Excel, URL)
└── Netlify function (claude-proxy.js)
```

---

## Common Patterns

### Variable naming
- `viewMode` (not `currentView`) - current view state
- `capexTree` - main tree data structure
- `PATTERNS` - pattern definitions object
- `firebaseSyncState` - collaboration session state

### Key functions
- `render()` - re-render tree view
- `renderCanvas()` - re-render canvas view
- `render3D()` - re-render 3D view
- `saveState(description)` - save undo state
- `showToast(message, type)` - show notification
- `startVoiceChat()` - launch Jitsi voice room

---

## Recent Features (Builds 318-361)

### Build 361: Pivot-Style Smart Hyperedges
- **Smart auto-grouping**: Suggests hyperedges based on patterns
  - Universal: status clusters, assignee clusters, priority, blocked items
  - Pattern-specific: CAPEX (cost tiers), Philosophy (philosophers), Sales (deal stages)
- **Query builder**: Filter conditions (status=X, cost>$500K) → create hyperedge
- **Live aggregates**: Show totals ($2.3M • 67% • 4 nodes) on hyperedges
- **TreeBeard integration**: "show items over $500K" → find and group

### Build 322: Voice Chat for Collaboration
- Jitsi Meet integration for live sessions
- 🎙️ Voice button in collab chat panel
- Shared room via session ID (no account required)

### Build 321: Meeting Transcript Analysis
- Auto-detect transcripts (timestamps, "discussed", etc.)
- Extract contacts (name, role, company)
- Detect research requests ("research this", "look into")
- Smart preview UI before import

### Build 320: Optimized Import Prompts
- CAPEX-specific prompts (financial rigor, vendor tracking)
- Philosophy-specific prompts (scholarly requirements)
- A/B tested: Sonnet for CAPEX, Opus for Philosophy

### Build 319: Smart Append + Deduplication
- Semantic duplicate detection (60% Jaccard threshold)
- Pattern-aware model selection
- Intelligently merges vs adds items

### Build 318: Edge Function Streaming
- Fixed Netlify timeouts with streaming
- Better reliability for long AI operations

---

## 3D View (Builds 296-303)

- `render3D()` - render Three.js 3D visualization
- **Knowledge Navigator**: Nodes as spheres in 3D space
- **Interactive**: Hover, click, orbit controls
- **Sort-Aware**: 3D respects current sort order

---

## Collaboration System (Build 263+)

### Firebase Live Sync
- `window.createFirebaseSyncRoom()` - create new session
- `window.joinFirebaseSyncRoom(roomId)` - join session
- `window.leaveFirebaseSyncRoom()` - leave session
- `window.firebaseSyncState.roomId` - current session ID

### Voice Chat (Build 322)
- `window.startVoiceChat()` - open Jitsi Meet popup
- Uses session ID for room name: `treelisty-{roomId}`

### Transcript Analysis (Build 321)
- Detected via regex: `/\[\d{1,2}:\d{2}\]|transcript|meeting notes/i`
- Extracted data stored in `capexTree.extractedContacts` and `capexTree.researchRequests`

---

## Extended Documentation

See `docs/AI-CONTEXT.md` for:
- Full pattern list with fields (19 patterns)
- Data model details
- Build history (262-361)
- Known constraints
