# TreeListy - Hierarchical Project Management Skill

**Version**: 2.17.0 (Build 322)
**Author**: TreeListy Team
**Description**: Work with TreeListy hierarchical project trees using natural language and AI

---

## ⚠️ CRITICAL: Deployment Workflow

**NEVER deploy directly to Netlify.** TreeListy uses GitHub → Netlify auto-deploy.

### Correct Workflow:
1. Make changes to `treeplexity.html`
2. `git add treeplexity.html [other files]`
3. `git commit -m "Build XXX: Description"`
4. `git push origin main`
5. Netlify auto-deploys from GitHub (no manual deploy needed!)

### WRONG (Never Do This):
```bash
# ❌ WRONG - bypasses git history
netlify deploy --prod
```

### RIGHT:
```bash
# ✅ CORRECT - commit first, auto-deploy follows
git add treeplexity.html
git commit -m "Build 213: Feature description"
git push origin main
# Netlify auto-deploys from GitHub
```

**Why this matters**: Direct Netlify deploys bypass version control, making it impossible to track changes, rollback, or collaborate.

---

## What's New in v2.17.0 (Builds 263-322)

### 🎙️ Build 322: Voice Chat for Collaboration
- **Jitsi Meet Integration**: One-click voice chat during live sessions
- **🎙️ Voice Button**: In collaboration chat panel
- **Shared Room**: Uses session ID for automatic room matching
- **No Account Required**: Works on all platforms instantly

### 📋 Build 321: Meeting Transcript Analysis
- **Auto-Detect Transcripts**: Timestamps, "discussed", research requests
- **Extract Contacts**: Name, role, company from meeting mentions
- **Research Requests**: Detects "research this", "look into", "investigate"
- **Smart Preview UI**: Shows extracted contacts and research items before import
- **Tree Metadata Storage**: Contacts and research requests saved for follow-up

### 🎯 Build 320: Optimized Import Prompts
- **CAPEX-Specific Prompts**: Financial rigor (cost extraction, vendor tracking)
- **Philosophy-Specific Prompts**: Scholarly requirements, dialectical structure
- **Pattern-Specific Subtasks**: Tailored guidance for Quick and Deep modes
- **A/B Tested**: Claude Sonnet for CAPEX (98%), Claude Opus for Philosophy (90%)

### 🔀 Build 319: Smart Append + Semantic Deduplication
- **Optimized Model Selection**: Pattern-aware AI model routing
- **Semantic Deduplication**: 60% Jaccard similarity threshold
- **Item Updates vs Duplicates**: Intelligently merges vs adds items

### ⏱️ Build 318: Edge Function Streaming
- **Fixed Timeouts**: Streaming responses for long AI operations
- **Better Reliability**: No more 10-second function timeouts

### 🍌 Build 317: Nano Banana Image Generation
- **Enhanced Imagen 4**: Nano Banana Pro model for image generation

### 🧠 Builds 315-316: Wiser TreeBeard
- **Deep Knowledge Injection**: TreeListy context in all AI calls
- **Context-Aware Responses**: AI understands full project structure

### 🔍 Builds 304-314: Tree View & Search Fixes
- **Search Navigation**: Click search results to navigate
- **Large Tree Handling**: Smart default view for 50+ nodes
- **Filesystem Pattern**: Fixed vertical positioning
- **Zoom Reset**: Proper position preservation

### 🌐 Builds 296-303: 3D View
- **Knowledge Navigator**: Beautiful 3D universe visualization
- **Interactive Nodes**: Hover and click in 3D space
- **Hyperedge Shapes**: Visual connections in 3D
- **Sort-Aware Layouts**: 3D respects current sort order

### 🚀 Builds 280-295: 3D Fly Mode & Polish
- **Three.js Rendering**: WebGL-powered 3D visualization
- **Auto-Update Notifications**: Detect new versions
- **Editable Hyperedges**: Modify cross-phase connections
- **Version Conflict Detection**: Unsaved changes warnings

### 💬 Builds 263-279: Live Collaboration Overhaul
- **Firebase Live Sync**: Real-time multi-user editing
- **Floating Chat Box**: Draggable, always-visible team chat
- **Presence Badges**: See who's online in real-time
- **API Key Sharing**: Optional key sharing with collaborators
- **One-Click Start**: Streamlined session creation

**Key New Functions (Builds 263-322)**:
- `startVoiceChat()` - Launch Jitsi voice room for session
- `detectTranscriptMode(text)` - Check if text is meeting transcript
- `extractContacts(parsed)` - Pull contacts from AI response
- `extractResearchRequests(parsed)` - Find research action items
- `getOptimizedImportModel(pattern)` - Pattern-aware model selection
- `findSemanticDuplicate(existingItems, newItem)` - Jaccard similarity matching

**New Tree Metadata Fields**:
- `capexTree.extractedContacts` (array): Contacts from transcript analysis
- `capexTree.researchRequests` (array): Research items to follow up
- `capexTree.itemUpdates` (array): Updates detected from appended content

---

## What's New in v2.9.4 (Build 156)

**🧠 Semantic Chunking Engine (NEW)**:
- **NLP-Powered Text Segmentation**: Prevents hallucinations on large documents (5000+ words)
- **SemanticChunker Class**: Cosine similarity + 90th percentile adaptive thresholding
- **EmbeddingManager Service**: OpenAI text-embedding-3-small & Gemini text-embedding-004
- **Chunk-by-Chunk Processing**: Process semantic chunks independently in Quick/Deep modes
- **Visual Chunk Distribution**: UI shows detected semantic sections with bar chart
- **Automatic Fallback**: Structural parser (Markdown → paragraphs → lines) when no embedding provider
- **Sliding Window Context**: Improved semantic boundary detection
- **Batch Processing**: Max 20 texts per API call for efficiency
- **Silent Error Handling**: Graceful degradation on failures

**How Semantic Chunking Works**:
1. Split text into sentences
2. Create sliding window context (prev + current + next sentence)
3. Generate embeddings for each window
4. Calculate cosine distances between adjacent windows
5. Determine adaptive threshold (90th percentile of distances)
6. Identify semantic breakpoints where distance > threshold
7. Merge sentences into semantic chunks
8. Process each chunk separately with LLM
9. Aggregate and deduplicate phases from all chunks

**When It Activates**:
- Automatically in Analyze Text (Quick & Deep modes)
- For any text over ~1000 characters
- Uses embedding API if available, falls back to structural split
- Visible in modal as chunk visualization

## What's New in v2.3

**Gmail Import & Analysis**:
- 📧 **Gmail Pattern**: Import and analyze email threads with full conversation context
- 🔗 **Python Export Script**: Fetch Gmail threads via API (export_gmail_to_treelisty.py)
- 🤖 **AI Email Analysis**: Rhetoric, tone, sentiment, relationship dynamics
- 💬 **Context-Aware Responses**: AI sees full thread history for suggestions
- 📊 **10 Email Fields**: recipientEmail, ccEmail, subjectLine, emailBody, threadId, messageCount, etc.
- 🏷️ **6 Thread Types**: Cold Outreach, Newsletter, Response, Follow-up, Internal, Transactional

**Canvas View Improvements**:
- ✅ **Fixed Selection Box**: Middle-click selection now appears at correct mouse position
- 🎯 **Zoom/Pan Accuracy**: Selection box accounts for zoom and pan transformations

## What's New in v2.2

**Canvas Integration (NEW)**:
- 🎨 **Dual View System**: Toggle between Tree View (hierarchical list) and Canvas View (infinite canvas)
- 🖱️ **Drag & Drop**: Move nodes freely, multi-select (Ctrl+Click), group drag
- 📐 **5 Auto-Layouts**: Classic Tree, Timeline, Hierarchical, Force-Directed, Radial
- 🎯 **Phase Zones**: Visual colored regions for each phase
- 🔗 **Visual Connections**: Bezier curve arrows showing dependencies
- 📏 **Grid Snapping**: Toggle grid alignment for precise layouts
- 🔍 **Pan & Zoom**: Infinite canvas with zoom controls (10%-500%)

**New Patterns Added**:
- 🎉 **Event Planning**: Stages, activities, vendors, booking deadlines
- 💪 **Fitness Program**: Phases, workouts, exercises, sets/reps
- 📊 **Strategic Plan**: Pillars, initiatives, investment, metrics
- 👨‍👩‍👧‍👦 **Family Tree**: Generations, people, genealogy, DNA info
- 💾 **File System**: Drives, folders, files with **14 sort options** (size, date, type, owner, extension)
- 💬 **Dialogue & Rhetoric**: Speakers, statements, rhetorical devices, fallacies

**PWA Features**:
- 📱 Installable as native app (desktop/mobile)
- 🌐 Offline capable
- 🎨 4 visual themes (Default, Steampunk, Powerpuff, Tron)

**AI Features**:
- 🧙 **AI Wizard**: Interactive conversational tree building with Smart Merge protection
- 📄 **Analyze Text**: Extract structure from documents (Quick/Deep modes with Extended Thinking)
- 🔬 **AI Review**: Comprehensive tree analysis for completeness, logic, and pattern alignment
- 💡 **Smart Suggest**: Dual-mode field suggestions (AI context-aware vs Quick static)
- 📝 **Generate Prompt**: Export pattern-aware AI-ready prompts (executable, not meta-docs)
- 🔑 **Multi-Provider Support**: Claude (Haiku/Sonnet 4.5), Gemini (2.0 Flash), ChatGPT (GPT-4o)
- 🛡️ **Smart Merge**: Data protection algorithm that never deletes existing content
- 🧠 **Extended Thinking**: Sonnet 4.5 Deep Mode with 5000 token reasoning budget
- 🎭 **Pattern Expert Personas**: Philosophy prof, Sales strategist, Film director, Prompt engineer, etc.

**Web UI Capabilities**:
- Interactive tree visualization with pan/zoom
- Dual view mode (Tree ↔ Canvas toggle)
- Shareable URLs (base64 compression)
- Excel Import/Export (4-sheet workbooks)
- Google Drive import (OAuth, full hierarchy)
- PM Tracking with full status/progress management
- Undo system (Ctrl+Z, 50 states)
- Pattern-specific sorting (14 options for filesystem pattern)

**Pattern-Specific AI Intelligence**:
- Each pattern now has specialized AI behavior
- Philosophy extracts premises/objections, Sales suggests follow-ups
- Film generates Sora/Veo production prompts, AI Prompt creates comprehensive prompts
- All patterns leverage domain expertise for suggestions and analysis

---

## What is TreeListy?

TreeListy is a hierarchical project management tool that organizes work into 4 levels:
- **Root**: Overall project
- **Phases**: Major sections (Acts, Quarters, Chapters, etc.)
- **Items**: Individual tasks/scenes/deals/arguments
- **Subtasks**: Granular steps

TreeListy supports **19 specialized patterns**, each with unique fields:
1. **Generic Project** 📋 - Cost, Lead Time, general planning (6 sort options)
2. **Philosophy** 🤔 - Arguments, speakers, premises, dialectics
3. **Sales Pipeline** 💼 - Deal value, probability, contacts (7 sort options)
4. **Academic Thesis** 🎓 - Word count, citations, arguments
5. **Product Roadmap** 🚀 - Story points, user impact, technical risk
6. **Prompt Engineering** 🧠 - System prompts, examples, CoT, tools
7. **Book Writing** 📚 - Chapters, word counts, plot structure
8. **Event Planning** 🎉 - Budget, vendors, booking deadlines
9. **Fitness Program** 💪 - Sets, reps, intensity, equipment
10. **Strategic Plan** 📊 - Investment, metrics, risk level
11. **Course Design** 📖 - Learning objectives, exercises, assessments
12. **AI Video Production** 🎬 - Video prompts, camera, lighting (Sora/Veo)
13. **Family Tree** 👨‍👩‍👧‍👦 - Genealogy, birth/death dates, DNA info
14. **Dialogue & Rhetoric** 💬 - Rhetorical devices, fallacies, persuasiveness
15. **Gmail Email Workflow** 📧 - Threads, messages, sender, recipients (**6 sort options**: date, subject, message count)
**Plus**: **File System** 💾 - Files, folders, size, dates (**14 sort options**: name, size, modified, created, type, extension, owner)

---

## AI-Powered Features

TreeListy includes powerful AI capabilities that work alongside programmatic manipulation:

### 1. 🧙 AI Wizard - Interactive Project Building

**What it does**: Conversational AI that builds trees through strategic questions

**Usage**:
- **Build Mode**: "Use AI Wizard to create a [pattern] tree for [topic]"
- **Enhance Mode**: "Use AI Wizard to enhance my existing tree with [additions]"

**How it works**:
1. User describes project in natural language
2. AI asks strategic questions to clarify scope, goals, structure
3. Generates tree incrementally with real-time preview
4. Uses **Smart Merge** to preserve existing data when enhancing
5. Updates main tree on completion

**Key features**:
- Pattern-aware questioning (Philosophy asks for dialectic, Sales asks for pipeline stages)
- Real-time tree updates visible in side panel
- Smart Merge protection (never deletes existing content)
- Auto-recovery from errors
- Works with all 9 patterns

**When to use**: Creating new trees from scratch or expanding existing trees with AI guidance

---

### 2. 📄 Analyze Text - Extract Structure from Documents + 🧠 Semantic Chunking

**What it does**: Converts unstructured text into structured TreeListy trees with intelligent chunking

**Usage**:
- **Quick Mode**: "Analyze this text in Quick Mode: [paste document]"
- **Deep Mode**: "Analyze this text in Deep Mode: [paste document]"
- **Append**: "Append this analysis to existing tree"

**Modes**:
- **Quick Mode**: Fast analysis (1500 tokens per chunk), straightforward documents
- **Deep Mode**: Extended Thinking (8192 tokens per chunk), complex documents

**🧠 Semantic Chunking (Build 156)**:
- **Automatic**: Activates for any text over ~1000 characters
- **Intelligent Segmentation**: Uses embeddings to detect natural semantic boundaries
- **Prevents Hallucinations**: Processes large files chunk-by-chunk instead of all at once
- **Visual Feedback**: Shows chunk distribution in modal (purple bars = Quick, red bars = Deep)
- **Fallback**: If no embedding API, uses structural split (Markdown headers → paragraphs → lines)
- **Phase Aggregation**: Merges duplicate phases from chunks, preserves all items

**Pattern-specific extraction**:
- **Philosophy**: Extracts arguments, premises, objections, citations
- **Sales**: Extracts deals, contacts, close dates, competitive info
- **Film**: Extracts scenes, camera angles, lighting descriptions
- **AI Prompt**: Improves basic prompts into comprehensive prompts with system/user/examples
- **Roadmap**: Extracts features, story points, user impact, technical specs
- **Book**: Extracts chapters, scenes, character arcs, plot points

**Special workflow for AI Prompt pattern**:
When analyzing text with AI Prompt pattern selected, TreeListy automatically:
1. Detects if input is a basic prompt needing improvement
2. Applies OpenAI/Anthropic best practices
3. Generates comprehensive prompt with:
   - System prompt (role, context, constraints)
   - User prompt template with {{variables}}
   - Few-shot examples (2-3 high-quality)
   - Chain-of-thought instructions
   - Output format specification
   - Edge case handling
4. Creates EXECUTABLE prompt (paste-ready, not meta-documentation)

**When to use**: Converting specs, notes, articles, or raw text into structured trees

---

### 3. 🔬 AI Review & Enhance - Comprehensive Tree Analysis

**What it does**: Reviews entire tree for completeness, logic, pattern alignment

**Usage**: "Run AI Review on my [pattern] tree"

**What it analyzes**:
- **Completeness**: Missing phases, items, or subtasks
- **Logic flow**: Proper sequencing and dependencies
- **Pattern alignment**: Adherence to pattern best practices
- **Redundancies**: Duplicate or overlapping content
- **Quality**: Field completeness, description quality

**Output**:
- Actionable suggestions for improvements
- Gap identification (missing critical elements)
- Structural issues (circular deps, orphaned items)
- Pattern-specific recommendations

**Pattern-aware review**:
- **Philosophy**: Checks for logical validity, dialectical structure, citation quality
- **Sales**: Reviews deal pipeline health, probability realism, next steps clarity
- **Roadmap**: Validates story point estimates, technical risk assessment, user impact
- **Film**: Checks Sora/Veo prompt quality, production readiness, visual consistency
- **Thesis**: Reviews argument strength, citation coverage, evidence types

**When to use**: Before major presentations, after bulk edits, periodic quality checks

---

### 4. 💡 Smart Suggest - Dual-Mode Field Suggestions

**What it does**: Intelligently fills in field values with context-aware suggestions

**Two modes**:
- **✨ AI Suggest**: Context-aware, pattern-expert persona, tree-aware
- **💡 Quick Suggest**: Instant static templates, no API call

**How AI Suggest works**:
1. Analyzes current tree context (pattern, dependencies, siblings, project description)
2. Adopts pattern expert persona:
   - **Philosophy**: Acts as philosophy professor
   - **Sales**: Acts as sales strategist
   - **Film**: Acts as cinematographer/director
   - **AI Prompt**: Acts as prompt engineer
   - **Roadmap**: Acts as product manager
3. Generates field-specific, domain-appropriate suggestions
4. Falls back to Quick Suggest on error

**Pattern intelligence examples**:
- **Philosophy**: Suggests premises, objections, supporting evidence, textual citations
- **Sales**: Suggests follow-up actions, competitive positioning, deal strategies, next steps
- **Film**: Generates production-ready Sora/Veo prompts with camera angles, lighting, blocking
- **AI Prompt**: Creates system prompts, few-shot examples, chain-of-thought instructions
- **Roadmap**: Suggests implementation tasks, technical specs, acceptance criteria
- **Book**: Suggests scenes, character moments, plot developments, narrative arcs

**When to use**: Filling in fields quickly, getting AI-powered suggestions for content

---

### 5. 📝 Generate Prompt - Export as AI-Ready Prompts

**What it does**: Exports tree as formatted prompt for use with Claude, GPT, etc.

**Usage**: "Generate prompt from my [pattern] tree"

**Output formats**:
- **Generic/Sales/Roadmap**: Hierarchical structure with all details
- **AI Prompt pattern**: EXECUTABLE prompt (paste-ready) with:
  - Single code block containing complete prompt
  - System context + User instruction + Examples + Output format + CoT
  - Component breakdown section for reference
- **Philosophy**: Dialectical argument structure
- **Film**: Scene-by-scene video prompts for Sora/Veo
- **Book**: Chapter summaries and plot structure

**Special handling for AI Prompt pattern**:
Creates dual output:
1. **EXECUTABLE PROMPT** (paste into Claude/GPT immediately)
2. **COMPONENT BREAKDOWN** (for editing/reference)

Ensures output is actionable, not meta-documentation about prompts.

**When to use**: Sharing trees with AI assistants, creating templates, documentation

---

## Multi-Provider AI Support

TreeListy supports 3 AI providers with multiple models:

### Providers & Models

**Anthropic Claude**:
- **Haiku 4.0**: Fast, economical, good for Quick Mode
- **Sonnet 4.5**: Powerful, Extended Thinking support, best for Deep Mode

**Google Gemini**:
- **2.0 Flash**: Fast, cost-effective, latest model

**OpenAI ChatGPT**:
- **GPT-4o**: Most capable, comprehensive analysis

### API Key Management

**Setup**: Users can provide their own API keys via 🔑 Set API Key button
**Storage**: localStorage (persists across sessions)
**Rate limiting**:
- Server API key (default): 200 requests/hour, 8192 max tokens
- User API key: Unlimited (user pays for usage)

**Where to get keys**:
- Claude: console.anthropic.com
- Gemini: aistudio.google.com
- ChatGPT: platform.openai.com

### Extended Thinking Mode

**What it is**: Claude Sonnet 4.5's advanced reasoning capability

**How it works**:
- Available in **Deep Mode** only
- AI gets 5000 token "thinking budget" before responding
- Better reasoning, fewer errors, more comprehensive analysis
- Ideal for: Complex trees, AI Review, Prompt improvement, Deep analysis

**Cost trade-off**: Higher cost but significantly higher quality

**When to use**: Complex projects, critical analysis, quality over speed

---

## Smart Merge Data Protection

TreeListy uses **Smart Merge** algorithm to prevent data loss during AI updates:

**How it works**:
1. **Fuzzy name matching**: Finds related phases/items even if names differ slightly
2. **Additive updates**: AI can add or update, but never deletes
3. **Preserves unmatched data**: All existing content not in update is kept
4. **Transparent logging**: Console shows what was merged, added, or preserved

**Example**:
```
Existing tree has: "Database Setup" with 3 subtasks
AI update suggests: "Database Configuration" with 2 new subtasks

Smart Merge result:
✅ Matches "Database Setup" ≈ "Database Configuration" (fuzzy match)
✅ Preserves original 3 subtasks
✅ Adds 2 new subtasks
✅ Updates description if provided
❌ NEVER deletes the 3 existing subtasks
```

**When it activates**: AI Wizard Enhance mode, AI Review suggestions, Analyze Text append mode

**User benefit**: Safe to experiment with AI features without fear of data loss

---

## Canvas View - Dual View System

TreeListy features a **dual view system** that lets you toggle between Tree View and Canvas View:

### 🎨 Canvas View (NEW in v2.2)

**What it is**: An infinite canvas where you can drag, drop, and arrange nodes visually.

**Key Features**:
- **Drag & Drop**: Click and drag any node to move it freely
- **Multi-Select**: Ctrl+Click to select multiple nodes, drag them together
- **5 Auto-Layout Algorithms**:
  1. **Classic Tree**: Traditional hierarchical tree from left to right
  2. **Timeline**: Horizontal layout showing phases sequentially
  3. **Hierarchical**: Top-down organization chart style
  4. **Force-Directed**: Physics-based automatic spacing
  5. **Radial**: Circular layout with root in center
- **Phase Zones**: Colored dashed regions showing each phase boundary
- **Visual Connections**: Bezier curve arrows showing dependencies
- **Grid Snapping**: Toggle to align nodes precisely
- **Pan & Zoom**: Infinite canvas with mouse wheel zoom (10%-500%)
- **Fit to View**: Auto-zoom to see entire tree
- **Reset View**: Return to default zoom/position

**When to use Canvas View**:
- Visual brainstorming and planning
- Presentations and demos
- Spatial organization (grouping related items)
- Finding patterns across phases
- Working with large trees (easier to navigate)

**When to use Tree View**:
- Data entry and editing (forms are more efficient)
- PM tracking (status, progress, assignments)
- Detailed field editing
- Excel export/import
- Dependency management

**Toggling**: Click the "🎨 Canvas View" or "📊 Tree View" button in header to switch instantly with zero data loss.

---

### 🌐 3D View (NEW in v2.17.0 - Builds 296-303)

**What it is**: A Three.js-powered 3D visualization of your tree as a "Knowledge Navigator" universe.

**Key Features**:
- **WebGL Rendering**: Smooth 3D graphics via Three.js
- **Interactive Nodes**: Hover to highlight, click to select
- **Hyperedge Visualization**: 3D shapes showing cross-phase connections
- **Sort-Aware Layouts**: 3D respects current sort order
- **Phase Grouping**: Nodes clustered by phase with color coding

**Navigation**:
- **Mouse**: Orbit around the scene
- **Scroll**: Zoom in/out
- **Click**: Select node (shows in detail panel)

**When to use 3D View**:
- Visual exploration of complex trees
- Presentations and demos (impressive visuals)
- Finding patterns and clusters
- Understanding hyperedge relationships

**When NOT to use 3D View**:
- Data entry (use Tree View)
- Detailed editing (use Tree or Canvas View)
- Mobile devices (performance limitations)

---

## Web UI Capabilities

TreeListy includes a rich web interface (treeplexity.html) with:

### Visual Features
- **Triple View System**: Tree View (hierarchical), Canvas View (infinite canvas), 3D View (Three.js universe)
- **Interactive tree visualization**: Expandable/collapsible phases and items
- **Dependency arrows**: Visual representation of relationships
- **Phase colors**: Color-coded timeline (green → blue → orange → purple)
- **Pan/Zoom controls**: Navigate large trees easily
- **Detail panel**: Click any item to view/edit full details
- **4 Visual Themes**: Default (indigo), Steampunk (bronze), Powerpuff (pink), Tron (cyan)
- **3D Knowledge Navigator**: WebGL-powered 3D visualization with interactive nodes

### Collaboration Features
- **Shareable URLs**: Compress entire tree to base64, share via URL
- **Excel Import/Export**: 4-sheet professional workbooks (Overview, Tree, Dependencies, PM Tracking)
- **Google Drive Import**: OAuth-based import of full folder hierarchies
- **Pattern detection**: Auto-detects pattern when importing Excel/JSON
- **Append mode**: Merge multiple Excel files into one tree (with semantic deduplication)
- **Collaboration Comments**: Leave notes for collaborators (💬 indicator)
- **Contributor Tags**: Track who made edits (👤 badges)
- **Firebase Live Sync**: Real-time multi-user editing with presence badges
- **🎙️ Voice Chat**: One-click Jitsi Meet integration during live sessions
- **Floating Chat Box**: Draggable team chat during collaboration
- **Google Drive Links**: `?gdrive=FILE_ID` URL loads from Drive
- **Watch Mode Links**: `?watch=URL` auto-starts live sync
- **Meeting Transcript Analysis**: Extract contacts and research requests from appended transcripts

### PWA Features
- **Installable**: Add to home screen on desktop/mobile
- **Offline Capable**: Works without internet (after first load)
- **App-like Experience**: Full-screen, native feel
- **Progressive Enhancement**: Graceful fallback for older browsers

### PM Tracking
- Status tracking: To Do, In Progress, Blocked, Done
- Assignees, due dates, start dates
- Progress percentage (0-100%)
- Priorities: Low, Medium, High, Critical
- Blocking issues notes

### Undo System
- Ctrl+Z / Cmd+Z keyboard shortcut
- Keeps 50 states in history
- Works everywhere except text fields

---

## Core Capabilities

When the user mentions TreeListy or asks to work with `.json` tree files, you can:

### 1. Read & Display Trees
- Load any TreeListy `.json` file
- Display structure as visual tree or table
- Show statistics (total items, completion %, cost, etc.)
- Filter by pattern, phase, status, or custom criteria

### 2. Create & Edit Trees
- Create new trees from scratch or conversation
- Add/remove/update phases, items, subtasks
- Modify any field (pattern-aware)
- Batch operations (update all items matching criteria)

### 3. Intelligent Analysis
- Find critical path and blockers
- Detect circular dependencies
- Check for missing required fields
- Cross-project resource conflict detection
- Timeline validation

### 4. Transformations
- Convert between patterns (thesis → book, project → roadmap)
- Merge multiple trees
- Split large trees into smaller ones
- Extract subtrees by criteria

### 5. Generate Outputs
- Executive summaries and reports
- Sora/Veo video prompts (for film pattern)
- Copy-paste ready AI prompts (for prompting pattern)
- Excel export data
- Documentation (README, slides, boards)

### 6. Quality & Validation
- Lint tree structure
- Validate pattern-specific requirements
- Check dependencies are valid
- Ensure data consistency

---

## TreeListy JSON Structure

```json
{
  "id": "root",
  "name": "Project Name",
  "type": "root",
  "icon": "🎯",
  "description": "Project description",
  "expanded": true,
  "children": [
    {
      "id": "phase-0",
      "name": "Phase 1",
      "subtitle": "Phase subtitle",
      "type": "phase",
      "phase": 0,
      "icon": "1️⃣",
      "expanded": true,
      "items": [
        {
          "id": "item-0-0",
          "name": "Item Name",
          "description": "Item description",
          "icon": "📦",
          "itemType": "type-value",
          "type": "item",
          "dependencies": ["item-0-1"],
          "subtasks": [
            {
              "id": "subtask-0-0-0",
              "name": "Subtask name",
              "description": "Subtask description",
              "pmStatus": "In Progress",
              "pmProgress": 50
            }
          ],
          "expanded": true,
          "cost": 1000000,
          "leadTime": 12,
          "pmStatus": "In Progress",
          "pmAssignee": "John Doe",
          "pmProgress": 75,
          "pmPriority": "High",
          "pmDueDate": "2025-03-15"
        }
      ],
      "children": []
    }
  ],
  "pattern": {
    "key": "generic",
    "labels": {
      "root": "Project",
      "phase": "Phase",
      "item": "Item",
      "subtask": "Subtask"
    }
  }
}
```

---

## Pattern-Specific Fields Reference

### Generic Project
- `cost` (number): Cost in millions ($M)
- `leadTime` (number): Months required
- `dependencies` (array): Item IDs this depends on

### Philosophy
- `speaker` (text): Who is making the argument
- `argumentType` (select): Deductive, Inductive, Abductive, Socratic Elenchus, etc.
- `premise1`, `premise2`, `conclusion` (textarea): Logical structure
- `keyTerms` (text): Important philosophical concepts

### Sales Pipeline
- `dealValue` (number): Deal value in thousands ($K)
- `expectedCloseDate` (date): Target close date
- `leadSource` (select): Inbound, Referral, Cold Outreach, etc.
- `contactPerson` (text): Primary contact
- `stageProbability` (number): 0-100% close probability
- `competitorInfo` (textarea): Competitive intelligence

### Academic Thesis
- `wordCount` (number): Current word count
- `targetWordCount` (number): Target word count
- `keyCitations` (textarea): Important references
- `keyArgument` (textarea): Main thesis argument
- `evidenceType` (select): Empirical, Theoretical, Mixed, etc.

### Product Roadmap
- `storyPoints` (number): Effort estimate (Fibonacci)
- `userImpact` (select): Low, Medium, High, Critical
- `technicalRisk` (select): Low, Medium, High
- `engineeringEstimate` (text): Time estimate
- `featureFlag` (text): Feature flag name

### AI Prompt Design
- `systemPrompt` (textarea): System role/instructions
- `userPromptTemplate` (textarea): User prompt with {{variables}}
- `fewShotExamples` (textarea): Example inputs/outputs
- `structuralTags` (textarea): XML tags like &lt;thinking&gt;
- `assistantPrefill` (text): Claude prefill text
- `chainOfThought` (textarea): CoT instructions
- `outputFormat` (textarea): Expected output structure
- `modelTarget` (select): Claude 3.5 Sonnet, GPT-4o, etc.
- `temperature` (number): 0-1 randomness
- `maxTokens` (number): Token limit
- `toolDefinitions` (textarea): Function calling schema
- `agentWorkflow` (textarea): Multi-agent orchestration
- `contextManagement` (textarea): History management strategy
- `promptInjectionDefense` (textarea): Security measures
- `iterationNotes` (textarea): Version history

### Book Writing
- `wordCount`, `targetWordCount` (number): Chapter length
- `plotPoints` (textarea): Story beats
- `characterArcs` (textarea): Character development
- `pacing` (select): Slow, Moderate, Fast, Intense

### AI Video Production (Film)
- `aiPlatform` (select): Sora (OpenAI), Veo 3 (Google), Runway Gen-3, Pika 2.0
- `videoPrompt` (textarea): Detailed scene description for AI
- `visualStyle` (select): Cinematic, Documentary, Anime, Photorealistic, etc.
- `duration` (select): 2s, 4s, 6s, 10s, 20s
- `aspectRatio` (select): 16:9, 9:16, 1:1, 2.39:1
- `cameraMovement` (select): Dolly In, Tracking Shot, Crane Up, etc.
- `motionIntensity` (select): Minimal, Subtle, Moderate, Dynamic, Intense
- `lightingMood` (select): Golden Hour, Dramatic, Neon, Soft Natural, etc.
- `iterationNotes` (textarea): Prompt engineering insights

### Course Design
- `learningObjectives` (textarea): What students will learn
- `duration` (text): Session length
- `difficultyLevel` (select): Beginner, Intermediate, Advanced
- `prerequisites` (text): Required prior knowledge

### Event Planning
- `budget` (number): Budget for activity
- `vendor` (text): External vendor or supplier
- `bookingDeadline` (date): Last date to book/reserve
- `guestCount` (number): Expected attendees
- `location` (text): Venue, room, area
- `responsiblePerson` (text): Team member handling this

### Fitness Program
- `sets` (number): Number of sets
- `reps` (text): Repetitions per set (e.g., "8-12", "AMRAP")
- `duration` (text): Time for exercise/workout
- `intensity` (select): Light, Moderate, High, Max
- `equipment` (text): Required equipment
- `formCues` (textarea): Technique reminders
- `restPeriod` (text): Rest between sets

### Strategic Plan
- `investment` (number): Capital investment required
- `keyMetric` (text): Success measurement
- `targetValue` (text): Goal to achieve
- `responsibleExecutive` (text): Executive sponsor
- `strategicTheme` (select): Growth, Efficiency, Innovation, Transformation, Risk Mitigation
- `riskLevel` (select): Low, Medium, High

### Family Tree
- `fullName` (text): Complete name including middle names
- `maidenName` (text): Birth surname (if changed)
- `gender` (select): Male, Female, Other, Unknown
- `birthDate` (date): Date of birth
- `birthPlace` (text): City, state, country
- `livingStatus` (select): Living, Deceased, Unknown
- `deathDate` (date): Date of death (if deceased)
- `marriageDate` (date): Date of marriage
- `spouseName` (text): Current or former spouse
- `occupation` (text): Primary occupation
- `dnaInfo` (textarea): Haplogroup, DNA matches, test results
- `sources` (textarea): Birth certificates, census records

### Dialogue & Rhetoric
- `speaker` (text): Who is making this statement
- `verbatimQuote` (textarea): Exact words spoken/written
- `rhetoricalDevice` (select): Logos, Pathos, Ethos, Metaphor, Analogy, etc.
- `logicalStructure` (textarea): Premises and conclusion breakdown
- `fallaciesPresent` (textarea): Logical fallacies identified
- `hiddenMotivation` (textarea): Unstated goals or motivations
- `emotionalTone` (select): Calm, Passionate, Angry, Defensive, etc.
- `counterargument` (textarea): Strongest rebuttal
- `evidenceQuality` (select): Strong, Moderate, Weak, None, Misleading
- `effectivenessRating` (number): 1-10 persuasiveness rating

### Gmail Email Workflow (📧 6 Sort Options)
- `recipientEmail` (text): Primary recipient address
- `ccEmail` (text): Carbon copy recipients
- `subjectLine` (text): Email subject line
- `emailBody` (textarea): Main content of the email
- `sendDate` (date): When email was sent/received
- `status` (select): Draft, Ready, Sent, Replied, Archived
- `threadId` (text): Gmail thread identifier
- `messageCount` (number): Number of messages in thread
- `sender` (text): Email sender
- `labels` (text): Gmail labels/categories

**Gmail Sort Options** (6 total):
1. Date (Newest First / Oldest First)
2. Subject (A-Z / Z-A)
3. Messages (Most First / Least First)

**Special Features**:
- Import via Python script: `export_gmail_to_treelisty.py`
- Slash command: `/refresh-gmail`
- AI analysis: Rhetoric, tone, sentiment, relationship dynamics
- Context-aware responses: AI sees full thread history

### File System (💾 14 Sort Options)
- `fileSize` (number): Size in bytes
- `fileExtension` (text): File type (.pdf, .docx, .mp4)
- `filePath` (text): Complete file path
- `dateModified` (date): Last modification date
- `dateCreated` (date): Creation date
- `fileOwner` (text): Owner/creator name
- `isFolder` (boolean): Is this a folder?
- `fileUrl` (text): Web link (for cloud files)
- `sharedWith` (text): Share permissions

**File System Sort Options** (14 total):
1. Name (A-Z / Z-A)
2. Size (Largest / Smallest First)
3. Modified Date (Newest / Oldest First)
4. Created Date (Newest / Oldest First)
5. Type (Folders First / Files First)
6. Extension (A-Z / Z-A)
7. Owner (A-Z / Z-A)

---

## PM Tracking Fields (All Patterns)

When `includeTracking: true`, items can have:
- `pmStatus` (select): To Do, In Progress, Blocked, Done
- `pmAssignee` (text): Person responsible
- `pmProgress` (number): 0-100% completion
- `pmPriority` (select): Low, Medium, High, Critical
- `pmDueDate` (date): Deadline (YYYY-MM-DD)
- `pmStartDate` (date): Start date (YYYY-MM-DD)

---

## Common Operations

### Read a Tree
```javascript
// Load and parse JSON
const tree = JSON.parse(await readFile('path/to/tree.json'));
const pattern = tree.pattern?.key || 'generic';
```

### Display Tree Structure
```
🎯 Project Name (Generic Project)

Phase 0: Infrastructure Setup
├─ 📦 Cloud Architecture Design [$2.5M, 8 months]
│  Dependencies: None
│  Status: Done (100%)
├─ 🔧 Database Migration [$1.2M, 6 months]
│  Dependencies: Cloud Architecture Design
│  Status: In Progress (60%)
│  ├─ Schema design [Done]
│  ├─ Data migration scripts [In Progress, 70%]
│  └─ Testing & validation [To Do]
└─ 🌐 API Gateway Setup [$0.8M, 4 months]
   Dependencies: Database Migration
   Status: Blocked (0%)
```

### Find Critical Path
```javascript
// Find items with most downstream dependencies
function findBottlenecks(tree) {
  const dependencyGraph = buildDependencyGraph(tree);
  const blocking = {};

  for (const [itemId, deps] of Object.entries(dependencyGraph)) {
    for (const dep of deps) {
      blocking[dep] = (blocking[dep] || 0) + 1;
    }
  }

  return Object.entries(blocking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}
```

### Calculate Statistics
```javascript
function getTreeStats(tree) {
  let totalItems = 0;
  let completedItems = 0;
  let totalCost = 0;

  tree.children.forEach(phase => {
    phase.items?.forEach(item => {
      totalItems++;
      if (item.pmStatus === 'Done') completedItems++;
      if (item.cost) totalCost += item.cost;
    });
  });

  return {
    totalItems,
    completedItems,
    completionRate: (completedItems / totalItems * 100).toFixed(1),
    totalCost: `$${(totalCost / 1000000).toFixed(1)}M`
  };
}
```

---

## Example Workflows

### AI-Assisted Workflows

These workflows combine AI features with programmatic manipulation:

#### Workflow A: AI-Assisted Tree Creation
**User**: "Create a product roadmap for our Q2 features"

**Actions**:
1. Suggest using AI Wizard for initial structure: "Let me use AI Wizard to build this"
2. AI Wizard asks strategic questions:
   - What are the main feature categories?
   - What's the user impact priority?
   - What are the technical dependencies?
3. AI generates tree with Product Roadmap pattern
4. Review generated tree programmatically for validation
5. Enhance with additional details using Smart Suggest
6. Run AI Review to check completeness
7. Save as `q2-roadmap-2025.json`

**Why this approach**: AI handles ideation/structure, you handle validation/refinement

---

#### Workflow B: Document Analysis + Validation
**User**: "Convert this PRD document into a roadmap tree and validate dependencies"

**Actions**:
1. Use Analyze Text (Deep Mode) to extract structure from PRD
2. Load resulting tree programmatically
3. Build dependency graph and validate:
   - Check for circular dependencies
   - Verify all referenced item IDs exist
   - Ensure technical dependencies are realistic
4. If issues found, use AI Review for suggestions
5. Apply fixes programmatically (update dependencies, re-ID items)
6. Re-validate
7. Export to Excel for stakeholder review

**Why this approach**: AI extracts structure, you ensure data integrity

---

#### Workflow C: Smart Merge Enhancement
**User**: "Enhance my existing film tree with AI suggestions, but keep all my custom notes"

**Actions**:
1. Load existing tree: `film-noir-project.json`
2. Use AI Wizard in Enhance mode: "Add 3 more B-roll scenes to Act II"
3. Smart Merge activates automatically:
   - Preserves all existing scenes and their custom notes
   - Adds new scenes where AI suggests
   - Updates descriptions only where explicitly mentioned
4. Programmatically verify merge:
   - Count items before/after (ensure nothing deleted)
   - Check console logs for Smart Merge decisions
5. Use Smart Suggest (AI mode) to enhance videoPrompt fields for new scenes
6. Run AI Review to check production readiness
7. Save enhanced tree

**Why this approach**: Combines AI creativity with data preservation guarantees

---

#### Workflow D: Multi-Pattern Analysis
**User**: "I have a sales tree and a roadmap tree - are there timeline conflicts?"

**Actions**:
1. Load both trees: `q1-sales.json`, `q2-roadmap.json`
2. Extract timeline data from each:
   - Sales: `expectedCloseDate` fields
   - Roadmap: `pmDueDate` and `engineeringEstimate`
3. Cross-reference for resource conflicts:
   - Same engineer assigned to both?
   - Overlapping critical dates?
4. Use AI Review on roadmap to assess feasibility
5. Generate consolidated report with:
   - Timeline visualization
   - Conflict markers
   - AI-suggested resolutions
6. Save as `q1-q2-timeline-analysis.md`

**Why this approach**: Programmatic data extraction + AI-powered resolution suggestions

---

#### Workflow E: Prompt Engineering Workflow
**User**: "Improve this basic prompt: 'find good restaurants nearby'"

**Actions**:
1. Select AI Prompt Design pattern
2. Use Analyze Text with the basic prompt
3. AI automatically detects prompt improvement workflow:
   - Applies OpenAI/Anthropic best practices
   - Creates system prompt, user template, few-shot examples
   - Adds CoT instructions, output format, edge cases
4. Generated tree includes:
   - Phase 1: System Prompts (role definition)
   - Phase 2: User Templates (with {{location}}, {{preferences}} variables)
   - Phase 3: Few-Shot Examples (3 realistic examples)
   - Phase 4: Output Format (JSON schema for results)
5. Use Generate Prompt to create EXECUTABLE version
6. Output is paste-ready for Claude/GPT (not meta-documentation)
7. Test executable prompt, iterate if needed

**Why this approach**: AI transforms basic → comprehensive, you get production-ready output

---

#### Workflow F: Collaborative Editing ("Chess by Mail")
**User**: "My son Owen and I want to collaborate on a philosophy debate tree"

**Actions**:
1. Create tree with Philosophy pattern (AI Wizard or manual)
2. Save to shared location (Google Drive, OneDrive, Dropbox)
3. Get shareable link: Right-click file → Share → Anyone with link
4. Email Owen: `https://treelisty.netlify.app?gdrive=YOUR_FILE_ID`
5. Owen opens link → tree loads automatically
6. Owen edits, sets Contributor to "Owen", adds collaboration comments
7. Owen saves to same shared file
8. You reload or use Watch Mode to see Owen's changes
9. See 👤 Owen badges and 💬 indicators on modified nodes
10. Respond, set Contributor to "Dad", continue the debate!

**Watch Mode (Live Sync)**:
- Both open Watch Mode → Same file → 5 second poll interval
- See each other's edits in near-real-time during a call
- Auto-detects changes, skips your own saves

**Why this approach**: Async/sync collaboration without complex infrastructure

---

### Traditional Programmatic Workflows

#### Workflow 1: Meeting Notes → Project Tree
**User**: "Convert these meeting notes into a product roadmap tree: [paste notes]"

**Actions**:
1. Parse notes for features, owners, priorities
2. Detect natural grouping (quarters, epics, sprints)
3. Create tree structure with Product Roadmap pattern
4. Populate fields: storyPoints, userImpact, technicalRisk, assignees
5. Set dependencies based on "depends on", "requires", "after" keywords
6. Save as `product-roadmap-YYYY-MM-DD.json`
7. Display summary with stats

### Workflow 2: Critical Path Analysis
**User**: "What's blocking me in my film tree?"

**Actions**:
1. Load tree
2. Build dependency graph
3. Find items with `pmStatus !== 'Done'` that block multiple downstream items
4. Check for missing required fields (videoPrompt, cameraMovement, etc.)
5. Report blockers with recommendations
6. Offer to auto-fill fields using AI

### Workflow 3: Cross-Tree Resource Conflicts
**User**: "Load all my .json trees and check if I'm overcommitted this week"

**Actions**:
1. Find all `.json` files in directory
2. Load and parse each tree
3. Extract items with `pmDueDate` in current week
4. Estimate time per item (from storyPoints, engineeringEstimate, wordCount, etc.)
5. Sum total hours required
6. Compare to 40 hrs/week capacity
7. Report conflicts with suggestions to reschedule

### Workflow 4: Pattern Transformation
**User**: "Convert my thesis tree to book writing pattern"

**Actions**:
1. Load thesis tree
2. Create new tree with book pattern
3. Map fields:
   - Academic chapters → Book chapters
   - `wordCount` → `wordCount` (preserve)
   - `keyCitations` → Store in notes
   - `keyArgument` → `plotPoints` (reframe as narrative)
4. Restructure hierarchy (academic → narrative flow)
5. Save as new file
6. Show diff report

### Workflow 5: Generate Sora Video Prompts
**User**: "Generate professional Sora prompts from my film tree"

**Actions**:
1. Load film tree
2. For each scene item:
   - Extract: name, description, videoPrompt
   - Synthesize comprehensive prompt:
     * Core description (videoPrompt or description)
     * Camera movement (cameraMovement)
     * Visual style (visualStyle)
     * Lighting mood (lightingMood)
     * Technical specs (duration, aspectRatio)
3. Ensure minimum 100 characters per prompt
4. Format as copy-paste ready with sections:
   - Scene name
   - **Platform**: aiPlatform
   - **Prompt**: [synthesized]
   - **Tech**: duration, aspect, style
5. Save as markdown with usage instructions

### Workflow 6: Executive Summary
**User**: "Generate board report from Q1 sales pipeline"

**Actions**:
1. Load sales tree
2. Calculate metrics:
   - Total pipeline value (sum dealValue)
   - Weighted value (dealValue × stageProbability)
   - Stage breakdown (group by itemType)
   - Top 5 deals (sort by dealValue)
3. Identify risks (low probability, competitor info)
4. Identify opportunities (high probability, closing soon)
5. Generate markdown report with charts (ASCII or table)
6. Save as `q1-sales-summary.md`

### Workflow 7: Dependency Validation
**User**: "Check my tree for dependency issues"

**Actions**:
1. Load tree
2. Build dependency graph
3. Check for:
   - Circular dependencies (DFS cycle detection)
   - Forward dependencies (item depends on future item)
   - Missing dependencies (referenced ID doesn't exist)
   - Orphaned items (no dependencies, not depended upon)
4. Report issues with severity levels
5. Offer auto-fix options
6. Apply fixes if user approves

### Workflow 8: Merge Trees
**User**: "Merge noir-b-roll.json into citizen-kane.json Act III"

**Actions**:
1. Load both trees
2. Validate patterns match (or offer to convert)
3. Find target phase (Act III)
4. For each item in source tree:
   - Re-ID to avoid conflicts (item-X-Y → item-3-Z)
   - Update dependencies to new IDs
   - Preserve all fields
5. Detect style conflicts, suggest resolution
6. Insert into target phase
7. Save merged tree
8. Show diff summary

### Workflow 9: Quality Linting
**User**: "Lint my thesis tree"

**Actions**:
1. Load thesis tree
2. Check Academic Thesis pattern requirements:
   - Each chapter has wordCount and targetWordCount
   - keyCitations present (warn if < 5)
   - keyArgument defined
   - evidenceType set
3. Check general requirements:
   - No circular dependencies
   - All dependencies valid
   - PM tracking consistent (dates, status)
4. Report: PASSED, WARNINGS, ERRORS
5. Offer auto-fixes where possible

### Workflow 10: Diff Tree Versions
**User**: "What changed between thesis-feb10.json and thesis-feb17.json?"

**Actions**:
1. Load both trees
2. Compare:
   - Completed items (pmStatus changes)
   - New items added
   - Removed items
   - Field value changes (wordCount, citations, etc.)
   - Dependency changes
3. Calculate metrics:
   - Velocity (words/day, items/day)
   - Completion rate change
4. Generate diff report with:
   - ✅ Completed
   - 📝 In Progress
   - 🆕 Added
   - ❌ Removed
   - 📊 Metrics
   - 📈 Velocity projection
5. Estimate time to completion

---

## Best Practices

### When Using AI Features
1. **Choose the right mode**:
   - Quick Mode for straightforward documents (faster, cheaper)
   - Deep Mode for complex analysis (Extended Thinking, higher quality)
2. **Use AI Wizard for greenfield projects**: Start from scratch with conversational guidance
3. **Use Analyze Text for existing content**: Convert specs, notes, documents into trees
4. **Use AI Review before major milestones**: Presentations, stakeholder reviews, releases
5. **Trust Smart Merge**: It preserves your data - safe to experiment with Enhance mode
6. **Leverage pattern experts**: Smart Suggest AI mode gives domain-specific intelligence
7. **Use your own API key for heavy usage**: Bypasses 200/hr rate limit
8. **Extended Thinking for critical work**: Sonnet Deep Mode for important trees

### When Reading Trees
1. **Always validate JSON** before parsing
2. **Check pattern** to know which fields are available
3. **Handle missing fields gracefully** (older trees may lack new fields)
4. **Preserve IDs** when making changes (critical for dependencies)

### When Displaying Trees
1. **Use visual tree format** for structure (├─ └─)
2. **Show key metrics** relevant to pattern (cost for generic, dealValue for sales)
3. **Highlight blockers** and critical items
4. **Use emoji icons** from tree data
5. **Include AI Review suggestions** if available

### When Editing Trees
1. **Save state before changes** (for undo - web UI keeps 50 states)
2. **Re-calculate IDs** when adding items (maintain numbering)
3. **Update dependencies** when moving/deleting items
4. **Validate after edit** to prevent breaking tree
5. **Use Smart Suggest to fill fields quickly** (right-click any field)
6. **Verify Smart Merge results** (check console logs for what was preserved/added)

### When Generating Outputs
1. **Pattern-aware formatting** (sales ≠ thesis ≠ film)
2. **Include context** (project name, date, stats)
3. **Make copy-paste ready** (proper markdown, code blocks)
4. **Provide usage instructions** for generated content
5. **AI Prompt pattern**: Always create EXECUTABLE prompts, not meta-docs
6. **Film pattern**: Use Generate Prompt for production-ready Sora/Veo prompts

### When Choosing AI Providers
1. **Haiku/Flash/4o-mini**: Fast, cheap, good for Quick Mode and simple trees
2. **Sonnet 4.5**: Best quality, Extended Thinking, ideal for complex analysis
3. **Pro/4o**: Middle ground - more capable than fast models, cheaper than Sonnet
4. **Consider cost vs quality**: Extended Thinking costs more but delivers significantly better results
5. **Use server key for testing**: Use your own key for production/heavy usage

---

## Error Handling

Common issues and solutions:

### Invalid JSON
```javascript
try {
  const tree = JSON.parse(content);
} catch (e) {
  return "❌ Invalid JSON. Error: " + e.message;
}
```

### Missing Pattern
```javascript
const pattern = tree.pattern?.key || 'generic';
// Fallback to generic if pattern undefined
```

### Broken Dependencies
```javascript
function validateDependencies(tree) {
  const allIds = getAllItemIds(tree);
  const broken = [];

  forEachItem(tree, item => {
    item.dependencies?.forEach(depId => {
      if (!allIds.includes(depId)) {
        broken.push({ item: item.id, missing: depId });
      }
    });
  });

  return broken;
}
```

### Circular Dependencies
```javascript
function detectCycles(tree) {
  const graph = buildDependencyGraph(tree);
  const visited = new Set();
  const recStack = new Set();

  function dfs(node) {
    if (recStack.has(node)) return [node]; // Cycle found
    if (visited.has(node)) return null;

    visited.add(node);
    recStack.add(node);

    for (const dep of graph[node] || []) {
      const cycle = dfs(dep);
      if (cycle) return [...cycle, node];
    }

    recStack.delete(node);
    return null;
  }

  for (const node of Object.keys(graph)) {
    const cycle = dfs(node);
    if (cycle) return cycle;
  }

  return null;
}
```

---

## Helper Functions

### Get All Items
```javascript
function getAllItems(tree) {
  const items = [];
  tree.children?.forEach(phase => {
    phase.items?.forEach(item => {
      items.push({ ...item, phaseId: phase.id, phaseName: phase.name });
    });
  });
  return items;
}
```

### Find Item by ID
```javascript
function findItemById(tree, itemId) {
  for (const phase of tree.children || []) {
    const item = phase.items?.find(i => i.id === itemId);
    if (item) return { item, phase };
  }
  return null;
}
```

### Build Dependency Graph
```javascript
function buildDependencyGraph(tree) {
  const graph = {};
  getAllItems(tree).forEach(item => {
    graph[item.id] = item.dependencies || [];
  });
  return graph;
}
```

### Format Cost
```javascript
function formatCost(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}
```

### Calculate Total Cost
```javascript
function calculateTotalCost(tree) {
  let total = 0;
  getAllItems(tree).forEach(item => {
    if (item.cost) total += item.cost;
  });
  return total;
}
```

---

## Quick Reference: Common Commands

When user says... | Action
---|---
**AI-Powered Commands** |
"Use AI Wizard to create [pattern] tree for [topic]" | Launch AI Wizard in Build mode, conversational creation
"Enhance my tree with AI" | Launch AI Wizard in Enhance mode, Smart Merge protection
"Analyze this text: [paste doc]" | Use Analyze Text (choose Quick or Deep mode)
"Review my [pattern] tree" | Run AI Review for completeness/quality analysis
"Suggest content for this field" | Use Smart Suggest (AI or Quick mode)
"Generate prompt from my tree" | Export tree as AI-ready prompt (pattern-aware)
"Improve this basic prompt: [text]" | Use AI Prompt pattern + Analyze Text workflow
**Collaboration Commands** |
"Start voice chat" | Click 🎙️ Voice button in collab chat → Opens Jitsi Meet
"Collaborate with Owen on tree" | Create live session, share invite link
"Share tree via Google Drive" | Save to Drive, email `?gdrive=FILE_ID` link
"Start Live Session" | Click Live Sync → Create Room → Share link
"See who edited what" | Look for 👤 contributor badges on nodes
"Leave note for collaborator" | Edit node → Collaboration section → Comments field
"Append meeting transcript" | Analyze Text → Append mode → Paste transcript (auto-detects contacts/research)
**Traditional Commands** |
"Load/Show my [name] tree" | Read JSON, display visual tree
"What's blocking me?" | Find critical path, report blockers
"Create [pattern] tree for [topic]" | Generate new tree structure (programmatically)
"Add [item] to [phase]" | Insert new item, update IDs
"Convert to [pattern]" | Transform pattern, map fields
"Merge [tree1] into [tree2]" | Combine trees intelligently
"Generate [output type]" | Create prompts/reports/exports
"Check for issues" | Validate deps, lint structure
"What changed since [date]?" | Diff two versions
"Summarize my [tree]" | Generate executive summary

---

## Output Formats You Can Generate

1. **Sora/Veo Video Prompts** (Film pattern)
   - Professional AI video prompts
   - Synthesized from all scene fields
   - Copy-paste ready for Sora/Veo/Runway/Pika

2. **Executable AI Prompts** (Prompt Engineering pattern)
   - System prompt + User prompt + Examples
   - Structured with XML tags
   - Includes CoT, tools, agent workflows

3. **Executive Summaries** (All patterns)
   - Key metrics and statistics
   - Risks and opportunities
   - Next actions and recommendations

4. **Documentation** (All patterns)
   - README files with structure
   - Slide outlines for presentations
   - Board export for Jira/Miro/GitHub

5. **Progress Reports** (All patterns)
   - Velocity metrics
   - Completion rates
   - Timeline projections

---

## Advanced Patterns

### Multi-Tree Analysis
When user says "Load all my trees" or "Check all projects":
1. Find all `.json` files in current directory
2. Load and validate each
3. Cross-analyze for resource conflicts, deadlines, dependencies
4. Generate consolidated report

### Intelligent Conversion
When user says "Convert thesis to book":
1. Load source tree
2. Detect pattern transformation needed
3. Map fields intelligently:
   - Preserve data (wordCount, citations)
   - Reframe structure (academic → narrative)
   - Suggest new fields based on pattern
4. Generate new tree
5. Show before/after comparison

### Dependency Automation
When user says "Fix dependency issues":
1. Detect circular refs
2. Find forward dependencies (impossible)
3. Identify orphaned items
4. Suggest repairs
5. Apply fixes if approved
6. Re-validate

---

## Integration Points

TreeListy skill works well with:
- **File operations**: Read/Write JSON files
- **Git**: Version control tree files
- **Export tools**: Generate CSV, markdown, JSON for other platforms
- **AI models**: Use Claude/GPT to enhance tree content
- **Analysis**: Statistical analysis, reporting, visualization

---

## Tips for Best Results

1. **Be specific about pattern**: "Create a Sales Pipeline tree" (not just "tree")
2. **Use pattern terminology**: "Add a deal" (Sales), "Add a scene" (Film), "Add a chapter" (Book)
3. **Reference by name or ID**: "Update the TechCorp deal" or "Update item-0-3"
4. **Ask for validation**: "Check my tree for issues" before making major changes
5. **Save versions**: Keep dated copies (project-2025-02-17.json) for diff analysis

---

## Troubleshooting

### AI-Related Issues

**Q: AI features not working?**
A: Check if AI mode is enabled (🤖 AI dropdown in header). Select a provider (Claude/Gemini/ChatGPT).

**Q: Getting "API key required" error?**
A: Either use server key (200/hr limit) or click 🔑 Set API Key to provide your own key.

**Q: Rate limit exceeded?**
A: Server key has 200 req/hr limit. Provide your own API key to bypass limits (unlimited usage, you pay).

**Q: Extended Thinking error: "max_tokens must be greater than thinking.budget_tokens"?**
A: This was a bug, now fixed. Extended Thinking uses 8000 max_tokens (5000 thinking + 3000 response).

**Q: AI deleted my data during Enhance mode?**
A: This shouldn't happen - Smart Merge protects data. Check console logs. If it occurred, report as bug.

**Q: Smart Suggest not giving pattern-specific suggestions?**
A: Ensure correct pattern is selected. Try AI Suggest mode (✨) instead of Quick Suggest (💡).

**Q: Generated prompt doesn't work (creates meta-docs)?**
A: For AI Prompt pattern, ensure you're using latest version. Output should have EXECUTABLE PROMPT section first.

**Q: AI Review says "tree is empty"?**
A: Add at least one phase with one item before using AI Review.

### General Issues

**Q: Tree won't load?**
A: Check JSON validity. Use "Validate tree.json" to see parsing errors.

**Q: Dependencies broken after edit?**
A: Run "Fix dependencies in tree.json" to auto-repair invalid references.

**Q: Pattern fields not showing?**
A: Tree may be old format. Run "Upgrade tree.json to latest pattern" to add new fields.

**Q: Export not working?**
A: Ensure pattern is set correctly. Check `tree.pattern.key` matches one of 9 patterns.

**Q: Undo not working?**
A: Undo (Ctrl+Z) doesn't work when typing in text fields. It works everywhere else and keeps 50 states.

---

## When to Activate This Skill

Activate TreeListy skill when user:
- Mentions ".json" tree files or "TreeListy"
- Asks about projects, roadmaps, sales pipelines, films, theses, prompts, courses, philosophy
- Wants to analyze, transform, or generate from hierarchical data
- References phases, items, subtasks, dependencies
- **Asks for AI assistance** with: tree creation, document analysis, prompt improvement, quality review
- **Mentions AI features**: AI Wizard, Analyze Text, AI Review, Smart Suggest, Generate Prompt
- Wants to convert unstructured content (docs, specs, notes) into structured trees
- Needs pattern-specific AI intelligence (Philosophy prof, Sales strategist, Film director, etc.)
- References Sora/Veo video production workflows
- Wants to improve basic prompts into comprehensive prompts

## Key Skill Behaviors

### AI-First Approach
1. **Recommend AI features when appropriate**:
   - Greenfield projects → Suggest AI Wizard
   - Document conversion → Suggest Analyze Text (Quick or Deep mode)
   - Quality checks → Suggest AI Review
   - Field completion → Suggest Smart Suggest (AI mode)
   - Basic prompts → Suggest AI Prompt pattern + Analyze Text

2. **Choose the right AI mode**:
   - Quick Mode for straightforward tasks (faster, cheaper)
   - Deep Mode for complex analysis (Extended Thinking, Sonnet 4.5)
   - Smart Suggest AI for context-aware, pattern-specific intelligence
   - Smart Suggest Quick for instant static templates

3. **Explain Smart Merge protection**: Reassure users their data is safe during AI operations

4. **Validate AI outputs**: Always programmatically verify AI-generated trees for data integrity

### Traditional Skill Behaviors
5. **Always preserve IDs** when editing (critical for dependencies)
6. **Validate before and after** operations to prevent corruption
7. **Be pattern-aware**: Use correct field names and types for each pattern
8. **Show visual trees** with proper formatting (├─ └─)
9. **Provide actionable insights**: Don't just show data, analyze and recommend
10. **Generate ready-to-use outputs**: Make prompts, reports, exports copy-paste ready

### Pattern-Specific Intelligence
11. **Philosophy**: Think dialectically (thesis, antithesis, synthesis), suggest premises/objections
12. **Sales**: Think strategically (pipeline health, next steps, competitive positioning)
13. **Film**: Think cinematically (Sora/Veo production-ready prompts, camera angles, lighting)
14. **AI Prompt**: Think methodologically (system prompts, few-shot, CoT, executable output)
15. **Roadmap**: Think technically (story points, user impact, implementation tasks)
16. **Book**: Think narratively (plot arcs, character development, pacing)

---

**End of TreeListy Skill Documentation v2.17.0 (Build 322)**

You are now ready to work with TreeListy trees using both AI-powered features and traditional programmatic manipulation!

**Quick Decision Tree**:
- User wants to **create from scratch** → Recommend AI Wizard
- User has **existing document** → Recommend Analyze Text (Quick or Deep)
- User wants **quality check** → Recommend AI Review
- User needs **field suggestions** → Recommend Smart Suggest (AI mode)
- User wants **to share tree** → Share URL or Export Excel
- User wants **to export as AI prompt** → Generate Prompt
- User wants **basic → comprehensive prompt** → AI Prompt pattern + Analyze Text
- User needs **programmatic manipulation** → Use JSON/JavaScript workflows
- User wants **to collaborate** → Watch Mode + shared file or `?gdrive=` links
- User wants **async collaboration** → "Chess by Mail" workflow with contributor tags
- User wants **live sync** → Watch Mode with 5-second poll interval

**Remember**:
- AI features and programmatic manipulation work together beautifully
- Smart Merge protects user data - always safe to use AI features
- Pattern-specific intelligence makes AI suggestions domain-appropriate
- Extended Thinking (Sonnet Deep Mode) delivers highest quality for critical work
- Collaboration features enable async/sync teamwork without complex infrastructure
- Contributor badges (👤) and collab indicators (💬) show who did what

When the user references TreeListy or tree files, use these instructions to help them manage, analyze, transform, and generate from their hierarchical project data with the perfect blend of AI assistance and programmatic control.