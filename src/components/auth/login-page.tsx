'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import {
  User, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, Shield, AtSign,
  Crown, Building2, Users, BookOpen, Heart, Sparkles, GraduationCap, ArrowLeft,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ==================== Floating Input ====================
function FloatingInput({
  id, type, placeholder, icon, value, onChange, error, success, togglePassword, showPassword, autoComplete,
}: any) {
  return (
    <div className="login-input-wrapper">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10">{icon}</div>
      <input
        id={id} type={type} value={value} onChange={onChange} autoComplete={autoComplete}
        className={`login-input w-full h-12 pl-11 ${togglePassword ? 'pr-11' : 'pr-4'} rounded-xl border bg-white text-gray-800 text-sm outline-none transition-all ${
          error ? 'border-red-400' : success ? 'border-green-400' : 'border-gray-200 focus:border-amber-500'
        }`}
        placeholder=" "
      />
      <label className="floating-label">{placeholder}</label>
      {togglePassword && (
        <button type="button" onClick={togglePassword} className="eye-toggle absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
}

// ==================== Particle Background ====================
function ParticleBackground() {
  const particles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 15,
    duration: 12 + Math.random() * 10,
    drift: (Math.random() - 0.5) * 60,
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: `${p.left}%`, '--delay': `${p.delay}s`, '--duration': `${p.duration}s`, '--drift': `${p.drift}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

// ==================== Floating Shapes ====================
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="float-shape-1 absolute top-10 left-10 w-16 h-16 rounded-2xl bg-white/5 border border-white/10" />
      <div className="float-shape-2 absolute top-20 right-12 w-12 h-12 rounded-full bg-white/5 border border-white/10" />
      <div className="float-shape-3 absolute bottom-16 left-16 w-14 h-14 rounded-xl bg-white/5 border border-white/10" />
      <div className="float-shape-4 absolute bottom-10 right-20 w-10 h-10 rounded-lg bg-white/5 border border-white/10" />
    </div>
  );
}

// ==================== Cover Panel (left side) ====================
function CoverPanel() {
  return (
    <div className="cover-gradient relative flex flex-col items-center justify-center px-6 py-8 md:p-12 min-h-[200px] md:min-h-full rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
      <FloatingShapes />
      <div className="glow-circle absolute w-48 h-48 rounded-full bg-white/5 -top-10 -left-10" />
      <div className="glow-circle absolute w-36 h-36 rounded-full bg-white/5 -bottom-8 -right-8" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center">
        {/* Logo icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex h-16 w-16 rounded-2xl bg-white/15 backdrop-blur items-center justify-center mb-5 border border-white/20"
        >
          <GraduationCap className="h-8 w-8 text-amber-300" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-2xl md:text-3xl font-bold text-white mb-2"
        >
          Welcome to eSM
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-white/70 text-sm md:text-base max-w-[240px] mx-auto"
        >
          Electronic School Management — one platform for your entire institution.
        </motion.p>

        {/* Feature bullets */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 space-y-2.5 text-left max-w-[220px] mx-auto"
        >
          {[
            { icon: Shield, text: 'Role-based secure access' },
            { icon: Building2, text: 'Multi-tenant by design' },
            { icon: Sparkles, text: '22 integrated modules' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-2.5 text-white/80 text-sm">
              <div className="h-7 w-7 rounded-lg bg-white/10 grid place-items-center shrink-0">
                <f.icon className="h-3.5 w-3.5 text-amber-300" />
              </div>
              {f.text}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ==================== Role Definitions ====================
type Role = 'super-admin' | 'institute-admin' | 'branch-manager' | 'teacher' | 'student' | 'parent';

const ROLES: { id: Role; label: string; icon: any; demo?: { email: string; password: string }; note: string }[] = [
  { id: 'super-admin', label: 'Super Admin', icon: Crown, demo: { email: 'owner@esm-platform.com', password: 'esm123' }, note: 'Owns the platform. Provisions institutions.' },
  { id: 'institute-admin', label: 'Institute', icon: Building2, note: 'Login created by Super Admin.' },
  { id: 'branch-manager', label: 'Branch', icon: Users, note: 'Login created by Institute Admin.' },
  { id: 'teacher', label: 'Teacher', icon: BookOpen, note: 'Login created by Branch Manager.' },
  { id: 'student', label: 'Student', icon: User, note: 'Login created by Branch Manager.' },
  { id: 'parent', label: 'Parent', icon: Heart, note: 'Login created by Branch Manager.' },
];

// ==================== Login Form with Role Selector ====================
function LoginForm({ setView }: { setView: (v: any) => void }) {
  const setUser = useApp(s => s.setUser);
  const setToken = useApp(s => s.setToken);
  const [role, setRole] = useState<Role>('super-admin');
  const [email, setEmail] = useState('owner@esm-platform.com');
  const [password, setPassword] = useState('esm123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activeRole = ROLES.find(r => r.id === role)!;

  const pickRole = (r: Role) => {
    setRole(r);
    const def = ROLES.find(x => x.id === r)!;
    if (def.demo) { setEmail(def.demo.email); setPassword(def.demo.password); }
    else { setEmail(''); setPassword(''); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast({ title: 'Email and password required', variant: 'destructive' }); return; }

    // Ripple effect
    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${rect.width / 2}px`;
      ripple.style.top = `${rect.height / 2}px`;
      ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white flex flex-col justify-center p-6 sm:p-8 md:p-10 rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
      <div className="slide-up">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Sign In</h2>
        <p className="text-gray-400 text-xs sm:text-sm mb-4">Select your role and enter credentials</p>
      </div>

      {/* Role selector grid */}
      <div className="grid grid-cols-3 gap-2 mb-5 slide-up slide-up-delay-1">
        {ROLES.map(r => {
          const isActive = role === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => pickRole(r.id)}
              className={`role-pill flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-transparent shadow-md text-white'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
              }`}
            >
              <r.icon className="h-4 w-4" />
              <span className="text-[10px] font-semibold">{r.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="slide-up slide-up-delay-2">
          <FloatingInput
            id="login-email" type="email" placeholder="Email Address" icon={<Mail size={18} />}
            value={email} onChange={(e: any) => setEmail(e.target.value)}
            success={email && /\S+@\S+\.\S+/.test(email)} autoComplete="email"
          />
        </div>

        <div className="slide-up slide-up-delay-3">
          <FloatingInput
            id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Password" icon={<Lock size={18} />}
            value={password} onChange={(e: any) => setPassword(e.target.value)}
            success={password.length >= 4} togglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword} autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between slide-up slide-up-delay-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="custom-checkbox w-4 h-4 rounded" />
            <span className="text-sm text-gray-500">Remember me</span>
          </label>
          <button type="button" className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
            Forgot password?
          </button>
        </div>

        <div className="slide-up slide-up-delay-4">
          <motion.button
            ref={buttonRef} type="submit" disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="btn-gradient w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <div className="spinner" />
            ) : (
              <>Sign in as {activeRole.label} <ArrowRight size={18} /></>
            )}
          </motion.button>
        </div>
      </form>

      {/* Role-specific info */}
      <div className="slide-up slide-up-delay-5 mt-4">
        {activeRole.demo ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-700 text-xs font-medium mb-1">
              <Sparkles className="h-3 w-3" /> Demo credentials (pre-filled)
            </div>
            <div className="text-amber-800/70 text-[11px] font-mono">{activeRole.demo.email} · {activeRole.demo.password}</div>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
            <p className="text-emerald-800 text-[11px]">{activeRole.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Main Login Page ====================
export function LoginPage() {
  const setView = useApp(s => s.setView);
  return (
    <div className="login-bg flex items-center justify-center min-h-screen p-3 sm:p-4 md:p-6 relative">
      <ParticleBackground />

      {/* Back button */}
      <button onClick={() => setView('landing')} className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-white/70 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" /> Home
      </button>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-[900px]"
      >
        <div className="flex flex-col md:flex-row rounded-2xl shadow-2xl shadow-black/30 overflow-hidden bg-white" style={{ minHeight: '560px' }}>
          <div className="w-full md:w-[45%]">
            <CoverPanel />
          </div>
          <div className="w-full md:w-[55%]">
            <LoginForm setView={setView} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
