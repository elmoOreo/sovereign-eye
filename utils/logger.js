const fs = require('fs');
const { LOG_FILE } = require('../config');

const logAgentEvent = (agentName, type, data) => {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${agentName}] [${type}] ${typeof data === 'object' ? JSON.stringify(data) : data}\n`;
    fs.appendFileSync(LOG_FILE, entry);
};

module.exports = { logAgentEvent };