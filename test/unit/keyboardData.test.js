// Tests für src/js/keyboardData.js (P0.1 — Layout-Vollständigkeit, keine Duplikate).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {
  VIRTUAL_KEYBOARD_ROWS,
  SPECIAL_CHARACTERS_ROW,
  DIACRITICS_ROW,
  PUNCTUATION_ROW,
  NUMBER_ROW
} = require('../../src/js/keyboardData.js');

const keyboardJsonPath = path.join(__dirname, '..', '..', 'language-packs', 'arabic', 'keyboard.json');
const keyboardData = JSON.parse(fs.readFileSync(keyboardJsonPath, 'utf-8'));
const allBaseLetters = keyboardData.letters.map((l) => l.letter);

function flatten(rows) {
  return rows.flat();
}

test('ذ ist auf der virtuellen Tastatur vorhanden', () => {
  const allKeys = flatten(VIRTUAL_KEYBOARD_ROWS);
  assert.ok(allKeys.includes('ذ'), 'ذ fehlt auf der virtuellen Tastatur');
});

test('alle 28 Grundbuchstaben aus keyboard.json sind auf der Tastatur vorhanden', () => {
  const allKeys = new Set(flatten(VIRTUAL_KEYBOARD_ROWS));
  const missing = allBaseLetters.filter((l) => !allKeys.has(l));
  assert.deepEqual(missing, [], `Fehlende Buchstaben: ${missing.join(', ')}`);
});

test('jeder Grundbuchstabe kommt in VIRTUAL_KEYBOARD_ROWS genau einmal vor', () => {
  const allKeys = flatten(VIRTUAL_KEYBOARD_ROWS);
  const counts = {};
  for (const k of allKeys) counts[k] = (counts[k] || 0) + 1;
  for (const letter of allBaseLetters) {
    assert.equal(counts[letter], 1, `${letter} kommt ${counts[letter] || 0}-mal statt einmal vor`);
  }
});

test('SPECIAL_CHARACTERS_ROW enthält keine bereits in VIRTUAL_KEYBOARD_ROWS vorhandenen Zeichen (keine doppelt angezeigten Tasten)', () => {
  const baseKeys = new Set(flatten(VIRTUAL_KEYBOARD_ROWS));
  const overlap = SPECIAL_CHARACTERS_ROW.filter((ch) => baseKeys.has(ch));
  assert.deepEqual(overlap, [], `Doppelte Tasten zwischen Grundlayout und Sonderzeichen-Reihe: ${overlap.join(', ')}`);
});

test('kein Zeichen kommt gleichzeitig in mehreren Zeilen-Kategorien vor (Grundlayout/Sonderzeichen/Vokalzeichen/Satzzeichen)', () => {
  const categories = {
    base: flatten(VIRTUAL_KEYBOARD_ROWS),
    special: SPECIAL_CHARACTERS_ROW,
    diacritics: DIACRITICS_ROW,
    punctuation: PUNCTUATION_ROW
  };
  const seen = new Map();
  for (const [name, list] of Object.entries(categories)) {
    for (const ch of list) {
      if (seen.has(ch)) {
        assert.fail(`Zeichen "${ch}" kommt sowohl in "${seen.get(ch)}" als auch in "${name}" vor`);
      }
      seen.set(ch, name);
    }
  }
});

test('DIACRITICS_ROW enthält alle 8 Vokalzeichen aus language.json', () => {
  const languageJsonPath = path.join(__dirname, '..', '..', 'language-packs', 'arabic', 'language.json');
  const language = JSON.parse(fs.readFileSync(languageJsonPath, 'utf-8'));
  const expectedSymbols = language.diacritics.map((d) => d.symbol);
  assert.equal(DIACRITICS_ROW.length, 8);
  for (const symbol of expectedSymbols) {
    assert.ok(DIACRITICS_ROW.includes(symbol), `Vokalzeichen ${symbol} fehlt in DIACRITICS_ROW`);
  }
});

test('NUMBER_ROW beginnt mit ذ (physische Position links neben der 1)', () => {
  assert.equal(NUMBER_ROW[0], 'ذ');
});

test('keine Zeile enthält interne Duplikate', () => {
  for (const row of VIRTUAL_KEYBOARD_ROWS) {
    const unique = new Set(row);
    assert.equal(unique.size, row.length, `Zeile mit Duplikat: ${row.join(', ')}`);
  }
});
