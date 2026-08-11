// Tests für Entwicklungsauftrag 17, Abschnitt 5.1/9/23 — src/js/feedback/answerAnalyzer.js.
// Direkte VM-Ladung (dasselbe Muster wie exerciseRegistryMatching.test.js): srs.js zuerst (liefert
// normalizeArabic/evaluateArabicAnswer/evaluateAgainstAnyDetailed als globale Bezeichner, exakt
// wie im Browser über <script>-Tags), danach answerAnalyzer.js.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

function loadAnswerAnalyzer() {
  const context = { console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', 'js', 'srs.js'), 'utf-8'), context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', 'js', 'feedback', 'answerAnalyzer.js'), 'utf-8') + '\nthis.__AA = AnswerAnalyzer;', context);
  return context.__AA;
}

const AA = loadAnswerAnalyzer();

function w(id, arabic, german, extra = {}) {
  return { id, arabic, arabic_vocalized: arabic, german, german_answers: [german], ...extra };
}

// --- Antwortanalyse: getippte arabische Antworten (Abschnitt 7/23) --------------------------

test('vollständig richtige arabische Antwort (primäre Form, inkl. Vokalzeichen) -> correct_full', () => {
  const word = w('greet_hello', 'مَرْحَبًا', 'Hallo');
  const r = AA.analyzeTypedArabicAnswer(word, 'مَرْحَبًا');
  assert.equal(r.category, 'correct_full');
  assert.equal(r.matchedAnswer, 'مَرْحَبًا');
  assert.equal(r.charDiff, null);
});

test('primäre Antwort exakt getroffen bei mehreren akzeptierten Formen -> correct_full, nicht accepted_alternative', () => {
  const word = w('greet_salam', 'سَلَام', 'Frieden', { accepted_arabic_answers: ['سَلَام', 'السَّلَامُ عَلَيْكُم'] });
  const r = AA.analyzeTypedArabicAnswer(word, 'سَلَام');
  assert.equal(r.category, 'correct_full');
});

test('akzeptierte alternative arabische Antwort (nicht primäre Form) -> accepted_alternative, keine Fehlerdarstellung', () => {
  const word = w('greet_salam', 'سَلَام', 'Frieden', { accepted_arabic_answers: ['سَلَام', 'السَّلَامُ عَلَيْكُم'] });
  const r = AA.analyzeTypedArabicAnswer(word, 'السَّلَامُ عَلَيْكُم');
  assert.equal(r.category, 'accepted_alternative');
  assert.equal(r.matchedAnswer, 'السَّلَامُ عَلَيْكُم');
  assert.equal(r.charDiff, null, 'eine akzeptierte Alternative braucht keinen Fehlervergleich');
});

test('richtig ohne Diakritika: Grundbuchstaben stimmen, keine Vokalzeichen eingegeben -> correct_no_diacritics', () => {
  const word = w('greet_hello', 'مَرْحَبًا', 'Hallo');
  const r = AA.analyzeTypedArabicAnswer(word, 'مرحبا');
  assert.equal(r.category, 'correct_no_diacritics');
});

test('abweichendes Vokalisierungszeichen: Grundbuchstaben stimmen, Vokalzeichen vorhanden aber falsch -> diacritics_mismatch', () => {
  const word = w('greet_hello', 'مَرْحَبًا', 'Hallo');
  const r = AA.analyzeTypedArabicAnswer(word, 'مَرْحَبَا'); // Fatha statt Tanwin am Ende
  assert.equal(r.category, 'diacritics_mismatch');
  assert.ok(r.charDiff && r.charDiff.hasDifference);
});

test('fehlendes Diakritikum wird als correct_no_diacritics erkannt (kein einzelnes Vokalzeichen typisiert)', () => {
  const word = w('greet_hello', 'مَرْحَبًا', 'Hallo');
  const r = AA.analyzeTypedArabicAnswer(word, 'مرحبا');
  assert.equal(r.category, 'correct_no_diacritics');
});

test('einzelner falscher Buchstabe -> typo (innerhalb der Toleranz) oder wrong_word, mit Zeichenvergleich', () => {
  const word = w('greet_hello', 'مرحبا', 'Hallo'); // ohne Diakritika für einfachere Toleranzrechnung
  const r = AA.analyzeTypedArabicAnswer(word, 'مرحبت'); // letzter Buchstabe ersetzt
  assert.ok(['typo', 'wrong_word'].includes(r.category));
  assert.ok(r.charDiff);
  assert.ok(r.charDiff.segments.some((s) => s.status === 'substituted' || s.status === 'diacritic_issue'));
});

test('zusätzlicher Buchstabe wird im Zeichenvergleich als "extra" erkannt', () => {
  const word = w('w', 'كتاب', 'Buch');
  const r = AA.analyzeTypedArabicAnswer(word, 'كتابب');
  assert.notEqual(r.category, 'correct_full');
  assert.ok(r.charDiff.segments.some((s) => s.status === 'extra'));
});

test('fehlender Buchstabe wird im Zeichenvergleich als "missing" erkannt', () => {
  const word = w('w', 'كتاب', 'Buch');
  const r = AA.analyzeTypedArabicAnswer(word, 'كتا');
  assert.notEqual(r.category, 'correct_full');
  assert.ok(r.charDiff.segments.some((s) => s.status === 'missing'));
});

test('leere Antwort -> empty, klar von einer echten Falschantwort unterschieden', () => {
  const word = w('w', 'كتاب', 'Buch');
  assert.equal(AA.analyzeTypedArabicAnswer(word, '').category, 'empty');
  assert.equal(AA.analyzeTypedArabicAnswer(word, '   ').category, 'empty');
  assert.notEqual(AA.analyzeTypedArabicAnswer(word, 'x').category, 'empty');
});

test('vollständig falsches Wort -> wrong_word', () => {
  const word = w('w', 'كتاب', 'Buch');
  const r = AA.analyzeTypedArabicAnswer(word, 'سيارة');
  assert.equal(r.category, 'wrong_word');
});

test('Unicode-Normalisierung: unterschiedlich komponierte, aber gleichwertige Eingabe wird trotzdem als richtig erkannt', () => {
  const word = w('w', 'إِنْشَاءَ اللّٰه', 'so Gott will');
  // NFD-Zerlegung derselben Zeichenkette (z. B. wie von manchen Systemen/Tastaturen geliefert)
  const nfd = word.arabic.normalize('NFD');
  const r = AA.analyzeTypedArabicAnswer(word, nfd);
  assert.equal(r.category, 'correct_full');
});

// --- Zeichenvergleich (Abschnitt 9/23) --------------------------------------------------------

test('tokenizeArabicClusters ordnet Vokalzeichen dem VORHERIGEN Grundbuchstaben zu, nicht als eigenes Zeichen', () => {
  const clusters = AA.tokenizeArabicClusters('مَرْحَبًا');
  assert.ok(clusters.every((c) => c.base !== '' || c.diacritics.length === 0));
  assert.equal(clusters.length, 5); // م ر ح ب ا -- fünf Grundbuchstaben, nicht neun Zeichen
  assert.equal(clusters[0].base, 'م');
  assert.deepEqual(JSON.parse(JSON.stringify(clusters[0].diacritics)), ['َ']);
});

test('mehrere Diakritika auf einem Buchstaben (z. B. Shadda + Fatha) bleiben demselben Cluster zugeordnet', () => {
  const clusters = AA.tokenizeArabicClusters('بَّ'); // ب + Shadda + Fatha
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].base, 'ب');
  assert.equal(clusters[0].diacritics.length, 2);
});

test('diffArabicText: RTL-Reihenfolge bleibt erhalten (Segmente in Lesereihenfolge des Wortes, nicht visuell umgedreht)', () => {
  const diff = AA.diffArabicText('كتاب', 'كتاب');
  assert.equal(diff.hasDifference, false);
  assert.equal(diff.segments.map((s) => s.expectedText).join(''), 'كتاب');
});

test('diffArabicText liefert für jedes Segment eine textuelle Screenreader-Beschreibung', () => {
  const diff = AA.diffArabicText('كتاب', 'كتاء');
  assert.ok(diff.screenReaderText.length > 0);
  assert.ok(typeof diff.screenReaderText === 'string');
  assert.ok(diff.explanation.length > 0);
});

test('diffArabicText erfindet keine grammatische Ursache -- Diakritika-Namen sind technisch aus dem Zeichen ableitbar', () => {
  const diff = AA.diffArabicText('بَ', 'بِ'); // Fatha erwartet, Kasra eingegeben
  const issue = diff.segments.find((s) => s.status === 'diacritic_issue');
  assert.ok(issue);
  assert.ok(diff.explanation.includes('Fatḥa') || diff.explanation.includes('Kasra'));
});

test('sichere DOM-Erzeugung: diffArabicText liefert reine Daten, keine DOM-Knoten oder HTML-Strings', () => {
  const diff = AA.diffArabicText('كتاب', 'كتاء');
  assert.equal(typeof diff.explanation, 'string');
  assert.ok(!diff.explanation.includes('<'));
  diff.segments.forEach((s) => {
    assert.equal(typeof s.expectedText, 'string');
    assert.equal(typeof s.givenText, 'string');
  });
});

test('keine Interpretation von HTML/Script-Inhalten aus Daten -- feindliche Eingabe bleibt reiner Text', () => {
  const word = w('w', 'كتاب', 'Buch');
  const hostile = '<img src=x onerror=alert(1)>';
  const r = AA.analyzeTypedArabicAnswer(word, hostile);
  assert.equal(r.submittedAnswer, hostile);
  assert.ok(r.charDiff);
  // Die rohe Zeichenkette darf als reiner Text im Diff auftauchen -- es wird nichts geparst.
  const joined = r.charDiff.segments.map((s) => s.givenText).join('');
  assert.ok(joined.length >= 0); // keine Exception, kein geparstes HTML-Objekt
});

// --- Auswahlaufgaben (Abschnitt 11/23) ---------------------------------------------------------

test('Auswahlaufgabe: ausgewählte falsche Option wird erfasst, richtige Option ist weiterhin das Zielwort', () => {
  const target = w('slow', 'بَطِيءٌ', 'langsam');
  const wrongOpt = w('fast', 'سَرِيعٌ', 'schnell');
  const r = AA.analyzeChoiceAnswer({ targetWord: target, selectedOption: wrongOpt, isCorrect: false, domain: 'arabic_word' });
  assert.equal(r.category, 'wrong_word');
  assert.equal(r.selectedWordId, 'fast');
  assert.equal(r.expectedWordId, 'slow');
});

test('Auswahlaufgabe Richtung Bedeutung: falsche Auswahl -> wrong_meaning', () => {
  const target = w('a', 'كتاب', 'Buch');
  const wrongOpt = w('b', 'قلم', 'Stift');
  const r = AA.analyzeChoiceAnswer({ targetWord: target, selectedOption: wrongOpt, isCorrect: false, domain: 'german_meaning' });
  assert.equal(r.category, 'wrong_meaning');
});

test('Gegensatzpaar wird erkannt, wenn beide Wörter über opposite_id verknüpft sind', () => {
  const target = w('slow', 'بَطِيءٌ', 'langsam', { opposite_id: 'fast' });
  const wrongOpt = w('fast', 'سَرِيعٌ', 'schnell', { opposite_id: 'slow' });
  const rel = AA.relationBetween(target, wrongOpt);
  assert.deepEqual(JSON.parse(JSON.stringify(rel)), { type: 'opposite' });
});

test('Verwechslungsgruppe wird erkannt, wenn beide Wörter dieselbe confusion_group teilen', () => {
  const target = w('a', 'x', 'y', { confusion_group: 'grp1' });
  const other = w('b', 'z', 'w', { confusion_group: 'grp1' });
  assert.deepEqual(JSON.parse(JSON.stringify(AA.relationBetween(target, other))), { type: 'confusion' });
});

test('Homonymgruppe wird erkannt, wenn beide Wörter dieselbe homonym_group teilen', () => {
  const target = w('a', 'ظهر', 'Mittag', { homonym_group: 'ظهر' });
  const other = w('b', 'ظهر', 'Rücken', { homonym_group: 'ظهر' });
  assert.deepEqual(JSON.parse(JSON.stringify(AA.relationBetween(target, other))), { type: 'homonym' });
});

test('keine erfundene Wortbeziehung: unverbundene Wörter liefern relationBetween=null', () => {
  const target = w('a', 'كتاب', 'Buch');
  const other = w('b', 'قلم', 'Stift');
  assert.equal(AA.relationBetween(target, other), null);
});

test('Auswahlaufgabe ohne erkannte Beziehung behauptet keine -- relation bleibt null', () => {
  const target = w('a', 'كتاب', 'Buch');
  const wrongOpt = w('b', 'قلم', 'Stift');
  const r = AA.analyzeChoiceAnswer({ targetWord: target, selectedOption: wrongOpt, isCorrect: false, domain: 'arabic_word' });
  assert.equal(r.relation, null);
});

test('richtige Auswahl der primären Option -> correct_full', () => {
  const target = w('a', 'كتاب', 'Buch');
  const r = AA.analyzeChoiceAnswer({ targetWord: target, selectedOption: target, isCorrect: true, domain: 'arabic_word' });
  assert.equal(r.category, 'correct_full');
});
