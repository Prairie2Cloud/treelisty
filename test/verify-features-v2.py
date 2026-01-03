"""Verify Documented Features v2 - Build 700
Fixed selectors for dropdown menus and proper window scope checks.
"""
from playwright.sync_api import sync_playwright
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

TREELISTY_URL = "https://treelisty.netlify.app"
SCREENSHOT_DIR = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\test\screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_features():
    results = {"passed": [], "failed": [], "warnings": []}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        print("=" * 70)
        print("FEATURE VERIFICATION v2 - Build 700")
        print("=" * 70)

        # Load site
        print("\n1. Loading TreeListy...")
        page.goto(TREELISTY_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)

        build = page.evaluate("window.TREELISTY_VERSION?.build || 'unknown'")
        print(f"   Build: {build}")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2-01-loaded.png"))

        # ============================================================
        # TEST 1: View Switching via Dropdown
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 1: View Switching (via dropdown menu)")
        print("=" * 70)

        views_to_test = [
            ("canvas", "Canvas"),
            ("3d", "3D"),
            ("gantt", "Gantt"),
            ("mindmap", "Mind Map"),
            ("calendar", "Calendar"),
            ("tree", "Tree")  # Back to tree last
        ]

        for view_id, view_name in views_to_test:
            try:
                # Open view dropdown
                dropdown = page.locator("#view-dropdown-btn")
                dropdown.click()
                page.wait_for_timeout(300)

                # Click specific view button
                view_btn = page.locator(f"#view-{view_id}-btn")
                view_btn.click()
                page.wait_for_timeout(1500)

                # Verify via DOM - check which view container is active/visible
                check = page.evaluate(f"""(() => {{
                    // View containers map (actual IDs from HTML)
                    const containers = {{
                        'tree': '#tree-container',
                        'canvas': '#canvas-container',
                        '3d': '#view-3d',
                        'gantt': '#view-gantt',
                        'mindmap': '#view-mindmap',
                        'calendar': '#view-calendar'
                    }};
                    const container = document.querySelector(containers['{view_id}']);
                    if (!container) return {{ found: false }};
                    // Check display/visibility
                    const style = window.getComputedStyle(container);
                    const isVisible = style.display !== 'none' && !container.classList.contains('hidden');
                    const isActive = container.classList.contains('active');
                    return {{ found: true, isVisible, isActive }};
                }})()""")

                if check.get('isVisible') or check.get('isActive'):
                    print(f"   ✅ {view_name}: PASS")
                    results["passed"].append(f"View: {view_name}")
                else:
                    print(f"   ❌ {view_name}: Container not visible ({check})")
                    results["failed"].append(f"View: {view_name}")

            except Exception as e:
                print(f"   ❌ {view_name}: {str(e)[:60]}")
                results["failed"].append(f"View: {view_name} error")

        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2-02-views.png"))

        # ============================================================
        # TEST 2: Mind Map Features
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 2: Mind Map View Details")
        print("=" * 70)

        try:
            # Switch to mindmap via dropdown
            page.locator("#view-dropdown-btn").click()
            page.wait_for_timeout(200)
            page.locator("#view-mindmap-btn").click()
            page.wait_for_timeout(2000)

            check = page.evaluate("""(() => {
                const container = document.getElementById('view-mindmap');
                const nodes = document.querySelectorAll('.mindmap-node');
                return {
                    active: container?.classList.contains('active'),
                    nodeCount: nodes.length,
                    viewMode: window.viewMode
                };
            })()""")

            print(f"   Active: {check.get('active')}")
            print(f"   Nodes: {check.get('nodeCount')}")
            print(f"   viewMode: {check.get('viewMode')}")

            if check.get('nodeCount', 0) > 0:
                print("   ✅ Mind Map rendering: PASS")
                results["passed"].append("Mind Map rendering")
            else:
                print("   ❌ Mind Map: No nodes rendered")
                results["failed"].append("Mind Map no nodes")

            # Test toolbar buttons
            fit_btn = page.locator("#btn-mindmap-fit")
            if fit_btn.is_visible():
                fit_btn.click()
                page.wait_for_timeout(300)
                print("   ✅ Mind Map fit button: PASS")
                results["passed"].append("Mind Map fit button")

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2-03-mindmap.png"))

        except Exception as e:
            print(f"   ❌ Mind Map test: {str(e)[:60]}")
            results["failed"].append("Mind Map test error")

        # ============================================================
        # TEST 3: Core Window Functions
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 3: Core Window Functions")
        print("=" * 70)

        functions = [
            ("render", "Tree render"),
            ("renderCanvas", "Canvas render"),
            ("renderGantt", "Gantt render"),
            ("saveState", "Undo state"),
            ("showToast", "Toast notification"),
            ("normalizeTreeStructure", "Tree normalization"),
            ("TreeRegistry", "Atlas TreeRegistry"),
            ("SubmissionInbox", "Gallery SubmissionInbox"),
            ("CloneAudit", "Clone audit"),
            ("enterFocusMode", "Focus mode enter"),
            ("exitFocusMode", "Focus mode exit"),
            ("TREELISTY_VERSION", "Version object"),
            ("capexTree", "Tree data"),
        ]

        for func_name, desc in functions:
            exists = page.evaluate(f"typeof window.{func_name} !== 'undefined'")
            status = "✅" if exists else "❌"
            print(f"   {status} {desc}: {exists}")
            if exists:
                results["passed"].append(f"Function: {desc}")
            else:
                results["failed"].append(f"Function: {desc} missing")

        # ============================================================
        # TEST 4: Gallery of Trees (Build 696-700)
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 4: Gallery of Trees (Build 696-700)")
        print("=" * 70)

        gallery = page.evaluate("""(() => {
            return {
                SubmissionInbox: typeof SubmissionInbox !== 'undefined',
                submit: typeof SubmissionInbox?.submit === 'function',
                getMySubmissions: typeof SubmissionInbox?.getMySubmissions === 'function',
                withdraw: typeof SubmissionInbox?.withdraw === 'function',
                CloneAudit: typeof CloneAudit !== 'undefined',
                fullAudit: typeof CloneAudit?.fullAudit === 'function',
                validateTranslationMap: typeof CloneAudit?.validateTranslationMap === 'function',
                submitBtn: !!document.getElementById('gallery-submit-btn')
            };
        })()""")

        for key, val in gallery.items():
            status = "✅" if val else "❌"
            print(f"   {status} {key}: {val}")
            if val:
                results["passed"].append(f"Gallery: {key}")
            else:
                results["failed"].append(f"Gallery: {key}")

        # ============================================================
        # TEST 5: Atlas Cross-Tree
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 5: Atlas Cross-Tree Features")
        print("=" * 70)

        atlas = page.evaluate("""(() => {
            return {
                TreeRegistry: typeof TreeRegistry !== 'undefined',
                register: typeof TreeRegistry?.register === 'function',
                getAll: typeof TreeRegistry?.getAll === 'function',
                search: typeof TreeRegistry?.search === 'function',
                treeCount: TreeRegistry?.getAll?.()?.length || 0
            };
        })()""")

        for key, val in atlas.items():
            if key == 'treeCount':
                print(f"   📊 {key}: {val}")
            else:
                status = "✅" if val else "❌"
                print(f"   {status} {key}: {val}")
                if val:
                    results["passed"].append(f"Atlas: {key}")
                else:
                    results["failed"].append(f"Atlas: {key}")

        # ============================================================
        # TEST 6: Hyperedge Features
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 6: Hyperedge & TTS Features")
        print("=" * 70)

        he = page.evaluate("""(() => {
            return {
                hyperedgesSupported: Array.isArray(capexTree?.hyperedges),
                hyperedgeCount: capexTree?.hyperedges?.length || 0,
                hyperedgeButtonExists: !!document.querySelector('[data-action="hyperedge"]') ||
                                       !!document.getElementById('hyperedge-btn') ||
                                       !!document.querySelector('.hyperedge-indicator')
            };
        })()""")

        print(f"   Hyperedges supported: {he.get('hyperedgesSupported')}")
        print(f"   Hyperedge count: {he.get('hyperedgeCount')}")
        print(f"   Hyperedge UI exists: {he.get('hyperedgeButtonExists')}")

        if he.get('hyperedgesSupported'):
            print("   ✅ Hyperedge data structure: PASS")
            results["passed"].append("Hyperedge data structure")
        else:
            print("   ❌ Hyperedge data structure: Missing")
            results["failed"].append("Hyperedge data structure")

        # ============================================================
        # TEST 7: Gantt View
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 7: Gantt View Features")
        print("=" * 70)

        try:
            page.locator("#view-dropdown-btn").click()
            page.wait_for_timeout(200)
            page.locator("#view-gantt-btn").click()
            page.wait_for_timeout(2000)

            gantt = page.evaluate("""(() => {
                const container = document.getElementById('view-gantt');
                const style = container ? window.getComputedStyle(container) : null;
                const isVisible = container && style && style.display !== 'none';
                return {
                    isVisible: isVisible,
                    renderGantt: typeof renderGantt === 'function',
                    ganttContainer: !!container
                };
            })()""")

            print(f"   Container visible: {gantt.get('isVisible')}")
            print(f"   renderGantt: {gantt.get('renderGantt')}")
            print(f"   Container exists: {gantt.get('ganttContainer')}")

            if gantt.get('isVisible'):
                print("   ✅ Gantt View: PASS")
                results["passed"].append("Gantt View")
            else:
                print("   ❌ Gantt View: Container not visible")
                results["failed"].append("Gantt View")

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2-04-gantt.png"))

        except Exception as e:
            print(f"   ❌ Gantt test: {str(e)[:60]}")
            results["failed"].append("Gantt test error")

        # Back to tree view - use dropdown
        try:
            page.locator("#view-dropdown-btn").click()
            page.wait_for_timeout(200)
            page.locator("#view-tree-btn").click()
            page.wait_for_timeout(500)
        except:
            pass

        # ============================================================
        # TEST 8: Focus Mode (Build 659)
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 8: Focus Mode (Build 659)")
        print("=" * 70)

        try:
            # Check focus mode functions exist
            focus = page.evaluate("""(() => {
                return {
                    enterFocusMode: typeof enterFocusMode === 'function',
                    exitFocusMode: typeof exitFocusMode === 'function',
                    focusedNodeId: window.focusedNodeId || null
                };
            })()""")

            print(f"   enterFocusMode exists: {focus.get('enterFocusMode')}")
            print(f"   exitFocusMode exists: {focus.get('exitFocusMode')}")

            if focus.get('enterFocusMode') and focus.get('exitFocusMode'):
                print("   ✅ Focus Mode functions: PASS")
                results["passed"].append("Focus Mode functions")
            else:
                print("   ❌ Focus Mode: Missing functions")
                results["failed"].append("Focus Mode functions")

        except Exception as e:
            print(f"   ❌ Focus Mode test: {str(e)[:60]}")
            results["failed"].append("Focus Mode test error")

        # ============================================================
        # TEST 9: Calendar View
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST 9: Calendar View")
        print("=" * 70)

        try:
            # Switch to calendar via dropdown
            page.locator("#view-dropdown-btn").click()
            page.wait_for_timeout(200)
            page.locator("#view-calendar-btn").click()
            page.wait_for_timeout(2000)

            cal = page.evaluate("""(() => {
                const container = document.getElementById('view-calendar');
                const style = container ? window.getComputedStyle(container) : null;
                const isVisible = container && style && style.display !== 'none';
                return {
                    containerExists: !!container,
                    isVisible: isVisible,
                    renderCalendar: typeof renderCalendar === 'function'
                };
            })()""")

            print(f"   Container exists: {cal.get('containerExists')}")
            print(f"   Container visible: {cal.get('isVisible')}")
            print(f"   renderCalendar: {cal.get('renderCalendar')}")

            if cal.get('isVisible'):
                print("   ✅ Calendar View: PASS")
                results["passed"].append("Calendar View")
            else:
                print("   ⚠️ Calendar View: Container not visible (may be expected)")
                results["warnings"].append("Calendar View visibility")

            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "v2-05-calendar.png"))

        except Exception as e:
            print(f"   ❌ Calendar test: {str(e)[:60]}")
            results["failed"].append("Calendar test error")

        # ============================================================
        # Check for page errors
        # ============================================================
        if page_errors:
            print(f"\n⚠️ Page errors during test: {len(page_errors)}")
            for err in page_errors[:3]:
                print(f"   {err[:80]}")

        browser.close()

        # ============================================================
        # SUMMARY
        # ============================================================
        print("\n" + "=" * 70)
        print("VERIFICATION SUMMARY")
        print("=" * 70)
        print(f"✅ PASSED: {len(results['passed'])}")
        print(f"❌ FAILED: {len(results['failed'])}")
        print(f"⚠️ WARNINGS: {len(results['warnings'])}")

        if results["failed"]:
            print("\n❌ FAILURES:")
            for f in results["failed"]:
                print(f"   - {f}")

        if results["warnings"]:
            print("\n⚠️ WARNINGS:")
            for w in results["warnings"]:
                print(f"   - {w}")

        return len(results["failed"]) == 0

if __name__ == "__main__":
    success = test_features()
    print(f"\n{'='*70}")
    print(f"Overall: {'PASS ✅' if success else 'NEEDS FIXES ❌'}")
