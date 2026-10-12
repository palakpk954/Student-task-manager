/**
 * Student Task Manager - Authentication Module
 * Manages user registration, login, SHA-256 password hashing,
 * session management, and per-user data isolation.
 */

const USERS_STORAGE_KEY = 'student_task_manager_users_v1';
const CURRENT_USER_KEY = 'student_task_manager_current_user_v1';

export class AuthService {
  // Utility: Hash password using browser Web Crypto API (SHA-256)
  static async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static getUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      if (!data) {
        // Seed initial demo student user
        const demoUsers = [
          {
            id: 'user-demo-1',
            name: 'Maya Lin',
            email: 'maya@university.edu',
            // Pre-hashed 'password123' (SHA-256)
            passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
            major: 'Computer Science',
            avatarColor: '#106EBE',
            createdAt: Date.now()
          }
        ];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(demoUsers));
        return demoUsers;
      }
      return JSON.parse(data) || [];
    } catch (e) {
      console.error('Error reading users from storage:', e);
      return [];
    }
  }

  static saveUsers(users) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return true;
    } catch (e) {
      console.error('Error saving users to storage:', e);
      return false;
    }
  }

  static getCurrentUser() {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (!data) {
        // By default, log in as Demo user so app remains immediately functional
        const users = this.getUsers();
        if (users.length > 0) {
          this.setCurrentUser(users[0]);
          return users[0];
        }
        return null;
      }
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  static setCurrentUser(user) {
    if (user) {
      // Don't store password hash in session
      const { passwordHash, ...safeUser } = user;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    // Dispatch auth change event
    window.dispatchEvent(new CustomEvent('app:auth-changed', { detail: { user } }));
  }

  static async signUp({ name, email, password, major }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) throw new Error('Full name is required.');
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Valid email address is required.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long.');

    const users = this.getUsers();
    const exists = users.some(u => u.email === cleanEmail);
    if (exists) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const passwordHash = await this.hashPassword(password);
    const avatarColors = ['#106EBE', '#0078D4', '#005A9E', '#004578', '#0E7090', '#058A67', '#0F9D70'];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const newUser = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      major: (major || 'General Studies').trim(),
      avatarColor,
      createdAt: Date.now()
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);
    return newUser;
  }

  static async login({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Please enter both email and password.');
    }

    const users = this.getUsers();
    const user = users.find(u => u.email === cleanEmail);
    if (!user) {
      throw new Error('No account found with this email address.');
    }

    const passwordHash = await this.hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    this.setCurrentUser(user);
    return user;
  }

  static logout() {
    this.setCurrentUser(null);
  }

  // Quick Guest / Demo Login helper
  static loginDemo() {
    const users = this.getUsers();
    if (users.length > 0) {
      this.setCurrentUser(users[0]);
      return users[0];
    }
    return null;
  }
}
