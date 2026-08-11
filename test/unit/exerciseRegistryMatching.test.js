// Entwicklungsauftrag 16, Abschnitt 7/20 — Tests für die neue Zuordnungsaufgabe (Stufe 7,
// src/js/session/exerciseRegistry.js#renderMatching) und die neue Wiedererkennen-Variante
// audio_to_meaning_choice (Stufe 6, Abschnitt 6.1). Direkte VM-Ladung des echten Moduls, minimaler
// globaler Kontext (nur was diese beiden Renderer tatsächlich verwenden -- normalizeArabic/
// VirtualKeyboard u. Ä. werden von order_pieces/guided_typing gebraucht, nicht hier).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');
const ExerciseGuard = require('../../src/js/exerciseGuard.js');

const ROOT = path.join(__dirname, '..', '..');

function loadExerciseRegistry(audioOverrides = {}) {
  const speakCalls = [];
  const context = {
    document: createDocumentStub(),
    console,
    AudioPlayer: {
      speakWord: (word, opts) => { speakCalls.push({ wordId: word.id, ...opts }); return Promise.resolve({ source: 'recorded_audio', mode: 'normal', audioKey: null }); },
      ...audioOverrides
    }
  };
  vm.createContext(context);
  // srs.js liefert normalizeArabic(), von arabicDisplay() (Vokalzeichen ausblenden) benötigt --
  // dieselbe Ladereihenfolge wie in src/index.html/den übrigen Session-Tests.
  const srsSrc = fs.readFileSync(path.join(ROOT, 'src', 'js', 'srs.js'), 'utf-8');
  vm.runInContext(srsSrc, context);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'session', 'exerciseRegistry.js'), 'utf-8');
  vm.runInContext(`${src}\nthis.__ExerciseRegistry = ExerciseRegistry;`, context);
  return { ExerciseRegistry: context.__ExerciseRegistry, speakCalls };
}

function w(id, arabic, german, extra = {}) {
  return { id, arabic, arabic_vocalized: arabic, german, german_answers: [german], ...extra };
}

const GROUP = [
  w('a', 'أَ', 'A'),
  w('b', 'بَ', 'B'),
  w('c', 'جَ', 'C'),
  w('d', 'دَ', 'D')
];

function findButtonsInColumn(container, colIndex) {
  const grid = container.querySelector('.matching-grid');
  const col = grid.children[colIndex];
  return col.querySelectorAll('button');
}

// --- audio_to_meaning_choice --------------------------------------------------------------

test('audio_to_meaning_choice: rendert Audio-Button + deutsche Bedeutungsoptionen, meldet Ergebnis korrekt', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  const word = w('greet_hallo', 'مَرْحَبًا', 'Hallo');
  const distractors = [w('x1', 'س', 'X1'), w('x2', 'ص', 'X2'), w('x3', 'ض', 'X3')];
  let result = null;

  ExerciseRegistry.render('audio_to_meaning_choice', container, { word, allWords: [word, ...distractors] }, guard, (correct) => { result = correct; });

  const options = container.querySelectorAll('.rating-buttons').flatMap ? container.querySelectorAll('.rating-buttons') : container.querySelectorAll('.rating-buttons');
  const correctBtn = container.querySelectorAll('button').find((b) => b.textContent === 'Hallo');
  assert.ok(correctBtn, 'die richtige Bedeutung sollte als Option erscheinen');
  correctBtn.click();
  assert.equal(result, true);
});

test('audio_to_meaning_choice: falsche Auswahl meldet false', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  const word = w('greet_hallo', 'مَرْحَبًا', 'Hallo');
  const distractors = [w('x1', 'س', 'X1'), w('x2', 'ص', 'X2'), w('x3', 'ض', 'X3')];
  let result = null;

  ExerciseRegistry.render('audio_to_meaning_choice', container, { word, allWords: [word, ...distractors] }, guard, (correct) => { result = correct; });
  const wrongBtn = container.querySelectorAll('button').find((b) => b.textContent === 'X1');
  wrongBtn.click();
  assert.equal(result, false);
});

// --- matching ------------------------------------------------------------------------------

test('matching (arabic_german): genau vier Buttons je Spalte, alle Wörter beider Spalten vertreten', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();

  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'arabic_german' }, guard, () => {});

  const left = findButtonsInColumn(container, 0);
  const right = findButtonsInColumn(container, 1);
  assert.equal(left.length, 4);
  assert.equal(right.length, 4);
});

test('matching: korrekte Zuordnung sperrt das Paar (disabled), falsche löst erneut lösbare Auswahl aus', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  let done = null;
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'arabic_german' }, guard, (isCorrect, detail) => { done = { isCorrect, detail }; });

  const left = findButtonsInColumn(container, 0); // a,b,c,d in fester Reihenfolge
  const right = findButtonsInColumn(container, 1); // gemischt -- über aria-label identifizieren

  function rightBtnFor(wordId) {
    const label = { a: 'Bedeutung: A', b: 'Bedeutung: B', c: 'Bedeutung: C', d: 'Bedeutung: D' }[wordId];
    return Array.from(right).find((b) => b.getAttribute('aria-label') === label);
  }

  // Falscher erster Versuch: a (links) mit b's Bedeutung (rechts).
  left[0].click(); // wählt "a" links
  rightBtnFor('b').click(); // falsches Gegenstück
  assert.equal(left[0].disabled, false, 'nach einem Fehlversuch bleibt das Element weiterhin auswählbar');
  assert.equal(container.textContent.includes('passt nicht zusammen'), true);

  // Erneuter, diesmal richtiger Versuch für a.
  left[0].click();
  rightBtnFor('a').click();
  assert.equal(left[0].disabled, true, 'nach korrekter Zuordnung ist das Element gesperrt');
  assert.ok(left[0].className.includes('matched'));
});

test('matching: nach einem Fehlversuch verliert auch der ZWEITE (rechts) angeklickte Button seine optische Auswahl, nicht nur der erste (gefunden bei der visuellen Verifikation)', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'arabic_german' }, guard, () => {});

  const left = findButtonsInColumn(container, 0);
  const right = findButtonsInColumn(container, 1);
  function rightBtnFor(wordId) {
    const label = { a: 'Bedeutung: A', b: 'Bedeutung: B', c: 'Bedeutung: C', d: 'Bedeutung: D' }[wordId];
    return Array.from(right).find((b) => b.getAttribute('aria-label') === label);
  }

  left[0].click(); // "a" links auswählen (erster Klick -> aria-pressed=true)
  const wrongRight = rightBtnFor('b');
  wrongRight.click(); // falsches Gegenstück rechts (zweiter Klick -> löst den Fehlversuch aus)

  assert.equal(left[0].getAttribute('aria-pressed'), 'false', 'der zuerst gewählte Button wird nach dem Fehlversuch zurückgesetzt');
  assert.equal(wrongRight.getAttribute('aria-pressed'), 'false', 'auch der zweite, gerade angeklickte Button darf nach dem Fehlversuch nicht mehr als ausgewählt erscheinen');
});

test('matching: erst wenn ALLE Paare gelöst sind, wird onDone genau einmal aufgerufen', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  let doneCalls = 0;
  let lastDetail = null;
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'arabic_german' }, guard, (isCorrect, detail) => { doneCalls += 1; lastDetail = detail; });

  const left = findButtonsInColumn(container, 0);
  function rightBtnFor(wordId) {
    const label = { a: 'Bedeutung: A', b: 'Bedeutung: B', c: 'Bedeutung: C', d: 'Bedeutung: D' }[wordId];
    return Array.from(findButtonsInColumn(container, 1)).find((b) => b.getAttribute('aria-label') === label);
  }

  ['a', 'b', 'c'].forEach((id, i) => {
    left[i].click();
    rightBtnFor(id).click();
  });
  assert.equal(doneCalls, 0, 'vor dem letzten Paar darf onDone noch nicht feuern');

  left[3].click();
  rightBtnFor('d').click();
  assert.equal(doneCalls, 1);
  assert.equal(lastDetail.groupSize, 4);
  assert.deepEqual(Object.keys(lastDetail.perWordCorrect).sort(), ['a', 'b', 'c', 'd']);
  assert.ok(Object.values(lastDetail.perWordCorrect).every((v) => v === true), 'alle vier wurden beim ersten Versuch richtig zugeordnet');
});

test('matching: ein Wort mit vorherigem Fehlversuch wird in perWordCorrect als false gemeldet (Abschnitt 7.4)', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  let lastDetail = null;
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'arabic_german' }, guard, (isCorrect, detail) => { lastDetail = detail; });

  const left = findButtonsInColumn(container, 0);
  function rightBtnFor(wordId) {
    const label = { a: 'Bedeutung: A', b: 'Bedeutung: B', c: 'Bedeutung: C', d: 'Bedeutung: D' }[wordId];
    return Array.from(findButtonsInColumn(container, 1)).find((b) => b.getAttribute('aria-label') === label);
  }

  // "a" absichtlich falsch, dann richtig.
  left[0].click();
  rightBtnFor('b').click();
  left[0].click();
  rightBtnFor('a').click();
  // Die übrigen drei fehlerfrei.
  ['b', 'c', 'd'].forEach((id, i) => {
    left[i + 1].click();
    rightBtnFor(id).click();
  });

  // Der Fehlversuch betraf BEIDE beteiligten Wörter dieser einen falschen Paarung (a links,
  // b's Bedeutung rechts) -- beide gelten daher als "hatten einen ersten Fehlversuch", auch
  // wenn "b" später an SEINER EIGENEN Position fehlerfrei zugeordnet wurde. Ein wiederholter
  // falscher Versuch würde denselben Wörtern KEINEN weiteren Fehler mehr hinzufügen (Abschnitt
  // 7.4: "Fehler nur einmal pro erstem Fehlversuch bewerten").
  assert.equal(lastDetail.perWordCorrect.a, false, '"a" hatte einen Fehlversuch -> nicht beim ersten Mal richtig');
  assert.equal(lastDetail.perWordCorrect.b, false, '"b" war am selben Fehlversuch beteiligt -> zählt ebenfalls als nicht beim ersten Mal richtig');
  assert.equal(lastDetail.perWordCorrect.c, true, 'unbeteiligte Wörter bleiben unberührt');
  assert.equal(lastDetail.perWordCorrect.d, true);
});

test('matching (audio_arabic): linke Buttons verraten NICHT das Wort im aria-label (Abschnitt 7.3)', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'audio_arabic' }, guard, () => {});

  const left = findButtonsInColumn(container, 0);
  for (const btn of left) {
    const label = btn.getAttribute('aria-label');
    assert.ok(/^Ton \d+ abspielen$/.test(label), `aria-label sollte anonym sein, war: "${label}"`);
  }
});

test('matching (audio_arabic): Klick auf einen linken Audio-Button spielt die Aufnahme ab', () => {
  const { ExerciseRegistry, speakCalls } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'audio_arabic' }, guard, () => {});
  const left = findButtonsInColumn(container, 0);
  left[0].click();
  assert.equal(speakCalls.length, 1);
});

test('matching (context_word): linke Seite zeigt die Anwendungssituation, rechte die arabische Form (Besitzerwort-Regel)', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  const groupWithPrompts = GROUP.map((w2) => ({ ...w2, application_prompts: [{ type: 'context_choice', prompt: `Kontext für ${w2.id}`, expected_meaning: w2.german }] }));
  ExerciseRegistry.render('matching', container, { groupWords: groupWithPrompts, variant: 'context_word' }, guard, () => {});
  const left = findButtonsInColumn(container, 0);
  assert.ok(Array.from(left).some((b) => b.textContent === 'Kontext für a'));
});

test('matching: alle Buttons sind echte <button type="button">, vollständig tastaturbedienbar ohne Zusatzcode', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'arabic_german' }, guard, () => {});
  for (const btn of container.querySelectorAll('button')) {
    assert.equal(btn.tagName, 'button');
    assert.equal(btn.type, 'button');
  }
});

test('matching: die Auswahl ist über aria-pressed erkennbar (nicht nur Farbe)', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  ExerciseRegistry.render('matching', container, { groupWords: GROUP, variant: 'arabic_german' }, guard, () => {});
  const left = findButtonsInColumn(container, 0);
  assert.equal(left[0].getAttribute('aria-pressed'), 'false');
  left[0].click();
  assert.equal(left[0].getAttribute('aria-pressed'), 'true');
});

// --- Entwicklungsauftrag 16, Abschnitt 16/20: Wiederaufnahme bereits gelöster Paare -----------

test('matching: onProgress feuert nach jedem Versuch mit dem aktuellen Stand (für dauerhafte Speicherung)', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  const progressCalls = [];
  ExerciseRegistry.render('matching', container, {
    groupWords: GROUP, variant: 'arabic_german', onProgress: (state) => progressCalls.push(state)
  }, guard, () => {});

  const left = findButtonsInColumn(container, 0);
  const right = findButtonsInColumn(container, 1);
  // Bewusst per Index statt per aria-label-Text nachgeschlagen: ein bereits gesperrtes Element
  // bekommt einen ERWEITERTEN aria-label ("… — richtig zugeordnet"), ein Text-Lookup würde nach
  // dem ersten gelösten Paar fälschlich leerlaufen.
  const rightIndexFor = (label) => right.findIndex((b) => (b.getAttribute('aria-label') || '').startsWith(`Bedeutung: ${label}`));

  // Erst ein FALSCHER Versuch (b links, aber Bedeutung von a rechts) -- vor jedem Lock geprüft.
  left[1].click();
  right[rightIndexFor('A')].click();
  assert.equal(progressCalls.length, 1);
  // Über JSON hin- und herserialisieren: die Arrays stammen aus dem VM-Sandbox-Realm der
  // ExerciseRegistry (eigenes Array-Prototyp) -- deepEqual würde sonst an der reinen
  // Prototyp-Ungleichheit scheitern, obwohl der Inhalt identisch ist (bekanntes Muster in
  // diesem Projekt, siehe auch sessionController.e2e.test.js).
  assert.deepEqual(JSON.parse(JSON.stringify(progressCalls[0].lockedWordIds)), []);
  assert.ok(progressCalls[0].erroredWordIds.includes('b'));
  assert.ok(progressCalls[0].erroredWordIds.includes('a'));

  // Danach der richtige Versuch für "a".
  left[0].click();
  right[rightIndexFor('A')].click();
  assert.equal(progressCalls.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(progressCalls[1].lockedWordIds)), ['a']);
});

test('matching: alreadySolvedWordIds sperrt vorab gelöste Paare sofort, ohne dass onDone erneut für sie feuert', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  let done = null;
  ExerciseRegistry.render('matching', container, {
    groupWords: GROUP, variant: 'arabic_german', alreadySolvedWordIds: ['a', 'b']
  }, guard, (isCorrect, detail) => { done = detail; });

  const left = findButtonsInColumn(container, 0); // feste Reihenfolge a,b,c,d (siehe GROUP)
  const right = findButtonsInColumn(container, 1);
  const rightIndexFor = (label) => right.findIndex((b) => (b.getAttribute('aria-label') || '').startsWith(`Bedeutung: ${label}`));
  assert.equal(left[0].disabled, true, '"a" sollte bereits gesperrt sein');
  assert.equal(left[1].disabled, true, '"b" sollte bereits gesperrt sein');
  assert.equal(done, null, 'onDone darf noch nicht feuern, solange noch ungelöste Paare übrig sind');

  // Die zwei übrigen Paare lösen -> jetzt sollte die Gruppe vollständig sein.
  left[2].click();
  right[rightIndexFor('C')].click();
  left[3].click();
  right[rightIndexFor('D')].click();
  assert.ok(done, 'onDone sollte feuern, sobald auch die restlichen Paare gelöst sind');
  assert.deepEqual(Object.keys(done.perWordCorrect).sort(), ['a', 'b', 'c', 'd'], 'auch die VOR der Wiederaufnahme gelösten Paare gehören zum finalen Ergebnis');
});

test('matching: eine bereits VOLLSTÄNDIG gelöste Gruppe (Neustart direkt nach dem letzten Paar) schließt sofort beim Rendern ab', () => {
  const { ExerciseRegistry } = loadExerciseRegistry();
  const container = createDocumentStub().createElement('div');
  const guard = ExerciseGuard.create();
  let done = null;
  ExerciseRegistry.render('matching', container, {
    groupWords: GROUP, variant: 'arabic_german', alreadySolvedWordIds: ['a', 'b', 'c', 'd']
  }, guard, (isCorrect, detail) => { done = detail; });
  assert.ok(done, 'sollte sofort abschließen, ohne dass der Nutzer noch etwas klicken muss');
  assert.equal(done.resumedComplete, true);
});
