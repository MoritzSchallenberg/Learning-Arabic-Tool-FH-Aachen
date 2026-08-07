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

  // --- Neue kompakte Startansicht (Entwicklungsauftrag 5, Abschnitt 20) ----------------------
  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    return node;
  }

  function estimateMinutes(count) {
    return Math.max(1, Math.round(count * 0.5));
  }

  // Schnellstartkarten: kurze Erklärung + Anzahl verfügbarer Aufgaben + geschätzte Dauer,
  // direkter Start ohne Umweg über die erweiterte Auswahl.
  function quickStartDefs() {
    return [
      {
        title: 'Fällige Wiederholungen',
        description: 'Wörter und Buchstaben, die laut deinem Lernfortschritt gerade fällig sind.',
        apply: () => { resetFilters(); filters.dueOnly = true; }
      },
      {
        title: 'Schwierige Wörter',
        description: 'Inhalte mit hoher Schwierigkeit — mehr Übung lohnt sich hier besonders.',
        apply: () => { resetFilters(); filters.categories.letters = false; filters.categories.connections = false; filters.difficultOnly = true; }
      },
      {
        title: '5 Minuten üben',
        description: 'Eine kurze, gemischte Runde für zwischendurch.',
        apply: () => { resetFilters(); filters.count = 10; }
      },
      {
        title: 'Schreibtraining',
        description: 'Vokabeln und Buchstaben über die virtuelle Tastatur schreiben.',
        apply: () => { resetFilters(); filters.categories.connections = false; filters.keyboardLevel = 3; }
      },
      {
        title: 'Hörtraining',
        description: 'Wörter hören und die richtige Bedeutung erkennen.',
        apply: () => { resetFilters(); filters.categories.letters = false; filters.categories.connections = false; }
      },
      {
        title: 'Verbindungstrainer',
        description: 'Arabische Buchstabenverbindungen innerhalb von Wörtern üben.',
        apply: () => { resetFilters(); filters.categories.letters = false; filters.categories.vocabulary = false; }
      }
    ];
  }

  function renderChipGroup(wrap, options, isSelected, onToggle) {
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    options.forEach(({ key, label }) => {
      const chip = el('button', { className: `chip${isSelected(key) ? ' selected' : ''}`, text: label });
      chip.type = 'button';
      chip.addEventListener('click', () => {
        onToggle(key);
        renderChipGroup(wrap, options, isSelected, onToggle);
      });
      wrap.appendChild(chip);
    });
  }

  function summaryText() {
    const cats = Object.keys(filters.categories).filter((c) => filters.categories[c]).map((c) => PracticePool.CATEGORY_LABELS[c] || c);
    const parts = [`${filters.count} Aufgaben`, cats.length > 0 ? cats.join(' und ') : 'keine Inhalte ausgewählt'];
    parts.push(`Hilfestufe ${filters.helpLevel}`);
    parts.push(`ca. ${estimateMinutes(filters.count)} Minuten`);
    return parts.join(', ');
  }

  function renderFilters() {
    activeGuard = null;
    while (container.firstChild) container.removeChild(container.firstChild);
    const view = el('div', { className: 'view page-content' });
    view.appendChild(el('h1', { className: 'text-page-title', text: 'Frei üben' }));
    view.appendChild(el('p', { className: 'lead', text: 'Ein Klick auf eine Karte startet sofort — oder passe die Übung individuell an.' }));

    const quickGrid = el('div', { className: 'stat-card-grid' });
    quickStartDefs().forEach((def) => {
      const card = el('button', { className: 'stat-card' });
      card.type = 'button';
      card.style.textAlign = 'left';
      card.style.cursor = 'pointer';
      card.appendChild(el('p', { className: 'lead', text: def.title }));
      card.appendChild(el('p', { className: 'text-hint', text: def.description }));
      card.addEventListener('click', () => { def.apply(); startPractice(); });
      quickGrid.appendChild(card);
    });
    view.appendChild(quickGrid);

    const advancedToggle = el('button', { className: 'btn secondary', text: 'Übung anpassen' });
    advancedToggle.type = 'button';
    advancedToggle.style.marginTop = '16px';
    view.appendChild(advancedToggle);

    const advancedPanel = el('div', { className: 'card' });
    advancedPanel.style.display = 'none';
    advancedPanel.style.marginTop = '12px';

    advancedPanel.appendChild(el('p', { className: 'lead', text: 'Inhalte' }));
    const categoryChips = el('div', { className: 'chip-group' });
    advancedPanel.appendChild(categoryChips);

    advancedPanel.appendChild(el('p', { className: 'lead', text: 'Filter' }));
    const filterChips = el('div', { className: 'chip-group' });
    advancedPanel.appendChild(filterChips);

    const settingsRow = el('div', { className: 'action-bar-left' });
    settingsRow.style.marginTop = '12px';

    const countLabel = el('label', { text: 'Aufgaben: ' });
    const countSelect = document.createElement('select');
    countSelect.className = 'text-input';
    [5, 10, 15, 25, 40].forEach((n) => {
      const opt = document.createElement('option');
      opt.value = String(n);
      opt.textContent = String(n);
      if (n === filters.count) opt.selected = true;
      countSelect.appendChild(opt);
    });
    countLabel.appendChild(countSelect);

    const helpLabel = el('label', { text: 'Hilfestufe: ' });
    const helpSelect = document.createElement('select');
    helpSelect.className = 'text-input';
    HelpLevel.LEVELS.forEach((l) => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = `${l} — ${HelpLevel.HELP_LEVEL_CONFIG[l].label}`;
      if (l === filters.helpLevel) opt.selected = true;
      helpSelect.appendChild(opt);
    });
    helpLabel.appendChild(helpSelect);

    const keyboardLabel = el('label', { text: 'Tastaturstufe: ' });
    const keyboardSelect = document.createElement('select');
    keyboardSelect.className = 'text-input';
    [[1, '1 — stark geführt'], [2, '2 — leicht geführt'], [3, '3 — normal'], [4, '4 — selbstständig']].forEach(([val, label]) => {
      const opt = document.createElement('option');
      opt.value = String(val);
      opt.textContent = label;
      if (val === filters.keyboardLevel) opt.selected = true;
      keyboardSelect.appendChild(opt);
    });
    keyboardLabel.appendChild(keyboardSelect);

    settingsRow.appendChild(countLabel);
    settingsRow.appendChild(helpLabel);
    settingsRow.appendChild(keyboardLabel);
    advancedPanel.appendChild(settingsRow);

    const summary = el('p', { className: 'text-hint', text: summaryText() });
    advancedPanel.appendChild(summary);

    function refreshSummary() { summary.textContent = summaryText(); }

    const CATEGORY_OPTIONS = [
      { key: 'letters', label: 'Buchstaben' },
      { key: 'vocabulary', label: 'Vokabeln' },
      { key: 'connections', label: 'Verbindungen' }
    ];
    renderChipGroup(categoryChips, CATEGORY_OPTIONS, (key) => filters.categories[key], (key) => {
      filters.categories[key] = !filters.categories[key];
      refreshSummary();
    });

    const FILTER_OPTIONS = [
      { key: 'dueOnly', label: 'Fällig' },
      { key: 'difficultOnly', label: 'Schwierig' },
      { key: 'recentlyWrongOnly', label: 'Zuletzt falsch' },
      { key: 'newOnly', label: 'Neu' },
      { key: 'masteredOnly', label: 'Beherrscht' }
    ];
    renderChipGroup(filterChips, FILTER_OPTIONS, (key) => filters[key], (key) => {
      filters[key] = !filters[key];
      refreshSummary();
    });

    countSelect.addEventListener('change', () => { filters.count = Number(countSelect.value); refreshSummary(); });
    helpSelect.addEventListener('change', () => { filters.helpLevel = helpSelect.value; refreshSummary(); });
    keyboardSelect.addEventListener('change', () => { filters.keyboardLevel = Number(keyboardSelect.value); refreshSummary(); });

    const startBtn = el('button', { className: 'btn', text: 'Übung starten' });
    startBtn.type = 'button';
    startBtn.style.marginTop = '12px';
    startBtn.addEventListener('click', startPractice);
    advancedPanel.appendChild(startBtn);

    const emptyFeedback = el('p', { className: 'feedback' });
    advancedPanel.appendChild(emptyFeedback);
    container.__fpEmptyFeedback = emptyFeedback;

    advancedToggle.addEventListener('click', () => {
      advancedPanel.style.display = advancedPanel.style.display === 'none' ? 'block' : 'none';
    });

    view.appendChild(advancedPanel);
    container.appendChild(view);
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
      const advancedPanel = container.querySelector('.card');
      if (advancedPanel) advancedPanel.style.display = 'block';
      const feedbackEl = container.__fpEmptyFeedback;
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
