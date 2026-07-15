'use client';

import { useApp } from '@/lib/store';
import { LandingPage } from '@/components/landing/landing-page';
import { LoginPage } from '@/components/auth/login-page';
import { RolePortal } from '@/components/portal/role-portal';
import { SuperAdminLoginPage } from '@/components/auth/super-admin-login';

// env var: NEXT_PUBLIC_APP_MODE = 'super-admin' | 'client' (default: 'client')
const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || 'client';
const IS_SUPER_ADMIN_APP = APP_MODE === 'super-admin';

export default function Home() {
  const view = useApp(s => s.view);
  const user = useApp(s => s.user);

  // Super Admin app mode: skip landing page, go straight to login
  if (IS_SUPER_ADMIN_APP) {
    if (view === 'portal' && user) return <RolePortal />;
    return <SuperAdminLoginPage />;
  }

  // Client app mode: normal flow (landing → login → portal)
  if (view === 'login') return <LoginPage />;
  if (view === 'portal' && user) return <RolePortal />;
  return <LandingPage />;
}
