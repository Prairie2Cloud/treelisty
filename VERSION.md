# TreeListy Version Tracker

## Current Version
**Version:** 2.2.0
**Build:** 121
**Date:** 2025-11-19

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
