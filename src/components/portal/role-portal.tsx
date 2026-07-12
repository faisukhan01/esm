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
  GraduationCap, Search, Bell, Menu, LogOut, ChevronDown, ChevronRight,
  Globe, Sparkles, PanelLeftClose, PanelLeft, Command, Crown, Building2, Users, BookOpen, User, Heart, Shield,
} from 'lucide-react';

import { SuperAdminPortal } from './super-admin-portal';
import { InstituteAdminPortal } from './institute-admin-portal';
import { BranchManagerPortal } from './branch-manager-portal';
import { TeacherPortal } from './teacher-portal';
import { StudentPortal } from './student-portal';
import { ParentPortal } from './parent-portal';
import { SettingsPage } from './settings-page';

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
      <div className={cn('flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border shrink-0', collapsed && 'justify-center px-2')}>
        <div className={cn('h-9 w-9 rounded-xl bg-gradient-to-br grid place-items-center shadow-md shrink-0', accent.from, accent.to)}>
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <div className="font-display font-extrabold text-base text-white">ESM</div>
            <div className="text-[10px] text-sidebar-foreground/60 truncate">{user?.roleLabel || 'Portal'}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scroll-fancy px-2 py-3 space-y-1">
        {groups.map((group: any) => {
          const isOpen = groupOpen[group.group];
          return (
            <div key={group.group} className="mb-1">
              {!collapsed && (
                <button
                  onClick={() => setGroupOpen((g: any) => ({ ...g, [group.group]: !g[group.group] }))}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition"
                >
                  {group.group}
                  <ChevronDown className={cn('h-3 w-3 transition', !isOpen && '-rotate-90')} />
                </button>
              )}
              <AnimatePresence initial={false}>
                {(isOpen || collapsed) && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    {group.items.map((m: any) => {
                      const isActive = activeModule === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setActiveModule(m.id); setMobileOpen(false); }}
                          title={collapsed ? m.name : undefined}
                          className={cn(
                            'group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition mb-0.5',
                            collapsed && 'justify-center',
                            isActive ? 'bg-gradient-to-r from-emerald-600/90 to-emerald-700/80 text-white shadow-md' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white'
                          )}
                        >
                          <m.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-amber-300')} />
                          {!collapsed && <span className="truncate font-medium">{m.name}</span>}
                          {!collapsed && isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-amber-300" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent/60 p-2.5">
            <Avatar className="h-9 w-9 border border-white/20">
              <AvatarFallback className={cn('bg-gradient-to-br text-white text-xs font-bold', accent.from, accent.to)}>
                {user?.name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</div>
              <div className="text-[10px] text-sidebar-foreground/60 truncate flex items-center gap-1">
                <RoleIcon className="h-2.5 w-2.5" /> {user?.roleLabel}
              </div>
            </div>
            <button onClick={logout} title="Sign out" className="h-8 w-8 grid place-items-center rounded-lg text-sidebar-foreground/70 hover:text-white hover:bg-rose-500/20 transition">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button onClick={logout} title="Sign out" className="w-full h-9 grid place-items-center rounded-lg text-sidebar-foreground/70 hover:text-white hover:bg-rose-500/20 transition">
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
  const role = user?.role || 'student';
  const groups = ROLE_MODULES[role] || [];
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g: any) => [g.group, true]))
  );
  const accent = roleAccent[role];
  const RoleIcon = roleIcon[role] || GraduationCap;

  // Reset active module when role changes (e.g. on login)
  useEffect(() => {
    const firstModule = groups[0]?.items[0]?.id;
    if (firstModule && !groups.some((g: any) => g.items.some((m: any) => m.id === activeModule))) {
      setActiveModule(firstModule);
    }
  }, [role]);

  const allModules = useMemo(() => groups.flatMap((g: any) => g.items), [groups]);
  const active = allModules.find((m: any) => m.id === activeModule) || allModules[0] || { id: 'none', name: 'Home', icon: GraduationCap, color: 'from-emerald-500 to-emerald-700' };

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

  return (
    <div className="min-h-screen flex bg-muted/30">
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
        <header className="sticky top-0 z-20 h-16 glass border-b border-border/60 flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden h-9 w-9 grid place-items-center rounded-lg hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => setCollapsed(v => !v)} className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground">
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-br grid place-items-center shrink-0', active?.color)}>
              <active.icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-sm sm:text-base truncate">{active?.name}</div>
              <div className="text-[11px] text-muted-foreground truncate hidden sm:flex items-center gap-1">
                <RoleIcon className={cn('h-2.5 w-2.5', accent.text)} />
                {user?.roleLabel} · {user?.campus}
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-9 pr-12 h-9 w-56 lg:w-72 bg-card" />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden lg:flex items-center gap-0.5">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>
            <button className="relative h-9 w-9 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate max-w-[160px]">{user?.campus}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {/* Must change password banner */}
          {user?.mustChangePassword && activeModule !== 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl bg-amber-50 border border-amber-300 p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-400/20 grid place-items-center shrink-0">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-amber-900">Please change your password</div>
                  <div className="text-xs text-amber-700">You're using a password assigned by your administrator. Change it now to secure your account.</div>
                </div>
              </div>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0" onClick={() => setActiveModule('settings')}>
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

        <footer className="mt-auto border-t border-border/60 px-6 py-3 text-xs text-muted-foreground flex items-center justify-between bg-card/40">
          <span>© {new Date().getFullYear()} ESM · Electronic School Management</span>
          <span className="hidden sm:flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-amber-500" /> Powered by Cyber Advance Solutions</span>
        </footer>
      </div>
    </div>
  );
}
