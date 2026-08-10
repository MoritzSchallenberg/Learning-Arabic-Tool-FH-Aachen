// Entwicklungsauftrag 14, Abschnitt 8/17 — Tests für die Einstellungs-Migration/-Validierung
// (src/js/progressStore.js#migrateSettings/normalizeThemeValue/isLegacySettingsFormat). Dieselbe
// Funktion, die main.js beim Laden von settings.json tatsächlich verwendet -- kein zweiter,
// unabhängiger Speichermechanismus nur für das Theme (Abschnitt 8, ausdrückliches Verbot).

const { test } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  CURRENT_SETTINGS_VERSION,
  VALID_THEMES,
  DEFAULT_THEME,
  SETTINGS_FIELD_DEFAULTS,
  isLegacySettingsFormat,
  normalizeThemeValue,
  migrateSettings,
  readJsonFileSafe,
  writeJsonFileAtomic
} = require('../../src/js/progressStore.js');

// --- End-zu-Ende gegen echte Dateien: dieselben Bausteine, die main.js#loadUserData/
// saveUserData tatsächlich verwendet (main.js selbst lädt "electron" und kann außerhalb von
// Electron nicht direkt require()-t werden -- die Speicherlogik liegt aber vollständig hier). ---
function withTempSettingsFile(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'settings-persist-test-'));
  try {
    return fn(path.join(dir, 'settings.json'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
/** Simuliert main.js#loadUserData('settings') exakt. */
function simulateLoad(filePath) {
  return migrateSettings(readJsonFileSafe(filePath, undefined));
}
/** Simuliert main.js#saveUserData('settings', data). */
function simulateSave(filePath, data) {
  writeJsonFileAtomic(filePath, data);
}

test('DEFAULT_THEME ist "light" (Hellmodus ist der Standard, Abschnitt 5)', () => {
  assert.equal(DEFAULT_THEME, 'light');
  assert.equal(SETTINGS_FIELD_DEFAULTS.theme, 'light');
});

test('VALID_THEMES enthält genau die zwei wählbaren Werte, kein "system" mehr (Abschnitt 7)', () => {
  assert.deepEqual([...VALID_THEMES].sort(), ['dark', 'light']);
});

test('normalizeThemeValue: "light"/"dark" bleiben unverändert', () => {
  assert.equal(normalizeThemeValue('light'), 'light');
  assert.equal(normalizeThemeValue('dark'), 'dark');
});

test('normalizeThemeValue: unbekannte Werte (inkl. des früheren "system") fallen kontrolliert auf "light" zurück', () => {
  assert.equal(normalizeThemeValue('system'), 'light');
  assert.equal(normalizeThemeValue('blau'), 'light');
  assert.equal(normalizeThemeValue(''), 'light');
  assert.equal(normalizeThemeValue(null), 'light');
  assert.equal(normalizeThemeValue(undefined), 'light');
  assert.equal(normalizeThemeValue(42), 'light');
});

test('isLegacySettingsFormat: erkennt eine settings.json ohne _version-Feld', () => {
  assert.equal(isLegacySettingsFormat({ theme: 'dark' }), true);
  assert.equal(isLegacySettingsFormat({ _version: 1, theme: 'dark' }), false);
  assert.equal(isLegacySettingsFormat(null), false);
  assert.equal(isLegacySettingsFormat([]), false);
});

test('migrateSettings: brandneue Installation (kein gespeicherter Wert) bekommt Hellmodus als Standard', () => {
  const migrated = migrateSettings(undefined);
  assert.equal(migrated.theme, 'light');
  assert.equal(migrated._version, CURRENT_SETTINGS_VERSION);
});

test('migrateSettings: Auswahl Hell bleibt Hell', () => {
  const migrated = migrateSettings({ _version: 1, theme: 'light' });
  assert.equal(migrated.theme, 'light');
});

test('migrateSettings: Auswahl Dunkel bleibt Dunkel', () => {
  const migrated = migrateSettings({ _version: 1, theme: 'dark' });
  assert.equal(migrated.theme, 'dark');
});

test('migrateSettings: altes gespeichertes "system" fällt kontrolliert auf Hell zurück (Abschnitt 5/8)', () => {
  const legacy = { inputMode: 'virtual_keyboard', theme: 'system', dailyNewLimit: 10 };
  const migrated = migrateSettings(legacy);
  assert.equal(migrated.theme, 'light');
  assert.equal(migrated._version, CURRENT_SETTINGS_VERSION);
});

test('migrateSettings: unbekannter/kaputter Theme-Wert fällt kontrolliert auf Hell zurück', () => {
  assert.equal(migrateSettings({ _version: 1, theme: 'sepia' }).theme, 'light');
  assert.equal(migrateSettings({ _version: 1, theme: 123 }).theme, 'light');
  assert.equal(migrateSettings({ _version: 1, theme: null }).theme, 'light');
});

test('migrateSettings: Migration alter, unversionierter Einstellungsdaten verliert keine anderen Felder', () => {
  const legacy = {
    inputMode: 'virtual_keyboard',
    showDiacritics: false,
    autoPlayWord: false,
    theme: 'dark',
    sidebarCollapsed: true,
    arabicFontScale: 'large',
    dailyNewLimit: 20,
    showTransliteration: false
  };
  const migrated = migrateSettings(legacy);
  assert.equal(migrated._version, CURRENT_SETTINGS_VERSION);
  assert.equal(migrated.theme, 'dark');
  assert.equal(migrated.showDiacritics, false);
  assert.equal(migrated.autoPlayWord, false);
  assert.equal(migrated.sidebarCollapsed, true);
  assert.equal(migrated.arabicFontScale, 'large');
  assert.equal(migrated.dailyNewLimit, 20);
  assert.equal(migrated.showTransliteration, false);
  assert.equal(migrated.inputMode, 'virtual_keyboard');
});

test('migrateSettings: bereits aktuelle, gültige Daten bleiben inhaltlich unverändert (idempotent)', () => {
  const current = { ...SETTINGS_FIELD_DEFAULTS, _version: CURRENT_SETTINGS_VERSION, theme: 'dark', dailyNewLimit: 15 };
  const migrated = migrateSettings(current);
  assert.deepEqual(migrated, current);
});

test('migrateSettings: neu hinzugekommene Felder werden aufgefüllt, ohne vorhandene Werte zu überschreiben', () => {
  // Simuliert eine ältere settings.json, die ein heute bekanntes Feld noch nicht kennt.
  const partial = { _version: 1, theme: 'dark' };
  const migrated = migrateSettings(partial);
  assert.equal(migrated.theme, 'dark', 'vorhandener Wert darf nicht überschrieben werden');
  assert.equal(migrated.dailyNewLimit, SETTINGS_FIELD_DEFAULTS.dailyNewLimit, 'fehlendes Feld wird mit dem Standardwert aufgefüllt');
  assert.equal(migrated.showDiacritics, SETTINGS_FIELD_DEFAULTS.showDiacritics);
});

test('migrateSettings: kaputte/leere Eingaben sind sicher (kein Crash), liefern vollständige Standardwerte', () => {
  for (const input of [null, undefined, {}, [], 'kaputt', 42]) {
    const migrated = migrateSettings(input);
    assert.equal(migrated.theme, 'light');
    assert.equal(migrated._version, CURRENT_SETTINGS_VERSION);
    assert.equal(typeof migrated.dailyNewLimit, 'number');
  }
});

test('migrateSettings betrifft ausschließlich Einstellungsfelder -- keine Lernfortschritts-Felder im Objekt (kein Datenverlust bei progress.json möglich, da komplett getrennte Datei/Funktion)', () => {
  const migrated = migrateSettings({ _version: 1, theme: 'dark' });
  assert.ok(!('cards' in migrated));
  assert.ok(!('languages' in migrated));
});

// --- Speicherung/Persistenz End-zu-Ende (Abschnitt 8/17: "Speicherung des Themes",
// "Theme nach Neustart") -- exakt dieselben Bausteine wie main.js, gegen echte temporäre
// Dateien, kein Mock der Speicherfunktionen selbst. ---------------------------------------------
test('Theme-Speicherung: ein gewähltes Theme übersteht einen simulierten Neustart (erneutes Laden derselben Datei)', () => {
  withTempSettingsFile((filePath) => {
    const loadedBeforeAnySave = simulateLoad(filePath); // "erster Start", noch keine Datei
    assert.equal(loadedBeforeAnySave.theme, 'light', 'ohne jede gespeicherte Einstellung ist Hell der Standard');

    simulateSave(filePath, { ...loadedBeforeAnySave, theme: 'dark' }); // Nutzer wählt Dunkel

    const loadedAfterRestart = simulateLoad(filePath); // "Neustart": Datei erneut von Grund auf gelesen
    assert.equal(loadedAfterRestart.theme, 'dark', 'nach einem Neustart muss das zuvor gewählte Theme wieder aktiv sein');
  });
});

test('Theme-Speicherung: eine alte, unversionierte settings.json mit "system" wird beim ersten Laden zu "light" migriert UND persistiert (wie main.js#loadUserData es tut)', () => {
  withTempSettingsFile((filePath) => {
    fs.writeFileSync(filePath, JSON.stringify({ inputMode: 'virtual_keyboard', theme: 'system', dailyNewLimit: 10 }), 'utf-8');
    const migrated = simulateLoad(filePath);
    assert.equal(migrated.theme, 'light');
    // main.js persistiert die Migration sofort (siehe main.js#loadUserData) -- hier eigens
    // nachgebildet, um zu prüfen, dass ein erneutes Laden danach nicht wieder "system" zurückgibt.
    simulateSave(filePath, migrated);
    const loadedAgain = simulateLoad(filePath);
    assert.equal(loadedAgain.theme, 'light');
    assert.equal(loadedAgain.dailyNewLimit, 10, 'andere Einstellungsfelder dürfen durch die Migration nicht verloren gehen');
  });
});

test('Theme-Speicherung: das Speichern des Themes lässt andere, unabhängig gesetzte Einstellungen unangetastet', () => {
  withTempSettingsFile((filePath) => {
    simulateSave(filePath, migrateSettings({ theme: 'light', dailyNewLimit: 20, showDiacritics: false }));
    const loaded = simulateLoad(filePath);
    loaded.theme = 'dark';
    simulateSave(filePath, loaded);
    const final = simulateLoad(filePath);
    assert.equal(final.theme, 'dark');
    assert.equal(final.dailyNewLimit, 20, 'ein Theme-Wechsel darf andere Einstellungen nicht zurücksetzen');
    assert.equal(final.showDiacritics, false);
  });
});
