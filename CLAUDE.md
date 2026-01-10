# TreeListy - Claude Code Instructions

Current Version: v2.101.129 (Build 823)
Repository: https://github.com/Prairie2Cloud/treelisty
Live Site: https://treelisty.netlify.app

## Self-Tree Bootstrap

**Read the self-tree for full context:** `self-trees/treelisty-self-tree-v17-build824.json`

The self-tree contains:
- **Measured Signals**: 5.11 MB, 108,114 lines, 469 tests, 10 views, 52 keyboard shortcuts
- **Now/Next/Later**: Current priorities with task tables
- **Architecture Reference**: Code locations, entry points, data flow
- **Improvement Suggestions**: TB-identified gaps and solutions

Use the self-tree to understand capabilities, priorities, and architecture before making changes.

## ACTIVE PLAN: Mobile Checklist Lifecycle (Builds 823-826)

**Plan file:** `.claude/plans/wobbly-shimmying-wigderson.md`

| Phase | Build | Feature | Status |
|-------|-------|---------|--------|
| 1 | 823 | Checklist View | ✅ DONE |
| 2 | 824 | Mobile Tree Picker | Pending |
| 3 | 825 | Auto-Archive on 100% | Pending |
| 4 | 826 | Recurring Detection | Pending |

**Build 823 added:**
- 10th view mode: View → ☑️ Checklist
- `flattenTreeToItems()` - extracts leaf nodes
- `renderChecklist()` - progress header + items + quick-add
- `toggleChecklistItem()` - checkbox toggle with animation
- CSS: `#view-checklist`, `.checklist-item`, `.checklist-checkbox`

## CRITICAL: Deployment Process

TreeListy deploys via GitHub to Netlify (auto-deploy on push).
DO NOT use netlify deploy directly. Changes won't persist.

After making changes to treeplexity.html:
1. git add treeplexity.html
2. git commit -m "Build XXX: Short description"
3. git push

Netlify auto-deploys within 1-2 minutes of push to main.

## Project Overview

TreeListy is a single-file HTML application (~5MB) for hierarchical project decomposition with AI integration. It supports 10 view modes, 21 patterns, real-time collaboration, and bidirectional communication with Claude Code via MCP.

Key files:
- `treeplexity.html` - Main production file (edit this)
- `welcome-to-treelisty.json` - Default welcome tree
- `netlify/functions/claude-proxy.js` - Server proxy for Claude API
- `.claude/skills/treelisty/SKILL.md` - Skill definition for Claude Code
- `packages/treelisty-mcp-bridge/` - MCP server for Claude Code integration
- `packages/treelisty-mcp-bridge/src/drive-handler.js` - GDrive MCP handler
- `packages/treelisty-chrome-extension/` - Chrome extension for screen capture
- `export_google_drive_to_treelisty.py` - GDrive metadata export
- `export_gdrive_content_to_treelisty.py` - GDrive content extraction for RAG
- `guides/` - Constitutional framework and engineering guides

## Constitutional Framework

**TreeListy development is governed by constitutional constraints.**

Before implementing ANY feature, verify compliance with the 6 Articles:

### Quick Constitutional Check (Memorize These)

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE CODING, ASK:                                        │
│                                                             │
│  1. Does this work offline?           [SOVEREIGNTY]         │
│  2. Is AI content marked?             [PROVENANCE]          │
│  3. Can the user undo this?           [INTEGRITY]           │
│  4. Does AI admit uncertainty?        [HUMILITY]            │
│  5. Am I revealing or optimizing?     [ANTI-ENFRAMING]      │
│                                                             │
│  If ANY answer is NO → justify in ADR or redesign           │
└─────────────────────────────────────────────────────────────┘
```

### The 6 Articles (Summary)

| Article | Requirement | Test |
|---------|-------------|------|
| **I. Sovereignty** | User is not a cognitive tenant | Works offline? Data exportable? No account required? |
| **II. Provenance** | Owned thought ≠ generated thought | AI content has 🤖 badge? Provenance survives export? |
| **III. Integrity** | The skeleton is sacred | Structure visible? Destructive ops need consent? Reversible? |
| **IV. Humility** | Confidence determines action | >85% silent, 50-85% narrate, <50% ask? |
| **V. Anti-Enframing** | Reveal, don't optimize | No engagement metrics? No algorithmic ranking? |
| **VI. Federation** | Connection without extraction | Cross-tree preserves sovereignty? No central registry? |

### Constitutional Prohibitions (Never Do These)

```
❌ "Sign up to sync" → Violates Sovereignty
❌ "Trending trees" → Violates Anti-Enframing  
❌ Silent AI injection without 🤖 badge → Violates Provenance
❌ Delete without confirmation → Violates Integrity
❌ Cloud-only features → Violates Sovereignty
❌ AI sounds certain when it isn't → Violates Humility
```

### Constitutional Mandates (Always Do These)

```
✓ Every AI-generated node MUST have provenance metadata
✓ Every destructive action MUST have undo capability
✓ Every feature MUST work offline (or graceful degradation)
✓ Every AI suggestion MUST route by confidence level
✓ Every export MUST include complete provenance
```

### Provenance Metadata Standard

When creating AI-generated nodes, always include:

```javascript
{
  provenance: {
    source: 'ai_generated',  // or 'human', 'imported', 'atlas_link'
    model: 'claude-opus-4-5-20251101',  // which model
    confidence: 0.85,  // 0-1 scale
    timestamp: new Date().toISOString(),
    claimed: false  // true after user edits/approves
  }
}
```

### Confidence Routing

```javascript
// In TreeBeard/AI response handling
if (confidence > 0.85) {
  // Act silently - low friction
  executeAction();
} else if (confidence > 0.50) {
  // Act but narrate - preserve agency
  showToast(`I've drafted this structure - review?`);
  executeAction();
} else {
  // Ask first - avoid hallucinated authority
  presentOptions();
}
```

### Full Documentation

- `guides/TreeListy-Constitutional-Framework-v1.md` - The law (6 Articles, MVS, MCP spec)
- `guides/TreeListy-Engineering-Integration-Guide.md` - Enforcement (tests, CI/CD, PR template)
- `guides/TreeListy-Philosophical-Principles-Analysis.md` - Rationale (philosophy, debate points)

### When to Load Full Guides

| Situation | Load This |
|-----------|-----------|
| Planning new features | Constitutional Framework |
| Writing tests | Engineering Integration Guide |
| Debating architecture | Philosophical Principles |
| Code review | Check PR against constitutional checklist |

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

All 469+ unit tests should pass.

Run TB Natural Language E2E tests:
```bash
cd test/treelisty-test
npm run test:tb-nl
```

All 27 TB NL tests should pass (tests against live site).

### Constitutional Tests (NEW)

Run constitutional compliance tests:
```bash
cd test/treelisty-test
npm run test:constitutional
```

These tests verify:
- Sovereignty: Offline capability, export completeness
- Provenance: AI attribution, survival through operations
- Integrity: Undo capability, consent flows
- Humility: Confidence routing behavior

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
- `historyStack` - undo history (max 50 states)
- `redoStack` - redo history (Build 778)
- `directMappings` - TB fast-path command patterns with paramGroup support

### Key Functions
- `render()` - re-render tree view
- `renderCanvas()` - re-render canvas view
- `render3D()` - re-render 3D view
- `renderGantt()` - re-render Gantt view
- `renderCalendar()` - re-render Calendar view
- `saveState(description)` - save undo state (clears redoStack)
- `undo()` - restore previous state (saves current to redoStack)
- `redo()` - restore undone state (Build 778)
- `showToast(message, type)` - show notification
- `normalizeTreeStructure(tree)` - ensure consistent tree format
- `preflightCapabilityCheck(message)` - fast-path NL command routing

---

## Recent Features (Builds 769-781)

### GDrive RAG Integration (Builds 770-781)

Complete Google Drive integration with content extraction, semantic search, and AI organization:

**Phase 1-3: Content & Search (Builds 770-772)**
- `export_gdrive_content_to_treelisty.py` - Extract text from Docs, PDFs, Word, Excel
- `drive-handler.js` - MCP tools for Claude Code to browse/search Drive
- `RetrievalEngine` - Hybrid search (text + semantic) with embeddings

**Phase 4: File Actions (Build 779)**
- Context menu: "Open in Drive", "Copy Link", "View Content"
- Info panel shows file metadata (size, modified, owner)
- TB commands: `copy_file_link`, `view_file_content`

**Phase 5: UI/UX (Build 780)**
- Breadcrumb navigation with clickable folder ancestors
- Content preview (first 250 chars of extracted text)
- Source badges: Extracted/Pending/Error/Not Extracted
- File type filter bar: All, Folders, Docs, Sheets, Slides, PDF

**Phase 6: AI Organization (Build 781)**
- `findDuplicateFiles()` - Detect same name/size duplicates
- `findEmptyFolders()` - Find folders with no content
- `findOldFiles()` - Find files not modified in X days
- `analyzeGDriveOrganization()` - Full analysis with suggestions modal
- `exportOrganizationReport()` - Export findings as Markdown
- TB commands: `analyze_drive`, `find_duplicates`, `find_empty_folders`, `find_old_files`

**Key Functions:**
- `isGDriveTree()` - Detect if current tree is from GDrive
- `buildBreadcrumbPath(node)` - Build folder path from root
- `getContentPreview(node)` - Extract text preview from RAG chunks
- `getGDriveSourceBadge(node)` - Extraction status badge
- `applyGDriveFilter(filter)` - Filter tree by file type

### TreeBeard Natural Language Command System (Builds 773-778)
Complete overhaul of TB's natural language command interpretation:

- **778**: Redo Functionality
  - Added `redoStack` for storing undone states
  - `undo()` now saves current state to redoStack before restoring
  - New `redo()` function pops from redoStack and restores
  - `redoStack` cleared when `saveState()` called (new actions invalidate redo)
  - `updateRedoButton()` updates redo button state
  - All 27 TB NL tests now pass

- **777**: Parameter Case Preservation
  - Fixed `preflightCapabilityCheck` lowercasing parameters
  - Parameters like "Security Review" now preserved (was "security review")
  - Extracts params from original message while matching against lowercase

- **776**: Focus Commands + selectedNodeId
  - `focus_node` and `focus_root` now set `window.selectedNodeId`
  - Required for test compatibility with node selection verification

- **775**: Enhanced TB Natural Language Patterns
  - Added 30+ new patterns to `directMappings` array:
    - Navigation: "navigate to root", "go to root" → `focus_root`
    - Expand/Collapse: "expand everything", "collapse everything" → `expand_all`/`collapse_all`
    - Node-specific: "expand Phase 4" → `expand_node` with param
    - Undo/Redo: "undo that", "take it back" → `undo`
    - Add child: "add a new task called X" → `add_child` with param extraction
    - Rename: "rename this to X" → `rename_node` with param
    - Delete: "delete the X node" → `delete_node` with param
    - Set description: "set description to X" → `set_description` with param
  - `expand_node`, `collapse_node`, `delete_node` now accept name parameter
  - `paramGroup` in directMappings specifies which regex capture group is the parameter

- **774**: TB View Switching NL Fix
  - Added "display" as verb prefix ("display gantt chart")
  - Added "mode" as suffix ("open 3D mode")
  - Added `switch_to_gantt` alias to `view_gantt`
  - Improved fast-path for "switch to tree" variations

### RAG & GDrive Integration (Builds 770-772)
- **772**: RAG Retrieval Engine with hybrid search (text + semantic)
- **771**: MCP Drive Handler - Claude Code can browse/search Drive
- **770**: GDrive Content Extraction - Python script for RAG indexing

### Other Recent Builds (769)
- **769**: Schema Version 2 Fix - SCHEMA_VERSION updated to match Atlas Identity migration

---

## Previous Features (Builds 666-700)

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

### URL Parameter API (Build 610)

Query parameters for controlling TreeListy behavior:
- `?embed=1` - Readonly embedded view (no toolbar)
- `?readonly=1` - View-only mode
- `?capture=1` - Instant voice capture mode (Build 504)
- `?s=shortcode` - Load shared tree from Firebase
- `?tree=url` - Load tree from external URL

### LifeTree Contextual Research (Build 381)

Biographical research mode for LifeTree pattern:
- Automatic context gathering for life events
- Historical backdrop enrichment
- Source citation integration

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

**GDrive**: `analyze_drive`, `find_duplicates`, `find_empty_folders`, `find_old_files`, `copy_file_link`, `view_file_content`, `export_organization_report`

**Image**: `analyze_image`, `capture_screen`, `image_to_tree`

### MCP Bridge

Bidirectional communication between TreeListy and Claude Code:
```
TreeListy UI → MCP Bridge → Claude Code CLI
              ← Task Queue ←
```

- Location: `packages/treelisty-mcp-bridge/`
- Start: `node packages/treelisty-mcp-bridge/src/bridge.js`
- Tools: Tree CRUD, task queue, Gmail actions, GDrive operations, Chrome extension relay

**GDrive MCP Tools** (Build 771):
- `gdrive_check_auth` - Check Drive authentication status
- `gdrive_list_files` - List files in a folder
- `gdrive_get_file_info` - Get file metadata
- `gdrive_search` - Search files by name
- `gdrive_extract_content` - Trigger Python extraction script
- `gdrive_open_file` - Open file in browser

**RAG MCP Tools** (Build 772):
- `retrieve_context` - Hybrid search over extracted content

### Chrome Extension

Screen capture and DOM extraction:
- Location: `packages/treelisty-chrome-extension/`
- Load via `chrome://extensions` (Developer mode)
- MCP tools: `ext_capture_screen`, `ext_extract_dom`, `ext_list_tabs`

### GDrive Integration (Builds 770-781)

Complete Google Drive integration for RAG and organization analysis.

**Setup:**
1. Enable Drive API: https://console.cloud.google.com/apis/library/drive.googleapis.com
2. Create OAuth credentials (Desktop app) → download as `credentials.json`
3. Run: `python export_gdrive_content_to_treelisty.py` (authenticates, creates `token-drive.json`)
4. Import resulting JSON into TreeListy

**Workflow:**
```
GDrive → Python Script → JSON with RAG chunks → TreeListy
                                                    ↓
                                          RetrievalEngine (hybrid search)
                                                    ↓
                                          Organization Analysis
```

**Key Variables:**
- `gdriveOrganizationState` - Analysis state (analyzing, lastAnalysis, suggestions)
- `_rag.chunks` - Extracted text chunks on file nodes
- `fileUrl`, `fileSize`, `dateModified` - GDrive metadata on nodes

**Natural Language Triggers:**
- "analyze my drive" → `analyze_drive`
- "find duplicates" → `find_duplicates`
- "find empty folders" → `find_empty_folders`
- "find old files" → `find_old_files`
- "cleanup suggestions" → `analyze_drive`

### Collaboration System

Firebase Live Sync:
```javascript
window.createFirebaseSyncRoom()     // Create session
window.joinFirebaseSyncRoom(roomId) // Join session
window.leaveFirebaseSyncRoom()      // Leave session
```

Cloud Share (Build 425+): Large trees use Firebase short URLs with `?s=shortcode` format.

**Jitsi Voice Chat (Build 322-325)**:
- Click 🎙️ Voice button after joining a sync room
- Opens Jitsi Meet in popup window using same room ID
- `window.startVoiceChat()` - Start/join voice session
- Audio-only by default (video muted for bandwidth)
- Prejoin screen skipped for immediate connection
- Display name carries over from collaboration session

**Scheduled Meetings (Build 325)**:
- Create meeting links for future sessions
- Meeting state persisted for scheduled collaboration

### Voice & Audio System

**Camera Snapshot (Build 701)**:
- Real-time webcam capture for analysis
- `captureCameraSnapshot({ quality, facingMode })` - Core capture function
- TreeBeard commands: `capture_camera`, `snapshot`, `selfie`, `take_photo`, `analyze_camera`
- Natural language triggers: "how do I look?", "take a photo", "can you see me?"
- MCP tool: `capture_camera` - Claude Code can request camera snapshots
- Integrates with `analyze_image` for immediate Gemini Vision analysis
- `window._lastCameraCapture` stores last capture for MCP access

**Voice Capture (Build 370+)**:
- `?capture=1` URL parameter for instant recording mode
- Records via Web Speech API with live transcript preview
- Pattern selection after recording (Meeting Notes, Debate, etc.)
- Process captured audio with Claude for structured output

**Whisper API (Build 691)**:
- High-quality transcription via OpenAI Whisper API
- Requires OpenAI API key in Settings
- Toggle in Settings: "Use Whisper for transcription"
- Falls back to Web Speech API if no key or disabled
- MediaRecorder captures audio parallel to Web Speech preview
- `transcribeWithWhisper(audioBlob)` - Core function
- `shouldUseWhisper()` - Check if Whisper enabled

**TTS Read Aloud (Builds 512-513, 642-645)**:
- Text-to-speech for node descriptions
- Smart voice selection (Build 645) - picks highest quality voice
- Auto-Play mode for sequential reading through tree
- Wake lock (Build 643) prevents screen sleep during playback
- Hyperedge narrative narration (Build 644)
- `speakTreeBranch(nodeId)` - Narrate branch
- `speakHyperedgeNarrative(hyperedgeId)` - Narrate hyperedge

**Narrative Caching (Build 695)**:
- Whole-tree narratives saved to `capexTree.narrative`
- Hyperedge narratives cached per hyperedge
- Staleness detection based on node count changes
- `forceRegenerateNarrative()` - Clear cache and regenerate

### Reader Navigation (Builds 507-508)

Sequential navigation through nodes:
- Prev/Next buttons in info panel
- Group iteration for hyperedges and dependency chains
- Keyboard shortcuts for navigation

### Dependency System (Build 510)

Canvas dependency visualization:
- Toggle dependency display on/off
- Filter to show only selected node's dependencies
- Typed dependencies: FS (Finish-Start), SS, FF, SF
- Critical path visualization

### Firestore Collections

- `shared/` - Cloud share links
- `syncRooms/` - Live collaboration rooms
- `gallery_submissions/` - Gallery of Trees submissions

### Telemetry System (Build 542)

Opt-in, privacy-safe, local-first analytics:
- Toggle in Settings: "Enable anonymous telemetry"
- Tracks: command usage, view switches, feature adoption
- Data stored locally, aggregated before any transmission
- `window.getTelemetryData()` - View local telemetry
- Never tracks: tree content, API keys, personal data

### AI Configuration

**Creativity Slider (Build 693)**:
- Temperature control for AI responses (0.0 - 1.0)
- Available in Settings modal
- Affects Claude, Gemini, and ChatGPT calls
- Lower = more focused, Higher = more creative

**Tree-Level AI Settings (Build 694)**:
- Per-tree AI configuration stored in tree metadata
- Notification when loading tree with custom AI settings
- Overrides global settings for specific trees

### View State System (Builds 414, 670-671)

Preserves view configuration across sessions and shares:
- **Captured state**: viewMode, zoom level, pan position, selected node, expanded nodes
- **Save triggers**: Before export, before share, on tree save
- **Restore**: On load, on import, from share links
- `captureViewState()` - Get current view state
- `restoreViewState(state)` - Apply saved state
- Share links include view state for exact reproduction

### Mobile UX (Builds 491-493, 632-641)

**Pinch-to-Zoom (Build 491-493)**:
- All views support pinch gestures on mobile
- Tree, Canvas, 3D, Gantt, Calendar enabled

**Fullscreen Mode (Build 491)**:
- Toggle for immersive mobile experience
- Hides browser chrome

**Single-Pane Navigation (Build 493)**:
- Tree ↔ Info ↔ Chat pane switching
- Swipe gestures between panes

**Keyboard Accessory Bar (Build 632)**:
- Quick actions above mobile keyboard

**PWA Considerations (Build 680)**:
- Safari browser preferred over PWA for live recording
- iOS PWA blocks Speech Recognition - auto-redirect to Safari
- `?capture=1` works best in browser, not PWA

### Treemap View (Builds 624-630)

Hierarchical area visualization:
- **624**: Treemap View button in view dropdown
- **627**: 5 color palette themes
- **630**: Click node to show info panel
- Squarified layout algorithm
- Node size based on child count or custom weight

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
| Voice chat | Join sync room → Click 🎙️ Voice button |
| Quick capture | `?capture=1` URL or TreeBeard voice commands |
| Read aloud | Info panel → Read Aloud button |
| Embed view | `?embed=1` URL parameter |

---

*Last updated: 2026-01-10 (Build 822)*
