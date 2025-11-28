# TreeListy Features Matrix 2025

**Version**: 2.2.0
**Last Updated**: 2025-11-18
**Status**: Production Ready

---

## Overview

TreeListy is a universal hierarchical project management and decomposition tool with dual view system (Tree + Canvas), AI integration (3 providers), and 14+ specialized patterns for different domains.

---

## Core Statistics

| Metric | Value | Notes |
|--------|-------|-------|
| **Patterns** | 14 | Specialized domain templates |
| **AI Providers** | 3 | Claude, Gemini, ChatGPT |
| **AI Models** | 6+ | Haiku, Sonnet 4.5, Flash, 4o, etc. |
| **Auto-Layouts** | 5 | Canvas view algorithms |
| **Visual Themes** | 4 | Default, Steampunk, Powerpuff, Tron |
| **Sort Options (Max)** | 14 | Filesystem pattern |
| **Undo States** | 50 | Full undo/redo support |
| **File Size** | 846KB | Full-featured single file |
| **Dependencies** | 0 | Pure HTML/CSS/JS |
| **Export Formats** | 4 | JSON, Excel, URL, Prompt |

---

## Pattern Matrix

Complete list of all 14 patterns with their specialized features:

| # | Pattern | Icon | Levels | Sort Options | Special Fields | AI Persona |
|---|---------|------|--------|--------------|----------------|------------|
| 1 | **Generic Project** | 📋 | Project → Phase → Item → Task | 6 | Cost, leadTime, alternateSource, dependencies | Project Manager |
| 2 | **Philosophy** | 🤔 | Dialogue → Movement → Claim → Support | 0 | speaker, argumentType, premise1/2, conclusion, objection, response, textualReference | Philosophy Professor |
| 3 | **Sales Pipeline** | 💼 | Pipeline → Quarter → Deal → Action | 7 | dealValue, expectedCloseDate, stageProbability, leadSource, contactPerson, competitorInfo | Sales Strategist |
| 4 | **Academic Thesis** | 🎓 | Thesis → Chapter → Section → Point | 0 | wordCount, targetWordCount, citations, keyArgument, evidenceType, draftStatus | Academic Advisor |
| 5 | **Product Roadmap** | 🚀 | Product → Quarter → Feature → Story | 0 | storyPoints, userImpact, technicalRisk, engineeringEstimate, featureFlag | Product Manager |
| 6 | **Prompt Engineering** | 🧠 | Library → Category → Prompt → Test | 0 | systemPrompt, userPromptTemplate, fewShotExamples, chainOfThought, outputFormat, modelTarget, temperature, maxTokens, toolDefinitions | Prompt Engineer |
| 7 | **Book Writing** | 📚 | Book → Part → Chapter → Scene | 0 | wordCount, targetWordCount, plotPoints, characterArcs, pacing, povCharacter, sceneSetting | Author/Editor |
| 8 | **Event Planning** | 🎉 | Event → Stage → Activity → Task | 0 | budget, vendor, bookingDeadline, guestCount, location, responsiblePerson | Event Coordinator |
| 9 | **Fitness Program** | 💪 | Program → Phase → Workout → Exercise | 0 | sets, reps, duration, intensity, equipment, formCues, restPeriod | Personal Trainer |
| 10 | **Strategic Plan** | 📊 | Strategy → Pillar → Initiative → Action | 0 | investment, keyMetric, targetValue, responsibleExecutive, strategicTheme, riskLevel | Strategy Consultant |
| 11 | **Course Design** | 📖 | Course → Unit → Lesson → Exercise | 0 | learningObjectives, duration, difficultyLevel, prerequisites, assessmentType, resourcesNeeded, homework | Instructional Designer |
| 12 | **AI Video Production** | 🎬 | Film → Act → Scene → Shot | 0 | aiPlatform, videoPrompt, visualStyle, duration, aspectRatio, cameraMovement, motionIntensity, lightingMood, iterationNotes | Film Director/Cinematographer |
| 13 | **Family Tree** | 👨‍👩‍👧‍👦 | Family → Generation → Person → Event | 0 | fullName, maidenName, gender, birthDate, birthPlace, livingStatus, deathDate, marriageDate, spouseName, occupation, dnaInfo, sources | Genealogist |
| 14 | **Dialogue & Rhetoric** | 💬 | Conversation → Speaker → Statement → Point | 0 | speaker, verbatimQuote, rhetoricalDevice, logicalStructure, fallaciesPresent, hiddenMotivation, emotionalTone, counterargument, evidenceQuality, effectivenessRating | Rhetoric Analyst |
| 15 | **File System** | 💾 | Drive → Folder → File/Folder → File | **14** | fileSize, fileExtension, filePath, dateModified, dateCreated, fileOwner, isFolder, fileUrl, sharedWith | Systems Administrator |

---

## Pattern Sort Options Breakdown

### Generic Project (6 options)
1. Cost (Highest First)
2. Cost (Lowest First)
3. Lead Time (Soonest First)
4. Lead Time (Latest First)
5. Name (A-Z)
6. Name (Z-A)

### Sales Pipeline (7 options)
1. Deal Value (Largest First)
2. Deal Value (Smallest First)
3. Close Date (Soonest First)
4. Close Date (Latest First)
5. Probability (Highest First)
6. Probability (Lowest First)
7. Deal Name (A-Z)

### File System (14 options) 🏆 MOST COMPREHENSIVE
1. Name (A-Z)
2. Name (Z-A)
3. Size (Largest First)
4. Size (Smallest First)
5. Modified (Newest First)
6. Modified (Oldest First)
7. Created (Newest First)
8. Created (Oldest First)
9. Type (Folders First)
10. Type (Files First)
11. Extension (A-Z)
12. Extension (Z-A)
13. Owner (A-Z)
14. Owner (Z-A)

### Other Patterns
- **Philosophy, Thesis, Book, Event, Fitness, Strategy, Course, AI Video, Family Tree, Dialogue**: No sort options (conceptual/narrative structures)
- **Roadmap, Prompt Engineering**: No sort options (sequential/categorical organization)

---

## Canvas View Features

### 5 Auto-Layout Algorithms

| Algorithm | Description | Best For | Layout Direction |
|-----------|-------------|----------|------------------|
| **Classic Tree** | Traditional hierarchical tree | Dependency visualization, org charts | Left → Right |
| **Timeline** | Horizontal sequential layout | Chronological projects, roadmaps | Top → Bottom (horizontal phases) |
| **Hierarchical** | Top-down organization chart | Corporate structures, taxonomies | Top → Bottom |
| **Force-Directed** | Physics-based automatic spacing | Complex dependencies, network analysis | Radial from center |
| **Radial** | Circular layout with root in center | Exploring relationships, presentations | Circular from center |

### Canvas Interactions

| Feature | Shortcut/Action | Description |
|---------|----------------|-------------|
| **Drag Node** | Click + Drag | Move any node freely on canvas |
| **Multi-Select** | Ctrl + Click | Select multiple nodes |
| **Group Drag** | Drag selected | Move all selected nodes together |
| **Pan Canvas** | Click + Drag (background) | Move entire canvas view |
| **Zoom In** | Mouse wheel up / + button | Zoom in (up to 500%) |
| **Zoom Out** | Mouse wheel down / - button | Zoom out (down to 10%) |
| **Fit to View** | Fit button | Auto-zoom to see entire tree |
| **Reset View** | Reset button | Return to default zoom/position |
| **Grid Snap** | Grid toggle | Align nodes to grid |
| **Edit Node** | Double-click | Open edit modal |
| **Context Menu** | Right-click | Access AI features, edit, delete |

---

## AI Features Matrix

### 5 Core AI Features

| Feature | Description | Modes | Providers | Key Use Cases |
|---------|-------------|-------|-----------|---------------|
| **🧙 AI Wizard** | Conversational tree building | Build, Enhance | All 3 | Create trees from scratch, expand existing |
| **📄 Analyze Text** | Extract structure from documents | Quick, Deep | All 3 | Convert docs/specs/notes to trees |
| **🔬 AI Review** | Comprehensive quality analysis | Standard | All 3 | Check completeness, logic, quality |
| **💡 Smart Suggest** | Field value suggestions | AI, Quick | All 3 | Fill fields with context-aware data |
| **📝 Generate Prompt** | Export as AI-ready prompt | Pattern-aware | N/A | Share trees with AI assistants |

### AI Provider Comparison

| Provider | Models | Extended Thinking | Cost (per 1M tokens) | Best For |
|----------|--------|-------------------|---------------------|----------|
| **Anthropic Claude** | Haiku 4.0, Sonnet 4.5 | ✅ Yes (Sonnet) | ~$3 input, $15 output | Complex analysis, deep reasoning |
| **Google Gemini** | 2.0 Flash | ❌ No | Free tier, then ~$0.075 | Fast, cost-effective, quick tasks |
| **OpenAI ChatGPT** | GPT-4o | ❌ No | ~$2.50 input, $10 output | Versatile, general-purpose |

### AI Mode Comparison

| Mode | Speed | Quality | Thinking Budget | Cost | When to Use |
|------|-------|---------|----------------|------|-------------|
| **Quick Mode** | Fast (2-4s) | Good | 0 tokens | Low | Straightforward tasks, simple structures |
| **Deep Mode (Extended Thinking)** | Slower (10-15s) | Excellent | 5000 tokens | High | Complex analysis, critical work, quality-first |
| **Quick Suggest** | Instant (0s) | Static | 0 tokens | Free | Instant templates, no API call |
| **AI Suggest** | Fast (2-3s) | Context-aware | 0-500 tokens | Low | Pattern-specific, context-aware suggestions |

### Smart Merge Protection

| Scenario | Behavior | Data Loss Risk |
|----------|----------|----------------|
| AI adds new item | Item added to tree | ✅ None |
| AI updates existing item | Description/fields updated | ✅ None (fuzzy matching) |
| AI renames item | Name updated, content preserved | ✅ None |
| User item not in AI update | Preserved unchanged | ✅ None (additive only) |
| Fuzzy name match | Matched and updated | ✅ None |
| No match found | Both items kept | ✅ None |

**Guarantee**: Smart Merge NEVER deletes user data. Always additive.

---

## Dual View System

### Tree View vs Canvas View

| Feature | Tree View | Canvas View |
|---------|-----------|-------------|
| **Best for** | Data entry, editing, PM tracking | Visual planning, presentations, spatial organization |
| **Interaction** | Click to expand/collapse, forms to edit | Drag & drop, multi-select, visual arrangement |
| **Dependencies** | Text-based list | Visual arrows with Bezier curves |
| **Phases** | Collapsible sections | Color-coded zones (dashed regions) |
| **Layout** | Fixed hierarchical list | 5 auto-layout algorithms + manual |
| **Editing** | Forms with all fields | Double-click for modal |
| **PM Tracking** | Full status, progress, RAG indicators | Visual status badges |
| **AI Features** | ✅ All features | ✅ All features (via right-click) |
| **Export** | ✅ Excel, JSON, URL | ✅ Excel, JSON, URL |
| **Navigation** | Scroll, expand/collapse | Pan, zoom (10%-500%), fit to view |
| **Performance** | 200+ nodes smoothly | 100+ nodes smoothly |

### Toggling Between Views

| Action | Result | Data Loss |
|--------|--------|-----------|
| Tree → Canvas | Tree converted to canvas coordinates | ✅ None |
| Canvas → Tree | Canvas positions stored, tree rendered | ✅ None |
| Edit in Tree, switch to Canvas | Changes reflected instantly | ✅ None |
| Edit in Canvas, switch to Tree | Changes reflected instantly | ✅ None |
| Apply auto-layout in Canvas | Nodes repositioned, data preserved | ✅ None |

---

## PWA (Progressive Web App) Features

### Installation

| Platform | Method | Icon | Offline |
|----------|--------|------|---------|
| **Desktop (Chrome/Edge)** | Install button in address bar | Yes | Yes |
| **Desktop (Firefox)** | Add to home screen | Yes | Yes |
| **iOS Safari** | Share → Add to Home Screen | Yes | Yes |
| **Android Chrome** | Install prompt / Add to Home Screen | Yes | Yes |

### Capabilities

| Feature | Status | Notes |
|---------|--------|-------|
| **Offline Mode** | ✅ Enabled | Works after first load |
| **LocalStorage** | ✅ Enabled | Persists trees across sessions |
| **Service Worker** | ✅ Ready | Caches assets for offline use |
| **Manifest** | ✅ Configured | PWA metadata defined |
| **App Icons** | ✅ SVG-based | Tree emoji on primary color |
| **Full Screen** | ✅ Supported | Standalone app mode |
| **Auto-Update** | ⚠️ Manual | Refresh to get updates |

---

## Visual Themes

### 4 Available Themes

| Theme | Primary Color | Use Case | Aesthetic |
|-------|--------------|----------|-----------|
| **Default** | Indigo (#6366f1) | Professional, modern | Clean, tech-forward |
| **Steampunk** | Bronze/Gold (#b8860b) | Creative, vintage | Victorian, industrial |
| **Powerpuff** | Pink (#ff6eb4) | Fun, energetic | Bright, bubbly, playful |
| **Tron** | Cyan (#00ffff) | Futuristic, high-tech | Neon, sci-fi, dark mode |

### Theme Customization

- Phase colors: Auto-generated based on primary
- Background patterns: Subtle gradients
- Border styles: Consistent across theme
- Shadow depths: 4 levels (sm, md, lg, xl)

---

## Export & Import Capabilities

### Export Formats

| Format | Sheets/Sections | Use Case | Compatibility |
|--------|----------------|----------|---------------|
| **JSON** | Single file | Git-friendly, programmatic use | TreeListy only |
| **Excel** | 4 sheets (Overview, Tree, Dependencies, PM Tracking) | Stakeholder sharing, data analysis | Excel, Google Sheets, Numbers |
| **Share URL** | Base64 encoded in URL | Quick sharing, no file transfer | Any browser with TreeListy |
| **AI Prompt** | Pattern-aware text | Use with Claude, ChatGPT, etc. | Any LLM |

### Import Formats

| Format | Auto-Detection | Append Mode | Pattern Mapping |
|--------|---------------|-------------|-----------------|
| **JSON** | ✅ Yes | ✅ Yes | Pattern preserved |
| **Excel** | ✅ Yes | ✅ Yes | Pattern auto-detected from fields |
| **Google Drive** | N/A | ❌ No | Creates Filesystem pattern |
| **Share URL** | ✅ Yes | ❌ No | Pattern embedded in URL |

### Excel Export Structure

| Sheet | Contents | Purpose |
|-------|----------|---------|
| **Overview** | Summary stats, phase breakdown, totals | Executive summary |
| **Tree** | Full hierarchical data with all fields | Detailed analysis |
| **Dependencies** | Dependency graph, item relationships | Dependency tracking |
| **PM Tracking** | Status, progress, assignments, dates | Project management |

---

## PM Tracking Features

### Status & Progress

| Field | Type | Values | Use Case |
|-------|------|--------|----------|
| **PM Status** | Select | To Do, In Progress, Blocked, Done | Task status |
| **PM Progress** | Number | 0-100% | Completion percentage |
| **PM Priority** | Select | Low, Medium, High, Critical | Prioritization |
| **PM Assignee** | Text | Name or email | Ownership |
| **PM Due Date** | Date | YYYY-MM-DD | Deadline tracking |
| **PM Start Date** | Date | YYYY-MM-DD | Timeline planning |
| **Blocking Issues** | Textarea | Description of blockers | Issue tracking |

### RAG Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| **Red** | 🔴 | Blocked, critical issues, overdue |
| **Amber** | 🟡 | At risk, needs attention, warning |
| **Green** | 🟢 | On track, healthy, progressing well |

### PM Infographic Dashboard

- Circular progress charts per phase
- Cost rollups and aggregations
- Completion percentage across tree
- Status distribution (To Do, In Progress, Blocked, Done)
- Timeline visualization

---

## Performance Benchmarks

| Metric | Tree View | Canvas View | Notes |
|--------|-----------|-------------|-------|
| **Optimal Node Count** | 200 nodes | 100 nodes | Smooth performance |
| **Maximum Tested** | 500 nodes | 200 nodes | Still functional |
| **Render Time (100 nodes)** | <100ms | <500ms | Initial load |
| **Zoom/Pan FPS** | 60 FPS | 45-60 FPS | Hardware accelerated |
| **Undo Operation** | <50ms | <100ms | 50-state stack |
| **File Load (JSON)** | <200ms | <500ms | 100KB file |
| **AI Request (Quick)** | 2-4s | 2-4s | Network dependent |
| **AI Request (Deep)** | 10-15s | 10-15s | Extended Thinking |

---

## Browser Compatibility

| Browser | Version | Tree View | Canvas View | PWA Install | Offline |
|---------|---------|-----------|-------------|-------------|---------|
| **Chrome** | 90+ | ✅ Full | ✅ Full | ✅ Yes | ✅ Yes |
| **Edge** | 90+ | ✅ Full | ✅ Full | ✅ Yes | ✅ Yes |
| **Firefox** | 88+ | ✅ Full | ✅ Full | ✅ Yes | ✅ Yes |
| **Safari** | 14+ | ✅ Full | ✅ Full | ✅ iOS only | ✅ Yes |
| **Mobile Chrome** | Latest | ✅ Full | ⚠️ Limited touch | ✅ Yes | ✅ Yes |
| **Mobile Safari** | iOS 14+ | ✅ Full | ⚠️ Limited touch | ✅ Yes | ✅ Yes |

**Note**: Mobile UX optimization for Canvas View is in progress (touch gestures, pinch-zoom).

---

## Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| **Ctrl+Z / Cmd+Z** | Undo | Tree View (not in text fields) |
| **Ctrl+Y / Cmd+Shift+Z** | Redo | Tree View |
| **Ctrl+Click** | Multi-select | Canvas View |
| **Ctrl+S / Cmd+S** | Save to LocalStorage | Both views |
| **Escape** | Close modal | Both views |
| **Delete** | Delete selected | Canvas View (when node selected) |
| **Arrow Keys** | Navigate tree | Tree View |
| **Mouse Wheel** | Zoom in/out | Canvas View |

---

## API Keys & Rate Limits

### Server API Keys (Default)

| Provider | Rate Limit | Max Tokens | Cost |
|----------|-----------|------------|------|
| **Claude** | 200 req/hr | 8192 | Free (TreeListy absorbs) |
| **Gemini** | 200 req/hr | 8192 | Free (TreeListy absorbs) |
| **ChatGPT** | 200 req/hr | 8192 | Free (TreeListy absorbs) |

### User API Keys (Optional)

| Provider | Rate Limit | Max Tokens | Cost |
|----------|-----------|------------|------|
| **Claude** | Unlimited | 200,000 | User pays (~$3/1M in, $15/1M out) |
| **Gemini** | Unlimited | 1,048,576 | User pays (free tier, then ~$0.075/1M) |
| **ChatGPT** | Unlimited | 128,000 | User pays (~$2.50/1M in, $10/1M out) |

### Where to Get API Keys

- **Claude**: [console.anthropic.com](https://console.anthropic.com/)
- **Gemini**: [aistudio.google.com](https://aistudio.google.com/)
- **ChatGPT**: [platform.openai.com](https://platform.openai.com/)

---

## File Sizes & Bundle Analysis

| File | Size | Contents | Purpose |
|------|------|----------|---------|
| **treelisty-canvas.html** | ~400KB | Tree + Canvas dual view | Main recommended file |
| **treeplexity.html** | ~350KB | Tree view only | Lightweight, no canvas |
| **treelisty-canvas-integrated.html** | 846KB | Full integration + all features | Maximum features |
| **manifest.json** | 1KB | PWA configuration | App metadata |
| **Example JSONs** | 5-50KB | Sample trees | Testing, templates |

**Total Bundle**: Single HTML file (zero dependencies, no build step)

---

## Security & Privacy

| Feature | Status | Notes |
|---------|--------|-------|
| **Data Storage** | LocalStorage only | No server upload (except AI requests) |
| **API Keys** | LocalStorage | Encrypted in transit, stored locally |
| **AI Requests** | HTTPS only | Sent to provider APIs only |
| **Share URLs** | Base64 encoded | Data embedded in URL (not stored server-side) |
| **CORS** | Enabled | Allows embedding in iframes |
| **CSP** | None | Single-file HTML, no external scripts |
| **Authentication** | None | Fully client-side, no accounts |

**Privacy**: TreeListy is fully client-side. No data leaves your browser except AI API calls (when you use AI features).

---

## Version History

| Version | Date | Major Features |
|---------|------|----------------|
| **2.2.0** | 2025-11-18 | Canvas View (dual view system, 5 auto-layouts), PWA features, 4 themes, Google Drive import |
| **2.1.0** | 2025-11-15 | Canvas integration, drag & drop, visual dependencies |
| **2.0.0** | 2025-11 | AI integration (3 providers), Extended Thinking, Smart Merge, 14 patterns |
| **1.0.0** | 2025-10 | Rebranded from CAPEX Master to Treeplexity, universal patterns |
| **0.9.0** | 2025-09 | CAPEX Master (infrastructure-focused) |

---

## Upcoming Features (Roadmap)

### Phase 6: Collaboration (In Progress)
- [ ] Real-time multi-user editing
- [ ] Comment threads on nodes
- [ ] Activity log and version history
- [ ] User accounts and teams
- [ ] Role-based permissions

### Phase 7: Mobile & UX (Planned)
- [ ] Mobile-optimized layouts
- [ ] Touch gestures (pinch-zoom, swipe)
- [ ] Voice input for quick add
- [ ] Interactive tutorial system
- [ ] Onboarding flow

### Phase 8: Ecosystem (Planned)
- [ ] Public API
- [ ] Webhooks for integrations
- [ ] Zapier/Make connectors
- [ ] Browser extension for capturing
- [ ] Plugin system for custom patterns

---

## Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **No real-time collaboration** | Single-user only | Share JSON/Excel, merge manually |
| **Mobile Canvas UX** | Limited touch support | Use Tree View on mobile |
| **Canvas performance >200 nodes** | Slower rendering | Use Tree View for large trees |
| **No cloud sync** | Data only in browser | Export JSON regularly, use Share URLs |
| **Undo in text fields** | Ctrl+Z doesn't work while typing | Use browser's undo in text inputs |
| **Share URL size limit** | Large trees = long URLs | Use JSON export for large projects |
| **Extended Thinking cost** | Higher API costs | Use Quick Mode for routine tasks |

---

## Support & Resources

### Documentation
- **This File**: Complete feature matrix
- **[Skill File](.claude/skills/treeplexity.md)**: Claude Code integration
- **[Canvas Guide](TREELISTY_CANVAS_INTEGRATED_README.md)**: Dual view system
- **[Quick Start](QUICK_START_VERIFICATION.md)**: 5-minute guide

### Community
- **GitHub Issues**: Bug reports and feature requests
- **Examples Folder**: Sample trees for all patterns
- **Pattern Guides**: Domain-specific documentation

### Contact
- **Author**: TreeListy Team
- **Fork Heritage**: CAPEX Master by Prairie2Cloud
- **License**: Same as CAPEX Master

---

**TreeListy v2.2.0** - Universal decomposition for everything 🌳

*14 patterns | Dual view system | AI-powered | PWA-ready*
