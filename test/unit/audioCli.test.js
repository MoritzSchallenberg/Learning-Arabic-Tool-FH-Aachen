// Entwicklungsauftrag 12, Abschnitt 18 — End-to-End-Tests der Kommandozeilenwerkzeuge
// (scripts/audioCli.js, scripts/upgrade-audio-manifest-model.js) über einen echten
// Kindprozess, aber IMMER gegen eine isolierte temporäre Kopie (AUDIO_PIPELINE_ROOT) --
// nie gegen die echten Projektdateien, nie mit einem echten API-Aufruf.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');

function makeFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-cli-test-'));
  const packDir = path.join(root, 'language-packs', 'arabic');
  fs.mkdirSync(path.join(packDir, 'audio', 'vocabulary'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });

  const vocabulary = {
    categories: [{
      id: 'cat1',
      words: [
        { id: 'w1', arabic_vocalized: 'أَهْلاً', arabic_unvocalized: 'اهلا', german_answers: ['Hallo'], unit_id: 'vocab_unit_01', session_id: 'vocab_unit_01_a', content_status: 'needs_language_review' },
        { id: 'w2', arabic_vocalized: 'شُكْراً', arabic_unvocalized: 'شكرا', german_answers: ['Danke'], unit_id: 'vocab_unit_06', session_id: 'vocab_unit_06_a', content_status: 'needs_language_review' }
      ]
    }]
  };
  fs.writeFileSync(path.join(packDir, 'vocabulary.json'), JSON.stringify(vocabulary, null, 2));

  const manifest = {
    note: 'Testmanifest',
    entries: [
      { id: 'w1', arabic_vocalized: 'أَهْلاً', arabic_unvocalized: 'اهلا', german: 'Hallo', output_file: 'w1.wav', status: 'needs_language_review' },
      { id: 'w2', arabic_vocalized: 'شُكْراً', arabic_unvocalized: 'شكرا', german: 'Danke', output_file: 'w2.wav', status: 'needs_language_review' }
    ]
  };
  fs.writeFileSync(path.join(root, 'audio_generation_manifest.json'), JSON.stringify(manifest, null, 2));

  return root;
}

function runCli(args, root, extraEnv = {}) {
  const env = { ...process.env, AUDIO_PIPELINE_ROOT: root, ELEVENLABS_API_KEY: '', ...extraEnv };
  try {
    const out = execFileSync('node', [path.join(ROOT, 'scripts', 'audioCli.js'), ...args], { cwd: ROOT, env, stdio: 'pipe' });
    return { code: 0, out: out.toString('utf-8') };
  } catch (err) {
    return { code: err.status, out: `${err.stdout || ''}${err.stderr || ''}` };
  }
}

test('audioCli plan --all: meldet genau die 2 offenen Test-IDs und die korrekte Zeichenzahl', () => {
  const root = makeFixtureRoot();
  try {
    const result = runCli(['plan', '--all'], root);
    assert.equal(result.code, 0);
    assert.match(result.out, /Dateien geplant:\s+2/);
    const expectedChars = 'أَهْلاً'.length + 'شُكْراً'.length;
    assert.match(result.out, new RegExp(`Zeichen gesamt:\\s+${expectedChars}`));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('audioCli generate --all ohne ELEVENLABS_API_KEY: bricht sauber ab, schreibt NICHTS, ändert das Manifest nicht', () => {
  const root = makeFixtureRoot();
  try {
    const before = fs.readFileSync(path.join(root, 'audio_generation_manifest.json'), 'utf-8');
    const result = runCli(['generate', '--all'], root);
    assert.notEqual(result.code, 0);
    assert.match(result.out, /ELEVENLABS_API_KEY ist in dieser Umgebung nicht gesetzt/);
    assert.match(result.out, /NICHTS erzeugt und NICHTS am Manifest geändert/);
    const after = fs.readFileSync(path.join(root, 'audio_generation_manifest.json'), 'utf-8');
    assert.equal(before, after, 'ein fehlgeschlagener Provider-Check darf das Manifest nicht anfassen (Fail-Fast VOR dem ersten Wort)');
    assert.equal(fs.existsSync(path.join(root, 'language-packs', 'arabic', 'audio', 'vocabulary', 'w1.wav')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('audioCli generate --dry-run: läuft unabhängig vom API-Schlüssel durch, schreibt trotzdem nichts', () => {
  const root = makeFixtureRoot();
  try {
    const result = runCli(['generate', '--all', '--dry-run'], root);
    assert.equal(result.code, 0);
    assert.match(result.out, /dry-run \(nichts geschrieben\): 2/);
    assert.equal(fs.existsSync(path.join(root, 'language-packs', 'arabic', 'audio', 'vocabulary', 'w1.wav')), false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('audioCli verify: meldet 0 Probleme bei einem frischen, noch nicht erzeugten Manifest', () => {
  const root = makeFixtureRoot();
  try {
    const result = runCli(['verify'], root);
    assert.equal(result.code, 0);
    assert.match(result.out, /in Ordnung: 0/);
    assert.match(result.out, /Probleme:\s+0/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('scripts/upgrade-audio-manifest-model.js: migriert ein frisches Test-Manifest und ist idempotent', () => {
  const root = makeFixtureRoot();
  try {
    const run = () => execFileSync('node', [path.join(ROOT, 'scripts', 'upgrade-audio-manifest-model.js')], {
      cwd: ROOT, env: { ...process.env, AUDIO_PIPELINE_ROOT: root }, stdio: 'pipe'
    }).toString('utf-8');

    const first = run();
    assert.match(first, /migriert: 2 Einträge/);
    const afterFirst = fs.readFileSync(path.join(root, 'audio_generation_manifest.json'), 'utf-8');

    const second = run();
    assert.match(second, /bereits das erweiterte Statusmodell/);
    const afterSecond = fs.readFileSync(path.join(root, 'audio_generation_manifest.json'), 'utf-8');
    assert.equal(afterFirst, afterSecond, 'ein zweiter Lauf darf die Datei nicht mehr verändern');

    const migrated = JSON.parse(afterSecond);
    assert.ok(migrated.entries.every((e) => e.status === 'needs_language_review'));
    assert.ok(migrated.entries.every((e) => e.generation_status === 'pending'));
    assert.ok(migrated.entries.every((e) => e.unit_id));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
