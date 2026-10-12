/**
 * Student Task Manager - Storage Module (Data Access Layer)
 * Implements TaskRepository for localStorage persistence
 */

const STORAGE_KEY = 'student_task_manager_tasks_v1';
const THEME_KEY = 'student_task_manager_theme_v1';

// Sample starter tasks for new students to demonstrate all states
const DEFAULT_SAMPLE_TASKS = () => {
  const today = new Date();
  const formatDate = (date) => date.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 5);

  return [
    {
      id: crypto.randomUUID ? crypto.randomUUID() : 'task-sample-1',
      title: 'Submit Operating Systems Lab Report',
      description: 'Finish Section 3 benchmark analysis and submit PDF to Canvas portal.',
      dueDate: formatDate(today),
      priority: 'High',
      completed: false,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000,
      completedAt: null
    },
    {
      id: crypto.randomUUID ? crypto.randomUUID() : 'task-sample-2',
      title: 'Review Calculus III Chapter 4 Notes',
      description: 'Focus on multi-variable integration techniques and practice problem set 4.2.',
      dueDate: formatDate(tomorrow),
      priority: 'Medium',
      completed: false,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      completedAt: null
    },
    {
      id: crypto.randomUUID ? crypto.randomUUID() : 'task-sample-3',
      title: 'Physics Homework 2: Thermodynamics',
      description: 'Solve questions 1 through 10 from Chapter 6.',
      dueDate: formatDate(yesterday),
      priority: 'High',
      completed: false,
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 3,
      completedAt: null
    },
    {
      id: crypto.randomUUID ? crypto.randomUUID() : 'task-sample-4',
      title: 'Register for Spring Semester Electives',
      description: 'Sign up for AI Ethics and Cloud Computing before seats fill up.',
      dueDate: formatDate(nextWeek),
      priority: 'Low',
      completed: true,
      createdAt: Date.now() - 86400000 * 4,
      updatedAt: Date.now() - 86400000 * 2,
      completedAt: Date.now() - 86400000 * 2
    }
  ];
};

export class TaskRepository {
  static getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Seed default sample tasks if it's the first time
        const initialTasks = DEFAULT_SAMPLE_TASKS();
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
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: null
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
    } else if (!isNowCompleted && current.completed) {
      completedAt = null;
    }

    const updatedTask = {
      ...current,
      ...updates,
      title: updates.title !== undefined ? updates.title.trim() : current.title,
      description: updates.description !== undefined ? updates.description.trim() : current.description,
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
    // Insert back in its place or top
    tasks.unshift(task);
    this.saveTasks(tasks);
    return task;
  }

  static clearAllTasks() {
    this.saveTasks([]);
  }

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
