# Treelisty Test Suite

Automated testing infrastructure for Treelisty - Universal Project Decomposition Tool.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers (for E2E tests)
npx playwright install chromium

# 3. Run setup (extracts testable modules)
npm run setup

# 4. Run all tests
npm test
```

## Test Commands

| Command | Description | Duration |
|---------|-------------|----------|
| `npm run test:unit` | Unit tests only | ~10 sec |
| `npm run test:integration` | Integration tests | ~30 sec |
| `npm run test:e2e` | E2E browser tests | ~2 min |
| `npm run test:watch` | Watch mode | Continuous |
| `npm run test:coverage` | With coverage report | ~15 sec |
| `npm test` | Full test suite | ~3 min |

## Directory Structure

```
test/
├── AI-CONTEXT.md          # 📖 Context for AI assistants
├── README.md              # This file
├── package.json           # Dependencies and scripts
├── vitest.config.js       # Vitest configuration
├── playwright.config.js   # Playwright configuration
├── scripts/
│   ├── extract-testable.js  # Generates testable module
│   └── setup-testing.js     # One-time setup
├── test/
│   ├── setup.js           # Global test setup
│   ├── treelisty-core.js  # AUTO-GENERATED (don't edit)
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/               # Playwright E2E tests
│   └── fixtures/          # Test data
└── .github/
    └── workflows/
        └── test.yml       # CI/CD pipeline
```

## Writing Tests

### Unit Tests

```javascript
// test/unit/my-feature.test.js
import { describe, it, expect } from 'vitest';
import { myFunction } from '../treelisty-core.js';

describe('My Feature', () => {
    it('should do something', () => {
        expect(myFunction()).toBe(expected);
    });
});
```

### E2E Tests

```javascript
// test/e2e/my-flow.spec.js
import { test, expect } from '@playwright/test';

test('should complete user flow', async ({ page }) => {
    await page.goto('/treeplexity.html');
    await page.click('#my-button');
    await expect(page.locator('#result')).toBeVisible();
});
```

## Adding New Extractable Functions

1. Add function name to `FUNCTIONS_TO_EXTRACT` in `scripts/extract-testable.js`
2. Run `npm run extract`
3. Import in tests: `import { myFunc } from '../treelisty-core.js'`

## Fixtures

Sample tree data is in `test/fixtures/trees.js`:

- `emptyTree` - Minimal valid tree
- `legacyTree` - Pre-v1 schema (for migration tests)
- `minimalTree` - One phase, one item
- `complexTree` - Full featured tree
- `aiGeneratedTree` - All AI provenance
- `deepTree` - Deeply nested structure

## CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main`

See `.github/workflows/test.yml` for configuration.

## Troubleshooting

### "treelisty-core.js not found"

Run: `npm run extract`

### E2E tests fail to start

Ensure Playwright browsers are installed:
```bash
npx playwright install chromium
```

### Tests fail after source changes

Always run extraction after modifying `treeplexity.html`:
```bash
npm run extract
npm test
```

## Documentation

For full context on the testing strategy, architecture decisions, and continuation points, see **AI-CONTEXT.md**.
