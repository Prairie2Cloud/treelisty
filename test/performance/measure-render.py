"""
Performance Profiler for TreeListy Tree View
Inject external data to validate assumptions before implementing fixes.

Assumptions to test:
1. "Tree view lags at 150+ nodes" - Is this true? What kind of lag?
2. "DOM count is the bottleneck" - Is it DOM, or is it JS execution?
3. "Virtual scrolling will fix it" - Maybe innerHTML clear is the real issue?
"""

from playwright.sync_api import sync_playwright
import time
import json

def generate_test_tree(node_count):
    """Generate a flat filesystem tree with N nodes"""
    tree = {
        "id": "root",
        "name": f"Test Tree ({node_count} nodes)",
        "type": "root",
        "icon": "🌳",
        "expanded": True,
        "children": []
    }

    # Create phases with items to reach target count
    nodes_per_phase = 50
    phase_count = (node_count - 1) // nodes_per_phase + 1

    for p in range(phase_count):
        phase = {
            "id": f"phase-{p}",
            "name": f"Phase {p + 1}",
            "type": "phase",
            "icon": "📁",
            "expanded": True,
            "items": []
        }

        items_in_phase = min(nodes_per_phase, node_count - 1 - p * nodes_per_phase)
        for i in range(items_in_phase):
            phase["items"].append({
                "id": f"item-{p}-{i}",
                "name": f"Item {p * nodes_per_phase + i + 1}",
                "type": "item",
                "description": f"Test item number {p * nodes_per_phase + i + 1}"
            })

        tree["children"].append(phase)

    return tree

def measure_render_performance(page, tree_json, label):
    """Inject tree and measure render time"""

    # Inject the tree via console
    page.evaluate(f'''
        window.testTree = {tree_json};
        window.capexTree = window.testTree;
    ''')

    # Measure render time
    result = page.evaluate('''() => {
        const start = performance.now();
        if (typeof render === 'function') {
            render();
        }
        const end = performance.now();

        // Count actual DOM nodes
        const treeRoot = document.getElementById('tree-root');
        const nodeCount = treeRoot ? treeRoot.querySelectorAll('.tree-node').length : 0;

        return {
            renderTime: end - start,
            domNodeCount: nodeCount,
            totalDomNodes: document.querySelectorAll('*').length
        };
    }''')

    return result

def run_profiling():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        print("Loading TreeListy...")
        page.goto('https://treelisty.netlify.app')
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # Dismiss any modals
        page.keyboard.press('Escape')
        time.sleep(0.5)

        # Switch to filesystem pattern for consistent testing
        page.evaluate('''
            if (typeof setPattern === 'function') {
                setPattern('filesystem');
            }
        ''')
        time.sleep(0.5)

        print("\n" + "="*60)
        print("PERFORMANCE PROFILING - MEASURING ACTUAL BOTTLENECKS")
        print("="*60)

        results = []
        test_sizes = [50, 100, 200, 500, 1000]

        for size in test_sizes:
            tree = generate_test_tree(size)
            tree_json = json.dumps(tree)

            # Measure multiple times for consistency
            times = []
            for i in range(3):
                result = measure_render_performance(page, tree_json, f"{size} nodes")
                times.append(result['renderTime'])
                time.sleep(0.1)

            avg_time = sum(times) / len(times)
            result['avgRenderTime'] = avg_time
            result['targetNodes'] = size
            results.append(result)

            print(f"\n{size} nodes:")
            print(f"  Render time: {avg_time:.2f}ms (avg of 3)")
            print(f"  DOM nodes created: {result['domNodeCount']}")
            print(f"  Total DOM nodes: {result['totalDomNodes']}")

            # Check for jank
            if avg_time > 16.67:
                print(f"  ⚠️  JANK: Exceeds 60fps budget ({16.67:.2f}ms)")
            if avg_time > 100:
                print(f"  🔴 SEVERE: Exceeds 10fps ({100:.2f}ms)")

        print("\n" + "="*60)
        print("ANALYSIS")
        print("="*60)

        # Calculate scaling
        if len(results) >= 2:
            first = results[0]
            last = results[-1]
            scale_factor = last['avgRenderTime'] / first['avgRenderTime']
            node_factor = last['targetNodes'] / first['targetNodes']

            print(f"\nScaling: {first['targetNodes']} → {last['targetNodes']} nodes")
            print(f"  Time increase: {scale_factor:.1f}x")
            print(f"  Node increase: {node_factor:.1f}x")

            if scale_factor > node_factor * 1.5:
                print("  ⚠️  Super-linear scaling detected (O(n²) or worse)")
            elif scale_factor > node_factor:
                print("  📊 Linear+ scaling (some overhead per node)")
            else:
                print("  ✅ Sub-linear or linear scaling")

        print("\n" + "="*60)
        print("NEXT STEPS")
        print("="*60)
        print("""
Based on these ACTUAL measurements (not assumptions):

1. If render time is <16ms for 500 nodes:
   → Virtual scrolling may be premature optimization

2. If render time scales O(n²):
   → Look for nested loops in render(), not DOM count

3. If DOM node count >> tree node count:
   → Look for DOM bloat (extra wrapper divs, etc.)

4. If times are highly variable:
   → GC or layout thrashing, not node count

Run Chrome DevTools → Performance tab → Record during scroll
to identify the ACTUAL bottleneck before implementing fixes.
""")

        time.sleep(3)
        browser.close()

        return results

if __name__ == '__main__':
    run_profiling()
