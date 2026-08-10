// Entwicklungsauftrag 13, Abschnitt 3.2/18 — Tests für das abgeleitete audio_status-Modell.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AUDIO_STATUS_VALUES, computeAudioStatus } = require('../../scripts/audio/audioStatusModel.js');

test('AUDIO_STATUS_VALUES: genau die 5 vorgesehenen Werte, keine Dopplungen', () => {
  assert.equal(AUDIO_STATUS_VALUES.length, 5);
  assert.equal(new Set(AUDIO_STATUS_VALUES).size, 5);
});

test('computeAudioStatus: Datei vorhanden, kein Manifest-Eintrag -> available_legacy_unreviewed', () => {
  assert.equal(computeAudioStatus({ fileExists: true, manifestEntry: null, audioReviewApproved: false }), 'available_legacy_unreviewed');
});

test('computeAudioStatus: Datei vorhanden, Manifest-Eintrag vorhanden -> generated_unreviewed', () => {
  assert.equal(computeAudioStatus({ fileExists: true, manifestEntry: { generation_status: 'generated_unreviewed' }, audioReviewApproved: false }), 'generated_unreviewed');
});

test('computeAudioStatus: keine Datei, kein Manifest-Eintrag -> missing', () => {
  assert.equal(computeAudioStatus({ fileExists: false, manifestEntry: null, audioReviewApproved: false }), 'missing');
});

test('computeAudioStatus: keine Datei, Manifest-Eintrag mit generation_status failed -> generation_failed', () => {
  assert.equal(computeAudioStatus({ fileExists: false, manifestEntry: { generation_status: 'failed' }, audioReviewApproved: false }), 'generation_failed');
});

test('computeAudioStatus: keine Datei, Manifest-Eintrag mit generation_status pending -> missing (kein Fehlschlag, nur noch nicht versucht)', () => {
  assert.equal(computeAudioStatus({ fileExists: false, manifestEntry: { generation_status: 'pending' }, audioReviewApproved: false }), 'missing');
});

test('computeAudioStatus: audioReviewApproved gewinnt immer -> reviewed (nur von einem Menschen setzbar, hier nur die reine Ableitung getestet)', () => {
  assert.equal(computeAudioStatus({ fileExists: true, manifestEntry: { generation_status: 'generated_unreviewed' }, audioReviewApproved: true }), 'reviewed');
});
