import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { db, initDB } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' })); // large limit for file uploads

const ROLE_LABELS = {
  'super-admin': 'Super Admin',
  'institute-admin': 'Institute Admin',
  'branch-manager': 'Branch Manager',
  'teacher': 'Teacher',
  'student': 'Student',
};

// ===================== SECURITY =====================
const SESSION_TTL = 8 * 60 * 60 * 1000;
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

setInterval(async () => {
  try {
    await db.execute({ sql: 'DELETE FROM sessions WHERE expiresAt < ?', args: [Date.now()] });
  } catch {}
}, 10 * 60 * 1000);

async function createSession(user) {
  const token = 'esm-' + crypto.randomBytes(32).toString('hex');
  await db.execute({
    sql: 'INSERT INTO sessions (token, userId, role, issuedAt, expiresAt) VALUES (?, ?, ?, ?, ?)',
    args: [token, user.id, user.role, Date.now(), Date.now() + SESSION_TTL],
  });
  return token;
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.substring(7);
  try {
    const result = await db.execute({ sql: 'SELECT * FROM sessions WHERE token = ?', args: [token] });
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid or expired session' });
    const session = result.rows[0];
    if (Date.now() > session.expiresAt) {
      await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
      return res.status(401).json({ error: 'Session expired' });
    }
    const userResult = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [session.userId] });
    if (userResult.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    const user = userResult.rows[0];
    if (user.status !== 'Active' || user.blocked === 1) {
      return res.status(403).json({ error: 'Account is blocked or inactive' });
    }
    // Check if institute/branch is blocked (cascade)
    if (user.instituteId) {
      const inst = await db.execute({ sql: 'SELECT blocked FROM institutes WHERE id = ?', args: [user.instituteId] });
      if (inst.rows.length > 0 && inst.rows[0].blocked === 1 && user.role !== 'super-admin') {
        return res.status(403).json({ error: 'Institute access has been blocked' });
      }
    }
    if (user.branchId) {
      const br = await db.execute({ sql: 'SELECT blocked FROM branches WHERE id = ?', args: [user.branchId] });
      if (br.rows.length > 0 && br.rows[0].blocked === 1 && user.role !== 'super-admin') {
        return res.status(403).json({ error: 'Branch access has been blocked' });
      }
    }
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Auth failed' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

function buildUserProfile(u) {
  return {
    id: u.id, name: u.name, email: u.email, rollNo: u.rollNo, role: u.role,
    roleLabel: ROLE_LABELS[u.role] || u.role, title: u.title || '',
    status: u.status, mustChangePassword: u.mustChangePassword === 1, blocked: u.blocked === 1,
    instituteId: u.instituteId || null, branchId: u.branchId || null,
    class: u.class || null, section: u.section || null,
    guardian: u.guardian || null, ward: u.ward, wardId: u.wardId,
    subjects: u.subjects ? JSON.parse(u.subjects) : [],
    classes: u.classes ? JSON.parse(u.classes) : [],
  };
}

function nextId(prefix) {
  return prefix + '-' + crypto.randomBytes(4).toString('hex');
}

// ===================== AUTH =====================
app.post('/api/auth/login', async (req, res) => {
  const { email, password, loginId, name, role: requestedRole } = req.body || {};
  const identifier = (email || loginId || '').toLowerCase().trim();
  const userName = (name || '').toLowerCase().trim();
  if (!identifier || !password) return res.status(400).json({ error: 'Credentials and password required' });

  // Rate limiting key (combine identifier + name for uniqueness)
  const rateKey = userName ? `${userName}:${identifier}` : identifier;
  const attempts = loginAttempts.get(rateKey);
  if (attempts && attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ error: `Too many failed attempts. Locked for ${remaining} min.` });
  }

  try {
    // Find user by email OR rollNo/ID
    let result = await db.execute({ sql: 'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(rollNo) = ?', args: [identifier, identifier.toLowerCase()] });

    if (result.rows.length === 0) {
      const current = loginAttempts.get(rateKey) || { count: 0, lockedUntil: 0 };
      current.count++;
      if (current.count >= MAX_LOGIN_ATTEMPTS) { current.lockedUntil = Date.now() + LOCKOUT_DURATION; current.count = 0; }
      loginAttempts.set(rateKey, current);
      return res.status(401).json({ error: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - current.count} attempts left.` });
    }

    // If multiple results (e.g. same rollNo across branches), filter by name if provided
    let u = result.rows[0];
    if (userName && result.rows.length > 1) {
      const byName = result.rows.find(r => String(r.name).toLowerCase().trim() === userName);
      if (byName) u = byName;
    }
    // If name provided, verify it matches
    if (userName && String(u.name).toLowerCase().trim() !== userName) {
      const current = loginAttempts.get(rateKey) || { count: 0, lockedUntil: 0 };
      current.count++;
      if (current.count >= MAX_LOGIN_ATTEMPTS) { current.lockedUntil = Date.now() + LOCKOUT_DURATION; current.count = 0; }
      loginAttempts.set(rateKey, current);
      return res.status(401).json({ error: `Name does not match. ${MAX_LOGIN_ATTEMPTS - current.count} attempts left.` });
    }

    if (u.password !== password) {
      const current = loginAttempts.get(rateKey) || { count: 0, lockedUntil: 0 };
      current.count++;
      if (current.count >= MAX_LOGIN_ATTEMPTS) { current.lockedUntil = Date.now() + LOCKOUT_DURATION; current.count = 0; }
      loginAttempts.set(rateKey, current);
      return res.status(401).json({ error: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - current.count} attempts left.` });
    }
    if (u.status !== 'Active') return res.status(403).json({ error: 'Account is ' + u.status });
    if (u.blocked === 1) return res.status(403).json({ error: 'Your account has been blocked. Contact your administrator.' });

    // Check institute/branch block (cascade)
    if (u.instituteId && u.role !== 'super-admin') {
      const inst = await db.execute({ sql: 'SELECT blocked FROM institutes WHERE id = ?', args: [u.instituteId] });
      if (inst.rows.length > 0 && inst.rows[0].blocked === 1) return res.status(403).json({ error: 'Institute access blocked. Contact administration.' });
    }
    if (u.branchId && u.role !== 'super-admin') {
      const br = await db.execute({ sql: 'SELECT blocked FROM branches WHERE id = ?', args: [u.branchId] });
      if (br.rows.length > 0 && br.rows[0].blocked === 1) return res.status(403).json({ error: 'Branch access blocked.' });
    }

    loginAttempts.delete(rateKey);
    const token = await createSession(u);
    res.json({ token, user: buildUserProfile(u), mustChangePassword: u.mustChangePassword === 1 });
  } catch (e) {
    res.status(500).json({ error: 'Login failed: ' + e.message });
  }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [req.token] });
  res.json({ success: true });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Password too short' });
  if (req.user.password !== currentPassword) return res.status(401).json({ error: 'Current password incorrect' });
  await db.execute({ sql: 'UPDATE users SET password = ?, mustChangePassword = 0 WHERE id = ?', args: [newPassword, req.user.id] });
  res.json({ success: true });
});

// ===================== INSTITUTES (Super Admin) =====================
app.get('/api/institutes', requireAuth, requireRole('super-admin', 'institute-admin'), async (req, res) => {
  if (req.user.role === 'institute-admin') {
    const r = await db.execute({ sql: 'SELECT * FROM institutes WHERE id = ?', args: [req.user.instituteId] });
    return res.json(r.rows);
  }
  const r = await db.execute('SELECT * FROM institutes ORDER BY createdAt DESC');
  res.json(r.rows);
});

app.post('/api/institutes', requireAuth, requireRole('super-admin'), async (req, res) => {
  const { name, city, country, plan, adminName, adminEmail, adminPassword } = req.body || {};
  if (!name || !adminEmail || !adminPassword) return res.status(400).json({ error: 'Name, admin email and password required' });
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE LOWER(email) = ?', args: [adminEmail.toLowerCase()] });
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already in use' });

  const instId = nextId('INST');
  const short = name.split(' ').map(w => w[0]).slice(0, 3).join('').toUpperCase();
  const colors = ['emerald','amber','violet','cyan','rose','teal','orange'];
  await db.execute({
    sql: `INSERT INTO institutes (id, name, short, city, country, plan, status, adminName, adminEmail, color, domain, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [instId, name, short, city || '', country || 'USA', plan || 'Starter', 'Trial', adminName || 'Admin', adminEmail, colors[Math.floor(Math.random()*colors.length)], adminEmail.split('@')[1] || 'edu', 0],
  });
  const adminId = nextId('U');
  await db.execute({
    sql: `INSERT INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [adminId, adminName || 'Admin', adminEmail, adminPassword, 'institute-admin', 'Active', 'Institute Administrator', 1, 0, instId],
  });
  res.status(201).json({ institute: { id: instId, name, adminEmail }, adminLogin: { id: adminId, email: adminEmail, password: adminPassword } });
});

app.patch('/api/institutes/:id', requireAuth, requireRole('super-admin'), async (req, res) => {
  const { name, plan, status, adminName, adminEmail, adminPassword } = req.body || {};
  const r = await db.execute({ sql: 'SELECT * FROM institutes WHERE id = ?', args: [req.params.id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  const inst = r.rows[0];
  if (name) await db.execute({ sql: 'UPDATE institutes SET name = ? WHERE id = ?', args: [name, inst.id] });
  if (plan) await db.execute({ sql: 'UPDATE institutes SET plan = ? WHERE id = ?', args: [plan, inst.id] });
  if (status) await db.execute({ sql: 'UPDATE institutes SET status = ? WHERE id = ?', args: [status, inst.id] });
  // Update institute admin
  const adminR = await db.execute({ sql: 'SELECT id FROM users WHERE instituteId = ? AND role = ?', args: [inst.id, 'institute-admin'] });
  if (adminR.rows.length > 0) {
    const adminId = adminR.rows[0].id;
    if (adminName) await db.execute({ sql: 'UPDATE users SET name = ? WHERE id = ?', args: [adminName, adminId] });
    if (adminEmail) await db.execute({ sql: 'UPDATE users SET email = ? WHERE id = ?', args: [adminEmail, adminId] });
    if (adminPassword) await db.execute({ sql: 'UPDATE users SET password = ?, mustChangePassword = 1 WHERE id = ?', args: [adminPassword, adminId] });
    if (adminName) await db.execute({ sql: 'UPDATE institutes SET adminName = ? WHERE id = ?', args: [adminName, inst.id] });
    if (adminEmail) await db.execute({ sql: 'UPDATE institutes SET adminEmail = ? WHERE id = ?', args: [adminEmail, inst.id] });
  }
  res.json({ success: true });
});

// Block/unblock institute (cascades to branches + staff)
app.patch('/api/institutes/:id/block', requireAuth, requireRole('super-admin'), async (req, res) => {
  const { blocked, reason } = req.body || {};
  await db.execute({ sql: 'UPDATE institutes SET blocked = ?, blockedReason = ? WHERE id = ?', args: [blocked ? 1 : 0, reason || '', req.params.id] });
  // Cascade: block/unblock all branches + users in this institute
  await db.execute({ sql: 'UPDATE branches SET blocked = ? WHERE instituteId = ?', args: [blocked ? 1 : 0, req.params.id] });
  await db.execute({ sql: 'UPDATE users SET blocked = ? WHERE instituteId = ? AND role != ?', args: [blocked ? 1 : 0, req.params.id, 'super-admin'] });
  // Invalidate sessions
  if (blocked) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE userId IN (SELECT id FROM users WHERE instituteId = ?)', args: [req.params.id] });
  }
  res.json({ success: true, blocked });
});

// ===================== BRANCHES (Institute Admin) =====================
app.get('/api/branches', requireAuth, requireRole('super-admin', 'institute-admin', 'branch-manager'), async (req, res) => {
  let sql = 'SELECT * FROM branches';
  let args = [];
  if (req.user.role === 'institute-admin') { sql += ' WHERE instituteId = ?'; args = [req.user.instituteId]; }
  else if (req.user.role === 'branch-manager') { sql += ' WHERE id = ?'; args = [req.user.branchId]; }
  const r = await db.execute({ sql, args });
  res.json(r.rows);
});

app.post('/api/branches', requireAuth, requireRole('institute-admin', 'super-admin'), async (req, res) => {
  const { instituteId, name, city, managerName, managerEmail, managerPassword } = req.body || {};
  const instId = instituteId || req.user.instituteId;
  if (!instId || !name || !managerEmail || !managerPassword) return res.status(400).json({ error: 'Institute, name, manager email and password required' });
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE LOWER(email) = ?', args: [managerEmail.toLowerCase()] });
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already in use' });

  const brId = nextId('BR');
  await db.execute({
    sql: `INSERT INTO branches (id, instituteId, name, city, manager, managerEmail, status, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [brId, instId, name, city || '', managerName || 'Manager', managerEmail, 'Active', 0],
  });
  const mgrId = nextId('U');
  await db.execute({
    sql: `INSERT INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked, instituteId, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [mgrId, managerName || 'Manager', managerEmail, managerPassword, 'branch-manager', 'Active', 'Branch Manager', 1, 0, instId, brId],
  });
  await db.execute({ sql: 'UPDATE institutes SET branches = branches + 1 WHERE id = ?', args: [instId] });

  // Auto-create classes 1-12 for this branch
  for (let i = 1; i <= 12; i++) {
    const clsId = nextId('CLS');
    await db.execute({ sql: 'INSERT INTO classes (id, branchId, name, section) VALUES (?, ?, ?, ?)', args: [clsId, brId, `Class ${i}`, 'A'] });
  }

  res.status(201).json({ branch: { id: brId, name }, managerLogin: { id: mgrId, email: managerEmail, password: managerPassword } });
});

app.patch('/api/branches/:id/block', requireAuth, requireRole('institute-admin', 'super-admin'), async (req, res) => {
  const { blocked, reason } = req.body || {};
  await db.execute({ sql: 'UPDATE branches SET blocked = ?, blockedReason = ? WHERE id = ?', args: [blocked ? 1 : 0, reason || '', req.params.id] });
  await db.execute({ sql: 'UPDATE users SET blocked = ? WHERE branchId = ? AND role IN (?, ?)', args: [blocked ? 1 : 0, req.params.id, 'teacher', 'student'] });
  if (blocked) await db.execute({ sql: 'DELETE FROM sessions WHERE userId IN (SELECT id FROM users WHERE branchId = ?)', args: [req.params.id] });
  res.json({ success: true });
});

// ===================== PLATFORM USERS =====================
app.get('/api/platform/users', requireAuth, async (req, res) => {
  const { role, branchId, instituteId } = req.query;
  let sql = 'SELECT * FROM users WHERE role != ?';
  let args = ['super-admin'];
  if (req.user.role === 'institute-admin') { sql += ' AND instituteId = ?'; args.push(req.user.instituteId); }
  if (req.user.role === 'branch-manager') { sql += ' AND branchId = ?'; args.push(req.user.branchId); }
  if (role) { sql += ' AND role = ?'; args.push(role); }
  if (branchId) { sql += ' AND branchId = ?'; args.push(branchId); }
  if (instituteId) { sql += ' AND instituteId = ?'; args.push(instituteId); }
  sql += ' ORDER BY createdAt DESC';
  const r = await db.execute({ sql, args });
  res.json(r.rows.map(buildUserProfile));
});

// Add teacher or student (by Branch Manager)
app.post('/api/platform/users', requireAuth, requireRole('branch-manager', 'institute-admin', 'super-admin'), async (req, res) => {
  const { name, email, password, role, instituteId, branchId, rollNo, class: cls, section, subjects, classes, classId, courseIds } = req.body || {};
  if (!name || !password || !role) return res.status(400).json({ error: 'Name, password and role required' });
  if (role === 'teacher' || role === 'student') {
    if (!rollNo) return res.status(400).json({ error: 'Roll Number/ID is required' });
  }
  const instId = instituteId || req.user.instituteId;
  const brId = branchId || req.user.branchId;

  // Check email uniqueness if email provided
  if (email) {
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE LOWER(email) = ?', args: [email.toLowerCase()] });
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already in use' });
  }
  // Check rollNo uniqueness within branch
  if (rollNo) {
    const existingRoll = await db.execute({ sql: 'SELECT id FROM users WHERE rollNo = ? AND branchId = ?', args: [rollNo, brId] });
    if (existingRoll.rows.length > 0) return res.status(409).json({ error: 'Roll Number already exists in this branch' });
  }

  const id = nextId('U');
  const subjectsJson = subjects ? JSON.stringify(subjects) : null;
  const classesJson = classes ? JSON.stringify(classes) : null;

  await db.execute({
    sql: `INSERT INTO users (id, name, email, rollNo, password, role, status, title, mustChangePassword, blocked, instituteId, branchId, class, section, guardian, subjects, classes, createdById)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, email || null, rollNo || null, password, role, 'Active',
      role === 'teacher' ? 'Teacher' : role === 'student' ? 'Student' : role, 1, 0,
      instId, brId, cls || null, section || 'A', null, subjectsJson, classesJson, req.user.id],
  });

  // Update counts
  if (brId) {
    if (role === 'teacher') await db.execute({ sql: 'UPDATE branches SET teachers = teachers + 1 WHERE id = ?', args: [brId] });
    if (role === 'student') await db.execute({ sql: 'UPDATE branches SET students = students + 1 WHERE id = ?', args: [brId] });
  }
  if (instId) {
    if (role === 'student') await db.execute({ sql: 'UPDATE institutes SET students = students + 1 WHERE id = ?', args: [instId] });
    if (role === 'teacher') await db.execute({ sql: 'UPDATE institutes SET staff = staff + 1 WHERE id = ?', args: [instId] });
  }

  // Assign teacher to class + courses
  if (role === 'teacher' && classId && courseIds && courseIds.length > 0) {
    for (const courseId of courseIds) {
      const tccId = nextId('TCC');
      await db.execute({ sql: 'INSERT INTO teacher_class_courses (id, teacherId, classId, courseId) VALUES (?, ?, ?, ?)', args: [tccId, id, classId, courseId] });
    }
  }

  res.status(201).json({ user: { id, name, rollNo, email, role }, defaultPassword: password });
});

// Edit user (admin sees new password)
app.patch('/api/platform/users/:id', requireAuth, async (req, res) => {
  const { name, email, password, blocked, classId, addCourseIds } = req.body || {};
  const r = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [req.params.id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const target = r.rows[0];
  // Permission check: only the creator's role level or above can edit
  if (req.user.role === 'branch-manager' && target.branchId !== req.user.branchId) return res.status(403).json({ error: 'Can only edit users in your branch' });
  if (req.user.role === 'institute-admin' && target.instituteId !== req.user.instituteId) return res.status(403).json({ error: 'Can only edit users in your institute' });

  if (name) await db.execute({ sql: 'UPDATE users SET name = ? WHERE id = ?', args: [name, target.id] });
  if (email) await db.execute({ sql: 'UPDATE users SET email = ? WHERE id = ?', args: [email, target.id] });
  if (password) await db.execute({ sql: 'UPDATE users SET password = ?, mustChangePassword = 1 WHERE id = ?', args: [password, target.id] });
  if (blocked !== undefined) {
    await db.execute({ sql: 'UPDATE users SET blocked = ? WHERE id = ?', args: [blocked ? 1 : 0, target.id] });
    if (blocked) await db.execute({ sql: 'DELETE FROM sessions WHERE userId = ?', args: [target.id] });
  }
  // Assign teacher to additional class+courses
  if (classId && addCourseIds && addCourseIds.length > 0) {
    for (const courseId of addCourseIds) {
      const tccId = nextId('TCC');
      await db.execute({ sql: 'INSERT INTO teacher_class_courses (id, teacherId, classId, courseId) VALUES (?, ?, ?, ?)', args: [tccId, target.id, classId, courseId] });
    }
  }
  res.json({ success: true });
});

// Block/unblock user
app.patch('/api/platform/users/:id/block', requireAuth, async (req, res) => {
  const { blocked, reason } = req.body || {};
  const r = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [req.params.id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const target = r.rows[0];
  if (req.user.role === 'branch-manager' && target.branchId !== req.user.branchId) return res.status(403).json({ error: 'Can only edit users in your branch' });
  if (req.user.role === 'institute-admin' && target.instituteId !== req.user.instituteId) return res.status(403).json({ error: 'Can only edit users in your institute' });
  await db.execute({ sql: 'UPDATE users SET blocked = ? WHERE id = ?', args: [blocked ? 1 : 0, target.id] });
  if (blocked) await db.execute({ sql: 'DELETE FROM sessions WHERE userId = ?', args: [target.id] });
  res.json({ success: true, blocked });
});

// Get user passwords (for admin to see current passwords of users they manage)
app.get('/api/platform/users/:id/password', requireAuth, async (req, res) => {
  const r = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [req.params.id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const target = r.rows[0];
  // Only the managing admin can see the password
  if (req.user.role === 'branch-manager' && target.branchId !== req.user.branchId) return res.status(403).json({ error: 'Not authorized' });
  if (req.user.role === 'institute-admin' && target.instituteId !== req.user.instituteId) return res.status(403).json({ error: 'Not authorized' });
  res.json({ password: target.password, mustChangePassword: target.mustChangePassword === 1 });
});

// ===================== CLASSES & COURSES =====================
app.get('/api/classes', requireAuth, async (req, res) => {
  const { branchId } = req.query;
  const brId = branchId || req.user.branchId;
  if (!brId) return res.json([]);
  const r = await db.execute({ sql: 'SELECT * FROM classes WHERE branchId = ? ORDER BY name', args: [brId] });
  res.json(r.rows);
});

app.get('/api/courses', requireAuth, async (req, res) => {
  const { branchId, classId } = req.query;
  if (classId) {
    const r = await db.execute({
      sql: `SELECT c.* FROM courses c JOIN class_courses cc ON c.id = cc.courseId WHERE cc.classId = ?`,
      args: [classId]
    });
    return res.json(r.rows);
  }
  const brId = branchId || req.user.branchId;
  if (!brId) return res.json([]);
  const r = await db.execute({ sql: 'SELECT * FROM courses WHERE branchId = ? ORDER BY name', args: [brId] });
  res.json(r.rows);
});

// Add course to a class
app.post('/api/class-courses', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const { classId, courseId } = req.body || {};
  if (!classId || !courseId) return res.status(400).json({ error: 'classId and courseId required' });
  const id = nextId('CC');
  await db.execute({ sql: 'INSERT INTO class_courses (id, classId, courseId) VALUES (?, ?, ?)', args: [id, classId, courseId] });
  res.status(201).json({ success: true });
});

// Create course
app.post('/api/courses', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const { name, code, branchId } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Course name required' });
  const brId = branchId || req.user.branchId;
  const id = nextId('CRS');
  await db.execute({ sql: 'INSERT INTO courses (id, branchId, name, code) VALUES (?, ?, ?, ?)', args: [id, brId, name, code || ''] });
  res.status(201).json({ id, name, code });
});

// Assign multiple courses to a class at once
app.post('/api/classes/:id/courses', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const { courseIds } = req.body || {};
  if (!courseIds || !Array.isArray(courseIds)) return res.status(400).json({ error: 'courseIds array required' });
  // Clear existing
  await db.execute({ sql: 'DELETE FROM class_courses WHERE classId = ?', args: [req.params.id] });
  for (const courseId of courseIds) {
    const id = nextId('CC');
    await db.execute({ sql: 'INSERT INTO class_courses (id, classId, courseId) VALUES (?, ?, ?)', args: [id, req.params.id, courseId] });
  }
  res.json({ success: true, count: courseIds.length });
});

// Create a new section inside an existing class (e.g. add "Class 1B" to a class that has "Class 1A").
// The new section is a new row in the classes table with the same `name` but a different `section` letter.
// Course assignments from the parent class are copied so the new section inherits the same curriculum.
app.post('/api/classes/:id/sections', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const parent = await db.execute({ sql: 'SELECT * FROM classes WHERE id = ?', args: [req.params.id] });
  if (parent.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
  const parentClass = parent.rows[0];

  // Determine the next section letter (A, B, C, ...)
  const existing = await db.execute({ sql: 'SELECT section FROM classes WHERE branchId = ? AND name = ?', args: [parentClass.branchId, parentClass.name] });
  const usedLetters = new Set(existing.rows.map(r => (r.section || 'A').toUpperCase()));
  let nextLetter = 'A';
  while (usedLetters.has(nextLetter) && nextLetter.charCodeAt(0) < 90) {
    nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
  }

  // Optionally accept a custom section letter from the body
  const customSection = (req.body?.section || '').trim().toUpperCase();
  const section = customSection && !usedLetters.has(customSection) ? customSection : nextLetter;

  const id = nextId('CLS');
  await db.execute({ sql: 'INSERT INTO classes (id, branchId, name, section) VALUES (?, ?, ?, ?)', args: [id, parentClass.branchId, parentClass.name, section] });

  // Copy course assignments from the parent class so the new section inherits the same curriculum
  const parentCourses = await db.execute({ sql: 'SELECT courseId FROM class_courses WHERE classId = ?', args: [parentClass.id] });
  for (const row of parentCourses.rows) {
    const ccId = nextId('CC');
    await db.execute({ sql: 'INSERT INTO class_courses (id, classId, courseId) VALUES (?, ?, ?)', args: [ccId, id, row.courseId] });
  }

  res.status(201).json({ id, branchId: parentClass.branchId, name: parentClass.name, section, courseCount: parentCourses.rows.length });
});

// Delete a section (only if it has no students assigned)
app.delete('/api/classes/:id', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const cls = await db.execute({ sql: 'SELECT * FROM classes WHERE id = ?', args: [req.params.id] });
  if (cls.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
  const c = cls.rows[0];
  // Don't allow deleting the only remaining section for a class name
  const siblings = await db.execute({ sql: 'SELECT id FROM classes WHERE branchId = ? AND name = ?', args: [c.branchId, c.name] });
  if (siblings.rows.length <= 1) return res.status(400).json({ error: 'Cannot delete the only section for this class' });
  // Block deletion if any students are assigned
  const students = await db.execute({ sql: 'SELECT id FROM users WHERE class = ? AND section = ? AND role = ?', args: [c.name, c.section, 'student'] });
  if (students.rows.length > 0) return res.status(400).json({ error: 'Cannot delete section with students assigned' });
  await db.execute({ sql: 'DELETE FROM class_courses WHERE classId = ?', args: [req.params.id] });
  await db.execute({ sql: 'DELETE FROM classes WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

// Get teacher's classes + courses
app.get('/api/teacher/classes', requireAuth, requireRole('teacher'), async (req, res) => {
  const r = await db.execute({
    sql: `SELECT DISTINCT c.*, tcc.courseId FROM classes c
          JOIN teacher_class_courses tcc ON c.id = tcc.classId
          WHERE tcc.teacherId = ?`,
    args: [req.user.id]
  });
  // Group by class
  const classMap = {};
  for (const row of r.rows) {
    if (!classMap[row.id]) {
      classMap[row.id] = { id: row.id, name: row.name, section: row.section, branchId: row.branchId, courses: [] };
    }
    const courseR = await db.execute({ sql: 'SELECT * FROM courses WHERE id = ?', args: [row.courseId] });
    if (courseR.rows.length > 0) classMap[row.id].courses.push(courseR.rows[0]);
  }
  res.json(Object.values(classMap));
});

// Get student's courses (from their class)
app.get('/api/student/courses', requireAuth, requireRole('student'), async (req, res) => {
  // Find student's class
  const classR = await db.execute({ sql: 'SELECT * FROM classes WHERE branchId = ? AND name = ?', args: [req.user.branchId, req.user.class] });
  if (classR.rows.length === 0) return res.json([]);
  const classId = classR.rows[0].id;
  const r = await db.execute({
    sql: `SELECT c.* FROM courses c JOIN class_courses cc ON c.id = cc.courseId WHERE cc.classId = ?`,
    args: [classId]
  });
  res.json(r.rows);
});

// ===================== ANNOUNCEMENTS =====================
app.get('/api/announcements', requireAuth, async (req, res) => {
  let sql = 'SELECT * FROM announcements WHERE 1=1';
  let args = [];
  // Scope: user sees announcements targeted to them
  if (req.user.role === 'institute-admin') {
    sql += ' AND (instituteId = ? OR targetScope = ?)';
    args = [req.user.instituteId, 'all'];
  } else if (req.user.role === 'branch-manager') {
    sql += ' AND (branchId = ? OR instituteId = ? OR targetScope = ?)';
    args = [req.user.branchId, req.user.instituteId, 'all'];
  } else if (req.user.role === 'teacher' || req.user.role === 'student') {
    // See announcements for their role, branch, or class
    sql += ' AND (targetRole = ? OR targetRole IS NULL OR branchId = ? OR instituteId = ?)';
    args = [req.user.role, req.user.branchId, req.user.instituteId];
  }
  sql += ' ORDER BY createdAt DESC LIMIT 50';
  const r = await db.execute({ sql, args });
  res.json(r.rows);
});

app.post('/api/announcements', requireAuth, async (req, res) => {
  const { title, message, targetRole, targetScope, targetIds, classId } = req.body || {};
  if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
  const id = nextId('ANN');
  await db.execute({
    sql: `INSERT INTO announcements (id, senderId, senderRole, title, message, targetRole, targetScope, targetIds, instituteId, branchId, classId)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, req.user.id, req.user.role, title, message, targetRole || null, targetScope || 'all',
      targetIds ? JSON.stringify(targetIds) : null, req.user.instituteId || null, req.user.branchId || null, classId || null],
  });
  res.status(201).json({ id, success: true });
});

// ===================== COURSE MATERIALS =====================
app.get('/api/course-materials', requireAuth, async (req, res) => {
  const { classId, courseId, teacherId } = req.query;
  let sql = 'SELECT * FROM course_materials WHERE 1=1';
  let args = [];
  if (classId) { sql += ' AND classId = ?'; args.push(classId); }
  if (courseId) { sql += ' AND courseId = ?'; args.push(courseId); }
  if (teacherId) { sql += ' AND teacherId = ?'; args.push(teacherId); }
  sql += ' ORDER BY createdAt DESC';
  const r = await db.execute({ sql, args });
  // Don't send fileData in list view
  res.json(r.rows.map(m => ({ ...m, fileData: undefined })));
});

app.post('/api/course-materials', requireAuth, requireRole('teacher'), async (req, res) => {
  const { classId, courseId, title, description, fileType, fileName, fileData, linkUrl } = req.body || {};
  if (!classId || !courseId || !title) return res.status(400).json({ error: 'classId, courseId and title required' });
  const id = nextId('MAT');
  await db.execute({
    sql: `INSERT INTO course_materials (id, teacherId, classId, courseId, title, description, fileType, fileName, fileData, linkUrl)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, req.user.id, classId, courseId, title, description || '', fileType || '', fileName || '', fileData || '', linkUrl || ''],
  });
  res.status(201).json({ id, title, success: true });
});

app.get('/api/course-materials/:id/download', requireAuth, async (req, res) => {
  const r = await db.execute({ sql: 'SELECT * FROM course_materials WHERE id = ?', args: [req.params.id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  const mat = r.rows[0];
  if (mat.linkUrl) return res.json({ linkUrl: mat.linkUrl });
  if (!mat.fileData) return res.status(404).json({ error: 'No file data' });
  const buffer = Buffer.from(mat.fileData, 'base64');
  res.setHeader('Content-Type', mat.fileType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${mat.fileName || 'download'}"`);
  res.send(buffer);
});

// ===================== PLATFORM OVERVIEW =====================
app.get('/api/platform/overview', requireAuth, requireRole('super-admin'), async (req, res) => {
  const instR = await db.execute('SELECT COUNT(*) as count FROM institutes');
  const brR = await db.execute('SELECT COUNT(*) as count FROM branches');
  const stuR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE role = ?', args: ['student'] });
  const staffR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE role IN (?, ?, ?)', args: ['teacher', 'branch-manager', 'institute-admin'] });
  const feeR = await db.execute({ sql: 'SELECT COALESCE(SUM(amount), 0) as total FROM fees WHERE status = ?', args: ['Paid'] });
  const activeR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM institutes WHERE blocked = 0' });
  res.json({
    institutes: instR.rows[0].count,
    branches: brR.rows[0].count,
    totalStudents: stuR.rows[0].count,
    totalStaff: staffR.rows[0].count,
    totalRevenue: feeR.rows[0].total,
    activeInstitutes: activeR.rows[0].count,
    platformUsers: stuR.rows[0].count + staffR.rows[0].count + 1,
  });
});

// ===================== SCOPED STATS =====================
app.get('/api/scoped/stats', requireAuth, async (req, res) => {
  const { instituteId, branchId } = req.query;
  if (branchId) {
    const stuR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE branchId = ? AND role = ?', args: [branchId, 'student'] });
    const tchR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE branchId = ? AND role = ?', args: [branchId, 'teacher'] });
    res.json({ students: stuR.rows[0].count, teachers: tchR.rows[0].count });
  } else if (instituteId) {
    const stuR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE instituteId = ? AND role = ?', args: [instituteId, 'student'] });
    const staffR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE instituteId = ? AND role IN (?, ?)', args: [instituteId, 'teacher', 'branch-manager'] });
    const brR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM branches WHERE instituteId = ?', args: [instituteId] });
    res.json({ students: stuR.rows[0].count, staff: staffR.rows[0].count, branches: brR.rows[0].count });
  } else {
    res.json({ students: 0, staff: 0, branches: 0 });
  }
});

// ===================== ATTENDANCE =====================
app.post('/api/attendance', requireAuth, requireRole('teacher'), async (req, res) => {
  const { classId, date, records } = req.body || {};
  if (!date || !records) return res.status(400).json({ error: 'date and records required' });
  const id = nextId('ATT');
  await db.execute({
    sql: 'INSERT INTO attendance (id, branchId, classId, date, teacherId, records) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, req.user.branchId, classId || null, date, req.user.id, JSON.stringify(records)],
  });
  res.status(201).json({ id, success: true });
});

app.get('/api/attendance', requireAuth, async (req, res) => {
  const { classId, studentId } = req.query;
  let sql = 'SELECT * FROM attendance WHERE 1=1';
  let args = [];
  if (classId) { sql += ' AND classId = ?'; args.push(classId); }
  sql += ' ORDER BY date DESC LIMIT 50';
  const r = await db.execute({ sql, args });
  let entries = [];
  for (const rec of r.rows) {
    const records = JSON.parse(rec.records);
    if (studentId) {
      const entry = records.find(e => e.studentId === studentId);
      if (entry) entries.push({ id: rec.id, date: rec.date, status: entry.status });
    } else {
      entries.push({ ...rec, records });
    }
  }
  if (studentId) {
    res.json({ entries, total: entries.length, present: entries.filter(e=>e.status==='Present').length, absent: entries.filter(e=>e.status==='Absent').length, late: entries.filter(e=>e.status==='Late').length });
  } else {
    res.json(entries);
  }
});

// ===================== RESULTS =====================
app.post('/api/results', requireAuth, requireRole('teacher'), async (req, res) => {
  const { exam, courseId, totalMarks, date, records, classId } = req.body || {};
  if (!exam || !records) return res.status(400).json({ error: 'exam and records required' });
  const id = nextId('RES');
  await db.execute({
    sql: 'INSERT INTO results (id, branchId, exam, courseId, teacherId, totalMarks, date, records) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, req.user.branchId, exam, courseId || null, req.user.id, totalMarks || 100, date || new Date().toISOString().slice(0,10), JSON.stringify(records)],
  });
  res.status(201).json({ id, success: true });
});

app.get('/api/results', requireAuth, async (req, res) => {
  const { courseId, studentId } = req.query;
  let sql = 'SELECT * FROM results WHERE 1=1';
  let args = [];
  if (courseId) { sql += ' AND courseId = ?'; args.push(courseId); }
  sql += ' ORDER BY date DESC LIMIT 50';
  const r = await db.execute({ sql, args });
  let entries = [];
  for (const rec of r.rows) {
    const records = JSON.parse(rec.records);
    if (studentId) {
      const entry = records.find(e => e.studentId === studentId);
      if (entry) entries.push({ id: rec.id, exam: rec.exam, courseId: rec.courseId, totalMarks: rec.totalMarks, marks: entry.marks, grade: entry.grade, date: rec.date });
    } else {
      entries.push({ ...rec, records });
    }
  }
  res.json(entries);
});

app.get('/api/health', async (req, res) => {
  try {
    const r = await db.execute('SELECT COUNT(*) as count FROM users');
    res.json({ ok: true, service: 'esm-api', port: PORT, users: r.rows[0].count, db: 'turso' });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// Initialize DB then start
initDB().then(() => {
  app.listen(PORT, () => console.log(`ESM API server running on http://localhost:${PORT} (Turso DB)`));
}).catch(e => {
  console.error('DB init failed:', e);
  app.listen(PORT, () => console.log(`ESM API server running on http://localhost:${PORT} (DB init failed)`));
});
