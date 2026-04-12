/**
 * Notifications Tests
 *
 * These tests run as the authenticated test user.
 *
 * Covers:
 *  ✅ Notifications page loads and displays the heading
 *  ✅ Either the "no notifications" message OR notification items are rendered
 *  ✅ Clicking a notification item navigates to the associated story
 *  ✅ Clicking the status-indicator dot marks the notification as read
 *  ✅ Clicking the delete (trash) button removes the notification
 *  ✅ The "Clear All" button triggers a confirmation dialog
 */
const { test, expect } = require('@playwright/test');
const { injectFirebaseAuth } = require('../../helpers/auth');

test.describe('Notifications page', () => {
    test.beforeEach(async ({ page }) => {
        await injectFirebaseAuth(page);
        await page.goto('/notifications');
        // Wait for the page content — can't use 'networkidle' because Firestore keeps WebSocket connections open
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('h1.heading-text', { timeout: 15_000 });
        await expect(page).toHaveURL(/\/notifications/);
    });

    test('page loads with the Notifications heading', async ({ page }) => {
        await expect(page.locator('h1.heading-text')).toContainText('Notifications');
    });

    test('renders either notifications or the empty-state message', async ({ page }) => {
        const hasItems = await page.locator('.notification-item').count() > 0;
        if (hasItems) {
            await expect(page.locator('.notification-item').first()).toBeVisible();
        } else {
            await expect(page.locator('.no-notifications-message')).toBeVisible();
        }
    });

    test('clicking a notification navigates to the associated story', async ({ page }) => {
        const firstNotif = page.locator('.notification-item').first();
        const notifCount = await page.locator('.notification-item').count();

        if (notifCount === 0) {
            test.skip(true, 'No notifications to click');
        }

        // Click the notification content area (not the status dot or delete btn)
        await firstNotif.locator('.notification-content').click();

        // Should navigate to /stories?postId=...
        await page.waitForURL(/\/stories/, { timeout: 15_000 });
        expect(page.url()).toContain('/stories');
    });

    test('clicking the status dot marks a notification as read', async ({ page }) => {
        const unreadNotif = page.locator('.notification-item.unread').first();
        const unreadCount = await page.locator('.notification-item.unread').count();

        if (unreadCount === 0) {
            test.skip(true, 'No unread notifications to mark as read');
        }

        await unreadNotif.locator('.status-indicator').click();

        // The notification-item should lose the 'unread' class and gain 'read'
        await page.waitForTimeout(2_000);
        await expect(unreadNotif).not.toHaveClass(/unread/);
    });

    test('delete button removes a notification', async ({ page }) => {
        const notifCount = await page.locator('.notification-item').count();

        if (notifCount === 0) {
            test.skip(true, 'No notifications to delete');
        }

        // Click delete on the last notification (least important)
        const lastNotif = page.locator('.notification-item').last();
        const deleteBtn = lastNotif.locator('button.delete-notification-button');
        await deleteBtn.click();

        // Notification should disappear (Firestore delete is near-instant with onSnapshot)
        await page.waitForTimeout(2_000);
        const newCount = await page.locator('.notification-item').count();
        expect(newCount).toBe(notifCount - 1);
    });

    test('"Clear All" button shows a browser confirm dialog', async ({ page }) => {
        const notifCount = await page.locator('.notification-item').count();

        if (notifCount === 0) {
            test.skip(true, 'No notifications to clear');
        }

        // Dismiss the dialog so we don't actually delete everything
        page.on('dialog', async (dialog) => {
            expect(dialog.type()).toBe('confirm');
            expect(dialog.message()).toContain('delete all');
            await dialog.dismiss();
        });

        await page.locator('button.clear-all-button').click();

        // After dismissal, notifications should still be there
        await page.waitForTimeout(1_000);
        const afterCount = await page.locator('.notification-item').count();
        expect(afterCount).toBe(notifCount);
    });
});

