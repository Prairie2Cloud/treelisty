# TreeListy AI Context Document

**Current Version**: v2.17.0 (Build 408)
**Last Updated**: 2025-12-13
**Repository**: https://github.com/Prairie2Cloud/treelisty
**Live Site**: https://treelisty.netlify.app

---

## ⚠️ IMPORTANT: Deployment Procedure

**TreeListy deploys via GitHub → Netlify (auto-deploy on push)**

When you make changes to `treeplexity.html`, you MUST commit and push to deploy:

```bash
# 1. Stage the main file
git add treeplexity.html

# 2. Commit with build number in message
git commit -m "Build XXX: Short description of changes"

# 3. Push to GitHub (triggers automatic Netlify deploy)
git push
```

**Netlify auto-deploys** within 1-2 minutes of push to `main` branch.

**DO NOT** just edit the file - changes won't be live until pushed to GitHub!

---

## Quick Overview

TreeListy is a **single-file HTML application** (~1.3MB) for hierarchical project decomposition with AI integration. Zero dependencies - just open the HTML file or visit the Netlify site.

**Key Characteristics**:
- Pure HTML/CSS/JavaScript (no build step, no frameworks)
- Works from `file://` protocol (double-click to open)
- Triple view system: Tree View + Canvas View + 3D View
- 19 specialized patterns for different domains
- 3 AI providers: Claude, Gemini, ChatGPT
- PWA-ready (installable, offline capable)
- Real-time collaboration with Firebase + Voice Chat

---

## Architecture at a Glance

```
treeplexity.html (single file ~1.3MB)
├── HTML structure (~2000 lines)
├── CSS styles (~3000 lines)
├── JavaScript (~21000+ lines)
│   ├── Data model (capexTree object)
│   ├── Rendering (Tree + Canvas + 3D views)
│   ├── AI integration (3 providers + pattern-aware routing)
│   ├── Pattern system (19 patterns)
│   ├── Import/Export (JSON, Excel, URL)
│   ├── Collaboration (Firebase Live Sync + Voice Chat)
│   └── PM tracking (status, progress, RAG)
└── Netlify function (claude-proxy.js for CORS)
```

---

## Current Version Highlights (Builds 263-408)

### Live Tree Agent (Builds 405-408)
1. **🤖 Live Tree Agent Frame** (Build 405): Floating chat builder frame
   - Replaces cramped wizard modal with draggable floating frame
   - Full chat history with scrollable messages
   - Progress bar synced with tree building
   - Voice input and choice buttons
2. **✨ Visual Node Highlighting** (Build 406): Real-time change indicators
   - Green pulse animation for new nodes
   - Yellow pulse animation for modified nodes
   - 5-second highlight duration with fade
   - Integrated with both Tree View and Filesystem pattern
3. **📍 Draggable + Position Persistence** (Build 407): Frame positioning
   - Drag header to move frame anywhere
   - Position saved to localStorage
   - Double-click header to reset to default
   - Touch support for mobile devices
4. **🔗 Wizard Integration** (Build 408): Full wizard system integration
   - Tree Agent as primary UI (old wizard as fallback)
   - Messages routed through Tree Agent first
   - Cancel/Finish handlers close Tree Agent

### LifeTree Health Check (Build 392)
5. **🩺 LifeTree Health Diagnostics**: Proactive health checks
   - Detects empty phases, redundant periods, chronology gaps
   - Sparse event detection for incomplete records
   - Fix commands: consolidate_legacy, fix_chronology, fill_empty
   - TreeBeard integration: "check my life tree health"
6. **🎯 GPT-5.2 Models**: New OpenAI model support
   - GPT-5.2 Pro, GPT-5.2 base, GPT-5.2 Chat
   - Added to model provider dropdown

### Recent Features (Builds 318-361)
7. **🔗 Pivot-Style Smart Hyperedges** (Build 361): Intelligent hyperedge system
   - Smart auto-grouping: Suggests hyperedges based on status, assignee, cost patterns
   - Query builder: Create hyperedges with filter conditions (status=X, cost>$500K)
   - Live aggregates: Shows totals ($2.3M • 67% • 4 nodes) on each hyperedge
   - TreeBeard integration: Natural language queries ("show items over $500K")
   - Pattern-aware detection: CAPEX (cost tiers), Philosophy (philosophers), Sales (deal stages)
2. **🎙️ Voice Chat** (Build 322): Jitsi Meet integration for live collaboration
3. **📋 Meeting Transcript Analysis** (Build 321): Extract contacts, research requests from transcripts
4. **🎯 Optimized Import Prompts** (Build 320): Pattern-specific prompts for CAPEX/Philosophy
5. **🔀 Smart Append + Deduplication** (Build 319): Semantic duplicate detection (60% Jaccard)
6. **⏱️ Edge Function Streaming** (Build 318): Fixed timeouts with streaming responses

### 3D View & Visualization (Builds 296-317)
7. **🌐 3D Knowledge Navigator** (Builds 296-303): Three.js-powered 3D visualization
8. **Interactive 3D Nodes**: Hover, click, orbit in 3D space
9. **Sort-Aware 3D Layouts**: 3D respects current sort order
10. **Nano Banana Pro** (Build 317): Enhanced Imagen 4 image generation

### Collaboration Overhaul (Builds 263-295)
11. **Firebase Live Sync**: Real-time multi-user editing
12. **Floating Chat Box**: Draggable team chat during sessions
13. **Presence Badges**: See who's online in real-time
14. **Auto-Update Notifications** (Build 280): Detect new versions
15. **Editable Hyperedges** (Build 282): Modify cross-phase connections

---

## 19 Specialized Patterns

| Pattern | Key Fields | AI Persona |
|---------|------------|------------|
| Generic Project | cost, leadTime, dependencies | Project Manager |
| CAPEX | cost, vendor, leadTime, contingency | Financial Analyst |
| Philosophy | speaker, argumentType, premise1/2, conclusion | Philosophy Professor |
| Sales Pipeline | dealValue, expectedCloseDate, stageProbability | Sales Strategist |
| Academic Thesis | wordCount, citations, keyArgument | Academic Advisor |
| Product Roadmap | storyPoints, userImpact, technicalRisk | Product Manager |
| Prompt Engineering | systemPrompt, userPromptTemplate, fewShotExamples | Prompt Engineer |
| Book Writing | wordCount, plotPoints, characterArcs | Author/Editor |
| Event Planning | budget, vendor, bookingDeadline | Event Coordinator |
| Fitness Program | sets, reps, intensity, formCues | Personal Trainer |
| Strategic Plan | investment, keyMetric, riskLevel | Strategy Consultant |
| Course Design | learningObjectives, difficultyLevel, prerequisites | Instructional Designer |
| AI Video (Veo3) | aiPlatform, videoPrompt, cameraMovement | Film Director |
| AI Video (Sora2) | aiPlatform, videoPrompt, visualStyle | Film Director |
| Family Tree | birthDate, livingStatus, dnaInfo | Genealogist |
| Dialogue & Rhetoric | rhetoricalDevice, fallaciesPresent, counterargument | Rhetoric Analyst |
| File System | fileSize, fileExtension, dateModified | Systems Administrator |
| Gmail Workflow | recipientEmail, subjectLine, threadId | Email Analyst |
| Free Speech | constitutional, legal precedent, public interest | Legal Analyst |

---

## Core AI Features

| Feature | Purpose | Modes |
|---------|---------|-------|
| AI Wizard | Conversational tree building | Build, Enhance |
| Analyze Text | Extract structure from documents | Quick (1500 tokens), Deep (8192 tokens) |
| AI Review | Comprehensive quality analysis | Standard |
| Smart Suggest | Context-aware field suggestions | AI, Quick |
| Generate Prompt | Export as AI-ready prompt | Pattern-aware |
| TreeBeard Chat | Contextual AI assistant | Wiser mode (full context) |

**Key Algorithms**:
- **Smart Merge**: Additive updates only - never deletes user data
- **Semantic Chunking**: Embedding-based text segmentation (Build 156+)
- **Semantic Deduplication**: 60% Jaccard similarity threshold (Build 319+)
- **Pattern-Aware Model Selection**: Claude Sonnet for CAPEX, Opus for Philosophy (Build 320+)
- **Transcript Analysis**: Auto-detect meetings, extract contacts/research (Build 321+)
- **Barnes-Hut Quadtree**: O(n log n) force-directed layout

---

## Collaboration System

### Firebase Live Sync
- Real-time multi-user editing
- Presence badges showing online users
- Floating draggable chat box
- One-click session creation

### Voice Chat (Build 322)
- Jitsi Meet integration
- 🎙️ Voice button in chat panel
- Shared room via session ID
- No account required

### Meeting Transcript Analysis (Build 321)
- Auto-detects transcript format
- Extracts contacts (name, role, company)
- Detects research requests ("research this", "look into")
- Smart preview before import

---

## Data Model

```javascript
// Root tree structure
capexTree = {
  id: "root",
  name: "Project Name",
  type: "root",
  description: "...",
  pattern: { key: "generic", labels: {...} },
  specialistContext: "...",  // Build 260+
  extractedContacts: [...],  // Build 321+
  researchRequests: [...],   // Build 321+
  team: {                    // Build 262+
    host: { name, email, initials },
    collaborators: [...],
    contributors: [...]
  },
  children: [
    {
      id: "phase-0",
      name: "Phase Name",
      type: "phase",
      phaseNumber: 0,
      items: [
        {
          id: "item-0-0",
          name: "Item Name",
          description: "...",
          type: "item",
          cost: 1000000,
          dependencies: ["item-0-1"],
          pmStatus: "In Progress",
          pmProgress: 50,
          provenance: { source: "user", timestamp: "..." },
          subtasks: [...]
        }
      ]
    }
  ]
}
```

---

## Key File Locations

| File | Purpose |
|------|---------|
| `treeplexity.html` | Main production file |
| `welcome-to-treelisty.json` | Default welcome tree |
| `netlify/functions/claude-proxy.js` | Server proxy for Claude API |
| `.claude/skills/treelisty.md` | Claude Code skill definition |
| `docs/AI-CONTEXT.md` | This file - AI onboarding |
| `CLAUDE.md` | Quick reference for Claude Code |

---

## Common Operations

### Updating Version
1. Edit header comment (line ~9)
2. Update changelog in header (lines ~21-26)
3. Update UI version display (line ~2937-2938)

### Adding a Pattern
1. Add to `PATTERNS` object
2. Add to `buildPatternExpertPrompt()`
3. Add to `buildFieldInstructions()`
4. Add sorting options if applicable

### Deploying (REQUIRED for changes to go live)

**⚠️ ALWAYS commit and push after making changes!**

```bash
# Stage, commit with build number, and push
git add treeplexity.html
git commit -m "Build XXX: Description"
git push  # Triggers Netlify auto-deploy (~1-2 min)
```

The site auto-deploys from GitHub. No manual Netlify action needed.

---

## Known Constraints

1. **CORS**: Claude API requires Netlify proxy from `file://`; Gemini/ChatGPT need web server
2. **File Size**: ~1.3MB and growing; consider splitting if needed
3. **Token Limits**: Large trees may exceed context; use semantic chunking
4. **Netlify Timeout**: 10s limit on free tier; use streaming for long operations (Build 318+)

---

## Quick Reference: Build History

| Build | Date | Key Feature |
|-------|------|-------------|
| 408 | 2025-12-13 | Live Tree Agent - Full wizard integration |
| 407 | 2025-12-13 | Draggable frame + position persistence |
| 406 | 2025-12-13 | Visual node highlighting (new/modified pulse) |
| 405 | 2025-12-13 | Live Tree Agent frame (replaces wizard modal) |
| 392 | 2025-12-13 | LifeTree Health Check + GPT-5.2 support |
| 390 | 2025-12-12 | Visual Type Distinction for Canvas Nodes |
| 389 | 2025-12-12 | Semantic Type Indicators (chess-like variations) |
| 388 | 2025-12-12 | Edit Any Depth Node |
| 387 | 2025-12-11 | Fix LifeTree JSON Schema + Edit Support |
| 361 | 2025-12-07 | Pivot-Style Smart Hyperedges (auto-grouping, query builder, aggregates) |
| 360 | 2025-12-06 | Fix Syntax Error - Splash Screen Freeze |
| 359 | 2025-12-06 | Fix CORS for Local Version Check |
| 358 | 2025-12-06 | Check for Updates Button |
| 357 | 2025-12-06 | Version Check Fix for Local Files |
| 355 | 2025-12-06 | TreeBeard Phase 1 - Smarter & More Personal |
| 322 | 2025-12-05 | Voice Chat for Collaboration (Jitsi Meet) |
| 321 | 2025-12-05 | Meeting Transcript Analysis (contacts, research) |
| 320 | 2025-12-05 | Optimized Import Prompts (CAPEX, Philosophy) |
| 319 | 2025-12-04 | Smart Append + Semantic Deduplication |
| 318 | 2025-12-04 | Edge Function Streaming (fix timeouts) |
| 317 | 2025-12-04 | Nano Banana Image Generation |
| 315-316 | 2025-12-03 | Wiser TreeBeard (context injection) |
| 304-314 | 2025-12-03 | Tree View & Search Fixes |
| 296-303 | 2025-12-02 | 3D Knowledge Navigator |
| 280-295 | 2025-12-02 | 3D Fly Mode & Polish |
| 263-279 | 2025-12-01 | Live Collaboration Overhaul |
| 262 | 2025-12-03 | Dynamic Team Management |
| 261 | 2025-12-02 | Imagen 4 Image Generation |
| 260 | 2025-12-02 | AI Specialist Context |
| 259 | 2025-12-01 | TreeBeard Chat Redesign |
| 231 | 2025-12-01 | Firebase Live Sync |

---

## Related Documentation

- **Full Skill Definition**: `.claude/skills/treelisty.md`
- **Quick Reference**: `CLAUDE.md`
- **Test Suite**: `test/treelisty-test/`

---

*This document provides quick context for AI assistants working with the TreeListy codebase. Updated for Build 408.*
