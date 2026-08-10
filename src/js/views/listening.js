// Lektion 5: Aussprache und Hörverständnis I (Spec-Kapitel "Lektion 5").
//
// Angepasst an die vorhandenen Daten/Werkzeuge (V1 hat weder Bild- noch Satzdaten, und
// isolierte Buchstaben werden von Text-to-Speech oft unzuverlässig ausgesprochen — siehe
// dieselbe Entscheidung bereits in alphabet.js). Umgesetzt werden 2 der 6 in der Spec
// genannten Aufgabentypen, jeweils auf Wortebene (verlässlich mit TTS möglich):
//   - "gesprochenes Wort einer Übersetzung zuordnen" (Multiple-Choice)
//   - "gehörtes Wort schreiben" (Diktat), mit den Stufen 1 ("Audio mit sichtbarer
//     Umschrift") und 3 ("Audio ohne Hilfen") aus der Spec als Umschrift-an/aus-Option.
// Stufe 2 (Audio mit möglichen Antworten) entspricht der Multiple-Choice-Aufgabe.
// Stufe 4 (Audio in einem vollständigen Satz) und bildbasierte Aufgaben fehlen mangels
// Satz-/Bilddaten und folgen in einer späteren Version.
// "Langsame und normale Aussprache vergleichen": über die 🔊/🐢-Buttons abgedeckt.
//
// P0.2: jede Aufgabe läuft über einen ExerciseGuard (Mehrfachklick-Schutz + Timer-Aufräumung
// beim Verlassen der View).

const ListeningView = (() => {
  let categories = [];
  let allWords = [];
  let exerciseType = 'recognize'; // 'recognize' | 'dictation'
  let showTranscriptionHint = true;
  let queue = [];
  let queueIndex = 0;
  let correctCount = 0;
  let activeGuard = null;

  function freshGuard() {
    if (activeGuard) activeGuard.destroy();
    activeGuard = ExerciseGuard.create();
    return activeGuard;
  }

  function wordListeningDifficulty(word) {
    const card = AppState.getCard(word.id);
    return card.difficulty.listening ?? DEFAULT_DIFFICULTY;
  }

  function buildQueue(words) {
    const ids = words.map((w) => w.id);
    return sortByDifficultyShuffled(ids, (id) => wordListeningDifficulty(allWords.find((w) => w.id === id)));
  }

  function renderPicker(container) {
    activeGuard = null;
    const options = categories.map((c) => `<option value="${c.id}">${c.title} (${c.words.length})</option>`).join('');
    container.innerHTML = `
      <div class="view">
        <h1>Aussprache und Hörverständnis I</h1>
        <p class="lead">Höre ein arabisches Wort und erkenne oder schreibe es. Die Schwierigkeit wird für die Fähigkeit „Hörverständnis" separat von Lesen/Schreiben verfolgt.</p>
        <div class="card">
          <label>Übungstyp:</label><br/>
          <select id="listening-type" class="text-input" style="margin-bottom:12px;">
            <option value="recognize">Gehörtes Wort einer Übersetzung zuordnen</option>
            <option value="dictation">Diktat — gehörtes Wort schreiben</option>
          </select>
          <div id="listening-dictation-options" style="display:none; margin-bottom:12px;">
            <label>
              <input type="checkbox" id="listening-show-hint" checked />
              Umschrift als Hilfe anzeigen (Stufe 1) — ausschalten für „ohne Hilfen" (Stufe 3)
            </label>
          </div>
          <label>Themenbereich:</label><br/>
          <select id="listening-category" class="text-input" style="margin-bottom:12px;">
            <option value="__all__">Alle Themenbereiche (${allWords.length})</option>
            ${options}
          </select>
          <button class="btn" id="listening-start">Üben starten</button>
        </div>
      </div>
    `;

    const typeSelect = container.querySelector('#listening-type');
    const dictationOptions = container.querySelector('#listening-dictation-options');
    typeSelect.addEventListener('change', () => {
      dictationOptions.style.display = typeSelect.value === 'dictation' ? 'block' : 'none';
    });

    container.querySelector('#listening-start').addEventListener('click', () => {
      exerciseType = typeSelect.value;
      showTranscriptionHint = container.querySelector('#listening-show-hint').checked;
      const categoryValue = container.querySelector('#listening-category').value;
      const words = categoryValue === '__all__' ? allWords : categories.find((c) => c.id === categoryValue).words;
      startSession(words, container);
    });
  }

  function startSession(words, container) {
    queue = buildQueue(words);
    queueIndex = 0;
    correctCount = 0;
    renderExercise(container);
  }

  function currentWord() {
    return allWords.find((w) => w.id === queue[queueIndex]);
  }

  function playWord(word, slow) {
    return AudioPlayer.speakWord(word, { slow, context: 'Hörverständnis' });
  }

  function multipleChoiceOptions(correctWord) {
    const options = [correctWord];
    const pool = allWords.filter((w) => w.id !== correctWord.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (const w of pool) {
      if (options.length >= 4) break;
      options.push(w);
    }
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }

  function finishCard(guard, word, resultCategory, container) {
    const card = AppState.getCard(word.id);
    adjustDifficulty(card, 'listening', resultCategory);
    AppState.persistProgress();
    const isCorrect = resultCategory === 'correct_full' || resultCategory === 'correct_no_diacritics' || resultCategory === 'correct';
    if (isCorrect) correctCount += 1;
    queueIndex += 1;
    guard.transitioning();
    guard.setTimeout(() => renderExercise(container), 1200);
  }

  function renderDone(guard, container) {
    guard.complete();
    container.innerHTML = `
      <div class="view">
        <h1>Durchgang abgeschlossen</h1>
        <p>Richtig: ${correctCount} / ${queue.length}</p>
        <button class="btn" id="listening-back">Zurück zur Auswahl</button>
      </div>
    `;
    container.querySelector('#listening-back').addEventListener('click', () => renderPicker(container));
  }

  function renderExercise(container) {
    const guard = freshGuard();
    if (queueIndex >= queue.length) {
      renderDone(guard, container);
      return;
    }
    const word = currentWord();
    const settings = AppState.getSettings();

    if (exerciseType === 'recognize') {
      const options = multipleChoiceOptions(word);
      container.innerHTML = `
        <div class="view flashcard">
          <p class="lead">Aufgabe ${queueIndex + 1} / ${queue.length} — Welche Übersetzung passt zum gehörten Wort?</p>
          <button class="btn icon" id="listening-play" aria-label="Normal abspielen">🔊</button>
          <button class="btn icon" id="listening-play-slow" aria-label="Langsam abspielen">🐢</button>
          <div class="rating-buttons" id="listening-options" style="margin-top:16px;"></div>
          <p id="listening-feedback" class="feedback"></p>
        </div>
      `;
      const playBtn = container.querySelector('#listening-play');
      const playSlowBtn = container.querySelector('#listening-play-slow');
      playBtn.addEventListener('click', () => AudioPlayer.speakWord(word, { context: 'Hörverständnis', button: playBtn }));
      playSlowBtn.addEventListener('click', () => AudioPlayer.speakWord(word, { slow: true, context: 'Hörverständnis', button: playSlowBtn }));
      const optionsEl = container.querySelector('#listening-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.textContent = opt.german;
        btn.addEventListener('click', () => {
          if (!guard.submit()) return;
          const correct = opt.id === word.id;
          const feedbackEl = container.querySelector('#listening-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${word.german}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          guard.showFeedback();
          finishCard(guard, word, correct ? 'correct' : 'wrong', container);
        });
        optionsEl.appendChild(btn);
      });
      if (settings.autoPlayWord) playWord(word, false);
    } else {
      container.innerHTML = `
        <div class="view flashcard">
          <p class="lead">Aufgabe ${queueIndex + 1} / ${queue.length} — Schreibe das gehörte Wort.</p>
          <button class="btn icon" id="listening-play" aria-label="Normal abspielen">🔊</button>
          <button class="btn icon" id="listening-play-slow" aria-label="Langsam abspielen">🐢</button>
          ${showTranscriptionHint ? `<p class="mixed-text" style="margin-top:12px; color:var(--color-text-muted);">Umschrift: ${word.transliteration}</p>` : ''}
          <input type="text" id="listening-input" class="text-input arabic-text" dir="rtl" style="max-width:320px; margin:16px auto 0; display:block;" />
          <div id="listening-keyboard"></div>
          <button class="btn" id="listening-check" style="margin-top:12px;">Prüfen</button>
          <p id="listening-feedback" class="feedback"></p>
        </div>
      `;
      const playBtn = container.querySelector('#listening-play');
      const playSlowBtn = container.querySelector('#listening-play-slow');
      playBtn.addEventListener('click', () => AudioPlayer.speakWord(word, { context: 'Hörverständnis', button: playBtn }));
      playSlowBtn.addEventListener('click', () => AudioPlayer.speakWord(word, { slow: true, context: 'Hörverständnis', button: playSlowBtn }));
      const input = container.querySelector('#listening-input');
      VirtualKeyboard.mount(container.querySelector('#listening-keyboard'), input, { showDiacritics: true, showSpecial: true });
      container.querySelector('#listening-check').addEventListener('click', () => {
        if (!guard.submit()) return;
        const result = evaluateArabicAnswer(word.arabic, input.value.trim());
        const feedbackEl = container.querySelector('#listening-feedback');
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        feedbackEl.textContent = isCorrect
          ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
          : `Nicht ganz. Richtig wäre: ${word.arabic}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        guard.showFeedback();
        input.disabled = true;
        container.querySelector('#listening-check').disabled = true;
        finishCard(guard, word, result, container);
      });
      if (settings.autoPlayWord) playWord(word, false);
    }
  }

  async function mount(container) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    const pack = await AppState.getLanguagePack();
    categories = pack.vocabulary.categories;
    allWords = categories.flatMap((c) => c.words.map((w) => ({ ...w, categoryId: c.id })));
    renderPicker(container);
  }

  return { mount };
})();
