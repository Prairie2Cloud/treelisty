#!/usr/bin/env node
/**
 * Quick file size check for TreeListy
 *
 * Usage: npm run size
 */

const fs = require('fs');

const files = [
    { path: 'treeplexity.html', name: 'Source' },
    { path: 'treeplexity.min.html', name: 'Minified' }
];

console.log('📊 TreeListy File Sizes');
console.log('═'.repeat(40));

files.forEach(({ path, name }) => {
    if (fs.existsSync(path)) {
        const stats = fs.statSync(path);
        const sizeBytes = stats.size;
        const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
        const sizeKB = Math.round(sizeBytes / 1024);
        console.log(`${name.padEnd(12)} ${sizeMB} MB (${sizeKB.toLocaleString()} KB)`);
    } else {
        console.log(`${name.padEnd(12)} (not found)`);
    }
});

// Budget check
const source = fs.existsSync('treeplexity.html') ? fs.statSync('treeplexity.html').size : 0;
const WARN_THRESHOLD = 5.0 * 1024 * 1024;  // 5.0 MB
const FAIL_THRESHOLD = 5.5 * 1024 * 1024;  // 5.5 MB

console.log('═'.repeat(40));

if (source > FAIL_THRESHOLD) {
    console.log(`❌ OVER BUDGET: Source exceeds 5.5 MB limit`);
    process.exit(1);
} else if (source > WARN_THRESHOLD) {
    console.log(`⚠️  WARNING: Source exceeds 5.0 MB`);
} else {
    console.log(`✅ Within budget (limit: 5.5 MB)`);
}
