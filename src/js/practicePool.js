// Baut aus dem geladenen Sprachpaket eine einheitliche Liste aller aktuell übbaren
// { cardId, skill, category } - Paare (Entwicklungsauftrag 3, Meilenstein B — Grundlage für den
// freien Übungsmodus und künftig auch für Startseiten-Zusammenfassungen). Bewusst unabhängig von
// realer Vokabel-Migration/-Erweiterung (Meilenstein D/E) — arbeitet mit dem, was JETZT existiert
// (28 Buchstaben, 141 Vokabeln, daraus ableitbare Verbindungstrainer-Wörter).

const PracticePool = (() => {
  const LETTER_SKILLS = ['spelling', 'guided_typing', 'independent_typing'];
  const VOCAB_SKILLS = ['arabic_to_german', 'german_to_arabic'];

  function buildPool(pack) {
    const items = [];

    for (const letter of pack.keyboard.letters) {
      for (const skill of LETTER_SKILLS) {
        items.push({
          cardId: `letter_${letter.id}`,
          skill,
          category: 'letters',
          label: `${letter.letter} (${letter.name})`,
          data: letter
        });
      }
    }

    const words = pack.vocabulary.categories.flatMap((c) => c.words);
    for (const word of words) {
      for (const skill of VOCAB_SKILLS) {
        items.push({
          cardId: word.id,
          skill,
          category: 'vocabulary',
          label: word.german,
          data: word
        });
      }
    }

    for (const word of words) {
      const plain = normalizeArabic(word.arabic);
      const letters = lettersFromWord(plain, pack.keyboard.letters);
      if (letters) {
        items.push({
          cardId: `connection_${plain}`,
          skill: 'connection',
          category: 'connections',
          label: word.german,
          data: { word, letters }
        });
      }
    }

    return items;
  }

  const CATEGORY_LABELS = {
    letters: 'Buchstaben',
    vocabulary: 'Vokabeln',
    connections: 'Verbindungen'
  };

  return { buildPool, CATEGORY_LABELS, LETTER_SKILLS, VOCAB_SKILLS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PracticePool;
}
