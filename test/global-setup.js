const { spawn } = require('child_process');
const waitOn = require('wait-on');
const keepAlive = require('../server'); // Import the keepAlive function

module.exports = async () => {
  console.log('Starting server...');
  // Start the server and store the instance
  const serverInstance = keepAlive();

  try {
    // Wait for the server to be ready
    await waitOn({
      resources: ['http://localhost:8080'],
      timeout: 60000, // Increased timeout to 60 seconds
    });
    console.log('Server is running.');
  } catch (error) {
    console.error('Error: Timed out waiting for the server to start.');
    throw error;
  }

  // Store server instance globally for teardown
  global.__SERVER_INSTANCE__ = serverInstance;
};
