// Datenbasis für die virtuelle arabische Tastatur (Spec Kapitel 6.2/6.5) und die
// Transliterationstabelle (Spec Kapitel 6.4). Beide Tabellen sind wörtlich aus der
// Systembeschreibung übernommen (verlässliche Quelle), im Gegensatz zu einer physischen
// Arabic-101-Tastenzuordnung, die absichtlich nicht in V1 enthalten ist (siehe README).

const VIRTUAL_KEYBOARD_ROWS = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ']
];

const SPECIAL_CHARACTERS_ROW = ['ء', 'أ', 'إ', 'آ', 'ؤ', 'ئ', 'ة', 'ى', 'لا'];

const DIACRITICS_ROW = ['َ', 'ِ', 'ُ', 'ْ', 'ّ', 'ً', 'ٍ', 'ٌ'];

const ARABIC_QUESTION_MARK = '؟';

// Nur zu Referenzzwecken (Datenbasis), Live-Umwandlung folgt in einer späteren Version
// (Transliterationsmodus ist laut Spec-Roadmap "Version 3").
const TRANSLITERATION_TABLE = [
  { latin: 'b', arabic: 'ب' },
  { latin: 't', arabic: 'ت' },
  { latin: 'th', arabic: 'ث' },
  { latin: 'j', arabic: 'ج' },
  { latin: '7', arabic: 'ح' },
  { latin: 'H', arabic: 'ح' },
  { latin: 'kh', arabic: 'خ' },
  { latin: 'd', arabic: 'د' },
  { latin: 'dh', arabic: 'ذ' },
  { latin: 'r', arabic: 'ر' },
  { latin: 'z', arabic: 'ز' },
  { latin: 's', arabic: 'س' },
  { latin: 'sh', arabic: 'ش' },
  { latin: 'S', arabic: 'ص' },
  { latin: '9', arabic: 'ص' },
  { latin: 'D', arabic: 'ض' },
  { latin: 'T', arabic: 'ط' },
  { latin: 'Z', arabic: 'ظ' },
  { latin: '3', arabic: 'ع' },
  { latin: 'gh', arabic: 'غ' },
  { latin: 'f', arabic: 'ف' },
  { latin: 'q', arabic: 'ق' },
  { latin: 'k', arabic: 'ك' },
  { latin: 'l', arabic: 'ل' },
  { latin: 'm', arabic: 'م' },
  { latin: 'n', arabic: 'ن' },
  { latin: 'h', arabic: 'ه' },
  { latin: 'w', arabic: 'و' },
  { latin: 'y', arabic: 'ي' },
  { latin: "'", arabic: 'ء' }
];

const TATWEEL = 'ـ';

// Erzeugt die vier Kontextformen eines Buchstabens rein zur Anzeige, ohne Presentation-Form-
// Codepoints in den Daten zu speichern (Spec Kapitel 3). "joining" ist "dual" oder "right"
// (rechts-verbindende Buchstaben wie ا د ذ ر ز و haben keine eigene Anfangs-/Mittelform).
function buildLetterForms(letter, joining) {
  if (joining === 'right') {
    return {
      isolated: letter,
      initial: letter,
      medial: TATWEEL + letter,
      final: TATWEEL + letter
    };
  }
  return {
    isolated: letter,
    initial: letter + TATWEEL,
    medial: TATWEEL + letter + TATWEEL,
    final: TATWEEL + letter
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VIRTUAL_KEYBOARD_ROWS,
    SPECIAL_CHARACTERS_ROW,
    DIACRITICS_ROW,
    ARABIC_QUESTION_MARK,
    TRANSLITERATION_TABLE,
    buildLetterForms
  };
}
