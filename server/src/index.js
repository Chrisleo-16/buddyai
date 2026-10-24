import http from 'node:http';
import { config } from './config.js';
import { connectDb } from './db.js';
import { createApp } from './app.js';
import { initSocket } from './socket.js';
import { seed } from './seed.js';
import { Protocol } from './models/index.js';
import { providerInfo } from './services/gemma.js';

const { inMemory } = await connectDb();
if (inMemory || !(await Protocol.exists({}))) await seed({ reset: inMemory });
const server = http.createServer(createApp());
initSocket(server);
server.listen(config.port, () => console.log(`[buddyai] API on :${config.port} | AI`, JSON.stringify(providerInfo())));
