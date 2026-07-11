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
  Building2, Users, DollarSign, Network, Plus, Crown, MapPin, Mail, CheckCircle2,
  TrendingUp, Sparkles, Server, Building, Inbox, Lock, Unlock, Edit, Eye, Megaphone, Send,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const fmtMoney = (n: number) => '$' + (n || 0).toLocaleString('en-US');

export function SuperAdminPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [overview, setOverview] = useState<any>(null);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const refresh = () => {
    api.platformOverview().then(setOverview).catch(() => {});
    api.institutes().then(setInstitutes).catch(() => {});
    api.branches().then(setBranches).catch(() => {});
  };
  useEffect(() => { refresh(); }, []);

  if (activeModule === 'institutes') return <InstitutesManager institutes={institutes} onRefresh={refresh} showAdd={showAdd} setShowAdd={setShowAdd} />;
  if (activeModule === 'all-branches') return <AllBranchesView branches={branches} institutes={institutes} />;
  if (activeModule === 'platform-users') return <PlatformUsersView />;
  if (activeModule === 'revenue') return <RevenueView institutes={institutes} overview={overview} />;
  if (activeModule === 'announcements') return <AnnouncementsView user={user} institutes={institutes} />;
  if (['students','attendance','fees','results','sms','config','branding'].includes(activeModule)) {
    return <ModulePlaceholder title={activeModule} overview={overview} />;
  }
  return <PlatformOverview overview={overview} institutes={institutes} branches={branches} onAddInstitute={() => setShowAdd(true)} user={user} />;
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

function ModulePlaceholder({ title, overview }: { title: string; overview: any }) {
  const titles: Record<string,string> = {
    students:'All Students', attendance:'Attendance', fees:'Fee Management', results:'Results',
    sms:'SMS Portal', config:'Platform Configuration', branding:'Branding',
  };
  return (
    <div className="space-y-6">
      <ModuleHeader title={titles[title]||title} subtitle="Platform-wide view" />
      <EmptyState icon={Server} title="Cross-institute analytics" desc="This view aggregates data from all institutions once they start generating records." />
    </div>
  );
}

function PlatformOverview({ overview, institutes, branches, onAddInstitute, user }: any) {
  const cards = [
    { label: 'Institutions', value: overview?.institutes ?? 0, icon: Building2, color: 'from-amber-500 to-orange-600', sub: `${overview?.activeInstitutes ?? 0} active` },
    { label: 'Branches', value: overview?.branches ?? 0, icon: Network, color: 'from-emerald-500 to-emerald-700', sub: 'across all institutions' },
    { label: 'Total Students', value: overview?.totalStudents ?? 0, icon: Users, color: 'from-teal-500 to-cyan-600', sub: 'platform-wide' },
    { label: 'Total Staff', value: overview?.totalStaff ?? 0, icon: Building2, color: 'from-violet-500 to-purple-600', sub: 'teachers & managers' },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-700 to-amber-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><Crown className="h-3 w-3 text-amber-300" /> Super Admin · Platform Owner</div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Welcome back, {user?.name?.split(' ')[0] || 'Owner'} 👑</h1>
            <p className="text-amber-50/80 text-sm mt-1.5 max-w-lg">{overview?.institutes ? `${overview.institutes} institutions onboarded.` : 'Provision your first institute to get started.'}</p>
          </div>
          <Button className="bg-white text-amber-800 hover:bg-amber-50" size="sm" onClick={onAddInstitute}><Plus className="h-4 w-4 mr-1.5" /> Provision Institute</Button>
        </div>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
              <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center shadow-md`}><c.icon className="h-5 w-5 text-white" /></div>
              <div className="mt-4"><div className="text-2xl sm:text-3xl font-extrabold font-display">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div><div className="text-xs text-muted-foreground mt-0.5">{c.label}</div><div className="text-[11px] text-muted-foreground mt-1">{c.sub}</div></div>
            </Card>
          </motion.div>
        ))}
      </div>
      {institutes.length === 0 ? (
        <EmptyState icon={Building} title="No institutions yet" desc="Provision your first institute. You'll set the admin's email and password."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddInstitute}><Plus className="h-4 w-4 mr-1.5" /> Provision Institute</Button>} />
      ) : (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-bold text-base">Institutions</h3><p className="text-xs text-muted-foreground">Manage, edit, and block access</p></div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddInstitute}><Plus className="h-4 w-4 mr-1.5" /> Add Institute</Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutes.map((inst, i) => <InstituteCard key={inst.id} inst={inst} onRefresh={() => { api.institutes().then(setInstitutes); }} />)}
          </div>
        </Card>
      )}
    </div>
  );
}

function InstituteCard({ inst, onRefresh }: { inst: any; onRefresh: () => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState('');
  const [blocked, setBlocked] = useState(inst.blocked === 1 || inst.blocked === true);

  const fetchPassword = async () => {
    try {
      // Find the institute admin user
      const users = await api.platformUsers({ instituteId: inst.id, role: 'institute-admin' });
      if (users.length > 0) {
        const passRes = await api.getUserPassword(users[0].id);
        setPassword(passRes.password);
        setShowPass(true);
      }
    } catch (e: any) { toast({ title: 'Could not fetch password', variant: 'destructive' }); }
  };

  const toggleBlock = async () => {
    try {
      await api.blockInstitute(inst.id, !blocked, !blocked ? 'Payment pending' : '');
      setBlocked(!blocked);
      toast({ title: blocked ? 'Institute unblocked' : 'Institute blocked', description: blocked ? 'Access restored' : 'All branches and users blocked' });
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  return (
    <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="flex items-start justify-between">
        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br from-${inst.color || 'emerald'}-500 to-${inst.color || 'emerald'}-700 grid place-items-center shadow-md text-white font-display font-extrabold`}>{inst.short || inst.name.slice(0,2).toUpperCase()}</div>
        <div className="flex gap-1">
          <button onClick={fetchPassword} title="View admin password" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></button>
          <button onClick={() => setShowEdit(true)} title="Edit" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"><Edit className="h-4 w-4" /></button>
          <button onClick={toggleBlock} title={blocked ? 'Unblock' : 'Block'} className={`h-8 w-8 grid place-items-center rounded-lg ${blocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'}`}>{blocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
        </div>
      </div>
      <h3 className="font-bold text-base mt-3">{inst.name}</h3>
      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {inst.city}, {inst.country}</div>
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40 text-center">
        <div><div className="font-bold text-sm">{inst.branches || 0}</div><div className="text-[10px] text-muted-foreground">Branches</div></div>
        <div><div className="font-bold text-sm">{inst.students || 0}</div><div className="text-[10px] text-muted-foreground">Students</div></div>
        <div><div className="font-bold text-sm">{inst.staff || 0}</div><div className="text-[10px] text-muted-foreground">Staff</div></div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
        <div className="text-xs"><div className="text-muted-foreground">Admin</div><div className="font-medium truncate max-w-[140px]">{inst.adminName}</div></div>
        <Badge variant="outline" className={blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : inst.status === 'Active' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{blocked ? 'Blocked' : inst.status}</Badge>
      </div>
      {showPass && password && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs">
          <div className="text-amber-700 font-semibold mb-0.5">Admin Password:</div>
          <div className="font-mono text-amber-900">{password}</div>
        </div>
      )}
      {showEdit && <EditInstituteModal inst={inst} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />}
    </Card>
  );
}

function EditInstituteModal({ inst, onClose, onSaved }: any) {
  const [form, setForm] = useState({ name: inst.name, adminName: inst.adminName, adminEmail: inst.adminEmail, adminPassword: '', plan: inst.plan });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.editInstitute(inst.id, form);
      toast({ title: 'Institute updated!', description: 'Admin will need to re-change password if you updated it' });
      onSaved();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md my-8">
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <h3 className="font-display font-bold text-lg mb-4">Edit Institute</h3>
          <div className="space-y-3">
            <div><Label>Institute Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" /></div>
            <div><Label>Plan</Label><Select value={form.plan} onValueChange={v => setForm({...form, plan: v})}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Starter">Starter</SelectItem><SelectItem value="Premium">Premium</SelectItem><SelectItem value="Enterprise">Enterprise</SelectItem></SelectContent></Select></div>
            <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Institute Admin</div></div>
            <div><Label>Admin Name</Label><Input value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} className="mt-1" /></div>
            <div><Label>Admin Email</Label><Input value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})} className="mt-1" /></div>
            <div><Label>New Password (leave blank to keep current)</Label><Input type="text" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} placeholder="Set new password" className="mt-1" /></div>
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

function InstitutesManager({ institutes, onRefresh, showAdd, setShowAdd }: any) {
  const [form, setForm] = useState({ name: '', city: '', country: 'USA', plan: 'Premium', adminName: '', adminEmail: '', adminPassword: '' });
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);

  const create = async () => {
    if (!form.name || !form.adminEmail || !form.adminPassword) { toast({ title: 'Name, admin email and password are required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const res = await api.createInstitute(form);
      toast({ title: 'Institute provisioned!', description: `${res.institute.name} — admin login created` });
      setLastCreated(res);
      setForm({ name: '', city: '', country: 'USA', plan: 'Premium', adminName: '', adminEmail: '', adminPassword: '' });
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Institutes" subtitle="Provision institutions — you set the admin's email and password"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" /> Provision Institute</Button>} />
      {institutes.length === 0 ? (
        <EmptyState icon={Building} title="No institutions yet" desc="Provision your first institute. You'll set the admin's email and password."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" /> Provision Institute</Button>} />
      ) : (
        <Card className="p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutes.map((inst: any) => <InstituteCard key={inst.id} inst={inst} onRefresh={onRefresh} />)}
          </div>
        </Card>
      )}
      {(showAdd || lastCreated) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={() => { setShowAdd(false); setLastCreated(null); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg my-8">
            <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
              {lastCreated ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
                    <div><h3 className="font-display font-bold text-lg">Institute provisioned!</h3><p className="text-sm text-muted-foreground">{lastCreated.institute.name} is ready</p></div>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 text-sm">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300">Institute Admin login credentials</div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono">{lastCreated.adminLogin.email}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">{lastCreated.adminLogin.password}</span></div>
                    <div className="text-xs text-muted-foreground pt-2 border-t border-emerald-500/20">The admin must change this password on first login. Share these credentials securely.</div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={() => { setShowAdd(false); setLastCreated(null); }}>Done</Button>
                    <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-display font-bold text-lg mb-1">Provision a new institute</h3>
                  <p className="text-sm text-muted-foreground mb-5">You will set the Institute Admin's email and password. They must change it on first login.</p>
                  <div className="space-y-3">
                    <div><Label>Institute name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dallas Modern School" className="mt-1" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Dallas" className="mt-1" /></div>
                      <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="mt-1" /></div>
                    </div>
                    <div><Label>Plan</Label>
                      <Select value={form.plan} onValueChange={v => setForm({ ...form, plan: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Starter">Starter — 1 branch, basic modules</SelectItem>
                          <SelectItem value="Premium">Premium — multi-branch, all modules</SelectItem>
                          <SelectItem value="Enterprise">Enterprise — unlimited, white-label</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Institute Admin — You set the credentials</div></div>
                    <div><Label>Admin name</Label><Input value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} placeholder="Dr. Jane Doe" className="mt-1" /></div>
                    <div><Label>Admin email *</Label><Input type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@school.edu" className="mt-1" /></div>
                    <div><Label>Assign password *</Label><Input type="text" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} placeholder="Set a password for the admin" className="mt-1" /></div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" disabled={creating} onClick={create}>{creating ? 'Provisioning…' : 'Provision Institute'}</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function AllBranchesView({ branches, institutes }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="All Branches" subtitle={`${branches.length} branches across ${institutes.length} institutions`} />
      {branches.length === 0 ? (
        <EmptyState icon={Network} title="No branches yet" desc="Branches are created by Institute Admins." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((br: any, i: number) => {
            const inst = institutes.find((x:any) => x.id === br.instituteId);
            return (
              <motion.div key={br.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div><div className="font-medium text-sm">{br.name}</div><div className="text-[11px] text-muted-foreground">{inst?.short} · {br.city}</div></div>
                    {br.blocked === 1 && <Badge variant="outline" className="text-rose-600 bg-rose-500/10 border-rose-500/20">Blocked</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40 text-center">
                    <div><div className="font-bold text-sm">{br.students || 0}</div><div className="text-[10px] text-muted-foreground">Students</div></div>
                    <div><div className="font-bold text-sm">{br.teachers || 0}</div><div className="text-[10px] text-muted-foreground">Teachers</div></div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlatformUsersView() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { api.platformUsers().then(setUsers).catch(() => {}); }, []);
  const counts = {
    'institute-admin': users.filter(u => u.role === 'institute-admin').length,
    'branch-manager': users.filter(u => u.role === 'branch-manager').length,
    'teacher': users.filter(u => u.role === 'teacher').length,
    'student': users.filter(u => u.role === 'student').length,
  };
  return (
    <div className="space-y-6">
      <ModuleHeader title="All Platform Users" subtitle="Every login across the platform" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(counts).map(([role, count]) => (
          <Card key={role} className="p-4 text-center"><div className="text-2xl font-extrabold font-display">{count}</div><div className="text-xs text-muted-foreground capitalize">{role.replace('-',' ')}</div></Card>
        ))}
      </div>
      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" desc="Users are created as institutes and branches are provisioned." />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead className="hidden md:table-cell">Institute</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{u.name}</div><div className="text-[11px] text-muted-foreground">{u.email || u.rollNo}</div></TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{u.roleLabel}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{u.instituteName || '—'}</TableCell>
                  <TableCell><Badge variant="outline" className={u.blocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'}>{u.blocked ? 'Blocked' : 'Active'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function RevenueView({ institutes, overview }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Revenue & Plans" subtitle="Platform monetization" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5"><DollarSign className="h-8 w-8 text-emerald-600 mb-2" /><div className="text-2xl font-extrabold font-display">{fmtMoney(overview?.totalRevenue)}</div><div className="text-xs text-muted-foreground">Total Revenue</div></Card>
        <Card className="p-5"><TrendingUp className="h-8 w-8 text-amber-600 mb-2" /><div className="text-2xl font-extrabold font-display">{overview?.institutes ?? 0}</div><div className="text-xs text-muted-foreground">Institutions</div></Card>
        <Card className="p-5"><Building2 className="h-8 w-8 text-violet-600 mb-2" /><div className="text-2xl font-extrabold font-display">{overview?.branches ?? 0}</div><div className="text-xs text-muted-foreground">Branches</div></Card>
        <Card className="p-5"><Users className="h-8 w-8 text-rose-600 mb-2" /><div className="text-2xl font-extrabold font-display">{overview?.totalStudents ?? 0}</div><div className="text-xs text-muted-foreground">Students</div></Card>
      </div>
    </div>
  );
}

// ===================== ANNOUNCEMENTS =====================
function AnnouncementsView({ user, institutes }: { user: any; institutes: any[] }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', message: '', targetScope: 'all', selectedInstitutes: [] as string[] });
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => { api.getAnnouncements().then(setAnnouncements).catch(() => {}); };
  useEffect(() => { refresh(); }, []);

  const send = async () => {
    if (!form.title || !form.message) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await api.createAnnouncement({
        title: form.title, message: form.message,
        targetRole: 'institute-admin',
        targetScope: form.targetScope,
        targetIds: form.targetScope === 'specific' ? form.selectedInstitutes : undefined,
      });
      toast({ title: 'Announcement sent!', description: form.targetScope === 'all' ? 'Sent to all institutes' : `Sent to ${form.selectedInstitutes.length} institute(s)` });
      setForm({ title: '', message: '', targetScope: 'all', selectedInstitutes: [] });
      setShowForm(false);
      refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Announcements" subtitle="Send messages to Institute Admins"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(v => !v)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />
      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">New Announcement</h3>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Platform maintenance scheduled" className="mt-1" /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} placeholder="Type your announcement…" className="mt-1 resize-none" /></div>
            <div>
              <Label>Recipients</Label>
              <Select value={form.targetScope} onValueChange={v => setForm({...form, targetScope: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institute Admins</SelectItem>
                  <SelectItem value="specific">Specific Institutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.targetScope === 'specific' && (
              <div>
                <Label>Select Institutes</Label>
                <div className="mt-2 max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                  {institutes.map(inst => (
                    <label key={inst.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                      <input type="checkbox" checked={form.selectedInstitutes.includes(inst.id)} onChange={e => {
                        if (e.target.checked) setForm({...form, selectedInstitutes: [...form.selectedInstitutes, inst.id]});
                        else setForm({...form, selectedInstitutes: form.selectedInstitutes.filter((id:string) => id !== inst.id)});
                      }} className="custom-checkbox w-4 h-4 rounded" />
                      <span className="text-sm">{inst.name}</span>
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
        <EmptyState icon={Megaphone} title="No announcements yet" desc="Send messages to all or specific Institute Admins."
          action={<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(true)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-amber-500" />
                  <div className="font-medium text-sm">{a.title}</div>
                </div>
                <span className="text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2 ml-6">To: {a.targetScope === 'all' ? 'All Institute Admins' : 'Specific Institutes'}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
