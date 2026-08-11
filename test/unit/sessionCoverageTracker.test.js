// Tests für SessionCoverageTracker (Entwicklungsauftrag 5, Abschnitt 7; Felder auf das neue
// Zehn-Stufen-Modell umgestellt in Entwicklungsauftrag 16, Abschnitt 11).

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

test('recordAttempt() zählt in das richtige Feld je Phasentyp (Entwicklungsauftrag 16, neues Modell) und erhöht errors bei falschen Antworten', () => {
  const coverage = SessionCoverageTracker.create(['a']);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'recognition', true);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'recognition', false);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'independent_writing', true);

  assert.equal(coverage.a.recognition_attempts, 2);
  assert.equal(coverage.a.recognition_correct, 1);
  assert.equal(coverage.a.independent_writing_attempts, 1);
  assert.equal(coverage.a.errors, 1);
});

test('recordAttempt(): matching zählt matching_attempts/matching_correct analog zu recognition', () => {
  const coverage = SessionCoverageTracker.create(['a']);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'matching', true);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'matching', false);
  assert.equal(coverage.a.matching_attempts, 2);
  assert.equal(coverage.a.matching_correct, 1);
  assert.equal(coverage.a.errors, 1);
});

test('recordAttempt(): guided_writing deckt sowohl order_pieces- als auch guided_typing-Unteraufgaben in EINEM Feld ab (Abschnitt 8.4/11)', () => {
  const coverage = SessionCoverageTracker.create(['a']);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'guided_writing', true);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'guided_writing', true);
  assert.equal(coverage.a.guided_writing_attempts, 2);
});

test('migrateLegacyEntry(): alte reconstruction_attempts+guided_typing_attempts fließen zusammen in guided_writing_attempts', () => {
  const legacy = { reconstruction_attempts: 1, guided_typing_attempts: 2, preview_seen: true };
  const migrated = SessionCoverageTracker.migrateLegacyEntry(legacy);
  assert.equal(migrated.guided_writing_attempts, 3);
  assert.equal(migrated.preview_seen, true, 'andere Felder bleiben unverändert erhalten');
});

test('migrateLegacyEntry(): alte independent_attempts werden zu independent_writing_attempts', () => {
  const migrated = SessionCoverageTracker.migrateLegacyEntry({ independent_attempts: 4 });
  assert.equal(migrated.independent_writing_attempts, 4);
});

test('migrateLegacyEntry(): alte application_attempts werden zu matching_attempts (Anwendung ist jetzt eine Zuordnungsvariante, Abschnitt 7.5)', () => {
  const migrated = SessionCoverageTracker.migrateLegacyEntry({ application_attempts: 2 });
  assert.equal(migrated.matching_attempts, 2);
});

test('migrateLegacyEntry(): ist idempotent -- ein bereits migrierter Eintrag verändert sich beim erneuten Aufruf nicht', () => {
  const once = SessionCoverageTracker.migrateLegacyEntry({ reconstruction_attempts: 1, guided_typing_attempts: 1 });
  const twice = SessionCoverageTracker.migrateLegacyEntry(once);
  assert.deepEqual(once, twice);
});

test('migrateLegacyEntry(): ein Eintrag ohne jede historische Angabe bleibt unverändert (kein Absturz)', () => {
  const entry = { preview_seen: true, errors: 1 };
  assert.deepEqual(SessionCoverageTracker.migrateLegacyEntry(entry), entry);
  assert.equal(SessionCoverageTracker.migrateLegacyEntry(null), null);
  assert.equal(SessionCoverageTracker.migrateLegacyEntry(undefined), undefined);
});

test('create() wendet die Legacy-Migration automatisch auf resumed-Daten an', () => {
  const coverage = SessionCoverageTracker.create(['a'], { a: { independent_attempts: 3 } });
  assert.equal(coverage.a.independent_writing_attempts, 3);
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

test('isSecurelyKnown(): erfordert fehlerfreie UND mindestens eine aktive Abrufaufgabe (guided_writing ODER independent_writing)', () => {
  const coverage = SessionCoverageTracker.create(['a', 'b', 'c']);
  // a: fehlerfrei, aber nur Wiedererkennen (keine aktive Schreibaufgabe) -> nicht sicher.
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'recognition', true);
  // b: fehlerfrei UND selbstständig geschrieben -> sicher.
  SessionCoverageTracker.recordAttempt(coverage, 'b', 'independent_writing', true);
  // c: geführt geschrieben, aber mit einem Fehler -> nicht sicher.
  SessionCoverageTracker.recordAttempt(coverage, 'c', 'guided_writing', false);

  assert.equal(SessionCoverageTracker.isSecurelyKnown(coverage, 'a'), false);
  assert.equal(SessionCoverageTracker.isSecurelyKnown(coverage, 'b'), true);
  assert.equal(SessionCoverageTracker.isSecurelyKnown(coverage, 'c'), false);
});

// --- Entwicklungsauftrag 16, Abschnitt 10.4: Sessionabschluss-Bedingungen ---------------------
test('isRecognized()/isMatched()/isWritten(): jeweils true erst ab mindestens einem passenden Versuch', () => {
  const coverage = SessionCoverageTracker.create(['a']);
  assert.equal(SessionCoverageTracker.isRecognized(coverage, 'a'), false);
  assert.equal(SessionCoverageTracker.isMatched(coverage, 'a'), false);
  assert.equal(SessionCoverageTracker.isWritten(coverage, 'a'), false);

  SessionCoverageTracker.recordAttempt(coverage, 'a', 'recognition', true);
  assert.equal(SessionCoverageTracker.isRecognized(coverage, 'a'), true);

  SessionCoverageTracker.recordAttempt(coverage, 'a', 'matching', false);
  assert.equal(SessionCoverageTracker.isMatched(coverage, 'a'), true, 'auch ein falscher Versuch zählt als "zugeordnet wurde" (Abschnitt 10.4 verlangt nur einen Versuch, keinen korrekten)');

  SessionCoverageTracker.recordAttempt(coverage, 'a', 'guided_writing', true);
  assert.equal(SessionCoverageTracker.isWritten(coverage, 'a'), true);
});

test('isWritten(): gilt auch bei ausschließlich independent_writing als geschrieben (Stufe 8 ODER 9 genügt, Abschnitt 8.3)', () => {
  const coverage = SessionCoverageTracker.create(['a']);
  SessionCoverageTracker.recordAttempt(coverage, 'a', 'independent_writing', true);
  assert.equal(SessionCoverageTracker.isWritten(coverage, 'a'), true);
});
