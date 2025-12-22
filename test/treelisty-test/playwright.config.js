import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Treelisty E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
const webServerCommand = process.env.WEB_SERVER_CMD || 'npx serve -p 3000 ../..';
const webServerUrl = process.env.WEB_SERVER_URL || 'http://localhost:3000';

export default defineConfig({
    // Test directory
    testDir: './test/e2e',
    
    // Test file pattern
    testMatch: '**/*.{spec,test}.js',
    
    // Timeout for each test
    timeout: 30000,
    
    // Timeout for expect() assertions
    expect: {
        timeout: 5000,
        toHaveScreenshot: {
            maxDiffPixels: 100,
            threshold: 0.2
        }
    },
    
    // Run tests in parallel
    fullyParallel: true,
    
    // Fail the build on CI if you accidentally left test.only in the source
    forbidOnly: !!process.env.CI,
    
    // Retry failed tests
    retries: process.env.CI ? 2 : 0,
    
    // Number of parallel workers
    workers: process.env.CI ? 1 : undefined,
    
    // Reporter configuration
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report' }],
        ['json', { outputFile: 'test-results/results.json' }]
    ],
    
    // Shared settings for all projects
    use: {
        // Base URL for navigation
        baseURL: webServerUrl,
        
        // Capture screenshot on failure
        screenshot: 'only-on-failure',
        
        // Record video on failure
        video: 'retain-on-failure',
        
        // Capture trace on failure
        trace: 'retain-on-failure',
        
        // Viewport size
        viewport: { width: 1280, height: 720 },
        
        // Ignore HTTPS errors
        ignoreHTTPSErrors: true,
        
        // Action timeout
        actionTimeout: 10000
    },
    
    // Browser projects - Desktop + Mobile
    // Run `npx playwright install webkit` to enable Safari/iOS
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    args: ['--disable-web-security']
                }
            }
        },
        // Mobile devices for responsive testing
        {
            name: 'mobile-chrome',
            use: {
                ...devices['Pixel 5'],
                launchOptions: {
                    args: ['--disable-web-security']
                }
            }
        },
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 12'] }
        },
        {
            name: 'tablet',
            use: { ...devices['iPad Pro 11'] }
        }
        // Desktop Firefox/Safari - uncomment after: npx playwright install firefox webkit
        // {
        //     name: 'firefox',
        //     use: { ...devices['Desktop Firefox'] }
        // },
        // {
        //     name: 'webkit',
        //     use: { ...devices['Desktop Safari'] }
        // }
    ],
    
    // Local dev server configuration
    // Serves from repo root (two levels up from test/treelisty-test)
    webServer: {
        command: webServerCommand,
        url: webServerUrl,
        timeout: 120000,
        reuseExistingServer: !process.env.CI
    },
    
    // Output directory for test artifacts
    outputDir: 'test-results'
});
