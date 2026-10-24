import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import auth from './routes/auth.js';
import protocols from './routes/protocols.js';
import sessions from './routes/sessions.js';
import dashboard from './routes/dashboard.js';
import inventory from './routes/inventory.js';
import { providerInfo } from './services/gemma.js';

export function createApp() {
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'media-src': ["'self'", 'blob:', 'mediastream:'],
        'connect-src': ["'self'", 'ws:', 'wss:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'worker-src': ["'self'", 'blob:'],
      },
    },
  }));
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: '1mb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
  app.get('/api/health', (_req, res) => res.json({ ok: true, ai: providerInfo() }));
  app.use('/api/auth', auth);
  app.use('/api/protocols', requireAuth, protocols);
  app.use('/api/sessions', requireAuth, sessions);
  app.use('/api/dashboard', requireAuth, requireRole('supervisor', 'admin'), dashboard);
  app.use('/api/inventory', requireAuth, inventory);
  // Production: serve the built PWA (client/dist) on the same origin, with SPA fallback.
  const dist = process.env.CLIENT_DIST || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api\/|socket\.io\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'server_error' }); });
  return app;
}
