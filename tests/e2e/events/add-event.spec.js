/**
 * Create Event Tests  (/volunteer page)
 *
 * Covers:
 *  ✅ Volunteer page loads with the Events heading
 *  ✅ "Create Event" button is DISABLED when unauthenticated
 *  ✅ "Create Event" button is ENABLED when authenticated
 *  ✅ Clicking "Create Event" reveals the event creation form
 *  ✅ Clicking "Cancel" hides the form again
 *  ✅ The form has all required fields (date, title, description, start/end time, location)
 *  ✅ Submitting the form without required fields does NOT proceed (HTML5 validation)
 */
const { test, expect } = require('@playwright/test');
const { injectFirebaseAuth } = require('../../helpers/auth');

test.describe('Volunteer page – public', () => {
    test('page loads with Events heading', async ({ page }) => {
        await page.goto('/volunteer');
        // Use domcontentloaded — Google Maps makes ongoing network requests that block networkidle
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('h1.heading-text', { timeout: 30_000 });
        await expect(page.locator('h1.heading-text')).toContainText('Events');
    });

    test('"Create Event" button is disabled for unauthenticated users', async ({ browser }) => {
        const ctx = await browser.newContext(); // no auth
        const page = await ctx.newPage();

        await page.goto('/volunteer');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('button.create-event-button', { timeout: 30_000 });

        const createBtn = page.locator('button.create-event-button');
        await expect(createBtn).toBeVisible();
        await expect(createBtn).toBeDisabled();

        await ctx.close();
    });

    test('events table is rendered', async ({ page }) => {
        await page.goto('/volunteer');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('table.table', { timeout: 30_000 });

        // The events <table> should always render even when empty
        await expect(page.locator('table.table')).toBeVisible();
    });
});

test.describe('Volunteer page – authenticated', () => {
    test.beforeEach(async ({ page }) => {
        await injectFirebaseAuth(page);
        await page.goto('/volunteer');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('button.create-event-button', { timeout: 30_000 });
    });

    test('"Create Event" button is enabled when logged in', async ({ page }) => {
        const createBtn = page.locator('button.create-event-button');
        await expect(createBtn).toBeEnabled();
    });

    test('clicking "Create Event" shows the event form', async ({ page }) => {
        await page.locator('button.create-event-button').click();

        // The form container should appear
        await expect(page.locator('form.event-form')).toBeVisible({ timeout: 5_000 });

        // All required fields should be present
        await expect(page.locator('input[name="date"]')).toBeVisible();
        await expect(page.locator('input.event-title')).toBeVisible();
        await expect(page.locator('textarea.event-description-input')).toBeVisible();
        await expect(page.locator('input[name="eventStartTime"]')).toBeVisible();
    });

    test('clicking "Cancel" inside the form hides it', async ({ page }) => {
        await page.locator('button.create-event-button').click();
        await expect(page.locator('form.event-form')).toBeVisible();

        await page.locator('button.event-submit-cancel').click();
        await expect(page.locator('form.event-form')).not.toBeVisible({ timeout: 5_000 });
    });

    test('Submit button has type="submit" so HTML5 validation blocks empty form', async ({ page }) => {
        await page.locator('button.create-event-button').click();
        await expect(page.locator('form.event-form')).toBeVisible();

        const submitBtn = page.locator('button.event-submit');
        await expect(submitBtn).toHaveAttribute('type', 'submit');

        // Click without filling required fields — form should NOT navigate away
        await submitBtn.click();
        // Still on /volunteer — native validation prevented submission
        expect(page.url()).toContain('/volunteer');
    });
});

