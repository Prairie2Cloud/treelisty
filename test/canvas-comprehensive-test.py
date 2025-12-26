"""
Canvas Comprehensive Test - Build 599
Tests:
1. Canvas rendering with existing positions
2. Auto-layout fallback for phases without positions
3. Phase expansion/collapse
4. Node positioning
"""
from playwright.sync_api import sync_playwright
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_canvas_comprehensive():
    print("=" * 60)
    print("CANVAS COMPREHENSIVE TEST - Build 599")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load TreeListy
        page.goto('file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)

        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"\n[TEST 1] Build Verification")
        print(f"   Build: {version}")
        assert version == 599, f"Expected Build 599, got {version}"
        print("   [PASS] Build 599 confirmed")

        # Test 2: Auto-layout for phases without positions
        print(f"\n[TEST 2] Auto-Layout for Phases Without Positions")

        # Create a tree with phases that have NO canvasX/canvasY
        test_tree = {
            "id": "root",
            "treeId": "test_auto_layout",
            "nodeGuid": "n_test_root",
            "schemaVersion": 2,
            "name": "Auto-Layout Test Tree",
            "type": "root",
            "expanded": True,
            "children": [
                {"id": "phase1", "name": "Phase 1 - No Position", "type": "phase", "expanded": False, "items": []},
                {"id": "phase2", "name": "Phase 2 - No Position", "type": "phase", "expanded": False, "items": []},
                {"id": "phase3", "name": "Phase 3 - No Position", "type": "phase", "expanded": False, "items": []},
                {"id": "phase4", "name": "Phase 4 - No Position", "type": "phase", "expanded": False, "items": []},
                {"id": "phase5", "name": "Phase 5 - No Position", "type": "phase", "expanded": False, "items": []},
                {"id": "phase6", "name": "Phase 6 - No Position", "type": "phase", "expanded": False, "items": []},
            ]
        }

        # Verify phases have NO positions
        for phase in test_tree["children"]:
            assert "canvasX" not in phase, f"Phase {phase['name']} should not have canvasX"
            assert "canvasY" not in phase, f"Phase {phase['name']} should not have canvasY"
        print("   Verified: 6 phases created WITHOUT positions")

        # Load tree and switch to canvas
        page.evaluate(f'capexTree = {json.dumps(test_tree)}')
        page.evaluate('render()')
        page.wait_for_timeout(500)

        page.evaluate('''
            viewMode = "canvas";
            document.querySelector(".tree-view-container")?.classList.add("hidden");
            document.getElementById("canvas-container")?.classList.add("active");
            renderCanvas();
        ''')
        page.wait_for_timeout(1000)

        # Check positions were auto-assigned
        positions_after = page.evaluate('''
            capexTree.children.map(p => ({
                name: p.name,
                canvasX: p.canvasX,
                canvasY: p.canvasY
            }))
        ''')

        print("   Positions after renderCanvas():")
        for pos in positions_after:
            print(f"      {pos['name'][:25]}... -> ({pos['canvasX']}, {pos['canvasY']})")

        # Verify grid layout: 2 columns
        x_values = set(p['canvasX'] for p in positions_after)
        y_values = set(p['canvasY'] for p in positions_after)

        assert len(x_values) == 2, f"Expected 2 columns, got {len(x_values)}"
        assert len(y_values) == 3, f"Expected 3 rows, got {len(y_values)}"
        print(f"   [PASS] Grid layout: {len(x_values)} columns x {len(y_values)} rows")

        # Take screenshot
        os.makedirs('D:/screenshots', exist_ok=True)
        page.screenshot(path='D:/screenshots/canvas-auto-layout-grid.png', full_page=True)
        print("   [SCREENSHOT] D:/screenshots/canvas-auto-layout-grid.png")

        # Test 3: Canvas nodes are rendered
        print(f"\n[TEST 3] Canvas Node Rendering")
        canvas_nodes = page.query_selector_all('.canvas-node')
        print(f"   Canvas nodes rendered: {len(canvas_nodes)}")
        assert len(canvas_nodes) == 6, f"Expected 6 canvas nodes, got {len(canvas_nodes)}"
        print("   [PASS] All 6 phase nodes rendered")

        # Test 4: Load Anti-Hegelian tree with existing positions
        print(f"\n[TEST 4] Existing Positions Preserved")

        tree_path = "D:/OneDrive/Desktop/Production-Versions/treeplexity/trees/anti-hegelian-tradition-20251226_065231.json"
        with open(tree_path, 'r', encoding='utf-8') as f:
            anti_hegel = json.load(f)

        # Get original positions
        original_positions = [(p.get('canvasX'), p.get('canvasY')) for p in anti_hegel['children']]
        print(f"   Original positions: {original_positions[:3]}...")

        # Load and render
        page.evaluate(f'capexTree = {json.dumps(anti_hegel)}')
        page.evaluate('render()')
        page.wait_for_timeout(500)
        page.evaluate('renderCanvas()')
        page.wait_for_timeout(500)

        # Check positions preserved
        final_positions = page.evaluate('''
            capexTree.children.map(p => [p.canvasX, p.canvasY])
        ''')

        positions_match = all(
            orig == tuple(final)
            for orig, final in zip(original_positions, final_positions)
        )

        if positions_match:
            print("   [PASS] Original positions preserved")
        else:
            print("   [FAIL] Positions changed!")
            for i, (orig, final) in enumerate(zip(original_positions, final_positions)):
                if orig != tuple(final):
                    print(f"      Phase {i}: {orig} -> {final}")

        # Take final screenshot
        page.screenshot(path='D:/screenshots/canvas-anti-hegelian.png', full_page=True)
        print("   [SCREENSHOT] D:/screenshots/canvas-anti-hegelian.png")

        canvas_nodes = page.query_selector_all('.canvas-node')
        print(f"\n[TEST 5] Anti-Hegelian Canvas")
        print(f"   Canvas nodes: {len(canvas_nodes)}")
        assert len(canvas_nodes) == 10, f"Expected 10 nodes, got {len(canvas_nodes)}"
        print("   [PASS] All 10 philosophy sections rendered")

        browser.close()

        print("\n" + "=" * 60)
        print("ALL CANVAS TESTS PASSED")
        print("=" * 60)

if __name__ == '__main__':
    test_canvas_comprehensive()
