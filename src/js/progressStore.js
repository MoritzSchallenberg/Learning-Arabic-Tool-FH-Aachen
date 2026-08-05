// Zuverlässige lokale JSON-Speicherung (P0.4 aus dem Entwicklungsauftrag
// "Veröffentlichungsfähigkeit"). Wird von main.js (Electron-Hauptprozess) benutzt und ist
// gleichzeitig ohne Electron in Node direkt testbar (reines CommonJS-Modul, kein Zugriff auf
// Electron-APIs).
//
// Drei Bausteine:
// 1) writeJsonFileAtomic(): schreibt in eine temporäre Datei und benennt sie erst danach auf
//    den Zielnamen um (atomar auf demselben Dateisystem) — ein Absturz mitten im Schreiben kann
//    dadurch nicht mehr eine halb geschriebene, kaputte Zieldatei hinterlassen. Zusätzlich wird
//    vor dem Überschreiben eine .bak-Kopie der zuletzt gültigen Version angelegt.
// 2) readJsonFileSafe(): fällt bei kaputtem JSON auf die .bak-Kopie zurück, erst danach auf den
//    übergebenen Fallback-Wert.
// 3) migrateProgress()/isLegacyProgressFormat(): progress.json bekommt ein Versionsfeld
//    (_version) und eine Hülle ({ _version, languages }), altes unversioniertes Format
//    (nacktes { [languageId]: {...} }) wird beim Laden einmalig automatisch migriert.
// 4) enqueueWrite(): zentrale Speicherwarteschlange pro Datei — mehrere schnell aufeinander
//    folgende Speicheraufrufe (viele Views rufen persistProgress() ohne await auf) werden pro
//    Datei strikt in Aufrufreihenfolge nacheinander geschrieben statt parallel/unkontrolliert.

const fs = require('fs');
const path = require('path');

const CURRENT_PROGRESS_VERSION = 1;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Liest eine JSON-Datei. Bei fehlender oder kaputter Datei wird zuerst die .bak-Sicherung
 * versucht, erst wenn auch die fehlt oder kaputt ist, wird `fallback` zurückgegeben.
 */
function readJsonFileSafe(filePath, fallback) {
  const backupPath = `${filePath}.bak`;

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (mainErr) {
    if (fs.existsSync(backupPath)) {
      try {
        return JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
      } catch (backupErr) {
        // Auch das Backup ist kaputt — auf den Fallback zurückfallen.
      }
    }
    return fallback;
  }
}

/**
 * Schreibt `data` atomar nach `filePath` (temp-Datei + rename) und legt vorher eine .bak-Kopie
 * der bisherigen Datei an (best effort — ein fehlgeschlagenes Backup verhindert nicht den Save).
 */
function writeJsonFileAtomic(filePath, data) {
  ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const backupPath = `${filePath}.bak`;
  const serialized = JSON.stringify(data, null, 2);

  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, backupPath);
    } catch (err) {
      // Backup ist best-effort.
    }
  }

  fs.writeFileSync(tmpPath, serialized, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

function isLegacyProgressFormat(raw) {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw) && !('_version' in raw);
}

/**
 * Bringt geladene progress.json-Daten in die aktuelle versionierte Form
 * { _version, languages: { [languageId]: { cards, lessonFlags } } }. Migriert transparent aus
 * dem alten, unversionierten Format (nacktes { [languageId]: {...} } ohne _version-Feld).
 * Unbekannte künftige Versionen werden nicht geraten, aber auch nicht verworfen.
 */
function migrateProgress(raw) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { _version: CURRENT_PROGRESS_VERSION, languages: {} };
  }
  if (isLegacyProgressFormat(raw)) {
    return { _version: CURRENT_PROGRESS_VERSION, languages: raw };
  }
  if (raw._version === CURRENT_PROGRESS_VERSION) {
    return raw.languages ? raw : { ...raw, languages: {} };
  }
  // Unbekannte Version (z. B. aus einer neueren App-Version) — Daten übernehmen statt zu
  // verwerfen, aber auf die aktuell bekannte Version "herunterstempeln", da diese Version des
  // Codes keine speziellen Migrationsschritte dafür kennt.
  return { _version: CURRENT_PROGRESS_VERSION, languages: raw.languages || {} };
}

// --- Zentrale Speicherwarteschlange (eine Warteschlange pro Dateipfad) ---------------------
const saveQueues = new Map();

function enqueueWrite(key, task) {
  const previous = saveQueues.get(key) || Promise.resolve();
  const next = previous.then(task, task);
  // Die intern gespeicherte Queue-Promise darf nie dauerhaft "rejected" bleiben, sonst würde
  // jeder zukünftige Save an derselben Datei sofort mitfehlschlagen.
  saveQueues.set(key, next.then(() => {}, () => {}));
  return next;
}

module.exports = {
  CURRENT_PROGRESS_VERSION,
  ensureDir,
  readJsonFileSafe,
  writeJsonFileAtomic,
  isLegacyProgressFormat,
  migrateProgress,
  enqueueWrite
};
