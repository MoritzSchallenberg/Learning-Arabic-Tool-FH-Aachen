// Tests für src/js/progressStore.js (P0.4 — atomare, versionierte, wiederherstellbare
// Fortschrittsspeicherung). Arbeitet in einem temporären Verzeichnis, fasst NIE die echten
// Nutzerdaten unter ~/.config an.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  readJsonFileSafe,
  writeJsonFileAtomic,
  isLegacyProgressFormat,
  migrateProgress,
  enqueueWrite,
  CURRENT_PROGRESS_VERSION
} = require('../../src/js/progressStore.js');

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'progressstore-test-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('writeJsonFileAtomic + readJsonFileSafe: einfacher Roundtrip', () => {
  withTempDir((dir) => {
    const filePath = path.join(dir, 'progress.json');
    writeJsonFileAtomic(filePath, { hello: 'welt', n: 42 });
    const result = readJsonFileSafe(filePath, null);
    assert.deepEqual(result, { hello: 'welt', n: 42 });
  });
});

test('writeJsonFileAtomic hinterlässt keine temporären Dateien', () => {
  withTempDir((dir) => {
    const filePath = path.join(dir, 'progress.json');
    writeJsonFileAtomic(filePath, { a: 1 });
    const leftovers = fs.readdirSync(dir).filter((f) => f.includes('.tmp-'));
    assert.deepEqual(leftovers, []);
  });
});

test('writeJsonFileAtomic legt vor dem Überschreiben ein .bak der alten Version an', () => {
  withTempDir((dir) => {
    const filePath = path.join(dir, 'progress.json');
    writeJsonFileAtomic(filePath, { version: 1 });
    writeJsonFileAtomic(filePath, { version: 2 });
    const backup = JSON.parse(fs.readFileSync(`${filePath}.bak`, 'utf-8'));
    const current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.deepEqual(backup, { version: 1 });
    assert.deepEqual(current, { version: 2 });
  });
});

test('readJsonFileSafe fällt bei kaputter Hauptdatei auf das .bak zurück', () => {
  withTempDir((dir) => {
    const filePath = path.join(dir, 'progress.json');
    writeJsonFileAtomic(filePath, { good: true });
    writeJsonFileAtomic(filePath, { good: 'still fine' });
    // Hauptdatei jetzt absichtlich kaputt machen (simuliert abgebrochenes Schreiben).
    fs.writeFileSync(filePath, '{ kaputtes json', 'utf-8');
    const result = readJsonFileSafe(filePath, 'FALLBACK');
    assert.deepEqual(result, { good: true }); // die VORLETZTE gültige Version aus dem .bak
  });
});

test('readJsonFileSafe gibt den Fallback zurück, wenn weder Datei noch Backup lesbar sind', () => {
  withTempDir((dir) => {
    const filePath = path.join(dir, 'missing.json');
    const result = readJsonFileSafe(filePath, 'FALLBACK');
    assert.equal(result, 'FALLBACK');
  });
});

test('readJsonFileSafe gibt den Fallback zurück, wenn Haupt- UND Backup-Datei kaputt sind', () => {
  withTempDir((dir) => {
    const filePath = path.join(dir, 'progress.json');
    fs.writeFileSync(filePath, '{ kaputt', 'utf-8');
    fs.writeFileSync(`${filePath}.bak`, '{ auch kaputt', 'utf-8');
    const result = readJsonFileSafe(filePath, 'FALLBACK');
    assert.equal(result, 'FALLBACK');
  });
});

// --- Migration -----------------------------------------------------------------------------
test('isLegacyProgressFormat erkennt das alte, unversionierte Format', () => {
  assert.equal(isLegacyProgressFormat({ arabic: { cards: {} } }), true);
  assert.equal(isLegacyProgressFormat({ _version: 1, languages: {} }), false);
  assert.equal(isLegacyProgressFormat(null), false);
  assert.equal(isLegacyProgressFormat([]), false);
});

test('migrateProgress wandelt das alte Format verlustfrei in die versionierte Hülle um', () => {
  const legacy = { arabic: { cards: { letter_alif: { difficulty: { spelling: 3 } } }, lessonFlags: { onboarding: { status: 'completed' } } } };
  const migrated = migrateProgress(legacy);
  assert.equal(migrated._version, CURRENT_PROGRESS_VERSION);
  assert.deepEqual(migrated.languages, legacy.arabic ? { arabic: legacy.arabic } : {});
  assert.deepEqual(migrated.languages.arabic.cards.letter_alif.difficulty.spelling, 3);
});

test('migrateProgress lässt bereits aktuelle Daten unverändert', () => {
  const current = { _version: CURRENT_PROGRESS_VERSION, languages: { arabic: { cards: {} } } };
  const migrated = migrateProgress(current);
  assert.deepEqual(migrated, current);
});

test('migrateProgress behandelt leere/kaputte Eingaben sicher (kein Crash)', () => {
  assert.deepEqual(migrateProgress(null), { _version: CURRENT_PROGRESS_VERSION, languages: {} });
  assert.deepEqual(migrateProgress(undefined), { _version: CURRENT_PROGRESS_VERSION, languages: {} });
  assert.deepEqual(migrateProgress({}), { _version: CURRENT_PROGRESS_VERSION, languages: {} });
});

test('migrateProgress verwirft keine Daten aus einer unbekannten künftigen Version, wenn languages vorhanden ist', () => {
  const futureFormat = { _version: 999, languages: { arabic: { cards: { x: 1 } } } };
  const migrated = migrateProgress(futureFormat);
  assert.equal(migrated._version, CURRENT_PROGRESS_VERSION);
  assert.deepEqual(migrated.languages, futureFormat.languages);
});

// --- Speicherwarteschlange -------------------------------------------------------------------
test('enqueueWrite serialisiert mehrere schnelle Schreibvorgänge auf denselben Schlüssel in Aufrufreihenfolge', async () => {
  const order = [];
  const key = 'test-key-1';
  const delays = [30, 10, 0]; // absichtlich unterschiedliche Dauer, damit ohne Queue die Reihenfolge kippen würde
  const tasks = delays.map((ms, i) => enqueueWrite(key, () => new Promise((resolve) => {
    setTimeout(() => { order.push(i); resolve(); }, ms);
  })));
  await Promise.all(tasks);
  assert.deepEqual(order, [0, 1, 2]);
});

test('enqueueWrite läuft nach einem fehlgeschlagenen Task für denselben Schlüssel weiter', async () => {
  const key = 'test-key-2';
  let secondRan = false;
  await assert.rejects(enqueueWrite(key, () => { throw new Error('erster Task schlägt fehl'); }));
  await enqueueWrite(key, () => { secondRan = true; });
  assert.equal(secondRan, true);
});

test('enqueueWrite hält unterschiedliche Schlüssel unabhängig voneinander', async () => {
  const orderA = [];
  const orderB = [];
  await Promise.all([
    enqueueWrite('key-a', () => new Promise((r) => setTimeout(() => { orderA.push(1); r(); }, 20))),
    enqueueWrite('key-b', () => new Promise((r) => setTimeout(() => { orderB.push(1); r(); }, 5)))
  ]);
  assert.deepEqual(orderA, [1]);
  assert.deepEqual(orderB, [1]);
});

// --- Realistischer End-zu-Ende-Test: mehrere schnelle Speicheraufrufe auf echte Dateien -----
test('mehrere schnelle persistProgress-artige Aufrufe verlieren keine Änderung (End-zu-Ende)', async () => {
  await withTempDirAsync(async (dir) => {
    const filePath = path.join(dir, 'progress.json');
    const writes = [1, 2, 3, 4, 5].map((n) => enqueueWrite(filePath, () => {
      writeJsonFileAtomic(filePath, { counter: n });
      return true;
    }));
    await Promise.all(writes);
    const final = readJsonFileSafe(filePath, null);
    // Die LETZTE aufgerufene Änderung muss gewinnen, nicht eine zufällige mittlere.
    assert.deepEqual(final, { counter: 5 });
  });
});

async function withTempDirAsync(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'progressstore-test-'));
  try {
    await fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
