"""Test Sub-Agent with Live MCP Bridge"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("TEST: SUB-AGENT WITH LIVE MCP BRIDGE")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        page.on('console', lambda msg: console_logs.append(msg.text))

        # Load LIVE site (has proper origin for WebSocket)
        print("\n[LOADING LIVE SITE]")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build: {version}")

        # Check initial bridge status
        print("\n[MCP BRIDGE STATUS]")
        bridge_connected = page.evaluate('mcpBridgeState?.client?.isConnected || false')
        print(f"   Connected: {bridge_connected}")

        # Clear orchestrator state
        page.evaluate('SubAgentOrchestrator.state.triggerLog = []')
        page.evaluate('SubAgentOrchestrator.state.pendingAgents = []')
        page.evaluate('SubAgentOrchestrator.state.lastDispatchTime = 0')

        # Test 1: Try dispatch
        print("\n[TEST 1: DISPATCH ATTEMPT]")
        console_logs.clear()
        
        result = page.evaluate('''
            (async () => {
                const taskId = await SubAgentOrchestrator.dispatchSubAgent('researcher', {
                    message: 'What are best practices for testing?',
                    trigger: { type: 'domain_question', detail: 'research domain' },
                    domain: 'research'
                });
                return taskId;
            })()
        ''')
        time.sleep(1)
        
        print(f"   Task ID: {result}")
        
        # Check console
        for log in console_logs:
            if 'Sub-agent' in log or 'subagent' in log.lower():
                print(f"   Console: {log}")

        # Test 2: Check pending if dispatch worked
        print("\n[TEST 2: ORCHESTRATOR STATE]")
        status = page.evaluate('SubAgentOrchestrator.getStatus()')
        print(f"   Enabled: {status.get('enabled')}")
        print(f"   Pending: {status.get('pendingAgents')}")
        print(f"   Last dispatch: {status.get('lastDispatch')}")

        # Test 3: TreeBeard command
        print("\n[TEST 3: TREEBEARD FORCE_SUBAGENT]")
        force_result = page.evaluate('COMMAND_REGISTRY["force_subagent"]("validator")')
        time.sleep(1)
        
        # force_subagent is async, check result
        if isinstance(force_result, dict):
            print(f"   Result: {force_result}")
        else:
            # It returns a promise, evaluate it
            force_result2 = page.evaluate('''
                (async () => {
                    return await COMMAND_REGISTRY["force_subagent"]("validator");
                })()
            ''')
            print(f"   Result: {str(force_result2)[:100]}...")

        # Test 4: Final status via command
        print("\n[TEST 4: SUBAGENT_STATUS COMMAND]")
        status_output = page.evaluate('COMMAND_REGISTRY["subagent_status"]()')
        for line in status_output.split('\n')[:10]:
            print(f"   {line}")

        # Show bridge-related logs
        print("\n[MCP/BRIDGE LOGS]")
        mcp_logs = [log for log in console_logs if 'MCP' in log or 'bridge' in log.lower() or 'Sub-agent' in log]
        for log in mcp_logs[-8:]:
            print(f"   {log[:70]}")

        # Screenshot
        page.screenshot(path='test/screenshots/subagent-live-bridge.png')
        print("\n   Screenshot saved")

        print("\n" + "=" * 60)
        print("LIVE BRIDGE TEST COMPLETE")
        print("=" * 60)

        time.sleep(3)
        browser.close()

if __name__ == '__main__':
    test()
