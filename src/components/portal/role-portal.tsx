'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/store';
import { ROLE_MODULES, roleAccent } from '@/lib/role-modules';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, Search, Bell, Menu, LogOut,
  PanelLeftClose, PanelLeft, Crown, Building2, Users, BookOpen, User, Heart, Shield,
} from 'lucide-react';

import { SuperAdminPortal } from './super-admin-portal';
import { InstituteAdminPortal } from './institute-admin-portal';
import { BranchManagerPortal } from './branch-manager-portal';
import { TeacherPortal } from './teacher-portal';
import { StudentPortal } from './student-portal';
import { ParentPortal } from './parent-portal';
import { SettingsPage } from './settings-page';
import { setOnBlocked } from '@/lib/api';

const roleIcon: Record<string, any> = {
  'super-admin': Crown, 'institute-admin': Building2, 'branch-manager': Users,
  'teacher': BookOpen, 'student': User, 'parent': Heart,
};

function SidebarContent({ role, collapsed, groupOpen, setGroupOpen, activeModule, setActiveModule, setMobileOpen, user, logout }: any) {
  const groups = ROLE_MODULES[role] || [];
  const accent = roleAccent[role];
  const RoleIcon = roleIcon[role] || GraduationCap;
  return (
    <div className="flex flex-col h-full text-sidebar-foreground">
      <div className={cn('flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border shrink-0', collapsed && 'justify-center px-2')}>
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary grid place-items-center shrink-0 shadow-sm">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <div className="font-bold text-base text-white tracking-tight">ESM</div>
            <div className="text-[10px] text-sidebar-foreground/60 truncate">{user?.roleLabel || 'Portal'}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scroll-fancy px-2 py-3 space-y-0.5">
        {groups.map((group: any) => {
          const isOpen = groupOpen[group.group];
          return (
            <div key={group.group} className="mb-2">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {group.group}
                </div>
              )}
              <div className={cn(!isOpen && !collapsed && 'hidden')}>
                {group.items.map((m: any) => {
                  const isActive = activeModule === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setActiveModule(m.id); setMobileOpen(false); }}
                      title={collapsed ? m.name : undefined}
                      className={cn(
                        'group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition',
                        collapsed && 'justify-center',
                        isActive
                          ? 'bg-sidebar-accent text-white font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white'
                      )}
                    >
                      <m.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{m.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-accent text-white text-xs font-medium">
                {user?.name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-white truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate">{user?.roleLabel}</div>
            </div>
            <button onClick={logout} title="Sign out" className="h-7 w-7 grid place-items-center rounded-md text-sidebar-foreground/60 hover:text-rose-400 hover:bg-rose-500/20 transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={logout} title="Sign out" className="w-full h-9 grid place-items-center rounded-lg text-sidebar-foreground/70 hover:text-rose-400 hover:bg-rose-500/20 transition">
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function RolePortal() {
  const { user, activeModule, setActiveModule, logout } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null);
  const role = user?.role || 'student';
  const groups = ROLE_MODULES[role] || [];
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g: any) => [g.group, true]))
  );
  const accent = roleAccent[role];
  const RoleIcon = roleIcon[role] || GraduationCap;

  // Register global blocked handler — when API returns 403/401 with "blocked",
  // show the blocked screen instead of silent errors
  useEffect(() => {
    setOnBlocked((msg: string) => {
      setBlockedMsg(msg);
    });
    return () => setOnBlocked(() => {});
  }, []);

  // Check if user has a blockedMessage from login (set by backend when institute/branch is blocked)
  // Derive blocked state directly from user — no effect needed
  const blockedFromUser = user?.blockedMessage || null;

  // Reset active module when role changes (e.g. on login)
  useEffect(() => {
    const firstModule = groups[0]?.items[0]?.id;
    if (firstModule && !groups.some((g: any) => g.items.some((m: any) => m.id === activeModule))) {
      setActiveModule(firstModule);
    }
  }, [role]);

  const allModules = useMemo(() => groups.flatMap((g: any) => g.items), [groups]);
  const active = allModules.find((m: any) => m.id === activeModule) || allModules[0] || { id: 'none', name: 'Home', icon: GraduationCap, color: 'from-primary to-primary/80' };

  const renderPortal = () => {
    if (activeModule === 'settings') return <SettingsPage user={user} />;
    switch (role) {
      case 'super-admin': return <SuperAdminPortal activeModule={activeModule} user={user} />;
      case 'institute-admin': return <InstituteAdminPortal activeModule={activeModule} user={user} />;
      case 'branch-manager': return <BranchManagerPortal activeModule={activeModule} user={user} />;
      case 'teacher': return <TeacherPortal activeModule={activeModule} user={user} />;
      case 'student': return <StudentPortal activeModule={activeModule} user={user} />;
      case 'parent': return <ParentPortal activeModule={activeModule} user={user} />;
      default: return <StudentPortal activeModule={activeModule} user={user} />;
    }
  };

  const sidebarProps = { role, collapsed, groupOpen, setGroupOpen, activeModule, setActiveModule, setMobileOpen, user, logout };

  // Blocked screen — shown when Super Admin or Institute Admin blocks access
  // Can be triggered by: 1) blockedMessage from login, 2) 403/401 from API calls
  const effectiveBlockedMsg = blockedMsg || blockedFromUser;
  if (effectiveBlockedMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-950 via-slate-950 to-rose-950 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="rounded-3xl bg-white shadow-2xl p-8 text-center">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-rose-100 items-center justify-center mb-5">
              <Shield className="h-8 w-8 text-rose-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Access Blocked</h1>
            <p className="text-sm text-slate-600 mb-1">Your access has been blocked by your administration.</p>
            <p className="text-xs text-slate-400 mb-6">{effectiveBlockedMsg}</p>
            <p className="text-xs text-slate-500 mb-6">Please contact your administrator to restore access.</p>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => { logout(); setBlockedMsg(null); }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Back to Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={cn('hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 fixed inset-y-0 left-0 z-30', collapsed ? 'w-[68px]' : 'w-64')}>
        <SidebarContent {...sidebarProps} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-40" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar">
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={cn('flex-1 flex flex-col min-w-0', collapsed ? 'lg:ml-[68px]' : 'lg:ml-64')}>
        <header className="sticky top-0 z-20 h-14 bg-card border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden h-8 w-8 grid place-items-center rounded-md hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => setCollapsed(v => !v)} className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground">
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <div className="font-semibold text-sm sm:text-base truncate">{active?.name}</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-9 h-9 w-48 lg:w-64 bg-muted/50 border-0" />
            </div>
            <button className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-accent text-muted-foreground">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border">
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user?.campus}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {/* Must change password banner */}
          {user?.mustChangePassword && activeModule !== 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl bg-accent border border-[oklch(0.6_0.04_260)] p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[oklch(0.5_0.04_260)_/_0.2] grid place-items-center shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-primary">Please change your password</div>
                  <div className="text-xs text-primary">You're using a password assigned by your administrator. Change it now to secure your account.</div>
                </div>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shrink-0" onClick={() => setActiveModule('settings')}>
                Change now
              </Button>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={activeModule} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {renderPortal()}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mt-auto border-t border-border px-6 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} ESM · Electronic School Management</span>
        </footer>
      </div>
    </div>
  );
}
