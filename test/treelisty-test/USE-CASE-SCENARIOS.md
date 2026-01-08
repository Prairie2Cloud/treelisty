# TreeListy Use Case Scenarios

**Version:** 1.0
**Last Updated:** 2026-01-08
**Status:** Active

## Purpose

This document defines the **primary use case scenarios** that must work correctly for TreeListy to be considered functional. These scenarios drive our automated smoke tests and serve as the acceptance criteria for manual testing.

---

## Scenario Categories

| Category | Priority | Coverage Target |
|----------|----------|-----------------|
| UC-IMPORT | P0 (Critical) | 100% automated |
| UC-VIEW | P0 (Critical) | 100% automated |
| UC-EDIT | P1 (High) | 80% automated |
| UC-DASHBOARD | P0 (Critical) | 100% automated |
| UC-TREEBEARD | P1 (High) | 80% automated |
| UC-EXPORT | P1 (High) | 80% automated |
| UC-COLLAB | P2 (Medium) | 50% automated |

---

## UC-IMPORT: Tree Import Scenarios

### UC-IMPORT-001: Import JSON via File Picker
**Priority:** P0 (Critical)
**Preconditions:** App loaded, any view active
**Steps:**
1. User clicks File menu or import button
2. File picker opens
3. User selects valid JSON file
4. File is parsed and loaded

**Expected Results:**
- [ ] Tree loads into `capexTree`
- [ ] Tree renders in current view
- [ ] Tree name visible in header/title
- [ ] Child nodes visible in tree view
- [ ] Undo state saved
- [ ] Toast notification shown

**Failure Mode (Build 790):** Tree loads into memory but doesn't display

---

### UC-IMPORT-002: Dashboard Gmail Import
**Priority:** P0 (Critical)
**Preconditions:** Dashboard modal open, Gmail card visible
**Steps:**
1. User clicks "Import from file" on Gmail card
2. File picker opens (filtered to .json)
3. User selects Gmail export JSON
4. File is imported

**Expected Results:**
- [ ] Gmail tree loads as active tree
- [ ] Tree renders in tree view (not stuck in dashboard)
- [ ] Dashboard modal CLOSES
- [ ] Inbox panel populated (if Gmail pattern)
- [ ] TreeRegistry updated
- [ ] Toast shows "Gmail tree imported!"

**Failure Mode (Build 790):** Tree saved to storage but not loaded into view

---

### UC-IMPORT-003: Dashboard Gmail Fetch via MCP
**Priority:** P0 (Critical)
**Preconditions:** MCP Bridge connected, Dashboard open
**Steps:**
1. User clicks "Fetch Gmail" button
2. MCP request sent to Claude Code
3. Gmail refresh runs
4. Tree data returned

**Expected Results:**
- [ ] Only ONE fetch request sent (debounce)
- [ ] Tree loads as active tree
- [ ] Tree renders in view
- [ ] Dashboard modal closes
- [ ] Toast shows thread count

**Failure Mode (Build 790):** Multiple clicks = multiple requests; tree not displayed

---

### UC-IMPORT-004: Import Invalid JSON
**Priority:** P1 (High)
**Preconditions:** App loaded
**Steps:**
1. User attempts to import malformed JSON file
2. Parser throws error

**Expected Results:**
- [ ] Error toast shown
- [ ] App does not crash
- [ ] Previous tree state preserved
- [ ] Console logs error for debugging

---

### UC-IMPORT-005: Import Large Tree (>1MB)
**Priority:** P1 (High)
**Preconditions:** App loaded
**Steps:**
1. User imports large Gmail export (1000+ threads)
2. File exceeds localStorage limit

**Expected Results:**
- [ ] TreeStorageAdapter routes to IndexedDB
- [ ] Tree loads successfully
- [ ] No QuotaExceededError
- [ ] Performance acceptable (<5s to render)

---

## UC-VIEW: View Switching Scenarios

### UC-VIEW-001: Switch to Canvas View
**Priority:** P0 (Critical)
**Steps:**
1. User clicks view dropdown
2. User selects "Canvas"

**Expected Results:**
- [ ] Canvas container becomes visible
- [ ] Tree container hides
- [ ] Nodes render in canvas
- [ ] Zoom/pan controls work

---

### UC-VIEW-002: Switch to 3D View
**Priority:** P0 (Critical)
**Steps:**
1. User clicks view dropdown
2. User selects "3D"

**Expected Results:**
- [ ] Three.js canvas renders
- [ ] Tree displayed as 3D structure
- [ ] Rotation controls work
- [ ] Performance acceptable

---

### UC-VIEW-003: Return to Tree View
**Priority:** P0 (Critical)
**Preconditions:** User is in Canvas or 3D view
**Steps:**
1. User clicks view dropdown
2. User selects "Tree"

**Expected Results:**
- [ ] Tree view becomes visible
- [ ] Other view containers hide
- [ ] Tree state preserved
- [ ] Expanded/collapsed state preserved

---

### UC-VIEW-004: View State Persistence
**Priority:** P1 (High)
**Steps:**
1. User expands several nodes
2. User switches to Canvas and back

**Expected Results:**
- [ ] Same nodes remain expanded
- [ ] Scroll position approximately preserved
- [ ] Selected node preserved

---

## UC-EDIT: Editing Scenarios

### UC-EDIT-001: Add Child Node
**Priority:** P0 (Critical)
**Steps:**
1. User selects a node
2. User clicks "Add Child" or presses keyboard shortcut

**Expected Results:**
- [ ] New child node created
- [ ] Node appears in tree
- [ ] Edit mode activated for new node
- [ ] Undo state saved

---

### UC-EDIT-002: Rename Node
**Priority:** P0 (Critical)
**Steps:**
1. User double-clicks node name
2. Edit mode activates
3. User types new name
4. User presses Enter

**Expected Results:**
- [ ] Node name updated
- [ ] Tree re-renders
- [ ] Undo state saved

---

### UC-EDIT-003: Delete Node
**Priority:** P0 (Critical)
**Steps:**
1. User selects node
2. User presses Delete or clicks delete button
3. Confirmation shown (if enabled)

**Expected Results:**
- [ ] Node removed from tree
- [ ] Children removed with parent
- [ ] Undo state saved
- [ ] Tree re-renders

---

### UC-EDIT-004: Undo/Redo
**Priority:** P0 (Critical)
**Steps:**
1. User makes a change
2. User presses Ctrl+Z
3. User presses Ctrl+Y

**Expected Results:**
- [ ] Undo reverts change
- [ ] Redo restores change
- [ ] Multiple undo/redo levels work (50 max)

---

## UC-DASHBOARD: Dashboard Scenarios

### UC-DASH-001: Open Dashboard Modal
**Priority:** P0 (Critical)
**Steps:**
1. User presses Ctrl+D or clicks Dashboard button

**Expected Results:**
- [ ] Dashboard modal appears
- [ ] Gmail/Drive/Calendar cards visible
- [ ] Current dashboard trees shown in cards
- [ ] Empty state shows import buttons

---

### UC-DASH-002: Open Dashboard Tree
**Priority:** P0 (Critical)
**Preconditions:** Dashboard has registered Gmail tree
**Steps:**
1. User opens Dashboard
2. User clicks "Open" on Gmail card

**Expected Results:**
- [ ] Gmail tree loads as active tree
- [ ] Dashboard modal closes
- [ ] Tree renders in view

---

## UC-TREEBEARD: TreeBeard Assistant Scenarios

### UC-TB-001: Open TreeBeard Panel
**Priority:** P0 (Critical)
**Steps:**
1. User presses Ctrl+/ or clicks TreeBeard button

**Expected Results:**
- [ ] TreeBeard panel opens
- [ ] Input field focused
- [ ] History visible (if any)

---

### UC-TB-002: Execute Fast-Path Command
**Priority:** P0 (Critical)
**Steps:**
1. User types "expand all"
2. User presses Enter

**Expected Results:**
- [ ] Command recognized via fast-path
- [ ] All nodes expand
- [ ] No API call needed

---

### UC-TB-003: Natural Language Command
**Priority:** P1 (High)
**Steps:**
1. User types "show me the canvas view"
2. User presses Enter

**Expected Results:**
- [ ] Intent recognized
- [ ] View switches to Canvas
- [ ] Confirmation shown

---

## UC-EXPORT: Export Scenarios

### UC-EXPORT-001: Export JSON
**Priority:** P0 (Critical)
**Steps:**
1. User clicks Export dropdown
2. User selects "Save as JSON"

**Expected Results:**
- [ ] File download triggered
- [ ] JSON is valid
- [ ] All tree data included
- [ ] Filename includes pattern name

---

### UC-EXPORT-002: Export Excel
**Priority:** P1 (High)
**Steps:**
1. User clicks Export dropdown
2. User selects "Export to Excel"

**Expected Results:**
- [ ] XLSX file downloads
- [ ] All nodes in spreadsheet
- [ ] Hierarchy preserved via indentation

---

## UC-COLLAB: Collaboration Scenarios

### UC-COLLAB-001: Create Sync Room
**Priority:** P2 (Medium)
**Steps:**
1. User clicks collaboration button
2. User clicks "Create Room"

**Expected Results:**
- [ ] Room ID generated
- [ ] Share link available
- [ ] Firebase connection established

---

### UC-COLLAB-002: Join Sync Room
**Priority:** P2 (Medium)
**Preconditions:** Valid room ID available
**Steps:**
1. User enters room ID
2. User clicks "Join"

**Expected Results:**
- [ ] Connection established
- [ ] Tree syncs from host
- [ ] Presence indicators work

---

## Test Automation Mapping

| Scenario | Automated Test File | Coverage |
|----------|---------------------|----------|
| UC-IMPORT-001 | primary-smoke.spec.js:S2.1 | Full |
| UC-IMPORT-002 | primary-smoke.spec.js:S3.3 | Full |
| UC-IMPORT-003 | primary-smoke.spec.js:S3.3 | Partial |
| UC-VIEW-001 | primary-smoke.spec.js:S4.1 | Full |
| UC-VIEW-003 | primary-smoke.spec.js:S4.1 | Full |
| UC-EDIT-004 | primary-smoke.spec.js:S5.1 | Full |
| UC-DASH-001 | primary-smoke.spec.js:S3.1 | Full |
| UC-TB-001 | primary-smoke.spec.js:S6.1 | Full |

---

## Manual Testing Checklist

Before each release, manually verify these scenarios that are not fully automated:

- [ ] UC-IMPORT-004: Import Invalid JSON
- [ ] UC-IMPORT-005: Import Large Tree
- [ ] UC-VIEW-004: View State Persistence
- [ ] UC-EDIT-001: Add Child Node
- [ ] UC-EDIT-002: Rename Node
- [ ] UC-EDIT-003: Delete Node
- [ ] UC-EXPORT-001: Export JSON
- [ ] UC-EXPORT-002: Export Excel
- [ ] UC-COLLAB-001: Create Sync Room
- [ ] UC-COLLAB-002: Join Sync Room

---

## Regression Test Triggers

When a bug is found in manual testing, add it to this list:

| Bug | Build | Scenario to Add |
|-----|-------|-----------------|
| Dashboard import doesn't load tree | 790 | UC-IMPORT-002, UC-IMPORT-003 |
| Multiple fetch requests | 790 | UC-IMPORT-003 (debounce check) |

---

## Appendix: Test Data Files

Test fixture files are in `test/fixtures/`:
- `gmail-test-tree.json` - Standard Gmail tree for import tests
- `generic-test-tree.json` - Generic project tree
- `large-tree.json` - 1000+ node tree for performance tests
- `malformed.json` - Invalid JSON for error handling tests
