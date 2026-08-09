// Tests für SessionEngine (Entwicklungsauftrag 5, Abschnitte 6-12+26) — reine Ablauflogik ohne
// DOM, geprüft mit SYNTHETISCHEN Session-/Wortdaten (SessionEngine kennt keine echten Inhalte,
// nur Wort-IDs) statt echter Vokabeln.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const PhaseRegistry = require('../../src/js/session/phaseRegistry.js');
const HelpLevel = require('../../src/js/helpLevel.js');
const SessionCoverageTracker = require('../../src/js/session/sessionCoverageTracker.js');
const SessionQueue = require('../../src/js/session/sessionQueue.js');
const RandomProvider = require('../../src/js/session/randomProvider.js');

// sessionEngine.js ist für den gemeinsamen Browser-Skript-Scope geschrieben (referenziert
// PhaseRegistry/HelpLevel/SessionQueue/SessionCoverageTracker als Globals) — hier wie bei den
// anderen reinen Logikmodulen dieses Projekts über `global` bereitgestellt.
global.PhaseRegistry = PhaseRegistry;
global.HelpLevel = HelpLevel;
global.SessionQueue = SessionQueue;
global.SessionCoverageTracker = SessionCoverageTracker;

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
      { type: 'reconstruction' },
      { type: 'guided_production' },
      { type: 'independent_production' },
      { type: 'application' },
      { type: 'summary' }
    ],
    completion_rules: { minimum_score: 0.75, all_words_exposed: true, required_phases: [] },
    ...overrides
  };
}

test('recommendedCount(): entspricht bei 10 Wörtern genau der empfohlenen Verteilung aus Abschnitt 6 (6/5/5/8/4)', () => {
  assert.equal(SessionEngine.recommendedCount('recognition', 10), 6);
  assert.equal(SessionEngine.recommendedCount('reconstruction', 10), 5);
  assert.equal(SessionEngine.recommendedCount('guided_production', 10), 5);
  assert.equal(SessionEngine.recommendedCount('independent_production', 10), 8);
  assert.equal(SessionEngine.recommendedCount('application', 10), 4);
});

test('Summe der Kernaufgaben bei zehn Wörtern liegt im geforderten Bereich (28-38, Abschnitt 6) und erzeugt nicht mehr als 50 Aufgaben', () => {
  const total = ['recognition', 'reconstruction', 'guided_production', 'independent_production', 'application']
    .reduce((sum, phase) => sum + SessionEngine.recommendedCount(phase, 10), 0);
  assert.equal(total, 28, 'Kernaufgaben (ohne Mini-Checks) sollten bei zehn Wörtern 28 betragen');
  assert.ok(total < 50, 'zehn neue Wörter dürfen nicht automatisch mehr als 50 Aufgaben erzeugen');
});

test('Geführte + selbstständige Produktion garantieren gemeinsam die volle Wortabdeckung (Mindestabdeckung, Abschnitt 6)', () => {
  const words = makeWords(10);
  const sessionDef = fullPhasesSessionDef(10);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });

  // Erst Wiedererkennen "durchspielen" (Phase 2), dann geführte Produktion (Phase 4) betreten.
  engine.advancePhase(); // theory -> word_preview
  engine.advancePhase(); // word_preview -> recognition
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) { engine.recordTaskResult(true); }
  engine.advancePhase(); // recognition -> reconstruction
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) { engine.recordTaskResult(true); }
  engine.advancePhase(); // reconstruction -> guided_production
  engine.startGradedQueue();
  const guidedWordIds = new Set();
  while (!engine.isPhaseQueueDone()) { guidedWordIds.add(engine.currentTask().wordId); engine.recordTaskResult(true); }
  engine.advancePhase(); // guided_production -> independent_production
  engine.startGradedQueue();
  const independentWordIds = new Set();
  while (!engine.isPhaseQueueDone()) { independentWordIds.add(engine.currentTask().wordId); engine.recordTaskResult(true); }

  const union = new Set([...guidedWordIds, ...independentWordIds]);
  assert.equal(union.size, 10, 'jedes Wort sollte mindestens einmal in geführter ODER selbstständiger Produktion vorkommen');
  words.forEach((w) => assert.ok(union.has(w.id), `Wort ${w.id} fehlt in beiden Produktionsphasen`));
});

test('Fehlerwiederholung: ein durchgehend falsch beantwortetes Wort wird höchstens 3-mal erneut eingeplant (kein Endlosloop)', () => {
  // Entwicklungsauftrag 7, Abschnitt 4.1: fester Seed statt Math.random() macht den Test
  // deterministisch (zuvor zufallsabhängig grün/rot, siehe ROADMAP) — bei recognition (Ratio 0.6)
  // landen bei 5 Wörtern nur round(5*0.6)=3 davon in der Warteschlange; welche drei das sind, hing
  // vorher vom ungesteuerten Math.random() ab. Mit festem Seed ist das reproduzierbar UND der
  // Test wählt sein "immer falsches" Zielwort bewusst aus der TATSÄCHLICH gebauten Warteschlange
  // (statt anzunehmen, dass words[0] zufällig darin vorkommt) — das behebt die Flakiness an der
  // Wurzel, nicht nur durch Determinismus.
  const words = makeWords(5);
  const sessionDef = fullPhasesSessionDef(5);
  const rng = RandomProvider.create(42).random;
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null, rng });
  engine.advancePhase();
  engine.advancePhase();
  engine.startGradedQueue();

  assert.ok(!engine.isPhaseQueueDone(), 'die Warteschlange sollte nicht leer sein');
  const targetWordId = engine.currentTask().wordId;

  let iterations = 0;
  let targetWordAttempts = 0;
  while (!engine.isPhaseQueueDone() && iterations < 200) {
    iterations += 1;
    const task = engine.currentTask();
    const isCorrect = task.wordId !== targetWordId; // ein Wort bleibt bewusst immer falsch
    if (task.wordId === targetWordId) targetWordAttempts += 1;
    engine.recordTaskResult(isCorrect);
  }
  assert.ok(engine.isPhaseQueueDone(), 'die Phase sollte trotz Dauerfehlern terminieren');
  // 1 ursprünglicher Versuch + höchstens 3 Wiederholungen = höchstens 4 Versuche für dieses Wort.
  assert.ok(targetWordAttempts <= 4, `Wort sollte höchstens 4-mal versucht werden (1 + max. 3 Wiederholungen), war aber ${targetWordAttempts}`);
  assert.ok(targetWordAttempts >= 2, 'mindestens eine Wiederholung sollte stattgefunden haben');
});

test('Fehlerwiederholung ist mit festem Seed über viele Seeds hinweg stabil (Regressionsschutz gegen erneute Flakiness)', () => {
  // Testet dieselbe Logik wie oben, aber über 50 verschiedene Seeds hinweg — stellt sicher, dass
  // die Terminierungs-/Wiederholungsgarantie nicht zufällig nur für Seed 42 zufällig funktioniert.
  for (let seed = 1; seed <= 50; seed += 1) {
    const words = makeWords(5);
    const sessionDef = fullPhasesSessionDef(5);
    const rng = RandomProvider.create(seed).random;
    const engine = SessionEngine.create({ sessionDef, words, resumedState: null, rng });
    engine.advancePhase();
    engine.advancePhase();
    engine.startGradedQueue();
    if (engine.isPhaseQueueDone()) continue; // theoretisch möglich, wenn recommendedCount()=0 wäre
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
  engine.advancePhase();
  engine.advancePhase();
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

test('Gewichtete Bewertung: frühe Fehler in schwach gewichteten Phasen wirken sich weniger stark aus als spätere in stark gewichteten (Abschnitt 26)', () => {
  const words = makeWords(4);
  const sessionDef = fullPhasesSessionDef(4);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });
  engine.advancePhase();
  engine.advancePhase();

  // Wiedererkennen (Gewicht 15%): alle falsch.
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(false);
  engine.advancePhase();
  // Rekonstruieren (Gewicht 15%): alle falsch.
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(false);
  engine.advancePhase();
  // Geführte Produktion (20%): alle richtig.
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  // Selbstständige Produktion (35%, am stärksten gewichtet): alle richtig.
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  engine.advancePhase();
  // Anwendung (15%): alle richtig.
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);

  // 2 von 5 Phasen komplett falsch (30% Gewicht), aber die stärker gewichtete selbstständige
  // Produktion (35%) und die übrigen (20%+15%) sind komplett richtig -> Gesamtwert sollte trotz
  // der frühen Fehler deutlich über einem naiven Durchschnitt liegen.
  const weighted = engine.weightedScorePercent();
  assert.ok(weighted >= 0.65, `gewichteter Score sollte trotz früher formativer Fehler hoch bleiben, war ${weighted}`);
  assert.ok(engine.checkCompletion() === false || weighted >= 0.75, 'checkCompletion() sollte konsistent zum weightedScorePercent() sein');
});

test('allWordsExposed()/isWordExposed(): ein Wort gilt erst als kennengelernt, wenn es SOWOHL gezeigt ALS AUCH aktiv wiedererkannt wurde', () => {
  const words = makeWords(2);
  const sessionDef = fullPhasesSessionDef(2);
  const engine = SessionEngine.create({ sessionDef, words, resumedState: null });

  assert.equal(engine.isWordExposed('word_1'), false);
  engine.markWordPreviewSeen('word_1'); // nur gezeigt, noch nicht erkannt
  assert.equal(engine.isWordExposed('word_1'), false, 'reines Rendern einer Karte darf "exposed" NICHT setzen');
  engine.recordMiniCheckResult('word_1', true); // jetzt auch aktiv erkannt
  assert.equal(engine.isWordExposed('word_1'), true);

  engine.markWordPreviewSeen('word_2');
  engine.recordMiniCheckResult('word_2', false); // auch bei falscher Antwort: wurde versucht
  assert.equal(engine.isWordExposed('word_2'), true);
  assert.equal(engine.allWordsExposed(), true);
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
  engine.advancePhase();
  engine.advancePhase();
  engine.startGradedQueue();
  while (!engine.isPhaseQueueDone()) engine.recordTaskResult(true);
  // Wörter wurden nie über markWordPreviewSeen() "gezeigt" -> allWordsExposed() bleibt false.
  assert.equal(engine.allWordsExposed(), false);
  assert.equal(engine.checkCompletion(), false, 'completion_rules.all_words_exposed sollte hier greifen');
});
