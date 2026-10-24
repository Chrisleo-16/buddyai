import { useQuery } from '@tanstack/react-query';
import { Languages, Volume2, ScanEye, Cpu, Lock, UserRound, Presentation } from 'lucide-react';
import { api } from '../lib/api.js';
import { useT } from '../i18n/index.js';
import { useAuth, usePrefs } from '../store/auth.js';
import { Card, Badge, Toggle, Segmented, Skeleton, PageHeader, Disclaimer } from '../components/ui.jsx';

function Row({ title, desc, children }) {
  return <div className="flex items-center gap-4 border-t border-paper-line py-4 first:border-t-0 first:pt-0 last:pb-0"><div className="flex-1"><p className="text-base font-medium">{title}</p>{desc && <p className="mt-0.5 text-sm text-ink-muted">{desc}</p>}</div>{children}</div>;
}
function KV({ k, v }) { return <div className="flex items-center justify-between border-t border-paper-line py-3 first:border-t-0 first:pt-0 last:pb-0"><span className="text-sm text-ink-muted">{k}</span><span className="text-sm font-medium">{v}</span></div>; }

export default function Settings() {
  const t = useT();
  const p = usePrefs();
  const user = useAuth((s) => s.user);
  const h = useQuery({ queryKey: ['health'], queryFn: () => api('/health'), refetchInterval: 30_000 });
  const ai = h.data?.ai;
  return (
    <div className="max-w-3xl">
      <PageHeader title={t('settings.title')} />
      <div className="space-y-4">
        <Card icon={Languages} title={t('settings.language')}>
          <Row title={t('settings.language')} desc={t('settings.languageDesc')}><Segmented label={t('settings.language')} value={p.lang} onChange={p.setLang} options={[{ value: 'en', label: 'English' }, { value: 'sw', label: 'Kiswahili' }]} /></Row>
        </Card>
        <Card icon={ScanEye} title={t('settings.auto')}>
          <Row title={t('settings.voice')} desc={t('settings.voiceDesc')}><Toggle checked={p.voice} onChange={(v) => p.set({ voice: v })} label={t('settings.voice')} /></Row>
          <Row title={t('settings.auto')} desc={t('settings.autoDesc')}><Toggle checked={p.autoCheck} onChange={(v) => p.set({ autoCheck: v })} label={t('settings.auto')} /></Row>
          <Row title={t('settings.interval')}><Segmented label={t('settings.interval')} value={p.intervalSec} onChange={(v) => p.set({ intervalSec: v })} options={[5, 6, 8].map((n) => ({ value: n, label: `${n}s` }))} /></Row>
        </Card>
        <Card icon={Presentation} title={t('demo.title')} action={(p.demoMode || ai?.demoMode) ? <Badge tone="warn">{ai?.demoMode ? t('demo.serverOn') : t('demo.badge')}</Badge> : null}>
          <Row title={t('demo.title')} desc={t('demo.desc')}><Toggle checked={p.demoMode} onChange={(v) => p.set({ demoMode: v })} label={t('demo.title')} /></Row>
        </Card>
        <Card icon={Cpu} title={t('settings.ai')} action={h.isLoading ? null : <Badge tone={h.isError ? 'danger' : 'ok'}>{h.isError ? t('settings.offline') : t('settings.online')}</Badge>}>
          <p className="mb-4 text-sm text-ink-muted">{t('settings.aiDesc')}</p>
          {h.isLoading ? <div className="space-y-3"><Skeleton className="h-4" /><Skeleton className="h-4" /><Skeleton className="h-4" /></div> : ai ? (<div>
            <KV k={t('settings.provider')} v={<span className="capitalize">{ai.provider}</span>} />
            <KV k={t('settings.vision')} v={<span className="font-mono text-xs">{ai.models.vision}</span>} />
            <KV k={t('settings.text')} v={<span className="font-mono text-xs">{ai.models.text}</span>} />
            <KV k={t('settings.key')} v={<Badge tone={ai.keyConfigured ? 'ok' : 'danger'}>{ai.keyConfigured ? t('settings.configured') : t('settings.missing')}</Badge>} />
            <KV k={t('settings.timeout')} v={`${Math.round(ai.timeoutMs / 1000)}s`} />
          </div>) : null}
        </Card>
        <Card icon={Lock} title={t('settings.privacy')}><p className="text-sm text-ink-muted">{t('settings.privacyDesc')}</p></Card>
        <Card icon={UserRound} title={t('settings.account')}><KV k="Name" v={user?.name} /><KV k="Email" v={user?.email} /><KV k="Role" v={<span className="capitalize">{user?.role}</span>} /></Card>
        <Disclaimer text={t('disclaimer')} />
      </div>
    </div>
  );
}
