# Family Tree Pattern Implementation

**Date**: November 7, 2025
**Feature**: Genealogy and family tree documentation
**Status**: ✅ IMPLEMENTED

---

## Research Summary

Based on research of leading family tree software (Ancestry, FamilySearch, MyHeritage), key features include:

### Common Features in Family Tree Software
1. **Person Information**: Full names, birth/death dates and places, gender
2. **Relationships**: Parent-child, spouse, siblings, adopted/step relationships
3. **Life Events**: Birth, marriage, death milestones
4. **Documentation**: Sources, citations, photos, documents
5. **DNA Integration**: Genetic test results, haplogroups, DNA matches
6. **Collaboration**: Multiple family members contributing
7. **Record Hints**: Matching to historical databases
8. **Photo Management**: Portrait galleries

### GEDCOM Standard
The industry standard for genealogy data (GEDCOM 5.5.1 and 7.0) includes:
- Individual records (INDI) with names, dates, places, events
- Family records (FAM) with relationships
- Source records (SOUR) with citations
- Multiple name variations (phonetic, romanized)
- Event types: Birth, death, marriage, occupation

---

## TreeListy Family Tree Pattern

### Structure

**Hierarchy**:
- **Root**: Family (surname or family name)
- **Phase**: Generation (generational levels)
- **Item**: Person (individual family members)
- **Subtask**: Event (life milestones)

### Phase Subtitles (Generations)
- Great-Grandparents
- Grandparents
- Parents
- Self/Siblings
- Children
- Grandchildren

### Types (Relationship Categories)
- Paternal Line
- Maternal Line
- Spouse
- Biological
- Adopted
- Step-Family
- Foster
- Half-Sibling

---

## Person Fields (16 Custom Fields)

### Identity
1. **Full Name**: Complete name including middle names
   - Type: Text
   - Help: 👤 Complete name including middle names

2. **Maiden Name**: Birth surname (if changed after marriage)
   - Type: Text
   - Help: 💍 Birth surname (if changed after marriage)

3. **Gender**: Male, Female, Other, Unknown
   - Type: Select dropdown
   - Help: ⚧ Gender identity

### Birth Information
4. **Birth Date**: Date of birth
   - Type: Date picker
   - Help: 🎂 Date of birth

5. **Birth Place**: City, State, Country
   - Type: Text
   - Help: 📍 Place of birth (city, state, country)

### Living Status
6. **Living Status**: Living, Deceased, Unknown
   - Type: Select dropdown
   - Help: 💚 Current living status

### Death Information (if deceased)
7. **Death Date**: Date of death
   - Type: Date picker
   - Help: 🕊️ Date of death (if deceased)

8. **Death Place**: City, State, Country
   - Type: Text
   - Help: 📍 Place of death (if deceased)

### Marriage Information
9. **Marriage Date**: Date of marriage
   - Type: Date picker
   - Help: 💒 Date of marriage

10. **Marriage Place**: City, State, Country
    - Type: Text
    - Help: 📍 Place of marriage ceremony

11. **Spouse Name**: Current or former spouse
    - Type: Text
    - Help: 💑 Current or former spouse

### Career
12. **Occupation**: Primary occupation or career
    - Type: Text
    - Help: 💼 Primary occupation or career

### Media
13. **Photo URL**: Link to portrait or photo
    - Type: Text (URL)
    - Help: 📷 Link to portrait or photo

### Genetic Information
14. **DNA/Genetic Info**: DNA test results, haplogroups, genetic markers
    - Type: Textarea
    - Help: 🧬 DNA test results, haplogroups, genetic markers
    - Example: "Haplogroup R1b, 23andMe tested 2023, matches with Smith family line"

### Documentation
15. **Sources/Citations**: Birth certificates, census records, documents
    - Type: Textarea
    - Help: 📄 Birth certificates, census records, documents
    - Example: "Birth certificate: County Clerk Office 1945, Census 1950"

### Relationship Type
16. **Relationship Type**: Biological, Adopted, Step, Foster, Half-Sibling, Unknown
    - Type: Select dropdown
    - Help: 🔗 Type of family relationship

---

## Configuration

### Dependencies
**Enabled**: ✅
- Allows tracking relationships (e.g., "Father depends on Grandfather")
- Useful for lineage tracking

### PM Tracking
**Disabled**: ❌
- Family trees are not project work
- No need for status, assignees, dates, progress tracking

---

## Implementation Details

### Pattern Definition
**File**: treeplexity.html
**Lines**: 2164-2205

```javascript
familytree: {
    name: 'Family Tree',
    icon: '👨‍👩‍👧‍👦',
    levels: {
        root: 'Family',
        phase: 'Generation',
        item: 'Person',
        subtask: 'Event'
    },
    phaseSubtitles: ['Great-Grandparents', 'Grandparents', 'Parents', 'Self/Siblings', 'Children', 'Grandchildren'],
    types: [
        { value: 'paternal', label: 'Paternal Line' },
        { value: 'maternal', label: 'Maternal Line' },
        { value: 'spouse', label: 'Spouse' },
        { value: 'biological', label: 'Biological' },
        { value: 'adopted', label: 'Adopted' },
        { value: 'step', label: 'Step-Family' },
        { value: 'foster', label: 'Foster' },
        { value: 'half', label: 'Half-Sibling' }
    ],
    description: 'Build and document your family genealogy',
    fields: {
        fullName: { label: 'Full Name', type: 'text', ... },
        maidenName: { label: 'Maiden Name', type: 'text', ... },
        gender: { label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other', 'Unknown'], ... },
        birthDate: { label: 'Birth Date', type: 'date', ... },
        birthPlace: { label: 'Birth Place', type: 'text', ... },
        livingStatus: { label: 'Living Status', type: 'select', options: ['Living', 'Deceased', 'Unknown'], ... },
        deathDate: { label: 'Death Date', type: 'date', ... },
        deathPlace: { label: 'Death Place', type: 'text', ... },
        marriageDate: { label: 'Marriage Date', type: 'date', ... },
        marriagePlace: { label: 'Marriage Place', type: 'text', ... },
        spouseName: { label: 'Spouse Name', type: 'text', ... },
        occupation: { label: 'Occupation', type: 'text', ... },
        photoURL: { label: 'Photo URL', type: 'text', ... },
        dnaInfo: { label: 'DNA/Genetic Info', type: 'textarea', ... },
        sources: { label: 'Sources/Citations', type: 'textarea', ... },
        relationshipType: { label: 'Relationship Type', type: 'select', options: ['Biological', 'Adopted', 'Step', 'Foster', 'Half-Sibling', 'Unknown'], ... },
        includeDependencies: true,
        includeTracking: false
    }
}
```

### Dropdown Option
**Line**: 1178

```html
<option value="familytree" data-desc="Genealogy: Family → Generation → Person → Event">👨‍👩‍👧‍👦 Family Tree</option>
```

### Auto-Rename Terms
**Lines**: 2246-2249

Added family tree terms to replacement arrays:
- `allRootTerms`: Added 'Family'
- `allPhaseTerms`: Added 'Generation'
- `allItemTerms`: Added 'Person'
- `allSubtaskTerms`: Added 'Event'

---

## Usage Examples

### Example 1: Basic Family Tree

**Structure**:
```
Smith Family (Root)
├── Generation 0: Great-Grandparents
│   ├── John Smith (Person)
│   │   ├── Birth: 1890-03-15, Boston, MA
│   │   ├── Marriage: 1912-06-20, Boston, MA
│   │   └── Death: 1965-11-30, Miami, FL
│   └── Mary Johnson (Person)
├── Generation 1: Grandparents
│   ├── Robert Smith (Person)
│   └── Elizabeth Brown (Person)
├── Generation 2: Parents
│   └── James Smith (Person)
└── Generation 3: Self/Siblings
    └── You (Person)
```

### Example 2: Person Record Detail

**Person**: John Smith
- **Full Name**: John Michael Smith
- **Maiden Name**: (blank - male)
- **Gender**: Male
- **Birth Date**: 1890-03-15
- **Birth Place**: Boston, Massachusetts, USA
- **Living Status**: Deceased
- **Death Date**: 1965-11-30
- **Death Place**: Miami, Florida, USA
- **Marriage Date**: 1912-06-20
- **Marriage Place**: Boston, Massachusetts, USA
- **Spouse Name**: Mary Johnson Smith
- **Occupation**: Railroad Engineer
- **Photo URL**: https://familyphotos.com/john-smith-1920.jpg
- **DNA/Genetic Info**: Haplogroup R1b-M269, European ancestry 95%
- **Sources/Citations**: Birth certificate: Suffolk County 1890, Census 1900/1910/1920, Death certificate: Dade County 1965
- **Relationship Type**: Biological
- **Type**: Paternal Line

### Example 3: Multi-Branch Family

**Root**: Johnson-Williams Family

**Generation 0: Great-Grandparents**
- **Branch 1 (Paternal)**: Johnson grandparents
- **Branch 2 (Maternal)**: Williams grandparents

**Generation 1: Grandparents**
- **Paternal**: Grandfather Johnson + Grandmother Johnson (née Miller)
- **Maternal**: Grandfather Williams + Grandmother Williams (née Davis)

**Generation 2: Parents**
- Father (Johnson line)
- Mother (Williams line, maiden name Williams)

**Generation 3: Self/Siblings**
- Yourself
- Siblings

---

## Use Cases

### 1. Personal Genealogy Research
- Document your family history
- Track ancestors across generations
- Record birth, marriage, death dates and places
- Preserve family stories and photos

### 2. DNA Research Integration
- Track DNA test results (23andMe, AncestryDNA)
- Document haplogroups and genetic markers
- Note DNA matches and connections
- Map genetic lineages

### 3. Historical Documentation
- Cite sources (birth certificates, census records)
- Link to historical documents
- Preserve maiden names
- Track immigration and migration patterns

### 4. Adoption/Foster Families
- Document both biological and adoptive relationships
- Track step-family connections
- Note foster placements
- Preserve complex family structures

### 5. Collaborative Family History
- Multiple family members can contribute
- Use dependencies to show parent-child relationships
- Export to JSON for sharing
- Export to Excel for family reunions

---

## Field Mapping to GEDCOM Standard

TreeListy Family Tree fields align with GEDCOM standards:

| TreeListy Field | GEDCOM Tag | Description |
|----------------|------------|-------------|
| Full Name | NAME | Person's full name |
| Maiden Name | NAME._MARNM | Married name variant |
| Gender | SEX | M/F/U (Male/Female/Unknown) |
| Birth Date | BIRT.DATE | Birth event date |
| Birth Place | BIRT.PLAC | Birth event place |
| Death Date | DEAT.DATE | Death event date |
| Death Place | DEAT.PLAC | Death event place |
| Marriage Date | MARR.DATE | Marriage event date |
| Marriage Place | MARR.PLAC | Marriage event place |
| Spouse Name | FAM.HUSB/WIFE | Family record spouse |
| Occupation | OCCU | Occupation |
| Photo URL | OBJE | Multimedia object |
| DNA Info | NOTE._DNA | Custom DNA note |
| Sources | SOUR | Source citation |
| Relationship Type | NOTE._REL | Custom relationship note |

---

## Comparison to Other Patterns

### What Makes Family Tree Unique

**vs. Generic Project**:
- ❌ No cost tracking
- ❌ No procurement fields
- ✅ Birth/death dates instead of start/end dates
- ✅ Gender, living status, maiden names
- ✅ DNA and genetic information

**vs. Book Writing**:
- ❌ No word counts
- ❌ No POV or plot structure
- ✅ Real people, not fictional characters
- ✅ Historical documentation and sources
- ✅ Multiple date types (birth, marriage, death)

**vs. Event Planning**:
- ❌ No budgets or vendors
- ❌ No guest counts
- ✅ Life events span decades, not single occasions
- ✅ Permanent historical records
- ✅ Generational relationships

---

## Privacy Considerations

### Sensitive Information
Family trees contain personal data. Users should:
- Be cautious when sharing living persons' information
- Consider privacy settings for living relatives
- Respect family members' wishes about data sharing
- Follow local privacy laws (GDPR, etc.)

### Best Practices
- Mark living status clearly
- Use "Unknown" for uncertain data
- Cite sources for historical accuracy
- Store photos externally with proper permissions

---

## Future Enhancements

### Potential Additions
1. **GEDCOM Import/Export**: Standard genealogy file format
2. **Photo Gallery**: Embedded image display
3. **Timeline View**: Chronological life events
4. **Relationship Diagram**: Visual family connections
5. **Record Hints**: AI-powered source matching
6. **DNA Matching**: Compare genetic data
7. **Living Persons Privacy**: Auto-hide details
8. **Multi-Language Names**: Phonetic variations

---

## Testing Checklist

### Basic Functionality
- ✅ Select "👨‍👩‍👧‍👦 Family Tree" from pattern dropdown
- ✅ Create a Family (root node)
- ✅ Add Generations (phase nodes with appropriate subtitles)
- ✅ Add Persons (item nodes)
- ✅ Right-click Person → Edit

### Field Display
- ✅ See: Full Name, Maiden Name, Gender, Birth Date, Birth Place
- ✅ See: Living Status, Death Date, Death Place
- ✅ See: Marriage Date, Marriage Place, Spouse Name
- ✅ See: Occupation, Photo URL
- ✅ See: DNA/Genetic Info, Sources/Citations, Relationship Type
- ❌ Should NOT see: Cost, Alternate Source, Lead Time
- ❌ Should NOT see: PM Tracking section

### Data Entry
- ✅ Enter full person details
- ✅ Select gender from dropdown
- ✅ Select living status from dropdown
- ✅ Enter birth/death/marriage dates
- ✅ Enter places (birth, death, marriage)
- ✅ Add DNA info in textarea
- ✅ Add sources/citations in textarea
- ✅ Save and verify all fields persist

### Relationships
- ✅ Dependencies section shown
- ✅ Can link parent to child
- ✅ Can link grandparent to parent
- ✅ Relationship graph makes sense

### Save/Load
- ✅ Save family tree to JSON
- ✅ Load JSON back
- ✅ All custom fields restored correctly
- ✅ Generations and subtitles preserved

---

## Summary

**Problem**: Need specialized pattern for genealogy research and family tree documentation

**Solution**: Created Family Tree pattern with 16 genealogy-specific fields

**Result**:
- ✅ Full person identity (name, maiden name, gender)
- ✅ Vital records (birth, death, marriage dates and places)
- ✅ Living status tracking
- ✅ Occupation and career
- ✅ Photo/portrait links
- ✅ DNA and genetic information
- ✅ Historical source citations
- ✅ Relationship type classification
- ✅ Generational structure with appropriate subtitles
- ✅ No irrelevant PM/procurement fields
- ✅ GEDCOM-compatible data structure

**Impact**: TreeListy can now be used for serious genealogy research, family history documentation, and collaborative family tree building!

---

**Family Tree Pattern - Ready for Your Genealogy Research!** 👨‍👩‍👧‍👦
