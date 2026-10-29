import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './models/RoomManager.js';
import { DrawStroke } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve frontend static build if present (for single deploy on Render/Railway)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Map socket id to room id
const socketRoomMap = new Map<string, string>();

io.on('connection', (socket: Socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Create room
  socket.on('create_room', ({ playerName, avatar, settings }) => {
    const room = roomManager.createRoom();
    if (settings) {
      room.updateSettings(settings);
    }
    const player = room.addPlayer(socket.id, playerName || 'Player', avatar || '🦊');
    socket.join(room.id);
    socketRoomMap.set(socket.id, room.id);

    socket.emit('room_created', {
      roomId: room.id,
      player,
      state: room.getPublicState(socket.id)
    });
    room.broadcastState();
  });

  // Join room
  socket.on('join_room', ({ roomId, playerName, avatar, asSpectator }) => {
    let room = roomManager.getRoom(roomId?.toUpperCase());
    
    // Auto join random public room if requested and no ID
    if (!room && (!roomId || roomId === 'RANDOM')) {
      room = roomManager.findRandomOpenRoom() || roomManager.createRoom();
    }

    if (!room) {
      socket.emit('error_message', { message: 'Room not found with code: ' + roomId });
      return;
    }

    const activePlayersCount = Array.from(room.players.values()).filter(p => !p.isSpectator).length;
    let isSpectator = !!asSpectator;

    // Auto convert to spectator if room is full for active players
    if (activePlayersCount >= room.settings.maxPlayers) {
      isSpectator = true;
    }

    const player = room.addPlayer(socket.id, playerName || 'Player', avatar || '👁️', isSpectator);
    socket.join(room.id);
    socketRoomMap.set(socket.id, room.id);

    socket.emit('room_joined', {
      roomId: room.id,
      player,
      state: room.getPublicState(socket.id),
      strokes: room.strokes // sync existing canvas for newly joined player
    });

    // Notify room of new player or spectator
    io.to(room.id).emit('chat_message', {
      id: Date.now().toString(),
      text: isSpectator ? `${player.name} is now spectating.` : `${player.name} joined the room!`,
      type: 'system',
      timestamp: Date.now()
    });

    room.broadcastState();
  });

  // Update room settings (host only)
  socket.on('update_settings', ({ settings }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    room.updateSettings(settings);
  });

  // Start game (host only)
  socket.on('start_game', () => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    if (room.players.size < 2) {
      socket.emit('error_message', { message: 'At least 2 players are required to start!' });
      return;
    }

    room.startGame();
  });

  // Drawer chooses word
  socket.on('choose_word', ({ word }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;
    const room = roomManager.getRoom(roomId);
    if (!room || room.drawerId !== socket.id) return;

    room.selectWord(word);
  });

  // Canvas drawing events
  socket.on('draw_stroke', (stroke: DrawStroke) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;
    const room = roomManager.getRoom(roomId);
    if (!room || room.drawerId !== socket.id || room.phase !== 'DRAWING') return;

    room.addStroke(stroke);
    // Broadcast stroke immediately to all guessers
    socket.to(roomId).emit('draw_stroke', stroke);
  });

  socket.on('canvas_clear', () => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;
    const room = roomManager.getRoom(roomId);
    if (!room || room.drawerId !== socket.id) return;

    room.clearCanvas();
    io.to(roomId).emit('canvas_clear');
  });

  socket.on('draw_undo', () => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;
    const room = roomManager.getRoom(roomId);
    if (!room || room.drawerId !== socket.id) return;

    room.undoStroke();
    // Broadcast full strokes to guarantee synchronization across all clients
    io.to(roomId).emit('sync_strokes', room.strokes);
  });

  // Chat and Guess handling
  socket.on('send_chat', ({ text }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId || !text || text.trim() === '') return;
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    if (room.phase === 'DRAWING') {
      const result = room.handleGuess(socket.id, text);

      if (result.isCorrect) {
        // Player correctly guessed the word
        io.to(roomId).emit('chat_message', {
          id: Date.now().toString(),
          senderName: player.name,
          text: `${player.name} guessed the word!`,
          type: 'correct',
          timestamp: Date.now()
        });
        return;
      }

      if (result.isClose) {
        // Only notify this specific player that they are close
        socket.emit('chat_message', {
          id: Date.now().toString(),
          text: `"${text}" is very close!`,
          type: 'close',
          timestamp: Date.now()
        });
        return;
      }
    }

    // Regular chat message
    io.to(roomId).emit('chat_message', {
      id: Date.now().toString(),
      senderId: socket.id,
      senderName: player.name,
      text: text.trim(),
      type: 'chat',
      timestamp: Date.now()
    });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    socketRoomMap.delete(socket.id);
    const room = roomManager.getRoom(roomId);
    if (room) {
      const player = room.players.get(socket.id);
      const { remainingCount, newHostId } = room.removePlayer(socket.id);

      if (remainingCount === 0) {
        roomManager.deleteRoom(roomId);
      } else {
        if (player) {
          io.to(roomId).emit('chat_message', {
            id: Date.now().toString(),
            text: `${player.name} left the room.`,
            type: 'system',
            timestamp: Date.now()
          });
        }
        if (newHostId) {
          const newHost = room.players.get(newHostId);
          io.to(roomId).emit('chat_message', {
            id: Date.now().toString(),
            text: `${newHost?.name} is now the host!`,
            type: 'system',
            timestamp: Date.now()
          });
        }
        room.broadcastState();
      }
    }
  });
});

// Fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Skribble.io API is active.');
    }
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Skribble server listening on port ${PORT}`);
});
