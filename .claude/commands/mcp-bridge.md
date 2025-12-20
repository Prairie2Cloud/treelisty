# TreeListy MCP Bridge

Connect Claude Code to TreeListy running in your browser.

## Option 1: MCP Server Mode (Recommended)

If the `treelisty` MCP server is configured in `.mcp.json`, it starts automatically.

Check the MCP server status/logs for connection info, then tell the user:
- Go to TreeListy (https://treelisty.netlify.app)
- Click **🤖 MCP** button in toolbar
- Enter the port and token from MCP server output

## Option 2: Manual Mode

If MCP server isn't configured, start manually:

```bash
node packages/treelisty-mcp-bridge/src/bridge.js
```

Parse stderr for `{"type":"bridge_ready","port":XXXXX,"token":"..."}` and give user the connection details.

## Available Tools (after browser connects)

- `get_tree` - Read full tree structure
- `get_tree_metadata` - Get node count, pattern, hash
- `get_node` / `get_subtree` - Read specific nodes
- `create_node` - Add new nodes
- `update_node` - Modify existing nodes
- `delete_node` - Remove nodes
- `search_nodes` - Find nodes by content
- `begin_transaction` / `commit_transaction` / `rollback_transaction` - Batch operations
