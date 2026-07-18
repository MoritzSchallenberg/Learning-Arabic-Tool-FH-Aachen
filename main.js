const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

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
    autoPlaySentence: true,
    slowPlayback: false
  },
  installedLanguages: ['arabic'],
  statistics: {}
};

function ensureUserDataDir() {
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }
}

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  ensureUserDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function loadUserData(key) {
  ensureUserDataDir();
  const filePath = path.join(USER_DATA_DIR, USER_DATA_FILES[key]);
  return readJsonFile(filePath, DEFAULTS[key]);
}

function saveUserData(key, data) {
  const filePath = path.join(USER_DATA_DIR, USER_DATA_FILES[key]);
  writeJsonFile(filePath, data);
  return true;
}

function loadLanguagePack(languageId) {
  const packDir = path.join(LANGUAGE_PACKS_DIR, languageId);
  const pack = {
    language: readJsonFile(path.join(packDir, 'language.json'), null),
    lessons: readJsonFile(path.join(packDir, 'lessons.json'), null),
    vocabulary: readJsonFile(path.join(packDir, 'vocabulary.json'), null),
    keyboard: readJsonFile(path.join(packDir, 'keyboard.json'), null),
    grammar: readJsonFile(path.join(packDir, 'grammar.json'), null),
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
