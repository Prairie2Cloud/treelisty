"""Test Email UX on Live Site - Build 676
Focus: New emails should appear prominently for workflow/processing
User feedback: New emails don't stand out on refresh
"""
from playwright.sync_api import sync_playwright
import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

TREELISTY_URL = "https://treelisty.netlify.app"
SCREENSHOT_DIR = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\test\screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_email_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        # Capture console logs
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        print("=" * 60)
        print("EMAIL UX LIVE TEST - Build 675")
        print("Focus: New email visibility and workflow prominence")
        print("=" * 60)

        # Load TreeListy
        print("\n1. Loading TreeListy live site...")
        page.goto(TREELISTY_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        build = page.evaluate("window.TREELISTY_VERSION?.build || 'unknown'")
        print(f"   Build: {build}")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "email-ux-01-loaded.png"))

        # Check if Gmail tree exists in storage
        print("\n2. Checking for Gmail data in storage...")
        gmail_trees = page.evaluate("""(() => {
            const trees = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('gmail')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        trees.push({
                            key: key,
                            name: data.name || key,
                            nodeCount: data.children ? data.children.length : 0
                        });
                    } catch(e) {}
                }
            }
            // Also check capexTree
            if (window.capexTree && window.capexTree.name && window.capexTree.name.toLowerCase().includes('gmail')) {
                trees.push({
                    key: 'current',
                    name: window.capexTree.name,
                    nodeCount: window.capexTree.children ? window.capexTree.children.length : 0
                });
            }
            return trees;
        })()""")
        print(f"   Gmail trees found: {len(gmail_trees)}")
        for tree in gmail_trees:
            print(f"     - {tree['name']} ({tree['nodeCount']} nodes)")

        # Check for quick action buttons (Build 672)
        print("\n3. Checking Quick Actions Bar (Build 672)...")
        quick_actions = page.evaluate("""(() => {
            const toolbar = document.getElementById('email-quick-actions');
            if (!toolbar) return { exists: false };

            const buttons = toolbar.querySelectorAll('button');
            return {
                exists: true,
                visible: toolbar.offsetParent !== null,
                buttonCount: buttons.length,
                buttons: Array.from(buttons).map(b => b.textContent.trim())
            };
        })()""")
        print(f"   Quick Actions toolbar: {quick_actions}")

        # Check for unread filter button
        print("\n4. Checking Unread Filter...")
        unread_filter = page.evaluate("""(() => {
            const filterBtn = document.querySelector('[data-filter="unread"]');
            return {
                exists: !!filterBtn,
                visible: filterBtn ? filterBtn.offsetParent !== null : false,
                text: filterBtn ? filterBtn.textContent : null
            };
        })()""")
        print(f"   Unread filter button: {unread_filter}")

        # Check current tree for email nodes
        print("\n5. Analyzing current tree for email nodes...")
        email_analysis = page.evaluate("""(() => {
            if (!window.capexTree || !window.capexTree.children) {
                return { hasTree: false };
            }

            let totalNodes = 0;
            let emailNodes = 0;
            let unreadNodes = 0;
            let unreadEmails = [];

            function analyzeNode(node, depth = 0) {
                totalNodes++;

                // Check if it's an email node
                const isEmail = node.threadId || node.emailBody || node.senderEmail ||
                               (node.labels && Array.isArray(node.labels));

                if (isEmail) {
                    emailNodes++;

                    // Check if unread
                    const isUnread = node.labels && node.labels.includes('UNREAD');
                    if (isUnread) {
                        unreadNodes++;
                        unreadEmails.push({
                            name: (node.name || '').substring(0, 50),
                            sender: node.senderEmail || node.sender || 'unknown',
                            date: node.timestamp || node.dateTime
                        });
                    }
                }

                if (node.children) {
                    node.children.forEach(child => analyzeNode(child, depth + 1));
                }
                if (node.subItems) {
                    node.subItems.forEach(item => analyzeNode(item, depth + 1));
                }
            }

            analyzeNode(window.capexTree);

            return {
                hasTree: true,
                treeName: window.capexTree.name,
                totalNodes,
                emailNodes,
                unreadNodes,
                unreadEmails: unreadEmails.slice(0, 5) // First 5
            };
        })()""")
        print(f"   Tree: {email_analysis.get('treeName', 'N/A')}")
        print(f"   Total nodes: {email_analysis.get('totalNodes', 0)}")
        print(f"   Email nodes: {email_analysis.get('emailNodes', 0)}")
        print(f"   Unread nodes: {email_analysis.get('unreadNodes', 0)}")

        if email_analysis.get('unreadEmails'):
            print("   Unread emails found:")
            for email in email_analysis.get('unreadEmails', []):
                print(f"     - {email['name'][:40]}... from {email['sender']}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "email-ux-02-tree-state.png"))

        # Test: Click Gmail quick action if available
        print("\n6. Testing Gmail quick action button...")
        gmail_btn_clicked = page.evaluate("""(() => {
            const gmailBtn = document.querySelector('#email-quick-actions button[onclick*="gmail"]');
            if (gmailBtn) {
                gmailBtn.click();
                return true;
            }
            return false;
        })()""")

        if gmail_btn_clicked:
            print("   Clicked Gmail button")
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "email-ux-03-after-gmail-btn.png"))
        else:
            print("   Gmail button not found in quick actions")

        # Test: Check if unread emails are visually distinct
        print("\n7. Checking visual distinction for unread emails...")
        visual_check = page.evaluate("""(() => {
            const treeItems = document.querySelectorAll('.tree-item, .node-item, [data-node-id]');
            let unreadWithBadge = 0;
            let unreadWithColor = 0;

            treeItems.forEach(item => {
                const text = item.textContent || '';
                const style = window.getComputedStyle(item);

                // Check for unread indicator
                if (text.includes('📩') || text.includes('🔴') || text.includes('●')) {
                    unreadWithBadge++;
                }

                // Check for bold text (unread styling)
                if (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600) {
                    unreadWithColor++;
                }
            });

            return {
                totalItems: treeItems.length,
                unreadWithBadge,
                unreadWithColor
            };
        })()""")
        print(f"   Tree items: {visual_check.get('totalItems', 0)}")
        print(f"   Items with unread badge: {visual_check.get('unreadWithBadge', 0)}")
        print(f"   Items with bold styling: {visual_check.get('unreadWithColor', 0)}")

        # Test: Check toolbar visibility and position
        print("\n8. Checking email toolbar visibility...")
        toolbar_check = page.evaluate("""(() => {
            const toolbar = document.getElementById('email-quick-actions');
            if (!toolbar) return { exists: false, reason: 'Toolbar element not found' };

            const rect = toolbar.getBoundingClientRect();
            const style = window.getComputedStyle(toolbar);

            return {
                exists: true,
                visible: toolbar.offsetParent !== null,
                display: style.display,
                position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
                inViewport: rect.top >= 0 && rect.top < window.innerHeight
            };
        })()""")
        print(f"   Toolbar check: {toolbar_check}")

        # ISSUE INVESTIGATION: What happens on "refresh" (re-import)
        print("\n9. Investigating refresh/re-import behavior...")
        print("   (User feedback: new emails don't appear prominently on refresh)")

        # Check if there's a refresh/sync button
        refresh_elements = page.evaluate("""(() => {
            const syncBtn = document.querySelector('[onclick*="sync"], [onclick*="refresh"], .sync-btn, .refresh-btn');
            const importBtn = document.querySelector('[onclick*="import"], .import-btn');

            return {
                hasSyncButton: !!syncBtn,
                hasImportButton: !!importBtn,
                syncBtnText: syncBtn ? syncBtn.textContent : null,
                importBtnText: importBtn ? importBtn.textContent : null
            };
        })()""")
        print(f"   Refresh/sync elements: {refresh_elements}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "email-ux-04-final-state.png"))

        # Summary and recommendations
        print("\n" + "=" * 60)
        print("ANALYSIS SUMMARY")
        print("=" * 60)

        issues = []

        if not quick_actions.get('exists'):
            issues.append("Quick Actions Bar (Build 672) not visible - may need Gmail tree loaded")

        if email_analysis.get('unreadNodes', 0) == 0 and email_analysis.get('emailNodes', 0) > 0:
            issues.append("Email nodes exist but no unread markers found")

        if visual_check.get('unreadWithBadge', 0) == 0:
            issues.append("No visible unread badges (📩) in tree view")

        if not toolbar_check.get('inViewport', True):
            issues.append("Toolbar not visible in viewport")

        # KEY ISSUE: Workflow prominence
        issues.append("USER FEEDBACK: New emails not prominent on refresh")
        issues.append("NEED: Inbox-style view with new emails at top, highlighted")
        issues.append("NEED: Auto-scroll or notification when new emails arrive")

        if issues:
            print("\nIssues identified:")
            for i, issue in enumerate(issues, 1):
                print(f"  {i}. {issue}")
        else:
            print("\nNo major issues found")

        print(f"\nScreenshots saved to: {SCREENSHOT_DIR}")

        browser.close()
        return len(issues) == 0

if __name__ == "__main__":
    success = test_email_ux()
    print(f"\nTest completed: {'PASS' if success else 'NEEDS IMPROVEMENT'}")
