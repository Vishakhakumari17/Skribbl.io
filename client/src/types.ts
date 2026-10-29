export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
  hasGuessedCorrectly: boolean;
  scoreGainedThisRound?: number;
  isSpectator?: boolean;
  userToken?: string;
}

export type GamePhase = 
  | 'LOBBY' 
  | 'WORD_SELECTION' 
  | 'DRAWING' 
  | 'ROUND_END' 
  | 'GAME_OVER';

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  category: string;
  customWords?: string[];
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface DrawStroke {
  id: string;
  points: StrokePoint[];
  color: string;
  size: number;
  isEraser?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName?: string;
  text: string;
  type: 'chat' | 'system' | 'correct' | 'close';
  timestamp: number;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  drawerId: string | null;
  drawerName?: string;
  wordToGuess: string;
  wordLength: number;
  hints: string[];
  timer: number;
  players: Player[];
  settings: RoomSettings;
}
