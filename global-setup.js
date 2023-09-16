const {exec} = require('child_process');

module.exports = async () => {
    // Store the server instance to a global variable for later use in teardown
    global.__SERVER__ = exec('npm run dev', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }

        console.error(`stderr: ${stderr}`);
    });

    // Optional: Wait for a few seconds to ensure the server starts
    await new Promise(resolve => setTimeout(resolve, 10000));
};
