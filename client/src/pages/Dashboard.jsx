import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Activity, ShieldAlert, Gauge, BarChart3, Building2, TriangleAlert, PackageX, BadgeCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api.js';
import { useT } from '../i18n/index.js';
import { fmtDate } from '../lib/format.js';
import { Card, Badge, Meter, Stat, Skeleton, SkeletonRows, EmptyState, ErrorState, PageHeader, ICON } from '../components/ui.jsx';

const CERT = { certified: 'ok', due: 'warn', expired: 'danger', in_training: 'neutral' };

function ChartTip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-nav bg-ink px-2 py-1 text-xs text-paper shadow-pop">{fmtDate(label, t.lang)} · {payload.map((p) => `${p.value} ${t(`dash.${p.dataKey}`).toLowerCase()}`).join(' · ')}</div>;
}

export default function Dashboard() {
  const t = useT();
  const q = useQuery({ queryKey: ['dashboard'], queryFn: () => api('/dashboard') });
  if (q.isError) return <ErrorState title={t('dash.error')} onRetry={q.refetch} retryLabel={t('dash.retry')} />;
  const d = q.data;
  return (
    <div>
      <PageHeader title={t('dash.title')} subtitle={t('dash.subtitle')} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[[Users, 'workers', d?.totals.workers], [Activity, 'sessions', d?.totals.sessions], [ShieldAlert, 'highRisk', d?.totals.highRisk], [Gauge, 'avgRisk', d?.totals.avgRisk]].map(([I, k, v]) => (
          <Card key={k} icon={I} title={t(`dash.${k}`)}>{q.isLoading ? <Skeleton className="h-8 w-16" /> : <><div className="text-xl font-medium tabular-nums tracking-tight">{v}</div>{k === 'avgRisk' && <div className="mt-3"><Meter value={v} ticks={20} label={t('dash.avgRisk')} /></div>}</>}</Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card icon={BarChart3} title={t('dash.chart')} className="lg:col-span-2" action={<div className="flex items-center gap-3 text-xs text-ink-muted"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] bg-ink" />{t('dash.live')}</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] bg-[#CFC6BC]" />{t('dash.training')}</span></div>}>
          {q.isLoading ? <Skeleton className="h-56" /> : (
            <div className="h-56" data-testid="sessions-chart"><ResponsiveContainer>
              <BarChart data={d.chart} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="#ECE7E0" strokeDasharray="2 4" />
                <XAxis dataKey="day" tickFormatter={(v) => fmtDate(v, t.lang)} tick={{ fontSize: 12, fill: '#9A908C' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
                <YAxis allowDecimals={false} width={24} tick={{ fontSize: 12, fill: '#9A908C' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F4F0EA' }} content={<ChartTip t={t} />} />
                <Bar dataKey="live" stackId="a" fill="#1E1715" radius={[0, 0, 3, 3]} />
                <Bar dataKey="training" stackId="a" fill="#CFC6BC" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>)}
        </Card>
        <Card icon={Building2} title={t('dash.readiness')}>
          {q.isLoading ? <SkeletonRows rows={2} /> : <div className="space-y-6">{d.readiness.map((r) => (
            <div key={r.unit._id}>
              <div className="flex items-baseline justify-between"><p className="text-base font-medium">{r.unit.name}</p><span className="text-lg font-medium tabular-nums">{r.score}</span></div>
              <p className="mb-2 text-xs text-ink-muted">{r.certified}/{r.workers} {t('dash.certified')} · {r.stockOk}/{r.stockTotal} {t('dash.stock')}</p>
              <Meter value={r.score} tone={r.score >= 75 ? 'ok' : r.score >= 50 ? 'warn' : 'danger'} ticks={20} label={r.unit.name} />
            </div>))}</div>}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card icon={BadgeCheck} title={t('dash.team')} className="lg:col-span-2" bodyClass="p-0 overflow-x-auto">
          {q.isLoading ? <div className="p-4"><SkeletonRows rows={5} /></div> : (
            <table className="w-full min-w-[480px]">
              <thead><tr><th className="th">{t('dash.name')}</th><th className="th">{t('dash.unit')}</th><th className="th">{t('dash.status')}</th><th className="th text-right">{t('dash.expires')}</th></tr></thead>
              <tbody>{d.workers.map((w) => (
                <tr key={w._id} className="transition-colors hover:bg-paper-hover">
                  <td className="td"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-paper-sunken text-[11px] font-medium">{w.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>{w.name}</div></td>
                  <td className="td text-ink-muted">{w.unit?.code}</td>
                  <td className="td"><Badge tone={CERT[w.certification?.status]}>{t(`cert.${w.certification?.status}`)}</Badge></td>
                  <td className="td text-right text-sm tabular-nums text-ink-muted">{w.certification?.expiresAt ? fmtDate(w.certification.expiresAt, t.lang) : '—'}</td>
                </tr>))}</tbody>
            </table>)}
        </Card>
        <div className="space-y-4">
          <Card icon={TriangleAlert} title={t('dash.violations')} bodyClass="p-0">
            {q.isLoading ? <div className="p-4"><SkeletonRows rows={4} /></div> : !d.violations.length ? <EmptyState icon={TriangleAlert} title={t('dash.noViolations')} description={t('dash.noViolationsDesc')} /> : (
              <ul>{d.violations.slice(0, 6).map((v, i) => (
                <li key={i} className="border-t border-paper-line first:border-t-0"><Link to={`/sessions/${v.session}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-paper-hover">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{v.worker}</p><p className="truncate text-xs text-ink-muted">{v.kind}{v.order ? ` · step ${v.order}` : ''} · {fmtDate(v.at, t.lang)}</p></div>
                  <Badge tone={v.type === 'high_risk' ? 'danger' : 'warn'}>{t(`dash.${v.type}`)}</Badge></Link></li>))}</ul>)}
          </Card>
          <Card icon={PackageX} title={t('dash.stockAlerts')} bodyClass="p-0">
            {q.isLoading ? <div className="p-4"><SkeletonRows rows={3} /></div> : !d.lowStock.length ? <EmptyState title={t('dash.noAlerts')} /> : (
              <ul>{d.lowStock.map((i) => (
                <li key={i._id} className="flex items-center gap-3 border-t border-paper-line px-4 py-2.5 first:border-t-0">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm">{t.pick(i.name)}</p><p className="text-xs text-ink-muted">{i.unit?.code}</p></div>
                  <span className="text-sm tabular-nums text-danger">{i.quantity}</span><span className="text-xs text-ink-subtle">/ {i.reorderLevel}</span></li>))}</ul>)}
          </Card>
        </div>
      </div>
    </div>
  );
}
