# Image Analysis Pattern Design

**Date:** 2025-12-24
**Status:** Draft - Pending Peer Review
**Feature:** Enhanced image tree manipulation with hybrid pattern system

---

## Summary

Enhance TreeListy's image analysis feature with a hybrid approach: auto-detected spatial capabilities when image metadata exists, plus optional domain-specific patterns for specialized workflows.

**Core insight:** Users see AI detection as raw material to reorganize, not just annotate. The initial tree is a starting point, not the destination.

---

## User Research Findings

**Primary use cases:** Mixed - documents, photos, UI screenshots (no single dominant scenario)

**User priorities (ranked):**
1. Restructuring - regroup objects, create new hierarchies, establish relationships
2. Spatial reasoning - "what's near X?", "what's in this region?"
3. Adding context - domain labels, descriptions, metadata
4. Correcting mistakes - fix misdetections, merge duplicates

**Key relationship types:**
- Functional (primary) - grouping by purpose/role
- Containment (primary) - what's inside what
- Proximity (secondary) - what's near what
- Sequential (secondary) - reading order, steps

---

## Architecture: Hybrid Approach

### Layer 1: Auto-Detection (No Pattern Required)

When a tree has `_imageAnalysis` metadata on the root node, TreeBeard automatically enables:

**Spatial reasoning:**
- Understands that nodes have `_bbox` coordinates (0-1000 normalized scale)
- Can answer "what's near X?", "what's in the upper-left?", "what contains Y?"
- Uses bbox data to describe spatial relationships in responses

**Image-specific commands:**
| Command | Description |
|---------|-------------|
| `nearby [node]` | Find objects within proximity threshold |
| `region [top-left\|center\|etc]` | List objects in that quadrant |
| `containing [node]` | Find objects whose bbox encompasses this one |
| `layout match` | Reposition canvas nodes to align with bbox Y-coordinates |

**AI context injection:**
- Injects bbox coordinates when discussing specific nodes
- Explains spatial relationships when relevant to queries

### Layer 2: Optional Domain Patterns

Users can apply a domain pattern to get specialized behavior. These extend (not replace) the auto-detected capabilities.

#### Pattern: Diagram Analysis
- **Purpose:** Flowcharts, architecture diagrams, org charts, circuit diagrams
- **Custom instructions:** Identify connectors/arrows as relationships, detect flow direction, recognize standard symbols
- **Extra commands:**
  - `trace flow [start]` - follow arrows/connections
  - `re-analyze region` - send cropped bbox back to Gemini
- **Labeling hints:** Shape-based ("diamond = decision", "rectangle = process")

#### Pattern: Photo Inventory
- **Purpose:** Product photos, room photos, scene documentation
- **Custom instructions:** Focus on countable objects, material/condition descriptions, size estimates
- **Extra commands:**
  - `count [type]` - tally objects by category
  - `inventory` - generate structured list with quantities
- **Labeling hints:** Physical attributes (color, size, material, condition)

#### Pattern: UI Documentation
- **Purpose:** App screenshots, mockups, design specs
- **Custom instructions:** Recognize UI patterns (nav, forms, modals), identify interactive vs static elements
- **Extra commands:**
  - `interactions` - list clickable elements
  - `hierarchy` - show component nesting
- **Labeling hints:** UI vocabulary (button, input, card, header, sidebar)

---

## Spatial Manipulation Workflows

The real power is editing the visual decomposition - not just labeling what's there.

### Delete Seamlessly
- User deletes a node → bbox overlay disappears immediately
- TreeBeard can suggest: "Also delete these 3 child objects inside it?"
- Command: `clean [region]` - remove low-confidence detections in area

### Move/Reparent
- User drags node to new parent → functional regrouping
- "Move all buttons under Navigation" - batch restructure by function
- Bbox stays the same (spatial position unchanged), hierarchy changes (logical position updated)

### Replace/Relabel
- "This isn't a button, it's a toggle switch" → update name, keep bbox
- `relabel [node] as [new-type]` - preserve spatial data, change semantics
- Domain patterns suggest vocabulary: "Did you mean: checkbox, radio, toggle?"

### Spatial-Aware Restructuring
| Command | Description |
|---------|-------------|
| `group by region` | Auto-create parent nodes for top/middle/bottom clusters |
| `group by proximity` | Cluster nearby objects under shared parents |
| `flatten` | Remove groupings, return to flat detected objects |

**Key principle:** Bbox coordinates are immutable reference to source image. Hierarchy is user's interpretation layered on top.

---

## Data Model

### Root Node (`capexTree._imageAnalysis`)

```javascript
_imageAnalysis: {
  // Image reference (not embedded - stored in IndexedDB)
  imageRef: {
    id: 'img-abc123',
    hash: 'sha256-...',             // For deduplication
    dimensions: { width: 1920, height: 1080 }
  },
  modelUsed: 'gemini-2.0-flash-exp',
  analyzedAt: '2025-12-24T10:23:00Z',
  showOverlays: true,               // Toggle bbox visibility
  overlayOpacity: 0.7,              // User preference
  snapToImage: true,                // Nodes locked to bbox positions
  lens: null                        // Optional: 'diagram', 'photo', 'ui'
}
```

### Each Detected Node

```javascript
// Model output (immutable)
_bbox: { yMin: 0.234, xMin: 0.100, yMax: 0.456, xMax: 0.300 }, // 0.0-1.0 normalized
_confidence: 0.95,              // Gemini's certainty
_objectType: 'person',          // Gemini's classification

// User corrections (optional overrides)
_bboxUser: null,                // User-corrected bbox (if different from model)
_userLabel: null,               // User's override label (vs AI name)
_userVerified: false,           // User confirmed/corrected this detection
_verifiedAt: null,              // Timestamp of verification

// Spatial integrity
_spatialIntegrity: true,        // False if bbox outside parent's bbox

// Multiple groupings
_tags: []                       // e.g., ['navigation', 'header-area', 'interactive']
```

### What's NOT Stored
- Pixel coordinates (derived from bbox + dimensions at render time)
- Canvas positions (calculated from bbox, not stored separately)
- Relationship inferences (computed on-demand from bbox overlaps)

### Export Considerations
- JSON export includes all `_` metadata for round-trip
- "Clean export" option strips image data, keeps structure only

---

## Image Import UX

### Open Menu Integration

Add "Import Image..." option to the Open dropdown:

```
📂 Open ▾
  ├── Open File (JSON)
  ├── Import Excel...
  ├── Import MS Project...
  ├── Import Image...        ← NEW
  └── Load from URL...
```

### Import Modal

Clicking "Import Image..." opens modal with:
- File picker (drag-drop or browse)
- URL paste field (for web images)
- Capture button (if Chrome extension connected)
- Preview thumbnail before analysis
- Domain pattern selector (optional): "Auto-detect | Diagram | Photo | UI"

### Supported Formats

| Format | Notes |
|--------|-------|
| PNG | Lossless, best for screenshots/diagrams |
| JPEG/JPG | Photos, compressed images |
| GIF | Static frame extracted (no animation) |
| WebP | Modern web format |

### Size Handling (Mandatory Compression)
- **Max dimension:** 2048px (longest edge)
- **Format:** Convert to WebP at 80% quality
- **Target payload:** <500KB embedded
- **Rationale:** Prevents DOM/JSON jank during auto-save and undo operations
- Base64 encoding adds ~33% overhead (accounted for in 500KB target)

### Not Supported (Out of Scope)
- SVG (vector format)
- PDF (multi-page documents)
- RAW camera formats (CR2, NEF)

---

## Canvas View Enhancements

### Background Image Layer
- Source image rendered behind nodes at configurable opacity (0-100%)
- Scaled to fit canvas with consistent reference point
- Toggle: "Show Image" button in canvas toolbar

### Bounding Box Overlays
- SVG rectangles drawn over detected regions
- Color-coded by category or confidence level
- Hover: highlight corresponding node in tree
- Click: select node, open info panel

### Snap-to-Image Toggle (Simplified)

Single toggle replaces complex layout modes:

| State | Behavior |
|-------|----------|
| Snap ON | Nodes locked to bbox positions on image |
| Snap OFF | Nodes float freely, bbox overlays "ghosted" on background |

### Toolbar Additions (When Image Tree Detected)

```
[🖼️ Image ▾] [📦 Boxes ▾] [📌 Snap]
    │            │           │
    ├─ Show/Hide ├─ Show/Hide└─ Toggle on/off
    ├─ Opacity   ├─ By Type
    └─ Fit/Fill  └─ By Conf
```

### Region-to-Node Creation

`Shift + Drag` on canvas background:
1. Draw rectangle to define region
2. Creates new node with that bbox
3. Auto-sends crop to Gemini for labeling
4. Node appears with AI-suggested name

### Minimap Enhancement
- Shows image thumbnail with bbox outlines
- Current viewport indicator
- Click to navigate

---

## Implementation Phases (Revised)

### Phase 1: Interaction Spine (MUST-HAVE FIRST)
- Bidirectional selection: click bbox ↔ select node
- Hover interactions: bbox ↔ node highlighting
- Focus action: pan/zoom canvas to selected bbox
- Basic filters: by type, confidence threshold
- **Target:** Core interaction loop feels responsive

### Phase 2: Image Storage + Import
- IndexedDB image store (not embedded base64)
- Add "Import Image..." to Open menu
- Auto-compress: 2048px max, WebP 80%
- Export options: portable (embed) vs light (reference)
- **Target:** No file bloat, clean import UX

### Phase 3: Bbox Corrections
- User can redraw/adjust bbox (`_bboxUser`)
- Verification workflow (`_userVerified`, `_verifiedAt`)
- Canvas shows user box if present, else model box
- **Target:** Fix wrong box in <10 seconds

### Phase 4: Spatial Commands + Clustering
- 2 primitives: `spatial query`, `cluster`
- Snap-to-image toggle
- Spatial integrity warnings on reparent
- **Target:** Restructuring feels powerful

### Phase 5: Tags + Multiple Groupings
- `_tags` array on nodes
- `tag by region`, `tag by type` batch ops
- Filter view by tag
- **Target:** Same object in multiple semantic groups

### Phase 6: Lenses (Deferred)
- Single "lens" concept (not full patterns)
- Vocabulary + command suggestions
- Start with one lens, add more based on usage
- **Target:** Domain-specific help without complexity

---

## Peer Review Refinements (2025-12-24)

### Review #2: Interaction + Architecture Gaps

**Critical additions identified:**

#### A. Bidirectional Selection Spine (MUST-HAVE)

Without this, restructuring is tedious and users bounce to CVAT/Label Studio.

| Action | Result |
|--------|--------|
| Click bbox overlay | Select corresponding node, open info panel |
| Click node in tree | Flash bbox, pan/zoom canvas to center it |
| Hover bbox | Preview node card tooltip |
| Hover node | Highlight corresponding bbox |

Plus filters: by type, confidence range, verified/unverified.

#### B. Bbox Correction Path

"Bbox immutable" frustrates users when Gemini is wrong.

```javascript
// Keep both for provenance
node._bbox = { ... }        // Original model output (immutable)
node._bboxUser = { ... }    // User correction (optional override)
node._userVerified = true   // User confirmed/corrected
node._verifiedAt = timestamp
```

Canvas shows `_bboxUser` if present, else `_bbox`.

#### C. Tags for Multiple Groupings

Single tree can't represent simultaneous groupings (region vs type vs inventory).

```javascript
node._tags = ['navigation', 'header-area', 'interactive']
```

Batch operations:
- `tag by region [tag-name]` - tag all nodes in selected area
- `tag by type [tag-name]` - tag all nodes of same objectType
- Filter view by tag

#### D. Attachment Policy (Prevent Data Bloat)

Embedding 20MB base64 will make TreeListy files 30-200MB monsters.

**Solution:** Store image in IndexedDB, reference in tree:

```javascript
_imageAnalysis: {
  imageRef: { id: 'img-abc123', hash: 'sha256...', dimensions: {...} },
  // sourceImage removed - lives in IndexedDB
}
```

**Export options:**
- **Portable export:** Embeds base64 (for sharing)
- **Light export:** References imageId only (for local use)
- Clear user messaging about file size implications

#### E. Command Reduction

Cut 6 commands to 2 primitives + UI affordances:

| Primitive | Covers |
|-----------|--------|
| `spatial query [relation] [target]` | near, inside, overlap, above, below, left-of, right-of |
| `cluster [by]` | region, proximity, type |

Everything else becomes TreeBeard synonyms or toolbar buttons.

#### F. Domain Patterns Deferral

Don't ship 3 patterns initially. Start with single **"Lens"** concept:
- Changes vocabulary + suggested commands
- Doesn't add new PATTERNS category
- Avoids "pattern dropdown confusion"

Add Diagram/Photo/UI as lenses after core is solid.

#### G. Performance Requirements

| Metric | Target |
|--------|--------|
| Boxes rendered | 1,000+ with smooth pan/zoom |
| Selection response | <50ms |
| Render strategy | Canvas layer if DOM overlays choke |

**Tests needed:**
- Coordinate transforms across zoom/pan and view switches
- Export/import roundtrip (portable + light modes)
- User can fix wrong box in <10 seconds

---

### 1. Spatial Integrity Check (NEW)

When restructuring creates semantic drift (node's bbox no longer contained by parent's bbox):

- **Detection:** On reparent, check if child bbox is spatially within new parent bbox
- **Warning:** Show broken link icon `🔗!` on node indicating "Parent does not structurally contain this child"
- **Tooltip:** "This object's image position is outside its parent's region"
- **Optional:** TreeBeard nudge: "3 nodes have spatial integrity warnings"

This prevents the "wheel moved from Car A to Car B but bbox still shows Car A" problem.

### 2. Coordinate System Change

**Old:** 0-1000 integer scale (Gemini native)
**New:** 0.0-1.0 float scale (normalized)

**Rationale:**
- Simpler render math: `pixelX = xMax * imageWidth`
- Resolution-independent (swap image for higher-res later)
- Standard web convention (CSS, Canvas, SVG)

**Implementation:** Convert Gemini's 1000-scale to float immediately on receipt:
```javascript
node._bbox = {
  yMin: geminiBox.yMin / 1000,
  xMin: geminiBox.xMin / 1000,
  yMax: geminiBox.yMax / 1000,
  xMax: geminiBox.xMax / 1000
}
```

### 3. Layout Simplification

**Cut:** Three layout modes (Overlay | Side-by-side | Tree)
**Replace with:** Single "Snap to Image" toggle

- **Snap ON:** Nodes locked to bbox coordinates on image
- **Snap OFF:** Nodes float freely (standard graph), bbox overlays remain "ghosted" on background

This reduces UI complexity while preserving the reference relationship.

### 4. Image Compression (Mandatory)

**Rule:** Auto-compress before embedding:
- Max dimension: 2048px (longest edge)
- Format: WebP at 80% quality
- Target payload: <500KB

**Rationale:** Single-file app storing 20MB Base64 in DOM causes jank during auto-save and undo operations.

### 5. Region-to-Node Creation (NEW Workflow)

**Trigger:** `Shift` + `Drag` on Canvas background
**Action:** Creates new node with user-drawn bbox
**AI Enhancement:** Auto-send crop to Gemini: "What is in this region?"
**Result:** Auto-labeled node with user-defined boundaries

Faster than: Create Node → Type Label → Draw Box

---

## Open Questions (Resolved)

1. ~~Bbox overlay persistence across view switches?~~ → Yes, persist in `_imageAnalysis.showOverlays`
2. ~~Large images: warn or auto-compress?~~ → **Auto-compress mandatory** (2048px, WebP 80%)
3. ~~User-extensible patterns or fixed set?~~ → Start with fixed set, evaluate later

---

## Related Files

- `treeplexity.html` - Main application
- `docs/plans/2025-12-17-canvas-gojs-enhancements-design.md` - Canvas improvements
- `.claude/plans/spicy-stargazing-swan.md` - Original image analysis implementation plan
