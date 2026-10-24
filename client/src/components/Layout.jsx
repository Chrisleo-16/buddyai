import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { House, GraduationCap, LayoutDashboard, Package, Settings, LogOut, ShieldCheck, Languages } from 'lucide-react';
import { useAuth, usePrefs } from '../store/auth.js';
import { useT } from '../i18n/index.js';
import { ICON, Segmented } from './ui.jsx';

function Item({ to, icon: Icon, label, mobile }) {
  if (mobile) return (
    <NavLink to={to} end className={({ isActive }) => `flex min-h-[3.5rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-nav text-[11px] font-medium transition-colors ${isActive ? 'text-ink' : 'text-ink-subtle'}`}>
      {({ isActive }) => <><span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${isActive ? 'bg-paper-sunken' : ''}`}><Icon {...ICON} aria-hidden /></span><span className="max-w-full truncate px-1">{label}</span></>}
    </NavLink>
  );
  return (
    <NavLink to={to} end className={({ isActive }) => `flex h-8 items-center gap-2 rounded-nav px-2 text-sm font-medium transition-colors ${isActive ? 'border border-paper-line bg-paper-raised text-ink shadow-card' : 'border border-transparent text-ink-muted hover:bg-paper-hover hover:text-ink'}`}>
      <Icon {...ICON} aria-hidden /><span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const t = useT();
  const { user, logout } = useAuth();
  const { lang, setLang } = usePrefs();
  const nav = useNavigate();
  const sup = user?.role !== 'worker';
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden shrink-0 flex-col gap-6 border-paper-line px-4 py-4 md:sticky md:flex md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r md:py-6">
        <div className="flex items-center gap-2 px-2">
          <span className="grid h-7 w-7 place-items-center rounded-nav bg-ink text-paper"><ShieldCheck size={16} strokeWidth={1.5} /></span>
          <span className="text-md font-medium">BuddyAI</span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Main">
          <p className="px-2 pb-1 text-xs text-ink-subtle">{t('nav.workspace')}</p>
          <Item to="/" icon={House} label={t('nav.home')} />
          <Item to="/training" icon={GraduationCap} label={t('nav.training')} />
          {sup && <p className="px-2 pb-1 pt-4 text-xs text-ink-subtle">{t('nav.supervise')}</p>}
          {sup && <Item to="/dashboard" icon={LayoutDashboard} label={t('nav.dashboard')} />}
          <Item to="/inventory" icon={Package} label={t('nav.inventory')} />
          <Item to="/settings" icon={Settings} label={t('nav.settings')} />
        </nav>
        <div className="mt-auto space-y-4">
          <div className="flex items-center gap-2 px-2 text-xs text-ink-muted"><Languages {...ICON} /><Segmented label="Language" value={lang} onChange={setLang} options={[{ value: 'en', label: 'EN' }, { value: 'sw', label: 'SW' }]} /></div>
          <div className="flex items-center gap-2 rounded-inner border border-paper-line bg-paper-raised p-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-paper-sunken text-xs font-medium">{user?.name?.split(' ').map((s) => s[0]).slice(0, 2).join('')}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user?.name}</p><p className="truncate text-xs capitalize text-ink-muted">{user?.role}</p></div>
            <button className="btn-ghost h-7 w-7 px-0" aria-label={t('nav.signOut')} onClick={() => { logout(); nav('/login'); }}><LogOut {...ICON} /></button>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-paper-line bg-paper/95 px-4 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top))] md:hidden">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-nav bg-ink text-paper"><ShieldCheck size={16} strokeWidth={1.5} /></span>
          <span className="text-md font-medium">BuddyAI</span>
        </div>
        <div className="flex items-center gap-1">
          <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: 'en', label: 'EN' }, { value: 'sw', label: 'SW' }]} />
          <button className="btn-ghost w-11 px-0" aria-label={t('nav.signOut')} onClick={() => { logout(); nav('/login'); }}><LogOut {...ICON} /></button>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-safe-nav pt-6 md:px-10 md:py-10"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-paper-line bg-paper-raised/95 px-1 pt-1 pb-safe md:hidden" aria-label="Main mobile">
        <div className="flex w-full pb-1">
          <Item mobile to="/" icon={House} label={t('nav.home')} />
          <Item mobile to="/training" icon={GraduationCap} label={t('nav.training')} />
          {sup && <Item mobile to="/dashboard" icon={LayoutDashboard} label={t('nav.dashboard')} />}
          <Item mobile to="/inventory" icon={Package} label={t('nav.inventory')} />
          <Item mobile to="/settings" icon={Settings} label={t('nav.settings')} />
        </div>
      </nav>
    </div>
  );
}
