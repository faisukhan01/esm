'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircleWarning,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Star,
  Paperclip,
  Eye,
  Filter,
  Plus,
  ArrowUpRight,
  MessageSquare,
  ShieldCheck,
  X,
  ChevronDown,
  User,
  Image as ImageIcon,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';
type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
type Category = 'Academic' | 'Fee' | 'Transport' | 'Faculty' | 'Infrastructure' | 'Other';

interface ChatMessage {
  id: string;
  sender: 'complainant' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: ComplaintStatus;
  date: string;
  isAnonymous: boolean;
  chatHistory: ChatMessage[];
  timeline: TimelineStage[];
  rating?: number;
  feedback?: string;
}

interface TimelineStage {
  stage: string;
  timestamp: string;
  actor: string;
  completed: boolean;
  description: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────
const mockComplaints: Complaint[] = [
  {
    id: 'CMP-2025-0142',
    title: 'Library Air Conditioning Not Working',
    description: 'The air conditioning in the main library has been non-functional for over 2 weeks. Students are unable to study comfortably, especially during afternoon hours when temperatures exceed 35°C. Multiple complaints to the maintenance desk have gone unanswered.',
    category: 'Infrastructure',
    priority: 'High',
    status: 'In Progress',
    date: '2025-02-18',
    isAnonymous: false,
    chatHistory: [
      { id: 'm1', sender: 'complainant', senderName: 'Ahmed Khan', message: 'The AC in the library has been broken for 2 weeks now. Students are suffering in the heat.', timestamp: '2025-02-18 09:30' },
      { id: 'm2', sender: 'admin', senderName: 'Admin - Facilities', message: 'Thank you for reporting this. We have logged a maintenance request with the vendor. Expected repair date: Feb 22.', timestamp: '2025-02-18 14:15' },
      { id: 'm3', sender: 'complainant', senderName: 'Ahmed Khan', message: 'Is there an update? It\'s been 4 days and the situation is the same.', timestamp: '2025-02-22 10:00' },
      { id: 'm4', sender: 'admin', senderName: 'Admin - Facilities', message: 'The vendor visited today and identified a compressor failure. Parts have been ordered and repair is scheduled for Feb 25. Temporary fans have been placed in the library.', timestamp: '2025-02-22 16:45' },
    ],
    timeline: [
      { stage: 'Submitted', timestamp: '2025-02-18 09:30', actor: 'Ahmed Khan', completed: true, description: 'Complaint submitted via portal' },
      { stage: 'Acknowledged', timestamp: '2025-02-18 14:15', actor: 'Admin - Facilities', completed: true, description: 'Complaint reviewed and maintenance request logged' },
      { stage: 'In Progress', timestamp: '2025-02-22 16:45', actor: 'Admin - Facilities', completed: true, description: 'Vendor diagnosed compressor failure; parts ordered' },
      { stage: 'Resolved', timestamp: '', actor: '', completed: false, description: '' },
      { stage: 'Closed', timestamp: '', actor: '', completed: false, description: '' },
    ],
  },
  {
    id: 'CMP-2025-0138',
    title: 'Incorrect Fee Calculation for Semester 2',
    description: 'My fee invoice for Semester 2 shows an additional ₹5,000 lab fee, but I am enrolled in a non-lab program (B.Com). This appears to be a billing error that needs correction before the payment deadline.',
    category: 'Fee',
    priority: 'Critical',
    status: 'Escalated',
    date: '2025-02-15',
    isAnonymous: false,
    chatHistory: [
      { id: 'm5', sender: 'complainant', senderName: 'Sara Ali', message: 'There is an extra ₹5,000 lab fee on my invoice. I am in B.Com and should not have this charge.', timestamp: '2025-02-15 11:20' },
      { id: 'm6', sender: 'admin', senderName: 'Admin - Accounts', message: 'Let me check your enrollment records. Can you share your student ID?', timestamp: '2025-02-15 15:00' },
      { id: 'm7', sender: 'complainant', senderName: 'Sara Ali', message: 'My student ID is STU-2024-0847.', timestamp: '2025-02-15 15:12' },
      { id: 'm8', sender: 'admin', senderName: 'Admin - Accounts', message: 'I\'ve verified your enrollment. The lab fee appears to be a system error affecting multiple B.Com students. I am escalating this to the finance department for batch correction.', timestamp: '2025-02-16 09:30' },
      { id: 'm9', sender: 'admin', senderName: 'Admin - Finance Director', message: 'This has been escalated. We will issue corrected invoices by Feb 20. Payment deadline extended to Feb 28 for affected students.', timestamp: '2025-02-17 11:00' },
    ],
    timeline: [
      { stage: 'Submitted', timestamp: '2025-02-15 11:20', actor: 'Sara Ali', completed: true, description: 'Fee discrepancy reported' },
      { stage: 'Acknowledged', timestamp: '2025-02-15 15:00', actor: 'Admin - Accounts', completed: true, description: 'Accounts team reviewing enrollment records' },
      { stage: 'In Progress', timestamp: '2025-02-16 09:30', actor: 'Admin - Accounts', completed: true, description: 'System error confirmed; escalated to finance' },
      { stage: 'Resolved', timestamp: '', actor: '', completed: false, description: '' },
      { stage: 'Closed', timestamp: '', actor: '', completed: false, description: '' },
    ],
  },
  {
    id: 'CMP-2025-0135',
    title: 'Bus Route 7 Delay - Consistent 30min Lateness',
    description: 'Bus Route 7 has been consistently arriving 25-30 minutes late for the past month. Multiple students from the North Campus area are missing their first period. The driver cites traffic, but other routes manage on time.',
    category: 'Transport',
    priority: 'Medium',
    status: 'Open',
    date: '2025-02-12',
    isAnonymous: true,
    chatHistory: [
      { id: 'm10', sender: 'complainant', senderName: 'Anonymous', message: 'Route 7 bus is always 30 min late. This has been happening for a month now.', timestamp: '2025-02-12 08:15' },
    ],
    timeline: [
      { stage: 'Submitted', timestamp: '2025-02-12 08:15', actor: 'Anonymous', completed: true, description: 'Transport delay reported' },
      { stage: 'Acknowledged', timestamp: '', actor: '', completed: false, description: '' },
      { stage: 'In Progress', timestamp: '', actor: '', completed: false, description: '' },
      { stage: 'Resolved', timestamp: '', actor: '', completed: false, description: '' },
      { stage: 'Closed', timestamp: '', actor: '', completed: false, description: '' },
    ],
  },
  {
    id: 'CMP-2025-0129',
    title: 'Professor Not Covering Syllabus on Time',
    description: 'Our Mathematics professor for Class 11-A has only completed 40% of the syllabus with only 6 weeks remaining before board exams. Other sections have completed 75%. Request urgent intervention.',
    category: 'Academic',
    priority: 'High',
    status: 'Resolved',
    date: '2025-02-05',
    isAnonymous: false,
    chatHistory: [
      { id: 'm11', sender: 'complainant', senderName: 'Fatima Noor', message: 'Our math teacher is very behind on the syllabus. Board exams are approaching.', timestamp: '2025-02-05 10:00' },
      { id: 'm12', sender: 'admin', senderName: 'Admin - Academics', message: 'We take this very seriously. I will coordinate with the HOD Mathematics immediately.', timestamp: '2025-02-05 12:30' },
      { id: 'm13', sender: 'admin', senderName: 'Admin - Academics', message: 'Extra classes have been scheduled: Mon/Wed/Fri 3-4:30 PM. A substitute teacher will also assist. Syllabus completion target: March 10.', timestamp: '2025-02-07 09:00' },
      { id: 'm14', sender: 'complainant', senderName: 'Fatima Noor', message: 'Thank you! The extra classes are very helpful. We are now on track.', timestamp: '2025-02-20 14:00' },
    ],
    timeline: [
      { stage: 'Submitted', timestamp: '2025-02-05 10:00', actor: 'Fatima Noor', completed: true, description: 'Academic concern raised' },
      { stage: 'Acknowledged', timestamp: '2025-02-05 12:30', actor: 'Admin - Academics', completed: true, description: 'HOD Mathematics notified' },
      { stage: 'In Progress', timestamp: '2025-02-07 09:00', actor: 'Admin - Academics', completed: true, description: 'Extra classes & substitute arranged' },
      { stage: 'Resolved', timestamp: '2025-02-20 14:00', actor: 'Admin - Academics', completed: true, description: 'Student confirmed syllabus on track' },
      { stage: 'Closed', timestamp: '', actor: '', completed: false, description: '' },
    ],
    rating: 5,
    feedback: 'Excellent and swift response! The extra classes made a huge difference. Thank you for taking this seriously.',
  },
  {
    id: 'CMP-2025-0121',
    title: 'Rude Behavior by Lab Assistant',
    description: 'The chemistry lab assistant has been consistently rude and unhelpful to students during practical sessions. He refuses to explain equipment usage and speaks disrespectfully. Multiple students have experienced this.',
    category: 'Faculty',
    priority: 'Medium',
    status: 'Closed',
    date: '2025-01-22',
    isAnonymous: true,
    chatHistory: [
      { id: 'm15', sender: 'complainant', senderName: 'Anonymous', message: 'The chemistry lab assistant is very rude and unhelpful to students.', timestamp: '2025-01-22 11:00' },
      { id: 'm16', sender: 'admin', senderName: 'Admin - HR', message: 'We take faculty conduct seriously. An internal review will be conducted. Your identity will remain confidential.', timestamp: '2025-01-22 16:30' },
      { id: 'm17', sender: 'admin', senderName: 'Admin - HR', message: 'The lab assistant has been issued a formal warning and will undergo professional conduct training. A feedback mechanism for lab sessions has also been set up.', timestamp: '2025-02-01 10:00' },
    ],
    timeline: [
      { stage: 'Submitted', timestamp: '2025-01-22 11:00', actor: 'Anonymous', completed: true, description: 'Conduct complaint filed' },
      { stage: 'Acknowledged', timestamp: '2025-01-22 16:30', actor: 'Admin - HR', completed: true, description: 'Internal review initiated' },
      { stage: 'In Progress', timestamp: '2025-01-28 09:00', actor: 'Admin - HR', completed: true, description: 'Review completed; action decided' },
      { stage: 'Resolved', timestamp: '2025-02-01 10:00', actor: 'Admin - HR', completed: true, description: 'Formal warning issued; training scheduled' },
      { stage: 'Closed', timestamp: '2025-02-05 08:00', actor: 'Admin - HR', completed: true, description: 'Case closed; feedback mechanism deployed' },
    ],
    rating: 4,
    feedback: 'Glad action was taken quickly. The lab environment has improved noticeably.',
  },
  {
    id: 'CMP-2025-0118',
    title: 'Water Cooler on 2nd Floor Not Working',
    description: 'The water cooler near Room 201 on the 2nd floor has been dispensing warm water for a week. Students have to go to the ground floor for drinking water.',
    category: 'Infrastructure',
    priority: 'Low',
    status: 'Resolved',
    date: '2025-01-18',
    isAnonymous: false,
    chatHistory: [
      { id: 'm18', sender: 'complainant', senderName: 'Hassan Raza', message: 'Water cooler on 2nd floor is not cooling water.', timestamp: '2025-01-18 13:00' },
      { id: 'm19', sender: 'admin', senderName: 'Admin - Maintenance', message: 'Noted. We will send a technician tomorrow morning.', timestamp: '2025-01-18 17:00' },
      { id: 'm20', sender: 'admin', senderName: 'Admin - Maintenance', message: 'The cooling unit has been replaced. Please verify and confirm.', timestamp: '2025-01-20 11:30' },
      { id: 'm21', sender: 'complainant', senderName: 'Hassan Raza', message: 'Confirmed! Cold water is working now. Thank you!', timestamp: '2025-01-20 12:15' },
    ],
    timeline: [
      { stage: 'Submitted', timestamp: '2025-01-18 13:00', actor: 'Hassan Raza', completed: true, description: 'Reported water cooler issue' },
      { stage: 'Acknowledged', timestamp: '2025-01-18 17:00', actor: 'Admin - Maintenance', completed: true, description: 'Technician visit scheduled' },
      { stage: 'In Progress', timestamp: '2025-01-19 09:00', actor: 'Admin - Maintenance', completed: true, description: 'Technician inspecting unit' },
      { stage: 'Resolved', timestamp: '2025-01-20 11:30', actor: 'Admin - Maintenance', completed: true, description: 'Cooling unit replaced' },
      { stage: 'Closed', timestamp: '2025-01-20 12:15', actor: 'Hassan Raza', completed: true, description: 'Student confirmed resolution' },
    ],
    rating: 5,
    feedback: 'Very quick resolution. Impressed with the maintenance team!',
  },
];

// ── Style Maps ─────────────────────────────────────────────────────────
const statusStyle: Record<ComplaintStatus, string> = {
  Open: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  'In Progress': 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  Resolved: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  Escalated: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
  Closed: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

const priorityDot: Record<Priority, string> = {
  Low: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  High: 'bg-orange-500',
  Critical: 'bg-rose-500',
};

const priorityStyle: Record<Priority, string> = {
  Low: 'text-emerald-600 bg-emerald-500/10',
  Medium: 'text-amber-600 bg-amber-500/10',
  High: 'text-orange-600 bg-orange-500/10',
  Critical: 'text-rose-600 bg-rose-500/10',
};

const categoryIcon: Record<Category, string> = {
  Academic: '📚',
  Fee: '💰',
  Transport: '🚌',
  Faculty: '👨‍🏫',
  Infrastructure: '🏗️',
  Other: '📋',
};

const categories: Category[] = ['Academic', 'Fee', 'Transport', 'Faculty', 'Infrastructure', 'Other'];
const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

// ── Star Rating Component ──────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          whileHover={!readonly ? { scale: 1.2 } : {}}
          whileTap={!readonly ? { scale: 0.9 } : {}}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
          disabled={readonly}
          type="button"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/30'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export function ComplaintPortal({ user }: { user: any }) {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // New complaint form state
  const [newCategory, setNewCategory] = useState<Category>('Academic');
  const [newPriority, setNewPriority] = useState<Priority>('Medium');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // ── Computed Stats ─────────────────────────────────────────────────
  const total = complaints.length;
  const open = complaints.filter(c => c.status === 'Open').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const escalated = complaints.filter(c => c.status === 'Escalated').length;
  const avgResolutionTime = '3.2 days';
  const satisfactionScore = 4.3;

  // ── Filtered Complaints ───────────────────────────────────────────
  const filteredComplaints = filterStatus === 'All'
    ? complaints
    : complaints.filter(c => c.status === filterStatus);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleSubmitComplaint = () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    const newComplaint: Complaint = {
      id: `CMP-2025-${String(total + 143).padStart(4, '0')}`,
      title: newTitle,
      description: newDescription,
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      date: new Date().toISOString().split('T')[0],
      isAnonymous,
      chatHistory: [
        {
          id: `m-new-${Date.now()}`,
          sender: 'complainant',
          senderName: isAnonymous ? 'Anonymous' : user?.name || 'You',
          message: newDescription,
          timestamp: new Date().toLocaleString(),
        },
      ],
      timeline: [
        {
          stage: 'Submitted',
          timestamp: new Date().toLocaleString(),
          actor: isAnonymous ? 'Anonymous' : user?.name || 'You',
          completed: true,
          description: 'Complaint submitted via portal',
        },
        { stage: 'Acknowledged', timestamp: '', actor: '', completed: false, description: '' },
        { stage: 'In Progress', timestamp: '', actor: '', completed: false, description: '' },
        { stage: 'Resolved', timestamp: '', actor: '', completed: false, description: '' },
        { stage: 'Closed', timestamp: '', actor: '', completed: false, description: '' },
      ],
    };
    setComplaints(prev => [newComplaint, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setNewCategory('Academic');
    setNewPriority('Medium');
    setIsAnonymous(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSendMessage = (complaintId: string) => {
    if (!chatInput.trim()) return;
    setComplaints(prev =>
      prev.map(c =>
        c.id === complaintId
          ? {
              ...c,
              chatHistory: [
                ...c.chatHistory,
                {
                  id: `m-${Date.now()}`,
                  sender: 'complainant' as const,
                  senderName: c.isAnonymous ? 'Anonymous' : user?.name || 'You',
                  message: chatInput,
                  timestamp: new Date().toLocaleString(),
                },
              ],
            }
          : c
      )
    );
    setChatInput('');
  };

  const handleFeedbackSubmit = (complaintId: string) => {
    setComplaints(prev =>
      prev.map(c =>
        c.id === complaintId ? { ...c, rating: feedbackRating, feedback: feedbackText } : c
      )
    );
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 3000);
  };

  // ── Stat Cards ────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total Complaints', value: total, icon: MessageCircleWarning, color: 'from-rose-500 to-orange-600' },
    { label: 'Open', value: open, icon: AlertTriangle, color: 'from-rose-500 to-red-600' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'from-amber-500 to-yellow-600' },
    { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600' },
    { label: 'Escalated', value: escalated, icon: ArrowUpRight, color: 'from-orange-500 to-red-600' },
    { label: 'Avg Resolution', value: avgResolutionTime, icon: Clock, color: 'from-teal-500 to-cyan-600' },
    { label: 'Satisfaction', value: `${satisfactionScore}/5`, icon: Star, color: 'from-amber-400 to-orange-500' },
  ];

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Module Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-orange-600 p-6 text-white shadow-lg"
      >
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 grid place-items-center backdrop-blur-sm">
              <MessageCircleWarning className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Complaint Portal</h1>
          </div>
          <p className="text-sm text-white/80 max-w-xl">
            Track, submit, and resolve complaints with full transparency. Two-way communication between you and the administration.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3 mr-1" /> PGC Parity Feature
            </Badge>
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm">
              بولینگل — اردو/English
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* ── Tab Navigation ────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="submit" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Submit
          </TabsTrigger>
          <TabsTrigger value="my-complaints" className="gap-1.5">
            <MessageCircleWarning className="h-3.5 w-3.5" /> My Complaints
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Timeline
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <Star className="h-3.5 w-3.5" /> Feedback
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────────────────────
            TAB 1: OVERVIEW
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="p-4 relative overflow-hidden hover:shadow-md transition-shadow">
                    <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${card.color} opacity-10 blur-2xl`} />
                    <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.color} grid place-items-center mb-2.5`}>
                      <card.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-xl font-extrabold font-display">{card.value}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">{card.label}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Complaints Summary */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Recent Complaints</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('my-complaints')} className="text-xs gap-1">
                    View All <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {complaints.slice(0, 4).map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => { setSelectedComplaint(c); setActiveTab('timeline'); }}
                    >
                      <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${priorityDot[c.priority]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{c.title}</div>
                        <div className="text-[11px] text-muted-foreground">{c.id} · {c.date}</div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyle[c.status]}`}>{c.status}</Badge>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{c.category}</Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 grid place-items-center">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Needs Attention</div>
                    <div className="text-[11px] text-muted-foreground">{open + escalated} complaints require action</div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-to-r from-rose-500 to-orange-600 h-2 rounded-full transition-all" style={{ width: `${((open + escalated) / Math.max(total, 1)) * 100}%` }} />
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Resolution Rate</div>
                    <div className="text-[11px] text-muted-foreground">{resolved} of {total} complaints resolved</div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all" style={{ width: `${(resolved / Math.max(total, 1)) * 100}%` }} />
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            TAB 2: SUBMIT NEW COMPLAINT
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="submit">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rose-500/5 to-orange-600/5 border-b">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-rose-600" /> Submit New Complaint
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Provide details about your concern. All complaints are tracked and resolved transparently.</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Success Toast */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-emerald-800">Complaint Submitted Successfully!</div>
                        <div className="text-xs text-emerald-600">You will receive updates as your complaint is processed.</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {categories.map(cat => (
                      <motion.button
                        key={cat}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setNewCategory(cat)}
                        className={`p-3 rounded-xl border-2 text-center transition-all text-xs font-medium ${
                          newCategory === cat
                            ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                            : 'border-border hover:border-rose-300 bg-background'
                        }`}
                      >
                        <div className="text-lg mb-1">{categoryIcon[cat]}</div>
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {priorities.map(pri => (
                      <motion.button
                        key={pri}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setNewPriority(pri)}
                        className={`p-3 rounded-xl border-2 text-center transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                          newPriority === pri
                            ? `${priorityStyle[pri]} border-current shadow-sm`
                            : 'border-border hover:border-current/30 bg-background'
                        }`}
                      >
                        <div className={`h-2.5 w-2.5 rounded-full ${priorityDot[pri]}`} />
                        {pri}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complaint Title</label>
                  <Input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Brief summary of your complaint..."
                    className="text-sm"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Detailed Description</label>
                  <Textarea
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Describe your complaint in detail. Include relevant dates, locations, and people involved..."
                    className="min-h-32 text-sm resize-none"
                  />
                </div>

                {/* Attachment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-rose-300 transition-colors cursor-pointer">
                    <Paperclip className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">Click or drag files here to upload</div>
                    <div className="text-[11px] text-muted-foreground/60 mt-1">Supports images, PDFs, and documents (max 10MB)</div>
                  </div>
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Submit Anonymously</div>
                      <div className="text-[11px] text-muted-foreground">Your identity will be hidden from the administration</div>
                    </div>
                  </div>
                  <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                </div>

                {/* Submit Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    onClick={handleSubmitComplaint}
                    disabled={!newTitle.trim() || !newDescription.trim()}
                    className="w-full h-12 bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send className="h-4 w-4 mr-2" /> Submit Complaint
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            TAB 3: MY COMPLAINTS
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="my-complaints">
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {['All', 'Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'].map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={`text-xs h-8 ${filterStatus === status ? 'bg-gradient-to-r from-rose-500 to-orange-600 text-white border-0' : ''}`}
                >
                  {status}
                  {status !== 'All' && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">
                      {complaints.filter(c => c.status === status).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Complaint Cards */}
            <div className="space-y-3">
              {filteredComplaints.map((complaint, i) => (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* Card Header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedChat(expandedChat === complaint.id ? null : complaint.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-xl ${priorityStyle[complaint.priority]} grid place-items-center shrink-0`}>
                          <MessageCircleWarning className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">{complaint.title}</div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                <span className="font-mono">{complaint.id}</span>
                                <span>·</span>
                                <span>{complaint.date}</span>
                                {complaint.isAnonymous && (
                                  <>
                                    <span>·</span>
                                    <span className="text-rose-500 flex items-center gap-0.5">
                                      <ShieldCheck className="h-2.5 w-2.5" /> Anonymous
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={`text-[10px] ${statusStyle[complaint.status]}`}>
                                {complaint.status}
                              </Badge>
                              <motion.div
                                animate={{ rotate: expandedChat === complaint.id ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </motion.div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              {categoryIcon[complaint.category]} {complaint.category}
                            </Badge>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${priorityStyle[complaint.priority]}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[complaint.priority]}`} />
                              {complaint.priority}
                            </span>
                            {complaint.chatHistory.length > 0 && (
                              <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> {complaint.chatHistory.length} messages
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Chat Section */}
                    <AnimatePresence>
                      {expandedChat === complaint.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/50">
                            {/* Description */}
                            <div className="px-4 py-3 bg-muted/30">
                              <div className="text-xs text-muted-foreground mb-1 font-medium">Description</div>
                              <div className="text-sm leading-relaxed">{complaint.description}</div>
                            </div>

                            {/* Chat Interface */}
                            <div className="px-4 py-3">
                              <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3" /> Conversation
                              </div>
                              <ScrollArea className="h-72 pr-2">
                                <div className="space-y-3">
                                  {complaint.chatHistory.map((msg, mi) => (
                                    <motion.div
                                      key={msg.id}
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: mi * 0.05 }}
                                      className={`flex ${msg.sender === 'complainant' ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div className={`max-w-[85%] sm:max-w-[75%] ${
                                        msg.sender === 'complainant'
                                          ? 'bg-gradient-to-br from-rose-500 to-orange-600 text-white rounded-2xl rounded-br-md'
                                          : 'bg-muted rounded-2xl rounded-bl-md'
                                      }`}>
                                        <div className="px-3.5 py-2.5">
                                          <div className={`text-[10px] font-medium mb-1 ${
                                            msg.sender === 'complainant' ? 'text-white/70' : 'text-muted-foreground'
                                          }`}>
                                            {msg.senderName}
                                          </div>
                                          <div className="text-sm leading-relaxed">{msg.message}</div>
                                          <div className={`text-[10px] mt-1.5 ${
                                            msg.sender === 'complainant' ? 'text-white/50' : 'text-muted-foreground/60'
                                          }`}>
                                            {msg.timestamp}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </ScrollArea>

                              {/* Chat Input */}
                              {(complaint.status !== 'Closed') && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Input
                                    value={expandedChat === complaint.id ? chatInput : ''}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="text-sm h-10"
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(complaint.id);
                                      }
                                    }}
                                  />
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      size="icon"
                                      onClick={() => handleSendMessage(complaint.id)}
                                      disabled={!chatInput.trim()}
                                      className="h-10 w-10 bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white shrink-0"
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </div>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="px-4 py-3 border-t border-border/30 flex gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1.5"
                                onClick={() => { setSelectedComplaint(complaint); setActiveTab('timeline'); }}
                              >
                                <Clock className="h-3 w-3" /> View Timeline
                              </Button>
                              {(complaint.status === 'Resolved' || complaint.status === 'Closed') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs gap-1.5"
                                  onClick={() => { setSelectedComplaint(complaint); setActiveTab('feedback'); }}
                                >
                                  <Star className="h-3 w-3" /> Give Feedback
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}

              {filteredComplaints.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircleWarning className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <div className="text-sm text-muted-foreground">No complaints found for this filter.</div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            TAB 4: RESOLUTION TIMELINE
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="timeline">
          <div className="space-y-4">
            {/* Complaint Selector */}
            <Card className="p-4">
              <div className="text-sm font-medium mb-3">Select a complaint to view its timeline</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {complaints.map(c => (
                  <motion.button
                    key={c.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedComplaint(c)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedComplaint?.id === c.id
                        ? 'border-rose-500 bg-rose-50 shadow-sm'
                        : 'border-border hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${priorityDot[c.priority]}`} />
                      <div className="text-sm font-medium truncate flex-1">{c.title}</div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyle[c.status]}`}>{c.status}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{c.id}</div>
                  </motion.button>
                ))}
              </div>
            </Card>

            {/* Timeline View */}
            {selectedComplaint ? (
              <motion.div
                key={selectedComplaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-rose-500/5 to-orange-600/5 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold">{selectedComplaint.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-mono text-muted-foreground">{selectedComplaint.id}</span>
                          <Badge variant="secondary" className="text-[10px]">{selectedComplaint.category}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${statusStyle[selectedComplaint.status]}`}>
                            {selectedComplaint.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

                      <div className="space-y-6">
                        {selectedComplaint.timeline.map((stage, si) => {
                          const isLast = si === selectedComplaint.timeline.length - 1;
                          const isCurrent = stage.completed && (si === selectedComplaint.timeline.length - 1 || !selectedComplaint.timeline[si + 1]?.completed);

                          return (
                            <motion.div
                              key={stage.stage}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: si * 0.1 }}
                              className="relative flex gap-4"
                            >
                              {/* Node */}
                              <div className="relative z-10 flex-shrink-0">
                                <div className={`h-10 w-10 rounded-full grid place-items-center ${
                                  stage.completed
                                    ? isCurrent
                                      ? 'bg-gradient-to-br from-rose-500 to-orange-600 text-white shadow-lg shadow-rose-500/20'
                                      : 'bg-emerald-500 text-white'
                                    : 'bg-muted text-muted-foreground border-2 border-border'
                                }`}>
                                  {stage.completed ? (
                                    isCurrent ? (
                                      <Clock className="h-4 w-4" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4" />
                                    )
                                  ) : (
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                                  )}
                                </div>
                              </div>

                              {/* Content */}
                              <div className={`flex-1 pb-${isLast ? '0' : '6'}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`font-semibold text-sm ${stage.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {stage.stage}
                                  </div>
                                  {isCurrent && (
                                    <Badge className="bg-gradient-to-r from-rose-500 to-orange-600 text-white border-0 text-[10px]">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                {stage.completed && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    transition={{ delay: si * 0.1 + 0.1 }}
                                  >
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <span className="font-medium">{stage.actor}</span> · {stage.timestamp}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">{stage.description}</div>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current Status Summary */}
                    <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          selectedComplaint.status === 'Open' ? 'bg-rose-500 animate-pulse' :
                          selectedComplaint.status === 'In Progress' ? 'bg-amber-500 animate-pulse' :
                          selectedComplaint.status === 'Escalated' ? 'bg-orange-500 animate-pulse' :
                          selectedComplaint.status === 'Resolved' ? 'bg-emerald-500' :
                          'bg-slate-500'
                        }`} />
                        Current Status: {selectedComplaint.status}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedComplaint.timeline.filter(s => s.completed).length} of {selectedComplaint.timeline.length} stages completed
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <div className="text-sm text-muted-foreground">Select a complaint above to view its resolution timeline</div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            TAB 5: FEEDBACK
        ──────────────────────────────────────────────────────────────── */}
        <TabsContent value="feedback">
          <div className="space-y-4">
            {/* Feedback for Resolved Complaints */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-rose-500/5 to-orange-600/5 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" /> Rate & Review Resolved Complaints
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Your feedback helps improve our response quality.</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Existing Feedback */}
                <div className="space-y-4">
                  {complaints
                    .filter(c => c.rating)
                    .map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl border border-border/50 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold">{c.title}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{c.id} · Resolved</div>
                          </div>
                          <StarRating value={c.rating || 0} readonly />
                        </div>
                        {c.feedback && (
                          <div className="mt-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                            &ldquo;{c.feedback}&rdquo;
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>

                {/* Submit Feedback Form */}
                {complaints.filter(c => (c.status === 'Resolved' || c.status === 'Closed') && !c.rating).length > 0 && (
                  <div className="border-t border-border/50 pt-6">
                    <div className="text-sm font-bold mb-4">Submit Feedback for Pending Reviews</div>
                    <div className="space-y-4">
                      {/* Select complaint to review */}
                      {complaints
                        .filter(c => (c.status === 'Resolved' || c.status === 'Closed') && !c.rating)
                        .map(c => (
                          <div
                            key={c.id}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                              selectedComplaint?.id === c.id
                                ? 'border-rose-500 bg-rose-50'
                                : 'border-border hover:border-rose-300'
                            }`}
                            onClick={() => { setSelectedComplaint(c); setFeedbackRating(0); setFeedbackText(''); setFeedbackSubmitted(false); }}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <div className="text-sm font-medium">{c.title}</div>
                              <span className="text-[11px] text-muted-foreground font-mono ml-auto">{c.id}</span>
                            </div>
                          </div>
                        ))}

                      {/* Feedback Form */}
                      {selectedComplaint && (selectedComplaint.status === 'Resolved' || selectedComplaint.status === 'Closed') && !selectedComplaint.rating && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 bg-muted/30 rounded-xl p-5 border border-border/50"
                        >
                          <div className="text-sm font-medium">Rate your experience for: {selectedComplaint.title}</div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">Rating:</span>
                            <StarRating value={feedbackRating} onChange={setFeedbackRating} />
                            {feedbackRating > 0 && (
                              <span className="text-sm font-medium text-amber-600">{feedbackRating}/5</span>
                            )}
                          </div>

                          <Textarea
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            placeholder="Share your experience — what went well? What could be improved?"
                            className="min-h-24 text-sm resize-none"
                          />

                          <AnimatePresence>
                            {feedbackSubmitted && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="text-sm text-emerald-700">Thank you for your feedback!</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <Button
                            onClick={() => handleFeedbackSubmit(selectedComplaint.id)}
                            disabled={feedbackRating === 0}
                            className="bg-gradient-to-r from-rose-500 to-orange-600 hover:from-rose-600 hover:to-orange-700 text-white"
                          >
                            <Star className="h-4 w-4 mr-1.5" /> Submit Feedback
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {complaints.filter(c => (c.status === 'Resolved' || c.status === 'Closed') && !c.rating).length === 0 && (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/30 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">All resolved complaints have been reviewed!</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
