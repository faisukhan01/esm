# FRONTEND-UPDATES — full-stack-developer

## Summary
Frontend-only updates to ESM:
1. Removed Parent Portal everywhere (login ROLES + landing Parent App section + nav link).
2. Login now accepts Email OR Roll No / ID (sent as `email` field; backend checks both).
3. Forced Change Password modal on first-time login (`mustChangePassword: true`).
4. Extended `src/lib/api.ts` with classes, courses, class-courses, teacher/student scoped, announcements, course materials, block/edit methods.
5. Rebuilt `AddUserModal` with rollNo (required), optional email, Assign Password label, class dropdown, course multi-select for teachers.

## Files Modified
- `src/components/auth/login-page.tsx` — removed Parent role, relabeled email field, added hint, added `ChangePasswordModal`, wired `mustChangePassword` flow.
- `src/components/landing/landing-page.tsx` — removed `parent-app` section (~204 lines), removed `PARENT_FEATURES`, removed Parent App from desktop + mobile nav arrays, cleaned unused imports, updated PLATFORM_FEATURES + How It Works step 4 wording to drop "Parents".
- `src/lib/api.ts` — added 15+ methods (changePassword, getClasses, getCourses, createCourse, createClassCourse, assignClassCourses, getTeacherClasses, getStudentCourses, getAnnouncements, createAnnouncement, getCourseMaterials, addCourseMaterial, downloadMaterial, blockInstitute, blockBranch, blockUser, getUserPassword, editUser, editInstitute) + updated login return type.
- `src/components/portal/add-user-modal.tsx` — full rewrite with new field set and validation.

## Backend Contract (verified, not modified)
- `POST /api/auth/login` → `{ token, user, mustChangePassword }`. Accepts `email` field that matches email OR rollNo (case-insensitive).
- `POST /api/auth/change-password` `{ currentPassword, newPassword }` — requires auth, sets `mustChangePassword = 0`.
- `POST /api/platform/users` — accepts `rollNo`, `classId`, `courseIds` for teacher/student; sets `mustChangePassword = 1` on new user.
- `GET /api/classes`, `GET /api/courses?classId=`, `GET /api/courses?branchId=`, `POST /api/courses`, `POST /api/class-courses`, `POST /api/classes/:id/courses`, `GET /api/teacher/classes`, `GET /api/student/courses`, `GET/POST /api/announcements`, `GET/POST /api/course-materials`, `GET /api/course-materials/:id/download`, `PATCH /api/institutes/:id/block`, `PATCH /api/branches/:id/block`, `PATCH /api/platform/users/:id/block`, `GET /api/platform/users/:id/password`, `PATCH /api/platform/users/:id`, `PATCH /api/institutes/:id` — all verified present in `mini-services/esm-api/index.js`.

## Verification
- `bun run lint` → 0 errors.
- Dev server: HTTP 200 on `/`, compiles cleanly. (Transient Fast Refresh error mid-edit was self-resolved once all edits settled.)
- AddUserModal caller (`branch-manager-portal.tsx`) — props unchanged, no integration changes needed.

## Notes for Next Agent
- `src/lib/store.ts` `Role` type union still includes `'parent'` (left untouched because `role-portal.tsx` and `parent-portal.tsx` still reference ParentPortal). If Parent portal components are also removed in a future task, update the union then.
- `src/lib/role-modules.ts` still has a `'parent'` entry — same reason; safe to leave for now.
- The login form's email field is now `type="text"` to accept both emails and Roll No/IDs — relies on backend to do the lookup.
- `downloadMaterial` returns a URL string (not a fetch) so the frontend can use it directly in an `<a href>` or `window.open` — the gateway `XTransformPort=3001` query is automatically appended via the `apiUrl` helper.
