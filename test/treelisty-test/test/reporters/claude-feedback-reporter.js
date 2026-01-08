/**
 * Claude Feedback Reporter for Playwright
 *
 * Custom reporter that outputs structured feedback for Claude Code
 * to enable automated test iteration and fix loops.
 *
 * Usage in playwright.config.js:
 *   reporter: [
 *     ['html'],
 *     ['./test/reporters/claude-feedback-reporter.js']
 *   ]
 */

class ClaudeFeedbackReporter {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        duration_ms: 0
      },
      failures: [],
      warnings: [],
      timestamp: new Date().toISOString(),
      build: this.extractBuildNumber()
    };
    this.startTime = Date.now();
  }

  extractBuildNumber() {
    // Try to extract build number from environment or package
    try {
      const fs = require('fs');
      const path = require('path');
      const htmlPath = path.resolve(__dirname, '../../../../treeplexity.html');
      if (fs.existsSync(htmlPath)) {
        const content = fs.readFileSync(htmlPath, 'utf8').slice(0, 1000);
        const match = content.match(/Build\s+(\d+)/i);
        if (match) return parseInt(match[1], 10);
      }
    } catch (e) {
      // Ignore errors
    }
    return process.env.BUILD_NUMBER || 'unknown';
  }

  onBegin(config, suite) {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TREELISTY SMOKE TESTS - Claude Feedback Mode');
    console.log('='.repeat(60));
    console.log(`Started: ${new Date().toISOString()}`);
    console.log(`Test files: ${suite.allTests().length} tests`);
    console.log('-'.repeat(60) + '\n');
  }

  onTestBegin(test) {
    // Optional: Log test start for verbose mode
    if (this.options.verbose) {
      console.log(`  ▶ Running: ${test.title}`);
    }
  }

  onTestEnd(test, result) {
    this.results.summary.total++;

    const testInfo = {
      test_id: this.extractTestId(test.title),
      test_name: test.title,
      file: test.location?.file?.replace(/.*[\/\\]/, '') || 'unknown',
      line: test.location?.line || 0,
      duration_ms: result.duration
    };

    switch (result.status) {
      case 'passed':
        this.results.summary.passed++;
        if (this.options.verbose) {
          console.log(`  ✅ ${testInfo.test_id}: PASSED (${result.duration}ms)`);
        }
        break;

      case 'failed':
        this.results.summary.failed++;
        this.results.failures.push(this.formatFailure(test, result));
        console.log(`  ❌ ${testInfo.test_id}: FAILED`);
        break;

      case 'timedOut':
        this.results.summary.failed++;
        this.results.failures.push({
          ...testInfo,
          error_type: 'TimeoutError',
          error_message: `Test timed out after ${result.duration}ms`,
          code_hint: 'Check for slow operations, missing elements, or infinite loops',
          related_functions: this.inferRelatedFunctions(test.title)
        });
        console.log(`  ⏱️ ${testInfo.test_id}: TIMEOUT`);
        break;

      case 'skipped':
        this.results.summary.skipped++;
        if (this.options.verbose) {
          console.log(`  ⏭️ ${testInfo.test_id}: SKIPPED`);
        }
        break;
    }

    if (result.retry > 0 && result.status === 'passed') {
      this.results.summary.flaky++;
      this.results.warnings.push({
        test_id: testInfo.test_id,
        warning: 'Flaky test - passed on retry',
        retries: result.retry
      });
    }
  }

  extractTestId(title) {
    // Extract test ID from title like "S1.1: App loads without errors"
    const match = title.match(/^([A-Z]+[\d.]+)/);
    return match ? match[1] : title.slice(0, 30);
  }

  formatFailure(test, result) {
    const error = result.error || {};
    const errorMessage = error.message || 'Unknown error';

    return {
      test_id: this.extractTestId(test.title),
      test_name: test.title,
      file: test.location?.file?.replace(/.*[\/\\]/, '') || 'unknown',
      line: test.location?.line || 0,
      error_type: error.name || 'Error',
      error_message: this.truncateMessage(errorMessage),
      expected: this.extractExpected(errorMessage),
      actual: this.extractActual(errorMessage),
      code_hint: this.generateCodeHint(test, error),
      related_functions: this.inferRelatedFunctions(test.title),
      stack_trace: this.formatStackTrace(error.stack),
      screenshot: result.attachments?.find(a => a.name === 'screenshot')?.path
    };
  }

  truncateMessage(message) {
    const maxLength = 500;
    if (message.length > maxLength) {
      return message.slice(0, maxLength) + '... (truncated)';
    }
    return message;
  }

  extractExpected(message) {
    const match = message.match(/expected[:\s]+['""]?([^'""\n]+)/i);
    return match ? match[1].slice(0, 100) : undefined;
  }

  extractActual(message) {
    const match = message.match(/received[:\s]+['""]?([^'""\n]+)/i);
    return match ? match[1].slice(0, 100) : undefined;
  }

  formatStackTrace(stack) {
    if (!stack) return undefined;
    // Return first 5 lines of stack trace
    return stack.split('\n').slice(0, 5).join('\n');
  }

  generateCodeHint(test, error) {
    const msg = (error.message || '').toLowerCase();
    const title = test.title.toLowerCase();

    // Pattern-based hints for common failures
    const hints = [
      // Visibility issues
      [/not visible|hidden|display:\s*none/i,
       'Check that render() is called after data assignment. Verify CSS display/visibility.'],

      // Load issues
      [/not loaded|capextree is (null|undefined)/i,
       'Verify window.capexTree = treeData is executed before render()'],

      // Modal issues
      [/modal.*not.*open|modal.*not.*visible/i,
       'Check modal trigger (keyboard shortcut or button click handler)'],

      // Timeout issues
      [/timeout|timed out/i,
       'Element may not exist, selector may be wrong, or operation is too slow'],

      // TreeBeard issues
      [/treebeard|tb.*command/i,
       'Check TB command routing in directMappings or preflightCapabilityCheck'],

      // View switching
      [/view.*switch|canvas|3d|gantt/i,
       'Check switchView() function and view container visibility toggling'],

      // Import issues
      [/import|load.*tree/i,
       'Verify importTree() sets capexTree and calls render()'],

      // Undo/Redo issues
      [/undo|redo|history/i,
       'Check saveState() is called before changes, verify historyStack/redoStack'],

      // Dashboard issues
      [/dashboard/i,
       'Check importFetchedDashboardTree() and dashboard modal close logic'],

      // Gmail issues
      [/gmail|inbox|email/i,
       'Check populateInboxPanel() and Gmail tree pattern detection']
    ];

    for (const [pattern, hint] of hints) {
      if (pattern.test(msg) || pattern.test(title)) {
        return hint;
      }
    }

    return 'Review the assertion and check related code paths. Add console.log for debugging.';
  }

  inferRelatedFunctions(testTitle) {
    const title = testTitle.toLowerCase();
    const functions = [];

    // Map test categories to related functions
    const mappings = [
      [/import|load.*tree/, ['importTree', 'importFetchedDashboardTree', 'normalizeTreeStructure']],
      [/dashboard/, ['openDashboardModal', 'importFetchedDashboardTree', 'fetchDashboardData']],
      [/gmail|inbox/, ['populateInboxPanel', 'isGmailTree', 'switchToEmailView']],
      [/view.*switch|canvas/, ['switchView', 'renderCanvas', 'render']],
      [/3d/, ['render3D', 'switchView']],
      [/gantt/, ['renderGantt', 'switchView']],
      [/treebeard|tb/, ['sendTreeBeardMessage', 'preflightCapabilityCheck', 'executeCommand']],
      [/undo/, ['undo', 'saveState', 'historyStack']],
      [/redo/, ['redo', 'redoStack']],
      [/expand/, ['expandAll', 'expandNode', 'setExpanded']],
      [/collapse/, ['collapseAll', 'collapseNode', 'setExpanded']],
      [/add.*child/, ['addChild', 'createNode', 'saveState']],
      [/rename/, ['renameNode', 'updateNode', 'saveState']],
      [/delete/, ['deleteNode', 'removeNode', 'saveState']],
      [/search/, ['searchNodes', 'findNodeByName', 'filterTree']]
    ];

    for (const [pattern, funcs] of mappings) {
      if (pattern.test(title)) {
        functions.push(...funcs);
      }
    }

    return [...new Set(functions)].slice(0, 5);
  }

  onEnd(result) {
    this.results.summary.duration_ms = Date.now() - this.startTime;

    const { passed, failed, skipped, total, flaky } = this.results.summary;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS FOR CLAUDE CODE');
    console.log('='.repeat(60));
    console.log(`Build: ${this.results.build}`);
    console.log(`Duration: ${(this.results.summary.duration_ms / 1000).toFixed(1)}s`);
    console.log(`Total: ${total} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭️ Skipped: ${skipped}`);

    if (flaky > 0) {
      console.log(`⚠️ Flaky: ${flaky}`);
    }

    if (failed > 0) {
      console.log('\n❌ FAILURES REQUIRING FIXES:');
      console.log('-'.repeat(60));

      this.results.failures.forEach((f, i) => {
        console.log(`\n[${i + 1}] ${f.test_id}: ${f.test_name}`);
        console.log(`    📁 File: ${f.file}:${f.line}`);
        console.log(`    ❗ Error: ${f.error_message.slice(0, 200)}`);
        if (f.expected) console.log(`    Expected: ${f.expected}`);
        if (f.actual) console.log(`    Actual: ${f.actual}`);
        console.log(`    💡 Hint: ${f.code_hint}`);
        if (f.related_functions.length > 0) {
          console.log(`    🔍 Check: ${f.related_functions.join(', ')}`);
        }
        if (f.screenshot) {
          console.log(`    📷 Screenshot: ${f.screenshot}`);
        }
      });

      console.log('\n' + '='.repeat(60));
      console.log('🔧 ACTION REQUIRED: Fix failures and re-run tests');
      console.log('   Command: npm run test:smoke:primary');
      console.log('='.repeat(60));
    } else {
      console.log('\n✅ ALL TESTS PASSED - Safe to commit and deploy');
      console.log('   Next: git add . && git commit -m "Build XXX: description"');
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.results.warnings.forEach(w => {
        console.log(`   - ${w.test_id}: ${w.warning}`);
      });
    }

    // Output JSON for programmatic parsing
    console.log('\n📋 JSON OUTPUT:');
    console.log('---BEGIN-JSON---');
    console.log(JSON.stringify(this.results, null, 2));
    console.log('---END-JSON---');

    // Write JSON to file for CI/CD artifacts
    try {
      const fs = require('fs');
      const path = require('path');
      const outputDir = path.resolve(__dirname, '../../test-results');
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(
        path.join(outputDir, 'claude-feedback.json'),
        JSON.stringify(this.results, null, 2)
      );
      console.log(`\n📄 Results saved to: test-results/claude-feedback.json`);
    } catch (e) {
      // Ignore file write errors
    }
  }

  printsToStdio() {
    return true;
  }
}

module.exports = ClaudeFeedbackReporter;
