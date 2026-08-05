// Tests für src/js/helpLevel.js (Entwicklungsauftrag 3, Meilenstein B — Hilfestufen A-E).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const HelpLevel = require('../../src/js/helpLevel.js');

test('startet standardmäßig auf Stufe C', () => {
  const h = HelpLevel.create();
  assert.equal(h.currentLevel(), 'C');
});

test('kann mit einer expliziten Startstufe erzeugt werden', () => {
  const h = HelpLevel.create('A');
  assert.equal(h.currentLevel(), 'A');
});

test('unbekannte Startstufe fällt auf C zurück', () => {
  const h = HelpLevel.create('Z');
  assert.equal(h.currentLevel(), 'C');
});

test('zwei Fehler in Folge erhöhen die Hilfe (Stufe sinkt Richtung A)', () => {
  const h = HelpLevel.create('C');
  h.registerResult(false);
  const result = h.registerResult(false);
  assert.equal(result.level, 'B');
  assert.equal(result.changed, true);
  assert.equal(result.direction, 'more_help');
});

test('drei richtige Antworten in Folge reduzieren die Hilfe (Stufe steigt Richtung E)', () => {
  const h = HelpLevel.create('C');
  h.registerResult(true);
  h.registerResult(true);
  const result = h.registerResult(true);
  assert.equal(result.level, 'D');
  assert.equal(result.changed, true);
  assert.equal(result.direction, 'less_help');
});

test('Stufe A ist die Untergrenze — noch mehr Fehler können nicht darunter gehen', () => {
  const h = HelpLevel.create('A');
  h.registerResult(false);
  h.registerResult(false);
  h.registerResult(false);
  h.registerResult(false);
  assert.equal(h.currentLevel(), 'A');
});

test('Stufe E ist die Obergrenze — noch mehr richtige Antworten können nicht darüber gehen', () => {
  const h = HelpLevel.create('E');
  for (let i = 0; i < 6; i++) h.registerResult(true);
  assert.equal(h.currentLevel(), 'E');
});

test('ein einzelner Fehler allein löst noch keine Erhöhung aus (erst nach 2 in Folge)', () => {
  const h = HelpLevel.create('C');
  const result = h.registerResult(false);
  assert.equal(result.level, 'C');
  assert.equal(result.changed, false);
});

test('eine richtige Antwort setzt den Fehler-Streak zurück', () => {
  const h = HelpLevel.create('C');
  h.registerResult(false);
  h.registerResult(true); // Streak-Reset
  const result = h.registerResult(false); // erst 1 Fehler seit Reset
  assert.equal(result.changed, false);
  assert.equal(h.currentLevel(), 'C');
});

test('setLevel() erzwingt eine Stufe und setzt Streaks zurück', () => {
  const h = HelpLevel.create('C');
  h.registerResult(false);
  h.setLevel('E');
  assert.equal(h.currentLevel(), 'E');
  assert.equal(h.wrongStreak, 0);
});

test('config() liefert die erwartete Struktur je Stufe', () => {
  const configA = HelpLevel.HELP_LEVEL_CONFIG.A;
  const configE = HelpLevel.HELP_LEVEL_CONFIG.E;
  assert.equal(configA.showTransliteration, true);
  assert.equal(configA.highlightKeyboard, 'strong');
  assert.equal(configA.keyboardLevel, 1);
  assert.equal(configE.showTranslation, false);
  assert.equal(configE.application, true);
  assert.equal(configE.keyboardLevel, 4);
});

test('LEVELS enthält genau die 5 Stufen A-E in dieser Reihenfolge', () => {
  assert.deepEqual(HelpLevel.LEVELS, ['A', 'B', 'C', 'D', 'E']);
});
