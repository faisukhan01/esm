'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BookOpen, CalendarCheck, GraduationCap, ClipboardList, Calendar, Users,
  CheckCircle2, XCircle, Clock, Plus, MessageSquare, TrendingUp,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function TeacherPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [students] = useState(() => generateClassStudents(user?.classes?.[0] || 'Grade 8'));

  if (activeModule === 'mark-attendance') {
    return <MarkAttendance students={students} attendance={attendance} setAttendance={setAttendance} class_name={user?.classes?.[0] || 'Grade 8'} />;
  }
  if (activeModule === 'post-results') return <PostResults user={user} />;
  if (activeModule === 'diary') return <DiaryView />;
  if (activeModule === 'timetable') return <TeacherTimetable user={user} />;
  if (activeModule === 'my-students') return <MyStudents students={students} />;
  if (activeModule === 'sms') return <MessageParents />;
  return <TeacherOverview user={user} students={students} />;
}

function generateClassStudents(cls: string) {
  const names = ['Aiden Carter','Sofia Reyes','Liam Patel','Emma Kim','Noah Nguyen','Olivia Ahmed','Elijah Foster','Nora Tanaka','Caleb Wilson','Zoe Brown','Mason Davis','Ava Martinez'];
  return names.map((n, i) => ({ id: 'ST-' + (100+i), name: n, rollNo: String(1001+i), status: 'Present', class: cls }));
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function TeacherOverview({ user, students }: any) {
  const cards = [
    { label: 'My Classes', value: user?.classes?.length || 2, icon: BookOpen, color: 'from-violet-500 to-purple-600' },
    { label: 'My Students', value: students.length, icon: Users, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Subjects', value: user?.subjects?.length || 2, icon: GraduationCap, color: 'from-teal-500 to-cyan-600' },
    { label: 'Avg Attendance', value: '94%', icon: CalendarCheck, color: 'from-amber-500 to-yellow-600' },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-violet-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
            <BookOpen className="h-3 w-3 text-amber-300" /> Teacher · {user?.branchName}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Hello, {user?.name} 👋</h1>
          <p className="text-violet-50/80 text-sm mt-1.5">You teach {user?.subjects?.join(' & ')} to {user?.classes?.join(', ')}. {students.length} students across your classes.</p>
        </div>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 relative overflow-hidden">
              <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center shadow-md mb-3`}><c.icon className="h-5 w-5 text-white" /></div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Today's Schedule</h3>
        <div className="space-y-2">
          {[
            { time: '08:00 - 08:45', subject: user?.subjects?.[0] || 'Mathematics', class: user?.classes?.[0] || 'Grade 8', room: 'R-201' },
            { time: '09:30 - 10:15', subject: user?.subjects?.[1] || 'Physics', class: user?.classes?.[1] || 'Grade 9', room: 'Lab-1' },
            { time: '11:15 - 12:00', subject: user?.subjects?.[0] || 'Mathematics', class: user?.classes?.[1] || 'Grade 9', room: 'R-201' },
            { time: '13:45 - 14:30', subject: user?.subjects?.[1] || 'Physics', class: user?.classes?.[0] || 'Grade 8', room: 'Lab-1' },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
              <div className="text-xs font-mono text-muted-foreground w-28 shrink-0">{p.time}</div>
              <div className="flex-1"><div className="font-medium text-sm">{p.subject}</div><div className="text-[11px] text-muted-foreground">{p.class} · {p.room}</div></div>
              <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">Scheduled</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MarkAttendance({ students, attendance, setAttendance, class_name }: any) {
  const setStatus = (id: string, status: string) => setAttendance((a:any) => ({ ...a, [id]: status }));
  const present = students.filter((s:any) => (attendance[s.id] || 'Present') === 'Present').length;
  const absent = students.filter((s:any) => attendance[s.id] === 'Absent').length;
  const late = students.filter((s:any) => attendance[s.id] === 'Late').length;
  return (
    <div className="space-y-6">
      <ModuleHeader title="Take Attendance" subtitle={`${class_name} · ${new Date().toLocaleDateString()}`}
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast({ title: 'Attendance saved!', description: `${present} present, ${absent} absent, ${late} late` })}>Save Attendance</Button>} />
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold">{present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
        <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
        <Card className="p-4 text-center"><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-2xl font-bold">{late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
      </div>
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Mark</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {students.map((s:any) => {
              const st = attendance[s.id] || 'Present';
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {['Present','Absent','Late'].map(opt => (
                        <Button key={opt} size="sm" variant={st === opt ? 'default' : 'outline'}
                          className={st === opt ? (opt === 'Present' ? 'bg-emerald-600 text-white' : opt === 'Absent' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white') : 'h-8 px-2 text-xs'}
                          onClick={() => setStatus(s.id, opt)}>{opt[0]}</Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PostResults({ user }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Post Results" subtitle="Enter test scores — parents get notified automatically" />
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div><label className="text-xs text-muted-foreground">Exam</label><select className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm"><option>Weekly Test</option><option>Monthly Test</option><option>Mid-Term</option></select></div>
          <div><label className="text-xs text-muted-foreground">Subject</label><select className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">{user?.subjects?.map((s:string) => <option key={s}>{s}</option>)}</select></div>
          <div><label className="text-xs text-muted-foreground">Total Marks</label><input defaultValue="100" className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm" /></div>
        </div>
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Marks</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
          <TableBody>
            {generateClassStudents('').map((s, i) => {
              const marks = 70 + ((i*13)%30);
              const grade = marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B' : 'C';
              return <TableRow key={s.id}><TableCell className="font-mono text-sm">{s.rollNo}</TableCell><TableCell className="font-medium text-sm">{s.name}</TableCell><TableCell className="text-right"><input defaultValue={marks} className="w-16 h-8 rounded border border-border bg-card px-2 text-sm text-right" /></TableCell><TableCell className="text-right"><Badge variant="outline" className="font-bold">{grade}</Badge></TableCell></TableRow>;
            })}
          </TableBody>
        </Table>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4" onClick={() => toast({ title: 'Results posted!', description: 'Parents notified via SMS & app' })}>Publish Results</Button>
      </Card>
    </div>
  );
}

function DiaryView() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Diary & Homework" subtitle="Post homework — synced to parent app instantly" actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-1.5" /> New Entry</Button>} />
      <div className="space-y-3">
        {[
          { date: 'Today', subject: 'Mathematics', title: 'Chapter 5 — Quadratic Equations', due: 'Tomorrow', desc: 'Solve exercises 5.1 to 5.4 (Q1-Q15). Show all working.' },
          { date: 'Today', subject: 'Physics', title: 'Lab Report — Pendulum', due: '3 days', desc: 'Write a 2-page lab report on the simple pendulum experiment.' },
          { date: 'Yesterday', subject: 'Mathematics', title: 'Worksheet — Factorization', due: 'Submitted', desc: 'Factorization worksheet completed by 28/30 students.' },
        ].map((d, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div><div className="font-medium text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{d.subject} · {d.date}</div></div>
              <Badge variant="outline" className={d.due === 'Submitted' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{d.due}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{d.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeacherTimetable({ user }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Timetable" subtitle="Your weekly teaching schedule" />
      <Card className="p-5">
        <div className="overflow-x-auto scroll-fancy">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b border-border/60"><th className="text-left p-2 text-xs text-muted-foreground">Day</th>{['P1','P2','P3','P4','P5'].map(p => <th key={p} className="text-left p-2 text-xs text-muted-foreground">{p}</th>)}</tr></thead>
            <tbody>
              {['Mon','Tue','Wed','Thu','Fri'].map(day => (
                <tr key={day} className="border-b border-border/40">
                  <td className="p-2 font-bold">{day}</td>
                  {Array.from({length:5}).map((_,i) => (
                    <td key={i} className="p-2"><div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-2"><div className="font-medium text-xs text-violet-700 dark:text-violet-300">{user?.subjects?.[i%2] || 'Math'}</div><div className="text-[10px] text-muted-foreground">{user?.classes?.[i%2] || 'Grade 8'}</div></div></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MyStudents({ students }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Students" subtitle={`${students.length} students across your classes`} />
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="hidden sm:table-cell">Class</TableHead><TableHead className="hidden md:table-cell">Attendance</TableHead><TableHead className="hidden md:table-cell">GPA</TableHead></TableRow></TableHeader>
          <TableBody>
            {students.map((s:any, i:number) => (
              <TableRow key={s.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                <TableCell className="font-medium text-sm">{s.name}</TableCell>
                <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="font-normal">{s.class}</Badge></TableCell>
                <TableCell className="hidden md:table-cell"><span className="text-sm font-medium text-emerald-600">{88 + (i*7)%10}%</span></TableCell>
                <TableCell className="hidden md:table-cell"><span className="text-sm font-bold">{(3.0 + (i%10)/10).toFixed(2)}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function MessageParents() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Message Parents" subtitle="Send SMS updates to parents of your students" />
      <Card className="p-5">
        <div className="space-y-3">
          <textarea placeholder="Type a message to parents…" rows={4} className="w-full rounded-md border border-border bg-card p-3 text-sm resize-none" />
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">0 chars · 0 SMS</span><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><MessageSquare className="h-4 w-4 mr-1.5" /> Send to {12} parents</Button></div>
        </div>
      </Card>
    </div>
  );
}
