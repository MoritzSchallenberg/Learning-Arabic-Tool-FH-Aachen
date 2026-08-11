// Tests für Entwicklungsauftrag 17, Abschnitt 5.2/6/22 — src/js/feedback/feedbackModel.js.
// Reine Datenfunktionen, kein DOM -- direkt per VM-Ladung mit srs.js + answerAnalyzer.js als
// Abhängigkeiten (dasselbe Muster wie answerAnalyzer.test.js).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

function loadModules() {
  const context = { console };
  vm.createContext(context);
  for (const rel of ['src/js/srs.js', 'src/js/feedback/answerAnalyzer.js', 'src/js/feedback/feedbackModel.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf-8'), context);
  }
  vm.runInContext('this.__AA = AnswerAnalyzer; this.__FM = FeedbackModel;', context);
  return { AA: context.__AA, FM: context.__FM };
}

const { AA, FM } = loadModules();

function w(id, arabic, german, extra = {}) {
  return { id, arabic, arabic_vocalized: arabic, german, german_answers: [german], ...extra };
}

test('Ergebnisvertrag (Abschnitt 6): alle geforderten Felder sind vorhanden', () => {
  const word = w('a', 'كتاب', 'Buch');
  const analysis = AA.analyzeTypedArabicAnswer(word, 'كتاب');
  const model = FM.buildForWord({ exerciseType: 'independent_typing', word, analysis });
  for (const field of ['exerciseType', 'resultCategory', 'isCorrect', 'submittedAnswer', 'expectedWordId', 'selectedWordId', 'matchedAcceptedAnswer', 'expectedAnswers', 'errorType', 'prompt', 'firstAttempt']) {
    assert.ok(field in model, `Feld "${field}" fehlt im Ergebnisvertrag`);
  }
});

test('korrekte Antwort -> isCorrect true, kein errorType', () => {
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'كتاب') });
  assert.equal(model.isCorrect, true);
  assert.equal(model.errorType, null);
  assert.equal(model.resultCategory, 'correct_full');
});

test('akzeptierte Alternative darf NICHT gleichzeitig als Fehler oder Tippfehler erscheinen', () => {
  const word = w('a', 'سَلَام', 'Frieden', { accepted_arabic_answers: ['سَلَام', 'السَّلَامُ عَلَيْكُم'] });
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'السَّلَامُ عَلَيْكُم') });
  assert.equal(model.resultCategory, 'accepted_alternative');
  assert.equal(model.isCorrect, true);
  assert.equal(model.errorType, null);
});

test('Grading-Ergebnis wird nie widersprüchlich umgedeutet: diacritics_mismatch bleibt nach der bestehenden Regel "richtig"', () => {
  const word = w('a', 'مَرْحَبًا', 'Hallo');
  const analysis = AA.analyzeTypedArabicAnswer(word, 'مَرْحَبَا'); // falsches Diakritikum
  assert.equal(analysis.category, 'diacritics_mismatch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis });
  assert.equal(model.isCorrect, true, 'Grundbuchstaben-Regel bleibt unverändert "korrekt"');
  assert.equal(model.errorType, 'diacritics');
});

test('typo/wrong_word gelten als tatsächlicher Fehler (isCorrect=false)', () => {
  const word = w('a', 'كتاب', 'Buch');
  const wrongModel = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'سيارة') });
  assert.equal(wrongModel.isCorrect, false);
  assert.equal(wrongModel.errorType, 'spelling');
});

test('leere Antwort -> eigene Kategorie, eigener Fehlertyp "empty"', () => {
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, '') });
  assert.equal(model.resultCategory, 'empty');
  assert.equal(model.isCorrect, false);
  assert.equal(model.errorType, 'empty');
});

test('Wiederholungshinweis erscheint NUR, wenn tatsächlich eine Wiederholung geplant wurde', () => {
  const word = w('a', 'كتاب', 'Buch');
  const analysis = AA.analyzeTypedArabicAnswer(word, 'سيارة');
  const withRepeat = FM.buildForWord({ exerciseType: 'x', word, analysis, repeatScheduled: true });
  const withoutRepeat = FM.buildForWord({ exerciseType: 'x', word, analysis, repeatScheduled: false });
  assert.equal(withRepeat.repeatScheduled, true);
  assert.equal(withoutRepeat.repeatScheduled, false);
});

test('Wiederholungslimit erreicht wird getrennt vom normalen Wiederholungshinweis geführt', () => {
  const word = w('a', 'كتاب', 'Buch');
  const analysis = AA.analyzeTypedArabicAnswer(word, 'سيارة');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis, repeatScheduled: false, repeatLimitReached: true });
  assert.equal(model.repeatLimitReached, true);
  assert.equal(model.repeatScheduled, false);
});

test('"Richtig mit Hilfestellung": helpUsed wird durchgereicht, ist keine Fehlermeldung', () => {
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'كتاب'), helpUsed: true });
  assert.equal(model.helpUsed, true);
  assert.equal(model.isCorrect, true);
});

test('errorType bei Auswahlaufgaben: verwechselte Wörter (mit erkannter Beziehung) -> confusion, sonst meaning', () => {
  const target = w('slow', 'بَطِيءٌ', 'langsam', { confusion_group: 'g1' });
  const relatedWrong = w('fast', 'سَرِيعٌ', 'schnell', { confusion_group: 'g1' });
  const unrelatedWrong = w('other', 'قلم', 'Stift');

  const relatedAnalysis = AA.analyzeChoiceAnswer({ targetWord: target, selectedOption: relatedWrong, isCorrect: false, domain: 'arabic_word' });
  const relatedModel = FM.buildForWord({ exerciseType: 'x', word: target, analysis: relatedAnalysis, isTyped: false });
  assert.equal(relatedModel.errorType, 'confusion');

  const unrelatedAnalysis = AA.analyzeChoiceAnswer({ targetWord: target, selectedOption: unrelatedWrong, isCorrect: false, domain: 'arabic_word' });
  const unrelatedModel = FM.buildForWord({ exerciseType: 'x', word: target, analysis: unrelatedAnalysis, isTyped: false });
  assert.equal(unrelatedModel.errorType, 'meaning');
});

test('errorTypeForAnalysis und buildForWord liefern niemals einen abweichenden Fehlertyp für dieselbe Analyse', () => {
  const target = w('slow', 'بَطِيءٌ', 'langsam', { confusion_group: 'g1' });
  const relatedWrong = w('fast', 'سَرِيعٌ', 'schnell', { confusion_group: 'g1' });
  const analysis = AA.analyzeChoiceAnswer({ targetWord: target, selectedOption: relatedWrong, isCorrect: false, domain: 'arabic_word' });
  const direct = FM.errorTypeForAnalysis(analysis, { isTyped: false });
  const viaModel = FM.buildForWord({ exerciseType: 'x', word: target, analysis, isTyped: false }).errorType;
  assert.equal(direct, viaModel);
});

// --- Zuordnungs-Abschlussfeedback (Abschnitt 13) ------------------------------------------------

test('buildMatchingGroupSummary: alle Paare richtig -> isCorrect true, keine problematischen Wörter', () => {
  const words = [w('a', 'x', 'A'), w('b', 'y', 'B')];
  const model = FM.buildMatchingGroupSummary({ groupWords: words, perWordCorrect: { a: true, b: true }, erroredWordIds: [] });
  assert.equal(model.isCorrect, true);
  assert.equal(model.problematicWords.length, 0);
  assert.equal(model.pairs.length, 2);
});

test('buildMatchingGroupSummary: Paare mit erstem Fehlversuch werden markiert, auch wenn am Ende korrekt gelöst', () => {
  const words = [w('a', 'x', 'A'), w('b', 'y', 'B')];
  const model = FM.buildMatchingGroupSummary({ groupWords: words, perWordCorrect: { a: false, b: true }, erroredWordIds: ['a'] });
  assert.equal(model.isCorrect, false);
  const pairA = model.pairs.find((p) => p.word.id === 'a');
  assert.equal(pairA.hadFirstError, true);
  assert.equal(model.problematicWords.map((w2) => w2.id).includes('a'), true);
});

test('buildMatchingGroupSummary zeigt keine rohen Wort-IDs im Titel', () => {
  const words = [w('a', 'x', 'A')];
  const model = FM.buildMatchingGroupSummary({ groupWords: words, perWordCorrect: { a: true }, erroredWordIds: [] });
  assert.ok(!model.title.includes('a_') && !/\bword_\w+/.test(model.title));
});

test('Tests stellen sicher: angezeigtes Ergebnis und gespeicherte Bewertung stimmen IMMER überein (Abschnitt 22)', () => {
  const word = w('a', 'كتاب', 'Buch');
  const cases = ['كتاب', 'كتب', 'كتا', 'سيارة', ''];
  for (const given of cases) {
    const analysis = AA.analyzeTypedArabicAnswer(word, given);
    const model = FM.buildForWord({ exerciseType: 'x', word, analysis });
    // isCorrectCategory() muss exakt widerspiegeln, was buildForWord() als isCorrect zurückgibt.
    assert.equal(model.isCorrect, FM.isCorrectCategory(analysis.category));
  }
});
