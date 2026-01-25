# TreeListy + NotebookLM Integration Design

**Date:** 2026-01-25
**Status:** Draft → **Reviewed**
**Author:** Brainstorming session with Claude
**Reviewers:** Gemini, GPT (architectural review)
**Build Target:** 877+

---

## Executive Summary

Integrate NotebookLM (NBLM) as the intelligence backbone for TreeListy, enabling:
1. **Morning Dashboard** - AI-synthesized daily briefing from Gmail/GDrive/Calendar
2. **Research Amplification** - Grounded, citation-backed TB responses
3. **Content Transformation** - Generate podcasts, briefings, flashcards from trees

This design leverages NBLM's zero-hallucination guarantees while respecting TreeListy's Constitutional framework.

---

## Architectural Review: Risks & Mitigations

*Feedback incorporated from Gemini/GPT senior architect review (2026-01-25)*

### CRITICAL: Unofficial API Risk

**The Vulnerability:** NBLM MCP relies on reverse-engineered internal APIs via cookie authentication. If Google changes the internal API or rotates headers, the Morning Dashboard breaks immediately.

**Mitigation: The "Synthesizer" Abstraction Pattern**

Do not hardcode NBLM as the *only* synthesis engine. Create an abstraction layer:

```javascript
// synthesizer/abstract-synthesizer.js
class SynthesisProvider {
  async healthCheck() {}           // Verify auth is working
  async clusterItems(items) {}     // Group items by context
  async queryContext(query, sourceIds) {}  // Grounded Q&A
  async generatePodcast(text) {}   // Content generation
}

// synthesizer/nblm-provider.js - Primary
class NBLMProvider extends SynthesisProvider { ... }

// synthesizer/llm-fallback-provider.js - Fallback
class LLMFallbackProvider extends SynthesisProvider {
  // Uses Gemini 1.5 Pro / Claude 3 Opus via standard API
  // Loses: Podcast generation, persistent notebook state
  // Keeps: Clustering, Q&A with raw context injection
}
```

**Health Check Protocol:**
- Watcher runs `healthCheck()` on startup and every 30 min
- If NBLM auth fails → auto-switch to Fallback Mode
- Show user notification: "NBLM unavailable - using direct synthesis"
- User can manually re-authenticate via Settings

### Privacy & Provenance Refinements

**Article I (Sovereignty) - Data Minimization:**

The `gmail-watcher.js` must filter sensitive content *before* NBLM sync:

```javascript
const SENSITIVE_PATTERNS = [
  /password reset/i,
  /verification code/i,
  /2FA|MFA|OTP/i,
  /security alert/i,
  /sign-in attempt/i
];

function shouldExcludeEmail(email) {
  return SENSITIVE_PATTERNS.some(p =>
    p.test(email.subject) || p.test(email.snippet)
  );
}
```

**Article I (Sovereignty) - Verified Deletion:**

The Daily Triage notebook requires explicit cleanup, not "auto-remove":

```javascript
// sync.js - Destructor function
async function cleanupExpiredSources(notebook, maxAgeHours = 48) {
  const expired = notebook.sources.filter(s =>
    Date.now() - s.addedAt > maxAgeHours * 60 * 60 * 1000
  );

  for (const source of expired) {
    await nblm.deleteSource(notebook.id, source.id);
    // VERIFY deletion succeeded
    const stillExists = await nblm.getSource(notebook.id, source.id);
    if (stillExists) {
      console.error(`Failed to delete source ${source.id}`);
    }
  }
}
```

**Article II (Provenance) - NBLM vs Local RAG Roles:**

| Function | Use NBLM | Use Local RAG |
|----------|----------|---------------|
| **Synthesis** (clustering, summaries) | ✅ Primary | Fallback only |
| **Retrieval** (finding specific files) | ❌ | ✅ Primary |
| **Citations** | ✅ (links to originals) | ✅ (local file paths) |

Citations must open the *original* local file, not the NBLM source viewer (which requires auth).

### Dashboard UX Refinement

**Problem:** TreeListy is ~5.5MB. Dashboard content is ephemeral (stale in 24h). Don't bloat `capexTree` with old emails.

**Solution:** Separate `daily_briefing_cache` object:

```javascript
// Dashboard reads from cache, NOT capexTree
window.dailyBriefingCache = {
  generatedAt: '2026-01-25T07:00:00Z',
  clusters: [...],
  rawItems: [...]
};

// Only when user clicks "Add to Project" does item migrate to capexTree
function migrateToTree(itemId, targetNodeId) {
  const item = dailyBriefingCache.rawItems.find(i => i.id === itemId);
  // Create node in capexTree with proper provenance
  addChildNode(targetNodeId, {
    name: item.title,
    description: item.summary,
    provenance: {
      source: 'dashboard_import',
      originalSource: item.sourceType,
      timestamp: item.timestamp
    }
  });
}
```

**Storage:** Use `sessionStorage` for cache (clears on tab close), not `localStorage`.

### Watcher Optimization

**Current:** Fixed polling (5/15/30 min)

**Improved:** Smart Polling with activity detection:

```javascript
// Active user → frequent polling
// Idle user → back off to conserve resources
const POLL_INTERVALS = {
  active: { gmail: 5, gdrive: 15, calendar: 30 },  // minutes
  idle: { gmail: 60, gdrive: 60, calendar: 120 }   // minutes
};

let userActive = true;
let idleTimer = null;

function resetIdleTimer() {
  userActive = true;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { userActive = false; }, 10 * 60 * 1000);
}

document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keypress', resetIdleTimer);
```

### "Dig Deeper" Sub-Agent Spawning

When user clicks "Dig Deeper" on a dashboard cluster, spawn a **Sub-Agent** (Build 620-622 architecture) scoped to that NBLM notebook:

```javascript
async function digDeeper(clusterId) {
  const cluster = dailyBriefingCache.clusters.find(c => c.id === clusterId);

  // Spawn sub-agent with notebook context
  const agent = await spawnSubAgent({
    type: 'research',
    context: {
      notebookId: cluster.linkedNotebook,
      focusQuery: cluster.briefing,
      sources: cluster.items.map(i => i.sourceId)
    }
  });

  // Open scoped TB chat
  openTBChat({
    systemPrompt: `You are researching: ${cluster.name}. Use ONLY the linked notebook for answers.`,
    agentId: agent.id
  });
}
```

---

## Strategic Priorities

| Priority | Goal | Value |
|----------|------|-------|
| 1. Morning Dashboard | NBLM synthesizes daily triage into actionable clusters | Reduces morning inbox overwhelm |
| 2. Research Amplification | TB responses grounded in user's notebooks | Zero hallucination, traceable answers |
| 3. Content Transformation | Export tree branches as podcasts, docs, flashcards | Multi-modal knowledge output |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TreeListy UI                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Morning      │  │ Project      │  │ TB Chat            │    │
│  │ Dashboard    │  │ Trees        │  │ (NBLM-grounded)    │    │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘    │
└─────────┼─────────────────┼────────────────────┼────────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TreeListy MCP Bridge                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │ Watchers    │  │ NBLM Sync   │  │ MCP Protocol        │     │
│  │ gmail/drive │  │ Module      │  │ (Claude Code)       │     │
│  │ /calendar   │  │             │  │                     │     │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘     │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NotebookLM                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Daily Triage │  │ P2C ISED    │  │ TreeListy    │  ...     │
│  │ Notebook     │  │ Notebook    │  │ Dev Notebook │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

**MCP Bridge Extensions:**
```
treelisty-mcp-bridge/
├── src/
│   ├── bridge.js              # Core MCP server (existing)
│   ├── watchers/
│   │   ├── gmail-watcher.js   # Polls Gmail, filters PII, pushes to synthesizer
│   │   ├── gdrive-watcher.js  # Watches Drive changes
│   │   ├── calendar-watcher.js# Syncs calendar events
│   │   └── activity-tracker.js# Smart polling based on user activity
│   ├── synthesizer/           # ABSTRACTION LAYER (critical for resilience)
│   │   ├── abstract-synthesizer.js  # Base class
│   │   ├── nblm-provider.js         # Primary: NotebookLM
│   │   └── llm-fallback-provider.js # Fallback: Direct Gemini/Claude
│   └── notebooklm/
│       ├── sync.js            # Push sources to NBLM + verified cleanup
│       └── query.js           # Ask NBLM questions
```

---

## Notebook Organization Model

**Hybrid approach:**
- **Project Notebooks** - Deep, persistent: "P2C ISED", "TreeListy Dev", "Personal Finance"
- **Daily Triage Notebook** - Ephemeral, refreshed: Contains last 48h of emails/docs/events

**Auto-linking:** When NBLM detects a cluster matches an existing project notebook, it automatically links and pulls context for deeper answers.

---

## Continuous Sync Flow

```
Gmail API ──┐
            │    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
GDrive API ─┼───►│  Watchers   │───►│  NBLM Sync  │───►│ Daily Triage│
            │    │  (polling)  │    │  (push)     │    │  Notebook   │
Calendar ───┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                              │
                 ┌─────────────┐    ┌─────────────┐          │
                 │ Dashboard   │◄───│  Synthesize │◄─────────┘
                 │ Tree        │    │  & Cluster  │
                 └─────────────┘    └─────────────┘
```

### Watcher Configuration

| Source | Poll Interval | What's Captured |
|--------|---------------|-----------------|
| Gmail | 5 min | New/updated threads (last 24h) |
| GDrive | 15 min | Modified docs in watched folders |
| Calendar | 30 min | Events in next 7 days |

### NBLM Sync Rules

- New items added as sources to Daily Triage notebook
- Items older than 48h auto-removed (keeps notebook fresh)
- If item matches project notebook keywords, also links there

### Synthesis Triggers

- **On-demand:** `/morning` command or "TB, dashboard"
- **Auto:** First TreeListy open of the day
- **Refresh:** Pull-to-refresh gesture on Dashboard view

---

## Dashboard UI Design

### Tree Structure (Context Clusters)

```
📊 Morning Dashboard (Jan 25, 2026)
│
├── 🔥 P2C ISED [3 actions] ─────────────────────────────────
│   │ 📋 "Intake deadline in 5 days. Thomas sent updated
│   │    financials needing review. Thursday alignment call."
│   │
│   ├── ☐ Reply to Thomas re: CapEx projections
│   │     └── 📎 [Email: Jan 24, 10:32 AM]
│   ├── ☐ Review ISED-RISKS-AND-UNKNOWNS.md changes
│   │     └── 📎 [GDrive: modified yesterday]
│   └── ☐ Prep for Thursday alignment call
│         └── 📎 [Calendar: Thu 2pm]
│
├── 🌲 TreeListy Dev [2 actions] ────────────────────────────
│   │ 📋 "Build 876 shipped. GitHub issue #142 needs triage.
│   │    PR review requested from contributor."
│   │
│   ├── ☐ Triage issue #142 (mobile keyboard bug)
│   └── ☐ Review PR #89 (hyperedge export fix)
│
└── 📬 General [1 action] ───────────────────────────────────
    │ 📋 "Routine items. Newsletter and billing notice."
    │
    └── ☐ Pay AWS invoice (due Jan 28)
```

### UI Behaviors

- **Collapsed default:** Clusters show name + action count
- **Expand:** Click reveals briefing card + action items
- **Completion:** Checkbox archives item from Daily Triage
- **Dig deeper:** Button spawns Sub-Agent (Build 620-622) scoped to that cluster's NBLM notebook
- **Add to Project:** Migrate action item from cache to `capexTree` with proper provenance
- **Citations:** 📎 badges link to *original* local file (not NBLM viewer)

---

## Research Amplification

### Contextual Suggestions

When user selects a node, TB checks linked project notebooks for relevant content:

```
┌─────────────────────────────────────────────────────────┐
│ Selected: "Phase 1 Power Requirements"                  │
├─────────────────────────────────────────────────────────┤
│ 💡 TB found 3 related items in "P2C ISED" notebook:    │
│                                                         │
│ • SaskPower interconnection agreement (Dec 2025)       │
│ • Phase 1 load calculations spreadsheet                │
│ • Email thread: Thomas re: 10MW allocation             │
│                                                         │
│ [Show Context]  [Ask Question]  [Dismiss]              │
└─────────────────────────────────────────────────────────┘
```

### Inline Citations

TB-generated content automatically includes source references:

```
Node: "Cooling Strategy"
Description: "Phase 1 uses dry cooling with 7,000+ hours
of free cooling annually. [1] Target PUE of 1.25-1.35
based on Saskatchewan climate data. [2]"

Citations:
[1] ISED-Application-Draft.pdf, p.14
[2] SaskClimate-Analysis.xlsx, Tab 3
```

### Citation Badge Behavior

- **Hover:** Shows source preview
- **Click:** Opens source in NBLM or original app
- **Missing:** ⚠️ badge for uncited/uncertain claims

---

## Content Transformation (Branch Export)

### Context Menu

```
Right-click on "P2C ISED Application" node
┌──────────────────────────────────┐
│ 📋 Copy                          │
│ ✏️ Rename                        │
│ ───────────────────────────────  │
│ 🎙️ Generate Podcast...          │
│ 📄 Generate Briefing Doc...      │
│ 🎴 Generate Flashcards...        │
│ 📊 Generate Slide Deck...        │
└──────────────────────────────────┘
```

### Smart Boundary Dialog

```
┌─────────────────────────────────────────────────────────┐
│ Generate Podcast from "P2C ISED Application"           │
├─────────────────────────────────────────────────────────┤
│ Branch contains: 47 nodes                               │
│                                                         │
│ 💡 TB suggests:                                        │
│ ┌─────────────────────────────────────────────────────┐│
│ │ ☑ Include parent context (root description)        ││
│ │ ☑ Exclude completed items (12 nodes)               ││
│ │ ☐ Exclude "Later" priority items (8 nodes)         ││
│ │ ☑ Include linked NBLM notebook context             ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Estimated context: 27 nodes → ~3,500 words             │
│                                                         │
│ [Preview Selection]  [Generate]  [Cancel]              │
└─────────────────────────────────────────────────────────┘
```

**Preview Selection** opens tree with checkboxes for manual override of what's in/out of context.

> **Architectural Review Note:** The Smart Boundary Dialog was explicitly praised as "perfectly aligned with Article III (Integrity) and Article V (Anti-Enframing)." The friction is a feature - it forces the user to verify context before AI acts. **DO NOT SIMPLIFY THIS.**

---

## Constitutional Alignment

| Article | Requirement | How NBLM Integration Complies |
|---------|-------------|-------------------------------|
| **I. Sovereignty** | Works offline, no cloud lock-in | Watchers cache locally. NBLM enhances but isn't required. Dashboard degrades to raw items if unavailable. |
| **II. Provenance** | AI content marked, traceable | Every NBLM response carries citation badges. `provenance.source = 'notebooklm'` + notebook ID + source refs. |
| **III. Integrity** | Reversible, user consent | Exports are one-way copies. Smart boundary dialog = consent before generation. Undo works on tree changes. |
| **IV. Humility** | Confidence routing | NBLM admits "I don't have information on X" when outside notebook scope. TB shows ⚠️ for uncited claims. |
| **V. Anti-Enframing** | Reveal, don't optimize | Clusters show ALL items grouped by context, not algorithmic "top picks". User sees full picture. |
| **VI. Federation** | Connection without extraction | Project notebooks stay user-owned. No central registry. Cross-notebook linking is explicit. |

### Graceful Degradation

```
NBLM available    → Full synthesis, citations, generation
NBLM unavailable  → Raw items in Dashboard, TB works without grounding
Offline           → Cached last sync, local-only TB responses
```

---

## Implementation Phases

### Phase 1: Foundation (2-3 builds)

**Goal:** Basic NBLM connectivity with resilient abstraction layer

**Tasks:**
- [ ] Install NBLM MCP server alongside TreeListy bridge
- [ ] **NEW:** Create `synthesizer/` abstraction layer (abstract-synthesizer.js)
- [ ] **NEW:** Implement `NBLMProvider` with `healthCheck()` method
- [ ] **NEW:** Implement `LLMFallbackProvider` (Gemini 1.5 Pro direct)
- [ ] Add `notebooklm/` module to bridge (sync.js, query.js)
- [ ] **NEW:** Add verified deletion in sync.js cleanup
- [ ] TB commands: `nblm_query`, `nblm_list_notebooks`, `nblm_select`
- [ ] Manual workflow: user manages notebooks, TB can query them

**Milestone:** "TB, ask my ISED notebook about power requirements" works. If NBLM unavailable, falls back gracefully.

**Acceptance Test:**
1. Query returns citation-backed answer from user's notebook
2. Disconnect NBLM auth → fallback provider activates with notification

---

### Phase 2: Dashboard MVP (3-4 builds)

**Goal:** Morning dashboard with AI-synthesized clusters and proper data handling

**Tasks:**
- [ ] Gmail watcher with **PII filter** (SENSITIVE_PATTERNS regex)
- [ ] GDrive watcher (polling, 15 min interval)
- [ ] Calendar watcher (polling, 30 min interval)
- [ ] **NEW:** Activity tracker for smart polling (active vs idle intervals)
- [ ] Daily Triage notebook auto-population with **verified cleanup**
- [ ] **NEW:** `dailyBriefingCache` object (sessionStorage, not capexTree)
- [ ] Basic Dashboard view (clusters without smart linking)
- [ ] Briefing card generation on `/morning` command
- [ ] Action item display with checkboxes
- [ ] **NEW:** "Add to Project" migration from cache to capexTree

**Milestone:** Morning dashboard shows clustered items with AI summaries. Sensitive emails filtered. Dashboard content doesn't bloat tree JSON.

**Acceptance Test:**
1. Run `/morning`, see 2+ clusters with briefing cards
2. Password reset email NOT in dashboard (PII filter)
3. Close tab, reopen → dashboard cache is empty (sessionStorage)

---

### Phase 3: Smart Integration (2-3 builds)

**Goal:** Contextual intelligence throughout TreeListy

**Tasks:**
- [ ] Auto-link clusters to project notebooks
- [ ] Contextual suggestions on node selection
- [ ] Inline citations in TB responses (link to *original* files, not NBLM viewer)
- [ ] Action list completion → archive flow
- [ ] **NEW:** "Dig Deeper" button spawns Sub-Agent (Build 620-622) with notebook context

**Milestone:** Full research amplification loop working.

**Acceptance Test:**
1. Select node, see relevant suggestions from linked notebook
2. Click citation → opens original local file (not NBLM)
3. Click "Dig Deeper" → scoped TB chat with isolated conversation

---

### Phase 4: Content Generation (2 builds)

**Goal:** Export tree branches as rich media

**Tasks:**
- [ ] Branch export context menu (right-click)
- [ ] Smart boundary dialog with TB suggestions
- [ ] Preview selection tree with checkboxes
- [ ] Podcast generation trigger
- [ ] Briefing doc generation trigger
- [ ] Flashcard generation trigger
- [ ] Output handling (download, play in TreeListy)

**Milestone:** Right-click → Generate Podcast works end-to-end.

**Acceptance Test:** Generate 5-min podcast from project tree branch.

---

## Estimated Timeline

| Phase | Builds | Duration |
|-------|--------|----------|
| Phase 1: Foundation | 2-3 | ~1 week |
| Phase 2: Dashboard MVP | 3-4 | ~2 weeks |
| Phase 3: Smart Integration | 2-3 | ~1 week |
| Phase 4: Content Generation | 2 | ~1 week |
| **Total** | **9-12** | **~4-6 weeks** |

---

## Technical Dependencies

### Required

- `notebooklm-mcp` package (PleasePrompto or jacob-bd version)
- Chrome browser for NBLM cookie auth
- Existing Gmail/GDrive OAuth tokens (already in TreeListy)

### Optional

- Google Calendar API access (new OAuth scope)
- NBLM Enterprise API (for podcast generation API access)

---

## Open Questions

### Addressed by Architectural Review

1. ~~**Cookie expiration:** NBLM cookies expire every 2-4 weeks. How to handle re-auth gracefully?~~
   → **RESOLVED:** Health check protocol auto-detects failure and switches to LLM Fallback Mode. User notified to re-authenticate.

2. ~~**Offline sync:** How much to cache locally for offline Dashboard access?~~
   → **RESOLVED:** Dashboard uses `sessionStorage` cache. Graceful degradation shows raw items when NBLM unavailable.

### Remaining Open Questions

3. **Rate limits:** Free tier is ~50 queries/day. Is this sufficient? Need NBLM Plus?
4. **Notebook size:** What's the source limit per notebook? May need rotation strategy.
5. **Push notifications:** Can we use Gmail/Calendar webhooks instead of polling? (Battery/rate limit concerns)
6. **LLM Fallback cost:** What's the token cost of clustering 50 emails via direct Gemini 1.5 Pro?

---

## References

- [PleasePrompto/notebooklm-mcp](https://github.com/PleasePrompto/notebooklm-mcp)
- [jacob-bd/notebooklm-mcp](https://github.com/jacob-bd/notebooklm-mcp)
- [TreeListy Constitutional Framework](../guides/TreeListy-Constitutional-Framework-v1.md)
- [Dashboard Trees Design](./2026-01-05-dashboard-trees-design.md) (if exists)

---

*Last updated: 2026-01-25 (Architectural review incorporated)*
