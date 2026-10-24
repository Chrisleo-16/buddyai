import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { User, Protocol, Session, InventoryItem, Unit } from './models/index.js';
import { computeRisk } from './services/risk.js';

const data = JSON.parse(readFileSync(new URL('./data/protocols.json', import.meta.url), 'utf8'));
export const DEMO_PASSWORD = 'buddy-demo-2026'; // demo-only, documented in README

// Small deterministic PRNG so seeded dashboards look the same every run.
function rng(seed = 42) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

export async function seed({ reset = true, withHistory = true } = {}) {
  if (reset) await Promise.all([User, Protocol, Session, InventoryItem, Unit].map((M) => M.deleteMany({})));
  const protocols = await Protocol.insertMany(data.protocols.map((p) => ({ ...p, sourceUrl: data.source.url })));
  const [iso, er] = await Unit.insertMany([
    { name: 'Isolation Ward A', code: 'ISO-A', facility: 'Kenyatta National Hospital (demo)' },
    { name: 'Emergency Triage', code: 'ER-1', facility: 'Kenyatta National Hospital (demo)' },
  ]);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const yr = 365 * 864e5;
  const now = Date.now();
  const people = [
    ['Amina Wanjiru', 'worker@buddy.ai', 'worker', iso, 'certified', now - 100 * 864e5],
    ['Dr. Otieno Kamau', 'supervisor@buddy.ai', 'supervisor', iso, 'certified', now - 30 * 864e5],
    ['Admin Buddy', 'admin@buddy.ai', 'admin', iso, 'certified', now - 30 * 864e5],
    ['Brian Mwangi', 'brian@buddy.ai', 'worker', iso, 'due', now - 350 * 864e5],
    ['Grace Achieng', 'grace@buddy.ai', 'worker', er, 'certified', now - 60 * 864e5],
    ['Kevin Mutua', 'kevin@buddy.ai', 'worker', er, 'in_training', null],
    ['Faith Njeri', 'faith@buddy.ai', 'worker', er, 'expired', now - 400 * 864e5],
    ['Hassan Ali', 'hassan@buddy.ai', 'worker', iso, 'certified', now - 15 * 864e5],
  ];
  const users = await User.insertMany(people.map(([name, email, role, unit, status, at]) => ({
    name, email, role, unit: unit._id, passwordHash: hash,
    certification: { status, certifiedAt: at ? new Date(at) : undefined, expiresAt: at ? new Date(at + yr) : undefined },
  })));
  const items = [
    ['PAPR-HOOD', 'Disposable PAPR hood', 'Kofia ya PAPR ya kutupwa', 'respiratory'],
    ['GLV-NIT-IN', 'Nitrile gloves (inner)', 'Glavu za nitrile (ndani)', 'gloves'],
    ['GLV-NIT-EXT', 'Extended-cuff gloves (outer)', 'Glavu za pindo ndefu (nje)', 'gloves'],
    ['COV-IMP', 'Impermeable coverall', 'Ovaroli isiyopenyeza', 'body'],
    ['BOOT-CVR', 'Boot covers (mid-calf)', 'Vifuniko vya buti', 'feet'],
    ['APR-DISP', 'Disposable apron', 'Aproni ya kutupwa', 'body'],
    ['ABHR-500', 'Alcohol hand rub 500 ml', 'Dawa ya mikono 500 ml', 'hygiene'],
  ];
  const r = rng(7);
  const inv = [];
  for (const u of [iso, er]) for (const [sku, en, sw, category] of items) {
    const reorderLevel = 20 + Math.floor(r() * 20);
    inv.push({ sku: `${u.code}-${sku}`, name: { en, sw }, category, unit: u._id, reorderLevel, quantity: r() < 0.25 ? Math.floor(reorderLevel * r()) : reorderLevel + Math.floor(r() * 120), expiresAt: new Date(now + (60 + r() * 400) * 864e5) });
  }
  await InventoryItem.insertMany(inv);

  if (withHistory) {
    const workers = users.filter((u) => u.role === 'worker');
    const sessions = [];
    for (let i = 0; i < 36; i++) {
      const w = workers[Math.floor(r() * workers.length)];
      const p = protocols[r() < 0.6 ? 1 : 0];
      const start = new Date(now - Math.floor(r() * 13.5 * 864e5) - 3600e3);
      const mode = r() < 0.35 ? 'training' : 'live';
      const steps = p.steps.map((st) => {
        const x = r();
        const status = x < 0.08 ? 'overridden' : x < 0.11 ? 'failed' : 'passed';
        const flags = x < 0.05 ? [['face_touch', 'glove_tear', 'exposed_skin'][Math.floor(r() * 3)]] : [];
        return { order: st.order, status, checks: 1, overrideReason: status === 'overridden' ? 'Buddy unavailable; observer confirmed' : undefined,
          startedAt: start, completedAt: start, detections: [{ provider: 'seed', ok: true, stepOk: status === 'passed', riskFlags: flags, latencyMs: 0 }] };
      });
      const s = { user: w._id, unit: w.unit, protocol: p._id, kind: p.kind, mode, status: 'completed', currentStep: p.steps.length, steps,
        overrides: steps.filter((x) => x.status === 'overridden').map((x) => ({ order: x.order, reason: x.overrideReason, at: start })),
        startedAt: start, finishedAt: new Date(start.getTime() + (8 + r() * 14) * 60e3) };
      const risk = computeRisk(s, p);
      s.riskScore = risk.score; s.riskBreakdown = risk;
      if (mode === 'training') s.trainingScore = 100 - risk.score;
      s.coachingNote = { en: `Seeded history. Risk ${risk.score}/100 (${risk.level}).`, sw: `Historia ya mfano. Hatari ${risk.score}/100.` };
      sessions.push(s);
    }
    await Session.insertMany(sessions);
  }
  console.log(`[seed] ${users.length} users, 2 units, ${inv.length} inventory items, protocols: ${protocols.map((p) => p.key).join(', ')}`);
  return { users, protocols };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { connectDb, disconnectDb } = await import('./db.js');
  await connectDb();
  await seed();
  await disconnectDb();
}
