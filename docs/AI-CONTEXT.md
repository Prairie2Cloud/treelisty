# TreeListy AI Context Document

**Current Version**: v2.11.0 (Build 262)
**Last Updated**: 2025-12-03
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
- Dual view system: Tree View + Canvas View
- 17 specialized patterns for different domains
- 3 AI providers: Claude, Gemini, ChatGPT
- PWA-ready (installable, offline capable)

---

## Architecture at a Glance

```
treeplexity.html (single file ~1.3MB)
├── HTML structure (~2000 lines)
├── CSS styles (~3000 lines)
├── JavaScript (~19000 lines)
│   ├── Data model (capexTree object)
│   ├── Rendering (Tree + Canvas views)
│   ├── AI integration (3 providers)
│   ├── Pattern system (17 patterns)
│   ├── Import/Export (JSON, Excel, URL)
│   └── PM tracking (status, progress, RAG)
└── Netlify function (claude-proxy.js for CORS)
```

---

## Current Version Highlights (Build 262)

1. **Dynamic Team Management** (Build 262): Contributors with unique initials, email accountability
2. **Imagen 4 Image Generation** (Build 261): AI-generated images with multiple styles
3. **AI Specialist Context** (Build 260): Per-project expertise context for AI calls
4. **TreeBeard Chat Redesign** (Build 259): Expanded panel, cleaner UX
5. **Firebase Live Sync** (Build 231+): Real-time collaboration via Firebase
6. **Collaboration System**: Share nodes → Edit → Share Back → Merge workflow
7. **Model Selector**: Per-call model selection (Claude Haiku/Sonnet/Opus, Gemini Flash/Pro, GPT-4o/o1)

---

## 17 Specialized Patterns

| Pattern | Key Fields | AI Persona |
|---------|------------|------------|
| Generic Project | cost, leadTime, dependencies | Project Manager |
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
| AI Video Production | aiPlatform, videoPrompt, cameraMovement | Film Director |
| Family Tree | birthDate, livingStatus, dnaInfo | Genealogist |
| Dialogue & Rhetoric | rhetoricalDevice, fallaciesPresent, counterargument | Rhetoric Analyst |
| File System | fileSize, fileExtension, dateModified | Systems Administrator |
| Gmail Workflow | recipientEmail, subjectLine, threadId | Email Analyst |

---

## Core AI Features

| Feature | Purpose | Modes |
|---------|---------|-------|
| AI Wizard | Conversational tree building | Build, Enhance |
| Analyze Text | Extract structure from documents | Quick (1500 tokens), Deep (8192 tokens) |
| AI Review | Comprehensive quality analysis | Standard |
| Smart Suggest | Context-aware field suggestions | AI, Quick |
| Generate Prompt | Export as AI-ready prompt | Pattern-aware |

**Key Algorithms**:
- **Smart Merge**: Additive updates only - never deletes user data
- **Semantic Chunking**: Embedding-based text segmentation (Build 156+)
- **Barnes-Hut Quadtree**: O(n log n) force-directed layout

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
  children: [
    {
      id: "phase-0",
      name: "Phase Name",
      type: "phase",
      phaseNumber: 0,
      showInCanvas: true,  // Build 140+
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
          provenance: "user",  // Build 165+
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
| `.claude/skills/treeplexity.md` | Claude Code skill definition |
| `docs/AI-CONTEXT.md` | This file - AI onboarding |

---

## Common Operations

### Updating Version
1. Edit header comment (line ~9)
2. Update changelog in header (lines ~19-24)
3. Update UI version display (line ~1658)
4. Update VERSION.md

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
4. **Netlify Timeout**: 10s limit on free tier; use Deep Mode for long operations

---

## Quick Reference: Build History

| Build | Date | Key Feature |
|-------|------|-------------|
| 262 | 2025-12-03 | Dynamic Team Management (unique initials, email accountability) |
| 261 | 2025-12-02 | Imagen 4 Image Generation (visual styles, aspect ratios) |
| 260 | 2025-12-02 | AI Specialist Context (per-project expertise) |
| 259 | 2025-12-01 | TreeBeard Chat Redesign (expanded panel, clean UX) |
| 231 | 2025-12-01 | Firebase Live Sync (real-time collaboration) |
| 203 | 2025-11-30 | Collaboration privacy fix + UX improvements |
| 187 | 2025-11-29 | Complete Collaboration System (Branch & Merge) |
| 165 | 2025-11-28 | Cognitive Citadel (migration, provenance, dialectic) |
| 156 | 2025-11-24 | Semantic Chunking Engine |
| 152 | 2025-11-22 | Wolfram-style Hyperedges |
| 140 | 2025-11-20 | Selective Canvas visibility |

---

## Related Documentation

- **Full Feature Matrix**: `TREELISTY_FEATURES_2025.md`
- **Skill Definition**: `.claude/skills/treelisty.md`
- **Build Details**: `docs/builds/` folder
- **Legacy Docs**: `docs/archive/` folder

---

*This document provides quick context for AI assistants working with the TreeListy codebase.*
