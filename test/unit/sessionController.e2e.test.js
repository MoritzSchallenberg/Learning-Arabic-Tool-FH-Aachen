// Ende-zu-Ende-Test der Pilot-Sessions (Entwicklungsauftrag 4 + grundlegend erweitert in
// Entwicklungsauftrag 5; Lernstufen 1-5 in Entwicklungsauftrag 15 neu aufgebaut): Sessionübersicht/
// Lernziele (Stufe 1) -> Theorie OHNE Pflicht-Mini-Check (Stufe 2) -> Lernkarten ohne
// Zwischenabfrage (Stufe 3) -> Audio kennenlernen (Stufe 4) -> Wortübersicht (Stufe 5) -> ab hier
// UNVERÄNDERT: Wiedererkennen -> Rekonstruieren -> Geführte Eingabe -> Selbstständige Eingabe ->
// Anwendung -> Abschluss, gegen die ECHTEN Module (kein Mock der Session-Logik selbst) — nur
// document/App/AppState/AudioPlayer sind Testdoubles.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub, FakeKeyboardEvent } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');

// Reihenfolge entspricht genau src/index.html — diese Dateien teilen sich (wie im Browser)
// einen gemeinsamen globalen Scope.
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

// Baut eine minimale, aber persistente In-Memory-AppState-Implementierung — inklusive der
// Session-State-Speicherung, damit Session-Wiederaufnahme über zwei Testläufe hinweg (zwei
// mount()-Aufrufe in DEMSELBEN Kontext) tatsächlich geprüft werden kann.
function createFakeAppState(settingsOverrides = {}) {
  const cards = {};
  const sessionStates = {};
  const theoryProgress = {};
  let activeSessionId = null;
  let dailyNewCount = { date: null, count: 0 };
  const incrementCalls = [];

  return {
    getCard: (id) => {
      if (!cards[id]) cards[id] = { difficulty: {}, consecutiveWrong: {} };
      return cards[id];
    },
    // Entwicklungsauftrag 15, Abschnitt 9.7 — manuelle Schwierig-Markierung auf der Lernkarte.
    isWordMarkedDifficult: (id) => !!(cards[id] && cards[id].markedDifficult),
    toggleWordDifficult: (id) => {
      if (!cards[id]) cards[id] = { difficulty: {}, consecutiveWrong: {} };
      cards[id].markedDifficult = !cards[id].markedDifficult;
      return Promise.resolve(cards[id].markedDifficult);
    },
    persistProgress: () => Promise.resolve(),
    getSessionState: (id) => sessionStates[id] || null,
    saveSessionState: (id, state) => {
      sessionStates[id] = { ...state };
      activeSessionId = id;
      return Promise.resolve();
    },
    clearSessionState: (id) => {
      delete sessionStates[id];
      if (activeSessionId === id) activeSessionId = null;
      return Promise.resolve();
    },
    getActiveSessionId: () => activeSessionId,
    getSettings: () => ({ dailyNewLimit: 10, showTransliteration: true, showDiacritics: true, ...settingsOverrides }),
    getDailyNewCount: () => (dailyNewCount.date === todayIso() ? dailyNewCount.count : 0),
    incrementDailyNewCount: (by = 1) => {
      if (dailyNewCount.date !== todayIso()) dailyNewCount = { date: todayIso(), count: 0 };
      dailyNewCount.count += by;
      incrementCalls.push(by);
      return Promise.resolve(dailyNewCount.count);
    },
    markTheoryOpened: (id) => { theoryProgress[id] = theoryProgress[id] || { status: 'opened' }; },
    markTheoryMiniCheckResult: (id, correct, total) => {
      theoryProgress[id] = { status: 'mini_check_passed', miniCheck: { correct, total } };
      return Promise.resolve(correct / total >= 0.6);
    },
    markTheoryCompleted: (id) => {
      theoryProgress[id] = { ...(theoryProgress[id] || {}), status: 'completed' };
      return Promise.resolve();
    },
    getLanguagePack: () => Promise.resolve({
      keyboard: { letters: loadKeyboardLetters() },
      vocabulary: { categories: [{ id: 'all', words: loadVocabularyWords() }] },
      vocabSessions: loadVocabSessions(),
      theory: loadTheory()
    }),
    _sessionStates: sessionStates,
    _cards: cards,
    _incrementCalls: incrementCalls
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function loadSessionModules(context) {
  vm.createContext(context);
  const combinedSrc = SOURCE_FILES
    .map((relPath) => fs.readFileSync(path.join(ROOT, relPath), 'utf-8'))
    .join('\n;\n');
  vm.runInContext(`${combinedSrc}\nthis.__SessionController = SessionController;`, context);
  return context.__SessionController;
}

function buildContext(fakeAppState) {
  const navigateCalls = [];
  const context = {
    document: createDocumentStub(),
    console,
    setTimeout,
    clearTimeout,
    Event,
    KeyboardEvent: FakeKeyboardEvent,
    AppState: fakeAppState,
    AudioPlayer: { speak: () => Promise.resolve({ source: 'audio' }), speakWord: () => Promise.resolve({ source: 'recorded_audio', mode: 'normal', audioKey: null }), stopCurrentAudio: () => {} },
    App: {
      registerCleanup: () => {},
      navigateToCourse: () => navigateCalls.push('course'),
      navigateToUnitDetail: (unitId) => navigateCalls.push(`unit:${unitId}`),
      navigateToFreePractice: (opts) => navigateCalls.push(`free:${JSON.stringify(opts || {})}`),
      navigateToSession: (unitId, sessionId) => navigateCalls.push(`session:${unitId}:${sessionId}`),
      renderHeader: () => {}
    }
  };
  context.__navigateCalls = navigateCalls;
  return context;
}

// --- Hilfsfunktionen zur Steuerung der gerenderten Oberfläche -------------------------------
function findButtonByText(container, text) {
  return container.querySelectorAll('button').find((b) => b.textContent === text);
}
function optionButtons(container) {
  const wrap = container.querySelector('.rating-buttons');
  return wrap ? wrap.querySelectorAll('button') : [];
}
async function tick() { await new Promise((r) => setImmediate(r)); }

// --- Entwicklungsauftrag 15: Hilfsfunktionen für die neuen Lernstufen 1-5 -------------------
// Stufe 2 (Theorie) hat KEINEN Pflicht-Mini-Check mehr -- ein einziger Klick auf "Weiter zu den
// Lernkarten" genügt (kein Warteschleifen-Loop wie zuvor bei "Mit den Wörtern starten" nötig).
function clickTheoryNext(container) {
  const btn = findButtonByText(container, 'Weiter zu den Lernkarten');
  assert.ok(btn, '"Weiter zu den Lernkarten" sollte in Stufe 2 (Theorie) vorhanden sein');
  btn.click();
}

/** Klickt in Stufe 3 (Lernkarten) oder Stufe 4 (Audio kennenlernen) genau `count`-mal auf
 * "Weiter →", bis die jeweils nächste Stufe erreicht ist. */
async function advanceThroughCards(container, count) {
  for (let i = 0; i < count; i += 1) {
    const btn = findButtonByText(container, 'Weiter →');
    assert.ok(btn, `"Weiter →" sollte bei Karte/Audio ${i + 1} von ${count} vorhanden sein`);
    btn.click();
    await tick();
  }
}

function clickOverviewNext(container) {
  const btn = findButtonByText(container, 'Weiter zu den Übungen');
  assert.ok(btn, '"Weiter zu den Übungen" sollte in Stufe 5 (Wortübersicht) vorhanden sein');
  btn.click();
}

/** Durchläuft die kompletten Lernstufen 1-5 ab der Sessionübersicht bis zur ersten Übungsaufgabe. */
async function completeLearningStages(container, wordCount) {
  const startBtn = findButtonByText(container, 'Lernen beginnen') || findButtonByText(container, 'Session fortsetzen');
  assert.ok(startBtn, '"Lernen beginnen"/"Session fortsetzen" sollte auf der Übersicht vorhanden sein');
  startBtn.click();
  await tick();
  clickTheoryNext(container);
  await tick();
  await advanceThroughCards(container, wordCount); // Stufe 3: Lernkarten
  await advanceThroughCards(container, wordCount); // Stufe 4: Audio kennenlernen
  clickOverviewNext(container); // Stufe 5: Wortübersicht
  await tick();
}

test('vollständiger Durchlauf der Pilot-Session "Begrüßung und Höflichkeit": Übersicht -> Theorie -> Lernkarten -> Audio -> Wortübersicht -> Üben -> Abschluss', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);

  const container = createDocumentStub().createElement('div');
  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });

  // 1) Sessionübersicht/Lernziele (Stufe 1) ist die ERSTE Ansicht — kein direkter Zugriff auf
  // Theorie/Übungen (Abschnitt 7/14).
  assert.ok(container.textContent.includes('10 neue Wörter'), 'Übersicht sollte die Wortanzahl zeigen');
  assert.ok(container.textContent.includes('In dieser Session lernst du'));
  assert.ok(container.textContent.includes('Ablauf'));
  assert.ok(container.textContent.includes('Kurze Theorie'), 'der Ablauf-Kasten sollte die Stufennamen nennen');
  assert.ok(!findButtonByText(container, 'Mehr erfahren'), 'die eigentliche Theorieanzeige (Stufe 2) darf auf der Übersicht noch nicht sichtbar sein');
  const startBtn = findButtonByText(container, 'Lernen beginnen');
  assert.ok(startBtn, '"Lernen beginnen" sollte auf der Übersicht vorhanden sein');
  startBtn.click();
  await tick();

  // 2) Theorie (Stufe 2) erscheint OHNE Pflicht-Mini-Check -- "Weiter zu den Lernkarten" ist von
  // Anfang an nutzbar (Abschnitt 8).
  assert.ok(container.textContent.includes('Lernziele'));
  const theoryNextBtn = findButtonByText(container, 'Weiter zu den Lernkarten');
  assert.ok(theoryNextBtn, '"Weiter zu den Lernkarten" sollte sofort vorhanden sein');
  assert.equal(theoryNextBtn.disabled, false, 'darf NICHT durch einen Mini-Check blockiert sein');
  assert.ok(!findButtonByText(container, 'Mini-Check'), 'kein Mini-Check-Text sollte in Stufe 2 erscheinen');
  theoryNextBtn.click();
  await tick();

  // 3) Neue Wörter als Lernkarten (Stufe 3): Einzelansicht, "Wort 1 von 10" sichtbar, KEINE
  // Abfrage zwischen den Karten (Abschnitt 9/14).
  assert.ok(container.textContent.includes('Wort 1 von 10'));
  assert.equal(container.querySelectorAll('.word-card').length, 1, 'genau eine Karte gleichzeitig, kein volles Raster');
  assert.ok(findButtonByText(container, 'Als schwierig markieren'), 'Schwierig-Markierung sollte auf jeder Lernkarte vorhanden sein');
  assert.equal(optionButtons(container).length, 0, 'in Stufe 3 darf keine Multiple-Choice-Abfrage erscheinen');
  await advanceThroughCards(container, 10);

  // 4) Audio kennenlernen (Stufe 4): eigene Stufe mit Positionsanzeige, ebenfalls keine Abfrage.
  assert.ok(container.textContent.includes('Audio 1 von 10'), 'Stufe 4 sollte mit "Audio 1 von 10" beginnen');
  await advanceThroughCards(container, 10);

  // 5) Gemeinsame Wortübersicht (Stufe 5): alle 10 neuen Wörter, "Weiter zu den Übungen" beendet
  // die Lernstufen (Abschnitt 13/14).
  assert.ok(container.textContent.includes('Als Nächstes: Übungen'), 'ehrlicher Übergang statt erfundener Stufen 6-10 (Abschnitt 6)');
  assert.equal(container.querySelectorAll('.word-card').length, 10, 'Wortübersicht sollte alle 10 neuen Wörter zeigen');
  clickOverviewNext(container);
  await tick();

  assert.ok(container.textContent.includes('Aufgabe 1 /'), 'Wiedererkennen-Phase sollte begonnen haben');

  // 4) Graded-Phasen: vereinheitlichte Aktionsleiste — "Prüfen" nur bei Eingabeaufgaben, sonst
  // committet ein Klick auf eine Option direkt.
  let guard = 0;
  while (!container.textContent.includes('Session abgeschlossen') && !container.textContent.includes('Session beendet') && guard < 250) {
    guard += 1;
    const opts = optionButtons(container);
    if (opts.length > 0) {
      opts[0].click();
      await tick();
    } else {
      const input = container.querySelector('input');
      const pruefen = findButtonByText(container, 'Prüfen');
      if (input) {
        input.value = 'falsch';
        pruefen.click();
        await tick();
      } else if (pruefen) {
        // Rekonstruieren: alle Kacheln in Reihenfolge anklicken, dann prüfen.
        const chrome = new Set(['Theorie ansehen', 'Session verlassen', 'Zurücksetzen', 'Prüfen', 'Hilfe', 'Audio']);
        let tile = container.querySelectorAll('button').find((b) => !chrome.has(b.textContent) && b.textContent !== '');
        while (tile) {
          tile.click();
          await tick();
          tile = container.querySelectorAll('button').find((b) => !chrome.has(b.textContent) && b.textContent !== '');
        }
        pruefen.click();
        await tick();
      } else {
        break;
      }
    }
    const weiter = findButtonByText(container, 'Weiter');
    if (weiter) { weiter.click(); await tick(); }
  }

  // 5) Abschluss erreicht, mit erweitertem Abschlussbild (Abschnitt 25).
  assert.ok(
    container.textContent.includes('Session abgeschlossen') || container.textContent.includes('Session beendet'),
    'Die Session sollte im Abschlussbildschirm enden'
  );
  assert.ok(/Wörtern sicher erkannt/.test(container.textContent));
  assert.ok(/selbstständig geschrieben/.test(container.textContent));
  assert.ok(/Gesamt: \d+ %/.test(container.textContent));
  assert.ok(findButtonByText(container, 'Zur Unit'));

  // Tageslimit: jedes der 10 neuen Wörter wurde genau einmal gezählt (nicht mehrfach durch
  // erneutes Anzeigen/"Zurück"/Gruppen-Mini-Checks).
  const totalIncrements = fakeAppState._incrementCalls.reduce((a, b) => a + b, 0);
  assert.equal(totalIncrements, 10, 'jedes neue Wort sollte das Tageslimit genau einmal erhöhen');
});

test('Session-Wiederaufnahme: exakte Aufgaben-Warteschlange (inkl. geplanter Wiederholung) bleibt nach einem Neustart erhalten', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');

  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  await completeLearningStages(container, 10);
  assert.ok(container.textContent.includes('Aufgabe 1 /'), 'Wiedererkennen-Phase sollte begonnen haben');

  // Zwei Aufgaben lösen (bewusst mit der ERSTEN Option — mal richtig, mal falsch), dann
  // "verlassen" (neuer mount() in DEMSELBEN AppState — simuliert einen Neustart der App).
  for (let i = 0; i < 2; i += 1) {
    optionButtons(container)[0].click();
    await tick();
    const weiter = findButtonByText(container, 'Weiter');
    weiter.click();
    await tick();
  }

  const savedState = fakeAppState.getSessionState('vocab_unit_01_a');
  assert.ok(savedState, 'Session-Zustand sollte gespeichert worden sein');
  assert.equal(savedState.status, 'in_progress');
  assert.equal(savedState.theoryDone, true, 'Theoriefortschritt sollte erhalten bleiben');
  const savedQueueBefore = JSON.parse(JSON.stringify(savedState.phaseQueues.recognition));

  // Neuer Mount (wie nach einem Neustart) — MUSS an der gespeicherten Stelle fortsetzen, mit
  // EXAKT derselben Warteschlange (Abschnitt 12: kein erneutes zufälliges Mischen).
  const container2 = createDocumentStub().createElement('div');
  await SessionController.mount(container2, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  // Hinweis: "Lernziele" allein ist seit Entwicklungsauftrag 15 KEIN zuverlässiger Marker mehr --
  // der Ablaufkasten der Übersicht nennt "Lernziele" jetzt auch als Namen von Lernstufe 1. Die
  // eigentliche Theorieanzeige erkennt man zuverlässig an ihrem eigenen "Weiter zu den
  // Lernkarten"-Button, der auf der Übersicht selbst nie erscheint.
  assert.ok(!findButtonByText(container2, 'Weiter zu den Lernkarten'), 'nach Wiederaufnahme darf NICHT wieder die Theorie gezeigt werden');
  assert.ok(container2.textContent.includes('Session fortsetzen'), 'Übersicht sollte "Session fortsetzen" statt "Session starten" anbieten');
  findButtonByText(container2, 'Session fortsetzen').click();
  await tick();
  assert.ok(container2.textContent.includes('Aufgabe'), 'nach Wiederaufnahme sollte direkt eine Aufgabe sichtbar sein');

  // Über JSON hin- und herserialisieren, da die geladenen Objekte aus einem anderen vm-Realm
  // stammen (anderer Object.prototype) — deepEqual/deepStrictEqual würde sonst allein an der
  // Prototyp-Ungleichheit scheitern, obwohl der Inhalt identisch ist.
  const savedQueueAfter = JSON.parse(JSON.stringify(fakeAppState.getSessionState('vocab_unit_01_a').phaseQueues.recognition));
  assert.deepEqual(savedQueueAfter.pending, savedQueueBefore.pending, 'exakt dieselbe Aufgaben-Reihenfolge (inkl. geplanter Wiederholungen) muss erhalten bleiben');
  assert.equal(savedQueueAfter.index, savedQueueBefore.index, 'exakt dieselbe Position muss erhalten bleiben');
});

test('Theorie ist während der Session jederzeit über "Theorie ansehen" erreichbar, ohne den Fortschritt zu verlieren', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');

  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  findButtonByText(container, 'Lernen beginnen').click();
  await tick();
  clickTheoryNext(container);
  await tick();

  const theoryBtn = findButtonByText(container, 'Theorie ansehen');
  assert.ok(theoryBtn, '"Theorie ansehen" sollte auch außerhalb der Theorie-Phase sichtbar sein');
  theoryBtn.click();
  assert.ok(container.textContent.includes('Lernziele'), 'Theorie sollte erneut angezeigt werden');
  // Beim erneuten Ansehen mitten in der Session ist der Mini-Check NICHT verpflichtend.
  assert.equal(findButtonByText(container, 'Zurück zur Übung').disabled, false);

  const backBtn = findButtonByText(container, 'Zurück zur Übung');
  backBtn.click();
  assert.ok(container.querySelectorAll('.word-card').length > 0 || container.textContent.includes('Wort 1 von 10'), 'nach "Zurück zur Übung" sollte die Wortlernphase wieder sichtbar sein');
});

test('Tageslimit: eine Session mit mehr neuen Wörtern als heute erlaubt zeigt eine Wahlmöglichkeit an', async () => {
  const fakeAppState = createFakeAppState({ dailyNewLimit: 5 });
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');

  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  assert.ok(container.textContent.includes('Dein Tagesziel sind noch 5 neue Wörter.'));
  const limitedBtn = findButtonByText(container, '5 Wörter lernen');
  assert.ok(limitedBtn);
  limitedBtn.click();
  await tick();

  assert.ok(container.textContent.includes('5 neue Wörter'), 'Übersicht sollte die gekürzte Wortanzahl zeigen');
});

for (const [unitId, sessionId, wordCount] of [['vocab_unit_02', 'vocab_unit_02_a', 10], ['vocab_unit_03', 'vocab_unit_03_a', 10]]) {
  test(`Pilot-Session ${sessionId} lässt sich mit korrekten Antworten vollständig und erfolgreich abschließen`, async () => {
    const fakeAppState = createFakeAppState();
    const context = buildContext(fakeAppState);
    const SessionController = loadSessionModules(context);
    const container = createDocumentStub().createElement('div');
    const allWords = loadVocabularyWords();

    await SessionController.mount(container, { unitId, sessionId });
    findButtonByText(container, 'Lernen beginnen').click();
    await tick();
    clickTheoryNext(container);
    await tick();

    let guard = 0;
    while (!container.textContent.includes('Session abgeschlossen') && !container.textContent.includes('Session beendet') && guard < 400) {
      guard += 1;
      const weiterWort = findButtonByText(container, 'Weiter →');
      if (weiterWort) { weiterWort.click(); await tick(); continue; }
      const weiterUebungen = findButtonByText(container, 'Weiter zu den Übungen');
      if (weiterUebungen) { weiterUebungen.click(); await tick(); continue; }

      const opts = optionButtons(container);
      if (opts.length > 0) {
        const bodyText = container.textContent;
        let target = opts.find((btn) => allWords.some((w) => btn.textContent === w.arabic && bodyText.includes(w.german)));
        if (!target) target = opts.find((btn) => allWords.some((w) => btn.textContent === w.german && bodyText.includes(w.arabic)));
        (target || opts[0]).click();
        await tick();
        const weiter = findButtonByText(container, 'Weiter');
        if (weiter) { weiter.click(); await tick(); }
        continue;
      }

      const input = container.querySelector('input');
      const pruefen = findButtonByText(container, 'Prüfen');
      if (input && pruefen) {
        const leadEls = container.querySelectorAll('p.lead');
        const lead = leadEls.length ? leadEls[leadEls.length - 1].textContent : '';
        const match = allWords.find((w) => lead.includes(w.german));
        if (match) input.value = match.arabic;
        pruefen.click();
        await tick();
        const weiter = findButtonByText(container, 'Weiter');
        if (weiter) { weiter.click(); await tick(); }
        continue;
      }
      if (pruefen) {
        // Rekonstruieren: alle Kacheln wurden bereits angeklickt (opts.length war 0) — jetzt
        // direkt prüfen, statt fälschlich abzubrechen.
        pruefen.click();
        await tick();
        const weiter = findButtonByText(container, 'Weiter');
        if (weiter) { weiter.click(); await tick(); }
        continue;
      }
      break;
    }

    assert.ok(
      container.textContent.includes('Session abgeschlossen') || container.textContent.includes('Session beendet'),
      `Session ${sessionId} sollte den Abschlussbildschirm erreichen`
    );
    assert.ok(container.textContent.includes(`von ${wordCount} Wörtern sicher erkannt`));
  });
}

// Entwicklungsauftrag 15, Abschnitt 19 "Repräsentative Sessions": vollständiger Durchlauf der
// Lernstufen 1-5 mindestens für die Sessions aus Unit 1/5/10/15/20/25/30 -- deckt ab, dass das
// Stufenmodell nicht nur für die (in den obigen Tests bereits ausführlich geprüften) ersten drei
// Pilot-Units funktioniert, sondern gleichmäßig über den gesamten Kurs 1 hinweg.
for (const n of [1, 5, 10, 15, 20, 25, 30]) {
  const unitId = `vocab_unit_${String(n).padStart(2, '0')}`;
  const sessionId = `${unitId}_a`;
  test(`repräsentative Session ${sessionId}: Stufen 1-5 vollständig durchlaufen, landet in Wiedererkennen`, async () => {
    const fakeAppState = createFakeAppState();
    const context = buildContext(fakeAppState);
    const SessionController = loadSessionModules(context);
    const container = createDocumentStub().createElement('div');

    await SessionController.mount(container, { unitId, sessionId });
    await completeLearningStages(container, 10);
    assert.ok(container.textContent.includes('Aufgabe 1 /'), `Session ${sessionId} sollte nach Stufe 5 in Wiedererkennen landen`);
    assert.equal(fakeAppState._incrementCalls.reduce((a, b) => a + b, 0), 10, 'jedes der 10 neuen Wörter zählt genau einmal fürs Tageslimit');
  });
}
