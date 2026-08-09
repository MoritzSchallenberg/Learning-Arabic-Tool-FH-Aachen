// Entwicklungsauftrag 12, Abschnitt 7/18 — Tests für den lokalen Sprachprüf-Arbeitsbereich
// (scripts/review/reviewWorkspaceStore.js). Läuft ausschließlich gegen isolierte temporäre
// Verzeichnisse, rührt nie die echten Projektdateien an.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const store = require('../../scripts/review/reviewWorkspaceStore.js');

function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'review-store-test-'));
  fs.writeFileSync(path.join(root, 'audio_generation_manifest.json'), JSON.stringify({
    entries: [
      { id: 'w1', status: 'needs_language_review', generation_status: 'generated_unreviewed', audio_review_status: 'not_reviewed', generation: {} }
    ]
  }, null, 2));
  return root;
}
function cleanup(root) { fs.rmSync(root, { recursive: true, force: true }); }

test('proposeWordCorrection: Original und Vorschlag bleiben beide sichtbar, nichts geht verloren', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const result = await store.proposeWordCorrection(p, { wordId: 'w1', field: 'proposed_arabic_vocalized', originalValue: 'أَهْلاً', proposedValue: 'أَهْلًا', reviewerInitials: 'AB' });
    assert.equal(result.ok, true);
    assert.equal(result.entry.corrections.proposed_arabic_vocalized.originalValue, 'أَهْلاً');
    assert.equal(result.entry.corrections.proposed_arabic_vocalized.proposedValue, 'أَهْلًا');
  } finally { cleanup(root); }
});

test('proposeWordCorrection: eine zweite Korrektur an einem ANDEREN Feld überschreibt die erste nicht', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    await store.proposeWordCorrection(p, { wordId: 'w1', field: 'proposed_transliteration', originalValue: 'ahlan', proposedValue: 'ahlan wa sahlan' });
    const result = await store.proposeWordCorrection(p, { wordId: 'w1', field: 'part_of_speech', originalValue: 'Ausdruck', proposedValue: 'Substantiv' });
    assert.ok(result.entry.corrections.proposed_transliteration);
    assert.ok(result.entry.corrections.part_of_speech);
  } finally { cleanup(root); }
});

test('proposeWordCorrection: Konflikterkennung bei veralteter Version', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const first = await store.proposeWordCorrection(p, { wordId: 'w1', field: 'notes', originalValue: '', proposedValue: 'Notiz A' });
    // "veraltete" Version (0 statt der jetzt aktuellen 1) simuliert ein zweites, nicht mehr aktuelles Fenster.
    const conflicting = await store.proposeWordCorrection(p, { wordId: 'w1', field: 'notes', originalValue: '', proposedValue: 'Notiz B', expectedVersion: 0 });
    assert.equal(conflicting.ok, false);
    assert.equal(conflicting.conflict, true);
    assert.equal(conflicting.currentVersion, first.entry.version);
  } finally { cleanup(root); }
});

test('setWordAspectResult: Öffnen (kein Aufruf) ändert nichts -- Ausgangszustand ist überall "not_yet_reviewed"', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const state = store.loadState(p.wordStatePath);
    assert.deepEqual(state, {}, 'ohne jede Interaktion darf der Arbeitsbereich leer sein');
  } finally { cleanup(root); }
});

test('setWordAspectResult: setzt genau einen Aspekt, verändert den übergeordneten Status NICHT (Regel 2)', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const result = await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: 'vocalization', result: 'correct' });
    assert.equal(result.entry.aspects.vocalization.result, 'correct');
    assert.equal(result.entry.overallStatus, 'needs_language_review', 'Bearbeiten eines Aspekts darf nicht automatisch zu "reviewed" führen');
  } finally { cleanup(root); }
});

test('setWordOverallStatus: "reviewed" scheitert, solange nicht alle Aspekte bearbeitet sind', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: 'vocalization', result: 'correct' });
    const result = await store.setWordOverallStatus(p, { wordId: 'w1', status: 'reviewed' });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'aspects_incomplete');
    assert.ok(result.unresolved.length > 0);
  } finally { cleanup(root); }
});

test('setWordOverallStatus: "reviewed" gelingt, sobald alle Aspekte (auch "unsicher") bearbeitet sind', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const { WORD_ASPECT_KEYS } = require('../../scripts/review/reviewConstants.js');
    for (const key of WORD_ASPECT_KEYS) {
      // eslint-disable-next-line no-await-in-loop
      await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: key, result: key === 'gender_plural' ? 'uncertain' : 'correct' });
    }
    const result = await store.setWordOverallStatus(p, { wordId: 'w1', status: 'reviewed' });
    assert.equal(result.ok, true);
    assert.equal(result.entry.overallStatus, 'reviewed');
  } finally { cleanup(root); }
});

test('setWordOverallStatus: ein unsicherer Eintrag kann NICHT auf "approved" gesetzt werden (Regel 3)', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const { WORD_ASPECT_KEYS } = require('../../scripts/review/reviewConstants.js');
    for (const key of WORD_ASPECT_KEYS) {
      // eslint-disable-next-line no-await-in-loop
      await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: key, result: key === 'translation' ? 'uncertain' : 'correct' });
    }
    const result = await store.setWordOverallStatus(p, { wordId: 'w1', status: 'approved', explicitConfirmation: true });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'not_ready_for_approval');
  } finally { cleanup(root); }
});

test('setWordOverallStatus: "approved" scheitert ohne explizite Bestätigung, selbst wenn alles korrekt ist (Regel 5)', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const { WORD_ASPECT_KEYS } = require('../../scripts/review/reviewConstants.js');
    for (const key of WORD_ASPECT_KEYS) {
      // eslint-disable-next-line no-await-in-loop
      await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: key, result: 'correct' });
    }
    const withoutConfirmation = await store.setWordOverallStatus(p, { wordId: 'w1', status: 'approved' });
    assert.equal(withoutConfirmation.ok, false);
    assert.equal(withoutConfirmation.error, 'explicit_confirmation_required');

    const withConfirmation = await store.setWordOverallStatus(p, { wordId: 'w1', status: 'approved', explicitConfirmation: true });
    assert.equal(withConfirmation.ok, true);
    assert.equal(withConfirmation.entry.overallStatus, 'approved');
  } finally { cleanup(root); }
});

test('Audioaussprache "Korrektur vorgeschlagen": setzt generation_status im Manifest auf regeneration_required, löscht die Datei nicht', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: 'audio_pronunciation', result: 'correction_proposed', note: 'klingt falsch betont' });
    const manifest = JSON.parse(fs.readFileSync(p.manifestPath, 'utf-8'));
    const entry = manifest.entries.find((e) => e.id === 'w1');
    assert.equal(entry.generation_status, 'regeneration_required');
    assert.equal(entry.audio_review_status, 'rejected');
  } finally { cleanup(root); }
});

test('Audioaussprache "korrekt": markiert audio_review_status als approved, KEINE automatische Neugenerierung', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: 'audio_pronunciation', result: 'correct' });
    const manifest = JSON.parse(fs.readFileSync(p.manifestPath, 'utf-8'));
    const entry = manifest.entries.find((e) => e.id === 'w1');
    assert.equal(entry.audio_review_status, 'approved');
    assert.equal(entry.generation_status, 'generated_unreviewed', 'darf sich nicht selbst auf einen "erzeugt"-Status setzen -- keine automatische Neugenerierung');
  } finally { cleanup(root); }
});

test('Änderungsverlauf: enthält vorherigen Wert, Korrekturvorschlag, Feld, Zeitstempel, Prüferkürzel und Begründung', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    await store.proposeWordCorrection(p, { wordId: 'w1', field: 'part_of_speech', originalValue: 'Ausdruck', proposedValue: 'Substantiv', reviewerInitials: 'MS', reason: 'Quelle: Hans Wehr' });
    const history = store.loadHistory(p.historyPath);
    assert.equal(history.length, 1);
    assert.equal(history[0].previousValue, 'Ausdruck');
    assert.equal(history[0].proposedValue, 'Substantiv');
    assert.equal(history[0].field, 'part_of_speech');
    assert.equal(history[0].reviewerInitials, 'MS');
    assert.equal(history[0].reason, 'Quelle: Hans Wehr');
    assert.ok(history[0].timestamp);
  } finally { cleanup(root); }
});

test('nach Absturz wiederherstellbar: eine kaputte word_review_state.json fällt auf die .bak-Sicherung zurück', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: 'vocalization', result: 'correct' });
    await store.setWordAspectResult(p, { wordId: 'w1', aspectKey: 'translation', result: 'correct' }); // erzeugt ein .bak vom vorherigen Stand
    fs.writeFileSync(p.wordStatePath, '{kaputtes json');
    const recovered = store.loadState(p.wordStatePath);
    assert.equal(recovered.w1.aspects.vocalization.result, 'correct');
  } finally { cleanup(root); }
});

test('parallele Speichervorgänge: mehrere gleichzeitige Aspekt-Änderungen gehen nicht verloren (Speicherwarteschlange)', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const { WORD_ASPECT_KEYS } = require('../../scripts/review/reviewConstants.js');
    await Promise.all(WORD_ASPECT_KEYS.map((key) => store.setWordAspectResult(p, { wordId: 'w1', aspectKey: key, result: 'correct' })));
    const state = store.loadState(p.wordStatePath);
    for (const key of WORD_ASPECT_KEYS) {
      assert.equal(state.w1.aspects[key].result, 'correct', `Aspekt "${key}" darf bei parallelen Schreibvorgängen nicht verloren gehen`);
    }
  } finally { cleanup(root); }
});

test('exportWorkspace: enthält nur die erlaubten Dateien, keinen Quellcode und keinen API-Schlüssel', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    await store.proposeWordCorrection(p, { wordId: 'w1', field: 'notes', originalValue: '', proposedValue: 'geheimer-api-schluessel-darf-hier-nicht-stehen sk-1234' });
    const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-export-test-'));
    try {
      const result = store.exportWorkspace(p, exportDir);
      const files = fs.readdirSync(result.targetDir);
      assert.ok(files.includes('export_word_reviews.json'));
      assert.ok(files.includes('export_change_history.json'));
      assert.ok(files.includes('export_status_summary.json'));
      assert.ok(files.includes('export_audio_problems.json'));
      assert.ok(files.includes('export_regeneration_required.json'));
      assert.ok(!files.some((f) => f.endsWith('.js')), 'Export darf keinen Quellcode enthalten');
      assert.ok(!files.some((f) => f.endsWith('.wav')), 'Export darf keine rohen Audiodateien enthalten');
    } finally { fs.rmSync(exportDir, { recursive: true, force: true }); }
  } finally { cleanup(root); }
});

test('Theorie: identisches Muster -- Korrektur, Aspekt, Status, reviewed erfordert alle Theorie-Aspekte', async () => {
  const root = makeRoot();
  try {
    const p = store.paths(root);
    const { THEORY_ASPECT_KEYS } = require('../../scripts/review/reviewConstants.js');
    const partial = await store.setTheoryOverallStatus(p, { theoryId: 't1', status: 'reviewed' });
    assert.equal(partial.ok, false);
    for (const key of THEORY_ASPECT_KEYS) {
      // eslint-disable-next-line no-await-in-loop
      await store.setTheoryAspectResult(p, { theoryId: 't1', aspectKey: key, result: 'correct' });
    }
    const result = await store.setTheoryOverallStatus(p, { theoryId: 't1', status: 'reviewed' });
    assert.equal(result.ok, true);
  } finally { cleanup(root); }
});
