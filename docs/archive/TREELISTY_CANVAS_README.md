# 🎨 TreeListy Canvas

**Visual Project Workspace** - A Figma x Obsidian inspired infinite canvas for TreeListy projects

## Overview

TreeListy Canvas is a **separate product** (fork) from TreeListy that transforms hierarchical project data into a visual, interactive canvas where you can drag nodes, draw connections, and explore relationships spatially. It's **100% backward compatible** with TreeListy JSON files.

### Design Philosophy

TreeListy Canvas blends:
- **Figma**: Precision tools, infinite canvas, clean interface, professional design workflows
- **Obsidian Graph View**: Organic knowledge connections, visual relationship mapping

---

## 🚀 Key Features

### ✅ **MVP Features (All Implemented)**

#### 1. **Drag & Drop Nodes** (Priority #1)
- Click and drag any node to reposition it
- **Multi-select drag**: Select multiple nodes (Ctrl/Cmd + Click), drag one to move all together
- **Connected nodes move together**: When dragging a node, its connected dependencies maintain relative positions (unless you grab individual nodes)
- Real-time connection updates as you move

#### 2. **Auto-Layout Algorithms** (Priority #2)
Choose from 5 intelligent layout algorithms via dropdown:

- **Force-Directed**: Physics-based simulation - nodes repel, connections attract (organic graph layout)
- **Hierarchical**: Top-to-bottom flow based on dependency levels
- **Radial**: Circular layout radiating from center
- **Timeline**: Left-to-right sequential timeline
- **Classic Tree**: Reset to original TreeListy horizontal timeline layout

#### 3. **Phases as Colored Zones** (Priority #3)
- Phases render as **colored dashed regions** you can see and interact with
- Drag nodes between phases to reassign them
- Each phase has a distinct color (Green, Blue, Orange, Purple)
- Auto-sizing zones based on content

#### 4. **Grid Snapping Toggle** (Priority #4)
- Toggle button: `⊞ Grid` / `⊠ Grid`
- 50px grid when enabled
- Visual grid background when active
- Snap-to-grid on drag for perfect alignment

#### 5. **Draw Connections** (Priority #5)
**Two ways to create connections:**

1. **Manual Drawing**: Hold **Shift + Click** on source node, drag to target node
   - Live preview with green dashed line
   - Creates directed dependency (arrow)
   - Crosshair cursor indicates drawing mode

2. **Proximity Auto-Connect**: Drag a node close to another (<150px)
   - Highlights nearby nodes in green
   - Auto-creates dependency on mouse release
   - Smart directional logic (left/above becomes dependency)

#### 6. **Undo for Movements** (Priority #6)
- **Undo stack**: Last 50 states
- Keyboard: `Ctrl/Cmd + Z`
- Button: `↶ Undo`
- Saves state after every drag, connection, delete

#### 7. **Pan & Zoom Enhancements** (Priority #7)
- **Infinite canvas**: Pan by dragging background
- **Smooth zoom**: Mouse wheel zooms towards cursor position
- **Zoom controls**: `+` / `−` buttons, or `Ctrl/Cmd + Scroll`
- **Fit to View**: `⊡` button centers and scales all nodes
- **Reset View**: `🎯` button returns to origin
- Zoom range: 10% to 500%

---

## 🎯 Usage Guide

### **Navigation**
- **Pan**: Click and drag the canvas background
- **Zoom**: Scroll wheel (zooms towards cursor)
- **Fit All**: Click `⊡` button to frame all nodes

### **Node Operations**
- **Move**: Click and drag any node
- **Multi-Select**: `Ctrl/Cmd + Click` to select multiple
- **Group Drag**: Drag any selected node to move all selected
- **Add Node**: Click `➕` button (creates at viewport center)
- **Delete**: Select nodes, click `🗑️` button
- **Edit Name**: Double-click any node
- **Select All**: Click `☑️` button or `Ctrl/Cmd + A`

### **Connections**
- **Draw Connection**: Hold `Shift`, click source node, drag to target node
- **Auto-Connect**: Drag node close to another (<150px), release to connect
- **View Dependencies**: Curved arrows show "A depends on B" relationships

### **Layouts**
1. Click **Auto-Layout** dropdown
2. Choose algorithm:
   - `Force-Directed` - Organic graph (great for complex dependencies)
   - `Hierarchical` - Top-down flow (clear dependency levels)
   - `Radial` - Circular (good for hub-and-spoke)
   - `Timeline` - Left-right sequence (chronological)
   - `Classic Tree` - Original TreeListy layout (phase timeline)

### **Grid**
- Toggle: Click `⊞ Grid` button
- When ON: Nodes snap to 50px grid for perfect alignment

---

## 📁 File Operations

### **Load Project**
1. Click `📂 Load JSON`
2. Select any TreeListy JSON file
3. **Automatic migration**: If file lacks canvas coordinates, they're auto-generated in Classic Tree layout

### **Save Project**
1. Click `💾 Save`
2. Downloads JSON with canvas coordinates embedded
3. **Backward compatible**: Can be loaded in original TreeListy

### **Export Image**
- Click `📸 Export Image` (Coming soon - will capture canvas as PNG)

---

## 🔧 Technical Details

### **Data Structure**

TreeListy Canvas extends the TreeListy JSON format with canvas-specific fields:

```json
{
  "canvasLayout": {
    "version": 1,
    "gridSize": 50,
    "viewportX": 0,
    "viewportY": 0,
    "zoom": 1
  },
  "children": [
    {
      "id": "phase-0",
      "canvasX": 100,
      "canvasY": 100,
      "canvasWidth": 500,
      "canvasHeight": 400,
      "items": [
        {
          "id": "item-0-0",
          "canvasX": 250,
          "canvasY": 200,
          "dependencies": ["item-0-1"]
        }
      ]
    }
  ]
}
```

### **Backward Compatibility**

✅ **TreeListy → Canvas**: Load any TreeListy JSON, coordinates auto-generated
✅ **Canvas → TreeListy**: Canvas JSON works in original TreeListy (ignores canvas fields)
✅ **Round-trip**: Edit in Canvas, save, load in TreeListy, edit, save, load back in Canvas - no data loss

### **New Fields**
- `canvasLayout`: Global canvas metadata
- `canvasX`, `canvasY`: Node/phase position on infinite canvas
- `canvasWidth`, `canvasHeight`: Phase zone dimensions

---

## 🎨 Visual Design

### **Color System**
- **Phase 0**: Green `#5FA463` (Discovery/Requirements)
- **Phase 1**: Blue `#3B8FCC` (Development/Build)
- **Phase 2**: Orange `#D68A2E` (Launch/Deploy)
- **Phase 3**: Purple `#9333EA` (Operations/Maintain)

### **RAG Status Indicators**
- 🟢 Green - On Track
- 🟡 Amber - At Risk
- 🔴 Red - Critical

### **Connection Styles**
- **Curved arrows**: Bezier curves for organic flow
- **Green highlight**: Proximity/drawing connections
- **Purple arrows**: Standard dependencies
- **Arrowheads**: Point to dependent node

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| **Undo** | `Ctrl/Cmd + Z` |
| **Select All** | `Ctrl/Cmd + A` |
| **Multi-Select** | `Ctrl/Cmd + Click` |
| **Draw Connection** | `Shift + Click → Drag` |
| **Pan** | `Drag background` |
| **Zoom** | `Scroll wheel` |
| **Delete** | `Select + Del button` |
| **Edit Node** | `Double-click` |

---

## 🆕 What's Different from TreeListy?

| Feature | TreeListy | TreeListy Canvas |
|---------|-----------|------------------|
| **Layout** | Fixed horizontal timeline | Infinite free-form canvas |
| **Phase Display** | Columns | Colored zones |
| **Connections** | Dependency list | Visual arrows |
| **Node Position** | Auto-calculated | Manually draggable |
| **View** | Scroll horizontally | Pan & zoom |
| **Relationships** | Text-based | Spatial proximity |
| **Layout Control** | None | 5 auto-layout algorithms |

---

## 🔮 Use Cases

### **When to Use TreeListy Canvas:**
1. **Visual brainstorming**: Explore connections spatially
2. **Dependency mapping**: See the web of relationships
3. **Complex projects**: 50+ nodes benefit from spatial organization
4. **Collaborative reviews**: Walk through connections in meetings
5. **Knowledge graphs**: Map concepts and their relationships
6. **System architecture**: Visualize component dependencies

### **When to Use Original TreeListy:**
1. **Linear planning**: Sequential phase-based projects
2. **Time-based view**: Gantt-style timeline clarity
3. **Detailed data entry**: Forms and PM tracking fields
4. **Excel integration**: Import/export spreadsheets
5. **AI analysis**: Right-click AI features

### **Best Workflow:**
1. **Plan in TreeListy**: Use forms, AI, structured data entry
2. **Visualize in Canvas**: Explore relationships, spot gaps, reorganize
3. **Execute in TreeListy**: Track with PM fields (RAG, time, owner)
4. **Review in Canvas**: Visual status reviews in meetings

---

## 🛠️ Future Enhancements

Potential features for future versions:
- [ ] Image export (PNG/SVG)
- [ ] Minimap for large canvases
- [ ] Custom node colors/styles
- [ ] Text annotations on canvas
- [ ] Connection labels/types
- [ ] Zoom to selection
- [ ] Box select (drag rectangle to select multiple)
- [ ] Node grouping/clustering
- [ ] PM tracking fields in node cards
- [ ] Real-time collaboration
- [ ] Version history/branching

---

## 📊 Example Workflow: P2C Data Center Project

1. **Load**: `p2c-econ-analysis.json` (from TreeListy)
2. **Auto-Layout**: Choose "Hierarchical" to see dependency flow
3. **Adjust**: Drag "10 MW Nil Redundancy" and "2X Redundancy" side-by-side for comparison
4. **Connect**: Shift+Click from "CAPEX estimates" to "OPEX calculations" to show flow
5. **Organize**: Drag related infrastructure items closer together
6. **Review**: Enable grid, snap nodes for presentation-ready alignment
7. **Save**: Download updated JSON with visual layout preserved

---

## 🎓 Tips & Tricks

### **Performance**
- Canvas handles 100+ nodes smoothly
- Use phases to organize large projects (better than 200 nodes in one zone)
- Force-directed layout works best with 20-80 nodes

### **Precision**
- Enable grid for pixel-perfect alignment
- Use hierarchical layout for clean dependency trees
- Double-click nodes to rename without opening forms

### **Workflows**
- **Explore mode**: Turn off grid, use force-directed, drag freely
- **Presentation mode**: Grid ON, hierarchical layout, fit to view
- **Editing mode**: Zoom in (200%+), grid ON, precise positioning

### **Connections**
- Proximity auto-connect is great for quick workflows
- Shift+drag gives you precise control over dependencies
- Use hierarchical layout to validate dependency logic (no circular deps)

---

## 🤝 Compatibility Matrix

| Source | Can Load? | Can Save? | Data Preserved? |
|--------|-----------|-----------|-----------------|
| TreeListy JSON → Canvas | ✅ Yes | ✅ Yes | ✅ 100% + canvas coords |
| Canvas JSON → TreeListy | ✅ Yes | ✅ Yes | ✅ 100% (ignores canvas) |
| Excel → Canvas | ⚠️ Via TreeListy | ⚠️ Via TreeListy | ✅ Yes |

---

## 📝 Version History

**v1.0** - Initial Release
- ✅ All 7 MVP features implemented
- ✅ 5 auto-layout algorithms
- ✅ Backward compatibility with TreeListy
- ✅ Proximity auto-connections
- ✅ Manual connection drawing
- ✅ Multi-select group drag
- ✅ Undo system (50 states)
- ✅ Phase zones with colors
- ✅ Grid snapping toggle
- ✅ Infinite pan & zoom

---

## 🙏 Credits

**TreeListy Canvas** - Built as a visual companion to TreeListy
**Inspired by**: Figma (precision), Obsidian (graph view), Miro (infinite canvas)
**Compatible with**: All TreeListy JSON files

---

**🎨 Happy Visual Thinking!**
