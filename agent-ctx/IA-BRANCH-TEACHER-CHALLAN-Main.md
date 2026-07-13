# Task ID: IA-BRANCH-TEACHER-CHALLAN
## Agent: Main (Z.ai Code)

### Scope
Three related UX fixes for the ESM portal:
1. Institute Admin — branch selector wrapper for branch-level modules (Teachers / Students / Classes & Courses / Fee Management).
2. Teacher Portal — refresh dashboard KPI cards to the requested set (Total Classes, Total Students, Total Courses, Today's Schedule count) and surface per-class student count on class cards.
3. Student Portal — switch the fee challan download from a new-tab `window.print()` to a hidden-iframe print, plus add the institute name at the top and a "Powered by ESM — Electronic School Management" footer.

### Files Modified
- `src/components/portal/institute-admin-portal.tsx`
  - Added new `InstituteBranchWrapper` component (exported).
  - Imports `useMemo`, `GitBranch` icon, and `BranchManagerPortal`.
- `src/components/portal/role-portal.tsx`
  - Imports `InstituteBranchWrapper` alongside `InstituteAdminPortal`.
  - Branch module routing for institute-admin now goes through the wrapper instead of `BranchManagerPortal` directly.
- `src/components/portal/teacher-portal.tsx`
  - `TeacherOverview` KPI cards rewritten: Total Classes / Total Students / Total Courses / Today's Schedule (each with a small sub-label).
  - Class card now shows BOTH course count and student count badges (student count computed via `students.filter(s => s.class === cls.name).length`).
- `src/components/portal/student-portal.tsx`
  - Replaced `downloadChallanPDF` with three smaller functions: `buildChallanHTML`, `printChallanInIframe`, `downloadChallanPDF`.
  - Challan HTML now includes the institute name at the top and a "Powered by ESM — Electronic School Management" footer.
  - `MyInvoices.downloadChallan` passes `user?.instituteName` to `downloadChallanPDF`.
  - Help-card copy updated to reflect the new no-tab iframe flow.

### Approach Details
- **Branch wrapper**: fetches branches once via `api.branches(user.instituteId)`, defaults to the first branch, and builds a `modifiedUser` (useMemo) that overrides only `branchId`/`branchName`. The wrapper renders a navy-blue "Branch" card with a shadcn `<Select>` and the module title, then renders `<BranchManagerPortal activeModule user={modifiedUser} />` underneath. Falls back to a "No branches yet" empty state.
- **ESLint fix**: deferred the no-institute `setLoading(false)` to a microtask (`Promise.resolve().then(...)`) so we don't call `setState` synchronously inside the effect body (avoids `react-hooks/set-state-in-effect`).
- **Today's Schedule**: shown as `0` with a "No timetable yet" sub-label because no real per-day timetable is published yet — the welcome banner also mentions the timetable is pending.
- **Iframe print**: reuses a single hidden `<iframe id="esm-challan-frame">` (created once, 0×0, `aria-hidden`). Writes the challan HTML into the iframe document and then defers `win.focus() + win.print()` by 300ms. The deferred timeout is used instead of `iframe.onload` because `onload` doesn't re-fire when the iframe is reused for subsequent prints. Wrapped in try/catch with a toast on failure.

### Verification
- `bun run lint` → exit code 0 (0 errors, 0 warnings).
- Dev server compiles cleanly (multiple "✓ Compiled" entries in dev.log after edits).
- All HTTP responses still 200.
- Institute Admin sidebar: branch modules (Teachers/Students/Classes & Courses/Fee Management) now show a branch selector bar before rendering Branch Manager content.
- Teacher dashboard: 4 KPI cards as requested, with sub-labels for extra context; class cards display both course and student count badges.
- Student challan: hidden iframe print (no new tab), institute name at top, "Powered by ESM — Electronic School Management" footer.
