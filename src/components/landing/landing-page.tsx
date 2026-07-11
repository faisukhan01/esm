'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroScene } from '@/components/three/hero-scene';
import { MODULES, MODULE_GROUPS } from '@/lib/modules';
import { useApp } from '@/lib/store';
import {
  GraduationCap, ArrowRight, Sparkles, ShieldCheck, Users, Building2,
  CheckCircle2, Menu, X, ChevronRight, Zap, LineChart, Bell,
  Smartphone, Mail, ArrowUpRight, PlayCircle, MessageCircleWarning,
  Lock, Layers, Globe, Rocket, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Real features the platform actually offers — no fake stats
const PLATFORM_FEATURES = [
  { icon: Layers, title: '22 Integrated Modules', desc: 'Admissions, attendance, fees, academics, HR, finance, library, transport & more — all in one place.' },
  { icon: Users, title: 'Multi-Role Portals', desc: 'Separate, scoped dashboards for Super Admins, Institute Admins, Branch Managers, Teachers, Students & Parents.' },
  { icon: Building2, title: 'Multi-Tenant SaaS', desc: 'Provision unlimited institutions. Each gets its own admin, branches, and isolated data.' },
  { icon: ShieldCheck, title: 'Role-Based Access', desc: 'Granular permissions — every user sees exactly what they need, nothing more.' },
  { icon: Smartphone, title: 'Parent Mobile App', desc: 'Parents track attendance, results, fees, diary & complaints in real time.' },
  { icon: Zap, title: 'Real-Time Data', desc: 'Live dashboards. No imports, no delays. Teachers mark attendance → parents see it instantly.' },
];

const PARENT_FEATURES = [
  { icon: Bell, title: 'Instant Notifications', desc: 'Alerts for absences, fees, results and events — pushed to the parent app.' },
  { icon: LineChart, title: 'Live Progress Tracking', desc: 'Attendance trends, subject-wise results, and GPA at a glance.' },
  { icon: ShieldCheck, title: 'Fee Payments', desc: 'View balances, pay online, download receipts — paperless and transparent.' },
  { icon: Smartphone, title: 'Daily Diary & Homework', desc: 'Teachers post assignments; parents and students see them instantly.' },
  { icon: MessageCircleWarning, title: 'Two-Way Complaints', desc: 'Raise concerns, track status, and chat with the school — all in one thread.' },
  { icon: Heart, title: 'Event Calendar', desc: 'Never miss a PTM, exam, or school event with synced calendars.' },
];

const TECH_STACK = [
  { label: 'Next.js 16', desc: 'Modern React framework' },
  { label: 'Three.js', desc: '3D visualizations' },
  { label: 'Node.js + Express', desc: 'Scalable backend API' },
  { label: 'TypeScript', desc: 'Type-safe throughout' },
  { label: 'Tailwind CSS', desc: 'Premium responsive UI' },
  { label: 'Role-Based Auth', desc: 'Secure multi-tenant access' },
];

export function LandingPage() {
  const setView = useApp(s => s.setView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('All');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filteredModules = activeGroup === 'All'
    ? MODULES
    : MODULES.filter(m => m.group === activeGroup);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-border/60 shadow-sm' : 'bg-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-emerald-500/30 blur-md group-hover:bg-emerald-500/50 transition" />
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 grid place-items-center shadow-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="font-display font-extrabold text-lg tracking-tight">eSM</div>
              <div className="text-[10px] text-muted-foreground -mt-0.5 hidden sm:block">Electronic School Management</div>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-1">
            {['Modules', 'Features', 'Parent App', 'Tech'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/60 transition">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => setView('login')}>
              Sign in
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md" onClick={() => setView('login')}>
              Launch Portal <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(v => !v)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden glass border-b border-border/60 overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {['Modules', 'Features', 'Parent App', 'Tech'].map(item => (
                  <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-accent/60 text-sm font-medium">
                    {item}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section id="top" className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
        {/* background layers */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/60 via-background to-background dark:from-emerald-950/30" />
        <div className="absolute inset-0 -z-10 bg-grid opacity-60 dark:bg-grid-dark" />
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-5">
              <Rocket className="h-3.5 w-3.5" />
              Now in early access — be among the first
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              The complete<br className="hidden sm:block" />{' '}
              <span className="emerald-text">School Management</span>{' '}
              platform built for{' '}
              <span className="gold-text">modern campuses</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              eSM unifies admissions, attendance, fees, academics, finance and parent
              communication into one elegant, secure portal. Multi-tenant by design —
              provision institutions, branches, and users with a click.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20" onClick={() => setView('login')}>
                <PlayCircle className="h-5 w-5 mr-2" /> Explore the Live Demo
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}>
                Browse Modules <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> No installation required</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Works on every device</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-emerald-600" /> Secure role-based access</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[360px] sm:h-[460px] lg:h-[520px]"
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <HeroScene className="w-full h-full" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform features (replaces fake stats) */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">Platform Capabilities</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built to run{' '}
              <span className="emerald-text">your entire institution</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              From the first inquiry to graduation day — every workflow is connected, scoped, and real-time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
                <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-amber-500/10 items-center justify-center mb-4 group-hover:scale-110 transition">
                  <f.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules showcase */}
      <section id="modules" className="py-20 sm:py-28 relative bg-gradient-to-b from-emerald-50/40 to-background dark:from-emerald-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-amber-500/40 text-amber-700 dark:text-amber-300">{MODULES.length} Integrated Modules</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Every module your institution needs,{' '}
              <span className="emerald-text">in one place</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Filter by category to explore what eSM can do.
            </p>
          </div>

          {/* group filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {['All', ...MODULE_GROUPS].map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
                  activeGroup === g
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/40'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredModules.map(m => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  className="group relative rounded-2xl border border-border/60 bg-card p-5 overflow-hidden cursor-pointer"
                  onClick={() => { setView('login'); }}
                >
                  <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${m.color} opacity-10 group-hover:opacity-20 blur-2xl transition`} />
                  <div className={`inline-flex h-11 w-11 rounded-xl bg-gradient-to-br ${m.color} items-center justify-center shadow-md mb-4`}>
                    <m.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-base mb-1 flex items-center gap-1.5">
                    {m.name}
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition" />
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{m.tagline}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.features.slice(0, 3).map(f => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{f}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Parent app deep-dive */}
      <section id="parent-app" className="py-20 sm:py-28 relative">
        <div className="absolute inset-0 bg-grid opacity-40 dark:bg-grid-dark -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-3 border-amber-500/40 text-amber-700 dark:text-amber-300">Parent Application</Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                Bring parents into the{' '}
                <span className="gold-text">learning journey</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Any notice concerning school or student reaches guardians instantly.
                Parents stay involved — from attendance to results to fee balance —
                all from a beautiful mobile experience.
              </p>
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {PARENT_FEATURES.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 grid place-items-center">
                      <f.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{f.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative w-[280px] h-[560px] rounded-[2.5rem] border-[8px] border-slate-900 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 dark:bg-slate-950 flex justify-center items-end pb-1">
                  <div className="h-1.5 w-16 rounded-full bg-slate-700" />
                </div>
                <div className="absolute inset-0 pt-7 bg-gradient-to-b from-emerald-600 to-emerald-900">
                  <div className="px-4 py-3 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] opacity-80">Good morning,</div>
                        <div className="font-bold text-sm">Parent Portal</div>
                      </div>
                      <Bell className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mx-3 mt-2 rounded-2xl bg-white p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500">ATTENDANCE</span>
                      <span className="text-[10px] text-emerald-600 font-bold">Live</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full w-[94%] bg-gradient-to-r from-emerald-500 to-emerald-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-xl bg-emerald-50 p-2.5">
                        <div className="text-[9px] text-slate-500">Fees</div>
                        <div className="text-sm font-bold text-emerald-700">Paid</div>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-2.5">
                        <div className="text-[9px] text-slate-500">GPA</div>
                        <div className="text-sm font-bold text-amber-700">3.8</div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded-full bg-emerald-500 grid place-items-center"><Bell className="h-3 w-3 text-white" /></div>
                        <div className="text-[10px] text-slate-700 font-medium">PTM scheduled Sat 10:00 AM</div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-violet-50 p-2.5">
                      <div className="text-[9px] text-slate-500">RECENT RESULT</div>
                      <div className="text-sm font-bold text-violet-700">Math Monthly · A grade</div>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -left-2 top-20 glass rounded-xl border border-border/60 shadow-lg px-3 py-2 hidden sm:block"
              >
                <div className="text-[10px] text-muted-foreground">Push notification</div>
                <div className="text-xs font-bold">Aiden was marked present</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section id="tech" className="py-20 sm:py-28 bg-gradient-to-b from-background to-emerald-50/40 dark:to-emerald-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">Built With</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Modern tech,{' '}
              <span className="emerald-text">built to scale</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A production-ready stack designed for performance, security, and growth.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TECH_STACK.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card p-5 text-center hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                <div className="font-display font-bold text-base text-emerald-700 dark:text-emerald-300">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — honest early access */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 p-8 sm:p-12 text-center text-white">
            <div className="absolute inset-0 bg-grid-dark opacity-30" />
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative">
              <Rocket className="h-8 w-8 mx-auto text-amber-300 mb-4" />
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to modernize your campus?
              </h2>
              <p className="mt-4 text-emerald-50/90 max-w-xl mx-auto">
                Explore the full eSM portal now — a live, interactive demo. Provision an
                institute, add branches, create teachers and students, and see how each
                role gets their own scoped experience.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50" onClick={() => setView('login')}>
                  Launch the Portal <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}>
                  See all modules
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 grid place-items-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-display font-extrabold text-lg">eSM</div>
                <div className="text-[10px] text-muted-foreground -mt-0.5">Electronic School Management</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Intelligent solutions for a better institution. A modern, multi-tenant school management platform.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Modules</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {MODULES.slice(0, 5).map(m => (
                <li key={m.id}><button className="hover:text-foreground transition" onClick={() => setView('login')}>{m.name}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Multi-tenant SaaS</li>
              <li>Role-based portals</li>
              <li>Real-time data</li>
              <li>Parent mobile app</li>
              <li>Secure authentication</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Get in touch</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> hello@esm-platform.com</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0" /> Available worldwide</li>
            </ul>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setView('login')}>Request Demo</Button>
          </div>
        </div>
        <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} eSM — Electronic School Management. Built for educational purposes.
        </div>
      </footer>
    </div>
  );
}
