/**
 * Login & Auth Flow Tests
 *
 * Covers:
 *  ✅ Login page renders correctly
 *  ✅ Invalid credentials shows an error toast
 *  ✅ Valid credentials redirect to home
 *  ✅ Unauthenticated access to /notifications redirects to /login
 *  ✅ Unauthenticated access to /createpost redirects to /login
 */
const { test, expect } = require('@playwright/test');

test.describe('Login page', () => {
    test('renders the login form', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveTitle(/Login/i);
        await expect(page.locator('input.sign-in-email')).toBeVisible();
        await expect(page.locator('input.sign-in-password')).toBeVisible();
        await expect(page.locator('button.sign-in-button')).toBeVisible();
        await expect(page.locator('a.sign-in-sign-up-link')).toContainText('Sign Up');
    });

    test('shows error toast for invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        await page.fill('input.sign-in-email', 'notareal@example.com');
        await page.fill('input.sign-in-password', 'wrongpassword123');
        await page.click('button.sign-in-button');

        // React-Toastify renders an error toast — Firebase auth takes up to 5s
        const toast = page.locator('.Toastify__toast--error');
        await expect(toast).toBeVisible({ timeout: 15_000 });
        await expect(toast).toContainText(/invalid|password|username|error/i);
    });

    test('valid credentials redirect to home page', async ({ page }) => {
        const email = process.env.TEST_USER_EMAIL;
        const password = process.env.TEST_USER_PASSWORD;

        if (!email || !password) {
            test.skip(true, 'TEST_USER_EMAIL/PASSWORD not set');
        }

        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        await page.fill('input.sign-in-email', email);
        await page.fill('input.sign-in-password', password);
        await page.click('button.sign-in-button');

        await page.waitForURL('/', { timeout: 30_000 });
        expect(page.url()).toMatch(/localhost:3000\/$/);
    });
});

test.describe('Unauthenticated redirects', () => {
    test('/notifications redirects unauthenticated users to /login', async ({ page }) => {
        await page.goto('/notifications');
        // withAuth HOC should redirect to /login
        await page.waitForURL(/\/login/, { timeout: 15_000 });
        expect(page.url()).toContain('/login');
    });

    test('/createpost redirects unauthenticated users to /login', async ({ page }) => {
        await page.goto('/createpost');
        await page.waitForURL(/\/login/, { timeout: 15_000 });
        expect(page.url()).toContain('/login');
    });
});

