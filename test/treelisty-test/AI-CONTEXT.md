# Treelisty Testing Context for AI Continuation

> **Purpose**: This document provides all context needed for any AI assistant to continue development and testing of Treelisty.

---

## Project Overview

**Treelisty** is a local-first, single-file HTML application (~55,000 lines) for hierarchical project decomposition with AI assistance.

### Core Capabilities
- 21 domain-specific patterns (Generic, Sales, Philosophy, Film, LifeTree, Veo3, Sora2, etc.)
- Multi-AI integration (Claude, Gemini, ChatGPT)
- Canvas and Tree views with pan/zoom
- 3D Knowledge Navigator (Three.js)
- AI vs AI Debate Mode (Builds 427-431)
- Pattern Translation Engine
- Hyperedge graph relationships
- Firebase Live Sync + Voice Chat
- Cloud Share with Firebase short URLs
- 50-state undo system
- PWA-ready (installable)
- LocalStorage persistence

### Current Release Snapshot (v2.19.0, Build 431)
- **Debate Mode** (Builds 427-431): AI vs AI spectator debates with Defender vs Challenger roles
  - 4 argument styles: Scholar, Socratic, Passionate, Pragmatist
  - Structured insight extraction to tree
  - Add to Tree with highlighting, scroll, expand
- **Cloud Share** (Build 425): Firebase short URLs for large trees
- **Share URL Size Warnings** (Build 424): Lite Share option
- **Share View State** (Build 414): Capture and restore view state in share links
- **3D Cinematic Splash** (Build 414): Visual intro on shared link open
- **MS Project XML** (Build 412): Import/export Microsoft Project files
- **Live Tree Agent** (Builds 405-408): Floating chat frame with node highlighting
- **LifeTree Health Check** (Build 392): TreeBeard command for biographical timelines

---

## Test Suite Overview

### Current Test Count: 335 tests (11 test files)

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `debate-mode.test.js` | 54 | Debate Mode UI, functions, styles, states |
| `tree-agent.test.js` | 49 | Live Tree Agent frame and highlighting |
| `collaboration.test.js` | 38 | Firebase sync, voice chat, sharing |
| `lifetree-healthcheck.test.js` | 35 | LifeTree pattern diagnostics |
| `tree-operations.test.js` | 32 | CRUD operations on tree nodes |
| `migration.test.js` | 29 | Schema versioning and upgrades |
| `hyperedges.test.js` | 29 | Cross-node relationships |
| `ai-config.test.js` | 24 | AI provider and persona settings |
| `model-providers.test.js` | 21 | Claude, Gemini, ChatGPT integration |
| `provenance.test.js` | 18 | Node origin tracking |
| `version-consistency.test.js` | 6 | Build number consistency checks |

---

## Architecture Notes

### Single-File Constraint
The entire application lives in `treeplexity.html`. This is intentional for:
- Zero dependencies
- Easy distribution
- Offline-first operation

**Testing Approach**: Tests read the HTML file directly and verify presence of elements, functions, and patterns.

### Key Global Objects
```javascript
// Main tree data structure
window.capexTree = {
    id: 'root',
    name: 'Project Name',
    type: 'root',
    schemaVersion: 1,
    hyperedges: [],
    pattern: { key: 'generic', labels: {...} },
    children: [/* phases */]
};

// Debate state (Build 427+)
window.currentDebate = {
    topic: 'string',
    sourceNodeId: 'node-id',
    personas: { a: {...}, b: {...} },
    turns: [{ role, text, timestamp }],
    status: 'setup'|'active'|'extracting'|'completed'
};

// Tree Agent state (Build 405+)
window.treeAgentState = {
    open: false,
    minimized: false,
    position: { x, y }
};
```

### Node Structure
```javascript
{
    id: 'item-0-0',
    name: 'Item Name',
    type: 'item',  // 'root' | 'phase' | 'item' | 'subtask'
    description: '',
    expanded: true,

    // Cognitive Citadel fields
    provenance: {
        source: 'user' | 'ai-import' | 'ai-claude' | 'legacy',
        timestamp: ISODate,
        modelId: null | 'claude-sonnet-4'
    },

    // Hierarchy (varies by type)
    children: [],   // For root
    items: [],      // For phases
    subtasks: [],   // For items
    subItems: []    // Alternative for subtasks
}
```

---

## Test Categories & Priority

### P0 - Critical (Must Pass)
- **Version Consistency**: All 4 build number locations match
- **Migration**: Data integrity across versions
- **File I/O**: Import/export without data loss

### P1 - Core Features
- Tree operations (CRUD on nodes)
- Pattern system (21 patterns)
- AI configuration
- Collaboration (Firebase, voice)

### P2 - New Features
- Debate Mode (UI, functions, states)
- Tree Agent (highlighting, dragging)
- Cloud Share

### P3 - Enhancement
- Performance with large trees
- Visual regression
- E2E scenarios

---

## Key Functions Reference

| Function | Location | Purpose |
|----------|----------|---------|
| `migrateTree(tree)` | ~Line 9003 | Schema migration |
| `handleDebate()` | ~Line 26400 | Start debate from node |
| `startDebate()` | ~Line 26500 | Begin debate with personas |
| `addInsightsToTree()` | ~Line 26995 | Extract insights to tree |
| `openTreeAgent()` | ~Line 33900 | Open floating agent frame |
| `trackNodeChange()` | ~Line 33935 | Highlight new/modified nodes |
| `createFirebaseSyncRoom()` | Variable | Start live collaboration |
| `runLifeTreeHealthCheck()` | ~Line 49000 | LifeTree diagnostics |

---

## Commands Reference

```bash
# One-time setup
npm install
npx playwright install

# Run unit tests (fast, 335 tests)
npm run test:unit

# Development watch mode
npm run test:watch

# Full suite (unit + integration + e2e)
npm test

# Specific test file
npx vitest run test/unit/debate-mode.test.js

# Debugging
npx vitest run -t "debate"              # Run tests matching pattern
npx playwright test --headed            # See browser
```

---

## File Structure

```
treelisty/
├── treeplexity.html              # Source (~55,000 lines)
├── welcome-to-treelisty.json     # Default welcome tree
├── test/
│   └── treelisty-test/
│       ├── package.json
│       ├── vitest.config.js
│       ├── playwright.config.js
│       ├── AI-CONTEXT.md         # This file
│       ├── test/
│       │   ├── unit/
│       │   │   ├── debate-mode.test.js     # NEW (Build 427-431)
│       │   │   ├── tree-agent.test.js
│       │   │   ├── collaboration.test.js
│       │   │   ├── lifetree-healthcheck.test.js
│       │   │   ├── tree-operations.test.js
│       │   │   ├── migration.test.js
│       │   │   ├── hyperedges.test.js
│       │   │   ├── ai-config.test.js
│       │   │   ├── model-providers.test.js
│       │   │   ├── provenance.test.js
│       │   │   └── version-consistency.test.js
│       │   ├── e2e/
│       │   │   └── *.spec.js
│       │   └── fixtures/
│       │       └── *.js
```

---

## Adding Tests for New Features

### Pattern for Presence Tests
```javascript
describe('Feature Name (Build XXX)', () => {
    let htmlContent;

    beforeAll(() => {
        const htmlPath = resolve(__dirname, '../../../../treeplexity.html');
        htmlContent = readFileSync(htmlPath, 'utf-8');
    });

    it('has expected element', () => {
        expect(htmlContent).toContain('id="element-id"');
    });

    it('has expected function', () => {
        expect(htmlContent).toContain('function featureName(');
    });

    it('has expected CSS class', () => {
        expect(htmlContent).toContain('.feature-class');
    });
});
```

---

## TODOs

- [ ] Add E2E tests for Debate Mode workflow
- [ ] Add tests for Cloud Share (Firebase short URLs)
- [ ] Add tests for MS Project XML import/export
- [ ] Add visual regression tests for 3D splash
- [ ] Add performance tests for large debate transcripts
- [ ] Implement API mocking for AI integration tests
- [ ] Add tests for all 21 patterns

---

## Version History

| Build | Tests Added | Notes |
|-------|-------------|-------|
| 431 | +54 (Debate Mode) | Comprehensive debate tests |
| 408 | +49 (Tree Agent) | Agent frame and highlighting |
| 392 | +35 (LifeTree) | Health check tests |
| 361 | +29 (Hyperedges) | Smart grouping tests |

---

*Last Updated: 2025-12-16 (Build 431)*
*Test Count: 335 tests across 11 files*
