import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { setup, teardown, login } from './helpers.js';

let app;
beforeAll(async () => { app = await setup(); });
afterAll(teardown);

describe('auth', () => {
  it('rejects bad credentials', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: 'worker@buddy.ai', password: 'nope' });
    expect(r.status).toBe(401);
  });
  it('logs in and returns a safe user', async () => {
    const t = await login(app);
    const r = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${t}`);
    expect(r.status).toBe(200);
    expect(r.body.user.role).toBe('worker');
    expect(r.body.user.passwordHash).toBeUndefined();
  });
  it('requires auth and enforces roles', async () => {
    expect((await request(app).get('/api/protocols')).status).toBe(401);
    const t = await login(app);
    expect((await request(app).get('/api/dashboard').set('Authorization', `Bearer ${t}`)).status).toBe(403);
    const s = await login(app, 'supervisor@buddy.ai');
    const d = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${s}`);
    expect(d.status).toBe(200);
    expect(d.body.readiness).toHaveLength(2);
    expect(d.body.chart).toHaveLength(14);
  });
});

describe('session flow (mock Gemma)', () => {
  it('start → check → step gate → override → finish', async () => {
    const t = await login(app);
    const auth = { Authorization: `Bearer ${t}` };
    const start = await request(app).post('/api/sessions').set(auth).send({ protocolKey: 'doffing-papr', mode: 'live' });
    expect(start.status).toBe(201);
    const id = start.body.session._id;
    expect(start.body.protocol.steps.length).toBe(18);

    // cannot advance an unverified step
    expect((await request(app).post(`/api/sessions/${id}/step`).set(auth).send({ order: 1 })).status).toBe(409);

    // a passing frame (length not divisible by 7)
    const ok = await request(app).post(`/api/sessions/${id}/check`).set(auth).attach('frame', Buffer.alloc(100), { filename: 'f.jpg', contentType: 'image/jpeg' });
    expect(ok.body.ok).toBe(true);
    expect(ok.body.result.step_ok).toBe(true);
    expect((await request(app).post(`/api/sessions/${id}/step`).set(auth).send({ order: 1 })).status).toBe(200);

    // a failing frame (length divisible by 7) then a logged override
    const bad = await request(app).post(`/api/sessions/${id}/check`).set(auth).field('step', '2').attach('frame', Buffer.alloc(700), { filename: 'f.jpg', contentType: 'image/jpeg' });
    expect(bad.body.result.step_ok).toBe(false);
    expect(bad.body.result.risk_flags).toContain('incorrect_position');
    const ov = await request(app).post(`/api/sessions/${id}/step`).set(auth).send({ order: 2, override: true, reason: 'observer confirmed' });
    expect(ov.body.overrides).toHaveLength(1);

    const fin = await request(app).post(`/api/sessions/${id}/finish`).set(auth);
    expect(fin.status).toBe(200);
    expect(fin.body.session.status).toBe('completed');
    expect(fin.body.risk.score).toBeGreaterThan(0);
    expect(fin.body.session.coachingNote.en).toMatch(/risk/i);
    expect(fin.body.session.coachingNote.sw.length).toBeGreaterThan(10);
    // no image bytes persisted
    expect(JSON.stringify(fin.body.session)).not.toMatch(/base64|buffer/i);
  });
});
