# Pivot-Style Hyperedges Design

**Date:** 2025-12-06
**Status:** Approved for Implementation
**Target:** Build 361+

---

## Overview

Transform hyperedges from static visual groupings into intelligent, pivot-table-style connections that auto-detect patterns, respond to queries, and display live aggregates.

**Current state:** Hyperedges are manually-created colored blobs connecting nodes. No intelligence, often show "undefined" labels.

**Future state:** Smart hyperedges that suggest groupings, answer queries like "show me all items over $500K", and display live totals.

---

## Three Phases (All in One Build)

### Phase A: Smart Auto-Grouping (Opt-in)

**How it works:**
1. Detection runs silently when tree loads or data changes
2. Suggestions appear in Hyperedges panel under "Suggested"
3. User clicks a suggestion to create permanent hyperedge
4. Dismissed suggestions don't reappear (stored in localStorage)

**Universal Detection Rules (All Patterns):**

| Rule | Trigger | Suggested Name | Color |
|------|---------|----------------|-------|
| Status cluster | 3+ items share same `pmStatus` | "{Status} Items" | Status-based |
| Assignee cluster | 2+ items share `pmAssignee` | "{Name}'s Items" | Generated |
| Priority cluster | 3+ items share `pmPriority` | "{Priority} Priority" | Priority-based |
| Blocked items | Items with incomplete dependencies | "Blocked Items" | Orange |
| Overdue | Items past `dueDate` | "Overdue" | Red |

**Pattern-Specific Detection Rules:**

| Pattern | Extra Rules |
|---------|-------------|
| **CAPEX** | Cost tiers (>$1M, >$500K, >$100K), vendor clusters, lead time ranges |
| **Philosophy** | Philosopher names, argument vs counter-argument, time periods |
| **Sales** | Deal stage clusters, probability tiers, close date ranges |
| **Film** | Character clusters, location clusters, scene types |
| **Generic** | Universal rules only |

**UI: Suggestions in Hyperedges Panel**

```
┌─────────────────────────────────────┐
│ 🔗 Hyperedges (2)              [+]  │
├─────────────────────────────────────┤
│ 💡 Suggested Groupings              │
│ ┌─────────────────────────────────┐ │
│ │ 👤 Sarah's Items (4)       [+]  │ │
│ │ ⚠️ Blocked Items (2)       [+]  │ │
│ │ 💰 High Cost >$1M (3)      [+]  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ✓ My Custom Edge (3 nodes)     🎯  │
│ ✓ Another Edge (2 nodes)       🎯  │
└─────────────────────────────────────┘
```

**Data Structure for Suggestions:**

```javascript
// In-memory only (not saved to tree)
let suggestedHyperedges = [
    {
        id: 'suggest-status-inprogress',
        rule: 'status-cluster',
        label: 'In Progress Items',
        nodeIds: ['item-1', 'item-5', 'item-8'],
        color: '#f59e0b',
        description: 'Auto-detected: 3 items share "In Progress" status',
        dismissed: false
    }
];

// localStorage for dismissed suggestions
// Key: 'treelisty-dismissed-suggestions'
// Value: ['suggest-status-inprogress', ...]
```

---

### Phase C: Query-Based Creation

**Two Interfaces:**

#### 1. Natural Language (TreeBeard Integration)

```
User: "Show me all items over $500K"

TreeBeard: "Found 4 items totaling $2.3M:
• Phase 1: Gas Turbine ($1.2M)
• Phase 2: Solar Array ($800K)
• Phase 2: Battery Storage ($600K)
• Phase 3: Switchgear ($550K)

Create a hyperedge to visualize them?"

[Create "High Value Items"]  [Just Highlight]
```

**TreeBeard Query Patterns:**

| Query Type | Examples |
|------------|----------|
| Cost-based | "items over $X", "expensive items", "biggest costs" |
| Status-based | "in progress items", "completed items", "blocked items" |
| Assignee-based | "Sarah's items", "items assigned to {name}" |
| Phase-based | "items in Phase 2", "Phase 1 and 3 items" |
| Combined | "Sarah's items over $100K", "blocked items in Phase 2" |

#### 2. Filter Builder UI

Accessed via [+] button in Hyperedges panel or "Create by Query" option.

```
┌─────────────────────────────────────────┐
│ 🔍 Create Hyperedge by Query            │
├─────────────────────────────────────────┤
│ Where:                                  │
│ ┌─────────────────────────────────────┐ │
│ │ [Status ▼] [equals ▼] [In Progress] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [+ Add condition (AND)]                 │
│ [+ Add condition (OR)]                  │
│                                         │
│ ─────────────────────────────────────── │
│ Preview: 5 nodes match                  │
│                                         │
│ Name: [In Progress Items          ]     │
│ Color: [🟡] [🟢] [🔵] [🟣] [🔴] [auto]  │
│                                         │
│           [Cancel]  [Create Hyperedge]  │
└─────────────────────────────────────────┘
```

**Available Query Fields (Pattern-Aware):**

| Field | Operators | Patterns |
|-------|-----------|----------|
| Status | equals, not equals | All |
| Priority | equals, >, < | All |
| Assignee | equals, contains, is empty | All |
| Cost | >, <, between, is empty | CAPEX, Sales, Generic |
| Lead Time | >, <, between | CAPEX |
| Phase | equals, not equals | All |
| Name | contains | All |
| Description | contains | All |
| Has dependencies | yes/no | All |
| Is blocked | yes/no | All |
| Progress | >, <, between | All |
| Due Date | before, after, between, overdue | All |

**Compound Queries:**
- AND: "Status = In Progress AND Cost > $100K"
- OR: "Assignee = Sarah OR Assignee = Mike"
- Nested: "(Status = In Progress OR Status = To Do) AND Priority = High"

**Query-Created Hyperedge Metadata:**

```javascript
{
    id: 'hyperedge-1733535421000',
    type: 'query',
    label: 'In Progress Items',
    nodeIds: ['item-1', 'item-5', 'item-8'],
    metadata: {
        created: '2025-12-06T22:30:00Z',
        query: {
            conditions: [
                { field: 'pmStatus', operator: 'equals', value: 'In Progress' }
            ],
            logic: 'AND'
        },
        dynamic: true  // Re-evaluate on tree changes
    }
}
```

**Dynamic vs Static Queries:**
- **Dynamic:** Checkbox option "Update automatically" - hyperedge re-evaluates when tree changes
- **Static:** Snapshot of matching nodes at creation time

---

### Phase B: Aggregation Display (Live)

**Aggregates recalculate automatically as nodes change.**

**Aggregation Types:**

| Data Type | Aggregations | Display Format |
|-----------|--------------|----------------|
| Cost | Sum, Avg, Min, Max | "$2.3M total" |
| Progress | Average % | "67% complete" |
| Count | Total, by status | "5 nodes (3 done, 2 in progress)" |
| Lead Time | Sum, Max | "18 months total" |
| Dates | Range, next due | "Due: Dec 15" |

**Pattern-Specific Primary Metrics:**

| Pattern | Primary | Secondary | Tertiary |
|---------|---------|-----------|----------|
| CAPEX | Total Cost | Avg Progress | Max Lead Time |
| Sales | Total Deal Value | Avg Probability | Count by Stage |
| Philosophy | Node Count | Argument types | — |
| Film | Scene Count | Total Duration | — |
| Generic | Node Count | Avg Progress | — |

**UI: Enhanced Hyperedge Panel**

```
┌─────────────────────────────────────┐
│ 🔗 Hyperedges (3)              [+]  │
├─────────────────────────────────────┤
│ ✓ Sarah's Items          4 nodes   │
│   💰 $1.2M  📊 45%  ⏱️ 6mo         │
├─────────────────────────────────────┤
│ ✓ Blocked Items          2 nodes   │
│   ⚠️ Blocking: Phase 2 start       │
├─────────────────────────────────────┤
│ ✓ High Cost Items        3 nodes   │
│   💰 $4.7M  📊 78%                 │
└─────────────────────────────────────┘
```

**Canvas Blob Label Enhancement:**

Current: `"High Cost Items"`

Enhanced: `"High Cost Items • $4.7M • 78%"`

**Aggregate Calculation Function:**

```javascript
function calculateHyperedgeAggregates(hyperedge) {
    const nodes = hyperedge.nodeIds
        .map(id => getNodeById(id))
        .filter(Boolean);

    const pattern = capexTree.pattern?.key || 'generic';

    // Universal aggregates
    const aggregates = {
        count: nodes.length,
        avgProgress: average(nodes.map(n => n.pmProgress || 0)),
        statusCounts: countBy(nodes, 'pmStatus')
    };

    // Pattern-specific
    if (['capex', 'generic', 'sales'].includes(pattern)) {
        const costs = nodes.map(n => n.cost || 0).filter(c => c > 0);
        if (costs.length > 0) {
            aggregates.totalCost = sum(costs);
            aggregates.avgCost = average(costs);
        }
    }

    if (pattern === 'capex') {
        const leadTimes = nodes.map(n => n.leadTime || 0).filter(lt => lt > 0);
        if (leadTimes.length > 0) {
            aggregates.maxLeadTime = Math.max(...leadTimes);
            aggregates.totalLeadTime = sum(leadTimes);
        }
    }

    if (pattern === 'sales') {
        aggregates.avgProbability = average(nodes.map(n => n.probability || 0));
    }

    return aggregates;
}
```

---

## Implementation Plan

### Step 1: Fix Existing Bug
- Fix `${he.label}` showing "undefined" - use `getHyperedgeDisplayLabel(he)` in panel

### Step 2: Core Infrastructure
- Add `suggestedHyperedges` array (in-memory)
- Add `dismissedSuggestions` localStorage handling
- Add `calculateHyperedgeAggregates()` function
- Add `evaluateQuery()` function for filter matching

### Step 3: Detection Engine
- Create `detectSuggestedHyperedges()` function
- Implement universal rules
- Implement pattern-specific rules
- Call on tree load and after edits

### Step 4: UI Updates
- Enhance Hyperedges panel with suggestions section
- Add aggregates display row under each hyperedge
- Add [+] button for query builder
- Enhance canvas blob labels with aggregates

### Step 5: Query Builder
- Create filter builder modal UI
- Implement condition evaluation
- Add "dynamic" checkbox for auto-updating queries
- Live preview of matching nodes

### Step 6: TreeBeard Integration
- Add query intent detection to TreeBeard
- Parse natural language to structured query
- Offer hyperedge creation from results

### Step 7: Welcome Tree Update
- Ensure welcome tree hyperedges have proper labels
- Add example of aggregates in default data

---

## Success Metrics

1. **No more "undefined" hyperedges** - all show meaningful labels
2. **Suggestions appear** when groupable patterns detected
3. **Query builder works** - can filter and create hyperedges
4. **TreeBeard understands** cost/status/assignee queries
5. **Aggregates display** live totals on hyperedges
6. **Performance** - detection < 100ms for 500-node trees

---

## Future Enhancements (Not in This Build)

- Cross-tree hyperedges (link nodes across saved trees)
- Hyperedge templates ("Group by Vendor" button)
- Export hyperedge as sub-tree
- Hyperedge history/versioning
- AI-suggested hyperedge names based on content analysis
