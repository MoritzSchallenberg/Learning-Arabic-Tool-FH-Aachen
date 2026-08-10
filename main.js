const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const progressStore = require('./src/js/progressStore.js');

const USER_DATA_DIR = path.join(app.getPath('userData'), 'user_data');
const LANGUAGE_PACKS_DIR = path.join(__dirname, 'language-packs');

const USER_DATA_FILES = {
  progress: 'progress.json',
  settings: 'settings.json',
  installedLanguages: 'installed_languages.json',
  statistics: 'statistics.json'
};

const DEFAULTS = {
  progress: {},
  // Entwicklungsauftrag 14, Abschnitt 8: die konkreten Feldwerte + das Versionsfeld leben jetzt
  // zentral in progressStore.js#SETTINGS_FIELD_DEFAULTS/migrateSettings(), damit main.js und
  // Tests dieselbe einzige Quelle verwenden (kein zweiter, unabhängiger Speichermechanismus).
  settings: progressStore.SETTINGS_FIELD_DEFAULTS,
  installedLanguages: ['arabic'],
  statistics: {}
};

function filePathFor(key) {
  return path.join(USER_DATA_DIR, USER_DATA_FILES[key]);
}

// P0.4: Fortschritt (und die anderen Nutzerdaten) atomar speichern (temp+rename), mit
// Backup der zuletzt gültigen Version und Wiederherstellung bei kaputter Datei — siehe
// src/js/progressStore.js. progress.json bekommt zusätzlich ein Versionsfeld + Migration.
function loadUserData(key) {
  progressStore.ensureDir(USER_DATA_DIR);
  const filePath = filePathFor(key);
  const raw = progressStore.readJsonFileSafe(filePath, undefined);

  if (key === 'progress') {
    const hadStoredData = raw !== undefined;
    const migrated = progressStore.migrateProgress(hadStoredData ? raw : DEFAULTS.progress);
    if (hadStoredData && progressStore.isLegacyProgressFormat(raw)) {
      // Alte, unversionierte Fortschrittsdatei gefunden — Migration sofort persistieren, damit
      // sie nicht bei jedem Start erneut berechnet werden muss und ein Absturz direkt danach
      // nichts verliert.
      progressStore.writeJsonFileAtomic(filePath, migrated);
    }
    return migrated;
  }

  if (key === 'settings') {
    const hadStoredData = raw !== undefined;
    const migrated = progressStore.migrateSettings(hadStoredData ? raw : undefined);
    if (hadStoredData && (progressStore.isLegacySettingsFormat(raw) || raw.theme !== migrated.theme)) {
      // Alte, unversionierte Datei ODER ein ungültiger/entfallener theme-Wert (z. B. das frühere
      // "system") gefunden — Migration sofort persistieren, analog zum progress.json-Verhalten.
      progressStore.writeJsonFileAtomic(filePath, migrated);
    }
    return migrated;
  }

  if (raw === undefined) return DEFAULTS[key];
  return raw;
}

function saveUserData(key, data) {
  const filePath = filePathFor(key);
  return progressStore.enqueueWrite(filePath, () => {
    progressStore.writeJsonFileAtomic(filePath, data);
    return true;
  });
}

function readJsonFile(filePath, fallback) {
  return progressStore.readJsonFileSafe(filePath, fallback);
}

function loadLanguagePack(languageId) {
  const packDir = path.join(LANGUAGE_PACKS_DIR, languageId);
  const pack = {
    language: readJsonFile(path.join(packDir, 'language.json'), null),
    lessons: readJsonFile(path.join(packDir, 'lessons.json'), null),
    vocabulary: readJsonFile(path.join(packDir, 'vocabulary.json'), null),
    keyboard: readJsonFile(path.join(packDir, 'keyboard.json'), null),
    grammar: readJsonFile(path.join(packDir, 'grammar.json'), null),
    grammar2: readJsonFile(path.join(packDir, 'grammar_2.json'), null),
    grammar3: readJsonFile(path.join(packDir, 'grammar_3.json'), null),
    reading: readJsonFile(path.join(packDir, 'reading.json'), null),
    courses: readJsonFile(path.join(packDir, 'courses.json'), null),
    vocabSessions: readJsonFile(path.join(packDir, 'vocabSessions.json'), null),
    theory: readJsonFile(path.join(packDir, 'theory.json'), null),
    tutorials: {
      introduction: readJsonFile(path.join(packDir, 'tutorials', 'introduction.json'), null),
      keyboard: readJsonFile(path.join(packDir, 'tutorials', 'keyboard.json'), null)
    }
  };
  return pack;
}

// Entwicklungsauftrag 13, Abschnitt 9 — gehärteter, mit reviewMain.js geteilter Audiozugriff
// (scripts/audioFileAccess.js: audioKey-Muster, path.resolve + Präfixprüfung, Ablehnung von
// absoluten Pfaden/"..", verständliche Fehlermeldungen im Hauptprozess-Log).
const { loadAudioBase64Safe } = require('./scripts/audioFileAccess.js');

// languageId kommt ebenfalls vom Renderer -- eigene, unabhängige Prüfung gegen eine feste Syntax
// UND gegen die tatsächlich installierten Sprachpakete, bevor daraus ein Verzeichnisname wird.
const LANGUAGE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function loadAudio(languageId, audioKey) {
  if (typeof languageId !== 'string' || !LANGUAGE_ID_PATTERN.test(languageId)) {
    console.error(`[Audio] Anfrage abgelehnt: ungültige languageId "${languageId}"`);
    return null;
  }
  if (!listInstalledLanguages().includes(languageId)) {
    console.error(`[Audio] Anfrage abgelehnt: languageId "${languageId}" ist kein installiertes Sprachpaket`);
    return null;
  }
  const audioDir = path.join(LANGUAGE_PACKS_DIR, languageId, 'audio');
  return loadAudioBase64Safe(audioDir, audioKey, { logPrefix: '[Audio:main]' });
}

function listInstalledLanguages() {
  if (!fs.existsSync(LANGUAGE_PACKS_DIR)) return [];
  return fs.readdirSync(LANGUAGE_PACKS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function registerIpcHandlers() {
  ipcMain.handle('user-data:load', (_event, key) => loadUserData(key));
  ipcMain.handle('user-data:save', (_event, key, data) => saveUserData(key, data));
  ipcMain.handle('language-pack:load', (_event, languageId) => loadLanguagePack(languageId));
  ipcMain.handle('language-pack:list', () => listInstalledLanguages());
  ipcMain.handle('language-pack:audio', (_event, languageId, audioKey) => loadAudio(languageId, audioKey));

  // Entwicklungsauftrag 14, Abschnitt 9 — SYNCHRONE Anfrage (bewusst kein `.handle()`/`.invoke()`,
  // die sind immer asynchron), damit preload.js das gespeicherte Theme noch VOR dem ersten
  // Rendern der Seite kennt und sofort als data-theme-Attribut setzen kann (verhindert das kurze
  // Aufblitzen des falschen Modus). Liest dieselbe, bereits migrierte/validierte Einstellung wie
  // der normale "settings"-Kanal -- kein zweiter Speichermechanismus, nur ein zweiter, schneller
  // Lesezugriff auf denselben Wert. Kein unsicherer Dateizugriff aus dem Renderer: die Datei wird
  // weiterhin ausschließlich im Hauptprozess gelesen.
  ipcMain.on('theme:getInitial', (event) => {
    event.returnValue = loadUserData('settings').theme;
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
