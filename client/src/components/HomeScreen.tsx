import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { Play, Sparkles, Users, Eye } from 'lucide-react';

const AVATARS = ['🦊', '🐱', '🐼', '🦁', '🐵', '🐸', '🦄', '🐙', '🚀', '⚡'];

// Generate or retrieve persistent userToken from localStorage
const getUserToken = (): string => {
  let token = localStorage.getItem('skribbl_user_token');
  if (!token) {
    token = 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('skribbl_user_token', token);
  }
  return token;
};

export const HomeScreen: React.FC = () => {
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('skribbl_player_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  // Check URL params for room code (e.g., ?room=ABCD)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase());
    }
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    localStorage.setItem('skribbl_player_name', playerName.trim());

    socket.emit('create_room', {
      playerName: playerName.trim(),
      avatar: selectedAvatar,
      userToken: getUserToken(),
      settings: {
        maxPlayers: 8,
        rounds: 3,
        drawTime: 60,
        wordCount: 3,
        category: 'all'
      }
    });
  };

  const handleJoinRoom = (e: React.FormEvent, asSpectator: boolean = false) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    localStorage.setItem('skribbl_player_name', playerName.trim());

    socket.emit('join_room', {
      roomId: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      avatar: asSpectator ? '👁️' : selectedAvatar,
      asSpectator,
      userToken: getUserToken()
    });
  };

  const handleQuickPlay = () => {
    if (!playerName.trim()) return;
    localStorage.setItem('skribbl_player_name', playerName.trim());

    socket.emit('join_room', {
      roomId: 'RANDOM',
      playerName: playerName.trim(),
      avatar: selectedAvatar,
      userToken: getUserToken()
    });
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center select-none">
        <div className="text-5xl sm:text-6xl font-black tracking-tight flex items-center drop-shadow-sm font-sans mb-1">
          <span className="text-[#ef4444]">s</span>
          <span className="text-[#f97316]">k</span>
          <span className="text-[#eab308]">r</span>
          <span className="text-[#22c55e]">i</span>
          <span className="text-[#3b82f6]">b</span>
          <span className="text-[#8b5cf6]">b</span>
          <span className="text-[#ec4899]">l</span>
          <span className="text-slate-900">.io</span>
        </div>
        <p className="text-sm font-bold text-slate-500">
          Draw with friends & guess the secret word!
        </p>
      </div>

      {/* Main Form Card - Exact Matching Card & Shadows from Reference */}
      <div className="w-full max-w-md bg-white border-[2.5px] border-[#0f172a] rounded-[36px] p-7 sm:p-9 shadow-[10px_10px_0px_#0f172a]">
        {/* Name input */}
        <div className="mb-6">
          <label className="text-[11px] font-black uppercase text-slate-600 block mb-2 tracking-wider">
            YOUR NICKNAME
          </label>
          <input
            type="text"
            required
            maxLength={16}
            placeholder="e.g. Tony Stark"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-white border-2 border-[#0f172a] rounded-2xl px-4 py-3.5 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Avatar selector */}
        <div className="mb-7">
          <label className="text-[11px] font-black uppercase text-slate-600 block mb-2 tracking-wider">
            CHOOSE AVATAR
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                className={`text-2xl p-2.5 rounded-2xl transition border-2 flex items-center justify-center ${
                  selectedAvatar === av
                    ? 'border-[#0f172a] bg-[#f8fafc] shadow-[3px_3px_0px_#0f172a] scale-105'
                    : 'border-transparent bg-[#f1f5f9] hover:bg-slate-200/70'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons with Bottom-Offset Chunky Shadows */}
        <div className="space-y-3.5">
          <button
            onClick={handleQuickPlay}
            disabled={!playerName.trim()}
            className="w-full py-4 rounded-2xl bg-[#86efac] hover:bg-[#4ade80] text-[#0f172a] font-black text-sm uppercase tracking-wider border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            QUICK PLAY
          </button>

          <button
            onClick={handleCreateRoom}
            disabled={!playerName.trim()}
            className="w-full py-4 rounded-2xl bg-[#c4b5fd] hover:bg-[#a78bfa] text-[#0f172a] font-black text-sm uppercase tracking-wider border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current stroke-[2.5]" />
            CREATE ROOM
          </button>
        </div>

        {/* Join Code with Join & Spectate Options */}
        <div className="mt-7 pt-6 border-t-2 border-slate-100">
          <form onSubmit={(e) => handleJoinRoom(e, false)} className="space-y-3">
            <input
              type="text"
              maxLength={6}
              placeholder="ROOM  CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-white border-2 border-[#0f172a] rounded-2xl px-4 py-3 text-sm font-black font-mono tracking-widest text-center text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!playerName.trim() || !roomCode.trim()}
                className="flex-1 py-3 rounded-2xl bg-[#94a3b8] hover:bg-[#64748b] text-white font-black text-xs uppercase tracking-wider border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <Users className="w-4 h-4" />
                JOIN AS PLAYER
              </button>

              <button
                type="button"
                onClick={(e) => handleJoinRoom(e, true)}
                disabled={!playerName.trim() || !roomCode.trim()}
                className="px-4 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-black text-xs uppercase tracking-wider border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
                title="Watch game without drawing or guessing"
              >
                <Eye className="w-4 h-4 text-sky-700" />
                WATCH ONLY
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
