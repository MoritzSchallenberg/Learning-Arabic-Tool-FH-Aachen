// Freier Übungsmodus (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 19). Nutzt
// practicePool.js (was ist übbar?) + reviewScheduler.js (was ist fällig/schwierig?) auf den
// aktuell vorhandenen Inhalten (28 Buchstaben, 141 Vokabeln, daraus ableitbare
// Verbindungstrainer-Wörter) — funktioniert schon jetzt, ohne auf die Vokabel-Erweiterung auf
// 900 Einträge (Meilenstein E) zu warten.

const FreePracticeView = (() => {
  let container = null;
  let pack = null;
  let pool = [];
  let activeGuard = null;
  let queue = [];
  let index = 0;
  let correctCount = 0;
  let helpLevelState = null;

  const filters = {
    categories: { letters: true, vocabulary: true, connections: true },
    dueOnly: false,
    difficultOnly: false,
    recentlyWrongOnly: false,
    newOnly: false,
    masteredOnly: false,
    count: 15,
    helpLevel: 'C',
    keyboardLevel: 3,
    showDiacritics: true,
    showTransliteration: true
  };

  function freshGuard() {
    if (activeGuard) activeGuard.destroy();
    activeGuard = ExerciseGuard.create();
    return activeGuard;
  }

  function pickRandomOrder(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function filteredPool() {
    const now = new Date();
    return pool.filter((item) => {
      if (!filters.categories[item.category]) return false;
      const card = AppState.getCard(item.cardId);
      const attempted = ReviewScheduler.hasBeenAttempted(card, item.skill);
      const difficulty = (card.difficulty && card.difficulty[item.skill]) ?? DEFAULT_DIFFICULTY;
      const consecutiveWrong = (card.consecutiveWrong && card.consecutiveWrong[item.skill]) || 0;

      if (filters.newOnly && attempted) return false;
      if (filters.masteredOnly && (!attempted || difficulty > 3.5)) return false;
      if (filters.dueOnly && !ReviewScheduler.isOverdue(card, item.skill, now)) return false;
      if (filters.difficultOnly && difficulty < 6.5) return false;
      if (filters.recentlyWrongOnly && consecutiveWrong < 1) return false;
      return true;
    });
  }

  function renderFilters() {
    activeGuard = null;
    container.innerHTML = `
      <div class="view">
        <h1>Frei üben</h1>
        <p class="lead">Stelle dir eine eigene Übungsrunde zusammen — aus Buchstaben, Vokabeln und Verbindungsübungen.</p>

        <div class="card">
          <p class="lead" style="margin-top:0;">Schnellzugriffe</p>
          <div class="rating-buttons" id="fp-quick"></div>
        </div>

        <div class="card">
          <p class="lead" style="margin-top:0;">Inhalte</p>
          <label><input type="checkbox" id="fp-cat-letters" checked /> Buchstaben</label><br/>
          <label><input type="checkbox" id="fp-cat-vocabulary" checked /> Vokabeln</label><br/>
          <label><input type="checkbox" id="fp-cat-connections" checked /> Verbindungen</label>
        </div>

        <div class="card">
          <p class="lead" style="margin-top:0;">Filter</p>
          <label><input type="checkbox" id="fp-due" /> nur fällige Wiederholungen</label><br/>
          <label><input type="checkbox" id="fp-difficult" /> nur schwierige</label><br/>
          <label><input type="checkbox" id="fp-recent-wrong" /> zuletzt falsch beantwortet</label><br/>
          <label><input type="checkbox" id="fp-new" /> nur neue (noch nicht geübte)</label><br/>
          <label><input type="checkbox" id="fp-mastered" /> nur bereits gut beherrschte</label>
        </div>

        <div class="card">
          <p class="lead" style="margin-top:0;">Einstellungen</p>
          <label>Anzahl Aufgaben:
            <select id="fp-count" class="text-input" style="width:auto; display:inline-block;">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15" selected>15</option>
              <option value="25">25</option>
              <option value="40">40</option>
            </select>
          </label><br/>
          <label>Hilfestufe:
            <select id="fp-help-level" class="text-input" style="width:auto; display:inline-block;">
              ${HelpLevel.LEVELS.map((l) => `<option value="${l}" ${l === 'C' ? 'selected' : ''}>${l} — ${HelpLevel.HELP_LEVEL_CONFIG[l].label}</option>`).join('')}
            </select>
          </label><br/>
          <label>Tastaturstufe:
            <select id="fp-keyboard-level" class="text-input" style="width:auto; display:inline-block;">
              <option value="1">1 — stark geführt</option>
              <option value="2">2 — leicht geführt</option>
              <option value="3" selected>3 — normal</option>
              <option value="4">4 — selbstständig</option>
            </select>
          </label>
        </div>

        <button class="btn" id="fp-start">Los geht's</button>
        <p id="fp-empty-feedback" class="feedback"></p>
      </div>
    `;

    const quickWrap = container.querySelector('#fp-quick');
    const quickAccessButtons = [
      { label: '5-Minuten-Wiederholung', apply: () => { resetFilters(); filters.dueOnly = true; filters.count = 10; } },
      { label: 'Fällige Wörter', apply: () => { resetFilters(); filters.categories.letters = false; filters.categories.connections = false; filters.dueOnly = true; } },
      { label: 'Schwierige Wörter', apply: () => { resetFilters(); filters.categories.letters = false; filters.categories.connections = false; filters.difficultOnly = true; } },
      { label: 'Schreibtraining', apply: () => { resetFilters(); filters.categories.connections = false; filters.keyboardLevel = 3; } },
      { label: 'Verbindungstrainer', apply: () => { resetFilters(); filters.categories.letters = false; filters.categories.vocabulary = false; } }
    ];
    quickAccessButtons.forEach((qa) => {
      const btn = document.createElement('button');
      btn.className = 'btn secondary';
      btn.textContent = qa.label;
      btn.addEventListener('click', () => {
        qa.apply();
        startPractice();
      });
      quickWrap.appendChild(btn);
    });

    container.querySelector('#fp-start').addEventListener('click', () => {
      filters.categories.letters = container.querySelector('#fp-cat-letters').checked;
      filters.categories.vocabulary = container.querySelector('#fp-cat-vocabulary').checked;
      filters.categories.connections = container.querySelector('#fp-cat-connections').checked;
      filters.dueOnly = container.querySelector('#fp-due').checked;
      filters.difficultOnly = container.querySelector('#fp-difficult').checked;
      filters.recentlyWrongOnly = container.querySelector('#fp-recent-wrong').checked;
      filters.newOnly = container.querySelector('#fp-new').checked;
      filters.masteredOnly = container.querySelector('#fp-mastered').checked;
      filters.count = Number(container.querySelector('#fp-count').value);
      filters.helpLevel = container.querySelector('#fp-help-level').value;
      filters.keyboardLevel = Number(container.querySelector('#fp-keyboard-level').value);
      startPractice();
    });
  }

  function resetFilters() {
    filters.categories.letters = true;
    filters.categories.vocabulary = true;
    filters.categories.connections = true;
    filters.dueOnly = false;
    filters.difficultOnly = false;
    filters.recentlyWrongOnly = false;
    filters.newOnly = false;
    filters.masteredOnly = false;
    filters.count = 15;
    filters.helpLevel = 'C';
    filters.keyboardLevel = 3;
  }

  function startPractice() {
    const candidates = pickRandomOrder(filteredPool()).slice(0, filters.count);
    if (candidates.length === 0) {
      renderFilters();
      const feedbackEl = container.querySelector('#fp-empty-feedback');
      if (feedbackEl) {
        feedbackEl.textContent = 'Keine passenden Aufgaben mit dieser Filterkombination gefunden — bitte Filter lockern.';
        feedbackEl.className = 'feedback wrong';
      }
      return;
    }
    queue = candidates;
    index = 0;
    correctCount = 0;
    helpLevelState = HelpLevel.create(filters.helpLevel);
    renderTask();
  }

  function renderShell(bodyHtml) {
    container.innerHTML = `
      <div class="view">
        <h1>Frei üben</h1>
        <p class="flashcard-progress">Aufgabe ${index + 1} / ${queue.length} — Hilfestufe ${helpLevelState.currentLevel()}</p>
        <div id="fp-body">${bodyHtml}</div>
      </div>
    `;
    return container.querySelector('#fp-body');
  }

  function registerResultAndAdvance(guard, item, resultCategory, isCorrect) {
    const card = AppState.getCard(item.cardId);
    adjustDifficulty(card, item.skill, resultCategory);
    AppState.persistProgress();
    if (isCorrect) correctCount += 1;
    helpLevelState.registerResult(isCorrect);
    index += 1;
    guard.transitioning();
    guard.setTimeout(renderTask, 900);
  }

  function renderLetterTask(item, guard) {
    const letter = item.data;
    const body = renderShell('');
    if (item.skill === 'spelling') {
      const distractors = pickRandomOrder(pack.keyboard.letters.filter((l) => l.id !== letter.id)).slice(0, 3);
      const options = pickRandomOrder([letter, ...distractors]);
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Welcher Name gehört zu diesem Buchstaben?</p>
          <div class="arabic-text large">${letter.letter}</div>
          <div class="rating-buttons" id="fp-options"></div>
          <p id="fp-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = body.querySelector('#fp-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.textContent = opt.name;
        btn.addEventListener('click', () => {
          if (!guard.submit()) return;
          const correct = opt.id === letter.id;
          const feedbackEl = body.querySelector('#fp-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.name}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          guard.showFeedback();
          registerResultAndAdvance(guard, item, correct ? 'correct' : 'wrong', correct);
        });
        optionsEl.appendChild(btn);
      });
    } else {
      const showHint = item.skill === 'guided_typing' || helpLevelState.config().keyboardLevel <= 2;
      body.innerHTML = `
        <div class="card">
          <p class="lead">${showHint ? `Tippe den Buchstaben: ${letter.name} (${letter.letter})` : `Tippe den Buchstaben: ${letter.name}`}</p>
          <input type="text" id="fp-input" class="text-input arabic-text" dir="rtl" style="max-width:200px; margin:0 auto; display:block;" />
          <div id="fp-keyboard"></div>
          <button class="btn" id="fp-check" style="margin-top:12px;">Prüfen</button>
          <p id="fp-feedback" class="feedback"></p>
        </div>
      `;
      const input = body.querySelector('#fp-input');
      VirtualKeyboard.mount(body.querySelector('#fp-keyboard'), input, {
        showDiacritics: false, showSpecial: false,
        keyboardLevel: filters.keyboardLevel, expectedWord: letter.letter
      });
      body.querySelector('#fp-check').addEventListener('click', () => {
        if (!guard.submit()) return;
        const result = evaluateArabicAnswer(letter.letter, input.value.trim());
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        const feedbackEl = body.querySelector('#fp-feedback');
        feedbackEl.textContent = isCorrect ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.letter}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        guard.showFeedback();
        registerResultAndAdvance(guard, item, isCorrect ? 'correct' : result, isCorrect);
      });
    }
  }

  function renderVocabTask(item, guard) {
    const word = item.data;
    const body = renderShell('');
    const arabicToGerman = item.skill === 'arabic_to_german';
    const config = helpLevelState.config();

    body.innerHTML = `
      <div class="card flashcard">
        ${arabicToGerman
          ? `<p class="arabic-text large">${word.arabic}</p><button class="btn icon" id="fp-speak">🔊</button>`
          : `<p class="mixed-text" style="font-size:1.3rem;">${word.german}</p>`}
        ${!arabicToGerman && config.showTransliteration ? `<p class="mixed-text" style="color:var(--color-text-muted);">${word.transliteration || ''}</p>` : ''}
        <input type="text" id="fp-input" class="text-input ${arabicToGerman ? '' : 'arabic-text'}" ${arabicToGerman ? '' : 'dir="rtl"'} style="max-width:320px; margin:12px auto 0; display:block;" />
        <div id="fp-keyboard"></div>
        <button class="btn" id="fp-check" style="margin-top:12px;">Prüfen</button>
        <p id="fp-feedback" class="feedback"></p>
      </div>
    `;
    const input = body.querySelector('#fp-input');
    if (!arabicToGerman) {
      VirtualKeyboard.mount(body.querySelector('#fp-keyboard'), input, {
        showDiacritics: filters.showDiacritics, showSpecial: true,
        keyboardLevel: filters.keyboardLevel, expectedWord: word.arabic
      });
    }
    const speakBtn = body.querySelector('#fp-speak');
    if (speakBtn) speakBtn.addEventListener('click', () => AudioPlayer.speak(word.arabic, 'ar-SA', { audioKey: `vocabulary/${word.id}` }).catch(() => {}));

    body.querySelector('#fp-check').addEventListener('click', () => {
      if (!guard.submit()) return;
      const result = arabicToGerman
        ? evaluateGermanAnswer(word.german, input.value.trim())
        : evaluateArabicAnswer(word.arabic, input.value.trim());
      const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics' || result === 'correct';
      const feedbackEl = body.querySelector('#fp-feedback');
      feedbackEl.textContent = isCorrect
        ? 'Richtig!'
        : `Nicht ganz. Richtig wäre: ${arabicToGerman ? word.german : word.arabic}`;
      feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
      guard.showFeedback();
      registerResultAndAdvance(guard, item, result, isCorrect);
    });
  }

  function renderConnectionTask(item, guard) {
    const body = renderShell('');
    ConnectionTrainer.mount(body, {
      word: { arabic: item.data.word.arabic, meaning: item.data.word.german },
      keyboardLetters: pack.keyboard.letters,
      types: ['assemble'],
      skipDemo: true,
      onComplete: ({ correct, total }) => {
        guard.complete();
        index += 1;
        helpLevelState.registerResult(correct === total);
        setTimeout(renderTask, 400);
      }
    });
  }

  function renderDone() {
    activeGuard = null;
    container.innerHTML = `
      <div class="view">
        <h1>Frei üben — fertig</h1>
        <p>Richtig: ${correctCount} / ${queue.length}</p>
        <button class="btn" id="fp-again">Neue Runde einstellen</button>
      </div>
    `;
    container.querySelector('#fp-again').addEventListener('click', renderFilters);
  }

  function renderTask() {
    if (index >= queue.length) { renderDone(); return; }
    const guard = freshGuard();
    const item = queue[index];
    if (item.category === 'letters') renderLetterTask(item, guard);
    else if (item.category === 'vocabulary') renderVocabTask(item, guard);
    else if (item.category === 'connections') renderConnectionTask(item, guard);
  }

  /**
   * @param {HTMLElement} el
   * @param {object} [options]
   * @param {Partial<typeof filters>} [options.presetFilters] - z. B. { dueOnly: true } für einen
   *   Direktstart aus der Startseite ("Heute weiterlernen")
   * @param {boolean} [options.autoStart=false] - wenn true, wird sofort mit den presetFilters
   *   gestartet, statt die Filter-Auswahl anzuzeigen
   */
  async function mount(el, options = {}) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    pack = await AppState.getLanguagePack();
    pool = PracticePool.buildPool(pack);

    if (options.presetFilters) {
      resetFilters();
      Object.assign(filters, options.presetFilters);
      if (options.presetFilters.categories) {
        Object.assign(filters.categories, options.presetFilters.categories);
      }
    }

    if (options.autoStart) {
      startPractice();
    } else {
      renderFilters();
    }
  }

  return { mount };
})();
