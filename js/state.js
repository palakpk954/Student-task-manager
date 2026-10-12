/**
 * Student Task Manager - State Management
 * Holds reactive state, filtering, sorting, statistics, and undo management
 */

import { TaskRepository } from './storage.js';

export class AppState {
  constructor() {
    this.tasks = [];
    this.filters = {
      status: 'all',     // 'all' | 'pending' | 'completed'
      priority: 'all',   // 'all' | 'high' | 'medium' | 'low'
      search: ''
    };
    this.sortBy = 'due-asc'; // 'due-asc' | 'due-desc' | 'priority' | 'created'
    this.subscribers = [];
    this.undoAction = null;
    this.undoTimer = null;
  }

  init() {
    this.tasks = TaskRepository.getTasks();
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

  isOverdue(task) {
    if (task.completed) return false;
    const todayStr = AppState.getTodayString();
    return task.dueDate < todayStr;
  }

  isDueToday(task) {
    const todayStr = AppState.getTodayString();
    return task.dueDate === todayStr;
  }

  // --- Metrics ---

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

    return { total, pending, completed, overdue };
  }

  // --- Filtered & Sorted Tasks Query ---

  getFilteredTasks() {
    const { status, priority, search } = this.filters;
    const todayStr = AppState.getTodayString();

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

        // Search text filter (title or description)
        if (search) {
          const matchTitle = task.title.toLowerCase().includes(search);
          const matchDesc = task.description && task.description.toLowerCase().includes(search);
          if (!matchTitle && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (this.sortBy) {
          case 'due-asc': // Soonest first (overdue & today top)
            if (a.dueDate !== b.dueDate) {
              return a.dueDate.localeCompare(b.dueDate);
            }
            return priorityWeight[b.priority] - priorityWeight[a.priority];

          case 'due-desc': // Furthest first
            if (a.dueDate !== b.dueDate) {
              return b.dueDate.localeCompare(a.dueDate);
            }
            return priorityWeight[b.priority] - priorityWeight[a.priority];

          case 'priority': // High to Low
            const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
            if (diff !== 0) return diff;
            return a.dueDate.localeCompare(b.dueDate);

          case 'created': // Recently created
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
      message: updated.completed ? `Task marked as completed` : `Task reopened`,
      execute: () => {
        this.updateTask(id, { completed: previousState });
      }
    });

    return updated;
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

  // --- Undo Manager (FR-15: 5 seconds toast) ---

  setUndoAction({ message, execute }) {
    if (this.undoTimer) {
      clearTimeout(this.undoTimer);
    }

    this.undoAction = { message, execute };

    // Emit event for toast
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
