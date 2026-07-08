// eSM — NO DUMMY DATA. Only reference/lookup data + the Super Admin login.
// Everything else is created through the UI and stored in memory.

// Reference data (not dummy — needed for dropdowns & forms)
export const classes = ['Pre-K','KG','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
export const sections = ['A','B','C'];
export const subjects = ['Mathematics','English','Physics','Chemistry','Biology','Computer Science','History','Geography','Art','Economics','Business Studies'];

// ============================================================
// ONLY the Super Admin is seeded. All other data is created via the UI.
// ============================================================
export const institutes = [];
export const branches = [];
export const platformUsers = [
  { id: 'U-SUPER', name: 'Platform Owner', email: 'owner@esm-platform.com', password: 'esm123', role: 'super-admin', status: 'Active', title: 'Chief Executive Officer' },
];

// Dynamic data stores — all start EMPTY, populated by real user actions
export const attendanceRecords = [];   // { id, branchId, class, section, date, teacherId, records: [{studentId, status}] }
export const resultRecords = [];       // { id, branchId, exam, subject, teacherId, totalMarks, date, records: [{studentId, marks, grade}] }
export const feeTransactions = [];     // { id, studentId, instituteId, branchId, amount, type, date, status, method }
export const smsRecords = [];          // { id, senderId, instituteId, branchId, text, recipients, type, status, sentAt }
export const diaryEntries = [];        // { id, teacherId, branchId, subject, title, desc, due, class, date }
export const complaints = [];          // { id, parentId, studentId, instituteId, branchId, subject, type, priority, status, date, messages: [{from, text, date}] }
export const events = [];              // { id, instituteId, branchId, name, date, type, venue, participants, prize, status, createdBy }
export const libraryBooks = [];        // { id, branchId, title, author, category, isbn, copies, available, cost, vendor, status }
export const transportRoutes = [];     // { id, branchId, name, vehicle, driver, students, fare }

// Simple ID counter helpers
let idCounters = { inst: 1, br: 1, u: 1, att: 1, res: 1, fee: 1, sms: 1, diary: 1, cmp: 1, evt: 1, bk: 1, rt: 1 };
export const nextId = (prefix) => {
  const map = {
    INST: 'inst', BR: 'br', U: 'u', ATT: 'att', RES: 'res', FEE: 'fee',
    SMS: 'sms', DIARY: 'diary', CMP: 'cmp', EVT: 'evt', BK: 'bk', RT: 'rt',
  };
  const key = map[prefix] || 'u';
  const n = idCounters[key]++;
  return `${prefix}-${String(n).padStart(3, '0')}`;
};

export const data = {
  classes, sections, subjects,
  institutes, branches, platformUsers,
  attendanceRecords, resultRecords, feeTransactions, smsRecords,
  diaryEntries, complaints, events, libraryBooks, transportRoutes,
};
