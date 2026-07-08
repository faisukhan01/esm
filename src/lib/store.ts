import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type View = 'landing' | 'login' | 'portal';

export type Role = 'super-admin' | 'institute-admin' | 'branch-manager' | 'teacher' | 'student' | 'parent';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  title: string;
  status: string;
  instituteId?: string | null;
  instituteName?: string | null;
  instituteShort?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  campus: string;
  subjects?: string[];
  classes?: string[];
  class?: string;
  section?: string;
  rollNo?: string;
  guardian?: string;
  ward?: string;
  wardId?: string;
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
      setUser: (u) => set({ user: u, activeModule: 'dashboard' }),
      setToken: (t) => set({ token: t }),
      setActiveModule: (m) => set({ activeModule: m }),
      logout: () => set({ view: 'landing', user: null, token: null, activeModule: 'dashboard' }),
    }),
    { name: 'esm-app' }
  )
);
