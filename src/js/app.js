// Bootstrapping und Navigation (Entwicklungsauftrag 4, Schritt 1: neues Navigationskonzept).
// Die Hauptnavigation zeigt nur noch die 6 Hauptbereiche (Start/Kurs/Wiederholen/Frei üben/
// Fortschritt/Einstellungen) statt einer dauerhaft ausgeklappten Liste aller Units/Lektionen —
// die Kurs-/Unit-/Session-Navigation lebt jetzt in CourseView/UnitDetailView (Schritt 2).
// lessons.json + VIEW_BY_KEY bleiben für die BESTEHENDEN Kurs-1-Units (0-10) und Lektionen 3-11
// unverändert bestehen (Rückwärtskompatibilität) — sie werden nur nicht mehr direkt in der
// Seitenleiste aufgelistet, sondern über CourseView erreicht.

const App = (() => {
  const contentEl = document.getElementById('content');
  const headerEl = document.getElementById('app-header');
  const sidebarEl = document.getElementById('sidebar');
  let lessons = [];
  let courses = [];
  let currentKey = null;
  let pack = null;
  // P0.2: wird von der jeweils gemounteten View gesetzt (z. B. um offene ExerciseGuard-Timer
  // abzubrechen), und IMMER aufgerufen, bevor eine andere View/Ansicht gemountet wird.
  let currentCleanup = null;

  const VIEW_BY_KEY = {
    onboarding: { view: OnboardingView },
    keyboard_tutorial: { view: KeyboardTutorialView },
    alphabet: { view: AlphabetView },
    unit_1: { view: LetterGroupLessonView, arg: 'unit_1' },
    unit_2: { view: LetterGroupLessonView, arg: 'unit_2' },
    unit_3: { view: LetterGroupLessonView, arg: 'unit_3' },
    unit_4: { view: LetterGroupLessonView, arg: 'unit_4' },
    unit_5: { view: LetterGroupLessonView, arg: 'unit_5' },
    unit_6: { view: LetterGroupLessonView, arg: 'unit_6' },
    unit_7: { view: LetterGroupLessonView, arg: 'unit_7' },
    unit_8: { view: ShortVowelsView },
    unit_9: { view: LongVowelsView },
    unit_10: { view: Unit10View },
    grammar_1: { view: GrammarView },
    vocabulary_1: { view: VocabularyView, arg: 3 },
    listening_1: { view: ListeningView },
    vocabulary_2: { view: VocabularyView, arg: 6 },
    grammar_2: { view: GrammarAdvancedView },
    vocabulary_advanced: { view: VocabularyView, arg: 8 },
    grammar_advanced: { view: GrammarExtendedView },
    reading_writing: { view: ReadingView },
    review_exam: { view: ExamView }
  };

  // P0.2: von Views aufgerufen (typischerweise in mount()), um eine Aufräumfunktion zu
  // hinterlegen, die beim Verlassen der Ansicht ausgeführt wird (z. B. offene Timer/Guards
  // abbrechen). Ein erneuter Aufruf ersetzt eine vorher registrierte Funktion für dieselbe View.
  function registerCleanup(fn) {
    currentCleanup = fn;
  }

  function runCleanup() {
    // Entwicklungsauftrag 13, Abschnitt 6.3 — "kein verwaistes Audio" bei Wechsel der Aufgabe/
    // Beenden einer Session/Zurück-Navigation/Wechsel einer Unit: ALLE navigateTo*-Funktionen
    // rufen runCleanup() als erstes auf, deshalb ist das die eine zentrale Stelle, an der jede
    // Navigation zuverlässig eine noch laufende Wiedergabe stoppt -- unabhängig davon, ob die
    // verlassene View selbst eine Aufräumfunktion registriert hat.
    if (typeof AudioPlayer !== 'undefined' && AudioPlayer.stopCurrentAudio) {
      try { AudioPlayer.stopCurrentAudio(); } catch (err) { /* darf die Navigation nie verhindern */ }
    }
    if (currentCleanup) {
      try {
        currentCleanup();
      } catch (err) {
        // Aufräumen darf die Navigation nie verhindern.
      }
      currentCleanup = null;
    }
  }

  function findLessonMeta(key) {
    return lessons.find((l) => l.key === key);
  }

  // --- Hauptnavigation (Sidebar) -------------------------------------------------------------
  function setActiveNav(name) {
    sidebarEl.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.nav === name);
    });
  }

  function toggleSidebar() {
    const collapsed = sidebarEl.classList.toggle('collapsed');
    AppState.updateSettings({ sidebarCollapsed: collapsed });
  }

  // --- Kopfzeile (Entwicklungsauftrag 4, Abschnitt 4.3) — sicher gerendert, kein innerHTML
  // mit dynamischen Titeln/Breadcrumb-Texten (Abschnitt 23: Schutz vor unsicheren Kursdaten,
  // auch wenn diese aktuell nur aus lokalen JSON-Dateien stammen). ---------------------------
  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    return node;
  }

  /**
   * @param {object} config
   * @param {{label:string, onClick?:Function}[]} [config.breadcrumbs]
   * @param {string} [config.title]
   * @param {Function} [config.onBack]
   * @param {string} [config.progressText]
   */
  function renderHeader(config = {}) {
    while (headerEl.firstChild) headerEl.removeChild(headerEl.firstChild);
    if (!config.title && !(config.breadcrumbs && config.breadcrumbs.length)) return;

    const left = el('div', { className: 'header-left' });

    if (config.breadcrumbs && config.breadcrumbs.length > 0) {
      const crumbList = el('ul', { className: 'breadcrumbs' });
      config.breadcrumbs.forEach((crumb, i) => {
        const li = el('li');
        const isLast = i === config.breadcrumbs.length - 1;
        if (crumb.onClick && !isLast) {
          const btn = el('button', { text: crumb.label });
          btn.type = 'button';
          btn.addEventListener('click', crumb.onClick);
          li.appendChild(btn);
        } else {
          li.appendChild(el('span', { className: isLast ? 'crumb-current' : '', text: crumb.label }));
        }
        crumbList.appendChild(li);
        if (!isLast) {
          const sep = el('li', { className: 'crumb-sep', text: '›' });
          crumbList.appendChild(sep);
        }
      });
      left.appendChild(crumbList);
    }

    if (config.title) {
      left.appendChild(el('div', { className: 'header-title', text: config.title }));
    }

    headerEl.appendChild(left);

    const right = el('div', { className: 'header-right' });
    if (config.onBack) {
      const backBtn = el('button', { className: 'header-back-btn', text: '← Zurück' });
      backBtn.type = 'button';
      backBtn.addEventListener('click', config.onBack);
      right.appendChild(backBtn);
    }
    if (config.progressText) {
      right.appendChild(el('span', { className: 'header-progress', text: config.progressText }));
    }
    if (right.childNodes.length > 0) headerEl.appendChild(right);
  }

  // --- Bestehende Kurs-1-Units (0-10) / Lektionen 3-11 (Rückwärtskompatibilität) -------------
  function navigateTo(key) {
    const lesson = findLessonMeta(key);
    if (!lesson) return;

    runCleanup();
    currentKey = key;
    setActiveNav('course');
    renderHeader({
      breadcrumbs: [{ label: 'Kurs', onClick: navigateToCourse }],
      title: lesson.title,
      onBack: navigateToCourse
    });

    if (lesson.status === 'coming_soon') {
      contentEl.innerHTML = '';
      const view = el('div', { className: 'view' });
      view.appendChild(el('h1', { text: lesson.title }));
      view.appendChild(el('p', { className: 'lead', text: 'Diese Lektion ist Teil einer späteren Version und noch nicht verfügbar.' }));
      contentEl.appendChild(view);
      return;
    }

    renderLessonIntro(lesson);
  }

  // Sicher gerendert (textContent statt innerHTML mit Kursdaten, Abschnitt 23) — lesson.intro
  // stammt zwar aktuell nur aus einer lokalen, vertrauenswürdigen JSON-Datei, aber sobald
  // Kurspakete importierbar sind, dürfen Introtexte nicht unkontrolliert als HTML interpretiert
  // werden.
  function renderLessonIntro(lesson) {
    contentEl.innerHTML = '';
    const view = el('div', { className: 'view' });
    view.appendChild(el('h1', { text: lesson.title }));
    const card = el('div', { className: 'card' });
    card.appendChild(el('p', { className: 'lead', text: lesson.intro || '' }));
    card.style.margin = '0 0 20px';
    view.appendChild(card);
    const startBtn = el('button', { className: 'btn', text: "Los geht's" });
    startBtn.type = 'button';
    startBtn.addEventListener('click', () => {
      const entry = VIEW_BY_KEY[lesson.key];
      if (entry) entry.view.mount(contentEl, entry.arg);
    });
    view.appendChild(startBtn);
    contentEl.appendChild(view);
  }

  // --- Hauptbereiche --------------------------------------------------------------------------
  function navigateToSettings() {
    runCleanup();
    currentKey = null;
    setActiveNav('settings');
    renderHeader({ title: 'Einstellungen' });
    SettingsView.mount(contentEl);
  }

  function navigateToStatistics() {
    runCleanup();
    currentKey = null;
    setActiveNav('progress');
    renderHeader({ title: 'Fortschritt' });
    StatisticsView.mount(contentEl);
  }

  function navigateToFreePractice(options) {
    runCleanup();
    currentKey = null;
    setActiveNav('free-practice');
    renderHeader({ title: 'Frei üben' });
    FreePracticeView.mount(contentEl, options);
  }

  function navigateToReview() {
    runCleanup();
    currentKey = null;
    setActiveNav('review');
    renderHeader({ title: 'Wiederholen' });
    FreePracticeView.mount(contentEl, { presetFilters: { dueOnly: true } });
  }

  function navigateToDashboard() {
    runCleanup();
    currentKey = null;
    setActiveNav('dashboard');
    renderHeader({});
    DashboardView.mount(contentEl);
  }

  function navigateToCourse() {
    runCleanup();
    currentKey = null;
    setActiveNav('course');
    renderHeader({ title: 'Kurs 1: Arabische Schrift und Grundwörter' });
    CourseView.mount(contentEl);
  }

  function navigateToUnitDetail(unitId) {
    runCleanup();
    currentKey = null;
    setActiveNav('course');
    UnitDetailView.mount(contentEl, unitId);
  }

  function navigateToSession(unitId, sessionId) {
    runCleanup();
    currentKey = null;
    setActiveNav('course');
    SessionController.mount(contentEl, { unitId, sessionId });
  }

  // --- Theme (Hell-/Dunkel-/Systemmodus, Entwicklungsauftrag 4 Abschnitt 7.1) -----------------
  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme'); // 'system' -> Media Query entscheidet
    }
  }

  async function init() {
    await AppState.init();
    pack = await AppState.getLanguagePack();
    lessons = pack.lessons.lessons;
    courses = pack.courses ? pack.courses.courses : [];

    const settings = AppState.getSettings();
    applyTheme(settings.theme);
    if (settings.arabicFontScale === 'large') document.documentElement.setAttribute('data-arabic-scale', 'large');
    if (settings.sidebarCollapsed) sidebarEl.classList.add('collapsed');

    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('nav-dashboard').addEventListener('click', navigateToDashboard);
    document.getElementById('nav-course').addEventListener('click', navigateToCourse);
    document.getElementById('nav-review').addEventListener('click', navigateToReview);
    document.getElementById('nav-free-practice').addEventListener('click', () => navigateToFreePractice());
    document.getElementById('nav-progress').addEventListener('click', navigateToStatistics);
    document.getElementById('nav-settings').addEventListener('click', navigateToSettings);

    // Erst nach abgeschlossenem Onboarding landet man auf der Startseite (Abschnitt 18) —
    // vorher wie bisher direkt im Onboarding-Ablauf.
    const onboardingFlag = AppState.getLessonFlag('onboarding');
    if (onboardingFlag && onboardingFlag.status === 'completed') {
      navigateToDashboard();
    } else {
      setActiveNav('dashboard');
      navigateTo('onboarding');
    }
  }

  return {
    init,
    navigateTo,
    navigateToSettings,
    navigateToStatistics,
    navigateToFreePractice,
    navigateToReview,
    navigateToDashboard,
    navigateToCourse,
    navigateToUnitDetail,
    navigateToSession,
    renderHeader,
    applyTheme,
    registerCleanup,
    get pack() { return pack; },
    get lessons() { return lessons; },
    get courses() { return courses; }
  };
})();

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
