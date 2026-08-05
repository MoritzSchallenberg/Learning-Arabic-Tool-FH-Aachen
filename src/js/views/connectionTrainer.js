// Verbindungstrainer (Spec-Kapitel 7). Eigenständige, wiederverwendbare Komponente, die ein
// Wort als Parameter bekommt (kein eigener Lektionsschlüssel). Nutzt wordShaping.js für die
// Formen-Berechnung. Nur Wörter aus den 28 Grundbuchstaben werden unterstützt (keine ة/ء/لا) —
// siehe Hinweis in wordShaping.js. Umgesetzt: 4 von 10 im Pflichtenheft genannten Aufgabentypen
// (Wort zusammensetzen, Buchstaben erkennen, Kontextform bestimmen, mit Tastatur nachschreiben).

const ConnectionTrainer = (() => {
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

  function renderAssemble(container, word, letters, allLetters, onDone) {
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
        const attempt = picked.map((idx) => shuffled[idx].letter).join('');
        const correct = attempt === target;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${target}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        setTimeout(() => onDone(correct), 1200);
      });
    }
    render();
  }

  function renderRecognize(container, word, letters, allLetters, onDone) {
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
        const attempt = picked.map((idx) => pool[idx].letter).join('');
        const correct = attempt === target;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${target}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        setTimeout(() => onDone(correct), 1200);
      });
    }
    render();
  }

  function renderClassifyForm(container, word, letters, allLetters, onDone) {
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
        const correct = shape === shaped[targetIndex].shape;
        const feedbackEl = container.querySelector('#ct-feedback');
        feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${SHAPE_LABELS_DE[shaped[targetIndex].shape]}`;
        feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        setTimeout(() => onDone(correct), 1200);
      });
      optionsEl.appendChild(btn);
    });
  }

  function renderType(container, word, letters, allLetters, onDone) {
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
      const result = evaluateArabicAnswer(word.arabic, input.value.trim());
      const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
      const feedbackEl = container.querySelector('#ct-feedback');
      feedbackEl.textContent = isCorrect
        ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
        : `Nicht ganz. Richtig wäre: ${word.arabic}`;
      feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
      setTimeout(() => onDone(isCorrect), 1200);
    });
  }

  const EXERCISE_RENDERERS = {
    assemble: renderAssemble,
    recognize: renderRecognize,
    classify_form: renderClassifyForm,
    type: renderType
  };

  /**
   * @param {HTMLElement} container
   * @param {{word: {arabic: string, meaning: string}, keyboardLetters: Array, types?: string[], skipDemo?: boolean, onComplete?: (result: {correct:number,total:number}) => void}} options
   */
  function mount(container, options) {
    const { word, keyboardLetters, onComplete } = options;
    const types = options.types || ['assemble', 'recognize', 'classify_form', 'type'];
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
        if (onComplete) onComplete({ correct: correctCount, total: types.length });
        return;
      }
      const renderer = EXERCISE_RENDERERS[types[typeIndex]];
      renderer(container, word, letters, keyboardLetters, (correct) => {
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
