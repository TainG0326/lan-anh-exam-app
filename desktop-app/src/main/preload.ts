import { contextBridge, ipcRenderer } from 'electron';

export interface LockdownAPI {
  activate: () => Promise<{ success: boolean }>;
  deactivate: () => Promise<{ success: boolean }>;
  isActive: () => Promise<{ active: boolean }>;
  verifyMasterPassword: (password: string) => Promise<{ success: boolean }>;
  emergencyExit: () => Promise<{ success: boolean }>;
  onLockdownStatus: (callback: (data: { active: boolean }) => void) => () => void;
  onShortcutBlocked: (callback: (data: { shortcut: string }) => void) => () => void;
  onViolationRecorded: (callback: (data: any) => void) => () => void;
  onEmergencyExitRequested: (callback: () => void) => () => void;
}

export interface ExamAPI {
  recordViolation: (violation: { type: string; details: string }) => Promise<{ success: boolean }>;
  setExamId: (examId: string) => Promise<{ success: boolean }>;
}

export interface AppAPI {
  getInfo: () => Promise<{ version: string; platform: string; isLockdown: boolean }>;
}

const lockdownAPI: LockdownAPI = {
  activate: () => ipcRenderer.invoke('lockdown:activate'),
  deactivate: () => ipcRenderer.invoke('lockdown:deactivate'),
  isActive: () => ipcRenderer.invoke('lockdown:is-active'),
  verifyMasterPassword: (password) => ipcRenderer.invoke('lockdown:verify-master-password', password),
  emergencyExit: () => ipcRenderer.invoke('lockdown:emergency-exit'),
  onLockdownStatus: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { active: boolean }) => callback(data);
    ipcRenderer.on('lockdown-status', handler);
    return () => ipcRenderer.removeListener('lockdown-status', handler);
  },
  onShortcutBlocked: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { shortcut: string }) => callback(data);
    ipcRenderer.on('shortcut-blocked', handler);
    return () => ipcRenderer.removeListener('shortcut-blocked', handler);
  },
  onViolationRecorded: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('violation-recorded', handler);
    return () => ipcRenderer.removeListener('violation-recorded', handler);
  },
  onEmergencyExitRequested: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('emergency-exit-requested', handler);
    return () => ipcRenderer.removeListener('emergency-exit-requested', handler);
  },
};

const examAPI: ExamAPI = {
  recordViolation: (violation) => ipcRenderer.invoke('exam:record-violation', violation),
  setExamId: (examId) => ipcRenderer.invoke('exam:set-exam-id', examId),
};

const appAPI: AppAPI = {
  getInfo: () => ipcRenderer.invoke('app:get-info'),
};

contextBridge.exposeInMainWorld('lockdown', lockdownAPI);
contextBridge.exposeInMainWorld('exam', examAPI);
contextBridge.exposeInMainWorld('app', appAPI);
