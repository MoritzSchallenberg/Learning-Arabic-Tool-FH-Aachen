// Entwicklungsauftrag 12, Abschnitt 3/18 — Tests für scripts/review/reviewDataLoader.js.
// Läuft sowohl gegen das ECHTE Sprachpaket (900 Wörter/90 Theorien -- prüft die realen Zahlen)
// als auch gegen eine kleine synthetische Fixtur (prüft die Verknüpfungslogik selbst).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loadReviewData, computeDashboardSummary } = require('../../scripts/review/reviewDataLoader.js');

const REAL_ROOT = path.join(__dirname, '..', '..');

test('loadReviewData (echtes Sprachpaket): genau 900 Wörter und 90 Vokabel-Session-Theorien, jedes Wort mit Audiozustand', () => {
  const data = loadReviewData(REAL_ROOT);
  assert.equal(data.words.length, 900);
  assert.equal(data.theories.length, 90);
  assert.ok(data.words.every((w) => w.audio && ['manifest', 'legacy_bestand', 'missing'].includes(w.audio.source)));
  const bySource = {};
  for (const w of data.words) bySource[w.audio.source] = (bySource[w.audio.source] || 0) + 1;
  assert.equal(bySource.manifest, 759);
  assert.equal(bySource.legacy_bestand, 141);
  assert.equal(bySource.missing || 0, 0, 'nach heutigem Datenstand hat jedes Wort entweder eine Bestandsaudio oder einen Manifest-Eintrag');
});

test('loadReviewData (echtes Sprachpaket): jedes Wort ist genau einem Batch 0-6 zugeordnet', () => {
  const data = loadReviewData(REAL_ROOT);
  const byBatch = {};
  for (const w of data.words) byBatch[w.batch] = (byBatch[w.batch] || 0) + 1;
  assert.equal(byBatch[0], 141);
  assert.equal(byBatch[1] + byBatch[2] + byBatch[3] + byBatch[4] + byBatch[5] + byBatch[6], 759);
});

test('loadReviewData (echtes Sprachpaket): ohne jede Interaktion ist workspace für alle Einträge null (frischer Arbeitsbereich)', () => {
  // Nur gültig, solange die echte language-review/workspace/-Datei nicht existiert bzw. leer ist
  // -- in diesem Auftrag wird bewusst kein einziger Eintrag automatisch geprüft (Regel 7).
  const workspacePath = path.join(REAL_ROOT, 'language-review', 'workspace', 'word_review_state.json');
  if (fs.existsSync(workspacePath)) {
    const content = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));
    assert.deepEqual(content, {}, 'die echte Projekt-Arbeitsbereichsdatei darf durch diesen Auftrag nicht befüllt werden');
  }
});

function makeSyntheticRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'review-loader-test-'));
  const pack = path.join(root, 'language-packs', 'arabic');
  fs.mkdirSync(path.join(pack, 'audio', 'vocabulary'), { recursive: true });
  fs.mkdirSync(path.join(root, 'language-review'), { recursive: true });

  fs.writeFileSync(path.join(pack, 'vocabulary.json'), JSON.stringify({
    categories: [{
      id: 'cat1',
      words: [
        { id: 'legacy1', arabic_vocalized: 'ك', german_answers: ['x'], unit_id: 'vocab_unit_01', session_id: 'vocab_unit_01_a', content_status: 'needs_language_review' },
        { id: 'new1', arabic_vocalized: 'ل', german_answers: ['y'], unit_id: 'vocab_unit_06', session_id: 'vocab_unit_06_a', content_status: 'needs_language_review' },
        { id: 'missing1', arabic_vocalized: 'م', german_answers: ['z'], unit_id: 'vocab_unit_06', session_id: 'vocab_unit_06_a', content_status: 'needs_language_review' }
      ]
    }]
  }, null, 2));
  fs.writeFileSync(path.join(pack, 'audio', 'vocabulary', 'legacy1.wav'), Buffer.from('RIFFxxxxWAVE'));

  fs.writeFileSync(path.join(pack, 'theory.json'), JSON.stringify({
    theories: [{ theory_id: 'theory_a', title: 'Theorie A', content_status: 'needs_language_review', learning_objectives: [], blocks: [] }]
  }, null, 2));

  fs.writeFileSync(path.join(pack, 'vocabSessions.json'), JSON.stringify({
    vocab_units: [],
    sessions: [{ session_id: 'vocab_unit_06_a', unit_id: 'vocab_unit_06', title: 'Session A', theory_id: 'theory_a', new_word_ids: ['new1', 'missing1'] }]
  }, null, 2));

  fs.writeFileSync(path.join(root, 'audio_generation_manifest.json'), JSON.stringify({
    entries: [{ id: 'new1', status: 'needs_language_review', generation_status: 'generated_unreviewed', audio_review_status: 'not_reviewed', generation: { provider: 'elevenlabs' } }]
  }, null, 2));

  fs.writeFileSync(path.join(root, 'language-review', 'batch_01.json'), JSON.stringify({
    batch: 1,
    entries: [{ id: 'new1', review_status: 'needs_language_review' }],
    theory_review: [{ theory_id: 'theory_a', title: 'Theorie A', review_status: 'needs_language_review' }]
  }, null, 2));

  return root;
}

test('loadReviewData (synthetisch): erkennt alle drei Audiozustände korrekt (Bestand/Manifest/fehlend)', () => {
  const root = makeSyntheticRoot();
  try {
    const data = loadReviewData(root);
    const byId = new Map(data.words.map((w) => [w.id, w]));
    assert.equal(byId.get('legacy1').audio.source, 'legacy_bestand');
    assert.equal(byId.get('new1').audio.source, 'manifest');
    assert.equal(byId.get('new1').audio.provider, 'elevenlabs');
    assert.equal(byId.get('missing1').audio.source, 'missing');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('loadReviewData (synthetisch): verknüpft Theorien korrekt mit ihrer Session/Unit und dem Batch-Review-Eintrag', () => {
  const root = makeSyntheticRoot();
  try {
    const data = loadReviewData(root);
    assert.equal(data.theories.length, 1);
    assert.equal(data.theories[0].unit_id, 'vocab_unit_06');
    assert.equal(data.theories[0].batch, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('computeDashboardSummary: keine Zählung ist hart codiert -- Änderung der Fixtur ändert die berechneten Zahlen', () => {
  const root = makeSyntheticRoot();
  try {
    const data = loadReviewData(root);
    const summary = computeDashboardSummary(data);
    assert.equal(summary.totalWords, 3);
    assert.equal(summary.totalTheories, 1);
    assert.equal(summary.wordStatusCounts.needs_language_review, 3, 'ohne Workspace-Interaktion sind alle Wörter noch "needs_language_review"');
    assert.equal(summary.uncertainWords, 0);
    assert.equal(summary.byUnit.vocab_unit_06.total, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('computeDashboardSummary: spiegelt Workspace-Fortschritt korrekt wider', async () => {
  const root = makeSyntheticRoot();
  try {
    const store = require('../../scripts/review/reviewWorkspaceStore.js');
    const p = store.paths(root);
    const { WORD_ASPECT_KEYS } = require('../../scripts/review/reviewConstants.js');
    for (const key of WORD_ASPECT_KEYS) {
      // eslint-disable-next-line no-await-in-loop
      await store.setWordAspectResult(p, { wordId: 'new1', aspectKey: key, result: 'correct' });
    }
    await store.setWordOverallStatus(p, { wordId: 'new1', status: 'reviewed' });

    const data = loadReviewData(root);
    const summary = computeDashboardSummary(data);
    assert.equal(summary.wordStatusCounts.reviewed, 1);
    assert.equal(summary.wordStatusCounts.needs_language_review, 2);
    assert.equal(summary.byUnit.vocab_unit_06.reviewed, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
