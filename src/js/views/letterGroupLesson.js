// Wiederverwendbares View für die Buchstaben-Units 1-7 aus courses.json. Bildet eine
// vereinfachte, konkrete Version von 5 der 9 im Pflichtenheft genannten Lesson-Phasen ab
// (Einführung, Wiedererkennen, Verbindungstrainer, Geführte Eingabe, Selbstständige Eingabe) —
// dieselbe View wird für jede Unit mit unterschiedlichen Buchstaben-IDs instanziiert.

const LetterGroupLessonView = (() => {
  const PHASE_TITLES = {
    intro: 'Einführung',
    recognize: 'Wiedererkennen',
    connection: 'Verbindungstrainer',
    guided: 'Geführte Eingabe',
    independent: 'Selbstständige Eingabe'
  };
  const PHASES = ['intro', 'recognize', 'connection', 'guided', 'independent'];
  const NEXT_UNIT = {
    unit_1: 'unit_2', unit_2: 'unit_3', unit_3: 'unit_4', unit_4: 'unit_5',
    unit_5: 'unit_6', unit_6: 'unit_7', unit_7: 'unit_8'
  };

  let unit = null;
  let letters = [];
  let allLetters = [];
  let phaseIndex = 0;
  let container = null;

  function pickRandomOrder(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderShell(bodyHtml) {
    const phase = PHASES[phaseIndex];
    container.innerHTML = `
      <div class="view">
        <h1>${unit.title} — ${PHASE_TITLES[phase]}</h1>
        <p class="lead">${unit.goal}</p>
        <div id="lg-body">${bodyHtml}</div>
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn secondary" id="lg-back" ${phaseIndex === 0 ? 'disabled' : ''}>Zurück</button>
          <button class="btn" id="lg-next">${phaseIndex === PHASES.length - 1 ? 'Fertig' : 'Weiter'}</button>
        </div>
        <p class="flashcard-progress">Phase ${phaseIndex + 1} / ${PHASES.length}</p>
      </div>
    `;
    container.querySelector('#lg-back').addEventListener('click', () => {
      if (phaseIndex > 0) { phaseIndex -= 1; renderCurrentPhase(); }
    });
    container.querySelector('#lg-next').addEventListener('click', () => {
      if (phaseIndex < PHASES.length - 1) { phaseIndex += 1; renderCurrentPhase(); }
      else { App.navigateTo(NEXT_UNIT[unit.id] || 'unit_8'); }
    });
    return container.querySelector('#lg-body');
  }

  function renderIntro() {
    const rows = letters.map((l) => {
      const forms = buildLetterForms(l.letter, l.joining);
      return `
        <div class="card">
          <h2 class="arabic-text">${l.letter} — ${l.name}</h2>
          <p>${l.sound}</p>
          <table class="forms-table">
            <thead><tr><th>Isoliert</th><th>Anfang</th><th>Mitte</th><th>Ende</th></tr></thead>
            <tbody><tr>
              <td class="arabic-text">${forms.isolated}</td>
              <td class="arabic-text">${forms.initial}</td>
              <td class="arabic-text">${forms.medial}</td>
              <td class="arabic-text">${forms.final}</td>
            </tr></tbody>
          </table>
          <p>Beispiel: <span class="arabic-text">${l.example_word}</span> — ${l.example_meaning}
            <button class="btn icon" data-speak-key="letters/${l.id}" data-speak-text="${l.example_word}">🔊</button>
          </p>
        </div>
      `;
    }).join('');
    const body = renderShell(rows);
    body.querySelectorAll('[data-speak-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        AudioPlayer.speak(btn.dataset.speakText, 'ar-SA', { audioKey: btn.dataset.speakKey }).catch(() => {});
      });
    });
  }

  function runLetterQueue(renderTask) {
    const queue = pickRandomOrder(letters);
    let index = 0;

    function next(body) {
      if (index >= queue.length) {
        body.innerHTML = `<p class="feedback correct">Phase abgeschlossen.</p>`;
        return;
      }
      renderTask(body, queue[index], () => {
        index += 1;
        next(body);
      });
    }

    const body = renderShell('');
    next(body);
  }

  function renderRecognize() {
    runLetterQueue((body, letter, onDone) => {
      const distractors = pickRandomOrder(allLetters.filter((l) => l.id !== letter.id)).slice(0, 3);
      const options = pickRandomOrder([letter, ...distractors]);
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Welcher Name gehört zu diesem Buchstaben?</p>
          <div class="arabic-text large">${letter.letter}</div>
          <div class="rating-buttons" id="lg-options"></div>
          <p id="lg-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = body.querySelector('#lg-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.textContent = opt.name;
        btn.addEventListener('click', () => {
          const correct = opt.id === letter.id;
          const feedbackEl = body.querySelector('#lg-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.name}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          const card = AppState.getCard(`letter_${letter.id}`);
          adjustDifficulty(card, 'spelling', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          setTimeout(onDone, 900);
        });
        optionsEl.appendChild(btn);
      });
    });
  }

  function renderConnection() {
    const body = renderShell('');
    ConnectionTrainer.mount(body, {
      word: { arabic: unit.demo_word, meaning: unit.demo_word_meaning },
      keyboardLetters: allLetters,
      onComplete: ({ correct, total }) => {
        body.innerHTML += `<p class="feedback correct">Verbindungstrainer abgeschlossen: ${correct}/${total} richtig.</p>`;
      }
    });
  }

  function renderTypingPhase(showHint) {
    runLetterQueue((body, letter, onDone) => {
      body.innerHTML = `
        <div class="card">
          <p class="lead">${showHint ? `Tippe den Buchstaben: ${letter.name} (${letter.letter})` : `Tippe den Buchstaben: ${letter.name}`}</p>
          <input type="text" id="lg-input" class="text-input arabic-text" dir="rtl" style="max-width:200px; margin:0 auto; display:block;" />
          <div id="lg-keyboard"></div>
          <button class="btn" id="lg-check" style="margin-top:12px;">Prüfen</button>
          <p id="lg-feedback" class="feedback"></p>
        </div>
      `;
      const input = body.querySelector('#lg-input');
      VirtualKeyboard.mount(body.querySelector('#lg-keyboard'), input, { showDiacritics: false, showSpecial: false });
      body.querySelector('#lg-check').addEventListener('click', () => {
        const result = evaluateArabicAnswer(letter.letter, input.value.trim());
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        const feedbackEl = body.querySelector('#lg-feedback');
        feedbackEl.textContent = isCorrect ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.letter}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        const card = AppState.getCard(`letter_${letter.id}`);
        adjustDifficulty(card, showHint ? 'guided_typing' : 'independent_typing', isCorrect ? 'correct' : result);
        AppState.persistProgress();
        setTimeout(onDone, 900);
      });
    });
  }

  function renderCurrentPhase() {
    const phase = PHASES[phaseIndex];
    if (phase === 'intro') renderIntro();
    else if (phase === 'recognize') renderRecognize();
    else if (phase === 'connection') renderConnection();
    else if (phase === 'guided') renderTypingPhase(true);
    else if (phase === 'independent') renderTypingPhase(false);
  }

  async function mount(el, unitId) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    const course1 = pack.courses.courses.find((c) => c.id === 'course_1');
    unit = course1.units.find((u) => u.id === unitId);
    allLetters = pack.keyboard.letters;
    letters = unit.letters.map((id) => allLetters.find((l) => l.id === id));
    phaseIndex = 0;
    renderCurrentPhase();
  }

  return { mount };
})();
