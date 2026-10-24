import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuth = create(persist((set) => ({
  token: null, user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}), { name: 'buddyai-auth' }));

export const usePrefs = create(persist((set) => ({
  lang: 'en', voice: true, autoCheck: true, intervalSec: 6, demoMode: false,
  setLang: (lang) => set({ lang }),
  set: (patch) => set(patch),
}), { name: 'buddyai-prefs' }));
