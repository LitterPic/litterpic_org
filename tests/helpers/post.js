/**
 * Test Post Helper for E2E tests.
 *
 * Creates a throwaway post through the site's own /createpost UI so that
 * likes and comments during tests only notify the test account, never real users.
 *
 * The post is deleted at the end of each suite through the site's own
 * "Delete Post" meatball menu, testing that feature AND cleaning up.
 *
 * Usage (make this the FIRST test in your describe block):
 *
 *   test('setup: create test post via the site', async ({ page }) => {
 *     testPostId = await createTestPostViaUI(page);  // page already has auth injected
 *     expect(testPostId).toBeTruthy();
 *   });
 */

const path = require('path');
const fs   = require('fs');

// Use the real LitterPic logo so the post looks like a genuine submission
const LOGO_PATH = path.join(__dirname, '../../public/images/litter_pic_logo.png');

const TEST_DESCRIPTION = '[TEST] E2E test post - safe to delete';

/**
 * Creates a test post by navigating the browser through /createpost.
 * The page must already have Firebase auth injected before calling this.
 *
 * @param {import('@playwright/test').Page} page  Playwright page (auth already injected)
 * @returns {Promise<string>} Firestore document ID of the newly created post
 */
async function createTestPostViaUI(page) {
    await page.goto('/createpost');

    // Wait for Google Maps to load (renders location input as non-disabled)
    await page.waitForSelector('.location-input:not([disabled])', { timeout: 20_000 });

    // 1. Photo -- upload the real LitterPic logo from the project's public/images directory
    await page.locator('#file-input').setInputFiles({
        name: 'litter_pic_logo.png',
        mimeType: 'image/png',
        buffer: fs.readFileSync(LOGO_PATH),
    });

    // 2. Litter weight
    await page.locator('.no-increment-decrement').fill('1');

    // 3. Location -- type and select the first Places suggestion
    const locationInput = page.locator('.location-input');
    await locationInput.click();
    await locationInput.fill('Portsmouth, NH');
    await page.waitForSelector('.suggestion-item', { timeout: 10_000 });
    await page.locator('.suggestion-item').first().click();

    // 4. Description
    await page.locator('.description-container textarea').fill(TEST_DESCRIPTION);

    // 5. Submit
    await page.locator('button[type="submit"]').click();

    // 6. Wait for redirect to /stories
    await page.waitForURL(/\/stories/, { timeout: 60_000 });
    await page.waitForSelector('.post', { timeout: 30_000 });

    // 7. Find the new post by its unique description text
    const testPost = page.locator('.post').filter({ hasText: TEST_DESCRIPTION }).first();
    await testPost.waitFor({ state: 'visible', timeout: 15_000 });

    const postId = await testPost.getAttribute('id');
    if (!postId) {
        throw new Error('createTestPostViaUI: could not read post ID from DOM after creation');
    }

    console.log('Created test post via UI: ' + postId);
    return postId;
}

module.exports = { createTestPostViaUI, TEST_DESCRIPTION };
