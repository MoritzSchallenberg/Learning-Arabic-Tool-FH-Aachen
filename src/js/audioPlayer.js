// Spielt bevorzugt echte, mit der App ausgelieferte Audiodateien ab (Spec Kapitel 2.2:
// "im Sprachpaket enthaltene Aufnahme" ist Stufe 2, besser als System-TTS als Stufe-3-Ersatz).
// Fällt auf speechSynthesis (tts.js) zurück, falls keine Datei gefunden wird (z. B. weil
// noch keine Audiodatei für dieses Wort erzeugt wurde).
//
// Entwicklungsauftrag 5, Abschnitt 22:
// - `currentAudio` verhindert Überlagerung: eine neue Wiedergabe stoppt IMMER zuerst eine noch
//   laufende vorherige Wiedergabe (Position wird zurückgesetzt), bevor die neue startet.
// - Langsame Wiedergabe bevorzugt eine eigene "*_slow.wav"-Aufnahme; existiert keine, wird NICHT
//   sofort auf TTS ausgewichen, sondern die normale Aufnahme mit playbackRate=0.75 verwendet —
//   erst wenn GAR KEINE Aufnahme existiert, kommt TTS zum Einsatz. Dadurch genügt für die
//   900-Wort-Erweiterung später eine einzige Aufnahme pro Wort.
// - `speak()` löst mit `{ source: 'audio' | 'tts' }` auf, damit die Oberfläche optional anzeigen
//   kann, dass eine Computerstimme statt einer kuratierten Aufnahme verwendet wurde.

const AudioPlayer = (() => {
  const cache = new Map(); // audioKey -> base64 string | null (Normalgeschwindigkeit)
  const slowCache = new Map(); // audioKey -> base64 string | null (eigene *_slow-Aufnahme)
  let currentAudio = null;

  async function fetchAudioBase64(audioKey) {
    if (cache.has(audioKey)) return cache.get(audioKey);
    const base64 = await window.api.loadAudio('arabic', audioKey);
    cache.set(audioKey, base64);
    return base64;
  }

  async function fetchSlowAudioBase64(audioKey) {
    const slowKey = `${audioKey}_slow`;
    if (slowCache.has(slowKey)) return slowCache.get(slowKey);
    const base64 = await window.api.loadAudio('arabic', slowKey);
    slowCache.set(slowKey, base64);
    return base64;
  }

  function stopCurrentAudio() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (err) {
        // ältere/gemockte Audio-Implementierungen erlauben evtl. kein currentTime-Reset — egal.
      }
      currentAudio = null;
    }
  }

  function playBase64Wav(base64, playbackRate) {
    return new Promise((resolve, reject) => {
      stopCurrentAudio();
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      if (playbackRate) audio.playbackRate = playbackRate;
      currentAudio = audio;
      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        reject(new Error('Audiodatei konnte nicht abgespielt werden'));
      };
      audio.play().catch(reject);
    });
  }

  /**
   * @param {string} text - für den TTS-Fallback benötigter Text
   * @param {string} lang - z. B. "ar-SA"
   * @param {{slow?: boolean, audioKey?: string|null}} options
   * @returns {Promise<{source: 'audio'|'tts'}>}
   */
  async function speak(text, lang, { slow = false, audioKey = null } = {}) {
    if (audioKey) {
      if (slow) {
        try {
          const slowBase64 = await fetchSlowAudioBase64(audioKey);
          if (slowBase64) {
            await playBase64Wav(slowBase64);
            return { source: 'audio' };
          }
        } catch (err) {
          // fällt durch zur normalen Aufnahme mit reduzierter Geschwindigkeit
        }
      }
      try {
        const base64 = await fetchAudioBase64(audioKey);
        if (base64) {
          await playBase64Wav(base64, slow ? 0.75 : undefined);
          return { source: 'audio' };
        }
      } catch (err) {
        // fällt durch zum TTS-Fallback
      }
    }
    stopCurrentAudio();
    await TTS.speak(text, lang, { slow });
    return { source: 'tts' };
  }

  return { speak, stopCurrentAudio };
})();
