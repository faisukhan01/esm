'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginScene } from '@/components/three/login-scene';
import { GraduationCap, ArrowLeft, ArrowRight, Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function LoginPage() {
  const setView = useApp(s => s.setView);
  const setUser = useApp(s => s.setUser);
  const setToken = useApp(s => s.setToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950">
      {/* 3D background */}
      <div className="absolute inset-0">
        <LoginScene className="w-full h-full" />
      </div>
      {/* gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-emerald-950/60" />
      <div className="absolute inset-0 bg-grid-dark opacity-20" />

      {/* back button */}
      <button onClick={() => setView('landing')} className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-emerald-100/70 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" /> Home
      </button>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="relative rounded-3xl glass border border-white/15 shadow-2xl overflow-hidden">
          {/* top accent bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

          <div className="p-8 sm:p-10">
            {/* logo + heading */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 items-center justify-center shadow-lg shadow-emerald-500/30 mb-4"
              >
                <GraduationCap className="h-7 w-7 text-white" />
              </motion.div>
              <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Welcome to eSM</h1>
              <p className="text-emerald-100/60 text-sm mt-1.5">Sign in to access your portal</p>
            </div>

            {/* form */}
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-emerald-100/80 text-xs font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                  <Input
                    id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-emerald-100/30 focus:bg-white/10 focus:border-emerald-400/50 rounded-xl transition"
                    placeholder="you@school.edu" required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-emerald-100/80 text-xs font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                  <Input
                    id="password" type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-emerald-100/30 focus:bg-white/10 focus:border-emerald-400/50 rounded-xl transition"
                    placeholder="••••••••" required
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-100/40 hover:text-emerald-100/80 transition">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit" disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/30 rounded-xl border border-emerald-400/20 transition-all"
              >
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </form>

            {/* demo hint — minimal */}
            <div className="mt-6 rounded-xl bg-amber-400/5 border border-amber-400/15 p-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-300/80 text-xs font-medium mb-1">
                <Sparkles className="h-3 w-3" /> Super Admin Demo
              </div>
              <div className="text-emerald-100/50 text-[11px] font-mono">owner@esm-platform.com · esm123</div>
            </div>
          </div>
        </div>

        {/* footer */}
        <p className="text-center text-emerald-100/40 text-xs mt-6">
          New institutions are added by the Super Admin
        </p>
      </motion.div>
    </div>
  );
}
