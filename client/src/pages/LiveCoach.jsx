import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CameraOff, ScanEye, ArrowRight, Flag, Volume2, VolumeX, ListChecks, Sparkles, Loader2, RotateCw, CheckCircle2, CircleDashed, ShieldAlert, Flag as FinishIcon, Info } from 'lucide-react';
import { api } from '../lib/api.js';
import { useT } from '../i18n/index.js';
import { usePrefs } from '../store/auth.js';
import { useCamera, speak } from '../lib/useCamera.js';
import { getSocket } from '../lib/socket.js';
import Checklist, { mergeItems } from '../components/Checklist.jsx';
import { Card, Badge, Modal, Toggle, Skeleton, ErrorState, ICON } from '../components/ui.jsx';

export function StepProgress({ total, current, steps }) {
  return (
    <div className="flex h-1.5 gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const st = steps?.[i]?.status;
        const c = st === 'passed' ? 'bg-ok' : st === 'overridden' ? 'bg-warn' : st === 'failed' ? 'bg-danger' : i + 1 === current ? 'bg-ink' : 'bg-paper-line';
        return <span key={i} className={`flex-1 rounded-full transition-colors ${c}`} />;
      })}
    </div>
  );
}

function useElapsed(active) {
  const [s, setS] = useState(0);
  useEffect(() => { if (!active) { setS(0); return; } const t0 = Date.now(); const i = setInterval(() => setS(Math.round((Date.now() - t0) / 1000)), 1000); return () => clearInterval(i); }, [active]);
  return s;
}

export default function LiveCoach() {
  const { id } = useParams();
  const t = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const prefs = usePrefs();
  const cam = useCamera();
  const q = useQuery({ queryKey: ['session', id], queryFn: () => api(`/sessions/${id}`) });
  const session = q.data;
  const protocol = session?.protocol;
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null); // {ok, result, meta, error}
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const elapsed = useElapsed(checking);
  const inflight = useRef(false);

  const order = session?.currentStep || 1;
  const step = protocol?.steps.find((s) => s.order === order);
  const sStep = session?.steps.find((s) => s.order === order);
  const verified = sStep?.status === 'passed';
  const isLast = protocol && order === protocol.steps.length;
  const lastDet = sStep?.detections?.filter((d) => d.ok).at(-1);
  const items = useMemo(() => mergeItems(step?.expectedItems, feedback?.ok && feedback.step === order ? feedback.result.items : lastDet?.items || []), [step, feedback, lastDet, order]);

  useEffect(() => {
    const s = getSocket();
    s.emit('session:join', id);
    const onFb = (p) => setFeedback(p);
    s.on('buddy:feedback', onFb);
    return () => { s.off('buddy:feedback', onFb); s.emit('session:leave', id); };
  }, [id]);

  useEffect(() => { setFeedback(null); }, [order]);

  const fbText = feedback?.ok ? (t.lang === 'sw' ? feedback.result.feedback_sw : feedback.result.feedback_en) : feedback ? t('coach.unavailable') : null;
  useEffect(() => { if (fbText && prefs.voice) speak(fbText, t.lang); }, [fbText]); // eslint-disable-line
  useEffect(() => { if (step && prefs.voice) speak(`${t('coach.step')} ${step.order}. ${t.pick(step.title)}. ${t.pick(step.instruction)}`, t.lang); }, [step?.order]); // eslint-disable-line

  const check = useCallback(async () => {
    if (inflight.current || !session || session.status !== 'active') return;
    const blob = await cam.capture();
    if (!blob) return;
    inflight.current = true; setChecking(true);
    try {
      const form = new FormData();
      form.append('frame', blob, 'frame.jpg');
      form.append('step', String(order));
      const r = await api(`/sessions/${id}/check`, { method: 'POST', form });
      setFeedback(r);
      qc.invalidateQueries({ queryKey: ['session', id] });
    } catch (e) {
      setFeedback({ ok: false, step: order, error: e.message });
    } finally { inflight.current = false; setChecking(false); }
  }, [cam, session, order, id, qc]);

  useEffect(() => {
    if (!prefs.autoCheck || cam.state !== 'on' || verified) return;
    const i = setInterval(check, Math.max(5, prefs.intervalSec) * 1000);
    const first = setTimeout(check, 1500);
    return () => { clearInterval(i); clearTimeout(first); };
  }, [prefs.autoCheck, prefs.intervalSec, cam.state, verified, check]);

  async function advance(override = false) {
    setBusy(true);
    try {
      await api(`/sessions/${id}/step`, { method: 'POST', body: { order, override, reason: override ? reason || 'manual override' : undefined } });
      setOverrideOpen(false); setReason('');
      if (isLast) return finish();
      await qc.invalidateQueries({ queryKey: ['session', id] });
    } finally { setBusy(false); }
  }
  async function finish() {
    setBusy(true);
    try { await api(`/sessions/${id}/finish`, { method: 'POST' }); qc.invalidateQueries({ queryKey: ['sessions'] }); qc.removeQueries({ queryKey: ['session', id] }); nav(`/sessions/${id}`); } finally { setBusy(false); }
  }
  async function report() {
    await api(`/sessions/${id}/issue`, { method: 'POST', body: { order, note } });
    setIssueOpen(false); setNote(''); setToast(t('coach.issueSent')); setTimeout(() => setToast(''), 2500);
  }

  if (q.isError) return <ErrorState title={t('common.error')} onRetry={q.refetch} retryLabel={t('common.retry')} />;
  if (!session) return <div className="space-y-4"><Skeleton className="h-6 w-48" /><div className="grid gap-4 lg:grid-cols-5"><Skeleton className="aspect-video lg:col-span-3" /><Skeleton className="h-80 lg:col-span-2" /></div></div>;
  if (session.status !== 'active') { nav(`/sessions/${id}`, { replace: true }); return null; }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            {session.kind === 'doffing' ? <ShieldAlert {...ICON} /> : <Info {...ICON} />}{t.pick(protocol.title)}
            <Badge tone={session.mode === 'training' ? 'neutral' : 'ok'}>{session.mode === 'training' ? t('coach.practice') : t('coach.live')}</Badge>
          </div>
          <h1 className="mt-1 text-xl font-medium tracking-tight">{t('coach.step')} {order} <span className="text-ink-subtle">{t('coach.of')} {protocol.steps.length}</span></h1>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted"><Toggle checked={prefs.autoCheck} onChange={(v) => prefs.set({ autoCheck: v })} label={t('coach.auto')} />{t('coach.auto')}</label>
        <button className="btn-ghost" onClick={() => prefs.set({ voice: !prefs.voice })} aria-pressed={prefs.voice}>{prefs.voice ? <Volume2 {...ICON} /> : <VolumeX {...ICON} />}{t('coach.listen')}</button>
      </div>
      <div className="mb-8"><StepProgress total={protocol.steps.length} current={order} steps={session.steps} /></div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card icon={Camera} title={t('coach.camera')} bodyClass="p-0 overflow-hidden" action={checking ? <Badge tone="warn" icon={Loader2}>{elapsed}{t('common.seconds')}</Badge> : null}>
            <div className="relative aspect-video bg-ink">
              <video ref={cam.videoRef} muted playsInline className={`h-full w-full scale-x-[-1] object-cover ${cam.state === 'on' ? '' : 'opacity-0'}`} />
              {cam.state === 'starting' && <div className="absolute inset-0 grid place-items-center"><Loader2 size={20} strokeWidth={1.5} className="animate-spin text-paper/70" /></div>}
              {cam.state === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-paper">
                  <CameraOff size={20} strokeWidth={1.5} className="text-paper/70" />
                  <p className="text-base font-medium">{t('coach.cameraOff')}</p>
                  <p className="max-w-xs text-sm text-paper/60">{t('coach.cameraOffDesc')}</p>
                  <button className="btn mt-2 border border-paper/20 text-paper hover:bg-paper/10" onClick={cam.start}><RotateCw {...ICON} />{t('coach.retryCam')}</button>
                </div>)}
              {checking && <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-paper/10"><div className="h-full w-1/3 animate-shimmer bg-[linear-gradient(90deg,transparent,#8CC5B8,transparent)] bg-[length:200%_100%]" /></div>}
            </div>
          </Card>

          <Card icon={ListChecks} title={t.pick(step.title)} action={step.critical ? <Badge tone="danger">{t('coach.critical')}</Badge> : null}>
            <p className="text-md leading-relaxed text-ink-strong" data-testid="step-instruction">{t.pick(step.instruction)}</p>
            <a href={protocol.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs text-ink-subtle underline-offset-2 hover:underline">{t('coach.source')} · {protocol.sourceSection}</a>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card icon={Sparkles} title={t('coach.buddy')} action={feedback?.meta?.latencyMs ? <span className="text-xs tabular-nums text-ink-subtle">{(feedback.meta.latencyMs / 1000).toFixed(1)}{t('common.seconds')} · {feedback.meta.model}</span> : null}>
            <div aria-live="polite" className="min-h-[96px]">
              {checking && !feedback ? (
                <div className="space-y-2"><p className="flex items-center gap-2 text-base font-medium"><Loader2 {...ICON} className="animate-spin text-ink-muted" />{t('coach.checking')}</p><p className="text-sm text-ink-muted">{t('coach.checkingSlow')}</p><Skeleton className="mt-3 h-3 w-4/5" /><Skeleton className="h-3 w-3/5" /></div>
              ) : feedback ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">{feedback.ok ? (feedback.result.step_ok ? <Badge tone="ok" icon={CheckCircle2}>{t('coach.verified')}</Badge> : <Badge tone="warn" icon={CircleDashed}>{t('coach.notVerified')}</Badge>) : <Badge tone="danger">{t('coach.unavailable').split('.')[0]}</Badge>}
                    {checking && <span className="flex items-center gap-1 text-xs text-ink-muted"><Loader2 size={12} strokeWidth={1.5} className="animate-spin" />{t('coach.checking')}</span>}</div>
                  <p className="text-md leading-relaxed" data-testid="buddy-feedback">{fbText}</p>
                  {feedback.ok && feedback.result.risk_flags?.length > 0 && <div className="flex flex-wrap gap-1">{feedback.result.risk_flags.map((f) => <Badge key={f} tone="danger">{f.replace(/_/g, ' ')}</Badge>)}</div>}
                </div>
              ) : (
                <div><p className="text-base font-medium">{t('coach.waiting')}</p><p className="mt-1 text-sm text-ink-muted">{t('coach.waitingDesc')}</p></div>
              )}
            </div>
          </Card>

          <Card icon={ListChecks} title={t('coach.checklist')}><Checklist items={items} /></Card>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary btn-lg" onClick={check} disabled={checking || cam.state !== 'on'} data-testid="check-now"><ScanEye {...ICON} />{t('coach.checkNow')}</button>
            <button className="btn-secondary btn-lg" onClick={() => setIssueOpen(true)}><Flag {...ICON} />{t('coach.report')}</button>
            {verified ? (
              <button className="btn-primary btn-lg col-span-2" onClick={() => advance(false)} disabled={busy} data-testid="next">{isLast ? <><FinishIcon {...ICON} />{t('coach.finish')}</> : <>{t('coach.next')}<ArrowRight {...ICON} /></>}</button>
            ) : (
              <button className="btn-primary btn-lg col-span-2" onClick={() => setOverrideOpen(true)} disabled={busy} data-testid="override">{t('coach.override')}<ArrowRight {...ICON} /></button>
            )}
          </div>
          {toast && <p role="status" className="text-center text-sm text-ok">{toast}</p>}
        </div>
      </div>

      <Modal open={overrideOpen} onClose={() => setOverrideOpen(false)} title={t('coach.overrideTitle')} description={t('coach.overrideDesc')}>
        <label className="block"><span className="label">{t('coach.reason')}</span><input autoFocus className="input mt-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('coach.reasonPh')} /></label>
        <div className="mt-6 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setOverrideOpen(false)}>{t('coach.cancel')}</button><button className="btn-primary" onClick={() => advance(true)} disabled={busy} data-testid="confirm-override">{t('coach.confirm')}</button></div>
      </Modal>
      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title={t('coach.report')}>
        <textarea className="input h-24 py-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('coach.issuePh')} />
        <div className="mt-6 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setIssueOpen(false)}>{t('coach.cancel')}</button><button className="btn-danger" onClick={report} disabled={!note.trim()}><Flag {...ICON} />{t('coach.report')}</button></div>
      </Modal>
    </div>
  );
}
