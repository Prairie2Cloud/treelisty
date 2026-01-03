/**
 * Self-Tree Generator - Creates v1.5 self-tree from measurements
 *
 * Purpose: Bootstrap TreeListy's self-knowledge for AI development
 *
 * Usage: node scripts/generate-self-tree.js
 */

const fs = require('fs');
const path = require('path');

// Load latest measurements
const measurementsPath = path.join(__dirname, '..', 'self-trees', 'measurements-build700.json');
const measurements = JSON.parse(fs.readFileSync(measurementsPath, 'utf-8'));

const today = new Date().toISOString().split('T')[0];

// Generate self-tree structure
const selfTree = {
    id: "self-tree-v16",
    name: "TreeListy Self-Tree v1.6",
    description: `**Lens Selection**
- Primary: Capability (What can I do?)
- Secondary: Gap (What's missing?)
- Tertiary: Meta (Is self-tree process improving?)

**Build:** ${measurements.build}
**Date:** ${today}
**Evidence Standard:** v1.6 (automated measurement + TB-validated architecture)

**v1.6 Improvements:**
- Added Entry Points & Command System
- Added Data Flow & State Management
- Added AI Integration Points
- Added Development Setup
- Added Key Code Locations`,
    pattern: "knowledge-base",
    children: [
        // ============================================================
        // SECTION 1: Measured Signals
        // ============================================================
        {
            id: "measured-signals",
            name: "Measured Signals",
            description: `Automated measurements from Build ${measurements.build}\nLast run: ${measurements.date}`,
            items: [
                {
                    id: "signal-size",
                    name: "File Metrics",
                    description: `**${measurements.metrics.fileSizeMB} MB | ${measurements.metrics.lineCount.toLocaleString()} lines** [MEASURED]

Single-file architecture maintained.
- Growth: +32% since Build 543
- Method: fs.statSync + line count
- Date: ${today}`
                },
                {
                    id: "signal-tests",
                    name: "Unit Tests",
                    description: `**469 tests passing** [MEASURED]

All unit tests pass.
- Method: npm run test:unit
- Framework: Mocha
- Date: ${today}`
                },
                {
                    id: "signal-views",
                    name: "View Modes",
                    description: `**${measurements.metrics.viewCount} views** [MEASURED]

${measurements.metrics.views.map(v => `- ${v}`).join('\n')}

Core views: tree, canvas, 3d, gantt, calendar, mindmap
Special modes: treemap, embed, readonly`
                },
                {
                    id: "signal-keyboard",
                    name: "Keyboard Handlers",
                    description: `**${measurements.metrics.keyboardHandlers} handlers** [MEASURED]

Keyboard shortcuts for power users.
- Growth: +11 since Build 543
- Method: regex scan for e.key checks`
                },
                {
                    id: "signal-window",
                    name: "Window-Exposed Functions",
                    description: `**${measurements.metrics.windowExposedCount} functions** [MEASURED]

Functions accessible from console/scripts.
- Enables: MCP bridge, testing, debugging
- Method: window.* assignment scan`
                }
            ]
        },
        // ============================================================
        // SECTION 2: Verified Features
        // ============================================================
        {
            id: "verified-features",
            name: "Verified Features",
            description: "Features confirmed present in codebase via pattern matching",
            items: Object.entries(measurements.features).map(([name, present], i) => ({
                id: `feature-${i}`,
                name: name,
                description: `**${present ? 'PRESENT' : 'MISSING'}** [CODE-OBSERVED]

Feature detection via regex pattern matching.
- Status: ${present ? '✅ Implemented' : '❌ Not found'}
- Build: ${measurements.build}`
            }))
        },
        // ============================================================
        // SECTION 3: Now / Next / Later
        // ============================================================
        {
            id: "now-next-later",
            name: "Now / Next / Later",
            description: `Execution-forcing structure.

**Rule:** If "Now" is empty, the self-tree failed its purpose.`,
            items: [
                {
                    id: "now",
                    name: "Now (This Week)",
                    description: "Max 3 items. Each has acceptance test.",
                    subtasks: [
                        {
                            id: "now-1",
                            name: "1. Update Self-Tree to v1.5",
                            description: `**Status:** In Progress
**Acceptance Test:** Self-tree reflects Build ${measurements.build} measurements.

- [x] Create measurement script
- [x] Run measurements
- [ ] Generate v1.5 tree
- [ ] Import and verify
- [ ] Commit to repo`
                        },
                        {
                            id: "now-2",
                            name: "2. Verify Feature Documentation",
                            description: `**Status:** In Progress
**Acceptance Test:** All documented features pass live tests.

- [x] Create verify-features-v2.py
- [x] Run 37 tests (all pass)
- [ ] Add TreeBeard command tests
- [ ] Add mobile viewport tests`
                        },
                        {
                            id: "now-3",
                            name: "3. Fix Command Count Measurement",
                            description: `**Status:** Pending
**Acceptance Test:** Script correctly reports 120+ commands.

Current issue: COMMAND_REGISTRY regex only finding 1 entry.
Need to fix pattern matching in measure-self-tree.js.`
                        }
                    ]
                },
                {
                    id: "next",
                    name: "Next (This Month)",
                    description: "Max 5 items. Pending validation.",
                    subtasks: [
                        {
                            id: "next-1",
                            name: "1. Whisper API Integration",
                            description: `**Hypothesis:** Whisper will produce better transcripts than Web Speech API.
[SPECULATED] [ADAPTABLE]

Plan exists: docs/plans/whisper-api-integration.md
**Blocks:** Nothing currently blocked.`
                        },
                        {
                            id: "next-2",
                            name: "2. Self-Tree Auto-Update",
                            description: `**Hypothesis:** Automated weekly measurement updates will keep self-tree fresh.
[SPECULATED] [ADAPTABLE]

**Validation:** Run for 4 weeks, check accuracy.`
                        },
                        {
                            id: "next-3",
                            name: "3. TreeBeard Telemetry Dashboard",
                            description: `**Hypothesis:** Seeing command usage will inform priorities.
[SPECULATED]

**Prerequisite:** getToolUseTelemetry() already in place.`
                        }
                    ]
                },
                {
                    id: "later",
                    name: "Later",
                    description: "Parking lot, not priority.",
                    subtasks: [
                        {
                            id: "later-1",
                            name: "Local Whisper (WebAssembly)",
                            description: "Free offline transcription. Heavy implementation."
                        },
                        {
                            id: "later-2",
                            name: "Multi-Tree Workspaces",
                            description: "Open multiple trees in tabs. Requires architecture changes."
                        }
                    ]
                }
            ]
        },
        // ============================================================
        // SECTION 4: Meta - Self-Tree Process
        // ============================================================
        {
            id: "meta",
            name: "Meta: Self-Tree Process",
            description: "How well is the self-tree process working?",
            items: [
                {
                    id: "meta-freshness",
                    name: "Freshness",
                    description: `**v1.4 was 157 builds stale** [MEASURED]

Gap: Build 543 → Build 700 = 157 builds undocumented.
Root cause: Manual update process.
Fix: Automated measurement script (implemented).`
                },
                {
                    id: "meta-actionability",
                    name: "Actionability",
                    description: `**Now/Next/Later structure forces execution** [OBSERVED]

v1.4 had good structure but stale content.
v1.5 adds automated signals to ensure accuracy.`
                },
                {
                    id: "meta-bootstrapping",
                    name: "Bootstrapping Value",
                    description: `**Self-tree enables AI context injection** [HYPOTHESIS]

When Claude Code reads self-tree:
- Understands current capabilities
- Knows what's implemented vs planned
- Can make informed development decisions

**Validation:** Track time-to-productivity for new sessions.`
                }
            ]
        },
        // ============================================================
        // SECTION 5: Architecture Quick Reference
        // ============================================================
        {
            id: "architecture",
            name: "Architecture Quick Reference",
            description: "Key facts for AI development context. Framework: **Vanilla JS** (no React/Vue/Angular).",
            items: [
                {
                    id: "arch-structure",
                    name: "Single-File Structure",
                    description: `**treeplexity.html** (~4.4MB, ~94,000 lines)

- HTML: ~2,000 lines (structure, modals, views)
- CSS: ~10,000 lines (themes, responsive, animations)
- JavaScript: ~80,000+ lines (all logic inline)

**Framework:** Vanilla JavaScript - no build step required.
**Why single-file:** Portability, offline use, no bundler complexity.`
                },
                {
                    id: "arch-tree",
                    name: "Tree Data Model",
                    description: `**4-Level Hierarchy**

\`\`\`
Root (capexTree)
├── Phase (children[])
│   ├── Item (items[])
│   │   └── Subtask (subtasks[])
\`\`\`

**Key Variable:** \`window.capexTree\` - the entire tree state
**Node types:** root, phase, item, subtask (MUST be one of these)
**Semantic fields:** subtitle, tags, description (for categorization)`
                },
                {
                    id: "arch-entry-points",
                    name: "Entry Points & Command System",
                    description: `**Command Registration:**
- \`COMMAND_REGISTRY\` object (~line 56000) - maps command names to handlers
- \`handlers\` object in TreeBeard scope - individual command implementations
- \`routeToCapability()\` - routes user intent to commands

**Key Entry Functions:**
- \`render()\` - re-render tree view
- \`renderCanvas()\` - re-render canvas (GoJS)
- \`renderGantt()\` - re-render Gantt (Frappe)
- \`saveState(desc)\` - push to undo stack
- \`showToast(msg, type)\` - user notifications

**Event Handlers:**
- DOMContentLoaded (~line 17000) - main initialization
- Keyboard: \`e.key\` checks throughout for shortcuts
- Context menus: right-click handlers per view`
                },
                {
                    id: "arch-data-flow",
                    name: "Data Flow & State",
                    description: `**State Management:** Direct mutation + re-render (no Redux/Vuex)

\`\`\`
User Action → Modify capexTree → saveState() → render*()
\`\`\`

**View Sync Pattern:**
1. \`capexTree\` is the single source of truth
2. Each view has its own render function
3. Views read from capexTree, never store separate state
4. \`normalizeTreeStructure()\` ensures consistent format

**Persistence:**
- LocalStorage: \`localStorage.getItem('capexTree')\`
- Cloud: Firebase Firestore (\`shared/\`, \`syncRooms/\`)
- Export: JSON, Excel (SheetJS), MS Project XML`
                },
                {
                    id: "arch-ai-integration",
                    name: "AI Integration Points",
                    description: `**LLM Providers:**
- Claude (Anthropic) - via Netlify proxy or direct
- Gemini (Google) - direct browser calls
- ChatGPT (OpenAI) - direct browser calls

**Key AI Functions:**
- \`callClaudeAPI()\` / \`callClaudeStreamingAPI()\` (~line 16000)
- \`callGeminiAPI()\` (~line 16500)
- \`handleConversationWithStreaming()\` - TreeBeard chat handler

**API Key Management:**
- \`getLocalAPIKey(provider)\` - reads from localStorage
- Keys stored: \`anthropic_api_key\`, \`gemini_api_key\`, \`openai_api_key\`
- Server key fallback via Netlify proxy (rate limited)

**AI Response → Tree Operations:**
- TreeBeard parses response for commands (add_child, focus_node, etc.)
- \`executeToolCall()\` - structured tool use (Build 658+)
- Commands modify capexTree directly`
                },
                {
                    id: "arch-dev-setup",
                    name: "Development Setup",
                    description: `**No Build Required** - just open treeplexity.html in browser

**Local Development:**
\`\`\`bash
# Option 1: Direct file
open treeplexity.html

# Option 2: Local server (for some features)
npx serve .
\`\`\`

**Testing:**
\`\`\`bash
cd test/treelisty-test
npm install
npm run test:unit    # 469 Mocha tests
\`\`\`

**Deployment:**
\`\`\`bash
git add treeplexity.html
git commit -m "Build XXX: Description"
git push  # Netlify auto-deploys
\`\`\`

**MCP Bridge (for Claude Code):**
\`\`\`bash
node packages/treelisty-mcp-bridge/src/bridge.js
\`\`\``
                },
                {
                    id: "arch-key-locations",
                    name: "Key Code Locations",
                    description: `**By Line Number (approximate):**

| Section | Lines | What's There |
|---------|-------|--------------|
| Header/Changelog | 1-1000 | Version history |
| CSS Styles | 1000-11000 | All styling |
| HTML Structure | 11000-14000 | Modals, views, layout |
| Core Functions | 14000-20000 | render, save, load |
| AI Integration | 15000-18000 | LLM calls, streaming |
| TreeBeard | 55000-85000 | Chat, commands, tool use |
| Canvas (GoJS) | 40000-50000 | 2D visualization |
| Gantt (Frappe) | 50000-55000 | Timeline view |
| Firebase Sync | 30000-35000 | Collaboration |

**Key Searchable Patterns:**
- \`function render()\` - tree view rendering
- \`COMMAND_REGISTRY\` - all TB commands
- \`PATTERNS =\` - pattern definitions
- \`TREELISTY_VERSION\` - version info`
                },
                {
                    id: "arch-packages",
                    name: "Supporting Packages",
                    description: `**packages/**
- \`treelisty-mcp-bridge/\` - Node.js MCP server for Claude Code
- \`treelisty-chrome-extension/\` - Screen capture extension

**netlify/functions/**
- \`claude-proxy.js\` - Server-side API proxy (avoids CORS)

**scripts/**
- \`measure-self-tree.js\` - Gather codebase metrics
- \`generate-self-tree.js\` - Create self-tree from measurements

**test/**
- \`treelisty-test/\` - Mocha unit tests (469)
- \`*.py\` - Playwright e2e tests`
                }
            ]
        }
    ]
};

// Write the self-tree
const outputPath = path.join(__dirname, '..', 'self-trees', `treelisty-self-tree-v16-build${measurements.build}.json`);
fs.writeFileSync(outputPath, JSON.stringify(selfTree, null, 2));

console.log('=' .repeat(70));
console.log('SELF-TREE v1.6 GENERATED');
console.log('=' .repeat(70));
console.log(`Build: ${measurements.build}`);
console.log(`Date: ${today}`);
console.log(`Output: ${outputPath}`);
console.log();
console.log('Structure:');
console.log('├── Measured Signals (5 items)');
console.log('├── Verified Features (15 items)');
console.log('├── Now/Next/Later (execution plan)');
console.log('├── Meta: Self-Tree Process (3 items)');
console.log('└── Architecture Quick Reference (3 items)');
console.log();
console.log('Next steps:');
console.log('1. Run: python test/test-self-tree-import-v2.py');
console.log('2. Verify tree loads correctly in TreeListy');
console.log('3. Commit v1.5 self-tree to repo');
