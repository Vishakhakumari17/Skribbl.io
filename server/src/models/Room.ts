import { Player, GamePhase, RoomSettings, DrawStroke, GameState } from '../types.js';
import { WordManager } from './WordManager.js';
import { Server } from 'socket.io';

export class Room {
  public id: string;
  public players: Map<string, Player> = new Map();
  public hostId: string | null = null;
  public phase: GamePhase = 'LOBBY';
  public settings: RoomSettings = {
    maxPlayers: 8,
    rounds: 3,
    drawTime: 60,
    wordCount: 3,
    category: 'all'
  };

  public currentRound: number = 0;
  public currentDrawerIndex: number = -1;
  public drawerId: string | null = null;
  public selectedWord: string = '';
  public wordChoices: string[] = [];
  public hints: string[] = [];
  public revealedIndices: Set<number> = new Set();
  
  public strokes: DrawStroke[] = [];
  public timer: number = 0;
  public firstGuesserId: string | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private hintInterval: NodeJS.Timeout | null = null;
  
  private io: Server;

  constructor(id: string, io: Server) {
    this.id = id;
    this.io = io;
  }

  public addPlayer(id: string, name: string, avatar: string, isSpectator: boolean = false): Player {
    const isFirstPlayer = this.players.size === 0;
    const player: Player = {
      id,
      name,
      avatar,
      score: 0,
      isHost: isFirstPlayer && !isSpectator,
      hasGuessedCorrectly: false,
      isSpectator
    };

    if (isFirstPlayer && !isSpectator) {
      this.hostId = id;
    }

    this.players.set(id, player);
    return player;
  }

  public removePlayer(id: string): { remainingCount: number; newHostId: string | null } {
    this.players.delete(id);

    // If drawer leaves in the middle of a drawing turn
    if (this.drawerId === id && (this.phase === 'DRAWING' || this.phase === 'WORD_SELECTION')) {
      this.endRound('Drawer left the game!');
    }

    let newHostId = null;
    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
    if (this.hostId === id && activePlayers.length > 0) {
      // Assign host to next non-spectator player
      const nextPlayer = activePlayers[0];
      if (nextPlayer) {
        nextPlayer.isHost = true;
        this.hostId = nextPlayer.id;
        newHostId = nextPlayer.id;
      }
    }

    if (activePlayers.length < 2 && this.phase !== 'LOBBY') {
      this.resetToLobby();
    }

    return { remainingCount: this.players.size, newHostId };
  }

  public updateSettings(newSettings: Partial<RoomSettings>): void {
    if (newSettings.drawTime !== undefined) {
      newSettings.drawTime = Math.max(15, Math.min(240, Number(newSettings.drawTime)));
    }
    if (newSettings.wordCount !== undefined) {
      newSettings.wordCount = Math.max(1, Math.min(5, Number(newSettings.wordCount)));
    }
    if (newSettings.rounds !== undefined) {
      newSettings.rounds = Math.max(1, Math.min(10, Number(newSettings.rounds)));
    }
    this.settings = { ...this.settings, ...newSettings };
    this.broadcastState();
  }

  public startGame(): boolean {
    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
    if (activePlayers.length < 2) return false;

    // Reset scores & rounds
    this.players.forEach(p => {
      p.score = 0;
      p.hasGuessedCorrectly = false;
    });

    this.currentRound = 1;
    this.currentDrawerIndex = -1;
    this.startNextTurn();
    return true;
  }

  public startNextTurn(): void {
    this.clearTimers();
    this.strokes = [];
    this.revealedIndices.clear();

    // Reset canvas on all clients for the new turn
    this.io.to(this.id).emit('canvas_clear');

    const activePlayers = Array.from(this.players.values()).filter(p => !p.isSpectator);
    if (activePlayers.length < 2) {
      this.resetToLobby();
      return;
    }

    this.currentDrawerIndex++;
    if (this.currentDrawerIndex >= activePlayers.length) {
      // Round completed for all players
      this.currentDrawerIndex = 0;
      this.currentRound++;

      if (this.currentRound > this.settings.rounds) {
        this.endGame();
        return;
      }
    }

    const currentDrawer = activePlayers[this.currentDrawerIndex];
    this.drawerId = currentDrawer.id;

    // Reset guess status for this turn
    this.firstGuesserId = null;
    this.players.forEach(p => {
      p.hasGuessedCorrectly = false;
      p.scoreGainedThisRound = 0;
    });

    this.phase = 'WORD_SELECTION';
    this.wordChoices = WordManager.getRandomWords(
      this.settings.wordCount || 3,
      this.settings.category,
      this.settings.customWords,
      this.id
    );

    // Broadcast round banner in chat so players know it's a new turn
    const drawerName = currentDrawer.name;
    this.io.to(this.id).emit('chat_message', {
      id: Date.now().toString(),
      text: `--- Round ${this.currentRound}: ${drawerName} is choosing a word ---`,
      type: 'system',
      timestamp: Date.now()
    });

    this.timer = 15; // 15 seconds to select a word
    this.broadcastState();

    // Send secret word choices ONLY to the drawer
    this.io.to(this.drawerId).emit('word_choices', this.wordChoices);

    this.timerInterval = setInterval(() => {
      this.timer--;
      this.io.to(this.id).emit('timer_update', this.timer);

      if (this.timer <= 0) {
        // Auto select first word if drawer didn't choose
        this.selectWord(this.wordChoices[0] || 'apple');
      }
    }, 1000);
  }

  public selectWord(word: string): void {
    if (this.phase !== 'WORD_SELECTION') return;
    this.clearTimers();

    this.selectedWord = word;
    this.phase = 'DRAWING';
    this.timer = this.settings.drawTime || 60;
    this.strokes = [];

    // Ensure canvas is completely clear when drawing begins
    this.io.to(this.id).emit('canvas_clear');

    // Initialize hints
    this.hints = Array(this.selectedWord.length).fill('_');
    // Reveal spaces or dashes
    for (let i = 0; i < this.selectedWord.length; i++) {
      if (this.selectedWord[i] === ' ') this.hints[i] = ' ';
      if (this.selectedWord[i] === '-') this.hints[i] = '-';
    }

    this.broadcastState();

    // Send exact word to drawer
    if (this.drawerId) {
      this.io.to(this.drawerId).emit('secret_word', this.selectedWord);
    }

    this.startDrawingTimers();
  }

  private startDrawingTimers(): void {
    // Reveal hint letters at intervals (e.g., at 60% and 30% time remaining)
    const totalTime = this.settings.drawTime || 60;
    const hintTimes = [Math.floor(totalTime * 0.6), Math.floor(totalTime * 0.3)];

    this.timerInterval = setInterval(() => {
      this.timer--;
      this.io.to(this.id).emit('timer_update', this.timer);

      if (hintTimes.includes(this.timer)) {
        this.revealRandomHint();
      }

      if (this.timer <= 0) {
        this.endRound("Time's up!");
      }
    }, 1000);
  }

  private revealRandomHint(): void {
    const unrevealed: number[] = [];
    for (let i = 0; i < this.selectedWord.length; i++) {
      if (this.hints[i] === '_' && this.selectedWord[i] !== ' ') {
        unrevealed.push(i);
      }
    }

    // Only reveal up to roughly 40% of the word
    if (unrevealed.length > Math.ceil(this.selectedWord.length * 0.6)) {
      const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      this.hints[randomIndex] = this.selectedWord[randomIndex];
      this.io.to(this.id).emit('hint_update', this.hints);
    }
  }

  public handleGuess(playerId: string, guessText: string): { isCorrect: boolean; isClose: boolean; text: string } {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'DRAWING' || player.isSpectator) return { isCorrect: false, isClose: false, text: guessText };

    // Drawer cannot guess
    if (playerId === this.drawerId) {
      return { isCorrect: false, isClose: false, text: guessText };
    }

    // Already guessed player cannot guess again
    if (player.hasGuessedCorrectly) {
      return { isCorrect: false, isClose: false, text: guessText };
    }

    // Helper to normalize words: removes spaces, dashes, and lowercase
    const normalize = (str: string) => str.toLowerCase().replace(/[\s\-_]/g, '');

    const cleanGuess = guessText.trim().toLowerCase();
    const cleanTarget = this.selectedWord.trim().toLowerCase();

    // Exact match (spaces ignored, e.g. "icecream" === "ice cream")
    if (normalize(cleanGuess) === normalize(cleanTarget)) {
      player.hasGuessedCorrectly = true;

      // Only the FIRST player who guesses the word gets the points
      const isFirstGuesser = this.firstGuesserId === null;
      let points = 0;

      if (isFirstGuesser) {
        this.firstGuesserId = player.id;
        // Calculate score based on remaining time (max 500, min 100)
        const ratio = this.timer / (this.settings.drawTime || 60);
        points = Math.max(100, Math.round(100 + ratio * 400));
        player.score += points;
        player.scoreGainedThisRound = points;

        // Drawer also gains bonus points when first person guesses
        const drawer = this.drawerId ? this.players.get(this.drawerId) : null;
        if (drawer) {
          const drawerBonus = Math.round(points * 0.4);
          drawer.score += drawerBonus;
        }

        this.io.to(this.id).emit('player_guessed_correctly', {
          playerId: player.id,
          playerName: player.name,
          points
        });
      } else {
        // Subsequent guessers don't get points
        player.scoreGainedThisRound = 0;
        this.io.to(this.id).emit('player_guessed_correctly', {
          playerId: player.id,
          playerName: player.name,
          points: 0
        });
      }

      this.broadcastState();

      // Check if all active non-drawer guessers have guessed
      const guessers = Array.from(this.players.values()).filter(p => p.id !== this.drawerId && !p.isSpectator);
      const allGuessed = guessers.length > 0 && guessers.every(p => p.hasGuessedCorrectly);

      if (allGuessed) {
        this.endRound('Everyone guessed the word!');
      }

      return { isCorrect: true, isClose: false, text: guessText };
    }

    // Check if close guess
    if (WordManager.isCloseGuess(cleanGuess, cleanTarget)) {
      return { isCorrect: false, isClose: true, text: guessText };
    }

    return { isCorrect: false, isClose: false, text: guessText };
  }

  public addStroke(stroke: DrawStroke): void {
    this.strokes.push(stroke);
  }

  public undoStroke(): DrawStroke | null {
    if (this.strokes.length > 0) {
      return this.strokes.pop() || null;
    }
    return null;
  }

  public clearCanvas(): void {
    this.strokes = [];
  }

  public endRound(reason: string): void {
    this.clearTimers();
    this.phase = 'ROUND_END';

    this.io.to(this.id).emit('round_ended', {
      word: this.selectedWord,
      reason,
      scores: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        scoreGained: p.scoreGainedThisRound || 0
      }))
    });

    this.broadcastState();

    // 5 seconds preview before next turn
    this.timer = 5;
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer <= 0) {
        this.clearTimers();
        this.startNextTurn();
      }
    }, 1000);
  }

  public endGame(): void {
    this.clearTimers();
    this.phase = 'GAME_OVER';

    const leaderboard = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
    const winner = leaderboard[0] || null;

    this.io.to(this.id).emit('game_ended', {
      winner,
      leaderboard
    });

    this.broadcastState();
  }

  public resetToLobby(): void {
    this.clearTimers();
    this.phase = 'LOBBY';
    this.currentRound = 0;
    this.drawerId = null;
    this.strokes = [];
    this.hints = [];
    this.revealedIndices.clear();
    WordManager.resetRoomWords(this.id);
    this.broadcastState();
  }

  private clearTimers(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.hintInterval) clearInterval(this.hintInterval);
    this.timerInterval = null;
    this.hintInterval = null;
  }

  public getPublicState(forPlayerId?: string): GameState {
    const isDrawer = forPlayerId === this.drawerId;
    const isRoundEnd = this.phase === 'ROUND_END' || this.phase === 'GAME_OVER';

    let displayWord = '';
    if (isDrawer || isRoundEnd) {
      displayWord = this.selectedWord;
    } else if (this.phase === 'DRAWING') {
      displayWord = this.hints.join('');
    }

    const drawer = this.drawerId ? this.players.get(this.drawerId) : undefined;

    return {
      roomId: this.id,
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.settings.rounds,
      drawerId: this.drawerId,
      drawerName: drawer?.name,
      wordToGuess: displayWord,
      wordLength: this.selectedWord.length,
      hints: this.hints,
      timer: this.timer,
      players: Array.from(this.players.values()),
      settings: this.settings
    };
  }

  public broadcastState(): void {
    // Broadcast tailored state (guessers shouldn't see secret word unless round ended)
    this.players.forEach(player => {
      this.io.to(player.id).emit('game_state', this.getPublicState(player.id));
    });
  }
}
