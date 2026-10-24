import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeRisk } from '../src/services/risk.js';
import { CheckResult, parseWith, extractJson } from '../src/services/gemmaSchema.js';
import { retry } from '../src/services/timing.js';

const protocol = { steps: [{ order: 1, critical: true }, { order: 2, critical: false }] };
const det = (o = {}) => ({ ok: true, stepOk: true, riskFlags: [], ...o });

describe('risk score', () => {
  it('is 0 for a clean session', () => {
    const r = computeRisk({ kind: 'donning', steps: [{ order: 1, status: 'passed', detections: [det()] }, { order: 2, status: 'passed', detections: [det()] }] }, protocol);
    expect(r).toMatchObject({ score: 0, level: 'low' });
  });
  it('weights overrides, flags and doffing', () => {
    const s = { kind: 'doffing', steps: [{ order: 1, status: 'overridden', overrideReason: 'x', detections: [det({ stepOk: false, riskFlags: ['glove_tear'] })] }, { order: 2, status: 'pending', detections: [] }] };
    const r = computeRisk(s, protocol);
    // (12 + 2 + 18 + 4) * 1.15 = 41.4 -> 41
    expect(r.score).toBe(41);
    expect(r.level).toBe('moderate');
    expect(r.reasons.join(' ')).toMatch(/glove_tear/);
  });
  it('clamps to 100', () => {
    const steps = [...Array(20)].map((_, i) => ({ order: 1, status: 'failed', detections: [det({ riskFlags: ['face_touch', 'glove_tear'] })] }));
    expect(computeRisk({ kind: 'doffing', steps }, protocol).score).toBe(100);
  });
});

describe('Gemma JSON validation', () => {
  const good = { items: [{ name: 'hood', present: true, correct: false, issue: null, confidence: '0.8' }], step_ok: false, feedback_en: 'Adjust hood', feedback_sw: 'Rekebisha kofia', risk_flags: ['exposed_skin'] };
  it('parses fenced JSON with preamble', () => {
    const r = parseWith(CheckResult, `Sure!\n\`\`\`json\n${JSON.stringify(good)}\n\`\`\``);
    expect(r.items[0]).toMatchObject({ issue: '', confidence: 0.8 });
  });
  it('strips Gemma thinking channel', () => {
    expect(extractJson(`<|channel>thought\nhmm {not json}<channel|>${JSON.stringify(good)}`).step_ok).toBe(false);
  });
  it('rejects wrong shapes', () => {
    expect(() => parseWith(CheckResult, '{"step_ok":"yes"}')).toThrow();
    expect(() => parseWith(CheckResult, 'no json here')).toThrow();
  });
});

describe('retry/backoff', () => {
  it('retries 503 then succeeds', async () => {
    let n = 0;
    const r = await retry(async () => { if (n++ < 2) { const e = new Error('UNAVAILABLE'); e.status = 503; throw e; } return 'ok'; }, { retries: 2, baseMs: 1 });
    expect(r).toBe('ok'); expect(n).toBe(3);
  });
  it('does not retry 400', async () => {
    let n = 0;
    await expect(retry(async () => { n++; const e = new Error('bad'); e.status = 400; throw e; }, { retries: 3, baseMs: 1 })).rejects.toThrow();
    expect(n).toBe(1);
  });
});

describe('gemma provider fallback (re-ask on bad JSON)', () => {
  afterEach(() => { vi.resetModules(); vi.unstubAllGlobals(); });
  it('ollama: retries once when JSON is malformed', async () => {
    process.env.GEMMA_PROVIDER = 'ollama';
    vi.resetModules();
    const replies = ['not json at all', JSON.stringify({ items: [], step_ok: true, feedback_en: 'ok', feedback_sw: 'sawa', risk_flags: [] })];
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ message: { content: replies.shift() } }) }));
    vi.stubGlobal('fetch', fetchMock);
    const { checkFrame } = await import('../src/services/gemma.js');
    const step = { order: 1, title: { en: 'x', sw: 'x' }, instruction: { en: 'x' }, expectedItems: ['hood'] };
    const { data, meta } = await checkFrame({ protocol: { kind: 'doffing' }, step, image: { buffer: Buffer.from('a'), mimeType: 'image/jpeg' } });
    expect(data.step_ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].body).toContain('"images"');
    expect(meta.provider).toBe('ollama');
    process.env.GEMMA_PROVIDER = 'mock';
  });
});
