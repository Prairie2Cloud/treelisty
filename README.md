# 🌳 TreeListy

**Universal Project Decomposition Tool**

*From Complexity to Clarity*

**Version**: 2.10.0 (Build 165) | [Web App](./treeplexity.html) | [Examples](./examples/)

---

## What is TreeListy?

TreeListy is a universal tool for breaking down any complex project, problem, or process into manageable parts. Structure your work into phases, track dependencies between components, and analyze your entire plan at a glance.

**Now with Canvas View**: Toggle between hierarchical tree view and infinite visual canvas with drag-drop, auto-layouts, and real-time collaboration.

**Use it for (15+ specialized patterns):**
- 📋 Generic projects (construction, infrastructure)
- 🤔 Philosophy (dialectics, arguments, treatises)
- 💼 Sales pipelines (deals, quarters, forecasting)
- 🎓 Academic writing (thesis, dissertations, research)
- 🚀 Product roadmaps (features, sprints, releases)
- 🧠 Prompt engineering (AI prompts, examples, testing)
- 📚 Book writing (chapters, scenes, plot arcs)
- 🎉 Event planning (stages, vendors, logistics)
- 💪 Fitness programs (workouts, exercises, progression)
- 📊 Strategic planning (pillars, initiatives, KPIs)
- 📖 Course design (units, lessons, assessments)
- 🎬 AI video production (Sora/Veo scenes, prompts)
- 👨‍👩‍👧‍👦 Family trees (genealogy, ancestry, DNA)
- 💬 Dialogue & rhetoric (debates, persuasion analysis)
- 📧 Gmail workflows (threads, emails, analysis) **NEW**
- 💾 File systems (Google Drive, local storage, organization)

---

## Key Features

### 🎨 Dual View System (NEW in v2.2)
**Canvas View** - Infinite visual canvas:
- Drag & drop nodes freely
- 5 auto-layout algorithms (Tree, Timeline, Hierarchical, Force-Directed, Radial)
- Multi-select and group drag
- Phase zones with color coding
- Visual dependency arrows
- Grid snapping, pan & zoom (10%-500%)

**Tree View** - Traditional hierarchical:
- Expandable/collapsible phases
- Form-based editing
- PM tracking (status, progress, assignments)
- Excel import/export

**Toggle instantly** with zero data loss between views.

### 🎯 Hierarchical Decomposition
Break complex projects into:
- **Root** → Overall project/product/document
- **Phases** → Major stages (Acts, Quarters, Chapters, Generations)
- **Items** → Components within each phase (Scenes, Deals, Sections, People)
- **Subtasks** → Detailed tasks and subtasks (Shots, Actions, Points, Events)

### 🔗 Dependency Management
- Visual dependency tracking
- Circular dependency detection
- Critical path calculation
- Topological sorting
- Cross-phase dependencies

### 📊 Analysis & Insights
- Cost aggregation and rollups
- Anomaly detection
- Phase breakdowns
- Pattern-specific sorting (14 options for filesystem)
- Export to Excel with professional 4-sheet workbooks

### 🤖 AI-Powered (3 Providers) + Semantic Chunking **NEW**
- **AI Wizard**: Conversational tree building with Smart Merge
- **Analyze Text**: Extract structure from documents (Quick/Deep modes)
  - **🧠 Semantic Chunking Engine** (Build 156): NLP-powered text segmentation for large documents
  - Prevents hallucinations on 5000+ word files by processing semantic chunks independently
  - OpenAI text-embedding-3-small & Gemini text-embedding-004 integration
  - Automatic structural fallback (Markdown headers → paragraphs → lines)
  - Visual chunk distribution showing detected sections
- **AI Review**: Comprehensive quality analysis
- **Smart Suggest**: Context-aware field suggestions
- **Generate Prompt**: Export as AI-ready prompts
- **Extended Thinking**: Sonnet 4.5 deep reasoning mode
- **Multi-Provider**: Claude (Haiku/Sonnet 4.5), Gemini (2.0 Flash), ChatGPT (GPT-4o)

### 💾 Data Portability
- JSON import/export (git-friendly)
- Excel export with 4 sheets (Overview, Tree, Dependencies, PM Tracking)
- Google Drive import (OAuth, full folder hierarchies)
- Shareable URLs (base64 compression)
- Pattern auto-detection

### 📱 Progressive Web App
- Installable on desktop & mobile
- Offline capable
- 4 visual themes (Default, Steampunk, Powerpuff, Tron)
- App-like experience

---

## Getting Started

### Quick Start

1. **Open the tool**
   ```
   Open treelisty-canvas.html in your browser (or treeplexity.html for tree-only)
   ```

2. **Choose a pattern**
   - Click the pattern dropdown in header
   - Select from 14 specialized patterns
   - Or use AI Wizard to build from scratch

3. **Create your structure**
   - **Tree View**: Right-click phases to add items, use forms to edit
   - **Canvas View**: Drag nodes, use auto-layout, organize visually
   - Toggle between views anytime

4. **Add AI intelligence**
   - Use AI Wizard for conversational building
   - Analyze Text to convert documents to trees
   - AI Review for quality checks
   - Smart Suggest for field completion

5. **Export & Share**
   - Excel (4 professional sheets)
   - JSON (git-friendly)
   - Share URL (base64 encoded)
   - Google Drive export

### Pattern-Specific Features

Each pattern includes:
- Custom terminology (levels, types)
- Specialized fields (prompts, DNA, deal value, word count)
- Pattern-aware AI (Philosophy prof, Sales strategist, Film director)
- Smart sorting options (Generic: 6, Sales: 7, Filesystem: **14**)
- Auto-generated visualizations

---

## File Structure

```
treeplexity/
├── treelisty-canvas.html          # Main app (dual view: Tree + Canvas)
├── treeplexity.html               # Tree-only version
├── treelisty-canvas-integrated.html  # Full integration (846KB)
├── examples/                      # Example projects
│   ├── Kafka.json                # Philosophy pattern example
│   ├── plato-allegory-of-cave.json
│   ├── hegel-becoming.json
│   ├── p2c-econ-analysis.json    # Generic project example
│   ├── google-drive-*.json       # Filesystem pattern examples
│   └── test_*.json               # Test files for various patterns
├── export_google_drive_to_treelisty.py  # Google Drive import script
├── apply_canvas_integration.py   # Canvas integration script
├── manifest.json                 # PWA configuration
├── .claude/
│   └── skills/
│       └── treeplexity.md        # Claude Code skill (v2.2.0)
└── docs/                         # Documentation (30+ markdown files)
```

---

## Core Concepts

### The Three-Phase Pattern

Most projects follow a **Beginning → Middle → End** pattern:

| Domain | Phase 0 | Phase 1 | Phase 2 |
|--------|---------|---------|---------|
| **Software** | Discovery | Development | Launch |
| **Events** | Planning | Execution | Follow-up |
| **Research** | Preparation | Experiments | Publication |
| **Personal** | Foundation | Achievement | Mastery |

You can customize phase names to match your domain.

### Flexible Metrics

The "Cost" field can represent any numeric value:
- 💰 Money (dollars, euros)
- ⏱️ Time (hours, days, weeks)
- 📊 Effort (story points, person-days)
- 🎯 Priority (1-10 scale)
- ⚠️ Risk (0-100%)
- 🔢 Difficulty (easy/medium/hard)

### Dependencies Create Structure

By defining what depends on what, Treeplexity can:
- Calculate the critical path (longest chain)
- Identify bottlenecks
- Detect circular dependencies
- Optimize parallel execution

---

## Evolution & Heritage

TreeListy (formerly Treeplexity) evolved from CAPEX Master - originally built for infrastructure capital expenditure planning at Prairie2Cloud.

**Major Evolutions:**
- ✅ **v1.0**: Rebranded from CAPEX Master to Treeplexity (universal branding)
- ✅ **v2.0**: Added 14 specialized patterns (Philosophy, Sales, Book Writing, etc.)
- ✅ **v2.1**: AI integration (3 providers, Extended Thinking, Smart Merge)
- ✅ **v2.2**: Canvas View (dual view system, drag-drop, 5 auto-layouts)

**From Infrastructure to Universal:**
- Started: Infrastructure project planning (costs, lead times, dependencies)
- Now: 14+ domains (philosophy, sales, video production, genealogy, file systems)
- Same core: Hierarchical decomposition, dependency tracking, visual analysis
- New capabilities: Pattern intelligence, AI assistance, dual view system, PWA

---

## Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Generic branding and rebranding
- [x] Universal terminology
- [x] Tree visualization with pan/zoom
- [x] Dependency management
- [x] Excel/JSON import/export

### ✅ Phase 2: Pattern System (COMPLETE)
- [x] 14 specialized patterns
- [x] Pattern-specific fields and types
- [x] Custom terminology per pattern
- [x] Pattern-specific sorting (up to 14 options)
- [x] Pattern auto-detection

### ✅ Phase 3: AI Integration (COMPLETE)
- [x] Multi-provider support (Claude, Gemini, ChatGPT)
- [x] AI Wizard (conversational building)
- [x] Analyze Text (document extraction)
- [x] **Semantic Chunking Engine** (Build 156) - Embedding-based text segmentation
- [x] AI Review (quality analysis)
- [x] Smart Suggest (field suggestions)
- [x] Extended Thinking (deep reasoning)
- [x] Smart Merge (data protection)
- [x] Pattern expert personas

### ✅ Phase 4: Canvas View (COMPLETE)
- [x] Dual view system (Tree ↔ Canvas)
- [x] Drag & drop nodes
- [x] 5 auto-layout algorithms
- [x] Multi-select and group drag
- [x] Phase zones, visual connections
- [x] Grid snapping, pan/zoom controls
- [x] Zero data loss between views

### ✅ Phase 5: PWA & Integrations (COMPLETE)
- [x] Progressive Web App (installable)
- [x] 4 visual themes
- [x] Google Drive import (OAuth)
- [x] Shareable URLs
- [x] 4-sheet Excel workbooks
- [x] Pattern-aware exports

### 🚧 Phase 6: Collaboration (IN PROGRESS)
- [ ] Real-time multi-user editing
- [ ] Comment threads on nodes
- [ ] Activity log and version history
- [ ] User accounts and teams
- [ ] Role-based permissions

### 📋 Phase 7: Mobile & UX (PLANNED)
- [ ] Mobile-optimized layouts
- [ ] Touch gestures (pinch-zoom, swipe)
- [ ] Voice input for quick add
- [ ] Interactive tutorial system
- [ ] Onboarding flow

### 📋 Phase 8: Ecosystem (PLANNED)
- [ ] Public API
- [ ] Webhooks for integrations
- [ ] Zapier/Make connectors
- [ ] Browser extension for capturing
- [ ] Plugin system for custom patterns

---

## Philosophy

### Structure is Universal

Every complex problem can be:
1. Broken into parts (hierarchy)
2. Related to other parts (dependencies)
3. Measured (metrics)
4. Analyzed (mathematics)
5. Shared (data)

Treeplexity provides these five capabilities for **any** domain.

### Templates Capture Expertise

Each template represents domain expertise:
- What phases make sense?
- What components are typical?
- What dependencies exist?
- What metrics matter?

Templates are **knowledge crystallized into data**.

### One Tool, Infinite Applications

Instead of learning 10 different tools for 10 different domains, learn Treeplexity once and apply it everywhere.

**Same structure. Different data. Universal power.**

---

## Technical Details

### Technologies
- Pure HTML/CSS/JavaScript (no build step required)
- Single-file applications (highly portable)
- JSON data format (git-friendly, diffable)
- AI integration via 3 providers (Claude, Gemini, ChatGPT)
- Canvas rendering with SVG/HTML hybrid
- LocalStorage for offline persistence
- Service Worker for PWA capabilities

### File Sizes
- `treelisty-canvas.html`: ~400KB (dual view)
- `treeplexity.html`: ~350KB (tree-only)
- `treelisty-canvas-integrated.html`: 846KB (full integration)

### Browser Support
- ✅ Chrome/Edge (recommended, best performance)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Mobile browsers (PWA installable)
- ⚠️ Mobile UX optimization in progress

### Performance
- Handles 200+ nodes smoothly in Tree View
- Canvas View optimized for 100+ nodes
- Virtual rendering planned for 500+ nodes
- Zoom/pan with hardware acceleration

### Data Format
Projects are stored as JSON with this structure:
```json
{
  "id": "root",
  "name": "Project Name",
  "type": "root",
  "phases": [
    {
      "id": "p0",
      "name": "Phase Name",
      "phaseNumber": 0,
      "items": [...]
    }
  ]
}
```

---

## Contributing

Want to contribute a pattern for your domain?

### Creating a New Pattern
1. Define pattern structure (Root/Phase/Item/Subtask terminology)
2. Specify custom fields relevant to your domain
3. Create example JSON files
4. Submit as pull request or issue

### Ideas for New Patterns
- Legal (cases, motions, discovery, arguments)
- Music Production (albums, tracks, stems, takes)
- Scientific Research (hypotheses, experiments, analyses)
- Game Design (mechanics, levels, quests, items)
- Cooking/Recipes (menus, courses, recipes, steps)
- Architecture (buildings, systems, components, details)

### Documentation Contributions
- Examples and use cases
- Video tutorials
- Pattern best practices
- Integration guides

---

## Documentation

Documentation is organized in the `docs/` folder:

```
docs/
├── AI-CONTEXT.md           # Quick AI onboarding (start here!)
├── guides/                 # Active documentation
│   ├── TREELISTY_FEATURES_2025.md  # Complete feature matrix
│   ├── PATTERN_SORTING_ANALYSIS.md # Sort options per pattern
│   ├── GOOGLE_DRIVE_EXPORT_INSTRUCTIONS.md
│   ├── NETLIFY_DEPLOYMENT.md
│   └── PWA-ONBOARDING-README.md
├── builds/                 # Build-specific notes
│   └── BUILD_156_SEMANTIC_CHUNKING.md
└── archive/                # Historical docs (40+ files)
```

### Quick Links
- **[AI Context](docs/AI-CONTEXT.md)** - Quick onboarding for AI assistants
- **[Features 2025](docs/guides/TREELISTY_FEATURES_2025.md)** - Complete feature matrix
- **[Skill File](.claude/skills/treeplexity.md)** - Claude Code skill definition
- **[Philosophy Example](examples/PLATO-CAVE-INSTRUCTIONS.md)** - Plato's Cave
- **[Hegel Example](examples/HEGEL-BECOMING-INSTRUCTIONS.md)** - Dialectics

---

## License

Forked from CAPEX Master by Prairie2Cloud.

Treeplexity maintains the same license and acknowledgments.

---

## Questions?

- 📖 Read the [documentation](../capex/mcp-server/)
- 💡 See [examples](./examples/) (coming soon)
- 🎨 Browse [templates](./templates/) (coming soon)

---

**TreeListy: Universal decomposition for everything** 🌳✨

*Structure your thinking. Master complexity. Achieve clarity.*

**Version 2.10.0 (Build 165)** | 17 Patterns | Dual View System | AI-Powered | Semantic Chunking | PWA-Ready

---

**Key Stats**:
- 17+ specialized patterns
- 3 AI providers (Claude, Gemini, ChatGPT)
- 🧠 Semantic chunking engine with embedding-based text segmentation
- 5 auto-layout algorithms
- 4 visual themes
- 14 sort options (filesystem pattern)
- 50-state undo system
- Hyperedge support (N-ary relationships)
- Zero dependencies
