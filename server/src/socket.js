import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

let io = null;
export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: config.clientOrigin } });
  io.use((socket, next) => {
    try { socket.user = jwt.verify(socket.handshake.auth?.token, config.jwtSecret); next(); } catch { next(new Error('unauthorized')); }
  });
  io.on('connection', (socket) => {
    socket.on('session:join', (id) => socket.join(`session:${id}`));
    socket.on('session:leave', (id) => socket.leave(`session:${id}`));
  });
  return io;
}
export function emitToSession(id, event, payload) { io?.to(`session:${id}`).emit(event, payload); }
