'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULES, MODULE_GROUPS } from '@/lib/modules';
import { useApp } from '@/lib/store';
import {
  GraduationCap, ArrowRight, Sparkles, ShieldCheck, Users, Building2,
  CheckCircle2, Menu, X, ChevronRight, Zap, LineChart, Bell,
  Smartphone, Mail, ArrowUpRight, PlayCircle, MessageCircleWarning,
  Lock, Layers, Globe, Rocket, Heart, Crown, CreditCard, CalendarCheck, BookOpen,
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
  const [activeGroup, setActiveGroup] = useState<string>(MODULE_GROUPS[0] || 'Overview');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const filteredModules = MODULES.filter(m => m.group === activeGroup);

  return <LandingPageInner setView={setView} menuOpen={menuOpen} setMenuOpen={setMenuOpen} activeGroup={activeGroup} setActiveGroup={setActiveGroup} scrolled={scrolled} filteredModules={filteredModules} />;
}

// ===== Hero Slider — 3 rotating educational background images =====
const HERO_SLIDES = [
  { img: 'https://sfile.chatglm.cn/images-ppt/157d0a5aed9f.jpg', caption: 'Modern campuses', sub: 'Libraries built for focus' },
  { img: 'https://sfile.chatglm.cn/images-ppt/96fea72cbfed.jpg', caption: 'Graduation day', sub: 'Celebrating every milestone' },
  { img: 'https://sfile.chatglm.cn/images-ppt/f289b20ec492.jpg', caption: 'Connected classrooms', sub: 'Technology that empowers' },
];

function HeroSlider({ setView }: { setView: (v: any) => void }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="top" className="relative h-screen min-h-[640px] w-full overflow-hidden">
      {/* Background images */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          <img src={s.img} alt={s.caption} className="w-full h-full object-cover" />
        </div>
      ))}

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

      {/* Slide dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Minimal centered text */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-1.5 text-xs font-medium text-white mb-6">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Electronic School Management
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
            One platform for{' '}
            <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">your entire</span>{' '}
            institution
          </h1>

          <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto">
            Admissions, attendance, fees, academics & parent communication — unified.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 shadow-xl" onClick={() => setView('login')}>
              Launch Portal <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <button
              onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 border-2 border-white/40 text-white hover:bg-white hover:text-slate-900 transition-all duration-300"
            >
              Explore Modules
            </button>
          </div>

          {/* Current slide caption */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="mt-10 text-white/60 text-sm"
            >
              <span className="font-semibold text-amber-300">{HERO_SLIDES[idx].caption}</span>
              <span className="mx-2">·</span>
              {HERO_SLIDES[idx].sub}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function LandingPageInner({ setView, menuOpen, setMenuOpen, activeGroup, setActiveGroup, scrolled, filteredModules }: any) {

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-border/60 shadow-sm' : 'bg-transparent'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-amber-400/40 blur-md group-hover:bg-amber-400/60 transition" />
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 grid place-items-center shadow-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="leading-tight">
              <div className={`font-display font-extrabold text-lg tracking-tight ${scrolled ? 'text-foreground' : 'text-white'}`}>ESM</div>
              <div className={`text-[10px] -mt-0.5 hidden sm:block ${scrolled ? 'text-muted-foreground' : 'text-white/60'}`}>Electronic School Management</div>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-1">
            {['Modules', 'Features', 'Parent App', 'Tech'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className={`px-3 py-2 text-sm font-medium rounded-lg transition ${scrolled ? 'text-muted-foreground hover:text-foreground hover:bg-accent/60' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className={`hidden sm:flex ${scrolled ? '' : 'text-white hover:bg-white/10 hover:text-white'}`} onClick={() => setView('login')}>
              Sign in
            </Button>
            <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90 shadow-md" onClick={() => setView('login')}>
              Launch Portal <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" size="icon" className={`md:hidden ${scrolled ? '' : 'text-white hover:bg-white/10'}`} onClick={() => setMenuOpen(v => !v)}>
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

      {/* Hero — full-bleed image slider with clean text overlay */}
      <HeroSlider setView={setView} />


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
              Filter by category to explore what ESM can do.
            </p>
          </div>

          {/* group filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {MODULE_GROUPS.map(g => (
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

            {/* Realistic Phone App Preview */}
            <div className="relative flex justify-center">
              {/* Floating notification card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-2 sm:-left-6 top-24 z-20 glass rounded-2xl border border-white/40 shadow-2xl px-4 py-3 hidden sm:block w-[200px]"
              >
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 grid place-items-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-700">Attendance marked</div>
                    <div className="text-[10px] text-slate-500">Your child is present today</div>
                  </div>
                </div>
              </motion.div>

              {/* Phone frame */}
              <motion.div
                initial={{ opacity: 0, y: 30, rotateZ: -2 }}
                whileInView={{ opacity: 1, y: 0, rotateZ: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative w-[300px] h-[620px] rounded-[3rem] bg-slate-900 p-3 shadow-2xl"
              >
                {/* Side buttons */}
                <div className="absolute -left-1 top-32 w-1 h-12 rounded-l bg-slate-800" />
                <div className="absolute -left-1 top-48 w-1 h-16 rounded-l bg-slate-800" />
                <div className="absolute -right-1 top-40 w-1 h-20 rounded-r bg-slate-800" />

                {/* Screen */}
                <div className="relative w-full h-full rounded-[2.3rem] overflow-hidden bg-slate-50">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-30" />

                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-2 pb-1 text-[10px] font-semibold text-slate-700 z-20 relative">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1.5 rounded-sm bg-slate-700" />
                        <div className="w-1 h-2 rounded-sm bg-slate-700" />
                        <div className="w-1 h-2.5 rounded-sm bg-slate-700" />
                      </div>
                      <div className="w-4 h-2 rounded-sm border border-slate-700" />
                    </div>
                  </div>

                  {/* App content — scrollable feel */}
                  <div className="px-3 pt-1 pb-4 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center">
                          <GraduationCap className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Welcome,</div>
                          <div className="text-xs font-bold text-slate-800">Sarah Johnson</div>
                        </div>
                      </div>
                      <div className="relative">
                        <Bell className="h-5 w-5 text-slate-400" />
                        <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-rose-500 border border-white" />
                      </div>
                    </div>

                    {/* Hero card — attendance */}
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 text-white shadow-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase tracking-wider opacity-80">Today's Attendance</span>
                        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">Live</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-2xl font-extrabold">94%</div>
                          <div className="text-[9px] opacity-80">Present this month</div>
                        </div>
                        <div className="flex gap-0.5 items-end">
                          {[40, 55, 35, 60, 45, 70, 50].map((h, i) => (
                            <div key={i} className="w-1 rounded-full bg-white/40" style={{ height: `${h * 0.3}px` }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick stats grid */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="h-5 w-5 rounded-md bg-amber-100 grid place-items-center"><Zap className="h-2.5 w-2.5 text-amber-600" /></div>
                          <span className="text-[9px] text-slate-400 uppercase">GPA</span>
                        </div>
                        <div className="text-lg font-bold text-slate-800">3.8</div>
                        <div className="text-[8px] text-emerald-600">▲ 0.2 this term</div>
                      </div>
                      <div className="rounded-xl bg-white p-2.5 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="h-5 w-5 rounded-md bg-emerald-100 grid place-items-center"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /></div>
                          <span className="text-[9px] text-slate-400 uppercase">Fees</span>
                        </div>
                        <div className="text-lg font-bold text-slate-800">Paid</div>
                        <div className="text-[8px] text-slate-400">Next: Jan 5</div>
                      </div>
                    </div>

                    {/* Recent result card */}
                    <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Recent Result</span>
                        <span className="text-[9px] text-emerald-600 font-medium">View all</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded bg-violet-100 grid place-items-center"><BookOpen className="h-3 w-3 text-violet-600" /></div>
                            <div>
                              <div className="text-[10px] font-semibold text-slate-700">Mathematics</div>
                              <div className="text-[8px] text-slate-400">Monthly Test</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-600">92/100</div>
                            <div className="text-[8px] text-slate-400">Grade A+</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded bg-cyan-100 grid place-items-center"><BookOpen className="h-3 w-3 text-cyan-600" /></div>
                            <div>
                              <div className="text-[10px] font-semibold text-slate-700">Physics</div>
                              <div className="text-[8px] text-slate-400">Weekly Test</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-600">88/100</div>
                            <div className="text-[8px] text-slate-400">Grade A</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notification card */}
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 mt-3 flex items-start gap-2">
                      <div className="h-6 w-6 rounded-full bg-amber-400 grid place-items-center shrink-0"><Bell className="h-3 w-3 text-white" /></div>
                      <div>
                        <div className="text-[10px] font-semibold text-slate-700">PTM Reminder</div>
                        <div className="text-[9px] text-slate-500">Saturday, 10:00 AM — Don't forget!</div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom nav bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-around">
                    <div className="flex flex-col items-center gap-0.5"><div className="h-1 w-4 rounded-full bg-emerald-600" /><GraduationCap className="h-4 w-4 text-emerald-600" /></div>
                    <CalendarCheck className="h-4 w-4 text-slate-300" />
                    <CreditCard className="h-4 w-4 text-slate-300" />
                    <Bell className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="tech" className="py-20 sm:py-28 bg-gradient-to-b from-background to-emerald-50/40 dark:to-emerald-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">How It Works</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              From signup to{' '}
              <span className="emerald-text">first day</span>{' '}
              in minutes
            </h2>
            <p className="mt-4 text-muted-foreground">
              A simple, top-down provisioning chain. Each role auto-creates the next.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-emerald-500/20 via-amber-500/40 to-emerald-500/20" />
            {[
              { step: '01', icon: Crown, title: 'Super Admin', desc: 'You provision an institute. An Institute Admin login is auto-created.', color: 'from-amber-500 to-orange-600' },
              { step: '02', icon: Building2, title: 'Institute Admin', desc: 'Adds branches. Each gets a Branch Manager login automatically.', color: 'from-emerald-500 to-emerald-700' },
              { step: '03', icon: Users, title: 'Branch Manager', desc: 'Adds teachers & students. Each gets their own portal login.', color: 'from-teal-500 to-cyan-600' },
              { step: '04', icon: BookOpen, title: 'Teachers & Parents', desc: 'Take attendance, post results, pay fees — all in real time.', color: 'from-violet-500 to-purple-600' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-border/60 bg-card p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all z-10"
              >
                <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center shadow-md mb-4`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-xs font-bold text-amber-500 mb-1">STEP {s.step}</div>
                <h3 className="font-bold text-base mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
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
                Explore the full ESM portal now — a live, interactive demo. Provision an
                institute, add branches, create teachers and students, and see how each
                role gets their own scoped experience.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50" onClick={() => setView('login')}>
                  Launch the Portal <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <button
                  onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 border-2 border-white/40 text-white hover:bg-white hover:text-emerald-800 transition-all duration-300"
                >
                  See all modules
                </button>
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
                <div className="font-display font-extrabold text-lg">ESM</div>
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
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> faisalkhan00297@gmail.com</li>
              <li className="flex items-center gap-2"><Globe className="h-4 w-4 shrink-0" /> Available worldwide</li>
            </ul>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setView('login')}>Request Demo</Button>
          </div>
        </div>
        <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ESM — Electronic School Management. Built for educational purposes.
        </div>
      </footer>
    </div>
  );
}
