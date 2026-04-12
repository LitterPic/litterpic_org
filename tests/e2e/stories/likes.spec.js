/**
 * Likes Tests
 *
 * A dedicated test post is created through the site's /createpost UI (first test)
 * so that like actions only notify the test account, never real users.
 *
 * Test order matters -- Playwright runs them sequentially with workers: 1:
 *   1. setup:   create test post via the site          <- creates testPostId
 *   2-4. feature tests
 *   5. cleanup: delete test post via the site (last)   <- meatball menu
 *   6. unauthenticated redirect check (separate describe, no post needed)
 */
const { test, expect } = require('@playwright/test');
const { injectFirebaseAuth } = require('../../helpers/auth');
const { createTestPostViaUI } = require('../../helpers/post');

// CSS attribute selector safe for ANY Firestore ID, including ones starting with a digit.
const pid = (id) => `[id="${id}"]`;

let testPostId = null;

test.describe('Stories page - Likes', () => {
    // Inject auth and (after setup) navigate straight to the test post
    test.beforeEach(async ({ page }) => {
        await injectFirebaseAuth(page);
        if (testPostId) {
            await page.goto('/stories?postId=' + testPostId);
            await page.waitForSelector('.post',          { timeout: 30_000 });
            await page.waitForSelector(pid(testPostId),  { timeout: 30_000 });
        }
        // If testPostId is null we are running the setup test; it navigates itself
    });

    // ── 1. Setup ─────────────────────────────────────────────────────────────
    test('setup: create test post via the site', async ({ page }) => {
        // beforeEach already injected auth; page is on '/'
        testPostId = await createTestPostViaUI(page);
        expect(testPostId).toBeTruthy();
        // Page is now on /stories with the test post visible
    });

    // ── 2-4. Feature tests ───────────────────────────────────────────────────
    test('stories page has title and at least one post', async ({ page }) => {
        await expect(page).toHaveTitle(/Stories|LitterPic/i);
        await expect(page.locator('.post').first()).toBeVisible();
    });

    test('like icon is visible on the test post', async ({ page }) => {
        const likeIcon = page.locator(pid(testPostId) + ' .likes-comments-likes-field .material-icons').first();
        await expect(likeIcon).toBeVisible();
    });

    test('clicking like toggles heart class and updates count', async ({ page }) => {
        const testPost  = page.locator(pid(testPostId));
        const heartIcon = testPost.locator('.likes-comments-likes-field .material-icons').first();
        const likeCount = testPost.locator('.likes-comments-likes-field .like-count').first();

        const initialClass = await heartIcon.getAttribute('class');
        const wasLiked     = initialClass && initialClass.includes('filled-heart');
        const initialCount = parseInt((await likeCount.textContent()) || '0', 10);

        await heartIcon.click();
        await page.waitForTimeout(1_000);

        const newClass = await heartIcon.getAttribute('class');
        const newCount = parseInt((await likeCount.textContent()) || '0', 10);

        if (wasLiked) {
            expect(newClass).toContain('empty-heart');
            expect(newCount).toBe(initialCount - 1);
        } else {
            expect(newClass).toContain('filled-heart');
            expect(newCount).toBe(initialCount + 1);
        }

        // Restore original state
        await heartIcon.click();
        await page.waitForTimeout(1_000);
        const restoredClass = await heartIcon.getAttribute('class');
        const restoredCount = parseInt((await likeCount.textContent()) || '0', 10);
        expect(restoredClass).toContain(wasLiked ? 'filled-heart' : 'empty-heart');
        expect(restoredCount).toBe(initialCount);
    });

    // ── 5. Cleanup (MUST be last) ─────────────────────────────────────────────
    test('cleanup: delete test post via the site', async ({ page }) => {
        await page.locator(pid(testPostId) + ' .meatball-menu').click();

        const deleteItem = page.locator(pid(testPostId) + ' .meatball-post-menu li').filter({ hasText: 'Delete Post' });
        await expect(deleteItem).toBeVisible({ timeout: 5_000 });
        await expect(deleteItem).not.toHaveClass(/grayed-out/);

        await deleteItem.click();

        await expect(page.locator(pid(testPostId))).not.toBeVisible({ timeout: 15_000 });
    });
});

// ── Unauthenticated tests (no test post needed) ───────────────────────────────
test.describe('Stories page - Likes (unauthenticated)', () => {
    test('unauthenticated user clicking like is redirected to /login', async ({ browser }) => {
        const ctx  = await browser.newContext();
        const page = await ctx.newPage();

        await page.goto('/stories');
        await page.waitForSelector('.post', { timeout: 30_000 });

        const heartIcon = page.locator('.likes-comments-likes-field .material-icons').first();
        await heartIcon.click();

        await page.waitForURL(/\/login/, { timeout: 10_000 });
        expect(page.url()).toContain('/login');

        await ctx.close();
    });
});
