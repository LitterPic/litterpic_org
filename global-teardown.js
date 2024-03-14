const {execSync} = require('child_process');

const killProcessUsingPort = (port) => {
    try {
        const result = execSync(`lsof -ti:${port}`).toString().trim();
        if (result) {
            execSync(`kill -9 ${result}`);
            console.log(`Process on port ${port} terminated.`);
        }
    } catch (err) {
        console.log(`No process to terminate on port ${port} or termination failed: ${err.message}`);
    }
};

module.exports = async () => {
    console.log('Terminating the server process...');
    killProcessUsingPort(3000);
};
