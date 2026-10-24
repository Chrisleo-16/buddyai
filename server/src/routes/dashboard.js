import { Router } from 'express';
import { Session, User, InventoryItem, Unit } from '../models/index.js';
const r = Router();

r.get('/', async (_req, res) => {
  const since = new Date(Date.now() - 14 * 864e5);
  const [workers, units, sessions, inventory] = await Promise.all([
    User.find({ role: 'worker' }).populate('unit', 'name code').lean(),
    Unit.find().lean(),
    Session.find({ startedAt: { $gte: since } }).populate('user', 'name').populate('unit', 'name code').sort({ startedAt: -1 }).lean(),
    InventoryItem.find().populate('unit', 'name code').lean(),
  ]);
  const days = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5); return d.toISOString().slice(0, 10); });
  const chart = days.map((day) => {
    const ds = sessions.filter((s) => s.startedAt.toISOString().slice(0, 10) === day);
    return { day, live: ds.filter((s) => s.mode === 'live').length, training: ds.filter((s) => s.mode === 'training').length,
      avgRisk: ds.length ? Math.round(ds.reduce((a, s) => a + (s.riskScore || 0), 0) / ds.length) : null };
  });
  const violations = sessions.flatMap((s) => [
    ...(s.overrides || []).map((o) => ({ session: s._id, worker: s.user?.name, kind: s.kind, type: 'override', order: o.order, note: o.reason, at: o.at })),
    ...(s.riskScore >= 70 ? [{ session: s._id, worker: s.user?.name, kind: s.kind, type: 'high_risk', note: `Risk ${s.riskScore}`, at: s.finishedAt || s.startedAt }] : []),
  ]).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 10);
  const lowStock = inventory.filter((i) => i.quantity <= i.reorderLevel);
  const readiness = units.map((u) => {
    const ws = workers.filter((w) => String(w.unit?._id) === String(u._id));
    const certified = ws.filter((w) => w.certification?.status === 'certified').length;
    const inv = inventory.filter((i) => String(i.unit?._id) === String(u._id));
    const stockOk = inv.filter((i) => i.quantity > i.reorderLevel).length;
    const us = sessions.filter((s) => String(s.unit?._id) === String(u._id) && s.riskScore != null);
    const avgRisk = us.length ? Math.round(us.reduce((a, s) => a + s.riskScore, 0) / us.length) : 0;
    const score = Math.round(0.45 * (ws.length ? certified / ws.length : 0) * 100 + 0.35 * (inv.length ? stockOk / inv.length : 0) * 100 + 0.2 * (100 - avgRisk));
    return { unit: u, workers: ws.length, certified, stockOk, stockTotal: inv.length, avgRisk, score };
  });
  res.json({
    totals: { workers: workers.length, sessions: sessions.length, highRisk: sessions.filter((s) => s.riskScore >= 70).length,
      avgRisk: sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.riskScore || 0), 0) / sessions.length) : 0 },
    workers: workers.map(({ passwordHash, ...w }) => w), chart, violations, lowStock, readiness,
  });
});
export default r;
