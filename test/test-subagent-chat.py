"""Test Sub-Agent Triggers via addMessage"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("TEST: SUB-AGENT TRIGGER DETECTION")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Load live site
        print("\n[LOADING LIVE SITE]")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build: {version}")

        # Clear any existing trigger history
        page.evaluate('SubAgentOrchestrator.state.phraseHistory = []')
        page.evaluate('SubAgentOrchestrator.state.triggerLog = []')

        # Test 1: Detect speculation in assistant message
        print("\n[TEST 1: SPECULATION DETECTION]")
        triggers = page.evaluate('''
            SubAgentOrchestrator.detectTriggers(
                "I think this probably might work. I assume the approach could be correct.",
                "assistant"
            )
        ''')
        print(f"   Triggers: {triggers}")
        if triggers and any(t.get('type') == 'speculation' for t in triggers):
            print("   PASSED: Speculation detected")
        else:
            print("   FAILED")

        # Test 2: Finance domain
        print("\n[TEST 2: FINANCE DOMAIN]")
        triggers2 = page.evaluate('''
            SubAgentOrchestrator.detectTriggers(
                "What is the budget and cost for this investment?",
                "user"
            )
        ''')
        print(f"   Triggers: {triggers2}")
        if triggers2 and any(t.get('domain') == 'finance' for t in triggers2):
            print("   PASSED: Finance domain detected")
        else:
            print("   FAILED")

        # Test 3: Research domain
        print("\n[TEST 3: RESEARCH DOMAIN]")
        triggers3 = page.evaluate('''
            SubAgentOrchestrator.detectTriggers(
                "Find me academic papers and research studies on this topic",
                "user"
            )
        ''')
        print(f"   Triggers: {triggers3}")
        if triggers3 and any(t.get('domain') == 'research' for t in triggers3):
            print("   PASSED: Research domain detected")
        else:
            print("   FAILED")

        # Test 4: Technical domain
        print("\n[TEST 4: TECHNICAL DOMAIN]")
        triggers4 = page.evaluate('''
            SubAgentOrchestrator.detectTriggers(
                "There's a bug in the code, the function implementation has an error",
                "user"
            )
        ''')
        print(f"   Triggers: {triggers4}")
        if triggers4 and any(t.get('domain') == 'technical' for t in triggers4):
            print("   PASSED: Technical domain detected")
        else:
            print("   FAILED")

        # Test 5: Repetition detection
        print("\n[TEST 5: REPETITION DETECTION]")
        # Send same message 4 times
        for i in range(4):
            page.evaluate('''
                SubAgentOrchestrator.detectTriggers("help me with this task", "user")
            ''')
        
        # Check phrase history
        phrase_count = page.evaluate('''
            SubAgentOrchestrator.state.phraseHistory.filter(p => p.phrase.includes("help")).length
        ''')
        print(f"   Phrase count: {phrase_count}")
        
        # 4th message should trigger
        last_triggers = page.evaluate('''
            SubAgentOrchestrator.state.triggerLog.filter(
                t => t.triggers?.some(tr => tr.type === 'repetition')
            )
        ''')
        print(f"   Repetition triggers: {len(last_triggers)}")
        if len(last_triggers) > 0:
            print("   PASSED: Repetition detected")
        else:
            print("   FAILED")

        # Test 6: Validation needed (strong claims)
        print("\n[TEST 6: VALIDATION NEEDED]")
        triggers6 = page.evaluate('''
            SubAgentOrchestrator.detectTriggers(
                "This will always work and will never fail. I am 100% certain.",
                "assistant"
            )
        ''')
        print(f"   Triggers: {triggers6}")
        if triggers6 and any(t.get('type') == 'validation_needed' for t in triggers6):
            print("   PASSED: Validation trigger detected")
        else:
            print("   FAILED")

        # Test 7: Full flow - addMessage triggers detection
        print("\n[TEST 7: ADDMESSAGE INTEGRATION]")
        page.evaluate('SubAgentOrchestrator.state.triggerLog = []')  # Clear
        
        page.evaluate('''
            addMessage("I think this might probably work, I assume it could be right", "assistant")
        ''')
        time.sleep(0.5)
        
        log_count = page.evaluate('SubAgentOrchestrator.state.triggerLog.length')
        print(f"   Triggers after addMessage: {log_count}")
        if log_count > 0:
            print("   PASSED: addMessage triggers detection")
        else:
            print("   FAILED")

        # Final status
        print("\n[FINAL STATUS]")
        status = page.evaluate('SubAgentOrchestrator.getStatus()')
        print(f"   Enabled: {status.get('enabled')}")
        print(f"   Recent triggers: {len(status.get('recentTriggers', []))}")

        # Show trigger log
        trigger_log = page.evaluate('SubAgentOrchestrator.state.triggerLog.slice(-5)')
        print("\n[TRIGGER LOG (last 5)]")
        for i, entry in enumerate(trigger_log):
            trigger = entry.get('triggers', [{}])[0]
            print(f"   {i+1}. {trigger.get('type')}: {trigger.get('detail', '')[:45]}...")

        # Screenshot
        page.screenshot(path='test/screenshots/subagent-triggers.png')
        print("\n   Screenshot saved")

        print("\n" + "=" * 60)
        print("SUB-AGENT TRIGGER TEST COMPLETE")
        print("=" * 60)

        time.sleep(3)
        browser.close()

if __name__ == '__main__':
    test()
