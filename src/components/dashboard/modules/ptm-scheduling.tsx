'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModuleHeader } from './students';
import {
  Video, Calendar, Plus, Clock, Users, Bell, Play, ChevronRight, CheckCircle2,
} from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'];

type SlotState = 'open' | 'booked' | 'pending';

type SlotInfo = {
  state: SlotState;
  teacher?: string;
  parent?: string;
  subject?: string;
};

// Build a deterministic slot matrix
const SLOT_MATRIX: Record<string, SlotInfo> = {
  'Mon-09:00': { state: 'booked', teacher: 'Ms. Saima', parent: 'Mr. Khan', subject: 'Mathematics' },
  'Mon-11:00': { state: 'pending', teacher: 'Mr. Ali', parent: 'Mrs. Iqbal', subject: 'Physics' },
  'Tue-10:00': { state: 'booked', teacher: 'Ms. Sana', parent: 'Mrs. Tariq', subject: 'English' },
  'Wed-14:00': { state: 'booked', teacher: 'Mr. Imran', parent: 'Mr. Yousaf', subject: 'Chemistry' },
  'Thu-15:00': { state: 'pending', teacher: 'Ms. Saima', parent: 'Mrs. Bilal', subject: 'Mathematics' },
  'Fri-09:00': { state: 'booked', teacher: 'Mr. Naveed', parent: 'Mr. Ahmed', subject: 'Biology' },
  'Sat-12:00': { state: 'booked', teacher: 'Ms. Sana', parent: 'Mr. Raza', subject: 'English' },
};

const UPCOMING = [
  { id: 'u1', teacher: 'Ms. Saima Khan', subject: 'Mathematics', date: 'Mon, Oct 21', time: '09:00 AM', countdown: 'in 2 days', status: 'confirmed' as const },
  { id: 'u2', teacher: 'Mr. Ali Raza', subject: 'Physics', date: 'Mon, Oct 21', time: '11:00 AM', countdown: 'in 2 days', status: 'pending' as const },
  { id: 'u3', teacher: 'Ms. Sana Tariq', subject: 'English', date: 'Tue, Oct 22', time: '10:00 AM', countdown: 'in 3 days', status: 'confirmed' as const },
];

export default function PtmSchedulingModule() {
  const [selected, setSelected] = useState<string | null>(null);

  const bookedCount = Object.values(SLOT_MATRIX).filter((s) => s.state === 'booked').length;
  const pendingCount = Object.values(SLOT_MATRIX).filter((s) => s.state === 'pending').length;
  const openCount = DAYS.length * SLOTS.length - bookedCount - pendingCount;

  const stats = [
    { label: 'Open Slots', value: openCount, tint: 'text-emerald-700 bg-emerald-500/10' },
    { label: 'Booked', value: bookedCount, tint: 'text-primary bg-primary/10' },
    { label: 'Pending', value: pendingCount, tint: 'text-amber-700 bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="PTM Scheduling"
        subtitle="Book parent-teacher meetings with video calls, calendar invites, and automatic reminders"
        actions={
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" /> Book PTM
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-extrabold tabular-nums">{s.value}</div>
            </div>
            <Badge variant="outline" className={s.tint}>{s.label}</Badge>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Weekly calendar */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" /> Week of Oct 21 – 26, 2025
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tap any open slot to book</p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Button size="sm" variant="ghost" className="h-8">‹ Prev</Button>
              <Button size="sm" variant="ghost" className="h-8">Next ›</Button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px] grid grid-cols-[80px_repeat(6,1fr)] gap-1.5">
              {/* Header row */}
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-1">Time</div>
              {DAYS.map((d) => (
                <div key={d} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-1 text-center">
                  {d}
                </div>
              ))}

              {/* Slot rows */}
              {SLOTS.map((slot) => (
                <SlotRow key={slot} slot={slot} selected={selected} onSelect={setSelected} />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-100 border border-emerald-500/30" /> Open</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-primary/15 border border-primary/40" /> Booked</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-100 border border-amber-500/40" /> Pending</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-teal-500" /> Selected</span>
          </div>
        </Card>

        {/* Upcoming PTMs sidebar */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Upcoming PTMs
            </h3>
            <Badge variant="outline" className="text-xs">{UPCOMING.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {UPCOMING.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border p-3 hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-600 text-white text-xs">
                      {u.teacher.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{u.teacher}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{u.subject}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      u.status === 'confirmed'
                        ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-amber-700 bg-amber-500/10 border-amber-500/20'
                    }
                  >
                    {u.status === 'confirmed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                    {u.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {u.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {u.time}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{u.countdown}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8">
                    <Video className="h-3.5 w-3.5 mr-1.5" /> Join
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 h-8 text-xs">
                    Agenda <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Play className="h-3.5 w-3.5 mr-1.5" /> Recordings
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Users className="h-3.5 w-3.5 mr-1.5" /> Multi-teacher
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SlotRow({
  slot,
  selected,
  onSelect,
}: {
  slot: string;
  selected: string | null;
  onSelect: (k: string | null) => void;
}) {
  return (
    <>
      <div className="text-xs text-muted-foreground font-medium flex items-center pr-2 justify-end tabular-nums">
        {slot}
      </div>
      {DAYS.map((d) => {
        const key = `${d}-${slot}`;
        const info = SLOT_MATRIX[key];
        const state = info?.state ?? 'open';
        const isSelected = selected === key;
        const base =
          'min-h-[58px] rounded-lg border p-2 text-[11px] transition cursor-pointer flex flex-col justify-between';
        const cls =
          isSelected
            ? 'bg-teal-500 border-teal-600 text-white'
            : state === 'booked'
            ? 'bg-primary/10 border-primary/30 hover:bg-primary/15'
            : state === 'pending'
            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500/30 hover:bg-amber-100'
            : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-100 dark:hover:bg-emerald-500/15';

        return (
          <button
            key={key}
            onClick={() => onSelect(isSelected ? null : key)}
            className={`${base} ${cls}`}
            title={info ? `${info.teacher} · ${info.subject}` : 'Open slot'}
          >
            {state === 'open' ? (
              <div className="text-muted-foreground/70 text-[10px]">+</div>
            ) : (
              <>
                <div className="font-medium leading-tight truncate">
                  {info?.teacher}
                </div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {info?.subject}
                </div>
                {state === 'booked' && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Video className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-primary'}`} />
                  </div>
                )}
              </>
            )}
          </button>
        );
      })}
    </>
  );
}
