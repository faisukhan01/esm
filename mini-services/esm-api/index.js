import express from 'express';
import cors from 'cors';
import { data, stats, institutes, branches, platformUsers, demoAccounts } from './data.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

const ROLE_LABELS = {
  'super-admin': 'Super Admin',
  'institute-admin': 'Institute Admin',
  'branch-manager': 'Branch Manager',
  'teacher': 'Teacher',
  'student': 'Student',
  'parent': 'Parent',
};

// Helper: build the full user profile (resolve institute/branch names)
function buildUserProfile(u) {
  const inst = institutes.find(i => i.id === u.instituteId);
  const br = branches.find(b => b.id === u.branchId);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    roleLabel: ROLE_LABELS[u.role] || u.role,
    title: u.title || '',
    status: u.status,
    avatar: null,
    instituteId: u.instituteId || null,
    instituteName: inst?.name || null,
    instituteShort: inst?.short || null,
    branchId: u.branchId || null,
    branchName: br?.name || null,
    campus: br ? `${br.name}` : (inst ? inst.name : 'eSM Platform'),
    // role-specific extras
    ...(u.subjects ? { subjects: u.subjects } : {}),
    ...(u.classes ? { classes: u.classes } : {}),
    ...(u.class ? { class: u.class, section: u.section, rollNo: u.rollNo, guardian: u.guardian } : {}),
    ...(u.ward ? { ward: u.ward, wardId: u.wardId } : {}),
  };
}

// --- Auth (multi-tenant, role-aware) ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const u = platformUsers.find(
    p => p.email.toLowerCase() === String(email).toLowerCase() && p.password === password
  );
  if (!u) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (u.status !== 'Active') {
    return res.status(403).json({ error: 'Account is ' + u.status + '. Contact your administrator.' });
  }
  res.json({
    token: 'esm-jwt-' + Buffer.from(u.id + ':' + u.role).toString('base64'),
    user: buildUserProfile(u),
  });
});

// Demo accounts for the login screen quick-fill
app.get('/api/auth/demo-accounts', (req, res) => {
  res.json(demoAccounts);
});

// --- Platform overview (super-admin) ---
app.get('/api/platform/overview', (req, res) => {
  const totalRevenue = institutes.reduce((a, i) => a + i.revenue, 0);
  const totalStudents = institutes.reduce((a, i) => a + i.students, 0);
  const totalStaff = institutes.reduce((a, i) => a + i.staff, 0);
  res.json({
    institutes: institutes.length,
    branches: branches.length,
    totalStudents,
    totalStaff,
    totalRevenue,
    activeInstitutes: institutes.filter(i => i.status === 'Active').length,
    trialInstitutes: institutes.filter(i => i.status === 'Trial').length,
    platformUsers: platformUsers.length,
    mrr: Math.round(totalRevenue / 12),
    growth: '+14.2%',
  });
});

// --- Institutes (super-admin CRUD) ---
app.get('/api/institutes', (req, res) => {
  res.json(institutes);
});

app.get('/api/institutes/:id', (req, res) => {
  const inst = institutes.find(i => i.id === req.params.id);
  if (!inst) return res.status(404).json({ error: 'Institute not found' });
  const instBranches = branches.filter(b => b.instituteId === inst.id);
  const instUsers = platformUsers.filter(u => u.instituteId === inst.id);
  res.json({
    ...inst,
    branchList: instBranches,
    users: instUsers.map(buildUserProfile),
  });
});

app.post('/api/institutes', (req, res) => {
  const { name, city, country, plan, adminName, adminEmail } = req.body || {};
  if (!name || !adminEmail) {
    return res.status(400).json({ error: 'Institute name and admin email are required' });
  }
  const id = 'INST-' + String(5 + institutes.length).padStart(3, '0');
  const short = name.split(' ').map(w => w[0]).slice(0, 3).join('').toUpperCase();
  const newInst = {
    id, name, short, city: city || '—', country: country || 'USA',
    plan: plan || 'Starter', status: 'Trial',
    adminName: adminName || 'Admin', adminEmail,
    branches: 0, students: 0, staff: 0, revenue: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    color: ['emerald','amber','violet','cyan','rose'][institutes.length % 5],
    domain: adminEmail.split('@')[1] || 'edu',
  };
  institutes.push(newInst);
  // auto-create the institute-admin login
  const adminId = 'U-IA-' + String(5 + platformUsers.filter(u => u.role === 'institute-admin').length).padStart(3, '0');
  platformUsers.push({
    id: adminId, name: adminName || 'Admin', email: adminEmail, password: 'esm123',
    role: 'institute-admin', instituteId: id, status: 'Active', title: 'Institute Administrator',
  });
  res.status(201).json({ institute: newInst, adminLogin: { id: adminId, email: adminEmail, password: 'esm123', role: 'institute-admin' } });
});

app.patch('/api/institutes/:id', (req, res) => {
  const inst = institutes.find(i => i.id === req.params.id);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  Object.assign(inst, req.body || {});
  res.json(inst);
});

// --- Branches (institute-admin CRUD) ---
app.get('/api/branches', (req, res) => {
  const { instituteId } = req.query;
  let list = branches;
  if (instituteId) list = list.filter(b => b.instituteId === instituteId);
  res.json(list);
});

app.post('/api/branches', (req, res) => {
  const { instituteId, name, city, managerName, managerEmail } = req.body || {};
  if (!instituteId || !name || !managerEmail) {
    return res.status(400).json({ error: 'Institute, branch name and manager email are required' });
  }
  const id = 'BR-' + String(12 + branches.length).padStart(3, '0');
  const newBranch = {
    id, instituteId, name, city: city || '—',
    manager: managerName || 'Manager', managerEmail,
    students: 0, teachers: 0, status: 'Active',
  };
  branches.push(newBranch);
  // auto-create the branch-manager login
  const mgrId = 'U-BM-' + String(5 + platformUsers.filter(u => u.role === 'branch-manager').length).padStart(3, '0');
  platformUsers.push({
    id: mgrId, name: managerName || 'Manager', email: managerEmail, password: 'esm123',
    role: 'branch-manager', instituteId, branchId: id, status: 'Active', title: 'Branch Manager',
  });
  // bump institute branch count
  const inst = institutes.find(i => i.id === instituteId);
  if (inst) inst.branches = (inst.branches || 0) + 1;
  res.status(201).json({ branch: newBranch, managerLogin: { id: mgrId, email: managerEmail, password: 'esm123', role: 'branch-manager' } });
});

// --- Platform users (branch-manager manages teachers/students) ---
app.get('/api/platform/users', (req, res) => {
  const { role, branchId, instituteId } = req.query;
  let list = platformUsers.filter(u => u.role !== 'super-admin');
  if (role) list = list.filter(u => u.role === role);
  if (branchId) list = list.filter(u => u.branchId === branchId);
  if (instituteId) list = list.filter(u => u.instituteId === instituteId);
  res.json(list.map(buildUserProfile));
});

app.post('/api/platform/users', (req, res) => {
  const { name, email, role, instituteId, branchId, class: cls, section, subjects, classes } = req.body || {};
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email and role are required' });
  }
  const rolePrefix = { 'branch-manager': 'U-BM-', 'teacher': 'U-T-', 'student': 'U-ST-', 'parent': 'U-PA-' }[role] || 'U-X-';
  const id = rolePrefix + String(10 + platformUsers.filter(u => u.role === role).length).padStart(3, '0');
  const newUser = {
    id, name, email, password: 'esm123', role, instituteId: instituteId || null,
    branchId: branchId || null, status: 'Active',
    title: { 'teacher': 'Teacher', 'student': 'Student', 'parent': 'Parent', 'branch-manager': 'Branch Manager' }[role] || role,
    ...(cls ? { class: cls, section: section || 'A', rollNo: String(2000 + platformUsers.length), guardian: '' } : {}),
    ...(subjects ? { subjects } : {}),
    ...(classes ? { classes } : {}),
  };
  platformUsers.push(newUser);
  res.status(201).json({ user: buildUserProfile(newUser), defaultPassword: 'esm123' });
});

// --- Scoped stats (per institute / branch) ---
app.get('/api/scoped/stats', (req, res) => {
  const { instituteId, branchId } = req.query;
  const inst = institutes.find(i => i.id === instituteId);
  const br = branches.find(b => b.id === branchId);
  if (branchId) {
    res.json({
      students: br?.students || 0,
      teachers: br?.teachers || 0,
      attendance: 93 + (branchId.charCodeAt(3) % 5),
      feeCollected: (br?.students || 0) * 1200,
      classCount: 8 + (branchId.charCodeAt(3) % 4),
      branchName: br?.name,
    });
  } else if (instituteId) {
    res.json({
      students: inst?.students || 0,
      staff: inst?.staff || 0,
      branches: inst?.branches || 0,
      revenue: inst?.revenue || 0,
      attendance: 92 + (instituteId.charCodeAt(5) % 5),
      instituteName: inst?.name,
    });
  } else {
    res.json(stats);
  }
});

// --- Dashboard stats ---
app.get('/api/stats', (req, res) => {
  res.json(stats);
});

// --- Students ---
app.get('/api/students', (req, res) => {
  const { q, class: cls, status } = req.query;
  let list = data.students;
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter(st => st.name.toLowerCase().includes(s) || st.id.toLowerCase().includes(s) || st.rollNo.includes(s));
  }
  if (cls && cls !== 'All') list = list.filter(st => st.class === cls);
  if (status && status !== 'All') list = list.filter(st => st.feeStatus === status);
  res.json({ total: list.length, students: list });
});

app.get('/api/students/:id', (req, res) => {
  const st = data.students.find(s => s.id === req.params.id);
  if (!st) return res.status(404).json({ error: 'Not found' });
  res.json(st);
});

// --- Attendance ---
app.get('/api/attendance/series', (req, res) => {
  res.json(data.attendanceSeries);
});
app.get('/api/attendance/today', (req, res) => {
  const today = data.attendanceSeries[data.attendanceSeries.length - 1];
  res.json(today);
});

// --- Fees ---
app.get('/api/fees/monthly', (req, res) => {
  res.json(data.feeMonthly);
});
app.get('/api/fees/defaulters', (req, res) => {
  res.json(data.students.filter(s => s.feeStatus === 'Overdue' || s.feeStatus === 'Pending'));
});

// --- Results ---
app.get('/api/results/subjects', (req, res) => {
  res.json(data.results);
});
app.get('/api/results/cards', (req, res) => {
  res.json(data.resultCards);
});

// --- SMS ---
app.get('/api/sms/log', (req, res) => {
  res.json(data.smsLog);
});
app.get('/api/sms/templates', (req, res) => {
  res.json(data.smsTemplates);
});
app.post('/api/sms/send', (req, res) => {
  const { text, recipients, type } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Message text required' });
  const entry = {
    id: 'SMS-' + (2001 + data.smsLog.length),
    type: type || 'Custom',
    text,
    recipients: recipients || 0,
    status: 'Delivered',
    sentAt: new Date().toISOString(),
    sender: 'eSM Alerts',
  };
  data.smsLog.unshift(entry);
  res.json({ success: true, entry });
});

// --- HR / Staff ---
app.get('/api/staff', (req, res) => {
  res.json(data.staff);
});

// --- Library ---
app.get('/api/library/books', (req, res) => {
  res.json(data.library);
});

// --- Transport ---
app.get('/api/transport/routes', (req, res) => {
  res.json(data.routes);
});

// --- Events ---
app.get('/api/events', (req, res) => {
  res.json(data.events);
});

// --- Finance ---
app.get('/api/finance/transactions', (req, res) => {
  res.json(data.financeTransactions);
});

// --- Inquiries ---
app.get('/api/inquiries', (req, res) => {
  res.json(data.inquiries);
});

// --- Complaints ---
app.get('/api/complaints', (req, res) => {
  res.json(data.complaints);
});

// --- Academics / Timetable ---
app.get('/api/academics/timetable', (req, res) => {
  res.json(data.timetable);
});

// --- Modules catalog (for sidebar) ---
app.get('/api/modules', (req, res) => {
  res.json([
    { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', group: 'Overview' },
    { id: 'inquiry', name: 'Inquiry Management', icon: 'PhoneCall', group: 'Admissions' },
    { id: 'admission', name: 'Admission Management', icon: 'UserPlus', group: 'Admissions' },
    { id: 'attendance', name: 'Attendance', icon: 'CalendarCheck', group: 'Academics' },
    { id: 'results', name: 'Results Management', icon: 'GraduationCap', group: 'Academics' },
    { id: 'academics', name: 'Academics', icon: 'BookOpen', group: 'Academics' },
    { id: 'fee', name: 'Fee Management', icon: 'DollarSign', group: 'Finance' },
    { id: 'finance', name: 'Finance Management', icon: 'Landmark', group: 'Finance' },
    { id: 'sms', name: 'SMS Portal', icon: 'MessageSquare', group: 'Communication' },
    { id: 'complaints', name: 'Complaint Management', icon: 'MessageCircleWarning', group: 'Communication' },
    { id: 'events', name: 'Event Management', icon: 'Trophy', group: 'Campus' },
    { id: 'library', name: 'Library Management', icon: 'Library', group: 'Campus' },
    { id: 'transport', name: 'Transport Management', icon: 'Bus', group: 'Campus' },
    { id: 'hostel', name: 'Hostel Management', icon: 'Building2', group: 'Campus' },
    { id: 'hr', name: 'HR Management', icon: 'Users', group: 'Administration' },
    { id: 'assets', name: 'Fixed Assets', icon: 'Boxes', group: 'Administration' },
    { id: 'franchise', name: 'Franchise', icon: 'Network', group: 'Administration' },
    { id: 'config', name: 'Configuration', icon: 'Settings', group: 'Administration' },
    { id: 'users', name: 'User & Privileges', icon: 'ShieldCheck', group: 'Administration' },
    { id: 'branding', name: 'Institute Branding', icon: 'Palette', group: 'Administration' },
    { id: 'consultancy', name: 'Student Consultancy', icon: 'Compass', group: 'Administration' },
  ]);
});

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'esm-api', port: PORT }));

app.listen(PORT, () => {
  console.log(`eSM API server running on http://localhost:${PORT}`);
});
