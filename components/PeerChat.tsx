import React, { useState, useEffect, useRef } from 'react';
import { Users, AlertTriangle, Send, User, Bot, RefreshCw, X, Reply } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { Button } from './Button';

interface ChatMessage {
    id: string;
    role: 'user' | 'peer';
    text: string;
    created_at: string;
    user_id: number;
    reply_to?: {
        text: string;
        user_id: number;
    };
}

interface PeerChatProps {
    userId?: number;
}

const MessageBubble: React.FC<{
    msg: ChatMessage;
    isOwn: boolean;
    onSwipeReply: (msg: ChatMessage) => void
}> = ({ msg, isOwn, onSwipeReply }) => {
    const [startX, setStartX] = useState<number | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Touch Handlers
        const handleTouchStart = (e: React.TouchEvent) => {
            setStartX(e.touches[0].clientX);
        };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        if (diff > 0 && diff < 100) setOffsetX(diff);
    };

    const handleTouchEnd = () => {
        if (offsetX > 60) onSwipeReply(msg);
        setOffsetX(0);
        setStartX(null);
    };

    // Mouse Handlers (for Desktop Swipe)
    const handleMouseDown = (e: React.MouseEvent) => {
        setStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (startX === null) return;
        const diff = e.clientX - startX;
        if (diff > 0 && diff < 100) setOffsetX(diff);
    };

    const handleMouseUp = () => {
        if (offsetX > 60) onSwipeReply(msg);
        setOffsetX(0);
        setStartX(null);
    };

    return (
        <div
            className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'} relative overflow-hidden group`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setOffsetX(0); setStartX(null); setIsHovered(false); }}
            onMouseEnter={() => setIsHovered(true)}
        >
            {/* Reply Icon Indicator behind the message (Swipe) */}
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 transition-opacity duration-200"
                style={{ opacity: offsetX > 20 ? 1 : 0, transform: `translateX(${offsetX > 60 ? 10 : -20}px)` }}
            >
                <Reply size={20} />
            </div>

            {/* Desktop Reply Button (Hover) */}
            {isHovered && !isOwn && offsetX === 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onSwipeReply(msg); }}
                    className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 bg-gray-100 rounded-full text-gray-500 hover:text-unity-600 hover:bg-unity-50 transition-all shadow-sm opacity-0 group-hover:opacity-100 group-hover:right-2 z-20"
                    title="Reply"
                >
                    <Reply size={14} />
                </button>
            )}

            <div
                className={`
                    message-content max-w-[80%] rounded-2xl p-4 shadow-sm relative transition-transform duration-200 ease-out select-none cursor-grab active:cursor-grabbing
                    ${isOwn ? 'bg-unity-100 text-unity-900 rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}
                `}
                style={{ transform: `translateX(${offsetX}px)` }}
            >
                {/* Quoted Reply */}
                    {msg.reply_to && (
                        <div className="text-xs bg-gray-100 rounded px-2 py-1 mb-1 max-w-xs text-gray-600 border-l-4 border-unity-300 cursor-pointer"
                            onClick={() => {
                                // Optional: scroll to original message if implemented
                            }}
                        >
                            <span className="font-semibold">Replied to:</span> {msg.reply_to.text.length > 40 ? msg.reply_to.text.slice(0, 40) + '...' : msg.reply_to.text}
                        </div>
                    )}

                <p className="leading-relaxed text-sm sm:text-base">{msg.text}</p>
                <div className="flex items-center justify-end gap-2 mt-1 opacity-50">
                    <span className="text-[10px] uppercase tracking-wider font-medium">
                        {isOwn ? 'You' : 'Peer'}
                    </span>
                    <span className="text-[10px]">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const PeerChat: React.FC<PeerChatProps> = ({ userId }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Poll for new messages every 1 second
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 1000);
        return () => clearInterval(interval);
    }, [userId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/messages`, { cache: 'no-store' });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const mapped: ChatMessage[] = result.data.map((m: any) => ({
                        id: m.id.toString(),
                        role: m.user_id === userId ? 'user' : 'peer',
                        text: m.content,
                        created_at: m.created_at,
                        user_id: m.user_id,
                        reply_to: m.reply_content ? {
                            text: m.reply_content,
                            user_id: m.reply_user_id
                        } : undefined
                    }));
                    setMessages(mapped);
                }
            }
        } catch (error) {
            console.error("Poll error", error);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const text = input;
        setInput('');
        const replyId = replyingTo?.id;
        setReplyingTo(null); // Clear reply state immediately

        // Optimistic update
        const tempMsg: ChatMessage = {
            id: 'temp-' + Date.now(),
            role: 'user',
            text: text,
            created_at: new Date().toISOString(),
            user_id: userId || 0,
            reply_to: replyId ? { text: replyingTo!.text, user_id: replyingTo!.user_id } : undefined
        };
        setMessages(prev => [...prev, tempMsg]);

        setIsLoading(true);
        try {
            await fetch(`${API_BASE_URL}/chat/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    content: text,
                    replyToId: replyId
                })
            });
            fetchMessages();
        } catch (error) {
            console.error("Send error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwipeReply = (msg: ChatMessage) => {
        setReplyingTo(msg);
        const tag = msg.user_id === userId ? '@You ' : '@Peer ';
        // Only add tag if not already there
        setInput(prev => prev.startsWith(tag) ? prev : tag + prev);

        // Focus input (optional, but good UX)
        // Note: focusing programmatically on mobile might bring up keyboard unwantedly if just browsing
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] md:h-[600px] max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-unity-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-unity-100 rounded-full text-unity-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">Community</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-xs text-gray-500 font-medium">Anonymous Peer Support</span>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-gray-400 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 hidden sm:block">
                    Swipe message right to reply
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 relative">
                {/* Empty State */}
                {messages.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center opacity-60">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Send size={24} className="ml-1 text-gray-300" />
                        </div>
                        <p>Be the first to share your thoughts.</p>
                        <p className="text-sm mt-2">Swipe any message to reply.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isOwn={msg.user_id === userId}
                        onSwipeReply={handleSwipeReply}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 relative z-10">
                {/* Reply Banner */}
                {replyingTo && (
                    <div className="flex items-center justify-between bg-gray-50 border-l-4 border-unity-400 rounded-r-lg p-3 mb-3 animate-in slide-in-from-bottom-2">
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-unity-600 mb-0.5">
                                Replying to {replyingTo.user_id === userId ? 'Yourself' : 'Peer'}
                            </p>
                            <p className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-md">
                                {replyingTo.text}
                            </p>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:border-unity-300 focus-within:ring-2 focus-within:ring-unity-100 transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={replyingTo ? "Type your reply..." : "Type your thoughts here..."}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2 px-2 text-unity-black placeholder-gray-400"
                        rows={1}
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 rounded-full p-0 flex-shrink-0 mb-1"
                    >
                        {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
