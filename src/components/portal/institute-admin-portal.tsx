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
  Building2, Network, Users, DollarSign, Plus, GraduationCap, Mail, Inbox,
  Megaphone, Send, Lock, Unlock, Edit, Eye,
} from 'lucide-react';
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

  if (activeModule === 'announcements') return <AnnouncementsView user={user} />;

  return (
    <>
      {activeModule === 'branches' && <BranchesManager branches={branches} instituteId={user?.instituteId} onRefresh={refresh} showAdd={showAddBranch} setShowAdd={setShowAddBranch} lastCreated={lastCreated} setLastCreated={setLastCreated} />}
      {activeModule === 'staff' && <StaffManager staff={staff} instituteId={user?.instituteId} />}
      {['students','attendance','results','academics','fees','finance','sms','complaints','events','library','transport'].includes(activeModule) && (
        <ScopedModuleView activeModule={activeModule} user={user} stats={stats} staff={staff} branches={branches} />
      )}
      {!['branches','staff','students','attendance','results','academics','fees','finance','sms','complaints','events','library','transport','announcements'].includes(activeModule) && (
        <InstituteOverview user={user} stats={stats} branches={branches} onRefresh={refresh} onAddBranch={() => setShowAddBranch(true)} />
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

function InstituteOverview({ user, stats, branches, onRefresh, onAddBranch }: any) {
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
        <EmptyState icon={Network} title="No branches yet" desc="Add your first branch. You'll set the Branch Manager's email and password — they'll manage it independently."
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
                <BranchCard branch={br} onRefresh={onRefresh} />
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function BranchCard({ branch, onRefresh }: { branch: any; onRefresh: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [loadingPass, setLoadingPass] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const blocked = !!branch.blocked;

  const viewPassword = async () => {
    if (password) { setShowPass(s => !s); return; }
    setLoadingPass(true);
    try {
      const managers = await api.platformUsers({ branchId: branch.id, role: 'branch-manager' });
      if (!managers.length) { toast({ title: 'No branch manager found', variant: 'destructive' }); return; }
      const pw = await api.getUserPassword(managers[0].id);
      setPassword(pw.password);
      setShowPass(true);
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setLoadingPass(false); }
  };

  const toggleBlock = async () => {
    setBusy(true);
    try {
      await api.blockBranch(branch.id, !blocked, blocked ? '' : 'Blocked by Institute Admin');
      toast({ title: blocked ? 'Branch unblocked' : 'Branch blocked', description: branch.name });
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setBusy(false); }
  };

  return (
    <Card className="p-5 hover:shadow-md transition flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 grid place-items-center"><Network className="h-5 w-5 text-white" /></div>
        <Badge variant="outline" className={blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'}>{blocked ? 'Blocked' : (branch.status || 'Active')}</Badge>
      </div>
      <h3 className="font-bold text-sm">{branch.name}</h3>
      <div className="text-[11px] text-muted-foreground">{branch.city}</div>
      <div className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground truncate flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" /> {branch.managerEmail}</div>
      {showPass && password && (
        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs">
          <div className="text-amber-700 font-semibold mb-0.5">Manager Password:</div>
          <div className="font-mono text-amber-900 break-all">{password}</div>
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-3 gap-1.5">
        <Button size="sm" variant="outline" className="h-8 text-xs px-2" disabled={loadingPass} onClick={viewPassword} title="View manager password">
          <Eye className="h-3.5 w-3.5 mr-1" /> {loadingPass ? '…' : showPass ? 'Hide' : 'View'}
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs px-2" onClick={() => setShowEdit(true)} title="Edit branch">
          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
        <Button size="sm" variant="outline" className={`h-8 text-xs px-2 ${blocked ? 'text-emerald-600 hover:bg-emerald-500/10' : 'text-rose-600 hover:bg-rose-500/10'}`} disabled={busy} onClick={toggleBlock} title={blocked ? 'Unblock branch' : 'Block branch'}>
          {blocked ? <><Unlock className="h-3.5 w-3.5 mr-1" /> Open</> : <><Lock className="h-3.5 w-3.5 mr-1" /> Block</>}
        </Button>
      </div>
      {showEdit && <EditBranchModal branch={branch} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />}
    </Card>
  );
}

function EditBranchModal({ branch, onClose, onSaved }: { branch: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: branch.name || '',
    managerName: branch.manager || '',
    managerEmail: branch.managerEmail || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [managerUserId, setManagerUserId] = useState<string | null>(null);

  useEffect(() => {
    api.platformUsers({ branchId: branch.id, role: 'branch-manager' })
      .then((users: any[]) => { if (users.length) setManagerUserId(users[0].id); })
      .catch(() => {});
  }, [branch.id]);

  const save = async () => {
    if (!managerUserId) { toast({ title: 'Branch manager not found', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const body: any = { name: form.managerName, email: form.managerEmail };
      if (form.password) body.password = form.password;
      await api.editUser(managerUserId, body);
      toast({ title: 'Branch updated!', description: 'Manager must re-change password if you set a new one' });
      onSaved();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md my-8">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <h3 className="font-display font-bold text-lg mb-4">Edit Branch</h3>
          <div className="space-y-3">
            <div><Label>Branch Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Branch Manager</div></div>
            <div><Label>Manager Name</Label><Input value={form.managerName} onChange={e => setForm({ ...form, managerName: e.target.value })} className="mt-1" /></div>
            <div><Label>Manager Email</Label><Input value={form.managerEmail} onChange={e => setForm({ ...form, managerEmail: e.target.value })} className="mt-1" /></div>
            <div><Label>New Password (leave blank to keep current)</Label><Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Set new password" className="mt-1" /></div>
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

function BranchesManager({ branches, instituteId, onRefresh, showAdd, setShowAdd }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Branches" subtitle="Add branches — you set the Branch Manager's email and password"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>} />
      {branches.length === 0 ? (
        <EmptyState icon={Network} title="No branches yet" desc="Add your first branch. You'll set the Branch Manager's email and password."
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
                  <TableCell className="text-sm font-medium">{br.students ?? 0}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{br.teachers ?? 0}</TableCell>
                  <TableCell><div className="text-sm">{br.manager}</div><div className="text-[11px] text-muted-foreground">{br.managerEmail}</div></TableCell>
                  <TableCell><Badge variant="outline" className={br.blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'}>{br.blocked ? 'Blocked' : br.status}</Badge></TableCell>
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
  const [form, setForm] = useState({ name: '', city: '', managerName: '', managerEmail: '', managerPassword: '' });
  const [creating, setCreating] = useState(false);
  const create = async () => {
    if (!form.name || !form.managerEmail || !form.managerPassword) { toast({ title: 'Branch name, manager email and password are required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const res = await api.createBranch({ ...form, instituteId });
      toast({ title: 'Branch created!', description: `${res.branch.name} — manager login ready` });
      setLastCreated(res); setForm({ name: '', city: '', managerName: '', managerEmail: '', managerPassword: '' }); onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };
  if (!show && !lastCreated) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={() => { setShow(false); setLastCreated(null); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg my-8">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          {lastCreated ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center"><Plus className="h-6 w-6 text-emerald-600 rotate-45" /></div>
                <div><h3 className="font-display font-bold text-lg">Branch created!</h3><p className="text-sm text-muted-foreground">{lastCreated.branch.name}</p></div>
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 text-sm">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">Branch Manager login</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono">{lastCreated.managerLogin.email}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">{lastCreated.managerLogin.password}</span></div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-emerald-500/20">The manager must change this password on first login. Share these credentials securely.</div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={() => { setShow(false); setLastCreated(null); }}>Done</Button>
                <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-display font-bold text-lg mb-1">Add a new branch</h3>
              <p className="text-sm text-muted-foreground mb-5">You will set the Branch Manager's email and password. They must change it on first login.</p>
              <div className="space-y-3">
                <div><Label>Branch name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. North Campus" className="mt-1" /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Round Rock" className="mt-1" /></div>
                <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Branch Manager — You set the credentials</div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Manager name</Label><Input value={form.managerName} onChange={e => setForm({ ...form, managerName: e.target.value })} placeholder="Lisa Chen" className="mt-1" /></div>
                  <div><Label>Manager email *</Label><Input type="email" value={form.managerEmail} onChange={e => setForm({ ...form, managerEmail: e.target.value })} placeholder="manager@school.edu" className="mt-1" /></div>
                </div>
                <div><Label>Assign password *</Label><Input type="text" value={form.managerPassword} onChange={e => setForm({ ...form, managerPassword: e.target.value })} placeholder="e.g. BranchPass2025" className="mt-1" /></div>
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

// ===================== ANNOUNCEMENTS =====================
type RecipientType =
  | 'all-branches' | 'all-teachers' | 'all-students'
  | 'specific-branches' | 'specific-teachers' | 'specific-students';

function AnnouncementsView({ user }: { user: any }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', message: '',
    recipientType: 'all-branches' as RecipientType,
    selectedIds: [] as string[],
  });
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => { api.getAnnouncements().then(setAnnouncements).catch(() => {}); };
  useEffect(() => {
    refresh();
    if (user?.instituteId) api.branches(user.instituteId).then(setBranches).catch(() => {});
  }, [user?.instituteId]);

  // Lazy-load teachers/students when needed
  useEffect(() => {
    if (form.recipientType === 'specific-teachers') {
      api.platformUsers({ instituteId: user.instituteId, role: 'teacher' }).then(setUsers).catch(() => {});
    } else if (form.recipientType === 'specific-students') {
      api.platformUsers({ instituteId: user.instituteId, role: 'student' }).then(setUsers).catch(() => {});
    }
  }, [form.recipientType, user?.instituteId]);

  const roleForType = (t: RecipientType): 'branch-manager' | 'teacher' | 'student' => {
    if (t.includes('branches')) return 'branch-manager';
    if (t.includes('teachers')) return 'teacher';
    return 'student';
  };
  const scopeForType = (t: RecipientType): 'all' | 'specific' => t.startsWith('all') ? 'all' : 'specific';

  const send = async () => {
    if (!form.title || !form.message) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    if (scopeForType(form.recipientType) === 'specific' && form.selectedIds.length === 0) {
      toast({ title: 'Select at least one recipient', variant: 'destructive' }); return;
    }
    setSending(true);
    try {
      await api.createAnnouncement({
        title: form.title,
        message: form.message,
        targetRole: roleForType(form.recipientType),
        targetScope: scopeForType(form.recipientType),
        targetIds: scopeForType(form.recipientType) === 'specific' ? form.selectedIds : undefined,
      });
      const labels: Record<RecipientType, string> = {
        'all-branches': 'All Branch Managers',
        'all-teachers': 'All Teachers',
        'all-students': 'All Students',
        'specific-branches': `${form.selectedIds.length} branch manager(s)`,
        'specific-teachers': `${form.selectedIds.length} teacher(s)`,
        'specific-students': `${form.selectedIds.length} student(s)`,
      };
      toast({ title: 'Announcement sent!', description: `Sent to ${labels[form.recipientType]}` });
      setForm({ title: '', message: '', recipientType: 'all-branches', selectedIds: [] });
      setShowForm(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  const recipientLabel = (a: any) => {
    const role = a.targetRole ? a.targetRole.replace('-', ' ') : 'all';
    if (a.targetScope === 'all') return `All ${role}s`;
    return `Specific ${role}s`;
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Announcements" subtitle="Send messages to branches, teachers, and students in your institute"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(v => !v)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />
      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">New Announcement</h3>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Winter break schedule" className="mt-1" /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Type your announcement…" className="mt-1 resize-none" /></div>
            <div>
              <Label>Recipients</Label>
              <Select value={form.recipientType} onValueChange={(v: RecipientType) => setForm({ ...form, recipientType: v, selectedIds: [] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-branches">All Branches (Branch Managers)</SelectItem>
                  <SelectItem value="all-teachers">All Teachers</SelectItem>
                  <SelectItem value="all-students">All Students</SelectItem>
                  <SelectItem value="specific-branches">Specific Branches</SelectItem>
                  <SelectItem value="specific-teachers">Specific Teachers</SelectItem>
                  <SelectItem value="specific-students">Specific Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.recipientType === 'specific-branches' && (
              <div>
                <Label>Select Branches</Label>
                <div className="mt-2 max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                  {branches.length === 0 && <div className="text-xs text-muted-foreground">No branches available.</div>}
                  {branches.map(br => (
                    <label key={br.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                      <input type="checkbox" checked={form.selectedIds.includes(br.id)} onChange={e => {
                        if (e.target.checked) setForm({ ...form, selectedIds: [...form.selectedIds, br.id] });
                        else setForm({ ...form, selectedIds: form.selectedIds.filter((id: string) => id !== br.id) });
                      }} className="custom-checkbox w-4 h-4 rounded" />
                      <span className="text-sm">{br.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {(form.recipientType === 'specific-teachers' || form.recipientType === 'specific-students') && (
              <div>
                <Label>{form.recipientType === 'specific-teachers' ? 'Select Teachers' : 'Select Students'}</Label>
                <div className="mt-2 max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                  {users.length === 0 && <div className="text-xs text-muted-foreground">No users available.</div>}
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                      <input type="checkbox" checked={form.selectedIds.includes(u.id)} onChange={e => {
                        if (e.target.checked) setForm({ ...form, selectedIds: [...form.selectedIds, u.id] });
                        else setForm({ ...form, selectedIds: form.selectedIds.filter((id: string) => id !== u.id) });
                      }} className="custom-checkbox w-4 h-4 rounded" />
                      <span className="text-sm">{u.name} <span className="text-xs text-muted-foreground">· {u.email}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={sending} onClick={send}>
              {sending ? 'Sending…' : <><Send className="h-4 w-4 mr-1.5" /> Send Announcement</>}
            </Button>
          </div>
        </Card>
      )}
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" desc="Send messages to all or specific branches, teachers, or students."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(true)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="font-medium text-sm">{a.title}</div>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6 whitespace-pre-wrap">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2 ml-6">To: {recipientLabel(a)}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
