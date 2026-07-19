'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ModuleHeader } from './students';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Play, BookOpen, FileText, Brain, TrendingUp, Clock, Star, Flame,
  CheckCircle2, ChevronRight, Download, Eye, Timer, Award, Zap,
  MonitorPlay, GraduationCap, Target, ArrowUpRight,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type SubjectId = 'math' | 'physics' | 'chemistry' | 'biology' | 'english' | 'cs';

interface VideoLecture {
  id: string;
  title: string;
  subject: SubjectId;
  duration: string;
  views: number;
  progress: number;
  chapter: string;
}

interface PastPaper {
  id: string;
  year: number;
  subject: string;
  board: string;
  totalMarks: number;
}

interface ScoreRecord {
  id: string;
  subject: string;
  score: number;
  total: number;
  date: string;
}

/* ────────────────────────────────────────────
   Static data
   ──────────────────────────────────────────── */

const SUBJECTS: { id: SubjectId; name: string; icon: typeof Play; gradient: string }[] = [
  { id: 'math', name: 'Mathematics', icon: Target, gradient: 'from-violet-500 to-purple-600' },
  { id: 'physics', name: 'Physics', icon: Zap, gradient: 'from-sky-500 to-blue-600' },
  { id: 'chemistry', name: 'Chemistry', icon: Brain, gradient: 'from-rose-500 to-pink-600' },
  { id: 'biology', name: 'Biology', icon: BookOpen, gradient: 'from-emerald-500 to-green-600' },
  { id: 'english', name: 'English', icon: GraduationCap, gradient: 'from-amber-500 to-orange-600' },
  { id: 'cs', name: 'Computer Science', icon: MonitorPlay, gradient: 'from-cyan-500 to-teal-600' },
];

const VIDEO_THUMBNAIL_GRADIENTS: Record<SubjectId, string> = {
  math: 'from-violet-600 via-purple-700 to-indigo-800',
  physics: 'from-sky-600 via-blue-700 to-indigo-800',
  chemistry: 'from-rose-600 via-pink-700 to-fuchsia-800',
  biology: 'from-emerald-600 via-green-700 to-teal-800',
  english: 'from-amber-600 via-orange-700 to-red-800',
  cs: 'from-cyan-600 via-teal-700 to-emerald-800',
};

const VIDEOS: VideoLecture[] = [
  { id: 'v1', title: 'Quadratic Equations — Complete Solution Set', subject: 'math', duration: '42:15', views: 12450, progress: 78, chapter: 'Ch 4: Quadratic Equations' },
  { id: 'v2', title: 'Newton\'s Laws of Motion — FSC Part 1', subject: 'physics', duration: '55:30', views: 9820, progress: 45, chapter: 'Ch 3: Dynamics' },
  { id: 'v3', title: 'Organic Chemistry — Hydrocarbons', subject: 'chemistry', duration: '38:45', views: 7630, progress: 100, chapter: 'Ch 8: Hydrocarbons' },
  { id: 'v4', title: 'Cell Division — Mitosis & Meiosis', subject: 'biology', duration: '35:20', views: 11200, progress: 62, chapter: 'Ch 5: Cell Cycle' },
  { id: 'v5', title: 'Essay Writing — Formal & Informal', subject: 'english', duration: '28:10', views: 5400, progress: 30, chapter: 'Ch 2: Essay Writing' },
  { id: 'v6', title: 'Arrays & Loops in C++', subject: 'cs', duration: '46:50', views: 8900, progress: 15, chapter: 'Ch 6: Arrays' },
  { id: 'v7', title: 'Matrices & Determinants', subject: 'math', duration: '50:25', views: 15300, progress: 90, chapter: 'Ch 3: Matrices' },
  { id: 'v8', title: 'Waves & Oscillations', subject: 'physics', duration: '44:10', views: 6780, progress: 55, chapter: 'Ch 7: Oscillations' },
  { id: 'v9', title: 'Periodic Table & Trends', subject: 'chemistry', duration: '33:55', views: 8450, progress: 80, chapter: 'Ch 2: Periodic Table' },
  { id: 'v10', title: 'Human Digestive System', subject: 'biology', duration: '40:20', views: 10350, progress: 70, chapter: 'Ch 11: Nutrition' },
  { id: 'v11', title: 'Comprehension & Vocabulary', subject: 'english', duration: '31:40', views: 4900, progress: 50, chapter: 'Ch 4: Comprehension' },
  { id: 'v12', title: 'Functions & Pointers in C', subject: 'cs', duration: '52:15', views: 7200, progress: 25, chapter: 'Ch 5: Functions' },
  { id: 'v13', title: 'Permutation & Combination', subject: 'math', duration: '47:30', views: 13800, progress: 60, chapter: 'Ch 7: Permutation' },
  { id: 'v14', title: 'Electrostatics — Coulomb\'s Law', subject: 'physics', duration: '39:15', views: 7100, progress: 35, chapter: 'Ch 12: Electrostatics' },
  { id: 'v15', title: 'Chemical Bonding — Ionic & Covalent', subject: 'chemistry', duration: '36:50', views: 9300, progress: 95, chapter: 'Ch 4: Chemical Bonding' },
];

const BOARDS = ['BISE Lahore', 'BISE Rawalpindi', 'BISE Faisalabad', 'BISE Multan', 'BISE Gujranwala'];
const YEARS = [2024, 2023, 2022, 2021, 2020];
const PAPER_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

const PAST_PAPERS: PastPaper[] = [
  { id: 'pp1', year: 2024, subject: 'Mathematics', board: 'BISE Lahore', totalMarks: 100 },
  { id: 'pp2', year: 2024, subject: 'Physics', board: 'BISE Rawalpindi', totalMarks: 100 },
  { id: 'pp3', year: 2023, subject: 'Chemistry', board: 'BISE Lahore', totalMarks: 100 },
  { id: 'pp4', year: 2023, subject: 'Biology', board: 'BISE Faisalabad', totalMarks: 100 },
  { id: 'pp5', year: 2022, subject: 'English', board: 'BISE Multan', totalMarks: 100 },
  { id: 'pp6', year: 2024, subject: 'Computer Science', board: 'BISE Gujranwala', totalMarks: 100 },
  { id: 'pp7', year: 2023, subject: 'Mathematics', board: 'BISE Rawalpindi', totalMarks: 100 },
  { id: 'pp8', year: 2022, subject: 'Physics', board: 'BISE Lahore', totalMarks: 100 },
  { id: 'pp9', year: 2021, subject: 'Chemistry', board: 'BISE Faisalabad', totalMarks: 100 },
  { id: 'pp10', year: 2021, subject: 'Biology', board: 'BISE Multan', totalMarks: 100 },
  { id: 'pp11', year: 2020, subject: 'Mathematics', board: 'BISE Lahore', totalMarks: 100 },
  { id: 'pp12', year: 2020, subject: 'Physics', board: 'BISE Gujranwala', totalMarks: 100 },
];

const MCQ_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

const PERFORMANCE_DATA = [
  { subject: 'Math', score: 82 },
  { subject: 'Physics', score: 71 },
  { subject: 'Chemistry', score: 89 },
  { subject: 'Biology', score: 76 },
  { subject: 'English', score: 65 },
  { subject: 'CS', score: 93 },
];

const RECENT_SCORES: ScoreRecord[] = [
  { id: 's1', subject: 'Mathematics', score: 82, total: 100, date: 'Feb 28' },
  { id: 's2', subject: 'Physics', score: 71, total: 100, date: 'Feb 27' },
  { id: 's3', subject: 'Chemistry', score: 89, total: 100, date: 'Feb 26' },
  { id: 's4', subject: 'Biology', score: 76, total: 100, date: 'Feb 25' },
  { id: 's5', subject: 'English', score: 65, total: 100, date: 'Feb 24' },
];

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

const fmtViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

const subjectColor = (sub: SubjectId) => SUBJECTS.find(s => s.id === sub)?.gradient ?? 'from-gray-500 to-gray-600';

const subjectName = (sub: SubjectId) => SUBJECTS.find(s => s.id === sub)?.name ?? sub;

const progressColor = (p: number) => {
  if (p === 100) return 'bg-emerald-500';
  if (p >= 60) return 'bg-violet-500';
  if (p >= 30) return 'bg-amber-500';
  return 'bg-rose-500';
};

const scoreBadge = (score: number) => {
  if (score >= 90) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
  if (score >= 75) return 'text-violet-600 bg-violet-500/10 border-violet-500/20';
  if (score >= 60) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
  return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

/* ────────────────────────────────────────────
   Component
   ──────────────────────────────────────────── */

export function ELearningHub({ user }: { user: any }) {
  const [videoSubject, setVideoSubject] = useState<SubjectId | 'all'>('all');
  const [paperYear, setPaperYear] = useState<number | 'all'>('all');
  const [paperBoard, setPaperBoard] = useState<string>('all');
  const [paperSubject, setPaperSubject] = useState<string>('all');
  const [mcqSubject, setMcqSubject] = useState('Mathematics');
  const [mcqCount, setMcqCount] = useState(20);

  /* Filtered videos */
  const filteredVideos = videoSubject === 'all'
    ? VIDEOS
    : VIDEOS.filter(v => v.subject === videoSubject);

  /* Filtered papers */
  const filteredPapers = PAST_PAPERS.filter(p => {
    if (paperYear !== 'all' && p.year !== paperYear) return false;
    if (paperBoard !== 'all' && p.board !== paperBoard) return false;
    if (paperSubject !== 'all' && p.subject !== paperSubject) return false;
    return true;
  });

  /* ── Stats cards ── */
  const statsCards = [
    { label: 'Videos Watched', value: '127', icon: MonitorPlay, gradient: 'from-violet-500 to-fuchsia-600', sub: 'This week: 14' },
    { label: 'Practice Tests', value: '43', icon: Brain, gradient: 'from-emerald-500 to-teal-600', sub: 'This week: 5' },
    { label: 'Average Score', value: '78%', icon: Award, gradient: 'from-amber-500 to-orange-600', sub: '+4% from last week' },
    { label: 'Day Streak', value: '12', icon: Flame, gradient: 'from-rose-500 to-red-600', sub: 'Personal best: 18' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Module Header ── */}
      <ModuleHeader
        title="E-Learning Hub"
        subtitle="4,000+ video lectures, past papers & MCQ practice — learn smarter, score higher"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Offline Content
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0">
              <Play className="h-4 w-4 mr-1.5" /> Continue Learning
            </Button>
          </>
        }
      />

      {/* ── Hero Banner ── */}
      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card className="relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          <CardContent className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                <span className="text-sm font-semibold text-white/90">Featured Course</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display mb-1">
                FSc Part 1 — Complete Preparation
              </h2>
              <p className="text-sm text-white/75 max-w-lg">
                380+ video lectures, chapter-wise MCQs, and solved past papers. Everything you need to ace your board exams.
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
                <span className="flex items-center gap-1"><Play className="h-3.5 w-3.5" /> 380 Lectures</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 120+ Hours</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Certificate</span>
              </div>
            </div>
            <Button className="bg-white text-violet-700 hover:bg-white/90 font-bold shrink-0">
              Start Now <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((c, i) => (
          <motion.div key={c.label} {...fadeIn} transition={{ delay: 0.08 + i * 0.04 }}>
            <Card className="p-4 relative overflow-hidden">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.gradient} opacity-10 blur-2xl`} />
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.gradient} grid place-items-center mb-3`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{c.value}</div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="text-[11px] text-muted-foreground/70 mt-0.5">{c.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Main Tabs ── */}
      <Tabs defaultValue="videos" className="space-y-5">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="videos" className="gap-1.5">
            <Play className="h-4 w-4" /> Video Library
          </TabsTrigger>
          <TabsTrigger value="papers" className="gap-1.5">
            <FileText className="h-4 w-4" /> Past Papers
          </TabsTrigger>
          <TabsTrigger value="mcq" className="gap-1.5">
            <Brain className="h-4 w-4" /> MCQ Practice
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> My Progress
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════
            VIDEO LIBRARY TAB
            ══════════════════════════════════════ */}
        <TabsContent value="videos" className="space-y-4">
          {/* Subject filter pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setVideoSubject('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                videoSubject === 'all'
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Subjects
            </button>
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                onClick={() => setVideoSubject(s.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  videoSubject === s.id
                    ? `bg-gradient-to-r ${s.gradient} text-white shadow-md`
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Video grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredVideos.map((video, i) => (
                <motion.div
                  key={video.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    {/* Thumbnail */}
                    <div className={`relative h-40 bg-gradient-to-br ${VIDEO_THUMBNAIL_GRADIENTS[video.subject]} flex items-center justify-center`}>
                      {/* Decorative pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 left-4 w-16 h-16 rounded-full border-2 border-white/30" />
                        <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full border-2 border-white/20" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/10" />
                      </div>

                      {/* Play button */}
                      <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm grid place-items-center group-hover:bg-white/30 transition-all group-hover:scale-110 cursor-pointer">
                        <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                      </div>

                      {/* Duration badge */}
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Timer className="h-3 w-3" /> {video.duration}
                      </div>

                      {/* Subject badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[11px] font-medium">
                          {subjectName(video.subject)}
                        </Badge>
                      </div>

                      {/* Completed indicator */}
                      {video.progress === 100 && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-emerald-500 grid place-items-center">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <CardContent className="p-4">
                      <div className="text-[11px] text-muted-foreground mb-1">{video.chapter}</div>
                      <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>

                      {/* Views & progress */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {fmtViews(video.views)} views
                        </span>
                        <span className={video.progress === 100 ? 'text-emerald-600 font-medium' : ''}>
                          {video.progress}% complete
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${progressColor(video.progress)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${video.progress}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Load more */}
          <div className="text-center pt-2">
            <Button variant="outline" className="gap-2">
              Load More Videos <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════
            PAST PAPERS TAB
            ══════════════════════════════════════ */}
        <TabsContent value="papers" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Year filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Year</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setPaperYear('all')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      paperYear === 'all'
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    All
                  </button>
                  {YEARS.map(y => (
                    <button
                      key={y}
                      onClick={() => setPaperYear(y)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        paperYear === y
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Board filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Board</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setPaperBoard('all')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      paperBoard === 'all'
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    All
                  </button>
                  {BOARDS.map(b => (
                    <button
                      key={b}
                      onClick={() => setPaperBoard(b)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        paperBoard === b
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {b.replace('BISE ', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subject</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setPaperSubject('all')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      paperSubject === 'all'
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    All
                  </button>
                  {PAPER_SUBJECTS.map(s => (
                    <button
                      key={s}
                      onClick={() => setPaperSubject(s)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        paperSubject === s
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Papers grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPapers.map((paper, i) => (
              <motion.div key={paper.id} {...fadeIn} transition={{ delay: i * 0.04 }}>
                <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                  <CardContent className="p-4">
                    {/* Year & Board row */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white border-0 text-xs font-bold">
                        {paper.year}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{paper.board}</span>
                    </div>

                    {/* Subject */}
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                      {paper.subject}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mb-4">
                      Total Marks: {paper.totalMarks} • Board Exam
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8">
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </Button>
                      <Button size="sm" className="flex-1 gap-1.5 text-xs h-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0">
                        <Play className="h-3.5 w-3.5" /> Attempt Online
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredPapers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No past papers match your filters.</p>
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════
            MCQ PRACTICE TAB
            ══════════════════════════════════════ */}
        <TabsContent value="mcq" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Setup panel */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
                <Card className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-violet-500 to-fuchsia-600" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-5 w-5 text-violet-500" /> Start Practice Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Subject */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Select Subject</label>
                      <div className="grid grid-cols-2 gap-2">
                        {MCQ_SUBJECTS.map(s => (
                          <button
                            key={s}
                            onClick={() => setMcqSubject(s)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                              mcqSubject === s
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question count */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Number of Questions</label>
                      <div className="flex gap-2">
                        {[10, 20, 50, 100].map(n => (
                          <button
                            key={n}
                            onClick={() => setMcqCount(n)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                              mcqCount === n
                                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start button */}
                    <Button className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 font-bold text-sm gap-2">
                      <Zap className="h-4 w-4" /> Start {mcqCount}-Question Practice
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent scores */}
              <motion.div {...fadeIn} transition={{ delay: 0.12 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" /> Recent Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {RECENT_SCORES.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{s.subject}</div>
                            <div className="text-[11px] text-muted-foreground">{s.date}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`font-bold ${scoreBadge(s.score)}`}>
                          {s.score}/{s.total}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Performance chart */}
            <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" /> Subject Performance
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Average MCQ scores by subject</p>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="subject"
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [`${value}%`, 'Score']}
                        />
                        <Bar
                          dataKey="score"
                          radius={[6, 6, 0, 0]}
                          fill="url(#barGradient)"
                        />
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#d946ef" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════
            MY PROGRESS TAB
            ══════════════════════════════════════ */}
        <TabsContent value="progress" className="space-y-5">
          {/* Weekly overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Videos This Week', value: '14', change: '+3', icon: MonitorPlay, gradient: 'from-violet-500 to-purple-600' },
              { label: 'Tests Completed', value: '5', change: '+2', icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600' },
              { label: 'Avg Score', value: '78%', change: '+4%', icon: Award, gradient: 'from-amber-500 to-orange-600' },
              { label: 'Current Streak', value: '12 days', change: 'Best: 18', icon: Flame, gradient: 'from-rose-500 to-red-600' },
            ].map((c, i) => (
              <motion.div key={c.label} {...fadeIn} transition={{ delay: i * 0.05 }}>
                <Card className="p-4 relative overflow-hidden">
                  <div className={`absolute -top-4 -right-4 h-16 w-16 rounded-full bg-gradient-to-br ${c.gradient} opacity-10 blur-xl`} />
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.gradient} grid place-items-center`}>
                      <c.icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20 text-[11px] font-medium">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" /> {c.change}
                    </Badge>
                  </div>
                  <div className="text-2xl font-extrabold font-display">{c.value}</div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Weekly watch activity */}
          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-violet-500" /> Weekly Watch Activity
                </CardTitle>
                <p className="text-xs text-muted-foreground">Hours spent watching lectures this week</p>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: 'Mon', hours: 2.5 },
                        { day: 'Tue', hours: 1.8 },
                        { day: 'Wed', hours: 3.2 },
                        { day: 'Thu', hours: 2.0 },
                        { day: 'Fri', hours: 4.1 },
                        { day: 'Sat', hours: 3.5 },
                        { day: 'Sun', hours: 1.2 },
                      ]}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value}h`, 'Watch Time']}
                      />
                      <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill="url(#weekGradient)" />
                      <defs>
                        <linearGradient id="weekGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject progress breakdown */}
          <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-500" /> Subject Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {SUBJECTS.map((s, i) => {
                  const pct = [82, 45, 90, 62, 30, 55][i]; // mock completion %
                  return (
                    <div key={s.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${s.gradient} grid place-items-center`}>
                            <s.icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                        <span className="text-sm font-bold">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${s.gradient}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements */}
          <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" /> Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { title: 'First Lecture', desc: 'Watch your first video', icon: Play, unlocked: true, gradient: 'from-violet-500 to-purple-600' },
                    { title: 'Quiz Master', desc: 'Score 90%+ on a quiz', icon: Brain, unlocked: true, gradient: 'from-emerald-500 to-teal-600' },
                    { title: 'Streak Hero', desc: '7-day learning streak', icon: Flame, unlocked: true, gradient: 'from-amber-500 to-orange-600' },
                    { title: 'Scholar', desc: 'Complete all subjects', icon: GraduationCap, unlocked: false, gradient: 'from-gray-400 to-gray-500' },
                  ].map((a) => (
                    <div
                      key={a.title}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        a.unlocked
                          ? 'border-border hover:shadow-md'
                          : 'border-dashed border-muted-foreground/25 opacity-50'
                      }`}
                    >
                      <div className={`h-10 w-10 mx-auto rounded-xl bg-gradient-to-br ${a.gradient} grid place-items-center mb-2`}>
                        <a.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-xs font-bold">{a.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{a.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
