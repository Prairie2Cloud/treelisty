# TB ↔ Claude Code Integration Design

## Date: 2026-01-05

## Overview

TreeBeard (TB) wants direct bidirectional communication with Claude Code CLI to enable:
1. **Direct CLI interaction** - Execute Claude Code commands without human intermediary
2. **GitHub notifications** - Real-time access to notifications API
3. **Continuous triage loop** - Monitor inbox → Analyze → Auto-batch → Escalate
4. **Proactive project management** - Parse failures → Generate tasks → Track resolution

## Current Architecture

```
┌─────────────┐     WebSocket      ┌─────────────────┐
│  TreeListy  │◄──────────────────►│   MCP Bridge    │
│  (Browser)  │                    │   (Node.js)     │
└─────────────┘                    └────────┬────────┘
       ▲                                    │ stdio
       │                                    ▼
       │                           ┌─────────────────┐
       └───────────────────────────│  Claude Code    │
           (manual copy/paste)     │    (CLI)        │
                                   └─────────────────┘
```

**Current Flow**: Claude Code → MCP Bridge → TreeListy → User sees TB → User manually tells Claude Code what TB said

## Proposed Architecture

```
┌─────────────┐     WebSocket      ┌─────────────────┐      stdio       ┌─────────────────┐
│  TreeListy  │◄──────────────────►│   MCP Bridge    │◄────────────────►│  Claude Code    │
│  (Browser)  │                    │   (Node.js)     │                  │    (CLI)        │
└─────────────┘                    └────────┬────────┘                  └─────────────────┘
       │                                    │                                   │
       │ TB Response                        │ Task Queue                        │
       ▼                                    ▼                                   │
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Bidirectional Message Bus                              │
│                                                                                     │
│  TB → Claude Code:  "I need research on X" → dispatch_task → Claude Code executes  │
│  Claude Code → TB:  Task completed → results → TB presents in chat                 │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## New Components Required

### 1. Claude Code Subprocess Manager

Add to MCP Bridge - ability to spawn and communicate with Claude Code CLI:

```javascript
// packages/treelisty-mcp-bridge/src/claude-code-subprocess.js

const { spawn } = require('child_process');

class ClaudeCodeSubprocess {
  constructor() {
    this.process = null;
    this.messageQueue = [];
    this.responseHandlers = new Map();
  }

  async start() {
    // Spawn Claude Code in headless/API mode
    this.process = spawn('claude', ['--mcp-server'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle responses
    this.process.stdout.on('data', (data) => {
      const response = JSON.parse(data.toString());
      const handler = this.responseHandlers.get(response.id);
      if (handler) handler(response);
    });
  }

  async sendCommand(command, params) {
    return new Promise((resolve, reject) => {
      const id = `cmd-${Date.now()}`;
      this.responseHandlers.set(id, resolve);

      this.process.stdin.write(JSON.stringify({
        id,
        method: command,
        params
      }) + '\n');

      // Timeout after 5 minutes
      setTimeout(() => {
        this.responseHandlers.delete(id);
        reject(new Error('Command timeout'));
      }, 300000);
    });
  }
}
```

### 2. GitHub Notifications MCP Server

New MCP tools for GitHub integration:

```javascript
// New tools to add to handleToolsList
{
  name: 'github_list_notifications',
  description: 'List GitHub notifications with filtering',
  inputSchema: {
    type: 'object',
    properties: {
      participating: { type: 'boolean', description: 'Only show notifications you participate in' },
      all: { type: 'boolean', description: 'Include read notifications' },
      per_page: { type: 'number', description: 'Results per page (max 100)' },
      repo: { type: 'string', description: 'Filter by repo (owner/name)' }
    }
  }
},
{
  name: 'github_mark_read',
  description: 'Mark a notification or all notifications as read',
  inputSchema: {
    type: 'object',
    properties: {
      thread_id: { type: 'string', description: 'Notification thread ID (omit for all)' },
      last_read_at: { type: 'string', description: 'ISO timestamp for bulk mark read' }
    }
  }
},
{
  name: 'github_get_thread',
  description: 'Get details of a notification thread',
  inputSchema: {
    type: 'object',
    properties: {
      thread_id: { type: 'string', description: 'Thread ID' }
    },
    required: ['thread_id']
  }
}
```

### 3. TB → Claude Code Dispatch Protocol

New message type in WebSocket protocol:

```javascript
// Browser → Bridge → Claude Code
{
  type: 'claude_dispatch',
  prompt: 'Research the CI failure in PR #123 and suggest a fix',
  context: {
    treeId: 'current-tree-id',
    nodeId: 'target-node-for-results',
    urgency: 'normal', // low, normal, high
    capabilities: ['webSearch', 'fileRead', 'gitOps']
  },
  responseMode: 'streaming' | 'complete' | 'background'
}

// Claude Code → Bridge → Browser
{
  type: 'claude_response',
  dispatchId: 'dispatch-xxx',
  status: 'streaming' | 'complete' | 'error',
  content: 'Partial or complete response...',
  toolCalls: [...],  // Tools Claude Code used
  sources: [...]     // References
}
```

### 4. Continuous Triage Agent

Background worker in MCP Bridge:

```javascript
// packages/treelisty-mcp-bridge/src/triage-agent.js

class TriageAgent {
  constructor(bridge) {
    this.bridge = bridge;
    this.running = false;
    this.interval = null;
  }

  async start(intervalMs = 300000) { // 5 minutes
    this.running = true;
    this.interval = setInterval(() => this.runCycle(), intervalMs);
    await this.runCycle(); // Immediate first run
  }

  async runCycle() {
    // 1. Fetch GitHub notifications
    const notifications = await this.bridge.github.listNotifications({
      participating: true,
      per_page: 50
    });

    // 2. Categorize and batch
    const batches = this.categorize(notifications);

    // 3. For each batch, generate summary
    for (const [category, items] of Object.entries(batches)) {
      if (items.length === 0) continue;

      const summary = await this.bridge.claudeCode.sendCommand('summarize', {
        items,
        category
      });

      // 4. Submit to TreeListy Inbox
      this.bridge.broadcastToBrowser({
        type: 'triage_summary',
        category,
        count: items.length,
        summary,
        suggestedActions: this.generateActions(category, items)
      });
    }
  }

  categorize(notifications) {
    return {
      ci_failures: notifications.filter(n =>
        n.subject.type === 'CheckSuite' &&
        n.reason === 'ci_activity'
      ),
      review_requests: notifications.filter(n =>
        n.reason === 'review_requested'
      ),
      mentions: notifications.filter(n =>
        n.reason === 'mention'
      ),
      other: notifications.filter(n =>
        !['ci_activity', 'review_requested', 'mention'].includes(n.reason)
      )
    };
  }
}
```

## Implementation Phases

### Phase 1: GitHub Notifications (1-2 days)
1. Add `github-handler.js` to MCP Bridge
2. Use `gh` CLI or GitHub REST API with token
3. Add MCP tools for list, mark read, get thread
4. Test with TB commands: `check_github`, `github_summary`

### Phase 2: Claude Code Dispatch (2-3 days)
1. Add `claude_dispatch` message handler
2. Create subprocess manager
3. Add streaming response protocol
4. Connect TB "Ask Claude Code" button to dispatch

### Phase 3: Continuous Triage (2-3 days)
1. Implement TriageAgent
2. Add config for triage interval
3. Create TB UI for triage summaries
4. Add suggested action buttons

### Phase 4: Full Autonomy Mode (ongoing)
1. Let TB approve/reject triage actions
2. Auto-execute approved actions
3. Learn from user preferences
4. Expand to more integrations (Calendar, Slack, etc.)

## Security Considerations

1. **Token Isolation**: GitHub token stays in bridge, never sent to browser
2. **Rate Limiting**: Respect GitHub API limits (5000 req/hour)
3. **Approval Required**: High-impact actions require user confirmation
4. **Audit Log**: All automated actions logged with timestamp and context
5. **Kill Switch**: User can disable autonomous mode instantly

## TB Commands to Add

| Command | Description |
|---------|-------------|
| `check_github` | Get current GitHub notifications |
| `triage_github` | Run triage cycle on demand |
| `github_summary` | Generate summary of notification status |
| `ask_claude_code:prompt` | Dispatch prompt to Claude Code |
| `autonomous_mode:on/off` | Toggle background triage |

## Success Metrics

1. **Notification → Summary**: < 30 seconds for batch of 50
2. **TB → Claude Code Round Trip**: < 5 seconds for simple queries
3. **Triage Accuracy**: > 90% correct categorization
4. **User Override Rate**: < 10% (actions correctly predicted)

## Open Questions

1. Should Claude Code subprocess be persistent or spawned per-request?
2. How to handle Claude Code API key vs CLI auth?
3. Should GitHub token use OAuth flow or rely on `gh auth`?
4. What's the right polling interval for continuous triage?
