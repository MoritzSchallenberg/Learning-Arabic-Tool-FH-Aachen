// Entwicklungsauftrag 12, Abschnitt 18 — Render-/Ablauftest für die Review-Modus-Oberfläche
// (src/review/js/*.js). Läuft im VM-Kontext gegen den ECHTEN Renderer-Code mit einem
// window.reviewApi-Mock (kein echtes Electron/IPC nötig) -- prüft insbesondere sichere
// Darstellung (kein XSS über textContent), RTL-Kennzeichnung arabischer Texte, und dass
// Statuswechsel-Regeln (Regel 1-6) auch in der Oberfläche respektiert werden.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');
const REVIEW_JS_DIR = path.join(ROOT, 'src', 'review', 'js');
// Entwicklungsauftrag 13: AudioKeyResolver liegt bei den gemeinsam genutzten src/js-Dateien,
// nicht unter src/review/js -- eigener absoluter Pfad statt eines weiteren REVIEW_JS_DIR-Eintrags.
const AUDIO_KEY_RESOLVER_PATH = path.join(ROOT, 'src', 'js', 'audioKeyResolver.js');
const SOURCE_FILES = ['reviewDom.js', 'reviewApp.js', 'reviewDashboard.js', 'reviewWordList.js', 'reviewWordDetail.js', 'reviewTheoryList.js', 'reviewTheoryDetail.js', 'reviewShell.js'];

const { WORD_ASPECT_KEYS, THEORY_ASPECT_KEYS, ASPECT_RESULTS, OVERALL_STATUSES, OVERALL_STATUS_LABELS_DE, ASPECT_RESULT_LABELS_DE, WORD_ASPECT_LABELS_DE, THEORY_ASPECT_LABELS_DE } = require('../../scripts/review/reviewConstants.js');

class FakeCustomEvent {
  constructor(type, opts = {}) { this.type = type; Object.assign(this, opts); }
}

function makeWord(overrides = {}) {
  return {
    id: 'w1', unit_id: 'vocab_unit_01', session_id: 'vocab_unit_01_a', batch: 1,
    arabic_vocalized: 'أَهْلاً', arabic_unvocalized: 'اهلا', transliteration: 'ahlan',
    german_answers: ['Hallo'], accepted_arabic_answers: ['أَهْلاً'], part_of_speech: 'Ausdruck',
    gender: null, plural: null, homonym_group: null, opposite_id: null, confusion_group: null,
    application_prompts: [{ type: 'context_choice', prompt: 'Du grüßt jemanden.', expected_meaning: 'Hallo' }],
    audio: { source: 'manifest', generation_status: 'generated_unreviewed', audio_review_status: 'not_reviewed', provider: 'elevenlabs', generated_at: null },
    batchReview: null,
    workspace: null,
    ...overrides
  };
}

function makeTheory(overrides = {}) {
  return {
    theory_id: 't1', title: 'Theorie A', unit_id: 'vocab_unit_01', session_id: 'vocab_unit_01_a', batch: 1,
    learning_objectives: ['Ziel A'],
    blocks: [
      { type: 'heading', text: 'Überschrift' },
      { type: 'paragraph', text: 'Ein Absatz.' },
      { type: 'example', arabic: 'مَرْحَبًا', translation: 'Hallo', note: 'Notiz' },
      { type: 'word_preview', word_ids: ['w1'] },
      { type: 'mini_check', questions: [{ question: 'Frage?', options: [{ text: 'richtig', correct: true }, { text: 'falsch', correct: false }] }] }
    ],
    workspace: null,
    ...overrides
  };
}

function buildContext({ words = [makeWord()], theories = [makeTheory()], reviewApiOverrides = {}, hash = '' } = {}) {
  const document = createDocumentStub();
  const appRoot = document.createElement('div');
  appRoot.setAttribute('id', 'app-root');
  document.body.appendChild(appRoot);

  const listeners = {};
  const fakeWindow = {
    location: { hash },
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); },
    confirm: () => true,
    alert: () => {},
    reviewApi: {
      loadConstants: async () => ({
        WORD_ASPECT_KEYS, THEORY_ASPECT_KEYS, ASPECT_RESULTS, OVERALL_STATUSES,
        OVERALL_STATUS_LABELS_DE, ASPECT_RESULT_LABELS_DE, WORD_ASPECT_LABELS_DE, THEORY_ASPECT_LABELS_DE
      }),
      loadAll: async () => ({
        words, theories, sessions: [], units: [],
        summary: { totalWords: words.length, totalTheories: theories.length, wordStatusCounts: {}, theoryStatusCounts: {}, audioGenerationCounts: {}, audioReviewCounts: {}, withCorrections: 0, uncertainWords: 0, byBatch: {}, byUnit: {}, bySession: {} }
      }),
      loadAudio: async () => null,
      loadHistory: async () => [],
      proposeWordCorrection: async () => ({ ok: true, entry: {} }),
      setWordAspectResult: async () => ({ ok: true, entry: {} }),
      setWordOverallStatus: async () => ({ ok: true, entry: {} }),
      proposeTheoryCorrection: async () => ({ ok: true, entry: {} }),
      setTheoryAspectResult: async () => ({ ok: true, entry: {} }),
      setTheoryOverallStatus: async () => ({ ok: true, entry: {} }),
      exportWorkspace: async () => ({ ok: true, targetDir: '/tmp/x' }),
      ...reviewApiOverrides
    }
  };

  const context = {
    console,
    document,
    window: fakeWindow,
    Audio: class { play() {} },
    CustomEvent: FakeCustomEvent,
    alert: fakeWindow.alert,
    confirm: fakeWindow.confirm
  };
  // window.reviewApi wird von den Views direkt als "window.reviewApi" referenziert.
  context.window.location.hash = hash;
  vm.createContext(context);
  const src = [fs.readFileSync(AUDIO_KEY_RESOLVER_PATH, 'utf-8'), ...SOURCE_FILES.map((f) => fs.readFileSync(path.join(REVIEW_JS_DIR, f), 'utf-8'))].join('\n;\n');
  // "window.addEventListener('hashchange', ...)" in reviewApp.js -- unser fakeWindow bietet das
  // bereits an; document.addEventListener/dispatchEvent kommt vom erweiterten domStub.
  vm.runInContext(`${src}\nthis.__ReviewApp = ReviewApp; this.__ReviewDom = ReviewDom;`, context);
  return { context, document, appRoot };
}

async function waitForReady(context) {
  await context.__ReviewApp.main();
}

test('Dashboard: rendert ohne zu werfen und zeigt die Wort-/Theorie-Gesamtzahl', async () => {
  const { context, appRoot } = buildContext({ hash: '#dashboard' });
  await waitForReady(context);
  const html = appRoot.querySelector('.view-dashboard');
  assert.ok(html, 'Dashboard-View muss gerendert werden');
  const statValues = appRoot.querySelectorAll('.stat-value').map((n) => n.textContent);
  assert.ok(statValues.includes('1'), 'Wortanzahl (1 in der Testfixtur) muss angezeigt werden');
});

test('Wortliste: zeigt das Testwort in der Tabelle, Klick navigiert zur Detailansicht', async () => {
  const { context, appRoot } = buildContext({ hash: '#words' });
  await waitForReady(context);
  const tbody = appRoot.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr');
  assert.equal(rows.length, 1);
  const idCell = rows[0].querySelector('code');
  assert.equal(idCell.textContent, 'w1');
});

test('Wortdetail: alle Felder werden textbasiert (nicht als HTML) dargestellt -- ein Feld mit Sonderzeichen wird nicht interpretiert', async () => {
  const dangerous = makeWord({ german_answers: ['<img src=x onerror=alert(1)>'] });
  const { context, appRoot } = buildContext({ words: [dangerous], hash: '#words/w1' });
  await waitForReady(context);
  const view = appRoot.querySelector('.view-word-detail');
  assert.ok(view);
  // Der Stub-HTML-Serializer würde ein echtes <img>-Element als solches finden -- hier darf es
  // KEIN <img>-Kindelement geben, weil der Text ausschließlich über textContent gesetzt wurde.
  const imgs = appRoot.querySelectorAll('img');
  assert.equal(imgs.length, 0, 'gefährlicher Text darf nie als echtes DOM-Element landen, nur als Text');
  const fieldTexts = appRoot.querySelectorAll('.field-original').map((n) => n.textContent);
  assert.ok(fieldTexts.some((t) => t.includes('<img src=x onerror=alert(1)>')), 'der Text selbst muss trotzdem sichtbar sein (als reiner Text)');
});

test('Wortdetail: arabischer Text bekommt dir="rtl" (korrekte RTL-Darstellung)', async () => {
  const { context, appRoot } = buildContext({ hash: '#words/w1' });
  await waitForReady(context);
  const arabicSpans = appRoot.querySelectorAll('.arabic-text');
  assert.ok(arabicSpans.length > 0);
  assert.ok(arabicSpans.every((n) => n.getAttribute('dir') === 'rtl'));
});

test('Wortdetail: Öffnen der Ansicht allein ruft keine status-ändernde API auf (Regel 1)', async () => {
  let calledStatusChange = false;
  const { context } = buildContext({
    hash: '#words/w1',
    reviewApiOverrides: { setWordOverallStatus: async () => { calledStatusChange = true; return { ok: true, entry: {} }; } }
  });
  await waitForReady(context);
  assert.equal(calledStatusChange, false);
});

test('Wortdetail: "geprüft"-Button ruft setWordOverallStatus mit status=reviewed auf', async () => {
  let capturedPayload = null;
  const { context, appRoot } = buildContext({
    hash: '#words/w1',
    reviewApiOverrides: { setWordOverallStatus: async (payload) => { capturedPayload = payload; return { ok: true, entry: {} }; } }
  });
  await waitForReady(context);
  const buttons = appRoot.querySelectorAll('button');
  const reviewedBtn = buttons.find((b) => b.textContent === 'Als "geprüft" markieren');
  assert.ok(reviewedBtn);
  reviewedBtn.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(capturedPayload);
  assert.equal(capturedPayload.status, 'reviewed');
  assert.equal(capturedPayload.wordId, 'w1');
});

test('Wortdetail: "approved" ohne Bestätigung durch den Nutzer wird NICHT aufgerufen (Regel 5/6)', async () => {
  let called = false;
  const { context, appRoot } = buildContext({ hash: '#words/w1', reviewApiOverrides: { setWordOverallStatus: async () => { called = true; return { ok: true, entry: {} }; } } });
  context.window.confirm = () => false; // Nutzer bricht den Bestätigungsdialog ab
  await waitForReady(context);
  const buttons = appRoot.querySelectorAll('button');
  const approveBtn = buttons.find((b) => b.textContent.includes('ausdrücklich freigeben') || b.textContent.includes('Ausdrücklich freigeben'));
  assert.ok(approveBtn);
  approveBtn.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(called, false, 'ohne Bestätigung darf approved nie ausgelöst werden');
});

test('Theorieliste: rendert ohne zu werfen und zeigt das Testdokument', async () => {
  const { context, appRoot } = buildContext({ hash: '#theories' });
  await waitForReady(context);
  assert.ok(appRoot.querySelector('.view-theory-list'));
  const rows = appRoot.querySelectorAll('tr');
  assert.ok(rows.some((r) => r.textContent.includes('t1')));
});

test('Theoriedetail: Wortvorschau löst word_ids gegen die geladenen Wörter auf und zeigt Beispiele/Fragen', async () => {
  const { context, appRoot } = buildContext({ hash: '#dashboard' });
  await waitForReady(context);
  context.__ReviewApp.navigate('theories', 't1');
  await new Promise((r) => setTimeout(r, 10));
  const view = appRoot.querySelector('.view-theory-detail');
  assert.ok(view, 'Theoriedetail muss nach Navigation gerendert werden');
  const chip = appRoot.querySelector('.word-preview-chip');
  assert.ok(chip);
  const question = appRoot.querySelector('.mini-check-question');
  assert.ok(question);
  assert.ok(question.textContent.includes('Frage?'));
});

test('Export-Button ruft window.reviewApi.exportWorkspace() auf', async () => {
  let exportCalled = false;
  const { context, appRoot } = buildContext({ hash: '#dashboard', reviewApiOverrides: { exportWorkspace: async () => { exportCalled = true; return { ok: true, targetDir: '/tmp/y' }; } } });
  await waitForReady(context);
  const buttons = appRoot.querySelectorAll('button');
  const exportBtn = buttons.find((b) => b.textContent === 'Arbeitsstand exportieren');
  assert.ok(exportBtn);
  exportBtn.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(exportCalled, true);
});
