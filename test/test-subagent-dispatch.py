"""Test Sub-Agent Dispatch Logic (without bridge)"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("TEST: SUB-AGENT DISPATCH LOGIC")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        page.on('console', lambda msg: console_logs.append(msg.text))

        # Load LOCAL file
        print("\n[LOADING LOCAL FILE]")
        page.goto('file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build: {version}")

        # Clear orchestrator state
        page.evaluate('SubAgentOrchestrator.state.triggerLog = []')
        page.evaluate('SubAgentOrchestrator.state.pendingAgents = []')
        page.evaluate('SubAgentOrchestrator.state.lastDispatchTime = 0')

        # Test 1: Dispatch without bridge (should skip gracefully)
        print("\n[TEST 1: DISPATCH WITHOUT BRIDGE]")
        console_logs.clear()
        
        result = page.evaluate('''
            (async () => {
                const taskId = await SubAgentOrchestrator.dispatchSubAgent('researcher', {
                    message: 'Test without bridge',
                    trigger: { type: 'test' }
                });
                return taskId;
            })()
        ''')
        time.sleep(0.5)
        
        print(f"   Result: {result}")
        
        # Check console for skip message
        skip_logs = [log for log in console_logs if 'Sub-agent' in log or 'MCP' in log]
        for log in skip_logs:
            print(f"   Console: {log}")
        
        if result is None:
            print("   PASSED: Dispatch skipped (no bridge)")
        else:
            print("   Unexpected: Got task ID without bridge")

        # Test 2: Mock bridge connection and test dispatch
        print("\n[TEST 2: MOCK BRIDGE DISPATCH]")
        console_logs.clear()
        
        # Create mock bridge
        page.evaluate('''
            // Mock MCP bridge for testing
            window.mockTasksSent = [];
            window.mcpBridgeState = {
                client: {
                    isConnected: true,
                    submitTask: function(taskData) {
                        window.mockTasksSent.push(taskData);
                        console.log('[MOCK] Task submitted:', JSON.stringify(taskData).substring(0, 100));
                    }
                }
            };
        ''')
        time.sleep(0.5)
        
        # Now dispatch should work
        result2 = page.evaluate('''
            (async () => {
                const taskId = await SubAgentOrchestrator.dispatchSubAgent('validator', {
                    message: 'This always works',
                    claim: 'Always works claim',
                    trigger: { type: 'validation_needed' }
                });
                return taskId;
            })()
        ''')
        time.sleep(0.5)
        
        print(f"   Task ID: {result2}")
        
        # Check mock tasks
        mock_tasks = page.evaluate('window.mockTasksSent')
        print(f"   Tasks sent to mock bridge: {len(mock_tasks)}")
        
        if len(mock_tasks) > 0:
            task = mock_tasks[0]
            print(f"   Task type: {task.get('type')}")
            print(f"   Agent type: {task.get('agentType')}")
            print(f"   Silent: {task.get('options', {}).get('silent')}")
            print("   PASSED: Task dispatched via mock bridge")
        else:
            print("   FAILED: No task sent")

        # Test 3: Check pending agents
        print("\n[TEST 3: PENDING AGENTS]")
        pending = page.evaluate('SubAgentOrchestrator.state.pendingAgents')
        print(f"   Pending: {len(pending)}")
        for agent in pending:
            print(f"   - Type: {agent.get('type')}, ID: {agent.get('id')[:30]}...")

        # Test 4: Debounce check
        print("\n[TEST 4: DEBOUNCE (5s)]")
        result3 = page.evaluate('''
            (async () => {
                const taskId = await SubAgentOrchestrator.dispatchSubAgent('contrarian', {
                    message: 'Second dispatch',
                    trigger: { type: 'test' }
                });
                return taskId;
            })()
        ''')
        print(f"   Second dispatch result: {result3}")
        if result3 is None:
            print("   PASSED: Debounced (within 5s)")
        else:
            print("   Note: Debounce passed or not enforced")

        # Test 5: Max pending agents
        print("\n[TEST 5: MAX PENDING AGENTS (2)]")
        # Reset debounce
        page.evaluate('SubAgentOrchestrator.state.lastDispatchTime = 0')
        
        # Add fake pending agents to reach max
        page.evaluate('''
            SubAgentOrchestrator.state.pendingAgents = [
                { id: 'fake1', type: 'validator' },
                { id: 'fake2', type: 'researcher' }
            ];
        ''')
        
        result4 = page.evaluate('''
            (async () => {
                const taskId = await SubAgentOrchestrator.dispatchSubAgent('contrarian', {
                    message: 'Third dispatch',
                    trigger: { type: 'test' }
                });
                return taskId;
            })()
        ''')
        print(f"   Third dispatch (max pending): {result4}")
        if result4 is None:
            print("   PASSED: Max pending agents enforced")
        else:
            print("   FAILED: Should have been blocked")

        # Test 6: Console logs
        print("\n[CONSOLE LOGS]")
        for log in console_logs[-10:]:
            print(f"   {log[:70]}")

        # Screenshot
        page.screenshot(path='test/screenshots/subagent-dispatch.png')
        print("\n   Screenshot saved")

        print("\n" + "=" * 60)
        print("SUB-AGENT DISPATCH TEST COMPLETE")
        print("=" * 60)

        time.sleep(3)
        browser.close()

if __name__ == '__main__':
    test()
