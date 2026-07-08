'use client';

import { useApp } from '@/lib/store';
import { LandingPage } from '@/components/landing/landing-page';
import { LoginPage } from '@/components/auth/login-page';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function Home() {
  const view = useApp(s => s.view);

  if (view === 'login') return <LoginPage />;
  if (view === 'dashboard') return <DashboardShell />;
  return <LandingPage />;
}
