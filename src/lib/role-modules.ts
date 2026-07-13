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
// `from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]` is the primary module gradient; `from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]`
// is used for secondary modules. Rose is reserved for destructive/block actions only.
export const ROLE_MODULES: RoleModules = {
  'super-admin': [
    { group: 'Platform', items: [
      { id: 'platform-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'institutes', name: 'Institutes', icon: Building2, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'System', items: [
      { id: 'config', name: 'Platform Config', icon: Settings, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'branding', name: 'Branding', icon: ShieldCheck, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
  ],
  'institute-admin': [
    { group: 'Institute', items: [
      { id: 'institute-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'branches', name: 'Branches', icon: Network, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
  ],
  'branch-manager': [
    { group: 'Branch', items: [
      { id: 'branch-overview', name: 'Branch Dashboard', icon: LayoutDashboard, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'teachers', name: 'Teachers', icon: Users, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'branch-students', name: 'Students', icon: GraduationCap, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'class-courses', name: 'Classes & Courses', icon: BookOpen, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'Academics', items: [
      { id: 'attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'results', name: 'Results', icon: GraduationCap, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'timetable', name: 'Timetable', icon: Calendar, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'Operations', items: [
      { id: 'fees', name: 'Fees', icon: DollarSign, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-rose-700' },
      { id: 'events', name: 'Events', icon: Trophy, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
  ],
  'teacher': [
    { group: 'Teaching', items: [
      { id: 'teacher-dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'teacher-overview', name: 'My Classes', icon: BookOpen, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'timetable', name: 'My Timetable', icon: Calendar, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'Communication', items: [
      { id: 'announcements', name: 'Announcements', icon: Bell, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'sms', name: 'Message Parents', icon: MessageSquare, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
  ],
  'student': [
    { group: 'My Portal', items: [
      { id: 'student-overview', name: 'My Dashboard', icon: LayoutDashboard, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'my-attendance', name: 'My Attendance', icon: CalendarCheck, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'my-results', name: 'My Results', icon: GraduationCap, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'my-invoices', name: 'Invoices', icon: CreditCard, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'my-timetable', name: 'My Timetable', icon: Calendar, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'my-diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'my-announcements', name: 'Announcements', icon: Bell, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
    ]},
  ],
  'parent': [
    { group: 'My Ward', items: [
      { id: 'parent-overview', name: 'Ward Dashboard', icon: LayoutDashboard, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'ward-attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'ward-results', name: 'Results', icon: GraduationCap, color: 'from-[oklch(0.25_0.05_260)] to-[oklch(0.2_0.04_260)]' },
      { id: 'ward-fees', name: 'Pay Fees', icon: CreditCard, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'ward-diary', name: 'Diary', icon: ClipboardList, color: 'from-[oklch(0.28_0.05_260)] to-[oklch(0.22_0.04_260)]' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-rose-700' },
    ]},
  ],
};

export const roleAccent: Record<string, { from: string; to: string; text: string; bg: string }> = {
  'super-admin': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-[oklch(0.22_0.04_260)]', bg: 'bg-[oklch(0.95_0.01_260)]0/15' },
  'institute-admin': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-[oklch(0.22_0.04_260)]', bg: 'bg-[oklch(0.95_0.01_260)]0/15' },
  'branch-manager': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-[oklch(0.22_0.04_260)]', bg: 'bg-[oklch(0.95_0.01_260)]0/15' },
  'teacher': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-[oklch(0.22_0.04_260)]', bg: 'bg-[oklch(0.95_0.01_260)]0/15' },
  'student': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-[oklch(0.22_0.04_260)]', bg: 'bg-[oklch(0.95_0.01_260)]0/15' },
  'parent': { from: 'from-blue-700', to: 'to-blue-900', text: 'text-[oklch(0.22_0.04_260)]', bg: 'bg-[oklch(0.95_0.01_260)]0/15' },
};
