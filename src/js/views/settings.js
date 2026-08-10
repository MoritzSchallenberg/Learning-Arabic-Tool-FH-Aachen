// Einstellungen (Spec-Kapitel 2.1 "Hauptanwendung" — Bereich "Einstellungen").
// Entwicklungsauftrag 4, Abschnitt 21: Darstellung (Hell-/Dunkel-/Systemmodus, arabische
// Schriftgröße), Audio, automatische Fortsetzung, Vokalzeichen/Umschrift, tägliches Ziel neuer
// Wörter — jede hier gezeigte Einstellung wirkt sofort, wird gespeichert und bleibt nach einem
// Neustart erhalten (siehe test/unit/settings.test.js).

const SettingsView = (() => {
  function row(id, label, checked) {
    return `
      <label style="display:block; margin-bottom:10px;">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} /> ${label}
      </label>
    `;
  }

  function render(container, settings) {
    container.innerHTML = `
      <div class="view page-content">
        <h1 class="text-page-title">Einstellungen</h1>

        <div class="card">
          <h2 class="text-section-title">Darstellung</h2>
          <div class="settings-row">
            <span class="settings-row-label">Farbschema:</span>
            <div id="settings-theme-toggle"></div>
          </div>
          <label style="display:block;">
            Arabische Schriftgröße:
            <select id="settings-arabic-font-scale" class="text-input" style="width:auto; display:inline-block; margin-left:8px;">
              <option value="normal">Normal</option>
              <option value="large">Groß</option>
            </select>
          </label>
        </div>

        <div class="card">
          <h2 class="text-section-title">Eingabe</h2>
          <p style="margin:0;">⌨️ Arabisch wird über die virtuelle arabische Tastatur eingegeben.</p>
        </div>

        <div class="card">
          <h2 class="text-section-title">Vokalzeichen, Umschrift &amp; Audio</h2>
          ${row('settings-show-diacritics', 'Vokalzeichen anzeigen', settings.showDiacritics)}
          ${row('settings-show-transliteration', 'Umschrift anzeigen', settings.showTransliteration)}
          ${row('settings-auto-play-word', 'Arabisches Wort automatisch vorlesen', settings.autoPlayWord)}
          ${row('settings-replay-after-answer', 'Wort nach der Antwort erneut vorlesen', settings.replayAfterAnswer)}
          ${row('settings-slow-playback', 'Aussprache verlangsamt wiedergeben', settings.slowPlayback)}
        </div>

        <div class="card">
          <h2 class="text-section-title">Lernsession</h2>
          ${row('settings-auto-advance', 'Nach Feedback automatisch weiter (statt manuellem „Weiter“)', settings.autoAdvanceAfterFeedback)}
          <label style="display:block; margin-top:10px;">
            Tägliches Ziel neuer Wörter:
            <select id="settings-daily-new-limit" class="text-input" style="width:auto; display:inline-block; margin-left:8px;">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
        </div>
      </div>
    `;

    container.querySelector('#settings-arabic-font-scale').value = settings.arabicFontScale || 'normal';
    container.querySelector('#settings-daily-new-limit').value = String(settings.dailyNewLimit || 10);

    const themeToggleSlot = container.querySelector('#settings-theme-toggle');
    function renderThemeToggle(currentTheme) {
      themeToggleSlot.replaceChildren(ThemeToggle.render(currentTheme, (theme) => {
        AppState.updateSettings({ theme });
        App.applyTheme(theme);
        renderThemeToggle(theme); // aktiven Zustand des Schalters sofort nachziehen
      }));
    }
    renderThemeToggle(settings.theme);
    container.querySelector('#settings-arabic-font-scale').addEventListener('change', (e) => {
      AppState.updateSettings({ arabicFontScale: e.target.value });
      document.documentElement.setAttribute('data-arabic-scale', e.target.value);
    });
    container.querySelector('#settings-show-diacritics').addEventListener('change', (e) => {
      AppState.updateSettings({ showDiacritics: e.target.checked });
    });
    container.querySelector('#settings-show-transliteration').addEventListener('change', (e) => {
      AppState.updateSettings({ showTransliteration: e.target.checked });
    });
    container.querySelector('#settings-auto-play-word').addEventListener('change', (e) => {
      AppState.updateSettings({ autoPlayWord: e.target.checked });
    });
    container.querySelector('#settings-replay-after-answer').addEventListener('change', (e) => {
      AppState.updateSettings({ replayAfterAnswer: e.target.checked });
    });
    container.querySelector('#settings-slow-playback').addEventListener('change', (e) => {
      AppState.updateSettings({ slowPlayback: e.target.checked });
    });
    container.querySelector('#settings-auto-advance').addEventListener('change', (e) => {
      AppState.updateSettings({ autoAdvanceAfterFeedback: e.target.checked });
    });
    container.querySelector('#settings-daily-new-limit').addEventListener('change', (e) => {
      AppState.updateSettings({ dailyNewLimit: Number(e.target.value) });
    });
  }

  function mount(container) {
    render(container, AppState.getSettings());
  }

  return { mount };
})();
