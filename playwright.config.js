module.exports = {
    use: {
        headless: false
    },
    globalSetup: './global-setup.js',
    globalTeardown: './global-teardown.js',
    require: ['./fixtures.js']  // Load the custom fixtures
};
