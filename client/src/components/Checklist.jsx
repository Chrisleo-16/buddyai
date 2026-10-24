import { CheckCircle2, CircleDashed, AlertTriangle, XCircle } from 'lucide-react';
import { useT } from '../i18n/index.js';
import { ICON, EmptyState } from './ui.jsx';

export function mergeItems(expected = [], detected = []) {
  const map = new Map(expected.map((n) => [n.toLowerCase(), { name: n, status: 'unknown' }]));
  for (const d of detected) {
    const key = d.name.toLowerCase();
    map.set(key, { name: map.get(key)?.name || d.name, status: !d.present ? 'missing' : d.correct ? 'ok' : 'incorrect', issue: d.issue, confidence: d.confidence });
  }
  return [...map.values()];
}

const S = {
  ok: { icon: CheckCircle2, cls: 'text-ok', key: 'coach.present' },
  incorrect: { icon: AlertTriangle, cls: 'text-warn', key: 'coach.incorrect' },
  missing: { icon: XCircle, cls: 'text-danger', key: 'coach.missing' },
  unknown: { icon: CircleDashed, cls: 'text-ink-subtle', key: 'coach.notVerified' },
};

export default function Checklist({ items }) {
  const t = useT();
  if (!items.length) return <EmptyState title={t('coach.noItems')} description={t('coach.noItemsDesc')} />;
  return (
    <ul className="divide-y divide-paper-line" aria-label={t('coach.checklist')}>
      {items.map((it) => {
        const s = S[it.status];
        return (
          <li key={it.name} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0" data-status={it.status}>
            <s.icon {...ICON} className={`mt-0.5 shrink-0 ${s.cls}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-base capitalize">{it.name}</p>
              {it.issue && <p className="text-xs text-ink-muted">{it.issue}</p>}
            </div>
            <span className={`text-xs ${s.cls}`}>{t(s.key)}</span>
          </li>
        );
      })}
    </ul>
  );
}
