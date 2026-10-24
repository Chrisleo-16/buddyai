import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { Package, Search, QrCode, Printer } from 'lucide-react';
import { api } from '../lib/api.js';
import { useT } from '../i18n/index.js';
import { Card, Badge, Modal, SkeletonRows, EmptyState, ErrorState, PageHeader, Segmented, ICON } from '../components/ui.jsx';

export function QrLabel({ item }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(JSON.stringify({ app: 'buddyai', sku: item.sku, unit: item.unit?.code }), { margin: 1, width: 240, color: { dark: '#1E1715', light: '#FFFFFF' } }).then(setSrc);
  }, [item]);
  return src ? <img src={src} alt={`QR ${item.sku}`} className="h-48 w-48 rounded-inner border border-paper-line" /> : <div className="skeleton h-48 w-48" />;
}

export default function Inventory() {
  const t = useT();
  const q = useQuery({ queryKey: ['inventory'], queryFn: () => api('/inventory') });
  const [term, setTerm] = useState('');
  const [unit, setUnit] = useState('all');
  const [qr, setQr] = useState(null);
  const units = useMemo(() => [...new Set((q.data || []).map((i) => i.unit?.code).filter(Boolean))], [q.data]);
  const rows = (q.data || []).filter((i) => (unit === 'all' || i.unit?.code === unit) && `${i.sku} ${t.pick(i.name)}`.toLowerCase().includes(term.toLowerCase()));
  return (
    <div>
      <PageHeader title={t('inv.title')} subtitle={t('inv.subtitle')} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs"><Search {...ICON} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" /><input className="input pl-9" placeholder={t('inv.search')} value={term} onChange={(e) => setTerm(e.target.value)} /></div>
        <Segmented label="Unit" value={unit} onChange={setUnit} options={[{ value: 'all', label: t('inv.all') }, ...units.map((u) => ({ value: u, label: u }))]} />
      </div>
      <Card icon={Package} title={`${rows.length} ${t('inv.item').toLowerCase()}`} bodyClass="p-0 overflow-x-auto">
        {q.isLoading ? <div className="p-4"><SkeletonRows rows={6} /></div> : q.isError ? <ErrorState title={t('common.error')} onRetry={q.refetch} retryLabel={t('common.retry')} />
          : !rows.length ? <EmptyState icon={Search} title={t('inv.empty')} description={t('inv.emptyDesc')} /> : (
          <table className="w-full min-w-[560px]">
            <thead><tr><th className="th">{t('inv.item')}</th><th className="th">{t('inv.sku')}</th><th className="th text-right">{t('inv.qty')}</th><th className="th text-right">{t('inv.reorder')}</th><th className="th" /><th className="th" /></tr></thead>
            <tbody>{rows.map((i) => {
              const low = i.quantity <= i.reorderLevel;
              return (
                <tr key={i._id} className="transition-colors hover:bg-paper-hover">
                  <td className="td">{t.pick(i.name)}<span className="ml-2 text-xs text-ink-subtle">{i.unit?.code}</span></td>
                  <td className="td font-mono text-xs text-ink-muted">{i.sku}</td>
                  <td className={`td text-right tabular-nums ${low ? 'text-danger' : ''}`}>{i.quantity}</td>
                  <td className="td text-right tabular-nums text-ink-muted">{i.reorderLevel}</td>
                  <td className="td"><Badge tone={low ? 'danger' : 'ok'}>{low ? t('inv.low') : t('inv.ok')}</Badge></td>
                  <td className="td text-right"><button className="btn-ghost h-7 px-2" onClick={() => setQr(i)} aria-label={`${t('inv.qr')} ${i.sku}`}><QrCode {...ICON} /></button></td>
                </tr>);
            })}</tbody>
          </table>)}
      </Card>
      <Modal open={!!qr} onClose={() => setQr(null)} title={t('inv.qr')} description={qr ? `${t.pick(qr.name)} · ${qr.sku}` : ''}>
        {qr && <div className="flex flex-col items-center gap-4"><QrLabel item={qr} /><button className="btn-secondary" onClick={() => window.print()}><Printer {...ICON} />{t('inv.print')}</button></div>}
      </Modal>
    </div>
  );
}
