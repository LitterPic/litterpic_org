// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Load .env.local for local development
require('dotenv').config({ path: '.env.local' });

/**
 * LitterPic E2E Test Configuration
 *
 * Required environment variables (set in .env.local locally,
 * or as GitHub Actions secrets in CI):
 *   TEST_USER_EMAIL     - email of a verified Firebase test account
 *   TEST_USER_PASSWORD  - password for the test account
 */
module.exports = defineConfig({
    testDir: './tests/e2e',

    /* Run tests sequentially - Firebase real-time listeners can collide when parallel */
    fullyParallel: false,
    workers: 1,

    /* Fail fast in CI on unexpected failures */
    forbidOnly: !!process.env.CI,

    /* Retry once in CI to survive flaky network/Firebase timeouts */
    retries: process.env.CI ? 1 : 0,

    /* CI gets list + HTML report; local gets the readable list reporter */
    reporter: process.env.CI
        ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
        : [['list']],

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        ignoreHTTPSErrors: true,
        /* Give pages plenty of time for Firebase reads */
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
    },

    projects: [
        /* ── 1. Auth setup ── runs once, saves browser storage to playwright/.auth/user.json */
        {
            name: 'setup',
            testMatch: '**/auth.setup.js',
            use: { ...devices['Desktop Chrome'] },
        },

        /* ── 2. Authenticated tests ── inject Firebase auth via REST API (storageState
         *      doesn't capture Firebase IndexedDB tokens, so we inject them directly) */
        {
            name: 'chromium-auth',
            testMatch: '**/stories/**/*.spec.js',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
        },
        {
            name: 'chromium-notifications',
            testMatch: '**/notifications/**/*.spec.js',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
        },
        {
            name: 'chromium-events',
            testMatch: '**/events/**/*.spec.js',
            use: {
                ...devices['Desktop Chrome'],
                /* Volunteer page loads Google Maps — give it extra time */
                navigationTimeout: 60_000,
                actionTimeout: 20_000,
            },
            dependencies: ['setup'],
        },

        /* ── 3. Public (unauthenticated) tests ── no storageState needed */
        {
            name: 'chromium-public',
            testMatch: '**/auth/**/*.spec.js',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Start Next.js dev server locally; in CI the build+start is done before pw runs */
    webServer: {
        command: process.env.CI ? 'npm start' : 'npx next dev -p 3000',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
