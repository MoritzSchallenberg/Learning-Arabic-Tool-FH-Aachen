// Startseite (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 18): zeigt heute fällige
// Wiederholungen, für heute verfügbare neue Wörter (begrenzt durch das Tageslimit),
// eine grobe Zeitschätzung, den Gesamtfortschritt von Kurs 1 sowie den Fortschritt je Bereich —
// und den Ein-Klick-Einstieg "Heute weiterlernen" direkt in den freien Übungsmodus mit
// vorausgewählten fälligen Wiederholungen.

const DashboardView = (() => {
  const CATEGORY_ORDER = ['letters', 'vocabulary', 'connections'];

  function renderProgressBar(label, percent) {
    const displayPercent = percent === null ? null : Math.round(percent);
    return `
      <div class="meter-row">
        <span class="meter-label">${label}</span>
        <div class="meter-track"><div class="meter-fill mastery" style="width:${displayPercent ?? 0}%"></div></div>
        <span class="meter-value">${displayPercent === null ? 'keine Daten' : displayPercent + '%'}</span>
      </div>
    `;
  }

  async function mount(container) {
    container.innerHTML = '<div class="loading-placeholder">Lädt…</div>';
    const pack = await AppState.getLanguagePack();
    const settings = AppState.getSettings();
    const pool = PracticePool.buildPool(pack);
    const reviewItems = pool.map((i) => ({ cardId: i.cardId, skill: i.skill }));

    const dailyNewLimit = ReviewScheduler.ALLOWED_DAILY_LIMITS.includes(settings.dailyNewLimit)
      ? settings.dailyNewLimit
      : ReviewScheduler.DEFAULT_DAILY_NEW_LIMIT;
    const newItemsShownToday = AppState.getDailyNewCount();
    const summary = ReviewScheduler.summarize(reviewItems, AppState.getCard, { dailyNewLimit, newItemsShownToday });

    const overall = ProgressStats.computeOverallProgress(pool, AppState.getCard);
    const byCategory = ProgressStats.computeByCategory(pool, AppState.getCard);

    const estimatedMinutes = Math.max(1, Math.round((summary.dueToday + summary.newAvailableToday) * 0.5));
    const activeSessionId = AppState.getActiveSessionId();

    container.innerHTML = `
      <div class="view">
        <h1>Willkommen zurück 👋</h1>

        <div class="card">
          <p class="lead" style="margin-top:0;">Heute</p>
          <p>📌 Fällige Wiederholungen: <strong>${summary.dueToday}</strong></p>
          <p>🆕 Neue Wörter verfügbar: <strong>${summary.newAvailableToday}</strong> (Tageslimit ${dailyNewLimit}, davon ${newItemsShownToday} bereits heute gezeigt)</p>
          <p>⏱ Geschätzte Dauer: ca. ${estimatedMinutes} Minuten</p>
          ${activeSessionId ? `<p>▶️ Unterbrochene Session vorhanden (${activeSessionId})</p>` : ''}
          <button class="btn" id="dash-continue" style="margin-top:12px;">Heute weiterlernen</button>
        </div>

        <div class="card">
          <p class="lead" style="margin-top:0;">Gesamtfortschritt Kurs 1</p>
          ${renderProgressBar('Alle Bereiche', overall.percent)}
          ${CATEGORY_ORDER.filter((c) => c in byCategory).map((c) => renderProgressBar(PracticePool.CATEGORY_LABELS[c] || c, byCategory[c])).join('')}
        </div>
      </div>
    `;

    container.querySelector('#dash-continue').addEventListener('click', () => {
      App.navigateToFreePractice({ presetFilters: { dueOnly: true }, autoStart: true });
    });
  }

  return { mount };
})();
