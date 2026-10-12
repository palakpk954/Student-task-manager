# STask — Minimal Academic Task Manager

STask is a clean, minimal, distraction-free web application engineered for students to capture, organize, and excel in their coursework. Built with vanilla HTML5, CSS3 with a warm mocha aesthetic, ES6 JavaScript modules, and localStorage persistence.

![Status](https://img.shields.io/badge/Status-Complete-success?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Installable%20%26%20Offline-blueviolet?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Design](https://img.shields.io/badge/Design-Warm%20Mocha%20Palette-8B5A2B?style=flat-square)

---

## Welcome Screen and First Page

When opening STask, users are greeted by the minimalist **Welcome to STask** landing view:
- Clean typographic hero presentation introducing the workspace.
- One-click access to the main tasks view or authentication portal.
- Overview of core capabilities: Quick Capture, Interactive Calendar, and Focus Timer.
- Clean vector icons with zero emoji distractions.

---

## Features

### Phase 1: Core Foundation
1. **Fast Task Capture**: Add tasks with title, description, due date, and priority.
2. **Task Feed**: Clear, responsive task list view.
3. **Live Editing**: Edit any field in real-time.
4. **Safe Deletion**: Non-native accessible confirmation dialog.
5. **Completion Toggle**: Clean checkbox with smooth status transition and strikethrough.
6. **Status Filters**: All, Pending, Completed.
7. **Priority Filters**: All, High, Medium, Low.
8. **Multi-Criteria Filtering**: Combine status, priority, course, and date filters simultaneously.
9. **Local Persistence**: Browser localStorage abstraction surviving restarts.
10. **Form Validation**: Required title and due date validation with clean inline alerts.
11. **Responsive Layout**: Seamless performance across mobile, tablet, and desktop viewports.

### Phase 2: Polish
12. **Deadline Highlights**: Distinct flags for Overdue tasks and Due Today labels.
13. **Flexible Sorting**: Sort by Due Date (Soonest/Furthest), Priority, Estimated Time, or Course Name.
14. **Empty States**: Minimal onboarding guidance and no-results search/filter empty states.
15. **Dark and Light Modes**: Warm linen/cream in light mode and deep roasted mocha in dark mode.
16. **Header Statistics**: Real-time counters for Total, Pending, Completed, and Overdue tasks.

### Phase 3: Productivity Tools
17. **Instant Search**: Live debounced search across task titles, descriptions, and courses.
18. **5-Second Undo Toast**: Floating notification permitting 1-click recovery for completions and deletions.
19. **Course and Subject Tags**: Categorize tasks by course (e.g., CS 301, MATH 240) with dynamic filter pills.
20. **Keyboard Shortcuts**:
    - `N`: Quick-add new task
    - `/`: Focus search bar
    - `Esc`: Close any open modal
    - `Enter`: Submit active form
    - `?`: View shortcuts cheat sheet
21. **Progress Bar**: Live completion meter (`X of Y tasks completed (Z%)`) with dynamic gradient fill.

### Phase 4: Student-Specific Features
22. **Due Soon Quick Filters**: 1-click filtering for Due Today, Tomorrow, and This Week.
23. **Task Types**: Minimal pills with clean labels: Assignment, Exam, Reading, Project, Quiz.
24. **Time Estimates**: Estimated study duration per task (e.g., 45 min, 120 min).
25. **Subtasks and Checklists**: Interactive step-by-step checklist inside tasks with live counter.
26. **Study Streak Tracker**: Daily study streak counter to encourage consistency.
27. **Weekly Activity Chart**: Interactive Mon–Sun bar chart comparing completed vs pending tasks.

### Phase 5: Data and Reliability
28. **JSON Export and Import**: Backup your tasks to JSON and restore anytime.
29. **PWA and Offline Support**: Web App Manifest (`manifest.json`) and service worker (`sw.js`) for full offline availability.
30. **Drag-and-Drop Reordering**: Rearrange task priority intuitively with HTML5 drag-and-drop.

### Phase 6: Interactive Tools
31. **Interactive Calendar View**: Full month grid displaying task chips, day navigation, and click-to-add on any date.
32. **Browser Notifications**: Desktop Notification API alerts for tasks due today.
33. **Built-in Pomodoro Timer**: Clean focus timer (25m Focus / 5m Break / 15m Long Break) with Web Audio chime, linked directly to individual tasks.
34. **Calendar Sync and .ics Export**:
    - 1-click Add to Google Calendar button on every task.
    - Export all tasks to `.ics` format for Apple Calendar, Outlook, and Google Calendar.
35. **Syllabus Parser**: Paste syllabus text or course announcements to automatically parse course codes, dates, and titles with 1-click bulk import.

### Phase 7: Authentication and Accounts
36. **User Registration and Login**: Full Name, Email, Password, and Field of Study.
37. **Client-Side Security**: Web Crypto SHA-256 password hashing; passwords never stored in plain text.
38. **User Profile**: Initials avatar and dropdown menu with student details and logout.
39. **Per-User Data Isolation**: Each student user has their own isolated workspace, tasks, and streaks.
40. **1-Click Demo Login**: Built-in demo student profile (Maya Lin) to explore all features instantly.

---

## Tech Stack and Architecture

- **Markup**: Semantic HTML5 with ARIA landmark roles and accessibility compliance.
- **Styling**: Vanilla CSS3 using custom properties, Flexbox/Grid, and minimal animations.
- **Logic**: ES6+ JavaScript modules (`storage.js`, `state.js`, `auth.js`, `ui.js`, `app.js`).
- **Offline**: PWA Manifest & Service Worker Cache.

---

## Running Locally

```bash
# Using Python
python -m http.server 3000

# Using Node.js
npx serve .
```

Open `http://localhost:3000` in your web browser.
