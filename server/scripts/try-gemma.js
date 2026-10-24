// Usage: GEMMA_PROVIDER=gemini node scripts/try-gemma.js <image.jpg> [doffing-step-order]
import { readFileSync } from 'node:fs';
import { checkFrame, providerInfo } from '../src/services/gemma.js';
const data = JSON.parse(readFileSync(new URL('../src/data/protocols.json', import.meta.url), 'utf8'));
const protocol = data.protocols.find((p) => p.key === 'doffing-papr');
const step = protocol.steps.find((s) => s.order === Number(process.argv[3] || 2));
const buffer = readFileSync(process.argv[2]);
console.log('provider', JSON.stringify(providerInfo()), 'step', step.order, step.title.en, 'bytes', buffer.length);
const t0 = Date.now();
try {
  const { data: out, meta } = await checkFrame({ protocol, step, image: { buffer, mimeType: 'image/jpeg' } });
  console.log(JSON.stringify({ meta, out }, null, 2));
} catch (e) {
  console.log('FAILED after', Date.now() - t0, 'ms', e.message, JSON.stringify(e.meta));
}
