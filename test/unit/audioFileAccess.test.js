// Entwicklungsauftrag 13, Abschnitt 9/18 — Sicherheitstests für den gehärteten, gemeinsam von
// main.js und reviewMain.js verwendeten Audiodatei-Zugriff (scripts/audioFileAccess.js).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { AUDIO_KEY_PATTERN, resolveAudioFilePath, loadAudioBase64Safe } = require('../../scripts/audioFileAccess.js');

function makeAudioDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-access-test-'));
  const audioDir = path.join(root, 'audio');
  fs.mkdirSync(path.join(audioDir, 'vocabulary'), { recursive: true });
  fs.writeFileSync(path.join(audioDir, 'vocabulary', 'w1.wav'), Buffer.from('RIFFxxxxWAVEfaketestcontent'));
  // Datei AUSSERHALB des Audioverzeichnisses -- darf nie erreichbar sein.
  fs.writeFileSync(path.join(root, 'secret.txt'), 'geheim');
  return { root, audioDir };
}

test('resolveAudioFilePath: gültiger Schlüssel wird korrekt aufgelöst', () => {
  const { audioDir } = makeAudioDir();
  const result = resolveAudioFilePath(audioDir, 'vocabulary/w1');
  assert.equal(result.ok, true);
  assert.equal(result.path, path.join(path.resolve(audioDir), 'vocabulary', 'w1.wav'));
});

test('resolveAudioFilePath: Pfad-Traversal ("..") wird abgelehnt', () => {
  const { audioDir } = makeAudioDir();
  const result = resolveAudioFilePath(audioDir, '../secret');
  assert.equal(result.ok, false);
});

test('resolveAudioFilePath: verschachtelte Traversal ("vocabulary/../../secret") wird abgelehnt', () => {
  const { audioDir } = makeAudioDir();
  const result = resolveAudioFilePath(audioDir, 'vocabulary/../../secret');
  assert.equal(result.ok, false);
});

test('resolveAudioFilePath: absoluter Pfad wird abgelehnt', () => {
  const { audioDir } = makeAudioDir();
  const result = resolveAudioFilePath(audioDir, '/etc/passwd');
  assert.equal(result.ok, false);
});

test('resolveAudioFilePath: Windows-Backslash-Traversal wird abgelehnt', () => {
  const { audioDir } = makeAudioDir();
  const result = resolveAudioFilePath(audioDir, 'vocabulary\\..\\..\\secret');
  assert.equal(result.ok, false);
});

test('resolveAudioFilePath: leerer/fehlender Schlüssel wird abgelehnt, ohne zu werfen', () => {
  const { audioDir } = makeAudioDir();
  assert.equal(resolveAudioFilePath(audioDir, '').ok, false);
  assert.equal(resolveAudioFilePath(audioDir, undefined).ok, false);
  assert.equal(resolveAudioFilePath(audioDir, null).ok, false);
  assert.equal(resolveAudioFilePath(audioDir, 42).ok, false);
});

test('resolveAudioFilePath: Schlüssel ohne Unterverzeichnis wird abgelehnt (erzwingt vocabulary/<id> bzw. letters/<id>)', () => {
  const { audioDir } = makeAudioDir();
  assert.equal(resolveAudioFilePath(audioDir, 'w1').ok, false);
});

test('resolveAudioFilePath: Sonderzeichen (Spaces, Semikolons, Nullbytes) werden abgelehnt', () => {
  const { audioDir } = makeAudioDir();
  for (const key of ['vocabulary/w1; rm -rf', 'vocabulary/w1 x', 'vocabulary/w1\0', 'vocabulary/<script>']) {
    assert.equal(resolveAudioFilePath(audioDir, key).ok, false, `sollte abgelehnt werden: ${JSON.stringify(key)}`);
  }
});

test('loadAudioBase64Safe: liefert Base64-Inhalt für einen gültigen, vorhandenen Schlüssel', () => {
  const { audioDir } = makeAudioDir();
  const base64 = loadAudioBase64Safe(audioDir, 'vocabulary/w1');
  assert.ok(base64);
  assert.equal(Buffer.from(base64, 'base64').toString('utf-8'), 'RIFFxxxxWAVEfaketestcontent');
});

test('loadAudioBase64Safe: liefert null (nicht wirft) für einen Traversal-Versuch', () => {
  const { audioDir } = makeAudioDir();
  assert.equal(loadAudioBase64Safe(audioDir, '../secret'), null);
});

test('loadAudioBase64Safe: liefert null für einen gültig geformten, aber nicht existierenden Schlüssel', () => {
  const { audioDir } = makeAudioDir();
  assert.equal(loadAudioBase64Safe(audioDir, 'vocabulary/does_not_exist'), null);
});

test('AUDIO_KEY_PATTERN: akzeptiert alle echten audio_key-Werte aus vocabulary.json', () => {
  const vocab = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'language-packs', 'arabic', 'vocabulary.json'), 'utf-8'));
  const words = vocab.categories.flatMap((c) => c.words);
  const invalid = words.filter((w) => w.audio_key && !AUDIO_KEY_PATTERN.test(w.audio_key));
  assert.deepEqual(invalid.map((w) => w.id), []);
});
