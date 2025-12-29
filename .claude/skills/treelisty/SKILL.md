---
name: treelisty
description: Work with TreeListy hierarchical project trees. Use when developing, debugging, or adding features to the TreeListy single-file HTML application (~1.3MB), including AI integration, 21 patterns, collaboration, canvas/3D views, hyperedges, LifeTree biographer, Debate Mode, and voice capture.
---

# TreeListy - Hierarchical Project Management Skill

**Version**: 2.20.0 (Build 540)
**Repository**: https://github.com/Prairie2Cloud/treelisty
**Live Site**: https://treelisty.netlify.app

---

## CRITICAL: Deployment Workflow

**NEVER deploy directly to Netlify.** TreeListy uses GitHub -> Netlify auto-deploy.

### Correct Workflow:
1. Make changes to `treeplexity.html`
2. Update version in 4 locations (use treelisty-release skill)
3. `git add treeplexity.html`
4. `git commit -m "Build XXX: Description"`
5. `git push origin main`
6. Netlify auto-deploys within 1-2 minutes

---

## What's New (Builds 529-540)

### Build 540: Performance & Lazy Loading
- **Lazy-load third-party libraries** - Three.js, FullCalendar, SheetJS, html2canvas, JSZip, LZ-String load on demand
- **FCP improved** - 10.8s → 8.1s (25% faster initial render)
- **TBT eliminated** - 90ms → 0ms (no main thread blocking)
- Key function: `loadLibrary(name)` in lazy loader utility

### Builds 536-539: MCP & View Improvements
- **MCP node operations** - Use snake_case params (node_id, parent_id, node_data)
- **TreeBeard tree building** - `focus_root`, `create_tree`, auto-focus on `add_child`
- **3D/Canvas view state** - Respect expand/collapse state from tree view
- **Incremental collapse** - One level at a time instead of all-at-once

### Builds 529-535: PWA & Pattern Fixes
- **PWA localStorage restore** - Re-render after loading saved tree
- **Pattern restore** - Filesystem pattern now applied correctly on tree load
- **MCP file open** - Use client.socket, add debug logging

---

## Previous Features (Builds 518-528)

### Builds 523-528: MCP Bridge & Claude Chrome Integration
- **MCP Task Dispatch** - Bidirectional communication with Claude Code CLI
- **Sync commands** - `sync gmail`, `sync drive`, `sync calendar` via TreeBeard
- **Claude Chrome file opening** - Open Google Drive files via Claude Chrome extension
- **Direct command matching** - Bypasses AI for instant response on sync/file commands
- **Inbox UI** - Review and approve/reject proposed operations from Claude Code
- Key functions: `submitMcpTask()`, `mcpBridgeState`, `COMMAND_REGISTRY['open_gdrive_via_mcp']`
- Architecture: TreeListy dispatches intent → Claude Code executes via Chrome → Results return via MCP Inbox

### Builds 519-522: RAG & Research Enhancements
- **RAG Phase 1** - Enhanced document import with PDF text extraction
- **Hyperedge query fix** - Proper routing to tree analysis vs web research
- **Research bullet parsing** - Better formatting of research results
- **MCP set_view fix** - Proper view switching via button clicks

### Build 518: MCP Bridge Foundation
- **MCP Bridge package** - Node.js server for TreeListy ↔ Claude Code communication
- **Auto-connect** - Optional auto-reconnect on page load
- **Task queue** - Claim, progress, complete pattern for async tasks

---

## Previous Features (Builds 494-517)

### Builds 516-517: Mobile Canvas View UX
- **Canvas View works on mobile** - was previously broken (display:none override)
- **Scrollable compact toolbar** - horizontally scrollable with touch
- **Minimap** - 100x75px positioned bottom-left
- **Context menu** - bottom-sheet style for touch
- CSS: `#canvas-container.active`, `#view-3d.active` overrides in mobile media query

### Builds 514-515: Info Panel Redesign
- **Separate reader nav row** - controls grouped logically
- **Better typography** - 16px font, 1.8 line height for readability
- **Visible close button** - red background, always accessible
- **Compact metadata** - type, ID, cost in footer row

### Builds 512-513: TTS Read Aloud
- **Text-to-speech** for node descriptions via Web Speech API
- **Auto-Play mode** - sequential reading through tree
- **autoPlayNavigating flag** - prevents self-interruption during navigation
- Functions: `speakNode()`, `toggleTTS()`, `toggleAutoPlay()`

### Builds 507-508: Reader Navigation
- **Prev/Next buttons** - sequential node traversal
- **Group iteration** - navigate hyperedge members or dependency chains
- **Position indicator** - "3 of 12" display
- Functions: `navigatePrev()`, `navigateNext()`, `navigateToNode()`

### Build 510: Dependency Display Controls
- **Toggle deps on/off** - `toggleDependencyDisplay()`
- **Filter to selected** - `toggleDepsSelectedOnly()`
- Canvas toolbar buttons for both

### Build 511: Voice Input for Import
- **Mic button** on import modal paste field
- **toggleImportVoiceCapture()** - speech recognition to text

## Previous Major Features (Builds 457-493)

### Gantt View (457-484)
- **Frappe Gantt integration** - professional scheduling view
- **Critical path visualization** - highlight 0-slack tasks
- **Zoom/pan controls** - day/week/month/year views
- **Minimap** - overview navigation
- Key functions: `renderGantt()`, `toggleCriticalPath()`, `updateGanttTask()`

### TreeBeard PM Assistant (485-490)
- **27 Gantt commands** - navigation, analysis, editing
- **Context injection** - tree structure in prompts
- **Proactive nudges** - suggestions based on tree state
- Commands: `gantt_summary`, `gantt_critical_path`, `gantt_set_dates`, etc.

### Mobile UX (491-493)
- **Single-pane navigation** - swipe between views
- **Pinch-to-zoom** - Canvas, 3D, Gantt all support touch
- **All views enabled** - no mobile restrictions
- **Swipe gestures** - edge swipes navigate panels

---

## TreeListy Architecture

### Single-File Application
`treeplexity.html` (~1.3MB) contains everything:
- HTML structure (~2000 lines)
- CSS styles (~4000 lines)
- JavaScript (~55000+ lines)
- All patterns, AI prompts, collaboration logic

### Tree Structure (4 Levels)
```
Root (capexTree)
├── Phase (children array)
│   ├── Item (items array)
│   │   └── Subtask (subItems array)
```

Each node has: `id`, `name`, `type`, `icon`, `expanded`, `description`, plus pattern-specific fields.

---

## 21 Patterns

| Pattern | Key Fields | Use Case |
|---------|------------|----------|
| **generic** | cost, leadTime, dependencies | General project planning |
| **philosophy** | speaker, premises, objections, dialectics | Philosophical analysis |
| **sales** | dealValue, probability, closeDate, contacts | Sales pipeline |
| **thesis** | wordCount, citations, keyArgument | Academic writing |
| **roadmap** | storyPoints, userImpact, technicalRisk | Product planning |
| **prompting** | systemPrompt, userPrompt, examples | Prompt engineering |
| **book** | chapters, scenes, plotPoints | Book writing |
| **film** | camera, lighting, videoPrompt | Traditional film |
| **veo3** | videoPrompt, duration, aspectRatio | Google Veo3 AI video |
| **sora2** | videoPrompt, duration, aspectRatio | OpenAI Sora2 AI video |
| **course** | learningObjectives, exercises | Course design |
| **fitness** | sets, reps, intensity, equipment | Fitness programs |
| **event** | budget, vendors, bookingDeadline | Event planning |
| **strategy** | investment, metrics, riskLevel | Strategic planning |
| **familytree** | birthDate, deathDate, dnaInfo | Genealogy |
| **dialogue** | speaker, rhetoricalDevice, fallacies | Rhetoric analysis |
| **gmail** | recipientEmail, threadId, messageCount | Email workflow |
| **filesystem** | fileSize, fileExtension, dateModified | File organization |
| **freespeech** | legalFramework, rights, restrictions | Legal analysis |
| **lifetree** | eventDate, age, location, people, emotion | Biographical timeline |
| **custom** | User-defined fields | Custom patterns |

---

## AI Features

### TreeBeard Chat Assistant
Two modes in sidebar chat:

**Quick Command Mode** (lightning): JSON action responses
**Deep Conversation Mode** (brain): Full natural language, pattern-aware persona

### TreeBeard Commands
```
VIEW: switch_to_canvas, switch_to_tree, switch_to_3d, view_gantt, toggle_view, zoom_fit
NAVIGATE: find_node:{query}, expand_node, collapse_node, first_child, parent_node
EDIT: set_title:{text}, set_description:{text}, add_child:{name}, delete_node
AI: ai_enhance_field:{field}, deep_dive, find_redundancies, open_wizard
FILE: new_project, import_text, export_json, live_sync

GANTT (Build 485+):
• gantt_view_mode:{day|week|month|year} - Change time scale
• gantt_zoom_in / gantt_zoom_out / gantt_fit_all - Zoom controls
• gantt_today - Scroll to today
• gantt_toggle_critical_path - Highlight critical path
• gantt_summary - Schedule health overview
• gantt_critical_path - Critical path breakdown
• gantt_overdue - List overdue tasks
• gantt_set_dates:{task}, {start}, {end} - Update dates
• gantt_set_progress:{task}, {0-100} - Update progress
• gantt_mark_done:{task} - Complete a task

MCP SYNC (Build 523+):
• sync gmail - Sync Gmail inbox via Claude Chrome
• sync drive - Sync Google Drive files
• sync calendar - Sync Google Calendar events
• sync all - Sync all connected services
• open file {name} - Open file by name (local or cloud)

TREE BUILDING (Build 653+):
• create_tree:{title} - Start new tree with semantic map root
• add_child:{name} - Add child to focused node
• focus_node:{name} - Navigate to node for adding children
• focus_root - Return to root node
• expand_all - Expand entire tree
• set_description:{text} - Add context/claims to focused node
```

### Tree Building Recipe: The Semantic Onion Model

**IMPORTANT**: Follow this methodology when building comprehensive trees from scratch.

**Layer 1: Accepted Semantic Map** - Start with canonical structure (TOC, scene list, timeline)
**Layer 2-N: Peel the Onion** - Research each layer's children systematically
**Atomic Layer: Claims & Arguments** - Deepest level contains actual assertions
**Enrichment Layer: Context** - Why this claim? Historical/philosophical backdrop
**Evaluation Layer: Significance** - Pivotal? Novel? Historical? Foundational?
**Dialectic Layer: Counter-Arguments** - Group by school, follow each thread

Example depth for Kant's Critique:
```
Critique of Pure Reason
  └─ Transcendental Dialectic
       └─ Third Antinomy: Freedom vs Determinism
            └─ Thesis: Causality through freedom exists
                 └─ Kant's Argument
                      └─ Context: Newton's deterministic physics
                      └─ Significance: PIVOTAL - enables Kant's ethics
                      └─ Counter (Hume): Compatibilist freedom
                      └─ Counter (Spinoza): Freedom is illusion
```

**Key Principle**: Don't dump content - systematically decompose layer by layer until reaching atomic claims, then enrich with context, significance, and counter-arguments.

### Chat Builder / Tree Agent
Conversational tree building with floating frame:
- User describes project
- AI asks clarifying questions
- Generates tree incrementally with visual highlighting
- Smart Merge preserves existing data

### Debate Mode (Build 427+)
Right-click any node -> "Debate This Topic":
1. Select two AI personas (Scholar, Socratic, Passionate, Pragmatist)
2. One defends, one challenges the topic
3. Watch AI-vs-AI debate unfold
4. Extract structured insights to tree
5. Pro/con/tension/question categorization

---

## Collaboration System

### Firebase Live Sync
```javascript
window.createFirebaseSyncRoom()  // Create session
window.joinFirebaseSyncRoom(id)  // Join session
window.leaveFirebaseSyncRoom()   // Leave session
window.startVoiceChat()          // Open Jitsi Meet
```

### Cloud Share (Build 425)
- Trees > 8KB use Firebase short URLs
- Format: `?s=shortcode`
- Automatic fallback from URL encoding

### Voice Chat (Build 322)
- Jitsi Meet integration
- Uses session ID for room: `treelisty-{roomId}`

---

## MCP Bridge (Build 518+)

### Overview
Bidirectional communication between TreeListy and Claude Code CLI, enabling:
- **Task dispatch** - TreeListy sends intent, Claude Code executes
- **Chrome automation** - Access Gmail, Drive, Calendar via browser session
- **Inbox review** - Approve/reject proposed changes before applying

### Architecture
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    TreeListy    │   MCP   │   Claude Code   │  Chrome │   Web Services  │
│    (Browser)    │ ──────► │     (CLI)       │ ──────► │                 │
│                 │         │                 │         │  Gmail.com      │
│  Dashboard UI   │         │  Task executor  │         │  Drive.google   │
│  Inbox review   │ ◄────── │  Data structurer│ ◄────── │  Calendar.google│
└─────────────────┘ results └─────────────────┘  data   └─────────────────┘
```

### Key Functions
```javascript
// MCP Bridge State
mcpBridgeState.client.isConnected       // Check connection
mcpBridgeState.client.submitTask({...}) // Dispatch task

// Sync Commands (via COMMAND_REGISTRY)
COMMAND_REGISTRY['sync_gmail']()        // Sync Gmail
COMMAND_REGISTRY['sync_drive']()        // Sync Drive
COMMAND_REGISTRY['open_gdrive_via_mcp'](fileName) // Open via Chrome
```

### MCP Design Pattern
When solving problems in TreeListy, consider the MCP + Chrome lens:
1. **Instead of** trying to read/parse cloud files locally
2. **Dispatch task** to Claude Code with intent
3. **Claude Code** uses Chrome extension to interact with web services
4. **Results return** via MCP Inbox for user approval
5. **TreeListy applies** approved operations to tree

This pattern enables TreeListy to integrate with any web service the user is logged into.

---

## Views (5 Total)

### Tree View
- Hierarchical list for editing
- PM tracking (status, progress, priority)
- Expandable nodes
- Reader navigation mode (prev/next)

### Canvas View
- Infinite 2D canvas with drag & drop
- 5 layouts: Hierarchical, Timeline, Force-Directed, Radial, Grid
- Hyperedge visualization
- Dependency lines with types (FS/SS/FF/SF)
- Zoom to cursor, minimap, search overlay (Ctrl+F)
- Mobile: scrollable toolbar, touch gestures

### 3D View
- Three.js WebGL visualization
- Interactive nodes (hover, click)
- Orbit controls
- Cinematic splash on shared links

### Gantt View (Build 457+)
- Frappe Gantt integration
- Day/week/month/year zoom levels
- Critical path highlighting
- Task drag-to-reschedule
- Minimap navigation

### Calendar View
- Monthly calendar display
- Events from nodes with dates
- Click to navigate to source node

---

## Key Functions Reference

### Tree Operations
```javascript
saveState(description)           // Save undo state
render()                         // Re-render tree view
renderCanvas()                   // Re-render canvas view
render3D()                       // Re-render 3D view
showToast(message, type)         // Show notification
```

### Node Highlighting (Build 406)
```javascript
trackNodeChange(nodeId, 'new')      // Mark node as new (green)
trackNodeChange(nodeId, 'modified') // Mark as modified (yellow)
hasRecentChange(nodeId)             // Check if recently changed
```

### Debate Mode (Build 427+)
```javascript
handleDebate()                   // Start debate from selected node
startDebate()                    // Begin debate with personas
getNextDebateTurn(role)          // Get AI response for role
addInsightsToTree()              // Extract insights to tree
closeDebatePanel()               // Close debate UI
```

### Hyperedges
```javascript
detectSuggestedHyperedges()      // Find auto-groupings
calculateHyperedgeAggregates(he) // Get totals
showQueryBuilderModal()          // Open filter builder
```

### LifeTree
```javascript
showLifeTreeInitModal()          // Initialize LifeTree
createLifeTree()                 // Create with decades
runLifeTreeHealthCheck()         // Diagnose issues (Build 392)
```

---

## Version Update Locations

When releasing a new build, update these 4 locations:

1. **Header comment** (~line 9): `TreeListy v2.19.0 | Build XXX | YYYY-MM-DD`
2. **Changelog** (~lines 21-28): Add new entry at top
3. **TREELISTY_VERSION object** (~line 740): `build: XXX`
4. **KNOWN_LATEST** (~line 60687): `const KNOWN_LATEST = XXX;`

Use the `treelisty-release` skill to automate this.

---

## Data Model

### capexTree Structure
```javascript
{
  id: "root",
  name: "Project Name",
  type: "root",
  icon: "emoji",
  expanded: true,
  pattern: { key: "generic", labels: {...} },
  schemaVersion: 1,
  hyperedges: [...],
  children: [{ type: "phase", items: [...] }]
}
```

### Debate State (Build 427+)
```javascript
{
  topic: "string",
  sourceNodeId: "node-id",
  personas: { a: {...}, b: {...} },
  turns: [{ role: "a"|"b"|"user", text: "...", timestamp: ... }],
  status: "setup"|"active"|"extracting"|"completed",
  extractedInsights: [{ type: "pro"|"con"|"tension"|"question", text: "..." }]
}
```

---

## Troubleshooting

### Debate Mode Issues
- Debate panel not opening: Check `initDebatePanel()` ran
- Add to Tree not showing location: Fixed in Build 431 (highlights + scrolls)

### AI Features Not Working
- Check AI mode selector (Claude/Gemini/ChatGPT)
- Verify API key if using user key
- Server key has 200 req/hr limit

### Share Links Too Long
- Use Cloud Share for large trees (Build 425)
- Use "Lite Share" to strip descriptions (Build 424)

---

**End of TreeListy Skill v2.20.0 (Build 540)**
