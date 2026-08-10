// Entwicklungsauftrag 13, Abschnitt 9 — gehärteter, gemeinsamer Baustein für den Zugriff auf
// Audiodateien aus einem Electron-Hauptprozess heraus. Von main.js (normale Lernoberfläche) UND
// reviewMain.js (Sprachprüfmodus, Entwicklungsauftrag 12) verwendet, damit beide dieselbe,
// EINMAL gehärtete und getestete Prüfung durchlaufen, statt zwei leicht unterschiedliche
// Implementierungen zu pflegen.
//
// Sicherheitsanforderungen (Abschnitt 9):
//   - audioKey gegen eine feste, erlaubte Syntax validieren
//   - Zielpfad mit path.resolve bilden
//   - sicherstellen, dass der Zielpfad innerhalb des vorgesehenen Audioverzeichnisses liegt
//   - absolute Pfade und ".." ablehnen
//   - nur unterstützte Audiodateien (.wav) laden
//   - verständliche Fehler zurückgeben (intern; die öffentliche IPC-Antwort bleibt aus
//     Kompatibilitätsgründen `base64 string | null`, aber jede Ablehnung wird mit Grund geloggt)

const fs = require('fs');
const path = require('path');

// Genau EIN Unterverzeichnis-Segment + Dateiname, z. B. "vocabulary/c1_u01_01" oder
// "letters/alif" -- keine Punkte (schließt ".."/"." strukturell aus), keine führenden/doppelten
// Schrägstriche, kein Backslash.
const AUDIO_KEY_PATTERN = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

/**
 * Prüft und löst einen audioKey zu einem absoluten Dateipfad innerhalb von `baseAudioDir` auf.
 * Gibt bei jeder Ablehnung einen sprechenden Grund zurück (fürs Logging), nie einen Pfad
 * außerhalb von baseAudioDir.
 *
 * @param {string} baseAudioDir - absolutes Basisverzeichnis (z. B. .../language-packs/arabic/audio)
 * @param {string} audioKey
 * @returns {{ok: true, path: string} | {ok: false, reason: string}}
 */
function resolveAudioFilePath(baseAudioDir, audioKey) {
  if (typeof audioKey !== 'string' || audioKey.length === 0) {
    return { ok: false, reason: 'audioKey fehlt oder ist kein String' };
  }
  if (!AUDIO_KEY_PATTERN.test(audioKey)) {
    return { ok: false, reason: `audioKey "${audioKey}" entspricht nicht dem erlaubten Muster (ein Unterverzeichnis + Dateiname, keine Sonderzeichen)` };
  }
  if (audioKey.includes('..') || path.isAbsolute(audioKey)) {
    // Durch das Regex oben strukturell bereits ausgeschlossen -- zusätzliche, unabhängige
    // Prüfung als zweite Verteidigungslinie (Abschnitt 9: "absolute Pfade und '..' ablehnen").
    return { ok: false, reason: 'audioKey enthält einen unzulässigen Pfadanteil' };
  }

  const normalizedBase = path.resolve(baseAudioDir);
  const candidate = path.resolve(normalizedBase, `${audioKey}.wav`);
  if (candidate !== normalizedBase && !candidate.startsWith(normalizedBase + path.sep)) {
    return { ok: false, reason: 'aufgelöster Pfad liegt außerhalb des Audioverzeichnisses' };
  }
  return { ok: true, path: candidate };
}

/**
 * Lädt eine Audiodatei sicher und gibt sie Base64-kodiert zurück (das von audioPlayer.js/
 * reviewWordDetail.js erwartete Format). Wirft nie -- jeder Fehlerfall liefert `null` plus eine
 * Konsolenmeldung mit verständlichem Grund (Hauptprozess-Log, nicht im Renderer sichtbar, aber
 * bei der Fehlersuche nachvollziehbar).
 *
 * @returns {string|null}
 */
function loadAudioBase64Safe(baseAudioDir, audioKey, { logPrefix = '[Audio]' } = {}) {
  const resolved = resolveAudioFilePath(baseAudioDir, audioKey);
  if (!resolved.ok) {
    // eslint-disable-next-line no-console
    console.error(`${logPrefix} Anfrage abgelehnt: ${resolved.reason}`);
    return null;
  }
  try {
    return fs.readFileSync(resolved.path).toString('base64');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`${logPrefix} Datei konnte nicht gelesen werden (${resolved.path}): ${err.message}`);
    return null;
  }
}

module.exports = { AUDIO_KEY_PATTERN, resolveAudioFilePath, loadAudioBase64Safe };
