/**
 * Student Task Manager - Complete UI Module
 * Handles DOM rendering, Calendar view, Weekly Analytics, Pomodoro timer,
 * AI Syllabus parser, Drag-and-drop reordering, Subtasks, Notifications,
 * and Keyboard shortcuts.
 */

import { TaskRepository } from './storage.js';
import { AuthService } from './auth.js';

export class UIManager {
  constructor(state) {
    this.state = state;

    // View Containers
    this.viewWelcomeEl = document.getElementById('view-welcome');
    this.viewListEl = document.getElementById('view-list');
    this.viewCalendarEl = document.getElementById('view-calendar');
    this.viewSummaryEl = document.getElementById('view-summary');

    // List DOM Elements
    this.taskListEl = document.getElementById('task-list');
    this.emptyStateEl = document.getElementById('empty-state');
    this.noResultsStateEl = document.getElementById('no-results-state');

    // Counters & Progress
    this.statTotalEl = document.getElementById('stat-total');
    this.statPendingEl = document.getElementById('stat-pending');
    this.statCompletedEl = document.getElementById('stat-completed');
    this.statOverdueEl = document.getElementById('stat-overdue');
    this.streakCountEl = document.getElementById('streak-count');
    this.progressFillEl = document.getElementById('progress-fill');
    this.progressTextEl = document.getElementById('progress-text');

    // Task Form Modal Elements
    this.taskModal = document.getElementById('task-modal');
    this.taskForm = document.getElementById('task-form');
    this.modalTitleEl = document.getElementById('modal-title');
    this.modalTaskIdInput = document.getElementById('task-id-input');
    this.taskTitleInput = document.getElementById('task-title-input');
    this.taskDueDateInput = document.getElementById('task-due-date-input');
    this.taskPrioritySelect = document.getElementById('task-priority-select');
    this.taskCourseInput = document.getElementById('task-course-input');
    this.taskTypeSelect = document.getElementById('task-type-select');
    this.taskEstTimeInput = document.getElementById('task-est-time-input');
    this.taskDescInput = document.getElementById('task-desc-input');
    this.pastDateWarningEl = document.getElementById('past-date-warning');
    this.titleErrorEl = document.getElementById('title-error');
    this.dateErrorEl = document.getElementById('date-error');

    // Modal Subtasks List Builder
    this.modalSubtasksContainer = document.getElementById('modal-subtasks-container');
    this.newSubtaskInput = document.getElementById('modal-new-subtask-input');
    this.addSubtaskBtn = document.getElementById('btn-add-modal-subtask');
    this.tempModalSubtasks = [];

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

    // Calendar state
    this.calendarDate = new Date();

    // Pomodoro Timer State
    this.pomodoroTimeLeft = 25 * 60;
    this.pomodoroTimer = null;
    this.pomodoroIsRunning = false;
    this.pomodoroMode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak'
    this.activePomodoroTask = null;

    // Drag-and-drop state
    this.draggedTaskId = null;

    // Card details expansion tracking
    this.expandedCards = new Set();

    // Auth & User Profile Elements
    this.authModal = document.getElementById('auth-modal');
    this.loginForm = document.getElementById('login-form');
    this.signupForm = document.getElementById('signup-form');
    this.tabLoginBtn = document.getElementById('tab-login-btn');
    this.tabSignupBtn = document.getElementById('tab-signup-btn');
    this.btnOpenLogin = document.getElementById('btn-open-login');
    this.btnOpenSignup = document.getElementById('btn-open-signup');
    this.btnDemoLogin = document.getElementById('btn-demo-login');
    this.userProfileMenu = document.getElementById('user-profile-menu');
    this.authButtonsGroup = document.getElementById('auth-buttons-group');
    this.userProfileBtn = document.getElementById('user-profile-btn');
    this.userDropdownCard = document.getElementById('user-dropdown-card');
    this.headerUserAvatar = document.getElementById('header-user-avatar');
    this.dropdownUserAvatar = document.getElementById('dropdown-user-avatar');
    this.dropdownUserName = document.getElementById('dropdown-user-name');
    this.dropdownUserEmail = document.getElementById('dropdown-user-email');
    this.dropdownUserMajor = document.getElementById('dropdown-user-major');
    this.btnSwitchAccount = document.getElementById('btn-switch-account');
    this.btnUserLogout = document.getElementById('btn-user-logout');
    this.loginErrorEl = document.getElementById('login-error');
    this.signupErrorEl = document.getElementById('signup-error');
  }

  init() {
    this.initTheme();
    this.bindEvents();
    this.initServiceWorker();
    this.initNotifications();
    this.initPomodoro();

    // Custom Toast listener
    window.addEventListener('app:show-toast', (e) => {
      const { message, actionLabel, duration, onAction } = e.detail;
      this.showToast(message, actionLabel, duration, onAction);
    });

    // Subscribe to state changes
    this.state.subscribe(() => {
      this.render();
    });

    this.render();
  }

  // --- PWA & Offline Support (Phase 5) ---

  initServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker registered successfully.'))
        .catch(err => console.log('Service Worker registration failed:', err));
    }
  }

  // --- Desktop Notifications for Due Today (Phase 6) ---

  initNotifications() {
    const notifyBtn = document.getElementById('btn-enable-notifications');
    if (!notifyBtn) return;

    if (!('Notification' in window)) {
      notifyBtn.style.display = 'none';
      return;
    }

    if (Notification.permission === 'granted') {
      notifyBtn.classList.add('active');
      notifyBtn.title = 'Notifications enabled';
      this.checkAndSendDueNotifications();
    }

    notifyBtn.addEventListener('click', async () => {
      if (Notification.permission === 'granted') {
        this.checkAndSendDueNotifications(true);
      } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          notifyBtn.classList.add('active');
          this.showToast('Browser notifications enabled.', null, 3000);
          this.checkAndSendDueNotifications(true);
        }
      }
    });
  }

  checkAndSendDueNotifications(forced = false) {
    if (Notification.permission !== 'granted') return;

    const todayStr = this.state.constructor.getTodayString();
    const dueTodayTasks = this.state.tasks.filter(t => !t.completed && t.dueDate === todayStr);

    if (dueTodayTasks.length > 0) {
      const title = `Task Alert: ${dueTodayTasks.length} task(s) due today!`;
      const body = dueTodayTasks.map(t => `• ${t.title}`).join('\n');
      try {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238B5A2B"><circle cx="12" cy="12" r="10"/></svg>'
        });
      } catch (e) {
        console.warn('Could not trigger notification', e);
      }
    } else if (forced) {
      this.showToast('All caught up. No incomplete tasks due today.', null, 3000);
    }
  }

  // --- Audio Chime for Pomodoro (Web Audio API Synthesizer) ---

  playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Web Audio playback error', e);
    }
  }

  // --- Theme Management ---

  initTheme() {
    const savedTheme = TaskRepository.getTheme();
    this.applyTheme(savedTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
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

  // --- Master Render Method ---

  render() {
    this.renderUserAuth();
    this.renderHeaderAndMetrics();
    this.renderCourseFilters();

    // Update active tab buttons
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view-target') === this.state.activeView);
    });

    const isWelcome = this.state.activeView === 'welcome';
    const sidebar = document.getElementById('app-sidebar');
    const metricsSection = document.querySelector('.metrics-section');

    if (sidebar) sidebar.style.display = isWelcome ? 'none' : '';
    if (metricsSection) metricsSection.style.display = isWelcome ? 'none' : '';

    if (this.viewWelcomeEl) this.viewWelcomeEl.classList.toggle('hidden', !isWelcome);
    if (this.viewListEl) this.viewListEl.classList.toggle('hidden', this.state.activeView !== 'list');
    if (this.viewCalendarEl) this.viewCalendarEl.classList.toggle('hidden', this.state.activeView !== 'calendar');
    if (this.viewSummaryEl) this.viewSummaryEl.classList.toggle('hidden', this.state.activeView !== 'summary');

    if (this.state.activeView === 'list') {
      this.renderTaskList();
    } else if (this.state.activeView === 'calendar') {
      this.renderCalendarView();
    } else if (this.state.activeView === 'summary') {
      this.renderSummaryView();
    }
  }

  renderHeaderAndMetrics() {
    const metrics = this.state.getMetrics();
    if (this.statTotalEl) this.statTotalEl.textContent = metrics.total;
    if (this.statPendingEl) this.statPendingEl.textContent = metrics.pending;
    if (this.statCompletedEl) this.statCompletedEl.textContent = metrics.completed;
    if (this.statOverdueEl) this.statOverdueEl.textContent = metrics.overdue;
    if (this.streakCountEl) this.streakCountEl.textContent = `${metrics.streak} Day Streak`;

    // Overdue badge highlight
    const overdueContainer = document.getElementById('stat-overdue-container');
    if (overdueContainer) {
      overdueContainer.classList.toggle('has-overdue', metrics.overdue > 0);
    }

    // Progress bar
    if (this.progressFillEl) {
      this.progressFillEl.style.width = `${metrics.percentage}%`;
    }
    if (this.progressTextEl) {
      this.progressTextEl.textContent = `${metrics.completed} of ${metrics.total} tasks completed (${metrics.percentage}%)`;
    }
  }

  renderCourseFilters() {
    const courses = this.state.getUniqueCourses();
    const container = document.getElementById('course-filter-list');
    if (!container) return;

    const currentCourse = this.state.filters.course;
    let html = `
      <button type="button" class="filter-pill ${currentCourse === 'all' ? 'active' : ''}" data-filter-course="all">
        <span>All Courses</span>
      </button>
    `;

    courses.forEach(c => {
      html += `
        <button type="button" class="filter-pill ${currentCourse === c ? 'active' : ''}" data-filter-course="${this.escapeHtml(c)}">
          <span class="course-code-dot"></span>
          <span>${this.escapeHtml(c)}</span>
        </button>
      `;
    });

    container.innerHTML = html;
  }

  // --- Task Feed Rendering ---

  renderTaskList() {
    const filteredTasks = this.state.getFilteredTasks();
    const totalCount = this.state.tasks.length;

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

    const fragment = document.createDocumentFragment();
    filteredTasks.forEach((task, index) => {
      fragment.appendChild(this.createTaskCard(task, index));
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

  createTaskCard(task, index) {
    const isCompleted = task.completed;
    const isOverdue = this.state.isOverdue(task);
    const isDueToday = this.state.isDueToday(task);
    const isExpanded = this.expandedCards.has(task.id);

    const card = document.createElement('article');
    card.className = `task-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} priority-${task.priority.toLowerCase()}`;
    card.setAttribute('data-id', task.id);
    card.setAttribute('draggable', 'true');
    card.setAttribute('tabindex', '0');

    // Drag-and-drop handles
    card.addEventListener('dragstart', (e) => {
      this.draggedTaskId = task.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      this.draggedTaskId = null;
      document.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedTaskId !== task.id) {
        card.classList.add('drag-over');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const draggedId = e.dataTransfer.getData('text/plain') || this.draggedTaskId;
      if (draggedId && draggedId !== task.id) {
        this.state.reorderTasks(draggedId, task.id);
      }
    });

    // Priority badge HTML
    const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;
    const priorityBadge = `
      <span class="badge ${priorityClass}">
        <span class="priority-dot ${task.priority.toLowerCase()}"></span>
        ${task.priority}
      </span>
    `;

    // Course tag badge
    const courseBadge = task.course
      ? `<span class="badge badge-course">${this.escapeHtml(task.course)}</span>`
      : '';

    // Task Type badge (clean text)
    const typeBadge = `<span class="badge badge-type">${this.escapeHtml(task.taskType || 'Assignment')}</span>`;

    // Estimated time badge
    const timeBadge = task.estimatedMinutes
      ? `<span class="badge badge-time" title="Estimated time">${task.estimatedMinutes} min</span>`
      : '';

    // Date badge HTML
    let dateBadge = '';
    const formattedDate = this.formatDisplayDate(task.dueDate);

    if (isCompleted) {
      dateBadge = `<span class="badge badge-muted">Completed</span>`;
    } else if (isOverdue) {
      dateBadge = `
        <span class="badge badge-danger">
          <svg class="icon-inline" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
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
          <svg class="icon-inline" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Due Today
        </span>
      `;
    } else {
      dateBadge = `
        <span class="badge badge-neutral">
          <svg class="icon-inline" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${formattedDate}
        </span>
      `;
    }

    // Subtasks summary and checklist
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const subtaskBadge = subtasks.length > 0
      ? `<span class="badge badge-subtasks">${completedSubtasks}/${subtasks.length} steps</span>`
      : '';

    // Description & Subtasks container
    const hasDesc = Boolean(task.description && task.description.trim());
    const hasSubtasks = subtasks.length > 0;
    const gCalUrl = TaskRepository.getGoogleCalendarUrl(task);

    let detailsSection = '';
    if (hasDesc || hasSubtasks) {
      let subtasksListHtml = '';
      if (hasSubtasks) {
        subtasksListHtml = `
          <div class="card-subtasks-list">
            <h4 class="subtasks-section-title">Checklist:</h4>
            ${subtasks.map(st => `
              <div class="subtask-row">
                <input type="checkbox" class="subtask-checkbox" data-action="toggle-subtask" data-task-id="${task.id}" data-subtask-id="${st.id}" ${st.completed ? 'checked' : ''} />
                <span class="subtask-title ${st.completed ? 'completed-subtask' : ''}">${this.escapeHtml(st.title)}</span>
              </div>
            `).join('')}
          </div>
        `;
      }

      detailsSection = `
        <div class="task-description-wrapper ${isExpanded ? 'expanded' : ''}" id="desc-${task.id}">
          ${hasDesc ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
          ${subtasksListHtml}
          
          <div class="card-extra-actions">
            <a href="${gCalUrl}" target="_blank" rel="noopener noreferrer" class="btn-gcal-link" title="Add to Google Calendar">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Add to Google Calendar</span>
            </a>
          </div>
        </div>
        <button type="button" class="btn-toggle-desc" data-action="toggle-desc" data-id="${task.id}">
          ${isExpanded ? 'Show less' : 'View details & checklist'}
        </button>
      `;
    }

    card.innerHTML = `
      <div class="task-card-main">
        <div class="drag-handle" title="Drag to reorder" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
        </div>

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
            ${courseBadge}
            ${typeBadge}
            ${timeBadge}
            ${dateBadge}
            ${subtaskBadge}
          </div>

          ${detailsSection}
        </div>

        <div class="task-actions">
          <button type="button" class="btn-icon btn-pomodoro" data-action="start-pomodoro" data-id="${task.id}" title="Focus with Pomodoro (25m)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>
          <button type="button" class="btn-icon btn-edit" data-action="edit" data-id="${task.id}" title="Edit task">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button type="button" class="btn-icon btn-delete" data-action="delete" data-id="${task.id}" title="Delete task">
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

  // --- Interactive Calendar View (Phase 6) ---

  renderCalendarView() {
    const calendarMonthEl = document.getElementById('calendar-month-title');
    const calendarGridEl = document.getElementById('calendar-grid');
    if (!calendarGridEl) return;

    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (calendarMonthEl) {
      calendarMonthEl.textContent = `${monthNames[month]} ${year}`;
    }

    calendarGridEl.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayStr = this.state.constructor.getTodayString();

    // Fill leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day-cell empty-cell';
      calendarGridEl.appendChild(emptyCell);
    }

    // Fill day cells
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;

      const dayCell = document.createElement('div');
      dayCell.className = `calendar-day-cell ${isToday ? 'today-cell' : ''}`;

      const dayTasks = this.state.tasks.filter(t => t.dueDate === dateStr);

      dayCell.innerHTML = `
        <div class="calendar-day-header">
          <span class="day-number ${isToday ? 'today-badge' : ''}">${day}</span>
          <button type="button" class="btn-cell-add" data-action="quick-add-date" data-date="${dateStr}" title="Add task for this day">+</button>
        </div>
        <div class="calendar-task-chips">
          ${dayTasks.map(t => `
            <div class="calendar-task-chip priority-${t.priority.toLowerCase()} ${t.completed ? 'completed-chip' : ''}" data-action="edit" data-id="${t.id}" title="${this.escapeHtml(t.title)} (${t.priority})">
              <span class="chip-dot"></span>
              <span class="chip-title">${this.escapeHtml(t.title)}</span>
            </div>
          `).join('')}
        </div>
      `;

      calendarGridEl.appendChild(dayCell);
    }
  }

  // --- Weekly Summary & Analytics View (Phase 4) ---

  renderSummaryView() {
    const stats = this.state.getWeeklyStats();
    const chartContainer = document.getElementById('summary-bar-chart');
    const totalEstTimeEl = document.getElementById('summary-total-est-time');
    const metrics = this.state.getMetrics();

    if (chartContainer) {
      const maxCount = Math.max(1, ...stats.counts, ...stats.totalPending);
      let barsHtml = '';

      stats.days.forEach((day, i) => {
        const completedCount = stats.counts[i];
        const pendingCount = stats.totalPending[i];
        const completedHeight = (completedCount / maxCount) * 100;
        const pendingHeight = (pendingCount / maxCount) * 100;

        barsHtml += `
          <div class="chart-column">
            <div class="chart-bars-group">
              <div class="chart-bar bar-pending" style="height: ${Math.max(4, pendingHeight)}%" title="${day}: ${pendingCount} pending"></div>
              <div class="chart-bar bar-completed" style="height: ${Math.max(4, completedHeight)}%" title="${day}: ${completedCount} completed"></div>
            </div>
            <span class="chart-day-label">${day}</span>
          </div>
        `;
      });

      chartContainer.innerHTML = barsHtml;
    }

    if (totalEstTimeEl) {
      const totalMinutes = this.state.tasks
        .filter(t => !t.completed)
        .reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      totalEstTimeEl.textContent = `${hours}h ${mins}m of pending study work`;
    }
  }

  // --- Pomodoro Timer Engine (Phase 6) ---

  initPomodoro() {
    const pomodoroWidget = document.getElementById('pomodoro-widget');
    const timerDisplay = document.getElementById('pomodoro-time-display');
    const playPauseBtn = document.getElementById('btn-pomodoro-toggle');
    const resetBtn = document.getElementById('btn-pomodoro-reset');
    const closeBtn = document.getElementById('btn-pomodoro-close');
    const taskNameDisplay = document.getElementById('pomodoro-task-name');

    const updateDisplay = () => {
      const mins = String(Math.floor(this.pomodoroTimeLeft / 60)).padStart(2, '0');
      const secs = String(this.pomodoroTimeLeft % 60).padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
    };

    updateDisplay();

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        if (this.pomodoroIsRunning) {
          clearInterval(this.pomodoroTimer);
          this.pomodoroIsRunning = false;
          playPauseBtn.textContent = 'Start';
        } else {
          this.pomodoroIsRunning = true;
          playPauseBtn.textContent = 'Pause';
          this.pomodoroTimer = setInterval(() => {
            if (this.pomodoroTimeLeft > 0) {
              this.pomodoroTimeLeft--;
              updateDisplay();
            } else {
              clearInterval(this.pomodoroTimer);
              this.pomodoroIsRunning = false;
              playPauseBtn.textContent = 'Start';
              this.playChime();
              this.showToast('Pomodoro interval complete. Take a short break.', null, 5000);
            }
          }, 1000);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        clearInterval(this.pomodoroTimer);
        this.pomodoroIsRunning = false;
        this.pomodoroTimeLeft = 25 * 60;
        if (playPauseBtn) playPauseBtn.textContent = 'Start';
        updateDisplay();
      });
    }

    if (closeBtn && pomodoroWidget) {
      closeBtn.addEventListener('click', () => {
        pomodoroWidget.classList.add('hidden');
      });
    }

    document.querySelectorAll('[data-pomodoro-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-pomodoro-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-pomodoro-mode');
        this.pomodoroMode = mode;
        clearInterval(this.pomodoroTimer);
        this.pomodoroIsRunning = false;
        if (playPauseBtn) playPauseBtn.textContent = 'Start';

        if (mode === 'pomodoro') this.pomodoroTimeLeft = 25 * 60;
        else if (mode === 'shortBreak') this.pomodoroTimeLeft = 5 * 60;
        else if (mode === 'longBreak') this.pomodoroTimeLeft = 15 * 60;

        updateDisplay();
      });
    });
  }

  openPomodoroForTask(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    const pomodoroWidget = document.getElementById('pomodoro-widget');
    const taskNameDisplay = document.getElementById('pomodoro-task-name');

    if (pomodoroWidget) {
      pomodoroWidget.classList.remove('hidden');
    }

    if (task && taskNameDisplay) {
      this.activePomodoroTask = task;
      taskNameDisplay.textContent = `Focusing on: "${task.title}"`;
    }
  }

  // --- AI Syllabus Helper Engine (Phase 6) ---

  initSyllabusHelper() {
    const syllabusModal = document.getElementById('syllabus-modal');
    const parseBtn = document.getElementById('btn-parse-syllabus');
    const syllabusInput = document.getElementById('syllabus-text-input');
    const previewContainer = document.getElementById('syllabus-preview-container');
    const importBtn = document.getElementById('btn-import-syllabus-tasks');

    if (!syllabusModal) return;

    let parsedTasks = [];

    parseBtn.addEventListener('click', () => {
      const text = syllabusInput.value.trim();
      if (!text) {
        this.showToast('Please paste course text or syllabus excerpt first.', null, 3000);
        return;
      }

      parsedTasks = this.extractTasksFromSyllabus(text);
      if (parsedTasks.length === 0) {
        previewContainer.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">No tasks detected. Try including keywords like 'Exam', 'Homework', 'Due Oct 15', etc.</p>`;
        importBtn.classList.add('hidden');
        return;
      }

      let tableHtml = `
        <table class="syllabus-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Course</th>
              <th>Due Date</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            ${parsedTasks.map(t => `
              <tr>
                <td><strong>${this.escapeHtml(t.title)}</strong></td>
                <td><span class="badge badge-course">${this.escapeHtml(t.course)}</span></td>
                <td>${t.dueDate}</td>
                <td><span class="badge badge-priority-${t.priority.toLowerCase()}">${t.priority}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      previewContainer.innerHTML = tableHtml;
      importBtn.classList.remove('hidden');
    });

    importBtn.addEventListener('click', () => {
      parsedTasks.forEach(task => {
        this.state.addTask(task);
      });
      this.closeModal(syllabusModal);
      this.showToast(`Imported ${parsedTasks.length} tasks from syllabus.`, null, 4000);
      syllabusInput.value = '';
      previewContainer.innerHTML = '';
      importBtn.classList.add('hidden');
    });
  }

  extractTasksFromSyllabus(text) {
    const lines = text.split('\n');
    const detectedTasks = [];
    const todayStr = this.state.constructor.getTodayString();

    // Regex helpers
    const courseRegex = /\b([A-Z]{2,4}\s*[-]?\s*\d{2,4}[A-Z]?)\b/i;
    const dateRegex = /\b(due\s*:?\s*)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/i;

    let currentCourse = 'General';
    const courseMatchAll = text.match(courseRegex);
    if (courseMatchAll) {
      currentCourse = courseMatchAll[1].toUpperCase();
    }

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length < 5) return;

      const isExam = /exam|midterm|final|quiz|test/i.test(trimmed);
      const isAssignment = /assignment|homework|hw|project|paper|lab|submission|due/i.test(trimmed);
      const isReading = /reading|read chapter|ch\.\s*\d+/i.test(trimmed);

      if (isExam || isAssignment || isReading) {
        let taskType = 'Assignment';
        let priority = 'Medium';
        if (isExam) { taskType = 'Exam'; priority = 'High'; }
        if (isReading) { taskType = 'Reading'; priority = 'Low'; }
        if (/project|final/i.test(trimmed)) { taskType = 'Project'; priority = 'High'; }

        // Try date extraction
        let dueDate = todayStr;
        const dateMatch = trimmed.match(dateRegex);
        if (dateMatch) {
          const dateStr = dateMatch[2];
          try {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              // Set year to current year if omitted
              if (parsed.getFullYear() < 2000) parsed.setFullYear(new Date().getFullYear());
              const y = parsed.getFullYear();
              const m = String(parsed.getMonth() + 1).padStart(2, '0');
              const d = String(parsed.getDate()).padStart(2, '0');
              dueDate = `${y}-${m}-${d}`;
            }
          } catch (e) {
            dueDate = todayStr;
          }
        }

        // Clean title
        let cleanTitle = trimmed
          .replace(dateRegex, '')
          .replace(/^[-*•\d.]+\s*/, '')
          .trim();

        if (cleanTitle.length > 80) cleanTitle = cleanTitle.slice(0, 80) + '...';

        detectedTasks.push({
          title: cleanTitle || trimmed.slice(0, 50),
          course: currentCourse,
          dueDate,
          priority,
          taskType,
          estimatedMinutes: isExam ? 120 : (isReading ? 45 : 60),
          description: `Auto-extracted from syllabus:\n"${trimmed}"`
        });
      }
    });

    return detectedTasks;
  }

  // --- Modals Management ---

  openAddModal(presetDate = null) {
    this.modalTitleEl.textContent = 'Add New Task';
    this.taskForm.reset();
    this.modalTaskIdInput.value = '';

    const todayStr = this.state.constructor.getTodayString();
    this.taskDueDateInput.value = presetDate || todayStr;
    this.taskPrioritySelect.value = 'Medium';
    this.taskTypeSelect.value = 'Assignment';
    this.taskEstTimeInput.value = 45;
    this.taskCourseInput.value = '';

    this.tempModalSubtasks = [];
    this.renderModalSubtasks();
    this.clearValidationErrors();

    this.openModal(this.taskModal);
    setTimeout(() => this.taskTitleInput.focus(), 50);
  }

  openEditModal(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.modalTitleEl.textContent = 'Edit Task';
    this.modalTaskIdInput.value = task.id;
    this.taskTitleInput.value = task.title;
    this.taskDueDateInput.value = task.dueDate;
    this.taskPrioritySelect.value = task.priority;
    this.taskCourseInput.value = task.course || '';
    this.taskTypeSelect.value = task.taskType || 'Assignment';
    this.taskEstTimeInput.value = task.estimatedMinutes || 30;
    this.taskDescInput.value = task.description || '';

    this.tempModalSubtasks = Array.isArray(task.subtasks) ? [...task.subtasks] : [];
    this.renderModalSubtasks();

    this.clearValidationErrors();
    this.checkPastDate(task.dueDate);

    this.openModal(this.taskModal);
    setTimeout(() => this.taskTitleInput.focus(), 50);
  }

  renderModalSubtasks() {
    if (!this.modalSubtasksContainer) return;
    this.modalSubtasksContainer.innerHTML = '';

    this.tempModalSubtasks.forEach((st, idx) => {
      const row = document.createElement('div');
      row.className = 'modal-subtask-item';
      row.innerHTML = `
        <span class="subtask-label">${this.escapeHtml(st.title)}</span>
        <button type="button" class="btn-remove-subtask" data-remove-idx="${idx}" title="Remove">Remove</button>
      `;
      this.modalSubtasksContainer.appendChild(row);
    });
  }

  openModal(modalEl) {
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  closeModal(modalEl) {
    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    this.clearValidationErrors();
  }

  openDeleteModal(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    this.pendingDeleteId = taskId;
    this.deleteTaskTitleEl.textContent = `"${task.title}"`;
    this.openModal(this.deleteModal);
    setTimeout(() => this.cancelDeleteBtn.focus(), 50);
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
    const course = this.taskCourseInput.value.trim() || 'General';
    const taskType = this.taskTypeSelect.value;
    const estimatedMinutes = parseInt(this.taskEstTimeInput.value, 10) || 30;
    const description = this.taskDescInput.value.trim();
    const editId = this.modalTaskIdInput.value;

    let hasError = false;

    if (!title) {
      this.titleErrorEl.textContent = 'Task title is required.';
      this.taskTitleInput.classList.add('input-invalid');
      hasError = true;
    }

    if (!dueDate) {
      this.dateErrorEl.textContent = 'Due date is required.';
      this.taskDueDateInput.classList.add('input-invalid');
      hasError = true;
    }

    if (hasError) return;

    const taskPayload = {
      title,
      dueDate,
      priority,
      course,
      taskType,
      estimatedMinutes,
      description,
      subtasks: this.tempModalSubtasks
    };

    if (editId) {
      this.state.updateTask(editId, taskPayload);
    } else {
      this.state.addTask(taskPayload);
    }

    this.closeModal(this.taskModal);
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

  // --- Master Event Binding ---

  bindEvents() {
    // Theme toggle
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    // View Navigation Buttons (List, Calendar, Summary)
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-view-target]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view-target');
        this.state.setView(view);
      });
    });

    // Calendar month navigation
    const prevMonthBtn = document.getElementById('btn-prev-month');
    const nextMonthBtn = document.getElementById('btn-next-month');
    const todayMonthBtn = document.getElementById('btn-today-month');

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
        this.renderCalendarView();
      });
    }
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
        this.renderCalendarView();
      });
    }
    if (todayMonthBtn) {
      todayMonthBtn.addEventListener('click', () => {
        this.calendarDate = new Date();
        this.renderCalendarView();
      });
    }

    // Add Task Button triggers
    document.querySelectorAll('[data-action="open-add-task"]').forEach(btn => {
      btn.addEventListener('click', () => this.openAddModal());
    });

    // Close Modal Buttons
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) this.closeModal(modal);
      });
    });

    // Form submit
    this.taskForm.addEventListener('submit', (e) => this.handleTaskFormSubmit(e));
    this.taskDueDateInput.addEventListener('change', (e) => this.checkPastDate(e.target.value));

    // Modal Subtasks add / remove
    if (this.addSubtaskBtn && this.newSubtaskInput) {
      const addSubtask = () => {
        const val = this.newSubtaskInput.value.trim();
        if (val) {
          this.tempModalSubtasks.push({
            id: 'st-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            title: val,
            completed: false
          });
          this.newSubtaskInput.value = '';
          this.renderModalSubtasks();
        }
      };

      this.addSubtaskBtn.addEventListener('click', addSubtask);
      this.newSubtaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSubtask();
        }
      });
    }

    if (this.modalSubtasksContainer) {
      this.modalSubtasksContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-idx]');
        if (removeBtn) {
          const idx = parseInt(removeBtn.getAttribute('data-remove-idx'), 10);
          this.tempModalSubtasks.splice(idx, 1);
          this.renderModalSubtasks();
        }
      });
    }

    // Character counters
    const titleCounter = document.getElementById('title-char-counter');
    this.taskTitleInput.addEventListener('input', (e) => {
      if (titleCounter) titleCounter.textContent = `${e.target.value.length}/100`;
    });

    const descCounter = document.getElementById('desc-char-counter');
    this.taskDescInput.addEventListener('input', (e) => {
      if (descCounter) descCounter.textContent = `${e.target.value.length}/500`;
    });

    // Task List Card Delegated Actions
    this.taskListEl.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-action="toggle"]');
      if (toggle) {
        this.state.toggleComplete(toggle.getAttribute('data-id'));
        return;
      }

      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn) {
        this.openEditModal(editBtn.getAttribute('data-id'));
        return;
      }

      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn) {
        this.openDeleteModal(deleteBtn.getAttribute('data-id'));
        return;
      }

      const pomodoroBtn = e.target.closest('[data-action="start-pomodoro"]');
      if (pomodoroBtn) {
        this.openPomodoroForTask(pomodoroBtn.getAttribute('data-id'));
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

      const subtaskToggle = e.target.closest('[data-action="toggle-subtask"]');
      if (subtaskToggle) {
        const taskId = subtaskToggle.getAttribute('data-task-id');
        const subtaskId = subtaskToggle.getAttribute('data-subtask-id');
        this.state.toggleSubtask(taskId, subtaskId);
        return;
      }
    });

    // Calendar quick-add click
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
      calendarGrid.addEventListener('click', (e) => {
        const quickAddBtn = e.target.closest('[data-action="quick-add-date"]');
        if (quickAddBtn) {
          const date = quickAddBtn.getAttribute('data-date');
          this.openAddModal(date);
          return;
        }

        const editChip = e.target.closest('.calendar-task-chip');
        if (editChip) {
          const id = editChip.getAttribute('data-id');
          this.openEditModal(id);
          return;
        }
      });
    }

    // Delete Confirmation
    this.cancelDeleteBtn.addEventListener('click', () => this.closeModal(this.deleteModal));
    this.confirmDeleteBtn.addEventListener('click', () => {
      if (this.pendingDeleteId) {
        this.state.deleteTask(this.pendingDeleteId);
        this.closeModal(this.deleteModal);
      }
    });

    // Toast Close
    if (this.toastCloseBtn) {
      this.toastCloseBtn.addEventListener('click', () => this.hideToast());
    }

    // Status Filter buttons
    document.querySelectorAll('[data-filter-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-status]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.setFilter('status', btn.getAttribute('data-filter-status'));
      });
    });

    // Priority Filter buttons
    document.querySelectorAll('[data-filter-priority]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-priority]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.setFilter('priority', btn.getAttribute('data-filter-priority'));
      });
    });

    // Due Soon Filter buttons (Today, Tomorrow, This Week)
    document.querySelectorAll('[data-filter-due-soon]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-due-soon]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.setFilter('dueSoon', btn.getAttribute('data-filter-due-soon'));
      });
    });

    // Task Type Filter pills
    document.querySelectorAll('[data-filter-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.setFilter('taskType', btn.getAttribute('data-filter-type'));
      });
    });

    // Dynamic Course filter click delegation
    const courseListContainer = document.getElementById('course-filter-list');
    if (courseListContainer) {
      courseListContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filter-course]');
        if (btn) {
          const course = btn.getAttribute('data-filter-course');
          this.state.setFilter('course', course);
        }
      });
    }

    // Reset All Filters
    document.querySelectorAll('[data-action="clear-filters"]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-status]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-filter-status') === 'all');
        });
        document.querySelectorAll('[data-filter-priority]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-filter-priority') === 'all');
        });
        document.querySelectorAll('[data-filter-due-soon]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-filter-due-soon') === 'all');
        });
        document.querySelectorAll('[data-filter-type]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-filter-type') === 'all');
        });

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

    // Search Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          this.state.setSearch(e.target.value);
        }, 150);
      });
    }

    // --- JSON Export and Import (Phase 5) ---
    const exportJsonBtn = document.getElementById('btn-export-json');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        const jsonStr = TaskRepository.exportAsJSON();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Tasks exported to JSON successfully.', null, 3000);
      });
    }

    const importJsonInput = document.getElementById('import-json-file');
    if (importJsonInput) {
      importJsonInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = TaskRepository.importFromJSON(event.target.result);
            this.state.tasks = imported;
            this.state.notify();
            this.showToast(`Imported ${imported.length} tasks successfully.`, null, 4000);
          } catch (err) {
            this.showToast('Import failed: ' + err.message, null, 4000);
          }
          importJsonInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    // --- iCal (.ics) Calendar Export (Phase 6) ---
    const exportIcsBtn = document.getElementById('btn-export-ics');
    if (exportIcsBtn) {
      exportIcsBtn.addEventListener('click', () => {
        const icsContent = TaskRepository.generateIcsCalendar(this.state.tasks);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stask-coursework.ics';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Calendar (.ics) downloaded.', null, 4000);
      });
    }

    // AI Syllabus Helper Trigger
    const syllabusModal = document.getElementById('syllabus-modal');
    document.querySelectorAll('[data-action="open-syllabus-helper"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (syllabusModal) this.openModal(syllabusModal);
      });
    });
    this.initSyllabusHelper();

    // Keyboard Shortcuts (N, /, Enter, Esc, ?)
    const shortcutModal = document.getElementById('shortcuts-modal');
    document.querySelectorAll('[data-action="open-shortcuts-modal"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (shortcutModal) this.openModal(shortcutModal);
      });
    });

    window.addEventListener('keydown', (e) => {
      // If typing in an input or textarea, only Esc and Enter apply
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
          this.closeModal(modal);
        });
        return;
      }

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        this.openAddModal();
      } else if (e.key === '/') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        if (shortcutModal) this.openModal(shortcutModal);
      }
    });

    // Backdrop clicks close active modals
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });

    // --- Authentication Event Wiring ---
    if (this.tabLoginBtn) {
      this.tabLoginBtn.addEventListener('click', () => this.switchAuthTab('login'));
    }
    if (this.tabSignupBtn) {
      this.tabSignupBtn.addEventListener('click', () => this.switchAuthTab('signup'));
    }
    if (this.btnOpenLogin) {
      this.btnOpenLogin.addEventListener('click', () => this.openAuthModal('login'));
    }
    if (this.btnOpenSignup) {
      this.btnOpenSignup.addEventListener('click', () => this.openAuthModal('signup'));
    }
    if (this.btnSwitchAccount) {
      this.btnSwitchAccount.addEventListener('click', () => {
        if (this.userDropdownCard) this.userDropdownCard.classList.add('hidden');
        this.openAuthModal('login');
      });
    }

    if (this.userProfileBtn) {
      this.userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.userDropdownCard) {
          this.userDropdownCard.classList.toggle('hidden');
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#user-auth-widget') && this.userDropdownCard) {
        this.userDropdownCard.classList.add('hidden');
      }
    });

    // Password visibility toggle
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const textSpan = btn.querySelector('.password-toggle-text');
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            if (textSpan) textSpan.textContent = 'Hide';
          } else {
            input.type = 'password';
            if (textSpan) textSpan.textContent = 'Show';
          }
        }
      });
    });

    // Welcome view action buttons
    const welcomeStartBtn = document.getElementById('btn-welcome-start');
    if (welcomeStartBtn) {
      welcomeStartBtn.addEventListener('click', () => {
        this.state.setView('list');
      });
    }
    const welcomeAuthBtn = document.getElementById('btn-welcome-auth');
    if (welcomeAuthBtn) {
      welcomeAuthBtn.addEventListener('click', () => {
        this.openAuthModal('login');
      });
    }
    const brandBtn = document.querySelector('.brand');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        this.state.setView('welcome');
      });
    }

    // Pomodoro toggle from header
    const headerPomodoroBtn = document.getElementById('btn-header-pomodoro');
    if (headerPomodoroBtn) {
      headerPomodoroBtn.addEventListener('click', () => {
        const widget = document.getElementById('pomodoro-widget');
        if (widget) widget.classList.toggle('hidden');
      });
    }

    // Login Form Submit
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (this.loginErrorEl) this.loginErrorEl.textContent = '';

        try {
          const user = await AuthService.login({ email, password });
          this.closeModal(this.authModal);
          this.showToast(`Welcome back, ${user.name}.`, null, 3500);
        } catch (err) {
          if (this.loginErrorEl) this.loginErrorEl.textContent = err.message;
        }
      });
    }

    // Sign Up Form Submit
    if (this.signupForm) {
      this.signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const major = document.getElementById('signup-major').value.trim();
        const password = document.getElementById('signup-password').value;
        if (this.signupErrorEl) this.signupErrorEl.textContent = '';

        try {
          const user = await AuthService.signUp({ name, email, password, major });
          this.closeModal(this.authModal);
          this.showToast(`Account created. Welcome, ${user.name}.`, null, 3500);
        } catch (err) {
          if (this.signupErrorEl) this.signupErrorEl.textContent = err.message;
        }
      });
    }

    // Demo Login button
    if (this.btnDemoLogin) {
      this.btnDemoLogin.addEventListener('click', () => {
        const user = AuthService.loginDemo();
        if (user) {
          this.closeModal(this.authModal);
          this.showToast(`Logged in as demo student (${user.name}).`, null, 3500);
        }
      });
    }

    // Logout button
    if (this.btnUserLogout) {
      this.btnUserLogout.addEventListener('click', () => {
        AuthService.logout();
        if (this.userDropdownCard) this.userDropdownCard.classList.add('hidden');
        this.showToast('Signed out of student account.', null, 3000);
      });
    }

    // Listen for auth state changes
    window.addEventListener('app:auth-changed', () => {
      this.renderUserAuth();
      this.render();
    });
  }

  // --- User Auth Render & Tabs Helper ---

  renderUserAuth() {
    const user = AuthService.getCurrentUser();
    if (user) {
      if (this.userProfileMenu) this.userProfileMenu.classList.remove('hidden');
      if (this.authButtonsGroup) this.authButtonsGroup.classList.add('hidden');

      const names = user.name.trim().split(/\s+/);
      const initials = names.length > 1
        ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
        : names[0].slice(0, 2).toUpperCase();

      if (this.headerUserAvatar) this.headerUserAvatar.textContent = initials;
      if (this.dropdownUserAvatar) this.dropdownUserAvatar.textContent = initials;
      if (this.dropdownUserName) this.dropdownUserName.textContent = user.name;
      if (this.dropdownUserEmail) this.dropdownUserEmail.textContent = user.email;
      if (this.dropdownUserMajor) this.dropdownUserMajor.textContent = user.major || 'Student';
    } else {
      if (this.userProfileMenu) this.userProfileMenu.classList.add('hidden');
      if (this.authButtonsGroup) this.authButtonsGroup.classList.remove('hidden');
    }
  }

  switchAuthTab(tab) {
    if (tab === 'login') {
      if (this.tabLoginBtn) this.tabLoginBtn.classList.add('active');
      if (this.tabSignupBtn) this.tabSignupBtn.classList.remove('active');
      if (this.loginForm) this.loginForm.classList.remove('hidden');
      if (this.signupForm) this.signupForm.classList.add('hidden');
    } else {
      if (this.tabSignupBtn) this.tabSignupBtn.classList.add('active');
      if (this.tabLoginBtn) this.tabLoginBtn.classList.remove('active');
      if (this.signupForm) this.signupForm.classList.remove('hidden');
      if (this.loginForm) this.loginForm.classList.add('hidden');
    }
    if (this.loginErrorEl) this.loginErrorEl.textContent = '';
    if (this.signupErrorEl) this.signupErrorEl.textContent = '';
  }

  openAuthModal(tab = 'login') {
    this.switchAuthTab(tab);
    if (this.authModal) this.openModal(this.authModal);
  }
}
