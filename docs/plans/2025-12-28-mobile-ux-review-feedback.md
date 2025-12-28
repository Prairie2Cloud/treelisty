# Mobile UX Plan Review Feedback

**Date:** 2025-12-28
**Reviewer:** External AI (Gemini/GPT-4)
**Status:** Feedback Received - Action Required

---

## Executive Summary

1. **Platform strategy mismatch is CRITICAL** - Plan assumes native iOS rewrite but TreeListy is a single-file web app. Must decide: PWA vs Native first.
2. **Gesture collisions** - Edge-swipe back vs swipe-right indent will confuse users. Need visible affordances, not mystery gestures.
3. **Voice latency promises unrealistic** - "<500ms to recording" fragile with permissions/network. Treat as async stages.
4. **Roadmap almost right** - But MVP should validate voice→tree early, not after month of gesture work.
5. **Focus Mode + Inbox + record-now-structure-async = sacred triangle**

---

## Strengths Validated

- Focus Mode + breadcrumbs: Correct mental model for deep trees
- Bottom sheet with detents: Straight win, matches iOS patterns
- AI sliding panel: "AI is a tool, not a room" approach
- Inbox/memo-to-tree: Strong productivity primitive
- Accessibility not an afterthought: Rare and good

---

## Critical Concerns

### 1. Platform Strategy Mismatch (CRITICAL)

**Problem:** Technical section proposes native stacks (SQLite/Realm, CloudKit CRDT) but TreeListy is a single-file web app.

**Decision Required:**
- **Track A:** Mobile web/PWA upgrade within single-file constraint
- **Track B:** Native iOS client (roadmap becomes rewrite plan)

**Effort:** 1-2 weeks decision + spike; months if native rewrite

### 2. Gesture Collisions (CRITICAL)

**Problems:**
- "Edge swipe right: Back" collides with "swipe right on node: Indent"
- Two-finger tap, pinch-collapse, shake-to-undo are non-discoverable
- Some gestures are accessibility-hostile

**Recommendations:**
- Reserve edge swipe exclusively for navigation (system expectation)
- Make indent/outdent via visible handles/buttons + contextual action bar
- Keep swipes as optional accelerators only
- Add gesture coach (first-run + "?" overlay)
- Always provide non-gesture equivalents for VoiceOver

**Effort:** 2-4 weeks

### 3. Voice Latency Reality (HIGH)

**Problem:** "<500ms to recording" and "live transcription + diarization" fragile in real world.

**Recommendations:**
- Treat recording as instant local capture (waveform + timer + haptic immediately)
- Transcription/diarization as async stages with explicit states
- Make diarization optional + editable
- "Transcript Only" as first-class escape hatch

**Effort:** Medium-High

### 4. Deep Tree Reality (HIGH)

**Problem:** Design caps at depth ~5 (80pt indent max). Past that, readability collapses.

**Recommendations:**
- Auto-suggest Focus Mode after depth N
- Add level badges, background banding, or compact breadcrumb-in-row
- Don't rely solely on indentation

**Effort:** Medium

### 5. Large Tree Scaling (HIGH)

**Problem:** 500-1000+ nodes needs more than "virtualized list"

**Recommendations:**
- Add in-tree search + jump-to-node with breadcrumb preview (early)
- Add "Collapse to level..." and "Show siblings only" controls
- Not just pinch gestures

**Effort:** Medium

### 6. Offline Queue Trust (MEDIUM)

**Problem:** Users need certainty about pending operations.

**Recommendations:**
- Phase 1 must include visible job queue + per-item status + retry
- AI structuring needs clear recovery: Undo, Regenerate, Keep transcript

**Effort:** Medium

---

## Missing Elements

1. **Onboarding + habit loop:** First-run should drive: capture → see tree → edit node → save
2. **In-tree search:** Power users need "find in tree" + "jump to node"
3. **Editing ergonomics:** Long titles, keyboard toolbar, hardware keyboard (iPad)
4. **Permission UX:** Mic permissions at first capture are conversion cliff
5. **Privacy posture:** Voice recordings need "stored where/how long" messaging
6. **Collab conflict model:** Need read-only shared trees earlier

---

## Competitive Insights

| App | Pattern to Steal |
|-----|------------------|
| **Workflowy** | Focus/zoom into subtree + visible affordances (not mystery gestures) |
| **Otter** | Record feels inevitable/safe, process later, never lose audio, show progress |
| **Apple Notes** | Capture from anywhere (lock screen, share sheet, widget) - adoption multipliers |
| **Notion** | Contextual action bars reduce gesture dependence |

---

## Revised Priority Recommendations

### Phase 0 (NEW): Platform Decision (1-2 weeks)
- Decide: mobile web/PWA-first vs native-first
- Everything else depends on this

### Phase 1 (4-6 weeks): Validate Core Hypothesis
Keep gesture/breadcrumb/bottom-sheet foundations, ADD:
- Minimal voice capture → transcript → "Structure as Outline"
- Visible queue/status + retry for offline/AI jobs

### Phase 2: Voice Intelligence
- Diarization, debate mode, audio-to-node linking

### Phase 3: TreeBeard Panel
- "Apply with preview" (good as-is)

### Benchmark for "Good"
New user: locked phone → recording → usable tree → edit one node → return later → still there
**Under 60 seconds, no confusion about pending vs done**

### Pre-Mortem (Most Likely Failure)
Ship gorgeous gesture-heavy editor, but voice capture/transcription is flaky or slow. Users try twice, don't trust it, conclude "mobile TreeListy is a web toy."

---

## Questions Requiring Team Answers

| # | Question | Impact |
|---|----------|--------|
| 1 | Native iOS or mobile web/PWA for Phase 1? | Entire roadmap |
| 2 | Minimum supported iPhone + iOS version? | Performance baseline |
| 3 | Voice recording storage: local, Firebase, iCloud? Retention policy? | Privacy/architecture |
| 4 | Failure UX when diarization/structuring wrong? Undo/repair primitives? | User trust |
| 5 | Decision on gesture conflicts (edge swipe vs indent swipe)? | Core UX |
| 6 | Target node count for "feels instant"? 500? 2000? | Performance goals |
| 7 | Collab: last-write-wins or real conflict resolution day one? | Sync complexity |

---

## Action Items

### Immediate (This Week)
- [ ] **DECISION:** PWA track vs Native iOS track
- [ ] Resolve gesture collision: edge-swipe vs node-swipe
- [ ] Define visible affordances for indent/outdent (not gesture-only)

### Phase 1 Additions
- [ ] Add visible job queue UI for offline/AI operations
- [ ] Add in-tree search with jump-to-node
- [ ] Design mic permission moment (conversion-critical)
- [ ] Simplify voice flow: record → transcript → outline (skip diarization initially)

### Design Revisions
- [ ] Add gesture coach / onboarding overlay
- [ ] Add non-gesture alternatives for all power-user gestures
- [ ] Design deep tree handling beyond indent (badges, banding)
- [ ] Add "Collapse to level N" explicit control

---

## The Sacred Triangle

```
┌─────────────────────────────────────────────┐
│                                             │
│              FOCUS MODE                     │
│         (Navigate deep trees)               │
│                  ▲                          │
│                 / \                         │
│                /   \                        │
│               /     \                       │
│              /       \                      │
│             ▼         ▼                     │
│    INBOX              RECORD-NOW            │
│ (Capture first,       STRUCTURE-ASYNC       │
│  process later)       (Trust the queue)     │
│                                             │
└─────────────────────────────────────────────┘

Everything else is optional acceleration.
```

---

*Feedback received: 2025-12-28*
*Next step: Platform decision meeting*
