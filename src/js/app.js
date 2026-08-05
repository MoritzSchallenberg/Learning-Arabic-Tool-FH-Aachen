// Bootstrapping und Navigation zwischen den Kursen/Units/Lektionen (Views).
// Die Sidebar zeigt die Kurs→Unit-Baumstruktur aus courses.json; lessons.json bleibt die
// Registry für Titel/Intro/Status jedes navigierbaren Schlüssels (alt UND neu).

const App = (() => {
  const contentEl = document.getElementById('content');
  const lessonListEl = document.getElementById('lesson-list');
  let lessons = [];
  let courses = [];
  let currentKey = null;

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

  function findLessonMeta(key) {
    return lessons.find((l) => l.key === key);
  }

  function renderNavItem(key, title) {
    const meta = findLessonMeta(key);
    const status = meta ? meta.status : 'active';
    return `
      <li class="lesson-item ${status === 'coming_soon' ? 'locked' : ''} ${key === currentKey ? 'active' : ''}" data-key="${key}">
        <span>${title}</span>
        ${status === 'coming_soon' ? '<span class="lesson-badge">bald</span>' : ''}
      </li>
    `;
  }

  function unitNavKey(unit) {
    if (unit.type === 'existing_lesson_group') return unit.lesson_keys[0];
    if (unit.type === 'existing_lesson') return unit.lesson_key;
    return unit.id; // letter_group, diacritics, special_forms, consolidation -> eigener Schlüssel
  }

  function renderLessonList() {
    if (!courses.length) {
      // Fallback, falls courses.json einmal fehlen sollte: flache Liste wie zuvor.
      lessonListEl.innerHTML = lessons.map((l) => renderNavItem(l.key, `${l.id}. ${l.title}`)).join('');
    } else {
      lessonListEl.innerHTML = courses.map((course) => `
        <li class="course-header">${course.title}</li>
        ${course.units.map((unit) => renderNavItem(unitNavKey(unit), unit.title)).join('')}
      `).join('');
    }

    lessonListEl.querySelectorAll('.lesson-item').forEach((el) => {
      el.addEventListener('click', () => navigateTo(el.dataset.key));
    });
  }

  function navigateTo(key) {
    const lesson = findLessonMeta(key);
    if (!lesson) return;

    currentKey = key;
    renderLessonList();

    if (lesson.status === 'coming_soon') {
      contentEl.innerHTML = `
        <div class="view">
          <h1>${lesson.title}</h1>
          <p class="lead">Diese Lektion ist Teil einer späteren Version und noch nicht verfügbar.</p>
        </div>
      `;
      return;
    }

    renderLessonIntro(lesson);
  }

  function renderLessonIntro(lesson) {
    contentEl.innerHTML = `
      <div class="view">
        <h1>${lesson.title}</h1>
        <div class="card">
          <p class="lead" style="margin:0;">${lesson.intro || ''}</p>
        </div>
        <button class="btn" id="lesson-start">Los geht's</button>
      </div>
    `;
    contentEl.querySelector('#lesson-start').addEventListener('click', () => {
      const entry = VIEW_BY_KEY[lesson.key];
      if (entry) {
        entry.view.mount(contentEl, entry.arg);
      }
    });
  }

  function navigateToSettings() {
    currentKey = null;
    renderLessonList();
    SettingsView.mount(contentEl);
  }

  function navigateToStatistics() {
    currentKey = null;
    renderLessonList();
    StatisticsView.mount(contentEl);
  }

  async function init() {
    await AppState.init();
    const pack = await AppState.getLanguagePack();
    lessons = pack.lessons.lessons;
    courses = pack.courses ? pack.courses.courses : [];
    renderLessonList();

    document.getElementById('nav-settings').addEventListener('click', navigateToSettings);
    document.getElementById('nav-stats').addEventListener('click', navigateToStatistics);

    navigateTo('onboarding');
  }

  return { init, navigateTo, navigateToSettings, navigateToStatistics };
})();

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
