// Entwicklungsauftrag 12, Abschnitt 7 — sicheres Speichern des Sprachprüf-Arbeitsbereichs.
//
// Wiederverwendet bewusst die bereits etablierten, getesteten Bausteine aus
// src/js/progressStore.js (P0.4 aus einem früheren Auftrag): writeJsonFileAtomic() (temp+rename,
// legt vorher eine .bak-Kopie an), readJsonFileSafe() (fällt bei kaputter Datei auf die
// .bak-Kopie zurück) und enqueueWrite() (eine Speicherwarteschlange je Datei -- macht parallele
// Schreibvorgänge auf dieselbe Datei sicher). Kein neues Muster nötig, das bereits vorhandene
// erfüllt exakt die Anforderungen aus Abschnitt 7 ("atomar", "Backups", "nach Absturz
// wiederherstellbar", "parallele Schreibvorgänge sicher").
//
// WICHTIG (Abschnitt 5, Regel 8 / Abschnitt 17): dieses Modul schreibt AUSSCHLIESSLICH in den
// eigenen Arbeitsbereich (language-review/workspace/) -- es rührt vocabulary.json, theory.json
// oder die batch_NN.json-Dateien nie an. Die einzige Ausnahme ist audio_generation_manifest.json
// (kein Kursinhalt, sondern die technische Audio-Pipeline-Buchführung aus Abschnitt 9) für die
// gezielte, eng begrenzte "regeneration_required"-Rückmeldung nach einer Vokalisierungs- oder
// Audio-Korrektur (Abschnitt 15).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const progressStore = require('../../src/js/progressStore.js');
const {
  WORD_ASPECT_KEYS, THEORY_ASPECT_KEYS, ASPECT_RESULTS, OVERALL_STATUSES
} = require('./reviewConstants.js');

function paths(root) {
  const workspaceDir = path.join(root, 'language-review', 'workspace');
  return {
    root,
    workspaceDir,
    wordStatePath: path.join(workspaceDir, 'word_review_state.json'),
    theoryStatePath: path.join(workspaceDir, 'theory_review_state.json'),
    historyPath: path.join(workspaceDir, 'change_history.json'),
    manifestPath: path.join(root, 'audio_generation_manifest.json')
  };
}

function loadState(filePath) {
  return progressStore.readJsonFileSafe(filePath, {});
}

function loadHistory(filePath) {
  return progressStore.readJsonFileSafe(filePath, []);
}

function saveState(filePath, data) {
  return progressStore.enqueueWrite(filePath, () => {
    progressStore.writeJsonFileAtomic(filePath, data);
    return true;
  });
}

function defaultWordEntry() {
  const aspects = {};
  for (const key of WORD_ASPECT_KEYS) aspects[key] = { result: 'not_yet_reviewed', note: '', updatedAt: null };
  return { version: 0, overallStatus: 'needs_language_review', aspects, corrections: {}, notes: '', createdAt: null, updatedAt: null };
}

function defaultTheoryEntry() {
  const aspects = {};
  for (const key of THEORY_ASPECT_KEYS) aspects[key] = { result: 'not_yet_reviewed', note: '', updatedAt: null };
  return { version: 0, overallStatus: 'needs_language_review', aspects, corrections: {}, notes: '', createdAt: null, updatedAt: null };
}

function appendHistory(p, entry) {
  return progressStore.enqueueWrite(p.historyPath, () => {
    const history = loadHistory(p.historyPath);
    history.push({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
    progressStore.writeJsonFileAtomic(p.historyPath, history);
    return true;
  });
}

/**
 * Abschnitt 4/7: "Der ursprüngliche Wert und der Korrekturvorschlag müssen gleichzeitig sichtbar
 * bleiben." -- die vorherige und die vorgeschlagene Fassung stehen deshalb beide dauerhaft in
 * corrections[field]. "Konflikte mit extern geänderten Dateien erkennen" -- optimistische
 * Sperre über `expectedVersion`: weicht die im Arbeitsbereich gespeicherte Version von der
 * erwarteten ab (z. B. weil ein zweites Fenster zwischenzeitlich gespeichert hat), wird NICHT
 * geschrieben, sondern ein Konflikt gemeldet.
 */
async function proposeWordCorrection(p, { wordId, field, originalValue, proposedValue, expectedVersion, reviewerInitials = '', reason = '' }) {
  return progressStore.enqueueWrite(p.wordStatePath, () => {
    const state = loadState(p.wordStatePath);
    const entry = state[wordId] ? { ...state[wordId] } : defaultWordEntry();
    if (typeof expectedVersion === 'number' && entry.version !== expectedVersion) {
      return { ok: false, conflict: true, currentVersion: entry.version, current: entry };
    }
    const previousValue = entry.corrections[field] ? entry.corrections[field].proposedValue : originalValue;
    entry.corrections = { ...entry.corrections, [field]: { originalValue, proposedValue, updatedAt: new Date().toISOString() } };
    entry.version += 1;
    entry.createdAt = entry.createdAt || new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    state[wordId] = entry;
    progressStore.writeJsonFileAtomic(p.wordStatePath, state);
    appendHistory(p, {
      entityType: 'word', entityId: wordId, field, previousValue, proposedValue, reviewerInitials, reason, action: 'correction_proposed'
    });
    return { ok: true, entry };
  });
}

/**
 * Abschnitt 5, Regel 1+2: Öffnen ändert nie einen Status, Bearbeiten führt nicht automatisch zu
 * "reviewed" -- diese Funktion setzt IMMER nur genau den einen angeklickten Aspekt, nie den
 * übergeordneten Status.
 */
async function setWordAspectResult(p, { wordId, aspectKey, result, note = '', reviewerInitials = '', expectedVersion }) {
  if (!WORD_ASPECT_KEYS.includes(aspectKey)) throw new Error(`Unbekannter Prüfaspekt "${aspectKey}"`);
  if (!ASPECT_RESULTS.includes(result)) throw new Error(`Unbekanntes Prüfergebnis "${result}"`);
  return progressStore.enqueueWrite(p.wordStatePath, () => {
    const state = loadState(p.wordStatePath);
    const entry = state[wordId] ? { ...state[wordId] } : defaultWordEntry();
    if (typeof expectedVersion === 'number' && entry.version !== expectedVersion) {
      return { ok: false, conflict: true, currentVersion: entry.version, current: entry };
    }
    const previousResult = entry.aspects[aspectKey] ? entry.aspects[aspectKey].result : 'not_yet_reviewed';
    entry.aspects = { ...entry.aspects, [aspectKey]: { result, note, updatedAt: new Date().toISOString() } };
    entry.version += 1;
    entry.createdAt = entry.createdAt || new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    state[wordId] = entry;
    progressStore.writeJsonFileAtomic(p.wordStatePath, state);
    appendHistory(p, {
      entityType: 'word', entityId: wordId, field: `aspect:${aspectKey}`, previousValue: previousResult, proposedValue: result, reviewerInitials, reason: note, action: 'aspect_result_set'
    });

    // Abschnitt 15: wird die Audioaussprache als "Korrektur vorgeschlagen" markiert, bedeutet das
    // faktisch "diese Aufnahme muss neu erzeugt werden" -- die Datei wird NICHT gelöscht, nur der
    // Erzeugungsstatus im Manifest markiert. Keine automatische Neugenerierung.
    if (aspectKey === 'audio_pronunciation' && (result === 'correction_proposed' || result === 'uncertain')) {
      markManifestRegenerationRequired(p, wordId, result === 'correction_proposed' ? 'rejected' : 'uncertain');
    } else if (aspectKey === 'audio_pronunciation' && result === 'correct') {
      markManifestAudioReview(p, wordId, 'approved');
    }
    return { ok: true, entry };
  });
}

/**
 * Abschnitt 15: "Wenn eine arabische Form oder Vokalisierung korrigiert wird: Audiodatei nicht
 * löschen; Erzeugungsstatus auf regeneration_required setzen [...]; keine automatische
 * Neugenerierung starten." -- reine Bestandsänderung im Manifest, rührt die WAV-Datei selbst nie
 * an. Best-effort: existiert (noch) kein Manifest-Eintrag für dieses Wort (z. B. Batch-0-
 * Bestandswort ohne Manifest-Zeile), passiert nichts -- kein Fehler, aber auch keine Wirkung.
 */
function markManifestRegenerationRequired(p, wordId, audioReviewStatus) {
  if (!fs.existsSync(p.manifestPath)) return;
  const manifest = progressStore.readJsonFileSafe(p.manifestPath, null);
  if (!manifest || !Array.isArray(manifest.entries)) return;
  const idx = manifest.entries.findIndex((e) => e.id === wordId);
  if (idx === -1) return;
  const entry = manifest.entries[idx];
  if (entry.generation_status === 'generated_unreviewed' || entry.generation_status === 'failed') {
    manifest.entries[idx] = { ...entry, generation_status: 'regeneration_required', audio_review_status: audioReviewStatus };
    progressStore.writeJsonFileAtomic(p.manifestPath, manifest);
  } else {
    manifest.entries[idx] = { ...entry, audio_review_status: audioReviewStatus };
    progressStore.writeJsonFileAtomic(p.manifestPath, manifest);
  }
}

function markManifestAudioReview(p, wordId, audioReviewStatus) {
  if (!fs.existsSync(p.manifestPath)) return;
  const manifest = progressStore.readJsonFileSafe(p.manifestPath, null);
  if (!manifest || !Array.isArray(manifest.entries)) return;
  const idx = manifest.entries.findIndex((e) => e.id === wordId);
  if (idx === -1) return;
  manifest.entries[idx] = { ...manifest.entries[idx], audio_review_status: audioReviewStatus };
  progressStore.writeJsonFileAtomic(p.manifestPath, manifest);
}

/**
 * Abschnitt 5, Regeln 3-6: "unsicher" kann nicht freigegeben werden, "reviewed" setzt alle
 * Aspekte voraus, "approved" verlangt eine gesonderte, ausdrückliche Bestätigung
 * (`explicitConfirmation: true`, von der Oberfläche erst NACH Anzeige der vollständigen
 * Änderungsübersicht gesetzt -- siehe src/review/js/wordReviewView.js).
 */
async function setWordOverallStatus(p, { wordId, status, explicitConfirmation = false, reviewerInitials = '', expectedVersion }) {
  if (!OVERALL_STATUSES.includes(status)) throw new Error(`Unbekannter Status "${status}"`);
  return progressStore.enqueueWrite(p.wordStatePath, () => {
    const state = loadState(p.wordStatePath);
    const entry = state[wordId] ? { ...state[wordId] } : defaultWordEntry();
    if (typeof expectedVersion === 'number' && entry.version !== expectedVersion) {
      return { ok: false, conflict: true, currentVersion: entry.version, current: entry };
    }

    if (status === 'reviewed' || status === 'approved') {
      const unresolved = WORD_ASPECT_KEYS.filter((k) => (entry.aspects[k] || { result: 'not_yet_reviewed' }).result === 'not_yet_reviewed');
      if (unresolved.length > 0) {
        return { ok: false, error: 'aspects_incomplete', unresolved };
      }
    }
    if (status === 'approved') {
      const notReady = WORD_ASPECT_KEYS.filter((k) => !['correct', 'not_applicable'].includes(entry.aspects[k].result));
      if (notReady.length > 0) {
        return { ok: false, error: 'not_ready_for_approval', notReady, reason: 'unsichere oder noch offene Korrekturvorschläge können nicht freigegeben werden' };
      }
      if (!explicitConfirmation) {
        return { ok: false, error: 'explicit_confirmation_required' };
      }
    }

    const previousStatus = entry.overallStatus;
    entry.overallStatus = status;
    entry.version += 1;
    entry.updatedAt = new Date().toISOString();
    state[wordId] = entry;
    progressStore.writeJsonFileAtomic(p.wordStatePath, state);
    appendHistory(p, { entityType: 'word', entityId: wordId, field: 'overallStatus', previousValue: previousStatus, proposedValue: status, reviewerInitials, action: 'status_changed' });
    return { ok: true, entry };
  });
}

// --- Theorie: identisches Muster wie oben, eigene Aspektliste (THEORY_ASPECT_KEYS) -----------

async function proposeTheoryCorrection(p, { theoryId, field, originalValue, proposedValue, expectedVersion, reviewerInitials = '', reason = '' }) {
  return progressStore.enqueueWrite(p.theoryStatePath, () => {
    const state = loadState(p.theoryStatePath);
    const entry = state[theoryId] ? { ...state[theoryId] } : defaultTheoryEntry();
    if (typeof expectedVersion === 'number' && entry.version !== expectedVersion) {
      return { ok: false, conflict: true, currentVersion: entry.version, current: entry };
    }
    const previousValue = entry.corrections[field] ? entry.corrections[field].proposedValue : originalValue;
    entry.corrections = { ...entry.corrections, [field]: { originalValue, proposedValue, updatedAt: new Date().toISOString() } };
    entry.version += 1;
    entry.createdAt = entry.createdAt || new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    state[theoryId] = entry;
    progressStore.writeJsonFileAtomic(p.theoryStatePath, state);
    appendHistory(p, { entityType: 'theory', entityId: theoryId, field, previousValue, proposedValue, reviewerInitials, reason, action: 'correction_proposed' });
    return { ok: true, entry };
  });
}

async function setTheoryAspectResult(p, { theoryId, aspectKey, result, note = '', reviewerInitials = '', expectedVersion }) {
  if (!THEORY_ASPECT_KEYS.includes(aspectKey)) throw new Error(`Unbekannter Theorie-Prüfaspekt "${aspectKey}"`);
  if (!ASPECT_RESULTS.includes(result)) throw new Error(`Unbekanntes Prüfergebnis "${result}"`);
  return progressStore.enqueueWrite(p.theoryStatePath, () => {
    const state = loadState(p.theoryStatePath);
    const entry = state[theoryId] ? { ...state[theoryId] } : defaultTheoryEntry();
    if (typeof expectedVersion === 'number' && entry.version !== expectedVersion) {
      return { ok: false, conflict: true, currentVersion: entry.version, current: entry };
    }
    const previousResult = entry.aspects[aspectKey] ? entry.aspects[aspectKey].result : 'not_yet_reviewed';
    entry.aspects = { ...entry.aspects, [aspectKey]: { result, note, updatedAt: new Date().toISOString() } };
    entry.version += 1;
    entry.createdAt = entry.createdAt || new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
    state[theoryId] = entry;
    progressStore.writeJsonFileAtomic(p.theoryStatePath, state);
    appendHistory(p, { entityType: 'theory', entityId: theoryId, field: `aspect:${aspectKey}`, previousValue: previousResult, proposedValue: result, reviewerInitials, reason: note, action: 'aspect_result_set' });
    return { ok: true, entry };
  });
}

async function setTheoryOverallStatus(p, { theoryId, status, explicitConfirmation = false, reviewerInitials = '', expectedVersion }) {
  if (!OVERALL_STATUSES.includes(status)) throw new Error(`Unbekannter Status "${status}"`);
  return progressStore.enqueueWrite(p.theoryStatePath, () => {
    const state = loadState(p.theoryStatePath);
    const entry = state[theoryId] ? { ...state[theoryId] } : defaultTheoryEntry();
    if (typeof expectedVersion === 'number' && entry.version !== expectedVersion) {
      return { ok: false, conflict: true, currentVersion: entry.version, current: entry };
    }
    if (status === 'reviewed' || status === 'approved') {
      const unresolved = THEORY_ASPECT_KEYS.filter((k) => (entry.aspects[k] || { result: 'not_yet_reviewed' }).result === 'not_yet_reviewed');
      if (unresolved.length > 0) return { ok: false, error: 'aspects_incomplete', unresolved };
    }
    if (status === 'approved') {
      const notReady = THEORY_ASPECT_KEYS.filter((k) => !['correct', 'not_applicable'].includes(entry.aspects[k].result));
      if (notReady.length > 0) return { ok: false, error: 'not_ready_for_approval', notReady };
      if (!explicitConfirmation) return { ok: false, error: 'explicit_confirmation_required' };
    }
    const previousStatus = entry.overallStatus;
    entry.overallStatus = status;
    entry.version += 1;
    entry.updatedAt = new Date().toISOString();
    state[theoryId] = entry;
    progressStore.writeJsonFileAtomic(p.theoryStatePath, state);
    appendHistory(p, { entityType: 'theory', entityId: theoryId, field: 'overallStatus', previousValue: previousStatus, proposedValue: status, reviewerInitials, action: 'status_changed' });
    return { ok: true, entry };
  });
}

/**
 * Abschnitt 16 -- Export des Arbeitsstands. Schreibt einen eigenständigen Ordner mit genau den
 * erlaubten Inhalten (siehe Kommentare unten), verändert keine Produktivdaten.
 */
function exportWorkspace(p, targetDir) {
  progressStore.ensureDir(targetDir);
  const wordState = loadState(p.wordStatePath);
  const theoryState = loadState(p.theoryStatePath);
  const history = loadHistory(p.historyPath);

  const statusSummary = { words: {}, theories: {} };
  for (const entry of Object.values(wordState)) statusSummary.words[entry.overallStatus] = (statusSummary.words[entry.overallStatus] || 0) + 1;
  for (const entry of Object.values(theoryState)) statusSummary.theories[entry.overallStatus] = (statusSummary.theories[entry.overallStatus] || 0) + 1;

  const audioProblems = Object.entries(wordState)
    .filter(([, e]) => ['correction_proposed', 'uncertain'].includes((e.aspects.audio_pronunciation || {}).result))
    .map(([id, e]) => ({ id, result: e.aspects.audio_pronunciation.result, note: e.aspects.audio_pronunciation.note }));

  let regenerationRequired = [];
  if (fs.existsSync(p.manifestPath)) {
    const manifest = progressStore.readJsonFileSafe(p.manifestPath, { entries: [] });
    regenerationRequired = manifest.entries.filter((e) => e.generation_status === 'regeneration_required').map((e) => e.id);
  }

  // NICHT enthalten (Abschnitt 16): API-Schlüssel, Quellcode, Lernerfortschritt, unnötige
  // Systemdateien, rohe Audiodateien -- der Export enthält ausschließlich reine Review-Metadaten.
  writeExportFile(path.join(targetDir, 'export_word_reviews.json'), wordState);
  writeExportFile(path.join(targetDir, 'export_theory_reviews.json'), theoryState);
  writeExportFile(path.join(targetDir, 'export_change_history.json'), history);
  writeExportFile(path.join(targetDir, 'export_status_summary.json'), statusSummary);
  writeExportFile(path.join(targetDir, 'export_audio_problems.json'), audioProblems);
  writeExportFile(path.join(targetDir, 'export_regeneration_required.json'), regenerationRequired);
  fs.writeFileSync(
    path.join(targetDir, 'export_readme.txt'),
    'Export des lokalen Sprachprüf-Arbeitsbereichs (Entwicklungsauftrag 12).\n'
    + 'Enthält NUR Review-Metadaten (Korrekturvorschläge, Prüfstatus, Änderungsverlauf).\n'
    + 'Enthält KEINE API-Schlüssel, KEINEN Quellcode, KEINEN Lernerfortschritt und KEINE\n'
    + 'rohen Audiodateien. Erzeugt am: ' + new Date().toISOString() + '\n',
    'utf-8'
  );
  return { targetDir, fileCount: 7 };
}

function writeExportFile(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

function sha256(text) {
  return crypto.createHash('sha256').update(String(text), 'utf-8').digest('hex');
}

module.exports = {
  paths,
  loadState,
  loadHistory,
  saveState,
  appendHistory,
  defaultWordEntry,
  defaultTheoryEntry,
  proposeWordCorrection,
  setWordAspectResult,
  setWordOverallStatus,
  proposeTheoryCorrection,
  setTheoryAspectResult,
  setTheoryOverallStatus,
  exportWorkspace,
  sha256
};
