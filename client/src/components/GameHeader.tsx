import React from 'react';
import type { GameState } from '../types';
import { Copy, Clock, Users, Pencil, Check, LogOut } from 'lucide-react';

interface GameHeaderProps {
  state: GameState;
  isDrawer: boolean;
  secretWord: string;
  currentPlayerName?: string;
  currentPlayerAvatar?: string;
  onLeaveClick?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ 
  state, 
  isDrawer, 
  secretWord, 
  currentPlayerName,
  currentPlayerAvatar,
  onLeaveClick 
}) => {
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
    <header className="w-full bg-[#0b172a] text-white px-3 sm:px-6 py-2 flex items-center justify-between shadow-md shrink-0 border-b border-slate-800 gap-2">
      {/* Left: skribbl.io Logo + Room Code */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Colorful skribbl.io logo */}
        <div className="text-lg sm:text-2xl font-black tracking-tight select-none flex items-center">
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
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-[11px] sm:text-xs font-bold text-slate-200 transition active:scale-95"
          title="Copy Room Code"
        >
          <span><strong className="font-mono text-white">{state.roomId}</strong></span>
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
        </button>
      </div>

      {/* Center: Turn Status + Progress Bar + Timer */}
      <div className="flex flex-col items-center flex-1 max-w-[200px] sm:max-w-sm mx-1">
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold mb-1 w-full justify-center">
          {/* Status text */}
          <div className="flex items-center gap-1 text-slate-200 truncate">
            {isDrawer ? (
              <>
                <Pencil className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{secretWord ? secretWord.toUpperCase() : 'Drawing'}</span>
              </>
            ) : (
              <span className="truncate">{state.drawerName || 'Player'}</span>
            )}
          </div>

          {/* Clock timer */}
          <div className="flex items-center gap-0.5 text-slate-200 font-mono shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatTime(state.timer)}</span>
          </div>
        </div>

        {/* Green / Cyan Progress Bar */}
        <div className="w-full h-1 sm:h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-emerald-400 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Right: Current Player Identity + Player count badge + Exit/Leave Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Active Player Name Pill */}
        {currentPlayerName && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-black shadow-sm">
            <span className="text-sm">{currentPlayerAvatar || '🦊'}</span>
            <span className="truncate max-w-[80px] sm:max-w-[120px] text-white font-extrabold">{currentPlayerName}</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1 rounded hidden sm:inline">YOU</span>
          </div>
        )}

        <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-[11px] sm:text-xs font-bold text-slate-200">
          <Users className="w-3 h-3 text-slate-400" />
          <span>{state.players.length}<span className="hidden sm:inline">/{state.settings.maxPlayers || 8}</span></span>
        </div>

        {onLeaveClick && (
          <button
            onClick={onLeaveClick}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] sm:text-xs font-bold transition active:scale-95"
            title="Leave / Exit Room"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        )}
      </div>
    </header>
  );
};
