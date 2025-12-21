# TreeListy OS: Personal Command Center Design

**Date:** 2025-12-21
**Status:** Draft
**Vision:** TreeListy as a unified dashboard aggregating Gmail, Drive, Calendar, News, Social Media into a hierarchical command center.

---

## Executive Summary

Transform TreeListy from a project management tool into a **Personal Command Center** - a "Quick OS" that presents all incoming digital information as a navigable tree structure. Users start their day with a dashboard showing today's emails, calendar events, file changes, news, and social updates.

The key innovation: **Claude Chrome as the universal data connector** - no API keys, no OAuth setup, just uses the browser's existing logged-in sessions.

---

## Core Concept

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TreeListy Command Center                          │
│                                                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│   │    Gmail     │  │   Calendar   │  │    Drive     │  │    News    │  │
│   │   📧 (12)    │  │   📅 (4)     │  │   📁 (3)     │  │   📰 (8)   │  │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│          │                 │                 │                 │         │
│          └─────────────────┴─────────────────┴─────────────────┘         │
│                                    │                                     │
│                                    ▼                                     │
│                        ┌─────────────────────┐                          │
│                        │   Daily Dashboard   │                          │
│                        │   (Unified Tree)    │                          │
│                        └─────────────────────┘                          │
│                                                                          │
│   Powered by: MCP Bridge ↔ Claude Code ↔ Claude Chrome                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Data Flow

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    TreeListy    │   MCP   │   Claude Code   │  Chrome │   Web Services  │
│    (Browser)    │ ──────► │     (CLI)       │ ──────► │                 │
│                 │         │                 │         │  Gmail.com      │
│  Dashboard UI   │         │  Task executor  │         │  Drive.google   │
│  Inbox review   │ ◄────── │  Data structurer│ ◄────── │  Calendar.google│
│  Tree views     │ results │                 │  data   │  News sites     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Why Claude Chrome?

| Traditional Approach | Claude Chrome Approach |
|---------------------|------------------------|
| OAuth credentials per service | Uses browser's existing logins |
| API rate limits | Normal browsing patterns |
| Complex auth flows | Zero setup |
| Limited to APIs | Full web UI access |
| Structured data only | AI understands context |

### MCP Task Protocol

TreeListy dispatches sync tasks via MCP. Claude Code claims and executes:

```javascript
// TreeListy dispatches
{ type: "sync", service: "gmail", options: { maxItems: 50 } }

// Claude Code receives via tasks.claimNext()
// Claude Code uses Chrome to navigate to Gmail
// Claude Code returns structured data via tasks.complete()
{
  taskId: "...",
  proposed_ops: [
    { op: "create_node", parentId: "gmail-inbox", data: { name: "Re: Meeting", ... } },
    { op: "create_node", parentId: "gmail-inbox", data: { name: "Newsletter", ... } }
  ],
  summary: "Found 12 new emails, 3 marked urgent"
}
```

---

## Service Integrations

### Phase 1: Google Workspace (Foundation)

#### Gmail
- **Read:** Inbox, threads, labels, attachments
- **Actions:** Archive, label, star, mark read/unread, draft reply
- **Pattern:** `gmail` (existing)
- **Dashboard nodes:** Unread count, urgent items, threads needing reply

#### Google Calendar
- **Read:** Today's events, upcoming week, recurring events
- **Actions:** Create event, RSVP, reschedule (with approval)
- **Pattern:** Uses date fields in any pattern
- **Dashboard nodes:** Today's schedule, upcoming meetings, conflicts

#### Google Drive
- **Read:** Recent files, shared with me, folder structure
- **Actions:** Open file, view comments, organize
- **Pattern:** `filesystem` (existing)
- **Dashboard nodes:** Recently modified, pending comments, shared updates

### Phase 2: Information Feeds

#### News
- **Sources:** RSS feeds, Google News, curated sites
- **Read:** Headlines, summaries, full articles
- **Actions:** Save to tree, mark read, share
- **Pattern:** `knowledge-base`
- **Dashboard nodes:** Top stories, category breakdowns

#### Social Media (Future)
- **Twitter/X:** Mentions, DMs, trending
- **LinkedIn:** Messages, notifications, feed
- **Pattern:** TBD
- **Dashboard nodes:** Notifications, messages needing response

### Phase 3: Productivity Tools (Future)

- **Slack/Discord:** Channels, DMs, mentions
- **GitHub:** PRs, issues, notifications
- **Notion:** Updates, mentions
- **Todoist/Asana:** Tasks due today

---

## Dashboard Pattern

A new TreeListy pattern specifically for daily dashboards:

```javascript
{
  key: "dashboard",
  name: "Daily Dashboard",
  icon: "🎯",
  description: "Aggregated view of today's digital life",
  fields: {
    date: { label: "Date", type: "date" },
    syncStatus: { label: "Last Sync", type: "text" },
    urgentCount: { label: "Urgent Items", type: "number" },
    unreadCount: { label: "Unread", type: "number" }
  },
  sections: [
    { id: "gmail", name: "📧 Email", service: "gmail", maxItems: 20 },
    { id: "calendar", name: "📅 Calendar", service: "calendar", maxItems: 10 },
    { id: "drive", name: "📁 Files", service: "drive", maxItems: 10 },
    { id: "news", name: "📰 News", service: "news", maxItems: 10 }
  ]
}
```

### Dashboard View Mode

New view mode alongside Tree, Canvas, 3D, Gantt, Calendar:

```
┌─────────────────────────────────────────────────────────────────┐
│  [Tree] [Canvas] [3D] [Gantt] [Calendar] [Dashboard*]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ 📧 Gmail      (12)  │  │ 📅 Today      (4)   │               │
│  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │               │
│  │ │🔴 Urgent: ...   │ │  │ │ 09:00 Standup   │ │               │
│  │ │📩 Newsletter    │ │  │ │ 11:00 Call ⚠️   │ │               │
│  │ │💬 Reply: ...    │ │  │ │ 14:00 Review    │ │               │
│  │ └─────────────────┘ │  │ └─────────────────┘ │               │
│  │ [Open Gmail] [Sync] │  │ [Open Calendar]     │               │
│  └─────────────────────┘  └─────────────────────┘               │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ 📁 Drive      (3)   │  │ 📰 News       (5)   │               │
│  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │               │
│  │ │📘 Q1 Doc edited │ │  │ │ Tech: AI news   │ │               │
│  │ │📗 Budget - 3 💬 │ │  │ │ World: ...      │ │               │
│  │ └─────────────────┘ │  │ └─────────────────┘ │               │
│  │ [Open Drive]        │  │ [More Stories]      │               │
│  └─────────────────────┘  └─────────────────────┘               │
│                                                                  │
│  Last synced: 2 min ago                    [🔄 Sync All]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Treebeard Integration

Treebeard becomes the AI assistant for the entire command center:

### Dashboard Commands
- `sync gmail` / `sync all` - Trigger service sync
- `what's urgent today?` - Summarize high-priority items
- `any meetings this afternoon?` - Calendar queries
- `show emails from [person]` - Filtered views
- `draft reply to [thread]` - AI-assisted email

### Cross-Service Intelligence
- "Remind me about the project deadline in my calendar"
- "Find the doc Sarah mentioned in her email"
- "What happened this week across all my channels?"

### Proactive Notifications
- "You have a meeting in 15 minutes"
- "3 urgent emails need responses"
- "Project deadline is tomorrow - 2 tasks incomplete"

---

## Implementation Phases

### Phase 1: Foundation (Current Sprint)
- [x] MCP Bridge with task dispatch
- [x] Inbox UI for proposed operations
- [ ] Treebeard commands: `sync gmail`, `sync drive`, `sync calendar`
- [ ] Claude Code task handler for Chrome-based sync
- [ ] Basic Gmail read (inbox, threads)

### Phase 2: Full Google Workspace
- [ ] Gmail actions (archive, label, draft)
- [ ] Calendar read + create events
- [ ] Drive file listing + open
- [ ] Dashboard pattern definition
- [ ] Dashboard view mode

### Phase 3: Enhanced Dashboard
- [ ] Widget-style dashboard layout
- [ ] Configurable sections/services
- [ ] Auto-refresh scheduling
- [ ] Notification badges in header

### Phase 4: Information Feeds
- [ ] News aggregation (RSS, Google News)
- [ ] Social media notifications
- [ ] Unified search across services

### Phase 5: Advanced Features
- [ ] Offline mode with sync queue
- [ ] Mobile dashboard view
- [ ] Custom integrations via MCP plugins
- [ ] Workflow automation (IFTTT-style)

---

## Technical Considerations

### Performance
- Incremental sync (only fetch changes)
- Background refresh (Web Workers)
- Caching layer for offline access
- Lazy loading for large inboxes

### Privacy & Security
- All data stays local (browser + Claude Code)
- No server-side storage of credentials
- User controls what syncs
- Dangerous actions require approval (Inbox pattern)

### Error Handling
- Service unavailable → show last cached data
- Auth expired → prompt to re-authenticate in Chrome
- Rate limited → exponential backoff

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Sync latency (Gmail 50 items) | < 10 seconds |
| Dashboard load time | < 2 seconds |
| User actions to check all services | 1 (dashboard view) |
| Services supported | 5+ |
| Daily active usage | Check dashboard every morning |

---

## Open Questions

1. **Claude Chrome rate limits?** - Need to test sustained usage
2. **Multi-account support?** - Gmail personal + work accounts
3. **Notification persistence?** - Browser notifications when dashboard closed?
4. **Mobile experience?** - Claude Chrome is desktop-only

---

## Appendix: Service-Specific Schemas

### Gmail Thread Node
```javascript
{
  id: "gmail-thread-abc123",
  type: "item",
  name: "Re: Q1 Planning Meeting",
  icon: "📧",
  pattern: { key: "gmail" },
  threadId: "abc123",
  from: "sarah@example.com",
  subject: "Re: Q1 Planning Meeting",
  snippet: "Thanks for the update. I'll review...",
  date: "2025-12-21T10:30:00Z",
  labels: ["inbox", "important"],
  unread: true,
  hasAttachments: false,
  messageCount: 5,
  webUrl: "https://mail.google.com/mail/u/0/#inbox/abc123"
}
```

### Calendar Event Node
```javascript
{
  id: "cal-event-xyz789",
  type: "item",
  name: "Team Standup",
  icon: "📅",
  startDate: "2025-12-21T09:00:00Z",
  endDate: "2025-12-21T09:30:00Z",
  location: "Zoom",
  attendees: ["alice@example.com", "bob@example.com"],
  status: "confirmed",
  webUrl: "https://calendar.google.com/event?eid=xyz789"
}
```

### Drive File Node
```javascript
{
  id: "drive-file-def456",
  type: "item",
  name: "Q1 Planning Doc",
  icon: "📘",
  mimeType: "application/vnd.google-apps.document",
  fileUrl: "https://docs.google.com/document/d/def456",
  lastModified: "2025-12-21T08:45:00Z",
  modifiedBy: "sarah@example.com",
  commentCount: 3,
  shared: true
}
```

---

*Document created: 2025-12-21*
*Vision: TreeListy as Personal Command Center / Quick OS*
