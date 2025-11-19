// ═══════════════════════════════════════════════════════════════════════════
// BUILD 122: TWO-STYLE VIDEO PROMPT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════
// Feature: Generate AI video prompts in two styles:
//   1. Explainer/Documentary - Clean, educational, logical
//   2. Narrative/Story - Character-driven, emotional, hero's journey
//
// Based on Gemini's POC code + Claude enhancements
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────
// MAIN FUNCTION: Enhanced generateAIVideoPrompts
// ───────────────────────────────────────────────────────────────────────────
// Replace existing generateAIVideoPrompts() function at line ~12770

function generateAIVideoPrompts(tree, pattern, style = null) {
    // If no style specified, show style selector and return
    if (!style) {
        showVideoStyleSelector((selectedStyle) => {
            const prompt = generateAIVideoPrompts(tree, pattern, selectedStyle);
            displayGeneratedPrompt(prompt, `${tree.name} - ${selectedStyle === 'narrative' ? 'Story' : 'Explainer'} Video`);
        });
        return null; // Will be called again with style
    }

    // 1. Determine the 'Hero' of the story (for Narrative mode)
    const hero = findProjectHero(tree);

    let output = `# ${tree.icon || '🎬'} ${tree.name || 'Video Production'}\n\n`;
    output += `**Style:** ${style === 'narrative' ? '🎭 Narrative / Story Mode' : '📊 Explainer / Documentary Mode'}\n`;
    output += `**Format:** Copy-paste ready for Sora / Veo / Runway\n\n`;

    if (tree.description) {
        output += `> ${tree.description}\n\n`;
    }

    // Hero info for narrative mode
    if (style === 'narrative') {
        output += `**Hero:** ${hero}\n`;
        output += `**Story Arc:** Three-act structure following the project completion journey\n\n`;
    }

    output += `---\n\n`;

    // Process Phases/Acts
    if (tree.children && tree.children.length > 0) {
        let previousScene = null;

        tree.children.forEach((phase, phaseIdx) => {
            // Map Phase to Story Act (for narrative)
            const actLabel = getStoryActLabel(phaseIdx, tree.children.length);

            output += `## ${phase.name}`;
            if (style === 'narrative') {
                output += ` (${actLabel})`;
            } else {
                output += ` (Phase ${phaseIdx + 1})`;
            }
            output += `\n\n`;

            if (phase.subtitle || phase.description) {
                output += `*${phase.subtitle || phase.description}*\n\n`;
            }

            // Process Items/Scenes
            if (phase.items && phase.items.length > 0) {
                phase.items.forEach((item, itemIdx) => {
                    const sceneNumber = `${phaseIdx + 1}.${itemIdx + 1}`;

                    // Generate the prompt based on style
                    const promptText = style === 'narrative'
                        ? synthesizeNarrativePrompt(item, hero, actLabel, previousScene)
                        : synthesizeExplainerPrompt(item);

                    output += `### Scene ${sceneNumber}: ${item.name}\n\n`;
                    output += `**Platform:** ${item.aiPlatform || 'Sora (OpenAI)'}\n\n`;
                    output += `**Prompt:**\n\`\`\`\n${promptText}\n\`\`\`\n\n`;

                    // Technical specs
                    const specs = [];
                    if (item.duration) specs.push(`Duration: ${item.duration}`);
                    if (item.aspectRatio) specs.push(`Aspect: ${item.aspectRatio}`);
                    if (item.visualStyle) specs.push(`Style: ${item.visualStyle}`);
                    if (specs.length > 0) {
                        output += `**Tech:** ${specs.join(' • ')}\n\n`;
                    }

                    output += `---\n\n`;

                    // Store for continuity
                    previousScene = item;
                });
            }
        });
    }

    // Usage instructions
    output += `\n## 📋 Usage Instructions\n\n`;
    output += `1. Copy the prompt text (inside the code block)\n`;
    output += `2. Paste into your AI video platform:\n`;
    output += `   - **Sora** (OpenAI): Best for photorealistic, cinematic shots\n`;
    output += `   - **Veo 3** (Google): Great for consistent styles, longer clips\n`;
    output += `   - **Runway Gen-3**: Fast iteration, good for prototyping\n`;
    output += `   - **Pika 2.0**: Stylized, artistic effects\n`;
    output += `3. Adjust technical settings (duration, aspect ratio) as specified\n`;
    output += `4. Generate and review results\n`;
    output += `5. Iterate: Use the Notes section to refine prompts\n\n`;

    output += `---\n\n`;
    output += `**💡 Pro Tip:** ${style === 'narrative'
        ? 'Narrative videos work best for marketing, storytelling, and emotional connection. Consider adding background music and voiceover narration!'
        : 'Explainer videos work best for investor presentations, team onboarding, and educational content. Keep pacing consistent and visuals clean!'
    }\n`;

    return output;
}

// ───────────────────────────────────────────────────────────────────────────
// HELPER: Find the Hero (Main Character)
// ───────────────────────────────────────────────────────────────────────────

function findProjectHero(tree) {
    // Strategy 1: Find most frequently assigned person
    const assignees = {};

    function traverseTree(node) {
        if (node.pmAssignee && node.pmAssignee !== 'Unassigned') {
            assignees[node.pmAssignee] = (assignees[node.pmAssignee] || 0) + 1;
        }
        if (node.children) {
            node.children.forEach(child => traverseTree(child));
        }
        if (node.items) {
            node.items.forEach(item => traverseTree(item));
        }
        if (node.subItems || node.subtasks) {
            (node.subItems || node.subtasks).forEach(sub => traverseTree(sub));
        }
    }

    traverseTree(tree);

    // Return most frequent assignee
    const sorted = Object.entries(assignees).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) return sorted[0][0];

    // Strategy 2: Extract name from descriptions
    function getAllText(node) {
        let text = (node.name || '') + ' ' + (node.description || '');
        if (node.children) {
            node.children.forEach(child => text += ' ' + getAllText(child));
        }
        if (node.items) {
            node.items.forEach(item => text += ' ' + getAllText(item));
        }
        return text;
    }

    const allText = getAllText(tree);
    const nameMatch = allText.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
    if (nameMatch) return nameMatch[1];

    // Strategy 3: Use tree owner or default
    return tree.owner || tree.createdBy || "The Project Lead";
}

// ───────────────────────────────────────────────────────────────────────────
// HELPER: Map Phases to Story Acts
// ───────────────────────────────────────────────────────────────────────────

function getStoryActLabel(index, total) {
    if (total <= 1) return "The Journey";
    const position = index / (total - 1);
    if (position < 0.4) return "Act I: The Challenge";
    if (position < 0.75) return "Act II: The Struggle";
    return "Act III: The Triumph";
}

// ───────────────────────────────────────────────────────────────────────────
// STYLE 1: EXPLAINER / DOCUMENTARY
// ───────────────────────────────────────────────────────────────────────────

function synthesizeExplainerPrompt(item) {
    const visualSubject = item.name;
    const details = item.description || "Project details";

    // Financial context
    let financialGraphic = "";
    if (item.cost) {
        const costM = (item.cost / 1000000).toFixed(1);
        financialGraphic = `Budget graphic showing $${costM}M overlaid on screen.`;
    } else if (item.dealValue) {
        const valueM = (item.dealValue / 1000000).toFixed(1);
        financialGraphic = `Deal value of $${valueM}M displayed as infographic.`;
    } else if (item.investment) {
        const investM = (item.investment / 1000000).toFixed(1);
        financialGraphic = `Investment: $${investM}M shown in clean typography.`;
    }

    // Timeline context
    let timelineGraphic = "";
    if (item.leadTime) {
        timelineGraphic = `Timeline graphic animating: ${item.leadTime}.`;
    } else if (item.engineeringEstimate) {
        timelineGraphic = `Duration overlay: ${item.engineeringEstimate}.`;
    } else if (item.duration) {
        timelineGraphic = `Timeline: ${item.duration}.`;
    }

    // Location/Setting
    let setting = "Modern office environment or construction site";
    if (item.location) {
        setting = item.location;
    } else if (details.toLowerCase().includes('office')) {
        setting = "Modern glass office with city view";
    } else if (details.toLowerCase().includes('site') || details.toLowerCase().includes('land')) {
        setting = "Construction site or development location";
    } else if (details.toLowerCase().includes('lab') || details.toLowerCase().includes('research')) {
        setting = "Clean research laboratory";
    }

    return `Style: High-end Corporate Documentary. Photorealistic. 8k resolution.
Shot: Slow tracking shot or aerial drone view establishing the scope.
Subject: ${visualSubject}.
Action: ${details}. The visualization builds itself on screen with clean architectural lines.
Overlay Graphics: ${financialGraphic} ${timelineGraphic}
Setting: ${setting}.
Lighting: Bright, clean, clinical, "Apple store" aesthetic with soft shadows.
Mood: Competent, organized, futuristic, inspiring confidence.
Camera: Steady, professional gimbal movement. Wide to medium shots.`;
}

// ───────────────────────────────────────────────────────────────────────────
// STYLE 2: NARRATIVE / STORY
// ───────────────────────────────────────────────────────────────────────────

function synthesizeNarrativePrompt(item, hero, act, previousScene) {
    const action = item.description || "working on the task";

    // Get dynamic mood based on context
    const moodData = getNarrativeMood(item, act);
    const mood = moodData.mood;
    const lighting = moodData.lighting;

    // Get appropriate setting
    const setting = getNarrativeSetting(item, act);

    // Emotional stakes
    const stakes = getEmotionalStakes(item);

    // Continuity from previous scene
    let continuity = "";
    if (previousScene) {
        continuity = `\nContinuity: Previous scene: "${previousScene.name}". This scene shows the consequence/progress of that action.`;
    }

    // Character details
    const characterDesc = `${hero} (30s-40s, professional, determined expression)`;

    return `Style: Cinematic Movie Scene. Anamorphic lens. Film grain.
Character: ${characterDesc}
Setting: ${setting}
Action: ${hero} is ${action}. ${mood}. ${stakes}${continuity}
Detail: Close-up on ${hero}'s face showing ${getEmotionalExpression(mood)}. Show determination and professionalism.
Lighting: ${lighting}. Cinematic contrast with dramatic shadows.
Mood: ${mood}. High stakes atmosphere.
Camera: Dynamic - Start wide, dolly in to close-up, or handheld for intensity.`;
}

// ───────────────────────────────────────────────────────────────────────────
// HELPER: Dynamic Mood Detection
// ───────────────────────────────────────────────────────────────────────────

function getNarrativeMood(item, act) {
    let mood = "Determined and focused";
    let lighting = "Natural daylight through windows";

    // Act-based default (Gemini's approach)
    if (act.includes("Challenge")) {
        mood = "Optimistic but focused, ready to take on the world";
        lighting = "Morning sun streaming through windows, golden and hopeful";
    } else if (act.includes("Struggle")) {
        mood = "Stressed, high stakes, late night problem-solving";
        lighting = "Dark office, blue screen glow, single desk lamp, shadows";
    } else if (act.includes("Triumph")) {
        mood = "Relieved, celebratory, breakthrough moment";
        lighting = "Golden hour, warm sunset, victorious warm tones";
    }

    // Override with cost/value signals (high stakes)
    const monetaryValue = item.cost || item.dealValue || item.investment || 0;
    if (monetaryValue > 10000000) {
        mood = "Extreme pressure, multi-million dollar stakes, intense focus";
        lighting = "Dramatic boardroom lighting, spotlight effect, high contrast";
    } else if (monetaryValue > 5000000) {
        mood = "High pressure, massive responsibility, calculated decisions";
        lighting = "Serious office lighting, professional intensity";
    }

    // Override with status signals (crisis)
    if (item.pmStatus === 'Blocked' || item.pmBlockingIssue) {
        mood = "Crisis mode, urgent problem-solving, racing against time";
        lighting = "Harsh fluorescent, emergency meeting, red alert tones";
    }

    // Override with risk signals
    if (item.technicalRisk === 'High' || item.riskLevel === 'high') {
        mood = "Cautious, careful analysis, aware of dangers";
        lighting = "Moody, dramatic shadows, tension in the frame";
    }

    // Dependencies = coordination stress
    if (item.dependencies && item.dependencies.length > 3) {
        mood = "Coordination stress, juggling multiple priorities, multitasking energy";
    }

    return { mood, lighting };
}

// ───────────────────────────────────────────────────────────────────────────
// HELPER: Setting Detection
// ───────────────────────────────────────────────────────────────────────────

function getNarrativeSetting(item, act) {
    // Check if explicit setting exists
    if (item.location) return item.location;
    if (item.sceneSetting) return item.sceneSetting;

    // Infer from description
    const desc = (item.name + ' ' + (item.description || '')).toLowerCase();

    if (desc.includes('site') || desc.includes('construction') || desc.includes('land')) {
        return "Active construction site, equipment in background, dirt and machinery";
    }
    if (desc.includes('office') || desc.includes('meeting')) {
        return "Modern glass office, city skyline visible, professional environment";
    }
    if (desc.includes('lab') || desc.includes('research')) {
        return "Clean research laboratory, high-tech equipment, sterile environment";
    }
    if (desc.includes('field') || desc.includes('outdoor')) {
        return "Outdoor location, natural environment, sky visible";
    }

    // Default based on act
    if (act.includes("Challenge")) {
        return "Modern office conference room, early morning, project plans visible";
    } else if (act.includes("Struggle")) {
        return "Office late at night, desks cluttered with documents, pressure visible";
    } else if (act.includes("Triumph")) {
        return "Office or construction site, celebrating success, relieved atmosphere";
    }

    return "Professional office or work environment";
}

// ───────────────────────────────────────────────────────────────────────────
// HELPER: Emotional Stakes
// ───────────────────────────────────────────────────────────────────────────

function getEmotionalStakes(item) {
    const monetaryValue = item.cost || item.dealValue || item.investment || 0;
    const timeline = item.leadTime || item.engineeringEstimate || item.duration || "";

    if (monetaryValue > 5000000) {
        return `Career-defining moment. Millions on the line.`;
    }
    if (monetaryValue > 1000000) {
        return `Major project milestone. Success matters.`;
    }
    if (timeline.includes('month') && parseInt(timeline) < 6) {
        return `Tight deadline. Time pressure evident.`;
    }
    if (item.dependencies && item.dependencies.length > 2) {
        return `Complex dependencies. Everything must align.`;
    }

    return `Professional commitment. Doing this right matters.`;
}

// ───────────────────────────────────────────────────────────────────────────
// HELPER: Emotional Expression
// ───────────────────────────────────────────────────────────────────────────

function getEmotionalExpression(mood) {
    if (mood.includes("Optimistic")) return "hope mixed with determination";
    if (mood.includes("Stressed") || mood.includes("Crisis")) return "stress and urgent focus";
    if (mood.includes("Relieved") || mood.includes("celebratory")) return "relief and satisfaction";
    if (mood.includes("pressure")) return "intense concentration under pressure";
    if (mood.includes("Cautious")) return "careful calculation and wariness";
    return "professional determination and focus";
}

// ───────────────────────────────────────────────────────────────────────────
// UI: STYLE SELECTOR MODAL
// ───────────────────────────────────────────────────────────────────────────

function showVideoStyleSelector(callback) {
    // Remove any existing modal
    const existingModal = document.querySelector('.video-style-modal');
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div class="modal-overlay video-style-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        ">
            <div class="modal-content" style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 16px;
                padding: 32px;
                max-width: 800px;
                width: 90%;
                color: #e4e4e7;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
            ">
                <h2 style="
                    font-size: 28px;
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, #60a5fa, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                ">🎬 Choose Video Style</h2>

                <p style="color: #9ca3af; margin-bottom: 24px; font-size: 14px;">
                    Generate AI video prompts in two different styles. Same project data, different storytelling approaches.
                </p>

                <div class="style-options" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 24px;
                ">
                    <div class="style-card" data-style="explainer" style="
                        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                        border-radius: 12px;
                        padding: 24px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        border: 2px solid transparent;
                    ">
                        <div class="style-icon" style="font-size: 48px; margin-bottom: 12px;">📊</div>
                        <h3 style="font-size: 18px; margin-bottom: 12px; color: #fff;">Explainer / Documentary</h3>
                        <p style="font-size: 13px; margin-bottom: 16px; color: #dbeafe; line-height: 1.5;">
                            Clean, professional, educational. Shows the project plan logically step-by-step.
                        </p>
                        <ul style="font-size: 12px; color: #dbeafe; list-style: none; padding: 0;">
                            <li style="margin-bottom: 6px;">✅ Investor presentations</li>
                            <li style="margin-bottom: 6px;">✅ Team onboarding</li>
                            <li style="margin-bottom: 6px;">✅ Status updates</li>
                            <li>✅ Educational content</li>
                        </ul>
                    </div>

                    <div class="style-card" data-style="narrative" style="
                        background: linear-gradient(135deg, #8b5cf6, #6d28d9);
                        border-radius: 12px;
                        padding: 24px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        border: 2px solid transparent;
                    ">
                        <div class="style-icon" style="font-size: 48px; margin-bottom: 12px;">🎭</div>
                        <h3 style="font-size: 18px; margin-bottom: 12px; color: #fff;">Narrative / Story</h3>
                        <p style="font-size: 13px; margin-bottom: 16px; color: #ede9fe; line-height: 1.5;">
                            Character-driven drama. Shows someone completing the project successfully with emotional stakes.
                        </p>
                        <ul style="font-size: 12px; color: #ede9fe; list-style: none; padding: 0;">
                            <li style="margin-bottom: 6px;">✅ Marketing videos</li>
                            <li style="margin-bottom: 6px;">✅ Hero's journey arc</li>
                            <li style="margin-bottom: 6px;">✅ Emotional storytelling</li>
                            <li>✅ Brand building</li>
                        </ul>
                    </div>
                </div>

                <p style="
                    text-align: center;
                    color: #60a5fa;
                    font-size: 13px;
                    margin-bottom: 16px;
                ">💡 Tip: Both styles use the same project data</p>

                <button class="modal-cancel" style="
                    width: 100%;
                    padding: 12px;
                    background: #374151;
                    color: #e4e4e7;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                ">Cancel</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add hover effects
    const styleCards = document.querySelectorAll('.style-card');
    styleCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05)';
            card.style.borderColor = '#60a5fa';
            card.style.boxShadow = '0 10px 30px rgba(96, 165, 250, 0.3)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
            card.style.borderColor = 'transparent';
            card.style.boxShadow = 'none';
        });

        // Click handler
        card.addEventListener('click', () => {
            const style = card.dataset.style;
            document.querySelector('.video-style-modal').remove();
            callback(style);
        });
    });

    // Cancel button
    document.querySelector('.modal-cancel').addEventListener('click', () => {
        document.querySelector('.video-style-modal').remove();
    });

    // Click outside to close
    document.querySelector('.video-style-modal').addEventListener('click', (e) => {
        if (e.target.classList.contains('video-style-modal')) {
            document.querySelector('.video-style-modal').remove();
        }
    });
}

// ───────────────────────────────────────────────────────────────────────────
// UI: Display Generated Prompt (Helper function)
// ───────────────────────────────────────────────────────────────────────────

function displayGeneratedPrompt(prompt, title) {
    // This function should integrate with your existing prompt display system
    // For now, just console.log or create a modal
    console.log('Generated Prompt:', prompt);

    // You may want to show this in a modal or copy to clipboard
    // Example: navigator.clipboard.writeText(prompt);

    // Or show in your existing prompt display area
    // Example: document.getElementById('prompt-output').textContent = prompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLE:
// ═══════════════════════════════════════════════════════════════════════════
//
// Call this instead of the old generateAIVideoPrompts:
//
// generateAIVideoPrompts(capexTree, 'film');  // Will show style selector
//
// Or directly with style:
//
// const explainerPrompts = generateAIVideoPrompts(capexTree, 'film', 'explainer');
// const narrativePrompts = generateAIVideoPrompts(capexTree, 'film', 'narrative');
//
// ═══════════════════════════════════════════════════════════════════════════
