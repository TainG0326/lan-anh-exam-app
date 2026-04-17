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
  startUpdateDownload: () => ipcRenderer.invoke('update:start-download'),
  installAndRestart: () => ipcRenderer.invoke('update:install-restart'),
  updateComplete: () => ipcRenderer.invoke('update:complete'),
  onUpdateUI: (callback) => {
    ipcRenderer.on('update-ui', (_event, data) => callback(data));
  },

  // Event listeners
  onLockdownActivated: (callback) => ipcRenderer.on('lockdown-activated', callback),
  onLockdownDeactivated: (callback) => ipcRenderer.on('lockdown-deactivated', callback),
  onShortcutBlocked: (callback) => ipcRenderer.on('shortcut-blocked', (_event, data) => callback(data)),
  onFocusViolation: (callback) => ipcRenderer.on('focus-violation', (_event, data) => callback(data)),
  onRequestExit: (callback) => ipcRenderer.on('request-exit', callback),
});
