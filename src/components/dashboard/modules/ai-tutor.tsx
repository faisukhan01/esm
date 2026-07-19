'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModuleHeader } from './students';
import {
  Sparkles, Send, Mic, Bot, User, BookOpen, Atom, FlaskConical,
  Calculator, Languages, Code2, Lightbulb, TrendingUp, Clock,
} from 'lucide-react';

type Subject = { id: string; name: string; icon: typeof Bot; tint: string };

const SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', icon: Calculator, tint: 'from-violet-500 to-fuchsia-600' },
  { id: 'physics', name: 'Physics', icon: Atom, tint: 'from-emerald-500 to-teal-600' },
  { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, tint: 'from-rose-500 to-pink-600' },
  { id: 'biology', name: 'Biology', icon: BookOpen, tint: 'from-amber-500 to-yellow-600' },
  { id: 'english', name: 'English', icon: Languages, tint: 'from-cyan-500 to-teal-600' },
  { id: 'urdu', name: 'Urdu', icon: Languages, tint: 'from-rose-500 to-orange-600' },
  { id: 'cs', name: 'Computer Sci.', icon: Code2, tint: 'from-violet-500 to-purple-600' },
];

type ChatMsg = { role: 'user' | 'ai'; content: React.ReactNode; ts: string };

const INITIAL_THREAD: ChatMsg[] = [
  {
    role: 'user',
    content: "Explain Newton's second law of motion in simple terms.",
    ts: '10:42',
  },
  {
    role: 'ai',
    content: (
      <div className="space-y-3">
        <p>
          Newton&rsquo;s second law says: <strong>the more force you apply to an object, the faster it accelerates</strong> &mdash; and the heavier the object, the slower it accelerates for the same force.
        </p>
        <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 font-mono text-sm">
          <span className="text-violet-700 dark:text-violet-300">F = m &middot; a</span>
          <div className="text-xs text-muted-foreground mt-1">
            F = force (Newtons) &middot; m = mass (kg) &middot; a = acceleration (m/s&sup2;)
          </div>
        </div>
        <p>
          <strong>Example:</strong> Pushing a 2&thinsp;kg cart with 10&thinsp;N of force gives it an acceleration of <code className="text-violet-700 dark:text-violet-300">a = F/m = 10/2 = 5 m/s&sup2;</code>. Double the mass and the acceleration halves.
        </p>
      </div>
    ),
    ts: '10:42',
  },
];

const SUGGESTED = [
  'Solve: 3x² + 7x − 6 = 0',
  'Summarize Photosynthesis',
  'Give 5 MCQs on World War II',
];

export default function AiTutorModule() {
  const [activeSubject, setActiveSubject] = useState<Subject>(SUBJECTS[1]);
  const [thread] = useState<ChatMsg[]>(INITIAL_THREAD);
  const [draft, setDraft] = useState('');

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="AI Tutor"
        subtitle="24/7 doubt-solving AI tutor — powered by ESM Intelligence"
        actions={
          <Badge variant="outline" className="bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20">
            <Sparkles className="h-3 w-3 mr-1" /> Beta
          </Badge>
        }
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        {/* Subject sidebar */}
        <Card className="p-3 h-fit lg:sticky lg:top-4">
          <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Subjects
          </div>
          <div className="space-y-1">
            {SUBJECTS.map((s) => {
              const isActive = s.id === activeSubject.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSubject(s)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition ${
                    isActive
                      ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium'
                      : 'text-foreground/70 hover:bg-muted'
                  }`}
                >
                  <span className={`h-7 w-7 rounded-md bg-gradient-to-br ${s.tint} grid place-items-center shrink-0`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span className="truncate">{s.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 px-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>124 questions this month</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Avg response 1.2s</span>
            </div>
          </div>
        </Card>

        {/* Chat thread */}
        <Card className="p-0 overflow-hidden flex flex-col min-h-[560px]">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center shadow-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm flex items-center gap-2">
                ESM Intelligence
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                Tutoring · {activeSubject.name}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-muted-foreground">
              <Mic className="h-4 w-4 mr-1.5" /> Voice
            </Button>
          </div>

          {/* Thread */}
          <ScrollArea className="flex-1 px-4 py-4 max-h-[440px]">
            <div className="space-y-4">
              {thread.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground text-[11px]'
                          : 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white text-[11px]'
                      }
                    >
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted/60 rounded-tl-sm'
                    }`}
                  >
                    {m.content}
                    <div className={`text-[10px] mt-2 ${m.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {m.ts}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* Suggested + input */}
          <div className="border-t border-border p-3 space-y-3 bg-card">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => setDraft(s)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 transition"
                >
                  <Lightbulb className="h-3 w-3 inline mr-1" />
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Ask ESM Tutor about ${activeSubject.name.toLowerCase()}…`}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setDraft('');
                }}
              />
              <Button
                size="icon"
                className="bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:opacity-90 text-white shrink-0"
                onClick={() => setDraft('')}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/70 text-center">
              ESM AI Tutor can make mistakes. Verify important concepts with your teacher.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
