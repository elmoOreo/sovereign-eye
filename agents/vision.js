const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { 
  ROI, VISION_MODEL, VISION_TIMEOUT_MS, TEMP_DIR, 
  PROMPT_PRESENCE, PROMPT_MILK, PROMPT_AMAZON, MILK_WINDOW 
} = require('../config');
const { logAgentEvent } = require('../utils/logger');

const OLLAMA_URL = process.env.OLLAMA_URL;
const RTSP_URL = process.env.RTSP_URL;

const visionNode = async (state) => {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🟡 STARTING WATERFALL PERCEPTION (Pessimistic Mode)`);
  logAgentEvent("VISION_NODE", "INPUT_STATE", state);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS * 3);

  try {
    // --- STEP 0: IMAGE ACQUISITION ---
    const frameBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      ffmpeg(RTSP_URL).inputOptions(['-rtsp_transport', 'tcp', '-timeout', '5000000'])
        .frames(1).format('image2').on('error', reject)
        .pipe().on('data', c => chunks.push(c)).on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Image Enhancement: Contrast is boosted to help see the "seam" between bin and parcel
    const processedBuffer = await sharp(frameBuffer)
      .extract(ROI)
      .modulate({ brightness: 1.0, contrast: 1.7 }) 
      .resize(800)
      .toBuffer();

    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    fs.writeFileSync(path.join(TEMP_DIR, 'debug_crop.jpg'), processedBuffer);

    const base64Image = processedBuffer.toString('base64');

    // Inference Helper
    const askAI = async (prompt) => {
      const res = await fetch(OLLAMA_URL, {
        method: "POST", signal: controller.signal,
        body: JSON.stringify({ model: VISION_MODEL, prompt, images: [base64Image], stream: false })
      });
      const data = await res.json();
      return data.response.toLowerCase().trim();
    };

    const audit = { timestamp: new Date().toISOString() };
    let detectedContent = "none";

    // --- WATERFALL STEP 1: PRESENCE (Protrusion Check) ---
    const presenceRes = await askAI(PROMPT_PRESENCE);
    audit.presence_raw = presenceRes;
    console.log(`[1/3] Presence check: "${presenceRes}"`);
    
    /**
     * PESSIMISTIC FILTER: 
     * If the model is confused ('?'), confirms it's empty ('yes'),
     * or doesn't explicitly confirm an object ('no'), we EXIT EARLY.
     */
    const isAmbiguousOrEmpty = presenceRes.includes('yes') || 
                               presenceRes.includes('?') || 
                               presenceRes.includes('empty') ||
                               !presenceRes.includes('no');

    if (isAmbiguousOrEmpty) {
      console.log(`[-] Logic: Bin identified as Empty/Ambiguous. Resetting.`);
      return { content: 'none', arrivalTime: null, metadata: audit };
    }

    // --- WATERFALL STEP 2: MILK (Temporal Window) ---
    const currentHour = new Date().getHours();
    if (currentHour >= MILK_WINDOW.start && currentHour < MILK_WINDOW.end) {
      const milkRes = await askAI(PROMPT_MILK);
      audit.milk_raw = milkRes;
      console.log(`[2/3] Milk check: "${milkRes}"`);
      
      if (milkRes.includes('yes') && !milkRes.includes('reflection')) {
        detectedContent = 'milk';
        console.log(`[+] Logic: Vertical White Protrusion Detected -> MILK`);
      }
    }

    // --- WATERFALL STEP 3: AMAZON (Structural Check) ---
    if (detectedContent === 'none') {
      const amazonRes = await askAI(PROMPT_AMAZON);
      audit.amazon_raw = amazonRes;
      console.log(`[3/3] Amazon check: "${amazonRes}"`);
      
      // Strict confirmation for brown-on-brown parcels
      if (amazonRes.includes('yes')) {
        detectedContent = 'amazon';
        console.log(`[+] Logic: Vertical Brown Protrusion Detected -> AMAZON`);
      } else {
        // Fallback: Something is there, but doesn't match a known type
        detectedContent = 'item_detected';
        console.log(`[!] Logic: Unknown object protruding above rim.`);
      }
    }

    clearTimeout(timeoutId);
    return {
      content: detectedContent,
      arrivalTime: (detectedContent !== 'none' && !state.arrivalTime) ? Date.now() : state.arrivalTime,
      metadata: audit
    };

  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`[!] Vision Waterfall Error: ${err.message}`);
    logAgentEvent("VISION_NODE", "ERROR", err.message);
    return state;
  }
};

module.exports = { visionNode };