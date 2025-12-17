# Phase 5: Minimap Drag-to-Pan Implementation Plan

**Date**: 2025-12-17
**Target Build**: 436
**Estimated Lines**: ~60-80 lines
**Depends On**: Phase 2 (Minimap) - Completed in Build 435

---

## Overview

Add drag interaction to the minimap viewport indicator, allowing users to drag the viewport rectangle to pan the canvas view in real-time. This is a common UX pattern in design tools (Figma, Adobe, GoJS).

---

## Current State (Build 435)

The minimap currently supports:
- Bird's-eye view rendering of all canvas nodes
- **Click-to-pan**: Click anywhere on minimap to center view there
- **Viewport indicator**: White border rectangle showing current visible area

**Missing**: Ability to drag the viewport indicator to pan.

---

## Implementation

### 1. State Variables

**Location**: After `minimapBounds` declaration (line ~16232)

```javascript
// Minimap drag state
let minimapDragging = false;
let minimapDragStart = { x: 0, y: 0 };
let minimapDragPanStart = { x: 0, y: 0 };
```

### 2. CSS Enhancement

**Location**: After `.minimap-viewport` styles (line ~7234)

```css
.minimap-viewport {
    /* ... existing styles ... */
    cursor: grab;
}

.minimap-viewport.dragging {
    cursor: grabbing;
}

.canvas-minimap.dragging {
    user-select: none;
}
```

### 3. Drag Event Handlers

**Location**: Inside `initMinimap()` function, after the click handler (line ~16369)

```javascript
// Viewport drag to pan
const viewport = document.getElementById('minimap-viewport');
if (viewport) {
    viewport.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Don't trigger minimap click
        minimapDragging = true;
        minimapDragStart = { x: e.clientX, y: e.clientY };
        minimapDragPanStart = { x: canvasPan.x, y: canvasPan.y };
        viewport.classList.add('dragging');
        minimap.classList.add('dragging');
    });
}

document.addEventListener('mousemove', (e) => {
    if (!minimapDragging) return;

    // Calculate delta in minimap pixels
    const deltaX = e.clientX - minimapDragStart.x;
    const deltaY = e.clientY - minimapDragStart.y;

    // Convert minimap delta to canvas delta
    // Moving viewport right = panning canvas left (negative)
    const canvasDeltaX = -deltaX / minimapScale;
    const canvasDeltaY = -deltaY / minimapScale;

    // Apply pan (scaled by zoom)
    canvasPan.x = minimapDragPanStart.x + canvasDeltaX * canvasZoom;
    canvasPan.y = minimapDragPanStart.y + canvasDeltaY * canvasZoom;

    updateCanvasTransform();
});

document.addEventListener('mouseup', () => {
    if (minimapDragging) {
        minimapDragging = false;
        const viewport = document.getElementById('minimap-viewport');
        const minimap = document.getElementById('canvas-minimap');
        if (viewport) viewport.classList.remove('dragging');
        if (minimap) minimap.classList.remove('dragging');
    }
});
```

### 4. Prevent Click During Drag

**Location**: Modify existing click handler in `initMinimap()` (line ~16347)

```javascript
// Click to navigate (but not during drag)
minimap.addEventListener('click', (e) => {
    // Ignore if we just finished dragging
    if (minimapDragging) return;

    // ... rest of existing click handler
});
```

---

## Integration Points

| File | Line | Change |
|------|------|--------|
| treeplexity.html | ~7234 | Add `.minimap-viewport` cursor styles |
| treeplexity.html | ~16232 | Add drag state variables |
| treeplexity.html | ~16347 | Guard click handler against drag |
| treeplexity.html | ~16369 | Add viewport drag handlers |

---

## Verification Checklist

### Manual Testing
- [ ] Drag viewport - canvas pans in real-time
- [ ] Drag direction correct (drag right = view moves right)
- [ ] Cursor changes to grabbing during drag
- [ ] Click on minimap (not viewport) still works
- [ ] Drag + click don't conflict
- [ ] Release drag outside minimap works correctly
- [ ] Viewport position updates smoothly during drag

### E2E Tests (console-errors.spec.js)
- [ ] No console errors during minimap drag operations

### Unit Tests
- [ ] All 335 existing tests still pass

---

## Code Insertion Points (Exact)

### CSS Addition
**Insert after line 7233** (after `.minimap-viewport` closing brace):

```css
.minimap-viewport:hover {
    cursor: grab;
}

.minimap-viewport.dragging {
    cursor: grabbing;
}

.canvas-minimap.dragging {
    user-select: none;
}
```

### State Variables
**Insert after line 16232** (after `let minimapBounds = ...`):

```javascript
// BUILD 436: Minimap drag state
let minimapDragging = false;
let minimapDragStart = { x: 0, y: 0 };
let minimapDragPanStart = { x: 0, y: 0 };
```

### Click Handler Guard
**Modify line 16347** (start of click handler):

```javascript
// Click to navigate (but not during drag)
minimap.addEventListener('click', (e) => {
    if (minimapDragging) return; // Skip if just finished dragging

    const rect = minimap.getBoundingClientRect();
    // ... rest unchanged
```

### Drag Handlers
**Insert after line 16371** (after `console.log('... minimap initialized')`):

```javascript
// BUILD 436: Viewport drag to pan
const viewport = document.getElementById('minimap-viewport');
if (viewport) {
    viewport.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        minimapDragging = true;
        minimapDragStart = { x: e.clientX, y: e.clientY };
        minimapDragPanStart = { x: canvasPan.x, y: canvasPan.y };
        viewport.classList.add('dragging');
        minimap.classList.add('dragging');
    });
}

document.addEventListener('mousemove', (e) => {
    if (!minimapDragging) return;

    const deltaX = e.clientX - minimapDragStart.x;
    const deltaY = e.clientY - minimapDragStart.y;

    // Convert minimap delta to canvas delta (inverted for natural feel)
    const canvasDeltaX = -deltaX / minimapScale;
    const canvasDeltaY = -deltaY / minimapScale;

    canvasPan.x = minimapDragPanStart.x + canvasDeltaX * canvasZoom;
    canvasPan.y = minimapDragPanStart.y + canvasDeltaY * canvasZoom;

    updateCanvasTransform();
});

document.addEventListener('mouseup', () => {
    if (minimapDragging) {
        minimapDragging = false;
        const vp = document.getElementById('minimap-viewport');
        const mm = document.getElementById('canvas-minimap');
        if (vp) vp.classList.remove('dragging');
        if (mm) mm.classList.remove('dragging');
    }
});
```

---

## Version Bump

Update 4 locations for Build 436:
1. Header comment (line ~9)
2. Changelog (line ~21)
3. TREELISTY_VERSION.build (line ~681)
4. KNOWN_LATEST (line ~54512)

---

## Commit Message Template

```
Build 436: Minimap Drag-to-Pan

Phase 5 of Canvas Enhancements:
- Drag viewport indicator to pan canvas view
- Real-time pan updates during drag
- Cursor feedback (grab/grabbing)
- Click-to-navigate still works alongside drag

~60 lines added
All 335 unit tests pass
```

---

## Risk Assessment

**Low Risk**:
- Additive changes only
- No modification to existing pan/zoom logic
- Clear separation from click handler

**Testing Priority**:
1. Drag direction feels natural (viewport moves = canvas moves same direction)
2. No conflicts with existing click handler
3. Clean release on mouseup outside minimap
