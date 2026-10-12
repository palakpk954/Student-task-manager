/**
 * Student Task Manager - UI Module
 * Handles DOM rendering, modal controllers, toast notifications, and accessibility
 */

import { TaskRepository } from './storage.js';

export class UIManager {
  constructor(state) {
    this.state = state;

    // Cached DOM Elements
    this.taskListEl = document.getElementById('task-list');
    this.emptyStateEl = document.getElementById('empty-state');
    this.noResultsStateEl = document.getElementById('no-results-state');

    // Counters
    this.statTotalEl = document.getElementById('stat-total');
    this.statPendingEl = document.getElementById('stat-pending');
    this.statCompletedEl = document.getElementById('stat-completed');
    this.statOverdueEl = document.getElementById('stat-overdue');

    // Modals
    this.taskModal = document.getElementById('task-modal');
    this.taskForm = document.getElementById('task-form');
    this.modalTitleEl = document.getElementById('modal-title');
    this.modalTaskIdInput = document.getElementById('task-id-input');
    this.taskTitleInput = document.getElementById('task-title-input');
    this.taskDueDateInput = document.getElementById('task-due-date-input');
    this.taskPrioritySelect = document.getElementById('task-priority-select');
    this.taskDescInput = document.getElementById('task-desc-input');
    this.pastDateWarningEl = document.getElementById('past-date-warning');

    // Validation error elements
    this.titleErrorEl = document.getElementById('title-error');
    this.dateErrorEl = document.getElementById('date-error');

    // Delete confirmation modal
    this.deleteModal = document.getElementById('delete-modal');
    this.deleteTaskTitleEl = document.getElementById('delete-task-title');
    this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    this.cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    this.pendingDeleteId = null;

    // Toast
    this.toastEl = document.getElementById('toast');
    this.toastMessageEl = document.getElementById('toast-message');
    this.toastActionBtn = document.getElementById('toast-action-btn');
    this.toastCloseBtn = document.getElementById('toast-close-btn');
    this.toastTimeout = null;

    // Theme toggle
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');

    // Expanded task cards map for collapsible descriptions
    this.expandedCards = new Set();
  }

  init() {
    this.initTheme();
    this.bindEvents();

    // Listen for custom toast events
    window.addEventListener('app:show-toast', (e) => {
      const { message, actionLabel, duration, onAction } = e.detail;
      this.showToast(message, actionLabel, duration, onAction);
    });

    // Subscribe to state updates
    this.state.subscribe(() => {
      this.render();
    });

    this.render();
  }

  // --- Theme Management ---

  initTheme() {
    const savedTheme = TaskRepository.getTheme();
    this.applyTheme(savedTheme);

    // Watch for OS theme changes if theme is set to 'system'
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (TaskRepository.getTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  applyTheme(theme) {
    const root = document.documentElement;
    let isDark = false;

    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'light') {
      isDark = false;
    } else {
      // System
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    }

    if (this.themeToggleBtn) {
      this.themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      this.themeToggleBtn.innerHTML = isDark
        ? `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    TaskRepository.setTheme(newTheme);
    this.applyTheme(newTheme);
  }

  // --- Rendering ---

  render() {
    this.renderCounters();
    this.renderTaskList();
  }

  renderCounters() {
    const metrics = this.state.getMetrics();
    if (this.statTotalEl) this.statTotalEl.textContent = metrics.total;
    if (this.statPendingEl) this.statPendingEl.textContent = metrics.pending;
    if (this.statCompletedEl) this.statCompletedEl.textContent = metrics.completed;
    if (this.statOverdueEl) this.statOverdueEl.textContent = metrics.overdue;

    // Visual badge alert for overdue in header
    const overdueBadge = document.getElementById('stat-overdue-container');
    if (overdueBadge) {
      if (metrics.overdue > 0) {
        overdueBadge.classList.add('has-overdue');
      } else {
        overdueBadge.classList.remove('has-overdue');
      }
    }
  }

  renderTaskList() {
    const filteredTasks = this.state.getFilteredTasks();
    const totalCount = this.state.tasks.length;

    // Reset visibility of empty states
    this.emptyStateEl.classList.add('hidden');
    this.noResultsStateEl.classList.add('hidden');
    this.taskListEl.innerHTML = '';

    if (totalCount === 0) {
      this.emptyStateEl.classList.remove('hidden');
      return;
    }

    if (filteredTasks.length === 0) {
      this.noResultsStateEl.classList.remove('hidden');
      return;
    }

    // Render task cards
    const fragment = document.createDocumentFragment();
    filteredTasks.forEach(task => {
      fragment.appendChild(this.createTaskCard(task));
    });

    this.taskListEl.appendChild(fragment);
  }

  formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return dateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }

  createTaskCard(task) {
    const isCompleted = task.completed;
    const isOverdue = this.state.isOverdue(task);
    const isDueToday = this.state.isDueToday(task);
    const isExpanded = this.expandedCards.has(task.id);

    const card = document.createElement('article');
    card.className = `task-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} priority-${task.priority.toLowerCase()}`;
    card.setAttribute('data-id', task.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Task: ${task.title}, priority ${task.priority}, due ${task.dueDate}`);

    // Priority badge HTML
    const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;
    const priorityBadge = `
      <span class="badge ${priorityClass}">
        <span class="priority-dot"></span>
        ${task.priority}
      </span>
    `;

    // Date badge HTML
    let dateBadge = '';
    const formattedDate = this.formatDisplayDate(task.dueDate);

    if (isCompleted) {
      dateBadge = `<span class="badge badge-muted">Completed</span>`;
    } else if (isOverdue) {
      dateBadge = `
        <span class="badge badge-danger">
          <svg class="icon-inline" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Overdue (${formattedDate})
        </span>
      `;
    } else if (isDueToday) {
      dateBadge = `
        <span class="badge badge-warning">
          <svg class="icon-inline" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Due Today
        </span>
      `;
    } else {
      dateBadge = `
        <span class="badge badge-neutral">
          <svg class="icon-inline" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${formattedDate}
        </span>
      `;
    }

    // Has description?
    const hasDesc = Boolean(task.description && task.description.trim());
    const descHtml = hasDesc
      ? `
        <div class="task-description-wrapper ${isExpanded ? 'expanded' : ''}" id="desc-${task.id}">
          <p class="task-description">${this.escapeHtml(task.description)}</p>
        </div>
        <button type="button" class="btn-toggle-desc" data-action="toggle-desc" data-id="${task.id}" aria-expanded="${isExpanded}" aria-controls="desc-${task.id}">
          ${isExpanded ? 'Show less' : 'View details'}
        </button>
      `
      : '';

    card.innerHTML = `
      <div class="task-card-main">
        <label class="task-checkbox-container" title="${isCompleted ? 'Mark as incomplete' : 'Mark as complete'}">
          <input type="checkbox" class="task-checkbox" data-action="toggle" data-id="${task.id}" ${isCompleted ? 'checked' : ''} aria-label="Mark task ${this.escapeHtml(task.title)} as ${isCompleted ? 'incomplete' : 'complete'}" />
          <span class="custom-checkbox">
            <svg class="check-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        </label>

        <div class="task-content">
          <div class="task-header-row">
            <h3 class="task-title ${isCompleted ? 'title-completed' : ''}">${this.escapeHtml(task.title)}</h3>
          </div>

          <div class="task-badges">
            ${priorityBadge}
            ${dateBadge}
          </div>

          ${descHtml}
        </div>

        <div class="task-actions">
          <button type="button" class="btn-icon btn-edit" data-action="edit" data-id="${task.id}" title="Edit task" aria-label="Edit task ${this.escapeHtml(task.title)}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button type="button" class="btn-icon btn-delete" data-action="delete" data-id="${task.id}" title="Delete task" aria-label="Delete task ${this.escapeHtml(task.title)}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    return card;
  }

  // --- Modals Management ---

  openAddModal() {
    this.modalTitleEl.textContent = 'Add New Task';
    this.taskForm.reset();
    this.modalTaskIdInput.value = '';

    // Default due date to today
    const todayStr = this.state.constructor.getTodayString();
    this.taskDueDateInput.value = todayStr;
    this.taskPrioritySelect.value = 'Medium';

    this.clearValidationErrors();
    this.taskModal.classList.add('active');
    this.taskModal.setAttribute('aria-hidden', 'false');

    // Focus first input
    setTimeout(() => this.taskTitleInput.focus(), 50);
    document.body.classList.add('modal-open');
  }

  openEditModal(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.modalTitleEl.textContent = 'Edit Task';
    this.modalTaskIdInput.value = task.id;
    this.taskTitleInput.value = task.title;
    this.taskDueDateInput.value = task.dueDate;
    this.taskPrioritySelect.value = task.priority;
    this.taskDescInput.value = task.description || '';

    this.clearValidationErrors();
    this.checkPastDate(task.dueDate);

    this.taskModal.classList.add('active');
    this.taskModal.setAttribute('aria-hidden', 'false');

    setTimeout(() => this.taskTitleInput.focus(), 50);
    document.body.classList.add('modal-open');
  }

  closeTaskModal() {
    this.taskModal.classList.remove('active');
    this.taskModal.setAttribute('aria-hidden', 'true');
    this.clearValidationErrors();
    document.body.classList.remove('modal-open');
  }

  openDeleteModal(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.pendingDeleteId = taskId;
    this.deleteTaskTitleEl.textContent = `"${task.title}"`;
    this.deleteModal.classList.add('active');
    this.deleteModal.setAttribute('aria-hidden', 'false');

    setTimeout(() => this.cancelDeleteBtn.focus(), 50);
    document.body.classList.add('modal-open');
  }

  closeDeleteModal() {
    this.deleteModal.classList.remove('active');
    this.deleteModal.setAttribute('aria-hidden', 'true');
    this.pendingDeleteId = null;
    document.body.classList.remove('modal-open');
  }

  clearValidationErrors() {
    if (this.titleErrorEl) this.titleErrorEl.textContent = '';
    if (this.dateErrorEl) this.dateErrorEl.textContent = '';
    if (this.pastDateWarningEl) this.pastDateWarningEl.classList.add('hidden');
    this.taskTitleInput.classList.remove('input-invalid');
    this.taskDueDateInput.classList.remove('input-invalid');
  }

  checkPastDate(dateValue) {
    if (!dateValue) {
      if (this.pastDateWarningEl) this.pastDateWarningEl.classList.add('hidden');
      return;
    }
    const todayStr = this.state.constructor.getTodayString();
    if (dateValue < todayStr) {
      if (this.pastDateWarningEl) this.pastDateWarningEl.classList.remove('hidden');
    } else {
      if (this.pastDateWarningEl) this.pastDateWarningEl.classList.add('hidden');
    }
  }

  handleTaskFormSubmit(e) {
    e.preventDefault();
    this.clearValidationErrors();

    const title = this.taskTitleInput.value.trim();
    const dueDate = this.taskDueDateInput.value;
    const priority = this.taskPrioritySelect.value;
    const description = this.taskDescInput.value.trim();
    const editId = this.modalTaskIdInput.value;

    let hasError = false;

    // FR-1 & Validation rules
    if (!title) {
      this.titleErrorEl.textContent = 'Task title is required.';
      this.taskTitleInput.classList.add('input-invalid');
      hasError = true;
    } else if (title.length > 100) {
      this.titleErrorEl.textContent = 'Title must be 100 characters or fewer.';
      this.taskTitleInput.classList.add('input-invalid');
      hasError = true;
    }

    if (!dueDate) {
      this.dateErrorEl.textContent = 'Due date is required.';
      this.taskDueDateInput.classList.add('input-invalid');
      hasError = true;
    }

    if (description.length > 500) {
      this.titleErrorEl.textContent = 'Description must be 500 characters or fewer.';
      hasError = true;
    }

    if (hasError) return;

    if (editId) {
      // Edit existing
      this.state.updateTask(editId, {
        title,
        dueDate,
        priority,
        description
      });
    } else {
      // Create new
      this.state.addTask({
        title,
        dueDate,
        priority,
        description
      });
    }

    this.closeTaskModal();
  }

  // --- Toast Notification ---

  showToast(message, actionLabel = 'Undo', duration = 5000, onAction = null) {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastMessageEl.textContent = message;

    if (actionLabel && onAction) {
      this.toastActionBtn.textContent = actionLabel;
      this.toastActionBtn.classList.remove('hidden');
      this.toastActionBtn.onclick = () => {
        onAction();
        this.hideToast();
      };
    } else {
      this.toastActionBtn.classList.add('hidden');
    }

    this.toastEl.classList.add('active');
    this.toastEl.setAttribute('aria-hidden', 'false');

    this.toastTimeout = setTimeout(() => {
      this.hideToast();
    }, duration);
  }

  hideToast() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.toastEl.classList.remove('active');
    this.toastEl.setAttribute('aria-hidden', 'true');
  }

  // --- Event Bindings ---

  bindEvents() {
    // Theme toggle
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Add Task Buttons (header + mobile FAB + empty state button)
    document.querySelectorAll('[data-action="open-add-task"]').forEach(btn => {
      btn.addEventListener('click', () => this.openAddModal());
    });

    // Close Modal Buttons
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeTaskModal());
    });

    // Task Form submit
    this.taskForm.addEventListener('submit', (e) => this.handleTaskFormSubmit(e));

    // Live validation / warning on date input
    this.taskDueDateInput.addEventListener('change', (e) => {
      this.checkPastDate(e.target.value);
    });

    // Character counter for description and title
    const titleCounter = document.getElementById('title-char-counter');
    this.taskTitleInput.addEventListener('input', (e) => {
      if (titleCounter) titleCounter.textContent = `${e.target.value.length}/100`;
      if (this.taskTitleInput.classList.contains('input-invalid')) {
        this.titleErrorEl.textContent = '';
        this.taskTitleInput.classList.remove('input-invalid');
      }
    });

    const descCounter = document.getElementById('desc-char-counter');
    this.taskDescInput.addEventListener('input', (e) => {
      if (descCounter) descCounter.textContent = `${e.target.value.length}/500`;
    });

    // Task List Delegated Events (toggle, edit, delete, expand)
    this.taskListEl.addEventListener('click', (e) => {
      const toggleCheckbox = e.target.closest('[data-action="toggle"]');
      if (toggleCheckbox) {
        const id = toggleCheckbox.getAttribute('data-id');
        this.state.toggleComplete(id);
        return;
      }

      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        this.openEditModal(id);
        return;
      }

      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        this.openDeleteModal(id);
        return;
      }

      const expandBtn = e.target.closest('[data-action="toggle-desc"]');
      if (expandBtn) {
        const id = expandBtn.getAttribute('data-id');
        if (this.expandedCards.has(id)) {
          this.expandedCards.delete(id);
        } else {
          this.expandedCards.add(id);
        }
        this.renderTaskList();
        return;
      }
    });

    // Delete Confirmation Modal Actions
    this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
    document.querySelectorAll('[data-action="close-delete-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeDeleteModal());
    });

    this.confirmDeleteBtn.addEventListener('click', () => {
      if (this.pendingDeleteId) {
        this.state.deleteTask(this.pendingDeleteId);
        this.closeDeleteModal();
      }
    });

    // Toast Close
    if (this.toastCloseBtn) {
      this.toastCloseBtn.addEventListener('click', () => this.hideToast());
    }

    // Status Filter buttons (segmented control)
    document.querySelectorAll('[data-filter-status]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-filter-status]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const status = btn.getAttribute('data-filter-status');
        this.state.setFilter('status', status);
      });
    });

    // Priority Filter buttons
    document.querySelectorAll('[data-filter-priority]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-filter-priority]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const priority = btn.getAttribute('data-filter-priority');
        this.state.setFilter('priority', priority);
      });
    });

    // Reset Filters button (in empty search state)
    document.querySelectorAll('[data-action="clear-filters"]').forEach(btn => {
      btn.addEventListener('click', () => {
        // Reset active pills
        document.querySelectorAll('[data-filter-status]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-filter-status') === 'all');
        });
        document.querySelectorAll('[data-filter-priority]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-filter-priority') === 'all');
        });

        // Reset search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        this.state.resetFilters();
      });
    });

    // Sort Dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.setSort(e.target.value);
      });
    }

    // Search Input with Debounce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.state.setSearch(e.target.value);
        }, 150);
      });
    }

    // Keyboard Shortcuts (Esc closes modals, backdrop click closes modals)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.taskModal.classList.contains('active')) {
          this.closeTaskModal();
        }
        if (this.deleteModal.classList.contains('active')) {
          this.closeDeleteModal();
        }
      }
    });

    // Backdrop clicks
    this.taskModal.addEventListener('click', (e) => {
      if (e.target === this.taskModal) {
        this.closeTaskModal();
      }
    });

    this.deleteModal.addEventListener('click', (e) => {
      if (e.target === this.deleteModal) {
        this.closeDeleteModal();
      }
    });
  }
}
