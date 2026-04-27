require('dotenv').config();
const express = require('express');
const fs = require('fs');
const { agent } = require('./workflow');
const { logAgentEvent } = require('./utils/logger');
const { getInitialState } = require('./state');
const config = require('./config');

// --- Initial State ---
let currentAgentState = getInitialState();

// --- Server & Execution ---
const app = express();
app.get('/status', (req, res) => {
    const elapsed = currentAgentState.arrivalTime ? Math.round((Date.now() - currentAgentState.arrivalTime) / 60000) : 0;
    res.json({ ...currentAgentState, elapsedMins: elapsed });
});

const server = app.listen(config.STATUS_API_PORT, () => {
  // Initial log setup
  if (!fs.existsSync(config.LOG_FILE)) {
    fs.writeFileSync(config.LOG_FILE, '');
  }
  logAgentEvent("SYSTEM", "STARTUP", `Agent starting up. Port: ${config.STATUS_API_PORT}, Interval: ${config.HEARTBEAT_INTERVAL_MS}ms`);

  console.log("\n" + "=".repeat(40));
  console.log("   CCTV NEURO-SYMBOLIC AGENT ONLINE");
  console.log("=".repeat(40));
  console.log(`[+] Monitoring: ${process.env.RTSP_URL}`);
  console.log(`[+] Status API: http://localhost:${config.STATUS_API_PORT}/status`);
  console.log(`[+] Logs: ${config.LOG_FILE}`);
  console.log("=".repeat(40) + "\n");

  setInterval(async () => {
    try {
      const newState = await agent.invoke(currentAgentState);
      currentAgentState = newState; // The result from invoke is the new full state.

      if (currentAgentState.isResolved) {
          // If resolved, reset to initial state for the next cycle
          logAgentEvent("SYSTEM", "STATE_RESET", "Agent state has been reset after resolution.");
          currentAgentState = getInitialState();
      }
    } catch (err) {
      console.error("[-] Heartbeat Error:", err.message);
      logAgentEvent("SYSTEM", "HEARTBEAT_ERROR", err.message);
    }
  }, config.HEARTBEAT_INTERVAL_MS);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[-] Port ${config.STATUS_API_PORT} is busy. Try changing the STATUS_API_PORT in config.js.`);
    } else {
        console.error(`[-] Server error:`, err);
    }
    process.exit(1);
});