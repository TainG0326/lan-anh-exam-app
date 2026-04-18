const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Exit & Password
  verifyPassword: (password) => ipcRenderer.invoke('exit:verify-password', password),

  // Focus Violation
  reportFocusViolation: () => ipcRenderer.invoke('focus:violation'),

  // Lockdown Status
  getLockdownStatus: () => ipcRenderer.invoke('lockdown:get-status'),
  submitExam: () => ipcRenderer.invoke('lockdown:submit-exam'),

  // App Info
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  quit: () => ipcRenderer.invoke('app:quit'),

  // Update IPC
  startUpdateDownload: (url) => ipcRenderer.invoke('update:start-download', url),
  installAndRestart: () => ipcRenderer.invoke('update:install-restart'),
  updateComplete: () => ipcRenderer.invoke('update:complete'),
  onUpdateUI: (callback) => {
    ipcRenderer.on('update-ui', (_event, data) => callback(data));
  },

  // Auth - Test Account Bypass
  checkTestAccount: (email) => ipcRenderer.invoke('auth:check-test-account', email),
  verifyCredentials: (email, password) => ipcRenderer.invoke('auth:verify-credentials', email, password),
  setTestAccountLogin: (isTestAccount) => ipcRenderer.invoke('auth:set-test-account-login', isTestAccount),

  // Auth - Login Timeout Management
  startLoginTimeout: () => ipcRenderer.invoke('auth:start-login-timeout'),
  clearLoginTimeout: () => ipcRenderer.invoke('auth:clear-login-timeout'),

  // Event listeners
  onLockdownActivated: (callback) => ipcRenderer.on('lockdown-activated', callback),
  onLockdownDeactivated: (callback) => ipcRenderer.on('lockdown-deactivated', callback),
  onShortcutBlocked: (callback) => ipcRenderer.on('shortcut-blocked', (_event, data) => callback(data)),
  onFocusViolation: (callback) => ipcRenderer.on('focus-violation', (_event, data) => callback(data)),
  onRequestExit: (callback) => ipcRenderer.on('request-exit', callback),
});
