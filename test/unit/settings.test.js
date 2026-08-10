// Tests für die Einstellungen (Entwicklungsauftrag 4, Abschnitt 21 + Abschnitt 24
// "Interfacezustände"): jede gezeigte Einstellung wirkt sofort (Theme/Schriftgröße direkt am
// documentElement), wird über AppState.updateSettings gespeichert und zeigt beim erneuten
// Öffnen den zuletzt gespeicherten Wert (Persistenz über AppState simuliert, kein echter
// Neustart nötig, da main.js' Speicherlogik bereits in test/unit/progressStore.test.js geprüft
// wird).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub, FakeElement } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');

function documentStubWithDocumentElement() {
  const stub = createDocumentStub();
  stub.documentElement = new FakeElement('html');
  return stub;
}

function loadSettingsView(initialSettings, applyThemeCalls) {
  let settings = { ...initialSettings };
  const updates = [];
  const context = {
    document: documentStubWithDocumentElement(),
    console,
    // Entwicklungsauftrag 14: settings.js rendert den Theme-Schalter jetzt über die echte,
    // gemeinsam genutzte Komponente (statt eines <select>), unten per vm.runInContext geladen --
    // dieser Test prüft damit auch, dass settings.js sie korrekt verdrahtet.
    AppState: {
      getSettings: () => settings,
      updateSettings: (partial) => {
        settings = { ...settings, ...partial };
        updates.push(partial);
        return Promise.resolve();
      }
    },
    App: {
      applyTheme: (theme) => applyThemeCalls.push(theme)
    }
  };
  vm.createContext(context);
  const themeToggleSrc = fs.readFileSync(path.join(ROOT, 'src', 'js', 'themeToggle.js'), 'utf-8');
  vm.runInContext(themeToggleSrc, context);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'views', 'settings.js'), 'utf-8');
  vm.runInContext(`${src}\nthis.__SettingsView = SettingsView;`, context);
  return { view: context.__SettingsView, updates, getSettings: () => settings };
}

/** Findet den aktiven Theme-Toggle-Button (das im Test verwendete Analogon zum alten <select>). */
function activeThemeToggleButton(container) {
  return container.querySelectorAll('.theme-toggle-btn').find((b) => b.getAttribute('aria-pressed') === 'true');
}
function themeToggleButtonByLabel(container, label) {
  return container.querySelectorAll('.theme-toggle-btn').find((b) => b.textContent.includes(label));
}

test('SettingsView.mount() zeigt die aktuell gespeicherten Werte vorausgewählt an (inkl. aktiver Theme-Schalter-Button)', () => {
  const applyThemeCalls = [];
  const { view } = loadSettingsView({
    theme: 'dark', arabicFontScale: 'large', dailyNewLimit: 15,
    showDiacritics: true, showTransliteration: false, autoAdvanceAfterFeedback: true
  }, applyThemeCalls);
  const container = createDocumentStub().createElement('div');
  view.mount(container);

  const active = activeThemeToggleButton(container);
  assert.ok(active, 'genau ein Theme-Toggle-Button muss als aktiv markiert sein');
  assert.ok(active.textContent.includes('Dunkel'), 'bei theme:"dark" muss der "Dunkel"-Button aktiv sein');
  assert.equal(container.querySelector('#settings-arabic-font-scale').value, 'large');
  assert.equal(container.querySelector('#settings-daily-new-limit').value, '15');
  assert.equal(container.querySelector('#settings-show-transliteration').checked, false);
  assert.equal(container.querySelector('#settings-auto-advance').checked, true);
});

test('Theme-Wechsel: wird sofort angewendet (App.applyTheme) UND über AppState.updateSettings gespeichert', () => {
  const applyThemeCalls = [];
  const { view, updates } = loadSettingsView({ theme: 'light' }, applyThemeCalls);
  const container = createDocumentStub().createElement('div');
  view.mount(container);

  themeToggleButtonByLabel(container, 'Dunkel').click();

  assert.deepEqual(applyThemeCalls, ['dark'], 'Theme sollte sofort über App.applyTheme() angewendet werden');
  assert.equal(updates[updates.length - 1].theme, 'dark', 'Theme-Änderung sollte über AppState.updateSettings gespeichert werden');
});

test('Theme-Wechsel: der aktive Zustand des Schalters wird nach der Auswahl sofort nachgezogen', () => {
  const { view } = loadSettingsView({ theme: 'light' }, []);
  const container = createDocumentStub().createElement('div');
  view.mount(container);

  themeToggleButtonByLabel(container, 'Dunkel').click();

  const active = activeThemeToggleButton(container);
  assert.ok(active.textContent.includes('Dunkel'), 'nach dem Klick muss der Dunkel-Button als aktiv angezeigt werden');
});

test('Erneutes Öffnen (mount) NACH einer Änderung zeigt den zuletzt gespeicherten Wert (Persistenz)', () => {
  const applyThemeCalls = [];
  const { view, getSettings } = loadSettingsView({ theme: 'light', arabicFontScale: 'normal' }, applyThemeCalls);
  const container1 = createDocumentStub().createElement('div');
  view.mount(container1);
  const select1 = container1.querySelector('#settings-arabic-font-scale');
  select1.value = 'large';
  select1.dispatchEvent({ type: 'change', target: select1 });
  assert.equal(getSettings().arabicFontScale, 'large');

  // Simuliert das erneute Öffnen der Einstellungen-Ansicht (z. B. nach Navigation weg und
  // zurück, oder nach einem Neustart mit denselben gespeicherten Werten).
  const container2 = createDocumentStub().createElement('div');
  view.mount(container2);
  assert.equal(container2.querySelector('#settings-arabic-font-scale').value, 'large',
    'nach erneutem Öffnen sollte die zuletzt gespeicherte Schriftgröße vorausgewählt sein');
});

test('Checkbox-Einstellungen (z. B. "Umschrift anzeigen") speichern den neuen Wert über AppState.updateSettings', () => {
  const applyThemeCalls = [];
  const { view, updates } = loadSettingsView({ showTransliteration: true }, applyThemeCalls);
  const container = createDocumentStub().createElement('div');
  view.mount(container);

  const checkbox = container.querySelector('#settings-show-transliteration');
  assert.equal(checkbox.checked, true);
  checkbox.checked = false;
  checkbox.dispatchEvent({ type: 'change', target: checkbox });

  const relevant = updates.find((u) => 'showTransliteration' in u);
  assert.ok(relevant, 'Checkbox-Änderung sollte AppState.updateSettings mit dem neuen Wert aufrufen');
  assert.equal(relevant.showTransliteration, false);
});

test('Tägliches Wortlimit: Änderung wird als Zahl (nicht als String) gespeichert', () => {
  const applyThemeCalls = [];
  const { view, updates } = loadSettingsView({ dailyNewLimit: 10 }, applyThemeCalls);
  const container = createDocumentStub().createElement('div');
  view.mount(container);

  const select = container.querySelector('#settings-daily-new-limit');
  select.value = '20';
  select.dispatchEvent({ type: 'change', target: select });

  const relevant = updates.find((u) => 'dailyNewLimit' in u);
  assert.ok(relevant);
  assert.equal(relevant.dailyNewLimit, 20);
  assert.equal(typeof relevant.dailyNewLimit, 'number');
});
