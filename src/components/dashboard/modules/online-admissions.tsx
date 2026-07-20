'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  UserPlus, FileText, Calendar, CheckCircle2, XCircle, Clock, Inbox,
  ChevronRight, Eye, Trash2, Loader2, X, TrendingUp, Filter, ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { ModuleHeader } from './students';

// ── Types ──────────────────────────────────────────────────────────────
type PipelineStage = 'New' | 'Under Review' | 'Test Scheduled' | 'Interview' | 'Accepted' | 'Rejected';

type Applicant = {
  id: string;
  name: string;
  fatherName?: string;
  program?: string;
  className?: string;
  email?: string;
  phone?: string;
  stage: PipelineStage;
  notes?: string;
  createdAt?: string;
};

// Semantic status colors only — pipeline stages share the primary navy theme for visual consistency.
const STAGES: { key: PipelineStage; label: string; color: string; gradient: string }[] = [
  { key: 'New', label: 'New', color: 'text-primary bg-primary/10 border-primary/20', gradient: 'from-primary to-primary/80' },
  { key: 'Under Review', label: 'Under Review', color: 'text-primary bg-primary/10 border-primary/20', gradient: 'from-primary to-primary/80' },
  { key: 'Test Scheduled', label: 'Test Scheduled', color: 'text-primary bg-primary/10 border-primary/20', gradient: 'from-primary to-primary/80' },
  { key: 'Interview', label: 'Interview', color: 'text-primary bg-primary/10 border-primary/20', gradient: 'from-primary to-primary/80' },
  { key: 'Accepted', label: 'Accepted', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', gradient: 'from-emerald-500 to-emerald-600' },
  { key: 'Rejected', label: 'Rejected', color: 'text-rose-600 bg-rose-500/10 border-rose-500/20', gradient: 'from-rose-500 to-rose-600' },
];

const stageColor: Record<string, string> = Object.fromEntries(STAGES.map(s => [s.key, s.color]));
const stageIcon: Record<string, React.ReactNode> = {
  'New': <FileText className="h-3 w-3" />,
  'Under Review': <Eye className="h-3 w-3" />,
  'Test Scheduled': <Calendar className="h-3 w-3" />,
  'Interview': <UserPlus className="h-3 w-3" />,
  'Accepted': <CheckCircle2 className="h-3 w-3" />,
  'Rejected': <XCircle className="h-3 w-3" />,
};

// Ordered list of forward stages (used by the "Advance" action)
const FORWARD_FLOW: PipelineStage[] = ['New', 'Under Review', 'Test Scheduled', 'Interview', 'Accepted'];

function nextStage(current: PipelineStage): PipelineStage | null {
  const i = FORWARD_FLOW.indexOf(current);
  if (i === -1 || i >= FORWARD_FLOW.length - 1) return null;
  return FORWARD_FLOW[i + 1];
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return String(d); }
}

// ── Empty-state component ──────────────────────────────────────────────
function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1.5 max-w-md">{description}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── New Application Dialog ─────────────────────────────────────────────
function NewApplicationDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', fatherName: '', program: '', className: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) { toast({ title: 'Applicant name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await api.createAdmission(form);
      toast({ title: 'Application added', description: `${form.name} added to the pipeline` });
      setForm({ name: '', fatherName: '', program: '', className: '', email: '', phone: '', notes: '' });
      onCreated();
      onClose();
    } catch (e: any) { toast({ title: 'Failed to add', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center p-4 bg-black/50"
          onClick={() => { if (!saving) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg"
          >
            <Card className="p-6 max-h-[90vh] overflow-y-auto scroll-fancy">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-lg">New Application</h3>
                <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Add an applicant to track them through the admission pipeline.</p>
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Applicant name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Student full name" className="mt-1" /></div>
                  <div><Label>Father / Guardian</Label><Input value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} placeholder="Father name" className="mt-1" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Program</Label><Input value={form.program} onChange={e => setForm({ ...form, program: e.target.value })} placeholder="Science / Arts / Commerce" className="mt-1" /></div>
                  <div><Label>Class / Grade</Label><Input value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} placeholder="e.g. Class 9" className="mt-1" /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@email.com" className="mt-1" /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92 XXX XXXXXXX" className="mt-1" /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any extra details…" className="mt-1 resize-none" /></div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white flex-1" disabled={saving} onClick={submit}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</> : <><UserPlus className="h-4 w-4 mr-1.5" /> Add Application</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export function OnlineAdmissions({ user }: { user: any }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineFilter, setPipelineFilter] = useState<PipelineStage | 'all'>('all');
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    api.getAdmissions()
      .then(r => setApplicants(Array.isArray(r) ? (r as Applicant[]) : []))
      .catch(() => setApplicants([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getAdmissions()
      .then(r => { if (!cancelled) setApplicants(Array.isArray(r) ? (r as Applicant[]) : []); })
      .catch(() => { if (!cancelled) setApplicants([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const changeStage = async (id: string, stage: PipelineStage) => {
    // optimistic update
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, stage } : a));
    try {
      await api.updateAdmission(id, { stage });
      toast({ title: `Moved to ${stage}` });
    } catch (e: any) {
      toast({ title: 'Failed to update', description: e.message, variant: 'destructive' });
      refresh();
    }
  };

  const remove = async (id: string, name: string) => {
    setApplicants(prev => prev.filter(a => a.id !== id));
    try {
      await api.deleteAdmission(id);
      toast({ title: 'Application removed', description: name });
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' });
      refresh();
    }
  };

  // ── Stats ──
  const totalApplications = applicants.length;
  const pendingReview = applicants.filter(a => a.stage === 'New' || a.stage === 'Under Review').length;
  const accepted = applicants.filter(a => a.stage === 'Accepted').length;
  const rejected = applicants.filter(a => a.stage === 'Rejected').length;
  const conversionRate = totalApplications > 0 ? ((accepted / totalApplications) * 100).toFixed(1) : '0.0';

  const statsCards = [
    { label: 'Total Applications', value: totalApplications, icon: FileText, color: 'from-primary to-primary/80' },
    { label: 'Pending Review', value: pendingReview, icon: Clock, color: 'from-primary to-primary/80' },
    { label: 'Accepted', value: accepted, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'from-rose-500 to-rose-600' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: TrendingUp, color: 'from-primary to-primary/80' },
  ];

  // ── Pipeline data ──
  const pipelineData = STAGES.map(stage => ({
    ...stage,
    count: applicants.filter(a => a.stage === stage.key).length,
    applicants: applicants.filter(a => a.stage === stage.key),
  }));

  const filteredPipeline = pipelineFilter === 'all' ? pipelineData : pipelineData.filter(s => s.key === pipelineFilter);

  const searched = applicants.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.fatherName?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.program?.toLowerCase().includes(q);
  });
  const recentApplications = [...searched].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <ModuleHeader
        title="Online Admissions"
        subtitle="Track every applicant from submission to enrollment"
        actions={
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowNew(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> New Application
          </Button>
        }
      />

      {/* ─── 1. Stats Overview ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.35 }}>
            <Card className="p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-2xl group-hover:opacity-20 transition`} />
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} grid place-items-center mb-3 shadow-sm`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold font-display">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── 2. Application Pipeline ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                Application Pipeline
              </CardTitle>
              <div className="flex gap-1.5 flex-wrap">
                <Button size="sm" variant={pipelineFilter === 'all' ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setPipelineFilter('all')}>All</Button>
                {STAGES.map(s => (
                  <Button key={s.key} size="sm" variant={pipelineFilter === s.key ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setPipelineFilter(pipelineFilter === s.key ? 'all' : s.key)}>
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Pipeline visual flow */}
            <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-2">
              {pipelineData.map((stage, i) => (
                <div key={stage.key} className="flex items-center shrink-0">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition hover:shadow-sm ${
                      pipelineFilter === stage.key ? 'ring-2 ring-primary/30 border-primary/40' : 'border-border/60'
                    } ${stage.color.split(' ').slice(1).join(' ')}`}
                    onClick={() => setPipelineFilter(pipelineFilter === stage.key ? 'all' : stage.key)}
                  >
                    <div className={`h-7 w-7 rounded-md bg-gradient-to-br ${stage.gradient} grid place-items-center text-white`}>
                      {stageIcon[stage.key]}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold leading-tight">{stage.label}</div>
                      <div className="text-lg font-extrabold leading-none font-display">{stage.count}</div>
                    </div>
                  </motion.div>
                  {i < pipelineData.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40 mx-0.5 shrink-0" />}
                </div>
              ))}
            </div>

            {/* Pipeline cards grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-h-[160px]">
              {filteredPipeline.some(s => s.applicants.length > 0) ? (
                filteredPipeline.map(stage =>
                  stage.applicants.map((applicant) => {
                    const ns = nextStage(applicant.stage);
                    return (
                      <motion.div key={applicant.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-xl border border-border/60 p-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm leading-tight">{applicant.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{applicant.id}</div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${stageColor[applicant.stage]}`}>
                            {stageIcon[applicant.stage]}<span className="ml-1">{applicant.stage}</span>
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5"><FileText className="h-3 w-3" /> {applicant.program || '—'} · {applicant.className || '—'}</div>
                          <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {fmtDate(applicant.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/40">
                          {ns && applicant.stage !== 'Rejected' && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700" onClick={() => changeStage(applicant.id, ns)}>
                              <ArrowRight className="h-3 w-3 mr-1" /> {ns}
                            </Button>
                          )}
                          {applicant.stage !== 'Rejected' && applicant.stage !== 'Accepted' && (
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700" onClick={() => changeStage(applicant.id, 'Rejected')}>
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-rose-600 ml-auto" title="Delete" onClick={() => remove(applicant.id, applicant.name)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                )
              ) : (
                <div className="col-span-full">
                  <EmptyState icon={Inbox} title="No applications in this stage"
                    description="Add a new application or change the pipeline filter. Applications move here as they progress through the admission process."
                    action={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowNew(true)}><UserPlus className="h-4 w-4 mr-1.5" /> New Application</Button>} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── 3. Applications Table ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                All Applications
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, program…" className="h-8 pl-8 text-xs" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs">Applicant</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Father / Guardian</TableHead>
                    <TableHead className="text-xs">Program</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Class</TableHead>
                    <TableHead className="text-xs">Stage</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : recentApplications.length > 0 ? (
                    recentApplications.map((app) => {
                      const ns = nextStage(app.stage);
                      return (
                        <TableRow key={app.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 grid place-items-center text-white text-[10px] font-bold shrink-0">
                                {app.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{app.name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">{app.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{app.fatherName || '—'}</TableCell>
                          <TableCell className="text-sm">{app.program || '—'}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{app.className || '—'}</TableCell>
                          <TableCell>
                            <Select value={app.stage} onValueChange={(v) => changeStage(app.id, v as PipelineStage)}>
                              <SelectTrigger className="h-7 w-[140px] text-[11px] border-0 bg-transparent hover:bg-accent px-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STAGES.map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{fmtDate(app.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {ns && app.stage !== 'Rejected' && (
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700" title={`Advance to ${ns}`} onClick={() => changeStage(app.id, ns)}>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700" title="Delete" onClick={() => remove(app.id, app.name)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState icon={Inbox} title="No applications yet"
                          description="Add your first application to start tracking applicants through the admission pipeline."
                          action={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowNew(true)}><UserPlus className="h-4 w-4 mr-1.5" /> New Application</Button>} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <NewApplicationDialog open={showNew} onClose={() => setShowNew(false)} onCreated={refresh} />
    </div>
  );
}
