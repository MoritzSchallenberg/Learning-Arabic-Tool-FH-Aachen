// Verbindungstrainer (Spec-Kapitel 7). Eigenständige, wiederverwendbare Komponente, die ein
// Wort als Parameter bekommt (kein eigener Lektionsschlüssel). Nutzt wordShaping.js für die
// Formen-Berechnung. Nur Wörter aus den 28 Grundbuchstaben werden unterstützt (keine ة/ء/لا) —
// siehe Hinweis in wordShaping.js. Umgesetzt: 9 Mechaniken, die alle 10 im Pflichtenheft
// genannten Aufgabentypen abdecken (#6 "Buchstaben in Reihenfolge bringen" und #7 "Wort aus
// Einzelbuchstaben zusammensetzen" sind dieselbe Nutzeraktion und laufen daher über einen
// gemeinsamen Mechanismus — "assemble"):
//   1 choose_form        — Verbundene Form aus Einzelbuchstaben auswählen
//   2 recognize          — Einzelbuchstaben aus einem verbundenen Wort erkennen
//   3 mark_connections   — Verbindungsstellen markieren
//   4 find_break         — Unterbrechungsstelle(n) auswählen
//   5 classify_form      — Anfangs-, Mittel- und Endform bestimmen
//   6+7 assemble         — Buchstaben in Reihenfolge bringen / Wort zusammensetzen
//   8 find_wrong         — Falsche Verbindung finden
//   9 fill_missing       — Fehlenden Buchstaben ergänzen
//   10 type              — Wort mit der virtuellen Tastatur nachschreiben
//
// P0.2: jede Einzelaufgabe läuft über einen ExerciseGuard (an jeden renderXxx()-Aufruf
// durchgereicht) — verhindert Mehrfachauswertung bei Doppelklick und bricht das ~1.2s-Timeout
// vor dem automatischen Weiterschalten ab, falls die Ansicht vorher verlassen wird.

const ConnectionTrainer = (() => {
  let activeGuard = null;

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

  function renderDemo(container, word, letters, onDone) {
    const shaped = shapeWord(letters);
    const steps = [
      letters.map((l) => l.letter).join(' + '),
      shaped.map((s) => s.displayForm).join(' + '),
      shaped.map((s) => s.displayForm).join('')
    ];
    let step = 0;

    function render() {
      container.innerHTML = `
        <div class="card">
          <p class="lead" style="margin:0 0 12px;">${word.meaning}</p>
          <p class="arabic-text large" style="text-align:center;">${steps[step]}</p>
          <button class="btn" id="ct-demo-next" style="display:block; margin:16px auto 0;">${step < steps.length - 1 ? 'Weiter' : 'Zur Übung'}</button>
        </div>
      `;
      container.querySelector('#ct-demo-next').addEventListener('click', () => {
        if (step < steps.length - 1) {
          step += 1;
          render();
        } else {
          onDone();
        }
      });
    }
    render();
  }

  function randomDistractorLetters(allLetters, exclude, count) {
    const pool = allLetters.filter((l) => !exclude.includes(l.id));
    return pickRandomOrder(pool).slice(0, count);
  }

  function renderAssemble(container, word, letters, allLetters, guard, onDone) {
    const target = letters.map((l) => l.letter).join('');
    const shuffled = pickRandomOrder(letters);
    let picked = [];

    function render() {
      container.innerHTML = `
        <div class="card">
          <p class="lead">Setze das Wort aus den Buchstaben zusammen (${word.meaning}):</p>
          <div id="ct-built" class="arabic-text large" dir="rtl" style="min-height:50px; border:1px solid var(--color-border); border-radius:8px; padding:10px; margin-bottom:12px;"></div>
          <div class="rating-buttons" id="ct-tiles"></div>
          <div style="margin-top:12px; display:flex; gap:10px;">
            <button class="btn secondary" id="ct-reset">Zurücksetzen</button>
            <button class="btn" id="ct-check">Prüfen</button>
          </div>
          <p id="ct-feedback" class="feedback"></p>
        </div>
      `;
      const builtEl = container.querySelector('#ct-built');
      const tilesEl = container.querySelector('#ct-tiles');
      function renderTiles() {
        tilesEl.innerHTML = '';
        shuffled.forEach((l, i) => {
          if (picked.includes(i)) return;
          const btn = document.createElement('button');
          btn.className = 'btn secondary arabic-text';
          btn.textContent = l.letter;
          btn.addEventListener('click', () => {
            picked.push(i);
            builtEl.textContent = picked.map((idx) => shuffled[idx].letter).join('');
            renderTiles();
          });
          tilesEl.appendChild(btn);
        });
      }
      renderTiles();
      container.querySelector('#ct-reset').addEventListener('click', () => {
        picked = [];
        builtEl.textContent = '';
        renderTiles();
      });
      container.querySelector('#ct-check').addEventListener('click', () => {
        if (!guard.submit()) return;
        const attempt = picked.map((idx) => shuffled[idx].letter).join('');
        const correct = attempt === target;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${target}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        guard.transitioning();
        guard.setTimeout(() => onDone(correct), 1200);
      });
    }
    render();
  }

  function renderRecognize(container, word, letters, allLetters, guard, onDone) {
    const shaped = shapeWord(letters);
    const joined = shaped.map((s) => s.displayForm).join('');
    const distractors = randomDistractorLetters(allLetters, letters.map((l) => l.id), 3);
    const pool = pickRandomOrder([...letters, ...distractors]);
    const target = letters.map((l) => l.letter).join('');
    let picked = [];

    function render() {
      container.innerHTML = `
        <div class="card">
          <p class="lead">Aus welchen Buchstaben besteht dieses Wort? Tippe sie in der richtigen Reihenfolge an:</p>
          <p class="arabic-text large" style="text-align:center;">${joined}</p>
          <div id="ct-built" class="arabic-text large" dir="rtl" style="min-height:50px; border:1px solid var(--color-border); border-radius:8px; padding:10px; margin-bottom:12px;"></div>
          <div class="rating-buttons" id="ct-tiles"></div>
          <div style="margin-top:12px; display:flex; gap:10px;">
            <button class="btn secondary" id="ct-reset">Zurücksetzen</button>
            <button class="btn" id="ct-check">Prüfen</button>
          </div>
          <p id="ct-feedback" class="feedback"></p>
        </div>
      `;
      const builtEl = container.querySelector('#ct-built');
      const tilesEl = container.querySelector('#ct-tiles');
      function renderTiles() {
        tilesEl.innerHTML = '';
        pool.forEach((l, i) => {
          if (picked.includes(i)) return;
          const btn = document.createElement('button');
          btn.className = 'btn secondary arabic-text';
          btn.textContent = l.letter;
          btn.addEventListener('click', () => {
            picked.push(i);
            builtEl.textContent = picked.map((idx) => pool[idx].letter).join('');
            renderTiles();
          });
          tilesEl.appendChild(btn);
        });
      }
      renderTiles();
      container.querySelector('#ct-reset').addEventListener('click', () => {
        picked = [];
        builtEl.textContent = '';
        renderTiles();
      });
      container.querySelector('#ct-check').addEventListener('click', () => {
        if (!guard.submit()) return;
        const attempt = picked.map((idx) => pool[idx].letter).join('');
        const correct = attempt === target;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${target}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        guard.transitioning();
        guard.setTimeout(() => onDone(correct), 1200);
      });
    }
    render();
  }

  function renderClassifyForm(container, word, letters, allLetters, guard, onDone) {
    const shaped = shapeWord(letters);
    const targetIndex = Math.floor(Math.random() * shaped.length);
    const spans = shaped.map((s, i) => `<span class="arabic-text large" style="${i === targetIndex ? 'color:var(--color-accent);' : ''}">${s.displayForm}</span>`).join('');

    container.innerHTML = `
      <div class="card">
        <p class="lead">Welche Form hat der markierte Buchstabe?</p>
        <p style="text-align:center; direction:rtl;">${spans}</p>
        <div class="rating-buttons" id="ct-options"></div>
        <p id="ct-feedback" class="feedback"></p>
      </div>
    `;
    const options = pickRandomOrder(Object.keys(SHAPE_LABELS_DE));
    const optionsEl = container.querySelector('#ct-options');
    options.forEach((shape) => {
      const btn = document.createElement('button');
      btn.className = 'btn secondary';
      btn.textContent = SHAPE_LABELS_DE[shape];
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = shape === shaped[targetIndex].shape;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${SHAPE_LABELS_DE[shaped[targetIndex].shape]}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        guard.transitioning();
        guard.setTimeout(() => onDone(correct), 1200);
      });
      optionsEl.appendChild(btn);
    });
  }

  function renderType(container, word, letters, allLetters, guard, onDone) {
    container.innerHTML = `
      <div class="card">
        <p class="lead">Schreibe das Wort mit der virtuellen Tastatur (${word.meaning}):</p>
        <input type="text" id="ct-input" class="text-input arabic-text" dir="rtl" style="max-width:300px;" />
        <div id="ct-keyboard"></div>
        <button class="btn" id="ct-check" style="margin-top:12px;">Prüfen</button>
        <p id="ct-feedback" class="feedback"></p>
      </div>
    `;
    const input = container.querySelector('#ct-input');
    VirtualKeyboard.mount(container.querySelector('#ct-keyboard'), input, { showDiacritics: true, showSpecial: false });
    container.querySelector('#ct-check').addEventListener('click', () => {
      if (!guard.submit()) return;
      const result = evaluateArabicAnswer(word.arabic, input.value.trim());
      const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
      const feedbackEl = container.querySelector('#ct-feedback');
      feedbackEl.textContent = isCorrect
        ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
        : `Nicht ganz. Richtig wäre: ${word.arabic}`;
      feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
      guard.showFeedback();
      guard.transitioning();
      guard.setTimeout(() => onDone(isCorrect), 1200);
    });
  }

  // #1: Verbundene Form aus Einzelbuchstaben auswählen. Distraktoren sind dieselben Buchstaben
  // in anderer (falscher) Reihenfolge — die Schrift-Engine formt jede Option automatisch korrekt,
  // "falsch" bedeutet hier also eine andere Buchstabenfolge, nicht eine falsche Verbindungsform.
  function shuffledVariant(letters) {
    const target = letters.map((l) => l.letter).join('');
    let attempt;
    do {
      attempt = pickRandomOrder(letters);
    } while (attempt.map((l) => l.letter).join('') === target && letters.length > 1);
    return attempt.map((l) => l.letter).join('');
  }

  function renderChooseForm(container, word, letters, allLetters, guard, onDone) {
    const target = letters.map((l) => l.letter).join('');
    const variantCount = letters.length > 1 ? 3 : 1;
    const distractors = Array.from({ length: variantCount }, () => shuffledVariant(letters));
    const options = pickRandomOrder([target, ...new Set(distractors)].slice(0, 4));

    container.innerHTML = `
      <div class="card">
        <p class="lead">Welche Schreibweise ist richtig verbunden (${word.meaning})?</p>
        <div class="rating-buttons" id="ct-options"></div>
        <p id="ct-feedback" class="feedback"></p>
      </div>
    `;
    const optionsEl = container.querySelector('#ct-options');
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'btn secondary arabic-text';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = opt === target;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${target}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        guard.transitioning();
        guard.setTimeout(() => onDone(correct), 1200);
      });
      optionsEl.appendChild(btn);
    });
  }

  // #3/#4: Verbindungsstellen bzw. Unterbrechungsstelle(n) markieren. Ein Übergang zwischen
  // Buchstabe i und i+1 ist genau dann verbunden, wenn Buchstabe i selbst 'dual'-verbindend ist.
  function renderJunctions(container, word, letters, allLetters, guard, onDone, wantConnected) {
    if (letters.length < 2) {
      onDone(true);
      return;
    }
    const junctionIsConnected = letters.slice(0, -1).map((l) => l.joining === 'dual');
    const correctIndices = new Set(junctionIsConnected.map((c, i) => (c === wantConnected ? i : null)).filter((i) => i !== null));
    let selected = new Set();

    const instruction = wantConnected
      ? 'Klicke auf alle Stellen, an denen sich zwei Buchstaben VERBINDEN.'
      : 'Klicke auf alle Stellen, an denen die Verbindung UNTERBROCHEN wird.';

    function render() {
      const parts = [];
      letters.forEach((l, i) => {
        parts.push(`<span class="arabic-text large">${l.letter}</span>`);
        if (i < letters.length - 1) {
          parts.push(`<button type="button" class="btn secondary" data-junction="${i}" style="min-width:32px; ${selected.has(i) ? 'background:var(--color-accent); color:var(--on-accent);' : ''}">${selected.has(i) ? '✓' : '·'}</button>`);
        }
      });
      container.innerHTML = `
        <div class="card">
          <p class="lead">${instruction}</p>
          <div style="direction:rtl; display:flex; align-items:center; gap:6px; justify-content:center; margin:16px 0;">${parts.join('')}</div>
          <div style="display:flex; gap:10px; justify-content:center;">
            <button class="btn secondary" id="ct-check">Prüfen</button>
          </div>
          <p id="ct-feedback" class="feedback"></p>
        </div>
      `;
      container.querySelectorAll('[data-junction]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!guard.canSubmit()) return; // nach dem Prüfen keine Änderungen mehr an der Auswahl
          const idx = Number(btn.dataset.junction);
          if (selected.has(idx)) selected.delete(idx); else selected.add(idx);
          render();
        });
      });
      container.querySelector('#ct-check').addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = selected.size === correctIndices.size && [...selected].every((i) => correctIndices.has(i));
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Nicht ganz — gemeint waren die Stellen: ${[...correctIndices].join(', ') || 'keine'}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        guard.transitioning();
        guard.setTimeout(() => onDone(correct), 1400);
      });
    }
    render();
  }

  function renderMarkConnections(container, word, letters, allLetters, guard, onDone) {
    renderJunctions(container, word, letters, allLetters, guard, onDone, true);
  }

  function renderFindBreak(container, word, letters, allLetters, guard, onDone) {
    renderJunctions(container, word, letters, allLetters, guard, onDone, false);
  }

  // #8: Falsche Verbindung finden — zwei Varianten zur Auswahl, eine korrekt, eine vertauscht.
  function renderFindWrong(container, word, letters, allLetters, guard, onDone) {
    const target = letters.map((l) => l.letter).join('');
    const wrongVariant = shuffledVariant(letters);
    const options = pickRandomOrder([
      { text: target, correct: false },
      { text: wrongVariant, correct: true }
    ]);

    container.innerHTML = `
      <div class="card">
        <p class="lead">Welche der beiden Schreibweisen ist FALSCH (${word.meaning})?</p>
        <div class="rating-buttons" id="ct-options"></div>
        <p id="ct-feedback" class="feedback"></p>
      </div>
    `;
    const optionsEl = container.querySelector('#ct-options');
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'btn secondary arabic-text';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = opt.correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${wrongVariant}`;
        feedbackEl.className = 'feedback ' + (opt.correct ? 'correct' : 'wrong');
        guard.showFeedback();
        guard.transitioning();
        guard.setTimeout(() => onDone(opt.correct), 1200);
      });
      optionsEl.appendChild(btn);
    });
  }

  // #9: Fehlenden Buchstaben ergänzen.
  function renderFillMissing(container, word, letters, allLetters, guard, onDone) {
    const shaped = shapeWord(letters);
    const targetIndex = Math.floor(Math.random() * letters.length);
    const spans = shaped.map((s, i) => (i === targetIndex ? '<span class="arabic-text large" style="color:var(--color-accent);">▢</span>' : `<span class="arabic-text large">${s.displayForm}</span>`)).join('');
    const distractors = randomDistractorLetters(allLetters, [letters[targetIndex].id], 3);
    const options = pickRandomOrder([letters[targetIndex], ...distractors]);

    container.innerHTML = `
      <div class="card">
        <p class="lead">Welcher Buchstabe fehlt?</p>
        <p style="text-align:center; direction:rtl;">${spans}</p>
        <div class="rating-buttons" id="ct-options"></div>
        <p id="ct-feedback" class="feedback"></p>
      </div>
    `;
    const optionsEl = container.querySelector('#ct-options');
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'btn secondary arabic-text';
      btn.textContent = opt.letter;
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = opt.id === letters[targetIndex].id;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${letters[targetIndex].letter}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        guard.transitioning();
        guard.setTimeout(() => onDone(correct), 1200);
      });
      optionsEl.appendChild(btn);
    });
  }

  const EXERCISE_RENDERERS = {
    choose_form: renderChooseForm,
    recognize: renderRecognize,
    mark_connections: renderMarkConnections,
    find_break: renderFindBreak,
    classify_form: renderClassifyForm,
    assemble: renderAssemble,
    find_wrong: renderFindWrong,
    fill_missing: renderFillMissing,
    type: renderType
  };

  const ALL_TYPES = ['choose_form', 'recognize', 'mark_connections', 'find_break', 'classify_form', 'assemble', 'find_wrong', 'fill_missing', 'type'];

  /**
   * @param {HTMLElement} container
   * @param {{word: {arabic: string, meaning: string}, keyboardLetters: Array, types?: string[], skipDemo?: boolean, onComplete?: (result: {correct:number,total:number}) => void}} options
   *   types: Liste der zu nutzenden Aufgabentypen. Ohne Angabe wird eine zufällige 4er-Auswahl
   *   aus ALL_TYPES verwendet, damit eine einzelne Lesson nicht unnötig lang wird — über mehrere
   *   Units/Aufrufe hinweg kommen so trotzdem alle Typen vor. `types: 'all'` nutzt alle 9.
   */
  function mount(container, options) {
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    const { word, keyboardLetters, onComplete } = options;
    const types = options.types === 'all' ? ALL_TYPES : (options.types || pickRandomOrder(ALL_TYPES).slice(0, 4));
    const plain = normalizeArabic(word.arabic);
    const letters = lettersFromWord(plain, keyboardLetters);

    if (!letters) {
      container.innerHTML = `<p class="feedback wrong">Dieses Wort enthält Zeichen außerhalb der 28 Grundbuchstaben und kann im Verbindungstrainer nicht genutzt werden.</p>`;
      return;
    }

    let typeIndex = 0;
    let correctCount = 0;
    const cardId = `connection_${plain}`;

    function runNextExercise() {
      if (typeIndex >= types.length) {
        activeGuard = null;
        if (onComplete) onComplete({ correct: correctCount, total: types.length });
        return;
      }
      const guard = freshGuard();
      const renderer = EXERCISE_RENDERERS[types[typeIndex]];
      renderer(container, word, letters, keyboardLetters, guard, (correct) => {
        if (correct) correctCount += 1;
        const card = AppState.getCard(cardId);
        adjustDifficulty(card, 'connection', correct ? 'correct' : 'wrong');
        AppState.persistProgress();
        typeIndex += 1;
        runNextExercise();
      });
    }

    if (options.skipDemo) {
      runNextExercise();
    } else {
      renderDemo(container, word, letters, runNextExercise);
    }
  }

  return { mount };
})();
