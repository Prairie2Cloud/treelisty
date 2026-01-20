# -*- coding: utf-8 -*-
"""
Test Unified Inbox Build 874 - LOCAL FILE VERSION
Tests the new unified actionable inbox against local treeplexity.html
"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test_unified_inbox_local():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={'width': 1200, 'height': 800})

        # Set up dialog handler - auto-accept
        page.on('dialog', lambda dialog: dialog.accept())

        # Capture console errors
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        print("=" * 60)
        print("UNIFIED INBOX BUILD 874 - LOCAL TEST")
        print("=" * 60)

        print("\n1. Loading local treeplexity.html...")
        page.goto('file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build version: {version}")

        tests_passed = 0
        tests_total = 0
        results = []

        def record_test(name, passed, details=""):
            nonlocal tests_passed, tests_total
            tests_total += 1
            if passed:
                tests_passed += 1
                results.append(f"[PASS] {name}")
                print(f"   [PASS] {name}")
            else:
                results.append(f"[FAIL] {name}" + (f" - {details}" if details else ""))
                print(f"   [FAIL] {name}" + (f" - {details}" if details else ""))

        # Test 1: Build version
        record_test("Build 874 loaded", version == 874, f"got {version}")

        # Test 2: Check new unified inbox functions exist
        print("\n2. Checking new functions exist...")

        has_show_unified = page.evaluate("typeof window.showUnifiedInbox === 'function'")
        record_test("showUnifiedInbox() exists", has_show_unified)

        has_get_items = page.evaluate("typeof window.getUnifiedInboxItems === 'function'")
        record_test("getUnifiedInboxItems() exists", has_get_items)

        has_inbox_state = page.evaluate("typeof window.unifiedInboxState === 'object'")
        record_test("unifiedInboxState exists", has_inbox_state)

        # Test 3: Check InboxItem converters exist
        print("\n3. Checking InboxItem converters...")

        has_gmail_converter = page.evaluate("typeof window.gmailNodeToInboxItem === 'function'")
        record_test("gmailNodeToInboxItem() exists", has_gmail_converter)

        has_calendar_converter = page.evaluate("typeof window.calendarNodeToInboxItem === 'function'")
        record_test("calendarNodeToInboxItem() exists", has_calendar_converter)

        has_drive_converter = page.evaluate("typeof window.driveNodeToInboxItem === 'function'")
        record_test("driveNodeToInboxItem() exists", has_drive_converter)

        # Test 4: Check quick action handlers exist
        print("\n4. Checking quick action handlers...")

        has_inbox_archive = page.evaluate("typeof window.inboxArchive === 'function'")
        record_test("inboxArchive() exists", has_inbox_archive)

        has_inbox_open = page.evaluate("typeof window.inboxOpen === 'function'")
        record_test("inboxOpen() exists", has_inbox_open)

        has_inbox_done = page.evaluate("typeof window.inboxDone === 'function'")
        record_test("inboxDone() exists", has_inbox_done)

        has_inbox_star = page.evaluate("typeof window.inboxStar === 'function'")
        record_test("inboxStar() exists", has_inbox_star)

        has_refresh = page.evaluate("typeof window.refreshInbox === 'function'")
        record_test("refreshInbox() exists", has_refresh)

        # Test 5: showDashboardModal redirects to showUnifiedInbox
        print("\n5. Checking redirect...")
        redirects = page.evaluate("window.showDashboardModal === window.showUnifiedInbox")
        record_test("showDashboardModal redirects to showUnifiedInbox", redirects)

        # Test 6: Open Dashboard modal via button
        print("\n6. Opening Dashboard modal...")
        page.click("#dashboard-btn")
        time.sleep(1)

        modal = page.locator("#dashboard-modal")
        is_visible = modal.is_visible()
        record_test("Dashboard modal opens", is_visible)

        if is_visible:
            page.screenshot(path='test/screenshots/unified-inbox-01-modal.png')
            print("   Screenshot: unified-inbox-01-modal.png")

            # Test 7: Check for new inbox header
            modal_text = modal.inner_text()
            has_inbox_header = "Inbox" in modal_text
            record_test("Modal shows 'Inbox' header", has_inbox_header)

            # Test 8: Check for refresh button
            refresh_btn = modal.locator("button[onclick*='refreshInbox']")
            has_refresh_btn = refresh_btn.count() > 0
            record_test("Refresh button present", has_refresh_btn)

            # Test 9: Check for filter tabs
            has_all_tab = "All" in modal_text
            record_test("'All' filter tab present", has_all_tab)

            # Test 10: Check for empty state (since no imports)
            has_empty_state = "No sources connected" in modal_text or "Import" in modal_text
            record_test("Shows empty state or import buttons", has_empty_state)

            # Test 11: Check old 3-column structure removed
            # The old layout had #dashboard-gmail-card, #dashboard-drive-card, etc.
            # Now we dynamically render so those IDs won't exist in the rendered HTML
            old_card = modal.locator("#dashboard-gmail-card")
            has_old_cards = old_card.count() > 0
            record_test("Old 3-column cards removed", not has_old_cards, "found old card structure" if has_old_cards else "")

            # Test 12: Import buttons present in empty state
            has_import_gmail = "Import Gmail" in modal_text
            has_import_drive = "Import Drive" in modal_text
            has_import_cal = "Import Calendar" in modal_text
            record_test("Import buttons present", has_import_gmail or has_import_drive or has_import_cal)

            # Close modal
            close_btn = modal.locator(".modal-close")
            if close_btn.count() > 0:
                close_btn.click()
                time.sleep(0.5)

        # Test 13: Test gmailNodeToInboxItem converter
        print("\n7. Testing converters with mock data...")

        gmail_result = page.evaluate("""
            (() => {
                const mockEmail = {
                    id: 'test-123',
                    threadId: 'thread-456',
                    subjectLine: 'Test Subject',
                    senderName: 'Test Sender',
                    senderEmail: 'test@example.com',
                    receivedAt: new Date().toISOString(),
                    unread: true,
                    labels: ['INBOX', 'UNREAD']
                };
                const item = window.gmailNodeToInboxItem(mockEmail);
                return {
                    hasId: item?.id?.startsWith('inbox-gmail-'),
                    hasSource: item?.source === 'gmail',
                    hasTitle: item?.title === 'Test Subject',
                    hasSubtitle: item?.subtitle === 'Test Sender',
                    hasPriority: !!item?.priority,
                    hasActions: Array.isArray(item?.actions) && item.actions.includes('archive'),
                    isUnread: item?.isUnread === true
                };
            })()
        """)
        gmail_converter_works = all(gmail_result.values()) if gmail_result else False
        record_test("gmailNodeToInboxItem works correctly", gmail_converter_works,
                   f"failures: {[k for k,v in gmail_result.items() if not v]}" if gmail_result and not gmail_converter_works else "")

        # Test 14: Test calendarNodeToInboxItem
        cal_result = page.evaluate("""
            (() => {
                const now = new Date();
                const mockEvent = {
                    id: 'event-123',
                    eventId: 'gcal-456',
                    summary: 'Team Standup',
                    startTime: now.toISOString(),
                    type: 'event'
                };
                const item = window.calendarNodeToInboxItem(mockEvent);
                return {
                    hasId: item?.id?.startsWith('inbox-cal-'),
                    hasSource: item?.source === 'calendar',
                    hasTitle: item?.title === 'Team Standup',
                    hasTodayPriority: item?.priority === 'today',
                    hasActions: Array.isArray(item?.actions) && item.actions.includes('done')
                };
            })()
        """)
        cal_converter_works = all(cal_result.values()) if cal_result else False
        record_test("calendarNodeToInboxItem works correctly", cal_converter_works,
                   f"failures: {[k for k,v in cal_result.items() if not v]}" if cal_result and not cal_converter_works else "")

        # Test 15: Test driveNodeToInboxItem
        drive_result = page.evaluate("""
            (() => {
                const mockFile = {
                    id: 'file-123',
                    name: 'Budget.xlsx',
                    modifiedTime: new Date().toISOString(),
                    mimeType: 'application/vnd.google-apps.spreadsheet',
                    fileUrl: 'https://drive.google.com/file/d/abc123'
                };
                const item = window.driveNodeToInboxItem(mockFile);
                return {
                    hasId: item?.id?.startsWith('inbox-drive-'),
                    hasSource: item?.source === 'drive',
                    hasTitle: item?.title === 'Budget.xlsx',
                    hasIcon: item?.icon === '[emoji]' || item?.icon?.length > 0,  // spreadsheet icon
                    hasActions: Array.isArray(item?.actions) && item.actions.includes('open')
                };
            })()
        """)
        drive_converter_works = all(drive_result.values()) if drive_result else False
        record_test("driveNodeToInboxItem works correctly", drive_converter_works,
                   f"failures: {[k for k,v in drive_result.items() if not v]}" if drive_result and not drive_converter_works else "")

        # Test 16: Test priority sorting
        print("\n8. Testing priority sorting...")
        sort_result = page.evaluate("""
            (() => {
                // Create items with different priorities
                const items = [
                    { id: '1', priority: 'normal', timestamp: new Date('2024-01-01') },
                    { id: '2', priority: 'vip', timestamp: new Date('2024-01-02') },
                    { id: '3', priority: 'today', timestamp: new Date('2024-01-03') },
                    { id: '4', priority: 'action', timestamp: new Date('2024-01-04') },
                    { id: '5', priority: 'recent', timestamp: new Date('2024-01-05') }
                ];

                // Get unified items calls sortInboxItems internally
                // We can test by checking INBOX_PRIORITY_ORDER
                const order = window.INBOX_PRIORITY_ORDER;
                return {
                    hasOrder: Array.isArray(order),
                    vipFirst: order?.[0] === 'vip',
                    todaySecond: order?.[1] === 'today',
                    orderCorrect: order?.join(',') === 'vip,today,action,p2c,recent,normal'
                };
            })()
        """)
        priority_order_correct = all(sort_result.values()) if sort_result else False
        record_test("Priority order is correct", priority_order_correct, str(sort_result))

        # Test 17: Check state management
        print("\n9. Testing state management...")
        state_result = page.evaluate("""
            (() => {
                const state = window.unifiedInboxState;
                return {
                    hasLastFetch: typeof state?.lastFetch === 'object',
                    hasActiveFilter: state?.activeFilter === 'all',
                    hasCachedItems: Array.isArray(state?.cachedItems),
                    hasExpandedSections: typeof state?.expandedSections === 'object'
                };
            })()
        """)
        state_correct = all(state_result.values()) if state_result else False
        record_test("State management initialized", state_correct, str(state_result))

        # Check console errors
        js_errors = [e for e in console_errors if 'TypeError' in e or 'ReferenceError' in e]
        record_test("No JS errors in console", len(js_errors) == 0, f"{len(js_errors)} errors found")
        if js_errors:
            for err in js_errors[:3]:
                print(f"      Error: {err[:80]}")

        # Final screenshot
        page.screenshot(path='test/screenshots/unified-inbox-02-final.png')
        print("\n   Final screenshot: unified-inbox-02-final.png")

        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)

        for result in results:
            print(result)

        print(f"\nResult: {tests_passed}/{tests_total} tests passed")

        if tests_passed == tests_total:
            print("\n*** ALL TESTS PASSED ***")
        elif tests_passed >= tests_total * 0.8:
            print(f"\n*** MOSTLY PASSING ({tests_passed}/{tests_total}) ***")
        else:
            print(f"\n*** NEEDS ATTENTION ({tests_passed}/{tests_total}) ***")

        browser.close()
        print("\nTest complete!")

        return tests_passed == tests_total

if __name__ == "__main__":
    success = test_unified_inbox_local()
    sys.exit(0 if success else 1)
