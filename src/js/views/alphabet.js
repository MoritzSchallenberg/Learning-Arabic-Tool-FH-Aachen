// Lektion 2: Das arabische Alphabet (Spec-Kapitel "Lektion 2").
// V1 implementiert 2 von 6 in der Spec genannten Übungstypen: Buchstaben erkennen
// (Multiple-Choice) und Buchstaben auf der virtuellen Tastatur eingeben.

const AlphabetView = (() => {
  let letters = [];
  let mode = 'overview'; // 'overview' | 'exercise'
  let selectedLetterId = null;
  let exerciseQueue = [];
  let exerciseIndex = 0;
  let exerciseCorrectCount = 0;

  function renderOverview(container) {
    const selected = letters.find((l) => l.id === selectedLetterId) || letters[0];
    const forms = buildLetterForms(selected.letter, selected.joining);

    const grid = letters.map((l) => `
      <div class="letter-tile" data-id="${l.id}">
        <div class="big-letter">${l.letter}</div>
        <div>${l.name}</div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="view">
        <h1>Das arabische Alphabet</h1>
        <p class="lead">Klicke auf einen Buchstaben, um Formen, Aussprache und ein Beispielwort zu sehen.</p>
        <div class="letter-grid">${grid}</div>

        <div class="card">
          <h2 class="arabic-text">${selected.letter} — ${selected.name}</h2>
          <p>${selected.sound}</p>
          <table class="forms-table">
            <thead><tr><th>Isoliert</th><th>Anfang</th><th>Mitte</th><th>Ende</th></tr></thead>
            <tbody>
              <tr>
                <td class="arabic-text">${forms.isolated}</td>
                <td class="arabic-text">${forms.initial}</td>
                <td class="arabic-text">${forms.medial}</td>
                <td class="arabic-text">${forms.final}</td>
              </tr>
            </tbody>
          </table>
          ${selected.joining === 'right' ? '<p class="lead">Dieser Buchstabe verbindet sich nicht mit dem folgenden Buchstaben — Anfangs- und Mittelform sehen daher wie die isolierte bzw. Endform aus.</p>' : ''}
          <p>Beispiel: <span class="arabic-text">${selected.example_word}</span> — ${selected.example_meaning}</p>
          <button class="btn icon" id="alphabet-speak">🔊</button>
        </div>

        <button class="btn" id="alphabet-start-exercise">Übung starten</button>
      </div>
    `;

    container.querySelectorAll('.letter-tile').forEach((tile) => {
      tile.addEventListener('click', () => {
        selectedLetterId = tile.dataset.id;
        renderOverview(container);
      });
    });

    container.querySelector('#alphabet-speak').addEventListener('click', () => {
      AudioPlayer.speak(selected.example_word, 'ar-SA', { audioKey: `letters/${selected.id}` }).catch(() => {});
    });

    container.querySelector('#alphabet-start-exercise').addEventListener('click', () => {
      startExercise(container);
    });
  }

  function buildExerciseQueue() {
    const ids = letters.map((l) => l.id);
    return sortByDifficultyShuffled(ids, (id) => AppState.getCard(`letter_${id}`).difficulty.spelling);
  }

  function startExercise(container) {
    mode = 'exercise';
    exerciseQueue = buildExerciseQueue();
    exerciseIndex = 0;
    exerciseCorrectCount = 0;
    renderExercise(container);
  }

  function multipleChoiceOptions(correctLetter) {
    const options = [correctLetter];
    const pool = letters.filter((l) => l.id !== correctLetter.id);
    for (let i = pool.length - 1; i > 0 && options.length < 4; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (const l of pool) {
      if (options.length >= 4) break;
      options.push(l);
    }
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
  }

  function finishExercise(letterId, skill, resultCategory, container) {
    const card = AppState.getCard(`letter_${letterId}`);
    adjustDifficulty(card, skill, resultCategory);
    AppState.persistProgress();
    if (resultCategory === 'correct_full' || resultCategory === 'correct_no_diacritics' || resultCategory === 'correct') {
      exerciseCorrectCount += 1;
    }
    exerciseIndex += 1;
    setTimeout(() => renderExercise(container), 700);
  }

  function renderExerciseDone(container) {
    container.innerHTML = `
      <div class="view">
        <h1>Übung abgeschlossen</h1>
        <p>Richtig: ${exerciseCorrectCount} / ${exerciseQueue.length}</p>
        <button class="btn" id="alphabet-back-overview">Zurück zur Übersicht</button>
      </div>
    `;
    container.querySelector('#alphabet-back-overview').addEventListener('click', () => {
      mode = 'overview';
      renderOverview(container);
    });
  }

  function renderExercise(container) {
    if (exerciseIndex >= exerciseQueue.length) {
      renderExerciseDone(container);
      return;
    }
    const letterId = exerciseQueue[exerciseIndex];
    const letter = letters.find((l) => l.id === letterId);
    const useMultipleChoice = exerciseIndex % 2 === 0;

    if (useMultipleChoice) {
      const options = multipleChoiceOptions(letter);
      container.innerHTML = `
        <div class="view flashcard">
          <p class="lead">Aufgabe ${exerciseIndex + 1} / ${exerciseQueue.length} — Welcher Name gehört zu diesem Buchstaben?</p>
          <div class="arabic-text large">${letter.letter}</div>
          <div class="rating-buttons" id="alphabet-options"></div>
          <p id="alphabet-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = container.querySelector('#alphabet-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.textContent = opt.name;
        btn.addEventListener('click', () => {
          const correct = opt.id === letter.id;
          const feedbackEl = container.querySelector('#alphabet-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.name}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          finishExercise(letter.id, 'spelling', correct ? 'correct' : 'wrong', container);
        });
        optionsEl.appendChild(btn);
      });
    } else {
      container.innerHTML = `
        <div class="view flashcard">
          <p class="lead">Aufgabe ${exerciseIndex + 1} / ${exerciseQueue.length} — Tippe den Buchstaben: ${letter.name}</p>
          <input type="text" id="alphabet-input" class="text-input arabic-text" dir="rtl" style="max-width:200px; margin:0 auto; display:block;" />
          <div id="alphabet-keyboard"></div>
          <button class="btn" id="alphabet-check">Prüfen</button>
          <p id="alphabet-feedback" class="feedback"></p>
        </div>
      `;
      const input = container.querySelector('#alphabet-input');
      VirtualKeyboard.mount(container.querySelector('#alphabet-keyboard'), input, { showDiacritics: false, showSpecial: false });
      container.querySelector('#alphabet-check').addEventListener('click', () => {
        const result = evaluateArabicAnswer(letter.letter, input.value.trim());
        const feedbackEl = container.querySelector('#alphabet-feedback');
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        feedbackEl.textContent = isCorrect ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.letter}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        finishExercise(letter.id, 'spelling', isCorrect ? 'correct' : result, container);
      });
    }
  }

  async function mount(container) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    letters = pack.keyboard.letters;
    selectedLetterId = letters[0].id;
    mode = 'overview';
    renderOverview(container);
  }

  return { mount };
})();
