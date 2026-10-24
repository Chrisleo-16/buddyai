import request from 'supertest';
import { connectDb, disconnectDb } from '../src/db.js';
import { createApp } from '../src/app.js';
import { seed, DEMO_PASSWORD } from '../src/seed.js';
export async function setup() { await connectDb(''); await seed({ reset: true, withHistory: true }); return createApp(); }
export const teardown = disconnectDb;
export async function login(app, email = 'worker@buddy.ai') {
  const r = await request(app).post('/api/auth/login').send({ email, password: DEMO_PASSWORD });
  return r.body.token;
}
