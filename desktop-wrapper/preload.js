const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onStatusUpdate: (callback) => ipcRenderer.on('status-update', (_event, status, progress) => callback(status, progress))
});
