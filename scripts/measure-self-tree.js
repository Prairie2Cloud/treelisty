/**
 * Self-Tree Live Wire - Automated Measurement Script
 * Gathers current signals from TreeListy codebase for self-tree updates
 *
 * Usage: node scripts/measure-self-tree.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TREEPLEXITY_PATH = path.join(__dirname, '..', 'treeplexity.html');
const SELF_TREE_PATH = path.join(__dirname, '..', 'self-trees', 'treelisty-self-tree-v14-trust-cognitive.json');

console.log('=' .repeat(70));
console.log('SELF-TREE LIVE WIRE - Build 700 Measurements');
console.log('=' .repeat(70));
console.log(`Date: ${new Date().toISOString().split('T')[0]}`);
console.log();

// Read the source file
const source = fs.readFileSync(TREEPLEXITY_PATH, 'utf-8');
const lines = source.split('\n');

// ============================================================
// SIGNAL 1: File Size & Lines
// ============================================================
const stats = fs.statSync(TREEPLEXITY_PATH);
const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
const lineCount = lines.length;

console.log('📊 FILE METRICS');
console.log(`   Size: ${fileSizeMB} MB`);
console.log(`   Lines: ${lineCount.toLocaleString()}`);

// ============================================================
// SIGNAL 2: Unit Tests
// ============================================================
let testCount = 'unknown';
let testStatus = 'unknown';
try {
    const testDir = path.join(__dirname, '..', 'test', 'treelisty-test');
    const result = execSync('npm run test:unit 2>&1', {
        cwd: testDir,
        encoding: 'utf-8',
        timeout: 60000
    });

    // Parse test count from output
    const match = result.match(/(\d+) passing/);
    if (match) {
        testCount = parseInt(match[1]);
        testStatus = 'passing';
    }
} catch (e) {
    // Check if tests ran but some failed
    const output = e.stdout || e.message;
    const passMatch = output.match(/(\d+) passing/);
    const failMatch = output.match(/(\d+) failing/);
    if (passMatch) {
        testCount = parseInt(passMatch[1]);
        testStatus = failMatch ? `${passMatch[1]} passing, ${failMatch[1]} failing` : 'passing';
    }
}

console.log();
console.log('🧪 UNIT TESTS');
console.log(`   Count: ${testCount}`);
console.log(`   Status: ${testStatus}`);

// ============================================================
// SIGNAL 3: Command Count
// ============================================================
const commandMatches = source.match(/COMMAND_REGISTRY\s*=\s*\{[\s\S]*?\n\s*\}/);
let commandCount = 0;
if (commandMatches) {
    // Count command entries
    const commandSection = commandMatches[0];
    const commands = commandSection.match(/'[a-z_]+'\s*:/g) || [];
    commandCount = commands.length;
}

// Also count TB command handlers
const tbHandlerMatches = source.match(/handlers\[['"]([a-z_]+)['"]\]/g) || [];
const tbCommandCount = new Set(tbHandlerMatches.map(m => m.match(/['"]([a-z_]+)['"]/)[1])).size;

console.log();
console.log('🎮 COMMANDS');
console.log(`   COMMAND_REGISTRY entries: ${commandCount}`);
console.log(`   TB handler references: ${tbCommandCount}`);

// ============================================================
// SIGNAL 4: Views
// ============================================================
const viewMatches = source.match(/viewMode\s*===?\s*['"](\w+)['"]/g) || [];
const views = new Set(viewMatches.map(m => m.match(/['"](\w+)['"]/)[1]));

console.log();
console.log('👁️ VIEWS');
console.log(`   Count: ${views.size}`);
console.log(`   Types: ${Array.from(views).join(', ')}`);

// ============================================================
// SIGNAL 5: Patterns
// ============================================================
const patternMatches = source.match(/PATTERNS\s*=\s*\{[\s\S]*?\n\s*\};/);
let patternCount = 0;
let patternNames = [];
if (patternMatches) {
    const patternSection = patternMatches[0];
    const patterns = patternSection.match(/'([a-z-]+)'\s*:\s*\{/g) || [];
    patternNames = patterns.map(p => p.match(/'([a-z-]+)'/)[1]);
    patternCount = patternNames.length;
}

console.log();
console.log('📐 PATTERNS');
console.log(`   Count: ${patternCount}`);
console.log(`   Names: ${patternNames.slice(0, 10).join(', ')}${patternCount > 10 ? '...' : ''}`);

// ============================================================
// SIGNAL 6: Keyboard Shortcuts
// ============================================================
const keyHandlers = source.match(/e\.key\s*===?\s*['"][^'"]+['"]/g) || [];
const keyCodeHandlers = source.match(/e\.keyCode\s*===?\s*\d+/g) || [];
const totalKeyHandlers = keyHandlers.length + keyCodeHandlers.length;

console.log();
console.log('⌨️ KEYBOARD HANDLERS');
console.log(`   e.key checks: ${keyHandlers.length}`);
console.log(`   e.keyCode checks: ${keyCodeHandlers.length}`);
console.log(`   Total: ${totalKeyHandlers}`);

// ============================================================
// SIGNAL 7: Build Version
// ============================================================
const versionMatch = source.match(/TREELISTY_VERSION\s*=\s*\{[\s\S]*?build:\s*(\d+)/);
const build = versionMatch ? versionMatch[1] : 'unknown';

const headerMatch = source.match(/TreeListy\s+v([\d.]+)\s*\|\s*Build\s*(\d+)/);
const version = headerMatch ? headerMatch[1] : 'unknown';

console.log();
console.log('🏷️ VERSION');
console.log(`   Version: ${version}`);
console.log(`   Build: ${build}`);

// ============================================================
// SIGNAL 8: Key Features (code presence)
// ============================================================
console.log();
console.log('🔍 FEATURE DETECTION');

const features = {
    'Gallery (SubmissionInbox)': /class\s+SubmissionInbox|SubmissionInbox\s*=/.test(source),
    'Atlas (TreeRegistry)': /class\s+TreeRegistry|TreeRegistry\s*=/.test(source),
    'Focus Mode': /enterFocusMode|exitFocusMode/.test(source),
    'Mind Map': /renderMindMap|view-mindmap/.test(source),
    'TTS (speakNode)': /speakNode|toggleTTS/.test(source),
    'Chrome Extension': /ext_capture_screen|ext_extract_dom/.test(source),
    'MCP Bridge': /mcpBridgeState|MCP_BRIDGE/.test(source),
    'Hyperedges': /hyperedges|createHyperedge/.test(source),
    'Gantt View': /renderGantt|FrappeGantt/.test(source),
    'Calendar View': /renderCalendar|FullCalendar/.test(source),
    '3D View': /render3D|THREE\./.test(source),
    'Canvas View': /renderCanvas|GoJS|canvas-container/.test(source),
    'Live Sync (Firebase)': /firebaseSyncState|syncRoom/.test(source),
    'Image Analysis': /analyzeImage|image_to_tree/.test(source),
    'TB Structured Tool Use': /TOOL_TIERS|executeToolCall/.test(source),
};

for (const [feature, present] of Object.entries(features)) {
    console.log(`   ${present ? '✅' : '❌'} ${feature}`);
}

// ============================================================
// SIGNAL 9: Window-Exposed Functions
// ============================================================
const windowExposed = source.match(/window\.(\w+)\s*=/g) || [];
const exposedFunctions = [...new Set(windowExposed.map(m => m.match(/window\.(\w+)/)[1]))];

console.log();
console.log('🌐 WINDOW-EXPOSED');
console.log(`   Count: ${exposedFunctions.length}`);
console.log(`   Sample: ${exposedFunctions.slice(0, 8).join(', ')}...`);

// ============================================================
// SUMMARY JSON
// ============================================================
const measurements = {
    date: new Date().toISOString(),
    build: parseInt(build) || 0,
    version: version,
    metrics: {
        fileSizeMB: parseFloat(fileSizeMB),
        lineCount: lineCount,
        testCount: typeof testCount === 'number' ? testCount : 0,
        testStatus: testStatus,
        commandCount: commandCount,
        tbCommandCount: tbCommandCount,
        viewCount: views.size,
        views: Array.from(views),
        patternCount: patternCount,
        keyboardHandlers: totalKeyHandlers,
        windowExposedCount: exposedFunctions.length
    },
    features: features
};

console.log();
console.log('=' .repeat(70));
console.log('MEASUREMENTS JSON');
console.log('=' .repeat(70));
console.log(JSON.stringify(measurements, null, 2));

// Write to file
const outputPath = path.join(__dirname, '..', 'self-trees', `measurements-build${build}.json`);
fs.writeFileSync(outputPath, JSON.stringify(measurements, null, 2));
console.log();
console.log(`📁 Saved to: ${outputPath}`);
