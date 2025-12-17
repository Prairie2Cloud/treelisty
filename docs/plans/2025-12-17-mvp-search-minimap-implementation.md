# MVP Implementation Plan: Search + Minimap

**Date**: 2025-12-17
**Status**: Ready for Implementation
**Scope**: Phases 1-2 of Canvas Enhancements Design
**Estimated**: ~300-400 lines of new code

---

## Overview

This plan implements the **MVP features** from the Canvas Enhancements design:
1. **Search Overlay** (Ctrl+F) with zoom-to-node
2. **Minimap** with click-to-navigate

Both features are **standalone additions** - no existing code is modified, only extended.

---

## Prerequisites

Before starting, verify these exist (all confirmed):

| Component | Location | Purpose |
|-----------|----------|---------|
| `canvasNodes` | Line 12029 | Array of `{ element, data, phase }` |
| `canvasPan` / `canvasZoom` | Lines 12030-12031 | Current pan/zoom state |
| `updateCanvasTransform()` | Line 15732 | Applies transform to canvas |
| `fitToView()` | Line 15767 | Calculates bounding box |
| `searchNodes()` | Line 25414 | Tree View search (can reuse pattern) |

---

## Phase 1: Search Overlay

### 1.1 HTML - Add Search Overlay Container

**Insert after line 54924** (inside `canvas-container`, after toolbar):

```html
<!-- Canvas Search Overlay (Ctrl+F) -->
<div id="canvas-search-overlay" class="canvas-search-overlay" style="display: none;">
  <div class="canvas-search-box">
    <input type="text" id="canvas-search-input" placeholder="Search nodes... (Esc to close)" autocomplete="off">
    <span id="canvas-search-count" class="canvas-search-count"></span>
    <button id="canvas-search-prev" class="canvas-search-nav" title="Previous (Shift+Enter)">▲</button>
    <button id="canvas-search-next" class="canvas-search-nav" title="Next (Enter)">▼</button>
    <button id="canvas-search-close" class="canvas-search-close" title="Close (Esc)">✕</button>
  </div>
  <div id="canvas-search-results" class="canvas-search-results"></div>
</div>
```

### 1.2 CSS - Search Overlay Styles

**Insert in the `<style>` section** (around line 6900, after other canvas styles):

```css
/* Canvas Search Overlay */
.canvas-search-overlay {
  position: absolute;
  top: 70px;
  right: 20px;
  z-index: 250;
  background: rgba(20, 20, 30, 0.98);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  padding: 12px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.canvas-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canvas-search-overlay input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  background: rgba(30, 30, 40, 0.8);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.canvas-search-overlay input:focus {
  border-color: rgba(99, 102, 241, 0.6);
}

.canvas-search-count {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.canvas-search-nav,
.canvas-search-close {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.2);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
}

.canvas-search-nav:hover,
.canvas-search-close:hover {
  background: rgba(99, 102, 241, 0.4);
}

.canvas-search-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.canvas-search-results {
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
}

.canvas-search-result {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.canvas-search-result:hover {
  background: rgba(99, 102, 241, 0.2);
}

.canvas-search-result.active {
  background: rgba(99, 102, 241, 0.3);
  border-left: 3px solid var(--accent-primary);
}

.canvas-search-result-icon {
  font-size: 16px;
}

.canvas-search-result-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-search-result-phase {
  font-size: 11px;
  color: var(--text-secondary);
}

/* Highlight ring on searched node */
.canvas-node.search-highlight {
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.6), 0 0 20px rgba(99, 102, 241, 0.4) !important;
  animation: search-pulse 1s ease-out;
}

@keyframes search-pulse {
  0% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

### 1.3 JavaScript - Search Functions

**Insert after `fitToView()` function** (around line 15800):

```javascript
// =============================================================================
// CANVAS SEARCH (Ctrl+F)
// =============================================================================

let canvasSearchState = {
  isOpen: false,
  results: [],
  currentIndex: -1,
  query: ''
};

function openCanvasSearch() {
  if (viewMode !== 'canvas') return;

  const overlay = document.getElementById('canvas-search-overlay');
  const input = document.getElementById('canvas-search-input');

  overlay.style.display = 'block';
  canvasSearchState.isOpen = true;
  input.value = canvasSearchState.query; // Preserve last search
  input.focus();
  input.select();
}

function closeCanvasSearch() {
  const overlay = document.getElementById('canvas-search-overlay');
  overlay.style.display = 'none';
  canvasSearchState.isOpen = false;

  // Clear highlight from current result
  clearSearchHighlight();
}

function clearSearchHighlight() {
  document.querySelectorAll('.canvas-node.search-highlight').forEach(el => {
    el.classList.remove('search-highlight');
  });
}

function performCanvasSearch(query) {
  canvasSearchState.query = query;
  canvasSearchState.results = [];
  canvasSearchState.currentIndex = -1;

  const resultsContainer = document.getElementById('canvas-search-results');
  const countEl = document.getElementById('canvas-search-count');

  if (!query.trim()) {
    resultsContainer.innerHTML = '';
    countEl.textContent = '';
    clearSearchHighlight();
    return;
  }

  const lowerQuery = query.toLowerCase();

  // Search through canvasNodes (only nodes visible in Canvas View)
  canvasNodes.forEach(({ data, phase }) => {
    const nameMatch = (data.name || '').toLowerCase().includes(lowerQuery);
    const descMatch = (data.description || '').toLowerCase().includes(lowerQuery);
    const notesMatch = (data.notes || '').toLowerCase().includes(lowerQuery);

    if (nameMatch || descMatch || notesMatch) {
      canvasSearchState.results.push({
        node: data,
        phase: phase,
        matchType: nameMatch ? 'name' : (descMatch ? 'description' : 'notes')
      });
    }
  });

  // Update count
  const count = canvasSearchState.results.length;
  countEl.textContent = count > 0 ? `${count} found` : 'No results';

  // Render results list
  resultsContainer.innerHTML = canvasSearchState.results.map((result, idx) => `
    <div class="canvas-search-result" data-index="${idx}" onclick="selectSearchResult(${idx})">
      <span class="canvas-search-result-icon">${getNodeIcon(result.node)}</span>
      <span class="canvas-search-result-name">${escapeHtml(result.node.name || 'Untitled')}</span>
      <span class="canvas-search-result-phase">${escapeHtml(result.phase?.name || '')}</span>
    </div>
  `).join('');

  // Auto-select first result
  if (count > 0) {
    selectSearchResult(0);
  }
}

function selectSearchResult(index) {
  if (index < 0 || index >= canvasSearchState.results.length) return;

  canvasSearchState.currentIndex = index;
  const result = canvasSearchState.results[index];

  // Update active state in results list
  document.querySelectorAll('.canvas-search-result').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });

  // Zoom to node
  zoomToNode(result.node);

  // Highlight the node
  highlightSearchResult(result.node);
}

function zoomToNode(node) {
  const container = document.getElementById('canvas-container');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // Target zoom level (close enough to see detail but not too close)
  const targetZoom = Math.min(canvasZoom * 1.5, 1.2);

  // Calculate pan to center the node
  const nodeX = node.canvasX + 160; // Center of node (320px width / 2)
  const nodeY = node.canvasY + 60;  // Center of node (120px height / 2)

  // Animate to position
  animateCanvasTo({
    zoom: targetZoom,
    panX: containerWidth / 2 - nodeX * targetZoom,
    panY: containerHeight / 2 - nodeY * targetZoom
  });
}

function animateCanvasTo({ zoom, panX, panY, duration = 300 }) {
  const startZoom = canvasZoom;
  const startPanX = canvasPan.x;
  const startPanY = canvasPan.y;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);

    canvasZoom = startZoom + (zoom - startZoom) * eased;
    canvasPan.x = startPanX + (panX - startPanX) * eased;
    canvasPan.y = startPanY + (panY - startPanY) * eased;

    updateCanvasTransform();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function highlightSearchResult(node) {
  clearSearchHighlight();

  const nodeEl = canvasNodes.find(n => n.data.id === node.id)?.element;
  if (nodeEl) {
    nodeEl.classList.add('search-highlight');

    // Auto-remove highlight after 3 seconds
    setTimeout(() => {
      nodeEl.classList.remove('search-highlight');
    }, 3000);
  }
}

function navigateSearchResults(direction) {
  const count = canvasSearchState.results.length;
  if (count === 0) return;

  let newIndex = canvasSearchState.currentIndex + direction;
  if (newIndex < 0) newIndex = count - 1;
  if (newIndex >= count) newIndex = 0;

  selectSearchResult(newIndex);

  // Scroll result into view
  const resultEl = document.querySelector(`.canvas-search-result[data-index="${newIndex}"]`);
  resultEl?.scrollIntoView({ block: 'nearest' });
}

function getNodeIcon(node) {
  // Reuse existing icon logic or simplify
  if (node.subItems?.length > 0 || node.children?.length > 0) return '📁';
  if (node.pmStatus === 'complete') return '✅';
  if (node.pmStatus === 'in-progress') return '🔄';
  return '📄';
}

// Initialize search event listeners
function initCanvasSearch() {
  const input = document.getElementById('canvas-search-input');
  const prevBtn = document.getElementById('canvas-search-prev');
  const nextBtn = document.getElementById('canvas-search-next');
  const closeBtn = document.getElementById('canvas-search-close');

  if (!input) return; // Not in DOM yet

  // Live search on input
  input.addEventListener('input', (e) => {
    performCanvasSearch(e.target.value);
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateSearchResults(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      closeCanvasSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateSearchResults(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateSearchResults(-1);
    }
  });

  // Button handlers
  prevBtn?.addEventListener('click', () => navigateSearchResults(-1));
  nextBtn?.addEventListener('click', () => navigateSearchResults(1));
  closeBtn?.addEventListener('click', closeCanvasSearch);
}

// Call after DOM ready (add to existing DOMContentLoaded handler)
// initCanvasSearch();
```

### 1.4 Keyboard Shortcut Integration

**Find the global keydown handler** (around line 17057) and add:

```javascript
// Inside the existing keydown handler, add this case:
if ((e.ctrlKey || e.metaKey) && e.key === 'f' && viewMode === 'canvas') {
  e.preventDefault();
  openCanvasSearch();
  return;
}
```

### 1.5 Initialize on Load

**In the DOMContentLoaded handler** (or switchView for canvas), add:

```javascript
initCanvasSearch();
```

---

## Phase 2: Minimap

### 2.1 HTML - Add Minimap Container

**Insert after the search overlay** (inside `canvas-container`):

```html
<!-- Canvas Minimap -->
<div id="canvas-minimap" class="canvas-minimap">
  <canvas id="minimap-canvas" width="200" height="150"></canvas>
  <div id="minimap-viewport" class="minimap-viewport"></div>
</div>
```

### 2.2 CSS - Minimap Styles

**Add to the styles section**:

```css
/* Canvas Minimap */
.canvas-minimap {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 200px;
  height: 150px;
  background: rgba(20, 20, 30, 0.95);
  border: 2px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  overflow: hidden;
  z-index: 200;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.canvas-minimap:hover {
  border-color: rgba(99, 102, 241, 0.5);
}

#minimap-canvas {
  width: 100%;
  height: 100%;
}

.minimap-viewport {
  position: absolute;
  border: 2px solid rgba(99, 102, 241, 0.8);
  background: rgba(99, 102, 241, 0.1);
  pointer-events: none;
  transition: all 0.1s ease;
}

/* Hide minimap on small screens */
@media (max-width: 768px) {
  .canvas-minimap {
    display: none;
  }
}
```

### 2.3 JavaScript - Minimap Functions

**Insert after the search functions**:

```javascript
// =============================================================================
// CANVAS MINIMAP
// =============================================================================

const minimapConfig = {
  width: 200,
  height: 150,
  padding: 10,
  nodeColor: 'rgba(99, 102, 241, 0.6)',
  selectedColor: 'rgba(234, 179, 8, 0.8)',
  connectionColor: 'rgba(99, 102, 241, 0.3)',
  backgroundColor: 'rgba(30, 30, 40, 0.8)'
};

let minimapScale = 1;
let minimapBounds = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };

function updateMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  if (!canvas || viewMode !== 'canvas') return;

  const ctx = canvas.getContext('2d');
  const { width, height, padding } = minimapConfig;

  // Clear canvas
  ctx.fillStyle = minimapConfig.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (canvasNodes.length === 0) return;

  // Calculate bounds of all nodes
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  canvasNodes.forEach(({ data }) => {
    minX = Math.min(minX, data.canvasX);
    minY = Math.min(minY, data.canvasY);
    maxX = Math.max(maxX, data.canvasX + 320);
    maxY = Math.max(maxY, data.canvasY + 120);
  });

  // Add padding
  minX -= padding * 10;
  minY -= padding * 10;
  maxX += padding * 10;
  maxY += padding * 10;

  minimapBounds = { minX, minY, maxX, maxY };

  // Calculate scale to fit all nodes
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const scaleX = (width - padding * 2) / contentWidth;
  const scaleY = (height - padding * 2) / contentHeight;
  minimapScale = Math.min(scaleX, scaleY);

  // Transform function
  const toMinimap = (x, y) => ({
    x: padding + (x - minX) * minimapScale,
    y: padding + (y - minY) * minimapScale
  });

  // Draw connections first (behind nodes)
  ctx.strokeStyle = minimapConfig.connectionColor;
  ctx.lineWidth = 1;
  canvasNodes.forEach(({ data }) => {
    if (data.dependencies?.length > 0) {
      data.dependencies.forEach(depId => {
        const depIdNormalized = typeof depId === 'string' ? depId : depId.predecessorId;
        const depNode = canvasNodes.find(n => n.data.id === depIdNormalized);
        if (depNode) {
          const from = toMinimap(depNode.data.canvasX + 160, depNode.data.canvasY + 60);
          const to = toMinimap(data.canvasX + 160, data.canvasY + 60);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      });
    }
  });

  // Draw nodes
  canvasNodes.forEach(({ data }) => {
    const pos = toMinimap(data.canvasX, data.canvasY);
    const nodeWidth = 320 * minimapScale;
    const nodeHeight = 120 * minimapScale;

    // Check if selected
    const isSelected = selectedNodes.some(n => n.id === data.id);
    ctx.fillStyle = isSelected ? minimapConfig.selectedColor : minimapConfig.nodeColor;

    ctx.fillRect(pos.x, pos.y, Math.max(nodeWidth, 4), Math.max(nodeHeight, 3));
  });

  // Update viewport indicator
  updateMinimapViewport();
}

function updateMinimapViewport() {
  const viewport = document.getElementById('minimap-viewport');
  const container = document.getElementById('canvas-container');
  if (!viewport || !container) return;

  const { minX, minY, maxX, maxY } = minimapBounds;
  const { padding } = minimapConfig;

  // Current visible area in canvas coordinates
  const visibleLeft = -canvasPan.x / canvasZoom;
  const visibleTop = -canvasPan.y / canvasZoom;
  const visibleWidth = container.clientWidth / canvasZoom;
  const visibleHeight = container.clientHeight / canvasZoom;

  // Convert to minimap coordinates
  const left = padding + (visibleLeft - minX) * minimapScale;
  const top = padding + (visibleTop - minY) * minimapScale;
  const width = visibleWidth * minimapScale;
  const height = visibleHeight * minimapScale;

  viewport.style.left = `${Math.max(0, left)}px`;
  viewport.style.top = `${Math.max(0, top)}px`;
  viewport.style.width = `${Math.min(width, 200)}px`;
  viewport.style.height = `${Math.min(height, 150)}px`;
}

function initMinimap() {
  const minimap = document.getElementById('canvas-minimap');
  if (!minimap) return;

  // Click to navigate
  minimap.addEventListener('click', (e) => {
    const rect = minimap.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap click to canvas coordinates
    const { minX, minY } = minimapBounds;
    const { padding } = minimapConfig;

    const canvasX = minX + (clickX - padding) / minimapScale;
    const canvasY = minY + (clickY - padding) / minimapScale;

    // Pan to center this point
    const container = document.getElementById('canvas-container');
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    animateCanvasTo({
      zoom: canvasZoom, // Keep current zoom
      panX: centerX - canvasX * canvasZoom,
      panY: centerY - canvasY * canvasZoom
    });
  });

  // Initial render
  updateMinimap();
}

// Hook into existing render cycle
// Add to end of renderCanvas():
//   updateMinimap();

// Hook into zoom/pan changes
// Add to end of updateCanvasTransform():
//   updateMinimapViewport();
```

### 2.4 Integration Points

**In `renderCanvas()` (line 13056)**, add at the end before closing brace:

```javascript
// Update minimap after rendering
updateMinimap();
```

**In `updateCanvasTransform()` (line 15732)**, add at the end:

```javascript
// Update minimap viewport position
if (typeof updateMinimapViewport === 'function') {
  updateMinimapViewport();
}
```

**In DOMContentLoaded or switchView**, add:

```javascript
initMinimap();
```

---

## Verification Checklist

### Phase 1: Search

- [ ] Press Ctrl+F in Canvas View → overlay appears
- [ ] Type query → results filter live
- [ ] Click result → canvas zooms to node
- [ ] Enter/Arrow keys → navigate results
- [ ] Esc → closes overlay
- [ ] Node highlights with pulse animation
- [ ] Search persists when reopened
- [ ] Works with 100+ nodes (no lag)

### Phase 2: Minimap

- [ ] Minimap visible in bottom-right of Canvas View
- [ ] All nodes rendered as small rectangles
- [ ] Selected nodes highlighted in different color
- [ ] Dependency lines visible
- [ ] Viewport rectangle shows current view
- [ ] Click minimap → canvas pans to that location
- [ ] Viewport updates on pan/zoom
- [ ] Hidden on mobile (< 768px)

### Integration

- [ ] Search and Minimap don't conflict
- [ ] Both work after view switch (Tree → Canvas)
- [ ] Both work after node add/delete
- [ ] Performance: No visible lag on 150-node trees

---

## Build & Commit

After implementation:

```bash
# Update version in 4 locations (see CLAUDE.md)
# Build number: 435

git add treeplexity.html
git commit -m "Build 435: Canvas Search (Ctrl+F) + Minimap Navigation

MVP features from Canvas Enhancements design:

Search Overlay:
- Ctrl+F opens search in Canvas View
- Live filtering by name/description/notes
- Enter/Arrow to navigate results
- Zoom-to-node with highlight animation

Minimap:
- Bird's-eye view in bottom-right corner
- Click to pan to location
- Viewport indicator shows current view
- Dependency lines visible
- Auto-updates on render/zoom/pan

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push
```

---

## Files Modified

| File | Changes |
|------|---------|
| `treeplexity.html` | +300-400 lines (HTML, CSS, JS) |

**No other files affected.** This is a pure addition to the single-file app.
