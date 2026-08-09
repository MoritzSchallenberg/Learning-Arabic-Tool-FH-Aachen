// Inhaltstests für Kurs 1, Units 16-20 (Entwicklungsauftrag 9, Abschnitt 10). Prüft direkt gegen
// die echten Sprachpaketdateien (kein Mock) — analog zu kurs1Units11to15Content.test.js, deckt die
// 20 im Auftrag explizit geforderten Prüfpunkte ab plus den theory_review-Regressionstest aus
// Abschnitt 6/11 (Batches 1-4).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const vocabSessions = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabSessions.json'), 'utf-8'));
const theoryData = JSON.parse(fs.readFileSync(path.join(PACK, 'theory.json'), 'utf-8'));

const words = vocabulary.categories.flatMap((c) => c.words);
const wordsById = new Map(words.map((w) => [w.id, w]));

const UNIT_IDS = ['vocab_unit_16', 'vocab_unit_17', 'vocab_unit_18', 'vocab_unit_19', 'vocab_unit_20'];
const NEW_WORD_IDS = words.filter((w) => UNIT_IDS.includes(w.unit_id) && w.id.startsWith('c1_')).map((w) => w.id);
const PREVIOUSLY_COMPLETE = [
  'verb_live', 'verb_go', 'verb_play', 'verb_work', 'verb_eat', 'verb_drink', 'verb_study', 'verb_understand',
  'place_city', 'place_village', 'place_street', 'place_restaurant', 'place_hospital', 'place_station', 'place_office', 'place_mosque'
];

// 1. Units 16-20 enthalten zusammen genau 150 Wörter.
test('Units 16-20: genau 150 Wörter (16 bestehende + 134 neue)', () => {
  const unitWords = words.filter((w) => UNIT_IDS.includes(w.unit_id));
  assert.equal(unitWords.length, 150);
  assert.equal(NEW_WORD_IDS.length, 134);
  assert.equal(PREVIOUSLY_COMPLETE.length, 16);
});

// 2. Jede Unit enthält genau 30 Wörter. 3. Jede Session enthält genau 10 Wörter.
test('Units 16-20: jede Unit hat genau 30 Wörter, jede Session genau 10', () => {
  for (const unitId of UNIT_IDS) {
    const n = words.filter((w) => w.unit_id === unitId).length;
    assert.equal(n, 30, `${unitId} sollte 30 Wörter haben, hat ${n}`);
  }
  const sessions = vocabSessions.sessions.filter((s) => UNIT_IDS.includes(s.unit_id));
  assert.equal(sessions.length, 15);
  for (const s of sessions) assert.equal(s.new_word_ids.length, 10, `${s.session_id} sollte genau 10 Wörter haben`);
});

// 4. Keine doppelten IDs.
test('Units 16-20: keine doppelten Wort-IDs', () => {
  const unitWords = words.filter((w) => UNIT_IDS.includes(w.unit_id));
  assert.equal(new Set(unitWords.map((w) => w.id)).size, unitWords.length);
});

// 5. Vorhandene Wörter wurden nicht ungewollt verschoben.
test('Units 16-20: die 16 bereits vorher vollständigen Wörter wurden nicht verändert/verschoben', () => {
  for (const id of PREVIOUSLY_COMPLETE) {
    const w = wordsById.get(id);
    assert.ok(w, `Wort "${id}" sollte weiterhin existieren`);
    assert.ok(!id.startsWith('c1_'), `${id} sollte keine c1_-ID sein (Bestandswort, keine neue ID)`);
    assert.ok(UNIT_IDS.includes(w.unit_id), `${id} sollte weiterhin einer der Units 16-20 zugeordnet sein`);
  }
});

// 6. Jedes Wort erfüllt das vollständige Lernmodell.
test('Units 16-20: jedes neue Wort erfüllt das "lernfähige" Datenmodell', () => {
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

// 7. Jedes Wort hat mindestens einen gültigen Application-Prompt.
test('Units 16-20: jedes neue Wort hat mindestens einen gültigen application_prompt', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(Array.isArray(w.application_prompts) && w.application_prompts.length > 0, `${id}: application_prompts fehlt/leer`);
    for (const p of w.application_prompts) {
      assert.ok(p.prompt && p.prompt.trim(), `${id}: application_prompt ohne "prompt"`);
      assert.ok(p.expected_meaning || p.expected_word_id, `${id}: application_prompt ohne "expected_meaning"/"expected_word_id"`);
    }
  }
});

// 8. Alle referenzierten expected_word_id-Werte existieren.
test('Units 16-20: application_prompts referenzieren keine unbekannten expected_word_id', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    for (const p of w.application_prompts) {
      if (p.expected_word_id) assert.ok(wordsById.has(p.expected_word_id), `${id}: expected_word_id "${p.expected_word_id}" existiert nicht`);
    }
  }
});

// 9. Substantive besitzen ein bewusst bearbeitetes Genus- und Pluralfeld.
test('Units 16-20: Substantive haben ein bearbeitetes gender-/plural-Feld (auch wenn null)', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    if (w.part_of_speech === 'Substantiv' || w.part_of_speech === 'Substantiv/Adjektiv') {
      assert.ok('gender' in w, `${id}: Substantiv ohne bearbeitetes gender-Feld`);
      assert.ok('plural' in w, `${id}: Substantiv ohne bearbeitetes plural-Feld`);
    }
  }
});

// 10. Alle Wortarten gehören zur zentral erlaubten Liste.
test('Units 16-20: alle part_of_speech-Werte gehören zum zentralen (deutschsprachigen) Vokabular', () => {
  const KNOWN_PART_OF_SPEECH = new Set([
    'Substantiv', 'Substantiv (Dual)', 'Substantiv (Plural)', 'Substantiv (Pluraletantum)',
    'Substantiv/Adjektiv', 'Adjektiv', 'Verb (3. Pers. m. Vergangenheit)', 'Adverb', 'Ausdruck',
    'Zahlwort', 'Fragewort', 'Eigenname'
  ]);
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(KNOWN_PART_OF_SPEECH.has(w.part_of_speech), `${id}: part_of_speech "${w.part_of_speech}" ist nicht im zentralen Vokabular`);
  }
});

// 11. Alle 15 Sessions besitzen vollständige Theorie ohne Platzhalter.
test('Units 16-20: alle 15 Sessions haben vollständige, keine Platzhalter-Theorie', () => {
  const sessions = vocabSessions.sessions.filter((s) => UNIT_IDS.includes(s.unit_id));
  assert.equal(sessions.length, 15);
  for (const s of sessions) {
    const doc = theoryData.theories.find((t) => t.theory_id === s.theory_id);
    assert.ok(doc, `Theoriedokument "${s.theory_id}" sollte existieren`);
    assert.notEqual(doc.is_placeholder, true, `${s.theory_id} sollte kein Platzhalter mehr sein`);
    assert.equal(doc.content_status, 'needs_language_review');
    assert.ok(Array.isArray(doc.learning_objectives) && doc.learning_objectives.length >= 2, `${s.theory_id}: mindestens 2 Lernziele erwartet`);

    const paragraphs = doc.blocks.filter((b) => b.type === 'paragraph');
    const shortParagraphs = paragraphs.filter((b) => !b.level || b.level === 'short');
    const fullParagraphs = paragraphs.filter((b) => b.level === 'full');
    assert.ok(shortParagraphs.length >= 1, `${s.theory_id}: "Kurz erklärt"-Text fehlt`);
    assert.ok(fullParagraphs.length >= 1, `${s.theory_id}: "Mehr erfahren"-Text fehlt`);

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

// 12. Batch 4 enthält die richtige Zahl an Review-Einträgen.
test('language-review/batch_04.json: 134 Wort-Einträge + 15 theory_review-Einträge', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_04.json');
  assert.ok(fs.existsSync(batchPath), 'language-review/batch_04.json sollte existieren');
  const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  assert.equal(doc.entries.length, 134);
  assert.equal(doc.word_count, 134);
  assert.ok(Array.isArray(doc.theory_review));
  assert.equal(doc.theory_review.length, 15);
});

// 13. Alle Review-Bestätigungsfelder stehen zunächst auf false.
test('language-review/batch_04.json: alle Prüf-Booleans (Wort- und Theorie-Ebene) starten auf false', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_04.json');
  const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
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

// 14. Das Audio-Manifest enthält alle betroffenen Wörter.
test('audio_generation_manifest.json: enthält alle 134 neuen Wörter mit status "needs_language_review"', () => {
  const manifestPath = path.join(ROOT, 'audio_generation_manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const byId = new Map(manifest.entries.map((e) => [e.id, e]));
  for (const id of NEW_WORD_IDS) {
    const entry = byId.get(id);
    assert.ok(entry, `Manifest sollte einen Eintrag für "${id}" enthalten`);
    assert.equal(entry.status, 'needs_language_review');
  }
});

// 15. Kein Batch-4-Wort ist für Audio freigegeben.
test('audio_generation_manifest.json: kein Batch-4-Wort ist "ready_for_generation"', () => {
  const manifestPath = path.join(ROOT, 'audio_generation_manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const readyIds = manifest.entries.filter((e) => e.status === 'ready_for_generation').map((e) => e.id);
  const batch4Ready = readyIds.filter((id) => NEW_WORD_IDS.includes(id));
  assert.deepEqual(batch4Ready, []);
});

// 16. Keine Wort-ID des Batches ist im Anwendungs-JavaScript hart codiert.
test('Units 16-20: keine Wort-ID dieses Batches ist im JavaScript hart codiert', () => {
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

// 17. opposite_id-Verweise sind gegenseitig und gültig.
test('Units 16-20: opposite_id-Paare sind gegenseitig und zeigen auf existierende Wörter', () => {
  const withOpposite = NEW_WORD_IDS.map((id) => wordsById.get(id)).filter((w) => w.opposite_id);
  assert.ok(withOpposite.length >= 30, `mindestens 30 Gegensatzpaar-Wörter erwartet, gefunden: ${withOpposite.length}`);
  for (const w of withOpposite) {
    const partner = wordsById.get(w.opposite_id);
    assert.ok(partner, `${w.id}: opposite_id "${w.opposite_id}" existiert nicht`);
    assert.equal(partner.opposite_id, w.id, `${w.id} <-> ${w.opposite_id} sollte gegenseitig verknüpft sein`);
  }
});

// 18. confusion_group wird nur selektiv verwendet.
test('Units 16-20: confusion_group wird nur selektiv (nicht für jedes Wort) vergeben', () => {
  const withGroup = NEW_WORD_IDS.map((id) => wordsById.get(id)).filter((w) => w.confusion_group);
  assert.ok(withGroup.length > 0, 'mindestens eine confusion_group erwartet');
  assert.ok(withGroup.length < NEW_WORD_IDS.length, 'confusion_group sollte NICHT für jedes Wort vergeben sein');
});

// 19. Die Daten enthalten keine arabischen Presentation Forms.
test('Units 16-20: keine Arabic-Presentation-Forms-Codepoints in arabischen Feldern', () => {
  const PRESENTATION_FORMS_RANGES = [[0xFB50, 0xFDFF], [0xFE70, 0xFEFF]];
  const PRESENTATION_FORMS_REGEX = new RegExp(`[${PRESENTATION_FORMS_RANGES.map(([from, to]) => `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`).join('')}]`);
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    for (const field of ['arabic', 'arabic_vocalized', 'arabic_unvocalized']) {
      if (typeof w[field] === 'string') {
        assert.ok(!PRESENTATION_FORMS_REGEX.test(w[field]), `${id}.${field} enthält Arabic-Presentation-Forms-Codepoints`);
      }
    }
    for (const answer of w.accepted_arabic_answers || []) {
      assert.ok(!PRESENTATION_FORMS_REGEX.test(answer), `${id}: accepted_arabic_answers enthält Arabic-Presentation-Forms-Codepoints`);
    }
  }
});

// 20. Das Upgrade-Skript ist idempotent.
test('scripts/upgrade-kurs1-units16to20.js ist idempotent (zweimaliges Ausführen erzeugt identisches Ergebnis)', () => {
  const vocabPath = path.join(PACK, 'vocabulary.json');
  const before = fs.readFileSync(vocabPath, 'utf-8');
  execFileSync('node', [path.join(ROOT, 'scripts', 'upgrade-kurs1-units16to20.js')], { cwd: ROOT });
  const after = fs.readFileSync(vocabPath, 'utf-8');
  assert.equal(after, before, 'ein erneuter Lauf des Upgrade-Skripts sollte vocabulary.json unverändert lassen');
});

// Zusatz (Abschnitt 6/11): theory_review-Erfassung über alle 4 Batches konsistent.
test('theory_review ist für alle 4 Batches konsistent erfasst (45 aus Batch 1-3 + 15 aus Batch 4 = 60)', () => {
  let total = 0;
  for (const n of [1, 2, 3, 4]) {
    const batchPath = path.join(ROOT, 'language-review', `batch_0${n}.json`);
    const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    assert.ok(Array.isArray(doc.theory_review), `batch_0${n}.json sollte ein theory_review-Array haben`);
    assert.equal(doc.theory_review.length, 15, `batch_0${n}.json sollte 15 theory_review-Einträge haben`);
    total += doc.theory_review.length;
  }
  assert.equal(total, 60);
});
