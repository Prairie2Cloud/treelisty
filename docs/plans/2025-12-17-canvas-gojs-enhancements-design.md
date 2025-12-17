# Canvas Enhancements Design (GoJS-Inspired)

**Date**: 2025-12-17
**Status**: Draft - Awaiting Review
**Scope**: Multi-build feature set
**Inspiration**: GoJS diagramming library patterns (implemented natively)

---

## Executive Summary

Enhance TreeListy's Canvas View with professional diagramming features inspired by GoJS, while maintaining the zero-dependency, single-file architecture. This design covers four priority areas:

1. **Visual Polish** - Animation system + contextual link styles
2. **Richer Connections** - Swimlanes + typed dependencies with critical path
3. **Navigation at Scale** - Minimap + search-zoom
4. **Performance** - Canvas layering + incremental rendering

Estimated scope: ~2000-2500 lines of new JavaScript.

---

## CRITICAL: Renderer Decision

**Current State**: TreeListy's Canvas View uses **DOM nodes + SVG connections**, not an HTML `<canvas>` 2D context.

This design must explicitly choose a rendering strategy before implementation:

### Option A: Keep DOM+SVG (Recommended)

| Pros | Cons |
|------|------|
| No migration risk | SVG performance degrades at 500+ nodes |
| Built-in accessibility (DOM is screen-reader traversable) | Complex path calculations still needed |
| CSS animations "free" (transforms, opacity) | Multi-layer compositing harder |
| Existing event handling works | Animated flow effects require SVG `stroke-dashoffset` tricks |
| Easier debugging (inspect element) | |

**Implementation approach**:
- Animations via CSS transitions + `requestAnimationFrame` for orchestration
- Links via SVG `<path>` elements with dynamic `d` attributes
- Minimap via scaled-down clone of DOM structure or separate small `<canvas>`
- Layers via CSS `z-index` on container divs

### Option B: Migrate to `<canvas>` 2D

| Pros | Cons |
|------|------|
| Full rendering control | **High migration risk** - dual systems during transition |
| Better performance at scale | Lose DOM accessibility |
| Easier multi-layer compositing | Must reimplement hit testing |
| Animated flow is trivial | Must reimplement text rendering |
| GoJS patterns apply directly | Larger code delta |

### Decision: **Option A (DOM+SVG)** with selective `<canvas>` for:
- Minimap (small, self-contained)
- Animated flow particles on dependency links (overlay canvas)

### Validation Spike (Pre-Phase 1)

Before committing, timebox a 1-day spike:
1. Prototype Shift+Drag dependency creation with snap feedback in current DOM+SVG
2. Prototype same in `<canvas>` overlay
3. Measure complexity and decide

Ship behind feature flag to de-risk regressions.

---

## User Goals & Primary Workflows

Features should optimize for these TreeListy use cases:

### Workflow 1: Project Manager importing MS Project
```
Import XML → Inspect dependencies → Highlight critical path →
Identify bottlenecks → Regroup by assignee → Export updated plan
```
**Features needed**: Dependencies, Critical Path, Swimlanes

### Workflow 2: Large tree navigation
```
Open 150-node tree → Search for specific item →
Jump to it → Understand context → Edit → Find next item
```
**Features needed**: Search-Zoom, Minimap

### Workflow 3: Presentation/review mode
```
Share tree with stakeholders → Walk through structure →
Show dependencies → Highlight critical items → Smooth transitions
```
**Features needed**: Animations, Link styling, Focus mode

### Workflow 4: Kanban-style status tracking
```
View all items by status → Drag item to new status →
Auto-update field → See updated grouping
```
**Features needed**: Swimlanes with drag-to-reassign

---

## Revised Implementation Phases (Value-First)

Based on user workflow priorities:

| Phase | Features | Risk | User Value |
|-------|----------|------|------------|
| **0** | Renderer Spike | Low | Foundation decision |
| **1 (MVP)** | Search overlay + zoomToNode + highlighting | Low | Immediate for all large trees |
| **2 (MVP)** | Minimap (click-to-navigate) | Low | Immediate for all large trees |
| **3** | Layout transition animations | Medium | Polish |
| **4** | Typed link styling (bezier, orthogonal) | Medium | Visual clarity |
| **5** | Minimap drag-to-pan | Low | UX refinement |
| **6** | Dependencies engine + validation + UI | High | PM workflows |
| **7** | Critical path visualization + focus mode | Medium | PM workflows |
| **8** | Swimlanes + drag-to-reassign + auto-sort | Medium | PM workflows |
| **9** | Performance layering/throttling polish | Medium | Scale |
| **10** | Touch gestures | Medium | Mobile |

**MVP = Phases 1-2** (Search + Minimap). Ship these first.

---

## Priority 1: Visual Polish

### 1A. Animation System

**Problem**: Nodes jump instantly on layout changes, expand/collapse, and add/delete operations. This feels jarring compared to modern diagramming tools.

**Solution**: Centralized `AnimationManager` that interpolates node properties over time using `requestAnimationFrame`.

#### Architecture

```javascript
const animationManager = {
  active: [],                    // Currently running animations
  defaultDuration: 300,          // ms
  defaultEasing: 'easeOutCubic',

  // Queue an animation (cancels existing animation on same target)
  animate(targetId, fromProps, toProps, options = {}) {
    // Cancel any existing animation for this target
    this.active = this.active.filter(a => a.targetId !== targetId);

    this.active.push({
      targetId,
      fromProps,
      toProps,
      startTime: performance.now(),
      duration: options.duration || this.defaultDuration,
      easing: options.easing || this.defaultEasing,
      onComplete: options.onComplete
    });

    if (this.active.length === 1) {
      this.tick();  // Start animation loop
    }
  },

  // Animation loop - called every frame
  tick(timestamp) {
    if (this.active.length === 0) return;

    this.active.forEach(anim => {
      const elapsed = timestamp - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = this.ease(progress, anim.easing);

      // Interpolate each property
      Object.keys(anim.toProps).forEach(prop => {
        const from = anim.fromProps[prop];
        const to = anim.toProps[prop];
        const current = from + (to - from) * easedProgress;
        this.applyProperty(anim.targetId, prop, current);
      });
    });

    // Remove completed animations
    this.active = this.active.filter(anim => {
      const elapsed = timestamp - anim.startTime;
      if (elapsed >= anim.duration) {
        if (anim.onComplete) anim.onComplete();
        return false;
      }
      return true;
    });

    renderCanvas();  // Single render per frame

    if (this.active.length > 0) {
      requestAnimationFrame(ts => this.tick(ts));
    }
  },

  // Easing functions
  ease(t, type) {
    switch (type) {
      case 'linear': return t;
      case 'easeOutCubic': return 1 - Math.pow(1 - t, 3);
      case 'easeInOutQuad': return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
      case 'easeOutBounce': return this.bounceOut(t);
      default: return t;
    }
  }
};
```

#### Animation Types

| Trigger | Properties Animated | Duration | Easing |
|---------|---------------------|----------|--------|
| Layout switch | `canvasX`, `canvasY` for all nodes | 400ms | easeInOutQuad |
| Expand phase | Children `canvasX`, `canvasY`; siblings shift | 300ms | easeOutCubic |
| Collapse phase | Children converge to parent position | 250ms | easeOutCubic |
| Node add | `opacity` 0→1, `scale` 0.5→1.0 | 200ms | easeOutCubic |
| Node delete | `opacity` 1→0, `scale` 1.0→0.8 | 150ms | easeOutCubic |
| Pan (inertial) | `panX`, `panY` with velocity decay | 200-500ms | easeOutCubic |
| Zoom (smooth) | `zoom` level | 200ms | easeOutCubic |

#### Integration Points

**Layout Switch** (in `applyCanvasLayout()`):
```javascript
function applyCanvasLayout(layoutType) {
  const newPositions = calculateLayout(layoutType);  // Returns {nodeId: {x, y}}

  Object.entries(newPositions).forEach(([nodeId, pos]) => {
    const node = findNodeById(nodeId);
    animationManager.animate(nodeId,
      { canvasX: node.canvasX, canvasY: node.canvasY },
      { canvasX: pos.x, canvasY: pos.y },
      { duration: 400, easing: 'easeInOutQuad' }
    );
  });
}
```

**Node Add** (in `addNode()`):
```javascript
function addNodeToCanvas(node) {
  node.canvasX = parentNode.canvasX + 50;
  node.canvasY = parentNode.canvasY + 50;
  node._opacity = 0;
  node._scale = 0.5;

  animationManager.animate(node.id,
    { _opacity: 0, _scale: 0.5 },
    { _opacity: 1, _scale: 1.0 },
    { duration: 200 }
  );
}
```

---

### 1B. Contextual Link Styles

**Problem**: All connections render as simple straight lines. Parent-child relationships, hyperedges, and dependencies should be visually distinct.

**Solution**: Typed link system with distinct rendering styles per relationship type.

#### Link Type Definitions

```javascript
const LINK_TYPES = {
  parentChild: {
    style: 'orthogonal',       // Right-angle paths
    color: 'var(--border-color)',
    width: 1,
    opacity: 0.4,
    arrow: false,
    animated: false
  },
  hyperedge: {
    style: 'bezier',           // Smooth S-curves
    color: 'dynamic',          // Uses hyperedge.color
    width: 2,
    opacity: 0.7,
    arrow: false,
    animated: false
  },
  dependency: {
    style: 'bezier',
    color: '#ff6b6b',          // Red
    width: 2,
    opacity: 0.8,
    arrow: true,
    animated: true,            // Moving dashes
    dashPattern: [8, 4]
  },
  criticalPath: {
    style: 'bezier',
    color: '#ff0000',          // Bright red
    width: 3,
    opacity: 1.0,
    arrow: true,
    animated: true,
    dashPattern: null          // Solid line
  }
};
```

#### Path Calculation Algorithms

**Orthogonal (for parent-child)**:
```javascript
function calculateOrthogonalPath(source, target) {
  const midY = (source.canvasY + target.canvasY) / 2;

  return [
    { x: source.canvasX, y: source.canvasY },                    // Start
    { x: source.canvasX, y: midY },                              // Down from source
    { x: target.canvasX, y: midY },                              // Horizontal
    { x: target.canvasX, y: target.canvasY }                     // Down to target
  ];
}
```

**Bezier (for hyperedges/dependencies)**:
```javascript
function calculateBezierPath(source, target) {
  const dx = target.canvasX - source.canvasX;
  const dy = target.canvasY - source.canvasY;
  const curvature = 0.3;  // Control point offset factor

  return {
    start: { x: source.canvasX, y: source.canvasY },
    cp1: { x: source.canvasX + dx * curvature, y: source.canvasY + dy * 0.1 },
    cp2: { x: target.canvasX - dx * curvature, y: target.canvasY - dy * 0.1 },
    end: { x: target.canvasX, y: target.canvasY }
  };
}
```

**Animated Flow Rendering**:
```javascript
function drawAnimatedLink(ctx, path, linkType, timestamp) {
  ctx.strokeStyle = linkType.color;
  ctx.lineWidth = linkType.width;
  ctx.globalAlpha = linkType.opacity;

  if (linkType.animated && linkType.dashPattern) {
    const dashOffset = (timestamp / 20) % 20;
    ctx.setLineDash(linkType.dashPattern);
    ctx.lineDashOffset = -dashOffset;
  }

  // Draw bezier curve
  ctx.beginPath();
  ctx.moveTo(path.start.x, path.start.y);
  ctx.bezierCurveTo(
    path.cp1.x, path.cp1.y,
    path.cp2.x, path.cp2.y,
    path.end.x, path.end.y
  );
  ctx.stroke();

  // Draw arrow if needed
  if (linkType.arrow) {
    drawArrowHead(ctx, path.cp2, path.end, linkType.color);
  }

  ctx.setLineDash([]);
  ctx.globalAlpha = 1.0;
}
```

---

## Priority 2: Richer Connections

### 2A. Swimlane Layout

**Problem**: No way to visually group nodes by category (status, assignee, phase) in the canvas view.

**Solution**: New layout mode that partitions canvas into lanes based on any node field.

#### Configuration

```javascript
const swimlaneConfig = {
  enabled: false,
  field: 'pmStatus',              // Field to group by
  orientation: 'vertical',        // 'vertical' (columns) or 'horizontal' (rows)
  lanes: [],                      // Auto-generated: [{value, label, count, color}]
  laneWidth: 250,                 // px (or 'auto' for equal distribution)
  laneGap: 20,                    // px between lanes
  headerHeight: 50,               // px
  nodeSpacing: 80,                // px vertical spacing between nodes
  sortLanesBy: 'predefined'       // 'predefined', 'alpha', 'count'
};

// Predefined orderings for common fields
const SWIMLANE_ORDERINGS = {
  pmStatus: ['To Do', 'In Progress', 'Done'],
  pmPriority: ['High', 'Medium', 'Low'],
  type: ['phase', 'item', 'subtask']
};

// Auto-generate colors for lanes
const SWIMLANE_COLORS = [
  'rgba(59, 130, 246, 0.08)',   // Blue
  'rgba(34, 197, 94, 0.08)',    // Green
  'rgba(234, 179, 8, 0.08)',    // Yellow
  'rgba(239, 68, 68, 0.08)',    // Red
  'rgba(168, 85, 247, 0.08)'    // Purple
];
```

#### Lane Generation

```javascript
function generateSwimlanes(tree, field) {
  const valueCounts = new Map();

  traverseTree(tree, node => {
    const value = node[field] || '(none)';
    valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
  });

  // Get ordering
  let values;
  if (SWIMLANE_ORDERINGS[field]) {
    values = SWIMLANE_ORDERINGS[field];
    // Add any values not in predefined list
    valueCounts.forEach((_, v) => {
      if (!values.includes(v)) values.push(v);
    });
  } else {
    values = [...valueCounts.keys()].sort();
  }

  return values.map((value, i) => ({
    value,
    label: value,
    count: valueCounts.get(value) || 0,
    color: SWIMLANE_COLORS[i % SWIMLANE_COLORS.length]
  }));
}
```

#### Layout Algorithm

```javascript
function layoutSwimlanes() {
  swimlaneConfig.lanes = generateSwimlanes(capexTree, swimlaneConfig.field);

  swimlaneConfig.lanes.forEach((lane, laneIndex) => {
    const laneX = laneIndex * (swimlaneConfig.laneWidth + swimlaneConfig.laneGap);
    const nodesInLane = getNodesWithFieldValue(capexTree, swimlaneConfig.field, lane.value);

    nodesInLane.forEach((node, nodeIndex) => {
      const targetX = laneX + swimlaneConfig.laneWidth / 2;
      const targetY = swimlaneConfig.headerHeight + 30 + (nodeIndex * swimlaneConfig.nodeSpacing);

      animationManager.animate(node.id,
        { canvasX: node.canvasX, canvasY: node.canvasY },
        { canvasX: targetX, canvasY: targetY },
        { duration: 400 }
      );
    });
  });
}
```

#### Rendering

```javascript
function renderSwimlaneBackgrounds(ctx) {
  if (!swimlaneConfig.enabled) return;

  const totalHeight = Math.max(canvasHeight, getMaxNodesInLane() * swimlaneConfig.nodeSpacing + 200);

  swimlaneConfig.lanes.forEach((lane, i) => {
    const x = i * (swimlaneConfig.laneWidth + swimlaneConfig.laneGap);

    // Lane background
    ctx.fillStyle = lane.color;
    ctx.fillRect(x, 0, swimlaneConfig.laneWidth, totalHeight);

    // Lane header
    ctx.fillStyle = 'var(--bg-secondary)';
    ctx.fillRect(x, 0, swimlaneConfig.laneWidth, swimlaneConfig.headerHeight);

    // Header text
    ctx.fillStyle = 'var(--text-primary)';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText(lane.label, x + 12, 25);

    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '12px system-ui';
    ctx.fillText(`${lane.count} items`, x + 12, 42);

    // Lane divider
    ctx.strokeStyle = 'var(--border-color)';
    ctx.beginPath();
    ctx.moveTo(x + swimlaneConfig.laneWidth, 0);
    ctx.lineTo(x + swimlaneConfig.laneWidth, totalHeight);
    ctx.stroke();
  });
}
```

#### Drag-to-Reassign

```javascript
function onNodeDropInSwimlane(node, dropX) {
  if (!swimlaneConfig.enabled) return;

  // Determine which lane was dropped into
  const laneIndex = Math.floor(dropX / (swimlaneConfig.laneWidth + swimlaneConfig.laneGap));
  const lane = swimlaneConfig.lanes[laneIndex];

  if (lane && node[swimlaneConfig.field] !== lane.value) {
    saveState('Change ' + swimlaneConfig.field);
    node[swimlaneConfig.field] = lane.value;
    layoutSwimlanes();  // Re-layout all nodes
    showToast(`Moved to ${lane.label}`, 'success');
  }
}
```

#### UI Integration

Add dropdown to Canvas toolbar:
```html
<div class="canvas-toolbar-group">
  <label>Group by:</label>
  <select id="swimlane-field" onchange="toggleSwimlanes(this.value)">
    <option value="">None</option>
    <option value="pmStatus">Status</option>
    <option value="pmPriority">Priority</option>
    <option value="pmAssignee">Assignee</option>
    <option value="type">Node Type</option>
    <!-- Dynamically populated from current pattern fields -->
  </select>
</div>
```

#### Swimlane Scope: Unit of Grouping

| Option | Behavior | Recommendation |
|--------|----------|----------------|
| **All nodes** | Root, phases, items, subtasks all placed in lanes | Too cluttered |
| **Items only** | Only item-level nodes grouped; phases/subtasks hidden or shown separately | **Recommended for PM workflows** |
| **Items + subtasks** | Items and their subtasks grouped together | Good for detailed views |
| **Configurable** | User chooses which levels to include | Most flexible |

**Default**: Items only (most useful for Kanban-style status tracking).

```javascript
const swimlaneConfig = {
  // ... existing fields
  nodeFilter: 'items',  // 'all', 'items', 'items+subtasks'

  // Filter function
  shouldIncludeNode(node) {
    switch (this.nodeFilter) {
      case 'all': return true;
      case 'items': return node.type === 'item';
      case 'items+subtasks': return node.type === 'item' || node.type === 'subtask';
      default: return node.type === 'item';
    }
  }
};
```

#### Position Preservation on Toggle Off

**Problem**: User hand-tunes node positions, toggles swimlanes on, then off again - positions lost.

**Solution**: Save pre-swimlane positions and restore on toggle off.

```javascript
let preSwimlanePositions = null;

function enableSwimlanes(field) {
  // Save current positions before swimlane layout
  preSwimlanePositions = new Map();
  traverseTree(capexTree, node => {
    if (node.canvasX !== undefined) {
      preSwimlanePositions.set(node.id, {
        x: node.canvasX,
        y: node.canvasY
      });
    }
  });

  swimlaneConfig.enabled = true;
  swimlaneConfig.field = field;
  layoutSwimlanes();
}

function disableSwimlanes() {
  swimlaneConfig.enabled = false;

  if (preSwimlanePositions) {
    // Animate back to saved positions
    preSwimlanePositions.forEach((pos, nodeId) => {
      const node = findNodeById(nodeId);
      if (node) {
        animationManager.animate(node.id,
          { canvasX: node.canvasX, canvasY: node.canvasY },
          { canvasX: pos.x, canvasY: pos.y },
          { duration: 400 }
        );
      }
    });
  }

  renderCanvas();
}
```

#### Lane Overflow Behavior

When a lane has many nodes, handle overflow gracefully:

| Strategy | Behavior | When to Use |
|----------|----------|-------------|
| **Vertical scroll** | Lane becomes scrollable | Best for fixed-width views |
| **Column wrap** | Multiple columns within lane | Best for wide screens |
| **Density reduction** | Reduce node spacing | Best for overview mode |
| **Pagination** | Show N nodes + "Show more" | Best for very large lanes |

**Default**: Vertical scroll with density reduction at threshold.

```javascript
const swimlaneConfig = {
  // ... existing fields
  overflow: 'scroll',           // 'scroll', 'wrap', 'density', 'paginate'
  maxNodesBeforeDensity: 15,    // Reduce spacing after this many
  minNodeSpacing: 50,           // Minimum spacing in density mode
  wrapColumnWidth: 200,         // Width of each column when wrapping
  pageSize: 20                  // Nodes per page when paginating
};

function calculateNodeSpacing(laneNodeCount) {
  if (swimlaneConfig.overflow === 'density' &&
      laneNodeCount > swimlaneConfig.maxNodesBeforeDensity) {
    // Reduce spacing to fit more nodes
    const availableHeight = canvasHeight - swimlaneConfig.headerHeight - 100;
    const calculatedSpacing = availableHeight / laneNodeCount;
    return Math.max(calculatedSpacing, swimlaneConfig.minNodeSpacing);
  }
  return swimlaneConfig.nodeSpacing;
}
```

---

### 2B. Typed Dependencies & Critical Path

**Problem**: No way to express predecessor/successor relationships between nodes. MS Project XML imports lose dependency information.

**Solution**: Native dependency system with typed relationships and critical path calculation.

#### Data Model

```javascript
// Added to node objects
node.dependencies = [
  {
    targetId: 'item-0-2',         // Predecessor node ID
    type: 'FS',                   // Dependency type
    lag: 0                        // Days offset (negative = lead time)
  }
];

// New calculated fields (not persisted)
node._earlyStart = null;          // Earliest possible start
node._earlyFinish = null;         // Earliest possible finish
node._lateStart = null;           // Latest allowable start
node._lateFinish = null;          // Latest allowable finish
node._slack = null;               // Float/slack time
node._isCritical = false;         // On critical path?

// Dependency types (MS Project standard)
const DEPENDENCY_TYPES = {
  FS: {
    code: 'FS',
    name: 'Finish-to-Start',
    description: 'Successor starts after predecessor finishes',
    icon: '→',
    default: true
  },
  SS: {
    code: 'SS',
    name: 'Start-to-Start',
    description: 'Both tasks start together',
    icon: '⇉'
  },
  FF: {
    code: 'FF',
    name: 'Finish-to-Finish',
    description: 'Both tasks finish together',
    icon: '⇶'
  },
  SF: {
    code: 'SF',
    name: 'Start-to-Finish',
    description: 'Successor finishes when predecessor starts',
    icon: '↔'
  }
};
```

#### Critical Path Algorithm

```javascript
const dependencyEngine = {

  // Build adjacency lists
  buildGraph(tree) {
    const nodes = [];
    const successors = new Map();  // nodeId → [successorIds]
    const predecessors = new Map(); // nodeId → [predecessorIds]

    traverseTree(tree, node => {
      nodes.push(node);
      successors.set(node.id, []);
      predecessors.set(node.id, []);
    });

    nodes.forEach(node => {
      (node.dependencies || []).forEach(dep => {
        predecessors.get(node.id).push(dep.targetId);
        successors.get(dep.targetId)?.push(node.id);
      });
    });

    return { nodes, successors, predecessors };
  },

  // Topological sort using Kahn's algorithm
  topologicalSort(graph) {
    const inDegree = new Map();
    graph.nodes.forEach(n => inDegree.set(n.id, graph.predecessors.get(n.id).length));

    const queue = graph.nodes.filter(n => inDegree.get(n.id) === 0);
    const sorted = [];

    while (queue.length > 0) {
      const node = queue.shift();
      sorted.push(node);

      graph.successors.get(node.id).forEach(succId => {
        inDegree.set(succId, inDegree.get(succId) - 1);
        if (inDegree.get(succId) === 0) {
          queue.push(graph.nodes.find(n => n.id === succId));
        }
      });
    }

    // Check for cycles
    if (sorted.length !== graph.nodes.length) {
      console.warn('Dependency cycle detected');
      return null;
    }

    return sorted;
  },

  // Get constraint date based on dependency type
  getConstraintDate(predecessor, successor, dep) {
    const lag = dep.lag || 0;
    const predDuration = predecessor.pmDuration || 1;
    const succDuration = successor.pmDuration || 1;

    switch (dep.type) {
      case 'FS': return predecessor._earlyFinish + lag;
      case 'SS': return predecessor._earlyStart + lag;
      case 'FF': return predecessor._earlyFinish + lag - succDuration;
      case 'SF': return predecessor._earlyStart + lag - succDuration;
      default: return predecessor._earlyFinish + lag;
    }
  },

  // Forward pass: calculate early start/finish
  forwardPass(tree) {
    const graph = this.buildGraph(tree);
    const sorted = this.topologicalSort(graph);
    if (!sorted) return false;

    sorted.forEach(node => {
      const preds = graph.predecessors.get(node.id);
      const duration = node.pmDuration || 1;

      if (preds.length === 0) {
        // No predecessors: start at project start (day 0) or node's start date
        node._earlyStart = this.dateToDay(node.pmStartDate) || 0;
      } else {
        // Earliest start = max of all predecessor constraints
        node._earlyStart = Math.max(...preds.map(predId => {
          const pred = findNodeById(predId);
          const dep = node.dependencies.find(d => d.targetId === predId);
          return this.getConstraintDate(pred, node, dep);
        }));
      }

      node._earlyFinish = node._earlyStart + duration;
    });

    return true;
  },

  // Backward pass: calculate late start/finish
  backwardPass(tree) {
    const graph = this.buildGraph(tree);
    const sorted = this.topologicalSort(graph);
    if (!sorted) return false;

    // Find project end date
    const projectEnd = Math.max(...sorted.map(n => n._earlyFinish));

    // Process in reverse order
    sorted.reverse().forEach(node => {
      const succs = graph.successors.get(node.id);
      const duration = node.pmDuration || 1;

      if (succs.length === 0) {
        // No successors: can finish at project end
        node._lateFinish = projectEnd;
      } else {
        // Latest finish = min of all successor constraints (reverse logic)
        node._lateFinish = Math.min(...succs.map(succId => {
          const succ = findNodeById(succId);
          const dep = succ.dependencies.find(d => d.targetId === node.id);
          return this.getReverseConstraintDate(node, succ, dep);
        }));
      }

      node._lateStart = node._lateFinish - duration;
      node._slack = node._lateStart - node._earlyStart;
      node._isCritical = node._slack === 0;
    });

    return true;
  },

  // Calculate critical path
  calculateCriticalPath(tree) {
    this.forwardPass(tree);
    this.backwardPass(tree);

    const criticalNodes = [];
    traverseTree(tree, node => {
      if (node._isCritical) criticalNodes.push(node);
    });

    return criticalNodes;
  },

  // Helper: convert date string to day number
  dateToDay(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const projectStart = new Date(capexTree.pmStartDate || Date.now());
    return Math.floor((date - projectStart) / (1000 * 60 * 60 * 24));
  }
};
```

#### Dependency Creation UI

**Shift+Drag to Create**:
```javascript
let dependencyDragState = null;

canvas.addEventListener('mousedown', (e) => {
  if (e.shiftKey) {
    const node = getNodeAtPosition(e.offsetX, e.offsetY);
    if (node) {
      dependencyDragState = { sourceNode: node, startX: e.offsetX, startY: e.offsetY };
      e.preventDefault();
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (dependencyDragState) {
    // Draw temporary line from source to cursor
    renderCanvas();
    drawTempDependencyLine(dependencyDragState.sourceNode, e.offsetX, e.offsetY);
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (dependencyDragState) {
    const targetNode = getNodeAtPosition(e.offsetX, e.offsetY);
    if (targetNode && targetNode.id !== dependencyDragState.sourceNode.id) {
      showDependencyModal(dependencyDragState.sourceNode, targetNode);
    }
    dependencyDragState = null;
    renderCanvas();
  }
});
```

**Dependency Modal**:
```html
<div id="dependency-modal" class="modal">
  <h3>Create Dependency</h3>
  <p><strong>From:</strong> <span id="dep-source-name"></span></p>
  <p><strong>To:</strong> <span id="dep-target-name"></span></p>

  <!-- Validation error display -->
  <div id="dep-error" class="modal-error hidden">
    <span class="error-icon">⚠️</span>
    <span id="dep-error-text"></span>
  </div>

  <label>Type:</label>
  <select id="dep-type">
    <option value="FS" selected>Finish-to-Start (→)</option>
    <option value="SS">Start-to-Start (⇉)</option>
    <option value="FF">Finish-to-Finish (⇶)</option>
    <option value="SF">Start-to-Finish (↔)</option>
  </select>

  <label>Lag (days):</label>
  <input type="number" id="dep-lag" value="0" min="-365" max="365">
  <small>Negative = lead time (overlap)</small>

  <div class="modal-buttons">
    <button id="dep-create-btn" onclick="createDependency()">Create</button>
    <button onclick="closeModal('dependency-modal')">Cancel</button>
  </div>
</div>
```

#### Dependency Validation (First-Class)

**Validate before creation, not just in console**:

```javascript
const DependencyValidator = {

  // Main validation entry point
  validate(sourceId, targetId, tree) {
    const errors = [];

    // Rule 1: No self-dependencies
    if (sourceId === targetId) {
      errors.push({
        code: 'SELF_DEPENDENCY',
        message: 'A node cannot depend on itself'
      });
    }

    // Rule 2: No duplicate dependencies
    const target = findNodeById(targetId);
    if (target.dependencies?.some(d => d.targetId === sourceId)) {
      errors.push({
        code: 'DUPLICATE',
        message: 'This dependency already exists'
      });
    }

    // Rule 3: No cycles
    if (this.wouldCreateCycle(sourceId, targetId, tree)) {
      errors.push({
        code: 'CYCLE',
        message: 'This would create a circular dependency',
        details: this.getCyclePath(sourceId, targetId, tree)
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Check if adding source→target creates a cycle
  wouldCreateCycle(sourceId, targetId, tree) {
    // If target can reach source via existing dependencies, adding source→target creates cycle
    const visited = new Set();
    const stack = [sourceId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === targetId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      // Get all nodes that depend on current (current is their predecessor)
      traverseTree(tree, node => {
        if (node.dependencies?.some(d => d.targetId === current)) {
          stack.push(node.id);
        }
      });
    }

    return false;
  },

  // Get the path that would form a cycle (for error message)
  getCyclePath(sourceId, targetId, tree) {
    // BFS to find path from source back to target
    const path = this.findPath(sourceId, targetId, tree);
    return path ? [...path, sourceId] : null;
  }
};
```

**Real-time validation during drag**:

```javascript
canvas.addEventListener('mousemove', (e) => {
  if (dependencyDragState) {
    const nearestNode = findNearestNode(e.offsetX, e.offsetY, 50);

    if (nearestNode) {
      // Validate in real-time
      const validation = DependencyValidator.validate(
        dependencyDragState.sourceNode.id,
        nearestNode.id,
        capexTree
      );

      dependencyDragState.snapTarget = nearestNode;
      dependencyDragState.isValid = validation.valid;
      dependencyDragState.errors = validation.errors;
    }

    renderTempDependencyLine(dependencyDragState);
  }
});

function renderTempDependencyLine(dragState) {
  // ... existing code ...

  // Color based on validity
  if (dragState.snapTarget) {
    if (dragState.isValid) {
      ctx.strokeStyle = '#22c55e';  // Green = valid
      drawSnapHighlight(dragState.snapTarget, 'valid');
    } else {
      ctx.strokeStyle = '#ef4444';  // Red = invalid
      drawSnapHighlight(dragState.snapTarget, 'invalid');
      drawErrorTooltip(dragState.snapTarget, dragState.errors[0].message);
    }
  }
}
```

**Modal validation on open**:

```javascript
function showDependencyModal(source, target) {
  const validation = DependencyValidator.validate(source.id, target.id, capexTree);

  document.getElementById('dep-source-name').textContent = source.name;
  document.getElementById('dep-target-name').textContent = target.name;

  const errorDiv = document.getElementById('dep-error');
  const createBtn = document.getElementById('dep-create-btn');

  if (!validation.valid) {
    errorDiv.classList.remove('hidden');
    document.getElementById('dep-error-text').textContent = validation.errors[0].message;
    createBtn.disabled = true;
    createBtn.title = validation.errors[0].message;
  } else {
    errorDiv.classList.add('hidden');
    createBtn.disabled = false;
    createBtn.title = '';
  }

  openModal('dependency-modal');
}
```

#### Dependency Edit/Delete UI

**Click link badge to edit**:

```javascript
function onDependencyBadgeClick(sourceNode, targetNode, dep) {
  showDependencyEditModal(sourceNode, targetNode, dep);
}

function showDependencyEditModal(source, target, dep) {
  document.getElementById('dep-edit-source').textContent = source.name;
  document.getElementById('dep-edit-target').textContent = target.name;
  document.getElementById('dep-edit-type').value = dep.type;
  document.getElementById('dep-edit-lag').value = dep.lag || 0;

  // Store reference for save/delete
  currentEditingDep = { source, target, dep };

  openModal('dependency-edit-modal');
}
```

**Edit modal HTML**:

```html
<div id="dependency-edit-modal" class="modal">
  <h3>Edit Dependency</h3>
  <p><strong>From:</strong> <span id="dep-edit-source"></span></p>
  <p><strong>To:</strong> <span id="dep-edit-target"></span></p>

  <label>Type:</label>
  <select id="dep-edit-type">
    <option value="FS">Finish-to-Start (→)</option>
    <option value="SS">Start-to-Start (⇉)</option>
    <option value="FF">Finish-to-Finish (⇶)</option>
    <option value="SF">Start-to-Finish (↔)</option>
  </select>

  <label>Lag (days):</label>
  <input type="number" id="dep-edit-lag" value="0">

  <div class="modal-buttons">
    <button onclick="saveDependencyEdit()" class="primary">Save</button>
    <button onclick="deleteDependency()" class="danger">Delete</button>
    <button onclick="closeModal('dependency-edit-modal')">Cancel</button>
  </div>
</div>
```

**Node detail panel - dependencies tab**:

```javascript
function renderDependenciesTab(node) {
  const inbound = getDependenciesTo(node);    // Nodes that must finish before this
  const outbound = getDependenciesFrom(node); // Nodes that wait for this

  return `
    <div class="dependencies-tab">
      <h4>Predecessors (${inbound.length})</h4>
      <ul>
        ${inbound.map(d => `
          <li>
            <span class="dep-icon">${DEPENDENCY_TYPES[d.type].icon}</span>
            <span class="dep-name">${d.sourceNode.name}</span>
            ${d.lag ? `<span class="dep-lag">${d.lag > 0 ? '+' : ''}${d.lag}d</span>` : ''}
            <button onclick="editDependency('${d.sourceNode.id}', '${node.id}')">✏️</button>
          </li>
        `).join('')}
      </ul>

      <h4>Successors (${outbound.length})</h4>
      <ul>
        ${outbound.map(d => `
          <li>
            <span class="dep-icon">${DEPENDENCY_TYPES[d.type].icon}</span>
            <span class="dep-name">${d.targetNode.name}</span>
            ${d.lag ? `<span class="dep-lag">${d.lag > 0 ? '+' : ''}${d.lag}d</span>` : ''}
            <button onclick="editDependency('${node.id}', '${d.targetNode.id}')">✏️</button>
          </li>
        `).join('')}
      </ul>

      ${node._isCritical !== undefined ? `
        <div class="schedule-info">
          <p>Early Start: Day ${node._earlyStart}</p>
          <p>Early Finish: Day ${node._earlyFinish}</p>
          <p>Late Start: Day ${node._lateStart}</p>
          <p>Late Finish: Day ${node._lateFinish}</p>
          <p>Slack: ${node._slack} days ${node._slack === 0 ? '⚠️ Critical' : ''}</p>
        </div>
      ` : ''}
    </div>
  `;
}
```

#### Dependency Persistence Rules

| Scenario | Behavior |
|----------|----------|
| **Pattern switch** | Dependencies preserved (stored at node level, pattern-agnostic) |
| **Node delete** | All dependencies to/from node removed automatically |
| **Node duplicate** | Dependencies NOT copied (would create invalid refs) |
| **Node move (drag)** | Dependencies preserved (follow node) |
| **Tree merge** | Dependencies preserved if both nodes exist; orphaned deps removed |
| **JSON export** | Dependencies included in `node.dependencies[]` |
| **MS Project XML export** | Map to `<PredecessorLink>` elements |
| **MS Project XML import** | Parse `<PredecessorLink>` into `dependencies[]` |

**Undo/Redo Integration**:

```javascript
function createDependency() {
  const source = currentDependencySource;
  const target = currentDependencyTarget;
  const type = document.getElementById('dep-type').value;
  const lag = parseInt(document.getElementById('dep-lag').value) || 0;

  // Validate again before creating
  const validation = DependencyValidator.validate(source.id, target.id, capexTree);
  if (!validation.valid) {
    showToast(validation.errors[0].message, 'error');
    return;
  }

  // Save state for undo
  saveState(`Add dependency: ${source.name} → ${target.name}`);

  // Create dependency
  if (!target.dependencies) target.dependencies = [];
  target.dependencies.push({ targetId: source.id, type, lag });

  closeModal('dependency-modal');
  renderCanvas();
  showToast('Dependency created', 'success');
}

function deleteDependency() {
  const { source, target, dep } = currentEditingDep;

  saveState(`Delete dependency: ${source.name} → ${target.name}`);

  target.dependencies = target.dependencies.filter(d => d.targetId !== source.id);

  closeModal('dependency-edit-modal');
  renderCanvas();
  showToast('Dependency deleted', 'success');
}
```

#### Visual Rendering

```javascript
function renderDependencies(ctx, timestamp) {
  const showCriticalPath = document.getElementById('show-critical-path')?.checked;

  if (showCriticalPath) {
    dependencyEngine.calculateCriticalPath(capexTree);
  }

  // Collect all dependencies
  const dependencies = [];
  traverseTree(capexTree, node => {
    (node.dependencies || []).forEach(dep => {
      const source = findNodeById(dep.targetId);  // Predecessor
      const target = node;                         // Successor
      if (source && target) {
        dependencies.push({ source, target, dep, node });
      }
    });
  });

  // Render each dependency
  dependencies.forEach(({ source, target, dep, node }) => {
    const isCritical = showCriticalPath && source._isCritical && target._isCritical;
    const linkType = isCritical ? LINK_TYPES.criticalPath : LINK_TYPES.dependency;

    const path = calculateBezierPath(source, target);
    drawAnimatedLink(ctx, path, linkType, timestamp);

    // Draw dependency type badge at midpoint
    if (dep.type !== 'FS' || dep.lag !== 0) {
      const midX = (source.canvasX + target.canvasX) / 2;
      const midY = (source.canvasY + target.canvasY) / 2;
      drawDependencyBadge(ctx, midX, midY, dep);
    }
  });
}

function drawDependencyBadge(ctx, x, y, dep) {
  const label = dep.type + (dep.lag ? ` ${dep.lag > 0 ? '+' : ''}${dep.lag}d` : '');

  ctx.fillStyle = 'var(--bg-primary)';
  ctx.strokeStyle = 'var(--border-color)';

  const width = ctx.measureText(label).width + 8;
  ctx.fillRect(x - width/2, y - 8, width, 16);
  ctx.strokeRect(x - width/2, y - 8, width, 16);

  ctx.fillStyle = 'var(--text-secondary)';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 3);
}
```

#### Toolbar Integration

```html
<div class="canvas-toolbar-group">
  <label>
    <input type="checkbox" id="show-critical-path" onchange="renderCanvas()">
    Show Critical Path
  </label>
</div>
```

---

## Priority 3: Navigation at Scale

### 3A. Minimap/Overview

**Problem**: In large trees (50+ nodes), users lose orientation. No way to see the full tree while zoomed in on details.

**Solution**: Small bird's-eye canvas overlay with viewport indicator and click-to-navigate.

#### Configuration

```javascript
const minimapConfig = {
  enabled: true,
  width: 180,
  height: 120,
  position: 'bottom-right',      // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  margin: 16,                    // px from canvas edge
  opacity: 0.92,
  borderRadius: 8,
  scale: null,                   // Auto-calculated
  viewportRect: null             // Current viewport indicator
};
```

#### Implementation

**HTML Structure**:
```html
<div id="minimap-container" class="minimap">
  <canvas id="minimap-canvas"></canvas>
  <div id="minimap-viewport"></div>
</div>
```

**CSS**:
```css
.minimap {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 180px;
  height: 120px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
  z-index: 100;
  cursor: pointer;
}

.minimap canvas {
  width: 100%;
  height: 100%;
}

#minimap-viewport {
  position: absolute;
  border: 2px solid var(--accent-color);
  background: rgba(var(--accent-rgb), 0.1);
  pointer-events: none;
  transition: all 0.1s ease;
}
```

**Rendering**:
```javascript
function renderMinimap() {
  if (!minimapConfig.enabled) return;

  const canvas = document.getElementById('minimap-canvas');
  const ctx = canvas.getContext('2d');

  // Calculate bounds of all nodes
  const bounds = getTreeBounds(capexTree);
  if (!bounds) return;

  // Calculate scale to fit entire tree
  const padding = 10;
  minimapConfig.scale = Math.min(
    (minimapConfig.width - padding * 2) / bounds.width,
    (minimapConfig.height - padding * 2) / bounds.height
  );

  // Clear canvas
  ctx.clearRect(0, 0, minimapConfig.width, minimapConfig.height);

  // Draw links (simplified - just lines)
  ctx.strokeStyle = 'var(--border-color)';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;

  traverseTree(capexTree, node => {
    if (node.children || node.items) {
      const children = node.children || node.items || [];
      children.forEach(child => {
        if (child.canvasX !== undefined) {
          ctx.beginPath();
          ctx.moveTo(
            (node.canvasX - bounds.minX) * minimapConfig.scale + padding,
            (node.canvasY - bounds.minY) * minimapConfig.scale + padding
          );
          ctx.lineTo(
            (child.canvasX - bounds.minX) * minimapConfig.scale + padding,
            (child.canvasY - bounds.minY) * minimapConfig.scale + padding
          );
          ctx.stroke();
        }
      });
    }
  });

  // Draw nodes as dots
  ctx.globalAlpha = 1.0;
  traverseTree(capexTree, node => {
    if (node.canvasX === undefined) return;

    const x = (node.canvasX - bounds.minX) * minimapConfig.scale + padding;
    const y = (node.canvasY - bounds.minY) * minimapConfig.scale + padding;

    // Color by type
    const colors = {
      root: 'var(--accent-color)',
      phase: '#3b82f6',
      item: '#22c55e',
      subtask: '#a855f7'
    };

    ctx.fillStyle = colors[node.type] || '#888';
    ctx.beginPath();
    ctx.arc(x, y, node.type === 'root' ? 4 : 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Update viewport rectangle
  updateMinimapViewport(bounds, padding);
}

function updateMinimapViewport(bounds, padding) {
  const viewport = document.getElementById('minimap-viewport');
  const mainCanvas = document.getElementById('canvas');

  // Current visible area in tree coordinates
  const visibleX = -canvasState.panX / canvasState.zoom;
  const visibleY = -canvasState.panY / canvasState.zoom;
  const visibleW = mainCanvas.width / canvasState.zoom;
  const visibleH = mainCanvas.height / canvasState.zoom;

  // Convert to minimap coordinates
  const vpX = (visibleX - bounds.minX) * minimapConfig.scale + padding;
  const vpY = (visibleY - bounds.minY) * minimapConfig.scale + padding;
  const vpW = visibleW * minimapConfig.scale;
  const vpH = visibleH * minimapConfig.scale;

  viewport.style.left = Math.max(0, vpX) + 'px';
  viewport.style.top = Math.max(0, vpY) + 'px';
  viewport.style.width = Math.min(vpW, minimapConfig.width) + 'px';
  viewport.style.height = Math.min(vpH, minimapConfig.height) + 'px';
}
```

**Click-to-Navigate**:
```javascript
document.getElementById('minimap-canvas').addEventListener('click', (e) => {
  const bounds = getTreeBounds(capexTree);
  const padding = 10;

  // Convert click to tree coordinates
  const treeX = (e.offsetX - padding) / minimapConfig.scale + bounds.minX;
  const treeY = (e.offsetY - padding) / minimapConfig.scale + bounds.minY;

  // Animate pan to center on clicked point
  const mainCanvas = document.getElementById('canvas');
  animationManager.animate('viewport',
    { panX: canvasState.panX, panY: canvasState.panY },
    {
      panX: -treeX * canvasState.zoom + mainCanvas.width / 2,
      panY: -treeY * canvasState.zoom + mainCanvas.height / 2
    },
    { duration: 300 }
  );
});
```

---

### 3B. Search-Zoom

**Problem**: No way to quickly find and navigate to specific nodes in large trees.

**Solution**: Spotlight-style search with filtering, highlighting, and keyboard navigation.

#### State

```javascript
const searchState = {
  active: false,
  query: '',
  matches: [],
  currentIndex: 0,
  searchFields: ['name', 'description', 'pmAssignee', 'pmStatus']
};
```

#### UI

```html
<div id="canvas-search" class="canvas-search hidden">
  <input type="text"
         id="canvas-search-input"
         placeholder="Search nodes... (Ctrl+F)"
         oninput="executeCanvasSearch(this.value)">
  <span id="canvas-search-count"></span>
  <button onclick="searchPrev()" title="Previous (Shift+Enter)">▲</button>
  <button onclick="searchNext()" title="Next (Enter)">▼</button>
  <button onclick="closeCanvasSearch()" title="Close (Esc)">✕</button>
</div>
```

```css
.canvas-search {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 200;
}

.canvas-search.hidden {
  display: none;
}

.canvas-search input {
  width: 250px;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
}

.canvas-search input:focus {
  outline: none;
  border-color: var(--accent-color);
}

#canvas-search-count {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 60px;
}
```

#### Implementation

```javascript
function openCanvasSearch() {
  searchState.active = true;
  document.getElementById('canvas-search').classList.remove('hidden');
  document.getElementById('canvas-search-input').focus();
}

function closeCanvasSearch() {
  searchState.active = false;
  searchState.query = '';
  searchState.matches = [];
  document.getElementById('canvas-search').classList.add('hidden');
  document.getElementById('canvas-search-input').value = '';
  renderCanvas();  // Remove highlighting
}

function executeCanvasSearch(query) {
  searchState.query = query.toLowerCase().trim();
  searchState.matches = [];
  searchState.currentIndex = 0;

  if (!searchState.query) {
    updateSearchCount();
    renderCanvas();
    return;
  }

  traverseTree(capexTree, node => {
    const searchable = searchState.searchFields
      .map(f => node[f])
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (searchable.includes(searchState.query)) {
      searchState.matches.push(node);
    }
  });

  updateSearchCount();
  renderCanvas();

  if (searchState.matches.length > 0) {
    zoomToNode(searchState.matches[0]);
  }
}

function updateSearchCount() {
  const countEl = document.getElementById('canvas-search-count');
  if (searchState.matches.length === 0) {
    countEl.textContent = searchState.query ? 'No matches' : '';
  } else {
    countEl.textContent = `${searchState.currentIndex + 1} of ${searchState.matches.length}`;
  }
}

function searchNext() {
  if (searchState.matches.length === 0) return;
  searchState.currentIndex = (searchState.currentIndex + 1) % searchState.matches.length;
  updateSearchCount();
  zoomToNode(searchState.matches[searchState.currentIndex]);
}

function searchPrev() {
  if (searchState.matches.length === 0) return;
  searchState.currentIndex = (searchState.currentIndex - 1 + searchState.matches.length) % searchState.matches.length;
  updateSearchCount();
  zoomToNode(searchState.matches[searchState.currentIndex]);
}

function zoomToNode(node) {
  const mainCanvas = document.getElementById('canvas');

  animationManager.animate('viewport',
    { panX: canvasState.panX, panY: canvasState.panY, zoom: canvasState.zoom },
    {
      panX: -node.canvasX * 1.0 + mainCanvas.width / 2,
      panY: -node.canvasY * 1.0 + mainCanvas.height / 2,
      zoom: Math.max(canvasState.zoom, 1.0)  // Zoom in if currently zoomed out
    },
    { duration: 400, easing: 'easeInOutQuad' }
  );
}
```

**Visual Highlighting During Search**:
```javascript
function renderNodeWithSearchHighlight(ctx, node) {
  const isMatch = searchState.matches.includes(node);
  const isCurrent = searchState.matches[searchState.currentIndex] === node;

  // Dim non-matches when search is active
  if (searchState.active && searchState.query && !isMatch) {
    ctx.globalAlpha = 0.25;
  }

  // Normal node rendering
  renderNode(ctx, node);

  // Highlight current match
  if (isCurrent) {
    ctx.strokeStyle = 'var(--accent-color)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);

    // Pulsing effect
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;

    ctx.strokeRect(
      node.canvasX - NODE_WIDTH/2 - 6,
      node.canvasY - NODE_HEIGHT/2 - 6,
      NODE_WIDTH + 12,
      NODE_HEIGHT + 12
    );

    ctx.setLineDash([]);
  }

  ctx.globalAlpha = 1.0;
}
```

**Keyboard Shortcuts**:
```javascript
document.addEventListener('keydown', (e) => {
  // Only in canvas view
  if (viewMode !== 'canvas') return;

  // Ctrl+F or / to open search
  if ((e.ctrlKey && e.key === 'f') || (e.key === '/' && !isInputFocused())) {
    e.preventDefault();
    openCanvasSearch();
    return;
  }

  // When search is open
  if (searchState.active) {
    if (e.key === 'Escape') {
      closeCanvasSearch();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      searchNext();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      searchPrev();
    } else if (e.key === 'F3' && !e.shiftKey) {
      e.preventDefault();
      searchNext();
    } else if (e.key === 'F3' && e.shiftKey) {
      e.preventDefault();
      searchPrev();
    }
  }
});
```

---

## Priority 4: Lightweight Performance

**Context**: Trees rarely exceed 200 nodes, so heavy virtualization isn't needed. Focus on smooth rendering.

### 4A. Canvas Layering

Separate canvases for different update frequencies:

```javascript
const canvasLayers = {
  background: null,  // Swimlane backgrounds, grid (rarely redraws)
  links: null,       // All connections (redraws on structure change)
  nodes: null,       // Node boxes (redraws on position/selection)
  overlay: null      // Search, minimap, cursors (frequent updates)
};

function initCanvasLayers() {
  const container = document.getElementById('canvas-container');

  ['background', 'links', 'nodes', 'overlay'].forEach((layer, i) => {
    const canvas = document.createElement('canvas');
    canvas.id = `canvas-${layer}`;
    canvas.className = 'canvas-layer';
    canvas.style.zIndex = i;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    container.appendChild(canvas);
    canvasLayers[layer] = canvas.getContext('2d');
  });
}

// Selective layer rendering
function renderLayer(layerName) {
  const ctx = canvasLayers[layerName];
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.translate(canvasState.panX, canvasState.panY);
  ctx.scale(canvasState.zoom, canvasState.zoom);

  switch (layerName) {
    case 'background':
      renderSwimlaneBackgrounds(ctx);
      break;
    case 'links':
      renderParentChildLinks(ctx);
      renderHyperedges(ctx);
      renderDependencies(ctx, performance.now());
      break;
    case 'nodes':
      renderAllNodes(ctx);
      break;
    case 'overlay':
      renderSearchHighlights(ctx);
      renderSelectionHandles(ctx);
      break;
  }

  ctx.restore();
}

// Optimized full render
function renderCanvas() {
  renderLayer('background');
  renderLayer('links');
  renderLayer('nodes');
  renderLayer('overlay');
  renderMinimap();
}

// Partial updates
function onNodeMove() {
  renderLayer('nodes');
  renderLayer('links');
}

function onSelectionChange() {
  renderLayer('overlay');
}

function onSwimlaneChange() {
  renderLayer('background');
  renderLayer('nodes');
  renderLayer('links');
}
```

### 4B. Throttled Rendering

Prevent render spam during drag operations:

```javascript
let renderScheduled = false;
let lastRenderTime = 0;
const MIN_RENDER_INTERVAL = 16;  // ~60fps max

function scheduleRender() {
  if (renderScheduled) return;

  const now = performance.now();
  const elapsed = now - lastRenderTime;

  if (elapsed >= MIN_RENDER_INTERVAL) {
    // Render immediately
    renderCanvas();
    lastRenderTime = now;
  } else {
    // Schedule for next frame
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderCanvas();
      lastRenderTime = performance.now();
      renderScheduled = false;
    });
  }
}
```

### 4C. Incremental Node Rendering

For initial load or major layout changes:

```javascript
function renderNodesIncremental(nodes, callback) {
  const BATCH_SIZE = 40;
  let index = 0;
  const ctx = canvasLayers.nodes;

  function renderBatch(timestamp) {
    const batchEnd = Math.min(index + BATCH_SIZE, nodes.length);

    for (let i = index; i < batchEnd; i++) {
      renderNode(ctx, nodes[i]);
    }

    index = batchEnd;

    if (index < nodes.length) {
      requestAnimationFrame(renderBatch);
    } else if (callback) {
      callback();
    }
  }

  requestAnimationFrame(renderBatch);
}
```

---

## Implementation Phases

### Phase 1: Animation Foundation
- Implement `animationManager` core
- Add easing functions
- Integrate with layout switching
- Add node add/delete animations

### Phase 2: Link System
- Implement bezier path calculation
- Add orthogonal path calculation
- Create link type rendering
- Add animated flow for dependencies

### Phase 3: Dependencies
- Add `dependencies` field to data model
- Implement dependency creation UI (Shift+drag)
- Build critical path algorithm
- Add visual rendering with badges

### Phase 4: Swimlanes
- Add swimlane configuration
- Implement lane generation
- Build swimlane layout algorithm
- Add drag-to-reassign
- Add toolbar dropdown

### Phase 5: Navigation
- Implement minimap canvas
- Add viewport indicator
- Build click-to-navigate
- Implement search overlay
- Add keyboard shortcuts

### Phase 6: Performance Polish
- Implement canvas layering
- Add render throttling
- Test with 200-node trees
- Optimize as needed

---

## Data Model Changes Summary

```javascript
// New node fields
node.dependencies = [{ targetId, type, lag }];

// Calculated fields (not persisted)
node._earlyStart = null;
node._earlyFinish = null;
node._lateStart = null;
node._lateFinish = null;
node._slack = null;
node._isCritical = false;
node._opacity = 1;      // For animations
node._scale = 1;        // For animations
```

## New Global State

```javascript
// Animation
const animationManager = { ... };

// Swimlanes
const swimlaneConfig = { enabled, field, lanes, ... };

// Dependencies
const dependencyEngine = { ... };

// Minimap
const minimapConfig = { enabled, width, height, position, ... };

// Search
const searchState = { active, query, matches, currentIndex };

// Canvas layers
const canvasLayers = { background, links, nodes, overlay };
```

## New UI Elements

| Element | Location | Purpose |
|---------|----------|---------|
| "Group by" dropdown | Canvas toolbar | Toggle swimlanes |
| "Show Critical Path" checkbox | Canvas toolbar | Toggle CP highlighting |
| Minimap | Bottom-right overlay | Navigation |
| Search bar | Top-center overlay | Find nodes |
| Dependency modal | Modal | Create dependencies |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` or `/` | Open canvas search |
| `Enter` | Next search match |
| `Shift+Enter` | Previous search match |
| `Escape` | Close search |
| `Shift+drag` | Create dependency |

---

## Open Questions for Review

1. **Dependency persistence**: Should dependencies survive pattern switches? (Probably yes, stored at node level)

2. **Swimlane + other layouts**: Should swimlanes be a separate mode, or combinable with Force-Directed/Radial? (Recommend: separate mode)

3. **Critical path without dates**: How to handle nodes without `pmDuration` or `pmStartDate`? (Default to 1 day duration)

4. **Minimap toggle**: Should minimap be always-on or toggleable? (Recommend: toggle in View menu, default on)

5. **Animation disable**: Should there be a "reduce motion" preference for accessibility? (Yes, respect `prefers-reduced-motion`)

---

## Success Metrics (Measurable)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Animation smoothness** | 60fps during transitions | Dev overlay: frame time < 16.7ms |
| **Layout transition time** | < 500ms for 200 nodes | `performance.now()` before/after |
| **Search response time** | < 100ms to highlight matches | Time from keyup to render complete |
| **Minimap update latency** | < 50ms during pan/zoom | No visible lag between main canvas and minimap |
| **Critical path calculation** | < 200ms for 200 nodes | `console.time()` around `calculateCriticalPath()` |
| **Dependency validation** | < 50ms real-time during drag | Validation runs on every mousemove without jank |
| **Mobile frame rate** | 30fps minimum | Test on mid-tier Android device |
| **Memory stability** | No growth over 10min session | Chrome DevTools memory timeline |
| **Initial render** | < 1s for 200-node tree | Time to interactive measurement |

**Performance Overlay (Dev Mode)**:

```javascript
const perfOverlay = {
  enabled: localStorage.getItem('devPerfOverlay') === 'true',
  lastRenderTime: 0,
  frameCount: 0,
  fps: 0,
  nodeCount: 0,

  update(renderTime) {
    this.lastRenderTime = renderTime;
    this.frameCount++;
  },

  render(ctx) {
    if (!this.enabled) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 150, 80);
    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${this.fps}`, 20, 30);
    ctx.fillText(`Render: ${this.lastRenderTime.toFixed(1)}ms`, 20, 45);
    ctx.fillText(`Nodes: ${this.nodeCount}`, 20, 60);
    ctx.fillText(`Throttled: ${renderScheduled ? 'Yes' : 'No'}`, 20, 75);
    ctx.restore();
  }
};

// Enable with: localStorage.setItem('devPerfOverlay', 'true')
```

---

## Accessibility Requirements (First-Class)

### Reduce Motion Support

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let userReduceMotion = localStorage.getItem('reduceMotion') === 'true';

function shouldAnimate() {
  return !prefersReducedMotion && !userReduceMotion;
}

// In animation calls:
if (shouldAnimate()) {
  animationManager.animate(node.id, from, to, { duration: 400 });
} else {
  // Instant transition
  Object.assign(node, to);
  renderCanvas();
}
```

### Keyboard Navigation

| Context | Key | Action |
|---------|-----|--------|
| Canvas | `Tab` | Cycle through nodes |
| Canvas | `Enter` | Select focused node |
| Canvas | `Arrow keys` | Pan canvas |
| Canvas | `+` / `-` | Zoom in/out |
| Search | `Esc` | Close search |
| Search | `Enter` | Next match |
| Search | `Shift+Enter` | Previous match |
| Modal | `Tab` | Cycle through fields |
| Modal | `Esc` | Close modal |
| Modal | `Enter` | Submit |

### Focus Management

```javascript
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('open');

  // Trap focus within modal
  const focusableElements = modal.querySelectorAll(
    'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  firstFocusable?.focus();

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}
```

---

## Module Architecture (Required)

Promote IIFE encapsulation from mitigation to **required pattern** for all new code:

```javascript
// ═══════════════════════════════════════════════════════════════
// CANVAS ENHANCEMENTS - MODULE INDEX
// ═══════════════════════════════════════════════════════════════

// Each module exposes a minimal public API
const CanvasModules = {
  Animation: null,      // AnimationManager
  Dependencies: null,   // DependencyEngine + DependencyValidator
  Swimlanes: null,      // SwimlanesModule
  Minimap: null,        // MinimapModule
  Search: null,         // SearchModule
  Interaction: null     // CanvasInteractionFSM
};

// Example module structure
CanvasModules.Animation = (function() {
  'use strict';

  // ─── Private State ───
  const active = [];
  const defaultDuration = 300;

  // ─── Private Functions ───
  function ease(t, type) { /* ... */ }
  function tick(timestamp) { /* ... */ }

  // ─── Public API ───
  return {
    animate: function(targetId, from, to, options) { /* ... */ },
    cancel: function(targetId) { /* ... */ },
    cancelAll: function() { /* ... */ },
    isAnimating: function(targetId) { /* ... */ },
    pauseAll: function() { /* ... */ },
    resumeAll: function() { /* ... */ }
  };
})();

// Naming convention for new globals:
// - Modules: PascalCase (AnimationManager, DependencyEngine)
// - Config objects: camelCase + 'Config' suffix (swimlaneConfig, minimapConfig)
// - State objects: camelCase + 'State' suffix (searchState, dependencyDragState)
// - Private/transient: underscore prefix (node._earlyStart)
```

---

## Reviewer Feedback: Gemini

*Feedback incorporated: 2025-12-17*

### Accepted Recommendations

| Recommendation | Integration |
|----------------|-------------|
| **Snap-to-Port for dependencies** | Add visual snapping when drag line approaches valid target node (highlight target, show connection point) |
| **Focus Mode for Critical Path** | Add "Focus" toggle that hides/dims non-critical nodes when critical path is shown |
| **Swimlane Auto-Sort** | Add secondary sort dropdown (Date, Priority, Name) to maintain lane order automatically |
| **Minimap drag-to-pan** | Change viewport rectangle from `pointer-events: none` to draggable; implement continuous pan during drag |
| **Touch gesture support** | Add pinch-to-zoom and two-finger pan handlers mapped to existing zoom/pan logic |

### Risk Mitigations

#### 1. State Desynchronization During Animation

**Risk**: Rapid animations or interrupted interactions cause visual state to drift from data model.

**Mitigation**:
```javascript
// Animation completion always syncs to final state
animationManager.animate(nodeId, from, to, {
  onComplete: () => {
    // Force sync to target values
    node.canvasX = to.canvasX;
    node.canvasY = to.canvasY;
    node._opacity = 1;
    node._scale = 1;
  },
  onInterrupt: () => {
    // If cancelled mid-animation, snap to current interpolated position
    // and persist to model
    syncAnimationStateToModel(nodeId);
  }
});

// Block conflicting interactions during critical animations
function startLayoutAnimation() {
  canvasInteractionState.locked = true;
  animationManager.animate(..., {
    onComplete: () => { canvasInteractionState.locked = false; }
  });
}
```

#### 2. Code Maintainability (Single File Complexity)

**Risk**: Adding ~2500 lines increases complexity and namespace pollution.

**Mitigation**: Wrap each system in IIFE modules with explicit exports:

```javascript
// ═══════════════════════════════════════════════════════════════
// ANIMATION SYSTEM MODULE
// ═══════════════════════════════════════════════════════════════
const AnimationManager = (function() {
  // Private state
  const active = [];
  const defaultDuration = 300;

  // Private functions
  function ease(t, type) { ... }
  function tick(timestamp) { ... }

  // Public API
  return {
    animate: function(targetId, from, to, options) { ... },
    cancel: function(targetId) { ... },
    cancelAll: function() { ... },
    isAnimating: function(targetId) { ... }
  };
})();

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY ENGINE MODULE
// ═══════════════════════════════════════════════════════════════
const DependencyEngine = (function() {
  // ... encapsulated implementation
  return {
    calculateCriticalPath: function(tree) { ... },
    validateDependency: function(source, target) { ... },
    detectCycles: function(tree) { ... }
  };
})();

// Similar pattern for: SwimlanesModule, MinimapModule, SearchModule
```

#### 3. Mobile Performance

**Risk**: Continuous animation loops and effects cause battery drain and frame drops.

**Mitigation**:
```javascript
// Detect mobile and reduce visual complexity
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isLowPowerMode = navigator.getBattery?.().then(b => b.charging === false && b.level < 0.2);

const renderQuality = {
  shadowEnabled: !isMobile,
  animatedFlowEnabled: !isMobile,
  maxFPS: isMobile ? 30 : 60,
  nodeDetailLevel: isMobile ? 'simple' : 'full'
};

// Pause animations when tab not visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    AnimationManager.pauseAll();
  } else {
    AnimationManager.resumeAll();
  }
});

// Throttle more aggressively on mobile
const MIN_RENDER_INTERVAL = isMobile ? 33 : 16;  // 30fps vs 60fps
```

#### 4. Interaction Conflicts

**Risk**: Overlapping interaction zones (drag node vs drag dependency vs pan canvas) cause user errors.

**Mitigation**: Implement finite state machine for canvas interactions:

```javascript
const CanvasInteractionFSM = {
  state: 'IDLE',

  states: {
    IDLE: {
      onMouseDown: function(e, node) {
        if (e.shiftKey && node) {
          this.transition('CREATING_DEPENDENCY', { sourceNode: node, startPos: {x: e.offsetX, y: e.offsetY} });
        } else if (node) {
          this.transition('DRAGGING_NODE', { node, offset: getOffset(e, node) });
        } else if (e.button === 0) {
          this.transition('PANNING', { startPan: {x: canvasState.panX, y: canvasState.panY}, startMouse: {x: e.clientX, y: e.clientY} });
        }
      },
      onWheel: function(e) {
        handleZoom(e);
      }
    },

    PANNING: {
      onMouseMove: function(e) {
        const dx = e.clientX - this.context.startMouse.x;
        const dy = e.clientY - this.context.startMouse.y;
        canvasState.panX = this.context.startPan.x + dx;
        canvasState.panY = this.context.startPan.y + dy;
        scheduleRender();
      },
      onMouseUp: function() {
        this.transition('IDLE');
      }
    },

    DRAGGING_NODE: {
      onMouseMove: function(e) {
        updateNodePosition(this.context.node, e, this.context.offset);
        scheduleRender();
      },
      onMouseUp: function(e) {
        finalizeNodePosition(this.context.node);
        checkSwimlaneReassignment(this.context.node, e);
        this.transition('IDLE');
      },
      onEscape: function() {
        revertNodePosition(this.context.node);
        this.transition('IDLE');
      }
    },

    CREATING_DEPENDENCY: {
      onMouseMove: function(e) {
        const nearestNode = findNearestNode(e.offsetX, e.offsetY, 50); // 50px snap radius
        this.context.snapTarget = nearestNode;
        renderTempDependencyLine(this.context.sourceNode, e, nearestNode);
      },
      onMouseUp: function(e) {
        const target = this.context.snapTarget || getNodeAtPosition(e.offsetX, e.offsetY);
        if (target && target.id !== this.context.sourceNode.id) {
          showDependencyModal(this.context.sourceNode, target);
        }
        this.transition('IDLE');
      },
      onEscape: function() {
        this.transition('IDLE');
        renderCanvas();  // Clear temp line
      }
    },

    ANIMATION_LOCKED: {
      // All mouse events ignored during critical animations
      onAnimationComplete: function() {
        this.transition('IDLE');
      }
    }
  },

  transition: function(newState, context = {}) {
    console.log(`Canvas FSM: ${this.state} → ${newState}`);
    this.state = newState;
    this.context = context;
    updateCursor();
  }
};

// Cursor feedback based on state
function updateCursor() {
  const cursors = {
    IDLE: 'default',
    PANNING: 'grabbing',
    DRAGGING_NODE: 'move',
    CREATING_DEPENDENCY: 'crosshair',
    ANIMATION_LOCKED: 'wait'
  };
  document.getElementById('canvas').style.cursor = cursors[CanvasInteractionFSM.state];
}
```

### Additional Enhancements from Feedback

#### Snap-to-Port Visual Feedback

```javascript
function renderTempDependencyLine(sourceNode, mouseEvent, snapTarget) {
  const ctx = canvasLayers.overlay;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const startX = sourceNode.canvasX;
  const startY = sourceNode.canvasY;
  let endX = (mouseEvent.offsetX - canvasState.panX) / canvasState.zoom;
  let endY = (mouseEvent.offsetY - canvasState.panY) / canvasState.zoom;

  // If snapped to target, draw to target center
  if (snapTarget) {
    endX = snapTarget.canvasX;
    endY = snapTarget.canvasY;

    // Highlight snap target
    ctx.save();
    ctx.translate(canvasState.panX, canvasState.panY);
    ctx.scale(canvasState.zoom, canvasState.zoom);

    ctx.strokeStyle = '#22c55e';  // Green
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(
      snapTarget.canvasX - NODE_WIDTH/2 - 4,
      snapTarget.canvasY - NODE_HEIGHT/2 - 4,
      NODE_WIDTH + 8,
      NODE_HEIGHT + 8
    );

    // Draw port indicator
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(snapTarget.canvasX, snapTarget.canvasY - NODE_HEIGHT/2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw dependency line
  ctx.save();
  ctx.translate(canvasState.panX, canvasState.panY);
  ctx.scale(canvasState.zoom, canvasState.zoom);

  ctx.strokeStyle = snapTarget ? '#22c55e' : '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Arrow head
  drawArrowHead(ctx, {x: startX, y: startY}, {x: endX, y: endY}, ctx.strokeStyle);

  ctx.restore();
}
```

#### Critical Path Focus Mode

```javascript
let criticalPathFocusMode = false;

function toggleCriticalPathFocus() {
  criticalPathFocusMode = !criticalPathFocusMode;
  renderCanvas();
}

function renderNodeWithFocusMode(ctx, node) {
  if (criticalPathFocusMode && !node._isCritical) {
    // Option A: Dim non-critical nodes
    ctx.globalAlpha = 0.15;
    renderNode(ctx, node);
    ctx.globalAlpha = 1.0;

    // Option B: Hide completely (uncomment to use)
    // return;  // Skip rendering entirely
  } else {
    renderNode(ctx, node);
  }
}
```

#### Swimlane Auto-Sort

```javascript
const swimlaneConfig = {
  // ... existing fields
  autoSort: {
    enabled: true,
    field: 'pmDueDate',        // Secondary sort field
    direction: 'asc'           // 'asc' or 'desc'
  }
};

function layoutSwimlanes() {
  swimlaneConfig.lanes = generateSwimlanes(capexTree, swimlaneConfig.field);

  swimlaneConfig.lanes.forEach((lane, laneIndex) => {
    const laneX = laneIndex * (swimlaneConfig.laneWidth + swimlaneConfig.laneGap);
    let nodesInLane = getNodesWithFieldValue(capexTree, swimlaneConfig.field, lane.value);

    // Auto-sort within lane
    if (swimlaneConfig.autoSort.enabled) {
      nodesInLane = sortNodes(nodesInLane, swimlaneConfig.autoSort.field, swimlaneConfig.autoSort.direction);
    }

    nodesInLane.forEach((node, nodeIndex) => {
      // ... position animation
    });
  });
}

function sortNodes(nodes, field, direction) {
  return [...nodes].sort((a, b) => {
    const aVal = a[field] || '';
    const bVal = b[field] || '';

    // Handle dates
    if (field.includes('Date')) {
      const aDate = new Date(aVal || '9999-12-31');
      const bDate = new Date(bVal || '9999-12-31');
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle numbers
    if (typeof aVal === 'number' || typeof bVal === 'number') {
      return direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    }

    // Handle strings
    return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
}
```

#### Minimap Drag-to-Pan

```javascript
let minimapDragState = null;

document.getElementById('minimap-viewport').style.pointerEvents = 'auto';
document.getElementById('minimap-viewport').style.cursor = 'grab';

document.getElementById('minimap-viewport').addEventListener('mousedown', (e) => {
  e.stopPropagation();
  minimapDragState = {
    startX: e.clientX,
    startY: e.clientY,
    startPanX: canvasState.panX,
    startPanY: canvasState.panY
  };
  document.getElementById('minimap-viewport').style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
  if (!minimapDragState) return;

  const bounds = getTreeBounds(capexTree);
  const dx = e.clientX - minimapDragState.startX;
  const dy = e.clientY - minimapDragState.startY;

  // Convert minimap pixels to canvas pan
  const panDx = (dx / minimapConfig.scale) * canvasState.zoom;
  const panDy = (dy / minimapConfig.scale) * canvasState.zoom;

  canvasState.panX = minimapDragState.startPanX - panDx;
  canvasState.panY = minimapDragState.startPanY - panDy;

  renderCanvas();
});

document.addEventListener('mouseup', () => {
  if (minimapDragState) {
    minimapDragState = null;
    document.getElementById('minimap-viewport').style.cursor = 'grab';
  }
});
```

#### Touch Gesture Support

```javascript
let touchState = {
  active: false,
  touches: [],
  initialDistance: null,
  initialZoom: null,
  initialPan: null
};

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    touchState.active = true;
    touchState.touches = [...e.touches];
    touchState.initialDistance = getTouchDistance(e.touches);
    touchState.initialZoom = canvasState.zoom;
    touchState.initialPan = { x: canvasState.panX, y: canvasState.panY };
    touchState.initialMidpoint = getTouchMidpoint(e.touches);
  }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (!touchState.active || e.touches.length !== 2) return;
  e.preventDefault();

  const newDistance = getTouchDistance(e.touches);
  const newMidpoint = getTouchMidpoint(e.touches);

  // Pinch-to-zoom
  const scale = newDistance / touchState.initialDistance;
  canvasState.zoom = Math.min(Math.max(touchState.initialZoom * scale, 0.25), 3);

  // Two-finger pan
  const dx = newMidpoint.x - touchState.initialMidpoint.x;
  const dy = newMidpoint.y - touchState.initialMidpoint.y;
  canvasState.panX = touchState.initialPan.x + dx;
  canvasState.panY = touchState.initialPan.y + dy;

  scheduleRender();
}, { passive: false });

canvas.addEventListener('touchend', () => {
  touchState.active = false;
});

function getTouchDistance(touches) {
  const dx = touches[1].clientX - touches[0].clientX;
  const dy = touches[1].clientY - touches[0].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMidpoint(touches) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  };
}
```

---

## Updated Open Questions

1. ~~**Dependency persistence**: Should dependencies survive pattern switches?~~ **Answer: Yes** (stored at node level)

2. ~~**Swimlane + other layouts**: Should swimlanes be a separate mode?~~ **Answer: Yes** (separate mode)

3. ~~**Critical path without dates**: How to handle nodes without dates?~~ **Answer: Default to 1 day**

4. ~~**Minimap toggle**~~ **Answer: Toggleable via View menu, default on**

5. ~~**Animation disable**~~ **Answer: Respect `prefers-reduced-motion`**

6. **NEW: Focus mode behavior**: Should non-critical nodes be dimmed or hidden entirely? (Recommend: dimmed, with option to hide)

7. **NEW: Mobile gesture conflicts**: How to differentiate single-finger pan from node drag on touch devices? (Recommend: short press = pan, long press = select/drag node)

---

## Reviewer Feedback: ChatGPT

*Feedback incorporated: 2025-12-17*

### Critical Architectural Point: Renderer Decision

**ChatGPT correctly identified** that the original design assumed `<canvas>` 2D while TreeListy's current Canvas View uses DOM+SVG. This is now addressed in the **"CRITICAL: Renderer Decision"** section at the top of this document.

**Resolution**: Keep DOM+SVG with selective `<canvas>` for minimap and animated flow effects.

### Accepted Recommendations

| # | Recommendation | Status |
|---|----------------|--------|
| 1 | Add "Renderer Decision" section | ✅ Added at top |
| 2 | Tighten MVP scope (Navigation first) | ✅ Phases reordered: Search → Minimap → Animations → Dependencies |
| 3 | Add user goals + primary workflows | ✅ Added "User Goals & Primary Workflows" section |
| 4 | Define dependency persistence rules | ✅ Added "Dependency Persistence Rules" table |
| 5 | Add dependency validation + failure UX | ✅ Added "Dependency Validation (First-Class)" section with real-time validation, error states, cycle detection |
| 6 | Expand dependency UI (edit/delete) | ✅ Added "Dependency Edit/Delete UI" section with modal and node panel |
| 7 | Swimlane: specify unit of grouping | ✅ Added "Swimlane Scope: Unit of Grouping" section |
| 8 | Swimlane: preserve positions on toggle off | ✅ Added "Position Preservation on Toggle Off" section |
| 9 | Swimlane: lane overflow behavior | ✅ Added "Lane Overflow Behavior" section |
| 10 | Accessibility: bake in reduce motion | ✅ Added "Accessibility Requirements (First-Class)" section |
| 11 | Performance: measurable acceptance criteria | ✅ Updated "Success Metrics" with targets and measurement methods |
| 12 | Maintainability: require module encapsulation | ✅ Added "Module Architecture (Required)" section |

### Acknowledged Risks

| Risk | Mitigation |
|------|------------|
| **Renderer dual-system** | Decision made: DOM+SVG primary, `<canvas>` only for minimap/effects. No migration. |
| **Dependency cycles** | `DependencyValidator.wouldCreateCycle()` called at creation time, blocks invalid deps with UI error |
| **State integrity** | Animation `onComplete`/`onInterrupt` callbacks force sync; FSM prevents conflicting interactions |
| **Cognitive overload** | Value-first phasing (Search+Minimap first); FSM provides clear mode feedback via cursor changes |
| **Mobile performance** | Device detection + 30fps cap + visibility API pause; touch gestures in Phase 10 (not MVP) |
| **Single-file growth** | IIFE module pattern required; naming conventions enforced |
| **Data model compatibility** | Dependency persistence rules table defines behavior for all scenarios |
| **Rendering performance** | Canvas layering + throttling; performance overlay for measurement |

### Implementation Strategies Adopted

1. **Renderer Spike (Phase 0)**: 1-day timebox to prototype Shift+Drag dependency in DOM+SVG before committing
2. **Value-first phasing**: Search → Minimap → Animations → Dependencies → Swimlanes
3. **Validation first-class**: `DependencyValidator` called during creation AND import; errors surfaced in UI
4. **Centralized FSM**: `CanvasInteractionFSM` manages all interaction states
5. **Undo/redo integration**: `saveState()` called before all dependency/swimlane mutations
6. **Accessibility early**: `prefers-reduced-motion` respected from Phase 1
7. **Performance instrumentation**: Dev overlay shows FPS, render time, node count

### Test Harness (ChatGPT Suggestion)

Add in-browser unit tests for dependency engine:

```javascript
// test/dependency-engine-tests.js (run in browser console)
const DependencyTests = {
  run() {
    console.group('Dependency Engine Tests');

    this.testForwardPass();
    this.testBackwardPass();
    this.testCycleDetection();
    this.testAllDependencyTypes();
    this.testSlackCalculation();

    console.groupEnd();
  },

  testForwardPass() {
    // Setup: A → B → C (all FS)
    const tree = createTestTree([
      { id: 'A', dependencies: [] },
      { id: 'B', dependencies: [{ targetId: 'A', type: 'FS', lag: 0 }] },
      { id: 'C', dependencies: [{ targetId: 'B', type: 'FS', lag: 0 }] }
    ]);

    DependencyEngine.forwardPass(tree);

    console.assert(tree.A._earlyStart === 0, 'A.earlyStart should be 0');
    console.assert(tree.B._earlyStart === 1, 'B.earlyStart should be 1');
    console.assert(tree.C._earlyStart === 2, 'C.earlyStart should be 2');
    console.log('✓ Forward pass');
  },

  testCycleDetection() {
    const tree = createTestTree([
      { id: 'A', dependencies: [{ targetId: 'C', type: 'FS', lag: 0 }] },
      { id: 'B', dependencies: [{ targetId: 'A', type: 'FS', lag: 0 }] },
      { id: 'C', dependencies: [{ targetId: 'B', type: 'FS', lag: 0 }] }
    ]);

    const validation = DependencyValidator.validate('A', 'C', tree);
    console.assert(!validation.valid, 'Should detect cycle');
    console.assert(validation.errors[0].code === 'CYCLE', 'Error should be CYCLE');
    console.log('✓ Cycle detection');
  },

  testAllDependencyTypes() {
    // Test FS, SS, FF, SF constraint calculations
    const testCases = [
      { type: 'FS', predEnd: 5, expected: 5 },   // Successor starts when predecessor ends
      { type: 'SS', predStart: 3, expected: 3 }, // Successor starts when predecessor starts
      { type: 'FF', predEnd: 5, succDur: 2, expected: 3 }, // Successor ends when predecessor ends
      { type: 'SF', predStart: 3, succDur: 2, expected: 1 }  // Successor ends when predecessor starts
    ];

    testCases.forEach(tc => {
      const result = DependencyEngine.getConstraintDate(
        { _earlyStart: tc.predStart || 0, _earlyFinish: tc.predEnd || 1 },
        { pmDuration: tc.succDur || 1 },
        { type: tc.type, lag: 0 }
      );
      console.assert(result === tc.expected, `${tc.type} constraint failed`);
    });
    console.log('✓ All dependency types');
  },

  // ... more tests
};

// Run with: DependencyTests.run()
```

---

## Reviewer Feedback: ChatGPT (Updated)

*Second-pass feedback incorporated: 2025-12-17*

### Additional Refinements

#### 1. Rename `targetId` → `predecessorId`

**ChatGPT correctly identified** that storing `targetId` on the successor node (where it semantically represents the predecessor) is confusing.

**Resolution**: Rename for clarity:

```javascript
// Before (confusing)
node.dependencies = [{ targetId: 'item-0-1', type: 'FS', lag: 0 }];

// After (clear)
node.dependencies = [{ predecessorId: 'item-0-1', type: 'FS', lag: 0 }];
```

Update all code references: `dep.targetId` → `dep.predecessorId`

#### 2. Schema Migration Plan

Ensure older trees load cleanly and handle edge cases:

```javascript
function migrateTreeSchema(tree) {
  let migrated = false;

  traverseTree(tree, node => {
    // Ensure dependencies array exists
    if (!node.dependencies) {
      node.dependencies = [];
    }

    // Rename targetId → predecessorId (if old format)
    node.dependencies.forEach(dep => {
      if (dep.targetId && !dep.predecessorId) {
        dep.predecessorId = dep.targetId;
        delete dep.targetId;
        migrated = true;
      }
    });

    // Remove orphaned dependencies (predecessor no longer exists)
    const validPredecessors = new Set();
    traverseTree(tree, n => validPredecessors.add(n.id));

    node.dependencies = node.dependencies.filter(dep => {
      const exists = validPredecessors.has(dep.predecessorId);
      if (!exists) {
        console.warn(`Removed orphaned dependency: ${node.id} → ${dep.predecessorId}`);
        migrated = true;
      }
      return exists;
    });
  });

  if (migrated) {
    console.log('Tree schema migrated to latest format');
  }

  return tree;
}

// Call on load, import, merge
function loadTree(jsonData) {
  const tree = JSON.parse(jsonData);
  return migrateTreeSchema(tree);
}
```

#### 3. Test Dataset Pack

Create canonical test datasets for validation:

| Dataset | Nodes | Purpose |
|---------|-------|---------|
| `test-20-simple.json` | 20 | Basic tree, no dependencies |
| `test-80-mixed.json` | 80 | Multiple phases, items, subtasks |
| `test-150-stress.json` | 150 | Performance testing threshold |
| `test-200-max.json` | 200 | Maximum expected size |
| `test-deps-complex.json` | 50 | All 4 dependency types, lag values, chains |
| `test-deps-cycle.json` | 30 | Contains cycle for validation testing |
| `test-msproject-import.xml` | 40 | MS Project XML with predecessor chains |

Store in `test/fixtures/canvas-enhancement-datasets/`

#### 4. ARIA Labeling Strategy

```html
<!-- Search overlay -->
<div id="canvas-search"
     role="search"
     aria-label="Search nodes in tree">
  <input type="text"
         id="canvas-search-input"
         aria-label="Search query"
         aria-describedby="canvas-search-count"
         aria-activedescendant="">
  <span id="canvas-search-count" aria-live="polite">3 of 12 matches</span>
  <button aria-label="Previous match">▲</button>
  <button aria-label="Next match">▼</button>
  <button aria-label="Close search">✕</button>
</div>

<!-- Minimap -->
<div id="minimap-container"
     role="navigation"
     aria-label="Tree overview map - click to navigate">
  <canvas id="minimap-canvas" aria-hidden="true"></canvas>
  <div id="minimap-viewport"
       role="slider"
       aria-label="Current viewport position"
       aria-valuetext="Viewing center of tree"></div>
</div>

<!-- Dependency modal -->
<div id="dependency-modal"
     role="dialog"
     aria-labelledby="dep-modal-title"
     aria-modal="true">
  <h3 id="dep-modal-title">Create Dependency</h3>
  <!-- ... -->
</div>
```

**Minimap keyboard alternative** (for screen readers):
```javascript
// Keyboard shortcuts as minimap alternative
document.addEventListener('keydown', (e) => {
  if (e.altKey) {
    switch (e.key) {
      case 'Home': zoomToRoot(); break;           // Jump to root
      case 'End': zoomToLastNode(); break;        // Jump to last node
      case '1': zoomToPhase(0); break;            // Jump to Phase 1
      case '2': zoomToPhase(1); break;            // Jump to Phase 2
      // etc.
    }
  }
});
```

#### 5. MVP Acceptance Criteria (Feature-Specific)

**Phase 1: Search Overlay**

| Criteria | Target |
|----------|--------|
| Open latency | `Ctrl+F` → visible in < 100ms |
| First match | Keystroke → highlight in < 100ms on 150-node tree |
| Navigation | `Enter` moves to next match without losing context |
| Edge case | Empty query shows all nodes; no matches shows "0 results" |
| Keyboard | `Esc` closes and returns focus to canvas |

**Phase 2: Minimap**

| Criteria | Target |
|----------|--------|
| Render sync | Minimap updates within 50ms of main canvas |
| Click accuracy | Click lands within ±1 node width of intended position |
| Drag smooth | No visible jank during viewport drag |
| Toggle | Can be disabled via View menu; state persists |

#### 6. Renderer Constraint (Explicit)

> **HARD CONSTRAINT**: This initiative uses **DOM+SVG only** for the primary Canvas View. The `<canvas>` element is **strictly limited** to:
> 1. Minimap rendering
> 2. Animated flow effects overlay (optional)
>
> **No full `<canvas>` migration** is permitted in this scope. Any proposal to expand `<canvas>` usage requires a separate design review.

---

## Final Summary

| Section | Lines Added | Key Content |
|---------|-------------|-------------|
| Renderer Decision | ~45 | DOM+SVG vs `<canvas>` analysis, decision, spike plan |
| User Goals | ~35 | 4 workflow scenarios mapped to features |
| Revised Phases | ~20 | Value-first ordering, MVP definition |
| Dependency Validation | ~150 | Real-time validation, cycle detection, error UI |
| Dependency Edit/Delete | ~100 | Edit modal, delete flow, node panel |
| Dependency Persistence | ~20 | Rules for pattern switch, delete, merge, export |
| Swimlane Scope | ~30 | Unit of grouping options |
| Position Preservation | ~40 | Save/restore positions on toggle |
| Lane Overflow | ~35 | Scroll/wrap/density/paginate strategies |
| Accessibility | ~70 | Reduce motion, keyboard nav, focus trap |
| Module Architecture | ~50 | IIFE pattern, naming conventions |
| Success Metrics | ~50 | Measurable targets, performance overlay |
| Gemini Feedback | ~400 | Snap-to-port, FSM, touch gestures, etc. |
| ChatGPT Feedback | ~150 | This section |

**Total document**: ~2700 lines (comprehensive implementation blueprint)

---

**Next Steps**:

1. ✅ Review complete - feedback from Gemini and ChatGPT incorporated
2. **Decide**: Approve renderer decision (DOM+SVG with selective `<canvas>`)
3. **Execute Phase 0**: 1-day spike to validate dependency creation UX
4. **Begin Phase 1 (MVP)**: Search overlay + zoomToNode
5. Ship incrementally, measuring against success metrics
