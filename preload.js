const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadProgress: () => ipcRenderer.invoke('user-data:load', 'progress'),
  saveProgress: (data) => ipcRenderer.invoke('user-data:save', 'progress', data),

  loadSettings: () => ipcRenderer.invoke('user-data:load', 'settings'),
  saveSettings: (data) => ipcRenderer.invoke('user-data:save', 'settings', data),

  loadInstalledLanguages: () => ipcRenderer.invoke('user-data:load', 'installedLanguages'),
  saveInstalledLanguages: (data) => ipcRenderer.invoke('user-data:save', 'installedLanguages', data),

  loadStatistics: () => ipcRenderer.invoke('user-data:load', 'statistics'),
  saveStatistics: (data) => ipcRenderer.invoke('user-data:save', 'statistics', data),

  loadLanguagePack: (languageId) => ipcRenderer.invoke('language-pack:load', languageId),
  listLanguagePacks: () => ipcRenderer.invoke('language-pack:list'),
  loadAudio: (languageId, audioKey) => ipcRenderer.invoke('language-pack:audio', languageId, audioKey)
});
