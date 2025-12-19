# Calendar View Design

**Date:** 2025-12-19
**Status:** Design draft

## Overview

Add a Calendar view to TreeListy that surfaces existing date data from trees, providing time-based visualization and enabling AI context awareness for date-related interactions.

---

## Design Principles

1. **Minimal code disruption** - Reuse existing date fields, don't restructure data model
2. **Feature isolation** - Calendar view is additive, doesn't modify other views' behavior
3. **Graceful degradation** - Trees without dates show empty calendar, no errors
4. **Iterative enhancement** - MVP first, expand based on real usage patterns

---

## Existing Date Fields (No Changes Needed)

These fields already exist across patterns:

| Field | Used By | Purpose |
|-------|---------|---------|
| `pmStartDate` | All patterns | Task/item start date |
| `pmDueDate` | All patterns | Task/item deadline |
| `pmDuration` | All patterns | Duration in days |
| `eventDate` | lifetree | Life event date |
| `birthDate` | familytree, lifetree | Birth date |
| `deathDate` | familytree, lifetree | Death date |
| `marriageDate` | familytree | Marriage date |
| `expectedCloseDate` | sales | Deal close date |
| `bookingDeadline` | event | Vendor booking deadline |

Calendar view reads these fields - no schema changes required.

---

## MVP Scope (Phase 1)

### Calendar View Basics

- Fifth view option alongside Tree/Canvas/3D/Gantt
- Month view as default (simplest, most useful)
- Week view toggle
- Click calendar event to select node and show info panel
- Respects current pattern's date fields

### Rendering Logic

```javascript
function getCalendarEvents() {
    const events = [];

    walkTree(capexTree, (node) => {
        // Pattern-specific date extraction
        const dates = getNodeDates(node);

        dates.forEach(d => {
            events.push({
                id: node.id,
                title: node.name,
                date: d.date,
                type: d.type, // 'start', 'due', 'event', 'birth', etc.
                color: getPhaseColor(node),
                node: node
            });
        });
    });

    return events;
}

function getNodeDates(node) {
    const dates = [];
    const pattern = capexTree.pattern?.key || 'generic';

    // Universal PM dates
    if (node.pmStartDate) dates.push({ date: node.pmStartDate, type: 'start' });
    if (node.pmDueDate) dates.push({ date: node.pmDueDate, type: 'due' });

    // Pattern-specific
    if (pattern === 'lifetree' || pattern === 'familytree') {
        if (node.eventDate) dates.push({ date: node.eventDate, type: 'event' });
        if (node.birthDate) dates.push({ date: node.birthDate, type: 'birth' });
        if (node.deathDate) dates.push({ date: node.deathDate, type: 'death' });
    }
    if (pattern === 'sales' && node.expectedCloseDate) {
        dates.push({ date: node.expectedCloseDate, type: 'close' });
    }
    if (pattern === 'event' && node.bookingDeadline) {
        dates.push({ date: node.bookingDeadline, type: 'deadline' });
    }

    return dates;
}
```

### UI Integration

- Add "Calendar" to view dropdown (after Gantt)
- Reuse existing view switching logic (`viewMode = 'calendar'`)
- Calendar container div, hidden by default like other views
- Mobile: Calendar available in view dropdown like Canvas/3D/Gantt

### Library Choice

**Option A: FullCalendar.js (Recommended)**
- MIT license, can inline like Frappe Gantt
- Month/week/day views built-in
- Event click handlers
- Responsive
- ~40KB minified

**Option B: Custom grid**
- Full control, smaller footprint
- More work, less features
- Consider if FullCalendar is too heavy

---

## AI Context Injection (Phase 2)

### When to Inject Calendar Context

Similar to Gantt context injection in Treebeard:

1. User is in Calendar view
2. User's message mentions dates, time periods, scheduling
3. Pattern is date-heavy (lifetree, event, sales, capex)

### Context Format

**Quick mode (~50 tokens):**
```
📅 23 dated events, 3 this week, 2 overdue
```

**Deep mode (~200 tokens):**
```
📅 CALENDAR CONTEXT:
- Viewing: March 1965
- Events this month: Graduated college (Mar 15), Started first job (Mar 22)
- Nearby: Father's death (Feb 1965), Marriage (Jun 1965)
- Pattern: lifetree (biographical timeline)
```

### LifeTree-Specific AI Enhancement

For biographical trees, inject temporal context:

```javascript
function getLifeTreeContext(focusDate) {
    const age = calculateAge(capexTree.birthDate, focusDate);
    const nearbyEvents = getEventsNearDate(focusDate, 6); // 6 months window

    return `Subject was ${age} years old.
    Recent events: ${nearbyEvents.map(e => e.name).join(', ')}`;
}
```

This lets the biographer AI ask better questions: "You started your career at 22, right after graduating. What drove that quick transition?"

---

## Impact Assessment

### Views Affected

| View | Impact | Notes |
|------|--------|-------|
| Tree | None | No changes |
| Canvas | None | No changes |
| 3D | None | No changes |
| Gantt | None | Calendar is separate, both can show same date data |

### Functions Affected

| Function | Change | Risk |
|----------|--------|------|
| `render()` | Add calendar case to view switch | Low - additive |
| View dropdown | Add Calendar option | Low - additive |
| `viewMode` handling | Add 'calendar' value | Low - existing pattern |
| Mobile nav | Add calendar to screen options | Low - follows existing mobile view pattern |
| Share URL state | Include calendar view state | Low - extends existing |

### Data Model

**No changes required.** Calendar reads existing date fields.

Future phases may add:
- `calendarColor` per node (optional override)
- `isRecurring` + `rrule` for recurring events
- `eventTime` for time-of-day (currently date-only)

---

## Pattern-Specific Behavior

### Strong Calendar Patterns

**LifeTree**
- Default to decade/year navigation (life spans are long)
- Birth date as anchor point
- Age calculation shown on events
- Historical context injection for AI

**Event**
- Countdown to event date
- Deadline highlighting
- Cascade warnings ("venue booking due in 3 days")

**Fitness**
- Training block visualization
- Rest day gaps
- Progressive overload timeline

**Sales**
- Close date clustering
- Pipeline over time
- Follow-up reminders

**CAPEX/Generic**
- Milestone view
- Deadline tracking
- Dependency-aware (critical path items highlighted)

### Weak Calendar Patterns

**Philosophy, Dialogue, Prompting, Filesystem**
- Calendar available but likely empty
- No special behavior
- Could show file modification dates for filesystem if desired

---

## Implementation Phases

### Phase 1: Basic Calendar View (Build 494-495)
- Add Calendar to view dropdown
- Inline FullCalendar.js (or custom grid)
- Render events from existing date fields
- Click event to select node
- Month/week toggle

### Phase 2: AI Context (Build 496)
- `getCalendarContext()` function
- Inject into Treebeard when relevant
- Pattern-aware context formatting

### Phase 3: LifeTree Enhancement (Build 497)
- Age calculation on events
- Decade navigation for long timelines
- Enhanced biographer context

### Phase 4: Pattern-Specific Polish (Build 498+)
- Event countdown mode
- Sales pipeline calendar view
- Fitness training blocks
- Based on usage feedback

---

## Files to Modify

- `treeplexity.html`
  - Add FullCalendar.js inline (like Frappe Gantt) OR custom calendar grid
  - Add calendar container HTML
  - Add calendar CSS (dark theme compatible)
  - Add `renderCalendar()` function
  - Update view dropdown
  - Update `viewMode` handling
  - Update mobile navigation

---

## Open Questions

1. **FullCalendar vs custom?** - FullCalendar is faster to implement, custom is lighter weight. Recommend FullCalendar for MVP, can replace later if needed.

2. **Time-of-day support?** - Currently dates only. Add in future phase if users need it.

3. **Recurring events?** - Not in MVP. Add rrule support later for fitness/course patterns.

4. **External calendar sync?** - Google Calendar/Outlook integration is a larger project. Defer to future.

---

## Success Criteria

- [ ] Calendar view renders for any tree with dated nodes
- [ ] Empty calendar shows gracefully for trees without dates
- [ ] Click event navigates to node
- [ ] Month/week toggle works
- [ ] Mobile calendar is usable
- [ ] No regressions in other views
- [ ] AI can reference calendar context when relevant (Phase 2)
