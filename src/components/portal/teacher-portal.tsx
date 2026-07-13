'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BookOpen, CalendarCheck, GraduationCap, ClipboardList, Calendar, Users,
  CheckCircle2, XCircle, Clock, Plus, MessageSquare, Inbox, ArrowLeft,
  FileText, Link2, Download, Megaphone, Paperclip, Loader2,
  LayoutDashboard, ArrowRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type ClassInfo = {
  id: string;
  name: string;
  section?: string;
  branchId?: string;
  courses: { id: string; name: string; code?: string }[];
};

type MaterialItem = {
  id: string;
  title: string;
  description?: string;
  fileType?: string;
  fileName?: string;
  linkUrl?: string;
  createdAt?: number | string;
  classId?: string;
  courseId?: string;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  senderRole?: string;
  targetRole?: string;
  targetScope?: string;
  classId?: string | null;
  createdAt?: number | string;
};

export function TeacherPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [diary, setDiary] = useState<any[]>([]);
  const [myResults, setMyResults] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [selectedTab, setSelectedTab] = useState<'attendance' | 'results' | 'materials' | 'announcements'>('attendance');

  const refresh = () => {
    if (user?.branchId) {
      api.platformUsers({ branchId: user.branchId, role: 'student' }).then(setStudents).catch(() => {});
    }
    if (user?.id) {
      api.getDiary({ teacherId: user.id }).then(setDiary).catch(() => {});
      api.getResults({ teacherId: user.id }).then(setMyResults).catch(() => {});
      api.getTeacherClasses().then(setClasses).catch(() => {});
    }
  };
  useEffect(() => { refresh(); }, [user?.id, user?.branchId]);

  const openClass = (cls: ClassInfo, tab: 'attendance' | 'results' | 'materials' | 'announcements' = 'attendance') => {
    setSelectedClass(cls);
    setSelectedTab(tab);
  };

  // If a class is selected on the overview, render detail view (only when on overview module)
  if (activeModule === 'teacher-overview' && selectedClass) {
    return (
      <ClassDetail
        cls={selectedClass}
        user={user}
        students={students.filter((s: any) => s.class === selectedClass.name)}
        initialTab={selectedTab}
        onBack={() => setSelectedClass(null)}
      />
    );
  }

  if (activeModule === 'mark-attendance') return <MarkAttendance user={user} classes={classes} students={students} onSaved={refresh} />;
  if (activeModule === 'post-results') return <PostResults user={user} classes={classes} students={students} onSaved={refresh} />;
  if (activeModule === 'diary') return <DiaryView user={user} diary={diary} onSaved={refresh} />;
  if (activeModule === 'timetable') return <TeacherTimetable user={user} />;
  if (activeModule === 'my-students') return <MyStudents students={students} />;
  if (activeModule === 'sms') return <MessageParents user={user} students={students} />;
  if (activeModule === 'announcements') return <TeacherAnnouncements user={user} classes={classes} />;
  if (activeModule === 'teacher-dashboard') return <TeacherDashboard user={user} students={students} diary={diary} myResults={myResults} classes={classes} onOpenClass={openClass} />;
  return <TeacherOverview user={user} students={students} diary={diary} myResults={myResults} classes={classes} onOpenClass={openClass} />;
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
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

const TABS = [
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'results', label: 'Results', icon: GraduationCap },
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
] as const;

function ClassDetail({ cls, user, students, initialTab, onBack }: {
  cls: ClassInfo;
  user: any;
  students: any[];
  initialTab: 'attendance' | 'results' | 'materials' | 'announcements';
  onBack: () => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [courseId, setCourseId] = useState<string>(cls.courses[0]?.id || '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-accent transition" title="Back to classes">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{cls.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{cls.section ? `Section ${cls.section} · ` : ''}{cls.courses.length} course{cls.courses.length === 1 ? '' : 's'} · {students.length} student{students.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        {cls.courses.length > 0 && (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground hidden sm:block">Course</Label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)} className="h-9 rounded-md border border-border bg-card px-3 text-sm min-w-[180px]">
              {cls.courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.code ? ` · ${c.code}` : ''}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 overflow-x-auto scroll-fancy">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'attendance' && <ClassAttendance user={user} cls={cls} students={students} />}
          {tab === 'results' && <ClassResults user={user} cls={cls} courseId={courseId} students={students} />}
          {tab === 'materials' && <ClassMaterials user={user} cls={cls} courseId={courseId} />}
          {tab === 'announcements' && <ClassAnnouncements user={user} cls={cls} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============== Attendance Tab ==============
function ClassAttendance({ user, cls, students }: { user: any; cls: ClassInfo; students: any[] }) {
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const setStatus = (id: string, status: string) => setAttendance(a => ({ ...a, [id]: status }));
  const present = students.filter(s => (attendance[s.id] || 'Present') === 'Present').length;
  const absent = students.filter(s => attendance[s.id] === 'Absent').length;
  const late = students.filter(s => attendance[s.id] === 'Late').length;

  const save = async () => {
    if (students.length === 0) { toast({ title: 'No students to mark', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const records = students.map(s => ({ studentId: s.id, status: attendance[s.id] || 'Present' }));
      await api.markAttendance({
        classId: cls.id,
        branchId: user.branchId,
        class: cls.name,
        date: new Date().toISOString().slice(0, 10),
        teacherId: user.id,
        records,
      });
      toast({ title: 'Attendance saved!', description: `${present} present, ${absent} absent, ${late} late` });
      setAttendance({});
    } catch (e: any) {
      const msg = e.message || 'Unknown error';
      if (msg.includes('Insufficient permissions')) {
        toast({ title: 'Permission denied', description: 'Only teachers can mark attendance.', variant: 'destructive' });
      } else if (msg.includes('Authentication required') || msg.includes('session')) {
        toast({ title: 'Session expired', description: 'Please sign out and sign in again.', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to save', description: msg, variant: 'destructive' });
      }
    } finally { setSaving(false); }
  };

  if (students.length === 0) {
    return <EmptyState icon={Users} title="No students in this class" desc="Your Branch Manager needs to add students to this class before you can take attendance." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving} onClick={save}>
          {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</> : 'Save Attendance'}
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
        <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
        <Card className="p-4 text-center"><Clock className="h-6 w-6 text-sky-700 mx-auto mb-1" /><div className="text-2xl font-bold">{late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
      </div>
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Mark</TableHead></TableRow></TableHeader>
          <TableBody>
            {students.map(s => {
              const st = attendance[s.id] || 'Present';
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {['Present', 'Absent', 'Late'].map(opt => (
                        <Button key={opt} size="sm" variant={st === opt ? 'default' : 'outline'}
                          className={st === opt ? (opt === 'Present' ? 'bg-primary text-white' : opt === 'Absent' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white') : 'h-8 px-2 text-xs'}
                          onClick={() => setStatus(s.id, opt)}>{opt[0]}</Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============== Results Tab ==============
function ClassResults({ user, cls, courseId, students }: { user: any; cls: ClassInfo; courseId: string; students: any[] }) {
  const [exam, setExam] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const calcGrade = (m: number, total: number) => {
    const p = (m / total) * 100;
    return p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F';
  };

  const save = async () => {
    if (!exam.trim()) { toast({ title: 'Enter exam name', description: 'e.g. Chapter 1 Test', variant: 'destructive' }); return; }
    if (!courseId) { toast({ title: 'Select a course first', variant: 'destructive' }); return; }
    if (students.length === 0) { toast({ title: 'No students', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const records = students.map(s => {
        const m = parseInt(marks[s.id] || '0');
        return { studentId: s.id, marks: m, grade: calcGrade(m, totalMarks) };
      });
      await api.postResults({
        classId: cls.id,
        courseId,
        branchId: user.branchId,
        exam,
        teacherId: user.id,
        totalMarks,
        date: new Date().toISOString().slice(0, 10),
        records,
      });
      toast({ title: 'Results posted!', description: `${records.length} students · ${exam}` });
      setMarks({});
    } catch (e: any) { toast({ title: 'Failed to post', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (!courseId) {
    return <EmptyState icon={GraduationCap} title="No course assigned" desc="This class doesn't have any courses assigned yet. Ask your Branch Manager to assign courses." />;
  }

  if (students.length === 0) {
    return <EmptyState icon={Users} title="No students in this class" desc="There are no students to post results for." />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label className="text-xs">Exam Name *</Label>
            <Input value={exam} onChange={e => setExam(e.target.value)} placeholder="e.g. Chapter 1 Test" className="mt-1" />
          </div>
          <div><Label className="text-xs">Total Marks</Label><Input type="number" value={totalMarks} onChange={e => setTotalMarks(parseInt(e.target.value) || 100)} className="mt-1" /></div>
          <div className="flex items-end"><Button size="sm" className="bg-primary hover:bg-primary/90 text-white w-full" disabled={saving || !exam.trim()} onClick={save}>
            {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Posting…</> : 'Publish Results'}</Button></div>
        </div>
      </Card>
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Marks</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
          <TableBody>
            {students.map(s => {
              const m = parseInt(marks[s.id] || '0');
              const grade = m > 0 ? calcGrade(m, totalMarks) : '—';
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="text-right"><Input type="number" value={marks[s.id] || ''} onChange={e => setMarks({ ...marks, [s.id]: e.target.value })} className="w-20 h-8 text-right ml-auto" placeholder="0" max={totalMarks} /></TableCell>
                  <TableCell className="text-right"><Badge variant="outline" className="font-bold">{grade}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============== Materials Tab ==============
function ClassMaterials({ user, cls, courseId }: { user: any; cls: ClassInfo; courseId: string }) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!cls.id || !courseId) return;
    api.getCourseMaterials({ classId: cls.id, courseId })
      .then(setMaterials)
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, [cls.id, courseId, reloadKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{materials.length} material{materials.length === 1 ? '' : 's'} for this class</p>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={!courseId} onClick={() => setShowForm(v => !v)}>
          <Plus className="h-4 w-4 mr-1.5" /> {showForm ? 'Cancel' : 'Upload Material'}
        </Button>
      </div>

      {showForm && courseId && (
        <MaterialUploadForm
          classId={cls.id}
          courseId={courseId}
          teacherId={user.id}
          onSaved={() => { setShowForm(false); setReloadKey(k => k + 1); }}
        />
      )}

      {loading ? (
        <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>
      ) : materials.length === 0 ? (
        <EmptyState icon={FileText} title="No materials uploaded yet" desc="Upload PDFs, DOCX, PNG, PPT files or share a link. Students will be able to download them from their portal." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {materials.map(m => <MaterialCard key={m.id} material={m} teacherView />)}
        </div>
      )}
    </div>
  );
}

function MaterialUploadForm({ classId, courseId, teacherId, onSaved }: { classId: string; courseId: string; teacherId: string; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFile = (f: File | null) => {
    if (!f) { setFile(null); return; }
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/png', 'image/jpeg'];
    const ext = f.name.split('.').pop()?.toLowerCase();
    const okExt = ['pdf', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'].includes(ext || '');
    if (!allowed.includes(f.type) && !okExt) {
      toast({ title: 'Unsupported file type', description: 'Use PDF, DOCX, PPT, PNG, or JPG.', variant: 'destructive' });
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 8 MB.', variant: 'destructive' });
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    if (mode === 'file' && !file) { toast({ title: 'Choose a file', variant: 'destructive' }); return; }
    if (mode === 'link' && !linkUrl.trim()) { toast({ title: 'Link URL required', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      let body: any = { classId, courseId, title, description, teacherId };
      if (mode === 'file' && file) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // strip "data:<mime>;base64," prefix
            const idx = result.indexOf(',');
            resolve(idx >= 0 ? result.slice(idx + 1) : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        body = { ...body, fileType: file.type || 'application/octet-stream', fileName: file.name, fileData: base64 };
      } else if (mode === 'link') {
        body = { ...body, linkUrl };
      }
      await api.addCourseMaterial(body);
      toast({ title: 'Material uploaded!', description: 'Students can now access it.' });
      setTitle(''); setDescription(''); setLinkUrl(''); setFile(null);
      onSaved();
    } catch (e: any) { toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-8 w-8 rounded-lg bg-accent0/15 grid place-items-center"><Paperclip className="h-4 w-4 text-primary" /></div>
        <h3 className="font-bold text-sm">New Course Material</h3>
      </div>
      <div className="flex gap-1 p-1 rounded-lg bg-muted/60 w-fit">
        <button onClick={() => setMode('file')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${mode === 'file' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
          <FileText className="h-3.5 w-3.5 inline mr-1" /> File
        </button>
        <button onClick={() => setMode('link')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${mode === 'link' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
          <Link2 className="h-3.5 w-3.5 inline mr-1" /> Link
        </button>
      </div>
      <div><Label className="text-xs">Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Chapter 5 — Lecture Notes" className="mt-1" /></div>
      <div><Label className="text-xs">Description</Label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Brief description of the material…" className="w-full mt-1 rounded-md border border-border bg-card p-2 text-sm resize-none" /></div>
      {mode === 'file' ? (
        <div>
          <Label className="text-xs">File (PDF, DOCX, PPT, PNG, JPG — max 8 MB)</Label>
          <input type="file" accept=".pdf,.docx,.ppt,.pptx,.png,.jpg,.jpeg" onChange={e => handleFile(e.target.files?.[0] || null)} className="block w-full mt-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-accent0/15 file:text-primary hover:file:bg-accent0/25 file:font-medium file:text-sm cursor-pointer" />
          {file && <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5"><Paperclip className="h-3 w-3" /> {file.name} · {(file.size / 1024).toFixed(0)} KB</div>}
        </div>
      ) : (
        <div><Label className="text-xs">Link URL *</Label><Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://docs.google.com/…" className="mt-1" /></div>
      )}
      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving} onClick={submit}>
        {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Uploading…</> : 'Upload'}
      </Button>
    </Card>
  );
}

function MaterialCard({ material, teacherView = false }: { material: MaterialItem; teacherView?: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const isLink = !!material.linkUrl;
  const icon = isLink ? Link2 : FileText;
  const Icon = icon;
  const ext = material.fileName?.split('.').pop()?.toUpperCase() || (isLink ? 'LINK' : 'FILE');
  const createdAt = material.createdAt ? new Date(material.createdAt).toLocaleDateString() : '';

  const handleDownload = async () => {
    if (isLink && material.linkUrl) {
      window.open(material.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setDownloading(true);
    try {
      const res = await api.downloadMaterialBlob(material.id);
      if ('linkUrl' in res) {
        window.open(res.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        const url = URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || material.fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      toast({ title: 'Download failed', description: e.message, variant: 'destructive' });
    } finally { setDownloading(false); }
  };

  return (
    <Card className="p-4 hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${isLink ? 'bg-accent0/15' : 'bg-accent0/15'}`}>
          <Icon className={`h-5 w-5 ${isLink ? 'text-primary' : 'text-primary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-medium text-sm truncate">{material.title}</h4>
            <Badge variant="outline" className="text-[10px] font-mono shrink-0">{ext}</Badge>
          </div>
          {material.description && <p className="text-xs text-muted-foreground line-clamp-2">{material.description}</p>}
          <div className="text-[11px] text-muted-foreground mt-1">{createdAt}{isLink ? ' · External link' : ''}</div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
          {isLink ? 'Open Link' : 'Download'}
        </Button>
      </div>
    </Card>
  );
}

// ============== Class Announcements Tab ==============
function ClassAnnouncements({ user, cls }: { user: any; cls: ClassInfo }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.getAnnouncements()
      .then((list: any[]) => setAnnouncements(list.filter(a => !a.classId || a.classId === cls.id)))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [cls.id, reloadKey]);

  const send = async () => {
    if (!title.trim() || !message.trim()) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await api.createAnnouncement({
        title, message,
        classId: cls.id,
        targetScope: 'class',
        targetRole: 'student',
      });
      toast({ title: 'Announcement sent!', description: `To ${cls.name} students` });
      setTitle(''); setMessage('');
      setReloadKey(k => k + 1);
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-accent0/15 grid place-items-center"><Megaphone className="h-4 w-4 text-primary" /></div>
          <h3 className="font-bold text-sm">Announce to {cls.name}</h3>
        </div>
        <div><Label className="text-xs">Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tomorrow's class cancelled" className="mt-1" /></div>
        <div><Label className="text-xs">Message *</Label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Write your announcement…" className="w-full mt-1 rounded-md border border-border bg-card p-2 text-sm resize-none" /></div>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={sending} onClick={send}>
          {sending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Sending…</> : <><Megaphone className="h-4 w-4 mr-1.5" /> Send to Class</>}
        </Button>
      </Card>

      {loading ? (
        <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>
      ) : announcements.length === 0 ? (
        <EmptyState icon={Inbox} title="No announcements yet" desc="Send your first announcement to this class. Students will see it in their portal." />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => <AnnouncementCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ a }: { a: Announcement }) {
  const date = a.createdAt ? new Date(a.createdAt).toLocaleString() : '';
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h4 className="font-semibold text-sm">{a.title}</h4>
        <Badge variant="outline" className="text-[10px] capitalize shrink-0">{a.targetScope || 'all'}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{a.message}</p>
      <div className="text-[11px] text-muted-foreground mt-2">{date}{a.senderRole ? ` · from ${a.senderRole}` : ''}</div>
    </Card>
  );
}

// ============== Teacher Dashboard (KPIs + Quick Links, NO announcements) ==============
function TeacherDashboard({ user, students, diary, myResults, classes, onOpenClass }: any) {
  const setActiveModule = useApp(s => s.setActiveModule);
  const totalCourses = classes.reduce((acc: number, c: ClassInfo) => acc + c.courses.length, 0);
  const diaryCount = diary.length;
  const resultsCount = myResults?.length || 0;

  const cards = [
    { label: 'Total Classes', value: classes.length, icon: GraduationCap, color: 'from-primary to-primary/80', sub: classes.length === 1 ? '1 class assigned' : `${classes.length} classes assigned` },
    { label: 'Total Students', value: students.length, icon: Users, color: 'from-primary/80 to-primary', sub: students.length === 1 ? '1 student in branch' : `${students.length} students in branch` },
    { label: 'Total Courses', value: totalCourses, icon: BookOpen, color: 'from-primary/80 to-primary', sub: totalCourses === 1 ? '1 course' : `${totalCourses} courses` },
    { label: 'Diary Entries', value: diaryCount, icon: ClipboardList, color: 'from-primary/80 to-primary', sub: diaryCount === 0 ? 'No entries yet' : diaryCount === 1 ? '1 entry posted' : `${diaryCount} entries posted` },
  ];

  const quickLinks = [
    { label: 'My Classes', desc: 'View & manage your classes', icon: BookOpen, module: 'teacher-overview', color: 'from-primary to-primary/80' },
    { label: 'Take Attendance', desc: 'Mark today\'s attendance', icon: CalendarCheck, module: 'mark-attendance', color: 'from-primary/80 to-primary' },
    { label: 'Post Results', desc: 'Publish exam results', icon: GraduationCap, module: 'post-results', color: 'from-primary/80 to-primary' },
    { label: 'Diary & Homework', desc: 'Post homework & notes', icon: ClipboardList, module: 'diary', color: 'from-primary/80 to-primary' },
    { label: 'My Timetable', desc: 'View weekly schedule', icon: Calendar, module: 'timetable', color: 'from-primary/80 to-primary' },
    { label: 'Message Parents', desc: 'Send SMS to parents', icon: MessageSquare, module: 'sms', color: 'from-primary/80 to-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner — navy blue (already styled) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[oklch(0.5_0.04_260)_/_0.15] blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><LayoutDashboard className="h-3 w-3 text-primary/70" /> Teacher Dashboard · {user?.branchName}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Hello, {user?.name?.split(' ')[0]}</h1>
          <p className="text-white/80 text-sm mt-1.5">
            {classes.length
              ? `You teach ${classes.length} class${classes.length === 1 ? '' : 'es'} with ${totalCourses} course${totalCourses === 1 ? '' : 's'} and ${students.length} student${students.length === 1 ? '' : 's'} in your branch.`
              : 'Your classes will appear here once your Branch Manager assigns them.'}
          </p>
        </div>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 border border-border rounded-lg shadow-sm hover:shadow-md transition">
              <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center mb-3"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
              <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{c.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Links — NO announcements (those live in the Announcements page) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Quick Links</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Jump straight to a teaching task.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((q, i) => (
            <motion.button
              key={q.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setActiveModule(q.module)}
              className="text-left group"
            >
              <Card className="p-5 border border-border rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center">
                    <q.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                </div>
                <h3 className="font-bold text-base">{q.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{q.desc}</p>
              </Card>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Diary snippet (optional, only if entries exist) */}
      {diaryCount > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-base">Recent Diary Entries</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActiveModule('diary')}>View all <ArrowRight className="h-3 w-3 ml-1" /></Button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto scroll-fancy">
            {diary.slice(0, 5).map((d: any) => (
              <div key={d.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.title || d.subject || 'Diary entry'}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{d.class || d.className || '—'}{d.dueDate ? ` · Due ${d.dueDate}` : ''}</div>
                </div>
                <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{d.date || (d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—')}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hint card: results */}
      {resultsCount === 0 && classes.length > 0 && (
        <Card className="p-4 bg-accent dark:bg-[oklch(0.12_0.03_260)_/_0.3] border-accent dark:border-[oklch(0.2_0.04_260)]">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent0/20 grid place-items-center shrink-0"><GraduationCap className="h-4 w-4 text-primary dark:text-primary/70" /></div>
            <div className="flex-1">
              <div className="font-bold text-sm text-primary dark:text-[oklch(0.8_0.03_260)]">No results published yet</div>
              <p className="text-xs text-muted-foreground mt-1">Publish your first exam results from the Post Results page — students and parents will see them instantly.</p>
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shrink-0" onClick={() => setActiveModule('post-results')}>Post Results</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============== Teacher Overview (class cards) ==============
function TeacherOverview({ user, students, diary, myResults, classes, onOpenClass }: any) {
  const totalCourses = classes.reduce((acc: number, c: ClassInfo) => acc + c.courses.length, 0);
  // "Today's Schedule" — number of classes the teacher has today.
  // The real per-day timetable isn't published yet, so we fall back to 0 with a hint
  // until the Branch Manager publishes a weekly timetable.
  const todaySchedule = 0;
  const cards = [
    { label: 'Total Classes', value: classes.length, icon: GraduationCap, color: 'from-primary to-primary/80', sub: classes.length === 1 ? '1 class assigned' : `${classes.length} classes assigned` },
    { label: 'Total Students', value: students.length, icon: Users, color: 'from-primary/80 to-primary', sub: students.length === 1 ? '1 student in branch' : `${students.length} students in branch` },
    { label: 'Total Courses', value: totalCourses, icon: BookOpen, color: 'from-primary/80 to-primary', sub: totalCourses === 1 ? '1 course' : `${totalCourses} courses` },
    { label: "Today's Schedule", value: todaySchedule, icon: CalendarCheck, color: 'from-primary/80 to-primary', sub: 'No timetable yet' },
  ];

  // Per-class student count helper — students are scoped to the teacher's branch,
  // so we filter by matching the class name to the student's `class` field.
  const studentsInClass = (cls: ClassInfo) => students.filter((s: any) => s.class === cls.name).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[oklch(0.5_0.04_260)_/_0.15] blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><BookOpen className="h-3 w-3 text-primary/70" /> Teacher · {user?.branchName}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Hello, {user?.name}</h1>
          <p className="text-white/80 text-sm mt-1.5">
            {classes.length ? `You teach ${classes.length} class${classes.length === 1 ? '' : 'es'} with ${totalCourses} course${totalCourses === 1 ? '' : 's'} and ${students.length} student${students.length === 1 ? '' : 's'} in your branch.` : 'Your classes will appear here once your Branch Manager assigns them.'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 border border-border rounded-lg shadow-sm hover:shadow-md transition">
              <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center mb-3"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="text-2xl sm:text-3xl font-extrabold tabular-nums">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
              <div className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{c.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">My Classes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click a class to take attendance, post results, upload materials, or announce.</p>
          </div>
        </div>
        {classes.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No classes assigned yet" desc="Your Branch Manager hasn't assigned you to any classes yet. Once assigned, they'll appear here." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls: ClassInfo, i: number) => {
              const studentCount = studentsInClass(cls);
              return (
                <motion.div key={cls.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-5 hover:shadow-lg transition cursor-pointer group border border-border rounded-lg shadow-sm" onClick={() => onOpenClass(cls)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[10px]">{cls.courses.length} course{cls.courses.length === 1 ? '' : 's'}</Badge>
                        <Badge variant="secondary" className="font-mono text-[10px]">{studentCount} student{studentCount === 1 ? '' : 's'}</Badge>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg">{cls.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cls.section ? `Section ${cls.section}` : 'Default section'}</p>
                    {cls.courses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {cls.courses.slice(0, 4).map(c => (
                          <Badge key={c.id} variant="secondary" className="text-[10px] font-normal">{c.name}</Badge>
                        ))}
                        {cls.courses.length > 4 && <Badge variant="secondary" className="text-[10px] font-normal">+{cls.courses.length - 4}</Badge>}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1.5 mt-4">
                      <QuickAction icon={CalendarCheck} label="Attendance" color="text-primary bg-accent0/10" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpenClass(cls, 'attendance'); }} />
                      <QuickAction icon={GraduationCap} label="Results" color="text-primary bg-accent0/10" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpenClass(cls, 'results'); }} />
                      <QuickAction icon={FileText} label="Material" color="text-primary bg-accent0/10" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpenClass(cls, 'materials'); }} />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium hover:scale-[1.02] transition ${color}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// ============== Standalone Mark Attendance (uses class picker) ==============
function MarkAttendance({ user, classes, students, onSaved }: any) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Derive the effective class: explicit selection OR first available class
  const effectiveClassId = selectedClassId || classes[0]?.id || '';
  const cls = classes.find((c: ClassInfo) => c.id === effectiveClassId);
  const classStudents = useMemo(() => {
    if (!cls) return [];
    return students.filter((s: any) => s.class === cls.name);
  }, [students, cls]);

  const setStatus = (id: string, status: string) => setAttendance(a => ({ ...a, [id]: status }));
  const present = classStudents.filter((s: any) => (attendance[s.id] || 'Present') === 'Present').length;
  const absent = classStudents.filter((s: any) => attendance[s.id] === 'Absent').length;
  const late = classStudents.filter((s: any) => attendance[s.id] === 'Late').length;

  const save = async () => {
    if (!cls) { toast({ title: 'Select a class', variant: 'destructive' }); return; }
    if (classStudents.length === 0) { toast({ title: 'No students to mark', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const records = classStudents.map((s: any) => ({ studentId: s.id, status: attendance[s.id] || 'Present' }));
      await api.markAttendance({
        classId: cls.id,
        branchId: user.branchId,
        class: cls.name,
        date: new Date().toISOString().slice(0, 10),
        teacherId: user.id,
        records,
      });
      toast({ title: 'Attendance saved!', description: `${present} present, ${absent} absent, ${late} late` });
      setAttendance({});
      onSaved();
    } catch (e: any) {
      const msg = e.message || 'Unknown error';
      if (msg.includes('Insufficient permissions')) {
        toast({ title: 'Permission denied', description: 'Only teachers can mark attendance.', variant: 'destructive' });
      } else if (msg.includes('Authentication required') || msg.includes('session')) {
        toast({ title: 'Session expired', description: 'Please sign out and sign in again.', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to save', description: msg, variant: 'destructive' });
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Take Attendance" subtitle={`${new Date().toLocaleDateString()}`}
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving || classStudents.length === 0} onClick={save}>{saving ? 'Saving…' : 'Save Attendance'}</Button>} />
      {classes.length === 0 ? (
        <EmptyState icon={Users} title="No classes assigned" desc="You haven't been assigned to any classes yet." />
      ) : (
        <>
          <Card className="p-4">
            <Label className="text-xs">Select Class</Label>
            <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setAttendance({}); }} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-3 text-sm">
              {classes.map((c: ClassInfo) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Card>
          {classStudents.length === 0 ? (
            <EmptyState icon={Users} title="No students in this class" desc="There are no students enrolled in this class yet." />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
                <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
                <Card className="p-4 text-center"><Clock className="h-6 w-6 text-sky-700 mx-auto mb-1" /><div className="text-2xl font-bold">{late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
              </div>
              <Card className="p-4">
                <Table>
                  <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Mark</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {classStudents.map((s: any) => {
                      const st = attendance[s.id] || 'Present';
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                          <TableCell className="font-medium text-sm">{s.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              {['Present', 'Absent', 'Late'].map(opt => (
                                <Button key={opt} size="sm" variant={st === opt ? 'default' : 'outline'}
                                  className={st === opt ? (opt === 'Present' ? 'bg-primary text-white' : opt === 'Absent' ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white') : 'h-8 px-2 text-xs'}
                                  onClick={() => setStatus(s.id, opt)}>{opt[0]}</Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ============== Standalone Post Results (uses class + course picker) ==============
function PostResults({ user, classes, students, onSaved }: any) {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [exam, setExam] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Derive effective class + course from available data
  const effectiveClassId = selectedClassId || classes[0]?.id || '';
  const cls = classes.find((c: ClassInfo) => c.id === effectiveClassId);
  const effectiveCourseId = courseId || cls?.courses[0]?.id || '';

  const calcGrade = (m: number, total: number) => {
    const p = (m / total) * 100;
    return p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B' : p >= 60 ? 'C' : p >= 50 ? 'D' : 'F';
  };

  const save = async () => {
    if (!exam.trim()) { toast({ title: 'Enter exam name', description: 'e.g. Chapter 1 Test', variant: 'destructive' }); return; }
    if (!cls) { toast({ title: 'Select a class', variant: 'destructive' }); return; }
    if (!effectiveCourseId) { toast({ title: 'Select a course', variant: 'destructive' }); return; }
    if (classStudents.length === 0) { toast({ title: 'No students', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const records = classStudents.map((s: any) => {
        const m = parseInt(marks[s.id] || '0');
        return { studentId: s.id, marks: m, grade: calcGrade(m, totalMarks) };
      });
      await api.postResults({
        classId: cls.id,
        courseId: effectiveCourseId,
        branchId: user.branchId,
        exam,
        teacherId: user.id,
        totalMarks,
        date: new Date().toISOString().slice(0, 10),
        records,
      });
      toast({ title: 'Results posted!', description: `${records.length} students · ${exam}` });
      setMarks({});
      onSaved();
    } catch (e: any) { toast({ title: 'Failed to post', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Post Results" subtitle="Enter test scores — parents get notified automatically"
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving || classStudents.length === 0 || !exam.trim()} onClick={save}>{saving ? 'Posting…' : 'Publish Results'}</Button>} />
      {classes.length === 0 ? (
        <EmptyState icon={Users} title="No classes assigned" desc="You haven't been assigned to any classes yet." />
      ) : (
        <Card className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <div><Label className="text-xs">Class</Label>
              <select value={effectiveClassId} onChange={e => { setSelectedClassId(e.target.value); setCourseId(''); setMarks({}); }} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">
                {classes.map((c: ClassInfo) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Course</Label>
              <select value={effectiveCourseId} onChange={e => setCourseId(e.target.value)} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">
                <option value="">— Select —</option>
                {cls?.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Exam Name *</Label>
              <Input value={exam} onChange={e => setExam(e.target.value)} placeholder="e.g. Chapter 1 Test" className="mt-1" />
            </div>
            <div><Label className="text-xs">Total Marks</Label><Input type="number" value={totalMarks} onChange={e => setTotalMarks(parseInt(e.target.value) || 100)} className="mt-1" /></div>
          </div>
          {classStudents.length === 0 ? (
            <EmptyState icon={Users} title="No students in this class" desc="There are no students enrolled in this class yet." />
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Marks</TableHead><TableHead className="text-right">Grade</TableHead></TableRow></TableHeader>
              <TableBody>
                {classStudents.map((s: any) => {
                  const m = parseInt(marks[s.id] || '0');
                  const grade = m > 0 ? calcGrade(m, totalMarks) : '—';
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell className="text-right"><Input type="number" value={marks[s.id] || ''} onChange={e => setMarks({ ...marks, [s.id]: e.target.value })} className="w-20 h-8 text-right ml-auto" placeholder="0" max={totalMarks} /></TableCell>
                      <TableCell className="text-right"><Badge variant="outline" className="font-bold">{grade}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}

// ============== Diary view (unchanged logic) ==============
function DiaryView({ user, diary, onSaved }: any) {
  const [form, setForm] = useState({ subject: user?.subjects?.[0] || 'Mathematics', title: '', desc: '', due: '', class: user?.classes?.[0] || '' });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const post = async () => {
    if (!form.title) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await api.postDiary({ teacherId: user.id, branchId: user.branchId, ...form });
      toast({ title: 'Diary entry posted!', description: 'Synced to student & parent apps' });
      setForm({ subject: user?.subjects?.[0] || 'Mathematics', title: '', desc: '', due: '', class: user?.classes?.[0] || '' });
      setShowForm(false);
      onSaved();
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Diary & Homework" subtitle="Post homework — synced to student & parent apps"
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(v => !v)}><Plus className="h-4 w-4 mr-1.5" /> New Entry</Button>} />
      {showForm && (
        <Card className="p-5">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Subject</Label><select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">{(user?.subjects || ['Mathematics']).map((s: string) => <option key={s}>{s}</option>)}</select></div>
              <div><Label className="text-xs">Class</Label><select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-2 text-sm">{(user?.classes || ['Grade 8']).map((c: string) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Chapter 5 — Quadratic Equations" className="mt-1" /></div>
            <div><Label className="text-xs">Description</Label><textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3} placeholder="Solve exercises 5.1 to 5.4..." className="w-full mt-1 rounded-md border border-border bg-card p-2 text-sm resize-none" /></div>
            <div><Label className="text-xs">Due date</Label><Input value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} placeholder="Tomorrow / 3 days / 2025-01-15" className="mt-1" /></div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={saving} onClick={post}>{saving ? 'Posting…' : 'Post Entry'}</Button>
          </div>
        </Card>
      )}
      {diary.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No diary entries yet" desc="Post homework and assignments. They'll appear in student and parent portals instantly."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1.5" /> New Entry</Button>} />
      ) : (
        <div className="space-y-3">
          {diary.map((d: any) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><div className="font-medium text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{d.subject} · {d.class} · {d.date}</div></div>
                <Badge variant="outline" className={d.due ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]' : 'text-muted-foreground'}>{d.due || 'No deadline'}</Badge>
              </div>
              {d.desc && <p className="text-sm text-muted-foreground mt-2">{d.desc}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherTimetable({ user }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Timetable" subtitle="Your weekly teaching schedule" />
      <EmptyState icon={Calendar} title="Timetable not published yet" desc="Your timetable will be published by your Branch Manager. Check back soon." />
    </div>
  );
}

function MyStudents({ students }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Students" subtitle={`${students.length} students in your branch`} />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" desc="Your Branch Manager hasn't added students to your branch yet." />
      ) : (
        <Card className="p-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead className="hidden sm:table-cell">Class</TableHead></TableRow></TableHeader>
            <TableBody>
              {students.map((s: any) => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">{s.rollNo}</TableCell>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="font-normal">{s.class} · {s.section}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function MessageParents({ user, students }: any) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<any[]>([]);

  useEffect(() => { api.getSms({ senderId: user.id }).then(setSent).catch(() => {}); }, [user?.id]);

  const send = async () => {
    if (!text.trim()) { toast({ title: 'Empty message', variant: 'destructive' }); return; }
    setSending(true);
    try {
      await api.sendSms({ text, recipients: students.length, type: 'Teacher Notice', senderId: user.id, instituteId: user.instituteId, branchId: user.branchId });
      toast({ title: 'SMS sent!', description: `Delivered to ${students.length} parents` });
      setText('');
      api.getSms({ senderId: user.id }).then(setSent).catch(() => {});
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Message Parents" subtitle={`Send SMS to parents of your ${students.length} students`} />
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" desc="Your Branch Manager needs to add students before you can message parents." />
      ) : (
        <>
          <Card className="p-5">
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type a message to parents…" rows={4} className="w-full rounded-md border border-border bg-card p-3 text-sm resize-none" />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{text.length} chars · {Math.ceil(text.length / 160)} SMS</span>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={sending} onClick={send}>{sending ? 'Sending…' : <><MessageSquare className="h-4 w-4 mr-1.5" /> Send to {students.length} parents</>}</Button>
            </div>
          </Card>
          {sent.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold text-base mb-3">Sent Messages</h3>
              <div className="space-y-2">
                {sent.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-lg bg-muted/40">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]">{s.status}</Badge>
                      <span className="text-[11px] text-muted-foreground">{new Date(s.sentAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{s.text}</p>
                    <div className="text-[11px] text-muted-foreground mt-1">{s.recipients} recipients · {s.type}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ============== Standalone Announcements Module ==============
function TeacherAnnouncements({ user, classes }: { user: any; classes: ClassInfo[] }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scope, setScope] = useState<'all' | 'class'>('all');
  const [classId, setClassId] = useState<string>(classes[0]?.id || '');
  const [sending, setSending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.getAnnouncements()
      .then((list: any[]) => setAnnouncements(list))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const send = async () => {
    if (!title.trim() || !message.trim()) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    if (scope === 'class' && !classId) { toast({ title: 'Select a class', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const body: any = {
        title, message,
        targetScope: scope,
        targetRole: 'student',
      };
      if (scope === 'class') body.classId = classId;
      await api.createAnnouncement(body);
      toast({ title: 'Announcement sent!', description: scope === 'all' ? 'To all your students' : `To ${classes.find(c => c.id === classId)?.name || 'class'}` });
      setTitle(''); setMessage(''); setShowForm(false);
      setReloadKey(k => k + 1);
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Announcements" subtitle="Send notices to your students"
        actions={<Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(v => !v)}><Plus className="h-4 w-4 mr-1.5" /> {showForm ? 'Cancel' : 'New Announcement'}</Button>} />

      {showForm && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-accent0/15 grid place-items-center"><Megaphone className="h-4 w-4 text-primary" /></div>
            <h3 className="font-bold text-sm">New Announcement</h3>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-muted/60 w-fit">
            <button onClick={() => setScope('all')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${scope === 'all' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>All my classes</button>
            <button onClick={() => setScope('class')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${scope === 'class' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Specific class</button>
          </div>
          {scope === 'class' && (
            <div><Label className="text-xs">Class</Label>
              <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full mt-1 h-9 rounded-md border border-border bg-card px-3 text-sm">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div><Label className="text-xs">Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tomorrow's class cancelled" className="mt-1" /></div>
          <div><Label className="text-xs">Message *</Label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Write your announcement…" className="w-full mt-1 rounded-md border border-border bg-card p-2 text-sm resize-none" /></div>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" disabled={sending} onClick={send}>
            {sending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Sending…</> : <><Megaphone className="h-4 w-4 mr-1.5" /> Send Announcement</>}
          </Button>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>
      ) : announcements.length === 0 ? (
        <EmptyState icon={Inbox} title="No announcements yet" desc="Send notices to your students. They'll appear in their portal instantly."
          action={<Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1.5" /> New Announcement</Button>} />
      ) : (
        <div className="space-y-3">
          {announcements.map(a => <AnnouncementCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
