require('dotenv').config();
const { app, BrowserWindow, globalShortcut, screen, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ============================================================
// APP STATE
// ============================================================
let isQuitting = false;
let mainWindow = null;
let isLockdownActive = false;
let focusViolationCount = 0;
let focusIntervalId = null;
let updateCheckDone = false;
let latestVersion = '';

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  TARGET_URL: 'https://exam-web-azure.vercel.app/login',
  MASTER_PASSWORD: '123456789',
  SECRET_EXIT_COMBO: 'CommandOrControl+Alt+Shift+L',
};

// ============================================================
// LOGGING
// ============================================================
function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function getDisplayCount() {
  return screen.getAllDisplays().length;
}

function isMultiMonitor() {
  return getDisplayCount() > 1;
}

// ============================================================
// AUTO-UPDATER
// ============================================================
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.logger = {
  info: (msg) => log(`[AutoUpdater] ${msg}`),
  warn: (msg) => log(`[AutoUpdater WARN] ${msg}`, 'WARN'),
  error: (msg) => log(`[AutoUpdater ERROR] ${msg}`, 'ERROR'),
};

// ============================================================
// INJECT UPDATE UI (as overlay in main window)
// ============================================================
function injectUpdateUI(status, progress, version) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const script = `
    (function() {
      // Remove existing overlay
      var existing = document.getElementById('lananh-update-overlay');
      if (existing) existing.remove();

      // Create overlay
      var overlay = document.createElement('div');
      overlay.id = 'lananh-update-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.92);backdrop-filter:blur(8px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:Segoe UI,Arial,sans-serif;';

      var currentVersion = '${version || app.getVersion()}';
      var statusText = '';
      var titleText = 'Dang kiem tra...';
      var descText = 'Vui long cho trong giay lat...';
      var showProgress = false;
      var showUpdateBtn = false;
      var showSkipBtn = false;
      var updateBtnText = 'Cap nhat ngay';
      var skipBtnText = 'Su dung phien ban cu';
      var progressPercent = 0;

      if ('${status}' === 'checking') {
        titleText = 'Dang kiem tra cap nhat...';
        descText = 'Vui long cho trong giay lat...';
      } else if ('${status}' === 'available') {
        titleText = 'Phien ban moi san sang!';
        descText = 'Co phien ban v' + currentVersion + ' moi. Ban co the cap nhat ngay hoac bo qua de su dung phien ban cu.';
        showUpdateBtn = true;
        showSkipBtn = true;
        updateBtnText = 'Cap nhat ngay';
        skipBtnText = 'Su dung phien ban cu';
      } else if ('${status}' === 'downloading') {
        titleText = 'Dang tai cap nhat...';
        descText = 'Vui long cho, khong tat ung dung.';
        showProgress = true;
        progressPercent = ${progress};
      } else if ('${status}' === 'ready') {
        titleText = 'San sang khoi dong lai';
        descText = 'Cap nhat da tai xong. Khoi dong lai de su dung phien ban moi.';
        showUpdateBtn = true;
        showSkipBtn = true;
        updateBtnText = 'Khoi dong lai ngay';
        skipBtnText = 'Khoi dong sau';
      } else if ('${status}' === 'no-update') {
        overlay.style.display = 'none';
        if (window.electronAPI) window.electronAPI.updateComplete();
        return;
      } else if ('${status}' === 'error') {
        titleText = 'Khong the kiem tra cap nhat';
        descText = 'Da xay ra loi. Ban co the tiep tuc su dung phien ban hien tai.';
        showSkipBtn = true;
        skipBtnText = 'Tiep tuc su dung';
      }

      overlay.innerHTML =
        '<div style="background:linear-gradient(145deg,#1a2744,#0f172a);border:1px solid rgba(95,141,120,0.3);border-radius:24px;padding:40px;width:100%;max-width:420px;text-align:center;box-shadow:0 25px 80px rgba(0,0,0,0.5);animation:fadeIn 0.3s ease;">' +
        '<style>@keyframes fadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}</style>' +
        '<div style="width:80px;height:80px;background:linear-gradient(135deg,#5F8D78,#4a6e5c);border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;font-size:36px;">&#11014;</div>' +
        '<div id="lananh-version-tag" style="display:inline-block;background:linear-gradient(135deg,#5F8D78,#4a6e5c);color:#fff;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px;">v' + currentVersion + '</div>' +
        '<h2 id="lananh-title" style="color:#f8fafc;font-size:20px;font-weight:700;margin-bottom:8px;">' + titleText + '</h2>' +
        '<p id="lananh-desc" style="color:#94a3b8;font-size:13px;margin-bottom:28px;line-height:1.6;">' + descText + '</p>' +
        '<div id="lananh-progress" style="display:' + (showProgress ? 'block' : 'none') + ';">' +
        '<div style="width:100%;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-bottom:10px;">' +
        '<div id="lananh-progress-fill" style="height:100%;background:linear-gradient(90deg,#5F8D78,#4a6e5c);border-radius:4px;width:' + progressPercent + '%;transition:width 0.3s;"></div></div>' +
        '<p id="lananh-progress-text" style="color:#94a3b8;font-size:12px;margin-bottom:20px;">' + Math.round(progressPercent) + '% da tai</p></div>' +
        '<div id="lananh-btn-group" style="display:' + (showUpdateBtn || showSkipBtn ? 'flex' : 'none') + ';gap:12px;justify-content:center;">' +
        (showUpdateBtn ? '<button id="lananh-update-btn" style="flex:1;min-width:120px;padding:12px 28px;background:linear-gradient(135deg,#5F8D78,#4a6e5c);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s;">' + updateBtnText + '</button>' : '') +
        (showSkipBtn ? '<button id="lananh-skip-btn" style="flex:1;min-width:120px;padding:12px 28px;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;">' + skipBtnText + '</button>' : '') +
        '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      // Add event listeners using addEventListener (not inline onclick)
      var updateBtn = document.getElementById('lananh-update-btn');
      var skipBtn = document.getElementById('lananh-skip-btn');

      if (updateBtn) {
        updateBtn.addEventListener('click', function() {
          if ('${status}' === 'available' && window.electronAPI) {
            window.electronAPI.startUpdateDownload();
          } else if ('${status}' === 'ready' && window.electronAPI) {
            window.electronAPI.installAndRestart();
          }
        });
      }

      if (skipBtn) {
        skipBtn.addEventListener('click', function() {
          if (window.electronAPI) window.electronAPI.updateComplete();
        });
      }

      console.log('[LanAnh] Update UI injected, status: ${status}');
    })();
  `;

  mainWindow.webContents.executeJavaScript(script).catch((e) => {
    log(`[Update] Inject failed: ${e.message}`, 'ERROR');
  });
}

function showUpdateOverlay() {
  injectUpdateUI('checking', 0, app.getVersion());
}

function hideUpdateOverlay() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(`
    (function() {
      var overlay = document.getElementById('lananh-update-overlay');
      if (overlay) overlay.remove();
    })();
  `).catch(() => {});
}

// ============================================================
// MAIN EXAM WINDOW
// ============================================================
function createExamWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }

  log('[ExamWindow] Creating main window');

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    kiosk: false,
    fullscreen: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    backgroundColor: '#ffffff',
    skipTaskbar: true,
    minimizable: false,
    maximizable: false,
    closable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.setContentProtection(true);
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);
  Menu.setApplicationMenu(null);

  mainWindow.on('close', (event) => {
    if (isLockdownActive && !isQuitting) {
      event.preventDefault();
      log('CLOSE BLOCKED - lockdown active');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const parsed = new URL(url);
      const allowed = new URL(CONFIG.TARGET_URL).origin;
      if (parsed.origin !== allowed && !url.startsWith('data:')) {
        log(`BLOCKED NAVIGATION: ${url}`, 'WARN');
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode) => {
    if (errorCode === -105 || errorCode === -6) {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(createOfflineHTML())}`);
    }
  });

  // On login page - show update overlay and check for updates
  mainWindow.webContents.on('did-finish-load', () => {
    const url = mainWindow.webContents.getURL();
    log(`[ExamWindow] did-finish-load: ${url}`);
    injectQuitButton();

    // Only check update on login page
    if (url.includes('/login') && !updateCheckDone) {
      updateCheckDone = true;
      log('[App] On login page - checking for updates');
      showUpdateOverlay();

      autoUpdater.once('update-available', (info) => {
        latestVersion = info.version;
        injectUpdateUI('available', 0, info.version);
      });

      autoUpdater.once('update-not-available', () => {
        setTimeout(() => {
          injectUpdateUI('no-update', 100, app.getVersion());
        }, 1500);
      });

      autoUpdater.once('download-progress', (progress) => {
        injectUpdateUI('downloading', progress.percent, latestVersion);
      });

      autoUpdater.once('update-downloaded', (info) => {
        injectUpdateUI('ready', 100, info.version);
      });

      autoUpdater.once('error', (err) => {
        log(`[AutoUpdater] Error: ${err.message}`, 'ERROR');
        injectUpdateUI('error', 0, '');
      });

      autoUpdater.checkForUpdates().catch((err) => {
        log(`[AutoUpdater] Check failed: ${err.message}`, 'ERROR');
        injectUpdateUI('error', 0, '');
      });
    }
  });

  // Activate lockdown ONLY on main exam pages (after login)
  // NOT on login, update, or other auxiliary pages
  mainWindow.webContents.on('did-navigate-in-page', (_event, url) => {
    log(`[ExamWindow] did-navigate-in-page: ${url}`);

    // Check if it's a main exam page (NOT login/update)
    const isMainExamPage =
      (url.includes('/student/') && !url.includes('login')) ||
      (url.includes('/teacher/') && !url.includes('login')) ||
      url.includes('/exam/') ||
      url.includes('/quiz/') ||
      url.includes('/test/');

    // Don't activate lockdown on login or update pages
    const isLoginPage = url.includes('/login') || url.includes('/update');
    const isAuthPage = url.includes('/auth/') || url.includes('/callback');

    if (isMainExamPage && !isLoginPage && !isAuthPage) {
      activateLockdown();
    }
  });

  mainWindow.webContents.on('dom-ready', () => {
    injectQuitButton();
  });

  mainWindow.loadURL(CONFIG.TARGET_URL);
  log('[ExamWindow] Loading: ' + CONFIG.TARGET_URL);
}

function createOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><title>Mat ket noi</title>
<style>body{background:#f5f9f7;color:#1a2e26;font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;}
.c{max-width:500px;padding:40px;}
h1{font-size:24px;margin-bottom:12px;color:#dc2626;}
p{color:#5a7a6a;font-size:16px;margin-bottom:24px;}
button{background:#5F8D78;color:#fff;border:none;padding:14px 40px;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;}</style>
</head>
<body><div class="c"><h1>Mat ket noi internet</h1>
<p>Vui long kiem tra ket noi mang va thu ket noi lai.</p>
<button onclick="location.reload()">Thu lai</button></div></body></html>`;
}

// ============================================================
// QUIT BUTTON (only show when NOT in lockdown)
// ============================================================
let quitButtonInjected = false;

function injectQuitButton() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // Remove existing quit button first
  const removeScript = `
    (function() {
      var existingBtn = document.getElementById('lananh-exit-btn');
      var existingDialog = document.getElementById('lananh-exit-dialog');
      if (existingBtn) existingBtn.remove();
      if (existingDialog) existingDialog.remove();
    })();
  `;
  mainWindow.webContents.executeJavaScript(removeScript).catch(() => {});

  // Inject quit button only when NOT in lockdown
  if (isLockdownActive) return;

  const script = `
    (function() {
      var existingBtn = document.getElementById('lananh-exit-btn');
      var existingDialog = document.getElementById('lananh-exit-dialog');
      if (existingBtn) existingBtn.remove();
      if (existingDialog) existingDialog.remove();

      var btn = document.createElement('div');
      btn.id = 'lananh-exit-btn';
      btn.innerHTML = '<button id="lananh-exit-trigger" style="position:fixed;bottom:24px;right:24px;z-index:2147483646;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border:none;border-radius:12px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(220,38,38,0.35);font-family:Segoe UI,Arial,sans-serif;display:flex;align-items:center;gap:6px;opacity:0.9;transition:opacity 0.2s,transform 0.2s;" onmouseover="this.style.opacity=1;this.style.transform=scale(1.05)" onmouseout="this.style.opacity=0.9;this.style.transform=scale(1)">&#128687; Thoat ung dung</button>';
      document.body.appendChild(btn);

      var dialog = document.createElement('div');
      dialog.id = 'lananh-exit-dialog';
      dialog.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2147483647;align-items:center;justify-content:center;';
      dialog.innerHTML = '<div style="background:#0f172a;border-radius:20px;padding:32px;max-width:380px;width:90%;text-align:center;color:#f8fafc;font-family:Segoe UI,Arial,sans-serif;">' +
        '<div style="width:52px;height:52px;background:rgba(220,38,38,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:24px;">&#128274;</div>' +
        '<h2 style="font-size:17px;margin:0 0 6px;font-weight:700;">Thoat ung dung</h2>' +
        '<p style="font-size:12px;color:#64748b;margin:0 0 20px;line-height:1.6;">Nhap mat khau de thoat.<br>Yeu cau xac nhan tu giao vien.</p>' +
        '<input id="lananh-exit-pw" type="password" placeholder="Nhap mat khau..." style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:11px 14px;color:#f8fafc;font-size:14px;outline:none;box-sizing:border-box;" onkeydown="if(event.key===\\'Enter\\')document.getElementById(\\'lananh-exit-submit\\').click()">' +
        '<p id="lananh-exit-err" style="color:#ef4444;font-size:12px;margin:8px 0 0;display:none;">Mat khau khong dung</p>' +
        '<button id="lananh-exit-submit" style="width:100%;padding:11px;background:linear-gradient(135deg,#5F8D78,#4a6e5c);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-top:14px;">Xac nhan thoat</button>' +
        '<p style="font-size:11px;color:#475569;margin:14px 0 0;">Mat khau: 123456789</p>' +
      '</div>';
      document.body.appendChild(dialog);

      btn.querySelector('button').addEventListener('click', function() {
        dialog.style.display = 'flex';
        setTimeout(function() {
          var pwInput = document.getElementById('lananh-exit-pw');
          if (pwInput) pwInput.focus();
        }, 100);
      });

      dialog.addEventListener('click', function(e) {
        if (e.target === dialog) {
          dialog.style.display = 'none';
          var pwField = document.getElementById('lananh-exit-pw');
          var errField = document.getElementById('lananh-exit-err');
          if (pwField) pwField.value = '';
          if (errField) errField.style.display = 'none';
        }
      });

      document.getElementById('lananh-exit-submit').addEventListener('click', function() {
        var pw = document.getElementById('lananh-exit-pw').value;
        if (window.electronAPI) {
          window.electronAPI.verifyPassword(pw).then(function(r) {
            if (r.success) {
              dialog.style.display = 'none';
            } else {
              var errEl = document.getElementById('lananh-exit-err');
              var pwEl = document.getElementById('lananh-exit-pw');
              if (errEl) errEl.style.display = 'block';
              if (pwEl) pwEl.value = '';
            }
          });
        }
      });

      console.log('[LanAnh] Exit button injected');
    })();
  `;

  mainWindow.webContents.executeJavaScript(script).catch((e) => {
    log(`[QuitButton] Inject failed: ${e.message}`, 'ERROR');
  });
}

// ============================================================
// FOCUS ENFORCEMENT
// ============================================================
function startForceFocus() {
  if (focusIntervalId) return;
  focusIntervalId = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      mainWindow.setKiosk(true);
      mainWindow.setFullScreen(true);
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.moveTop();
      mainWindow.setSkipTaskbar(true);
    } catch {}
  }, 500);
  log('[Lockdown] Force focus started');
}

function stopForceFocus() {
  if (focusIntervalId) {
    clearInterval(focusIntervalId);
    focusIntervalId = null;
    log('[Lockdown] Force focus stopped');
  }
}

// ============================================================
// LOCKDOWN (only on main exam pages)
// ============================================================
function activateLockdown() {
  if (isLockdownActive) return;
  focusViolationCount = 0;
  isLockdownActive = true;
  registerAllShortcuts();
  registerSecretExit();
  startForceFocus();
  log('[Lockdown] ACTIVATED');

  if (mainWindow && !mainWindow.isDestroyed()) {
    // Hide quit button and update overlay when lockdown activates
    mainWindow.webContents.executeJavaScript(`
      (function() {
        var btn = document.getElementById('lananh-exit-btn');
        var dialog = document.getElementById('lananh-exit-dialog');
        var overlay = document.getElementById('lananh-update-overlay');
        if (btn) btn.style.display = 'none';
        if (dialog) dialog.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
      })();
    `);
    mainWindow.webContents.send('lockdown-activated');
  }
}

function deactivateLockdown() {
  if (!isLockdownActive) return;
  isLockdownActive = false;
  stopForceFocus();
  globalShortcut.unregisterAll();
  log('[Lockdown] DEACTIVATED');

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
    mainWindow.webContents.send('lockdown-deactivated');
    // Re-inject quit button when lockdown deactivates
    injectQuitButton();
  }
}

// ============================================================
// SHORTCUTS
// ============================================================
function registerAllShortcuts() {
  const shortcuts = [
    'CommandOrControl+Shift+I',
    'CommandOrControl+Shift+J',
    'CommandOrControl+Shift+C',
    'CommandOrControl+Shift+R',
    'CommandOrControl+R',
    'F12',
    'CommandOrControl+Shift+3',
    'CommandOrControl+Shift+4',
    'CommandOrControl+Option+I',
    'CommandOrControl+Option+C',
    'PrintScreen',
    'Alt+Tab',
    'Alt+F4',
    'Alt+Escape',
    'CommandOrControl+Alt+Delete',
    'CommandOrControl+Shift+Esc',
    'F11',
    'F5',
    'F3',
    'F7',
    'Super_L',
    'Super_R',
    'Super',
    'Win',
    'Win+L',
    'Win+D',
    'Win+E',
    'Win+M',
    'Win+Tab',
    'Win+Ctrl+D',
    'Win+Ctrl+Shift+B',
    'CommandOrControl+Tab',
    'CommandOrControl+Shift+5',
  ];

  if (process.platform === 'darwin') {
    shortcuts.push(
      'Command+Q',
      'Command+Tab',
      'Command+Space',
      'Command+`',
      'Command+Shift+3',
      'Command+Shift+4',
      'Command+Shift+5',
      'Control+Command+Q',
      'Control+Tab',
      'Command+Option+Escape',
      'Command+Up',
      'Command+Down',
      'Command+H',
      'Command+M',
      'Command+Option+Control+Shift+L',
      'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'Command+Ctrl+Q',
      'Command+Ctrl+D',
      'Command+Ctrl+F',
    );
  }

  for (const shortcut of shortcuts) {
    try {
      globalShortcut.register(shortcut, () => {
        log(`[Blocked] ${shortcut}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('shortcut-blocked', { shortcut });
          try {
            mainWindow.setKiosk(true);
            mainWindow.setFullScreen(true);
            mainWindow.focus();
            mainWindow.moveTop();
          } catch {}
        }
      });
    } catch (e) {
      log(`[Shortcut] Failed: ${shortcut} - ${e.message}`, 'WARN');
    }
  }
}

function registerSecretExit() {
  try {
    globalShortcut.register(CONFIG.SECRET_EXIT_COMBO, () => {
      log('[SecretExit] Combo triggered');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('request-exit');
      }
    });
  } catch (e) {
    log(`[SecretExit] Failed: ${e.message}`, 'WARN');
  }
}

// ============================================================
// IPC HANDLERS
// ============================================================
ipcMain.handle('exit:verify-password', (_event, password) => {
  if (password === CONFIG.MASTER_PASSWORD) {
    deactivateLockdown();
    isQuitting = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setClosable(true);
      mainWindow.setKiosk(false);
      mainWindow.setFullScreen(false);
      mainWindow.close();
    }
    app.quit();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('update:start-download', async () => {
  log('[AutoUpdater] Starting download...');
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    log(`[AutoUpdater] Download error: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
});

ipcMain.handle('update:install-restart', () => {
  log('[AutoUpdater] Installing and restarting...');
  isQuitting = true;
  autoUpdater.quitAndInstall(false, true);
  return { success: true };
});

ipcMain.handle('update:complete', () => {
  log('[App] Update skipped, proceeding to exam');
  hideUpdateOverlay();
  return { success: true };
});

ipcMain.handle('focus:violation', () => {
  focusViolationCount++;
  log(`[Focus] Violation #${focusViolationCount}`, 'WARN');
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.setKiosk(true);
      mainWindow.setFullScreen(true);
      mainWindow.focus();
      mainWindow.moveTop();
    } catch {}
    mainWindow.webContents.send('focus-violation', { count: focusViolationCount });
  }
  return { count: focusViolationCount };
});

ipcMain.handle('lockdown:get-status', () => ({
  active: isLockdownActive,
  focusViolations: focusViolationCount,
  displayCount: getDisplayCount(),
  platform: process.platform,
}));

ipcMain.handle('lockdown:submit-exam', () => {
  deactivateLockdown();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setClosable(true);
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
    mainWindow.close();
  }
  return { success: true };
});

ipcMain.handle('app:get-version', () => ({
  version: app.getVersion(),
  name: 'Lan Anh Exam System',
}));

ipcMain.handle('app:quit', () => {
  if (isLockdownActive && !isQuitting) {
    return { success: false, reason: 'lockdown_active' };
  }
  log('[App] Quit requested');
  deactivateLockdown();
  isQuitting = true;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setClosable(true);
    mainWindow.setKiosk(false);
    mainWindow.setFullScreen(false);
    mainWindow.close();
  }
  app.quit();
  return { success: true };
});

// ============================================================
// APP LIFECYCLE
// ============================================================
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  log('[App] Another instance running - quitting');
  app.quit();
}

app.whenReady().then(() => {
  if (!gotTheLock) return;

  log(`[App] Starting v${app.getVersion()}`);

  // DEV: Force quit
  globalShortcut.register('CommandOrControl+Alt+Q', () => {
    log('[DEV] Force quit');
    isQuitting = true;
    stopForceFocus();
    globalShortcut.unregisterAll();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setClosable(true);
      mainWindow.setKiosk(false);
      mainWindow.setFullScreen(false);
      mainWindow.close();
    }
    app.quit();
  });

  // Check multi-monitor
  if (isMultiMonitor()) {
    const errWin = new BrowserWindow({
      width: 540,
      height: 340,
      resizable: false,
      frame: true,
      center: true,
      backgroundColor: '#f5f9f7',
      title: 'Canh bao - Lan Anh',
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    errWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><title>Canh bao</title>
<style>body{background:#f5f9f7;font-family:Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}
.c{background:#fff;border-radius:20px;padding:40px;max-width:480px;text-align:center;border:1px solid rgba(220,38,38,0.1);}
h1{color:#dc2626;font-size:20px;margin-bottom:12px;}
p{color:#5a7a6a;font-size:14px;line-height:1.7;}
</style></head>
<body><div class="c"><h1>Khong the bat dau thi</h1>
<p>He thong phat hien <strong>nhieu man hinh</strong> duoc ket noi.<br>Vui long <strong>ngat ket noi tat ca man hinh phu</strong> truoc khi thi.</p></div></body></html>`)}`);
    errWin.setMenu(null);
    return;
  }

  // Reset update flag for fresh start
  updateCheckDone = false;
  createExamWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createExamWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', (event) => {
  if (isQuitting) {
    log('[App] Quit allowed');
    return;
  }

  if (isLockdownActive) {
    event.preventDefault();
    log('[App] Quit blocked - lockdown active');

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setClosable(false);
      mainWindow.setSkipTaskbar(true);
      mainWindow.setKiosk(true);

      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Lan Anh Exam System',
        message: 'Khong the thoat trong khi dang thi.',
        detail: `Vui long hoan thanh bai thi truoc khi dong ung dung.\n\nThoat khan cap: Ctrl + Alt + Shift + L\nMat khau: 123456789`,
        buttons: ['OK'],
      });
    }
  }
});

app.on('second-instance', (_event, argv) => {
  log('[App] Second instance detected');
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    const win = windows[0];
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
