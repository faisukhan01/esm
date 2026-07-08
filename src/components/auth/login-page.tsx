'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginScene } from '@/components/three/login-scene';
import {
  GraduationCap, ArrowLeft, ArrowRight, Mail, Lock, Eye, EyeOff, Loader2, Sparkles,
  Crown, Building2, Users, BookOpen, User, Heart, Info, Shield,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Role = 'super-admin' | 'institute-admin' | 'branch-manager' | 'teacher' | 'student' | 'parent';

const ROLES: { id: Role; label: string; icon: any; gradient: string; demo?: { email: string; password: string }; note: string }[] = [
  { id: 'super-admin', label: 'Super Admin', icon: Crown, gradient: 'from-amber-500 to-orange-600', demo: { email: 'owner@esm-platform.com', password: 'esm123' }, note: 'You own the platform. Provision institutes and manage everything.' },
  { id: 'institute-admin', label: 'Institute', icon: Building2, gradient: 'from-emerald-500 to-emerald-700', note: 'Your login is created by the Super Admin when your institute is provisioned.' },
  { id: 'branch-manager', label: 'Branch', icon: Users, gradient: 'from-teal-500 to-cyan-600', note: 'Your login is created by your Institute Admin when your branch is added.' },
  { id: 'teacher', label: 'Teacher', icon: BookOpen, gradient: 'from-violet-500 to-purple-600', note: 'Your login is created by your Branch Manager.' },
  { id: 'student', label: 'Student', icon: User, gradient: 'from-cyan-500 to-teal-600', note: 'Your login is created by your Branch Manager.' },
  { id: 'parent', label: 'Parent', icon: Heart, gradient: 'from-rose-500 to-pink-600', note: 'Your login is created by your Branch Manager and linked to your ward.' },
];

export function LoginPage() {
  const setView = useApp(s => s.setView);
  const setUser = useApp(s => s.setUser);
  const setToken = useApp(s => s.setToken);
  const [role, setRole] = useState<Role>('super-admin');
  const [email, setEmail] = useState('owner@esm-platform.com');
  const [password, setPassword] = useState('esm123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeRole = ROLES.find(r => r.id === role)!;

  const pickRole = (r: Role) => {
    setRole(r);
    const def = ROLES.find(x => x.id === r)!;
    if (def.demo) { setEmail(def.demo.email); setPassword(def.demo.password); }
    else { setEmail(''); setPassword(''); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      setUser(user);
      toast({ title: `Welcome, ${user.name}`, description: `Signed in as ${user.roleLabel}` });
      setView('portal');
    } catch (err: any) {
      const msg = err.message.includes('401') ? 'Invalid email or password' : err.message;
      toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 py-8">
      {/* 3D educational background */}
      <div className="absolute inset-0">
        <LoginScene className="w-full h-full" />
      </div>
      {/* warm gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-amber-950/10 to-emerald-950/70" />

      {/* back button */}
      <button onClick={() => setView('landing')} className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-emerald-100/70 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" /> Home
      </button>

      {/* Login card — clean white, premium contrast */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px] mx-4"
      >
        <div className="relative rounded-[1.75rem] bg-white shadow-2xl overflow-hidden ring-1 ring-black/5">
          {/* top accent bar — color shifts with role */}
          <motion.div
            className={`h-1.5 bg-gradient-to-r ${activeRole.gradient}`}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />

          <div className="p-7 sm:p-8">
            {/* logo + heading */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className={`inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br ${activeRole.gradient} items-center justify-center shadow-lg mb-4`}
              >
                <activeRole.icon className="h-7 w-7 text-white" />
              </motion.div>
              <h1 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">Welcome to eSM</h1>
              <p className="text-slate-500 text-sm mt-1">Select your role and sign in</p>
            </div>

            {/* Role selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {ROLES.map(r => {
                const isActive = role === r.id;
                return (
                  <motion.button
                    key={r.id}
                    type="button"
                    onClick={() => pickRole(r.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      isActive
                        ? `bg-gradient-to-br ${r.gradient} border-transparent shadow-md text-white`
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <r.icon className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">{r.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* form */}
            <form onSubmit={submit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 text-xs font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl transition"
                    placeholder="you@school.edu" required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password" type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl transition"
                    placeholder="••••••••" required
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit" disabled={loading}
                className={`w-full h-11 bg-gradient-to-r ${activeRole.gradient} hover:brightness-110 text-white shadow-lg rounded-xl border-0 transition-all`}
              >
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</> : <>Sign in as {activeRole.label} <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </form>

            {/* Role-specific info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-5"
              >
                {activeRole.demo ? (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                    <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium mb-1.5">
                      <Sparkles className="h-3 w-3" /> Demo credentials (pre-filled)
                    </div>
                    <div className="text-amber-800/70 text-[11px] font-mono">{activeRole.demo.email}</div>
                    <div className="text-amber-800/70 text-[11px] font-mono">password: {activeRole.demo.password}</div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5">
                    <div className="flex items-start gap-2">
                      <Info className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <p className="text-emerald-800 text-[11px] leading-relaxed">{activeRole.note}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* footer inside card */}
          <div className="px-7 pb-5 -mt-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Shield className="h-3 w-3" /> Secured by eSM · Electronic School Management
            </div>
          </div>
        </div>

        {/* below-card text */}
        <p className="text-center text-emerald-100/50 text-xs mt-5">
          Don't have an account? Contact your administrator.
        </p>
      </motion.div>
    </div>
  );
}
