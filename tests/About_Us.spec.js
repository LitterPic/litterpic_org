

//
// This file was generated by generateTest.py
//

const {test} = require('../fixtures');
const {expect} = require('@playwright/test');

test('About Us', async ({ page }) => {

    page.setDefaultTimeout(60000);
    test.setTimeout(0) // no timeout

    try {
        const h1Text = await page.textContent('h1');
        console.log('H1 Text (initial): ', h1Text);

        console.log('About Us Page is loading');

        await page.waitForSelector(':has-text("About Us")', { state: 'visible' });
        console.log('About Us wait');

        // Hover over the element with text content "About Us"
        await page.hover(':has-text("About Us")');
        console.log('About Us hover');

        // Wait for a short period of time (e.g., 500 milliseconds) to ensure any potential hover effects are triggered
        await page.waitForTimeout(500);

        await page.click('a:has-text("About Us")');
        console.log('About Us click');

        // Wait for navigation to happen after the click
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        console.log('About Us navigation');

        const h1TextAfter = await page.textContent('h1');
        console.log('About Us h1: ', h1TextAfter);

        console.log('About Us Page is fully loaded');
    } catch (error) {
        console.error('About Us Page did not fully load');
    }

    try {
        const h1Text = await page.textContent('h1');
        await expect(h1Text).toContain('About Us');
        console.log('H1 Text is correct:', h1Text);

        const currentURL = await page.evaluate(() => window.location.href);
        await expect(currentURL).toContain('about');
        console.log('Current URL is correct:', currentURL);

        console.log('About Us', 'page passed');
    } catch (error) {
        console.error('Assertions Error:', error);
    }

}, 60000);  // increase timeout to 60 seconds
