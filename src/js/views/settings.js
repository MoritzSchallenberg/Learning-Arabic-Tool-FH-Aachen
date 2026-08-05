// Einstellungen (Spec-Kapitel 2.1 "Hauptanwendung" — Bereich "Einstellungen").

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
      <div class="view">
        <h1>Einstellungen</h1>
        <div class="card">
          <h2>Eingabe</h2>
          <p style="margin:0;">⌨️ Arabisch wird über die virtuelle arabische Tastatur eingegeben.</p>
        </div>
        <div class="card">
          <h2>Vokalzeichen &amp; Audio</h2>
          ${row('settings-show-diacritics', 'Vokalzeichen anzeigen', settings.showDiacritics)}
          ${row('settings-auto-play-word', 'Arabisches Wort automatisch vorlesen', settings.autoPlayWord)}
          ${row('settings-replay-after-answer', 'Wort nach der Antwort erneut vorlesen', settings.replayAfterAnswer)}
          ${row('settings-slow-playback', 'Aussprache verlangsamt wiedergeben', settings.slowPlayback)}
        </div>
      </div>
    `;

    container.querySelector('#settings-show-diacritics').addEventListener('change', (e) => {
      AppState.updateSettings({ showDiacritics: e.target.checked });
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
  }

  function mount(container) {
    render(container, AppState.getSettings());
  }

  return { mount };
})();
