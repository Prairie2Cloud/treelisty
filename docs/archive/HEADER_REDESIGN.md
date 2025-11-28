# TreeListy Header Redesign - Modular & Skinnable Architecture

**Date:** 2025-11-16
**Status:** Design Proposal
**Issue:** Header has 20+ controls crowded into single row - poor UX

---

## Current Problems

1. **Too Many Controls** (21 elements in one row):
   - View toggle, New, Save, Load, Share (5)
   - Export Excel, Import Excel (2)
   - Undo, Expand, Collapse (3)
   - Pattern selector (1 large dropdown)
   - Sort selector + Reset (2)
   - Analyze Text, AI Wizard, AI Review, Auto-Enhance, Generate Prompt (5)
   - AI button (1 - duplicate)
   - API Key (1)
   - AI Mode selector (1 large dropdown)

2. **Not Modular**: Hard-coded button groups
3. **Not Skinnable**: Inline styles, no CSS variables
4. **Not Responsive**: No collapse behavior for smaller screens

---

## New Design Philosophy

### **3-Tier Architecture**

#### **Tier 1: Primary Header** (Always Visible)
Essential controls that users need constantly:
- Logo
- Pattern Selector
- View Toggle (Tree ↔ Canvas)
- **AI Menu** (dropdown consolidates all AI features)
- **Settings Menu** (dropdown consolidates system settings)

#### **Tier 2: Secondary Toolbar** (Toggleable)
Frequent but not constant actions:
- **File Tools**: New, Save, Load, Share, Export, Import
- **View Tools**: Expand, Collapse, Undo, Sort
- Toggle button: "⚡ Tools" to show/hide

#### **Tier 3: Context Menu** (Right-click)
Already exists for node operations

---

## Detailed Component Breakdown

### **Tier 1: Primary Header** (60px height)

```
[🌳 TreeListy] [📋 Generic Project ▼] [🎨 Tree View] [🤖 AI ▼] [⚙️ ▼]
```

**Components:**
1. **Logo** - Left-aligned, non-interactive
2. **Pattern Selector** - Dropdown, all 14 patterns
3. **View Toggle** - Single button, switches between Tree/Canvas
4. **AI Menu** - Dropdown with:
   - 🪄 AI Wizard
   - 🔬 AI Review
   - 🔄 Auto-Enhance
   - 🔍 Analyze Text
   - 📝 Generate Prompt
   - 🤖 AI Analysis (node-level, context menu)
   - ➕ Separator
   - AI Model Selector (moved here)
5. **Settings Menu** - Dropdown with:
   - 🔑 API Key
   - 📖 Help
   - 📤 Share
   - ✏️ Custom Pattern Names

### **Tier 2: Secondary Toolbar** (Collapsible, 50px height)

**Toggle Button:** `⚡ More Tools` (shows/hides entire toolbar)

**When Expanded:**
```
[🆕 New] [💾 Save] [📂 Load] │ [📊 Export] [📥 Import] │ [⬇️ Expand] [⬆️ Collapse] [↩️ Undo] │ [🔄 Sort By... ▼]
```

**Groups (with visual separators):**
1. **File Group**:
   - 🆕 New
   - 💾 Save
   - 📂 Load

2. **Excel Group**:
   - 📊 Export Excel
   - 📥 Import Excel

3. **View Group**:
   - ⬇️ Expand
   - ⬆️ Collapse
   - ↩️ Undo

4. **Sort Group**:
   - 🔄 Sort By... (dropdown)
   - ↺ Reset (when sorted)

---

## CSS Architecture (Skinnable)

### **CSS Custom Properties**
```css
:root {
    /* Header Colors */
    --header-bg: #14141e;
    --header-border: rgba(99, 102, 241, 0.2);
    --header-height-primary: 60px;
    --header-height-secondary: 50px;

    /* Button Colors */
    --btn-bg: rgba(255, 255, 255, 0.05);
    --btn-bg-hover: rgba(255, 255, 255, 0.1);
    --btn-border: rgba(99, 102, 241, 0.3);
    --btn-text: #e4e4e7;

    /* Group Colors */
    --group-file: linear-gradient(135deg, #059669, #10b981);
    --group-excel: linear-gradient(135deg, #1D6F42, #00A67D);
    --group-view: rgba(99, 102, 241, 0.15);
    --group-ai: linear-gradient(135deg, #a855f7, #ec4899);
    --group-settings: rgba(255, 255, 255, 0.05);

    /* Spacing */
    --header-padding: 12px 20px;
    --group-gap: 12px;
    --btn-gap: 8px;
}
```

### **Modular Class Structure**
```html
<div class="header" data-theme="default">
    <div class="header-tier-1">
        <div class="header-group" data-group="logo">...</div>
        <div class="header-group" data-group="pattern">...</div>
        <div class="header-group" data-group="view">...</div>
        <div class="header-group" data-group="ai">...</div>
        <div class="header-group" data-group="settings">...</div>
    </div>

    <div class="header-tier-2" data-collapsed="true">
        <div class="header-group" data-group="file">...</div>
        <div class="header-group" data-group="excel">...</div>
        <div class="header-group" data-group="view-tools">...</div>
        <div class="header-group" data-group="sort">...</div>
    </div>
</div>
```

### **Theming Support**
Users can switch themes via data attribute:
```javascript
header.dataset.theme = 'minimal'; // or 'classic', 'neon', 'dark', etc.
```

Each theme defined in CSS:
```css
.header[data-theme="minimal"] {
    --header-bg: #ffffff;
    --btn-bg: #f4f4f5;
    --btn-text: #18181b;
}

.header[data-theme="neon"] {
    --header-bg: #000000;
    --group-ai: linear-gradient(135deg, #00ff00, #00ffff);
    --btn-border: rgba(0, 255, 255, 0.5);
}
```

---

## Responsive Behavior

### **Desktop (> 1200px)**
- Tier 1: Full width, all controls visible
- Tier 2: Full width when expanded

### **Tablet (768px - 1200px)**
- Tier 1: Dropdowns collapse to icon-only
- Tier 2: Groups stack in 2 rows

### **Mobile (< 768px)**
- Tier 1: Logo + hamburger menu
- Tier 2: Hidden by default, shows as slide-out panel
- All features accessible via menu

---

## Dropdown Menu Structures

### **AI Menu Dropdown**
```html
<div class="dropdown-menu" data-menu="ai">
    <div class="dropdown-header">🤖 AI Tools</div>
    <button class="dropdown-item" data-action="ai-wizard">🪄 AI Wizard</button>
    <button class="dropdown-item" data-action="ai-review">🔬 AI Review</button>
    <button class="dropdown-item" data-action="auto-enhance">🔄 Auto-Enhance</button>
    <button class="dropdown-item" data-action="analyze-text">🔍 Analyze Text</button>
    <button class="dropdown-item" data-action="generate-prompt">📝 Generate Prompt</button>
    <div class="dropdown-separator"></div>
    <div class="dropdown-section">
        <div class="dropdown-label">AI Model:</div>
        <select class="dropdown-select" id="unified-ai-mode-select">
            <!-- AI model options -->
        </select>
    </div>
</div>
```

### **Settings Menu Dropdown**
```html
<div class="dropdown-menu" data-menu="settings">
    <div class="dropdown-header">⚙️ Settings</div>
    <button class="dropdown-item" data-action="api-key">🔑 API Key</button>
    <button class="dropdown-item" data-action="help">📖 Help</button>
    <button class="dropdown-item" data-action="share">📤 Share Project</button>
    <button class="dropdown-item" data-action="custom-pattern">✏️ Custom Pattern Names</button>
    <div class="dropdown-separator"></div>
    <div class="dropdown-section">
        <div class="dropdown-label">Theme:</div>
        <select class="dropdown-select" id="theme-select">
            <option value="default">Default</option>
            <option value="minimal">Minimal</option>
            <option value="neon">Neon</option>
        </select>
    </div>
</div>
```

---

## Implementation Steps

1. ✅ Create design document (this file)
2. ⏳ Create new CSS for modular header
3. ⏳ Rewrite HTML with new structure
4. ⏳ Implement dropdown menus
5. ⏳ Add toolbar toggle functionality
6. ⏳ Add responsive breakpoints
7. ⏳ Test on multiple screen sizes
8. ⏳ Deploy

---

## Benefits

1. **Cleaner UI**: 5 primary controls vs 21
2. **Better UX**: Related features grouped logically
3. **Modular**: Easy to add/remove features
4. **Skinnable**: Full theme support via CSS variables
5. **Responsive**: Works on all screen sizes
6. **Maintainable**: Data attributes for feature toggling
7. **Accessible**: Proper ARIA labels, keyboard navigation

---

## Backwards Compatibility

All existing button IDs and functionality preserved:
- Buttons moved to dropdowns keep same IDs
- All event listeners continue to work
- No breaking changes to JavaScript logic
- Users can still access all features
