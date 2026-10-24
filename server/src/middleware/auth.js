import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const signToken = (u) => jwt.sign({ sub: String(u._id), role: u.role, name: u.name }, config.jwtSecret, { expiresIn: '12h' });

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'auth_required' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'forbidden' });
