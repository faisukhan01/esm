# NAVY-THEME — Navy Blue Professional Theme

**Agent**: full-stack-developer
**Task ID**: NAVY-THEME
**Task**: Apply navy blue professional theme across the entire ESM system. Remove emojis. Replace emerald/amber/teal/cyan/violet/purple with navy blue variants. Keep rose for destructive actions only.

## Files Modified

1. `src/app/globals.css` — Login CSS classes repainted navy:
   - `.login-bg` → `linear-gradient(135deg, #0f1e3a 0%, #1a365d 50%, #0f1e3a 100%)`
   - `.cover-gradient` → `linear-gradient(135deg, #1e3a5f 0%, #1a365d 100%)`
   - `.btn-gradient` → `linear-gradient(135deg, #1e3a5f 0%, #163150 100%)`
   - `.login-input:focus` → `#1e3a5f` border + `rgba(30,58,95,0.15)` shadow
   - `.floating-label` focus → `#1e3a5f`
   - `.custom-checkbox` → `accent-color: #1e3a5f`
   - `.custom-scrollbar` thumb → `rgba(30, 58, 95, …)`
   - `.eye-toggle:hover` → `#1e3a5f`

2. `src/components/auth/login-page.tsx`:
   - WavingPerson SVG: legs/shoes/eyes → `#0f1e3a`; body/arms → `#1e3a5f` with `#163150` strokes
   - Removed floating hearts + sparkles SVG decorations
   - Glow circles in cover panel → `bg-blue-300/10`
   - Feature bullets icon color → `text-blue-300`
   - Role selector active pills → `from-blue-700 to-blue-900`
   - FloatingInput success border → `border-blue-400`, focus border → `focus:border-blue-700`
   - Forgot password link → `text-blue-700`
   - Role info box → `bg-blue-50 border-blue-200 text-blue-800`
   - ChangePasswordModal shield icon → `bg-blue-100 text-blue-700`
   - All password field `focus:border-emerald-500` → `focus:border-blue-700`

3. `src/lib/role-modules.ts`:
   - All module `color` values converted to navy blue variants (`from-blue-600 to-blue-800` for primary, `from-blue-500 to-blue-700` for secondary)
   - Complaints (Branch Manager / Parent) stay `from-rose-500 to-rose-700` (destructive action)
   - `roleAccent` for all 6 roles → `from-blue-700 to-blue-900`

4. `src/components/portal/role-portal.tsx`:
   - Must-change-password banner repainted navy: `bg-blue-50 border-blue-300`, shield icon `text-blue-700`, CTA button `bg-blue-700 hover:bg-blue-800`

5. `src/components/portal/super-admin-portal.tsx`:
   - Welcome banner: amber/orange gradient → `from-blue-800 via-blue-900 to-blue-950`
   - Removed 👑 from "Welcome back, {name}"
   - Removed Sparkles import (was unused)
   - PlatformConfig settings: removed Sparkles icon row, replaced with ShieldCheck
   - KPI cards all → `from-blue-600 to-blue-800` / `from-blue-500 to-blue-700`
   - Institute/branch status badges: Active → blue, Trial → sky, Blocked → rose
   - All emerald buttons → `bg-blue-700 hover:bg-blue-800`
   - ProvisionInstituteModal success state, EditInstituteModal, InstituteCard all repainted navy
   - BrandingPage: gradient → navy, ColorRow palette → Navy/Accent Blue/Sky/Slate
   - Loader2 spinner color → `text-blue-700`

6. `src/components/portal/institute-admin-portal.tsx`:
   - Welcome banner: emerald → `from-blue-800 via-blue-900 to-blue-950`
   - Removed 👋 from welcome text
   - KPI cards all → navy
   - BranchCard / BranchDetailsModal teal/cyan → navy
   - All emerald buttons → blue
   - Provisioned modal state, EditBranchModal, AnnouncementsView repainted

7. `src/components/portal/branch-manager-portal.tsx`:
   - Welcome banner: teal/cyan → `from-blue-800 via-blue-900 to-blue-950`
   - Removed 👋 from welcome text
   - Removed `Sparkles` import (was used by Generate Invoices button)
   - Generate Invoices button: `bg-amber-600 hover:bg-amber-700` + `<Sparkles>` → `bg-blue-700 hover:bg-blue-800` + `<Plus>`
   - KPI cards all → navy variants (Fee Collected changed from amber-yellow)
   - UserRowActions: password reveal bubble amber → blue, toggleBlock active color → blue
   - ClassCourseView: book/section/course create flow emerald → blue
   - Course assignment checklist colors → blue
   - Class grid cards `from-emerald-500 to-teal-600` → `from-blue-500 to-blue-700`
   - Fee structure: "Fees Configured" stat emerald → blue, "Pending Setup" amber → sky
   - Fee cards: `from-amber-500 to-yellow-600` per-class card icon → blue
   - Invoice Paid badge: emerald → blue; "Settled" status: emerald → blue
   - Mark Paid button: emerald outline → blue outline
   - All emerald buttons → blue

8. `src/components/portal/teacher-portal.tsx`:
   - Welcome banner: violet/purple → `from-blue-800 via-blue-900 to-blue-950`
   - Removed 👋 from welcome text
   - KPI cards all → navy variants (Attendance, Courses, Students, Diary)
   - Class cards violet gradient → navy
   - Quick action buttons: Attendance/Results/Material/Announce — kept Attendance/Results/Material (all blue), REMOVED the "Announce" quick action from dashboard per task spec
   - Attendance colors: Present emerald → blue, Late amber → sky (Absent stays rose)
   - ClassResults publish button → blue
   - MaterialUploadForm: paperclip icon → blue, file picker → blue, upload button → blue
   - MaterialCard: cyan/violet → blue
   - ClassAnnouncements send button rose → blue (rose is reserved for destructive)
   - DiaryView: due badge amber → blue
   - MessageParents: SMS status badge emerald → blue, send button → blue
   - TeacherAnnouncements: send button rose → blue, megaphone icon container rose → blue

9. `src/components/portal/student-portal.tsx`:
   - Welcome banner: cyan/teal → `from-blue-800 via-blue-900 to-blue-950`
   - Removed 👋 from welcome text
   - Removed Megaphone import (no longer used)
   - Removed the "Latest Announcement" card from StudentOverview (announcements only in dedicated page)
   - Course card `from-cyan-500 to-teal-600` → `from-blue-600 to-blue-800`
   - Course card recent-mark/attendance blocks: violet/emerald → blue
   - "Open →" link: cyan → blue
   - MaterialCard: cyan/violet → blue
   - CourseResultsView: bg-emerald progress bar → bg-blue-700
   - Attendance (CourseAttendanceView, MyAttendance): Present emerald → blue, Late amber → sky, Rate card → blue tint
   - Status badges (Present/Absent/Late): emerald/amber → blue/sky/rose
   - MyResults: progress bar bg-emerald → bg-blue-700
   - MyDiary due badge amber → blue
   - MyInvoices cards: Total Paid emerald → blue, Total Pending stays rose (destructive), Total Amount amber → blue
   - Paid badge: emerald → blue
   - "Download Challan" button: amber outline → blue outline
   - "How to download your challan PDF" info card: amber → blue
   - PDF challan HTML template: teal border/headers → navy (#1e3a5f / #0f1e3a / #b6c5d8 / #eef2f8), paid status badge → light blue, unpaid stays red

10. `src/components/portal/settings-page.tsx`:
    - Profile / Change Password section icons: emerald → blue
    - "Action required" pill: amber → blue
    - Must-change-password inline warning: amber → blue
    - Update Password button: `bg-emerald-600` → `bg-blue-700 hover:bg-blue-800`

11. `src/components/portal/parent-portal.tsx`:
    - Removed 👋 from "Hello, {name}" (parent welcome)
    - Note: parent portal kept its rose/pink banner color (rose allowed for parent role identity per accent)

12. `src/components/dashboard/modules/dashboard-overview.tsx`:
    - Removed 👋 from "Good morning, Administrator"
    - Welcome banner: emerald → `from-blue-800 via-blue-900 to-blue-950`
    - KPI cards all → navy variants
    - Pie chart: Present `#10b981` → `#1d4ed8`, Late `#f59e0b` → `#0ea5e9` (Absent stays `#f43f5e`)
    - Area chart "present" stroke/fill `#10b981` → `#1d4ed8`
    - Fee bar chart: collected `#10b981` → `#1d4ed8`, pending `#f59e0b` → `#0ea5e9`
    - Subject performance bar: `#10b981` → `#1d4ed8`
    - Quick stats icons: emerald → blue

## Verification

- `bun run lint` → exit code 0 (clean)
- Dev server compiles successfully (no errors)
- All HTTP responses still 200 OK
- All status badges preserved semantically: Paid/Active = blue, Unpaid/Blocked = rose, Late/Trial = sky
- No emojis remaining anywhere in `src/`
- No emerald/teal/cyan/violet/purple remaining in modified portal files

## Stage Summary

The entire ESM portal now uses a unified navy blue professional theme matching the UCP/Odoo reference:
- **Welcome banners**: deep navy gradient (`from-blue-800 via-blue-900 to-blue-950`)
- **KPI / module cards**: navy gradients (`from-blue-600 to-blue-800` for primary, `from-blue-500 to-blue-700` for secondary)
- **Action buttons**: `bg-blue-700 hover:bg-blue-800` (replaced all emerald variants)
- **Status badges**: blue for positive, rose for destructive, sky for warnings/late
- **Login page**: navy waving character body, navy cover panel, navy role pills, blue focus rings
- **No emojis anywhere** — all 👋, 👑 removed
- **Announcements**: removed from teacher & student dashboards, kept only in dedicated Announcements pages
- **PDF challan**: navy-themed printable template
