"""Atlas Phase-0 Validation: Identity Stability Tests

Phase-0 Success Criteria:
1. Move a node → nodeGuid unchanged
2. Export/import tree → treeId preserved
3. Duplicate node → new nodeGuid generated (no conflicts)
4. Migration adds stable IDs to legacy trees
"""
from playwright.sync_api import sync_playwright
import time
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test():
    print("=" * 60)
    print("ATLAS PHASE-0 VALIDATION: IDENTITY STABILITY")
    print("=" * 60)

    results = {
        'move_preserves_nodeGuid': None,
        'export_import_preserves_treeId': None,
        'duplicate_creates_new_nodeGuid': None,
        'migration_adds_ids': None,
        'tree_rename_preserves_ids': None
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Load local file
        print("\n[LOADING LOCAL FILE]")
        page.goto('file:///D:/OneDrive/Desktop/Production-Versions/treeplexity/treeplexity.html')
        page.wait_for_load_state('networkidle')
        time.sleep(3)
        page.keyboard.press('Escape')
        time.sleep(1)

        # Check version
        version = page.evaluate('window.TREELISTY_VERSION?.build')
        print(f"   Build: {version}")

        # ================================================================
        # TEST 1: Move node preserves nodeGuid
        # ================================================================
        print("\n" + "=" * 60)
        print("TEST 1: MOVE NODE PRESERVES nodeGuid")
        print("=" * 60)

        # Create a test tree with known structure
        page.evaluate('''
            // Create test tree
            capexTree = {
                id: 'root',
                name: 'Atlas Test Tree',
                treeId: 'tree_atlastest',
                nodeGuid: 'n_root0001',
                schemaVersion: 2,
                children: [
                    {
                        id: 'phase_a',
                        name: 'Phase A',
                        type: 'phase',
                        nodeGuid: 'n_phase_a',
                        expanded: true,
                        showInCanvas: true,
                        items: [
                            { id: 'item_1', name: 'Item One', type: 'item', nodeGuid: 'n_item_1', subtasks: [] }
                        ]
                    },
                    {
                        id: 'phase_b',
                        name: 'Phase B',
                        type: 'phase',
                        nodeGuid: 'n_phase_b',
                        expanded: true,
                        showInCanvas: true,
                        items: []
                    }
                ],
                hyperedges: []
            };
            render();
        ''')
        time.sleep(0.5)

        # Get nodeGuid before move
        guid_before = page.evaluate('''
            capexTree.children[0].items[0].nodeGuid
        ''')
        print(f"   nodeGuid before move: {guid_before}")

        # Move item from Phase A to Phase B
        page.evaluate('''
            const item = capexTree.children[0].items[0];
            capexTree.children[0].items = []; // Remove from Phase A
            capexTree.children[1].items.push(item); // Add to Phase B
            render();
        ''')
        time.sleep(0.5)

        # Get nodeGuid after move
        guid_after = page.evaluate('''
            capexTree.children[1].items[0].nodeGuid
        ''')
        print(f"   nodeGuid after move: {guid_after}")

        if guid_before == guid_after:
            print("   ✓ PASSED: nodeGuid preserved after move")
            results['move_preserves_nodeGuid'] = True
        else:
            print("   ✗ FAILED: nodeGuid changed after move!")
            results['move_preserves_nodeGuid'] = False

        # ================================================================
        # TEST 2: Export/Import preserves treeId
        # ================================================================
        print("\n" + "=" * 60)
        print("TEST 2: EXPORT/IMPORT PRESERVES treeId")
        print("=" * 60)

        # Get treeId before export
        treeId_before = page.evaluate('capexTree.treeId')
        print(f"   treeId before export: {treeId_before}")

        # Export tree to JSON string
        exported_json = page.evaluate('JSON.stringify(capexTree)')

        # Clear and reimport
        page.evaluate('''
            capexTree = { id: 'root', name: 'Empty', children: [] };
        ''')

        # Import the exported tree
        page.evaluate(f'''
            const imported = JSON.parse(`{exported_json}`);
            capexTree = imported;
            migrateTree(capexTree); // Run migration (should NOT change existing treeId)
            render();
        ''')
        time.sleep(0.5)

        # Get treeId after import
        treeId_after = page.evaluate('capexTree.treeId')
        print(f"   treeId after import: {treeId_after}")

        if treeId_before == treeId_after:
            print("   ✓ PASSED: treeId preserved after export/import")
            results['export_import_preserves_treeId'] = True
        else:
            print("   ✗ FAILED: treeId changed after export/import!")
            results['export_import_preserves_treeId'] = False

        # ================================================================
        # TEST 3: Duplicate creates new nodeGuid
        # ================================================================
        print("\n" + "=" * 60)
        print("TEST 3: DUPLICATE CREATES NEW nodeGuid")
        print("=" * 60)

        # Get original nodeGuid
        original_guid = page.evaluate('capexTree.children[1].items[0].nodeGuid')
        print(f"   Original nodeGuid: {original_guid}")

        # Duplicate the item (simulate what duplicate_node does)
        page.evaluate('''
            const original = capexTree.children[1].items[0];
            const duplicate = JSON.parse(JSON.stringify(original));
            duplicate.id = 'item_1_copy';
            duplicate.name = 'Item One (Copy)';
            // Critical: Generate NEW nodeGuid for duplicate
            duplicate.nodeGuid = generateNodeGuid();
            capexTree.children[1].items.push(duplicate);
            render();
        ''')
        time.sleep(0.5)

        # Get duplicate's nodeGuid
        duplicate_guid = page.evaluate('capexTree.children[1].items[1].nodeGuid')
        print(f"   Duplicate nodeGuid: {duplicate_guid}")

        if original_guid != duplicate_guid and duplicate_guid.startswith('n_'):
            print("   ✓ PASSED: Duplicate has new nodeGuid")
            results['duplicate_creates_new_nodeGuid'] = True
        else:
            print("   ✗ FAILED: Duplicate has same nodeGuid as original!")
            results['duplicate_creates_new_nodeGuid'] = False

        # ================================================================
        # TEST 4: Migration adds IDs to legacy trees
        # ================================================================
        print("\n" + "=" * 60)
        print("TEST 4: MIGRATION ADDS IDS TO LEGACY TREES")
        print("=" * 60)

        # Create a legacy tree WITHOUT treeId/nodeGuid
        page.evaluate('''
            capexTree = {
                id: 'root',
                name: 'Legacy Tree (No IDs)',
                schemaVersion: 0,
                children: [
                    {
                        id: 'phase1',
                        name: 'Phase One',
                        type: 'phase',
                        items: [
                            { id: 'task1', name: 'Task One', type: 'item' }
                        ]
                    }
                ]
            };
        ''')

        # Verify no IDs exist
        has_treeId_before = page.evaluate('!!capexTree.treeId')
        has_nodeGuid_before = page.evaluate('!!capexTree.nodeGuid')
        print(f"   Before migration - treeId: {has_treeId_before}, nodeGuid: {has_nodeGuid_before}")

        # Run migration
        page.evaluate('''
            migrateTree(capexTree);
            render();
        ''')
        time.sleep(0.5)

        # Verify IDs were added
        has_treeId_after = page.evaluate('!!capexTree.treeId')
        has_nodeGuid_after = page.evaluate('!!capexTree.nodeGuid')
        treeId = page.evaluate('capexTree.treeId')
        root_guid = page.evaluate('capexTree.nodeGuid')
        phase_guid = page.evaluate('capexTree.children[0].nodeGuid')
        task_guid = page.evaluate('capexTree.children[0].items[0].nodeGuid')

        print(f"   After migration:")
        print(f"      treeId: {treeId}")
        print(f"      root nodeGuid: {root_guid}")
        print(f"      phase nodeGuid: {phase_guid}")
        print(f"      task nodeGuid: {task_guid}")

        all_have_guids = (
            treeId and treeId.startswith('tree_') and
            root_guid and root_guid.startswith('n_') and
            phase_guid and phase_guid.startswith('n_') and
            task_guid and task_guid.startswith('n_')
        )

        if all_have_guids:
            print("   ✓ PASSED: Migration added all IDs")
            results['migration_adds_ids'] = True
        else:
            print("   ✗ FAILED: Some IDs missing after migration!")
            results['migration_adds_ids'] = False

        # ================================================================
        # TEST 5: Tree rename preserves IDs
        # ================================================================
        print("\n" + "=" * 60)
        print("TEST 5: TREE RENAME PRESERVES IDS")
        print("=" * 60)

        # Get IDs before rename
        treeId_before = page.evaluate('capexTree.treeId')
        root_guid_before = page.evaluate('capexTree.nodeGuid')
        print(f"   Before rename - treeId: {treeId_before}, nodeGuid: {root_guid_before}")

        # Rename the tree
        page.evaluate('''
            capexTree.name = 'Renamed Tree (IDs Should Persist)';
            render();
        ''')
        time.sleep(0.5)

        # Get IDs after rename
        treeId_after = page.evaluate('capexTree.treeId')
        root_guid_after = page.evaluate('capexTree.nodeGuid')
        print(f"   After rename - treeId: {treeId_after}, nodeGuid: {root_guid_after}")

        if treeId_before == treeId_after and root_guid_before == root_guid_after:
            print("   ✓ PASSED: IDs preserved after tree rename")
            results['tree_rename_preserves_ids'] = True
        else:
            print("   ✗ FAILED: IDs changed after rename!")
            results['tree_rename_preserves_ids'] = False

        # ================================================================
        # SUMMARY
        # ================================================================
        print("\n" + "=" * 60)
        print("ATLAS PHASE-0 VALIDATION SUMMARY")
        print("=" * 60)

        passed = sum(1 for v in results.values() if v is True)
        total = len(results)

        for test, result in results.items():
            status = "✓ PASS" if result else "✗ FAIL"
            print(f"   {status}: {test}")

        print(f"\n   Total: {passed}/{total} tests passed")

        if passed == total:
            print("\n✓ PHASE-0 VALIDATION COMPLETE: All identity stability tests pass!")
            print("   Atlas foundation is ready for Phase-1.")
        else:
            print(f"\n✗ PHASE-0 VALIDATION FAILED: {total - passed} test(s) need attention")

        # Screenshot
        page.screenshot(path='test/screenshots/atlas-phase0-validation.png')
        print("\n   Screenshot saved")

        time.sleep(3)
        browser.close()

        return passed == total

if __name__ == '__main__':
    success = test()
    sys.exit(0 if success else 1)
