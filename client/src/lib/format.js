export const riskTone = (s) => (s == null ? 'neutral' : s >= 70 ? 'danger' : s >= 35 ? 'warn' : 'ok');
export const riskLevel = (s) => (s >= 70 ? 'high' : s >= 35 ? 'moderate' : 'low');
export const fmtDate = (d, lang) => new Date(d).toLocaleDateString(lang === 'sw' ? 'sw-KE' : 'en-KE', { day: 'numeric', month: 'short' });
export const fmtTime = (d, lang) => new Date(d).toLocaleTimeString(lang === 'sw' ? 'sw-KE' : 'en-KE', { hour: '2-digit', minute: '2-digit' });
export const minutes = (a, b) => (a && b ? Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000)) : null);
