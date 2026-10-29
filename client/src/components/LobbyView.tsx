import React, { useState } from 'react';
import type { RoomSettings, Player } from '../types';
import { socket } from '../services/socket';
import { Copy, Check, Play, UserPlus, Link } from 'lucide-react';

interface LobbyViewProps {
  roomId: string;
  isHost: boolean;
  settings: RoomSettings;
  players: Player[];
  currentUserId: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomId,
  isHost,
  settings,
  players,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [rounds, setRounds] = useState(settings.rounds || 3);
  const [drawTime, setDrawTime] = useState(settings.drawTime || 60);
  const [wordCount, setWordCount] = useState(settings.wordCount || 3);
  const [category, setCategory] = useState(settings.category || 'all');

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  // Max slots to show (e.g. 6 slots like the reference UI)
  const totalSlots = Math.max(players.length + 1, 4);
  const emptySlotsCount = Math.max(0, totalSlots - players.length);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-4 py-8">
      {/* Top Tag */}
      <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wider uppercase mb-3 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        GAME LOBBY
      </div>

      {/* Main Heading */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center tracking-tight mb-1">
        Waiting for Players
      </h1>
      <p className="text-sm font-medium text-slate-500 text-center mb-8">
        Everyone needs to be in the room before the game can start
      </p>

      {/* Room Code Card (Exact style like reference image 1) */}
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
            ROOM CODE
          </span>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-widest font-mono">
            {roomId}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold border border-slate-300 transition active:scale-95"
            title="Copy Invite Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Link className="w-4 h-4" />}
            {copiedLink ? 'Link Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/25 transition active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Code Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>

      {/* Players Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-slate-800">Players</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            {players.length} joined
          </span>
        </div>

        {/* Quick Settings preview for host */}
        {isHost && (
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            <label className="flex items-center gap-1">
              Rounds:
              <select
                value={rounds}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRounds(val);
                  socket.emit('update_settings', { settings: { rounds: val } });
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
              >
                {[1, 2, 3, 4, 5, 8, 10].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1">
              Draw Time:
              <select
                value={drawTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDrawTime(val);
                  socket.emit('update_settings', { settings: { drawTime: val } });
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
              >
                {[15, 30, 45, 60, 80, 90, 120, 150, 180, 240].map(t => (
                  <option key={t} value={t}>{t}s</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1">
              Word Count:
              <select
                value={wordCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setWordCount(val);
                  socket.emit('update_settings', { settings: { wordCount: val } });
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
              >
                {[1, 2, 3, 4, 5].map(wc => (
                  <option key={wc} value={wc}>{wc} words</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1">
              Category:
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  socket.emit('update_settings', { settings: { category: val } });
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
              >
                <option value="all">All Categories</option>
                <option value="animals">Animals 🦁</option>
                <option value="food">Food & Drinks 🍕</option>
                <option value="objects">Objects & Items 🎸</option>
                <option value="nature">Nature 🌲</option>
                <option value="actions_and_places">Actions & Places 🏰</option>
                <option value="pop_and_fun">Fun & Pop Culture 🚀</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Player Cards Grid (Image 1 Style: rounded cards with avatars, host crown, ready badges) */}
      <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {players.map((player) => (
          <div
            key={player.id}
            className={`relative flex flex-col items-center justify-center p-5 rounded-3xl bg-white border-2 transition shadow-sm ${
              player.isHost 
                ? 'border-indigo-300 bg-indigo-50/20' 
                : 'border-slate-200'
            }`}
          >
            {/* YOU or HOST badge */}
            {player.isHost && (
              <span className="absolute top-2.5 left-3 text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                HOST 👑
              </span>
            )}

            {/* Avatar Circle */}
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shadow-inner my-2">
              {player.avatar || '🦊'}
            </div>

            {/* Name */}
            <span className="font-extrabold text-sm text-slate-800 text-center truncate w-full px-1">
              {player.name}
            </span>

            {/* Ready Badge */}
            <div className="mt-3 w-full py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Ready!
            </div>
          </div>
        ))}

        {/* Empty Slot Placeholders (Image 1 Style) */}
        {Array.from({ length: emptySlotsCount }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/60 min-h-[170px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-400 mb-2">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400">Empty slot</span>
          </div>
        ))}
      </div>

      {/* Start Button / Waiting Banner */}
      <div className="w-full max-w-sm">
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-extrabold text-base shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current" />
            {players.length < 2 ? 'Need 2+ players to start' : 'Start Game!'}
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm text-center shadow-sm">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
};
