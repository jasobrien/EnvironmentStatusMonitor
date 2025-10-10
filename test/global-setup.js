const { spawn } = require('child_process');
const waitOn = require('wait-on');

let serverProcess;

module.exports = async () => {
  console.log('Starting server...');
  
  // Start the server using spawn
  serverProcess = spawn('node', ['index.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    detached: false,
  });

  try {
    // Wait for the server to be ready
    await waitOn({
      resources: ['http://localhost:8080'],
      timeout: 120000, // Increased timeout to 120 seconds for CI environments
    });
    console.log('Server is running.');
  } catch (error) {
    console.error('Error: Timed out waiting for the server to start.');
    if (serverProcess) {
      serverProcess.kill();
    }
    throw error;
  }

  global.__SERVER_PROCESS__ = serverProcess;
};
