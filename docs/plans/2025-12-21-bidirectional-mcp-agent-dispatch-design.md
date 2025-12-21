# Bidirectional MCP Agent Dispatch Design

**Date:** 2025-12-21
**Status:** Draft
**Author:** geej + Claude Code
**Reviewed by:** Gemini (architectural feedback incorporated)

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

## Technical Protocol: MCP Sampling

**Key Insight (from Gemini review):** We don't need a custom protocol. The MCP specification already defines **Sampling** (`sampling/createMessage`) for exactly this use case.

### How MCP Sampling Works

- **Normal MCP:** Client (Claude Code) calls Tools on Server (TreeListy)
- **Sampling (inverted):** Server (TreeListy) sends a Prompt to Client (Claude Code) and asks it to run its full agent loop

```
┌─────────────────┐     sampling/createMessage      ┌─────────────────┐
│    TreeListy    │ ──────────────────────────────► │   Claude Code   │
│    (Server)     │                                 │    (Client)     │
│                 │   System: "You are a Research   │                 │
│                 │   Agent. Use WebSearch..."      │  Runs full      │
│                 │                                 │  agent loop:    │
│                 │   User: "Research Nixon"        │  - WebSearch    │
│                 │                                 │  - Read files   │
│                 │ ◄────────────────────────────── │  - Synthesize   │
│  Receives       │     Completed generation        │                 │
│  structured     │     (JSON tree structure)       │                 │
│  result         │                                 │                 │
└─────────────────┘                                 └─────────────────┘
```

### The "Ghost Agent" Pattern

Treebeard doesn't need to know *how* to search. It just knows how to *ask* for search.

1. **User:** "Research Nixon" (in Browser)
2. **Treebeard:** Formats `sampling/createMessage` with system prompt: *"You are a Research Agent. Use your WebSearch tools..."*
3. **Bridge:** Forwards to Claude Code
4. **Claude Code:** Enters its own loop (Search → Read → Search → Synthesize)
5. **Return:** Claude Code sends final result back through Bridge
6. **Treebeard:** Parses result and updates tree

**Benefits:**
- Standard MCP protocol (no custom invention)
- Claude Code uses its internal capabilities (Chain of Thought, Tool Use)
- TreeListy stays lightweight - just formats requests

### Streaming Progress

Use standard JSON-RPC `notifications/progress` to stream status updates:

```json
{"jsonrpc": "2.0", "method": "notifications/progress", "params": {
  "token": "task-123",
  "progress": 3,
  "total": 5,
  "message": "Found 3 sources, researching presidency..."
}}
```

### Concurrency

Claude Code is single-threaded (one interactive session). The Bridge implements a simple queue:

```
Task 1: "Research Nixon" → Processing
Task 2: "Analyze document" → Queued
Task 3: "Generate image" → Queued (routes to Gemini instead)
```

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

### Result Integration
Context-dependent:
- **New content (research):** Preview before adding to tree
- **Enhancements:** Auto-apply to existing nodes

## Tree-Scoped Agent Memory

Memory persists across sessions but isolated per tree.

```javascript
{
  "id": "root",
  "name": "Richard Nixon (1913-1994)",
  "pattern": "lifetree",
  "children": [...],

  // Agent memory - travels with tree
  "_agentContext": {
    "summary": "Building comprehensive Nixon LifeTree focused on foreign policy",
    "sources": ["wikipedia.org/Nixon", "millercenter.org", "history.gov"],
    "decisions": [
      "User prefers chronological structure",
      "Focus on foreign policy over domestic",
      "Include direct quotes where available"
    ],
    "conversationHighlights": [
      "User wants China trip details",
      "Skip childhood, emphasize presidency"
    ],
    "lastAgentSession": "2025-12-21T..."
  }
}
```

**Benefits:**
- Export tree → memory comes with it
- Share tree → collaborator gets context
- Different trees = isolated memory (Nixon knows nothing about CAPEX)
- Memory builds incrementally across sessions

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

## Implementation Phases

### Phase 1: Bidirectional MCP Protocol
- Extend bridge to accept task requests from browser
- Define message format for task dispatch/response
- Implement basic request/response flow

### Phase 2: TB Dispatch Integration
- Add AgentDispatcher to TreeListy
- Implement "needs Claude Code" detection in TB
- Build conversation relay mechanism

### Phase 3: Multi-Agent Orchestration
- Add agent routing logic to TB
- Integrate with existing Claude/Gemini/ChatGPT providers
- Implement parallel agent execution for Debate Mode

### Phase 4: Memory & Persistence
- Add `_agentContext` to tree schema
- Implement checkpoint/resume logic
- Build memory summarization for context management

### Phase 5: Security & Polish
- Implement permission tiers
- Add shared agent trust prompts
- Build audit logging
- Error handling and edge cases

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

## Success Criteria

- User can research and build a LifeTree entirely from TreeListy UI
- TB feels intelligent even though Claude Code does the work
- Tree-scoped memory provides continuity across sessions
- Shared trees with agents are safe by default
- Graceful degradation when Claude Code unavailable
