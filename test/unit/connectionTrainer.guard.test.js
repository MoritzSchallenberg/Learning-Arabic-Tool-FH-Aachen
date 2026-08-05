// End-zu-Ende-Regressionstest für P0.2 (zentrale Antwortsperre) gegen die tatsächliche
// connectionTrainer.js-Logik.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

// wordShaping.js referenziert das globale TATWEEL aus keyboardData.js (Browser: gemeinsamer
// Script-Scope). Beim require() in Node muss es vorher auf dem echten globalen Objekt stehen.
global.TATWEEL = 'ـ';

const ExerciseGuard = require('../../src/js/exerciseGuard.js');
const wordShaping = require('../../src/js/wordShaping.js');
const srs = require('../../src/js/srs.js');

function loadConnectionTrainer({ onAdjustDifficulty }) {
  const registeredCleanups = [];
  const context = {
    document: createDocumentStub(),
    console,
    setTimeout,
    clearTimeout,
    ExerciseGuard,
    shapeWord: wordShaping.shapeWord,
    lettersFromWord: wordShaping.lettersFromWord,
    SHAPE_LABELS_DE: wordShaping.SHAPE_LABELS_DE,
    normalizeArabic: srs.normalizeArabic,
    evaluateArabicAnswer: srs.evaluateArabicAnswer,
    VirtualKeyboard: { mount: () => {} },
    App: { registerCleanup: (fn) => registeredCleanups.push(fn) }
  };

  const cards = {};
  context.AppState = {
    getCard: (id) => {
      if (!cards[id]) cards[id] = { difficulty: {}, consecutiveWrong: {} };
      return cards[id];
    },
    persistProgress: () => Promise.resolve()
  };
  context.adjustDifficulty = (card, skill, result) => {
    onAdjustDifficulty(skill, result);
    return srs.adjustDifficulty(card, skill, result);
  };

  vm.createContext(context);
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'js', 'views', 'connectionTrainer.js'),
    'utf-8'
  );
  vm.runInContext(src + '\nthis.__ConnectionTrainer = ConnectionTrainer;', context);
  return { trainer: context.__ConnectionTrainer, registeredCleanups };
}

function fakeLetters() {
  return [
    { id: 'ba', letter: 'ب', name: 'Ba', joining: 'dual' },
    { id: 'alif', letter: 'ا', name: 'Alif', joining: 'right' },
    { id: 'ba2', letter: 'ب', name: 'Ba', joining: 'dual' }
  ];
}

test('Doppelklick auf eine Antwortoption (classify_form) führt nur zu EINER Bewertung', async () => {
  let adjustCallCount = 0;
  const { trainer } = loadConnectionTrainer({ onAdjustDifficulty: () => { adjustCallCount += 1; } });
  const container = createDocumentStub().createElement('div');

  trainer.mount(container, {
    word: { arabic: 'باب', meaning: 'Tür' },
    keyboardLetters: fakeLetters(),
    types: ['classify_form'],
    skipDemo: true
  });

  const optionButtons = container.querySelectorAll('button');
  assert.ok(optionButtons.length > 0, 'Keine Antwortoptionen gefunden');
  const firstOption = optionButtons[0];

  firstOption.click();
  firstOption.click();
  firstOption.click();

  // adjustDifficulty läuft erst nach dem guard.setTimeout(..., 1200)-Feedback-Delay.
  await new Promise((resolve) => setTimeout(resolve, 1300));
  assert.equal(adjustCallCount, 1, `erwartet genau 1 Bewertung, tatsächlich ${adjustCallCount}`);
});

test('App.registerCleanup wird beim Mount registriert', () => {
  const { trainer, registeredCleanups } = loadConnectionTrainer({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  trainer.mount(container, {
    word: { arabic: 'باب', meaning: 'Tür' },
    keyboardLetters: fakeLetters(),
    types: ['classify_form'],
    skipDemo: true
  });
  assert.equal(registeredCleanups.length, 1);
});

test('Cleanup bricht das Weiterschalt-Timeout ab: kein verspätetes Rendern der nächsten Aufgabe', async () => {
  let adjustCallCount = 0;
  const { trainer, registeredCleanups } = loadConnectionTrainer({
    onAdjustDifficulty: () => { adjustCallCount += 1; }
  });
  const container = createDocumentStub().createElement('div');

  trainer.mount(container, {
    word: { arabic: 'باب', meaning: 'Tür' },
    keyboardLetters: fakeLetters(),
    types: ['classify_form', 'classify_form'], // zwei Runden, damit ein Übergang stattfindet
    skipDemo: true
  });

  const firstOption = container.querySelectorAll('button')[0];
  firstOption.click();
  // adjustDifficulty passiert erst verzögert (guard.setTimeout(..., 1200)) beim Feedback-Übergang
  // zur nächsten Aufgabe — direkt nach dem Klick ist noch nichts ausgewertet worden.
  assert.equal(adjustCallCount, 0);

  registeredCleanups[0](); // Nutzer verlässt die Ansicht, bevor der 1200ms-Timeout feuert

  await new Promise((resolve) => setTimeout(resolve, 1300));
  // OHNE Cleanup hätte adjustCallCount jetzt 1 sein müssen (der abgebrochene Timer hätte
  // onDone()/adjustDifficulty ausgelöst). Mit Cleanup bleibt es bei 0 — der Callback feuert
  // nachweislich nicht mehr, nachdem die Ansicht verlassen wurde (P0.2-Kernfall).
  assert.equal(adjustCallCount, 0);
});
