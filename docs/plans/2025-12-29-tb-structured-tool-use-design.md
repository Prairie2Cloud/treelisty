# TB Structured Tool Use Design

**Date:** 2025-12-29
**Status:** IMPLEMENTED (Build 658)
**Author:** Claude Code + User Collaboration

## Problem Statement

TreeBeard (TB) currently uses free-form text with regex parsing to extract commands:
```
[ACTION: add_child:Chapter 1]
```

This approach is fragile:
- TB hallucinates invalid formats (e.g., `Parent:/Child:` instead of `[ACTION:]`)
- 9 consecutive failures observed in user session
- Fallback parsing (Build 657) is a band-aid, not a solution

**Goal:** Make it structurally impossible for TB to emit invalid commands.

## Solution: Two-Mode Architecture with Claude Tool Use

### Mode 1: Conversation Mode (Default)

- User and TB discuss, explore, plan
- TB responds with natural language only
- No command extraction, no action execution
- TB can describe intended actions: "I'd add three children to Chapter 1..."

### Mode 2: Action Mode (User-Triggered)

- User says: "go", "build it", "execute", "do it"
- System switches to Claude Tool Use API
- Commands are tool calls with enforced JSON schemas
- Invalid parameters impossible at API level

### Mode Detection

```javascript
const ACTION_TRIGGERS = ['go', 'build it', 'execute', 'do it', 'yes do that'];

function detectMode(userMessage) {
  const lower = userMessage.toLowerCase().trim();
  return ACTION_TRIGGERS.some(t => lower === t || lower.startsWith(t + ' '))
    ? 'action'
    : 'conversation';
}
```

## Tool Tiering Strategy

With ~150 commands in TreeListy, loading all as tools would degrade Claude's performance. Instead, use context-aware tiering.

### Tier 0: Always Available (~20 tools)

```javascript
// Navigation
focus_node, find_node, focus_root, expand_node, collapse_node

// Core editing
add_child, add_children, delete_node, move_node, set_description

// Structure
show_tree_structure, search_tree, project_info

// View switching
switch_to_canvas, switch_to_tree, switch_to_3d, view_gantt

// AI
deep_dive, dispatch_task
```

### Tier 1: Context-Triggered

| Context | Trigger | Tools Loaded |
|---------|---------|--------------|
| Gantt View | `viewMode === 'gantt'` | 25 gantt_* tools |
| Canvas View | `viewMode === 'canvas'` | layout_*, zoom_*, scroll_* |
| Gmail Nodes | Selected node has `threadId` | gmail_*, archive_*, batch_* |
| LifeTree Pattern | `pattern === 'lifetree'` | lifetree_*, birthday_method |
| Image Analysis | Tree has bbox nodes | nearby, region, containing |
| Hyperedges | User mentions "hyperedge" | create_hyperedge, extend_*, focus_hyperedge |

### Context Detection Logic

```javascript
function getActiveTools(viewMode, pattern, selectedNode, userMessage) {
  const tools = [...TIER_0_TOOLS];

  if (viewMode === 'gantt') tools.push(...GANTT_TOOLS);
  if (viewMode === 'canvas') tools.push(...CANVAS_TOOLS);
  if (pattern === 'lifetree') tools.push(...LIFETREE_TOOLS);
  if (selectedNode?.threadId) tools.push(...GMAIL_TOOLS);
  if (/hyperedge/i.test(userMessage)) tools.push(...HYPEREDGE_TOOLS);

  return tools;
}
```

## Tool Schema Examples

### Core Tree-Building Tools

```javascript
const TIER_0_TOOLS = [
  {
    name: "focus_node",
    description: "Navigate to and select a node by name",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Node name or partial match" }
      },
      required: ["query"]
    }
  },
  {
    name: "add_children",
    description: "Add multiple children to the focused node",
    input_schema: {
      type: "object",
      properties: {
        children: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          description: "Names of children to add"
        }
      },
      required: ["children"]
    }
  },
  {
    name: "set_description",
    description: "Set description on focused node",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string" }
      },
      required: ["text"]
    }
  }
];
```

### Batch Operation Tool (for SOM workflow)

```javascript
{
  name: "build_subtree",
  description: "Build an entire subtree structure at once",
  input_schema: {
    type: "object",
    properties: {
      parent: { type: "string", description: "Parent node to build under" },
      structure: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            children: { type: "array", items: { type: "string" } }
          },
          required: ["name"]
        }
      }
    },
    required: ["parent", "structure"]
  }
}
```

## API Call Flow

### Conversation Mode

```javascript
// Standard Claude Messages API - no tools
const response = await claude.messages.create({
  model: "claude-sonnet-4-20250514",
  system: conversationPrompt,
  messages: chatHistory,
  max_tokens: 1500
  // No tools parameter
});
```

### Action Mode

```javascript
// Claude Messages API with tool_use
const response = await claude.messages.create({
  model: "claude-sonnet-4-20250514",
  system: actionPrompt,
  messages: chatHistory,
  max_tokens: 4096,
  tools: getActiveTools(viewMode, pattern, selectedNode, lastUserMessage)
});

// Response contains tool_use blocks
for (const block of response.content) {
  if (block.type === 'tool_use') {
    const result = await executeCommand(block.name, block.input);
    // Send result back for multi-step execution
  }
}
```

### Multi-Step Execution

TB can chain tools in one response:
```
User: "go"
TB Response:
  [tool_use: focus_node, { query: "Chapter 1" }]
  [tool_use: add_children, { children: ["A. Being", "B. Nothing", "C. Becoming"] }]
  [tool_use: focus_node, { query: "Chapter 2" }]
  [tool_use: add_children, { children: ["A. Dasein", "B. Finitude", "C. Infinity"] }]
  [text: "Added 6 nodes across 2 chapters."]
```

Each tool result feeds back, enabling TB to handle errors mid-sequence.

## Error Handling

### Schema Validation (Automatic)

Claude API enforces tool schemas - invalid inputs rejected before execution:
```javascript
// TB cannot call this incorrectly:
add_children: {
  children: { type: "array", items: { type: "string" }, minItems: 1 }
}

// These would be rejected by API:
{ children: "A. Being" }        // Not an array
{ children: [] }                 // minItems: 1
{ kids: ["A", "B"] }            // Wrong property name
```

### Runtime Errors (Command Execution)

When tool is valid but execution fails:
```javascript
async function executeCommand(toolName, input) {
  try {
    const result = COMMAND_REGISTRY[toolName](input);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestion: getSuggestion(toolName, error)
    };
  }
}
```

TB receives error and can retry:
```
[tool_use: focus_node, { query: "Chpater 1" }]
→ { success: false, error: "Node not found", suggestion: "Did you mean 'Chapter 1: Being'?" }
[tool_use: focus_node, { query: "Chapter 1: Being" }]
→ { success: true, result: "Selected: Chapter 1: Being" }
```

### Graceful Degradation

If tool system fails entirely, fall back to Build 657 behavior:
```javascript
if (toolCallFailed) {
  // Parse [ACTION:] from text response (current system)
  // User still gets functionality, just less reliable
}
```

## Implementation Phases

### Phase 1: Foundation
- Define tool schemas for Tier 0 commands
- Implement mode detection (conversation vs action)
- Wire up Claude tool_use API calls

### Phase 2: Tool Execution
- Map tool calls to COMMAND_REGISTRY
- Implement result feedback loop
- Add error handling with suggestions

### Phase 3: Tiering
- Implement context detection
- Define Tier 1 tool sets (Gantt, Gmail, etc.)
- Dynamic tool loading based on context

### Phase 4: Polish
- Optimize tool descriptions for Claude accuracy
- Add telemetry for tool selection quality
- Graceful degradation to regex parsing

## Success Metrics

| Metric | Current (Build 657) | Target |
|--------|---------------------|--------|
| Command parse failures | ~10% | 0% (schema-enforced) |
| Wrong command selection | ~5% | <1% |
| Tokens per action request | ~2K | ~4K (schema overhead) |
| User "go" to completion | 70% | 95%+ |

## Trade-offs Accepted

1. **Higher token cost** - Tool schemas add ~2K tokens per action request
2. **API dependency** - Tool use requires Claude API (no local fallback)
3. **Mode switching** - User must explicitly trigger action mode
4. **Context limitations** - Cross-context actions require view switching first

## Alternatives Considered

### All Tools (~150)
- Rejected: Claude accuracy degrades with 50+ tools

### Grouped/Polymorphic Tools
- Rejected: Less descriptive names hurt tool selection
- Example: `tree_edit({ action: "add_child" })` worse than `add_child()`

### JSON Mode (no tools)
- Rejected: Claude can still produce malformed JSON
- Tool use has API-level schema enforcement

## Next Steps

1. Review and approve this design
2. Create implementation plan with file-level details
3. Set up git worktree for isolated development
4. Implement Phase 1 (Foundation)
