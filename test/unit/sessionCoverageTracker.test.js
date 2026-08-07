// Tests für SessionCoverageTracker (Entwicklungsauftrag 5, Abschnitt 7).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const SessionCoverageTracker = require('../../src/js/session/sessionCoverageTracker.js');

test('create() legt für jede Wort-ID einen leeren Eintrag an', () => {
  const coverage = SessionCoverageTracker.create(['a', 'b']);
  assert.deepEqual(coverage.a, SessionCoverageTracker.createEmpty());
  assert.deepEqual(coverage.b, SessionCoverageTracker.createEmpty());
});

test('create() mit resumed-Daten übernimmt vorhandene Werte statt sie zu überschreiben', () => {
  const coverage = SessionCoverageTracker.create(['a'], { a: { errors: 2, preview_seen: true } });
  assert.equal(coverage.a.errors, 2);
  assert.equal(coverage.a.preview_seen, true);
  assert.equal(coverage.a.recognition_attempts, 0, 'fehlende Felder sollten weiterhin auf den Default zurückfallen');
});

test('markPreviewSeen() liefert nur beim ersten Aufruf true', () => {
  const coverage = SessionCoverageTracker.create(['a']);
  assert.equal(SessionCoverageTracker.markPreviewSeen(coverage, 'a'), true);
  assert.equal(SessionCoverageTracker.markPreviewSeen(coverage, 'a'), false);
  assert.equal(coverage.a.preview_seen, true);
});

test('recordAttempt() zählt in das richtige Feld je Phasentyp und erhöht errors bei falschen Antworten', () => {
  const coverage = SessionCoverageTracker.create(['a']);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'recognition', true);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'recognition', false);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'independent_production', true);

  assert.equal(coverage.a.recognition_attempts, 2);
  assert.equal(coverage.a.recognition_correct, 1);
  assert.equal(coverage.a.independent_attempts, 1);
  assert.equal(coverage.a.errors, 1);
});

test('priorityScore(): Fehler und Hilfeeinsatz erhöhen die Priorität, "kenne ich schon" senkt sie', () => {
  const coverage = SessionCoverageTracker.create(['error_word', 'known_word', 'neutral_word']);
  SessionCoverageTracker.recordAttempt(coverage, 'error_word', 'recognition', false);
  SessionCoverageTracker.recordAttempt(coverage, 'error_word', 'recognition', false);
  SessionCoverageTracker.markKnownAlready(coverage, 'known_word');

  const errorScore = SessionCoverageTracker.priorityScore(coverage, 'error_word');
  const knownScore = SessionCoverageTracker.priorityScore(coverage, 'known_word');
  const neutralScore = SessionCoverageTracker.priorityScore(coverage, 'neutral_word');

  assert.ok(errorScore > neutralScore, 'ein Wort mit Fehlern sollte höhere Priorität für zusätzliche Übung bekommen');
  assert.ok(knownScore < neutralScore, '"kenne ich schon" sollte die Priorität für zusätzliche Übung senken');
});

test('isSecurelyKnown(): erfordert fehlerfreie UND mindestens eine aktive Abrufaufgabe', () => {
  const coverage = SessionCoverageTracker.create(['a', 'b', 'c']);
  // a: fehlerfrei, aber nur Wiedererkennen (keine aktive Produktion) -> nicht sicher.
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'recognition', true);
  // b: fehlerfrei UND selbstständig geschrieben -> sicher.
  SessionCoverageTracker.recordAttempt(coverage, 'b', 'independent_production', true);
  // c: geführt geschrieben, aber mit einem Fehler -> nicht sicher.
  SessionCoverageTracker.recordAttempt(coverage, 'c', 'guided_production', false);

  assert.equal(SessionCoverageTracker.isSecurelyKnown(coverage, 'a'), false);
  assert.equal(SessionCoverageTracker.isSecurelyKnown(coverage, 'b'), true);
  assert.equal(SessionCoverageTracker.isSecurelyKnown(coverage, 'c'), false);
});
