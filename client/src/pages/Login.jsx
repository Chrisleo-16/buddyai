import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, HardHat, ClipboardCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth, usePrefs } from '../store/auth.js';
import { useT } from '../i18n/index.js';
import { ICON, Segmented, Disclaimer } from '../components/ui.jsx';

export default function Login() {
  const t = useT();
  const nav = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const { lang, setLang } = usePrefs();
  const [email, setEmail] = useState('worker@buddy.ai');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e, creds) {
    e?.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api('/auth/login', { method: 'POST', body: creds || { email, password } });
      setAuth(r.token, r.user);
      nav(r.user.role === 'worker' ? '/' : '/dashboard');
    } catch { setErr(t('login.error')); } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm animate-in">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-btn bg-ink text-paper"><ShieldCheck size={18} strokeWidth={1.5} /></span><span className="text-md font-medium">BuddyAI</span></div>
          <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: 'en', label: 'EN' }, { value: 'sw', label: 'SW' }]} />
        </div>
        <div className="card"><div className="card-body p-6">
          <h1 className="text-lg font-medium">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('login.subtitle')}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block"><span className="label">{t('login.email')}</span><input className="input mt-2" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="block"><span className="label">{t('login.password')}</span><input className="input mt-2" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            {err && <p role="alert" className="text-sm text-danger">{err}</p>}
            <button className="btn-primary btn-lg w-full" disabled={busy}>{busy ? <Loader2 {...ICON} className="animate-spin" /> : <>{t('login.submit')}<ArrowRight {...ICON} /></>}</button>
          </form>
        </div></div>
        <div className="mt-6">
          <p className="mb-2 px-1 text-xs text-ink-subtle">{t('login.demo')}</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary h-10" onClick={() => submit(null, { email: 'worker@buddy.ai', password: 'buddy-demo-2026' })}><HardHat {...ICON} />{t('login.worker')}</button>
            <button className="btn-secondary h-10" onClick={() => submit(null, { email: 'supervisor@buddy.ai', password: 'buddy-demo-2026' })}><ClipboardCheck {...ICON} />{t('login.supervisor')}</button>
          </div>
        </div>
        <div className="mt-8"><Disclaimer text={t('disclaimer')} /></div>
      </div>
    </div>
  );
}
