// TheoryRenderer (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 11). Rendert strukturierte
// Theorieseiten aus reinen Datenblöcken — NIE über innerHTML mit Kursdaten, ausschließlich über
// document.createElement()/textContent, damit später importierte Kurspakete (Meilenstein C)
// keine Skripte/Event-Handler über Theorietexte einschleusen können (siehe Auftrag Abschnitt 27).
//
// Erlaubte Blocktypen: paragraph, heading, bullet_list, example, comparison, callout, table,
// word_preview, letter_demo, audio_word, mini_check.
//
// Zwei Darstellungsstufen: Blöcke ohne "level"-Feld oder mit level:"short" sind immer sichtbar
// ("Kurz erklärt"); Blöcke mit level:"full" erscheinen erst nach Klick auf "Mehr erfahren".
//
// Theoriefortschritt wird über AppState.markTheoryOpened/markTheoryMiniCheckResult/
// markTheoryCompleted gespeichert (state.js).

const TheoryRenderer = (() => {
  function el(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    return node;
  }

  function renderParagraph(block) {
    return el('p', { className: 'theory-paragraph', text: block.text || '' });
  }

  function renderHeading(block) {
    const tag = block.level_tag === 3 ? 'h4' : 'h3';
    return el(tag, { className: 'theory-heading', text: block.text || '' });
  }

  function renderBulletList(block) {
    const ul = el('ul', { className: 'theory-list' });
    for (const item of block.items || []) {
      ul.appendChild(el('li', { text: item }));
    }
    return ul;
  }

  function renderExample(block) {
    const wrapper = el('div', { className: 'card theory-example' });
    if (block.arabic) wrapper.appendChild(el('p', { className: 'arabic-text', text: block.arabic }));
    if (block.translation) wrapper.appendChild(el('p', { className: 'mixed-text', text: block.translation }));
    if (block.note) wrapper.appendChild(el('p', { className: 'theory-note', text: block.note }));
    return wrapper;
  }

  function renderTableLike(block) {
    const table = el('table', { className: 'forms-table' });
    if (Array.isArray(block.headers) && block.headers.length > 0) {
      const thead = el('thead');
      const headRow = el('tr');
      for (const h of block.headers) headRow.appendChild(el('th', { text: h }));
      thead.appendChild(headRow);
      table.appendChild(thead);
    }
    const tbody = el('tbody');
    for (const row of block.items || block.rows || []) {
      const tr = el('tr');
      for (const cell of row) tr.appendChild(el('td', { text: String(cell) }));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  function renderCallout(block) {
    const wrapper = el('div', { className: `theory-callout theory-callout-${block.variant || 'info'}` });
    if (block.title) wrapper.appendChild(el('p', { className: 'theory-callout-title', text: block.title }));
    wrapper.appendChild(el('p', { text: block.text || '' }));
    return wrapper;
  }

  function renderWordPreview(block, context) {
    const wrapper = el('div', { className: 'theory-word-preview' });
    const ids = block.word_ids || [];
    for (const id of ids) {
      const word = context.getWordById ? context.getWordById(id) : null;
      if (!word) continue;
      const card = el('div', { className: 'card theory-word-card' });
      card.appendChild(el('p', { className: 'arabic-text large', text: word.arabic_vocalized || word.arabic || '' }));
      const germanText = Array.isArray(word.german_answers) ? word.german_answers.join(', ') : (word.german || '');
      card.appendChild(el('p', { text: germanText }));
      if (word.transliteration) card.appendChild(el('p', { className: 'mixed-text', text: word.transliteration }));
      wrapper.appendChild(card);
    }
    return wrapper;
  }

  function renderLetterDemo(block, context) {
    const wrapper = el('div', { className: 'theory-letter-demo' });
    for (const letterId of block.letter_ids || []) {
      const letter = context.getLetterById ? context.getLetterById(letterId) : null;
      if (!letter) continue;
      wrapper.appendChild(el('p', { className: 'arabic-text large', text: `${letter.letter} — ${letter.name}` }));
    }
    return wrapper;
  }

  function renderAudioWord(block, context) {
    const wrapper = el('div', { className: 'theory-audio-word' });
    const btn = el('button', { className: 'btn icon', text: '🔊' });
    btn.addEventListener('click', () => {
      if (context.onPlayAudio) context.onPlayAudio(block.audio_key, block.text || '');
    });
    wrapper.appendChild(btn);
    if (block.text) wrapper.appendChild(el('span', { className: 'arabic-text', text: block.text }));
    return wrapper;
  }

  // mini_check (Entwicklungsauftrag 5, Abschnitt 15): einfache Multiple-Choice-Fragen,
  // sequentiell mit Doppelklick-Schutz (ExerciseGuard). Anders als zuvor: KEIN automatischer
  // 600-ms-Wechsel mehr — nach jeder Antwort erscheint erklärendes Feedback ("Noch nicht. X
  // bedeutet Y.") und ein manuelles "Weiter". Am Ende erscheint eine Zusammenfassung mit
  // "Noch einmal ansehen"/"Mit den Wörtern starten" statt direkt fortzufahren — bei 0-1
  // richtigen Antworten zusätzlich eine (unverbindliche) Empfehlung, die Erklärung erneut
  // anzusehen. Ergebnis wird über context.onMiniCheckComplete(correct, total) gemeldet.
  function renderMiniCheck(block, context) {
    const wrapper = el('div', { className: 'card theory-mini-check' });
    const questions = block.questions || [];
    if (questions.length === 0) return wrapper;

    const guard = ExerciseGuard.create();
    if (context.registerGuard) context.registerGuard(guard);
    let index = 0;
    let correctCount = 0;

    function renderSummary() {
      while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
      guard.complete();
      wrapper.appendChild(el('p', { className: 'lead', text: `${correctCount} von ${questions.length} richtig` }));
      if (correctCount / questions.length < 0.6) {
        wrapper.appendChild(el('p', {
          className: 'text-hint',
          text: 'Ein kurzer zweiter Blick auf die Erklärung könnte helfen — das ist aber keine Pflicht.'
        }));
      }
      const actions = el('div', { className: 'rating-buttons' });
      const reviewBtn = el('button', { className: 'btn secondary', text: 'Noch einmal ansehen' });
      reviewBtn.addEventListener('click', () => {
        index = 0;
        correctCount = 0;
        renderQuestion();
      });
      const startWordsBtn = el('button', { className: 'btn', text: 'Mit den Wörtern starten' });
      startWordsBtn.addEventListener('click', () => {
        if (context.onMiniCheckStartWords) context.onMiniCheckStartWords();
      });
      actions.appendChild(reviewBtn);
      actions.appendChild(startWordsBtn);
      wrapper.appendChild(actions);
      if (context.onMiniCheckComplete) context.onMiniCheckComplete(correctCount, questions.length);
    }

    function renderQuestion() {
      while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
      if (index >= questions.length) { renderSummary(); return; }
      guard.nextTask();
      const q = questions[index];
      wrapper.appendChild(el('p', { className: 'lead', text: `Mini-Check ${index + 1}/${questions.length}: ${q.question}` }));
      const optionsWrap = el('div', { className: 'rating-buttons' });
      const feedback = el('p', { className: 'feedback' });
      (q.options || []).forEach((opt) => {
        const btn = el('button', { className: 'btn secondary', text: opt.text });
        btn.addEventListener('click', () => {
          if (!guard.submit()) return;
          const correctOption = (q.options || []).find((o) => o.correct);
          if (opt.correct) {
            correctCount += 1;
            feedback.textContent = 'Richtig!';
            feedback.className = 'feedback correct';
          } else {
            feedback.textContent = `Noch nicht. ${q.explanation || (correctOption ? `Richtig wäre: ${correctOption.text}.` : '')}`;
            feedback.className = 'feedback wrong';
          }
          guard.showFeedback();
          const continueBtn = el('button', { className: 'btn', text: 'Weiter' });
          continueBtn.style.display = 'block';
          continueBtn.style.marginTop = '10px';
          continueBtn.addEventListener('click', () => {
            index += 1;
            renderQuestion();
          });
          wrapper.appendChild(continueBtn);
        });
        optionsWrap.appendChild(btn);
      });
      wrapper.appendChild(optionsWrap);
      wrapper.appendChild(feedback);
    }

    renderQuestion();
    return wrapper;
  }

  const BLOCK_RENDERERS = {
    paragraph: renderParagraph,
    heading: renderHeading,
    bullet_list: renderBulletList,
    example: renderExample,
    comparison: renderTableLike,
    table: renderTableLike,
    callout: renderCallout,
    word_preview: renderWordPreview,
    letter_demo: renderLetterDemo,
    audio_word: renderAudioWord,
    mini_check: renderMiniCheck
  };

  /**
   * @param {HTMLElement} container
   * @param {object} theoryDoc - { theory_id, title, learning_objectives: string[], blocks: [...] }
   * @param {object} options
   * @param {string} [options.initialLevel='short'] - 'short' | 'full'
   * @param {(id:string)=>object} [options.getWordById]
   * @param {(id:string)=>object} [options.getLetterById]
   * @param {(audioKey:string, text:string)=>void} [options.onPlayAudio]
   * @param {(correct:number, total:number)=>void} [options.onMiniCheckComplete]
   * @param {()=>void} [options.onStart] - Klick auf "Session starten"
   * @param {string} [options.startLabel='Session starten'] - Beschriftung des Start-Buttons
   *   (z. B. "Zurück zur Übung", wenn die Theorie während einer laufenden Session erneut
   *   geöffnet wird, statt eine neue Session zu beginnen)
   * @param {(guard: object)=>void} [options.registerGuard] - für Aufräumung durch die aufrufende View
   * @param {boolean} [options.requireMiniCheckBeforeStart=false] - Entwicklungsauftrag 5,
   *   Abschnitt 15: beim ersten Sessiondurchlauf darf "Session starten" erst geklickt werden
   *   können, nachdem jeder (nicht hinter "Mehr erfahren" verborgene) Mini-Check VOLLSTÄNDIG
   *   bearbeitet wurde (nicht: bestanden). Bei erneutem Ansehen der Theorie während einer
   *   laufenden Session bleibt dies false — dort ist der Mini-Check weiterhin optional.
   */
  function mount(container, theoryDoc, options = {}) {
    let level = options.initialLevel || 'short';
    AppState.markTheoryOpened(theoryDoc.theory_id);
    const blocksForGating = theoryDoc.blocks || [];
    const requiredMiniCheckCount = options.requireMiniCheckBeforeStart
      ? blocksForGating.filter((b) => b.type === 'mini_check' && b.level !== 'full' && (b.questions || []).length > 0).length
      : 0;
    const completedMiniCheckBlocks = new Set();

    function render() {
      while (container.firstChild) container.removeChild(container.firstChild);

      const wrapper = el('div', { className: 'view theory-view' });
      wrapper.appendChild(el('h1', { text: theoryDoc.title || '' }));

      if (Array.isArray(theoryDoc.learning_objectives) && theoryDoc.learning_objectives.length > 0) {
        const objWrap = el('div', { className: 'card theory-objectives' });
        objWrap.appendChild(el('p', { className: 'lead', text: 'Lernziele' }));
        const ul = el('ul');
        for (const obj of theoryDoc.learning_objectives) ul.appendChild(el('li', { text: obj }));
        objWrap.appendChild(ul);
        wrapper.appendChild(objWrap);
      }

      const blocksEl = el('div', { className: 'theory-blocks' });
      const blocks = theoryDoc.blocks || [];
      const hasFullBlocks = blocks.some((b) => b.level === 'full');
      let startBtn = null;

      function updateStartButtonState() {
        if (!startBtn) return;
        const stillRequired = requiredMiniCheckCount > 0 && completedMiniCheckBlocks.size < requiredMiniCheckCount;
        startBtn.disabled = stillRequired;
        startBtn.title = stillRequired ? 'Bitte zuerst den Mini-Check abschließen.' : '';
      }

      blocks.forEach((block, blockIndex) => {
        if (block.level === 'full' && level !== 'full') return;
        const renderer = BLOCK_RENDERERS[block.type];
        if (!renderer) return;
        let blockOptions = options;
        if (block.type === 'mini_check') {
          blockOptions = {
            ...options,
            // "Mit den Wörtern starten" im Mini-Check-Abschluss verhält sich wie ein Klick auf
            // "Session starten" (markiert Theorie als abgeschlossen, ruft onStart auf) — so muss
            // der Nutzer nach dem Mini-Check nicht zusätzlich nach unten scrollen.
            onMiniCheckStartWords: options.onMiniCheckStartWords || (() => { if (startBtn) startBtn.click(); })
          };
          if (block.level !== 'full' && requiredMiniCheckCount > 0) {
            blockOptions.onMiniCheckComplete = (correct, total) => {
              completedMiniCheckBlocks.add(blockIndex);
              if (options.onMiniCheckComplete) options.onMiniCheckComplete(correct, total);
              updateStartButtonState();
            };
          }
        }
        blocksEl.appendChild(renderer(block, blockOptions));
      });
      wrapper.appendChild(blocksEl);

      if (hasFullBlocks) {
        const toggleBtn = el('button', {
          className: 'btn secondary',
          text: level === 'full' ? 'Weniger anzeigen' : 'Mehr erfahren'
        });
        toggleBtn.addEventListener('click', () => {
          level = level === 'full' ? 'short' : 'full';
          render();
        });
        wrapper.appendChild(toggleBtn);
      }

      startBtn = el('button', { className: 'btn', text: options.startLabel || 'Session starten' });
      startBtn.style.display = 'block';
      startBtn.style.marginTop = '20px';
      updateStartButtonState();
      startBtn.addEventListener('click', () => {
        if (startBtn.disabled) return;
        AppState.markTheoryCompleted(theoryDoc.theory_id);
        if (options.onStart) options.onStart();
      });
      wrapper.appendChild(startBtn);

      container.appendChild(wrapper);
    }

    render();
  }

  return { mount, BLOCK_RENDERERS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TheoryRenderer;
}
