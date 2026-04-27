const { StateGraph, START, END } = require("@langchain/langgraph");
const { visionNode } = require('./agents/vision');
const { logicNode } = require('./agents/logic');

// --- State Definition ---
const agentState = {
  channels: {
    content: {
      value: (x, y) => y,
      default: () => "none",
    },
    arrivalTime: {
      value: (x, y) => y,
      default: () => null,
    },
    alertSent: {
      value: (x, y) => y,
      default: () => false,
    },
    isResolved: {
      value: (x, y) => y,
      default: () => false,
    },
    perception_metadata: {
      value: (x, y) => y,
      default: () => ({
        presence_confirmed: false,
        milk_checked: false,
        amazon_checked: false,
        confidence_description: ''
      }),
    }
  }
};

// --- Graph Assembly ---
const workflow = new StateGraph(agentState)
  .addNode("vision", visionNode)
  .addNode("logic", logicNode)
  .addEdge(START, "vision")
  .addEdge("vision", "logic")
  .addEdge("logic", END);

const agent = workflow.compile();

module.exports = { agent };