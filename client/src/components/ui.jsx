import { X, AlertCircle, RotateCw } from 'lucide-react';

export const ICON = { size: 16, strokeWidth: 1.5 };

export function Card({ icon: Icon, title, action, children, className = '', bodyClass = '' }) {
  return (
    <section className={`card animate-in ${className}`}>
      {title && (
        <header className="card-head">
          {Icon && <Icon {...ICON} className="text-ink-muted" aria-hidden />}
          <h2 className="flex-1 truncate">{title}</h2>
          {action}
        </header>
      )}
      <div className={`card-body ${bodyClass}`}>{children}</div>
    </section>
  );
}

const TONES = { ok: 'badge-ok', warn: 'badge-warn', danger: 'badge-danger', neutral: 'badge-neutral' };
export function Badge({ tone = 'neutral', icon: Icon, children }) {
  return <span className={TONES[tone]}>{Icon && <Icon size={12} strokeWidth={1.75} aria-hidden />}{children}</span>;
}

/** Segmented tick meter (value 0-100). */
export function Meter({ value = 0, tone, ticks = 24, label }) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * ticks);
  const color = tone || (value >= 70 ? 'danger' : value >= 35 ? 'warn' : 'ok');
  const fill = { ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger', ink: 'bg-ink' }[color];
  return (
    <div className="flex h-6 items-stretch gap-[3px]" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      {Array.from({ length: ticks }, (_, i) => <span key={i} className={`w-[5px] flex-1 rounded-[2px] ${i < filled ? fill : 'bg-paper-line'}`} />)}
    </div>
  );
}

export function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} aria-hidden />; }

export function SkeletonRows({ rows = 3 }) {
  return <div className="space-y-3" aria-busy="true">{Array.from({ length: rows }, (_, i) => (
    <div key={i} className="flex items-center gap-3"><Skeleton className="h-6 w-6 rounded-full" /><Skeleton className="h-3 flex-1" /><Skeleton className="h-3 w-16" /></div>
  ))}</div>;
}

/** Empty state: ghost rows + title + description + optional action. */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <div className="mb-6 w-full max-w-[220px] space-y-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex h-8 items-center gap-2 rounded-nav border border-paper-line bg-paper-raised px-2" style={{ opacity: 1 - i * 0.25 }}>
            <span className="grid h-4 w-4 place-items-center text-ink-subtle">{i === 0 && Icon ? <Icon size={12} strokeWidth={1.5} /> : <span className="h-1.5 w-1.5 rounded-full bg-paper-line" />}</span>
            <span className="h-1.5 flex-1 rounded-full bg-paper-line" />
          </div>
        ))}
      </div>
      <p className="text-base font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, description, onRetry, retryLabel = 'Retry' }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-8 text-center">
      <span className="mb-3 grid h-9 w-9 place-items-center rounded-btn bg-danger-soft text-danger"><AlertCircle {...ICON} /></span>
      <p className="text-base font-medium">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-ink-muted">{description}</p>}
      {onRetry && <button className="btn-secondary mt-4" onClick={onRetry}><RotateCw {...ICON} />{retryLabel}</button>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${checked ? 'bg-ink' : 'bg-paper-line'}`}>
      <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-paper-raised shadow-card transition-transform duration-150 ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-11 md:h-8 items-center gap-0.5 rounded-btn border border-paper-line bg-paper-sunken p-0.5">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`h-full rounded-nav px-3 text-sm font-medium transition-colors ${value === o.value ? 'bg-paper-raised text-ink shadow-card' : 'text-ink-muted hover:text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, description, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/20 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md animate-in rounded-card border border-paper-line bg-paper-raised p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-1"><h3 className="text-md font-medium">{title}</h3>{description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}</div>
          <button className="btn-ghost h-7 w-7 px-0" onClick={onClose} aria-label="Close"><X {...ICON} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm text-ink-muted">{Icon && <Icon {...ICON} />}{label}</div>
      <div className="mt-2 text-xl font-medium tabular-nums tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-muted">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-end gap-4">
      <div className="flex-1"><h1 className="text-lg font-medium tracking-tight sm:text-xl">{title}</h1>{subtitle && <p className="mt-1 text-base text-ink-muted">{subtitle}</p>}</div>
      {actions}
    </div>
  );
}

export function Disclaimer({ text }) {
  return <p className="flex items-start gap-2 rounded-inner border border-warn/20 bg-warn-soft/60 px-3 py-2 text-xs text-ink-strong"><AlertCircle size={14} strokeWidth={1.5} className="mt-px shrink-0 text-warn" />{text}</p>;
}
