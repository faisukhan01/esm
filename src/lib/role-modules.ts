// Role-scoped module catalogs — each role sees a different sidebar
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Building2, Network, Users, DollarSign, TrendingUp, Settings, ShieldCheck,
  CalendarCheck, GraduationCap, BookOpen, MessageSquare, Library, Bus, Trophy, Landmark,
  ClipboardList, FileText, Bell, CreditCard, Calendar, MessageCircleWarning, Award, Crown,
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
// `from-primary to-primary/80` is the primary module gradient; `from-primary/80 to-primary`
// is used for secondary modules. Rose is reserved for destructive/block actions only.
export const ROLE_MODULES: RoleModules = {
  'super-admin': [
    { group: 'Platform', items: [
      { id: 'platform-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'institutes', name: 'Institutes', icon: Building2, color: 'from-primary to-primary/80' },
      { id: 'platform-analytics', name: 'Analytics', icon: TrendingUp, color: 'from-primary to-primary/80' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'System', items: [
      { id: 'config', name: 'Platform Config', icon: Settings, color: 'from-primary/80 to-primary' },
      { id: 'branding', name: 'Branding', icon: ShieldCheck, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'institute-admin': [
    { group: 'Institute', items: [
      { id: 'institute-overview', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'branches', name: 'Branches', icon: Network, color: 'from-primary to-primary/80' },
      { id: 'institute-royalty', name: 'Royalty Management', icon: DollarSign, color: 'from-primary to-primary/80' },
      { id: 'institute-fees', name: 'Fee Management', icon: CreditCard, color: 'from-primary to-primary/80' },
      { id: 'institute-teachers', name: 'Teachers & Salaries', icon: Users, color: 'from-primary to-primary/80' },
      { id: 'institute-students', name: 'Students', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'institute-academics', name: 'Academics', icon: BookOpen, color: 'from-primary/80 to-primary' },
      { id: 'institute-reports', name: 'Reports', icon: TrendingUp, color: 'from-primary/80 to-primary' },
      { id: 'institute-complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-rose-700' },
      { id: 'institute-events', name: 'Events', icon: Trophy, color: 'from-primary/80 to-primary' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'branch-manager': [
    { group: 'Branch', items: [
      { id: 'branch-overview', name: 'Branch Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'teachers', name: 'Teachers', icon: Users, color: 'from-primary to-primary/80' },
      { id: 'branch-students', name: 'Students', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'class-courses', name: 'Classes & Courses', icon: BookOpen, color: 'from-primary/80 to-primary' },
      { id: 'announcements', name: 'Announcements', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Academics', items: [
      { id: 'attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
      { id: 'results', name: 'Results', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'report-cards', name: 'Report Cards', icon: Award, color: 'from-primary to-primary/80' },
      { id: 'timetable', name: 'Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Operations', items: [
      { id: 'fees', name: 'Fees', icon: DollarSign, color: 'from-primary/80 to-primary' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-rose-700' },
      { id: 'events', name: 'Events', icon: Trophy, color: 'from-primary/80 to-primary' },
      { id: 'sms', name: 'SMS Portal', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'teacher': [
    { group: 'Teaching', items: [
      { id: 'teacher-dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'teacher-overview', name: 'My Classes', icon: BookOpen, color: 'from-primary to-primary/80' },
      { id: 'diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'timetable', name: 'My Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Communication', items: [
      { id: 'announcements', name: 'Announcements', icon: Bell, color: 'from-primary/80 to-primary' },
      { id: 'sms', name: 'Message Parents', icon: MessageSquare, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'student': [
    { group: 'My Portal', items: [
      { id: 'student-overview', name: 'My Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'my-attendance', name: 'My Attendance', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
      { id: 'my-results', name: 'My Results', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'my-report-card', name: 'Report Card', icon: Award, color: 'from-primary to-primary/80' },
      { id: 'my-invoices', name: 'Invoices', icon: CreditCard, color: 'from-primary/80 to-primary' },
      { id: 'my-timetable', name: 'My Timetable', icon: Calendar, color: 'from-primary/80 to-primary' },
      { id: 'my-diary', name: 'Diary & Homework', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'my-announcements', name: 'Announcements', icon: Bell, color: 'from-primary/80 to-primary' },
    ]},
    { group: 'Account', items: [
      { id: 'settings', name: 'Settings', icon: Settings, color: 'from-primary/80 to-primary' },
    ]},
  ],
  'parent': [
    { group: 'My Ward', items: [
      { id: 'parent-overview', name: 'Ward Dashboard', icon: LayoutDashboard, color: 'from-primary to-primary/80' },
      { id: 'ward-attendance', name: 'Attendance', icon: CalendarCheck, color: 'from-primary/80 to-primary' },
      { id: 'ward-results', name: 'Results', icon: GraduationCap, color: 'from-primary to-primary/80' },
      { id: 'ward-fees', name: 'Pay Fees', icon: CreditCard, color: 'from-primary/80 to-primary' },
      { id: 'ward-diary', name: 'Diary', icon: ClipboardList, color: 'from-primary/80 to-primary' },
      { id: 'complaints', name: 'Complaints', icon: MessageCircleWarning, color: 'from-rose-500 to-rose-700' },
    ]},
  ],
};

export const roleAccent: Record<string, { from: string; to: string; text: string; bg: string }> = {
  'super-admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'institute-admin': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'branch-manager': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'teacher': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'student': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
  'parent': { from: 'from-primary', to: 'to-primary/80', text: 'text-primary', bg: 'bg-primary/10' },
};
