const keepAlive = require("./server");

try {
    keepAlive();
} catch (error) {
    console.error("Failed to start the server:", error);
}

