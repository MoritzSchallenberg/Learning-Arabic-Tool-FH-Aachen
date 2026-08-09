// Inhaltstests für Kurs 1, Units 21-25 (Entwicklungsauftrag 10, Abschnitt 9 — deckt exakt die 25
// dort genannten Prüfpunkte ab, plus einen datenbasierten Render-/Ablauftest für alle 15 neuen
// Theoriedokumente). Prüft direkt gegen die echten Sprachpaketdateien (kein Mock).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createDocumentStub } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const AUDIO_DIR = path.join(PACK, 'audio', 'vocabulary');
const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const vocabSessions = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabSessions.json'), 'utf-8'));
const theoryData = JSON.parse(fs.readFileSync(path.join(PACK, 'theory.json'), 'utf-8'));

const words = vocabulary.categories.flatMap((c) => c.words);
const wordsById = new Map(words.map((w) => [w.id, w]));

const UNIT_IDS = ['vocab_unit_21', 'vocab_unit_22', 'vocab_unit_23', 'vocab_unit_24', 'vocab_unit_25'];
const NEW_WORD_IDS = words.filter((w) => UNIT_IDS.includes(w.unit_id) && w.id.startsWith('c1_')).map((w) => w.id);
const PREVIOUSLY_COMPLETE = [
  'transport_car', 'transport_bus', 'transport_train', 'transport_plane', 'transport_bike', 'transport_ship',
  'school_bag', 'school_board', 'school_eraser', 'school_ruler',
  'uni_university', 'uni_student_m', 'uni_student_f', 'uni_professor', 'uni_lecture', 'uni_exam', 'uni_library',
  'job_doctor', 'job_engineer', 'job_teacher', 'job_nurse', 'job_police', 'job_cook', 'job_driver'
];

// 1. Zusammen genau 150 Wörter.
test('Units 21-25: genau 150 Wörter (24 bestehende + 126 neue)', () => {
  const unitWords = words.filter((w) => UNIT_IDS.includes(w.unit_id));
  assert.equal(unitWords.length, 150);
  // 2. Genau 126 neue und 24 bestehende Wörter.
  assert.equal(NEW_WORD_IDS.length, 126);
  assert.equal(PREVIOUSLY_COMPLETE.length, 24);
});

// 3. Jede Unit hat 30 Wörter. 4. Jede Session hat 10 Wörter.
test('Units 21-25: jede Unit hat genau 30 Wörter, jede Session genau 10', () => {
  for (const unitId of UNIT_IDS) {
    const n = words.filter((w) => w.unit_id === unitId).length;
    assert.equal(n, 30, `${unitId} sollte 30 Wörter haben, hat ${n}`);
  }
  const sessions = vocabSessions.sessions.filter((s) => UNIT_IDS.includes(s.unit_id));
  assert.equal(sessions.length, 15);
  for (const s of sessions) assert.equal(s.new_word_ids.length, 10, `${s.session_id} sollte genau 10 Wörter haben`);
});

// 5. Keine doppelten IDs.
test('Units 21-25: keine doppelten Wort-IDs', () => {
  const unitWords = words.filter((w) => UNIT_IDS.includes(w.unit_id));
  assert.equal(new Set(unitWords.map((w) => w.id)).size, unitWords.length);
});

// 6. Bestehende Wörter bleiben erhalten.
test('Units 21-25: die 24 bereits vorher vollständigen Wörter wurden nicht verändert/verschoben', () => {
  for (const id of PREVIOUSLY_COMPLETE) {
    const w = wordsById.get(id);
    assert.ok(w, `Wort "${id}" sollte weiterhin existieren`);
    assert.ok(!id.startsWith('c1_'), `${id} sollte keine c1_-ID sein (Bestandswort)`);
    assert.ok(UNIT_IDS.includes(w.unit_id), `${id} sollte weiterhin einer der Units 21-25 zugeordnet sein`);
  }
});

// 7. Alle 126 Wörter erfüllen das vollständige Lernmodell.
test('Units 21-25: jedes neue Wort erfüllt das "lernfähige" Datenmodell', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(w, `Wort "${id}" sollte in vocabulary.json existieren`);
    assert.ok(typeof w.arabic_vocalized === 'string' && w.arabic_vocalized.trim(), `${id}: arabic_vocalized fehlt`);
    assert.ok(typeof w.arabic_unvocalized === 'string' && w.arabic_unvocalized.trim(), `${id}: arabic_unvocalized fehlt`);
    assert.ok(Array.isArray(w.german_answers) && w.german_answers.length > 0, `${id}: german_answers fehlt/leer`);
    assert.ok(typeof w.transliteration === 'string' && w.transliteration.trim(), `${id}: transliteration fehlt`);
    assert.ok(typeof w.part_of_speech === 'string' && w.part_of_speech.trim(), `${id}: part_of_speech fehlt`);
    assert.ok(Array.isArray(w.accepted_arabic_answers) && w.accepted_arabic_answers.length > 0, `${id}: accepted_arabic_answers fehlt/leer`);
    assert.equal(w.content_status, 'needs_language_review', `${id}: content_status sollte weiterhin "needs_language_review" sein`);
  }
});

// 8. Substantive besitzen bearbeitete Genus- und Pluralfelder.
test('Units 21-25: Substantive haben ein bearbeitetes gender-/plural-Feld (auch wenn null)', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    if (w.part_of_speech === 'Substantiv' || w.part_of_speech === 'Substantiv/Adjektiv' || w.part_of_speech === 'Substantiv (Pluraletantum)') {
      assert.ok('gender' in w, `${id}: Substantiv ohne bearbeitetes gender-Feld`);
      assert.ok('plural' in w, `${id}: Substantiv ohne bearbeitetes plural-Feld`);
    }
  }
});

// 9. Alle Wortarten sind gültig.
test('Units 21-25: alle part_of_speech-Werte gehören zum zentralen Vokabular (inkl. "Präposition")', () => {
  const KNOWN_PART_OF_SPEECH = new Set(require('../../scripts/partOfSpeechVocabulary.js').PART_OF_SPEECH_VALUES);
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(KNOWN_PART_OF_SPEECH.has(w.part_of_speech), `${id}: part_of_speech "${w.part_of_speech}" ist nicht im zentralen Vokabular`);
  }
  const prepositions = NEW_WORD_IDS.map((id) => wordsById.get(id)).filter((w) => w.part_of_speech === 'Präposition');
  assert.ok(prepositions.length >= 15, 'Unit 21 sollte eine zweistellige Zahl echter Präpositionen enthalten');
});

// 10. Alle Application-Prompts sind vollständig.
test('Units 21-25: jedes neue Wort hat mindestens einen gültigen application_prompt', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(Array.isArray(w.application_prompts) && w.application_prompts.length > 0, `${id}: application_prompts fehlt/leer`);
    for (const p of w.application_prompts) {
      assert.ok(p.prompt && p.prompt.trim(), `${id}: application_prompt ohne "prompt"`);
      assert.ok(p.expected_meaning || p.expected_word_id, `${id}: application_prompt ohne "expected_meaning"/"expected_word_id"`);
    }
  }
});

// 11. Alle expected_word_id-Verweise existieren.
test('Units 21-25: application_prompts referenzieren keine unbekannten expected_word_id', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    for (const p of w.application_prompts) {
      if (p.expected_word_id) assert.ok(wordsById.has(p.expected_word_id), `${id}: expected_word_id "${p.expected_word_id}" existiert nicht`);
    }
  }
});

// 12. Application-Aufgaben werden korrekt bewertet (Live-Render-Stichprobe; die vollständige,
// mehrere Wortarten abdeckende Untersuchung steht in test/unit/applicationPromptGrading.test.js).
test('Units 21-25: eine Application-Aufgabe wird für ein neues Wort live korrekt bewertet (Stichprobe c1_u22_01)', () => {
  const context = { console };
  vm.createContext(context);
  const src = ['src/js/srs.js', 'src/js/exerciseGuard.js', 'src/js/session/exerciseRegistry.js']
    .map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${src}\nthis.__ExerciseRegistry = ExerciseRegistry;\nthis.__ExerciseGuard = ExerciseGuard;`, context);
  const doc = createDocumentStub();
  context.document = doc;
  const word = wordsById.get('c1_u22_01');
  const container = doc.createElement('div');
  const guard = context.__ExerciseGuard.create();
  let result = null;
  context.__ExerciseRegistry.render('contextual_choice', container, { word, allWords: words, helpConfig: { showDiacritics: 'full' }, settings: {} }, guard, (isCorrect) => { result = isCorrect; });
  const correctBtn = container.findAllButtons().find((b) => b.textContent === (word.arabic_vocalized || word.arabic));
  assert.ok(correctBtn, 'Button für die korrekte Option sollte gefunden werden');
  correctBtn.click();
  assert.equal(result, true);
});

// 13. Alle 15 Theoriedokumente sind vollständig. 14. Theorie und Wortlisten stimmen überein.
test('Units 21-25: alle 15 Sessions haben vollständige, keine Platzhalter-Theorie, exakt passend zum Wortbestand', () => {
  const sessions = vocabSessions.sessions.filter((s) => UNIT_IDS.includes(s.unit_id));
  assert.equal(sessions.length, 15);
  for (const s of sessions) {
    const doc = theoryData.theories.find((t) => t.theory_id === s.theory_id);
    assert.ok(doc, `Theoriedokument "${s.theory_id}" sollte existieren`);
    assert.notEqual(doc.is_placeholder, true, `${s.theory_id} sollte kein Platzhalter mehr sein`);
    assert.equal(doc.content_status, 'needs_language_review');
    assert.ok(Array.isArray(doc.learning_objectives) && doc.learning_objectives.length >= 2, `${s.theory_id}: mindestens 2 Lernziele erwartet`);

    const paragraphs = doc.blocks.filter((b) => b.type === 'paragraph');
    assert.ok(paragraphs.some((b) => !b.level || b.level === 'short'), `${s.theory_id}: "Kurz erklärt"-Text fehlt`);
    assert.ok(paragraphs.some((b) => b.level === 'full'), `${s.theory_id}: "Mehr erfahren"-Text fehlt`);

    const preview = doc.blocks.find((b) => b.type === 'word_preview');
    assert.ok(preview, `${s.theory_id}: word_preview-Block fehlt`);
    assert.equal(preview.word_ids.length, 10, `${s.theory_id}: word_preview sollte genau 10 Wort-IDs enthalten`);
    assert.deepEqual([...preview.word_ids].sort(), [...s.new_word_ids].sort(), `${s.theory_id}: word_preview sollte exakt den Sessionwörtern entsprechen`);

    const examples = doc.blocks.filter((b) => b.type === 'example');
    assert.ok(examples.length >= 2, `${s.theory_id}: mindestens 2 Beispiele erwartet`);

    const miniCheck = doc.blocks.find((b) => b.type === 'mini_check');
    assert.ok(miniCheck, `${s.theory_id}: mini_check-Block fehlt`);
    assert.ok(miniCheck.questions.length >= 2, `${s.theory_id}: mindestens 2 Mini-Check-Fragen erwartet`);
    for (const q of miniCheck.questions) {
      assert.ok(q.options.some((o) => o.correct), `${s.theory_id}: jede Mini-Check-Frage braucht mindestens eine richtige Option`);
    }

    const merke = doc.blocks.find((b) => b.type === 'callout' && b.title === 'Merke');
    const typischerFehler = doc.blocks.find((b) => b.type === 'callout' && b.title === 'Typischer Fehler');
    assert.ok(merke, `${s.theory_id}: "Merke"-Callout fehlt`);
    assert.ok(typischerFehler, `${s.theory_id}: "Typischer Fehler"-Callout fehlt`);
  }
});

// 15. Batch 5 enthält 126 Wort- und 15 Theorieeinträge.
test('language-review/batch_05.json: 126 Wort-Einträge + 15 theory_review-Einträge', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_05.json');
  assert.ok(fs.existsSync(batchPath), 'language-review/batch_05.json sollte existieren');
  const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  assert.equal(doc.entries.length, 126);
  assert.equal(doc.word_count, 126);
  assert.ok(Array.isArray(doc.theory_review));
  assert.equal(doc.theory_review.length, 15);
});

// 16. Alle Review-Felder starten auf false.
test('language-review/batch_05.json: alle Prüf-Booleans (Wort- und Theorie-Ebene) starten auf false', () => {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-review', 'batch_05.json'), 'utf-8'));
  for (const e of doc.entries) {
    assert.equal(e.review_status, 'needs_language_review', `${e.id}: review_status sollte "needs_language_review" sein`);
    assert.ok(e.review, `${e.id}: getrennte Prüffelder ("review") fehlen`);
    for (const flag of ['arabic_vocalization_reviewed', 'transliteration_reviewed', 'german_translation_reviewed', 'application_prompts_reviewed']) {
      assert.equal(e.review[flag], false, `${e.id}.review.${flag} sollte initial false sein`);
    }
  }
  for (const t of doc.theory_review) {
    assert.equal(t.review_status, 'needs_language_review');
    for (const flag of ['arabic_examples_reviewed', 'german_explanation_reviewed', 'mini_check_reviewed', 'application_prompts_reviewed']) {
      assert.equal(t[flag], false, `${t.theory_id}.${flag} sollte initial false sein`);
    }
  }
});

// 17. Das Manifest enthält alle 126 Wörter. 18. Kein Wort ist für Audio freigegeben.
test('audio_generation_manifest.json: enthält alle 126 neuen Wörter, keines "ready_for_generation"', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio_generation_manifest.json'), 'utf-8'));
  const byId = new Map(manifest.entries.map((e) => [e.id, e]));
  for (const id of NEW_WORD_IDS) {
    const entry = byId.get(id);
    assert.ok(entry, `Manifest sollte einen Eintrag für "${id}" enthalten`);
    assert.equal(entry.status, 'needs_language_review');
  }
  const batch5Ready = manifest.entries.filter((e) => NEW_WORD_IDS.includes(e.id) && e.status === 'ready_for_generation');
  assert.deepEqual(batch5Ready, []);
});

// 19. Gegensätze sind gegenseitig.
test('Units 21-25: opposite_id-Paare sind gegenseitig und zeigen auf existierende Wörter', () => {
  const withOpposite = NEW_WORD_IDS.map((id) => wordsById.get(id)).filter((w) => w.opposite_id);
  assert.ok(withOpposite.length >= 15, `mindestens 15 Gegensatzpaar-Wörter erwartet, gefunden: ${withOpposite.length}`);
  for (const w of withOpposite) {
    const partner = wordsById.get(w.opposite_id);
    assert.ok(partner, `${w.id}: opposite_id "${w.opposite_id}" existiert nicht`);
    assert.equal(partner.opposite_id, w.id, `${w.id} <-> ${w.opposite_id} sollte gegenseitig verknüpft sein`);
  }
});

// 20. Homonyme und Übersetzungskollisionen werden erkannt.
test('Units 21-25: das مِنْ/مَنْ-Homonym ist markiert, die "über"/"vor"-Übersetzungskollisionen bleiben legitim erhalten', () => {
  const minWord = wordsById.get('c1_u21_21');
  assert.equal(minWord.homonym_group, 'من');
  const qWho = wordsById.get('q_who');
  assert.equal(qWho.homonym_group, 'من');

  // Legitime Mehrdeutigkeit "über": فَوْقَ (räumlich) und عَنْ (Thema) behalten beide "über" als
  // erste deutsche Antwort -- das ist gewollt, siehe Theorie zu theory_vocab_unit_21_a/_c.
  const fawqa = wordsById.get('c1_u21_04');
  const ʿan = wordsById.get('c1_u21_25');
  assert.equal(fawqa.german_answers[0], 'über');
  assert.equal(ʿan.german_answers[0], 'über');

  // Legitime Mehrdeutigkeit "vor": أَمَامَ (räumlich) und قَبْلَ (zeitlich).
  const amama = wordsById.get('c1_u21_05');
  const qabla = wordsById.get('c1_u21_26');
  assert.equal(amama.german_answers[0], 'vor');
  assert.equal(qabla.german_answers[0], 'vor');
});

// 21. Keine Presentation Forms.
test('Units 21-25: keine Arabic-Presentation-Forms-Codepoints in arabischen Feldern', () => {
  const PRESENTATION_FORMS_RANGES = [[0xFB50, 0xFDFF], [0xFE70, 0xFEFF]];
  const PRESENTATION_FORMS_REGEX = new RegExp(`[${PRESENTATION_FORMS_RANGES.map(([from, to]) => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`).join('')}]`);
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    for (const field of ['arabic', 'arabic_vocalized', 'arabic_unvocalized']) {
      if (typeof w[field] === 'string') assert.ok(!PRESENTATION_FORMS_REGEX.test(w[field]), `${id}.${field} enthält Arabic-Presentation-Forms-Codepoints`);
    }
    for (const answer of w.accepted_arabic_answers || []) {
      assert.ok(!PRESENTATION_FORMS_REGEX.test(answer), `${id}: accepted_arabic_answers enthält Arabic-Presentation-Forms-Codepoints`);
    }
  }
});

// 22. Keine Batch-5-ID ist im Anwendungs-JavaScript hart codiert.
test('Units 21-25: keine Wort-ID dieses Batches ist im JavaScript hart codiert', () => {
  const srcDir = path.join(ROOT, 'src', 'js');
  function collectJsFiles(dir) {
    let out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out = out.concat(collectJsFiles(full));
      else if (entry.name.endsWith('.js')) out.push(full);
    }
    return out;
  }
  const files = collectJsFiles(srcDir);
  const offenders = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const id of NEW_WORD_IDS) {
      if (content.includes(`'${id}'`) || content.includes(`"${id}"`)) offenders.push(`${id} in ${path.relative(srcDir, file)}`);
    }
  }
  assert.deepEqual(offenders, []);
});

// 23. Alle Erzeugungsskripte sind idempotent.
test('scripts/upgrade-kurs1-units21to25.js und build-language-review-and-manifest.js (Batch 5) sind idempotent', () => {
  const vocabPath = path.join(PACK, 'vocabulary.json');
  const beforeVocab = fs.readFileSync(vocabPath, 'utf-8');
  execFileSync('node', [path.join(ROOT, 'scripts', 'upgrade-kurs1-units21to25.js')], { cwd: ROOT });
  assert.equal(fs.readFileSync(vocabPath, 'utf-8'), beforeVocab, 'Upgrade-Skript sollte vocabulary.json beim zweiten Lauf unverändert lassen');

  const batchPath = path.join(ROOT, 'language-review', 'batch_05.json');
  const manifestPath = path.join(ROOT, 'audio_generation_manifest.json');
  const beforeBatch = fs.readFileSync(batchPath, 'utf-8');
  const beforeManifest = fs.readFileSync(manifestPath, 'utf-8');
  execFileSync('node', [path.join(ROOT, 'scripts', 'build-language-review-and-manifest.js'), '5', '21', '22', '23', '24', '25'], { cwd: ROOT });
  assert.equal(fs.readFileSync(batchPath, 'utf-8'), beforeBatch, 'batch_05.json sollte beim zweiten Lauf unverändert bleiben');
  assert.equal(fs.readFileSync(manifestPath, 'utf-8'), beforeManifest, 'audio_generation_manifest.json sollte beim zweiten Lauf unverändert bleiben');
});

// 24. Batch 0 bleibt vollständig erhalten.
test('language-review/batch_00.json bleibt von Batch 5 unberührt (weiterhin 141 Bestandswörter)', () => {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-review', 'batch_00.json'), 'utf-8'));
  assert.equal(doc.entries.length, 141);
  assert.equal(doc.batch, 0);
});

// 25. Kein vorhandener Review-Status oder Prüfvermerk wird zurückgesetzt.
test('Batches 1-4: theory_review und Wort-Einträge bleiben durch Batch 5 unverändert in Anzahl/Status', () => {
  for (const [n, expectedEntries] of [[1, 115], [2, 132], [3, 135], [4, 134]]) {
    const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-review', `batch_0${n}.json`), 'utf-8'));
    assert.equal(doc.entries.length, expectedEntries, `batch_0${n}.json sollte weiterhin ${expectedEntries} Einträge haben`);
    assert.equal(doc.theory_review.length, 15, `batch_0${n}.json sollte weiterhin 15 theory_review-Einträge haben`);
    for (const e of doc.entries) assert.equal(e.review_status, 'needs_language_review', `${e.id} in batch_0${n}.json sollte weiterhin "needs_language_review" sein`);
    for (const t of doc.theory_review) assert.equal(t.review_status, 'needs_language_review', `${t.theory_id} in batch_0${n}.json sollte weiterhin "needs_language_review" sein`);
  }
});

// --- Zusatz (Auftrag Abschnitt 9, letzter Absatz): datenbasierter Render-/Ablauftest für alle 15
// neuen Theoriedokumente inkl. Mini-Checks -- über den echten TheoryRenderer + einen DOM-Stub,
// KEINE echte Electron-Oberfläche. -------------------------------------------------------------
function loadTheoryRenderer(doc) {
  const context = {
    console,
    setTimeout,
    document: doc,
    ExerciseGuard: require('../../src/js/exerciseGuard.js'),
    AppState: { markTheoryOpened: () => {}, markTheoryCompleted: () => {} }
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'theoryRenderer.js'), 'utf-8');
  vm.runInContext(`${src}\nthis.__TheoryRenderer = TheoryRenderer;`, context);
  return context.__TheoryRenderer;
}

test('Render-/Ablauftest: alle 15 neuen Theoriedokumente (Units 21-25) mounten und jeder Mini-Check lässt sich mit der richtigen Antwort vollständig durchklicken', () => {
  const sessions = vocabSessions.sessions.filter((s) => UNIT_IDS.includes(s.unit_id));
  assert.equal(sessions.length, 15);

  for (const s of sessions) {
    const doc = theoryData.theories.find((t) => t.theory_id === s.theory_id);
    const docStub = createDocumentStub();
    const TheoryRenderer = loadTheoryRenderer(docStub);
    const container = docStub.createElement('div');
    let miniCheckResult = null;

    TheoryRenderer.mount(container, doc, {
      getWordById: (id) => wordsById.get(id),
      onMiniCheckComplete: (correct, total) => { miniCheckResult = { correct, total }; }
    });

    assert.ok(container.textContent.includes(doc.title), `${s.theory_id}: Titel sollte gerendert werden`);
    for (const objective of doc.learning_objectives) {
      assert.ok(container.textContent.includes(objective), `${s.theory_id}: Lernziel "${objective}" sollte gerendert werden`);
    }

    const miniCheckBlock = doc.blocks.find((b) => b.type === 'mini_check');
    for (const q of miniCheckBlock.questions) {
      const correctOption = q.options.find((o) => o.correct);
      const btn = container.findAllButtons().find((b) => b.textContent === correctOption.text);
      assert.ok(btn, `${s.theory_id}: Button für richtige Antwort "${correctOption.text}" nicht gefunden`);
      btn.click();
      assert.ok(container.textContent.includes('Richtig!'), `${s.theory_id}: "Richtig!"-Feedback sollte erscheinen`);
      const weiterBtn = container.findAllButtons().find((b) => b.textContent === 'Weiter');
      assert.ok(weiterBtn, `${s.theory_id}: "Weiter"-Button sollte nach der Antwort erscheinen`);
      weiterBtn.click();
    }

    assert.deepEqual(miniCheckResult, { correct: miniCheckBlock.questions.length, total: miniCheckBlock.questions.length }, `${s.theory_id}: bei ausschließlich richtigen Antworten sollte correct===total gemeldet werden`);
  }
});
