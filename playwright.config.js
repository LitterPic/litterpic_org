module.exports = {
    use: {
	ignoreHTTPSErrors: true,
        headless: false
    },
    testTimeout: 60000, // Set global timeout to 60 seconds
    globalSetup: './global-setup.js',
    globalTeardown: './global-teardown.js',
    require: ['./fixtures.js']  // Load the custom fixtures
};
