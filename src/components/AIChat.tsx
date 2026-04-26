import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Phone, ShieldAlert, Heart, MessageCircle } from 'lucide-react';
import { generateResponse } from '../services/geminiService';
import { Button } from './Button';
import { useUser } from '../contexts/UserContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

type ChatMode = 'vent' | 'reframe' | 'calm' | 'affirm';

export const AIChat: React.FC = () => {
  const { logToolUse } = useUser();
  const [mode, setMode] = useState<ChatMode>('vent');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm Buddie, your AI companion. I'm here to listen, validate, and support you. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    const crisisKeywords = ['suicide', 'self-harm', 'kill myself', 'end my life', 'harm myself', 'hurt myself'];
    const hasCrisisIntent = crisisKeywords.some(keyword => inputText.toLowerCase().includes(keyword));

    if (hasCrisisIntent) {
      const crisisWarning: Message = {
        id: 'crisis-' + Date.now(),
        text: "I'm concerned about what you're saying. You matter, and help is available. Please reach out to a professional who can support you. Call or text 988 (US/Canada) or contact your local emergency services right now.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, crisisWarning]);
      setInputText('');
      logToolUse('crisis_chat');
      return;
    }

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    logToolUse(`chat_${mode}`);

    try {
      const botResponseText = await generateResponse(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] bg-white rounded-[32px] shadow-sm border border-pink-100 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <header className="p-6 border-b border-pink-50 flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-pink-50/50 to-white gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 shadow-sm shadow-pink-100">
            <Bot size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Chat with <span className="text-pink-500">Buddie</span></h1>
            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">AI Companion • Always Listening</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
           {(['vent', 'reframe', 'calm', 'affirm'] as ChatMode[]).map(m => (
             <button
               key={m}
               onClick={() => setMode(m)}
               className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${
                 mode === m ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               {m}
             </button>
           ))}
        </div>
      </header>

      {/* Clinical Disclaimer Bar */}
      <div className="bg-pink-50 py-2 px-6 flex justify-center items-center gap-3 border-b border-pink-100">
          <ShieldAlert size={14} className="text-pink-600" />
          <p className="text-[9px] font-black text-pink-600 uppercase tracking-[0.15em]">
            Buddie is an AI companion, not a clinical therapist • For danger, dial 988
          </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                message.sender === 'user' ? 'bg-pink-500 text-white' : 'bg-white text-pink-600 border border-pink-100'
              }`}>
                {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-[20px] shadow-sm ${
                message.sender === 'user' 
                  ? 'bg-pink-500 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-pink-100 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <p className={`text-[10px] mt-2 opacity-60 font-bold ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-pink-600 border border-pink-100 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-pink-100 p-4 rounded-[20px] rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <footer className="p-6 bg-white border-t border-pink-50">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Share what's on your mind..."
              className="w-full bg-gray-50 border border-pink-100 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all resize-none max-h-32 min-h-12"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim() || isTyping}
              className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${
                inputText.trim() && !isTyping ? 'bg-pink-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
          <div className="hidden sm:flex gap-2">
              <button className="p-3 bg-pink-50 text-pink-500 rounded-2xl hover:bg-pink-100 transition-colors">
                  <Heart size={20} />
              </button>
              <button className="p-3 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-100 transition-colors">
                  <Sparkles size={20} />
              </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-[0.2em] font-black">
            Unity Buddie is here to listen, not to replace professional therapy.
        </p>
      </footer>
    </div>
  );
};
