/**
 * Auth Setup – runs once before authenticated test suites.
 *
 * Logs in via the LitterPic login UI and saves the browser storage state
 * (cookies + localStorage + IndexedDB including Firebase auth tokens) to
 * playwright/.auth/user.json so authenticated tests can reuse the session
 * without logging in each time.
 *
 * Required env vars:
 *   TEST_USER_EMAIL    – email of a verified Firebase account
 *   TEST_USER_PASSWORD – its password
 */
const { test: setup, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const AUTH_FILE = 'playwright/.auth/user.json';

setup('authenticate as test user', async ({ page }) => {
    // Ensure the .auth directory exists
    const authDir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
        throw new Error(
            'TEST_USER_EMAIL and TEST_USER_PASSWORD must be set. ' +
            'Add them to .env.local (local) or GitHub Secrets (CI).'
        );
    }

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill credentials
    await page.fill('input.sign-in-email', email);
    await page.fill('input.sign-in-password', password);
    await page.click('button.sign-in-button');

    // Wait for redirect to home page — confirms successful login
    await page.waitForURL('/', { timeout: 30_000 });

    // Double-check we're not on the verify-email page
    expect(page.url()).not.toContain('/verify_email');

    // Save the authenticated storage state (IndexedDB Firebase tokens included)
    await page.context().storageState({ path: AUTH_FILE });
    console.log('✅ Auth state saved to', AUTH_FILE);
});

