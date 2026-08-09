// Ende-zu-Ende-Test für den freien Übungsmodus (Entwicklungsauftrag 3, Meilenstein B; Oberfläche
// grundlegend überarbeitet in Entwicklungsauftrag 5, Abschnitt 20): kompakte Schnellstartkarten
// statt langer Checkboxlisten, Chips statt Checkboxen in der erweiterten Auswahl, sichtbare
// Zusammenfassung vor dem Start.
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

function fakePack(vocabularyWords) {
  return {
    keyboard: {
      letters: [
        { id: 'alif', letter: 'ا', name: 'Alif', joining: 'right' },
        { id: 'ba', letter: 'ب', name: 'Bāʾ', joining: 'dual' }
      ]
    },
    vocabulary: {
      categories: [
        { id: 'home', words: vocabularyWords || [{ id: 'housing_door', arabic: 'بَاب', german: 'Tür', transliteration: 'bāb' }] }
      ]
    }
  };
}

function loadFreePractice({ onAdjustDifficulty, vocabularyWords = null }) {
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
    getLanguagePack: () => Promise.resolve(fakePack(vocabularyWords))
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

function openAdvancedPanel(container) {
  container.querySelectorAll('button').find((b) => b.textContent === 'Übung anpassen').click();
}

test('mount() zeigt Schnellstartkarten statt langer Checkboxlisten', async () => {
  const { view } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(container.textContent.includes('Frei üben'));
  ['Fällige Wiederholungen', 'Schwierige Wörter', '5 Minuten üben', 'Schreibtraining', 'Hörtraining', 'Verbindungstrainer'].forEach((title) => {
    assert.ok(container.textContent.includes(title), `Schnellstartkarte "${title}" fehlt`);
  });
  // Die alten langen Checkbox-Listen dürfen nicht mehr direkt sichtbar sein.
  assert.equal(container.querySelectorAll('input[type="checkbox"]').length, 0, 'keine Checkboxen mehr — Chips stattdessen');
});

test('Klick auf eine Schnellstartkarte startet die Übung sofort', async () => {
  const { view } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  const card = container.querySelectorAll('.stat-card').find((c) => c.textContent.includes('5 Minuten üben'));
  assert.ok(card, 'Schnellstartkarte "5 Minuten üben" fehlt');
  card.click();

  assert.ok(container.textContent.includes('Aufgabe 1 /'), 'nach dem Kartenklick sollte direkt eine Aufgabe erscheinen');
});

test('"Übung anpassen" zeigt Chips (Inhalte/Filter) statt Checkboxen und eine Zusammenfassung vor dem Start', async () => {
  const { view } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  openAdvancedPanel(container);
  const chips = container.querySelectorAll('.chip');
  assert.ok(chips.length >= 8, 'sollte Inhalts- und Filter-Chips zeigen (3 Inhalte + 5 Filter)');
  ['Buchstaben', 'Vokabeln', 'Verbindungen', 'Fällig', 'Schwierig', 'Zuletzt falsch', 'Neu', 'Beherrscht'].forEach((label) => {
    assert.ok(chips.some((c) => c.textContent === label), `Chip "${label}" fehlt`);
  });

  assert.ok(/\d+ Aufgaben.*Hilfestufe .*ca\. \d+ Minuten/.test(container.textContent), 'Zusammenfassung vor dem Start fehlt');

  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Übung starten');
  assert.ok(startBtn, '"Übung starten"-Button fehlt');
});

test('Chip-Klick schaltet die Auswahl um und aktualisiert die Zusammenfassung', async () => {
  const { view } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);
  openAdvancedPanel(container);

  const findChip = (label) => container.querySelectorAll('.chip').find((c) => c.textContent === label);
  const lettersChip = findChip('Buchstaben');
  assert.ok(lettersChip.className.includes('selected'), 'Buchstaben sollten standardmäßig ausgewählt sein');
  lettersChip.click();
  assert.ok(!container.querySelectorAll('.chip').find((c) => c.textContent === 'Buchstaben').className.includes('selected'));

  const dueChip = findChip('Fällig');
  assert.ok(!dueChip.className.includes('selected'), '"Fällig" sollte standardmäßig NICHT ausgewählt sein');
  dueChip.click();
  assert.ok(container.querySelectorAll('.chip').find((c) => c.textContent === 'Fällig').className.includes('selected'));
});

test('Doppelklick auf eine Buchstaben-Antwortoption führt nur zu EINER Bewertung', async () => {
  let adjustCallCount = 0;
  const { view } = loadFreePractice({ onAdjustDifficulty: () => { adjustCallCount += 1; } });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);
  openAdvancedPanel(container);

  // Nur Buchstaben-Kategorie anhaken, damit garantiert eine Buchstaben-Aufgabe (Multiple-Choice
  // für "spelling") als Erstes erscheinen kann.
  container.querySelectorAll('.chip').find((c) => c.textContent === 'Vokabeln').click();
  container.querySelectorAll('.chip').find((c) => c.textContent === 'Verbindungen').click();

  container.querySelectorAll('button').find((b) => b.textContent === 'Übung starten').click();

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
  openAdvancedPanel(container);

  container.querySelectorAll('.chip').find((c) => c.textContent === 'Buchstaben').click();
  container.querySelectorAll('.chip').find((c) => c.textContent === 'Vokabeln').click();
  container.querySelectorAll('.chip').find((c) => c.textContent === 'Verbindungen').click();

  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Übung starten');
  assert.doesNotThrow(() => startBtn.click());
  assert.ok(container.textContent.includes('Keine passenden Aufgaben'));
});

test('App.registerCleanup wird beim Mount registriert', async () => {
  const { view, registeredCleanups } = loadFreePractice({ onAdjustDifficulty: () => {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);
  assert.equal(registeredCleanups.length, 1);
});

test('Entwicklungsauftrag 7, Abschnitt 23: presetFilters.onlyWordIds beschränkt den Pool auf ein einzelnes Wort (Dashboard "Deine schwierigen Wörter")', async () => {
  const vocabularyWords = [
    { id: 'word_x', arabic: 'بَاب', german: 'Tür', transliteration: 'bāb' },
    { id: 'word_y', arabic: 'قَلَم', german: 'Stift', transliteration: 'qalam' }
  ];
  const { view } = loadFreePractice({ onAdjustDifficulty: () => {}, vocabularyWords });
  const container = createDocumentStub().createElement('div');
  await view.mount(container, {
    presetFilters: { categories: { letters: false, vocabulary: true, connections: false }, onlyWordIds: ['word_x'] },
    autoStart: true
  });

  // Nur word_x darf in den Aufgaben vorkommen (2 Aufgaben: arabic_to_german + german_to_arabic),
  // word_y darf nie erscheinen — über alle Aufgaben der Session hinweg geprüft.
  let sawWordY = false;
  let guard = 0;
  while (guard < 10) {
    guard += 1;
    if (container.textContent.includes('Stift') || container.textContent.includes('قَلَم')) sawWordY = true;
    const weiter = container.querySelectorAll('button').find((b) => b.textContent === 'Weiter');
    const pruefen = container.querySelectorAll('button').find((b) => b.textContent === 'Prüfen');
    const input = container.querySelector('input');
    if (input && pruefen) { input.value = 'x'; pruefen.click(); }
    else if (pruefen) { pruefen.click(); }
    if (weiter) { weiter.click(); continue; }
    const nextWeiter = container.querySelectorAll('button').find((b) => b.textContent === 'Weiter');
    if (nextWeiter) { nextWeiter.click(); continue; }
    break;
  }
  assert.ok(!sawWordY, 'onlyWordIds sollte word_y aus dem Pool ausschließen');
});
