// Regressionstest für den nachträglich (im Anschluss an Entwicklungsauftrag 9) geschlossenen
// "Batch 0"-Folgepunkt: language-review/batch_00.json für die 141 ursprünglichen Bestandswörter
// mit vorhandener Audiodatei. Analog zu den Content-Tests der Batches 1-4, aber schlanker, weil
// hier kein Datenmodell mehr angehoben wird (alle 141 Wörter waren bereits vollständig).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const AUDIO_DIR = path.join(PACK, 'audio', 'vocabulary');
const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const words = vocabulary.categories.flatMap((c) => c.words);
const wordsById = new Map(words.map((w) => [w.id, w]));

const legacyIdsWithAudio = words
  .filter((w) => !w.id.startsWith('c1_') && fs.existsSync(path.join(AUDIO_DIR, `${w.id}.wav`)))
  .map((w) => w.id)
  .sort();

test('language-review/batch_00.json existiert und enthält genau die 141 ursprünglichen Bestandswörter mit Audiodatei', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_00.json');
  assert.ok(fs.existsSync(batchPath), 'language-review/batch_00.json sollte existieren');
  const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  assert.equal(doc.batch, 0);
  assert.equal(doc.word_count, 141);
  assert.equal(doc.entries.length, 141);
  assert.deepEqual([...doc.entries.map((e) => e.id)].sort(), legacyIdsWithAudio);
  assert.ok(Array.isArray(doc.units_covered), 'units_covered sollte ein Array sein (nicht der frühere String-Bug)');
});

test('batch_00.json: jeder Eintrag ist bereits vollständig modelliert und startet mit unbestätigter Prüfung', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_00.json');
  const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  for (const e of doc.entries) {
    const w = wordsById.get(e.id);
    assert.ok(w, `Wort "${e.id}" sollte in vocabulary.json existieren`);
    assert.ok(e.proposed_arabic_vocalized, `${e.id}: proposed_arabic_vocalized fehlt`);
    assert.ok(e.proposed_transliteration, `${e.id}: proposed_transliteration fehlt`);
    assert.ok(Array.isArray(e.accepted_arabic_answers) && e.accepted_arabic_answers.length > 0, `${e.id}: accepted_arabic_answers fehlt/leer`);
    assert.ok(Array.isArray(e.application_prompts) && e.application_prompts.length > 0, `${e.id}: application_prompts fehlt/leer`);
    assert.equal(e.has_audio, true);
    assert.equal(e.review_status, 'needs_language_review');
    for (const flag of ['arabic_vocalization_reviewed', 'transliteration_reviewed', 'german_translation_reviewed', 'application_prompts_reviewed']) {
      assert.equal(e.review[flag], false, `${e.id}.review.${flag} sollte initial false sein`);
    }
    // content_status des zugrundeliegenden Wortes bleibt unverändert -- eine vorhandene
    // Audiodatei ist keine Sprachprüfung (Entwicklungsauftrag 9, Abschnitt 7).
    assert.equal(w.content_status, 'needs_language_review');
  }
});

test('batch_00.json enthält kein theory_review-Feld (bewusst, siehe Kommentarkopf des Erzeugungsskripts)', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_00.json');
  const doc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  assert.ok(!('theory_review' in doc));
});

test('scripts/build-batch0-legacy-review.js ist idempotent', () => {
  const batchPath = path.join(ROOT, 'language-review', 'batch_00.json');
  const before = fs.readFileSync(batchPath, 'utf-8');
  execFileSync('node', [path.join(ROOT, 'scripts', 'build-batch0-legacy-review.js')], { cwd: ROOT });
  const after = fs.readFileSync(batchPath, 'utf-8');
  assert.equal(after, before, 'ein erneuter Lauf sollte batch_00.json unverändert lassen');
});

test('audio_generation_manifest.json enthält KEINE der 141 Batch-0-Wörter (sie brauchen keine neue Audioerzeugung)', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio_generation_manifest.json'), 'utf-8'));
  const manifestIds = new Set(manifest.entries.map((e) => e.id));
  const overlap = legacyIdsWithAudio.filter((id) => manifestIds.has(id));
  assert.deepEqual(overlap, [], 'Batch-0-Wörter sollten nicht im Audio-Generierungsmanifest auftauchen');
});
