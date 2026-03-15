const { spawn } = require('child_process');
const http = require('http');
const waitOn = require('wait-on');

const SERVER_URL = 'http://localhost:8080';

/**
 * Check whether a server is already listening on the target port.
 * Returns true if a response (any status) is received.
 */
function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(SERVER_URL, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

module.exports = async () => {
  // If the application is already running, reuse it — don't start a new one.
  if (await isServerRunning()) {
    console.log('Server already running — reusing existing instance.');
    global.__SERVER_PROCESS__ = null; // flag: we did not start it
    return;
  }

  console.log('Starting server...');
  const serverProcess = spawn('node', ['index.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    detached: false,
  });

  try {
    await waitOn({
      resources: [SERVER_URL],
      timeout: 120000,
    });
    console.log('Server is running.');
  } catch (error) {
    console.error('Error: Timed out waiting for the server to start.');
    if (serverProcess) serverProcess.kill();
    throw error;
  }

  global.__SERVER_PROCESS__ = serverProcess;
};
