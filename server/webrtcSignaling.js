import { pool } from "./db.js";

const activeCalls = new Map();

export function setupWebRTCSignaling(io) {
  if (!io) return;

  const webrtcNamespace = io.of("/webrtc");

  webrtcNamespace.on("connection", (socket) => {
    console.log(`📞 WebRTC client connected: ${socket.id}`);

    socket.on("join-call", async ({ roomId, userId }) => {
      if (!roomId || !userId) {
        socket.emit("call-error", { error: "Invalid room or user" });
        return;
      }

      socket.join(roomId);
      
      if (!activeCalls.has(roomId)) {
        activeCalls.set(roomId, new Set());
      }
      activeCalls.get(roomId).add(userId);

      const participants = Array.from(activeCalls.get(roomId) || []);
      
      socket.emit("call-joined", { roomId, participants });
      socket.to(roomId).emit("participant-joined", { userId });
      
      console.log(`📞 User ${userId} joined call room ${roomId}`);
    });

    socket.on("leave-call", async ({ roomId, userId }) => {
      if (!roomId || !userId) return;

      socket.leave(roomId);
      
      if (activeCalls.has(roomId)) {
        activeCalls.get(roomId).delete(userId);
        if (activeCalls.get(roomId).size === 0) {
          activeCalls.delete(roomId);
        }
      }

      socket.to(roomId).emit("participant-left", { userId });
      console.log(`📞 User ${userId} left call room ${roomId}`);
    });

    socket.on("offer", async ({ roomId, offer, fromUserId, toUserId }) => {
      if (!roomId || !offer || !fromUserId || !toUserId) {
        socket.emit("call-error", { error: "Missing offer data" });
        return;
      }

      socket.to(roomId).emit("offer", {
        offer,
        fromUserId,
        toUserId,
      });
      
      console.log(`📞 Offer from ${fromUserId} to ${toUserId} in ${roomId}`);
    });

    socket.on("answer", async ({ roomId, answer, fromUserId, toUserId }) => {
      if (!roomId || !answer || !fromUserId || !toUserId) {
        socket.emit("call-error", { error: "Missing answer data" });
        return;
      }

      socket.to(roomId).emit("answer", {
        answer,
        fromUserId,
        toUserId,
      });
      
      console.log(`📞 Answer from ${fromUserId} to ${toUserId} in ${roomId}`);
    });

    socket.on("ice-candidate", async ({ roomId, candidate, fromUserId, toUserId }) => {
      if (!roomId || !candidate || !fromUserId || !toUserId) {
        return;
      }

      socket.to(roomId).emit("ice-candidate", {
        candidate,
        fromUserId,
        toUserId,
      });
    });

    socket.on("call-invite", async ({ roomId, fromUserId, toUserId }) => {
      if (!roomId || !fromUserId || !toUserId) return;

      const result = await pool.query(
        "SELECT id FROM users WHERE id = $1 LIMIT 1",
        [toUserId]
      );

      if (!result.rows?.length) {
        socket.emit("call-error", { error: "User not found" });
        return;
      }

      webrtcNamespace.to(toUserId.toString()).emit("call-invite", {
        roomId,
        fromUserId,
      });
      
      console.log(`📞 Call invite from ${fromUserId} to ${toUserId}`);
    });

    socket.on("call-accept", async ({ roomId, userId }) => {
      if (!roomId || !userId) return;
      
      socket.to(roomId).emit("call-accepted", { userId });
      console.log(`📞 Call accepted by ${userId} in ${roomId}`);
    });

    socket.on("call-reject", async ({ roomId, userId }) => {
      if (!roomId || !userId) return;
      
      socket.to(roomId).emit("call-rejected", { userId });
      console.log(`📞 Call rejected by ${userId} in ${roomId}`);
    });

    socket.on("call-end", async ({ roomId, userId }) => {
      if (!roomId || !userId) return;

      if (activeCalls.has(roomId)) {
        activeCalls.get(roomId).delete(userId);
        if (activeCalls.get(roomId).size === 0) {
          activeCalls.delete(roomId);
        }
      }

      socket.to(roomId).emit("call-ended", { userId });
      socket.leave(roomId);
      
      console.log(`📞 Call ended in ${roomId} by ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log(`📞 WebRTC client disconnected: ${socket.id}`);
    });
  });

  console.log("✅ WebRTC signaling namespace registered");
}

export function getActiveCalls() {
  return Array.from(activeCalls.entries()).map(([roomId, participants]) => ({
    roomId,
    participants: Array.from(participants),
  }));
}

export function endCall(roomId) {
  if (activeCalls.has(roomId)) {
    activeCalls.delete(roomId);
    return true;
  }
  return false;
}

export default {
  setupWebRTCSignaling,
  getActiveCalls,
  endCall,
};