"""
Build 604: Fast-Path Interceptor Test
Verifies that navigation commands are intercepted and executed deterministically
without AI interpretation.
"""
from playwright.sync_api import sync_playwright
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

def test_fast_path_interceptor():
    print("=" * 60)
    print("BUILD 602: FAST-PATH INTERCEPTOR TEST")
    print("=" * 60)

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(msg.text))

        # Load TreeListy
        page.goto('file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        # Check version
        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"\n[BUILD] {version}")
        if version != 604:
            print(f"   WARNING: Expected Build 604, got {version}")

        # Test 1: View switching - "canvas"
        print(f"\n[TEST 1] View switching: 'canvas'")
        console_logs.clear()
        result = page.evaluate('''(() => {
            const result = interceptFastPath("canvas");
            return result;
        })()''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        print(f"   Message: {result.get('message')}")
        results.append(("canvas", result.get('intercepted') == True and result.get('command') == 'switch_to_canvas'))

        # Test 2: View switching - "switch to 3d view"
        print(f"\n[TEST 2] View switching: 'switch to 3d view'")
        result = page.evaluate('''interceptFastPath("switch to 3d view")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        results.append(("switch to 3d view", result.get('intercepted') == True and result.get('command') == 'switch_to_3d'))

        # Test 3: View switching - "gantt"
        print(f"\n[TEST 3] View switching: 'gantt'")
        result = page.evaluate('''interceptFastPath("gantt")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        results.append(("gantt", result.get('intercepted') == True and result.get('command') == 'view_gantt'))

        # Test 4: Phase control - "solo phase: Military"
        print(f"\n[TEST 4] Phase control: 'solo phase: Military'")
        result = page.evaluate('''interceptFastPath("solo phase: Military")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        print(f"   Param: {result.get('param')}")
        results.append(("solo phase: Military", result.get('intercepted') == True and result.get('param') == 'Military'))

        # Test 5: Phase control - "show only: Education"
        print(f"\n[TEST 5] Phase control: 'show only: Education'")
        result = page.evaluate('''interceptFastPath("show only: Education")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        print(f"   Param: {result.get('param')}")
        results.append(("show only: Education", result.get('intercepted') == True and result.get('command') == 'solo_phase'))

        # Test 6: Camera control - "zoom fit"
        print(f"\n[TEST 6] Camera control: 'zoom fit'")
        result = page.evaluate('''interceptFastPath("zoom fit")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        results.append(("zoom fit", result.get('intercepted') == True and result.get('command') == 'zoom_fit'))

        # Test 7: Camera control - "focus on: Napoleon"
        print(f"\n[TEST 7] Camera control: 'focus on: Napoleon'")
        result = page.evaluate('''interceptFastPath("focus on: Napoleon")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        print(f"   Param: {result.get('param')}")
        results.append(("focus on: Napoleon", result.get('intercepted') == True and result.get('param') == 'Napoleon'))

        # Test 8: Hyperedge - "list hyperedges"
        print(f"\n[TEST 8] Hyperedge: 'list hyperedges'")
        result = page.evaluate('''interceptFastPath("list hyperedges")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        results.append(("list hyperedges", result.get('intercepted') == True and result.get('command') == 'list_hyperedges'))

        # Test 9: Navigation - "undo"
        print(f"\n[TEST 9] Navigation: 'undo'")
        result = page.evaluate('''interceptFastPath("undo")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        results.append(("undo", result.get('intercepted') == True and result.get('command') == 'undo'))

        # Test 10: Help - "what can you do"
        print(f"\n[TEST 10] Help: 'what can you do'")
        result = page.evaluate('''interceptFastPath("what can you do")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        print(f"   Reason: {result.get('reason')}")
        # Debug: test the regex directly
        regex_test = page.evaluate('''(() => {
            const msg = "what can you do";
            return {
                matchesWhat: /^(what|why|how)/i.test(msg),
                matchesExact: /^what\\s+can\\s+you\\s+do$/i.test(msg),
                shouldSkip: /^(what|why|how)/i.test(msg) && !/^what\\s+can\\s+you\\s+do$/i.test(msg)
            };
        })()''')
        print(f"   Debug - matchesWhat: {regex_test.get('matchesWhat')}, matchesExact: {regex_test.get('matchesExact')}, shouldSkip: {regex_test.get('shouldSkip')}")
        results.append(("what can you do", result.get('intercepted') == True and result.get('command') == 'show_help'))

        # Test 11: NOT intercepted - complex question
        print(f"\n[TEST 11] NOT intercepted: 'what is the capital of France?'")
        result = page.evaluate('''interceptFastPath("what is the capital of France?")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Reason: {result.get('reason')}")
        results.append(("complex question", result.get('intercepted') == False))

        # Test 12: NOT intercepted - long message
        print(f"\n[TEST 12] NOT intercepted: long message (>150 chars)")
        long_msg = "This is a very long message that should not be intercepted because it exceeds the 150 character limit and is likely a complex request that needs AI interpretation to understand what the user really wants."
        result = page.evaluate(f'''interceptFastPath("{long_msg}")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Reason: {result.get('reason')}")
        results.append(("long message", result.get('intercepted') == False and result.get('reason') == 'message_too_long'))

        # Test 13: Actual execution - switch to canvas and verify
        print(f"\n[TEST 13] Actual execution: switch to canvas view")
        initial_view = page.evaluate('viewMode')
        print(f"   Initial viewMode: {initial_view}")

        page.evaluate('viewMode = "tree"')  # Ensure we start in tree
        result = page.evaluate('''(() => {
            const result = interceptFastPath("canvas");
            return { result, viewMode: viewMode };
        })()''')
        print(f"   After interception viewMode: {result.get('viewMode')}")
        results.append(("canvas execution", result.get('viewMode') == 'canvas'))

        # Test 14: Show all phases
        print(f"\n[TEST 14] Phase control: 'show all phases'")
        result = page.evaluate('''interceptFastPath("show all phases")''')
        print(f"   Intercepted: {result.get('intercepted')}")
        print(f"   Command: {result.get('command')}")
        results.append(("show all phases", result.get('intercepted') == True and result.get('command') == 'show_all_phases'))

        # Screenshot
        os.makedirs('D:/screenshots', exist_ok=True)
        page.screenshot(path='D:/screenshots/fast-path-test.png', full_page=True)
        print(f"\n[SCREENSHOT] fast-path-test.png")

        browser.close()

    # Summary
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    passed = sum(1 for _, r in results if r)
    total = len(results)
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"   [{status}] {name}")

    print(f"\n   Total: {passed}/{total} passed")

    if passed == total:
        print("\n   [SUCCESS] All tests passed!")
        return 0
    else:
        print(f"\n   [FAILURE] {total - passed} tests failed")
        return 1

if __name__ == '__main__':
    exit(test_fast_path_interceptor())
