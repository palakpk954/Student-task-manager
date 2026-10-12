/**
 * STask - Taskon Academic Guide & Mascot Assistant
 * Provides interactive Q&A, contextual assistance, and guided tour.
 * Minimalist design without emojis.
 */

export class TaskonGuide {
  constructor(appUI, appState) {
    this.appUI = appUI;
    this.state = appState;

    this.isOpen = false;
    this.currentTourStep = 0;
    this.tourActive = false;

    this.knowledgeBase = [
      {
        id: 'add-task',
        keywords: ['add', 'create', 'new task', 'make task', 'insert', 'assignment'],
        question: 'How do I add a new task?',
        answer: 'To add a new task, click the "+ Add Task" button in the top navigation or press the "N" key on your keyboard. Fill in the title, course, due date, priority, and estimated study duration, then click "Create Task".',
        actionLabel: 'Open Add Task Form',
        action: () => this.appUI.openTaskModal()
      },
      {
        id: 'calendar',
        keywords: ['calendar', 'month', 'schedule', 'dates', 'view calendar', 'days'],
        question: 'How does the Calendar view work?',
        answer: 'The Calendar view provides an interactive monthly overview of all course deadlines. Days with tasks display color-coded priority chips. You can click on any task chip to edit it, or click the "+" on any date cell to quickly schedule an assignment for that specific day.',
        actionLabel: 'Open Calendar View',
        action: () => this.appUI.switchView('calendar')
      },
      {
        id: 'pomodoro',
        keywords: ['pomodoro', 'timer', 'focus', 'study timer', 'clock', 'chime', 'bell'],
        question: 'What is the Pomodoro Focus Timer?',
        answer: 'The Pomodoro timer helps you study in structured intervals (25 minutes focus, 5 minutes short break, 15 minutes long break). It includes an integrated browser synthesizer chime when intervals conclude. You can launch it using the clock icon in the top header.',
        actionLabel: 'Open Focus Timer',
        action: () => this.appUI.openPomodoroWidget()
      },
      {
        id: 'streak',
        keywords: ['streak', 'daily streak', 'flame', 'habit', 'progress', 'analytics'],
        question: 'How does the Study Streak work?',
        answer: 'Your streak increases each consecutive day you complete at least one academic task. It is displayed as the "Streak" pill in the header. Keeping a consistent daily study routine helps you maintain momentum across the semester.',
        actionLabel: 'View Analytics',
        action: () => this.appUI.switchView('summary')
      },
      {
        id: 'filter-search',
        keywords: ['filter', 'search', 'find', 'subject', 'course', 'priority', 'status', 'tag'],
        question: 'How do I filter and search assignments?',
        answer: 'Use the left sidebar to combine filters by Status (All, Pending, Completed), Priority (High, Medium, Low), and Courses (e.g. CS 301, MATH 240). You can also press "/" to instantly focus the search bar and find assignments by keyword.',
        actionLabel: 'Go to Tasks View',
        action: () => this.appUI.switchView('list')
      },
      {
        id: 'dark-mode',
        keywords: ['dark mode', 'theme', 'light mode', 'night', 'colors', 'appearance'],
        question: 'How do I switch between Light and Dark mode?',
        answer: 'Click the theme toggle icon (sun/moon) in the top header. STask features custom paper crumble shading textures across both crisp light mode and deep obsidian dark mode.',
        actionLabel: 'Toggle Theme',
        action: () => this.appUI.toggleTheme()
      },
      {
        id: 'export-import',
        keywords: ['export', 'import', 'backup', 'json', 'ics', 'calendar export', 'google calendar', 'syllabus'],
        question: 'How do I import or export my tasks?',
        answer: 'In the sidebar under "Sync & Export", you can: (1) Export JSON to back up all assignments, (2) Import JSON to restore data, (3) Export .ics to sync deadlines with Google Calendar or Apple Calendar, or (4) Click the document icon in the header to parse a raw syllabus text into tasks.',
        actionLabel: 'Open Syllabus Parser',
        action: () => this.appUI.openSyllabusModal()
      },
      {
        id: 'shortcuts',
        keywords: ['shortcuts', 'keyboard', 'hotkey', 'keys', 'press'],
        question: 'What keyboard shortcuts are available?',
        answer: 'STask includes power-user shortcuts: "N" = New task, "/" = Focus search, "Esc" = Close dialogs, "Enter" = Save task in forms. Click the question mark icon in the header anytime to view the complete cheatsheet.',
        actionLabel: 'View Shortcuts',
        action: () => this.appUI.openShortcutsModal()
      },
      {
        id: 'edit-delete',
        keywords: ['edit', 'delete', 'remove', 'modify', 'change task', 'undo'],
        question: 'How do I edit, delete, or undo actions?',
        answer: 'Hover over any task card to reveal quick actions: edit, duplicate, or delete. If you delete or complete a task by mistake, a toast notification with an "Undo" button appears at the bottom of the screen.',
        actionLabel: 'View Tasks',
        action: () => this.appUI.switchView('list')
      },
      {
        id: 'auth',
        keywords: ['login', 'sign up', 'register', 'account', 'auth', 'password', 'user', 'profile'],
        question: 'How does user authentication work?',
        answer: 'Click the user badge or "Sign In / Register" in the top right to access account features. STask stores user profiles with SHA-256 hashed passwords and keeps each student account workspace organized locally.',
        actionLabel: 'Manage Account',
        action: () => this.appUI.openAuthModal('login')
      }
    ];

    this.tourSteps = [
      {
        target: '.brand',
        title: 'STask Brand & Home',
        text: 'Click the STask logo at any time to return to the clean Welcome screen or switch between your academic views.'
      },
      {
        target: '.view-tabs-nav',
        title: 'Workspace Views',
        text: 'Switch seamlessly between the Task Feed, Interactive Month Calendar, and Weekly Analytics.'
      },
      {
        target: '.metrics-container',
        title: 'Task Metrics & Streaks',
        text: 'Get an instant overview of Total, Pending, Completed, and Overdue deadlines, with daily completion progress.'
      },
      {
        target: '#app-sidebar',
        title: 'Sidebar & Quick Filters',
        text: 'Filter assignments by status, priority, or specific university courses, or export deadlines directly to your calendar (.ics).'
      },
      {
        target: '#search-input',
        title: 'Instant Search',
        text: 'Press "/" anywhere on your keyboard to instantly search coursework by title, notes, or course codes.'
      },
      {
        target: '#tasks-container',
        title: 'Task Feed & Drag-and-Drop',
        text: 'View all assignments ordered by deadline or priority. Drag tasks to reorder, check them off to build your streak, or view sub-checklists.'
      },
      {
        target: '#btn-header-pomodoro',
        title: 'Pomodoro Focus Timer',
        text: 'Stay in the zone using the built-in study timer with custom intervals and acoustic synthesizer chimes.'
      }
    ];

    this.chatHistory = [];
    this.initDOM();
  }

  initDOM() {
    // Create Floating Mascot Trigger Button
    const trigger = document.createElement('div');
    trigger.id = 'taskon-mascot-trigger';
    trigger.className = 'taskon-mascot-trigger';
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-label', 'Open Taskon Assistant Guide');
    trigger.innerHTML = `
      <div class="taskon-mascot-avatar-box">
        <img src="assets/taskon.png" alt="Taskon Mascot" class="taskon-avatar-img">
        <span class="taskon-pulse-ring"></span>
      </div>
      <div class="taskon-bubble-hint" id="taskon-bubble-hint">
        <span class="taskon-hint-title">Hi, I'm Taskon!</span>
        <span class="taskon-hint-sub">Click for help & guide</span>
      </div>
    `;

    document.body.appendChild(trigger);

    // Create Taskon Guide Modal / Panel
    const modal = document.createElement('div');
    modal.id = 'taskon-modal';
    modal.className = 'modal-backdrop hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'taskon-dialog-title');

    modal.innerHTML = `
      <div class="modal-panel taskon-panel">
        <div class="taskon-panel-header">
          <div class="taskon-header-brand">
            <img src="assets/taskon.png" alt="Taskon" class="taskon-header-avatar">
            <div>
              <div class="taskon-header-title-row">
                <h2 id="taskon-dialog-title" class="taskon-panel-title">Taskon Guide</h2>
                <span class="taskon-badge">Academic Mascot</span>
              </div>
              <p class="taskon-header-status">Interactive Student Assistant & Knowledge Guide</p>
            </div>
          </div>
          <button type="button" class="modal-close-btn" id="taskon-close-btn" aria-label="Close Taskon Guide">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="taskon-panel-body">
          <!-- Mascot Hero Banner -->
          <div class="taskon-intro-card">
            <div class="taskon-intro-text">
              <h3 class="taskon-intro-heading">Hello! How can I help you today?</h3>
              <p class="taskon-intro-desc">
                I can answer questions about STask, walk you through features, or help you organize your coursework. Select a common topic below or ask me anything.
              </p>
            </div>
            <div class="taskon-intro-actions">
              <button type="button" class="btn-taskon-tour" id="btn-start-app-tour">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Take Guided Tour</span>
              </button>
            </div>
          </div>

          <!-- Quick Question Suggestions -->
          <div class="taskon-suggestions-section">
            <span class="taskon-section-label">Suggested Questions:</span>
            <div class="taskon-chips-grid" id="taskon-chips-grid">
              ${this.knowledgeBase.slice(0, 6).map(item => `
                <button type="button" class="taskon-query-chip" data-kb-id="${item.id}">
                  <span>${item.question}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Interactive Q&A Conversation Feed -->
          <div class="taskon-chat-container">
            <div class="taskon-chat-feed" id="taskon-chat-feed">
              <div class="taskon-message message-bot">
                <div class="taskon-msg-avatar">
                  <img src="assets/taskon.png" alt="Taskon">
                </div>
                <div class="taskon-msg-content">
                  <p>Welcome! Type any question below or pick a suggestion above to get step-by-step guidance.</p>
                </div>
              </div>
            </div>

            <!-- Query Input Box -->
            <form class="taskon-input-form" id="taskon-input-form">
              <input type="text" id="taskon-user-input" class="taskon-input-field" placeholder="Ask Taskon (e.g., 'How to add a task', 'Calendar', 'Pomodoro')..." autocomplete="off">
              <button type="submit" class="btn-taskon-send" id="btn-taskon-send" aria-label="Send Question">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Tour Overlay Element
    const tourOverlay = document.createElement('div');
    tourOverlay.id = 'taskon-tour-overlay';
    tourOverlay.className = 'taskon-tour-overlay hidden';
    tourOverlay.innerHTML = `
      <div class="taskon-tour-card" id="taskon-tour-card">
        <div class="taskon-tour-header">
          <img src="assets/taskon.png" alt="Taskon" class="taskon-tour-avatar">
          <span class="taskon-tour-step-pill" id="taskon-tour-step-pill">Step 1 of 7</span>
        </div>
        <h4 class="taskon-tour-title" id="taskon-tour-title">Tour Step</h4>
        <p class="taskon-tour-text" id="taskon-tour-text">Tour description</p>
        <div class="taskon-tour-footer">
          <button type="button" class="btn-tour-secondary" id="btn-tour-skip">Skip</button>
          <div class="taskon-tour-nav">
            <button type="button" class="btn-tour-secondary" id="btn-tour-prev">Previous</button>
            <button type="button" class="btn-tour-primary" id="btn-tour-next">Next</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(tourOverlay);

    this.bindEvents();
  }

  bindEvents() {
    const trigger = document.getElementById('taskon-mascot-trigger');
    const modal = document.getElementById('taskon-modal');
    const closeBtn = document.getElementById('taskon-close-btn');
    const form = document.getElementById('taskon-input-form');
    const input = document.getElementById('taskon-user-input');
    const chipsGrid = document.getElementById('taskon-chips-grid');
    const tourBtn = document.getElementById('btn-start-app-tour');

    // Header guide button support
    const headerGuideBtn = document.getElementById('btn-header-taskon');
    if (headerGuideBtn) {
      headerGuideBtn.addEventListener('click', () => this.open());
    }

    if (trigger) {
      trigger.addEventListener('click', () => this.open());
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.open();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });
    }

    // Suggested query chips
    if (chipsGrid) {
      chipsGrid.addEventListener('click', (e) => {
        const chip = e.target.closest('.taskon-query-chip');
        if (!chip) return;
        const kbId = chip.getAttribute('data-kb-id');
        const item = this.knowledgeBase.find(k => k.id === kbId);
        if (item) {
          this.askQuestion(item.question, item);
        }
      });
    }

    // Question form submit
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;
        input.value = '';
        this.processUserQuery(query);
      });
    }

    // Guided Tour Controls
    if (tourBtn) {
      tourBtn.addEventListener('click', () => {
        this.close();
        this.startTour();
      });
    }

    const tourSkipBtn = document.getElementById('btn-tour-skip');
    const tourPrevBtn = document.getElementById('btn-tour-prev');
    const tourNextBtn = document.getElementById('btn-tour-next');

    if (tourSkipBtn) tourSkipBtn.addEventListener('click', () => this.endTour());
    if (tourPrevBtn) tourPrevBtn.addEventListener('click', () => this.prevTourStep());
    if (tourNextBtn) tourNextBtn.addEventListener('click', () => this.nextTourStep());

    // Dismiss bubble hint on first click or after 7s
    setTimeout(() => {
      const hint = document.getElementById('taskon-bubble-hint');
      if (hint) hint.classList.add('fade-out');
    }, 7000);
  }

  open() {
    const modal = document.getElementById('taskon-modal');
    if (!modal) return;
    this.isOpen = true;
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const input = document.getElementById('taskon-user-input');
    if (input) setTimeout(() => input.focus(), 150);
  }

  close() {
    const modal = document.getElementById('taskon-modal');
    if (!modal) return;
    this.isOpen = false;
    modal.classList.remove('active');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  askQuestion(question, item) {
    this.addMessage(question, 'user');
    setTimeout(() => {
      this.addMessage(item.answer, 'bot', item.actionLabel, item.action);
    }, 200);
  }

  processUserQuery(query) {
    this.addMessage(query, 'user');

    const qLower = query.toLowerCase();

    // Find best match in knowledge base
    let bestMatch = null;
    let highestScore = 0;

    for (const item of this.knowledgeBase) {
      let score = 0;
      for (const kw of item.keywords) {
        if (qLower.includes(kw)) score += 2;
      }
      if (item.question.toLowerCase().includes(qLower)) score += 3;
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    setTimeout(() => {
      if (bestMatch && highestScore > 0) {
        this.addMessage(bestMatch.answer, 'bot', bestMatch.actionLabel, bestMatch.action);
      } else {
        // Fallback comprehensive answer
        const fallback = `I can help with that! In STask, you can manage assignments from the Tasks view, schedule via Calendar, track productivity in Analytics, or use keyboard shortcuts (N for new task, / to search). Would you like to take a quick guided tour?`;
        this.addMessage(fallback, 'bot', 'Start Guided Tour', () => {
          this.close();
          this.startTour();
        });
      }
    }, 250);
  }

  addMessage(text, sender, actionLabel = null, actionCallback = null) {
    const chatFeed = document.getElementById('taskon-chat-feed');
    if (!chatFeed) return;

    const msgEl = document.createElement('div');
    msgEl.className = `taskon-message message-${sender}`;

    if (sender === 'bot') {
      const actionHtml = actionLabel ? `
        <div class="taskon-msg-actions">
          <button type="button" class="btn-taskon-action-trigger">
            <span>${actionLabel}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      ` : '';

      msgEl.innerHTML = `
        <div class="taskon-msg-avatar">
          <img src="assets/taskon.png" alt="Taskon">
        </div>
        <div class="taskon-msg-content">
          <p>${this.escapeHtml(text)}</p>
          ${actionHtml}
        </div>
      `;

      if (actionCallback) {
        const btn = msgEl.querySelector('.btn-taskon-action-trigger');
        if (btn) {
          btn.addEventListener('click', () => {
            this.close();
            actionCallback();
          });
        }
      }
    } else {
      msgEl.innerHTML = `
        <div class="taskon-msg-content user-bubble">
          <p>${this.escapeHtml(text)}</p>
        </div>
      `;
    }

    chatFeed.appendChild(msgEl);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  // --- Guided Tour Engine ---

  startTour() {
    this.tourActive = true;
    this.currentTourStep = 0;
    const overlay = document.getElementById('taskon-tour-overlay');
    if (overlay) overlay.classList.remove('hidden');

    // Make sure we are on the list workspace
    this.appUI.switchView('list');
    this.renderTourStep();
  }

  renderTourStep() {
    const step = this.tourSteps[this.currentTourStep];
    if (!step) {
      this.endTour();
      return;
    }

    const pill = document.getElementById('taskon-tour-step-pill');
    const title = document.getElementById('taskon-tour-title');
    const text = document.getElementById('taskon-tour-text');
    const prevBtn = document.getElementById('btn-tour-prev');
    const nextBtn = document.getElementById('btn-tour-next');
    const card = document.getElementById('taskon-tour-card');

    if (pill) pill.textContent = `Step ${this.currentTourStep + 1} of ${this.tourSteps.length}`;
    if (title) title.textContent = step.title;
    if (text) text.textContent = step.text;
    if (prevBtn) prevBtn.disabled = this.currentTourStep === 0;
    if (nextBtn) nextBtn.textContent = this.currentTourStep === this.tourSteps.length - 1 ? 'Finish' : 'Next';

    // Clear previous highlights
    document.querySelectorAll('.taskon-tour-highlight').forEach(el => {
      el.classList.remove('taskon-tour-highlight');
    });

    const targetEl = document.querySelector(step.target);
    if (targetEl) {
      targetEl.classList.add('taskon-tour-highlight');
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  nextTourStep() {
    if (this.currentTourStep < this.tourSteps.length - 1) {
      this.currentTourStep++;
      this.renderTourStep();
    } else {
      this.endTour();
    }
  }

  prevTourStep() {
    if (this.currentTourStep > 0) {
      this.currentTourStep--;
      this.renderTourStep();
    }
  }

  endTour() {
    this.tourActive = false;
    const overlay = document.getElementById('taskon-tour-overlay');
    if (overlay) overlay.classList.add('hidden');

    document.querySelectorAll('.taskon-tour-highlight').forEach(el => {
      el.classList.remove('taskon-tour-highlight');
    });

    this.appUI.showToast('Tour completed! Click Taskon anytime for questions.', null, 4000);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
