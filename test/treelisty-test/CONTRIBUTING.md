# Contributing to TreeListy Tests

Guidelines for writing and maintaining tests for TreeListy.

## Test Structure

```
test/treelisty-test/
├── scripts/
│   └── extract-testable.js    # Extracts functions from treeplexity.html
├── test/
│   ├── unit/                  # Pure function tests (no DOM)
│   ├── integration/           # DOM + localStorage tests
│   ├── e2e/                   # Playwright browser tests
│   ├── scenarios/             # AI persona scenario tests
│   ├── smoke/                 # MCP bridge smoke tests
│   ├── fixtures/              # Test data
│   └── treelisty-core.js      # Auto-generated testable module
├── vitest.config.js           # Unit/integration config
└── playwright.config.js       # E2E config
```

## Running Tests

```bash
# All tests (recommended before committing)
npm run test:all

# Individual suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # E2E against local server

# Live site tests (CI uses these)
npm run test:live:critical  # Critical path tests against treelisty.netlify.app

# Coverage report
npm run test:coverage
```

## Writing Unit Tests

Unit tests go in `test/unit/` and test pure functions extracted from treeplexity.html.

### Adding a New Test File

```javascript
// test/unit/my-feature.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from '../treelisty-core.js';

describe('My Feature', () => {
    describe('myFunction()', () => {
        it('should handle normal input', () => {
            const result = myFunction('input');
            expect(result).toBe('expected');
        });

        it('should handle edge case', () => {
            expect(myFunction(null)).toBeNull();
        });
    });
});
```

### Extracting Functions for Testing

If the function you need isn't in `treelisty-core.js`:

1. Edit `scripts/extract-testable.js`
2. Add function name to `FUNCTIONS_TO_EXTRACT` array
3. Run `npm run extract`
4. Import from `../treelisty-core.js`

```javascript
// In extract-testable.js
const FUNCTIONS_TO_EXTRACT = [
    'existingFunction',
    'myNewFunction',  // Add here
];
```

## Writing E2E Tests

E2E tests go in `test/e2e/` and use Playwright.

### Test Template

```javascript
// test/e2e/my-feature.spec.js
import { test, expect } from '@playwright/test';

const URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('My Feature', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(URL);
        await page.waitForSelector('#tree-container', { timeout: 15000 });
    });

    test('should do something', async ({ page }) => {
        // Interact with UI
        await page.click('#my-button');

        // Assert result
        await expect(page.locator('#result')).toBeVisible();
    });
});
```

### Running E2E Locally

```bash
# Start local server in one terminal
npm run serve

# Run tests in another terminal
npm run test:e2e
```

## Test Naming Conventions

- **Files**: `feature-name.test.js` (unit) or `feature-name.spec.js` (e2e)
- **Describe blocks**: Feature or function name
- **It blocks**: Start with "should" + expected behavior

```javascript
describe('Tree Operations', () => {
    describe('getNodeById()', () => {
        it('should find root node', () => {});
        it('should return null for non-existent id', () => {});
    });
});
```

## Test Fixtures

Use fixtures in `test/fixtures/` for reusable test data:

```javascript
import { minimalTree, complexTree, cloneTree } from '../fixtures/trees.js';

describe('My Tests', () => {
    let tree;

    beforeEach(() => {
        tree = cloneTree(complexTree); // Fresh copy each test
    });
});
```

## Coverage Thresholds

Configured in `vitest.config.js`:
- Statements: 70%
- Branches: 60%
- Functions: 70%
- Lines: 70%

Run `npm run test:coverage` to check coverage.

## CI/CD

Tests run automatically on:
- Push to `main`
- Pull requests to `main`

The CI workflow runs:
1. Unit tests
2. Integration tests
3. E2E tests against live site (https://treelisty.netlify.app)

## Common Patterns

### Testing Tree Mutations

```javascript
it('should add child node', () => {
    const tree = cloneTree(minimalTree);
    const parent = getNodeById(tree, 'phase-0');

    addChild(parent, { id: 'new-item', name: 'New Item' });

    expect(parent.items).toHaveLength(2);
    expect(parent.items[1].name).toBe('New Item');
});
```

### Testing Async Functions

```javascript
it('should load tree from API', async () => {
    const result = await loadTreeFromServer('tree-id');
    expect(result.name).toBeDefined();
});
```

### Testing DOM (Integration)

```javascript
// In test/integration/
import { describe, it, expect, beforeEach } from 'vitest';

describe('DOM Operations', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="tree-container"></div>';
    });

    it('should render tree', () => {
        renderTree(testTree);
        expect(document.querySelector('.node')).not.toBeNull();
    });
});
```

## Debugging Tests

```bash
# Run with debugger
npm run test:debug

# Run specific test file
npx vitest run test/unit/my-feature.test.js

# Run with verbose output
npx vitest run --reporter=verbose
```

## Questions?

- Check existing tests for patterns
- See `CLAUDE.md` in repo root for architecture overview
- Open an issue for test infrastructure questions
