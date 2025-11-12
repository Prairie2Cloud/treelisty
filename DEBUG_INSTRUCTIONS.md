# Debug Instructions - Pattern Selector

**Issue**: Pattern dropdown doesn't seem to change labels
**Solution**: Check browser console for diagnostic messages

---

## Open Browser Console

### Chrome/Edge:
1. Press **F12** (or Ctrl+Shift+I)
2. Click the **Console** tab

### Firefox:
1. Press **F12** (or Ctrl+Shift+K)
2. Click the **Console** tab

---

## What to Check

### 1. On Page Load

**Look for**:
```
Treeplexity - Universal Project Decomposition...
Pattern selector found! <select...>
```

**If you see "Pattern selector NOT found!"**:
- The dropdown HTML isn't in the page
- Check that the dropdown exists in the header

---

### 2. When You Change the Dropdown

**Try**: Select "💼 Sales Pipeline" from dropdown

**Look for**:
```
Pattern changed to: sales
applyPattern called with: sales
Pattern applied: Sales Pipeline
New labels: {root: 'Pipeline', phase: 'Quarter', item: 'Deal', subtask: 'Action'}
```

**If you DON'T see these messages**:
- The event listener isn't attached
- JavaScript error preventing execution

---

### 3. When You Right-Click a Node

**Try**: Right-click on any Phase or Item

**Look for**:
```
getPatternLabels called, currentPattern: sales
Context menu labels: {root: 'Pipeline', phase: 'Quarter', item: 'Deal', subtask: 'Action'}
```

**Expected Context Menu**:
- Should show "➕ Add Deal" (not "Add Item")
- Should show "✏️ Edit Deal" (not "Edit Item")

---

## Common Issues

### Issue 1: "Pattern selector NOT found!"

**Cause**: Dropdown doesn't exist in DOM

**Fix**: Check HTML around line 1178-1192 for:
```html
<select class="pattern-select" id="pattern-select">
```

---

### Issue 2: No "Pattern changed to:" message

**Cause**: Event listener not attached or not firing

**Possible reasons**:
1. JavaScript error before event listener code runs
2. Element ID mismatch
3. Code still commented out

**Check**: Search file for `addEventListener('change'` around line 4625

---

### Issue 3: Labels show as "generic" even after changing

**Cause**: `currentPattern` variable not updating

**Check console for**:
```
getPatternLabels called, currentPattern: generic
```

If it says "generic" when you selected "sales", the `applyPattern` function isn't running.

---

### Issue 4: JavaScript Errors

**Look for red error messages** in console like:
```
Uncaught ReferenceError: PATTERNS is not defined
Uncaught TypeError: Cannot read property 'levels' of undefined
```

These indicate the code has syntax errors or is in the wrong order.

---

## Manual Test in Console

### Test 1: Check if PATTERNS exists

In browser console, type:
```javascript
PATTERNS
```

**Expected**: Should show object with all patterns (generic, sales, thesis, etc.)

**If undefined**: PATTERNS object isn't defined in scope

---

### Test 2: Check current pattern

In console, type:
```javascript
currentPattern
```

**Expected**: Should show 'generic' or whichever pattern is selected

**If undefined**: currentPattern variable isn't defined

---

### Test 3: Manually apply pattern

In console, type:
```javascript
applyPattern('sales')
```

**Expected**:
- Should see console logs
- Tree should re-render
- Right-click should show "Deal" labels

**If error**: Check error message

---

### Test 4: Get current labels

In console, type:
```javascript
getPatternLabels()
```

**Expected**: Should return object like:
```javascript
{root: 'Pipeline', phase: 'Quarter', item: 'Deal', subtask: 'Action'}
```

---

## Report Back

After checking the console, please tell me:

1. **Do you see "Pattern selector found!"** on page load?
2. **Do you see "Pattern changed to: sales"** when you select Sales Pipeline?
3. **Do you see "applyPattern called with: sales"** after changing?
4. **Are there any RED error messages** in the console?
5. **What does `getPatternLabels()` return** when you type it in console?

This will help me pinpoint exactly where the issue is!

---

## If Everything Logs Correctly But Labels Don't Change

If you see all the console messages correctly but the context menu still shows "Item/Task":

**The issue is**: The template literals aren't working in the HTML string

**Check**: Look at the actual context menu HTML being generated

**In console after right-clicking, type**:
```javascript
document.getElementById('context-menu').innerHTML
```

**Should see**: HTML with "Deal" and "Action" in it
**If you see**: HTML with literal "${labels.item}" text, the template literals aren't interpolating

---

**Please check the console and report what you see!** 🔍
