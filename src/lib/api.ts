// eSM API client — talks to the Express backend via the gateway.
const API_PORT = 3001;

function apiUrl(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  return `/api/${path.replace(/^\//, '')}${sep}XTransformPort=${API_PORT}`;
}

// Get the stored auth token (from zustand persist — uses sessionStorage for per-tab sessions)
function getToken(): string | null {
  try {
    const raw = sessionStorage.getItem('esm-app');
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
    // Try to parse the error as JSON and extract the message
    try {
      const parsed = JSON.parse(txt);
      throw new Error(parsed.error || parsed.message || `Request failed (${res.status})`);
    } catch (parseErr) {
      // If it's not JSON, check if the error is already parsed
      if (parseErr instanceof Error && parseErr.message !== txt) {
        throw parseErr; // Re-throw the parsed error
      }
      throw new Error(txt || `Request failed (${res.status})`);
    }
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string, name?: string) =>
    request<{ token: string; user: any; mustChangePassword?: boolean }>('auth/login', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<any>('auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  // platform
  platformOverview: () => request<any>('platform/overview'),
  institutes: () => request<any[]>('institutes'),
  institute: (id: string) => request<any>(`institutes/${id}`),
  createInstitute: (body: any) => request<any>('institutes', { method: 'POST', body: JSON.stringify(body) }),
  updateInstitute: (id: string, body: any) => request<any>(`institutes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  editInstitute: (id: string, body: any) => request<any>(`institutes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  blockInstitute: (id: string, blocked: boolean, reason?: string) =>
    request<any>(`institutes/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked, reason }) }),
  branches: (instituteId?: string) => request<any[]>(instituteId ? `branches?instituteId=${instituteId}` : 'branches'),
  createBranch: (body: any) => request<any>('branches', { method: 'POST', body: JSON.stringify(body) }),
  blockBranch: (id: string, blocked: boolean, reason?: string) =>
    request<any>(`branches/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked, reason }) }),
  platformUsers: (params?: { role?: string; branchId?: string; instituteId?: string }) => {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.branchId) q.set('branchId', params.branchId);
    if (params?.instituteId) q.set('instituteId', params.instituteId);
    const qs = q.toString();
    return request<any[]>(qs ? `platform/users?${qs}` : 'platform/users');
  },
  createPlatformUser: (body: any) => request<any>('platform/users', { method: 'POST', body: JSON.stringify(body) }),
  editUser: (id: string, body: any) => request<any>(`platform/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  blockUser: (id: string, blocked: boolean, reason?: string) =>
    request<any>(`platform/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked, reason }) }),
  getUserPassword: (id: string) => request<any>(`platform/users/${id}/password`),
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
  // classes & courses
  getClasses: (branchId?: string) => request<any[]>(branchId ? `classes?branchId=${branchId}` : 'classes'),
  getCourses: (params?: { branchId?: string; classId?: string }) => {
    const q = new URLSearchParams();
    if (params?.branchId) q.set('branchId', params.branchId);
    if (params?.classId) q.set('classId', params.classId);
    return request<any[]>(q.toString() ? `courses?${q.toString()}` : 'courses');
  },
  createCourse: (body: any) => request<any>('courses', { method: 'POST', body: JSON.stringify(body) }),
  createClassCourse: (classId: string, courseId: string) =>
    request<any>('class-courses', { method: 'POST', body: JSON.stringify({ classId, courseId }) }),
  assignClassCourses: (classId: string, courseIds: string[]) =>
    request<any>(`classes/${classId}/courses`, { method: 'POST', body: JSON.stringify({ courseIds }) }),
  // Create a new section (e.g. Class 1B) inside an existing class. Inherits the parent's course assignments.
  createClassSection: (classId: string, section?: string) =>
    request<any>(`classes/${classId}/sections`, { method: 'POST', body: JSON.stringify({ section }) }),
  // Delete a section (only allowed when it has no students assigned and is not the only section for that class)
  deleteClassSection: (classId: string) =>
    request<any>(`classes/${classId}`, { method: 'DELETE' }),
  // teacher & student scoped
  getTeacherClasses: () => request<any[]>('teacher/classes'),
  getStudentCourses: () => request<any[]>('student/courses'),
  // announcements
  getAnnouncements: () => request<any[]>('announcements'),
  createAnnouncement: (body: any) => request<any>('announcements', { method: 'POST', body: JSON.stringify(body) }),
  // course materials
  getCourseMaterials: (params?: { classId?: string; courseId?: string; teacherId?: string }) => {
    const q = new URLSearchParams();
    if (params?.classId) q.set('classId', params.classId);
    if (params?.courseId) q.set('courseId', params.courseId);
    if (params?.teacherId) q.set('teacherId', params.teacherId);
    return request<any[]>(q.toString() ? `course-materials?${q.toString()}` : 'course-materials');
  },
  addCourseMaterial: (body: any) => request<any>('course-materials', { method: 'POST', body: JSON.stringify(body) }),
  downloadMaterial: (id: string) => apiUrl(`course-materials/${id}/download`),
  /** Downloads a material file with auth headers; returns { blob, fileName } for files or { linkUrl } for link-type materials. */
  downloadMaterialBlob: async (id: string): Promise<{ blob: Blob; fileName: string } | { linkUrl: string }> => {
    const token = getToken();
    const res = await fetch(apiUrl(`course-materials/${id}/download`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const json = await res.json();
      if (json?.linkUrl) return { linkUrl: json.linkUrl as string };
      throw new Error('No file or link available');
    }
    const cd = res.headers.get('content-disposition') || '';
    const m = cd.match(/filename="([^"]+)"/);
    const fileName = m ? m[1] : 'download';
    const blob = await res.blob();
    return { blob, fileName };
  },
};
