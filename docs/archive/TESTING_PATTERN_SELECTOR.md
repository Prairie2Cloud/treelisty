# Testing Pattern Selector with Console Debugging

## Issue
Pattern selector dropdown exists but changing patterns doesn't update labels from "Generic Project".

## Code Changes Made
1. ✅ Added `const labels = getPatternLabels();` to showContextMenu() function
2. ✅ Changed all hard-coded menu labels to use template literals (e.g., `${labels.item}`)
3. ✅ Moved pattern initialization from DOMContentLoaded to after render()
4. ✅ Added comprehensive console.log debugging

## Testing Instructions

### Step 1: Hard Refresh Browser
**IMPORTANT**: You MUST clear the browser cache first!

**Chrome/Edge**:
- Press **Ctrl + Shift + R** (Windows)
- Or **Ctrl + F5**

**Firefox**:
- Press **Ctrl + Shift + R**

### Step 2: Open Browser Console
- Press **F12**
- Click the **Console** tab

### Step 3: Check Initial Load
Look for these messages:
```
Pattern selector found: <select...>
Pattern selector event listener attached
```

If you see "Pattern selector NOT found!" - there's a DOM issue.

### Step 4: Select a Pattern
1. Click the pattern dropdown
2. Select "💼 Sales Pipeline"
3. Watch the console

**Expected console output**:
```
Pattern selector changed to: sales
applyPattern called with: sales
Pattern applied: Sales Pipeline
New labels: {root: 'Pipeline', phase: 'Quarter', item: 'Deal', subtask: 'Action'}
```

### Step 5: Right-Click to Test
1. Right-click on "Phase 0" in the tree
2. Watch console

**Expected console output**:
```
getPatternLabels called, currentPattern: sales
Returning pattern labels: {root: 'Pipeline', phase: 'Quarter', item: 'Deal', subtask: 'Action'}
```

**Expected context menu**:
- Should show: "➕ Add Deal to Phase 0"
- NOT: "➕ Add Item to Phase 0"

### Step 6: Test Item Right-Click
1. Right-click on any item in the tree
2. Watch console and menu

**Expected context menu**:
- "✏️ Edit Deal" (NOT "Edit Item")
- "➕ Add Action" (NOT "Add Sub-task")
- "🗑️ Delete Deal" (NOT "Delete Item")

## Troubleshooting

### Issue: No console messages at all
**Cause**: Browser is using cached version
**Fix**: Try Ctrl + Shift + Delete → Clear cache → Hard refresh again

### Issue: "Pattern selector NOT found!"
**Cause**: Dropdown HTML not in DOM
**Fix**: Check HTML around line 1178 for `<select id="pattern-select">`

### Issue: Pattern selector changed, but no "applyPattern called"
**Cause**: Event listener not attached
**Fix**: Check if there's a JavaScript error earlier in the console

### Issue: Console shows correct labels but menu still says "Item/Task"
**Cause**: Template literals not interpolating (rare)
**Fix**: Check browser version - need modern browser that supports template literals

### Issue: Everything logs correctly but still shows "Item"
**Possible causes**:
1. Multiple versions of showContextMenu() function in file
2. CSS or another script overriding menu HTML
3. Browser extension interfering

**Debug**: In console after right-clicking, type:
```javascript
document.getElementById('context-menu').innerHTML
```
Should see "Deal" and "Action" in the HTML, not "Item" and "Task"

## Report Back

Please tell me:
1. ✅ or ❌ Do you see "Pattern selector found" on page load?
2. ✅ or ❌ Do you see "Pattern selector changed to: sales" when selecting Sales?
3. ✅ or ❌ Do you see "applyPattern called with: sales"?
4. ✅ or ❌ Do you see "getPatternLabels called" when right-clicking?
5. ✅ or ❌ What do the labels say in the returned object?
6. ✅ or ❌ What does the actual context menu show?

This will help pinpoint exactly where the issue is!
