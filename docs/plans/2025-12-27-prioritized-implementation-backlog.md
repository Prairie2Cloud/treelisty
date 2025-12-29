# TreeListy Prioritized Implementation Backlog

**Date:** 2025-12-29
**Current Build:** 658
**Status:** Living Document
**Last Updated:** 2025-12-29 (Build 658 shipped - TB Structured Tool Use)

---

## Executive Summary

This document synthesizes all pending design documents and plans into a prioritized implementation roadmap. Items are organized by:
1. **Dependencies** - What blocks what
2. **User Value** - Direct UX impact
3. **Effort Level** - Implementation complexity
4. **Strategic Alignment** - Platform vision fit

**Principle:** Ship incrementally. Each build should deliver standalone value.

**Key Decisions:**
- **Mobile UX:** PWA (decided 2025-12-29)
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

## Recent Shipping Sprint (Builds 624-658)

*35 builds shipped December 27-29, 2025*

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

### 1. Mobile UX Phase 2: PWA Polish
**Status:** READY
**Decision:** PWA (not native) - confirmed 2025-12-29
**Effort:** Medium (1 week)
**Value:** High - Mobile is primary use case for many users

**What:**
- Keyboard accessory bar refinements
- Better visible affordances for swipe gestures
- Performance optimization for large trees on mobile
- PWA install prompt improvements

**Acceptance Tests:**
- [ ] Swipe gestures discoverable without instruction
- [ ] Large trees (500+ nodes) scroll smoothly on mobile
- [ ] PWA install prompt appears at optimal time

**Dependencies:** None (P1 shipped in Build 635)
**Blocks:** Nothing

---

### 2. Capability Nodes Phase 2: Execution
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
**Status:** READY
**File:** `2025-12-25-atlas-cross-tree-intelligence-design.md`
**Effort:** Medium (3-5 days)
**Value:** Medium - Completes Atlas P1 UX

**What:**
- UI modal for browsing/selecting nodes from other trees
- Tree switcher in sidebar
- Visual indicators for cross-tree links

**Already Shipped (Build 623):**
- ✅ TreeRegistry: localStorage-persisted registry
- ✅ Cross-tree hyperedge references (`treeId:nodeGuid`)
- ✅ TreeBeard commands: `list_trees`, `search_trees`, `link_cross_tree`

**Acceptance Tests:**
- [ ] Can browse nodes from other trees in modal
- [ ] Cross-tree links show visual indicator
- [ ] Tree switcher shows all known trees

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
**Status:** READY
**File:** `2025-12-29-tb-structured-tool-use-design.md`
**Effort:** Medium (1 week)
**Value:** High - Better tree building UX

**What:**
- Result feedback loop for chained operations
- "Continue building" flow after batch add
- Context preservation across tool calls
- Build progress visualization

**Already Shipped (Build 658):**
- ✅ Tier 0/1 tool tiering with dynamic loading
- ✅ Multi-param handling for rename, move, etc.
- ✅ Action mode triggers ("go", "build it")
- ✅ Telemetry tracking

**Acceptance Tests:**
- [ ] Multi-step tree building works without user re-prompting
- [ ] TB can build 10+ node tree in single flow
- [ ] Progress shown during build

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

## Shipped Reference (December 2025)

### Build 658 - TB Structured Tool Use
- Action mode triggers ("go", "build it", "execute")
- Tier 0 tools (~25 always available)
- Tier 1 tools (context-triggered: Canvas, Gantt, Gmail, Atlas, Hyperedge, Image)
- Multi-param handling for rename_node, move_node, etc.
- Error suggestions and similar command hints
- Telemetry: `window.getToolUseTelemetry()`

### Builds 624-657 Summary
| Category | Builds | Key Features |
|----------|--------|--------------|
| TB Architecture | 649-657 | Confidence verification, tree building, command routing |
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

## Dependency Graph (Updated Build 658)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SHIPPED (Build 610-658)                           │
├─────────────────────────────────────────────────────────────────────────┤
│ TB Structured Tool Use │ Atlas P1 │ Capabilities P1 │ Sub-Agent P2      │
│ Image Analysis         │ Gmail UI │ PWA Mobile      │ TTS/Hyperedge     │
│ Tree Building Recipe   │ Themes   │ Treemap         │ Voice             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │ Mobile UX P2    │   │ Atlas P1.1      │   │ Capabilities    │
    │ PWA Polish      │   │ Browser UI      │   │ Phase 2         │
    │ (READY)         │   │ (READY)         │   │ (BLOCKED)       │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ TB Structured   │
                          │ Tool Use P2     │
                          │ Multi-Step      │
                          └─────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ Self-Tree Live  │
                          │ Wiring          │
                          └─────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │ Atlas Phase 2-4 │
                          │ (Future)        │
                          └─────────────────┘
```

---

## Quick Reference: What to Build Next

**If you have 2 hours:** Mobile UX P2 - keyboard accessory refinements

**If you have 1 day:** Atlas P1.1 - cross-tree browser UI

**If you have 3 days:** Capabilities Phase 2 - execution framework

**If you have 1 week:** TB Structured Tool Use Phase 2 - multi-step execution

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

---

*Document created: 2025-12-27*
*Major update: 2025-12-29 (Builds 624-658 shipped, TB Structured Tool Use complete)*
*Next review: 2025-01-05*
