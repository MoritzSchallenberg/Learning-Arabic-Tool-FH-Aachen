// Ende-zu-Ende-Test der Pilot-Session (Entwicklungsauftrag 4, Schritt 1-4 + Abschnitt 29):
// Theorie -> Mini-Check -> Wörter kennenlernen -> Wiedererkennen -> Rekonstruieren ->
// Geführte Eingabe -> Selbstständige Eingabe -> Anwendung -> Abschluss, gegen die ECHTEN
// Module (kein Mock der Session-Logik selbst) — nur document/App/AppState/AudioPlayer sind
// Testdoubles. Deckt damit direkt mehrere Akzeptanzkriterien aus Abschnitt 26 ab: TheoryRenderer
// wird tatsächlich aufgerufen, kein neues Wort erscheint zuerst in einer Produktionsphase,
// Feedback wartet auf "Weiter", Session-Wiederaufnahme funktioniert.

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
  'src/js/views/virtualKeyboard.js',
  'src/js/session/sessionState.js',
  'src/js/session/phaseRegistry.js',
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

function loadSessionDef() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabSessions.json'), 'utf-8'));
  return data.sessions.find((s) => s.session_id === 'vocab_unit_01_a');
}

function loadTheoryDoc() {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'theory.json'), 'utf-8'));
  return data.theories.find((t) => t.theory_id === 'theory_vocab_unit_01_a');
}

// Baut eine minimale, aber persistente In-Memory-AppState-Implementierung — inklusive der
// Session-State-Speicherung, damit Session-Wiederaufnahme über zwei Testläufe hinweg (zwei
// mount()-Aufrufe in DEMSELBEN Kontext) tatsächlich geprüft werden kann.
function createFakeAppState() {
  const cards = {};
  const sessionStates = {};
  const theoryProgress = {};
  let activeSessionId = null;

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
      vocabulary: { categories: [{ id: 'greetings', words: loadVocabularyWords().filter((w) => w.id.startsWith('greet_')) }] },
      vocabSessions: { sessions: [loadSessionDef()], vocab_units: [{ id: 'vocab_unit_01', title: 'Begrüßung und Höflichkeit', session_ids: ['vocab_unit_01_a'] }] },
      theory: { theories: [loadTheoryDoc()] }
    }),
    _sessionStates: sessionStates,
    _cards: cards
  };
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
    AudioPlayer: { speak: () => Promise.resolve() },
    App: {
      registerCleanup: () => {},
      navigateToCourse: () => navigateCalls.push('course'),
      navigateToUnitDetail: (unitId) => navigateCalls.push(`unit:${unitId}`),
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

function clickFirstOptionButton(container) {
  const optionsWrap = container.querySelector('.rating-buttons');
  const btn = optionsWrap.querySelectorAll('button')[0];
  btn.click();
  return btn;
}

async function completeOneMultipleChoiceTask(container) {
  // Nimmt IMMER die erste angebotene Option (mal richtig, mal falsch) und klickt danach
  // "Weiter", falls vorhanden (Recognition/Application) — ansonsten wird das direkt vom Aufrufer
  // gehandhabt (Reconstruction/Produktion haben eigene Abläufe).
  clickFirstOptionButton(container);
  await new Promise((r) => setImmediate(r));
}

test('vollständiger Durchlauf der Pilot-Session: Theorie -> Mini-Check -> Wörter -> Erkennen -> Rekonstruieren -> Geführt -> Selbstständig -> Anwendung -> Abschluss', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);

  const container = createDocumentStub().createElement('div');
  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });

  // 1) Theorie ist die ERSTE Phase — kein direkter Zugriff auf Übungen (Akzeptanzkriterium #9).
  assert.ok(container.textContent.includes('Begrüßung und Höflichkeit'), 'Theorietitel sollte sichtbar sein');
  assert.ok(container.textContent.includes('Lernziele'), 'Theorieseite sollte Lernziele zeigen');
  assert.ok(!container.textContent.includes('Aufgabe 1'), 'Direkt am Anfang darf noch keine Abfrage sichtbar sein');

  // 2) Mini-Check innerhalb der Theorie beantworten (3 Fragen, jeweils die erste — teils
  // richtige, teils falsche — Option; das Ergebnis wird nur geloggt, nicht blockierend).
  for (let i = 0; i < 3; i++) {
    const optWrap = container.querySelector('.theory-mini-check .rating-buttons');
    if (!optWrap) break;
    optWrap.querySelectorAll('button')[0].click();
    await new Promise((r) => setTimeout(r, 650));
  }

  // 3) "Session starten" beendet die Theoriephase.
  const startBtn = findButtonByText(container, 'Session starten');
  assert.ok(startBtn, '"Session starten"-Button sollte nach der Theorie vorhanden sein');
  startBtn.click();
  await new Promise((r) => setImmediate(r));

  // 4) Wörter kennenlernen: alle 9 Wörter müssen als Karten sichtbar sein, BEVOR irgendeine
  // Abfrage stattfindet (Akzeptanzkriterium #8/#9).
  assert.equal(container.querySelectorAll('.word-card').length, 9, 'alle 9 neuen Wörter sollten als Lernkarten sichtbar sein');
  const continueToChecks = findButtonByText(container, 'Weiter zu kurzen Erkennungsaufgaben');
  assert.ok(continueToChecks);
  continueToChecks.click();
  await new Promise((r) => setImmediate(r));

  // 5) Drei leichte Mini-Erkennungsaufgaben nach der Wortvorschau.
  for (let i = 0; i < 3; i++) {
    await completeOneMultipleChoiceTask(container);
    const weiter = findButtonByText(container, 'Weiter');
    assert.ok(weiter, `"Weiter"-Button nach Mini-Check ${i + 1} sollte erscheinen (kein Auto-Advance)`);
    weiter.click();
    await new Promise((r) => setImmediate(r));
  }

  // 6) Wiedererkennen-Phase: mindestens 9 Aufgaben (eine je Wort). Da hier IMMER die erste
  // Option geklickt wird (mal richtig, mal falsch), werden falsch beantwortete Wörter über
  // scheduleRepeat() erneut eingereiht — die Phase kann also mehr als 9 Durchläufe brauchen.
  // Wir laufen deshalb, bis die nächste Phase ("Bringe" aus Rekonstruieren) sichtbar wird.
  assert.ok(container.textContent.includes('Aufgabe 1 / 9'), 'Wiedererkennen-Phase sollte mit Aufgabe 1/9 beginnen');
  let recognitionGuard = 0;
  while (!container.textContent.includes('Bringe') && recognitionGuard < 60) {
    recognitionGuard += 1;
    clickFirstOptionButton(container);
    await new Promise((r) => setImmediate(r));
    const weiter = findButtonByText(container, 'Weiter');
    assert.ok(weiter, `"Weiter" nach Wiedererkennen-Aufgabe ${recognitionGuard} erwartet`);
    weiter.click();
    await new Promise((r) => setImmediate(r));
  }
  assert.ok(recognitionGuard > 0 && recognitionGuard < 60, 'Wiedererkennen-Phase sollte innerhalb der Sicherheitsgrenze abgeschlossen worden sein');

  // 7) Rekonstruieren-Phase: Buchstaben/Wörter in der richtigen Reihenfolge anklicken. Auch hier
  // werden nicht zwingend korrekt sortierte Versuche gemacht (uns interessiert der Ablauf, nicht
  // ob jede Aufgabe richtig gelöst wird) — falsch gelöste Aufgaben werden wieder eingereiht, die
  // Phase kann also mehr als 9 Durchläufe brauchen.
  assert.ok(container.textContent.includes('Bringe'), 'Rekonstruieren-Phase sollte begonnen haben');
  let reconstructionGuard = 0;
  while (!container.textContent.includes('Schreibe:') && reconstructionGuard < 60) {
    reconstructionGuard += 1;
    let tileBtn = container.querySelector('.rating-buttons') && container.querySelector('.rating-buttons').querySelectorAll('button')[0];
    while (tileBtn) {
      tileBtn.click();
      tileBtn = container.querySelector('.rating-buttons') && container.querySelector('.rating-buttons').querySelectorAll('button')[0];
    }
    const checkBtn = findButtonByText(container, 'Prüfen');
    assert.ok(checkBtn, `"Prüfen"-Button in Rekonstruieren-Aufgabe ${reconstructionGuard} erwartet`);
    checkBtn.click();
    await new Promise((r) => setImmediate(r));
    const weiter = findButtonByText(container, 'Weiter');
    assert.ok(weiter, `"Weiter" nach Rekonstruieren-Aufgabe ${reconstructionGuard} erwartet`);
    weiter.click();
    await new Promise((r) => setImmediate(r));
  }
  assert.ok(reconstructionGuard > 0 && reconstructionGuard < 60, 'Rekonstruieren-Phase sollte innerhalb der Sicherheitsgrenze abgeschlossen worden sein');

  // 8) Geführte Eingabe: Tippaufgabe mit sichtbarem Hinweis (Wort steht in der Aufgabe).
  let guardCount = 0;
  while (container.textContent.includes('Schreibe:') && guardCount < 20) {
    guardCount += 1;
    const input = container.querySelector('input');
    assert.ok(input, 'Eingabefeld in der Tipp-Aufgabe erwartet');
    // Absichtlich eine falsche Eingabe simulieren, um die Fehlerbehandlung zu testen.
    input.value = 'falsch';
    const checkBtn = findButtonByText(container, 'Prüfen');
    checkBtn.click();
    await new Promise((r) => setImmediate(r));
    const weiter = findButtonByText(container, 'Weiter');
    assert.ok(weiter, 'Manuelles "Weiter" nach der Tipp-Aufgabe erwartet (kein Auto-Advance)');
    weiter.click();
    await new Promise((r) => setImmediate(r));
  }
  assert.ok(guardCount > 0, 'mindestens eine Geführte-Eingabe-Aufgabe sollte durchlaufen worden sein');

  // 9) Selbstständige Eingabe (kein sichtbarer Hinweis mehr) — bis Anwendung/Abschluss erreicht ist.
  let safetyCounter = 0;
  while (!container.textContent.includes('Session abgeschlossen') && !container.textContent.includes('Session beendet') && safetyCounter < 60) {
    safetyCounter += 1;
    const input = container.querySelector('input');
    if (input) {
      input.value = 'falsch';
      const checkBtn = findButtonByText(container, 'Prüfen');
      checkBtn.click();
    } else {
      const optWrap = container.querySelector('.rating-buttons');
      if (optWrap) {
        optWrap.querySelectorAll('button')[0].click();
      }
    }
    await new Promise((r) => setImmediate(r));
    const weiter = findButtonByText(container, 'Weiter');
    if (weiter) {
      weiter.click();
      await new Promise((r) => setImmediate(r));
    }
  }

  // 10) Abschluss erreicht.
  assert.ok(
    container.textContent.includes('Session abgeschlossen') || container.textContent.includes('Session beendet'),
    'Die Session sollte nach allen Phasen im Abschlussbildschirm enden'
  );
  const finishBtn = findButtonByText(container, 'Fertig');
  assert.ok(finishBtn, '"Fertig"-Button im Abschluss erwartet');
});

test('Session-Wiederaufnahme: nach Verlassen mitten in der Wiedererkennen-Phase wird an derselben Stelle fortgesetzt', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');

  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  findButtonByText(container, 'Session starten').click();
  await new Promise((r) => setImmediate(r));
  findButtonByText(container, 'Weiter zu kurzen Erkennungsaufgaben').click();
  await new Promise((r) => setImmediate(r));
  for (let i = 0; i < 3; i++) {
    clickFirstOptionButton(container);
    await new Promise((r) => setImmediate(r));
    findButtonByText(container, 'Weiter').click();
    await new Promise((r) => setImmediate(r));
  }
  // Zwei Aufgaben der Wiedererkennen-Phase lösen, dann "verlassen" (neuer mount() in
  // DEMSELBEN AppState — simuliert einen Neustart der App).
  for (let i = 0; i < 2; i++) {
    clickFirstOptionButton(container);
    await new Promise((r) => setImmediate(r));
    findButtonByText(container, 'Weiter').click();
    await new Promise((r) => setImmediate(r));
  }

  const savedState = fakeAppState.getSessionState('vocab_unit_01_a');
  assert.ok(savedState, 'Session-Zustand sollte gespeichert worden sein');
  assert.equal(savedState.status, 'in_progress');
  assert.ok(savedState.taskIndex >= 2, 'mindestens 2 Aufgaben sollten als erledigt gespeichert sein');
  assert.equal(savedState.theoryDone, true, 'Theoriefortschritt sollte erhalten bleiben');

  // Neuer Mount (wie nach einem Neustart) — MUSS an der gespeicherten Stelle fortsetzen, nicht
  // wieder bei der Theorie beginnen.
  const container2 = createDocumentStub().createElement('div');
  await SessionController.mount(container2, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  assert.ok(!container2.textContent.includes('Lernziele'), 'nach Wiederaufnahme darf NICHT wieder die Theorie gezeigt werden');
  assert.ok(container2.textContent.includes('Aufgabe'), 'nach Wiederaufnahme sollte direkt eine Aufgabe sichtbar sein');
});

test('Theorie ist während der Session jederzeit über "Theorie ansehen" erreichbar, ohne den Fortschritt zu verlieren', async () => {
  const fakeAppState = createFakeAppState();
  const context = buildContext(fakeAppState);
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');

  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });
  findButtonByText(container, 'Session starten').click();
  await new Promise((r) => setImmediate(r));

  const theoryBtn = findButtonByText(container, 'Theorie ansehen');
  assert.ok(theoryBtn, '"Theorie ansehen" sollte auch außerhalb der Theorie-Phase sichtbar sein');
  theoryBtn.click();
  assert.ok(container.textContent.includes('Lernziele'), 'Theorie sollte erneut angezeigt werden');

  const backBtn = findButtonByText(container, 'Zurück zur Übung');
  assert.ok(backBtn, '"Zurück zur Übung" sollte in der Theorie-Ansicht während einer Session erscheinen');
  backBtn.click();
  assert.ok(container.querySelectorAll('.word-card').length > 0, 'nach "Zurück zur Übung" sollte die Wörter-Phase wieder sichtbar sein');
});
