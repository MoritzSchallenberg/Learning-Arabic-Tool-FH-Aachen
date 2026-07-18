// Zentrale Fortschritts-/Einstellungsverwaltung. Lädt/speichert über die preload-API
// (main.js schreibt nach app.getPath('userData')/user_data/*.json).

const AppState = (() => {
  let settings = null;
  let progress = null;
  let currentLanguageId = 'arabic';
  let languagePackCache = {};

  async function init() {
    settings = await window.api.loadSettings();
    progress = await window.api.loadProgress();
    if (!progress[currentLanguageId]) {
      progress[currentLanguageId] = { cards: {} };
    }
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
    const langProgress = progress[currentLanguageId];
    if (!langProgress.cards[cardId]) {
      langProgress.cards[cardId] = { difficulty: {}, consecutiveWrong: {} };
    }
    return langProgress.cards[cardId];
  }

  async function persistProgress() {
    await window.api.saveProgress(progress);
  }

  function getAllCards() {
    return progress[currentLanguageId].cards;
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
    getLanguagePack,
    get currentLanguageId() {
      return currentLanguageId;
    }
  };
})();
