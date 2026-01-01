"""Test Inbox Sort Bug - Repro and fix
Bug: After Gmail refresh, new emails don't appear first
Expected: Newest emails at top
Actual: Dec 23 showing as newest (8 days old)
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

def test_inbox_sort():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        print("=" * 60)
        print("INBOX SORT BUG REPRODUCTION")
        print("=" * 60)

        # Load Gmail JSON and check dates
        print("\n1. Analyzing Gmail JSON dates...")
        with open(GMAIL_JSON, 'r', encoding='utf-8') as f:
            gmail_data = json.load(f)

        emails = []
        def collect(node):
            if node.get('sendDateTime') or node.get('threadId'):
                date = node.get('sendDateTime') or node.get('dateTime') or ''
                if date:
                    emails.append({
                        'date': date,
                        'subject': (node.get('subjectLine') or node.get('name') or '')[:40],
                        'unread': 'UNREAD' in (node.get('labels') or [])
                    })
            for child in node.get('children', []) + node.get('items', []) + node.get('subItems', []):
                collect(child)
        collect(gmail_data)

        emails.sort(key=lambda x: x['date'], reverse=True)
        print(f"   Total emails in JSON: {len(emails)}")
        print(f"   Newest email date: {emails[0]['date'][:16] if emails else 'N/A'}")
        print(f"   Oldest email date: {emails[-1]['date'][:16] if emails else 'N/A'}")

        # Load TreeListy
        print("\n2. Loading TreeListy...")
        file_url = f"file:///{TREELISTY_PATH.replace(os.sep, '/')}"
        page.goto(file_url)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        build = page.evaluate("window.TREELISTY_VERSION?.build || 'unknown'")
        print(f"   Build: {build}")

        # Import Gmail JSON
        print("\n3. Importing Gmail data...")
        gmail_json_str = json.dumps(gmail_data)
        page.evaluate(f"""(async () => {{
            const data = {gmail_json_str};
            if (typeof loadTreeData === 'function') {{
                loadTreeData(data);
            }}
        }})()""")
        page.wait_for_timeout(1000)

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "sort-bug-01-loaded.png"))

        # Check inbox panel dates
        print("\n4. Checking inbox panel email order...")
        inbox_emails = page.evaluate("""(() => {
            const list = document.getElementById('inbox-email-list');
            if (!list) return [];

            const emails = [];
            list.querySelectorAll(':scope > div').forEach((card, i) => {
                // Extract date from the card
                const dateSpan = card.querySelector('span[style*="font-size: 10px"]');
                const subjectDiv = card.querySelectorAll('div')[1]?.querySelector('div:nth-child(2)');
                emails.push({
                    index: i,
                    date: dateSpan ? dateSpan.textContent : 'N/A',
                    subject: subjectDiv ? subjectDiv.textContent.substring(0, 40) : 'N/A'
                });
            });
            return emails;
        })()""")

        print(f"   Emails in inbox panel: {len(inbox_emails)}")
        for e in inbox_emails[:5]:
            print(f"     {e['index']+1}. [{e['date']}] {e['subject']}")

        # Check the raw data being used by inbox panel
        print("\n5. Checking raw unread email data and sorting...")
        raw_data = page.evaluate("""(() => {
            // Re-collect unread emails like populateInboxPanel does
            const unreadEmails = [];

            function collectUnread(node) {
                if (!node) return;

                const isEmail = node.threadId || node.emailBody || node.senderEmail;
                const isUnread = node.labels?.includes('UNREAD') || node.unread;

                if (isEmail && isUnread) {
                    unreadEmails.push({
                        id: node.id,
                        subject: (node.subjectLine || node.name || '').substring(0, 40),
                        date: node.sendDateTime || node.dateTime || node.timestamp || node.sendDate || '',
                        rawSendDateTime: node.sendDateTime,
                        rawDateTime: node.dateTime,
                        rawTimestamp: node.timestamp,
                        rawSendDate: node.sendDate
                    });
                }

                if (node.children) node.children.forEach(collectUnread);
                if (node.items) node.items.forEach(collectUnread);
                if (node.subItems) node.subItems.forEach(collectUnread);
            }

            if (window.capexTree) collectUnread(window.capexTree);

            // Sort by date (newest first) - same as populateInboxPanel
            unreadEmails.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });

            return {
                total: unreadEmails.length,
                first5: unreadEmails.slice(0, 5),
                last5: unreadEmails.slice(-5)
            };
        })()""")

        print(f"   Total unread: {raw_data['total']}")
        print("   First 5 (should be newest):")
        for e in raw_data['first5']:
            print(f"     Date: {e['date'][:19] if e['date'] else 'EMPTY'} | Subject: {e['subject']}")
            print(f"       Raw fields: sendDateTime={e['rawSendDateTime']}, dateTime={e['rawDateTime']}")

        # Check tree view order - check actual data model
        print("\n6. Checking tree data model order (after sort)...")
        tree_emails = page.evaluate("""(() => {
            // Get emails directly from capexTree data model
            const emails = [];

            // Check each phase (Inbox, Sent, etc.)
            const phases = capexTree?.children || [];
            phases.forEach(phase => {
                const items = phase.items || phase.children || [];
                items.forEach((item, i) => {
                    if (item.threadId || item.senderEmail) {
                        emails.push({
                            phase: phase.name,
                            index: i,
                            name: (item.subjectLine || item.name || '').substring(0, 40),
                            date: item.sendDateTime || item.dateTime || '',
                            unread: item.labels?.includes('UNREAD')
                        });
                    }
                });
            });
            return emails.slice(0, 15);
        })()""")

        print(f"   Emails in data model (by phase):")
        for e in tree_emails[:15]:
            unread_marker = '[UNREAD]' if e.get('unread') else ''
            print(f"     [{e.get('phase', 'N/A')[:10]}] #{e['index']} {e['date'][:16] if e['date'] else 'NO DATE'} {unread_marker} {e['name']}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "sort-bug-02-analysis.png"))

        browser.close()

        print("\n" + "=" * 60)
        print("ANALYSIS COMPLETE")
        print("=" * 60)

if __name__ == "__main__":
    test_inbox_sort()
