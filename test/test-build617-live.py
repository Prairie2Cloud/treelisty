"""Test Build 617: Expanded Domain Categorization - LIVE SITE"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("TEST BUILD 617: EXPANDED DOMAIN CATEGORIZATION")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Load live Netlify site
        print("\n[LOADING LIVE SITE]")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        # Clear any existing capabilities for clean test
        page.evaluate('localStorage.removeItem("treelisty_capabilities_tree")')
        page.evaluate('capabilitiesTree = null; loadCapabilitiesTree()')
        time.sleep(0.5)

        # Test 1: Version check
        print("\n[TEST 1: VERSION CHECK]")
        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build: {version}")
        if version >= 617:
            print("   PASSED: Build 617+")
        else:
            print(f"   WAITING: Netlify deploying (got {version})")

        # Test 2: Banking domains
        print("\n[TEST 2: BANKING DOMAINS]")
        domains = ['paypal.com', 'venmo.com', 'coinbase.com', 'robinhood.com']
        for domain in domains:
            result = page.evaluate(f'COMMAND_REGISTRY["create_capability"]("Test|{domain}|Test")')
            category = 'Banking' in result if result else False
            print(f"   {domain}: {'Banking' if category else 'FAILED'}")

        # Test 3: Work domains
        print("\n[TEST 3: WORK DOMAINS]")
        domains = ['asana.com', 'notion.so', 'linear.app', 'monday.com', 'trello.com']
        for domain in domains:
            result = page.evaluate(f'COMMAND_REGISTRY["create_capability"]("Test|{domain}|Test")')
            category = 'Work' in result if result else False
            print(f"   {domain}: {'Work' if category else 'FAILED'}")

        # Test 4: Research domains (the key fix!)
        print("\n[TEST 4: RESEARCH DOMAINS]")
        domains = ['wikipedia.org', 'arxiv.org', 'reddit.com', 'github.com', 'stackoverflow.com', 'substack.com']
        for domain in domains:
            result = page.evaluate(f'COMMAND_REGISTRY["create_capability"]("Test|{domain}|Test")')
            category = 'Research' in result if result else False
            status = 'Research' if category else 'FAILED'
            print(f"   {domain}: {status}")

        # Test 5: Verify category counts
        print("\n[TEST 5: CATEGORY COUNTS]")
        page.evaluate('COMMAND_REGISTRY["view_capabilities"]()')
        time.sleep(0.5)

        banking = page.evaluate('capexTree.children.find(c => c.name === "Banking & Finance")?.items?.length || 0')
        work = page.evaluate('capexTree.children.find(c => c.name === "Work & Productivity")?.items?.length || 0')
        research = page.evaluate('capexTree.children.find(c => c.name === "Research & Reading")?.items?.length || 0')

        print(f"   Banking: {banking} capabilities")
        print(f"   Work: {work} capabilities")
        print(f"   Research: {research} capabilities")

        if banking >= 4 and work >= 5 and research >= 6:
            print("   PASSED: All categories populated correctly")
        else:
            print("   FAILED: Some categories missing items")

        # Screenshot
        page.screenshot(path='test/screenshots/build617-live-categories.png')
        print("\n   Screenshot saved")

        # Summary
        print("\n" + "=" * 60)
        print("BUILD 617 TEST COMPLETE")
        print("=" * 60)

        time.sleep(5)
        browser.close()

if __name__ == '__main__':
    test()
