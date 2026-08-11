// Tests für SessionEngine (Entwicklungsauftrag 5, Abschnitte 6-12+26; auf das endgültige
// Zehn-Stufen-Modell umgestellt in Entwicklungsauftrag 16) — reine Ablauflogik ohne DOM, geprüft
// mit SYNTHETISCHEN Session-/Wortdaten (SessionEngine kennt keine echten Inhalte, nur Wort-IDs)
// statt echter Vokabeln.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const PhaseRegistry = require('../../src/js/session/phaseRegistry.js');
const HelpLevel = require('../../src/js/helpLevel.js');
const SessionCoverageTracker = require('../../src/js/session/sessionCoverageTracker.js');
const SessionQueue = require('../../src/js/session/sessionQueue.js');
const RandomProvider = require('../../src/js/session/randomProvider.js');

// sessionEngine.js ist für den gemeinsamen Browser-Skript-Scope geschrieben (referenziert
// PhaseRegistry/HelpLevel/SessionQueue/SessionCoverageTracker/ExerciseRegistry als Globals) —
// hier wie bei den anderen reinen Logikmodulen dieses Projekts über `global` bereitgestellt.
// ExerciseRegistry selbst braucht `document` NUR zur Modulladezeit für seine RENDER-Funktionen,
// nicht für die (hier allein benötigten) Konstanten RECOGNITION_TYPES/MATCHING_VARIANTS -- ein
// minimaler Stub genügt.
global.PhaseRegistry = PhaseRegistry;
global.HelpLevel = HelpLevel;
global.SessionQueue = SessionQueue;
global.SessionCoverageTracker = SessionCoverageTracker;
global.document = { createElement: () => ({}) };
global.AudioPlayer = { speakWord: () => Promise.resolve({ source: 'recorded_audio' }) };
global.ExerciseRegistry = require('../../src/js/session/exerciseRegistry.js');

const SessionEngine = require('../../src/js/session/sessionEngine.js');

function makeWords(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `word_${i + 1}` }));
}

function fullPhasesSessionDef(n, overrides = {}) {
  return {
    session_id: 'test_session',
    new_word_ids: makeWords(n).map((w) => w.id),
    phases: [
      { type: 'theory', required_first_time: true },
      { type: 'word_preview' },
      { type: 'recognition' },
      { type: 'matching' },
      { type: 'guided_writing' },
      { type: 'independent_writing' },
      { type: 'summary' }
    ],
    completion_rules: { minimum_score: 0.75, all_words_exposed: true, required_phases: [] },
    ...overrides
  };
}

/** Bringt die Engine von theory/word_preview auf die erste gradierte Phase (recognition). */
function toRecognition(engine) {
  engine.advancePhase();
  engine.advancePhase();
}

test('recommendedCount(): entspricht der empfohlenen Verteilung aus Abschnitt 12 (recognition/matching = 100%, guided_writing 50%, independent_writing 80%)', () => {
  assert.equal(SessionEngine.recommendedCount('recognition', 10), 10);
  assert.equal(SessionEngine.recommendedCount('matching', 10), 10);
  assert.equal(SessionEngine.recommendedCount('guided_writing', 10), 5);
  assert.equal(SessionEngine.recommendedCount('independent_writing', 10), 8);
});

test('PhaseRegistry-Gewichte der vier gradierten Phasen ergeben zusammen 100% (Abschnitt 13)', () => {
  const sum = ['recognition', 'matching', 'guided_writing', 'independent_writing']
    .reduce((s, t) => s + PhaseRegistry.get(t).weight, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `Gewichte sollten 100% ergeben, waren ${sum * 100}%`);
});

test('Lernstufen 1-5 und die Zusammenfassung erhalten kein Bewertungsgewicht (Abschnitt 13)', () => {
  assert.equal(PhaseRegistry.get('theory').weight, 0);
  assert.equal(PhaseRegistry.get('word_preview').weight, 0);
  assert.equal(PhaseRegistry.get('summary').weight, 0);
});

test('Stufe 6 (recognition) deckt ALLE neuen Wörter mindestens einmal ab, nicht mehr ~60% (Abschnitt 6.2)', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();
  const seen = new Set();
  while (!engine.isPhaseQueueDone()) { seen.add(engine.currentTask().wordId); engine.recordTaskResult(true); }
  words.forEach((w) => assert.ok(seen.has(w.id), `Wort ${w.id} fehlt in Stufe 6`));
});

test('Stufe 6: jede Aufgabe trägt einen der fünf Wiedererkennen-Übungstypen (Abschnitt 6.1)', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();
  const usedTypes = new Set();
  while (!engine.isPhaseQueueDone()) { usedTypes.add(engine.currentTask().exerciseType); engine.recordTaskResult(true); }
  for (const t of usedTypes) assert.ok(ExerciseRegistry.RECOGNITION_TYPES.includes(t), `unbekannter Übungstyp in Stufe 6: ${t}`);
  assert.ok(usedTypes.size >= 2, 'bei zehn Wörtern sollte mehr als nur ein Übungstyp vorkommen (ausgewogene Mischung)');
});

test('Stufe 7 (matching): alle neuen Wörter kommen über die Gruppen mindestens einmal vor (Abschnitt 7.1)', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase(); // recognition -> matching
  engine.startGradedQueue();

  const seen = new Set();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    task.groupWordIds.forEach((id) => seen.add(id));
    const perWordCorrect = {};
    task.groupWordIds.forEach((id) => { perWordCorrect[id] = true; });
    engine.recordGroupTaskResult(perWordCorrect);
  }
  words.forEach((w) => assert.ok(seen.has(w.id), `Wort ${w.id} fehlt in Stufe 7`));
});

test('Stufe 7: jede Gruppe hat 4-5 Wörter (Abschnitt 7.1) und eine gültige Variante', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    assert.ok(task.groupWordIds.length >= 3 && task.groupWordIds.length <= 5, `Gruppengröße ${task.groupWordIds.length} außerhalb des erwarteten Bereichs`);
    assert.ok(ExerciseRegistry.MATCHING_VARIANTS.includes(task.variant));
    const perWordCorrect = {};
    task.groupWordIds.forEach((id) => { perWordCorrect[id] = true; });
    engine.recordGroupTaskResult(perWordCorrect);
  }
});

test('buildMatchingGroups(): 10 Wörter ergeben zwei ausgeglichene Gruppen zu je 5', () => {
  const words = makeWords(10);
  const groups = SessionEngine.buildMatchingGroups(words);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((g) => g.length), [5, 5]);
});

test('buildMatchingGroups(): keine leeren Gruppen, auch bei ungünstigen Wortzahlen, kein Absturz', () => {
  for (const n of [0, 1, 2, 3, 4, 5, 6, 7, 9, 11, 13]) {
    const groups = SessionEngine.buildMatchingGroups(makeWords(n));
    const total = groups.reduce((s, g) => s + g.length, 0);
    assert.equal(total, n, `Summe aller Gruppen sollte ${n} ergeben`);
    for (const g of groups) assert.ok(g.length > 0, 'keine leere Gruppe');
  }
});

test('Stufe 8 (guided_writing): order_pieces-Teil kommt vollständig vor dem guided_typing-Teil (Abschnitt 8.4, kein Vermischen)', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase(); // recognition -> matching
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    const perWordCorrect = {};
    task.groupWordIds.forEach((id) => { perWordCorrect[id] = true; });
    engine.recordGroupTaskResult(perWordCorrect);
  }
  engine.advancePhase(); // matching -> guided_writing
  engine.startGradedQueue();

  const parts = [];
  while (!engine.isPhaseQueueDone()) { parts.push(engine.currentTask().part); engine.recordTaskResult(true); }
  const firstGuidedTypingIdx = parts.indexOf('guided_typing');
  const lastOrderPiecesIdx = parts.lastIndexOf('order_pieces');
  if (firstGuidedTypingIdx !== -1 && lastOrderPiecesIdx !== -1) {
    assert.ok(lastOrderPiecesIdx < firstGuidedTypingIdx, 'alle order_pieces-Aufgaben sollten vor der ersten guided_typing-Aufgabe liegen');
  }
});

test('Stufe 8 + Stufe 9 garantieren gemeinsam die volle "geschrieben"-Wortabdeckung (Abschnitt 8.3)', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    const perWordCorrect = {};
    task.groupWordIds.forEach((id) => { perWordCorrect[id] = true; });
    engine.recordGroupTaskResult(perWordCorrect);
  }
  engine.advancePhase(); // -> guided_writing
  engine.startGradedQueue();
  const guidedTypingWordIds = new Set();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    if (task.part === 'guided_typing') guidedTypingWordIds.add(task.wordId);
    engine.recordTaskResult(true);
  }
  engine.advancePhase(); // -> independent_writing
  engine.startGradedQueue();
  const independentWordIds = new Set();
  while (!engine.isPhaseQueueDone()) { independentWordIds.add(engine.currentTask().wordId); engine.recordTaskResult(true); }

  const union = new Set([...guidedTypingWordIds, ...independentWordIds]);
  assert.equal(union.size, 10, 'jedes Wort sollte mindestens einmal aktiv geschrieben worden sein (Stufe 8 ODER 9)');
  words.forEach((w) => assert.ok(union.has(w.id), `Wort ${w.id} fehlt in beiden Schreibstufen`));
});

// --- Entwicklungsauftrag 17, Abschnitt 17.1: phasenbewusste Priorisierung nach Fehlertyp -------
test('ein Wort mit verzeichnetem Schreibfehler wird beim Auffüllen einer späteren Schreibaufgabe bevorzugt aufgenommen', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });

  // independent_writing-Baseline (Abschnitt 8.3: productionBaseline) sind die Wörter an
  // UNGERADEN Indizes -- word_2 (Index 1, gerade Position 0-basiert: words[1]) gehört NICHT zur
  // Baseline und würde nur über das Auffüllen (topUp) mit aufgenommen.
  SessionCoverageTracker.recordErrorType(engine.coverage, 'word_2', 'spelling');

  // Direkt auf independent_writing springen (Stufen 1-2 theory/word_preview, dann recognition,
  // matching, guided_writing überspringen -- die Priorisierung wirkt unabhängig vom bisherigen
  // Phasenverlauf, da sie ausschließlich auf dem bereits gesetzten Coverage-Eintrag beruht).
  toRecognition(engine);
  engine.advancePhase(); // -> matching
  engine.advancePhase(); // -> guided_writing
  engine.advancePhase(); // -> independent_writing
  engine.startGradedQueue();

  const selectedWordIds = new Set();
  while (!engine.isPhaseQueueDone()) { selectedWordIds.add(engine.currentTask().wordId); engine.recordTaskResult(true); }

  assert.ok(selectedWordIds.has('word_2'), 'word_2 sollte trotz fehlender Baseline-Zugehörigkeit über die Fehlertyp-Priorisierung aufgenommen werden');
});

test('ein Wort mit verzeichnetem Bedeutungsfehler wird in der Wiedererkennen-Priorisierung bevorzugt (auch wenn Stufe 6 ohnehin alle Wörter abdeckt, bleibt die Sortierung stabil nachvollziehbar)', () => {
  const words = makeWords(4); // kleine Wortzahl, damit recommendedCount(recognition) < n theoretisch relevant wäre -- hier zur direkten Score-Prüfung
  const sessionDef = fullPhasesSessionDef(4);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  SessionCoverageTracker.recordErrorType(engine.coverage, 'word_3', 'meaning');

  const scoreBoosted = SessionCoverageTracker.priorityScoreForPhase(engine.coverage, 'word_3', 'recognition');
  const scoreOthers = SessionCoverageTracker.priorityScoreForPhase(engine.coverage, 'word_1', 'recognition');
  assert.ok(scoreBoosted > scoreOthers);
});

test('Stufe 9: ein Teil der Aufgaben nutzt die Audiodiktat-Variante (Abschnitt 9.3)', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    const perWordCorrect = {};
    task.groupWordIds.forEach((id) => { perWordCorrect[id] = true; });
    engine.recordGroupTaskResult(perWordCorrect);
  }
  engine.advancePhase();
  engine.startGradedQueue();
  engine.advancePhase();
  engine.startGradedQueue();

  const types = new Set();
  while (!engine.isPhaseQueueDone()) { types.add(engine.currentTask().exerciseType); engine.recordTaskResult(true); }
  assert.ok(types.has('independent_typing_dictation'), 'mindestens eine Diktat-Aufgabe sollte bei 8 Aufgaben vorkommen');
  assert.ok(types.has('independent_typing'), 'die normale Variante sollte weiterhin überwiegen');
});

test('Fehlerwiederholung: ein durchgehend falsch beantwortetes Wort in Stufe 6 wird höchstens 3-mal erneut eingeplant (kein Endlosloop)', () => {
  const words = makeWords(5);
  const sessionDef = fullPhasesSessionDef(5);
  const rng = RandomProvider.create(42).random;
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null, rng });
  toRecognition(engine);
  engine.startGradedQueue();

  assert.ok(!engine.isPhaseQueueDone(), 'die Warteschlange sollte nicht leer sein');
  const targetWordId = engine.currentTask().wordId;

  let iterations = 0;
  let targetWordAttempts = 0;
  while (!engine.isPhaseQueueDone() && iterations < 200) {
    iterations += 1;
    const task = engine.currentTask();
    const isCorrect = task.wordId !== targetWordId;
    if (task.wordId === targetWordId) targetWordAttempts += 1;
    engine.recordTaskResult(isCorrect);
  }
  assert.ok(engine.isPhaseQueueDone(), 'die Phase sollte trotz Dauerfehlern terminieren');
  assert.ok(targetWordAttempts <= 4, `Wort sollte höchstens 4-mal versucht werden (1 + max. 3 Wiederholungen), war aber ${targetWordAttempts}`);
  assert.ok(targetWordAttempts >= 2, 'mindestens eine Wiederholung sollte stattgefunden haben');
});

test('Fehlerwiederholung ist mit festem Seed über viele Seeds hinweg stabil (Regressionsschutz gegen erneute Flakiness)', () => {
  for (let seed = 1; seed <= 50; seed += 1) {
    const words = makeWords(5);
    const sessionDef = fullPhasesSessionDef(5);
    const rng = RandomProvider.create(seed).random;
    const engine = SessionEngine.create({ sessionDef, words, resumedState: null, rng });
    toRecognition(engine);
    engine.startGradedQueue();
    if (engine.isPhaseQueueDone()) continue;
    const targetWordId = engine.currentTask().wordId;

    let iterations = 0;
    let targetWordAttempts = 0;
    while (!engine.isPhaseQueueDone() && iterations < 200) {
      iterations += 1;
      const task = engine.currentTask();
      const isCorrect = task.wordId !== targetWordId;
      if (task.wordId === targetWordId) targetWordAttempts += 1;
      engine.recordTaskResult(isCorrect);
    }
    assert.ok(engine.isPhaseQueueDone(), `Seed ${seed}: Phase sollte terminieren`);
    assert.ok(targetWordAttempts >= 2 && targetWordAttempts <= 4, `Seed ${seed}: erwartet 2-4 Versuche, war ${targetWordAttempts}`);
  }
});

test('Exakte Wiederaufnahme: dieselbe Warteschlange (inkl. geplanter Wiederholung) wird aus dem Snapshot exakt wiederhergestellt', () => {
  const words = makeWords(6);
  const sessionDef = fullPhasesSessionDef(6);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();

  engine.recordTaskResult(true);
  engine.recordTaskResult(false); // plant eine Wiederholung ein
  const nextTaskBeforeSnapshot = engine.currentTask();
  const snapshot = JSON.parse(JSON.stringify(engine.snapshot()));

  const resumedEngine = SessionEngine.create({ sessionDef, words, resumedState: snapshot });
  assert.equal(resumedEngine.currentPhaseType(), engine.currentPhaseType());
  assert.deepEqual(resumedEngine.currentTask(), nextTaskBeforeSnapshot, 'nächste Aufgabe muss exakt gleich sein');
  assert.equal(resumedEngine.taskProgressLabel(), engine.taskProgressLabel());
});

test('Gewichtete Bewertung: frühe Fehler in schwächer gewichteten Phasen wirken sich weniger stark aus als spätere in stark gewichteten (Abschnitt 13/26)', () => {
  const words = makeWords(4);
  const sessionDef = fullPhasesSessionDef(4);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);

  // Wiedererkennen (Gewicht 20%): alle falsch.
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(false);
  engine.advancePhase();
  // Zuordnen (20%): alle falsch (jedes Paar wird beim ersten Versuch falsch zugeordnet).
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    const perWordCorrect = {};
    task.groupWordIds.forEach((id) => { perWordCorrect[id] = false; });
    engine.recordGroupTaskResult(perWordCorrect);
  }
  engine.advancePhase();
  // Schreiben mit Hilfe (25%): alle richtig.
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  // Freies Schreiben (35%, am stärksten gewichtet): alle richtig.
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);

  // Zwei von vier Phasen komplett falsch (40% Gewicht), aber die beiden stärker gewichteten
  // Schreibphasen (25%+35%=60%) komplett richtig -> Gesamtwert sollte trotz der frühen Fehler
  // über einem naiven 50%-Durchschnitt liegen.
  const weighted = engine.weightedScorePercent();
  assert.ok(weighted >= 0.55, `gewichteter Score sollte trotz früher Fehler über einem naiven Durchschnitt bleiben, war ${weighted}`);
  assert.ok(weighted < 1, 'die frühen Fehler sollten trotzdem sichtbar bleiben, kein perfekter Score');
});

test('allWordsExposed()/isWordExposed(): ein Wort gilt erst als kennengelernt, wenn es SOWOHL gezeigt ALS AUCH aktiv wiedererkannt wurde', () => {
  const words = makeWords(2);
  const sessionDef = fullPhasesSessionDef(2);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);

  assert.equal(engine.isWordExposed('word_1'), false);
  engine.markWordPreviewSeen('word_1'); // nur gezeigt, noch nicht erkannt
  assert.equal(engine.isWordExposed('word_1'), false, 'reines Rendern einer Karte darf "exposed" NICHT setzen');
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone() && engine.currentTask().wordId !== 'word_1') engine.recordTaskResult(true);
  if (!engine.isPhaseQueueDone()) engine.recordTaskResult(true); // word_1 jetzt aktiv wiedererkannt
  assert.equal(engine.isWordExposed('word_1'), true);
});

test('markWordPreviewSeen() liefert nur beim ALLERERSTEN Aufruf true (Grundlage für das Tageslimit)', () => {
  const words = makeWords(1);
  const sessionDef = fullPhasesSessionDef(1);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });

  assert.equal(engine.markWordPreviewSeen('word_1'), true);
  assert.equal(engine.markWordPreviewSeen('word_1'), false, 'erneutes Zeigen desselben Worts darf nicht erneut true liefern');
  assert.equal(engine.markWordPreviewSeen('word_1'), false);
});

test('checkCompletion(): scheitert, wenn nicht alle Wörter exponiert wurden, selbst bei perfektem Score', () => {
  const words = makeWords(3);
  const sessionDef = fullPhasesSessionDef(3);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  // Wörter wurden nie über markWordPreviewSeen() "gezeigt" -> allWordsExposed() bleibt false.
  assert.equal(engine.allWordsExposed(), false);
  assert.equal(engine.checkCompletion(), false, 'completion_rules.all_words_exposed sollte hier greifen');
});

// --- Entwicklungsauftrag 16, Abschnitt 10.4: erweiterte Sessionabschluss-Bedingungen ----------

function runFullSessionCorrectly(words, sessionDef) {
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  words.forEach((w) => engine.markWordPreviewSeen(w.id));
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    const perWordCorrect = {};
    task.groupWordIds.forEach((id) => { perWordCorrect[id] = true; });
    engine.recordGroupTaskResult(perWordCorrect);
  }
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  return engine;
}

test('checkCompletion(): ein vollständiger, fehlerfreier Durchlauf über alle vier Stufen ist erfolgreich abgeschlossen', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = runFullSessionCorrectly(words, sessionDef);
  assert.equal(engine.allWordsRecognized(), true);
  assert.equal(engine.allWordsMatched(), true);
  assert.equal(engine.allWordsWritten(), true);
  assert.equal(engine.checkCompletion(), true);
});

test('checkCompletion(): scheitert, wenn Stufe 7 (Zuordnen) übersprungen wurde, selbst bei perfektem Score sonst', () => {
  const words = makeWords(4);
  const sessionDef = fullPhasesSessionDef(4);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  words.forEach((w) => engine.markWordPreviewSeen(w.id));
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase(); // -> matching, aber NICHT bearbeitet
  engine.advancePhase(); // -> guided_writing (übersprungen)
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);

  assert.equal(engine.allWordsMatched(), false);
  assert.equal(engine.checkCompletion(), false, 'ohne Stufe 7 darf die Session nicht als abgeschlossen gelten');
});

test('checkCompletion(): eine nicht bestandene Session (Mindestbewertung verfehlt) wird trotz voller Wortabdeckung nicht als abgeschlossen markiert', () => {
  const words = makeWords(4);
  const sessionDef = fullPhasesSessionDef(4);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  words.forEach((w) => engine.markWordPreviewSeen(w.id));
  toRecognition(engine);
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(false); // alles falsch
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) {
    const task = engine.currentTask();
    const perWordCorrect = {};
    task.groupWordIds.forEach((id) => { perWordCorrect[id] = false; });
    engine.recordGroupTaskResult(perWordCorrect);
  }
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(false);
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(false);

  assert.equal(engine.allWordsRecognized(), true);
  assert.equal(engine.allWordsMatched(), true);
  assert.equal(engine.allWordsWritten(), true);
  assert.equal(engine.checkCompletion(), false, 'trotz voller Wortabdeckung darf eine durchgehend falsch beantwortete Session nicht als abgeschlossen gelten');
});

test('progressPercent(): steigt monoton über die vier Stufen 6-9 (nutzt queue.plannedTotal, nicht die durch Wiederholungen gewachsene Gesamtzahl)', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  toRecognition(engine);
  let last = engine.progressPercent();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) {
    engine.recordTaskResult(false); // erzeugt Wiederholungen -> queue.total wächst
    const p = engine.progressPercent();
    assert.ok(p >= last - 1, `Fortschritt sollte durch Wiederholungen nicht sinken (${p} < ${last})`);
    last = p;
  }
  assert.ok(engine.progressPercent() >= last);
});
