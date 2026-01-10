"""
Build 825: Hide Checklist View - Comprehensive Test
Tests the new "Hide Checklist View" setting in AI Settings modal.
"""

from playwright.sync_api import sync_playwright
import time

def test_hide_checklist_view():
    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Visible for debugging
        context = browser.new_context()
        page = context.new_page()

        print("=" * 60)
        print("Build 825: Hide Checklist View - Comprehensive Test")
        print("=" * 60)

        # Load local file
        print("\n[1] Loading local treeplexity.html...")
        page.goto('file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html')
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        # Clear any existing setting first
        page.evaluate("localStorage.removeItem('hideChecklistView')")
        page.reload()
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        # TEST 1: Verify Checklist button exists in View dropdown by default
        print("\n[TEST 1] Checklist button visible in View dropdown by default...")
        view_dropdown_btn = page.locator('#view-dropdown-btn')
        view_dropdown_btn.click()
        time.sleep(0.3)

        checklist_btn = page.locator('#view-checklist-btn')
        is_visible = checklist_btn.is_visible()
        display_style = page.evaluate("document.getElementById('view-checklist-btn')?.style.display")

        if is_visible and display_style != 'none':
            results.append(('checklist_visible_default', 'PASS', 'Checklist button visible by default'))
            print("  PASS: Checklist button visible by default")
        else:
            results.append(('checklist_visible_default', 'FAIL', f'Checklist button not visible (display={display_style})'))
            print(f"  FAIL: Checklist button not visible (display={display_style})")

        # Close dropdown
        page.keyboard.press('Escape')
        time.sleep(0.2)

        # TEST 2: Open AI Settings modal and find the checkbox
        print("\n[TEST 2] Open AI Settings modal and find Hide Checklist checkbox...")
        settings_btn = page.locator('button:has-text("⚙️"), #ai-settings-btn, [onclick*="openAISettingsModal"]').first
        settings_btn.click()
        time.sleep(0.5)

        modal = page.locator('#ai-settings-modal')
        modal_visible = modal.is_visible()

        hide_checkbox = page.locator('#hide-checklist-view')
        checkbox_exists = hide_checkbox.count() > 0
        checkbox_visible = hide_checkbox.is_visible() if checkbox_exists else False

        if modal_visible and checkbox_exists and checkbox_visible:
            results.append(('checkbox_exists', 'PASS', 'Hide Checklist checkbox found in modal'))
            print("  PASS: Hide Checklist checkbox found in modal")
        else:
            results.append(('checkbox_exists', 'FAIL', f'modal={modal_visible}, checkbox exists={checkbox_exists}, visible={checkbox_visible}'))
            print(f"  FAIL: modal={modal_visible}, checkbox exists={checkbox_exists}, visible={checkbox_visible}")

        # TEST 3: Checkbox is unchecked by default
        print("\n[TEST 3] Checkbox is unchecked by default...")
        is_checked = hide_checkbox.is_checked()

        if not is_checked:
            results.append(('checkbox_unchecked_default', 'PASS', 'Checkbox unchecked by default'))
            print("  PASS: Checkbox unchecked by default")
        else:
            results.append(('checkbox_unchecked_default', 'FAIL', 'Checkbox was checked by default'))
            print("  FAIL: Checkbox was checked by default")

        # TEST 4: Check the checkbox and save
        print("\n[TEST 4] Check the checkbox and save settings...")
        hide_checkbox.check()
        time.sleep(0.2)

        is_now_checked = hide_checkbox.is_checked()

        # Click Save button in AI Settings modal
        save_btn = page.locator('#ai-settings-modal button[onclick="saveAISettings()"]')
        save_btn.click()
        time.sleep(0.5)

        # Verify localStorage was set
        storage_value = page.evaluate("localStorage.getItem('hideChecklistView')")

        if is_now_checked and storage_value == 'true':
            results.append(('checkbox_save', 'PASS', f'Checkbox checked and saved (localStorage={storage_value})'))
            print(f"  PASS: Checkbox checked and saved (localStorage={storage_value})")
        else:
            results.append(('checkbox_save', 'FAIL', f'checked={is_now_checked}, localStorage={storage_value}'))
            print(f"  FAIL: checked={is_now_checked}, localStorage={storage_value}")

        # TEST 5: Checklist button is now hidden in View dropdown
        print("\n[TEST 5] Checklist button now hidden in View dropdown...")
        view_dropdown_btn.click()
        time.sleep(0.3)

        display_after = page.evaluate("document.getElementById('view-checklist-btn')?.style.display")
        is_hidden = display_after == 'none'

        if is_hidden:
            results.append(('checklist_hidden_after_save', 'PASS', 'Checklist button hidden after save'))
            print("  PASS: Checklist button hidden after save")
        else:
            results.append(('checklist_hidden_after_save', 'FAIL', f'display={display_after}'))
            print(f"  FAIL: Checklist button still visible (display={display_after})")

        page.keyboard.press('Escape')
        time.sleep(0.2)

        # TEST 6: Setting persists after page reload
        print("\n[TEST 6] Setting persists after page reload...")
        page.reload()
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        storage_after_reload = page.evaluate("localStorage.getItem('hideChecklistView')")
        display_after_reload = page.evaluate("document.getElementById('view-checklist-btn')?.style.display")

        if storage_after_reload == 'true' and display_after_reload == 'none':
            results.append(('persist_after_reload', 'PASS', 'Setting persisted and applied after reload'))
            print("  PASS: Setting persisted and applied after reload")
        else:
            results.append(('persist_after_reload', 'FAIL', f'storage={storage_after_reload}, display={display_after_reload}'))
            print(f"  FAIL: storage={storage_after_reload}, display={display_after_reload}")

        # TEST 7: Checkbox shows as checked when reopening modal
        print("\n[TEST 7] Checkbox shows as checked when reopening modal...")
        settings_btn.click()
        time.sleep(0.5)

        is_still_checked = hide_checkbox.is_checked()

        if is_still_checked:
            results.append(('checkbox_persists_in_modal', 'PASS', 'Checkbox still checked in modal'))
            print("  PASS: Checkbox still checked in modal")
        else:
            results.append(('checkbox_persists_in_modal', 'FAIL', 'Checkbox was not checked in modal'))
            print("  FAIL: Checkbox was not checked in modal")

        # TEST 8: Uncheck and save - Checklist should reappear
        print("\n[TEST 8] Uncheck and save - Checklist should reappear...")
        hide_checkbox.uncheck()
        time.sleep(0.2)
        save_btn.click()
        time.sleep(0.5)

        storage_unchecked = page.evaluate("localStorage.getItem('hideChecklistView')")

        view_dropdown_btn.click()
        time.sleep(0.3)

        display_restored = page.evaluate("document.getElementById('view-checklist-btn')?.style.display")
        is_restored = display_restored != 'none' and display_restored != None

        # Also check visibility
        checklist_visible_again = page.locator('#view-checklist-btn').is_visible()

        if storage_unchecked == 'false' and (is_restored or checklist_visible_again):
            results.append(('checklist_restored', 'PASS', 'Checklist button restored after unchecking'))
            print("  PASS: Checklist button restored after unchecking")
        else:
            results.append(('checklist_restored', 'FAIL', f'storage={storage_unchecked}, display={display_restored}, visible={checklist_visible_again}'))
            print(f"  FAIL: storage={storage_unchecked}, display={display_restored}, visible={checklist_visible_again}")

        page.keyboard.press('Escape')

        # TEST 9: Can still switch to Checklist view when not hidden
        print("\n[TEST 9] Can still switch to Checklist view when not hidden...")
        view_dropdown_btn.click()
        time.sleep(0.3)
        checklist_btn.click()
        time.sleep(0.5)

        current_view = page.evaluate("window.viewMode")
        checklist_container = page.locator('#view-checklist')
        is_active = checklist_container.evaluate("el => el.classList.contains('active')") if checklist_container.count() > 0 else False

        if current_view == 'checklist' or is_active:
            results.append(('checklist_view_works', 'PASS', f'Checklist view works (viewMode={current_view})'))
            print(f"  PASS: Checklist view works (viewMode={current_view})")
        else:
            results.append(('checklist_view_works', 'FAIL', f'viewMode={current_view}, active={is_active}'))
            print(f"  FAIL: viewMode={current_view}, active={is_active}")

        browser.close()

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for r in results if r[1] == 'PASS')
    failed = sum(1 for r in results if r[1] == 'FAIL')

    for name, status, msg in results:
        icon = "[PASS]" if status == 'PASS' else "[FAIL]"
        print(f"  {icon} {name}: {msg}")

    print(f"\nTotal: {passed} PASS, {failed} FAIL")
    print("=" * 60)

    return passed, failed

if __name__ == '__main__':
    passed, failed = test_hide_checklist_view()
    exit(0 if failed == 0 else 1)
