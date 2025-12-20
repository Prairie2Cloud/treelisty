"""Test MCP Bridge UI in TreeListy browser"""
from playwright.sync_api import sync_playwright
import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def test_mcp_bridge():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Track dialog events
        dialogs_received = []

        def handle_dialog(dialog):
            dialogs_received.append({
                'type': dialog.type,
                'message': dialog.message,
                'default': dialog.default_value
            })
            print(f"    Dialog: {dialog.type} - {dialog.message}")
            # Dismiss prompts (simulating cancel)
            dialog.dismiss()

        page.on('dialog', handle_dialog)

        print("[1] Navigating to TreeListy...")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        print("    Page loaded successfully")

        # Check version
        version_text = page.locator('text=Build').first.inner_text() if page.locator('text=Build').count() > 0 else 'unknown'
        print(f"    Version: {version_text}")

        # Find MCP button
        print("\n[2] Looking for MCP button...")
        mcp_button = page.locator('#mcp-bridge-btn')

        if mcp_button.count() == 0:
            print("    ERROR: MCP button not found!")
            # Search for it in page content
            content = page.content()
            if 'mcp-bridge-btn' in content:
                print("    Button ID found in HTML but not rendered")
            browser.close()
            return False

        # Get button text
        btn_text = mcp_button.inner_text()
        print(f"    MCP button found: '{btn_text}'")

        # Take screenshot before click
        page.screenshot(path='D:/OneDrive/Desktop/Production-Versions/treeplexity/test/screenshots/mcp-01-before-click.png')

        # Click MCP button
        print("\n[3] Clicking MCP button...")
        mcp_button.click()
        page.wait_for_timeout(500)

        # Take screenshot
        page.screenshot(path='D:/OneDrive/Desktop/Production-Versions/treeplexity/test/screenshots/mcp-02-after-click.png')

        # Check dialogs
        print("\n[4] Checking prompts...")
        if len(dialogs_received) > 0:
            print(f"    Received {len(dialogs_received)} dialog(s):")
            for d in dialogs_received:
                print(f"      - {d['type']}: {d['message'][:50]}...")
            print("    SUCCESS: MCP connect flow triggered!")
        else:
            print("    WARNING: No dialogs received (may be blocked in headless)")

        # Verify global function exists
        print("\n[5] Checking MCP functions...")
        result = page.evaluate('''() => {
            return {
                showMCPConnectModal: typeof window.showMCPConnectModal === 'function',
                initMCPBridge: typeof window.initMCPBridge === 'function',
                disconnectMCPBridge: typeof window.disconnectMCPBridge === 'function',
                mcpBridgeState: window.mcpBridgeState ? {
                    status: window.mcpBridgeState.status,
                    hasClient: !!window.mcpBridgeState.client
                } : null,
                TreeListyMCPClient: typeof window.TreeListyMCPClient === 'function',
                TreeListyMCPHandler: typeof window.TreeListyMCPHandler === 'function'
            }
        }''')

        print(f"    showMCPConnectModal: {result['showMCPConnectModal']}")
        print(f"    initMCPBridge: {result['initMCPBridge']}")
        print(f"    disconnectMCPBridge: {result['disconnectMCPBridge']}")
        print(f"    TreeListyMCPClient class: {result['TreeListyMCPClient']}")
        print(f"    TreeListyMCPHandler class: {result['TreeListyMCPHandler']}")
        if result['mcpBridgeState']:
            print(f"    mcpBridgeState.status: {result['mcpBridgeState']['status']}")

        browser.close()

        print("\n" + "="*50)
        # Core functions are what matter - classes are internal
        core_functions = all([
            result['showMCPConnectModal'],
            result['initMCPBridge'],
            result['disconnectMCPBridge']
        ])
        has_state = result['mcpBridgeState'] is not None
        dialog_triggered = len(dialogs_received) > 0

        if core_functions and has_state and dialog_triggered:
            print("SUCCESS: MCP Bridge UI is fully functional!")
            print("  - Connect/disconnect functions: OK")
            print("  - Bridge state tracking: OK")
            print("  - Port prompt triggered: OK")
            return True
        else:
            print("FAILURE: MCP Bridge has issues")
            if not core_functions:
                print("  - Missing core functions")
            if not has_state:
                print("  - Missing bridge state")
            if not dialog_triggered:
                print("  - Dialog not triggered")
            return False

if __name__ == '__main__':
    import os
    os.makedirs('D:/OneDrive/Desktop/Production-Versions/treeplexity/test/screenshots', exist_ok=True)

    success = test_mcp_bridge()
    sys.exit(0 if success else 1)
