import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Shirt, ShieldAlert, GraduationCap, ArrowRight, History, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../store/auth.js';
import { useT } from '../i18n/index.js';
import { useStartSession } from '../lib/useStart.js';
import { riskTone, fmtDate } from '../lib/format.js';
import { Card, Badge, EmptyState, SkeletonRows, ErrorState, PageHeader, Disclaimer, ICON } from '../components/ui.jsx';

export function ModeTile({ icon: Icon, title, desc, meta, onClick, busy, tone = 'neutral', testId }) {
  const ring = { neutral: 'text-ink', danger: 'text-danger', ok: 'text-ok' }[tone];
  return (
    <button data-testid={testId} onClick={onClick} disabled={busy} className="card group text-left transition-shadow hover:shadow-pop disabled:opacity-60">
      <div className="card-body flex h-full flex-col gap-6 p-5">
        <span className={`grid h-9 w-9 place-items-center rounded-btn border border-paper-line bg-paper ${ring}`}><Icon size={18} strokeWidth={1.5} /></span>
        <div className="flex-1"><h3 className="text-md font-medium">{title}</h3><p className="mt-1 text-sm text-ink-muted">{desc}</p></div>
        <div className="flex items-center justify-between text-sm"><span className="text-ink-subtle">{meta}</span>
          <span className="inline-flex items-center gap-1 font-medium">{busy ? <Loader2 {...ICON} className="animate-spin" /> : <ArrowRight {...ICON} className="transition-transform group-hover:translate-x-0.5" />}</span></div>
      </div>
    </button>
  );
}

export function RecentSessions() {
  const t = useT();
  const q = useQuery({ queryKey: ['sessions'], queryFn: () => api('/sessions') });
  return (
    <Card icon={History} title={t('home.recent')} bodyClass="p-0">
      {q.isLoading ? <div className="p-4"><SkeletonRows rows={4} /></div>
        : q.isError ? <ErrorState title={t('common.error')} onRetry={q.refetch} retryLabel={t('common.retry')} />
        : !q.data?.length ? <EmptyState icon={History} title={t('home.noSessions')} description={t('home.noSessionsDesc')} />
        : <ul>{q.data.slice(0, 6).map((s) => (
          <li key={s._id} className="border-t border-paper-line first:border-t-0">
            <Link to={s.status === 'active' ? `/coach/${s._id}` : `/sessions/${s._id}`} className="flex h-12 items-center gap-3 px-4 transition-colors hover:bg-paper-hover">
              <span className="w-14 text-sm tabular-nums text-ink-muted">{fmtDate(s.startedAt, t.lang)}</span>
              <span className="flex-1 truncate text-base">{t.pick(s.protocol?.title)}</span>
              {s.mode === 'training' && <Badge>{t('coach.practice')}</Badge>}
              <Badge tone={riskTone(s.riskScore)}>{s.riskScore ?? '—'}</Badge>
              <ChevronRight {...ICON} className="text-ink-subtle" />
            </Link>
          </li>))}</ul>}
    </Card>
  );
}

export default function Home() {
  const t = useT();
  const user = useAuth((s) => s.user);
  const start = useStartSession();
  const pending = start.isPending ? start.variables?.protocolKey : null;
  return (
    <div>
      <PageHeader title={`${t('home.greeting')}, ${user?.name?.split(' ')[0] || ''}`} subtitle={t('home.pick')} />
      <div className="grid gap-4 md:grid-cols-3">
        <ModeTile testId="start-donning" icon={Shirt} title={t('home.donning')} desc={t('home.donningDesc')} meta={`10 ${t('home.steps')}`} busy={pending === 'donning-papr'} onClick={() => start.mutate({ protocolKey: 'donning-papr', mode: 'live' })} />
        <ModeTile testId="start-doffing" tone="danger" icon={ShieldAlert} title={t('home.doffing')} desc={t('home.doffingDesc')} meta={`18 ${t('home.steps')}`} busy={pending === 'doffing-papr'} onClick={() => start.mutate({ protocolKey: 'doffing-papr', mode: 'live' })} />
        <Link to="/training" className="contents"><ModeTile icon={GraduationCap} tone="ok" title={t('home.training')} desc={t('home.trainingDesc')} meta={t('coach.practice')} /></Link>
      </div>
      {start.isError && <p role="alert" className="mt-4 text-sm text-danger">{t('common.error')}</p>}
      <div className="mt-10"><RecentSessions /></div>
      <div className="mt-10"><Disclaimer text={t('disclaimer')} /></div>
    </div>
  );
}
