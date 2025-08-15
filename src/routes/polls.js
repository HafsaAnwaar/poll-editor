// server/src/routes/polls.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/pollController");

// REST endpoints
router.get("/", controller.list);
router.get("/:id", controller.get);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.post("/:id/vote", controller.vote);
router.post("/:id/unvote", controller.unvote);
router.post("/:id/reset", controller.reset);
router.delete("/:id", controller.remove);

module.exports = router;
