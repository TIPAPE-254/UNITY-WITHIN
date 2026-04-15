/**
 * webrtcSignaling.js — WebRTC signaling setup for voice/video calls
 * Registers Socket.IO events needed for peer-to-peer media sessions.
 */

/**
 * Sets up WebRTC signaling events on the Socket.IO server instance.
 * @param {import('socket.io').Server} io
 */
export function setupWebRTCSignaling(io) {
    if (!io) return;

    io.on('connection', (socket) => {
        // WebRTC offer/answer/ICE candidate relay
        socket.on('webrtc:join', ({ roomId, userId }) => {
            if (!roomId) return;
            socket.join(`webrtc:${roomId}`);
            socket.to(`webrtc:${roomId}`).emit('webrtc:peer_joined', { userId, socketId: socket.id });
        });

        socket.on('webrtc:offer', ({ roomId, offer, targetSocketId }) => {
            const target = targetSocketId ? io.sockets.sockets.get(targetSocketId) : null;
            if (target) {
                target.emit('webrtc:offer', { offer, fromSocketId: socket.id });
            }
        });

        socket.on('webrtc:answer', ({ answer, targetSocketId }) => {
            const target = targetSocketId ? io.sockets.sockets.get(targetSocketId) : null;
            if (target) {
                target.emit('webrtc:answer', { answer, fromSocketId: socket.id });
            }
        });

        socket.on('webrtc:ice_candidate', ({ candidate, targetSocketId }) => {
            const target = targetSocketId ? io.sockets.sockets.get(targetSocketId) : null;
            if (target) {
                target.emit('webrtc:ice_candidate', { candidate, fromSocketId: socket.id });
            }
        });

        socket.on('webrtc:leave', ({ roomId }) => {
            if (!roomId) return;
            socket.to(`webrtc:${roomId}`).emit('webrtc:peer_left', { socketId: socket.id });
            socket.leave(`webrtc:${roomId}`);
        });
    });

    console.log('✅ WebRTC signaling initialized');
}
