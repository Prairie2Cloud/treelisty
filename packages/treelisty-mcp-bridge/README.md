# TreeListy MCP Bridge

WebSocket bridge connecting TreeListy (browser) to Claude Code via MCP (Model Context Protocol).

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude Code    │     │   MCP Bridge    │     │   TreeListy     │
│  (CLI)          │◄───►│  (this pkg)     │◄───►│  (Browser)      │
│                 │stdio│                 │ ws  │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Installation

No installation required! Use `npx`:

```bash
npx treelisty-mcp-bridge
```

## Claude Code Configuration

Add to `~/.claude/settings.json`:

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

## Security Features

- **Session Token**: Random UUID generated at startup, required for connection
- **Origin Validation**: Only accepts connections from allowed origins
- **Dynamic Port**: Uses OS-assigned port to avoid conflicts
- **Heartbeat**: Ping/pong every 30s to detect stale connections

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TREELISTY_BRIDGE_PORT` | `0` (auto) | WebSocket port |
| `TREELISTY_DEBUG` | `false` | Enable debug logging |

## Output

On startup, the bridge outputs connection info to stderr:

```json
{
  "type": "bridge_ready",
  "port": 52341,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "version": "0.1.0"
}
```

TreeListy reads this to establish the WebSocket connection.

## MCP Tools

The bridge forwards these MCP tools to TreeListy:

| Tool | Description |
|------|-------------|
| `get_tree` | Get full tree structure |
| `get_tree_metadata` | Get tree hash, node count |
| `get_subtree` | Get node with descendants |
| `get_node` | Get single node |
| `create_node` | Create new node |
| `update_node` | Update node fields |
| `delete_node` | Remove node |
| `search_nodes` | Search by content/pattern |
| `import_structured_content` | Import research as subtree |
| `begin_transaction` | Start batch operation |
| `commit_transaction` | Commit with single saveState |
| `rollback_transaction` | Discard changes |
| `get_pattern_schema` | Get pattern field definitions |
| `get_activity_log` | Get agent activity history |

## Multi-Tab Support

The bridge supports multiple TreeListy tabs via `tabId`:

```json
{
  "method": "get_tree",
  "params": { "tabId": "tab-abc123" }
}
```

If only one tab is connected, `tabId` is optional.

## Development

```bash
# Clone repo
git clone https://github.com/Prairie2Cloud/treelisty

# Navigate to package
cd packages/treelisty-mcp-bridge

# Install dependencies
npm install

# Run locally
npm start

# Run with debug logging
TREELISTY_DEBUG=true npm start
```

## Testing

```bash
# Run tests
npm test
```

## License

MIT
