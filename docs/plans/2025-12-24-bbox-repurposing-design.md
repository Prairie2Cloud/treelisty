# Bounding Box Repurposing for Structured Data

**Date:** 2025-12-24
**Status:** Bug + Design
**Priority:** High (affects external integrations like Prairie Sentinel)

---

## Bug Report

### Summary
URL imports incorrectly trigger image analysis, producing irrelevant bounding boxes from page decoration (photos, icons) instead of meaningful content structure.

### Reproduction
1. Import Prairie Sentinel dashboard URL into TreeListy
2. TreeListy captures screenshot of PS page
3. Image analysis runs, detecting "Man", "Face", "Yellow Lily", "Orange Gerbera" (decorative elements)
4. Canvas View shows these bboxes overlaid on intelligence nodes
5. User cannot click bboxes to get information
6. Bboxes provide zero value - actively confusing

### Expected Behavior
- URL imports should NOT auto-trigger pixel-based image analysis
- OR image analysis should detect content structure (cards, sections, data) not decorative images
- Bboxes should only appear when meaningful for the content type

### Screenshots
See: `D:\screenshots\Screenshot 2025-12-24 095836.png`

---

## Root Cause

The image analysis pipeline assumes all visual input is a "photo to decompose":
```
Input → Gemini Vision → Detect objects → Create nodes with bboxes
```

This works for:
- Photos (people, objects, scenes)
- Diagrams (flowcharts, architecture)
- UI mockups (buttons, forms, layouts)

This fails for:
- Dashboards (content is in DOM, not pixels)
- Structured data exports (PS, spreadsheets)
- Text-heavy pages (articles, docs)

---

## Proposed Fix: Two-Track Analysis

### Track 1: Pixel Analysis (Current)
For: Photos, diagrams, screenshots of visual content
```
Image → Gemini Vision → Object detection → Spatial bboxes
```

### Track 2: Semantic Analysis (New)
For: Structured data, dashboards, exports
```
Data → Schema detection → Importance scoring → Virtual bboxes
```

**Detection heuristic:**
```javascript
function shouldUsePixelAnalysis(source) {
  // Explicit image file
  if (source.type?.startsWith('image/')) return true;

  // Screenshot capture
  if (source.fromScreenCapture) return true;

  // URL with structured data indicators
  if (source.url) {
    const url = source.url.toLowerCase();
    // Known dashboard/API patterns
    if (url.includes('dashboard') ||
        url.includes('api') ||
        url.includes('functions')) {
      return false;  // Use semantic analysis
    }
  }

  // JSON import - never pixel analyze
  if (source.type === 'application/json') return false;

  // Default to pixel for unknown images
  return true;
}
```

---

## Bbox Repurposing for Structured Data

### Current Bbox Model (Image-Centric)
```javascript
node._bbox = {
  yMin: 234,    // Pixel coordinates (0-1000 normalized)
  xMin: 100,
  yMax: 456,
  xMax: 300
};
node._confidence = 0.95;
node._objectType = 'person';
```

### Proposed Bbox Model (Multi-Purpose)
```javascript
node._bbox = {
  // Spatial (for images)
  yMin: 234, xMin: 100, yMax: 456, xMax: 300,

  // OR Virtual (for structured data)
  virtual: true,
  dimension: 'importance',  // What the "size" represents
  value: 85,                // Score/metric driving size

  // Display hints
  color: '#ef4444',         // Override default color
  style: 'solid',           // solid | dashed | glow
  label: 'Critical',        // Override auto-label
};

node._confidence = 0.95;     // Detection confidence OR data certainty
node._objectType = 'intel';  // Semantic type, not visual type
```

---

## Virtual Bbox Layouts for PS Data

### Option A: Importance Grid
Nodes sized by score, arranged in grid:

```
┌─────────────────┐  ┌───────────┐  ┌─────┐
│ Anchor Data     │  │ PJM Queue │  │ SMR │
│ Score: 80       │  │ Score: 65 │  │  45 │
│ DECISION        │  │           │  │     │
└─────────────────┘  └───────────┘  └─────┘
     Large box          Medium       Small
```

### Option B: Timeline Strip
Nodes positioned by deadline urgency:

```
TODAY        THIS WEEK       LATER
  │              │             │
  ▼              ▼             ▼
┌────┐        ┌────┐       ┌────┐
│Dec │        │PJM │       │SMR │
│ 26 │        │mtg │       │    │
└────┘        └────┘       └────┘
```

### Option C: Quadrant Matrix
Two dimensions (urgency × importance):

```
        HIGH IMPORTANCE
             │
   ┌─────────┼─────────┐
   │ Anchor  │         │
   │ Data    │         │
───┼─────────┼─────────┼─── URGENT
   │         │ TD2     │
   │         │ recon   │
   └─────────┼─────────┘
             │
        LOW IMPORTANCE
```

---

## Implementation Plan

### Phase 1: Bug Fix (Immediate)
**Goal:** Stop irrelevant bboxes from appearing

```javascript
// In URL import handler
async function importFromURL(url) {
  const tree = await fetchAndParse(url);

  // Clear any image analysis metadata from structured imports
  if (isStructuredDataSource(url)) {
    delete tree._imageAnalysis;
    clearBboxesRecursive(tree);
  }

  loadTreeData(tree);
}

function isStructuredDataSource(url) {
  return url.includes('dashboard') ||
         url.includes('cloudfunctions.net') ||
         url.includes('api/') ||
         url.endsWith('.json');
}

function clearBboxesRecursive(node) {
  delete node._bbox;
  delete node._confidence;
  delete node._objectType;
  (node.children || []).forEach(clearBboxesRecursive);
  (node.items || []).forEach(clearBboxesRecursive);
  (node.subtasks || []).forEach(clearBboxesRecursive);
}
```

### Phase 2: Virtual Bboxes for PS (Short-term)
**Goal:** Make bboxes useful for structured data

```javascript
// PS export enhancement
function addVirtualBboxes(tree) {
  const intelligence = tree.children.find(c => c.id === 'phase-intelligence');
  if (!intelligence) return;

  intelligence.items.forEach((item, i) => {
    const score = item.pmProgress || 50;

    // Size based on score (0-100 → 50-200 width)
    const size = 50 + (score * 1.5);

    // Position in grid
    const col = i % 3;
    const row = Math.floor(i / 3);

    item._bbox = {
      virtual: true,
      dimension: 'importance',
      value: score,
      xMin: 100 + col * 250,
      yMin: 100 + row * 150,
      xMax: 100 + col * 250 + size,
      yMax: 100 + row * 150 + size * 0.6,
      style: item.pmPriority === 'Critical' ? 'glow' : 'solid',
      color: scoreToColor(score)
    };
  });

  // Mark as virtual layout
  tree._imageAnalysis = {
    virtual: true,
    layoutType: 'importance-grid',
    dimension: 'score'
  };
}

function scoreToColor(score) {
  if (score >= 80) return '#ef4444';  // Red - critical
  if (score >= 60) return '#f59e0b';  // Amber - high
  if (score >= 40) return '#10b981';  // Green - medium
  return '#6b7280';                    // Gray - low
}
```

### Phase 3: Canvas Renderer Update (Medium-term)
**Goal:** Render virtual bboxes differently than pixel bboxes

```javascript
function renderBboxOverlay(node, ctx) {
  if (!node._bbox) return;

  if (node._bbox.virtual) {
    // Virtual bbox - styled differently
    renderVirtualBbox(node, ctx);
  } else {
    // Pixel bbox - existing behavior
    renderPixelBbox(node, ctx);
  }
}

function renderVirtualBbox(node, ctx) {
  const bbox = node._bbox;

  ctx.strokeStyle = bbox.color || '#6366f1';
  ctx.lineWidth = 2;

  if (bbox.style === 'glow') {
    ctx.shadowColor = bbox.color;
    ctx.shadowBlur = 10;
  }

  // Rounded rect for virtual bboxes (distinguish from pixel bboxes)
  roundRect(ctx, bbox.xMin, bbox.yMin,
            bbox.xMax - bbox.xMin, bbox.yMax - bbox.yMin, 8);
  ctx.stroke();

  // Label with dimension value
  if (bbox.dimension && bbox.value !== undefined) {
    ctx.fillStyle = bbox.color;
    ctx.font = '12px system-ui';
    ctx.fillText(`${bbox.dimension}: ${bbox.value}`, bbox.xMin, bbox.yMin - 5);
  }
}
```

### Phase 4: Interactive Virtual Bboxes (Later)
**Goal:** Click virtual bbox to see details

```javascript
// Canvas click handler enhancement
function handleCanvasClick(e) {
  const pos = screenToCanvas(e);

  // Check virtual bboxes
  const hitNode = findNodeByVirtualBbox(pos);
  if (hitNode) {
    // Show contextual popup with dimension details
    showBboxPopup(hitNode, pos);
    return;
  }

  // Existing click handling...
}

function showBboxPopup(node, pos) {
  const bbox = node._bbox;

  const content = `
    <div class="bbox-popup">
      <h4>${node.name}</h4>
      <div class="dimension">
        ${bbox.dimension}: <strong>${bbox.value}</strong>
      </div>
      ${node.description ? `<p>${node.description.slice(0, 100)}...</p>` : ''}
    </div>
  `;

  showPopupAt(content, pos.x, pos.y);
}
```

---

## PS Export Update

Update the PS export to explicitly disable image analysis and optionally enable virtual bboxes:

```javascript
function exportToTreeListy() {
  const tree = buildTree();

  // CRITICAL: Prevent pixel-based image analysis
  tree._imageAnalysis = null;

  // Optional: Enable virtual bboxes based on scores
  // addVirtualBboxes(tree);  // Uncomment when Phase 2 ready

  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(tree));
  window.open(`https://treelisty.netlify.app?p=${compressed}`, '_blank');
}
```

---

## Testing Checklist

- [ ] Import PS URL → No bboxes appear
- [ ] Import image file → Pixel bboxes work as before
- [ ] Capture screenshot → Pixel bboxes work as before
- [ ] PS export with `_imageAnalysis: null` → Clean canvas
- [ ] Virtual bboxes render with correct sizes
- [ ] Virtual bboxes clickable (Phase 4)
- [ ] Mixed tree (some pixel, some virtual) renders correctly

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| PS import shows irrelevant bboxes | Yes | No |
| User confusion on canvas | High | Low |
| Bbox click provides info | No | Yes |
| Score/priority visible in canvas | No | Yes (via virtual bbox size) |

---

*Filed: 2025-12-24*
*Author: Claude + Garnet*
