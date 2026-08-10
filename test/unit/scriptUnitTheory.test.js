// Tests für Entwicklungsauftrag 5, Abschnitt 17 "Theorie auch für Schrift-Units": TheoryRenderer
// wird für Unit 1, Unit 2 und Unit 8 (Kurze Vokale) tatsächlich VOR der bestehenden
// Übungsphasenfolge angezeigt, ohne diese selbst zu verändern; ohne passendes Theoriedokument
// bleibt das bisherige Verhalten (direkter Einstieg) unverändert.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ExerciseGuard = require('../../src/js/exerciseGuard.js');
const keyboardData = require('../../src/js/keyboardData.js');
const srs = require('../../src/js/srs.js');

const ROOT = path.join(__dirname, '..', '..');

function loadTheoryData() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'theory.json'), 'utf-8'));
}
function loadKeyboardLetters() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'keyboard.json'), 'utf-8')).letters;
}

function baseContext() {
  return {
    document: createDocumentStub(),
    console,
    setTimeout,
    clearTimeout,
    ExerciseGuard,
    buildLetterForms: keyboardData.buildLetterForms,
    evaluateArabicAnswer: srs.evaluateArabicAnswer,
    adjustDifficulty: () => {},
    AudioPlayer: { speak: () => Promise.resolve({ source: 'audio' }), speakWord: () => Promise.resolve({ source: 'recorded_audio', mode: 'normal', audioKey: null }) },
    VirtualKeyboard: { mount: () => {} },
    ConnectionTrainer: { mount: () => {} },
    App: { registerCleanup: () => {}, navigateTo: () => {} }
  };
}

function loadLetterGroupLessonView({ withTheory }) {
  const context = baseContext();
  const cards = {};
  context.AppState = {
    getCard: (id) => { if (!cards[id]) cards[id] = { difficulty: {}, consecutiveWrong: {} }; return cards[id]; },
    persistProgress: () => Promise.resolve(),
    markTheoryOpened: () => {},
    markTheoryCompleted: () => Promise.resolve(),
    markTheoryMiniCheckResult: () => Promise.resolve(true),
    getLanguagePack: () => Promise.resolve({
      courses: { courses: [{ id: 'course_1', units: [{ id: 'unit_1', title: 'Unit 1', goal: 'Testziel', letters: ['alif', 'dal', 'dhal', 'ra', 'zay', 'waw'], demo_word: 'وَرْد', demo_word_meaning: 'Rosen' }] }] },
      keyboard: { letters: loadKeyboardLetters() },
      vocabulary: { categories: [] },
      theory: withTheory ? loadTheoryData() : null
    })
  };
  vm.createContext(context);
  const src = [
    fs.readFileSync(path.join(ROOT, 'src', 'js', 'theoryRenderer.js'), 'utf-8'),
    fs.readFileSync(path.join(ROOT, 'src', 'js', 'views', 'letterGroupLesson.js'), 'utf-8')
  ].join('\n;\n');
  vm.runInContext(`${src}\nthis.__View = LetterGroupLessonView;`, context);
  return context.__View;
}

test('Unit 1: mit vorhandenem Theoriedokument wird die Theorie ZUERST gezeigt, nicht direkt die Übung', async () => {
  const view = loadLetterGroupLessonView({ withTheory: true });
  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'unit_1');

  assert.ok(container.textContent.includes('Lernziele'), 'Theorie sollte zuerst angezeigt werden');
  assert.ok(container.textContent.includes('nicht weiterverbindende') || container.textContent.includes('Weiterverbindung'), 'Theorietext sollte inhaltlich zur Unit passen');
  assert.ok(!container.textContent.includes('Wiedererkennen'), 'die bestehende Übungsphase darf noch nicht sichtbar sein');

  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Weiter zur Einführung');
  assert.ok(startBtn, '"Weiter zur Einführung" sollte den Übergang zur bestehenden Lesson anbieten');
  startBtn.click();

  assert.ok(container.textContent.includes('Einführung'), 'nach dem Übergang sollte die bestehende Einführungsphase erscheinen');
});

test('Unit 1: ohne Theoriedokument bleibt das bisherige Verhalten (direkter Einstieg) unverändert', async () => {
  const view = loadLetterGroupLessonView({ withTheory: false });
  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'unit_1');

  assert.ok(!container.textContent.includes('Lernziele'), 'ohne Theoriedokument darf keine Theorie erscheinen');
  assert.ok(container.textContent.includes('Einführung'), 'sollte direkt in die bestehende Einführungsphase starten');
});

function loadShortVowelsView({ withTheory }) {
  const context = baseContext();
  context.AppState = {
    getCard: () => ({ difficulty: {} }),
    persistProgress: () => Promise.resolve(),
    markTheoryOpened: () => {},
    markTheoryCompleted: () => Promise.resolve(),
    markTheoryMiniCheckResult: () => Promise.resolve(true),
    getLanguagePack: () => Promise.resolve({
      language: { diacritics: [{ symbol: 'َ', name: 'Fatḥa', sound: 'kurzes a' }] },
      theory: withTheory ? loadTheoryData() : null
    })
  };
  vm.createContext(context);
  const src = [
    fs.readFileSync(path.join(ROOT, 'src', 'js', 'theoryRenderer.js'), 'utf-8'),
    fs.readFileSync(path.join(ROOT, 'src', 'js', 'views', 'vocalization.js'), 'utf-8')
  ].join('\n;\n');
  vm.runInContext(`${src}\nthis.__View = ShortVowelsView;`, context);
  return context.__View;
}

test('Unit 8 (Kurze Vokale): Theorie wird vor der bestehenden Tabelle gezeigt', async () => {
  const view = loadShortVowelsView({ withTheory: true });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(container.textContent.includes('Lernziele'));
  assert.ok(container.textContent.includes('Fatḥa') || container.textContent.includes('Fatha'));
  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Weiter zur Übersicht');
  assert.ok(startBtn);
  startBtn.click();
  assert.ok(container.querySelector('.forms-table'), 'nach dem Übergang sollte die bestehende Vokalzeichen-Tabelle erscheinen');
});

test('Unit 8: ohne Theoriedokument bleibt das bisherige Verhalten unverändert', async () => {
  const view = loadShortVowelsView({ withTheory: false });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(!container.textContent.includes('Lernziele'));
  assert.ok(container.querySelector('.forms-table'));
});
