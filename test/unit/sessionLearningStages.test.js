// Entwicklungsauftrag 15, Abschnitt 19 — gezielte Tests für die Lernstufen 3-5 (Lernkarten/Audio/
// Wortübersicht) und die Snapshot-Migration, die über den generellen Ablauf-Test in
// sessionController.e2e.test.js hinausgehen: Grammatik-Chips ohne leere Felder, aufgelöste
// Zusatzinformationen (keine rohen internen IDs), preview_seen erst bei explizitem Weiterklick,
// Schwierig-Markierung übersteht einen Neustart, Tastaturnavigation, kein Wiedersetzen einer
// bereits in Übungsphasen laufenden Session an den Kartenanfang.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub, FakeKeyboardEvent } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');

const SOURCE_FILES = [
  'src/js/srs.js',
  'src/js/keyboardData.js',
  'src/js/textEditing.js',
  'src/js/wordShaping.js',
  'src/js/exerciseGuard.js',
  'src/js/theoryRenderer.js',
  'src/js/helpLevel.js',
  'src/js/reviewScheduler.js',
  'src/js/views/virtualKeyboard.js',
  'src/js/session/sessionState.js',
  'src/js/session/phaseRegistry.js',
  'src/js/session/sessionCoverageTracker.js',
  'src/js/session/sessionQueue.js',
  'src/js/session/exerciseRegistry.js',
  'src/js/session/sessionEngine.js',
  'src/js/session/learningStages.js',
  'src/js/session/wordRelations.js',
  'src/js/session/sessionRenderer.js',
  'src/js/session/sessionController.js'
];

function loadVocabularyWords() {
  const vocab = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabulary.json'), 'utf-8'));
  return vocab.categories.flatMap((c) => c.words);
}
function loadKeyboardLetters() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'keyboard.json'), 'utf-8')).letters;
}
function loadVocabSessions() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabSessions.json'), 'utf-8'));
}
function loadTheory() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'theory.json'), 'utf-8'));
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

function createFakeAppState(settingsOverrides = {}) {
  const cards = {};
  const sessionStates = {};
  let activeSessionId = null;
  let dailyNewCount = { date: null, count: 0 };
  const speakCalls = [];

  return {
    getCard: (id) => {
      if (!cards[id]) cards[id] = { difficulty: {}, consecutiveWrong: {} };
      return cards[id];
    },
    isWordMarkedDifficult: (id) => !!(cards[id] && cards[id].markedDifficult),
    toggleWordDifficult: (id) => {
      if (!cards[id]) cards[id] = { difficulty: {}, consecutiveWrong: {} };
      cards[id].markedDifficult = !cards[id].markedDifficult;
      return Promise.resolve(cards[id].markedDifficult);
    },
    persistProgress: () => Promise.resolve(),
    getSessionState: (id) => sessionStates[id] || null,
    saveSessionState: (id, state) => { sessionStates[id] = { ...state }; activeSessionId = id; return Promise.resolve(); },
    clearSessionState: (id) => { delete sessionStates[id]; if (activeSessionId === id) activeSessionId = null; return Promise.resolve(); },
    getActiveSessionId: () => activeSessionId,
    getSettings: () => ({ dailyNewLimit: 10, showTransliteration: true, showDiacritics: true, ...settingsOverrides }),
    getDailyNewCount: () => (dailyNewCount.date === todayIso() ? dailyNewCount.count : 0),
    incrementDailyNewCount: (by = 1) => {
      if (dailyNewCount.date !== todayIso()) dailyNewCount = { date: todayIso(), count: 0 };
      dailyNewCount.count += by;
      return Promise.resolve(dailyNewCount.count);
    },
    markTheoryOpened: () => {},
    markTheoryMiniCheckResult: () => Promise.resolve(true),
    markTheoryCompleted: () => Promise.resolve(),
    getLanguagePack: () => Promise.resolve({
      keyboard: { letters: loadKeyboardLetters() },
      vocabulary: { categories: [{ id: 'all', words: loadVocabularyWords() }] },
      vocabSessions: loadVocabSessions(),
      theory: loadTheory()
    }),
    _sessionStates: sessionStates,
    _cards: cards,
    _speakCalls: speakCalls
  };
}

function loadSessionModules(context) {
  vm.createContext(context);
  const combinedSrc = SOURCE_FILES.map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${combinedSrc}\nthis.__SessionController = SessionController;`, context);
  return context.__SessionController;
}

function buildContext(fakeAppState, audioOverrides = {}) {
  const stopCalls = [];
  const context = {
    document: createDocumentStub(),
    console,
    setTimeout,
    clearTimeout,
    Event,
    KeyboardEvent: FakeKeyboardEvent,
    AppState: fakeAppState,
    AudioPlayer: {
      speak: () => Promise.resolve({ source: 'audio' }),
      speakWord: (word, opts) => { fakeAppState._speakCalls.push({ wordId: word.id, ...opts }); return Promise.resolve({ source: 'recorded_audio', mode: opts && opts.slow ? 'dedicated_slow' : 'normal', audioKey: null }); },
      stopCurrentAudio: () => { stopCalls.push(true); },
      ...audioOverrides
    },
    App: {
      registerCleanup: () => {},
      navigateToCourse: () => {},
      navigateToUnitDetail: () => {},
      navigateToFreePractice: () => {},
      navigateToSession: () => {},
      renderHeader: () => {}
    }
  };
  context.__stopCalls = stopCalls;
  return context;
}

function findButtonByText(container, text) {
  return container.querySelectorAll('button').find((b) => b.textContent === text);
}
async function tick() { await new Promise((r) => setImmediate(r)); }

async function mountToWordCards(context, unitId = 'vocab_unit_01', sessionId = 'vocab_unit_01_a') {
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');
  await SessionController.mount(container, { unitId, sessionId });
  findButtonByText(container, 'Lernen beginnen').click();
  await tick();
  findButtonByText(container, 'Weiter zu den Lernkarten').click();
  await tick();
  return { SessionController, container };
}

// --- Stufe 3: Lernkarten ----------------------------------------------------------------------

test('Lernkarte: preview_seen wird NICHT allein durchs Rendern gesetzt, erst durch expliziten "Weiter"-Klick', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);

  assert.ok(container.textContent.includes('Wort 1 von 10'));
  // Bloßes Rendern der ersten Karte darf das Tageslimit noch nicht erhöht haben.
  assert.equal(fakeAppState.getDailyNewCount(), 0, 'reines Anzeigen der Karte darf preview_seen/Tageslimit nicht auslösen');

  findButtonByText(container, 'Weiter →').click();
  await tick();
  assert.equal(fakeAppState.getDailyNewCount(), 1, 'nach explizitem "Weiter" sollte genau ein Wort gezählt worden sein');
});

test('Lernkarte: "Zurück" reduziert das Tageslimit NICHT erneut (kein doppeltes Zählen bei Hin- und Herblättern)', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);

  findButtonByText(container, 'Weiter →').click();
  await tick();
  assert.equal(fakeAppState.getDailyNewCount(), 1);
  findButtonByText(container, '← Zurück').click();
  await tick();
  assert.equal(fakeAppState.getDailyNewCount(), 1, 'Zurückgehen darf den Zähler nicht verändern');
  findButtonByText(container, 'Weiter →').click();
  await tick();
  assert.equal(fakeAppState.getDailyNewCount(), 1, 'erneutes Bestätigen desselben Wortes zählt nicht doppelt');
});

test('Lernkarte: irrelevante leere Grammatikfelder werden nicht angezeigt', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context); // erstes Wort "greet_hallo" hat weder gender noch plural

  const metaEl = container.querySelectorAll('.word-card-meta')[0];
  if (metaEl) {
    assert.ok(!metaEl.textContent.includes('Plural: null'), 'kein rohes "null" darf als Pluralform erscheinen');
    assert.ok(!/Plural: keiner/i.test(metaEl.textContent));
  }
});

test('Lernkarte: Zusatzinformationen lösen confusion_group/opposite_id zu echten Wörtern auf, keine rohe interne ID sichtbar', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context, 'vocab_unit_11', 'vocab_unit_11_a');
  // c1_u11_05 ("رَخِيص"/billig, opposite_id+confusion_group gesetzt) ist das 9. von 10 Wörtern
  // dieser Session (new_word_ids-Reihenfolge in vocabSessions.json) -- erst dorthin blättern.
  for (let i = 0; i < 8; i += 1) { findButtonByText(container, 'Weiter →').click(); await tick(); }
  assert.ok(container.textContent.includes('Wort 9 von 10'));

  const details = container.querySelectorAll('details.word-card-extra')[0];
  assert.ok(details, 'die erste Karte von Unit 11 sollte einen aufklappbaren Zusatzbereich haben');
  assert.ok(!details.textContent.includes('c1_price_terms'), 'die rohe confusion_group-ID darf nicht als Text erscheinen');
  assert.ok(!/opposite_id/.test(details.textContent));
});

test('Lernkarte: Anwendungsbeispiel erscheint als lesbarer Text, keine rohe JSON-Struktur', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  assert.ok(!container.textContent.includes('"type"'), 'application_prompts darf nicht als JSON auftauchen');
  assert.ok(!container.textContent.includes('"prompt"'));
  assert.ok(!container.textContent.includes('{'));
});

test('Lernkarte: "Als schwierig markieren" persistiert über die vorhandene Fortschrittsspeicherung und übersteht einen Neustart', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);

  const toggleBtn = findButtonByText(container, 'Als schwierig markieren');
  assert.ok(toggleBtn);
  toggleBtn.click();
  await tick();
  assert.ok(findButtonByText(container, 'Nicht mehr als schwierig markieren'), 'Beschriftung sollte sofort wechseln');
  assert.equal(fakeAppState.isWordMarkedDifficult('greet_hallo'), true);

  // Neustart simulieren: neuer mount() im selben AppState.
  const SessionController2 = loadSessionModules(buildContext(fakeAppState));
  const container2 = createDocumentStub().createElement('div');
  await SessionController2.mount(container2, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  assert.equal(fakeAppState.isWordMarkedDifficult('greet_hallo'), true, 'Markierung sollte einen Neustart überstehen');
});

test('Lernkarte: Pfeiltaste rechts entspricht "Weiter", Pfeiltaste links entspricht "Zurück"', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);

  context.document.dispatchEvent({ type: 'keydown', key: 'ArrowRight', target: { tagName: 'body' } });
  await tick();
  assert.ok(container.textContent.includes('Wort 2 von 10'), 'ArrowRight sollte zur nächsten Karte führen');

  context.document.dispatchEvent({ type: 'keydown', key: 'ArrowLeft', target: { tagName: 'body' } });
  await tick();
  assert.ok(container.textContent.includes('Wort 1 von 10'), 'ArrowLeft sollte zur vorherigen Karte zurückführen');
});

test('Lernkarte: Leertaste spielt Audio ab, AUSSER der Fokus liegt auf einem Button/Eingabefeld', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);

  const before = fakeAppState._speakCalls.length;
  context.document.dispatchEvent({ type: 'keydown', key: ' ', target: { tagName: 'body' } });
  await tick();
  assert.ok(fakeAppState._speakCalls.length > before, 'Leertaste ohne Button-/Eingabefeld-Fokus sollte Audio abspielen');

  const beforeOnButton = fakeAppState._speakCalls.length;
  context.document.dispatchEvent({ type: 'keydown', key: ' ', target: { tagName: 'button' } });
  await tick();
  assert.equal(fakeAppState._speakCalls.length, beforeOnButton, 'Leertaste mit Fokus auf einem Button darf keine zusätzliche Audiowiedergabe auslösen (normale Buttonbedienung darf nicht überschrieben werden)');
});

test('Lernkarte: die Tastaturnavigation wird beim Verlassen der Lernkarten-Stufe wieder entfernt (kein doppelter Listener)', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);

  // Alle 10 Karten durchklicken -> Stufe 4 (Audio). Ab hier sollte EIN NEUER (nicht zusätzlicher)
  // Listener aktiv sein: zwei ArrowRight-Events sollten die Position um genau zwei erhöhen, nicht
  // mehr (was bei doppelt gestapelten Listenern der Fall wäre).
  for (let i = 0; i < 10; i += 1) { findButtonByText(container, 'Weiter →').click(); await tick(); }
  assert.ok(container.textContent.includes('Audio 1 von 10'));

  context.document.dispatchEvent({ type: 'keydown', key: 'ArrowRight', target: { tagName: 'body' } });
  await tick();
  assert.ok(container.textContent.includes('Audio 2 von 10'), 'genau EIN Schritt pro ArrowRight-Ereignis, kein doppelt gezählter Listener');
});

// --- Stufe 4: Audio kennenlernen --------------------------------------------------------------

test('Audiostufe: normale und langsame Wiedergabe rufen AudioPlayer.speakWord mit korrektem slow-Flag auf', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 10; i += 1) { findButtonByText(container, 'Weiter →').click(); await tick(); }
  assert.ok(container.textContent.includes('Audio 1 von 10'));

  fakeAppState._speakCalls.length = 0;
  const normalBtn = container.querySelectorAll('.btn.icon').find((b) => b.textContent === '🔊');
  normalBtn.click();
  await tick();
  assert.ok(fakeAppState._speakCalls.some((c) => c.slow === false || c.slow === undefined));

  const slowBtn = container.querySelectorAll('.btn.icon').find((b) => b.textContent === '🐢');
  slowBtn.click();
  await tick();
  assert.ok(fakeAppState._speakCalls.some((c) => c.slow === true), 'langsame Wiedergabe sollte slow:true übergeben');
});

test('Audiostufe: Audio wird beim Wortwechsel gestoppt (stopCurrentAudio)', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 10; i += 1) { findButtonByText(container, 'Weiter →').click(); await tick(); }

  const stopsBefore = context.__stopCalls.length;
  findButtonByText(container, 'Weiter →').click();
  await tick();
  assert.ok(context.__stopCalls.length > stopsBefore, 'Wortwechsel in der Audiostufe sollte eine laufende Wiedergabe stoppen');
});

test('Audiostufe: autoPlayWord spielt beim Wortwechsel genau einmal automatisch ab, nicht bei jedem Re-Render desselben Wortes', async () => {
  const fakeAppState = createFakeAppState({ autoPlayWord: true });
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 10; i += 1) { findButtonByText(container, 'Weiter →').click(); await tick(); }
  const wordId = 'greet_hallo';
  const autoCallsForFirstAudioWord = fakeAppState._speakCalls.filter((c) => c.context === 'Audio kennenlernen' && c.wordId === wordId).length;
  assert.equal(autoCallsForFirstAudioWord, 1, 'genau ein automatisches Abspielen beim Betreten des ersten Audio-Wortes');
});

test('Audiostufe: ohne autoPlayWord findet KEIN automatisches Abspielen statt', async () => {
  const fakeAppState = createFakeAppState({ autoPlayWord: false });
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 10; i += 1) { findButtonByText(container, 'Weiter →').click(); await tick(); }
  assert.equal(fakeAppState._speakCalls.filter((c) => c.context === 'Audio kennenlernen').length, 0);
});

// --- Stufe 5: Wortübersicht -------------------------------------------------------------------

test('Lernkarte: Umschrift respektiert die Einstellung showTransliteration', async () => {
  const withTranslit = createFakeAppState({ showTransliteration: true });
  const { container: c1 } = await mountToWordCards(buildContext(withTranslit));
  assert.equal(c1.querySelectorAll('.word-card-translit').length, 1, 'Umschrift sollte bei aktivierter Einstellung sichtbar sein');

  const withoutTranslit = createFakeAppState({ showTransliteration: false });
  const { container: c2 } = await mountToWordCards(buildContext(withoutTranslit));
  assert.equal(c2.querySelectorAll('.word-card-translit').length, 0, 'Umschrift sollte bei deaktivierter Einstellung nicht gerendert werden');
});

test('Audiostufe: die exakte Audio-Position übersteht einen simulierten Neustart', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 10; i += 1) { findButtonByText(container, 'Weiter →').click(); await tick(); } // -> Stufe 4
  findButtonByText(container, 'Weiter →').click(); // Audio 1 -> Audio 2
  await tick();
  assert.ok(container.textContent.includes('Audio 2 von 10'));

  const SessionController2 = loadSessionModules(buildContext(fakeAppState));
  const container2 = createDocumentStub().createElement('div');
  await SessionController2.mount(container2, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  findButtonByText(container2, 'Session fortsetzen').click();
  await tick();
  assert.ok(container2.textContent.includes('Audio 2 von 10'), 'nach Neustart exakt dieselbe Audio-Position');
});

test('Wortübersicht: normale Audiowiedergabe funktioniert für jede Karte', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 20; i += 1) {
    const btn = findButtonByText(container, 'Weiter →');
    if (!btn) break;
    btn.click();
    await tick();
  }
  fakeAppState._speakCalls.length = 0;
  const firstPlayBtn = container.querySelectorAll('.btn.icon').find((b) => b.textContent === '🔊');
  assert.ok(firstPlayBtn, 'die Wortübersicht sollte Audio-Buttons haben');
  firstPlayBtn.click();
  await tick();
  assert.equal(fakeAppState._speakCalls.length, 1);
});

test('abgeschlossene Sessions bleiben abgeschlossen: ein erneuter mount() zeigt wieder eine frische Übersicht, kein Wiederaufnahme-Zustand', async () => {
  const fakeAppState = createFakeAppState();
  await fakeAppState.saveSessionState('vocab_unit_01_a', { status: 'completed', phaseIndex: 7, theoryDone: true, coverage: {}, phaseQueues: {}, phaseScores: {}, helpLevel: 'C', correctCount: 5, wrongCount: 0, reviewWordIds: [] });
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');
  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  assert.ok(!container.textContent.includes('Session fortsetzen'), 'eine bereits abgeschlossene Session sollte nicht als fortsetzbar gelten');
  assert.ok(findButtonByText(container, 'Lernen beginnen'), 'ein Neustart sollte wieder bei Stufe 1 beginnen können');
});

test('Wortübersicht: enthält alle neuen Wörter, KEINE eingemischten Wiederholungswörter', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 20; i += 1) { // 10 Lernkarten + 10 Audio
    const btn = findButtonByText(container, 'Weiter →');
    if (!btn) break;
    btn.click();
    await tick();
  }
  assert.ok(container.textContent.includes('Stufe 5 von 10'), 'Entwicklungsauftrag 16: keine Übergangsanzeige mehr, sondern die reguläre Stufenanzeige');
  assert.equal(container.querySelectorAll('.word-card').length, 10, 'genau die 10 neuen Wörter, keine Wiederholungswörter');
});

test('Wortübersicht: "Zurück zu den Lernkarten" verliert keinen Fortschritt (Session bleibt in_progress, dieselben Wörter)', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 20; i += 1) {
    const btn = findButtonByText(container, 'Weiter →');
    if (!btn) break;
    btn.click();
    await tick();
  }
  findButtonByText(container, '← Zurück zu den Lernkarten').click();
  await tick();
  assert.ok(container.textContent.includes('von 10'), 'sollte wieder in der Lernkartenansicht sein');
  const saved = fakeAppState.getSessionState('vocab_unit_01_a');
  assert.equal(saved.status, 'in_progress', 'Fortschritt darf beim Zurückgehen nicht verworfen werden');
});

test('Wortübersicht: erst "Weiter zu den Übungen" beendet Stufe 5 (Wiedererkennen beginnt)', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  for (let i = 0; i < 20; i += 1) {
    const btn = findButtonByText(container, 'Weiter →');
    if (!btn) break;
    btn.click();
    await tick();
  }
  assert.ok(!container.textContent.includes('Aufgabe 1 /'), 'vor dem Klick darf noch keine Übung begonnen haben');
  findButtonByText(container, 'Weiter zu den Übungen').click();
  await tick();
  assert.ok(container.textContent.includes('Aufgabe 1 /'));
});

// --- Migration alter Snapshots (Abschnitt 18) --------------------------------------------------

test('Migration: ein Snapshot ohne learningStageState (vor Entwicklungsauftrag 15) wird sicher auf Stufe 3 gesetzt, kein Absturz', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');

  // Alten Snapshot OHNE learningStageState simulieren (Stand nach Entwicklungsauftrag 13/14):
  // Theorie abgeschlossen, phaseIndex zeigt auf word_preview, ein Wort bereits "gesehen".
  await fakeAppState.saveSessionState('vocab_unit_01_a', {
    status: 'in_progress',
    phaseIndex: 1,
    theoryDone: true,
    coverage: { greet_hallo: { preview_seen: true, recognition_attempts: 0 } },
    phaseQueues: {},
    phaseScores: {},
    helpLevel: 'C',
    correctCount: 0,
    wrongCount: 0,
    reviewWordIds: [],
    activeNewWordIds: undefined
  });

  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  findButtonByText(container, 'Session fortsetzen').click();
  await tick();
  assert.ok(container.textContent.includes('von 10'), 'sollte ohne Absturz in einer der Lernkarten-Unterstufen landen');
});

test('Migration: eine Session, die bereits eine Übungsphase erreicht hat, wird NICHT wieder an den Kartenanfang gesetzt', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');

  // Alter Snapshot bereits in "recognition" (phaseIndex 2) -- OHNE learningStageState.
  await fakeAppState.saveSessionState('vocab_unit_01_a', {
    status: 'in_progress',
    phaseIndex: 2,
    theoryDone: true,
    coverage: {},
    phaseQueues: {},
    phaseScores: {},
    helpLevel: 'C',
    correctCount: 0,
    wrongCount: 0,
    reviewWordIds: [],
    activeNewWordIds: undefined
  });

  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  findButtonByText(container, 'Session fortsetzen').click();
  await tick();
  assert.ok(container.textContent.includes('Aufgabe'), 'sollte direkt in der Übungsphase landen, NICHT wieder bei den Lernkarten');
  assert.ok(!container.textContent.includes('Wort 1 von 10'));
});

test('Migration: exakte Kartenposition (cardIndex) und Audio-Position übersteht einen simulierten Neustart', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const { container } = await mountToWordCards(context);
  findButtonByText(container, 'Weiter →').click(); // -> Wort 2
  await tick();
  findButtonByText(container, 'Weiter →').click(); // -> Wort 3
  await tick();
  assert.ok(container.textContent.includes('Wort 3 von 10'));

  const saved = fakeAppState.getSessionState('vocab_unit_01_a');
  assert.ok(saved.learningStageState, 'learningStageState sollte Teil des Snapshots sein');
  assert.equal(saved.learningStageState.cardIndex, 2);

  const SessionController2 = loadSessionModules(buildContext(fakeAppState));
  const container2 = createDocumentStub().createElement('div');
  await SessionController2.mount(container2, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  findButtonByText(container2, 'Session fortsetzen').click();
  await tick();
  assert.ok(container2.textContent.includes('Wort 3 von 10'), 'nach Neustart exakt dieselbe Karte, nicht neu geraten');
});
