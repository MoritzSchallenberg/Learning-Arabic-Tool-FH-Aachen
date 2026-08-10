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
//   erst wenn GAR KEINE Aufnahme existiert, kommt TTS zum Einsatz.
//
// Entwicklungsauftrag 13, Abschnitt 6.4/8:
// - `speak()` löst jetzt mit einem ausführlicheren, dokumentierten Statusobjekt
//   `{ source, mode, audioKey }` auf (siehe unten) statt nur `{source: 'audio'|'tts'}`.
// - `speak()` wirft/rejected NIE mehr -- jeder Fehlerfall (auch ein TTS-Fehlschlag) löst mit
//   `{source: 'failed', mode: 'failed', audioKey}` auf. Das macht die alten, verstreuten
//   `.catch(() => {})`-Aufrufe an den Call-Sites überflüssig UND gefahrlos entfernbar.
// - `speakWord(word, {slow, context, button})` ist der neue, empfohlene Einstiegspunkt für
//   Vokabelwörter: löst den Audio-Schlüssel zentral auf (AudioKeyResolver), schützt gegen
//   Mehrfachklicks (optionales `button`-Element wird während des Ladens deaktiviert), meldet
//   Fehler sichtbar UND in der Konsole (AudioFeedback) statt sie stillschweigend zu verschlucken.

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
   * @returns {Promise<{source: 'recorded_audio'|'tts_fallback'|'failed', mode: 'normal'|'dedicated_slow'|'slowed_normal'|'tts_fallback'|'failed', audioKey: string|null}>}
   *   Löst IMMER auf (nie reject) -- ein Fehlschlag ist ein gültiges Ergebnis mit source:'failed'.
   */
  async function speak(text, lang, { slow = false, audioKey = null } = {}) {
    if (audioKey) {
      if (slow) {
        try {
          const slowBase64 = await fetchSlowAudioBase64(audioKey);
          if (slowBase64) {
            await playBase64Wav(slowBase64);
            return { source: 'recorded_audio', mode: 'dedicated_slow', audioKey };
          }
        } catch (err) {
          // fällt durch zur normalen Aufnahme mit reduzierter Geschwindigkeit
        }
      }
      try {
        const base64 = await fetchAudioBase64(audioKey);
        if (base64) {
          await playBase64Wav(base64, slow ? 0.75 : undefined);
          return { source: 'recorded_audio', mode: slow ? 'slowed_normal' : 'normal', audioKey };
        }
      } catch (err) {
        // fällt durch zum TTS-Fallback
      }
    }
    stopCurrentAudio();
    try {
      await TTS.speak(text, lang, { slow });
      return { source: 'tts_fallback', mode: 'tts_fallback', audioKey };
    } catch (err) {
      return { source: 'failed', mode: 'failed', audioKey };
    }
  }

  const activeButtons = new WeakSet(); // Schutz gegen schnelles Mehrfachstarten je Button-Element

  /**
   * Empfohlener Einstiegspunkt für Vokabelwörter (Entwicklungsauftrag 13, Abschnitt 5/6/8):
   * löst den Audio-Schlüssel zentral über AudioKeyResolver auf, schützt optional gegen
   * Doppelklicks, meldet Fehlschläge sichtbar statt sie stillschweigend zu verschlucken.
   *
   * @param {{id:string, arabic?:string, arabic_vocalized?:string, audio_key?:string}} word
   * @param {{slow?:boolean, context?:string, button?:HTMLElement, lang?:string}} [options]
   */
  async function speakWord(word, { slow = false, context = 'Vokabel', button = null, lang = 'ar-SA' } = {}) {
    if (button) {
      if (activeButtons.has(button) || button.disabled) return { source: 'failed', mode: 'failed', audioKey: null };
      activeButtons.add(button);
      button.disabled = true;
    }
    try {
      const audioKey = typeof AudioKeyResolver !== 'undefined' ? AudioKeyResolver.resolveVocabularyAudioKey(word) : null;
      const text = (word && (word.arabic_vocalized || word.arabic)) || '';
      const result = await speak(text, lang, { slow, audioKey });
      if (result.source === 'failed' && typeof AudioFeedback !== 'undefined') {
        AudioFeedback.reportAudioError(context, new Error(`Wiedergabe fehlgeschlagen für audioKey="${audioKey}"`));
      } else if (result.source === 'tts_fallback' && typeof AudioFeedback !== 'undefined') {
        AudioFeedback.reportTtsFallback(context);
      }
      return result;
    } finally {
      if (button) {
        activeButtons.delete(button);
        button.disabled = false;
      }
    }
  }

  return { speak, speakWord, stopCurrentAudio };
})();
