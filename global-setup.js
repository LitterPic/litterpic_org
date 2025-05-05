const {exec, execSync} = require('child_process');
const http = require('http');
const tcpPortUsed = require('tcp-port-used');

// Function to forcefully terminate the process using the specified port
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

// Function to check server readiness
const checkServerIsReady = async (retryInterval = 2000, maxAttempts = 30) => {
    let attempts = 0;
    const tryConnect = () => {
        return new Promise((resolve, reject) => {
            http.get('http://localhost:3000', (res) => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(() => resolve(tryConnect()), retryInterval);
                    } else {
                        reject(new Error(`Max attempts reached. Server did not start. Last status code: ${res.statusCode}`));
                    }
                }
            }).on('error', () => {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(() => resolve(tryConnect()), retryInterval);
                } else {
                    reject(new Error('Max attempts reached. Server did not start.'));
                }
            });
        });
    };
    return tryConnect();
};

module.exports = async () => {
    const isPortInUse = await tcpPortUsed.check(3000, 'localhost');
    if (isPortInUse) {
        killProcessUsingPort(3000);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    global.__SERVER__ = exec('npm run dev', (error) => {
        if (error) {
            console.error(`Failed to start the server: ${error}`);
            process.exit(1);
        }
    });

    // Wait for the server to become ready
    try {
        await checkServerIsReady();
    } catch (error) {
        console.error(`Error waiting for server to start: ${error}`);
        process.exit(1);
    }
};
