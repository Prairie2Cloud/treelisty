"""
Self-Tree Import Test for TreeListy Build 700
Tests importing and verifying the self-tree structure.
"""
from playwright.sync_api import sync_playwright
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

TREELISTY_URL = "https://treelisty.netlify.app"
SCREENSHOT_DIR = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\test\screenshots"
SELF_TREE_PATH = r"D:\OneDrive\Desktop\Production-Versions\treeplexity\self-trees\treelisty-self-tree-v16-build700.json"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_self_tree_import():
    """Test importing and verifying the self-tree"""

    # Load the self-tree JSON first
    with open(SELF_TREE_PATH, 'r', encoding='utf-8') as f:
        self_tree = json.load(f)

    print("=" * 70)
    print("SELF-TREE IMPORT TEST - Build 700")
    print("=" * 70)
    print(f"\nSelf-tree: {self_tree.get('name', 'Unknown')}")
    print(f"ID: {self_tree.get('id', 'Unknown')}")

    # Count nodes in self-tree
    def count_nodes(node):
        count = 1
        for child in node.get('children', []):
            count += count_nodes(child)
        for child in node.get('items', []):
            count += count_nodes(child)
        for child in node.get('subtasks', []):
            count += count_nodes(child)
        return count

    expected_nodes = count_nodes(self_tree)
    print(f"Expected nodes: {expected_nodes}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        # 1. Load TreeListy
        print("\n1. Loading TreeListy...")
        page.goto(TREELISTY_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)

        build = page.evaluate("window.TREELISTY_VERSION?.build || 'unknown'")
        print(f"   Build: {build}")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "self-tree-01-loaded.png"))

        # 2. Import the self-tree via JavaScript
        print("\n2. Importing self-tree via loadTree()...")

        # Serialize the tree and inject it
        tree_json = json.dumps(self_tree)

        result = page.evaluate(f"""(() => {{
            try {{
                const tree = {tree_json};

                // Use loadTree if available
                if (typeof loadTree === 'function') {{
                    loadTree(tree);
                    return {{ success: true, method: 'loadTree' }};
                }}

                // Fallback: set capexTree directly
                if (typeof capexTree !== 'undefined') {{
                    Object.assign(capexTree, tree);
                    if (typeof normalizeTreeStructure === 'function') {{
                        normalizeTreeStructure(capexTree);
                    }}
                    if (typeof render === 'function') {{
                        render();
                    }}
                    return {{ success: true, method: 'direct' }};
                }}

                return {{ success: false, error: 'No load method available' }};
            }} catch (e) {{
                return {{ success: false, error: e.message }};
            }}
        }})()""")

        print(f"   Import result: {result}")
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "self-tree-02-imported.png"))

        # 3. Verify the tree loaded
        print("\n3. Verifying tree structure...")

        verify = page.evaluate("""(() => {
            if (typeof capexTree === 'undefined') return { error: 'capexTree not found' };

            function countNodes(node) {
                let count = 1;
                (node.children || []).forEach(c => count += countNodes(c));
                (node.items || []).forEach(c => count += countNodes(c));
                (node.subtasks || []).forEach(c => count += countNodes(c));
                return count;
            }

            return {
                name: capexTree.name,
                id: capexTree.id,
                nodeCount: countNodes(capexTree),
                hasChildren: (capexTree.children?.length || 0) > 0,
                childrenCount: capexTree.children?.length || 0,
                firstChild: capexTree.children?.[0]?.name || 'none'
            };
        })()""")

        print(f"   Tree name: {verify.get('name')}")
        print(f"   Tree ID: {verify.get('id')}")
        print(f"   Node count: {verify.get('nodeCount')}")
        print(f"   Children: {verify.get('childrenCount')}")
        print(f"   First child: {verify.get('firstChild')}")

        # 4. Check tree view displays nodes
        print("\n4. Checking tree view rendering...")

        tree_view = page.evaluate("""(() => {
            const treeRoot = document.getElementById('tree-root');
            const phases = treeRoot?.querySelectorAll('.phase') || [];
            const items = treeRoot?.querySelectorAll('.item') || [];
            return {
                treeRootExists: !!treeRoot,
                phaseCount: phases.length,
                itemCount: items.length
            };
        })()""")

        print(f"   Tree root exists: {tree_view.get('treeRootExists')}")
        print(f"   Phases rendered: {tree_view.get('phaseCount')}")
        print(f"   Items rendered: {tree_view.get('itemCount')}")

        # 5. Switch to Canvas view
        print("\n5. Testing Canvas view...")
        try:
            page.locator("#view-dropdown-btn").click()
            page.wait_for_timeout(200)
            page.locator("#view-canvas-btn").click()
            page.wait_for_timeout(2000)

            canvas = page.evaluate("""(() => {
                const container = document.getElementById('canvas-container');
                const nodes = container?.querySelectorAll('.canvas-node, .go-node, [data-node-id]') || [];
                return {
                    containerVisible: container?.style.display !== 'none',
                    nodeCount: nodes.length
                };
            })()""")

            print(f"   Canvas visible: {canvas.get('containerVisible')}")
            print(f"   Canvas nodes: {canvas.get('nodeCount')}")
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "self-tree-03-canvas.png"))

        except Exception as e:
            print(f"   Canvas error: {str(e)[:60]}")

        # 6. Test expand all
        print("\n6. Testing expand all (Ctrl+E)...")
        page.keyboard.press("Control+e")
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "self-tree-04-expanded.png"))

        # 7. Summary
        print("\n" + "=" * 70)
        print("SELF-TREE IMPORT SUMMARY")
        print("=" * 70)

        if verify.get('nodeCount', 0) > 0:
            print(f"✅ Tree imported successfully: {verify.get('nodeCount')} nodes")
            if verify.get('nodeCount') == expected_nodes:
                print(f"✅ Node count matches expected: {expected_nodes}")
            else:
                print(f"⚠️ Node count mismatch: got {verify.get('nodeCount')}, expected {expected_nodes}")
        else:
            print("❌ Tree import failed - no nodes found")

        if page_errors:
            print(f"\n⚠️ Page errors: {len(page_errors)}")
            for err in page_errors[:3]:
                print(f"   {err[:80]}")

        browser.close()

        return verify.get('nodeCount', 0) > 0

if __name__ == "__main__":
    success = test_self_tree_import()
    print(f"\n{'=' * 70}")
    print(f"Overall: {'PASS ✅' if success else 'FAIL ❌'}")
