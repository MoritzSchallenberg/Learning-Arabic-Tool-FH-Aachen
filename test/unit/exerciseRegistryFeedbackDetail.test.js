// Entwicklungsauftrag 17, Abschnitt 3/6/26 — prüft, dass die Aufgabenrenderer in
// exerciseRegistry.js keine eigenen, verstreuten Feedbacktexte mehr als primäre Logik erzeugen,
// sondern stattdessen ein strukturiertes onDone-Detail liefern (selectedOption/domain für
// Auswahlaufgaben, submittedAnswer für Eingabeaufgaben), aus dem sessionController.js das
// gemeinsame Feedbackmodell baut.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');
const ExerciseGuard = require('../../src/js/exerciseGuard.js');

const ROOT = path.join(__dirname, '..', '..');

function loadExerciseRegistry() {
  const context = {
    document: createDocumentStub(),
    console,
    AudioPlayer: { speakWord: () => Promise.resolve({ source: 'recorded_audio', mode: 'normal', audioKey: null }) },
    VirtualKeyboard: { mount: () => {} }
  };
  vm.createContext(context);
  for (const rel of ['src/js/srs.js', 'src/js/wordShaping.js', 'src/js/session/exerciseRegistry.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf-8'), context);
  }
  vm.runInContext('this.__ExerciseRegistry = ExerciseRegistry;', context);
  return context.__ExerciseRegistry;
}

const ExerciseRegistry = loadExerciseRegistry();

function w(id, arabic, german, extra = {}) {
  return { id, arabic, arabic_vocalized: arabic, german, german_answers: [german], ...extra };
}

const KEYBOARD_LETTERS = [
  { id: 'lam', letter: 'ل', name: 'Lām', joining: 'dual' },
  { id: 'alif', letter: 'ا', name: 'Alif', joining: 'right' }
];

function domStubContainer() {
  return createDocumentStub().createElement('div');
}

// --- Auswahlaufgaben: kein primärer Feedbacktext mehr, strukturiertes detail ------------------

test('multiple_choice: onDone liefert selectedOption + domain, KEIN primärer Feedbacktext im DOM', () => {
  const word = w('greet_hello', 'مَرْحَبًا', 'Hallo');
  const others = [w('a', 'x', 'Eins'), w('b', 'y', 'Zwei'), w('c', 'z', 'Drei')];
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let doneArgs = null;
  ExerciseRegistry.render('multiple_choice', container, { word, allWords: [word, ...others] }, guard, (isCorrect, detail) => {
    doneArgs = { isCorrect, detail };
  });
  const btn = container.querySelectorAll('button')[0];
  btn.click();
  assert.ok(doneArgs);
  assert.ok(doneArgs.detail.selectedOption, 'detail.selectedOption sollte gesetzt sein');
  assert.equal(doneArgs.detail.domain, 'german_meaning');
  assert.ok(!container.textContent.includes('Richtig!'), 'kein alter primärer Feedbacktext mehr im Renderer selbst');
  assert.ok(!container.textContent.includes('Nicht ganz'), 'kein alter primärer Feedbacktext mehr im Renderer selbst');
});

test('german_to_arabic_choice: domain ist "arabic_word"', () => {
  const word = w('a', 'كتاب', 'Buch');
  const others = [w('b', 'x', 'Eins'), w('c', 'y', 'Zwei'), w('d', 'z', 'Drei')];
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let detail = null;
  ExerciseRegistry.render('german_to_arabic_choice', container, { word, allWords: [word, ...others] }, guard, (isCorrect, d) => { detail = d; });
  container.querySelectorAll('button')[0].click();
  assert.equal(detail.domain, 'arabic_word');
  assert.ok(detail.selectedOption);
});

test('audio_to_meaning_choice: domain ist "german_meaning", korrekte Auswahl meldet isCorrect=true', () => {
  const word = w('a', 'كتاب', 'Buch');
  const others = [w('b', 'x', 'Eins'), w('c', 'y', 'Zwei'), w('d', 'z', 'Drei')];
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let result = null;
  ExerciseRegistry.render('audio_to_meaning_choice', container, { word, allWords: [word, ...others] }, guard, (isCorrect, detail) => { result = { isCorrect, detail }; });
  const rightBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Buch');
  rightBtn.click();
  assert.equal(result.isCorrect, true);
  assert.equal(result.detail.selectedOption.id, 'a');
});

// --- Eingabeaufgaben (Stufe 8 Teil 1/2, Stufe 9) ------------------------------------------------

test('order_pieces: onDone liefert submittedAnswer + expectedForm, kein primärer Feedbacktext', () => {
  const word = w('w', 'لا', 'Nein');
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let checkFn = null;
  let result = null;
  ExerciseRegistry.render('order_pieces', container, { word, keyboardLetters: KEYBOARD_LETTERS, provideCheckAction: (fn) => { checkFn = fn; } }, guard, (isCorrect, detail) => { result = { isCorrect, detail }; });
  // Alle Kacheln in der angezeigten (zufälligen) Reihenfolge anklicken.
  container.querySelectorAll('.rating-buttons button').forEach((b) => b.click());
  checkFn();
  assert.ok(result);
  assert.equal(typeof result.detail.submittedAnswer, 'string');
  assert.equal(typeof result.detail.expectedForm, 'string');
  assert.ok(!container.textContent.includes('Richtig!'));
  assert.ok(!container.textContent.includes('Nicht ganz'));
});

test('order_pieces: Eingabebereich wird nach der Abgabe eingeklappt (Abschnitt 20)', () => {
  const word = w('w', 'لا', 'Nein');
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let checkFn = null;
  ExerciseRegistry.render('order_pieces', container, { word, keyboardLetters: KEYBOARD_LETTERS, provideCheckAction: (fn) => { checkFn = fn; } }, guard, () => {});
  checkFn();
  const collapsed = container.querySelector('.session-input-collapsed');
  assert.ok(collapsed, 'der Eingabebereich sollte nach der Abgabe die Einklapp-Klasse tragen');
});

test('guided_typing: onDone liefert submittedAnswer + result (Grading), kein primärer Feedbacktext', () => {
  const word = w('w', 'كِتَاب', 'Buch');
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let checkFn = null;
  let result = null;
  ExerciseRegistry.render('guided_typing', container, {
    word, helpConfig: { keyboardLevel: 3 }, provideCheckAction: (fn) => { checkFn = fn; }
  }, guard, (isCorrect, detail) => { result = { isCorrect, detail }; });
  const input = container.querySelector('input');
  input.value = 'كِتَاب';
  checkFn();
  assert.equal(result.isCorrect, true);
  assert.equal(result.detail.submittedAnswer, 'كِتَاب');
  assert.ok(!container.textContent.includes('Richtig!'));
});

test('independent_typing_dictation: detail.dictation ist true, deutsche Bedeutung erscheint nirgends VOR der Abgabe', () => {
  const word = w('w', 'كِتَاب', 'Buch');
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let checkFn = null;
  let result = null;
  ExerciseRegistry.render('independent_typing_dictation', container, {
    word, helpConfig: { keyboardLevel: 3 }, provideCheckAction: (fn) => { checkFn = fn; }
  }, guard, (isCorrect, detail) => { result = { isCorrect, detail }; });
  assert.ok(!container.textContent.includes('Buch'), 'die deutsche Bedeutung darf vor der Abgabe nicht sichtbar sein');
  const input = container.querySelector('input');
  input.value = 'كِتَاب';
  checkFn();
  assert.equal(result.detail.dictation, true);
});

test('guided_typing: virtuelle Tastatur wird nach der Abgabe eingeklappt (Abschnitt 20)', () => {
  const word = w('w', 'كِتَاب', 'Buch');
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let checkFn = null;
  ExerciseRegistry.render('guided_typing', container, {
    word, helpConfig: { keyboardLevel: 3 }, provideCheckAction: (fn) => { checkFn = fn; }
  }, guard, () => {});
  const input = container.querySelector('input');
  input.value = 'x';
  checkFn();
  assert.ok(container.querySelector('.session-input-collapsed'));
});

// --- Zuordnung: erroredWordIds im onDone-Detail (Abschnitt 13) ---------------------------------

test('matching: onDone-Detail enthält erroredWordIds für das Gruppen-Abschlussfeedback', () => {
  // Bewusst unterschiedliche, nicht ineinander verschachtelte deutsche Bedeutungen (nicht "A"/"B"
  // -- "Bedeutung: A" enthält als Teilstring bereits ein großes "B" aus "Bedeutung" selbst, was
  // einen naiven .includes()-Abgleich verwechselbar machen würde).
  const GROUP = [w('a', 'أَ', 'Apfel'), w('b', 'بَ', 'Birne')];
  const container = domStubContainer();
  const guard = ExerciseGuard.create();
  let detail = null;
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'arabic_german' }, guard, (isCorrect, d) => { detail = d; });
  const grid = container.querySelector('.matching-grid');
  const left = grid.children[0].querySelectorAll('button');
  const right = grid.children[1].querySelectorAll('button');
  function rightFor(id) {
    const label = id === 'a' ? 'Bedeutung: Apfel' : 'Bedeutung: Birne';
    return right.find((b) => b.getAttribute('aria-label') === label);
  }
  // Erst ein Fehlversuch (a mit B), dann beide richtig lösen.
  left[0].click();
  rightFor('b').click();
  left[0].click();
  rightFor('a').click();
  const leftAgain = grid.children[0].querySelectorAll('button').find((b) => !b.disabled);
  const rightAgain = grid.children[1].querySelectorAll('button').find((b) => !b.disabled);
  if (leftAgain && rightAgain) { leftAgain.click(); rightAgain.click(); }
  assert.ok(detail);
  assert.ok(Array.isArray(detail.erroredWordIds));
  assert.ok(detail.erroredWordIds.includes('a'));
});
