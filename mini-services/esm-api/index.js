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
const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_DURATION = 2 * 60 * 1000; // 2 min lockout (was 5)

// Auto-clear expired rate-limit locks every 30 seconds so users aren't stuck
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttempts.entries()) {
    if (val.lockedUntil && now > val.lockedUntil) {
      loginAttempts.delete(key);
    }
    // Also clear old attempt counts after 10 minutes of inactivity
    if (!val.lockedUntil && val.count > 0 && now - (val.lastAttempt || 0) > 10 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
}, 30 * 1000);

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
// Helper: register a failed attempt and return the proper error response
function registerFailedAttempt(rateKey) {
  const current = loginAttempts.get(rateKey) || { count: 0, lockedUntil: 0, lastAttempt: 0 };
  current.count++;
  current.lastAttempt = Date.now();
  // Lock the account when the threshold is reached
  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_DURATION;
    current.count = 0; // reset count so after lockout expires they get a fresh slate
    loginAttempts.set(rateKey, current);
    const mins = Math.ceil(LOCKOUT_DURATION / 60000);
    return { status: 429, error: `Too many failed attempts. Account locked for ${mins} min. Please try again later.` };
  }
  loginAttempts.set(rateKey, current);
  const remaining = MAX_LOGIN_ATTEMPTS - current.count;
  return { status: 401, error: `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} left before lockout.` };
}

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
    return res.status(429).json({ error: `Too many failed attempts. Account locked for ${remaining} min. Please try again later.` });
  }

  try {
    // Find user by email OR rollNo/ID
    let result = await db.execute({ sql: 'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(rollNo) = ?', args: [identifier, identifier.toLowerCase()] });

    if (result.rows.length === 0) {
      const r = registerFailedAttempt(rateKey);
      return res.status(r.status).json({ error: r.error });
    }

    // If multiple results (e.g. same rollNo across branches), filter by name if provided
    let u = result.rows[0];
    if (userName && result.rows.length > 1) {
      const byName = result.rows.find(r => String(r.name).toLowerCase().trim() === userName);
      if (byName) u = byName;
    }
    // If name provided, verify it matches
    if (userName && String(u.name).toLowerCase().trim() !== userName) {
      const r = registerFailedAttempt(rateKey);
      return res.status(r.status).json({ error: r.error });
    }

    if (u.password !== password) {
      const r = registerFailedAttempt(rateKey);
      return res.status(r.status).json({ error: r.error });
    }
    if (u.status !== 'Active') return res.status(403).json({ error: 'Account is ' + u.status });

    // Check if user/institute/branch is blocked — STILL ALLOW LOGIN but flag it
    // The user will sign in successfully, then see a "blocked" error page in their portal
    let blockedMessage = null;
    if (u.blocked === 1) {
      blockedMessage = 'Your account has been blocked by your administration. Please contact your administrator.';
    } else if (u.instituteId && u.role !== 'super-admin') {
      const inst = await db.execute({ sql: 'SELECT blocked FROM institutes WHERE id = ?', args: [u.instituteId] });
      if (inst.rows.length > 0 && inst.rows[0].blocked === 1) {
        blockedMessage = 'Your institute access has been blocked by the platform administration. Please contact your administrator.';
      }
    }
    if (!blockedMessage && u.branchId && u.role !== 'super-admin') {
      const br = await db.execute({ sql: 'SELECT blocked FROM branches WHERE id = ?', args: [u.branchId] });
      if (br.rows.length > 0 && br.rows[0].blocked === 1) {
        blockedMessage = 'Your branch access has been blocked. Please contact your institute administrator.';
      }
    }

    loginAttempts.delete(rateKey);
    const token = await createSession(u);
    const userProfile = buildUserProfile(u);
    // If blocked, add the blocked message to the user profile so the frontend can show it
    if (blockedMessage) {
      userProfile.blockedMessage = blockedMessage;
    }
    res.json({ token, user: userProfile, mustChangePassword: u.mustChangePassword === 1 });
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

// DELETE institute (cascades — deletes branches, users, classes, courses, etc.)
app.delete('/api/institutes/:id', requireAuth, requireRole('super-admin'), async (req, res) => {
  const instId = req.params.id;
  // Delete in order (child tables first)
  await db.execute({ sql: 'DELETE FROM sessions WHERE userId IN (SELECT id FROM users WHERE instituteId = ?)', args: [instId] });
  await db.execute({ sql: 'DELETE FROM teacher_class_courses WHERE teacherId IN (SELECT id FROM users WHERE instituteId = ?)', args: [instId] });
  await db.execute({ sql: 'DELETE FROM course_materials WHERE teacherId IN (SELECT id FROM users WHERE instituteId = ?)', args: [instId] });
  await db.execute({ sql: 'DELETE FROM attendance WHERE branchId IN (SELECT id FROM branches WHERE instituteId = ?)', args: [instId] });
  await db.execute({ sql: 'DELETE FROM results WHERE branchId IN (SELECT id FROM branches WHERE instituteId = ?)', args: [instId] });
  await db.execute({ sql: 'DELETE FROM diary WHERE branchId IN (SELECT id FROM branches WHERE instituteId = ?)', args: [instId] });
  await db.execute({ sql: 'DELETE FROM class_courses WHERE classId IN (SELECT id FROM classes WHERE branchId IN (SELECT id FROM branches WHERE instituteId = ?))', args: [instId] });
  await db.execute({ sql: 'DELETE FROM classes WHERE branchId IN (SELECT id FROM branches WHERE instituteId = ?)', args: [instId] });
  await db.execute({ sql: 'DELETE FROM courses WHERE branchId IN (SELECT id FROM branches WHERE instituteId = ?)', args: [instId] });
  await db.execute({ sql: 'DELETE FROM announcements WHERE instituteId = ?', args: [instId] });
  await db.execute({ sql: 'DELETE FROM users WHERE instituteId = ? AND role != ?', args: [instId, 'super-admin'] });
  await db.execute({ sql: 'DELETE FROM branches WHERE instituteId = ?', args: [instId] });
  await db.execute({ sql: 'DELETE FROM institutes WHERE id = ?', args: [instId] });
  res.json({ success: true });
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

// DELETE branch (cascades — deletes teachers, students, classes, courses, etc.)
app.delete('/api/branches/:id', requireAuth, requireRole('institute-admin', 'super-admin'), async (req, res) => {
  const brId = req.params.id;
  await db.execute({ sql: 'DELETE FROM sessions WHERE userId IN (SELECT id FROM users WHERE branchId = ?)', args: [brId] });
  await db.execute({ sql: 'DELETE FROM teacher_class_courses WHERE teacherId IN (SELECT id FROM users WHERE branchId = ?)', args: [brId] });
  await db.execute({ sql: 'DELETE FROM course_materials WHERE teacherId IN (SELECT id FROM users WHERE branchId = ?)', args: [brId] });
  await db.execute({ sql: 'DELETE FROM attendance WHERE branchId = ?', args: [brId] });
  await db.execute({ sql: 'DELETE FROM results WHERE branchId = ?', args: [brId] });
  await db.execute({ sql: 'DELETE FROM diary WHERE branchId = ?', args: [brId] });
  await db.execute({ sql: 'DELETE FROM class_courses WHERE classId IN (SELECT id FROM classes WHERE branchId = ?)', args: [brId] });
  await db.execute({ sql: 'DELETE FROM classes WHERE branchId = ?', args: [brId] });
  await db.execute({ sql: 'DELETE FROM courses WHERE branchId = ?', args: [brId] });
  await db.execute({ sql: 'DELETE FROM announcements WHERE branchId = ?', args: [brId] });
  await db.execute({ sql: 'DELETE FROM fees WHERE branchId = ?', args: [brId] });
  await db.execute({ sql: 'DELETE FROM users WHERE branchId = ?', args: [brId] });
  // Decrement institute branch count
  const br = await db.execute({ sql: 'SELECT instituteId FROM branches WHERE id = ?', args: [brId] });
  if (br.rows.length > 0) {
    await db.execute({ sql: 'UPDATE institutes SET branches = MAX(branches - 1, 0) WHERE id = ?', args: [br.rows[0].instituteId] });
  }
  await db.execute({ sql: 'DELETE FROM branches WHERE id = ?', args: [brId] });
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

// ===================== TEACHER ANALYTICS =====================
// Comprehensive academic + activity analytics for the Teacher dashboard.
app.get('/api/teacher/analytics', requireAuth, requireRole('teacher'), async (req, res) => {
  const teacherId = req.user.id;
  try {
    // 1. Teacher's classes + courses
    const tccR = await db.execute({
      sql: `SELECT tcc.classId, tcc.courseId, c.name as className, c.section, c.branchId,
                   co.name as courseName, co.code as courseCode
            FROM teacher_class_courses tcc
            LEFT JOIN classes c ON tcc.classId = c.id
            LEFT JOIN courses co ON tcc.courseId = co.id
            WHERE tcc.teacherId = ?`,
      args: [teacherId],
    });
    const assignments = tccR.rows;
    const classIds = [...new Set(assignments.map(a => a.classId))];
    const courseIds = [...new Set(assignments.map(a => a.courseId))];

    // 2. Total students across all the teacher's classes (unique by classId)
    let totalStudents = 0;
    const classStudentCounts = [];
    for (const cid of classIds) {
      const cntR = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM users WHERE role = ? AND branchId = ? AND class = (SELECT name FROM classes WHERE id = ?)',
        args: ['student', assignments.find(a => a.classId === cid)?.branchId, cid],
      });
      const n = cntR.rows[0]?.count || 0;
      totalStudents += n;
      const cls = assignments.find(a => a.classId === cid);
      classStudentCounts.push({ classId: cid, className: cls?.className, section: cls?.section, students: n });
    }

    // 3. Attendance sessions taken by this teacher
    const attR = await db.execute({
      sql: 'SELECT id, date, classId, records FROM attendance WHERE teacherId = ? ORDER BY date DESC LIMIT 50',
      args: [teacherId],
    });
    const attendanceSessions = attR.rows;
    let attendanceRecords = 0, presentCount = 0, absentCount = 0, lateCount = 0;
    for (const s of attendanceSessions) {
      try {
        const recs = JSON.parse(s.records);
        for (const r of recs) {
          attendanceRecords++;
          if (r.status === 'Present') presentCount++;
          else if (r.status === 'Absent') absentCount++;
          else if (r.status === 'Late') lateCount++;
        }
      } catch {}
    }
    const attendanceRate = attendanceRecords > 0 ? Math.round((presentCount / attendanceRecords) * 100) : 0;

    // 4. Results posted by this teacher
    const resR = await db.execute({
      sql: 'SELECT id, exam, courseId, classId, totalMarks, date, records FROM results WHERE teacherId = ? ORDER BY date DESC LIMIT 50',
      args: [teacherId],
    });
    const resultsPosted = resR.rows;
    let totalResultsRecords = 0;
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;
    const examBreakdown = [];
    for (const r of resultsPosted) {
      try {
        const recs = JSON.parse(r.records);
        for (const rec of recs) {
          totalResultsRecords++;
          totalMarksObtained += Number(rec.marks) || 0;
          totalMaxMarks += Number(r.totalMarks) || 100;
        }
        examBreakdown.push({
          id: r.id, exam: r.exam, date: r.date,
          courseId: r.courseId, classId: r.classId,
          totalMarks: r.totalMarks, students: recs.length,
          avgMarks: recs.length > 0 ? Math.round((recs.reduce((s, x) => s + (Number(x.marks) || 0), 0) / recs.length) * 10) / 10 : 0,
        });
      } catch {}
    }
    const avgScore = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

    // 5. Diary entries by this teacher
    const diaryR = await db.execute({
      sql: 'SELECT id, title, subject, classId, courseId, due, createdAt FROM diary WHERE teacherId = ? ORDER BY createdAt DESC LIMIT 20',
      args: [teacherId],
    });
    const diaryEntries = diaryR.rows;

    // 6. Course materials uploaded
    const matR = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM course_materials WHERE teacherId = ?',
      args: [teacherId],
    });
    const materialsCount = matR.rows[0]?.count || 0;

    // 7. Attendance trend (last 8 sessions) for chart
    const attendanceTrend = attendanceSessions.slice(0, 8).reverse().map((s, i) => {
      try {
        const recs = JSON.parse(s.records);
        const present = recs.filter(r => r.status === 'Present').length;
        const total = recs.length;
        return {
          label: s.date ? s.date.slice(5) : `S${i + 1}`,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
          present, absent: recs.filter(r => r.status === 'Absent').length, total,
        };
      } catch {
        return { label: `S${i + 1}`, rate: 0, present: 0, absent: 0, total: 0 };
      }
    });

    // 8. Class performance (avg score per class)
    const classPerformance = classStudentCounts.map(cs => {
      const classResults = resultsPosted.filter(r => r.classId === cs.classId);
      let sum = 0, count = 0;
      for (const r of classResults) {
        try {
          const recs = JSON.parse(r.records);
          for (const rec of recs) { sum += Number(rec.marks) || 0; count++; }
        } catch {}
      }
      return {
        classId: cs.classId,
        className: cs.className,
        section: cs.section,
        students: cs.students,
        avgScore: count > 0 ? Math.round((sum / count / (classResults[0]?.totalMarks || 100)) * 100) : 0,
        examsConducted: classResults.length,
      };
    });

    res.json({
      kpi: {
        totalClasses: classIds.length,
        totalCourses: courseIds.length,
        totalStudents,
        attendanceSessions: attendanceSessions.length,
        attendanceRate,
        attendanceRecords,
        presentCount,
        absentCount,
        lateCount,
        resultsPosted: resultsPosted.length,
        totalResultsRecords,
        avgScore,
        diaryEntries: diaryEntries.length,
        materialsUploaded: materialsCount,
      },
      assignments,
      attendanceTrend,
      classPerformance,
      examBreakdown: examBreakdown.slice(0, 10),
      recentDiary: diaryEntries.slice(0, 5),
      recentResults: examBreakdown.slice(0, 5),
    });
  } catch (e) {
    console.error('Teacher analytics error:', e);
    res.status(500).json({ error: 'Failed to load teacher analytics: ' + e.message });
  }
});

// ===================== STUDENT ANALYTICS =====================
// Comprehensive academic + fee analytics for the Student dashboard.
app.get('/api/student/analytics', requireAuth, requireRole('student'), async (req, res) => {
  const studentId = req.user.id;
  try {
    // 1. Attendance records for this student
    const attR = await db.execute({
      sql: 'SELECT id, date, classId, records FROM attendance ORDER BY date DESC LIMIT 100',
      args: [],
    });
    let presentCount = 0, absentCount = 0, lateCount = 0, totalSessions = 0;
    const attendanceTrend = [];
    for (const s of attR.rows) {
      try {
        const recs = JSON.parse(s.records);
        const entry = recs.find(r => r.studentId === studentId);
        if (entry) {
          totalSessions++;
          if (entry.status === 'Present') presentCount++;
          else if (entry.status === 'Absent') absentCount++;
          else if (entry.status === 'Late') lateCount++;
          attendanceTrend.push({
            date: s.date,
            status: entry.status,
            label: s.date ? s.date.slice(5) : '',
          });
        }
      } catch {}
    }
    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    // 2. Results for this student
    const resR = await db.execute({
      sql: 'SELECT id, exam, courseId, classId, totalMarks, date, records FROM results ORDER BY date DESC LIMIT 50',
      args: [],
    });
    const studentResults = [];
    let totalMarksObtained = 0, totalMaxMarks = 0;
    for (const r of resR.rows) {
      try {
        const recs = JSON.parse(r.records);
        const entry = recs.find(rec => rec.studentId === studentId);
        if (entry) {
          studentResults.push({
            id: r.id, exam: r.exam, courseId: r.courseId, classId: r.classId,
            date: r.date, totalMarks: r.totalMarks, marks: entry.marks, grade: entry.grade,
          });
          totalMarksObtained += Number(entry.marks) || 0;
          totalMaxMarks += Number(r.totalMarks) || 100;
        }
      } catch {}
    }
    const avgScore = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

    // 3. Fee invoices
    const invR = await db.execute({
      sql: 'SELECT id, month, year, amount, status, paidDate, paidAmount, challanNo, createdAt FROM fee_invoices WHERE studentId = ? ORDER BY year DESC, createdAt DESC',
      args: [studentId],
    });
    const invoices = invR.rows;
    const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const totalPending = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);

    // 4. Diary entries for student's class
    const diaryR = await db.execute({
      sql: 'SELECT id, title, subject, classId, courseId, due, createdAt FROM diary WHERE branchId = ? ORDER BY createdAt DESC LIMIT 10',
      args: [req.user.branchId],
    });
    const diaryEntries = diaryR.rows;

    // 5. Course materials for student's courses
    const matR = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM course_materials WHERE classId IN (SELECT id FROM classes WHERE branchId = ? AND name = ?)',
      args: [req.user.branchId, req.user.class],
    });
    const materialsCount = matR.rows[0]?.count || 0;

    // 6. Grade distribution
    const gradeDistribution = {};
    for (const r of studentResults) {
      const grade = r.grade || (r.marks / r.totalMarks >= 0.9 ? 'A+' : r.marks / r.totalMarks >= 0.8 ? 'A' : r.marks / r.totalMarks >= 0.7 ? 'B' : r.marks / r.totalMarks >= 0.6 ? 'C' : r.marks / r.totalMarks >= 0.5 ? 'D' : 'F');
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    }

    // 7. Attendance trend (last 10 sessions) for chart
    const recentAttendanceTrend = attendanceTrend.slice(0, 10).reverse();

    res.json({
      kpi: {
        attendanceRate,
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        avgScore,
        totalResults: studentResults.length,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(i => i.status === 'Paid').length,
        unpaidInvoices: invoices.filter(i => i.status !== 'Paid').length,
        totalPaid,
        totalPending,
        diaryEntries: diaryEntries.length,
        materialsCount,
      },
      attendanceTrend: recentAttendanceTrend,
      recentResults: studentResults.slice(0, 5),
      gradeDistribution: Object.entries(gradeDistribution).map(([grade, count]) => ({ grade, count })),
      recentDiary: diaryEntries.slice(0, 5),
    });
  } catch (e) {
    console.error('Student analytics error:', e);
    res.status(500).json({ error: 'Failed to load student analytics: ' + e.message });
  }
});

// ===================== ANNOUNCEMENTS =====================
app.get('/api/announcements', requireAuth, async (req, res) => {
  let sql = 'SELECT * FROM announcements WHERE 1=1';
  let args = [];

  if (req.user.role === 'super-admin') {
    // Super admin only sees announcements sent BY super-admin (to institutes)
    sql += ' AND senderRole = ?';
    args = ['super-admin'];
  } else if (req.user.role === 'institute-admin') {
    // Institute admin sees: announcements from super-admin targeted to their institute + their own
    sql += ' AND ((senderRole = ? AND (targetScope = ? OR instituteId = ?)) OR senderId = ?)';
    args = ['super-admin', 'all', req.user.instituteId, req.user.id];
  } else if (req.user.role === 'branch-manager') {
    // Branch manager sees: announcements from institute-admin targeted to them + their own
    sql += ' AND ((senderRole = ? AND (targetScope = ? OR targetRole IN (?, ?) OR branchId = ?)) OR senderId = ?)';
    args = ['institute-admin', 'all', 'branch-manager', 'all', req.user.branchId, req.user.id];
  } else if (req.user.role === 'teacher') {
    // Teacher sees: announcements targeted to teachers in their branch/class + from branch-manager
    sql += ' AND ((senderRole = ? AND (targetRole = ? OR targetScope = ?)) OR (senderRole = ? AND (branchId = ? OR classId IN (SELECT id FROM classes WHERE branchId = ?))))';
    args = ['institute-admin', 'teacher', 'all', 'branch-manager', req.user.branchId, req.user.branchId];
    // Also add class-specific announcements
    // Get teacher's class IDs from teacher_class_courses
    const teacherClasses = await db.execute({ sql: 'SELECT DISTINCT classId FROM teacher_class_courses WHERE teacherId = ?', args: [req.user.id] });
    const classIds = teacherClasses.rows.map(r => r.classId);
    if (classIds.length > 0) {
      const placeholders = classIds.map(() => '?').join(',');
      sql += ` OR classId IN (${placeholders})`;
      args.push(...classIds);
    }
  } else if (req.user.role === 'student') {
    // Student sees: announcements targeted to students in their branch/class
    sql += ' AND (targetRole = ? OR (senderRole = ? AND (branchId = ? OR classId = ?)))';
    args = ['student', 'branch-manager', req.user.branchId, null];
    // Also get class-specific announcements for the student's class
    const classR = await db.execute({ sql: 'SELECT id FROM classes WHERE branchId = ? AND name = ?', args: [req.user.branchId, req.user.class] });
    if (classR.rows.length > 0) {
      sql += ' OR classId = ?';
      args.push(classR.rows[0].id);
    }
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

// ===================== INSTITUTE FINANCE & ANALYTICS =====================
// Comprehensive finance + analytics for the Institute Admin dashboard.
// Returns: KPIs, monthly revenue, yearly revenue, branch performance, recent transactions, salary totals.
app.get('/api/institute/finance', requireAuth, requireRole('institute-admin', 'super-admin'), async (req, res) => {
  const instituteId = req.query.instituteId || req.user.instituteId;
  if (!instituteId) return res.json({ kpi: {}, monthlyRevenue: [], branchPerformance: [], recentTransactions: [] });

  try {
    // 1. All fee invoices for this institute (paid + unpaid)
    const invR = await db.execute({ sql: 'SELECT id, studentId, studentName, className, branchId, month, year, amount, status, paidDate, paidAmount, paymentMethod, challanNo, createdAt FROM fee_invoices WHERE instituteId = ? ORDER BY createdAt DESC', args: [instituteId] });
    const invoices = invR.rows;

    // 2. All salary payments for this institute
    const salR = await db.execute({ sql: 'SELECT id, teacherId, teacherName, branchId, month, year, amount, status, paidDate, paymentMethod, createdAt FROM salary_payments WHERE instituteId = ? ORDER BY createdAt DESC', args: [instituteId] });
    const salaries = salR.rows;

    // 3. Branches with student/teacher counts
    const brR = await db.execute({ sql: 'SELECT id, name, city, manager, students, teachers, status, blocked FROM branches WHERE instituteId = ?', args: [instituteId] });
    const branches = brR.rows;

    // 4. All teachers (for salary structure lookup)
    const tchR = await db.execute({ sql: 'SELECT id, name, email, branchId, status, blocked FROM users WHERE instituteId = ? AND role = ?', args: [instituteId, 'teacher'] });
    const teachers = tchR.rows;

    // 5. Salary structures (latest monthly salary per teacher)
    const salStructR = await db.execute({ sql: 'SELECT teacherId, monthlySalary FROM teacher_salaries WHERE instituteId = ?', args: [instituteId] });
    const salaryStruct = salStructR.rows;

    // 6. All students (count + class distribution)
    const stuR = await db.execute({ sql: 'SELECT id, name, class, section, branchId, status, blocked FROM users WHERE instituteId = ? AND role = ?', args: [instituteId, 'student'] });
    const students = stuR.rows;

    // ===== Compute KPIs =====
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const pendingFees = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalSalaryPaid = salaries.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const monthlySalaryExpense = teachers.reduce((sum, t) => {
      const ss = salaryStruct.find(s => s.teacherId === t.id);
      return sum + (ss ? Number(ss.monthlySalary) || 0 : 0);
    }, 0);
    const netBalance = totalRevenue - totalSalaryPaid;

    // ===== Monthly revenue (last 12 months) =====
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthFull = d.toLocaleString('en-US', { month: 'long' });
      const monthInv = invoices.filter(inv => inv.year === year && inv.month === monthFull && inv.status === 'Paid');
      const revenue = monthInv.reduce((s, inv) => s + (Number(inv.paidAmount) || 0), 0);
      const monthSal = salaries.filter(sal => sal.year === year && sal.month === monthFull);
      const salary = monthSal.reduce((s, sal) => s + (Number(sal.amount) || 0), 0);
      months.push({ month: monthName, year, revenue, salary, net: revenue - salary });
    }

    // ===== Yearly revenue (last 5 years) =====
    const currentYear = now.getFullYear();
    const years = [];
    for (let y = currentYear - 4; y <= currentYear; y++) {
      const yearInv = invoices.filter(inv => inv.year === y && inv.status === 'Paid');
      const revenue = yearInv.reduce((s, inv) => s + (Number(inv.paidAmount) || 0), 0);
      const yearSal = salaries.filter(sal => sal.year === y);
      const salary = yearSal.reduce((s, sal) => s + (Number(sal.amount) || 0), 0);
      years.push({ year: y, revenue, salary, net: revenue - salary });
    }

    // ===== Branch performance =====
    const branchPerformance = await Promise.all(branches.map(async (br) => {
      const brInv = invoices.filter(i => i.branchId === br.id);
      const brRevenue = brInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
      const brPending = brInv.filter(i => i.status !== 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const brSal = salaries.filter(s => s.branchId === br.id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
      // Get fresh student/teacher counts
      const stuCount = students.filter(s => s.branchId === br.id).length;
      const tchCount = teachers.filter(t => t.branchId === br.id).length;
      return {
        id: br.id,
        name: br.name,
        city: br.city || '',
        manager: br.manager || '—',
        status: br.blocked === 1 ? 'Blocked' : (br.status || 'Active'),
        students: stuCount,
        teachers: tchCount,
        revenue: brRevenue,
        pendingFees: brPending,
        salaryPaid: brSal,
        net: brRevenue - brSal,
        invoices: brInv.length,
      };
    }));

    // ===== Recent transactions (last 10) =====
    const recentPaidInvoices = invoices
      .filter(i => i.status === 'Paid')
      .slice(0, 10)
      .map(i => ({
        id: i.id,
        type: 'Fee Payment',
        date: i.paidDate || i.createdAt,
        party: i.studentName || 'Student',
        branchId: i.branchId,
        amount: Number(i.paidAmount) || 0,
        method: i.paymentMethod || 'Cash',
        status: 'Paid',
      }));
    const recentSalaries = salaries
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        type: 'Salary Payout',
        date: s.paidDate || s.createdAt,
        party: s.teacherName || 'Teacher',
        branchId: s.branchId,
        amount: Number(s.amount) || 0,
        method: s.paymentMethod || 'Bank Transfer',
        status: s.status || 'Paid',
      }));
    const recentTransactions = [...recentPaidInvoices, ...recentSalaries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);

    // ===== Class distribution (for students analytics) =====
    const classMap = {};
    for (const s of students) {
      const c = s.class || 'Unassigned';
      if (!classMap[c]) classMap[c] = { class: c, students: 0, paid: 0, pending: 0 };
      classMap[c].students++;
      const sInv = invoices.filter(i => i.studentId === s.id);
      classMap[c].paid += sInv.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
      classMap[c].pending += sInv.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    }
    const classDistribution = Object.values(classMap).sort((a, b) => b.students - a.students);

    // ===== Per-student fee summary =====
    const studentFeeSummary = students.map(s => {
      const sInv = invoices.filter(i => i.studentId === s.id);
      const paid = sInv.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
      const pending = sInv.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const branch = branches.find(b => b.id === s.branchId);
      return {
        id: s.id,
        name: s.name,
        class: s.class || '—',
        section: s.section || 'A',
        branch: branch?.name || '—',
        branchId: s.branchId,
        status: s.blocked === 1 ? 'Blocked' : (s.status || 'Active'),
        invoices: sInv.length,
        paid,
        pending,
        total: paid + pending,
      };
    }).sort((a, b) => b.pending - a.pending);

    // ===== Per-teacher salary summary =====
    const teacherSalarySummary = teachers.map(t => {
      const ss = salaryStruct.find(s => s.teacherId === t.id);
      const monthlySalary = ss ? Number(ss.monthlySalary) || 0 : 0;
      const tPayments = salaries.filter(p => p.teacherId === t.id);
      const totalPaid = tPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const lastPayment = tPayments[0];
      const branch = branches.find(b => b.id === t.branchId);
      return {
        id: t.id,
        name: t.name,
        email: t.email || '—',
        branch: branch?.name || '—',
        branchId: t.branchId,
        status: t.blocked === 1 ? 'Blocked' : (t.status || 'Active'),
        monthlySalary,
        totalPaid,
        lastPaidDate: lastPayment?.paidDate || null,
        paymentsCount: tPayments.length,
      };
    }).sort((a, b) => b.monthlySalary - a.monthlySalary);

    res.json({
      kpi: {
        branches: branches.length,
        students: students.length,
        teachers: teachers.length,
        totalRevenue,
        pendingFees,
        totalSalaryPaid,
        monthlySalaryExpense,
        netBalance,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(i => i.status === 'Paid').length,
        unpaidInvoices: invoices.filter(i => i.status !== 'Paid').length,
      },
      monthlyRevenue: months,
      yearlyRevenue: years,
      branchPerformance,
      recentTransactions,
      classDistribution,
      studentFeeSummary,
      teacherSalarySummary,
    });
  } catch (e) {
    console.error('Institute finance error:', e);
    res.status(500).json({ error: 'Failed to load finance data: ' + e.message });
  }
});

// ===================== BRANCH FINANCE & ANALYTICS =====================
// Branch-level finance for the Branch Manager dashboard.
// Returns: KPIs, monthly revenue, fee status breakdown, recent transactions, salary totals, class performance.
app.get('/api/branch/finance', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const branchId = req.query.branchId || req.user.branchId;
  if (!branchId) return res.json({ kpi: {}, monthlyRevenue: [], recentTransactions: [], classPerformance: [] });

  try {
    // 1. All fee invoices for this branch
    const invR = await db.execute({ sql: 'SELECT id, studentId, studentName, className, month, year, amount, status, paidDate, paidAmount, paymentMethod, challanNo, createdAt FROM fee_invoices WHERE branchId = ? ORDER BY createdAt DESC', args: [branchId] });
    const invoices = invR.rows;

    // 2. All salary payments for this branch
    const salR = await db.execute({ sql: 'SELECT id, teacherId, teacherName, month, year, amount, status, paidDate, paymentMethod, createdAt FROM salary_payments WHERE branchId = ? ORDER BY createdAt DESC', args: [branchId] });
    const salaries = salR.rows;

    // 3. Teachers + students
    const tchR = await db.execute({ sql: 'SELECT id, name, email, status, blocked FROM users WHERE branchId = ? AND role = ?', args: [branchId, 'teacher'] });
    const teachers = tchR.rows;
    const stuR = await db.execute({ sql: 'SELECT id, name, class, section, rollNo, status, blocked FROM users WHERE branchId = ? AND role = ?', args: [branchId, 'student'] });
    const students = stuR.rows;

    // 4. Salary structures
    const salStructR = await db.execute({ sql: 'SELECT teacherId, monthlySalary FROM teacher_salaries WHERE branchId = ?', args: [branchId] });
    const salaryStruct = salStructR.rows;

    // 5. Attendance records (for attendance rate)
    const attR = await db.execute({ sql: 'SELECT records FROM attendance WHERE branchId = ? ORDER BY date DESC LIMIT 30', args: [branchId] });
    let totalAtt = 0, presentAtt = 0;
    for (const a of attR.rows) {
      try {
        const recs = JSON.parse(a.records);
        for (const r of recs) {
          totalAtt++;
          if (r.status === 'Present') presentAtt++;
        }
      } catch {}
    }
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    // ===== KPIs =====
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const pendingFees = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalSalaryPaid = salaries.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const monthlySalaryExpense = teachers.reduce((sum, t) => {
      const ss = salaryStruct.find(s => s.teacherId === t.id);
      return sum + (ss ? Number(ss.monthlySalary) || 0 : 0);
    }, 0);
    const netBalance = totalRevenue - totalSalaryPaid;

    // ===== Monthly revenue (last 12 months) =====
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthFull = d.toLocaleString('en-US', { month: 'long' });
      const monthInv = invoices.filter(inv => inv.year === year && inv.month === monthFull && inv.status === 'Paid');
      const revenue = monthInv.reduce((s, inv) => s + (Number(inv.paidAmount) || 0), 0);
      const monthSal = salaries.filter(sal => sal.year === year && sal.month === monthFull);
      const salary = monthSal.reduce((s, sal) => s + (Number(sal.amount) || 0), 0);
      months.push({ month: monthName, year, revenue, salary, net: revenue - salary, paid: monthInv.length, unpaid: invoices.filter(inv => inv.year === year && inv.month === monthFull && inv.status !== 'Paid').length });
    }

    // ===== Fee status breakdown =====
    const feeStatus = {
      paid: invoices.filter(i => i.status === 'Paid').length,
      unpaid: invoices.filter(i => i.status !== 'Paid').length,
      paidAmount: totalRevenue,
      unpaidAmount: pendingFees,
    };

    // ===== Class performance =====
    const classMap = {};
    for (const s of students) {
      const c = s.class || 'Unassigned';
      if (!classMap[c]) classMap[c] = { class: c, students: 0, paid: 0, pending: 0 };
      classMap[c].students++;
      const sInv = invoices.filter(i => i.studentId === s.id);
      classMap[c].paid += sInv.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
      classMap[c].pending += sInv.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    }
    const classPerformance = Object.values(classMap).sort((a, b) => b.students - a.students);

    // ===== Recent transactions =====
    const recentPaidInvoices = invoices
      .filter(i => i.status === 'Paid')
      .slice(0, 8)
      .map(i => ({
        id: i.id, type: 'Fee Payment', date: i.paidDate || i.createdAt,
        party: i.studentName || 'Student', amount: Number(i.paidAmount) || 0,
        method: i.paymentMethod || 'Cash', status: 'Paid',
      }));
    const recentSalaries = salaries
      .slice(0, 8)
      .map(s => ({
        id: s.id, type: 'Salary Payout', date: s.paidDate || s.createdAt,
        party: s.teacherName || 'Teacher', amount: Number(s.amount) || 0,
        method: s.paymentMethod || 'Bank Transfer', status: s.status || 'Paid',
      }));
    const recentTransactions = [...recentPaidInvoices, ...recentSalaries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // ===== Per-student fee summary =====
    const studentFeeSummary = students.map(s => {
      const sInv = invoices.filter(i => i.studentId === s.id);
      const paid = sInv.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
      const pending = sInv.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      return {
        id: s.id, name: s.name, class: s.class || '—', section: s.section || 'A', rollNo: s.rollNo || '—',
        status: s.blocked === 1 ? 'Blocked' : (s.status || 'Active'),
        invoices: sInv.length, paid, pending, total: paid + pending,
      };
    }).sort((a, b) => b.pending - a.pending);

    // ===== Per-teacher salary summary =====
    const teacherSalarySummary = teachers.map(t => {
      const ss = salaryStruct.find(s => s.teacherId === t.id);
      const monthlySalary = ss ? Number(ss.monthlySalary) || 0 : 0;
      const tPayments = salaries.filter(p => p.teacherId === t.id);
      const totalPaid = tPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const lastPayment = tPayments[0];
      return {
        id: t.id, name: t.name, email: t.email || '—',
        status: t.blocked === 1 ? 'Blocked' : (t.status || 'Active'),
        monthlySalary, totalPaid, lastPaidDate: lastPayment?.paidDate || null, paymentsCount: tPayments.length,
      };
    }).sort((a, b) => b.monthlySalary - a.monthlySalary);

    res.json({
      kpi: {
        students: students.length,
        teachers: teachers.length,
        totalRevenue,
        pendingFees,
        totalSalaryPaid,
        monthlySalaryExpense,
        netBalance,
        attendanceRate,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(i => i.status === 'Paid').length,
        unpaidInvoices: invoices.filter(i => i.status !== 'Paid').length,
      },
      monthlyRevenue: months,
      feeStatus,
      classPerformance,
      recentTransactions,
      studentFeeSummary,
      teacherSalarySummary,
    });
  } catch (e) {
    console.error('Branch finance error:', e);
    res.status(500).json({ error: 'Failed to load branch finance: ' + e.message });
  }
});

// ===================== PLATFORM FINANCE (Super Admin) =====================
// Platform-wide finance across all institutes for the Super Admin dashboard.
app.get('/api/platform/finance', requireAuth, requireRole('super-admin'), async (req, res) => {
  try {
    // 1. All fee invoices across all institutes
    const invR = await db.execute({ sql: 'SELECT id, studentId, studentName, className, branchId, instituteId, month, year, amount, status, paidDate, paidAmount, paymentMethod, createdAt FROM fee_invoices ORDER BY createdAt DESC LIMIT 500' });
    const invoices = invR.rows;

    // 2. All salary payments
    const salR = await db.execute({ sql: 'SELECT id, teacherId, teacherName, branchId, instituteId, month, year, amount, status, paidDate, paymentMethod, createdAt FROM salary_payments ORDER BY createdAt DESC LIMIT 500' });
    const salaries = salR.rows;

    // 3. All institutes
    const instR = await db.execute({ sql: 'SELECT id, name, city, adminName, adminEmail, branches, students, staff, revenue, status, blocked FROM institutes ORDER BY createdAt DESC' });
    const institutes = instR.rows;

    // 4. All branches
    const brR = await db.execute({ sql: 'SELECT id, instituteId, name, city, manager, students, teachers, status, blocked FROM branches' });
    const branches = brR.rows;

    // 5. Count all users by role
    const stuR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE role = ?', args: ['student'] });
    const tchR = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users WHERE role = ?', args: ['teacher'] });
    const totalStudents = stuR.rows[0].count;
    const totalTeachers = tchR.rows[0].count;

    // ===== KPIs =====
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const pendingFees = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalSalaryPaid = salaries.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const netBalance = totalRevenue - totalSalaryPaid;

    // ===== Monthly revenue (last 12 months) =====
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthFull = d.toLocaleString('en-US', { month: 'long' });
      const monthInv = invoices.filter(inv => inv.year === year && inv.month === monthFull && inv.status === 'Paid');
      const revenue = monthInv.reduce((s, inv) => s + (Number(inv.paidAmount) || 0), 0);
      const monthSal = salaries.filter(sal => sal.year === year && sal.month === monthFull);
      const salary = monthSal.reduce((s, sal) => s + (Number(sal.amount) || 0), 0);
      months.push({ month: monthName, year, revenue, salary, net: revenue - salary });
    }

    // ===== Yearly revenue (last 5 years) =====
    const currentYear = now.getFullYear();
    const years = [];
    for (let y = currentYear - 4; y <= currentYear; y++) {
      const yearInv = invoices.filter(inv => inv.year === y && inv.status === 'Paid');
      const revenue = yearInv.reduce((s, inv) => s + (Number(inv.paidAmount) || 0), 0);
      const yearSal = salaries.filter(sal => sal.year === y);
      const salary = yearSal.reduce((s, sal) => s + (Number(sal.amount) || 0), 0);
      years.push({ year: y, revenue, salary, net: revenue - salary });
    }

    // ===== Institute performance =====
    const institutePerformance = institutes.map(inst => {
      const instInv = invoices.filter(i => i.instituteId === inst.id);
      const instSal = salaries.filter(s => s.instituteId === inst.id);
      const instBranches = branches.filter(b => b.instituteId === inst.id);
      return {
        id: inst.id,
        name: inst.name,
        city: inst.city || '',
        admin: inst.adminName || inst.adminEmail || '—',
        branches: instBranches.length,
        students: inst.students || 0,
        staff: inst.staff || 0,
        revenue: instInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0),
        pendingFees: instInv.filter(i => i.status !== 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0),
        salaryPaid: instSal.reduce((s, p) => s + (Number(p.amount) || 0), 0),
        net: instInv.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.paidAmount) || 0), 0) - instSal.reduce((s, p) => s + (Number(p.amount) || 0), 0),
        status: inst.blocked === 1 ? 'Blocked' : (inst.status || 'Active'),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // ===== Recent transactions =====
    const recentPaidInvoices = invoices
      .filter(i => i.status === 'Paid')
      .slice(0, 8)
      .map(i => ({
        id: i.id, type: 'Fee Payment', date: i.paidDate || i.createdAt,
        party: i.studentName || 'Student', instituteId: i.instituteId, branchId: i.branchId,
        amount: Number(i.paidAmount) || 0, method: i.paymentMethod || 'Cash', status: 'Paid',
      }));
    const recentSalaries = salaries
      .slice(0, 8)
      .map(s => ({
        id: s.id, type: 'Salary Payout', date: s.paidDate || s.createdAt,
        party: s.teacherName || 'Teacher', instituteId: s.instituteId, branchId: s.branchId,
        amount: Number(s.amount) || 0, method: s.paymentMethod || 'Bank Transfer', status: s.status || 'Paid',
      }));
    const recentTransactions = [...recentPaidInvoices, ...recentSalaries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);

    res.json({
      kpi: {
        institutes: institutes.length,
        activeInstitutes: institutes.filter(i => i.blocked !== 1).length,
        branches: branches.length,
        students: totalStudents,
        teachers: totalTeachers,
        totalRevenue,
        pendingFees,
        totalSalaryPaid,
        netBalance,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(i => i.status === 'Paid').length,
        unpaidInvoices: invoices.filter(i => i.status !== 'Paid').length,
      },
      monthlyRevenue: months,
      yearlyRevenue: years,
      institutePerformance,
      recentTransactions,
    });
  } catch (e) {
    console.error('Platform finance error:', e);
    res.status(500).json({ error: 'Failed to load platform finance: ' + e.message });
  }
});

// ===================== TEACHER SALARIES =====================
// Set / update a teacher's monthly salary
app.post('/api/salaries', requireAuth, requireRole('institute-admin', 'branch-manager'), async (req, res) => {
  const { teacherId, monthlySalary, effectiveFrom } = req.body || {};
  if (!teacherId || monthlySalary === undefined) return res.status(400).json({ error: 'teacherId and monthlySalary required' });
  // Look up the teacher
  const tchR = await db.execute({ sql: 'SELECT id, instituteId, branchId FROM users WHERE id = ? AND role = ?', args: [teacherId, 'teacher'] });
  if (tchR.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
  const t = tchR.rows[0];
  // Authorization: institute admin can only set salaries for teachers in their institute; branch manager only for their branch
  if (req.user.role === 'institute-admin' && t.instituteId !== req.user.instituteId) {
    return res.status(403).json({ error: 'Not authorized to set salary for this teacher' });
  }
  if (req.user.role === 'branch-manager' && t.branchId !== req.user.branchId) {
    return res.status(403).json({ error: 'Not authorized to set salary for this teacher' });
  }
  // Upsert: if a salary record exists, update it; otherwise insert
  const existing = await db.execute({ sql: 'SELECT id FROM teacher_salaries WHERE teacherId = ?', args: [teacherId] });
  const effDate = effectiveFrom || new Date().toISOString().slice(0, 10);
  if (existing.rows.length > 0) {
    await db.execute({ sql: 'UPDATE teacher_salaries SET monthlySalary = ?, effectiveFrom = ? WHERE id = ?', args: [Number(monthlySalary), effDate, existing.rows[0].id] });
    res.json({ success: true, updated: true });
  } else {
    const id = nextId('TS');
    await db.execute({
      sql: 'INSERT INTO teacher_salaries (id, teacherId, instituteId, branchId, monthlySalary, effectiveFrom) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, teacherId, t.instituteId, t.branchId, Number(monthlySalary), effDate],
    });
    res.status(201).json({ success: true, id });
  }
});

// Record a salary payment (pay a teacher for a month)
app.post('/api/salaries/pay', requireAuth, requireRole('institute-admin', 'branch-manager'), async (req, res) => {
  const { teacherId, month, year, amount, paymentMethod, notes } = req.body || {};
  if (!teacherId || !month || !year || amount === undefined) return res.status(400).json({ error: 'teacherId, month, year and amount required' });
  const tchR = await db.execute({ sql: 'SELECT id, name, instituteId, branchId FROM users WHERE id = ? AND role = ?', args: [teacherId, 'teacher'] });
  if (tchR.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
  const t = tchR.rows[0];
  if (req.user.role === 'institute-admin' && t.instituteId !== req.user.instituteId) {
    return res.status(403).json({ error: 'Not authorized to pay this teacher' });
  }
  if (req.user.role === 'branch-manager' && t.branchId !== req.user.branchId) {
    return res.status(403).json({ error: 'Not authorized to pay this teacher' });
  }
  const id = nextId('SAL');
  const paidDate = new Date().toISOString().slice(0, 10);
  await db.execute({
    sql: `INSERT INTO salary_payments (id, teacherId, teacherName, instituteId, branchId, month, year, amount, status, paidDate, paymentMethod, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, teacherId, t.name, t.instituteId, t.branchId, month, year, Number(amount), 'Paid', paidDate, paymentMethod || 'Bank Transfer', notes || ''],
  });
  res.status(201).json({ success: true, id, paidDate });
});

// List salary payments (filterable by instituteId / branchId / teacherId)
app.get('/api/salaries', requireAuth, async (req, res) => {
  const { instituteId, branchId, teacherId } = req.query;
  let sql = 'SELECT * FROM salary_payments WHERE 1=1';
  const args = [];
  if (teacherId) { sql += ' AND teacherId = ?'; args.push(teacherId); }
  else if (branchId) { sql += ' AND branchId = ?'; args.push(branchId); }
  else if (instituteId) { sql += ' AND instituteId = ?'; args.push(instituteId); }
  sql += ' ORDER BY createdAt DESC LIMIT 200';
  const r = await db.execute({ sql, args });
  res.json(r.rows);
});

// ===================== ATTENDANCE =====================
app.post('/api/attendance', requireAuth, requireRole('teacher'), async (req, res) => {
  const { classId, date, records } = req.body || {};
  if (!date || !records || !Array.isArray(records)) return res.status(400).json({ error: 'date and records array are required' });
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

// ===================== FEE STRUCTURE (Branch Manager) =====================
// Get fee structure for a branch (or specific class)
app.get('/api/fee-structure', requireAuth, async (req, res) => {
  const { branchId, classId } = req.query;
  const brId = branchId || req.user.branchId;
  if (!brId) return res.json([]);
  let sql = 'SELECT fs.*, c.name as className FROM fee_structure fs LEFT JOIN classes c ON fs.classId = c.id WHERE fs.branchId = ?';
  let args = [brId];
  if (classId) { sql += ' AND fs.classId = ?'; args.push(classId); }
  const r = await db.execute({ sql, args });
  res.json(r.rows);
});

// Set/update fee structure for a class
app.post('/api/fee-structure', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const { classId, monthlyFee, admissionFee } = req.body || {};
  const brId = req.user.branchId;
  if (!classId || monthlyFee === undefined) return res.status(400).json({ error: 'classId and monthlyFee required' });
  // Check if structure already exists for this class
  const existing = await db.execute({ sql: 'SELECT id FROM fee_structure WHERE branchId = ? AND classId = ?', args: [brId, classId] });
  if (existing.rows.length > 0) {
    await db.execute({ sql: 'UPDATE fee_structure SET monthlyFee = ?, admissionFee = ? WHERE id = ?', args: [monthlyFee, admissionFee || 0, existing.rows[0].id] });
    res.json({ success: true, updated: true });
  } else {
    const id = nextId('FS');
    await db.execute({ sql: 'INSERT INTO fee_structure (id, branchId, classId, monthlyFee, admissionFee) VALUES (?, ?, ?, ?, ?)', args: [id, brId, classId, monthlyFee, admissionFee || 0] });
    res.status(201).json({ success: true, id });
  }
});

// ===================== FEE INVOICES =====================
// Get invoices for a student (student portal)
app.get('/api/fee-invoices', requireAuth, async (req, res) => {
  const { studentId } = req.query;
  const sid = studentId || req.user.id;
  let sql = 'SELECT * FROM fee_invoices WHERE studentId = ? ORDER BY year DESC, createdAt DESC';
  const r = await db.execute({ sql, args: [sid] });
  res.json(r.rows);
});

// Get all invoices for a branch (branch manager view)
app.get('/api/fee-invoices/branch', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const brId = req.user.branchId;
  const r = await db.execute({ sql: 'SELECT * FROM fee_invoices WHERE branchId = ? ORDER BY createdAt DESC', args: [brId] });
  res.json(r.rows);
});

// Generate monthly invoices for all students in a branch (Branch Manager clicks "Generate Invoices")
app.post('/api/fee-invoices/generate', requireAuth, requireRole('branch-manager'), async (req, res) => {
  const { month, year } = req.body || {};
  const brId = req.user.branchId;
  if (!month || !year) return res.status(400).json({ error: 'month and year required' });
  // Get all students in this branch
  const students = await db.execute({ sql: 'SELECT id, name, class, branchId, instituteId FROM users WHERE branchId = ? AND role = ?', args: [brId, 'student'] });
  if (students.rows.length === 0) return res.json({ success: true, generated: 0, message: 'No students found' });
  let generated = 0;
  for (const student of students.rows) {
    // Check if invoice already exists for this student/month/year
    const existing = await db.execute({ sql: 'SELECT id FROM fee_invoices WHERE studentId = ? AND month = ? AND year = ?', args: [student.id, month, year] });
    if (existing.rows.length > 0) continue; // Skip if already generated
    // Get fee structure for the student's class
    const classR = await db.execute({ sql: 'SELECT id FROM classes WHERE branchId = ? AND name = ?', args: [brId, student.class] });
    let amount = 0;
    if (classR.rows.length > 0) {
      const feeR = await db.execute({ sql: 'SELECT monthlyFee FROM fee_structure WHERE branchId = ? AND classId = ?', args: [brId, classR.rows[0].id] });
      if (feeR.rows.length > 0) amount = feeR.rows[0].monthlyFee;
    }
    if (amount === 0) amount = 5000; // Default fee in PKR
    const id = nextId('INV');
    const challanNo = 'CH-' + year + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(generated + 1).padStart(4, '0');
    await db.execute({
      sql: `INSERT INTO fee_invoices (id, studentId, studentName, className, branchId, instituteId, month, year, amount, type, status, challanNo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, student.id, student.name, student.class || '', brId, student.instituteId, month, year, amount, 'Tuition', 'Unpaid', challanNo],
    });
    generated++;
  }
  res.json({ success: true, generated, message: `${generated} invoices generated for ${month} ${year}` });
});

// Mark invoice as paid (Branch Manager)
app.patch('/api/fee-invoices/:id/pay', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const { paidAmount, paymentMethod } = req.body || {};
  const inv = await db.execute({ sql: 'SELECT * FROM fee_invoices WHERE id = ?', args: [req.params.id] });
  if (inv.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
  const amount = paidAmount || inv.rows[0].amount;
  await db.execute({
    sql: 'UPDATE fee_invoices SET status = ?, paidDate = ?, paidAmount = ?, paymentMethod = ? WHERE id = ?',
    args: ['Paid', new Date().toISOString().slice(0, 10), amount, paymentMethod || 'Cash', req.params.id],
  });
  res.json({ success: true, status: 'Paid' });
});

// Get challan data for PDF
app.get('/api/fee-invoices/:id/challan', requireAuth, async (req, res) => {
  const inv = await db.execute({ sql: 'SELECT * FROM fee_invoices WHERE id = ?', args: [req.params.id] });
  if (inv.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
  const invoice = inv.rows[0];
  // Get student details
  const stu = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [invoice.studentId] });
  const student = stu.rows[0] || {};
  res.json({
    challanNo: invoice.challanNo,
    studentName: invoice.studentName || student.name,
    studentId: invoice.studentId,
    rollNo: student.rollNo,
    className: invoice.className || student.class,
    branch: student.branchId,
    month: invoice.month,
    year: invoice.year,
    amount: invoice.amount,
    status: invoice.status,
    type: invoice.type,
    generatedAt: invoice.createdAt,
  });
});

// ===================== DIARY (Teacher homework + notes) =====================
app.get('/api/diary', requireAuth, async (req, res) => {
  const { teacherId, branchId, classId, class: className } = req.query;
  let sql = 'SELECT d.*, c.name as className, co.name as courseName FROM diary d LEFT JOIN classes c ON d.classId = c.id LEFT JOIN courses co ON d.courseId = co.id WHERE 1=1';
  const args = [];
  if (teacherId) { sql += ' AND d.teacherId = ?'; args.push(teacherId); }
  else if (branchId) { sql += ' AND d.branchId = ?'; args.push(branchId); }
  if (classId) { sql += ' AND d.classId = ?'; args.push(classId); }
  sql += ' ORDER BY d.createdAt DESC LIMIT 100';
  const r = await db.execute({ sql, args });
  res.json(r.rows);
});

app.post('/api/diary', requireAuth, requireRole('teacher', 'branch-manager'), async (req, res) => {
  const { teacherId, branchId, classId, courseId, subject, title, description, due } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const id = nextId('DR');
  const tId = teacherId || req.user.id;
  const brId = branchId || req.user.branchId;
  await db.execute({
    sql: 'INSERT INTO diary (id, teacherId, branchId, classId, courseId, subject, title, description, due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, tId, brId, classId || null, courseId || null, subject || '', title, description || '', due || null],
  });
  res.status(201).json({ id, success: true });
});

// ===================== SMS LOG =====================
app.get('/api/sms', requireAuth, async (req, res) => {
  const { senderId, instituteId, branchId } = req.query;
  let sql = 'SELECT * FROM sms_log WHERE 1=1';
  const args = [];
  if (senderId) { sql += ' AND senderId = ?'; args.push(senderId); }
  else if (branchId) { sql += ' AND branchId = ?'; args.push(branchId); }
  else if (instituteId) { sql += ' AND instituteId = ?'; args.push(instituteId); }
  sql += ' ORDER BY createdAt DESC LIMIT 100';
  const r = await db.execute({ sql, args });
  res.json(r.rows);
});

app.post('/api/sms/send', requireAuth, requireRole('teacher', 'branch-manager', 'institute-admin'), async (req, res) => {
  const { text, recipients, type, classId } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });
  const id = nextId('SMS');
  await db.execute({
    sql: 'INSERT INTO sms_log (id, senderId, senderRole, text, recipients, type, instituteId, branchId, classId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, req.user.id, req.user.role, text, recipients || 0, type || 'Notice', req.user.instituteId, req.user.branchId, classId || null],
  });
  res.status(201).json({ id, success: true });
});

// ===================== COMPLAINTS =====================
app.get('/api/complaints', requireAuth, async (req, res) => {
  const { parentId, instituteId, branchId } = req.query;
  let sql = 'SELECT * FROM complaints WHERE 1=1';
  const args = [];
  if (parentId) { sql += ' AND parentId = ?'; args.push(parentId); }
  else if (branchId) { sql += ' AND branchId = ?'; args.push(branchId); }
  else if (instituteId) { sql += ' AND instituteId = ?'; args.push(instituteId); }
  sql += ' ORDER BY createdAt DESC LIMIT 100';
  const r = await db.execute({ sql, args });
  res.json(r.rows);
});

app.post('/api/complaints', requireAuth, requireRole('parent', 'student'), async (req, res) => {
  const { parentId, studentId, instituteId, branchId, subject, message } = req.body || {};
  if (!subject || !message) return res.status(400).json({ error: 'subject and message required' });
  const id = nextId('CMP');
  const pId = parentId || req.user.id;
  const iId = instituteId || req.user.instituteId;
  const bId = branchId || req.user.branchId;
  await db.execute({
    sql: 'INSERT INTO complaints (id, parentId, studentId, instituteId, branchId, subject, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, pId, studentId || null, iId, bId, subject, message],
  });
  res.status(201).json({ id, success: true });
});

app.patch('/api/complaints/:id/respond', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const { response } = req.body || {};
  if (!response) return res.status(400).json({ error: 'response required' });
  await db.execute({
    sql: 'UPDATE complaints SET response = ?, respondedAt = ?, status = ? WHERE id = ?',
    args: [response, new Date().toISOString().slice(0, 10), 'Resolved', req.params.id],
  });
  res.json({ success: true });
});

// ===================== EVENTS =====================
app.get('/api/events', requireAuth, async (req, res) => {
  const { instituteId, branchId } = req.query;
  let sql = 'SELECT * FROM events WHERE 1=1';
  const args = [];
  if (branchId) { sql += ' AND branchId = ?'; args.push(branchId); }
  else if (instituteId) { sql += ' AND instituteId = ?'; args.push(instituteId); }
  sql += ' ORDER BY startDate DESC LIMIT 100';
  const r = await db.execute({ sql, args });
  res.json(r.rows);
});

app.post('/api/events', requireAuth, requireRole('branch-manager', 'institute-admin', 'super-admin'), async (req, res) => {
  const { title, description, startDate, endDate, location, type, instituteId, branchId } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const id = nextId('EVT');
  const iId = instituteId || req.user.instituteId;
  const bId = branchId || req.user.branchId;
  await db.execute({
    sql: 'INSERT INTO events (id, title, description, startDate, endDate, location, type, instituteId, branchId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, title, description || '', startDate || null, endDate || null, location || '', type || 'Event', iId, bId, req.user.id],
  });
  res.status(201).json({ id, success: true });
});

// ===================== LIBRARY =====================
app.get('/api/library/books', requireAuth, async (req, res) => {
  const { branchId } = req.query;
  const brId = branchId || req.user.branchId;
  if (!brId) return res.json([]);
  const r = await db.execute({ sql: 'SELECT * FROM library_books WHERE branchId = ? ORDER BY createdAt DESC', args: [brId] });
  res.json(r.rows);
});

app.post('/api/library/books', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const { title, author, isbn, category, totalCopies, shelf } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const id = nextId('BK');
  const brId = req.user.branchId;
  const copies = totalCopies || 1;
  await db.execute({
    sql: 'INSERT INTO library_books (id, branchId, title, author, isbn, category, totalCopies, availableCopies, shelf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, brId, title, author || '', isbn || '', category || '', copies, copies, shelf || ''],
  });
  res.status(201).json({ id, success: true });
});

// ===================== TRANSPORT =====================
app.get('/api/transport/routes', requireAuth, async (req, res) => {
  const { branchId } = req.query;
  const brId = branchId || req.user.branchId;
  if (!brId) return res.json([]);
  const r = await db.execute({ sql: 'SELECT * FROM transport_routes WHERE branchId = ? ORDER BY createdAt DESC', args: [brId] });
  res.json(r.rows);
});

app.post('/api/transport/routes', requireAuth, requireRole('branch-manager', 'institute-admin'), async (req, res) => {
  const { routeName, driver, vehicleNo, fare, stops, capacity } = req.body || {};
  if (!routeName) return res.status(400).json({ error: 'routeName required' });
  const id = nextId('TR');
  const brId = req.user.branchId;
  await db.execute({
    sql: 'INSERT INTO transport_routes (id, branchId, routeName, driver, vehicleNo, fare, stops, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id, brId, routeName, driver || '', vehicleNo || '', Number(fare) || 0, stops || '', Number(capacity) || 30],
  });
  res.status(201).json({ id, success: true });
});

app.get('/api/health', async (req, res) => {
  try {
    const r = await db.execute('SELECT COUNT(*) as count FROM users');
    res.json({ ok: true, service: 'esm-api', port: PORT, users: r.rows[0].count, db: 'turso' });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ===================== NOTIFICATIONS (top bar dropdown) =====================
// Returns recent announcements + recent complaints (for managers/admins) for the bell icon dropdown.
app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const items = [];
    const now = Date.now();

    // Recent announcements (last 7 days, max 10)
    let annSql = 'SELECT id, title, message, senderRole, targetRole, createdAt FROM announcements WHERE 1=1';
    const annArgs = [];
    if (req.user.role === 'teacher' || req.user.role === 'student' || req.user.role === 'parent') {
      annSql += ' AND (targetScope = ? OR targetRole = ? OR targetRole = ?)';
      annArgs.push('all', req.user.role, 'all');
    } else if (req.user.role === 'branch-manager') {
      annSql += ' AND (senderRole = ? OR targetRole = ? OR targetScope = ?)';
      annArgs.push('institute-admin', 'branch-manager', 'all');
    } else if (req.user.role === 'institute-admin') {
      annSql += ' AND (senderRole = ? OR senderId = ?)';
      annArgs.push('super-admin', req.user.id);
    }
    annSql += ' ORDER BY createdAt DESC LIMIT 10';
    const annR = await db.execute({ sql: annSql, args: annArgs });
    for (const a of annR.rows) {
      const created = new Date(a.createdAt).getTime();
      const ageMs = now - created;
      const ageHrs = Math.floor(ageMs / 3600000);
      let timeLabel;
      if (ageHrs < 1) timeLabel = 'Just now';
      else if (ageHrs < 24) timeLabel = `${ageHrs}h ago`;
      else timeLabel = `${Math.floor(ageHrs / 24)}d ago`;
      items.push({
        id: a.id,
        type: 'announcement',
        title: a.title,
        message: a.message,
        sender: a.senderRole,
        timeLabel,
        createdAt: a.createdAt,
        read: false,
      });
    }

    // For managers/admins: also show recent complaints as notifications
    if (req.user.role === 'branch-manager' || req.user.role === 'institute-admin') {
      let cmpSql = 'SELECT id, subject, message, status, createdAt FROM complaints WHERE 1=1';
      const cmpArgs = [];
      if (req.user.role === 'branch-manager' && req.user.branchId) {
        cmpSql += ' AND branchId = ?'; cmpArgs.push(req.user.branchId);
      } else if (req.user.role === 'institute-admin' && req.user.instituteId) {
        cmpSql += ' AND instituteId = ?'; cmpArgs.push(req.user.instituteId);
      }
      cmpSql += ' ORDER BY createdAt DESC LIMIT 5';
      const cmpR = await db.execute({ sql: cmpSql, args: cmpArgs });
      for (const c of cmpR.rows) {
        const created = new Date(c.createdAt).getTime();
        const ageMs = now - created;
        const ageHrs = Math.floor(ageMs / 3600000);
        let timeLabel;
        if (ageHrs < 1) timeLabel = 'Just now';
        else if (ageHrs < 24) timeLabel = `${ageHrs}h ago`;
        else timeLabel = `${Math.floor(ageHrs / 24)}d ago`;
        items.push({
          id: c.id,
          type: 'complaint',
          title: `Complaint: ${c.subject}`,
          message: c.message,
          sender: 'Parent',
          timeLabel,
          createdAt: c.createdAt,
          read: c.status === 'Resolved',
        });
      }
    }

    // Sort by createdAt desc
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unread = items.filter(i => !i.read).length;
    res.json({ items: items.slice(0, 15), unread });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load notifications: ' + e.message });
  }
});

// Initialize DB then start
initDB().then(() => {
  app.listen(PORT, () => console.log(`ESM API server running on http://localhost:${PORT} (Turso DB)`));
}).catch(e => {
  console.error('DB init failed:', e);
  app.listen(PORT, () => console.log(`ESM API server running on http://localhost:${PORT} (DB init failed)`));
});
