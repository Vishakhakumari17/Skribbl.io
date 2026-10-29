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

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [secretWord, setSecretWord] = useState<string>('');
  const [initialStrokes, setInitialStrokes] = useState<DrawStroke[]>([]);
  const [winnerData, setWinnerData] = useState<{ winner: Player | null; leaderboard: Player[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    </div>
  );
};

export default App;
