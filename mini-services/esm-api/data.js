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
