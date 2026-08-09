// Entwicklungsauftrag 10, Abschnitt 6 — Untersuchung und Absicherung der Application-Prompt-/
// Grading-Semantik gegen den ECHTEN `exerciseRegistry.js`-Code (kein Mock der Renderfunktion
// selbst). Befund der Untersuchung (siehe Abschlussbericht): `renderContextualChoice` wertet
// Korrektheit ausschließlich über "die angeklickte Option ist dasselbe Wortobjekt wie `ctx.word`"
// aus (`opt.id === word.id`) — `expected_word_id`/`expected_meaning` im application_prompt werden
// von der Renderfunktion selbst NIRGENDS gelesen, nur der `prompt`-Text wird angezeigt. Das
// bestehende Verhalten ist in sich korrekt und konsistent (die angezeigte Situation gehört immer
// zum aktuell abgefragten Wort) — es wird deshalb NICHT verändert, sondern hier als Verhalten
// abgesichert. Deckt wie vom Auftrag verlangt je einen Fall ab: Verb, Substantiv, Präposition,
// mehrdeutig übersetzbares Wort, ein Bestandswort, ein neues Batch-5-Wort.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');
const SOURCE_FILES = [
  'src/js/srs.js',
  'src/js/exerciseGuard.js',
  'src/js/session/exerciseRegistry.js'
];

function loadRegistry() {
  const context = { console };
  vm.createContext(context);
  const combinedSrc = SOURCE_FILES.map((relPath) => fs.readFileSync(path.join(ROOT, relPath), 'utf-8')).join('\n;\n');
  vm.runInContext(`${combinedSrc}\nthis.__ExerciseRegistry = ExerciseRegistry;\nthis.__ExerciseGuard = ExerciseGuard;`, context);
  return { ExerciseRegistry: context.__ExerciseRegistry, ExerciseGuard: context.__ExerciseGuard, context };
}

function loadVocabularyWords() {
  const vocab = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabulary.json'), 'utf-8'));
  return vocab.categories.flatMap((c) => c.words);
}

// Rendert eine contextual_choice-Aufgabe für `word` gegen einen Pool `allWords`, klickt den
// Button mit dem gegebenen (angezeigten) Text und liefert zurück, ob onDone(true/false) gerufen
// wurde und mit welchem Detail.
function renderAndClick(ExerciseRegistry, ExerciseGuard, doc, word, allWords, buttonPredicate) {
  const container = doc.createElement('div');
  const guard = ExerciseGuard.create();
  let result = null;
  // showDiacritics:'full' -> arabicDisplay() zeigt die volle vokalisierte Form unverändert an
  // (siehe displayConfig() in exerciseRegistry.js) -- sonst würde der Button-Text durch
  // normalizeArabic() auf die unvokalisierte Form reduziert, was den Textvergleich unten
  // unnötig verkompliziert.
  ExerciseRegistry.render('contextual_choice', container, { word, allWords, helpConfig: { showDiacritics: 'full' }, settings: {} }, guard, (isCorrect, detail) => {
    result = { isCorrect, detail };
  });
  const buttons = container.findAllButtons();
  assert.equal(buttons.length, 4, 'contextual_choice sollte genau 4 Optionen zeigen (1 richtig + 3 Distraktoren)');
  const target = buttons.find(buttonPredicate);
  assert.ok(target, 'gesuchter Button (per Prädikat) sollte unter den 4 Optionen vorhanden sein');
  target.click();
  assert.ok(result, 'onDone sollte nach dem Klick synchron aufgerufen worden sein');
  return result;
}

function runGradingScenario(t, wordId) {
  const { ExerciseRegistry, ExerciseGuard, context } = loadRegistry();
  const doc = createDocumentStub();
  context.document = doc;
  const words = loadVocabularyWords();
  const word = words.find((w) => w.id === wordId);
  assert.ok(word, `Testwort "${wordId}" sollte in vocabulary.json existieren`);
  // Distraktoren-Pool: irgendeine ausreichend große Menge anderer Wörter (wie im echten Betrieb
  // "allWords" = die ~10 Wörter der Session) -- hier der ganze Bestand minus das Zielwort reicht,
  // um verlässlich 3 Distraktoren zu bekommen.
  const allWords = words;

  // 1) Klick auf die korrekte Option (das Zielwort selbst, über seine arabische Anzeige erkannt).
  const correctResult = renderAndClick(ExerciseRegistry, ExerciseGuard, doc, word, allWords, (btn) => btn.textContent === (word.arabic_vocalized || word.arabic) || btn.textContent === word.arabic);
  assert.equal(correctResult.isCorrect, true, `${wordId}: Klick auf die korrekte Option sollte als richtig gewertet werden`);

  // 2) Klick auf einen Distraktor (irgendeine andere sichtbare Option) muss als falsch gelten.
  const container2 = doc.createElement('div');
  const guard2 = ExerciseGuard.create();
  let wrongResult = null;
  ExerciseRegistry.render('contextual_choice', container2, { word, allWords, helpConfig: { showDiacritics: 'full' }, settings: {} }, guard2, (isCorrect, detail) => {
    wrongResult = { isCorrect, detail };
  });
  const buttons2 = container2.findAllButtons();
  const wrongTargetText = word.arabic_vocalized || word.arabic;
  const distractor = buttons2.find((btn) => btn.textContent !== wrongTargetText);
  assert.ok(distractor, `${wordId}: mindestens ein Distraktor-Button sollte vorhanden sein`);
  distractor.click();
  assert.equal(wrongResult.isCorrect, false, `${wordId}: Klick auf einen Distraktor sollte als falsch gewertet werden`);
}

// --- Die sechs vom Auftrag geforderten Fälle -----------------------------------------------
test('Application-Prompt-Grading: ein Verb (c1_u16_12, öffnen) wird korrekt bewertet', (t) => {
  runGradingScenario(t, 'c1_u16_12');
});
test('Application-Prompt-Grading: ein Substantiv (c1_u23_03, كِتَاب/Buch) wird korrekt bewertet', (t) => {
  runGradingScenario(t, 'c1_u23_03');
});
test('Application-Prompt-Grading: eine Präposition (c1_u21_01, في/in) wird korrekt bewertet', (t) => {
  runGradingScenario(t, 'c1_u21_01');
});
test('Application-Prompt-Grading: ein mehrdeutig übersetzbares Wort (c1_u21_25, عَنْ/"über") wird korrekt bewertet', (t) => {
  runGradingScenario(t, 'c1_u21_25');
});
test('Application-Prompt-Grading: ein Bestandswort (job_doctor, طَبِيب/Arzt) wird korrekt bewertet', (t) => {
  runGradingScenario(t, 'job_doctor');
});
test('Application-Prompt-Grading: ein neues Batch-5-Wort (c1_u25_01, وَظِيفَة/Arbeitsstelle) wird korrekt bewertet', (t) => {
  runGradingScenario(t, 'c1_u25_01');
});

// --- Semantik-Absicherung: Grading basiert auf Objektidentität, NICHT auf expected_word_id/
// expected_meaning (Befund der Untersuchung aus Abschnitt 6) ---------------------------------
test('renderContextualChoice wertet über Wort-Identität aus, nicht über expected_word_id/expected_meaning-Textvergleich', () => {
  const { ExerciseRegistry, ExerciseGuard, context } = loadRegistry();
  const doc = createDocumentStub();
  context.document = doc;
  // Künstliches Wortpaar mit bewusst FALSCHEN expected_word_id/expected_meaning-Angaben -- wenn
  // die Engine diese Felder tatsächlich zur Bewertung heranzöge, würde der Test unten fehlschlagen.
  const word = {
    id: 'test_word_a', arabic: 'أ', arabic_vocalized: 'أ', german: 'A', german_answers: ['A'],
    application_prompts: [{ type: 'context_choice', prompt: 'Testkontext für A', expected_word_id: 'test_word_b', expected_meaning: 'B (absichtlich falsch)' }]
  };
  const distractor1 = { id: 'test_word_b', arabic: 'ب', arabic_vocalized: 'ب', german: 'B', german_answers: ['B'] };
  const distractor2 = { id: 'test_word_c', arabic: 'ج', arabic_vocalized: 'ج', german: 'C', german_answers: ['C'] };
  const distractor3 = { id: 'test_word_d', arabic: 'د', arabic_vocalized: 'د', german: 'D', german_answers: ['D'] };
  const allWords = [word, distractor1, distractor2, distractor3];

  const result = renderAndClick(ExerciseRegistry, ExerciseGuard, doc, word, allWords, (btn) => btn.textContent === 'أ');
  assert.equal(result.isCorrect, true, 'trotz irreführender expected_word_id/expected_meaning muss die Option, die dem tatsächlichen ctx.word entspricht, als richtig gelten');
});

// --- application_prompts-Datenkonsistenz: keine unbekannten IDs, expected_word_id widerspricht
// nicht expected_meaning (beide beziehen sich auf dasselbe Wort) -----------------------------
test('application_prompts (Units 16-25): expected_word_id verweist immer auf das eigene Wort, widerspricht also nie expected_meaning', () => {
  const words = loadVocabularyWords();
  const wordsById = new Map(words.map((w) => [w.id, w]));
  const newBatchIds = words.filter((w) => /^c1_u(1[6-9]|2[0-5])_/.test(w.id)).map((w) => w.id);
  assert.ok(newBatchIds.length > 0);
  for (const id of newBatchIds) {
    const w = wordsById.get(id);
    for (const p of w.application_prompts || []) {
      if (p.expected_word_id) {
        assert.ok(wordsById.has(p.expected_word_id), `${id}: expected_word_id "${p.expected_word_id}" existiert nicht`);
        assert.equal(p.expected_word_id, id, `${id}: expected_word_id sollte auf das eigene Wort verweisen (siehe Grading-Semantik-Befund)`);
      }
      if (p.expected_word_id && p.expected_meaning) {
        const w2 = wordsById.get(p.expected_word_id);
        assert.ok(w2.german_answers.includes(p.expected_meaning), `${id}: expected_meaning "${p.expected_meaning}" widerspricht expected_word_id (nicht in dessen german_answers)`);
      }
    }
  }
});
