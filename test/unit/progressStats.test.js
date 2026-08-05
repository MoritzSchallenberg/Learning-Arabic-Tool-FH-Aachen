// Tests für src/js/progressStats.js (Entwicklungsauftrag 3, Meilenstein B — Fortschrittsbalken).
// Lädt in einem vm-Kontext, damit die optionale PracticePool-Abhängigkeit (globaler Scope im
// Browser) kontrolliert simuliert werden kann.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function loadProgressStats(practicePoolStub) {
  const context = { console };
  if (practicePoolStub) context.PracticePool = practicePoolStub;
  vm.createContext(context);
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'progressStats.js'), 'utf-8');
  vm.runInContext(src + '\nthis.__ProgressStats = ProgressStats;', context);
  return context.__ProgressStats;
}

function makeCardStore(initial = {}) {
  const cards = { ...initial };
  return (cardId) => cards[cardId] || { difficulty: {} };
}

test('difficultyToMasteryPercent: Schwierigkeit 1 -> 100%, Schwierigkeit 10 -> 0%', () => {
  const ProgressStats = loadProgressStats();
  assert.equal(ProgressStats.difficultyToMasteryPercent(1), 100);
  assert.equal(ProgressStats.difficultyToMasteryPercent(10), 0);
});

test('difficultyToMasteryPercent ist das Gegenteil von Schwierigkeit (Regressionstest für den Anzeigefehler)', () => {
  const ProgressStats = loadProgressStats();
  const easy = ProgressStats.difficultyToMasteryPercent(2); // leicht -> hohe Beherrschung
  const hard = ProgressStats.difficultyToMasteryPercent(9); // schwer -> niedrige Beherrschung
  assert.ok(easy > hard, 'niedrige Schwierigkeit muss zu höherer Beherrschung führen als hohe Schwierigkeit');
});

test('masteryFractionForCard: ein Wort mit nur EINER von zwei Fähigkeiten gemeistert zählt nicht als voll beherrscht', () => {
  const ProgressStats = loadProgressStats();
  const card = { difficulty: { arabic_to_german: 2 } }; // nur eine von zwei Fähigkeiten versucht
  const fraction = ProgressStats.masteryFractionForCard(card, ['arabic_to_german', 'german_to_arabic']);
  assert.equal(fraction, 0.5, 'ein Wort mit nur 1 von 2 Fähigkeiten beherrscht sollte 50%, nicht 100% ergeben');
});

test('masteryFractionForCard: nicht versuchte Karte ergibt 0', () => {
  const ProgressStats = loadProgressStats();
  const fraction = ProgressStats.masteryFractionForCard({ difficulty: {} }, ['arabic_to_german', 'german_to_arabic']);
  assert.equal(fraction, 0);
});

test('masteryFractionForCard: eine schlecht beherrschte Fähigkeit (Schwierigkeit > 3.5) zählt nicht mit', () => {
  const ProgressStats = loadProgressStats();
  const card = { difficulty: { arabic_to_german: 8, german_to_arabic: 2 } };
  const fraction = ProgressStats.masteryFractionForCard(card, ['arabic_to_german', 'german_to_arabic']);
  assert.equal(fraction, 0.5);
});

test('computeOverallProgress mittelt über alle einzigartigen Karten (Mehrfach-Skills pro Karte werden nicht doppelt gezählt)', () => {
  const practicePoolStub = { LETTER_SKILLS: ['spelling'], VOCAB_SKILLS: ['arabic_to_german', 'german_to_arabic'] };
  const ProgressStats = loadProgressStats(practicePoolStub);
  const getCard = makeCardStore({
    w1: { difficulty: { arabic_to_german: 2, german_to_arabic: 2 } }, // voll beherrscht
    w2: { difficulty: {} } // gar nicht versucht
  });
  const items = [
    { cardId: 'w1', category: 'vocabulary' },
    { cardId: 'w1', category: 'vocabulary' }, // zweiter Skill derselben Karte, keine Doppelzählung
    { cardId: 'w2', category: 'vocabulary' }
  ];
  const result = ProgressStats.computeOverallProgress(items, getCard);
  assert.equal(result.totalCards, 2);
  assert.equal(result.percent, 50); // (100% + 0%) / 2
});

test('computeByCategory liefert getrennte Werte je Kategorie', () => {
  const practicePoolStub = { LETTER_SKILLS: ['spelling'], VOCAB_SKILLS: ['arabic_to_german'] };
  const ProgressStats = loadProgressStats(practicePoolStub);
  const getCard = makeCardStore({
    letter_alif: { difficulty: { spelling: 1 } }, // 100%
    word1: { difficulty: {} } // 0%
  });
  const items = [
    { cardId: 'letter_alif', category: 'letters' },
    { cardId: 'word1', category: 'vocabulary' }
  ];
  const result = ProgressStats.computeByCategory(items, getCard);
  assert.equal(result.letters, 100);
  assert.equal(result.vocabulary, 0);
});

test('computeCompetencyBars: Kompetenz ohne jegliche Daten liefert null (nicht 0%, das wäre irreführend "schlecht" statt "unbekannt")', () => {
  const ProgressStats = loadProgressStats();
  const result = ProgressStats.computeCompetencyBars({});
  assert.equal(result.Lesen.percent, null);
  assert.equal(result.Lesen.count, 0);
});

test('computeCompetencyBars: Hören aggregiert listening + pronunciation', () => {
  const ProgressStats = loadProgressStats();
  const cards = {
    w1: { difficulty: { listening: 2 } },
    w2: { difficulty: { pronunciation: 4 } }
  };
  const result = ProgressStats.computeCompetencyBars(cards);
  assert.equal(result.Hören.count, 2);
  assert.ok(result.Hören.percent > 0 && result.Hören.percent < 100);
});

test('COMPETENCY_SKILLS deckt die 6 im Auftrag genannten Kompetenzen ab', () => {
  const ProgressStats = loadProgressStats();
  const names = Object.keys(ProgressStats.COMPETENCY_SKILLS);
  assert.deepEqual(names.sort(), ['Hören', 'Lesen', 'Satzanwendung', 'Schreiben', 'Verbindungen', 'Wortschatz'].sort());
});
