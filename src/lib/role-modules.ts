// Role-scoped module catalogs — each role sees a different sidebar
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Building2, Network, Users, DollarSign, TrendingUp, Settings, ShieldCheck,
  CalendarCheck, GraduationCap, BookOpen, MessageSquare, Library, Bus, Trophy, Landmark,
  ClipboardList, FileText, Bell, CreditCard, Calendar, MessageCircleWarning,
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

// Navy blue professional palette — clean, minimal, UCP/Odoo-inspired.
// `from-blue-600 to-blue-800` is the primary module gradient; `from-blue-500 to-blue-700`
// is used for secondary modules. Rose is reserved for destructive/block actions only.
export const ROLE_MODULES: RoleModules = {
  'super-admin': [
    { group: 'Platform', items: [
      { id: 'platform-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-600 to-blue-800' },
      { id: 'institutes', name: 'Institutes', icon: Building2, color: 'from-blue-600 to-blue-800' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'System', items: [
      { id: 'config', name: 'Platform Config', icon: Settings, color: 'from-blue-500 to-blue-700' },
      { id: 'branding', name: 'Branding', icon: ShieldCheck, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-blue-500 to-blue-700' },
    ]},
  ],
  'institute-admin': [
    { group: 'Institute', items: [
      { id: 'institute-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-600 to-blue-800' },
      { id: 'branches', name: 'Branches', icon: Network, color: 'from-blue-600 to-blue-800' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Branch Management', items: [
      { id: 'teachers', name: 'Teachers', icon: Users, color: 'from-blue-600 to-blue-800' },
      { id: 'branch-students', name: 'Students', icon: GraduationCap, color: 'from-blue-600 to-blue-800' },
      { id: 'class-courses', name: 'Classes & Courses', icon: BookOpen, color: 'from-blue-500 to-blue-700' },
      { id: 'fees', name: 'Fee Management', icon: DollarSign, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-blue-500 to-blue-700' },
    ]},
  ],
  'branch-manager': [
    { group: 'Branch', items: [
      { id: 'branch-overview', name: 'Branch Dashboard', icon: LayoutDashboard, color: 'from-blue-600 to-blue-800' },
      { id: 'teachers', name: 'Teachers', icon: Users, color: 'from-blue-600 to-blue-800' },
      { id: 'branch-students', name: 'Students', icon: GraduationCap, color: 'from-blue-600 to-blue-800' },
      { id: 'class-courses', name: 'Classes & Courses', icon: BookOpen, color: 'from-blue-500 to-blue-700' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Academics', items: [
      { id: 'attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-blue-500 to-blue-700' },
      { id: 'results', name: 'Results', icon: GraduationCap, color: 'from-blue-600 to-blue-800' },
      { id: 'timetable', name: 'Timetable', icon: Calendar, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Operations', items: [
      { id: 'fees', name: 'Fees', icon: DollarSign, color: 'from-blue-500 to-blue-700' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-rose-700' },
      { id: 'events', name: 'Events', icon: Trophy, color: 'from-blue-500 to-blue-700' },
      { id: 'sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-blue-500 to-blue-700' },
    ]},
  ],
  'teacher': [
    { group: 'Teaching', items: [
      { id: 'teacher-overview', name: 'My Classes', icon: LayoutDashboard, color: 'from-blue-600 to-blue-800' },
      { id: 'diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-blue-500 to-blue-700' },
      { id: 'timetable', name: 'My Timetable', icon: Calendar, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Communication', items: [
      { id: 'announcements', name: 'Announcements', icon: Bell, color: 'from-blue-500 to-blue-700' },
      { id: 'sms', name: 'Message Parents', icon: MessageSquare, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-blue-500 to-blue-700' },
    ]},
  ],
  'student': [
    { group: 'My Portal', items: [
      { id: 'student-overview', name: 'My Dashboard', icon: LayoutDashboard, color: 'from-blue-600 to-blue-800' },
      { id: 'my-attendance', name: 'My Attendance', icon: CalendarCheck, color: 'from-blue-500 to-blue-700' },
      { id: 'my-results', name: 'My Results', icon: GraduationCap, color: 'from-blue-600 to-blue-800' },
      { id: 'my-invoices', name: 'Invoices', icon: CreditCard, color: 'from-blue-500 to-blue-700' },
      { id: 'my-timetable', name: 'My Timetable', icon: Calendar, color: 'from-blue-500 to-blue-700' },
      { id: 'my-diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-blue-500 to-blue-700' },
      { id: 'my-announcements', name: 'Announcements', icon: Bell, color: 'from-blue-500 to-blue-700' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-blue-500 to-blue-700' },
    ]},
  ],
  'parent': [
    { group: 'My Ward', items: [
      { id: 'parent-overview', name: 'Ward Dashboard', icon: LayoutDashboard, color: 'from-blue-600 to-blue-800' },
      { id: 'ward-attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-blue-500 to-blue-700' },
      { id: 'ward-results', name: 'Results', icon: GraduationCap, color: 'from-blue-600 to-blue-800' },
      { id: 'ward-fees', name: 'Pay Fees', icon: CreditCard, color: 'from-blue-500 to-blue-700' },
      { id: 'ward-diary', name: 'Diary', icon: ClipboardList, color: 'from-blue-500 to-blue-700' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-rose-700' },
    ]},
  ],
};

export const roleAccent: Record<string, { from: string; to: string; text: string; bg: string }> = {
  'super-admin': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-blue-700', bg: 'bg-blue-500/15' },
  'institute-admin': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-blue-700', bg: 'bg-blue-500/15' },
  'branch-manager': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-blue-700', bg: 'bg-blue-500/15' },
  'teacher': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-blue-700', bg: 'bg-blue-500/15' },
  'student': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-blue-700', bg: 'bg-blue-500/15' },
  'parent': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-blue-700', bg: 'bg-blue-500/15' },
};
