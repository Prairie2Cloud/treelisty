"""Verify Build 616: Global Capabilities Registry"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("VERIFY BUILD 616: GLOBAL CAPABILITIES REGISTRY")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Load local file
        print("\n[LOADING LOCAL FILE]")
        page.goto('file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        # Test 1: Version check
        print("\n[TEST 1: VERSION CHECK]")
        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build: {version}")
        if version == 616:
            print("   PASSED: Version is 616")
        else:
            print(f"   FAILED: Expected 616, got {version}")

        # Test 2: Global capabilitiesTree exists
        print("\n[TEST 2: CAPABILITIES TREE GLOBAL]")
        tree_exists = page.evaluate('typeof capabilitiesTree !== "undefined"')
        print(f"   capabilitiesTree defined: {tree_exists}")
        if tree_exists:
            print("   PASSED")
        else:
            print("   FAILED")

        # Test 3: Load/save functions exist
        print("\n[TEST 3: LOAD/SAVE FUNCTIONS]")
        load_fn = page.evaluate('typeof loadCapabilitiesTree === "function"')
        save_fn = page.evaluate('typeof saveCapabilitiesTree === "function"')
        add_fn = page.evaluate('typeof addCapabilityToRegistry === "function"')
        print(f"   loadCapabilitiesTree: {load_fn}")
        print(f"   saveCapabilitiesTree: {save_fn}")
        print(f"   addCapabilityToRegistry: {add_fn}")
        if load_fn and save_fn and add_fn:
            print("   PASSED: All functions exist")
        else:
            print("   FAILED")

        # Test 4: Create capability via COMMAND_REGISTRY
        print("\n[TEST 4: CREATE CAPABILITY VIA COMMAND]")
        result = page.evaluate('COMMAND_REGISTRY["create_capability"]("Chase Balance|chase.com|Read checking account balance")')
        print(f"   Result: {result[:100] if result else 'None'}...")
        cap_created = 'Banking' in result if result else False
        if cap_created:
            print("   PASSED: Capability created and auto-categorized to Banking")
        else:
            print("   FAILED")

        # Test 5: Create another capability (work category)
        print("\n[TEST 5: CREATE WORK CAPABILITY]")
        result2 = page.evaluate('COMMAND_REGISTRY["create_capability"]("Slack Messages|slack.com|Read unread messages")')
        print(f"   Result: {result2[:100] if result2 else 'None'}...")
        work_created = 'Work' in result2 if result2 else False
        if work_created:
            print("   PASSED: Capability auto-categorized to Work")
        else:
            print("   FAILED")

        # Test 6: List capabilities
        print("\n[TEST 6: LIST CAPABILITIES]")
        list_result = page.evaluate('COMMAND_REGISTRY["list_capabilities"]()')
        print(f"   Result: {list_result[:150] if list_result else 'None'}...")
        has_both = 'Chase Balance' in list_result and 'Slack Messages' in list_result if list_result else False
        if has_both:
            print("   PASSED: Both capabilities found in list")
        else:
            print("   FAILED")

        # Test 7: Verify global tree structure
        print("\n[TEST 7: GLOBAL TREE STRUCTURE]")
        tree_name = page.evaluate('capabilitiesTree?.name')
        tree_id = page.evaluate('capabilitiesTree?.treeId')
        categories = page.evaluate('capabilitiesTree?.children?.map(c => c.name)')
        print(f"   Tree name: {tree_name}")
        print(f"   Tree ID: {tree_id}")
        print(f"   Categories: {categories}")
        if tree_name == 'Capabilities Registry' and len(categories) >= 4:
            print("   PASSED: Correct tree structure")
        else:
            print("   FAILED")

        # Test 8: Count capabilities
        print("\n[TEST 8: CAPABILITY COUNT]")
        count = page.evaluate('getCapabilityCount()')
        print(f"   Capability count: {count}")
        if count >= 2:
            print("   PASSED: At least 2 capabilities")
        else:
            print("   FAILED")

        # Test 9: View capabilities command
        print("\n[TEST 9: VIEW CAPABILITIES COMMAND]")
        view_result = page.evaluate('COMMAND_REGISTRY["view_capabilities"]()')
        print(f"   Result: {view_result[:100] if view_result else 'None'}...")

        # Check if we're viewing capabilities tree
        time.sleep(1)
        current_tree = page.evaluate('capexTree?.name')
        print(f"   Current tree: {current_tree}")
        if 'Capabilities Registry' in current_tree:
            print("   PASSED: Viewing capabilities tree")
        else:
            print("   FAILED")

        # Screenshot
        page.screenshot(path='test/screenshots/build616-capabilities-view.png')
        print("   Screenshot saved")

        # Test 10: Back command
        print("\n[TEST 10: BACK FROM CAPABILITIES]")
        back_result = page.evaluate('COMMAND_REGISTRY["back_from_capabilities"]()')
        print(f"   Result: {back_result[:100] if back_result else 'None'}...")

        time.sleep(1)
        current_tree = page.evaluate('capexTree?.name')
        print(f"   Current tree: {current_tree}")
        if 'Capabilities Registry' not in current_tree:
            print("   PASSED: Returned to previous tree")
        else:
            print("   FAILED")

        # Test 11: LocalStorage persistence
        print("\n[TEST 11: LOCALSTORAGE PERSISTENCE]")
        stored = page.evaluate('!!localStorage.getItem("treelisty_capabilities_tree")')
        print(f"   Stored in localStorage: {stored}")
        if stored:
            print("   PASSED")
        else:
            print("   FAILED")

        # Final screenshot
        page.screenshot(path='test/screenshots/build616-final.png')
        print("\n   Final screenshot saved")

        # Summary
        print("\n" + "=" * 60)
        print("BUILD 616 VERIFICATION COMPLETE")
        print("=" * 60)

        all_passed = all([
            version == 616,
            tree_exists,
            load_fn and save_fn and add_fn,
            cap_created,
            work_created,
            has_both,
            tree_name == 'Capabilities Registry',
            count >= 2,
            stored
        ])

        if all_passed:
            print("\n All tests passed!")
            print("Global Capabilities Registry is functional.")
        else:
            print("\n Some tests failed - review above")

        time.sleep(3)
        browser.close()

if __name__ == '__main__':
    test()
