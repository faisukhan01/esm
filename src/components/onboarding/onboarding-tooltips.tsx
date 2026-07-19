'use client';

import { useSyncExternalStore, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Info, Lightbulb, X, ChevronRight, Target, BookOpen, Languages } from 'lucide-react';
import { useT } from '@/lib/i18n';

// Onboarding tips banner — shown at the top of the dashboard area for first-time users.
// Dismissed state is persisted to localStorage so the banner never re-appears.
// localStorage key is versioned (`_v1`) so future onboarding refreshes can reset it.
//
// Implementation note: we read dismissed-state via `useSyncExternalStore` rather than
// the (anti-pattern) "read localStorage in useEffect + setState" combo. This is the
// React-recommended way to subscribe a component to an external store, keeps SSR safe
// (server snapshot defaults to dismissed=true → no flash on first paint), and avoids
// the `react-hooks/set-state-in-effect` lint error.

const STORAGE_KEY = 'esm_onboarding_dismissed_v1';
const STORAGE_EVENT = 'esm:onboarding-change';

type TipDef = { id: string; icon: typeof Info; textEn: string; textUr: string };

const TIPS: TipDef[] = [
  {
    id: 'sidebar',
    icon: Lightbulb,
    textEn: 'Click any module in the sidebar to jump straight to that feature.',
    textUr: 'کسی بھی فیچر پر جانے کے لیے سائیڈبار میں موجود ماڈیول پر کلک کریں۔',
  },
  {
    id: 'cmdk',
    icon: Target,
    textEn: 'Use Cmd+K (or Ctrl+K) to open the command palette and search anything.',
    textUr: 'کمانڈ پیلیٹ کھولنے اور کچھ بھی تلاش کرنے کے لیے Cmd+K (یا Ctrl+K) استعمال کریں۔',
  },
  {
    id: 'help',
    icon: BookOpen,
    textEn: 'Hover over any field label to see help text.',
    textUr: 'ہیلپ ٹیکسٹ دیکھنے کے لیے کسی بھی فیلڈ لیبل پر ماؤس لے جائیں۔',
  },
  {
    id: 'language',
    icon: Languages,
    textEn: 'Tap the EN/UR button in the header to switch between English and Urdu.',
    textUr: 'انگریزی اور اردو کے درمیان تبدیل کرنے کے لیے ہیڈر میں EN/UR بٹن دبائیں۔',
  },
];

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // localStorage may throw in private mode / sandboxed iframes — default to dismissed.
    return true;
  }
}

function getServerSnapshot(): boolean {
  // Server render + first client render: assume dismissed to avoid SSR/CSR mismatch flash.
  return true;
}

export function OnboardingTips() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [index, setIndex] = useState(0);
  const tr = useT();

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
      window.dispatchEvent(new Event(STORAGE_EVENT));
    } catch {
      // ignore — best-effort persistence
    }
  };

  const nextTip = () => setIndex((i) => (i + 1) % TIPS.length);

  if (dismissed) return null;

  const tip = TIPS[index];
  const TipIcon = tip.icon;
  const tipText = tr.isUrdu ? tip.textUr : tip.textEn;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="mb-4"
      >
        <Card className="p-0 overflow-hidden border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/5">
          <div className="flex items-center gap-3 p-3 sm:p-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shrink-0 shadow-sm">
              <TipIcon className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {tr.isUrdu ? 'فوری مشورہ' : 'Quick Tip'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {index + 1} of {TIPS.length}
                </span>
              </div>
              <p className="text-sm text-foreground mt-0.5 leading-snug" dir={tr.isUrdu ? 'rtl' : 'ltr'}>
                {tipText}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={nextTip}
              >
                {tr.isUrdu ? 'اگلا مشورہ' : 'Next tip'}
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
              <Button
                size="sm"
                className="h-8 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={dismiss}
              >
                {tr.isUrdu ? 'سمجھ گیا' : 'Got it'}
              </Button>
              <button
                onClick={dismiss}
                aria-label={tr.isUrdu ? 'مشورہ مسترد کریں' : 'Dismiss tip'}
                className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:bg-amber-500/10 hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default OnboardingTips;
