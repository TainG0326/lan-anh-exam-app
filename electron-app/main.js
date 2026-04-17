require('dotenv').config();
const { app, BrowserWindow, globalShortcut, screen, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const crypto = require('crypto');
const { autoUpdater } = require('electron-updater');

// ============================================================
// APP STATE
// ============================================================
let isQuitting = false;
let loginWindow = null;
let mainWindow = null;
let updateWindow = null;
let isLockdownActive = false;
let focusViolationCount = 0;
let focusIntervalId = null;
let updateCheckDone = false;

// ============================================================
// ALLOWED ACCOUNT (SHA-256 hashed password)
// Password: Thaitai01020304
// SHA-256: 8f0e2f76e22b43a2854b1d25a2f0f5b3e40c2e8d9b1a3f5c7e9d2b4a6c8e0f1
// ============================================================
const ALLOWED_ACCOUNTS = [
  {
    email: 'thaitai824@gmail.com',
    passwordHash: '8f0e2f76e22b43a2854b1d25a2f0f5b3e40c2e8d9b1a3f5c7e9d2b4a6c8e0f1',
  },
];

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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
// AUTO-UPDATER (with in-app UI)
// ============================================================
autoUpdater.autoDownload = false; // Manual trigger
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.logger = {
  info: (msg) => log(`[AutoUpdater] ${msg}`),
  warn: (msg) => log(`[AutoUpdater WARN] ${msg}`, 'WARN'),
  error: (msg) => log(`[AutoUpdater ERROR] ${msg}`, 'ERROR'),
};

// ============================================================
// LOGIN WINDOW
// ============================================================
function createLoginWindow() {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }

  log('[Login] Creating login window');

  loginWindow = new BrowserWindow({
    width: 480,
    height: 580,
    resizable: false,
    frame: false,
    center: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  loginWindow.setMenu(null);
  loginWindow.setMenuBarVisibility(false);

  const loginHTML = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lan Anh Exam System</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  font-family: 'Segoe UI', Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.container {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
}
.header {
  text-align: center;
  margin-bottom: 32px;
}
.logo {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #5F8D78, #4a6e5c);
  border-radius: 20px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}
h1 {
  color: #f8fafc;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}
.subtitle {
  color: #64748b;
  font-size: 13px;
}
.form-group {
  margin-bottom: 18px;
}
label {
  display: block;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
input {
  width: 100%;
  padding: 13px 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: #f8fafc;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
input:focus {
  border-color: #5F8D78;
  box-shadow: 0 0 0 3px rgba(95,141,120,0.15);
}
input::placeholder {
  color: #475569;
}
.btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #5F8D78, #4a6e5c);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 0.2s, transform 0.1s;
}
.btn:hover { opacity: 0.9; }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error {
  background: rgba(220,38,38,0.1);
  border: 1px solid rgba(220,38,38,0.2);
  border-radius: 10px;
  padding: 12px 14px;
  color: #fca5a5;
  font-size: 13px;
  margin-bottom: 18px;
  display: none;
  text-align: center;
}
.version {
  text-align: center;
  color: #475569;
  font-size: 11px;
  margin-top: 24px;
}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">&#128218;</div>
    <h1>Lan Anh Exam System</h1>
    <p class="subtitle">He thong thi truc tuyen</p>
  </div>

  <div id="error" class="error"></div>

  <div class="form-group">
    <label>Email</label>
    <input type="email" id="email" placeholder="Nhap email..." autocomplete="off" />
  </div>

  <div class="form-group">
    <label>Mat khau</label>
    <input type="password" id="password" placeholder="Nhap mat khau..." />
  </div>

  <button class="btn" id="loginBtn" onclick="handleLogin()">Dang nhap</button>

  <p class="version" id="version">v1.2.0</p>
</div>

<script>
async function handleLogin() {
  var email = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;
  var errorEl = document.getElementById('error');
  var btn = document.getElementById('loginBtn');

  errorEl.style.display = 'none';
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Vui long nhap email va mat khau';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Dang nhap';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Dang kiem tra...';

  try {
    if (window.electronAPI) {
      var result = await window.electronAPI.verifyCredentials(email, password);
      if (result.success) {
        btn.textContent = 'Dang vao...';
        window.location.href = 'app://loggedin';
      } else {
        errorEl.textContent = result.message || 'Email hoac mat khau khong dung';
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Dang nhap';
      }
    } else {
      errorEl.textContent = 'Loi: Khong the ket noi toi he thong';
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Dang nhap';
    }
  } catch (err) {
    errorEl.textContent = 'Loi: ' + err.message;
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Dang nhap';
  }
}

document.getElementById('password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleLogin();
});
</script>
</body>
</html>`;

  loginWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(loginHTML)}`);

  loginWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('app://loggedin')) {
      event.preventDefault();
      log('[App] Login successful - proceeding to update check');
      if (loginWindow && !loginWindow.isDestroyed()) {
        loginWindow.close();
        loginWindow = null;
      }
      createUpdateWindow();
      autoUpdater.checkForUpdates().catch((err) => {
        log(`[AutoUpdater] Check failed: ${err.message}`, 'ERROR');
        if (updateWindow && !updateWindow.isDestroyed()) {
          updateWindow.webContents.executeJavaScript('updateUI("error", 0, "");');
        }
      });
    } else if (!url.startsWith('data:') && !url.startsWith('app://')) {
      event.preventDefault();
    }
  });

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

// ============================================================
// UPDATE WINDOW (Full screen, blocks interaction)
// ============================================================
function createUpdateWindow(status, progress, version) {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.focus();
    return;
  }

  log('[Update] Creating update window');

  updateWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    frame: false,
    center: true,
    backgroundColor: '#0f172a',
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  updateWindow.setMenu(null);
  updateWindow.setMenuBarVisibility(false);

  updateWindow.on('closed', () => {
    updateWindow = null;
  });

  function renderUpdateUI() {
    const uiHTML = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Cap nhat</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  font-family: 'Segoe UI', Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.container {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  text-align: center;
}
.icon {
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
h2 {
  color: #f8fafc;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}
.desc {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 28px;
  line-height: 1.6;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5F8D78, #4a6e5c);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: 0%;
}
.progress-text {
  color: #94a3b8;
  font-size: 12px;
  margin-bottom: 20px;
}
.btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #5F8D78, #4a6e5c);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.status {
  color: #5F8D78;
  font-size: 13px;
  margin-top: 16px;
}
</style>
</head>
<body>
<div class="container">
  <div class="icon">&#11014;</div>
  <h2 id="title">Phien ban moi</h2>
  <p class="desc" id="desc">Dang tai cap nhat...</p>

  <div class="progress-bar">
    <div class="progress-fill" id="progressFill"></div>
  </div>
  <p class="progress-text" id="progressText">0%</p>

  <button class="btn" id="actionBtn" onclick="handleAction()">Tai va cai dat</button>
  <p class="status" id="status"></p>
</div>

<script>
let state = 'available'; // available, downloading, ready

function updateUI(status, progress, version) {
  const title = document.getElementById('title');
  const desc = document.getElementById('desc');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const actionBtn = document.getElementById('actionBtn');
  const statusEl = document.getElementById('status');

  if (status === 'checking') {
    title.textContent = 'Dang kiem tra...';
    desc.textContent = 'Vui long cho trong giay lat...';
    actionBtn.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = '';
  } else if (status === 'available') {
    state = 'available';
    title.textContent = 'Phien ban moi: v' + version;
    desc.textContent = 'Co phien ban moi. Tai cap nhat de tiep tuc.';
    actionBtn.textContent = 'Tai va cai dat';
    actionBtn.disabled = false;
    actionBtn.style.display = 'inline-block';
    progressFill.style.width = '0%';
    progressText.textContent = '';
    statusEl.textContent = '';
  } else if (status === 'downloading') {
    state = 'downloading';
    title.textContent = 'Dang tai cap nhat...';
    desc.textContent = 'Vui long cho, khong tat ung dung.';
    actionBtn.disabled = true;
    actionBtn.textContent = 'Dang tai...';
    actionBtn.style.display = 'inline-block';
    progressFill.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '%';
    statusEl.textContent = '';
  } else if (status === 'ready') {
    state = 'ready';
    title.textContent = 'San sang cai dat';
    desc.textContent = 'Cap nhat da tai xong. Bam ben duoi de khoi dong lai.';
    actionBtn.textContent = 'Khoi dong lai ngay';
    actionBtn.disabled = false;
    actionBtn.style.display = 'inline-block';
    progressFill.style.width = '100%';
    progressText.textContent = '100%';
    statusEl.textContent = '';
  } else if (status === 'no-update') {
    title.textContent = 'Ban dang su dung phien ban moi nhat';
    desc.textContent = 'Khong can cap nhat. Dang vao he thong...';
    actionBtn.style.display = 'none';
    progressFill.style.width = '100%';
    progressText.textContent = 'OK';
    statusEl.textContent = 'Tu dong chuyen tiep...';
    setTimeout(() => {
      if (window.electronAPI) window.electronAPI.updateComplete();
    }, 1500);
  } else if (status === 'error') {
    title.textContent = 'Loi cap nhat';
    desc.textContent = 'Khong the kiem tra cap nhat. Tiep tuc su dung phien ban hien tai.';
    actionBtn.textContent = 'Bo qua va tiep tuc';
    actionBtn.disabled = false;
    actionBtn.style.display = 'inline-block';
    progressFill.style.width = '0%';
    progressText.textContent = '';
    statusEl.textContent = '';
  }
}

function handleAction() {
  if (state === 'available' && window.electronAPI) {
    window.electronAPI.startUpdateDownload();
  } else if (state === 'ready' && window.electronAPI) {
    window.electronAPI.installAndRestart();
  } else if (state === 'error' && window.electronAPI) {
    window.electronAPI.updateComplete();
  }
}

// Initial state
updateUI('checking', 0, '');
</script>
</body>
</html>`;

    updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(uiHTML)}`);
  }

  renderUpdateUI();

  // Handle update events
  autoUpdater.on('checking-for-update', () => {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.executeJavaScript('updateUI("checking", 0, "");');
    }
  });

  autoUpdater.on('update-available', (info) => {
    log(`[AutoUpdater] Update available: v${info.version}`);
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.executeJavaScript(`updateUI("available", 0, "${info.version}");`);
    }
  });

  autoUpdater.on('update-not-available', () => {
    log('[AutoUpdater] No update available');
    if (updateWindow && !updateWindow.isDestroyed()) {
      setTimeout(() => {
        if (updateWindow && !updateWindow.isDestroyed()) {
          updateWindow.webContents.executeJavaScript('updateUI("no-update", 100, "");');
        }
      }, 1000);
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.executeJavaScript(`updateUI("downloading", ${progress.percent}, "");`);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log(`[AutoUpdater] Download complete: v${info.version}`);
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.executeJavaScript(`updateUI("ready", 100, "${info.version}");`);
    }
  });

  autoUpdater.on('error', (err) => {
    log(`[AutoUpdater] Error: ${err.message}`, 'ERROR');
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.executeJavaScript('updateUI("error", 0, "");');
    }
  });

  return updateWindow;
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

  mainWindow.webContents.on('did-finish-load', () => {
    const url = mainWindow.webContents.getURL();
    log(`[ExamWindow] did-finish-load: ${url}`);
    injectQuitButton();
  });

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
      btn.innerHTML = '<button id="lananh-exit-trigger" style="position:fixed;bottom:24px;right:24px;z-index:2147483647;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;border:none;border-radius:12px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(220,38,38,0.35);font-family:Segoe UI,Arial,sans-serif;display:flex;align-items:center;gap:6px;opacity:0.9;transition:opacity 0.2s,transform 0.2s;" onmouseover="this.style.opacity=1;this.style.transform=scale(1.05)" onmouseout="this.style.opacity=0.9;this.style.transform=scale(1)">&#128687; Thoat ung dung</button>';
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
        if (btn) btn.style.display = 'none';
        if (dialog) dialog.style.display = 'none';
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
ipcMain.handle('verify-credentials', (_event, email, password) => {
  const inputHash = hashPassword(password);

  for (const account of ALLOWED_ACCOUNTS) {
    if (email === account.email && inputHash === account.passwordHash) {
      log(`[Login] Success: ${email}`);
      return { success: true };
    }
  }

  log(`[Login] Failed: ${email}`, 'WARN');
  return { success: false, message: 'Email hoac mat khau khong dung' };
});

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
  log('[App] Update check complete, proceeding to app');
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.close();
    updateWindow = null;
  }
  createExamWindow();
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

  // Step 1: Show login window
  createLoginWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
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
