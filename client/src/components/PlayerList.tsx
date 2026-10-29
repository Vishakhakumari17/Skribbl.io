import React from 'react';
import type { Player } from '../types';
import { Check } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  drawerId: string | null;
  currentUserId: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, drawerId, currentUserId }) => {
  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full bg-white border-2 border-slate-900 rounded-3xl p-4 shadow-[4px_4px_0px_#0f172a] flex flex-col max-h-[260px] overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Leaderboard
        </span>
        <span className="text-[11px] font-bold text-slate-400">
          {players.length} players
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sortedPlayers.map((player, idx) => {
          const isDrawer = player.id === drawerId;
          const isMe = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className="flex items-center justify-between text-xs font-bold py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-100"
            >
              {/* Name & Indicators (e.g. ironman ✏️ / doe (you) ✅) */}
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className={`truncate text-sm font-extrabold ${isMe ? 'text-indigo-600' : 'text-slate-800'}`}>
                    {player.name} {isMe ? '(you)' : ''}
                  </span>
                  {isDrawer && <span title="Drawing now">✏️</span>}
                  {player.hasGuessedCorrectly && (
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {player.score.toLocaleString()} points
                </span>
              </div>

              {/* Rank (#1, #2, #3...) */}
              <span className="text-sm font-black text-slate-900 font-mono shrink-0">
                #{idx + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
