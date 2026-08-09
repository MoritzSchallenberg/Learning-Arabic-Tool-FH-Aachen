// Integrationstest für die Progress-Migration (Entwicklungsauftrag 7, Abschnitt 5) — läuft
// IMMER im normalen CI-Testlauf, nicht mehr übersprungen. Nutzt ausschließlich anonymisierte,
// synthetische Fixtures unter test/fixtures/ (keine echten Nutzerdaten) statt einer lokalen
// Sicherheitskopie einer echten progress.json, die es in CI ohnehin nie gibt.
//
// Die drei Fixtures progress_v1/v2/v3.json bilden die drei real im Code vorkommenden Zustände
// von migrateProgress() ab (siehe src/js/progressStore.js):
//   v1 = unversioniertes Alt-Format (vor Einführung von "_version")
//   v2 = aktuelles Format (_version === CURRENT_PROGRESS_VERSION)
//   v3 = simuliertes KÜNFTIGES Format (_version größer als aktuell bekannt) — testet, dass
//        migrateProgress() solche Daten übernimmt statt zu verwerfen oder abzustürzen.
// progress_corrupted.json testet die Backup-Fallback-Logik von readJsonFileSafe().

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { migrateProgress, isLegacyProgressFormat, readJsonFileSafe, writeJsonFileAtomic, CURRENT_PROGRESS_VERSION } = require('../../src/js/progressStore.js');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf-8'));
}

test('progress_v1.json (unversioniertes Alt-Format) wird erkannt und ohne Datenverlust migriert', () => {
  const raw = loadFixture('progress_v1.json');
  assert.equal(isLegacyProgressFormat(raw), true, 'sollte als Alt-Format erkannt werden');

  const migrated = migrateProgress(raw);
  assert.equal(migrated._version, CURRENT_PROGRESS_VERSION);

  for (const languageId of Object.keys(raw)) {
    assert.deepEqual(migrated.languages[languageId], raw[languageId], `Daten für "${languageId}" unverändert übernommen`);
  }
  const cardCountBefore = Object.keys(raw.arabic.cards).length;
  const cardCountAfter = Object.keys(migrated.languages.arabic.cards).length;
  assert.equal(cardCountAfter, cardCountBefore, 'keine Karte darf bei der Migration verloren gehen');
  assert.ok(cardCountAfter > 0, 'Fixture sollte echte Kartendaten enthalten');
  // Stichprobe: Schwierigkeitswerte und Wiederholungsdaten bleiben exakt erhalten.
  assert.deepEqual(migrated.languages.arabic.cards.greet_hallo, raw.arabic.cards.greet_hallo);
  assert.deepEqual(migrated.languages.arabic.lessonFlags, raw.arabic.lessonFlags);
});

test('progress_v2.json (bereits aktuelles Format) bleibt beim Migrieren unverändert', () => {
  const raw = loadFixture('progress_v2.json');
  assert.equal(isLegacyProgressFormat(raw), false);
  assert.equal(raw._version, CURRENT_PROGRESS_VERSION);

  const migrated = migrateProgress(raw);
  assert.equal(migrated._version, CURRENT_PROGRESS_VERSION);
  assert.deepEqual(migrated.languages, raw.languages, 'bereits aktuelle Daten dürfen nicht verändert werden');
  assert.equal(Object.keys(migrated.languages.arabic.cards).length, Object.keys(raw.languages.arabic.cards).length);
});

test('progress_v3.json (simuliertes künftiges Format mit höherer _version) wird übernommen statt verworfen', () => {
  const raw = loadFixture('progress_v3.json');
  assert.ok(raw._version > CURRENT_PROGRESS_VERSION, 'Fixture muss eine künftige, noch unbekannte Version simulieren');

  const migrated = migrateProgress(raw);
  assert.equal(migrated._version, CURRENT_PROGRESS_VERSION, 'wird auf die aktuell bekannte Version heruntergestempelt');
  assert.deepEqual(migrated.languages, raw.languages, 'bekannte Felder (languages) müssen trotzdem erhalten bleiben');
  assert.equal(Object.keys(migrated.languages.arabic.cards).length, 1);
});

test('leeres/fehlendes Objekt ergibt eine gültige leere Hülle statt eines Absturzes', () => {
  assert.deepEqual(migrateProgress(null), { _version: CURRENT_PROGRESS_VERSION, languages: {} });
  assert.deepEqual(migrateProgress(undefined), { _version: CURRENT_PROGRESS_VERSION, languages: {} });
  assert.deepEqual(migrateProgress([]), { _version: CURRENT_PROGRESS_VERSION, languages: {} });
});

test('progress_corrupted.json: beschädigte Hauptdatei fällt sicher auf die .bak-Sicherung zurück', () => {
  // Eigenes temporäres Verzeichnis (nie ~/.config oder eine echte Nutzerdatei).
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-migration-test-'));
  const filePath = path.join(tmpDir, 'progress.json');
  try {
    const goodData = loadFixture('progress_v2.json');
    const corruptedRaw = fs.readFileSync(path.join(FIXTURES_DIR, 'progress_corrupted.json'), 'utf-8');

    // 1) Eine gültige Version schreiben (das legt automatisch KEIN .bak an, da die Datei noch
    //    nicht existiert) — dann ein zweites Mal schreiben, damit writeJsonFileAtomic() jetzt
    //    eine .bak-Kopie der ersten (gültigen) Version anlegt.
    writeJsonFileAtomic(filePath, goodData);
    writeJsonFileAtomic(filePath, goodData);
    assert.ok(fs.existsSync(`${filePath}.bak`), 'writeJsonFileAtomic sollte eine .bak-Kopie anlegen');

    // 2) Die Hauptdatei jetzt "von außen" beschädigen (z. B. Absturz mitten im Schreiben durch
    //    ein anderes Programm, Datenträgerfehler o. ä.) — die .bak-Kopie bleibt dabei intakt.
    fs.writeFileSync(filePath, corruptedRaw, 'utf-8');
    assert.throws(() => JSON.parse(fs.readFileSync(filePath, 'utf-8')), 'Fixture muss tatsächlich kaputtes JSON sein');

    // 3) readJsonFileSafe() darf NICHT werfen und muss auf die .bak-Kopie zurückfallen.
    const recovered = readJsonFileSafe(filePath, { fallback: true });
    assert.deepEqual(recovered, goodData, 'sollte die intakte .bak-Kopie liefern, keine Daten verlieren');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('readJsonFileSafe(): weder Haupt- noch Backup-Datei vorhanden liefert den Fallback-Wert statt zu werfen', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-migration-test-'));
  const filePath = path.join(tmpDir, 'does-not-exist.json');
  try {
    const result = readJsonFileSafe(filePath, { fallback: true });
    assert.deepEqual(result, { fallback: true });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
