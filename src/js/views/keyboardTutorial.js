// Lektion 1: Tastatur- und Eingabetutorial (Spec-Kapitel "Lektion 1", Abschnitte 1-6).
//
// P0.2: jeder Abschnitt läuft über einen ExerciseGuard (Mehrfachklick-Schutz). Hier gibt es
// keinen Auto-Weiter-Timer (der Nutzer klickt selbst "Weiter"), daher ist vor allem der
// Doppelklick-Schutz relevant.

const KeyboardTutorialView = (() => {
  let sectionIndex = 0;
  let sections = [];
  let languagePack = null;
  let activeGuard = null;

  function freshGuard() {
    if (activeGuard) activeGuard.destroy();
    activeGuard = ExerciseGuard.create();
    return activeGuard;
  }

  function renderDirectionDemo(step) {
    return `
      <p>${step.text}</p>
      <div class="card">
        <p>Gib den Buchstaben <span class="arabic-text">${step.letter}</span> ein.</p>
        <div style="border:1px solid var(--color-border); border-radius:8px; padding:12px; direction:rtl; min-height:40px;">
          <span class="arabic-text">${step.letter}</span>
        </div>
      </div>
    `;
  }

  function renderSingleLetterPractice(step) {
    return `
      <p>${step.text}</p>
      <div class="card">
        <p>Gesuchter Buchstabe: <span class="arabic-text large">${step.letter}</span></p>
        <input type="text" id="kt-input" class="text-input arabic-text" dir="rtl" />
        <div id="kt-keyboard"></div>
        <button class="btn" id="kt-check">Prüfen</button>
        <p id="kt-feedback" class="feedback"></p>
      </div>
    `;
  }

  function renderConnectedLettersDemo(step) {
    return `
      <p>${step.text}</p>
      <div class="card arabic-text large" style="text-align:center;">
        ${step.sequence.join(' + ')} &rarr; ${step.result}
      </div>
    `;
  }

  function renderDiacriticsTable(step) {
    const rows = languagePack.language.diacritics.map((d) => `
      <tr>
        <td class="arabic-text">${d.symbol}</td>
        <td>${d.name}</td>
        <td>${d.sound}</td>
      </tr>
    `).join('');
    return `
      <p>${step.text}</p>
      <table class="forms-table">
        <thead><tr><th>Zeichen</th><th>Name</th><th>Bedeutung</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function renderPracticeWord(step) {
    return `
      <div class="card">
        <p>Schreibe das Wort:</p>
        <p class="arabic-text large">${step.word}</p>
        <p class="mixed-text">Bedeutung: ${step.meaning}</p>
        <input type="text" id="kt-input" class="text-input arabic-text" dir="rtl" />
        <div id="kt-keyboard"></div>
        <button class="btn" id="kt-check">Prüfen</button>
        <p id="kt-feedback" class="feedback"></p>
      </div>
    `;
  }

  function renderInputModeSelection(step) {
    return `
      <p>${step.text}</p>
      <div class="card">
        <p style="margin:0;">⌨️ Du schreibst Arabisch über die virtuelle arabische Tastatur — sie erscheint automatisch bei jeder Eingabeaufgabe.</p>
      </div>
    `;
  }

  function renderSectionBody(step) {
    switch (step.type) {
      case 'direction_demo': return renderDirectionDemo(step);
      case 'single_letter_practice': return renderSingleLetterPractice(step);
      case 'connected_letters_demo': return renderConnectedLettersDemo(step);
      case 'diacritics_table': return renderDiacriticsTable(step);
      case 'practice_word': return renderPracticeWord(step);
      case 'input_mode_selection': return renderInputModeSelection(step);
      default: return `<p>${step.text || ''}</p>`;
    }
  }

  function attachSectionHandlers(step, container, guard) {
    const input = container.querySelector('#kt-input');
    const keyboardContainer = container.querySelector('#kt-keyboard');
    if (input && keyboardContainer) {
      VirtualKeyboard.mount(keyboardContainer, input, { showDiacritics: true, showSpecial: false });
    }

    const checkBtn = container.querySelector('#kt-check');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (!guard.canSubmit()) return; // hier kein einmaliges "submit" (mehrfaches Prüfen
        // vor dem manuellen "Weiter" ist gewollt, z. B. um es nach einem Fehler erneut zu
        // versuchen) — der Guard dient hier vor allem der Konsistenz mit anderen Views und
        // der Aufräumung beim Verlassen der Ansicht.
        const expected = step.type === 'practice_word' ? step.word : step.letter;
        const result = evaluateArabicAnswer(expected, input.value.trim());
        const feedbackEl = container.querySelector('#kt-feedback');
        if (result === 'correct_full') {
          feedbackEl.textContent = 'Richtig!';
          feedbackEl.className = 'feedback correct';
        } else if (result === 'correct_no_diacritics') {
          feedbackEl.textContent = 'Richtig, aber ohne Vokalzeichen.';
          feedbackEl.className = 'feedback correct';
        } else if (result === 'typo') {
          feedbackEl.textContent = 'Fast richtig — kleiner Tippfehler.';
          feedbackEl.className = 'feedback typo';
        } else {
          feedbackEl.textContent = `Nicht ganz. Erwartet: ${expected}`;
          feedbackEl.className = 'feedback wrong';
        }
      });
    }

  }

  function render(container) {
    const guard = freshGuard();
    const step = sections[sectionIndex];
    container.innerHTML = `
      <div class="view">
        <h1>${step.title}</h1>
        <div id="kt-section-body"></div>
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn secondary" id="kt-back" ${sectionIndex === 0 ? 'disabled' : ''}>Zurück</button>
          <button class="btn" id="kt-next">${sectionIndex === sections.length - 1 ? 'Fertig' : 'Weiter'}</button>
        </div>
        <p class="flashcard-progress">Abschnitt ${sectionIndex + 1} / ${sections.length}</p>
      </div>
    `;
    const bodyEl = container.querySelector('#kt-section-body');
    bodyEl.innerHTML = renderSectionBody(step);
    attachSectionHandlers(step, bodyEl, guard);

    container.querySelector('#kt-back').addEventListener('click', () => {
      if (sectionIndex > 0) {
        sectionIndex -= 1;
        render(container);
      }
    });
    container.querySelector('#kt-next').addEventListener('click', () => {
      if (sectionIndex < sections.length - 1) {
        sectionIndex += 1;
        render(container);
      } else {
        AppState.markLessonCompleted('keyboard_tutorial');
        App.navigateTo('unit_1');
      }
    });
  }

  async function mount(container) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    App.registerCleanup(() => { if (activeGuard) activeGuard.destroy(); });
    AppState.markLessonStarted('keyboard_tutorial');
    languagePack = await AppState.getLanguagePack();
    sections = languagePack.tutorials.keyboard.sections;
    sectionIndex = 0;
    render(container);
  }

  return { mount };
})();
