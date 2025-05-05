const { execSync } = require('child_process');

const killProcessUsingPort = (port) => {
    try {
        const result = execSync(`lsof -ti:${port}`).toString().trim();
        if (result) {
            execSync(`kill -9 ${result}`);
        }
    } catch (err) {
        console.log(`No process to terminate on port ${port} or termination failed: ${err.message}`);
    }
};

module.exports = async () => {

    // Create a promise that resolves when the teardown process completes
    const teardownPromise = new Promise((resolve) => {
        killProcessUsingPort(3000);
        resolve();
    });

    // Add a timeout using setTimeout
    const timeoutMilliseconds = 5000; // Set your desired timeout value in milliseconds
    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeoutMilliseconds);
    });

    // Wait for either the teardown process to complete or the timeout to occur
    await Promise.race([teardownPromise, timeoutPromise]);
};
