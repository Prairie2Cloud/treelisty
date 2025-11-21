import json

# Load the welcome tree
with open('welcome-to-treelisty.json', 'r', encoding='utf-8') as f:
    tree = json.load(f)

print("BEFORE FIX:")
print(f"  Root has {len(tree['children'])} children")
if tree['children']:
    phase0 = tree['children'][0]
    print(f"  Phase 0 has {len(phase0.get('children', []))} nested phases")

# Extract all nested phases
def extract_phases(node):
    """Recursively extract all phases from nested structure"""
    phases = []

    if node.get('type') == 'phase':
        # This is a phase - extract it
        phases.append(node)

        # Check if it has nested phases in 'children'
        if 'children' in node:
            for child in node['children']:
                if child.get('type') == 'phase':
                    # Extract nested phases recursively
                    phases.extend(extract_phases(child))

            # Remove the 'children' array after extracting phases
            del node['children']

    return phases

# Extract all phases from the nested structure
all_phases = []
for child in tree['children']:
    all_phases.extend(extract_phases(child))

# Replace root's children with all extracted phases (now siblings)
tree['children'] = all_phases

# Set default showInCanvas for phases (Phase 0 visible, others hidden initially to match current behavior)
for i, phase in enumerate(tree['children']):
    if i == 0:
        # Phase 0 visible by default (current behavior)
        phase['showInCanvas'] = True
    else:
        # Other phases hidden by default (can be toggled with eye icon)
        phase['showInCanvas'] = False

print("\nAFTER FIX:")
print(f"  Root has {len(tree['children'])} children (all siblings now)")
for i, phase in enumerate(tree['children']):
    print(f"    - Phase {i}: (showInCanvas: {phase.get('showInCanvas', True)})")

# Save the fixed tree
with open('welcome-to-treelisty.json', 'w', encoding='utf-8') as f:
    json.dump(tree, f, indent=2, ensure_ascii=False)

print("\n[OK] Fixed welcome-to-treelisty.json structure")
print("     All phases are now siblings (not nested)")
print("     Phase 0 visible in Canvas by default")
print("     Phases 1, 2, 3 hidden by default (toggle with eye icon)")
