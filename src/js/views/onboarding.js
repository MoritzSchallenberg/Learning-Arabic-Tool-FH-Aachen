// Lektion 0: Einführung in die arabische Sprache (Spec-Kapitel "Lektion 0").

const OnboardingView = (() => {
  let stepIndex = 0;
  let steps = [];

  function renderStepBody(step) {
    switch (step.type) {
      case 'welcome':
        return `
          <p>${step.text}</p>
          <div class="card">
            <p class="mixed-text">Deutsch: ${step.example.german}</p>
            <p class="arabic-text large">${step.example.arabic}</p>
            <button class="btn icon" id="onboarding-speak">🔊</button>
          </div>
        `;
      case 'input_mode_choice':
        return `
          <p>${step.text}</p>
          <div class="card">
            <label><input type="radio" name="input-mode" value="virtual_keyboard" checked /> Virtuelle arabische Tastatur</label><br/>
            <label style="opacity:0.5"><input type="radio" disabled /> Physische Tastaturbelegung (folgt später)</label><br/>
            <label style="opacity:0.5"><input type="radio" disabled /> Transliterationsmodus (folgt später)</label>
          </div>
        `;
      case 'tts_test':
        return `
          <p>${step.text}</p>
          <div class="card">
            <p class="mixed-text">${step.sample_word.german}</p>
            <p class="arabic-text large">${step.sample_word.arabic}</p>
            <button class="btn icon" id="onboarding-speak">🔊</button>
          </div>
        `;
      case 'repetition_info':
        return `<p>${step.text}</p>`;
      case 'diacritics_choice':
        return `
          <p>${step.text}</p>
          <label>
            <input type="checkbox" id="diacritics-toggle" checked />
            Vokalzeichen anzeigen
          </label>
        `;
      default:
        return `<p>${step.text || ''}</p>`;
    }
  }

  function attachStepHandlers(step, container) {
    const speakBtn = container.querySelector('#onboarding-speak');
    if (speakBtn) {
      const word = step.example ? step.example.arabic : step.sample_word.arabic;
      speakBtn.addEventListener('click', () => {
        // بَيْت ist identisch mit dem Beispielwort des Buchstabens ب — dieselbe Audiodatei.
        AudioPlayer.speak(word, 'ar-SA', { audioKey: 'letters/ba' }).catch(() => {
          speakBtn.title = 'Keine arabische Stimme auf diesem System gefunden.';
        });
      });
    }

    const modeInputs = container.querySelectorAll('input[name="input-mode"]');
    modeInputs.forEach((el) => {
      el.addEventListener('change', () => {
        AppState.updateSettings({ inputMode: el.value });
      });
    });

    const diacriticsToggle = container.querySelector('#diacritics-toggle');
    if (diacriticsToggle) {
      diacriticsToggle.addEventListener('change', () => {
        AppState.updateSettings({ showDiacritics: diacriticsToggle.checked });
      });
    }
  }

  function render(container) {
    const step = steps[stepIndex];
    container.innerHTML = `
      <div class="view">
        <h1>${step.title}</h1>
        <div id="onboarding-step-body"></div>
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn secondary" id="onboarding-back" ${stepIndex === 0 ? 'disabled' : ''}>Zurück</button>
          <button class="btn" id="onboarding-next">${stepIndex === steps.length - 1 ? 'Fertig' : 'Weiter'}</button>
        </div>
        <p class="flashcard-progress">Schritt ${stepIndex + 1} / ${steps.length}</p>
      </div>
    `;
    const bodyEl = container.querySelector('#onboarding-step-body');
    bodyEl.innerHTML = renderStepBody(step);
    attachStepHandlers(step, bodyEl);

    container.querySelector('#onboarding-back').addEventListener('click', () => {
      if (stepIndex > 0) {
        stepIndex -= 1;
        render(container);
      }
    });
    container.querySelector('#onboarding-next').addEventListener('click', () => {
      if (stepIndex < steps.length - 1) {
        stepIndex += 1;
        render(container);
      } else {
        App.navigateTo('keyboard_tutorial');
      }
    });
  }

  async function mount(container) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    steps = pack.tutorials.introduction.steps;
    stepIndex = 0;
    render(container);
  }

  return { mount };
})();
