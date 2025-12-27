# Help as Tree + General Embed Mode

**Date:** 2025-12-27
**Status:** Design Approved
**Build Target:** 610+

## Summary

Replace the current wall-of-text Help modal with an embedded TreeListy instance displaying help content as a navigable tree. This requires building a general-purpose readonly/embed mode that unlocks additional use cases beyond help.

## Problem

Current help is:
- A ~150-line wall of inline HTML
- Hard to navigate (linear reading only)
- Hard to maintain (inline styles)
- Overwhelming for stuck users looking for specific tasks
- Not dogfooding TreeListy's own capabilities

## Solution

1. **General embed mode** - URL parameters to load TreeListy in readonly/embed configurations
2. **Help tree** - Help content structured as a filesystem-pattern tree
3. **iframe integration** - Help modal loads TL-in-TL via lazy-loaded iframe

## User Priorities

1. **Stuck users** (primary) - "How do I do X?" - need task-oriented lookup
2. **New users** (secondary) - "What is this?" - need quick start guide

---

## URL Parameter API

```
treeplexity.html?mode=readonly&tree=help
treeplexity.html?mode=embed&tree=https://example.com/my-tree.json
treeplexity.html?mode=embed&tree=help&theme=dark&expanded=false
```

| Parameter | Values | Description |
|-----------|--------|-------------|
| `mode` | `readonly`, `embed` | `readonly` = view-only, full chrome. `embed` = minimal chrome for iframes |
| `tree` | `help`, URL, base64 | Built-in tree name, URL to JSON, or compressed data |
| `theme` | `dark`, `light` | Override theme (optional) |
| `expanded` | `true`, `false` | Start expanded or collapsed (default: false) |
| `pattern` | pattern key | Force pattern override (optional) |

### Mode Differences

- **`readonly`** - Full UI, no editing. Good for shareable links.
- **`embed`** - Minimal UI (no header, no sidebar). Good for iframes.

### Special Tree Values

- `help` - Built-in help tree (help-tree.json)
- `welcome` - Default welcome tree
- URL - Fetch from any CORS-enabled endpoint

---

## UI Changes

### Hidden in Readonly Mode

| Element | Reason |
|---------|--------|
| Context menu edit options | No Add/Delete/Edit |
| Save button | Can't modify |
| AI Wizard, Analyze Text | These modify tree |
| Inline editing | Click shows info, not edit modal |
| +/- buttons | No structural changes |

### Kept in Readonly Mode

| Element | Reason |
|---------|--------|
| Expand/Collapse | Navigation essential |
| View switching (Tree/Canvas/3D) | Exploration |
| Search / TreeBeard | Q&A queries |
| Info panel (read-only) | View descriptions |
| Zoom/Pan controls | Navigation |

### Hidden in Embed Mode (additional)

| Element | Reason |
|---------|--------|
| Header toolbar | Minimal chrome |
| Sidebar icons | Minimal chrome |
| Version badge | Cleaner embed |

### New Element

**"Clone to Edit" button** - Appears in readonly/embed mode. Opens full TreeListy with tree copied for editing.

---

## Implementation

### Detection and Initialization

```javascript
// Parse URL params (early in page load)
const urlParams = new URLSearchParams(window.location.search);
const viewMode = urlParams.get('mode'); // 'readonly' | 'embed' | null
const treeSource = urlParams.get('tree'); // 'help' | URL | null
const themeOverride = urlParams.get('theme');
const startExpanded = urlParams.get('expanded') !== 'false';

// Set global flags
window.TREELISTY_MODE = {
    readonly: viewMode === 'readonly' || viewMode === 'embed',
    embed: viewMode === 'embed',
    treeSource: treeSource
};

// Apply body classes
if (TREELISTY_MODE.readonly) document.body.classList.add('readonly-mode');
if (TREELISTY_MODE.embed) document.body.classList.add('embed-mode');
```

### CSS-Based UI Hiding

```css
/* Hide editing controls in readonly mode */
body.readonly-mode .edit-control,
body.readonly-mode .save-btn,
body.readonly-mode .ai-wizard-btn,
body.readonly-mode [data-action="add"],
body.readonly-mode [data-action="delete"],
body.readonly-mode [data-action="edit"] {
    display: none !important;
}

/* Minimal chrome for embed mode */
body.embed-mode .header-toolbar,
body.embed-mode .sidebar,
body.embed-mode .version-badge {
    display: none !important;
}

body.embed-mode .main-content {
    margin-left: 0;
}
```

### Tree Loading Logic

```javascript
async function loadTreeFromSource(source) {
    if (source === 'help') {
        return await fetch('help-tree.json').then(r => r.json());
    } else if (source === 'welcome') {
        return await fetch('welcome-to-treelisty.json').then(r => r.json());
    } else if (source?.startsWith('http')) {
        return await fetch(source).then(r => r.json());
    } else if (source) {
        // Base64/LZ-compressed
        return JSON.parse(LZString.decompressFromEncodedURIComponent(source));
    }
    return null;
}
```

---

## Help Tree Structure

**File:** `help-tree.json`

```json
{
  "id": "root",
  "name": "TreeListy Help",
  "type": "root",
  "icon": "📖",
  "pattern": { "key": "filesystem" },
  "expanded": true,
  "children": [
    {
      "id": "quick-start",
      "name": "Quick Start (5 min)",
      "type": "phase",
      "icon": "🚀",
      "items": [
        { "id": "qs-1", "name": "What is TreeListy?", "type": "item", "description": "..." },
        { "id": "qs-2", "name": "Your first tree", "type": "item", "description": "..." },
        { "id": "qs-3", "name": "Three ways to build", "type": "item", "description": "..." }
      ]
    },
    {
      "id": "common-tasks",
      "name": "How Do I...",
      "type": "phase",
      "icon": "🔧",
      "items": [
        { "id": "ct-1", "name": "Import a document", "type": "item", "description": "..." },
        { "id": "ct-2", "name": "Add dependencies", "type": "item", "description": "..." },
        { "id": "ct-3", "name": "Export to Excel", "type": "item", "description": "..." },
        { "id": "ct-4", "name": "Share my tree", "type": "item", "description": "..." },
        { "id": "ct-5", "name": "Use Canvas View", "type": "item", "description": "..." },
        { "id": "ct-6", "name": "Create hyperedges", "type": "item", "description": "..." }
      ]
    },
    {
      "id": "features",
      "name": "Features Reference",
      "type": "phase",
      "icon": "⚡",
      "items": []
    },
    {
      "id": "patterns",
      "name": "Patterns Guide",
      "type": "phase",
      "icon": "🎨",
      "items": []
    },
    {
      "id": "shortcuts",
      "name": "Keyboard Shortcuts",
      "type": "phase",
      "icon": "⌨️",
      "items": []
    },
    {
      "id": "whats-new",
      "name": "What's New",
      "type": "phase",
      "icon": "✨",
      "items": []
    }
  ]
}
```

---

## iframe Integration for Help

### Help Button Handler

```javascript
document.getElementById('how-to-btn').addEventListener('click', () => {
    const modal = document.getElementById('modal');
    modal.classList.add('help-modal');
    document.getElementById('modal-title').textContent = '📖 Help';

    // Lazy load iframe only on first click
    document.getElementById('modal-body').innerHTML = `
        <div class="help-iframe-container" style="
            width: 100%;
            height: 70vh;
            min-height: 500px;
            border-radius: 8px;
            overflow: hidden;
        ">
            <iframe
                src="treeplexity.html?mode=embed&tree=help&expanded=false"
                style="width: 100%; height: 100%; border: none;"
                loading="lazy"
                title="TreeListy Help"
            ></iframe>
        </div>
    `;

    document.querySelector('#modal .modal-footer').innerHTML = `
        <button class="btn" onclick="window.open('treeplexity.html?tree=help', '_blank')">
            ↗️ Open Full Screen
        </button>
        <button class="btn" onclick="document.getElementById('modal').style.display='none'">
            Close
        </button>
    `;

    modal.style.display = 'flex';
});
```

### Modal Sizing

```css
#modal.help-modal .modal-content {
    max-width: 900px;
    width: 90vw;
}
```

---

## Use Cases Unlocked

Beyond help, this embed mode enables:

1. **Embeddable previews** - Share trees on external sites via iframe
2. **Template gallery** - Browse example trees before cloning
3. **Onboarding tours** - Interactive walkthrough trees
4. **Documentation sites** - Docs as navigable trees
5. **Tree comparisons** - Side-by-side iframes for before/after

---

## Implementation Order

1. Add URL parameter parsing and `TREELISTY_MODE` global
2. Add CSS classes for readonly/embed mode hiding
3. Create `help-tree.json` with initial content
4. Add tree source loading logic
5. Update Help button to use iframe
6. Add "Clone to Edit" button for readonly mode
7. Migrate existing help content into tree structure
8. Test all modes and combinations

---

## Files to Modify

- `treeplexity.html` - URL parsing, CSS, mode detection, Help button handler
- `help-tree.json` (new) - Help content as tree structure

## Files to Create

- `help-tree.json` - Help content tree
