// ExerciseRegistry (Entwicklungsauftrag 4, Schritt 3; erweitert in Entwicklungsauftrag 5,
// Abschnitte 9/18/19/24) — ordnet datenbasierte Übungstypen einer konkreten UI-Renderfunktion zu.
//
// Vertrag mit SessionController (Abschnitt 24 "Aktionsleiste vereinheitlichen"): Aufgaben, die
// einen expliziten Prüfschritt brauchen (Eingabe/Rekonstruktion), rufen `ctx.provideCheckAction(fn)`
// auf — der Controller zeigt dann "Prüfen" in der unteren Aktionsleiste an und ruft `fn()` bei
// Klick auf. Aufgaben, die direkt per Klick auf eine Option entscheiden (Multiple Choice), rufen
// das NICHT auf — es erscheint kein zusätzlicher "Prüfen"-Button. `ctx.helpConfig`
// (helpLevel.js-Konfiguration) UND `ctx.settings` (Einstellungen, Abschnitt 21) steuern
// gemeinsam, was angezeigt wird (Vokalzeichen/Umschrift/Übersetzung).
//
// Für die Pilot-Sessions umgesetzt: multiple_choice/german_to_arabic_choice/
// audio_to_word_choice/word_to_audio_choice (Wiedererkennen + leichte Mini-Checks, Abschnitt 5),
// order_pieces (Rekonstruieren), guided_typing/independent_typing (Produktion), contextual_choice
// (Anwendung, jetzt vollständig datenbasiert über word.application_prompts statt hart codierter
// Wort-IDs, Abschnitt 19).

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

  // --- Hilfsfunktionen für flexible Antworten (Abschnitt 18: evaluateAgainstAny) --------------
  function germanAnswers(word) {
    return Array.isArray(word.german_answers) && word.german_answers.length > 0 ? word.german_answers : [word.german];
  }

  // --- Distraktorauswahl qualitativ abgesichert (Entwicklungsauftrag 11, Abschnitt 8) ---------
  // Vorher wurden für Multiple-Choice-artige Aufgaben (Wiedererkennen, contextual_choice, ...)
  // einfach drei ZUFÄLLIGE andere Wörter aus dem übergebenen Pool als Distraktoren verwendet —
  // dabei konnten theoretisch Duplikate, Homonyme oder bedeutungsgleiche Wörter als "falsche"
  // Option neben der richtigen erscheinen. pickDistractors() filtert das jetzt heraus, bleibt
  // aber rückwärtskompatibel: bei einem zu kleinen/ungeeigneten Pool wird kontrolliert auf
  // weniger strenge Kriterien bzw. weniger Optionen zurückgefallen, statt abzustürzen oder eine
  // Aufgabe mit zu wenigen Buttons zu erzwingen.
  //
  // Ein Kandidat gilt als GUTER Distraktor, wenn er sich vom Zielwort unterscheidet in:
  // - Wort-ID (immer vorausgesetzt, wird vom Aufrufer bereits gefiltert)
  // - angezeigter arabischer Form (arabic_vocalized/arabic)
  // - unvokalisierter arabischer Form (arabic_unvocalized) -- deckt auch Homonyme ab, die per
  //   Definition dieselbe unvokalisierte Form teilen
  // - homonym_group (falls bei beiden gesetzt und identisch -- zusätzliche Absicherung für den
  //   seltenen Fall unterschiedlich geschriebener, aber als Homonym-Paar markierter Wörter)
  // - der Menge akzeptierter deutscher Bedeutungen (kein vollständiger Bedeutungs-Overlap, damit
  //   kein Synonym des Zielworts als "falsche" Option erscheint)
  function isAcceptableDistractor(word, candidate) {
    if (candidate.id === word.id) return false;
    const wordArabic = word.arabic_vocalized || word.arabic;
    const candidateArabic = candidate.arabic_vocalized || candidate.arabic;
    if (wordArabic && candidateArabic && wordArabic === candidateArabic) return false;
    if (word.arabic_unvocalized && candidate.arabic_unvocalized && word.arabic_unvocalized === candidate.arabic_unvocalized) return false;
    if (word.homonym_group && candidate.homonym_group && word.homonym_group === candidate.homonym_group) return false;
    const wordMeanings = germanAnswers(word).map((s) => (s || '').trim().toLowerCase()).filter(Boolean);
    const candidateMeanings = new Set(germanAnswers(candidate).map((s) => (s || '').trim().toLowerCase()).filter(Boolean));
    if (wordMeanings.length > 0 && wordMeanings.every((m) => candidateMeanings.has(m))) return false;
    return true;
  }

  // Liefert bis zu `count` Distraktoren aus `allWords` (ohne `word` selbst). Bevorzugt Kandidaten,
  // die isAcceptableDistractor() erfüllen; reicht der strenge Pool nicht aus, werden die
  // übrigen (weniger geeigneten, aber immerhin unterschiedlichen) Kandidaten aufgefüllt, damit
  // die Aufgabe auch bei einem kleinen/ungünstigen Session-Wortpool nie abstürzt oder mit zu
  // wenigen Optionen hängen bleibt -- im Zweifel lieber ein nicht perfekter Distraktor als eine
  // Aufgabe mit weniger als der gewünschten Optionsanzahl, wenn der Pool das nicht hergibt.
  function pickDistractors(word, allWords, count) {
    const others = allWords.filter((w) => w.id !== word.id);
    const good = pickRandomOrder(others.filter((w) => isAcceptableDistractor(word, w)));
    if (good.length >= count) return good.slice(0, count);
    const goodIds = new Set(good.map((w) => w.id));
    const rest = pickRandomOrder(others.filter((w) => !goodIds.has(w.id)));
    return [...good, ...rest].slice(0, count);
  }
  function arabicAnswers(word) {
    return Array.isArray(word.accepted_arabic_answers) && word.accepted_arabic_answers.length > 0
      ? word.accepted_arabic_answers
      : [word.arabic];
  }
  function primaryGerman(word) {
    return germanAnswers(word)[0];
  }
  function checkArabicInput(word, given) {
    return evaluateAgainstAny(arabicAnswers(word), given, evaluateArabicAnswer);
  }
  function checkGermanInput(word, given) {
    return evaluateAgainstAny(germanAnswers(word), given, evaluateGermanAnswer);
  }

  // --- Hilfestufen-/Einstellungs-gesteuerte Anzeige (Abschnitt 9 + 21) ------------------------
  function displayConfig(ctx) {
    const help = ctx.helpConfig || {};
    const settings = ctx.settings || {};
    return {
      // showDiacritics-Einstellung darf Vokalzeichen zusätzlich ausblenden, außer die Aufgabe
      // trainiert Vokalzeichen ausdrücklich (freeInput=false Stufen zeigen sie ohnehin voll).
      showDiacritics: help.showDiacritics === 'full' ? (settings.showDiacritics !== false) : !!help.showDiacritics,
      // Hilfestufen dürfen die Umschrift zusätzlich entfernen (Abschnitt 21): nur sichtbar, wenn
      // BEIDE — Einstellung UND Hilfestufe — sie erlauben.
      showTransliteration: settings.showTransliteration !== false && !!help.showTransliteration,
      showTranslation: help.showTranslation !== false,
      keyboardLevel: help.keyboardLevel || 3
    };
  }

  function arabicDisplay(word, cfg) {
    const full = word.arabic_vocalized || word.arabic;
    if (cfg.showDiacritics) return full;
    return normalizeArabic(full, { stripDiacritics: true });
  }

  // --- Wiedererkennen: Arabisch -> passende deutsche Bedeutung auswählen ---------------------
  function renderMultipleChoice(container, ctx, guard, onDone) {
    const { word, allWords } = ctx;
    const cfg = displayConfig(ctx);
    const distractors = pickDistractors(word, allWords, 3);
    const options = pickRandomOrder([word, ...distractors]);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card flashcard' });
    card.appendChild(el('p', { className: 'lead', text: 'Was bedeutet dieser Ausdruck?' }));
    card.appendChild(el('p', { className: 'arabic-word-main', text: arabicDisplay(word, cfg) }));
    if (cfg.showTransliteration && word.transliteration) {
      card.appendChild(el('p', { className: 'text-hint', text: word.transliteration }));
    }
    const optionsWrap = el('div', { className: 'rating-buttons' });
    const feedback = feedbackNode();
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary', text: primaryGerman(opt) });
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = opt.id === word.id;
        feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${primaryGerman(word)}`;
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

  // --- Mini-Check-Variante: Deutsch -> passendes arabisches Wort auswählen --------------------
  function renderGermanToArabicChoice(container, ctx, guard, onDone) {
    const { word, allWords } = ctx;
    const cfg = displayConfig(ctx);
    const distractors = pickDistractors(word, allWords, 3);
    const options = pickRandomOrder([word, ...distractors]);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card flashcard' });
    card.appendChild(el('p', { className: 'lead', text: 'Welcher Ausdruck bedeutet das?' }));
    card.appendChild(el('p', { className: 'text-body', text: primaryGerman(word) }));
    const optionsWrap = el('div', { className: 'rating-buttons' });
    const feedback = feedbackNode();
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary arabic-text', text: arabicDisplay(opt, cfg) });
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = opt.id === word.id;
        feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${word.arabic} (${primaryGerman(word)})`;
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

  // --- Mini-Check-Variante: Audio hören -> passendes Wort auswählen ---------------------------
  function renderAudioToWordChoice(container, ctx, guard, onDone) {
    const { word, allWords } = ctx;
    const cfg = displayConfig(ctx);
    const distractors = pickDistractors(word, allWords, 3);
    const options = pickRandomOrder([word, ...distractors]);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card flashcard' });
    card.appendChild(el('p', { className: 'lead', text: 'Höre zu und wähle das richtige Wort.' }));
    const playBtn = el('button', { className: 'btn icon', text: '🔊' });
    playBtn.type = 'button';
    playBtn.setAttribute('aria-label', 'Audio abspielen');
    playBtn.addEventListener('click', () => AudioPlayer.speakWord(word, { context: 'Hörübung', button: playBtn }));
    card.appendChild(playBtn);
    if (ctx.settings && ctx.settings.autoPlayWord) {
      AudioPlayer.speakWord(word, { context: 'Hörübung (automatisch)' });
    }
    const optionsWrap = el('div', { className: 'rating-buttons' });
    const feedback = feedbackNode();
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary arabic-text', text: arabicDisplay(opt, cfg) });
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = opt.id === word.id;
        feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${word.arabic} (${primaryGerman(word)})`;
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

  // --- Mini-Check-Variante: Wort sehen -> zugehöriges Audio unter mehreren erkennen -----------
  function renderWordToAudioChoice(container, ctx, guard, onDone) {
    const { word, allWords } = ctx;
    const cfg = displayConfig(ctx);
    const distractors = pickDistractors(word, allWords, 3);
    const options = pickRandomOrder([word, ...distractors]);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card flashcard' });
    card.appendChild(el('p', { className: 'lead', text: 'Welche Audioaufnahme gehört zu diesem Wort?' }));
    card.appendChild(el('p', { className: 'arabic-word-main', text: arabicDisplay(word, cfg) }));
    card.appendChild(el('p', { className: 'text-hint', text: 'Klicke auf die passende Wiedergabe.' }));
    const optionsWrap = el('div', { className: 'rating-buttons' });
    const feedback = feedbackNode();
    options.forEach((opt, i) => {
      const btn = el('button', { className: 'btn secondary', text: `🔊 Option ${i + 1}` });
      btn.type = 'button';
      btn.setAttribute('aria-label', `Option ${i + 1} abspielen`);
      btn.addEventListener('click', () => {
        AudioPlayer.speakWord(opt, { context: 'Hörübung (Option)' });
        if (!guard.submit()) return;
        const correct = opt.id === word.id;
        feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Das war eine andere Aufnahme.`;
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
      // Enthält ein Zeichen außerhalb der 28 Grundbuchstaben (z. B. Hamza-Formen wie أ/إ/آ, die
      // als eigene Sondertasten geführt werden, nicht als Grundbuchstabe) — trotzdem sinnvoll in
      // einzelne Zeichen zerlegen, statt das ganze Wort als ein einziges, nicht sortierbares
      // Element zu behandeln (sonst entsteht eine Aufgabe mit nur einer einzigen Kachel).
      if (plain.length > 1) return { pieces: Array.from(plain), joiner: '' };
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
    card.appendChild(el('p', { className: 'lead', text: `Bringe „${primaryGerman(word)}" in die richtige Reihenfolge:` }));
    const built = el('div', { className: 'arabic-word-main' });
    built.dir = 'rtl';
    built.style.minHeight = '2.5em';
    built.style.border = '1px solid var(--border)';
    built.style.borderRadius = 'var(--radius)';
    built.style.padding = '6px 12px';
    card.appendChild(built);
    const tilesWrap = el('div', { className: 'rating-buttons' });
    card.appendChild(tilesWrap);
    const resetBtn = el('button', { className: 'btn secondary', text: 'Zurücksetzen' });
    resetBtn.type = 'button';
    resetBtn.style.marginTop = '12px';
    card.appendChild(resetBtn);
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

    if (ctx.provideCheckAction) {
      ctx.provideCheckAction(() => {
        if (!guard.submit()) return;
        const attempt = picked.map((idx) => shuffled[idx].text).join(joiner);
        const correct = attempt === target;
        feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${target}`;
        feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
        guard.showFeedback();
        onDone(correct, { feedbackShown: true, errorExplanation: correct ? null : `Erwartete Reihenfolge: ${target}. Deine Reihenfolge: ${attempt || '(leer)'}.` });
      });
    }
  }

  // --- Produktion: Wort über die virtuelle Tastatur schreiben (geführt/selbstständig) ---------
  function renderTyping(container, ctx, guard, onDone) {
    const { word, helpConfig, showHint } = ctx;
    const cfg = displayConfig(ctx);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card' });
    card.appendChild(el('p', {
      className: 'lead',
      text: showHint ? `Schreibe: ${primaryGerman(word)} (${arabicDisplay(word, cfg)})` : `Schreibe: ${primaryGerman(word)}`
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
    const feedback = feedbackNode();
    card.appendChild(feedback);
    container.appendChild(card);

    VirtualKeyboard.mount(keyboardWrap, input, {
      showDiacritics: true,
      showSpecial: true,
      keyboardLevel: helpConfig.keyboardLevel,
      expectedWord: showHint ? normalizeArabic(word.arabic) : null
    });

    if (ctx.provideCheckAction) {
      ctx.provideCheckAction(() => {
        if (!guard.submit()) return;
        const result = checkArabicInput(word, input.value.trim());
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics' || result === 'correct';
        feedback.textContent = isCorrect
          ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
          : `Nicht ganz. Richtig wäre: ${word.arabic}`;
        feedback.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        guard.showFeedback();
        onDone(isCorrect, {
          feedbackShown: true,
          result,
          errorExplanation: isCorrect ? null : `Erwartet: ${word.arabic}${word.transliteration ? ` (${word.transliteration})` : ''}. Deine Eingabe: ${input.value.trim() || '(leer)'}.` +
            (result === 'typo' ? ' Das sieht nach einem kleinen Tippfehler aus.' : '')
        });
      });
    }
  }

  // --- Anwendung: passendes Wort zu einer kurzen Situationsbeschreibung wählen ----------------
  // Vollständig datenbasiert (Abschnitt 19) — KEINE Wort-ID mehr hart codiert. Nutzt
  // word.application_prompts (siehe vocabulary.json), fällt bei fehlenden Daten auf die deutsche
  // Bedeutung als Kontext zurück, statt abzustürzen.
  function applicationPromptFor(word) {
    if (Array.isArray(word.application_prompts) && word.application_prompts.length > 0) {
      return pickRandomOrder(word.application_prompts)[0];
    }
    return { prompt: primaryGerman(word), expected_meaning: primaryGerman(word) };
  }

  function renderContextualChoice(container, ctx, guard, onDone) {
    const { word, allWords } = ctx;
    const cfg = displayConfig(ctx);
    const promptData = applicationPromptFor(word);
    const distractors = pickDistractors(word, allWords, 3);
    const options = pickRandomOrder([word, ...distractors]);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card flashcard' });
    card.appendChild(el('p', { className: 'lead', text: promptData.prompt }));
    card.appendChild(el('p', { className: 'text-hint', text: 'Welcher Ausdruck passt am besten?' }));
    const optionsWrap = el('div', { className: 'rating-buttons' });
    const feedback = feedbackNode();
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary arabic-text', text: arabicDisplay(opt, cfg) });
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (!guard.submit()) return;
        const correct = opt.id === word.id;
        feedback.textContent = correct ? 'Richtig!' : `Nicht ganz. Richtig wäre: ${word.arabic} (${primaryGerman(word)})`;
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
    german_to_arabic_choice: renderGermanToArabicChoice,
    audio_to_word_choice: renderAudioToWordChoice,
    word_to_audio_choice: renderWordToAudioChoice,
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

  // Die vier leichten Mini-Check-Typen aus Abschnitt 5 (noch keine freie Tastatureingabe).
  const MINI_CHECK_TYPES = ['multiple_choice', 'german_to_arabic_choice', 'audio_to_word_choice', 'word_to_audio_choice'];

  function render(exerciseType, container, ctx, guard, onDone) {
    const renderer = RENDERERS[exerciseType];
    if (!renderer) {
      console.warn(`ExerciseRegistry: unbekannter Übungstyp "${exerciseType}" — übersprungen.`); // eslint-disable-line no-console
      onDone(true, { skipped: true });
      return;
    }
    renderer(container, ctx, guard, onDone);
  }

  return {
    render, PHASE_EXERCISE_TYPE, MINI_CHECK_TYPES, RENDERERS,
    primaryGerman, germanAnswers, arabicAnswers, checkArabicInput, checkGermanInput, displayConfig, arabicDisplay,
    isAcceptableDistractor, pickDistractors
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExerciseRegistry;
}
