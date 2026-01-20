# -*- coding: utf-8 -*-
"""
Test Unified Inbox Build 874 - Dashboard UX Redesign
Tests the new unified actionable inbox that replaces 3-column cards
"""
import asyncio
import sys
import io
from playwright.async_api import async_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def safe_print(text):
    try:
        clean = ''.join(c if ord(c) < 0x10000 else '[emoji]' for c in str(text))
        print(clean)
    except:
        print(str(text).encode('ascii', 'replace').decode())

async def test_unified_inbox():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Capture console messages
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        safe_print("[Web] Loading TreeListy live site...")
        await page.goto("https://treelisty.netlify.app", wait_until="networkidle", timeout=60000)
        await asyncio.sleep(2)

        # Check build version
        version = await page.evaluate("window.TREELISTY_VERSION?.build")
        safe_print(f"[Build] Version: {version}")

        tests_passed = 0
        tests_total = 0
        results = []

        def record_test(name, passed, details=""):
            nonlocal tests_passed, tests_total
            tests_total += 1
            if passed:
                tests_passed += 1
                results.append(f"[PASS] {name}")
            else:
                results.append(f"[FAIL] {name}" + (f" - {details}" if details else ""))

        # Test 1: Build version
        record_test("Build 874 deployed", version == 874, f"got {version}")

        # Test 2: Check new unified inbox functions exist
        has_show_unified = await page.evaluate("typeof window.showUnifiedInbox === 'function'")
        record_test("showUnifiedInbox() exists", has_show_unified)

        has_get_items = await page.evaluate("typeof window.getUnifiedInboxItems === 'function'")
        record_test("getUnifiedInboxItems() exists", has_get_items)

        has_inbox_state = await page.evaluate("typeof window.unifiedInboxState === 'object'")
        record_test("unifiedInboxState exists", has_inbox_state)

        # Test 3: Check InboxItem converters exist
        has_gmail_converter = await page.evaluate("typeof window.gmailNodeToInboxItem === 'function'")
        record_test("gmailNodeToInboxItem() exists", has_gmail_converter)

        has_calendar_converter = await page.evaluate("typeof window.calendarNodeToInboxItem === 'function'")
        record_test("calendarNodeToInboxItem() exists", has_calendar_converter)

        has_drive_converter = await page.evaluate("typeof window.driveNodeToInboxItem === 'function'")
        record_test("driveNodeToInboxItem() exists", has_drive_converter)

        # Test 4: Check quick action handlers exist
        has_inbox_archive = await page.evaluate("typeof window.inboxArchive === 'function'")
        record_test("inboxArchive() exists", has_inbox_archive)

        has_inbox_open = await page.evaluate("typeof window.inboxOpen === 'function'")
        record_test("inboxOpen() exists", has_inbox_open)

        has_inbox_done = await page.evaluate("typeof window.inboxDone === 'function'")
        record_test("inboxDone() exists", has_inbox_done)

        has_inbox_star = await page.evaluate("typeof window.inboxStar === 'function'")
        record_test("inboxStar() exists", has_inbox_star)

        # Test 5: Check refresh function exists
        has_refresh = await page.evaluate("typeof window.refreshInbox === 'function'")
        record_test("refreshInbox() exists", has_refresh)

        # Test 6: Open Dashboard modal via Ctrl+D
        safe_print("\n[Dashboard] Opening modal via Ctrl+D...")
        await page.keyboard.press("Control+d")
        await asyncio.sleep(1)

        modal = page.locator("#dashboard-modal")
        is_visible = await modal.is_visible()

        if not is_visible:
            # Try button click
            await page.click("#dashboard-btn")
            await asyncio.sleep(1)
            is_visible = await modal.is_visible()

        record_test("Dashboard modal opens", is_visible)

        if is_visible:
            # Test 7: Check for new inbox header (should say "Inbox" not "Dashboard")
            modal_text = await modal.inner_text()
            has_inbox_header = "Inbox" in modal_text
            record_test("Modal shows 'Inbox' header", has_inbox_header)

            # Test 8: Check for refresh button in header
            refresh_btn = modal.locator("button[onclick*='refreshInbox']")
            has_refresh_btn = await refresh_btn.count() > 0
            record_test("Refresh button present", has_refresh_btn)

            # Test 9: Check for filter tabs
            filter_all = modal.locator("button:has-text('All')")
            has_all_filter = await filter_all.count() > 0
            record_test("'All' filter tab present", has_all_filter)

            # Test 10: Check for "No sources connected" empty state (since no imports)
            has_no_sources = "No sources connected" in modal_text or "Import your Gmail" in modal_text
            record_test("Shows empty state or import buttons", has_no_sources or "Import Gmail" in modal_text)

            # Test 11: Check that old 3-column cards are NOT present
            gmail_card = modal.locator("#dashboard-gmail-card")
            has_old_cards = await gmail_card.count() > 0
            record_test("Old 3-column cards removed", not has_old_cards)

            # Test 12: Verify modal closes
            close_btn = modal.locator(".modal-close")
            if await close_btn.count() > 0:
                await close_btn.click()
                await asyncio.sleep(0.5)
                is_closed = not await modal.is_visible()
                record_test("Modal closes properly", is_closed)

            # Test 13: Test showDashboardModal redirects to showUnifiedInbox
            redirects = await page.evaluate("window.showDashboardModal === window.showUnifiedInbox")
            record_test("showDashboardModal redirects to showUnifiedInbox", redirects)

        # Test 14: Test InboxItem converter with mock data
        safe_print("\n[Unit Test] Testing gmailNodeToInboxItem...")
        mock_result = await page.evaluate("""
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
                    hasId: !!item?.id,
                    hasSource: item?.source === 'gmail',
                    hasTitle: item?.title === 'Test Subject',
                    hasPriority: !!item?.priority,
                    hasActions: Array.isArray(item?.actions)
                };
            })()
        """)
        converter_works = all(mock_result.values()) if mock_result else False
        record_test("gmailNodeToInboxItem converter works", converter_works, str(mock_result))

        # Test 15: Test calendar converter
        cal_result = await page.evaluate("""
            (() => {
                const mockEvent = {
                    id: 'event-123',
                    eventId: 'gcal-456',
                    summary: 'Team Standup',
                    startTime: new Date().toISOString(),
                    type: 'event'
                };
                const item = window.calendarNodeToInboxItem(mockEvent);
                return {
                    hasId: !!item?.id,
                    hasSource: item?.source === 'calendar',
                    hasTitle: item?.title === 'Team Standup',
                    hasPriority: item?.priority === 'today'
                };
            })()
        """)
        cal_converter_works = all(cal_result.values()) if cal_result else False
        record_test("calendarNodeToInboxItem converter works", cal_converter_works, str(cal_result))

        # Test 16: Test sorting function
        sort_result = await page.evaluate("""
            (() => {
                const items = [
                    { priority: 'normal', timestamp: new Date() },
                    { priority: 'vip', timestamp: new Date() },
                    { priority: 'today', timestamp: new Date() },
                    { priority: 'action', timestamp: new Date() }
                ];
                // sortInboxItems is not exposed, but we can test grouping
                const grouped = window.groupInboxItems ? window.groupInboxItems(items) : null;
                return grouped ? {
                    hasVip: grouped.vip?.length === 1,
                    hasToday: grouped.today?.length === 1,
                    hasAction: grouped.action?.length === 1,
                    hasNormal: grouped.normal?.length === 1
                } : null;
            })()
        """)
        # groupInboxItems may not be exposed - check if it exists
        has_group = await page.evaluate("typeof window.groupInboxItems === 'function'")
        if has_group and sort_result:
            group_works = all(sort_result.values())
            record_test("groupInboxItems works", group_works, str(sort_result))
        else:
            record_test("groupInboxItems function", False, "not exposed on window")

        # Check console errors
        js_errors = [e for e in console_errors if 'TypeError' in e or 'ReferenceError' in e]
        record_test("No JS errors in console", len(js_errors) == 0, f"{len(js_errors)} errors")

        # Summary
        safe_print("\n" + "="*60)
        safe_print("TEST SUMMARY - Build 874 Unified Inbox")
        safe_print("="*60)

        for result in results:
            safe_print(result)

        safe_print(f"\nResult: {tests_passed}/{tests_total} tests passed")

        if tests_passed == tests_total:
            safe_print("\n*** ALL TESTS PASSED ***")
        elif tests_passed >= tests_total * 0.8:
            safe_print(f"\n*** MOSTLY PASSING ({tests_passed}/{tests_total}) ***")
        else:
            safe_print(f"\n*** NEEDS ATTENTION ({tests_passed}/{tests_total}) ***")

        await browser.close()
        safe_print("\nTest complete!")

        return tests_passed == tests_total

if __name__ == "__main__":
    success = asyncio.run(test_unified_inbox())
    sys.exit(0 if success else 1)
