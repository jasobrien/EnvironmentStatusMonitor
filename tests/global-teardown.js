module.exports = async () => {
  if (global.__SERVER_PROCESS__) {
    console.log('Stopping server (started by tests)...');
    try {
      global.__SERVER_PROCESS__.kill('SIGTERM');
      console.log('Server stopped.');
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  } else {
    console.log('Server was externally managed — leaving it running.');
  }
};
