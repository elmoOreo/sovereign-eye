const fs = require('fs');
const path = require('path');
const { MILK_LIMIT_MS, EVIDENCE_DIR, TEMP_DIR } = require('../config');
const { logAgentEvent } = require('../utils/logger');

const MILK_LIMIT_MINS = MILK_LIMIT_MS / (60 * 1000);

const logicNode = async (state) => {
  logAgentEvent("LOGIC_NODE", "INPUT_STATE", state);
  if (state.perception_metadata && state.perception_metadata.confidence_description) {
    console.log(`[i] Perception: ${state.perception_metadata.confidence_description}`);
  }

  const update = {};

  // 1. Handling ACTIVE Delivery
  if (state.content === 'milk' && state.arrivalTime) {
    const elapsedMins = Math.round((Date.now() - state.arrivalTime) / 60000);
    console.log(`[t] Timer: Milk has been out for ${elapsedMins} mins.`);

    // --- Evidence Capture on FIRST detection only ---
    if (elapsedMins === 0 && !state.alertSent) {
        if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(EVIDENCE_DIR, `milk_${stamp}.jpg`);
        const sourceEvidencePath = path.join(TEMP_DIR, 'debug_crop.jpg');

        if (fs.existsSync(sourceEvidencePath)) {
            fs.copyFileSync(sourceEvidencePath, filename);
            console.log(`[#] Evidence: Saved permanent copy to ${filename}`);
        }
    }

    // --- ENHANCEMENT: Critical Threshold Check ---
    if (elapsedMins >= MILK_LIMIT_MINS && !state.alertSent) {
      console.log(`[!] CRITICAL: Perishable threshold (${MILK_LIMIT_MINS}m) reached!`);
      // Hook for Telegram/Push notifications
    }
  }

  // 2. Handling PICKUP (Symbolic "Cleanup")
  if (state.content === 'none' && state.arrivalTime) {
    console.log(`[+] Cleanup: Delivery picked up. Resetting agent state.`);
    update.isResolved = true;
  }

  console.log(`[${new Date().toLocaleTimeString()}] 🟢 CYCLE COMPLETE`);
  
  if (Object.keys(update).length > 0) {
      logAgentEvent("LOGIC_NODE", "OUTPUT_UPDATE", update);
  }
  
  return update;
};

module.exports = { logicNode };