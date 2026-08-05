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
  settings: {
    inputMode: 'virtual_keyboard',
    showDiacritics: true,
    autoPlayWord: true,
    replayAfterAnswer: true,
    slowPlayback: false,
    // Entwicklungsauftrag 4, Schritt 1/Abschnitt 21: Designsystem + Einstellungen.
    theme: 'system', // 'system' | 'light' | 'dark'
    sidebarCollapsed: false,
    arabicFontScale: 'normal', // 'normal' | 'large'
    autoAdvanceAfterFeedback: false, // manuelles "Weiter" ist der Standard (Abschnitt 16.4)
    dailyNewLimit: 10,
    showTransliteration: true
  },
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

  if (raw === undefined) return DEFAULTS[key];

  // Neue Einstellungsfelder (z. B. aus späteren Versionen) transparent nachfüllen, ohne bereits
  // gespeicherte Werte zu überschreiben — sonst würden ältere settings.json-Dateien die neuen
  // Felder (z. B. "theme") dauerhaft als undefined zurückgeben (Entwicklungsauftrag 4, Schritt 1).
  if (key === 'settings') return { ...DEFAULTS.settings, ...raw };

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

const AUDIO_KEY_PATTERN = /^[a-zA-Z0-9_/-]+$/;

function loadAudio(languageId, audioKey) {
  if (!AUDIO_KEY_PATTERN.test(audioKey)) return null;
  const audioDir = path.join(LANGUAGE_PACKS_DIR, languageId, 'audio');
  const audioPath = path.join(audioDir, `${audioKey}.wav`);
  if (!audioPath.startsWith(audioDir + path.sep)) return null;
  try {
    return fs.readFileSync(audioPath).toString('base64');
  } catch (err) {
    return null;
  }
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
