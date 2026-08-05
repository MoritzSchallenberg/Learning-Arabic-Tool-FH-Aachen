// Berechnet einen groben Fortschritts-Status je Lektion/Unit für die Farbpunkte in der
// Seitenleiste: 'not_started' (grau), 'in_progress' (gelb), 'passed' (grün), 'failed' (rot).
// Für karten-basierte Lektionen wird der Durchschnitt aller bislang erfassten
// Schwierigkeitswerte über die relevanten Karten gebildet; für reine Tutorials/die Prüfung
// (keine Karten) werden die in state.js gepflegten Lesson-Flags verwendet.

const LessonProgress = (() => {
  const PASSED_THRESHOLD = 3.5; // Schwierigkeit <= 3.5 im Schnitt gilt als "bestanden"
  const FAILED_THRESHOLD = 6.5; // Schwierigkeit >= 6.5 im Schnitt gilt als "falsch gemacht"
  const FLAG_BASED_KEYS = new Set(['onboarding', 'keyboard_tutorial', 'review_exam']);

  function aggregateCardStatus(cardIds) {
    if (cardIds.length === 0) return 'not_started';
    let attempted = 0;
    let sum = 0;
    let count = 0;
    for (const id of cardIds) {
      const card = AppState.getCard(id);
      const values = Object.values(card.difficulty || {});
      if (values.length > 0) {
        attempted += 1;
        sum += values.reduce((a, b) => a + b, 0);
        count += values.length;
      }
    }
    if (attempted === 0) return 'not_started';
    if (attempted < cardIds.length) return 'in_progress';
    const avg = sum / count;
    if (avg <= PASSED_THRESHOLD) return 'passed';
    if (avg >= FAILED_THRESHOLD) return 'failed';
    return 'in_progress';
  }

  function flagStatus(key) {
    const flag = AppState.getLessonFlag(key);
    if (!flag) return 'not_started';
    if (flag.status === 'started') return 'in_progress';
    if (flag.meta && typeof flag.meta.correct === 'number' && typeof flag.meta.total === 'number' && flag.meta.total > 0) {
      return flag.meta.correct / flag.meta.total >= 0.6 ? 'passed' : 'failed';
    }
    return 'passed';
  }

  function wordsByLesson(pack, lessonNumber) {
    return pack.vocabulary.categories
      .filter((c) => c.lesson === lessonNumber)
      .flatMap((c) => c.words.map((w) => w.id));
  }

  function cardIdsForKey(key, pack) {
    if (/^unit_[1-7]$/.test(key)) {
      const course1 = pack.courses.courses.find((c) => c.id === 'course_1');
      const unit = course1.units.find((u) => u.id === key);
      return unit.letters.map((id) => `letter_${id}`);
    }
    switch (key) {
      case 'unit_8':
        return pack.language.diacritics.slice(0, 5).map((d) => `diacritic_${d.name}`);
      case 'unit_9':
        return pack.language.special_characters.map((s) => `special_char_${s.symbol}`);
      case 'unit_10': {
        const course1 = pack.courses.courses.find((c) => c.id === 'course_1');
        const flagshipPlain = normalizeArabic(course1.connection_trainer_flagship_word);
        return [...pack.keyboard.letters.map((l) => `letter_${l.id}`), `connection_${flagshipPlain}`];
      }
      case 'vocabulary_1':
        return wordsByLesson(pack, 3);
      case 'vocabulary_2':
        return wordsByLesson(pack, 6);
      case 'vocabulary_advanced':
        return wordsByLesson(pack, 8);
      case 'listening_1':
        return pack.vocabulary.categories.flatMap((c) => c.words.map((w) => w.id));
      case 'grammar_1': {
        const pronouns = pack.grammar.sections.find((s) => s.id === 'personal_pronouns').pronouns.map((p) => `pronoun_${p.id}`);
        const family = pack.vocabulary.categories.find((c) => c.id === 'family').words.map((w) => `demonstrative_${w.id}`);
        const foodDrink = pack.vocabulary.categories.find((c) => c.id === 'food_drink').words.map((w) => w.id);
        return [...pronouns, ...family, ...foodDrink];
      }
      case 'grammar_2': {
        const verbs = ['ana', 'anta', 'anti', 'huwa', 'hiya', 'nahnu'].map((k) => `verb_kataba_${k}`);
        const conjunctions = pack.grammar2.sections.find((s) => s.id === 'conjunctions').conjunctions.map((c) => `conjunction_${c.id}`);
        return [...verbs, ...conjunctions];
      }
      case 'grammar_advanced':
        return pack.vocabulary.categories.find((c) => c.id === 'family').words.map((w) => `relative_${w.id}`);
      case 'reading_writing':
        return [
          ...pack.reading.sentences.map((s) => `reading_${s.id}`),
          ...pack.reading.reorder_sentence_ids.map((id) => `reading_order_${id}`)
        ];
      default:
        return null;
    }
  }

  function getStatus(key, pack) {
    if (FLAG_BASED_KEYS.has(key)) return flagStatus(key);
    const ids = cardIdsForKey(key, pack);
    if (!ids) return flagStatus(key);
    return aggregateCardStatus(ids);
  }

  return { getStatus };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LessonProgress;
}
