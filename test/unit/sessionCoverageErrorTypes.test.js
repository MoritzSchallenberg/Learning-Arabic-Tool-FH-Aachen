// Tests für Entwicklungsauftrag 17, Abschnitt 17 — Fehlertypen in SessionCoverageTracker
// (src/js/session/sessionCoverageTracker.js). Reines CommonJS-Modul, direkt requirebar.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const SessionCoverageTracker = require('../../src/js/session/sessionCoverageTracker.js');

test('createEmpty() liefert ein errorTypes-Feld mit allen sechs Kategorien auf 0', () => {
  const entry = SessionCoverageTracker.createEmpty();
  assert.deepEqual(JSON.parse(JSON.stringify(entry.errorTypes)), { spelling: 0, diacritics: 0, meaning: 0, confusion: 0, matching: 0, empty: 0 });
});

test('recordErrorType erhöht genau den angegebenen Fehlertyp', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'spelling');
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'spelling');
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'diacritics');
  const entry = SessionCoverageTracker.entryFor(coverage, 'w1');
  assert.equal(entry.errorTypes.spelling, 2);
  assert.equal(entry.errorTypes.diacritics, 1);
  assert.equal(entry.errorTypes.meaning, 0);
});

test('recordErrorType(null) verändert nichts (kein Fehler)', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', null);
  const entry = SessionCoverageTracker.entryFor(coverage, 'w1');
  assert.equal(Object.values(entry.errorTypes).every((v) => v === 0), true);
});

test('unbekannter Fehlertyp wird ignoriert statt einen falschen Zähler zu erhöhen', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'unbekannt');
  const entry = SessionCoverageTracker.entryFor(coverage, 'w1');
  assert.equal(Object.values(entry.errorTypes).every((v) => v === 0), true);
});

// --- Migration alter, gespeicherter Coverage-Einträge ohne errorTypes-Feld (Abschnitt 17.3) ----

test('ein alter, wiederaufgenommener Eintrag OHNE errorTypes-Feld wird beim Zusammenführen sicher ergänzt', () => {
  const legacyEntry = { preview_seen: true, recognition_attempts: 2, recognition_correct: 1, matching_attempts: 0, matching_correct: 0, guided_writing_attempts: 0, independent_writing_attempts: 0, errors: 1, help_used: false, known_already: false };
  const coverage = SessionCoverageTracker.create(['w1'], { w1: legacyEntry });
  const entry = SessionCoverageTracker.entryFor(coverage, 'w1');
  assert.ok(entry.errorTypes, 'errorTypes sollte durch den Merge-Default ergänzt worden sein');
  assert.equal(entry.errorTypes.spelling, 0);
});

test('recordErrorType ist auch bei einem (hypothetisch) noch fehlenden errorTypes-Feld migrationssicher', () => {
  const coverage = { w1: { preview_seen: true, recognition_attempts: 0, recognition_correct: 0, matching_attempts: 0, matching_correct: 0, guided_writing_attempts: 0, independent_writing_attempts: 0, errors: 0, help_used: false, known_already: false } };
  delete coverage.w1.errorTypes;
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'meaning');
  assert.equal(coverage.w1.errorTypes.meaning, 1);
});

// --- dominantErrorType + phasenbewusste Priorisierung (Abschnitt 17.1) -------------------------

test('dominantErrorType liefert den häufigsten Fehlertyp, oder null ohne Fehler', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  assert.equal(SessionCoverageTracker.dominantErrorType(coverage, 'w1'), null);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'spelling');
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'spelling');
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'meaning');
  assert.equal(SessionCoverageTracker.dominantErrorType(coverage, 'w1'), 'spelling');
});

test('priorityScoreForPhase erhöht die Priorität für phasenrelevante Fehlertypen (Bedeutungsfehler -> Wiedererkennen/Zuordnung)', () => {
  const coverage = SessionCoverageTracker.create(['w1', 'w2']);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'meaning');
  const scoreRecognitionWithError = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w1', 'recognition');
  const scoreRecognitionNoError = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w2', 'recognition');
  assert.ok(scoreRecognitionWithError > scoreRecognitionNoError, 'Bedeutungsfehler sollte Wiedererkennen priorisieren');
});

test('priorityScoreForPhase: Schreibfehler priorisieren geführte/freie Eingabe, NICHT Wiedererkennen', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'spelling');
  const scoreWriting = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w1', 'guided_writing');
  const scoreRecognition = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w1', 'recognition');
  assert.ok(scoreWriting > scoreRecognition);
});

test('priorityScoreForPhase: Vokalisierungsfehler priorisieren eine spätere Schreibaufgabe', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'diacritics');
  const scoreWriting = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w1', 'independent_writing');
  const scoreMatching = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w1', 'matching');
  assert.ok(scoreWriting > scoreMatching);
});

test('priorityScoreForPhase: Verwechslungsfehler priorisieren eine spätere Zuordnung (Gegenüberstellung)', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'confusion');
  const scoreMatching = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w1', 'matching');
  const scoreWriting = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w1', 'independent_writing');
  assert.ok(scoreMatching > scoreWriting);
});

test('leere Antwort zählt zusätzlich als fehlender Abrufversuch -- normale priorityScore() bleibt davon erhöht (via errors)', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  SessionCoverageTracker.recordAttempt(coverage, 'w1', 'recognition', false);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'empty');
  const entry = SessionCoverageTracker.entryFor(coverage, 'w1');
  assert.equal(entry.errors, 1);
  assert.equal(entry.errorTypes.empty, 1);
});

test('ohne phaseType bleibt priorityScoreForPhase() ohne jede Fehlertyp-Anpassung nicht anwendbar -- priorityScore() bleibt die alte, phasenunabhängige Basis', () => {
  const coverage = SessionCoverageTracker.create(['w1']);
  SessionCoverageTracker.recordErrorType(coverage, 'w1', 'meaning');
  const base = SessionCoverageTracker.priorityScore(coverage, 'w1');
  const forIrrelevantPhase = SessionCoverageTracker.priorityScoreForPhase(coverage, 'w1', 'guided_writing');
  assert.equal(base, forIrrelevantPhase, 'meaning-Fehler boostet guided_writing nicht');
});
