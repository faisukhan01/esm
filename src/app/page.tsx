'use client';

import { useApp } from '@/lib/store';
import { LandingPage } from '@/components/landing/landing-page';
import { LoginPage } from '@/components/auth/login-page';
import { RolePortal } from '@/components/portal/role-portal';

export default function Home() {
  const view = useApp(s => s.view);
  const user = useApp(s => s.user);

  if (view === 'login') return <LoginPage />;
  if (view === 'portal' && user) return <RolePortal />;
  return <LandingPage />;
}
