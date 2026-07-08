'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, Users, DollarSign, Network, TrendingUp, Plus, Crown, MapPin, Mail,
  CheckCircle2, Clock, ArrowUpRight, Sparkles, Server, Globe2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US');

export function SuperAdminPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [overview, setOverview] = useState<any>(null);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedInst, setSelectedInst] = useState<any | null>(null);

  useEffect(() => {
    api.platformOverview().then(setOverview).catch(() => {});
    api.institutes().then(setInstitutes).catch(() => {});
    api.branches().then(setBranches).catch(() => {});
  }, []);

  if (activeModule === 'institutes') {
    return <InstitutesManager institutes={institutes} onRefresh={() => api.institutes().then(setInstitutes)} onOpen={setSelectedInst} selected={selectedInst} onClose={() => setSelectedInst(null)} showAdd={showAdd} setShowAdd={setShowAdd} />;
  }
  if (activeModule === 'all-branches') {
    return <AllBranchesView branches={branches} institutes={institutes} />;
  }
  if (activeModule === 'platform-users') {
    return <PlatformUsersView />;
  }
  if (activeModule === 'revenue') {
    return <RevenueView institutes={institutes} overview={overview} />;
  }
  // fallback to overview for: platform-overview, students, attendance, fees, results, sms, config, branding
  if (['students', 'attendance', 'fees', 'results', 'sms', 'config', 'branding'].includes(activeModule)) {
    return <ModulePlaceholder title={activeModule} overview={overview} />;
  }

  return <PlatformOverview overview={overview} institutes={institutes} branches={branches} onAddInstitute={() => setShowAdd(true)} user={user} />;
}

function ModulePlaceholder({ title, overview }: { title: string; overview: any }) {
  const titles: Record<string, string> = {
    students: 'All Students (Platform-wide)', attendance: 'Attendance (Platform-wide)',
    fees: 'Fee Management (Platform-wide)', results: 'Results (Platform-wide)',
    sms: 'SMS Portal', config: 'Platform Configuration', branding: 'Institute Branding',
  };
  return (
    <div className="space-y-6">
      <ModuleHeader title={titles[title] || title} subtitle="Aggregated across all institutions on the platform" />
      <Card className="p-8 text-center">
        <Server className="h-10 w-10 mx-auto text-emerald-600 mb-3" />
        <h3 className="font-bold">{titles[title]}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">This platform-wide view aggregates data from {overview?.institutes || 0} institutions. The full cross-institute analytics dashboard is part of the complete deployment.</p>
      </Card>
    </div>
  );
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function PlatformOverview({ overview, institutes, branches, onAddInstitute, user }: any) {
  const cards = [
    { label: 'Institutions', value: overview?.institutes, icon: Building2, color: 'from-amber-500 to-orange-600', sub: `${overview?.activeInstitutes} active · ${overview?.trialInstitutes} trial` },
    { label: 'Branches', value: overview?.branches, icon: Network, color: 'from-emerald-500 to-emerald-700', sub: 'across all institutions' },
    { label: 'Total Students', value: overview?.totalStudents, icon: Users, color: 'from-teal-500 to-cyan-600', sub: 'platform-wide' },
    { label: 'Annual Revenue', value: fmtMoney(overview?.totalRevenue || 0), icon: DollarSign, color: 'from-violet-500 to-purple-600', sub: `MRR ${fmtMoney(overview?.mrr || 0)}` },
  ];
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-700 to-amber-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
              <Crown className="h-3 w-3 text-amber-300" /> Super Admin · Platform Owner
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Welcome back, {user?.name?.split(' ')[0] || 'Owner'} 👑</h1>
            <p className="text-amber-50/80 text-sm mt-1.5 max-w-lg">
              You own the eSM platform. {overview?.institutes} institutions trust your platform with {overview?.totalStudents?.toLocaleString()} students.
            </p>
          </div>
          <Button className="bg-white text-amber-800 hover:bg-amber-50" size="sm" onClick={onAddInstitute}>
            <Plus className="h-4 w-4 mr-1.5" /> Provision Institute
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
              <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className="flex items-start justify-between">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center shadow-md`}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
                <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/20"><TrendingUp className="h-3 w-3" /> {overview?.growth}</Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-display">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{c.sub}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">Institutions on your platform</h3>
            <p className="text-xs text-muted-foreground">Click any institute to manage it</p>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddInstitute}><Plus className="h-4 w-4 mr-1.5" /> Add Institute</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutes.map((inst, i) => (
            <motion.div key={inst.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <InstituteCard inst={inst} onOpen={() => {}} />
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function InstituteCard({ inst, onOpen }: { inst: any; onOpen: () => void }) {
  const planColor: Record<string, string> = { Enterprise: 'text-amber-600 bg-amber-500/10 border-amber-500/20', Premium: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', Starter: 'text-slate-600 bg-slate-500/10 border-slate-500/20' };
  return (
    <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden cursor-pointer" onClick={onOpen}>
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="flex items-start justify-between">
        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br from-${inst.color}-500 to-${inst.color}-700 grid place-items-center shadow-md text-white font-display font-extrabold`}>
          {inst.short}
        </div>
        <Badge variant="outline" className={planColor[inst.plan]}>{inst.plan}</Badge>
      </div>
      <h3 className="font-bold text-base mt-3">{inst.name}</h3>
      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {inst.city}, {inst.country}</div>
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40 text-center">
        <div><div className="font-bold text-sm">{inst.branches}</div><div className="text-[10px] text-muted-foreground">Branches</div></div>
        <div><div className="font-bold text-sm">{inst.students}</div><div className="text-[10px] text-muted-foreground">Students</div></div>
        <div><div className="font-bold text-sm">{inst.staff}</div><div className="text-[10px] text-muted-foreground">Staff</div></div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
        <div className="text-xs">
          <div className="text-muted-foreground">Admin</div>
          <div className="font-medium truncate max-w-[140px]">{inst.adminName}</div>
        </div>
        <Badge variant="outline" className={inst.status === 'Active' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{inst.status}</Badge>
      </div>
    </Card>
  );
}

function InstitutesManager({ institutes, onRefresh, onOpen, selected, onClose, showAdd, setShowAdd }: any) {
  const [form, setForm] = useState({ name: '', city: '', country: 'USA', plan: 'Premium', adminName: '', adminEmail: '' });
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);

  const create = async () => {
    if (!form.name || !form.adminEmail) { toast({ title: 'Name and admin email required', variant: 'destructive' }); return; }
    setCreating(true);
    try {
      const res = await api.createInstitute(form);
      toast({ title: 'Institute provisioned!', description: `${res.institute.name} — admin login created` });
      setLastCreated(res);
      setForm({ name: '', city: '', country: 'USA', plan: 'Premium', adminName: '', adminEmail: '' });
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally { setCreating(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Institutes Management"
        subtitle="Provision new institutions — an admin login is auto-created for each"
        actions={<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1.5" /> Provision Institute</Button>}
      />

      {/* How it works strip */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/20 border-emerald-500/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">How multi-tenancy works:</span> When you create an institute, eSM automatically provisions a secure <strong>Institute Admin</strong> login (password: <span className="font-mono">esm123</span>). That admin can then sign in, add branches, and each branch gets its own <strong>Branch Manager</strong> login. Branch managers add teachers & students.
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Institute</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="hidden sm:table-cell">Branches</TableHead>
                <TableHead className="hidden lg:table-cell">Students</TableHead>
                <TableHead className="hidden lg:table-cell">Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutes.map((inst: any) => (
                <TableRow key={inst.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onOpen(inst)}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br from-${inst.color}-500 to-${inst.color}-700 grid place-items-center text-white text-xs font-bold`}>{inst.short}</div>
                      <div>
                        <div className="font-medium text-sm">{inst.name}</div>
                        <div className="text-[11px] text-muted-foreground">{inst.adminName} · {inst.adminEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{inst.city}, {inst.country}</TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{inst.plan}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell text-sm font-medium">{inst.branches}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{inst.students.toLocaleString()}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm font-medium">{fmtMoney(inst.revenue)}</TableCell>
                  <TableCell><Badge variant="outline" className={inst.status === 'Active' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{inst.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onOpen(inst); }} className="gap-1">Manage <ArrowUpRight className="h-3.5 w-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {(showAdd || lastCreated) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => { setShowAdd(false); setLastCreated(null); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg">
            <Card className="p-6">
              {lastCreated ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Institute provisioned!</h3>
                      <p className="text-sm text-muted-foreground">{lastCreated.institute.name} is ready</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 text-sm">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300">Institute Admin login credentials</div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono">{lastCreated.adminLogin.email}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">esm123</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium">Institute Admin</span></div>
                    <div className="text-xs text-muted-foreground pt-2 border-t border-emerald-500/20">Share these credentials with the institute. They can sign in at the same portal — eSM will detect their role and show the Institute Admin portal.</div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={() => { setShowAdd(false); setLastCreated(null); }}>Done</Button>
                    <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-display font-bold text-lg mb-1">Provision a new institute</h3>
                  <p className="text-sm text-muted-foreground mb-5">An Institute Admin login will be auto-created with password <span className="font-mono">esm123</span></p>
                  <div className="space-y-3">
                    <div><Label>Institute name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dallas Modern School" className="mt-1" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>City</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Dallas" className="mt-1" /></div>
                      <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="mt-1" /></div>
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <Select value={form.plan} onValueChange={v => setForm({ ...form, plan: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Starter">Starter — 1 branch, basic modules</SelectItem>
                          <SelectItem value="Premium">Premium — multi-branch, all modules</SelectItem>
                          <SelectItem value="Enterprise">Enterprise — unlimited, white-label</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Institute Admin (auto-provisioned)</div></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Admin name</Label><Input value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} placeholder="Dr. Jane Doe" className="mt-1" /></div>
                      <div><Label>Admin email *</Label><Input type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@school.edu" className="mt-1" /></div>
                    </div>
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

function AllBranchesView({ branches, institutes }: { branches: any[]; institutes: any[] }) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="All Branches" subtitle={`${branches.length} branches across ${institutes.length} institutions`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((br, i) => {
          const inst = institutes.find(x => x.id === br.instituteId);
          return (
            <motion.div key={br.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">{br.name}</div>
                    <div className="text-[11px] text-muted-foreground">{inst?.short} · {br.city}</div>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">{br.id}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40 text-center">
                  <div><div className="font-bold text-sm">{br.students}</div><div className="text-[10px] text-muted-foreground">Students</div></div>
                  <div><div className="font-bold text-sm">{br.teachers}</div><div className="text-[10px] text-muted-foreground">Teachers</div></div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                  <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><Mail className="h-3 w-3" /> {br.managerEmail}</div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
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
    'parent': users.filter(u => u.role === 'parent').length,
  };
  return (
    <div className="space-y-6">
      <ModuleHeader title="All Platform Users" subtitle="Every login across the platform, by role" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(counts).map(([role, count]) => (
          <Card key={role} className="p-4 text-center">
            <div className="text-2xl font-extrabold font-display">{count}</div>
            <div className="text-xs text-muted-foreground capitalize">{role.replace('-', ' ')}</div>
          </Card>
        ))}
      </div>
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>User</TableHead><TableHead>Role</TableHead><TableHead className="hidden md:table-cell">Institute</TableHead><TableHead className="hidden lg:table-cell">Branch</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id} className="hover:bg-muted/30">
                <TableCell><div className="font-medium text-sm">{u.name}</div><div className="text-[11px] text-muted-foreground">{u.email}</div></TableCell>
                <TableCell><Badge variant="outline" className="font-normal capitalize">{u.roleLabel}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-sm">{u.instituteName || '—'}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{u.branchName || '—'}</TableCell>
                <TableCell><Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/20">{u.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function RevenueView({ institutes, overview }: any) {
  const planCounts = institutes.reduce((a: any, i: any) => { a[i.plan] = (a[i.plan] || 0) + 1; return a; }, {});
  return (
    <div className="space-y-6">
      <ModuleHeader title="Revenue & Plans" subtitle="Platform monetization across all institutions" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5"><DollarSign className="h-8 w-8 text-emerald-600 mb-2" /><div className="text-2xl font-extrabold font-display">{fmtMoney(overview?.totalRevenue || 0)}</div><div className="text-xs text-muted-foreground">Annual Revenue</div></Card>
        <Card className="p-5"><TrendingUp className="h-8 w-8 text-amber-600 mb-2" /><div className="text-2xl font-extrabold font-display">{fmtMoney(overview?.mrr || 0)}</div><div className="text-xs text-muted-foreground">Monthly Recurring</div></Card>
        <Card className="p-5"><Globe2 className="h-8 w-8 text-violet-600 mb-2" /><div className="text-2xl font-extrabold font-display">{overview?.institutes}</div><div className="text-xs text-muted-foreground">Institutions</div></Card>
        <Card className="p-5"><Sparkles className="h-8 w-8 text-rose-600 mb-2" /><div className="text-2xl font-extrabold font-display">{overview?.growth}</div><div className="text-xs text-muted-foreground">YoY Growth</div></Card>
      </div>
      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Revenue by Institution</h3>
        <div className="space-y-3">
          {institutes.map((inst: any) => (
            <div key={inst.id} className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br from-${inst.color}-500 to-${inst.color}-700 grid place-items-center text-white text-xs font-bold shrink-0`}>{inst.short}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm truncate">{inst.name}</span><span className="font-bold text-sm">{fmtMoney(inst.revenue)}</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full bg-gradient-to-r from-${inst.color}-500 to-${inst.color}-700`} style={{ width: `${(inst.revenue / Math.max(...institutes.map((x:any)=>x.revenue))) * 100}%` }} /></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-bold text-base mb-4">Plan Distribution</h3>
        <div className="grid grid-cols-3 gap-3">
          {['Enterprise', 'Premium', 'Starter'].map(p => (
            <div key={p} className="text-center p-4 rounded-xl bg-muted/40">
              <div className="text-3xl font-extrabold font-display">{planCounts[p] || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">{p}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
