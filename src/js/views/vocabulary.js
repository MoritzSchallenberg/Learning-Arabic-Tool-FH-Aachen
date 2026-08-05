// Lektion 3: Grundwortschatz I (Karteikarten-Modus).
// Portiert das Grundprinzip aus dem alten script.py (play(), Zeilen 221-310): abwechselnd
// Wort/Definition abfragen, Levenshtein-Tippfehlererkennung, Schwierigkeit pro Fähigkeit
// anpassen (arabic_to_german, german_to_arabic) + optionale Selbsteinschätzung der
// Aussprache (Fähigkeit "pronunciation").
//
// P0.2: jede Karte läuft über einen ExerciseGuard (Mehrfachklick-Schutz + Timer-Aufräumung
// beim Verlassen der View). Die Aussprache-Selbsteinschätzung ist ein eigener, unabhängiger
// Einmal-Schritt danach (kein Timer, daher ein einfaches lokales "bereits bewertet"-Flag statt
// eines vollen Guards).

const VocabularyView = (() => {
  let categories = [];
  let allWords = [];
  let queue = [];
  let queueIndex = 0;
  let correctCount = 0;
  let activeGuard = null;

  function freshGuard() {
    if (activeGuard) activeGuard.destroy();
    activeGuard = ExerciseGuard.create();
    return activeGuard;
  }

  function wordDifficultyAverage(word) {
    const card = AppState.getCard(word.id);
    const a = card.difficulty.arabic_to_german ?? DEFAULT_DIFFICULTY;
    const g = card.difficulty.german_to_arabic ?? DEFAULT_DIFFICULTY;
    return (a + g) / 2;
  }

  function buildQueue(words) {
    const ids = words.map((w) => w.id);
    const sorted = sortByDifficultyShuffled(ids, (id) => wordDifficultyAverage(allWords.find((w) => w.id === id)));
    return sorted;
  }

  function renderCategoryPicker(container) {
    activeGuard = null;
    const options = categories.map((c) => `<option value="${c.id}">${c.title} (${c.words.length})</option>`).join('');
    container.innerHTML = `
      <div class="view">
        <h1>Grundwortschatz I</h1>
        <p class="lead">Wähle einen Themenbereich und übe Vokabeln in beide Richtungen (Arabisch → Deutsch und Deutsch → Arabisch).</p>
        <div class="card">
          <select id="vocab-category" class="text-input">
            <option value="__all__">Alle Themenbereiche (${allWords.length})</option>
            ${options}
          </select>
          <button class="btn" id="vocab-start" style="margin-top:12px;">Üben starten</button>
        </div>
      </div>
    `;
    container.querySelector('#vocab-start').addEventListener('click', () => {
      const value = container.querySelector('#vocab-category').value;
      const words = value === '__all__' ? allWords : categories.find((c) => c.id === value).words;
      startSession(words, container);
    });
  }

  function startSession(words, container) {
    queue = buildQueue(words);
    queueIndex = 0;
    correctCount = 0;
    renderCard(container);
  }

  function currentWord() {
    return allWords.find((w) => w.id === queue[queueIndex]);
  }

  function renderPronunciationRating(container, word) {
    let rated = false;
    const el = container.querySelector('#vocab-pronunciation-rating');
    el.innerHTML = `
      <p class="lead" style="margin-top:12px;">Aussprache gehört — wie war deine eigene Aussprache?</p>
      <div class="rating-buttons">
        <button class="btn secondary" data-result="correct">Richtig</button>
        <button class="btn secondary" data-result="typo">Nah dran</button>
        <button class="btn secondary" data-result="wrong">Falsch</button>
      </div>
    `;
    el.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (rated) return;
        rated = true;
        const card = AppState.getCard(word.id);
        adjustDifficulty(card, 'pronunciation', btn.dataset.result);
        AppState.persistProgress();
        el.innerHTML = '<p class="feedback correct">Danke, gespeichert.</p>';
      });
    });
  }

  function renderCard(container) {
    const guard = freshGuard();
    if (queueIndex >= queue.length) {
      guard.complete();
      container.innerHTML = `
        <div class="view">
          <h1>Durchgang abgeschlossen</h1>
          <p>Richtig: ${correctCount} / ${queue.length}</p>
          <button class="btn" id="vocab-back">Zurück zur Auswahl</button>
        </div>
      `;
      container.querySelector('#vocab-back').addEventListener('click', () => renderCategoryPicker(container));
      return;
    }

    const word = currentWord();
    const directionIsArabicToGerman = queueIndex % 2 === 0;
    const promptArabic = word.arabic;

    container.innerHTML = `
      <div class="view flashcard">
        <p class="lead">Karte ${queueIndex + 1} / ${queue.length}</p>
        <div class="card prompt">
          ${directionIsArabicToGerman
            ? `<p class="arabic-text large">${promptArabic}</p><button class="btn icon" id="vocab-speak">🔊</button>`
            : `<p class="mixed-text" style="font-size:1.4rem;">${word.german}</p>`}
        </div>
        <input type="text" id="vocab-input" class="text-input ${directionIsArabicToGerman ? '' : 'arabic-text'}" ${directionIsArabicToGerman ? '' : 'dir="rtl"'} placeholder="${directionIsArabicToGerman ? 'Deutsche Übersetzung eingeben' : 'Arabisches Wort eingeben'}" />
        <div id="vocab-keyboard"></div>
        <button class="btn" id="vocab-check" style="margin-top:12px;">Prüfen</button>
        <p id="vocab-feedback" class="feedback"></p>
        <div id="vocab-pronunciation-rating"></div>
        <p class="flashcard-progress">Richtig bisher: ${correctCount}</p>
      </div>
    `;

    const input = container.querySelector('#vocab-input');
    if (!directionIsArabicToGerman) {
      VirtualKeyboard.mount(container.querySelector('#vocab-keyboard'), input, { showDiacritics: true, showSpecial: true });
    }

    const speakBtn = container.querySelector('#vocab-speak');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => AudioPlayer.speak(word.arabic, 'ar-SA', { audioKey: `vocabulary/${word.id}` }).catch(() => {}));
    }

    container.querySelector('#vocab-check').addEventListener('click', () => {
      if (!guard.submit()) return;
      const skill = directionIsArabicToGerman ? 'arabic_to_german' : 'german_to_arabic';
      const result = directionIsArabicToGerman
        ? evaluateGermanAnswer(word.german, input.value.trim())
        : evaluateArabicAnswer(word.arabic, input.value.trim());

      const feedbackEl = container.querySelector('#vocab-feedback');
      const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics' || result === 'correct';
      if (isCorrect) {
        correctCount += 1;
        feedbackEl.textContent = result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!';
        feedbackEl.className = 'feedback correct';
      } else if (result === 'typo') {
        feedbackEl.textContent = 'Fast richtig — kleiner Tippfehler.';
        feedbackEl.className = 'feedback typo';
      } else {
        feedbackEl.textContent = `Falsch. Richtige Antwort: ${directionIsArabicToGerman ? word.german : word.arabic}`;
        feedbackEl.className = 'feedback wrong';
      }
      guard.showFeedback();

      const card = AppState.getCard(word.id);
      adjustDifficulty(card, skill, result);
      AppState.persistProgress();

      renderPronunciationRating(container, word);

      container.querySelector('#vocab-check').disabled = true;
      input.disabled = true;

      guard.transitioning();
      guard.setTimeout(() => {
        queueIndex += 1;
        renderCard(container);
      }, 1400);
    });
  }

  async function mount(container, lesson = 3) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    const pack = await AppState.getLanguagePack();
    categories = pack.vocabulary.categories.filter((c) => c.lesson === lesson);
    allWords = categories.flatMap((c) => c.words.map((w) => ({ ...w, categoryId: c.id })));
    renderCategoryPicker(container);
  }

  return { mount };
})();
