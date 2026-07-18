// Lektion 4: Grundgrammatik I (Spec-Kapitel "Lektion 4").
// Bewusst auf 4 gut abgesicherte Themen begrenzt (bestimmter Artikel, Personalpronomen,
// Demonstrativpronomen mit Genus-Kongruenz, einfache Nominalsätze mit Adjektiv-Kongruenz) —
// siehe Hinweis in grammar.json zu ausgesparten Hamza-Feinheiten bei anderen Themen.

const GrammarView = (() => {
  let sections = [];
  let vocabulary = [];
  let sectionIndex = 0;
  let container = null;

  function foodWords() {
    return vocabulary.find((c) => c.id === 'food_drink').words;
  }

  function familyWords() {
    return vocabulary.find((c) => c.id === 'family').words;
  }

  function pickRandom(arr, n) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }

  function renderSectionShell(section, bodyHtml) {
    container.innerHTML = `
      <div class="view">
        <h1>${section.title}</h1>
        <p class="lead">${section.explanation}</p>
        <div id="grammar-section-body">${bodyHtml}</div>
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn secondary" id="grammar-back" ${sectionIndex === 0 ? 'disabled' : ''}>Zurück</button>
          <button class="btn" id="grammar-next">${sectionIndex === sections.length - 1 ? 'Fertig' : 'Weiter'}</button>
        </div>
        <p class="flashcard-progress">Thema ${sectionIndex + 1} / ${sections.length}</p>
      </div>
    `;
    container.querySelector('#grammar-back').addEventListener('click', () => {
      if (sectionIndex > 0) { sectionIndex -= 1; renderCurrentSection(); }
    });
    container.querySelector('#grammar-next').addEventListener('click', () => {
      if (sectionIndex < sections.length - 1) { sectionIndex += 1; renderCurrentSection(); }
      else { App.navigateTo('vocabulary_1'); }
    });
    return container.querySelector('#grammar-section-body');
  }

  // --- Abschnitt A: Bestimmter Artikel ---
  function renderDefiniteArticle(section) {
    const words = pickRandom(foodWords(), 4);
    let index = 0;

    function renderTask(body) {
      if (index >= words.length) {
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      const word = words[index];
      body.innerHTML = `
        <div class="card">
          <p>Beispiel: <span class="arabic-text">${section.example.indefinite}</span> (${section.example.indefinite_meaning}) → <span class="arabic-text">${section.example.definite}</span> (${section.example.definite_meaning})</p>
          <p class="lead">Aufgabe ${index + 1} / ${words.length} — Wie heißt „das ${word.german}" auf Arabisch (mit Artikel)?</p>
          <input type="text" id="grammar-input" class="text-input arabic-text" dir="rtl" style="max-width:320px;" />
          <div id="grammar-keyboard"></div>
          <button class="btn" id="grammar-check" style="margin-top:12px;">Prüfen</button>
          <p id="grammar-feedback" class="feedback"></p>
        </div>
      `;
      const input = body.querySelector('#grammar-input');
      VirtualKeyboard.mount(body.querySelector('#grammar-keyboard'), input, { showDiacritics: true, showSpecial: false });
      body.querySelector('#grammar-check').addEventListener('click', () => {
        const expected = 'ال' + word.arabic;
        const result = evaluateArabicAnswer(expected, input.value.trim());
        const feedbackEl = body.querySelector('#grammar-feedback');
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        feedbackEl.textContent = isCorrect
          ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
          : `Nicht ganz. Richtig wäre: ${expected}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        const card = AppState.getCard(word.id);
        adjustDifficulty(card, 'grammar_article', isCorrect ? 'correct' : result);
        AppState.persistProgress();
        index += 1;
        setTimeout(() => renderTask(body), 1200);
      });
    }

    const body = renderSectionShell(section, '');
    renderTask(body);
  }

  // --- Abschnitt B: Personalpronomen ---
  function renderPersonalPronouns(section) {
    const pronouns = section.pronouns;
    let index = 0;

    function multipleChoiceOptions(correct) {
      const options = [correct, ...pickRandom(pronouns.filter((p) => p.id !== correct.id), 3)];
      return pickRandom(options, options.length);
    }

    function renderTask(body) {
      if (index >= pronouns.length) {
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      const pronoun = pronouns[index];
      const options = multipleChoiceOptions(pronoun);
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Aufgabe ${index + 1} / ${pronouns.length} — Welches Pronomen bedeutet „${pronoun.german}"?</p>
          <div class="rating-buttons" id="grammar-options"></div>
          <p id="grammar-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = body.querySelector('#grammar-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary arabic-text';
        btn.textContent = opt.arabic;
        btn.addEventListener('click', () => {
          const correct = opt.id === pronoun.id;
          const feedbackEl = body.querySelector('#grammar-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${pronoun.arabic}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          const card = AppState.getCard(`pronoun_${pronoun.id}`);
          adjustDifficulty(card, 'grammar', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          index += 1;
          setTimeout(() => renderTask(body), 900);
        });
        optionsEl.appendChild(btn);
      });
    }

    const body = renderSectionShell(section, '');
    renderTask(body);
  }

  // --- Abschnitt C: Demonstrativpronomen ---
  function renderDemonstratives(section) {
    const words = pickRandom(familyWords(), 4);
    let index = 0;

    function renderTask(body) {
      if (index >= words.length) {
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      const word = words[index];
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Aufgabe ${index + 1} / ${words.length} — ${word.german} (<span class="arabic-text">${word.arabic}</span>, ${word.gender}) — هذا oder هذه?</p>
          <div class="rating-buttons">
            <button class="btn secondary arabic-text" data-value="masculine">${section.masculine.arabic}</button>
            <button class="btn secondary arabic-text" data-value="feminine">${section.feminine.arabic}</button>
          </div>
          <p id="grammar-feedback" class="feedback"></p>
        </div>
      `;
      body.querySelectorAll('button[data-value]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const expected = word.gender === 'maskulin' ? 'masculine' : 'feminine';
          const correct = btn.dataset.value === expected;
          const feedbackEl = body.querySelector('#grammar-feedback');
          const expectedArabic = expected === 'masculine' ? section.masculine.arabic : section.feminine.arabic;
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${expectedArabic}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          const card = AppState.getCard(`demonstrative_${word.id}`);
          adjustDifficulty(card, 'grammar', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          index += 1;
          setTimeout(() => renderTask(body), 900);
        });
      });
    }

    const body = renderSectionShell(section, '');
    renderTask(body);
  }

  // --- Abschnitt D: Nominalsätze mit Adjektiv-Kongruenz ---
  function renderNominalSentences(section) {
    const nouns = pickRandom(foodWords(), 3);
    const colors = vocabulary.find((c) => c.id === 'colors').words;
    const tasks = nouns.map((noun) => ({ noun, color: colors[Math.floor(Math.random() * colors.length)] }));
    let index = 0;

    function renderTask(body) {
      if (index >= tasks.length) {
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      const { noun, color } = tasks[index];
      const isFeminine = noun.gender === 'feminin';
      const expectedColor = isFeminine ? color.arabic_feminine : color.arabic;
      const expected = `ال${noun.arabic} ${expectedColor}`;
      body.innerHTML = `
        <div class="card">
          <p>Beispiel: <span class="arabic-text">${section.example.sentence}</span></p>
          <p class="lead">Aufgabe ${index + 1} / ${tasks.length} — Bilde den Satz: „Das ${noun.german} ist ${color.german}."</p>
          <input type="text" id="grammar-input" class="text-input arabic-text" dir="rtl" style="max-width:400px;" />
          <div id="grammar-keyboard"></div>
          <button class="btn" id="grammar-check" style="margin-top:12px;">Prüfen</button>
          <p id="grammar-feedback" class="feedback"></p>
        </div>
      `;
      const input = body.querySelector('#grammar-input');
      VirtualKeyboard.mount(body.querySelector('#grammar-keyboard'), input, { showDiacritics: true, showSpecial: false });
      body.querySelector('#grammar-check').addEventListener('click', () => {
        const result = evaluateArabicAnswer(expected, input.value.trim());
        const feedbackEl = body.querySelector('#grammar-feedback');
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        feedbackEl.textContent = isCorrect
          ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
          : `Nicht ganz. Richtig wäre: ${expected}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        const card = AppState.getCard(noun.id);
        adjustDifficulty(card, 'grammar_agreement', isCorrect ? 'correct' : result);
        AppState.persistProgress();
        index += 1;
        setTimeout(() => renderTask(body), 1400);
      });
    }

    const body = renderSectionShell(section, '');
    renderTask(body);
  }

  function renderCurrentSection() {
    const section = sections[sectionIndex];
    if (section.id === 'definite_article') renderDefiniteArticle(section);
    else if (section.id === 'personal_pronouns') renderPersonalPronouns(section);
    else if (section.id === 'demonstratives') renderDemonstratives(section);
    else if (section.id === 'nominal_sentences') renderNominalSentences(section);
  }

  async function mount(el) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    sections = pack.grammar.sections;
    vocabulary = pack.vocabulary.categories;
    sectionIndex = 0;
    renderCurrentSection();
  }

  return { mount };
})();
