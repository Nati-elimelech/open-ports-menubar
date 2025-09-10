const { contextBridge, ipcRenderer } = require('electron');

// Only expose settings API for preferences window
contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings)
});