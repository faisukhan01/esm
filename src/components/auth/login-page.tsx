'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ArrowLeft, ArrowRight, Mail, Lock, ShieldCheck, Sparkles, Eye, EyeOff, Loader2, Crown, Building2, Users, BookOpen, User, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const roleIcon: Record<string, any> = {
  'super-admin': Crown,
  'institute-admin': Building2,
  'branch-manager': Users,
  'teacher': BookOpen,
  'student': User,
  'parent': Heart,
};
const roleColor: Record<string, string> = {
  'super-admin': 'amber',
  'institute-admin': 'emerald',
  'branch-manager': 'teal',
  'teacher': 'violet',
  'student': 'cyan',
  'parent': 'rose',
};

export function LoginPage() {
  const setView = useApp(s => s.setView);
  const setUser = useApp(s => s.setUser);
  const setToken = useApp(s => s.setToken);
  const [email, setEmail] = useState('owner@esm-platform.com');
  const [password, setPassword] = useState('esm123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => { api.demoAccounts().then(setAccounts).catch(() => {}); }, []);

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

  const pickAccount = (acc: any) => {
    setEmail(acc.email);
    setPassword(acc.password);
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
            One platform.<br />
            <span className="gold-text">Five role-based portals.</span>
          </h2>
          <p className="text-emerald-100/80 max-w-md">
            From the platform owner down to a parent — every role gets a portal
            scoped exactly to what they need to see and do.
          </p>

          <div className="mt-8 space-y-2.5">
            {[
              { icon: Crown, role: 'Super Admin', text: 'You — manage all institutions, plans & revenue' },
              { icon: Building2, role: 'Institute Admin', text: 'Runs one institute, manages branches' },
              { icon: Users, role: 'Branch Manager', text: 'Runs one branch, manages teachers & students' },
              { icon: BookOpen, role: 'Teacher', text: 'Takes attendance, posts results & homework' },
              { icon: User, role: 'Student / Parent', text: 'View progress, pay fees, track attendance' },
            ].map(f => (
              <div key={f.role} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="h-8 w-8 rounded-lg bg-white/10 grid place-items-center">
                  <f.icon className="h-4 w-4 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-200">{f.role}</div>
                  <div className="text-xs text-emerald-50/70">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-emerald-100/60">
          © {new Date().getFullYear()} Cyber Advance Solutions · 1st LCCI IT Award
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-8 bg-background relative overflow-y-auto">
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <button onClick={() => setView('landing')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 grid place-items-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="font-display font-extrabold text-xl">eSM</div>
          </div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground mt-2 text-sm">Pick a role below or enter credentials manually.</p>

          {/* Role quick-pick */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {accounts.map(acc => {
              const Icon = roleIcon[acc.role] || User;
              const color = roleColor[acc.role] || 'emerald';
              const active = email === acc.email;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => pickAccount(acc)}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-xl border text-left transition',
                    active
                      ? `border-${color}-500 bg-${color}-500/10`
                      : 'border-border bg-card hover:border-emerald-500/40'
                  )}
                >
                  <div className={cn('h-8 w-8 rounded-lg grid place-items-center shrink-0', `bg-${color}-500/15`)}>
                    <Icon className={cn('h-4 w-4', `text-${color}-600`)} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{acc.label.split('(')[0].trim()}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{acc.email}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11" placeholder="you@school.edu" required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-emerald-600 hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10 h-11" required />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</> : <>Sign in to portal <ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </form>

          <div className="mt-5 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-3 text-xs">
            <div className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Demo — password is <span className="font-mono">esm123</span> for every account</div>
            <div className="text-muted-foreground">Tap a role above to auto-fill, then sign in. Each role lands on its own portal.</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
