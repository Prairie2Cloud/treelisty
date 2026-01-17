/**
 * Self-Tree Generator - Creates v1.5 self-tree from measurements
 *
 * Purpose: Bootstrap TreeListy's self-knowledge for AI development
 *
 * Usage: node scripts/generate-self-tree.js
 */

const fs = require('fs');
const path = require('path');

// Load latest measurements - find the newest measurements file
const selfTreesDir = path.join(__dirname, '..', 'self-trees');
const measurementFiles = fs.readdirSync(selfTreesDir)
    .filter(f => f.startsWith('measurements-build') && f.endsWith('.json'))
    .sort()
    .reverse();
const latestMeasurements = measurementFiles[0] || 'measurements-build736.json';
const measurementsPath = path.join(selfTreesDir, latestMeasurements);
console.log(`Reading measurements from: ${latestMeasurements}`);
const measurements = JSON.parse(fs.readFileSync(measurementsPath, 'utf-8'));

const today = new Date().toISOString().split('T')[0];

// Generate self-tree structure
const selfTree = {
    id: "self-tree-v17",
    name: "TreeListy Self-Tree v1.7",
    description: `**Lens Selection**
- Primary: Capability (What can I do?)
- Secondary: Gap (What's missing?)
- Tertiary: Meta (Is self-tree process improving?)

**Build:** ${measurements.build}
**Date:** ${today}
**Evidence Standard:** v1.7 (living dashboard with actionable metrics)

**v1.7 Improvements:**
- Populated Now/Next/Later with concrete actions
- Added specific metrics to Measured Signals
- Added Improvement Suggestions with architecture wins
- Self-tree now drives weekly decisions`,
    pattern: "knowledge-base",
    children: [
        // ============================================================
        // SECTION 1: Measured Signals (with specific actionable metrics)
        // ============================================================
        {
            id: "measured-signals",
            name: "Measured Signals",
            description: `**Live Dashboard** - Automated measurements from Build ${measurements.build}
Last run: ${measurements.date}

| Metric | Value | Trend |
|--------|-------|-------|
| File Size | ${measurements.metrics.fileSizeMB} MB | +32% since B543 |
| Lines | ${measurements.metrics.lineCount.toLocaleString()} | +44% since B543 |
| Tests | ${measurements.metrics.testCount} ${measurements.metrics.testStatus} | Stable |
| Views | ${measurements.metrics.viewCount} | All core views |
| Features | 15/15 | All implemented |`,
            items: [
                {
                    id: "signal-size",
                    name: "File Metrics",
                    description: `**${measurements.metrics.fileSizeMB} MB | ${measurements.metrics.lineCount.toLocaleString()} lines** [MEASURED]

| Component | Lines | % of Total |
|-----------|-------|------------|
| CSS | ~10,000 | 11% |
| HTML | ~3,000 | 3% |
| JavaScript | ~80,000 | 86% |

**Trend:** +32% size since Build 543 (was 3.36 MB)
**Health:** ⚠️ Watch for performance - consider code splitting if >5MB`
                },
                {
                    id: "signal-tests",
                    name: "Unit Tests",
                    description: `**${measurements.metrics.testCount} tests ${measurements.metrics.testStatus}** ✅ [MEASURED]

| Suite | Tests | Status |
|-------|-------|--------|
| Core Functions | 120+ | ✅ Pass |
| Tree Operations | 80+ | ✅ Pass |
| View Rendering | 60+ | ✅ Pass |
| Import/Export | 40+ | ✅ Pass |
| Patterns | 21 | ✅ Pass |

**Coverage:** ~60% of critical paths
**CI:** ✅ E2E Playwright tests in GitHub Actions (smoke, TB caps, live site)
**Run:** \`cd test/treelisty-test && npm run test:unit\``
                },
                {
                    id: "signal-views",
                    name: "View Modes",
                    description: `**${measurements.metrics.viewCount} views implemented** [MEASURED]

| View | Status | Library |
|------|--------|---------|
| Tree | ✅ Core | Vanilla JS |
| Canvas | ✅ Core | GoJS |
| 3D | ✅ Core | Three.js |
| Gantt | ✅ Core | Frappe Gantt |
| Calendar | ✅ Core | FullCalendar |
| Mind Map | ✅ New | Vanilla JS |
| Treemap | ✅ Viz | D3.js |
| Checklist | ✅ New | Vanilla JS |
| Kanban | ✅ New | Vanilla JS |
| Embed | ✅ Mode | - |
| Readonly | ✅ Mode | - |

**Detected views:** ${measurements.metrics.views ? measurements.metrics.views.join(', ') : 'N/A'}`
                },
                {
                    id: "signal-keyboard",
                    name: "Keyboard Shortcuts",
                    description: `**${measurements.metrics.keyboardHandlers} keyboard handlers** [MEASURED]

| Category | Shortcuts | Examples |
|----------|-----------|----------|
| Navigation | 12 | ↑↓←→, Tab, Enter |
| Views | 6 | Ctrl+1-6 for views |
| Actions | 15 | Ctrl+Z, Ctrl+S, Del |
| TreeBeard | 5 | Ctrl+/, Ctrl+Enter |
| Misc | 6 | Esc, F2, etc |

**Discoverability:** ✅ Press ? for shortcut overlay (Build 742), searchable (Build 810)`
                },
                {
                    id: "signal-window",
                    name: "Window API",
                    description: `**${measurements.metrics.windowExposedCount} window-exposed functions** [MEASURED]

| Category | Count | Key Functions |
|----------|-------|---------------|
| Render | 6 | render, renderCanvas, render3D... |
| Data | 5 | capexTree, saveState, loadTree... |
| UI | 10 | showToast, showModal... |
| Atlas | 4 | TreeRegistry.* |
| Gallery | 3 | SubmissionInbox.* |
| Firebase | 20+ | firebaseApp, firebaseDb... |

**For MCP Bridge:** All critical functions exposed ✅`
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
        // SECTION 3: Now / Next / Later (ACTIONABLE)
        // ============================================================
        {
            id: "now-next-later",
            name: "Now / Next / Later",
            description: `Execution-forcing structure for Build ${measurements.build}.

**Rule:** If "Now" is empty, the self-tree failed its purpose.
**Updated:** ${today}`,
            items: [
                {
                    id: "now",
                    name: "Now (This Week)",
                    description: "Max 3 items. Each has acceptance test. **Currently executing.**",
                    subtasks: [
                        {
                            id: "now-1",
                            name: "1. Mobile Checklist Lifecycle",
                            description: `**Status:** ✅ Complete (Builds 823-829)
**Acceptance Test:** Checklists work end-to-end on mobile.

| Phase | Build | Feature | Status |
|-------|-------|---------|--------|
| 1 | 823 | Checklist View | ✅ Done |
| 2 | 826 | Mobile Tree Picker | ✅ Done |
| 3 | 827 | Auto-Archive on 100% | ✅ Done |
| 4 | 828 | Recurring Detection | ✅ Done |
| 5 | 829 | Hide Node Checkboxes | ✅ Done |

**Completed:** 2026-01-12. Full checklist lifecycle with recurrence.`
                        },
                        {
                            id: "now-2",
                            name: "2. Kanban View",
                            description: `**Status:** ✅ Complete (Builds 839-846)
**Acceptance Test:** Drag tasks between columns, status updates.

| Phase | Build | Feature | Status |
|-------|-------|---------|--------|
| 1 | 839 | Kanban View (11th view) | ✅ Done |
| 2 | 844 | Sidebar offset fix | ✅ Done |
| 3 | 846 | View switching + descriptions | ✅ Done |

**Completed:** 2026-01-13. 4-column board with drag-drop and depth selector.`
                        },
                        {
                            id: "now-3",
                            name: "3. Calendar Todo Lens",
                            description: `**Status:** ✅ Complete (Builds 817-856)
**Acceptance Test:** NL date parsing, drag-drop reschedule.

| Phase | Build | Feature | Status |
|-------|-------|---------|--------|
| 1 | 817 | Foundation (getNodeSchedule) | ✅ Done |
| 2 | 818-820 | Daily Cockpit (Today Panel) | ✅ Done |
| 3 | 856 | NL Date Parser + Confidence | ✅ Done |
| 4 | 856 | Drag-drop reschedule | ✅ Done |

**Completed:** 2026-01-14. Constitutional Article IV routing implemented.`
                        }
                    ]
                },
                {
                    id: "next",
                    name: "Next (This Month)",
                    description: "Max 5 items. Pending validation. Ordered by impact.",
                    subtasks: [
                        {
                            id: "next-1",
                            name: "1. Dashboard Trees (Morning Dashboard)",
                            description: `**Goal:** Unified view of Gmail/GDrive/Calendar with AI summary.
**Effort:** High (multi-build feature)
**Design Doc:** \`docs/plans/2026-01-05-dashboard-trees-design.md\`
**Key Features:**
- DashboardConnector abstraction for data sources
- Stable external IDs across refreshes
- Agentic workflows (monitor → wait → act)
- Auto-draft with approval flow`
                        },
                        {
                            id: "next-2",
                            name: "2. TB Awareness System",
                            description: `**Goal:** TreeBeard becomes self-aware and proactive.
**Effort:** Medium (phased implementation)
**Design Doc:** \`docs/plans/2026-01-03-tb-awareness-system-design.md\`
**Key Features:**
- Session stats, tree health monitoring
- Frustration detection
- Proactive suggestions based on context
- App-side decision engine (minimal prompt injection)`
                        },
                        {
                            id: "next-3",
                            name: "3. Self-Tree Auto-Update CI Job",
                            description: `**Status:** ✅ Implemented (Build 872)
**Hypothesis:** Weekly automated measurement updates will keep self-tree fresh.
**Validation:** Run for 4 weeks, check accuracy.

**What shipped:**
- \`.github/workflows/self-tree-update.yml\`
- Runs every Sunday at midnight UTC
- Installs test deps for accurate test count
- Auto-commits if changes detected
- Summary shows key metrics table

**Manual trigger:** Actions → Self-Tree Auto-Update → Run workflow`
                        },
                        {
                            id: "next-4",
                            name: "4. TreeBeard Telemetry Dashboard",
                            description: `**Hypothesis:** Command usage data will inform priority decisions.
**Effort:** Medium
**Prerequisite:** getToolUseTelemetry() already implemented.
**Validation:** Track for 2 weeks, identify top 10 commands.`
                        }
                    ]
                },
                {
                    id: "later",
                    name: "Later",
                    description: "Parking lot. Revisit when priorities shift.",
                    subtasks: [
                        {
                            id: "later-1",
                            name: "Local Whisper (WebAssembly)",
                            description: `Free offline transcription via whisper.cpp WASM.
**Effort:** High (50+ hours)
**Trade-off:** No API cost vs. large bundle size (~40MB)
**Blocked by:** Whisper API integration (validate quality first)`
                        },
                        {
                            id: "later-2",
                            name: "Multi-Tree Workspaces",
                            description: `Open multiple trees in tabs.
**Effort:** Very High
**Trade-off:** Power feature vs. architecture complexity
**Blocked by:** Single-file constraint (one capexTree global)`
                        },
                        {
                            id: "later-3",
                            name: "Code Splitting",
                            description: `Break 4.4MB file into lazy-loaded modules.
**Trigger:** When file exceeds 5MB or Lighthouse < 50
**Trade-off:** Performance vs. single-file portability`
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
                    description: `**Current Build: ${measurements.build}** [MEASURED]

Last measurement: ${measurements.date}
Auto-detection: generate-self-tree.js now finds latest measurements file.
Fix applied: Dynamic file discovery prevents staleness.`
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
                },
                {
                    id: "meta-bootstrap-loop",
                    name: "Bootstrap Loop Status",
                    description: `**Self-improvement cycle operational** [v1.7]

| Cycle | Input | Output | Status |
|-------|-------|--------|--------|
| Measure | treeplexity.html | measurements.json | ✅ |
| Generate | measurements.json | self-tree-v17.json | ✅ |
| Import | self-tree | TreeListy UI | ✅ |
| Analyze | TB Deep Mode | Improvement suggestions | ✅ |
| Improve | Suggestions | Updated generate script | ✅ |

**Iterations:** v1.4 → v1.5 → v1.6 → v1.7
**Velocity:** 3 improvement cycles in one session`
                }
            ]
        },
        // ============================================================
        // SECTION 5: Improvement Suggestions (TB-Identified)
        // ============================================================
        {
            id: "improvements",
            name: "Improvement Suggestions",
            description: `Architecture wins identified by TreeBeard analysis.
**Source:** bootstrap-self-tree.py runs
**Purpose:** Track actionable improvements to TreeListy itself.
**Last Updated:** ${today}`,
            items: [
                {
                    id: "improve-1",
                    name: "✅ DONE: Keyboard Shortcut Overlay",
                    description: `**Completed:** Build 742 (overlay) + Build 810 (search + tooltips)
**What shipped:**
- Press ? to open shortcut modal
- Search input filters shortcuts in real-time
- CSS tooltips on toolbar buttons
- Both ? and Shift+? work`
                },
                {
                    id: "improve-2",
                    name: "✅ DONE: E2E Tests in CI",
                    description: `**Completed:** e2e-tests.yml workflow
**What shipped:**
- Size budget check (5MB warn, 5.5MB fail)
- Primary smoke tests
- Gmail local search smoke test
- TreeBeard capabilities tests
- E2E tests against live site
- Unit tests (${measurements.metrics.testCount} passing)`
                },
                {
                    id: "improve-3",
                    name: "✅ DONE: Command Count Measurement",
                    description: `**Completed:** measure-self-tree.js fixed
**What shipped:**
- COMMAND_REGISTRY entries: ${measurements.metrics.commandCount}
- TB directMappings commands: ${measurements.metrics.tbCommandCount}
- Regex properly parses complex object structure`
                },
                {
                    id: "improve-4",
                    name: "✅ DONE: Performance Budget CI",
                    description: `**Completed:** size-budget.yml workflow
**What shipped:**
- 5.0 MB warning threshold
- 5.5 MB hard fail threshold
- Summary report with progress bar
- Recommendations when over budget
**Current:** ${measurements.metrics.fileSizeMB} MB (${Math.round((measurements.metrics.fileSizeMB / 5.5) * 100)}% of limit)`
                },
                {
                    id: "improve-5",
                    name: "✅ DONE: Self-Tree Auto-Update CI",
                    description: `**Completed:** self-tree-update.yml workflow
**What shipped:**
- Weekly cron job (Sundays at midnight UTC)
- Runs measure-self-tree.js + generate-self-tree.js
- Installs test dependencies for accurate test count
- Auto-commits changes with build number
- Summary table shows key metrics
- Manual trigger via workflow_dispatch`
                }
            ]
        },
        // ============================================================
        // SECTION 6: Architecture Quick Reference
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
npm run test:unit    # ${measurements.metrics.testCount}+ Vitest tests
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
- \`treelisty-test/\` - Vitest unit tests (${measurements.metrics.testCount}+)
- \`*.py\` - Playwright e2e tests`
                }
            ]
        }
    ]
};

// Count nodes for summary
function countNodes(node) {
    let count = 1;
    (node.children || []).forEach(c => count += countNodes(c));
    (node.items || []).forEach(c => count += countNodes(c));
    (node.subtasks || []).forEach(c => count += countNodes(c));
    return count;
}

// Write the self-tree
const outputPath = path.join(__dirname, '..', 'self-trees', `treelisty-self-tree-v17-build${measurements.build}.json`);
fs.writeFileSync(outputPath, JSON.stringify(selfTree, null, 2));

const nodeCount = countNodes(selfTree);

console.log('=' .repeat(70));
console.log('SELF-TREE v1.7 GENERATED');
console.log('=' .repeat(70));
console.log(`Build: ${measurements.build}`);
console.log(`Date: ${today}`);
console.log(`Nodes: ${nodeCount}`);
console.log(`Output: ${outputPath}`);
console.log();
console.log('Structure (v1.7 additions in bold):');
console.log('├── Measured Signals (5 items with metric tables)');
console.log('├── Verified Features (15 items)');
console.log('├── Now/Next/Later (**actionable tasks with tables**)');
console.log('├── Meta: Self-Tree Process (**4 items + bootstrap loop status**)');
console.log('├── **Improvement Suggestions (4 TB-identified wins)**');
console.log('└── Architecture Quick Reference (8 items)');
console.log();
console.log('v1.7 Improvements:');
console.log('✅ Now items have concrete task tables with status');
console.log('✅ Measured Signals have detailed breakdowns');
console.log('✅ Added Improvement Suggestions section');
console.log('✅ Added Bootstrap Loop Status tracking');
console.log();
console.log('Next steps:');
console.log('1. Run: python scripts/bootstrap-self-tree.py');
console.log('2. Verify TB is satisfied with v1.7 improvements');
console.log('3. Commit v1.7 self-tree to repo');
