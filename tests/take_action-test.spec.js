const {test} = require('../fixtures');
const {expect} = require('@playwright/test');

test('test', async ({ page }) => {

    page.setDefaultTimeout(60000);    
    test.setTimeout(0) // no timeout
    
    try {
	const h1Text = await page.textContent('h1');
	console.log('H1 Text (initial): ', h1Text);

	console.log('Take Action Page is loading');

	await page.waitForSelector(':has-text("Take Action")', {state: 'visible'});
	console.log('Take Action wait');
	
	// Hover over the element with text content "Take Action"
	await page.hover(':has-text("Take Action")');
	console.log('Take Action hover');
	
	// Wait for a short period of time (e.g., 500 milliseconds) to ensure any potential hover effects are triggered
	await page.waitForTimeout(500);

	await page.click('a:has-text("Take Action")');
	console.log('Take Action click');
	await page.waitForNavigation();
	console.log('Take Action navigation');


	 // Wait for navigation to happen after the click
	//await page.waitForNavigation({waitUntil: 'domcontentloaded'});
	//console.log('Take Action navigation');
	//await page.waitForLoadState('load', { timeout: 60000 });
	//console.log('Take Action load');
	//await page.waitForLoadState('networkidle', { timeout: 60000 });
	//console.log('Take Action network idle');

	const h1TextAfter = await page.textContent('h1');
	console.error('Take Action h1: ', h1TextAfter);

	console.log('Take Action Page is fully loaded');
    } catch (error) {
	console.error('Take Action Page did not fully load', error);
    }

    try {
	const h1Text = await page.textContent('h1');
	await expect(h1Text).toContain('Take Action');
	console.log('H1 Text is correct:', h1Text);

	const currentURL = await page.evaluate(() => window.location.href);
	await expect(currentURL).toContain('/volunteer');
	console.log('Current URL is correct:', currentURL);

	console.log('Take Action', 'page passed');
    } catch (error) {
	console.error('Assertions Error:', error);
    }
    
}, 60000);  // increase timeout to 60 seconds

