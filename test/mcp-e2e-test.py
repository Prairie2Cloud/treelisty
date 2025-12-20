"""End-to-end MCP Bridge test: Bridge + Browser + Tool calls"""
from playwright.sync_api import sync_playwright
import subprocess
import json
import time
import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def test_mcp_e2e():
    bridge_process = None
    browser = None

    try:
        # ================================================================
        # STEP 1: Start the MCP Bridge
        # ================================================================
        print("="*60)
        print("[1] Starting MCP Bridge...")
        print("="*60)

        bridge_dir = "D:/OneDrive/Desktop/Production-Versions/treeplexity/packages/treelisty-mcp-bridge"
        bridge_process = subprocess.Popen(
            ["node", "src/bridge.js"],
            cwd=bridge_dir,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            encoding='utf-8',
            errors='replace'
        )

        # Read bridge ready message from stderr
        print("    Waiting for bridge ready...")
        bridge_info = None
        for _ in range(50):  # 5 second timeout
            line = bridge_process.stderr.readline()
            if line:
                print(f"    Bridge: {line.strip()[:80]}")
                try:
                    data = json.loads(line.strip())
                    if data.get('type') == 'bridge_ready':
                        bridge_info = data
                        break
                except:
                    pass
            time.sleep(0.1)

        if not bridge_info:
            print("    ERROR: Bridge did not start!")
            return False

        port = bridge_info['port']
        token = bridge_info['token']
        print(f"    Bridge ready on port {port}")
        print(f"    Token: {token[:20]}...")

        # ================================================================
        # STEP 2: Initialize MCP protocol
        # ================================================================
        print("\n" + "="*60)
        print("[2] Initializing MCP Protocol...")
        print("="*60)

        # Send initialize request
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "clientInfo": {"name": "e2e-test", "version": "1.0.0"},
                "capabilities": {}
            }
        }
        bridge_process.stdin.write(json.dumps(init_request) + "\n")
        bridge_process.stdin.flush()

        # Read response
        init_response = bridge_process.stdout.readline()
        print(f"    Init response: {init_response.strip()[:80]}...")

        # Send initialized notification
        init_notif = {"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}}
        bridge_process.stdin.write(json.dumps(init_notif) + "\n")
        bridge_process.stdin.flush()
        print("    MCP initialized")

        # ================================================================
        # STEP 3: Connect browser to bridge
        # ================================================================
        print("\n" + "="*60)
        print("[3] Connecting Browser to Bridge...")
        print("="*60)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Capture console logs
            console_logs = []
            page.on('console', lambda msg: console_logs.append(f"{msg.type}: {msg.text}"))

            print("    Loading TreeListy...")
            page.goto('https://treelisty.netlify.app')
            page.wait_for_load_state('networkidle')
            print("    Page loaded")

            # Connect to bridge via JavaScript
            print(f"    Connecting to bridge (port={port})...")
            connect_result = page.evaluate(f'''async () => {{
                try {{
                    await window.initMCPBridge({port}, "{token}");
                    return {{
                        success: true,
                        status: window.mcpBridgeState.status,
                        connected: window.mcpBridgeState.client?.isConnected
                    }};
                }} catch (err) {{
                    return {{ success: false, error: err.message }};
                }}
            }}''')

            print(f"    Connect result: {connect_result}")

            if not connect_result.get('success'):
                print(f"    ERROR: Connection failed - {connect_result.get('error')}")
                # Print console logs for debugging
                print("    Console logs:")
                for log in console_logs[-10:]:
                    print(f"      {log}")
                return False

            print("    Browser connected to bridge!")

            # Wait for connection to stabilize
            time.sleep(0.5)

            # ================================================================
            # STEP 4: Test MCP Tool Calls
            # ================================================================
            print("\n" + "="*60)
            print("[4] Testing MCP Tool Calls...")
            print("="*60)

            # Test get_tree
            print("\n    [4a] Calling get_tree...")
            get_tree_request = {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {
                    "name": "get_tree",
                    "arguments": {"format": "agent"}
                }
            }
            bridge_process.stdin.write(json.dumps(get_tree_request) + "\n")
            bridge_process.stdin.flush()

            # Read response (may need to wait for browser to process)
            time.sleep(1)
            response_line = bridge_process.stdout.readline()
            print(f"    Response: {response_line.strip()[:100]}...")

            try:
                response = json.loads(response_line)
                result = response.get('result')
                if result:
                    # Result may be direct tree data or wrapped in content[]
                    if isinstance(result, dict) and 'content' in result:
                        content = result['content']
                        if content and content[0].get('type') == 'text':
                            tree_data = json.loads(content[0]['text'])
                        else:
                            tree_data = result
                    else:
                        tree_data = result
                    print(f"    Tree name: {tree_data.get('name', 'unknown')}")
                    print(f"    Children: {len(tree_data.get('children', []))}")
                    print("    get_tree: SUCCESS")
                elif response.get('error'):
                    print(f"    get_tree: ERROR - {response['error']}")
                else:
                    print(f"    get_tree: UNEXPECTED - {response}")
            except Exception as e:
                print(f"    get_tree: PARSE ERROR - {e}")

            # Test get_tree_metadata
            print("\n    [4b] Calling get_tree_metadata...")
            metadata_request = {
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {
                    "name": "get_tree_metadata",
                    "arguments": {}
                }
            }
            bridge_process.stdin.write(json.dumps(metadata_request) + "\n")
            bridge_process.stdin.flush()

            time.sleep(0.5)
            response_line = bridge_process.stdout.readline()
            print(f"    Response: {response_line.strip()[:100]}...")

            try:
                response = json.loads(response_line)
                result = response.get('result')
                if result:
                    # Handle both direct and wrapped formats
                    if isinstance(result, dict) and 'content' in result:
                        metadata = json.loads(result['content'][0]['text'])
                    else:
                        metadata = result
                    print(f"    Node count: {metadata.get('nodeCount', 'unknown')}")
                    print(f"    Pattern: {metadata.get('pattern', 'unknown')}")
                    print("    get_tree_metadata: SUCCESS")
            except Exception as e:
                print(f"    get_tree_metadata: PARSE ERROR - {e}")

            # Test search_nodes
            print("\n    [4c] Calling search_nodes...")
            search_request = {
                "jsonrpc": "2.0",
                "id": 4,
                "method": "tools/call",
                "params": {
                    "name": "search_nodes",
                    "arguments": {"query": "Welcome"}
                }
            }
            bridge_process.stdin.write(json.dumps(search_request) + "\n")
            bridge_process.stdin.flush()

            time.sleep(0.5)
            response_line = bridge_process.stdout.readline()
            print(f"    Response: {response_line.strip()[:100]}...")

            try:
                response = json.loads(response_line)
                result = response.get('result')
                if result:
                    # Handle both direct and wrapped formats
                    if isinstance(result, dict) and 'content' in result:
                        results = json.loads(result['content'][0]['text'])
                    elif isinstance(result, list):
                        results = result
                    else:
                        results = [result]
                    print(f"    Found {len(results)} matching nodes")
                    if results:
                        print(f"    First match: {results[0].get('name', 'unknown')[:30]}")
                    print("    search_nodes: SUCCESS")
            except Exception as e:
                print(f"    search_nodes: PARSE ERROR - {e}")

            # ================================================================
            # STEP 5: Verify connection state
            # ================================================================
            print("\n" + "="*60)
            print("[5] Final State Check...")
            print("="*60)

            final_state = page.evaluate('''() => ({
                status: window.mcpBridgeState.status,
                connected: window.mcpBridgeState.client?.isConnected,
                activityLog: window.mcpBridgeState.activityLog?.length || 0
            })''')

            print(f"    Bridge status: {final_state['status']}")
            print(f"    Client connected: {final_state['connected']}")
            print(f"    Activity log entries: {final_state['activityLog']}")

            # Disconnect
            print("\n    Disconnecting...")
            page.evaluate('window.disconnectMCPBridge()')
            time.sleep(0.3)

            browser.close()
            browser = None

        print("\n" + "="*60)
        print("SUCCESS: End-to-end MCP test completed!")
        print("="*60)
        return True

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        if bridge_process:
            bridge_process.terminate()
            bridge_process.wait(timeout=5)
            print("\nBridge process terminated")

if __name__ == '__main__':
    success = test_mcp_e2e()
    sys.exit(0 if success else 1)
