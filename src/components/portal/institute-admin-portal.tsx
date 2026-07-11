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
import { Building2, Network, Users, DollarSign, Plus, GraduationCap, Mail, Network as NetworkIcon, Inbox } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function InstituteAdminPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);

  const refresh = () => {
    if (user?.instituteId) {
      api.scopedStats(user.instituteId).then(setStats).catch(() => {});
      api.branches(user.instituteId).then(setBranches).catch(() => {});
      api.platformUsers({ instituteId: user.instituteId }).then(setStaff).catch(() => {});
    }
  };
  useEffect(() => { refresh(); }, [user?.instituteId]);

  return (
    <>
      {activeModule === 'branches' && <BranchesManager branches={branches} instituteId={user?.instituteId} onRefresh={refresh} showAdd={showAddBranch} setShowAdd={setShowAddBranch} lastCreated={lastCreated} setLastCreated={setLastCreated} />}
      {activeModule === 'staff' && <StaffManager staff={staff} instituteId={user?.instituteId} />}
      {['students','attendance','results','academics','fees','finance','sms','complaints','events','library','transport'].includes(activeModule) && (
        <ScopedModuleView activeModule={activeModule} user={user} stats={stats} staff={staff} branches={branches} />
      )}
      {!['branches','staff','students','attendance','results','academics','fees','finance','sms','complaints','events','library','transport'].includes(activeModule) && (
        <InstituteOverview user={user} stats={stats} branches={branches} onAddBranch={() => setShowAddBranch(true)} />
      )}
      <BranchModal show={showAddBranch} setShow={setShowAddBranch} instituteId={user?.instituteId} onRefresh={refresh} lastCreated={lastCreated} setLastCreated={setLastCreated} />
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

function InstituteOverview({ user, stats, branches, onAddBranch }: any) {
  const cards = [
    { label: 'Branches', value: stats?.branches ?? 0, icon: Network, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Total Students', value: stats?.students ?? 0, icon: GraduationCap, color: 'from-teal-500 to-cyan-600' },
    { label: 'Staff Members', value: stats?.staff ?? 0, icon: Users, color: 'from-violet-500 to-purple-600' },
    { label: 'Revenue', value: fmtMoney(stats?.revenue || 0), icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><Building2 className="h-3 w-3 text-amber-300" /> Institute Admin · {user?.instituteName}</div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-emerald-50/80 text-sm mt-1.5 max-w-lg">{stats?.branches ? `You manage ${stats.branches} branches with ${stats.students} students.` : 'Add your first branch to get started.'}</p>
          </div>
          <Button className="bg-white text-emerald-800 hover:bg-emerald-50" size="sm" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>
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
            </Card>
          </motion.div>
        ))}
      </div>

      {branches.length === 0 ? (
        <EmptyState icon={Network} title="No branches yet" desc="Add your first branch. A Branch Manager login will be auto-created so they can manage it independently."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Your First Branch</Button>} />
      ) : (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-bold text-base">Your Branches</h3><p className="text-xs text-muted-foreground">Each branch has its own Branch Manager login</p></div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((br, i) => (
              <motion.div key={br.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 grid place-items-center"><Network className="h-5 w-5 text-white" /></div>
                    <Badge variant="outline" className="font-mono text-[10px]">{br.id}</Badge>
                  </div>
                  <h3 className="font-bold text-sm">{br.name}</h3>
                  <div className="text-[11px] text-muted-foreground">{br.city}</div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40 text-center">
                    <div><div className="font-bold text-sm">{br.students}</div><div className="text-[10px] text-muted-foreground">Students</div></div>
                    <div><div className="font-bold text-sm">{br.teachers}</div><div className="text-[10px] text-muted-foreground">Teachers</div></div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground truncate flex items-center gap-1"><Mail className="h-3 w-3" /> {br.managerEmail}</div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function BranchesManager({ branches, instituteId, onRefresh, showAdd, setShowAdd }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Branches" subtitle="Add branches — a Branch Manager login is auto-created for each"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>} />
      {branches.length === 0 ? (
        <EmptyState icon={Network} title="No branches yet" desc="Add your first branch. A Branch Manager login will be auto-created."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>} />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Branch</TableHead><TableHead className="hidden md:table-cell">City</TableHead><TableHead>Students</TableHead><TableHead className="hidden sm:table-cell">Teachers</TableHead><TableHead>Manager</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {branches.map((br:any) => (
                <TableRow key={br.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{br.name}</div><div className="text-[11px] text-muted-foreground font-mono">{br.id}</div></TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{br.city}</TableCell>
                  <TableCell className="text-sm font-medium">{br.students}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{br.teachers}</TableCell>
                  <TableCell><div className="text-sm">{br.manager}</div><div className="text-[11px] text-muted-foreground">{br.managerEmail}</div></TableCell>
                  <TableCell><Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{br.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function BranchModal({ show, setShow, instituteId, onRefresh, lastCreated, setLastCreated }: any) {
  const [form, setForm] = useState({ name: '', city: '', managerName: '', managerEmail: '' });
  const [creating, setCreating] = useState(false);
  const create = async () => {
    if (!form.name || !form.managerEmail) { toast({ title: 'Branch name and manager email required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const res = await api.createBranch({ ...form, instituteId });
      toast({ title: 'Branch created!', description: `${res.branch.name} — manager login ready` });
      setLastCreated(res); setForm({ name: '', city: '', managerName: '', managerEmail: '' }); onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };
  if (!show && !lastCreated) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => { setShow(false); setLastCreated(null); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg">
        <Card className="p-6">
          {lastCreated ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center"><Plus className="h-6 w-6 text-emerald-600 rotate-45" /></div>
                <div><h3 className="font-display font-bold text-lg">Branch created!</h3><p className="text-sm text-muted-foreground">{lastCreated.branch.name}</p></div>
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 text-sm">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">Branch Manager login</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono">{lastCreated.managerLogin.email}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">esm123</span></div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-emerald-500/20">The manager signs in at the same portal — ESM routes them to the Branch Manager portal automatically.</div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={() => { setShow(false); setLastCreated(null); }}>Done</Button>
                <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-display font-bold text-lg mb-1">Add a new branch</h3>
              <p className="text-sm text-muted-foreground mb-5">A Branch Manager login will be auto-created (password <span className="font-mono">esm123</span>)</p>
              <div className="space-y-3">
                <div><Label>Branch name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. North Campus" className="mt-1" /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Round Rock" className="mt-1" /></div>
                <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Branch Manager (auto-provisioned)</div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Manager name</Label><Input value={form.managerName} onChange={e => setForm({ ...form, managerName: e.target.value })} placeholder="Lisa Chen" className="mt-1" /></div>
                  <div><Label>Manager email *</Label><Input type="email" value={form.managerEmail} onChange={e => setForm({ ...form, managerEmail: e.target.value })} placeholder="manager@school.edu" className="mt-1" /></div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" disabled={creating} onClick={create}>{creating ? 'Creating…' : 'Create Branch'}</Button>
                <Button size="sm" variant="outline" onClick={() => setShow(false)}>Cancel</Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

function StaffManager({ staff, instituteId }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Staff & Members" subtitle="All logins in your institute, by role" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['branch-manager','teacher','student','parent'].map(role => {
          const count = staff.filter((s:any) => s.role === role).length;
          return <Card key={role} className="p-4 text-center"><div className="text-2xl font-extrabold font-display">{count}</div><div className="text-xs text-muted-foreground capitalize">{role.replace('-',' ')}</div></Card>;
        })}
      </div>
      {staff.length === 0 ? (
        <EmptyState icon={Users} title="No staff yet" desc="Staff and students are added by Branch Managers. Once branches are created and staff added, they'll appear here." />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead className="hidden md:table-cell">Branch</TableHead><TableHead className="hidden lg:table-cell">Email</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {staff.map((s:any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{s.name}</div></TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{s.roleLabel}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{s.branchName || '—'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{s.email}</TableCell>
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

function ScopedModuleView({ activeModule, user, stats, staff, branches }: any) {
  const titles: Record<string,string> = {
    students:'Students', attendance:'Attendance', results:'Results', academics:'Academics',
    fees:'Fee Management', finance:'Finance', sms:'SMS Portal', complaints:'Complaints',
    events:'Events', library:'Library', transport:'Transport',
  };
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    // fetch real scoped data based on module
    const fetchData = async () => {
      try {
        if (activeModule === 'students') { const u = await api.platformUsers({ instituteId: user.instituteId, role: 'student' }); setData(u); }
        else if (activeModule === 'attendance') { const r = await api.getAttendance({ branchId: undefined }); setData([]); /* scoped per branch, need to iterate */ }
        else if (activeModule === 'results') { setData([]); }
        else if (activeModule === 'fees') { const f = await api.getFees({ instituteId: user.instituteId }); setData(f); }
        else if (activeModule === 'sms') { const s = await api.getSms({ instituteId: user.instituteId }); setData(s); }
        else if (activeModule === 'complaints') { const c = await api.getComplaints({ instituteId: user.instituteId }); setData(c); }
        else if (activeModule === 'events') { const e = await api.getEvents({ instituteId: user.instituteId }); setData(e); }
        else setData([]);
      } catch { setData([]); }
    };
    fetchData();
  }, [activeModule, user?.instituteId]);

  const studentList = activeModule === 'students' ? staff.filter((s:any) => s.role === 'student') : [];

  return (
    <div className="space-y-6">
      <ModuleHeader title={titles[activeModule] || activeModule} subtitle={`Scoped to ${user?.instituteName}`} />
      {activeModule === 'students' && (
        studentList.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students yet" desc="Students are added by Branch Managers. Once they add students to branches, they'll appear here." />
        ) : (
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="hidden md:table-cell">Branch</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {studentList.map((s:any) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell><div className="font-medium text-sm">{s.name}</div><div className="text-[11px] text-muted-foreground">{s.email}</div></TableCell>
                    <TableCell><Badge variant="outline" className="font-normal">{s.class} · {s.section}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{s.branchName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{s.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      )}
      {['attendance','results','academics'].includes(activeModule) && (
        <EmptyState icon={Inbox} title="No records yet" desc="Attendance and results are created by teachers in their portal. Once teachers start marking attendance and posting results, the data will appear here." />
      )}
      {['fees','finance','sms','complaints','events','library','transport'].includes(activeModule) && (
        data.length === 0 ? (
          <EmptyState icon={Inbox} title="No records yet" desc="Records for this module will appear here as they're created by staff and teachers across your branches." />
        ) : (
          <Card className="p-4">
            <div className="space-y-2">
              {data.map((d:any,i:number) => (
                <div key={i} className="p-3 rounded-lg bg-muted/40 text-sm">
                  <pre className="text-xs overflow-x-auto">{JSON.stringify(d, null, 2)}</pre>
                </div>
              ))}
            </div>
          </Card>
        )
      )}
    </div>
  );
}
