import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, ArrowLeft, RefreshCw, Users, Shield, Flag, Reply, X, Edit2 } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { Button } from './Button';

interface ChatMessage {
    id: string; // or number, kept string for compatibility with some logic
    user_id: number;
    user_name?: string;
    content: string;
    is_anonymous: boolean;
    created_at: string;
    reply_to?: {
        id: string;
        user_name?: string;
        is_anonymous: boolean;
        content: string;
    };
}

interface ChatRoomProps {
    roomId: number;
    roomName: string;
    userId?: number;
    userName: string;
    onLeave: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, roomName, userId, userName, onLeave }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // In production, connect to the same origin (backend serves frontend).
        // In development, use VITE_SOCKET_URL or fall back to localhost:5000.
        const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

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

        const normalizedUserId = typeof userId === 'number' && Number.isFinite(userId) ? userId : null;

        // If editing, we would need an edit endpoint - for now just show the input
        if (editingMessage) {
            setInput('');
            setEditingMessage(null);
            // Note: Edit functionality would require server endpoint
            return;
        }

        const messageData: any = {
            roomId,
            userId: normalizedUserId,
            userName, // Pass userName for non-anonymous messages
            content: input.trim(),
            isAnonymous,
        };

        // Add reply info if replying to a message
        if (replyingTo) {
            messageData.replyTo = {
                id: replyingTo.id,
                userName: replyingTo.user_name,
                isAnonymous: replyingTo.is_anonymous,
                content: replyingTo.content,
            };
        }

        socketRef.current.emit('send_message', messageData);
        setInput('');
        setReplyingTo(null);
    };

    // Touch handlers for swipe gestures
    const handleTouchStart = (e: React.TouchEvent, msg: ChatMessage) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = (e: React.TouchEvent, msg: ChatMessage) => {
        if (!touchStart) return;
        
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const deltaX = touchEnd.x - touchStart.x;
        const deltaY = touchEnd.y - touchStart.y;
        
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const isOwn = typeof userId === 'number' && msg.user_id === userId;
            
            if (deltaX > 0 && !isOwn) {
                // Swipe right on other's message - reply
                setReplyingTo(msg);
            } else if (deltaX < 0 && isOwn) {
                // Swipe left on own message - edit
                setEditingMessage(msg);
                setInput(msg.content);
            }
        }
        
        setTouchStart(null);
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
                    const isOwn = typeof userId === 'number' && msg.user_id === userId;
                    const showHeader = idx === 0 || messages[idx - 1].user_id !== msg.user_id;

                    return (
                        <div 
                            key={idx} 
                            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                            onTouchStart={(e) => handleTouchStart(e, msg)}
                            onTouchEnd={(e) => handleTouchEnd(e, msg)}
                        >
                            {showHeader && (
                                <span className={`text-[10px] text-slate-500 mb-1 px-1 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                                    {isOwn ? 'You' : (msg.is_anonymous ? 'Anonymous' : (msg.user_name || 'User'))}
                                </span>
                            )}
                            <div
                                className={`
                                    max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm relative group
                                    ${isOwn
                                        ? 'bg-unity-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-none'}
                                `}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    const isOwnMsg = typeof userId === 'number' && msg.user_id === userId;
                                    if (isOwnMsg) {
                                        setEditingMessage(msg);
                                        setInput(msg.content);
                                    } else {
                                        setReplyingTo(msg);
                                    }
                                }}
                            >
                                {msg.reply_to && (
                                    <div className={`relative pl-3 border-l-2 ${isOwn ? 'border-unity-400' : 'border-slate-500'} mb-1`}>
                                        <div className={`text-[10px] font-medium ${isOwn ? 'text-unity-200' : 'text-slate-400'} flex items-center gap-1 mb-0.5`}>
                                            <Reply size={10} className="rotate-180" />
                                            <span>
                                                {msg.reply_to.is_anonymous ? 'Anonymous' : (msg.reply_to.user_name || 'User')}
                                            </span>
                                        </div>
                                        <div className={`text-xs ${isOwn ? 'text-unity-100' : 'text-slate-400'} line-clamp-2`}>{msg.reply_to.content}</div>
                                    </div>
                                )}
                                {msg.content}
                                <button
                                    onClick={() => {
                                        const isOwnMsg = typeof userId === 'number' && msg.user_id === userId;
                                        if (isOwnMsg) {
                                            setEditingMessage(msg);
                                            setInput(msg.content);
                                        } else {
                                            setReplyingTo(msg);
                                        }
                                    }}
                                    className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? 'left-full ml-2' : 'right-full mr-2'} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300`}
                                    title={isOwn ? 'Edit' : 'Reply'}
                                >
                                    {isOwn ? <Edit2 size={14} /> : <Reply size={14} />}
                                </button>
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
                {/* Reply Preview */}
                {replyingTo && (
                    <div className="flex items-center justify-between mb-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Reply size={14} className="text-unity-500 flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="text-xs text-slate-400">
                                    Replying to <span className="font-medium text-slate-300">{replyingTo.is_anonymous ? 'Anonymous' : (replyingTo.user_name || 'User')}</span>
                                </div>
                                <div className="text-xs text-slate-500 truncate">{replyingTo.content}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                {/* Edit Preview */}
                {editingMessage && (
                    <div className="flex items-center justify-between mb-2 px-3 py-2 bg-slate-800 rounded-lg border border-unity-500">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Edit2 size={14} className="text-unity-500 flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="text-xs text-slate-400">
                                    Editing your message
                                </div>
                                <div className="text-xs text-slate-500 truncate">{editingMessage.content}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setEditingMessage(null);
                                setInput('');
                            }}
                            className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
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
