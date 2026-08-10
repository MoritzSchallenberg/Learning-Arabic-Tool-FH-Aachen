// Entwicklungsauftrag 14, Abschnitt 7/15/17 — Tests für die gemeinsame Theme-Schalter-Komponente
// (src/js/themeToggle.js): erkennbarer aktiver Modus, aria-label, native Tastaturbedienung (echte
// <button>-Elemente -- Tab/Enter/Leertaste funktionieren ohne Zusatzcode), kompakte Variante.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');

function loadThemeToggle() {
  const context = { document: createDocumentStub(), console };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'themeToggle.js'), 'utf-8');
  vm.runInContext(`${src}\nthis.__ThemeToggle = ThemeToggle;`, context);
  return context.__ThemeToggle;
}

test('rendert genau zwei Buttons: Hell und Dunkel', () => {
  const ThemeToggle = loadThemeToggle();
  const el = ThemeToggle.render('light', () => {});
  const buttons = el.querySelectorAll('button');
  assert.equal(buttons.length, 2);
  assert.ok(buttons[0].textContent.includes('Hell'));
  assert.ok(buttons[1].textContent.includes('Dunkel'));
});

test('der aktive Modus ist über aria-pressed UND eine sichtbare Klasse erkennbar (nicht nur Farbe)', () => {
  const ThemeToggle = loadThemeToggle();
  const el = ThemeToggle.render('dark', () => {});
  const buttons = el.querySelectorAll('button');
  const light = buttons.find((b) => b.textContent.includes('Hell'));
  const dark = buttons.find((b) => b.textContent.includes('Dunkel'));
  assert.equal(light.getAttribute('aria-pressed'), 'false');
  assert.equal(dark.getAttribute('aria-pressed'), 'true');
  assert.ok(dark.className.includes('active'));
  assert.ok(!light.className.includes('active'));
});

test('jeder Button hat ein verständliches aria-label', () => {
  const ThemeToggle = loadThemeToggle();
  const el = ThemeToggle.render('light', () => {});
  for (const btn of el.querySelectorAll('button')) {
    const label = btn.getAttribute('aria-label');
    assert.ok(label && label.length > 0, 'jeder Theme-Button braucht ein aria-label');
  }
});

test('die Gruppe hat role="group" und ein eigenes aria-label ("Farbschema")', () => {
  const ThemeToggle = loadThemeToggle();
  const el = ThemeToggle.render('light', () => {});
  assert.equal(el.getAttribute('role'), 'group');
  assert.equal(el.getAttribute('aria-label'), 'Farbschema');
});

test('Klick auf "Dunkel" ruft onChange("dark") auf', () => {
  const ThemeToggle = loadThemeToggle();
  const calls = [];
  const el = ThemeToggle.render('light', (theme) => calls.push(theme));
  el.querySelectorAll('button').find((b) => b.textContent.includes('Dunkel')).click();
  assert.deepEqual(calls, ['dark']);
});

test('Klick auf den bereits aktiven Modus löst KEINE unnötige Änderung aus', () => {
  const ThemeToggle = loadThemeToggle();
  const calls = [];
  const el = ThemeToggle.render('light', (theme) => calls.push(theme));
  el.querySelectorAll('button').find((b) => b.textContent.includes('Hell')).click();
  assert.deepEqual(calls, []);
});

test('alle Buttons sind natives <button type="button"> -- damit ohne Zusatzcode per Tab erreichbar und per Enter/Leertaste auslösbar (native Tastaturbedienung)', () => {
  const ThemeToggle = loadThemeToggle();
  const el = ThemeToggle.render('light', () => {});
  for (const btn of el.querySelectorAll('button')) {
    assert.equal(btn.tagName, 'button');
    assert.equal(btn.type, 'button', '.type = "button" verhindert ein unbeabsichtigtes Formular-Submit, ändert aber nichts an der nativen Tastaturbedienung');
    assert.ok(!btn.hasAttribute('tabindex') || btn.getAttribute('tabindex') !== '-1', 'darf nicht aus der Tab-Reihenfolge entfernt sein');
  }
});

test('kompakte Variante (Kopfbereich): zeigt nur Symbole, behält aber weiterhin aria-label', () => {
  const ThemeToggle = loadThemeToggle();
  const el = ThemeToggle.render('light', () => {}, { compact: true });
  assert.ok(el.className.includes('theme-toggle-compact'));
  const buttons = el.querySelectorAll('button');
  assert.equal(buttons.length, 2);
  for (const btn of buttons) {
    assert.ok(btn.getAttribute('aria-label'), 'auch im kompakten Modus (nur Symbol sichtbar) braucht es ein aria-label');
  }
});

test('unbekannter currentTheme-Wert wird wie "light" behandelt (defensiv, konsistent mit progressStore#normalizeThemeValue)', () => {
  const ThemeToggle = loadThemeToggle();
  const el = ThemeToggle.render('system', () => {});
  const active = el.querySelectorAll('button').find((b) => b.getAttribute('aria-pressed') === 'true');
  assert.ok(active.textContent.includes('Hell'));
});
