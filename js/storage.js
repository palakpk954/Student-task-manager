/**
 * Student Task Manager - Storage Module (Data Access Layer)
 * Implements TaskRepository for localStorage persistence, PWA storage,
 * JSON Export/Import, iCal generation, and Streak tracking.
 */

const STORAGE_KEY = 'student_task_manager_tasks_v2';
const THEME_KEY = 'student_task_manager_theme_v2';
const STREAK_KEY = 'student_task_manager_streak_v2';

// Rich sample tasks showcasing courses, types, subtasks, time estimates
const DEFAULT_SAMPLE_TASKS = () => {
  const today = new Date();
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 5);

  return [
    {
      id: 'task-sample-1',
      title: 'Submit Operating Systems Lab 3 Benchmark',
      description: 'Analyze thread scheduling benchmarks and graph latency percentiles.',
      dueDate: formatDate(today),
      priority: 'High',
      course: 'CS 301',
      taskType: 'Assignment',
      estimatedMinutes: 90,
      completed: false,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000,
      completedAt: null,
      subtasks: [
        { id: 'st-1-1', title: 'Run benchmark script on Linux VM', completed: true },
        { id: 'st-1-2', title: 'Plot bar chart of execution times', completed: true },
        { id: 'st-1-3', title: 'Write 2-page discussion summary', completed: false }
      ]
    },
    {
      id: 'task-sample-2',
      title: 'Calculus III Midterm Exam Review',
      description: 'Covers Green Theorem, Stokes Theorem, and divergence theorem.',
      dueDate: formatDate(tomorrow),
      priority: 'High',
      course: 'MATH 240',
      taskType: 'Exam',
      estimatedMinutes: 120,
      completed: false,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      completedAt: null,
      subtasks: [
        { id: 'st-2-1', title: 'Solve 2024 practice exam', completed: false },
        { id: 'st-2-2', title: 'Review formula cheat sheet', completed: false }
      ]
    },
    {
      id: 'task-sample-3',
      title: 'Physics Chapter 8: Fluid Dynamics Reading',
      description: 'Read pages 210-245 on Bernoulli equation and viscosity.',
      dueDate: formatDate(dayAfterTomorrow),
      priority: 'Medium',
      course: 'PHYS 150',
      taskType: 'Reading',
      estimatedMinutes: 45,
      completed: false,
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 3,
      completedAt: null,
      subtasks: [
        { id: 'st-3-1', title: 'Highlight key definitions', completed: true },
        { id: 'st-3-2', title: 'Complete conceptual review questions', completed: false }
      ]
    },
    {
      id: 'task-sample-4',
      title: 'Thermodynamics Homework 4 (Overdue)',
      description: 'Solve questions 1 through 10 from Chapter 6.',
      dueDate: formatDate(yesterday),
      priority: 'High',
      course: 'PHYS 150',
      taskType: 'Assignment',
      estimatedMinutes: 60,
      completed: false,
      createdAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 4,
      completedAt: null,
      subtasks: [
        { id: 'st-4-1', title: 'Problems 1-5', completed: true },
        { id: 'st-4-2', title: 'Problems 6-10', completed: false }
      ]
    },
    {
      id: 'task-sample-5',
      title: 'AI Ethics Project Presentation Slides',
      description: 'Prepare 10-minute slide deck on algorithmic bias in admissions.',
      dueDate: formatDate(nextWeek),
      priority: 'Medium',
      course: 'PHIL 210',
      taskType: 'Project',
      estimatedMinutes: 150,
      completed: false,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000,
      completedAt: null,
      subtasks: [
        { id: 'st-5-1', title: 'Draft slide outline', completed: true },
        { id: 'st-5-2', title: 'Find 3 real-world case studies', completed: false }
      ]
    },
    {
      id: 'task-sample-6',
      title: 'Register for Spring Semester Electives',
      description: 'Signed up for Cloud Systems and Distributed Computing.',
      dueDate: formatDate(today),
      priority: 'Low',
      course: 'General',
      taskType: 'Quiz',
      estimatedMinutes: 20,
      completed: true,
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 1,
      completedAt: Date.now() - 86400000 * 1,
      subtasks: []
    }
  ];
};

export class TaskRepository {
  static getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Check v1 storage to migrate if available
        const v1Data = localStorage.getItem('student_task_manager_tasks_v1');
        let initialTasks;
        if (v1Data) {
          try {
            initialTasks = JSON.parse(v1Data);
            // Upgrade items to v2 fields
            initialTasks = initialTasks.map(t => ({
              ...t,
              course: t.course || 'General',
              taskType: t.taskType || 'Assignment',
              estimatedMinutes: t.estimatedMinutes || 30,
              subtasks: t.subtasks || []
            }));
          } catch (e) {
            initialTasks = DEFAULT_SAMPLE_TASKS();
          }
        } else {
          initialTasks = DEFAULT_SAMPLE_TASKS();
        }
        this.saveTasks(initialTasks);
        return initialTasks;
      }
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Error reading tasks from localStorage:', err);
      return [];
    }
  }

  static saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (err) {
      console.error('Error saving tasks to localStorage:', err);
      return false;
    }
  }

  static getTaskById(id) {
    const tasks = this.getTasks();
    return tasks.find(t => t.id === id) || null;
  }

  static addTask(taskData) {
    const tasks = this.getTasks();
    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: taskData.title.trim(),
      description: (taskData.description || '').trim(),
      dueDate: taskData.dueDate,
      priority: taskData.priority || 'Medium',
      course: (taskData.course || 'General').trim(),
      taskType: taskData.taskType || 'Assignment',
      estimatedMinutes: parseInt(taskData.estimatedMinutes, 10) || 30,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: null,
      subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks : []
    };

    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  }

  static updateTask(id, updates) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    const current = tasks[index];
    const isNowCompleted = updates.completed !== undefined ? updates.completed : current.completed;
    let completedAt = current.completedAt;

    if (isNowCompleted && !current.completed) {
      completedAt = Date.now();
      this.recordStreakCompletion();
    } else if (!isNowCompleted && current.completed) {
      completedAt = null;
    }

    const updatedTask = {
      ...current,
      ...updates,
      title: updates.title !== undefined ? updates.title.trim() : current.title,
      description: updates.description !== undefined ? updates.description.trim() : current.description,
      course: updates.course !== undefined ? updates.course.trim() : current.course,
      taskType: updates.taskType !== undefined ? updates.taskType : current.taskType,
      estimatedMinutes: updates.estimatedMinutes !== undefined ? parseInt(updates.estimatedMinutes, 10) : current.estimatedMinutes,
      subtasks: updates.subtasks !== undefined ? updates.subtasks : current.subtasks,
      completed: isNowCompleted,
      completedAt: completedAt,
      updatedAt: Date.now()
    };

    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  static deleteTask(id) {
    const tasks = this.getTasks();
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return null;

    const filtered = tasks.filter(t => t.id !== id);
    this.saveTasks(filtered);
    return taskToDelete;
  }

  static restoreTask(task) {
    const tasks = this.getTasks();
    tasks.unshift(task);
    this.saveTasks(tasks);
    return task;
  }

  static reorderTasks(tasks) {
    this.saveTasks(tasks);
  }

  // --- Study Streak Tracking (Phase 4) ---

  static getStreakData() {
    try {
      const data = localStorage.getItem(STREAK_KEY);
      if (!data) return { currentStreak: 3, lastCompletedDate: null };
      return JSON.parse(data);
    } catch (e) {
      return { currentStreak: 3, lastCompletedDate: null };
    }
  }

  static recordStreakCompletion() {
    const today = new Date().toISOString().split('T')[0];
    const data = this.getStreakData();

    if (data.lastCompletedDate === today) {
      return; // Already counted today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (data.lastCompletedDate === yesterdayStr) {
      newStreak = (data.currentStreak || 0) + 1;
    } else if (data.lastCompletedDate) {
      newStreak = 1;
    } else {
      newStreak = Math.max(1, data.currentStreak || 1);
    }

    const updated = { currentStreak: newStreak, lastCompletedDate: today };
    localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
  }

  // --- JSON Export and Import (Phase 5) ---

  static exportAsJSON() {
    const tasks = this.getTasks();
    const streak = this.getStreakData();
    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks,
      streak
    };
    return JSON.stringify(exportData, null, 2);
  }

  static importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid JSON format: missing tasks array');
      }

      // Merge or replace tasks with ID sanitation
      const validTasks = parsed.tasks.filter(t => t && t.title && t.dueDate);
      if (validTasks.length === 0) {
        throw new Error('No valid tasks found in imported file.');
      }

      this.saveTasks(validTasks);
      if (parsed.streak) {
        localStorage.setItem(STREAK_KEY, JSON.stringify(parsed.streak));
      }
      return validTasks;
    } catch (err) {
      console.error('Import failed:', err);
      throw err;
    }
  }

  // --- Calendar & iCal Export / Google Calendar (Phase 6) ---

  static generateIcsCalendar(tasks) {
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Student Task Manager//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    tasks.forEach(task => {
      if (!task.dueDate) return;
      const cleanDate = task.dueDate.replace(/-/g, '');
      const uid = (task.id || Math.random().toString(36).substr(2)) + '@studenttaskmanager.local';
      const cleanTitle = (task.title || 'Task').replace(/[,;\\]/g, ' ');
      const cleanDesc = ((task.course ? `[${task.course}] ` : '') + (task.description || '')).replace(/[,;\\]/g, ' ');

      ics.push('BEGIN:VEVENT');
      ics.push(`UID:${uid}`);
      ics.push(`DTSTAMP:${cleanDate}T090000Z`);
      ics.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      ics.push(`DTEND;VALUE=DATE:${cleanDate}`);
      ics.push(`SUMMARY:${cleanTitle}`);
      ics.push(`DESCRIPTION:${cleanDesc}`);
      ics.push(`STATUS:${task.completed ? 'COMPLETED' : 'CONFIRMED'}`);
      ics.push('END:VEVENT');
    });

    ics.push('END:VCALENDAR');
    return ics.join('\r\n');
  }

  static getGoogleCalendarUrl(task) {
    if (!task.dueDate) return '#';
    const cleanDate = task.dueDate.replace(/-/g, '');
    const title = encodeURIComponent(`[${task.course || 'Student'}] ${task.title}`);
    const details = encodeURIComponent(`${task.description || ''}\nPriority: ${task.priority}\nType: ${task.taskType || 'Assignment'}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}/${cleanDate}&details=${details}`;
  }

  // --- Theme Management ---

  static getTheme() {
    return localStorage.getItem(THEME_KEY) || 'system';
  }

  static setTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Unable to save theme preference', e);
    }
  }
}
