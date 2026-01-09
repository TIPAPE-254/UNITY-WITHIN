import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Button } from './Button';
import { Send, User, Bot, AlertTriangle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello. I'm Unity. I'm here to listen without judgment. How are you holding up today?",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/buddie/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.text,
          // We could send userId here if we had it in context
        }),
      });

      const data = await response.json();

      const botMsgId = (Date.now() + 1).toString();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            role: 'model',
            text: data.message || "I'm listening...",
          },
        ]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }

    } catch (error) {
      console.error("Chat error", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: "I'm having a little trouble connecting right now. Let's try again in a moment.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    // Inject ElevenLabs script
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed@beta";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl shadow-sm border border-unity-50 overflow-hidden relative">
      {/* Disclaimer Header */}
      <div className="bg-unity-50 px-4 py-2 text-xs text-unity-800 flex items-center justify-center gap-2 border-b border-unity-100">
        <AlertTriangle size={14} />
        <span>I am an AI assistant. If you are in crisis, please call emergency services (1199 in Kenya).</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 group animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${msg.role === 'user'
              ? 'bg-unity-500 text-white shadow-sm'
              : 'bg-white border border-gray-100 text-unity-400'
              }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
            </div>

            <div className="space-y-1 max-w-[85%]">
              <div
                className={`rounded-2xl px-5 py-3 text-sm sm:text-base leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user'
                  ? 'bg-unity-500 text-white rounded-tr-sm'
                  : 'bg-white text-unity-800 rounded-tl-sm border border-unity-50'
                  } ${msg.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 text-unity-400 flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 border border-unity-50 flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-unity-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-unity-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-unity-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-unity-50">
        {/* 4. Gentle Posting Prompt (Label/Hint) */}
        {!input && messages.length > 1 && (
          <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none animate-in fade-in slide-in-from-bottom-2">
            <span className="text-xs text-gray-400 bg-white/90 px-3 py-1 rounded-full shadow-sm border border-gray-100">
              It’s okay if the words come slowly.
            </span>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:border-unity-300 focus-within:ring-2 focus-within:ring-unity-100 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your thoughts here..."
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