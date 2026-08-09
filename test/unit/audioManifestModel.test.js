// Entwicklungsauftrag 12, Abschnitt 9/18 — Tests für das erweiterte, rückwärtskompatible
// Statusmodell (scripts/audio/audioManifestModel.js).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeEntry, normalizeManifest, enrichEntryWithWordMeta,
  LANGUAGE_STATUS_VALUES, GENERATION_STATUS_VALUES, AUDIO_REVIEW_STATUS_VALUES
} = require('../../scripts/audio/audioManifestModel.js');

test('normalizeEntry: alte, noch nicht migrierte Einträge bekommen sinnvolle Startwerte, "status" bleibt unverändert', () => {
  const raw = { id: 'x1', status: 'needs_language_review', arabic_vocalized: 'س' };
  const normalized = normalizeEntry(raw);
  assert.equal(normalized.status, 'needs_language_review');
  assert.equal(normalized.language_status, 'needs_language_review');
  assert.equal(normalized.generation_status, 'pending');
  assert.equal(normalized.audio_review_status, 'not_reviewed');
  assert.equal(normalized.generation.checksum_sha256, null);
});

test('normalizeEntry: bereits migrierte, fortgeschrittene Einträge werden nicht zurückgesetzt (idempotent)', () => {
  const raw = {
    id: 'x1',
    status: 'needs_language_review',
    language_status: 'needs_language_review',
    generation_status: 'generated_unreviewed',
    audio_review_status: 'approved',
    generation: { provider: 'elevenlabs', checksum_sha256: 'abc123' }
  };
  const normalized = normalizeEntry(raw);
  assert.equal(normalized.generation_status, 'generated_unreviewed');
  assert.equal(normalized.audio_review_status, 'approved');
  assert.equal(normalized.generation.checksum_sha256, 'abc123');
});

test('normalizeManifest: verarbeitet alle Einträge, lässt sonstige Manifest-Felder (z. B. "note") unangetastet', () => {
  const doc = { note: 'Testnotiz', entries: [{ id: 'a', status: 'needs_language_review' }, { id: 'b', status: 'needs_language_review' }] };
  const normalized = normalizeManifest(doc);
  assert.equal(normalized.note, 'Testnotiz');
  assert.equal(normalized.entries.length, 2);
  assert.ok(normalized.entries.every((e) => GENERATION_STATUS_VALUES.includes(e.generation_status)));
});

test('enrichEntryWithWordMeta: ergänzt unit_id/session_id aus dem zugehörigen Wort, überschreibt vorhandene Werte nicht', () => {
  const entry = { id: 'a' };
  const word = { unit_id: 'vocab_unit_07', session_id: 'vocab_unit_07_b' };
  const enriched = enrichEntryWithWordMeta(entry, word);
  assert.equal(enriched.unit_id, 'vocab_unit_07');
  assert.equal(enriched.session_id, 'vocab_unit_07_b');

  const alreadySet = { id: 'a', unit_id: 'vocab_unit_99' };
  assert.equal(enrichEntryWithWordMeta(alreadySet, word).unit_id, 'vocab_unit_99');
});

test('enrichEntryWithWordMeta: unbekanntes Wort (kein Treffer) lässt den Eintrag unverändert statt zu werfen', () => {
  const entry = { id: 'a' };
  const enriched = enrichEntryWithWordMeta(entry, undefined);
  assert.deepEqual(enriched, entry);
});

test('Statuswerte-Listen sind vollständig und disjunkt genug definiert', () => {
  assert.deepEqual(LANGUAGE_STATUS_VALUES, ['needs_language_review', 'reviewed', 'approved']);
  assert.ok(GENERATION_STATUS_VALUES.includes('preview_generation_authorized'));
  assert.ok(GENERATION_STATUS_VALUES.includes('generated_unreviewed'));
  assert.ok(GENERATION_STATUS_VALUES.includes('regeneration_required'));
  assert.deepEqual(AUDIO_REVIEW_STATUS_VALUES, ['not_reviewed', 'approved', 'rejected', 'uncertain']);
});
