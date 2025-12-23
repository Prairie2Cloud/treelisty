#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monitor bridge logs while extension connects
"""

import subprocess
import threading
import time
import sys
import queue
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

REPO_ROOT = Path(__file__).parent.parent.parent
BRIDGE_PATH = REPO_ROOT / "packages" / "treelisty-mcp-bridge" / "src" / "bridge.js"
EXTENSION_PATH = REPO_ROOT / "packages" / "treelisty-chrome-extension"

def read_output(pipe, q, prefix):
    """Read from pipe and put lines in queue"""
    for line in iter(pipe.readline, b''):
        q.put(f"{prefix}: {line.decode('utf-8', errors='replace').strip()}")
    pipe.close()

def main():
    print("=" * 60)
    print("Bridge Monitor Test - Watch for Extension Connection")
    print("=" * 60)

    # Start bridge with output monitoring
    print("\n[1/3] Starting MCP Bridge with monitoring...")
    bridge_proc = subprocess.Popen(
        ["node", str(BRIDGE_PATH)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(BRIDGE_PATH.parent)
    )

    # Create queue for output
    output_queue = queue.Queue()

    # Start threads to read stdout/stderr
    stdout_thread = threading.Thread(target=read_output, args=(bridge_proc.stdout, output_queue, "STDOUT"))
    stderr_thread = threading.Thread(target=read_output, args=(bridge_proc.stderr, output_queue, "STDERR"))
    stdout_thread.daemon = True
    stderr_thread.daemon = True
    stdout_thread.start()
    stderr_thread.start()

    # Wait for bridge to start
    time.sleep(2)

    # Print any initial output
    print("\n--- Bridge Output ---")
    while not output_queue.empty():
        print(output_queue.get())

    if bridge_proc.poll() is not None:
        print("[FAIL] Bridge exited")
        return 1

    print("[OK] Bridge running")

    # Launch Chrome with extension
    print("\n[2/3] Launching Chrome with extension...")
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
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

            print("[OK] Chrome launched with extension")

            # Wait and monitor for connection
            print("\n[3/3] Monitoring for extension connection (10 seconds)...")
            print("\n--- Bridge Logs ---")

            for i in range(20):
                time.sleep(0.5)
                while not output_queue.empty():
                    line = output_queue.get()
                    print(line)
                    if "extension" in line.lower() or "handshake" in line.lower():
                        print("  ^^^ EXTENSION ACTIVITY DETECTED ^^^")

            # Final check
            print("\n--- Final Status ---")
            while not output_queue.empty():
                print(output_queue.get())

            # Open a page to trigger extension activity
            print("\nOpening test page to trigger extension...")
            page = browser.new_page()
            page.goto("https://example.com")
            time.sleep(3)

            print("\n--- After Page Load ---")
            while not output_queue.empty():
                print(output_queue.get())

            print("\n" + "=" * 60)
            print("Closing browser...")
            browser.close()

    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        bridge_proc.terminate()
        print("[OK] Bridge terminated")

    return 0

if __name__ == "__main__":
    sys.exit(main())
