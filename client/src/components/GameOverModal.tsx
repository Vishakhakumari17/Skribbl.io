import React, { useEffect } from 'react';
import type { Player } from '../types';
import confetti from 'canvas-confetti';
import { socket } from '../services/socket';
import { Trophy, Award, RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  winner: Player | null;
  leaderboard: Player[];
  isHost: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ winner, leaderboard, isHost }) => {
  useEffect(() => {
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6']
    });
  }, []);

  const handlePlayAgain = () => {
    socket.emit('start_game');
  };

  const getRankBadgeColor = (idx: number) => {
    if (idx === 0) return 'bg-[#f59e0b] text-slate-950';
    if (idx === 1) return 'bg-[#3b82f6] text-white';
    if (idx === 2) return 'bg-[#0ea5e9] text-white';
    return 'bg-slate-700 text-slate-300';
  };

  const getRankTitle = (idx: number) => {
    if (idx === 0) return 'Champion';
    if (idx === 1) return 'Runner-up';
    if (idx === 2) return '3rd Place';
    return `${idx + 1}th Place`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070d18]/85 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
      {/* Outer Card Container */}
      <div className="w-full max-w-4xl bg-[#0e1d38] border border-blue-900/40 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden text-white flex flex-col md:flex-row p-6 md:p-8 gap-6 md:gap-8">
        
        {/* Left Section: Winner Highlight & Sleek 3D Podium */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* MATCH CONCLUDED PILL */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider mb-4">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              MATCH CONCLUDED
            </div>

            {/* WINNER TITLE */}
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase text-white font-fun">
                WINNER - <span className="text-[#f59e0b]">{winner?.name || 'CHAMPION'}</span>
              </h2>
              <span className="text-3xl sm:text-4xl animate-bounce">👑</span>
            </div>
            
            <p className="text-sm font-medium text-slate-400">
              Outstanding game! Here are the podium finishers.
            </p>
          </div>

          {/* Glowing 3D Glass Podium Section */}
          <div className="my-8 flex items-end justify-center gap-4 sm:gap-6 min-h-[220px]">
            {/* 2nd Place (Silver) */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center">
                {/* Avatar Box with Glow */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 border border-sky-300/60 shadow-[0_4px_20px_rgba(56,189,248,0.35)] flex items-center justify-center text-3xl mb-2 transition hover:scale-105">
                  {leaderboard[1].avatar || '🥈'}
                </div>

                <span className="text-xs font-black text-white truncate max-w-[85px] text-center mb-0.5">
                  {leaderboard[1].name}
                </span>
                <span className="text-[10px] font-bold text-sky-300/80 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-500/20 mb-2">
                  {leaderboard[1].score.toLocaleString()} pts
                </span>

                {/* Silver Pillar */}
                <div className="w-24 sm:w-28 h-28 bg-gradient-to-b from-[#38bdf8] to-[#1d4ed8] rounded-t-2xl border-t-2 border-x-2 border-sky-200/50 flex flex-col items-center justify-start pt-3 shadow-[0_10px_30px_rgba(30,58,138,0.5)]">
                  <span className="font-black text-3xl text-white drop-shadow">2</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-100/90 mt-0.5">
                    SILVER
                  </span>
                </div>
              </div>
            )}

            {/* 1st Place (Gold Winner) */}
            {leaderboard[0] && (
              <div className="flex flex-col items-center">
                {/* Crown over 1st place avatar */}
                <span className="text-xl -mb-1 animate-pulse">👑</span>

                {/* Avatar Box with Warm Golden Glow */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#ea580c] via-[#f59e0b] to-[#fde047] border-2 border-amber-200 shadow-[0_6px_25px_rgba(245,158,11,0.5)] flex items-center justify-center text-4xl mb-2 transition hover:scale-105">
                  {leaderboard[0].avatar || '🥇'}
                </div>

                <span className="text-sm font-black text-amber-200 truncate max-w-[105px] text-center mb-0.5">
                  {leaderboard[0].name}
                </span>
                <span className="text-[11px] font-bold text-amber-950 bg-amber-400 px-2.5 py-0.5 rounded-full font-mono mb-2 shadow-sm font-extrabold">
                  {leaderboard[0].score.toLocaleString()} pts
                </span>

                {/* Gold Pillar */}
                <div className="w-28 sm:w-32 h-40 bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#ea580c] rounded-t-2xl border-t-2 border-x-2 border-amber-100 flex flex-col items-center justify-start pt-4 shadow-[0_15px_35px_rgba(245,158,11,0.4)]">
                  <span className="font-black text-4xl text-slate-950 drop-shadow">1</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 mt-1">
                    GOLD WINNER
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze) if 3+ players */}
            {leaderboard[2] && (
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-800 to-amber-600 border border-amber-400/40 shadow-[0_4px_15px_rgba(180,83,9,0.3)] flex items-center justify-center text-2xl mb-2 transition hover:scale-105">
                  {leaderboard[2].avatar || '🥉'}
                </div>

                <span className="text-xs font-black text-slate-300 truncate max-w-[75px] text-center mb-0.5">
                  {leaderboard[2].name}
                </span>
                <span className="text-[10px] font-bold text-amber-200/70 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-600/20 mb-2">
                  {leaderboard[2].score.toLocaleString()} pts
                </span>

                <div className="w-20 sm:w-24 h-20 bg-gradient-to-b from-[#d97706] to-[#92400e] rounded-t-2xl border-t-2 border-x-2 border-amber-300/40 flex flex-col items-center justify-start pt-2 shadow-md">
                  <span className="font-black text-2xl text-white">3</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-200 mt-0.5">
                    BRONZE
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Button: Attractive Orange-Gold Glow Button (Exact like 2nd image) */}
          <div>
            {isHost ? (
              <button
                onClick={handlePlayAgain}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:from-[#fbbf24] hover:to-[#ea580c] text-slate-950 font-black text-base uppercase tracking-wider shadow-[0_10px_25px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2.5 transition active:scale-98 cursor-pointer border border-amber-300/30"
              >
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                PLAY AGAIN
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-400 font-bold text-xs uppercase tracking-wider text-center">
                Waiting for host to start the next match...
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Modern Glassmorphic Leaderboard Panel (Exact match to 2nd image) */}
        <div className="w-full md:w-[360px] bg-[#09152b] rounded-3xl border border-blue-900/30 p-5 flex flex-col justify-between">
          <div>
            {/* Header: Trophy Icon + LEADERBOARD + Player Count badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block -mb-0.5">
                    LEADERBOARD
                  </span>
                  <h3 className="text-base font-extrabold text-white">Final Standings</h3>
                </div>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                {leaderboard.length} Players
              </span>
            </div>

            {/* Player Standings Cards */}
            <div className="space-y-3">
              {leaderboard.map((player, idx) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                    idx === 0
                      ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/40 shadow-sm'
                      : idx === 1
                      ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/30'
                      : 'bg-slate-800/40 border-slate-700/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs font-mono shadow-sm ${getRankBadgeColor(
                        idx
                      )}`}
                    >
                      {idx + 1}
                    </div>

                    {/* Avatar Box */}
                    <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                      {player.avatar || '🦊'}
                    </div>

                    {/* Name + Subtitle (Champion / Runner-up) */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-white truncate max-w-[110px]">
                          {player.name}
                        </span>
                        {idx === 0 && <span className="text-xs">🏆</span>}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">
                        {getRankTitle(idx)}
                      </span>
                    </div>
                  </div>

                  {/* Points Pill */}
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-black text-amber-300 font-mono inline-block">
                      {player.score.toLocaleString()} <span className="text-[10px] text-slate-400">pts</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
