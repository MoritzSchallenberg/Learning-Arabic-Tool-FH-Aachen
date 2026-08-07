// Ende-zu-Ende-Test der Pilot-Sessions (Entwicklungsauftrag 4 + grundlegend erweitert in
// Entwicklungsauftrag 5): Sessionübersicht -> Theorie (Mini-Check muss vollständig bearbeitet
// werden) -> Wörter in Dreiergruppen kennenlernen (mit Gruppen-Mini-Checks) -> Wiedererkennen ->
// Rekonstruieren -> Geführte Eingabe -> Selbstständige Eingabe -> Anwendung -> Abschluss, gegen
// die ECHTEN Module (kein Mock der Session-Logik selbst) — nur document/App/AppState/AudioPlayer
// sind Testdoubles.

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
    AudioPlayer: { speak: () => Promise.resolve({ source: 'audio' }) },
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

async function answerAllTheoryMiniChecks(container) {
  let guard = 0;
  while (!findButtonByText(container, 'Mit den Wörtern starten') && guard < 10) {
    guard += 1;
    const opts = optionButtons(container);
    if (opts.length === 0) break;
    opts[0].click();
    await tick();
    const weiter = findButtonByText(container, 'Weiter');
    if (weiter) { weiter.click(); await tick(); }
  }
}

test('vollständiger Durchlauf der Pilot-Session "Begrüßung und Höflichkeit": Übersicht -> Theorie -> Mini-Check -> Wörter in Gruppen -> Üben -> Abschluss', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);

  const container = createDocumentStub().createElement('div');
  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });

  // 1) Sessionübersicht ist die ERSTE Ansicht — kein direkter Zugriff auf Theorie/Übungen
  // (Abschnitt 14).
  assert.ok(container.textContent.includes('9 neue Wörter'), 'Übersicht sollte die Wortanzahl zeigen');
  assert.ok(container.textContent.includes('Heute lernst du'));
  assert.ok(container.textContent.includes('Ablauf'));
  assert.ok(!container.textContent.includes('Lernziele'), 'Theorie darf auf der Übersicht noch nicht sichtbar sein');
  const startBtn = findButtonByText(container, 'Session starten');
  assert.ok(startBtn, '"Session starten" sollte auf der Übersicht vorhanden sein');
  startBtn.click();
  await tick();

  // 2) Theorie erscheint, Mini-Check MUSS vollständig bearbeitet werden, bevor "Session
  // starten" (jetzt innerhalb der Theorie) nutzbar wird.
  assert.ok(container.textContent.includes('Lernziele'));
  const theoryStartBtn = findButtonByText(container, 'Session starten');
  assert.equal(theoryStartBtn.disabled, true, 'sollte vor dem Mini-Check deaktiviert sein');

  await answerAllTheoryMiniChecks(container);
  assert.ok(container.textContent.includes('von 3 richtig'));
  const startWordsBtn = findButtonByText(container, 'Mit den Wörtern starten');
  assert.ok(startWordsBtn);
  startWordsBtn.click();
  await tick();

  // 3) Wörter in Dreiergruppen: Einzelansicht ist Standard, "Wort 1 von 9" sichtbar, kein
  // Kartenraster mit allen Wörtern gleichzeitig.
  assert.ok(container.textContent.includes('Wort 1 von 9'));
  assert.equal(container.querySelectorAll('.word-card').length, 1, 'Einzelansicht sollte Standard sein, kein volles Raster');
  assert.ok(findButtonByText(container, 'Alle Wörter anzeigen'));
  assert.ok(findButtonByText(container, 'Kenne ich schon'));

  // Durch alle 3 Gruppen (3+3+3=9 Wörter) inkl. der jeweiligen Gruppen-Mini-Checks laufen.
  let learningGuard = 0;
  while (!container.textContent.includes('Wiedererkennen') || !container.querySelectorAll('.step-indicator-item.current').some((el) => el.textContent === 'Wiedererkennen')) {
    learningGuard += 1;
    assert.ok(learningGuard < 60, 'Wortlernphase sollte innerhalb der Sicherheitsgrenze abgeschlossen werden');
    const weiterWort = findButtonByText(container, 'Weiter →');
    if (weiterWort) { weiterWort.click(); await tick(); continue; }
    const opts = optionButtons(container);
    if (opts.length > 0) {
      opts[0].click();
      await tick();
      const weiter = findButtonByText(container, 'Weiter');
      assert.ok(weiter, '"Weiter" nach einem Gruppen-Mini-Check erwartet (kein Auto-Advance)');
      weiter.click();
      await tick();
      continue;
    }
    break;
  }
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

  // Tageslimit: jedes der 9 neuen Wörter wurde genau einmal gezählt (nicht mehrfach durch
  // erneutes Anzeigen/"Zurück"/Gruppen-Mini-Checks).
  const totalIncrements = fakeAppState._incrementCalls.reduce((a, b) => a + b, 0);
  assert.equal(totalIncrements, 9, 'jedes neue Wort sollte das Tageslimit genau einmal erhöhen');
});

test('Session-Wiederaufnahme: exakte Aufgaben-Warteschlange (inkl. geplanter Wiederholung) bleibt nach einem Neustart erhalten', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');

  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  findButtonByText(container, 'Session starten').click();
  await tick();
  await answerAllTheoryMiniChecks(container);
  findButtonByText(container, 'Mit den Wörtern starten').click();
  await tick();

  // Durch die komplette Gruppen-Lernphase klicken (Weiter durch alle Wörter + Mini-Checks),
  // bis die erste graded Phase (Wiedererkennen) beginnt.
  let guard = 0;
  while (!container.textContent.includes('Aufgabe 1 /') && guard < 60) {
    guard += 1;
    const weiterWort = findButtonByText(container, 'Weiter →');
    if (weiterWort) { weiterWort.click(); await tick(); continue; }
    const opts = optionButtons(container);
    if (opts.length > 0) {
      opts[0].click();
      await tick();
      const weiter = findButtonByText(container, 'Weiter');
      if (weiter) { weiter.click(); await tick(); }
      continue;
    }
    break;
  }

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
  assert.ok(!container2.textContent.includes('Lernziele'), 'nach Wiederaufnahme darf NICHT wieder die Theorie gezeigt werden');
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
  findButtonByText(container, 'Session starten').click();
  await tick();
  await answerAllTheoryMiniChecks(container);
  findButtonByText(container, 'Mit den Wörtern starten').click();
  await tick();

  const theoryBtn = findButtonByText(container, 'Theorie ansehen');
  assert.ok(theoryBtn, '"Theorie ansehen" sollte auch außerhalb der Theorie-Phase sichtbar sein');
  theoryBtn.click();
  assert.ok(container.textContent.includes('Lernziele'), 'Theorie sollte erneut angezeigt werden');
  // Beim erneuten Ansehen mitten in der Session ist der Mini-Check NICHT verpflichtend.
  assert.equal(findButtonByText(container, 'Zurück zur Übung').disabled, false);

  const backBtn = findButtonByText(container, 'Zurück zur Übung');
  backBtn.click();
  assert.ok(container.querySelectorAll('.word-card').length > 0 || container.textContent.includes('Wort 1 von 9'), 'nach "Zurück zur Übung" sollte die Wortlernphase wieder sichtbar sein');
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

for (const [unitId, sessionId, wordCount] of [['vocab_unit_02', 'vocab_unit_02_a', 8], ['vocab_unit_03', 'vocab_unit_03_a', 8]]) {
  test(`Pilot-Session ${sessionId} lässt sich mit korrekten Antworten vollständig und erfolgreich abschließen`, async () => {
    const fakeAppState = createFakeAppState();
    const context = buildContext(fakeAppState);
    const SessionController = loadSessionModules(context);
    const container = createDocumentStub().createElement('div');
    const allWords = loadVocabularyWords();

    await SessionController.mount(container, { unitId, sessionId });
    findButtonByText(container, 'Session starten').click();
    await tick();
    await answerAllTheoryMiniChecks(container);
    findButtonByText(container, 'Mit den Wörtern starten').click();
    await tick();

    let guard = 0;
    while (!container.textContent.includes('Session abgeschlossen') && !container.textContent.includes('Session beendet') && guard < 400) {
      guard += 1;
      const weiterWort = findButtonByText(container, 'Weiter →');
      if (weiterWort) { weiterWort.click(); await tick(); continue; }

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
