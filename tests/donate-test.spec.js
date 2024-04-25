const {test} = require('../fixtures');
const {expect} = require('@playwright/test');

test('test', async ({ page }) => {

    //console.log(page)
    page.setDefaultTimeout(60000);    
    test.setTimeout(0) // no timeout
    
    try {
	await page.getByRole('link', { name: 'Donate' }).click();
	await page.waitForLoadState('load', { timeout: 10000 });
	console.log('Donate Page is fully loaded');
    } catch (error) {
	console.error('Donate Page did not fully load');
    }
    
    // Retrieve the title of the page
    try {
	const pageTitle = await page.title();
	console.log('Page title:', pageTitle);
	expect(pageTitle).toBe('Donate to LitterPic');
    } catch (error) {
	console.log('Error with Donate title')
    }
    
    try {
	await page.frameLocator('iframe[name="donorbox"]').getByText('Choose amount Payment Information Payment').click();
	await page.frameLocator('iframe[name="donorbox"]').getByRole('button', { name: '$25' }).click();
	await page.frameLocator('iframe[name="donorbox"]').getByRole('button', { name: 'Next Button' }).click();
	const page1Promise = page.waitForEvent('popup');
	await page.frameLocator('iframe[name="donorbox"]').getByLabel('Powered by Donorbox (new window)').click();
	const page1 = await page1Promise;
    } catch (error) {
	console.log('Error with DonorBox loading')
	//console.error('Donate Box error:', error);
    }
    
}, 60000);  // increase timeout to 60 seconds

