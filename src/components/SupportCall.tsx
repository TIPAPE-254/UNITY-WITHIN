import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Phone, Video, PhoneOff, AlertCircle, Copy } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface SupportCallProps {
  roomId: string;
  mode: 'voice' | 'video';
}

export const SupportCall: React.FC<SupportCallProps> = ({ roomId, mode }) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'ended' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shareLink, setShareLink] = useState<string>('');
  const userId = useMemo(() => `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,[ ]);

  useEffect(() => {
    setShareLink(`${window.location.origin}/support-call/${roomId}?mode=${mode}`);
  }, [roomId, mode]);

  useEffect(() => {
    let localStream: MediaStream | null = null;

    const startCall = async () => {
      try {
        const mediaConstraints = {
          audio: true,
          video: mode === 'video',
        };

        localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerConnectionRef.current = peerConnection;

        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream as MediaStream);
        });

        peerConnection.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit('ice-candidate', {
              roomId,
              candidate: event.candidate,
              fromUserId: userId,
              toUserId: 'peer',
            });
          }
        };

        const socket = io(window.location.origin, {
          path: '/socket.io',
          transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join-call', { roomId, userId });
        });

        socket.on('call-joined', async ({ participants }) => {
          if (participants?.length > 1) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('offer', {
              roomId,
              offer,
              fromUserId: userId,
              toUserId: 'peer',
            });
            setStatus('connected');
          }
        });

        socket.on('participant-joined', async () => {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit('offer', {
            roomId,
            offer,
            fromUserId: userId,
            toUserId: 'peer',
          });
          setStatus('connected');
        });

        socket.on('offer', async ({ offer }) => {
          if (!offer) return;
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit('answer', {
            roomId,
            answer,
            fromUserId: userId,
            toUserId: 'peer',
          });
          setStatus('connected');
        });

        socket.on('answer', async ({ answer }) => {
          if (!answer) return;
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          setStatus('connected');
        });

        socket.on('ice-candidate', async ({ candidate }) => {
          if (!candidate) return;
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('ICE candidate error:', error);
          }
        });

        socket.on('call-error', ({ error }) => {
          setStatus('error');
          setErrorMessage(error || 'Call error');
        });
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unable to start call');
      }
    };

    startCall();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('call-end', { roomId, userId });
        socketRef.current.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, mode, userId]);

  const handleEndCall = () => {
    setStatus('ended');
    if (socketRef.current) {
      socketRef.current.emit('call-end', { roomId, userId });
      socketRef.current.disconnect();
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Peer Support Call</h1>
              <p className="text-sm text-gray-600">Room: {roomId}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors flex items-center gap-2"
              >
                <Copy size={16} />
                Copy Link
              </button>
              <button
                onClick={handleEndCall}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <PhoneOff size={16} />
                End Call
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">You</p>
              {mode === 'video' ? (
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Phone size={32} />
                  <p className="mt-2">Voice call active</p>
                </div>
              )}
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-2">Peer</p>
              {mode === 'video' ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Phone size={32} />
                  <p className="mt-2">Waiting for peer</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm text-gray-600">
            {mode === 'video' ? <Video size={16} /> : <Phone size={16} />}
            <span>Status: {status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
