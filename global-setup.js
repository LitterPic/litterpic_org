const {exec, execSync} = require('child_process');
const http = require('http');
const tcpPortUsed = require('tcp-port-used');

// Function to forcefully terminate the process using the specified port
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

// Function to check server readiness
const checkServerIsReady = async (retryInterval = 2000, maxAttempts = 30) => {
    let attempts = 0;
    const tryConnect = () => {
        return new Promise((resolve, reject) => {
            http.get('http://localhost:3000', (res) => {
                if (res.statusCode === 200) {
                    console.log('Server is up and running.');
                    resolve(true);
                } else {
                    console.log(`Server responded with status code: ${res.statusCode}. Retrying...`);
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(() => resolve(tryConnect()), retryInterval);
                    } else {
                        reject(new Error(`Max attempts reached. Server did not start. Last status code: ${res.statusCode}`));
                    }
                }
            }).on('error', () => {
                console.log(`Error connecting to server, retrying... Attempt ${attempts + 1}`);
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
    console.log('Checking if the server is already running...');
    const isPortInUse = await tcpPortUsed.check(3000, 'localhost');
    if (isPortInUse) {
        console.log('Port 3000 is already in use. Attempting to terminate the process using it...');
        killProcessUsingPort(3000);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Starting the server...');
    global.__SERVER__ = exec('npm run dev', (error) => {
        if (error) {
            console.error(`Failed to start the server: ${error}`);
            process.exit(1);
        }
    });

    // Wait for the server to become ready
    try {
        await checkServerIsReady();
        console.log('Server is ready for tests.');
    } catch (error) {
        console.error(`Error waiting for server to start: ${error}`);
        process.exit(1);
    }
};
