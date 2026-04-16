import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'LanAnhExam2024!';
const LOG_FILE = path.join(app.getPath('userData'), 'exam-lockdown.log');

let mainWindow: BrowserWindow | null = null;
let isLockdownActive = false;
let currentExamId: string | null = null;

function log(msg: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch {}
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: true,
    frame: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    movable: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    backgroundColor: '#0f172a',
    title: 'Exam Lockdown Browser',
  });

  // Enable content protection (black out screenshots/recordings on Windows)
  mainWindow.setContentProtection(true);

  // Set skip taskbar appropriately for lockdown
  mainWindow.setSkipTaskbarPositioning(true);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open devtools in a detached window in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../renderer/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.webContents.on('did-finish-load', () => {
    log('Renderer loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    log(`Failed to load: ${errorCode} - ${errorDescription}`, 'ERROR');
  });

  // Prevent new windows/popups
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function activateLockdown() {
  if (isLockdownActive) return;
  isLockdownActive = true;
  log('LOCKDOWN ACTIVATED');

  if (mainWindow) {
    // Fullscreen kiosk mode
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true);

    // Hide menu bar
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);

    // Content protection for screenshots
    mainWindow.setContentProtection(true);

    // Notify renderer
    mainWindow.webContents.send('lockdown-status', { active: true });
  }

  // Block global shortcuts
  const shortcutsToBlock = [
    'Alt+Tab',
    'Alt+F4',
    'Super_L',
    'Super_R',
    'CommandOrControl+Alt+Delete',
    'CommandOrControl+Shift+Esc',
    'F11',
    'F5',
    'CommandOrControl+Shift+R',
    'CommandOrControl+R',
    'CommandOrControl+N',
    'CommandOrControl+T',
    'CommandOrControl+W',
    'CommandOrControl+P',
    'CommandOrControl+S',
    'CommandOrControl+O',
    'CommandOrControl+Shift+I',
    'CommandOrControl+Shift+J',
    'CommandOrControl+Shift+C',
    'CommandOrControl+Shift+M',
    'F12',
    'CommandOrControl+Shift+3',
    'CommandOrControl+Shift+4',
    'PrintScreen',
  ];

  for (const shortcut of shortcutsToBlock) {
    try {
      globalShortcut.register(shortcut, () => {
        log(`Blocked shortcut: ${shortcut}`, 'WARN');
        mainWindow?.webContents.send('shortcut-blocked', { shortcut });
      });
    } catch (e) {
      log(`Failed to register shortcut ${shortcut}: ${e}`, 'WARN');
    }
  }

  // Register emergency exit combo: Ctrl+Alt+Shift+L
  try {
    globalShortcut.register('CommandOrControl+Alt+Shift+L', () => {
      log('Emergency exit combo triggered', 'WARN');
      mainWindow?.webContents.send('emergency-exit-requested');
    });
  } catch (e) {
    log(`Failed to register emergency exit shortcut: ${e}`, 'WARN');
  }

  log('All global shortcuts registered');
}

function deactivateLockdown() {
  if (!isLockdownActive) return;
  isLockdownActive = false;
  log('LOCKDOWN DEACTIVATED');

  if (mainWindow) {
    mainWindow.setFullScreen(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setMenuBarVisibility(true);
    mainWindow.setAutoHideMenuBar(false);
    mainWindow.setContentProtection(false);
    mainWindow.webContents.send('lockdown-status', { active: false });
  }

  globalShortcut.unregisterAll();
  log('Global shortcuts unregistered');
}

// IPC Handlers
ipcMain.handle('lockdown:activate', () => {
  activateLockdown();
  return { success: true };
});

ipcMain.handle('lockdown:deactivate', () => {
  deactivateLockdown();
  return { success: true };
});

ipcMain.handle('lockdown:is-active', () => {
  return { active: isLockdownActive };
});

ipcMain.handle('lockdown:verify-master-password', (_event, password: string) => {
  const valid = password === MASTER_PASSWORD;
  if (valid) {
    log('Master password verified — lockdown deactivated');
    deactivateLockdown();
  } else {
    log('Invalid master password attempt', 'WARN');
  }
  return { success: valid };
});

ipcMain.handle('lockdown:emergency-exit', () => {
  mainWindow?.webContents.send('emergency-exit-requested');
  return { success: true };
});

ipcMain.handle('exam:record-violation', (_event, violation: { type: string; details: string }) => {
  log(`VIOLATION: [${violation.type}] ${violation.details}`, 'WARN');

  // Also try to send to server if we have exam info
  if (currentExamId && mainWindow) {
    mainWindow.webContents.send('violation-recorded', violation);
  }
  return { success: true };
});

ipcMain.handle('exam:set-exam-id', (_event, examId: string) => {
  currentExamId = examId;
  log(`Exam ID set: ${examId}`);
  return { success: true };
});

ipcMain.handle('app:get-info', () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    isLockdown: isLockdownActive,
  };
});

// Prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));

  contents.on('will-navigate', (event, url) => {
    const allowedOrigins = ['http://localhost:5173', 'file://'];
    const isAllowed = allowedOrigins.some((origin) => url.startsWith(origin));
    if (!isAllowed) {
      log(`Blocked navigation to: ${url}`, 'WARN');
      event.preventDefault();
    }
  });

  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
    log('Blocked webview creation', 'WARN');
  });
});

// Handle renderer crashed
app.on('renderer-process-crashed', (_event, webContents, killed) => {
  log(`Renderer process crashed (killed=${killed})`, 'ERROR');
  deactivateLockdown();
});

app.on('render-process-gone', (_event, webContents, details) => {
  log(`Render process gone: ${details.reason}`, 'ERROR');
  deactivateLockdown();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  log('Application quitting');
});

app.whenReady().then(() => {
  log('Application starting');
  createWindow();
});
