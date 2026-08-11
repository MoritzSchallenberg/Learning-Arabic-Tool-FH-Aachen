// Tests für Entwicklungsauftrag 17, Abschnitt 5.4 — srs.js#evaluateAgainstAnyDetailed(). Reines
// CommonJS-Modul, direkt requirebar (kein VM-Ladepfad nötig).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateAgainstAnyDetailed, evaluateAgainstAny, evaluateArabicAnswer, evaluateGermanAnswer } = require('../../src/js/srs.js');

test('evaluateAgainstAnyDetailed liefert dasselbe category-Ergebnis wie evaluateAgainstAny (keine zweite Bewertung)', () => {
  const expected = ['كتاب', 'كتب'];
  for (const given of ['كتاب', 'كتب', 'كتاء', 'سيارة', '']) {
    const plain = evaluateAgainstAny(expected, given, evaluateArabicAnswer);
    const detailed = evaluateAgainstAnyDetailed(expected, given, evaluateArabicAnswer);
    if (given.trim() === '') {
      assert.equal(detailed.category, 'empty');
    } else {
      assert.equal(detailed.category, plain, `given="${given}"`);
    }
  }
});

test('markiert die primäre (erste) Antwort korrekt, wenn sie getroffen wurde', () => {
  const r = evaluateAgainstAnyDetailed(['كتاب', 'كتب'], 'كتاب', evaluateArabicAnswer);
  assert.equal(r.isPrimaryMatch, true);
  assert.equal(r.matchedAnswer, 'كتاب');
  assert.equal(r.primaryAnswer, 'كتاب');
});

test('markiert eine NICHT-primäre Antwort korrekt, wenn nur diese getroffen wurde', () => {
  const r = evaluateAgainstAnyDetailed(['كتاب', 'كتب'], 'كتب', evaluateArabicAnswer);
  assert.equal(r.isPrimaryMatch, false);
  assert.equal(r.matchedAnswer, 'كتب');
});

test('leere Eingabe wird als eigene, klar unterschiedene Kategorie "empty" gemeldet', () => {
  const r = evaluateAgainstAnyDetailed(['كتاب'], '   ', evaluateArabicAnswer);
  assert.equal(r.category, 'empty');
  assert.equal(r.isEmpty, true);
  assert.equal(r.matchedAnswer, null);
});

test('funktioniert unverändert auch mit dem deutschen Evaluator', () => {
  const r = evaluateAgainstAnyDetailed(['Hallo', 'Willkommen'], 'willkommen', evaluateGermanAnswer);
  assert.equal(r.category, 'correct_full');
  assert.equal(r.matchedAnswer, 'Willkommen');
  assert.equal(r.isPrimaryMatch, false);
});

test('bestehende Aufrufer von evaluateAgainstAny bleiben unverändert nutzbar', () => {
  assert.equal(evaluateAgainstAny(['كتاب'], 'كتاب', evaluateArabicAnswer), 'correct_full');
});
