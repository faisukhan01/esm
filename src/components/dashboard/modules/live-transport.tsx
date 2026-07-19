'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ModuleHeader } from './students';
import {
  Bus, Navigation, MapPin, Phone, Gauge, Users, Clock,
  TrendingUp, AlertTriangle, CheckCircle2, Route as RouteIcon,
} from 'lucide-react';

type RouteStatus = 'on-time' | 'delayed' | 'arrived' | 'en-route';

type ActiveRoute = {
  id: string;
  routeName: string;
  driverName: string;
  vehicleNo: string;
  eta: string;
  speed: number; // km/h
  occupancy: number; // out of capacity
  capacity: number;
  status: RouteStatus;
  // position on the stylized map (% coords)
  pos: { x: number; y: number };
};

const ROUTES: ActiveRoute[] = [
  {
    id: 'R-A', routeName: 'Route A — Gulberg', driverName: 'Imran Yousaf',
    vehicleNo: 'LHR-1234', eta: '4 min', speed: 38, occupancy: 28, capacity: 36,
    status: 'en-route', pos: { x: 22, y: 30 },
  },
  {
    id: 'R-B', routeName: 'Route B — Model Town', driverName: 'Bashir Khan',
    vehicleNo: 'LHR-5678', eta: '12 min', speed: 24, occupancy: 22, capacity: 32,
    status: 'delayed', pos: { x: 58, y: 60 },
  },
  {
    id: 'R-C', routeName: 'Route C — DHA Phase 5', driverName: 'Naveed Ahmed',
    vehicleNo: 'LHR-9012', eta: 'Arrived', speed: 0, occupancy: 30, capacity: 30,
    status: 'arrived', pos: { x: 80, y: 24 },
  },
];

const statusMeta: Record<RouteStatus, { label: string; cls: string; dot: string }> = {
  'on-time': { label: 'On Time', cls: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' },
  'en-route': { label: 'En Route', cls: 'text-teal-700 bg-teal-500/10 border-teal-500/20', dot: 'bg-teal-500' },
  'delayed': { label: 'Delayed', cls: 'text-amber-700 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' },
  'arrived': { label: 'Arrived', cls: 'text-primary bg-primary/10 border-primary/20', dot: 'bg-primary' },
};

export default function LiveTransportModule() {
  const [selectedId, setSelectedId] = useState<string>('R-A');
  const selected = ROUTES.find((r) => r.id === selectedId) ?? ROUTES[0];

  const stats = [
    { label: 'Active Routes', value: ROUTES.length, icon: RouteIcon, tint: 'from-emerald-500 to-teal-600' },
    { label: 'Students Onboard', value: ROUTES.reduce((a, r) => a + r.occupancy, 0), icon: Users, tint: 'from-amber-500 to-yellow-600' },
    { label: 'On-Time Today', value: '94%', icon: TrendingUp, tint: 'from-emerald-500 to-emerald-700' },
    { label: 'Alerts', value: 1, icon: AlertTriangle, tint: 'from-rose-500 to-pink-600' },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Live Transport Tracking"
        subtitle="Real-time GPS tracking of campus buses — see where your child is, right now"
        actions={
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Navigation className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
        }
      />

      {/* Stat cards */}
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
                <div className="text-2xl font-extrabold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Map placeholder */}
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-sm">Live Map · Lahore Campus</span>
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-500/30 bg-emerald-500/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" /> Live
            </Badge>
          </div>
          <div className="relative h-[420px] bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-40 dark:opacity-25"
              style={{
                backgroundImage:
                  'linear-gradient(to right, oklch(0.5 0.15 160 / 0.15) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.5 0.15 160 / 0.15) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            {/* Stylized route lines */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <polyline
                points="5,80 22,30 45,50 70,40 90,18"
                fill="none"
                stroke="oklch(0.6 0.15 160)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.55"
              />
              <polyline
                points="10,90 30,75 58,60 75,80 92,55"
                fill="none"
                stroke="oklch(0.7 0.18 30)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.55"
              />
              <polyline
                points="15,15 35,30 60,22 80,24"
                fill="none"
                stroke="oklch(0.55 0.20 257)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.55"
              />
            </svg>
            {/* Campus pin */}
            <div className="absolute top-[18%] right-[8%] -translate-y-1/2">
              <div className="h-10 w-10 rounded-full bg-primary grid place-items-center shadow-lg ring-4 ring-primary/20">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="mt-1 text-[10px] font-semibold text-primary whitespace-nowrap">Campus</div>
            </div>
            {/* Bus markers */}
            {ROUTES.map((r) => {
              const meta = statusMeta[r.status];
              const isSelected = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{ left: `${r.pos.x}%`, top: `${r.pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                  title={`${r.routeName} · ${meta.label}`}
                >
                  <div
                    className={`h-9 w-9 rounded-full grid place-items-center shadow-lg ring-4 transition ${
                      isSelected
                        ? 'bg-primary ring-primary/30 scale-110'
                        : `bg-gradient-to-br from-emerald-500 to-teal-600 ring-emerald-500/20`
                    }`}
                  >
                    <Bus className="h-4 w-4 text-white" />
                  </div>
                  <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ring-2 ring-white ${meta.dot}`} />
                  <div className="mt-1 text-[10px] font-semibold bg-card/90 backdrop-blur px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                    {r.id}
                  </div>
                </button>
              );
            })}
            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur border border-border rounded-lg p-2.5 text-[10px] space-y-1 shadow-sm">
              <div className="font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Legend</div>
              {(['en-route', 'on-time', 'delayed', 'arrived'] as RouteStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusMeta[s].dot}`} />
                  <span>{statusMeta[s].label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Active routes list */}
        <Card className="p-3">
          <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active Routes
          </div>
          <div className="space-y-2.5">
            {ROUTES.map((r) => {
              const meta = statusMeta[r.status];
              const occPct = Math.round((r.occupancy / r.capacity) * 100);
              const isSelected = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    isSelected
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                        {r.driverName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm truncate">{r.routeName}</span>
                        <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {r.driverName} · {r.vehicleNo}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Gauge className="h-3 w-3" /> Speed</div>
                      <div className="font-semibold mt-0.5">{r.speed} km/h</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Clock className="h-3 w-3" /> ETA</div>
                      <div className="font-semibold mt-0.5">{r.eta}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="flex items-center gap-1 text-muted-foreground text-[10px]"><Users className="h-3 w-3" /> Seats</div>
                      <div className="font-semibold mt-0.5">{r.occupancy}/{r.capacity}</div>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Occupancy</span>
                      <span>{occPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          occPct >= 90 ? 'bg-rose-500' : occPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8">
                      <Phone className="h-3.5 w-3.5 mr-1.5" /> Call Driver
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8">
                      {r.status === 'arrived' ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : <Navigation className="h-3.5 w-3.5 mr-1.5" />}
                      {r.status === 'arrived' ? 'Drop Done' : 'Track'}
                    </Button>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
