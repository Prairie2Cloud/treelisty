"""
Self-Tree Bootstrap Automation Script
Loads self-tree into TreeListy and runs TreeBeard semantic audit

Usage: python scripts/bootstrap-self-tree.py
"""
import sys
import os
import json
import time
from datetime import datetime
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

TREELISTY_URL = "https://treelisty.netlify.app"
SELF_TREE_PATH = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\self-trees\treelisty-self-tree-v17-build700.json"
SCREENSHOT_DIR = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\test\screenshots"
OUTPUT_DIR = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\self-trees"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# Bootstrap workflow - commands and analysis prompts
BOOTSTRAP_STEPS = [
    {
        "name": "expand_tree",
        "type": "command",
        "prompt": "expand_all"
    },
    {
        "name": "analyze_structure",
        "type": "analysis",
        "prompt": "Look at this self-tree for TreeListy. Give me 5 specific improvements to make it more useful for AI-assisted development. Focus on: what's missing, what's redundant, and what needs more detail. Be concrete - suggest actual node names or content changes."
    },
    {
        "name": "focus_now_section",
        "type": "command",
        "prompt": "focus_node:Now (This Week)"
    },
    {
        "name": "analyze_priorities",
        "type": "analysis",
        "prompt": "Looking at the Now items, are these the right priorities? What should be added or removed? Give specific suggestions."
    },
    {
        "name": "focus_architecture",
        "type": "command",
        "prompt": "focus_node:Architecture Quick Reference"
    },
    {
        "name": "analyze_architecture",
        "type": "analysis",
        "prompt": "This architecture section is meant to help AI developers understand TreeListy quickly. What key information is missing? What would you need to know to start contributing to this codebase?"
    },
    {
        "name": "build_improvements",
        "type": "command",
        "prompt": "add_child:Improvement Suggestions"
    },
    {
        "name": "summarize",
        "type": "analysis",
        "prompt": "Summarize the top 3 most impactful changes to make to this self-tree. I'll implement them next."
    }
]


def run_bootstrap():
    """Run the full self-tree bootstrap process"""

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results = {
        "timestamp": timestamp,
        "build": None,
        "tree_loaded": False,
        "audits": [],
        "errors": []
    }

    # Load the self-tree
    with open(SELF_TREE_PATH, 'r', encoding='utf-8') as f:
        self_tree = json.load(f)

    print("=" * 70)
    print("SELF-TREE BOOTSTRAP AUTOMATION")
    print("=" * 70)
    print(f"Timestamp: {timestamp}")
    print(f"Self-tree: {self_tree.get('name', 'Unknown')}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        # ============================================================
        # STEP 1: Load TreeListy
        # ============================================================
        print("STEP 1: Loading TreeListy...")
        page.goto(TREELISTY_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)

        build = page.evaluate("window.TREELISTY_VERSION?.build || 'unknown'")
        results["build"] = build
        print(f"   Build: {build}")

        # ============================================================
        # STEP 2: Import Self-Tree
        # ============================================================
        print("\nSTEP 2: Importing self-tree...")

        tree_json = json.dumps(self_tree)
        import_result = page.evaluate(f"""(() => {{
            try {{
                const tree = {tree_json};
                if (typeof capexTree !== 'undefined') {{
                    Object.assign(capexTree, tree);
                    if (typeof normalizeTreeStructure === 'function') {{
                        normalizeTreeStructure(capexTree);
                    }}
                    if (typeof render === 'function') {{
                        render();
                    }}
                    return {{ success: true }};
                }}
                return {{ success: false, error: 'capexTree not found' }};
            }} catch (e) {{
                return {{ success: false, error: e.message }};
            }}
        }})()""")

        if import_result.get('success'):
            print("   ✅ Self-tree imported successfully")
            results["tree_loaded"] = True
        else:
            print(f"   ❌ Import failed: {import_result.get('error')}")
            results["errors"].append(f"Import failed: {import_result.get('error')}")
            browser.close()
            return results

        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"bootstrap-01-imported-{timestamp}.png"))

        # ============================================================
        # STEP 3: Open TreeBeard
        # ============================================================
        print("\nSTEP 3: Opening TreeBeard...")

        # Try clicking the chat button
        try:
            chat_btn = page.locator('#chat-assistant-btn')
            if chat_btn.is_visible():
                chat_btn.click()
                page.wait_for_timeout(1000)
                print("   ✅ TreeBeard panel opened")
            else:
                # Try keyboard shortcut
                page.keyboard.press('Control+/')
                page.wait_for_timeout(1000)
                print("   ✅ TreeBeard opened via Ctrl+/")
        except Exception as e:
            print(f"   ⚠️ Could not open TreeBeard: {e}")
            results["errors"].append(f"TreeBeard open failed: {e}")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"bootstrap-02-treebeard-{timestamp}.png"))

        # ============================================================
        # STEP 4: Switch to Deep Mode via AI Mode Selector
        # ============================================================
        print("\nSTEP 4: Switching to Deep mode...")

        try:
            # Find the unified AI mode selector
            mode_select = page.locator('#unified-ai-mode-select')
            if mode_select.is_visible():
                # Get current value
                current = mode_select.input_value()
                print(f"   Current mode: {current}")

                # Select deep mode (gemini-deep for best results without API key)
                mode_select.select_option('gemini-deep')
                page.wait_for_timeout(500)

                new_mode = mode_select.input_value()
                print(f"   ✅ Switched to: {new_mode}")
            else:
                print("   ⚠️ Mode selector not visible")
        except Exception as e:
            print(f"   ⚠️ Mode switch: {e}")

        # ============================================================
        # STEP 5: Run Bootstrap Steps
        # ============================================================
        print("\nSTEP 5: Running bootstrap workflow...")

        def send_message(message, wait_for_response=True, timeout=60000):
            """Send a message to TreeBeard and optionally wait for response"""
            try:
                # Find the TreeBeard chat input specifically
                input_field = page.locator('#chat-assistant-input')
                if not input_field.is_visible():
                    # Fallback to floating chat
                    input_field = page.locator('#floating-chat-input')

                input_field.click()
                input_field.fill(message)

                # Find and click send button
                send_btn = page.locator('#chat-send-btn')
                if send_btn.is_visible():
                    send_btn.click()
                else:
                    # Fallback to Enter key
                    page.keyboard.press('Control+Enter')

                if wait_for_response:
                    # Wait for initial response to appear
                    page.wait_for_timeout(3000)

                    # Wait for streaming to complete
                    # Look for the message content to stop changing
                    start = time.time()
                    last_content = ""
                    stable_count = 0

                    while time.time() - start < timeout / 1000:
                        messages = page.locator('.chat-message.assistant').all()
                        if messages:
                            current_content = messages[-1].text_content()
                            if current_content == last_content:
                                stable_count += 1
                                if stable_count >= 3:  # Content stable for 3 checks
                                    break
                            else:
                                stable_count = 0
                                last_content = current_content
                        page.wait_for_timeout(2000)

                    # Get the last assistant message
                    messages = page.locator('.chat-message.assistant').all()
                    if messages:
                        return messages[-1].text_content()

                return None

            except Exception as e:
                return f"Error: {e}"

        # Run each bootstrap step
        for i, step in enumerate(BOOTSTRAP_STEPS):
            print(f"\n   Step {i+1}/{len(BOOTSTRAP_STEPS)}: {step['name']} ({step['type']})")

            if step['type'] == 'command':
                # Commands are quick - just send and move on
                print(f"   Sending command: {step['prompt']}")
                send_message(step['prompt'], wait_for_response=False)
                page.wait_for_timeout(2000)
                results["audits"].append({
                    "name": step['name'],
                    "type": "command",
                    "prompt": step['prompt'],
                    "response": "Command executed",
                    "timestamp": datetime.now().isoformat()
                })
            else:
                # Analysis prompts need to wait for AI response
                print(f"   Sending analysis prompt...")
                response = send_message(step['prompt'], wait_for_response=True, timeout=120000)

                audit_result = {
                    "name": step['name'],
                    "type": "analysis",
                    "prompt": step['prompt'],
                    "response": response[:3000] if response else "No response",
                    "timestamp": datetime.now().isoformat()
                }
                results["audits"].append(audit_result)

                if response:
                    print(f"   ✅ Got response ({len(response)} chars)")
                    # Show preview
                    preview = response[:300].replace('\n', ' ')
                    print(f"   Preview: {preview}...")
                else:
                    print(f"   ⚠️ No response captured")

            # Screenshot after each step
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"bootstrap-step-{i+1}-{step['name']}-{timestamp}.png"))

            # Wait between steps
            page.wait_for_timeout(2000)

        # ============================================================
        # STEP 6: Capture Final State
        # ============================================================
        print("\nSTEP 6: Capturing final state...")

        # Switch to Canvas view for visual capture
        try:
            page.locator("#view-dropdown-btn").click()
            page.wait_for_timeout(200)
            page.locator("#view-canvas-btn").click()
            page.wait_for_timeout(2000)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"bootstrap-final-canvas-{timestamp}.png"))
            print("   ✅ Canvas view captured")
        except Exception as e:
            print(f"   ⚠️ Canvas capture: {e}")

        # Record any page errors
        if page_errors:
            results["errors"].extend(page_errors[:5])
            print(f"\n   ⚠️ Page errors: {len(page_errors)}")

        browser.close()

    # ============================================================
    # STEP 7: Save Results
    # ============================================================
    print("\nSTEP 7: Saving results...")

    output_path = os.path.join(OUTPUT_DIR, f"bootstrap-results-{timestamp}.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"   ✅ Results saved to: {output_path}")

    # ============================================================
    # SUMMARY
    # ============================================================
    print("\n" + "=" * 70)
    print("BOOTSTRAP SUMMARY")
    print("=" * 70)
    print(f"Build: {results['build']}")
    print(f"Tree loaded: {'✅' if results['tree_loaded'] else '❌'}")
    print(f"Audits run: {len(results['audits'])}")
    print(f"Errors: {len(results['errors'])}")

    if results['audits']:
        print("\nAudit Results:")
        for audit in results['audits']:
            response_len = len(audit['response']) if audit['response'] else 0
            print(f"   • {audit['name']}: {response_len} chars")

    print(f"\nScreenshots: {SCREENSHOT_DIR}")
    print(f"Full results: {output_path}")

    return results


if __name__ == "__main__":
    print("\n🚀 Starting Self-Tree Bootstrap...\n")
    results = run_bootstrap()

    success = results['tree_loaded'] and len(results['audits']) > 0
    print(f"\n{'=' * 70}")
    print(f"Overall: {'SUCCESS ✅' if success else 'PARTIAL ⚠️'}")
    print("=" * 70)
