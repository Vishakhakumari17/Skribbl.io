import React, { useState, useEffect } from 'react';
import { socket } from './services/socket';
import type { GameState, Player, ChatMessage, DrawStroke } from './types';
import { HomeScreen } from './components/HomeScreen';
import { DrawingCanvas } from './components/DrawingCanvas';
import { GameSidebar } from './components/GameSidebar';
import { GameHeader } from './components/GameHeader';
import { LobbyView } from './components/LobbyView';
import { GameOverModal } from './components/GameOverModal';
import { WordPickerModal } from './components/WordPickerModal';
import { LogOut, Play, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [secretWord, setSecretWord] = useState<string>('');
  const [initialStrokes, setInitialStrokes] = useState<DrawStroke[]>([]);
  const [winnerData, setWinnerData] = useState<{ winner: Player | null; leaderboard: Player[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Leave / Pause / Confirmation Modal State
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);

  // Save session details to sessionStorage so refresh reconnects smoothly
  useEffect(() => {
    if (gameState && currentUser) {
      sessionStorage.setItem('skribbl_active_room', gameState.roomId);
      sessionStorage.setItem('skribbl_player_id', currentUser.id);
    }
  }, [gameState, currentUser]);

  // Handle accidental reload / window close warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameState && gameState.phase !== 'GAME_OVER') {
        e.preventDefault();
        e.returnValue = 'You have an active game in progress! Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState]);

  // Handle browser back button: push state and intercept to show Resume/End modal
  useEffect(() => {
    if (gameState && gameState.phase !== 'GAME_OVER') {
      window.history.pushState({ inGame: true }, '');

      const handlePopState = () => {
        // Prevent immediate navigation away, show friendly resume/leave modal
        window.history.pushState({ inGame: true }, '');
        setShowLeaveModal(true);
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [gameState]);

  // Auto-reconnect on refresh if room was active
  useEffect(() => {
    const savedRoom = sessionStorage.getItem('skribbl_active_room');
    const savedName = localStorage.getItem('skribbl_player_name');
    const userToken = localStorage.getItem('skribbl_user_token');

    if (savedRoom && savedName && !gameState) {
      socket.emit('join_room', {
        roomId: savedRoom,
        playerName: savedName,
        userToken: userToken || undefined
      });
    }
  }, []);

  const handleConfirmLeave = () => {
    socket.emit('leave_room');
    sessionStorage.removeItem('skribbl_active_room');
    sessionStorage.removeItem('skribbl_player_id');
    setCurrentUser(null);
    setGameState(null);
    setShowLeaveModal(false);
  };

  const handleResumeGame = () => {
    setShowLeaveModal(false);
  };

  useEffect(() => {
    socket.on('room_created', ({ player, state }: { player: Player; state: GameState }) => {
      setCurrentUser(player);
      setGameState(state);
    });

    socket.on('room_joined', ({ player, state, strokes }: { player: Player; state: GameState; strokes?: DrawStroke[] }) => {
      setCurrentUser(player);
      setGameState(state);
      if (strokes) setInitialStrokes(strokes);
    });

    socket.on('game_state', (state: GameState) => {
      setGameState(state);
      if (state.phase !== 'DRAWING') {
        setSecretWord('');
      }
    });

    socket.on('word_choices', (choices: string[]) => {
      setWordChoices(choices);
    });

    socket.on('secret_word', (word: string) => {
      setSecretWord(word);
      setWordChoices([]);
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('game_ended', ({ winner, leaderboard }: { winner: Player | null; leaderboard: Player[] }) => {
      setWinnerData({ winner, leaderboard });
    });

    socket.on('timer_update', (time: number) => {
      setGameState((prev) => (prev ? { ...prev, timer: time } : null));
    });

    socket.on('hint_update', (hints: string[]) => {
      setGameState((prev) => (prev ? { ...prev, hints } : null));
    });

    socket.on('error_message', ({ message }: { message: string }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('game_state');
      socket.off('word_choices');
      socket.off('secret_word');
      socket.off('chat_message');
      socket.off('game_ended');
      socket.off('timer_update');
      socket.off('hint_update');
      socket.off('error_message');
    };
  }, []);

  if (!gameState || !currentUser) {
    return (
      <div className="relative min-h-screen bg-[#f8fafc]">
        {errorMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg animate-bounce">
            {errorMessage}
          </div>
        )}
        <HomeScreen />
      </div>
    );
  }

  const isDrawer = gameState.drawerId === socket.id;
  const isHost = currentUser.isHost;
  const currentPlayer = gameState.players.find(p => p.id === socket.id) || currentUser;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f1f5f9] text-slate-800 overflow-hidden font-sans">
      {errorMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg animate-bounce">
          {errorMessage}
        </div>
      )}

      {/* Top Header (Dark blue matching reference image) */}
      <GameHeader
        state={gameState}
        isDrawer={isDrawer}
        secretWord={secretWord}
      />

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {gameState.phase === 'LOBBY' ? (
          <div className="flex-1 overflow-y-auto">
            <LobbyView
              roomId={gameState.roomId}
              isHost={isHost}
              settings={gameState.settings}
              players={gameState.players}
              currentUserId={socket.id || ''}
            />
          </div>
        ) : (
          /* Active Game View: Left Toolbar + Big Center Canvas + Right Sidebar */
          <div className="flex-1 flex overflow-hidden">
            {/* Center Canvas with Left Tool Controls */}
            <div className="flex-1 flex overflow-hidden">
              <DrawingCanvas
                isDrawer={isDrawer && gameState.phase === 'DRAWING'}
                initialStrokes={initialStrokes}
              />
            </div>

            {/* Right Sidebar: Word/Hints, Chat/Guess, Players Leaderboard */}
            <GameSidebar
              state={gameState}
              messages={messages}
              isDrawer={isDrawer}
              hasGuessed={currentPlayer.hasGuessedCorrectly}
              currentUserId={socket.id || ''}
            />
          </div>
        )}
      </div>

      {/* Drawer word picker modal */}
      {isDrawer && gameState.phase === 'WORD_SELECTION' && wordChoices.length > 0 && (
        <WordPickerModal words={wordChoices} />
      )}

      {/* Game Over Modal */}
      {gameState.phase === 'GAME_OVER' && winnerData && (
        <GameOverModal
          winner={winnerData.winner}
          leaderboard={winnerData.leaderboard}
          isHost={isHost}
        />
      )}

      {/* Accidental Back Button / Exit Game Popup Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0e1d38] border-2 border-blue-900/60 rounded-[32px] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-white text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-black text-white font-fun mb-2">
              Game in Progress!
            </h3>
            <p className="text-sm font-medium text-slate-300 mb-6">
              You accidentally pressed back or tried to leave. Do you want to resume the match or leave the game?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={handleResumeGame}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-emerald-300/30"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume Game
              </button>

              <button
                onClick={handleConfirmLeave}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-rose-400/30"
              >
                <LogOut className="w-4 h-4" />
                End / Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
