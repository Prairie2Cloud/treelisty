# Dashboard Trees: Cross-Tree Agentic Workflows

**Date:** 2026-01-05 (Updated 2026-01-18)
**Status:** Approved Design (Revised with GPT Feedback)
**Priority:** Strategic Feature
**Extends:** Atlas Cross-Tree Intelligence
**Revision:** v5 - Build 873 Phase 3 complete

---

## Current State Assessment (Build 873)

**Added 2026-01-18:** Review of what exists vs. what's needed.

### Implementation Progress

| Phase | Status | Builds | Notes |
|-------|--------|--------|-------|
| Phase 0: Storage Layer | ✅ Complete | 745, 787, 793-794 | TreeStorageAdapter, AtlasDB v2 |
| Phase 1: Dashboard Foundation | ✅ Complete | 783-784 | detectDashboardRole, getDashboardTrees |
| Phase 2: Morning Dashboard UI | ✅ Complete | 785-790 | 3-column modal, import/fetch UX |
| Phase 3: External IDs + Merge | ✅ Complete | 873 | getExternalId, mergeDashboardRefresh |
| Phase 4: AI Summary | 🔲 Not Started | - | **NEXT: Start here** |
| Phase 5: Agent Infrastructure | ⚠️ Partial | 751, 795 | Triage Agent exists, different purpose |
| Phase 6: Draft & Approval | 🔲 Not Started | - | |
| Phase 7: Workflow Creation | 🔲 Not Started | - | |

### Existing Infrastructure

| Component | Status | Build | Notes |
|-----------|--------|-------|-------|
| NodeIndex (IndexedDB) | ✅ Exists | 698 | Used for Gallery/Clone |
| TreeStorageAdapter | ✅ Exists | 745 | Routes large trees to IndexedDB |
| GDrive RAG | ✅ Exists | 770-781 | Content extraction, hybrid search |
| Gmail MCP tools | ✅ Exists | 795 | `gmail_*` tools for triage, archive, star, draft |
| GDrive MCP tools | ✅ Exists | 771 | `gdrive_*` tools for list, search, open |
| Triage Agent | ✅ Exists | 795 | `triage_*` tools - background monitoring |
| External ID standard | ✅ Complete | 873 | getExternalId() handles threadId, external.id, fileId |
| Merge refresh | ✅ Complete | 873 | mergeDashboardRefresh() preserves nodeGuid |

### External ID Implementation (Build 873)

**Decision:** Use existing patterns as canonical, accessed via `getExternalId(node, role)`:

| Role | External ID Source | Fallback |
|------|-------------------|----------|
| gmail | `node.threadId` | - |
| drive | `node.external.id` | `node._rag.source.fileId` or extract from `node.fileUrl` |
| calendar | `node.eventId` | - |

**Key Functions Added:**
- `getExternalId(node, role)` - Extract external identity from node
- `buildExternalIdMap(tree, role)` - Index all nodes by external ID
- `mergeDashboardRefresh(role, existing, fresh)` - Merge preserving nodeGuid

**Merge Behavior:**
- Matched external ID → preserve nodeGuid + hyperedges + user modifications
- New external ID → new node with fresh ID
- Orphaned external ID → marked `_stale: true` with timestamp

### Triage Agent Integration

Build 795 added `triage_*` MCP tools that overlap with "agentic workflows":
- `triage_start` / `triage_stop` - background monitoring
- `triage_now` - immediate triage cycle
- `triage_config` - polling interval, auto-approve settings

**Recommendation:** Dashboard Trees agents should integrate with or extend Triage Agent, not duplicate it.

### Updated Build Ranges

Original doc referenced Builds 745-805 (speculative). Current build is 872. Updated phases:
- Phase 0: Builds 873-876
- Phase 1: Builds 877-882
- Phase 2: Builds 883-890
- Phase 3: Builds 891-898
- Phase 4: Builds 899-906
- Phase 5: Builds 907-916
- Phase 6: Builds 917-924
- Phase 7: Builds 925-933

---

## Executive Summary

Dashboard Trees are external data source trees (Gmail, Drive, Calendar) that serve as the foundation for daily data processing workflows. This design introduces:

1. **Morning Dashboard** - Unified view of all dashboard trees with AI summary
2. **Agentic Workflows** - Background agents that monitor, wait, and act across trees
3. **Auto-Draft with Approval** - AI prepares actions, user reviews and approves

**Key Use Case:**
> AI notices a founders meeting on Calendar, waits for meeting notes to appear in Drive, then 3 days later drafts an investor brief email for user approval.

---

## Critical Architectural Constraints

Three architectural issues must be addressed before implementation:

### Constraint A: Refresh Runtime

**Problem:** TreeListy is a static single-file web app. It cannot spawn Python scripts like `scripts/export-gmail.py` directly.

**Solution:** Introduce a `DashboardConnector` abstraction:

```javascript
const DashboardConnectors = {
  gmail: { refresh: async () => { /* via MCP or direct */ } },
  drive: { refresh: async () => { /* via MCP or direct */ } },
  calendar: { refresh: async () => { /* via MCP or direct */ } },
};

async function refreshDashboardRole(role) {
  const connector = DashboardConnectors[role];
  if (!connector) throw new Error(`No connector for ${role}`);
  return await connector.refresh(); // returns { treePatch | fullTree, meta }
}
```

**Implementation priority:**
1. **MCP Bridge** (primary) - Local Node daemon runs scripts + returns JSON
2. **Netlify Functions** (future) - Server-side refresh for auth'd sources
3. **Direct browser API** (future) - OAuth in-browser

The `refreshScript` field becomes metadata for MCP Bridge to execute, not for the UI.

### Constraint B: Stable Identifiers Across Refreshes

**Problem:** "Replace active tree" on refresh breaks workflows if they reference `treeId/nodeId` that change every import.

**Solution:** Dashboard nodes must carry stable **external keys**:

```javascript
// Dashboard node identity
{
  nodeGuid: "n_abc123",           // TreeListy internal (stable)
  external: {
    type: "gmail:thread",         // external system + type
    id: "18d4f2a3b5c6d7e8"        // external ID (threadId, fileId, eventId)
  }
}
```

**Merge semantics on refresh:**
- Match by `{dashboardRole, external.type, external.id}`
- Existing match → update node, preserve `nodeGuid`
- No match → insert new node with new `nodeGuid`
- Missing in refresh → soft-delete or mark stale

**Workflow references use external IDs:**
```javascript
trigger: {
  sourceRole: "drive",
  match: {
    externalType: "gdrive:file",
    nameContains: "founders meeting"
  }
}
```

### Constraint C: "Approve & Send" Realism

**Problem:** TreeListy supports Gmail draft creation but may not have "Send" capability yet.

**Solution:** Rename actions to match actual capability:
- **Approve & Send** → **Approve & Create Draft**
- Or: **Approve & Queue** (if MCP can send later)

Don't ship buttons that promise more than the system delivers.

### Constraint D: Background Polling Limitations

**Problem:** Browsers throttle timers in background tabs. "15-minute polling" is unreliable.

**Solution:** Clarify two modes:
- **Foreground polling:** While TreeListy tab is active, poll every N minutes
- **Background polling:** Only via MCP Bridge (Node daemon stays awake)

Agents that need reliable background execution live next to the bridge, not in the browser.

### Constraint E: Storage Quota Wall (Gemini)

**Problem:** localStorage limit is ~5MB total. A single Gmail tree can exceed 5MB. Storing three dashboard trees in localStorage will hit `QuotaExceededError`.

**Solution:** Dashboard tree payloads must use **IndexedDB**, not localStorage:

```javascript
// Storage strategy
localStorage:
  - treelisty:dashboard:gmail → treeId (reference only)
  - treelisty:dashboard:drive → treeId (reference only)
  - TreeRegistry metadata (small)

IndexedDB (via AtlasDB/NodeIndex):
  - Full dashboard tree JSON payloads
  - NodeIndex entries for search
```

**Implementation:** Extend `NodeIndex` (Build 698) infrastructure to store dashboard tree content. `TreeStorageAdapter` routes:
- Small trees (<1MB) → localStorage
- Large/Dashboard trees → IndexedDB

### Constraint F: Memory Bloat in Dashboard View (Gemini)

**Problem:** Loading three full `capexTree` objects into JavaScript heap for the Dashboard UI could cause stuttering/crashes.

**Solution:** Dashboard reads from **NodeIndex metadata**, not full tree hydration:

```javascript
// Dashboard preview - lightweight
const preview = await NodeIndex.getTopNodes('gmail', {
  limit: 5,
  fields: ['name', 'external.id', 'unread']
});

// Full tree - only on explicit "Open"
const fullTree = await TreeStorageAdapter.load(treeId);
```

Only hydrate full tree when user clicks "Open Gmail".

### Constraint G: Reuse Existing Infrastructure (Gemini)

**Problem:** Temptation to build new execution engines, storage systems, action schemas.

**Solution:** Reuse what exists:

| Need | Reuse |
|------|-------|
| Workflow actions | TreeBeard Tool Calls (Build 658) - serialize as JSON |
| Trigger checks | Hook into existing `render()` cycle or `setInterval` |
| Storage | NodeIndex + AtlasDB (Build 698) |
| Script execution | MCP Bridge tools, not hardcoded paths |

**Do NOT:**
- Invent new action schemas (use tool call JSON)
- Create web workers unless necessary
- Hardcode script paths in HTML (use MCP tool `refresh_dashboard_source(role)`)

---

## Core Concepts

### Dashboard Trees vs Regular Trees

```
Trees
├── Dashboard Trees (external data sources)
│   ├── Gmail     - API-connected, refreshable
│   ├── Drive     - API-connected, refreshable
│   └── Calendar  - API-connected, refreshable
└── Regular Trees (user-created)
    ├── Philosophy Notes
    ├── Project Plans
    └── etc.
```

**Dashboard Trees are defined by:**
- Connection to external data source (API)
- Refresh capability (can pull latest data)
- Auto-detection on import (zero configuration)

---

## Section 1: Data Model

### Dashboard Tree Registration

When a tree is imported, auto-detection adds a `dashboardRole` property:

```javascript
{
  treeId: "tree_abc123",
  name: "Gmail Inbox 2026-01-05",
  dashboardRole: "gmail",      // "gmail" | "drive" | "calendar" | null
  dashboardMeta: {
    sourceType: "gmail",
    lastRefresh: 1736100000000,
    refreshScript: "scripts/export-gmail.py",
    itemCount: 52,
    unreadCount: 12            // source-specific stats
  }
}
```

### Detection Heuristics

| Source | Detection Rules |
|--------|-----------------|
| Gmail | `source.type === 'gmail'` or tree name contains 'gmail' |
| Drive | `source.type === 'gdrive'` or tree structure matches Drive export |
| Calendar | `source.type === 'gcal'` or tree has event patterns |

### Registry Extension

TreeRegistry gains a `getDashboardTrees()` method:

```javascript
TreeRegistry.getDashboardTrees()
// Returns: { gmail: treeEntry, drive: treeEntry, calendar: treeEntry }
```

Only one tree per dashboard role. If you import a new Gmail tree, it replaces the previous one as the active Gmail dashboard.

---

## Section 2: Morning Dashboard UI

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Good morning, Garnet                       [Settings] [Agent 2] │
├─────────────────────────────────────────────────────────┤
│  AI SUMMARY                                             │
│  "Founders meeting at 2pm. 4 emails need response.      │
│   Q4 budget was updated. Watching: investor brief."     │
│                                                         │
│  [Draft reply to Sarah] [Review budget changes]         │
├─────────────────────────────────────────────────────────┤
│  GMAIL (12 unread)       DRIVE (3 recent)      TODAY    │
│  ┌──────────────────┐   ┌─────────────────┐   ┌───────┐ │
│  │ Sarah: Q4 update │   │ Q4 Budget.xlsx  │   │ 10am  │ │
│  │ CI: Build failed │   │ Meeting notes   │   │ Standup│ │
│  │ Alex: Question   │   │ Roadmap.doc     │   │ 2pm   │ │
│  │ [+9 more]        │   │                 │   │ Fndrs │ │
│  └──────────────────┘   └─────────────────┘   └───────┘ │
│     [Open Gmail]           [Open Drive]      [Open Cal] │
└─────────────────────────────────────────────────────────┘
```

### Key Elements

- **Header**: Greeting, settings gear, agent status badge (Agent 2 = 2 active workflows)
- **AI Summary**: Natural language overview + action buttons for drafts ready to review
- **Preview Cards**: Top 3-5 items per source, click to expand full tree
- **Open buttons**: Switch to that dashboard tree's full view

### Access Point

- New "Dashboard" button in header
- Keyboard shortcut: `Ctrl+D`

### Refresh Behavior

- **User opens dashboard**: Auto-refresh all dashboard trees
- **Background polling**: Agents get fresh data every 15 minutes (configurable)

---

## Section 3: Agent Architecture

### Workflow Definition

Agents are defined as trigger → condition → action chains:

```javascript
{
  workflowId: "wf_investor_brief",
  status: "waiting",           // "waiting" | "ready" | "completed" | "cancelled"
  createdAt: 1736100000000,

  trigger: {
    type: "tree_update",       // "tree_update" | "schedule" | "manual"
    source: "drive",           // which dashboard tree to watch
    match: { nameContains: "founders meeting" }
  },

  condition: {
    type: "delay_after_trigger",
    delayDays: 3               // wait 3 days after trigger fires
  },

  action: {
    type: "draft_email",
    template: "investor_brief",
    inputs: {
      meetingNotes: "$trigger.node",    // reference triggered node
      recipients: ["investors@..."]
    }
  },

  output: null                 // populated when draft is ready
}
```

### Agent Manager

```javascript
AgentManager = {
  workflows: [],               // active workflows

  register(workflow),          // add new workflow
  cancel(workflowId),          // user cancels
  checkTriggers(),             // called on tree refresh
  executeReady(),              // process workflows where conditions met
  getStatus()                  // for UI display
}
```

### Background Polling

Every 15 minutes (configurable):
1. Refresh dashboard trees via their refresh scripts
2. `AgentManager.checkTriggers()` - evaluate all waiting workflows
3. `AgentManager.executeReady()` - draft actions for ready workflows
4. Surface notifications for drafts awaiting approval

---

## Section 4: Draft & Approval Flow

### Draft Creation

When a workflow's conditions are met, the agent creates a draft:

```javascript
{
  draftId: "draft_abc123",
  workflowId: "wf_investor_brief",
  createdAt: 1736400000000,

  type: "email",               // "email" | "calendar_event" | "document"
  target: "gmail",             // which dashboard tree

  content: {
    to: "investors@example.com",
    subject: "Q4 Update - Founders Meeting Summary",
    body: "Based on the Jan 5 founders meeting..."
  },

  sources: [                   // provenance - what AI used
    { treeId: "tree_drive", nodeId: "n_abc", name: "Founders Meeting Notes" },
    { treeId: "tree_calendar", nodeId: "n_xyz", name: "Founders Meeting" }
  ],

  status: "pending_review"     // "pending_review" | "approved" | "edited" | "rejected"
}
```

### Approval UI

When drafts are ready, they appear in the AI Summary section:

```
┌─────────────────────────────────────────────────────────┐
│  DRAFT READY: Investor Brief Email                      │
│                                                         │
│  To: investors@example.com                              │
│  Subject: Q4 Update - Founders Meeting Summary          │
│  ─────────────────────────────────────────────────      │
│  Based on the Jan 5 founders meeting, here are the      │
│  key updates...                                         │
│                                                         │
│  Sources: [Founders Meeting Notes] [Calendar Event]     │
│                                                         │
│  [Approve & Create Draft]  [Edit]  [Reject]             │
└─────────────────────────────────────────────────────────┘
```

### Actions

- **Approve & Create Draft**: Create draft in Gmail (user sends manually)
- **Edit**: Open in compose modal, user modifies, then sends
- **Reject**: Discard draft, optionally cancel the workflow

---

## Section 5: Agent Status Panel

### Access

Click the Agent badge in dashboard header, or `Ctrl+Shift+A`

### Panel Layout

```
┌─────────────────────────────────────────────────────────┐
│  Agent Status                                  [Close]  │
├─────────────────────────────────────────────────────────┤
│  ACTIVE WORKFLOWS (2)                                   │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Investor Brief                                     │ │
│  │ Status: Waiting for Drive update                   │ │
│  │ Trigger: "founders meeting" in Drive               │ │
│  │ Then: Wait 3 days -> Draft email                   │ │
│  │ Created: Jan 5, 2026                    [Cancel]   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Weekly CI Summary                                  │ │
│  │ Status: Ready - draft pending review               │ │
│  │ Trigger: Every Monday 9am                          │ │
│  │ Action: Summarize CI failures -> Draft email       │ │
│  │ Created: Dec 28, 2025           [View Draft]       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  COMPLETED (12)                          [Show History] │
│  CANCELLED (3)                                          │
└─────────────────────────────────────────────────────────┘
```

### Workflow States

| Status | Badge Color | Meaning |
|--------|-------------|---------|
| Waiting | Yellow | Trigger not yet fired |
| Triggered | Blue | Trigger fired, condition pending (e.g., delay) |
| Ready | Green | Draft ready for review |
| Completed | Gray | User approved and executed |
| Cancelled | Red | User cancelled |

### Quick Actions

- **Cancel**: Stop workflow, no further action
- **View Draft**: Jump to approval UI
- **Show History**: Expand completed/cancelled for audit

---

## Section 6: Workflow Creation

### Path 1: Natural Language via TreeBeard

```
User: "When the founders meeting notes appear in Drive,
       wait 3 days then draft an investor brief email"

TB: I'll set up a workflow:
    - Watch: Drive for "founders meeting"
    - Wait: 3 days after it appears
    - Action: Draft investor brief email

    [Confirm Workflow]  [Edit Details]  [Cancel]
```

TreeBeard parses intent and creates workflow definition.

### Path 2: Workflow Builder (Power Users)

Accessed via Agent Status Panel → "New Workflow" button:

```
┌─────────────────────────────────────────────────────────┐
│  New Workflow                                  [Close]  │
├─────────────────────────────────────────────────────────┤
│  NAME: [Investor Brief                              ]   │
│                                                         │
│  WHEN (trigger):                                        │
│  [ ] Schedule: [Every Monday] at [9:00am]               │
│  [*] Tree Update: [Drive] contains [founders meeting]   │
│  [ ] Manual: I'll trigger it myself                     │
│                                                         │
│  THEN (condition):                                      │
│  [*] Immediately                                        │
│  [ ] Wait [3] days after trigger                        │
│                                                         │
│  DO (action):                                           │
│  [*] Draft email using: [investor_brief] template       │
│  [ ] Create calendar event                              │
│  [ ] Just notify me                                     │
│                                                         │
│              [Create Workflow]  [Cancel]                │
└─────────────────────────────────────────────────────────┘
```

**Recommended Path**: Natural language first (lower friction), builder for edge cases.

---

## Section 7: Integration with Existing Systems

### TreeRegistry Extension

```javascript
// Existing TreeRegistry gains dashboard methods
TreeRegistry = {
  ...existing,

  // New dashboard methods
  getDashboardTrees(),           // { gmail, drive, calendar }
  setDashboardTree(role, treeId),
  clearDashboardTree(role),

  // Auto-detect on register
  register(tree) {
    ...existing,
    tree.dashboardRole = detectDashboardRole(tree);
    if (tree.dashboardRole) {
      this.setDashboardTree(tree.dashboardRole, tree.treeId);
    }
  }
}
```

### MCP Bridge Extension

New tools for Claude Code / agents:

```javascript
// Dashboard awareness
mcp__treelisty__get_dashboard_trees()    // list all dashboard trees
mcp__treelisty__get_dashboard_summary()  // AI-ready summary for prompts

// Workflow management
mcp__treelisty__create_workflow(spec)
mcp__treelisty__list_workflows()
mcp__treelisty__cancel_workflow(id)

// Draft management
mcp__treelisty__create_draft(content)
mcp__treelisty__get_pending_drafts()
```

### Storage

**Hybrid Storage Strategy** (addresses quota limits):

```
localStorage (references + small data only)
├── treelisty:dashboard:gmail     → treeId reference
├── treelisty:dashboard:drive     → treeId reference
├── treelisty:dashboard:calendar  → treeId reference
├── treelisty:workflows           → JSON array of workflow definitions
├── treelisty:drafts              → JSON array of pending drafts
└── TreeRegistry                  → metadata only (no payloads)

IndexedDB (via AtlasDB - large payloads)
├── trees/{treeId}                → full tree JSON for dashboard trees
└── nodeIndex/{treeId}/*          → NodeIndex entries for search/preview
```

**TreeStorageAdapter** routes automatically:
- Trees <1MB → localStorage (existing behavior)
- Trees >1MB or dashboardRole set → IndexedDB

### Refresh Scripts

Dashboard trees store their refresh command:
- Gmail: `python scripts/export-gmail.py`
- Drive: `python scripts/export-drive.py`
- Calendar: `python scripts/export-calendar.py` (TBD)

---

## Section 8: Implementation Phases

### Phase 0: Storage Layer Prerequisite ✅ COMPLETE (Build 745)

**CRITICAL: Must complete before dashboard trees** → Done!

**Implemented in Build 745:**
- ✅ `TreeStorageAdapter` interface (lines ~33541-33801)
  - Routes small trees (<1MB) → localStorage
  - Routes large/dashboard trees → IndexedDB
  - Auto-fallback between storage types
- ✅ `AtlasDB` v2 with `tree_payloads` store (line ~33238)
- ✅ `TreeRegistry.getDashboardTrees()` for metadata queries
- ✅ `NodeIndex.getTopNodes(treeId, options)` for lightweight preview (line ~34155)

**Bug fixes applied:**
- Build 787: QuotaExceededError on import now uses TreeStorageAdapter
- Build 793: TreeManager.saveToLocalStorage() uses TreeStorageAdapter
- Build 794: Better error reporting from TreeStorageAdapter.save()

*Deliverable: Storage infrastructure that won't hit quota limits* ✅

**Acceptance test:** Import 10MB Gmail tree → no QuotaExceededError, tree loads correctly. ✅ Verified

### Phase 1: Dashboard Foundation ✅ COMPLETE (Builds 783-784)

**Implemented:**
- ✅ `dashboardRole` property on trees
- ✅ `detectDashboardRole()` auto-detection on import (lines ~32506-32593)
- ✅ `TreeRegistry.getDashboardTrees()` API (line ~32817)
- ✅ `TreeRegistry.setDashboardTree()`, `clearDashboardTree()` methods
- ✅ Dashboard button in header with badge
- ✅ `Ctrl+D` shortcut
- ✅ Storage: `treelisty:dashboard:{role}` → treeId reference

**Additional fixes:**
- Build 784: Migration for existing trees (_migrateDashboardRoles)

*Deliverable: Role-based Quick Access, dashboard modal shows each tree* ✅

**Acceptance test:** Import Gmail/Drive trees → Dashboard modal shows each role + counts + "Open" jumps to correct tree. ✅ Verified

### Phase 2: Morning Dashboard UI ✅ COMPLETE (Builds 785-790)

**Implemented:**
- ✅ Dashboard modal with 3-column layout (line ~14758)
- ✅ Preview cards with unread counts
- ✅ Import buttons for one-time setup (Build 785)
- ✅ MCP-aware Fetch buttons when CC connected (Build 786)
- ✅ Auto-load after import (Build 790)
- ✅ QuotaExceededError handling (Build 787)

*Deliverable: Unified morning view of all dashboard trees* ✅

**Acceptance test:** Dashboard shows counts and previews without loading full trees into memory. ✅ Verified

### Phase 3: External IDs + Merge Refresh (Builds 891-898)

**CRITICAL: Must complete before workflows**

**What exists (Build 872):**
- ✅ Gmail nodes have `threadId` at top level
- ✅ GDrive nodes have `fileId`, `mimeType`, `fileSize` at top level
- ✅ Export scripts already emit these IDs
- ❌ Standardized `external: { type, id }` wrapper - not implemented
- ❌ Merge refresh - current imports replace entire tree

**Decision: Wrap vs. Document?**
Option A: Wrap existing fields in `external: { type: "gmail:thread", id: threadId }`
Option B: Document existing `threadId`/`fileId` as canonical and match on those directly

**Work needed:**
- Standardize external ID format (choose Option A or B)
- Implement merge refresh (not replace):
  - Match by external identity → preserve nodeGuid
  - New external ID → insert new node
  - Missing → soft-delete or mark stale
- Refresh via MCP tool `refresh_dashboard_source(role)` (not hardcoded paths)
- MCP returns patch, not full tree

*Deliverable: Dashboard refresh preserves node identity*

**Acceptance test:** Refresh Gmail twice → same threads keep same nodeGuids.

### Phase 4: AI Summary (Builds 899-906)

- Cross-tree context gathering (via NodeIndex, not full trees)
- AI prompt for daily summary generation
- Actionable suggestion extraction
- Summary display in dashboard header

*Deliverable: "Good morning" AI briefing*

### Phase 5: Agent Infrastructure (Builds 907-916)

**What exists (Build 872):**
- ✅ Triage Agent (`triage_*` MCP tools) - background monitoring pattern
- ✅ TreeBeard Tool Call JSON format (Build 658)
- ❌ `AgentManager` - not implemented
- ❌ Workflow data model

**Integration opportunity:** Extend Triage Agent rather than building parallel infrastructure.

**Work needed:**
- Workflow data model (reuse TreeBeard Tool Call JSON for actions)
- AgentManager core (register, cancel, checkTriggers)
- Trigger matching uses `sourceRole` + `externalType` (not raw nodeId)
- Hook into `setInterval` for trigger checks (**no web workers**)
- **Foreground polling only** (while tab active)
- Agent status badge and panel
- `Ctrl+Shift+A` shortcut

*Deliverable: Workflows can be defined and monitored*

**Acceptance test:** Simulate drive update → matching workflow flips to `triggered`.

### Phase 6: Draft & Approval (Builds 917-924)

**What exists (Build 872):**
- ✅ Gmail draft creation via MCP (`gmail_create_draft`)
- ✅ Gmail draft update/send via MCP
- ❌ Approval UI in dashboard

**Work needed:**
- Draft creation from workflow actions
- Approval UI in dashboard
- **Approve & Create Draft** (not "Send")
- Provenance tracking (sources used with external IDs)

*Deliverable: End-to-end workflow execution with approval*

**Acceptance test:** Workflow produces draft → user can edit and approve → draft created in Gmail.

### Phase 7: Workflow Creation (Builds 925-933)

- TreeBeard natural language parsing
- Workflow builder UI (power users)
- Template system for common patterns

*Deliverable: Users can create their own workflows*

---

## Alignment with Atlas

This design extends the Atlas Cross-Tree Intelligence layer:

| Atlas Concept | Dashboard Trees Extension |
|---------------|---------------------------|
| TreeRegistry | Adds `dashboardRole`, `getDashboardTrees()` |
| Cross-tree references | Workflows reference nodes across trees |
| NodeIndex | Used for trigger matching |
| Immutable treeId/nodeGuid | Required for workflow provenance |

Dashboard Trees is the **first major consumer** of the Atlas infrastructure, proving cross-tree intelligence with real user value.

---

## Assumptions

1. Gmail/Drive exports already exist (or can be produced) with external IDs (threadId, fileId).
2. MCP Bridge can be extended to run refresh commands locally and return results.
3. Dashboard trees are "read-mostly" (users don't hand-edit them much).
4. Node objects can tolerate an added `external` metadata field without breaking existing renderers.
5. Workflows are local-first (localStorage) for V1, not cross-device synced.
6. Export scripts will be updated to emit `external: { type, id }` on each node.
7. IndexedDB is available in target browsers (all modern browsers support it).
8. AtlasDB/NodeIndex (Build 698) can be extended to store full tree payloads.

---

## Risks & Mitigations

### Risk 1: ID Instability Breaks Workflows

**Failure path:** Ship "replace tree on refresh", build workflows, everything breaks when next import changes IDs.

**Mitigation:** Phase 3 (External IDs + Merge) is marked CRITICAL and must complete before Phase 5 (Agent Infrastructure).

### Risk 2: Background Agents Don't Run Reliably

**Failure path:** "Background agents" don't run reliably in browser, users lose trust.

**Mitigation:** Foreground-only language in UI. True background execution only via MCP Bridge (documented as optional enhancement).

### Risk 3: Dashboard Becomes Second Product

**Failure path:** Dashboard becomes a "second product UI" with endless edge cases.

**Mitigation:** V1 is a modal (not a view mode) + three preview columns + single draft review surface. Resist scope creep.

### Risk 4: Refresh Failures Break Trust

**Failure path:** MCP Bridge not running, refresh fails silently, user sees stale data.

**Mitigation:** Show toast on refresh failure + keep last known dashboard content + visual "stale" indicator.

### Risk 5: Storage Quota Exceeded (Gemini)

**Failure path:** Large Gmail trees exceed localStorage 5MB limit, causing data loss.

**Mitigation:** Phase 0 implements TreeStorageAdapter routing large trees to IndexedDB. Dashboard trees always use IndexedDB regardless of size.

### Risk 6: Memory Bloat Crashes Browser (Gemini)

**Failure path:** Dashboard loads three full trees into memory, causing OOM on low-end devices.

**Mitigation:** Dashboard UI reads from NodeIndex metadata only. Full tree hydration only on explicit "Open" action.

---

## Success Benchmark

> In <10 seconds, user opens Dashboard, sees "3 things that matter today," and can approve a prepared draft without hunting across trees.

---

## Open Questions

1. **Calendar tree**: Export script TBD - Google Calendar API integration
2. **Polling frequency**: 15 min default while tab active, configurable?
   - *Note:* Triage Agent (Build 795) uses 5-minute default, configurable via `triage_config`
3. **Workflow limits**: Max active workflows? localStorage size limits?
4. **Offline behavior**: What happens when dashboard refresh fails? (See Risk 4)
5. **MCP Bridge required?**: Can dashboard work at all without MCP, or is it MCP-required?
   - *Clarification:* Dashboard can show stale data without MCP. Refresh requires MCP.
6. **External ID format**: Wrap in `external: {}` or use existing `threadId`/`fileId` directly? (See Phase 3)

---

*Last updated: 2026-01-18 (v4 - Build 872 current state assessment)*
