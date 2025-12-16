# TreeListy AI Context Document

**Current Version**: v2.19.0 (Build 431)
**Last Updated**: 2025-12-16
**Repository**: https://github.com/Prairie2Cloud/treelisty
**Live Site**: https://treelisty.netlify.app

---

## IMPORTANT: Deployment Procedure

**TreeListy deploys via GitHub -> Netlify (auto-deploy on push)**

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
- 21 specialized patterns for different domains
- 3 AI providers: Claude, Gemini, ChatGPT
- PWA-ready (installable, offline capable)
- Real-time collaboration with Firebase + Voice Chat
- AI vs AI Debate Mode

---

## Architecture at a Glance

```
treeplexity.html (single file ~1.3MB)
├── HTML structure (~2000 lines)
├── CSS styles (~4000 lines)
├── JavaScript (~55000+ lines)
│   ├── Data model (capexTree object)
│   ├── Rendering (Tree + Canvas + 3D views)
│   ├── AI integration (3 providers + pattern-aware routing)
│   ├── Pattern system (21 patterns)
│   ├── Debate Mode (AI vs AI)
│   ├── Import/Export (JSON, Excel, MS Project XML, URL)
│   ├── Collaboration (Firebase Live Sync + Voice Chat)
│   └── PM tracking (status, progress, RAG)
└── Netlify function (claude-proxy.js for CORS)
```

---

## Current Version Highlights (Builds 409-431)

### Debate Mode (Builds 427-431)
1. **AI vs AI Spectator Debates** (Build 427): Watch two AI personas debate any topic
   - Right-click node -> "Debate This Topic"
   - Floating draggable panel with transcript
   - Interject with your own comments
   - Autoplay mode for continuous debate
2. **Defender vs Challenger** (Build 430): Opposing positions
   - Defender argues FOR the topic
   - Challenger argues AGAINST
   - 4 argument styles: Scholar, Socratic, Passionate, Pragmatist
3. **Structured Insight Extraction** (Build 431): Tree output
   - Pro/con/tension/question categorization
   - Visual highlighting of new nodes
   - Auto-scroll to added content
   - Parent node auto-expansion

### Cloud Share (Builds 424-426)
4. **Firebase Short URLs** (Build 425): Large tree sharing
   - Trees > 8KB use Firebase short codes
   - Format: `?s=shortcode`
   - Automatic fallback from URL encoding
5. **Share URL Size Warnings** (Build 424): UX improvements
   - Warning modal for large trees (>100KB)
   - "Lite Share" strips descriptions/subtasks
   - Size display shows URL length

### View & UX Improvements (Builds 409-420)
6. **Share View State + 3D Splash** (Build 414-415):
   - Share links capture view state
   - 3D cinematic orbit splash on open
   - Shape hierarchy for node types
7. **MS Project XML** (Build 412): Import/export Microsoft Project files
8. **Reader Navigation** (Build 411): Sequential reading mode
9. **Zoom to Cursor** (Build 410): Canvas zoom centers on mouse
10. **Phase Color Cycling** (Build 420): LifeTree decades get unique colors

---

## Previous Features (Builds 263-408)

### Live Tree Agent (Builds 405-408)
- Floating frame replaces cramped wizard modal
- Draggable, position saved to localStorage
- Visual node highlighting (green=new, yellow=modified)
- Full chat history with scrollable messages
- Progress bar synced with tree building

### LifeTree Health Check (Build 392)
- Detects empty phases, redundant periods, chronology gaps
- Fix commands: consolidate_legacy, fix_chronology, fill_empty
- GPT-5.2 Pro/base/Chat model support

### Smart Hyperedges (Build 361)
- Auto-grouping: status, assignee, cost patterns
- Query builder: filter conditions -> create hyperedge
- Live aggregates: $2.3M, 67%, 4 nodes

### Voice Chat (Build 322)
- Jitsi Meet integration
- Shared room via session ID

---

## 21 Specialized Patterns

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
| LifeTree | eventDate, age, location, people, emotion | Oral Historian |
| Custom | user-defined fields | Custom persona |

---

## Core AI Features

| Feature | Purpose | Modes |
|---------|---------|-------|
| AI Wizard / Tree Agent | Conversational tree building | Build, Enhance |
| Analyze Text | Extract structure from documents | Quick (1500 tokens), Deep (8192 tokens) |
| Debate Mode | AI vs AI spectator debates | Defender vs Challenger |
| Smart Suggest | Context-aware field suggestions | AI, Quick |
| Generate Prompt | Export as AI-ready prompt | Pattern-aware |
| TreeBeard Chat | Contextual AI assistant | Quick, Conversation |

**Key Algorithms**:
- **Smart Merge**: Additive updates only - never deletes user data
- **Semantic Chunking**: Embedding-based text segmentation
- **Semantic Deduplication**: 60% Jaccard similarity threshold
- **Pattern-Aware Model Selection**: Sonnet for CAPEX, Opus for Philosophy
- **Node Change Tracking**: Visual highlighting for new/modified nodes

---

## Collaboration System

### Firebase Live Sync
- Real-time multi-user editing
- Presence badges showing online users
- Floating draggable chat box
- One-click session creation

### Cloud Share (Build 425)
- Large trees use Firebase short URLs
- Format: `?s=shortcode`
- Automatic fallback

### Voice Chat (Build 322)
- Jitsi Meet integration
- Shared room via session ID
- No account required

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
  hyperedges: [...],
  children: [
    {
      id: "phase-0",
      name: "Phase Name",
      type: "phase",
      items: [
        {
          id: "item-0-0",
          name: "Item Name",
          type: "item",
          cost: 1000000,
          pmStatus: "In Progress",
          subtasks: [...]
        }
      ]
    }
  ]
}

// Debate state (Build 427+)
currentDebate = {
  topic: "string",
  sourceNodeId: "node-id",
  personas: { a: {...}, b: {...} },
  turns: [{ role: "a"|"b"|"user", text: "...", timestamp: ... }],
  status: "setup"|"active"|"extracting"|"completed",
  extractedInsights: [{ type: "pro"|"con"|"tension"|"question", text: "..." }]
}
```

---

## Key File Locations

| File | Purpose |
|------|---------|
| `treeplexity.html` | Main production file |
| `welcome-to-treelisty.json` | Default welcome tree |
| `netlify/functions/claude-proxy.js` | Server proxy for Claude API |
| `.claude/skills/treelisty/SKILL.md` | Claude Code skill definition |
| `docs/AI-CONTEXT.md` | This file - AI onboarding |
| `CLAUDE.md` | Quick reference for Claude Code |

---

## Version Update Locations

When releasing, update these **4 locations**:

1. **Header comment** (~line 9): `TreeListy v2.19.0 | Build XXX | YYYY-MM-DD`
2. **Changelog** (~lines 21-28): Add new entry
3. **TREELISTY_VERSION object** (~line 681): `build: XXX`
4. **KNOWN_LATEST** (~line 54512): `const KNOWN_LATEST = XXX;`

Use the `treelisty-release` skill to automate this.

---

## Known Constraints

1. **CORS**: Claude API requires Netlify proxy from `file://`
2. **File Size**: ~1.3MB and growing
3. **Token Limits**: Large trees may exceed context; use semantic chunking
4. **Netlify Timeout**: 10s limit; use streaming for long operations

---

## Quick Reference: Build History

| Build | Date | Key Feature |
|-------|------|-------------|
| 431 | 2025-12-16 | Debate Add-to-Tree Navigation Fix |
| 430 | 2025-12-16 | Debate Mode - Defender vs Challenger |
| 429 | 2025-12-16 | Debate Panel UX (drag, position) |
| 428 | 2025-12-16 | Fix Debate Mode Start Button |
| 427 | 2025-12-15 | Debate Mode - AI vs AI spectator debates |
| 426 | 2025-12-15 | Version Conflict Modal improvements |
| 425 | 2025-12-15 | Cloud Share via Firebase Short URLs |
| 424 | 2025-12-15 | Share URL Size Warnings + Lite Share |
| 423 | 2025-12-15 | Fix duplicate pattern declaration |
| 421 | 2025-12-14 | Fix Hyperedge Show/Hide in Canvas |
| 420 | 2025-12-14 | Phase Color Cycling |
| 419 | 2025-12-14 | Fix Chat Builder Send/Finish Buttons |
| 418 | 2025-12-14 | Fix Tree Agent Drag/Close Buttons |
| 417 | 2025-12-14 | Fix Hyperedge AI Analysis |
| 415 | 2025-12-13 | Shape Hierarchy for Node Types |
| 414 | 2025-12-13 | Share View State with 3D Splash |
| 412 | 2025-12-13 | MS Project XML Import/Export |
| 411 | 2025-12-13 | Reader Navigation |
| 410 | 2025-12-13 | Zoom to Cursor |
| 409 | 2025-12-13 | Fix Right-Click Context Menu |
| 408 | 2025-12-13 | Live Tree Agent - Full wizard integration |
| 405-407 | 2025-12-13 | Live Tree Agent Frame + Highlighting |
| 392 | 2025-12-13 | LifeTree Health Check + GPT-5.2 |
| 361 | 2025-12-07 | Smart Hyperedges |
| 322 | 2025-12-05 | Voice Chat |
| 318 | 2025-12-04 | Edge Function Streaming |
| 296-303 | 2025-12-02 | 3D Knowledge Navigator |
| 263-279 | 2025-12-01 | Live Collaboration |

---

## Related Documentation

- **Full Skill Definition**: `.claude/skills/treelisty/SKILL.md`
- **Quick Reference**: `CLAUDE.md`
- **Test Suite**: `test/treelisty-test/`

---

*This document provides quick context for AI assistants working with the TreeListy codebase. Updated for Build 431.*
