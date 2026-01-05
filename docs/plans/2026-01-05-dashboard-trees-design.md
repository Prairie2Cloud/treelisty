# Dashboard Trees: Cross-Tree Agentic Workflows

**Date:** 2026-01-05
**Status:** Approved Design
**Priority:** Strategic Feature
**Extends:** Atlas Cross-Tree Intelligence

---

## Executive Summary

Dashboard Trees are external data source trees (Gmail, Drive, Calendar) that serve as the foundation for daily data processing workflows. This design introduces:

1. **Morning Dashboard** - Unified view of all dashboard trees with AI summary
2. **Agentic Workflows** - Background agents that monitor, wait, and act across trees
3. **Auto-Draft with Approval** - AI prepares actions, user reviews and approves

**Key Use Case:**
> AI notices a founders meeting on Calendar, waits for meeting notes to appear in Drive, then 3 days later drafts an investor brief email for user approval.

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
│  [Approve & Send]  [Edit]  [Reject]                     │
└─────────────────────────────────────────────────────────┘
```

### Actions

- **Approve & Send**: Execute immediately (send email, create event)
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

```
localStorage
├── treelisty:dashboard:gmail     -> treeId of active Gmail tree
├── treelisty:dashboard:drive     -> treeId of active Drive tree
├── treelisty:dashboard:calendar  -> treeId of active Calendar tree
├── treelisty:workflows           -> JSON array of workflow definitions
└── treelisty:drafts              -> JSON array of pending drafts
```

### Refresh Scripts

Dashboard trees store their refresh command:
- Gmail: `python scripts/export-gmail.py`
- Drive: `python scripts/export-drive.py`
- Calendar: `python scripts/export-calendar.py` (TBD)

---

## Section 8: Implementation Phases

### Phase 1: Dashboard Foundation (Builds 745-750)

- `dashboardRole` property on trees
- Auto-detect on import (Gmail, Drive, Calendar)
- `TreeRegistry.getDashboardTrees()` API
- Dashboard button in header → simple launcher (links to each tree)
- Storage: `treelisty:dashboard:{role}` keys

*Deliverable: Quick Access buttons become role-based, not name-based*

### Phase 2: Morning Dashboard UI (Builds 751-758)

- Dashboard modal/view with 3-column layout
- Preview cards showing top items per source
- Auto-refresh on open
- Unread/recent counts
- `Ctrl+D` shortcut

*Deliverable: Unified morning view of all dashboard trees*

### Phase 3: AI Summary (Builds 759-765)

- Cross-tree context gathering
- AI prompt for daily summary generation
- Actionable suggestion extraction
- Summary display in dashboard header

*Deliverable: "Good morning" AI briefing*

### Phase 4: Agent Infrastructure (Builds 766-775)

- Workflow data model and storage
- AgentManager core (register, cancel, checkTriggers)
- Background polling mechanism
- Agent status badge and panel

*Deliverable: Workflows can be defined and monitored*

### Phase 5: Draft & Approval (Builds 776-785)

- Draft creation from workflow actions
- Approval UI in dashboard
- Email draft integration with Gmail
- Provenance tracking (sources used)

*Deliverable: End-to-end workflow execution with approval*

### Phase 6: Workflow Creation (Builds 786-795)

- TreeBeard natural language parsing
- Workflow builder UI
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

## Open Questions

1. **Calendar tree**: Export script TBD - Google Calendar API integration
2. **Polling frequency**: 15 min default, but should this be user-configurable?
3. **Workflow limits**: Max active workflows? Storage limits?
4. **Offline behavior**: What happens when dashboard refresh fails?

---

*Last updated: 2026-01-05*
