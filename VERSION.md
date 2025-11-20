# TreeListy Version Tracker

## Current Version
**Version:** 2.3.0
**Build:** 129
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
