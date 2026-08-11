// Entwicklungsauftrag 16, Abschnitt 17/20 — Tests für SessionEngine.migrateResumedState():
// wandelt einen VOR diesem Auftrag gespeicherten Session-Snapshot (altes Acht-Phasen-Modell,
// kein sessionFlowVersion-Feld) sicher in das neue Sieben-Phasen-Modell um. Reine Datenfunktion,
// kein DOM-Zugriff.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const PhaseRegistry = require('../../src/js/session/phaseRegistry.js');
const HelpLevel = require('../../src/js/helpLevel.js');
const SessionCoverageTracker = require('../../src/js/session/sessionCoverageTracker.js');
const SessionQueue = require('../../src/js/session/sessionQueue.js');

global.PhaseRegistry = PhaseRegistry;
global.HelpLevel = HelpLevel;
global.SessionQueue = SessionQueue;
global.SessionCoverageTracker = SessionCoverageTracker;
global.document = { createElement: () => ({}) };
global.AudioPlayer = { speakWord: () => Promise.resolve({ source: 'recorded_audio' }) };
global.ExerciseRegistry = require('../../src/js/session/exerciseRegistry.js');

const SessionEngine = require('../../src/js/session/sessionEngine.js');

function legacySnapshot(phaseIndex, overrides = {}) {
  return {
    phaseIndex,
    theoryDone: true,
    coverage: {},
    phaseQueues: {},
    phaseScores: {},
    helpLevel: 'C',
    correctCount: 3,
    wrongCount: 1,
    reviewWordIds: [],
    ...overrides
  };
}

test('ein Snapshot ohne sessionFlowVersion (Stand vor Auftrag 16) wird erkannt und migriert', () => {
  const migrated = SessionEngine.migrateResumedState(legacySnapshot(2));
  assert.equal(migrated.sessionFlowVersion, SessionEngine.CURRENT_SESSION_FLOW_VERSION);
});

test('ein bereits aktuelles Snapshot (sessionFlowVersion:2) bleibt unverändert (idempotent, keine unnötige Kopie)', () => {
  const current = { ...legacySnapshot(4), sessionFlowVersion: SessionEngine.CURRENT_SESSION_FLOW_VERSION };
  const migrated = SessionEngine.migrateResumedState(current);
  assert.equal(migrated, current, 'sollte dasselbe Objekt zurückgeben, keine unnötige Migration');
});

test('null/undefined werden unverändert durchgereicht, kein Absturz', () => {
  assert.equal(SessionEngine.migrateResumedState(null), null);
  assert.equal(SessionEngine.migrateResumedState(undefined), undefined);
});

test('alte Stufen 1-5 (theory=0, word_preview=1) bleiben unverändert -- phaseIndex hatte hier schon immer dieselbe Bedeutung', () => {
  assert.equal(SessionEngine.migrateResumedState(legacySnapshot(0)).phaseIndex, 0);
  assert.equal(SessionEngine.migrateResumedState(legacySnapshot(1)).phaseIndex, 1);
});

test('alte Recognition-Phase (Index 2) bleibt auf Index 2 -- zufällig identisch in beiden Modellen', () => {
  assert.equal(SessionEngine.migrateResumedState(legacySnapshot(2)).phaseIndex, 2);
});

test('alte Reconstruction-Phase (Index 3) wird auf Stufe 8 "guided_writing" (neuer Index 4) abgebildet (Abschnitt 17)', () => {
  const migrated = SessionEngine.migrateResumedState(legacySnapshot(3));
  assert.equal(migrated.phaseIndex, 4);
});

test('alte Guided-Production-Phase (Index 4) wird ebenfalls auf "guided_writing" (neuer Index 4) abgebildet', () => {
  const migrated = SessionEngine.migrateResumedState(legacySnapshot(4));
  assert.equal(migrated.phaseIndex, 4);
});

test('alte Independent-Production-Phase (Index 5) wird auf "independent_writing" (neuer Index 5) abgebildet', () => {
  const migrated = SessionEngine.migrateResumedState(legacySnapshot(5));
  assert.equal(migrated.phaseIndex, 5);
});

test('alte Application-Phase (Index 6): kein Rücksprung auf Stufe 7 -- landet direkt bei "summary" (Abschnitt 17, Sonderfall)', () => {
  const migrated = SessionEngine.migrateResumedState(legacySnapshot(6));
  assert.equal(migrated.phaseIndex, 6, 'neuer Index für summary');
});

test('alte abgeschlossene Session (Index 7, "summary") bleibt bei "summary" (neuer Index 6)', () => {
  const migrated = SessionEngine.migrateResumedState(legacySnapshot(7));
  assert.equal(migrated.phaseIndex, 6);
});

test('die alte offene Warteschlange der Reconstruction-Phase wird unter "guided_writing" weitergeführt und als Teil "order_pieces" gekennzeichnet', () => {
  const oldQueue = SessionQueue.create([{ wordId: 'w1' }, { wordId: 'w2' }]);
  const raw = legacySnapshot(3, { phaseQueues: { reconstruction: oldQueue } });
  const migrated = SessionEngine.migrateResumedState(raw);
  assert.ok(migrated.phaseQueues.guided_writing, 'die Warteschlange sollte unter dem neuen Namen auffindbar sein');
  assert.equal(migrated.phaseQueues.guided_writing.pending.length, 2);
  for (const item of migrated.phaseQueues.guided_writing.pending) {
    assert.equal(item.part, 'order_pieces');
    assert.equal(item.exerciseType, 'order_pieces');
  }
});

test('die alte offene Warteschlange der Guided-Production-Phase wird als Teil "guided_typing" gekennzeichnet', () => {
  const oldQueue = SessionQueue.create([{ wordId: 'w1' }]);
  const raw = legacySnapshot(4, { phaseQueues: { guided_production: oldQueue } });
  const migrated = SessionEngine.migrateResumedState(raw);
  assert.equal(migrated.phaseQueues.guided_writing.pending[0].part, 'guided_typing');
  assert.equal(migrated.phaseQueues.guided_writing.pending[0].exerciseType, 'guided_typing');
});

test('die alte offene Warteschlange der Independent-Production-Phase wird unter "independent_writing" weitergeführt', () => {
  const oldQueue = SessionQueue.create([{ wordId: 'w1' }]);
  const raw = legacySnapshot(5, { phaseQueues: { independent_production: oldQueue } });
  const migrated = SessionEngine.migrateResumedState(raw);
  assert.ok(migrated.phaseQueues.independent_writing);
  assert.equal(migrated.phaseQueues.independent_writing.pending[0].exerciseType, 'independent_typing');
});

test('alte phaseScores werden unter dem neuen Phasennamen weitergeführt (Bewertung bleibt erhalten)', () => {
  const raw = legacySnapshot(3, { phaseScores: { reconstruction: { correct: 4, attempted: 5 } } });
  const migrated = SessionEngine.migrateResumedState(raw);
  assert.deepEqual(migrated.phaseScores.guided_writing, { correct: 4, attempted: 5 });
});

test('abgeschlossene Sessions bleiben abgeschlossen: status wird von der Migration nicht verändert', () => {
  const raw = legacySnapshot(7, { status: 'completed' });
  const migrated = SessionEngine.migrateResumedState(raw);
  assert.equal(migrated.status, 'completed');
});

test('die Migration erzeugt eine KOPIE, verändert das ursprüngliche Objekt nicht (keine stillschweigende Mutation gespeicherter Daten vor dem Speichern)', () => {
  const raw = legacySnapshot(3);
  const before = JSON.parse(JSON.stringify(raw));
  SessionEngine.migrateResumedState(raw);
  assert.deepEqual(raw, before);
});

// --- End-zu-Ende: eine migrierte Session lässt sich tatsächlich mit SessionEngine.create() weiterverwenden ---
function fullPhasesSessionDef(n) {
  return {
    session_id: 'test_session',
    new_word_ids: Array.from({ length: n }, (_, i) => `w${i + 1}`),
    phases: [
      { type: 'theory', required_first_time: true },
      { type: 'word_preview' },
      { type: 'recognition' },
      { type: 'matching' },
      { type: 'guided_writing' },
      { type: 'independent_writing' },
      { type: 'summary' }
    ],
    completion_rules: { minimum_score: 0.75, all_words_exposed: true, required_phases: [] }
  };
}

test('End-zu-Ende: eine migrierte Reconstruction-Session landet über SessionEngine.create() tatsächlich in "guided_writing"', () => {
  const words = Array.from({ length: 3 }, (_, i) => ({ id: `w${i + 1}` }));
  const oldQueue = SessionQueue.create(words.map((w) => ({ wordId: w.id })));
  const raw = legacySnapshot(3, { phaseQueues: { reconstruction: oldQueue }, coverage: {} });
  const migrated = SessionEngine.migrateResumedState(raw);
  const engine = SessionEngine.create({ sessionDef: fullPhasesSessionDef(3), words, resumedState: migrated });
  assert.equal(engine.currentPhaseType(), 'guided_writing');
  assert.ok(engine.hasStartedQueue(), 'die migrierte Warteschlange sollte bereits als gestartet gelten (keine erneute Zufallsmischung)');
});
