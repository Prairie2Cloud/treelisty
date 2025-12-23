"""
Gmail Sync Debug Test
Tests Gmail sync functionality and captures console output to diagnose errors.
"""
from playwright.sync_api import sync_playwright
import json
import time

def test_gmail_sync():
    console_messages = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Visible for debugging
        page = browser.new_page()

        # Capture console messages
        def handle_console(msg):
            text = msg.text
            console_messages.append(f"[{msg.type}] {text}")
            if '[Gmail]' in text or 'gmail' in text.lower():
                print(f">>> {text}")

        page.on('console', handle_console)

        print("1. Loading TreeListy...")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        time.sleep(3)  # Wait for full initialization

        print("2. Checking version...")
        version = page.evaluate("() => window.TREELISTY_VERSION?.full || 'unknown'")
        print(f"   Version: {version}")

        print("3. Checking MCP connection status...")
        mcp_status = page.evaluate("""() => {
            return {
                status: window.mcpBridgeState?.status || 'unknown',
                connected: window.mcpBridgeState?.client?.socket?.readyState === 1
            }
        }""")
        print(f"   MCP Status: {mcp_status}")

        if not mcp_status.get('connected'):
            print("\n⚠️  MCP Bridge not connected - cannot test Gmail sync")
            print("   Make sure the bridge is running: node src/bridge.js")
            browser.close()
            return

        print("4. Testing Gmail auth check via sendGmailAction...")
        result = page.evaluate("""async () => {
            if (typeof sendGmailAction !== 'function') {
                return { success: false, error: 'sendGmailAction not found' };
            }
            try {
                console.log('[Gmail] Testing auth check...');
                const result = await sendGmailAction('gmail_check_auth', {});
                console.log('[Gmail] Auth check result:', JSON.stringify(result));
                return { success: true, result };
            } catch (err) {
                console.log('[Gmail] Auth check error:', err.message);
                return { success: false, error: err.message };
            }
        }""")
        print(f"   Auth check result: {json.dumps(result, indent=2)}")

        print("5. Testing Gmail archive (with fake thread ID)...")
        result2 = page.evaluate("""async () => {
            if (typeof sendGmailAction !== 'function') {
                return { success: false, error: 'sendGmailAction not found' };
            }
            try {
                console.log('[Gmail] Testing archive...');
                const result = await sendGmailAction('gmail_archive', { thread_id: 'test-thread-123' });
                console.log('[Gmail] Archive result:', JSON.stringify(result));
                return { success: true, result };
            } catch (err) {
                console.log('[Gmail] Archive error:', err.message);
                return { success: false, error: err.message };
            }
        }""")
        print(f"   Archive result: {json.dumps(result2, indent=2)}")

        print("\n=== Recent Console Messages ===")
        gmail_msgs = [m for m in console_messages if '[Gmail]' in m]
        for msg in gmail_msgs[-10:]:
            print(msg)

        print("\n6. Keeping browser open for 5 seconds...")
        time.sleep(5)

        browser.close()

    print("\n=== Test Complete ===")

if __name__ == '__main__':
    test_gmail_sync()
