# TreeBeard Natural Language Command Testing Specification

## Overview

This specification defines tests for verifying TreeBeard's ability to interpret natural language commands, execute the corresponding actions, and produce verifiable results via MCP.

## Test Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Test Runner   │────▶│    TreeListy    │◀────│   MCP Bridge    │
│   (Playwright)  │     │    (Browser)    │     │   (Validator)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  1. Load test tree    │                       │
        │  2. Send NL command   │                       │
        │  via TB input         │                       │
        │                       │                       │
        │                       │  3. TB interprets     │
        │                       │  & executes command   │
        │                       │                       │
        │                       │  4. MCP validates     │◀───────────┤
        │                       │     tree state        │            │
        └───────────────────────┴───────────────────────┴────────────┘
```

## Test Categories

### Category 1: Navigation Commands (NAVIGATE)
Test TB's ability to find and focus nodes.

| ID | Natural Language Input | Expected Command | Verification |
|----|------------------------|------------------|--------------|
| NAV-01 | "go to Marketing" | focus_node | Selected node name = "Marketing" |
| NAV-02 | "find the budget item" | find_node | Search results contain "Budget" |
| NAV-03 | "show me Phase 1" | focus_node | Selected node = Phase 1 |
| NAV-04 | "navigate to root" | focus_root | Selected node = root |
| NAV-05 | "where is the deadline task?" | search | Toast shows search results |
| NAV-06 | "jump to Design" | focus_node | Selected node = "Design" |

### Category 2: Tree Manipulation (EDIT)
Test TB's ability to create, modify, and delete nodes.

| ID | Natural Language Input | Expected Command | Verification |
|----|------------------------|------------------|--------------|
| EDIT-01 | "add a new task called Testing" | add_child | Node "Testing" exists under selected |
| EDIT-02 | "create child node Documentation" | add_child | Node "Documentation" created |
| EDIT-03 | "rename this to Final Review" | rename_node | Selected node name = "Final Review" |
| EDIT-04 | "delete the Budget item" | delete_node | Node "Budget" no longer exists |
| EDIT-05 | "move Design to Phase 2" | move_node | Design parent = Phase 2 |
| EDIT-06 | "add three items: A, B, C" | add_children | 3 nodes created |
| EDIT-07 | "duplicate this node" | duplicate_node | Copy exists with new ID |
| EDIT-08 | "set description to Important milestone" | set_field | Node description updated |

### Category 3: View Switching (VIEW)
Test TB's ability to switch between views.

| ID | Natural Language Input | Expected Command | Verification |
|----|------------------------|------------------|--------------|
| VIEW-01 | "show canvas view" | switch_to_canvas | viewMode = 'canvas' |
| VIEW-02 | "switch to tree" | switch_to_tree | viewMode = 'tree' |
| VIEW-03 | "open 3D mode" | switch_to_3d | viewMode = '3d' |
| VIEW-04 | "display gantt chart" | view_gantt | viewMode = 'gantt' |
| VIEW-05 | "show me the calendar" | view_calendar | viewMode = 'calendar' |
| VIEW-06 | "mind map please" | switch_to_mindmap | viewMode = 'mindmap' |

### Category 4: Expand/Collapse (ORGANIZE)
Test TB's ability to control tree expansion.

| ID | Natural Language Input | Expected Command | Verification |
|----|------------------------|------------------|--------------|
| ORG-01 | "expand all" | expand_all | All nodes expanded |
| ORG-02 | "collapse everything" | collapse_all | All nodes collapsed |
| ORG-03 | "expand this node" | expand_node | Selected node expanded |
| ORG-04 | "collapse Phase 1" | collapse_node | Phase 1 collapsed |

### Category 5: Search & Analysis (ANALYZE)
Test TB's search and analysis capabilities.

| ID | Natural Language Input | Expected Command | Verification |
|----|------------------------|------------------|--------------|
| ANA-01 | "search for milestone" | search | Results contain "milestone" |
| ANA-02 | "analyze the tree structure" | tree_analysis | Analysis message returned |
| ANA-03 | "find duplicates" | find_redundancies | Duplicates listed or none found |
| ANA-04 | "how many nodes are there?" | project_info | Node count returned |

### Category 6: Undo/Redo (META)
Test TB's undo/redo functionality.

| ID | Natural Language Input | Expected Command | Verification |
|----|------------------------|------------------|--------------|
| META-01 | "undo that" | undo | Previous state restored |
| META-02 | "redo" | redo | Redone state applied |
| META-03 | "take it back" | undo | Previous state restored |

### Category 7: Ambiguous/Complex Commands
Test TB's handling of edge cases.

| ID | Natural Language Input | Expected Behavior | Verification |
|----|------------------------|-------------------|--------------|
| AMB-01 | "add it" | Ask for clarification | TB asks what to add |
| AMB-02 | "do the thing" | Graceful failure | TB asks for specifics |
| AMB-03 | "add Marketing and Design and Testing" | Parse multiple | 3 nodes created |
| AMB-04 | "rename Marketing to New Marketing then move it to Phase 2" | Chain commands | Both operations complete |

### Category 8: Parameterized Commands
Test TB's parameter extraction.

| ID | Natural Language Input | Expected Extraction | Verification |
|----|------------------------|---------------------|--------------|
| PARAM-01 | "add_child:New Task" | name="New Task" | Node created with exact name |
| PARAM-02 | "rename_node:Old Name to New Name" | old="Old Name", new="New Name" | Rename succeeds |
| PARAM-03 | "move_node:Design to Phase 2" | source="Design", dest="Phase 2" | Move succeeds |

## Test Tree Fixture

```json
{
  "id": "tb-test-root",
  "name": "TB Test Project",
  "type": "root",
  "children": [
    {
      "id": "phase-1",
      "name": "Phase 1 - Planning",
      "type": "phase",
      "items": [
        { "id": "item-1-1", "name": "Requirements", "type": "item" },
        { "id": "item-1-2", "name": "Design", "type": "item" },
        { "id": "item-1-3", "name": "Budget", "type": "item" }
      ]
    },
    {
      "id": "phase-2",
      "name": "Phase 2 - Development",
      "type": "phase",
      "items": [
        { "id": "item-2-1", "name": "Backend", "type": "item" },
        { "id": "item-2-2", "name": "Frontend", "type": "item" }
      ]
    },
    {
      "id": "phase-3",
      "name": "Phase 3 - Testing",
      "type": "phase",
      "items": [
        { "id": "item-3-1", "name": "Unit Tests", "type": "item" },
        { "id": "item-3-2", "name": "Integration Tests", "type": "item" }
      ]
    }
  ]
}
```

## Verification Methods

### 1. MCP-based Verification
Use MCP tools to query tree state after command execution:
- `get_tree` - Full tree structure
- `get_node` - Specific node data
- `search_nodes` - Find nodes by query

### 2. Browser State Verification
Use Playwright to check browser state:
- `window.viewMode` - Current view
- `window.capexTree` - Tree data
- `window.selectedNodeId` - Selected node
- DOM element presence/state

### 3. Toast/Response Verification
Capture TB response messages:
- Success confirmations
- Error messages
- Clarification requests

## Success Criteria

| Metric | Target |
|--------|--------|
| Fast-path commands (exact matches) | 100% accuracy |
| Common natural language variations | 90% accuracy |
| Parameter extraction | 95% accuracy |
| Ambiguous input handling | Graceful degradation |
| Response time (fast-path) | < 100ms |
| Response time (AI-routed) | < 3s |

## Test Execution

```bash
# Run full TB NL test suite
npm run test:tb-nl

# Run specific category
npm run test:tb-nl -- --grep "Navigation"

# Run with MCP bridge
npm run test:tb-nl:mcp
```
