// Zentrale Fortschritts-/Einstellungsverwaltung. Lädt/speichert über die preload-API
// (main.js schreibt nach app.getPath('userData')/user_data/*.json, atomar + versioniert über
// src/js/progressStore.js — P0.4). progress hat die Form { _version, languages: { [id]: {...} } },
// die Migration von altem, unversioniertem Format passiert transparent in main.js beim Laden.
//
// Entwicklungsauftrag 3 (Meilenstein B) ergänzt zwei weitere, pro Sprache gespeicherte Bereiche:
// - theoryProgress: Lesefortschritt je Theorieseite (nicht gelesen/geöffnet/Mini-Check
//   bestanden/abgeschlossen), siehe theoryRenderer.js.
// - sessionState + activeSessionId: Zustand einer unterbrochenen Session (Phase, Position,
//   bereits gezeigte Wörter, offene Wiederholungen) für "Session fortsetzen" statt
//   automatischem Neustart, siehe sessionEngine.js.

const AppState = (() => {
  let settings = null;
  let progress = null;
  let currentLanguageId = 'arabic';
  let languagePackCache = {};

  async function init() {
    settings = await window.api.loadSettings();
    progress = await window.api.loadProgress();
    if (!progress.languages) progress.languages = {};
    if (!progress.languages[currentLanguageId]) {
      progress.languages[currentLanguageId] = { cards: {} };
    }
    const lang = progress.languages[currentLanguageId];
    if (!lang.lessonFlags) lang.lessonFlags = {};
    if (!lang.theoryProgress) lang.theoryProgress = {};
    if (!lang.sessionState) lang.sessionState = {};
    if (!('activeSessionId' in lang)) lang.activeSessionId = null;
    if (!lang.dailyNewCount) lang.dailyNewCount = { date: null, count: 0 };
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function currentLangProgress() {
    return progress.languages[currentLanguageId];
  }

  function getSettings() {
    return settings;
  }

  async function updateSettings(partial) {
    settings = { ...settings, ...partial };
    await window.api.saveSettings(settings);
    return settings;
  }

  function getCard(cardId) {
    const langProgress = currentLangProgress();
    if (!langProgress.cards[cardId]) {
      langProgress.cards[cardId] = { difficulty: {}, consecutiveWrong: {} };
    }
    return langProgress.cards[cardId];
  }

  async function persistProgress() {
    await window.api.saveProgress(progress);
  }

  function getAllCards() {
    return currentLangProgress().cards;
  }

  // --- Manuelle "Als schwierig markieren"-Markierung (Entwicklungsauftrag 15, Abschnitt 9.7) --
  // Bewusst getrennt von card.difficulty (srs.js, aus Antwortverhalten BERECHNET) -- dies ist
  // eine EXPLIZITE, vom Nutzer selbst gesetzte Markierung auf derselben, bereits vorhandenen
  // Karte/demselben Speicherplatz (kein zweiter Speichermechanismus, Abschnitt 3/18).
  function isWordMarkedDifficult(wordId) {
    return !!getCard(wordId).markedDifficult;
  }

  async function toggleWordDifficult(wordId) {
    const card = getCard(wordId);
    card.markedDifficult = !card.markedDifficult;
    await persistProgress();
    return card.markedDifficult;
  }

  // Für nicht karten-basierte Lektionen (Tutorials, Prüfung) — grobe Statusanzeige in der
  // Seitenleiste (Spec Kapitel 13/20.3 "gesperrte und freigeschaltete Lessons", vereinfacht).
  function getLessonFlag(key) {
    return currentLangProgress().lessonFlags[key] || null;
  }

  async function markLessonStarted(key) {
    const flags = currentLangProgress().lessonFlags;
    if (!flags[key]) {
      flags[key] = { status: 'started' };
      await persistProgress();
    }
  }

  async function markLessonCompleted(key, meta) {
    currentLangProgress().lessonFlags[key] = { status: 'completed', meta: meta || null };
    await persistProgress();
  }

  // --- Theoriefortschritt (Meilenstein B, Abschnitt 11.4) -----------------------------------
  function getTheoryProgress(theoryId) {
    return currentLangProgress().theoryProgress[theoryId] || { status: 'not_started' };
  }

  async function markTheoryOpened(theoryId) {
    const store = currentLangProgress().theoryProgress;
    if (!store[theoryId] || store[theoryId].status === 'not_started') {
      store[theoryId] = { status: 'opened' };
      await persistProgress();
    }
  }

  async function markTheoryMiniCheckResult(theoryId, correct, total) {
    const store = currentLangProgress().theoryProgress;
    const passed = total > 0 && correct / total >= 0.6;
    store[theoryId] = {
      status: passed ? 'mini_check_passed' : (store[theoryId]?.status || 'opened'),
      miniCheck: { correct, total, passed }
    };
    await persistProgress();
    return passed;
  }

  async function markTheoryCompleted(theoryId) {
    const store = currentLangProgress().theoryProgress;
    const previous = store[theoryId] || {};
    store[theoryId] = { ...previous, status: 'completed' };
    await persistProgress();
  }

  // --- Session-Wiederaufnahme (Meilenstein B, Abschnitt 21) ---------------------------------
  function getSessionState(sessionId) {
    return currentLangProgress().sessionState[sessionId] || null;
  }

  async function saveSessionState(sessionId, state) {
    const lang = currentLangProgress();
    lang.sessionState[sessionId] = { ...state, savedAt: new Date().toISOString() };
    lang.activeSessionId = sessionId;
    await persistProgress();
  }

  async function clearSessionState(sessionId) {
    const lang = currentLangProgress();
    delete lang.sessionState[sessionId];
    if (lang.activeSessionId === sessionId) lang.activeSessionId = null;
    await persistProgress();
  }

  function getActiveSessionId() {
    return currentLangProgress().activeSessionId || null;
  }

  // --- Tageslimit für neue Wörter (Meilenstein B, Abschnitt 18) -----------------------------
  function getDailyNewCount() {
    const lang = currentLangProgress();
    const today = todayIso();
    if (lang.dailyNewCount.date !== today) {
      return 0; // neuer Tag -> Zähler gilt als zurückgesetzt (persistiert erst beim nächsten increment)
    }
    return lang.dailyNewCount.count;
  }

  async function incrementDailyNewCount(by = 1) {
    const lang = currentLangProgress();
    const today = todayIso();
    if (lang.dailyNewCount.date !== today) {
      lang.dailyNewCount = { date: today, count: 0 };
    }
    lang.dailyNewCount.count += by;
    await persistProgress();
    return lang.dailyNewCount.count;
  }

  async function getLanguagePack(languageId = currentLanguageId) {
    if (!languagePackCache[languageId]) {
      languagePackCache[languageId] = await window.api.loadLanguagePack(languageId);
    }
    return languagePackCache[languageId];
  }

  return {
    init,
    getSettings,
    updateSettings,
    getCard,
    persistProgress,
    getAllCards,
    isWordMarkedDifficult,
    toggleWordDifficult,
    getLessonFlag,
    markLessonStarted,
    markLessonCompleted,
    getTheoryProgress,
    markTheoryOpened,
    markTheoryMiniCheckResult,
    markTheoryCompleted,
    getSessionState,
    saveSessionState,
    clearSessionState,
    getActiveSessionId,
    getDailyNewCount,
    incrementDailyNewCount,
    getLanguagePack,
    get currentLanguageId() {
      return currentLanguageId;
    }
  };
})();
