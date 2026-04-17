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

  const updateOverlayHTML = `
    <style>
      .lananh-update-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Arial, sans-serif;
      }
      .lananh-update-container {
        background: linear-gradient(145deg, #1a2744 0%, #0f172a 100%);
        border: 1px solid rgba(95, 141, 120, 0.3);
        border-radius: 24px;
        padding: 40px;
        width: 100%;
        max-width: 420px;
        text-align: center;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
        animation: lananh-fade-in 0.3s ease;
      }
      @keyframes lananh-fade-in {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .lananh-update-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #5F8D78, #4a6e5c);
        border-radius: 50%;
        margin: 0 auto 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
      }
      .lananh-update-version {
        display: inline-block;
        background: linear-gradient(135deg, #5F8D78, #4a6e5c);
        color: #fff;
        padding: 4px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      .lananh-update-title {
        color: #f8fafc;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .lananh-update-desc {
        color: #94a3b8;
        font-size: 13px;
        margin-bottom: 28px;
        line-height: 1.6;
      }
      .lananh-progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255,255,255,0.08);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 10px;
      }
      .lananh-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #5F8D78, #4a6e5c);
        border-radius: 4px;
        transition: width 0.3s ease;
        width: 0%;
      }
      .lananh-progress-text {
        color: #94a3b8;
        font-size: 12px;
        margin-bottom: 20px;
      }
      .lananh-btn-group {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .lananh-btn {
        padding: 12px 28px;
        color: #fff;
        border: none;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
        min-width: 120px;
      }
      .lananh-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      .lananh-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .lananh-btn-primary {
        background: linear-gradient(135deg, #5F8D78, #4a6e5c);
      }
      .lananh-btn-secondary {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
      }
      .lananh-btn-secondary:hover { background: rgba(255,255,255,0.15); }
      .lananh-status {
        color: #5F8D78;
        font-size: 13px;
        margin-top: 16px;
      }
      .lananh-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255,255,255,0.1);
        border: none;
        color: #64748b;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      .lananh-close-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }
    </style>

    <div class="lananh-update-overlay" id="lananhUpdateOverlay">
      <div class="lananh-update-container" style="position: relative;">
        <div class="lananh-update-icon">&#11014;</div>
        <div class="lananh-update-version" id="lananhVersionTag">v1.0.0</div>
        <h2 class="lananh-update-title" id="lananhTitle">Dang kiem tra...</h2>
        <p class="lananh-update-desc" id="lananhDesc">Vui long cho trong giay lat...</p>

        <div id="lananhProgressSection" style="display:none;">
          <div class="lananh-progress-bar">
            <div class="lananh-progress-fill" id="lananhProgressFill"></div>
          </div>
          <p class="lananh-progress-text" id="lananhProgressText">0%</p>
        </div>

        <div class="lananh-btn-group" id="lananhBtnGroup">
          <button class="lananh-btn lananh-btn-primary" id="lananhUpdateBtn" onclick="lananhHandleUpdate()">Cap nhat</button>
          <button class="lananh-btn lananh-btn-secondary" id="lananhSkipBtn" onclick="lananhHandleSkip()">Bo qua</button>
        </div>
        <p class="lananh-status" id="lananhStatus"></p>
      </div>
    </div>

    <script>
      var lananhState = 'checking';
      var lananhVersion = '';

      function lananhUpdateUI(status, progress, version) {
        lananhState = status;
        lananhVersion = version;

        var title = document.getElementById('lananhTitle');
        var desc = document.getElementById('lananhDesc');
        var versionTag = document.getElementById('lananhVersionTag');
        var progressSection = document.getElementById('lananhProgressSection');
        var progressFill = document.getElementById('lananhProgressFill');
        var progressText = document.getElementById('lananhProgressText');
        var updateBtn = document.getElementById('lananhUpdateBtn');
        var skipBtn = document.getElementById('lananhSkipBtn');
        var btnGroup = document.getElementById('lananhBtnGroup');
        var statusEl = document.getElementById('lananhStatus');
        var overlay = document.getElementById('lananhUpdateOverlay');

        if (status === 'checking') {
          title.textContent = 'Dang kiem tra cap nhat...';
          desc.textContent = 'Vui long cho trong giay lat...';
          versionTag.style.display = 'none';
          progressSection.style.display = 'none';
          updateBtn.style.display = 'none';
          skipBtn.style.display = 'none';
          statusEl.textContent = '';
        } else if (status === 'available') {
          title.textContent = 'Phien ban moi san sang!';
          desc.textContent = 'Co phien ban ' + version + ' moi. Ban co the cap nhat ngay hoac bo qua de su dung phien ban cu.';
          versionTag.textContent = 'v' + version;
          versionTag.style.display = 'inline-block';
          progressSection.style.display = 'none';
          updateBtn.style.display = 'inline-block';
          updateBtn.textContent = 'Cap nhat ngay';
          updateBtn.disabled = false;
          skipBtn.style.display = 'inline-block';
          skipBtn.textContent = 'Su dung phien ban cu';
          btnGroup.style.display = 'flex';
          statusEl.textContent = '';
        } else if (status === 'downloading') {
          title.textContent = 'Dang tai cap nhat...';
          desc.textContent = 'Vui long cho, khong tat ung dung.';
          versionTag.textContent = 'v' + version;
          versionTag.style.display = 'inline-block';
          progressSection.style.display = 'block';
          progressFill.style.width = progress + '%';
          progressText.textContent = Math.round(progress) + '% da tai';
          updateBtn.style.display = 'none';
          skipBtn.style.display = 'none';
          btnGroup.style.display = 'none';
          statusEl.textContent = '';
        } else if (status === 'ready') {
          title.textContent = 'San sang khoi dong lai';
          desc.textContent = 'Cap nhat da tai xong. Khoi dong lai de su dung phien ban moi.';
          versionTag.textContent = 'v' + version;
          versionTag.style.display = 'inline-block';
          progressSection.style.display = 'none';
          updateBtn.style.display = 'inline-block';
          updateBtn.textContent = 'Khoi dong lai ngay';
          updateBtn.disabled = false;
          skipBtn.style.display = 'inline-block';
          skipBtn.textContent = 'Khoi dong sau';
          btnGroup.style.display = 'flex';
          statusEl.textContent = '';
        } else if (status === 'no-update') {
          overlay.style.display = 'none';
          if (window.electronAPI) window.electronAPI.updateComplete();
        } else if (status === 'error') {
          title.textContent = 'Khong the kiem tra cap nhat';
          desc.textContent = 'Da xay ra loi. Ban co the tiep tuc su dung phien ban hien tai.';
          versionTag.style.display = 'none';
          progressSection.style.display = 'none';
          updateBtn.style.display = 'none';
          skipBtn.style.display = 'inline-block';
          skipBtn.textContent = 'Tiep tuc su dung';
          btnGroup.style.display = 'flex';
          statusEl.textContent = '';
        }
      }

      function lananhHandleUpdate() {
        if (lananhState === 'available' && window.electronAPI) {
          window.electronAPI.startUpdateDownload();
        } else if (lananhState === 'ready' && window.electronAPI) {
          window.electronAPI.installAndRestart();
        }
      }

      function lananhHandleSkip() {
        if (window.electronAPI) window.electronAPI.updateComplete();
      }

      // Listen for messages from main process
      if (window.electronAPI) {
        window.electronAPI.onUpdateUI(function(data) {
          lananhUpdateUI(data.status, data.progress, data.version);
        });
      }
    </script>
  `;

  const escapedHTML = updateOverlayHTML.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const script = `
    (function() {
      var existing = document.getElementById('lananhUpdateOverlay');
      if (existing) existing.remove();

      var container = document.createElement('div');
      container.innerHTML = \`${escapedHTML}\`;
      document.body.appendChild(container);

      // Update UI based on status
      lananhUpdateUI('${status}', ${progress}, '${version}');

      console.log('[LanAnh] Update UI injected');
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
      var overlay = document.getElementById('lananhUpdateOverlay');
      if (overlay) overlay.style.display = 'none';
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

  // Activate lockdown when navigating to student/teacher pages
  mainWindow.webContents.on('did-navigate-in-page', (_event, url) => {
    log(`[ExamWindow] did-navigate-in-page: ${url}`);
    if (url.includes('/student/') || url.includes('/teacher/') || url.includes('/exam/')) {
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
// QUIT BUTTON
// ============================================================
function injectQuitButton() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

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

      btn.querySelector('button').onclick = function() {
        dialog.style.display = 'flex';
        setTimeout(function() {
          var pwInput = document.getElementById('lananh-exit-pw');
          if (pwInput) pwInput.focus();
        }, 100);
      };

      dialog.onclick = function(e) {
        if (e.target === dialog) {
          dialog.style.display = 'none';
          var pwField = document.getElementById('lananh-exit-pw');
          var errField = document.getElementById('lananh-exit-err');
          if (pwField) pwField.value = '';
          if (errField) errField.style.display = 'none';
        }
      };

      document.getElementById('lananh-exit-submit').onclick = function() {
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
        } else {
          var errEl = document.getElementById('lananh-exit-err');
          if (errEl) errEl.style.display = 'block';
        }
      };

      console.log('[LanAnh] Exit button injected');
    })();
  `;

  mainWindow.webContents.executeJavaScript(script);
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
// LOCKDOWN
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
    mainWindow.webContents.executeJavaScript(`
      (function() {
        var btn = document.getElementById('lananh-exit-btn');
        var dialog = document.getElementById('lananh-exit-dialog');
        var overlay = document.getElementById('lananhUpdateOverlay');
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
