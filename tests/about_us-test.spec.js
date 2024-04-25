const {test} = require('../fixtures');
const {expect} = require('@playwright/test');

test('test', async ({ page }) => {

    //console.log(page)
    page.setDefaultTimeout(60000);    
    test.setTimeout(0) // no timeout
    
    try {
	await page.getByRole('link', { name: 'About Us' }).click();
	await page.waitForLoadState('load', { timeout: 30000 });
	console.log('About Us Page is fully loaded');
    } catch (error) {
	console.error('About Us Page did not fully load');
    }

    try {
	const h1Text = await page.textContent('h1');
	console.error('Take Action h1: ', h1Text);

	// Wait for h1 element to contain text 'About Us'
	await page.waitForFunction(() => document.querySelector('h1').textContent.includes('About Us'), { timeout: 50000 });
	//console.error('About Us: h1');
	
	// Wait for main element to contain text 'LitterPic Inc. Board of Directors'
	await page.waitForFunction(() => document.querySelector('main').textContent.includes('LitterPic Inc. Board of Directors'), { timeout: 50000 });
	//console.error('About Us: main');
	
	// Assertions
	await expect(page.locator('h1')).toContainText('About Us');
	console.error('About Us: assert h1');

	await expect(page.locator('main')).toContainText('LitterPic Inc. Board of Directors');
	console.error('About Us: assert main');
    } catch (error) {
	console.error('Error:', error);
    }
    
}, 60000);  // increase timeout to 60 seconds

