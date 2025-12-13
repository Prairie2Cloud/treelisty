# Reader Navigation Design

**Date**: 2025-12-13
**Status**: Approved
**Build**: 411 (planned)

## Overview

Add sequential prev/next navigation to the info panel, letting users step through all nodes like pages in a book. Supports review mode and presentation mode.

## Core Behavior

- Click any node to open info panel (existing)
- Nav bar appears at top: `[◀ Prev] 3 of 24 [Next ▶]`
- Arrow keys (← →) navigate when panel is open
- Tree view scrolls to and highlights current node
- "Read mode" toggle hides edit controls for cleaner reading

## Node Order

- **Default**: Depth-first traversal (Phase 1 → items → subtasks → Phase 2 → ...)
- **With sort/filter**: Follows active sort/filter order
- **Includes**: All node types (root, phases, items, subtasks), even in collapsed branches

## UI Specification

### Nav Bar (Info Panel Header)

```
┌─────────────────────────────────────────────────────────────┐
│ [◀] [▶]  3 of 24  │  📖 Read mode  │          [✕]          │
├─────────────────────────────────────────────────────────────┤
│ 📦 Node Name                                                │
│ Description text here...                                    │
```

- Prev/Next buttons (disabled at ends, not hidden)
- Position indicator: "3 of 24"
- Read mode toggle (📖 icon, highlights when active)
- Close button unchanged

### Read Mode Toggle

**ON (read mode):**
- Hides all input fields, dropdowns, edit buttons
- Shows name, description, pattern fields as plain text
- Clean, distraction-free reading

**OFF (edit mode):**
- Full editable panel (current behavior)
- Nav still works for edit-as-you-go workflow

### Tree View Sync

- Current node gets blue highlight ring (glow effect)
- Tree auto-scrolls to keep node visible
- Collapsed branches auto-expand to show current node

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous node (when panel open) |
| `→` | Next node (when panel open) |
| `Escape` | Close info panel (existing) |

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| At first node | Prev disabled, Next works |
| At last node | Next disabled, Prev works |
| Empty tree | Nav bar hidden |
| Single node | Shows "1 of 1", both disabled |
| Node deleted | Jump to next (or prev if at end) |
| Sort/filter changes | Rebuild list, stay on current node |

## State

- **Read mode preference**: Saved to localStorage
- **Navigation position**: Not saved (starts fresh each session)

## Scope Limits

- Nav controls only in Tree View (not Canvas/3D)
- Info panel still opens in other views, but no nav bar

## Implementation Notes

### Key Functions to Add

```javascript
// Flatten tree into linear node list
function getLinearNodeList() { ... }

// Navigate to node by index
function navigateToNode(index) { ... }

// Render nav bar in info panel
function renderNavBar(currentIndex, totalCount) { ... }

// Toggle read mode
function toggleReadMode() { ... }
```

### Files to Modify

- `treeplexity.html`:
  - Add nav bar HTML to info panel
  - Add CSS for nav bar and read mode
  - Add keyboard event listeners
  - Add navigation state management
  - Modify `showInfo()` to include nav
