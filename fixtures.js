const {test} = require('@playwright/test');

test.beforeEach(async ({page}) => {

    test.setTimeout(0) // no timeout

    // Wait for 60 seconds before trying to navigate to the page
    await page.setDefaultTimeout(60000);    

    await page.goto('http://localhost:3000');
    await Promise.all([
	page.waitForLoadState('load', { timeout: 60000 }),
	
	// Wait for a specific element to appear, indicating content is loaded
	//page.waitForSelector('YourSelectorHere', { state: 'attached' }),
	page.waitForSelector('//*[contains(text(), "Inspire Change")]'),

	await page.waitForNavigation(),
	
	// Wait for network requests to settle
	page.waitForLoadState('networkidle', { timeout: 60000 }),
    ]);
});

module.exports = {test};
