# Antigravity Work Log

## Logging Rule
- Goal: Keep a portable, append-only record so work can continue in Antigravity.
- Format: Add one entry per request using the fixed template below.
- Update policy: Append a new entry at the end for every new task.
- Required sections: `Request`, `Scope`, `Implemented`, `Validation`, `Files`, `Notes`.

## Entry Template

Copy this block for every new entry:

```md
## YYYY-MM-DD - Short Task Title

### Request
- What the user asked for.

### Scope
- What area of the codebase was touched.
- What was intentionally out of scope.

### Implemented
- Concrete change 1
- Concrete change 2

### Validation
- `command` -> Success/Failed
- Manual check -> result

### Files
- `path/to/file`
- `path/to/file`

### Notes
- Follow-up risks, assumptions, or handoff details.
```

## Writing Rules
- Keep each section short and factual.
- Prefer exact file paths, commands, and behaviors over narrative summary.
- If validation was blocked, say why explicitly.
- If the task overlaps with concurrent edits, mention that in `Notes`.
- Do not rewrite older entries unless the user explicitly asks.

---

## 2026-02-19 - Re-analysis + Logging Setup

### Request
- Re-analyze current project state.
- From now on, always keep records for future Antigravity handoff.

### Scope
- Repository-wide state check and handoff/logging baseline setup.
- No feature implementation was performed.

### Implemented
- Recorded initial workspace snapshot for future handoff.
- Established append-only worklog usage for future Antigravity continuity.

### Validation
- `npm run lint` -> Failed (8 issues)
- `npm run build` (sandbox) -> Failed (`spawn EPERM`)
- `npm run build` (escalated) -> Success

### Files
- `src/pages/AdminPage.jsx`
- `src/pages/StudentDashboardPage.jsx`
- `src/index.css`
- `tuto.html`

### Notes
- Workspace snapshot at the time of analysis:
  - Modified: `src/pages/AdminPage.jsx`
  - Modified: `src/stores/useAuthStore.js`
  - Untracked: `tuto.html`
- Lint errors observed:
  - `src/pages/AdminPage.jsx:764` `react-hooks/set-state-in-effect`
  - `src/pages/AdminPage.jsx:1771` `no-unused-vars` (`submissions`)
  - `src/pages/StudentDashboardPage.jsx:11` `no-unused-vars` (`getStudentProgress`)
  - `src/pages/StudentDashboardPage.jsx:12` `no-unused-vars` (`courses`)
  - `src/pages/StudentDashboardPage.jsx:15` `no-unused-vars` (`setXP`)
  - `src/pages/StudentDashboardPage.jsx:16` `no-unused-vars` (`setLevel`)
  - `src/pages/StudentDashboardPage.jsx:17` `no-unused-vars` (`setNextLevelXP`)
  - Warning: `src/pages/AdminPage.jsx:1504` `react-hooks/exhaustive-deps` missing dependency `selectedCourse`
- Build pipeline was functional; initial build failure was sandbox-related.
- Additional warnings:
  - CSS `@import` placement issue in `src/index.css`
  - bundle chunk over 500 kB in `dist/assets/index-BwDqXCEO.js`
- Suggested next actions:
  - Fix lint errors in `src/pages/AdminPage.jsx` and `src/pages/StudentDashboardPage.jsx`
  - Move Google Fonts `@import` to top of `src/index.css`
  - Consider code-splitting for bundle reduction

---

## 2026-02-19 - Plan Review Request (Tutorial HTML Upload)

### Request
- User requested review/approval of updated `implementation_plan.md` and `task.md` for tutorial HTML upload flow.

### Scope
- Review of requested plan documents and related tutorial upload references.
- No code changes were made.

### Implemented
- Searched for `implementation_plan.md`, `task.md`, `MissionEditorModal`, `htmlContent`, and `tutorial`.
- Confirmed the referenced documents/content were not present in the workspace.
- Provided preliminary architecture guidance based on the described direction.

### Validation
- Manual search -> No matching files or relevant content found in workspace

### Files
- `implementation_plan.md`
- `task.md`

### Notes
- Formal document review was blocked due to missing files.
- Preliminary direction was acceptable: admin upload -> mission `htmlContent` -> student iframe render.
- Requirements called out for implementation:
  - sanitize uploaded HTML before save/render
  - restrict iframe sandbox
  - enforce HTML payload size limit
  - define explicit completion trigger for tutorial missions

---

## 2026-02-19 - Implementation (Antigravity Continuation)

### Request
- Continue implementation from Antigravity context.
- Add tutorial HTML upload in admin flow and render it for students in mission view.

### Scope
- Admin mission editor tutorial upload flow.
- Student mission rendering for tutorial HTML content.

### Implemented
- Extended `MissionEditorModal` in `src/pages/AdminPage.jsx` with `htmlContent` and `htmlFileName`.
- Added tutorial HTML upload input for `type === 'tutorial'`.
- Implemented file read via `file.text()` and mission payload binding.
- Added 1 MB size guard with `MAX_TUTORIAL_HTML_BYTES`.
- Added upload error feedback and loaded file summary text.
- Updated `TutorialView` in `src/pages/MissionPage.jsx` to render `mission.htmlContent` with `iframe srcDoc`.
- Added `sandbox="allow-scripts allow-forms allow-modals allow-popups"` for tutorial HTML iframe rendering.
- Added completion checkbox and complete button for HTML tutorial mode.
- Kept existing `tutorialSteps` flow as fallback.
- Updated main mission render routing to use `mission.type` first with difficulty fallback.

### Validation
- `npx eslint src/pages/AdminPage.jsx src/pages/MissionPage.jsx` -> Partial success
- `npm run build` -> sandbox failed with `spawn EPERM`, escalated success

### Files
- `src/pages/AdminPage.jsx`
- `src/pages/MissionPage.jsx`

### Notes
- Feature path is now connected end-to-end for tutorial HTML missions.
- `src/pages/MissionPage.jsx` had no new lint errors from this change.
- `src/pages/AdminPage.jsx` still had pre-existing issues:
  - `react-hooks/set-state-in-effect`
  - `no-unused-vars` (`submissions`)
  - `react-hooks/exhaustive-deps` warning
- Existing repo-wide lint debt remained unresolved and unrelated to this feature.

---

## 2026-03-12 - Admin Dashboard Session Calendar

### Request
- Show lesson sessions on the admin dashboard calendar for the dates they were created.

### Scope
- Admin dashboard calendar rendering only.
- Assessment session storage behavior remained unchanged.

### Implemented
- Wired `useAssessmentStore(state => state.sessionScores)` into the admin dashboard flow in `src/pages/AdminPage.jsx`.
- Built date-keyed calendar data from `sessionScores`.
- Deduplicated session entries by `courseId + sessionDate + sessionLabel` because sessions are stored per assessment area.
- Passed aggregated session data into `DashboardCalendar`.
- Replaced mock calendar data with prop-based input in `src/components/DashboardCalendar.jsx`.
- Rendered per-date session count and up to two session labels in each day cell.
- Added selected-date detail panel listing all sessions for that date with course title.
- Cleared selected state if the underlying date data disappears.

### Validation
- `npm run build` -> sandbox failed with `spawn EPERM` during Vite config resolution, escalated success

### Files
- `src/pages/AdminPage.jsx`
- `src/components/DashboardCalendar.jsx`

### Notes
- This task overlapped with other concurrent changes already present in `src/pages/AdminPage.jsx`.
- This change affects admin dashboard visibility only; assessment session storage behavior was not changed.

---

## 2026-03-12 - Admin Dashboard Session Calendar Layout Cleanup

### Request
- Show the course name for each session on the admin dashboard calendar.
- Keep session items inside each date cell without overflowing.
- Improve alignment and allow the calendar to be larger if needed.

### Scope
- Admin dashboard calendar UI only.
- No changes to session aggregation or assessment storage behavior.

### Implemented
- Reworked `src/components/DashboardCalendar.jsx` date-cell layout to use taller fixed-height cells.
- Added compact session preview cards with `courseTitle` on the first line and session label on the second line.
- Added per-day count badge in the cell header.
- Limited in-cell preview to two items plus an overflow summary.
- Kept selected-date detail panel and reordered its content to show course first, then session label.
- Updated calendar heading copy to match the new session-focused behavior.

### Validation
- `npm run build` -> sandbox failed with `spawn EPERM`, escalated success

### Files
- `src/components/DashboardCalendar.jsx`

### Notes
- The calendar component was rewritten as a whole to avoid patch drift from mixed text encoding in the previous file content.

---

## 2026-03-12 - Admin Dashboard Calendar Width Expansion

### Request
- Move the course progress panel below the calendar.
- Make the calendar wider horizontally so text in date cells is less likely to be clipped.

### Scope
- Admin dashboard overview layout only.
- No changes to calendar data generation.

### Implemented
- Removed the side-by-side calendar/progress layout in `src/pages/AdminPage.jsx`.
- Placed `DashboardCalendar` in its own full-width block.
- Moved the course progress card below the calendar.
- Expanded the dashboard overview container from `max-w-7xl` to full width.
- Changed the course progress card body to a responsive grid so it still uses space efficiently after moving below the calendar.

### Validation
- `npm run build` -> sandbox failed with `spawn EPERM`, escalated success

### Files
- `src/pages/AdminPage.jsx`

### Notes
- This was a layout-only change to create more horizontal room for date-cell content.

---

## 2026-03-12 - Admin Dashboard Layout Structure Fix

### Request
- Re-check the dashboard because the course progress panel had not actually moved below the calendar.

### Scope
- Admin dashboard overview JSX structure only.
- No visual redesign beyond correcting the broken layout nesting.

### Implemented
- Restored the missing closing wrapper for the top statistics grid in `src/pages/AdminPage.jsx`.
- Removed the extra closing wrapper after the course progress section.
- Kept the intended layout: full-width calendar first, course progress card below it.

### Validation
- `npm run build` -> sandbox failed with `spawn EPERM`, escalated success

### Files
- `src/pages/AdminPage.jsx`

### Notes
- The previous change had left the stats grid wrapper unclosed, which caused the layout to render differently from the intended structure.

---

## 2026-03-12 - Admin Dashboard Calendar Cell Scrolling

### Request
- Allow scrolling inside a date cell when many sessions are assigned to the same date.

### Scope
- Admin dashboard calendar cell rendering only.
- No changes to dashboard layout or session aggregation.

### Implemented
- Reworked `src/components/DashboardCalendar.jsx` so each date cell keeps a fixed height while the session list area scrolls vertically.
- Increased the day-cell height slightly to create more room for the in-cell list.
- Changed the cell content from preview-plus-summary to a full in-cell scrollable list of sessions.

### Validation
- `npm run build` -> sandbox failed with `spawn EPERM`, escalated success

### Files
- `src/components/DashboardCalendar.jsx`

### Notes
- The calendar component was rewritten again to avoid patch instability caused by mixed text encoding in the previous version.

---

## 2026-03-12 - Admin Dashboard Calendar Course Icons

### Request
- Replace in-cell course text with course icons so date cells can show session labels more compactly.

### Scope
- Admin dashboard calendar session display only.
- No changes to session storage or dashboard layout.

### Implemented
- Added `courseIcon` into the aggregated session calendar data in `src/pages/AdminPage.jsx`.
- Used the course icon from course metadata, with `📚` as fallback.
- Updated `src/components/DashboardCalendar.jsx` so date cells show `icon + session label` instead of course name text.
- Kept the selected-date detail panel showing both course icon and course title for clarity.
- Replaced the in-cell scroll list with a compact preview of up to four sessions plus an overflow count.

### Validation
- `npm run build` -> sandbox failed with `spawn EPERM`, escalated success

### Files
- `src/pages/AdminPage.jsx`
- `src/components/DashboardCalendar.jsx`

### Notes
- The calendar component was rewritten to normalize prior mixed text content and make the compact icon-based layout deterministic.

---

## 2026-03-12 - Admin Dashboard Calendar Pill Layout

### Request
- Show sessions inside date cells as compact button-like items sized to their text, instead of full-row blocks.

### Scope
- Admin dashboard calendar cell UI only.
- No changes to aggregated session data structure.

### Implemented
- Reworked `src/components/DashboardCalendar.jsx` session preview items into compact rounded pills.
- Changed the in-cell session container to a wrapping layout so pills flow naturally across the available width.
- Increased the visible item cap in the cell to six pills before showing an overflow counter.

### Validation
- `npm run build` -> sandbox failed with `spawn EPERM`, escalated success

### Files
- `src/components/DashboardCalendar.jsx`

### Notes
- The calendar component was rewritten again to keep the compact pill layout deterministic and avoid patch drift.

---

## 2026-03-12 - Admin Dashboard Session Ordering

### Request
- Sort sessions in the calendar in natural lesson order.

### Scope
- Admin dashboard session aggregation sort order only.
- No UI structure changes.

### Implemented
- Updated `src/pages/AdminPage.jsx` calendar session sort comparator to use Korean natural string ordering with numeric comparison.
- Added course-title fallback ordering when labels are identical.

### Validation
- `npm run build` -> sandbox failed with `spawn EPERM`, escalated success

### Files
- `src/pages/AdminPage.jsx`

### Notes
- This makes labels like `1차시, 2차시, 10차시` render in expected numeric order instead of pure lexical order.

---

## 2026-03-12 - Badge/Achievement System

### Request
- Implement a comprehensive badge/achievement system (100 badges) for students.

### Scope
- Created badge definitions and conditions.
- Implemented global badge checking store and notification UI.
- Integrated badge collection UI into `StudentProfilePage` and `AdminPage`.
- Fixed CSS `@import` build error.

### Implemented
- Added `src/data/badgesData.js` with 100 badge definitions and `condition(stats)` functions.
- Added `src/stores/useBadgeStore.js` to manage unlocked badges, calculate aggregated `stats`, and trigger checks.
- Added `src/components/BadgeNotification.jsx` to show animated toast popups upon unlocking via `badgeUnlocked` CustomEvent.
- Added `<BadgeNotification />` to global routing layout in `src/App.jsx`.
- Added "My Badges" section in `src/pages/StudentProfilePage.jsx`.
- Added "View Badges" modal in `src/pages/AdminPage.jsx` (Learners Management) for admins to inspect student achievements.
- Moved `@import url(...)` before `@import "tailwindcss"` in `src/index.css` to fix Vite build error.

### Validation
- Vite dev server -> Success, application loads without white screen.
- UI -> Admin badge modal and student profile badge grids render correctly.

### Files
- `src/data/badgesData.js`
- `src/stores/useBadgeStore.js`
- `src/components/BadgeNotification.jsx`
- `src/App.jsx`
- `src/pages/StudentProfilePage.jsx`
- `src/pages/AdminPage.jsx`
- `src/index.css`

### Notes
- Badge unlocking relies on evaluating `progress`, `sessions`, `purchases` globally from `useBadgeStore.getState().checkBadges()`, triggered by `BadgeNotification`'s `useEffect` listener to other stores.
- Built compatibly with Codex's concurrent modifications to `AdminPage.jsx` (Session Calendar).

---

## 2026-03-12 - Push Current Workspace Changes

### Request
- Push the current workspace changes to the remote repository.

### Scope
- Repository state management and remote sync only.
- No new product behavior changes beyond recording the push task in the worklog.

### Implemented
- Reviewed `ANTIGRAVITY_WORKLOG.md` and current `git status` before sync.
- Prepared the current workspace changes for commit and push.

### Validation
- `git status --short --branch` -> Success
- `git push` -> Pending

### Files
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Commit and push details will match the final synced workspace state for this task.

---

## 2026-03-13 - Sub-Admin Full Admin Access

### Request
- Allow sub-admin accounts created from the sub-admin tab to use the admin dashboard and the same major admin areas as the main admin.

### Scope
- `src/pages/AdminPage.jsx` admin UI access and sub-admin account management flow.
- No auth route changes were needed because `/admin` already allowed `subadmin`.

### Implemented
- Added a working `SubAdminManagement` view to create, edit, and delete sub-admin accounts.
- Changed the admin sidebar so `subadmin` users can access `Dashboard`, `Learners`, `Class`, `Assessments`, `Marketplace`, `Sub-Admin`, and `Settings`.
- Changed admin page initial view to `dashboard` for sub-admin logins as well.
- Assigned all current course IDs when creating or updating a sub-admin account for compatibility with existing stored course metadata.

### Validation
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success
- Production build -> Success

### Files
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- `AdminPage.jsx` contains existing mixed text encoding in older strings; new logic was added without broad text normalization to avoid unrelated churn.

---

## 2026-03-13 - Login Page Cross-Link Removal

### Request
- Remove the link from the student login page to the admin login page.
- Remove the link from the admin login page to the student login page.

### Scope
- Login page UI only.
- Direct route access to `/` and `/admin-login` remained unchanged.

### Implemented
- Removed the footer login-switch button from `StudentLoginPage`.
- Removed the footer login-switch button from `AdminLoginPage`.
- Removed the unused `Button` import from `AdminLoginPage`.

### Validation
- Manual code check -> Success

### Files
- `src/pages/StudentLoginPage.jsx`
- `src/pages/AdminLoginPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Users can still access each login page directly by URL; only the in-page shortcut links were removed.

---

## 2026-03-13 - Sub-Admin Permission Controls

### Request
- Let the main admin configure each sub-admin's permissions from the sub-admin tab.

### Scope
- `src/stores/useAuthStore.js` sub-admin persistence/login payload.
- `src/pages/AdminPage.jsx` sub-admin management UI and sub-admin admin-page access control.

### Implemented
- Added per-sub-admin `permissions` storage with defaults for `dashboard`, `learners`, `class`, `assessments`, `marketplace`, `subadmins`, and `settings`.
- Included sub-admin permissions in login state and persistence migration.
- Added permission checkboxes to the sub-admin create/edit modal.
- Updated the sub-admin list to display the currently enabled permission badges.
- Restricted admin sidebar tabs for logged-in sub-admins based on their saved permissions and auto-fallback to the first allowed view.

### Validation
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/stores/useAuthStore.js`
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Existing sub-admin accounts are migrated to full access by default unless specific permissions are later turned off by the main admin.

---

## 2026-03-13 - Student Reflection Tab

### Request
- Add an English `Reflection` tab on the student page.
- Let students review which class/stage their own reflection sentence was saved under.

### Scope
- `src/stores/useProgressStore.js` reflection persistence.
- `src/pages/StudentDashboardPage.jsx` student mission completion and reflection tab UI.
- No admin-facing reflection UI was added.

### Implemented
- Added persisted `reflections` storage and `getStudentReflections(studentId)` in the progress store.
- Extended mission completion to optionally save one reflection sentence with course/stage/mission metadata.
- Added a reflection input modal during first-time mission completion.
- Added a `Reflection` sidebar tab on the student page.
- Added a reflection list view showing the student's own saved entries with course, stage, difficulty, and timestamp.

### Validation
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/stores/useProgressStore.js`
- `src/pages/StudentDashboardPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Reflection entries are created only on first-time mission completion and displayed newest first.

---

## 2026-03-13 - Reflection UI Alignment + Save Fix

### Request
- Make the student `Reflection` tab match the surrounding student-page UI.
- Check and fix the error that occurs when writing a reflection.

### Scope
- `src/pages/StudentDashboardPage.jsx` reflection tab presentation only.
- `src/stores/useProgressStore.js` reflection persistence safety/migration.

### Implemented
- Added a reflection count badge to the student sidebar tab.
- Restyled the reflection page into summary card + reflection cards consistent with the existing dashboard card system.
- Hardened reflection persistence by defaulting missing legacy `reflections` arrays during save/read.
- Added a persist migration so older saved progress state upgrades cleanly to include `reflections`.

### Validation
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/pages/StudentDashboardPage.jsx`
- `src/stores/useProgressStore.js`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The likely runtime failure was legacy persisted progress data missing the `reflections` array; save/read paths now guard against that case.

---

## 2026-03-13 - Reflection Modal State Cleanup

### Request
- Fix the problem in the reflection modal shown after finishing a stage.

### Scope
- `src/pages/StudentDashboardPage.jsx` reflection modal state handling only.
- No persistence or admin-side changes.

### Implemented
- Added a dedicated `closeReflectionModal` handler to reset modal visibility, text, and validation state together.
- Reused that handler for both cancel/close and successful save paths.
- Prevented stale reflection text or error state from remaining when the modal is reopened.

### Validation
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/pages/StudentDashboardPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- This change was applied on top of the in-progress student reflection feature changes already present in the workspace.

---

## 2026-03-13 - Reflection Input Focus Fix

### Request
- Fix the reflection modal so typing does not flicker or drop input.

### Scope
- `src/pages/StudentDashboardPage.jsx` reflection modal rendering only.
- No store or route changes.

### Implemented
- Removed the inline nested `ReflectionInputModal` component definition from inside `StudentDashboardPage`.
- Rendered the reflection modal directly in the page JSX so the textarea no longer remounts on each keystroke.

### Validation
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/pages/StudentDashboardPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Root cause was component identity churn causing the modal subtree to remount during controlled textarea updates.

## 2026-03-13 - Admin Help Guide Modal

### Request
- Make the admin page `?` button open a popup guide that explains how to use the full admin page for first-time users.

### Scope
- `src/pages/AdminPage.jsx` top-header help action and admin help UI only.
- No changes to admin data models or existing management flows.

### Implemented
- Added `AdminHelpModal` to `src/pages/AdminPage.jsx`.
- Connected the top-right help button to open the modal.
- Wrote beginner-focused guide content covering quick start steps, menu-by-menu usage, and operating tips.
- Filtered guide sections by the current account's visible admin permissions and highlighted the current page.

### Validation
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The help modal uses the existing admin visual style and closes by overlay click, close button, or `Escape`.

## 2026-03-13 - Student/Admin Stability Optimization

### Request
- Review the codebase and optimize the unstable parts found during inspection.

### Scope
- Student notification header, student assessments page, badge notification flow, badge stats calculation, and notification store migration.
- No broad cleanup of existing admin-page lint debt beyond this focused stability pass.

### Implemented
- Removed React Compiler-fragile memoization from the student notification header and added safe handling for legacy notifications missing `readBy`.
- Changed the student assessments page to derive the active course from current assignments instead of relying on one-time initial state.
- Reconnected badge recalculation to `sessionScores` instead of the removed `sessions` field.
- Reworked badge assessment stats to use current assessment-plan/session-score structures.
- Added notification-store migration to normalize persisted `readBy` arrays.

### Validation
- `npx eslint src/components/StudentHeaderActions.jsx src/pages/StudentAssessmentsPage.jsx src/components/BadgeNotification.jsx src/stores/useBadgeStore.js src/stores/useNotificationStore.js` -> Success
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success
- `npx eslint src` -> Failed (remaining pre-existing issues in `src/pages/AdminPage.jsx`, `src/pages/MarketplacePage.jsx`, `src/pages/StudentDashboardPage.jsx`, `src/pages/StudentProfilePage.jsx`)

### Files
- `src/components/StudentHeaderActions.jsx`
- `src/pages/StudentAssessmentsPage.jsx`
- `src/components/BadgeNotification.jsx`
- `src/stores/useBadgeStore.js`
- `src/stores/useNotificationStore.js`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Remaining repo-wide lint failures are now concentrated outside the files changed in this optimization pass, with `src/pages/AdminPage.jsx` still the largest source of debt.

## 2026-03-13 - Repo Lint Cleanup

### Request
- Continue the optimization pass and clean up the remaining lint issues across the repository.

### Scope
- `src/pages/AdminPage.jsx`, `src/pages/MarketplacePage.jsx`, `src/pages/StudentDashboardPage.jsx`, and `src/pages/StudentProfilePage.jsx`.
- No feature redesign beyond making existing flows lint-safe and compile-clean.

### Implemented
- Removed unused imports/state in admin, marketplace, and student profile pages.
- Reworked `MissionEditorModal` initialization in `src/pages/AdminPage.jsx` to use derived initial state plus remount-by-key instead of effect-driven synchronous state resets.
- Kept the existing admin help modal wiring and made the admin page fully lint-clean.
- Fixed student dashboard hook dependency warnings.

### Validation
- `npx eslint src` -> Success
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/pages/AdminPage.jsx`
- `src/pages/MarketplacePage.jsx`
- `src/pages/StudentDashboardPage.jsx`
- `src/pages/StudentProfilePage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Build still reports a large bundle-size warning only; lint and compile errors are resolved.

## 2026-03-13 - Route-Based Bundle Splitting

### Request
- Reduce the bundle-size warning and verify the optimization still works correctly.

### Scope
- `src/App.jsx` routing/loading behavior.
- `vite.config.js` build chunking configuration.

### Implemented
- Changed top-level page imports in `src/App.jsx` to `React.lazy(...)`.
- Wrapped route rendering in `Suspense` with a lightweight loading fallback.
- Added Vite `manualChunks` rules to split `xlsx`, UI libraries, Zustand, and remaining vendor code.
- Removed an unnecessary `router` manual chunk after it generated an empty chunk warning.

### Validation
- `npx eslint src/App.jsx vite.config.js` -> Success
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success
- Build output check -> Success, route/page chunks generated separately and previous `>500 kB` warning no longer appears

### Files
- `src/App.jsx`
- `vite.config.js`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Final build produced separate chunks such as `AdminPage`, `StudentDashboardPage`, `MarketplacePage`, `StudentProfilePage`, `ui`, `vendor`, and `xlsx`.

## 2026-03-15 - Admin Reflection Overview

### Request
- Let admins view the student-page `Reflection` content.
- Add an admin `Reflection` tab that shows enrolled students' reflection sentences grouped by course.

### Scope
- `src/pages/AdminPage.jsx` admin navigation and reflection overview UI.
- `src/stores/useAuthStore.js` sub-admin permission defaults.
- `src/stores/useProgressStore.js` reflection selectors.

### Implemented
- Added `reflection` as an admin/sub-admin permission and sidebar view.
- Added an admin `ReflectionManagement` view with per-course selection, summary counts, and student-grouped reflection cards.
- Wired admin data access to persisted reflection entries and added reusable course/all reflection selectors in the progress store.
- Extended the admin help modal guide to describe the new reflection workflow.

### Validation
- `npx eslint src/pages/AdminPage.jsx src/stores/useAuthStore.js src/stores/useProgressStore.js` -> Success
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/pages/AdminPage.jsx`
- `src/stores/useAuthStore.js`
- `src/stores/useProgressStore.js`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- Existing sub-admin accounts migrate to include `reflection: true` by default through the shared permission normalizer.
- Admin reflection visibility is read-only; no edit/delete flow was added for reflection entries.

## 2026-03-15 - Student Assigned Class Filtering Fix

### Request
- Check why student `3101` could see classes without being enrolled.

### Scope
- `src/pages/StudentDashboardPage.jsx` student dashboard and class-list rendering only.
- No auth data model change was needed.

### Implemented
- Derived `myCourses` from `user.courseIds` and changed the student dashboard to render assigned classes only.
- Updated course count cards, shortcut cards, and `My Class` list to use `myCourses` instead of all courses.
- Restricted `openCourse` query handling so students cannot open an unassigned class by URL parameter.

### Validation
- `npx eslint src/pages/StudentDashboardPage.jsx` -> Success
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/pages/StudentDashboardPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- `src/components/StudentLayout.jsx` already filtered sidebar class counts by `courseIds`; the bug was limited to the main student dashboard page content.

## 2026-03-15 - Default Admin Password Change

### Request
- Allow the default admin account to change its password from the `Settings` tab.

### Scope
- `src/stores/useAuthStore.js` default admin credential persistence and update action.
- `src/pages/AdminPage.jsx` settings UI for password change.

### Implemented
- Added persisted `adminCredentials` state with migration fallback to the default `admin / admin1234` account.
- Changed default admin login to use persisted credentials instead of a hardcoded password only.
- Added `changeAdminPassword(currentPassword, newPassword)` to the auth store.
- Added a main-admin-only password change form in `Settings` with current password check, confirmation check, and inline success/error feedback.

### Validation
- `npx eslint src/pages/AdminPage.jsx src/stores/useAuthStore.js` -> Success
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/stores/useAuthStore.js`
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The new settings form changes only the default `admin` account password; sub-admin password management remains in the existing sub-admin management flow.

## 2026-03-15 - Interface Theme Separation

### Request
- Make light mode and dark mode apply as clearly separated interface themes.

### Scope
- `src/index.css` shared theme overrides.
- `src/components/StudentLayout.jsx`, `src/pages/StudentDashboardPage.jsx`, and `src/pages/AdminPage.jsx` root theme shell wiring.

### Implemented
- Added `student-theme-light/dark` and `admin-theme-light/dark` shell classes to the main student/admin app wrappers.
- Added scoped CSS overrides so dark-mode student screens switch card, border, text, and input colors away from the previous light-only palette.
- Added scoped CSS overrides so light-mode admin screens stop rendering as always-dark and use brighter surfaces/text.

### Validation
- `npx eslint src/pages/AdminPage.jsx src/pages/StudentDashboardPage.jsx src/components/StudentLayout.jsx` -> Success
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/index.css`
- `src/components/StudentLayout.jsx`
- `src/pages/StudentDashboardPage.jsx`
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The change is implemented as scoped CSS theme-shell overrides so existing page structures remain intact without large JSX churn across every screen.

## 2026-03-15 - Admin Reflection Light Mode Contrast

### Request
- In admin `Reflection`, make the student-written sentence easier to read in light mode by using a color similar to surrounding text.

### Scope
- `src/pages/AdminPage.jsx` reflection-entry text color only.
- No reflection data or layout changes.

### Implemented
- Changed the reflection body text class from `text-gray-100` to `text-gray-300` in the admin reflection card content.

### Validation
- `npx eslint src/pages/AdminPage.jsx` -> Success

### Files
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- This specifically improves the light-mode contrast inside the admin reflection cards while keeping dark-mode styling compatible with the existing theme-shell overrides.

## 2026-03-15 - Admin Course Progress Detail View

### Request
- Let admins check student progress for each class.
- It could be a new tab or entered by clicking the per-course progress block on the dashboard.

### Scope
- `src/pages/AdminPage.jsx` dashboard course-progress block and a new course progress detail view.
- No progress data model changes were required.

### Implemented
- Made the dashboard per-course progress cards clickable.
- Added `CourseProgressManagement` in the admin page, opened from the dashboard and filtered by selected course.
- Added per-course summary cards for enrolled students, average progress, and fully completed students.
- Added per-student rows with mission completion percentage, completed stages count, and stage-by-stage completion chips.
- Restricted the detail view to accessible courses for sub-admins.

### Validation
- `npx eslint src/pages/AdminPage.jsx` -> Success
- `npm run build` -> Sandbox failed (`spawn EPERM`), escalated success

### Files
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The course progress detail view is currently an internal admin view entered from the dashboard course-progress section, not a dedicated sidebar menu item.

## 2026-03-15 - Course Progress Dropdown Theme Fix

### Request
- In `Course Progress`, make the course selection dropdown readable in both light and dark themes.

### Scope
- `src/pages/AdminPage.jsx` course-progress course selector only.
- No data or layout changes beyond dropdown theming.

### Implemented
- Wired `CourseProgressManagement` to the current theme state.
- Changed the course `<select>` and `<option>` styles to use light text/background in dark mode and dark text/background in light mode.

### Validation
- `npx eslint src/pages/AdminPage.jsx` -> Success

### Files
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The fix is localized to the admin course-progress selector and does not change other admin dropdowns.

## 2026-03-12 - Fix Unassigned Class Visibility Bug

### Request
- 특정 class에 등록하지 않은 학생으로 로그인했을 때 모든 class가 보이는 버그 수정.

### Scope
- src/pages/StudentDashboardPage.jsx

### Implemented
- 전체 courses 대신 학생의 user.courseIds 에 포함된 수업만 필터링하는 myCourses 로직 적용.
- 사이드바 갯수, 대시보드 갯수, 랭킹, My Class 탭 등 표시 영역 전반에 myCourses 렌더링하도록 수정.

### Validation
- 코드 구조 검증 및 React 렌더링 로직 확인 -> 이상 없음

### Files
- src/pages/StudentDashboardPage.jsx

### Notes
- None.

## 2026-03-15 - Learners Dropdown Theme Fix

### Request
- In the admin `Learners` tab, make the dropdown readable in light mode instead of rendering as black.

### Scope
- `src/pages/AdminPage.jsx` learners filter dropdown styling only.
- No data, filtering behavior, or layout changes.

### Implemented
- Wired `LearnersManagement` to the current theme state.
- Updated the `Year` and `Grade` `<select>` controls to use light-mode and dark-mode specific text/background/border styles.
- Updated the dropdown `<option>` styles so opened menus remain readable in both themes.

### Validation
- `npx eslint src/pages/AdminPage.jsx` -> Success

### Files
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The fix mirrors the earlier `Course Progress` dropdown theme handling to keep admin select styling consistent.

## 2026-03-15 - Reflection Dropdown Theme Fix

### Request
- In the admin `Reflection` tab, make the course dropdown readable in both light and dark themes.

### Scope
- `src/pages/AdminPage.jsx` reflection course selector styling only.
- No reflection data or layout changes.

### Implemented
- Wired `ReflectionManagement` to the current theme state.
- Updated the reflection course `<select>` to use theme-specific border, background, and text colors.
- Updated the dropdown `<option>` styles so the opened menu remains readable in light mode as well.

### Validation
- `npx eslint src/pages/AdminPage.jsx` -> Success

### Files
- `src/pages/AdminPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The reflection selector now follows the same theme-handling pattern as the admin `Course Progress` and `Learners` dropdowns.

## 2026-03-15 - Reflection Modal Contrast Fix

### Request
- Make the popup shown when writing a reflection easier to read.
- Change the popup text to black and add visible line borders.

### Scope
- `src/pages/StudentDashboardPage.jsx` student reflection modal styling only.
- No reflection save logic or flow changes.

### Implemented
- Added a visible border and white background styling to the reflection modal container.
- Changed the modal helper text and counter text to darker slate colors for readability.
- Strengthened the textarea border and changed the input text/placeholder contrast for clearer separation.

### Validation
- `npx eslint src/pages/StudentDashboardPage.jsx` -> Success

### Files
- `src/pages/StudentDashboardPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The update targets the mission-completion reflection popup shown on the student page.

## 2026-03-15 - Video Quiz Action Button Contrast Fix

### Request
- In `video&quiz` stages, make the `Submit` and `Claim Star` text readable under the current theme.

### Scope
- `src/pages/StudentDashboardPage.jsx` video/quiz mission action button styling only.
- No quiz logic or completion rules changed.

### Implemented
- Added explicit readable text/background styling to the `Take Quiz`, `Complete Mission`, `Next`, `Submit`, `Claim Star`, and `Restart Quiz` buttons in `VideoView`.
- Kept button states and handlers unchanged while preventing theme-dependent text visibility issues.

### Validation
- `npx eslint src/pages/StudentDashboardPage.jsx` -> Success

### Files
- `src/pages/StudentDashboardPage.jsx`
- `ANTIGRAVITY_WORKLOG.md`

### Notes
- The fix is localized to the student `VideoView` mission flow where HeroUI button defaults were not consistently readable across themes.
