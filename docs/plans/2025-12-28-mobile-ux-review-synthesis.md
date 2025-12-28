# Mobile UX Review Synthesis

**Date:** 2025-12-28
**Reviews:** 2 external AI reviews (Gemini + ChatGPT)
**Status:** Synthesis Complete - Decisions Required

---

## Consensus: What Both Reviews Agree On

| Point | Reviewer 1 | Reviewer 2 | Verdict |
|-------|------------|------------|---------|
| Focus Mode is correct | ✅ "Right mental model" | ✅ "Workflowy proved this" | **KEEP** |
| Bottom sheets work | ✅ "Straight win" | ✅ "Resolves context loss" | **KEEP** |
| Gesture vocabulary too complex | ✅ "Non-discoverable, hostile" | ✅ "Invisible interface trap" | **REVISE** |
| Voice latency promises unrealistic | ✅ "Fragile in real world" | ✅ "Cold launch 1-2s" | **REVISE** |
| Need visible affordances | ✅ "Provide non-gesture alternatives" | ✅ "Buttons over swipes" | **ADD** |
| Diarization is hard | ✅ "Optional + editable" | ✅ "Post-process only" | **DEFER** |

---

## Divergence: Where Reviews Differ

| Topic | Reviewer 1 | Reviewer 2 | Resolution |
|-------|------------|------------|------------|
| Platform decision | **BLOCKER** - must decide PWA vs Native first | Not mentioned | **Reviewer 1 is right** - this blocks everything |
| Voice in Phase 1 | Include minimal voice→outline | Demote voice, focus on text first | **Compromise**: Include voice capture, defer AI structuring |
| Keyboard accessory | Not mentioned | **Key innovation** - tree controls above keyboard | **Reviewer 2 is right** - must add |
| Live Activities | Not mentioned | **Missed opportunity** for iOS 17+ | **Reviewer 2 is right** - add to roadmap |

---

## Consolidated Action Plan

### BLOCKER: Platform Decision (Week 0)

Before anything else, decide:

| Track | Pros | Cons |
|-------|------|------|
| **PWA/Mobile Web** | Faster, single codebase, current architecture | Limited iOS APIs (no Live Activities, weaker offline) |
| **Native iOS** | Full iOS features, better performance | Major rewrite, separate codebase |
| **Hybrid (Capacitor)** | Best of both, progressive | Complexity, some API limitations |

**Recommendation:** Start with PWA improvements to validate core UX, plan Native as v2.

---

### Phase 1 Revisions (MUST HAVE)

#### Remove from Phase 1:
- ❌ Two-finger tap gestures
- ❌ Pinch to collapse/expand
- ❌ Shake to undo
- ❌ Live diarization
- ❌ AI structuring (defer to Phase 2)

#### Add to Phase 1:
- ✅ **Keyboard Accessory Bar:** `[<] [>] [^] [v] [AI]` above keyboard
- ✅ **Visible collapse toggles:** `[-]` / `[+]` buttons on parent nodes
- ✅ **Explicit Focus button:** Icon on node row, not just double-tap
- ✅ **Job queue UI:** Visible status for offline operations
- ✅ **In-tree search:** Jump to node with breadcrumb preview

#### Keep in Phase 1:
- ✅ Focus Mode navigation
- ✅ Breadcrumb bar
- ✅ Bottom sheet details
- ✅ Quick Capture to Inbox
- ✅ Voice recording (capture only, no AI processing)
- ✅ Swipe indent/outdent (as accelerator, with visible button alternative)

---

### Phase 2 Revisions

#### Split Voice Features:
1. **Quick Voice Note** (simpler, ship first)
   - Record → Transcribe → Save as memo
   - No diarization, no structuring

2. **Debate Capture** (harder, ship later)
   - Post-process diarization (not live)
   - AI structuring as explicit action
   - "Processing" state when plugged in

#### Add:
- Live Activities for background recording (iOS 17+)
- Optimistic UI for voice (show listening before engine ready)

---

### Gesture Simplification

**Before (8+ invisible gestures):**
```
double-tap, two-finger-tap, long-press, swipe-left,
swipe-right, pinch-in, pinch-out, shake
```

**After (3 discoverable gestures + visible controls):**
```
Gestures (optional accelerators):
- Long-press: Drag reorder (standard iOS)
- Swipe-right: Indent (with visible [>] button alternative)
- Swipe-left: Outdent (with visible [<] button alternative)

Visible Controls (primary):
- Keyboard bar: [<] [>] [^] [v] [AI]
- Node row: [+/-] collapse, [>] focus, [•] menu
- Action bar: [Add] [Edit] [More]
```

---

### The New Sacred Triangle

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              FOCUS MODE                         │
│         (Navigate deep trees)                   │
│               ▲                                 │
│              /|\                                │
│             / | \                               │
│            /  |  \                              │
│           /   |   \                             │
│          ▼    ▼    ▼                            │
│   KEYBOARD   INBOX    VISIBLE                   │
│   ACCESSORY  (capture  AFFORDANCES              │
│   BAR        now,      (buttons > gestures)     │
│              process                            │
│              later)                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Decisions Required

### Critical (This Week)

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| 1 | Platform strategy | PWA / Native / Hybrid | Entire roadmap |
| 2 | Keyboard accessory bar | Yes / No | Core editing UX |
| 3 | Kill multi-touch gestures | Yes / Keep some | Complexity, accessibility |

### High (Before Phase 1 Start)

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| 4 | Live Activities (iOS 17+) | Include / Defer | Voice capture UX |
| 5 | Diarization timing | Live / Post-process / Cut | Technical scope |
| 6 | Breadcrumb on small screens | Horizontal scroll / Dropdown / Hybrid | Navigation UX |

---

## Updated Effort Estimates

| Phase | Original | Revised | Change |
|-------|----------|---------|--------|
| Phase 0 (Platform) | - | 1-2 weeks | **NEW** |
| Phase 1 (Foundation) | 4-6 weeks | 5-7 weeks | +1 week (keyboard bar, visible controls) |
| Phase 2 (Voice) | 3-4 weeks | 4-5 weeks | +1 week (split simple/complex) |
| Phase 3 (AI) | 2-3 weeks | 2-3 weeks | Same |
| Phase 4 (Views) | 3-4 weeks | 3-4 weeks | Same |
| Phase 5 (Polish) | 2-3 weeks | 2-3 weeks | Same |
| **Total** | 14-20 weeks | 17-24 weeks | +3-4 weeks |

---

## Pre-Mortem: Updated Failure Modes

1. **"Invisible Interface"** - Users never discover gestures, think app is broken
2. **"Voice Promise Broken"** - <500ms fails, users switch to Voice Memos
3. **"Platform Limbo"** - Can't decide PWA vs Native, ship nothing
4. **"Diarization Death March"** - Live processing drains battery, gets 1-star reviews

---

## Next Steps

1. [ ] **Schedule platform decision meeting** (this week)
2. [ ] **Prototype keyboard accessory bar** (validate UX lift)
3. [ ] **Audit gesture collisions** with iOS system gestures
4. [ ] **Test voice latency** on real devices (cold launch → recording)
5. [ ] **Update plan document** with revised Phase 1 scope

---

*Synthesis created: 2025-12-28*
*Based on: 2 external AI reviews*
*Next: Platform decision → Revised plan → Implementation*
