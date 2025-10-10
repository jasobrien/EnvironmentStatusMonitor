module.exports = async () => {
  console.log('Stopping server...');
  if (global.__SERVER_PROCESS__) {
    try {
      global.__SERVER_PROCESS__.kill('SIGTERM');
      console.log('Server stopped.');
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  } else {
    console.log('No server process to stop.');
  }
};
