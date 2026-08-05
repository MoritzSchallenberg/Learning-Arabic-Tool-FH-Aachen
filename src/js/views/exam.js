// Lektion 11: Wiederholung und Prüfung (Spec-Kapitel "Lektion 11").
// Mischt zufällig Aufgaben aus allen bisherigen Bereichen (Buchstaben, Vokabular aus den
// Lektionen 3/6/8, Grammatik-Pronomen), gewichtet nach bestehender Schwierigkeit — schwache
// Bereiche kommen häufiger dran (sortByDifficultyShuffled, dieselbe Logik wie in den
// einzelnen Lektionen). Reine Rekombination bereits geprüfter Inhalte, keine neue Grammatik.

const ExamView = (() => {
  const EXAM_LENGTH = 20;
  let container = null;
  let queue = [];
  let index = 0;
  let scoreByArea = {};

  function pickRandomOrder(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildMultipleChoice(correctText, pool, poolTextFn, count = 4) {
    const distractors = pickRandomOrder(pool.filter((p) => poolTextFn(p) !== correctText)).slice(0, count - 1);
    const options = [{ text: correctText, correct: true }, ...distractors.map((d) => ({ text: poolTextFn(d), correct: false }))];
    return pickRandomOrder(options);
  }

  function buildLetterQuestions(letters) {
    return letters.map((letter) => ({
      area: 'Buchstaben',
      cardId: `letter_${letter.id}`,
      skill: 'spelling',
      promptArabic: letter.letter,
      options: buildMultipleChoice(letter.name, letters, (l) => l.name)
    }));
  }

  function buildVocabQuestions(words) {
    return words.map((word) => ({
      area: 'Vokabular',
      cardId: word.id,
      skill: 'arabic_to_german',
      promptArabic: word.arabic,
      options: buildMultipleChoice(word.german, words, (w) => w.german)
    }));
  }

  function buildPronounQuestions(pronouns) {
    return pronouns.map((p) => ({
      area: 'Grammatik',
      cardId: `pronoun_${p.id}`,
      skill: 'grammar',
      promptGerman: p.german,
      optionsArabic: buildMultipleChoice(p.arabic, pronouns, (x) => x.arabic)
    }));
  }

  function getDifficultyForQuestion(q) {
    const card = AppState.getCard(q.cardId);
    return card.difficulty[q.skill] ?? DEFAULT_DIFFICULTY;
  }

  function renderDone() {
    const areas = ['Buchstaben', 'Vokabular', 'Grammatik'];
    const rows = areas
      .filter((a) => scoreByArea[a])
      .map((a) => `<tr><td>${a}</td><td>${scoreByArea[a].correct} / ${scoreByArea[a].total}</td></tr>`)
      .join('');
    const totalCorrect = Object.values(scoreByArea).reduce((sum, s) => sum + s.correct, 0);
    const totalCount = Object.values(scoreByArea).reduce((sum, s) => sum + s.total, 0);
    AppState.markLessonCompleted('review_exam', { correct: totalCorrect, total: totalCount });

    container.innerHTML = `
      <div class="view">
        <h1>Prüfung abgeschlossen</h1>
        <p class="lead">Richtig: ${totalCorrect} / ${totalCount}</p>
        <table class="forms-table"><thead><tr><th>Bereich</th><th>Ergebnis</th></tr></thead><tbody>${rows}</tbody></table>
        <button class="btn" id="exam-back" style="margin-top:16px;">Zurück zur Übersicht</button>
      </div>
    `;
    container.querySelector('#exam-back').addEventListener('click', () => App.navigateToStatistics());
  }

  function recordAnswer(q, correct) {
    if (!scoreByArea[q.area]) scoreByArea[q.area] = { correct: 0, total: 0 };
    scoreByArea[q.area].total += 1;
    if (correct) scoreByArea[q.area].correct += 1;

    const card = AppState.getCard(q.cardId);
    adjustDifficulty(card, q.skill, correct ? 'correct' : 'wrong');
    AppState.persistProgress();
  }

  function renderQuestion() {
    if (index >= queue.length) {
      renderDone();
      return;
    }
    const q = queue[index];
    const isArabicPrompt = !!q.promptArabic;
    const options = q.options || q.optionsArabic;

    container.innerHTML = `
      <div class="view flashcard">
        <p class="lead">Frage ${index + 1} / ${queue.length} (${q.area})</p>
        ${isArabicPrompt
          ? `<p class="arabic-text large">${q.promptArabic}</p>`
          : `<p class="mixed-text" style="font-size:1.4rem;">${q.promptGerman}</p>`}
        <div class="rating-buttons" id="exam-options" style="${isArabicPrompt ? '' : 'direction:rtl;'}"></div>
        <p id="exam-feedback" class="feedback"></p>
      </div>
    `;
    const optionsEl = container.querySelector('#exam-options');
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'btn secondary' + (isArabicPrompt ? '' : ' arabic-text');
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        const feedbackEl = container.querySelector('#exam-feedback');
        feedbackEl.textContent = opt.correct ? 'Richtig!' : 'Falsch.';
        feedbackEl.className = 'feedback ' + (opt.correct ? 'correct' : 'wrong');
        recordAnswer(q, opt.correct);
        index += 1;
        setTimeout(renderQuestion, 900);
      });
      optionsEl.appendChild(btn);
    });
  }

  async function mount(el) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    AppState.markLessonStarted('review_exam');
    const pack = await AppState.getLanguagePack();

    const letters = pack.keyboard.letters;
    const words = pack.vocabulary.categories.flatMap((c) => c.words);
    const pronouns = pack.grammar.sections.find((s) => s.id === 'personal_pronouns').pronouns;

    const pool = [
      ...buildLetterQuestions(letters),
      ...buildVocabQuestions(words),
      ...buildPronounQuestions(pronouns)
    ];

    const orderedIds = sortByDifficultyShuffled(
      pool.map((_, i) => i),
      (i) => getDifficultyForQuestion(pool[i])
    );
    queue = orderedIds.slice(0, EXAM_LENGTH).map((i) => pool[i]);

    index = 0;
    scoreByArea = {};
    renderQuestion();
  }

  return { mount };
})();
