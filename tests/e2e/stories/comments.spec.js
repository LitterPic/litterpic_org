/**
 * Comments Tests
 *
 * A dedicated test post is created through the site's /createpost UI (first test)
 * so that comment actions only notify the test account, never real users.
 *
 * Test order:
 *   1.  setup:   create test post via the site
 *   2-6. feature tests
 *   7.  cleanup: delete [TEST] comments + verify count via Firestore REST API
 *   8.  cleanup: delete test post via the site's meatball menu (MUST be last)
 *   9.  unauthenticated redirect check
 *
 * Key quirks handled:
 *   - stories.js opens the comment textarea automatically when navigating with
 *     ?postId=X (line 779: setOpenCommentInput). beforeEach closes it so every
 *     test starts from a consistent "textarea closed" state.
 *   - Firestore's IndexedDB persistence cache can serve stale numComments to
 *     the browser after a REST API patch. The count cleanup test therefore
 *     verifies the decremented value via REST API, not via the browser UI.
 *   - testPostId is written to a temp file after creation so it survives a
 *     Playwright worker restart (which resets module-level state).
 */
const { test, expect } = require('@playwright/test');
const { injectFirebaseAuth, getFirebaseTokens } = require('../../helpers/auth');
const { deleteTestComments, fetchDocument }     = require('../../helpers/firestore');
const { createTestPostViaUI }                   = require('../../helpers/post');
const fs   = require('fs');
const path = require('path');

// CSS attribute selector safe for ANY Firestore ID, including ones starting with a digit.
const pid = (id) => `[id="${id}"]`;

const TEST_COMMENT = '[TEST] Automated e2e test comment - safe to delete';

// Temp file keeps testPostId alive across Playwright worker restarts
const STATE_FILE = path.join(require('os').tmpdir(), 'pw_comments_post_id.txt');

let testPostId = (() => {
    try { return fs.existsSync(STATE_FILE) ? fs.readFileSync(STATE_FILE, 'utf8').trim() : null; }
    catch { return null; }
})();

test.describe('Stories page - Comments', () => {
    test.beforeEach(async ({ page }) => {
        // Re-hydrate testPostId from file if a worker restart wiped module state
        if (!testPostId) {
            try {
                if (fs.existsSync(STATE_FILE)) {
                    testPostId = fs.readFileSync(STATE_FILE, 'utf8').trim() || null;
                }
            } catch { /* ignore */ }
        }

        await injectFirebaseAuth(page);

        if (testPostId) {
            await page.goto('/stories?postId=' + testPostId);
            await page.waitForSelector('.post',         { timeout: 30_000 });
            await page.waitForSelector(pid(testPostId), { timeout: 30_000 });

            // stories.js opens the comment textarea automatically when navigating with
            // ?postId=X (setOpenCommentInput, 300 ms after post loads -- line 779).
            // Wait past that delay then close it so every test starts with textarea CLOSED.
            await page.waitForTimeout(600);
            const textarea = page.locator(pid(testPostId) + ' textarea.comment-text-input').first();
            const isAutoOpen = await textarea.isVisible().catch(() => false);
            if (isAutoOpen) {
                await page.locator(pid(testPostId) + ' .likes-comments-comment-field i.material-icons').first().click();
                await textarea.waitFor({ state: 'hidden', timeout: 5_000 });
            }
        }
        // If testPostId is null we are running the setup test; it navigates itself
    });

    // ── 1. Setup ─────────────────────────────────────────────────────────────
    test('setup: create test post via the site', async ({ page }) => {
        testPostId = await createTestPostViaUI(page);
        expect(testPostId).toBeTruthy();
        // Persist so a worker restart cannot lose the ID
        fs.writeFileSync(STATE_FILE, testPostId);
    });

    // ── 2-6. Feature tests ───────────────────────────────────────────────────
    test('comment bubble icon is visible on the test post', async ({ page }) => {
        const commentBubble = page.locator(pid(testPostId) + ' .likes-comments-comment-field .material-icons').first();
        await expect(commentBubble).toBeVisible();
        await expect(commentBubble).toContainText('chat_bubble_outline');
    });

    test('clicking comment icon reveals the comment textarea', async ({ page }) => {
        // beforeEach closed the auto-opened textarea; click to re-open
        const commentBubble = page.locator(pid(testPostId) + ' .likes-comments-comment-field i.material-icons').first();
        await commentBubble.click();

        const textarea = page.locator(pid(testPostId) + ' textarea.comment-text-input').first();
        await expect(textarea).toBeVisible({ timeout: 5_000 });
    });

    test('Submit button is disabled when textarea is empty', async ({ page }) => {
        const commentBubble = page.locator(pid(testPostId) + ' .likes-comments-comment-field i.material-icons').first();
        await commentBubble.click();

        const submitBtn = page.locator(pid(testPostId) + ' button.comment-submit-button').first();
        await expect(submitBtn).toBeVisible({ timeout: 5_000 });
        await expect(submitBtn).toBeDisabled();
    });

    test('typing in the textarea enables the Submit button', async ({ page }) => {
        const commentBubble = page.locator(pid(testPostId) + ' .likes-comments-comment-field i.material-icons').first();
        await commentBubble.click();

        const textarea = page.locator(pid(testPostId) + ' textarea.comment-text-input').first();
        await expect(textarea).toBeVisible({ timeout: 5_000 });
        await textarea.fill('Hello world');

        const submitBtn = page.locator(pid(testPostId) + ' button.comment-submit-button').first();
        await expect(submitBtn).toBeEnabled();
    });

    test('submitting a comment increments the comment count', async ({ page }) => {
        const testPost       = page.locator(pid(testPostId));
        const commentCountEl = testPost.locator('.likes-comments-comment-field .comment-count').first();
        const initialCount   = parseInt((await commentCountEl.textContent()) || '0', 10);

        const commentBubble = testPost.locator('.likes-comments-comment-field i.material-icons').first();
        await commentBubble.click();

        const textarea  = testPost.locator('textarea.comment-text-input').first();
        await expect(textarea).toBeVisible({ timeout: 5_000 });
        await textarea.fill(TEST_COMMENT);

        const submitBtn = testPost.locator('button.comment-submit-button').first();
        await submitBtn.click();

        await page.waitForTimeout(2_000);
        const newCount = parseInt((await commentCountEl.textContent()) || '0', 10);
        expect(newCount).toBe(initialCount + 1);
    });

    // ── 7. Comment cleanup ───────────────────────────────────────────────────
    test('cleanup: test comment is deleted and the count decrements back', async () => {
        // No { page } needed -- we verify via Firestore REST API, not the browser UI,
        // to avoid Firestore's IndexedDB persistence cache serving stale numComments.
        const tokens = await getFirebaseTokens(
            process.env.TEST_USER_EMAIL,
            process.env.TEST_USER_PASSWORD
        );

        // Read numComments BEFORE deletion directly from Firestore
        const docBefore = await fetchDocument(tokens.idToken, 'userPosts', testPostId);
        const countBefore = parseInt(docBefore?.fields?.numComments?.integerValue || '0', 10);

        const deleted = await deleteTestComments(tokens.idToken, tokens.uid);
        expect(deleted).toBeGreaterThan(0);
        console.log('Deleted ' + deleted + ' test comment(s) and decremented numComments');

        // Read numComments AFTER deletion directly from Firestore (no browser cache)
        const docAfter = await fetchDocument(tokens.idToken, 'userPosts', testPostId);
        const countAfter = parseInt(docAfter?.fields?.numComments?.integerValue || '0', 10);

        expect(countAfter).toBe(countBefore - deleted);
    });

    // ── 8. Post cleanup (MUST be last) ────────────────────────────────────────
    test('cleanup: delete test post via the site', async ({ page }) => {
        await page.locator(pid(testPostId) + ' .meatball-menu').click();

        const deleteItem = page.locator(pid(testPostId) + ' .meatball-post-menu li').filter({ hasText: 'Delete Post' });
        await expect(deleteItem).toBeVisible({ timeout: 5_000 });
        await expect(deleteItem).not.toHaveClass(/grayed-out/);

        await deleteItem.click();

        await expect(page.locator(pid(testPostId))).not.toBeVisible({ timeout: 15_000 });

        // Clean up the temp file now the post is gone
        try { fs.unlinkSync(STATE_FILE); } catch { /* already gone */ }
        testPostId = null;
    });
});

// ── Unauthenticated tests (no test post needed) ───────────────────────────────
test.describe('Stories page - Comments (unauthenticated)', () => {
    test('unauthenticated user clicking comment icon on a post is redirected to /login', async ({ browser }) => {
        const ctx  = await browser.newContext();
        const page = await ctx.newPage();

        await page.goto('/stories');
        await page.waitForSelector('.post', { timeout: 30_000 });

        const commentBubble = page.locator('.likes-comments-comment-field .material-icons').first();
        await commentBubble.click();

        const textarea = page.locator('textarea.comment-text-input').first();
        await textarea.fill('hello');

        const submitBtn = page.locator('button.comment-submit-button').first();
        await submitBtn.click();

        await page.waitForURL(/\/login/, { timeout: 10_000 });
        expect(page.url()).toContain('/login');

        await ctx.close();
    });
});
