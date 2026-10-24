import { io } from 'socket.io-client';
import { useAuth } from '../store/auth.js';
let socket = null;
export function getSocket() {
  if (!socket) socket = io({ auth: { token: useAuth.getState().token }, transports: ['websocket', 'polling'], autoConnect: true });
  return socket;
}
