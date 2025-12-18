# Treebeard PM Assistant Design

**Date:** 2025-12-18
**Status:** Design approved, ready for implementation

## Overview

Transform Treebeard into a full PM assistant that can execute Gantt commands, understand schedule context, teach PM concepts, and proactively identify schedule issues.

---

## Goals

1. **Command execution** - Treebeard performs Gantt actions ("show critical path", "switch to week view", "zoom to fit")
2. **Contextual awareness** - Treebeard understands current schedule state and offers relevant suggestions
3. **Teaching/guidance** - Treebeard explains PM concepts inline with brief definitions
4. **Proactive analysis** - Treebeard notices schedule risks and gently nudges the user

---

## Architecture

### 1. GANTT_CONTEXT Injection

When the user has schedule data (any node with `pmStartDate` or `pmDueDate`), a context block is injected into Treebeard's messages:

**Quick Mode (~50 tokens):**
```
📊 12 tasks, 2 overdue, critical path 45 days
```

**Deep Mode (~200 tokens):**
```
📊 SCHEDULE ANALYSIS:
- Total: 12 tasks (3 Done, 7 In Progress, 2 Not Started)
- Overdue: Design Review (3 days), QA Sign-off (1 day)
- Critical path: 45 days (Design → Dev → Test → QA → Deploy)
- Slack distribution: 4 tasks with 0 slack, 3 with <5 days
- Dependencies: 8 total (6 FS, 1 SS, 1 FF)
- Risks: QA Sign-off is overdue AND on critical path ⚠️
```

### 2. Gantt Command Set

New commands added to `COMMAND_REGISTRY` (see Command Specifications below).

### 3. Smart Response Templates

Analysis commands return context-rich responses that teach as they inform:
```
gantt_critical_path →
"Critical path: Design → Dev → Test → Deploy (45 days)
These 4 tasks have 0 slack - any delay extends the project.
Longest task: Development (20 days)"
```

---

## Quick vs Deep Mode

**Quick Mode (default):**
- Minimal schedule context (~50 tokens)
- Brief command responses
- No proactive nudges
- Fast, cheap, stays out of the way

**Deep Mode (user toggles or asks "analyze my schedule"):**
- Full schedule analysis (~200 tokens)
- Educational, detailed responses
- Proactive nudges enabled
- Thorough analysis, higher token usage

---

## Command Specifications

### View Commands

| Command | Args | Action |
|---------|------|--------|
| `view_gantt` | none | Switch to Gantt view, return task count |
| `gantt_view_mode` | `day\|week\|month\|year` | Change time scale |
| `gantt_zoom_in` | none | Zoom +25% |
| `gantt_zoom_out` | none | Zoom -25% |
| `gantt_fit_all` | none | Fit entire chart to viewport |
| `gantt_today` | none | Scroll to today's date |
| `gantt_toggle_critical_path` | none | Toggle critical path highlighting |
| `gantt_toggle_readonly` | none | Toggle edit mode |

### Navigation Commands

| Command | Args | Action |
|---------|------|--------|
| `gantt_select` | `task name or partial` | Find task, select it, open info panel |
| `gantt_next_critical` | none | Cycle to next critical path task |
| `gantt_focus_overdue` | none | Select first overdue task |

### Analysis Commands

| Command | Args | Returns |
|---------|------|---------|
| `gantt_summary` | none | Overall schedule health + key stats |
| `gantt_critical_path` | none | Critical path breakdown with slack info |
| `gantt_overdue` | none | List of overdue tasks with days late |
| `gantt_blockers` | none | Tasks blocking the most downstream work |
| `gantt_slack` | `task name` (optional) | Slack analysis for task or all tasks |
| `gantt_dependencies` | `task name` | Show what task depends on and what depends on it |

### Edit Commands

| Command | Args | Action |
|---------|------|--------|
| `gantt_set_dates` | `task name`, `start`, `end` | Update task start/end dates |
| `gantt_set_start` | `task name`, `date` | Update start date only |
| `gantt_set_end` | `task name`, `date` | Update end date only |
| `gantt_set_duration` | `task name`, `days` | Set duration (adjusts end date) |
| `gantt_set_progress` | `task name`, `0-100` | Update progress percentage |
| `gantt_set_status` | `task name`, `status` | Set status (Not Started/In Progress/Done/Blocked) |
| `gantt_add_dependency` | `from`, `to`, `type`, `lag` | Create dependency (type: FS/SS/FF/SF, lag optional) |
| `gantt_remove_dependency` | `from`, `to` | Remove dependency between tasks |
| `gantt_mark_done` | `task name` | Shortcut: set progress 100%, status Done |
| `gantt_mark_blocked` | `task name`, `reason` | Set status Blocked, add reason to notes |

All edit commands:
- Check `ganttReadOnly` flag first, warn if enabled
- Call `saveState()` for undo support
- Return confirmation with what changed

---

## Context Injection

### When to Inject Schedule Context

`getScheduleContext()` runs when **any** of these are true:
1. User is in Gantt view (`viewMode === 'gantt'`)
2. User's message mentions schedule keywords: "schedule", "deadline", "overdue", "critical path", "dependency", "gantt", "timeline"
3. Tree has schedule data AND user asks about tasks/project status

### Context Generation Function

```javascript
function getScheduleContext(deep = false) {
    const tasks = getAllTasksWithDates();
    const overdue = tasks.filter(t => isOverdue(t));
    const critical = dependencyEngine.calculateCriticalPath(capexTree);

    if (!deep) {
        // Quick mode: ~50 tokens
        return `📊 ${tasks.length} tasks, ${overdue.length} overdue, critical path ${critical.duration} days`;
    }

    // Deep mode: ~200 tokens
    return `📊 SCHEDULE ANALYSIS:
- Total: ${tasks.length} tasks (${countByStatus(tasks)})
- Overdue: ${formatOverdue(overdue)}
- Critical path: ${critical.duration} days (${critical.nodes.map(n => n.name).join(' → ')})
- Risks: ${identifyRisks(tasks, critical)}`;
}
```

---

## Proactive Nudges

### Nudge Conditions (Deep Mode Only)

| Condition | Nudge |
|-----------|-------|
| Tasks overdue | "I notice {n} tasks are overdue. Want me to list them?" |
| Critical task overdue | "⚠️ {task} is overdue and on the critical path - this affects your end date." |
| Circular dependency detected | "⚠️ I found a dependency loop: A → B → C → A. Want me to help fix it?" |
| Task with 0 slack starting soon | "{task} starts in 2 days with 0 slack. Any delay impacts the project." |

### Nudge Behavior

- Nudges appear **once per session** per issue (tracked in `treebeardNudges` Set)
- Default: **enabled** (opt-out via settings)
- Setting: "Treebeard proactive hints" checkbox in Settings modal
- Storage: `localStorage.setItem('treebeardNudgesEnabled', 'true')`

---

## PM Knowledge

### Core Concepts Treebeard Understands

| Concept | Treebeard's Understanding |
|---------|---------------------------|
| **Critical Path** | The longest chain of dependent tasks. Delays here delay the whole project. |
| **Slack/Float** | How many days a task can slip without affecting the end date. 0 slack = critical. |
| **FS (Finish-to-Start)** | B can't start until A finishes. Most common type. |
| **SS (Start-to-Start)** | B can't start until A starts. Tasks run in parallel. |
| **FF (Finish-to-Finish)** | B can't finish until A finishes. End together. |
| **SF (Start-to-Finish)** | B can't finish until A starts. Rare, used for just-in-time. |
| **Lag** | Wait time between linked tasks. +2 lag = wait 2 days after dependency met. |
| **Lead** | Negative lag. -2 = start 2 days before dependency normally allows. |
| **Milestone** | Zero-duration marker. A checkpoint, not work. |
| **Baseline** | Original plan to compare against. "We're 5 days behind baseline." |
| **Overdue** | End date is past and status isn't Done. |
| **Blocked** | Can't proceed due to external issue, not just waiting on dependency. |

### Inline Teaching

When Treebeard uses a concept, it explains briefly:

> "Design → Development is a **Finish-to-Start** dependency, meaning Dev can't begin until Design completes."

> "Testing has **3 days of slack** - it could slip 3 days without affecting your deadline."

### Teaching Triggers

Treebeard adds explanations when:
1. User explicitly asks ("what is slack?")
2. User seems confused ("why can't I move this task earlier?")
3. First time showing a concept in the session (tracks `treebeardExplained` Set)

No repeated explanations within a session.

---

## Implementation Plan

### Phase 1: Foundation (Build 485)
**Add Gantt commands to COMMAND_REGISTRY**

- Add all view/navigation commands
- Wire to existing functions: `toggleGanttView()`, `applyGanttZoom()`, etc.
- Test: "switch to gantt", "zoom in", "show critical path"

### Phase 2: Analysis Commands (Build 486)
**Smart read-only analysis with rich responses**

- `gantt_summary`, `gantt_critical_path`, `gantt_overdue`, `gantt_blockers`, `gantt_slack`
- Each returns educational, formatted text
- Uses existing `dependencyEngine.calculateCriticalPath()`

### Phase 3: Edit Commands (Build 487)
**Task modification with undo support**

- `gantt_set_dates`, `gantt_set_progress`, `gantt_set_status`
- `gantt_add_dependency`, `gantt_remove_dependency`
- All call `saveState()` before changes
- Check `ganttReadOnly` flag

### Phase 4: Context Injection (Build 488)
**Schedule-aware Treebeard**

- Add `getScheduleContext(deep)` function
- Inject into Treebeard prompt when conditions met
- Add Quick/Deep mode toggle to chat UI
- Add "Proactive hints" setting checkbox

### Phase 5: Proactive Nudges (Build 489)
**Gentle warnings for schedule issues**

- Detect overdue, critical path risks, circular deps
- Track shown nudges in `treebeardNudges` Set
- Respect settings checkbox

---

## Files to Modify

- `treeplexity.html` - All changes (single-file app)
  - COMMAND_REGISTRY section (~line 51450)
  - Treebeard chat handler
  - Settings modal HTML
  - New helper functions for schedule analysis

---

## Success Criteria

- [ ] User can say "switch to gantt view" and Treebeard does it
- [ ] User can say "what's my critical path?" and get a useful answer
- [ ] User can say "mark Design as done" and Treebeard updates the task
- [ ] Treebeard notices overdue tasks and mentions them (Deep mode)
- [ ] User can disable proactive hints in settings
- [ ] PM concepts are explained inline without being repetitive
