import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, ArrowLeft, RefreshCw, Users, Shield, Flag } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { Button } from './Button';

interface ChatMessage {
    id: string; // or number, kept string for compatibility with some logic
    user_id: number;
    user_name?: string;
    content: string;
    is_anonymous: boolean;
    created_at: string;
}

interface ChatRoomProps {
    roomId: number;
    roomName: string;
    userId: number;
    userName: string;
    onLeave: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, roomName, userId, userName, onLeave }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to Socket.io
        // Assuming backend is on port 5000, different from Vite's 5173
        // If we want to use relative path in production, we might need configuration.
        // For local dev with separate ports:
        const socketUrl = 'http://localhost:5000';

        socketRef.current = io(socketUrl);

        socketRef.current.emit('join_room', roomId);

        socketRef.current.on('receive_message', (message: any) => {
            // Check if message belongs to this room (safety)
            if (parseInt(message.room_id) === roomId) {
                setMessages(prev => [...prev, message]);
            }
        });

        socketRef.current.on('message_rejected', (data: any) => {
            if (data.isCrisis) {
                alert(`CRISIS INTERVENTION:\n\n${data.reason}`);
            } else {
                alert(`Not Sent: ${data.reason}`);
            }
        });

        // Load initial history
        fetchHistory();

        return () => {
            socketRef.current?.disconnect();
        };
    }, [roomId]);

    const fetchHistory = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/messages`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.data);
            }
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!input.trim() || !socketRef.current) return;

        const messageData = {
            roomId,
            userId,
            userName, // Pass userName for non-anonymous messages
            content: input.trim(),
            isAnonymous,
        };

        socketRef.current.emit('send_message', messageData);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[600px] max-w-4xl mx-auto bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-800">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onLeave}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                            {roomName}
                            <span className="text-xs font-normal px-2 py-0.5 bg-green-900/30 text-green-400 border border-green-900 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400"> specific guidelines: be kind & respectful.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-400 hover:bg-slate-800">
                        <Flag size={16} />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                {isLoading && (
                    <div className="flex justify-center p-4">
                        <RefreshCw className="animate-spin text-slate-600" />
                    </div>
                )}

                {messages.length === 0 && !isLoading && (
                    <div className="text-center text-slate-600 py-10 opacity-60">
                        <Shield size={48} className="mx-auto mb-2 opacity-50" />
                        <p>This is a safe space.</p>
                        <p className="text-sm">Start the conversation gently.</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isOwn = msg.user_id === userId;
                    const showHeader = idx === 0 || messages[idx - 1].user_id !== msg.user_id;

                    return (
                        <div key={idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            {showHeader && (
                                <span className={`text-[10px] text-slate-500 mb-1 px-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                                    {isOwn ? 'You' : (msg.is_anonymous ? 'Anonymous' : (msg.user_name || 'User'))}
                                </span>
                            )}
                            <div
                                className={`
                                    max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm
                                    ${isOwn
                                        ? 'bg-unity-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-none'}
                                `}
                            >
                                {msg.content}
                            </div>
                            <span className="text-[9px] text-slate-600 mt-0.5 px-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2 px-1">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none hover:text-slate-300">
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="rounded bg-slate-800 text-unity-500 focus:ring-offset-slate-900 focus:ring-unity-500 border-slate-700"
                        />
                        <span>Send anonymously</span>
                    </label>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message #${roomName.toLowerCase().replace(/\s/g, '-')}`}
                        className="flex-1 rounded-full bg-slate-800 border-slate-700 text-slate-200 px-4 py-2 focus:outline-none focus:border-unity-500 focus:ring-1 focus:ring-unity-500 transition-all text-sm placeholder-slate-500"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!input.trim()}
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 bg-unity-600 hover:bg-unity-500"
                    >
                        <Send size={18} className="ml-0.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
