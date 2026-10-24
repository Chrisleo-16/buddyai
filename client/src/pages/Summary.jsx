import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Gauge, Sparkles, ListOrdered, CheckCircle2, AlertTriangle, XCircle, CircleDashed, House, RotateCw, Clock, ScanEye, Hand } from 'lucide-react';
import { api } from '../lib/api.js';
import { useT } from '../i18n/index.js';
import { riskTone, riskLevel, minutes, fmtTime } from '../lib/format.js';
import { Card, Badge, Meter, Stat, Skeleton, ErrorState, PageHeader, Disclaimer, ICON } from '../components/ui.jsx';

const ST = { passed: [CheckCircle2, 'text-ok', 'ok'], overridden: [AlertTriangle, 'text-warn', 'warn'], failed: [XCircle, 'text-danger', 'danger'], pending: [CircleDashed, 'text-ink-subtle', 'neutral'] };

export default function Summary() {
  const { id } = useParams();
  const t = useT();
  const q = useQuery({ queryKey: ['session', id], queryFn: () => api(`/sessions/${id}`) });
  if (q.isError) return <ErrorState title={t('common.error')} onRetry={q.refetch} retryLabel={t('common.retry')} />;
  if (q.isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-44" /><Skeleton className="h-44 md:col-span-2" /></div><Skeleton className="h-72" /></div>;
  const s = q.data; const p = s.protocol;
  const tone = riskTone(s.riskScore);
  const lastCoach = s.steps.flatMap((x) => x.detections).filter((d) => d.model && d.model !== 'seed').at(-1);
  const checks = s.steps.reduce((a, x) => a + (x.checks || 0), 0);
  return (
    <div>
      <PageHeader title={t('summary.title')} subtitle={`${t.pick(p.title)} · ${s.user?.name || ''}`}
        actions={<div className="flex gap-2"><Link to="/" className="btn-secondary"><House {...ICON} />{t('summary.home')}</Link>{s.mode === 'training' && <Link to="/training" className="btn-primary"><RotateCw {...ICON} />{t('summary.again')}</Link>}</div>} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card icon={Gauge} title={t('summary.risk')}>
          <div className="flex items-end gap-2"><span className="text-2xl font-medium tabular-nums tracking-tight" data-testid="risk-score">{s.riskScore ?? '—'}</span><span className="pb-1 text-sm text-ink-subtle">/ 100</span><span className="ml-auto pb-1"><Badge tone={tone}>{t(`summary.${riskLevel(s.riskScore)}`)}</Badge></span></div>
          <div className="mt-4"><Meter value={s.riskScore} label={t('summary.risk')} /></div>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-paper-line pt-4">
            <Stat icon={Clock} label={t('summary.duration')} value={`${minutes(s.startedAt, s.finishedAt) ?? '—'}`} sub={t('common.minutes')} />
            <Stat icon={Hand} label={t('summary.overrides')} value={s.overrides.length} />
            <Stat icon={ScanEye} label={t('summary.checks')} value={checks} />
          </div>
          {s.mode === 'training' && <div className="mt-4 flex items-center justify-between rounded-inner bg-paper-sunken px-3 py-2 text-sm"><span>{t('summary.score')}</span><span className="font-medium tabular-nums">{s.trainingScore}</span></div>}
        </Card>
        <Card icon={Sparkles} title={t('summary.coaching')} className="md:col-span-2" action={<span className="text-xs text-ink-subtle">{t('summary.generatedBy')} Gemma 4</span>}>
          <p className="text-md leading-relaxed text-ink-strong" data-testid="coaching-note">{t.pick(s.coachingNote)}</p>
          <div className="mt-6 border-t border-paper-line pt-4">
            <p className="mb-2 text-sm font-medium">{t('summary.reasons')}</p>
            {s.riskBreakdown?.reasons?.length ? <ul className="space-y-1.5">{s.riskBreakdown.reasons.map((r) => <li key={r} className="flex items-start gap-2 text-sm text-ink-muted"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-subtle" />{r}</li>)}</ul> : <p className="text-sm text-ink-muted">{t('summary.none')}</p>}
          </div>
        </Card>
      </div>
      <div className="mt-4"><Card icon={ListOrdered} title={t('summary.timeline')} bodyClass="p-0">
        <ol>{s.steps.map((x) => {
          const st = p.steps.find((y) => y.order === x.order);
          const [Icon, cls, tn] = ST[x.status];
          const flags = [...new Set(x.detections.flatMap((d) => d.riskFlags || []))];
          return (
            <li key={x.order} className="flex min-h-[48px] items-center gap-3 border-t border-paper-line px-4 py-2 first:border-t-0">
              <span className="w-6 text-sm tabular-nums text-ink-subtle">{x.order}</span>
              <Icon {...ICON} className={`shrink-0 ${cls}`} />
              <div className="min-w-0 flex-1"><p className="truncate text-base">{t.pick(st?.title)}</p>{x.overrideReason && <p className="truncate text-xs text-ink-muted">{x.overrideReason}</p>}</div>
              {flags.map((f) => <Badge key={f} tone="danger">{f.replace(/_/g, ' ')}</Badge>)}
              <Badge tone={tn}>{t(`summary.${x.status}`)}</Badge>
              <span className="hidden w-12 text-right text-xs tabular-nums text-ink-subtle sm:block">{x.completedAt ? fmtTime(x.completedAt, t.lang) : ''}</span>
            </li>);
        })}</ol>
      </Card></div>
      <div className="mt-10"><Disclaimer text={t('disclaimer')} /></div>
    </div>
  );
}
