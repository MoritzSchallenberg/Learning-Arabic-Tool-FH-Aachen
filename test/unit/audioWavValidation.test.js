// Entwicklungsauftrag 12, Abschnitt 13/18 — Tests für die rein technische WAV-Prüfung
// (scripts/audio/wavValidation.js). Baut synthetische WAV-Buffer selbst, ruft nie ein echtes
// Audio-Tool und macht keine Netzwerkaufrufe.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateAudioBuffer, parseWavHeader, isLikelySilent, sha256, textHash } = require('../../scripts/audio/wavValidation.js');
const { buildTestWav: buildWav } = require('../helpers/buildTestWav.js');

test('validateAudioBuffer: eine plausible, nicht-stumme WAV-Datei besteht die Prüfung', () => {
  const buffer = buildWav({ durationSeconds: 1 });
  const result = validateAudioBuffer(buffer);
  assert.equal(result.ok, true, result.problems.join('; '));
  assert.equal(result.header.fmt.sampleRate, 22050);
});

test('validateAudioBuffer: eine als WAV gespeicherte JSON-Fehlerantwort wird abgelehnt', () => {
  const fakeErrorBody = Buffer.from(JSON.stringify({ detail: 'quota_exceeded' }), 'utf-8');
  const result = validateAudioBuffer(fakeErrorBody);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('JSON')));
});

test('validateAudioBuffer: eine HTML-Fehlerseite wird abgelehnt', () => {
  const html = Buffer.from('<!DOCTYPE html><html><body>502 Bad Gateway</body></html>', 'utf-8');
  const result = validateAudioBuffer(html);
  assert.equal(result.ok, false);
});

test('validateAudioBuffer: leerer Buffer wird abgelehnt, ohne zu werfen', () => {
  const result = validateAudioBuffer(Buffer.alloc(0));
  assert.equal(result.ok, false);
  assert.ok(result.problems.includes('Datei ist leer'));
});

test('validateAudioBuffer: unplausibel winzige Datei wird abgelehnt', () => {
  const result = validateAudioBuffer(Buffer.alloc(50));
  assert.equal(result.ok, false);
});

test('validateAudioBuffer: kaputter/abgeschnittener WAV-Header wird abgelehnt', () => {
  const truncated = buildWav({ durationSeconds: 1 }).subarray(0, 30);
  const result = validateAudioBuffer(truncated);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('WAV-Header')));
});

test('validateAudioBuffer: unplausibel kurze Aufnahme (0.01s) wird abgelehnt', () => {
  const buffer = buildWav({ durationSeconds: 0.01 });
  const result = validateAudioBuffer(buffer);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('unplausibel kurz')));
});

test('validateAudioBuffer: (fast) vollständig stumme Datei wird abgelehnt', () => {
  const buffer = buildWav({ durationSeconds: 1, silent: true });
  const result = validateAudioBuffer(buffer);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('stumm')));
});

test('isLikelySilent: erkennt hörbaren Ton nicht fälschlich als stumm', () => {
  const buffer = buildWav({ durationSeconds: 0.5, amplitude: 15000 });
  const header = parseWavHeader(buffer);
  assert.equal(isLikelySilent(buffer, header), false);
});

test('sha256/textHash: liefern stabile, deterministische Prüfsummen', () => {
  const buffer = buildWav({ durationSeconds: 0.3 });
  assert.equal(sha256(buffer), sha256(buffer));
  assert.equal(textHash('كَيْفَ حَالُكَ؟'), textHash('كَيْفَ حَالُكَ؟'));
  assert.notEqual(textHash('كَيْفَ حَالُكَ؟'), textHash('غير ذلك'));
});
