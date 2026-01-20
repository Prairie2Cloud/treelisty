#!/usr/bin/env node
/**
 * TreeListy Minification Script
 *
 * Minifies treeplexity.html using html-minifier-terser for:
 * - ~70% file size reduction (5.47 MB → ~1.6 MB)
 * - Faster initial load times
 *
 * Usage:
 *   npm run minify           # Creates treeplexity.min.html
 *   npm run minify -- --prod # Also creates production copy
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('html-minifier-terser');

const SOURCE_FILE = 'treeplexity.html';
const OUTPUT_FILE = 'treeplexity.min.html';

// Minification options optimized for TreeListy
const options = {
    // HTML
    collapseWhitespace: true,
    conservativeCollapse: true, // Keep at least one space (safer for inline elements)
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,

    // CSS
    minifyCSS: {
        level: {
            1: {
                specialComments: 0 // Remove all CSS comments
            },
            2: {
                mergeMedia: true,
                restructureRules: true
            }
        }
    },

    // JavaScript (via Terser)
    minifyJS: {
        compress: {
            drop_console: false,  // Keep console.log for debugging
            drop_debugger: true,
            passes: 2,            // Multiple compression passes
            pure_funcs: [],       // Don't remove any functions
            unsafe: false         // Safe mode - don't break semantics
        },
        mangle: {
            keep_fnames: true,    // Keep function names (for stack traces)
            reserved: [           // Don't mangle these globals
                'capexTree',
                'TELEMETRY',
                'TREELISTY_VERSION',
                'PATTERNS',
                'viewMode',
                'selectedNodeId',
                'firebaseSyncState',
                'mcpBridgeState',
                'TreeRegistry',
                'tbState',
                'historyStack',
                'redoStack',
                'directMappings'
            ]
        },
        format: {
            comments: false       // Remove JS comments
        }
    },

    // Don't touch inline event handlers or data attributes
    ignoreCustomFragments: [
        /<%[\s\S]*?%>/,
        /<\?[\s\S]*?\?>/
    ]
};

async function minifyTreeListy() {
    const startTime = Date.now();

    console.log('🔧 TreeListy Minification');
    console.log('═'.repeat(50));

    // Check source file exists
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error(`❌ Source file not found: ${SOURCE_FILE}`);
        process.exit(1);
    }

    // Read source file
    const source = fs.readFileSync(SOURCE_FILE, 'utf8');
    const sourceSize = Buffer.byteLength(source, 'utf8');
    console.log(`📄 Source: ${SOURCE_FILE}`);
    console.log(`   Size: ${(sourceSize / 1024 / 1024).toFixed(2)} MB (${sourceSize.toLocaleString()} bytes)`);

    // Count lines
    const lineCount = source.split('\n').length;
    console.log(`   Lines: ${lineCount.toLocaleString()}`);

    try {
        console.log('\n⏳ Minifying (this may take a moment)...');

        // Minify
        const minified = await minify(source, options);
        const minifiedSize = Buffer.byteLength(minified, 'utf8');

        // Write output
        fs.writeFileSync(OUTPUT_FILE, minified);

        // Calculate stats
        const reduction = sourceSize - minifiedSize;
        const reductionPercent = ((reduction / sourceSize) * 100).toFixed(1);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`\n✅ Minification complete!`);
        console.log('═'.repeat(50));
        console.log(`📄 Output: ${OUTPUT_FILE}`);
        console.log(`   Size: ${(minifiedSize / 1024 / 1024).toFixed(2)} MB (${minifiedSize.toLocaleString()} bytes)`);
        console.log(`   Reduction: ${(reduction / 1024 / 1024).toFixed(2)} MB (${reductionPercent}%)`);
        console.log(`   Duration: ${duration}s`);

        // Show compression potential
        console.log('\n💡 Additional compression potential:');
        console.log(`   gzip:   ~${(minifiedSize * 0.25 / 1024).toFixed(0)} KB (75% reduction)`);
        console.log(`   brotli: ~${(minifiedSize * 0.20 / 1024).toFixed(0)} KB (80% reduction)`);

        // Warning if file is still large
        if (minifiedSize > 2 * 1024 * 1024) {
            console.log('\n⚠️  Minified file is still >2MB. Consider:');
            console.log('   - Code splitting with dynamic import()');
            console.log('   - Lazy loading view modules');
            console.log('   - Moving patterns to separate files');
        }

        return { sourceSize, minifiedSize, reduction, reductionPercent };

    } catch (error) {
        console.error(`\n❌ Minification failed: ${error.message}`);
        if (error.line) {
            console.error(`   Line: ${error.line}, Column: ${error.col}`);
        }
        process.exit(1);
    }
}

// Run
minifyTreeListy();
