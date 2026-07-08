'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroScene } from '@/components/three/hero-scene';
import { MODULES, MODULE_GROUPS } from '@/lib/modules';
import { useApp } from '@/lib/store';
import {
  GraduationCap, ArrowRight, Sparkles, ShieldCheck, Award, Users, Building2,
  Globe2, CheckCircle2, Menu, X, ChevronRight, Zap, LineChart, Bell,
  Smartphone, MapPin, Phone, Mail, Star, ArrowUpRight, PlayCircle,
  MessageCircleWarning,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATS = [
  { value: '1M+', label: 'Students Managed', icon: Users },
  { value: '10K+', label: 'Institutions', icon: Building2 },
  { value: '100K+', label: 'Staff Members', icon: ShieldCheck },
  { value: '5+', label: 'Countries', icon: Globe2 },
];

const ACHIEVEMENTS = [
  { value: '40', suffix: ' yrs', label: 'Of Education Expertise' },
  { value: '#1', suffix: '', label: 'School Management System in Pakistan' },
  { value: '1st', suffix: '', label: 'LCCI IT Award Winner' },
  { value: '22', suffix: '', label: 'Integrated Modules' },
];

const CLIENT_CATEGORIES = [
  { name: 'Schools', items: ['Unique Group of Institute', 'Punjab School System', 'The Educators', 'Universal Grammar School', 'Saint Anthony', 'Star School'] },
  { name: 'Colleges', items: ['Riphah International College', 'Superior College', 'Aspire College', 'Lead Group of Colleges', 'Pak Intec College', 'Star College'] },
  { name: 'Academies', items: ['Star Academy', 'Adliyaan Academy', 'Ajwa Academy', 'Al Tayyaba Academy', 'Meem Academy'] },
  { name: 'Medical Institutes', items: ['Indus Medical College', 'University of Modern Sciences', 'Gujrawala College of Pharmacy', 'Wazirabad College of Pharmacy'] },
  { name: 'Army Institutes', items: ['LGES', 'DHAI Islamabad'] },
  { name: 'Hotel & Tourism', items: ['Cothm', 'Ithm'] },
];

const PARENT_FEATURES = [
  { icon: Bell, title: 'Pop-Up Notifications', desc: 'Instant alerts for absences, fees, results and events.' },
  { icon: LineChart, title: 'Attendance & Results', desc: 'Track presence and grades with live progress charts.' },
  { icon: ShieldCheck, title: 'Fee Balance & History', desc: 'View balances, download receipts, pay online.' },
  { icon: Smartphone, title: 'Diary & Homework', desc: 'Daily diary and assignments right on the phone.' },
  { icon: MessageCircleWarning, title: 'Complaints System', desc: 'Raise and track concerns with two-way chat.' },
  { icon: Sparkles, title: 'Events & Calendar', desc: 'Never miss a PTM, exam, or school event.' },
];

export function LandingPage() {
  const setView = useApp(s => s.setView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('Overview');
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
            {['Modules', 'Features', 'Achievements', 'Clients'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/60 transition">
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
                {['Modules', 'Features', 'Achievements', 'Clients'].map(item => (
                  <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-accent/60 text-sm font-medium">
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
              <Award className="h-3.5 w-3.5" />
              1st LCCI IT Award · 40+ Years of Education Expertise
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              The complete<br className="hidden sm:block" />{' '}
              <span className="emerald-text">School Management</span>{' '}
              platform built for{' '}
              <span className="gold-text">modern campuses</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              eSM unifies admissions, attendance, fees, academics, finance and parent
              communication into one elegant, secure portal — trusted by 10,000+ institutions
              across 5 countries.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/20" onClick={() => setView('login')}>
                <PlayCircle className="h-5 w-5 mr-2" /> Explore the Live Demo
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}>
                Browse 22 Modules <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> No installation required</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Works on every device</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> SOC 2 ready security</span>
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
            {/* floating stat chips */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-6 left-2 sm:left-0 glass rounded-2xl border border-border/60 shadow-lg px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/15 grid place-items-center"><Users className="h-4 w-4 text-emerald-600" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Live attendance</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">94.2%</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-8 right-2 sm:right-0 glass rounded-2xl border border-border/60 shadow-lg px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-amber-500/15 grid place-items-center"><Zap className="h-4 w-4 text-amber-600" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">Fee collected (mo)</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400">$1.28M</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute top-1/2 -translate-y-1/2 right-0 glass rounded-2xl border border-border/60 shadow-lg px-4 py-3 hidden sm:block"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-violet-500/15 grid place-items-center"><Bell className="h-4 w-4 text-violet-600" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">SMS sent today</div>
                  <div className="font-bold">3,481</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 sm:mt-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-border/60 bg-card p-5 text-center hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                <s.icon className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
                <div className="text-3xl font-extrabold font-display">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules showcase */}
      <section id="modules" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">22 Integrated Modules</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Everything your institution needs,{' '}
              <span className="emerald-text">in one place</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              From the first inquiry to graduation day — every workflow is connected.
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

      {/* Features deep-dive / Parent app */}
      <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/20 relative">
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
                        <div className="font-bold text-sm">Sarah · Parent</div>
                      </div>
                      <Bell className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mx-3 mt-2 rounded-2xl bg-white p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500">ATTENDANCE</span>
                      <span className="text-[10px] text-emerald-600 font-bold">94%</span>
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

      {/* Achievements */}
      <section id="achievements" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-emerald-500/40 text-emerald-700 dark:text-emerald-300">Our Achievements</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              A track record institutions{' '}
              <span className="emerald-text">trust</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 overflow-hidden"
              >
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
                <div className="text-4xl sm:text-5xl font-extrabold font-display">
                  {a.value}<span className="text-amber-300">{a.suffix}</span>
                </div>
                <div className="mt-2 text-sm text-emerald-50/90">{a.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section id="clients" className="py-20 sm:py-28 bg-gradient-to-b from-background to-emerald-50/40 dark:to-emerald-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-3 border-amber-500/40 text-amber-700 dark:text-amber-300">Our Valued Clients</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Trusted across <span className="gold-text">every sector</span> of education
            </h2>
            <p className="mt-4 text-muted-foreground">
              Army Institutes, Medical Institutes, Schools, Colleges, NGOs, Academies, Government Institutions & Hotel Management.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLIENT_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border/60 bg-card p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-amber-500" />
                  <h3 className="font-bold text-sm">{cat.name}</h3>
                </div>
                <ul className="space-y-1.5">
                  {cat.items.map(item => (
                    <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 p-8 sm:p-12 text-center text-white">
            <div className="absolute inset-0 bg-grid-dark opacity-30" />
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative">
              <Sparkles className="h-8 w-8 mx-auto text-amber-300 mb-4" />
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to modernize your campus?
              </h2>
              <p className="mt-4 text-emerald-50/90 max-w-xl mx-auto">
                Explore the full eSM portal now — a live, interactive demo with realistic
                student, fee, attendance and academic data.
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
              Intelligent solutions for a better institution. By Cyber Advance Solutions (Pvt.) Ltd.
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
            <h4 className="font-semibold text-sm mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Web Development</li>
              <li>ERP (Customized)</li>
              <li>E-Commerce Solution</li>
              <li>Mobile App Development</li>
              <li>Branded SMS & Digital Marketing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Get in touch</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> 5900 Balcones Drive STE 7383, Austin TX, USA 78731</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> 042-35442760</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> info@cyberasol.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} eSM — Electronic School Management. A Cyber Advance Solutions product. Built for educational purposes.
        </div>
      </footer>
    </div>
  );
}
