// server/src/models/Poll.js
const mongoose = require("mongoose");

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 }
}, { _id: true });

const PollSchema = new mongoose.Schema({
  // We'll store plain text question in `question` and optional HTML in `questionHtml`
  question: { type: String, required: true },
  questionHtml: { type: String, default: "" },
  contentType: { type: String, default: "lexical" }, // optional
  options: [OptionSchema],
  totalVotes: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  allowMultipleVotes: { type: Boolean, default: true }, // Allow users to vote for multiple options - default to true
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PollSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Poll", PollSchema);
