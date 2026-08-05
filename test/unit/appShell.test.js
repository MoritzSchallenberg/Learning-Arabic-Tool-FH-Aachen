// Tests für die neue App-Shell/Navigation (Entwicklungsauftrag 4, Schritt 1 + Abschnitt 24
// "Navigation/Interface"): Hauptnavigation zeigt nur die 6 Hauptbereiche, Kopfzeile/Breadcrumbs
// werden sicher (ohne innerHTML mit dynamischen Texten) gerendert, Sidebar lässt sich ein-/
// ausklappen und der Zustand wird gespeichert, Theme wird tatsächlich angewendet.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { FakeElement } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');

// --- Statischer Check: index.html selbst, ohne irgendetwas auszuführen -----------------------

test('index.html: #main-nav enthält genau die 5 Hauptbereiche + Einstellungen im Footer (6 insgesamt)', () => {
  const html = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf-8');
  const navSection = html.match(/<ul class="main-nav"[^>]*>([\s\S]*?)<\/ul>/)[1];
  const navIds = [...navSection.matchAll(/data-nav="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(navIds, ['dashboard', 'course', 'review', 'free-practice', 'progress'],
    'Hauptnavigation sollte genau diese 5 Bereiche in dieser Reihenfolge zeigen (Einstellungen liegt separat im Footer)');

  const footerSection = html.match(/<div class="sidebar-footer">([\s\S]*?)<\/div>\s*<\/nav>/)[1];
  assert.ok(footerSection.includes('data-nav="settings"'), 'Einstellungen sollte im Sidebar-Footer liegen, nicht in der Hauptliste');
});

// --- App.js gegen eine minimale, aber echte getElementById-fähige Document-Stub laden ---------

function createFullDocumentStub() {
  const byId = new Map();
  const documentElement = new FakeElement('html');
  documentElement.setAttribute = function setAttribute(name, value) {
    this._attrs = this._attrs || {};
    this._attrs[name] = String(value);
  };
  documentElement.removeAttribute = function removeAttribute(name) {
    if (this._attrs) delete this._attrs[name];
  };
  documentElement.getAttribute = function getAttribute(name) {
    return this._attrs && name in this._attrs ? this._attrs[name] : null;
  };
  documentElement.hasAttribute = function hasAttribute(name) {
    return !!(this._attrs && name in this._attrs);
  };

  function register(el, id, className) {
    if (id) { el.id = id; byId.set(id, el); }
    if (className) el.className = className;
    return el;
  }

  const content = register(new FakeElement('main'), 'content');
  const header = register(new FakeElement('header'), 'app-header');
  const sidebar = register(new FakeElement('nav'), 'sidebar');
  const sidebarToggle = register(new FakeElement('button'), 'sidebar-toggle');
  sidebar.appendChild(sidebarToggle);
  for (const nav of ['dashboard', 'course', 'review', 'free-practice', 'progress', 'settings']) {
    const btn = register(new FakeElement('button'), `nav-${nav}`, 'nav-item');
    btn.dataset = { nav };
    sidebar.appendChild(btn);
  }

  return {
    getElementById: (id) => byId.get(id) || null,
    createElement: (tag) => new FakeElement(tag),
    documentElement,
    body: new FakeElement('body'),
    addEventListener: () => {} // window.addEventListener-Aufruf am Dateiende von app.js
  };
}

function stubView(name) {
  return { mount: () => {} };
}

function loadApp(fakeAppState) {
  const document = createFullDocumentStub();
  const context = {
    document,
    window: { addEventListener: () => {} },
    console,
    AppState: fakeAppState,
    OnboardingView: stubView(), KeyboardTutorialView: stubView(), AlphabetView: stubView(),
    LetterGroupLessonView: stubView(), ShortVowelsView: stubView(), LongVowelsView: stubView(),
    Unit10View: stubView(), GrammarView: stubView(), VocabularyView: stubView(),
    ListeningView: stubView(), GrammarAdvancedView: stubView(), GrammarExtendedView: stubView(),
    ReadingView: stubView(), ExamView: stubView(), SettingsView: stubView(),
    StatisticsView: stubView(), FreePracticeView: stubView(), DashboardView: stubView(),
    CourseView: stubView(), UnitDetailView: stubView(), SessionController: stubView()
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'app.js'), 'utf-8');
  // app.js registriert am Dateiende einen DOMContentLoaded-Listener über window.addEventListener
  // — das echte window existiert hier nicht als globaler Bezeichner (nur "document" ist global im
  // Browser-Sinn), daher entfernen wir genau diesen einen Aufruf für den Test.
  const withoutBootstrap = src.replace(/window\.addEventListener\([\s\S]*?\}\);?\s*$/, '');
  vm.runInContext(`${withoutBootstrap}\nthis.__App = App; this.__document = document;`, context);
  return { App: context.__App, document };
}

function fakeAppStateBase(overrides = {}) {
  return {
    init: () => Promise.resolve(),
    getLanguagePack: () => Promise.resolve({ lessons: { lessons: [] }, courses: { courses: [] } }),
    getSettings: () => ({ theme: 'system', sidebarCollapsed: false, arabicFontScale: 'normal' }),
    getLessonFlag: () => ({ status: 'completed' }),
    updateSettings: () => Promise.resolve(),
    ...overrides
  };
}

test('App.renderHeader(): Breadcrumbs werden sicher als eigene Elemente gerendert, letzter Eintrag ohne Klick-Handler', () => {
  const { App, document } = loadApp(fakeAppStateBase());
  const clicks = [];
  App.renderHeader({
    breadcrumbs: [
      { label: 'Kurs', onClick: () => clicks.push('kurs') },
      { label: 'Unit <script>alert(1)</script>', onClick: () => clicks.push('unit') },
      { label: 'Session 1' }
    ],
    title: 'Session 1'
  });

  const header = document.getElementById('app-header');
  const crumbTexts = header.querySelectorAll('li').map((li) => li.textContent).filter((t) => t !== '›');
  assert.deepEqual(crumbTexts, ['Kurs', 'Unit <script>alert(1)</script>', 'Session 1']);

  // Der zweite Breadcrumb-Text wird als reiner Text (textContent), nicht als HTML eingefügt —
  // es darf also kein zusätzliches <script>-Element im Baum entstehen (Abschnitt 23).
  assert.equal(header.querySelectorAll('script').length, 0, 'Breadcrumb-Texte dürfen niemals als HTML interpretiert werden');

  // Nur die ERSTEN beiden Breadcrumbs sind klickbare Buttons, der letzte ("Session 1") nicht.
  const buttons = header.querySelectorAll('button').filter((b) => b.textContent !== '← Zurück');
  assert.equal(buttons.length, 2, 'nur nicht-letzte Breadcrumbs sollten klickbar sein');
  buttons[1].click();
  assert.deepEqual(clicks, ['unit']);
});

test('App.renderHeader(): ohne Titel/Breadcrumbs bleibt die Kopfzeile leer (z. B. Startseite)', () => {
  const { App, document } = loadApp(fakeAppStateBase());
  App.renderHeader({ title: 'Etwas' });
  App.renderHeader({});
  const header = document.getElementById('app-header');
  assert.equal(header.children.length, 0, 'renderHeader({}) sollte die Kopfzeile leeren, nicht die vorherige beibehalten');
});

test('App: Sidebar-Toggle klappt ein/aus und speichert den Zustand über AppState.updateSettings', async () => {
  const savedSettings = [];
  const { App, document } = loadApp(fakeAppStateBase({ updateSettings: (s) => { savedSettings.push(s); return Promise.resolve(); } }));
  await App.init();

  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  assert.ok(!sidebar.classList.contains('collapsed'), 'Sidebar sollte initial ausgeklappt sein (sidebarCollapsed: false)');

  toggleBtn.click();
  assert.ok(sidebar.classList.contains('collapsed'), 'nach dem ersten Klick sollte die Sidebar eingeklappt sein');
  // Das über vm.createContext() erzeugte Objekt lebt in einem anderen Realm als dieser Test
  // (anderer Object.prototype) — assert/strict's deepEqual==deepStrictEqual scheitert deshalb an
  // reiner Prototyp-Ungleichheit. Feld-für-Feld-Vergleich statt vollem deepEqual über die
  // Realm-Grenze hinweg.
  assert.equal(savedSettings[savedSettings.length - 1].sidebarCollapsed, true);

  toggleBtn.click();
  assert.ok(!sidebar.classList.contains('collapsed'), 'nach dem zweiten Klick sollte die Sidebar wieder ausgeklappt sein');
  assert.equal(savedSettings[savedSettings.length - 1].sidebarCollapsed, false);
});

test('App: gespeicherte sidebarCollapsed=true-Einstellung wird beim Start sofort angewendet', async () => {
  const { App, document } = loadApp(fakeAppStateBase({
    getSettings: () => ({ theme: 'system', sidebarCollapsed: true, arabicFontScale: 'normal' })
  }));
  await App.init();
  assert.ok(document.getElementById('sidebar').classList.contains('collapsed'));
});

test('App.applyTheme(): setzt/entfernt data-theme korrekt für hell/dunkel/system', () => {
  const { App, document } = loadApp(fakeAppStateBase());
  App.applyTheme('dark');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  App.applyTheme('light');
  assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
  App.applyTheme('system');
  assert.equal(document.documentElement.getAttribute('data-theme'), null, '"system" sollte data-theme entfernen, damit die Media Query greift');
});

test('App.init(): wendet das gespeicherte Theme beim Start an', async () => {
  const { App, document } = loadApp(fakeAppStateBase({
    getSettings: () => ({ theme: 'dark', sidebarCollapsed: false, arabicFontScale: 'normal' })
  }));
  await App.init();
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
});

test('App.init(): große arabische Schrift wird als data-arabic-scale="large" gesetzt, "normal" setzt kein Attribut', async () => {
  const large = loadApp(fakeAppStateBase({
    getSettings: () => ({ theme: 'system', sidebarCollapsed: false, arabicFontScale: 'large' })
  }));
  await large.App.init();
  assert.equal(large.document.documentElement.getAttribute('data-arabic-scale'), 'large');

  const normal = loadApp(fakeAppStateBase());
  await normal.App.init();
  assert.equal(normal.document.documentElement.getAttribute('data-arabic-scale'), null);
});
