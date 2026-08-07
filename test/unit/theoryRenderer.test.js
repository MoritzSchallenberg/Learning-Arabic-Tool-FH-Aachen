// Tests für src/js/theoryRenderer.js (Entwicklungsauftrag 3, Meilenstein B).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');
const ExerciseGuard = require('../../src/js/exerciseGuard.js');

function loadTheoryRenderer({ markTheoryOpenedCalls, markTheoryCompletedCalls }) {
  const context = {
    document: createDocumentStub(),
    console,
    setTimeout,
    ExerciseGuard,
    AppState: {
      markTheoryOpened: (id) => markTheoryOpenedCalls.push(id),
      markTheoryCompleted: (id) => markTheoryCompletedCalls.push(id)
    }
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'theoryRenderer.js'), 'utf-8');
  vm.runInContext(src + '\nthis.__TheoryRenderer = TheoryRenderer;', context);
  return context.__TheoryRenderer;
}

const SAMPLE_THEORY = {
  theory_id: 'vocab_unit_test_a_theory',
  title: 'Testthema',
  learning_objectives: ['Ziel 1', 'Ziel 2'],
  blocks: [
    { type: 'paragraph', text: 'Kurzer Einführungstext.' },
    { type: 'bullet_list', items: ['Punkt A', 'Punkt B'] },
    { type: 'callout', variant: 'tip', title: 'Achte auf', text: 'Etwas Wichtiges.' },
    { type: 'example', arabic: 'بَاب', translation: 'Tür' },
    { type: 'word_preview', word_ids: ['w1', 'w2'] },
    { type: 'paragraph', text: 'Vertiefender Text.', level: 'full' },
    {
      type: 'mini_check',
      questions: [
        { question: 'Was bedeutet بَاب?', options: [{ text: 'Tür', correct: true }, { text: 'Fenster', correct: false }] }
      ]
    }
  ]
};

function fakeWordLookup(id) {
  const words = {
    w1: { arabic_vocalized: 'بَاب', german_answers: ['Tür'], transliteration: 'bāb' },
    w2: { arabic_vocalized: 'نَافِذَة', german_answers: ['Fenster'], transliteration: 'nāfidha' }
  };
  return words[id];
}

test('mount() rendert Titel, Lernziele und Standard-Blöcke ("Kurz erklärt")', () => {
  const markTheoryOpenedCalls = [];
  const markTheoryCompletedCalls = [];
  const TheoryRenderer = loadTheoryRenderer({ markTheoryOpenedCalls, markTheoryCompletedCalls });
  const container = createDocumentStub().createElement('div');

  TheoryRenderer.mount(container, SAMPLE_THEORY, { getWordById: fakeWordLookup });

  assert.deepEqual(markTheoryOpenedCalls, ['vocab_unit_test_a_theory']);
  const text = container.textContent;
  assert.ok(text.includes('Testthema'));
  assert.ok(text.includes('Ziel 1'));
  assert.ok(text.includes('Kurzer Einführungstext.'));
  assert.ok(text.includes('Punkt A'));
  assert.ok(text.includes('Achte auf'));
  assert.ok(text.includes('بَاب'));
  assert.ok(text.includes('Tür')); // aus word_preview
  // "full"-Block darf im Kurzmodus NICHT sichtbar sein:
  assert.ok(!text.includes('Vertiefender Text.'));
});

test('"Mehr erfahren" blendet level:"full"-Blöcke ein', () => {
  const TheoryRenderer = loadTheoryRenderer({ markTheoryOpenedCalls: [], markTheoryCompletedCalls: [] });
  const container = createDocumentStub().createElement('div');
  TheoryRenderer.mount(container, SAMPLE_THEORY, { getWordById: fakeWordLookup });

  const moreBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Mehr erfahren');
  assert.ok(moreBtn, '"Mehr erfahren"-Button nicht gefunden');
  moreBtn.click();

  assert.ok(container.textContent.includes('Vertiefender Text.'));
  const lessBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Weniger anzeigen');
  assert.ok(lessBtn, 'Umschalt-Button sollte nach Klick "Weniger anzeigen" heißen');
});

test('"Session starten" ruft onStart auf und markiert die Theorie als abgeschlossen', () => {
  const markTheoryCompletedCalls = [];
  const TheoryRenderer = loadTheoryRenderer({ markTheoryOpenedCalls: [], markTheoryCompletedCalls });
  const container = createDocumentStub().createElement('div');
  let started = false;

  TheoryRenderer.mount(container, SAMPLE_THEORY, { getWordById: fakeWordLookup, onStart: () => { started = true; } });

  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Session starten');
  assert.ok(startBtn, '"Session starten"-Button nicht gefunden');
  startBtn.click();

  assert.equal(started, true);
  assert.deepEqual(markTheoryCompletedCalls, ['vocab_unit_test_a_theory']);
});

test('mini_check: kein automatischer Wechsel — Feedback bleibt stehen, bis "Weiter" geklickt wird', () => {
  const TheoryRenderer = loadTheoryRenderer({ markTheoryOpenedCalls: [], markTheoryCompletedCalls: [] });
  const container = createDocumentStub().createElement('div');

  TheoryRenderer.mount(container, SAMPLE_THEORY, { getWordById: fakeWordLookup });

  const correctBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Tür');
  assert.ok(correctBtn, 'Mini-Check-Antwortoption "Tür" nicht gefunden');
  correctBtn.click();

  assert.ok(container.textContent.includes('Richtig!'), 'Feedback sollte sofort sichtbar sein');
  // Kein automatischer Wechsel: die Zusammenfassung ("Mit den Wörtern starten") darf erst NACH
  // einem Klick auf "Weiter" erscheinen, nicht von selbst.
  assert.ok(!container.textContent.includes('Mit den Wörtern starten'), 'sollte nicht automatisch weiterschalten');
  const weiterBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Weiter');
  assert.ok(weiterBtn, '"Weiter"-Button sollte nach der Antwort erscheinen');
});

test('mini_check: falsche Antwort zeigt erklärendes Feedback ("Noch nicht. ...")', () => {
  const TheoryRenderer = loadTheoryRenderer({ markTheoryOpenedCalls: [], markTheoryCompletedCalls: [] });
  const container = createDocumentStub().createElement('div');
  const theoryWithExplanation = {
    ...SAMPLE_THEORY,
    blocks: [
      {
        type: 'mini_check',
        questions: [{
          question: 'Was bedeutet بَاب?',
          options: [{ text: 'Tür', correct: true }, { text: 'Fenster', correct: false }],
          explanation: 'بَاب bedeutet „Tür", نَافِذَة wäre „Fenster".'
        }]
      }
    ]
  };
  TheoryRenderer.mount(container, theoryWithExplanation, { getWordById: fakeWordLookup });

  container.querySelectorAll('button').find((b) => b.textContent === 'Fenster').click();
  assert.ok(container.textContent.includes('Noch nicht.'));
  assert.ok(container.textContent.includes('بَاب bedeutet „Tür"'), 'erklärendes Feedback sollte angezeigt werden');
});

test('mini_check: meldet das Ergebnis erst nach Abschluss über onMiniCheckComplete und zeigt eine Zusammenfassung mit Wahlmöglichkeit', () => {
  const TheoryRenderer = loadTheoryRenderer({ markTheoryOpenedCalls: [], markTheoryCompletedCalls: [] });
  const container = createDocumentStub().createElement('div');
  let reportedResult = null;
  let startedWords = false;

  TheoryRenderer.mount(container, SAMPLE_THEORY, {
    getWordById: fakeWordLookup,
    onMiniCheckComplete: (correct, total) => { reportedResult = { correct, total }; },
    onMiniCheckStartWords: () => { startedWords = true; }
  });

  container.querySelectorAll('button').find((b) => b.textContent === 'Tür').click();
  assert.equal(reportedResult, null, 'onMiniCheckComplete darf erst nach dem letzten "Weiter" feuern');
  container.querySelectorAll('button').find((b) => b.textContent === 'Weiter').click();

  assert.deepEqual(reportedResult, { correct: 1, total: 1 });
  assert.ok(container.textContent.includes('1 von 1 richtig'));
  assert.ok(container.querySelectorAll('button').some((b) => b.textContent === 'Noch einmal ansehen'));
  const startWordsBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Mit den Wörtern starten');
  assert.ok(startWordsBtn);
  startWordsBtn.click();
  assert.equal(startedWords, true);
});

test('requireMiniCheckBeforeStart: "Session starten" bleibt deaktiviert, bis der Mini-Check vollständig bearbeitet wurde', () => {
  const TheoryRenderer = loadTheoryRenderer({ markTheoryOpenedCalls: [], markTheoryCompletedCalls: [] });
  const container = createDocumentStub().createElement('div');
  let started = false;

  TheoryRenderer.mount(container, SAMPLE_THEORY, {
    getWordById: fakeWordLookup,
    requireMiniCheckBeforeStart: true,
    onStart: () => { started = true; }
  });

  const startBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Session starten');
  assert.equal(startBtn.disabled, true, 'sollte vor dem Mini-Check deaktiviert sein');
  startBtn.click();
  assert.equal(started, false, 'ein Klick auf einen deaktivierten Button darf nichts auslösen');

  container.querySelectorAll('button').find((b) => b.textContent === 'Tür').click();
  container.querySelectorAll('button').find((b) => b.textContent === 'Weiter').click();

  const startBtnAfter = container.querySelectorAll('button').find((b) => b.textContent === 'Session starten');
  assert.equal(startBtnAfter.disabled, false, 'nach vollständig bearbeitetem Mini-Check sollte der Button aktiv sein');
  startBtnAfter.click();
  assert.equal(started, true);
});

test('Blöcke ohne bekannten Renderer werden übersprungen, ohne zu crashen', () => {
  const TheoryRenderer = loadTheoryRenderer({ markTheoryOpenedCalls: [], markTheoryCompletedCalls: [] });
  const container = createDocumentStub().createElement('div');
  const theoryWithUnknownBlock = {
    theory_id: 't2',
    title: 'X',
    blocks: [{ type: 'does_not_exist', text: 'sollte ignoriert werden' }]
  };
  assert.doesNotThrow(() => TheoryRenderer.mount(container, theoryWithUnknownBlock, {}));
  assert.ok(!container.textContent.includes('sollte ignoriert werden'));
});
