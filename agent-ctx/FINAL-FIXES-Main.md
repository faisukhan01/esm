# Task ID: FINAL-FIXES
## Agent: Main (Z.ai Code)

### Scope
Four cleanup + verification tasks on the ESM portal system:
1. Teacher Portal — verify "Dashboard" sidebar item exists before "My Classes" and renders a clean dashboard (4 KPIs, navy banner, no announcements).
2. Student Challan — verify direct PDF download via html2pdf.js; uppercase the title to "FEE CHALLAN".
3. Institute Admin — verify branch management page replaces modal; ensure `InstituteBranchWrapper` removed from role-portal.tsx and branch modules removed from sidebar.
4. Card Redesign — strip `bg-gradient-to-br` and `blur-2xl` decorations from cards across all 6 portals (keep welcome-banner gradients intact).

### Files Modified
- `src/components/portal/student-portal.tsx`
  - Changed the printable challan HTML title from "Fee Challan" → **"FEE CHALLAN"** (uppercase, matches task spec).
  - Cleaned KPI card decorations in `StudentOverview` and `MyInvoices`: removed `blur-2xl` decorative divs and replaced `bg-gradient-to-br ${c.color}` icon boxes with solid `bg-primary/10 text-primary`.
  - Cleaned `My Courses` cards: removed `blur-2xl` and replaced gradient icon box with `bg-primary/10 text-primary`.
- `src/components/portal/teacher-portal.tsx`
  - Cleaned KPI cards in `TeacherDashboard` and `TeacherOverview`: removed `blur-2xl` divs and gradient icon boxes → `bg-primary/10 text-primary`.
  - Cleaned Quick Link cards in `TeacherDashboard`: same treatment.
  - Cleaned class cards in `TeacherOverview`: same treatment, kept hover lift transition.
  - (Task 1 was already implemented by a prior agent — `teacher-dashboard` sidebar item exists in role-modules.ts line 73, `TeacherDashboard` component at line 616 renders the requested 4 KPIs and navy welcome banner with NO announcements section.)
- `src/components/portal/institute-admin-portal.tsx`
  - Cleaned top bar `Card` in `BranchManagementView`: removed `blur-2xl` decoration and `bg-gradient-to-br` icon → solid `bg-primary/10 text-primary`.
  - Cleaned KPI cards in `InstituteOverview`: same treatment.
  - Cleaned `BranchCard` (the cards displayed when no branch is selected): removed `blur-2xl` decoration and gradient icon box → solid `bg-primary/10 text-primary`. The card's onClick still opens the full `BranchManagementView` (no modal).
  - (Task 3 was already implemented by a prior agent — `selectedBranch` state exists, `BranchManagementView` replaces the popup, `InstituteBranchWrapper` is NOT imported in role-portal.tsx, branch modules are NOT in the institute-admin sidebar.)
- `src/components/portal/super-admin-portal.tsx`
  - Cleaned KPI cards in `SuperAdminOverview`: removed `blur-2xl` decoration and gradient icon box → solid `bg-primary/10 text-primary`.
  - Cleaned `InstituteCard` (clickable card on platform overview): removed `blur-2xl` and replaced gradient icon box with solid `bg-primary/10 text-primary` (initials still rendered).
  - Cleaned `PlatformConfig` setting cards: removed `blur-2xl` and gradient icon box → solid `bg-primary/10 text-primary`.
  - (Modal banner header in `InstituteDetailsModal` left untouched — it's a banner-like element inside the modal Card, not a card itself; its navy `from-primary to-primary/80` icon gradient is consistent with the welcome-banner palette.)
- `src/components/portal/branch-manager-portal.tsx`
  - Cleaned KPI cards in `BranchOverview`: removed `blur-2xl` decoration and gradient icon box → solid `bg-primary/10 text-primary`.
  - Cleaned class picker buttons in `ClassCoursesView`: removed `blur-2xl` decoration (group-hover) and replaced `bg-gradient-to-br from-primary/80 to-primary` icon box → solid `bg-primary/10 text-primary`.
  - Cleaned monthly-fee-structure class cards in `FeeManagement`: replaced gradient icon box → solid `bg-primary/10 text-primary`.
- `src/components/portal/parent-portal.tsx`
  - Replaced rose/pink welcome banner gradient (`from-rose-600 via-pink-700 to-rose-900`) with navy `from-primary via-primary to-primary/80` per task spec ("Keep banners as gradient `from-primary via-primary to-primary/80`").
  - Replaced amber blob (`bg-amber-400/15`) with primary-tinted `bg-[oklch(0.5_0.04_260)_/_0.15]` for theme consistency.
  - Cleaned KPI cards: removed `blur-2xl` decoration and gradient icon boxes (`from-emerald-500`, `from-violet-500`, `from-amber-500`, `from-rose-500`) → solid `bg-primary/10 text-primary`.
  - Cleaned `WardFees` "Total Paid" card: replaced `bg-gradient-to-br from-amber-600 to-yellow-700 text-white` with plain white card + `bg-primary/10 text-primary` icon.
- `src/lib/role-modules.ts` — NOT modified (already had `teacher-dashboard` item from a prior agent).
- `src/components/portal/role-portal.tsx` — NOT modified (already had `InstituteBranchWrapper` removed and direct `InstituteAdminPortal` routing).

### Verification
- `bun run lint` → exit code 0 (0 errors, 0 warnings).
- Dev server compiles cleanly after each edit (`✓ Compiled in 644ms` / `✓ Compiled in 639ms` etc.).
- `GET / 200 in 519ms` confirmed the home route renders successfully.
- Final `Grep` for `bg-gradient-to-br|blur-2xl|blur-3xl` across `/src/components/portal`:
  - Only banner gradients remain (welcome headers + branding page + modal banner header) — these are explicitly preserved per Task 4 spec.
  - All Card-level uses of `bg-gradient-to-br` and all `blur-2xl` decorative divs have been removed.

### Stage Summary
- **Task 1 (Teacher Dashboard)**: Verified — `teacher-dashboard` sidebar item exists, `TeacherDashboard` component renders 4 KPIs (Total Classes, Total Students, Total Courses, Diary Entries), navy welcome banner, NO announcements section. KPI/Quick Link cards cleaned per Task 4.
- **Task 2 (Student Challan)**: Verified — `html2pdf.js` dynamically imported on click to generate a real PDF (no print dialog) with a graceful iframe-print fallback. Title changed to "FEE CHALLAN" (uppercase). Institute name appears at the top, "Powered by ESM — Electronic School Management" footer present.
- **Task 3 (Institute Admin Branch Management)**: Verified — clicking a branch card opens a full `BranchManagementView` page (not a modal) with top bar (back button + branch name + edit/block/delete) and sub-navigation tabs (Teachers | Students | Classes & Courses | Fee Management). `InstituteBranchWrapper` is no longer used in `role-portal.tsx`. Institute-admin sidebar only contains `institute-overview`, `branches`, `announcements`, `settings` (no branch-level modules).
- **Task 4 (Card Redesign)**: Complete — all 6 portal files cleaned. Cards now use plain white background with `border border-border rounded-lg shadow-sm hover:shadow-md transition`. KPI/class/course/branch/institute cards all use solid `bg-primary/10 text-primary` icon boxes. Welcome banners retain navy `from-primary via-primary to-primary/80` gradient.
