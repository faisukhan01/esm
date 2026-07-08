import express from 'express';
import cors from 'cors';
import { data, stats } from './data.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// --- Auth (demo) ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  // demo: accept any non-empty creds, but provide a hint for the default admin
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  res.json({
    token: 'demo-jwt-' + Buffer.from(email).toString('base64'),
    user: {
      id: 'U-001',
      name: email.split('@')[0].replace(/[^a-zA-Z]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) || 'Administrator',
      email,
      role: 'Super Admin',
      avatar: null,
      campus: 'Main Campus — Austin',
    },
  });
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
