# 🎓 Student Task Manager

A fast, distraction-free, and responsive web application designed for students to capture, organize, and track academic coursework, exams, and milestones in one place.

Built with semantic HTML5, modern vanilla CSS with warm mocha/brown aesthetics, ES6 JavaScript modules, and localStorage persistence.

![Student Task Manager](https://img.shields.io/badge/Status-Complete-success?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-8B5A2B?style=flat-square)

---

## ✨ Features

- **⚡ Fast Task Capture (< 15 seconds)**: Quickly add tasks with title, due date, priority (Low, Medium, High), and optional notes.
- **🎨 Warm Mocha & Coffee Aesthetic**: Beautiful earthy brown color palette with dark/light mode toggle following system settings or user preference.
- **🔄 Instant Filtering & Search**:
  - Filter by status (**All**, **Pending**, **Completed**).
  - Filter by priority (**All**, **High**, **Medium**, **Low**).
  - Combined multi-criteria filtering.
  - Real-time search across titles and descriptions.
- **📊 Live Header Statistics**: Real-time counter badges for **Total**, **Pending**, **Completed**, and **Overdue** tasks.
- **⏰ Smart Deadline Indicators**: Automatic highlights for **Overdue** items and tasks **Due Today**.
- **↩️ 5-Second Undo Toast**: Mis-tapped a checkbox or deleted a task by mistake? Recover it instantly with the floating Undo toast.
- **💾 Local Persistence**: Zero-setup storage via `localStorage` keeping your tasks saved across refreshes and browser restarts.
- **📱 Fully Responsive**:
  - **Desktop (>1024px)**: Dual-pane layout with filter sidebar and task feed.
  - **Tablet (640px–1024px)**: Inline horizontal filter strip with centered modals.
  - **Mobile (<640px)**: Bottom floating action button (FAB), bottom modal sheets, and ≥44px touch targets.
- **♿ WCAG 2.1 AA Accessibility**: Visible focus states, keyboard shortcuts (`Esc` to dismiss dialogs, `Enter` to submit), and ARIA attributes.

---

## 🚀 Getting Started

No build tools, bundlers, or package installations required!

### Option 1: Direct Local File
Open `index.html` in any modern web browser:
```bash
# Windows
start index.html
```

### Option 2: Local HTTP Server (Recommended for ES Modules)
```bash
# Using Python
python -m http.server 3000

# Using Node.js npx
npx serve .
```
Then navigate to `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```text
Student-task-manager/
├── index.html                                        # Semantic markup & accessible modal containers
├── css/
│   └── styles.css                                    # Brownish design tokens, keyframe animations, & responsive styles
├── js/
│   ├── app.js                                        # Main entry point & initialization
│   ├── storage.js                                    # Data access layer & localStorage repository
│   ├── state.js                                      # Reactive state, sorting, filtering, & undo engine
│   └── ui.js                                         # DOM rendering, accessible modals, & toast notifications
├── Student Task Manager — Product Requirements Document.md # Full product requirements specification
├── .gitignore
└── README.md
```

---

## 🛠️ Data Model

```typescript
interface Task {
  id: string;               // Unique ID
  title: string;            // 1–100 characters (trimmed)
  description?: string;     // Up to 500 characters
  dueDate: string;          // YYYY-MM-DD
  priority: 'Low' | 'Medium' | 'High'; // Default: 'Medium'
  completed: boolean;       // Default: false
  createdAt: number;        // Timestamp (ms)
  updatedAt: number;        // Timestamp (ms)
  completedAt?: number | null;
}
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
