import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, GameState } from '../types';
import { socket } from '../services/socket';
import { Send, CheckCircle2 } from 'lucide-react';

interface GameSidebarProps {
  state: GameState;
  messages: ChatMessage[];
  isDrawer: boolean;
  hasGuessed: boolean;
  currentUserId: string;
}

export const GameSidebar: React.FC<GameSidebarProps> = ({
  state,
  messages,
  isDrawer,
  hasGuessed,
  currentUserId,
}) => {
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

  // Sort players by score
  const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);

  // Avatar palette colors
  const avatarColors = [
    '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#06b6d4', '#6366f1'
  ];

  return (
    <div className="w-80 h-full flex flex-col gap-3 p-3 bg-white border-l border-slate-200 shrink-0">
      {/* 1. Word Blanks & Hints (Top Box matching reference image) */}
      <div className="p-3 bg-[#f8fafc] border border-slate-200/80 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Word:
          </span>
          <div className="font-mono text-xl font-black tracking-[0.3em] text-slate-900 mt-1">
            {state.phase === 'DRAWING' ? (
              isDrawer ? (
                <span className="text-blue-600 uppercase text-lg tracking-wider">
                  {state.wordToGuess}
                </span>
              ) : (
                state.hints.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-block ${
                      c === '_' ? 'border-b-2 border-slate-800 w-4 text-center' : 'text-slate-900'
                    }`}
                  >
                    {c === '_' ? '' : c}
                  </span>
                ))
              )
            ) : (
              <span className="text-xs text-slate-400 font-sans tracking-normal">Choosing word...</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-500">
            Hints: {state.hints.filter(h => h !== '_' && h !== ' ').length}/3
          </span>
        </div>
      </div>

      {/* 2. Chat Feed (Middle Box matching reference image) */}
      <div className="flex-1 bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-1.5 text-xs pr-1">
          {messages.map((msg) => {
            if (msg.type === 'correct') {
              return (
                <div
                  key={msg.id}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{msg.text}</span>
                </div>
              );
            }

            if (msg.type === 'close') {
              return (
                <div
                  key={msg.id}
                  className="p-1.5 rounded-lg bg-amber-50 text-amber-700 font-semibold"
                >
                  ⚠️ {msg.text}
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

            const isMe = msg.senderId === currentUserId;

            return (
              <div key={msg.id} className="break-words leading-relaxed">
                <span className={`font-bold mr-1.5 ${isMe ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {isMe ? 'You' : msg.senderName}:
                </span>
                <span className="text-slate-700 font-medium">{msg.text}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Field with Blue Paper Airplane Button */}
        <form onSubmit={handleSubmit} className="mt-2 flex gap-1.5 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={state.players.find(p => p.id === currentUserId)?.isSpectator}
            placeholder={
              state.players.find(p => p.id === currentUserId)?.isSpectator
                ? 'Spectating mode (view only)'
                : isDrawer
                ? 'You are drawing!'
                : hasGuessed
                ? 'You guessed it!'
                : 'Type your guess...'
            }
            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || state.players.find(p => p.id === currentUserId)?.isSpectator}
            className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 3. Players Leaderboard (Bottom Box matching reference image) */}
      <div className="p-3 bg-[#f8fafc] border border-slate-200/80 rounded-2xl max-h-48 overflow-y-auto">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
          Players
        </span>
        <div className="space-y-2">
          {sortedPlayers.map((player, idx) => {
            const isMe = player.id === currentUserId;
            const color = avatarColors[idx % avatarColors.length];

            return (
              <div key={player.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Clean circular avatar */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {player.avatar || player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-bold truncate ${isMe ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {isMe ? 'You' : player.name}
                  </span>
                  {player.isSpectator && (
                    <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded-md font-bold">
                      👁️ Spectator
                    </span>
                  )}
                  {player.isHost && (
                    <span className="text-amber-500 text-xs">👑</span>
                  )}
                </div>

                <span className="font-mono font-bold text-slate-700 ml-2">
                  {player.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
