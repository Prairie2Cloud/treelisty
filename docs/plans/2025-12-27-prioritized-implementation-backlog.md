# TreeListy Prioritized Implementation Backlog

**Date:** 2025-12-28
**Current Build:** 623
**Status:** Living Document
**Last Updated:** 2025-12-28 (Build 623 shipped)

---

## Executive Summary

This document synthesizes all pending design documents and plans into a prioritized implementation roadmap. Items are organized by:
1. **Dependencies** - What blocks what
2. **User Value** - Direct UX impact
3. **Effort Level** - Implementation complexity
4. **Strategic Alignment** - Platform vision fit

**Principle:** Ship incrementally. Each build should deliver standalone value.

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

## Recent Shipping Sprint (Builds 610-623)

*Massive progress from December 27-28, 2025*

| Build | Feature | Status |
|-------|---------|--------|
| 623 | Atlas Phase 1 - Cross-Tree References | **SHIPPED** |
| 622 | Sub-Agent Phase 2 - Result Integration | **SHIPPED** |
| 621 | Image Spatial Commands - nearby/region/containing | **SHIPPED** |
| 620 | Sub-Agent Architecture - Trigger detection and dispatch | **SHIPPED** |
| 619 | Image Pattern Recognition - Gemini detects content type | **SHIPPED** |
| 618 | Gmail Label Management UI | **SHIPPED** |
| 617 | Expanded Domain Categorization for Capabilities | **SHIPPED** |
| 616 | Global Capabilities Registry | **SHIPPED** |
| 615 | Chrome Capabilities Phase 1 - Read-Only MVP | **SHIPPED** |
| 614 | Work Status Panel - Dashboard for background work | **SHIPPED** |
| 613 | Tool-use API for TreeBeard | **SHIPPED** |
| 612 | Fast-Path Expansion - More Deterministic Commands | **SHIPPED** |
| 611 | Direct Help Loading - Simplified UX | **SHIPPED** |
| 610 | Help as Tree + Embed Mode | **SHIPPED** |

**Validation Complete:**
- Atlas Phase-0: All 5 identity stability tests passing

---

## Tier 1: NOW (Next 1-2 Weeks)

*Max 3 items. Each delivers standalone value.*

### 1. ~~Atlas Phase 1: Cross-Tree References~~ → SHIPPED
**Status:** SHIPPED (Build 623)
**File:** `2025-12-25-atlas-cross-tree-intelligence-design.md`

**Implemented:**
- ✅ TreeRegistry: localStorage-persisted registry of known trees
- ✅ Hyperedge nodeIds support `treeId:nodeGuid` cross-tree references
- ✅ Cross-tree link resolution via `resolveHyperedgeNodeRef()`
- ✅ Hyperedge display shows 🌐 cross-tree indicator
- ✅ TreeBeard commands: `list_trees`, `search_trees`, `link_cross_tree`, `tree_info`
- ✅ Trees auto-registered on load

**Acceptance Tests:**
- [x] Phase-0: nodeGuid stable across move/export/import (VALIDATED)
- [x] Can create hyperedge pointing to node in different tree
- [x] Cross-tree links resolve when target tree is loaded
- [x] Broken links show graceful error state

**Remaining for Phase 1.1:**
- [ ] UI modal for browsing/selecting nodes from other trees

**Dependencies:** Atlas Phase-0 (VALIDATED)
**Blocks:** Phase 2-4 (cross-tree search, merge, sync)

---

### 2. ~~Image Analysis Spatial Commands~~ → SHIPPED
**Status:** SHIPPED (Build 621)
**File:** `2025-12-24-image-analysis-pattern-design.md`

**Implemented:**
- ✅ `nearby [threshold]` - returns spatially proximate nodes by bbox distance
- ✅ `region [quadrant]` - lists objects in image quadrant (top-left, center, bottom-right, etc.)
- ✅ `containing` - finds parent objects that contain focused node by bbox
- ✅ Helper functions: `_bbox_distance`, `_bbox_contains`, `_bbox_in_region`
- ✅ Aliases: `near`, `objects_near`, `in_region`, `quadrant`, `contains`, `parent_objects`

**Acceptance Tests:**
- [x] `nearby 0.15` returns nodes within distance threshold
- [x] `region top-left` lists objects in that quadrant
- [x] Spatial commands only available for image-analyzed trees

---

### 3. ~~Gmail Bidirectional Actions UI~~ → SHIPPED
**Status:** SHIPPED (Build 550-551, enhanced Build 618)
**File:** `2025-12-22-gmail-bidirectional-sync-design.md`

**Already implemented:**
- ✅ Archive/Trash/Star/Mark Read buttons in info panel
- ✅ Label management UI (Build 618)
- ✅ Quick Reply box with Expand to compose modal
- ✅ Draft auto-save

**Next unshipped item:** TreeBeard batch commands for Gmail (Phase 3)

---

## Tier 2: NEXT (Next 1-2 Months)

*Max 5 items. May require validation.*

### 4. Capability Nodes Phase 2: Execution
**Status:** BLOCKED - Needs Phase 1 validation
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

**Dependencies:** Capability Nodes Phase 1 (SHIPPED Build 615-617)
**Blocks:** Teaching flow, Community registry

---

### 5. ~~Sub-Agent Phase 2: Result Integration~~ → SHIPPED
**Status:** SHIPPED (Build 622)
**File:** `2025-12-22-sub-agent-architecture-design.md`

**Implemented:**
- ✅ Sub-agent results injected into TreeBeard system prompt
- ✅ Collapsible insight UI shows sub-agent findings
- ✅ Validation results update tree node `_validation` field
- ✅ Auto-retry for failed validations (max 1 retry)

**Acceptance Tests:**
- [x] Domain researcher results appear in TB response
- [x] Validator results update tree confidence
- [x] User can expand/collapse sub-agent insights

---

### 6. Self-Tree Live Wiring
**Status:** FUTURE - Waiting on sub-agent foundation
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

**Dependencies:** Sub-Agent Result Integration
**Blocks:** Shadow Tree concept

---

### 7. Canvas GoJS Migration (Re-audit Required)
**Status:** STALE - Needs architecture review
**File:** `2025-12-17-canvas-gojs-enhancements-design.md`
**Effort:** High (2+ weeks)
**Value:** Medium - Better canvas performance and features

**What:**
- Replace custom canvas with GoJS library
- Improved layout algorithms
- Better touch/mobile support
- Animation and transition polish

**Note:** Line numbers in design doc are ~300 builds out of date. Full re-audit required before implementation.

**Dependencies:** None
**Blocks:** Nothing critical

---

## Tier 3: LATER (Backlog)

*Parking lot. Not prioritized.*

### Strategic Features

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Atlas Phase 2-4 | `2025-12-25-atlas-cross-tree-intelligence-design.md` | BLOCKED | Needs Phase 1 |
| Capability Teaching Flow | Part of capability nodes | FUTURE | After execution works |
| Capability Community Registry | Part of capability nodes | FUTURE | After teaching works |
| Shadow Tree (Telemetry) | `self-trees/next-prompt.md` | FUTURE | v1.6+ aspiration |

### Enhancements

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Mobile Single-Pane Polish | `2025-12-18-mobile-single-pane-architecture.md` | PARTIAL | Core shipped, refinement needed |
| Pivot Hyperedges | `2025-12-06-pivot-hyperedges-design.md` | **STALE** | Target Build 361, 260 builds behind |
| RAG Deep Integration | `2025-12-20-treelisty-rag-design.md` | PARTIAL | Document import works |

### Maintenance

| Item | Notes |
|------|-------|
| Self-Tree v1.4 | Trust + Cognitive lens analysis |
| Test Coverage | Maintain 400+ tests passing |
| Performance Profiling | Lighthouse improvements |

---

## Shipped Reference (December 2025)

| Build | Feature | File |
|-------|---------|------|
| 622 | Sub-Agent Phase 2 | `2025-12-22-sub-agent-architecture-design.md` |
| 621 | Image Spatial Commands | `2025-12-24-image-analysis-pattern-design.md` |
| 620 | Sub-Agent Architecture | `2025-12-22-sub-agent-architecture-design.md` |
| 619 | Image Pattern Recognition | `2025-12-24-image-analysis-pattern-design.md` |
| 618 | Gmail Label Management UI | `2025-12-22-gmail-bidirectional-sync-design.md` |
| 617 | Expanded Domain Categorization | `2025-12-22-chrome-capability-nodes-design.md` |
| 616 | Global Capabilities Registry | `2025-12-22-chrome-capability-nodes-design.md` |
| 615 | Chrome Capabilities Phase 1 | `2025-12-22-chrome-capability-nodes-design.md` |
| 614 | Work Status Panel | `2025-12-21-work-status-panel-design.md` |
| 613 | Tool-use API for TreeBeard | `2025-12-26-tb-architecture-review.md` |
| 612 | Fast-Path Expansion | `2025-12-26-tb-architecture-review.md` |
| 611 | Direct Help Loading | `2025-12-27-help-as-tree-embed-mode-design.md` |
| 610 | Help as Tree + Embed Mode | `2025-12-27-help-as-tree-embed-mode-design.md` |
| 609 | Smart JSON Normalization | (inline) |
| 574 | treeId/nodeGuid Identity | `2025-12-25-atlas-cross-tree-intelligence-design.md` |
| 572 | BBox Clear on Import | (inline) |
| 571 | Model Selector for Image Analysis | (inline) |
| 570 | Gemini 2.5 Flash Integration | (inline) |
| 565 | Image Analysis to Tree | `2025-12-24-bbox-repurposing-design.md` |
| 564 | Chrome Extension Screen Awareness | `2025-12-23-chrome-screen-awareness-design.md` |
| 541 | Keyboard Shortcut Panel | (inline) |

---

## Dependency Graph (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│                    SHIPPED (Build 610-620)                   │
├─────────────────────────────────────────────────────────────┤
│ Help as Tree │ TB Fast-Path │ Work Status │ Capabilities P1 │
│ Sub-Agent P1 │ Image Pattern│ Gmail Labels│ Atlas Phase-0   │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Atlas Phase 1   │  │ Image Spatial   │  │ Gmail Actions   │
│ Cross-Tree Refs │  │ Commands        │  │ UI              │
│ (Build 621+)    │  │ (Build 622)     │  │ (Build 623)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐  ┌─────────────────┐
│ Capabilities    │  │ Sub-Agent P2    │
│ Phase 2         │  │ Result Inject   │
│ Execution       │  │                 │
└─────────────────┘  └─────────────────┘
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

**If you have 2 hours:** Image Spatial Commands (add `nearby` command)

**If you have 1 day:** Gmail Actions UI (context menu integration)

**If you have 3 days:** Atlas Phase 1 cross-tree references

**If you have 1 week:** All Tier 1 items

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

---

*Document created: 2025-12-27*
*Major update: 2025-12-27 (Builds 610-620 shipped)*
*Next review: 2025-01-03*
