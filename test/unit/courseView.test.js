// Tests für Kursansicht und Unit-Detailansicht (Entwicklungsauftrag 4, Schritt 2 + Abschnitt 24
// "Navigation/Interface"): Unit-Karten rendern korrekt (Titel, Wortanzahl, Status), Session-Karten
// zeigen Status/Fortschritt und den passenden Button-Text, Klicks navigieren mit den richtigen
// Parametern weiter.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');

function loadVocabSessions() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabSessions.json'), 'utf-8'));
}

function fakeCourses() {
  return {
    courses: [{
      id: 'course_1',
      title: 'Kurs 1: Arabische Schrift und Grundwörter',
      units: [
        { id: 'unit_1', type: 'letter_group', title: 'Buchstaben-Gruppe 1', letters: ['alif'] }
      ]
    }]
  };
}

function fakeLessons() {
  return { lessons: [{ key: 'unit_1', title: 'Buchstaben-Gruppe 1', status: 'available', intro: 'Intro' }] };
}

// --- CourseView --------------------------------------------------------------------------------

function loadCourseView({ sessionStates = {} } = {}) {
  const navigateCalls = [];
  const context = {
    document: createDocumentStub(),
    console,
    App: {
      navigateTo: (key) => navigateCalls.push(`legacy:${key}`),
      navigateToUnitDetail: (unitId) => navigateCalls.push(`unit:${unitId}`)
    },
    AppState: {
      getLanguagePack: () => Promise.resolve({
        courses: fakeCourses(),
        lessons: fakeLessons(),
        vocabSessions: loadVocabSessions(),
        keyboard: { letters: [] },
        vocabulary: { categories: [] }
      }),
      getSessionState: (id) => sessionStates[id] || null,
      getCard: () => ({ difficulty: {} })
    }
  };
  vm.createContext(context);
  const SOURCE_FILES = [
    'src/js/lessonProgress.js',
    'src/js/reviewScheduler.js',
    'src/js/practicePool.js',
    'src/js/progressStats.js',
    'src/js/session/sessionState.js',
    'src/js/views/courseView.js'
  ];
  const combinedSrc = SOURCE_FILES.map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${combinedSrc}\nthis.__CourseView = CourseView;`, context);
  return { view: context.__CourseView, navigateCalls };
}

test('CourseView.mount() rendert eine Karte je Kurs-1-Unit und je Vokabel-Unit', async () => {
  const { view } = loadCourseView();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  const cards = container.querySelectorAll('.unit-card');
  // 1 legacy Kurs-1-Unit + 1 Pilot-Vokabel-Unit ("Begrüßung und Höflichkeit").
  assert.equal(cards.length, 2, 'sollte eine Karte je Legacy-Unit und je Vokabel-Unit zeigen');
  assert.ok(container.textContent.includes('Begrüßung und Höflichkeit'), 'Vokabel-Unit-Titel sollte sichtbar sein');
  assert.ok(container.textContent.includes('Lernroute'), 'Abschnittsüberschrift "Lernroute" erwartet');
});

test('CourseView: unbegonnene Vokabel-Unit zeigt Status "Verfügbar"', async () => {
  const { view } = loadCourseView({ sessionStates: {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  const vocabCard = container.querySelectorAll('.unit-card')[1];
  const badge = vocabCard.querySelector('.status-badge');
  assert.ok(badge, 'Status-Badge sollte vorhanden sein');
  assert.ok(badge.className.includes('available'), 'unbegonnene Unit sollte als "available" markiert sein');
});

test('CourseView: abgeschlossene Session lässt Vokabel-Unit als "Abgeschlossen" erscheinen', async () => {
  const { view } = loadCourseView({ sessionStates: { vocab_unit_01_a: { status: 'completed' } } });
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  const vocabCard = container.querySelectorAll('.unit-card')[1];
  const badge = vocabCard.querySelector('.status-badge');
  assert.ok(badge.className.includes('completed'), 'abgeschlossene Unit sollte als "completed" markiert sein');
});

test('CourseView: Klick auf Vokabel-Unit-Karte navigiert mit der richtigen Unit-ID weiter', async () => {
  const { view, navigateCalls } = loadCourseView();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  container.querySelectorAll('.unit-card')[1].click();
  assert.deepEqual(navigateCalls, ['unit:vocab_unit_01']);
});

test('CourseView: Klick auf Legacy-Unit-Karte navigiert weiterhin über App.navigateTo(key)', async () => {
  const { view, navigateCalls } = loadCourseView();
  const container = createDocumentStub().createElement('div');
  await view.mount(container);

  container.querySelectorAll('.unit-card')[0].click();
  assert.deepEqual(navigateCalls, ['legacy:unit_1']);
});

// --- UnitDetailView -----------------------------------------------------------------------------

function loadUnitDetailView({ sessionStates = {} } = {}) {
  const navigateCalls = [];
  const context = {
    document: createDocumentStub(),
    console,
    App: {
      navigateToCourse: () => navigateCalls.push('course'),
      navigateToSession: (unitId, sessionId) => navigateCalls.push(`session:${unitId}:${sessionId}`),
      renderHeader: () => {}
    },
    AppState: {
      getLanguagePack: () => Promise.resolve({ vocabSessions: loadVocabSessions() }),
      getSessionState: (id) => sessionStates[id] || null
    }
  };
  vm.createContext(context);
  const SOURCE_FILES = ['src/js/session/sessionState.js', 'src/js/views/unitDetailView.js'];
  const combinedSrc = SOURCE_FILES.map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${combinedSrc}\nthis.__UnitDetailView = UnitDetailView;`, context);
  return { view: context.__UnitDetailView, navigateCalls };
}

test('UnitDetailView.mount() zeigt eine Session-Karte mit Titel, Wortanzahl und Phasen-Tags', async () => {
  const { view } = loadUnitDetailView();
  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'vocab_unit_01');

  const cards = container.querySelectorAll('.session-card');
  assert.equal(cards.length, 1, 'Pilot-Unit hat genau eine Session');
  assert.ok(container.textContent.includes('Begrüßung und Höflichkeit'));
  assert.ok(container.textContent.includes('9 neue Wörter'));
  const tags = container.querySelectorAll('.session-card-phase-tag').map((t) => t.textContent);
  assert.ok(tags.includes('Theorie'), 'Phasen-Tags sollten "Theorie" enthalten');
  assert.ok(tags.includes('Lernen'), 'Phasen-Tags sollten "Lernen" enthalten');
  assert.ok(tags.includes('Üben'), 'Phasen-Tags sollten "Üben" enthalten');
});

test('UnitDetailView: Session-Status steuert Badge und Button-Beschriftung (noch nicht begonnen)', async () => {
  const { view } = loadUnitDetailView({ sessionStates: {} });
  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'vocab_unit_01');

  const badge = container.querySelector('.status-badge');
  assert.ok(badge.className.includes('available'));
  assert.equal(badge.textContent, 'Verfügbar');
  const btn = container.querySelectorAll('button').find((b) => b.textContent === 'Session starten');
  assert.ok(btn, 'noch nicht begonnene Session sollte "Session starten" anbieten');
});

test('UnitDetailView: laufende Session zeigt "Fortsetzen", abgeschlossene "Erneut üben"', async () => {
  const running = loadUnitDetailView({ sessionStates: { vocab_unit_01_a: { status: 'in_progress' } } });
  const c1 = createDocumentStub().createElement('div');
  await running.view.mount(c1, 'vocab_unit_01');
  assert.ok(c1.querySelectorAll('button').some((b) => b.textContent === 'Fortsetzen'));

  const done = loadUnitDetailView({ sessionStates: { vocab_unit_01_a: { status: 'completed' } } });
  const c2 = createDocumentStub().createElement('div');
  await done.view.mount(c2, 'vocab_unit_01');
  assert.ok(c2.querySelectorAll('button').some((b) => b.textContent === 'Erneut üben'));
});

test('UnitDetailView: Klick auf Session-Button navigiert mit Unit- und Session-ID weiter', async () => {
  const { view, navigateCalls } = loadUnitDetailView();
  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'vocab_unit_01');

  container.querySelectorAll('button').find((b) => b.textContent === 'Session starten').click();
  assert.deepEqual(navigateCalls, ['session:vocab_unit_01:vocab_unit_01_a']);
});

test('UnitDetailView: unbekannte Unit-ID zeigt einen Empty-State statt eines Absturzes', async () => {
  const { view } = loadUnitDetailView();
  const container = createDocumentStub().createElement('div');
  await view.mount(container, 'does_not_exist');
  assert.ok(container.querySelector('.empty-state'), 'unbekannte Unit sollte einen Empty-State zeigen');
});
