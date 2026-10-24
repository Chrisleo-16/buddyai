import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { Protocol, Session, User } from '../models/index.js';
import { checkFrame, coachingNote } from '../services/gemma.js';
import { computeRisk, trainingScore } from '../services/risk.js';
import { alertSupervisor } from '../services/sms.js';
import { emitToSession } from '../socket.js';

// Images live in memory only; never written to disk or DB.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } });
const r = Router();

async function loadOwned(req, res) {
  const s = await Session.findById(req.params.id);
  if (!s) { res.status(404).json({ error: 'not_found' }); return null; }
  if (String(s.user) !== req.user.sub && req.user.role === 'worker') { res.status(403).json({ error: 'forbidden' }); return null; }
  return s;
}

r.post('/', async (req, res) => {
  const p = z.object({ protocolKey: z.string(), mode: z.enum(['live', 'training']).default('live') }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'invalid_input' });
  const protocol = await Protocol.findOne({ key: p.data.protocolKey });
  if (!protocol) return res.status(404).json({ error: 'protocol_not_found' });
  const user = await User.findById(req.user.sub);
  const s = await Session.create({
    user: req.user.sub, unit: user?.unit, protocol: protocol._id, kind: protocol.kind, mode: p.data.mode,
    steps: protocol.steps.map((st) => ({ order: st.order, startedAt: st.order === 1 ? new Date() : undefined })),
  });
  res.status(201).json({ session: s, protocol });
});

r.get('/', async (req, res) => {
  const q = req.user.role === 'worker' ? { user: req.user.sub } : {};
  res.json(await Session.find(q).sort({ startedAt: -1 }).limit(50).populate('user', 'name').populate('protocol', 'title kind').lean());
});

r.get('/:id', async (req, res) => {
  const s = await loadOwned(req, res); if (!s) return;
  await s.populate('protocol');
  await s.populate('user', 'name');
  res.json(s);
});

/** Ask Gemma to check one camera frame against the current step. */
r.post('/:id/check', upload.single('frame'), async (req, res) => {
  const s = await loadOwned(req, res); if (!s) return;
  if (s.status !== 'active') return res.status(409).json({ error: 'session_closed' });
  if (!req.file) return res.status(400).json({ error: 'frame_required' });
  const protocol = await Protocol.findById(s.protocol);
  const order = Number(req.body.step || s.currentStep);
  const step = protocol.steps.find((x) => x.order === order);
  if (!step) return res.status(400).json({ error: 'bad_step' });
  emitToSession(s.id, 'buddy:checking', { step: order });
  const image = { buffer: req.file.buffer, mimeType: req.file.mimetype || 'image/jpeg' };
  let detection; let payload;
  try {
    const { data, meta } = await checkFrame({ protocol, step, image });
    detection = { ...meta, ok: true, stepOk: data.step_ok, items: data.items, riskFlags: data.risk_flags, feedbackEn: data.feedback_en, feedbackSw: data.feedback_sw };
    payload = { ok: true, step: order, result: data, meta };
  } catch (e) {
    detection = { ...(e.meta || {}), ok: false, error: e.message.slice(0, 300) };
    payload = { ok: false, step: order, error: 'buddy_unavailable', message: 'Buddy could not check this frame. You can continue manually with your human observer.', meta: e.meta };
  }
  req.file.buffer = null; // drop the image
  const ss = s.steps.find((x) => x.order === order);
  ss.checks += 1;
  ss.detections.push(detection);
  if (detection.ok && detection.stepOk && ss.status === 'pending') ss.status = 'passed';
  await s.save();
  emitToSession(s.id, 'buddy:feedback', payload);
  res.json(payload);
});

/** Advance: only if the step passed, or with a logged override reason. */
r.post('/:id/step', async (req, res) => {
  const s = await loadOwned(req, res); if (!s) return;
  const p = z.object({ order: z.number().int(), override: z.boolean().optional(), reason: z.string().max(300).optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'invalid_input' });
  const ss = s.steps.find((x) => x.order === p.data.order);
  if (!ss) return res.status(400).json({ error: 'bad_step' });
  if (ss.status !== 'passed') {
    if (!p.data.override) return res.status(409).json({ error: 'step_not_verified' });
    ss.status = 'overridden';
    ss.overrideReason = p.data.reason || 'manual override';
    s.overrides.push({ order: ss.order, reason: ss.overrideReason });
  }
  ss.completedAt = new Date();
  const next = s.steps.find((x) => x.order === ss.order + 1);
  if (next) { next.startedAt = new Date(); s.currentStep = next.order; }
  await s.save();
  emitToSession(s.id, 'session:step', { currentStep: s.currentStep });
  res.json(s);
});

r.post('/:id/issue', async (req, res) => {
  const s = await loadOwned(req, res); if (!s) return;
  s.issues.push({ order: Number(req.body.order || s.currentStep), note: String(req.body.note || '').slice(0, 500) });
  await s.save();
  res.json(s);
});

r.post('/:id/finish', async (req, res) => {
  const s = await loadOwned(req, res); if (!s) return;
  const protocol = await Protocol.findById(s.protocol);
  const risk = computeRisk(s, protocol);
  s.riskScore = risk.score; s.riskBreakdown = risk;
  if (s.mode === 'training') s.trainingScore = trainingScore(risk);
  let coachingMeta = null;
  try {
    const { data, meta } = await coachingNote({ session: s, protocol, risk });
    s.coachingNote = { en: data.coaching_en, sw: data.coaching_sw };
    coachingMeta = meta;
  } catch (e) {
    s.coachingNote = { en: `Risk ${risk.score}/100 (${risk.level}). ${risk.reasons.join('. ') || 'No issues recorded.'}`, sw: `Hatari ${risk.score}/100. Buddy hakupatikana kuandika maelezo; pitia hatua na mwangalizi wako.` };
    coachingMeta = { ...(e.meta || {}), error: e.message.slice(0, 200) };
  }
  s.status = 'completed'; s.finishedAt = new Date();
  await s.save();
  let sms = null;
  if (risk.level === 'high' && s.mode === 'live') {
    const u = await User.findById(s.user);
    sms = await alertSupervisor({ workerName: u?.name, riskScore: risk.score, kind: s.kind });
  }
  res.json({ session: s, risk, coachingMeta, sms });
});
export default r;
