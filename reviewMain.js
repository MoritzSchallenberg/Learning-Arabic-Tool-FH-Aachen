// Entwicklungsauftrag 12, Abschnitt 2 — Electron-Hauptprozess für den lokalen Sprachprüf-
// Arbeitsbereich ("Review-Modus"). Bewusst eine EIGENE, komplett getrennte Datei/App-Instanz --
// main.js (die normale Lernoberfläche, weiterhin über "npm start" erreichbar) bleibt dadurch
// unangetastet. Start über "npm run review:start" (electron reviewMain.js).
//
// Sicherheitsanforderungen (Abschnitt 2), identisch zu main.js:
//   - vollständig lokal, keine Cloud-Synchronisierung, kein Konto, keine externe Datenbank
//   - contextIsolation:true, nodeIntegration:false, sandbox:true
//   - sichere, schmale Preload-/IPC-Schnittstelle (reviewPreload.js) -- keine direkte
//     Node-Ausführung aus dem Renderer
//   - kein Zugriff auf beliebige Systemdateien: jeder Dateizugriff läuft durch eine der unten
//     definierten Funktionen, die Pfade validieren/auf feste Verzeichnisse beschränken, nie
//     direkt einen vom Renderer übergebenen Pfad öffnen.

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const { loadReviewData, computeDashboardSummary } = require('./scripts/review/reviewDataLoader.js');
const store = require('./scripts/review/reviewWorkspaceStore.js');
const reviewConstants = require('./scripts/review/reviewConstants.js');
// Entwicklungsauftrag 13, Abschnitt 9 — derselbe gehärtete Audiozugriff wie main.js (EIN Baustein
// statt zwei leicht unterschiedlicher Implementierungen). Erwartet jetzt einen vollständigen
// audioKey ("vocabulary/<id>", vom Renderer über AudioKeyResolver.resolveVocabularyAudioKey()
// aufgelöst), keine rohe Wort-ID mehr -- konsistent mit main.js#loadAudio.
const { loadAudioBase64Safe } = require('./scripts/audioFileAccess.js');

const WORKSPACE_PATHS = store.paths(ROOT);
const AUDIO_DIR = path.join(ROOT, 'language-packs', 'arabic', 'audio');

function getData() {
  return loadReviewData(ROOT);
}

function loadAudioBase64(audioKey) {
  return loadAudioBase64Safe(AUDIO_DIR, audioKey, { logPrefix: '[Audio:review]' });
}

function registerIpcHandlers() {
  // --- rein lesend -----------------------------------------------------------------------------
  ipcMain.handle('review:loadAll', () => {
    const data = getData();
    return {
      words: data.words,
      theories: data.theories,
      sessions: data.sessions,
      units: data.units,
      summary: computeDashboardSummary(data)
    };
  });
  ipcMain.handle('review:loadAudio', (_event, wordId) => loadAudioBase64(wordId));
  ipcMain.handle('review:loadHistory', () => store.loadHistory(WORKSPACE_PATHS.historyPath));
  // EINE zentrale Quelle für Aspekt-/Status-Vokabular (scripts/review/reviewConstants.js) --
  // die Oberfläche bekommt sie über IPC statt einer eigenen, doppelt gepflegten Kopie.
  ipcMain.handle('review:loadConstants', () => reviewConstants);

  // --- Wort-Prüfung ------------------------------------------------------------------------------
  ipcMain.handle('review:proposeWordCorrection', (_event, payload) => store.proposeWordCorrection(WORKSPACE_PATHS, payload));
  ipcMain.handle('review:setWordAspectResult', (_event, payload) => store.setWordAspectResult(WORKSPACE_PATHS, payload));
  ipcMain.handle('review:setWordOverallStatus', (_event, payload) => store.setWordOverallStatus(WORKSPACE_PATHS, payload));

  // --- Theorie-Prüfung ---------------------------------------------------------------------------
  ipcMain.handle('review:proposeTheoryCorrection', (_event, payload) => store.proposeTheoryCorrection(WORKSPACE_PATHS, payload));
  ipcMain.handle('review:setTheoryAspectResult', (_event, payload) => store.setTheoryAspectResult(WORKSPACE_PATHS, payload));
  ipcMain.handle('review:setTheoryOverallStatus', (_event, payload) => store.setTheoryOverallStatus(WORKSPACE_PATHS, payload));

  // --- Export --------------------------------------------------------------------------------------
  ipcMain.handle('review:exportWorkspace', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Ordner für den Export des Sprachprüf-Arbeitsstands wählen',
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return { ok: false, cancelled: true };
    const targetDir = path.join(result.filePaths[0], `review-export-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    const exportResult = store.exportWorkspace(WORKSPACE_PATHS, targetDir);
    return { ok: true, ...exportResult };
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: 'Learning Arabic Tool — Sprachprüfung (Review-Modus)',
    webPreferences: {
      preload: path.join(__dirname, 'reviewPreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'review', 'index.html'));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
