'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2, Network, Users, Plus, MapPin, CheckCircle2, Lock, Unlock, Edit,
  Trash2, X, Megaphone, Send, Loader2, Server, Inbox, GitBranch,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BranchManagerPortal } from './branch-manager-portal';

export function InstituteAdminPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    if (user?.instituteId) {
      Promise.all([
        api.scopedStats(user.instituteId).catch(() => null),
        api.branches(user.instituteId).catch(() => []),
      ]).then(([s, b]) => {
        setStats(s);
        setBranches(Array.isArray(b) ? b : []);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    if (user?.instituteId) {
      Promise.all([
        api.scopedStats(user.instituteId).catch(() => null),
        api.branches(user.instituteId).catch(() => []),
      ]).then(([s, b]) => {
        if (active) { setStats(s); setBranches(Array.isArray(b) ? b : []); setLoading(false); }
      });
    }
    return () => { active = false; };
  }, [user?.instituteId]);

  if (activeModule === 'announcements') return <AnnouncementsView user={user} />;
  if (activeModule === 'settings') return null; // handled by RolePortal
  // Default: institute overview with branch cards
  return <InstituteOverview user={user} stats={stats} branches={branches} loading={loading} onAddBranch={() => setShowAddBranch(true)} onRefresh={refresh} showAddBranch={showAddBranch} setShowAddBranch={setShowAddBranch} lastCreated={lastCreated} setLastCreated={setLastCreated} />;
}

// ============== Institute Branch Wrapper ==============
// When an Institute Admin opens a branch-level module (teachers, students, classes, fees),
// they need to first pick which branch to operate on — an institute can have many branches.
// This wrapper fetches the institute's branches, shows a selector at the top, and renders
// the BranchManagerPortal with a modified user whose branchId/branchName are overridden.
const BRANCH_MODULE_LABELS: Record<string, { title: string; subtitle: string }> = {
  'teachers': { title: 'Teachers', subtitle: 'Manage teachers in the selected branch' },
  'branch-students': { title: 'Students', subtitle: 'Manage students in the selected branch' },
  'class-courses': { title: 'Classes & Courses', subtitle: 'Configure classes, sections, and courses' },
  'fees': { title: 'Fee Management', subtitle: 'Set fee structure and manage invoices' },
};

export function InstituteBranchWrapper({ user, activeModule }: { user: any; activeModule: string }) {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  useEffect(() => {
    let active = true;
    const instituteId = user?.instituteId;
    if (!instituteId) {
      // No institute — defer the state update to a microtask so we don't
      // call setState synchronously inside the effect body (avoids cascading renders).
      Promise.resolve().then(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }
    api.branches(instituteId)
      .then((list: any[]) => {
        if (!active) return;
        const arr = Array.isArray(list) ? list : [];
        setBranches(arr);
        // Default to the first branch
        if (arr.length > 0) setSelectedBranchId(arr[0].id);
      })
      .catch(() => { if (active) setBranches([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.instituteId]);

  // Build a modified user object that overrides branchId/branchName with the selected branch.
  // The BranchManagerPortal reads user.branchId to scope all its queries.
  const modifiedUser = useMemo(() => {
    const br = branches.find(b => b.id === selectedBranchId);
    return {
      ...user,
      branchId: selectedBranchId || user?.branchId || '',
      branchName: br?.name || br?.branchName || user?.branchName || '',
    };
  }, [user, branches, selectedBranchId]);

  const meta = BRANCH_MODULE_LABELS[activeModule] || { title: 'Branch Management', subtitle: '' };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading branches…</span>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{meta.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{meta.subtitle}</p>
          </div>
        </div>
        <EmptyState
          icon={GitBranch}
          title="No branches yet"
          desc="Add your first branch from the Branches page. Once a branch exists, you can manage its teachers, students, classes, and fees here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Branch selector bar */}
      <Card className="p-4 border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-blue-700 grid place-items-center text-white shadow-sm">
              <GitBranch className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Branch</div>
              <div className="text-sm font-bold">{meta.title}</div>
            </div>
          </div>
          <div className="flex-1 min-w-0 sm:max-w-xs">
            <Label className="text-xs text-muted-foreground">Select branch</Label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="mt-1 w-full bg-card">
                <SelectValue placeholder="Choose a branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((br: any) => (
                  <SelectItem key={br.id} value={br.id}>
                    {br.name}{br.city ? ` · ${br.city}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {modifiedUser.branchName && (
            <div className="text-xs text-muted-foreground sm:ml-auto">
              Operating on <span className="font-semibold text-foreground">{modifiedUser.branchName}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Branch Manager Portal for the selected branch */}
      <BranchManagerPortal activeModule={activeModule} user={modifiedUser} />
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{label}</span>
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

// ============== Institute Overview ==============
function InstituteOverview({ user, stats, branches, loading, onAddBranch, onRefresh, showAddBranch, setShowAddBranch, lastCreated, setLastCreated }: any) {
  const cards = [
    { label: 'Branches', value: stats?.branches ?? 0, icon: Network, color: 'from-blue-600 to-blue-800' },
    { label: 'Total Students', value: stats?.students ?? 0, icon: Users, color: 'from-blue-500 to-blue-700' },
    { label: 'Staff', value: stats?.staff ?? 0, icon: Building2, color: 'from-blue-500 to-blue-700' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><Building2 className="h-3 w-3 text-blue-300" /> Institute Admin</div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Welcome, {user?.name?.split(' ')[0]}</h1>
            <p className="text-blue-50/80 text-sm mt-1.5">{stats?.branches ? `${stats.branches} branches · ${stats.students} students` : 'Add your first branch to get started.'}</p>
          </div>
          <Button className="bg-white text-blue-800 hover:bg-blue-50" size="sm" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>
        </div>
      </motion.div>

      {loading ? (
        <LoadingState label="Loading institute data…" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="p-5 relative overflow-hidden">
                  <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center shadow-md mb-3`}><c.icon className="h-5 w-5 text-white" /></div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-display">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {branches.length === 0 ? (
            <EmptyState icon={Network} title="No branches yet" desc="Add your first branch. You'll set the Branch Manager's email and password."
              action={<Button className="bg-blue-700 hover:bg-blue-800 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>} />
          ) : (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-bold text-base">Branches</h3><p className="text-xs text-muted-foreground">Click a card to view details</p></div>
                <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((br: any) => <BranchCard key={br.id} br={br} instituteId={user?.instituteId} onRefresh={onRefresh} />)}
              </div>
            </Card>
          )}
        </>
      )}

      <BranchModal show={showAddBranch} setShow={setShowAddBranch} instituteId={user?.instituteId} onRefresh={onRefresh} lastCreated={lastCreated} setLastCreated={setLastCreated} />
    </div>
  );
}

// ============== Branch Card (popup modal on click) ==============
function BranchCard({ br, instituteId, onRefresh }: { br: any; instituteId: string; onRefresh: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [blocked, setBlocked] = useState<boolean>(br.blocked === 1 || br.blocked === true);

  const isBlocked = blocked;
  const statusLabel = isBlocked ? 'Blocked' : 'Active';
  const statusClass = isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-blue-700 bg-blue-500/10 border-blue-500/20';

  const toggleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.blockBranch(br.id, !blocked, !blocked ? 'Blocked by Institute Admin' : '');
      setBlocked(!blocked);
      toast({ title: blocked ? 'Branch unblocked' : 'Branch blocked', description: blocked ? 'Access restored' : 'All teachers and students blocked (cascade)' });
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteBranch(br.id);
      toast({ title: 'Branch deleted', description: `${br.name} and all its data have been removed.` });
      setShowDelete(false);
      onRefresh();
    } catch (e: any) { toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' }); }
  };

  return (
    <>
      <Card className={`p-5 hover:shadow-lg transition relative cursor-pointer ${isBlocked ? 'ring-1 ring-rose-500/30' : ''}`} onClick={() => setShowDetails(true)}>
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 grid place-items-center shadow-md text-white">
              <Network className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{br.name}</h3>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {br.city || '—'}</div>
              <Badge variant="outline" className={`text-[10px] font-medium mt-1.5 ${statusClass}`}>{statusLabel}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="text-xs">
            <div className="text-muted-foreground">Manager</div>
            <div className="font-medium truncate">{br.manager || '—'}</div>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEdit(true)} title="Edit" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"><Edit className="h-4 w-4" /></button>
            <button type="button" onClick={toggleBlock} title={isBlocked ? 'Unblock' : 'Block'} className={`h-8 w-8 grid place-items-center rounded-lg transition ${isBlocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-blue-700 hover:bg-blue-500/10'}`}>{isBlocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
            <button type="button" onClick={() => setShowDelete(true)} title="Delete branch" className="h-8 w-8 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>

      {showDetails && <BranchDetailsModal br={br} instituteId={instituteId} onClose={() => setShowDetails(false)} onEdit={() => { setShowDetails(false); setShowEdit(true); }} />}
      {showEdit && <EditBranchModal br={br} instituteId={instituteId} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />}
      {showDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setShowDelete(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-rose-100 grid place-items-center"><Trash2 className="h-6 w-6 text-rose-600" /></div>
                <div><h3 className="font-display font-bold text-lg">Delete Branch?</h3><p className="text-sm text-muted-foreground">This action cannot be undone.</p></div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 mb-4">
                This will permanently delete <strong>{br.name}</strong> and ALL its data: teachers, students, classes, courses, attendance, results, and materials.
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white flex-1" onClick={handleDelete}>Delete Permanently</Button>
                <Button size="sm" variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

// ============== Branch Details Modal ==============
function BranchDetailsModal({ br, instituteId, onClose, onEdit }: { br: any; instituteId: string; onClose: () => void; onEdit: () => void }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.platformUsers({ branchId: br.id, role: 'teacher' }).catch(() => []),
      api.platformUsers({ branchId: br.id, role: 'student' }).catch(() => []),
    ]).then(([t, s]) => { setTeachers(Array.isArray(t) ? t : []); setStudents(Array.isArray(s) ? s : []); setLoading(false); });
  }, [br.id]);

  const isBlocked = br.blocked === 1 || br.blocked === true;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-2xl my-8">
        <Card className="p-0 max-h-[90vh] overflow-y-auto scroll-fancy">
          <div className="p-6 border-b border-border/40 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-900/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 grid place-items-center shadow-md text-white"><Network className="h-7 w-7" /></div>
                <div>
                  <h2 className="font-display text-xl font-extrabold">{br.name}</h2>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {br.city || '—'}</div>
                  <Badge variant="outline" className={`text-[10px] mt-2 ${isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-blue-700 bg-blue-500/10 border-blue-500/20'}`}>{isBlocked ? 'Blocked' : 'Active'}</Badge>
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3 text-center"><div className="text-2xl font-bold">{loading ? '…' : teachers.length}</div><div className="text-xs text-muted-foreground">Teachers</div></div>
              <div className="rounded-xl bg-muted/40 p-3 text-center"><div className="text-2xl font-bold">{loading ? '…' : students.length}</div><div className="text-xs text-muted-foreground">Students</div></div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Branch Manager</div>
              <div className="flex items-center justify-between">
                <div><div className="font-medium text-sm">{br.manager || '—'}</div><div className="text-xs text-muted-foreground">{br.managerEmail || '—'}</div></div>
                <Button size="sm" variant="outline" onClick={onEdit}><Edit className="h-3.5 w-3.5 mr-1" /> Edit</Button>
              </div>
            </div>
            {!loading && teachers.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Teachers ({teachers.length})</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scroll-fancy">
                  {teachers.map((t: any) => <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"><span>{t.name}</span><span className="text-xs text-muted-foreground">{t.rollNo || '—'}</span></div>)}
                </div>
              </div>
            )}
            {!loading && students.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Students ({students.length})</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scroll-fancy">
                  {students.slice(0, 20).map((s: any) => <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"><span>{s.name}</span><span className="text-xs text-muted-foreground">{s.class || '—'} · {s.rollNo || '—'}</span></div>)}
                  {students.length > 20 && <div className="text-xs text-muted-foreground text-center py-1">+{students.length - 20} more…</div>}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============== Edit Branch Modal ==============
function EditBranchModal({ br, instituteId, onClose, onSaved }: { br: any; instituteId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: br.name, managerName: br.manager || '', managerEmail: br.managerEmail || '', managerPassword: '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      // Find the branch manager user
      const users = await api.platformUsers({ branchId: br.id, role: 'branch-manager' });
      if (users.length > 0) {
        const body: any = {};
        if (form.managerName) body.name = form.managerName;
        if (form.managerEmail) body.email = form.managerEmail;
        if (form.managerPassword) body.password = form.managerPassword;
        await api.editUser(users[0].id, body);
      }
      toast({ title: 'Branch updated!' });
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
            <div><Label>Branch Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" disabled /></div>
            <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Branch Manager</div></div>
            <div><Label>Manager Name</Label><Input value={form.managerName} onChange={e => setForm({...form, managerName: e.target.value})} className="mt-1" /></div>
            <div><Label>Manager Email</Label><Input value={form.managerEmail} onChange={e => setForm({...form, managerEmail: e.target.value})} className="mt-1" /></div>
            <div><Label>New Password (leave blank to keep current)</Label><Input type="text" value={form.managerPassword} onChange={e => setForm({...form, managerPassword: e.target.value})} placeholder="Set new password" className="mt-1" /></div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white flex-1" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============== Add Branch Modal ==============
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
                <div className="h-12 w-12 rounded-full bg-blue-500/15 grid place-items-center"><CheckCircle2 className="h-6 w-6 text-blue-700" /></div>
                <div><h3 className="font-display font-bold text-lg">Branch created!</h3><p className="text-sm text-muted-foreground">{lastCreated.branch.name}</p></div>
              </div>
              <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 space-y-2 text-sm">
                <div className="font-semibold text-blue-700 dark:text-blue-300">Branch Manager login credentials</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono">{lastCreated.managerLogin.email}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">{lastCreated.managerLogin.password}</span></div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-blue-500/20">The manager must change this password on first login. Share these credentials securely.</div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white flex-1" onClick={() => { setShow(false); setLastCreated(null); }}>Done</Button>
                <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-display font-bold text-lg mb-1">Add a new branch</h3>
              <p className="text-sm text-muted-foreground mb-5">You will set the Branch Manager's email and password. They must change it on first login.</p>
              <div className="space-y-3">
                <div><Label>Branch name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. North Campus" className="mt-1" /></div>
                <div><Label>City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Dallas" className="mt-1" /></div>
                <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Branch Manager — You set the credentials</div></div>
                <div><Label>Manager name</Label><Input value={form.managerName} onChange={e => setForm({...form, managerName: e.target.value})} placeholder="Lisa Chen" className="mt-1" /></div>
                <div><Label>Manager email *</Label><Input type="email" value={form.managerEmail} onChange={e => setForm({...form, managerEmail: e.target.value})} placeholder="manager@school.edu" className="mt-1" /></div>
                <div><Label>Assign password *</Label><Input type="text" value={form.managerPassword} onChange={e => setForm({...form, managerPassword: e.target.value})} placeholder="Set a password for the manager" className="mt-1" /></div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white flex-1" disabled={creating} onClick={create}>{creating ? 'Creating…' : 'Create Branch'}</Button>
                <Button size="sm" variant="outline" onClick={() => setShow(false)}>Cancel</Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ============== Announcements View ==============
function AnnouncementsView({ user }: { user: any }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', message: '', targetScope: 'all', targetType: 'branch-manager', selectedIds: [] as string[] });
  const [targets, setTargets] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = () => { api.getAnnouncements().then(setAnnouncements).catch(() => {}); };
  useEffect(() => { refresh(); setLoading(false); }, []);

  const loadTargets = async (type: string) => {
    if (type === 'all') { setTargets([]); return; }
    const role = type === 'branch' ? 'branch-manager' : type;
    const users = await api.platformUsers({ instituteId: user.instituteId, role });
    setTargets(Array.isArray(users) ? users : []);
  };

  const send = async () => {
    if (!form.title || !form.message) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await api.createAnnouncement({
        title: form.title, message: form.message,
        targetRole: form.targetType === 'branch' ? 'branch-manager' : form.targetType,
        targetScope: form.targetScope,
        targetIds: form.targetScope === 'specific' ? form.selectedIds : undefined,
      });
      toast({ title: 'Announcement sent!' });
      setForm({ title: '', message: '', targetScope: 'all', targetType: 'branch-manager', selectedIds: [] });
      setShowForm(false); refresh();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="font-display text-2xl font-extrabold tracking-tight">Announcements</h1><p className="text-sm text-muted-foreground mt-1">Send messages to branches, teachers, or students</p></div>
        <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white" onClick={() => setShowForm(v => !v)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>
      </div>
      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">New Announcement</h3>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Schedule change" className="mt-1" /></div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3} placeholder="Type your announcement…" className="mt-1 resize-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Recipients</Label>
                <Select value={form.targetType} onValueChange={v => { setForm({...form, targetType: v, targetScope: 'all', selectedIds: []}); loadTargets(v); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch-manager">All Branch Managers</SelectItem>
                    <SelectItem value="teacher">All Teachers</SelectItem>
                    <SelectItem value="student">All Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Scope</Label>
                <Select value={form.targetScope} onValueChange={v => setForm({...form, targetScope: v, selectedIds: []})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {form.targetType === 'branch-manager' ? 'Branches' : form.targetType + 's'}</SelectItem>
                    <SelectItem value="specific">Specific {form.targetType === 'branch-manager' ? 'Branches' : form.targetType + 's'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.targetScope === 'specific' && targets.length > 0 && (
              <div className="max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                {targets.map((t: any) => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                    <input type="checkbox" checked={form.selectedIds.includes(t.id)} onChange={e => {
                      if (e.target.checked) setForm({...form, selectedIds: [...form.selectedIds, t.id]});
                      else setForm({...form, selectedIds: form.selectedIds.filter((id:string) => id !== t.id)});
                    }} className="custom-checkbox w-4 h-4 rounded" />
                    <span className="text-sm">{t.name}</span>
                  </label>
                ))}
              </div>
            )}
            <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white" disabled={sending} onClick={send}>{sending ? 'Sending…' : <><Send className="h-4 w-4 mr-1.5" /> Send</>}</Button>
          </div>
        </Card>
      )}
      {loading ? <LoadingState label="Loading announcements…" /> : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" desc="Send messages to all or specific branches, teachers, or students." />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-blue-700" /><div className="font-medium text-sm">{a.title}</div></div>
                <span className="text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2 ml-6">To: {a.targetScope === 'all' ? `All ${a.targetRole || 'users'}` : `Specific ${a.targetRole || 'users'}`}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
