'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CalendarCheck, GraduationCap, CreditCard, Calendar, ClipboardList, TrendingUp,
  CheckCircle2, Clock, XCircle, BookOpen, Award, Download,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function StudentPortal({ activeModule, user }: { activeModule: string; user: any }) {
  if (activeModule === 'my-attendance') return <MyAttendance />;
  if (activeModule === 'my-results') return <MyResults />;
  if (activeModule === 'my-fees') return <MyFees user={user} />;
  if (activeModule === 'my-timetable') return <MyTimetable />;
  if (activeModule === 'my-diary') return <MyDiary />;
  return <StudentOverview user={user} />;
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function StudentOverview({ user }: any) {
  const attendanceData = Array.from({length: 14}).map((_,i) => ({ date: `D${i+1}`, rate: 88 + ((i*7)%12) }));
  const cards = [
    { label: 'Attendance', value: '94%', icon: CalendarCheck, color: 'from-emerald-500 to-emerald-700' },
    { label: 'GPA', value: '3.76', icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
    { label: 'Class Rank', value: '#4', icon: Award, color: 'from-amber-500 to-yellow-600' },
    { label: 'Fee Balance', value: '$0', icon: CreditCard, color: 'from-teal-500 to-cyan-600' },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-700 to-cyan-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
            <GraduationCap className="h-3 w-3 text-amber-300" /> Student · {user?.class} {user?.section} · Roll #{user?.rollNo}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Hi, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-cyan-50/80 text-sm mt-1.5">{user?.branchName} · {user?.instituteName}. Keep up the great work — you're ranked #4 in your class.</p>
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
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">My Attendance — last 14 days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attendanceData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="gSA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[80,100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fill="url(#gSA)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">Recent Results</h3>
          <div className="space-y-2">
            {[
              { subject: 'Mathematics', marks: 92, grade: 'A+', color: 'emerald' },
              { subject: 'English', marks: 88, grade: 'A', color: 'teal' },
              { subject: 'Physics', marks: 84, grade: 'A', color: 'cyan' },
              { subject: 'Chemistry', marks: 79, grade: 'B', color: 'amber' },
              { subject: 'Computer Science', marks: 95, grade: 'A+', color: 'violet' },
            ].map(r => (
              <div key={r.subject} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                <div className={`h-9 w-9 rounded-lg bg-${r.color}-500/15 grid place-items-center`}><BookOpen className={`h-4 w-4 text-${r.color}-600`} /></div>
                <div className="flex-1"><div className="font-medium text-sm">{r.subject}</div><div className="text-[11px] text-muted-foreground">{r.marks}/100</div></div>
                <Badge variant="outline" className={`font-bold text-${r.color}-600 bg-${r.color}-500/10 border-${r.color}-500/20`}>{r.grade}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MyAttendance() {
  const data = Array.from({length: 30}).map((_,i) => ({ date: `D${i+1}`, rate: 85 + ((i*11)%15) }));
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Attendance" subtitle="Your attendance record — last 30 days" />
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold">26</div><div className="text-xs text-muted-foreground">Present</div></Card>
        <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">2</div><div className="text-xs text-muted-foreground">Absent</div></Card>
        <Card className="p-4 text-center"><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-2xl font-bold">2</div><div className="text-xs text-muted-foreground">Late</div></Card>
      </div>
      <Card className="p-5">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
            <defs><linearGradient id="gSAtt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[70,100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fill="url(#gSAtt)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function MyResults() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Results" subtitle="All your test & exam results" actions={<Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" /> Report Card</Button>} />
      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Subject Performance</h3>
        <div className="space-y-3">
          {[
            { subject: 'Mathematics', marks: 92, grade: 'A+', color: 'emerald' },
            { subject: 'English', marks: 88, grade: 'A', color: 'teal' },
            { subject: 'Physics', marks: 84, grade: 'A', color: 'cyan' },
            { subject: 'Chemistry', marks: 79, grade: 'B', color: 'amber' },
            { subject: 'Biology', marks: 86, grade: 'A', color: 'lime' },
            { subject: 'Computer Science', marks: 95, grade: 'A+', color: 'violet' },
            { subject: 'History', marks: 82, grade: 'A', color: 'rose' },
          ].map(r => (
            <div key={r.subject} className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-${r.color}-500/15 grid place-items-center shrink-0`}><BookOpen className={`h-4 w-4 text-${r.color}-600`} /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.subject}</span><span className="font-bold text-sm">{r.marks}/100</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full bg-${r.color}-500`} style={{ width: `${r.marks}%` }} /></div>
              </div>
              <Badge variant="outline" className={`font-bold text-${r.color}-600 bg-${r.color}-500/10 border-${r.color}-500/20`}>{r.grade}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MyFees({ user }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Fees" subtitle="Fee history & online payment" actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><CreditCard className="h-4 w-4 mr-1.5" /> Pay Now</Button>} />
      <Card className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="flex items-center justify-between">
          <div><div className="text-xs text-emerald-50/80">Current Balance</div><div className="text-3xl font-extrabold font-display mt-1">$0.00</div><div className="text-xs text-emerald-50/80 mt-1">All clear! Next due: Jan 5</div></div>
          <CheckCircle2 className="h-12 w-12 text-amber-300" />
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Payment History</h3>
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Invoice</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {[
              { inv: 'INV-2024-09', date: '2024-09-05', amount: 1200, status: 'Paid' },
              { inv: 'INV-2024-08', date: '2024-08-05', amount: 1200, status: 'Paid' },
              { inv: 'INV-2024-07', date: '2024-07-05', amount: 1200, status: 'Paid' },
              { inv: 'INV-2024-06', date: '2024-06-05', amount: 1200, status: 'Paid' },
            ].map(p => (
              <TableRow key={p.inv}><TableCell className="font-mono text-sm">{p.inv}</TableCell><TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{p.date}</TableCell><TableCell className="font-medium text-sm">{fmtMoney(p.amount)}</TableCell><TableCell><Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{p.status}</Badge></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function MyTimetable() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Timetable" subtitle="Your weekly class schedule" />
      <Card className="p-5">
        <div className="overflow-x-auto scroll-fancy">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b border-border/60"><th className="text-left p-2 text-xs text-muted-foreground">Day</th>{['08:00','09:00','10:30','11:30','13:00','14:00'].map(t => <th key={t} className="text-left p-2 text-xs text-muted-foreground">{t}</th>)}</tr></thead>
            <tbody>
              {['Mon','Tue','Wed','Thu','Fri'].map(day => (
                <tr key={day} className="border-b border-border/40">
                  <td className="p-2 font-bold">{day}</td>
                  {['Mathematics','English','Physics','Chemistry','Biology','CS','Break','Mathematics','English','Physics'].slice(0,6).map((s,i) => (
                    <td key={i} className="p-2"><div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2"><div className="font-medium text-xs text-cyan-700 dark:text-cyan-300">{s}</div><div className="text-[10px] text-muted-foreground">R-{201+i}</div></div></td>
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

function MyDiary() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Diary & Homework" subtitle="Assignments from your teachers" />
      <div className="space-y-3">
        {[
          { subject: 'Mathematics', title: 'Chapter 5 — Quadratic Equations', due: 'Tomorrow', desc: 'Solve exercises 5.1 to 5.4 (Q1-Q15).', urgent: true },
          { subject: 'Physics', title: 'Lab Report — Pendulum', due: '3 days', desc: 'Write a 2-page lab report on the simple pendulum experiment.', urgent: false },
          { subject: 'English', title: 'Essay — Climate Change', due: '5 days', desc: 'Write a 500-word persuasive essay on climate action.', urgent: false },
        ].map((d, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div><div className="font-medium text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{d.subject}</div></div>
              <Badge variant="outline" className={d.urgent ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{d.due}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{d.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
