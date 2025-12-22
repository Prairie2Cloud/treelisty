# TreeListy Self-Tree Improvement Plan

**Based on:** Self-Tree v1.0/v1.1 findings, cross-cutting theme analysis, and AI peer review
**Created:** 2025-12-22
**Goal:** Address top 5 priorities surfaced by recursive self-analysis

---

## Executive Summary

The self-tree exercise revealed that **Performance** appears 9 times across all phases - more than any other theme. This, combined with Export limitations and Discoverability issues, blocks adoption by 3 of 4 user personas (PM, Researcher, Student).

### Top 5 Priorities (by cross-reference frequency)

| Priority | Theme | Frequency | Personas Blocked |
|----------|-------|-----------|------------------|
| 1 | Performance | 9 mentions | All |
| 2 | Export Limitations | 4 mentions | PM, Student |
| 3 | Discoverability | 3 mentions | All new users |
| 4 | Storage Limits | 3 mentions | Power users |
| 5 | MCP Reliability | 2 mentions | Developer |

---

## Phase 1: Performance Foundation (Builds 540-545)

### 1.1 Virtual Scrolling for Tree View
**Problem:** Tree view lags significantly with >150 nodes
**Solution:** Implement windowed rendering - only render visible nodes + buffer

```
Approach:
- Calculate viewport height / row height = visible count
- Maintain scroll position -> start index mapping
- Render only [startIndex - buffer, startIndex + visibleCount + buffer]
- Use CSS transform for smooth scrolling illusion
```

**Files to modify:**
- `treeplexity.html` - `render()` function (~line 8500)
- Add new `VirtualTreeRenderer` class

**Acceptance:** 500 nodes renders at 60fps, <100ms initial paint

### 1.2 Canvas View Optimization
**Problem:** Canvas becomes unusable >200 nodes (GoJS overhead)
**Solution:** Implement viewport culling and batched updates

```
Approach:
- Only render nodes within viewport bounds + margin
- Batch node property updates (collect changes, apply once)
- Use GoJS virtualization mode if available
- Implement level-of-detail (collapse distant subtrees to icons)
```

**Files to modify:**
- `treeplexity.html` - `renderCanvas()` function (~line 12000)
- GoJS diagram configuration

**Acceptance:** 500 nodes smooth pan/zoom, <200ms re-render

### 1.3 Performance Benchmarking Suite
**Problem:** v1.0 claimed "200 nodes slows Canvas" without measurement
**Solution:** Add automated performance tests

```javascript
// New test file: test/performance/render-benchmarks.test.js
describe('Render Performance', () => {
  it('Tree view renders 500 nodes in <100ms', async () => {
    const tree = generateTestTree(500);
    const start = performance.now();
    await renderTree(tree);
    expect(performance.now() - start).toBeLessThan(100);
  });
});
```

---

## Phase 2: Data Infrastructure (Builds 546-550)

### 2.1 IndexedDB Migration
**Problem:** localStorage 5MB limit blocks large trees and multi-tree workflows
**Solution:** Migrate to IndexedDB with localStorage fallback

```
Schema:
- trees: { id, name, pattern, data, lastModified, size }
- settings: { key, value }
- history: { treeId, snapshot, timestamp } // for undo

Migration path:
1. Check for existing localStorage data
2. Migrate to IndexedDB on first load
3. Clear localStorage after successful migration
4. Fall back to localStorage if IndexedDB unavailable
```

**Files to modify:**
- New: `treeplexity.html` - `IndexedDBStorage` class
- Update: `saveToLocalStorage()`, `loadFromLocalStorage()`

**Acceptance:** 50MB tree saves/loads successfully, multi-tree picker works

### 2.2 Multi-Tree Management
**Problem:** Single-tree limitation forces manual file juggling
**Solution:** Tree picker/manager using IndexedDB storage

```
UI:
- "My Trees" panel in sidebar
- Create/Open/Rename/Delete operations
- Recent trees list
- Import from file into library
```

---

## Phase 3: Export & Interoperability (Builds 551-555)

### 3.1 Excel Export (.xlsx)
**Problem:** PM persona can't share trees with stakeholders who expect spreadsheets
**Solution:** Client-side Excel generation using SheetJS

```
Format:
- Sheet 1: Hierarchical outline (indented rows)
- Sheet 2: Flat list with parent references
- Sheet 3: Metadata (pattern, dates, stats)

Columns: ID, Name, Description, Type, Parent, Status, Due Date, etc.
```

**Library:** SheetJS (xlsx) - already has CDN build
**Files:** Add export handler in treeplexity.html

### 3.2 PDF Export
**Problem:** No way to create printable documentation from trees
**Solution:** Client-side PDF generation using jsPDF

```
Options:
- Outline format (indented text)
- Visual snapshot (canvas/tree screenshot)
- Report format (title, TOC, sections per phase)
```

### 3.3 Global Find/Replace
**Problem:** No way to bulk-edit node content
**Solution:** Search modal with find/replace functionality

```
Features:
- Search across name, description, all fields
- Regex support
- Replace single / Replace all
- Preview changes before applying
- Keyboard shortcut: Ctrl+Shift+F
```

---

## Phase 4: Discoverability & Onboarding (Builds 556-560)

### 4.1 Keyboard Shortcut Panel
**Problem:** 50+ shortcuts exist but only power users know them
**Solution:** Visual shortcut reference accessible via `?` key

```
Design:
- Modal overlay grouped by category
- Search/filter shortcuts
- Click to execute shortcut
- "Tip of the day" on load (opt-out)
```

### 4.2 Interactive Feature Tour
**Problem:** New users don't discover patterns, views, AI features
**Solution:** Guided walkthrough on first load (or via Help menu)

```
Stops:
1. Create your first node
2. Try different views (Tree → Canvas → 3D)
3. Use a pattern (CAPEX, Philosophy, etc.)
4. Meet TreeBeard (AI assistant)
5. Keyboard shortcuts
```

### 4.3 Persona-Based Quick Starts
**Problem:** Generic welcome tree doesn't resonate with specific use cases
**Solution:** "What are you building?" prompt with tailored templates

```
Options:
- "Project Plan" → CAPEX pattern, Gantt-ready structure
- "Research Notes" → Knowledge Base pattern, hyperedge-ready
- "Life Goals" → LifeTree pattern, bio structure
- "Just exploring" → Generic with tips
```

---

## Phase 5: MCP & Developer Experience (Builds 561-565)

### 5.1 MCP Bridge Hardening
**Problem:** Node operations fragile, discovered bugs during self-tree
**Solution:** Comprehensive test coverage and error handling

```
Already fixed (Build 539):
- update_node, create_node, get_node, delete_node param naming

Still needed:
- Root node mutability (currently can't update root via MCP)
- Transaction rollback on partial failure
- Connection recovery after disconnect
- Rate limiting to prevent UI lag
```

### 5.2 MCP Integration Tests
**Problem:** No automated tests for MCP operations
**Solution:** Playwright tests with actual MCP bridge

```javascript
// test/integration/mcp-operations.test.js
describe('MCP Bridge', () => {
  it('update_node modifies node and persists', async () => {
    await mcpCall('update_node', { node_id: 'test-1', updates: { name: 'New' } });
    const node = await mcpCall('get_node', { node_id: 'test-1' });
    expect(node.name).toBe('New');
  });
});
```

### 5.3 CI/CD Pipeline
**Problem:** Manual version bumping, no automated testing on PR
**Solution:** GitHub Actions workflow

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration

  version:
    if: github.ref == 'refs/heads/main'
    needs: test
    steps:
      - run: ./scripts/bump-version.sh
```

---

## Implementation Sequence

```
Week 1-2: Performance Foundation
├── Build 540: Virtual scrolling prototype for Tree view
├── Build 541: Virtual scrolling polish + tests
├── Build 542: Canvas viewport culling
├── Build 543: Canvas batch updates
├── Build 544: Performance benchmark suite
└── Build 545: Performance regression tests in CI

Week 3-4: Data Infrastructure
├── Build 546: IndexedDB storage class
├── Build 547: Migration from localStorage
├── Build 548: Multi-tree picker UI
├── Build 549: Tree management operations
└── Build 550: Storage stress tests

Week 5-6: Export & Search
├── Build 551: Excel export (SheetJS)
├── Build 552: PDF export (jsPDF)
├── Build 553: Global find
├── Build 554: Global replace
└── Build 555: Export format options

Week 7-8: Discoverability
├── Build 556: Keyboard shortcut panel
├── Build 557: Interactive tour framework
├── Build 558: Tour content for core features
├── Build 559: Persona quick starts
└── Build 560: Help system integration

Week 9-10: MCP & CI/CD
├── Build 561: MCP root node fix
├── Build 562: MCP transaction improvements
├── Build 563: MCP integration tests
├── Build 564: GitHub Actions CI
└── Build 565: Automated version bumping
```

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Tree view FPS (500 nodes) | ~15 | 60 | Performance benchmark |
| Canvas view FPS (500 nodes) | ~5 | 30 | Performance benchmark |
| Max tree size (localStorage) | 5MB | 50MB | IndexedDB migration |
| Export formats | 3 | 5 | JSON, MD, XML + Excel, PDF |
| Feature discovery rate | ~5% | 30% | Tour completion analytics |
| MCP test coverage | 0% | 80% | Jest coverage report |
| CI pipeline | None | Full | GitHub Actions green |

---

## Self-Tree Feedback Loop

After implementing each phase, re-run the self-tree benchmark:

```
1. Load TreeListy with new build
2. Open TreeBeard in Deep mode
3. Run v1.1 prompt from self-trees/next-prompt.md
4. Export resulting tree
5. Compare to previous self-tree:
   - Did performance mentions decrease?
   - Are export limitations resolved?
   - Did discoverability improve?
6. Update prompt for v1.2 based on findings
```

The self-tree serves as a living quality metric: **a healthy TreeListy should generate increasingly positive self-assessments**.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Virtual scrolling breaks accessibility | Test with screen readers before shipping |
| IndexedDB not available in all browsers | Keep localStorage fallback, show warning |
| SheetJS/jsPDF add significant bundle size | Lazy-load on first export |
| Tour annoys returning users | "Don't show again" + restart from Help menu |
| CI adds friction to quick fixes | Fast path for hotfixes, full CI for features |

---

*Plan derived from TreeListy Self-Tree v1.1 (Build 538) cross-cutting theme analysis*
