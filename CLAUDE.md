# TreeListy - Claude Code Instructions

Current Version: v2.28.0 (Build 566)
Repository: https://github.com/Prairie2Cloud/treelisty
Live Site: https://treelisty.netlify.app

CRITICAL: Deployment Process

TreeListy deploys via GitHub to Netlify (auto-deploy on push).
DO NOT use netlify deploy directly. Changes won't persist.

After making changes to treeplexity.html:
1. git add treeplexity.html
2. git commit -m "Build XXX: Short description"
3. git push

Netlify auto-deploys within 1-2 minutes of push to main.

Project Overview

TreeListy is a single-file HTML application (~1.3MB) for hierarchical project decomposition with AI integration.

Key files:
- treeplexity.html - Main production file (edit this)
- welcome-to-treelisty.json - Default welcome tree
- netlify/functions/claude-proxy.js - Server proxy for Claude API
- .claude/skills/treelisty/SKILL.md - Skill definition

Build Versioning

When making changes, update these 4 locations:
1. Header comment (line ~9): TreeListy v2.19.0 | Build XXX | YYYY-MM-DD
2. Changelog in header (lines ~21-28)
3. TREELISTY_VERSION object (line ~740): build: XXX
4. KNOWN_LATEST (line ~60687): const KNOWN_LATEST = XXX

Use the treelisty-release skill to automate this.

Testing

Run unit tests before committing:
cd test/treelisty-test
npm run test:unit

All 404+ tests should pass.

Architecture

treeplexity.html (single file ~1.3MB)
- HTML structure (~2000 lines)
- CSS styles (~8000 lines)
- JavaScript (~60000+ lines)
  - Data model (capexTree object)
  - Rendering (Tree, Canvas, 3D, Gantt, Calendar views)
  - AI integration (Claude, Gemini, ChatGPT)
  - Pattern system (21 patterns)
  - Collaboration (Firebase Live Sync)
  - Import/Export (JSON, Excel, MS Project XML)
- Netlify function (claude-proxy.js)

Key Variables
- viewMode - current view state (tree/canvas/3d/gantt/calendar)
- capexTree - main tree data structure
- PATTERNS - pattern definitions object
- firebaseSyncState - collaboration session state

Key Functions
- render() - re-render tree view
- renderCanvas() - re-render canvas view
- render3D() - re-render 3D view
- renderGantt() - re-render Gantt view
- renderCalendar() - re-render Calendar view
- saveState(description) - save undo state
- showToast(message, type) - show notification

Recent Features (Builds 541-565)

Image Analysis to Tree (565): Decompose any image into a manipulable node tree!
- TreeBeard commands: `analyze_image`, `analyze`, `analyze_screenshot`, `image_to_tree`
- Flow: Capture screenshot → Gemini Vision analyzes → Creates hierarchical tree with bounding boxes
- Canvas view shows: Source image as background, colored bbox overlays, lines connecting boxes to nodes
- Toolbar controls: Toggle background image, opacity slider, toggle bounding boxes
- Object types color-coded: primary (green), secondary (blue), background (gray), text (amber), UI (purple)

Chrome Extension Screen Awareness (564): Claude Code can now see your browser tab!
- Extension: `packages/treelisty-chrome-extension/` - Load in Chrome via chrome://extensions
- MCP tools: `ext_capture_screen`, `ext_extract_dom`, `ext_list_tabs`, `ext_get_status`
- TreeBeard commands: `capture_screen`, `extract_page`, `list_tabs`, `extension_status`
- Flow: Claude Code → MCP → Bridge → Extension → Chrome Tab capture
- To use: Ensure MCP Bridge running (`node packages/treelisty-mcp-bridge/src/bridge.js`)
- Settings: `.claude/settings.local.json` has ext_* tools allowed

Analyze with Vision (564): After capture_screen, click "Analyze with Vision" link to send screenshot to Claude for analysis.

Previous Features (Builds 529-540)

Performance & Lazy Loading (540): Third-party libraries (Three.js, FullCalendar, SheetJS, html2canvas, JSZip, LZ-String) now lazy-load on demand. FCP improved from 10.8s to 8.1s. Lighthouse score improved.

MCP Node Operations Fix (539): Use snake_case params (node_id, parent_id, node_data) for MCP bridge operations.

TreeBeard Tree Building (538): TreeBeard can now build trees from scratch with focus_root, create_tree, and auto-focus on add_child.

View State Improvements (536-537): 3D and Canvas views respect expand/collapse state. Incremental expand/collapse (one level at a time).

PWA & Pattern Fixes (529-530): Fix PWA localStorage restore, fix pattern restore on tree load.

Previous Features (Builds 518-528)

MCP Bridge & Chrome Integration (523-528): Bidirectional communication with Claude Code CLI. Sync commands (sync gmail/drive/calendar) dispatch tasks to Claude Code, which uses Chrome extension to access web services. Open Google Drive files via Chrome. Inbox UI for reviewing proposed operations.

RAG & Research (519-522): Enhanced document import with PDF extraction. Hyperedge query routing fix. Research bullet parsing improvements.

MCP Bridge Foundation (518): Node.js MCP server for TreeListy ↔ Claude Code communication. Task queue with claim/progress/complete pattern.

Key Architecture: TreeListy dispatches intent → Claude Code executes via Chrome → Results return via MCP Inbox

Previous Features (Builds 494-517)

Mobile Canvas UX (516-517): Canvas View now works on mobile with scrollable compact toolbar, minimap (bottom-left), bottom-sheet context menu, and touch gestures.

Info Panel Redesign (514-515): Separate reader nav row, improved typography (16px, 1.8 line height), compact metadata footer, visible close button.

TTS Read Aloud (512-513): Text-to-speech for node descriptions with Auto-Play mode for sequential reading through tree.

Voice Input (511): Microphone button on import modal paste field for voice-to-text input.

Dependency Controls (510): Toggle dependency display on/off, filter to show only selected node's dependencies.

Reader Navigation (507-508): Sequential prev/next navigation through nodes, group iteration for hyperedges and dependency chains.

Quick Capture (504): URL parameter ?capture=1 for instant voice recording mode.

Previous Features (Builds 457-493)

Gantt View (457-484): Frappe Gantt integration, critical path visualization, zoom/pan, minimap, color design system for task status.

Treebeard PM Assistant (485-490): 27 Gantt commands for navigation, analysis, and editing. Context injection and proactive nudges.

Mobile UX (491-493): Single-pane navigation with swipe gestures. All views (Tree, Canvas, 3D, Gantt, Calendar) enabled on mobile with pinch-to-zoom.

Canvas Enhancements (444-449): Animation system, typed dependencies (FS/SS/FF/SF), dependency creation UI, critical path visualization.

Collaboration System

Firebase Live Sync:
- window.createFirebaseSyncRoom() - create session
- window.joinFirebaseSyncRoom(roomId) - join session
- window.leaveFirebaseSyncRoom() - leave session

Cloud Share (Build 425): Large trees use Firebase short URLs with ?s=shortcode format.

MCP Bridge (Build 518+)

Bidirectional communication between TreeListy and Claude Code CLI:
- packages/treelisty-mcp-bridge/ - MCP server package
- mcpBridgeState.client - Connection state and methods
- COMMAND_REGISTRY - Sync commands (sync_gmail, sync_drive, open_gdrive_via_mcp)
- Inbox UI - Review proposed operations before applying

Design Pattern: When facing limitations (e.g., can't read cloud files locally), dispatch task to Claude Code which uses Chrome extension to interact with web services.
