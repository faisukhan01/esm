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
  Trash2, Megaphone, Send, Loader2, ChevronRight,
  ArrowLeft, BookOpen, GraduationCap, DollarSign,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BranchManagerPortal } from './branch-manager-portal';

export function InstituteAdminPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

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

  // Derive the selected branch from the latest branches list so a deleted/blocked
  // branch automatically falls back to the cards view without an extra effect.
  const selectedBranch = useMemo(
    () => (selectedBranchId ? branches.find(b => b.id === selectedBranchId) || null : null),
    [selectedBranchId, branches]
  );

  if (activeModule === 'announcements') return <AnnouncementsView user={user} />;
  if (activeModule === 'settings') return null; // handled by RolePortal

  // Branch management view — replaces the institute overview when an admin clicks a branch card.
  // Available from both the Dashboard and the Branches page (any module where InstituteOverview is shown).
  if (selectedBranch) {
    return (
      <BranchManagementView
        branch={selectedBranch}
        user={user}
        onBack={() => setSelectedBranchId(null)}
        onRefresh={refresh}
      />
    );
  }

  // Default: institute overview with branch cards
  return (
    <InstituteOverview
      user={user}
      stats={stats}
      branches={branches}
      loading={loading}
      onAddBranch={() => setShowAddBranch(true)}
      onSelectBranch={(br: any) => setSelectedBranchId(br.id)}
      onRefresh={refresh}
      showAddBranch={showAddBranch}
      setShowAddBranch={setShowAddBranch}
      lastCreated={lastCreated}
      setLastCreated={setLastCreated}
    />
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
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

// ============== Branch Management View (full-page, replaces popup modal) ==============
// Shown when an Institute Admin clicks a branch card. Mirrors the Branch Manager portal
// with Teachers | Students | Classes & Courses | Fee Management tabs and the full
// BranchManagerPortal content for the selected branch.
const BRANCH_TABS = [
  { id: 'teachers', label: 'Teachers', icon: Users },
  { id: 'branch-students', label: 'Students', icon: GraduationCap },
  { id: 'class-courses', label: 'Classes & Courses', icon: BookOpen },
  { id: 'fees', label: 'Fee Management', icon: DollarSign },
] as const;

function BranchManagementView({ branch, user, onBack, onRefresh }: {
  branch: any;
  user: any;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<(typeof BRANCH_TABS)[number]['id']>('teachers');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [blocked, setBlocked] = useState<boolean>(branch.blocked === 1 || branch.blocked === true);

  // Build a modified user object that overrides branchId/branchName with the selected branch.
  // The BranchManagerPortal reads user.branchId to scope all its queries.
  const modifiedUser = useMemo(() => ({
    ...user,
    branchId: branch.id,
    branchName: branch.name,
  }), [user, branch]);

  const isBlocked = blocked;

  const toggleBlock = async () => {
    try {
      await api.blockBranch(branch.id, !blocked, !blocked ? 'Blocked by Institute Admin' : '');
      setBlocked(!blocked);
      toast({
        title: blocked ? 'Branch unblocked' : 'Branch blocked',
        description: blocked ? 'Access restored' : 'All teachers and students blocked (cascade)',
      });
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteBranch(branch.id);
      toast({ title: 'Branch deleted', description: `${branch.name} and all its data have been removed.` });
      setShowDelete(false);
      onBack();
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top bar: Back button + branch name + edit/block/delete */}
      <Card className="p-4 sm:p-5 border border-border rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-border hover:bg-accent transition text-sm font-medium shrink-0"
              title="Back to Branches"
            >
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Branches</span>
            </button>
            <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary">
              <Network className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{branch.name}</h1>
                <Badge variant="outline" className={isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]'}>
                  {isBlocked ? 'Blocked' : 'Active'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {branch.city || '—'}</span>
                <span>·</span>
                <span>Manager: {branch.manager || '—'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleBlock}
              className={isBlocked ? 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10' : 'text-primary border-[oklch(0.5_0.04_260)_/_0.3] hover:bg-accent0/10'}
            >
              {isBlocked ? <><Lock className="h-3.5 w-3.5 mr-1" /> Unblock</> : <><Unlock className="h-3.5 w-3.5 mr-1" /> Block</>}
            </Button>
            <Button size="sm" variant="outline" className="text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Sub-navigation tabs: Teachers | Students | Classes & Courses | Fee Management */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 overflow-x-auto scroll-fancy">
        {BRANCH_TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content area: Branch Manager Portal for the selected branch (controlled by the tab) */}
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <BranchManagerPortal activeModule={tab} user={modifiedUser} />
      </motion.div>

      {showEdit && (
        <EditBranchModal br={branch} instituteId={user?.instituteId} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />
      )}
      {showDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setShowDelete(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-rose-100 grid place-items-center"><Trash2 className="h-6 w-6 text-rose-600" /></div>
                <div><h3 className="font-bold text-lg">Delete Branch?</h3><p className="text-sm text-muted-foreground">This action cannot be undone.</p></div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 mb-4">
                This will permanently delete <strong>{branch.name}</strong> and ALL its data: teachers, students, classes, courses, attendance, results, and materials.
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white flex-1" onClick={handleDelete}>Delete Permanently</Button>
                <Button size="sm" variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ============== Institute Overview ==============
function InstituteOverview({ user, stats, branches, loading, onAddBranch, onSelectBranch, onRefresh, showAddBranch, setShowAddBranch, lastCreated, setLastCreated }: any) {
  const cards = [
    { label: 'Branches', value: stats?.branches ?? 0, icon: Network },
    { label: 'Total Students', value: stats?.students ?? 0, icon: Users },
    { label: 'Staff', value: stats?.staff ?? 0, icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 border border-border rounded-lg shadow-sm hover:shadow-md transition">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center mb-3"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Branch cards */}
      {loading ? (
        <LoadingState label="Loading institute data…" />
      ) : branches.length === 0 ? (
        <EmptyState icon={Network} title="No branches yet" desc="Add your first branch. You'll set the Branch Manager's email and password."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>} />
      ) : (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-bold text-base">Branches</h3><p className="text-xs text-muted-foreground">Click a branch to manage it</p></div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={onAddBranch}><Plus className="h-4 w-4 mr-1.5" /> Add Branch</Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((br: any) => (
                  <BranchCard key={br.id} br={br} instituteId={user?.instituteId} onRefresh={onRefresh} onSelectBranch={onSelectBranch} />
                ))}
              </div>
            </Card>
          )}

      <BranchModal show={showAddBranch} setShow={setShowAddBranch} instituteId={user?.instituteId} onRefresh={onRefresh} lastCreated={lastCreated} setLastCreated={setLastCreated} />
    </div>
  );
}

// ============== Branch Card (opens full management page on click, not a popup) ==============
function BranchCard({ br, instituteId, onRefresh, onSelectBranch }: { br: any; instituteId: string; onRefresh: () => void; onSelectBranch: (br: any) => void }) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [blocked, setBlocked] = useState<boolean>(br.blocked === 1 || br.blocked === true);

  const isBlocked = blocked;
  const statusLabel = isBlocked ? 'Blocked' : 'Active';
  const statusClass = isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]';

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
      <Card className={`p-5 hover:shadow-lg transition relative cursor-pointer border border-border rounded-lg shadow-sm group ${isBlocked ? 'ring-1 ring-rose-500/30' : ''}`} onClick={() => onSelectBranch(br)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary">
              <Network className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{br.name}</h3>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {br.city || '—'}</div>
              <Badge variant="outline" className={`text-[10px] font-medium mt-1.5 ${statusClass}`}>{statusLabel}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition shrink-0">
            <span className="text-[10px] font-medium">Manage</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="text-xs">
            <div className="text-muted-foreground">Manager</div>
            <div className="font-medium truncate">{br.manager || '—'}</div>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEdit(true)} title="Edit" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"><Edit className="h-4 w-4" /></button>
            <button type="button" onClick={toggleBlock} title={isBlocked ? 'Unblock' : 'Block'} className={`h-8 w-8 grid place-items-center rounded-lg transition ${isBlocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-primary hover:bg-accent'}`}>{isBlocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button>
            <button type="button" onClick={() => setShowDelete(true)} title="Delete branch" className="h-8 w-8 grid place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>

      {showEdit && <EditBranchModal br={br} instituteId={instituteId} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onRefresh(); }} />}
      {showDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50" onClick={() => setShowDelete(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-rose-100 grid place-items-center"><Trash2 className="h-6 w-6 text-rose-600" /></div>
                <div><h3 className="font-bold text-lg">Delete Branch?</h3><p className="text-sm text-muted-foreground">This action cannot be undone.</p></div>
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
          <h3 className="font-bold text-lg mb-4">Edit Branch</h3>
          <div className="space-y-3">
            <div><Label>Branch Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" disabled /></div>
            <div className="pt-2 border-t border-border/40"><div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Branch Manager</div></div>
            <div><Label>Manager Name</Label><Input value={form.managerName} onChange={e => setForm({...form, managerName: e.target.value})} className="mt-1" /></div>
            <div><Label>Manager Email</Label><Input value={form.managerEmail} onChange={e => setForm({...form, managerEmail: e.target.value})} className="mt-1" /></div>
            <div><Label>New Password (leave blank to keep current)</Label><Input type="text" value={form.managerPassword} onChange={e => setForm({...form, managerPassword: e.target.value})} placeholder="Set new password" className="mt-1" /></div>
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
                <div className="h-12 w-12 rounded-full bg-accent0/15 grid place-items-center"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-bold text-lg">Branch created!</h3><p className="text-sm text-muted-foreground">{lastCreated.branch.name}</p></div>
              </div>
              <div className="rounded-xl bg-accent0/5 border border-[oklch(0.5_0.04_260)_/_0.2] p-4 space-y-2 text-sm">
                <div className="font-semibold text-primary dark:text-primary/70">Branch Manager login credentials</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Email</span><span className="font-mono">{lastCreated.managerLogin.email}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Password</span><span className="font-mono">{lastCreated.managerLogin.password}</span></div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-[oklch(0.5_0.04_260)_/_0.2]">The manager must change this password on first login. Share these credentials securely.</div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" onClick={() => { setShow(false); setLastCreated(null); }}>Done</Button>
                <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-bold text-lg mb-1">Add a new branch</h3>
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
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={creating} onClick={create}>{creating ? 'Creating…' : 'Create Branch'}</Button>
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
        <div><h1 className="text-2xl font-extrabold tracking-tight">Announcements</h1><p className="text-sm text-muted-foreground mt-1">Send messages to branches, teachers, or students</p></div>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(v => !v)}><Megaphone className="h-4 w-4 mr-1.5" /> New Announcement</Button>
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
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={sending} onClick={send}>{sending ? 'Sending…' : <><Send className="h-4 w-4 mr-1.5" /> Send</>}</Button>
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
                <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /><div className="font-medium text-sm">{a.title}</div></div>
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
