# Flexible Excel Import - Implementation Plan
**Feature**: Import ANY Excel file with intelligent column mapping
**Goal**: High-fidelity import from CRM exports, PM tools, spreadsheets, etc.

---

## Current Status

**✅ Completed**:
- Import mode choice UI (Fast vs Custom)
- Excel file reader
- State management structure

**🚧 In Progress**:
- Flexible import wizard (partially started - line 8960-9073)

**📋 Remaining**:
- Sheet selection (if multiple sheets)
- Column analyzer & mapper
- Hierarchy detector
- Relationship mapper
- Preview & import

---

## Architecture Design

### User Flow

```
1. Upload Excel → 2. Select Sheet → 3. Choose Pattern → 4. Map Columns → 5. Map Hierarchy → 6. Preview → 7. Import
```

###Step-by-Step Wizard

**Step 1: Sheet Selection** (if multiple sheets)
- Show list of sheets
- Preview first 5 rows of each
- User selects which sheet to import

**Step 2: Pattern Selection**
- Auto-detect pattern from column names
- Show confidence score
- Let user override if needed

**Step 3: Column Mapping**
```
Excel Column          →    TreeListy Field
────────────────────────────────────────────
"Deal Name"           →    [Item Name        ▼]
"Value"               →    [Deal Value ($)   ▼]
"Close Date"          →    [Expected Close   ▼]
"Owner"               →    [Contact Person   ▼]
"Stage"               →    [Item Type        ▼]
"Notes"               →    [Description      ▼]
"Depends On"          →    [Dependencies     ▼]
```

- Dropdown for each Excel column
- Shows all TreeListy fields for current pattern
- Auto-suggests based on column name similarity
- Shows sample values from Excel

**Step 4: Hierarchy Configuration**

Detect how hierarchy is represented:

**Option A: Explicit Columns**
```
Phase Column: [Quarter     ▼]
Item Column:  [Deal Name   ▼]
```

**Option B: Indentation** (detect spaces/tabs)
```
☑ Detect hierarchy from indentation
  Level 1 indent: 0 spaces
  Level 2 indent: 2 spaces
  Level 3 indent: 4 spaces
```

**Option C: Parent Reference**
```
Parent ID Column: [Parent Deal ID  ▼]
Item ID Column:   [Deal ID          ▼]
```

**Option D: Level Column**
```
Level Column: [Hierarchy Level  ▼]
  1 = Phase
  2 = Item
  3 = Subtask
```

**Step 5: Dependencies**

How are dependencies represented?

```
Format: [Comma-separated names     ▼]
Examples:
  - "Deal A, Deal B, Deal C"
  - "Item-123; Item-456"
  - "Predecessor 1 | Predecessor 2"

Separator: [,  ▼]  (comma, semicolon, pipe, etc.)
```

**Step 6: Preview**
```
Preview: First 10 items

Phase: Q1 2025
  ├─ TechCorp Enterprise Deal ($450K)
  │   Dependencies: Legal Approval, Security Audit
  ├─ MediHealth Integration ($650K)
  │   Dependencies: TechCorp Deal
  └─ RetailMax Cloud Migration ($320K)

Phase: Q2 2025
  ├─ GlobalManufacturing Rollout ($1.2M)
      Dependencies: TechCorp Deal, MediHealth Deal

[← Back]  [✓ Import (Replace)]  [✓ Import (Append)]
```

**Step 7: Import**
- Show progress bar
- Import with chosen mode (Replace/Append)
- Show success message
- Undo available

---

## Technical Implementation

### 1. Sheet Selection

```javascript
function startFlexibleImportWizard(workbook) {
    excelImportState.workbook = workbook;

    // If only one sheet, skip to pattern selection
    if (workbook.SheetNames.length === 1) {
        selectSheet(workbook.SheetNames[0]);
        return;
    }

    // Show sheet selection UI
    showSheetSelector(workbook);
}

function showSheetSelector(workbook) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = '📑 Select Sheet to Import';

    let sheetsHTML = '';
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const rowCount = data.length;
        const colCount = data[0]?.length || 0;

        // Preview first 5 rows
        const preview = data.slice(0, 5).map(row => row.join(', ')).join('<br>');

        sheetsHTML += `
            <div class="sheet-option" data-sheet="${sheetName}" style="border: 2px solid var(--border); padding: 16px; margin-bottom: 12px; border-radius: 8px; cursor: pointer;">
                <div style="font-weight: 600; margin-bottom: 8px;">${sheetName}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                    ${rowCount} rows × ${colCount} columns
                </div>
                <div style="font-size: 11px; font-family: monospace; color: var(--text-secondary); max-height: 60px; overflow: hidden;">
                    ${preview}
                </div>
            </div>
        `;
    });

    modalBody.innerHTML = `<div style="padding: 20px;">${sheetsHTML}</div>`;
    modal.style.display = 'flex';

    // Add click handlers
    document.querySelectorAll('.sheet-option').forEach(elem => {
        elem.addEventListener('click', () => {
            const sheetName = elem.dataset.sheet;
            selectSheet(sheetName);
        });
    });
}
```

### 2. Column Analyzer

```javascript
function analyzeExcelStructure(sheetName) {
    const sheet = excelImportState.workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Find header row (first non-empty row)
    let headerRowIndex = 0;
    for (let i = 0; i < data.length; i++) {
        if (data[i] && data[i].some(cell => cell !== '' && cell !== null)) {
            headerRowIndex = i;
            break;
        }
    }

    const headers = data[headerRowIndex];
    const sampleData = data.slice(headerRowIndex + 1, headerRowIndex + 6); // 5 sample rows

    excelImportState.selectedSheet = sheetName;
    excelImportState.headers = headers;
    excelImportState.sampleData = sampleData;

    // Auto-detect pattern
    const detectedPattern = smartPatternDetection(headers);
    excelImportState.pattern = detectedPattern;

    // Auto-suggest column mappings
    const suggestedMappings = smartColumnMapping(headers, detectedPattern);
    excelImportState.columnMapping = suggestedMappings;

    // Auto-detect hierarchy
    const hierarchyConfig = detectHierarchyStructure(headers, sampleData);
    excelImportState.hierarchyConfig = hierarchyConfig;

    // Show mapping UI
    showColumnMappingUI();
}
```

### 3. Smart Pattern Detection

```javascript
function smartPatternDetection(headers) {
    const scores = {};

    // Score each pattern based on column name matches
    Object.keys(PATTERNS).forEach(patternKey => {
        const pattern = PATTERNS[patternKey];
        const fields = pattern.fields || {};
        let score = 0;

        Object.keys(fields).forEach(fieldKey => {
            const fieldLabel = fields[fieldKey].label;

            // Check if any header matches this field
            headers.forEach(header => {
                const similarity = stringSimilarity(header, fieldLabel);
                if (similarity > 0.7) score += similarity;
            });
        });

        scores[patternKey] = score;
    });

    // Return pattern with highest score
    const bestPattern = Object.keys(scores).reduce((a, b) =>
        scores[a] > scores[b] ? a : b
    );

    console.log('📊 Pattern detection scores:', scores);
    console.log('🎯 Best match:', bestPattern, 'with score', scores[bestPattern]);

    return bestPattern;
}

function stringSimilarity(str1, str2) {
    str1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    str2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (str1 === str2) return 1.0;
    if (str1.includes(str2) || str2.includes(str1)) return 0.8;

    // Levenshtein distance approximation
    let matches = 0;
    const minLen = Math.min(str1.length, str2.length);
    for (let i = 0; i < minLen; i++) {
        if (str1[i] === str2[i]) matches++;
    }

    return matches / Math.max(str1.length, str2.length);
}
```

### 4. Smart Column Mapping

```javascript
function smartColumnMapping(headers, pattern) {
    const mapping = {};
    const patternDef = PATTERNS[pattern];
    const fields = patternDef.fields || {};

    // Reserved mappings
    mapping._name = null;      // Item name
    mapping._description = null; // Description
    mapping._phase = null;     // Phase grouping
    mapping._type = null;      // Item type
    mapping._dependencies = null; // Dependencies

    headers.forEach((header, index) => {
        if (!header) return;

        const headerLower = header.toLowerCase();

        // Try to match to reserved fields
        if (headerLower.includes('name') || headerLower.includes('title')) {
            mapping._name = index;
        } else if (headerLower.includes('description') || headerLower.includes('notes') || headerLower.includes('detail')) {
            mapping._description = index;
        } else if (headerLower.includes('phase') || headerLower.includes('quarter') || headerLower.includes('stage') || headerLower.includes('chapter')) {
            mapping._phase = index;
        } else if (headerLower.includes('type') || headerLower.includes('category')) {
            mapping._type = index;
        } else if (headerLower.includes('depend') || headerLower.includes('prerequisite') || headerLower.includes('requires')) {
            mapping._dependencies = index;
        }

        // Try to match to pattern-specific fields
        Object.keys(fields).forEach(fieldKey => {
            const fieldLabel = fields[fieldKey].label;
            const similarity = stringSimilarity(header, fieldLabel);

            if (similarity > 0.7) {
                mapping[fieldKey] = index;
            }
        });
    });

    return mapping;
}
```

### 5. Hierarchy Detection

```javascript
function detectHierarchyStructure(headers, sampleData) {
    const config = {
        type: null, // 'columns', 'indentation', 'parent-ref', 'level'
        phaseColumn: null,
        itemColumn: null,
        parentColumn: null,
        idColumn: null,
        levelColumn: null,
        indentSize: 0
    };

    // Check for explicit phase/item columns
    headers.forEach((header, index) => {
        const headerLower = header.toLowerCase();
        if (headerLower.includes('phase') || headerLower.includes('quarter')) {
            config.phaseColumn = index;
            config.type = 'columns';
        }
        if (headerLower.includes('parent')) {
            config.parentColumn = index;
            config.type = 'parent-ref';
        }
        if (headerLower === 'id' || headerLower.includes('item id')) {
            config.idColumn = index;
        }
        if (headerLower.includes('level') || headerLower === 'depth') {
            config.levelColumn = index;
            config.type = 'level';
        }
    });

    // Check for indentation
    if (!config.type && sampleData.length > 0) {
        const firstCol = sampleData.map(row => row[0]);
        const indents = firstCol.map(cell => {
            if (typeof cell !== 'string') return 0;
            return cell.length - cell.trim Left().length;
        });

        if (indents.some(i => i > 0)) {
            config.type = 'indentation';
            config.indentSize = Math.min(...indents.filter(i => i > 0));
        }
    }

    // Fallback: assume flat list, use phase column if detected
    if (!config.type) {
        config.type = 'columns';
    }

    return config;
}
```

---

## Estimation

**Time to implement fully**: 6-8 hours

**Complexity**: High (but high value)

**Benefits**:
- ✅ Import from Salesforce, HubSpot, Jira, Asana
- ✅ Import from any spreadsheet
- ✅ One-time setup, save mappings
- ✅ Dramatically increases TreeListy's utility
- ✅ Professional-grade data import

---

## Alternative: Simpler V1

If 6-8 hours is too much, we could do a simpler version:

**Simplified Flexible Import (2-3 hours)**:
1. User uploads Excel
2. Shows column list
3. User manually selects: "This column is Item Name", "This column is Phase", etc.
4. Assume flat structure (all items in one phase unless phase column specified)
5. Import

This gives 80% of the value with 30% of the effort.

**Which approach would you prefer?**
1. Full wizard (6-8 hours) - Maximum flexibility & intelligence
2. Simplified version (2-3 hours) - Manual mapping, good enough for most cases ⭐ **CHOSEN & IMPLEMENTED**
3. Defer for now - Keep fast import only, revisit later

---

## ✅ IMPLEMENTATION STATUS (2025-11-12)

**Option 2 (Simplified Version) has been completed!** ✅

See **FLEXIBLE_IMPORT_IMPLEMENTATION.md** for complete implementation details.

### What Was Built:
- ✅ Sheet selection UI (if multiple sheets)
- ✅ Intelligent column auto-detection and mapping
- ✅ Interactive column mapping UI with dropdowns
- ✅ Pattern-aware field mapping (all 9 patterns)
- ✅ Live preview before import
- ✅ Replace/Append modes
- ✅ Type conversion (numbers, dates, etc.)
- ✅ Dependency parsing (comma/semicolon/pipe separated)
- ✅ Phase-based hierarchy

### Code Location:
- Lines 9405-9972 in treeplexity.html

### Result:
TreeListy can now import **ANY Excel file**, not just TreeListy exports! 🎉
