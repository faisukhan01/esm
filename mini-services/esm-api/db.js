import { createClient } from '@libsql/client';

// Turso DB credentials — hardcoded as fallback (env file keeps getting deleted)
const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://campus-prod-faisukhan01.aws-ap-south-1.turso.io';
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzc4MTM5MTAsImlkIjoiMDE5ZGVkZjUtZjIwMS03ZmFjLWJlYzEtYjlkMDJhYTIwMjJiIiwicmlkIjoiYWRiNGQ0YmItNDg4ZC00ZGU0LTg3MWMtMTZjYzBkMGFkMWM0In0.SPrIFL7Nn3MkKL-u5WOOGifk8U8hcAIGulmXgtGiBdkSqBDyoox-ZGItQiTgRcjGDhgWfMVYnD-eQKcE9IOyAA';

// Turso DB client — production database
export const db = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

// Initialize schema on startup
export async function initDB() {
  const statements = [
    // Users — all roles in one table
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      rollNo TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      status TEXT NOT NULL DEFAULT 'Active',
      title TEXT DEFAULT '',
      mustChangePassword INTEGER NOT NULL DEFAULT 0,
      blocked INTEGER NOT NULL DEFAULT 0,
      blockedReason TEXT,
      instituteId TEXT,
      branchId TEXT,
      class TEXT,
      section TEXT DEFAULT 'A',
      guardian TEXT,
      ward TEXT,
      wardId TEXT,
      subjects TEXT,
      classes TEXT,
      createdById TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (instituteId) REFERENCES institutes(id),
      FOREIGN KEY (branchId) REFERENCES branches(id)
    )`,

    // Institutes
    `CREATE TABLE IF NOT EXISTS institutes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short TEXT,
      city TEXT DEFAULT '',
      country TEXT DEFAULT 'USA',
      plan TEXT DEFAULT 'Starter',
      status TEXT DEFAULT 'Trial',
      adminName TEXT,
      adminEmail TEXT,
      branches INTEGER DEFAULT 0,
      students INTEGER DEFAULT 0,
      staff INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      color TEXT DEFAULT 'emerald',
      domain TEXT DEFAULT 'edu',
      blocked INTEGER NOT NULL DEFAULT 0,
      blockedReason TEXT
    )`,

    // Branches
    `CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      instituteId TEXT NOT NULL,
      name TEXT NOT NULL,
      city TEXT DEFAULT '',
      manager TEXT,
      managerEmail TEXT,
      students INTEGER DEFAULT 0,
      teachers INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      createdAt TEXT DEFAULT (datetime('now')),
      blocked INTEGER NOT NULL DEFAULT 0,
      blockedReason TEXT,
      FOREIGN KEY (instituteId) REFERENCES institutes(id)
    )`,

    // Classes (1-12 per branch)
    `CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      name TEXT NOT NULL,
      section TEXT DEFAULT 'A',
      teacherId TEXT,
      FOREIGN KEY (branchId) REFERENCES branches(id)
    )`,

    // Courses / Subjects
    `CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      FOREIGN KEY (branchId) REFERENCES branches(id)
    )`,

    // Class-Course mapping (which courses are taught in which class)
    `CREATE TABLE IF NOT EXISTS class_courses (
      id TEXT PRIMARY KEY,
      classId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      FOREIGN KEY (classId) REFERENCES classes(id),
      FOREIGN KEY (courseId) REFERENCES courses(id)
    )`,

    // Teacher-Class-Course mapping (which teacher teaches which course in which class)
    `CREATE TABLE IF NOT EXISTS teacher_class_courses (
      id TEXT PRIMARY KEY,
      teacherId TEXT NOT NULL,
      classId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      FOREIGN KEY (teacherId) REFERENCES users(id),
      FOREIGN KEY (classId) REFERENCES classes(id),
      FOREIGN KEY (courseId) REFERENCES courses(id)
    )`,

    // Announcements
    `CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      senderRole TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      targetRole TEXT,
      targetScope TEXT DEFAULT 'all',
      targetIds TEXT,
      instituteId TEXT,
      branchId TEXT,
      classId TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (senderId) REFERENCES users(id)
    )`,

    // Course materials (uploaded by teachers)
    `CREATE TABLE IF NOT EXISTS course_materials (
      id TEXT PRIMARY KEY,
      teacherId TEXT NOT NULL,
      classId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      fileType TEXT,
      fileName TEXT,
      fileData TEXT,
      linkUrl TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacherId) REFERENCES users(id),
      FOREIGN KEY (classId) REFERENCES classes(id),
      FOREIGN KEY (courseId) REFERENCES courses(id)
    )`,

    // Attendance
    `CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      classId TEXT,
      date TEXT NOT NULL,
      teacherId TEXT,
      records TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )`,

    // Results
    `CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      exam TEXT NOT NULL,
      courseId TEXT,
      teacherId TEXT,
      totalMarks INTEGER DEFAULT 100,
      date TEXT NOT NULL,
      records TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )`,

    // Fees
    `CREATE TABLE IF NOT EXISTS fees (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      instituteId TEXT,
      branchId TEXT,
      amount REAL NOT NULL,
      type TEXT DEFAULT 'Tuition',
      method TEXT DEFAULT 'Online',
      date TEXT NOT NULL,
      status TEXT DEFAULT 'Paid'
    )`,

    // Diary / Homework
    `CREATE TABLE IF NOT EXISTS diary (
      id TEXT PRIMARY KEY,
      teacherId TEXT NOT NULL,
      branchId TEXT,
      classId TEXT,
      courseId TEXT,
      subject TEXT,
      title TEXT NOT NULL,
      description TEXT,
      due TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )`,

    // Sessions (for auth)
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      role TEXT NOT NULL,
      issuedAt INTEGER NOT NULL,
      expiresAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )`,

    // Fee structure — per class per branch (set by Branch Manager)
    `CREATE TABLE IF NOT EXISTS fee_structure (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      classId TEXT NOT NULL,
      monthlyFee REAL NOT NULL DEFAULT 0,
      admissionFee REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )`,

    // Fee invoices — monthly invoices for students
    `CREATE TABLE IF NOT EXISTS fee_invoices (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT,
      className TEXT,
      branchId TEXT,
      instituteId TEXT,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT DEFAULT 'Tuition',
      status TEXT DEFAULT 'Unpaid',
      paidDate TEXT,
      paidAmount REAL DEFAULT 0,
      paymentMethod TEXT,
      challanNo TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )`,

    // Teacher salaries — monthly salary structure per teacher (set by Institute Admin / Branch Manager)
    `CREATE TABLE IF NOT EXISTS teacher_salaries (
      id TEXT PRIMARY KEY,
      teacherId TEXT NOT NULL,
      instituteId TEXT,
      branchId TEXT,
      monthlySalary REAL NOT NULL DEFAULT 0,
      effectiveFrom TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacherId) REFERENCES users(id)
    )`,

    // Salary payments — actual monthly payouts (recorded when salary is paid)
    `CREATE TABLE IF NOT EXISTS salary_payments (
      id TEXT PRIMARY KEY,
      teacherId TEXT NOT NULL,
      teacherName TEXT,
      instituteId TEXT,
      branchId TEXT,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'Paid',
      paidDate TEXT,
      paymentMethod TEXT DEFAULT 'Bank Transfer',
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacherId) REFERENCES users(id)
    )`,

    // SMS log — messages sent by teachers/managers to parents
    `CREATE TABLE IF NOT EXISTS sms_log (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      senderRole TEXT,
      text TEXT NOT NULL,
      recipients INTEGER DEFAULT 0,
      type TEXT DEFAULT 'Notice',
      instituteId TEXT,
      branchId TEXT,
      classId TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (senderId) REFERENCES users(id)
    )`,

    // Complaints — raised by parents, visible to branch managers + institute admins
    `CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      parentId TEXT NOT NULL,
      studentId TEXT,
      instituteId TEXT,
      branchId TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'Open',
      response TEXT,
      respondedAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parentId) REFERENCES users(id)
    )`,

    // Events — institute/branch events
    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      startDate TEXT,
      endDate TEXT,
      location TEXT,
      type TEXT DEFAULT 'Event',
      instituteId TEXT,
      branchId TEXT,
      createdBy TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )`,

    // Library books
    `CREATE TABLE IF NOT EXISTS library_books (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      isbn TEXT,
      category TEXT,
      totalCopies INTEGER DEFAULT 1,
      availableCopies INTEGER DEFAULT 1,
      shelf TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branchId) REFERENCES branches(id)
    )`,

    // Transport routes
    `CREATE TABLE IF NOT EXISTS transport_routes (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      routeName TEXT NOT NULL,
      driver TEXT,
      vehicleNo TEXT,
      fare REAL DEFAULT 0,
      stops TEXT,
      capacity INTEGER DEFAULT 30,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branchId) REFERENCES branches(id)
    )`,

    // Manual revenue entries — Super Admin enters revenue per institute,
    // Institute Admin enters revenue per branch. Drives the finance dashboards.
    `CREATE TABLE IF NOT EXISTS manual_revenue (
      id TEXT PRIMARY KEY,
      enteredBy TEXT NOT NULL,
      enteredByRole TEXT NOT NULL,
      instituteId TEXT,
      sourceType TEXT NOT NULL,
      sourceId TEXT NOT NULL,
      sourceName TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )`,

    // Timetable — weekly class schedule entries (one row per period per day)
    `CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      classId TEXT,
      className TEXT,
      section TEXT DEFAULT 'A',
      day TEXT NOT NULL,
      period INTEGER NOT NULL,
      startTime TEXT,
      endTime TEXT,
      subject TEXT,
      teacherId TEXT,
      teacherName TEXT,
      roomId TEXT,
      roomName TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branchId) REFERENCES branches(id)
    )`,

    // Report cards — generated per student per term/exam
    `CREATE TABLE IF NOT EXISTS report_cards (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT,
      class TEXT,
      section TEXT DEFAULT 'A',
      branchId TEXT,
      instituteId TEXT,
      term TEXT NOT NULL,
      examName TEXT,
      totalMarks INTEGER DEFAULT 0,
      obtainedMarks INTEGER DEFAULT 0,
      percentage REAL DEFAULT 0,
      grade TEXT,
      remarks TEXT,
      generatedBy TEXT,
      generatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (studentId) REFERENCES users(id)
    )`,

    // Royalty settings — Institute Admin sets royalty method per branch
    // method: 'per_student' (amount × student count), 'fixed' (flat monthly), 'percentage' (% of branch revenue)
    `CREATE TABLE IF NOT EXISTS royalty_settings (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      instituteId TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'fixed',
      amount REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      effectiveFrom TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branchId) REFERENCES branches(id)
    )`,

    // Royalty invoices — auto-generated monthly per branch based on royalty settings
    `CREATE TABLE IF NOT EXISTS royalty_invoices (
      id TEXT PRIMARY KEY,
      branchId TEXT NOT NULL,
      instituteId TEXT NOT NULL,
      branchName TEXT,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      method TEXT,
      studentCount INTEGER DEFAULT 0,
      branchRevenue REAL DEFAULT 0,
      royaltyAmount REAL NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'Pending',
      paidDate TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branchId) REFERENCES branches(id)
    )`,
  ];

  for (const sql of statements) {
    try {
      await db.execute(sql);
    } catch (e) {
      // Table might already exist — ignore
    }
  }

  // === Drop and recreate tables that have schema conflicts ===
  // The attendance/results tables may have been created with an older schema
  // that conflicts with the current code. Drop and recreate them.
  const dropAndRecreate = [
    { drop: 'DROP TABLE IF EXISTS attendance', create: `CREATE TABLE attendance (
      id TEXT PRIMARY KEY,
      branchId TEXT,
      classId TEXT,
      date TEXT NOT NULL,
      teacherId TEXT,
      records TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )` },
    { drop: 'DROP TABLE IF EXISTS results', create: `CREATE TABLE results (
      id TEXT PRIMARY KEY,
      branchId TEXT,
      exam TEXT NOT NULL,
      courseId TEXT,
      classId TEXT,
      teacherId TEXT,
      totalMarks INTEGER DEFAULT 100,
      date TEXT NOT NULL,
      records TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )` },
  ];

  for (const { drop, create } of dropAndRecreate) {
    try {
      await db.execute(drop);
      await db.execute(create);
      console.log(`Dropped and recreated table`);
    } catch (e) {
      // Ignore — table might not exist
    }
  }

  // === Migrations: add missing columns to existing tables ===
  const migrations = [
    { table: 'attendance', column: 'branchId', sql: 'ALTER TABLE attendance ADD COLUMN branchId TEXT' },
    { table: 'attendance', column: 'classId', sql: 'ALTER TABLE attendance ADD COLUMN classId TEXT' },
    { table: 'attendance', column: 'teacherId', sql: 'ALTER TABLE attendance ADD COLUMN teacherId TEXT' },
    { table: 'attendance', column: 'records', sql: 'ALTER TABLE attendance ADD COLUMN records TEXT' },
    { table: 'attendance', column: 'date', sql: 'ALTER TABLE attendance ADD COLUMN date TEXT' },
    { table: 'attendance', column: 'createdAt', sql: 'ALTER TABLE attendance ADD COLUMN createdAt TEXT DEFAULT (datetime(\'now\'))' },
    { table: 'results', column: 'courseId', sql: 'ALTER TABLE results ADD COLUMN courseId TEXT' },
    { table: 'results', column: 'classId', sql: 'ALTER TABLE results ADD COLUMN classId TEXT' },
    { table: 'results', column: 'records', sql: 'ALTER TABLE results ADD COLUMN records TEXT' },
    { table: 'results', column: 'exam', sql: 'ALTER TABLE results ADD COLUMN exam TEXT' },
    { table: 'results', column: 'teacherId', sql: 'ALTER TABLE results ADD COLUMN teacherId TEXT' },
    { table: 'results', column: 'totalMarks', sql: 'ALTER TABLE results ADD COLUMN totalMarks INTEGER DEFAULT 100' },
    { table: 'results', column: 'date', sql: 'ALTER TABLE results ADD COLUMN date TEXT' },
    { table: 'results', column: 'createdAt', sql: 'ALTER TABLE results ADD COLUMN createdAt TEXT DEFAULT (datetime(\'now\'))' },
    { table: 'users', column: 'mustChangePassword', sql: 'ALTER TABLE users ADD COLUMN mustChangePassword INTEGER NOT NULL DEFAULT 0' },
    { table: 'users', column: 'blocked', sql: 'ALTER TABLE users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0' },
    { table: 'users', column: 'blockedReason', sql: 'ALTER TABLE users ADD COLUMN blockedReason TEXT' },
    { table: 'users', column: 'rollNo', sql: 'ALTER TABLE users ADD COLUMN rollNo TEXT' },
    { table: 'institutes', column: 'blocked', sql: 'ALTER TABLE institutes ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0' },
    { table: 'institutes', column: 'blockedReason', sql: 'ALTER TABLE institutes ADD COLUMN blockedReason TEXT' },
    { table: 'branches', column: 'blocked', sql: 'ALTER TABLE branches ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0' },
    { table: 'branches', column: 'blockedReason', sql: 'ALTER TABLE branches ADD COLUMN blockedReason TEXT' },
  ];

  for (const migration of migrations) {
    try {
      // Check if column exists first
      const check = await db.execute({ sql: `PRAGMA table_info(${migration.table})`, args: [] });
      const columns = check.rows.map(r => r.name);
      if (!columns.includes(migration.column)) {
        await db.execute(migration.sql);
        console.log(`Migration: added ${migration.column} to ${migration.table}`);
      }
    } catch (e) {
      // Column might already exist or table doesn't exist — ignore
    }
  }

  // Seed super admin if not exists
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE role = ?', args: ['super-admin'] });
  if (existing.rows.length === 0) {
    await db.execute({
      sql: `INSERT INTO users (id, name, email, password, role, status, title, mustChangePassword, blocked)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['U-SUPER', 'Faisal Khan', 'faisu577277@gmail.com', 'QaReLc_61y8', 'super-admin', 'Active', 'Chief Executive Officer', 0, 0],
    });
    console.log('Super admin seeded');
  }
  console.log('Turso DB initialized');
}
