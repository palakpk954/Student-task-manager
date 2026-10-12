/**
 * Student Task Manager - Application Entry Point
 */

import { appState } from './state.js';
import { UIManager } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UIManager(appState);
  ui.init();
  appState.init();

  console.log('Student Task Manager initialized successfully.');
});
