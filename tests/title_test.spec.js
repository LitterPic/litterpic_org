const {test} = require('../fixtures');
const {expect} = require("@playwright/test");

test('title test', async ({page}) => {
    const title = await page.title();
    expect(title).toBe('LitterPic');
});
