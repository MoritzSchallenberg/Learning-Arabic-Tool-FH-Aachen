// Browser-Ersatz für preload.js -- kein Electron, keine IPC, kein Node-Dateisystem. Implementiert
// exakt dieselbe window.api.*-Schnittstelle (siehe preload.js), damit der GESAMTE übrige
// Renderer-Code (state.js, audioPlayer.js, alle Views) UNVERÄNDERT bleibt und nicht weiß, ob er
// in Electron oder im Browser läuft. Nur DIESE Datei kennt den Unterschied:
//   - Fortschritt/Einstellungen: localStorage statt userData-Dateien (Migration weiterhin über
//     die gemeinsamen, jetzt auch im Browser ladbaren Funktionen aus progressStore.js).
//   - Sprachpaket/Kursdaten: fetch() auf dieselben statischen JSON-Dateien statt Node `fs`.
//   - Audio: fetch() + Base64-Kodierung im Browser (dasselbe Rückgabeformat wie bisher: Base64-
//     String oder null, siehe scripts/audioFileAccess.js), damit audioPlayer.js unverändert bleibt.
//
// WICHTIG für die Ladereihenfolge in index.html: diese Datei muss VOR earlyTheme.js geladen
// werden (setzt window.initialTheme synchron), UND progressStore.js muss irgendwann VOR dem
// ersten tatsächlichen Aufruf von window.api.loadSettings()/loadProgress() geladen sein (beides
// erst asynchron über AppState.init(), also unproblematisch, wenn progressStore.js regulär unter
// den übrigen <script>-Tags im <body> steht).
(function () {
  'use strict';

  const STORAGE_PREFIX = 'learningArabicTool:';
  const LANGUAGE_PACKS_BASE = 'language-packs';
  // Dieselbe Syntaxprüfung wie scripts/audioFileAccess.js (Abschnitt 9 aus Entwicklungsauftrag 13)
  // -- hier keine Sicherheitsgrenze mehr (kein Dateisystemzugriff, nur fetch() auf denselben
  // Ursprung), aber weiterhin sinnvoll, um offensichtlich falsche Aufrufe früh abzufangen.
  const AUDIO_KEY_PATTERN = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

  function readLocal(key, fallback) {
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.error(`[WebApi] Lesen von "${key}" fehlgeschlagen, verwende Fallback:`, err);
      return fallback;
    }
  }

  function writeLocal(key, value) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) {
      // z. B. voller Speicher oder privater Modus mit deaktiviertem localStorage -- die App
      // bleibt in dieser Sitzung nutzbar, nur das Speichern schlägt sichtbar fehl.
      console.error(`[WebApi] Speichern von "${key}" fehlgeschlagen:`, err);
      return false;
    }
  }

  async function fetchJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error(`[WebApi] Laden von "${path}" fehlgeschlagen:`, err);
      return null;
    }
  }

  async function loadLanguagePack(languageId) {
    const base = `${LANGUAGE_PACKS_BASE}/${languageId}`;
    const [
      language, lessons, vocabulary, keyboard, grammar, grammar2, grammar3, reading,
      courses, vocabSessions, theory, tutIntroduction, tutKeyboard
    ] = await Promise.all([
      fetchJson(`${base}/language.json`),
      fetchJson(`${base}/lessons.json`),
      fetchJson(`${base}/vocabulary.json`),
      fetchJson(`${base}/keyboard.json`),
      fetchJson(`${base}/grammar.json`),
      fetchJson(`${base}/grammar_2.json`),
      fetchJson(`${base}/grammar_3.json`),
      fetchJson(`${base}/reading.json`),
      fetchJson(`${base}/courses.json`),
      fetchJson(`${base}/vocabSessions.json`),
      fetchJson(`${base}/theory.json`),
      fetchJson(`${base}/tutorials/introduction.json`),
      fetchJson(`${base}/tutorials/keyboard.json`)
    ]);
    // Dieselbe Objektform wie main.js#loadLanguagePack() (Electron) -- grammar_2.json/
    // grammar_3.json werden bewusst unter den camelCase-Schlüsseln grammar2/grammar3 abgelegt.
    return {
      language, lessons, vocabulary, keyboard, grammar, grammar2, grammar3, reading,
      courses, vocabSessions, theory,
      tutorials: { introduction: tutIntroduction, keyboard: tutKeyboard }
    };
  }

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 0x8000; // String.fromCharCode-Argumentlimit umgehen (große Audiodateien)
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK_SIZE));
    }
    return window.btoa(binary);
  }

  async function loadAudio(languageId, audioKey) {
    if (typeof audioKey !== 'string' || !AUDIO_KEY_PATTERN.test(audioKey)) {
      console.error(`[WebApi] Audio-Anfrage abgelehnt: ungültiger audioKey "${audioKey}"`);
      return null;
    }
    try {
      const res = await fetch(`${LANGUAGE_PACKS_BASE}/${languageId}/audio/${audioKey}.wav`);
      if (!res.ok) return null;
      const buffer = await res.arrayBuffer();
      return arrayBufferToBase64(buffer);
    } catch (err) {
      console.error(`[WebApi] Laden von Audio "${audioKey}" fehlgeschlagen:`, err);
      return null;
    }
  }

  // progressStore.js legt migrateProgress()/migrateSettings() (wie srs.js#evaluateArabicAnswer()
  // etc.) als BARE globale Bezeichner an, nicht unter einem Namespace-Objekt -- dieselbe
  // Aufrufkonvention wie überall sonst im Renderer.
  window.api = {
    loadProgress: async () => migrateProgress(readLocal('progress', undefined)),
    saveProgress: async (data) => writeLocal('progress', data),

    loadSettings: async () => migrateSettings(readLocal('settings', undefined)),
    saveSettings: async (data) => writeLocal('settings', data),

    loadInstalledLanguages: async () => readLocal('installedLanguages', ['arabic']),
    saveInstalledLanguages: async (data) => writeLocal('installedLanguages', data),

    loadStatistics: async () => readLocal('statistics', {}),
    saveStatistics: async (data) => writeLocal('statistics', data),

    loadLanguagePack,
    // Nur EIN Sprachpaket wird tatsächlich ausgeliefert (siehe DEVELOPMENT_FOUNDATION.md) --
    // anders als main.js#listInstalledLanguages() (liest language-packs/ per fs.readdirSync)
    // kann der Browser ein Verzeichnis nicht auflisten; fest wie main.js#DEFAULTS ebenfalls.
    listLanguagePacks: async () => ['arabic'],
    loadAudio
  };

  // Entwicklungsauftrag 14, Abschnitt 9 (angepasst für den Browser): synchron VOR dem ersten
  // Rendern verfügbar -- anders als bei preload.js#ipcRenderer.sendSync() reicht dafür ein
  // direkter, synchroner localStorage-Zugriff, kein IPC-Roundtrip zu einem Hauptprozess nötig.
  // Bewusst dieselbe simple Prüfung wie earlyTheme.js selbst (nicht die volle
  // ProgressStore.normalizeThemeValue-Logik), um keine Ladereihenfolge-Abhängigkeit auf
  // progressStore.js einzuführen, das an dieser frühen Stelle noch nicht geladen sein muss.
  const earlySettings = readLocal('settings', null);
  window.initialTheme = earlySettings && earlySettings.theme === 'dark' ? 'dark' : 'light';
})();
