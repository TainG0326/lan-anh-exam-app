require('dotenv').config();
const { app, BrowserWindow, globalShortcut, screen, ipcMain, dialog, Menu, shell, net } = require('electron');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');

// ============================================================
// GLOBAL ERROR HANDLERS
// ============================================================
process.on('uncaughtException', (err) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [FATAL] Uncaught Exception:`, err);
  console.error(err.stack);
  try {
    dialog.showErrorBox('Application Error', `An unexpected error occurred:\n${err.message}`);
  } catch (e) {}
  app.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [ERROR] Unhandled Rejection at:`, promise, 'reason:', reason);
});

// ============================================================
// APP STATE
// ============================================================
let isQuitting = false;
let mainWindow = null;
let isLockdownActive = false;
let focusViolationCount = 0;
let focusIntervalId = null;
let updateCheckDone = false;
let isUpdateRequired = false;
let latestVersion = '';
let updateDownloadUrl = '';
let updateInstallerPath = null;
let loginTimeoutId = null;
let isTestAccountLoggedIn = false;

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  TARGET_URL: 'https://exam-web-azure.vercel.app/login',
  MASTER_PASSWORD: '123456789',
  SECRET_EXIT_COMBO: 'CommandOrControl+Alt+Shift+L',
  UPDATE_CHECK_URL: 'https://raw.githubusercontent.com/TainG0326/lan-anh-exam-app/refs/heads/main/electron-app/dist/latest.yml',
  UPDATE_INSTALLER_NAME: 'Lan-Anh-Exam-System-Setup-',
  UPDATE_TIMEOUT_MS: 10000,
  LOGIN_TIMEOUT_MS: 10000,
  TEST_ACCOUNT_EMAIL: 'thaitai824@gmail.com',
  TEST_ACCOUNT_PASSWORD: 'Thaitai01020304',
};

// ============================================================
// LOGGING
// ============================================================
function log(msg, level = 'INFO') {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

// ============================================================
// CUSTOM UPDATE CHECKER (replaces electron-updater)
// ============================================================
function fetchUrl(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const req = lib.get(url, { timeout: timeoutMs || CONFIG.UPDATE_TIMEOUT_MS, headers: { 'User-Agent': 'LanAnhExamSystem/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          log(`[UpdateCheck] Redirecting to: ${redirectUrl}`);
          resolve(fetchUrl(redirectUrl, timeoutMs));
          return;
        }
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', (e) => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

function parseVersion(versionStr) {
  const cleaned = versionStr.replace(/^v/, '').trim();
  const parts = cleaned.split('.').map(Number);
  while (parts.length < 3) parts.push(0);
  return parts;
}

function compareVersions(current, latest) {
  const a = parseVersion(current);
  const b = parseVersion(latest);
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

async function checkForUpdate() {
  log('[UpdateCheck] Checking app version...');
  try {
    const content = await fetchUrl(CONFIG.UPDATE_CHECK_URL);
    const versionMatch = content.match(/^version:\s*([^\s]+)/m);
    const urlMatch = content.match(/url:\s+([^\s]+)/m);

    if (!versionMatch) {
      log('[UpdateCheck] Cannot parse version from latest.yml', 'WARN');
      return { hasUpdate: false, latestVersion: app.getVersion() };
    }

    const serverVersion = versionMatch[1];
    const currentVersion = app.getVersion();

    log(`[UpdateCheck] Latest version: ${serverVersion}`);

    const hasUpdate = compareVersions(currentVersion, serverVersion) < 0;

    if (hasUpdate) {
      let downloadUrl = '';
      if (urlMatch) {
        downloadUrl = urlMatch[1];
      } else {
        downloadUrl = `https://github.com/TainG0326/lan-anh-exam-app/releases/download/v${serverVersion}/Lan-Anh-Exam-System-Setup-${serverVersion}.exe`;
      }
      log(`[UpdateCheck] Update required: v${serverVersion} (current: v${currentVersion})`);
      log(`[UpdateCheck] Download URL: ${downloadUrl}`);
      return { hasUpdate: true, latestVersion: serverVersion, downloadUrl };
    } else {
      log(`[UpdateCheck] App is up to date. Server: v${serverVersion}, Current: v${currentVersion}`);
      return { hasUpdate: false, latestVersion: serverVersion };
    }
  } catch (err) {
    log(`[UpdateCheck] Failed: ${err.message}`, 'WARN');
    log('[UpdateCheck] Allowing app to continue (failsafe mode)');
    return { hasUpdate: false, latestVersion: app.getVersion() };
  }
}

// ============================================================
// INJECT UPDATE UI (as overlay in main window)
// ============================================================
function injectUpdateUI(status, progress, version, downloadUrl) {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const currentVersion = version || app.getVersion();
  const dlUrl = downloadUrl || '';

  const script = `
    (function() {
      var existing = document.getElementById('lananh-update-overlay');
      if (existing) existing.remove();

      var statusConfig = {
        checking: {
          title: 'Dang kiem tra cap nhat...',
          desc: 'Vui long cho trong giay lat...',
          showProgress: false,
          showUpdateBtn: false,
          showSkipBtn: false,
          icon: '&#128269;',
          progress: 0
        },
        available: {
          title: 'Phien ban moi san sang!',
          desc: 'Co phien ban v${currentVersion} moi. Ban co the cap nhat ngay hoac bo qua de su dung phien ban hien tai.',
          showProgress: false,
          showUpdateBtn: true,
          showSkipBtn: true,
          updateBtnText: 'Cap nhat ngay',
          skipBtnText: 'Su dung phien ban cu',
          icon: '&#128233;',
          progress: 0
        },
        downloading: {
          title: 'Dang tai cap nhat...',
          desc: 'Vui long cho, khong tat ung dung trong luc tai.',
          showProgress: true,
          showUpdateBtn: false,
          showSkipBtn: false,
          icon: '&#11015;',
          progress: ${progress}
        },
        ready: {
          title: 'San sang khoi dong lai',
          desc: 'Cap nhat da tai xong. Khoi dong lai de hoan tat cai dat phien ban moi.',
          showProgress: false,
          showUpdateBtn: true,
          showSkipBtn: true,
          updateBtnText: 'Khoi dong lai ngay',
          skipBtnText: 'Khoi dong sau',
          icon: '&#10004;',
          progress: 100
        },
        no_update: {
          title: 'Ban dang su dung phien ban moi nhat',
          desc: 'Khong co cap nhat moi. Chuc ban hoc tot!',
          showProgress: false,
          showUpdateBtn: false,
          showSkipBtn: false,
          icon: '&#128076;',
          progress: 100
        },
        error: {
          title: 'Khong the kiem tra cap nhat',
          desc: 'Da xay ra loi khi kiem tra cap nhat. Ban co the tiep tuc su dung phien ban hien tai.',
          showProgress: false,
          showUpdateBtn: false,
          showSkipBtn: true,
          skipBtnText: 'Tiep tuc su dung',
          icon: '&#9888;',
          progress: 0
        }
      };

      var config = statusConfig['${status}'] || statusConfig.checking;

      var overlay = document.createElement('div');
      overlay.id = 'lananh-update-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;animation:fadeInOverlay 0.3s ease;';

      var card = document.createElement('div');
      card.style.cssText = 'background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);padding:40px;width:100%;max-width:400px;margin:20px;text-align:center;animation:scaleInCard 0.3s ease;';

      var iconDiv = document.createElement('div');
      iconDiv.style.cssText = 'width:72px;height:72px;background:linear-gradient(135deg,#5F8D78,#4a6e5c);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:32px;';
      iconDiv.innerHTML = config.icon;

      var versionTag = document.createElement('div');
      versionTag.style.cssText = 'display:inline-block;background:#f0f9f6;color:#5F8D78;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:600;margin-bottom:14px;';
      versionTag.textContent = 'v' + currentVersion;

      var title = document.createElement('h2');
      title.style.cssText = 'color:#1f2937;font-size:18px;font-weight:700;margin:0 0 8px;';
      title.textContent = config.title;

      var desc = document.createElement('p');
      desc.style.cssText = 'color:#6b7280;font-size:13px;margin:0 0 24px;line-height:1.6;';
      desc.textContent = config.desc;

      var progressSection = document.createElement('div');
      progressSection.style.cssText = 'display:' + (config.showProgress ? 'block' : 'none') + ';margin-bottom:20px;';
      var progressBar = document.createElement('div');
      progressBar.style.cssText = 'width:100%;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:8px;';
      var progressFill = document.createElement('div');
      progressFill.id = 'lananh-progress-fill';
      progressFill.style.cssText = 'height:100%;background:linear-gradient(90deg,#5F8D78,#4a6e5c);border-radius:4px;width:' + config.progress + '%;transition:width 0.3s ease;';
      progressBar.appendChild(progressFill);
      var progressText = document.createElement('p');
      progressText.id = 'lananh-progress-text';
      progressText.style.cssText = 'color:#6b7280;font-size:12px;margin:0;';
      progressText.textContent = Math.round(config.progress) + '%';
      progressSection.appendChild(progressBar);
      progressSection.appendChild(progressText);

      var btnGroup = document.createElement('div');
      btnGroup.style.cssText = 'display:' + (config.showUpdateBtn || config.showSkipBtn ? 'flex' : 'none') + ';gap:12px;';

      if (config.showUpdateBtn) {
        var updateBtn = document.createElement('button');
        updateBtn.id = 'lananh-update-btn';
        updateBtn.style.cssText = 'flex:1;padding:12px 20px;background:linear-gradient(135deg,#5F8D78,#4a6e5c);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;';
        updateBtn.textContent = config.updateBtnText || 'Cap nhat ngay';
        updateBtn.addEventListener('click', function() {
          if (window.electronAPI) window.electronAPI.startUpdateDownload('${dlUrl}');
        });
        updateBtn.addEventListener('mouseenter', function() {
          this.style.opacity = '0.9';
          this.style.transform = 'translateY(-1px)';
        });
        updateBtn.addEventListener('mouseleave', function() {
          this.style.opacity = '1';
          this.style.transform = 'translateY(0)';
        });
        btnGroup.appendChild(updateBtn);
      }

      if (config.showSkipBtn) {
        var skipBtn = document.createElement('button');
        skipBtn.id = 'lananh-skip-btn';
        skipBtn.style.cssText = 'flex:1;padding:12px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.2s;';
        skipBtn.textContent = config.skipBtnText || 'Bo qua';
        skipBtn.addEventListener('click', function() {
          if (window.electronAPI) window.electronAPI.updateComplete();
        });
        skipBtn.addEventListener('mouseenter', function() {
          this.background = '#e5e7eb';
        });
        skipBtn.addEventListener('mouseleave', function() {
          this.background = '#f3f4f6';
        });
        btnGroup.appendChild(skipBtn);
      }

      card.appendChild(iconDiv);
      card.appendChild(versionTag);
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(progressSection);
      card.appendChild(btnGroup);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      var style = document.createElement('style');
      style.textContent = '@keyframes fadeInOverlay{from{opacity:0}to{opacity:1}}@keyframes scaleInCard{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}';
      document.head.appendChild(style);

      if ('${status}' === 'no_update') {
        setTimeout(function() {
          if (window.electronAPI) window.electronAPI.updateComplete();
        }, 2000);
      }

      console.log('[LanAnh] Update UI injected, status: ${status}');
    })();
  `;

  mainWindow.webContents.executeJavaScript(script).catch((e) => {
    log(`[Update] Inject failed: ${e.message}`, 'ERROR');
  });
}

function showUpdateOverlay() {
  injectUpdateUI('checking', 0, app.getVersion(), '');
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

  try {
    mainWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      kiosk: false,
      fullscreen: false,
      frame: false,
      resizable: false,
      backgroundColor: '#ffffff',
      show: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webSecurity: true,
      },
    });
  } catch (err) {
    log(`[ExamWindow] Failed to create window: ${err.message}`, 'ERROR');
    dialog.showErrorBox('Startup Error', `Failed to create window: ${err.message}`);
    app.quit();
    return;
  }

  mainWindow.setContentProtection(true);
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAutoHideMenuBar(true);
  Menu.setApplicationMenu(null);

  mainWindow.on('close', (event) => {
    if (isLockdownActive && !isQuitting) {
      event.preventDefault();
      log('[App] Close blocked - lockdown active');
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

    // Inject quit button on ALL pages (including login/update) since lockdown is never active there
    injectQuitButton();

    if (url.includes('/login') && !updateCheckDone) {
      updateCheckDone = true;
      log('[App] On login page - checking for updates');
      showUpdateOverlay();

      // Set a safety timeout - always hide overlay after max 15 seconds
      const safetyTimeout = setTimeout(() => {
        log('[UpdateCheck] Safety timeout - hiding overlay');
        hideUpdateOverlay();
      }, 15000);

      // Check for update using custom HTTP-based checker
      checkForUpdate().then((result) => {
        clearTimeout(safetyTimeout);
        if (result.hasUpdate) {
          latestVersion = result.latestVersion;
          updateDownloadUrl = result.downloadUrl;
          log(`[UpdateCheck] Update found: v${latestVersion}, URL: ${updateDownloadUrl}`);
          injectUpdateUI('available', 0, latestVersion, updateDownloadUrl);
        } else {
          log('[UpdateCheck] No update available');
          injectUpdateUI('no_update', 100, app.getVersion(), '');
        }
      }).catch((err) => {
        clearTimeout(safetyTimeout);
        log(`[UpdateCheck] Error: ${err.message}`, 'ERROR');
        log('[UpdateCheck] Allowing app to continue (failsafe mode)');
        hideUpdateOverlay();
      });
    }
  });

  mainWindow.webContents.on('did-navigate-in-page', (_event, url) => {
    log(`[ExamWindow] did-navigate-in-page: ${url}`);

    // Inject quit button on ALL non-exam pages (login, update, auth, etc.)
    // Lockdown anti-cheat only activates on main exam pages
    const isLoginPage = url.includes('/login') || url.includes('/update');
    const isAuthPage = url.includes('/auth/') || url.includes('/callback');

    if (isLoginPage || isAuthPage) {
      // Inject quit button on login/update/auth pages (no lockdown here)
      injectQuitButton();
    }

    // Activate lockdown anti-cheat ONLY on main exam pages (after successful login)
    const isMainExamPage =
      (url.includes('/student/') && !url.includes('login')) ||
      (url.includes('/teacher/') && !url.includes('login')) ||
      url.includes('/exam/') ||
      url.includes('/quiz/') ||
      url.includes('/test/');

    if (isMainExamPage && !isLoginPage && !isAuthPage) {
      activateLockdown();
    }
  });

  mainWindow.webContents.on('dom-ready', () => {
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
let quitButtonInjected = false;

function injectQuitButton() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const removeScript = `
    (function() {
      var existingBtn = document.getElementById('lananh-exit-btn');
      var existingDialog = document.getElementById('lananh-exit-dialog');
      if (existingBtn) existingBtn.remove();
      if (existingDialog) existingDialog.remove();
    })();
  `;
  mainWindow.webContents.executeJavaScript(removeScript).catch(() => {});

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
        '<input id="lananh-exit-pw" type="password" placeholder="Nhap mat khau..." style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:11px 14px;color:#f8fafc;font-size:14px;outline:none;box-sizing:border-box;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'lananh-exit-submit\').click()">' +
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
              // Quit app after successful password verification
              window.electronAPI.quitApp();
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
// LOCKDOWN
// ============================================================
function activateLockdown() {
  if (isLockdownActive) return;

  // TEST ACCOUNT BYPASS: Skip lockdown for test account
  if (isTestAccountLoggedIn) {
    log('[Lockdown] SKIPPED - Test account bypass active');
    injectQuitButton();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('lockdown-deactivated');
    }
    return;
  }

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

// Custom update: open installer download URL in browser
ipcMain.handle('update:start-download', (_event, url) => {
  log(`[Update] Starting download from: ${url}`);

  // Validate URL before opening
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      log(`[Update] Invalid protocol: ${parsedUrl.protocol}`, 'ERROR');
      return { success: false, error: 'Invalid URL protocol' };
    }

    // Use shell.openExternal with proper validation
    shell.openExternal(url).then(() => {
      log('[Update] Installer opened in browser');
      // Show ready state - user will run the installer themselves
      if (mainWindow && !mainWindow.isDestroyed()) {
        injectUpdateUI('ready', 100, latestVersion, '');
      }
    }).catch((err) => {
      log(`[Update] Failed to open URL: ${err.message}`, 'ERROR');
      // Failsafe: try to show manual download instructions
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          (function() {
            var existing = document.getElementById('lananh-update-overlay');
            if (existing) existing.remove();
            var overlay = document.createElement('div');
            overlay.id = 'lananh-update-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:Segoe UI,sans-serif;';
            overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:32px;max-width:400px;text-align:center;"><h2 style="color:#dc2626;margin:0 0 12px;">Loi tai file</h2><p style="color:#666;margin:0 0 16px;">Vui long tai file thu cong tai:<br><a href="${url}" style="color:#5F8D78;word-break:break-all;">${url}</a></p><button onclick="document.getElementById(\\\'lananh-update-overlay\\\').remove()" style="padding:10px 24px;background:#5F8D78;color:#fff;border:none;border-radius:8px;cursor:pointer;">Dong</button></div>';
            document.body.appendChild(overlay);
          })();
        `).catch(() => {});
      }
    });
    return { success: true };
  } catch (err) {
    log(`[Update] Download error: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
});

ipcMain.handle('update:install-restart', () => {
  log('[Update] Install and restart requested - opening installer');
  // The installer was already opened via browser, so just hide the overlay
  hideUpdateOverlay();
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

// Check if email is test account
ipcMain.handle('auth:check-test-account', (_event, email) => {
  const isTestAccount = email && email.toLowerCase() === CONFIG.TEST_ACCOUNT_EMAIL.toLowerCase();
  log(`[Auth] Checking test account: ${email} -> ${isTestAccount ? 'BYPASS' : 'Normal'}`);
  return { isTestAccount };
});

// Verify login credentials (for test account bypass)
ipcMain.handle('auth:verify-credentials', (_event, email, password) => {
  const isTestAccount = email && email.toLowerCase() === CONFIG.TEST_ACCOUNT_EMAIL.toLowerCase();
  const isValid = isTestAccount && password === CONFIG.TEST_ACCOUNT_PASSWORD;
  log(`[Auth] Verify credentials: ${email} -> ${isValid ? 'SUCCESS' : 'FAILED'}`);
  return { success: isValid, isTestAccount };
});

// Set test account login state (bypass lockdown)
ipcMain.handle('auth:set-test-account-login', (_event, isTestAccount) => {
  isTestAccountLoggedIn = isTestAccount;
  log(`[Auth] Test account login state: ${isTestAccount}`);
  return { success: true };
});

// Login timeout management
ipcMain.handle('auth:start-login-timeout', () => {
  if (loginTimeoutId) {
    clearTimeout(loginTimeoutId);
  }
  loginTimeoutId = setTimeout(() => {
    log('[Auth] Login timeout reached (10s)', 'WARN');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(`
        (function() {
          var el = document.querySelector('[class*="spinner"], [class*="Loader"], [class*="loading"]');
          if (el) el.remove();
          var msg = document.createElement('div');
          msg.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;z-index:9999;';
          msg.textContent = 'Ket noi cham. Vui long thu lai.';
          document.body.appendChild(msg);
          setTimeout(() => msg.remove(), 5000);
        })();
      `).catch(() => {});
    }
  }, CONFIG.LOGIN_TIMEOUT_MS);
  log('[Auth] Login timeout started');
  return { success: true };
});

ipcMain.handle('auth:clear-login-timeout', () => {
  if (loginTimeoutId) {
    clearTimeout(loginTimeoutId);
    loginTimeoutId = null;
    log('[Auth] Login timeout cleared');
  }
  return { success: true };
});

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

// Force quit - bypasses lockdown (called after password verification)
ipcMain.handle('app:quit-force', () => {
  log('[App] Force quit requested (password verified)');
  isQuitting = true;
  deactivateLockdown();
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

  log(`[App] Starting v${app.getVersion()} - Platform: ${process.platform}`);

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
