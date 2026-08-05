// Unit 8 (Kurze Vokale) und Unit 9 (Lange Vokale und Sonderformen) aus courses.json.
// Reine Datenwiederverwendung aus language.json (diacritics, special_characters) — kein neuer
// Sprachinhalt, geringes Fehlerrisiko.

function pickRandomOrderShared(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const ShortVowelsView = (() => {
  let diacritics = [];
  let phase = 0;
  let container = null;
  const BASE_LETTER = 'ب';

  function renderShell(bodyHtml) {
    container.innerHTML = `
      <div class="view">
        <h1>Unit 8: Kurze Vokale</h1>
        <p class="lead">Fatha, Kasra, Damma, Sukun und Schadda lesen und hören.</p>
        <div id="sv-body">${bodyHtml}</div>
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn secondary" id="sv-back" ${phase === 0 ? 'disabled' : ''}>Zurück</button>
          <button class="btn" id="sv-next">${phase === 1 ? 'Fertig' : 'Weiter'}</button>
        </div>
      </div>
    `;
    container.querySelector('#sv-back').addEventListener('click', () => { if (phase > 0) { phase -= 1; render(); } });
    container.querySelector('#sv-next').addEventListener('click', () => {
      if (phase < 1) { phase += 1; render(); } else { App.navigateTo('unit_9'); }
    });
    return container.querySelector('#sv-body');
  }

  function renderTable() {
    const rows = diacritics.slice(0, 5).map((d) => `
      <tr><td class="arabic-text">${BASE_LETTER}${d.symbol}</td><td>${d.name}</td><td>${d.sound}</td></tr>
    `).join('');
    renderShell(`
      <table class="forms-table">
        <thead><tr><th>Beispiel</th><th>Name</th><th>Bedeutung</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `);
  }

  function renderExercise() {
    const queue = pickRandomOrderShared(diacritics.slice(0, 5));
    let index = 0;

    function next(body) {
      if (index >= queue.length) {
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      const item = queue[index];
      const options = pickRandomOrderShared(diacritics.slice(0, 5));
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Wie heißt dieses Vokalzeichen?</p>
          <div class="arabic-text large">${BASE_LETTER}${item.symbol}</div>
          <div class="rating-buttons" id="sv-options"></div>
          <p id="sv-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = body.querySelector('#sv-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.textContent = opt.name;
        btn.addEventListener('click', () => {
          const correct = opt.name === item.name;
          const feedbackEl = body.querySelector('#sv-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${item.name}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          const card = AppState.getCard(`diacritic_${item.name}`);
          adjustDifficulty(card, 'reading', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          index += 1;
          setTimeout(() => next(body), 900);
        });
        optionsEl.appendChild(btn);
      });
    }
    const body = renderShell('');
    next(body);
  }

  function render() {
    if (phase === 0) renderTable();
    else renderExercise();
  }

  async function mount(el) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    diacritics = pack.language.diacritics;
    phase = 0;
    render();
  }

  return { mount };
})();

const LongVowelsView = (() => {
  let specialChars = [];
  let phase = 0;
  let container = null;

  function renderShell(bodyHtml) {
    container.innerHTML = `
      <div class="view">
        <h1>Unit 9: Lange Vokale und Sonderformen</h1>
        <p class="lead">ا, و und ي dienen auch als lange Vokale. Dazu einige Sonderformen wie Tāʾ marbūṭa und die Hamza-Grundformen.</p>
        <div id="lv-body">${bodyHtml}</div>
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn secondary" id="lv-back" ${phase === 0 ? 'disabled' : ''}>Zurück</button>
          <button class="btn" id="lv-next">${phase === 1 ? 'Fertig' : 'Weiter'}</button>
        </div>
      </div>
    `;
    container.querySelector('#lv-back').addEventListener('click', () => { if (phase > 0) { phase -= 1; render(); } });
    container.querySelector('#lv-next').addEventListener('click', () => {
      if (phase < 1) { phase += 1; render(); } else { App.navigateTo('unit_10'); }
    });
    return container.querySelector('#lv-body');
  }

  function renderTable() {
    const rows = specialChars.map((s) => `<tr><td class="arabic-text">${s.symbol}</td><td>${s.name}</td></tr>`).join('');
    renderShell(`
      <table class="forms-table">
        <thead><tr><th>Zeichen</th><th>Name</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `);
  }

  function renderExercise() {
    const queue = pickRandomOrderShared(specialChars);
    let index = 0;

    function next(body) {
      if (index >= queue.length) {
        body.innerHTML = `<p class="feedback correct">Übung abgeschlossen.</p>`;
        return;
      }
      const item = queue[index];
      const distractors = pickRandomOrderShared(specialChars.filter((s) => s.symbol !== item.symbol)).slice(0, 3);
      const options = pickRandomOrderShared([item, ...distractors]);
      body.innerHTML = `
        <div class="card flashcard">
          <p class="lead">Wie heißt dieses Zeichen?</p>
          <div class="arabic-text large">${item.symbol}</div>
          <div class="rating-buttons" id="lv-options"></div>
          <p id="lv-feedback" class="feedback"></p>
        </div>
      `;
      const optionsEl = body.querySelector('#lv-options');
      options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn secondary';
        btn.textContent = opt.name;
        btn.addEventListener('click', () => {
          const correct = opt.symbol === item.symbol;
          const feedbackEl = body.querySelector('#lv-feedback');
          feedbackEl.textContent = correct ? 'Richtig!' : `Falsch. Richtig wäre: ${item.name}`;
          feedbackEl.className = 'feedback ' + (correct ? 'correct' : 'wrong');
          const card = AppState.getCard(`special_char_${item.symbol}`);
          adjustDifficulty(card, 'reading', correct ? 'correct' : 'wrong');
          AppState.persistProgress();
          index += 1;
          setTimeout(() => next(body), 900);
        });
        optionsEl.appendChild(btn);
      });
    }
    const body = renderShell('');
    next(body);
  }

  function render() {
    if (phase === 0) renderTable();
    else renderExercise();
  }

  async function mount(el) {
    container = el;
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    specialChars = pack.language.special_characters;
    phase = 0;
    render();
  }

  return { mount };
})();
