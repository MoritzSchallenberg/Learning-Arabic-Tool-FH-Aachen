// Lektion 7: Grundgrammatik II (Spec-Kapitel "Lektion 7").
// Bewusst auf reguläre Verbformen eines einzigen Beispielverbs (كَتَبَ) begrenzt — siehe
// Hinweis in grammar_2.json zu ausgesparten unregelmäßigen/schwachen Verbklassen.
//
// P0.2: jede Aufgabe läuft über einen ExerciseGuard (Mehrfachklick-Schutz + Timer-Aufräumung
// beim Verlassen der View).

const GrammarAdvancedView = (() => {
  let data = null;
  let sectionIndex = 0;
  let container = null;
  let activeGuard = null;
  const PRONOUN_KEYS = ['ana', 'anta', 'anti', 'huwa', 'hiya', 'nahnu'];

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

  function renderSectionShell(section, bodyHtml) {
    container.innerHTML = `
      <div class="view">
        <h1>${section.title}</h1>
        <p class="lead">${section.explanation}</p>
        <div id="g2-section-body">${bodyHtml}</div>
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn secondary" id="g2-back" ${sectionIndex === 0 ? 'disabled' : ''}>Zurück</button>
          <button class="btn" id="g2-next">${sectionIndex === data.sections.length - 1 ? 'Fertig' : 'Weiter'}</button>
        </div>
        <p class="flashcard-progress">Thema ${sectionIndex + 1} / ${data.sections.length}</p>
      </div>
    `;
    container.querySelector('#g2-back').addEventListener('click', () => {
      if (sectionIndex > 0) { sectionIndex -= 1; renderCurrentSection(); }
    });
    container.querySelector('#g2-next').addEventListener('click', () => {
      if (sectionIndex < data.sections.length - 1) { sectionIndex += 1; renderCurrentSection(); }
      else { App.navigateTo('vocabulary_2'); }
    });
    return container.querySelector('#g2-section-body');
  }

  function renderVerbTable(tense) {
    const rows = PRONOUN_KEYS.map((key) => `
      <tr><td>${data.pronoun_labels[key]}</td><td class="arabic-text">${data.verb[tense][key]}</td></tr>
    `).join('');
    return `<table class="forms-table"><thead><tr><th>Pronomen</th><th>Verbform</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderVerbExercise(section, tense, skill) {
    const guard = freshGuard();
    const queue = pickRandomOrder(PRONOUN_KEYS);
    let index = 0;

    function renderTask(body) {
      if (index >= queue.length) {
        guard.complete();
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      guard.nextTask();
      const key = queue[index];
      body.innerHTML = `
        ${renderVerbTable(tense)}
        <div class="card">
          <p class="lead">Aufgabe ${index + 1} / ${queue.length} — Wie lautet die Form für ${data.pronoun_labels[key]}?</p>
          <input type="text" id="g2-input" class="text-input arabic-text" dir="rtl" style="max-width:320px;" />
          <div id="g2-keyboard"></div>
          <button class="btn" id="g2-check" style="margin-top:12px;">Prüfen</button>
          <p id="g2-feedback" class="feedback"></p>
        </div>
      `;
      const input = body.querySelector('#g2-input');
      VirtualKeyboard.mount(body.querySelector('#g2-keyboard'), input, { showDiacritics: true, showSpecial: false });
      body.querySelector('#g2-check').addEventListener('click', () => {
        if (!guard.submit()) return;
        const expected = data.verb[tense][key];
        const result = evaluateArabicAnswer(expected, input.value.trim());
        const feedbackEl = body.querySelector('#g2-feedback');
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        feedbackEl.textContent = isCorrect
          ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
          : `Nicht ganz. Richtig wäre: ${expected}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        guard.showFeedback();
        const card = AppState.getCard(`verb_kataba_${key}`);
        adjustDifficulty(card, skill, isCorrect ? 'correct' : result);
        AppState.persistProgress();
        index += 1;
        guard.transitioning();
        guard.setTimeout(() => renderTask(body), 1200);
      });
    }

    const body = renderSectionShell(section, '');
    renderTask(body);
  }

  function renderNegation(section) {
    const guard = freshGuard();
    const queue = pickRandomOrder(PRONOUN_KEYS);
    let index = 0;

    function renderTask(body) {
      if (index >= queue.length) {
        guard.complete();
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      guard.nextTask();
      const key = queue[index];
      const presentForm = data.verb.present[key];
      body.innerHTML = `
        <div class="card">
          <p>Beispiel: <span class="arabic-text">${section.example_negation}</span> (ich schreibe nicht)</p>
          <p class="lead" style="margin-top:8px;">Zur Info — Vergangenheit formell: <span class="arabic-text">${section.example_past_negation_reference}</span> (wird hier nicht abgefragt)</p>
        </div>
        <div class="card">
          <p class="lead">Aufgabe ${index + 1} / ${queue.length} — Verneine: <span class="arabic-text">${presentForm}</span> (${data.pronoun_labels[key]})</p>
          <input type="text" id="g2-input" class="text-input arabic-text" dir="rtl" style="max-width:320px;" />
          <div id="g2-keyboard"></div>
          <button class="btn" id="g2-check" style="margin-top:12px;">Prüfen</button>
          <p id="g2-feedback" class="feedback"></p>
        </div>
      `;
      const input = body.querySelector('#g2-input');
      VirtualKeyboard.mount(body.querySelector('#g2-keyboard'), input, { showDiacritics: true, showSpecial: false });
      body.querySelector('#g2-check').addEventListener('click', () => {
        if (!guard.submit()) return;
        const expected = `لا ${presentForm}`;
        const result = evaluateArabicAnswer(expected, input.value.trim());
        const feedbackEl = body.querySelector('#g2-feedback');
        const isCorrect = result === 'correct_full' || result === 'correct_no_diacritics';
        feedbackEl.textContent = isCorrect
          ? (result === 'correct_no_diacritics' ? 'Richtig, aber ohne Vokalzeichen.' : 'Richtig!')
          : `Nicht ganz. Richtig wäre: ${expected}`;
        feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : (result === 'typo' ? 'typo' : 'wrong'));
        guard.showFeedback();
        const card = AppState.getCard(`verb_kataba_${key}`);
        adjustDifficulty(card, 'grammar_negation', isCorrect ? 'correct' : result);
        AppState.persistProgress();
        index += 1;
        guard.transitioning();
        guard.setTimeout(() => renderTask(body), 1200);
      });
    }

    const body = renderSectionShell(section, '');
    renderTask(body);
  }

  function renderConjunctions(section) {
    const guard = freshGuard();
    const queue = pickRandomOrder(section.conjunctions);
    let index = 0;

    function options(correct) {
      return pickRandomOrder(section.conjunctions);
    }

    function renderTask(body) {
      if (index >= queue.length) {
        guard.complete();
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      guard.nextTask();
      const item = queue[index];
      const opts = options(item);
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Aufgabe ${index + 1} / ${queue.length} — Welches Wort bedeutet „${item.german}"?</p>
          <div class="rating-buttons" id="g2-options"></div>
          <p id="g2-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = body.querySelector('#g2-options');
      opts.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary arabic-text';
        btn.textContent = opt.arabic;
        btn.addEventListener('click', () => {
          if (!guard.submit()) return;
          const correct = opt.id === item.id;
          const feedbackEl = body.querySelector('#g2-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${item.arabic}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          guard.showFeedback();
          const card = AppState.getCard(`conjunction_${item.id}`);
          adjustDifficulty(card, 'grammar', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          index += 1;
          guard.transitioning();
          guard.setTimeout(() => renderTask(body), 900);
        });
        optionsEl.appendChild(btn);
      });
    }

    const body = renderSectionShell(section, '');
    renderTask(body);
  }

  function renderCurrentSection() {
    const section = data.sections[sectionIndex];
    if (section.id === 'present_tense') renderVerbExercise(section, 'present', 'grammar_verb_present');
    else if (section.id === 'past_tense') renderVerbExercise(section, 'past', 'grammar_verb_past');
    else if (section.id === 'negation') renderNegation(section);
    else if (section.id === 'conjunctions') renderConjunctions(section);
  }

  async function mount(el) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    const pack = await AppState.getLanguagePack();
    data = pack.grammar2;
    sectionIndex = 0;
    renderCurrentSection();
  }

  return { mount };
})();
