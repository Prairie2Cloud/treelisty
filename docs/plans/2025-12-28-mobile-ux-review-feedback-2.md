# Mobile UX Plan Review Feedback #2

**Date:** 2025-12-28
**Reviewer:** External AI (ChatGPT/GPT-4)
**Status:** Feedback Received

---

## Executive Summary

1. **Critical Risk:** Gesture vocabulary too complex and invisible. 8+ hidden gestures will alienate 80% of users.
2. **Missed Opportunity:** Live Activities (iOS 17) for voice recording - current gold standard for background capture.
3. **Technical Gap:** Real-time on-device speaker diarization causes battery drain + thermal throttling on long recordings.
4. **Verdict:** Strong visual redesign, but needs to simplify interaction models. Visible affordances (buttons) for Phase 1, power-user gestures in Phase 3/4.

---

## Strengths Validated

- **Focus + Context Model:** Correct pattern for deep hierarchies (Workflowy proved this)
- **Sheet-Based Detail Views:** Resolves "loss of context" effectively
- **Voice-First Ambition:** <500ms capture goal is correct (otherwise users use Apple Voice Memos)

---

## Critical Concerns

### A. The "Invisible Interface" Trap

**Problem:** Gesture for everything - two-finger tap, pinch, double-tap, swipe-left/right, shake

**Why it fails:**
- "Pinch in/out" on scrollable list conflicts with iOS scroll/bounce physics
- Users do not "guess" two-finger taps
- Motor-impaired users cannot execute multi-touch reliably

**Recommendations:**
- **Kill multi-touch gestures** - Replace "Pinch to collapse" with visible `[-]` toggle
- **Make Focus explicit** - Add `>` or `Focus` icon on row, double-tap as shortcut only

### B. Voice Capture Latency vs Reality

**Problem:** <500ms target unrealistic with cold app launch (1-2s) + audio session init

**Recommendations:**
- **Adopt Live Activities (iOS 17+):** Start recording from Lock Screen widget without full UI load
- **Optimistic UI:** Show "Listening" state instantly, buffer first 0.5s while engine spins up

### C. Debate Diarization Feasibility

**Problem:** On-device speaker diarization is computationally expensive. Live processing during 45-min debate will drain battery and cause thermal throttling.

**Recommendation:**
- **Post-Process Only:** Record raw audio first. Process diarization when plugged in or explicitly triggered, not live.

---

## Competitive Insights

| Feature | App | Steal This |
|---------|-----|------------|
| **Bullet Handle** | Workflowy | Visible bullet as tap target. Tap bullet = menu, tap text = edit. Don't rely on long-press. |
| **The Rail** | Superhuman | Quick-action bar above keyboard (Indent, Outdent, AI). Don't hide behind swipes. |
| **Widget Capture** | Things 3 | Lock screen widget creates task without opening full app. Quick Capture as separate app target. |

---

## Missing Innovation: Keyboard Accessory View

**The biggest missed opportunity.**

When editing a tree, standard iOS keyboard is useless for structure. Need custom "Tree Accessory Bar":

```
┌─────────────────────────────────────────────┐
│  [ < ]   [ > ]   [ ^ ]   [ v ]   [ AI ]    │
│ Outdent  Indent  Move↑  Move↓  TreeBeard   │
└─────────────────────────────────────────────┘
              ┌───────────────┐
              │   KEYBOARD    │
              └───────────────┘
```

This solves "no gesture vocabulary" without forcing users to learn swipes.

---

## Revised Priority Recommendations

### Phase 1 Changes

**PROMOTE:**
- Visible Indent/Outdent Buttons (don't rely on swipes)
- Focus Mode Navigation (prerequisite for deeper trees)
- Keyboard Accessory View with structure controls

**DEMOTE:**
- Voice Capture Sheet → Focus on text capture first, voice adds too much complexity

### Phase 2 Changes

**SPLIT:**
- "Quick Voice Note" (easy) - ship first
- "Debate Diarization" (hard) - ship later, post-process only

---

## Questions for Team

1. **Offline AI:** 10-minute debate offline = 100MB WAV file. Do we have robust sync manager for large uploads?
2. **Breadcrumb Width:** iPhone Mini fits ~2 breadcrumbs. How does "Root > ... > ... > Node" look? Consider "Back Stack" dropdown instead.
3. **Undo System:** How does shake-to-undo interact with system undo? Conflict potential.

---

*Feedback received: 2025-12-28*
