/**
 * Student Task Manager - Application Entry Point
 */

import { appState } from './state.js';
import { UIManager } from './ui.js';
import { TaskonGuide } from './taskon.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIManager(appState);
  ui.init();
  appState.init();

  const taskon = new TaskonGuide(ui, appState);
  window.appTaskon = taskon;

  console.log('Student Task Manager initialized successfully with Taskon Guide.');
});
