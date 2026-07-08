'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarCheck, GraduationCap, CreditCard, Calendar, ClipboardList, CheckCircle2, XCircle, Clock, BookOpen, Award, Inbox } from 'lucide-react';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function StudentPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [attendance, setAttendance] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [diary, setDiary] = useState<any[]>([]);

  const refresh = () => {
    if (user?.id) {
      api.getAttendance({ studentId: user.id }).then(setAttendance).catch(() => {});
      api.getResults({ studentId: user.id }).then(setResults).catch(() => {});
      api.getFees({ studentId: user.id }).then(setFees).catch(() => {});
      if (user?.branchId) api.getDiary({ branchId: user.branchId }).then(setDiary).catch(() => {});
    }
  };
  useEffect(() => { refresh(); }, [user?.id, user?.branchId]);

  if (activeModule === 'my-attendance') return <MyAttendance attendance={attendance} />;
  if (activeModule === 'my-results') return <MyResults results={results} />;
  if (activeModule === 'my-fees') return <MyFees user={user} fees={fees} />;
  if (activeModule === 'my-timetable') return <MyTimetable />;
  if (activeModule === 'my-diary') return <MyDiary diary={diary} />;
  return <StudentOverview user={user} attendance={attendance} results={results} fees={fees} diary={diary} />;
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: any) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted/60 items-center justify-center mb-4"><Icon className="h-7 w-7 text-muted-foreground" /></div>
      <h3 className="font-display font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
    </Card>
  );
}

function StudentOverview({ user, attendance, results, fees, diary }: any) {
  const feePaid = fees.filter(f => f.status === 'Paid').reduce((a:number, f:any) => a + f.amount, 0);
  const cards = [
    { label: 'Attendance', value: attendance?.rate != null ? attendance.rate + '%' : '—', icon: CalendarCheck, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Avg Score', value: results?.avgPercentage != null ? results.avgPercentage + '%' : '—', icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
    { label: 'Results', value: results?.total ?? 0, icon: Award, color: 'from-amber-500 to-yellow-600' },
    { label: 'Fees Paid', value: fmtMoney(feePaid), icon: CreditCard, color: 'from-teal-500 to-cyan-600' },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-700 to-cyan-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><GraduationCap className="h-3 w-3 text-amber-300" /> Student · {user?.class} {user?.section} · Roll #{user?.rollNo}</div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Hi, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-cyan-50/80 text-sm mt-1.5">{user?.branchName} · {user?.instituteName}</p>
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
          <h3 className="font-bold text-base mb-3">Recent Attendance</h3>
          {!attendance || attendance.total === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No attendance records yet. Your teachers haven't marked attendance.</div>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></div>
              <div><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></div>
              <div><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></div>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-base mb-3">Recent Results</h3>
          {!results || results.total === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No results posted yet. Your teachers haven't posted any results.</div>
          ) : (
            <div className="space-y-2">
              {results.entries.slice(0, 5).map((r:any) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <div><div className="font-medium text-sm">{r.subject}</div><div className="text-[11px] text-muted-foreground">{r.exam} · {r.date}</div></div>
                  <Badge variant="outline" className="font-bold">{r.marks}/{r.totalMarks} · {r.grade}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MyAttendance({ attendance }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Attendance" subtitle="Your attendance record" />
      {!attendance || attendance.total === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance records yet" desc="Your teachers haven't marked any attendance yet. Check back after your next class." />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
            <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
            <Card className="p-4 text-center"><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
            <Card className="p-4 text-center bg-emerald-500/10"><CalendarCheck className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold text-emerald-600">{attendance.rate}%</div><div className="text-xs text-muted-foreground">Rate</div></Card>
          </div>
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Date</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {attendance.entries.map((e:any) => (
                  <TableRow key={e.id}><TableCell className="text-sm">{e.date}</TableCell><TableCell className="text-sm">{e.class}</TableCell>
                    <TableCell><Badge variant="outline" className={e.status === 'Present' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : e.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{e.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

function MyResults({ results }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Results" subtitle="All your test & exam results" />
      {!results || results.total === 0 ? (
        <EmptyState icon={GraduationCap} title="No results posted yet" desc="Your teachers haven't posted any results yet. Check back after your next exam." />
      ) : (
        <Card className="p-5">
          <div className="space-y-3">
            {results.entries.map((r:any) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/15 grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-emerald-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.subject}</span><span className="font-bold text-sm">{r.marks}/{r.totalMarks}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${r.percentage}%` }} /></div>
                  <div className="text-[11px] text-muted-foreground mt-1">{r.exam} · {r.date}</div>
                </div>
                <Badge variant="outline" className="font-bold">{r.grade}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MyFees({ user, fees }: any) {
  const totalPaid = fees.filter(f => f.status === 'Paid').reduce((a:number, f:any) => a + f.amount, 0);
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Fees" subtitle="Fee history & online payment" />
      <Card className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="flex items-center justify-between">
          <div><div className="text-xs text-emerald-50/80">Total Paid</div><div className="text-3xl font-extrabold font-display mt-1">{fmtMoney(totalPaid)}</div><div className="text-xs text-emerald-50/80 mt-1">{fees.length} transactions</div></div>
          <CreditCard className="h-12 w-12 text-amber-300" />
        </div>
      </Card>
      {fees.length === 0 ? (
        <EmptyState icon={CreditCard} title="No fee transactions yet" desc="Your fee records will appear here once payments are recorded." />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Invoice</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {fees.map((f:any) => (
                <TableRow key={f.id}><TableCell className="font-mono text-sm">{f.id}</TableCell><TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{f.date}</TableCell><TableCell className="text-sm">{f.type}</TableCell><TableCell className="font-medium text-sm">{fmtMoney(f.amount)}</TableCell><TableCell><Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{f.status}</Badge></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function MyTimetable() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Timetable" subtitle="Your weekly class schedule" />
      <EmptyState icon={Calendar} title="Timetable not published yet" desc="Your timetable will be published by your Branch Manager." />
    </div>
  );
}

function MyDiary({ diary }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Diary & Homework" subtitle="Assignments from your teachers" />
      {diary.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No diary entries yet" desc="Your teachers haven't posted any homework or assignments yet." />
      ) : (
        <div className="space-y-3">
          {diary.map((d:any) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><div className="font-medium text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{d.subject} · {d.class} · {d.date}</div></div>
                <Badge variant="outline" className={d.due ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' : 'text-muted-foreground'}>{d.due || 'No deadline'}</Badge>
              </div>
              {d.desc && <p className="text-sm text-muted-foreground">{d.desc}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
