"""Test Build 621: Image Spatial Commands"""
from playwright.sync_api import sync_playwright
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("TEST: IMAGE SPATIAL COMMANDS (BUILD 621)")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Capture console logs
        console_logs = []
        page.on('console', lambda msg: console_logs.append(msg.text))

        # Load live site
        print("\n[LOADING LIVE SITE]")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build: {version}")

        # Test 1: Check helper functions exist
        print("\n[TEST 1: HELPER FUNCTIONS EXIST]")
        helpers_check = page.evaluate('''(() => {
            return {
                has_image_analysis: typeof COMMAND_REGISTRY['_has_image_analysis'] === 'function',
                get_bbox_nodes: typeof COMMAND_REGISTRY['_get_bbox_nodes'] === 'function',
                bbox_distance: typeof COMMAND_REGISTRY['_bbox_distance'] === 'function',
                bbox_contains: typeof COMMAND_REGISTRY['_bbox_contains'] === 'function',
                bbox_in_region: typeof COMMAND_REGISTRY['_bbox_in_region'] === 'function'
            };
        })()''')

        print(f"   _has_image_analysis: {helpers_check.get('has_image_analysis')}")
        print(f"   _get_bbox_nodes: {helpers_check.get('get_bbox_nodes')}")
        print(f"   _bbox_distance: {helpers_check.get('bbox_distance')}")
        print(f"   _bbox_contains: {helpers_check.get('bbox_contains')}")
        print(f"   _bbox_in_region: {helpers_check.get('bbox_in_region')}")

        if all(helpers_check.values()):
            print("   PASSED: All helper functions exist")
        else:
            print("   FAILED: Missing helper functions")

        # Test 2: Check main commands exist
        print("\n[TEST 2: SPATIAL COMMANDS EXIST]")
        commands_check = page.evaluate('''(() => {
            return {
                nearby: typeof COMMAND_REGISTRY['nearby'] === 'function',
                region: typeof COMMAND_REGISTRY['region'] === 'function',
                containing: typeof COMMAND_REGISTRY['containing'] === 'function',
                near: typeof COMMAND_REGISTRY['near'] === 'function',
                objects_near: typeof COMMAND_REGISTRY['objects_near'] === 'function',
                in_region: typeof COMMAND_REGISTRY['in_region'] === 'function',
                quadrant: typeof COMMAND_REGISTRY['quadrant'] === 'function',
                contains: typeof COMMAND_REGISTRY['contains'] === 'function',
                parent_objects: typeof COMMAND_REGISTRY['parent_objects'] === 'function'
            };
        })()''')

        print(f"   nearby: {commands_check.get('nearby')}")
        print(f"   region: {commands_check.get('region')}")
        print(f"   containing: {commands_check.get('containing')}")
        print(f"   Aliases: near={commands_check.get('near')}, in_region={commands_check.get('in_region')}, contains={commands_check.get('contains')}")

        if all(commands_check.values()):
            print("   PASSED: All spatial commands exist")
        else:
            print("   FAILED: Missing spatial commands")

        # Test 3: Test commands without image analysis (should return helpful message)
        print("\n[TEST 3: COMMANDS WITHOUT IMAGE ANALYSIS]")

        nearby_result = page.evaluate('COMMAND_REGISTRY["nearby"]()')
        print(f"   nearby (no image): {nearby_result[:60]}...")

        region_result = page.evaluate('COMMAND_REGISTRY["region"]("center")')
        print(f"   region (no image): {region_result[:60]}...")

        containing_result = page.evaluate('COMMAND_REGISTRY["containing"]()')
        print(f"   containing (no image): {containing_result[:60]}...")

        if 'image analysis' in nearby_result.lower() or 'analyze' in nearby_result.lower():
            print("   PASSED: Commands return helpful message when no image analysis")
        else:
            print("   WARNING: Commands may not handle missing image analysis gracefully")

        # Test 4: Test bbox helper functions directly
        print("\n[TEST 4: BBOX HELPER FUNCTIONS]")

        # Test distance calculation
        distance_test = page.evaluate('''(() => {
            const bbox1 = { xMin: 0.0, yMin: 0.0, xMax: 0.2, yMax: 0.2 };  // Center at (0.1, 0.1)
            const bbox2 = { xMin: 0.3, yMin: 0.3, xMax: 0.5, yMax: 0.5 };  // Center at (0.4, 0.4)
            const dist = COMMAND_REGISTRY['_bbox_distance'](bbox1, bbox2);
            // Expected: sqrt((0.4-0.1)^2 + (0.4-0.1)^2) = sqrt(0.18) ≈ 0.424
            return { distance: dist, expected: Math.sqrt(0.18), match: Math.abs(dist - Math.sqrt(0.18)) < 0.001 };
        })()''')
        print(f"   Distance calc: {distance_test.get('distance'):.4f} (expected: {distance_test.get('expected'):.4f}) - {'PASS' if distance_test.get('match') else 'FAIL'}")

        # Test containment
        contains_test = page.evaluate('''(() => {
            const outer = { xMin: 0.0, yMin: 0.0, xMax: 1.0, yMax: 1.0 };
            const inner = { xMin: 0.2, yMin: 0.2, xMax: 0.8, yMax: 0.8 };
            const notContained = { xMin: 0.5, yMin: 0.5, xMax: 1.5, yMax: 1.5 };
            return {
                outerContainsInner: COMMAND_REGISTRY['_bbox_contains'](outer, inner),
                outerContainsNot: COMMAND_REGISTRY['_bbox_contains'](outer, notContained)
            };
        })()''')
        print(f"   Containment: outer contains inner={contains_test.get('outerContainsInner')}, contains overflow={contains_test.get('outerContainsNot')}")
        if contains_test.get('outerContainsInner') and not contains_test.get('outerContainsNot'):
            print("   PASSED: Containment logic correct")
        else:
            print("   FAILED: Containment logic incorrect")

        # Test region detection
        region_test = page.evaluate('''(() => {
            const topLeft = { xMin: 0.0, yMin: 0.0, xMax: 0.2, yMax: 0.2 };      // Center at (0.1, 0.1)
            const center = { xMin: 0.4, yMin: 0.4, xMax: 0.6, yMax: 0.6 };       // Center at (0.5, 0.5)
            const bottomRight = { xMin: 0.8, yMin: 0.8, xMax: 1.0, yMax: 1.0 };  // Center at (0.9, 0.9)
            return {
                topLeftInTopLeft: COMMAND_REGISTRY['_bbox_in_region'](topLeft, 'top-left'),
                centerInCenter: COMMAND_REGISTRY['_bbox_in_region'](center, 'center'),
                bottomRightInBottomRight: COMMAND_REGISTRY['_bbox_in_region'](bottomRight, 'bottom-right'),
                topLeftInCenter: COMMAND_REGISTRY['_bbox_in_region'](topLeft, 'center')
            };
        })()''')
        print(f"   Region: topLeft in 'top-left'={region_test.get('topLeftInTopLeft')}")
        print(f"   Region: center in 'center'={region_test.get('centerInCenter')}")
        print(f"   Region: bottomRight in 'bottom-right'={region_test.get('bottomRightInBottomRight')}")
        print(f"   Region: topLeft in 'center'={region_test.get('topLeftInCenter')} (should be False)")

        if (region_test.get('topLeftInTopLeft') and
            region_test.get('centerInCenter') and
            region_test.get('bottomRightInBottomRight') and
            not region_test.get('topLeftInCenter')):
            print("   PASSED: Region detection correct")
        else:
            print("   FAILED: Region detection incorrect")

        # Test 5: Create mock image analysis data and test commands
        print("\n[TEST 5: COMMANDS WITH MOCK IMAGE ANALYSIS]")

        # Inject mock image analysis data
        page.evaluate('''(() => {
            // Add mock image analysis to current tree
            capexTree._imageAnalysis = {
                sourceImage: 'data:image/png;base64,mock',
                analyzedAt: new Date().toISOString()
            };

            // Create mock phases with bboxes
            if (!capexTree.children) capexTree.children = [];

            // Clear existing and add test phases
            capexTree.children = [
                {
                    id: 'phase_test1',
                    name: 'Objects',
                    type: 'phase',
                    expanded: true,
                    items: [
                        { id: 'item_a', name: 'Top-Left Object', type: 'item', _bbox: { xMin: 0.0, yMin: 0.0, xMax: 0.2, yMax: 0.2 } },
                        { id: 'item_b', name: 'Center Object', type: 'item', _bbox: { xMin: 0.4, yMin: 0.4, xMax: 0.6, yMax: 0.6 } },
                        { id: 'item_c', name: 'Bottom-Right Object', type: 'item', _bbox: { xMin: 0.8, yMin: 0.8, xMax: 1.0, yMax: 1.0 } },
                        { id: 'item_d', name: 'Near Top-Left', type: 'item', _bbox: { xMin: 0.15, yMin: 0.15, xMax: 0.3, yMax: 0.3 } },
                        { id: 'item_e', name: 'Large Container', type: 'item', _bbox: { xMin: 0.0, yMin: 0.0, xMax: 0.5, yMax: 0.5 } }
                    ]
                }
            ];

            return true;
        })()''')
        print("   Injected mock image analysis data")

        # Focus on Top-Left Object
        page.evaluate('''(() => {
            const item = capexTree.children[0].items[0];
            window.focusedNode = item;
            window.selectedNodeId = item.id;
        })()''')
        print("   Focused on: Top-Left Object")

        # Test nearby command
        nearby_mock = page.evaluate('COMMAND_REGISTRY["nearby"]("0.3")')
        print(f"   nearby(0.3): {nearby_mock[:80]}...")
        if 'Near Top-Left' in nearby_mock:
            print("   PASSED: nearby found adjacent object")
        else:
            print("   WARNING: nearby may not have found expected object")

        # Test region command
        region_mock = page.evaluate('COMMAND_REGISTRY["region"]("top-left")')
        print(f"   region(top-left): {region_mock[:80]}...")
        if 'Top-Left Object' in region_mock or 'item_a' in region_mock:
            print("   PASSED: region found object in quadrant")
        else:
            print("   WARNING: region may not have found expected object")

        # Focus on a small object inside the Large Container
        page.evaluate('''(() => {
            const item = capexTree.children[0].items[0];  // Top-Left Object
            window.focusedNode = item;
            window.selectedNodeId = item.id;
        })()''')

        # Test containing command
        containing_mock = page.evaluate('COMMAND_REGISTRY["containing"]()')
        print(f"   containing(): {containing_mock[:80]}...")
        if 'Large Container' in containing_mock or 'item_e' in containing_mock:
            print("   PASSED: containing found parent object")
        else:
            print("   WARNING: containing may not have found expected object")

        # Screenshot
        page.screenshot(path='test/screenshots/spatial-commands-test.png')
        print("\n   Screenshot saved")

        print("\n" + "=" * 60)
        print("IMAGE SPATIAL COMMANDS TEST COMPLETE")
        print("=" * 60)

        # Summary
        print("\n[SUMMARY]")
        print("   Build 621 adds spatial commands for image-analyzed trees:")
        print("   - nearby [threshold]: Find objects near focused node")
        print("   - region [quadrant]: List objects in image region")
        print("   - containing: Find objects that contain focused node")
        print("\n   Helper functions provide bbox calculations:")
        print("   - _bbox_distance: Euclidean distance between centers")
        print("   - _bbox_contains: Check if one bbox contains another")
        print("   - _bbox_in_region: Check if bbox is in a quadrant")

        time.sleep(3)
        browser.close()

if __name__ == '__main__':
    test()
