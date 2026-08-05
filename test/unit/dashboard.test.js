// Test für die Startseite (Entwicklungsauftrag 3, Meilenstein B, Abschnitt 18).
global.TATWEEL = 'ـ';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ReviewScheduler = require('../../src/js/reviewScheduler.js');
const PracticePool = require('../../src/js/practicePool.js');
const ProgressStats = require('../../src/js/progressStats.js');
const wordShaping = require('../../src/js/wordShaping.js');
const srs = require('../../src/js/srs.js');

global.normalizeArabic = srs.normalizeArabic;
global.lettersFromWord = wordShaping.lettersFromWord;

function fakePack() {
  return {
    keyboard: { letters: [{ id: 'alif', letter: 'ا', name: 'Alif', joining: 'right' }] },
    vocabulary: { categories: [{ id: 'home', words: [{ id: 'housing_door', arabic: 'اب', german: 'Test' }] }] }
  };
}

function loadDashboard() {
  let navigatedWith = null;
  const context = {
    document: createDocumentStub(),
    console,
    ReviewScheduler,
    PracticePool,
    ProgressStats,
    App: { navigateToFreePractice: (options) => { navigatedWith = options; } }
  };
  const past = new Date(Date.now() - 1000).toISOString();
  const cards = {
    letter_alif: { difficulty: { spelling: 3 }, nextReview: { spelling: past } }
  };
  context.AppState = {
    getLanguagePack: () => Promise.resolve(fakePack()),
    getSettings: () => ({}),
    getCard: (id) => cards[id] || { difficulty: {} },
    getDailyNewCount: () => 0,
    getActiveSessionId: () => null
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'views', 'dashboard.js'), 'utf-8');
  vm.runInContext(src + '\nthis.__DashboardView = DashboardView;', context);
  return { view: context.__DashboardView, getNavigatedWith: () => navigatedWith };
}

test('mount() zeigt fällige Wiederholungen, neue Wörter und einen Gesamtfortschritts-Balken', async () => {
  const { view } = loadDashboard();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  assert.ok(container.textContent.includes('Willkommen zurück'));
  assert.ok(container.textContent.includes('Fällige Wiederholungen'));
  assert.ok(container.textContent.includes('Neue Wörter verfügbar'));
  assert.ok(container.querySelectorAll('.meter-fill.mastery').length > 0);
});

test('"Heute weiterlernen" navigiert zum freien Übungsmodus mit dueOnly-Filter und Autostart', async () => {
  const { view, getNavigatedWith } = loadDashboard();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  const btn = container.querySelectorAll('button').find((b) => b.textContent === 'Heute weiterlernen');
  assert.ok(btn, '"Heute weiterlernen"-Button fehlt');
  btn.click();

  const navigatedWith = getNavigatedWith();
  assert.ok(navigatedWith);
  assert.equal(navigatedWith.autoStart, true);
  assert.equal(navigatedWith.presetFilters.dueOnly, true);
});
