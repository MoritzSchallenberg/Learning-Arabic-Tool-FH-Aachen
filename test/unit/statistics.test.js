// Regressionstest für den behobenen Anzeigefehler in statistics.js (Beherrschung vs.
// Schwierigkeit, Entwicklungsauftrag 3, Meilenstein B, Abschnitt 20).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');
const ProgressStats = require('../../src/js/progressStats.js');

function loadStatisticsView(cards) {
  const context = {
    document: createDocumentStub(),
    console,
    ProgressStats,
    INTENSIVE_REVIEW_THRESHOLD: 3,
    AppState: { getAllCards: () => cards }
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'js', 'views', 'statistics.js'), 'utf-8');
  vm.runInContext(src + '\nthis.__StatisticsView = StatisticsView;', context);
  return context.__StatisticsView;
}

test('gut beherrschte Fähigkeiten (niedrige Schwierigkeit) zeigen einen hohen Beherrschungs-Balken', () => {
  const cards = { w1: { difficulty: { listening: 1 } } };
  const view = loadStatisticsView(cards);
  const container = createDocumentStub().createElement('div');
  view.mount(container);

  const fills = container.querySelectorAll('.meter-fill.mastery');
  const widths = fills.map((f) => parseFloat((f.style.width || '0%').replace('%', '')));
  assert.ok(widths.some((w) => w > 90), 'bei Schwierigkeit 1 sollte mindestens ein Beherrschungsbalken nahe 100% sein');
});

test('schlecht beherrschte Fähigkeiten (hohe Schwierigkeit) zeigen einen niedrigen Beherrschungs-Balken', () => {
  const cards = { w1: { difficulty: { listening: 9 } } };
  const view = loadStatisticsView(cards);
  const container = createDocumentStub().createElement('div');
  view.mount(container);

  const fills = container.querySelectorAll('.meter-fill.mastery');
  const widths = fills.map((f) => parseFloat((f.style.width || '0%').replace('%', '')));
  const hoerenIndex = container.textContent.indexOf('Hören');
  assert.ok(hoerenIndex !== -1);
  // Der wichtigste Punkt: der Beherrschungs-Balken für "Hören" ist bei Schwierigkeit 9 NIEDRIG,
  // nicht hoch (das war der ursprüngliche Anzeigefehler).
  assert.ok(widths.some((w) => w < 20), 'bei Schwierigkeit 9 sollte der Beherrschungsbalken niedrig sein');
});

test('Beherrschungs- und Schwierigkeits-Balken sind beide vorhanden und farblich unterschieden', () => {
  const cards = { w1: { difficulty: { arabic_to_german: 5 } } };
  const view = loadStatisticsView(cards);
  const container = createDocumentStub().createElement('div');
  view.mount(container);

  assert.ok(container.querySelectorAll('.meter-fill.mastery').length > 0);
  assert.ok(container.querySelectorAll('.meter-fill.difficulty').length > 0);
  assert.ok(container.textContent.includes('höher = besser'));
  assert.ok(container.textContent.includes('höher = schwieriger'));
});

test('leere Kartendaten führen nicht zum Absturz', () => {
  const view = loadStatisticsView({});
  const container = createDocumentStub().createElement('div');
  assert.doesNotThrow(() => view.mount(container));
  assert.ok(container.textContent.includes('keine Daten') || container.textContent.includes('Noch keine Übungsdaten'));
});
