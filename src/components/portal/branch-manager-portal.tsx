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
import { Users, GraduationCap, DollarSign, CalendarCheck, Plus, CheckCircle2, UserPlus, BookOpen, Network, Inbox, Calendar } from 'lucide-react';
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

  return (
    <>
      {activeModule === 'teachers' && <TeachersView teachers={teachers} onAdd={() => { setAddRole('teacher'); setShowAdd(true); }} />}
      {activeModule === 'branch-students' && <StudentsView students={students} onAdd={() => { setAddRole('student'); setShowAdd(true); }} />}
      {activeModule === 'add-teacher' && <TeachersView teachers={teachers} onAdd={() => { setAddRole('teacher'); setShowAdd(true); }} />}
      {activeModule === 'add-student' && <StudentsView students={students} onAdd={() => { setAddRole('student'); setShowAdd(true); }} />}
      {['attendance','results','timetable','fees','complaints','events','sms'].includes(activeModule) && (
        <ScopedBranchModule activeModule={activeModule} user={user} stats={stats} />
      )}
      {!['teachers','branch-students','add-teacher','add-student','attendance','results','timetable','fees','complaints','events','sms'].includes(activeModule) && (
        <BranchOverview user={user} stats={stats} teachers={teachers} students={students}
          onAddTeacher={() => { setAddRole('teacher'); setShowAdd(true); }}
          onAddStudent={() => { setAddRole('student'); setShowAdd(true); }} />
      )}
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

function TeachersView({ teachers, onAdd }: any) {
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
              <TableHead>Teacher</TableHead><TableHead className="hidden md:table-cell">Subjects</TableHead><TableHead className="hidden sm:table-cell">Classes</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {teachers.map((t:any) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{t.name}</div><div className="text-[11px] text-muted-foreground">{t.email}</div></TableCell>
                  <TableCell className="hidden md:table-cell">{t.subjects?.map((s:string) => <Badge key={s} variant="secondary" className="mr-1 font-normal text-[10px]">{s}</Badge>) || '—'}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{t.classes?.join(', ') || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function StudentsView({ students, onAdd }: any) {
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
              <TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="hidden sm:table-cell">Roll No</TableHead><TableHead className="hidden md:table-cell">Guardian</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {students.map((s:any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{s.name}</div><div className="text-[11px] text-muted-foreground">{s.email}</div></TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{s.class} · {s.section}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-sm">{s.rollNo}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{s.guardian || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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
