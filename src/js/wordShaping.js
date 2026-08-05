// Berechnet die Kontextform (isoliert/Anfang/Mitte/Ende) jedes Buchstabens in einem Wort,
// rein aus der Buchstaben-Sequenz und dem 'joining'-Typ (dual/right, aus keyboard.json).
// Reine Anwendung der Unicode-Verbindungsregeln, kein Sprachwissen nötig — Grundlage für den
// Verbindungstrainer (Spec-Kapitel 7). Die eigentliche Glyphen-Darstellung übernimmt weiterhin
// die Schrift-Engine (Chromium); hier wird nur die Kategorie für pädagogische Zwecke ermittelt.
// Nutzt das bereits in keyboardData.js global definierte TATWEEL (U+0640) — keine Neudeklaration,
// um eine doppelte 'const'-Deklaration im globalen Skript-Scope zu vermeiden.

/**
 * @param {Array<{id: string, letter: string, joining: 'dual'|'right'}>} letters - in Lesereihenfolge
 * @returns {Array<{id: string, letter: string, shape: 'isolated'|'initial'|'medial'|'final', displayForm: string}>}
 */
function shapeWord(letters) {
  return letters.map((entry, i) => {
    const prev = letters[i - 1];
    const connectsFromPrev = i > 0 && prev.joining === 'dual';
    const connectsToNext = i < letters.length - 1 && entry.joining === 'dual';

    let shape;
    if (!connectsFromPrev && !connectsToNext) shape = 'isolated';
    else if (!connectsFromPrev && connectsToNext) shape = 'initial';
    else if (connectsFromPrev && !connectsToNext) shape = 'final';
    else shape = 'medial';

    let displayForm;
    if (shape === 'isolated') displayForm = entry.letter;
    else if (shape === 'initial') displayForm = entry.letter + TATWEEL;
    else if (shape === 'final') displayForm = TATWEEL + entry.letter;
    else displayForm = TATWEEL + entry.letter + TATWEEL;

    return { id: entry.id, letter: entry.letter, shape, displayForm };
  });
}

const SHAPE_LABELS_DE = {
  isolated: 'isoliert',
  initial: 'Anfangsform',
  medial: 'Mittelform',
  final: 'Endform'
};

/**
 * Zerlegt ein Wort (nur Grundbuchstaben, keine Diakritika/ة/ء/Ligaturen) in die
 * keyboard.json-Buchstaben-Einträge. Gibt null zurück, wenn ein Zeichen nicht zu den 28
 * Grundbuchstaben gehört (z. B. ة, ء, لا) — der Verbindungstrainer nutzt dann bewusst nur
 * Wörter, die ausschließlich aus den 28 Grundbuchstaben bestehen.
 */
function lettersFromWord(plainText, keyboardLetters) {
  const byChar = new Map(keyboardLetters.map((l) => [l.letter, l]));
  const result = [];
  for (const ch of plainText) {
    const entry = byChar.get(ch);
    if (!entry) return null;
    result.push(entry);
  }
  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { shapeWord, lettersFromWord, SHAPE_LABELS_DE };
}
