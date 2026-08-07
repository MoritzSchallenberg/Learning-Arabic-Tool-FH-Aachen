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

function fakePack(vocabSessions) {
  return {
    keyboard: { letters: [{ id: 'alif', letter: 'ا', name: 'Alif', joining: 'right' }] },
    vocabulary: { categories: [{ id: 'home', words: [{ id: 'housing_door', arabic: 'اب', german: 'Test' }] }] },
    vocabSessions
  };
}

function loadDashboard({ vocabSessions = null, sessionStates = {}, activeSessionId = null } = {}) {
  let navigatedWith = null;
  let navigatedSession = null;
  const context = {
    document: createDocumentStub(),
    console,
    ReviewScheduler,
    PracticePool,
    ProgressStats,
    PhaseRegistry,
    App: {
      navigateToFreePractice: (options) => { navigatedWith = options; },
      navigateToSession: (unitId, sessionId) => { navigatedSession = { unitId, sessionId }; }
    }
  };
  const past = new Date(Date.now() - 1000).toISOString();
  const cards = {
    letter_alif: { difficulty: { spelling: 3 }, nextReview: { spelling: past } }
  };
  context.AppState = {
    getLanguagePack: () => Promise.resolve(fakePack(vocabSessions)),
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
  return { view: context.__DashboardView, getNavigatedWith: () => navigatedWith, getNavigatedSession: () => navigatedSession };
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
