import { createClient } from '@libsql/client';

// Turso DB client — server-side only (never import in client components)
const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://campus-prod-faisukhan01.aws-ap-south-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzc4MTM5MTAsImlkIjoiMDE5ZGVkZjUtZjIwMS03ZmFjLWJlYzEtYjlkMDJhYTIwMjJiIiwicmlkIjoiYWRiNGQ0YmItNDg4ZC00ZGU0LTg3MWMtMTZjYzBkMGFkMWM0In0.SPrIFL7Nn3MkKL-u5WOOGifk8U8hcAIGulmXgtGiBdkSqBDyoox-ZGItQiTgRcjGDhgWfMVYnD-eQKcE9IOyAA';

export const db = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

// Initialize schema on first call
let initialized = false;

export async function initDB() {
  if (initialized) return;
  initialized = true;

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, rollNo TEXT, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student', status TEXT NOT NULL DEFAULT 'Active', title TEXT DEFAULT '', mustChangePassword INTEGER NOT NULL DEFAULT 0, blocked INTEGER NOT NULL DEFAULT 0, blockedReason TEXT, instituteId TEXT, branchId TEXT, class TEXT, section TEXT DEFAULT 'A', guardian TEXT, ward TEXT, wardId TEXT, subjects TEXT, classes TEXT, createdById TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS institutes (id TEXT PRIMARY KEY, name TEXT NOT NULL, short TEXT, city TEXT DEFAULT '', country TEXT DEFAULT 'USA', plan TEXT DEFAULT 'Starter', status TEXT DEFAULT 'Trial', adminName TEXT, adminEmail TEXT, branches INTEGER DEFAULT 0, students INTEGER DEFAULT 0, staff INTEGER DEFAULT 0, revenue REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')), color TEXT DEFAULT 'emerald', domain TEXT DEFAULT 'edu', blocked INTEGER NOT NULL DEFAULT 0, blockedReason TEXT)`,
    `CREATE TABLE IF NOT EXISTS branches (id TEXT PRIMARY KEY, instituteId TEXT NOT NULL, name TEXT NOT NULL, city TEXT DEFAULT '', manager TEXT, managerEmail TEXT, students INTEGER DEFAULT 0, teachers INTEGER DEFAULT 0, status TEXT DEFAULT 'Active', createdAt TEXT DEFAULT (datetime('now')), blocked INTEGER NOT NULL DEFAULT 0, blockedReason TEXT)`,
    `CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, name TEXT NOT NULL, section TEXT DEFAULT 'A', teacherId TEXT)`,
    `CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, name TEXT NOT NULL, code TEXT)`,
    `CREATE TABLE IF NOT EXISTS class_courses (id TEXT PRIMARY KEY, classId TEXT NOT NULL, courseId TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS teacher_class_courses (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, classId TEXT NOT NULL, courseId TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY, senderId TEXT NOT NULL, senderRole TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, targetRole TEXT, targetScope TEXT DEFAULT 'all', targetIds TEXT, instituteId TEXT, branchId TEXT, classId TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS course_materials (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, classId TEXT NOT NULL, courseId TEXT NOT NULL, title TEXT NOT NULL, description TEXT, fileType TEXT, fileName TEXT, fileData TEXT, linkUrl TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS attendance (id TEXT PRIMARY KEY, branchId TEXT, classId TEXT, date TEXT NOT NULL, teacherId TEXT, records TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS results (id TEXT PRIMARY KEY, branchId TEXT, exam TEXT NOT NULL, courseId TEXT, classId TEXT, teacherId TEXT, totalMarks INTEGER DEFAULT 100, date TEXT NOT NULL, records TEXT NOT NULL, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS fees (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, instituteId TEXT, branchId TEXT, amount REAL NOT NULL, type TEXT DEFAULT 'Tuition', method TEXT DEFAULT 'Online', date TEXT NOT NULL, status TEXT DEFAULT 'Paid')`,
    `CREATE TABLE IF NOT EXISTS diary (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, branchId TEXT, classId TEXT, courseId TEXT, subject TEXT, title TEXT NOT NULL, description TEXT, due TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT NOT NULL, role TEXT NOT NULL, issuedAt INTEGER NOT NULL, expiresAt INTEGER NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS fee_structure (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, classId TEXT NOT NULL, monthlyFee REAL NOT NULL DEFAULT 0, admissionFee REAL DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS fee_invoices (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, studentName TEXT, className TEXT, branchId TEXT, instituteId TEXT, month TEXT NOT NULL, year INTEGER NOT NULL, amount REAL NOT NULL, type TEXT DEFAULT 'Tuition', status TEXT DEFAULT 'Unpaid', paidDate TEXT, paidAmount REAL DEFAULT 0, paymentMethod TEXT, challanNo TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS teacher_salaries (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, instituteId TEXT, branchId TEXT, monthlySalary REAL NOT NULL DEFAULT 0, effectiveFrom TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS salary_payments (id TEXT PRIMARY KEY, teacherId TEXT NOT NULL, teacherName TEXT, instituteId TEXT, branchId TEXT, month TEXT NOT NULL, year INTEGER NOT NULL, amount REAL NOT NULL, status TEXT DEFAULT 'Paid', paidDate TEXT, paymentMethod TEXT DEFAULT 'Bank Transfer', notes TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS sms_log (id TEXT PRIMARY KEY, senderId TEXT NOT NULL, senderRole TEXT, text TEXT NOT NULL, recipients INTEGER DEFAULT 0, type TEXT DEFAULT 'Notice', instituteId TEXT, branchId TEXT, classId TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS complaints (id TEXT PRIMARY KEY, parentId TEXT NOT NULL, studentId TEXT, instituteId TEXT, branchId TEXT, subject TEXT NOT NULL, message TEXT NOT NULL, status TEXT DEFAULT 'Open', response TEXT, respondedAt TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, startDate TEXT, endDate TEXT, location TEXT, type TEXT DEFAULT 'Event', instituteId TEXT, branchId TEXT, createdBy TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS library_books (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, title TEXT NOT NULL, author TEXT, isbn TEXT, category TEXT, totalCopies INTEGER DEFAULT 1, availableCopies INTEGER DEFAULT 1, shelf TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS transport_routes (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, routeName TEXT NOT NULL, driver TEXT, vehicleNo TEXT, fare REAL DEFAULT 0, stops TEXT, capacity INTEGER DEFAULT 30, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS manual_revenue (id TEXT PRIMARY KEY, enteredBy TEXT NOT NULL, enteredByRole TEXT NOT NULL, instituteId TEXT, sourceType TEXT NOT NULL, sourceId TEXT NOT NULL, sourceName TEXT NOT NULL, amount REAL NOT NULL DEFAULT 0, month TEXT NOT NULL, year INTEGER NOT NULL, notes TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS timetable (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, classId TEXT, className TEXT, section TEXT DEFAULT 'A', day TEXT NOT NULL, period INTEGER NOT NULL, startTime TEXT, endTime TEXT, subject TEXT, teacherId TEXT, teacherName TEXT, roomId TEXT, roomName TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS report_cards (id TEXT PRIMARY KEY, studentId TEXT NOT NULL, studentName TEXT, class TEXT, section TEXT DEFAULT 'A', branchId TEXT, instituteId TEXT, term TEXT NOT NULL, examName TEXT, totalMarks INTEGER DEFAULT 0, obtainedMarks INTEGER DEFAULT 0, percentage REAL DEFAULT 0, grade TEXT, remarks TEXT, generatedBy TEXT, generatedAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS royalty_settings (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, instituteId TEXT NOT NULL, method TEXT NOT NULL DEFAULT 'fixed', amount REAL DEFAULT 0, percentage REAL DEFAULT 0, effectiveFrom TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS royalty_invoices (id TEXT PRIMARY KEY, branchId TEXT NOT NULL, instituteId TEXT NOT NULL, branchName TEXT, month TEXT NOT NULL, year INTEGER NOT NULL, method TEXT, studentCount INTEGER DEFAULT 0, branchRevenue REAL DEFAULT 0, royaltyAmount REAL NOT NULL DEFAULT 0, status TEXT DEFAULT 'Pending', paidDate TEXT, createdAt TEXT DEFAULT (datetime('now')))`,
  ];

  for (const sql of statements) {
    try { await db.execute(sql); } catch {}
  }

  // Seed super admin if not exists
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE role = ?', args: ['super-admin'] });
  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-SUPER', 'Faisal Khan', 'faisu577277@gmail.com', 'QaReLc_61y8', 'super-admin', 'Active', 'Chief Executive Officer', 0, 0],
    });
  }
}
