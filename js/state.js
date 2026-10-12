/**
 * Student Task Manager - State Management
 * Holds reactive state, multi-criteria filtering, sorting, subtasks,
 * weekly statistics, drag-reorder, and undo manager.
 */

import { TaskRepository } from './storage.js';

export class AppState {
  constructor() {
    this.tasks = [];
    this.filters = {
      status: 'all',     // 'all' | 'pending' | 'completed'
      priority: 'all',   // 'all' | 'high' | 'medium' | 'low'
      course: 'all',     // 'all' | specific course name
      taskType: 'all',   // 'all' | 'Assignment' | 'Exam' | 'Reading' | 'Project' | 'Quiz'
      dueSoon: 'all',    // 'all' | 'today' | 'tomorrow' | 'week'
      search: ''
    };
    this.sortBy = 'due-asc'; // 'due-asc' | 'due-desc' | 'priority' | 'created' | 'time-asc' | 'course'
    this.activeView = 'list'; // 'list' | 'calendar' | 'summary'
    this.subscribers = [];
    this.undoAction = null;
    this.undoTimer = null;
  }

  init() {
    this.tasks = TaskRepository.getTasks();
    window.addEventListener('app:auth-changed', () => {
      this.tasks = TaskRepository.getTasks();
      this.notify();
    });
    this.notify();
  }

  subscribe(listener) {
    this.subscribers.push(listener);
    return () => {
      this.subscribers = this.subscribers.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.subscribers) {
      try {
        listener(this);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    }
  }

  // --- Views ---

  setView(viewName) {
    this.activeView = viewName;
    this.notify();
  }

  // --- Filtering & Sorting ---

  setFilter(type, value) {
    if (this.filters[type] !== value) {
      this.filters[type] = value;
      this.notify();
    }
  }

  setSort(sortBy) {
    if (this.sortBy !== sortBy) {
      this.sortBy = sortBy;
      this.notify();
    }
  }

  setSearch(query) {
    this.filters.search = query.trim().toLowerCase();
    this.notify();
  }

  resetFilters() {
    this.filters.status = 'all';
    this.filters.priority = 'all';
    this.filters.course = 'all';
    this.filters.taskType = 'all';
    this.filters.dueSoon = 'all';
    this.filters.search = '';
    this.notify();
  }

  // --- Date Helpers ---

  static getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static getTomorrowString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static getEndOfWeekString() {
    const d = new Date();
    const dayOfWeek = d.getDay() || 7; // Sunday is 7
    d.setDate(d.getDate() + (7 - dayOfWeek));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isOverdue(task) {
    if (task.completed) return false;
    const todayStr = AppState.getTodayString();
    return task.dueDate < todayStr;
  }

  isDueToday(task) {
    const todayStr = AppState.getTodayString();
    return task.dueDate === todayStr;
  }

  // --- Courses List ---

  getUniqueCourses() {
    const courses = new Set();
    this.tasks.forEach(t => {
      if (t.course && t.course.trim()) {
        courses.add(t.course.trim());
      }
    });
    return Array.from(courses).sort();
  }

  // --- Metrics & Progress ---

  getMetrics() {
    const total = this.tasks.length;
    let pending = 0;
    let completed = 0;
    let overdue = 0;

    for (const task of this.tasks) {
      if (task.completed) {
        completed++;
      } else {
        pending++;
        if (this.isOverdue(task)) {
          overdue++;
        }
      }
    }

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const streak = TaskRepository.getStreakData().currentStreak || 0;

    return { total, pending, completed, overdue, percentage, streak };
  }

  // --- Weekly Activity Data for Summary Bar Chart ---

  getWeeklyStats() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const totalPending = [0, 0, 0, 0, 0, 0, 0];

    // Find Monday of the current week
    const now = new Date();
    const currentDay = now.getDay() || 7; // Mon is 1, Sun is 7
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDay + 1);
    monday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];

      this.tasks.forEach(t => {
        if (t.dueDate === dateStr) {
          if (t.completed) {
            counts[i]++;
          } else {
            totalPending[i]++;
          }
        }
      });
    }

    return { days, counts, totalPending };
  }

  // --- Filtered & Sorted Tasks Query ---

  getFilteredTasks() {
    const { status, priority, course, taskType, dueSoon, search } = this.filters;
    const todayStr = AppState.getTodayString();
    const tomorrowStr = AppState.getTomorrowString();
    const endOfWeekStr = AppState.getEndOfWeekString();

    const priorityWeight = {
      'High': 3,
      'Medium': 2,
      'Low': 1
    };

    return this.tasks
      .filter(task => {
        // Status filter
        if (status === 'pending' && task.completed) return false;
        if (status === 'completed' && !task.completed) return false;

        // Priority filter
        if (priority !== 'all' && task.priority.toLowerCase() !== priority.toLowerCase()) return false;

        // Course filter
        if (course !== 'all' && task.course !== course) return false;

        // Task Type filter
        if (taskType !== 'all' && (task.taskType || 'Assignment').toLowerCase() !== taskType.toLowerCase()) return false;

        // Due Soon filter
        if (dueSoon === 'today' && task.dueDate !== todayStr) return false;
        if (dueSoon === 'tomorrow' && task.dueDate !== tomorrowStr) return false;
        if (dueSoon === 'week' && (task.dueDate < todayStr || task.dueDate > endOfWeekStr)) return false;

        // Search text filter
        if (search) {
          const matchTitle = task.title.toLowerCase().includes(search);
          const matchDesc = task.description && task.description.toLowerCase().includes(search);
          const matchCourse = task.course && task.course.toLowerCase().includes(search);
          if (!matchTitle && !matchDesc && !matchCourse) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (this.sortBy) {
          case 'due-asc':
            if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
            return priorityWeight[b.priority] - priorityWeight[a.priority];

          case 'due-desc':
            if (a.dueDate !== b.dueDate) return b.dueDate.localeCompare(a.dueDate);
            return priorityWeight[b.priority] - priorityWeight[a.priority];

          case 'priority':
            const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
            if (diff !== 0) return diff;
            return a.dueDate.localeCompare(b.dueDate);

          case 'time-asc':
            return (a.estimatedMinutes || 30) - (b.estimatedMinutes || 30);

          case 'course':
            return (a.course || '').localeCompare(b.course || '');

          case 'created':
            return b.createdAt - a.createdAt;

          default:
            return 0;
        }
      });
  }

  // --- CRUD Mutations with Undo Support ---

  addTask(taskData) {
    const created = TaskRepository.addTask(taskData);
    if (created) {
      this.tasks.unshift(created);
      this.notify();
    }
    return created;
  }

  updateTask(id, updates) {
    const updated = TaskRepository.updateTask(id, updates);
    if (updated) {
      const idx = this.tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        this.tasks[idx] = updated;
        this.notify();
      }
    }
    return updated;
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;

    const previousState = task.completed;
    const updated = this.updateTask(id, { completed: !previousState });

    // Set Undo Toast Action
    this.setUndoAction({
      message: updated.completed ? `Task marked as completed! 🔥` : `Task reopened`,
      execute: () => {
        this.updateTask(id, { completed: previousState });
      }
    });

    return updated;
  }

  toggleSubtask(taskId, subtaskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return;

    const updatedSubtasks = task.subtasks.map(st => {
      if (st.id === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    this.updateTask(taskId, { subtasks: updatedSubtasks });
  }

  addSubtask(taskId, title) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !title.trim()) return;

    const newSubtask = {
      id: 'st-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: title.trim(),
      completed: false
    };

    const subtasks = [...(task.subtasks || []), newSubtask];
    this.updateTask(taskId, { subtasks });
  }

  deleteSubtask(taskId, subtaskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return;

    const subtasks = task.subtasks.filter(st => st.id !== subtaskId);
    this.updateTask(taskId, { subtasks });
  }

  deleteTask(id) {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;

    const deletedTask = TaskRepository.deleteTask(id);
    if (deletedTask) {
      this.tasks.splice(taskIndex, 1);
      this.notify();

      // Undo Action for deletion
      this.setUndoAction({
        message: `Task "${deletedTask.title.slice(0, 30)}${deletedTask.title.length > 30 ? '...' : ''}" deleted`,
        execute: () => {
          TaskRepository.restoreTask(deletedTask);
          this.tasks.splice(taskIndex, 0, deletedTask);
          this.notify();
        }
      });
    }

    return deletedTask;
  }

  reorderTasks(draggedId, targetId) {
    const fromIdx = this.tasks.findIndex(t => t.id === draggedId);
    const toIdx = this.tasks.findIndex(t => t.id === targetId);

    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const [moved] = this.tasks.splice(fromIdx, 1);
    this.tasks.splice(toIdx, 0, moved);

    TaskRepository.reorderTasks(this.tasks);
    this.notify();
  }

  // --- Undo Manager (FR-15: 5s toast) ---

  setUndoAction({ message, execute }) {
    if (this.undoTimer) {
      clearTimeout(this.undoTimer);
    }

    this.undoAction = { message, execute };

    window.dispatchEvent(new CustomEvent('app:show-toast', {
      detail: {
        message,
        actionLabel: 'Undo',
        duration: 5000,
        onAction: () => {
          if (this.undoAction && this.undoAction.execute) {
            this.undoAction.execute();
            this.clearUndoAction();
          }
        }
      }
    }));

    this.undoTimer = setTimeout(() => {
      this.clearUndoAction();
    }, 5000);
  }

  clearUndoAction() {
    if (this.undoTimer) {
      clearTimeout(this.undoTimer);
      this.undoTimer = null;
    }
    this.undoAction = null;
  }
}

export const appState = new AppState();
