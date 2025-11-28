import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Test environment
        environment: 'jsdom',
        
        // Global test setup
        globals: true,
        
        // Test file patterns
        include: [
            'test/unit/**/*.test.js',
            'test/integration/**/*.test.js',
            'test/scenarios/**/*.scenario.js'
        ],
        
        // Exclude patterns
        exclude: [
            'node_modules',
            'test/e2e/**'  // E2E tests use Playwright
        ],
        
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['test/treelisty-core.js'],
            exclude: [
                'node_modules',
                'test/fixtures',
                'scripts'
            ],
            thresholds: {
                statements: 70,
                branches: 60,
                functions: 70,
                lines: 70
            }
        },
        
        // Reporter configuration
        reporters: ['default'],
        
        // Timeout settings
        testTimeout: 10000,
        hookTimeout: 10000,
        
        // Setup files
        setupFiles: ['./test/setup.js'],
        
        // Retry failed tests
        retry: process.env.CI ? 2 : 0,
        
        // Pool options
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false
            }
        }
    }
});
