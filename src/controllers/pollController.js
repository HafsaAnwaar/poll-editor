// server/src/controllers/pollController.js
const Poll = require("../models/Poll");

// List polls
exports.list = async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 }).lean();
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single poll
exports.get = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Create poll
exports.create = async (req, res) => {
  try {  
    const { question, questionHtml = "", contentType = "lexical", options = [], allowMultipleVotes, isActive = true } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: "plain text question is required" });
    }
    if (!Array.isArray(options) || options.filter((t) => String(t).trim()).length < 2) {
      return res.status(400).json({ message: "at least 2 options are required" });
    }
    
    // Ensure boolean values - default to true if not provided
    const allowMultipleVotesBool = allowMultipleVotes === undefined ? true : (allowMultipleVotes === true || allowMultipleVotes === 'true');
    const isActiveBool = isActive !== false && isActive !== 'false';
    
    
    const poll = new Poll({
      question,
      questionHtml,
      contentType,
      allowMultipleVotes: allowMultipleVotesBool,
      isActive: isActiveBool,
      options: options.filter((t) => String(t).trim()).map((t) => ({ text: t.trim(), votes: 0 }))
    });
    await poll.save();
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update poll (edit text/options)
exports.update = async (req, res) => {
  try {

    
    const updates = req.body;
    if (typeof updates.question !== 'undefined' && typeof updates.question !== 'string') {
      return res.status(400).json({ message: "question must be plain text string" });
    }
    
    // Handle boolean fields properly
    if (typeof updates.allowMultipleVotes !== 'undefined') {
    }
    if (typeof updates.isActive !== 'undefined') {
      updates.isActive = updates.isActive !== false && updates.isActive !== 'false';
    }
    
    if (Array.isArray(updates.options)) {
      // Preserve existing votes where option text matches; new texts start at 0
      const pollExisting = await Poll.findById(req.params.id).lean();
      if (!pollExisting) return res.status(404).json({ message: "Poll not found" });

      // Build multimap by normalized text to preserve duplicates and order
      const buckets = new Map();
      (pollExisting.options || []).forEach((o) => {
        const key = String(o.text || "").trim().toLowerCase();
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(o);
      });

      const normalizedOptions = updates.options
        .filter((t) => String(t).trim())
        .map((t) => {
          const textTrimmed = String(t).trim();
          const key = textTrimmed.toLowerCase();
          const bucket = buckets.get(key);
          if (bucket && bucket.length > 0) {
            const existing = bucket.shift();
            return { _id: existing._id, text: textTrimmed, votes: existing.votes || 0 };
          }
          return { text: textTrimmed, votes: 0 };
        });

      updates.options = normalizedOptions;
      updates.totalVotes = normalizedOptions.reduce((sum, o) => sum + (o.votes || 0), 0);
    }
    updates.updatedAt = Date.now();
    // Use findByIdAndUpdate with overwrite of array while preserving existing option _ids
    const poll = await Poll.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Vote (atomic)
exports.vote = async (req, res) => {
  try {
    const { optionId } = req.body;
    const pollId = req.params.id;
    if (!optionId) return res.status(400).json({ message: "optionId required" });

    // Atomic increment on option.votes and totalVotes
    const result = await Poll.findOneAndUpdate(
      { _id: pollId, "options._id": optionId },
      { $inc: { "options.$.votes": 1, totalVotes: 1 } },
      { new: true }
    ).lean();

    if (!result) return res.status(404).json({ message: "Poll or option not found" });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Unvote (atomic decrement)
exports.unvote = async (req, res) => {
  try {
    const { optionId } = req.body;
    const pollId = req.params.id;
    if (!optionId) return res.status(400).json({ message: "optionId required" });

    // Decrement only if counts are above zero to avoid negatives
    const result = await Poll.findOneAndUpdate(
      { _id: pollId, "options._id": optionId, "options.votes": { $gt: 0 }, totalVotes: { $gt: 0 } },
      { $inc: { "options.$.votes": -1, totalVotes: -1 } },
      { new: true }
    ).lean();

    if (!result) return res.status(404).json({ message: "Poll or option not found or counts already zero" });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Reset poll votes ()
exports.reset = async (req, res) => {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    poll.options.forEach((o) => (o.votes = 0));
    poll.totalVotes = 0;
    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete poll
exports.remove = async (req, res) => {
  try {
    const pollId = req.params.id;
    const deleted = await Poll.findByIdAndDelete(pollId).lean();
    if (!deleted) return res.status(404).json({ message: "Poll not found" });
    res.json({ ok: true, _id: pollId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};