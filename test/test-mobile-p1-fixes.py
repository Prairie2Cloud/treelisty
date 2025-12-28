"""
Test P1 Mobile Fixes - Build 635
Tests: Visible collapse toggles, safe area insets, action bar, breadcrumb bar
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright

def test_mobile_p1_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # iPhone 14 Pro emulation
        context = browser.new_context(
            viewport={'width': 393, 'height': 852},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
        )
        page = context.new_page()

        # Use local file for testing
        url = 'file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html'
        print(f"Loading TreeListy from local file...")
        page.goto(url, wait_until='networkidle', timeout=60000)

        # Check version
        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"Build: {version}")

        results = {}

        # =====================================================================
        # TEST 1: Visible collapse toggles with +/- styling
        # =====================================================================
        print("\n[TEST 1] Visible collapse toggles")
        toggle_styles = page.evaluate('''() => {
            const toggles = document.querySelectorAll('.expand-toggle');
            if (toggles.length === 0) return { found: false };

            const toggle = toggles[0];
            const style = window.getComputedStyle(toggle);
            const beforeStyle = window.getComputedStyle(toggle, '::before');

            return {
                found: true,
                count: toggles.length,
                background: style.background,
                borderRadius: style.borderRadius,
                hasBorder: style.border !== 'none' && style.border !== '',
                fontSize: style.fontSize
            };
        }''')

        has_visible_toggles = toggle_styles.get('found', False) and toggle_styles.get('hasBorder', False)
        results['visible_toggles'] = has_visible_toggles
        print(f"  Toggles found: {toggle_styles.get('count', 0)}")
        print(f"  Has visible styling: {toggle_styles}")
        print(f"  Result: {'✅ PASS' if has_visible_toggles else '❌ FAIL'}")

        # =====================================================================
        # TEST 2: Safe area CSS variables
        # =====================================================================
        print("\n[TEST 2] Safe area insets")
        safe_area = page.evaluate('''() => {
            const header = document.querySelector('.header');
            const container = document.querySelector('.tree-view-container, .main-container, #app-container');

            const headerStyle = header ? window.getComputedStyle(header) : {};
            const containerStyle = container ? window.getComputedStyle(container) : {};

            return {
                headerPaddingTop: headerStyle.paddingTop,
                containerPaddingTop: containerStyle.paddingTop,
                containerPaddingBottom: containerStyle.paddingBottom,
                // Check if env() is used (will show 0px if safe area not active)
                hasSafeAreaCSS: document.documentElement.outerHTML.includes('env(safe-area-inset')
            };
        }''')

        has_safe_area = safe_area.get('hasSafeAreaCSS', False)
        results['safe_area_insets'] = has_safe_area
        print(f"  Safe area CSS present: {has_safe_area}")
        print(f"  Header padding: {safe_area.get('headerPaddingTop')}")
        print(f"  Result: {'✅ PASS' if has_safe_area else '❌ FAIL'}")

        # =====================================================================
        # TEST 3: Mobile action bar exists
        # =====================================================================
        print("\n[TEST 3] Mobile action bar")
        action_bar = page.evaluate('''() => {
            const bar = document.getElementById('mobile-action-bar');
            if (!bar) return { exists: false };

            const buttons = bar.querySelectorAll('button');
            const style = window.getComputedStyle(bar);

            return {
                exists: true,
                buttonCount: buttons.length,
                position: style.position,
                display: style.display,
                hasAddChild: !!document.getElementById('mob-add-child'),
                hasEdit: !!document.getElementById('mob-edit'),
                hasFocus: !!document.getElementById('mob-focus'),
                hasInfo: !!document.getElementById('mob-info'),
                hasMore: !!document.getElementById('mob-more')
            };
        }''')

        has_action_bar = action_bar.get('exists', False) and action_bar.get('buttonCount', 0) >= 5
        results['action_bar'] = has_action_bar
        print(f"  Action bar exists: {action_bar.get('exists')}")
        print(f"  Button count: {action_bar.get('buttonCount')}")
        print(f"  All buttons present: {all([action_bar.get('hasAddChild'), action_bar.get('hasEdit'), action_bar.get('hasFocus'), action_bar.get('hasInfo'), action_bar.get('hasMore')])}")
        print(f"  Result: {'✅ PASS' if has_action_bar else '❌ FAIL'}")

        # =====================================================================
        # TEST 4: Mobile breadcrumb bar exists
        # =====================================================================
        print("\n[TEST 4] Mobile breadcrumb bar")
        breadcrumb = page.evaluate('''() => {
            const bar = document.getElementById('mobile-breadcrumb-bar');
            if (!bar) return { exists: false };

            const style = window.getComputedStyle(bar);

            return {
                exists: true,
                position: style.position,
                overflowX: style.overflowX,
                hasScrollBehavior: style.overflowX === 'auto' || style.overflowX === 'scroll'
            };
        }''')

        has_breadcrumb = breadcrumb.get('exists', False) and breadcrumb.get('hasScrollBehavior', False)
        results['breadcrumb_bar'] = has_breadcrumb
        print(f"  Breadcrumb bar exists: {breadcrumb.get('exists')}")
        print(f"  Has scroll behavior: {breadcrumb.get('hasScrollBehavior')}")
        print(f"  Result: {'✅ PASS' if has_breadcrumb else '❌ FAIL'}")

        # =====================================================================
        # TEST 5: P1 JavaScript initialized
        # =====================================================================
        print("\n[TEST 5] P1 JavaScript initialization")

        # Check console logs for initialization
        js_init = page.evaluate('''() => {
            // Check if the mobile action bar IIFE ran
            const bar = document.getElementById('mobile-action-bar');
            const hasEventListeners = bar?.onclick !== undefined ||
                document.getElementById('mob-add-child')?.onclick !== undefined;

            return {
                actionBarInDOM: !!bar,
                breadcrumbInDOM: !!document.getElementById('mobile-breadcrumb-bar'),
                build635: window.TREELISTY_VERSION?.build >= 635
            };
        }''')

        p1_initialized = js_init.get('actionBarInDOM', False) and js_init.get('build635', False)
        results['p1_initialized'] = p1_initialized
        print(f"  Action bar in DOM: {js_init.get('actionBarInDOM')}")
        print(f"  Breadcrumb in DOM: {js_init.get('breadcrumbInDOM')}")
        print(f"  Build 635+: {js_init.get('build635')}")
        print(f"  Result: {'✅ PASS' if p1_initialized else '❌ FAIL'}")

        # Take screenshot
        page.screenshot(path='test/screenshots/mobile-p1-fixes.png')
        print("\n📸 Screenshot saved: test/screenshots/mobile-p1-fixes.png")

        # =====================================================================
        # SUMMARY
        # =====================================================================
        print("\n" + "="*60)
        print("MOBILE P1 FIXES TEST RESULTS")
        print("="*60)
        print(f"Build: {version}")
        print("-"*60)

        all_pass = all(results.values())
        for test_name, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {test_name}: {status}")

        print("-"*60)
        print(f"OVERALL: {'✅ ALL TESTS PASSED' if all_pass else '❌ SOME TESTS FAILED'}")
        print("="*60)

        browser.close()

        return results

if __name__ == '__main__':
    test_mobile_p1_fixes()
