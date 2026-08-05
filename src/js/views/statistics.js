// Statistiken & Fortschritts-Übersicht (Spec Kapitel 2.1 "Hauptanwendung" — Bereich
// "Statistiken"). Zeigt aggregiert, was bisher nur gespeichert, aber nirgends angezeigt wurde.
//
// Entwicklungsauftrag 3 (Meilenstein B, Abschnitt 20) behebt hier einen bestehenden
// Darstellungsfehler: die "Schwierigkeit"-Balken zeigten vorher die rohe Ø-Schwierigkeit als
// Füllstand an (höher = mehr gefüllt), obwohl höhere Schwierigkeit SCHLECHTER beherrscht bedeutet
// — ein voll gefüllter Balken sah dadurch aus wie "gut gelernt", obwohl er das Gegenteil bedeutete.
// Jetzt: BEHERRSCHUNG (mastery, höher = besser) wird explizit getrennt über progressStats.js
// berechnet und als eigene, klar beschriftete Balken angezeigt; die alte Schwierigkeitstabelle
// bleibt als "Details" mit ausdrücklicher Beschriftung "höher = schwieriger" erhalten.

const StatisticsView = (() => {
  const SKILL_GROUPS = [
    { label: 'Vokabular (Wort↔Deutsch, Aussprache, Hören)', skills: ['arabic_to_german', 'german_to_arabic', 'pronunciation', 'listening'] },
    { label: 'Buchstaben (Alphabet-Übung)', skills: ['spelling'] },
    { label: 'Grammatik', skills: ['grammar', 'grammar_article', 'grammar_agreement'] }
  ];

  function collectValues(cards, skills) {
    const values = [];
    for (const card of Object.values(cards)) {
      for (const skill of skills) {
        if (card.difficulty && card.difficulty[skill] !== undefined) {
          values.push(card.difficulty[skill]);
        }
      }
    }
    return values;
  }

  function average(values) {
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  function countIntensiveReview(cards) {
    let count = 0;
    for (const card of Object.values(cards)) {
      const hasIntensive = Object.values(card.consecutiveWrong || {}).some((n) => n >= INTENSIVE_REVIEW_THRESHOLD);
      if (hasIntensive) count += 1;
    }
    return count;
  }

  // Beherrschung: höher = besser (grüne Füllung wächst mit besserem Können).
  function renderMasteryMeter(label, percent, count) {
    const displayValue = percent === null ? 'keine Daten' : `${Math.round(percent)}%`;
    const width = percent === null ? 0 : percent;
    return `
      <div class="meter-row">
        <span class="meter-label">${label}</span>
        <div class="meter-track"><div class="meter-fill mastery" style="width:${width}%"></div></div>
        <span class="meter-value">${displayValue}${count ? ` (${count})` : ''}</span>
      </div>
    `;
  }

  // Schwierigkeit: höher = schwieriger — bewusst mit roter Füllung und expliziter Beschriftung,
  // damit sie nicht mit einem Fortschrittsbalken verwechselt wird.
  function renderDifficultyMeter(label, avgValue) {
    const displayValue = avgValue === null ? '– keine Daten' : `${avgValue.toFixed(1)} / 10`;
    const widthPercent = avgValue === null ? 0 : (avgValue / 10) * 100;
    return `
      <div class="meter-row">
        <span class="meter-label">${label}</span>
        <div class="meter-track"><div class="meter-fill difficulty" style="width:${widthPercent}%"></div></div>
        <span class="meter-value">${displayValue}</span>
      </div>
    `;
  }

  function mount(container) {
    const cards = AppState.getAllCards();
    const cardCount = Object.keys(cards).length;
    const intensiveCount = countIntensiveReview(cards);

    const groupRows = SKILL_GROUPS.map((group) => {
      const values = collectValues(cards, group.skills);
      return { label: group.label, avg: average(values), count: values.length };
    });

    const detailRows = groupRows
      .filter((g) => g.count > 0)
      .map((g) => `<tr><td>${g.label}</td><td>${g.avg.toFixed(2)}</td><td>${g.count}</td></tr>`)
      .join('');

    const competencies = ProgressStats.computeCompetencyBars(cards);

    container.innerHTML = `
      <div class="view">
        <h1>Statistiken &amp; Fortschritt</h1>
        <p class="lead">Beherrschung (höher = besser) und Schwierigkeit (höher = schwieriger) werden bewusst getrennt angezeigt — das eine ist nicht einfach das Gegenteil des anderen in derselben Darstellung.</p>

        <div class="card" style="display:flex; gap:32px;">
          <div>
            <div style="font-size:1.8rem; font-weight:600;">${cardCount}</div>
            <div class="lead" style="margin:0;">Karten mit Fortschritt</div>
          </div>
          <div>
            <div style="font-size:1.8rem; font-weight:600;">${intensiveCount}</div>
            <div class="lead" style="margin:0;">Karten in Intensivwiederholung</div>
          </div>
        </div>

        <div class="card">
          <h2>Kompetenzen (Beherrschung, höher = besser)</h2>
          ${Object.entries(competencies).map(([name, c]) => renderMasteryMeter(name, c.percent, c.count)).join('')}
        </div>

        <div class="card">
          <h2>Details: Ø Schwierigkeit je Bereich (höher = schwieriger)</h2>
          ${groupRows.map((g) => renderDifficultyMeter(g.label, g.avg)).join('')}
        </div>

        <div class="card">
          <h2>Rohdaten</h2>
          ${detailRows
            ? `<table class="forms-table"><thead><tr><th>Bereich</th><th>Ø Schwierigkeit</th><th>Anzahl Werte</th></tr></thead><tbody>${detailRows}</tbody></table>`
            : '<p class="lead">Noch keine Übungsdaten vorhanden — probiere eine Lektion aus.</p>'}
        </div>
      </div>
    `;
  }

  return { mount };
})();
