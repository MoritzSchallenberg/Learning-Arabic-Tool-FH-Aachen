// Entwicklungsauftrag 16, Abschnitt 18/22 — Tests für scripts/upgrade-session-phases-v16.js:
// aktualisiert alle Sessions auf das neue Phasenmodell, ist idempotent (zweiter Lauf ohne
// Änderung liefert eine byte-identische Datei), rührt ausschließlich vocabSessions.json an.
// Läuft GEGEN EINE ISOLIERTE TEMPORÄRE KOPIE (COURSE_UPGRADE_ROOT), nie gegen die echten
// Projektdateien -- vermeidet sowohl eine versehentliche echte Änderung während der Testsuite
// als auch eine Race Condition mit anderen, nebenläufig laufenden Testdateien (siehe
// scripts/writeJsonAtomic.js).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'upgrade-session-phases-v16.js');

function setupTempPack(sessionsOverride) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-phases-v16-test-'));
  const packDir = path.join(dir, 'language-packs', 'arabic');
  fs.mkdirSync(packDir, { recursive: true });
  const data = {
    vocab_units: [{ id: 'vocab_unit_01', title: 'Test', session_ids: ['vocab_unit_01_a'] }],
    sessions: sessionsOverride
  };
  fs.writeFileSync(path.join(packDir, 'vocabSessions.json'), JSON.stringify(data, null, 2), 'utf-8');
  return { dir, packDir, filePath: path.join(packDir, 'vocabSessions.json') };
}

function runScript(dir) {
  execFileSync('node', [SCRIPT], { cwd: ROOT, env: { ...process.env, COURSE_UPGRADE_ROOT: dir } });
}

function oldStyleSession() {
  return [{
    session_id: 'vocab_unit_01_a',
    unit_id: 'vocab_unit_01',
    title: 'Test',
    theory_id: 'theory_vocab_unit_01_a',
    new_word_ids: ['w1'],
    review_count: 5,
    phases: [
      { type: 'theory', required_first_time: true },
      { type: 'word_preview' },
      { type: 'recognition' },
      { type: 'reconstruction' },
      { type: 'guided_production' },
      { type: 'independent_production' },
      { type: 'application' },
      { type: 'summary' }
    ],
    completion_rules: {
      minimum_score: 0.75,
      all_words_exposed: true,
      required_phases: ['theory', 'word_preview', 'recognition', 'independent_production']
    }
  }];
}

test('ersetzt die alten acht Phasentypen durch die neuen sieben (Abschnitt 4/5)', () => {
  const { dir, filePath } = setupTempPack(oldStyleSession());
  try {
    runScript(dir);
    const updated = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.deepEqual(updated.sessions[0].phases.map((p) => p.type), [
      'theory', 'word_preview', 'recognition', 'matching', 'guided_writing', 'independent_writing', 'summary'
    ]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('keine alte sichtbare "reconstruction"- oder "application"-Phase bleibt übrig', () => {
  const { dir, filePath } = setupTempPack(oldStyleSession());
  try {
    runScript(dir);
    const updated = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const types = updated.sessions[0].phases.map((p) => p.type);
    assert.ok(!types.includes('reconstruction'));
    assert.ok(!types.includes('guided_production'));
    assert.ok(!types.includes('independent_production'));
    assert.ok(!types.includes('application'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('completion_rules.required_phases wird auf das neue Modell aktualisiert', () => {
  const { dir, filePath } = setupTempPack(oldStyleSession());
  try {
    runScript(dir);
    const updated = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.deepEqual(updated.sessions[0].completion_rules.required_phases, [
      'theory', 'word_preview', 'recognition', 'matching', 'guided_writing', 'independent_writing'
    ]);
    assert.equal(updated.sessions[0].completion_rules.minimum_score, 0.75, 'ein vorhandener minimum_score-Wert bleibt erhalten');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('ist idempotent: ein zweiter Lauf ohne zwischenzeitliche Änderung liefert eine byte-identische Datei', () => {
  const { dir, filePath } = setupTempPack(oldStyleSession());
  try {
    runScript(dir);
    const afterFirst = fs.readFileSync(filePath, 'utf-8');
    runScript(dir);
    const afterSecond = fs.readFileSync(filePath, 'utf-8');
    assert.equal(afterFirst, afterSecond, 'ein erneuter Lauf ohne Änderungen darf die Datei nicht erneut verändern');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('bereits im neuen Modell befindliche Sessions werden unverändert gelassen (idempotent gegenüber echtem Ausgangsstand)', () => {
  const alreadyNew = [{
    session_id: 'vocab_unit_01_a',
    unit_id: 'vocab_unit_01',
    title: 'Test',
    theory_id: 'theory_vocab_unit_01_a',
    new_word_ids: ['w1'],
    review_count: 5,
    phases: [
      { type: 'theory', required_first_time: true },
      { type: 'word_preview' },
      { type: 'recognition' },
      { type: 'matching' },
      { type: 'guided_writing' },
      { type: 'independent_writing' },
      { type: 'summary' }
    ],
    completion_rules: {
      minimum_score: 0.8,
      all_words_exposed: true,
      required_phases: ['theory', 'word_preview', 'recognition', 'matching', 'guided_writing', 'independent_writing']
    }
  }];
  const { dir, filePath } = setupTempPack(alreadyNew);
  try {
    const before = fs.readFileSync(filePath, 'utf-8');
    runScript(dir);
    const after = fs.readFileSync(filePath, 'utf-8');
    assert.equal(before, after, 'ein bereits aktuelles Modell darf nicht unnötig neu geschrieben werden');
    const updated = JSON.parse(after);
    assert.equal(updated.sessions[0].completion_rules.minimum_score, 0.8, 'ein individuell abweichender minimum_score bleibt erhalten');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('rührt ausschließlich vocabSessions.json an -- keine anderen Dateien im Paket werden angelegt/verändert', () => {
  const { dir, packDir } = setupTempPack(oldStyleSession());
  try {
    runScript(dir);
    assert.deepEqual(fs.readdirSync(packDir).sort(), ['vocabSessions.json']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('gegen die ECHTEN Projektdaten (readonly betrachtet): alle 90 Sessions sind bereits auf dem neuen Modell', () => {
  const real = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabSessions.json'), 'utf-8'));
  assert.equal(real.sessions.length, 90);
  for (const s of real.sessions) {
    assert.deepEqual(s.phases.map((p) => p.type), [
      'theory', 'word_preview', 'recognition', 'matching', 'guided_writing', 'independent_writing', 'summary'
    ], `Session ${s.session_id}`);
  }
});
