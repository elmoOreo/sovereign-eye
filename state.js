/**
 * Defines the initial state for the agent and provides a function to reset it.
 * This centralizes the state structure, making it easier to manage and reset.
 */
const getInitialState = () => ({
  content: 'none',
  arrivalTime: null,
  alertSent: false,
  isResolved: false,
  perception_metadata: {
    presence_confirmed: false,
    milk_checked: false,
    amazon_checked: false,
    confidence_description: ''
  }
});

module.exports = { getInitialState };