// Entwicklungsauftrag 12, Abschnitt 2 — schmale, sichere Preload-Schnittstelle für den
// Review-Modus. Exponiert bewusst nur benannte, eng begrenzte Funktionen (kein "ipcRenderer"
// selbst, kein "require") -- der Renderer kann dadurch niemals beliebigen Code im Hauptprozess
// ausführen oder auf das Dateisystem zugreifen, außer über genau diese Kanäle.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('reviewApi', {
  loadAll: () => ipcRenderer.invoke('review:loadAll'),
  loadAudio: (wordId) => ipcRenderer.invoke('review:loadAudio', wordId),
  loadHistory: () => ipcRenderer.invoke('review:loadHistory'),
  loadConstants: () => ipcRenderer.invoke('review:loadConstants'),

  proposeWordCorrection: (payload) => ipcRenderer.invoke('review:proposeWordCorrection', payload),
  setWordAspectResult: (payload) => ipcRenderer.invoke('review:setWordAspectResult', payload),
  setWordOverallStatus: (payload) => ipcRenderer.invoke('review:setWordOverallStatus', payload),

  proposeTheoryCorrection: (payload) => ipcRenderer.invoke('review:proposeTheoryCorrection', payload),
  setTheoryAspectResult: (payload) => ipcRenderer.invoke('review:setTheoryAspectResult', payload),
  setTheoryOverallStatus: (payload) => ipcRenderer.invoke('review:setTheoryOverallStatus', payload),

  exportWorkspace: () => ipcRenderer.invoke('review:exportWorkspace')
});
