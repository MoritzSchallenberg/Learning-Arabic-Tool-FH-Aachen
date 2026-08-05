// End-zu-Ende-Test für den freien Übungsmodus (Entwicklungsauftrag 3, Meilenstein B).
global.TATWEEL = 'ـ'; // wordShaping.js-Abhängigkeit

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ExerciseGuard = require('../../src/js/exerciseGuard.js');
const HelpLevel = require('../../src/js/helpLevel.js');
const ReviewScheduler = require('../../src/js/reviewScheduler.js');
const PracticePool = require('../../src/js/practicePool.js');
const wordShaping = require('../../src/js/wordShaping.js');
const srs = require('../../src/js/srs.js');

// practicePool.js wird hier direkt (nicht per vm) requiret und läuft daher im echten
// Node-Global-Scope — dort müssen dieselben Bezeichner wie im Browser (gemeinsamer
// Script-Scope) verfügbar sein.
global.normalizeArabic = srs.normalizeArabic;
global.lettersFromWord = wordShaping.lettersFromWord;

function fakePack() {
  return {
    keyboard: {
      letters: [
        { id: 'alif', letter: 'ا', name: 'Alif', joining: 'right' },
        { id: 'ba', letter: 'ب', name: 'Bāʾ', joining: 'dual' }
      ]
    },
    vocabulary: {
      categories: [
        { id: 'home', words: [{ id: 'housing_door', arabic: 'بَاب', german: 'Tür', transliteration: 'bāb' }] }
      ]
    }
  };
}

function loadFreePractice({ onAdjustDifficulty }) {
  const registeredCleanups = [];
  const context = {
    document: createDocumentStub(),
    console,
    setTimeout,
    ExerciseGuard,
    HelpLevel,
    ReviewScheduler,
    PracticePool,
    DEFAULT_DIFFICULTY: srs.DEFAULT_DIFFICULTY,
    normalizeArabic: srs.normalizeArabic,
    evaluateArabicAnswer: srs.evaluateArabicAnswer,
    evaluateGermanAnswer: srs.evaluateGermanAnswer,
    lettersFromWord: wordShaping.lettersFromWord,
    VirtualKeyboard: { mount: () => {} },
    ConnectionTrainer: { mount: () => {} },
    AudioPlayer: { speak: () => Promise.resolve() },
    App: { registerCleanup: (fn) => registeredCleanups.push(fn) }
  };
  const cards = {};
  context.AppState = {
    getCard: (id) => {
      if (!cards[id]) cards[id] = { difficulty: {}, consecutiveWrong: {} };
      return cards[id];
    },
    persistProgress: () => Promise.resolve(),
    getLanguagePack: () => Promise.resolve(fakePack())
  };
  context.adjustDifficulty = (card, skill, result) => {
    onAdjustDifficulty(skill, result);
    return srs.adjustDifficulty(card, skill, result);
  };

  vm.createContext(context);
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'views', 'freePractice.js'), 'utf-8');
  vm.runInContext(src + '\nthis.__FreePracticeView = FreePracticeView;', context);
  return { view: context.__FreePracticeView, registeredCleanups };
}

test('mount() rendert die Filter-Auswahl mit Schnellzugriffen', async () => {
  const { view } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(container.textContent.includes('Frei üben'));
  assert.ok(container.textContent.includes('Schnellzugriffe'));
  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Los geht\'s');
  assert.ok(startBtn, '"Los geht\'s"-Button fehlt');
});

test('"Los geht\'s" mit Standardfiltern startet eine Übungsrunde und zeigt eine Aufgabe', async () => {
  const { view } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Los geht\'s');
  startBtn.click();

  // Nach dem Start sollte eine Aufgabe (Fortschrittsanzeige "Aufgabe 1 / ...") sichtbar sein.
  assert.ok(container.textContent.includes('Aufgabe 1 /'));
});

test('Doppelklick auf eine Buchstaben-Antwortoption führt nur zu EINER Bewertung', async () => {
  let adjustCallCount = 0;
  const { view } = loadFreePractice({ onAdjustDifficulty: () => { adjustCallCount += 1; } });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  // Nur Buchstaben-Kategorie anhaken, damit garantiert eine Buchstaben-Aufgabe (Multiple-Choice
  // für "spelling") als Erstes erscheinen kann (kein Direktzugriff für exakte Reihenfolge,
  // daher mehrere Versuche, bis eine Multiple-Choice-Aufgabe mit Optionen erscheint).
  container.querySelector('#fp-cat-vocabulary').checked = false;
  container.querySelector('#fp-cat-connections').checked = false;

  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Los geht\'s');
  startBtn.click();

  const optionsWrap = container.querySelector('#fp-options');
  const optionButtons = optionsWrap ? optionsWrap.querySelectorAll('button') : [];
  if (optionButtons.length > 0) {
    const firstOption = optionButtons[0];
    firstOption.click();
    firstOption.click();
    firstOption.click();
    assert.equal(adjustCallCount, 1);
  } else {
    // Getroffen wurde eine Tipp-Aufgabe (guided/independent_typing) statt Multiple-Choice —
    // auch gültig, aber dann prüfen wir stattdessen den Prüfen-Button auf Mehrfachklick-Schutz.
    const checkBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Prüfen');
    assert.ok(checkBtn, 'Weder Multiple-Choice-Optionen noch Prüfen-Button gefunden');
    checkBtn.click();
    checkBtn.click();
    assert.equal(adjustCallCount, 1);
  }
});

test('leere Filterkombination (keine Kategorie ausgewählt) zeigt eine verständliche Meldung statt zu crashen', async () => {
  const { view } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  container.querySelector('#fp-cat-letters').checked = false;
  container.querySelector('#fp-cat-vocabulary').checked = false;
  container.querySelector('#fp-cat-connections').checked = false;

  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Los geht\'s');
  assert.doesNotThrow(() => startBtn.click());
  assert.ok(container.textContent.includes('Keine passenden Aufgaben'));
});

test('App.registerCleanup wird beim Mount registriert', async () => {
  const { view, registeredCleanups } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);
  assert.equal(registeredCleanups.length, 1);
});
