# Rebranding: Treeplexity → TreeListy

**Date**: November 7, 2025
**Change**: Rebranded from "Treeplexity" to "TreeListy"
**Status**: ✅ COMPLETE

---

## Changes Made

### 1. Page Title
**Line 6**
- Before: `<title>Treeplexity - Universal Project Decomposition by geej</title>`
- After: `<title>TreeListy - Universal Project Decomposition by geej</title>`

### 2. Splash Screen Comment
**Line 1141**
- Before: `<!-- Treeplexity by geej Splash Screen -->`
- After: `<!-- TreeListy by geej Splash Screen -->`

### 3. Splash Screen Title
**Line 1144**
- Before: `<div class="splash-title">Treeplexity</div>`
- After: `<div class="splash-title">TreeListy</div>`

### 4. Header Logo
**Line 1158**
- Before: `<span>Treeplexity</span>`
- After: `<span>TreeListy</span>`

### 5. Help Button Tooltip
**Line 1185**
- Before: `title="How to use Treeplexity"`
- After: `title="How to use TreeListy"`

### 6. Console Log
**Line 1253**
- Before: `console.log('Treeplexity - Universal Project Decomposition - Horizontal Layout with Pan/Zoom');`
- After: `console.log('TreeListy - Universal Project Decomposition - Horizontal Layout with Pan/Zoom');`

### 7. Netlify Comment
**Line 1397**
- Before: `// Netlify function endpoint - points to Treeplexity deployment where function is hosted`
- After: `// Netlify function endpoint - points to TreeListy deployment where function is hosted`

### 8. Code Comment
**Line 1797**
- Before: `// Insert this code into treeplexity.html`
- After: `// Insert this code into treelisty.html`

### 9. JSON Download Filename
**Line 4115**
- Before: `a.download = \`treeplexity-project-\${timestamp}.json\`;`
- After: `a.download = \`treelisty-project-\${timestamp}.json\`;`

### 10. Help Modal Title
**Line 4560**
- Before: `document.getElementById('modal-title').textContent = '📖 How to Use Treeplexity';`
- After: `document.getElementById('modal-title').textContent = '📖 How to Use TreeListy';`

### 11. Help Modal Content - Header
**Line 4563**
- Before: `<h3>💡 What is Treeplexity?</h3>`
- After: `<h3>💡 What is TreeListy?</h3>`

### 12. Help Modal Content - Description
**Line 4565**
- Before: `<strong>Treeplexity</strong> is a universal tool...`
- After: `<strong>TreeListy</strong> is a universal tool...`

### 13. Help Modal - Example Filename
**Line 4591**
- Before: `• Filename includes timestamp (treeplexity-project-2025-11-02_143025.json)`
- After: `• Filename includes timestamp (treelisty-project-2025-11-02_143025.json)`

### 14. Help Modal - Investor Presentation Text
**Line 4606**
- Before: `<strong>Treeplexity is your secret weapon for investor meetings!</strong>`
- After: `<strong>TreeListy is your secret weapon for investor meetings!</strong>`

### 15. Excel Export Filename
**Line 5035**
- Before: `const filename = \`Treeplexity-\${timestamp}.xlsx\`;`
- After: `const filename = \`TreeListy-\${timestamp}.xlsx\`;`

---

## Not Changed (Intentionally)

### API Endpoint URL
**Line 1398**
```javascript
apiEndpoint: 'https://treeplexity.netlify.app/.netlify/functions/claude-proxy'
```

**Reason**: This is a functional API endpoint URL pointing to the Netlify deployment. It should remain as-is until the application is deployed to a new domain. This is not a display/branding element but a working endpoint.

**Action Required**: If deploying to a new domain (e.g., `treelisty.netlify.app`), update this URL after deployment.

---

## File Output Changes

### JSON Save Files
- **Old format**: `treeplexity-project-2025-11-07_143025.json`
- **New format**: `treelisty-project-2025-11-07_143025.json`

### Excel Export Files
- **Old format**: `Treeplexity-2025-11-07T14-30-25.xlsx`
- **New format**: `TreeListy-2025-11-07T14-30-25.xlsx`

---

## User-Visible Changes

### Browser Tab
- **Before**: "Treeplexity - Universal Project Decomposition by geej"
- **After**: "TreeListy - Universal Project Decomposition by geej"

### Splash Screen
- **Before**: Large "Treeplexity" title on app load
- **After**: Large "TreeListy" title on app load

### Header Logo
- **Before**: 🌳 Treeplexity (top-left corner)
- **After**: 🌳 TreeListy (top-left corner)

### Help Dialog
- **Before**: "📖 How to Use Treeplexity"
- **After**: "📖 How to Use TreeListy"

### Downloaded Files
- **Before**: JSON files named `treeplexity-project-*.json`
- **After**: JSON files named `treelisty-project-*.json`
- **Before**: Excel files named `Treeplexity-*.xlsx`
- **After**: Excel files named `TreeListy-*.xlsx`

---

## Developer Notes

### Console Log
Developer console now shows:
```
TreeListy - Universal Project Decomposition - Horizontal Layout with Pan/Zoom
```

### Code Comments
Internal code comments updated to reference "TreeListy" and "treelisty.html"

---

## Testing Checklist

### Visual Branding
- ✅ Browser tab shows "TreeListy"
- ✅ Splash screen displays "TreeListy"
- ✅ Header logo shows "TreeListy"
- ✅ Help button tooltip says "How to use TreeListy"

### Help Documentation
- ✅ Help modal title: "📖 How to Use TreeListy"
- ✅ Help modal content: "💡 What is TreeListy?"
- ✅ Description text uses "TreeListy"
- ✅ Example filename shows "treelisty-project-*.json"
- ✅ Investor section: "TreeListy is your secret weapon..."

### File Outputs
- ✅ Save JSON → downloads "treelisty-project-[timestamp].json"
- ✅ Export Excel → downloads "TreeListy-[timestamp].xlsx"

### Console
- ✅ Browser console shows "TreeListy - Universal Project Decomposition..."

---

## Summary

**Total Replacements**: 15 instances
- **Treeplexity → TreeListy**: 14 instances
- **treeplexity → treelisty**: 1 instance (filename)

**Not Changed**: 1 instance
- API endpoint URL (functional requirement, not branding)

**Impact**: Complete rebranding from "Treeplexity" to "TreeListy" across all user-facing elements, file outputs, and internal documentation.

---

**Rebranding Complete - TreeListy by geej!** 🌳
