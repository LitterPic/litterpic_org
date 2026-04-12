/**
 * RSVP Tests  (/volunteer page)
 *
 * There are TWO types of RSVP links in the events table:
 *
 *  1. "RSVP" (regular events)
 *     → Clicking reveals the inline RSVP form on the same page.
 *     → The form requires name, email, and attendee count.
 *
 *  2. "RSVP with Blue Ocean Society" (events owned by programs@blueoceansociety.org)
 *     → Clicking calls the createBlueOceanRsvp cloud function and opens
 *       https://www.blueoceansociety.org/cleanup in a NEW TAB.
 *     → No inline RSVP form appears on the volunteer page.
 *
 * Covers:
 *  ✅ At least one regular "RSVP" link is visible (if regular events exist)
 *  ✅ Clicking regular RSVP scrolls to and renders the inline RSVP form
 *  ✅ RSVP form has all required fields (attendees, email, name)
 *  ✅ Clicking "Cancel" in the RSVP form hides the form
 *  ✅ Filling and submitting the RSVP form shows the "Thank You" message
 *  ✅ Clicking "RSVP with Blue Ocean Society" opens the Blue Ocean page in a new tab (no form)
 *
 * Cleanup:
 *   The RSVP submit test creates a real record in Firestore. An afterAll hook deletes
 *   all RSVPs created by the test user (excluding "Auto Owner RSVP" organiser records).
 *   Firestore rules allow the RSVP creator to delete their own records — run
 *   `firebase deploy --only firestore:rules` to apply the updated rules.
 */
const { test, expect } = require('@playwright/test');
const { injectFirebaseAuth, getFirebaseTokens } = require('../../helpers/auth');
const { deleteTestRsvps } = require('../../helpers/firestore');

// Locator helpers — kept as constants for clarity
// Matches ONLY the plain "RSVP" link, NOT "RSVP with Blue Ocean Society"
const REGULAR_RSVP = 'table.table a';
const REGULAR_RSVP_TEXT = /^RSVP$/i;
const BLUE_OCEAN_RSVP_TEXT = /RSVP with Blue Ocean Society/i;

test.describe('RSVP flow — regular events', () => {
    test.afterAll(async () => {
        // Clean up any RSVPs submitted by the test user during this suite
        const email = process.env.TEST_USER_EMAIL;
        const password = process.env.TEST_USER_PASSWORD;
        if (!email || !password) return;

        try {
            const tokens = await getFirebaseTokens(email, password);
            const count = await deleteTestRsvps(tokens.idToken, tokens.uid);
            if (count > 0) {
                console.log(`🧹 Cleaned up ${count} test RSVP(s)`);
            }
        } catch (e) {
            console.warn('⚠️  afterAll RSVP cleanup failed:', e.message);
        }
    });

    test.beforeEach(async ({ page }) => {
        await injectFirebaseAuth(page);
        await page.goto('/volunteer');
        await page.waitForLoadState('domcontentloaded');
        // Wait for the events table to be populated
        await page.waitForSelector('table.table', { timeout: 30_000 });
        // Allow Firestore onSnapshot to deliver owner emails (needed to distinguish link text)
        await page.waitForTimeout(2_000);
    });

    test('at least one regular RSVP link is visible (if regular events exist)', async ({ page }) => {
        const rsvpLinks = page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT });
        const count = await rsvpLinks.count();

        if (count === 0) {
            console.log('ℹ️  No regular RSVP events found; skipping assertion.');
            return;
        }

        await expect(rsvpLinks.first()).toBeVisible();
    });

    test('clicking regular RSVP reveals the inline RSVP form', async ({ page }) => {
        const count = await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).count();
        if (count === 0) test.skip(true, 'No regular RSVP events to test');

        await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).first().click();

        // RSVP form should appear on the same page — no navigation
        await expect(page.locator('#rsvpFormContainer').first()).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('h1.heading-text', { hasText: 'RSVP' })).toBeVisible();
        await expect(page).toHaveURL(/\/volunteer/); // still on the volunteer page
    });

    test('RSVP form has required fields', async ({ page }) => {
        const count = await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).count();
        if (count === 0) test.skip(true, 'No regular RSVP events');

        await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).first().click();
        await expect(page.locator('#rsvpFormContainer').first()).toBeVisible({ timeout: 10_000 });

        await expect(page.locator('input[name="numberAttending"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('button.rsvp-button.submit')).toBeVisible();
        await expect(page.locator('button.rsvp-button.cancel')).toBeVisible();
    });

    test('clicking Cancel hides the RSVP form', async ({ page }) => {
        const count = await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).count();
        if (count === 0) test.skip(true, 'No regular RSVP events');

        await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).first().click();
        const rsvpForm = page.locator('#rsvpFormContainer').first();
        await expect(rsvpForm).toBeVisible({ timeout: 10_000 });

        await page.locator('button.rsvp-button.cancel').click();

        // Form should disappear — rsvpFormData.eventId resets to null
        await expect(rsvpForm).not.toBeVisible({ timeout: 5_000 });
    });

    test('filling and submitting the RSVP form shows the Thank You message', async ({ page }) => {
        const count = await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).count();
        if (count === 0) test.skip(true, 'No regular RSVP events');

        const testEmail = process.env.TEST_USER_EMAIL;
        if (!testEmail) test.skip(true, 'TEST_USER_EMAIL not set');

        await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).first().click();
        await expect(page.locator('#rsvpFormContainer').first()).toBeVisible({ timeout: 10_000 });

        await page.fill('input[name="numberAttending"]', '1');
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="name"]', 'E2E Test Runner');

        await page.locator('button.rsvp-button.submit').click();

        await expect(page.locator('.rsvp-thankyou')).toBeVisible({ timeout: 20_000 });
        await expect(page.locator('.rsvp-thankyou')).toContainText(/Thank You/i);
        // afterAll will clean up the RSVP record created by this submission
    });
});

test.describe('RSVP flow — Blue Ocean Society events', () => {
    test.beforeEach(async ({ page }) => {
        await injectFirebaseAuth(page);
        await page.goto('/volunteer');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('table.table', { timeout: 30_000 });
        // Allow Firestore onSnapshot to deliver owner emails so link text is resolved
        await page.waitForTimeout(2_000);
    });

    test('clicking "RSVP with Blue Ocean Society" opens blueoceansociety.org in a new tab — no inline form', async ({ page }) => {
        const blueOceanLinks = page.locator(REGULAR_RSVP, { hasText: BLUE_OCEAN_RSVP_TEXT });
        const count = await blueOceanLinks.count();

        if (count === 0) {
            console.log('ℹ️  No Blue Ocean Society events found; skipping Blue Ocean RSVP test.');
            test.skip(true, 'No Blue Ocean Society events in the table');
        }

        // Listen for the new tab opened by window.open(...)
        const newTabPromise = page.context().waitForEvent('page', { timeout: 15_000 });

        await blueOceanLinks.first().click();

        const newTab = await newTabPromise;
        await newTab.waitForLoadState('domcontentloaded');

        // The new tab should be the Blue Ocean Society cleanup page
        expect(newTab.url()).toContain('blueoceansociety.org');

        // The inline RSVP form must NOT appear on the volunteer page
        await expect(page.locator('#rsvpFormContainer').first()).not.toBeVisible({ timeout: 3_000 });
        // Still on the volunteer page
        await expect(page).toHaveURL(/\/volunteer/);
    });
});
 *
 *  1. "RSVP" (regular events)
 *     → Clicking reveals the inline RSVP form on the same page.
 *     → The form requires name, email, and attendee count.
 *
 *  2. "RSVP with Blue Ocean Society" (events owned by programs@blueoceansociety.org)
 *     → Clicking calls the createBlueOceanRsvp cloud function and opens
 *       https://www.blueoceansociety.org/cleanup in a NEW TAB.
 *     → No inline RSVP form appears on the volunteer page.
 *
 * Covers:
 *  ✅ At least one regular "RSVP" link is visible (if regular events exist)
 *  ✅ Clicking regular RSVP scrolls to and renders the inline RSVP form
 *  ✅ RSVP form has all required fields (attendees, email, name)
 *  ✅ Clicking "Cancel" in the RSVP form hides the form
 *  ✅ Filling and submitting the RSVP form shows the "Thank You" message
 *  ✅ Clicking "RSVP with Blue Ocean Society" opens the Blue Ocean page in a new tab (no form)
 *
 * Note on the "Thank You" test: it submits real data to Firebase.
 * The test user's email is used as the RSVP email.  This creates a real RSVP
 * record; you can clean it up from the Firebase console or run a cleanup script.
 */
const { test, expect } = require('@playwright/test');
const { injectFirebaseAuth } = require('../../helpers/auth');

// Locator helpers — kept as constants for clarity
// Matches ONLY the plain "RSVP" link, NOT "RSVP with Blue Ocean Society"
const REGULAR_RSVP = 'table.table a';
const REGULAR_RSVP_TEXT = /^RSVP$/i;
const BLUE_OCEAN_RSVP_TEXT = /RSVP with Blue Ocean Society/i;

test.describe('RSVP flow — regular events', () => {
    test.beforeEach(async ({ page }) => {
        await injectFirebaseAuth(page);
        await page.goto('/volunteer');
        await page.waitForLoadState('domcontentloaded');
        // Wait for the events table to be populated
        await page.waitForSelector('table.table', { timeout: 30_000 });
        // Allow Firestore onSnapshot to deliver owner emails (needed to distinguish link text)
        await page.waitForTimeout(2_000);
    });

    test('at least one regular RSVP link is visible (if regular events exist)', async ({ page }) => {
        const rsvpLinks = page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT });
        const count = await rsvpLinks.count();

        if (count === 0) {
            console.log('ℹ️  No regular RSVP events found; skipping assertion.');
            return;
        }

        await expect(rsvpLinks.first()).toBeVisible();
    });

    test('clicking regular RSVP reveals the inline RSVP form', async ({ page }) => {
        const count = await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).count();
        if (count === 0) test.skip(true, 'No regular RSVP events to test');

        await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).first().click();

        // RSVP form should appear on the same page — no navigation
        await expect(page.locator('#rsvpFormContainer').first()).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('h1.heading-text', { hasText: 'RSVP' })).toBeVisible();
        await expect(page).toHaveURL(/\/volunteer/); // still on the volunteer page
    });

    test('RSVP form has required fields', async ({ page }) => {
        const count = await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).count();
        if (count === 0) test.skip(true, 'No regular RSVP events');

        await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).first().click();
        await expect(page.locator('#rsvpFormContainer').first()).toBeVisible({ timeout: 10_000 });

        await expect(page.locator('input[name="numberAttending"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('button.rsvp-button.submit')).toBeVisible();
        await expect(page.locator('button.rsvp-button.cancel')).toBeVisible();
    });

    test('clicking Cancel hides the RSVP form', async ({ page }) => {
        const count = await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).count();
        if (count === 0) test.skip(true, 'No regular RSVP events');

        await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).first().click();
        const rsvpForm = page.locator('#rsvpFormContainer').first();
        await expect(rsvpForm).toBeVisible({ timeout: 10_000 });

        await page.locator('button.rsvp-button.cancel').click();

        // Form should disappear — rsvpFormData.eventId resets to null
        await expect(rsvpForm).not.toBeVisible({ timeout: 5_000 });
    });

    test('filling and submitting the RSVP form shows the Thank You message', async ({ page }) => {
        const count = await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).count();
        if (count === 0) test.skip(true, 'No regular RSVP events');

        const testEmail = process.env.TEST_USER_EMAIL;
        if (!testEmail) test.skip(true, 'TEST_USER_EMAIL not set');

        await page.locator(REGULAR_RSVP, { hasText: REGULAR_RSVP_TEXT }).first().click();
        await expect(page.locator('#rsvpFormContainer').first()).toBeVisible({ timeout: 10_000 });

        await page.fill('input[name="numberAttending"]', '1');
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="name"]', 'E2E Test Runner');

        await page.locator('button.rsvp-button.submit').click();

        await expect(page.locator('.rsvp-thankyou')).toBeVisible({ timeout: 20_000 });
        await expect(page.locator('.rsvp-thankyou')).toContainText(/Thank You/i);
    });
});

test.describe('RSVP flow — Blue Ocean Society events', () => {
    test.beforeEach(async ({ page }) => {
        await injectFirebaseAuth(page);
        await page.goto('/volunteer');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('table.table', { timeout: 30_000 });
        // Allow Firestore onSnapshot to deliver owner emails so link text is resolved
        await page.waitForTimeout(2_000);
    });

    test('clicking "RSVP with Blue Ocean Society" opens blueoceansociety.org in a new tab — no inline form', async ({ page }) => {
        const blueOceanLinks = page.locator(REGULAR_RSVP, { hasText: BLUE_OCEAN_RSVP_TEXT });
        const count = await blueOceanLinks.count();

        if (count === 0) {
            console.log('ℹ️  No Blue Ocean Society events found; skipping Blue Ocean RSVP test.');
            test.skip(true, 'No Blue Ocean Society events in the table');
        }

        // Listen for the new tab opened by window.open(...)
        const newTabPromise = page.context().waitForEvent('page', { timeout: 15_000 });

        await blueOceanLinks.first().click();

        const newTab = await newTabPromise;
        await newTab.waitForLoadState('domcontentloaded');

        // The new tab should be the Blue Ocean Society cleanup page
        expect(newTab.url()).toContain('blueoceansociety.org');

        // The inline RSVP form must NOT appear on the volunteer page
        await expect(page.locator('#rsvpFormContainer').first()).not.toBeVisible({ timeout: 3_000 });
        // Still on the volunteer page
        await expect(page).toHaveURL(/\/volunteer/);
    });
});

