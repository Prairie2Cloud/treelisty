# TreeListy Version Tracker

## Current Version
**Version:** 2.3.0
**Build:** 143
**Date:** 2025-11-20

---

## How to Update Version

### For Each New Build:
1. Increment build number in 3 places:
   - Line 9 in `treeplexity.html` (header comment)
   - Line 19-24 in `treeplexity.html` (changelog)
   - Line 1658 in `treeplexity.html` (UI display - right side below help button)
   - This file (VERSION.md)

2. Update changelog in header comment (lines 19-24)

3. Update git commit message:
   ```bash
   git commit -m "Build 117: <description of changes>"
   ```

---

## Version History

### v2.3.0 | Build 143 | 2025-11-20
**FIX: CORS Protection for ALL AI Providers - Gemini & ChatGPT Now Match Claude**

**User Insight:**
"why does the bug only seem to happen with sonnet? isn't chatgpt and gemini work the same way?"

**The Problem:**
Build 142 only fixed CORS for Claude (Deep Mode). Gemini and ChatGPT were still vulnerable to CORS errors when running from local files - they would attempt direct API calls and fail silently or show confusing errors.

**Root Cause Analysis:**
All three providers call external APIs directly:
- **Claude:** `api.anthropic.com` → Build 142 added CORS protection ✅
- **Gemini:** `generativelanguage.googleapis.com` → NO protection ❌
- **ChatGPT:** `api.openai.com` → NO protection ❌

**The Fix:**
Applied identical CORS detection to Gemini and ChatGPT:

**Gemini Protection (Lines 3052-3060):**
```javascript
if (provider === 'gemini') {
    const geminiKey = getLocalAPIKey('gemini');
    if (geminiKey) {
        // Check if running from local file - CORS will block Gemini API
        const isLocalFile = window.location.protocol === 'file:';
        if (isLocalFile) {
            console.error('❌ Gemini API blocked - running from local file');
            console.warn('💡 Gemini requires web server deployment');
            throw new Error('Gemini API requires web server deployment (CORS policy)...');
        }
        // Proceed with Gemini API call
    }
}
```

**ChatGPT Protection (Lines 3081-3089):**
```javascript
if (provider === 'openai') {
    const openaiKey = getLocalAPIKey('openai');
    if (openaiKey) {
        // Check if running from local file - CORS will block OpenAI API
        const isLocalFile = window.location.protocol === 'file:';
        if (isLocalFile) {
            console.error('❌ ChatGPT API blocked - running from local file');
            console.warn('💡 ChatGPT requires web server deployment');
            throw new Error('ChatGPT API requires web server deployment (CORS policy)...');
        }
        // Proceed with ChatGPT API call
    }
}
```

**Error Messages:**
All three providers now show consistent, helpful messages:
```
❌ [Provider] API requires web server deployment (CORS policy).

💡 Solutions:
1. Deploy to Netlify/Vercel - full [Provider] support
2. Use Claude provider - works from local files via proxy
3. Open in web server (not file://)

🔍 Running from: file://
✅ Claude has proxy fallback, [Gemini/ChatGPT] requires deployment
```

**Key Difference from Claude:**
- **Claude:** Has Netlify proxy fallback → auto-switches to Fast Mode (works from local files)
- **Gemini/ChatGPT:** No proxy fallback → shows clear error + suggests Claude or deployment

**Why This Matters:**
Users trying Gemini or ChatGPT from local files now get:
1. **Clear explanation** instead of cryptic CORS errors
2. **Actionable solutions** (deploy, use Claude, or host locally)
3. **Consistent behavior** across all three AI providers
4. **Claude advantage highlighted** (only provider with local file support via proxy)

**Files Modified:**
- `treeplexity.html` lines 3052-3060: Gemini CORS protection
- `treeplexity.html` lines 3081-3089: ChatGPT CORS protection

**Testing:**
From local files (`file://`):
- Select Gemini → Clear error message ✅
- Select ChatGPT → Clear error message ✅
- Select Claude → Auto-switches to proxy (works) ✅

---

### v2.3.0 | Build 142 | 2025-11-20
**FIX: Auto-Switch Deep Mode to Fast Mode on Local Files - Eliminate CORS Errors**

**User Issue:**
```
❌ Pattern Detection Failed
Deep Mode requires direct API access, but browser blocked the request (CORS policy).
```

**Root Cause:**
When running TreeListy from local files (file:// protocol), browsers block direct API calls to external services (like api.anthropic.com) due to CORS (Cross-Origin Resource Sharing) security policy. This prevented Deep Mode from working when opening treeplexity.html directly from disk.

**The Fix:**
Added auto-detection for local file access and intelligent mode switching:

**Lines 3117-3133: Auto-Detection & Fallback**
```javascript
// Auto-detect local file access (file:// protocol)
const isLocalFile = window.location.protocol === 'file:';

if (useExtendedThinking && localApiKey) {
    if (isLocalFile) {
        console.warn('⚠️ Deep Mode requested but running from local file');
        console.warn('🔄 Auto-switching to Fast Mode (Netlify proxy) to avoid CORS');
        console.warn('💡 Deploy to web server for full Deep Mode support');

        // Fall through to Fast Mode (Netlify proxy)
        // Works from local files, has 10s timeout limit
    } else {
        // Running from web server - use direct API for Deep Mode
        // No timeout limit, full extended thinking support
    }
}
```

**How It Works:**
1. **Check protocol**: Detect if running from `file://` vs `https://`
2. **Auto-switch**: When local + Deep Mode requested → use Fast Mode instead
3. **Transparent fallback**: User gets working AI (via Netlify proxy) instead of CORS error
4. **Clear logging**: Console shows what happened and why

**User Experience:**

**Before (Build 141):**
- Select Deep Mode → CORS error ❌
- Modal shows error → user confused
- Must manually switch to Fast Mode or deploy

**After (Build 142):**
- Select Deep Mode → auto-switches to Fast Mode ✅
- Console explains: "Running from local file - using Fast Mode"
- AI works immediately via Netlify proxy
- No error, no confusion

**Technical Details:**

**CORS Background:**
- Browsers block `file://` → `https://api.anthropic.com` requests
- Security policy prevents local files from accessing external APIs
- Netlify proxy functions work because they're server-side

**Mode Comparison:**
- **Deep Mode (Direct API)**: No timeout, extended thinking (15-30s), requires web server
- **Fast Mode (Netlify Proxy)**: 10s timeout, works from local files, still very capable

**Console Output:**
```
⚠️ Deep Mode requested but running from local file
🔄 Auto-switching to Fast Mode (Netlify proxy) to avoid CORS
💡 Deploy to web server for full Deep Mode support
ℹ️ Running from local file - using Fast Mode instead of Deep Mode to avoid CORS errors
✅ Fast Mode still works great from local files via Netlify proxy
```

**Why This Matters:**
Users developing locally or testing TreeListy directly from downloaded files no longer hit CORS errors. The auto-switch is transparent and graceful - they get working AI immediately instead of a confusing error message. For extended thinking needs, they still see the recommendation to deploy to a web server.

**Files Modified:**
- `treeplexity.html` lines 3117-3149: Auto-detection and intelligent mode switching

---

### v2.3.0 | Build 141 | 2025-11-20
**FIX: Tree View Scroll Position - Eliminate Recentering on Expand/Collapse**

**Bug Report:**
"bug: treeview: each time a node is collapsed or expanded the entire tree is recentered on the screen. Desired behavior: the tree is not recentered (tree looks stationary except for expanding/collapsing node area)"

**Root Cause:**
The code was only preserving vertical scroll position (`scrollTop`) but NOT horizontal scroll position (`scrollLeft`). TreeListy's horizontal tree layout requires both to stay stationary.

**The Fix:**
Updated 8 scroll preservation locations to preserve BOTH scroll axes:

**Before (buggy):**
```javascript
const scrollPos = treeContainer ? treeContainer.scrollTop : 0;
render();
setTimeout(() => {
    treeContainer.scrollTop = scrollPos;
}, 0);
```

**After (fixed):**
```javascript
const scrollTop = treeContainer ? treeContainer.scrollTop : 0;
const scrollLeft = treeContainer ? treeContainer.scrollLeft : 0;
render();
setTimeout(() => {
    treeContainer.scrollTop = scrollTop;
    treeContainer.scrollLeft = scrollLeft;
}, 0);
```

**Fixed Locations:**
1. **Line 7560-7573:** Filesystem pattern expand/collapse
2. **Line 7521-7531:** Filesystem pattern canvas visibility toggle
3. **Line 7706-7719:** Standard table layout expand/collapse
4. **Line 7681-7691:** Standard table layout canvas visibility toggle
5. **Line 7906-7919:** Item expand/collapse (close panel)
6. **Line 7927-7940:** Item expand/collapse (open panel)
7. **Line 8066-8079:** Subtask expand/collapse (close panel)
8. **Line 8087-8100:** Subtask expand/collapse (open panel)

**Testing:**
1. Load welcome tree in Tree View
2. Scroll horizontally to middle of tree
3. Expand/collapse any node → Tree stays stationary
4. Scroll vertically and horizontally
5. Click eye icon to toggle Canvas visibility → Tree stays stationary

**Why This Matters:**
TreeListy's horizontal tree layout (phases flow left-to-right) makes horizontal scroll position critical. Users were frustrated by the tree "jumping" on every interaction. Now expand/collapse feels instant and smooth - the tree stays exactly where you expect it.

---

### v2.3.0 | Build 140 | 2025-11-20
**FEATURE: Selective Canvas Visibility - Show/Hide Phases with Eye Icon Toggle**

**The Discovery:**
User discovered an interesting bug: Only Phase 0 was showing in Canvas View because the welcome tree had phases nested inside each other instead of as siblings. User insight: "Seems like a cool feature to be able to selectively show parts of tree in canvas view" → Request: "build the feature"

**What Changed:**

**1. Phase Visibility Toggle (Lines 7603-7617, 7483-7495)**
- **Eye icon button (👁️):** Added to every phase header in Tree View
- **Click to toggle:** Show/hide that phase in Canvas View
- **Visual feedback:** Button opacity changes (100% visible, 30% hidden)
- **Tooltip:** Hover shows current state ("Hide from Canvas View" / "Show in Canvas View")
- **Works in both patterns:** Standard table layout + filesystem tree layout

**2. Canvas Rendering Logic (Lines 4168-4172)**
- **Check `showInCanvas` flag:** Skip rendering phases where `showInCanvas === false`
- **Default behavior:** All phases visible (backward compatible with existing trees)
- **Console logging:** Shows which phases are being skipped

**3. Welcome Tree Structure Fix**
- **Bug:** Phases 1, 2, 3 were nested inside Phase 0 (only Phase 0 visible in Canvas)
- **Fix:** Restructured all 4 phases as siblings under root
- **Smart defaults:** Phase 0 visible, Phases 1-3 hidden initially (preserves current behavior)
- **Python script:** `fix_welcome_phases.py` for automated restructuring

**Technical Implementation:**

**Data Model:**
```javascript
phase.showInCanvas = true/false  // Default: true (undefined treated as true)
```

**Rendering Logic:**
```javascript
// renderCanvas() - Line 4168
capexTree.children.forEach((phase, phaseIdx) => {
    if (phase.showInCanvas === false) {
        console.log(`Skipping phase "${phase.name}" - hidden in Canvas View`);
        return; // Skip this phase
    }
    // ... render phase items
});
```

**UI Toggle:**
```javascript
// Event listener - Lines 7638-7660, 7514-7536
toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    node.showInCanvas = !(node.showInCanvas !== false);
    render();  // Update button appearance
    if (currentView === 'canvas') renderCanvas();  // Update canvas
});
```

**Use Cases:**

**1. Phased Rollout:**
- Start with Phase 0 (Onboarding)
- Toggle Phase 1 (Examples) when ready to explore
- Progressive revelation for new users

**2. Focus Mode:**
- Hide completed phases to reduce visual clutter
- Focus on current phase in Canvas View
- All phases still visible in Tree View

**3. Presentation Mode:**
- Show only relevant phases for stakeholder demos
- Hide "behind the scenes" implementation details
- Cleaner Canvas View for screenshots

**4. Large Projects:**
- Selectively show phases to reduce Canvas node count
- Improve performance with 100+ items across many phases
- Better visual organization

**Why This Matters:**
What started as a bug became a requested feature. The user's insight - "could this be a feature?" - led to building selective Canvas visibility. Now users control what they see in Canvas View while maintaining full access in Tree View. Perfect for progressive disclosure, presentations, and managing visual complexity.

**Files Modified:**
- `treeplexity.html` - Canvas rendering logic, phase UI toggles (lines 4168-4172, 7603-7617, 7483-7495, 7634-7662, 7510-7538)
- `welcome-to-treelisty.json` - Restructured phases as siblings, added showInCanvas flags
- `fix_welcome_phases.py` - Automated script to fix nested phase structure

**Testing:**
1. Load welcome tree → Only Phase 0 visible in Canvas (Phases 1-3 hidden)
2. Click eye icon on Phase 1 → Phase 1 items appear in Canvas
3. Toggle back → Phase 1 disappears from Canvas
4. Tree View shows all phases regardless of Canvas visibility

---

### v2.3.0 | Build 139 | 2025-11-20
**FEATURE: Ctrl+Click Multi-Select & Group Drag - Making Good on Build 138's Promises**

**What Changed:**
Build 138 exposed that we were falsely claiming Ctrl+Click multi-select existed. Build 139 makes it real.

**1. Ctrl+Click Multi-Select (Lines 4595-4659)**
- **Ctrl+Click any node:** Toggles it in/out of selection
- **Normal click:** Clears all selections, selects only clicked node
- **Visual feedback:** Selected nodes get blue glow + checkmark badge (CSS lines 1417-1447)
- **Selection counter:** Shows "X nodes selected" at top of canvas (lines 20794-20797)
- **Deselect:** Ctrl+Click selected node again to remove from selection

**2. Group Drag - Already Existed! (Lines 4759-4761, 5459-5501)**
- **Middle-click drag selected node:** Moves entire group together
- **Maintains relative positions:** Group stays arranged as you positioned them
- **Grid snapping:** Works for entire group when enabled
- **Recursive children:** Drags all children of selected nodes too

**3. Keyboard Shortcuts (Lines 6064-6106)**
- **Ctrl+A:** Select all visible nodes in Canvas View
- **Escape:** Clear selection
- **Smart context awareness:** Only works in Canvas View, not when typing in text fields

**4. Selection Management**
- **Clear on empty space click:** Click canvas background to deselect all (unless Ctrl held)
- **updateSelectionCounter():** Helper function to show/hide counter (lines 4798-4810)
- **clearSelection():** Enhanced to update counter (line 4866)

**Technical Implementation:**
- **Click handler modification:** Checks `e.ctrlKey || e.metaKey` to detect modifier keys
- **selectedNodes array:** Global array tracking currently selected node data objects
- **isDraggingSelection flag:** Triggers group drag logic in mousemove handler
- **Visual feedback:** `.selected` class with checkmark pseudo-element, `.dragging-group` class during drag

**Updated Welcome Tree:**
- Updated "Drag nodes around to rearrange" description to document Ctrl+Click multi-select and keyboard shortcuts
- Now accurately reflects implemented features (Build 138's honesty + Build 139's delivery)

**Success Criteria Met:**
✅ User can Ctrl+Click to add/remove nodes from selection
✅ Selection count shows accurate number
✅ Visual feedback is clear (blue glow, checkmark badge)
✅ User can middle-click drag multiple selected nodes together
✅ Relative positions maintained during group drag
✅ Grid snapping works for entire group
✅ Keyboard shortcuts work (Ctrl+A, Escape)
✅ No regressions in single-node drag, expand/collapse, or zoom/pan

**Implementation Stats:**
- **New Code:** ~135 lines (click handler: 65, CSS: 30, keyboard shortcuts: 40)
- **Modified Code:** ~15 lines (clearSelection enhancement)
- **Group drag:** Already existed, just needed multi-select to unlock it
- **Testing:** Manual testing in Canvas View with multiple nodes

**Why This Matters:**
Build 138 caught us making false claims. Build 139 proves we can turn those claims into reality. TreeListy now genuinely supports professional multi-node selection and manipulation - a feature users expect from modern visual tools.

---

### v2.3.0 | Build 138 | 2025-11-20
**FIX: Corrected False Feature Claims in Welcome Tree - Honest Marketing**
- FIX: Removed claims about Ctrl+Click multi-select (NOT implemented)
- FIX: Removed claims about group drag (NOT implemented - requires multi-select first)
- ACCURACY: Corrected layout algorithm count from 5 to 6 (Hierarchical, Timeline, Force-Directed, Radial, Grid, + manual)
- HONESTY: Removed misleading "Tree (hierarchical)" distinction - there's only one Hierarchical layout
- TRANSPARENCY: Welcome tree now accurately reflects only actually implemented features

**User Question:**
"Does Treelisty actually do all the things described in the welcome tree? e.g. ctrl+left(click)=multi select"

**Verification Process:**
Systematically verified every claim in `welcome-to-treelisty.json` against actual codebase implementation.

**Features CLAIMED vs ACTUALLY IMPLEMENTED:**

✅ **ACCURATE CLAIMS (Verified in Code):**
1. "Drag nodes around to rearrange" - YES, implemented (lines 4685, 5413 in treeplexity.html)
2. "Scroll mouse wheel to zoom in/out" - YES, implemented (lines 2565-2574, 5549)
3. "Zoom from 10% to 500%" - YES, verified
4. "Pan by dragging empty space" - YES, implemented
5. "Click 'Grid' to snap everything perfectly" - YES, grid snapping (lines 4755, 5418-5420)
6. "Auto-layout algorithms" - YES, but wrong count (see below)
7. "Force-Directed (physics simulation)" - YES, implemented with Barnes-Hut optimization (line 5083)
8. "Toggle between Tree View and Canvas View" - YES, implemented

❌ **FALSE CLAIMS (Not Implemented):**
1. **"Multi-select with Ctrl+Click"** - NO
   - Click handler (line 4595 in treeplexity.html) does NOT check for `e.ctrlKey`
   - Simply selects clicked node and clears all other selections
   - No multi-selection mechanism exists

2. **"Drag groups together"** - NO
   - Code exists for `isDraggingSelection` (line 5361) and `selectedNodes` array (line 4000)
   - BUT multi-select isn't implemented, so you can't create a group to drag
   - Feature is partially scaffolded but not accessible to users

🟡 **MISLEADING CLAIMS (Partially True):**
1. **"5 auto-layout algorithms: Tree (hierarchical), Timeline (left-to-right), Hierarchical (top-down), Force-Directed (physics simulation), Radial (circular)"**
   - ACTUAL: 6 algorithms available in dropdown (lines 20678-20683):
     - Hierarchical (top-down tree)
     - Timeline (left-to-right)
     - Force-Directed (physics simulation)
     - Radial (circular)
     - Grid (organized grid)
     - Auto-Layout (default smart positioning)
   - MISLEADING: Claims "Tree (hierarchical)" and "Hierarchical (top-down)" as separate - they're the same layout
   - WRONG COUNT: Claims 5, actually 6 (or 5 if you don't count Auto-Layout default)

**Code Evidence:**

**Ctrl+Click Multi-Select - NOT IMPLEMENTED:**
```javascript
// Line 4595 - Canvas node click handler
node.addEventListener('click', (e) => {
    console.log('Left-click detected on:', item.name);
    e.stopPropagation();

    // Set as active node
    activeNode = item;

    // Highlight selected node
    document.querySelectorAll('.canvas-node').forEach(n => n.classList.remove('selected'));
    node.classList.add('selected');  // ❌ Clears all other selections - no Ctrl+Click check!

    // ... rest of handler
});
```

**Ctrl+Key IS Used Elsewhere (proof they know about it):**
```javascript
// Line 5317 - Clear selection when clicking empty space
if (selectedNodes.length > 0 && !e.ctrlKey) {
    clearSelection();  // ✅ Uses e.ctrlKey here, so they know about it
}

// Line 5932 - Undo shortcut
if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    // ✅ Uses Ctrl key detection for undo
}
```

**Multi-Select Infrastructure Exists But Isn't Wired Up:**
```javascript
// Line 4000 - selectedNodes array exists
let selectedNodes = [];

// Line 5361 - Group drag code exists
if (isDraggingSelection && selectedNodes.length > 0) {
    // Move all selected nodes together
    selectedNodes.forEach(nodeData => {
        // ... group drag logic
    });
}
```
**Problem:** There's NO WAY to populate `selectedNodes` array via UI. The infrastructure is there but not accessible.

**Fixes Applied:**

**Before Build 138:**
```json
{
  "name": "Drag nodes around to rearrange",
  "description": "Click and drag any node. Multi-select with Ctrl+Click. Drag groups together!",
  "notes": "Try the Auto-Layout dropdown: Tree, Timeline, Hierarchical, Force-Directed, Radial"
}
```

**After Build 138:**
```json
{
  "name": "Drag nodes around to rearrange",
  "description": "Click and drag any node to reposition. Nodes snap to grid when Grid mode is enabled.",
  "notes": "Try the Auto-Layout dropdown: Hierarchical, Timeline, Force-Directed, Radial, Grid (6 algorithms)"
}
```

**Also Fixed:**
```json
// Before:
{
  "name": "🎨 Explore Canvas View",
  "description": "5 auto-layout algorithms: Tree (hierarchical), Timeline (left-to-right), Hierarchical (top-down), Force-Directed (physics simulation), Radial (circular). Try them all!",
  "notes": "Drag nodes, multi-select (Ctrl+Click), group drag, zoom 10%-500%, grid snapping..."
}

// After:
{
  "name": "🎨 Explore Canvas View",
  "description": "6 auto-layout algorithms: Hierarchical (top-down tree), Timeline (left-to-right), Force-Directed (physics simulation), Radial (circular), Grid (organized grid). Plus manual positioning. Try them all!",
  "notes": "Drag individual nodes, zoom 10%-500%, grid snapping, pan by dragging empty space..."
}
```

**Impact:**
- ✅ **Honest Marketing:** Welcome tree no longer promises features that don't exist
- ✅ **User Trust:** New users won't be disappointed by missing features
- ✅ **Accurate Documentation:** Feature list matches actual implementation
- ✅ **Clear Roadmap:** Removed features can be added to future roadmap if desired

**Future Feature Candidates (Currently Not Implemented):**
1. Ctrl+Click multi-select
2. Group drag (depends on multi-select)
3. Shift+Click range select
4. Rubber-band selection (drag rectangle to select multiple)

**Files Modified:**
- `welcome-to-treelisty.json` - Removed false claims, corrected algorithm count

**Lesson Learned:**
Always verify marketing claims against actual code implementation before shipping welcome trees or demo content. What was likely copy-pasted from roadmap/wishlist got presented as current features.

### v2.3.0 | Build 137 | 2025-11-20
**FIX: Welcome Tree Polish - "Undefined" Nodes, Complete Fields, Getting Started**
- FIX: Resolved "undefined" node names in Canvas View by adding icons to all items and subtasks
- ENHANCEMENT: Added complete PM fields (assignee, priority, progress) to all subtasks
- UX: Enhanced root description with comprehensive getting started instructions
- POLISH: Contextual icons for 30+ nodes based on content and function

**User Report:**
Screenshot showing Canvas View with multiple "undefined" nodes. Three bugs identified:
1. "undefined" is not good name for node
2. Add complete field details to fill out details panel in some subtasks
3. Need getting started intro

**Root Cause:**
1. **"undefined" nodes:** Items and subtasks in `welcome-to-treelisty.json` lacked "icon" fields. Canvas View tried to render icons and displayed "undefined" when field missing.
2. **Incomplete detail panel:** Subtasks only had basic fields (name, description, pmStatus). Missing PM tracking fields (assignee, priority, progress) left detail panel sparse.
3. **No getting started:** Root description was generic tagline, no actionable instructions for first-time users.

**Solution - Automated Python Script:**
Created `fix_welcome_tree.py` to systematically enrich the welcome tree:

**1. Icon Assignment (contextual, not random):**
- Tutorial actions: 👆 drag/click, 🔍 zoom, ⚡ grid snap, 🖱️ right-click
- Content types: 📚 phases, 📦 items, 📝 subtasks
- Travel: 1️⃣ Day 1, 2️⃣ Day 2, 3️⃣ Day 3, 🏨 accommodation, 🍜 food
- Business: 💰 funding, 🏢 lease, 📋 permits, ⚙️ equipment, 🎉 grand opening
- Creative: 📝 pre-production, 🎥 production, ✂️ post-production
- AI tools: 💡 Smart Suggest, 🧙 AI Wizard, 📄 Analyze Text, 🔬 AI Review
- Patterns: 🤔 philosophy, 💼 sales, 🎬 film, ⚡ quick mode, 🧠 deep mode
- CTAs: 🎯 choose pattern, ➕ start fresh, 📤 share, 🎨 canvas

**2. PM Field Enrichment:**
- `pmAssignee`: "Unassigned" (default for tutorial content)
- `pmPriority`: "Medium" (standard priority)
- `pmProgress`:
  - 100 for "Done" status
  - 50 for "In Progress" status
  - 0 for "To Do" status

**3. Enhanced Getting Started Instructions:**
```
🎉 Welcome to TreeListy - Your Fractal Playground!

This interactive tour teaches TreeListy BY SHOWING, not telling.

🚀 START HERE:
1. Click '🎨 Canvas' button (top right) to see this tree come alive
2. Explore Phase 1 (✨ See What's Possible) - real examples like Kyoto trip, Coffee shop, Film doc
3. Try Phase 2 (🤖 AI Superpowers) - right-click any field and select '✨ AI Suggest'
4. Ready to build? Phase 3 shows you how!

💡 PRO TIP: Toggle between Tree View and Canvas View anytime. Your data is always safe!
```

**Before Build 137:**
```json
{
  "id": "sub-0-1-1",
  "name": "Drag nodes around to rearrange",
  "description": "Click and drag any node...",
  "type": "subtask",
  "pmStatus": "To Do",
  "dependencies": [],
  "subItems": []
}
```
**Canvas View:** Displays "undefined" for icon field

**After Build 137:**
```json
{
  "id": "sub-0-1-1",
  "name": "Drag nodes around to rearrange",
  "description": "Click and drag any node...",
  "type": "subtask",
  "pmStatus": "To Do",
  "dependencies": [],
  "subItems": [],
  "icon": "👆",
  "pmAssignee": "Unassigned",
  "pmPriority": "Medium",
  "pmProgress": 0
}
```
**Canvas View:** Displays 👆 icon, detail panel shows complete PM tracking

**Impact:**
- ✅ **Canvas View:** No more "undefined" nodes - all 30+ nodes have contextual icons
- ✅ **Detail Panel:** Rich PM tracking for all subtasks (assignee, priority, progress)
- ✅ **Onboarding:** Clear getting started instructions with 4-step quick start
- ✅ **User Experience:** Professional polish - icons convey meaning at a glance
- ✅ **Consistency:** All nodes in welcome tree follow same complete field structure

**Files Modified:**
- `welcome-to-treelisty.json` - Enriched with icons and PM fields (578 lines)
- `fix_welcome_tree.py` - NEW automated enrichment script

**Technical Details:**
Script processes tree recursively:
1. Phases → Items → Subtasks → Nested Subtasks
2. Assigns contextual icons based on name content (not random emoji)
3. Adds PM fields if missing (preserves existing values)
4. Handles "Done" (100%), "In Progress" (50%), "To Do" (0%) progress mapping
5. Recursive processing ensures nested subtasks also enriched

**Example Enrichment:**
- "Drag nodes around" → 👆 (hand pointing, drag action)
- "Scroll mouse wheel to zoom" → 🔍 (magnifying glass, zoom action)
- "Secure funding ($150K)" → 💰 (money bag, financial action)
- "Grand Opening!" → 🎉 (party popper, celebration)
- "Pre-production: Storyboard" → 📝 (memo, planning action)
- "Production: 5 days of filming" → 🎥 (camera, filming action)
- "Post-production: Edit & Color Grade" → ✂️ (scissors, editing action)

### v2.3.0 | Build 136 | 2025-11-20
**NEW: "Welcome to TreeListy" Fractal Playground - Perfect Onboarding Experience**
- NEW: Created `welcome-to-treelisty.json` - comprehensive introduction tree for new users
- UX: Hybrid design combining Gemini's self-demonstrating tutorial + concrete inspiring examples
- CONTENT: 4 progressive phases designed for email share link delivery

**User Request:**
"Please think step by step and consider what new default tree we could design that would be the perfect introduction to new users of treelisty. A share link would be sent to them via email. The tree should excite the newby but also titilate with treelisty's potential. The default tree should suggest how treelisty could be useful and make them want to try to either make their own tree or analyze some input into a tree."

**Design Philosophy - "The Fractal Playground":**
Combined two approaches:
1. **Gemini's Meta-Tutorial:** Self-demonstrating structure teaching TreeListy through interactive examples
2. **Claude's Concrete Examples:** Emotionally resonant real-world use cases (travel, business, creative)

**Result:** Hybrid tree that teaches BY showing, inspires BY concrete examples, and converts BY clear CTAs.

**Structure (4 Phases, 13 Items, 30+ Subtasks):**

**Phase 0: 👀 Start Here (Visual Tour & Basics)**
- 🎨 Switch to Canvas View
  - Drag nodes around to rearrange
  - Scroll mouse wheel to zoom in/out
  - Click 'Grid' to snap everything perfectly
- 📂 How Hierarchy Works
  - Phases hold Items (major stages)
  - Items hold Subtasks (components)
  - Subtasks can nest infinitely (with nested example!)

**Phase 1: ✨ See What's Possible (Real Examples That Inspire)**
- 🌏 Weekend in Kyoto, Japan ($800 budget)
  - Day 1: Fushimi Inari 10,000 Gates (Free, 4 hours)
  - Day 2: Arashiyama Bamboo Grove & Monkey Park ($15, depends on Day 1)
  - Day 3: Traditional Tea Ceremony ($85, depends on Day 2)
  - Accommodation: Ryokan near Gion ($400)
  - Food & Transportation ($300)
  - **Shows:** Budget rollup ($800 = $0 + $15 + $85 + $400 + $300), dependency chains, progress tracking (35% complete)

- ☕ Launch Coffee Shop in 6 Months ($150K)
  - Secure funding ($150K, 2 months)
  - Lease commercial space (BLOCKED until funding)
  - Get permits & licenses (BLOCKED until lease)
  - Buy equipment ($50K, BLOCKED until funding + lease)
  - Grand Opening! (BLOCKED until permits + equipment)
  - **Shows:** Critical dependency chains, "Blocked" status, business planning, realistic timeline

- 🎬 Film a Short Documentary ($5K, 3 months)
  - Pre-production: Storyboard & Budget ($500, 3 weeks)
  - Production: 5 days of filming ($2K, BLOCKED until pre-production)
  - Post-production: Edit & Color Grade ($2.5K, BLOCKED until production)
  - **Shows:** Creative workflow, phase progression, cost breakdown

**Phase 2: 🤖 AI Superpowers (Right-Click Magic)**
- 💡 Smart Suggest - Context-Aware Field Completion
  - Step 1: Double-click this item to open Edit Form
  - Step 2: Right-click any field label
  - Step 3: Select '✨ AI Suggest' from menu
  - **Interactive:** Explicit instructions to try AI features NOW

- 🧙 AI Wizard - Conversational Tree Building
  - AI asks 5-6 questions about your project
  - After each answer, tree grows automatically
  - Click 'Finish & Apply' when satisfied

- 📄 Analyze Text - Document to Tree Conversion
  - Quick Mode: Fast structure extraction (30s)
  - Deep Mode: Extended Thinking analysis (2min)

- 🔬 AI Review - Quality Analysis
  - Comprehensive tree review with severity ratings

**Phase 3: 🚀 Build Your Own (Ready to Create?)**
- 🎯 Choose Your Pattern (16 specialized patterns)
  - Generic: Universal project planning ✅ Done
  - Philosophy: Plato's Cave, Hegel's dialectics
  - Sales: Pipeline, deals, quarters, forecasting
  - Film: Scenes, shots, Sora/Veo prompts

- ➕ Start Fresh or Use AI Wizard
- 📤 Share Your Tree (LZString compression URLs)
- 🎨 Explore Canvas View (5 auto-layout algorithms)

**Key Features Demonstrated:**
1. ✅ Budget aggregation ($800 rolls up from 5 subtasks)
2. ✅ Dependency chains (Day 2 depends on Day 1, Grand Opening depends on Permits + Equipment)
3. ✅ PM tracking (Status: Done/In Progress/To Do/Blocked, Progress: 35%, 50%, 100%)
4. ✅ Real costs ($0, $15, $85, $400, $150K, $50K)
5. ✅ Phase progression (4 phases, nested 4 levels deep)
6. ✅ Interactive tutorials (explicit "RIGHT-CLICK THIS FIELD" instructions)
7. ✅ Pattern versatility (Travel, Business, Creative, Tutorial content in one tree)
8. ✅ Canvas View optimization (designed to look spectacular with auto-layout)
9. ✅ AI integration (Smart Suggest, AI Wizard, Analyze Text, AI Review all explained)
10. ✅ Clear CTAs (Choose Pattern, Start Fresh, Share, Explore Canvas)

**Email Delivery Template:**
```
Subject: Welcome to TreeListy! 🌳 Your Fractal Playground Awaits

Hi [Name],

Welcome to a new way of thinking about complexity.

Instead of reading a manual, we built you a Fractal Playground -
an interactive introduction that shows TreeListy's power through real examples.

🚀 Launch Your TreeListy Playground:
[SHARE LINK FROM welcome-to-treelisty.json]

Try this first:
1. Click "🎨 Canvas" in the top bar to see the spectacular visual layout
2. Explore the Kyoto trip example (Phase 1) - watch budget roll up from $800 worth of activities
3. Check the Coffee Shop example - see dependencies in action
4. Right-click any description and try ✨ AI Suggest for instant expert help

When you're ready:
- Use AI Wizard to build your own tree conversationally
- Try Analyze Text to convert any document into a tree
- Choose from 16 specialized patterns (Philosophy, Sales, Film, Events, Fitness, Strategy...)

Happy decomposing!
- The TreeListy Team

P.S. Toggle between Tree View and Canvas View anytime - zero data loss, infinite possibilities.
```

**Files Created:**
- `welcome-to-treelisty.json` (578 lines, fully-formed introduction tree)

**Why This Works:**
1. **Instant Visual Hook:** Canvas View instruction in Phase 0 (spectacular first impression)
2. **Emotional Connection:** Kyoto trip is universally inspiring (everyone dreams of travel)
3. **Demonstrates Complexity:** Coffee shop shows critical dependencies (business planning use case)
4. **Shows Creativity:** Film doc demonstrates creative workflow
5. **Interactive Learning:** Explicit "RIGHT-CLICK THIS" instructions remove friction
6. **Pattern Versatility:** One tree showcases travel, business, creative, and tutorial content
7. **Clear CTAs:** Phase 3 presents 4 clear next steps (Pattern, New/Wizard, Share, Canvas)
8. **Budget Demonstration:** $800 = $0 + $15 + $85 + $400 + $300 (rollup magic visible)
9. **Dependency Visualization:** Coffee shop has 5-level dependency chain (shows arrows in Canvas)
10. **AI Integration:** All 4 AI tools explained with use cases

**Impact:**
New users now receive a **complete interactive tour** via email share link that:
- Teaches TreeListy through self-demonstration
- Inspires with concrete, relatable examples
- Showcases all major features (Canvas, AI, patterns, dependencies, budget tracking)
- Converts with clear CTAs and low-friction next steps

### v2.3.0 | Build 135 | 2025-11-20
**AI Expert Enhancement: Field Instructions for 6 Patterns**
- ENHANCEMENT: Implemented field-level instructions for 6 patterns (Event Planning, Fitness, Strategy, Course Design, Family Tree, Dialogue)
- AI EXPERTS: Elevated 6 patterns from "Name Only" to "Deeply Engineered" status with specialized domain expertise
- QUALITY: Smart Suggest and AI Wizard now provide expert guidance for all 16 patterns

**Background:**
Gemini's architectural assessment identified 6 patterns with only basic name-level expertise:
1. Event Planning
2. Fitness Program
3. Strategic Planning
4. Course Design
5. Family Tree
6. Dialogue & Rhetoric

These patterns had pattern expert prompts (`buildPatternExpertPrompt()`) but lacked field-level instructions (`buildFieldInstructions()`), resulting in "Name Only" quality vs "Deeply Engineered" quality of other patterns.

**Implementation (lines 9953-10059 in treeplexity.html):**

**1. Event Planning (lines 9953-9967):**
- Budget estimation based on activity type (Catering: $25-75/person, Venue: $2-10K, AV: $1-5K)
- Vendor selection with specialization (e.g., "ABC Catering - Corporate Events")
- Booking deadlines by vendor type (Venues: 6-12 months, Catering: 2-3 months)
- Guest count ranges by event type (Corporate: 50-500, Wedding: 100-250)
- Location specificity ("Grand Ballroom, 2nd floor" not "Hotel")
- Role-based responsibility assignment (Event Manager, AV Coordinator, etc.)
- Key considerations: contracts, backup plans, permits, weather contingencies

**2. Fitness Program (lines 9969-9984):**
- Set schemes by training goal (Hypertrophy: 3-4, Strength: 5+, Endurance: 2-3)
- Rep ranges by adaptation (Strength: 3-6, Hypertrophy: 8-12, Endurance: 15+)
- Biomechanical form cues with joint angles and injury prevention
- Rest periods by energy system (Strength: 3-5min CNS, Hypertrophy: 60-90s metabolic)
- Progression variables (load, volume, tempo, rest)
- Equipment selection and setup safety
- Injury prevention cues with anatomical references
- Expert persona: CSCS (Certified Strength & Conditioning Specialist)

**3. Strategic Planning (lines 9986-10000):**
- Investment sizing by initiative type (Technology: $100K-$5M, Market expansion: $500K-$10M)
- SMART KPIs with specific targets (Revenue growth %, CAC, Market share)
- C-level ownership mapping (CEO: transformation, CFO: financial, CTO: technology)
- Risk assessment by likelihood and impact
- Timeline estimation with milestones
- Success criteria with measurable targets
- Strategic rationale aligned to business objectives
- Expert persona: McKinsey/BCG strategy consultant

**4. Course Design (lines 10002-10017):**
- Learning objectives using Bloom's Taxonomy action verbs (Remember: define, Understand: explain, Apply: demonstrate, Analyze: compare, Evaluate: judge, Create: design)
- Difficulty levels based on cognitive complexity and prerequisite knowledge
- Assessment matching to learning objectives (Quiz: remember/understand, Project: analyze/create)
- Duration estimation per Bloom's level and content density
- Prerequisites identification for learning scaffolding
- Materials and resources for active learning
- Expert persona: Instructional designer (ADDIE model, Bloom's Taxonomy)

**5. Family Tree (lines 10019-10043):**
- Birth/death date estimation by historical era (pre-1900: 40-60 lifespan, modern: 70-85)
- Marriage date calculations based on historical marriage ages
- Historically appropriate occupations ("Locomotive Engineer" not "Railroad worker")
- DNA information: Y-DNA haplogroups (paternal), mtDNA (maternal), ethnic percentages
- Source citations: Census records (1850-1940 US), birth/death certificates, church records
- Relationship mapping with generational awareness
- Migration patterns and locations
- Expert persona: Genealogist (NGSQ standards - National Genealogical Society Quarterly)

**6. Dialogue & Rhetoric (lines 10045-10059):**
- Speaker identification with context (Name, role, affiliation, expertise)
- Verbatim quote extraction with tone indicators
- Rhetorical device identification (Logos, Pathos, Ethos, Metaphor, Analogy, Repetition)
- Logical structure breakdown (Premise 1 → Premise 2 → Conclusion)
- Fallacy detection (Ad hominem, Straw man, Slippery slope, False dichotomy, Appeal to emotion)
- Hidden motivation analysis (Political positioning, deflection, rallying base)
- Counter-argument formulation
- Expert persona: Rhetoric expert (Aristotelian persuasion, critical discourse analysis)

**Impact:**
All 16 patterns now have comprehensive field-level instructions with:
- Specific value ranges and examples
- Domain best practices and standards
- Industry benchmarks
- Expert personas (CSCS, McKinsey/BCG, NGSQ, Bloom's Taxonomy, etc.)
- Fallback instructions for unmapped fields

This elevates Smart Suggest and AI Wizard quality from generic suggestions to expert-level, domain-specific guidance across all patterns.

### v2.3.0 | Build 134 | 2025-11-20
**UX Fix: AI Tools Panel Overlap with AI Wizard**
- FIX: Moved AI Tools Panel from lower right to lower left
- UX: AI Tools Panel and AI Wizard no longer overlap
- LAYOUT: Both panels now accessible without blocking interaction

**User Report:**
"The AI Tools Console appears on the lower right and blocks interaction with AI Wizard in same location. Resolution: Move AI Tools console to lower left of screen and out of the way."

**Before Build 134:**
- AI Tools Panel: `position: fixed; bottom: 20px; right: 20px;` (lower right)
- AI Wizard: `justify-content: flex-end` (slides in from right)
- Both on right side → overlap → blocked interaction

**After Build 134:**
- AI Tools Panel: `position: fixed; bottom: 20px; left: 20px;` (lower left) ✅
- AI Wizard: Still on right side (unchanged)
- No overlap → both accessible

**Implementation:**
- Line 1705: Changed `right: 20px` to `left: 20px`

### v2.3.0 | Build 133 | 2025-11-20
**Critical Bug Fix: Canvas View Quadtree Infinite Recursion**
- FIX: Quadtree infinite recursion causing "Maximum call stack size exceeded"
- ADD: Max depth limit (15 levels) prevents infinite subdivision
- ADD: Minimum size check (1px) stops subdivision when quadrants too small
- SAFETY: Return true if no child accepts node (handles floating point precision edge cases)
- TECHNICAL: Pass depth parameter through constructor chain (line 4943, 5015-5018)

**User Report:**
```
treeplexity.html:4998 Uncaught RangeError: Maximum call stack size exceeded
at QuadtreeNode.subdivide (treeplexity.html:4998:21)
at QuadtreeNode.insert (treeplexity.html:4974:26)
```

**Root Cause:**
Infinite recursion in Canvas View spatial indexing (Barnes-Hut Quadtree). When a node couldn't fit in any of the 4 child quadrants (due to floating point precision or nodes on exact boundaries), it would:
1. Subdivide (line 4974)
2. Try to insert into children (line 4984-4988)
3. All children reject it (boundary issues)
4. Return false (line 4989)
5. Parent tries again → infinite loop

**The Problem:**
```javascript
// Before Build 133
insert(node) {
    // ...
    if (!this.subdivided) {
        this.subdivide();  // Creates 4 children
    }

    // Update mass
    this.mass = totalMass;

    // Try to insert into child
    for (let child of this.children) {
        if (child.insert(node)) {
            return true;
        }
    }
    return false;  // ❌ If no child accepts, returns false → parent tries again → INFINITE RECURSION
}
```

**The Fix:**

1. **Added depth tracking** (line 4943):
   ```javascript
   constructor(x, y, width, height, depth = 0) {
       this.depth = depth;  // Track recursion level
   ```

2. **Max depth check** (line 4973-4984):
   ```javascript
   const MAX_DEPTH = 15;
   const MIN_SIZE = 1;
   if (this.depth >= MAX_DEPTH || this.width < MIN_SIZE || this.height < MIN_SIZE) {
       // Can't subdivide further - keep both nodes at this level
       // Update center of mass and return true
       return true;
   }
   ```

3. **Safety return** (line 5004-5006):
   ```javascript
   // If no child accepted it, keep it here (prevents infinite recursion)
   // This can happen with floating point precision issues
   return true;  // ✅ Always succeed, don't recurse infinitely
   ```

4. **Pass depth to children** (line 5015-5018):
   ```javascript
   this.children = [
       new QuadtreeNode(this.x, this.y, halfWidth, halfHeight, this.depth + 1),
       // ... other 3 quadrants with depth + 1
   ];
   ```

**Before Build 133:**
- No recursion depth tracking
- Infinite loop if node doesn't fit in any child
- Canvas View crashes with stack overflow
- Floating point precision issues cause failures

**After Build 133:**
- Max depth 15 (prevents deep recursion)
- Min size 1px (stops subdivision when too small)
- Always returns true (no infinite loops)
- Handles floating point edge cases gracefully

**Why This Happened:**
Barnes-Hut Quadtree is used for force-directed layout optimization (O(n log n) instead of O(n²)). When nodes have very similar coordinates or fall exactly on subdivision boundaries, floating point math can cause nodes to not fit in any of the 4 children, leading to infinite recursion.

**Impact:**
- Canvas View now stable with large trees
- Force-directed layout works correctly
- No more stack overflow errors
- Handles edge cases (overlapping nodes, boundary nodes)

**Implementation:**
- Line 4943: Added depth parameter to constructor
- Line 4948: Store depth as instance variable
- Line 4973-4984: Check max depth and min size before subdividing
- Line 5004-5006: Safety return to prevent infinite loops
- Line 5015-5018: Pass depth + 1 to children

### v2.3.0 | Build 132 | 2025-11-20
**Bug Fix: Deep Mode Routing Clarification & Debug Logging**
- FIX: Added debug logging for Deep Mode routing diagnostics
- CLARIFY: Enhanced comments - Deep Mode MUST bypass Netlify (consistent with Gemini/ChatGPT)
- DEBUG: Log `useExtendedThinking` and `hasLocalKey` when Deep Mode requested
- CONSISTENCY: Explicitly document that Sonnet Deep Mode matches Gemini/ChatGPT behavior

**User Report:**
- User: "Sonnet still times out in Deep Mode. There should be no deploy to netlify in Deep Mode by Sonnet. that should be a direct api call like the other Deep Mode AI api keys."
- Screenshot shows Build 126 error (Netlify timeout → direct API fallback → CORS)
- Expected: Deep Mode should NEVER touch Netlify (direct API only, like Gemini/ChatGPT)

**Investigation:**
- Code already correct since Build 127 (line 3066: `if (useExtendedThinking && localApiKey)` → direct API)
- User's screenshot shows Build 126 error, suggesting browser cache issue
- Build 127+ includes upfront check: Deep Mode requires user API key (consistent across all providers)

**Root Cause:**
- User likely running cached older build (Build 126 or earlier) in browser
- Older builds lacked Build 127's architectural fix (Deep Mode consistency)
- File on disk is Build 132, but browser hasn't hard-refreshed

**Solution:**
1. **Added Debug Logging** (line 2999-3001):   - Logs when Deep Mode requested: provider, useExtendedThinking, hasLocalKey
   - Helps diagnose any future routing issues
   - Clear console trail showing Deep Mode vs Fast Mode path
2. **Enhanced Comments** (line 3064-3065):
   - "CRITICAL: Deep Mode with user key MUST use direct API (never Netlify)"
   - "Gemini and ChatGPT always use direct API, Sonnet must too"
   - Line 3068: "Bypassing Netlify completely - extended thinking takes 15-30s"
3. **User Action Required:**
   - Hard refresh browser: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear browser cache and reload
   - Ensures Build 132 is running (not cached Build 126)

**How Deep Mode Works (Build 127+):**

**All Providers (Claude, Gemini, ChatGPT):**
1. **Require User API Key:** `if (useExtendedThinking && !localApiKey)` throws error (line 3044)
2. **Direct API Only:** `if (useExtendedThinking && localApiKey)` → `callClaudeDirectAPI` (line 3066-3080)
3. **Never Touch Netlify:** Bypasses Netlify completely (15-30s extended thinking exceeds 10s limit)
4. **CORS Handling:** If running from `file://`, shows clear solutions (deploy/local server/Fast Mode)

**Fast Mode (server-* options):**
- Uses Netlify function (10s timeout)
- Fallback to direct API if timeout + user key available (line 3112)
- CORS error handled with helpful solutions (line 3121)

**Before Build 127 (User's Cached Version):**
- No upfront check for Deep Mode + no API key
- Sonnet could attempt Netlify → timeout → fallback → CORS
- Inconsistent with Gemini/ChatGPT (always required user keys)

**After Build 127-132:**
- Upfront check: Deep Mode requires user API key (all providers)
- Direct API path enforced: Never touches Netlify in Deep Mode
- Consistent behavior: Sonnet = Gemini = ChatGPT
- Debug logging: Clear console trail for diagnostics

**Implementation:**
- Line 2999-3001: Debug logging for Deep Mode routing
- Line 3064-3068: Enhanced comments clarifying Deep Mode path
- No logic changes (Build 127 already correct, just adding clarity)

### v2.3.0 | Build 131 | 2025-11-20
**Major Upgrade: Master Prompt Engineer Meta-Framework**
- UPGRADE: Replaced domain-specific example with Master Prompt Engineer meta-framework
- TEACH: 5-part framework (Persona → Task → Context → Constraints → Output Format)
- TEACH: 4-step process (Input Acquisition → Analysis (3C) → Improvement → Delivery)
- EXAMPLES: Climate change article (weak → strong), Resume review (vague → structured)
- BONUS: Gardening example retained as subItem showing framework application
- META-LEVEL: Now teaches HOW to engineer prompts (not just one domain)

**User Request:**
- User shared professional "Master Prompt Engineer" prompt with structured framework
- Asked: "Is our AI Prompt master this good? Can we learn (steal) anything from it?"
- User chose option 2: "Switch to prompt engineering meta-example (like Master Prompt Engineer)"

**What We Learned from Master Prompt Engineer:**
1. **Explicit Framework Language**: Persona → Task → Context → Constraints → Output Format
2. **Process Steps**: Input Acquisition → Analysis → Improvement → Delivery
3. **Analysis Criteria**: 3C Framework (Clarity, Context, Constraints)
4. **Standardized Output**: Critique → Optimized Prompt → Explanation
5. **Tone Guidance**: "Be analytical, precise, and helpful"

**Before Build 131 (Domain-Specific):**
- Example: Pacific Northwest gardening consultant
- Shows: One concrete use case (gardening advice)
- Teaches: What a good prompt looks like (by example)
- Level: Single domain

**After Build 131 (Meta-Framework):**
- Example: Master Prompt Engineer
- Shows: How to engineer ANY prompt (universal framework)
- Teaches: The principles of prompt engineering (Persona/Task/Context/Constraints/Format)
- Level: Meta-level (teaches the teaching)
- Bonus: Gardening example as subItem showing framework application

**New Structure:**

**Phase 0: System Configuration**
```
systemPrompt: "You are a Master Prompt Engineer specializing in Large Language Model interactions...

Your Framework (apply to every prompt):
1. PERSONA/ROLE - Assign specific expert identity
2. TASK - Define objective with active verbs
3. CONTEXT - Add necessary background
4. CONSTRAINTS - Define rules (do's and don'ts)
5. OUTPUT FORMAT - Specify exact structure

Your Process:
1. INPUT ACQUISITION - If no prompt provided, request it
2. ANALYSIS - Evaluate for Clarity, Context, Constraints (3C Framework)
3. IMPROVEMENT - Rewrite using the 5-part framework above
4. DELIVERY - Present as: Critique → Optimized Prompt → Explanation"
```

**Phase 1: User Interaction**
```
userPromptTemplate: "Please provide the prompt you would like me to improve. I'll analyze it for clarity, context, and constraints, then rewrite it using proven prompt engineering principles (Persona → Task → Context → Constraints → Output Format). I'll deliver a structured response with: (1) Critique of the original, (2) Optimized version, and (3) Explanation of improvements."

Alternative (Batch Mode): "I have three prompts to improve. I'll share them one at a time..."
```

**Phase 2: Examples & Training**
```
Example 1 - Climate Change (weak → strong)
Example 2 - Resume Review (vague → structured)
SubItem - Gardening Assistant (domain-specific application of framework)
```

**Phase 3: Output Specification**
```
outputFormat: "Deliver every improved prompt in this format:
**1. CRITIQUE OF ORIGINAL PROMPT**
**2. OPTIMIZED PROMPT**
**3. EXPLANATION OF CHANGES**"

chainOfThought: "Before rewriting, analyze using 3C Framework: (1) CLARITY, (2) CONTEXT, (3) CONSTRAINTS. Then apply 5-part framework."
```

**Implementation:**
- Line 12532-12533: Changed project name to "Master Prompt Engineer"
- Line 12545: Added 5-part framework and 4-step process in systemPrompt
- Line 12569: Interactive userPromptTemplate (ready-to-use, no variables)
- Line 12589: Climate change and resume examples (weak → strong transformations)
- Line 12592-12594: Gardening example as subItem (shows framework application)
- Line 12603-12604: Standardized output format (Critique → Optimized → Explanation)
- Line 12617-12618: Updated critical instructions to emphasize meta-framework teaching

**Why This Upgrade Matters:**
- Build 129-130: Showed what a good prompt looks like (domain example)
- Build 131: Teaches HOW to create good prompts (meta-framework)
- AI Wizard now instructs AI to teach prompt engineering principles, not just show examples
- Users learn transferable framework they can apply to any domain

### v2.3.0 | Build 130 | 2025-11-20
**UX Improvement: Remove Placeholder Variables from AI Prompt Design**
- FIX: Removed {{placeholder}} variables from JSON example in wizard
- IMPROVE: Interactive style - AI asks clarifying questions first (ready-to-use)
- IMPROVE: Specific style alternative - list concrete plants/topics (no variables)
- ALIGN: Restores Build 119 principle - prompts work immediately without substitution
- EXAMPLE: "Start by asking me what plants I want to grow, my experience level, and garden conditions..."
- EXAMPLE: Alternative in subItem - "Provide guide for garlic, kale, chard, lettuce, onions..."

**User Feedback:**
- User reported: "I don't like the variables. It would be better if the AI asked those questions of the user at the time or covered only a few popular garden plants with fall maintenance needs."
- Build 129 example used: `"I want to grow {{plant_name}} in {{location}}..."` with variables
- Violates Build 119 principle: "Prompts now generate ready-to-use (NO {{placeholders}})"

**Problem:**
- Build 129 JSON example included placeholder variables: {{plant_name}}, {{location}}, {{experience_level}}
- Required manual substitution before use (template mode, not instance mode)
- Regression from Build 119's "ready-to-use" principle

**Solution:**
- **Interactive Style** (line 12564): "I need fall/winter gardening advice for Victoria, BC. Start by asking me what plants I want to grow, my experience level, and my garden conditions (soil type, sun exposure). Then provide a tailored planting and maintenance guide based on my answers."
- **Specific Style** (line 12567-12568): "Provide a comprehensive fall/winter gardening guide for Victoria, BC covering garlic (hardneck varieties like Music and German White), kale, chard, lettuce, and overwintering onions. Include optimal planting times (month-specific), soil preparation steps, and weekly maintenance schedules through winter."
- Added critical instruction (line 12612): "NO PLACEHOLDER VARIABLES: Use interactive style (AI asks questions) or specific style (list concrete plants/topics)"
- Added reminder (line 12613): "READY-TO-USE: Prompts must work immediately when pasted (no {{variable}} substitution needed)"

**Before Build 130:**
```
userPromptTemplate: "I want to grow {{plant_name}} in {{location}}. What are..."
Variables: {{plant_name}}, {{location}}, {{experience_level}}
❌ Requires manual substitution
```

**After Build 130:**
```
Interactive: "Start by asking me what plants I want to grow... then provide tailored guide"
OR
Specific: "Provide guide for garlic, kale, chard, lettuce, and overwintering onions..."
✅ Works immediately when pasted
```

**Implementation:**
- Line 12564: Changed to interactive style (AI asks questions first)
- Line 12567-12568: Added specific style alternative in subItem
- Line 12612-12613: Added NO PLACEHOLDER VARIABLES instructions

### v2.3.0 | Build 129 | 2025-11-20
**Bug Fix: AI Wizard → Generate Prompt Context Loss for AI Prompt Design**
- FIX: AI Wizard now populates pattern-specific fields (systemPrompt, userPromptTemplate, etc.)
- FIX: Generate Prompt produces comprehensive output instead of just description
- NEW: Pattern-specific JSON example in wizard system prompt showing required structure
- TECHNICAL: Added 4-phase structure example (System Configuration, User Interaction, Examples & Training, Output Specification)
- EXAMPLE: Concrete gardening prompt example matching user workflow

**User Issue:**
- User reported: "After AI Wizard conversation (6 questions) about gardening prompt, Generate Prompt only outputs: 'A prompt to research and organize gardening duties during fall and winter in Victoria, BC, Canada.'"
- Expected: Comprehensive prompt with all details from conversation

**Root Cause:**
- `generateAIPromptDesignPrompt()` extracts fields like `systemPrompt`, `userPromptTemplate`, `fewShotExamples` from items
- AI Wizard created generic tree structure WITHOUT populating these pattern-specific fields
- Falls back to `tree.description` when fields are empty (line 13128)
- Wizard system prompt had no instructions for AI Prompt Design pattern's special fields

**Solution:**
- Added pattern-specific JSON example (lines 12524-12614) showing exact structure AI should create
- Example includes all 5 required fields: systemPrompt, userPromptTemplate, fewShotExamples, outputFormat, chainOfThought
- 4-phase structure: System Configuration → User Interaction → Examples & Training → Output Specification
- Concrete gardening example: "You are an expert Pacific Northwest gardening consultant..."
- Critical instructions: "ALWAYS populate systemPrompt, userPromptTemplate, fewShotExamples, outputFormat fields"

**Data Flow Verified:**
- Generate Prompt reads from `capexTree` (line 13165) ✅
- AI Wizard updates `capexTree` in real-time (line 12891) ✅
- No caching issues - data flow is correct ✅
- Problem was purely missing field population in wizard logic

**Before Build 129:**
```
AI Wizard creates tree:
{
  "name": "NW Fall Gardening Assistant",
  "description": "A prompt to research gardening...",
  "children": [...]  // Generic structure, NO pattern-specific fields
}

Generate Prompt sees empty fields → returns description only
```

**After Build 129:**
```
AI Wizard creates tree:
{
  "name": "NW Fall Gardening Assistant",
  "children": [
    {
      "name": "System Configuration",
      "items": [
        {
          "name": "Main System Prompt",
          "systemPrompt": "You are an expert Pacific Northwest gardening consultant...",
          "userPromptTemplate": "I want to grow {{plant_name}}...",
          "fewShotExamples": "Example 1: Garlic in Victoria...",
          "outputFormat": "1. Planting Timeline...",
          "chainOfThought": "Consider: frost dates, season..."
        }
      ]
    }
  ]
}

Generate Prompt extracts all fields → returns comprehensive executable prompt
```

**Implementation:**
- Line 12524-12614: Pattern-specific JSON example for AI Prompt Design
- Line 12610-12614: Critical instructions about field population
- No changes to Generate Prompt logic (working as designed)

### v2.3.0 | Build 128 | 2025-11-19
**UX Improvement: AI Wizard Meta-Level Guidance for AI Prompt Design**
- UX: AI Wizard first question now attunes users to meta-level thinking
- NEW: Pattern-specific question for AI Prompt Design with concrete examples
- IMPROVE: Clear reminder "You're DESIGNING a prompt (meta-level), not using one"
- GUIDE: Examples show correct framing: "A prompt that takes X and returns Y"
- FIX: Prevents confusion between designing a prompt vs. using a prompt

**User Issue:**
- User asked: "What should I answer? That I want a prompt that researches NW gardening, or that I just want to know about NW gardening?"
- This revealed ambiguity in the question "What is the exact GOAL of this prompt engineering?"

**Before Build 128:**
Question: "What is the exact GOAL of this prompt engineering? What specific output/result should it produce?"
- Ambiguous: Could mean (1) what the prompt will do, or (2) what the user wants
- No examples of good vs bad answers
- No meta-level framing

**After Build 128:**
Question: "What prompt do you want to design? Describe what it should DO when someone uses it.

Examples:
• 'A prompt that takes a business idea and returns a 5-year financial projection with key metrics'
• 'A prompt that analyzes code for security vulnerabilities and suggests fixes with severity ratings'
• 'A prompt that converts casual emails into formal business communications'

Remember: You're DESIGNING a prompt (meta-level), not using one. Tell me what task the prompt should perform."

**Implementation:**
- Line 12586-12593: Pattern-specific first question for Prompt Engineering
- Line 12386-12388: Added meta-level clarity guidance in TURN 1 instructions
- Both changes ensure AI Wizard understands user needs meta-level guidance

### v2.3.0 | Build 127 | 2025-11-19
**Architecture Fix: Deep Mode Consistency**
- ENFORCE: Deep Mode now requires user API key (consistent with Gemini/ChatGPT)
- BLOCK: Server Sonnet + Deep Mode blocked upfront with clear error message
- FIX: Prevents Netlify timeout issues by requiring direct API for Deep Mode
- IMPROVE: Clear explanation why Deep Mode needs user key (15-30s Extended Thinking)
- ISSUE: User reported Sonnet timing out even with "Best (Sonnet)" selected
- ROOT CAUSE: Gemini/ChatGPT always use direct API, but Sonnet allowed server key through Netlify
- ARCHITECTURE: Now all providers (Claude, Gemini, ChatGPT) require user API key for Deep Mode
- ERROR MESSAGE: "🧠 Deep Mode requires your own API key to avoid Netlify's 10-second timeout"

**Before Build 127:**
- Gemini Deep Mode: ✅ Works (requires user key, direct API)
- ChatGPT Deep Mode: ✅ Works (requires user key, direct API)
- Sonnet Deep Mode: ❌ Allowed server key → Netlify timeout → CORS error

**After Build 127:**
- Gemini Deep Mode: ✅ Works (requires user key, direct API)
- ChatGPT Deep Mode: ✅ Works (requires user key, direct API)
- Sonnet Deep Mode: ✅ Works (requires user key, direct API) - **NOW CONSISTENT**

### v2.3.0 | Build 126 | 2025-11-19
**Bug Fix: Sonnet Timeout & CORS Error Handling**
- FIX: Sonnet timeout errors now show helpful solutions instead of cryptic CORS messages
- FIX: Increased client timeout from 9s to 25s (give Netlify full 10-second limit)
- IMPROVE: Better error messages for CORS issues when running from file://
- GUIDE: Clear instructions to run via local server (python -m http.server 8000)
- GUIDE: Direct users to deployed site (https://treelisty.netlify.app) for no CORS issues
- GUIDE: Recommend Fast Mode (Haiku) as alternative to Sonnet when running from file://
- ISSUE: Sonnet can exceed Netlify's 10-second free tier timeout on complex requests
- ROOT CAUSE: file:// protocol blocks CORS requests, preventing direct API fallback
- SOLUTION: Users can use local server, deployed site, or switch to Fast Mode

### v2.3.0 | Build 125 | 2025-11-19
**Bug Fix: Canvas View Selection Box**
- FIX: Canvas View selection box now appears at correct mouse position
- FIX: Selection box positioning accounts for zoom and pan transformations
- TECHNICAL: Added coordinate space conversion (canvas space → screen space)
- ISSUE: Previously, middle-click selection box appeared far from mouse location
- ROOT CAUSE: Selection box was positioned using canvas coordinates without zoom/pan conversion

### v2.3.0 | Build 124 | 2025-11-19
**Gmail Import & Analysis**
- NEW: 📧 Gmail pattern for importing and analyzing email threads
- NEW: Python export script (export_gmail_to_treelisty.py) - fetches Gmail via API
- NEW: /refresh-gmail slash command for easy Gmail refresh from Claude Code
- NEW: Import email threads with full conversation history and context
- NEW: AI-powered email analysis (rhetoric, tone, sentiment, relationship dynamics)
- NEW: Context-aware response generation (AI sees full thread history)
- NEW: Email analyst expert persona with thread-aware field instructions
- TECHNICAL: Pattern supports 10 fields (recipientEmail, ccEmail, subjectLine, emailBody, etc.)
- FIX: Resolved Build 123 syntax error through clean re-implementation

### v2.2.0 | Build 122 | 2025-11-19
**Two-Style Video Prompt Generator (POC)**
- NEW: Generate AI video prompts in TWO styles: 📊 Explainer + 🎭 Narrative
- NEW: Explainer style - Clean, logical, educational (investors, team, education)
- NEW: Narrative style - Character-driven, emotional, hero's journey (marketing, storytelling)
- NEW: Auto hero detection from assignees/descriptions ("Sarah Chen" becomes protagonist)
- NEW: Smart mood detection based on cost/risk/status (high stakes = dramatic lighting)
- NEW: Beautiful style selector modal UI with gradient cards
- NEW: Scene continuity tracking (references previous scene for narrative flow)
- NEW: Three-act structure for narrative mode (Challenge → Struggle → Triumph)
- IMPROVE: Video prompts now 3x more detailed and cinematic-ready for Sora/Veo
- TECHNICAL: Simulates "multi-lens" in prompt logic (no database changes = zero risk)
- TECHNICAL: Hero detection scans all assignees + extracts names from descriptions
- POC: Validates user interest before committing to full pattern-switching architecture

### v2.2.0 | Build 121 | 2025-11-19
**Narrative Continuity Feature**
- NEW: Narrative continuity for Film/Book/Roadmap patterns
- IMPROVE: AI now maintains coherence between sequential scenes/chapters/features
- FIX: Smart Suggest looks at previous item to avoid disjointed suggestions
- TECHNICAL: Added continuity block in buildPatternExpertPrompt() for sequential patterns
- CONTEXT: AI now sees previous item's description, lighting, and gets explicit continuity instructions

### v2.2.0 | Build 120 | 2025-11-19
**Major Fix**
- FIX: Generate comprehensive instruction-rich prompts that configure AI behavior
- IMPROVE: Prompts now combine role + process + format + request in single block
- UX: Prompts instruct the AI instead of asking simple questions that get answered immediately
- CHANGE: Added explicit example of good vs bad prompt structure
- TECHNICAL: userPromptTemplate now generates self-contained instruction blocks

### v2.2.0 | Build 119 | 2025-11-19
**UX Improvement**
- FIX: Prompts now generate ready-to-use (NO {{placeholders}} or {{variables}})
- IMPROVE: Prompts work immediately when pasted into AI (no variable substitution needed)
- UX: Changed from template mode to instance mode for better user experience
- CHANGE: User prompt instructions explicitly prohibit placeholders

### v2.2.0 | Build 118 | 2025-11-19
**Bug Fix (Enhanced)**
- FIX: Stronger prompt engineering to prevent AI from answering vs. creating prompts
- FIX: Explicit "DO NOT answer questions" directive in both system and user prompts
- IMPROVE: User prompt now emphasizes PROMPT ARCHITECT role, not question answerer
- IMPROVE: Added specific examples showing correct vs. incorrect behavior

### v2.2.0 | Build 117 | 2025-11-19
**Bug Fix**
- FIX: AI Prompt Design pattern - treat input as prompt topic not question
- FIX: Analyze Text now creates prompts instead of answering questions
- FIX: Updated improvePromptWithAI to distinguish between prompt topics and questions

### v2.2.0 | Build 116 | 2025-11-18
**UI Improvement**
- UX: Move version/build info from logo to right side below help button
- CLEAN: Logo subtitle back to simple "by geej"

### v2.2.0 | Build 115 | 2025-11-18
**Smart JSON Save System**
- NEW: Smart JSON filename generation (treelisty-<pattern>-<name>-<timestamp>.json)
- NEW: Simple download to Downloads folder (no folder picker required)
- FIX: file:// protocol compatibility (works by double-clicking HTML)
- FIX: Clean console (disabled PWA features on file://)
- REMOVE: File System Access API complexity

### v2.2.0 | Build 113 | Prior
- Fix: Tree View scroll position preserved when collapsing/expanding nodes
- Fix: Sort dropdown updates correctly on initial filesystem load
- Fix: Filesystem Default Order groups folders first + sorts alphabetically
- Fix: Remove PWA onboarding modal

### v2.1.0 | Build ~100
- PWA with .treelisty file handling
- LibrarianAI + Search + Compact UI
- Google Drive refresh + Canvas View stability
- Pattern-specific sorting
- Skinnable theme system (4 themes)

### v2.0.0 | Build ~80
- 14 specialized patterns
- AI Wizard with Smart Merge
- Multi-provider AI (Claude, Gemini, ChatGPT)
- Pattern-aware AI features
- Deep Mode with extended thinking

### v1.0.0 | Build 1
- TreeListy initial deploy
- Rebranded from CAPEX Master

---

## Quick Reference

### Version Components
- **Major.Minor.Patch** (Semantic Versioning)
  - Major: Breaking changes or major feature sets
  - Minor: New features, backward compatible
  - Patch: Bug fixes

- **Build Number**: Incremental for every commit
  - Started at Build 1 (initial deploy)
  - Currently at Build 115

### Where Version Appears
1. **HTML header comment** (line 9): Developer reference
2. **HTML changelog** (lines 19-24): Recent changes
3. **UI logo subtitle** (line 1544): User-visible
4. **Console log**: TreeManager initialization
5. **This file**: Version history tracking

---

## Next Build Template

### v2.2.0 | Build 116 | YYYY-MM-DD
**Description**
- NEW:
- FIX:
- CHANGE:
- REMOVE:
