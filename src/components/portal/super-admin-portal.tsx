'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, Users, Network, Plus, Crown, MapPin, CheckCircle2,
  Sparkles, Server, Building, Lock, Unlock, Edit, Megaphone, Send,
  ChevronDown, ChevronRight, UserCog, Mail, Settings, ShieldCheck, Palette, Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ---------- Main router ----------
export function SuperAdminPortal({ activeModule, user }: { activeModule: string; user: any }) {
  // Top-level data shared across the dashboard and institutes pages
  const [overview, setOverview] = useState<any>(null);
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [institutesLoading, setInstitutesLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Loading state defaults to `true` (initial load). On later refreshes we keep the
  // previously-fetched data visible until the new data arrives, which is better UX than
  // flashing a spinner on every refresh. We therefore only ever flip loading → false here.
  const refreshOverview = () => {
    api.platformOverview()
      .then(setOverview)
      .catch(() => {})
      .finally(() => setOverviewLoading(false));
  };
  const refreshInstitutes = () => {
    api.institutes()
      .then(setInstitutes)
      .catch(() => {})
      .finally(() => setInstitutesLoading(false));
  };

  useEffect(() => {
    refreshOverview();
    refreshInstitutes();
  }, []);

  const refreshAll = () => { refreshOverview(); refreshInstitutes(); };

  if (activeModule === 'institutes') {
    return (
      <InstitutesManager
        institutes={institutes}
        loading={institutesLoading}
        onRefresh={refreshAll}
        showAdd={showAdd}
        setShowAdd={setShowAdd}
      />
    );
  }
  if (activeModule === 'announcements') {
    return <AnnouncementsView user={user} institutes={institutes} institutesLoading={institutesLoading} />;
  }
  if (activeModule === 'config') {
    return <PlatformConfig overview={overview} loading={overviewLoading} />;
  }
  if (activeModule === 'branding') {
    return <BrandingPage />;
  }
  // Default: dashboard overview
  return (
    <PlatformOverview
      overview={overview}
      overviewLoading={overviewLoading}
      institutes={institutes}
      institutesLoading={institutesLoading}
      onAddInstitute={() => setShowAdd(true)}
      onRefreshAll={refreshAll}
      user={user}
      showAdd={showAdd}
      setShowAdd={setShowAdd}
    />
  );
}

// ---------- Shared UI bits ----------
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

function EmptyState({ icon: Icon, title, desc, action }: any) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted/60 items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-display font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

function LoadingState({ label = 'Loading…', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 py-10 text-muted-foreground ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function StatPill({ label, value, color = 'text-foreground' }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2 text-center">
      <div className={`text-lg font-extrabold font-display ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ---------- Dashboard overview (default landing for super admin) ----------
function PlatformOverview({
  overview, overviewLoading, institutes, institutesLoading, onAddInstitute, onRefreshAll, user, showAdd, setShowAdd,
}: any) {
  const cards = [
    { label: 'Institutions', value: overview?.institutes ?? 0, icon: Building2, color: 'from-amber-500 to-orange-600', sub: `${overview?.activeInstitutes ?? 0} active` },
    { label: 'Branches', value: overview?.branches ?? 0, icon: Network, color: 'from-emerald-500 to-emerald-700', sub: 'across all institutions' },
    { label: 'Total Students', value: overview?.totalStudents ?? 0, icon: Users, color: 'from-teal-500 to-cyan-600', sub: 'platform-wide' },
    { label: 'Total Staff', value: overview?.totalStaff ?? 0, icon: UserCog, color: 'from-violet-500 to-purple-600', sub: 'teachers & managers' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-700 to-amber-900 p-6 sm:p-8 text-white"
      >
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
              <Crown className="h-3 w-3 text-amber-300" /> Super Admin · Platform Owner
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Welcome back, {user?.name?.split(' ')[0] || 'Owner'} 👑
            </h1>
            <p className="text-amber-50/80 text-sm mt-1.5 max-w-lg">
              {overviewLoading ? 'Loading platform stats…' : (overview?.institutes ? `${overview.institutes} institutions onboarded.` : 'Provision your first institute to get started.')}
            </p>
          </div>
          <Button className="bg-white text-amber-800 hover:bg-amber-50" size="sm" onClick={onAddInstitute}>
            <Plus className="h-4 w-4 mr-1.5" /> Provision Institute
          </Button>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="h-11 w-11 rounded-xl bg-muted/60 animate-pulse" />
              <div className="mt-4 h-7 w-16 rounded bg-muted/60 animate-pulse" />
              <div className="mt-1.5 h-3 w-24 rounded bg-muted/40 animate-pulse" />
            </Card>
          ))
        ) : (
          cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition relative overflow-hidden">
                <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center shadow-md`}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
                <div className="mt-4">
                  <div className="text-2xl sm:text-3xl font-extrabold font-display">
                    {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{c.sub}</div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Institutes section */}
      {institutesLoading ? (
        <Card className="p-5"><LoadingState label="Loading institutes…" /></Card>
      ) : institutes.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No institutions yet"
          desc="Provision your first institute. You'll set the admin's email and password."
          action={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddInstitute}>
              <Plus className="h-4 w-4 mr-1.5" /> Provision Institute
            </Button>
          }
        />
      ) : (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">Institutions</h3>
              <p className="text-xs text-muted-foreground">Click a card to expand & view branches</p>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onAddInstitute}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Institute
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {institutes.map((inst: any) => (
              <InstituteCard key={inst.id} inst={inst} onRefresh={onRefreshAll} />
            ))}
          </div>
        </Card>
      )}

      {showAdd && (
        <ProvisionInstituteModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); onRefreshAll(); }}
        />
      )}
    </div>
  );
}

// ---------- Institutes manager (dedicated page) ----------
function InstitutesManager({ institutes, loading, onRefresh, showAdd, setShowAdd }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Institutes"
        subtitle="Provision institutions — click any card to expand and view branches"
        actions={
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Provision Institute
          </Button>
        }
      />
      {loading ? (
        <Card className="p-5"><LoadingState label="Loading institutes…" /></Card>
      ) : institutes.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No institutions yet"
          desc="Provision your first institute. You'll set the admin's email and password."
          action={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Provision Institute
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutes.map((inst: any) => (
            <InstituteCard key={inst.id} inst={inst} onRefresh={onRefresh} />
          ))}
        </div>
      )}
      {showAdd && (
        <ProvisionInstituteModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ---------- Institute card (expandable inline) ----------
function InstituteCard({ inst, onRefresh }: { inst: any; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [blocked, setBlocked] = useState<boolean>(inst.blocked === 1 || inst.blocked === true);

  // Branches loaded lazily when expanded
  const [branches, setBranches] = useState<any[] | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [stats, setStats] = useState<{ students: number; staff: number; branches: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const isBlocked = blocked || inst.status === 'Blocked';
  const statusLabel = isBlocked ? 'Blocked' : (inst.status === 'Trial' ? 'Trial' : 'Active');
  const statusClass = isBlocked
    ? 'text-rose-600 bg-rose-500/10 border-rose-500/20'
    : inst.status === 'Trial'
      ? 'text-amber-600 bg-amber-500/10 border-amber-500/20'
      : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';

  const loadDetails = async () => {
    if (branches !== null) return; // already loaded
    setBranchesLoading(true);
    setStatsLoading(true);
    Promise.all([
      api.branches(inst.id).catch(() => []),
      api.scopedStats(inst.id).catch(() => null),
    ])
      .then(([b, s]) => {
        setBranches(Array.isArray(b) ? b : []);
        if (s) setStats({ students: s.students || 0, staff: s.staff || 0, branches: s.branches || 0 });
      })
      .finally(() => {
        setBranchesLoading(false);
        setStatsLoading(false);
      });
  };

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadDetails();
  };

  const toggleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.blockInstitute(inst.id, !blocked, !blocked ? 'Blocked by Super Admin' : '');
      setBlocked(!blocked);
      toast({
        title: blocked ? 'Institute unblocked' : 'Institute blocked',
        description: blocked ? 'Access restored to all branches & users' : 'All branches and users are now blocked (cascade)',
      });
      onRefresh();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  };

  const initials = (inst.short || inst.name || '').slice(0, 2).toUpperCase();

  return (
    <Card
      className={`p-0 overflow-hidden hover:shadow-lg transition relative ${isBlocked ? 'ring-1 ring-rose-500/30' : ''}`}
    >
      {/* Clickable header area */}
      <button
        type="button"
        onClick={toggleExpand}
        className="w-full text-left p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      >
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 grid place-items-center shadow-md text-white font-display font-extrabold">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{inst.name}</h3>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {inst.city ? `${inst.city}, ` : ''}{inst.country || '—'}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-[10px] font-normal border-border/60">{inst.plan || 'Starter'}</Badge>
                <Badge variant="outline" className={`text-[10px] font-medium ${statusClass}`}>{statusLabel}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="text-xs min-w-0">
            <div className="text-muted-foreground">Admin</div>
            <div className="font-medium truncate">{inst.adminName || '—'}</div>
          </div>
          {/* Action buttons — stop propagation so they don't expand the card */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowEdit(true)}
              title="Edit"
              className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={toggleBlock}
              title={isBlocked ? 'Unblock' : 'Block (cascades to branches & users)'}
              className={`h-8 w-8 grid place-items-center rounded-lg transition ${
                isBlocked ? 'text-rose-600 hover:bg-rose-500/10' : 'text-emerald-600 hover:bg-emerald-500/10'
              }`}
            >
              {isBlocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/40 bg-muted/20"
          >
            <div className="p-5 space-y-4">
              {/* Totals */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Institute Totals</div>
                <div className="grid grid-cols-3 gap-2">
                  <StatPill label="Branches" value={statsLoading ? '…' : (stats?.branches ?? inst.branches ?? 0)} color="text-emerald-600" />
                  <StatPill label="Students" value={statsLoading ? '…' : (stats?.students ?? inst.students ?? 0)} color="text-teal-600" />
                  <StatPill label="Teachers" value={statsLoading ? '…' : (stats?.staff ?? inst.staff ?? 0)} color="text-violet-600" />
                </div>
              </div>

              {/* Branches list */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Branches</span>
                  {!branchesLoading && branches !== null && (
                    <span className="text-[10px] normal-case tracking-normal">{branches.length} total</span>
                  )}
                </div>
                {branchesLoading ? (
                  <LoadingState label="Loading branches…" className="py-4" />
                ) : branches && branches.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">
                    No branches yet — the Institute Admin can add branches from their portal.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto scroll-fancy pr-1">
                    {branches?.map((br: any) => (
                      <BranchRow key={br.id} br={br} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showEdit && (
        <EditInstituteModal
          inst={inst}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); onRefresh(); }}
        />
      )}
    </Card>
  );
}

function BranchRow({ br }: { br: any }) {
  const isBlocked = br.blocked === 1 || br.blocked === true;
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3 hover:bg-accent/40 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{br.name}</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {br.city || '—'}
            {br.manager && (<><span className="mx-1">·</span><UserCog className="h-3 w-3" /> {br.manager}</>)}
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] shrink-0 ${isBlocked ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'}`}
        >
          {isBlocked ? 'Blocked' : 'Active'}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-border/40 text-center">
        <div>
          <div className="font-bold text-sm">{br.students ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Students</div>
        </div>
        <div>
          <div className="font-bold text-sm">{br.teachers ?? 0}</div>
          <div className="text-[10px] text-muted-foreground">Teachers</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Edit Institute modal (scrollable) ----------
function EditInstituteModal({ inst, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    name: inst.name || '',
    plan: inst.plan || 'Starter',
    adminName: inst.adminName || '',
    adminEmail: inst.adminEmail || '',
    adminPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.adminEmail) {
      toast({ title: 'Institute name and admin email are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Only include adminPassword if the user typed a new one
      const body: any = {
        name: form.name,
        plan: form.plan,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
      };
      if (form.adminPassword.trim()) body.adminPassword = form.adminPassword.trim();
      await api.editInstitute(inst.id, body);
      toast({
        title: 'Institute updated',
        description: form.adminPassword ? 'Admin password updated — they will need to use the new one.' : 'Changes saved.',
      });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-start sm:place-items-center p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md my-8"
      >
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">Edit Institute</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Update institute info and admin credentials</p>
            </div>
            <Edit className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            <div>
              <Label>Institute Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 border-t border-border/40">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Institute Admin</div>
            </div>
            <div>
              <Label>Admin Name</Label>
              <Input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Admin Email</Label>
              <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>New Password (optional)</Label>
              <Input
                type="text"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                placeholder="Leave blank to keep current"
                className="mt-1 font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">If set, the admin must use this password to log in.</p>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ---------- Provision Institute modal (scrollable, shows actual password) ----------
function ProvisionInstituteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', city: '', country: 'USA', plan: 'Premium',
    adminName: '', adminEmail: '', adminPassword: '',
  });
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<any>(null);

  const create = async () => {
    if (!form.name || !form.adminEmail || !form.adminPassword) {
      toast({ title: 'Institute name, admin email and password are required', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await api.createInstitute(form);
      toast({ title: 'Institute provisioned!', description: `${res.institute.name} — admin login created` });
      setLastCreated(res);
      setForm({ name: '', city: '', country: 'USA', plan: 'Premium', adminName: '', adminEmail: '', adminPassword: '' });
      onSaved();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-start sm:place-items-center p-4 bg-black/50 overflow-y-auto"
      onClick={() => { if (!creating) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg my-8"
      >
        <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
          {lastCreated ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Institute provisioned!</h3>
                  <p className="text-sm text-muted-foreground">{lastCreated.institute.name} is ready</p>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-2 text-sm">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">Institute Admin login credentials</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-mono text-xs sm:text-sm break-all text-right">{lastCreated.adminLogin?.email}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Password</span>
                  <span className="font-mono text-xs sm:text-sm break-all text-right text-emerald-700 dark:text-emerald-300">
                    {lastCreated.adminLogin?.password}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-emerald-500/20">
                  Share these credentials securely. The admin can change their password after logging in.
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" onClick={onClose}>Done</Button>
                <Button size="sm" variant="outline" onClick={() => setLastCreated(null)}>Add Another</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-lg">Provision a new institute</h3>
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                You will set the Institute Admin's email and password. They can change it after first login.
              </p>
              <div className="space-y-3">
                <div>
                  <Label>Institute name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dallas Modern School" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dallas" className="mt-1" />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter — 1 branch, basic modules</SelectItem>
                      <SelectItem value="Premium">Premium — multi-branch, all modules</SelectItem>
                      <SelectItem value="Enterprise">Enterprise — unlimited, white-label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2 border-t border-border/40">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Institute Admin — You set the credentials
                  </div>
                </div>
                <div>
                  <Label>Admin name</Label>
                  <Input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} placeholder="Dr. Jane Doe" className="mt-1" />
                </div>
                <div>
                  <Label>Admin email *</Label>
                  <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@school.edu" className="mt-1" />
                </div>
                <div>
                  <Label>Assign password *</Label>
                  <Input
                    type="text"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                    placeholder="Set a password for the admin"
                    className="mt-1 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">This is the actual password the admin will use to log in.</p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1" disabled={creating} onClick={create}>
                  {creating ? 'Provisioning…' : 'Provision Institute'}
                </Button>
                <Button size="sm" variant="outline" disabled={creating} onClick={onClose}>Cancel</Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ---------- Announcements view (super admin only sees their own) ----------
function AnnouncementsView({ user, institutes, institutesLoading }: { user: any; institutes: any[]; institutesLoading: boolean }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', targetScope: 'all', selectedInstitutes: [] as string[] });
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => {
    api.getAnnouncements()
      .then((a) => setAnnouncements(Array.isArray(a) ? a : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, []);

  const send = async () => {
    if (!form.title || !form.message) {
      toast({ title: 'Title and message required', variant: 'destructive' });
      return;
    }
    if (form.targetScope === 'specific' && form.selectedInstitutes.length === 0) {
      toast({ title: 'Select at least one institute', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      await api.createAnnouncement({
        title: form.title,
        message: form.message,
        targetRole: 'institute-admin',
        targetScope: form.targetScope,
        targetIds: form.targetScope === 'specific' ? form.selectedInstitutes : undefined,
      });
      toast({
        title: 'Announcement sent!',
        description: form.targetScope === 'all' ? 'Sent to all institutes' : `Sent to ${form.selectedInstitutes.length} institute(s)`,
      });
      setForm({ title: '', message: '', targetScope: 'all', selectedInstitutes: [] });
      setShowForm(false);
      refresh();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Announcements"
        subtitle="Send messages to Institute Admins — only your announcements are shown here"
        actions={
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm((v) => !v)}>
            <Megaphone className="h-4 w-4 mr-1.5" /> New Announcement
          </Button>
        }
      />

      {showForm && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-4">New Announcement</h3>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Platform maintenance scheduled" className="mt-1" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Type your announcement…" className="mt-1 resize-none" />
            </div>
            <div>
              <Label>Recipients</Label>
              <Select value={form.targetScope} onValueChange={(v) => setForm({ ...form, targetScope: v })}>
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
                {institutesLoading ? (
                  <LoadingState label="Loading institutes…" className="py-4 border border-border/60 rounded-lg" />
                ) : (
                  <div className="mt-2 max-h-48 overflow-y-auto scroll-fancy space-y-1.5 border border-border/60 rounded-lg p-3">
                    {institutes.map((inst) => (
                      <label key={inst.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={form.selectedInstitutes.includes(inst.id)}
                          onChange={(e) => {
                            if (e.target.checked) setForm({ ...form, selectedInstitutes: [...form.selectedInstitutes, inst.id] });
                            else setForm({ ...form, selectedInstitutes: form.selectedInstitutes.filter((id) => id !== inst.id) });
                          }}
                          className="custom-checkbox w-4 h-4 rounded"
                        />
                        <span className="text-sm">{inst.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={sending} onClick={send}>
              {sending ? 'Sending…' : (<><Send className="h-4 w-4 mr-1.5" /> Send Announcement</>)}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-5"><LoadingState label="Loading announcements…" /></Card>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          desc="Send messages to all or specific Institute Admins."
          action={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowForm(true)}>
              <Megaphone className="h-4 w-4 mr-1.5" /> New Announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Megaphone className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="font-medium text-sm truncate">{a.title}</div>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6 whitespace-pre-wrap">{a.message}</p>
              <div className="text-[11px] text-muted-foreground mt-2 ml-6">
                To: {a.targetScope === 'all' ? 'All Institute Admins' : 'Specific Institutes'}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Platform Config (display-only) ----------
function PlatformConfig({ overview, loading }: { overview: any; loading: boolean }) {
  const settings = [
    { icon: Building2, label: 'Platform Name', value: 'ESM', desc: 'Shown across the platform UI' },
    { icon: Sparkles, label: 'Default Plan for New Institutes', value: 'Premium', desc: 'Pre-selected when provisioning' },
    { icon: Mail, label: 'Support Email', value: 'faisalkhan00297@gmail.com', desc: 'For all support requests' },
    { icon: Building, label: 'Max Institutes Allowed', value: loading ? '…' : (overview?.institutes ? `${overview.institutes} active` : 'Unlimited'), desc: 'Current platform cap' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader title="Platform Configuration" subtitle="Display-only platform settings — edit backend config to change values" />
      <div className="grid sm:grid-cols-2 gap-4">
        {settings.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 hover:shadow-md transition relative overflow-hidden">
              <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-amber-500/10 blur-2xl" />
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow shrink-0">
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  <div className="font-bold text-base break-all mt-0.5">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card className="p-5 border-dashed">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-sm">Display-only mode</div>
            <p className="text-xs text-muted-foreground mt-1">
              These settings are read from the backend configuration. To change platform name, default plan, support email, or institute caps,
              update the backend config file. This page reflects the live values for visibility.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---------- Branding page (display-only) ----------
function BrandingPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Branding" subtitle="Platform visual identity" />
      <Card className="p-0 overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-700 to-amber-900 p-8 sm:p-10 text-white">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15">
              <ShieldCheck className="h-3 w-3 text-amber-300" /> Platform Identity
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">ESM</h2>
            <p className="text-amber-50/90 text-base sm:text-lg mt-1">Electronic School Management</p>
            <p className="text-amber-50/70 text-sm mt-3 max-w-md">
              Modern school management for institutions worldwide — by Cyber Advance Solutions.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-amber-600" />
            <h3 className="font-bold text-sm">Color Theme</h3>
          </div>
          <div className="space-y-2.5">
            <ColorRow name="Primary (Amber)" hex="#d97706" className="bg-amber-600" />
            <ColorRow name="Accent (Orange)" hex="#c2410c" className="bg-orange-700" />
            <ColorRow name="Success (Emerald)" hex="#059669" className="bg-emerald-600" />
            <ColorRow name="Neutral (Slate)" hex="#475569" className="bg-slate-600" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-sm">Brand Information</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Platform Name</span><span className="font-medium">ESM</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Tagline</span><span className="font-medium text-right">Electronic School Management</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Provider</span><span className="font-medium text-right">Cyber Advance Solutions</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Theme Mode</span><span className="font-medium">Light / Dark</span></div>
          </div>
        </Card>
      </div>

      <Card className="p-5 border-dashed">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-sm">Display-only</div>
            <p className="text-xs text-muted-foreground mt-1">
              Branding assets (logo, tagline, color palette) are defined in the platform theme configuration. Update the theme tokens to change the look.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ColorRow({ name, hex, className }: { name: string; hex: string; className: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-7 w-7 rounded-md ${className} ring-1 ring-black/10`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-[11px] text-muted-foreground font-mono">{hex}</div>
      </div>
    </div>
  );
}
