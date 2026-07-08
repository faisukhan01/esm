// eSM API client — talks to the Express backend via the gateway.
// The gateway requires the target port in the ?XTransformPort query param.
const API_PORT = 3001;

function apiUrl(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  return `/api/${path.replace(/^\//, '')}${sep}XTransformPort=${API_PORT}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

export type Stats = {
  totalStudents: number; totalStaff: number; attendanceToday: number;
  feeCollected: number; feePending: number; feeOverdue: number;
  activeInquiries: number; openComplaints: number; booksIssued: number;
  libraryBooks: number; vehicles: number; routes: number; eventsUpcoming: number;
  avgGPA: number; enrollmentTrend: string; revenueTrend: string;
};

export type Student = {
  id: string; name: string; rollNo: string; class: string; section: string;
  gender: string; guardian: string; phone: string; email: string; city: string;
  feeStatus: string; feeAmount: number; feePaid: number; gpa: number;
  attendance: number; enrolledOn: string; status: string; avatarColor: string;
};

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: string; name: string; email: string; role: string; campus: string } }>(
      'auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  stats: () => request<Stats>('stats'),
  students: (q?: string) => request<{ total: number; students: Student[] }>(q ? `students?q=${encodeURIComponent(q)}` : 'students'),
  attendanceSeries: () => request<{ date: string; present: number; absent: number; late: number; rate: number }[]>('attendance/series'),
  feeMonthly: () => request<{ month: string; collected: number; pending: number; overdue: number }[]>('fees/monthly'),
  feeDefaulters: () => request<Student[]>('fees/defaulters'),
  resultsSubjects: () => request<{ subject: string; avgScore: number; highest: number; lowest: number; passRate: number; students: number }[]>('results/subjects'),
  resultsCards: () => request<{ id: string; studentId: string; studentName: string; class: string; exam: string; totalMarks: number; obtained: number; percentage: number; grade: string; rank: number }[]>('results/cards'),
  smsLog: () => request<any[]>('sms/log'),
  smsSend: (text: string, recipients: number, type: string) =>
    request('sms/send', { method: 'POST', body: JSON.stringify({ text, recipients, type }) }),
  staff: () => request<any[]>('staff'),
  library: () => request<any[]>('library/books'),
  routes: () => request<any[]>('transport/routes'),
  events: () => request<any[]>('events'),
  finance: () => request<any[]>('finance/transactions'),
  inquiries: () => request<any[]>('inquiries'),
  complaints: () => request<any[]>('complaints'),
  timetable: () => request<any[]>('academics/timetable'),
};
