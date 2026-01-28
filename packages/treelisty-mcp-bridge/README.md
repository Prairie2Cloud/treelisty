# TreeListy MCP Server

[![npm version](https://img.shields.io/npm/v/@prairie2cloud/treelisty-mcp.svg)](https://www.npmjs.com/package/@prairie2cloud/treelisty-mcp)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Connect [Claude Code](https://claude.ai/claude-code) to [TreeListy](https://treelisty.netlify.app) via the Model Context Protocol (MCP).

TreeListy is a hierarchical project decomposition tool with 11 view modes, 21 patterns, and AI integration. This MCP server provides **62+ tools** for tree manipulation, Gmail management, GitHub integration, Google Drive operations, and Chrome automation.

## Overview

This MCP server enables Claude Code to read and modify TreeListy trees programmatically. It acts as a translator between:

- **Claude Code** (communicates via MCP over stdio)
- **TreeListy** (runs in your browser, communicates via WebSocket)

```
Claude Code <-- stdio/MCP --> Bridge <-- WebSocket --> TreeListy Browser
```

## Quick Start

### 1. Install via npx

Run in your terminal:

```bash
npx @prairie2cloud/treelisty-mcp
```

Or install globally:

```bash
npm install -g @prairie2cloud/treelisty-mcp
```

### 2. Add to Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "treelisty": {
      "command": "npx",
      "args": ["@prairie2cloud/treelisty-mcp"]
    }
  }
}
```

Or use the CLI shortcut:

```bash
/mcp add treelisty npx @prairie2cloud/treelisty-mcp
```

### 3. Connect TreeListy

1. Open [TreeListy](https://treelisty.netlify.app)
2. Click the **MCP** button in the toolbar
3. Enter the port and token shown in Claude Code's MCP server output
4. Click **Connect**

### 4. Use Claude Code

Once connected, Claude Code can interact with TreeListy:

```
You: Read my tree structure
Claude: [Uses get_tree tool to read TreeListy data]

You: Add a new phase called "Research"
Claude: [Uses create_node tool to add the phase]

You: Archive all LinkedIn emails
Claude: [Uses gmail_archive tool with flexible pattern matching]
```

## Tool Catalog

### Tree Operations (14 tools)

Core tree manipulation and navigation.

| Tool | Description |
|------|-------------|
| `get_tree` | Get the full tree structure |
| `get_tree_metadata` | Get node count, hash, last modified |
| `get_node` | Get a specific node by ID |
| `get_subtree` | Get a node and descendants to specified depth |
| `create_node` | Create a new node with pattern support |
| `update_node` | Update an existing node |
| `delete_node` | Remove a node from the tree |
| `search_nodes` | Find nodes by content or pattern |
| `move_node` | Move a node to a new parent |
| `reorder_node` | Change position among siblings |
| `duplicate_node` | Create a deep copy with new IDs |
| `begin_transaction` | Start batched updates (single undo) |
| `commit_transaction` | Commit batch transaction |
| `rollback_transaction` | Discard uncommitted changes |

### Bulk Operations (3 tools)

Efficient multi-node operations.

| Tool | Description |
|------|-------------|
| `bulk_update` | Update multiple nodes in one operation |
| `bulk_create` | Create multiple nodes under same parent |
| `bulk_delete` | Delete multiple nodes by ID array |

### UI Control (7 tools)

Control TreeListy's UI state from Claude Code.

| Tool | Description |
|------|-------------|
| `select_node` | Select and focus a node in the UI |
| `get_selected_node` | Get the currently selected node |
| `expand_node` | Expand a node (optional recursive) |
| `collapse_node` | Collapse a node (optional recursive) |
| `set_view` | Switch view mode (tree/canvas/3d/gantt/calendar/mindmap/treemap/checklist) |
| `get_view` | Get current view mode |
| `scroll_to_node` | Scroll to make a node visible |

### History & State (3 tools)

Undo/redo and state management.

| Tool | Description |
|------|-------------|
| `undo` | Undo the last operation |
| `redo` | Redo the last undone operation |
| `get_undo_stack_info` | Get undo/redo stack state |

### Task Queue (2 tools)

Bidirectional task dispatch between TreeListy UI and Claude Code.

| Tool | Description |
|------|-------------|
| `tasks_claimNext` | Claim the next pending task from TreeListy |
| `tasks_progress` | Report progress on a task |
| `tasks_complete` | Complete a task with proposed operations |
| `tasks_getQueue` | Get task queue status (pending/active/completed) |

### Gmail Integration (12 tools)

Manage Gmail from TreeListy trees.

| Tool | Description |
|------|-------------|
| `gmail_check_auth` | Check Gmail authentication status |
| `gmail_archive` | Archive a thread (flexible pattern matching) |
| `gmail_trash` | Move thread to trash |
| `gmail_star` | Star or unstar a thread |
| `gmail_mark_read` | Mark thread as read/unread |
| `gmail_add_label` | Add a label to a thread |
| `gmail_remove_label` | Remove a label from a thread |
| `gmail_list_labels` | List all available labels |
| `gmail_create_label` | Create a new label |
| `gmail_create_draft` | Create a draft email (reply or new) |
| `gmail_update_draft` | Update an existing draft |
| `gmail_delete_draft` | Delete a draft |
| `gmail_send_draft` | Send a draft email |

### GitHub Integration (9 tools)

Monitor and triage GitHub notifications.

| Tool | Description |
|------|-------------|
| `github_check_auth` | Check GitHub CLI authentication |
| `github_list_notifications` | List notifications with filtering |
| `github_get_thread` | Get notification thread details |
| `github_mark_read` | Mark notification as read |
| `github_list_workflow_runs` | List CI/CD workflow runs |
| `github_get_failed_run` | Get failed workflow run details |
| `github_list_prs` | List pull requests for a repo |
| `github_get_pr_status` | Get PR review status and mergeability |
| `github_list_my_issues` | List issues assigned to current user |

### Google Drive Integration (7 tools)

Browse, search, and organize Google Drive from TreeListy.

| Tool | Description |
|------|-------------|
| `gdrive_check_auth` | Check Drive authentication status |
| `gdrive_list_files` | List files in a folder |
| `gdrive_get_file_info` | Get file metadata |
| `gdrive_search` | Search files by name |
| `gdrive_extract_content` | Extract text for RAG (Docs/PDFs/Word/Excel) |
| `gdrive_open_file` | Open file in browser |
| `gdrive_get_download_link` | Get download/export link |

### Chrome Extension (4 tools)

Screen capture and DOM extraction via Chrome extension.

| Tool | Description |
|------|-------------|
| `ext_capture_screen` | Capture screenshot of current tab |
| `ext_extract_dom` | Extract text content from current tab |
| `ext_list_tabs` | List all open browser tabs |
| `ext_get_status` | Get extension connection status |

### Camera (1 tool)

Real-time webcam capture for analysis.

| Tool | Description |
|------|-------------|
| `capture_camera` | Capture snapshot from device camera/webcam |

### Autonomous Triage (5 tools)

Continuous monitoring and intelligent triage.

| Tool | Description |
|------|-------------|
| `triage_start` | Start autonomous triage agent |
| `triage_stop` | Stop triage agent |
| `triage_status` | Get triage agent status |
| `triage_now` | Trigger immediate triage cycle |
| `triage_config` | Update triage configuration |

### Communication (3 tools)

Bidirectional messaging between Claude Code and TreeBeard.

| Tool | Description |
|------|-------------|
| `cc_send_to_tb` | Send message from Claude Code to TreeBeard |
| `cc_get_from_tb` | Get pending messages from TreeBeard |
| `cc_channel_status` | Get CC ↔ TB communication channel status |

### Patterns & Import (2 tools)

Pattern schemas and structured content import.

| Tool | Description |
|------|-------------|
| `get_pattern_schema` | Get schema for a specific pattern |
| `import_structured_content` | Import research as a subtree with pattern |

### System (1 tool)

File system operations.

| Tool | Description |
|------|-------------|
| `open_local_file` | Open file or folder with system default app |

## Resources

MCP resources expose read-only data about TreeListy state:

| Resource URI | Description |
|--------------|-------------|
| `treelisty://tree/current` | The currently loaded tree structure (JSON) |
| `treelisty://tree/metadata` | Tree metadata (node count, pattern, views) |
| `treelisty://patterns` | Available patterns with schemas |
| `treelisty://views` | Available view modes |

## Prompts

Reusable prompt templates for common workflows:

| Prompt | Description |
|--------|-------------|
| `build-tree` | Build a comprehensive tree using Semantic Onion Model |
| `analyze-structure` | Analyze tree structure and suggest improvements |
| `debate-node` | Generate counter-arguments for a node |
| `summarize-branch` | Create a narrative summary of a branch |
| `weekly-review` | Generate weekly checklist review |

Example usage in Claude Code:

```
You: Use the build-tree prompt for "Machine Learning Fundamentals" with depth 4
Claude: [Applies prompt template with arguments]
```

## Security

The bridge implements several security measures:

- **Session Token**: Random UUID generated at startup, required for connection
- **Origin Validation**: Only accepts connections from allowed origins
- **Dynamic Port**: OS-assigned port to avoid conflicts
- **Heartbeat**: Ping/pong every 30s to detect stale connections

### Allowed Origins

By default, connections are only accepted from:
- `https://treelisty.netlify.app`
- `http://localhost`
- `http://127.0.0.1`

### Debug Mode

Set `TREELISTY_DEBUG=1` to allow connections without origin header (for development).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Claude Code (CLI)                            │
│                                                                      │
│   Sends MCP requests via stdin, receives responses via stdout       │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ stdio (JSON-RPC)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     treelisty-mcp-bridge                             │
│                                                                      │
│   - Listens on dynamic port for WebSocket connections               │
│   - Translates MCP requests to WebSocket messages                   │
│   - Routes responses back to Claude Code                            │
│   - Provides Gmail/GitHub/GDrive handlers                           │
└─────────────────────────────────┬───────────────────────────────────┘
                              │ WebSocket (localhost)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     TreeListy (Browser)                              │
│                                                                      │
│   - Connects via WebSocket with token                               │
│   - Handles MCP tool calls                                          │
│   - Returns results to bridge                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Transaction Semantics

For batch operations (e.g., importing 50 nodes), wrap them in a transaction:

```javascript
// Claude Code sends:
{ method: 'begin_transaction' }
{ method: 'create_node', params: { ... } }  // x50
{ method: 'commit_transaction', params: { transaction_id: '...' } }
```

Benefits:
- Single undo checkpoint (instead of 50)
- Atomic rollback on failure
- Better performance

## Browser Client

The `client.js` file contains browser-side code for TreeListy:

- `TreeListyMCPClient`: WebSocket connection to bridge
- `TreeListyMCPHandler`: Handles MCP requests from Claude Code

This code is designed to be inlined into `treeplexity.html`.

## Development

```bash
# Clone the repo
git clone https://github.com/Prairie2Cloud/treelisty.git
cd treelisty/packages/treelisty-mcp-bridge

# Install dependencies
npm install

# Run locally
npm start

# Run with debug mode
TREELISTY_DEBUG=1 npm start
```

## Troubleshooting

### "No browser connected" error

TreeListy isn't connected to the bridge. Make sure:
1. TreeListy is open in your browser
2. You've clicked the MCP button and entered the correct port/token
3. The connection status shows "Connected"

### Connection refused

The bridge might not be running. Check:
1. Claude Code's MCP server status
2. Try restarting Claude Code

### Invalid origin error

Your TreeListy origin isn't in the allowlist. This can happen with:
- Custom localhost ports (use `http://localhost` or `http://127.0.0.1`)
- Self-hosted TreeListy (add your origin to `CONFIG.allowedOrigins`)

## Features

### Semantic Onion Model

TreeListy uses a layered tree-building methodology:
1. Find the canonical structure (TOC, phases, etc.)
2. Peel each layer of children systematically
3. Reach atomic claims with evidence
4. Enrich with context and counter-arguments

### 11 View Modes

- Tree View (hierarchical outline)
- Canvas View (node graph with dependencies)
- 3D View (spatial hierarchy)
- Gantt Chart (timeline)
- Calendar View (date-based)
- Mind Map (radial layout)
- Treemap (hierarchical area)
- Checklist (task management)
- Kanban (status columns)

### 21 Patterns

Specialized tree patterns with custom fields:
- `generic` - Default hierarchical decomposition
- `knowledge-base` - Research and documentation
- `lifetree` - Biography and timeline
- `debate` - Arguments and counter-arguments
- `capability` - Chrome automation capabilities
- `email` - Gmail thread structure
- `image-analysis` - Visual decomposition with bounding boxes
- And 14 more...

## License

Apache-2.0. See [LICENSE](./LICENSE).

## Links

- [TreeListy](https://treelisty.netlify.app) - The hierarchical project tool
- [Claude Code](https://claude.ai/claude-code) - AI-powered coding assistant
- [MCP Specification](https://modelcontextprotocol.io) - Model Context Protocol
- [GitHub Repository](https://github.com/Prairie2Cloud/treelisty)
- [NPM Package](https://www.npmjs.com/package/@prairie2cloud/treelisty-mcp)

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Support

For issues or questions:
- GitHub Issues: https://github.com/Prairie2Cloud/treelisty/issues
- Documentation: https://treelisty.netlify.app
