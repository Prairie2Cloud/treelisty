#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Smoke test for Chrome Extension Screen Awareness (Build 564)

Tests the full capture loop:
1. Start MCP Bridge
2. Load Chrome with extension
3. Open TreeListy
4. Test capture_screen command via TreeBeard
"""

import subprocess
import time
import os
import sys
import threading
import http.server
import socketserver
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Get paths
REPO_ROOT = Path(__file__).parent.parent.parent
BRIDGE_PATH = REPO_ROOT / "packages" / "treelisty-mcp-bridge" / "src" / "bridge.js"
EXTENSION_PATH = REPO_ROOT / "packages" / "treelisty-chrome-extension"
TREELISTY_PATH = REPO_ROOT / "treeplexity.html"
HTTP_PORT = 8765  # Local HTTP server port

def main():
    print("=" * 60)
    print("Chrome Extension Screen Awareness - Smoke Test")
    print("=" * 60)

    # Check paths exist
    if not BRIDGE_PATH.exists():
        print(f"[FAIL] Bridge not found: {BRIDGE_PATH}")
        return 1
    if not EXTENSION_PATH.exists():
        print(f"[FAIL] Extension not found: {EXTENSION_PATH}")
        return 1
    if not TREELISTY_PATH.exists():
        print(f"[FAIL] TreeListy not found: {TREELISTY_PATH}")
        return 1

    print(f"[OK] Bridge path: {BRIDGE_PATH}")
    print(f"[OK] Extension path: {EXTENSION_PATH}")
    print(f"[OK] TreeListy path: {TREELISTY_PATH}")

    # Start local HTTP server (needed for WebSocket to work)
    print("\n[0/4] Starting local HTTP server...")

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # Suppress HTTP logs

    os.chdir(str(REPO_ROOT))  # Serve from repo root
    httpd = socketserver.TCPServer(("", HTTP_PORT), QuietHandler)
    httpd.allow_reuse_address = True
    http_thread = threading.Thread(target=httpd.serve_forever)
    http_thread.daemon = True
    http_thread.start()
    print(f"[OK] HTTP server running on port {HTTP_PORT}")

    # Start MCP Bridge
    print("\n[1/4] Starting MCP Bridge...")
    bridge_proc = subprocess.Popen(
        ["node", str(BRIDGE_PATH)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(BRIDGE_PATH.parent)
    )
    time.sleep(2)

    if bridge_proc.poll() is not None:
        stderr = bridge_proc.stderr.read().decode()
        if "EADDRINUSE" in stderr or "address already in use" in stderr.lower():
            print("[OK] Bridge already running on port 3456")
            bridge_proc = None  # Don't try to terminate later
        else:
            print(f"[FAIL] Bridge failed to start: {stderr}")
            return 1
    else:
        print("[OK] Bridge started on port 3456")

    # Run Playwright test
    print("\n[2/4] Running Playwright test...")
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            # Launch Chrome with extension
            print("  - Launching Chrome with extension...")
            browser = p.chromium.launch_persistent_context(
                user_data_dir="",  # Temporary profile
                headless=False,  # Must be visible for extension
                args=[
                    f"--disable-extensions-except={EXTENSION_PATH}",
                    f"--load-extension={EXTENSION_PATH}",
                    "--no-first-run",
                    "--no-default-browser-check"
                ],
                viewport={"width": 1400, "height": 900}
            )

            # Wait for extension to initialize
            time.sleep(2)

            # Open TreeListy via HTTP (needed for WebSocket)
            print("  - Opening TreeListy...")
            page = browser.new_page()

            # Use HTTP URL instead of file:// for WebSocket support
            http_url = f"http://localhost:{HTTP_PORT}/treeplexity.html"
            print(f"  - URL: {http_url}")
            page.goto(http_url)
            page.wait_for_load_state("networkidle")
            print("  [OK] Page loaded, waiting for app initialization...")

            # Wait for splash screen to disappear and main UI to appear
            # The main app has a sidebar with class 'sidebar' or the tree view
            try:
                page.wait_for_selector("#tree-view, .sidebar, #app-container", timeout=15000)
                print("  [OK] App UI ready")
            except:
                print("  [WARN] App UI selector not found, waiting longer...")
                time.sleep(5)

            # Take initial screenshot
            page.screenshot(path=str(REPO_ROOT / "test" / "screenshots" / "extension-test-1-loaded.png"))

            # Additional wait for JS to fully initialize
            time.sleep(3)

            # Check bridge status
            print("\n[3/4] Checking bridge connection...")
            is_connected = page.evaluate("""() => {
                return window.mcpBridgeState?.client?.isConnected || false;
            }""")

            if is_connected:
                print("  [OK] MCP Bridge connected")
            else:
                print("  [INFO] MCP Bridge not auto-connected, trying programmatic connection...")
                # Try programmatic connection first (avoids modal issues)
                page.evaluate("""() => {
                    if (typeof initMCPBridge === 'function') {
                        initMCPBridge(3456, 'treelisty-local');
                    }
                }""")
                time.sleep(3)

                is_connected = page.evaluate("() => window.mcpBridgeState?.client?.isConnected || false")
                print(f"  [INFO] Connection status after init: {is_connected}")

            # Always close any open modals before proceeding
            page.keyboard.press("Escape")
            time.sleep(0.5)
            page.keyboard.press("Escape")  # Double escape to be sure
            time.sleep(0.3)

            # Open TreeBeard chat panel
            print("\n[4/4] Testing TreeBeard commands...")

            # Try clicking the chat toggle button
            chat_toggle = page.locator("#toggle-chat-assistant, [data-action='toggle-chat']")
            if chat_toggle.count() > 0:
                print("  - Clicking chat toggle button...")
                chat_toggle.first.click()
                time.sleep(1)
            else:
                # Try keyboard shortcut
                print("  - Using keyboard shortcut Ctrl+/...")
                page.keyboard.press("Control+/")
                time.sleep(1)

            # Take screenshot after opening chat
            page.screenshot(path=str(REPO_ROOT / "test" / "screenshots" / "extension-test-2-chat-open.png"))

            # Check if chat panel is visible
            chat_panel = page.locator("#chat-assistant-panel, .chat-panel, [class*='chat']")
            if chat_panel.count() > 0 and chat_panel.first.is_visible():
                print("  [OK] Chat panel opened")
            else:
                print("  [WARN] Chat panel may not be visible")

            # Find chat input - try multiple selectors including placeholder text
            chat_input = page.locator("input[placeholder*='Ask anything'], input[placeholder*='command'], #chat-assistant-input, .chat-input").first

            if chat_input.is_visible(timeout=5000):
                print("  [OK] Chat input found")

                # Test extension_status command
                print("  - Sending 'extension_status' command...")
                chat_input.click()
                chat_input.fill("extension_status")
                chat_input.press("Enter")
                time.sleep(3)

                # Take screenshot of response
                page.screenshot(path=str(REPO_ROOT / "test" / "screenshots" / "extension-test-3-status-response.png"))

                # Check for extension status in page
                page_text = page.locator("body").inner_text(timeout=5000)

                if "Extension Connected" in page_text:
                    print("  [OK] Extension is connected!")

                    # Test capture_screen
                    print("  - Sending 'capture_screen' command...")
                    chat_input.fill("capture_screen")
                    chat_input.press("Enter")
                    time.sleep(5)

                    # Take screenshot of result
                    page.screenshot(path=str(REPO_ROOT / "test" / "screenshots" / "extension-test-4-capture-result.png"))

                    page_text = page.locator("body").inner_text(timeout=5000)
                    if "Captured" in page_text or "screenshot" in page_text.lower():
                        print("  [OK] Screenshot captured!")
                    else:
                        print("  [INFO] Capture response:", page_text[-200:] if len(page_text) > 200 else page_text)

                elif "not connected" in page_text.lower() or "Not Connected" in page_text:
                    print("  [INFO] Extension not connected - this is expected for initial test")
                    print("  [INFO] Extension needs to be configured with pairing token")
                else:
                    print("  [INFO] Response received")
                    # Print last part of response
                    lines = [l for l in page_text.split('\n') if l.strip()][-5:]
                    for line in lines:
                        print(f"       {line[:80]}")
            else:
                print("  [WARN] Chat input not found or not visible")
                # List all inputs for debugging
                all_inputs = page.locator("input, textarea")
                print(f"  [DEBUG] Found {all_inputs.count()} input elements")

            # Final screenshot
            page.screenshot(path=str(REPO_ROOT / "test" / "screenshots" / "extension-test-final.png"))

            print("\n" + "=" * 60)
            print("Test complete! Screenshots saved to test/screenshots/")
            print("Browser will close in 5 seconds...")
            print("=" * 60)

            time.sleep(5)
            browser.close()

    except ImportError:
        print("[FAIL] Playwright not installed. Run: pip install playwright && playwright install chromium")
        return 1
    except Exception as e:
        print(f"[FAIL] Test error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        # Clean up bridge if we started it
        if bridge_proc and bridge_proc.poll() is None:
            bridge_proc.terminate()
            print("[OK] Bridge process terminated")
        # Clean up HTTP server
        httpd.shutdown()
        print("[OK] HTTP server stopped")

    print("\n[DONE] Smoke test completed")
    return 0

if __name__ == "__main__":
    sys.exit(main())
