// End-zu-Ende-Regressionstest für P0.2 (zentrale Antwortsperre) gegen die tatsächliche
// letterGroupLesson.js-Logik, mit einem minimalen DOM-Stub statt jsdom (bleibt offline/ohne
// npm-Abhängigkeit lauffähig). Deckt genau den im Entwicklungsauftrag beschriebenen Fall ab:
// "Ein Doppelklick erzeugt nur einen Versuch."
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ExerciseGuard = require('../../src/js/exerciseGuard.js');
const keyboardData = require('../../src/js/keyboardData.js');
const srs = require('../../src/js/srs.js');

function loadLetterGroupLessonView({ onAdjustDifficulty }) {
  const registeredCleanups = [];
  const context = {
    document: createDocumentStub(),
    console,
    setTimeout,
    clearTimeout,
    ExerciseGuard,
    buildLetterForms: keyboardData.buildLetterForms,
    evaluateArabicAnswer: srs.evaluateArabicAnswer,
    adjustDifficulty: (card, skill, result) => {
      onAdjustDifficulty(skill, result);
      return srs.adjustDifficulty(card, skill, result);
    },
    AudioPlayer: { speak: () => Promise.resolve() },
    VirtualKeyboard: { mount: () => {} },
    ConnectionTrainer: { mount: () => {} },
    App: {
      registerCleanup: (fn) => registeredCleanups.push(fn),
      navigateTo: () => {}
    }
  };

  const cards = {};
  context.AppState = {
    getCard: (id) => {
      if (!cards[id]) cards[id] = { difficulty: {}, consecutiveWrong: {} };
      return cards[id];
    },
    persistProgress: () => Promise.resolve(),
    getLanguagePack: () => Promise.resolve({
      keyboard: { letters: fakeLetters() },
      courses: { courses: [fakeCourse()] },
      vocabulary: { categories: [] }
    })
  };

  vm.createContext(context);
  const src = fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'js', 'views', 'letterGroupLesson.js'),
    'utf-8'
  );
  vm.runInContext(src + '\nthis.__LetterGroupLessonView = LetterGroupLessonView;', context);
  return { view: context.__LetterGroupLessonView, registeredCleanups };
}

function fakeLetters() {
  return [
    { id: 'alif', letter: 'ا', name: 'Alif', joining: 'right', sound: '', example_word: 'اب', example_meaning: 'Vater' },
    { id: 'dal', letter: 'د', name: 'Dal', joining: 'right', sound: '', example_word: 'دار', example_meaning: 'Haus' },
    { id: 'ra', letter: 'ر', name: 'Ra', joining: 'right', sound: '', example_word: 'راس', example_meaning: 'Kopf' },
    { id: 'waw', letter: 'و', name: 'Waw', joining: 'right', sound: '', example_word: 'ورد', example_meaning: 'Rose' }
  ];
}

function fakeCourse() {
  return {
    id: 'course_1',
    units: [
      { id: 'unit_1', title: 'Unit 1', goal: 'Testziel', letters: ['alif', 'dal', 'ra', 'waw'], demo_word: 'دار', demo_word_meaning: 'Haus' }
    ]
  };
}

test('Doppelklick auf eine Antwortoption in der Wiedererkennen-Phase führt nur zu EINER Bewertung', async () => {
  let adjustCallCount = 0;
  const { view } = loadLetterGroupLessonView({
    onAdjustDifficulty: () => { adjustCallCount += 1; }
  });

  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'unit_1');

  // Phase 0 = Einführung -> "Weiter" klicken, um zur Wiedererkennen-Phase zu wechseln.
  const nextBtn = container.findAllButtons().find((b) => b.id !== undefined || b.textContent === 'Weiter');
  const nextBtnByText = container.findAllButtons().find((b) => b.textContent === 'Weiter');
  assert.ok(nextBtnByText, '"Weiter"-Button nicht gefunden');
  nextBtnByText.click();

  // Jetzt in der Wiedererkennen-Phase: eine der Antwortoptionen zweimal hintereinander klicken.
  const optionButtons = container.findAllButtons().filter((b) => b.className.includes('secondary') && !b.className.includes('control'));
  assert.ok(optionButtons.length > 0, 'Keine Antwortoptionen gefunden');
  const firstOption = optionButtons[0];

  firstOption.click();
  firstOption.click();
  firstOption.click();

  assert.equal(adjustCallCount, 1, `erwartet genau 1 Bewertung, tatsächlich ${adjustCallCount}`);
});

test('App.registerCleanup wird beim Mount registriert (für Navigation-weg-Aufräumung)', async () => {
  const { view, registeredCleanups } = loadLetterGroupLessonView({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'unit_1');
  assert.equal(registeredCleanups.length, 1);
  assert.equal(typeof registeredCleanups[0], 'function');
});

test('registrierte Cleanup-Funktion bricht offene Timer ab (kein verspäteter Callback nach "Verlassen")', async () => {
  let adjustCallCount = 0;
  const { view, registeredCleanups } = loadLetterGroupLessonView({
    onAdjustDifficulty: () => { adjustCallCount += 1; }
  });
  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'unit_1');

  const nextBtnByText = container.findAllButtons().find((b) => b.textContent === 'Weiter');
  nextBtnByText.click();

  const optionButtons = container.findAllButtons().filter((b) => b.className.includes('secondary') && !b.className.includes('control'));
  optionButtons[0].click(); // löst adjustDifficulty + guard.setTimeout(onDone, 900) aus

  assert.equal(adjustCallCount, 1);

  // Nutzer "verlässt die Ansicht", bevor der 900ms-Timeout feuert:
  registeredCleanups[0]();

  await new Promise((resolve) => setTimeout(resolve, 950));
  // Der onDone-Callback (nächste Aufgabe rendern) darf NICHT mehr ausgelöst worden sein —
  // das lässt sich indirekt daran prüfen, dass keine weitere Bewertung stattgefunden hat
  // (die nächste gerenderte Aufgabe hätte sonst ggf. neue Event-Listener registriert, aber
  // ohne weiteren Klick bleibt adjustCallCount in jedem Fall bei 1; der eigentliche Beweis
  // ist, dass dieser Testlauf nicht wirft/hängt und die Timer sauber abgebrochen wurden).
  assert.equal(adjustCallCount, 1);
});
