'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Network, Inbox, Eye, Edit, Lock, Unlock, Megaphone, Send, BookCopy,
  FileText, Wallet, Loader2, Banknote,
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
  if (activeModule === 'teachers') content = <TeachersView teachers={teachers} onRefresh={refresh} onAdd={() => openAdd('teacher')} />;
  else if (activeModule === 'branch-students') content = <StudentsView students={students} onRefresh={refresh} onAdd={() => openAdd('student')} />;
  else if (activeModule === 'announcements') content = <AnnouncementsView user={user} />;
  else if (activeModule === 'class-courses') content = <ClassCoursesView user={user} />;
  else if (activeModule === 'fees') content = <FeeManagement user={user} />;
  else if (['attendance','results','timetable','complaints','events','sms'].includes(activeModule)) content = <ScopedBranchModule activeModule={activeModule} user={user} stats={stats} />;
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
    { label: 'Students', value: stats?.students ?? 0, icon: GraduationCap, color: 'from-primary to-primary/80', action: onAddStudent, actionLabel: 'Add Student' },
    { label: 'Teachers', value: stats?.teachers ?? 0, icon: Users, color: 'from-primary/80 to-primary', action: onAddTeacher, actionLabel: 'Add Teacher' },
    { label: 'Fee Collected', value: fmtMoney(stats?.feeCollected || 0), icon: DollarSign, color: 'from-primary/80 to-primary' },
    { label: 'Attendance Rate', value: (stats?.attendance || 0) + '%', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[oklch(0.5_0.04_260)_/_0.15] blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><Network className="h-3 w-3 text-primary/70" /> Branch Manager · {user?.branchName}</div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="text-white/80 text-sm mt-1.5 max-w-lg">
              {stats?.students || stats?.teachers ? `You have ${stats.students} students and ${stats.teachers} teachers.` : 'Add your first teacher or student to get started.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-white text-primary hover:bg-accent" size="sm" onClick={onAddTeacher}><UserPlus className="h-4 w-4 mr-1.5" /> Add Teacher</Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" size="sm" onClick={onAddStudent}><Plus className="h-4 w-4 mr-1.5" /> Student</Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 hover:shadow-md transition border border-border rounded-lg shadow-sm">
              <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center mb-3"><c.icon className="h-5 w-5 text-primary" /></div>
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
                  <div className="h-9 w-9 rounded-full bg-accent0/15 grid place-items-center"><Users className="h-4 w-4 text-primary" /></div>
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
                  <div className="h-9 w-9 rounded-full bg-accent0/15 grid place-items-center"><GraduationCap className="h-4 w-4 text-primary" /></div>
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
      <button onClick={toggleBlock} disabled={busy} title={u.blocked ? 'Unblock' : 'Block'} className={`h-8 w-8 grid place-items-center rounded-lg ${u.blocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-primary hover:bg-accent0/10'} disabled:opacity-50`}>{u.blocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
      {showPass && (
        <div className="ml-2 px-2 py-1 rounded-md bg-accent dark:bg-[oklch(0.12_0.03_260)_/_0.4] border border-accent dark:border-[oklch(0.25_0.04_260)] text-xs">
          <span className="text-primary dark:text-primary/70 font-mono">{pass}</span>
          {mustChange && <span className="text-primary dark:text-[oklch(0.6_0.04_260)] ml-1">· must change</span>}
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
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</Button>
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
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={onAdd}><UserPlus className="h-4 w-4 mr-1.5" /> Add Teacher</Button>} />
      {teachers.length === 0 ? (
        <EmptyState icon={Users} title="No teachers yet" desc="Add your first teacher. A login will be auto-created so they can sign in to their Teacher portal."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={onAdd}><UserPlus className="h-4 w-4 mr-1.5" /> Add Teacher</Button>} />
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
                  <TableCell><Badge variant="outline" className={t.blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]'}>{t.blocked ? 'Blocked' : (t.status || 'Active')}</Badge></TableCell>
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
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>} />
      {students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students yet" desc="Add your first student. A login will be auto-created so they (or their parents) can sign in to their portal."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={onAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Student</Button>} />
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
                  <TableCell><Badge variant="outline" className={s.blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]'}>{s.blocked ? 'Blocked' : (s.status || 'Active')}</Badge></TableCell>
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
// Extract the numeric portion of a class name (e.g. "Class 5" → 5, "Class 12" → 12) for sorting.
function classNumber(name: string): number {
  const m = String(name || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

type ClassGroup = { name: string; primary: any; sections: any[] };

function groupClassesByName(rows: any[]): ClassGroup[] {
  const map: Record<string, any[]> = {};
  for (const c of rows) {
    const key = c.name || 'Class';
    if (!map[key]) map[key] = [];
    map[key].push(c);
  }
  return Object.entries(map).map(([name, sections]) => {
    const sorted = [...sections].sort((a, b) => (a.section || 'A').localeCompare(b.section || 'A'));
    return { name, primary: sorted[0], sections: sorted };
  }).sort((a, b) => classNumber(a.name) - classNumber(b.name));
}

function ClassCoursesView({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClassName, setActiveClassName] = useState<string>('');
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAssignCourses, setShowAssignCourses] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', code: '' });
  const [creating, setCreating] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionLetter, setNewSectionLetter] = useState('');
  const [creatingSection, setCreatingSection] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      api.getClasses(user.branchId).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.getCourses({ branchId: user.branchId }).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([cls, crs, stu]) => {
      setClasses(cls);
      setAllCourses(crs);
      setStudents(stu);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user.branchId]);

  // When the active class changes, fetch its assigned courses (uses the primary section's classId).
  useEffect(() => {
    if (!activeClassName) { setAssignedCourseIds([]); return; }
    const groups = groupClassesByName(classes);
    const grp = groups.find(g => g.name === activeClassName);
    if (!grp) { setAssignedCourseIds([]); return; }
    let cancelled = false;
    setLoadingAssigned(true);
    api.getCourses({ classId: grp.primary.id })
      .then(r => { if (!cancelled) setAssignedCourseIds((Array.isArray(r) ? r : []).map((c: any) => c.id)); })
      .catch(() => { if (!cancelled) setAssignedCourseIds([]); })
      .finally(() => { if (!cancelled) setLoadingAssigned(false); });
    return () => { cancelled = true; };
  }, [activeClassName, classes]);

  const grouped = groupClassesByName(classes);
  const activeGroup = grouped.find(g => g.name === activeClassName) || null;

  const toggleCourse = (id: string) => {
    setAssignedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveAssignment = async () => {
    if (!activeGroup) return;
    setSaving(true);
    try {
      // Assign to the primary (section A) class row. Sections created later will inherit these courses.
      await api.assignClassCourses(activeGroup.primary.id, assignedCourseIds);
      toast({ title: 'Courses assigned', description: `${assignedCourseIds.length} course(s) linked to ${activeGroup.name}` });
      setShowAssignCourses(false);
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

  const createSection = async () => {
    if (!activeGroup) return;
    setCreatingSection(true);
    try {
      const letter = newSectionLetter.trim().toUpperCase();
      const res = await api.createClassSection(activeGroup.primary.id, letter || undefined);
      toast({ title: 'Section created', description: `${activeGroup.name} ${res.section} is now available` });
      setNewSectionLetter('');
      setShowAddSection(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreatingSection(false); }
  };

  const deleteSection = async (classId: string, label: string) => {
    if (!confirm(`Delete section ${label}? This cannot be undone.`)) return;
    try {
      await api.deleteClassSection(classId);
      toast({ title: 'Section deleted', description: `${label} was removed` });
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const studentsInSection = (className: string, section: string) =>
    students.filter(s => s.class === className && (s.section || 'A') === (section || 'A'));

  // -------- Detail view (one class selected) --------
  if (activeGroup) {
    const assignedCourses = allCourses.filter(c => assignedCourseIds.includes(c.id));
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <button onClick={() => { setActiveClassName(''); setShowAssignCourses(false); setShowCreateCourse(false); setShowAddSection(false); }}
              className="mt-1 h-9 w-9 grid place-items-center rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition"
              title="Back to all classes">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            </button>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> {activeGroup.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeGroup.sections.length} section{activeGroup.sections.length === 1 ? '' : 's'} · {assignedCourses.length} course{assignedCourses.length === 1 ? '' : 's'} assigned
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setShowCreateCourse(v => !v)}><BookCopy className="h-4 w-4 mr-1.5" /> New Course</Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowAssignCourses(v => !v)}><CheckCircle2 className="h-4 w-4 mr-1.5" /> {showAssignCourses ? 'Hide Course List' : 'Assign Courses'}</Button>
          </div>
        </div>

        {/* Create course form (collapsible) */}
        {showCreateCourse && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><BookCopy className="h-4 w-4 text-primary" /><h3 className="font-bold text-base">Create New Course</h3></div>
            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2"><Label>Course name *</Label><Input value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="e.g. Mathematics" className="mt-1" /></div>
              <div><Label>Code</Label><Input value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} placeholder="e.g. MATH-101" className="mt-1" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={creating} onClick={createCourse}>{creating ? 'Creating…' : 'Create Course'}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {/* Assigned courses + assign checklist */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Assigned Courses</h3>
              <p className="text-xs text-muted-foreground mt-0.5">These courses are taught in {activeGroup.name}. New sections inherit this list automatically.</p>
            </div>
            <Badge variant="outline" className="text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]">{assignedCourseIds.length} assigned</Badge>
          </div>

          {loadingAssigned ? (
            <div className="text-sm text-muted-foreground py-4 text-center">Loading assigned courses…</div>
          ) : assignedCourses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[oklch(0.6_0.04_260)] dark:border-blue-700 bg-accent dark:bg-[oklch(0.12_0.03_260)_/_0.4] px-4 py-4 text-sm text-primary dark:text-[oklch(0.8_0.03_260)]">
              <strong>No courses assigned yet.</strong> Click <em>Assign Courses</em> above to select the subjects taught in this class. You must assign courses before you can add teachers for this class.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedCourses.map(c => (
                <Badge key={c.id} variant="secondary" className="px-3 py-1.5 font-normal text-sm bg-accent0/10 text-primary dark:text-primary/70 border border-[oklch(0.5_0.04_260)_/_0.2]">
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" /> {c.name}{c.code ? <span className="ml-1.5 text-[10px] uppercase opacity-70">{c.code}</span> : null}
                </Badge>
              ))}
            </div>
          )}

          {showAssignCourses && (
            <div className="mt-5 pt-5 border-t border-border/40">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">All branch courses — toggle to assign</h4>
                <span className="text-xs text-muted-foreground">{assignedCourseIds.length} of {allCourses.length} selected</span>
              </div>
              {allCourses.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No courses created in this branch yet. <button onClick={() => setShowCreateCourse(true)} className="text-primary hover:underline font-medium">Create one now</button>.
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto scroll-fancy pr-1">
                    {allCourses.map(c => {
                      const checked = assignedCourseIds.includes(c.id);
                      return (
                        <button key={c.id} type="button" onClick={() => toggleCourse(c.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition ${
                            checked ? 'border-[oklch(0.5_0.04_260)_/_0.4] bg-accent0/10' : 'border-border bg-background hover:bg-muted/50'
                          }`}>
                          <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-primary border-blue-700' : 'border-input bg-background'}`}>
                            {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-medium truncate ${checked ? 'text-primary dark:text-primary/70' : ''}`}>{c.name}</div>
                            {c.code && <div className="text-[10px] text-muted-foreground uppercase">{c.code}</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-4 pt-3 border-t border-border/40 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAssignCourses(false)}>Cancel</Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving} onClick={saveAssignment}>
                      {saving ? 'Saving…' : 'Save Assignment'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        {/* Sections */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2"><Network className="h-4 w-4 text-primary" /> Sections</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Each section can have its own students. New sections inherit this class's course list.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddSection(v => !v)}><Plus className="h-4 w-4 mr-1.5" /> Add Section</Button>
          </div>

          {showAddSection && (
            <div className="mb-4 rounded-lg border border-[oklch(0.5_0.04_260)_/_0.3] bg-accent0/5 p-4">
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Label>Section letter (optional)</Label>
                  <Input value={newSectionLetter} onChange={e => setNewSectionLetter(e.target.value)} placeholder="e.g. C — leave blank for the next available letter" className="mt-1" maxLength={2} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={creatingSection} onClick={createSection}>{creatingSection ? 'Creating…' : 'Create Section'}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowAddSection(false); setNewSectionLetter(''); }}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeGroup.sections.map(sec => {
              const secStudents = studentsInSection(activeGroup.name, sec.section);
              const canDelete = activeGroup.sections.length > 1 && secStudents.length === 0;
              return (
                <div key={sec.id} className="rounded-xl border border-border bg-card p-4 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center text-white font-bold">{(sec.section || 'A').toUpperCase()}</div>
                      <div>
                        <div className="font-bold text-sm">{activeGroup.name} {(sec.section || 'A').toUpperCase()}</div>
                        <div className="text-[11px] text-muted-foreground">{secStudents.length} student{secStudents.length === 1 ? '' : 's'}</div>
                      </div>
                    </div>
                    {canDelete && (
                      <button onClick={() => deleteSection(sec.id, `${activeGroup.name} ${sec.section}`)} title="Delete this section" className="h-8 w-8 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex-1 min-h-0">
                    {secStudents.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border/60 rounded-lg">No students assigned</div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto scroll-fancy">
                        {secStudents.map(s => (
                          <div key={s.id} className="flex items-center gap-2 text-xs">
                            <div className="h-6 w-6 rounded-full bg-accent0/15 grid place-items-center text-primary"><GraduationCap className="h-3 w-3" /></div>
                            <div className="min-w-0 flex-1"><div className="font-medium truncate">{s.name}</div></div>
                            <div className="font-mono text-[10px] text-muted-foreground">{s.rollNo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // -------- Grid view (no class selected) --------
  return (
    <div className="space-y-6">
      <ModuleHeader title="Classes & Courses" subtitle="Click a class to manage its courses and sections"
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowCreateCourse(v => !v)}><BookCopy className="h-4 w-4 mr-1.5" /> New Course</Button>} />

      {showCreateCourse && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3"><BookCopy className="h-4 w-4 text-primary" /><h3 className="font-bold text-base">Create New Course</h3></div>
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2"><Label>Course name *</Label><Input value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="e.g. Mathematics" className="mt-1" /></div>
            <div><Label>Code</Label><Input value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} placeholder="e.g. MATH-101" className="mt-1" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={creating} onClick={createCourse}>{creating ? 'Creating…' : 'Create Course'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Loading classes…</Card>
      ) : grouped.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes found" desc="Classes (Class 1 – Class 12) are auto-created when your branch is provisioned. If you don't see them, ask your Institute Admin." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {grouped.map((g, idx) => {
            const studentCount = g.sections.reduce((acc: number, s: any) => acc + studentsInSection(g.name, s.section).length, 0);
            return (
              <button key={g.name} onClick={() => { setActiveClassName(g.name); setShowCreateCourse(false); }}
                className="text-left p-4 rounded-xl border border-border bg-card hover:border-[oklch(0.5_0.04_260)_/_0.4] hover:bg-muted/40 hover:shadow-md transition group">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold">
                    {classNumber(g.name) || (idx + 1)}
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">{g.sections.length} sec{g.sections.length === 1 ? '' : 's'}</Badge>
                </div>
                <div className="mt-3 font-bold text-sm">{g.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{studentCount} student{studentCount === 1 ? '' : 's'} enrolled</div>
                <div className="mt-2 text-[11px] text-primary dark:text-[oklch(0.6_0.04_260)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <BookOpen className="h-3 w-3" /> Click to manage
                </div>
              </button>
            );
          })}
        </div>
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
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(v => !v)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />

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
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={sending} onClick={send}>{sending ? 'Sending…' : <><Send className="h-4 w-4 mr-1.5" /> Send Announcement</>}</Button>
          </div>
        </Card>
      )}

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" desc="Send messages to all or specific classes in your branch."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(true)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />
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

// ============ Fee Management ============
const FEE_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtPKR = (n: number) => 'Rs. ' + (Number(n) || 0).toLocaleString('en-PK');

function FeeManagement({ user }: { user: any }) {
  const [tab, setTab] = useState<'structure' | 'invoices'>('structure');
  const tabs = [
    { id: 'structure' as const, label: 'Fee Structure', icon: BookOpen },
    { id: 'invoices' as const, label: 'Invoices', icon: FileText },
  ];
  return (
    <div className="space-y-6">
      <ModuleHeader title="Fee Management" subtitle={`Set class fees and generate monthly invoices · ${user?.branchName || ''}`} />
      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 overflow-x-auto scroll-fancy max-w-md">
        {tabs.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'structure' && <FeeStructureTab user={user} />}
      {tab === 'invoices' && <FeeInvoicesTab user={user} />}
    </div>
  );
}

function FeeStructureTab({ user }: { user: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [structure, setStructure] = useState<Record<string, any>>({});
  const [edits, setEdits] = useState<Record<string, { monthly: string; admission: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      api.getClasses(user.branchId).then(r => Array.isArray(r) ? r : []).catch(() => []),
      api.getFeeStructure().then(r => Array.isArray(r) ? r : []).catch(() => []),
    ]).then(([cls, struct]) => {
      setClasses(cls);
      const map: Record<string, any> = {};
      for (const s of struct) map[s.classId] = s;
      setStructure(map);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user?.branchId]);

  // Group class sections by name — one fee entry per class group (uses the primary section's classId)
  const grouped = useMemo(() => {
    const map: Record<string, any> = {};
    for (const c of classes) {
      const key = c.name || 'Class';
      if (!map[key]) map[key] = c; // first section wins (sections are usually sorted A → Z)
    }
    return Object.values(map).sort((a: any, b: any) => classNumber(a.name) - classNumber(b.name));
  }, [classes]);

  const getEdits = (cls: any) => {
    const existing = structure[cls.id];
    const e = edits[cls.id];
    return {
      monthly: e?.monthly ?? (existing?.monthlyFee != null ? String(existing.monthlyFee) : ''),
      admission: e?.admission ?? (existing?.admissionFee != null ? String(existing.admissionFee) : ''),
    };
  };

  const save = async (cls: any) => {
    const { monthly, admission } = getEdits(cls);
    const monthlyNum = Number(monthly);
    if (!monthlyNum || monthlyNum <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter a valid monthly fee greater than 0.', variant: 'destructive' });
      return;
    }
    setSavingId(cls.id);
    try {
      await api.setFeeStructure(cls.id, monthlyNum, admission ? Number(admission) : undefined);
      toast({ title: 'Fee saved', description: `${cls.name} monthly fee set to ${fmtPKR(monthlyNum)}` });
      refresh();
    } catch (e: any) { toast({ title: 'Failed to save', description: e.message, variant: 'destructive' }); }
    finally { setSavingId(null); }
  };

  if (loading) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">Loading fee structure…</Card>;
  }

  if (grouped.length === 0) {
    return <EmptyState icon={DollarSign} title="No classes found" desc="Classes (Class 1 – Class 12) are auto-created when your branch is provisioned. Ask your Institute Admin if you don't see them." />;
  }

  // Summary stats
  const setCount = grouped.filter(g => structure[g.id]?.monthlyFee != null).length;
  const avgMonthly = setCount > 0
    ? Math.round(grouped.reduce((acc, g) => acc + (Number(structure[g.id]?.monthlyFee) || 0), 0) / setCount)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Classes</div>
          <div className="text-2xl font-extrabold font-display mt-1">{grouped.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Fees Configured</div>
          <div className="text-2xl font-extrabold font-display mt-1 text-primary">{setCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Avg Monthly Fee</div>
          <div className="text-2xl font-extrabold font-display mt-1">{fmtPKR(avgMonthly)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pending Setup</div>
          <div className="text-2xl font-extrabold font-display mt-1 text-sky-700">{grouped.length - setCount}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-base">Monthly Fee Structure</h3>
          <span className="text-xs text-muted-foreground ml-1">Edit each class's monthly fee and save.</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {grouped.map((cls: any) => {
            const e = getEdits(cls);
            const isSaving = savingId === cls.id;
            const isSet = structure[cls.id]?.monthlyFee != null;
            return (
              <div key={cls.id} className={`p-4 rounded-xl border ${isSet ? 'border-[oklch(0.5_0.04_260)_/_0.3] bg-accent0/5' : 'border-dashed border-border'} hover:shadow-sm transition`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold text-xs">
                      {classNumber(cls.name) || '—'}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{cls.name}</div>
                      <div className="text-[10px] text-muted-foreground">{isSet ? 'Configured' : 'Not set'}</div>
                    </div>
                  </div>
                  {isSet && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly Fee (Rs.)</Label>
                    <div className="relative mt-0.5">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rs.</span>
                      <Input
                        type="number"
                        value={e.monthly}
                        onChange={ev => setEdits(prev => ({ ...prev, [cls.id]: { ...e, monthly: ev.target.value } }))}
                        placeholder="0"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Admission Fee (Rs.)</Label>
                    <div className="relative mt-0.5">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rs.</span>
                      <Input
                        type="number"
                        value={e.admission}
                        onChange={ev => setEdits(prev => ({ ...prev, [cls.id]: { ...e, admission: ev.target.value } }))}
                        placeholder="0"
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isSaving} onClick={() => save(cls)}>
                    {isSaving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving…</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Save</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function FeeInvoicesTab({ user }: { user: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genMonth, setGenMonth] = useState<string>(FEE_MONTHS[new Date().getMonth()]);
  const [genYear, setGenYear] = useState<string>(String(new Date().getFullYear()));
  const [payingId, setPayingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const refresh = () => {
    setLoading(true);
    api.getBranchInvoices()
      .then(r => setInvoices(Array.isArray(r) ? r : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const generate = async () => {
    if (!genMonth || !genYear) { toast({ title: 'Month and year required', variant: 'destructive' }); return; }
    setGenerating(true);
    try {
      const res = await api.generateInvoices(genMonth, Number(genYear));
      const created = res?.generated ?? res?.created ?? res?.count ?? (Array.isArray(res?.invoices) ? res.invoices.length : null);
      toast({ title: 'Invoices generated', description: created != null ? `${created} invoice(s) created for ${genMonth} ${genYear}` : (res?.message || `Invoices for ${genMonth} ${genYear} generated`) });
      setShowGenerate(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed to generate', description: e.message, variant: 'destructive' }); }
    finally { setGenerating(false); }
  };

  const markPaid = async (inv: any) => {
    setPayingId(inv.id);
    try {
      await api.markInvoicePaid(inv.id, Number(inv.amount) || 0, 'Cash');
      toast({ title: 'Invoice paid', description: `${inv.studentName}'s ${inv.month} invoice marked as paid` });
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setPayingId(null); }
  };

  const filtered = invoices.filter(inv => {
    if (filter === 'paid') return String(inv.status).toLowerCase() === 'paid';
    if (filter === 'unpaid') return String(inv.status).toLowerCase() !== 'paid';
    return true;
  });

  const stats = useMemo(() => {
    const total = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const paid = invoices.filter(i => String(i.status).toLowerCase() === 'paid').reduce((acc, i) => acc + (Number(i.paidAmount || i.amount) || 0), 0);
    const pending = total - paid;
    return { total, paid, pending, count: invoices.length };
  }, [invoices]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Invoices</div>
          <div className="text-2xl font-extrabold font-display mt-1">{stats.count}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Collected</div>
          <div className="text-xl font-extrabold font-display mt-1 text-primary">{fmtPKR(stats.paid)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pending</div>
          <div className="text-xl font-extrabold font-display mt-1 text-rose-600">{fmtPKR(stats.pending)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total Amount</div>
          <div className="text-xl font-extrabold font-display mt-1">{fmtPKR(stats.total)}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">Branch Invoices</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-lg bg-muted/60 text-xs">
              {([['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setFilter(id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${filter === id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowGenerate(v => !v)}>
              <Plus className="h-4 w-4 mr-1.5" /> Generate Invoices
            </Button>
          </div>
        </div>

        {showGenerate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mb-4">
            <div className="p-4 rounded-xl border border-[oklch(0.5_0.04_260)_/_0.3] bg-accent0/5">
              <div className="flex items-center gap-2 mb-3"><Banknote className="h-4 w-4 text-primary" /><span className="font-bold text-sm">Generate Monthly Invoices</span></div>
              <p className="text-xs text-muted-foreground mb-3">This creates one invoice per active student for the selected month and year, based on their class's monthly fee.</p>
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div>
                  <Label className="text-xs">Month</Label>
                  <Select value={genMonth} onValueChange={setGenMonth}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select month" /></SelectTrigger>
                    <SelectContent>
                      {FEE_MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Year</Label>
                  <Input type="number" value={genYear} onChange={e => setGenYear(e.target.value)} className="mt-1" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={generating} onClick={generate}>
                    {generating ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</> : 'Generate'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-10 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex h-12 w-12 rounded-xl bg-muted/60 items-center justify-center mb-3"><FileText className="h-5 w-5 text-muted-foreground" /></div>
            <div className="font-bold text-sm">{invoices.length === 0 ? 'No invoices yet' : 'No invoices match this filter'}</div>
            <div className="text-xs text-muted-foreground mt-1">{invoices.length === 0 ? 'Click "Generate Invoices" to create monthly invoices for all students.' : 'Try changing the filter above.'}</div>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(inv => {
                  const isPaid = String(inv.status).toLowerCase() === 'paid';
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium text-sm">{inv.studentName || '—'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{inv.challanNo || inv.id?.slice(-8)}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-normal text-[11px]">{inv.className || '—'}</Badge></TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{inv.month || '—'}{inv.year ? ` ${inv.year}` : ''}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{fmtPKR(Number(inv.amount) || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isPaid ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.3]' : 'text-rose-700 bg-rose-500/10 border-rose-500/30'}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                        {isPaid && inv.paidDate && <div className="text-[10px] text-muted-foreground mt-0.5">{inv.paidDate}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPaid ? (
                          <span className="text-[11px] text-primary inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Settled</span>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 text-xs border-[oklch(0.5_0.04_260)_/_0.4] text-primary hover:bg-accent0/10" disabled={payingId === inv.id} onClick={() => markPaid(inv)}>
                            {payingId === inv.id ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Marking…</> : 'Mark Paid'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
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
