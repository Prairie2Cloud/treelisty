---
name: treelisty
description: Work with TreeListy hierarchical project trees. Use when developing, debugging, or adding features to the TreeListy single-file HTML application (~1.3MB), including AI integration, 21 patterns, collaboration, canvas/3D views, hyperedges, LifeTree biographer, Debate Mode, and voice capture.
---

# TreeListy - Hierarchical Project Management Skill

**Version**: 2.19.0 (Build 431)
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

## What's New (Builds 378-431)

### Builds 427-431: Debate Mode
- **AI vs AI spectator debates** with insight extraction
- **Defender vs Challenger** roles (Build 430)
- **4 argument styles**: Scholar, Socratic, Passionate, Pragmatist
- **Floating draggable panel** with transcript
- **Structured output** (Build 431): Arguments extracted as hierarchical tree
- **Navigation fix** (Build 431): New insights highlight, scroll, expand parent
- Right-click node -> "Debate This Topic"
- Key functions: `handleDebate()`, `startDebate()`, `getNextDebateTurn()`, `addInsightsToTree()`

### Build 425: Cloud Share via Firebase
- Firebase short URLs for large trees
- Automatic fallback for trees > 8KB
- Short codes like `treelisty.netlify.app/?s=abc123`

### Build 424: Share URL Size Warnings
- Warning modal for large trees (>100KB)
- "Lite Share" option strips descriptions/subtasks
- Size display shows URL length

### Build 420: Phase Color Cycling
- LifeTree decades get unique colors
- Cycling through 8 distinct hues
- Visual differentiation per time period

### Builds 414-415: Share View State + 3D Splash
- Share links capture view state (view type, selection, zoom)
- 3D cinematic splash on shared link open
- Shape hierarchy: Root=diamond, Phase=hexagon, Item=square, Subtask=circle

### Build 412: MS Project XML Import/Export
- Import .xml files from Microsoft Project
- Export to MS Project format
- Task hierarchy preservation

### Builds 409-411: UX Improvements
- **Zoom to Cursor** (410): Canvas zoom centers on mouse
- **Reader Navigation** (411): Sequential reading mode
- **Context menu fixes** (409): Right-click reliability

### Builds 405-408: Live Tree Agent
- **Floating frame** replaces cramped wizard modal
- **Draggable**, position saved to localStorage
- **Visual node highlighting**: green=new, yellow=modified
- **Full chat history** with scrollable messages
- **Progress bar** synced with tree building
- Key functions: `openTreeAgent()`, `addAgentMessage()`, `trackNodeChange()`

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
VIEW: switch_to_canvas, switch_to_tree, toggle_view, zoom_fit
NAVIGATE: find_node:{query}, expand_node, collapse_node, first_child, parent_node
EDIT: set_title:{text}, set_description:{text}, add_child:{name}, delete_node
AI: ai_enhance_field:{field}, deep_dive, find_redundancies, open_wizard
FILE: new_project, import_text, export_json, live_sync
```

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

## Views

### Tree View
- Hierarchical list for editing
- PM tracking (status, progress, priority)
- Expandable nodes

### Canvas View
- Infinite 2D canvas with drag & drop
- 5 layouts: Classic, Timeline, Hierarchical, Force-Directed, Radial
- Hyperedge visualization
- Zoom to cursor (Build 410)

### 3D View
- Three.js WebGL visualization
- Interactive nodes (hover, click)
- Orbit controls
- Cinematic splash on shared links (Build 414)

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
3. **TREELISTY_VERSION object** (~line 681): `build: XXX`
4. **KNOWN_LATEST** (~line 54512): `const KNOWN_LATEST = XXX;`

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

**End of TreeListy Skill v2.19.0 (Build 431)**
