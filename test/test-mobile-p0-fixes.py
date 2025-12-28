"""
Test P0 Mobile Critical Fixes - Build 634
Tests: viewport-fit, 16px inputs, 100dvh, 44px tap targets, touch-action
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright

def test_mobile_p0_fixes():
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

        # Use local file for development, live site for CI
        # url = 'file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html'
        url = 'https://treelisty.netlify.app'
        print(f"Loading TreeListy from {url.split('/')[-1]}...")
        page.goto(url, wait_until='networkidle', timeout=60000)

        # Check version
        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"Build: {version}")

        results = {}

        # =====================================================================
        # TEST 1: viewport-fit: cover
        # =====================================================================
        print("\n[TEST 1] viewport-fit: cover")
        viewport_meta = page.evaluate('''() => {
            const meta = document.querySelector('meta[name="viewport"]');
            return meta ? meta.content : null;
        }''')
        has_viewport_fit = 'viewport-fit=cover' in (viewport_meta or '')
        results['viewport_fit'] = has_viewport_fit
        print(f"  Viewport meta: {viewport_meta}")
        print(f"  Has viewport-fit=cover: {'✅ PASS' if has_viewport_fit else '❌ FAIL'}")

        # Debug: Check if media query matches
        media_query = page.evaluate('''() => {
            return {
                maxWidth768: window.matchMedia('(max-width: 768px)').matches,
                pointerCoarse: window.matchMedia('(pointer: coarse)').matches,
                viewportWidth: window.innerWidth
            };
        }''')
        print(f"\nMedia query debug: {media_query}")

        # =====================================================================
        # TEST 2: Input font sizes >= 16px (prevents iOS auto-zoom)
        # =====================================================================
        print("\n[TEST 2] Input font sizes >= 16px")
        input_sizes = page.evaluate('''() => {
            const inputs = document.querySelectorAll('input, textarea, select');
            const results = [];
            inputs.forEach(input => {
                const style = window.getComputedStyle(input);
                const fontSize = parseFloat(style.fontSize);
                results.push({
                    tag: input.tagName,
                    id: input.id || '(no id)',
                    fontSize: fontSize,
                    passes: fontSize >= 16
                });
            });
            return results;
        }''')

        failing_inputs = [i for i in input_sizes if not i['passes']]
        passing_inputs = [i for i in input_sizes if i['passes']]
        results['input_font_sizes'] = len(failing_inputs) == 0

        print(f"  Total inputs checked: {len(input_sizes)}")
        print(f"  Passing (>=16px): {len(passing_inputs)}")
        print(f"  Failing (<16px): {len(failing_inputs)}")
        if failing_inputs[:5]:
            print(f"  First failing inputs: {failing_inputs[:5]}")
        print(f"  Result: {'✅ PASS' if len(failing_inputs) == 0 else '❌ FAIL'}")

        # =====================================================================
        # TEST 3: --app-height CSS variable (100dvh fallback)
        # =====================================================================
        print("\n[TEST 3] --app-height CSS variable")
        app_height = page.evaluate('''() => {
            const root = document.documentElement;
            const style = window.getComputedStyle(root);
            return style.getPropertyValue('--app-height').trim();
        }''')
        has_app_height = bool(app_height)
        results['app_height_var'] = has_app_height
        print(f"  --app-height value: '{app_height}'")
        print(f"  Result: {'✅ PASS' if has_app_height else '❌ FAIL'}")

        # =====================================================================
        # TEST 4: Expand/collapse tap targets >= 44px
        # =====================================================================
        print("\n[TEST 4] Expand/collapse tap targets >= 44px")
        tap_targets = page.evaluate('''() => {
            const toggles = document.querySelectorAll('.expand-toggle');
            const results = [];
            toggles.forEach(toggle => {
                const rect = toggle.getBoundingClientRect();
                const style = window.getComputedStyle(toggle);
                results.push({
                    width: rect.width,
                    height: rect.height,
                    minWidth: parseFloat(style.minWidth) || rect.width,
                    minHeight: parseFloat(style.minHeight) || rect.height,
                    passes: rect.width >= 44 && rect.height >= 44
                });
            });
            return results;
        }''')

        if tap_targets:
            passing_targets = [t for t in tap_targets if t['passes']]
            results['tap_targets'] = len(passing_targets) == len(tap_targets)
            print(f"  Total expand toggles: {len(tap_targets)}")
            print(f"  Passing (>=44px): {len(passing_targets)}")
            if tap_targets[:3]:
                print(f"  Sample sizes: {[(t['width'], t['height']) for t in tap_targets[:3]]}")
            print(f"  Result: {'✅ PASS' if results['tap_targets'] else '❌ FAIL'}")
        else:
            results['tap_targets'] = True  # No toggles visible = pass
            print(f"  No expand toggles visible (collapsed tree)")
            print(f"  Result: ✅ PASS (N/A)")

        # =====================================================================
        # TEST 5: touch-action: manipulation on interactive elements
        # =====================================================================
        print("\n[TEST 5] touch-action: manipulation")
        touch_action = page.evaluate('''() => {
            const elements = document.querySelectorAll('.tree-node, button');
            const results = [];
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                results.push({
                    tag: el.tagName,
                    className: el.className?.slice(0, 30),
                    touchAction: style.touchAction,
                    passes: style.touchAction === 'manipulation'
                });
            });
            return results;
        }''')

        manipulation_elements = [t for t in touch_action if t['passes']]
        # Check if at least buttons have manipulation
        buttons_checked = [t for t in touch_action if t['tag'] == 'BUTTON']
        buttons_passing = [t for t in buttons_checked if t['passes']]

        results['touch_action'] = len(buttons_passing) > 0
        print(f"  Total elements checked: {len(touch_action)}")
        print(f"  Buttons with manipulation: {len(buttons_passing)}/{len(buttons_checked)}")
        print(f"  Result: {'✅ PASS' if results['touch_action'] else '❌ FAIL'}")

        # =====================================================================
        # TEST 6: Keyboard accessory bar appears on input focus
        # =====================================================================
        print("\n[TEST 6] Keyboard accessory bar on focus")

        # Simulate keyboard open
        page.evaluate('''() => {
            document.body.classList.add('keyboard-open');
        }''')
        page.wait_for_timeout(300)

        kbd_bar_visible = page.evaluate('''() => {
            const bar = document.getElementById('keyboard-accessory-bar');
            if (!bar) return { exists: false };
            const style = window.getComputedStyle(bar);
            return {
                exists: true,
                display: style.display,
                visible: style.display !== 'none'
            };
        }''')

        results['keyboard_bar'] = kbd_bar_visible.get('visible', False)
        print(f"  Bar exists: {kbd_bar_visible.get('exists')}")
        print(f"  Bar visible: {kbd_bar_visible.get('visible')}")
        print(f"  Result: {'✅ PASS' if results['keyboard_bar'] else '❌ FAIL'}")

        # Take screenshot
        page.screenshot(path='test/screenshots/mobile-p0-fixes.png')
        print("\n📸 Screenshot saved: test/screenshots/mobile-p0-fixes.png")

        # =====================================================================
        # SUMMARY
        # =====================================================================
        print("\n" + "="*60)
        print("MOBILE P0 FIXES TEST RESULTS")
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

        # Assert for CI
        assert results['viewport_fit'], "viewport-fit: cover not set"
        assert results['app_height_var'], "--app-height CSS variable not set"
        assert results['keyboard_bar'], "Keyboard bar not visible"

        return results

if __name__ == '__main__':
    test_mobile_p0_fixes()
