import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { socket } from '../services/socket';
import { ArrowRight } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  isDrawer: boolean;
  hasGuessed: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, isDrawer, hasGuessed }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    socket.emit('send_chat', { text: input });
    setInput('');
  };

  const getPlaceholder = () => {
    if (isDrawer) return "You are drawing! Chat here...";
    if (hasGuessed) return "You guessed it! Chat with others...";
    return "Type your guess here...";
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Messages Feed Box (Image 3 Bottom-Right Card) */}
      <div className="w-full bg-white border-2 border-slate-900 rounded-3xl p-4 shadow-[4px_4px_0px_#0f172a] h-[260px] overflow-y-auto space-y-2 text-xs">
        {messages.map((msg) => {
          if (msg.type === 'correct') {
            return (
              <div
                key={msg.id}
                className="text-emerald-600 font-extrabold flex items-center gap-1.5 py-1"
              >
                <span>{msg.text} 😎</span>
              </div>
            );
          }

          if (msg.type === 'close') {
            return (
              <div
                key={msg.id}
                className="text-amber-600 font-extrabold py-0.5"
              >
                <span>⚠️ {msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="text-center py-1 text-[11px] font-bold text-slate-400">
                {msg.text}
              </div>
            );
          }

          // Regular player message (e.g. "ironman: dragon")
          return (
            <div key={msg.id} className="break-words leading-relaxed py-0.5">
              <span className="font-extrabold text-slate-800 mr-1.5">{msg.senderName}:</span>
              <span className="text-slate-600 font-medium">{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Pill Form (Exact Match with Image 3 Bottom Input with Purple Arrow Button) */}
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center bg-white border-2 border-slate-900 rounded-full pl-5 pr-1.5 py-1.5 shadow-[4px_4px_0px_#0f172a] focus-within:ring-2 focus-within:ring-indigo-500"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getPlaceholder()}
          className="flex-1 bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 border-2 border-slate-900 transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};
