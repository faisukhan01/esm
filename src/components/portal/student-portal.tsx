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
  ArrowLeft, FileText, Link2, Download, Loader2, Megaphone,
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
      <div><h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground mt-1">{subtitle}</p></div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: any) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted/60 items-center justify-center mb-4"><Icon className="h-7 w-7 text-muted-foreground" /></div>
      <h3 className="font-display font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{desc}</p>
    </Card>
  );
}

// ============== Student Overview (course cards) ==============
function StudentOverview({ user, attendance, results, courses, announcements, onOpenCourse }: any) {
  const cards = [
    { label: 'Attendance', value: attendance?.rate != null ? attendance.rate + '%' : '—', icon: CalendarCheck, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Avg Score', value: results?.avgPercentage != null ? results.avgPercentage + '%' : '—', icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
    { label: 'Results', value: results?.total ?? 0, icon: Award, color: 'from-amber-500 to-yellow-600' },
    { label: 'Courses', value: courses.length, icon: BookOpen, color: 'from-teal-500 to-cyan-600' },
  ];

  // Group recent results by subject/course so we can show "recent marks" per course card
  const recentByCourse = useMemo(() => {
    const map: Record<string, any> = {};
    if (results?.entries) {
      for (const r of results.entries) {
        const key = r.courseId || r.subject;
        if (!map[key]) map[key] = r;
      }
    }
    return map;
  }, [results]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-700 to-cyan-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-25" />
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] mb-3 border border-white/15"><GraduationCap className="h-3 w-3 text-amber-300" /> Student · {user?.class} {user?.section} · Roll #{user?.rollNo}</div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">Hi, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-cyan-50/80 text-sm mt-1.5">{user?.branchName} · {user?.instituteName}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-5 relative overflow-hidden">
              <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl`} />
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center shadow-md mb-3`}><c.icon className="h-5 w-5 text-white" /></div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {announcements.length > 0 && (
        <Card className="p-5">
          <h3 className="font-bold text-base mb-3 flex items-center gap-2"><Megaphone className="h-4 w-4 text-rose-500" /> Latest Announcement</h3>
          <AnnouncementCard a={announcements[0]} />
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-bold">My Courses</h2>
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
                  <Card className="p-5 hover:shadow-lg transition cursor-pointer group relative overflow-hidden" onClick={() => onOpenCourse(c, 'materials')}>
                    <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 opacity-10 blur-2xl group-hover:opacity-20 transition" />
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 grid place-items-center shadow-md">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      {recent && <Badge variant="outline" className="font-mono text-[10px]">{recent.marks}/{recent.totalMarks}</Badge>}
                    </div>
                    <h3 className="font-display font-bold text-lg">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.code ? `Code: ${c.code}` : 'Course'}</p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="p-2 rounded-md bg-violet-500/10">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Recent Mark</div>
                        <div className="text-sm font-bold text-violet-700 mt-0.5">{recent ? `${recent.marks}/${recent.totalMarks}` : '—'}</div>
                      </div>
                      <div className="p-2 rounded-md bg-emerald-500/10">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Attendance</div>
                        <div className="text-sm font-bold text-emerald-700 mt-0.5">{attendance?.rate != null ? attendance.rate + '%' : '—'}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Materials</span>
                      <span className="text-cyan-700 font-medium group-hover:underline">Open →</span>
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
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{course.name}</h1>
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
        <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${isLink ? 'bg-cyan-500/15' : 'bg-violet-500/15'}`}>
          <Icon className={`h-5 w-5 ${isLink ? 'text-cyan-600' : 'text-violet-600'}`} />
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
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-emerald-600" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.exam || 'Exam'}</span><span className="font-bold text-sm">{r.marks}/{r.totalMarks}</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${r.percentage || (r.totalMarks ? (r.marks / r.totalMarks) * 100 : 0)}%` }} /></div>
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
        <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
        <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
        <Card className="p-4 text-center"><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
        <Card className="p-4 text-center bg-emerald-500/10"><CalendarCheck className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold text-emerald-600">{attendance.rate}%</div><div className="text-xs text-muted-foreground">Rate</div></Card>
      </div>
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {(attendance.entries || []).map((e: any, idx: number) => (
              <TableRow key={e.id || idx}>
                <TableCell className="text-sm">{e.date}</TableCell>
                <TableCell><Badge variant="outline" className={e.status === 'Present' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : e.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{e.status}</Badge></TableCell>
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
            <Card className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.present}</div><div className="text-xs text-muted-foreground">Present</div></Card>
            <Card className="p-4 text-center"><XCircle className="h-6 w-6 text-rose-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.absent}</div><div className="text-xs text-muted-foreground">Absent</div></Card>
            <Card className="p-4 text-center"><Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" /><div className="text-2xl font-bold">{attendance.late}</div><div className="text-xs text-muted-foreground">Late</div></Card>
            <Card className="p-4 text-center bg-emerald-500/10"><CalendarCheck className="h-6 w-6 text-emerald-600 mx-auto mb-1" /><div className="text-2xl font-bold text-emerald-600">{attendance.rate}%</div><div className="text-xs text-muted-foreground">Rate</div></Card>
          </div>
          <Card className="p-4">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>Date</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {(attendance.entries || []).map((e: any) => (
                  <TableRow key={e.id}><TableCell className="text-sm">{e.date}</TableCell><TableCell className="text-sm">{e.class}</TableCell>
                    <TableCell><Badge variant="outline" className={e.status === 'Present' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : e.status === 'Absent' ? 'text-rose-600 bg-rose-500/10 border-rose-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}>{e.status}</Badge></TableCell>
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
  return (
    <div className="space-y-6">
      <ModuleHeader title="My Results" subtitle="All your test & exam results" />
      {!results || results.total === 0 ? (
        <EmptyState icon={GraduationCap} title="No results posted yet" desc="Your teachers haven't posted any results yet. Check back after your next exam." />
      ) : (
        <Card className="p-5">
          <div className="space-y-3">
            {(results.entries || []).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/15 grid place-items-center shrink-0"><BookOpen className="h-4 w-4 text-emerald-600" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{r.subject}</span><span className="font-bold text-sm">{r.marks}/{r.totalMarks}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${r.percentage}%` }} /></div>
                  <div className="text-[11px] text-muted-foreground mt-1">{r.exam} · {r.date}</div>
                </div>
                <Badge variant="outline" className="font-bold">{r.grade}</Badge>
              </div>
            ))}
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
                <Badge variant="outline" className={d.due ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' : 'text-muted-foreground'}>{d.due || 'No deadline'}</Badge>
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
