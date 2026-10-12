# Student Task Manager — Product Requirements Document

Oct 12, 2026 · @palak

## 1. Overview

Student Task Manager is a responsive web app that lets students capture, organize, and track their academic tasks in one place, on any device.

**Problem.** Students juggle assignments, exams, readings, and projects across several courses. Deadlines live in scattered notes, chat threads, and memory, so tasks get missed and priorities are unclear.

**Vision.** A fast, distraction-free task list where a student can add a task in under 15 seconds, see what is due and what matters most, and mark work done with one tap.

**Product type:** single-user web application (v1), usable on phones, tablets, and desktops.

## 2. Goals and Success Metrics

v1 succeeds if students can manage a full term's tasks without friction and keep coming back.

**Goals**

- Make task capture fast: a new task takes under 15 seconds.
- Make priorities and deadlines visible at a glance.
- Let students find any task quickly using filters.
- Work equally well on phones, tablets, and desktops.

**Success metrics**

| Metric | Target | How measured |
| --- | --- | --- |
| Time to add a task | ≤ 15 s median | Usability test with 10 students |
| Task completion rate | ≥ 60% of created tasks marked done | App analytics / local counters |
| 7-day return rate | ≥ 40% of new users | Analytics |
| Page load (4G, mid-range phone) | ≤ 2 s to interactive | Lighthouse |
| Lighthouse accessibility score | ≥ 90 | Lighthouse audit |
| Task-flow success (add, edit, complete, delete, filter) | ≥ 90% unassisted | Usability test |

## 3. Target Users

The primary users are high school and university students who manage their own coursework.

| Persona | Context | Main need |
| --- | --- | --- |
| Maya, 20, university sophomore | 5 courses, mostly on laptop, some on phone between classes | See what is due this week and what to do first |
| Daniel, 16, high school junior | Homework, tests, club projects; mostly on phone | Quickly jot down homework and tick it off |
| Priya, 24, graduate student | Long-running research tasks plus coursework | Track priorities and filter by status to stay focused |

## 4. Scope

v1 covers core task management for a single student; collaboration and integrations are deferred.

**In scope (v1)**

- Create, view, edit, and delete tasks
- Title, description, due date, and priority (Low / Medium / High)
- Mark tasks complete and reopen them
- Filter by completion status and by priority
- Sort by due date or priority
- Overdue and due-today indicators
- Responsive layout for mobile, tablet, and desktop
- Persistent storage so tasks survive a page reload

**Out of scope (v1)**

- Multi-user sharing, groups, or team assignments
- Push or email notifications and reminders
- Calendar sync (Google, Outlook) and file attachments
- Native mobile apps
- Recurring tasks and subtasks

## 5. User Stories

| ID | As a student, I want to… | So that… |
| --- | --- | --- |
| US-1 | add a task with a title, description, due date, and priority | I capture everything I need to do |
| US-2 | see all my tasks in a clear list | I know what is on my plate |
| US-3 | edit any detail of a task | I can fix mistakes or adjust when a deadline moves |
| US-4 | delete a task (with confirmation) | I can remove tasks I no longer need |
| US-5 | mark a task complete and undo it | I can track progress and recover from a mis-tap |
| US-6 | filter by completed, pending, or all | I can focus on what is left |
| US-7 | filter by priority | I can tackle the most important work first |
| US-8 | see overdue and due-today tasks highlighted | I do not miss deadlines |
| US-9 | sort tasks by due date or priority | I can plan my day |
| US-10 | use the app comfortably on my phone and laptop | I can manage tasks wherever I am |

## 6. Functional Requirements

Priority key: **P0** = must have for launch, **P1** = should have, **P2** = nice to have.

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-1 | Users can create a task with title (required), description (optional), due date (required), and priority (Low, Medium, High; default Medium). | P0 |
| FR-2 | The task list shows title, due date, priority badge, and completion state for each task; description is visible on expand or in the detail view. | P0 |
| FR-3 | Users can edit all fields of an existing task; changes save immediately and update the list. | P0 |
| FR-4 | Users can delete a task after a confirmation prompt. | P0 |
| FR-5 | Users can mark a task complete or incomplete with one tap; completed tasks show a strikethrough and muted style. | P0 |
| FR-6 | Users can filter by status: All, Pending, Completed. | P0 |
| FR-7 | Users can filter by priority: All, High, Medium, Low. | P0 |
| FR-8 | Status and priority filters combine (for example, High priority and Pending). | P0 |
| FR-9 | Tasks persist across page reloads and browser restarts. | P0 |
| FR-10 | Overdue tasks (past due, not completed) are visually flagged; tasks due today are labeled. | P1 |
| FR-11 | Users can sort by due date (default, soonest first) or by priority (High to Low). | P1 |
| FR-12 | Users can search tasks by title or description text. | P2 |
| FR-13 | The header shows counts: total, pending, completed, overdue. | P2 |
| FR-14 | An empty state explains how to add a first task; a no-results state appears when filters match nothing. | P1 |
| FR-15 | Undo toast after delete or complete for 5 seconds. | P2 |

## 7. Task Data Model

Each task is one record with the fields below.

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| id | string (UUID) | Yes | Generated by the app; never edited |
| title | string | Yes | 1–100 characters, trimmed |
| description | string | No | Up to 500 characters |
| dueDate | date (YYYY-MM-DD) | Yes | Valid date; past dates allowed with a warning |
| priority | enum | Yes | Low, Medium, High; default Medium |
| completed | boolean | Yes | Default false |
| createdAt | timestamp | Yes | Set on creation |
| updatedAt | timestamp | Yes | Updated on every edit |
| completedAt | timestamp | No | Set when marked complete, cleared on reopen |

**Validation.** The form blocks submission with an inline message when the title is empty or the due date is missing or invalid. Whitespace-only titles are rejected.

## 8. UX and Responsive Design

The interface is mobile-first, with one primary screen and a task form.

**Layout by breakpoint**

| Breakpoint | Width | Layout |
| --- | --- | --- |
| Mobile | < 640 px | Single column; filters in a collapsible bar; floating "Add task" button; form opens full screen |
| Tablet | 640–1024 px | Single column with wider cards; filters inline above the list; form opens as a modal |
| Desktop | > 1024 px | Sidebar for filters and counts; task list in main area; form opens as a modal |

**Key interactions**

- Add task: one tap opens the form; Enter submits, Esc cancels.
- Complete: checkbox on each card, tap target at least 44 × 44 px.
- Edit and delete: reachable from each card through an actions menu.
- Priority is shown by color plus a text label (never color alone): High red, Medium amber, Low green.
- Overdue tasks show a red date label and an "Overdue" tag.
- Filter changes update the list instantly, with no page reload.
- Light and dark themes follow the system setting.

## 9. Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Performance | Interactive in ≤ 2 s on 4G; list updates in ≤ 100 ms for up to 1,000 tasks |
| Accessibility | WCAG 2.1 AA: keyboard navigation, visible focus, labeled form fields, screen-reader announcements for state changes, contrast ratio ≥ 4.5:1 |
| Browser support | Latest two versions of Chrome, Edge, Firefox, and Safari (desktop and mobile) |
| Reliability | No data loss on refresh; graceful message if storage is unavailable or full |
| Security and privacy | All user-entered text is escaped to prevent XSS; no third-party trackers; data stays on the device in v1 |
| Maintainability | Modular components, linted code, unit tests for task logic and filters |
| Offline | Core features work offline once loaded (stretch goal, P2) |

## 10. Technical Approach

v1 is a client-side app that stores tasks in the browser, so it needs no backend or accounts.

| Layer | Recommendation | Why |
| --- | --- | --- |
| Front end | React with Vite (or plain HTML, CSS, and JavaScript for a course project) | Component model suits list, form, and filters |
| Styling | CSS Grid and Flexbox with CSS variables; optionally Tailwind | Responsive layout and easy theming |
| State | React state or a small store; filters derived from the task array | Simple and testable |
| Storage | `localStorage` (JSON array of tasks) in v1 | Zero setup; upgrade path below |
| Testing | Vitest or Jest for logic; Lighthouse and axe for accessibility | Covers the key risks |
| Hosting | Static host such as Netlify, Vercel, or GitHub Pages | Free and simple deploy |

**Upgrade path.** If accounts and cross-device sync are added later, keep the storage behind a small data-access module so `localStorage` can be swapped for a REST API with a database without touching the UI.

## 11. Acceptance Criteria

v1 is accepted when every item below passes.

- [ ] A task with a valid title and due date can be created and appears in the list immediately.
- [ ] Submitting with an empty title or missing due date shows an inline error and saves nothing.
- [ ] Editing a task updates it in the list and persists after reload.
- [ ] Deleting a task requires confirmation and removes it permanently.
- [ ] Marking a task complete shows the completed style; unchecking restores it.
- [ ] The status filter shows only Pending or only Completed tasks as selected.
- [ ] The priority filter shows only tasks of the selected level.
- [ ] Status and priority filters work together and can be reset to All.
- [ ] Overdue tasks are flagged and due-today tasks are labeled.
- [ ] Layout has no horizontal scrolling at 360 px, 768 px, and 1280 px widths.
- [ ] All actions work with keyboard only; Lighthouse accessibility score is 90 or higher.
- [ ] Tasks remain after closing and reopening the browser.

## 12. Release Plan and Milestones

v1 ships in about 6 weeks, in five phases. Durations assume one developer and are adjustable.

1. **Design and setup (week 1):** wireframes for mobile and desktop, project scaffold, data model, and storage module.
2. **Core CRUD (weeks 2–3):** add, view, edit, and delete tasks with validation and persistence (FR-1 to FR-4, FR-9).
3. **Completion and filters (week 4):** complete toggle, status and priority filters, combined filtering (FR-5 to FR-8).
4. **Polish and responsiveness (week 5):** overdue flags, sorting, empty states, breakpoints, dark theme, accessibility fixes (FR-10, FR-11, FR-14).
5. **Testing and launch (week 6):** usability test with 5–10 students, cross-browser checks, Lighthouse audit, deploy to a static host.

## 13. Risks, Assumptions, and Roadmap

The main risk is data loss, because v1 stores tasks only in the user's browser.

**Risks**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Browser data cleared or device changed | Tasks lost | Add JSON export and import in v1.1; warn users in the empty state |
| Feature creep delays launch | Missed timeline | Hold P2 items until P0 and P1 pass acceptance |
| Poor mobile usability | Low adoption | Mobile-first build; test on real phones in week 5 |
| Accessibility gaps | Excludes users | Audit with axe and Lighthouse each phase |

**Assumptions**

- Single user per browser; no login in v1.
- Dates use the user's local time zone.
- English only in v1.

**Open questions**

- Should tasks have a course or subject tag in v1, or wait for v2?
- Is JSON export and import needed at launch rather than v1.1?
- Which stack is required: framework-free JavaScript or React?

**Future roadmap**

- v1.1: export and import, search, task counts, undo.
- v2: accounts and cloud sync, course tags, recurring tasks, subtasks.
- v3: reminders and notifications, calendar sync, shared study groups.
