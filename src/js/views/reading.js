// Lektion 10: Lesen und Schreiben (Spec-Kapitel "Lektion 10").
// 2 von 6 Aufgabentypen umgesetzt (Leseverständnis, Wörter in Reihenfolge bringen) —
// siehe Hinweis in reading.json zu den ausgelassenen Typen (Diktat, Fehlerkorrektur,
// Übersetzung, freie Textproduktion: ohne echte Sprachprüfung nicht sinnvoll auto-bewertbar).

const ReadingView = (() => {
  let data = null;
  let phase = 'comprehension'; // 'comprehension' | 'reorder'
  let container = null;

  function pickRandomOrder(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderTextCard() {
    const lines = data.sentences.map((s) => `<p class="arabic-text" style="margin:6px 0;">${s.arabic}</p>`).join('');
    return `<div class="card">${lines}</div>`;
  }

  let comprehensionIndex = 0;

  function renderComprehension() {
    const questions = data.sentences;
    if (comprehensionIndex >= questions.length) {
      container.innerHTML = `
        <div class="view">
          <h1>Lesen und Schreiben</h1>
          ${renderTextCard()}
          <p class="feedback correct">Leseverständnis abgeschlossen.</p>
          <button class="btn" id="reading-to-reorder">Weiter zu: Wörter in Reihenfolge bringen</button>
        </div>
      `;
      container.querySelector('#reading-to-reorder').addEventListener('click', () => {
        phase = 'reorder';
        renderReorderIndex = 0;
        renderCurrent();
      });
      return;
    }
    const sentence = questions[comprehensionIndex];
    const options = pickRandomOrder(sentence.options);
    container.innerHTML = `
      <div class="view">
        <h1>Lesen und Schreiben</h1>
        ${renderTextCard()}
        <div class="card">
          <p class="lead">Frage ${comprehensionIndex + 1} / ${questions.length} — Was bedeutet: <span class="arabic-text">${sentence.arabic}</span></p>
          <div class="rating-buttons" id="reading-options" style="flex-direction:column; align-items:stretch;"></div>
          <p id="reading-feedback" class="feedback"></p>
        </div>
      </div>
    `;
    const optionsEl = container.querySelector('#reading-options');
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'btn secondary';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        const feedbackEl = container.querySelector('#reading-feedback');
        feedbackEl.textContent = opt.correct ? 'Richtig!' : 'Falsch, versuch es bei der nächsten Frage nochmal.';
        feedbackEl.className = 'feedback ' + (opt.correct ? 'correct' : 'wrong');
        const card = AppState.getCard(`reading_${sentence.id}`);
        adjustDifficulty(card, 'reading', opt.correct ? 'correct' : 'wrong');
        AppState.persistProgress();
        comprehensionIndex += 1;
        setTimeout(renderComprehension, 1100);
      });
      optionsEl.appendChild(btn);
    });
  }

  let renderReorderIndex = 0;
  let reorderAttempt = [];

  function renderReorder() {
    const sentenceIds = data.reorder_sentence_ids;
    if (renderReorderIndex >= sentenceIds.length) {
      container.innerHTML = `
        <div class="view">
          <h1>Lesen und Schreiben</h1>
          <p class="feedback correct">Übung abgeschlossen.</p>
          <button class="btn" id="reading-back-list">Zurück zur Lektionsübersicht</button>
        </div>
      `;
      container.querySelector('#reading-back-list').addEventListener('click', () => {
        App.navigateTo('review_exam');
      });
      return;
    }
    const sentence = data.sentences.find((s) => s.id === sentenceIds[renderReorderIndex]);
    const shuffled = pickRandomOrder(sentence.words);
    reorderAttempt = [];

    container.innerHTML = `
      <div class="view">
        <h1>Lesen und Schreiben</h1>
        <div class="card">
          <p class="lead">Bringe die Wörter in die richtige Reihenfolge (${sentence.german}):</p>
          <div id="reading-built" class="arabic-text" dir="rtl" style="min-height:40px; border:1px solid var(--color-border); border-radius:8px; padding:10px; margin-bottom:12px;"></div>
          <div class="rating-buttons" id="reading-tokens"></div>
          <div style="margin-top:12px; display:flex; gap:10px;">
            <button class="btn secondary" id="reading-reset">Zurücksetzen</button>
            <button class="btn" id="reading-check-order">Prüfen</button>
          </div>
          <p id="reading-order-feedback" class="feedback"></p>
        </div>
      </div>
    `;

    const builtEl = container.querySelector('#reading-built');
    const tokensEl = container.querySelector('#reading-tokens');

    function renderTokens() {
      tokensEl.innerHTML = '';
      shuffled.forEach((word, i) => {
        if (reorderAttempt.includes(i)) return;
        const btn = document.createElement('button');
        btn.className = 'btn secondary arabic-text';
        btn.textContent = word;
        btn.addEventListener('click', () => {
          reorderAttempt.push(i);
          builtEl.textContent = reorderAttempt.map((idx) => shuffled[idx]).join(' ');
          renderTokens();
        });
        tokensEl.appendChild(btn);
      });
    }
    renderTokens();

    container.querySelector('#reading-reset').addEventListener('click', () => {
      reorderAttempt = [];
      builtEl.textContent = '';
      renderTokens();
    });

    container.querySelector('#reading-check-order').addEventListener('click', () => {
      const attemptText = reorderAttempt.map((idx) => shuffled[idx]).join(' ');
      const expectedText = sentence.words.join(' ');
      const feedbackEl = container.querySelector('#reading-order-feedback');
      const correct = attemptText === expectedText;
      feedbackEl.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${expectedText}`;
      feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
      const card = AppState.getCard(`reading_order_${sentence.id}`);
      adjustDifficulty(card, 'reading', correct ? 'correct' : 'wrong');
      AppState.persistProgress();
      setTimeout(() => {
        renderReorderIndex += 1;
        renderReorder();
      }, 1400);
    });
  }

  function renderCurrent() {
    if (phase === 'comprehension') renderComprehension();
    else renderReorder();
  }

  async function mount(el) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    data = pack.reading;
    phase = 'comprehension';
    comprehensionIndex = 0;
    renderReorderIndex = 0;
    renderCurrent();
  }

  return { mount };
})();
