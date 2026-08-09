// Inhaltstests für Kurs 1, Units 26-30 (Entwicklungsauftrag 11, Abschnitt 12 — der letzte Batch,
// schließt Kurs 1 strukturell ab). Prüft direkt gegen die echten Sprachpaketdateien.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createDocumentStub } = require('../helpers/domStub.js');
const { PART_OF_SPEECH_VALUES } = require('../../scripts/partOfSpeechVocabulary.js');

const ROOT = path.join(__dirname, '..', '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const vocabSessions = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabSessions.json'), 'utf-8'));
const theoryData = JSON.parse(fs.readFileSync(path.join(PACK, 'theory.json'), 'utf-8'));

const words = vocabulary.categories.flatMap((c) => c.words);
const wordsById = new Map(words.map((w) => [w.id, w]));

const UNIT_IDS = ['vocab_unit_26', 'vocab_unit_27', 'vocab_unit_28', 'vocab_unit_29', 'vocab_unit_30'];
const NEW_WORD_IDS = words.filter((w) => UNIT_IDS.includes(w.unit_id) && w.id.startsWith('c1_')).map((w) => w.id);
const PREVIOUSLY_COMPLETE = [
  'tech_computer', 'tech_phone', 'tech_internet', 'tech_screen', 'tech_program',
  'weather_sun', 'weather_rain', 'weather_snow', 'weather_wind', 'weather_cloud', 'weather_hot', 'weather_cold',
  'animal_cat', 'animal_dog', 'animal_horse', 'animal_lion', 'animal_bird', 'animal_fish', 'animal_rabbit', 'animal_chicken', 'animal_cow', 'animal_mouse',
  'leisure_film', 'leisure_music', 'leisure_sport', 'leisure_game',
  'q_who', 'q_what', 'q_where', 'q_when', 'q_how', 'q_why', 'q_howmany'
];

test('Units 26-30: 150 Wörter in Units 26-30 (33 bestehende + 117 neue)', () => {
  const unitWords = words.filter((w) => UNIT_IDS.includes(w.unit_id));
  assert.equal(unitWords.length, 150);
  assert.equal(NEW_WORD_IDS.length, 117);
  assert.equal(PREVIOUSLY_COMPLETE.length, 33);
});

test('Units 26-30: 30 Wörter je Unit, 10 Wörter je Session, keine doppelten IDs', () => {
  for (const unitId of UNIT_IDS) {
    const n = words.filter((w) => w.unit_id === unitId).length;
    assert.equal(n, 30, `${unitId} sollte 30 Wörter haben, hat ${n}`);
  }
  const sessions = vocabSessions.sessions.filter((s) => UNIT_IDS.includes(s.unit_id));
  assert.equal(sessions.length, 15);
  for (const s of sessions) assert.equal(s.new_word_ids.length, 10, `${s.session_id} sollte genau 10 Wörter haben`);
  const unitWords = words.filter((w) => UNIT_IDS.includes(w.unit_id));
  assert.equal(new Set(unitWords.map((w) => w.id)).size, unitWords.length);
});

test('Units 26-30: die 33 bereits vorher vollständigen Bestandswörter bleiben unverändert', () => {
  for (const id of PREVIOUSLY_COMPLETE) {
    const w = wordsById.get(id);
    assert.ok(w, `Wort "${id}" sollte weiterhin existieren`);
    assert.ok(!id.startsWith('c1_'), `${id} sollte keine c1_-ID sein (Bestandswort)`);
    assert.ok(UNIT_IDS.includes(w.unit_id), `${id} sollte weiterhin einer der Units 26-30 zugeordnet sein`);
  }
});

test('Units 26-30: vollständiges Datenmodell für alle 117 neuen Wörter', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(w, `Wort "${id}" sollte existieren`);
    assert.ok(typeof w.arabic_vocalized === 'string' && w.arabic_vocalized.trim(), `${id}: arabic_vocalized fehlt`);
    assert.ok(typeof w.arabic_unvocalized === 'string' && w.arabic_unvocalized.trim(), `${id}: arabic_unvocalized fehlt`);
    assert.ok(Array.isArray(w.german_answers) && w.german_answers.length > 0, `${id}: german_answers fehlt/leer`);
    assert.ok(typeof w.transliteration === 'string' && w.transliteration.trim(), `${id}: transliteration fehlt`);
    assert.ok(typeof w.part_of_speech === 'string' && w.part_of_speech.trim(), `${id}: part_of_speech fehlt`);
    assert.ok(Array.isArray(w.accepted_arabic_answers) && w.accepted_arabic_answers.length > 0, `${id}: accepted_arabic_answers fehlt/leer`);
    assert.equal(w.content_status, 'needs_language_review', `${id}: content_status sollte weiterhin "needs_language_review" sein`);
    assert.ok('gender' in w, `${id}: gender-Feld fehlt`);
    assert.ok('plural' in w, `${id}: plural-Feld fehlt`);
    assert.ok(Array.isArray(w.application_prompts) && w.application_prompts.length > 0, `${id}: application_prompts fehlt/leer`);
  }
});

test('Units 26-30: gültige Wortarten (inkl. der neuen Kategorien Konjunktion/Partikel/Pronomen)', () => {
  const known = new Set(PART_OF_SPEECH_VALUES);
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(known.has(w.part_of_speech), `${id}: part_of_speech "${w.part_of_speech}" ist nicht im zentralen Vokabular`);
  }
  const unit30Ids = NEW_WORD_IDS.filter((id) => id.startsWith('c1_u30_'));
  const posUsed = new Set(unit30Ids.map((id) => wordsById.get(id).part_of_speech));
  for (const expected of ['Konjunktion', 'Partikel', 'Pronomen (Demonstrativ)', 'Pronomen (Indefinit)']) {
    assert.ok(posUsed.has(expected), `Unit 30 sollte mindestens ein Wort der Wortart "${expected}" enthalten`);
  }
});

test('Units 26-30: Substantive haben ein bearbeitetes gender-/plural-Feld', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    if (w.part_of_speech.startsWith('Substantiv')) {
      assert.ok('gender' in w, `${id}: Substantiv ohne bearbeitetes gender-Feld`);
      assert.ok('plural' in w, `${id}: Substantiv ohne bearbeitetes plural-Feld`);
    }
  }
});

test('Units 26-30: application_prompts sind vollständig und referenzieren nur bekannte, eigene IDs', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    for (const p of w.application_prompts) {
      assert.ok(p.prompt && p.prompt.trim(), `${id}: application_prompt ohne prompt`);
      if (p.expected_word_id) {
        assert.ok(wordsById.has(p.expected_word_id), `${id}: expected_word_id "${p.expected_word_id}" existiert nicht`);
        assert.equal(p.expected_word_id, id, `${id}: expected_word_id sollte auf das eigene Wort zeigen`);
      }
      if (p.expected_meaning) assert.ok(w.german_answers.includes(p.expected_meaning), `${id}: expected_meaning passt nicht zu german_answers`);
    }
  }
});

test('Units 26-30: eindeutiges Grading — eine Application-Aufgabe (Unit 30, Konjunktion) wird live korrekt bewertet', () => {
  const context = { console };
  vm.createContext(context);
  const src = ['src/js/srs.js', 'src/js/exerciseGuard.js', 'src/js/session/exerciseRegistry.js']
    .map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${src}\nthis.__ExerciseRegistry = ExerciseRegistry;\nthis.__ExerciseGuard = ExerciseGuard;`, context);
  const doc = createDocumentStub();
  context.document = doc;
  const word = wordsById.get('c1_u30_03'); // لأن (weil)
  const container = doc.createElement('div');
  const guard = context.__ExerciseGuard.create();
  let result = null;
  context.__ExerciseRegistry.render('contextual_choice', container, { word, allWords: words, helpConfig: { showDiacritics: 'full' }, settings: {} }, guard, (isCorrect) => { result = isCorrect; });
  const buttons = container.findAllButtons();
  const correctText = word.arabic_vocalized || word.arabic;
  assert.equal(buttons.filter((b) => b.textContent === correctText).length, 1, 'genau eine Option sollte dem Zielwort entsprechen');
  buttons.find((b) => b.textContent === correctText).click();
  assert.equal(result, true);
});

test('Units 26-30: verbesserte Distraktorauswahl greift auch für neue Batch-6-Wörter (kein Synonym als Distraktor)', () => {
  const context = { console };
  vm.createContext(context);
  const src = ['src/js/srs.js', 'src/js/exerciseGuard.js', 'src/js/session/exerciseRegistry.js']
    .map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${src}\nthis.__ExerciseRegistry = ExerciseRegistry;`, context);
  const ExerciseRegistry = context.__ExerciseRegistry;
  // c1_u26_11 (تنزيل, Download) und c1_u26_12 (رفع, Upload) sind ein Gegensatzpaar, keine
  // Synonyme -- aber wir bauen hier gezielt ein künstliches, aber realistisches Szenario mit
  // einem Session-Geschwisterwort, das absichtlich dieselbe erste deutsche Bedeutung hat.
  const target = wordsById.get('c1_u26_11');
  const fakeSynonym = { id: 'fake_synonym', arabic_vocalized: 'مرادف', arabic_unvocalized: 'مرادف', german_answers: target.german_answers };
  const sessionWords = vocabSessions.sessions.find((s) => s.session_id === 'vocab_unit_26_b').new_word_ids.map((id) => wordsById.get(id));
  const pool = [...sessionWords, fakeSynonym];
  const distractors = ExerciseRegistry.pickDistractors(target, pool, 3);
  assert.ok(!distractors.some((d) => d.id === 'fake_synonym'), 'ein Wort mit vollständig überlappender deutscher Bedeutung sollte nicht als Distraktor erscheinen, wenn Alternativen vorhanden sind');
});

test('Units 26-30: alle 15 Sessions haben vollständige, keine Platzhalter-Theorie, exakt passend zum Wortbestand', () => {
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
    assert.equal(preview.word_ids.length, 10);
    assert.deepEqual([...preview.word_ids].sort(), [...s.new_word_ids].sort(), `${s.theory_id}: word_preview sollte exakt den Sessionwörtern entsprechen`);

    const examples = doc.blocks.filter((b) => b.type === 'example');
    assert.ok(examples.length >= 2, `${s.theory_id}: mindestens 2 Beispiele erwartet`);

    const miniCheck = doc.blocks.find((b) => b.type === 'mini_check');
    assert.ok(miniCheck, `${s.theory_id}: mini_check-Block fehlt`);
    assert.ok(miniCheck.questions.length >= 2);
    for (const q of miniCheck.questions) {
      assert.equal(q.options.filter((o) => o.correct).length, 1, `${s.theory_id}: jede Mini-Check-Frage braucht genau eine richtige Option`);
    }

    assert.ok(doc.blocks.some((b) => b.type === 'callout' && b.title === 'Merke'), `${s.theory_id}: "Merke"-Callout fehlt`);
    assert.ok(doc.blocks.some((b) => b.type === 'callout' && b.title === 'Typischer Fehler'), `${s.theory_id}: "Typischer Fehler"-Callout fehlt`);
  }
});

test('Unit 30: jede Session enthält mindestens einen vollständigen arabischen Beispielsatz (kein reines Vokabelpaar)', () => {
  const unit30Sessions = vocabSessions.sessions.filter((s) => s.unit_id === 'vocab_unit_30');
  for (const s of unit30Sessions) {
    const doc = theoryData.theories.find((t) => t.theory_id === s.theory_id);
    const examples = doc.blocks.filter((b) => b.type === 'example');
    const hasSentence = examples.some((e) => e.arabic.trim().split(/\s+/).length >= 3);
    assert.ok(hasSentence, `${s.theory_id}: mindestens ein Beispiel sollte ein vollständiger Satz sein (>= 3 Wörter), keine reine Vokabelgleichung`);
  }
  for (const id of NEW_WORD_IDS.filter((i) => i.startsWith('c1_u30_'))) {
    const w = wordsById.get(id);
    const prompt = w.application_prompts[0].prompt;
    assert.ok(prompt.trim().split(/\s+/).length >= 6, `${id}: application_prompt sollte ein vollständiger, situativer Satz sein, nicht nur "Dieses Wort bedeutet..."`);
  }
});

test('language-review/batch_06.json: 117 Wort-Einträge + 15 theory_review-Einträge, alle Prüf-Booleans auf false', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_06.json');
  assert.ok(fs.existsSync(batchPath));
  const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  assert.equal(doc.entries.length, 117);
  assert.equal(doc.word_count, 117);
  assert.equal(doc.theory_review.length, 15);
  for (const e of doc.entries) {
    assert.equal(e.review_status, 'needs_language_review');
    for (const flag of ['arabic_vocalization_reviewed', 'transliteration_reviewed', 'german_translation_reviewed', 'application_prompts_reviewed']) {
      assert.equal(e.review[flag], false, `${e.id}.review.${flag} sollte initial false sein`);
    }
  }
  for (const t of doc.theory_review) {
    assert.equal(t.review_status, 'needs_language_review');
    for (const flag of ['arabic_examples_reviewed', 'german_explanation_reviewed', 'mini_check_reviewed', 'application_prompts_reviewed']) {
      assert.equal(t[flag], false);
    }
  }
});

test('audio_generation_manifest.json: enthält alle 117 neuen Wörter, keines "ready_for_generation"', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio_generation_manifest.json'), 'utf-8'));
  const byId = new Map(manifest.entries.map((e) => [e.id, e]));
  for (const id of NEW_WORD_IDS) {
    const entry = byId.get(id);
    assert.ok(entry, `Manifest sollte einen Eintrag für "${id}" enthalten`);
    assert.equal(entry.status, 'needs_language_review');
  }
  assert.deepEqual(manifest.entries.filter((e) => NEW_WORD_IDS.includes(e.id) && e.status === 'ready_for_generation'), []);
});

test('Units 26-30: keine Arabic-Presentation-Forms-Codepoints', () => {
  const PRESENTATION_FORMS_RANGES = [[0xFB50, 0xFDFF], [0xFE70, 0xFEFF]];
  const re = new RegExp(`[${PRESENTATION_FORMS_RANGES.map(([a, b]) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`).join('')}]`);
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    for (const field of ['arabic', 'arabic_vocalized', 'arabic_unvocalized']) {
      if (typeof w[field] === 'string') assert.ok(!re.test(w[field]), `${id}.${field} enthält Presentation Forms`);
    }
  }
});

test('Units 26-30: keine Wort-ID dieses Batches ist im JavaScript hart codiert', () => {
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
  const offenders = [];
  for (const file of collectJsFiles(srcDir)) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const id of NEW_WORD_IDS) {
      if (content.includes(`'${id}'`) || content.includes(`"${id}"`)) offenders.push(`${id} in ${path.relative(srcDir, file)}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('scripts/upgrade-kurs1-units26to30.js und build-language-review-and-manifest.js (Batch 6) sind idempotent', () => {
  const vocabPath = path.join(PACK, 'vocabulary.json');
  const beforeVocab = fs.readFileSync(vocabPath, 'utf-8');
  execFileSync('node', [path.join(ROOT, 'scripts', 'upgrade-kurs1-units26to30.js')], { cwd: ROOT });
  assert.equal(fs.readFileSync(vocabPath, 'utf-8'), beforeVocab);

  const batchPath = path.join(ROOT, 'language-review', 'batch_06.json');
  const manifestPath = path.join(ROOT, 'audio_generation_manifest.json');
  const beforeBatch = fs.readFileSync(batchPath, 'utf-8');
  const beforeManifest = fs.readFileSync(manifestPath, 'utf-8');
  execFileSync('node', [path.join(ROOT, 'scripts', 'build-language-review-and-manifest.js'), '6', '26', '27', '28', '29', '30'], { cwd: ROOT });
  assert.equal(fs.readFileSync(batchPath, 'utf-8'), beforeBatch);
  assert.equal(fs.readFileSync(manifestPath, 'utf-8'), beforeManifest);
});

test('Unversehrtheit der Batches 0-5 nach Batch 6', () => {
  const expected = [[0, 141], [1, 115], [2, 132], [3, 135], [4, 134], [5, 126]];
  for (const [n, count] of expected) {
    const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-review', `batch_0${n}.json`), 'utf-8'));
    assert.equal(doc.entries.length, count, `batch_0${n}.json sollte weiterhin ${count} Einträge haben`);
    if (n > 0) assert.equal(doc.theory_review.length, 15, `batch_0${n}.json sollte weiterhin 15 theory_review-Einträge haben`);
  }
});
