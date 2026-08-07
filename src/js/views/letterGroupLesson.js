// Wiederverwendbares View für die Buchstaben-Units 1-7 aus courses.json. Bildet alle 9 im
// Pflichtenheft genannten Lesson-Phasen ab: Einführung, Wiedererkennen, Zuordnen, Unterscheiden,
// Rekonstruieren (Verbindungstrainer), Geführte Eingabe, Selbstständige Produktion, Anwendung,
// Abschlussprüfung. Dieselbe View wird für jede Unit mit unterschiedlichen Buchstaben-IDs
// instanziiert — kein Code-Duplikat pro Unit.
//
// Hilfestufen-Regression (leichte Umsetzung des Pflichtenheft-Prinzips "Stufe zurückgehen bei
// Fehlern"): in der Selbstständigen Produktion und der Abschlussprüfung ist der Buchstaben-Hinweis
// zunächst ausgeblendet; nach zwei aufeinanderfolgenden Fehlversuchen wird er für den Rest des
// Durchlaufs automatisch eingeblendet (keine vollständige 5-stufige A-E-Zustandsmaschine, aber
// dasselbe Grundprinzip: bei Schwierigkeiten wird automatisch mehr Hilfe angeboten).
//
// P0.2 (zentrale Antwortsperre + Timer-Aufräumung): jede Aufgabe innerhalb einer Phase läuft
// über einen ExerciseGuard (exerciseGuard.js). guard.submit() lässt jede Aufgabe nur einmal
// auswerten (Schutz gegen Doppelklick), guard.setTimeout() statt rohem setTimeout() sorgt dafür,
// dass ein Phasenwechsel oder ein Verlassen der View (App.registerCleanup) keine verspäteten
// Callbacks mehr auslöst.

const LetterGroupLessonView = (() => {
  const PHASE_TITLES = {
    intro: 'Einführung',
    recognize: 'Wiedererkennen',
    match: 'Zuordnen',
    discriminate: 'Unterscheiden',
    connection: 'Rekonstruieren',
    guided: 'Geführte Eingabe',
    independent: 'Selbstständige Produktion',
    application: 'Anwendung',
    final_test: 'Abschlussprüfung'
  };
  const PHASES = [
    'intro', 'recognize', 'match', 'discriminate', 'connection',
    'guided', 'independent', 'application', 'final_test'
  ];
  const NEXT_UNIT = {
    unit_1: 'unit_2', unit_2: 'unit_3', unit_3: 'unit_4', unit_4: 'unit_5',
    unit_5: 'unit_6', unit_6: 'unit_7', unit_7: 'unit_8'
  };

  let unit = null;
  let letters = [];
  let allLetters = [];
  let vocabWords = [];
  let phaseIndex = 0;
  let container = null;
  let activeGuard = null;

  // Erzeugt einen frischen Guard für die aktuelle Phase/Aufgabe und zerstört einen eventuell
  // noch aktiven vorherigen Guard (z. B. beim Wechsel von einer Phase zur nächsten innerhalb
  // derselben View-Instanz — die DOM-Elemente der alten Phase werden ohnehin ersetzt, ihre
  // Timer/Klick-Sperren dürfen dann nicht mehr wirken).
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
    freshGuard();
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

  // renderTask(body, letter, guard, onDone) — guard gilt für die GESAMTE Phase (ein Guard pro
  // runLetterQueue()-Aufruf), guard.nextTask() wird vor jeder neuen Aufgabe aufgerufen, damit
  // guard.submit() für die nächste Aufgabe wieder true liefert.
  function runLetterQueue(renderTask) {
    const queue = pickRandomOrder(letters);
    let index = 0;
    const guard = freshGuard();

    function next(body) {
      if (index >= queue.length) {
        guard.complete();
        body.innerHTML = `<p class="feedback correct">Phase abgeschlossen.</p>`;
        return;
      }
      guard.nextTask();
      renderTask(body, queue[index], guard, () => {
        index += 1;
        next(body);
      });
    }

    const body = renderShell('');
    next(body);
  }

  function renderRecognize() {
    runLetterQueue((body, letter, guard, onDone) => {
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
          if (!guard.submit()) return;
          const correct = opt.id === letter.id;
          const feedbackEl = body.querySelector('#lg-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.name}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          guard.showFeedback();
          const card = AppState.getCard(`letter_${letter.id}`);
          adjustDifficulty(card, 'spelling', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          guard.transitioning();
          guard.setTimeout(onDone, 900);
        });
        optionsEl.appendChild(btn);
      });
    });
  }

  // Zuordnen: Klick-basiertes Zuordnungsspiel — Buchstabe anklicken, dann passenden Namen anklicken.
  function renderMatch() {
    const guard = freshGuard();
    const body = renderShell('');
    const letterOrder = pickRandomOrder(letters);
    const nameOrder = pickRandomOrder(letters);
    let selectedLetter = null;
    let selectedName = null;
    const matched = new Set();
    let feedbackText = '';
    let feedbackClass = '';

    function attemptMatch() {
      if (selectedLetter === null || selectedName === null) { renderBoard(); return; }
      if (!guard.submit()) return;
      guard.showFeedback();
      const card = AppState.getCard(`letter_${selectedLetter}`);
      if (selectedLetter === selectedName) {
        matched.add(selectedLetter);
        adjustDifficulty(card, 'matching', 'correct');
        AppState.persistProgress();
        feedbackText = matched.size === letters.length ? 'Alle Paare gefunden!' : 'Richtig!';
        feedbackClass = 'correct';
        selectedLetter = null;
        selectedName = null;
        guard.transitioning();
        guard.nextTask();
        renderBoard();
      } else {
        adjustDifficulty(card, 'matching', 'wrong');
        AppState.persistProgress();
        feedbackText = 'Kein Paar — versuch es erneut.';
        feedbackClass = 'wrong';
        guard.transitioning();
        renderBoard();
        guard.setTimeout(() => {
          selectedLetter = null;
          selectedName = null;
          feedbackText = '';
          feedbackClass = '';
          guard.nextTask();
          renderBoard();
        }, 700);
      }
    }

    function renderBoard() {
      body.innerHTML = `
        <p class="lead">Ordne jeden Buchstaben seinem Namen zu.</p>
        <div style="display:flex; gap:32px; justify-content:center; flex-wrap:wrap;">
          <div id="lg-match-letters" style="display:flex; flex-direction:column; gap:8px;"></div>
          <div id="lg-match-names" style="display:flex; flex-direction:column; gap:8px;"></div>
        </div>
        <p id="lg-match-feedback" class="feedback ${feedbackClass}">${feedbackText}</p>
      `;
      const lettersEl = body.querySelector('#lg-match-letters');
      letterOrder.forEach((l) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary arabic-text';
        btn.textContent = matched.has(l.id) ? `✓ ${l.letter}` : l.letter;
        btn.disabled = matched.has(l.id);
        if (selectedLetter === l.id) btn.style.borderColor = 'var(--color-accent)';
        btn.addEventListener('click', () => { selectedLetter = l.id; attemptMatch(); });
        lettersEl.appendChild(btn);
      });
      const namesEl = body.querySelector('#lg-match-names');
      nameOrder.forEach((l) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.textContent = matched.has(l.id) ? `✓ ${l.name}` : l.name;
        btn.disabled = matched.has(l.id);
        if (selectedName === l.id) btn.style.borderColor = 'var(--color-accent)';
        btn.addEventListener('click', () => { selectedName = l.id; attemptMatch(); });
        namesEl.appendChild(btn);
      });
      if (matched.size === letters.length) guard.complete();
    }

    renderBoard();
  }

  // Unterscheiden: wie Wiedererkennen, aber Distraktoren nur aus derselben Unit-Gruppe (ähnliche
  // Formen), da die Units bereits nach didaktischer Ähnlichkeit gruppiert sind.
  function renderDiscriminate() {
    runLetterQueue((body, letter, guard, onDone) => {
      let pool = letters.filter((l) => l.id !== letter.id);
      if (pool.length < 3) {
        const extra = pickRandomOrder(
          allLetters.filter((l) => l.id !== letter.id && !pool.some((p) => p.id === l.id))
        ).slice(0, 3 - pool.length);
        pool = [...pool, ...extra];
      }
      const distractors = pickRandomOrder(pool).slice(0, 3);
      const options = pickRandomOrder([letter, ...distractors]);
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Welcher Name gehört zu diesem Buchstaben? (Ähnliche Buchstaben zur Unterscheidung)</p>
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
          if (!guard.submit()) return;
          const correct = opt.id === letter.id;
          const feedbackEl = body.querySelector('#lg-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.name}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          guard.showFeedback();
          const card = AppState.getCard(`letter_${letter.id}`);
          adjustDifficulty(card, 'discrimination', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          guard.transitioning();
          guard.setTimeout(onDone, 900);
        });
        optionsEl.appendChild(btn);
      });
    });
  }

  function renderConnection() {
    freshGuard(); // zerstört einen evtl. noch offenen Guard der vorherigen Phase
    const body = renderShell('');
    ConnectionTrainer.mount(body, {
      word: { arabic: unit.demo_word, meaning: unit.demo_word_meaning },
      keyboardLetters: allLetters,
      onComplete: ({ correct, total }) => {
        body.innerHTML += `<p class="feedback correct">Verbindungstrainer abgeschlossen: ${correct}/${total} richtig.</p>`;
      }
    });
  }

  // Geführte Eingabe (immer mit Hinweis) und Selbstständige Produktion (Hinweis zunächst
  // ausgeblendet, nach 2 Fehlversuchen in Folge automatisch eingeblendet).
  function renderTypingPhase(mode) {
    let wrongStreak = 0;
    let hintUnlocked = mode === 'guided';
    runLetterQueue((body, letter, guard, onDone) => {
      const showHint = mode === 'guided' || hintUnlocked;
      body.innerHTML = `
        <div class="card">
          ${mode === 'independent' && hintUnlocked ? '<p class="feedback typo">Hinweis eingeblendet nach mehreren Fehlversuchen.</p>' : ''}
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
        if (!guard.submit()) return;
        const result = evaluateArabicAnswer(letter.letter, input.value.trim());
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        const feedbackEl = body.querySelector('#lg-feedback');
        feedbackEl.textContent = isCorrect ? 'Richtig!' : `Falsch. Richtig wäre: ${letter.letter}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        guard.showFeedback();
        const skill = mode === 'guided' ? 'guided_typing' : 'independent_typing';
        const card = AppState.getCard(`letter_${letter.id}`);
        adjustDifficulty(card, skill, isCorrect ? 'correct' : result);
        AppState.persistProgress();
        if (mode === 'independent') {
          wrongStreak = isCorrect ? 0 : wrongStreak + 1;
          if (wrongStreak >= 2) hintUnlocked = true;
        }
        guard.transitioning();
        guard.setTimeout(onDone, 900);
      });
    });
  }

  // Anwendung: "welches Wort enthält diesen Buchstaben?" — nutzt vorhandenes Vokabular, keine
  // neuen Sprachinhalte nötig.
  function findWordsContaining(letterChar) {
    return vocabWords.filter((w) => w.arabic.includes(letterChar));
  }

  function renderApplication() {
    const applicable = letters.filter((l) => findWordsContaining(l.letter).length > 0);
    if (applicable.length === 0) {
      freshGuard();
      renderShell('<p class="feedback">Keine Anwendungsaufgabe für diese Buchstaben verfügbar.</p>');
      return;
    }
    const guard = freshGuard();
    const queue = pickRandomOrder(applicable);
    let index = 0;
    const body = renderShell('');

    function next() {
      if (index >= queue.length) {
        guard.complete();
        body.innerHTML = `<p class="feedback correct">Phase abgeschlossen.</p>`;
        return;
      }
      guard.nextTask();
      const letter = queue[index];
      const matches = findWordsContaining(letter.letter);
      const correctWord = matches[Math.floor(Math.random() * matches.length)];
      const others = vocabWords.filter((w) => !w.arabic.includes(letter.letter));
      const distractors = pickRandomOrder(others).slice(0, 3);
      const options = pickRandomOrder([correctWord, ...distractors]);
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Welches Wort enthält den Buchstaben <span class="arabic-text">${letter.letter}</span> (${letter.name})?</p>
          <div class="rating-buttons" id="lg-app-options"></div>
          <p id="lg-app-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = body.querySelector('#lg-app-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary arabic-text';
        btn.textContent = `${opt.arabic} (${opt.german})`;
        btn.addEventListener('click', () => {
          if (!guard.submit()) return;
          const correct = opt.id === correctWord.id;
          const feedbackEl = body.querySelector('#lg-app-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${correctWord.arabic} (${correctWord.german})`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          guard.showFeedback();
          const card = AppState.getCard(`letter_${letter.id}`);
          adjustDifficulty(card, 'application', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          index += 1;
          guard.transitioning();
          guard.setTimeout(next, 900);
        });
        optionsEl.appendChild(btn);
      });
    }
    next();
  }

  // Abschlussprüfung: gemischtes Mini-Quiz (Wiedererkennen + Tippen) nur über die Buchstaben
  // dieser Unit, mit derselben Hilfe-Rückstufung wie in der Selbstständigen Produktion.
  function renderFinalTest() {
    const guard = freshGuard();
    let wrongStreak = 0;
    let hintUnlocked = false;
    const queue = pickRandomOrder(letters);
    let index = 0;
    let correctCount = 0;
    const body = renderShell('');

    function registerResult(isCorrect) {
      if (isCorrect) correctCount += 1;
      wrongStreak = isCorrect ? 0 : wrongStreak + 1;
      if (wrongStreak >= 2) hintUnlocked = true;
    }

    function next() {
      if (index >= queue.length) {
        guard.complete();
        const passed = correctCount / queue.length >= 0.6;
        body.innerHTML = `<p class="feedback ${passed ? 'correct' : 'wrong'}">Abschlussprüfung: ${correctCount} / ${queue.length} richtig.</p>`;
        return;
      }
      guard.nextTask();
      const letter = queue[index];
      const useMultipleChoice = index % 2 === 0;

      if (useMultipleChoice) {
        const pool = letters.filter((l) => l.id !== letter.id);
        const extra = pickRandomOrder(
          allLetters.filter((l) => l.id !== letter.id && !pool.some((p) => p.id === l.id))
        ).slice(0, Math.max(0, 3 - pool.length));
        const distractors = pickRandomOrder([...pool, ...extra]).slice(0, 3);
        const options = pickRandomOrder([letter, ...distractors]);
        body.innerHTML = `
          <div class="card flashcard">
            ${hintUnlocked ? '<p class="feedback typo">Hinweis: genau hinschauen, die Form ähnelt anderen Buchstaben dieser Unit.</p>' : ''}
            <p class="lead">Welcher Name gehört zu diesem Buchstaben?</p>
            <div class="arabic-text large">${letter.letter}</div>
            <div class="rating-buttons" id="lg-final-options"></div>
          </div>
        `;
        const optionsEl = body.querySelector('#lg-final-options');
        options.forEach((opt) => {
          const btn = document.createElement('button');
          btn.className = 'btn secondary';
          btn.textContent = opt.name;
          btn.addEventListener('click', () => {
            if (!guard.submit()) return;
            const correct = opt.id === letter.id;
            registerResult(correct);
            guard.showFeedback();
            const card = AppState.getCard(`letter_${letter.id}`);
            adjustDifficulty(card, 'final_test', correct ? 'correct' : 'wrong');
            AppState.persistProgress();
            index += 1;
            guard.transitioning();
            guard.setTimeout(next, 700);
          });
          optionsEl.appendChild(btn);
        });
      } else {
        body.innerHTML = `
          <div class="card">
            ${hintUnlocked ? `<p class="feedback typo">Hinweis: ${letter.letter}</p>` : ''}
            <p class="lead">Tippe den Buchstaben: ${letter.name}</p>
            <input type="text" id="lg-final-input" class="text-input arabic-text" dir="rtl" style="max-width:200px; margin:0 auto; display:block;" />
            <div id="lg-final-keyboard"></div>
            <button class="btn" id="lg-final-check" style="margin-top:12px;">Prüfen</button>
          </div>
        `;
        const input = body.querySelector('#lg-final-input');
        VirtualKeyboard.mount(body.querySelector('#lg-final-keyboard'), input, { showDiacritics: false, showSpecial: false });
        body.querySelector('#lg-final-check').addEventListener('click', () => {
          if (!guard.submit()) return;
          const result = evaluateArabicAnswer(letter.letter, input.value.trim());
          const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
          registerResult(isCorrect);
          guard.showFeedback();
          const card = AppState.getCard(`letter_${letter.id}`);
          adjustDifficulty(card, 'final_test', isCorrect ? 'correct' : result);
          AppState.persistProgress();
          index += 1;
          guard.transitioning();
          guard.setTimeout(next, 700);
        });
      }
    }
    next();
  }

  function renderCurrentPhase() {
    const phase = PHASES[phaseIndex];
    if (phase === 'intro') renderIntro();
    else if (phase === 'recognize') renderRecognize();
    else if (phase === 'match') renderMatch();
    else if (phase === 'discriminate') renderDiscriminate();
    else if (phase === 'connection') renderConnection();
    else if (phase === 'guided') renderTypingPhase('guided');
    else if (phase === 'independent') renderTypingPhase('independent');
    else if (phase === 'application') renderApplication();
    else if (phase === 'final_test') renderFinalTest();
  }

  // Entwicklungsauftrag 5, Abschnitt 17: Theorie auch für Schrift-Units — TheoryRenderer wird
  // (wo ein Theoriedokument existiert) VOR der bestehenden 9-Phasen-Lesson gezeigt, statt die
  // bisherige (weiterhin gültige) Phasenfolge selbst zu verändern. lesson.intro in lessons.json
  // bleibt bewusst eine kurze Ablaufbeschreibung, nicht die eigentliche Erklärung.
  function renderUnitTheory(theoryDoc) {
    freshGuard();
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    container.appendChild(wrapper);
    TheoryRenderer.mount(wrapper, theoryDoc, {
      getLetterById: (id) => allLetters.find((l) => l.id === id),
      onPlayAudio: (audioKey, text) => AudioPlayer.speak(text, 'ar-SA', { audioKey }).catch(() => {}),
      startLabel: 'Weiter zur Einführung',
      onStart: () => renderCurrentPhase()
    });
  }

  async function mount(el, unitId) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    const pack = await AppState.getLanguagePack();
    const course1 = pack.courses.courses.find((c) => c.id === 'course_1');
    unit = course1.units.find((u) => u.id === unitId);
    allLetters = pack.keyboard.letters;
    letters = unit.letters.map((id) => allLetters.find((l) => l.id === id));
    vocabWords = pack.vocabulary.categories.flatMap((c) => c.words);
    phaseIndex = 0;
    const theoryDoc = pack.theory && pack.theory.theories.find((t) => t.theory_id === `theory_${unitId}`);
    if (theoryDoc) renderUnitTheory(theoryDoc);
    else renderCurrentPhase();
  }

  return { mount };
})();
