'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, GraduationCap, DollarSign, CalendarCheck, Plus, CheckCircle2, UserPlus, BookOpen,
  Network, Inbox, Calendar, Eye, Edit, Lock, Unlock, Megaphone, Send, BookCopy,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AddUserModal } from './add-user-modal';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function BranchManagerPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addRole, setAddRole] = useState<'teacher' | 'student'>('teacher');

  const refresh = () => {
    if (user?.branchId) {
      api.scopedStats(user.instituteId, user.branchId).then(setStats).catch(() => {});
      api.platformUsers({ branchId: user.branchId, role: 'teacher' }).then(setTeachers).catch(() => {});
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(setStudents).catch(() => {});
    }
  };
  useEffect(() => { refresh(); }, [user?.branchId]);

  const openAdd = (role: 'teacher' | 'student') => { setAddRole(role); setShowAdd(true); };

  let content: React.ReactNode;
  if (activeModule === 'teachers' || activeModule === 'add-teacher') content = <TeachersView teachers={teachers} onRefresh={refresh} onAdd={() => openAdd('teacher')} />;
  else if (activeModule === 'branch-students' || activeModule === 'add-student') content = <StudentsView students={students} onRefresh={refresh} onAdd={() => openAdd('student')} />;
  else if (activeModule === 'announcements') content = <AnnouncementsView user={user} />;
  else if (activeModule === 'class-courses') content = <ClassCoursesView user={user} />;
  else if (['attendance','results','timetable','fees','complaints','events','sms'].includes(activeModule)) content = <ScopedBranchModule activeModule={activeModule} user={user} stats={stats} />;
  else content = <BranchOverview user={user} stats={stats} teachers={teachers} students={students} onAddTeacher={() => openAdd('teacher')} onAddStudent={() => openAdd('student')} />;

  return (
    <>
      {content}
      <AddUserModal open={showAdd} onClose={() => setShowAdd(false)} role={addRole} instituteId={user?.instituteId} branchId={user?.branchId} onCreated={refresh} />
    </>
  );
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

function BranchOverview({ user, stats, teachers, students, onAddTeacher, onAddStudent }: any) {
  const cards = [
    { label: 'Students', value: stats?.students ?? 0, icon: GraduationCap, color: 'from-emerald-500 to-emerald-700', action: onAddStudent, actionLabel: 'Add Student' },
    { label: 'Teachers', value: stats?.teachers ?? 0, icon: Users, color: 'from-violet-500 to-purple-600', action: onAddTeacher, actionLabel: 'Add Teacher' },
    { label: 'Fee Collected', value: fmtMoney(stats?.feeCollected || 0), icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
    { label: 'Attendance Rate', value: (stats?.attendance || 0) + '%', icon: CalendarCheck, color: 'from-teal-500 to-cyan-600' },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-700 to-teal-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><Network className="h-3 w-3 text-amber-300" /> Branch Manager · {user?.branchName}</div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-teal-50/80 text-sm mt-1.5 max-w-lg">
              {stats?.students || stats?.teachers ? `You have ${stats.students} students and ${stats.teachers} teachers.` : 'Add your first teacher or student to get started.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-white text-teal-800 hover:bg-teal-50" size="sm" onClick={onAddTeacher}><UserPlus className="h-4 w-4 mr-1.5" /> Add Teacher</Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" size="sm" onClick={onAddStudent}><Plus className="h-4 w-4 mr-1.5" /> Student</Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
              <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center shadow-md mb-3`}><c.icon className="h-5 w-5 text-white" /></div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
              {c.action && <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs px-2 -mx-2" onClick={c.action}><Plus className="h-3 w-3 mr-1" /> {c.actionLabel}</Button>}
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Teachers ({teachers.length})</h3>
            <Button size="sm" variant="outline" onClick={onAddTeacher}><UserPlus className="h-4 w-4 mr-1.5" /> Add</Button>
          </div>
          {teachers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No teachers yet. Click "Add" to create one.</div>
          ) : (
            <div className="space-y-2">
              {teachers.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                  <div className="h-9 w-9 rounded-full bg-violet-500/15 grid place-items-center"><Users className="h-4 w-4 text-violet-600" /></div>
                  <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{t.name}</div><div className="text-[11px] text-muted-foreground truncate">{t.subjects?.join(', ') || t.email}</div></div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base">Students ({students.length})</h3>
            <Button size="sm" variant="outline" onClick={onAddStudent}><Plus className="h-4 w-4 mr-1.5" /> Add</Button>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No students yet. Click "Add" to create one.</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scroll-fancy">
              {students.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/15 grid place-items-center"><GraduationCap className="h-4 w-4 text-emerald-600" /></div>
                  <div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{s.name}</div><div className="text-[11px] text-muted-foreground truncate">{s.class} {s.section} · {s.rollNo}</div></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============ User row actions: View Password / Edit / Block ============
function UserRowActions({ u, onRefresh }: { u: any; onRefresh: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [pass, setPass] = useState('');
  const [mustChange, setMustChange] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [busy, setBusy] = useState(false);

  const viewPassword = async () => {
    setBusy(true);
    try {
      const r = await api.getUserPassword(u.id);
      setPass(r.password || '—');
      setMustChange(r.mustChangePassword === true);
      setShowPass(true);
    } catch (e: any) { toast({ title: 'Could not fetch password', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  const toggleBlock = async () => {
    setBusy(true);
    try {
      await api.blockUser(u.id, !u.blocked, !u.blocked ? 'Blocked by Branch Manager' : '');
      toast({ title: u.blocked ? 'User unblocked' : 'User blocked', description: u.blocked ? 'Access restored' : 'Their session was invalidated' });
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={viewPassword} disabled={busy} title="View Password" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-50"><Eye className="h-4 w-4" /></button>
      <button onClick={() => setShowEdit(true)} title="Edit" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><Edit className="h-4 w-4" /></button>
      <button onClick={toggleBlock} disabled={busy} title={u.blocked ? 'Unblock' : 'Block'} className={`h-8 w-8 grid place-items-center rounded-lg ${u.blocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'} disabled:opacity-50`}>{u.blocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
      {showPass && (
        <div className="ml-2 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
          <span className="text-amber-700 dark:text-amber-300 font-mono">{pass}</span>
          {mustChange && <span className="text-amber-600 dark:text-amber-400 ml-1">· must change</span>}
        </div>
      )}
      {showEdit && <EditUserModal u={u} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />}
    </div>
  );
}

function EditUserModal({ u, onClose, onSaved }: { u: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: u.name || '', email: u.email || '', password: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const body: any = { name: form.name };
      if (form.email) body.email = form.email;
      if (form.password) body.password = form.password;
      await api.editUser(u.id, body);
      toast({ title: 'User updated', description: form.password ? 'Password changed — user must change it on next sign-in' : 'Profile saved' });
      onSaved();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md my-4">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <h3 className="font-display font-bold text-lg mb-1">Edit {u.role === 'teacher' ? 'Teacher' : 'Student'}</h3>
          <p className="text-sm text-muted-foreground mb-4">Update profile details or assign a new password.</p>
          <div className="space-y-3">
            <div><Label>Full name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="optional" className="mt-1" /></div>
            <div>
              <Label>New password</Label>
              <Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="leave blank to keep current" className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">If changed, the user must set a new password on next sign-in.</p>
            </div>
            {u.class && <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">Class: <span className="font-medium text-foreground">{u.class} · {u.section || 'A'}</span></div>}
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function TeachersView({ teachers, onAdd, onRefresh }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Teachers" subtitle={`${teachers.length} teachers in your branch`}
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAdd}><UserPlus className="h-4 w-4 mr-1.5" /> Add Teacher</Button>} />
      {teachers.length === 0 ? (
        <EmptyState icon={Users} title="No teachers yet" desc="Add your first teacher. A login will be auto-created so they can sign in to their Teacher portal."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAdd}><UserPlus className="h-4 w-4 mr-1.5" /> Add Teacher</Button>} />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Teacher</TableHead><TableHead className="hidden md:table-cell">Roll No</TableHead><TableHead className="hidden md:table-cell">Subjects</TableHead><TableHead className="hidden sm:table-cell">Classes</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {teachers.map((t:any) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{t.name}</div><div className="text-[11px] text-muted-foreground">{t.email || '—'}</div></TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{t.rollNo || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell">{t.subjects?.length ? t.subjects.map((s:string) => <Badge key={s} variant="secondary" className="mr-1 font-normal text-[10px]">{s}</Badge>) : '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{t.classes?.length ? t.classes.join(', ') : '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={t.blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'}>{t.blocked ? 'Blocked' : (t.status || 'Active')}</Badge></TableCell>
                  <TableCell className="text-right"><UserRowActions u={t} onRefresh={onRefresh} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function StudentsView({ students, onAdd, onRefresh }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Students" subtitle={`${students.length} students in your branch`}
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>} />
      {students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students yet" desc="Add your first student. A login will be auto-created so they (or their parents) can sign in to their portal."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>} />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="hidden sm:table-cell">Roll No</TableHead><TableHead className="hidden md:table-cell">Guardian</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {students.map((s:any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{s.name}</div><div className="text-[11px] text-muted-foreground">{s.email || '—'}</div></TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{s.class}{s.section ? ` · ${s.section}` : ''}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-sm">{s.rollNo || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{s.guardian || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={s.blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'}>{s.blocked ? 'Blocked' : (s.status || 'Active')}</Badge></TableCell>
                  <TableCell className="text-right"><UserRowActions u={s} onRefresh={onRefresh} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ============ Class & Course Management ============
function ClassCoursesView({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClassId, setActiveClassId] = useState<string>('');
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', code: '' });
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      api.getClasses(user.branchId).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.getCourses({ branchId: user.branchId }).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([cls, crs]) => {
      setClasses(cls);
      setAllCourses(crs);
      if (cls.length > 0 && !activeClassId) setActiveClassId(cls[0].id);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user.branchId]);

  // When active class changes, fetch assigned courses for that class
  useEffect(() => {
    if (!activeClassId) { setAssignedCourseIds([]); return; }
    api.getCourses({ classId: activeClassId })
      .then(r => setAssignedCourseIds((Array.isArray(r) ? r : []).map((c: any) => c.id)))
      .catch(() => setAssignedCourseIds([]));
  }, [activeClassId]);

  const toggleCourse = (id: string) => {
    setAssignedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveAssignment = async () => {
    if (!activeClassId) return;
    setSaving(true);
    try {
      await api.assignClassCourses(activeClassId, assignedCourseIds);
      toast({ title: 'Courses assigned', description: `${assignedCourseIds.length} course(s) linked to this class` });
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const createCourse = async () => {
    if (!newCourse.name) { toast({ title: 'Course name required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const res = await api.createCourse({ name: newCourse.name, code: newCourse.code, branchId: user.branchId });
      toast({ title: 'Course created', description: `${res.name} is now available to assign` });
      setNewCourse({ name: '', code: '' });
      setShowCreateCourse(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  const activeClass = classes.find(c => c.id === activeClassId);

  return (
    <div className="space-y-6">
      <ModuleHeader title="Classes & Courses" subtitle="Manage all 12 classes and assign courses to each"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreateCourse(v => !v)}><Plus className="h-4 w-4 mr-1.5" /> New Course</Button>} />

      {loading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Loading classes…</Card>
      ) : classes.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes found" desc="Classes (Class 1 – Class 12) are auto-created when your branch is provisioned. If you don't see them, ask your Institute Admin." />
      ) : (
        <>
          {/* Class grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {classes.map(cls => {
              const isActive = cls.id === activeClassId;
              return (
                <button key={cls.id} onClick={() => setActiveClassId(cls.id)}
                  className={`text-left p-4 rounded-xl border transition relative overflow-hidden ${
                    isActive ? 'border-emerald-500/60 bg-emerald-500/10 shadow-md' : 'border-border bg-card hover:border-emerald-500/30 hover:bg-muted/40'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className={`h-9 w-9 rounded-lg grid place-items-center ${isActive ? 'bg-emerald-600' : 'bg-muted'}`}>
                      <BookOpen className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    {isActive && <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10 border-emerald-500/20 text-[10px]">Selected</Badge>}
                  </div>
                  <div className="mt-2 font-bold text-sm">{cls.name}</div>
                  <div className="text-[11px] text-muted-foreground">Section {cls.section || 'A'}</div>
                </button>
              );
            })}
          </div>

          {/* Create course form */}
          {showCreateCourse && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3"><BookCopy className="h-4 w-4 text-emerald-600" /><h3 className="font-bold text-base">Create New Course</h3></div>
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2"><Label>Course name *</Label><Input value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="e.g. Mathematics" className="mt-1" /></div>
                <div><Label>Code</Label><Input value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} placeholder="e.g. MATH-101" className="mt-1" /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={creating} onClick={createCourse}>{creating ? 'Creating…' : 'Create Course'}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          {/* Assign courses to active class */}
          {activeClass && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-600" /> {activeClass.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Select which courses are taught in this class. Students in this class will see all selected courses.</p>
                </div>
                <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10 border-emerald-500/20">{assignedCourseIds.length} assigned</Badge>
              </div>
              {allCourses.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No courses created in this branch yet. <button onClick={() => setShowCreateCourse(true)} className="text-emerald-600 hover:underline font-medium">Create one now</button>.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto scroll-fancy pr-1">
                  {allCourses.map(c => {
                    const checked = assignedCourseIds.includes(c.id);
                    return (
                      <button key={c.id} type="button" onClick={() => toggleCourse(c.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition ${
                          checked ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-border bg-background hover:bg-muted/50'
                        }`}>
                        <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-emerald-600 border-emerald-600' : 'border-input bg-background'}`}>
                          {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium truncate ${checked ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>{c.name}</div>
                          {c.code && <div className="text-[10px] text-muted-foreground uppercase">{c.code}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {allCourses.length > 0 && (
                <div className="flex justify-end mt-4 pt-3 border-t border-border/40">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={saveAssignment}>
                    {saving ? 'Saving…' : 'Save Assignment'}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ============ Announcements ============
function AnnouncementsView({ user }: { user: any }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', message: '', targetScope: 'all', selectedClasses: [] as string[] });
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => {
    api.getAnnouncements().then(r => setAnnouncements(Array.isArray(r) ? r : [])).catch(() => {});
    api.getClasses(user.branchId).then(r => setClasses(Array.isArray(r) ? r : [])).catch(() => {});
  };
  useEffect(() => { refresh(); }, [user.branchId]);

  const send = async () => {
    if (!form.title || !form.message) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const body: any = {
        title: form.title,
        message: form.message,
        targetScope: form.targetScope,
        targetRole: 'student',
      };
      if (form.targetScope === 'specific') {
        body.targetIds = form.selectedClasses;
        // Also pass the first classId for filtering convenience
        if (form.selectedClasses.length > 0) body.classId = form.selectedClasses[0];
      }
      await api.createAnnouncement(body);
      toast({ title: 'Announcement sent!', description: form.targetScope === 'all' ? 'Sent to all classes' : `Sent to ${form.selectedClasses.length} class(es)` });
      setForm({ title: '', message: '', targetScope: 'all', selectedClasses: [] });
      setShowForm(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Announcements" subtitle="Send messages to all classes or specific ones"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(v => !v)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />

      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">New Announcement</h3>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Annual exams schedule" className="mt-1" /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Type your announcement…" className="mt-1 resize-none" /></div>
            <div>
              <Label>Recipients</Label>
              <Select value={form.targetScope} onValueChange={v => setForm({ ...form, targetScope: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="specific">Specific Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.targetScope === 'specific' && (
              <div>
                <Label>Select Classes</Label>
                <div className="mt-2 max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                  {classes.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-3">No classes available in your branch.</div>
                  ) : classes.map(cls => (
                    <label key={cls.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                      <input type="checkbox" checked={form.selectedClasses.includes(cls.id)} onChange={e => {
                        if (e.target.checked) setForm({ ...form, selectedClasses: [...form.selectedClasses, cls.id] });
                        else setForm({ ...form, selectedClasses: form.selectedClasses.filter((id: string) => id !== cls.id) });
                      }} className="w-4 h-4 rounded" />
                      <span className="text-sm">{cls.name}{cls.section ? ` · ${cls.section}` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={sending} onClick={send}>{sending ? 'Sending…' : <><Send className="h-4 w-4 mr-1.5" /> Send Announcement</>}</Button>
          </div>
        </Card>
      )}

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" desc="Send messages to all or specific classes in your branch."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(true)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-rose-500" />
                  <div className="font-medium text-sm">{a.title}</div>
                </div>
                <span className="text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2 ml-6">
                To: {a.targetScope === 'all' ? 'All Classes' : `Specific Classes${a.targetIds ? ` (${JSON.parse(a.targetIds).length})` : ''}`}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScopedBranchModule({ activeModule, user, stats }: any) {
  const titles: Record<string,string> = {
    attendance:'Attendance', results:'Results', timetable:'Timetable', fees:'Fees',
    complaints:'Complaints', events:'Events', sms:'SMS Portal',
  };
  return (
    <div className="space-y-6">
      <ModuleHeader title={titles[activeModule] || activeModule} subtitle={`Scoped to ${user?.branchName}`} />
      <EmptyState icon={Inbox} title="No records yet" desc="Records for this module are created by teachers and staff in your branch. Once they start using their portals, data will appear here." />
    </div>
  );
}
