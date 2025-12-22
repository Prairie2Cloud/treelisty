# TreeListy Validation-First Improvement Plan

**Based on:** Self-Tree v1.0/v1.1 findings, corrected with evidence standards
**Created:** 2025-12-22
**Updated:** 2025-12-22 (converted from Implementation Plan to Validation Plan)

---

## Critical Warning: The Hallucination Incident

The original version of this plan was based on `[CODE-INFERRED]` claims treated as facts.

| Original Claim | Evidence Type | Actual Measurement |
|----------------|---------------|-------------------|
| "Tree view lags at 150+ nodes" | `[CODE-INFERRED]` | **1000 nodes: 9.37ms** (5.6x under budget) |
| "Performance is P0 (9 mentions)" | AI echo chamber | 9 AI mentions ≠ 9 user complaints |
| "PM persona needs Excel" | `[SPECULATED]` | No PM users interviewed |
| "5% feature discovery rate" | `[SPECULATED]` | Made-up number, no analytics |

**Lesson:** We almost spent weeks implementing virtual scrolling for a non-problem.

---

## New Approach: Validate Before Building

```
OLD: Self-tree → Priority list → Implement
NEW: Self-tree → Hypothesis list → Validate → Implement only if confirmed
```

---

## Phase 0: Gather External Signals (Before Anything Else)

Before validating hypotheses, gather real data:

| Signal | How to Get | Status |
|--------|-----------|--------|
| GitHub issues (last 90 days) | `gh issue list` | ❓ Not checked |
| User feedback (any channel) | Check Discord, email, Twitter | ❓ Not checked |
| Largest tree in production | Ask users or check cloud shares | ❓ Unknown |
| Lighthouse score | Run Lighthouse audit | ❓ Not measured |
| Error logs | Check Netlify function logs | ❓ Not checked |
| Any analytics | Check if any tracking exists | ❓ Likely none |

**If all signals are empty:** We have no external validation. All "user need" claims are speculative.

---

## Phase 1: Validate Performance Hypotheses

### Hypothesis 1.1: Canvas view lags with large trees
- **Evidence:** `[CODE-INFERRED]` from GoJS usage patterns
- **Validation cost:** 10 minutes
- **Validation method:** Create `test/performance/measure-canvas.py`, run with 50/200/500 nodes
- **Status:** ❓ UNVALIDATED
- **If validated:** Implement viewport culling
- **If disproven:** Remove from plan

### Hypothesis 1.2: 3D view lags with large trees
- **Evidence:** `[CODE-INFERRED]` from Three.js patterns
- **Validation cost:** 10 minutes
- **Validation method:** Create `test/performance/measure-3d.py`
- **Status:** ❓ UNVALIDATED

### Hypothesis 1.3: Initial page load is slow (1.3MB file)
- **Evidence:** `[CODE-OBSERVED]` - file size is factual
- **Validation cost:** 5 minutes
- **Validation method:** Lighthouse performance score
- **Status:** ❓ UNVALIDATED
- **Note:** Even if slow, may not matter if users tolerate it

### ~~Hypothesis 1.4: Tree view lags with large trees~~
- **Evidence:** `[CODE-INFERRED]`
- **Status:** ✅ DISPROVEN
- **Measurement:** 1000 nodes renders in 9.37ms
- **Action:** REMOVED from plan

---

## Phase 2: Validate Storage Hypotheses

### Hypothesis 2.1: Users hit 5MB localStorage limit
- **Evidence:** `[CODE-INFERRED]` from localStorage usage
- **Validation cost:** 30 minutes
- **Validation method:**
  - Check: What's the largest tree anyone has made?
  - Calculate: How many nodes fit in 5MB?
  - Ask: Has anyone complained about storage limits?
- **Status:** ❓ UNVALIDATED
- **If validated:** Implement IndexedDB migration
- **If disproven:** Remove from plan

### Hypothesis 2.2: Users want multi-tree management
- **Evidence:** `[SPECULATED]`
- **Validation cost:** 1 hour
- **Validation method:** Find 2-3 users, ask if they juggle multiple trees
- **Status:** ❓ UNVALIDATED

---

## Phase 3: Validate User Need Hypotheses

### Hypothesis 3.1: PM persona needs Excel export
- **Evidence:** `[SPECULATED]` - no PM users interviewed
- **Validation cost:** 1 hour
- **Validation method:** Find 1 PM user, ask what export formats they need
- **Status:** ❓ UNVALIDATED
- **Risk:** Building for imaginary users

### Hypothesis 3.2: Users can't find features (discoverability)
- **Evidence:** `[SPECULATED]` - "5%" is made up
- **Validation cost:** 30 minutes (add basic analytics)
- **Validation method:**
  - Add `console.log` tracking for feature usage
  - Deploy, wait 1 week, check logs
- **Status:** ❓ UNVALIDATED

### Hypothesis 3.3: Users want keyboard shortcut reference
- **Evidence:** `[SPECULATED]`
- **Validation cost:** 10 minutes
- **Validation method:** Check GitHub issues for shortcut requests
- **Status:** ❓ UNVALIDATED

### Hypothesis 3.4: New users need onboarding tour
- **Evidence:** `[SPECULATED]`
- **Validation cost:** 1 hour
- **Validation method:** Watch 1-2 new users try the app (screen share)
- **Status:** ❓ UNVALIDATED

---

## Phase 4: Already-Validated Items (Safe to Implement)

These are `[CODE-OBSERVED]` or `[MEASURED]` - no validation needed:

| Item | Evidence | Action |
|------|----------|--------|
| MCP param naming bug | `[MEASURED]` - we hit it | ✅ Fixed (Build 539) |
| MCP root node not mutable | `[CODE-OBSERVED]` - tested | Implement fix |
| Unit test suite exists | `[CODE-OBSERVED]` - 404 tests | Maintain |
| No CI/CD pipeline | `[CODE-OBSERVED]` | Implement if team grows |

---

## Validation Cost Matrix

Prioritize cheap validations first:

| Validation Type | Time | Examples |
|-----------------|------|----------|
| Run existing test | 1 min | `npm run test:unit` |
| Run benchmark script | 5 min | `python measure-render.py` |
| Run Lighthouse | 5 min | Performance audit |
| Check GitHub issues | 10 min | `gh issue list --search "excel"` |
| Add console.log analytics | 30 min | Track feature clicks |
| User interview | 1 hour | Find and talk to 1 user |
| Usability test | 2 hours | Watch user try the app |
| A/B test | 1 week+ | Requires traffic |

**Rule:** Do all <30 min validations before any implementation.

---

## Revised Implementation Sequence

```
Week 1: VALIDATE (no code changes)
├── Run all benchmark scripts
├── Run Lighthouse audit
├── Check GitHub issues for patterns
├── Add minimal analytics (console.log)
├── Find 1-2 real users to interview
└── Document findings with [MEASURED] tags

Week 2+: IMPLEMENT (only validated items)
├── Fix items that failed validation (actual problems)
├── Skip items that passed (not actually problems)
└── Re-prioritize based on real data
```

---

## Success Metrics (Revised)

| Metric | Old Plan | New Plan |
|--------|----------|----------|
| Tree view FPS | "~15 → 60" | Already 60fps, no action needed |
| Validation coverage | 0% | 100% of hypotheses tested |
| User interviews | 0 | At least 2 before major features |
| Speculated features built | Many | Zero (validate first) |

---

## Anti-Patterns to Avoid

1. **Building for imaginary users** - "PM persona" doesn't exist until you find a PM
2. **Fixing non-problems** - Tree view is fast, we almost "fixed" it
3. **AI echo chamber** - 9 AI mentions ≠ 9 real signals
4. **Week estimates** - We don't know scope until validation
5. **Feature factory** - Shipping features nobody asked for

---

## What This Plan Does NOT Include

Removed from original plan (pending validation):

- ~~Virtual scrolling~~ - Tree view is already fast
- ~~IndexedDB migration~~ - Unknown if anyone hits limits
- ~~Excel/PDF export~~ - Unknown if anyone needs it
- ~~Onboarding tour~~ - Unknown if discoverability is actually low
- ~~Persona quick starts~~ - Personas are speculated

These may return IF validation shows they're needed.

---

*Plan revised after discovering hallucinated priorities in self-tree v1.1*
*Key principle: Validate before implementing*
