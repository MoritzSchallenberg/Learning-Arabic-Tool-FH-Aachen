// Integrationstest: migriert eine Kopie der TATSÄCHLICHEN Fortschrittsdatei des Nutzers
// (Sicherheitskopie unter /tmp, NIE die Live-Datei unter ~/.config) und prüft, dass dabei
// keine einzige Karte oder Lesson-Flag verloren geht. Übersprungen, wenn die Kopie lokal
// nicht vorhanden ist (z. B. in CI ohne dieses Nutzerprofil).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { migrateProgress, isLegacyProgressFormat } = require('../../src/js/progressStore.js');

const BACKUP_PATH = path.join(
  os.tmpdir(),
  'claude-1000',
  '-home-canvastino-Schreibtisch-Vokabeltrainer',
  '7e150b3f-7fcb-42a3-8090-8b42f5626be8',
  'scratchpad',
  'progress.json.safety-backup'
);

test('reale (gesicherte) Nutzer-Fortschrittsdaten migrieren ohne Datenverlust', { skip: !fs.existsSync(BACKUP_PATH) }, () => {
  const raw = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf-8'));
  assert.equal(isLegacyProgressFormat(raw), true, 'erwartetes Alt-Format zum Testen der Migration');

  const migrated = migrateProgress(raw);
  assert.equal(migrated._version, 1);

  for (const languageId of Object.keys(raw)) {
    assert.deepEqual(migrated.languages[languageId], raw[languageId], `Daten für "${languageId}" unverändert übernommen`);
  }

  const cardCountBefore = Object.keys(raw.arabic?.cards || {}).length;
  const cardCountAfter = Object.keys(migrated.languages.arabic?.cards || {}).length;
  assert.equal(cardCountAfter, cardCountBefore);
  assert.ok(cardCountAfter > 0, 'Sicherheitskopie sollte echte Kartendaten enthalten');
});
