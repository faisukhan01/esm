'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModuleHeader } from './students';
import {
  IdCard, QrCode, Download, Printer, Ban, Plus, ShieldCheck,
  GraduationCap, Calendar, Phone,
} from 'lucide-react';

type StudentIdCard = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  institute: string;
  validThru: string;
  status: 'active' | 'locked';
  bloodGroup: string;
  contact: string;
};

const SAMPLE_CARDS: StudentIdCard[] = [
  {
    id: 'ESM-2025-0421', name: 'Ayesha Khan', rollNo: 'AGR-8-A-12', className: 'Grade 8', section: 'A',
    institute: 'Punjab College for Girls', validThru: 'Mar 2026', status: 'active',
    bloodGroup: 'B+', contact: '+92 300 1234567',
  },
  {
    id: 'ESM-2025-0422', name: 'Hamza Tariq', rollNo: 'AGR-9-B-07', className: 'Grade 9', section: 'B',
    institute: 'Punjab College for Boys', validThru: 'Mar 2026', status: 'active',
    bloodGroup: 'O+', contact: '+92 301 7654321',
  },
  {
    id: 'ESM-2025-0423', name: 'Zainab Ali', rollNo: 'AGR-10-A-21', className: 'Grade 10', section: 'A',
    institute: 'Punjab College for Girls', validThru: 'Mar 2026', status: 'locked',
    bloodGroup: 'A+', contact: '+92 302 9876543',
  },
];

const stats = [
  { label: 'Total Issued', value: 1284, icon: IdCard, tint: 'from-rose-500 to-pink-600' },
  { label: 'Active', value: 1267, icon: ShieldCheck, tint: 'from-emerald-500 to-emerald-700' },
  { label: 'Locked (Lost)', value: 17, icon: Ban, tint: 'from-amber-500 to-orange-600' },
  { label: 'Renewed This Term', value: 312, icon: GraduationCap, tint: 'from-primary to-primary/80' },
];

export default function DigitalIdModule() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Digital ID Center"
        subtitle="Wallet-style digital student IDs with QR check-in — for library, cafeteria, exam hall & campus entry"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" /> Export</Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Bulk Generate
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 relative overflow-hidden">
                <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.tint} opacity-10 blur-2xl`} />
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${c.tint} grid place-items-center mb-3`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-extrabold tabular-nums">
                  {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
                </div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ID card grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Student ID Cards</h2>
          <span className="text-xs text-muted-foreground">{SAMPLE_CARDS.length} previewing · 1,284 total</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_CARDS.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="p-0 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition">
                {/* Card face — navy gradient */}
                <div className="relative p-5 bg-gradient-to-br from-primary via-primary to-primary/85 text-white overflow-hidden">
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl" />
                  <div className="absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-rose-500/20 blur-3xl" />

                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-white/15 grid place-items-center">
                        <GraduationCap className="h-4 w-4 text-amber-300" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold tracking-wide">ESM</div>
                        <div className="text-[9px] text-white/70 uppercase tracking-wider">Student ID</div>
                      </div>
                    </div>
                    <Badge
                      className={`shrink-0 text-[10px] ${
                        c.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                      }`}
                      variant="outline"
                    >
                      {c.status === 'active' ? 'ACTIVE' : 'LOCKED'}
                    </Badge>
                  </div>

                  <div className="relative mt-4 flex items-center gap-3">
                    <Avatar className="h-14 w-14 border-2 border-white/30">
                      <AvatarFallback className="bg-white/15 text-white text-base font-bold">
                        {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-bold text-base leading-tight truncate">{c.name}</div>
                      <div className="text-[11px] text-white/75 mt-0.5">Roll {c.rollNo}</div>
                      <div className="text-[11px] text-white/75">{c.className} · Sec {c.section}</div>
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-[9px] text-white/60 uppercase tracking-wider">Institute</div>
                      <div className="text-[11px] font-medium leading-tight max-w-[160px]">{c.institute}</div>
                      <div className="text-[9px] text-white/60 uppercase tracking-wider mt-2">Valid Thru</div>
                      <div className="text-[11px] font-medium">{c.validThru}</div>
                    </div>
                    <div className="h-16 w-16 rounded-lg bg-white grid place-items-center shadow-md shrink-0">
                      <QrCode className="h-12 w-12 text-primary" />
                    </div>
                  </div>

                  <div className="relative mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
                    <span className="font-mono">{c.id}</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-300" /> Verified
                    </span>
                  </div>
                </div>

                {/* Card footer — actions */}
                <div className="p-3 flex items-center justify-between gap-2 bg-card">
                  <div className="text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.contact}</div>
                    <div className="flex items-center gap-1 mt-0.5"><Calendar className="h-3 w-3" /> Blood {c.bloodGroup}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-8 px-2"><Printer className="h-3.5 w-3.5" /></Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 px-2 ${c.status === 'locked' ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 grid place-items-center">
            <IdCard className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <div className="font-semibold text-sm">Bulk Operations</div>
            <div className="text-xs text-muted-foreground">Generate IDs by class, expire old batches, or revoke lost cards.</div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1.5" /> Generate by Class</Button>
          <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" /> Print All</Button>
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
            <Ban className="h-4 w-4 mr-1.5" /> Revoke Selected
          </Button>
        </div>
      </Card>
    </div>
  );
}
