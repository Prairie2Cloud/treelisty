---
name: treelisty
description: Work with TreeListy hierarchical project trees. Use when developing, debugging, or adding features to the TreeListy single-file HTML application (~1.3MB), including AI integration, 21 patterns, collaboration, canvas/3D views, hyperedges, LifeTree biographer, Debate Mode, and voice capture.
---

# TreeListy - Hierarchical Project Management Skill

**Version**: 2.101.10 (Build 700)
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

## What's New (Builds 666-700)

### Gallery of Trees (Builds 696-700)
Public tree discovery and community sharing system:
- **700**: SubmissionInbox - Firestore-backed gallery submissions
  - `SubmissionInbox.submit(tree, metadata)` - submit tree to gallery
  - `SubmissionInbox.getMySubmissions()` - list user's submissions
  - `SubmissionInbox.withdraw(submissionId)` - cancel pending submission
  - Status: pending → approved/rejected/withdrawn
- **699**: CloneAudit - Validation utilities for clone integrity
  - `CloneAudit.validateTranslationMap(clone, idMap)`
  - `CloneAudit.checkHyperedgeIntegrity(tree)`
  - `CloneAudit.fullAudit(source, clone, idMap)`
- **698**: IndexedDB NodeIndex - Fast node lookup with 50ms target
- **697**: Atlas Provenance - Tracks sourceTreeId, sourceVersion for clones
- **696**: Clone Banner - Visual "Cloned from X" indicator with source link

### Hyperedge Modal Redesign (Build 666)
- Centered floating modal with solid background
- Full text display (no truncation)
- Delete hyperedge with confirmation dialog
- Improved visual design

### TB Structured Tool Use Phase 2 (Build 665)
Multi-step tree building with feedback loop:
- Session state machine: building → reviewing → paused → complete
- "Continue Layer N" buttons after batch adds
- Auto-continue option for fully automatic tree building
- Progress tracking: layer count, node count, elapsed time
- Commands: `start_tree_building`, `continue_tree_building`, `complete_tree_building`

### Atlas Phase 1.1 - Tree Browser (Build 664)
- Tree Switcher dropdown in header (shows recent trees with 📍 indicator)
- Browse Trees modal with two-panel layout (trees → nodes)
- Cross-tree search across all registered trees
- `Ctrl+Shift+T` keyboard shortcut for quick access

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

### Hyperedge & TTS Enhancements (Builds 642-648)
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
- **637**: Prevent pull-to-refresh
- **635**: P1 Mobile UX fixes
- **634**: Fix iOS auto-zoom
- **632**: Mobile keyboard accessory bar

**Note**: Safari browser is now preferred over PWA for better live recording performance.

### UI Themes & Treemap (Builds 625-631)
- **631**: UI Theme Expansion - 10 new themes
- **630**: Treemap info panel on click
- **627**: Treemap color palettes - 5 themes
- **625**: Header update check button

### Atlas Phase 1 - Cross-Tree Intelligence (Build 623)
- TreeRegistry: localStorage-persisted registry of all trees
- Cross-tree hyperedge references: `treeId:nodeGuid` format
- Commands: `list_trees`, `search_trees`, `link_cross_tree`, `switch_tree`

### Sub-Agent Architecture (Builds 620-622)
- **622**: Sub-agent result integration
- **621**: Image spatial commands
- **620**: Sub-agent dispatcher

### Capability Nodes Phase 1 (Builds 615-617)
Chrome capability nodes for authenticated web actions:
- Capability matching: `window.CapabilityMatcher.match(intent)`
- Status tracking: healthy/degraded/broken
- Commands: `list_capabilities`, `test_capability`

### Gmail Enhancements (Build 618)
- Label management UI with create, apply, remove
- Full Gmail action toolbar: archive, trash, star, mark read

---

## Previous Features (Builds 541-623)

### Image Analysis to Tree (Build 565)
- TreeBeard commands: `analyze_image`, `analyze_screenshot`, `image_to_tree`
- Gemini Vision creates hierarchical tree with bounding boxes
- Canvas view: source image background, colored bbox overlays

### Chrome Extension (Build 564)
- `packages/treelisty-chrome-extension/` - Load via chrome://extensions
- MCP tools: `ext_capture_screen`, `ext_extract_dom`, `ext_list_tabs`
- TreeBeard: `capture_screen`, `extract_page`, `list_tabs`

### Performance & Lazy Loading (Build 540)
- Third-party libraries lazy-load on demand
- FCP: 10.8s → 8.1s (25% faster)
- Key function: `loadLibrary(name)`

### MCP Bridge Foundation (Build 518)
- Bidirectional TreeListy ↔ Claude Code communication
- Task queue: claim, progress, complete pattern
- Sync commands: `sync gmail`, `sync drive`, `sync calendar`

---

## TreeListy Architecture

### Single-File Application
`treeplexity.html` (~1.3MB) contains:
- HTML structure (~2000 lines)
- CSS styles (~8000 lines)
- JavaScript (~68000+ lines)
- All patterns, AI prompts, collaboration logic

### Supporting Packages
- `packages/treelisty-mcp-bridge/` - MCP server for Claude Code
- `packages/treelisty-chrome-extension/` - Chrome screen capture
- `netlify/functions/claude-proxy.js` - Server proxy

### Tree Structure (4 Levels)
```
Root (capexTree)
├── Phase (children array)
│   ├── Item (items array)
│   │   └── Subtask (subtasks array)
```

### CRITICAL: Node Type Constraints

**The `type` field MUST be one of exactly 4 values:**
- `root` - Top-level tree node (only one per tree)
- `phase` - Top-level categories (in root's `children` array)
- `item` - Items within phases (in phase's `items` array)
- `subtask` - Sub-items (in item's `subtasks` array)

**For semantic categorization**, use:
- `subtitle` - Short label like `[commentary]` or `[objection]`
- `tags` - Array for categorization
- `description` - Longer text

---

## TreeBeard Commands (100+)

### Navigation
```
focus_node:{name}       Navigate to node by name
focus_root              Return to root
focus_parent            Go to parent
focus_first_child       Go to first child
focus_branch:{name}     Focus Mode - isolate subtree (Build 659)
expand_all              Expand entire tree
collapse_all            Collapse entire tree
```

### Tree Building
```
create_tree:{title}              Start new tree
add_child:{name}                 Add child to focused node
add_sibling:{name}               Add sibling
build_tree_from_topic:{topic}    Auto-build from topic (Build 656)
start_tree_building              Begin multi-step build session (Build 665)
continue_tree_building           Continue to next layer
complete_tree_building           Finish build session
toggle_auto_continue             Toggle automatic continuation
```

### Editing
```
rename_node:{old}, {new}         Rename node
set_description:{text}           Set node description
move_node:{node}, {parent}       Move to new parent
delete_node:{name}               Delete node
duplicate_node:{name}            Duplicate with children
```

### Views
```
switch_view:tree         Switch to tree view
switch_view:canvas       Switch to canvas view
switch_view:3d           Switch to 3D view
switch_view:gantt        Switch to Gantt view
switch_view:calendar     Switch to calendar view
switch_view:mindmap      Switch to mind map view
```

### Hyperedges
```
create_hyperedge:{name}          Create new hyperedge
list_hyperedges                  Show all hyperedges
narrate_hyperedge:{name}         TTS narrative for hyperedge (Build 642)
delete_hyperedge:{name}          Delete hyperedge (Build 666)
add_to_hyperedge:{node},{he}     Add node to hyperedge
```

### Atlas (Build 623+)
```
list_trees                       Show all registered trees
search_trees:{query}             Search across all trees
switch_tree:{id}                 Switch to different tree
link_cross_tree:{treeId:nodeId}  Create cross-tree hyperedge
```

### Gmail (Build 618+)
```
list_emails                      Show inbox threads
read_email:{subject}             Open email in modal
archive_email:{id}               Archive thread
star_email:{id}                  Star thread
draft_reply:{id}                 Create draft reply
```

### Image Analysis (Build 565+)
```
analyze_image                    Analyze current image
capture_screen                   Capture browser tab (via extension)
image_to_tree                    Convert analysis to tree
```

### Gantt (Build 457+)
```
gantt_summary                    Schedule overview
gantt_critical_path              Show critical path
gantt_overdue                    List overdue tasks
gantt_set_dates:{task},{start},{end}
gantt_set_progress:{task},{percent}
gantt_mark_done:{task}
```

### Sync Commands (Build 523+)
```
sync gmail                       Sync Gmail via Claude Chrome
sync drive                       Sync Google Drive
sync calendar                    Sync Google Calendar
open file {name}                 Open file by name
```

---

## Key Functions Reference

### Core Operations
```javascript
saveState(description)           // Save undo state
render()                         // Re-render tree view
renderCanvas()                   // Re-render canvas view
render3D()                       // Re-render 3D view
renderGantt()                    // Re-render Gantt view
showToast(message, type)         // Show notification
normalizeTreeStructure(tree)     // Ensure consistent format
```

### Gallery of Trees (Build 700)
```javascript
SubmissionInbox.submit(tree, metadata)    // Submit to gallery
SubmissionInbox.getMySubmissions()        // Get user's submissions
SubmissionInbox.withdraw(submissionId)    // Cancel submission
showSubmitToGalleryModal()                // Open submit modal
```

### Clone Audit (Build 699)
```javascript
CloneAudit.validateTranslationMap(clone, idMap)  // Verify GUID mapping
CloneAudit.checkHyperedgeIntegrity(tree)         // Check hyperedge refs
CloneAudit.fullAudit(source, clone, idMap)       // Complete audit
```

### Atlas (Build 623+)
```javascript
TreeRegistry.register(tree)              // Register tree
TreeRegistry.getAll()                    // Get all trees
TreeRegistry.search(query)               // Search trees
```

### Focus Mode (Build 659)
```javascript
enterFocusMode(nodeId)           // Isolate subtree in canvas
exitFocusMode()                  // Return to full tree
```

### MCP Bridge (Build 518+)
```javascript
mcpBridgeState.client.isConnected       // Check connection
mcpBridgeState.client.submitTask({...}) // Dispatch task
```

---

## 21 Patterns

| Pattern | Key Fields | Use Case |
|---------|------------|----------|
| **generic** | cost, leadTime, dependencies | General planning |
| **knowledge-base** | sources, citations | Research docs |
| **philosophy** | premises, objections, dialectics | Analysis |
| **debate** | speaker, stance, evidence | Arguments |
| **lifetree** | eventDate, age, location, emotion | Biography |
| **capability** | site, selectors, permissions | Chrome automation |
| **email** | threadId, messageCount | Gmail workflow |
| **image-analysis** | boundingBox, objectType | Visual decomposition |
| **sales** | dealValue, probability | Pipeline |
| **thesis** | wordCount, citations | Academic |
| **roadmap** | storyPoints, userImpact | Product |
| **book** | chapters, scenes | Writing |
| **course** | learningObjectives | Education |
| **fitness** | sets, reps, intensity | Exercise |
| **event** | budget, vendors | Planning |
| **gantt** | startDate, endDate, progress | Scheduling |

---

## Views (6 Total)

### Tree View
- Hierarchical list for editing
- PM tracking (status, progress, priority)
- Reader navigation (prev/next buttons)

### Canvas View
- Infinite 2D canvas with drag & drop
- 5 layouts: Hierarchical, Timeline, Force, Radial, Grid
- Focus Mode for branch isolation (Build 659)
- Dependency lines with types (FS/SS/FF/SF)
- Mobile: scrollable toolbar, touch gestures

### 3D View
- Three.js WebGL visualization
- Interactive orbit controls
- Cinematic splash on shared links

### Gantt View
- Frappe Gantt integration
- Critical path highlighting
- Day/week/month/year zoom

### Calendar View
- Monthly event display
- Click to navigate to source

### Mind Map View
- Radial node layout
- Expand/collapse branches

---

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `shared/` | Cloud share links |
| `syncRooms/` | Live collaboration rooms |
| `gallery_submissions/` | Gallery of Trees submissions |

---

## Version Update Locations

When releasing a new build, update these 4 locations:

1. **Header comment** (~line 9): `TreeListy v2.X.Y | Build XXX | YYYY-MM-DD`
2. **Changelog** (~lines 21-28): Add new entry
3. **TREELISTY_VERSION object** (~line 740): `build: XXX`
4. **KNOWN_LATEST**: Search for `const KNOWN_LATEST`

Use the `treelisty-release` skill to automate this.

---

## Testing

Run unit tests before committing:
```bash
cd test/treelisty-test
npm run test:unit
```

All 469+ tests should pass.

---

## Troubleshooting

### Common Issues
- **Context menu not working**: Ensure node `type` is one of: root, phase, item, subtask
- **Canvas empty**: Check `normalizeTreeStructure()` called on load
- **MCP not connecting**: Run `node packages/treelisty-mcp-bridge/src/bridge.js`
- **Chrome extension not working**: Load unpacked from `packages/treelisty-chrome-extension/`

### AI Features
- Check AI mode selector (Claude/Gemini/ChatGPT)
- Verify API key if using user key
- Server key has rate limits

---

**End of TreeListy Skill v2.101.10 (Build 700)**
