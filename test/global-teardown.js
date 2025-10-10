module.exports = async () => {
  console.log('Stopping server...');
  if (global.__SERVER_INSTANCE__) {
    await new Promise((resolve, reject) => {
      global.__SERVER_INSTANCE__.close((err) => {
        if (err) {
          console.error('Error stopping server:', err);
          reject(err);
        } else {
          console.log('Server stopped.');
          resolve();
        }
      });
    });
  } else {
    console.log('No server instance to stop.');
  }
};
