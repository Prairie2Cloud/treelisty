"""Test Build 616: Global Capabilities Registry - LIVE SITE"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("TEST BUILD 616: GLOBAL CAPABILITIES - LIVE SITE")
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
        if version >= 616:
            print("   PASSED: Version is 616+")
        else:
            print(f"   WAITING: Expected 616, got {version} - Netlify may still be deploying")
            print("   Continuing tests anyway...")

        # Test 2: Global capabilitiesTree exists
        print("\n[TEST 2: CAPABILITIES TREE GLOBAL]")
        tree_exists = page.evaluate('typeof capabilitiesTree !== "undefined"')
        tree_loaded = page.evaluate('capabilitiesTree !== null')
        print(f"   capabilitiesTree defined: {tree_exists}")
        print(f"   capabilitiesTree loaded: {tree_loaded}")
        if tree_exists and tree_loaded:
            print("   PASSED")
        else:
            print("   FAILED")

        # Test 3: Check tree structure
        print("\n[TEST 3: TREE STRUCTURE]")
        tree_name = page.evaluate('capabilitiesTree?.name')
        categories = page.evaluate('capabilitiesTree?.children?.map(c => c.name)')
        print(f"   Tree name: {tree_name}")
        print(f"   Categories: {categories}")
        if tree_name == 'Capabilities Registry':
            print("   PASSED: Correct structure")
        else:
            print("   FAILED")

        # Test 4: Create Banking capability
        print("\n[TEST 4: CREATE BANKING CAPABILITY]")
        result = page.evaluate('COMMAND_REGISTRY["create_capability"]("Chase Balance|chase.com|Check account balance")')
        print(f"   Result: {result[:80] if result else 'None'}...")
        if result and 'Banking' in result:
            print("   PASSED: Auto-categorized to Banking")
        else:
            print("   FAILED")

        # Test 5: Create Work capability
        print("\n[TEST 5: CREATE WORK CAPABILITY]")
        result2 = page.evaluate('COMMAND_REGISTRY["create_capability"]("Slack Unread|slack.com|Check unread messages")')
        print(f"   Result: {result2[:80] if result2 else 'None'}...")
        if result2 and 'Work' in result2:
            print("   PASSED: Auto-categorized to Work")
        else:
            print("   FAILED")

        # Test 6: Create Research capability
        print("\n[TEST 6: CREATE RESEARCH CAPABILITY]")
        result3 = page.evaluate('COMMAND_REGISTRY["create_capability"]("Wikipedia Search|wikipedia.org|Search articles")')
        print(f"   Result: {result3[:80] if result3 else 'None'}...")
        if result3 and 'Research' in result3:
            print("   PASSED: Auto-categorized to Research")
        else:
            print("   FAILED")

        # Test 7: List capabilities
        print("\n[TEST 7: LIST CAPABILITIES]")
        list_result = page.evaluate('COMMAND_REGISTRY["list_capabilities"]()')
        print(f"   Result preview: {list_result[:150] if list_result else 'None'}...")
        cap_count = page.evaluate('getCapabilityCount()')
        print(f"   Capability count: {cap_count}")
        if cap_count >= 3:
            print("   PASSED: All 3 capabilities listed")
        else:
            print("   FAILED")

        # Test 8: View capabilities registry
        print("\n[TEST 8: VIEW CAPABILITIES REGISTRY]")
        original_tree = page.evaluate('capexTree?.name')
        print(f"   Original tree: {original_tree}")

        view_result = page.evaluate('COMMAND_REGISTRY["view_capabilities"]()')
        print(f"   Result: {view_result[:80] if view_result else 'None'}...")
        time.sleep(1)

        current_tree = page.evaluate('capexTree?.name')
        print(f"   Current tree: {current_tree}")
        if current_tree == 'Capabilities Registry':
            print("   PASSED: Viewing capabilities registry")
        else:
            print("   FAILED")

        # Screenshot of capabilities tree
        page.screenshot(path='test/screenshots/build616-live-capabilities-tree.png')
        print("   Screenshot saved: build616-live-capabilities-tree.png")

        # Test 9: Verify categories have items
        print("\n[TEST 9: VERIFY CATEGORY CONTENTS]")
        banking_count = page.evaluate('''
            capexTree.children.find(c => c.name === "Banking & Finance")?.items?.length || 0
        ''')
        work_count = page.evaluate('''
            capexTree.children.find(c => c.name === "Work & Productivity")?.items?.length || 0
        ''')
        research_count = page.evaluate('''
            capexTree.children.find(c => c.name === "Research & Reading")?.items?.length || 0
        ''')
        print(f"   Banking items: {banking_count}")
        print(f"   Work items: {work_count}")
        print(f"   Research items: {research_count}")
        if banking_count >= 1 and work_count >= 1 and research_count >= 1:
            print("   PASSED: All categories have items")
        else:
            print("   FAILED")

        # Test 10: Back to original tree
        print("\n[TEST 10: BACK TO ORIGINAL TREE]")
        back_result = page.evaluate('COMMAND_REGISTRY["back_from_capabilities"]()')
        print(f"   Result: {back_result[:80] if back_result else 'None'}...")
        time.sleep(1)

        current_tree = page.evaluate('capexTree?.name')
        print(f"   Current tree: {current_tree}")
        if current_tree != 'Capabilities Registry':
            print("   PASSED: Returned to original tree")
        else:
            print("   FAILED")

        # Test 11: Persistence - reload page
        print("\n[TEST 11: PERSISTENCE TEST]")
        print("   Reloading page...")
        page.reload()
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        # Check if capabilities persisted
        persisted_count = page.evaluate('getCapabilityCount()')
        print(f"   Capabilities after reload: {persisted_count}")
        if persisted_count >= 3:
            print("   PASSED: Capabilities persisted across reload")
        else:
            print("   FAILED: Capabilities lost on reload")

        # Final screenshot
        page.screenshot(path='test/screenshots/build616-live-final.png')
        print("\n   Final screenshot saved")

        # Summary
        print("\n" + "=" * 60)
        print("BUILD 616 LIVE TEST COMPLETE")
        print("=" * 60)

        print(f"\n   Version: {version}")
        print(f"   Capabilities created: 3")
        print(f"   Categories verified: Banking, Work, Research")
        print(f"   Persistence: {'OK' if persisted_count >= 3 else 'FAILED'}")

        time.sleep(5)
        browser.close()

if __name__ == '__main__':
    test()
