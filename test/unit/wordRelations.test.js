// Entwicklungsauftrag 15, Abschnitt 9.6/19 — Tests für die Auflösung von
// confusion_group/homonym_group/opposite_id zu echten Wortobjekten
// (src/js/session/wordRelations.js), statt roher interner IDs.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const WordRelations = require('../../src/js/session/wordRelations.js');

function w(id, extra = {}) {
  return { id, arabic: `ar_${id}`, arabic_vocalized: `arv_${id}`, german: `de_${id}`, ...extra };
}

test('confusionGroupWords(): findet andere Wörter mit demselben confusion_group-Wert, nicht sich selbst', () => {
  const target = w('a', { confusion_group: 'g1' });
  const pool = [target, w('b', { confusion_group: 'g1' }), w('c', { confusion_group: 'g2' }), w('d')];
  const result = WordRelations.confusionGroupWords(target, pool);
  assert.deepEqual(result.map((x) => x.id), ['b']);
});

test('confusionGroupWords(): kein Gruppenfeld gesetzt -> leere Liste, kein Absturz', () => {
  const target = w('a');
  const pool = [target, w('b', { confusion_group: 'g1' })];
  assert.deepEqual(WordRelations.confusionGroupWords(target, pool), []);
});

test('homonymGroupWords(): analog zu confusionGroupWords, aber für homonym_group', () => {
  const target = w('a', { homonym_group: 'h1' });
  const pool = [target, w('b', { homonym_group: 'h1' }), w('c', { homonym_group: 'h2' })];
  assert.deepEqual(WordRelations.homonymGroupWords(target, pool).map((x) => x.id), ['b']);
});

test('oppositeWord(): löst opposite_id zum tatsächlichen Wortobjekt auf', () => {
  const target = w('a', { opposite_id: 'b' });
  const pool = [target, w('b')];
  const result = WordRelations.oppositeWord(target, pool);
  assert.equal(result.id, 'b');
});

test('oppositeWord(): kein opposite_id oder Ziel nicht im Pool -> null statt Absturz', () => {
  assert.equal(WordRelations.oppositeWord(w('a'), [w('a')]), null);
  assert.equal(WordRelations.oppositeWord(w('a', { opposite_id: 'nicht_vorhanden' }), [w('a')]), null);
});

test('otherAcceptedArabicForms(): weitere akzeptierte Formen außer der bereits sichtbaren Hauptform', () => {
  const word = w('a', { arabic_vocalized: 'مَرْحَبًا', accepted_arabic_answers: ['مَرْحَبًا', 'مرحبا'] });
  assert.deepEqual(WordRelations.otherAcceptedArabicForms(word), ['مرحبا']);
});

test('otherAcceptedArabicForms(): keine Duplikate, keine leere Hauptform doppelt', () => {
  const word = w('a', { arabic_vocalized: 'x', accepted_arabic_answers: ['x', 'x', 'y', 'y'] });
  assert.deepEqual(WordRelations.otherAcceptedArabicForms(word), ['y']);
});

test('otherAcceptedArabicForms(): kein accepted_arabic_answers-Feld -> leere Liste', () => {
  assert.deepEqual(WordRelations.otherAcceptedArabicForms(w('a')), []);
});

test('hasAnyExtraInfo(): true, sobald IRGENDEINE Zusatzinformation vorhanden ist', () => {
  const pool1 = [w('a', { confusion_group: 'g1' }), w('b', { confusion_group: 'g1' })];
  assert.equal(WordRelations.hasAnyExtraInfo(pool1[0], pool1), true);

  const pool2 = [w('a', { opposite_id: 'b' }), w('b')];
  assert.equal(WordRelations.hasAnyExtraInfo(pool2[0], pool2), true);

  const pool3 = [w('a', { accepted_arabic_answers: ['arv_a', 'weitere_form'] })];
  assert.equal(WordRelations.hasAnyExtraInfo(pool3[0], pool3), true);
});

test('hasAnyExtraInfo(): false, wenn keinerlei Zusatzinformation vorhanden ist', () => {
  const pool = [w('a'), w('b')];
  assert.equal(WordRelations.hasAnyExtraInfo(pool[0], pool), false);
});

test('kein interner Rohschlüssel wird durch diese Funktionen selbst als Text zurückgegeben (immer Wortobjekte/Arrays von Formen)', () => {
  const target = w('a', { confusion_group: 'group_17' });
  const pool = [target, w('b', { confusion_group: 'group_17' })];
  const result = WordRelations.confusionGroupWords(target, pool);
  assert.ok(result.every((x) => typeof x === 'object' && x.id !== 'group_17'));
});
