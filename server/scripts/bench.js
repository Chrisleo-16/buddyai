// Latency bench for one PPE check. Usage:
// node scripts/bench.js --img <path> --model gemma-4-26b-a4b-it --prompt compact|verbose --thinking minimal|high|none --max 320 --runs 3 [--files]
import { readFileSync } from 'node:fs';
import { GoogleGenAI } from '@google/genai';
import { checkPrompt, checkPromptVerbose } from '../src/services/prompts.js';
import { CheckResult, parseWith } from '../src/services/gemmaSchema.js';
const a = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map((x) => { const [k, ...v] = x.trim().split(' '); return [k, v.join(' ') || true]; }));
const data = JSON.parse(readFileSync(new URL('../src/data/protocols.json', import.meta.url), 'utf8'));
const protocol = data.protocols.find((p) => p.key === 'doffing-papr');
const step = protocol.steps.find((s) => s.order === 2);
const buf = readFileSync(a.img);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const prompt = (a.prompt === 'verbose' ? checkPromptVerbose : checkPrompt)({ protocol, step });
const cfg = { temperature: 0.2 };
if (a.thinking && a.thinking !== 'none') cfg.thinkingConfig = { thinkingLevel: a.thinking };
if (a.max) cfg.maxOutputTokens = Number(a.max);
const times = [];
for (let i = 0; i < Number(a.runs || 3); i++) {
  const t0 = Date.now();
  try {
    let imgPart = { inlineData: { mimeType: 'image/jpeg', data: buf.toString('base64') } };
    if (a.files) { const f = await ai.files.upload({ file: new Blob([buf], { type: 'image/jpeg' }), config: { mimeType: 'image/jpeg' } }); imgPart = { fileData: { fileUri: f.uri, mimeType: f.mimeType } }; }
    const r = await ai.models.generateContent({ model: a.model, contents: [{ role: 'user', parts: [imgPart, { text: prompt }] }], config: cfg });
    const ms = Date.now() - t0; const out = parseWith(CheckResult, r.text);
    times.push(ms); console.log(`run ${i + 1}: ${ms}ms ok step_ok=${out.step_ok} outTok=${r.usageMetadata?.candidatesTokenCount} thoughtTok=${r.usageMetadata?.thoughtsTokenCount ?? 0} inTok=${r.usageMetadata?.promptTokenCount} | ${out.feedback_en.slice(0, 80)}`);
  } catch (e) { console.log(`run ${i + 1}: FAIL ${Date.now() - t0}ms ${String(e.message).slice(0, 120)}`); }
}
const s = [...times].sort((x, y) => x - y);
console.log(`SUMMARY ${JSON.stringify(a)} ok=${times.length} median=${s[Math.floor(s.length / 2)]} min=${s[0]} max=${s.at(-1)}`);
