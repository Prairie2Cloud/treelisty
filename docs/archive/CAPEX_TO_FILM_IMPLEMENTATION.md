# CAPEX → Story → Film Pipeline - Implementation Plan
**Date:** 2025-11-19
**Goal:** Transform boring business projects into AI video storyboards
**Status:** Implementation Starting
**Estimated Time:** 2-3 weeks

---

## 🎯 Feature Overview

**User Workflow:**
1. Load CAPEX project (Generic pattern)
2. Switch to Book pattern → AI narrativizes each item into story scenes
3. Switch to Film pattern → AI generates video prompts for Sora/Veo/Runway
4. Export video prompts → Create actual videos with AI tools

**Example:**
```
"Land Acquisition - $2M, 12-18 months"
   ↓ Book AI
"Chapter 1: Sarah's tense negotiation with county commissioner"
   ↓ Film AI
"Interior office, blueprints on desk, dramatic lighting, dolly shot..."
   ↓ Sora/Veo
[Actual video clip of the scene]
```

---

## 📋 Phase 1: Minimal Viable Implementation (Week 1)

### Goal: Get pattern switching working for Generic → Book → Film

**Deliverables:**
- [ ] Node structure supports multi-pattern data
- [ ] Pattern dropdown triggers switching workflow
- [ ] Generic → Book translation rules
- [ ] Book → Film translation rules
- [ ] One working end-to-end example

---

## 🏗️ Implementation Steps

### Step 1: Update Node Structure (2-3 hours)

**Current Node (Simplified):**
```javascript
{
    id: 'node-123',
    name: 'Land Acquisition',
    description: 'Secure 40 acres',
    type: 'land',
    cost: 2000000,
    leadTime: '12-18 months'
}
```

**New Node Structure:**
```javascript
{
    // Universal fields (always present)
    id: 'node-123',
    name: 'Land Acquisition',
    description: 'Secure 40 acres for solar farm',
    nodeType: 'item',
    parentId: 'phase-456',
    children: [],
    collapsed: false,

    // Pattern context
    originalPattern: 'generic',
    currentViewPattern: 'generic',  // Changes when user switches pattern
    patternHistory: [
        { timestamp: 1700000000, pattern: 'generic', action: 'created' }
    ],

    // Common fields (pattern-agnostic)
    commonFields: {
        type: 'land',
        monetaryValue: 2000000,
        timeEstimate: '12-18 months',
        riskLevel: 'high',
        textContent: ''
    },

    // Pattern-specific data (keeps ALL pattern views)
    patternData: {
        generic: {
            cost: 2000000,
            leadTime: '12-18 months',
            alternateSource: 'Lease instead of purchase'
        }
        // book: {} - added when user switches to Book
        // film: {} - added when user switches to Film
    }
}
```

**Code Changes:**
- Update `createNode()` function (line ~7500)
- Keep old fields temporarily for backward compatibility
- Add migration function for existing nodes

---

### Step 2: Generic → Book Translation Rules (4-6 hours)

**Translation Logic:**

```javascript
const TRANSLATION_RULES = {
    generic: {
        book: {
            // Field mappings
            fieldMappings: {
                // POV character from person name or default
                povCharacter: {
                    source: 'computed',
                    compute: (node) => {
                        return node.commonFields.personName || 'Project Manager';
                    }
                },

                // Scene setting from description + cost/risk
                sceneSetting: {
                    source: 'computed',
                    compute: (node) => {
                        const cost = node.commonFields.monetaryValue;
                        const risk = node.commonFields.riskLevel;
                        const location = node.patternData.generic?.location || 'Office';

                        let setting = location;
                        if (cost > 1000000) setting += ', high-stakes meeting room';
                        if (risk === 'high') setting += ', tension in the air';

                        return setting;
                    }
                },

                // Plot function from item type
                plotFunction: {
                    source: 'computed',
                    compute: (node) => {
                        const type = node.commonFields.type;

                        // Map CAPEX types to story functions
                        const typeMap = {
                            'land': 'Setup',
                            'engineering': 'Conflict',
                            'equipment': 'Setup',
                            'infrastructure': 'Conflict',
                            'corporate': 'Setup',
                            'professional': 'Transition',
                            'contingency': 'Resolution'
                        };

                        return typeMap[type] || 'Setup';
                    }
                },

                // Word count targets
                targetWordCount: {
                    source: 'computed',
                    compute: (node) => {
                        // More complex/expensive items get longer chapters
                        const cost = node.commonFields.monetaryValue || 0;
                        if (cost > 5000000) return 3500;
                        if (cost > 1000000) return 2500;
                        if (cost > 100000) return 1500;
                        return 1000;
                    }
                }
            },

            // Auto-generated fields
            autoGenerate: {
                wordCount: () => 0,
                draftStatus: () => 'Outline'
            },

            // AI prompt for creative transformation
            aiPrompt: (node) => `
                CREATIVE STORYTELLING TASK:

                Transform this business/project item into a compelling narrative scene.

                ORIGINAL BUSINESS DATA:
                Name: ${node.name}
                Description: ${node.description}
                Budget: $${node.commonFields.monetaryValue?.toLocaleString() || 'Unknown'}
                Timeline: ${node.commonFields.timeEstimate || 'Unknown'}
                Risk: ${node.commonFields.riskLevel || 'Unknown'}

                YOUR TASK:
                Write a 2-3 paragraph narrative scene that:
                1. Introduces a protagonist dealing with this business challenge
                2. Creates tension/conflict around the budget, timeline, or risk
                3. Shows human stakes (careers, relationships, community impact)
                4. Maintains factual accuracy (don't change numbers)
                5. Uses vivid, cinematic language (setting, action, emotion)

                STYLE: Corporate drama, documentary-narrative hybrid

                Example structure:
                - Opening: Protagonist in specific location/situation
                - Middle: The challenge/decision point (budget, timeline pressure)
                - End: Stakes are established (what happens if this fails?)

                Write the narrative scene:
            `
        }
    }
};
```

---

### Step 3: Book → Film Translation Rules (4-6 hours)

**Translation Logic:**

```javascript
const TRANSLATION_RULES = {
    book: {
        film: {
            fieldMappings: {
                // Generate video prompt from scene description
                videoPrompt: {
                    source: 'computed',
                    compute: (node) => {
                        const setting = node.patternData.book?.sceneSetting || 'Office interior';
                        const pov = node.patternData.book?.povCharacter || 'Professional';
                        const description = node.description;

                        // Extract key elements
                        let prompt = `${setting}. `;

                        // Add character/action
                        if (description) {
                            prompt += `${pov} ${description.substring(0, 100)}. `;
                        }

                        // Add cinematic style
                        prompt += `Cinematic corporate drama style, professional lighting, `;
                        prompt += `photorealistic. 16:9 widescreen.`;

                        return prompt;
                    }
                },

                // Camera movement from plot function
                cameraMovement: {
                    source: 'computed',
                    compute: (node) => {
                        const plotFunction = node.patternData.book?.plotFunction;

                        const movementMap = {
                            'Setup': 'Slow Pan',
                            'Conflict': 'Dolly In',
                            'Resolution': 'Crane Up',
                            'Transition': 'Tracking Shot'
                        };

                        return movementMap[plotFunction] || 'Static';
                    }
                },

                // Lighting from scene setting
                lightingMood: {
                    source: 'computed',
                    compute: (node) => {
                        const setting = node.patternData.book?.sceneSetting || '';

                        if (setting.includes('tension') || setting.includes('stakes')) {
                            return 'Dramatic';
                        }
                        if (setting.includes('office') || setting.includes('meeting')) {
                            return 'Soft Natural';
                        }
                        if (setting.includes('outdoor') || setting.includes('field')) {
                            return 'Golden Hour';
                        }

                        return 'Soft Natural';
                    }
                },

                // Duration from word count
                duration: {
                    source: 'computed',
                    compute: (node) => {
                        const wordCount = node.patternData.book?.targetWordCount || 1000;

                        // Rough estimate: 150 words/minute speaking
                        // Aim for 10-20 second clips
                        if (wordCount > 2500) return '20 seconds';
                        if (wordCount > 1500) return '10 seconds';
                        return '6 seconds';
                    }
                }
            },

            autoGenerate: {
                visualStyle: () => 'Cinematic',
                aspectRatio: () => '16:9 (Widescreen)',
                motionIntensity: () => 'Moderate',
                aiPlatform: () => 'Sora (OpenAI)'
            },

            // AI prompt for video refinement
            aiPrompt: (node) => `
                VIDEO PROMPT GENERATION TASK:

                Refine this scene into a detailed AI video generation prompt.

                STORY CONTEXT:
                Scene: ${node.name}
                Narrative: ${node.description}
                Character: ${node.patternData.book?.povCharacter || 'Professional'}
                Setting: ${node.patternData.book?.sceneSetting || 'Office'}
                Plot Function: ${node.patternData.book?.plotFunction || 'Unknown'}

                ORIGINAL BUSINESS DATA:
                Budget: $${node.commonFields.monetaryValue?.toLocaleString() || 'Unknown'}
                Timeline: ${node.commonFields.timeEstimate || 'Unknown'}

                YOUR TASK:
                Create a detailed video prompt optimized for Sora/Veo that:
                1. Describes the visual scene with specific details (location, lighting, people)
                2. Specifies camera movement and framing
                3. Conveys the emotional tone and stakes
                4. Includes technical specs (duration, aspect ratio, style)
                5. Maintains business context (show blueprints, charts, money if relevant)

                FORMAT:
                Start with: "Interior/Exterior [location], [time of day]..."
                Then: Describe characters, action, objects
                Then: Camera movement and lighting
                End with: "Cinematic style, [duration], [aspect ratio]"

                Example:
                "Interior modern conference room, late afternoon. Asian businesswoman
                (30s) stands at glass whiteboard presenting to board of directors.
                Charts show $2M budget projection. Slow dolly from wide shot to
                close-up on her determined expression. Soft natural lighting through
                floor-to-ceiling windows. Corporate drama style. 10 seconds, 16:9."

                Generate the video prompt:
            `
        }
    }
};
```

---

### Step 4: Pattern Switching UI (3-4 hours)

**Add Event Listener:**

```javascript
// Line ~1585: Pattern dropdown
document.getElementById('pattern-select').addEventListener('change', function(e) {
    const newPattern = e.target.value;
    const currentPattern = getCurrentPattern();

    if (newPattern === currentPattern) return;

    // Show confirmation dialog
    showPatternSwitchDialog(currentPattern, newPattern);
});

function showPatternSwitchDialog(fromPattern, toPattern) {
    const fromName = PATTERNS[fromPattern].name;
    const toName = PATTERNS[toPattern].name;

    // Calculate what will happen
    const preview = generateTranslationPreview(fromPattern, toPattern);

    const modal = `
        <div class="modal pattern-switch-modal">
            <div class="modal-content">
                <h2>🎬 Transform to ${toName}?</h2>

                <p>This will transform your <strong>${fromName}</strong> tree
                   into <strong>${toName}</strong> format.</p>

                <div class="translation-preview">
                    ${preview}
                </div>

                <div class="info-box">
                    <strong>💡 Pro Tip:</strong>
                    ${getPatternSwitchTip(fromPattern, toPattern)}
                </div>

                <div class="modal-actions">
                    <button id="confirm-switch" class="primary">
                        ✨ Transform Tree
                    </button>
                    <button id="cancel-switch">Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);

    document.getElementById('confirm-switch').addEventListener('click', () => {
        switchTreePattern(fromPattern, toPattern);
        document.querySelector('.pattern-switch-modal').remove();
    });

    document.getElementById('cancel-switch').addEventListener('click', () => {
        document.getElementById('pattern-select').value = fromPattern;
        document.querySelector('.pattern-switch-modal').remove();
    });
}

function getPatternSwitchTip(fromPattern, toPattern) {
    if (fromPattern === 'generic' && toPattern === 'book') {
        return 'After switching, use <strong>AI Smart Suggest</strong> on each item to generate narrative scenes. Your business data will be transformed into compelling stories!';
    }
    if (fromPattern === 'book' && toPattern === 'film') {
        return 'Your story scenes will become video prompts! Click <strong>AI Smart Suggest</strong> to refine them for Sora, Veo, or Runway.';
    }
    return 'Your original data is preserved. You can switch back anytime!';
}

function generateTranslationPreview(fromPattern, toPattern) {
    const rules = TRANSLATION_RULES[fromPattern]?.[toPattern];

    if (!rules) {
        return '<p>⚠️ No automatic translation available for this pattern pair.</p>';
    }

    const mappedCount = Object.keys(rules.fieldMappings || {}).length;
    const autoCount = Object.keys(rules.autoGenerate || {}).length;

    let html = '<h3>Translation Preview:</h3><ul>';
    html += `<li>✅ Name and description preserved</li>`;
    html += `<li>🔄 ${mappedCount} fields will be auto-mapped</li>`;
    html += `<li>✨ ${autoCount} new fields will be initialized</li>`;

    if (fromPattern === 'generic' && toPattern === 'book') {
        html += `<li>📚 Business items → Story chapters</li>`;
        html += `<li>💰 Budget/timeline → Narrative stakes</li>`;
    } else if (fromPattern === 'book' && toPattern === 'film') {
        html += `<li>🎬 Scenes → Video prompts</li>`;
        html += `<li>📝 Descriptions → Camera directions</li>`;
    }

    html += '</ul>';
    return html;
}
```

---

### Step 5: Translation Engine Core (4-6 hours)

**Main Translation Function:**

```javascript
function translateNode(node, fromPattern, toPattern) {
    console.log(`Translating node ${node.id} from ${fromPattern} to ${toPattern}`);

    // Get translation rules
    const rules = TRANSLATION_RULES[fromPattern]?.[toPattern];

    if (!rules) {
        console.warn(`No translation rules for ${fromPattern} → ${toPattern}`);
        return initializeDefaultPatternFields(toPattern);
    }

    // 1. Apply field mappings
    const translatedFields = {};

    for (const [targetField, mapping] of Object.entries(rules.fieldMappings || {})) {
        if (mapping.source === 'commonFields') {
            translatedFields[targetField] = node.commonFields[mapping.field];
        } else if (mapping.source === 'patternData') {
            translatedFields[targetField] = node.patternData[fromPattern]?.[mapping.field];
        } else if (mapping.source === 'computed') {
            translatedFields[targetField] = mapping.compute(node);
        }

        // Apply transform if specified
        if (mapping.transform) {
            translatedFields[targetField] = mapping.transform(translatedFields[targetField]);
        }
    }

    // 2. Add auto-generated fields
    for (const [field, generator] of Object.entries(rules.autoGenerate || {})) {
        if (!translatedFields[field]) {
            translatedFields[field] = generator(node);
        }
    }

    // 3. Update pattern history
    node.patternHistory.push({
        timestamp: Date.now(),
        pattern: toPattern,
        action: 'auto-translated',
        fieldsModified: Object.keys(translatedFields)
    });

    return translatedFields;
}

function switchTreePattern(fromPattern, toPattern) {
    console.log(`Switching entire tree from ${fromPattern} to ${toPattern}`);

    // Get all nodes
    const allNodes = getAllNodes(treeData[0]);

    // Translate each node
    allNodes.forEach(node => {
        // Only translate if target pattern doesn't exist yet
        if (!node.patternData[toPattern]) {
            node.patternData[toPattern] = translateNode(node, fromPattern, toPattern);
        }

        // Update current view
        node.currentViewPattern = toPattern;
    });

    // Update global pattern
    currentPattern = toPattern;

    // Re-render everything
    renderTree();
    renderCanvas();
    updateSortOptions(toPattern);

    // Show success message
    showToast(`✨ Transformed to ${PATTERNS[toPattern].name} pattern`, 'success');

    // Show hint about using AI
    setTimeout(() => {
        showToast('💡 Tip: Click AI Smart Suggest on items to enhance them!', 'info');
    }, 2000);
}

function getAllNodes(root) {
    const nodes = [root];

    function traverse(node) {
        if (node.children) {
            node.children.forEach(child => {
                nodes.push(child);
                traverse(child);
            });
        }
    }

    traverse(root);
    return nodes;
}
```

---

### Step 6: AI Prompt Adaptation (4-6 hours)

**Update buildPatternExpertPrompt():**

```javascript
function buildPatternExpertPrompt(pattern, treeContext, node) {
    let prompt = '';

    // Check if this is a translated node
    const isTranslated = node.originalPattern && node.originalPattern !== pattern;

    // TIER 1: Translation context
    if (isTranslated) {
        const originalPatternName = PATTERNS[node.originalPattern].name;
        const currentPatternName = PATTERNS[pattern].name;

        prompt += `⚠️ CREATIVE TRANSFORMATION CONTEXT:\n`;
        prompt += `This item was originally a ${originalPatternName} item.\n`;
        prompt += `It's being viewed as ${currentPatternName} for creative storytelling.\n\n`;
    }

    // TIER 2: Original pattern context (if translated)
    if (isTranslated) {
        prompt += `📦 ORIGINAL BUSINESS DATA:\n`;
        prompt += `Name: ${node.name}\n`;
        prompt += `Description: ${node.description}\n`;

        if (node.commonFields.monetaryValue) {
            prompt += `Budget: $${node.commonFields.monetaryValue.toLocaleString()}\n`;
        }
        if (node.commonFields.timeEstimate) {
            prompt += `Timeline: ${node.commonFields.timeEstimate}\n`;
        }
        if (node.commonFields.riskLevel) {
            prompt += `Risk: ${node.commonFields.riskLevel}\n`;
        }

        // Include original pattern fields
        const originalData = node.patternData[node.originalPattern];
        if (originalData) {
            if (originalData.alternateSource) {
                prompt += `Alternatives: ${originalData.alternateSource}\n`;
            }
            if (originalData.dependencies) {
                prompt += `Dependencies: ${originalData.dependencies.join(', ')}\n`;
            }
        }

        prompt += `\n`;
    }

    // TIER 3: Current pattern fields
    const currentData = node.patternData[pattern];

    if (pattern === 'book') {
        prompt += `📚 STORY ELEMENTS:\n`;
        if (currentData?.povCharacter) {
            prompt += `POV Character: ${currentData.povCharacter}\n`;
        }
        if (currentData?.sceneSetting) {
            prompt += `Setting: ${currentData.sceneSetting}\n`;
        }
        if (currentData?.plotFunction) {
            prompt += `Plot Function: ${currentData.plotFunction}\n`;
        }
        prompt += `\n`;
    } else if (pattern === 'film') {
        prompt += `🎬 VIDEO ELEMENTS:\n`;
        if (currentData?.videoPrompt) {
            prompt += `Current Prompt: ${currentData.videoPrompt}\n`;
        }
        if (currentData?.visualStyle) {
            prompt += `Style: ${currentData.visualStyle}\n`;
        }
        if (currentData?.cameraMovement) {
            prompt += `Camera: ${currentData.cameraMovement}\n`;
        }
        prompt += `\n`;
    }

    // TIER 4: Adaptation instructions
    if (isTranslated) {
        const rules = TRANSLATION_RULES[node.originalPattern]?.[pattern];
        if (rules?.aiPrompt) {
            prompt += rules.aiPrompt(node);
        }
    } else {
        // Use regular pattern expert prompt
        prompt += getStandardPatternPrompt(pattern, node, treeContext);
    }

    return prompt;
}
```

---

## 🧪 Testing Plan

### Test Case 1: Land Acquisition (Generic → Book → Film)

**Input (Generic):**
```javascript
{
    name: "Land Acquisition",
    description: "Secure 40 acres for solar farm development",
    type: "land",
    cost: 2000000,
    leadTime: "12-18 months",
    alternateSource: "Lease instead of purchase"
}
```

**Expected After Book Translation:**
```javascript
{
    name: "Land Acquisition",  // Preserved
    description: "Secure 40 acres for solar farm development",  // Preserved

    patternData: {
        book: {
            povCharacter: "Project Manager",  // Auto-generated
            sceneSetting: "Office, high-stakes meeting room, tension in the air",  // Computed
            plotFunction: "Setup",  // Mapped from type:land
            targetWordCount: 2500,  // Computed from cost
            wordCount: 0,
            draftStatus: "Outline"
        }
    }
}
```

**AI Smart Suggest Prompt:**
```
⚠️ CREATIVE TRANSFORMATION CONTEXT:
This item was originally a Generic Project item.
It's being viewed as Book Writing for creative storytelling.

📦 ORIGINAL BUSINESS DATA:
Name: Land Acquisition
Description: Secure 40 acres for solar farm development
Budget: $2,000,000
Timeline: 12-18 months
Risk: high
Alternatives: Lease instead of purchase

📚 STORY ELEMENTS:
POV Character: Project Manager
Setting: Office, high-stakes meeting room, tension in the air
Plot Function: Setup

CREATIVE STORYTELLING TASK:
[... full prompt from translation rules ...]
```

**Expected AI Response:**
```
Chapter 1: The Land Deal

Marcus Rodriguez spread the site survey across the conference table,
his hands steadier than he felt. Two million dollars. The county's
offer was generous, but the timeline—twelve to eighteen months—left
zero room for delays.

"We have an alternative," he said, meeting his CEO's eyes. "Lease
the land. Faster close, lower upfront cost." He paused, letting the
words hang. "But we'd own nothing."

The room fell silent. Forty acres. Enough to power five thousand
homes. If they bought, they'd control the project for decades. If
they leased... they'd be tenants with an expiration date.

Outside, thunderclouds gathered over the proposed site. The clock
was ticking.

[Generated narrative - 250 words. Target: 2500]
```

---

### Test Case 2: Book → Film Translation

**Input (Book):**
```javascript
{
    name: "Chapter 1: The Land Deal",
    description: "Marcus negotiates with county for solar farm land",

    patternData: {
        book: {
            povCharacter: "Marcus Rodriguez",
            sceneSetting: "County office, tense negotiation",
            plotFunction: "Setup",
            wordCount: 250,
            targetWordCount: 2500
        }
    },

    commonFields: {
        monetaryValue: 2000000,
        timeEstimate: "12-18 months"
    }
}
```

**Expected After Film Translation:**
```javascript
{
    patternData: {
        film: {
            videoPrompt: "County office, tense negotiation. Marcus Rodriguez negotiates with county for solar farm land. Cinematic corporate drama style, professional lighting, photorealistic. 16:9 widescreen.",
            cameraMovement: "Slow Pan",  // From plotFunction: Setup
            lightingMood: "Soft Natural",  // From setting: office
            visualStyle: "Cinematic",
            duration: "10 seconds",  // From targetWordCount: 2500
            aspectRatio: "16:9 (Widescreen)",
            motionIntensity: "Moderate",
            aiPlatform: "Sora (OpenAI)"
        }
    }
}
```

**AI Smart Suggest Prompt:**
```
⚠️ CREATIVE TRANSFORMATION CONTEXT:
This item was originally a Generic Project item.
It's being viewed as AI Video Production for creative storytelling.

📦 ORIGINAL BUSINESS DATA:
Budget: $2,000,000
Timeline: 12-18 months

📚 STORY CONTEXT:
Scene: Chapter 1: The Land Deal
Narrative: Marcus negotiates with county for solar farm land
Character: Marcus Rodriguez
Setting: County office, tense negotiation
Plot Function: Setup

VIDEO PROMPT GENERATION TASK:
[... full prompt from translation rules ...]
```

**Expected AI Response:**
```
Interior county government office, late afternoon. Sunlight streams
through venetian blinds creating dramatic striped shadows across wooden
desk. Hispanic businessman MARCUS RODRIGUEZ (40s, navy suit, determined
expression) leans forward gesturing to site survey blueprints marked
"40 ACRES - $2M".

County commissioner (60s, gray hair, skeptical) sits back in leather
chair with arms crossed. Wide establishing shot of power dynamic, then
slow pan right as Marcus makes his case. Documents and charts visible
showing timeline "12-18 MONTHS".

Camera: Slow pan from wide two-shot to medium on Marcus
Lighting: Soft natural afternoon light with dramatic shadows
Style: Cinematic corporate drama, photorealistic
Duration: 10 seconds, 16:9 widescreen

TECHNICAL SPECS:
Platform: Sora (OpenAI)
Motion: Moderate (dialogue-focused, no fast action)
Mood: High stakes, professional tension
```

---

## 📊 Success Metrics

### Technical Metrics
- ✅ Translation completes in <500ms for trees up to 50 nodes
- ✅ Pattern switching doesn't corrupt tree structure
- ✅ Original data is 100% preserved (can switch back without loss)
- ✅ AI prompts include full context (business data + story + video)

### User Experience Metrics
- ✅ User can complete Generic → Book → Film workflow without errors
- ✅ AI-generated narratives are creative and maintain factual accuracy
- ✅ Video prompts are detailed enough for Sora/Veo
- ✅ User understands the transformation (clear UI messaging)

---

## 🚀 Launch Checklist

### Before Deployment
- [ ] All translation rules tested
- [ ] AI prompts produce quality output
- [ ] Pattern switching UI is intuitive
- [ ] Example tree demonstrates full workflow
- [ ] Documentation updated
- [ ] VERSION.md updated to Build 122

### Launch Plan
1. **Soft Launch:** Enable feature for testing
2. **Create Demo:** Treeplexity project → Film storyboard
3. **Document:** Write user guide for CAPEX → Film workflow
4. **Social:** Tweet/post about "Turn boring spreadsheets into AI videos"
5. **Monitor:** Track usage, gather feedback

---

## 💡 Future Enhancements

### Phase 2 Features (Post-MVP)
1. **"Generate Video Storyboard" Button**
   - One-click: Generic → Book → Film transformation
   - Batch AI processing for entire tree
   - Export all video prompts as .txt file

2. **Video Prompt Export**
   - Export as CSV for batch processing
   - Export as JSON with metadata
   - Direct integration with Sora/Runway APIs (when available)

3. **More Pattern Chains**
   - Roadmap → Book → Film (product features as story)
   - Strategy → Book → Film (strategic plan as documentary)
   - Thesis → Film (academic paper as educational video)

4. **Quality Improvements**
   - Better POV character detection (scan for names in description)
   - Smarter scene setting generation (location extraction)
   - Multi-shot planning (one scene = multiple video clips)

---

## 🎬 Example: Treeplexity Project → Film

**Recursive Fun:** Turn the TreeListy project itself into a movie!

**Generic Tree:**
```
TreeListy Development
├── Phase 1: Core Features
│   ├── Hierarchical tree structure ($50K, 3 months)
│   ├── 14 specialized patterns ($100K, 6 months)
│   └── AI integration ($75K, 4 months)
├── Phase 2: Advanced Features
│   ├── Pattern switching ($80K, 2 months)  ← WE ARE HERE!
│   └── Canvas view ($60K, 3 months)
```

**After Book Translation:**
```
The TreeListy Story
├── Act I: The Vision
│   ├── Chapter 1: "The Spreadsheet Problem" (Sarah realizes limitations)
│   ├── Chapter 2: "Building the Foundation" (Team codes the tree structure)
│   └── Chapter 3: "Fourteen Patterns" (The pivot to specialization)
├── Act II: Innovation
│   ├── Chapter 4: "The Pattern Switch Breakthrough" (Mixture of experts!)
│   └── Chapter 5: "Canvas Dreams" (Visualizing the impossible)
```

**After Film Translation:**
```
TreeListy: The Documentary
├── Opening: "The Problem" (Sarah frustrated with Excel, dramatic zoom)
├── Development Montage (Code, coffee, late nights, 60sec)
├── The Pivot (Team meeting, whiteboard filled with patterns, aha moment)
├── Pattern Switch Demo (Screen recording with voiceover, smooth transitions)
├── User Testimonials (Split screen, 5 happy users)
├── Closing: "The Future" (Aerial shot of laptop, code scrolling, fade to logo)
```

**Ready to paste into Sora and make the TreeListy origin story movie! 🎬**

---

**Status:** ✅ Plan Complete - Ready to Code

**Next Step:** Begin Step 1 (Update Node Structure)
