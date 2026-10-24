import { usePrefs } from '../store/auth.js';
import { strings } from './strings.js';

export function translate(lang, key) {
  return key.split('.').reduce((o, k) => o?.[k], strings[lang]) ?? key.split('.').reduce((o, k) => o?.[k], strings.en) ?? key;
}
export function useT() {
  const lang = usePrefs((s) => s.lang);
  const t = (key) => translate(lang, key);
  t.lang = lang;
  t.pick = (obj) => (obj ? obj[lang] || obj.en : '');
  return t;
}
