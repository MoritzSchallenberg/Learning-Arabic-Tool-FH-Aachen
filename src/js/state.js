// Zentrale Fortschritts-/Einstellungsverwaltung. Lädt/speichert über die preload-API
// (main.js schreibt nach app.getPath('userData')/user_data/*.json, atomar + versioniert über
// src/js/progressStore.js — P0.4). progress hat die Form { _version, languages: { [id]: {...} } },
// die Migration von altem, unversioniertem Format passiert transparent in main.js beim Laden.

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
    if (!progress.languages[currentLanguageId].lessonFlags) {
      progress.languages[currentLanguageId].lessonFlags = {};
    }
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
    getLessonFlag,
    markLessonStarted,
    markLessonCompleted,
    getLanguagePack,
    get currentLanguageId() {
      return currentLanguageId;
    }
  };
})();
