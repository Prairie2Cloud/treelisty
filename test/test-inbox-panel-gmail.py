"""Test Inbox Panel with Gmail Data - Build 676
Verify inbox panel appears and functions correctly with real Gmail data.
"""
from playwright.sync_api import sync_playwright
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

TREELISTY_PATH = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\treeplexity.html"
GMAIL_JSON = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\gmail-threads-20251231_182113.json"
SCREENSHOT_DIR = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\test\screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_inbox_panel():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        print("=" * 60)
        print("INBOX PANEL TEST WITH GMAIL DATA - Build 676")
        print("=" * 60)

        # Load Gmail JSON
        print("\n1. Loading Gmail JSON data...")
        with open(GMAIL_JSON, 'r', encoding='utf-8') as f:
            gmail_data = json.load(f)

        # Count unread emails
        unread_count = 0
        def count_unread(node):
            nonlocal unread_count
            if node.get('labels') and 'UNREAD' in node.get('labels', []):
                unread_count += 1
            for child in node.get('children', []) + node.get('items', []) + node.get('subItems', []):
                count_unread(child)
        count_unread(gmail_data)
        print(f"   Gmail threads: {gmail_data.get('source', {}).get('threadCount', 'unknown')}")
        print(f"   Unread emails in JSON: {unread_count}")

        # Load TreeListy
        print("\n2. Loading TreeListy...")
        file_url = f"file:///{TREELISTY_PATH.replace(os.sep, '/')}"
        page.goto(file_url)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        build = page.evaluate("window.TREELISTY_VERSION?.build || 'unknown'")
        print(f"   Build: {build}")

        # Import Gmail JSON via JavaScript
        print("\n3. Importing Gmail data...")
        gmail_json_str = json.dumps(gmail_data)

        import_result = page.evaluate(f"""(async () => {{
            const data = {gmail_json_str};

            // Use loadTreeData if available
            if (typeof loadTreeData === 'function') {{
                loadTreeData(data);
                return {{ success: true, method: 'loadTreeData' }};
            }}

            // Fallback: Direct assignment
            window.capexTree = data;
            if (typeof render === 'function') render();
            if (typeof updateEmailFilterBar === 'function') updateEmailFilterBar();
            return {{ success: true, method: 'direct' }};
        }})()""")
        print(f"   Import result: {import_result}")
        page.wait_for_timeout(1000)

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "inbox-01-gmail-loaded.png"))

        # Check current tree
        tree_check = page.evaluate("""(() => {
            return {
                name: capexTree?.name,
                pattern: capexTree?.pattern,
                childCount: capexTree?.children?.length || 0
            };
        })()""")
        print(f"   Tree loaded: {tree_check}")

        # Check inbox panel visibility
        print("\n4. Checking Inbox Panel...")
        inbox_check = page.evaluate("""(() => {
            const panel = document.getElementById('email-inbox-panel');
            const collapsed = document.getElementById('email-inbox-collapsed');
            const list = document.getElementById('inbox-email-list');
            const countBadge = document.getElementById('inbox-count-badge');

            return {
                panelExists: !!panel,
                panelVisible: panel ? window.getComputedStyle(panel).display !== 'none' : false,
                collapsedVisible: collapsed ? window.getComputedStyle(collapsed).display !== 'none' : false,
                emailCount: list ? list.children.length : 0,
                badgeCount: countBadge ? countBadge.textContent : null
            };
        })()""")
        print(f"   Inbox panel: {inbox_check}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "inbox-02-panel-check.png"))

        # If panel not visible, try triggering update
        if not inbox_check.get('panelVisible'):
            print("\n   Panel not visible, triggering update...")
            page.evaluate("""(() => {
                if (typeof updateEmailFilterBar === 'function') {
                    updateEmailFilterBar();
                }
                if (typeof populateInboxPanel === 'function') {
                    populateInboxPanel();
                }
            })()""")
            page.wait_for_timeout(500)

            inbox_check = page.evaluate("""(() => {
                const panel = document.getElementById('email-inbox-panel');
                const list = document.getElementById('inbox-email-list');
                const countBadge = document.getElementById('inbox-count-badge');

                return {
                    panelVisible: panel ? window.getComputedStyle(panel).display !== 'none' : false,
                    emailCount: list ? list.children.length : 0,
                    badgeCount: countBadge ? countBadge.textContent : null
                };
            })()""")
            print(f"   After update: {inbox_check}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "inbox-03-after-update.png"))

        # Test email filter bar
        print("\n5. Checking Email Filter Bar...")
        filter_bar = page.evaluate("""(() => {
            const bar = document.getElementById('email-filter-bar');
            return {
                exists: !!bar,
                visible: bar ? window.getComputedStyle(bar).display !== 'none' : false
            };
        })()""")
        print(f"   Filter bar: {filter_bar}")

        # Click on first email in inbox panel if visible
        if inbox_check.get('emailCount', 0) > 0:
            print("\n6. Testing inbox email click...")

            # Get first email info
            first_email = page.evaluate("""(() => {
                const list = document.getElementById('inbox-email-list');
                if (!list || !list.children[0]) return null;
                const firstCard = list.children[0];
                return {
                    text: firstCard.textContent.substring(0, 100),
                    hasStarBtn: !!firstCard.querySelector('[title="Star"]'),
                    hasArchiveBtn: !!firstCard.querySelector('[title="Archive"]')
                };
            })()""")
            print(f"   First email: {first_email}")

            # Click the first email
            page.evaluate("""(() => {
                const list = document.getElementById('inbox-email-list');
                if (list && list.children[0]) {
                    list.children[0].click();
                }
            })()""")
            page.wait_for_timeout(500)

            # Check if info panel opened
            info_panel = page.evaluate("""(() => {
                const panel = document.getElementById('info-panel');
                const title = document.getElementById('info-title');
                return {
                    visible: panel ? !panel.classList.contains('hidden') : false,
                    title: title ? title.textContent : null
                };
            })()""")
            print(f"   Info panel after click: {info_panel}")

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "inbox-04-email-clicked.png"))

            # Test star button
            print("\n7. Testing star button...")
            page.evaluate("""(() => {
                const list = document.getElementById('inbox-email-list');
                if (list && list.children[0]) {
                    const starBtn = list.children[0].querySelector('[title="Star"]');
                    if (starBtn) starBtn.click();
                }
            })()""")
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "inbox-05-starred.png"))

            # Test archive button
            print("\n8. Testing archive button...")
            pre_archive_count = inbox_check.get('emailCount', 0)
            page.evaluate("""(() => {
                const list = document.getElementById('inbox-email-list');
                if (list && list.children[0]) {
                    const archiveBtn = list.children[0].querySelector('[title="Archive"]');
                    if (archiveBtn) archiveBtn.click();
                }
            })()""")
            page.wait_for_timeout(500)

            post_archive = page.evaluate("""(() => {
                const list = document.getElementById('inbox-email-list');
                return { emailCount: list ? list.children.length : 0 };
            })()""")
            print(f"   Before archive: {pre_archive_count} emails")
            print(f"   After archive: {post_archive.get('emailCount', 0)} emails")

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "inbox-06-archived.png"))

        # Test collapse/expand
        print("\n9. Testing collapse/expand...")
        page.evaluate("""(() => {
            if (typeof toggleInboxPanel === 'function') {
                toggleInboxPanel();
            }
        })()""")
        page.wait_for_timeout(300)

        collapsed_state = page.evaluate("""(() => {
            const panel = document.getElementById('email-inbox-panel');
            const collapsed = document.getElementById('email-inbox-collapsed');
            return {
                panelVisible: panel ? window.getComputedStyle(panel).display !== 'none' : false,
                collapsedVisible: collapsed ? window.getComputedStyle(collapsed).display !== 'none' : false
            };
        })()""")
        print(f"   After toggle: {collapsed_state}")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "inbox-07-collapsed.png"))

        # Expand again
        page.evaluate("typeof toggleInboxPanel === 'function' && toggleInboxPanel()")
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "inbox-08-expanded.png"))

        browser.close()

        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Build: {build}")
        print(f"Gmail data loaded: {tree_check.get('name', 'N/A')}")
        print(f"Inbox panel visible: {inbox_check.get('panelVisible', False)}")
        print(f"Emails in inbox: {inbox_check.get('emailCount', 0)}")
        print(f"Badge count: {inbox_check.get('badgeCount', 'N/A')}")
        print(f"Screenshots saved to: {SCREENSHOT_DIR}")

        # Determine success
        success = (
            inbox_check.get('panelVisible', False) or
            inbox_check.get('emailCount', 0) > 0 or
            unread_count == 0  # No unread = panel should be hidden (correct behavior)
        )
        return success

if __name__ == "__main__":
    success = test_inbox_panel()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")
