import React from 'react';
import type { GameState } from '../types';
import { Copy, Clock, Users, Pencil, Check } from 'lucide-react';

interface GameHeaderProps {
  state: GameState;
  isDrawer: boolean;
  secretWord: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ state, isDrawer, secretWord }) => {
  const [copied, setCopied] = React.useState(false);

  const copyRoom = () => {
    navigator.clipboard.writeText(state.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert timer seconds to mm:ss format like in the image (e.g. 01:42)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress percentage of draw time
  const maxTime = state.settings.drawTime || 60;
  const progressPercent = Math.min(100, Math.max(0, (state.timer / maxTime) * 100));

  return (
    <header className="w-full bg-[#0b172a] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-md shrink-0 border-b border-slate-800">
      {/* Left: skribbl.io Logo + Room Code */}
      <div className="flex items-center gap-3">
        {/* Colorful skribbl.io logo */}
        <div className="text-xl sm:text-2xl font-black tracking-tight select-none flex items-center">
          <span className="text-[#ef4444]">s</span>
          <span className="text-[#f97316]">k</span>
          <span className="text-[#eab308]">r</span>
          <span className="text-[#22c55e]">i</span>
          <span className="text-[#3b82f6]">b</span>
          <span className="text-[#8b5cf6]">b</span>
          <span className="text-[#ec4899]">l</span>
          <span className="text-white">.io</span>
        </div>

        {/* Room pill */}
        <button
          onClick={copyRoom}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 transition active:scale-95"
          title="Copy Room Code"
        >
          <span>Room: <strong className="font-mono text-white">{state.roomId}</strong></span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      </div>

      {/* Center: Turn Status + Progress Bar + Timer */}
      <div className="flex flex-col items-center max-w-sm w-full mx-4">
        <div className="flex items-center gap-4 text-xs font-bold mb-1">
          {/* Status text */}
          <div className="flex items-center gap-1.5 text-slate-200">
            {isDrawer ? (
              <>
                <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                <span>You are drawing! {secretWord ? `(${secretWord.toUpperCase()})` : ''}</span>
              </>
            ) : (
              <span>{state.drawerName || 'Player'} is drawing</span>
            )}
          </div>

          {/* Clock timer */}
          <div className="flex items-center gap-1 text-slate-200 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTime(state.timer)}</span>
          </div>
        </div>

        {/* Green / Cyan Progress Bar */}
        <div className="w-48 sm:w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-emerald-400 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Right: Player count badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-slate-200">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{state.players.length} / {state.settings.maxPlayers || 8} Players</span>
        </div>
      </div>
    </header>
  );
};
