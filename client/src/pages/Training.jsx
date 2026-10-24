import { useQuery } from '@tanstack/react-query';
import { Shirt, ShieldAlert, Trophy } from 'lucide-react';
import { api } from '../lib/api.js';
import { useT } from '../i18n/index.js';
import { useStartSession } from '../lib/useStart.js';
import { Card, PageHeader, Stat, Meter, Skeleton } from '../components/ui.jsx';
import { ModeTile, RecentSessions } from './Home.jsx';

export default function Training() {
  const t = useT();
  const start = useStartSession();
  const q = useQuery({ queryKey: ['sessions'], queryFn: () => api('/sessions') });
  const practice = (q.data || []).filter((s) => s.mode === 'training' && s.trainingScore != null);
  const best = practice.length ? Math.max(...practice.map((s) => s.trainingScore)) : null;
  const avg = practice.length ? Math.round(practice.reduce((a, s) => a + s.trainingScore, 0) / practice.length) : null;
  const pending = start.isPending ? start.variables?.protocolKey : null;
  return (
    <div>
      <PageHeader title={t('home.training')} subtitle={t('home.trainingDesc')} />
      <div className="grid gap-4 md:grid-cols-3">
        <ModeTile icon={Shirt} title={t('home.practiceDon')} desc={t('home.donningDesc')} meta={`10 ${t('home.steps')}`} busy={pending === 'donning-papr'} onClick={() => start.mutate({ protocolKey: 'donning-papr', mode: 'training' })} />
        <ModeTile icon={ShieldAlert} tone="danger" title={t('home.practiceDoff')} desc={t('home.doffingDesc')} meta={`18 ${t('home.steps')}`} busy={pending === 'doffing-papr'} onClick={() => start.mutate({ protocolKey: 'doffing-papr', mode: 'training' })} />
        <Card icon={Trophy} title={t('summary.score')}>
          {q.isLoading ? <div className="space-y-3"><Skeleton className="h-8 w-20" /><Skeleton className="h-6" /></div> : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><Stat label="Best" value={best ?? '—'} /><Stat label="Avg." value={avg ?? '—'} /></div>
              <Meter value={avg ?? 0} tone="ok" label="Average practice score" />
              <p className="text-xs text-ink-muted">{practice.length} {t('nav.sessions').toLowerCase()}</p>
            </div>)}
        </Card>
      </div>
      <div className="mt-10"><RecentSessions /></div>
    </div>
  );
}
