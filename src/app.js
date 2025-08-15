// server/src/app.js
const express = require("express");
const cors = require("cors");
const pollRoutes = require("./routes/polls");

const createApp = (clientOrigin) => {
  const app = express();
  app.use(cors({ origin: clientOrigin || "*" }));
  app.use(express.json({ limit: "1mb" }));

  // Health
  app.get("/health", (req, res) => res.json({ ok: true }));

  // Use poll routes
  app.use("/api/polls", pollRoutes);

  return app;
};

module.exports = createApp;
