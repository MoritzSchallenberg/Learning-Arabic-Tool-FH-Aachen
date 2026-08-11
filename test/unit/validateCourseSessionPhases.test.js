// Entwicklungsauftrag 16, Abschnitt 18/20 — stellt sicher, dass scripts/validateCourse.js einen
// Rückfall in das alte Acht-Phasen-Modell (oder falsche Bewertungsgewichte) tatsächlich als
// harten Fehler zurückweist. Läuft gegen eine ISOLIERTE Kopie (COURSE_VALIDATE_ROOT), rührt die
// echte vocabSessions.json nie an -- exakt dasselbe Muster wie
// test/unit/applicationPromptGrading.test.js.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

function setupIsolatedPack() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'course-validate-phases-test-'));
  const tmpPack = path.join(tmpRoot, 'language-packs', 'arabic');
  fs.mkdirSync(tmpPack, { recursive: true });
  fs.mkdirSync(path.join(tmpRoot, 'language-review'), { recursive: true });
  for (const name of ['vocabulary.json', 'vocabSessions.json', 'theory.json', 'keyboard.json', 'courses.json', 'lessons.json']) {
    fs.copyFileSync(path.join(ROOT, 'language-packs', 'arabic', name), path.join(tmpPack, name));
  }
  for (const name of fs.readdirSync(path.join(ROOT, 'language-review')).filter((f) => f.endsWith('.json'))) {
    fs.copyFileSync(path.join(ROOT, 'language-review', name), path.join(tmpRoot, 'language-review', name));
  }
  fs.copyFileSync(path.join(ROOT, 'audio_generation_manifest.json'), path.join(tmpRoot, 'audio_generation_manifest.json'));
  fs.symlinkSync(path.join(ROOT, 'language-packs', 'arabic', 'audio'), path.join(tmpPack, 'audio'));
  return { tmpRoot, tmpPack };
}

function runValidator(tmpRoot) {
  return execFileSync('node', [path.join(ROOT, 'scripts', 'validateCourse.js')], {
    cwd: ROOT, stdio: 'pipe', env: { ...process.env, COURSE_VALIDATE_ROOT: tmpRoot }
  });
}

test('validateCourse.js weist eine Session mit dem alten Acht-Phasen-Modell (sichtbare "reconstruction"-Phase) als harten Fehler zurück', () => {
  const { tmpRoot, tmpPack } = setupIsolatedPack();
  try {
    const vs = JSON.parse(fs.readFileSync(path.join(tmpPack, 'vocabSessions.json'), 'utf-8'));
    vs.sessions[0].phases = [
      { type: 'theory', required_first_time: true },
      { type: 'word_preview' },
      { type: 'recognition' },
      { type: 'reconstruction' },
      { type: 'guided_production' },
      { type: 'independent_production' },
      { type: 'application' },
      { type: 'summary' }
    ];
    fs.writeFileSync(path.join(tmpPack, 'vocabSessions.json'), JSON.stringify(vs, null, 2), 'utf-8');

    assert.throws(() => {
      runValidator(tmpRoot);
    }, (err) => {
      const output = `${err.stdout || ''}${err.stderr || ''}`;
      return output.includes('reconstruction') && output.includes(vs.sessions[0].session_id);
    }, 'validateCourse.js sollte die alte sichtbare "reconstruction"-Phase als Fehler melden');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('validateCourse.js weist veraltete completion_rules.required_phases zurück', () => {
  const { tmpRoot, tmpPack } = setupIsolatedPack();
  try {
    const vs = JSON.parse(fs.readFileSync(path.join(tmpPack, 'vocabSessions.json'), 'utf-8'));
    vs.sessions[0].completion_rules.required_phases = ['theory', 'word_preview', 'recognition', 'independent_production'];
    fs.writeFileSync(path.join(tmpPack, 'vocabSessions.json'), JSON.stringify(vs, null, 2), 'utf-8');

    assert.throws(() => {
      runValidator(tmpRoot);
    }, (err) => {
      const output = `${err.stdout || ''}${err.stderr || ''}`;
      return output.includes('completion_rules.required_phases');
    });
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('eine unveränderte isolierte Kopie validiert weiterhin fehlerfrei (Kontrolle)', () => {
  const { tmpRoot } = setupIsolatedPack();
  try {
    assert.doesNotThrow(() => runValidator(tmpRoot));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
