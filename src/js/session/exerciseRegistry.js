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

  // Entwicklungsauftrag 17, Abschnitt 3/26: die Auswahlaufgaben setzen seit diesem Auftrag KEINEN
  // eigenen Feedbacktext mehr direkt -- sie melden nur noch, WAS ausgewählt wurde
  // (detail.selectedOption) und in welche "Richtung" die Aufgabe zeigt (detail.domain:
  // 'arabic_word' bei arabischer Zielantwort, 'german_meaning' bei deutscher). Das gemeinsame
  // Feedbacksystem (sessionController.js + feedback/*) baut daraus die vollständige, erklärende
  // Darstellung (Abschnitt 5-8). Die Korrektheit (`correct`) bleibt unverändert dieselbe simple
  // ID-Prüfung wie zuvor -- keine zweite Bewertungsinstanz (Abschnitt 22).
  function choiceHandler(guard, onDone, word, opt, domain, extra) {
    if (!guard.submit()) return;
    const correct = opt.id === word.id;
    guard.showFeedback();
    onDone(correct, { feedbackShown: true, selectedOption: opt, domain, ...extra });
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
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary', text: primaryGerman(opt) });
      btn.type = 'button';
      btn.addEventListener('click', () => choiceHandler(guard, onDone, word, opt, 'german_meaning'));
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);
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
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary arabic-text', text: arabicDisplay(opt, cfg) });
      btn.type = 'button';
      btn.addEventListener('click', () => choiceHandler(guard, onDone, word, opt, 'arabic_word'));
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);
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
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary arabic-text', text: arabicDisplay(opt, cfg) });
      btn.type = 'button';
      btn.addEventListener('click', () => choiceHandler(guard, onDone, word, opt, 'arabic_word'));
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);
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
    options.forEach((opt, i) => {
      const btn = el('button', { className: 'btn secondary', text: `🔊 Option ${i + 1}` });
      btn.type = 'button';
      btn.setAttribute('aria-label', `Option ${i + 1} abspielen`);
      btn.addEventListener('click', () => {
        AudioPlayer.speakWord(opt, { context: 'Hörübung (Option)' });
        choiceHandler(guard, onDone, word, opt, 'arabic_word');
      });
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);
    container.appendChild(card);
  }

  // --- Mini-Check-Variante: Audio hören -> passende deutsche Bedeutung auswählen
  // (Entwicklungsauftrag 16, Abschnitt 6.1 -- ergänzt die bereits vorhandenen vier
  // Wiedererkennen-Typen um die fünfte, bisher fehlende Kombination "Audio -> Bedeutung"). --------
  function renderAudioToMeaningChoice(container, ctx, guard, onDone) {
    const { word, allWords } = ctx;
    const distractors = pickDistractors(word, allWords, 3);
    const options = pickRandomOrder([word, ...distractors]);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card flashcard' });
    card.appendChild(el('p', { className: 'lead', text: 'Höre zu und wähle die richtige Bedeutung.' }));
    const playBtn = el('button', { className: 'btn icon', text: '🔊' });
    playBtn.type = 'button';
    playBtn.setAttribute('aria-label', 'Audio abspielen');
    playBtn.addEventListener('click', () => AudioPlayer.speakWord(word, { context: 'Hörübung', button: playBtn }));
    card.appendChild(playBtn);
    // Abschnitt 6.4: bei visuellen Übersetzungsaufgaben darf Audio die Lösung nicht verraten --
    // hier IST das Audio die Aufgabenstellung selbst, automatisches Abspielen ist also erlaubt.
    if (ctx.settings && ctx.settings.autoPlayWord) {
      AudioPlayer.speakWord(word, { context: 'Hörübung (automatisch)' });
    }
    const optionsWrap = el('div', { className: 'rating-buttons' });
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary', text: primaryGerman(opt) });
      btn.type = 'button';
      btn.addEventListener('click', () => choiceHandler(guard, onDone, word, opt, 'german_meaning'));
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);
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
    const inputArea = el('div', { className: 'session-input-area' });
    const tilesWrap = el('div', { className: 'rating-buttons' });
    inputArea.appendChild(tilesWrap);
    const resetBtn = el('button', { className: 'btn secondary', text: 'Zurücksetzen' });
    resetBtn.type = 'button';
    resetBtn.style.marginTop = '12px';
    inputArea.appendChild(resetBtn);
    card.appendChild(inputArea);
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
        guard.showFeedback();
        // Entwicklungsauftrag 17, Abschnitt 20: Eingabehilfen (hier: Kacheln + Zurücksetzen) nach
        // der Abgabe kompakt einklappen, statt weiter Platz zu beanspruchen.
        inputArea.classList.add('session-input-collapsed');
        onDone(correct, { feedbackShown: true, submittedAnswer: attempt, expectedForm: target });
      });
    }
  }

  // --- Produktion: Wort über die virtuelle Tastatur schreiben (geführt/selbstständig) ---------
  // Entwicklungsauftrag 16, Abschnitt 9.3: ctx.dictation=true rendert eine Audiodiktat-Variante
  // für Stufe 9 ("Freies Schreiben") -- Audio IST hier die Aufgabenstellung und darf deshalb vor
  // der Antwort abgespielt werden; die deutsche Bedeutung erscheint dabei ERST im Feedback, nicht
  // vorher (Abschnitt 9.1: keine automatische Audioausgabe bei Deutsch-zu-Arabisch, aber ein
  // Diktat ist per Definition kein Deutsch-zu-Arabisch-Prompt).
  function renderTyping(container, ctx, guard, onDone) {
    const { word, helpConfig, showHint, dictation } = ctx;
    const cfg = displayConfig(ctx);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card' });
    if (dictation) {
      card.appendChild(el('p', { className: 'lead', text: 'Höre zu und schreibe das Wort auf Arabisch.' }));
      const playBtn = el('button', { className: 'btn icon', text: '🔊' });
      playBtn.type = 'button';
      playBtn.setAttribute('aria-label', 'Diktat abspielen');
      playBtn.addEventListener('click', () => AudioPlayer.speakWord(word, { context: 'Audiodiktat', button: playBtn }));
      card.appendChild(playBtn);
      if (ctx.settings && ctx.settings.autoPlayWord) {
        AudioPlayer.speakWord(word, { context: 'Audiodiktat (automatisch)' });
      }
    } else {
      card.appendChild(el('p', {
        className: 'lead',
        text: showHint ? `Schreibe: ${primaryGerman(word)} (${arabicDisplay(word, cfg)})` : `Schreibe: ${primaryGerman(word)}`
      }));
    }
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input arabic-text';
    input.dir = 'rtl';
    input.style.maxWidth = '360px';
    input.style.margin = '0 auto 12px';
    input.style.display = 'block';
    card.appendChild(input);
    const keyboardWrap = el('div', { className: 'session-input-area' });
    card.appendChild(keyboardWrap);
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
        guard.showFeedback();
        // Entwicklungsauftrag 17, Abschnitt 20: virtuelle Tastatur nach der Abgabe kompakt
        // einklappen, statt weiter Platz für das jetzt folgende Feedback wegzunehmen.
        keyboardWrap.classList.add('session-input-collapsed');
        onDone(isCorrect, { feedbackShown: true, result, submittedAnswer: input.value.trim(), dictation: !!dictation });
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
    options.forEach((opt) => {
      const btn = el('button', { className: 'btn secondary arabic-text', text: arabicDisplay(opt, cfg) });
      btn.type = 'button';
      btn.addEventListener('click', () => choiceHandler(guard, onDone, word, opt, 'arabic_word', { prompt: promptData.prompt }));
      optionsWrap.appendChild(btn);
    });
    card.appendChild(optionsWrap);
    container.appendChild(card);
  }

  // --- Zuordnungsaufgaben (Entwicklungsauftrag 16, Stufe 7, Abschnitt 7) -----------------------
  // Anders als die übrigen Übungstypen bearbeitet EINE Zuordnungsaufgabe eine ganze GRUPPE von
  // 4-5 Wörtern gleichzeitig (ctx.groupWords), nicht nur ein einzelnes ctx.word. Bedienung:
  // erst ein Element (links ODER rechts, beide Reihenfolgen erlaubt) auswählen, dann das
  // vermeintlich passende Gegenstück auf der jeweils anderen Seite -- reine Klick-/Tastatur-
  // Bedienung über echte <button>-Elemente, kein Drag-and-drop nötig (Abschnitt 7.2/25 "keine
  // reine Drag-and-drop-Zuordnung"). Richtige Paare werden gesperrt und bleiben sichtbar; ein
  // falscher Versuch löst erneut lösbare Selektion aus, zählt aber je Wort nur EINMAL als Fehler
  // (Abschnitt 7.4 "Fehler nur einmal pro erstem Fehlversuch bewerten").
  //
  // Vier Varianten (Abschnitt 7.1), pro GRUPPE einheitlich gewählt vom Aufrufer (ctx.variant):
  // - arabic_german: links arabische Form, rechts deutsche Bedeutung
  // - audio_arabic:  links Audio (anonym, "Ton N"), rechts arabische Form
  // - audio_meaning: links Audio (anonym, "Ton N"), rechts deutsche Bedeutung
  // - context_word:  links Anwendungssituation (word.application_prompts, Besitzerwort-Regel
  //                  unverändert -- Abschnitt 7.5, keine neuen Kontexttexte), rechts arabische Form
  function matchingSideLabel(word, side, variant, index, cfg) {
    if (variant === 'arabic_german') {
      return side === 'left'
        ? { text: word.arabic_vocalized || word.arabic, className: 'btn secondary arabic-text', ariaLabel: `Arabisches Wort: ${arabicDisplay(word, cfg)}` }
        : { text: primaryGerman(word), className: 'btn secondary', ariaLabel: `Bedeutung: ${primaryGerman(word)}` };
    }
    if (variant === 'audio_arabic' || variant === 'audio_meaning') {
      if (side === 'left') {
        // Bewusst ANONYM (Abschnitt 7.3: "keine Lösung in Screenreader-Beschriftungen
        // verraten") -- welches Wort hinter "Ton N" steckt, ist ja gerade die Aufgabe.
        return { text: `🔊 Ton ${index + 1}`, className: 'btn secondary', ariaLabel: `Ton ${index + 1} abspielen`, isAudio: true };
      }
      return variant === 'audio_arabic'
        ? { text: word.arabic_vocalized || word.arabic, className: 'btn secondary arabic-text', ariaLabel: `Arabisches Wort: ${arabicDisplay(word, cfg)}` }
        : { text: primaryGerman(word), className: 'btn secondary', ariaLabel: `Bedeutung: ${primaryGerman(word)}` };
    }
    // context_word
    if (side === 'left') {
      const prompt = applicationPromptFor(word);
      return { text: prompt.prompt, className: 'btn secondary matching-context', ariaLabel: `Situation: ${prompt.prompt}` };
    }
    return { text: word.arabic_vocalized || word.arabic, className: 'btn secondary arabic-text', ariaLabel: `Arabisches Wort: ${arabicDisplay(word, cfg)}` };
  }

  /**
   * @param {object} ctx
   * @param {object[]} ctx.groupWords
   * @param {string} ctx.variant
   * @param {string[]} [ctx.alreadySolvedWordIds] - Entwicklungsauftrag 16, Abschnitt 16: nach
   *   einer Wiederaufnahme bereits gelöste Paare dieser Gruppe -- werden sofort gesperrt
   *   dargestellt, statt erneut gelöst werden zu müssen.
   * @param {string[]} [ctx.alreadyErroredWordIds] - Wörter, die vor der Wiederaufnahme bereits
   *   einen ersten Fehlversuch hatten (Abschnitt 7.4: zählt nur einmal, auch über einen Neustart
   *   hinweg).
   * @param {(state:{lockedWordIds:string[], erroredWordIds:string[]})=>void} [ctx.onProgress] -
   *   feuert nach JEDEM Versuch (richtig oder falsch) mit dem aktuellen Zwischenstand, damit der
   *   Aufrufer ihn dauerhaft speichern kann (Abschnitt 16: "Zuordnungsgruppen, bereits gelöste
   *   Paare, erster Fehlversuch je Paar" gehören zum Mindestumfang der Speicherung).
   */
  function renderMatching(container, ctx, guard, onDone) {
    const { groupWords, variant, alreadySolvedWordIds, alreadyErroredWordIds, onProgress } = ctx;
    const cfg = displayConfig(ctx);
    const leftOrder = groupWords;
    const rightOrder = pickRandomOrder(groupWords);

    while (container.firstChild) container.removeChild(container.firstChild);
    const card = el('div', { className: 'card matching-card' });
    card.appendChild(el('p', { className: 'lead', text: 'Ordne die passenden Paare einander zu.' }));
    const grid = el('div', { className: 'matching-grid' });
    const leftCol = el('div', { className: 'matching-column', text: undefined });
    leftCol.setAttribute('role', 'group');
    leftCol.setAttribute('aria-label', 'Linke Spalte');
    const rightCol = el('div', { className: 'matching-column' });
    rightCol.setAttribute('role', 'group');
    rightCol.setAttribute('aria-label', 'Rechte Spalte');
    grid.appendChild(leftCol);
    grid.appendChild(rightCol);
    card.appendChild(grid);
    const feedback = feedbackNode();
    card.appendChild(feedback);
    container.appendChild(card);

    let selected = null; // { side: 'left'|'right', wordId, btn }
    const locked = new Set(alreadySolvedWordIds || []);
    const firstErrorSeen = new Set(alreadyErroredWordIds || []);
    const perWordCorrect = {};
    for (const id of locked) perWordCorrect[id] = !firstErrorSeen.has(id);
    const buttonsByKey = {}; // `${side}:${wordId}` -> button element

    function setFeedback(text, cls) {
      feedback.textContent = text;
      feedback.className = `feedback ${cls || ''}`.trim();
    }

    function clearSelection() {
      if (selected) selected.btn.setAttribute('aria-pressed', 'false');
      selected = null;
    }

    function reportProgress() {
      if (onProgress) onProgress({ lockedWordIds: [...locked], erroredWordIds: [...firstErrorSeen] });
    }

    function applyLockedVisual(wordId) {
      for (const side of ['left', 'right']) {
        const btn = buttonsByKey[`${side}:${wordId}`];
        if (!btn) continue;
        btn.disabled = true;
        btn.classList.add('matched');
        // Status nicht nur über Farbe (Abschnitt 7.3/19): zusätzliches Symbol + Text im aria-label.
        if (!btn.getAttribute('aria-label').includes('richtig zugeordnet')) {
          btn.setAttribute('aria-label', `${btn.getAttribute('aria-label')} — richtig zugeordnet`);
        }
        if (!btn.querySelector || !btn.textContent.includes('✓')) {
          const check = el('span', { className: 'matching-check', text: ' ✓' });
          check.setAttribute('aria-hidden', 'true');
          btn.appendChild(check);
        }
      }
    }

    function lockPair(wordId) {
      locked.add(wordId);
      applyLockedVisual(wordId);
    }

    function attemptMatch(a, b) {
      const correct = a.wordId === b.wordId;
      // clearSelection() setzt nur den ZUERST ausgewählten Button (a, = "selected") zurück --
      // b (der zweite, gerade angeklickte Button, der den Versuch erst ausgelöst hat) bekam sein
      // aria-pressed="true" direkt im Klick-Handler gesetzt und wurde hier nie zurückgesetzt,
      // sodass er nach einem Fehlversuch dauerhaft optisch "ausgewählt" blieb (gefunden bei der
      // visuellen Verifikation zu Entwicklungsauftrag 16). Beide Seiten müssen zurückgesetzt
      // werden, unabhängig vom Ergebnis.
      b.btn.setAttribute('aria-pressed', 'false');
      if (correct) {
        if (!(a.wordId in perWordCorrect)) perWordCorrect[a.wordId] = !firstErrorSeen.has(a.wordId);
        lockPair(a.wordId);
        setFeedback('Richtig zugeordnet!', 'correct');
        clearSelection();
        reportProgress();
        if (locked.size === groupWords.length) {
          if (!guard.submit()) return;
          guard.showFeedback();
          // Entwicklungsauftrag 17, Abschnitt 13: das Abschlussfeedback der Gruppe (mit
          // Paarübersicht + Markierung erster Fehlversuche) baut sessionController.js über das
          // gemeinsame Feedbacksystem -- dafür braucht es hier zusätzlich erroredWordIds.
          onDone(Object.values(perWordCorrect).every(Boolean), {
            feedbackShown: true, perWordCorrect, groupSize: groupWords.length, erroredWordIds: [...firstErrorSeen]
          });
        }
      } else {
        firstErrorSeen.add(a.wordId);
        firstErrorSeen.add(b.wordId);
        // Entwicklungsauftrag 17, Abschnitt 7.8: kurze Rückmeldung WÄHREND der Aufgabe, darf nicht
        // sofort alle Lösungen verraten -- bleibt bewusst eine einfache Inline-Meldung, NICHT das
        // vollständige Feedbacksystem (das kommt erst nach Abschluss der ganzen Gruppe, s. o.).
        setFeedback('Diese beiden Elemente gehören nicht zusammen. Versuche es erneut.', 'wrong');
        clearSelection();
        reportProgress();
      }
    }

    function mkColumnButton(side, item, index) {
      const info = matchingSideLabel(item, side, variant, index, cfg);
      const btn = el('button', { className: info.className, text: info.text });
      btn.type = 'button';
      btn.setAttribute('aria-label', info.ariaLabel);
      btn.setAttribute('aria-pressed', 'false');
      buttonsByKey[`${side}:${item.id}`] = btn;
      btn.addEventListener('click', () => {
        if (!guard.canSubmit() || locked.has(item.id)) return;
        if (info.isAudio) AudioPlayer.speakWord(item, { context: 'Zuordnungsaufgabe', button: null });
        const current = { side, wordId: item.id, btn };
        if (!selected) {
          selected = current;
          btn.setAttribute('aria-pressed', 'true');
          return;
        }
        if (selected.side === side) {
          // Auswahl auf derselben Seite ersetzt die vorherige, statt einen Fehlversuch auszulösen.
          selected.btn.setAttribute('aria-pressed', 'false');
          selected = current;
          btn.setAttribute('aria-pressed', 'true');
          return;
        }
        btn.setAttribute('aria-pressed', 'true');
        attemptMatch(selected, current);
      });
      return btn;
    }

    leftOrder.forEach((w, i) => leftCol.appendChild(mkColumnButton('left', w, i)));
    rightOrder.forEach((w, i) => rightCol.appendChild(mkColumnButton('right', w, i)));

    // Nach Wiederaufnahme (Abschnitt 16/20): bereits gelöste Paare sofort gesperrt darstellen,
    // statt sie erneut lösen zu müssen. War die Gruppe bereits VOLLSTÄNDIG gelöst (z. B. ein
    // Neustart direkt nach dem letzten Paar, bevor "Weiter" geklickt wurde), sofort abschließen.
    for (const wordId of locked) applyLockedVisual(wordId);
    if (locked.size === groupWords.length && groupWords.length > 0) {
      if (guard.submit()) {
        guard.showFeedback();
        onDone(Object.values(perWordCorrect).every(Boolean), {
          feedbackShown: true, perWordCorrect, groupSize: groupWords.length, erroredWordIds: [...firstErrorSeen], resumedComplete: true
        });
      }
    }
  }

  const RENDERERS = {
    multiple_choice: renderMultipleChoice,
    german_to_arabic_choice: renderGermanToArabicChoice,
    audio_to_word_choice: renderAudioToWordChoice,
    word_to_audio_choice: renderWordToAudioChoice,
    audio_to_meaning_choice: renderAudioToMeaningChoice,
    order_pieces: renderOrderPieces,
    guided_typing: (container, ctx, guard, onDone) => renderTyping(container, { ...ctx, showHint: true }, guard, onDone),
    independent_typing: (container, ctx, guard, onDone) => renderTyping(container, { ...ctx, showHint: false }, guard, onDone),
    independent_typing_dictation: (container, ctx, guard, onDone) => renderTyping(container, { ...ctx, showHint: false, dictation: true }, guard, onDone),
    contextual_choice: renderContextualChoice,
    matching: renderMatching
  };

  // Phase -> Standard-Übungstyp als Rückfallwert, falls eine Aufgabe (untypisch) kein eigenes
  // task.exerciseType mitbringt. Entwicklungsauftrag 16: SessionEngine weist den TATSÄCHLICHEN
  // Typ normalerweise pro AUFGABE zu (recognition mischt fünf Typen, guided_writing hat zwei
  // Unteraufgaben-Typen, ein Teil von independent_writing nutzt die Diktat-Variante) -- diese
  // Tabelle ist nur noch das Sicherheitsnetz, keine 1:1-Zuordnung mehr wie vor diesem Auftrag.
  const PHASE_EXERCISE_TYPE = {
    recognition: 'multiple_choice',
    matching: 'matching',
    guided_writing: 'guided_typing',
    independent_writing: 'independent_typing'
  };

  // Die fünf leichten Wiedererkennen-Typen für Stufe 6 (Entwicklungsauftrag 16, Abschnitt 6.1) --
  // noch keine freie Tastatureingabe. MINI_CHECK_TYPES (ohne audio_to_meaning_choice) bleibt aus
  // Entwicklungsauftrag 5 als eigenständige, weiterhin gültige Teilmenge erhalten.
  const MINI_CHECK_TYPES = ['multiple_choice', 'german_to_arabic_choice', 'audio_to_word_choice', 'word_to_audio_choice'];
  const RECOGNITION_TYPES = ['multiple_choice', 'german_to_arabic_choice', 'audio_to_word_choice', 'audio_to_meaning_choice', 'word_to_audio_choice'];
  const MATCHING_VARIANTS = ['arabic_german', 'audio_arabic', 'audio_meaning', 'context_word'];

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
    render, PHASE_EXERCISE_TYPE, MINI_CHECK_TYPES, RECOGNITION_TYPES, MATCHING_VARIANTS, RENDERERS,
    primaryGerman, germanAnswers, arabicAnswers, checkArabicInput, checkGermanInput, displayConfig, arabicDisplay,
    isAcceptableDistractor, pickDistractors, applicationPromptFor
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExerciseRegistry;
}
