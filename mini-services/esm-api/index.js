import express from 'express';
import cors from 'cors';
import {
  institutes, branches, platformUsers,
  attendanceRecords, resultRecords, feeTransactions, smsRecords,
  diaryEntries, complaints, events, libraryBooks, transportRoutes,
  classes, sections, subjects, nextId,
} from './data.js';

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

function buildUserProfile(u) {
  const inst = institutes.find(i => i.id === u.instituteId);
  const br = branches.find(b => b.id === u.branchId);
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    roleLabel: ROLE_LABELS[u.role] || u.role, title: u.title || '',
    status: u.status, avatar: null,
    instituteId: u.instituteId || null,
    instituteName: inst?.name || null, instituteShort: inst?.short || null,
    branchId: u.branchId || null, branchName: br?.name || null,
    campus: br ? br.name : (inst ? inst.name : 'eSM Platform'),
    ...(u.subjects ? { subjects: u.subjects } : {}),
    ...(u.classes ? { classes: u.classes } : {}),
    ...(u.class ? { class: u.class, section: u.section, rollNo: u.rollNo, guardian: u.guardian } : {}),
    ...(u.ward ? { ward: u.ward, wardId: u.wardId } : {}),
  };
}

// ===================== AUTH =====================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const u = platformUsers.find(p => p.email.toLowerCase() === String(email).toLowerCase() && p.password === password);
  if (!u) return res.status(401).json({ error: 'Invalid email or password' });
  if (u.status !== 'Active') return res.status(403).json({ error: 'Account is ' + u.status });
  res.json({ token: 'esm-jwt-' + Buffer.from(u.id + ':' + u.role).toString('base64'), user: buildUserProfile(u) });
});

// ===================== SUPER ADMIN: PLATFORM OVERVIEW =====================
app.get('/api/platform/overview', (req, res) => {
  const totalStudents = platformUsers.filter(u => u.role === 'student').length;
  const totalStaff = platformUsers.filter(u => u.role === 'teacher' || u.role === 'branch-manager' || u.role === 'institute-admin').length;
  res.json({
    institutes: institutes.length,
    branches: branches.length,
    totalStudents, totalStaff,
    totalRevenue: feeTransactions.filter(f => f.status === 'Paid').reduce((a, f) => a + f.amount, 0),
    activeInstitutes: institutes.filter(i => i.status === 'Active').length,
    trialInstitutes: institutes.filter(i => i.status === 'Trial').length,
    platformUsers: platformUsers.length,
    mrr: 0, growth: '—',
  });
});

// ===================== INSTITUTES (Super Admin CRUD) =====================
app.get('/api/institutes', (req, res) => res.json(institutes));

app.get('/api/institutes/:id', (req, res) => {
  const inst = institutes.find(i => i.id === req.params.id);
  if (!inst) return res.status(404).json({ error: 'Institute not found' });
  res.json({
    ...inst,
    branchList: branches.filter(b => b.instituteId === inst.id),
    users: platformUsers.filter(u => u.instituteId === inst.id).map(buildUserProfile),
  });
});

app.post('/api/institutes', (req, res) => {
  const { name, city, country, plan, adminName, adminEmail } = req.body || {};
  if (!name || !adminEmail) return res.status(400).json({ error: 'Institute name and admin email are required' });
  if (platformUsers.find(u => u.email.toLowerCase() === adminEmail.toLowerCase())) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }
  const id = nextId('INST');
  const short = name.split(' ').map(w => w[0]).slice(0, 3).join('').toUpperCase();
  const colors = ['emerald','amber','violet','cyan','rose','teal','orange'];
  const newInst = {
    id, name, short, city: city || '—', country: country || 'USA',
    plan: plan || 'Starter', status: 'Trial',
    adminName: adminName || 'Admin', adminEmail,
    branches: 0, students: 0, staff: 0, revenue: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    color: colors[institutes.length % colors.length],
    domain: adminEmail.split('@')[1] || 'edu',
  };
  institutes.push(newInst);
  const adminId = nextId('U');
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

// ===================== BRANCHES (Institute Admin CRUD) =====================
app.get('/api/branches', (req, res) => {
  const { instituteId } = req.query;
  let list = branches;
  if (instituteId) list = list.filter(b => b.instituteId === instituteId);
  res.json(list);
});

app.post('/api/branches', (req, res) => {
  const { instituteId, name, city, managerName, managerEmail } = req.body || {};
  if (!instituteId || !name || !managerEmail) return res.status(400).json({ error: 'Institute, branch name and manager email are required' });
  if (platformUsers.find(u => u.email.toLowerCase() === managerEmail.toLowerCase())) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }
  const id = nextId('BR');
  const newBranch = {
    id, instituteId, name, city: city || '—',
    manager: managerName || 'Manager', managerEmail,
    students: 0, teachers: 0, status: 'Active', createdAt: new Date().toISOString().slice(0, 10),
  };
  branches.push(newBranch);
  const mgrId = nextId('U');
  platformUsers.push({
    id: mgrId, name: managerName || 'Manager', email: managerEmail, password: 'esm123',
    role: 'branch-manager', instituteId, branchId: id, status: 'Active', title: 'Branch Manager',
  });
  const inst = institutes.find(i => i.id === instituteId);
  if (inst) inst.branches = (inst.branches || 0) + 1;
  res.status(201).json({ branch: newBranch, managerLogin: { id: mgrId, email: managerEmail, password: 'esm123', role: 'branch-manager' } });
});

// ===================== PLATFORM USERS (Branch Manager adds teachers/students) =====================
app.get('/api/platform/users', (req, res) => {
  const { role, branchId, instituteId } = req.query;
  let list = platformUsers.filter(u => u.role !== 'super-admin');
  if (role) list = list.filter(u => u.role === role);
  if (branchId) list = list.filter(u => u.branchId === branchId);
  if (instituteId) list = list.filter(u => u.instituteId === instituteId);
  res.json(list.map(buildUserProfile));
});

app.post('/api/platform/users', (req, res) => {
  const { name, email, role, instituteId, branchId, class: cls, section, subjects, classes: teacherClasses, guardian, ward, wardId } = req.body || {};
  if (!name || !email || !role) return res.status(400).json({ error: 'Name, email and role are required' });
  if (platformUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }
  const id = nextId('U');
  const newUser = {
    id, name, email, password: 'esm123', role,
    instituteId: instituteId || null, branchId: branchId || null,
    status: 'Active',
    title: { 'teacher': 'Teacher', 'student': 'Student', 'parent': 'Parent', 'branch-manager': 'Branch Manager' }[role] || role,
    ...(cls ? { class: cls, section: section || 'A', rollNo: String(1000 + platformUsers.filter(u => u.role === 'student').length + 1), guardian: guardian || '' } : {}),
    ...(subjects ? { subjects } : {}),
    ...(teacherClasses ? { classes: teacherClasses } : {}),
    ...(role === 'parent' && ward ? { ward, wardId: wardId || null } : {}),
  };
  platformUsers.push(newUser);
  // Update branch counts
  if (branchId) {
    const br = branches.find(b => b.id === branchId);
    if (br) {
      if (role === 'teacher') br.teachers = (br.teachers || 0) + 1;
      if (role === 'student') br.students = (br.students || 0) + 1;
    }
  }
  // Update institute counts
  if (instituteId) {
    const inst = institutes.find(i => i.id === instituteId);
    if (inst) {
      if (role === 'student') inst.students = (inst.students || 0) + 1;
      if (role === 'teacher' || role === 'branch-manager') inst.staff = (inst.staff || 0) + 1;
    }
  }
  res.status(201).json({ user: buildUserProfile(newUser), defaultPassword: 'esm123' });
});

// ===================== SCOPED STATS =====================
app.get('/api/scoped/stats', (req, res) => {
  const { instituteId, branchId } = req.query;
  if (branchId) {
    const br = branches.find(b => b.id === branchId);
    const branchStudents = platformUsers.filter(u => u.branchId === branchId && u.role === 'student').length;
    const branchTeachers = platformUsers.filter(u => u.branchId === branchId && u.role === 'teacher').length;
    res.json({
      students: branchStudents, teachers: branchTeachers,
      attendance: 0, feeCollected: feeTransactions.filter(f => f.branchId === branchId && f.status === 'Paid').reduce((a,f)=>a+f.amount,0),
      classCount: 0, branchName: br?.name,
    });
  } else if (instituteId) {
    const inst = institutes.find(i => i.id === instituteId);
    res.json({
      students: platformUsers.filter(u => u.instituteId === instituteId && u.role === 'student').length,
      staff: platformUsers.filter(u => u.instituteId === instituteId && (u.role === 'teacher' || u.role === 'branch-manager')).length,
      branches: branches.filter(b => b.instituteId === instituteId).length,
      revenue: feeTransactions.filter(f => f.instituteId === instituteId && f.status === 'Paid').reduce((a,f)=>a+f.amount,0),
      attendance: 0, instituteName: inst?.name,
    });
  } else {
    res.json({ students: 0, staff: 0, branches: 0, revenue: 0, attendance: 0 });
  }
});

// ===================== ATTENDANCE (Teacher marks, Student/Parent views) =====================
app.get('/api/attendance', (req, res) => {
  const { studentId, branchId, teacherId } = req.query;
  let records = attendanceRecords;
  if (teacherId) records = records.filter(r => r.teacherId === teacherId);
  if (branchId) records = records.filter(r => r.branchId === branchId);
  if (studentId) {
    // Return only this student's attendance entries
    const entries = [];
    records.forEach(rec => {
      const entry = rec.records.find(e => e.studentId === studentId);
      if (entry) entries.push({ id: rec.id, date: rec.date, class: rec.class, status: entry.status, teacherId: rec.teacherId });
    });
    return res.json({ total: entries.length, entries, present: entries.filter(e=>e.status==='Present').length, absent: entries.filter(e=>e.status==='Absent').length, late: entries.filter(e=>e.status==='Late').length, rate: entries.length ? Math.round(entries.filter(e=>e.status==='Present').length / entries.length * 1000)/10 : 0 });
  }
  res.json(records);
});

app.post('/api/attendance', (req, res) => {
  const { branchId, class: cls, section, date, teacherId, records: studentRecords } = req.body || {};
  if (!branchId || !date || !studentRecords) return res.status(400).json({ error: 'branchId, date and records are required' });
  const id = nextId('ATT');
  const rec = { id, branchId, class: cls || '', section: section || '', date, teacherId: teacherId || null, records: studentRecords };
  attendanceRecords.push(rec);
  res.status(201).json(rec);
});

// ===================== RESULTS (Teacher posts, Student/Parent views) =====================
app.get('/api/results', (req, res) => {
  const { studentId, branchId, teacherId } = req.query;
  let records = resultRecords;
  if (teacherId) records = records.filter(r => r.teacherId === teacherId);
  if (branchId) records = records.filter(r => r.branchId === branchId);
  if (studentId) {
    const entries = [];
    records.forEach(rec => {
      const entry = rec.records.find(e => e.studentId === studentId);
      if (entry) entries.push({ id: rec.id, exam: rec.exam, subject: rec.subject, totalMarks: rec.totalMarks, marks: entry.marks, grade: entry.grade, percentage: Math.round(entry.marks / rec.totalMarks * 1000)/10, date: rec.date });
    });
    return res.json({ total: entries.length, entries, avgPercentage: entries.length ? Math.round(entries.reduce((a,e)=>a+e.percentage,0)/entries.length * 10)/10 : 0 });
  }
  res.json(records);
});

app.post('/api/results', (req, res) => {
  const { branchId, exam, subject, teacherId, totalMarks, date, records: studentRecords } = req.body || {};
  if (!branchId || !exam || !subject || !studentRecords) return res.status(400).json({ error: 'branchId, exam, subject and records are required' });
  const id = nextId('RES');
  const rec = { id, branchId, exam, subject, teacherId: teacherId || null, totalMarks: totalMarks || 100, date: date || new Date().toISOString().slice(0,10), records: studentRecords };
  resultRecords.push(rec);
  res.status(201).json(rec);
});

// ===================== FEES =====================
app.get('/api/fees', (req, res) => {
  const { studentId, branchId, instituteId } = req.query;
  let records = feeTransactions;
  if (studentId) records = records.filter(f => f.studentId === studentId);
  if (branchId) records = records.filter(f => f.branchId === branchId);
  if (instituteId) records = records.filter(f => f.instituteId === instituteId);
  res.json(records);
});

app.post('/api/fees', (req, res) => {
  const { studentId, instituteId, branchId, amount, type, method } = req.body || {};
  if (!studentId || !amount) return res.status(400).json({ error: 'studentId and amount are required' });
  const id = nextId('FEE');
  const rec = { id, studentId, instituteId, branchId, amount, type: type || 'Tuition', method: method || 'Online', date: new Date().toISOString().slice(0,10), status: 'Paid' };
  feeTransactions.push(rec);
  res.status(201).json(rec);
});

// ===================== SMS =====================
app.get('/api/sms', (req, res) => {
  const { senderId, instituteId, branchId } = req.query;
  let records = smsRecords;
  if (senderId) records = records.filter(s => s.senderId === senderId);
  if (instituteId) records = records.filter(s => s.instituteId === instituteId);
  if (branchId) records = records.filter(s => s.branchId === branchId);
  res.json(records);
});

app.post('/api/sms/send', (req, res) => {
  const { text, recipients, type, senderId, instituteId, branchId } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Message text required' });
  const id = nextId('SMS');
  const rec = { id, senderId: senderId || null, instituteId: instituteId || null, branchId: branchId || null, text, recipients: recipients || 0, type: type || 'Custom', status: 'Delivered', sentAt: new Date().toISOString() };
  smsRecords.push(rec);
  res.status(201).json(rec);
});

// ===================== DIARY / HOMEWORK =====================
app.get('/api/diary', (req, res) => {
  const { teacherId, branchId, class: cls } = req.query;
  let records = diaryEntries;
  if (teacherId) records = records.filter(d => d.teacherId === teacherId);
  if (branchId) records = records.filter(d => d.branchId === branchId);
  if (cls) records = records.filter(d => d.class === cls);
  res.json(records);
});

app.post('/api/diary', (req, res) => {
  const { teacherId, branchId, subject, title, desc, due, class: cls } = req.body || {};
  if (!title || !subject) return res.status(400).json({ error: 'title and subject are required' });
  const id = nextId('DIARY');
  const rec = { id, teacherId: teacherId || null, branchId: branchId || null, subject, title, desc: desc || '', due: due || '', class: cls || '', date: new Date().toISOString().slice(0,10) };
  diaryEntries.push(rec);
  res.status(201).json(rec);
});

// ===================== COMPLAINTS =====================
app.get('/api/complaints', (req, res) => {
  const { parentId, instituteId, branchId } = req.query;
  let records = complaints;
  if (parentId) records = records.filter(c => c.parentId === parentId);
  if (instituteId) records = records.filter(c => c.instituteId === instituteId);
  if (branchId) records = records.filter(c => c.branchId === branchId);
  res.json(records);
});

app.post('/api/complaints', (req, res) => {
  const { parentId, studentId, instituteId, branchId, subject, type, priority } = req.body || {};
  if (!subject) return res.status(400).json({ error: 'subject is required' });
  const id = nextId('CMP');
  const rec = { id, parentId: parentId || null, studentId: studentId || null, instituteId: instituteId || null, branchId: branchId || null, subject, type: type || 'General', priority: priority || 'Medium', status: 'Open', date: new Date().toISOString().slice(0,10), messages: [{ from: 'parent', text: subject, date: new Date().toISOString() }] };
  complaints.push(rec);
  res.status(201).json(rec);
});

// ===================== EVENTS =====================
app.get('/api/events', (req, res) => {
  const { instituteId, branchId } = req.query;
  let records = events;
  if (instituteId) records = records.filter(e => e.instituteId === instituteId);
  if (branchId) records = records.filter(e => e.branchId === branchId);
  res.json(records);
});

app.post('/api/events', (req, res) => {
  const { instituteId, branchId, name, date, type, venue, participants, prize, createdBy } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Event name is required' });
  const id = nextId('EVT');
  const rec = { id, instituteId: instituteId || null, branchId: branchId || null, name, date, type: type || 'Academic', venue: venue || '', participants: participants || 0, prize: prize || '', status: 'Upcoming', createdBy: createdBy || null };
  events.push(rec);
  res.status(201).json(rec);
});

// ===================== LIBRARY =====================
app.get('/api/library/books', (req, res) => {
  const { branchId } = req.query;
  let records = libraryBooks;
  if (branchId) records = records.filter(b => b.branchId === branchId);
  res.json(records);
});

app.post('/api/library/books', (req, res) => {
  const { branchId, title, author, category, isbn, copies, cost, vendor } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Book title is required' });
  const id = nextId('BK');
  const rec = { id, branchId: branchId || null, title, author: author || '', category: category || 'General', isbn: isbn || '', copies: copies || 1, available: copies || 1, cost: cost || 0, vendor: vendor || '', status: 'Available' };
  libraryBooks.push(rec);
  res.status(201).json(rec);
});

// ===================== TRANSPORT =====================
app.get('/api/transport/routes', (req, res) => {
  const { branchId } = req.query;
  let records = transportRoutes;
  if (branchId) records = records.filter(r => r.branchId === branchId);
  res.json(records);
});

app.post('/api/transport/routes', (req, res) => {
  const { branchId, name, vehicle, driver, students, fare } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Route name is required' });
  const id = nextId('RT');
  const rec = { id, branchId: branchId || null, name, vehicle: vehicle || '', driver: driver || '', students: students || 0, fare: fare || 0 };
  transportRoutes.push(rec);
  res.status(201).json(rec);
});

// ===================== REFERENCE DATA =====================
app.get('/api/reference', (req, res) => res.json({ classes, sections, subjects }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'esm-api', port: PORT, institutes: institutes.length, users: platformUsers.length }));

app.listen(PORT, () => console.log(`eSM API server running on http://localhost:${PORT}`));
