'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  FileCheck, Clock, Brain, TrendingUp, BarChart3, Calendar, Timer,
  ChevronRight, CheckCircle2, XCircle, AlertCircle, Loader2, Zap,
  ArrowUpRight, ArrowDownRight, Eye, RotateCcw, Sparkles, Target,
  BookOpen, Calculator, Atom, FlaskConical, Languages, Code2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, Legend,
} from 'recharts';
import { ModuleHeader } from './students';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UpcomingExam {
  id: string;
  subject: string;
  date: string;          // ISO date string
  totalMarks: number;
  duration: number;      // minutes
  chapters: string[];
  type: 'Mid-Term' | 'Final' | 'Quiz' | 'Unit Test';
}

interface PastResult {
  id: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number;     // minutes
  date: string;
  trend: 'up' | 'down' | 'stable';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
}

interface ReviewQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  selected: number | null;
  isCorrect: boolean;
  explanation: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const NOW = new Date();

const UPCOMING_EXAMS: UpcomingExam[] = [
  {
    id: 'e1', subject: 'Mathematics', date: new Date(NOW.getTime() + 12 * 3600000).toISOString(),
    totalMarks: 100, duration: 120, chapters: ['Algebra', 'Trigonometry', 'Calculus'], type: 'Mid-Term',
  },
  {
    id: 'e2', subject: 'Physics', date: new Date(NOW.getTime() + 2 * 86400000).toISOString(),
    totalMarks: 80, duration: 90, chapters: ['Mechanics', 'Thermodynamics'], type: 'Unit Test',
  },
  {
    id: 'e3', subject: 'Chemistry', date: new Date(NOW.getTime() + 5 * 86400000).toISOString(),
    totalMarks: 75, duration: 60, chapters: ['Organic Chemistry'], type: 'Quiz',
  },
  {
    id: 'e4', subject: 'English', date: new Date(NOW.getTime() + 10 * 86400000).toISOString(),
    totalMarks: 50, duration: 45, chapters: ['Grammar', 'Comprehension', 'Essay Writing'], type: 'Quiz',
  },
  {
    id: 'e5', subject: 'Computer Science', date: new Date(NOW.getTime() + 20 * 86400000).toISOString(),
    totalMarks: 100, duration: 120, chapters: ['Data Structures', 'Algorithms', 'OOP'], type: 'Final',
  },
];

const PAST_RESULTS: PastResult[] = [
  { id: 'r1', subject: 'Mathematics', score: 87, totalMarks: 100, percentage: 87, timeTaken: 95, date: '2025-02-20', trend: 'up', difficulty: 'Hard' },
  { id: 'r2', subject: 'Physics', score: 72, totalMarks: 80, percentage: 90, timeTaken: 78, date: '2025-02-18', trend: 'up', difficulty: 'Medium' },
  { id: 'r3', subject: 'Chemistry', score: 55, totalMarks: 75, percentage: 73.3, timeTaken: 58, date: '2025-02-15', trend: 'down', difficulty: 'Hard' },
  { id: 'r4', subject: 'English', score: 42, totalMarks: 50, percentage: 84, timeTaken: 38, date: '2025-02-12', trend: 'stable', difficulty: 'Easy' },
  { id: 'r5', subject: 'Computer Science', score: 91, totalMarks: 100, percentage: 91, timeTaken: 102, date: '2025-02-10', trend: 'up', difficulty: 'Mixed' },
  { id: 'r6', subject: 'Mathematics', score: 78, totalMarks: 100, percentage: 78, timeTaken: 100, date: '2025-01-28', trend: 'up', difficulty: 'Medium' },
  { id: 'r7', subject: 'Physics', score: 60, totalMarks: 80, percentage: 75, timeTaken: 82, date: '2025-01-20', trend: 'stable', difficulty: 'Medium' },
  { id: 'r8', subject: 'Chemistry', score: 62, totalMarks: 75, percentage: 82.7, timeTaken: 55, date: '2025-01-15', trend: 'up', difficulty: 'Easy' },
];

const SUBJECT_PERFORMANCE = [
  { subject: 'Math', score: 87, previous: 78, color: '#6366f1' },
  { subject: 'Physics', score: 90, previous: 75, color: '#10b981' },
  { subject: 'Chemistry', score: 73, previous: 83, color: '#f43f5e' },
  { subject: 'English', score: 84, previous: 80, color: '#f59e0b' },
  { subject: 'CS', score: 91, previous: 85, color: '#8b5cf6' },
];

const IMPROVEMENT_TREND = [
  { month: 'Sep', average: 72 },
  { month: 'Oct', average: 75 },
  { month: 'Nov', average: 71 },
  { month: 'Dec', average: 78 },
  { month: 'Jan', average: 82 },
  { month: 'Feb', average: 85 },
];

const MOCK_REVIEW_QUESTIONS: ReviewQuestion[] = [
  {
    id: 1, question: 'What is the derivative of f(x) = 3x\u00B2 + 2x - 5?',
    options: ['6x + 2', '3x + 2', '6x - 5', '6x\u00B2 + 2'],
    correct: 0, selected: 0, isCorrect: true,
    explanation: 'Using the power rule: d/dx(3x\u00B2) = 6x, d/dx(2x) = 2, d/dx(-5) = 0. So f\'(x) = 6x + 2.',
  },
  {
    id: 2, question: 'Which law states F = ma?',
    options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", 'Law of Gravitation'],
    correct: 1, selected: 1, isCorrect: true,
    explanation: "Newton's Second Law of Motion states that the force acting on an object equals mass times acceleration.",
  },
  {
    id: 3, question: 'What is the chemical formula for sulphuric acid?',
    options: ['HCl', 'H\u2082SO\u2084', 'HNO\u2083', 'H\u2083PO\u2084'],
    correct: 1, selected: 2, isCorrect: false,
    explanation: 'Sulphuric acid has the formula H\u2082SO\u2084. HNO\u2083 is nitric acid.',
  },
  {
    id: 4, question: 'In OOP, what is encapsulation?',
    options: ['Inheritance of properties', 'Bundling data and methods', 'Method overloading', 'Polymorphism'],
    correct: 1, selected: 1, isCorrect: true,
    explanation: 'Encapsulation is the bundling of data and the methods that act on that data such that access to that data is restricted from outside the bundle.',
  },
  {
    id: 5, question: 'What is the past tense of "run"?',
    options: ['Runned', 'Ran', 'Running', 'Runed'],
    correct: 1, selected: 0, isCorrect: false,
    explanation: '"Run" is an irregular verb. Its past tense is "ran", not "runned".',
  },
];

const SUBJECTS_LIST = [
  { id: 'math', name: 'Mathematics', icon: Calculator, chapters: ['Algebra', 'Trigonometry', 'Calculus', 'Statistics', 'Geometry'] },
  { id: 'physics', name: 'Physics', icon: Atom, chapters: ['Mechanics', 'Thermodynamics', 'Optics', 'Electromagnetism', 'Waves'] },
  { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, chapters: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Periodic Table'] },
  { id: 'english', name: 'English', icon: Languages, chapters: ['Grammar', 'Comprehension', 'Essay Writing', 'Vocabulary'] },
  { id: 'cs', name: 'Computer Science', icon: Code2, chapters: ['Data Structures', 'Algorithms', 'OOP', 'Databases', 'Networking'] },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getCountdown(isoDate: string): { label: string; urgent: 'red' | 'amber' | 'green' } {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return { label: 'Started', urgent: 'red' };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days < 1) return { label: `${hours}h ${minutes}m`, urgent: 'red' };
  if (days < 3) return { label: `${days}d ${hours}h`, urgent: 'amber' };
  return { label: `${days}d ${hours}h`, urgent: 'green' };
}

const urgentColor: Record<string, string> = {
  red: 'border-red-500/40 bg-red-500/5',
  amber: 'border-amber-500/40 bg-amber-500/5',
  green: 'border-emerald-500/40 bg-emerald-500/5',
};

const urgentBadge: Record<string, string> = {
  red: 'bg-red-500/15 text-red-600 border-red-500/30',
  amber: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  green: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
};

const subjectBadge: Record<string, string> = {
  Mathematics: 'bg-violet-500/15 text-violet-700 border-violet-500/30',
  Physics: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  Chemistry: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  English: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  'Computer Science': 'bg-purple-500/15 text-purple-700 border-purple-500/30',
};

const trendIcon = {
  up: <ArrowUpRight className="size-4 text-emerald-500" />,
  down: <ArrowDownRight className="size-4 text-red-500" />,
  stable: <TrendingUp className="size-4 text-amber-500" />,
};

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' } }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                     */
/* ------------------------------------------------------------------ */

function CountdownTimer({ isoDate }: { isoDate: string }) {
  const [cd, setCd] = useState(getCountdown(isoDate));

  useEffect(() => {
    const iv = setInterval(() => setCd(getCountdown(isoDate)), 30000);
    return () => clearInterval(iv);
  }, [isoDate]);

  return <Badge variant="outline" className={`${urgentBadge[cd.urgent]} font-mono text-xs`}>{cd.label}</Badge>;
}

/* ---- Upcoming Exams ---- */
function UpcomingExams() {
  return (
    <div className="space-y-6">
      {/* Next exam hero card */}
      {(() => {
        const next = UPCOMING_EXAMS[0];
        const cd = getCountdown(next.date);
        return (
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="size-4" />
                  <span className="text-sm font-medium opacity-90">Next Exam</span>
                </div>
                <h3 className="text-2xl font-bold">{next.subject}</h3>
                <p className="text-sm opacity-80 mt-1">{next.type} &middot; {next.chapters.join(', ')}</p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-md px-3 py-1.5 text-sm">
                    <Calendar className="size-3.5" />
                    {new Date(next.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-md px-3 py-1.5 text-sm">
                    <Timer className="size-3.5" />
                    {formatDuration(next.duration)}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-md px-3 py-1.5 text-sm">
                    <FileCheck className="size-3.5" />
                    {next.totalMarks} marks
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Starts in</span>
                  <span className={`font-mono text-lg font-bold ${cd.urgent === 'red' ? 'text-red-500' : cd.urgent === 'amber' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {cd.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* Remaining exams grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" variants={stagger} initial="hidden" animate="show">
        {UPCOMING_EXAMS.slice(1).map((exam, i) => {
          const cd = getCountdown(exam.date);
          return (
            <motion.div key={exam.id} variants={fadeUp} custom={i + 1}>
              <Card className={`transition-shadow hover:shadow-md ${urgentColor[cd.urgent]}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={subjectBadge[exam.subject] ?? 'bg-slate-500/15 text-slate-700 border-slate-500/30'}>
                      {exam.subject}
                    </Badge>
                    <CountdownTimer isoDate={exam.date} />
                  </div>
                  <CardTitle className="text-base mt-2">{exam.type}</CardTitle>
                  <CardDescription>{exam.chapters.join(', ')}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="size-3.5" />{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Timer className="size-3.5" />{formatDuration(exam.duration)}</span>
                    <span className="flex items-center gap-1"><FileCheck className="size-3.5" />{exam.totalMarks}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ---- Create Practice Test ---- */
function CreatePracticeTest() {
  const [subject, setSubject] = useState('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [questionCount, setQuestionCount] = useState([30]);
  const [timeLimit, setTimeLimit] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const currentSubject = SUBJECTS_LIST.find(s => s.id === subject);

  const toggleChapter = (ch: string) => {
    setSelectedChapters(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  const handleReset = () => {
    setSubject(''); setSelectedChapters([]); setDifficulty('Mixed');
    setQuestionCount([30]); setTimeLimit(true); setGenerated(false);
  };

  if (generated) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold">Practice Test Generated!</h3>
            <p className="text-sm text-muted-foreground">
              {questionCount[0]} questions on {currentSubject?.name} &middot; {difficulty} difficulty
              {timeLimit ? ` \u00B7 ${Math.round(questionCount[0] * 1.2)} min` : ''}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={handleReset} variant="outline"><RotateCcw className="size-4 mr-1" />Create Another</Button>
              <Button className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-0"><FileCheck className="size-4 mr-1" />Start Test</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="size-5 text-indigo-500" />Test Configuration</CardTitle>
          <CardDescription>Customize your practice test parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Select value={subject} onValueChange={v => { setSubject(v); setSelectedChapters([]); }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a subject" /></SelectTrigger>
              <SelectContent>
                {SUBJECTS_LIST.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2"><s.icon className="size-4" />{s.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapters multi-select */}
          {currentSubject && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
              <label className="text-sm font-medium">Chapters / Topics</label>
              <div className="grid grid-cols-2 gap-2">
                {currentSubject.chapters.map(ch => (
                  <label key={ch} className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors text-sm">
                    <Checkbox checked={selectedChapters.includes(ch)} onCheckedChange={() => toggleChapter(ch)} />
                    {ch}
                  </label>
                ))}
              </div>
              {selectedChapters.length === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="size-3" />Select at least one chapter</p>
              )}
            </motion.div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty Level</label>
            <div className="flex gap-2 flex-wrap">
              {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map(d => (
                <Button
                  key={d}
                  variant={difficulty === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDifficulty(d)}
                  className={difficulty === d ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-0' : ''}
                >
                  {d === 'Easy' && <Zap className="size-3.5 mr-1" />}
                  {d === 'Medium' && <Target className="size-3.5 mr-1" />}
                  {d === 'Hard' && <AlertCircle className="size-3.5 mr-1" />}
                  {d === 'Mixed' && <Sparkles className="size-3.5 mr-1" />}
                  {d}
                </Button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Number of Questions</label>
              <span className="text-sm font-mono font-bold text-indigo-600">{questionCount[0]}</span>
            </div>
            <Slider value={questionCount} onValueChange={setQuestionCount} min={10} max={100} step={5} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10</span><span>100</span>
            </div>
          </div>

          {/* Time Limit Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <label className="text-sm font-medium flex items-center gap-2"><Clock className="size-4" />Time Limit</label>
              <p className="text-xs text-muted-foreground">
                {timeLimit ? `~${Math.round(questionCount[0] * 1.2)} minutes` : 'No time constraint'}
              </p>
            </div>
            <Switch checked={timeLimit} onCheckedChange={setTimeLimit} />
          </div>

          <Separator />

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={!subject || selectedChapters.length === 0 || generating}
            className="w-full h-11 text-base bg-gradient-to-r from-indigo-500 to-blue-600 text-white border-0 hover:opacity-90 transition-opacity"
          >
            {generating ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Generating Test...
              </>
            ) : (
              <>
                <Sparkles className="size-5" />
                Generate Practice Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---- Past Results ---- */
function PastResults() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {PAST_RESULTS.map((r, i) => (
        <motion.div key={r.id} initial="hidden" animate="show" variants={fadeUp} custom={i}>
          <Card className="transition-shadow hover:shadow-md overflow-hidden">
            <CardContent className="pt-0">
              <button
                className="w-full flex items-center justify-between py-1 text-left"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className={subjectBadge[r.subject] ?? 'bg-slate-500/15 text-slate-700 border-slate-500/30'}>
                    {r.subject}
                  </Badge>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">
                      {r.score}/{r.totalMarks}
                      <span className="ml-2 text-muted-foreground font-normal">({r.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="size-3" />{formatDuration(r.timeTaken)}
                      <span className="opacity-40">|</span>
                      {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {trendIcon[r.trend]}
                  <Badge variant="outline" className="text-xs">{r.difficulty}</Badge>
                  <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expanded === r.id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {expanded === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Score</p>
                        <p className="font-semibold">{r.score}/{r.totalMarks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Percentage</p>
                        <p className="font-semibold">{r.percentage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Time Taken</p>
                        <p className="font-semibold">{formatDuration(r.timeTaken)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Trend</p>
                        <p className="font-semibold capitalize flex items-center gap-1">
                          {trendIcon[r.trend]} {r.trend}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={r.percentage} className="h-2" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline"><Eye className="size-3.5 mr-1" />View Details</Button>
                      <Button size="sm" variant="outline"><RotateCcw className="size-3.5 mr-1" />Retake</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

/* ---- Performance Analytics ---- */
function PerformanceAnalytics() {
  const strengths = SUBJECT_PERFORMANCE.filter(s => s.score >= 85).map(s => s.subject);
  const weaknesses = SUBJECT_PERFORMANCE.filter(s => s.score < 80).map(s => s.subject);

  return (
    <div className="space-y-6">
      {/* Subject-wise Bar Chart */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="size-5 text-indigo-500" />Subject-wise Performance</CardTitle>
            <CardDescription>Current vs Previous scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SUBJECT_PERFORMANCE} barGap={4} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="score" name="Current" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previous" name="Previous" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Improvement Trend */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-emerald-500" />Improvement Trend</CardTitle>
            <CardDescription>Average score over recent months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={IMPROVEMENT_TREND}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="average"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#trendGradient)"
                    name="Avg Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Strengths & Weaknesses */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500" />Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strengths.length > 0 ? strengths.map(s => (
                  <Badge key={s} className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">{s}</Badge>
                )) : <p className="text-sm text-muted-foreground">Keep practicing!</p>}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="size-4 text-amber-500" />Needs Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {weaknesses.length > 0 ? weaknesses.map(s => (
                  <Badge key={s} className="bg-amber-500/15 text-amber-700 border-amber-500/30">{s}</Badge>
                )) : <p className="text-sm text-muted-foreground">Great job!</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg Score', value: '85%', icon: BarChart3, color: 'from-indigo-500 to-blue-600' },
            { label: 'Best Subject', value: 'CS', icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
            { label: 'Tests Taken', value: '24', icon: FileCheck, color: 'from-violet-500 to-purple-600' },
            { label: 'Improvement', value: '+13%', icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
          ].map(stat => (
            <Card key={stat.label} className="overflow-hidden">
              <div className={`bg-gradient-to-br ${stat.color} p-3 flex items-center justify-center`}>
                <stat.icon className="size-6 text-white" />
              </div>
              <CardContent className="pt-3 text-center">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ---- Answer Key & Review ---- */
function AnswerKeyReview() {
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const correct = MOCK_REVIEW_QUESTIONS.filter(q => q.isCorrect).length;
  const total = MOCK_REVIEW_QUESTIONS.length;
  const pct = Math.round((correct / total) * 100);

  const toggleExplanation = (id: number) => {
    setShowExplanation(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white">
            <h3 className="text-lg font-semibold">Practice Test Review</h3>
            <p className="text-sm opacity-80">Mathematics &middot; Mixed Difficulty &middot; 30 Questions</p>
          </div>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-500">{correct}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{total - correct}</p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">{pct}%</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
            </div>
            <Progress value={pct} className="h-2.5 mt-4" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Questions */}
      <div className="space-y-3">
        {MOCK_REVIEW_QUESTIONS.map((q, i) => (
          <motion.div key={q.id} initial="hidden" animate="show" variants={fadeUp} custom={i + 1}>
            <Card className={`border-l-4 ${q.isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
              <CardContent className="pt-0">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${q.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                    {q.isCorrect ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      <span className="text-muted-foreground mr-1">Q{q.id}.</span>
                      {q.question}
                    </p>

                    <div className="mt-2 space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === q.correct;
                        const isSelected = oi === q.selected;
                        let cls = 'border bg-background';
                        if (isCorrect) cls = 'border-emerald-500/40 bg-emerald-500/10';
                        else if (isSelected && !q.isCorrect) cls = 'border-red-500/40 bg-red-500/10';

                        return (
                          <div key={oi} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${cls}`}>
                            <span className="font-mono text-xs text-muted-foreground mr-1">{String.fromCharCode(65 + oi)}</span>
                            {opt}
                            {isCorrect && <CheckCircle2 className="size-3.5 text-emerald-500 ml-auto shrink-0" />}
                            {isSelected && !q.isCorrect && <XCircle className="size-3.5 text-red-500 ml-auto shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {showExplanation[q.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 rounded-md bg-indigo-500/5 border border-indigo-500/20 p-3 text-sm text-muted-foreground">
                            <p className="font-medium text-indigo-600 text-xs mb-1">Explanation</p>
                            {q.explanation}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1"
                      onClick={() => toggleExplanation(q.id)}
                    >
                      {showExplanation[q.id] ? 'Hide' : 'Show'} Explanation
                      <ChevronRight className={`size-3 transition-transform ${showExplanation[q.id] ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ExamPortal({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('upcoming');

  return (
    <div className="space-y-6">
      {/* Module Header with gradient */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/15 rounded-lg">
            <FileCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Exam Portal</h1>
            <p className="text-sm opacity-80">Practice tests, results &amp; performance analytics</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            <BookOpen className="size-3 mr-1" />5 Subjects
          </Badge>
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            <Calendar className="size-3 mr-1" />{UPCOMING_EXAMS.length} Upcoming
          </Badge>
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            <TrendingUp className="size-3 mr-1" />+13% This Month
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="upcoming" className="gap-1.5 text-xs sm:text-sm">
            <Calendar className="size-3.5" />Upcoming
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="size-3.5" />Create Test
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5 text-xs sm:text-sm">
            <FileCheck className="size-3.5" />Results
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="size-3.5" />Analytics
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1.5 text-xs sm:text-sm">
            <Eye className="size-3.5" />Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <UpcomingExams />
        </TabsContent>

        <TabsContent value="create" className="mt-4">
          <CreatePracticeTest />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <PastResults />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <PerformanceAnalytics />
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <AnswerKeyReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
