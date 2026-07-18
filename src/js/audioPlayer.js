// Spielt bevorzugt echte, mit der App ausgelieferte Audiodateien ab (Spec Kapitel 2.2:
// "im Sprachpaket enthaltene Aufnahme" ist Stufe 2, besser als System-TTS als Stufe-3-Ersatz).
// Fällt auf speechSynthesis (tts.js) zurück, falls keine Datei gefunden wird (z. B. weil
// noch keine Audiodatei für dieses Wort erzeugt wurde).

const AudioPlayer = (() => {
  const cache = new Map(); // audioKey(+slow) -> base64 string | null

  async function fetchAudioBase64(audioKey, slow) {
    const cacheKey = audioKey + (slow ? '_slow' : '');
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const base64 = await window.api.loadAudio('arabic', cacheKey);
    cache.set(cacheKey, base64);
    return base64;
  }

  function playBase64Wav(base64) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audiodatei konnte nicht abgespielt werden'));
      audio.play().catch(reject);
    });
  }

  /**
   * @param {string} text - für den TTS-Fallback benötigter Text
   * @param {string} lang - z. B. "ar-SA"
   * @param {{slow?: boolean, audioKey?: string|null}} options
   */
  async function speak(text, lang, { slow = false, audioKey = null } = {}) {
    if (audioKey) {
      try {
        const base64 = await fetchAudioBase64(audioKey, slow);
        if (base64) {
          await playBase64Wav(base64);
          return;
        }
      } catch (err) {
        // fällt durch zum TTS-Fallback
      }
    }
    return TTS.speak(text, lang, { slow });
  }

  return { speak };
})();
