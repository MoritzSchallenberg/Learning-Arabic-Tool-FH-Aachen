// Entwicklungsauftrag 12, Abschnitt 13 — rein TECHNISCHE Prüfung erzeugter Audiodateien, bevor
// sie aus dem Staging-Bereich in den produktiven Audioordner übernommen werden.
//
// WICHTIG (siehe Auftragstext): eine bestandene Prüfung hier ist KEINE Bestätigung der
// arabischen Aussprache -- das kann nur ein Mensch mit Arabischkenntnissen beurteilen. Diese
// Datei prüft ausschließlich, ob überhaupt eine plausible, nicht-leere, nicht-stumme WAV-Datei
// vorliegt (statt z. B. einer als WAV gespeicherten JSON-/HTML-Fehlerantwort des Anbieters).

const crypto = require('node:crypto');

const MIN_PLAUSIBLE_BYTES = 2000; // deutlich kleiner als jede echte Sprachaufnahme, aber groß
// genug, um typische kurze JSON-/HTML-Fehlerantworten zuverlässig auszuschließen.
const MIN_PLAUSIBLE_DURATION_SECONDS = 0.15;
const MAX_PLAUSIBLE_DURATION_SECONDS = 20; // großzügig, damit auch die längeren Unit-30-
// Beispielsätze in den application_prompts (falls je vertont) nicht fälschlich abgelehnt werden.
const SILENCE_AMPLITUDE_RATIO = 0.02; // max. Amplitude unter 2 % der Vollaussteuerung => "stumm"

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function textHash(text) {
  return crypto.createHash('sha256').update(String(text), 'utf-8').digest('hex');
}

/**
 * Läuft die RIFF/WAVE-Chunks ab und liest den fmt- und data-Chunk aus. Gibt null zurück, wenn
 * kein gültiger WAV-Header erkennbar ist (z. B. bei einer als .wav gespeicherten Fehlerantwort).
 */
function parseWavHeader(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 44) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buffer.toString('ascii', 8, 12) !== 'WAVE') return null;

  let offset = 12;
  let fmt = null;
  let dataChunk = null;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const bodyStart = offset + 8;
    if (bodyStart + chunkSize > buffer.length) break; // beschädigter/abgeschnittener Chunk
    if (chunkId === 'fmt ') {
      fmt = {
        audioFormat: buffer.readUInt16LE(bodyStart),
        numChannels: buffer.readUInt16LE(bodyStart + 2),
        sampleRate: buffer.readUInt32LE(bodyStart + 4),
        byteRate: buffer.readUInt32LE(bodyStart + 8),
        blockAlign: buffer.readUInt16LE(bodyStart + 12),
        bitsPerSample: buffer.readUInt16LE(bodyStart + 14)
      };
    } else if (chunkId === 'data') {
      dataChunk = { offset: bodyStart, size: chunkSize };
    }
    offset = bodyStart + chunkSize + (chunkSize % 2); // Chunks sind auf gerade Länge gepolstert
  }
  if (!fmt || !dataChunk) return null;

  const bytesPerSecond = fmt.byteRate || fmt.sampleRate * fmt.blockAlign;
  const durationSeconds = bytesPerSecond > 0 ? dataChunk.size / bytesPerSecond : 0;
  return { fmt, dataChunk, durationSeconds };
}

/**
 * Grobe Stummheits-Heuristik für 16-Bit-PCM: liegt die maximale Amplitude im gesamten
 * Datenbereich unter der Schwelle, ist die Datei "praktisch stumm". Für andere Bit-Tiefen wird
 * bewusst nicht geprüft (kein falsches Signal), statt eine falsche Aussage zu treffen.
 */
function isLikelySilent(buffer, header, thresholdRatio = SILENCE_AMPLITUDE_RATIO) {
  if (!header || header.fmt.bitsPerSample !== 16) return false;
  const { offset, size } = header.dataChunk;
  const end = Math.min(buffer.length, offset + size);
  let maxAbs = 0;
  for (let i = offset; i + 1 < end; i += 2) {
    const sample = buffer.readInt16LE(i);
    const abs = Math.abs(sample);
    if (abs > maxAbs) maxAbs = abs;
    if (maxAbs / 32768 >= thresholdRatio) return false; // früh abbrechen, sobald klar nicht stumm
  }
  return maxAbs / 32768 < thresholdRatio;
}

function looksLikeErrorResponse(buffer) {
  // API-Fehlerantworten sind praktisch immer JSON ("{...") oder HTML ("<!DOCTYPE"/"<html")
  // statt eines binären RIFF-Headers.
  const head = buffer.toString('utf-8', 0, Math.min(20, buffer.length)).trimStart();
  return head.startsWith('{') || head.startsWith('<') || head.startsWith('[');
}

/**
 * Führt alle technischen Prüfungen aus Abschnitt 13 gegen einen fertig heruntergeladenen Buffer
 * durch. Gibt { ok, problems, header } zurück -- `ok` ist nur dann true, wenn KEIN Problem
 * gefunden wurde. Wirft nie, damit der Aufrufer alle Probleme auf einmal sammeln kann.
 */
function validateAudioBuffer(buffer) {
  const problems = [];
  if (!buffer || buffer.length === 0) {
    problems.push('Datei ist leer');
    return { ok: false, problems, header: null };
  }
  if (looksLikeErrorResponse(buffer)) {
    problems.push('Antwort sieht wie eine JSON-/HTML-Fehlermeldung aus, kein WAV');
  }
  if (buffer.length < MIN_PLAUSIBLE_BYTES) {
    problems.push(`Datei ist mit ${buffer.length} Bytes unplausibel klein für eine Sprachaufnahme (Mindestwert ${MIN_PLAUSIBLE_BYTES})`);
  }
  const header = parseWavHeader(buffer);
  if (!header) {
    problems.push('kein gültiger WAV-Header (RIFF/WAVE/fmt /data)');
    return { ok: false, problems, header: null };
  }
  if (header.durationSeconds < MIN_PLAUSIBLE_DURATION_SECONDS) {
    problems.push(`Dauer ${header.durationSeconds.toFixed(3)}s unplausibel kurz (Mindestwert ${MIN_PLAUSIBLE_DURATION_SECONDS}s)`);
  }
  if (header.durationSeconds > MAX_PLAUSIBLE_DURATION_SECONDS) {
    problems.push(`Dauer ${header.durationSeconds.toFixed(1)}s unplausibel lang (Höchstwert ${MAX_PLAUSIBLE_DURATION_SECONDS}s)`);
  }
  if (isLikelySilent(buffer, header)) {
    problems.push('Datei scheint (fast) vollständig stumm zu sein');
  }
  return { ok: problems.length === 0, problems, header };
}

module.exports = {
  MIN_PLAUSIBLE_BYTES,
  MIN_PLAUSIBLE_DURATION_SECONDS,
  MAX_PLAUSIBLE_DURATION_SECONDS,
  parseWavHeader,
  isLikelySilent,
  looksLikeErrorResponse,
  validateAudioBuffer,
  sha256,
  textHash
};
