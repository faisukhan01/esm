import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type View = 'landing' | 'login' | 'dashboard';

type AuthUser = {
  id: string; name: string; email: string; role: string; campus: string;
} | null;

type AppState = {
  view: View;
  user: AuthUser;
  token: string | null;
  activeModule: string;
  setView: (v: View) => void;
  setUser: (u: AuthUser) => void;
  setToken: (t: string | null) => void;
  setActiveModule: (m: string) => void;
  logout: () => void;
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      view: 'landing',
      user: null,
      token: null,
      activeModule: 'dashboard',
      setView: (v) => set({ view: v }),
      setUser: (u) => set({ user: u }),
      setToken: (t) => set({ token: t }),
      setActiveModule: (m) => set({ activeModule: m }),
      logout: () => set({ view: 'landing', user: null, token: null, activeModule: 'dashboard' }),
    }),
    { name: 'esm-app' }
  )
);
