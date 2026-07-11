// eSM API client — talks to the Express backend via the gateway.
const API_PORT = 3001;

function apiUrl(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  return `/api/${path.replace(/^\//, '')}${sep}XTransformPort=${API_PORT}`;
}

// Get the stored auth token (from zustand persist)
function getToken(): string | null {
  try {
    const raw = localStorage.getItem('esm-app');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token || null;
    }
  } catch {}
  return null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  // platform
  platformOverview: () => request<any>('platform/overview'),
  institutes: () => request<any[]>('institutes'),
  institute: (id: string) => request<any>(`institutes/${id}`),
  createInstitute: (body: any) => request<any>('institutes', { method: 'POST', body: JSON.stringify(body) }),
  updateInstitute: (id: string, body: any) => request<any>(`institutes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  branches: (instituteId?: string) => request<any[]>(instituteId ? `branches?instituteId=${instituteId}` : 'branches'),
  createBranch: (body: any) => request<any>('branches', { method: 'POST', body: JSON.stringify(body) }),
  platformUsers: (params?: { role?: string; branchId?: string; instituteId?: string }) => {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.branchId) q.set('branchId', params.branchId);
    if (params?.instituteId) q.set('instituteId', params.instituteId);
    const qs = q.toString();
    return request<any[]>(qs ? `platform/users?${qs}` : 'platform/users');
  },
  createPlatformUser: (body: any) => request<any>('platform/users', { method: 'POST', body: JSON.stringify(body) }),
  scopedStats: (instituteId?: string, branchId?: string) => {
    const q = new URLSearchParams();
    if (instituteId) q.set('instituteId', instituteId);
    if (branchId) q.set('branchId', branchId);
    const qs = q.toString();
    return request<any>(qs ? `scoped/stats?${qs}` : 'scoped/stats');
  },
  // attendance
  getAttendance: (params?: { studentId?: string; branchId?: string; teacherId?: string }) => {
    const q = new URLSearchParams();
    if (params?.studentId) q.set('studentId', params.studentId);
    if (params?.branchId) q.set('branchId', params.branchId);
    if (params?.teacherId) q.set('teacherId', params.teacherId);
    return request<any>(q.toString() ? `attendance?${q.toString()}` : 'attendance');
  },
  markAttendance: (body: any) => request<any>('attendance', { method: 'POST', body: JSON.stringify(body) }),
  // results
  getResults: (params?: { studentId?: string; branchId?: string; teacherId?: string }) => {
    const q = new URLSearchParams();
    if (params?.studentId) q.set('studentId', params.studentId);
    if (params?.branchId) q.set('branchId', params.branchId);
    if (params?.teacherId) q.set('teacherId', params.teacherId);
    return request<any>(q.toString() ? `results?${q.toString()}` : 'results');
  },
  postResults: (body: any) => request<any>('results', { method: 'POST', body: JSON.stringify(body) }),
  // fees
  getFees: (params?: { studentId?: string; branchId?: string; instituteId?: string }) => {
    const q = new URLSearchParams();
    if (params?.studentId) q.set('studentId', params.studentId);
    if (params?.branchId) q.set('branchId', params.branchId);
    if (params?.instituteId) q.set('instituteId', params.instituteId);
    return request<any[]>(q.toString() ? `fees?${q.toString()}` : 'fees');
  },
  payFee: (body: any) => request<any>('fees', { method: 'POST', body: JSON.stringify(body) }),
  // sms
  getSms: (params?: { senderId?: string; instituteId?: string; branchId?: string }) => {
    const q = new URLSearchParams();
    if (params?.senderId) q.set('senderId', params.senderId);
    if (params?.instituteId) q.set('instituteId', params.instituteId);
    if (params?.branchId) q.set('branchId', params.branchId);
    return request<any[]>(q.toString() ? `sms?${q.toString()}` : 'sms');
  },
  sendSms: (body: any) => request<any>('sms/send', { method: 'POST', body: JSON.stringify(body) }),
  // diary
  getDiary: (params?: { teacherId?: string; branchId?: string; class?: string }) => {
    const q = new URLSearchParams();
    if (params?.teacherId) q.set('teacherId', params.teacherId);
    if (params?.branchId) q.set('branchId', params.branchId);
    if (params?.class) q.set('class', params.class);
    return request<any[]>(q.toString() ? `diary?${q.toString()}` : 'diary');
  },
  postDiary: (body: any) => request<any>('diary', { method: 'POST', body: JSON.stringify(body) }),
  // complaints
  getComplaints: (params?: { parentId?: string; instituteId?: string; branchId?: string }) => {
    const q = new URLSearchParams();
    if (params?.parentId) q.set('parentId', params.parentId);
    if (params?.instituteId) q.set('instituteId', params.instituteId);
    if (params?.branchId) q.set('branchId', params.branchId);
    return request<any[]>(q.toString() ? `complaints?${q.toString()}` : 'complaints');
  },
  createComplaint: (body: any) => request<any>('complaints', { method: 'POST', body: JSON.stringify(body) }),
  // events
  getEvents: (params?: { instituteId?: string; branchId?: string }) => {
    const q = new URLSearchParams();
    if (params?.instituteId) q.set('instituteId', params.instituteId);
    if (params?.branchId) q.set('branchId', params.branchId);
    return request<any[]>(q.toString() ? `events?${q.toString()}` : 'events');
  },
  createEvent: (body: any) => request<any>('events', { method: 'POST', body: JSON.stringify(body) }),
  // library
  getBooks: (branchId?: string) => request<any[]>(branchId ? `library/books?branchId=${branchId}` : 'library/books'),
  addBook: (body: any) => request<any>('library/books', { method: 'POST', body: JSON.stringify(body) }),
  // transport
  getRoutes: (branchId?: string) => request<any[]>(branchId ? `transport/routes?branchId=${branchId}` : 'transport/routes'),
  addRoute: (body: any) => request<any>('transport/routes', { method: 'POST', body: JSON.stringify(body) }),
  // reference
  reference: () => request<{ classes: string[]; sections: string[]; subjects: string[] }>('reference'),
};
