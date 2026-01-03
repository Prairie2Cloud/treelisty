# TreeListy - Claude Code Instructions

Current Version: v2.101.10 (Build 700)
Repository: https://github.com/Prairie2Cloud/treelisty
Live Site: https://treelisty.netlify.app

## CRITICAL: Deployment Process

TreeListy deploys via GitHub to Netlify (auto-deploy on push).
DO NOT use netlify deploy directly. Changes won't persist.

After making changes to treeplexity.html:
1. git add treeplexity.html
2. git commit -m "Build XXX: Short description"
3. git push

Netlify auto-deploys within 1-2 minutes of push to main.

## Project Overview

TreeListy is a single-file HTML application (~1.3MB) for hierarchical project decomposition with AI integration. It supports 6 view modes, 21 patterns, real-time collaboration, and bidirectional communication with Claude Code via MCP.

Key files:
- `treeplexity.html` - Main production file (edit this)
- `welcome-to-treelisty.json` - Default welcome tree
- `netlify/functions/claude-proxy.js` - Server proxy for Claude API
- `.claude/skills/treelisty/SKILL.md` - Skill definition for Claude Code
- `packages/treelisty-mcp-bridge/` - MCP server for Claude Code integration
- `packages/treelisty-chrome-extension/` - Chrome extension for screen capture

## Build Versioning

When making changes, update these 4 locations:
1. Header comment (line ~9): `TreeListy v2.X.Y | Build XXX | YYYY-MM-DD`
2. Changelog in header (lines ~21-28)
3. TREELISTY_VERSION object (line ~740): `build: XXX`
4. KNOWN_LATEST (search for `const KNOWN_LATEST`): update to match

Use the `treelisty-release` skill to automate this.

## Testing

Run unit tests before committing:
```bash
cd test/treelisty-test
npm run test:unit
```

All 469+ tests should pass.

## Architecture

```
treeplexity.html (single file ~1.3MB)
├── HTML structure (~2000 lines)
├── CSS styles (~8000 lines)
└── JavaScript (~68000+ lines)
    ├── Data model (capexTree object)
    ├── Rendering (Tree, Canvas, 3D, Gantt, Calendar, Mind Map views)
    ├── AI integration (Claude, Gemini, ChatGPT)
    ├── TreeBeard assistant with 100+ commands
    ├── Pattern system (21 patterns)
    ├── Collaboration (Firebase Live Sync)
    ├── Atlas (cross-tree intelligence)
    ├── MCP Bridge (Claude Code integration)
    └── Import/Export (JSON, Excel, MS Project XML)
```

### Key Variables
- `viewMode` - current view state (tree/canvas/3d/gantt/calendar/mindmap)
- `capexTree` - main tree data structure
- `PATTERNS` - pattern definitions object
- `firebaseSyncState` - collaboration session state
- `mcpBridgeState` - MCP bridge connection state
- `TreeRegistry` - Atlas cross-tree registry
- `tbState` - TreeBeard session state

### Key Functions
- `render()` - re-render tree view
- `renderCanvas()` - re-render canvas view
- `render3D()` - re-render 3D view
- `renderGantt()` - re-render Gantt view
- `renderCalendar()` - re-render Calendar view
- `saveState(description)` - save undo state
- `showToast(message, type)` - show notification
- `normalizeTreeStructure(tree)` - ensure consistent tree format

---

## Recent Features (Builds 666-700)

### Gallery of Trees (Builds 696-700)
Public tree discovery and sharing system:
- **700**: SubmissionInbox - Firestore-backed gallery submissions
  - `SubmissionInbox.submit(tree, metadata)` - submit tree to gallery
  - `SubmissionInbox.getMySubmissions()` - list user's submissions
  - `SubmissionInbox.withdraw(submissionId)` - cancel submission
  - Status tracking: pending → approved/rejected/withdrawn
- **699**: CloneAudit - Validation utilities for clone integrity
  - `CloneAudit.validateTranslationMap(clone, idMap)`
  - `CloneAudit.checkHyperedgeIntegrity(tree)`
  - `CloneAudit.fullAudit(source, clone, idMap)`
- **698**: IndexedDB NodeIndex - Fast node lookup with 50ms target
- **697**: Atlas Provenance - Tracks sourceTreeId, sourceVersion for clones
- **696**: Clone Banner - Visual "Cloned from X" indicator

### Hyperedge Modal Redesign (Build 666)
- Centered floating modal with solid background
- Full text display (no truncation)
- Delete hyperedge with confirmation
- Improved visual design

### TB Structured Tool Use Phase 2 (Build 665)
Multi-step tree building with feedback loop:
- Session state machine: building → reviewing → paused → complete
- "Continue Layer N" buttons after batch adds
- Auto-continue option for automatic tree building
- Progress tracking: layer count, node count, elapsed time
- Commands: `start_tree_building`, `continue_tree_building`, `complete_tree_building`

### Atlas Phase 1.1 - Tree Browser UI (Build 664)
- Tree Switcher dropdown in header (shows recent trees)
- Browse Trees modal with two-panel layout
- Cross-tree search across all registered trees
- `Ctrl+Shift+T` keyboard shortcut

---

## Previous Features (Builds 624-665)

### Tree View & Canvas Fixes (Builds 659-663)
- **663**: LocalStorage normalization fix
- **662**: normalizeTreeStructure uses 'subItems' not 'subtasks'
- **661**: Canvas recursion fix (was only rendering 19 nodes)
- **660**: Tree view CSS fix (align-items: flex-start)
- **659**: Focus Mode for Branches - `enterFocusMode(nodeId)`, `focus_branch:{name}` command

### TB Structured Tool Use Phase 1 (Build 658)
- Action mode triggers: "go", "build it", "execute"
- Tier 0 tools (~25 always available)
- Tier 1 tools (context-triggered: Canvas, Gantt, Gmail, Atlas, Hyperedge, Image)
- Multi-param handling for rename_node, move_node, etc.
- Telemetry: `window.getToolUseTelemetry()`

### Tree Building Commands (Builds 649-657)
- **657**: TB Batch Add + Fallback Parsing
- **656**: `build_tree_from_topic` command
- **655**: Tree Building Recipe - Semantic Onion Model
- **653**: Multi-word command params fix
- **650**: Confidence-based intent verification

### Hyperedge & TTS (Builds 642-648)
- **648**: Auto-update hyperedges + AI suggest fix
- **647**: Mic check + hyperedge commands + TB screen awareness
- **646**: iOS voice recording fix
- **645**: Smart voice selection (TTS quality)
- **644**: Hyperedge narrate button
- **643**: TTS wake lock
- **642**: AI narrative TTS for hyperedges

### Mobile UX (Builds 632-641)
- **641**: PWA paste banner
- **640**: Paste Share Link button for iOS
- **639**: PWA clipboard share detection
- **638**: Open in App banner for shared URLs
- **637**: Prevent pull-to-refresh on mobile
- **635**: P1 Mobile UX fixes
- **634**: Fix iOS auto-zoom
- **632**: Mobile keyboard accessory bar

Note: Safari browser now preferred over PWA for better live recording performance.

### UI Enhancements (Builds 625-631)
- **631**: UI Theme Expansion - 10 new themes
- **630**: Treemap info panel on click
- **627**: Treemap color palettes - 5 themes
- **625**: Header update check button

---

## Previous Features (Builds 566-623)

### Atlas Phase 1 - Cross-Tree Intelligence (Build 623)
- TreeRegistry: localStorage-persisted registry of all trees
- Cross-tree hyperedge references: `treeId:nodeGuid` format
- Commands: `list_trees`, `search_trees`, `link_cross_tree`

### Sub-Agent Architecture (Builds 620-622)
- **622**: Sub-agent result integration
- **621**: Image spatial commands
- **620**: Sub-agent dispatcher

### Image Pattern Recognition (Build 619)
Enhanced image analysis with pattern-based tree generation.

### Gmail Label Management (Build 618)
Full label UI with create, apply, remove operations.

### Capability Nodes Phase 1 (Builds 615-617)
Chrome capability nodes for authenticated web actions:
- **617**: Expanded domain categorization
- **616**: Global capabilities registry
- **615**: Capability node pattern

### Work Status Panel (Build 614)
Visual work status tracking in UI.

### Tool-use API for TreeBeard (Build 613)
Structured tool use via Claude API.

### Help as Tree + Embed Mode (Build 610)
- Help documentation as navigable tree
- `?embed=1` URL parameter for readonly embedded view

---

## Core Systems

### TreeBeard AI Assistant

TreeBeard is the AI assistant with 100+ commands organized by category:

**Navigation**: `focus_node`, `focus_root`, `focus_parent`, `focus_first_child`, `expand_all`, `collapse_all`, `focus_branch`

**Tree Building**: `add_child`, `add_sibling`, `create_tree`, `build_tree_from_topic`, `start_tree_building`, `continue_tree_building`

**Editing**: `rename_node`, `set_description`, `move_node`, `delete_node`, `duplicate_node`

**Views**: `switch_view:canvas`, `switch_view:3d`, `switch_view:gantt`, `switch_view:mindmap`

**Hyperedges**: `create_hyperedge`, `list_hyperedges`, `narrate_hyperedge`, `delete_hyperedge`

**Atlas**: `list_trees`, `search_trees`, `switch_tree`, `link_cross_tree`

**Gmail**: `list_emails`, `read_email`, `archive_email`, `star_email`, `draft_reply`

**Image**: `analyze_image`, `capture_screen`, `image_to_tree`

### MCP Bridge

Bidirectional communication between TreeListy and Claude Code:
```
TreeListy UI → MCP Bridge → Claude Code CLI
              ← Task Queue ←
```

- Location: `packages/treelisty-mcp-bridge/`
- Start: `node packages/treelisty-mcp-bridge/src/bridge.js`
- Tools: Tree CRUD, task queue, Gmail actions, Chrome extension relay

### Chrome Extension

Screen capture and DOM extraction:
- Location: `packages/treelisty-chrome-extension/`
- Load via `chrome://extensions` (Developer mode)
- MCP tools: `ext_capture_screen`, `ext_extract_dom`, `ext_list_tabs`

### Collaboration System

Firebase Live Sync:
```javascript
window.createFirebaseSyncRoom()     // Create session
window.joinFirebaseSyncRoom(roomId) // Join session
window.leaveFirebaseSyncRoom()      // Leave session
```

Cloud Share (Build 425+): Large trees use Firebase short URLs with `?s=shortcode` format.

### Firestore Collections

- `shared/` - Cloud share links
- `syncRooms/` - Live collaboration rooms
- `gallery_submissions/` - Gallery of Trees submissions

---

## Tree Building Recipe: The Semantic Onion Model

**IMPORTANT**: Follow this methodology when building comprehensive trees.

### The Process

**Layer 1: Find the Semantic Map**
Start with canonical structure:
- Book → Table of Contents
- Philosophy → Major divisions and arguments
- Project → Phases and deliverables

**Layer 2-N: Peel the Onion**
Add each layer of children systematically:
- Chapters → Sub-chapters → Sections
- Each generation adds granularity

**Atomic Layer: Claims**
Deepest level contains assertions:
- What is being claimed?
- What evidence supports it?

**Enrichment: Context & Counter-Arguments**
- Historical/philosophical backdrop
- Significance markers (Pivotal/Novel/Foundational)
- Counter-arguments by school of thought

### TreeBeard Commands for Tree Building

```
create_tree:Title           # Start with root
add_child:Name              # Add next layer
focus_node:Name             # Navigate to add children
set_description:Text        # Add context
build_tree_from_topic:X     # Auto-build from topic
```

---

## Key Patterns

TreeListy supports 21 patterns including:
- `generic` - Default hierarchical decomposition
- `knowledge-base` - Research and documentation
- `lifetree` - Biography and timeline
- `debate` - Arguments and counter-arguments
- `capability` - Chrome automation capabilities
- `email` - Gmail thread structure
- `image-analysis` - Visual decomposition with bounding boxes

---

## Quick Reference

| Task | Command/Action |
|------|----------------|
| Switch view | `switch_view:canvas`, toolbar buttons |
| Build tree | `build_tree_from_topic:Philosophy of Mind` |
| Focus branch | `focus_branch:NodeName` or Canvas right-click |
| Cross-tree link | `link_cross_tree:treeId:nodeGuid` |
| Submit to gallery | Export dropdown → Submit to Gallery |
| Clone tree | Share link → Clone button |
| Start MCP | `node packages/treelisty-mcp-bridge/src/bridge.js` |

---

*Last updated: 2026-01-02 (Build 700)*
