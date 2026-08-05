// Tests für src/js/textEditing.js (P0.1 — Unicode-sicheres Löschen).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deleteGraphemeBefore, insertAt } = require('../../src/js/textEditing.js');

test('deleteGraphemeBefore löscht Buchstabe+Fatha (بَ) als eine Einheit', () => {
  const text = 'بَ'; // ب + َ (Fatha)
  const result = deleteGraphemeBefore(text, text.length);
  assert.equal(result.text, '');
  assert.equal(result.newIndex, 0);
});

test('deleteGraphemeBefore löscht bei mehreren Buchstaben nur das letzte Graphem', () => {
  const text = 'بَاب'; // بَ ا ب — bāb mit Fatha auf dem ersten ب
  const result = deleteGraphemeBefore(text, text.length);
  assert.equal(result.text, 'بَا');
  assert.equal(result.newIndex, 3);
});

test('deleteGraphemeBefore löscht mitten im Wort korrekt (nicht am Ende)', () => {
  const text = 'بَاب';
  // Cursor direkt nach "بَ" (Index 2) — soll "بَ" komplett löschen und "اب" übrig lassen.
  const result = deleteGraphemeBefore(text, 2);
  assert.equal(result.text, 'اب');
  assert.equal(result.newIndex, 0);
});

test('deleteGraphemeBefore auf leerem Text tut nichts', () => {
  const result = deleteGraphemeBefore('', 0);
  assert.equal(result.text, '');
  assert.equal(result.newIndex, 0);
});

test('deleteGraphemeBefore an Position 0 tut nichts', () => {
  const result = deleteGraphemeBefore('باب', 0);
  assert.equal(result.text, 'باب');
  assert.equal(result.newIndex, 0);
});

test('deleteGraphemeBefore löscht einzelnen Buchstaben ohne Vokalzeichen normal', () => {
  const result = deleteGraphemeBefore('اب', 2);
  assert.equal(result.text, 'ا');
  assert.equal(result.newIndex, 1);
});

test('deleteGraphemeBefore mit Schadda+Fatha (doppeltes kombinierendes Zeichen) auf einem Buchstaben', () => {
  // بَّ = ب + Schadda + Fatha — alle drei zusammen sind EIN Graphem.
  const text = 'بَّ';
  const result = deleteGraphemeBefore(text, text.length);
  assert.equal(result.text, '');
});

test('insertAt fügt Text an der Cursorposition ein', () => {
  const result = insertAt('اب', 1, 'ل');
  assert.equal(result.text, 'الب');
  assert.equal(result.newIndex, 2);
});

test('insertAt am Anfang', () => {
  const result = insertAt('اب', 0, 'ل');
  assert.equal(result.text, 'لاب');
  assert.equal(result.newIndex, 1);
});

test('insertAt am Ende', () => {
  const result = insertAt('اب', 2, 'ل');
  assert.equal(result.text, 'ابل');
  assert.equal(result.newIndex, 3);
});
