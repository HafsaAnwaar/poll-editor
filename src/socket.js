// server/src/socket.js
// Socket.IO handlers; keeps logic separate so controller and routes remain RESTful
module.exports = function (io) {
  // Namespace / room logic is simple: clients can join rooms named by pollId
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join a room for a specific poll
    socket.on("subscribe", ({ pollId }) => {
      if (!pollId) return;
      socket.join(pollId);
    });

    // Leave
    socket.on("unsubscribe", ({ pollId }) => {
      if (!pollId) return;
      socket.leave(pollId);
    });

    // Broadcast created/updated poll events (payloads expected to be full poll objects)
    socket.on("poll_created", (poll) => {
      // broadcast to everyone
      io.emit("poll_created", poll);
    });

    socket.on("poll_updated", (poll) => {
      io.emit("poll_updated", poll);
    });

    socket.on("poll_deleted", ({ pollId }) => {
      if (!pollId) return;
      io.emit("poll_deleted", { pollId });
    });

    // Votes: emit vote_update to the poll room (we still persist via REST endpoint)
    socket.on("vote_cast", ({ pollId, optionId, updatedPoll }) => {
      if (pollId) {
        // emit to everyone in the poll's room
        io.to(pollId).emit("vote_update", { pollId, updatedPoll });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
