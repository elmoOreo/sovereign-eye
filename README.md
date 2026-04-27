# Sovereign Eye: A CCTV Neuro-Symbolic Agent

Sovereign Eye is a proof-of-concept project that demonstrates how to build a neuro-symbolic agent in Node.js. It monitors a CCTV (RTSP) stream, uses a local vision model to perceive its environment, and applies symbolic logic to take action based on what it sees.

This example is configured to watch a specific area for a milk delivery, start a timer when it's detected, and raise a critical alert if the milk is left out for too long.

## Features

- **Real-time Perception:** Captures frames from any RTSP-enabled camera.
- **Local AI Vision:** Leverages a local large vision model (LVM) via [Ollama](https://ollama.ai/) (using the `moondream` model) to describe what it sees.
- **Neuro-Symbolic Logic:** Bridges the neural network's perception (e.g., "I see a white object") to a symbolic representation (e.g., `content: "milk"`).
- **Stateful Agentic Workflow:** Built with LangGraph to manage the agent's state over time (e.g., tracking `arrivalTime`, `alertSent`).
- **Configurable & Modular:** Easily adapt the logic, prompts, and configuration for different use cases.
- **Evidence Capture:** Automatically saves an image of the detected object for verification.
- **Status API:** A simple Express server provides a JSON endpoint to check the agent's current state.

## Architecture

The agent is built as a state machine using LangGraph, with distinct nodes responsible for different tasks.

1.  **`visionNode` (The "Neuro" part):**
    - Connects to the RTSP stream using `ffmpeg`.
    - Extracts a single frame.
    - Crops the frame to a specific Region of Interest (ROI) using `sharp`.
    - Sends the cropped image to the Ollama vision model with a specific prompt.
    - Interprets the model's text response to create a symbolic representation (e.g., `milk`, `amazon`, `none`).

2.  **`logicNode` (The "Symbolic" part):**
    - Receives the symbolic state from the `visionNode`.
    - Applies a rules-based engine to the state.
    - If milk is detected for the first time, it records the `arrivalTime` and saves an evidence image.
    - If milk has been present longer than a configured threshold, it sets an `alertSent` flag.
    - If the milk is gone, it resets the state by setting `isResolved`.

3.  **`index.js` (The "Heartbeat"):**
    - The main execution loop.
    - Runs the LangGraph workflow on a set interval (`HEARTBEAT_INTERVAL_MS`).
    - Manages the overall state between cycles.
    - Hosts the Express status server.

## Setup and Installation

### Prerequisites

- **Node.js** (v18+ recommended)
- **FFmpeg:** Must be installed and available in your system's PATH. This is used to connect to the RTSP stream.
- **Ollama:** You need a running Ollama instance.
  - Install Ollama
  - Pull the vision model: `ollama pull moondream`

### Installation Steps

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd sovereign-eye
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create the environment file:**
    - You will need a `.env` file in the project root. You can create one from scratch or copy `.env.example` if it exists.
    - Edit `.env` and add your credentials:
      ```
      RTSP_URL="rtsp://user:password@your_camera_ip:554/stream1"
      OLLAMA_URL="http://localhost:11434/api/generate"
      ```

4.  **Configure the Region of Interest (ROI):**
    - The agent only looks at a small part of the camera feed for efficiency. You need to define this area.
    - First, get a master frame from your camera. You can use VLC or run this command (placing the image in the project root as `roi_master.jpg`):
      ```bash
      ffmpeg -i "rtsp://..." -vframes 1 roi_master.jpg
      ```
      *(Replace `...` with your RTSP URL)*
    - A helper tool is included to find the coordinates. Run it:
      ```bash
      node picker.js
      ```
    - Open your browser to `http://localhost:5050`.
    - Click the top-left and bottom-right corners of the area you want to monitor.
    - The tool will output a JSON object. Copy this object.
    - Open `config.js` and paste the coordinates into the `ROI` value.

## Usage

- **Start the agent:**
  ```bash
  npm start
  ```
  You will see logs in your console for each perception cycle.

- **Check the status:**
  Open a new terminal and use `curl` or visit the URL in your browser.
  ```bash
  curl http://localhost:4000/status
  ```
  *Example output when milk is detected:*
  ```json
  {
    "content": "milk",
    "arrivalTime": 1678886400000,
    "alertSent": false,
    "isResolved": false,
    "elapsedMins": 5
  }
  ```

- **View Logs:**
  The agent logs all major events to `agent_runtime.log`.

## Project Structure

```
.
├── agents/
│   ├── vision.js       # The "Neuro" node for perception.
│   └── logic.js        # The "Symbolic" node for rules.
├── utils/
│   └── logger.js       # Simple file-based logger.
├── .env                # Holds secrets like camera URLs and API keys.
├── config.js           # Main configuration for non-secret values.
├── index.js            # Main application entrypoint and heartbeat loop.
├── package.json        # Project dependencies and scripts.
├── picker.js           # Helper tool to find ROI coordinates.
└── workflow.js         # LangGraph state and graph definition.
```