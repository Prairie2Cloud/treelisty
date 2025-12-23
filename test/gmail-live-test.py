"""
Gmail Live Test - Tests actual Gmail operations via MCP Bridge
"""
from playwright.sync_api import sync_playwright
import json
import time

# Real thread ID from exported Gmail
TEST_THREAD_ID = "19b4a9f3e728f62e"

def test_gmail_live():
    console_messages = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        def handle_console(msg):
            text = msg.text
            console_messages.append(f"[{msg.type}] {text}")
            if '[Gmail]' in text:
                print(f">>> {text}")

        page.on('console', handle_console)

        print("1. Loading TreeListy...")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        print("\n2. Checking MCP connection...")
        mcp_status = page.evaluate("""() => ({
            status: window.mcpBridgeState?.status || 'unknown',
            connected: window.mcpBridgeState?.client?.socket?.readyState === 1
        })""")
        print(f"   Status: {mcp_status}")

        if not mcp_status.get('connected'):
            print("\n❌ MCP Bridge not connected!")
            browser.close()
            return

        print("\n3. Testing gmail_star (adding star)...")
        result = page.evaluate(f"""async () => {{
            try {{
                const result = await sendGmailAction('gmail_star', {{ thread_id: '{TEST_THREAD_ID}' }});
                return {{ success: true, result }};
            }} catch (err) {{
                return {{ success: false, error: err.message }};
            }}
        }}""")
        print(f"   Result: {json.dumps(result, indent=2)}")

        if result.get('result', {}).get('success'):
            print("\n4. Testing gmail_unstar (removing star)...")
            result2 = page.evaluate(f"""async () => {{
                try {{
                    const result = await sendGmailAction('gmail_unstar', {{ thread_id: '{TEST_THREAD_ID}' }});
                    return {{ success: true, result }};
                }} catch (err) {{
                    return {{ success: false, error: err.message }};
                }}
            }}""")
            print(f"   Result: {json.dumps(result2, indent=2)}")

        print("\n5. Testing gmail_mark_read...")
        result3 = page.evaluate(f"""async () => {{
            try {{
                const result = await sendGmailAction('gmail_mark_read', {{ thread_id: '{TEST_THREAD_ID}' }});
                return {{ success: true, result }};
            }} catch (err) {{
                return {{ success: false, error: err.message }};
            }}
        }}""")
        print(f"   Result: {json.dumps(result3, indent=2)}")

        print("\n=== Console Log ===")
        for msg in console_messages[-15:]:
            if '[Gmail]' in msg:
                print(msg)

        print("\n6. Keeping browser open for 3 seconds...")
        time.sleep(3)
        browser.close()

    print("\n=== Live Test Complete ===")

if __name__ == '__main__':
    test_gmail_live()
