// server/src/server.js
const http = require("http");
const mongoose = require("mongoose");
const createApp = require("./app");
const socketHandlers = require("./socket");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = createApp(CLIENT_ORIGIN);
const server = http.createServer(app);

// Socket.IO setup (attached to same server)
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] }
});

// attach socket handlers
socketHandlers(io);

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Socket.IO attached`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
