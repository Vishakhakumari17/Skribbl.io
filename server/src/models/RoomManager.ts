import { Room } from './Room.js';
import { Server } from 'socket.io';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  public createRoom(roomId?: string): Room {
    const id = roomId || this.generateRoomCode();
    const room = new Room(id, this.io);
    this.rooms.set(id, room);
    return room;
  }

  public getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  public deleteRoom(id: string): void {
    const room = this.rooms.get(id);
    if (room) {
      room.resetToLobby();
      this.rooms.delete(id);
    }
  }

  public findRandomOpenRoom(): Room | null {
    for (const room of this.rooms.values()) {
      if (room.phase === 'LOBBY' && room.players.size < room.settings.maxPlayers) {
        return room;
      }
    }
    return null;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }
}
