# TreeListy MCP Bridge

Connect [Claude Code](https://claude.ai/claude-code) to [TreeListy](https://treelisty.netlify.app) via the Model Context Protocol (MCP).

## Overview

This bridge enables Claude Code to read and modify TreeListy trees programmatically. It acts as a translator between:

- **Claude Code** (communicates via MCP over stdio)
- **TreeListy** (runs in your browser, communicates via WebSocket)

```
Claude Code <-- stdio/MCP --> Bridge <-- WebSocket --> TreeListy Browser
```

## Quick Start

### 1. Add to Claude Code

Run in your terminal:

```bash
/mcp add treelisty npx treelisty-mcp-bridge
```

Or add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "treelisty": {
      "command": "npx",
      "args": ["treelisty-mcp-bridge"]
    }
  }
}
```

### 2. Connect TreeListy

1. Open [TreeListy](https://treelisty.netlify.app)
2. Click the **MCP** button in the toolbar
3. Enter the port and token shown in Claude Code's MCP server output
4. Click **Connect**

### 3. Use Claude Code

Once connected, Claude Code can:

```
You: Read my tree structure
Claude: [Uses get_tree tool to read TreeListy data]

You: Add a new phase called "Research"
Claude: [Uses create_node tool to add the phase]
```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_tree` | Get the full tree structure |
| `get_tree_metadata` | Get node count, hash, last modified |
| `get_node` | Get a specific node by ID |
| `get_subtree` | Get a node and descendants |
| `create_node` | Create a new node |
| `update_node` | Update an existing node |
| `delete_node` | Remove a node |
| `search_nodes` | Find nodes by content |
| `begin_transaction` | Start batched updates |
| `commit_transaction` | Commit batch (single undo) |
| `rollback_transaction` | Discard uncommitted changes |
| `import_structured_content` | Import research as subtree |
| `get_pattern_schema` | Get pattern field definitions |

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
└─────────────────────────────┬───────────────────────────────────────┘
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

## License

Apache-2.0. See [LICENSE](./LICENSE).

## Links

- [TreeListy](https://treelisty.netlify.app) - The hierarchical project tool
- [Claude Code](https://claude.ai/claude-code) - AI-powered coding assistant
- [MCP Specification](https://modelcontextprotocol.io) - Model Context Protocol
