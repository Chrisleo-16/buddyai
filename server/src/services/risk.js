/**
 * Transparent, rule-based risk score (0-100). Gemma writes the coaching note;
 * the number itself is deterministic so it is auditable.
 */
const FLAG_WEIGHTS = { exposed_skin: 12, glove_tear: 18, face_touch: 15, visible_contamination: 12, wrong_order: 10 };

export function computeRisk(session, protocol) {
  let score = 0;
  const reasons = [];
  const byOrder = new Map(protocol.steps.map((s) => [s.order, s]));
  for (const s of session.steps) {
    const p = byOrder.get(s.order);
    const crit = p?.critical;
    if (s.status === 'overridden') { score += crit ? 12 : 5; reasons.push(`Step ${s.order} manually overridden${s.overrideReason ? ` (${s.overrideReason})` : ''}`); }
    if (s.status === 'failed') { score += crit ? 15 : 8; reasons.push(`Step ${s.order} failed`); }
    if (s.status === 'pending') { score += crit ? 10 : 4; reasons.push(`Step ${s.order} not completed`); }
    const failedChecks = s.detections.filter((d) => d.ok && d.stepOk === false).length;
    score += Math.min(failedChecks, 3) * 2;
    const flags = new Set(s.detections.flatMap((d) => d.riskFlags || []));
    for (const f of flags) { score += FLAG_WEIGHTS[f] ?? 4; reasons.push(`Flag "${f}" at step ${s.order}`); }
  }
  if (session.kind === 'doffing') score = Math.round(score * 1.15); // doffing is the higher-exposure phase
  score = Math.max(0, Math.min(100, Math.round(score)));
  const level = score >= 70 ? 'high' : score >= 35 ? 'moderate' : 'low';
  return { score, level, reasons: reasons.slice(0, 8) };
}

export function trainingScore(risk) { return Math.max(0, 100 - risk.score); }
