'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CalendarCheck, GraduationCap, Calendar, ClipboardList,
  CheckCircle2, XCircle, Clock, BookOpen, Award, Inbox,
  ArrowLeft, FileText, Link2, Download, Loader2,
  Wallet, DollarSign,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Course = { id: string; name: string; code?: string };

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

export function StudentPortal({ activeModule, user }: { activeModule: string; user: any }) {
  const [attendance, setAttendance] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [diary, setDiary] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classId, setClassId] = useState<string>('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<{ course: Course; initialTab: 'materials' | 'results' | 'attendance' } | null>(null);

  const refresh = () => {
    if (user?.id) {
      api.getAttendance({ studentId: user.id }).then(setAttendance).catch(() => {});
      api.getResults({ studentId: user.id }).then(setResults).catch(() => {});
      if (user?.branchId) api.getDiary({ branchId: user.branchId }).then(setDiary).catch(() => {});
      api.getStudentCourses().then(setCourses).catch(() => setCourses([]));
      api.getAnnouncements().then(setAnnouncements).catch(() => setAnnouncements([]));
    }
  };

  // Resolve the student's classId from the branch's classes by matching user.class (class name)
  useEffect(() => {
    if (user?.branchId) {
      api.getClasses(user.branchId)
        .then((cls: any[]) => {
          const match = cls.find(c => c.name === user.class);
          setClassId(match?.id || '');
        })
        .catch(() => setClassId(''));
    }
  }, [user?.branchId, user?.class]);

  useEffect(() => { refresh(); }, [user?.id, user?.branchId]);

  if (activeModule === 'student-overview' && selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse.course}
        classId={classId}
        studentId={user?.id}
        initialTab={selectedCourse.initialTab}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  if (activeModule === 'my-attendance') return <MyAttendance attendance={attendance} />;
  if (activeModule === 'my-results') return <MyResults results={results} />;
  if (activeModule === 'my-timetable') return <MyTimetable />;
  if (activeModule === 'my-diary') return <MyDiary diary={diary} />;
  if (activeModule === 'my-announcements') return <MyAnnouncements announcements={announcements} loading={false} />;
  if (activeModule === 'my-invoices') return <MyInvoices user={user} />;
  return (
    <StudentOverview
      user={user}
      attendance={attendance}
      results={results}
      courses={courses}
      announcements={announcements}
      onOpenCourse={(course, tab) => setSelectedCourse({ course, initialTab: tab })}
    />
  );
}

function ModuleHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: any) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted/60 items-center justify-center mb-4"><Icon className="h-7 w-7 text-muted-foreground" /></div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
    </Card>
  );
}

// ============== Student Overview (course cards) ==============
function StudentOverview({ user, attendance, results, courses, announcements, onOpenCourse }: any) {
  // Normalize results — API returns a flat array, but some code expects {entries, total, avgPercentage}
  const resultsArray = Array.isArray(results) ? results : (results?.entries || []);
  const resultsTotal = resultsArray.length;
  const avgPercentage = resultsTotal > 0
    ? Math.round(resultsArray.reduce((a: number, r: any) => a + (r.percentage || (r.marks / r.totalMarks * 100) || 0), 0) / resultsTotal * 10) / 10
    : null;

  const cards = [
    { label: 'Attendance', value: attendance?.rate != null ? attendance.rate + '%' : '—', icon: CalendarCheck, color: 'from-primary to-primary/80' },
    { label: 'Avg Score', value: avgPercentage != null ? avgPercentage + '%' : '—', icon: GraduationCap, color: 'from-primary/80 to-primary' },
    { label: 'Results', value: resultsTotal, icon: Award, color: 'from-primary/80 to-primary' },
    { label: 'Courses', value: courses.length, icon: BookOpen, color: 'from-primary to-primary/80' },
  ];

  // Group recent results by subject/course so we can show "recent marks" per course card
  const recentByCourse = useMemo(() => {
    const map: Record<string, any> = {};
    // results can be a flat array (from API) or an object with .entries
    const entries = Array.isArray(results) ? results : (results?.entries || []);
    if (Array.isArray(entries)) {
      for (const r of entries) {
        const key = r.courseId || r.subject;
        if (!map[key]) map[key] = r;
      }
    }
    return map;
  }, [results]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[oklch(0.5_0.04_260)_/_0.15] blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><GraduationCap className="h-3 w-3 text-primary/70" /> Student · {user?.class} {user?.section} · Roll #{user?.rollNo}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Hi, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-white/80 text-sm mt-1.5">{user?.branchName} · {user?.instituteName}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 border border-border rounded-lg shadow-sm hover:shadow-md transition">
              <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center mb-3"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">My Courses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click a course to view materials, results, and attendance.</p>
          </div>
        </div>
        {courses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses assigned" desc="Your class doesn't have any courses assigned yet. Check back later." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c: Course, i: number) => {
              const recent = recentByCourse[c.id];
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-5 hover:shadow-lg transition cursor-pointer group border border-border rounded-lg shadow-sm" onClick={() => onOpenCourse(c, 'materials')}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      {recent && <Badge variant="outline" className="font-mono text-[10px]">{recent.marks}/{recent.totalMarks}</Badge>}
                    </div>
                    <h3 className="font-bold text-lg">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.code ? `Code: ${c.code}` : 'Course'}</p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="p-2 rounded-md bg-accent0/10">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Recent Mark</div>
                        <div className="text-sm font-bold text-primary mt-0.5">{recent ? `${recent.marks}/${recent.totalMarks}` : '—'}</div>
                      </div>
                      <div className="p-2 rounded-md bg-accent0/10">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Attendance</div>
                        <div className="text-sm font-bold text-primary mt-0.5">{attendance?.rate != null ? attendance.rate + '%' : '—'}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Materials</span>
                      <span className="text-primary font-medium group-hover:underline">Open →</span>
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

// ============== Course Detail (Materials / Results / Attendance tabs) ==============
const COURSE_TABS = [
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'results', label: 'Results', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
] as const;

function CourseDetail({ course, classId, studentId, initialTab, onBack }: {
  course: Course;
  classId: string;
  studentId: string;
  initialTab: 'materials' | 'results' | 'attendance';
  onBack: () => void;
}) {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 grid place-items-center rounded-lg border border-border hover:bg-accent transition" title="Back to courses">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{course.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{course.code ? `Code ${course.code} · ` : ''}Course materials, results & attendance</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 overflow-x-auto scroll-fancy">
        {COURSE_TABS.map(t => {
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
          {tab === 'materials' && <CourseMaterialsView classId={classId} courseId={course.id} />}
          {tab === 'results' && <CourseResultsView courseId={course.id} studentId={studentId} />}
          {tab === 'attendance' && <CourseAttendanceView studentId={studentId} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CourseMaterialsView({ classId, courseId }: { classId: string; courseId: string }) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId || !courseId) return;
    api.getCourseMaterials({ classId, courseId })
      .then(setMaterials)
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, [classId, courseId]);

  if (!classId) {
    return <EmptyState icon={FileText} title="Class not found" desc="We couldn't resolve your class. Please contact your Branch Manager." />;
  }

  if (loading) {
    return <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>;
  }

  if (materials.length === 0) {
    return <EmptyState icon={FileText} title="No materials yet" desc="Your teacher hasn't uploaded any materials for this course yet. Check back later." />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{materials.length} material{materials.length === 1 ? '' : 's'} available</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {materials.map(m => <MaterialCard key={m.id} material={m} />)}
      </div>
    </div>
  );
}

function MaterialCard({ material }: { material: MaterialItem }) {
  const [downloading, setDownloading] = useState(false);
  const isLink = !!material.linkUrl;
  const Icon = isLink ? Link2 : FileText;
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

function CourseResultsView({ courseId, studentId }: { courseId: string; studentId: string }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getResults({ studentId })
      .then((r: any) => {
        const entries = r?.entries || [];
        // Filter to this course; backend may not return courseId on student-scoped results, so include all if courseId missing
        const filtered = entries.filter((e: any) => !e.courseId || e.courseId === courseId);
        setResults(filtered.length > 0 ? filtered : entries);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [courseId, studentId]);

  if (loading) return <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>;
  if (results.length === 0) {
    return <EmptyState icon={GraduationCap} title="No results yet" desc="Your teacher hasn't posted any results for this course yet." />;
  }

  return (
    <Card className="p-5">
      <div className="space-y-3">
        {results.map((r: any, idx: number) => (
          <div key={r.id || idx} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent0/15 grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-primary" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.exam || 'Exam'}</span><span className="font-bold text-sm">{r.marks}/{r.totalMarks}</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${r.percentage || (r.totalMarks ? (r.marks / r.totalMarks) * 100 : 0)}%` }} /></div>
              <div className="text-[11px] text-muted-foreground mt-1">{r.date}</div>
            </div>
            <Badge variant="outline" className="font-bold">{r.grade}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CourseAttendanceView({ studentId }: { studentId: string }) {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAttendance({ studentId })
      .then(setAttendance)
      .catch(() => setAttendance(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>;
  if (!attendance || attendance.total === 0) {
    return <EmptyState icon={CalendarCheck} title="No attendance records" desc="Your teacher hasn't marked any attendance for you yet." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
        <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
        <Card className="p-4 text-center"><Clock className="h-6 w-6 text-sky-700 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
        <Card className="p-4 text-center bg-accent0/10"><CalendarCheck className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold text-primary">{attendance.rate}%</div><div className="text-xs text-muted-foreground">Rate</div></Card>
      </div>
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {(attendance.entries || []).map((e: any, idx: number) => (
              <TableRow key={e.id || idx}>
                <TableCell className="text-sm">{e.date}</TableCell>
                <TableCell><Badge variant="outline" className={e.status === 'Present' ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]' : e.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-sky-700 bg-sky-500/10 border-sky-500/20'}>{e.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ============== MyAttendance (existing module) ==============
function MyAttendance({ attendance }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Attendance" subtitle="Your attendance record" />
      {!attendance || attendance.total === 0 ? (
        <EmptyState icon={CalendarCheck} title="No attendance records yet" desc="Your teachers haven't marked any attendance yet. Check back after your next class." />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
            <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
            <Card className="p-4 text-center"><Clock className="h-6 w-6 text-sky-700 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
            <Card className="p-4 text-center bg-accent0/10"><CalendarCheck className="h-6 w-6 text-primary mx-auto mb-1" /><div className="text-2xl font-bold text-primary">{attendance.rate}%</div><div className="text-xs text-muted-foreground">Rate</div></Card>
          </div>
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Date</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {(attendance.entries || []).map((e: any) => (
                  <TableRow key={e.id}><TableCell className="text-sm">{e.date}</TableCell><TableCell className="text-sm">{e.class}</TableCell>
                    <TableCell><Badge variant="outline" className={e.status === 'Present' ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]' : e.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-sky-700 bg-sky-500/10 border-sky-500/20'}>{e.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

function MyResults({ results }: any) {
  const resultsArray = Array.isArray(results) ? results : (results?.entries || []);
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Results" subtitle="All your test & exam results" />
      {resultsArray.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No results posted yet" desc="Your teachers haven't posted any results yet. Check back after your next exam." />
      ) : (
        <Card className="p-5">
          <div className="space-y-3">
            {resultsArray.map((r: any) => {
              const pct = r.percentage || (r.totalMarks ? Math.round(r.marks / r.totalMarks * 1000) / 10 : 0);
              return (
              <div key={r.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent0/15 grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-primary" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.subject || r.exam}</span><span className="font-bold text-sm">{r.marks}/{r.totalMarks}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  <div className="text-[11px] text-muted-foreground mt-1">{r.exam} · {r.date}</div>
                </div>
                <Badge variant="outline" className="font-bold">{r.grade}</Badge>
              </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function MyTimetable() {
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Timetable" subtitle="Your weekly class schedule" />
      <EmptyState icon={Calendar} title="Timetable not published yet" desc="Your timetable will be published by your Branch Manager." />
    </div>
  );
}

function MyDiary({ diary }: any) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Diary & Homework" subtitle="Assignments from your teachers" />
      {diary.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No diary entries yet" desc="Your teachers haven't posted any homework or assignments yet." />
      ) : (
        <div className="space-y-3">
          {diary.map((d: any) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><div className="font-medium text-sm">{d.title}</div><div className="text-[11px] text-muted-foreground">{d.subject} · {d.class} · {d.date}</div></div>
                <Badge variant="outline" className={d.due ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.2]' : 'text-muted-foreground'}>{d.due || 'No deadline'}</Badge>
              </div>
              {d.desc && <p className="text-sm text-muted-foreground">{d.desc}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MyAnnouncements({ announcements, loading }: { announcements: Announcement[]; loading: boolean }) {
  return (
    <div className="space-y-6">
      <ModuleHeader title="Announcements" subtitle="Notices from your teachers, branch & institute" />
      {loading ? (
        <Card className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></Card>
      ) : announcements.length === 0 ? (
        <EmptyState icon={Inbox} title="No announcements" desc="You're all caught up! New announcements will appear here." />
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

// ============== My Invoices (with PDF challan) ==============
const fmtPKR = (n: number) => 'Rs. ' + (Number(n) || 0).toLocaleString('en-PK');

// Generate the challan HTML (used by the html2pdf renderer + the fallback print path)
function buildChallanHTML(challan: any, instituteName?: string): string {
  const amount = Number(challan.amount || 0);
  const status = String(challan.status || 'unpaid').toLowerCase();
  const isPaid = status === 'paid';
  const today = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  const escape = (v: any) => String(v ?? '—').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
  const institute = instituteName?.trim() || challan.instituteName?.trim() || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Fee Challan ${escape(challan.challanNo || '')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; background: #ffffff; color: #1f2937; }
  .challan { max-width: 720px; margin: 0 auto; background: #fff; border: 2px solid #1e3a5f; border-radius: 14px; padding: 36px; box-shadow: 0 12px 40px rgba(0,0,0,0.06); }
  .header { text-align: center; border-bottom: 2px dashed #b6c5d8; padding-bottom: 18px; margin-bottom: 22px; }
  .institute { font-size: 20px; font-weight: 800; color: #0f1e3a; letter-spacing: 0.3px; }
  .brand { font-size: 11px; letter-spacing: 3px; color: #1e3a5f; font-weight: 700; margin-top: 6px; }
  .title { font-size: 26px; font-weight: 800; margin-top: 8px; color: #0f1e3a; letter-spacing: 0.5px; }
  .sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; margin: 8px 0 18px; }
  .field { display: flex; flex-direction: column; }
  .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
  .value { font-size: 14px; font-weight: 600; color: #111827; }
  .amount-row { display: flex; justify-content: space-between; align-items: center; background: #eef2f8; border: 1px solid #b6c5d8; border-radius: 10px; padding: 16px 22px; margin: 18px 0; }
  .amount-label { font-size: 12px; color: #1e3a5f; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .amount-value { font-size: 22px; font-weight: 800; color: #0f1e3a; }
  .status-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
  .status { display: inline-block; padding: 4px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .status-paid { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
  .status-unpaid { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .signature { margin-top: 64px; padding-top: 14px; border-top: 2px dashed #9ca3af; display: flex; justify-content: space-between; gap: 24px; }
  .sig-label { font-size: 12px; color: #6b7280; padding-top: 6px; }
  .footer { text-align: center; margin-top: 22px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; letter-spacing: 0.3px; font-weight: 600; }
  .footer-brand { color: #1e3a5f; font-weight: 800; }
  @media print {
    body { padding: 0; background: #fff; }
    .challan { box-shadow: none; border: 2px solid #1e3a5f; }
  }
</style>
</head>
<body>
  <div class="challan">
    <div class="header">
      ${institute ? `<div class="institute">${escape(institute)}</div>` : ''}
      <div class="brand">ESM — ELECTRONIC SCHOOL MANAGEMENT</div>
      <div class="title">FEE CHALLAN</div>
      <div class="sub">Cyber Advance Solutions (Pvt.) Ltd. · Pakistan's No. 1 School Management System</div>
    </div>
    <div class="grid">
      <div class="field"><span class="label">Challan No.</span><span class="value">${escape(challan.challanNo || '—')}</span></div>
      <div class="field"><span class="label">Date</span><span class="value">${today}</span></div>
      <div class="field"><span class="label">Student Name</span><span class="value">${escape(challan.studentName || challan.student || '—')}</span></div>
      <div class="field"><span class="label">Class</span><span class="value">${escape(challan.className || challan.class || '—')}</span></div>
      <div class="field"><span class="label">Roll No.</span><span class="value">${escape(challan.rollNo || '—')}</span></div>
      <div class="field"><span class="label">Month / Year</span><span class="value">${escape(challan.month || '—')}${challan.year ? ' ' + escape(challan.year) : ''}</span></div>
    </div>
    <div class="amount-row">
      <span class="amount-label">Amount Payable</span>
      <span class="amount-value">Rs. ${amount.toLocaleString('en-PK')}</span>
    </div>
    <div class="status-row">
      <span class="label" style="margin:0">Status</span>
      <span class="status ${isPaid ? 'status-paid' : 'status-unpaid'}">${status.toUpperCase()}</span>
      ${challan.paidDate ? `<span class="value" style="font-size:12px;color:#374151;">Paid on ${escape(challan.paidDate)}</span>` : ''}
      ${challan.paymentMethod ? `<span class="value" style="font-size:12px;color:#374151;">via ${escape(challan.paymentMethod)}</span>` : ''}
    </div>
    <div class="signature">
      <div><div class="sig-label">Student / Parent Signature</div></div>
      <div><div class="sig-label">Authorized Signature</div></div>
    </div>
    <div class="footer">Powered by <span class="footer-brand">ESM — Electronic School Management</span></div>
  </div>
</body>
</html>`;
}

// Fallback: print the challan via a hidden iframe (only used if html2pdf fails).
function printChallanInIframe(html: string) {
  let iframe = document.getElementById('esm-challan-frame') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'esm-challan-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('title', 'ESM challan print frame');
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    toast({ title: 'Print unavailable', description: 'Your browser blocked the print frame.', variant: 'destructive' });
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const win = iframe.contentWindow;
  setTimeout(() => {
    try { win?.focus(); win?.print(); }
    catch {
      toast({ title: 'Print failed', description: 'Please allow popups / printing for this site.', variant: 'destructive' });
    }
  }, 300);
}

// Generate an actual PDF file using html2pdf.js (no print dialog).
// Falls back to the iframe print path if the library fails to load or render.
async function downloadChallanPDF(challan: any, instituteName?: string): Promise<{ via: 'pdf' | 'print' }> {
  const html = buildChallanHTML(challan, instituteName);
  const challanNo = String(challan.challanNo || challan.id?.slice?.(-8) || 'challan').replace(/[^A-Za-z0-9_-]/g, '_');

  // Build a temporary off-screen container so html2canvas can render the styled challan.
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '760px';
  container.style.background = '#ffffff';
  container.innerHTML = html;
  // Strip the surrounding <html>/<head>/<body> tags — we only need the inner content
  // so the PDF renders just the challan card, not the full document chrome.
  const challanEl = container.querySelector('.challan') as HTMLElement | null;
  const renderEl: HTMLElement = challanEl || container;
  document.body.appendChild(container);

  try {
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `Challan-${challanNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['css', 'legacy'] as const },
    };
    await html2pdf().set(opt).from(renderEl).save();
    return { via: 'pdf' };
  } catch (err: any) {
    // Fall back to the browser print dialog (Save as PDF) if html2pdf fails
    printChallanInIframe(html);
    return { via: 'print' };
  } finally {
    try { document.body.removeChild(container); } catch {}
  }
}

function MyInvoices({ user }: { user: any }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    api.getFeeInvoices()
      .then(r => setInvoices(Array.isArray(r) ? r : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user?.id]);

  const stats = useMemo(() => {
    const total = invoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const paid = invoices.filter(i => String(i.status).toLowerCase() === 'paid').reduce((acc, i) => acc + (Number(i.paidAmount || i.amount) || 0), 0);
    const pending = total - paid;
    return { total, paid, pending, count: invoices.length, paidCount: invoices.filter(i => String(i.status).toLowerCase() === 'paid').length };
  }, [invoices]);

  const downloadChallan = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      const challan = await api.getChallanData(inv.id);
      // Merge with invoice data as a fallback so the PDF is complete even if the challan endpoint returns a partial payload
      const merged = { ...inv, ...challan };
      const result = await downloadChallanPDF(merged, user?.instituteName);
      if (result.via === 'pdf') {
        toast({ title: 'Challan downloaded', description: `Challan-${merged.challanNo || inv.id?.slice(-8)}.pdf saved to your downloads.` });
      } else {
        toast({ title: 'Preparing challan', description: 'PDF generation unavailable — use the print dialog to save it as a PDF.' });
      }
    } catch {
      // Fallback: generate PDF using the invoice data we already have
      try {
        const result = await downloadChallanPDF(inv, user?.instituteName);
        if (result.via === 'pdf') {
          toast({ title: 'Challan downloaded', description: `Challan-${inv.challanNo || inv.id?.slice(-8)}.pdf saved to your downloads.` });
        } else {
          toast({ title: 'Using local invoice data', description: 'Could not fetch full challan details — using invoice summary instead.' });
        }
      } catch {
        toast({ title: 'Failed', description: 'Could not generate the challan PDF. Please try again.', variant: 'destructive' });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const cards = [
    { label: 'Total Paid', value: fmtPKR(stats.paid), icon: CheckCircle2, color: 'from-primary to-primary/80', sub: `${stats.paidCount} invoice${stats.paidCount === 1 ? '' : 's'}` },
    { label: 'Total Pending', value: fmtPKR(stats.pending), icon: Clock, color: 'from-rose-500 to-rose-700', sub: `${stats.count - stats.paidCount} invoice${stats.count - stats.paidCount === 1 ? '' : 's'}` },
    { label: 'Total Amount', value: fmtPKR(stats.total), icon: Wallet, color: 'from-primary/80 to-primary', sub: `${stats.count} invoice${stats.count === 1 ? '' : 's'}` },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader title="My Invoices" subtitle="View your monthly fee invoices and download challan PDFs" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 border border-border rounded-lg shadow-sm hover:shadow-md transition">
              <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center mb-3"><c.icon className="h-5 w-5 text-primary" /></div>
              <div className="text-2xl font-extrabold font-display">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label} · {c.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-base">Invoice History</h3>
          </div>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading invoices…
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState icon={DollarSign} title="No invoices yet" desc="Your monthly fee invoices will appear here once your Branch Manager generates them." />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto scroll-fancy -mx-4 px-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40 sticky top-0">
                <TableHead>Month</TableHead>
                <TableHead className="hidden sm:table-cell">Year</TableHead>
                <TableHead className="hidden md:table-cell">Challan No.</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {invoices.map(inv => {
                  const isPaid = String(inv.status).toLowerCase() === 'paid';
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{inv.month || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{inv.year || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{inv.challanNo || inv.id?.slice(-8)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{fmtPKR(Number(inv.amount) || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isPaid ? 'text-primary bg-accent0/10 border-[oklch(0.5_0.04_260)_/_0.3]' : 'text-rose-700 bg-rose-500/10 border-rose-500/30'}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                        {isPaid && inv.paidDate && <div className="text-[10px] text-muted-foreground mt-0.5">{inv.paidDate}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="h-8 text-xs border-[oklch(0.5_0.04_260)_/_0.4] text-primary hover:bg-accent0/10" disabled={downloadingId === inv.id} onClick={() => downloadChallan(inv)}>
                          {downloadingId === inv.id ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Preparing…</> : <><Download className="h-3 w-3 mr-1" /> Download Challan</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-4 bg-accent dark:bg-[oklch(0.12_0.03_260)_/_0.3] border-accent dark:border-[oklch(0.2_0.04_260)]">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent0/20 grid place-items-center shrink-0"><Download className="h-4 w-4 text-primary dark:text-[oklch(0.6_0.04_260)]" /></div>
          <div>
            <div className="font-bold text-sm text-primary dark:text-[oklch(0.8_0.03_260)]">Download your challan PDF</div>
            <p className="text-xs text-primary dark:text-primary/70 mt-1 leading-relaxed">
              Click <b>Download Challan</b> on any invoice and a real PDF file is generated and saved directly to your
              downloads folder — no print dialog, no extra steps. The challan includes the institute name, fee details,
              status, and a <b>"Powered by ESM"</b> footer.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
