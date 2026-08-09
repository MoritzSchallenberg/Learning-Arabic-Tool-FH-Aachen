// Test für die Startseite (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 18; Hauptaktion
// korrigiert in Entwicklungsauftrag 5, Abschnitt 13/30 "Dashboard": bei aktiver Session führt der
// Hauptbutton direkt zur Session, ohne aktive Session zur nächsten noch nicht abgeschlossenen
// Vokabel-Session — nicht mehr pauschal in den freien Übungsmodus).
global.TATWEEL = 'ـ';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ReviewScheduler = require('../../src/js/reviewScheduler.js');
const PracticePool = require('../../src/js/practicePool.js');
const ProgressStats = require('../../src/js/progressStats.js');
const PhaseRegistry = require('../../src/js/session/phaseRegistry.js');
const wordShaping = require('../../src/js/wordShaping.js');
const srs = require('../../src/js/srs.js');

global.normalizeArabic = srs.normalizeArabic;
global.lettersFromWord = wordShaping.lettersFromWord;

function fakePack(vocabSessions, vocabularyWords) {
  return {
    keyboard: { letters: [{ id: 'alif', letter: 'ا', name: 'Alif', joining: 'right' }] },
    vocabulary: { categories: [{ id: 'home', words: vocabularyWords || [{ id: 'housing_door', arabic: 'اب', german: 'Test' }] }] },
    vocabSessions
  };
}

function loadDashboard({ vocabSessions = null, sessionStates = {}, activeSessionId = null, vocabularyWords = null, extraCards = {} } = {}) {
  let navigatedWith = null;
  let navigatedSession = null;
  const spokenWords = [];
  const context = {
    document: createDocumentStub(),
    console,
    ReviewScheduler,
    PracticePool,
    ProgressStats,
    PhaseRegistry,
    AudioPlayer: {
      speak: (text, lang, opts) => { spokenWords.push({ text, lang, opts }); return Promise.resolve({ source: 'audio' }); }
    },
    App: {
      navigateToFreePractice: (options) => { navigatedWith = options; },
      navigateToSession: (unitId, sessionId) => { navigatedSession = { unitId, sessionId }; }
    }
  };
  const past = new Date(Date.now() - 1000).toISOString();
  const cards = {
    letter_alif: { difficulty: { spelling: 3 }, nextReview: { spelling: past } },
    ...extraCards
  };
  context.AppState = {
    getLanguagePack: () => Promise.resolve(fakePack(vocabSessions, vocabularyWords)),
    getSettings: () => ({}),
    getCard: (id) => cards[id] || { difficulty: {} },
    getDailyNewCount: () => 0,
    getActiveSessionId: () => activeSessionId,
    getSessionState: (id) => sessionStates[id] || null
  };
  const combinedSrc = [
    fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'session', 'sessionState.js'), 'utf-8'),
    fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'views', 'dashboard.js'), 'utf-8')
  ].join('\n;\n');
  vm.createContext(context);
  vm.runInContext(`${combinedSrc}\nthis.__DashboardView = DashboardView;`, context);
  return { view: context.__DashboardView, getNavigatedWith: () => navigatedWith, getNavigatedSession: () => navigatedSession, getSpokenWords: () => spokenWords };
}

test('mount() zeigt fällige Wiederholungen, neue Wörter und einen Gesamtfortschritts-Balken', async () => {
  const { view } = loadDashboard();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(container.textContent.includes('Willkommen zurück'));
  assert.ok(container.textContent.includes('Fällige Wiederholungen'));
  assert.ok(container.textContent.includes('Neue Wörter verfügbar'));
  assert.ok(container.querySelectorAll('.meter-fill.mastery').length > 0);
});

test('ohne aktive Session UND ohne Vokabel-Sessions: keine "Weiterlernen"/"Nächste Session"-Karte, aber Fällige-Wiederholungen/Frei-üben bleiben erreichbar', async () => {
  const { view } = loadDashboard();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(!container.textContent.includes('Weiterlernen'));
  assert.ok(container.querySelectorAll('button').some((b) => b.textContent === 'Fällige Wiederholungen'));
  assert.ok(container.querySelectorAll('button').some((b) => b.textContent === 'Frei üben'));
});

test('aktive Session vorhanden: Hauptbutton führt DIREKT zur Session, nicht in den freien Übungsmodus', async () => {
  const vocabSessions = {
    vocab_units: [{ id: 'vocab_unit_01', title: 'Begrüßung und Höflichkeit', session_ids: ['vocab_unit_01_a'] }],
    sessions: [{
      session_id: 'vocab_unit_01_a', title: 'Begrüßung und Höflichkeit', estimated_minutes: 10,
      new_word_ids: ['a', 'b'], review_count: 0,
      phases: [{ type: 'theory' }, { type: 'word_preview' }, { type: 'recognition' }, { type: 'summary' }]
    }]
  };
  const sessionStates = {
    vocab_unit_01_a: { status: 'in_progress', phaseIndex: 2, phaseQueues: { recognition: { index: 3, pending: [1, 2, 3, 4, 5, 6] } } }
  };
  const { view, getNavigatedSession, getNavigatedWith } = loadDashboard({ vocabSessions, sessionStates, activeSessionId: 'vocab_unit_01_a' });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(container.textContent.includes('Weiterlernen'), '"Weiterlernen"-Karte sollte erscheinen');
  assert.ok(container.textContent.includes('Begrüßung und Höflichkeit'));
  assert.ok(container.textContent.includes('Wiedererkennen'), 'aktuelle Phase sollte angezeigt werden');
  assert.ok(container.textContent.includes('Aufgabe 4 von 6'), 'Aufgabenfortschritt sollte angezeigt werden');

  const btn = container.querySelectorAll('button').find((b) => b.textContent === 'Session fortsetzen');
  assert.ok(btn, '"Session fortsetzen"-Button sollte vorhanden sein');
  btn.click();

  assert.deepEqual(getNavigatedSession(), { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  assert.equal(getNavigatedWith(), null, 'darf NICHT in den freien Übungsmodus navigieren');
});

test('keine aktive Session, aber offene Vokabel-Sessions vorhanden: Hauptbutton führt zur nächsten noch nicht abgeschlossenen Session', async () => {
  const vocabSessions = {
    vocab_units: [
      { id: 'vocab_unit_01', title: 'Begrüßung und Höflichkeit', session_ids: ['vocab_unit_01_a'] },
      { id: 'vocab_unit_02', title: 'Familie und Personen', session_ids: ['vocab_unit_02_a'] }
    ],
    sessions: [
      { session_id: 'vocab_unit_01_a', title: 'Begrüßung und Höflichkeit', estimated_minutes: 10, new_word_ids: ['a'], review_count: 0, phases: [] },
      { session_id: 'vocab_unit_02_a', title: 'Familie und Personen', estimated_minutes: 12, new_word_ids: ['b'], review_count: 0, phases: [] }
    ]
  };
  // Erste Session bereits abgeschlossen -> die zweite sollte vorgeschlagen werden.
  const sessionStates = { vocab_unit_01_a: { status: 'completed' } };
  const { view, getNavigatedSession } = loadDashboard({ vocabSessions, sessionStates, activeSessionId: null });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(container.textContent.includes('Nächste Session'));
  assert.ok(container.textContent.includes('Familie und Personen'));
  const btn = container.querySelectorAll('button').find((b) => b.textContent === 'Session starten');
  assert.ok(btn);
  btn.click();
  assert.deepEqual(getNavigatedSession(), { unitId: 'vocab_unit_02', sessionId: 'vocab_unit_02_a' });
});

test('"Fällige Wiederholungen" und "Frei üben" bleiben als Zusatzaktionen erreichbar', async () => {
  const { view, getNavigatedWith } = loadDashboard();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  container.querySelectorAll('button').find((b) => b.textContent === 'Fällige Wiederholungen').click();
  assert.equal(getNavigatedWith().presetFilters.dueOnly, true);
  assert.equal(getNavigatedWith().autoStart, true);
});

test('Entwicklungsauftrag 7, Abschnitt 23: "Deine schwierigen Wörter" zeigt Wörter mit >= 3 Fehlern in Folge, sortiert nach Fehleranzahl, mit "Üben"-Button', async () => {
  const vocabularyWords = [
    { id: 'word_a', arabic: 'أ', arabic_vocalized: 'أَ', german: 'A-Wort', german_answers: ['A-Wort'] },
    { id: 'word_b', arabic: 'ب', arabic_vocalized: 'بَ', german: 'B-Wort', german_answers: ['B-Wort'] },
    { id: 'word_c', arabic: 'ت', arabic_vocalized: 'تَ', german: 'C-Wort', german_answers: ['C-Wort'] }
  ];
  const extraCards = {
    // word_a: 5 Fehler in Folge bei einer Fähigkeit -> sollte erscheinen, an erster Stelle.
    word_a: { difficulty: {}, consecutiveWrong: { arabic_to_german: 5 } },
    // word_b: genau an der Schwelle (3) -> sollte erscheinen.
    word_b: { difficulty: {}, consecutiveWrong: { german_to_arabic: 3 } },
    // word_c: nur 2 Fehler in Folge -> sollte NICHT erscheinen.
    word_c: { difficulty: {}, consecutiveWrong: { arabic_to_german: 2 } }
  };
  const { view, getNavigatedWith } = loadDashboard({ vocabularyWords, extraCards });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(container.textContent.includes('Deine schwierigen Wörter'));
  assert.ok(container.textContent.includes('A-Wort'), 'Wort mit 5 Fehlern sollte angezeigt werden');
  assert.ok(container.textContent.includes('B-Wort'), 'Wort genau an der Schwelle sollte angezeigt werden');
  assert.ok(!container.textContent.includes('C-Wort'), 'Wort unter der Schwelle sollte NICHT angezeigt werden');

  const rows = container.querySelectorAll('.difficult-word-row');
  assert.equal(rows.length, 2);
  assert.ok(rows[0].textContent.includes('A-Wort'), 'das Wort mit den meisten Fehlern sollte zuerst stehen');

  const btn = container.querySelectorAll('button').find((b) => b.textContent === 'Alle üben');
  assert.ok(btn, '"Alle üben"-Button sollte vorhanden sein');
  btn.click();
  assert.equal(getNavigatedWith().presetFilters.recentlyWrongOnly, true);
  assert.equal(getNavigatedWith().autoStart, true);
});

test('Entwicklungsauftrag 7, Abschnitt 23: pro schwierigem Wort stehen "Noch einmal lernen", "Audio anhören", "Schreibweise ansehen" und "Beispiele ansehen" zur Verfügung', async () => {
  const vocabularyWords = [
    {
      id: 'word_a',
      arabic: 'ا',
      arabic_vocalized: 'ا',
      arabic_unvocalized: 'ا',
      transliteration: 'ā',
      german: 'A-Wort',
      german_answers: ['A-Wort'],
      audio_key: 'vocabulary/word_a',
      application_prompts: [{ type: 'context_choice', prompt: 'Ein Beispielsatz für A-Wort.', expected_meaning: 'A-Wort' }]
    },
    // Wort ohne application_prompts -> "Beispiele ansehen" soll einen Hinweis statt eines
    // Absturzes zeigen.
    { id: 'word_b', arabic: 'ب', arabic_vocalized: 'بَ', german: 'B-Wort', german_answers: ['B-Wort'] }
  ];
  const extraCards = {
    word_a: { difficulty: {}, consecutiveWrong: { arabic_to_german: 5 } },
    word_b: { difficulty: {}, consecutiveWrong: { arabic_to_german: 3 } }
  };
  const { view, getNavigatedWith, getSpokenWords } = loadDashboard({ vocabularyWords, extraCards });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  const rows = container.querySelectorAll('.difficult-word-row');
  assert.equal(rows.length, 2);

  const actionBars = container.querySelectorAll('.difficult-word-actions');
  assert.equal(actionBars.length, 2);
  const firstActions = actionBars[0].querySelectorAll('button');
  const actionLabels = [...firstActions].map((b) => b.textContent);
  assert.ok(actionLabels.includes('Noch einmal lernen'));
  assert.ok(actionLabels.includes('🔊 Audio anhören'));
  assert.ok(actionLabels.includes('Schreibweise ansehen'));
  assert.ok(actionLabels.includes('Beispiele ansehen'));
  assert.ok(actionLabels.includes('Verbindung ansehen'), 'word_a besteht nur aus dem Grundbuchstaben ا und sollte einen Verbindungstrainer-Eintrag haben');

  // "Noch einmal lernen" schränkt auf genau dieses eine Wort ein.
  [...firstActions].find((b) => b.textContent === 'Noch einmal lernen').click();
  assert.deepEqual([...getNavigatedWith().presetFilters.onlyWordIds], ['word_a']);
  assert.equal(getNavigatedWith().presetFilters.categories.vocabulary, true);
  assert.equal(getNavigatedWith().presetFilters.categories.connections, false);
  assert.equal(getNavigatedWith().autoStart, true);

  // "Verbindung ansehen" schränkt auf genau dieses eine Wort UND die Kategorie "connections" ein.
  [...firstActions].find((b) => b.textContent === 'Verbindung ansehen').click();
  assert.deepEqual([...getNavigatedWith().presetFilters.onlyWordIds], ['word_a']);
  assert.equal(getNavigatedWith().presetFilters.categories.connections, true);
  assert.equal(getNavigatedWith().presetFilters.categories.vocabulary, false);

  // "Audio anhören" spielt genau dieses eine Wort ab.
  [...firstActions].find((b) => b.textContent === '🔊 Audio anhören').click();
  assert.equal(getSpokenWords().length, 1);
  assert.equal(getSpokenWords()[0].text, 'ا');
  assert.equal(getSpokenWords()[0].opts.audioKey, 'vocabulary/word_a');

  // "Schreibweise ansehen" blendet ein Detail-Panel ein und der Button-Text wechselt.
  const spellingBtn = [...firstActions].find((b) => b.textContent === 'Schreibweise ansehen');
  spellingBtn.click();
  assert.equal(spellingBtn.textContent, 'Schreibweise ausblenden');
  assert.ok(container.textContent.includes('Umschrift: ā'));

  // "Beispiele ansehen" bei word_b (ohne application_prompts) zeigt einen Hinweis statt Absturz.
  const secondActions = actionBars[1].querySelectorAll('button');
  assert.ok(![...secondActions].some((b) => b.textContent === 'Verbindung ansehen'), 'word_b (Buchstabe ب, nicht im Test-Keyboard) sollte keinen Verbindungs-Button haben');
  const examplesBtnB = [...secondActions].find((b) => b.textContent === 'Beispiele ansehen');
  examplesBtnB.click();
  assert.ok(container.textContent.includes('noch keine Beispiele hinterlegt'));
});

test('keine schwierigen Wörter vorhanden: Karte "Deine schwierigen Wörter" wird nicht angezeigt', async () => {
  const { view } = loadDashboard();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(!container.textContent.includes('Deine schwierigen Wörter'));
});
