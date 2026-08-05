// Lektion 9: Erweiterte Grammatik (Spec-Kapitel "Lektion 9").
// Bewusst nur EIN Thema (Relativpronomen) — siehe Hinweis in grammar_3.json zu den
// bewusst ausgelassenen, fehleranfälligeren Themen (Verbstämme, Passiv, Bedingungssätze, ...).
//
// P0.2: jede Aufgabe läuft über einen ExerciseGuard (Mehrfachklick-Schutz + Timer-Aufräumung
// beim Verlassen der View).

const GrammarExtendedView = (() => {
  let data = null;
  let familyWords = [];
  let sectionIndex = 0;
  let container = null;
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

  function renderSectionShell(section, bodyHtml) {
    container.innerHTML = `
      <div class="view">
        <h1>${section.title}</h1>
        <p class="lead">${section.explanation}</p>
        <div class="card">
          <p><span class="arabic-text">${section.example_masculine.sentence}</span> — ${section.example_masculine.translation}</p>
          <p><span class="arabic-text">${section.example_feminine.sentence}</span> — ${section.example_feminine.translation}</p>
        </div>
        <div id="g3-section-body">${bodyHtml}</div>
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn secondary" id="g3-back" ${sectionIndex === 0 ? 'disabled' : ''}>Zurück</button>
          <button class="btn" id="g3-next">${sectionIndex === data.sections.length - 1 ? 'Fertig' : 'Weiter'}</button>
        </div>
        <p class="flashcard-progress">Thema ${sectionIndex + 1} / ${data.sections.length}</p>
      </div>
    `;
    container.querySelector('#g3-back').addEventListener('click', () => {
      if (sectionIndex > 0) { sectionIndex -= 1; renderCurrentSection(); }
    });
    container.querySelector('#g3-next').addEventListener('click', () => {
      if (sectionIndex < data.sections.length - 1) { sectionIndex += 1; renderCurrentSection(); }
      else { App.navigateTo('reading_writing'); }
    });
    return container.querySelector('#g3-section-body');
  }

  function renderRelativePronouns(section) {
    const guard = freshGuard();
    const queue = pickRandomOrder(familyWords).slice(0, 4);
    let index = 0;

    function renderTask(body) {
      if (index >= queue.length) {
        guard.complete();
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      guard.nextTask();
      const word = queue[index];
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Aufgabe ${index + 1} / ${queue.length} — ${word.german} (<span class="arabic-text">${word.arabic}</span>, ${word.gender}) — الَّذِي oder الَّتِي?</p>
          <div class="rating-buttons">
            <button class="btn secondary arabic-text" data-value="masculine">${section.masculine.arabic}</button>
            <button class="btn secondary arabic-text" data-value="feminine">${section.feminine.arabic}</button>
          </div>
          <p id="g3-feedback" class="feedback"></p>
        </div>
      `;
      body.querySelectorAll('button[data-value]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!guard.submit()) return;
          const expected = word.gender === 'maskulin' ? 'masculine' : 'feminine';
          const correct = btn.dataset.value === expected;
          const feedbackEl = body.querySelector('#g3-feedback');
          const expectedArabic = expected === 'masculine' ? section.masculine.arabic : section.feminine.arabic;
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${expectedArabic}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          guard.showFeedback();
          const card = AppState.getCard(`relative_${word.id}`);
          adjustDifficulty(card, 'grammar', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          index += 1;
          guard.transitioning();
          guard.setTimeout(() => renderTask(body), 900);
        });
      });
    }

    const body = renderSectionShell(section, '');
    renderTask(body);
  }

  function renderCurrentSection() {
    const section = data.sections[sectionIndex];
    if (section.id === 'relative_pronouns') renderRelativePronouns(section);
  }

  async function mount(el) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    const pack = await AppState.getLanguagePack();
    data = pack.grammar3;
    familyWords = pack.vocabulary.categories.find((c) => c.id === 'family').words;
    sectionIndex = 0;
    renderCurrentSection();
  }

  return { mount };
})();
