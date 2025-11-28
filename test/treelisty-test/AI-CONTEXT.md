# Treelisty Testing Context for AI Continuation

> **Purpose**: This document provides all context needed for any AI assistant to continue development and testing of Treelisty.

---

## Project Overview

**Treelisty** is a local-first, single-file HTML application (~24,000 lines) for hierarchical project decomposition with AI assistance.

### Core Capabilities
- 17+ domain-specific patterns (Generic, Sales, Philosophy, Film, etc.)
- Multi-AI integration (Claude, Gemini, ChatGPT)
- Canvas and Tree views with pan/zoom
- Pattern Translation Engine
- Hyperedge graph relationships
- 50-state undo system
- PWA-ready (installable)
- LocalStorage persistence

### Recent Addition: Cognitive Citadel Foundation (v2.10.0, Build 165)
- **Migration System**: Schema versioning for backward compatibility
- **Provenance Stamping**: All nodes track origin (user/ai-import/legacy)
- **Dialectic Mode**: Forces AI to identify assumptions before helping
- **Phenomenology Array**: Stub for capturing "residue" that doesn't fit structure
- **Metrics Stub**: Foundation for attention economics tracking

---

## Architecture Notes

### Single-File Constraint
The entire application lives in `treeplexity.html`. This is intentional for:
- Zero dependencies
- Easy distribution
- Offline-first operation

**Testing Implication**: We must extract testable functions into a separate module for unit testing, while keeping the source file intact.

### Key Global Objects
```javascript
// Main tree data structure
window.capexTree = {
    id: 'root',
    name: 'Project Name',
    type: 'root',
    schemaVersion: 1,
    hyperedges: [],
    snapshotRefs: [],
    aiConfig: { tone, verbosity, creativity, dialecticMode, customInstructions },
    children: [/* phases */]
};

// Current pattern (string key into PATTERNS object)
window.currentPattern = 'generic';

// Pattern definitions
const PATTERNS = {
    generic: { name, icon, levels, types, fields, ... },
    sales: { ... },
    // ... 17+ patterns
};
```

### Node Structure (Post-Migration)
```javascript
{
    id: 'item-0-0',
    name: 'Item Name',
    type: 'item',  // 'root' | 'phase' | 'item' | 'subtask'
    description: '',
    
    // Cognitive Citadel fields
    provenance: {
        source: 'user' | 'ai-import' | 'ai-claude' | 'legacy',
        timestamp: ISODate,
        modelId: null | 'claude-sonnet-4'
    },
    phenomenology: [],  // Future: user reflections
    metrics: {
        editCount: 0,
        focusTime: 0,
        lastModified: timestamp
    },
    
    // Hierarchy
    items: [],      // For phases
    subItems: [],   // For items
    children: []    // Alternative child container
}
```

### Critical Functions to Test

| Function | Location | Purpose |
|----------|----------|---------|
| `migrateTree(tree)` | ~Line 9003 | Schema migration |
| `normalizeNode(node, source)` | ~Line 8967 | Add missing fields |
| `getNodeById(tree, id)` | Variable | Find node by ID |
| `getAllNodes(tree)` | Variable | Flatten tree |
| `handleCreate()` | ~Line 13353 | Create new item |
| `handleAddSubtask()` | ~Line 13383 | Create subtask |
| `importAnalyzedTree()` | ~Line 21194 | Import AI results |
| `applyPersonaTuning(prompt)` | ~Line 3598 | Inject AI config |
| `getAIConfig()` | ~Line 3575 | Get AI settings |
| `saveToLocalStorage()` | Variable | Persist tree |
| `translateNode()` | ~Line 3999 | Pattern translation |

---

## Testing Strategy

### Test Pyramid
```
        E2E (Playwright)         ~20 tests, 2-3 min
       ─────────────────
      Integration (Vitest+DOM)   ~50 tests, 30 sec
     ───────────────────────
    Unit Tests (Vitest)          ~200 tests, 10 sec
   ─────────────────────────────
```

### Extraction Approach
Since we can't import from HTML directly, we:
1. Parse `treeplexity.html` 
2. Extract function definitions via regex
3. Generate `test/treelisty-core.js` module
4. Import this module in tests

**Important**: The extraction script must be run before tests when source changes.

---

## Test Categories & Priority

### P0 - Critical (Must Pass)
- **Migration**: Data integrity across versions
- **File I/O**: Import/export without data loss
- **Undo/Redo**: User trust depends on this

### P1 - Core Features
- Tree operations (CRUD on nodes)
- Pattern system
- Provenance stamping

### P2 - Integration
- AI configuration
- Canvas rendering
- LocalStorage sync

### P3 - Enhancement
- Performance with large trees
- Visual regression

---

## Known Issues & Edge Cases

### 1. Line Endings
The source file uses CRLF (Windows). Convert before parsing:
```bash
sed -i 's/\r$//' treeplexity.html
```

### 2. Child Container Inconsistency
Different node types use different child arrays:
- Phases: `items` array
- Items: `subItems` array  
- Some imports: `children` array

Tests must handle all three.

### 3. Pattern-Specific Fields
Each pattern has unique fields. The generic test fixtures may not cover all patterns.

### 4. AI API Mocking
AI integration tests should mock external APIs. Never make real API calls in tests.

---

## File Structure

```
treelisty/
├── treeplexity.html              # Source (DO NOT MODIFY during tests)
├── package.json
├── vitest.config.js
├── playwright.config.js
├── scripts/
│   ├── extract-testable.js       # Generates testable module
│   └── setup-testing.js          # One-time setup
├── test/
│   ├── treelisty-core.js         # AUTO-GENERATED (gitignore this)
│   ├── unit/
│   │   ├── migration.test.js
│   │   ├── tree-operations.test.js
│   │   ├── patterns.test.js
│   │   ├── ai-config.test.js
│   │   └── provenance.test.js
│   ├── integration/
│   │   ├── dom-operations.test.js
│   │   ├── storage.test.js
│   │   └── file-io.test.js
│   ├── e2e/
│   │   ├── critical-paths.spec.js
│   │   └── visual-regression.spec.js
│   └── fixtures/
│       ├── trees.js              # Sample tree data
│       └── patterns.js           # Pattern test data
└── .github/
    └── workflows/
        └── test.yml              # CI/CD pipeline
```

---

## Commands Reference

```bash
# One-time setup
npm install
npx playwright install

# Before running tests (after source changes)
npm run extract

# Development
npm run test:watch          # Auto-rerun on changes
npm run test:unit           # Fast feedback

# Pre-commit
npm run test:unit
npm run test:integration

# Pre-push / CI
npm test                    # Full suite

# Debugging
npx vitest run -t "migration"           # Run specific tests
npx playwright test --headed            # See browser
npx playwright test --debug             # Step through
npx playwright test --update-snapshots  # Update baselines
```

---

## Continuation Points

### If Adding New Feature
1. Write tests first (TDD) in appropriate test file
2. Run `npm run test:watch` during development
3. Ensure migration handles new schema fields
4. Update fixtures if new data structures added

### If Fixing Bug
1. Write failing test that reproduces bug
2. Fix bug in source
3. Run `npm run extract` then tests
4. Verify test passes

### If Updating Tests
1. Check `AI-CONTEXT.md` for current state
2. Run existing tests to establish baseline
3. Make changes
4. Update this document if architecture changes

---

## Schema Version History

| Version | Build | Changes |
|---------|-------|---------|
| 0 | <165 | No schema versioning |
| 1 | 165 | Added provenance, phenomenology, metrics, hyperedges, snapshotRefs |

**Migration Rule**: Always increment `SCHEMA_VERSION` when adding required node fields.

---

## Contact & Resources

- **Main File**: `treeplexity.html`
- **Current Version**: v2.10.0 (Build 165)
- **Pattern Count**: 17+
- **Approximate LOC**: 24,000

---

## Quick Start for New AI

```bash
# 1. Understand the source
# Read treeplexity.html lines 1-150 (header comments)
# Read lines 8959-9025 (migration system)
# Read PATTERNS object (~lines 7900-8900)

# 2. Run existing tests
cd /path/to/treelisty
npm install
npm run extract
npm test

# 3. Check test output for current state
# Green = working, Red = needs attention

# 4. Continue from TODO list below
```

---

## Current TODOs

- [ ] Implement visual regression baseline images
- [ ] Add tests for all 17 patterns
- [ ] Add performance tests for 1000+ node trees
- [ ] Add API mocking for AI integration tests
- [ ] Implement snapshot system tests (Step 5 of roadmap)
- [ ] Add phenomenology UI tests (Step 3 of roadmap)

---

*Last Updated: 2025-11-28 by Claude (Opus 4.5)*
*Context Version: 1.0*
