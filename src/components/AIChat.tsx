import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';
import { Button } from './Button';
import { Send, User, Bot, AlertTriangle, RefreshCw } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';

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
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const resultStream = await chatSessionRef.current.sendMessageStream({
        message: userMsg.text,
      });

      let fullResponseText = '';
      const botMsgId = (Date.now() + 1).toString();

      // Add a placeholder message for streaming
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: 'model', text: '' },
      ]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullResponseText += text;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, text: fullResponseText } : msg
          )
        );
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl shadow-sm border border-unity-50 overflow-hidden">
      {/* Disclaimer Header */}
      <div className="bg-unity-50 px-4 py-2 text-xs text-unity-800 flex items-center justify-center gap-2 border-b border-unity-100">
        <AlertTriangle size={14} />
        <span>I am an AI, not a doctor. If you are in crisis, please call emergency services (988 in US).</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-unity-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
                {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-unity-500 text-white rounded-tr-sm'
                  : 'bg-gray-50 text-unity-black rounded-tl-sm border border-gray-100'
              } ${msg.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length -1]?.role === 'user' && (
           <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
             </div>
             <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 flex items-center gap-1">
                <div className="w-2 h-2 bg-unity-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-unity-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-unity-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-unity-100">
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