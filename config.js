module.exports = {
  // Timing & Thresholds
  MILK_LIMIT_MS: 20 * 60 * 1000, 
  HEARTBEAT_INTERVAL_MS: 30000,
  VISION_TIMEOUT_MS: 15000,
  MILK_WINDOW: { start: 7, end: 8 }, // 7 AM to 8 AM

  // Infrastructure
  LOG_FILE: 'agent_runtime.log',
  STATUS_API_PORT: 4000,
  EVIDENCE_DIR: './evidence',
  TEMP_DIR: './temp',

  // Vision ROI (Region of Interest)
  ROI: { left: 746, top: 258, width: 235, height: 146 },

  // Neuro-Perception (Waterfall Prompts)
  VISION_MODEL: 'moondream',

  // Step 1: Presence (The "Horizon" Check)
  PROMPT_PRESENCE: "Look at the dark brown container. Is the top rim flat and clear, or is there an object stacked on top of it that breaks the silhouette? Answer 'yes' if it is empty/flat, or 'no' if something is protruding above the rim.",

  // Step 2: Milk (The "Luma" Check - White stands out against brown)
  PROMPT_MILK: "Is there a white object or stack of white packets rising ABOVE the rim of the dark brown container? Answer 'yes' only if the protrusion is white.",

  // Step 3: Amazon (The "Vertical Stack" Check)
  PROMPT_AMAZON: "Is there a second brown object resting on top of the dark brown bin? Look for a seam or a change in shape where the bin ends and a parcel begins. Answer 'yes' only if the total height exceeds the bin's physical frame.",
};