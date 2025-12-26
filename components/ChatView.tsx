import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatViewProps {
  context: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "I've analyzed the lecture. Ask me anything about the content!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    chatSessionRef.current = createChatSession(context);
    // Reset chat on new context (optional, based on UX preference)
    // setMessages([{ id: 'welcome', role: 'model', text: '...', timestamp: new Date() }]);
  }, [context]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession(context);
      }

      const result = await chatSessionRef.current.sendMessageStream({ message: input });
      
      const botMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        text: '', 
        timestamp: new Date()
      }]);

      let fullText = '';
      for await (const chunk of result) {
         const chunkText = chunk.text || '';
         fullText += chunkText;
         setMessages(prev => prev.map(msg => 
            msg.id === botMessageId ? { ...msg, text: fullText } : msg
         ));
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'model',
      text: "Chat cleared. What else would you like to know?",
      timestamp: new Date()
    }]);
    chatSessionRef.current = createChatSession(context);
  };

  return (
    <div className="h-[75vh] flex flex-col relative max-w-4xl mx-auto pb-4">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scroll-smooth custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] px-6 py-4 rounded-[22px] backdrop-blur-xl shadow-sm text-lg font-light leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'glass-panel text-slate-100 rounded-bl-sm border border-white/10'
                }
              `}>
                 {msg.role === 'model' ? (
                   <div className="prose prose-invert prose-p:my-0 max-w-none prose-ul:my-2 prose-li:my-0">
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                   </div>
                 ) : (
                   <p>{msg.text}</p>
                 )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-slate-500 ml-4 p-2"
          >
            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pt-2 relative z-20">
        <form onSubmit={handleSubmit} className="relative flex items-center shadow-2xl rounded-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the lecture..."
            className="w-full pl-6 pr-24 py-4 bg-[#1a1a1e] border border-white/10 rounded-full focus:outline-none focus:bg-[#202025] focus:border-white/20 text-white placeholder-slate-500 transition-all font-light text-lg"
          />
          
          <div className="absolute right-2 flex items-center gap-2">
             {messages.length > 2 && !isLoading && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 size={18} />
                </button>
             )}
             
             <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-0 disabled:scale-75 transition-all duration-300"
              >
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};