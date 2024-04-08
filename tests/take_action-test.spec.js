const {test} = require('../fixtures');
const {expect} = require('@playwright/test');

test('test', async ({ page }) => {

    //console.log(page)
    page.setDefaultTimeout(60000);    
    test.setTimeout(0) // no timeout

    // try {
    // 	console.log('Take Action Page is loading');
    // 	// Wait for the link with role 'link' and name 'Take Action' to appear
    // 	await page.waitForSelector('a[role="link"][aria-label="Take Action"]', { timeout: 60000 });
	
    // 	// Click on the link
    // 	await page.click('a[role="link"][aria-label="Take Action"]');
	
    // 	// Page navigation may take some time, you may want to wait for navigation to complete
    // 	await page.waitForNavigation();
	
    // 	// Now you can proceed with further actions on the new page if needed
    //  	console.log('Take Action Page is fully loaded');
    // } catch (error) {
    // 	console.error('Error:', error);
    // }
    
    try {
	//await page.waitForTimeout(10000);
	console.log('Take Action Page is loading');

	// Wait for the <div> with text content "Take Action" and href attribute "/volunteer" to appear
	//await page.waitForSelector('div[onClick*="handleNavLinkClick"][href="/volunteer"]:has-text("Take Action")');
	//await page.waitForSelector('div[onClick*="handleNavLinkClick"]:has-text("Take Action")');
	//await page.waitForSelector('div[href="/volunteer"]:has-text("Take Action")');
	await page.waitForSelector(':has-text("Take Action")');
	console.logc('Take Action wait');
	
	// Hover over the element with text content "Take Action"
	await page.hover(':has-text("Take Action")');
	console.log('Take Action hover');
	
	// Wait for a short period of time (e.g., 500 milliseconds) to ensure any potential hover effects are triggered
	await page.waitForTimeout(500);

	// Click on the element with text content "Take Action"
	//await page.click('div[href="/volunteer"]:has-text("Take Action")');
	//await page.click(':has-text("Take Action")');
	//await page.getByRole('navigation').page.getByRole('link', { name: 'Take Action' }).click();
	//await page.locator('[data-testid="take-action-link"]').click();
	await page.getByRole('link', { name: /Take Action/ }).click();
	await expect(page).toHaveURL('/volunteer')
	
	//await page.getByRole('navigation', { name: 'Take Action' }).click();	
	console.log('Take Action click');
	//await page.waitForNavigation();
	console.log('Take Action navigation');
	//await page.click('a[role="link"][aria-label="Take Action"]');
	await page.waitForLoadState('load', { timeout: 60000 });
	console.log('Take Action load');
	await page.waitForLoadState('networkidle', { timeout: 60000 });
	console.log('Take Action network idle');
	//await page.waitForTimeout(10000);
	console.log('Take Action Page is fully loaded');
    } catch (error) {
	console.error('Take Action Page did not fully load');
    }

    try {
	// Wait for h1 element to contain text 'Take Action'
	//const h1Element = await page.waitForFunction(() => document.querySelector('h1').textContent.includes('Take Action'), { timeout: 50000 });
	//const h1Element = document.querySelector('h1').textContent.includes('Take Action');
	const h1Text = await page.textContent('h1');
	console.error('Take Action h1: ', h1Text);
	
	// Wait for main element to contain text 'LitterPic Inc. Board of Directors'
	//await page.waitForFunction(() => document.querySelector('main').textContent.includes('About Us'), { timeout: 50000 });
	//console.error('Take Action: main');
	
	// Assertions
	//console.log('h1: ', h1Element.textContent); 
	//await expect(h1Element.textContent.includes('Take Action'));
	//console.error('Take Action: assert h1');

	//await expect(page.locator('main')).toContainText('LitterPic Inc. Board of Directors');
	//console.error('Take Action: assert main');
    } catch (error) {
	console.error('Error:', error);
    }
    
}, 60000);  // increase timeout to 60 seconds

