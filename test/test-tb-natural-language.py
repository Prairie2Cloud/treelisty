"""
TreeBeard Natural Language Command Test Runner

Tests TB's ability to interpret natural language and execute commands.
Validates results via browser state inspection.

Usage:
    python test/test-tb-natural-language.py

Requirements:
    pip install playwright
    playwright install chromium
"""

from playwright.sync_api import sync_playwright
import json
import time
import os
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

# Configuration
TREELISTY_URL = os.environ.get('TREELISTY_URL', 'https://treelisty.netlify.app')
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), 'screenshots', 'tb-nl-tests')
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# Test tree fixture
TEST_TREE = {
    "id": "tb-test-root",
    "name": "TB Test Project",
    "type": "root",
    "schemaVersion": 2,
    "pattern": "generic",
    "icon": "🧪",
    "expanded": True,
    "hyperedges": [],
    "snapshotRefs": [],
    "children": [
        {
            "id": "phase-planning",
            "name": "Phase 1 - Planning",
            "type": "phase",
            "icon": "📋",
            "expanded": True,
            "items": [
                {"id": "item-requirements", "name": "Requirements", "type": "item"},
                {"id": "item-design", "name": "Design", "type": "item"},
                {"id": "item-budget", "name": "Budget", "type": "item"}
            ]
        },
        {
            "id": "phase-development",
            "name": "Phase 2 - Development",
            "type": "phase",
            "icon": "💻",
            "expanded": True,
            "items": [
                {"id": "item-backend", "name": "Backend", "type": "item"},
                {"id": "item-frontend", "name": "Frontend", "type": "item"},
                {"id": "item-api", "name": "API Integration", "type": "item"}
            ]
        },
        {
            "id": "phase-testing",
            "name": "Phase 3 - Testing",
            "type": "phase",
            "icon": "🧪",
            "expanded": True,
            "items": [
                {"id": "item-unit-tests", "name": "Unit Tests", "type": "item"},
                {"id": "item-integration-tests", "name": "Integration Tests", "type": "item"},
                {"id": "item-e2e-tests", "name": "E2E Tests", "type": "item"}
            ]
        }
    ]
}

@dataclass
class TestResult:
    """Result of a single test case"""
    test_id: str
    test_name: str
    command: str
    passed: bool
    expected: str
    actual: str
    response_time_ms: int
    error: Optional[str] = None

class TBTestRunner:
    """Test runner for TreeBeard natural language commands"""

    def __init__(self, page):
        self.page = page
        self.results: List[TestResult] = []

    def load_test_tree(self):
        """Load the test tree fixture"""
        self.page.evaluate(f"""(tree) => {{
            if (typeof loadTree === 'function') {{
                loadTree(tree);
            }} else {{
                Object.assign(capexTree, tree);
                if (typeof normalizeTreeStructure === 'function') {{
                    normalizeTreeStructure(capexTree);
                }}
                if (typeof render === 'function') {{
                    render();
                }}
            }}
        }}""", TEST_TREE)
        time.sleep(1)
        print("✅ Test tree loaded")

    def send_command(self, command: str, wait_response: bool = True) -> tuple[str, int]:
        """Send command to TreeBeard and return (response, elapsed_ms)"""
        # Open TB panel if needed
        tb_visible = self.page.locator('#chat-assistant-panel, #floating-chat-container').is_visible()
        if not tb_visible:
            btn = self.page.locator('#chat-assistant-btn')
            if btn.is_visible():
                btn.click()
            else:
                self.page.keyboard.press('Control+/')
            time.sleep(0.5)

        # Get initial message count
        initial_count = self.page.evaluate("""() => {
            const msgs = document.querySelectorAll('#chat-assistant-messages .message, #chat-messages .message');
            return msgs.length;
        }""")

        # Send command
        input_field = self.page.locator('#chat-assistant-input').first
        input_field.fill(command)

        start_time = time.time()
        input_field.press('Enter')

        if wait_response:
            # Wait for response
            try:
                self.page.wait_for_function(
                    f"""(initialCount) => {{
                        const msgs = document.querySelectorAll('#chat-assistant-messages .message, #chat-messages .message');
                        return msgs.length > initialCount;
                    }}""",
                    arg=initial_count,
                    timeout=10000
                )
            except:
                pass  # Timeout is OK for some commands
            time.sleep(0.3)

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Get response
        response = self.page.evaluate("""() => {
            const msgs = document.querySelectorAll('#chat-assistant-messages .message, #chat-messages .message');
            const last = msgs[msgs.length - 1];
            return last ? last.textContent : '';
        }""")

        return response, elapsed_ms

    def get_tree_state(self) -> Dict[str, Any]:
        """Get current tree state"""
        return self.page.evaluate("""() => ({
            treeName: capexTree.name,
            viewMode: window.viewMode,
            selectedNodeId: window.selectedNodeId,
            nodeCount: (function countNodes(node) {
                let count = 1;
                (node.children || []).forEach(c => count += countNodes(c));
                (node.items || []).forEach(c => count += countNodes(c));
                (node.subItems || []).forEach(c => count += countNodes(c));
                return count;
            })(capexTree)
        })""")

    def find_node_by_name(self, name: str) -> Optional[Dict]:
        """Find node by name"""
        return self.page.evaluate(f"""(nodeName) => {{
            function search(node) {{
                if (node.name === nodeName) return node;
                for (const child of (node.children || [])) {{
                    const found = search(child);
                    if (found) return found;
                }}
                for (const item of (node.items || [])) {{
                    const found = search(item);
                    if (found) return found;
                }}
                return null;
            }}
            return search(capexTree);
        }}""", name)

    def get_selected_node(self) -> Optional[Dict]:
        """Get currently selected node"""
        return self.page.evaluate("""() => {
            const id = window.selectedNodeId;
            if (!id) return null;
            function find(node) {
                if (node.id === id) return node;
                for (const c of [...(node.children||[]), ...(node.items||[]), ...(node.subItems||[])]) {
                    const f = find(c);
                    if (f) return f;
                }
                return null;
            }
            return find(capexTree);
        }""")

    def run_test(self, test_id: str, test_name: str, command: str,
                 validator: callable, expected_desc: str) -> TestResult:
        """Run a single test case"""
        print(f"\n🧪 {test_id}: {test_name}")
        print(f"   Command: '{command}'")

        try:
            response, elapsed_ms = self.send_command(command)
            passed, actual = validator()

            result = TestResult(
                test_id=test_id,
                test_name=test_name,
                command=command,
                passed=passed,
                expected=expected_desc,
                actual=actual,
                response_time_ms=elapsed_ms
            )

            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"   {status} ({elapsed_ms}ms)")
            if not passed:
                print(f"   Expected: {expected_desc}")
                print(f"   Actual: {actual}")

        except Exception as e:
            result = TestResult(
                test_id=test_id,
                test_name=test_name,
                command=command,
                passed=False,
                expected=expected_desc,
                actual="",
                response_time_ms=0,
                error=str(e)
            )
            print(f"   ❌ ERROR: {e}")

        self.results.append(result)
        return result

    # =========================================================================
    # Test Cases
    # =========================================================================

    def test_navigation_focus_node(self):
        """Test focusing a node by name"""
        def validator():
            node = self.get_selected_node()
            actual = node.get('name', 'None') if node else 'None'
            return actual == 'Design', actual

        return self.run_test(
            "NAV-01",
            "Focus node by name",
            "go to Design",
            validator,
            "Selected node = 'Design'"
        )

    def test_navigation_focus_root(self):
        """Test focusing root node"""
        # First focus something else
        self.send_command("focus_node:Backend")
        time.sleep(0.5)

        def validator():
            node = self.get_selected_node()
            is_root = node and node.get('id') == 'tb-test-root'
            return is_root, f"Selected: {node.get('name') if node else 'None'}"

        return self.run_test(
            "NAV-02",
            "Navigate to root",
            "go to root",
            validator,
            "Selected node = root"
        )

    def test_view_switch_canvas(self):
        """Test switching to canvas view"""
        def validator():
            state = self.get_tree_state()
            return state['viewMode'] == 'canvas', f"viewMode = {state['viewMode']}"

        return self.run_test(
            "VIEW-01",
            "Switch to canvas view",
            "show canvas view",
            validator,
            "viewMode = 'canvas'"
        )

    def test_view_switch_3d(self):
        """Test switching to 3D view"""
        def validator():
            time.sleep(1)  # 3D takes longer
            state = self.get_tree_state()
            return state['viewMode'] == '3d', f"viewMode = {state['viewMode']}"

        return self.run_test(
            "VIEW-02",
            "Switch to 3D view",
            "open 3D mode",
            validator,
            "viewMode = '3d'"
        )

    def test_view_switch_gantt(self):
        """Test switching to Gantt view"""
        def validator():
            state = self.get_tree_state()
            return state['viewMode'] == 'gantt', f"viewMode = {state['viewMode']}"

        return self.run_test(
            "VIEW-03",
            "Switch to Gantt view",
            "display gantt chart",
            validator,
            "viewMode = 'gantt'"
        )

    def test_edit_add_child(self):
        """Test adding a child node"""
        self.send_command("focus_node:Phase 3 - Testing")
        time.sleep(0.5)

        before_count = self.get_tree_state()['nodeCount']

        def validator():
            after_count = self.get_tree_state()['nodeCount']
            new_node = self.find_node_by_name("Security Review")
            exists = new_node is not None
            return exists, f"Node exists: {exists}, Count: {before_count} -> {after_count}"

        return self.run_test(
            "EDIT-01",
            "Add child node",
            "add a new task called Security Review",
            validator,
            "Node 'Security Review' created"
        )

    def test_edit_rename(self):
        """Test renaming a node"""
        self.send_command("focus_node:Budget")
        time.sleep(0.5)

        def validator():
            time.sleep(0.5)
            node = self.find_node_by_name("Financial Plan")
            return node is not None, f"Node found: {node is not None}"

        return self.run_test(
            "EDIT-02",
            "Rename node",
            "rename this to Financial Plan",
            validator,
            "Node renamed to 'Financial Plan'"
        )

    def test_expand_all(self):
        """Test expand all command"""
        # First collapse
        self.send_command("collapse all")
        time.sleep(0.5)

        def validator():
            all_expanded = self.page.evaluate("""() => {
                for (const phase of capexTree.children || []) {
                    if (phase.expanded === false) return false;
                }
                return true;
            }""")
            return all_expanded, f"All expanded: {all_expanded}"

        return self.run_test(
            "ORG-01",
            "Expand all nodes",
            "expand all",
            validator,
            "All phases expanded"
        )

    def test_fast_path_canvas(self):
        """Test fast-path canvas command"""
        self.page.evaluate("window.viewMode = 'tree'")
        time.sleep(0.3)

        def validator():
            state = self.get_tree_state()
            return state['viewMode'] == 'canvas', f"viewMode = {state['viewMode']}"

        result = self.run_test(
            "FAST-01",
            "Fast-path canvas switch",
            "canvas",
            validator,
            "viewMode = 'canvas' (fast)"
        )

        # Check timing
        if result.response_time_ms > 2000:
            print(f"   ⚠️  Slow response: {result.response_time_ms}ms (expected < 2000ms)")

        return result

    def test_parameterized_focus(self):
        """Test parameterized focus command"""
        def validator():
            node = self.get_selected_node()
            return node and node.get('name') == 'Backend', f"Selected: {node.get('name') if node else 'None'}"

        return self.run_test(
            "PARAM-01",
            "Parameterized focus",
            "focus_node:Backend",
            validator,
            "Selected node = 'Backend'"
        )

    def run_all_tests(self):
        """Run all test cases"""
        print("\n" + "="*60)
        print("TREEBEARD NATURAL LANGUAGE COMMAND TESTS")
        print("="*60)

        # Load test tree
        self.load_test_tree()

        # Run tests
        tests = [
            self.test_navigation_focus_node,
            self.test_navigation_focus_root,
            self.test_view_switch_canvas,
            self.test_view_switch_3d,
            self.test_view_switch_gantt,
            self.test_edit_add_child,
            self.test_edit_rename,
            self.test_expand_all,
            self.test_fast_path_canvas,
            self.test_parameterized_focus,
        ]

        for test_fn in tests:
            try:
                # Reload test tree for isolation
                self.load_test_tree()
                test_fn()
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")

        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)

        passed = sum(1 for r in self.results if r.passed)
        failed = sum(1 for r in self.results if not r.passed)
        total = len(self.results)

        print(f"\nTotal: {total} | Passed: {passed} | Failed: {failed}")
        print(f"Pass Rate: {passed/total*100:.1f}%")

        avg_time = sum(r.response_time_ms for r in self.results) / max(total, 1)
        print(f"Average Response Time: {avg_time:.0f}ms")

        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for r in self.results:
                if not r.passed:
                    print(f"   - {r.test_id}: {r.test_name}")
                    if r.error:
                        print(f"     Error: {r.error}")

        print("\n" + "="*60)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        print(f"Loading TreeListy from {TREELISTY_URL}...")
        page.goto(TREELISTY_URL)
        page.wait_for_selector('#tree-container', timeout=15000)
        time.sleep(2)

        # Dismiss any modals
        page.keyboard.press('Escape')
        time.sleep(0.5)

        # Run tests
        runner = TBTestRunner(page)
        runner.run_all_tests()

        # Take final screenshot
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'final-state.png'))
        print(f"\n📸 Screenshot saved to {SCREENSHOT_DIR}/final-state.png")

        # Keep browser open for inspection
        input("\nPress Enter to close browser...")
        browser.close()


if __name__ == '__main__':
    main()
