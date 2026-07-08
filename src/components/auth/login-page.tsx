'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ArrowLeft, ArrowRight, Mail, Lock, ShieldCheck, Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function LoginPage() {
  const setView = useApp(s => s.setView);
  const setUser = useApp(s => s.setUser);
  const setToken = useApp(s => s.setToken);
  const [email, setEmail] = useState('admin@esm-edu.us');
  const [password, setPassword] = useState('esm123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      setUser(user);
      toast({ title: `Welcome back, ${user.name}`, description: 'Signed in to eSM Portal' });
      setView('dashboard');
    } catch (err: any) {
      toast({ title: 'Sign in failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-30" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

        <button onClick={() => setView('landing')} className="relative flex items-center gap-2 text-sm text-emerald-100/80 hover:text-white transition w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </button>

        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur grid place-items-center border border-white/20">
              <GraduationCap className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="font-display font-extrabold text-2xl">eSM</div>
              <div className="text-xs text-emerald-100/70">Electronic School Management</div>
            </div>
          </div>

          <h2 className="font-display text-4xl font-extrabold leading-tight mb-4">
            Welcome to your<br />
            <span className="gold-text">command center.</span>
          </h2>
          <p className="text-emerald-100/80 max-w-md">
            22 modules. One elegant portal. Manage admissions, attendance, fees,
            academics, HR and parent communication — all in real time.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: ShieldCheck, text: 'Role-based access for every team member' },
              { icon: Sparkles, text: 'Live dashboards with 1,248 students' },
              { icon: GraduationCap, text: 'Built on 40 years of education expertise' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/10 grid place-items-center border border-white/10">
                  <f.icon className="h-4 w-4 text-amber-300" />
                </div>
                <span className="text-sm text-emerald-50/90">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-emerald-100/60">
          © {new Date().getFullYear()} Cyber Advance Solutions · 1st LCCI IT Award
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background relative">
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <button onClick={() => setView('landing')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 grid place-items-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="font-display font-extrabold text-xl">eSM</div>
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground mt-2 text-sm">Enter your credentials to access the portal.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="pl-10 h-11" placeholder="you@school.edu" required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-emerald-600 hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} className="pl-10 pr-10 h-11" required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit" disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20"
            >
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</> : <>Sign in to portal <ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-xs">
            <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Demo credentials (pre-filled)</div>
            <div className="text-muted-foreground">Email: <span className="font-mono">admin@esm-edu.us</span></div>
            <div className="text-muted-foreground">Password: <span className="font-mono">esm123</span></div>
            <div className="text-muted-foreground mt-1.5">Any non-empty email + password works for this demo.</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
