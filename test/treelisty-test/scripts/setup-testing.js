#!/usr/bin/env node
/**
 * Treelisty Test Setup Script
 * 
 * Run this once to initialize the testing environment.
 * 
 * Usage: node scripts/setup-testing.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

console.log('🚀 Treelisty Test Setup\n');
console.log('='.repeat(50));

// Step 1: Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
console.log(`\n📌 Node.js version: ${nodeVersion}`);

if (majorVersion < 18) {
    console.error('❌ Node.js 18+ is required. Please upgrade.');
    process.exit(1);
}
console.log('✅ Node.js version OK');

// Step 2: Check for treeplexity.html
const sourceFile = path.join(ROOT_DIR, '..', 'treeplexity.html');
console.log(`\n📌 Checking for source file...`);
console.log(`   Looking in: ${sourceFile}`);

if (!fs.existsSync(sourceFile)) {
    console.error('❌ treeplexity.html not found!');
    console.error('   Expected location: ../treeplexity.html (parent directory)');
    console.error('   Current directory: ' + ROOT_DIR);
    console.error('\n   Please ensure treeplexity.html is in the parent directory.');
    process.exit(1);
}
console.log('✅ Source file found');

// Step 3: Install dependencies
console.log('\n📌 Installing dependencies...');
try {
    execSync('npm install', { 
        cwd: ROOT_DIR, 
        stdio: 'inherit' 
    });
    console.log('✅ Dependencies installed');
} catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
}

// Step 4: Install Playwright browsers
console.log('\n📌 Installing Playwright browsers...');
try {
    execSync('npx playwright install chromium', { 
        cwd: ROOT_DIR, 
        stdio: 'inherit' 
    });
    console.log('✅ Playwright browsers installed');
} catch (error) {
    console.warn('⚠️  Playwright browser installation had issues');
    console.warn('   You can install manually with: npx playwright install');
}

// Step 5: Run initial extraction
console.log('\n📌 Running initial module extraction...');
try {
    execSync('npm run extract', { 
        cwd: ROOT_DIR, 
        stdio: 'inherit' 
    });
    console.log('✅ Testable modules extracted');
} catch (error) {
    console.error('❌ Module extraction failed');
    console.error('   Check scripts/extract-testable.js for errors');
    process.exit(1);
}

// Step 6: Create test results directories
console.log('\n📌 Creating output directories...');
const dirs = [
    'coverage',
    'test-results',
    'playwright-report'
];

for (const dir of dirs) {
    const dirPath = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`   Created: ${dir}/`);
    }
}
console.log('✅ Output directories ready');

// Step 7: Create .gitignore for test artifacts
console.log('\n📌 Creating .gitignore...');
const gitignore = `# Test artifacts
coverage/
test-results/
playwright-report/

# Generated files
test/treelisty-core.js

# Dependencies
node_modules/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
`;

fs.writeFileSync(path.join(ROOT_DIR, '.gitignore'), gitignore);
console.log('✅ .gitignore created');

// Step 8: Run a quick sanity test
console.log('\n📌 Running sanity test...');
try {
    execSync('npx vitest run test/unit/migration.test.js --reporter=dot', { 
        cwd: ROOT_DIR, 
        stdio: 'inherit' 
    });
    console.log('✅ Sanity test passed');
} catch (error) {
    console.warn('⚠️  Sanity test had issues (this is OK for initial setup)');
    console.warn('   Run "npm run test:unit" to see detailed output');
}

// Done!
console.log('\n' + '='.repeat(50));
console.log('🎉 Setup Complete!\n');
console.log('Next steps:');
console.log('  1. Run unit tests:        npm run test:unit');
console.log('  2. Run all tests:         npm test');
console.log('  3. Watch mode:            npm run test:watch');
console.log('  4. Run E2E tests:         npm run test:e2e');
console.log('\nFor more info, see AI-CONTEXT.md');
