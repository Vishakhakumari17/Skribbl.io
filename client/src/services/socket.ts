import { io, Socket } from 'socket.io-client';

// If VITE_BACKEND_URL is set use that; otherwise in production on fullstack host default to same-origin window.location.origin, fallback to localhost:4000
const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  return 'http://localhost:4000';
};

export const socket: Socket = io(getBackendUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
