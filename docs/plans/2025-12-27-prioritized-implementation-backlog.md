# TreeListy Prioritized Implementation Backlog

**Date:** 2025-12-31
**Current Build:** 700
**Status:** Living Document
**Last Updated:** 2026-01-02 (Gallery of Trees SHIPPED Builds 696-700, Mobile strategy: Safari browser)

---

## Executive Summary

This document synthesizes all pending design documents and plans into a prioritized implementation roadmap. Items are organized by:
1. **Dependencies** - What blocks what
2. **User Value** - Direct UX impact
3. **Effort Level** - Implementation complexity
4. **Strategic Alignment** - Platform vision fit

**Principle:** Ship incrementally. Each build should deliver standalone value.

**Key Decisions:**
- **Mobile UX:** Safari browser preferred over PWA (updated 2026-01-02) - better live recording performance
- **TB Architecture:** Structured Tool Use via Claude API (Build 658)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **SHIPPED** | Deployed in production |
| **READY** | Design approved, implementation ready |
| **BLOCKED** | Waiting on dependency |
| **REVIEW** | Needs external review/feedback |
| **DRAFT** | Design incomplete |
| **FUTURE** | Strategic but not prioritized |
| **STALE** | Outdated architecture assumptions |
| **SUPERSEDED** | Replaced by newer design |

---

## Recent Shipping Sprint (Builds 624-666)

*43 builds shipped December 27-31, 2025*

### Hyperedge Modal Redesign (Build 666)
| Build | Feature | Status |
|-------|---------|--------|
| 666 | **Hyperedge Modal Redesign** - Centered floating modal with solid background, full text display (no truncation), delete hyperedge function with confirmation, improved visual design | **SHIPPED** |

### TB Structured Tool Use Phase 2 (Build 665)
| Build | Feature | Status |
|-------|---------|--------|
| 665 | **TB Structured Tool Use Phase 2** - Multi-step tree building with feedback loop, session state machine, continue/complete buttons, auto-continue option, progress tracking, AI context injection | **SHIPPED** |

### Atlas Phase 1.1 (Build 664)
| Build | Feature | Status |
|-------|---------|--------|
| 664 | **Atlas Phase 1.1 - Tree Browser UI** - Tree Switcher dropdown, Browse Trees modal, cross-tree search, Ctrl+Shift+T shortcut | **SHIPPED** |

### Tree View & Canvas Fixes (Builds 659-663)
| Build | Feature | Status |
|-------|---------|--------|
| 663 | **LocalStorage Normalization Fix** - Trees loaded from cache now properly normalized | **SHIPPED** |
| 662 | **normalizeTreeStructure Fix** - Used 'subItems' not 'subtasks', removed depth limit | **SHIPPED** |
| 661 | **Canvas Recursion Fix** - Added `items` check, was rendering only 19 nodes | **SHIPPED** |
| 660 | **Tree View CSS Fix** - align-items: flex-start fixes off-screen rendering | **SHIPPED** |
| 659 | **Focus Mode for Branches** - enterFocusMode(nodeId) isolates subtree in Canvas | **SHIPPED** |

### TB Architecture Evolution (Builds 649-658)
| Build | Feature | Status |
|-------|---------|--------|
| 658 | **TB Structured Tool Use Phase 1** - Action mode triggers, tiered tools, multi-param handling, telemetry | **SHIPPED** |
| 657 | TB Batch Add + Fallback Parsing | **SHIPPED** |
| 656 | build_tree_from_topic Command | **SHIPPED** |
| 655 | TB Tree Building Recipe - Semantic Onion Model | **SHIPPED** |
| 654 | Branding Update - "The Shape of Information" | **SHIPPED** |
| 653 | Multi-word Command Params Fix | **SHIPPED** |
| 652 | Complete Tree Building Fix | **SHIPPED** |
| 651 | Generic Pattern Tree Building Fix | **SHIPPED** |
| 650 | Confidence-Based Intent Verification | **SHIPPED** |
| 649 | TB Command Routing Fix | **SHIPPED** |

### Hyperedge & TTS (Builds 642-648)
| Build | Feature | Status |
|-------|---------|--------|
| 648 | Auto-Update Hyperedges + AI Suggest Fix | **SHIPPED** |
| 647 | Mic Check + Hyperedge Commands + TB Screen Awareness | **SHIPPED** |
| 646 | iOS Voice Recording Fix | **SHIPPED** |
| 645 | Smart Voice Selection (TTS quality) | **SHIPPED** |
| 644 | Hyperedge Narrate Button | **SHIPPED** |
| 643 | TTS Wake Lock | **SHIPPED** |
| 642 | AI Narrative TTS for Hyperedges | **SHIPPED** |

### PWA & Mobile (Builds 632-641)
| Build | Feature | Status |
|-------|---------|--------|
| 641 | PWA paste banner | **SHIPPED** |
| 640 | Paste Share Link button for iOS | **SHIPPED** |
| 639 | PWA clipboard share detection | **SHIPPED** |
| 638 | Open in App banner for shared URLs | **SHIPPED** |
| 637 | Prevent pull-to-refresh on mobile | **SHIPPED** |
| 636 | Hyperedge narrative TTS loop | **SHIPPED** |
| 635 | P1 Mobile UX fixes | **SHIPPED** |
| 634 | Fix iOS auto-zoom | **SHIPPED** |
| 633 | Web keyboard fallback for mobile | **SHIPPED** |
| 632 | Mobile keyboard accessory bar | **SHIPPED** |

### UI Enhancements (Builds 625-631)
| Build | Feature | Status |
|-------|---------|--------|
| 631 | UI Theme Expansion - 10 new themes | **SHIPPED** |
| 630 | Treemap info panel on click | **SHIPPED** |
| 629 | Fix treemap layout | **SHIPPED** |
| 628 | Fix treemap toolbar truncation | **SHIPPED** |
| 627 | Treemap color palettes - 5 themes | **SHIPPED** |
| 626 | Merge duplicate Inbox buttons | **SHIPPED** |
| 625 | Header Update Check Button | **SHIPPED** |

---

## Tier 1: NOW (Next Sprint)

*Max 3 items. Each delivers standalone value.*

### 1. Gallery of Trees: Public Tree Discovery
**Status:** ✅ SHIPPED (Builds 696-700)
**File:** `2026-01-02-gallery-of-trees-design.md`
**Effort:** Medium (3-5 days for Phase 1)
**Value:** High - Solves cold start, enables cross-device testing

**Shipped (Builds 696-700):**
- **696**: Clone Banner - Visual "Cloned" indicator with provenance
- **697**: Atlas Provenance - Tracks source/version for cloned trees
- **698**: IndexedDB NodeIndex - Fast node lookup with 50ms target
- **699**: CloneAudit - Validation utilities for clone integrity
- **700**: SubmissionInbox - Firestore-backed gallery submissions with modal UI

**Firestore Integration:**
- Security rules deployed for `gallery_submissions` collection
- Composite indexes for submitterId+submittedAt queries
- Anonymous auth support for submissions

**Acceptance Tests:**
- [x] User can submit tree to gallery via modal
- [x] Submissions stored in Firestore with status tracking
- [x] User can view/withdraw their submissions
- [x] Cloned trees have provenance tracked in Atlas

**Dependencies:** Cloud Share (Build 425), Embed Mode (Build 610)
**Enables:** Community features, cross-device testing workflows

---

### 2. Mobile UX Phase 2: Safari Browser Optimization
**Status:** READY
**Decision:** Safari browser preferred (updated 2026-01-02) - better live recording performance than PWA
**Effort:** Medium (1 week)
**Value:** High - Mobile is primary use case for many users

**What:**
- Keyboard accessory bar refinements
- Better visible affordances for swipe gestures
- Performance optimization for large trees on mobile
- Safari-specific optimizations for voice capture
- Live recording quality improvements

**Note:** PWA approach deprecated - Safari browser provides better voice recording and playback performance.

**Acceptance Tests:**
- [ ] Swipe gestures discoverable without instruction
- [ ] Large trees (500+ nodes) scroll smoothly on mobile
- [ ] Voice capture works reliably in Safari

**Dependencies:** Gallery of Trees (SHIPPED Builds 696-700)
**Blocks:** Nothing

---

### 3. Capability Nodes Phase 2: Execution
**Status:** BLOCKED - Needs Phase 1 validation in real use
**File:** `2025-12-22-chrome-capability-nodes-design.md`
**Effort:** High (2 weeks)
**Value:** High - Enables authenticated web actions

**What (Phase 2):**
- Capability executor with permission enforcement
- Chrome extension action dispatch
- Result capture and tree update
- Audit logging

**Acceptance Tests:**
- [ ] Execute "Check Balance" capability on Chase.com
- [ ] Result appears in tree node
- [ ] Execution logged with timestamp

**Dependencies:** Capability Nodes Phase 1 (SHIPPED Build 615-617), Chrome Extension (SHIPPED Build 564)
**Blocks:** Teaching flow, Community registry

---

### 3. Atlas Phase 1.1: Cross-Tree Browser UI
**Status:** ✅ SHIPPED (Build 664)
**File:** `2025-12-25-atlas-cross-tree-intelligence-design.md`
**Effort:** Medium (3-5 days)
**Value:** Medium - Completes Atlas P1 UX

**Shipped (Build 664):**
- ✅ Tree Switcher dropdown in header (shows recent trees with 📍 current indicator)
- ✅ Browse Trees modal with two-panel layout (trees → nodes)
- ✅ Cross-tree search across all registered trees
- ✅ Ctrl+Shift+T keyboard shortcut
- ✅ CSS classes for cross-tree hyperedge indicators

**Previously Shipped (Build 623):**
- ✅ TreeRegistry: localStorage-persisted registry
- ✅ Cross-tree hyperedge references (`treeId:nodeGuid`)
- ✅ TreeBeard commands: `list_trees`, `search_trees`, `link_cross_tree`

**Acceptance Tests:**
- [x] Can browse nodes from other trees in modal
- [x] Cross-tree links show visual indicator
- [x] Tree switcher shows all known trees

**Dependencies:** Atlas Phase 1 (SHIPPED Build 623)
**Blocks:** Atlas Phase 2-4

---

## Tier 2: NEXT (Next 1-2 Months)

*Max 5 items. May require validation.*

### 4. Self-Tree Live Wiring
**Status:** FUTURE - Waiting on validation strategy
**File:** `self-trees/next-prompt.md`
**Effort:** Medium (1 week)
**Value:** Strategic - Auto-updating self-assessment

**What:**
- `[MEASURED]` tags in self-tree update from actual test runs
- MCP bridge receives test results
- Tree nodes auto-update with evidence

**Acceptance Tests:**
- [ ] `npm run test:unit` results appear in self-tree
- [ ] Lighthouse scores update automatically
- [ ] Stale measurements flagged

**Dependencies:** Sub-Agent Result Integration (SHIPPED Build 622)
**Blocks:** Shadow Tree concept

---

### 5. TB Structured Tool Use Phase 2: Multi-Step Execution
**Status:** ✅ SHIPPED (Build 665)
**File:** `2025-12-29-tb-structured-tool-use-design.md`
**Effort:** Medium (1 week)
**Value:** High - Better tree building UX

**Shipped (Build 665):**
- ✅ Tree building session state machine (building/reviewing/paused/complete)
- ✅ Feedback loop after batch adds with "Continue Layer N" buttons
- ✅ Auto-continue option for fully automatic tree building
- ✅ Progress tracking: layer count, node count, elapsed time
- ✅ AI context injection for active sessions
- ✅ New commands: start_tree_building, continue_tree_building, complete_tree_building, toggle_auto_continue

**Previously Shipped (Build 658):**
- ✅ Tier 0/1 tool tiering with dynamic loading
- ✅ Multi-param handling for rename, move, etc.
- ✅ Action mode triggers ("go", "build it")
- ✅ Telemetry tracking

**Acceptance Tests:**
- [x] Multi-step tree building works without user re-prompting
- [x] TB can build 10+ node tree in single flow
- [x] Progress shown during build

**Dependencies:** TB Structured Tool Use Phase 1 (SHIPPED Build 658)
**Blocks:** More complex tree building workflows

---

### 6. Canvas GoJS Migration
**Status:** STALE - Needs architecture re-audit
**File:** `2025-12-17-canvas-gojs-enhancements-design.md`
**Effort:** High (2+ weeks)
**Value:** Medium - Better canvas performance

**What:**
- Replace custom canvas with GoJS library
- Improved layout algorithms
- Better touch/mobile support

**Note:** Design doc line numbers are ~300 builds out of date. Full re-audit required.

**Dependencies:** None
**Blocks:** Nothing critical

---

### 7. Email Workflow Improvements Phase 2
**Status:** READY
**File:** `2025-12-22-email-workflow-improvements-design.md`
**Effort:** Medium (1 week)
**Value:** Medium - Better Gmail integration

**What:**
- TreeBeard batch commands for Gmail
- Auto-categorization of email threads
- Quick reply templates

**Already Shipped:**
- ✅ Archive/Trash/Star/Mark Read buttons (Build 550-551)
- ✅ Label management UI (Build 618)
- ✅ Draft auto-save

**Acceptance Tests:**
- [ ] "Archive all read emails" works via TB
- [ ] Email threads auto-categorized by topic

**Dependencies:** Gmail Actions UI (SHIPPED)
**Blocks:** Nothing

---

## Tier 3: LATER (Backlog)

*Parking lot. Not prioritized.*

### Strategic Features

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Atlas Phase 2-4 | `2025-12-25-atlas-cross-tree-intelligence-design.md` | BLOCKED | Needs Phase 1.1 |
| Capability Teaching Flow | Part of capability nodes | FUTURE | After execution works |
| Capability Community Registry | Part of capability nodes | FUTURE | After teaching works |
| Shadow Tree (Telemetry) | `self-trees/next-prompt.md` | FUTURE | v1.6+ aspiration |

### Enhancements

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Pivot Hyperedges | `2025-12-06-pivot-hyperedges-design.md` | **STALE** | Target Build 361, 297 builds behind |
| RAG Deep Integration | `2025-12-20-treelisty-rag-design.md` | PARTIAL | Document import works |

### Maintenance

| Item | Notes |
|------|-------|
| Self-Tree v1.5 | Needs update for Build 658 capabilities |
| Test Coverage | 469 tests passing |
| Performance Profiling | Lighthouse improvements |

---

## Shipped Reference (December 2025 - January 2026)

### Builds 696-700 - Gallery of Trees (January 2026)
- **700**: SubmissionInbox - Firestore-backed gallery submissions with modal UI, withdraw/status tracking
- **699**: CloneAudit - Validation utilities (translateMap, hyperedge integrity, content hash, duplicates)
- **698**: IndexedDB NodeIndex - Fast node lookup with 50ms target, background indexing
- **697**: Atlas Provenance - Tracks sourceTreeId, sourceVersion, clonedAt for cloned trees
- **696**: Clone Banner - Visual "Cloned from X" indicator with link to source

### Build 665 - TB Structured Tool Use Phase 2
- Tree building session state machine (building/reviewing/paused/complete)
- Feedback loop after batch adds with "Continue Layer N" buttons
- Auto-continue option for fully automatic tree building
- Progress tracking: layer count, node count, elapsed time
- AI context injection for active sessions
- New commands: `start_tree_building`, `continue_tree_building`, `complete_tree_building`, `toggle_auto_continue`, `show_building_progress`, `cancel_tree_building`

### Build 664 - Atlas Phase 1.1 Tree Browser UI
- Tree Switcher dropdown in header (shows recent trees with 📍 indicator)
- Browse Trees modal with two-panel layout (trees → nodes)
- Cross-tree search across all registered trees
- `Ctrl+Shift+T` keyboard shortcut
- CSS classes for cross-tree hyperedge indicators

### Builds 659-663 - Tree View & Canvas Fixes
- **663**: LocalStorage load path now calls `normalizeTreeStructure()`
- **662**: Fixed `normalizeTreeStructure` to use `subItems` (not `subtasks`), removed depth limit
- **661**: Canvas recursion now checks `items` array - fixed 19-node rendering bug
- **660**: Tree view CSS fix - `align-items: flex-start` prevents off-screen rendering
- **659**: Focus Mode for Branches - `enterFocusMode(nodeId)`, `focus_branch:{name}` command

### Build 658 - TB Structured Tool Use
- Action mode triggers ("go", "build it", "execute")
- Tier 0 tools (~25 always available)
- Tier 1 tools (context-triggered: Canvas, Gantt, Gmail, Atlas, Hyperedge, Image)
- Multi-param handling for rename_node, move_node, etc.
- Error suggestions and similar command hints
- Telemetry: `window.getToolUseTelemetry()`

### Builds 624-665 Summary
| Category | Builds | Key Features |
|----------|--------|--------------|
| TB Architecture | 649-658, 665 | Structured tool use P1+P2, multi-step tree building, feedback loop |
| Atlas | 664 | Tree Browser UI, cross-tree search, Ctrl+Shift+T |
| Tree View/Canvas | 659-663 | Focus mode, normalization, CSS fixes, expand toggles |
| TTS/Hyperedge | 642-648 | AI narrative, wake lock, voice selection, mic check |
| PWA/Mobile | 632-641 | Keyboard bar, iOS fixes, clipboard, paste banner |
| UI Polish | 625-631 | Treemap, themes, update button |

### Builds 610-623 (Previous Sprint)
| Build | Feature |
|-------|---------|
| 623 | Atlas Phase 1 - Cross-Tree References |
| 622 | Sub-Agent Phase 2 - Result Integration |
| 621 | Image Spatial Commands |
| 620 | Sub-Agent Architecture |
| 619 | Image Pattern Recognition |
| 618 | Gmail Label Management UI |
| 617 | Expanded Domain Categorization |
| 616 | Global Capabilities Registry |
| 615 | Chrome Capabilities Phase 1 |
| 614 | Work Status Panel |
| 613 | Tool-use API for TreeBeard |
| 612 | Fast-Path Expansion |
| 611 | Direct Help Loading |
| 610 | Help as Tree + Embed Mode |

---

## Dependency Graph (Updated Build 700)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SHIPPED (Build 610-700)                           │
├─────────────────────────────────────────────────────────────────────────┤
│ TB Structured P1+P2    │ Atlas P1 + P1.1 │ Capabilities P1 │ Sub-Agent  │
│ Image Analysis         │ Gmail UI        │ Mobile Safari   │ TTS        │
│ Tree Building Recipe   │ Themes          │ Treemap         │ Voice      │
│ Focus Mode Branches    │ Tree View Fixes │ Canvas Rendering│ Tree Browse│
│ Gallery of Trees       │ Clone + Audit   │ SubmissionInbox │ Firestore  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │ Mobile UX P2    │   │ Self-Tree Live  │   │ Capabilities    │
    │ Safari Optimize │   │ Wiring          │   │ Phase 2         │
    │ (READY)         │   │ (FUTURE)        │   │ (BLOCKED)       │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ Atlas Phase 2-4 │
                          │ (Future)        │
                          └─────────────────┘
```

---

## Quick Reference: What to Build Next

**If you have 2 hours:** Mobile Safari voice capture testing - verify live recording quality

**If you have 1 day:** Mobile UX swipe gesture refinements

**If you have 3 days:** Mobile UX Phase 2 - Safari optimization, performance tuning

**If you have 1 week:** Full Mobile UX Phase 2 + Gallery browser UI for end users

---

## Archived Plans (Do Not Re-implement)

| Feature | File | Reason |
|---------|------|--------|
| TreeListy OS Dashboard | `2025-12-21-treelisty-os-dashboard-design.md` | SUPERSEDED by Atlas |
| Reader Navigation | `2025-12-13-reader-navigation-design.md` | SHIPPED Build 507-508 |
| Quick Capture | `2025-12-18-quick-capture-design.md` | SHIPPED Build 504 |
| Treebeard Research Mode | `2025-12-17-treebeard-research-design.md` | SHIPPED Build 442 |
| Voice Capture | `2025-12-07-voice-capture-artifacts-design.md` | SHIPPED Build 511 |
| LifeTree Pattern | `2025-12-07-lifetree-pattern-design.md` | SHIPPED as pattern |
| TB Structured Tool Use P1 | `2025-12-29-tb-structured-tool-use-design.md` | SHIPPED Build 658 |
| TB Structured Tool Use P2 | `2025-12-29-tb-structured-tool-use-design.md` | SHIPPED Build 665 |
| Atlas Phase 1.1 | `2025-12-25-atlas-cross-tree-intelligence-design.md` | SHIPPED Build 664 |
| Gallery of Trees P1 | `2026-01-02-gallery-of-trees-design.md` | SHIPPED Builds 696-700 |

---

*Document created: 2025-12-27*
*Major update: 2025-12-30 (Builds 624-665 shipped, TB Structured Tool Use Phase 2 complete)*
*Major update: 2026-01-02 (Gallery of Trees SHIPPED Builds 696-700, Mobile strategy: Safari browser)*
*Next review: 2026-01-10*
