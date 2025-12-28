"""Test Build 620: Sub-Agent Architecture - LIVE SITE"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("TEST BUILD 620: SUB-AGENT ARCHITECTURE")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Load live Netlify site
        print("\n[LOADING LIVE SITE]")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        # Test 1: Version check
        print("\n[TEST 1: VERSION CHECK]")
        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build: {version}")
        if version >= 620:
            print("   PASSED: Build 620+")
        else:
            print(f"   WAITING: Netlify deploying (got {version})")

        # Test 2: SubAgentOrchestrator exists
        print("\n[TEST 2: SUBAGENT ORCHESTRATOR EXISTS]")
        orchestrator_exists = page.evaluate('typeof SubAgentOrchestrator !== "undefined"')
        print(f"   SubAgentOrchestrator defined: {orchestrator_exists}")
        if orchestrator_exists:
            print("   PASSED")
        else:
            print("   FAILED")

        # Test 3: Check orchestrator config
        print("\n[TEST 3: ORCHESTRATOR CONFIG]")
        config = page.evaluate('SubAgentOrchestrator.config')
        print(f"   enabled: {config.get('enabled')}")
        print(f"   repetitionThreshold: {config.get('repetitionThreshold')}")
        print(f"   debounceMs: {config.get('debounceMs')}")
        print(f"   maxPendingAgents: {config.get('maxPendingAgents')}")
        if config.get('enabled') and config.get('repetitionThreshold') == 3:
            print("   PASSED: Config looks correct")
        else:
            print("   FAILED")

        # Test 4: Get status via orchestrator
        print("\n[TEST 4: ORCHESTRATOR STATUS]")
        status = page.evaluate('SubAgentOrchestrator.getStatus()')
        print(f"   Status: {status}")
        if 'enabled' in status and 'pendingAgents' in status:
            print("   PASSED: getStatus() works")
        else:
            print("   FAILED")

        # Test 5: COMMAND_REGISTRY has subagent commands
        print("\n[TEST 5: TREEBEARD COMMANDS]")
        has_status = page.evaluate('"subagent_status" in COMMAND_REGISTRY')
        has_toggle = page.evaluate('"toggle_subagents" in COMMAND_REGISTRY')
        has_force = page.evaluate('"force_subagent" in COMMAND_REGISTRY')
        print(f"   subagent_status: {has_status}")
        print(f"   toggle_subagents: {has_toggle}")
        print(f"   force_subagent: {has_force}")
        if has_status and has_toggle and has_force:
            print("   PASSED: All commands registered")
        else:
            print("   FAILED")

        # Test 6: Execute subagent_status command
        print("\n[TEST 6: EXECUTE subagent_status]")
        result = page.evaluate('COMMAND_REGISTRY["subagent_status"]()')
        print(f"   Result preview:")
        for line in result.split('\n')[:8]:
            print(f"      {line}")
        if 'Sub-Agent Orchestrator' in result and 'Enabled' in result:
            print("   PASSED: Command returns expected format")
        else:
            print("   FAILED")

        # Test 7: Toggle subagents off and on
        print("\n[TEST 7: TOGGLE SUBAGENTS]")
        toggle_off = page.evaluate('COMMAND_REGISTRY["toggle_subagents"]("off")')
        print(f"   Toggle off: {'DISABLED' in toggle_off}")
        
        is_disabled = page.evaluate('!SubAgentOrchestrator.config.enabled')
        print(f"   Config disabled: {is_disabled}")
        
        toggle_on = page.evaluate('COMMAND_REGISTRY["toggle_subagents"]("on")')
        print(f"   Toggle on: {'ENABLED' in toggle_on}")
        
        is_enabled = page.evaluate('SubAgentOrchestrator.config.enabled')
        print(f"   Config enabled: {is_enabled}")
        
        if is_enabled:
            print("   PASSED: Toggle works correctly")
        else:
            print("   FAILED")

        # Test 8: Trigger detection (simulate messages)
        print("\n[TEST 8: TRIGGER DETECTION]")
        # Add some speculative content
        triggers = page.evaluate('''
            SubAgentOrchestrator.detectTriggers(
                "I think this might probably work, I assume it could be correct",
                "assistant"
            )
        ''')
        print(f"   Speculation triggers: {triggers}")
        if triggers and len(triggers) > 0:
            print("   PASSED: Speculation detected")
        else:
            print("   FAILED: No triggers detected")

        # Test 9: Domain detection
        print("\n[TEST 9: DOMAIN QUESTION DETECTION]")
        domain_triggers = page.evaluate('''
            SubAgentOrchestrator.detectTriggers(
                "What is the budget and cost for this investment?",
                "user"
            )
        ''')
        print(f"   Domain triggers: {domain_triggers}")
        if domain_triggers and any(t.get('domain') == 'finance' for t in domain_triggers):
            print("   PASSED: Finance domain detected")
        else:
            print("   FAILED")

        # Screenshot
        page.screenshot(path='test/screenshots/build620-subagent.png')
        print("\n   Screenshot saved")

        # Summary
        print("\n" + "=" * 60)
        print("BUILD 620 SUB-AGENT TEST COMPLETE")
        print("=" * 60)

        time.sleep(3)
        browser.close()

if __name__ == '__main__':
    test()
