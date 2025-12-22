# TreeListy Self-Tree Prompt v1.2

## Mission
Build a self-tree with rigorous evidence standards, distinguishing measured facts from AI inferences. Output a **Validation Queue** of hypotheses to test, not a list of things to build.

---

## BEFORE BUILDING: Gather External Signals

**Required inputs** (mark N/A if unavailable, but TRY to get them first):

| Signal | How to Get | Value |
|--------|-----------|-------|
| GitHub issues (last 90 days) | `gh issue list` | ___ |
| User feedback (any channel) | Check Discord, email, Twitter | ___ |
| Largest tree in production | Ask users or check cloud shares | ___ nodes |
| Lighthouse performance score | Run `lighthouse https://treelisty.netlify.app` | ___ |
| Error logs | Check Netlify function logs | ___ |
| Any analytics data | Check if tracking exists | ___ |

**If all are N/A:** The self-tree can only produce `[CODE-OBSERVED]` and `[CODE-INFERRED]` claims. No severity ranking is valid without external signals.

---

## Critical Learning from v1.1

**The Performance Hallucination Incident:**
- v1.0/v1.1 claimed "Tree view lags at 150+ nodes" based on code pattern inference
- This was treated as P0, implementation started on virtual scrolling
- **Actual measurement showed:** 1000 nodes renders in 9.37ms (well under 16.67ms budget)
- **Result:** Almost wasted engineering weeks on a non-problem

**Root Cause:** AI reading code and inferring "this could be slow" was treated as "this IS slow"

---

## Evidence Standards (NEW - MANDATORY)

### Evidence Tags
Every claim about quality, performance, or user experience MUST include one tag:

| Tag | Meaning | Can Drive Priority? |
|-----|---------|---------------------|
| `[MEASURED]` | Actual benchmark, telemetry, or test result | ✅ Yes |
| `[USER-REPORTED]` | From user feedback, tickets, interviews | ✅ Yes |
| `[CODE-OBSERVED]` | Objectively visible in code (exists/doesn't) | ✅ For features |
| `[CODE-INFERRED]` | AI deduction from code patterns | ❌ Hypothesis only |
| `[SPECULATED]` | AI guess without supporting evidence | ❌ Never actionable |

### Validation Gates

```
[CODE-INFERRED] claim → Must become [MEASURED] before implementation
[SPECULATED] claim → Goes in "Hypotheses" section, not "Improvements"
[USER-REPORTED] claim → Include source (ticket #, quote, channel)
```

### Examples

```
❌ WRONG: "Performance: Tree view lags with large trees"
✅ RIGHT: "Performance: Tree view lags with large trees [CODE-INFERRED, UNMEASURED]"
✅ BEST:  "Performance: Tree view renders 1000 nodes in 9.37ms [MEASURED via test/performance/measure-render.py]"

❌ WRONG: "Usage Frequency: HIGH"
✅ RIGHT: "Usage Frequency: HIGH [SPECULATED, NO ANALYTICS]"

❌ WRONG: "PM persona needs Excel export"
✅ RIGHT: "PM persona needs Excel export [SPECULATED, NO USER RESEARCH]"
```

---

## What Self-Tree CAN Determine (Reliable)

| Category | Why Reliable |
|----------|--------------|
| Feature inventory | Code exists or doesn't - binary |
| Architecture structure | Objectively observable |
| Code complexity metrics | Measurable (LOC, functions, etc.) |
| API surface | Documented in code |
| Test coverage | Measurable |

## What Self-Tree CANNOT Determine (Unreliable)

| Category | Why Unreliable |
|----------|----------------|
| Performance quality | Requires measurement, not code reading |
| User satisfaction | Requires user research |
| Priority/severity | Requires impact data |
| Usage frequency | Requires analytics |
| UX quality | Requires user testing |

---

## Context Loading
1. Load previous self-trees as reference
2. Load any available measurements from `test/performance/`
3. Check for user feedback in issues, Discord, or other channels
4. Review actual telemetry if available

## Execution Method
- **Primary**: Claude Code via MCP Bridge connected to TreeListy
- **Alternative**: TreeBeard Deep mode with this prompt pasted
- **Validation**: Run benchmarks before claiming performance issues

---

## Structure (5 phases)

### Phase 1: Features
Document capabilities with evidence tags:
- Feature existence: `[CODE-OBSERVED]`
- Usage frequency: `[MEASURED]` if analytics exist, else `[SPECULATED, NO DATA]`
- Quality assessment: Requires `[MEASURED]` or `[USER-REPORTED]`

### Phase 2: Architecture
Document structure with metrics:
- Code organization: `[CODE-OBSERVED]`
- Performance claims: MUST be `[MEASURED]` with benchmark reference
- Complexity: `[MEASURED]` via static analysis if available

### Phase 3: User Journey
Document with source attribution:
- Persona definitions: `[SPECULATED]` unless based on user research
- Pain points: `[USER-REPORTED]` with source, or `[CODE-INFERRED]` as hypothesis
- Journey mapping: Tag each claim with evidence source

### Phase 4: Meta
Self-assessment with honesty:
- What we know vs. what we're guessing
- Evidence gaps to fill
- Validation needed before action

### Phase 5: Analysis
Cross-cutting analysis with evidence awareness:
- Theme frequency: Count mentions, but note if themes are `[MEASURED]` vs `[INFERRED]`
- Priority surfacing: Weight `[MEASURED]` themes higher than `[INFERRED]`
- Hypotheses section: Collect all `[CODE-INFERRED]` and `[SPECULATED]` items for validation

---

## Hypotheses Section (NEW)

All `[CODE-INFERRED]` and `[SPECULATED]` claims go here with validation plan:

```
### Hypothesis: Canvas view lags at 200+ nodes
- Evidence: [CODE-INFERRED] from GoJS usage patterns
- Validation needed: Run test/performance/measure-canvas.py with 50/200/500 nodes
- Status: UNVALIDATED

### Hypothesis: PM persona needs Excel export
- Evidence: [SPECULATED] based on assumed workflow
- Validation needed: User interview or survey
- Status: UNVALIDATED
```

---

## Success Criteria (v1.2 specific)

- [ ] Every quality/performance claim has evidence tag
- [ ] No `[CODE-INFERRED]` claims in "Top Priorities" without `[MEASURED]` validation
- [ ] Performance section includes actual benchmark results
- [ ] Hypotheses section lists all unvalidated assumptions
- [ ] Clear separation between "what we know" and "what we're guessing"

---

## Anti-Patterns to Avoid

1. **Echo Chamber**: AI mentions "performance" 9 times ≠ 9 independent signals
2. **Hallucinated Severity**: Code pattern → "could be slow" ≠ "IS slow"
3. **Feature Factory**: Don't prioritize new features over fixing measured problems
4. **Infinite Meta**: Building trees about trees without shipping code
5. **Speculated Personas**: "PM needs X" without talking to PMs

---

## Anti-Echo-Chamber Rule

**Frequency ≠ Importance**

If a theme appears N times in the self-tree, that means the AI mentioned it N times - NOT that N users complained or N bugs exist.

| What Frequency Means | What It Doesn't Mean |
|---------------------|---------------------|
| AI thinks it's related | Users care about it |
| Good candidate for hyperedge | High priority |
| Appears in multiple phases | Multiple independent signals |

**Cross-reference frequency is useful for:**
- Finding RELATED items (hyperedge candidates)
- Identifying themes to INVESTIGATE

**Cross-reference frequency is NOT useful for:**
- Priority ranking
- Severity assessment
- Deciding what to build

**Priority requires external signal:**
- `[USER-REPORTED]` pain → Consider high priority
- `[MEASURED]` regression → Consider high priority
- `[CODE-INFERRED]` × 9 mentions → Still just a hypothesis

---

## Validation Cost Matrix

Before suggesting "Implement X", estimate validation cost:

| Validation Type | Time | Example |
|-----------------|------|---------|
| Run existing test | 1 min | `npm run test:unit` |
| Run benchmark script | 5 min | `python measure-render.py` |
| Run Lighthouse | 5 min | Performance audit |
| Check GitHub issues | 10 min | `gh issue list --search "excel"` |
| Add console.log analytics | 30 min | Track feature clicks |
| User interview | 1 hour | Find and talk to 1 user |
| Usability test | 2 hours | Watch user try the app |
| A/B test | 1 week+ | Requires traffic |

**Rule:** Suggest cheapest validation first. If a 5-minute benchmark disproves the hypothesis, we saved weeks of implementation.

**Output format for hypotheses:**
```
Hypothesis: [description]
- Evidence: [TAG]
- Validation cost: [time estimate]
- Validation method: [how to test]
- If validated: [what to build]
- If disproven: [remove from plan]
```

---

## Process Learnings

### From v1.0
- MCP `add_child:X` parsing broken → Fixed Build 538
- JSON export format undocumented

### From v1.1
- MCP node operations used wrong param names → Fixed Build 539
- Cross-cutting theme analysis worked well

### From v1.1→v1.2 (Performance Incident)
- **Claimed**: "Tree view lags at 150+ nodes" `[CODE-INFERRED]`
- **Measured**: 1000 nodes renders in 9.37ms `[MEASURED]`
- **Lesson**: ALWAYS measure before implementing performance fixes
- **Added**: `test/performance/measure-render.py` for future validation

---

## Measurement Tools Available

| Tool | What It Measures | Location |
|------|------------------|----------|
| `measure-render.py` | Tree view render time | `test/performance/` |
| Unit tests | Function correctness | `test/treelisty-test/` |
| Playwright | E2E user flows | `test/treelisty-test/` |

Before claiming performance issues, RUN THE BENCHMARKS.

---

*Prompt version: v1.2*
*Created: 2025-12-22*
*Key change: Evidence standards to prevent hallucinated priorities*
