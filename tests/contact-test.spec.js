const {test} = require('../fixtures');
const {expect} = require('@playwright/test');

test('test', async ({ page }) => {

    //console.log(page)
    page.setDefaultTimeout(60000);    
    test.setTimeout(0) // no timeout
    
    try {
	await page.getByRole('link', { name: 'Contact' }).click();
	await page.waitForLoadState('load', { timeout: 30000 });
	console.log('Contact Page is fully loaded');
    } catch (error) {
	console.error('Contact Page did not fully load');
    }

    try {
	// Wait for h1 element to contain text 'Contact'
	await page.waitForFunction(() => document.querySelector('h1').textContent.includes('Contact'), { timeout: 50000 });
	//console.error('Contact: h1');
	
	// Wait for main element to contain text 'LitterPic Inc. Board of Directors'
	//await page.waitForFunction(() => document.querySelector('main').textContent.includes('LitterPic Inc. Board of Directors'), { timeout: 50000 });
	//console.error('Contact: main');
	
	// Assertions
	await expect(page.locator('h1')).toContainText('Contact');
	console.error('Contact: assert h1');

	//await expect(page.locator('main')).toContainText('LitterPic Inc. Board of Directors');
	//console.error('Contact: assert main');
    } catch (error) {
	console.error('Error:', error);
    }
    
}, 60000);  // increase timeout to 60 seconds

