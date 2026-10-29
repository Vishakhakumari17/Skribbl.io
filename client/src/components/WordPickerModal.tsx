import React from 'react';
import { socket } from '../services/socket';
import { Sparkles } from 'lucide-react';

interface WordPickerModalProps {
  words: string[];
}

export const WordPickerModal: React.FC<WordPickerModalProps> = ({ words }) => {
  const handleSelect = (word: string) => {
    socket.emit('choose_word', { word });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
          <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <h3 className="text-xl font-black text-white">Choose a Word to Draw</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Pick one word from the options below. You have 15s before an automatic pick!
        </p>

        <div className="flex flex-col gap-3 w-full">
          {words.map((word) => (
            <button
              key={word}
              onClick={() => handleSelect(word)}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-600/20 text-slate-100 font-bold text-base uppercase tracking-wider transition transform hover:-translate-y-0.5 shadow"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
