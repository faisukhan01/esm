'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ModuleHeader } from './students';
import {
  HeartPulse, Droplet, Ruler, Weight, Activity, ShieldAlert,
  Syringe, Stethoscope, Phone, Plus, TrendingUp, Calendar,
} from 'lucide-react';

type Student = {
  id: string;
  name: string;
  className: string;
  rollNo: string;
};

const STUDENTS: Student[] = [
  { id: 's1', name: 'Ayesha Khan', className: 'Grade 8 · A', rollNo: 'AGR-8-A-12' },
  { id: 's2', name: 'Hamza Tariq', className: 'Grade 9 · B', rollNo: 'AGR-9-B-07' },
  { id: 's3', name: 'Zainab Ali', className: 'Grade 10 · A', rollNo: 'AGR-10-A-21' },
  { id: 's4', name: 'Bilal Raza', className: 'Grade 7 · C', rollNo: 'AGR-7-C-04' },
];

const ALLERGIES: Record<string, { label: string; severity: 'high' | 'medium' | 'low' }[]> = {
  s1: [
    { label: 'Peanuts', severity: 'high' },
    { label: 'Pollen', severity: 'medium' },
  ],
  s2: [{ label: 'Dust', severity: 'low' }],
  s3: [{ label: 'Penicillin', severity: 'high' }],
  s4: [],
};

const VACCINATIONS: Record<string, { name: string; date: string; next?: string }[]> = {
  s1: [
    { name: 'BCG', date: '2014-03-12' },
    { name: 'OPV (3 doses)', date: '2015-02-08' },
    { name: 'MMR', date: '2017-09-20', next: '2027 booster' },
    { name: 'COVID-19 (2 doses)', date: '2022-06-15' },
  ],
  s2: [
    { name: 'BCG', date: '2013-05-22' },
    { name: 'OPV (3 doses)', date: '2014-04-10' },
    { name: 'MMR', date: '2016-11-15', next: '2026 booster' },
  ],
  s3: [
    { name: 'BCG', date: '2012-08-08' },
    { name: 'MMR', date: '2016-01-18' },
    { name: 'Typhoid', date: '2020-03-05' },
  ],
  s4: [
    { name: 'BCG', date: '2015-11-12' },
    { name: 'OPV (3 doses)', date: '2016-10-04' },
  ],
};

const INFIRMARY: Record<string, { date: string; reason: string; treatment: string; staff: string }[]> = {
  s1: [
    { date: 'Oct 12, 2025', reason: 'Headache', treatment: 'Paracetamol + rest 30 min', staff: 'Nurse Saima' },
    { date: 'Sep 28, 2025', reason: 'Minor scrape (playground)', treatment: 'Antiseptic + bandage', staff: 'Nurse Saima' },
  ],
  s2: [
    { date: 'Oct 03, 2025', reason: 'Stomachache', treatment: 'Antacid + observation', staff: 'Nurse Rabia' },
  ],
  s3: [],
  s4: [
    { date: 'Sep 19, 2025', reason: 'Fever (38.4°C)', treatment: 'Sent home · Parent notified', staff: 'Nurse Saima' },
  ],
};

const PHYSICAL: Record<string, { bloodGroup: string; heightCm: number; weightKg: number }> = {
  s1: { bloodGroup: 'B+', heightCm: 158, weightKg: 48 },
  s2: { bloodGroup: 'O+', heightCm: 167, weightKg: 58 },
  s3: { bloodGroup: 'A+', heightCm: 162, weightKg: 52 },
  s4: { bloodGroup: 'AB+', heightCm: 142, weightKg: 36 },
};

function bmi(h: number, w: number) {
  const m = h / 100;
  return +(w / (m * m)).toFixed(1);
}
function bmiCategory(v: number) {
  if (v < 18.5) return { label: 'Underweight', cls: 'text-amber-700 bg-amber-500/10' };
  if (v < 25) return { label: 'Normal', cls: 'text-emerald-700 bg-emerald-500/10' };
  if (v < 30) return { label: 'Overweight', cls: 'text-amber-700 bg-amber-500/10' };
  return { label: 'Obese', cls: 'text-rose-700 bg-rose-500/10' };
}

const sevMeta = {
  high: { cls: 'text-rose-700 bg-rose-500/15 border-rose-500/30', label: 'High' },
  medium: { cls: 'text-amber-700 bg-amber-500/15 border-amber-500/30', label: 'Medium' },
  low: { cls: 'text-emerald-700 bg-emerald-500/15 border-emerald-500/30', label: 'Low' },
};

export default function HealthRecordsModule() {
  const [studentId, setStudentId] = useState<string>('s1');
  const student = STUDENTS.find((s) => s.id === studentId) ?? STUDENTS[0];
  const phys = PHYSICAL[studentId];
  const allergies = ALLERGIES[studentId] ?? [];
  const vaccinations = VACCINATIONS[studentId] ?? [];
  const infirmary = INFIRMARY[studentId] ?? [];
  const bmiVal = bmi(phys.heightCm, phys.weightKg);
  const bmiCat = bmiCategory(bmiVal);

  const stats = [
    { label: 'Blood Group', value: phys.bloodGroup, icon: Droplet, tint: 'from-rose-500 to-pink-600' },
    { label: 'Height', value: `${phys.heightCm} cm`, icon: Ruler, tint: 'from-primary to-primary/80' },
    { label: 'Weight', value: `${phys.weightKg} kg`, icon: Weight, tint: 'from-amber-500 to-yellow-600' },
    { label: 'BMI', value: `${bmiVal}`, icon: Activity, tint: 'from-emerald-500 to-teal-600', sub: bmiCat.label },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Health Records"
        subtitle="Student health & wellness — medical history, allergy alerts, vaccinations, and infirmary visits"
        actions={
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" /> Log Visit
          </Button>
        }
      />

      {/* Student selector */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white">
                {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{student.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {student.className} · Roll {student.rollNo}
              </div>
            </div>
          </div>
          <div className="w-full sm:w-72">
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {STUDENTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 relative overflow-hidden">
                <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${c.tint} opacity-10 blur-2xl`} />
                <div className="flex items-center justify-between">
                  <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${c.tint} grid place-items-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  {'sub' in c && c.sub ? (
                    <Badge variant="outline" className={bmiCat.cls}>{c.sub}</Badge>
                  ) : null}
                </div>
                <div className="mt-3 text-2xl font-extrabold tabular-nums">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Allergies + Emergency contact */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" /> Allergy Alerts
            </h3>
            <Button size="sm" variant="ghost" className="text-xs">Edit</Button>
          </div>
          {allergies.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
              No known allergies on file.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allergies.map((a) => {
                const sev = sevMeta[a.severity];
                return (
                  <Badge key={a.label} variant="outline" className={`px-3 py-1.5 text-xs ${sev.cls}`}>
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    {a.label}
                    <span className="ml-1.5 opacity-70">· {sev.label}</span>
                  </Badge>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Emergency Contact
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 grid place-items-center">
                <Phone className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Mrs. Khan (Mother)</div>
                <div className="text-xs text-muted-foreground">+92 300 1234567</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Vaccinations */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Syringe className="h-4 w-4 text-primary" /> Vaccination Record
            </h3>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-500/10 border-emerald-500/20">
              {vaccinations.length} on file
            </Badge>
          </div>
          <div className="space-y-2">
            {vaccinations.map((v) => (
              <div key={v.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition">
                <div className="h-7 w-7 rounded-md bg-primary/10 grid place-items-center shrink-0 mt-0.5">
                  <Syringe className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{v.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Administered {v.date}
                  </div>
                  {v.next && (
                    <div className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Next: {v.next}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Infirmary visits timeline */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-rose-600" /> Infirmary Visits
          </h3>
          <Button size="sm" variant="outline" className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Log Visit
          </Button>
        </div>
        {infirmary.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center bg-muted/30 rounded-lg flex flex-col items-center gap-2">
            <HeartPulse className="h-8 w-8 text-muted-foreground/50" />
            <div>No infirmary visits on record — this student is healthy!</div>
          </div>
        ) : (
          <ol className="relative border-l-2 border-border/60 ml-3 space-y-5 pl-6">
            {infirmary.map((v, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-rose-500 ring-4 ring-card" />
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{v.reason}</span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">{v.date}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Treatment:</span> {v.treatment}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Attended by {v.staff}
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
