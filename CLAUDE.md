# TreeListy - Claude Code Instructions

**Current Version**: v2.19.0 (Build 431)
**Repository**: https://github.com/Prairie2Cloud/treelisty
**Live Site**: https://treelisty.netlify.app

---

## CRITICAL: Deployment Process

**TreeListy deploys via GitHub -> Netlify (auto-deploy on push)**

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
- `.claude/skills/treelisty/SKILL.md` - Claude Code skill definition (comprehensive)
- `docs/AI-CONTEXT.md` - Extended documentation

---

## Build Versioning

When making changes, update these **4 locations**:

1. **Header comment** (line ~9):
   ```
   TreeListy v2.19.0 | Build XXX | YYYY-MM-DD
   ```

2. **Changelog** in header (lines ~21-28)

3. **TREELISTY_VERSION object** (line ~681):
   ```javascript
   window.TREELISTY_VERSION = {
       major: '2.19.0',
       build: XXX,
       date: 'YYYY-MM-DD',
   ```

4. **KNOWN_LATEST** (line ~54512):
   ```javascript
   const KNOWN_LATEST = XXX;
   ```

5. **Commit with build number** in message

Use the `treelisty-release` skill to automate this workflow.

---

## Testing

Run unit tests before committing:

```bash
cd test/treelisty-test
npm run test:unit
```

All 281+ tests should pass.

---

## Architecture Quick Reference

```
treeplexity.html (single file ~1.3MB)
├── HTML structure (~2000 lines)
├── CSS styles (~4000 lines)
├── JavaScript (~55000+ lines)
│   ├── Data model (capexTree object)
│   ├── Rendering (Tree + Canvas + 3D views)
│   ├── AI integration (Claude, Gemini, ChatGPT)
│   ├── Pattern system (21 patterns)
│   ├── Collaboration (Firebase Live Sync + Voice Chat)
│   ├── Debate Mode (AI vs AI debates)
│   └── Import/Export (JSON, Excel, MS Project XML, URL)
└── Netlify function (claude-proxy.js)
```

---

## Common Patterns

### Variable naming
- `viewMode` (not `currentView`) - current view state
- `capexTree` - main tree data structure
- `PATTERNS` - pattern definitions object
- `firebaseSyncState` - collaboration session state
- `currentDebate` - active debate state

### Key functions
- `render()` - re-render tree view
- `renderCanvas()` - re-render canvas view
- `render3D()` - re-render 3D view
- `saveState(description)` - save undo state
- `showToast(message, type)` - show notification
- `trackNodeChange(nodeId, type)` - highlight node changes

---

## Recent Features (Builds 409-431)

### Builds 427-431: Debate Mode
- **AI vs AI spectator debates** with insight extraction
- **Defender vs Challenger** roles with 4 argument styles
- **Floating draggable panel** with transcript
- **Structured tree output** for debate insights
- **Navigation fix**: New insights highlight, scroll, expand parent
- **Key functions**: `handleDebate()`, `startDebate()`, `addInsightsToTree()`

### Build 425: Cloud Share via Firebase
- Firebase short URLs for large trees (>8KB)
- Automatic fallback from URL encoding
- Format: `?s=shortcode`

### Build 424: Share URL Size Warnings
- Warning modal for large trees (>100KB)
- "Lite Share" strips descriptions/subtasks

### Builds 414-415: Share View State + 3D Splash
- Share links capture view state (view type, selection, zoom)
- 3D cinematic splash on shared link open
- Shape hierarchy for node types

### Build 412: MS Project XML Import/Export
- Import/export .xml files from Microsoft Project
- Task hierarchy preservation

### Builds 409-411: UX Improvements
- Zoom to Cursor (410)
- Reader Navigation (411)
- Context menu fixes (409)

---

## Older Features (Builds 318-408)

### Builds 405-408: Live Tree Agent
- **Floating frame** replaces cramped wizard modal
- Draggable, position saved to localStorage
- Visual node highlighting (green=new, yellow=modified)
- Full chat history with scrollable messages
- **Key functions**: `openTreeAgent()`, `addAgentMessage()`, `trackNodeChange()`

### Build 392: LifeTree Health Check + GPT-5.2
- Health diagnostics for LifeTree pattern
- Detects empty phases, redundant periods, chronology gaps
- GPT-5.2 Pro/base/Chat model support

### Build 361: Pivot-Style Smart Hyperedges
- **Smart auto-grouping**: Suggests hyperedges based on patterns
- **Query builder**: Filter conditions (status=X, cost>$500K)
- **Live aggregates**: Show totals on hyperedges

### Build 322: Voice Chat for Collaboration
- Jitsi Meet integration for live sessions
- Shared room via session ID

### Build 318: Edge Function Streaming
- Fixed Netlify timeouts with streaming

---

## 3D View (Builds 296-303)

- `render3D()` - render Three.js 3D visualization
- **Knowledge Navigator**: Nodes as spheres in 3D space
- **Interactive**: Hover, click, orbit controls
- **Cinematic splash** on shared links (Build 414)

---

## Collaboration System (Build 263+)

### Firebase Live Sync
- `window.createFirebaseSyncRoom()` - create new session
- `window.joinFirebaseSyncRoom(roomId)` - join session
- `window.leaveFirebaseSyncRoom()` - leave session
- `window.firebaseSyncState.roomId` - current session ID

### Cloud Share (Build 425)
- Large trees use Firebase short URLs
- Format: `?s=shortcode`

### Voice Chat (Build 322)
- `window.startVoiceChat()` - open Jitsi Meet popup
- Uses session ID for room name: `treelisty-{roomId}`

---

## Extended Documentation

See `docs/AI-CONTEXT.md` for:
- Full pattern list with fields (21 patterns)
- Data model details
- Build history (262-431)
- Known constraints

See `.claude/skills/treelisty/SKILL.md` for:
- Comprehensive feature documentation
- Key function references
- Debate Mode details
- Troubleshooting guide
