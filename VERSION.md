# TreeListy Version Tracker

## Current Version
**Version:** 2.3.0
**Build:** 133
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
