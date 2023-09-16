const {test} = require('@playwright/test');

test.beforeEach(async ({page}) => {

    // Wait for 5 seconds before trying to navigate to the page
    await page.waitForTimeout(3000);

    // Now, navigate to the page
    await page.goto('http://localhost:3000');
});

module.exports = {test};
