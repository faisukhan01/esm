// Role-scoped module catalogs — each role sees a different sidebar
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Building2, Network, Users, DollarSign, TrendingUp, Settings, ShieldCheck,
  CalendarCheck, GraduationCap, BookOpen, MessageSquare, Library, Bus, Trophy, Landmark,
  UserPlus, ClipboardList, FileText, Bell, CreditCard, Calendar, MessageCircleWarning,
} from 'lucide-react';

export type RoleModule = {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
};

export type RoleModules = {
  [role: string]: { group: string; items: RoleModule[] }[];
};

export const ROLE_MODULES: RoleModules = {
  'super-admin': [
    { group: 'Platform', items: [
      { id: 'platform-overview', name: 'Platform Overview', icon: LayoutDashboard, color: 'from-amber-500 to-orange-600' },
      { id: 'institutes', name: 'Institutes', icon: Building2, color: 'from-emerald-500 to-emerald-700' },
      { id: 'all-branches', name: 'All Branches', icon: Network, color: 'from-teal-500 to-cyan-600' },
      { id: 'platform-users', name: 'All Users', icon: Users, color: 'from-violet-500 to-purple-600' },
      { id: 'revenue', name: 'Revenue & Plans', icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-rose-500 to-pink-600' },
    ]},
    { group: 'Operations', items: [
      { id: 'students', name: 'All Students', icon: GraduationCap, color: 'from-emerald-600 to-emerald-800' },
      { id: 'attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-teal-500 to-cyan-600' },
      { id: 'fees', name: 'Fee Management', icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
      { id: 'results', name: 'Results', icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
      { id: 'sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-cyan-500 to-teal-600' },
    ]},
    { group: 'System', items: [
      { id: 'config', name: 'Platform Config', icon: Settings, color: 'from-slate-500 to-teal-700' },
      { id: 'branding', name: 'Branding', icon: ShieldCheck, color: 'from-rose-500 to-amber-600' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-slate-500 to-slate-700' },
    ]},
  ],
  'institute-admin': [
    { group: 'Institute', items: [
      { id: 'institute-overview', name: 'Institute Dashboard', icon: LayoutDashboard, color: 'from-emerald-500 to-emerald-700' },
      { id: 'branches', name: 'Branches', icon: Network, color: 'from-teal-500 to-cyan-600' },
      { id: 'staff', name: 'Staff & Managers', icon: Users, color: 'from-violet-500 to-purple-600' },
    ]},
    { group: 'Academics', items: [
      { id: 'students', name: 'Students', icon: GraduationCap, color: 'from-emerald-600 to-emerald-800' },
      { id: 'attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-teal-500 to-cyan-600' },
      { id: 'results', name: 'Results', icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
      { id: 'academics', name: 'Academics', icon: BookOpen, color: 'from-lime-500 to-emerald-600' },
    ]},
    { group: 'Finance & Comms', items: [
      { id: 'fees', name: 'Fee Management', icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
      { id: 'finance', name: 'Finance', icon: Landmark, color: 'from-yellow-600 to-amber-700' },
      { id: 'sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-cyan-500 to-teal-600' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-red-600' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-rose-500 to-pink-600' },
    ]},
    { group: 'Campus', items: [
      { id: 'events', name: 'Events', icon: Trophy, color: 'from-amber-500 to-rose-600' },
      { id: 'library', name: 'Library', icon: Library, color: 'from-emerald-500 to-teal-700' },
      { id: 'transport', name: 'Transport', icon: Bus, color: 'from-teal-500 to-emerald-700' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-slate-500 to-slate-700' },
    ]},
  ],
  'branch-manager': [
    { group: 'Branch', items: [
      { id: 'branch-overview', name: 'Branch Dashboard', icon: LayoutDashboard, color: 'from-teal-500 to-cyan-600' },
      { id: 'teachers', name: 'Teachers', icon: Users, color: 'from-violet-500 to-purple-600' },
      { id: 'branch-students', name: 'Students', icon: GraduationCap, color: 'from-emerald-600 to-emerald-800' },
      { id: 'add-teacher', name: 'Add Teacher', icon: UserPlus, color: 'from-amber-500 to-yellow-600' },
      { id: 'add-student', name: 'Add Student', icon: UserPlus, color: 'from-emerald-500 to-teal-600' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-rose-500 to-pink-600' },
      { id: 'class-courses', name: 'Classes & Courses', icon: BookOpen, color: 'from-lime-500 to-emerald-600' },
    ]},
    { group: 'Academics', items: [
      { id: 'attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-teal-500 to-cyan-600' },
      { id: 'results', name: 'Results', icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
      { id: 'timetable', name: 'Timetable', icon: Calendar, color: 'from-lime-500 to-emerald-600' },
    ]},
    { group: 'Operations', items: [
      { id: 'fees', name: 'Fees', icon: DollarSign, color: 'from-amber-500 to-yellow-600' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-red-600' },
      { id: 'events', name: 'Events', icon: Trophy, color: 'from-amber-500 to-rose-600' },
      { id: 'sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-cyan-500 to-teal-600' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-slate-500 to-slate-700' },
    ]},
  ],
  'teacher': [
    { group: 'Teaching', items: [
      { id: 'teacher-overview', name: 'My Classes', icon: LayoutDashboard, color: 'from-violet-500 to-purple-600' },
      { id: 'mark-attendance', name: 'Take Attendance', icon: CalendarCheck, color: 'from-teal-500 to-cyan-600' },
      { id: 'post-results', name: 'Post Results', icon: GraduationCap, color: 'from-emerald-600 to-emerald-800' },
      { id: 'diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-amber-500 to-yellow-600' },
      { id: 'timetable', name: 'My Timetable', icon: Calendar, color: 'from-lime-500 to-emerald-600' },
    ]},
    { group: 'Students', items: [
      { id: 'my-students', name: 'My Students', icon: Users, color: 'from-emerald-500 to-teal-700' },
      { id: 'announcements', name: 'Announcements', icon: Bell, color: 'from-rose-500 to-pink-600' },
      { id: 'sms', name: 'Message Parents', icon: MessageSquare, color: 'from-cyan-500 to-teal-600' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-slate-500 to-slate-700' },
    ]},
  ],
  'student': [
    { group: 'My Portal', items: [
      { id: 'student-overview', name: 'My Dashboard', icon: LayoutDashboard, color: 'from-cyan-500 to-teal-600' },
      { id: 'my-attendance', name: 'My Attendance', icon: CalendarCheck, color: 'from-emerald-500 to-emerald-700' },
      { id: 'my-results', name: 'My Results', icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
      { id: 'my-timetable', name: 'My Timetable', icon: Calendar, color: 'from-lime-500 to-emerald-600' },
      { id: 'my-diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-rose-500 to-amber-600' },
      { id: 'my-announcements', name: 'Announcements', icon: Bell, color: 'from-amber-500 to-rose-600' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-slate-500 to-slate-700' },
    ]},
  ],
  'parent': [
    { group: 'My Ward', items: [
      { id: 'parent-overview', name: 'Ward Dashboard', icon: LayoutDashboard, color: 'from-rose-500 to-pink-600' },
      { id: 'ward-attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-emerald-500 to-emerald-700' },
      { id: 'ward-results', name: 'Results', icon: GraduationCap, color: 'from-violet-500 to-purple-600' },
      { id: 'ward-fees', name: 'Pay Fees', icon: CreditCard, color: 'from-amber-500 to-yellow-600' },
      { id: 'ward-diary', name: 'Diary', icon: ClipboardList, color: 'from-teal-500 to-cyan-600' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-red-600' },
    ]},
  ],
};

export const roleAccent: Record<string, { from: string; to: string; text: string; bg: string }> = {
  'super-admin': { from: 'from-amber-600', to: 'to-orange-700', text: 'text-amber-600', bg: 'bg-amber-500/15' },
  'institute-admin': { from: 'from-emerald-600', to: 'to-emerald-800', text: 'text-emerald-600', bg: 'bg-emerald-500/15' },
  'branch-manager': { from: 'from-teal-600', to: 'to-cyan-700', text: 'text-teal-600', bg: 'bg-teal-500/15' },
  'teacher': { from: 'from-violet-600', to: 'to-purple-700', text: 'text-violet-600', bg: 'bg-violet-500/15' },
  'student': { from: 'from-cyan-600', to: 'to-teal-700', text: 'text-cyan-600', bg: 'bg-cyan-500/15' },
  'parent': { from: 'from-rose-600', to: 'to-pink-700', text: 'text-rose-600', bg: 'bg-rose-500/15' },
};
