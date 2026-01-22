const { app, BrowserWindow, globalShortcut, screen, ipcMain, dialog } = require('electron');
const path = require('path');
const crypto = require('crypto');

// Lockdown configuration
const LOCKDOWN_CONFIG = {
  SECRET_KEY: process.env.EXAM_SECRET_KEY || 'your-secret-key-change-in-production',
  API_URL: process.env.API_URL || 'http://localhost:5000',
  KIOSK_MODE: true,
  BLOCK_SCREENSHOT: true,
  BLOCK_VM: true,
};

let mainWindow = null;
let isLockdownActive = false;
let examId = null;
let examHash = null;

// Detect Virtual Machine
function detectVirtualMachine() {
  // This will be checked in renderer process via WebGL
  return false; // Will be set by renderer
}

// Generate Browser Exam Key (BEK) Hash
function generateBEKHash(url, examId) {
  const hashInput = `${url}${LOCKDOWN_CONFIG.SECRET_KEY}${examId}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

// Create Lockdown Window
function createLockdownWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    fullscreen: LOCKDOWN_CONFIG.KIOSK_MODE,
    kiosk: LOCKDOWN_CONFIG.KIOSK_MODE,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    backgroundColor: '#ffffff',
  });

  // Block screenshot
  if (LOCKDOWN_CONFIG.BLOCK_SCREENSHOT) {
    mainWindow.setContentProtection(true);
  }

  // Load exam URL
  const examUrl = process.argv.find(arg => arg.startsWith('--exam-url='))?.split('=')[1] 
    || `${LOCKDOWN_CONFIG.API_URL}/student-web`;
  
  mainWindow.loadURL(examUrl);

  // Block system shortcuts
  blockSystemShortcuts();

  // Handle window events
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const allowedOrigin = new URL(LOCKDOWN_CONFIG.API_URL).origin;
    
    if (parsedUrl.origin !== allowedOrigin && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      console.log('Blocked navigation to:', navigationUrl);
    }
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Inject BEK hash into all requests
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    {
      urls: ['*://*/*'],
    },
    (details, callback) => {
      if (examId && examHash) {
        details.requestHeaders['X-Lockdown-Hash'] = examHash;
        details.requestHeaders['X-Lockdown-Client'] = 'electron-lockdown';
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  isLockdownActive = true;
}

// Block System Shortcuts
function blockSystemShortcuts() {
  // Windows shortcuts
  globalShortcut.register('Alt+Tab', () => {
    return false;
  });
  globalShortcut.register('Alt+F4', () => {
    return false;
  });
  globalShortcut.register('Ctrl+Alt+Del', () => {
    return false;
  });
  globalShortcut.register('Win+D', () => {
    return false;
  });
  globalShortcut.register('Win+R', () => {
    return false;
  });
  globalShortcut.register('Win+L', () => {
    return false;
  });
  globalShortcut.register('Win+Tab', () => {
    return false;
  });
  globalShortcut.register('Ctrl+Shift+Esc', () => {
    return false;
  });
  globalShortcut.register('F11', () => {
    return false;
  });

  // Mac shortcuts
  globalShortcut.register('Command+Tab', () => {
    return false;
  });
  globalShortcut.register('Command+Q', () => {
    return false;
  });
  globalShortcut.register('Command+W', () => {
    return false;
  });
  globalShortcut.register('Command+Option+Esc', () => {
    return false;
  });

  // Linux shortcuts
  globalShortcut.register('Super+D', () => {
    return false;
  });
  globalShortcut.register('Ctrl+Alt+T', () => {
    return false;
  });

  // Screenshot shortcuts
  globalShortcut.register('PrintScreen', () => {
    return false;
  });
  globalShortcut.register('Command+Shift+3', () => {
    return false;
  });
  globalShortcut.register('Command+Shift+4', () => {
    return false;
  });
}

// Unblock shortcuts (when exam ends)
function unblockSystemShortcuts() {
  globalShortcut.unregisterAll();
}

// IPC Handlers
ipcMain.handle('get-exam-config', () => {
  return {
    apiUrl: LOCKDOWN_CONFIG.API_URL,
    secretKey: LOCKDOWN_CONFIG.SECRET_KEY,
  };
});

ipcMain.handle('set-exam-id', (event, id) => {
  examId = id;
  if (examId && mainWindow) {
    const currentUrl = mainWindow.webContents.getURL();
    examHash = generateBEKHash(currentUrl, examId);
  }
  return { success: true };
});

ipcMain.handle('generate-bek-hash', (event, url) => {
  if (!examId) {
    return { error: 'Exam ID not set' };
  }
  const hash = generateBEKHash(url, examId);
  examHash = hash;
  return { hash };
});

ipcMain.handle('check-vm-detection', (event, webglVendor) => {
  if (LOCKDOWN_CONFIG.BLOCK_VM) {
    const vmIndicators = [
      'Google SwiftShader',
      'VMware',
      'VirtualBox',
      'QEMU',
      'Xen',
      'Parallels',
    ];
    
    const isVM = vmIndicators.some(indicator => 
      webglVendor && webglVendor.includes(indicator)
    );
    
    if (isVM) {
      return { 
        isVM: true, 
        blocked: true,
        message: 'Virtual machines are not allowed for exams' 
      };
    }
  }
  return { isVM: false, blocked: false };
});

ipcMain.handle('exit-exam', () => {
  if (mainWindow) {
    unblockSystemShortcuts();
    isLockdownActive = false;
    mainWindow.close();
  }
});

// App lifecycle
app.whenReady().then(() => {
  createLockdownWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLockdownWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    unblockSystemShortcuts();
    app.quit();
  }
});

app.on('will-quit', () => {
  unblockSystemShortcuts();
});

// Prevent app from being closed during exam
app.on('before-quit', (event) => {
  if (isLockdownActive) {
    event.preventDefault();
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Exam in Progress',
      message: 'Cannot exit during exam. Please submit your exam first.',
      buttons: ['OK'],
    });
  }
});

// Security: Disable DevTools in production
if (process.env.NODE_ENV !== 'development') {
  app.on('web-contents-created', (event, contents) => {
    contents.on('devtools-opened', () => {
      contents.closeDevTools();
    });
  });
}



