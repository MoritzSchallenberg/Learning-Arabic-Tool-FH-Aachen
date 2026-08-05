// Generisches Hilfestufen-System A-E (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 14.2).
// Verallgemeinert die Zwei-Fehler-Regression, die letterGroupLesson.js bisher nur lokal für
// einzelne Buchstaben-Phasen kannte, zu einem wiederverwendbaren Zustandsobjekt mit 5 Stufen:
//
//   A — vollständige Hilfe (Wort, Vokalzeichen, Umschrift, Übersetzung, Audio, starke
//       Tastaturmarkierung)
//   B — reduzierte Hilfe (wie A, aber ohne/mit weniger Umschrift)
//   C — Rekonstruktion (teilweise Vokalzeichen, Bild/Übersetzung, leichte Tastaturhilfe)
//   D — aktiver Abruf (nur Übersetzung/Audio, selbstständige Eingabe, keine Tastaturmarkierung)
//   E — Transfer (Satzanwendung/Lückentext/freie Rekonstruktion, keine direkten Hilfen mehr)
//
// Regel (aus dem Auftrag): nach mehreren Fehlern in Folge steigt die Hilfe (Stufe sinkt Richtung
// A), nach mehreren sicheren richtigen Antworten in Folge sinkt sie wieder (Stufe steigt Richtung
// E). Die Tastatur selbst bleibt IMMER die normale virtuelle Tastatur (siehe keyboardLevel.js) —
// nur der Grad der Führung ändert sich.

const HelpLevel = (() => {
  const LEVELS = ['A', 'B', 'C', 'D', 'E'];

  // Wie viele richtige/falsche Antworten in Folge nötig sind, um die Stufe zu wechseln.
  const PROMOTE_AFTER_CORRECT_STREAK = 3; // weniger Hilfe
  const DEMOTE_AFTER_WRONG_STREAK = 2; // mehr Hilfe

  const HELP_LEVEL_CONFIG = {
    A: {
      label: 'Vollständige Hilfe',
      showVocalized: true, showDiacritics: 'full', showTransliteration: true,
      showTranslation: true, showAudio: true, highlightKeyboard: 'strong',
      keyboardLevel: 1, freeInput: false
    },
    B: {
      label: 'Reduzierte Hilfe',
      showVocalized: true, showDiacritics: 'full', showTransliteration: false,
      showTranslation: true, showAudio: true, highlightKeyboard: 'light',
      keyboardLevel: 2, freeInput: false
    },
    C: {
      label: 'Rekonstruktion',
      showVocalized: false, showDiacritics: 'partial', showTransliteration: false,
      showTranslation: true, showAudio: true, highlightKeyboard: 'light',
      keyboardLevel: 2, freeInput: true
    },
    D: {
      label: 'Aktiver Abruf',
      showVocalized: false, showDiacritics: false, showTransliteration: false,
      showTranslation: true, showAudio: true, highlightKeyboard: 'none',
      keyboardLevel: 3, freeInput: true
    },
    E: {
      label: 'Transfer',
      showVocalized: false, showDiacritics: false, showTransliteration: false,
      showTranslation: false, showAudio: false, highlightKeyboard: 'none',
      keyboardLevel: 4, freeInput: true, application: true
    }
  };

  function create(initialLevel = 'C') {
    let levelIndex = LEVELS.indexOf(initialLevel);
    if (levelIndex === -1) levelIndex = LEVELS.indexOf('C');
    let correctStreak = 0;
    let wrongStreak = 0;

    function currentLevel() {
      return LEVELS[levelIndex];
    }

    function config() {
      return HELP_LEVEL_CONFIG[currentLevel()];
    }

    /** @param {boolean} isCorrect @returns {{level:string, changed:boolean, direction:'more_help'|'less_help'|null}} */
    function registerResult(isCorrect) {
      const before = levelIndex;
      let direction = null;

      if (isCorrect) {
        correctStreak += 1;
        wrongStreak = 0;
        if (correctStreak >= PROMOTE_AFTER_CORRECT_STREAK && levelIndex < LEVELS.length - 1) {
          levelIndex += 1; // Richtung E: weniger Hilfe
          correctStreak = 0;
          direction = 'less_help';
        }
      } else {
        wrongStreak += 1;
        correctStreak = 0;
        if (wrongStreak >= DEMOTE_AFTER_WRONG_STREAK && levelIndex > 0) {
          levelIndex -= 1; // Richtung A: mehr Hilfe
          wrongStreak = 0;
          direction = 'more_help';
        }
      }

      return { level: currentLevel(), changed: levelIndex !== before, direction };
    }

    function setLevel(level) {
      const idx = LEVELS.indexOf(level);
      if (idx !== -1) {
        levelIndex = idx;
        correctStreak = 0;
        wrongStreak = 0;
      }
    }

    return {
      currentLevel,
      config,
      registerResult,
      setLevel,
      get correctStreak() { return correctStreak; },
      get wrongStreak() { return wrongStreak; }
    };
  }

  return { create, LEVELS, HELP_LEVEL_CONFIG };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HelpLevel;
}
