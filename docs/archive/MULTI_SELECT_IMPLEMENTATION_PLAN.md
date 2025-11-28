# Multi-Select & Group Drag Implementation Plan

## Overview
Implement Ctrl+Click multi-select and group drag for Canvas View to enable users to select and move multiple nodes simultaneously.

---

## Feature 1: Ctrl+Click Multi-Select

### Current Behavior
```javascript
// Line 4595 - Canvas node click handler
node.addEventListener('click', (e) => {
    // Set as active node
    activeNode = item;

    // Highlight selected node - CLEARS ALL OTHER SELECTIONS
    document.querySelectorAll('.canvas-node').forEach(n => n.classList.remove('selected'));
    node.classList.add('selected');  // ❌ Always clears other selections

    // ... expand/collapse or show info
});
```

### Required Changes

#### 1.1 Modify Click Handler to Support Ctrl+Click
**Location:** `treeplexity.html` line 4595

**Logic:**
```javascript
node.addEventListener('click', (e) => {
    e.stopPropagation();

    // CTRL+CLICK: Toggle selection (add/remove from selectedNodes)
    if (e.ctrlKey || e.metaKey) {
        // Check if already selected
        const index = selectedNodes.indexOf(item);

        if (index > -1) {
            // Already selected - DESELECT
            selectedNodes.splice(index, 1);
            node.classList.remove('selected');
            console.log(`Deselected: ${item.name}. Now ${selectedNodes.length} selected.`);
        } else {
            // Not selected - ADD TO SELECTION
            selectedNodes.push(item);
            node.classList.add('selected');
            console.log(`Selected: ${item.name}. Now ${selectedNodes.length} selected.`);
        }

        // Set most recently clicked as activeNode
        activeNode = item;

    } else {
        // NORMAL CLICK: Clear all selections and select only this node

        // Clear all selections
        selectedNodes = [];
        document.querySelectorAll('.canvas-node').forEach(n => n.classList.remove('selected'));

        // Select this node
        activeNode = item;
        selectedNodes = [item];
        node.classList.add('selected');

        // Existing expand/collapse or show info logic
        const hasChildren = (item.subItems && item.subItems.length > 0) ||
                          (item.children && item.children.length > 0);

        if (hasChildren) {
            item.expanded = !item.expanded;
            console.log('Toggling expand for:', item.name, 'expanded:', item.expanded);
            renderCanvas();
        } else {
            if (typeof showInfo === 'function') {
                console.log('Calling TreeListy showInfo function');
                showInfo(item);
            }
        }
    }
});
```

#### 1.2 Visual Feedback Enhancement
**Add CSS for multi-selected nodes:**
```css
.canvas-node.selected {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.6);  /* Blue glow */
    border: 2px solid #6366f1;
}

.canvas-node.selected::before {
    content: '✓';
    position: absolute;
    top: -8px;
    right: -8px;
    background: #6366f1;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
}
```

#### 1.3 Clear Selection on Empty Space Click
**Location:** Line 5317 (already exists, just verify it works)
```javascript
// Clear selection when clicking on empty space
if (selectedNodes.length > 0 && !e.ctrlKey) {
    clearSelection();  // ✅ Already implemented
}
```

#### 1.4 Add Selection Counter UI
**Add to Canvas View header:**
```html
<div id="selection-counter" style="display: none; position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: rgba(99, 102, 241, 0.9); color: white; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 1000;">
    <span id="selection-count">0</span> nodes selected
</div>
```

**Update counter when selection changes:**
```javascript
function updateSelectionCounter() {
    const counter = document.getElementById('selection-counter');
    const count = document.getElementById('selection-count');

    if (selectedNodes.length > 1) {
        count.textContent = selectedNodes.length;
        counter.style.display = 'block';
    } else {
        counter.style.display = 'none';
    }
}
```

### Edge Cases to Handle

1. **Selecting across different node types:**
   - Allow selecting phases, items, and subtasks together
   - No restrictions on node type mixing

2. **Double-click with selection:**
   - Double-click should open edit dialog for that node
   - Don't clear selection on double-click

3. **Expand/collapse with Ctrl+Click:**
   - Ctrl+Click should NOT expand/collapse
   - Only add to selection

4. **Keyboard shortcuts:**
   - Ctrl+A: Select all visible nodes
   - Escape: Clear selection

---

## Feature 2: Group Drag

### Current Behavior (Infrastructure Exists)
```javascript
// Line 4000 - Variables already exist
let selectedNodes = [];
let isDraggingSelection = false;

// Line 5361 - Group drag logic already coded
if (isDraggingSelection && selectedNodes.length > 0) {
    selectedNodes.forEach(nodeData => {
        // Move all nodes together
        nodeData.canvasX = newX + (nodeData.canvasX - startX);
        nodeData.canvasY = newY + (nodeData.canvasY - startY);
    });
}
```

**Problem:** No way to trigger `isDraggingSelection = true` because multi-select doesn't exist.

### Required Changes

#### 2.1 Detect Group Drag Start
**Location:** Mousedown handler (around line 4673)

**Logic:**
```javascript
node.addEventListener('mousedown', (e) => {
    // Middle-click handling (existing)
    if (e.button === 1) {
        // ... existing middle-click code
        return;
    }

    // Left-click drag handling
    if (e.button === 0) {
        e.preventDefault();
        e.stopPropagation();

        // Check if this node is part of a multi-selection
        if (selectedNodes.length > 1 && selectedNodes.includes(item)) {
            // DRAGGING A GROUP
            isDraggingSelection = true;
            console.log(`Starting group drag: ${selectedNodes.length} nodes`);

            // Store initial positions for all selected nodes
            selectedNodes.forEach(nodeData => {
                nodeData._dragStartX = nodeData.canvasX;
                nodeData._dragStartY = nodeData.canvasY;
            });
        } else {
            // DRAGGING SINGLE NODE (existing behavior)
            isDraggingCanvasNode = true;
            draggedCanvasNode = item;
        }

        // Store mouse start position
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        node.classList.add('dragging');
    }
});
```

#### 2.2 Update Mousemove Handler for Group Drag
**Location:** Mousemove handler (around line 5360)

**Already implemented! Just needs to be triggered:**
```javascript
// Line 5361-5369 - Already exists
if (isDraggingSelection && selectedNodes.length > 0) {
    const deltaX = (e.clientX - dragStartX) / currentZoom;
    const deltaY = (e.clientY - dragStartY) / currentZoom;

    selectedNodes.forEach(nodeData => {
        let newX = nodeData._dragStartX + deltaX;
        let newY = nodeData._dragStartY + deltaY;

        // Apply grid snapping if enabled
        if (gridEnabled) {
            newX = snapToGrid(newX);
            newY = snapToGrid(newY);
        }

        nodeData.canvasX = newX;
        nodeData.canvasY = newY;
    });

    renderCanvas();
}
```

#### 2.3 Update Mouseup Handler for Group Drag
**Location:** Mouseup handler (around line 5511)

**Logic:**
```javascript
container.addEventListener('mouseup', (e) => {
    // Handle group drag end
    if (isDraggingSelection) {
        isDraggingSelection = false;
        console.log('Group drag complete');

        // Save to undo stack
        if (typeof saveState === 'function') {
            saveState();
        }

        // Clean up temp drag positions
        selectedNodes.forEach(nodeData => {
            delete nodeData._dragStartX;
            delete nodeData._dragStartY;
        });
    }

    // Handle single node drag end
    if (isDraggingCanvasNode || draggedCanvasNode) {
        // ... existing single drag cleanup
    }
});
```

#### 2.4 Visual Feedback During Group Drag
**Add semi-transparent overlay to show group:**
```css
.canvas-node.dragging-group {
    opacity: 0.7;
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.8);
}
```

**Apply during drag:**
```javascript
if (isDraggingSelection) {
    selectedNodes.forEach(nodeData => {
        const nodeEl = document.querySelector(`[data-node-id="${nodeData.id}"]`);
        if (nodeEl) {
            nodeEl.classList.add('dragging-group');
        }
    });
}
```

### Edge Cases to Handle

1. **Grid snapping for groups:**
   - Snap based on the dragged node (the one mouse is on)
   - Other nodes maintain relative positions

2. **Undo for group moves:**
   - Capture all node positions before drag starts
   - Single undo should restore entire group

3. **Dragging outside viewport:**
   - Auto-pan canvas if dragging near edges
   - Or constrain group to visible area

4. **Dependencies during group drag:**
   - Don't recalculate dependency arrows during drag (performance)
   - Recalculate once on mouseup

5. **Phase boundaries:**
   - Allow dragging across phase zones
   - Don't change phase membership (canvasX/Y are visual only)

---

## Implementation Order

### Phase 1: Multi-Select (Foundation)
1. ✅ Modify click handler to check `e.ctrlKey`
2. ✅ Toggle selection on Ctrl+Click
3. ✅ Maintain `selectedNodes` array
4. ✅ Add visual feedback (selected class, checkmark)
5. ✅ Add selection counter UI
6. ✅ Handle clear selection on empty space click
7. ✅ Test: Select multiple nodes, deselect, clear selection

### Phase 2: Group Drag (Builds on Multi-Select)
1. ✅ Detect group drag start (if clicking selected node in multi-selection)
2. ✅ Set `isDraggingSelection = true`
3. ✅ Use existing group drag logic in mousemove handler
4. ✅ Clean up on mouseup
5. ✅ Add visual feedback during drag
6. ✅ Save to undo stack
7. ✅ Test: Select 3+ nodes, drag together, undo

### Phase 3: Polish & Edge Cases
1. ✅ Add Ctrl+A (select all visible nodes)
2. ✅ Add Escape (clear selection)
3. ✅ Ensure double-click works with selection
4. ✅ Test grid snapping with groups
5. ✅ Performance test with 20+ selected nodes

---

## Testing Checklist

### Multi-Select Tests
- [ ] Ctrl+Click on node adds to selection
- [ ] Ctrl+Click on selected node removes from selection
- [ ] Normal click clears selection and selects only clicked node
- [ ] Click empty space clears selection
- [ ] Selection counter shows correct count
- [ ] Visual feedback (blue glow, checkmark) appears on selected nodes
- [ ] Can select different node types together (phases, items, subtasks)
- [ ] Ctrl+A selects all visible nodes
- [ ] Escape clears selection
- [ ] Double-click on selected node opens edit (doesn't clear selection)

### Group Drag Tests
- [ ] Dragging a selected node in multi-selection moves entire group
- [ ] Nodes maintain relative positions during drag
- [ ] Grid snapping works for entire group
- [ ] Undo restores entire group to original positions
- [ ] Visual feedback (opacity, glow) during drag
- [ ] Dependency arrows update after drag complete
- [ ] Performance acceptable with 10+ selected nodes
- [ ] Can drag group across phase zones
- [ ] Dragging outside viewport doesn't break layout

---

## Code Locations Reference

- **Click handler:** Line 4595
- **Mousedown handler:** Line 4673
- **Mousemove handler:** Line 5360
- **Mouseup handler:** Line 5511
- **Clear selection:** Line 5317
- **selectedNodes array:** Line 4000
- **isDraggingSelection flag:** Line 4001
- **Group drag logic:** Line 5361-5369

---

## Estimated Complexity

- **Ctrl+Click Multi-Select:** LOW
  - Click handler modification: 20 lines
  - Visual feedback CSS: 15 lines
  - Selection counter: 30 lines
  - Total: ~65 lines of code

- **Group Drag:** MEDIUM
  - Mousedown logic: 25 lines
  - Mousemove logic: Already exists, just enable it
  - Mouseup logic: 15 lines
  - Visual feedback: 10 lines
  - Total: ~50 lines of code (most already exists!)

**Total New Code:** ~115 lines
**Total Modified Code:** ~30 lines

---

## Risks & Mitigation

### Risk 1: Performance with Large Selections
**Mitigation:**
- Limit selection to 50 nodes max
- Show warning if selecting more than 20 nodes
- Debounce rendering during group drag

### Risk 2: Undo Complexity
**Mitigation:**
- Use existing `saveState()` function
- Capture single snapshot before drag starts
- Test thoroughly with undo/redo

### Risk 3: Dependency Arrow Rendering
**Mitigation:**
- Don't recalculate arrows during drag
- Single recalculation on mouseup
- Consider toggle to hide arrows during complex selections

---

## Future Enhancements (Out of Scope for Build 139)

1. **Shift+Click Range Select**
   - Select all nodes between first and last clicked
   - Useful for selecting contiguous nodes

2. **Rubber-Band Selection**
   - Drag rectangle on empty space to select multiple nodes
   - Common in design tools (Figma, Sketch)

3. **Invert Selection**
   - Ctrl+Shift+A to invert current selection

4. **Save Selection Sets**
   - Name and save selection groups
   - Quick recall of common selections

5. **Align & Distribute**
   - Align selected nodes (left, center, right, top, middle, bottom)
   - Distribute evenly (horizontal, vertical)

---

## Success Criteria

✅ **Multi-Select:**
- User can Ctrl+Click to add/remove nodes from selection
- Selection count shows accurate number
- Visual feedback is clear and professional
- Works reliably with 20+ nodes

✅ **Group Drag:**
- User can drag multiple selected nodes together
- Relative positions maintained
- Grid snapping works for entire group
- Undo restores entire group
- No performance degradation with 10 selected nodes

✅ **Overall:**
- No regressions in single-node drag
- No regressions in expand/collapse
- No regressions in zoom/pan
- Documentation updated in welcome tree
