# TreeListy - Hierarchical Project Management Skill

**Version**: 2.17.0 (Build 377)
**Author**: TreeListy Team
**Description**: Work with TreeListy hierarchical project trees using natural language and AI

---

## CRITICAL: Deployment Workflow

**NEVER deploy directly to Netlify.** TreeListy uses GitHub → Netlify auto-deploy.

### Correct Workflow:
1. Make changes to `treeplexity.html`
2. `git add treeplexity.html [other files]`
3. `git commit -m "Build XXX: Description"`
4. `git push origin main`
5. Netlify auto-deploys from GitHub (no manual deploy needed!)

---

## What's New (Builds 322-377)

### Build 377: TreeBeard Conversation Mode - Natural Language Actions
- Conversation mode now includes full action vocabulary
- Understands natural phrases: "build out the 60s", "start working on X"
- Normalizes decade references: "60's" → "1960s"
- Workflow guidance: navigate first, then act

### Build 376: Smart Decade Search
- `find_node` handles decade variations: "60's", "60s", "the 60s" → "1960s"
- Century inference: 20-99 → 1900s, 00-19 → 2000s

### Build 375: LifeTree Biographer - Structured Data Gathering
- 12 core biographical categories (birth, homes, education, family, friends, activities, pets, occupations, relationships, adventures, hardships, milestones)
- Easy-answer question formats (multiple choice, yes/no, true/false)
- One question at a time, confirm and move on

### Build 374: LifeTree Quick Insight Context
- Right-click Quick Insight on LifeTree events now understands biographical context
- AI acts as oral historian, not generic assistant

### Builds 371-373: Artifact System & Bundle Export
- **Artifact Side Panel**: Attach photos, documents, audio to any item
- **IndexedDB Storage**: Artifacts persist across sessions
- **.treelisty Bundle Format**: Export tree + artifacts as portable ZIP
- Simplified Save/Open menu labels

### Build 370: Voice Capture System
- Mobile FAB button for voice recording
- Real-time transcription display
- Voice captures stored and processable by AI
- 5-minute recording limit with warnings

### Builds 366-369: TreeBeard Biographer Mode
- Auto-detects LifeTree pattern and switches to biographer persona
- Birthday Method: walks through life year by year
- Deep Conversation mode with full AI intelligence
- Proactive questioning, memory jogging

### Build 365: LifeTree Pattern
- New biographical timeline pattern
- Decades as phases (auto-generated from birth year)
- Event types: birth, family, education, career, relationship, residence, health, milestone, loss, travel, achievement, memory
- Fields: eventDate, age, location, people, emotion, source, confidence

### Builds 361-364: Smart Hyperedges
- **Auto-Detection**: `detectSuggestedHyperedges()` finds status/assignee/cost clusters
- **Query Builder**: Create hyperedges with filter conditions (status equals, cost >, etc.)
- **Live Aggregates**: Shows $2.3M • 67% • 4 nodes on each hyperedge
- **TreeBeard Queries**: "show items over $500K" creates hyperedges
- **Enhanced Info Modal**: Full hyperedge details with AI analysis

### Builds 353-360: Smart Import & Multi-Tree
- **Smart Import Wizard**: Interactive analysis with context questions
- **Multi-Tree Detection**: Detects slices in documents, creates multiple trees
- **Verification Pass**: Auto-validates and fixes generated trees
- **TreeBeard Personality**: Warm, patient, occasionally philosophical

### Builds 340-352: Mobile & 3D Improvements
- Complete mobile menu rewrite (hamburger, slide-out)
- 3D view mode switching fixes
- Hero session code display
- Mobile tap interaction fixes

### Builds 325-339: Collaboration Features
- **Scheduled Meetings**: Generate meeting links with calendar integration
- **Voice Chat**: Jitsi Meet integration for live sessions
- **Session Code Display**: Easy verbal sharing of session codes
- **Pending Changes Protection**: Prevents data loss during sync

---

## TreeListy Architecture

### Single-File Application
`treeplexity.html` (~1.3MB) contains everything:
- HTML structure (~2000 lines)
- CSS styles (~4000 lines)
- JavaScript (~43000+ lines)
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
Accessible via chat panel in sidebar. Two modes:

**Quick Command Mode** (⚡):
- Returns JSON with action to execute
- Fast command interpretation
- Best for: navigation, quick edits

**Deep Conversation Mode** (🧠):
- Full natural language conversation
- Pattern-aware persona (philosopher, biographer, sales strategist)
- Best for: exploration, brainstorming, complex tasks

### TreeBeard Commands
```
VIEW: switch_to_canvas, switch_to_tree, toggle_view, zoom_fit
NAVIGATE: find_node:{query}, expand_node, collapse_node, first_child, parent_node
EDIT: set_title:{text}, set_description:{text}, add_child:{name}, delete_node
AI: ai_enhance_field:{field}, deep_dive, find_redundancies, open_wizard
FILE: new_project, import_text, export_json, live_sync
```

### AI Wizard
Conversational tree building with strategic questions:
1. User describes project
2. AI asks clarifying questions
3. Generates tree incrementally
4. Uses Smart Merge to preserve existing data

### Analyze Text
Converts unstructured text to tree:
- **Quick Mode**: Fast (1500 tokens/chunk)
- **Deep Mode**: Extended Thinking (8192 tokens/chunk)
- **Semantic Chunking**: NLP-powered segmentation for large documents

### Smart Suggest
Right-click any field for AI-powered suggestions:
- **AI Suggest** (✨): Context-aware, pattern-expert persona
- **Quick Suggest** (💡): Instant static templates

### Deep Dive
Multi-node scholarly analysis:
- Select 3-5 related nodes
- AI generates structured analysis
- Creates hyperedge connecting analyzed nodes

### Find Redundancies
Scans tree for duplicate/similar nodes:
- Semantic similarity detection
- Suggests merge or differentiation
- Helps clean up imported content

---

## Voice & Artifact Features

### Voice Capture (Build 370)
- **Mobile FAB**: Tap microphone button
- **Recording**: Up to 5 minutes continuous
- **Transcription**: Real-time display
- **Processing**: AI analyzes and structures captures

### Artifact Panel (Build 371)
- **Attach Files**: Photos, documents, audio to any item
- **IndexedDB Storage**: Persists across sessions
- **Preview**: View attached media
- **Export**: Included in .treelisty bundles

### Bundle Export (Build 372)
- **Format**: ZIP containing tree.json + artifacts/
- **Portable**: Share complete trees with attachments
- **Import**: Drag .treelisty file to restore

---

## LifeTree Pattern (Build 365)

Biographical timeline for documenting life stories.

### Initialization
1. Subject name
2. Birth year (can be approximate, e.g., "~428 BC")
3. Still living? → Death year if not
4. Decades auto-generated

### Biographer Mode (Build 366)
When LifeTree is active, TreeBeard becomes a biographer:
- **Birthday Method**: Year-by-year exploration
- **Proactive**: Asks questions, jogs memories
- **12 Categories**: Birth, homes, education, family, friends, activities, pets, occupations, relationships, adventures, hardships, milestones

### Event Fields
- `eventDate`: Flexible format ("Summer 1965", "age 7")
- `age`: Auto-calculated from birth year
- `location`: Where it happened
- `people`: Who was involved
- `emotion`: Joyful, Proud, Bittersweet, Difficult, Routine, Milestone
- `source`: Who contributed this memory
- `confidence`: Exact, Approximate, Family legend

---

## Collaboration System

### Firebase Live Sync
- Real-time multi-user editing
- Presence badges (who's online)
- Conflict resolution

### Voice Chat (Build 322)
- Jitsi Meet integration
- One-click join from collab panel
- Uses session ID for room matching

### Async Collaboration
- Google Drive links: `?gdrive=FILE_ID`
- Shareable URLs (base64 compressed)
- Contributor tags (👤) and comments (💬)

### Meeting System (Build 325)
- Schedule meetings with calendar links
- Waiting room for participants
- Voice prompt for verbal sharing

---

## Hyperedges

Cross-cutting connections between nodes in different phases.

### Creation
1. Canvas View → Multi-select nodes (Ctrl+Click)
2. Right-click → "Create Hyperedge"
3. Set label, description, color, type

### Query Builder (Build 361)
Create hyperedges by filter:
- Field: status, priority, cost, progress
- Operator: equals, contains, >, <, between
- Live preview of matching nodes

### Suggestions (Build 361)
Auto-detected patterns:
- Status clusters (3+ items same status)
- Assignee clusters (items by person)
- Cost tiers (>$1M, >$500K, >$100K for CAPEX)

### Aggregates (Build 361)
Live calculations on hyperedge members:
- Total cost: `$2.3M`
- Average progress: `67%`
- Node count: `4 nodes`

---

## Views

### Tree View
- Hierarchical list
- Best for data entry, editing
- PM tracking integration

### Canvas View
- Infinite 2D canvas
- Drag & drop, multi-select
- 5 layouts: Classic, Timeline, Hierarchical, Force-Directed, Radial

### 3D View
- Three.js WebGL visualization
- Interactive nodes (hover, click)
- Hyperedge visualization
- Orbit controls

---

## Key Functions Reference

### Navigation & Selection
```javascript
window.getNodeById(id)           // Find node by ID
window.chatFocusedNode           // Currently focused node
window.selectedCanvasNodes       // Selected nodes array
```

### Tree Operations
```javascript
saveState(description)           // Save undo state
render()                         // Re-render tree view
renderCanvas()                   // Re-render canvas view
showToast(message, type)         // Show notification
```

### AI Operations
```javascript
generateAIAnalysis(item, type)   // Quick Insight analysis
generateAISuggestion(field, ctx) // Smart Suggest
handleAI()                       // Open AI Wizard
```

### Collaboration
```javascript
window.createFirebaseSyncRoom()  // Create live session
window.joinFirebaseSyncRoom(id)  // Join session
window.leaveFirebaseSyncRoom()   // Leave session
window.startVoiceChat()          // Open Jitsi Meet
```

### Hyperedges
```javascript
detectSuggestedHyperedges()      // Find auto-groupings
calculateHyperedgeAggregates(he) // Get totals
showQueryBuilderModal()          // Open filter builder
executeHyperedgeQuery(conditions)// Filter nodes
```

### LifeTree
```javascript
showLifeTreeInitModal()          // Initialize LifeTree
createLifeTree()                 // Create with decades
generateDecades(birth, end)      // Generate decade phases
```

### Artifacts
```javascript
window.openArtifactPanel(id, name) // Open panel for item
handleArtifactFiles(files)         // Process dropped files
window.exportTreelistyBundle()     // Export as .treelisty
window.importTreelistyBundle(file) // Import bundle
```

---

## Data Model

### capexTree Structure
```javascript
{
  id: "root",
  name: "Project Name",
  type: "root",
  icon: "🎯",
  description: "...",
  expanded: true,
  pattern: { key: "generic", labels: {...} },
  schemaVersion: 1,
  hyperedges: [...],
  children: [
    {
      id: "phase-0",
      name: "Phase 1",
      type: "phase",
      items: [
        {
          id: "item-0-0",
          name: "Item",
          type: "item",
          // Pattern-specific fields
          cost: 1000000,
          pmStatus: "In Progress",
          subItems: [...]
        }
      ]
    }
  ]
}
```

### LifeTree Metadata
```javascript
{
  lifetreeSubject: "Mom",
  lifetreeBirthYear: 1938,
  lifetreeDeathYear: null,  // null if still living
  extractedContacts: [...],
  researchRequests: [...]
}
```

### Artifact Structure
```javascript
{
  id: "artifact-uuid",
  itemId: "item-0-0",
  treeId: "tree-uuid",
  name: "photo.jpg",
  type: "image/jpeg",
  size: 123456,
  data: "base64...",
  createdAt: "2025-12-07T..."
}
```

---

## Best Practices

### For TreeBeard
1. **Understand context**: Check current pattern, focused node, tree state
2. **Use appropriate mode**: Quick for commands, Conversation for exploration
3. **Navigate first**: Use `find_node` before editing
4. **Pattern-aware responses**: Philosophy gets dialectics, Sales gets pipeline language

### For AI Operations
1. **Quick Mode for simple tasks**: Faster, cheaper
2. **Deep Mode for complex analysis**: Extended Thinking enabled
3. **Semantic Chunking for large docs**: Prevents hallucination
4. **Smart Merge protects data**: Safe to experiment

### For Collaboration
1. **Firebase for real-time**: Multiple users, live updates
2. **Voice Chat for discussions**: Jitsi Meet integration
3. **Bundles for sharing**: .treelisty includes artifacts
4. **Contributor tags for attribution**: Track who edited what

---

## Troubleshooting

### TreeBeard Not Understanding
- Check if Deep Conversation mode is enabled (🧠)
- Verify pattern is correctly set
- Try explicit commands: "find 1960s", "add child: Event name"

### AI Features Not Working
- Check AI mode selector (Claude/Gemini/ChatGPT)
- Verify API key if using user key
- Server key has 200 req/hr limit

### LifeTree Issues
- Birth year required for decade calculation
- Use "age X" format for automatic year calculation
- Biographer mode auto-activates on LifeTree

### Voice Capture Issues
- Microphone permission required
- Works best on HTTPS
- 5-minute limit per recording

---

## Quick Reference

| User Says | TreeBeard Should |
|-----------|------------------|
| "build out the 60s" | find_node:1960s, then ask what to add |
| "add first grade to 60s" | add_child:Started first grade |
| "when was grandma born?" | Check tree context, ask if not found |
| "show me high-cost items" | Execute hyperedge query for cost > threshold |
| "switch to canvas" | switch_to_canvas action |
| "analyze these nodes" | deep_dive if nodes selected |
| "find duplicates" | find_redundancies action |

---

**End of TreeListy Skill v2.17.0 (Build 377)**

This skill enables Claude Code and potentially TreeBeard to work intelligently with TreeListy, understanding its full capabilities, patterns, and workflows.
