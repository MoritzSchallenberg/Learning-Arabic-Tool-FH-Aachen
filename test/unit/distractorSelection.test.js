// Entwicklungsauftrag 11, Abschnitt 8 — Tests für die qualitativ abgesicherte Distraktorauswahl
// (pickDistractors()/isAcceptableDistractor() in src/js/session/exerciseRegistry.js). Läuft
// gegen den ECHTEN Code (VM-Kontext, kein Mock der Auswahlfunktion selbst).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const SOURCE_FILES = ['src/js/srs.js', 'src/js/exerciseGuard.js', 'src/js/session/exerciseRegistry.js'];

function loadRegistry() {
  const context = { console, document: { createElement: () => ({}) } };
  vm.createContext(context);
  const src = SOURCE_FILES.map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${src}\nthis.__ExerciseRegistry = ExerciseRegistry;`, context);
  return context.__ExerciseRegistry;
}

function w(id, arabic, german_answers, extra = {}) {
  return { id, arabic, arabic_vocalized: arabic, arabic_unvocalized: arabic, german_answers, german: german_answers[0], ...extra };
}

test('Distraktorauswahl: normales Zielwort mit ausreichend Pool liefert genau 3 unterschiedliche Distraktoren', () => {
  const ExerciseRegistry = loadRegistry();
  const target = w('t1', 'أ', ['A']);
  const pool = [target, w('t2', 'ب', ['B']), w('t3', 'ج', ['C']), w('t4', 'د', ['D']), w('t5', 'ه', ['E'])];
  const distractors = ExerciseRegistry.pickDistractors(target, pool, 3);
  assert.equal(distractors.length, 3);
  assert.ok(distractors.every((d) => d.id !== target.id));
  assert.equal(new Set(distractors.map((d) => d.id)).size, 3, 'keine doppelten Distraktoren');
});

test('Distraktorauswahl: ein Synonym innerhalb der Session (vollständig überlappende deutsche Bedeutung) wird ausgeschlossen, solange genug Alternativen da sind', () => {
  const ExerciseRegistry = loadRegistry();
  const target = w('game_general', 'لعبة', ['Spiel (allgemein)']);
  const synonym = w('game_synonym', 'مرح', ['Spiel (allgemein)']); // exakt dieselbe deutsche Bedeutung -> ungeeignet
  const good1 = w('t2', 'ب', ['B']);
  const good2 = w('t3', 'ج', ['C']);
  const good3 = w('t4', 'د', ['D']);
  const pool = [target, synonym, good1, good2, good3];
  const distractors = ExerciseRegistry.pickDistractors(target, pool, 3);
  assert.equal(distractors.length, 3);
  assert.ok(!distractors.some((d) => d.id === 'game_synonym'), 'das bedeutungsgleiche Synonym sollte nicht als Distraktor gewählt werden, wenn genug andere Optionen da sind');
});

test('Distraktorauswahl: ein Wort mit identischer unvokalisierter Schreibweise wird ausgeschlossen, solange genug Alternativen da sind', () => {
  const ExerciseRegistry = loadRegistry();
  const target = { id: 'w1', arabic: 'دَرَجَة', arabic_vocalized: 'دَرَجَة', arabic_unvocalized: 'درجة', german_answers: ['Note (Schule)'] };
  const sameUnvocalized = { id: 'w2', arabic: 'دَرَجَة', arabic_vocalized: 'دَرَجَة', arabic_unvocalized: 'درجة', german_answers: ['Grad'] };
  const good1 = w('t2', 'ب', ['B']);
  const good2 = w('t3', 'ج', ['C']);
  const good3 = w('t4', 'د', ['D']);
  const pool = [target, sameUnvocalized, good1, good2, good3];
  const distractors = ExerciseRegistry.pickDistractors(target, pool, 3);
  assert.ok(!distractors.some((d) => d.id === 'w2'), 'ein Wort mit identischer unvokalisierter Form sollte nicht als Distraktor gewählt werden');
});

test('Distraktorauswahl: ein als Homonym markiertes Wort (gleiche homonym_group, andere Schreibung) wird ausgeschlossen', () => {
  const ExerciseRegistry = loadRegistry();
  const target = { id: 'min_prep', arabic: 'مِنْ', arabic_vocalized: 'مِنْ', arabic_unvocalized: 'من', german_answers: ['von'], homonym_group: 'من' };
  const homonymPartner = { id: 'q_who', arabic: 'مَنْ', arabic_vocalized: 'مَنْ', arabic_unvocalized: 'من', german_answers: ['wer'], homonym_group: 'من' };
  const good1 = w('t2', 'ب', ['B']);
  const good2 = w('t3', 'ج', ['C']);
  const good3 = w('t4', 'د', ['D']);
  const pool = [target, homonymPartner, good1, good2, good3];
  const distractors = ExerciseRegistry.pickDistractors(target, pool, 3);
  assert.ok(!distractors.some((d) => d.id === 'q_who'), 'der Homonym-Partner sollte nicht als Distraktor gewählt werden');
});

test('Distraktorauswahl: kleiner Pool (nur 2 andere Wörter für 3 gewünschte Distraktoren) liefert kontrolliert weniger Optionen statt abzustürzen', () => {
  const ExerciseRegistry = loadRegistry();
  const target = w('t1', 'أ', ['A']);
  const pool = [target, w('t2', 'ب', ['B']), w('t3', 'ج', ['C'])];
  const distractors = ExerciseRegistry.pickDistractors(target, pool, 3);
  assert.equal(distractors.length, 2, 'bei nur 2 verfügbaren anderen Wörtern sollten genau 2 Distraktoren zurückgegeben werden, kein Absturz');
});

test('Distraktorauswahl: ausschließlich ungeeignete Kandidaten führt zum kontrollierten Rückfall (Distraktoren werden trotzdem geliefert, kein Crash)', () => {
  const ExerciseRegistry = loadRegistry();
  const target = w('t1', 'أ', ['A']);
  // Alle Kandidaten sind aus Sicht der strengen Kriterien "ungeeignet" (exakt dieselbe deutsche
  // Bedeutung wie das Zielwort) -- die Funktion darf trotzdem nicht crashen oder 0 liefern,
  // sondern muss kontrolliert auf diese Kandidaten zurückfallen.
  const pool = [target, w('t2', 'ب', ['A']), w('t3', 'ج', ['A']), w('t4', 'د', ['A'])];
  const distractors = ExerciseRegistry.pickDistractors(target, pool, 3);
  assert.equal(distractors.length, 3, 'trotz ausschließlich ungeeigneter Kandidaten sollten die verfügbaren 3 anderen Wörter als Rückfall geliefert werden');
  assert.ok(distractors.every((d) => d.id !== target.id));
});

test('Distraktorauswahl: leerer Pool (Zielwort ist das einzige Wort) liefert 0 Distraktoren ohne Absturz', () => {
  const ExerciseRegistry = loadRegistry();
  const target = w('t1', 'أ', ['A']);
  const distractors = ExerciseRegistry.pickDistractors(target, [target], 3);
  assert.deepEqual([...distractors], []);
});

test('isAcceptableDistractor(): direkte Einzelprüfung der vier Ausschlusskriterien', () => {
  const ExerciseRegistry = loadRegistry();
  const target = { id: 'a', arabic_vocalized: 'X', arabic_unvocalized: 'x', german_answers: ['Bedeutung'], homonym_group: 'grp' };
  assert.equal(ExerciseRegistry.isAcceptableDistractor(target, { id: 'a', arabic_vocalized: 'Y', arabic_unvocalized: 'y', german_answers: ['Andere'] }), false, 'gleiche ID -> ungeeignet');
  assert.equal(ExerciseRegistry.isAcceptableDistractor(target, { id: 'b', arabic_vocalized: 'X', arabic_unvocalized: 'y', german_answers: ['Andere'] }), false, 'gleiche angezeigte arabische Form -> ungeeignet');
  assert.equal(ExerciseRegistry.isAcceptableDistractor(target, { id: 'b', arabic_vocalized: 'Y', arabic_unvocalized: 'x', german_answers: ['Andere'] }), false, 'gleiche unvokalisierte Form -> ungeeignet');
  assert.equal(ExerciseRegistry.isAcceptableDistractor(target, { id: 'b', arabic_vocalized: 'Y', arabic_unvocalized: 'y', german_answers: ['Andere'], homonym_group: 'grp' }), false, 'gleiche homonym_group -> ungeeignet');
  assert.equal(ExerciseRegistry.isAcceptableDistractor(target, { id: 'b', arabic_vocalized: 'Y', arabic_unvocalized: 'y', german_answers: ['Bedeutung'] }), false, 'vollständig überlappende deutsche Bedeutung -> ungeeignet');
  assert.equal(ExerciseRegistry.isAcceptableDistractor(target, { id: 'b', arabic_vocalized: 'Y', arabic_unvocalized: 'y', german_answers: ['Bedeutung', 'Weitere'] }), false, 'Zielbedeutung vollständig in Kandidat enthalten -> ungeeignet');
  assert.equal(ExerciseRegistry.isAcceptableDistractor(target, { id: 'b', arabic_vocalized: 'Y', arabic_unvocalized: 'y', german_answers: ['Andere'] }), true, 'in jeder Hinsicht unterschiedlich -> geeignet');
});

// --- weiterhin genau eine richtige Option: contextual_choice/multiple_choice müssen trotz der
// neuen Distraktorlogik weiterhin exakt EIN korrektes Element in den gerenderten Optionen haben.
test('Nach der Distraktorauswahl gibt es in den gerenderten Optionen weiterhin genau eine richtige Antwort (contextual_choice, echtes Rendering)', () => {
  const { createDocumentStub } = require('../helpers/domStub.js');
  const context = { console };
  vm.createContext(context);
  const src = SOURCE_FILES.map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${src}\nthis.__ExerciseRegistry = ExerciseRegistry;\nthis.__ExerciseGuard = ExerciseGuard;`, context);
  const doc = createDocumentStub();
  context.document = doc;
  const ExerciseRegistry = context.__ExerciseRegistry;
  const ExerciseGuard = context.__ExerciseGuard;

  const vocabulary = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabulary.json'), 'utf-8'));
  const words = vocabulary.categories.flatMap((c) => c.words);
  const wordsById = new Map(words.map((wd) => [wd.id, wd]));
  const word = wordsById.get('c1_u25_01');

  const container = doc.createElement('div');
  const guard = ExerciseGuard.create();
  ExerciseRegistry.render('contextual_choice', container, { word, allWords: words, helpConfig: { showDiacritics: 'full' }, settings: {} }, guard, () => {});
  const buttons = container.findAllButtons();
  assert.ok(buttons.length >= 2, 'mindestens 2 Optionen (1 richtig + mindestens 1 Distraktor) erwartet');
  const correctText = word.arabic_vocalized || word.arabic;
  const matchingButtons = buttons.filter((b) => b.textContent === correctText);
  assert.equal(matchingButtons.length, 1, 'genau eine gerenderte Option sollte dem Zielwort entsprechen');
});
