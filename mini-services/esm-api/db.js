import { createClient } from '@libsql/client';

// Turso DB client — production database
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://campus-prod-faisukhan01.aws-ap-south-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
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
  ];

  for (const sql of statements) {
    try {
      await db.execute(sql);
    } catch (e) {
      // Table might already exist — ignore
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
