// eSM seed data — realistic educational institution dataset
// All data is generated deterministically for a stable demo experience.

const firstNames = ['Aiden','Sofia','Liam','Olivia','Noah','Emma','Lucas','Ava','Mason','Mia','Ethan','Isabella','Logan','Zoe','Caleb','Amelia','Jayden','Layla','Elijah','Nora','Daniel','Aria','Henry','Chloe','Owen','Grace','Sebastian','Hana','Leo','Maya','Ezra','Stella','Gabriel','Lila','Anthony','Eva','Jack','Ruby','Nathan','Elena','David','Aaliyah','Theodore','Sara','Matthew','Lina','Asher','Rosa','Julian','Violet'];
const lastNames = ['Carter','Bennett','Reyes','Foster','Patel','Nguyen','Kim','Singh','Garcia','Osei','Khan','Ahmed','Brown','Johnson','Martinez','Davis','Wilson','Tanaka','Hassan','Lee','Thompson','Walker','Hall','Lopez','Gonzalez','Robinson','Wright','Hernandez','Young','Ali'];
const classes = ['Pre-K','KG','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
const sections = ['A','B','C'];
const statuses = ['Present','Absent','Late','Excused'];
const cities = ['Austin','Lahore','Karachi','Boston','Seattle','Dallas'];
const feeStatuses = ['Paid','Pending','Overdue','Partial'];

function rand(seed) {
  // deterministic pseudo-random
  let h = 2166136261 ^ seed;
  h += h << 13; h ^= h >>> 7;
  h += h << 3;  h ^= h >>> 17;
  h += h << 5;
  return ((h >>> 0) % 100000) / 100000;
}
function pick(arr, n) { return arr[Math.floor(rand(n) * arr.length)]; }

const students = [];
for (let i = 0; i < 48; i++) {
  const cls = classes[i % classes.length];
  const sec = sections[i % sections.length];
  const fn = pick(firstNames, i*7+1);
  const ln = pick(lastNames, i*13+3);
  const gradeFee = 1200 + (i % classes.length) * 180;
  const status = pick(feeStatuses, i*5+9);
  const gpa = Math.round((2.8 + rand(i*3+2) * 1.2) * 100) / 100;
  students.push({
    id: 'STU-' + String(1001 + i),
    name: `${fn} ${ln}`,
    rollNo: String(1001 + i),
    class: cls,
    section: sec,
    gender: i % 3 === 0 ? 'Female' : (i % 3 === 1 ? 'Male' : 'Other'),
    guardian: `${pick(lastNames, i*11+5)} Family`,
    phone: `+1 (512) 555-${String(1000 + i).padStart(4,'0')}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@esm-edu.us`,
    city: pick(cities, i*17+4),
    feeStatus: status,
    feeAmount: gradeFee,
    feePaid: status === 'Paid' ? gradeFee : (status === 'Partial' ? Math.round(gradeFee*0.5) : 0),
    gpa,
    attendance: Math.round(82 + rand(i*2+1) * 17),
    enrolledOn: new Date(2023, i % 12, (i % 27)+1).toISOString().slice(0,10),
    status: i % 20 === 0 ? 'Inactive' : 'Active',
    avatarColor: ['emerald','amber','rose','violet','cyan','orange'][i % 6],
  });
}

// attendance for last 30 days
const attendanceSeries = [];
for (let d = 29; d >= 0; d--) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  const present = 820 + Math.round(rand(d*7+1) * 130);
  const absent = 30 + Math.round(rand(d*9+3) * 40);
  const late = 20 + Math.round(rand(d*5+5) * 30);
  attendanceSeries.push({
    date: date.toISOString().slice(0,10),
    present, absent, late,
    rate: Math.round((present / (present+absent+late)) * 1000) / 10,
  });
}

// fee collection monthly
const feeMonthly = [];
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
for (let m = 0; m < 12; m++) {
  feeMonthly.push({
    month: monthNames[m],
    collected: 380000 + Math.round(rand(m*11+2) * 90000),
    pending: 40000 + Math.round(rand(m*13+4) * 50000),
    overdue: 8000 + Math.round(rand(m*17+6) * 22000),
  });
}

// results by subject
const subjects = ['Mathematics','English','Physics','Chemistry','Biology','Computer Science','History','Geography','Art'];
const results = subjects.map((s, i) => ({
  subject: s,
  avgScore: Math.round(68 + rand(i*7+1) * 28),
  highest: Math.round(88 + rand(i*5+2) * 12),
  lowest: Math.round(45 + rand(i*3+3) * 25),
  passRate: Math.round(72 + rand(i*9+4) * 26),
  students: 48,
}));

// recent result cards
const resultCards = students.slice(0, 10).map((st, i) => ({
  id: 'RES-' + (501 + i),
  studentId: st.id,
  studentName: st.name,
  class: st.class,
  exam: pick(['Weekly Test','Monthly Test','Mid-Term','Pre-Board'], i*3+1),
  totalMarks: 500,
  obtained: Math.round(280 + rand(i*7+2) * 200),
  percentage: 0,
  grade: '',
  rank: 0,
})).map(r => {
  r.percentage = Math.round((r.obtained / r.totalMarks) * 1000) / 10;
  r.grade = r.percentage >= 90 ? 'A+' : r.percentage >= 80 ? 'A' : r.percentage >= 70 ? 'B' : r.percentage >= 60 ? 'C' : r.percentage >= 50 ? 'D' : 'F';
  return r;
});
resultCards.sort((a,b) => b.obtained - a.obtained).forEach((r,i) => r.rank = i+1);

// SMS log
const smsTemplates = [
  { type: 'Absent Alert', text: 'Dear Parent, your child was absent today. Please contact the school office.', recipients: 142 },
  { type: 'Fee Deposit', text: 'Fee of $1,200 has been received. Thank you. - eSM School', recipients: 98 },
  { type: 'Result Announcement', text: 'Monthly test results have been published. Check the parent app.', recipients: 48 },
  { type: 'Holiday Notice', text: 'School will remain closed on Monday for the federal holiday.', recipients: 1240 },
  { type: 'PTM Reminder', text: 'Parent-Teacher Meeting scheduled for Saturday 10:00 AM.', recipients: 980 },
  { type: 'Late Arrival', text: 'Your child arrived late to school today. Please ensure punctuality.', recipients: 34 },
];
const smsLog = [];
for (let i = 0; i < 24; i++) {
  const t = smsTemplates[i % smsTemplates.length];
  const d = new Date();
  d.setHours(d.getHours() - i*3);
  smsLog.push({
    id: 'SMS-' + (2001+i),
    type: t.type,
    text: t.text,
    recipients: t.recipients,
    status: i % 7 === 0 ? 'Failed' : (i % 4 === 0 ? 'Pending' : 'Delivered'),
    sentAt: d.toISOString(),
    sender: 'eSM Alerts',
  });
}

// staff / HR
const departments = ['Administration','Mathematics','Science','English','Social Studies','Sports','IT','Finance'];
const designations = ['Principal','Vice Principal','Senior Teacher','Teacher','Lab Assistant','Accountant','Librarian','Driver'];
const staff = [];
for (let i = 0; i < 24; i++) {
  const fn = pick(firstNames, i*23+1);
  const ln = pick(lastNames, i*29+2);
  staff.push({
    id: 'EMP-' + String(301+i),
    name: `${fn} ${ln}`,
    department: departments[i % departments.length],
    designation: pick(designations, i*7+3),
    phone: `+1 (512) 555-${String(2000+i).padStart(4,'0')}`,
    email: `${fn.toLowerCase()}${i}@esm-edu.us`,
    salary: 3200 + (i % designations.length) * 850,
    joinDate: new Date(2018 + (i%6), i%12, (i%27)+1).toISOString().slice(0,10),
    status: i % 15 === 0 ? 'On Leave' : 'Active',
    attendance: Math.round(85 + rand(i*5+1) * 14),
  });
}

// library books
const bookTitles = ['Calculus Made Easy','To Kill a Mockingbird','A Brief History of Time','The Selfish Gene','1984','Pride and Prejudice','The Great Gatsby','Sapiens','Atomic Habits','The Alchemist','Lord of the Flies','Educated','Thinking Fast and Slow','The Odyssey','Charlotte\'s Web','The Hobbit','Brave New World','Fahrenheit 451','Jane Eyre','Wuthering Heights','Moby Dick','Hamlet','Macbeth','The Kite Runner'];
const authors = ['Silvanus Thompson','Harper Lee','Stephen Hawking','Richard Dawkins','George Orwell','Jane Austen','F. Scott Fitzgerald','Yuval Noah Harari','James Clear','Paulo Coelho','William Golding','Tara Westover','Daniel Kahneman','Homer','E.B. White','J.R.R. Tolkien','Aldous Huxley','Ray Bradbury','Charlotte Brontë','Emily Brontë','Herman Melville','William Shakespeare','William Shakespeare','Khaled Hosseini'];
const library = bookTitles.map((t, i) => ({
  id: 'BK-' + String(7001+i),
  title: t,
  author: authors[i],
  category: pick(['Fiction','Science','Mathematics','Literature','Biography','History'], i*5+1),
  isbn: `978-${1000000000 + i*137}`,
  copies: 1 + (i % 5),
  available: (i % 4 !== 0) ? (1 + (i % 5)) : (i % 5),
  cost: 12 + (i * 3) % 45,
  vendor: pick(['Global Books Co.','EduPress','Scholar Supply','ReadMore Inc.'], i*3+2),
  status: i % 9 === 0 ? 'Lost' : (i % 4 === 0 ? 'Issued' : 'Available'),
}));

// transport
const routes = [
  { id: 'R-01', name: 'North Austin Route', vehicle: 'Bus-101', driver: 'James Carter', students: 32, fare: 180 },
  { id: 'R-02', name: 'South Austin Route', vehicle: 'Bus-102', driver: 'Maria Lopez', students: 28, fare: 180 },
  { id: 'R-03', name: 'East Loop Route', vehicle: 'Bus-103', driver: 'Robert Kim', students: 24, fare: 160 },
  { id: 'R-04', name: 'West Hills Route', vehicle: 'Van-201', driver: 'David Singh', students: 14, fare: 220 },
  { id: 'R-05', name: 'Downtown Express', vehicle: 'Bus-104', driver: 'Sarah Ahmed', students: 38, fare: 200 },
  { id: 'R-06', name: 'Suburb Connector', vehicle: 'Van-202', driver: 'Michael Brown', students: 18, fare: 190 },
];

// events
const events = [
  { id: 'E-01', name: 'Annual Science Fair', date: '2025-11-15', type: 'Academic', participants: 240, status: 'Upcoming', venue: 'Main Hall', prize: '$500' },
  { id: 'E-02', name: 'Inter-Class Debate', date: '2025-11-22', type: 'Competition', participants: 60, status: 'Upcoming', venue: 'Auditorium', prize: '$300' },
  { id: 'E-03', name: 'Sports Day', date: '2025-12-05', type: 'Sports', participants: 480, status: 'Upcoming', venue: 'Sports Ground', prize: 'Trophies' },
  { id: 'E-04', name: 'Art Exhibition', date: '2025-10-28', type: 'Cultural', participants: 150, status: 'Completed', venue: 'Art Block', prize: 'Certificates' },
  { id: 'E-05', name: 'Spelling Bee', date: '2025-11-08', type: 'Academic', participants: 90, status: 'Upcoming', venue: 'Library', prize: '$200' },
  { id: 'E-06', name: 'Annual Day', date: '2025-12-20', type: 'Cultural', participants: 600, status: 'Upcoming', venue: 'Main Hall', prize: 'Medals' },
];

// finance
const financeVouchers = ['JV','CRV','CPV','BRV','BPV','PV','SV'];
const financeTransactions = [];
for (let i = 0; i < 20; i++) {
  const v = financeVouchers[i % financeVouchers.length];
  const d = new Date();
  d.setDate(d.getDate() - i);
  financeTransactions.push({
    id: v + '-' + String(8001+i),
    type: v,
    date: d.toISOString().slice(0,10),
    account: pick(['Tuition Income','Salaries Expense','Utilities','Building Maintenance','Transport Income','Library Supplies','Marketing'], i*5+1),
    debit: i % 2 === 0 ? Math.round(2000 + rand(i*7+1) * 18000) : 0,
    credit: i % 2 !== 0 ? Math.round(2000 + rand(i*9+2) * 22000) : 0,
    description: pick(['Monthly recurring entry','Vendor payment','Fee collection','Salary disbursement','Utility bill','Maintenance work','Office supplies'], i*4+3),
    status: i % 6 === 0 ? 'Draft' : 'Posted',
  });
}

// inquiries
const inquiryStatuses = ['New','Follow-up','Mature','Immature','Admitted','Lost'];
const inquiries = [];
for (let i = 0; i < 16; i++) {
  inquiries.push({
    id: 'INQ-' + String(9001+i),
    name: `${pick(firstNames, i*31+1)} ${pick(lastNames, i*37+2)}`,
    phone: `+1 (512) 555-${String(3000+i).padStart(4,'0')}`,
    class: classes[i % classes.length],
    source: pick(['Website','Walk-in','Referral','Social Media','Phone Call'], i*5+1),
    status: inquiryStatuses[i % inquiryStatuses.length],
    date: new Date(Date.now() - i*86400000*2).toISOString().slice(0,10),
    followUp: i % 3 === 0,
    notes: pick(['Interested in admissions tour','Awaiting test result','Requested fee structure','Sibling of current student','Needs transport info'], i*7+4),
  });
}

// complaints
const complaints = [];
const complaintTypes = ['Fee Dispute','Transport Issue','Bullying Report','Academic Concern','Facilities','Staff Behavior'];
for (let i = 0; i < 12; i++) {
  complaints.push({
    id: 'CMP-' + String(6001+i),
    student: students[i*2].name,
    type: complaintTypes[i % complaintTypes.length],
    subject: pick(['Late bus arrival','Fee charged incorrectly','Request for extra classes','Playground maintenance needed','Assignment grading concern'], i*4+1),
    priority: pick(['High','Medium','Low'], i*3+2),
    status: pick(['Open','In Progress','Resolved','Closed'], i*5+3),
    date: new Date(Date.now() - i*86400000*3).toISOString().slice(0,10),
    lastReply: pick(['Admin will look into it.','Forwarded to transport dept.','Scheduled meeting with parent.','Issue resolved, please confirm.'], i*6+1),
  });
}

// timetable sample
const timetable = ['Mon','Tue','Wed','Thu','Fri'].map(day => ({
  day,
  periods: [
    { time: '08:00 - 08:45', subject: pick(subjects, day.length*2+1), teacher: 'Ms. Davis' },
    { time: '08:45 - 09:30', subject: pick(subjects, day.length*3+2), teacher: 'Mr. Lee' },
    { time: '09:30 - 10:15', subject: pick(subjects, day.length*4+3), teacher: 'Ms. Garcia' },
    { time: '10:30 - 11:15', subject: pick(subjects, day.length*5+4), teacher: 'Mr. Patel' },
    { time: '11:15 - 12:00', subject: pick(subjects, day.length*6+5), teacher: 'Ms. Wilson' },
    { time: '13:00 - 13:45', subject: pick(subjects, day.length*7+6), teacher: 'Mr. Foster' },
    { time: '13:45 - 14:30', subject: pick(subjects, day.length*8+7), teacher: 'Ms. Tanaka' },
  ],
}));

// ============================================================
// MULTI-TENANT PLATFORM DATA
// Role hierarchy: super-admin → institute-admin → branch-manager → teacher → student/parent
// ============================================================

export const institutes = [
  { id: 'INST-001', name: 'Austin International School', short: 'AIS', city: 'Austin, TX', country: 'USA', plan: 'Enterprise', status: 'Active', adminName: 'Dr. Sarah Mitchell', adminEmail: 'admin@austinintl.edu', branches: 3, students: 642, staff: 48, revenue: 284000, createdAt: '2024-01-15', color: 'emerald', domain: 'austinintl.edu' },
  { id: 'INST-002', name: 'Lahore Grammar School', short: 'LGS', city: 'Lahore', country: 'Pakistan', plan: 'Premium', status: 'Active', adminName: 'Prof. Asif Khan', adminEmail: 'admin@lgs.edu.pk', branches: 5, students: 1240, staff: 96, revenue: 412000, createdAt: '2023-08-22', color: 'amber', domain: 'lgs.edu.pk' },
  { id: 'INST-003', name: 'Boston Science Academy', short: 'BSA', city: 'Boston, MA', country: 'USA', plan: 'Premium', status: 'Active', adminName: 'Dr. Emily Carter', adminEmail: 'admin@bsa.edu', branches: 2, students: 384, staff: 32, revenue: 198000, createdAt: '2024-03-10', color: 'violet', domain: 'bsa.edu' },
  { id: 'INST-004', name: 'Seattle Modern College', short: 'SMC', city: 'Seattle, WA', country: 'USA', plan: 'Starter', status: 'Trial', adminName: 'Mr. David Osei', adminEmail: 'admin@smc.edu', branches: 1, students: 142, staff: 14, revenue: 0, createdAt: '2025-01-08', color: 'cyan', domain: 'smc.edu' },
];

export const branches = [
  { id: 'BR-001', instituteId: 'INST-001', name: 'Austin Main Campus', city: 'Austin', manager: 'James Carter', managerEmail: 'manager.austin@austinintl.edu', students: 280, teachers: 22, status: 'Active' },
  { id: 'BR-002', instituteId: 'INST-001', name: 'Round Rock Branch', city: 'Round Rock', manager: 'Lisa Chen', managerEmail: 'manager.roundrock@austinintl.edu', students: 184, teachers: 14, status: 'Active' },
  { id: 'BR-003', instituteId: 'INST-001', name: 'Cedar Park Branch', city: 'Cedar Park', manager: 'Robert Kim', managerEmail: 'manager.cedarpark@austinintl.edu', students: 178, teachers: 12, status: 'Active' },
  { id: 'BR-004', instituteId: 'INST-002', name: 'Gulberg Campus', city: 'Lahore', manager: 'Ayesha Ahmed', managerEmail: 'manager.gulberg@lgs.edu.pk', students: 320, teachers: 26, status: 'Active' },
  { id: 'BR-005', instituteId: 'INST-002', name: 'Johar Town Campus', city: 'Lahore', manager: 'Bilal Hassan', managerEmail: 'manager.johar@lgs.edu.pk', students: 286, teachers: 22, status: 'Active' },
  { id: 'BR-006', instituteId: 'INST-002', name: 'DHA Campus', city: 'Lahore', manager: 'Fatima Ali', managerEmail: 'manager.dha@lgs.edu.pk', students: 312, teachers: 24, status: 'Active' },
  { id: 'BR-007', instituteId: 'INST-002', name: 'Model Town Campus', city: 'Lahore', manager: 'Usman Malik', managerEmail: 'manager.model@lgs.edu.pk', students: 168, teachers: 14, status: 'Active' },
  { id: 'BR-008', instituteId: 'INST-002', name: 'Bahria Town Campus', city: 'Lahore', manager: 'Zainab Raza', managerEmail: 'manager.bahria@lgs.edu.pk', students: 154, teachers: 10, status: 'Active' },
  { id: 'BR-009', instituteId: 'INST-003', name: 'Boston Main Campus', city: 'Boston', manager: 'Michael Brown', managerEmail: 'manager.boston@bsa.edu', students: 246, teachers: 20, status: 'Active' },
  { id: 'BR-010', instituteId: 'INST-003', name: 'Cambridge Branch', city: 'Cambridge', manager: 'Jennifer Lee', managerEmail: 'manager.cambridge@bsa.edu', students: 138, teachers: 12, status: 'Active' },
  { id: 'BR-011', instituteId: 'INST-004', name: 'Seattle Downtown Campus', city: 'Seattle', manager: 'Daniel Foster', managerEmail: 'manager.seattle@smc.edu', students: 142, teachers: 14, status: 'Active' },
];

// Role hierarchy login table — password is "esm123" for every demo account
export const platformUsers = [
  // Super Admin — the platform owner (YOU)
  { id: 'U-SUPER', name: 'Platform Owner', email: 'owner@esm-platform.com', password: 'esm123', role: 'super-admin', status: 'Active', title: 'Chief Executive Officer' },

  // Institute Admins (one per institute)
  { id: 'U-IA-001', name: 'Dr. Sarah Mitchell', email: 'admin@austinintl.edu', password: 'esm123', role: 'institute-admin', instituteId: 'INST-001', status: 'Active', title: 'Institute Administrator' },
  { id: 'U-IA-002', name: 'Prof. Asif Khan', email: 'admin@lgs.edu.pk', password: 'esm123', role: 'institute-admin', instituteId: 'INST-002', status: 'Active', title: 'Institute Administrator' },
  { id: 'U-IA-003', name: 'Dr. Emily Carter', email: 'admin@bsa.edu', password: 'esm123', role: 'institute-admin', instituteId: 'INST-003', status: 'Active', title: 'Institute Administrator' },
  { id: 'U-IA-004', name: 'Mr. David Osei', email: 'admin@smc.edu', password: 'esm123', role: 'institute-admin', instituteId: 'INST-004', status: 'Active', title: 'Institute Administrator' },

  // Branch Managers (one per branch)
  { id: 'U-BM-001', name: 'James Carter', email: 'manager.austin@austinintl.edu', password: 'esm123', role: 'branch-manager', instituteId: 'INST-001', branchId: 'BR-001', status: 'Active', title: 'Branch Manager' },
  { id: 'U-BM-002', name: 'Lisa Chen', email: 'manager.roundrock@austinintl.edu', password: 'esm123', role: 'branch-manager', instituteId: 'INST-001', branchId: 'BR-002', status: 'Active', title: 'Branch Manager' },
  { id: 'U-BM-003', name: 'Ayesha Ahmed', email: 'manager.gulberg@lgs.edu.pk', password: 'esm123', role: 'branch-manager', instituteId: 'INST-002', branchId: 'BR-004', status: 'Active', title: 'Branch Manager' },
  { id: 'U-BM-004', name: 'Michael Brown', email: 'manager.boston@bsa.edu', password: 'esm123', role: 'branch-manager', instituteId: 'INST-003', branchId: 'BR-009', status: 'Active', title: 'Branch Manager' },

  // Teachers (scoped to a branch)
  { id: 'U-T-001', name: 'Ms. Olivia Davis', email: 'teacher.davis@austinintl.edu', password: 'esm123', role: 'teacher', instituteId: 'INST-001', branchId: 'BR-001', status: 'Active', title: 'Senior Teacher', subjects: ['Mathematics','Physics'], classes: ['Grade 8','Grade 9'] },
  { id: 'U-T-002', name: 'Mr. Ethan Lee', email: 'teacher.lee@austinintl.edu', password: 'esm123', role: 'teacher', instituteId: 'INST-001', branchId: 'BR-001', status: 'Active', title: 'Teacher', subjects: ['English','History'], classes: ['Grade 7','Grade 8'] },
  { id: 'U-T-003', name: 'Ms. Sophia Garcia', email: 'teacher.garcia@lgs.edu.pk', password: 'esm123', role: 'teacher', instituteId: 'INST-002', branchId: 'BR-004', status: 'Active', title: 'Senior Teacher', subjects: ['Chemistry','Biology'], classes: ['Grade 10','Grade 11'] },

  // Students / Parents (scoped to a branch + a class)
  { id: 'U-ST-001', name: 'Aiden Carter', email: 'aiden.carter@student.austinintl.edu', password: 'esm123', role: 'student', instituteId: 'INST-001', branchId: 'BR-001', status: 'Active', title: 'Student', class: 'Grade 8', section: 'A', rollNo: '1001', guardian: 'James Carter' },
  { id: 'U-ST-002', name: 'Sofia Reyes', email: 'sofia.reyes@student.austinintl.edu', password: 'esm123', role: 'student', instituteId: 'INST-001', branchId: 'BR-001', status: 'Active', title: 'Student', class: 'Grade 9', section: 'B', rollNo: '1002', guardian: 'Maria Reyes' },
  { id: 'U-PA-001', name: 'Maria Reyes', email: 'parent.reyes@austinintl.edu', password: 'esm123', role: 'parent', instituteId: 'INST-001', branchId: 'BR-001', status: 'Active', title: 'Parent', ward: 'Sofia Reyes', wardId: 'U-ST-002' },
];

// Demo credential hints grouped by role — surfaced on the login screen
export const demoAccounts = [
  { role: 'super-admin', label: 'Super Admin (Platform Owner)', email: 'owner@esm-platform.com', password: 'esm123', desc: 'Manages all institutions, plans & platform revenue' },
  { role: 'institute-admin', label: 'Institute Admin', email: 'admin@austinintl.edu', password: 'esm123', desc: 'Runs one institute, manages branches & staff' },
  { role: 'branch-manager', label: 'Branch Manager', email: 'manager.austin@austinintl.edu', password: 'esm123', desc: 'Runs one branch, manages teachers & students' },
  { role: 'teacher', label: 'Teacher', email: 'teacher.davis@austinintl.edu', password: 'esm123', desc: 'Takes attendance, posts results & homework' },
  { role: 'student', label: 'Student', email: 'aiden.carter@student.austinintl.edu', password: 'esm123', desc: 'Views results, attendance, fees & timetable' },
  { role: 'parent', label: 'Parent', email: 'parent.reyes@austinintl.edu', password: 'esm123', desc: 'Tracks ward progress & pays fees' },
];

export const data = {
  students,
  attendanceSeries,
  feeMonthly,
  results,
  resultCards,
  smsLog,
  smsTemplates,
  staff,
  library,
  routes,
  events,
  financeTransactions,
  inquiries,
  complaints,
  timetable,
  classes,
  sections,
  subjects,
  institutes,
  branches,
  platformUsers,
};

export const stats = {
  totalStudents: 1248,
  totalStaff: 96,
  attendanceToday: 94.2,
  feeCollected: 1284500,
  feePending: 184200,
  feeOverdue: 42800,
  activeInquiries: 37,
  openComplaints: 5,
  booksIssued: 312,
  libraryBooks: 4820,
  vehicles: 6,
  routes: 6,
  eventsUpcoming: 5,
  avgGPA: 3.42,
  enrollmentTrend: '+8.4%',
  revenueTrend: '+12.1%',
};
