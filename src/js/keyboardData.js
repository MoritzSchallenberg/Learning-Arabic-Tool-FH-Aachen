// Datenbasis für die virtuelle arabische Tastatur (Spec Kapitel 6.2/6.5) und die
// Transliterationstabelle (Spec Kapitel 6.4). Layout entspricht optisch der physischen
// arabischen 101-Tastatur (Windows-Standardbelegung): jede Zeile hier steht für eine
// physische Tastenreihe, in physischer Links-nach-rechts-Lesereihenfolge (wie z. B. bei
// Q W E R T Y U I O P). Damit das im Browser auch links-nach-rechts erscheint, MUSS die
// Tastatur mit `direction: ltr` gerendert werden (siehe style.css) — ein `direction: rtl` auf
// dem Container würde die DOM-Reihenfolge visuell umdrehen und die Tastatur spiegeln.
//
// NUMBER_ROW bildet die oberste physische Zahlenreihe ab (Taste links neben "1" = ذ, dann
// die zehn Ziffern-Tasten). Das ist zugleich die einzige Stelle, an der ذ auf einer echten
// Arabic-101-Tastatur liegt — es gehört zu keiner der drei Buchstabenreihen darunter.

const NUMBER_ROW = ['ذ', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'];

const VIRTUAL_KEYBOARD_ROWS = [
  NUMBER_ROW,
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ']
];

// Nur die Zeichen, die NICHT bereits in VIRTUAL_KEYBOARD_ROWS vorkommen (Shift-Ebene der
// Hamza-Grundformen mit Alif). Vorher enthielt diese Liste auch ء/ؤ/ئ/ة/ى/لا erneut, obwohl
// die bereits in der vierten Buchstabenreihe stehen — das erzeugte doppelt angezeigte Tasten.
const SPECIAL_CHARACTERS_ROW = ['أ', 'إ', 'آ'];

const DIACRITICS_ROW = ['َ', 'ِ', 'ُ', 'ْ', 'ّ', 'ً', 'ٍ', 'ٌ'];

const PUNCTUATION_ROW = ['،', '؛', '؟'];
const ARABIC_QUESTION_MARK = '؟'; // beibehalten für Rückwärtskompatibilität einzelner Aufrufer

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

// Name-Hinweise für ARIA-Labels der virtuellen Tastatur (nicht für Lerninhalte, nur
// Barrierefreiheit — dieselben deutschen Kurznamen wie in keyboard.json/language.json).
const KEY_NAME_HINTS = {
  'ا': 'Alif', 'ب': 'Bāʾ', 'ت': 'Tāʾ', 'ث': 'Thāʾ', 'ج': 'Jīm', 'ح': 'Ḥāʾ', 'خ': 'Khāʾ',
  'د': 'Dāl', 'ذ': 'Dhāl', 'ر': 'Rāʾ', 'ز': 'Zāy', 'س': 'Sīn', 'ش': 'Shīn', 'ص': 'Ṣād',
  'ض': 'Ḍād', 'ط': 'Ṭāʾ', 'ظ': 'Ẓāʾ', 'ع': 'ʿAyn', 'غ': 'Ghayn', 'ف': 'Fāʾ', 'ق': 'Qāf',
  'ك': 'Kāf', 'ل': 'Lām', 'م': 'Mīm', 'ن': 'Nūn', 'ه': 'Hāʾ', 'و': 'Wāw', 'ي': 'Yāʾ',
  'أ': 'Alif mit Hamza oben', 'إ': 'Alif mit Hamza unten', 'آ': 'Alif mit Madda',
  'ء': 'Hamza', 'ؤ': 'Wāw mit Hamza', 'ئ': 'Yāʾ mit Hamza', 'ة': 'Tāʾ marbūṭa',
  'ى': 'Alif maqṣūra', 'لا': 'Lām-Alif',
  'َ': 'Fatha', 'ِ': 'Kasra', 'ُ': 'Damma', 'ْ': 'Sukūn', 'ّ': 'Schadda',
  'ً': 'Tanwīn Fatḥ', 'ٍ': 'Tanwīn Kasr', 'ٌ': 'Tanwīn Damm',
  '١': 'Ziffer 1', '٢': 'Ziffer 2', '٣': 'Ziffer 3', '٤': 'Ziffer 4', '٥': 'Ziffer 5',
  '٦': 'Ziffer 6', '٧': 'Ziffer 7', '٨': 'Ziffer 8', '٩': 'Ziffer 9', '٠': 'Ziffer 0',
  '،': 'Arabisches Komma', '؛': 'Arabisches Semikolon', '؟': 'Arabisches Fragezeichen'
};

function keyNameHint(ch) {
  return KEY_NAME_HINTS[ch] || null;
}

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
    NUMBER_ROW,
    VIRTUAL_KEYBOARD_ROWS,
    SPECIAL_CHARACTERS_ROW,
    DIACRITICS_ROW,
    PUNCTUATION_ROW,
    ARABIC_QUESTION_MARK,
    TRANSLITERATION_TABLE,
    KEY_NAME_HINTS,
    keyNameHint,
    buildLetterForms
  };
}
