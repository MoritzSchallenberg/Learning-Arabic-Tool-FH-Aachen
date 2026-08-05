// Tests für src/js/practicePool.js.
global.TATWEEL = 'ـ'; // wordShaping.js-Abhängigkeit, siehe connectionTrainer.guard.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const wordShaping = require('../../src/js/wordShaping.js');
const srs = require('../../src/js/srs.js');

function loadPracticePool() {
  const context = {
    console,
    normalizeArabic: srs.normalizeArabic,
    lettersFromWord: wordShaping.lettersFromWord
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'practicePool.js'), 'utf-8');
  vm.runInContext(src + '\nthis.__PracticePool = PracticePool;', context);
  return context.__PracticePool;
}

function fakePack() {
  return {
    keyboard: {
      letters: [
        { id: 'alif', letter: 'ا', name: 'Alif', joining: 'right' },
        { id: 'ba', letter: 'ب', name: 'Bāʾ', joining: 'dual' }
      ]
    },
    vocabulary: {
      categories: [
        {
          id: 'home',
          words: [
            { id: 'housing_door', arabic: 'بَاب', german: 'Tür' }, // nur Grundbuchstaben -> connection möglich
            { id: 'greet_hallo', arabic: 'مَرْحَبًا', german: 'Hallo' } // enthält م,ر,ح -> nicht im Test-Keyboard vorhanden
          ]
        }
      ]
    }
  };
}

test('buildPool erzeugt für jeden Buchstaben 3 Fähigkeits-Einträge', () => {
  const PracticePool = loadPracticePool();
  const items = PracticePool.buildPool(fakePack());
  const letterItems = items.filter((i) => i.category === 'letters');
  assert.equal(letterItems.length, 2 * 3); // 2 Buchstaben x 3 Fähigkeiten
  assert.ok(letterItems.some((i) => i.cardId === 'letter_alif' && i.skill === 'spelling'));
});

test('buildPool erzeugt für jedes Vokabelwort 2 Richtungs-Einträge', () => {
  const PracticePool = loadPracticePool();
  const items = PracticePool.buildPool(fakePack());
  const vocabItems = items.filter((i) => i.category === 'vocabulary');
  assert.equal(vocabItems.length, 2 * 2); // 2 Wörter x 2 Richtungen
  assert.ok(vocabItems.some((i) => i.cardId === 'housing_door' && i.skill === 'arabic_to_german'));
  assert.ok(vocabItems.some((i) => i.cardId === 'housing_door' && i.skill === 'german_to_arabic'));
});

test('buildPool erzeugt Verbindungstrainer-Einträge NUR für Wörter aus den vorhandenen Grundbuchstaben', () => {
  const PracticePool = loadPracticePool();
  const items = PracticePool.buildPool(fakePack());
  const connectionItems = items.filter((i) => i.category === 'connections');
  // "بَاب" besteht nur aus ب/ا (im Test-Keyboard vorhanden) -> sollte einen Eintrag erzeugen.
  // "مَرْحَبًا" enthält Buchstaben, die im Test-Keyboard NICHT vorhanden sind -> kein Eintrag.
  assert.equal(connectionItems.length, 1);
  assert.equal(connectionItems[0].label, 'Tür');
});

test('CATEGORY_LABELS deckt alle erzeugten Kategorien ab', () => {
  const PracticePool = loadPracticePool();
  const items = PracticePool.buildPool(fakePack());
  const categories = new Set(items.map((i) => i.category));
  for (const cat of categories) {
    assert.ok(PracticePool.CATEGORY_LABELS[cat], `Kategorie "${cat}" hat kein Label`);
  }
});
