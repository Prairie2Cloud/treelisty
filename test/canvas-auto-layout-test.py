"""
Canvas Auto-Layout Test - Build 599
Verifies that collapsed phase nodes are auto-positioned in a grid layout
"""
from playwright.sync_api import sync_playwright
import json
import os
import sys

# Fix encoding for Windows
sys.stdout.reconfigure(encoding='utf-8')

def test_canvas_auto_layout():
    # Load the Anti-Hegelian tree
    tree_path = "D:/OneDrive/Desktop/Production-Versions/treeplexity/trees/anti-hegelian-tradition-20251226_065231.json"
    with open(tree_path, 'r', encoding='utf-8') as f:
        tree = json.load(f)

    print(f"[OK] Tree loaded: {tree['name']}")
    print(f"   Sections: {len(tree['children'])}")

    # Check phase node positions before (they should be undefined)
    phases_without_pos = 0
    for phase in tree['children']:
        if phase.get('canvasX') is None or phase.get('canvasY') is None:
            phases_without_pos += 1
            print(f"   Phase '{phase['name'][:40]}...' - NO position")
        else:
            print(f"   Phase '{phase['name'][:40]}...' - pos: ({phase['canvasX']}, {phase['canvasY']})")

    print(f"\n[INFO] {phases_without_pos}/{len(tree['children'])} phases without positions")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load TreeListy
        page.goto('file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html')
        page.wait_for_load_state('networkidle')

        # Check version
        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"\n[OK] TreeListy Build {version} loaded")

        # Import tree via capexTree
        page.evaluate(f'capexTree = {json.dumps(tree)}')
        page.evaluate('render()')
        page.wait_for_timeout(500)

        # Switch to Canvas view via JavaScript
        page.evaluate('''
            viewMode = "canvas";
            document.querySelector(".tree-view-container")?.classList.add("hidden");
            document.getElementById("canvas-container")?.classList.add("active");
            renderCanvas();
        ''')
        page.wait_for_timeout(1000)

        # Take screenshot before checking positions
        os.makedirs('D:/screenshots', exist_ok=True)
        page.screenshot(path='D:/screenshots/canvas-auto-layout-test.png', full_page=True)
        print("[SCREENSHOT] D:/screenshots/canvas-auto-layout-test.png")

        # Check canvas nodes
        canvas_nodes = page.query_selector_all('.canvas-node')
        print(f"\n[INFO] Canvas nodes rendered: {len(canvas_nodes)}")

        # Get positions of first few nodes
        for i, node in enumerate(canvas_nodes[:5]):
            box = node.bounding_box()
            item_id = node.get_attribute('data-item-id')
            node_text = node.inner_text()[:50].replace('\n', ' ')
            if box:
                print(f"   Node {i}: pos=({int(box['x'])}, {int(box['y'])}) - {node_text}...")

        # Check that nodes are in grid pattern (not all at same x or y)
        positions = []
        for node in canvas_nodes[:10]:
            box = node.bounding_box()
            if box:
                positions.append((box['x'], box['y']))

        if len(positions) >= 2:
            x_values = set(int(p[0]) for p in positions)
            y_values = set(int(p[1]) for p in positions)

            if len(x_values) > 1 or len(y_values) > 1:
                print(f"\n[PASS] Grid layout detected - X variance: {len(x_values)}, Y variance: {len(y_values)}")
            else:
                print(f"\n[FAIL] All nodes at same position!")
        else:
            print("\n[WARN] Not enough nodes to verify grid layout")

        browser.close()

if __name__ == '__main__':
    test_canvas_auto_layout()
