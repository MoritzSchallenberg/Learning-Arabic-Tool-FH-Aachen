// Unit 10: Wörter sicher lesen und schreiben (Konsolidierung von Kurs 1). Kombiniert eine
// gemischte, schwierigkeitsgewichtete Übung über alle 28 Buchstaben mit einem abschließenden
// Verbindungstrainer-Durchlauf am Kurs-1-Leitwort.

const Unit10View = (() => {
  let container = null;
  let phase = 0; // 0 = Buchstaben-Mix, 1 = Verbindungstrainer, 2 = fertig
  let letters = [];
  let queue = [];
  let index = 0;
  let correctCount = 0;
  let flagshipWord = null;

  function pickRandomOrder(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function multipleChoiceOptions(correctLetter) {
    const distractors = pickRandomOrder(letters.filter((l) => l.id !== correctLetter.id)).slice(0, 3);
    return pickRandomOrder([correctLetter, ...distractors]);
  }

  function renderMixDone() {
    container.innerHTML = `
      <div class="view">
        <h1>Unit 10: Wörter sicher lesen und schreiben</h1>
        <p>Buchstaben-Übung abgeschlossen: ${correctCount} / ${queue.length} richtig.</p>
        <button class="btn" id="u10-to-connection">Weiter zum Verbindungstrainer</button>
      </div>
    `;
    container.querySelector('#u10-to-connection').addEventListener('click', () => {
      phase = 1;
      renderConnectionPhase();
    });
  }

  function renderMixTask() {
    if (index >= queue.length) {
      renderMixDone();
      return;
    }
    const letter = queue[index];
    const useMultipleChoice = index % 2 === 0;

    container.innerHTML = `
      <div class="view">
        <h1>Unit 10: Wörter sicher lesen und schreiben</h1>
        <p class="lead">Gemischte Übung — Aufgabe ${index + 1} / ${queue.length}</p>
        <div id="u10-task"></div>
      </div>
    `;
    const taskEl = container.querySelector('#u10-task');

    if (useMultipleChoice) {
      const options = multipleChoiceOptions(letter);
      taskEl.innerHTML = `
        <div class="card flashcard">
          <div class="arabic-text large">${letter.letter}</div>
          <div class="rating-buttons" id="u10-options"></div>
          <p id="u10-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = taskEl.querySelector('#u10-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.textContent = opt.name;
        btn.addEventListener('click', () => {
          const correct = opt.id === letter.id;
          if (correct) correctCount += 1;
          const feedbackEl = taskEl.querySelector('#u10-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.name}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          const card = AppState.getCard(`letter_${letter.id}`);
          adjustDifficulty(card, 'spelling', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          index += 1;
          setTimeout(renderMixTask, 900);
        });
        optionsEl.appendChild(btn);
      });
    } else {
      taskEl.innerHTML = `
        <div class="card">
          <p>Tippe den Buchstaben: ${letter.name}</p>
          <input type="text" id="u10-input" class="text-input arabic-text" dir="rtl" style="max-width:200px;" />
          <div id="u10-keyboard"></div>
          <button class="btn" id="u10-check" style="margin-top:12px;">Prüfen</button>
          <p id="u10-feedback" class="feedback"></p>
        </div>
      `;
      const input = taskEl.querySelector('#u10-input');
      VirtualKeyboard.mount(taskEl.querySelector('#u10-keyboard'), input, { showDiacritics: false, showSpecial: false });
      taskEl.querySelector('#u10-check').addEventListener('click', () => {
        const result = evaluateArabicAnswer(letter.letter, input.value.trim());
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        if (isCorrect) correctCount += 1;
        const feedbackEl = taskEl.querySelector('#u10-feedback');
        feedbackEl.textContent = isCorrect ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.letter}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        const card = AppState.getCard(`letter_${letter.id}`);
        adjustDifficulty(card, 'independent_typing', isCorrect ? 'correct' : result);
        AppState.persistProgress();
        index += 1;
        setTimeout(renderMixTask, 900);
      });
    }
  }

  function renderConnectionPhase() {
    container.innerHTML = `
      <div class="view">
        <h1>Unit 10 — Abschluss-Verbindungstrainer</h1>
        <div id="u10-connection"></div>
      </div>
    `;
    ConnectionTrainer.mount(container.querySelector('#u10-connection'), {
      word: flagshipWord,
      keyboardLetters: letters,
      onComplete: ({ correct, total }) => {
        phase = 2;
        renderFinal(correct, total);
      }
    });
  }

  function renderFinal(connCorrect, connTotal) {
    container.innerHTML = `
      <div class="view">
        <h1>Kurs 1 abgeschlossen 🎉</h1>
        <p>Buchstaben-Übung: ${correctCount} / ${queue.length} richtig.</p>
        <p>Verbindungstrainer: ${connCorrect} / ${connTotal} richtig.</p>
        <button class="btn" id="u10-continue">Weiter zu Kurs 2</button>
      </div>
    `;
    container.querySelector('#u10-continue').addEventListener('click', () => {
      App.navigateTo('vocabulary_1');
    });
  }

  async function mount(el) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    letters = pack.keyboard.letters;
    const course1 = pack.courses.courses.find((c) => c.id === 'course_1');
    flagshipWord = { arabic: course1.connection_trainer_flagship_word, meaning: course1.connection_trainer_flagship_meaning };

    const ids = letters.map((l) => l.id);
    const ordered = sortByDifficultyShuffled(ids, (id) => AppState.getCard(`letter_${id}`).difficulty.spelling);
    queue = ordered.map((id) => letters.find((l) => l.id === id));
    index = 0;
    correctCount = 0;
    phase = 0;
    renderMixTask();
  }

  return { mount };
})();
