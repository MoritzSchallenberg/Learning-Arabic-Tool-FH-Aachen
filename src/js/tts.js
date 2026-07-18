// Wrapper um die Web Speech API (speechSynthesis) — einzige installationsfreie TTS-Option.
// Ob/welche arabische Stimme verfügbar ist, hängt vom Betriebssystem/Browser-Unterbau ab.

const TTS = (() => {
  let cachedVoices = [];

  function refreshVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    cachedVoices = window.speechSynthesis.getVoices();
    return cachedVoices;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  function findVoiceForLang(lang) {
    const voices = cachedVoices.length ? cachedVoices : refreshVoices();
    const exact = voices.find((v) => v.lang && v.lang.toLowerCase() === lang.toLowerCase());
    if (exact) return exact;
    const prefix = lang.split('-')[0].toLowerCase();
    return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix)) || null;
  }

  function hasVoiceForLang(lang) {
    return findVoiceForLang(lang) !== null;
  }

  function speak(text, lang, { slow = false } = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return Promise.reject(new Error('speechSynthesis nicht verfügbar'));
    }
    return new Promise((resolve, reject) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = slow ? 0.6 : 1.0;
      const voice = findVoiceForLang(lang);
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error || new Error('TTS-Fehler'));
      window.speechSynthesis.speak(utterance);
    });
  }

  return { speak, hasVoiceForLang, refreshVoices };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TTS;
}
