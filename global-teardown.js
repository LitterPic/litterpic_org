const killPort = require('kill-port');

module.exports = async () => {
    await killPort(3000);
};
