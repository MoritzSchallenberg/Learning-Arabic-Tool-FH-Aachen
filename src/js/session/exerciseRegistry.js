// ExerciseRegistry (Entwicklungsauftrag 4, Schritt 3/13.1) — ordnet datenbasierte
// Übungstypen einer konkreten UI-Renderfunktion zu. Jede Renderfunktion bekommt einen
// ExerciseGuard (Mehrfachklick-Schutz, siehe exerciseGuard.js) und meldet das Ergebnis über
// onDone(isCorrect, detail).
//
// Für die Pilot-Session umgesetzt: multiple_choice (Wiedererkennen), order_pieces
// (Rekonstruieren — sortiert je nach Wort entweder Buchstaben oder, bei mehrteiligen
// Ausdrücken, ganze Wörter), guided_typing/independent_typing (Produktion), contextual_choice
// (Anwendung). audio_choice/matching/connection_builder/sentence_builder/fill_gap sind als
// Registry-Einträge vorbereitet, aber erst mit mehr Pilot-Inhalten sinnvoll auszubauen (siehe
// ROADMAP).

const ExerciseRegistry = (() => {
  function pickRandomOrder(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    return node;
  }

  function feedbackNode() {
    return el('p', { className: 'feedback' });
  }

  // --- Wiedererkennen: Arabisch -> passende deutsche Bedeutung auswählen ---------------------
  function renderMultipleChoice(container, ctx, guard, onDone) {
    const { word, allWords } = ctx;
    const distractors = pickRandomOrder(allWords.filter((w) => w.id !== word.id)).slice(0, 3);
    const options = pickRandomOrder([word, ...distractors]);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card flashcard' });
    card.appendChild(el('p', { className: 'lead', text: 'Was bedeutet dieser Ausdruck?' }));
    card.appendChild(el('p', { className: 'arabic-word-main', text: word.arabic }));
    const optionsWrap = el('div', { className: 'rating-buttons' });
    const feedback = feedbackNode();
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary', text: opt.german });
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = opt.id === word.id;
        feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${word.german}`;
        feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        onDone(correct, { feedbackShown: true });
      });
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);
    card.appendChild(feedback);
    container.appendChild(card);
  }

  // --- Rekonstruieren: Einzelteile (Buchstaben oder Wörter) in die richtige Reihenfolge -------
  function tokensForReconstruction(word, keyboardLetters) {
    const plain = normalizeArabic(word.arabic);
    if (!plain.includes(' ')) {
      const letters = lettersFromWord(plain, keyboardLetters);
      if (letters) return { pieces: letters.map((l) => l.letter), joiner: '' };
    }
    return { pieces: plain.split(' '), joiner: ' ' };
  }

  function renderOrderPieces(container, ctx, guard, onDone) {
    const { word, keyboardLetters } = ctx;
    const { pieces, joiner } = tokensForReconstruction(word, keyboardLetters);
    const target = pieces.join(joiner);
    const shuffled = pickRandomOrder(pieces.map((p, i) => ({ text: p, originalIndex: i })));
    let picked = [];

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card' });
    card.appendChild(el('p', { className: 'lead', text: `Bringe „${word.german}" in die richtige Reihenfolge:` }));
    const built = el('div', { className: 'arabic-word-main' });
    built.dir = 'rtl';
    built.style.minHeight = '2.5em';
    built.style.border = '1px solid var(--border)';
    built.style.borderRadius = 'var(--radius)';
    built.style.padding = '6px 12px';
    card.appendChild(built);
    const tilesWrap = el('div', { className: 'rating-buttons' });
    card.appendChild(tilesWrap);
    const actions = el('div', { style: '' });
    actions.style.marginTop = '12px';
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    const resetBtn = el('button', { className: 'btn secondary', text: 'Zurücksetzen' });
    resetBtn.type = 'button';
    const checkBtn = el('button', { className: 'btn', text: 'Prüfen' });
    checkBtn.type = 'button';
    actions.appendChild(resetBtn);
    actions.appendChild(checkBtn);
    card.appendChild(actions);
    const feedback = feedbackNode();
    card.appendChild(feedback);
    container.appendChild(card);

    function renderTiles() {
      while (tilesWrap.firstChild) tilesWrap.removeChild(tilesWrap.firstChild);
      shuffled.forEach((piece, i) => {
        if (picked.includes(i)) return;
        const btn = el('button', { className: 'btn secondary arabic-text', text: piece.text });
        btn.type = 'button';
        btn.addEventListener('click', () => {
          if (!guard.canSubmit()) return;
          picked.push(i);
          built.textContent = picked.map((idx) => shuffled[idx].text).join(joiner);
          renderTiles();
        });
        tilesWrap.appendChild(btn);
      });
    }
    renderTiles();

    resetBtn.addEventListener('click', () => {
      if (!guard.canSubmit()) return;
      picked = [];
      built.textContent = '';
      renderTiles();
    });

    checkBtn.addEventListener('click', () => {
      if (!guard.submit()) return;
      const attempt = picked.map((idx) => shuffled[idx].text).join(joiner);
      const correct = attempt === target;
      feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${target}`;
      feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
      guard.showFeedback();
      onDone(correct, { feedbackShown: true });
    });
  }

  // --- Produktion: Wort über die virtuelle Tastatur schreiben (geführt/selbstständig) ---------
  function renderTyping(container, ctx, guard, onDone) {
    const { word, helpConfig, showHint } = ctx;

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card' });
    card.appendChild(el('p', {
      className: 'lead',
      text: showHint ? `Schreibe: ${word.german} (${word.arabic})` : `Schreibe: ${word.german}`
    }));
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input arabic-text';
    input.dir = 'rtl';
    input.style.maxWidth = '360px';
    input.style.margin = '0 auto 12px';
    input.style.display = 'block';
    card.appendChild(input);
    const keyboardWrap = el('div');
    card.appendChild(keyboardWrap);
    const checkBtn = el('button', { className: 'btn', text: 'Prüfen' });
    checkBtn.type = 'button';
    checkBtn.style.marginTop = '12px';
    card.appendChild(checkBtn);
    const feedback = feedbackNode();
    card.appendChild(feedback);
    container.appendChild(card);

    VirtualKeyboard.mount(keyboardWrap, input, {
      showDiacritics: true,
      showSpecial: true,
      keyboardLevel: helpConfig.keyboardLevel,
      expectedWord: showHint ? normalizeArabic(word.arabic) : null
    });

    checkBtn.addEventListener('click', () => {
      if (!guard.submit()) return;
      const result = evaluateArabicAnswer(word.arabic, input.value.trim());
      const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
      feedback.textContent = isCorrect
        ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
        : `Nicht ganz. Richtig wäre: ${word.arabic}`;
      feedback.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
      guard.showFeedback();
      onDone(isCorrect, { feedbackShown: true, result });
    });
  }

  // --- Anwendung: passendes Wort zu einer kurzen Situationsbeschreibung wählen ----------------
  const APPLICATION_CONTEXT = {
    greet_hallo: 'Du triffst jemanden zum ersten Mal.',
    greet_salam: 'Du begrüßt eine Gruppe von Menschen sehr höflich.',
    greet_morning: 'Es ist früh am Morgen.',
    greet_evening: 'Es ist am Abend.',
    greet_bye: 'Du verlässt gerade einen Ort.',
    greet_thanks: 'Jemand hilft dir.',
    greet_please: 'Du bittest höflich um etwas.',
    greet_yes: 'Du stimmst einer Frage zu.',
    greet_no: 'Du lehnst eine Frage ab.'
  };

  function renderContextualChoice(container, ctx, guard, onDone) {
    const { word, allWords } = ctx;
    const context = APPLICATION_CONTEXT[word.id] || word.german;
    const distractors = pickRandomOrder(allWords.filter((w) => w.id !== word.id)).slice(0, 3);
    const options = pickRandomOrder([word, ...distractors]);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card flashcard' });
    card.appendChild(el('p', { className: 'lead', text: context }));
    card.appendChild(el('p', { className: 'text-hint', text: 'Welcher Ausdruck passt am besten?' }));
    const optionsWrap = el('div', { className: 'rating-buttons' });
    const feedback = feedbackNode();
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary arabic-text', text: opt.arabic });
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = opt.id === word.id;
        feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${word.arabic} (${word.german})`;
        feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        onDone(correct, { feedbackShown: true });
      });
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);
    card.appendChild(feedback);
    container.appendChild(card);
  }

  const RENDERERS = {
    multiple_choice: renderMultipleChoice,
    order_pieces: renderOrderPieces,
    guided_typing: (container, ctx, guard, onDone) => renderTyping(container, { ...ctx, showHint: true }, guard, onDone),
    independent_typing: (container, ctx, guard, onDone) => renderTyping(container, { ...ctx, showHint: false }, guard, onDone),
    contextual_choice: renderContextualChoice
  };

  // Phase -> welcher registrierte Übungstyp diese Phase für die Pilot-Session bedient.
  const PHASE_EXERCISE_TYPE = {
    recognition: 'multiple_choice',
    reconstruction: 'order_pieces',
    guided_production: 'guided_typing',
    independent_production: 'independent_typing',
    application: 'contextual_choice'
  };

  function render(exerciseType, container, ctx, guard, onDone) {
    const renderer = RENDERERS[exerciseType];
    if (!renderer) {
      console.warn(`ExerciseRegistry: unbekannter Übungstyp "${exerciseType}" — übersprungen.`); // eslint-disable-line no-console
      onDone(true, { skipped: true });
      return;
    }
    renderer(container, ctx, guard, onDone);
  }

  return { render, PHASE_EXERCISE_TYPE, RENDERERS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExerciseRegistry;
}
