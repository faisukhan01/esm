'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, CalendarCheck, GraduationCap, ClipboardList, Calendar, Users, CheckCircle2, XCircle, Clock, Plus, MessageSquare, Inbox } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function TeacherPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [diary, setDiary] = useState<any[]>([]);
  const [myResults, setMyResults] = useState<any[]>([]);

  const refresh = () => {
    if (user?.branchId) {
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(setStudents).catch(() => {});
    }
    if (user?.id) {
      api.getDiary({ teacherId: user.id }).then(setDiary).catch(() => {});
      api.getResults({ teacherId: user.id }).then(setMyResults).catch(() => {});
    }
  };
  useEffect(() => { refresh(); }, [user?.id, user?.branchId]);

  if (activeModule === 'mark-attendance') return <MarkAttendance students={students} user={user} onSaved={refresh} />;
  if (activeModule === 'post-results') return <PostResults user={user} students={students} onSaved={refresh} />;
  if (activeModule === 'diary') return <DiaryView user={user} diary={diary} onSaved={refresh} />;
  if (activeModule === 'timetable') return <TeacherTimetable user={user} />;
  if (activeModule === 'my-students') return <MyStudents students={students} />;
  if (activeModule === 'sms') return <MessageParents user={user} students={students} />;
  return <TeacherOverview user={user} students={students} diary={diary} myResults={myResults} />;
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: any) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted/60 items-center justify-center mb-4"><Icon className="h-7 w-7 text-muted-foreground" /></div>
      <h3 className="font-display font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

function TeacherOverview({ user, students, diary, myResults }: any) {
  const cards = [
    { label: 'My Students', value: students.length, icon: Users, color: 'from-violet-500 to-purple-600' },
    { label: 'Subjects', value: user?.subjects?.length || 0, icon: BookOpen, color: 'from-teal-500 to-cyan-600' },
    { label: 'Classes', value: user?.classes?.length || 0, icon: GraduationCap, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Diary Entries', value: diary.length, icon: ClipboardList, color: 'from-amber-500 to-yellow-600' },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-violet-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><BookOpen className="h-3 w-3 text-amber-300" /> Teacher · {user?.branchName}</div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Hello, {user?.name} 👋</h1>
          <p className="text-violet-50/80 text-sm mt-1.5">
            {user?.subjects ? `You teach ${user.subjects.join(' & ')} to ${user.classes?.join(', ')}.` : ''} {students.length ? `${students.length} students in your branch.` : 'No students in your branch yet.'}
          </p>
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
        <h3 className="font-bold text-base mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Take Attendance', icon: CalendarCheck, color: 'emerald' },
            { label: 'Post Results', icon: GraduationCap, color: 'violet' },
            { label: 'Diary & Homework', icon: ClipboardList, color: 'amber' },
            { label: 'Message Parents', icon: MessageSquare, color: 'cyan' },
          ].map(a => (
            <div key={a.label} className="p-4 rounded-xl border border-border/60 hover:shadow-md transition">
              <div className={`h-9 w-9 rounded-lg bg-${a.color}-500/15 grid place-items-center mb-2`}><a.icon className={`h-4 w-4 text-${a.color}-600`} /></div>
              <div className="font-medium text-sm">{a.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MarkAttendance({ students, user, onSaved }: any) {
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setStatus = (id: string, status: string) => setAttendance((a:any) => ({ ...a, [id]: status }));
  const present = students.filter((s:any) => (attendance[s.id] || 'Present') === 'Present').length;
  const absent = students.filter((s:any) => attendance[s.id] === 'Absent').length;
  const late = students.filter((s:any) => attendance[s.id] === 'Late').length;

  const save = async () => {
    if (students.length === 0) { toast({ title: 'No students to mark', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const records = students.map((s:any) => ({ studentId: s.id, status: attendance[s.id] || 'Present' }));
      await api.markAttendance({ branchId: user.branchId, class: user.classes?.[0] || '', section: '', date: new Date().toISOString().slice(0,10), teacherId: user.id, records });
      toast({ title: 'Attendance saved!', description: `${present} present, ${absent} absent, ${late} late` });
      setAttendance({});
      onSaved();
    } catch (e: any) { toast({ title: 'Failed to save', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Take Attendance" subtitle={`${user?.classes?.[0] || 'Class'} · ${new Date().toLocaleDateString()}`}
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving || students.length === 0} onClick={save}>{saving ? 'Saving…' : 'Save Attendance'}</Button>} />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students in your branch" desc="Your Branch Manager needs to add students before you can take attendance." />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold">{present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
            <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
            <Card className="p-4 text-center"><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-2xl font-bold">{late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
          </div>
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Mark</TableHead></TableRow></TableHeader>
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
        </>
      )}
    </div>
  );
}

function PostResults({ user, students, onSaved }: any) {
  const [exam, setExam] = useState('Weekly Test');
  const [subject, setSubject] = useState(user?.subjects?.[0] || 'Mathematics');
  const [totalMarks, setTotalMarks] = useState(100);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const calcGrade = (m: number, total: number) => {
    const p = (m / total) * 100;
    return p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F';
  };

  const save = async () => {
    if (students.length === 0) { toast({ title: 'No students', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const records = students.map((s:any) => {
        const m = parseInt(marks[s.id] || '0');
        return { studentId: s.id, marks: m, grade: calcGrade(m, totalMarks) };
      });
      await api.postResults({ branchId: user.branchId, exam, subject, teacherId: user.id, totalMarks, date: new Date().toISOString().slice(0,10), records });
      toast({ title: 'Results posted!', description: `${records.length} students · ${exam} · ${subject}` });
      setMarks({});
      onSaved();
    } catch (e: any) { toast({ title: 'Failed to post', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Post Results" subtitle="Enter test scores — parents get notified automatically"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving || students.length === 0} onClick={save}>{saving ? 'Posting…' : 'Publish Results'}</Button>} />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students in your branch" desc="Your Branch Manager needs to add students before you can post results." />
      ) : (
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div><Label className="text-xs">Exam</Label>
              <select value={exam} onChange={e => setExam(e.target.value)} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">
                <option>Weekly Test</option><option>Monthly Test</option><option>Mid-Term</option><option>Final</option>
              </select>
            </div>
            <div><Label className="text-xs">Subject</Label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">
                {(user?.subjects || ['Mathematics']).map((s:string) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Total Marks</Label><Input type="number" value={totalMarks} onChange={e => setTotalMarks(parseInt(e.target.value) || 100)} className="mt-1" /></div>
          </div>
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Marks</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
            <TableBody>
              {students.map((s:any) => {
                const m = parseInt(marks[s.id] || '0');
                const grade = m > 0 ? calcGrade(m, totalMarks) : '—';
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                    <TableCell className="font-medium text-sm">{s.name}</TableCell>
                    <TableCell className="text-right"><Input type="number" value={marks[s.id] || ''} onChange={e => setMarks({...marks, [s.id]: e.target.value})} className="w-20 h-8 text-right ml-auto" placeholder="0" max={totalMarks} /></TableCell>
                    <TableCell className="text-right"><Badge variant="outline" className="font-bold">{grade}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function DiaryView({ user, diary, onSaved }: any) {
  const [form, setForm] = useState({ subject: user?.subjects?.[0] || 'Mathematics', title: '', desc: '', due: '', class: user?.classes?.[0] || '' });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const post = async () => {
    if (!form.title) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await api.postDiary({ teacherId: user.id, branchId: user.branchId, ...form });
      toast({ title: 'Diary entry posted!', description: 'Synced to student & parent apps' });
      setForm({ subject: user?.subjects?.[0] || 'Mathematics', title: '', desc: '', due: '', class: user?.classes?.[0] || '' });
      setShowForm(false);
      onSaved();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Diary & Homework" subtitle="Post homework — synced to student & parent apps"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(v => !v)}><Plus className="h-4 w-4 mr-1.5" /> New Entry</Button>} />
      {showForm && (
        <Card className="p-5">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Subject</Label><select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">{(user?.subjects || ['Mathematics']).map((s:string) => <option key={s}>{s}</option>)}</select></div>
              <div><Label className="text-xs">Class</Label><select value={form.class} onChange={e => setForm({...form, class: e.target.value})} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">{(user?.classes || ['Grade 8']).map((c:string) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Chapter 5 — Quadratic Equations" className="mt-1" /></div>
            <div><Label className="text-xs">Description</Label><textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} rows={3} placeholder="Solve exercises 5.1 to 5.4..." className="w-full mt-1 rounded-md border border-border bg-card p-2 text-sm resize-none" /></div>
            <div><Label className="text-xs">Due date</Label><Input value={form.due} onChange={e => setForm({...form, due: e.target.value})} placeholder="Tomorrow / 3 days / 2025-01-15" className="mt-1" /></div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={post}>{saving ? 'Posting…' : 'Post Entry'}</Button>
          </div>
        </Card>
      )}
      {diary.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No diary entries yet" desc="Post homework and assignments. They'll appear in student and parent portals instantly."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1.5" /> New Entry</Button>} />
      ) : (
        <div className="space-y-3">
          {diary.map((d:any) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><div className="font-medium text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{d.subject} · {d.class} · {d.date}</div></div>
                <Badge variant="outline" className={d.due ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' : 'text-muted-foreground'}>{d.due || 'No deadline'}</Badge>
              </div>
              {d.desc && <p className="text-sm text-muted-foreground mt-2">{d.desc}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherTimetable({ user }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Timetable" subtitle="Your weekly teaching schedule" />
      <EmptyState icon={Calendar} title="Timetable not published yet" desc="Your timetable will be published by your Branch Manager. Check back soon." />
    </div>
  );
}

function MyStudents({ students }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Students" subtitle={`${students.length} students in your branch`} />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" desc="Your Branch Manager hasn't added students to your branch yet." />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="hidden sm:table-cell">Class</TableHead></TableRow></TableHeader>
            <TableBody>
              {students.map((s:any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="font-normal">{s.class} · {s.section}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function MessageParents({ user, students }: any) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<any[]>([]);

  useEffect(() => { api.getSms({ senderId: user.id }).then(setSent).catch(() => {}); }, [user?.id]);

  const send = async () => {
    if (!text.trim()) { toast({ title: 'Empty message', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await api.sendSms({ text, recipients: students.length, type: 'Teacher Notice', senderId: user.id, instituteId: user.instituteId, branchId: user.branchId });
      toast({ title: 'SMS sent!', description: `Delivered to ${students.length} parents` });
      setText('');
      api.getSms({ senderId: user.id }).then(setSent).catch(() => {});
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Message Parents" subtitle={`Send SMS to parents of your ${students.length} students`} />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" desc="Your Branch Manager needs to add students before you can message parents." />
      ) : (
        <>
          <Card className="p-5">
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type a message to parents…" rows={4} className="w-full rounded-md border border-border bg-card p-3 text-sm resize-none" />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{text.length} chars · {Math.ceil(text.length/160)} SMS</span>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={sending} onClick={send}>{sending ? 'Sending…' : <><MessageSquare className="h-4 w-4 mr-1.5" /> Send to {students.length} parents</>}</Button>
            </div>
          </Card>
          {sent.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-base mb-3">Sent Messages</h3>
              <div className="space-y-2">
                {sent.map((s:any) => (
                  <div key={s.id} className="p-3 rounded-lg bg-muted/40">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{s.status}</Badge>
                      <span className="text-[11px] text-muted-foreground">{new Date(s.sentAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{s.text}</p>
                    <div className="text-[11px] text-muted-foreground mt-1">{s.recipients} recipients · {s.type}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
