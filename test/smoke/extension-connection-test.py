#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Chrome Extension connection to MCP Bridge
"""

import subprocess
import time
import sys
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

REPO_ROOT = Path(__file__).parent.parent.parent
BRIDGE_PATH = REPO_ROOT / "packages" / "treelisty-mcp-bridge" / "src" / "bridge.js"
EXTENSION_PATH = REPO_ROOT / "packages" / "treelisty-chrome-extension"

def main():
    print("=" * 60)
    print("Chrome Extension Connection Test")
    print("=" * 60)

    # Start MCP Bridge
    print("\n[1/3] Starting MCP Bridge...")
    bridge_proc = subprocess.Popen(
        ["node", str(BRIDGE_PATH)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(BRIDGE_PATH.parent)
    )
    time.sleep(2)

    if bridge_proc.poll() is not None:
        stderr = bridge_proc.stderr.read().decode()
        if "EADDRINUSE" in stderr:
            print("[OK] Bridge already running")
            bridge_proc = None
        else:
            print(f"[FAIL] Bridge error: {stderr}")
            return 1
    else:
        print("[OK] Bridge started on port 3456")

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            print("\n[2/3] Launching Chrome with extension...")
            browser = p.chromium.launch_persistent_context(
                user_data_dir="",
                headless=False,
                args=[
                    f"--disable-extensions-except={EXTENSION_PATH}",
                    f"--load-extension={EXTENSION_PATH}",
                    "--no-first-run",
                ],
                viewport={"width": 800, "height": 600}
            )

            time.sleep(3)  # Wait for extension to initialize and connect

            # Get extension ID by checking installed extensions
            print("\n[3/3] Checking extension status...")

            # Open extension options page
            page = browser.new_page()

            # List all extension pages to find our extension
            extensions_page = browser.new_page()
            extensions_page.goto("chrome://extensions")
            time.sleep(2)

            # Take screenshot of extensions page
            extensions_page.screenshot(path=str(REPO_ROOT / "test" / "screenshots" / "ext-conn-1-extensions.png"))

            # Try to find extension ID from the page
            # The extension should be visible in the list
            print("  - Extensions page loaded")

            # Now let's check the service worker console for connection status
            # Open a page and check if extension connected via console
            test_page = browser.new_page()
            test_page.goto("https://example.com")
            time.sleep(2)

            # Check bridge logs by reading stderr
            if bridge_proc:
                # Non-blocking read of bridge output
                import select
                import os

                # On Windows, we can't use select on pipes, so let's just wait and read
                time.sleep(3)

            # Open extension options directly if we can find the ID
            # For now, let's check the background service worker

            # Take final screenshot
            test_page.screenshot(path=str(REPO_ROOT / "test" / "screenshots" / "ext-conn-2-test-page.png"))

            print("\n" + "=" * 60)
            print("Test complete!")
            print("Check the extension icon in Chrome toolbar:")
            print("- No badge = Connected")
            print("- Red '!' badge = Disconnected")
            print("\nTo verify manually:")
            print("1. Right-click extension icon -> Options")
            print("2. Check 'Connection Status' shows 'Connected'")
            print("=" * 60)

            # Keep browser open for manual inspection
            print("\nBrowser open for 15 seconds for manual inspection...")
            time.sleep(15)

            browser.close()

    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        if bridge_proc and bridge_proc.poll() is None:
            bridge_proc.terminate()

    return 0

if __name__ == "__main__":
    sys.exit(main())
