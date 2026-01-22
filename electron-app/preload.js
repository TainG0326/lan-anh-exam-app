const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Get exam configuration
  getExamConfig: () => ipcRenderer.invoke('get-exam-config'),
  
  // Set exam ID
  setExamId: (id) => ipcRenderer.invoke('set-exam-id', id),
  
  // Generate BEK hash
  generateBEKHash: (url) => ipcRenderer.invoke('generate-bek-hash', url),
  
  // Check VM detection
  checkVMDetection: (webglVendor) => ipcRenderer.invoke('check-vm-detection', webglVendor),
  
  // Exit exam (only allowed after submission)
  exitExam: () => ipcRenderer.invoke('exit-exam'),
  
  // Platform info
  platform: process.platform,
  
  // Check if running in Electron
  isElectron: true,
});

// Inject VM detection script
window.addEventListener('DOMContentLoaded', () => {
  // Check WebGL vendor for VM detection
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Send to main process for validation
      if (window.electronAPI) {
        window.electronAPI.checkVMDetection(vendor + ' ' + renderer).then(result => {
          if (result.blocked) {
            document.body.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
                <h1 style="color: #dc2626; margin-bottom: 20px;">Access Denied</h1>
                <p style="font-size: 18px; color: #666;">${result.message}</p>
                <p style="font-size: 14px; color: #999; margin-top: 10px;">Virtual machines are not allowed for security reasons.</p>
              </div>
            `;
          }
        });
      }
    }
  }
});



