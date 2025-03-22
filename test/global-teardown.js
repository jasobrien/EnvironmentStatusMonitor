module.exports = async () => {
  console.log('Stopping server...');
  if (global.__SERVER_PROCESS__) {
    global.__SERVER_PROCESS__.kill();
    console.log('Server stopped.');
  }
};
