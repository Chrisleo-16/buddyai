import { config } from '../config.js';
import { CheckResult, CoachingResult, parseWith } from './gemmaSchema.js';
import { checkPrompt, coachingPrompt } from './prompts.js';
import { withTimeout, retry } from './timing.js';
import { mockCheck, mockCoaching } from './mockGemma.js';
import { demoCheck, demoCoaching } from './demoGemma.js';
import { sleep } from './timing.js';

let genaiClient = null;
async function gemini() {
  if (!genaiClient) {
    const { GoogleGenAI } = await import('@google/genai');
    genaiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genaiClient;
}

async function callGemini({ model, prompt, image, signal, live }) {
  const ai = await gemini();
  const parts = [];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.buffer.toString('base64') } });
  parts.push({ text: prompt });
  const res = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts }],
    config: {
      temperature: 0.2,
      abortSignal: signal,
      ...(live ? { thinkingConfig: { thinkingLevel: config.gemma.liveThinking }, maxOutputTokens: config.gemma.liveMaxOutputTokens } : {}),
    },
  });
  return res.text;
}

async function callOllama({ prompt, image, signal }) {
  const msg = { role: 'user', content: prompt };
  if (image) msg.images = [image.buffer.toString('base64')];
  const r = await fetch(`${config.gemma.ollamaHost}/api/chat`, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.gemma.ollamaModel, messages: [msg], stream: false, format: 'json', options: { temperature: 0.2 } }),
  });
  if (!r.ok) { const e = new Error(`ollama_${r.status}`); e.status = r.status; throw e; }
  const j = await r.json();
  return j.message?.content;
}

export function providerInfo() {
  const g = config.gemma;
  return {
    provider: g.provider,
    models: g.provider === 'gemini' ? { vision: g.visionModel, text: g.textModel }
      : g.provider === 'ollama' ? { vision: g.ollamaModel, text: g.ollamaModel, host: g.ollamaHost } : { vision: 'mock', text: 'mock' },
    keyConfigured: g.provider !== 'gemini' || !!process.env.GEMINI_API_KEY,
    timeoutMs: g.timeoutMs,
    liveThinking: g.liveThinking,
    demoMode: config.demoMode,
  };
}

/**
 * Run a structured Gemma call: provider dispatch, timeout, retry w/ backoff on 5xx,
 * model fallback (vision<->text) on Gemini, zod validation, and one re-ask on bad JSON.
 */
async function structured({ kind, prompt, image, schema, mock, demo, demoMode }) {
  const g = config.gemma;
  const t0 = Date.now();
  if (demoMode || config.demoMode) {
    await sleep(config.demoLatencyMs * (0.8 + Math.random() * 0.4));
    return { data: demo(), meta: { provider: 'demo', model: 'scripted-demo', demo: true, latencyMs: Date.now() - t0, attempts: 1 } };
  }
  if (g.provider === 'mock') {
    return { data: mock(), meta: { provider: 'mock', model: 'mock', latencyMs: Date.now() - t0, attempts: 1 } };
  }
  const models = g.provider === 'gemini'
    ? (kind === 'vision' ? [...new Set([g.visionModel, g.fallbackVisionModel])] : [...new Set([g.textModel, g.fallbackVisionModel])])
    : [g.ollamaModel];
  let attempts = 0;
  let lastErr;
  for (const model of models) {
    try {
      const run = (p) => retry(() => {
        attempts++;
        return withTimeout((signal) => (g.provider === 'gemini'
          ? callGemini({ model, prompt: p, image, signal, live: kind === 'vision' })
          : callOllama({ prompt: p, image, signal })), g.timeoutMs);
      }, { retries: g.retries });
      let text = await run(prompt);
      let data;
      try { data = parseWith(schema, text); } catch (e) {
        // One re-ask on malformed JSON.
        text = await run(`${prompt}\n\nYour previous reply was not valid JSON for the required shape (${e.message.slice(0, 120)}). Reply again with ONLY the JSON object.`);
        data = parseWith(schema, text);
      }
      return { data, meta: { provider: g.provider, model, latencyMs: Date.now() - t0, attempts } };
    } catch (e) {
      lastErr = e;
      console.warn(`[gemma] ${g.provider}/${model} failed after ${Date.now() - t0}ms: ${e.message?.slice(0, 200)}`);
    }
  }
  const err = new Error(lastErr?.message || 'gemma_failed');
  err.meta = { provider: g.provider, model: models.at(-1), latencyMs: Date.now() - t0, attempts };
  throw err;
}

export async function checkFrame({ protocol, step, image, demoMode = false }) {
  return structured({ kind: 'vision', prompt: checkPrompt({ protocol, step }), image, schema: CheckResult, mock: () => mockCheck(step, image), demo: () => demoCheck(step, image), demoMode });
}

export async function coachingNote({ session, protocol, risk, demoMode = false }) {
  return structured({ kind: 'text', prompt: coachingPrompt({ session, protocol, risk }), schema: CoachingResult, mock: () => mockCoaching(risk), demo: () => demoCoaching(risk), demoMode });
}

export const _internal = { structured };
