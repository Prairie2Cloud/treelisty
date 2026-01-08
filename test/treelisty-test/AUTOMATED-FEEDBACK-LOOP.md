# Automated Test Feedback Loop for Claude Dev

**Version:** 1.0
**Last Updated:** 2026-01-08
**Purpose:** Define how automated tests communicate results to Claude Code for iterative fixes

---

## Overview

The feedback loop enables Claude Code to:
1. Run tests automatically after making changes
2. Receive structured failure information
3. Iterate on fixes without manual intervention
4. Know when to stop (all tests pass)

---

## Feedback Loop Architecture

```
┌─────────────────┐
│  Claude Code    │
│  makes change   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Run smoke      │◄──── npm run test:smoke
│  tests          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse results  │◄──── JSON output format
│  structured     │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Pass?   │
    └────┬────┘
    No   │   Yes
    │    │    │
    ▼    │    ▼
┌───────┐│┌────────┐
│ Fix   │││ Commit │
│ issue ││└────────┘
└───┬───┘│
    │    │
    └────┘ (iterate)
```

---

## JSON Output Format

Tests should output structured JSON for Claude Code to parse:

```json
{
  "summary": {
    "total": 12,
    "passed": 10,
    "failed": 2,
    "skipped": 0,
    "duration_ms": 45000
  },
  "failures": [
    {
      "test_id": "S3.3",
      "test_name": "Dashboard Gmail import loads tree into view",
      "file": "test/smoke/primary-smoke.spec.js",
      "line": 145,
      "error_type": "AssertionError",
      "error_message": "Gmail tree loaded but NOT VISIBLE",
      "expected": "true",
      "actual": "false",
      "code_hint": "Check that render() is called after capexTree assignment",
      "related_functions": ["importFetchedDashboardTree", "render"],
      "screenshot": "test-results/S3.3-failure.png"
    }
  ],
  "build": 790,
  "timestamp": "2026-01-08T05:45:00.000Z"
}
```

---

## Playwright Reporter Configuration

Add custom reporter to `playwright.config.js`:

```javascript
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['./test/reporters/claude-feedback-reporter.js']
  ],
  // ... other config
});
```

---

## Claude Feedback Reporter

Create `test/reporters/claude-feedback-reporter.js`:

```javascript
/**
 * Custom Playwright reporter that outputs structured feedback for Claude Code
 */
class ClaudeFeedbackReporter {
  constructor(options = {}) {
    this.results = {
      summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
      failures: [],
      timestamp: new Date().toISOString()
    };
  }

  onBegin(config, suite) {
    console.log('\\n🧪 Starting TreeListy Smoke Tests...');
  }

  onTestEnd(test, result) {
    this.results.summary.total++;

    if (result.status === 'passed') {
      this.results.summary.passed++;
    } else if (result.status === 'failed') {
      this.results.summary.failed++;
      this.results.failures.push(this.formatFailure(test, result));
    } else if (result.status === 'skipped') {
      this.results.summary.skipped++;
    }
  }

  formatFailure(test, result) {
    const error = result.error || {};
    return {
      test_id: test.title.match(/^S\\d+\\.\\d+/)?.[0] || test.title,
      test_name: test.title,
      file: test.location?.file,
      line: test.location?.line,
      error_type: error.name || 'Error',
      error_message: error.message || 'Unknown error',
      expected: error.matcherResult?.expected,
      actual: error.matcherResult?.actual,
      code_hint: this.generateCodeHint(test, error),
      stack_trace: error.stack?.split('\\n').slice(0, 5).join('\\n')
    };
  }

  generateCodeHint(test, error) {
    // Provide actionable hints based on common failure patterns
    const msg = error.message || '';

    if (msg.includes('NOT VISIBLE')) {
      return 'Check that render() is called after data assignment';
    }
    if (msg.includes('not loaded into capexTree')) {
      return 'Verify window.capexTree = treeData is executed';
    }
    if (msg.includes('modal did not open')) {
      return 'Check keyboard shortcut handler or button click handler';
    }
    if (msg.includes('timeout')) {
      return 'Element may not exist or selector may be wrong';
    }

    return 'Review the assertion and check related code paths';
  }

  onEnd(result) {
    const { passed, failed, total } = this.results.summary;

    console.log('\\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS FOR CLAUDE CODE');
    console.log('='.repeat(60));
    console.log(`Total: ${total} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\\n❌ FAILURES REQUIRING FIXES:');
      console.log('-'.repeat(60));

      this.results.failures.forEach((f, i) => {
        console.log(`\\n[${i + 1}] ${f.test_id}: ${f.test_name}`);
        console.log(`    File: ${f.file}:${f.line}`);
        console.log(`    Error: ${f.error_message}`);
        console.log(`    💡 Hint: ${f.code_hint}`);
      });

      console.log('\\n' + '='.repeat(60));
      console.log('🔧 ACTION REQUIRED: Fix failures and re-run tests');
      console.log('='.repeat(60));
    } else {
      console.log('\\n✅ ALL TESTS PASSED - Safe to commit and deploy');
    }

    // Output JSON for programmatic parsing
    console.log('\\n📋 JSON OUTPUT:');
    console.log(JSON.stringify(this.results, null, 2));
  }
}

export default ClaudeFeedbackReporter;
```

---

## Claude Code Integration Script

Create `.claude/commands/run-smoke-tests.md`:

```markdown
# Run Smoke Tests

Run the primary smoke tests and iterate on failures.

## Command

1. Run tests:
   ```bash
   cd test/treelisty-test && npm run test:smoke:primary 2>&1
   ```

2. Parse output for JSON results block

3. If failures exist:
   - Read failure details
   - Identify related functions
   - Make targeted fixes
   - Re-run tests

4. Repeat until all tests pass

5. When all pass: Commit and push
```

---

## Iteration Protocol

### Step 1: Run Tests
```bash
cd test/treelisty-test && npm run test:smoke:primary
```

### Step 2: Parse Failure Output
Look for JSON block in output:
```
📋 JSON OUTPUT:
{ "summary": { ... }, "failures": [ ... ] }
```

### Step 3: For Each Failure

1. **Read the hint**: `code_hint` tells you what to check
2. **Find the function**: `related_functions` lists where to look
3. **Check the assertion**: `expected` vs `actual` shows the gap
4. **Make minimal fix**: Only change what's necessary

### Step 4: Re-run and Verify

After each fix, re-run tests to verify:
- The specific failure is resolved
- No new failures introduced
- Continue until `failed: 0`

---

## Example Iteration Session

```
Claude Code: Made change to importFetchedDashboardTree()

Claude Code: Running tests...
$ npm run test:smoke:primary

Output:
❌ FAILURES REQUIRING FIXES:
[1] S3.3: Dashboard Gmail import loads tree into view
    File: test/smoke/primary-smoke.spec.js:145
    Error: Gmail tree loaded but NOT VISIBLE
    💡 Hint: Check that render() is called after data assignment

Claude Code: The hint says render() may not be called. Let me check...

*reads importFetchedDashboardTree()*

Claude Code: Found it - render() was not being called. Adding it now.

*edits treeplexity.html*

Claude Code: Re-running tests...
$ npm run test:smoke:primary

Output:
✅ ALL TESTS PASSED - Safe to commit and deploy

Claude Code: Tests pass. Committing...
```

---

## Integration with CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/smoke-test.yml
name: Smoke Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd test/treelisty-test
          npm ci
          npx playwright install chromium

      - name: Run smoke tests
        run: |
          cd test/treelisty-test
          npm run test:smoke:primary

      - name: Upload results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: smoke-test-results
          path: test/treelisty-test/test-results/
```

---

## Success Criteria

The feedback loop is successful when:

1. **Structured Output**: Test results are parseable JSON
2. **Actionable Hints**: Each failure includes a fix suggestion
3. **Fast Iteration**: Claude can fix and re-run in <5 minutes
4. **Clear Termination**: "ALL TESTS PASSED" signals completion
5. **No Manual Intervention**: Entire loop runs autonomously

---

## Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Avg iterations to fix | <3 | TBD |
| Time per iteration | <5 min | TBD |
| False positive rate | <5% | TBD |
| Coverage of user journeys | >80% | ~50% |
