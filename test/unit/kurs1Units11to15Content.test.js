// Inhaltstests für Kurs 1, Units 11-15 (Entwicklungsauftrag 8). Prüft direkt gegen die echten
// Sprachpaketdateien (kein Mock) — analog zu kurs1Units6to10Content.test.js, ergänzt um Tests für
// die in diesem Batch neu eingeführten Felder opposite_id/confusion_group sowie die
// theory_review-Metadaten in language-review/batch_03.json.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const vocabSessions = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabSessions.json'), 'utf-8'));
const theoryData = JSON.parse(fs.readFileSync(path.join(PACK, 'theory.json'), 'utf-8'));

const words = vocabulary.categories.flatMap((c) => c.words);
const wordsById = new Map(words.map((w) => [w.id, w]));

const UNIT_IDS = ['vocab_unit_11', 'vocab_unit_12', 'vocab_unit_13', 'vocab_unit_14', 'vocab_unit_15'];
const NEW_WORD_IDS = words.filter((w) => UNIT_IDS.includes(w.unit_id) && w.id.startsWith('c1_')).map((w) => w.id);

test('Units 11-15: genau 150 Wörter (15 bestehende + 135 neue), keine doppelten IDs', () => {
  const unitWords = words.filter((w) => UNIT_IDS.includes(w.unit_id));
  assert.equal(unitWords.length, 150, 'Units 11-15 sollten zusammen 150 Wörter enthalten');
  assert.equal(NEW_WORD_IDS.length, 135, '135 davon sollten neue c1_-Wörter sein');
  assert.equal(new Set(unitWords.map((w) => w.id)).size, 150, 'keine doppelten IDs innerhalb der 150 Wörter');
});

test('Units 11-15: jede Unit hat genau 30 Wörter, jede Session genau 10', () => {
  for (const unitId of UNIT_IDS) {
    const n = words.filter((w) => w.unit_id === unitId).length;
    assert.equal(n, 30, `${unitId} sollte 30 Wörter haben, hat ${n}`);
  }
  const sessions = vocabSessions.sessions.filter((s) => UNIT_IDS.includes(s.unit_id));
  assert.equal(sessions.length, 15, 'Units 11-15 sollten zusammen 15 Sessions haben');
  for (const s of sessions) {
    assert.equal(s.new_word_ids.length, 10, `${s.session_id} sollte genau 10 Wörter haben`);
  }
});

test('Units 11-15: bereits vorher vollständige Wörter (4/5/6/0/0) wurden nicht verändert/verschoben', () => {
  const previouslyComplete = [
    'shop_money', 'shop_price', 'shop_store', 'shop_bag',
    'clothing_shirt', 'clothing_pants', 'clothing_shoe', 'clothing_coat', 'clothing_hat',
    'body_head', 'body_hand', 'body_eye', 'body_nose', 'body_mouth', 'body_foot'
  ];
  assert.equal(previouslyComplete.length, 15);
  for (const id of previouslyComplete) {
    const w = wordsById.get(id);
    assert.ok(w, `Wort "${id}" sollte weiterhin existieren`);
    assert.ok(!id.startsWith('c1_'), `${id} sollte keine c1_-ID sein (Bestandswort, keine neue ID)`);
  }
});

test('Units 11-15: jedes neue Wort erfüllt das "lernfähige" Datenmodell', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(w, `Wort "${id}" sollte in vocabulary.json existieren`);
    assert.ok(typeof w.arabic_vocalized === 'string' && w.arabic_vocalized.trim(), `${id}: arabic_vocalized fehlt`);
    assert.ok(typeof w.arabic_unvocalized === 'string' && w.arabic_unvocalized.trim(), `${id}: arabic_unvocalized fehlt`);
    assert.ok(Array.isArray(w.german_answers) && w.german_answers.length > 0, `${id}: german_answers fehlt/leer`);
    assert.ok(typeof w.transliteration === 'string' && w.transliteration.trim(), `${id}: transliteration fehlt`);
    assert.ok(typeof w.part_of_speech === 'string' && w.part_of_speech.trim(), `${id}: part_of_speech fehlt`);
    assert.ok(Array.isArray(w.accepted_arabic_answers) && w.accepted_arabic_answers.length > 0, `${id}: accepted_arabic_answers fehlt/leer`);
    assert.equal(w.content_status, 'needs_language_review', `${id}: content_status sollte weiterhin "needs_language_review" sein (noch nicht geprüft)`);
  }
});

test('Units 11-15: jedes neue Wort hat mindestens einen gültigen application_prompt', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(Array.isArray(w.application_prompts) && w.application_prompts.length > 0, `${id}: application_prompts fehlt/leer`);
    for (const p of w.application_prompts) {
      assert.ok(p.prompt && p.prompt.trim(), `${id}: application_prompt ohne "prompt"`);
      assert.ok(p.expected_meaning || p.expected_word_id, `${id}: application_prompt ohne "expected_meaning"/"expected_word_id"`);
    }
  }
});

test('Units 11-15: Substantive haben ein bearbeitetes gender-/plural-Feld (auch wenn null)', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    if (w.part_of_speech === 'Substantiv' || w.part_of_speech === 'Substantiv/Adjektiv') {
      assert.ok('gender' in w, `${id}: Substantiv ohne bearbeitetes gender-Feld`);
      assert.ok('plural' in w, `${id}: Substantiv ohne bearbeitetes plural-Feld`);
    }
  }
});

test('Units 11-15: alle part_of_speech-Werte gehören zum zentralen (deutschsprachigen) Vokabular', () => {
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

test('Units 11-15: opposite_id-Paare sind gegenseitig und zeigen auf existierende Wörter', () => {
  const withOpposite = NEW_WORD_IDS.map((id) => wordsById.get(id)).filter((w) => w.opposite_id);
  assert.ok(withOpposite.length >= 20, `mindestens 20 Gegensatzpaar-Wörter erwartet, gefunden: ${withOpposite.length}`);
  for (const w of withOpposite) {
    const partner = wordsById.get(w.opposite_id);
    assert.ok(partner, `${w.id}: opposite_id "${w.opposite_id}" existiert nicht`);
    assert.equal(partner.opposite_id, w.id, `${w.id} <-> ${w.opposite_id} sollte gegenseitig verknüpft sein`);
  }
});

test('Units 11-15: confusion_group wird nur selektiv (nicht für jedes Wort) vergeben', () => {
  const withGroup = NEW_WORD_IDS.map((id) => wordsById.get(id)).filter((w) => w.confusion_group);
  assert.ok(withGroup.length > 0, 'mindestens eine confusion_group erwartet');
  assert.ok(withGroup.length < NEW_WORD_IDS.length, 'confusion_group sollte NICHT für jedes Wort vergeben sein (nur didaktisch sinnvoll)');
});

test('Units 11-15: alle 15 Sessions haben vollständige, keine Platzhalter-Theorie', () => {
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
    assert.ok(shortParagraphs.length >= 1, `${s.theory_id}: "Kurz erklärt"-Text (paragraph ohne level:"full") fehlt`);
    assert.ok(fullParagraphs.length >= 1, `${s.theory_id}: "Mehr erfahren"-Text (paragraph mit level:"full") fehlt`);

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
    const hintCallout = doc.blocks.find((b) => b.type === 'callout' && (b.title === 'Typischer Fehler' || b.title === 'Wichtiger Hinweis'));
    assert.ok(merke || hintCallout, `${s.theory_id}: mindestens ein Merke-/Hinweis-Callout erwartet`);
  }
});

test('Unit 14 (Gesundheit): Theorie ist als reiner Sprachunterricht gekennzeichnet, keine Behandlungsanweisungen', () => {
  const doc = theoryData.theories.find((t) => t.theory_id === 'theory_vocab_unit_14_a');
  assert.ok(doc, 'theory_vocab_unit_14_a sollte existieren');
  const hint = doc.blocks.find((b) => b.type === 'callout' && b.title === 'Wichtiger Hinweis');
  assert.ok(hint, 'Unit 14a sollte einen expliziten Hinweis-Callout zum Charakter der Unit enthalten');
  assert.match(hint.text, /kein(e)? medizinisch/i, 'Der Hinweis sollte explizit sagen, dass es sich NICHT um medizinische Beratung handelt');
});

test('Units 11-15: application_prompts referenzieren keine unbekannten expected_word_id', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    for (const p of w.application_prompts) {
      if (p.expected_word_id) assert.ok(wordsById.has(p.expected_word_id), `${id}: expected_word_id "${p.expected_word_id}" existiert nicht`);
    }
  }
});

test('Units 11-15: keine Wort-ID dieses Batches ist im JavaScript hart codiert (rein datenbasierte Application-Phase)', () => {
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
  assert.deepEqual(offenders, [], 'keine Wort-ID aus Units 11-15 sollte im Quellcode hart codiert sein');
});

test('language-review/batch_03.json: 135 Einträge + 15 theory_review-Einträge mit allen vier Booleans', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_03.json');
  assert.ok(fs.existsSync(batchPath), 'language-review/batch_03.json sollte existieren');
  const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  assert.equal(doc.entries.length, 135);
  assert.equal(doc.word_count, 135);
  assert.ok(Array.isArray(doc.theory_review), 'theory_review sollte ein Array sein');
  assert.equal(doc.theory_review.length, 15);
  for (const t of doc.theory_review) {
    assert.ok(t.theory_id && t.title, `theory_review-Eintrag ohne theory_id/title: ${JSON.stringify(t)}`);
    assert.equal(t.review_status, 'needs_language_review');
    for (const flag of ['arabic_examples_reviewed', 'german_explanation_reviewed', 'mini_check_reviewed', 'application_prompts_reviewed']) {
      assert.equal(t[flag], false, `${t.theory_id}.${flag} sollte initial false sein`);
    }
  }
});

test('audio_generation_manifest.json: enthält alle 135 neuen Wörter mit status "needs_language_review"', () => {
  const manifestPath = path.join(ROOT, 'audio_generation_manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const byId = new Map(manifest.entries.map((e) => [e.id, e]));
  for (const id of NEW_WORD_IDS) {
    const entry = byId.get(id);
    assert.ok(entry, `Manifest sollte einen Eintrag für "${id}" enthalten`);
    assert.equal(entry.status, 'needs_language_review', `${id} darf noch nicht "ready_for_generation" sein`);
  }
});
