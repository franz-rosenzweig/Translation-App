const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  processTranslation: (payload) => ipcRenderer.invoke('process-translation', payload),
  
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (content) => ipcRenderer.invoke('dialog:saveFile', content),
  
  // Menu events
  onMenuEvent: (callback) => ipcRenderer.on('menu-event', callback),
  
  // Version info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // API Key management
  getApiKey: () => ipcRenderer.invoke('api-key:get'),
  saveApiKey: (apiKey) => ipcRenderer.invoke('api-key:save', apiKey),
  testApiKey: (apiKey) => ipcRenderer.invoke('api-key:test', apiKey),
  removeApiKey: () => ipcRenderer.invoke('api-key:remove')
});
