// Entwicklungsauftrag 13, Abschnitt 10 — globaler Audio-Integrations-Audit über alle 900 Wörter.
// Läuft gegen die ECHTEN Sprachpaketdateien (wie test/unit/kurs1GlobalAudit.test.js aus
// Entwicklungsauftrag 11), deckt konkrete IDs auf statt nur Summen zu melden. Ergänzt (nicht
// ersetzt) die bestehenden Audits.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { AUDIO_KEY_PATTERN } = require('../../scripts/audioFileAccess.js');
const { AUDIO_STATUS_VALUES } = require('../../scripts/audio/audioStatusModel.js');

const ROOT = path.join(__dirname, '..', '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const AUDIO_DIR = path.join(PACK, 'audio', 'vocabulary');
const LANGUAGE_REVIEW_DIR = path.join(ROOT, 'language-review');

const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const words = vocabulary.categories.flatMap((c) => c.words);
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio_generation_manifest.json'), 'utf-8'));
const manifestById = new Map(manifest.entries.map((e) => [e.id, e]));
const vocabSessions = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabSessions.json'), 'utf-8'));

function normalAudioPath(id) { return path.join(AUDIO_DIR, `${id}.wav`); }
function slowAudioPath(id) { return path.join(AUDIO_DIR, `${id}_slow.wav`); }
function fileExists(p) { return fs.existsSync(p); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

function hasValidWavHeader(buf) {
  return buf.length >= 44 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE';
}

// 1. Exakt 900 bekannte Vokabel-IDs.
test('Audio-Audit 1: exakt 900 eindeutige Vokabel-IDs', () => {
  assert.equal(words.length, 900);
  assert.equal(new Set(words.map((w) => w.id)).size, 900);
});

// 2. Für jede Vokabel existiert ein gültiger audio_key.
test('Audio-Audit 2: jedes Wort hat ein gültiges audio_key-Feld', () => {
  const missing = words.filter((w) => !w.audio_key);
  const invalid = words.filter((w) => w.audio_key && !AUDIO_KEY_PATTERN.test(w.audio_key));
  assert.deepEqual(missing.map((w) => w.id), []);
  assert.deepEqual(invalid.map((w) => w.id), []);
});

// 3. Für jeden audio_key existiert eine normale WAV-Datei.
test('Audio-Audit 3: für jeden audio_key existiert eine normale WAV-Datei', () => {
  const missing = words.filter((w) => !fileExists(normalAudioPath(w.id)));
  assert.deepEqual(missing.map((w) => w.id), [], `Fehlende Audiodatei für: ${missing.map((w) => w.id).join(', ')}`);
});

// 4. Jede Datei beginnt mit gültigem RIFF/WAVE-Header und enthält Audiodaten.
test('Audio-Audit 4: alle 900 normalen Dateien haben einen gültigen RIFF/WAVE-Header', () => {
  const invalid = [];
  for (const w of words) {
    const buf = fs.readFileSync(normalAudioPath(w.id));
    if (!hasValidWavHeader(buf) || buf.length < 100) invalid.push(w.id);
  }
  assert.deepEqual(invalid, [], `Ungültiger WAV-Header/zu kleine Datei bei: ${invalid.join(', ')}`);
});

// 5. Exakt 141 bekannte Wörter besitzen _slow.wav.
test('Audio-Audit 5: exakt 141 Wörter besitzen eine separate _slow.wav', () => {
  const withSlow = words.filter((w) => fileExists(slowAudioPath(w.id)));
  assert.equal(withSlow.length, 141);
});

// 6. Exakt 759 Wörter verwenden den Langsam-Fallback (keine eigene _slow.wav, aber normale Datei vorhanden).
test('Audio-Audit 6: exakt 759 Wörter verwenden den Langsam-Fallback (playbackRate statt eigener Datei)', () => {
  const fallbackWords = words.filter((w) => fileExists(normalAudioPath(w.id)) && !fileExists(slowAudioPath(w.id)));
  assert.equal(fallbackWords.length, 759);
});

// 7. Keine unbekannten oder verwaisten Vokabelaufnahmen.
test('Audio-Audit 7: keine verwaisten Audiodateien ohne zugehöriges Wort', () => {
  const knownIds = new Set(words.map((w) => w.id));
  const allFiles = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith('.wav'));
  const orphans = allFiles.filter((f) => {
    const id = f.replace(/_slow\.wav$/, '').replace(/\.wav$/, '');
    return !knownIds.has(id);
  });
  assert.deepEqual(orphans, [], `Verwaiste Dateien ohne Wort: ${orphans.join(', ')}`);
});

// 8. Keine doppelten audio_key-Werte.
test('Audio-Audit 8: keine doppelten audio_key-Werte', () => {
  const byKey = new Map();
  for (const w of words) {
    if (!byKey.has(w.audio_key)) byKey.set(w.audio_key, []);
    byKey.get(w.audio_key).push(w.id);
  }
  const duplicates = [...byKey.entries()].filter(([, ids]) => ids.length > 1);
  assert.deepEqual(duplicates, [], `Doppelt verwendete audio_key-Werte: ${JSON.stringify(duplicates)}`);
});

// 9. Manifest und tatsächliche Dateien stimmen überein.
test('Audio-Audit 9: Manifest (759 Einträge) und tatsächliche Dateien stimmen überein', () => {
  assert.equal(manifest.entries.length, 759);
  const mismatched = manifest.entries.filter((e) => e.generation_status === 'generated_unreviewed' && !fileExists(normalAudioPath(e.id)));
  assert.deepEqual(mismatched.map((e) => e.id), []);
});

// 10. audio_status und Dateiverfügbarkeit widersprechen sich nicht.
test('Audio-Audit 10: audio_status widerspricht nie der tatsächlichen Dateiverfügbarkeit', () => {
  const contradictions = [];
  for (const w of words) {
    assert.ok(AUDIO_STATUS_VALUES.includes(w.audio_status), `unbekannter audio_status bei ${w.id}: ${w.audio_status}`);
    const exists = fileExists(normalAudioPath(w.id));
    if (w.audio_status === 'missing' && exists) contradictions.push(`${w.id}: audio_status=missing, Datei existiert aber`);
    if ((w.audio_status === 'available_legacy_unreviewed' || w.audio_status === 'generated_unreviewed' || w.audio_status === 'reviewed') && !exists) {
      contradictions.push(`${w.id}: audio_status=${w.audio_status}, Datei fehlt aber`);
    }
  }
  assert.deepEqual(contradictions, []);
});

// 11. Alle 759 neu erzeugten Aufnahmen bleiben generated_unreviewed.
test('Audio-Audit 11: alle 759 Manifest-Einträge stehen auf generation_status generated_unreviewed', () => {
  const wrong = manifest.entries.filter((e) => e.generation_status !== 'generated_unreviewed');
  assert.deepEqual(wrong.map((e) => e.id), []);
});

// 12. Alle Audio-Reviewstatus bleiben not_reviewed, solange kein menschlicher Prüfentscheid vorliegt.
test('Audio-Audit 12: alle 759 Manifest-Einträge stehen auf audio_review_status not_reviewed (keine vorgetäuschte Prüfung)', () => {
  const wrong = manifest.entries.filter((e) => e.audio_review_status !== 'not_reviewed');
  assert.deepEqual(wrong.map((e) => e.id), []);
});

// 13. Alle 900 content_status bleiben needs_language_review.
test('Audio-Audit 13: alle 900 Wörter stehen weiterhin auf content_status needs_language_review', () => {
  const wrong = words.filter((w) => w.content_status !== 'needs_language_review');
  assert.deepEqual(wrong.map((w) => w.id), []);
});

// 14. Die 141 ursprünglichen Dateien bleiben bytegenau unverändert.
test('Audio-Audit 14: die 141 ursprünglichen Bestandsaufnahmen sind bytegenau unverändert (Prüfsummen-Vergleich)', () => {
  const reference = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'legacyAudioChecksums.json'), 'utf-8'));
  assert.equal(Object.keys(reference).length, 141);
  const changed = [];
  for (const [id, info] of Object.entries(reference)) {
    const buf = fs.readFileSync(normalAudioPath(id));
    if (buf.length !== info.size || sha256(buf) !== info.sha256) changed.push(id);
  }
  assert.deepEqual(changed, [], `Veränderte Bestandsaufnahmen: ${changed.join(', ')}`);
});

// 15. Normale Wiedergabe verwendet für alle 900 Wörter eine Datei und nicht TTS (technisch: Datei muss existieren).
test('Audio-Audit 15: für alle 900 Wörter existiert eine ladbare normale Datei -- kein TTS-Fallback nötig', () => {
  const { loadAudioBase64Safe } = require('../../scripts/audioFileAccess.js');
  const failures = [];
  for (const w of words) {
    const base64 = loadAudioBase64Safe(path.join(PACK, 'audio'), w.audio_key);
    if (!base64) failures.push(w.id);
  }
  assert.deepEqual(failures, []);
});

// 16. Langsame Wiedergabe nutzt bei 141 Wörtern _slow.wav.
test('Audio-Audit 16: exakt die 141 Batch-0-Bestandswörter (und keine anderen) haben eine eigene _slow.wav', () => {
  const batch0 = JSON.parse(fs.readFileSync(path.join(LANGUAGE_REVIEW_DIR, 'batch_00.json'), 'utf-8'));
  const batch0Ids = new Set(batch0.entries.map((e) => e.id));
  const withSlow = new Set(words.filter((w) => fileExists(slowAudioPath(w.id))).map((w) => w.id));
  const missingFromBatch0 = [...batch0Ids].filter((id) => !withSlow.has(id));
  const unexpected = [...withSlow].filter((id) => !batch0Ids.has(id));
  assert.deepEqual(missingFromBatch0, []);
  assert.deepEqual(unexpected, []);
});

// 17. Langsame Wiedergabe nutzt bei 759 Wörtern die normale Datei mit 0,75-facher Geschwindigkeit
// (technisch geprüft: audioPlayer.js-Verhalten ist bereits in audioPlayer.test.js abgedeckt --
// hier wird nur die Datenvoraussetzung geprüft: normale Datei vorhanden, keine eigene Slow-Datei).
test('Audio-Audit 17: alle 759 neuen Wörter haben eine normale Datei, aber keine eigene _slow.wav (Fallback-Voraussetzung erfüllt)', () => {
  const batch0 = JSON.parse(fs.readFileSync(path.join(LANGUAGE_REVIEW_DIR, 'batch_00.json'), 'utf-8'));
  const batch0Ids = new Set(batch0.entries.map((e) => e.id));
  const newWords = words.filter((w) => !batch0Ids.has(w.id));
  assert.equal(newWords.length, 759);
  const bad = newWords.filter((w) => !fileExists(normalAudioPath(w.id)) || fileExists(slowAudioPath(w.id)));
  assert.deepEqual(bad.map((w) => w.id), []);
});

// 18. Navigation stoppt laufende Wiedergabe -- statischer Code-Check: app.js#runCleanup ruft
// AudioPlayer.stopCurrentAudio() zentral auf (Verhalten selbst ist in audioPlayer.test.js und
// reviewModeUi.test.js dynamisch getestet).
test('Audio-Audit 18: app.js#runCleanup ruft zentral AudioPlayer.stopCurrentAudio() auf (jede Navigation stoppt laufendes Audio)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'app.js'), 'utf-8');
  const runCleanupMatch = src.match(/function runCleanup\(\)\s*{[\s\S]*?\n {2}}/);
  assert.ok(runCleanupMatch, 'runCleanup() nicht gefunden');
  assert.ok(runCleanupMatch[0].includes('AudioPlayer.stopCurrentAudio()'), 'runCleanup() muss AudioPlayer.stopCurrentAudio() aufrufen');
});

// 19. Einstellungen zur automatischen und langsamen Wiedergabe werden respektiert -- statischer
// Check, dass die relevanten Views settings.autoPlayWord/settings.slowPlayback tatsächlich lesen
// (dynamisches Verhalten bereits in listening.js/sessionController.js-Tests abgedeckt).
test('Audio-Audit 19: settings.autoPlayWord und settings.slowPlayback werden in der Session-Steuerung ausgewertet', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'session', 'sessionController.js'), 'utf-8');
  assert.ok(src.includes('settings.autoPlayWord'));
  assert.ok(src.includes('settings.slowPlayback'));
});

// 20. Der Sprachprüfmodus kann alle 900 Aufnahmen abspielen (dieselbe Zuordnung wie die Lernoberfläche).
test('Audio-Audit 20: der Sprachprüfmodus kann für alle 900 Wörter eine Audiodatei laden (dieselbe Zuordnung wie die Lernoberfläche)', () => {
  const { loadAudioBase64Safe } = require('../../scripts/audioFileAccess.js');
  const failures = [];
  for (const w of words) {
    // reviewMain.js verwendet denselben AUDIO_DIR-Aufbau (.../audio, audioKey inkl. Unterordner).
    const base64 = loadAudioBase64Safe(path.join(PACK, 'audio'), w.audio_key, { logPrefix: '[Audit]' });
    if (!base64) failures.push(w.id);
  }
  assert.deepEqual(failures, []);
});

// Zusatz: mindestens eine Session aus jeder der 30 Units gegen die echte Audiozuordnung.
test('Audio-Audit (Zusatz): eine Session aus jeder der 30 Units hat für alle 10 Wörter eine ladbare Audiodatei', () => {
  const { loadAudioBase64Safe } = require('../../scripts/audioFileAccess.js');
  const wordsById = new Map(words.map((w) => [w.id, w]));
  const byUnit = new Map();
  for (const s of vocabSessions.sessions) {
    if (!byUnit.has(s.unit_id)) byUnit.set(s.unit_id, s);
  }
  assert.equal(byUnit.size, 30, 'sollte genau 30 Units mit mindestens einer Session abdecken');
  const failures = [];
  for (const session of byUnit.values()) {
    for (const wordId of session.new_word_ids) {
      const word = wordsById.get(wordId);
      if (!word) { failures.push(`${session.session_id}: unbekanntes Wort ${wordId}`); continue; }
      const base64 = loadAudioBase64Safe(path.join(PACK, 'audio'), word.audio_key);
      if (!base64) failures.push(`${session.session_id}: ${wordId}`);
    }
  }
  assert.deepEqual(failures, []);
});
