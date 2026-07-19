// Bootstrapping und Navigation zwischen den Lektionen (Views).

const App = (() => {
  const contentEl = document.getElementById('content');
  const lessonListEl = document.getElementById('lesson-list');
  let lessons = [];
  let currentKey = null;

  const VIEW_BY_KEY = {
    onboarding: { view: OnboardingView },
    keyboard_tutorial: { view: KeyboardTutorialView },
    alphabet: { view: AlphabetView },
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

  function renderLessonList() {
    lessonListEl.innerHTML = lessons.map((lesson) => `
      <li class="lesson-item ${lesson.status === 'coming_soon' ? 'locked' : ''} ${lesson.key === currentKey ? 'active' : ''}" data-key="${lesson.key}">
        <span>${lesson.id}. ${lesson.title}</span>
        ${lesson.status === 'coming_soon' ? '<span class="lesson-badge">bald</span>' : ''}
      </li>
    `).join('');

    lessonListEl.querySelectorAll('.lesson-item').forEach((el) => {
      el.addEventListener('click', () => navigateTo(el.dataset.key));
    });
  }

  function navigateTo(key) {
    const lesson = lessons.find((l) => l.key === key);
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
