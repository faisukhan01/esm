'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader } from './students';
import {
  Wallet, Plus, ArrowDownLeft, ArrowUpRight, TrendingDown, Coffee,
  Printer, BookOpen, Bus, Settings, Shield, Activity,
} from 'lucide-react';

type Txn = {
  id: string;
  merchant: string;
  category: 'cafeteria' | 'printing' | 'bookshop' | 'transport' | 'topup';
  amount: number; // negative = spend, positive = topup
  balanceAfter: number;
  date: string;
  time: string;
};

const TXNS: Txn[] = [
  { id: 't1', merchant: 'Cafeteria — Lunch Combo', category: 'cafeteria', amount: -240, balanceAfter: 2450, date: 'Today', time: '12:35 PM' },
  { id: 't2', merchant: 'Print Job — 14 pages', category: 'printing', amount: -70, balanceAfter: 2690, date: 'Today', time: '10:12 AM' },
  { id: 't3', merchant: 'Bookshop — Physics Notebook', category: 'bookshop', amount: -350, balanceAfter: 2760, date: 'Yesterday', time: '04:48 PM' },
  { id: 't4', merchant: 'Wallet Top-up (Parent)', category: 'topup', amount: 2000, balanceAfter: 3110, date: 'Yesterday', time: '09:15 AM' },
  { id: 't5', merchant: 'Transport — Monthly Pass', category: 'transport', amount: -660, balanceAfter: 1110, date: 'Oct 12', time: '08:00 AM' },
];

const CATEGORIES = [
  { id: 'cafeteria', label: 'Cafeteria', amount: 4280, pct: 48, color: 'bg-amber-500', icon: Coffee, tint: 'from-amber-500 to-yellow-600' },
  { id: 'bookshop', label: 'Bookshop', amount: 2100, pct: 24, color: 'bg-rose-500', icon: BookOpen, tint: 'from-rose-500 to-pink-600' },
  { id: 'printing', label: 'Printing', amount: 1450, pct: 16, color: 'bg-emerald-500', icon: Printer, tint: 'from-emerald-500 to-teal-600' },
  { id: 'transport', label: 'Transport', amount: 1080, pct: 12, color: 'bg-primary', icon: Bus, tint: 'from-primary to-primary/80' },
];

const fmtPKR = (n: number) =>
  'PKR ' + Math.abs(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CampusWalletModule() {
  const balance = 2450;
  const monthlySpend = 8910;
  const autoReloadThreshold = 500;

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Campus Wallet"
        subtitle="Cashless campus payments — cafeteria, printing, bookshop, transport — all from one prepaid wallet"
        actions={
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" /> Top Up
          </Button>
        }
      />

      {/* Wallet hero + spending donut */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Wallet hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-0 overflow-hidden">
            <div className="relative p-6 bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700 text-white overflow-hidden">
              <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
              <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-amber-900/30 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" /> Campus Wallet
                  </div>
                  <div className="mt-2 text-4xl font-extrabold tracking-tight tabular-nums">
                    {fmtPKR(balance)}
                  </div>
                  <div className="mt-1 text-xs text-white/80">Available balance · Updated 2 min ago</div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/15 grid place-items-center backdrop-blur">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="relative mt-5 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-white/10 p-2.5">
                  <div className="text-white/70 text-[10px] uppercase">Spent this month</div>
                  <div className="font-bold mt-0.5">{fmtPKR(monthlySpend)}</div>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5">
                  <div className="text-white/70 text-[10px] uppercase">Auto-reload at</div>
                  <div className="font-bold mt-0.5">{fmtPKR(autoReloadThreshold)}</div>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5">
                  <div className="text-white/70 text-[10px] uppercase">Card status</div>
                  <div className="font-bold mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" /> Active
                  </div>
                </div>
              </div>
              <div className="relative mt-5 flex gap-2">
                <Button size="sm" className="bg-white text-amber-700 hover:bg-amber-50 flex-1">
                  <Plus className="h-4 w-4 mr-1.5" /> Top Up
                </Button>
                <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 flex-1">
                  <Activity className="h-4 w-4 mr-1.5" /> Transaction History
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Spending categories */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm">Spending Breakdown</h3>
                <p className="text-xs text-muted-foreground">October 2025</p>
              </div>
              <Badge variant="outline" className="text-amber-700 border-amber-500/30 bg-amber-500/10">
                <TrendingDown className="h-3 w-3 mr-1" /> -8% vs Sep
              </Badge>
            </div>
            {/* Donut (CSS-only) */}
            <div className="flex items-center gap-5">
              <div className="relative h-32 w-32 shrink-0">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: 'conic-gradient(#f59e0b 0% 48%, #f43f5e 48% 72%, #10b981 72% 88%, #1a365d 88% 100%)',
                  }}
                />
                <div className="absolute inset-3 rounded-full bg-card grid place-items-center text-center">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
                    <div className="text-base font-bold tabular-nums">PKR 8,910</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <span className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate">{c.label}</span>
                      <span className="font-medium tabular-nums">{fmtPKR(c.amount)}</span>
                      <span className="text-muted-foreground tabular-nums w-9 text-right">{c.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent transactions */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Recent Transactions</h3>
          <Button size="sm" variant="ghost" className="text-xs">View all</Button>
        </div>
        <div className="space-y-1.5">
          {TXNS.map((t) => {
            const isTopup = t.amount > 0;
            const cat = CATEGORIES.find((c) => c.id === t.category);
            const Icon = cat?.icon ?? Coffee;
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition"
              >
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 bg-gradient-to-br ${cat?.tint ?? 'from-amber-500 to-yellow-600'}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{t.merchant}</div>
                  <div className="text-[11px] text-muted-foreground">{t.date} · {t.time}</div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm tabular-nums ${isTopup ? 'text-emerald-600' : 'text-foreground'}`}>
                    {isTopup ? '+' : ''}{fmtPKR(t.amount)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Bal {fmtPKR(t.balanceAfter)}</div>
                </div>
                <div className="shrink-0">
                  {isTopup ? (
                    <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Parent controls */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 grid place-items-center">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-sm">Parent Controls</div>
            <div className="text-xs text-muted-foreground">
              Set spending limits, auto-reload threshold, and merchant restrictions.
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline"><Settings className="h-4 w-4 mr-1.5" /> Manage</Button>
      </Card>
    </div>
  );
}
