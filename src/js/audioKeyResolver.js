// Entwicklungsauftrag 13, Abschnitt 5 — EINE zentrale Funktion zur Auflösung des Audio-Schlüssels
// eines Vokabelworts. Ersetzt die zuvor an 14 Stellen verstreute, direkte Konstruktion
// `vocabulary/${word.id}` (u. a. in sessionController.js, exerciseRegistry.js, listening.js,
// vocabulary.js, freePractice.js) -- eine davon (exerciseRegistry.js#audioKeyFor) hat dabei
// sogar ein bereits vorhandenes word.audio_key komplett ignoriert.
//
// Bevorzugt IMMER word.audio_key (das eigentliche, im Sprachpaket gepflegte Feld). Fällt nur für
// ältere/unvollständige Datensätze OHNE dieses Feld kontrolliert auf `vocabulary/<id>` zurück --
// und zwar SICHTBAR (Konsolenwarnung), nicht still, damit ein fehlendes audio_key-Feld nicht
// unbemerkt bleibt (Abschnitt 5: "darf fehlerhafte explizite audio_key-Werte nicht unbemerkt
// verdecken"). Ein VORHANDENES, aber leeres/ungültiges audio_key wird NICHT stillschweigend
// überschrieben -- das wäre genau das unbemerkte Verdecken, das der Auftrag ausschließt.

const AudioKeyResolver = (() => {
  /**
   * @param {{id: string, audio_key?: string}} word
   * @returns {string|null} der aufzulösende Audio-Schlüssel, oder null, wenn er sich nicht
   *   sinnvoll bestimmen lässt (z. B. weder audio_key noch id vorhanden).
   */
  function resolveVocabularyAudioKey(word) {
    if (!word) return null;
    if (typeof word.audio_key === 'string' && word.audio_key.trim().length > 0) {
      return word.audio_key;
    }
    if ('audio_key' in word && word.audio_key !== undefined && word.audio_key !== null) {
      // Ein explizit gesetztes, aber leeres/ungültiges audio_key ist ein Datenfehler -- laut
      // Abschnitt 5 nicht unbemerkt verdecken, sondern deutlich melden, BEVOR auf den Fallback
      // zurückgefallen wird.
      // eslint-disable-next-line no-console
      console.warn(`AudioKeyResolver: Wort "${word.id}" hat ein ungültiges audio_key-Feld ("${word.audio_key}") -- falle auf "vocabulary/${word.id}" zurück.`);
    }
    if (!word.id) return null;
    return `vocabulary/${word.id}`;
  }

  /**
   * Entsprechendes Gegenstück für Buchstaben-Beispielwörter (keyboard.json#letters), damit
   * dieselbe Kontrolliert-Fallback-Logik auch dort verfügbar ist, falls künftig ein eigenes
   * audio_key-Feld für Buchstaben eingeführt wird. Aktuell nutzt der Bestand ausschließlich die
   * ID-basierte Form -- das ist bewusst kein Fehler, kein Warnhinweis nötig.
   */
  function resolveLetterAudioKey(letter) {
    if (!letter) return null;
    if (typeof letter.audio_key === 'string' && letter.audio_key.trim().length > 0) {
      return letter.audio_key;
    }
    if (!letter.id) return null;
    return `letters/${letter.id}`;
  }

  return { resolveVocabularyAudioKey, resolveLetterAudioKey };
})();
