// Inhaltstests für Kurs 1, Units 6-10 (Entwicklungsauftrag 7, Abschnitt 30). Prüft direkt gegen
// die echten Sprachpaketdateien (kein Mock) — anders als scriptUnitTheory.test.js/sessionEngine.
// test.js geht es hier NICHT um Ablauflogik, sondern um inhaltliche Vollständigkeit dieses
// konkreten Batches.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PACK = path.join(__dirname, '..', '..', 'language-packs', 'arabic');
const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const vocabSessions = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabSessions.json'), 'utf-8'));
const theoryData = JSON.parse(fs.readFileSync(path.join(PACK, 'theory.json'), 'utf-8'));

const words = vocabulary.categories.flatMap((c) => c.words);
const wordsById = new Map(words.map((w) => [w.id, w]));

const UNIT_IDS = ['vocab_unit_06', 'vocab_unit_07', 'vocab_unit_08', 'vocab_unit_09', 'vocab_unit_10'];
const NEW_WORD_IDS = words.filter((w) => UNIT_IDS.includes(w.unit_id) && w.id.startsWith('c1_')).map((w) => w.id);

test('Units 6-10: genau 150 Wörter (18 bestehende + 132 neue), keine doppelten IDs', () => {
  const unitWords = words.filter((w) => UNIT_IDS.includes(w.unit_id));
  assert.equal(unitWords.length, 150, 'Units 6-10 sollten zusammen 150 Wörter enthalten');
  assert.equal(NEW_WORD_IDS.length, 132, '132 davon sollten neue c1_-Wörter sein');
  assert.equal(new Set(unitWords.map((w) => w.id)).size, 150, 'keine doppelten IDs innerhalb der 150 Wörter');
});

test('Units 6-10: jede Unit hat genau 30 Wörter, jede Session genau 10', () => {
  for (const unitId of UNIT_IDS) {
    const n = words.filter((w) => w.unit_id === unitId).length;
    assert.equal(n, 30, `${unitId} sollte 30 Wörter haben, hat ${n}`);
  }
  const sessions = vocabSessions.sessions.filter((s) => UNIT_IDS.includes(s.unit_id));
  assert.equal(sessions.length, 15, 'Units 6-10 sollten zusammen 15 Sessions haben');
  for (const s of sessions) {
    assert.equal(s.new_word_ids.length, 10, `${s.session_id} sollte genau 10 Wörter haben`);
  }
});

test('Units 6-10: jedes neue Wort erfüllt das "lernfähige" Datenmodell', () => {
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

test('Units 6-10: jedes neue Wort hat mindestens einen gültigen application_prompt', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    assert.ok(Array.isArray(w.application_prompts) && w.application_prompts.length > 0, `${id}: application_prompts fehlt/leer`);
    for (const p of w.application_prompts) {
      assert.ok(p.prompt && p.prompt.trim(), `${id}: application_prompt ohne "prompt"`);
      assert.ok(p.expected_meaning || p.expected_word_id, `${id}: application_prompt ohne "expected_meaning"/"expected_word_id"`);
    }
  }
});

test('Units 6-10: Substantive haben ein bearbeitetes gender-/plural-Feld (auch wenn null)', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    if (w.part_of_speech === 'Substantiv' || w.part_of_speech === 'Substantiv/Adjektiv') {
      assert.ok('gender' in w, `${id}: Substantiv ohne bearbeitetes gender-Feld`);
      assert.ok('plural' in w, `${id}: Substantiv ohne bearbeitetes plural-Feld`);
    }
  }
});

test('Units 6-10: alle 15 Sessions haben vollständige, keine Platzhalter-Theorie', () => {
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
    const typischerFehler = doc.blocks.find((b) => b.type === 'callout' && b.title === 'Typischer Fehler');
    assert.ok(merke, `${s.theory_id}: "Merke"-Callout fehlt`);
    assert.ok(typischerFehler, `${s.theory_id}: "Typischer Fehler"-Callout fehlt`);
  }
});

test('Units 6-10: application_prompts referenzieren keine unbekannten expected_word_id', () => {
  for (const id of NEW_WORD_IDS) {
    const w = wordsById.get(id);
    for (const p of w.application_prompts) {
      if (p.expected_word_id) assert.ok(wordsById.has(p.expected_word_id), `${id}: expected_word_id "${p.expected_word_id}" existiert nicht`);
    }
  }
});

test('Units 6-10: keine Wort-ID dieses Batches ist im JavaScript hart codiert (rein datenbasierte Application-Phase)', () => {
  const srcDir = path.join(__dirname, '..', '..', 'src', 'js');
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
  assert.deepEqual(offenders, [], 'keine Wort-ID aus Units 6-10 sollte im Quellcode hart codiert sein');
});
