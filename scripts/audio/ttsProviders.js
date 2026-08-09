// Entwicklungsauftrag 12, Abschnitt 12 — Anbieter-Anbindung für die Vorschau-Audioerzeugung.
//
// Bewusst die EINZIGE Stelle im gesamten Projekt, die einen echten Netzwerkaufruf macht -- alles
// andere in der Pipeline (Auswahl, Staging, Prüfung, Manifest-Fortschreibung) kommt ohne Netzwerk
// aus und ist dadurch ohne echte API-Aufrufe testbar (Abschnitt 18: "Keine echten API-Aufrufe in
// automatisierten Tests"). Tests reichen einen `httpClient`-Mock ein statt echter Requests.
//
// Der API-Schlüssel wird NIE geloggt, NIE zurückgegeben und NIE in eine Datei geschrieben --
// er existiert ausschließlich als Funktionsparameter/Header für den einen POST-Aufruf.

const https = require('node:https');

const DEFAULT_MODEL_ID = 'eleven_multilingual_v2'; // unterstützt Arabisch (aus generate_audio_elevenlabs.py übernommen)
const DEFAULT_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // "Alice" -- bereits als für diesen Account nutzbar bestätigt (siehe scripts/generate_audio_elevenlabs.py)
const NORMAL_SPEED = 1.0;

class ProviderError extends Error {
  constructor(message, { retryable = false, statusCode = null } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.retryable = retryable;
    this.statusCode = statusCode;
  }
}

function elevenLabsConfigFromEnv(env = process.env) {
  return {
    apiKey: env.ELEVENLABS_API_KEY || null,
    voiceId: env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID,
    modelId: DEFAULT_MODEL_ID
  };
}

function elevenLabsAvailable(env = process.env) {
  return Boolean(elevenLabsConfigFromEnv(env).apiKey);
}

/**
 * Minimaler https-POST-Client (kein zusätzliches npm-Package nötig). Wird in Tests durch einen
 * Mock ersetzt -- siehe `httpClient`-Parameter von synthesizeWithElevenLabs.
 */
function httpsPostJson(url, { headers, body, timeoutMs = 30000 }) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Zeitüberschreitung bei der TTS-Anfrage')));
    req.write(body);
    req.end();
  });
}

/**
 * @param {string} text - arabic_vocalized des Wortes (Abschnitt 10: "arabic_vocalized als
 *   TTS-Eingabe verwenden")
 * @param {{apiKey, voiceId, modelId, speed, httpClient}} options
 * @returns {Promise<Buffer>} der rohe WAV-Datei-Inhalt
 */
async function synthesizeWithElevenLabs(text, options = {}) {
  const { apiKey, voiceId = DEFAULT_VOICE_ID, modelId = DEFAULT_MODEL_ID, speed = NORMAL_SPEED, httpClient = httpsPostJson } = options;
  if (!apiKey) {
    throw new ProviderError('ELEVENLABS_API_KEY ist nicht gesetzt', { retryable: false });
  }
  if (!text || !text.trim()) {
    throw new ProviderError('Leerer Eingabetext -- keine Anfrage gesendet', { retryable: false });
  }
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=wav_22050`;
  const payload = JSON.stringify({
    text,
    model_id: modelId,
    voice_settings: { speed, stability: 0.5, similarity_boost: 0.75 }
  });
  let response;
  try {
    response = await httpClient(url, {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      body: payload
    });
  } catch (networkErr) {
    // Netzwerkfehler (Timeout, DNS, Verbindungsabbruch) sind grundsätzlich wiederholbar.
    throw new ProviderError(`Netzwerkfehler bei ElevenLabs: ${networkErr.message}`, { retryable: true });
  }
  if (response.statusCode === 401 || response.statusCode === 402) {
    // 401 = ungültiger/fehlender Schlüssel, 402 = Kontingent aufgebraucht -- beides sinnlos
    // wiederholbar, jeder erneute Versuch würde nur unnötig Zeit verbrauchen.
    throw new ProviderError(
      `ElevenLabs meldet HTTP ${response.statusCode} (Authentifizierung/Kontingent)`,
      { retryable: false, statusCode: response.statusCode }
    );
  }
  if (response.statusCode !== 200) {
    throw new ProviderError(`ElevenLabs meldet HTTP ${response.statusCode}`, { retryable: true, statusCode: response.statusCode });
  }
  return response.body;
}

/**
 * NUR für eine klar getrennte technische Staging-Stichprobe erlaubt, falls ElevenLabs nicht
 * verfügbar ist (Abschnitt 12, letzter Absatz) -- NIE für produktnahe Vorschauaufnahmen. Ruft das
 * lokal installierte espeak-ng-Kommandozeilenwerkzeug auf. Wird von der Pipeline absichtlich mit
 * einem eigenen `provider: 'espeak-ng-technical-sample'`-Kennzeichen markiert.
 */
function synthesizeWithEspeakTechnicalSample(text, { speedWpm = 150, execFileSync = require('node:child_process').execFileSync } = {}) {
  const os = require('node:os');
  const path = require('node:path');
  const fs = require('node:fs');
  const tmpFile = path.join(os.tmpdir(), `espeak-technical-sample-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
  try {
    execFileSync('espeak-ng', ['-v', 'ar', '-s', String(speedWpm), '-w', tmpFile, text], { stdio: 'pipe' });
    return fs.readFileSync(tmpFile);
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* bereits weg / nie erzeugt -- egal */ }
  }
}

module.exports = {
  DEFAULT_MODEL_ID,
  DEFAULT_VOICE_ID,
  NORMAL_SPEED,
  ProviderError,
  elevenLabsConfigFromEnv,
  elevenLabsAvailable,
  httpsPostJson,
  synthesizeWithElevenLabs,
  synthesizeWithEspeakTechnicalSample
};
