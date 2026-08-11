// Tests für Entwicklungsauftrag 17, Abschnitt 5.3/8/9.3/19 — src/js/feedback/feedbackRenderer.js.
// VM-Ladung mit domStub.js als document, srs.js + answerAnalyzer.js + feedbackModel.js als
// Abhängigkeiten für realistische Modelle.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');

function loadModules() {
  const context = { console, document: createDocumentStub() };
  vm.createContext(context);
  for (const rel of ['src/js/srs.js', 'src/js/feedback/answerAnalyzer.js', 'src/js/feedback/feedbackModel.js', 'src/js/feedback/feedbackRenderer.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf-8'), context);
  }
  vm.runInContext('this.__AA = AnswerAnalyzer; this.__FM = FeedbackModel; this.__FR = FeedbackRenderer; this.__doc = document;', context);
  return { AA: context.__AA, FM: context.__FM, FR: context.__FR, doc: context.__doc };
}

function w(id, arabic, german, extra = {}) {
  return { id, arabic, arabic_vocalized: arabic, german, german_answers: [german], transliteration: 'x', ...extra };
}

test('role="status" bei richtigem Feedback', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'كتاب') });
  const container = doc.createElement('div');
  const panel = FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.equal(panel.getAttribute('role'), 'status');
});

test('role="alert" bei einer echten Falschantwort', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'سيارة') });
  const container = doc.createElement('div');
  const panel = FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.equal(panel.getAttribute('role'), 'alert');
});

test('Fokus wird nach der Abgabe programmatisch auf das Feedback gesetzt', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'كتاب') });
  const container = doc.createElement('div');
  const panel = FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.equal(panel.focused, true);
  assert.equal(panel.tabIndex, -1);
});

test('Status ist nicht nur über Farbe erkennbar -- Symbol + Titeltext sind immer vorhanden', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'كتاب') });
  const container = doc.createElement('div');
  FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.ok(container.textContent.includes('✓'));
  assert.ok(container.textContent.includes('Richtig'));
});

test('Buttons haben eindeutige aria-label-Beschriftungen (Abschnitt 19)', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'كتاب') });
  const container = doc.createElement('div');
  FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  const buttons = container.querySelectorAll('button');
  assert.ok(buttons.some((b) => b.getAttribute('aria-label') === 'Richtige Aussprache normal abspielen'));
  assert.ok(buttons.some((b) => b.getAttribute('aria-label') === 'Richtige Aussprache langsam abspielen'));
});

test('Audio-Buttons rufen die übergebenen Callbacks auf (normal/langsam getrennt)', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'كتاب') });
  const container = doc.createElement('div');
  let normalCalls = 0;
  let slowCalls = 0;
  FR.render(container, model, { settings: {}, onAudioNormal: () => { normalCalls += 1; }, onAudioSlow: () => { slowCalls += 1; } });
  const buttons = container.querySelectorAll('button');
  buttons.find((b) => b.getAttribute('aria-label') === 'Richtige Aussprache normal abspielen').click();
  buttons.find((b) => b.getAttribute('aria-label') === 'Richtige Aussprache langsam abspielen').click();
  assert.equal(normalCalls, 1);
  assert.equal(slowCalls, 1);
});

test('Wiederholungshinweis erscheint nur bei tatsächlich geplanter Wiederholung', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const analysis = AA.analyzeTypedArabicAnswer(word, 'سيارة');
  const container1 = doc.createElement('div');
  FR.render(container1, FM.buildForWord({ exerciseType: 'x', word, analysis, repeatScheduled: true }), { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.ok(container1.textContent.includes('erscheint später in dieser Session erneut'));

  const container2 = doc.createElement('div');
  FR.render(container2, FM.buildForWord({ exerciseType: 'x', word, analysis, repeatScheduled: false }), { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.ok(!container2.textContent.includes('erscheint später in dieser Session erneut'));
});

test('Wiederholungslimit erreicht zeigt den abweichenden Hinweistext', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const analysis = AA.analyzeTypedArabicAnswer(word, 'سيارة');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis, repeatScheduled: false, repeatLimitReached: true });
  const container = doc.createElement('div');
  FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.ok(container.textContent.includes('für eine spätere Übung vorgemerkt'));
});

test('akzeptierte Alternative zeigt nicht "Richtig wäre..." (die eigene Antwort war ja schon richtig)', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'سَلَام', 'Frieden', { accepted_arabic_answers: ['سَلَام', 'السَّلَامُ عَلَيْكُم'] });
  const analysis = AA.analyzeTypedArabicAnswer(word, 'السَّلَامُ عَلَيْكُم');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis });
  const container = doc.createElement('div');
  FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.ok(!container.textContent.includes('Richtige Form:'));
  assert.ok(container.textContent.includes('gültige alternative Schreibweise'));
});

test('Zeichenvergleich wird mit dir="rtl" und unicode-bidi:isolate gerendert, rein über textContent', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, 'كتاء') });
  const container = doc.createElement('div');
  FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  const diffEl = container.querySelector('.char-diff');
  assert.ok(diffEl);
  assert.equal(diffEl.dir, 'rtl');
  assert.equal(diffEl.style.unicodeBidi, 'isolate');
});

test('feindliche Zeicheneingabe (HTML/Script-artiger Text) landet nur als reiner Text, nie als geparstes Markup', () => {
  const { AA, FM, FR, doc } = loadModules();
  const word = w('a', 'كتاب', 'Buch');
  const hostile = '<img src=x onerror=alert(1)>';
  const model = FM.buildForWord({ exerciseType: 'x', word, analysis: AA.analyzeTypedArabicAnswer(word, hostile) });
  const container = doc.createElement('div');
  FR.render(container, model, { settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {} });
  assert.equal(container.querySelectorAll('img').length, 0, 'darf kein echtes <img>-Element erzeugt haben');
  assert.ok(container.textContent.includes(hostile), 'der rohe Text darf trotzdem sichtbar sein (als Text, nicht als Markup)');
});

test('Verwechslungsvergleich: automatisch erkannte Beziehung wird als Tabelle mit Audio-Buttons angezeigt', () => {
  const { AA, FM, FR, doc } = loadModules();
  const target = w('slow', 'بَطِيءٌ', 'langsam', { confusion_group: 'g1' });
  const wrongOpt = w('fast', 'سَرِيعٌ', 'schnell', { confusion_group: 'g1' });
  const analysis = AA.analyzeChoiceAnswer({ targetWord: target, selectedOption: wrongOpt, isCorrect: false, domain: 'arabic_word' });
  const model = FM.buildForWord({ exerciseType: 'x', word: target, analysis, isTyped: false });
  const container = doc.createElement('div');
  FR.render(container, model, {
    settings: {}, selectedWord: wrongOpt, onAudioNormal: () => {}, onAudioSlow: () => {},
    autoRelation: { word: wrongOpt, type: 'confusion' }, onRelationAudio: () => {}
  });
  assert.ok(container.textContent.includes('leicht zu verwechseln'));
  assert.ok(container.querySelector('.relation-compare-table'));
});

test('manuelle Verwechslungsanzeige ("Ähnliche Wörter anzeigen") ist standardmäßig zusammengeklappt', () => {
  const { AA, FM, FR, doc } = loadModules();
  const target = w('slow', 'بَطِيءٌ', 'langsam');
  const other = w('other', 'بَعِيدٌ', 'weit', { confusion_group: 'g2' });
  const withGroup = { ...target, confusion_group: 'g2' };
  const analysis = AA.analyzeTypedArabicAnswer(withGroup, 'wrong');
  const model = FM.buildForWord({ exerciseType: 'x', word: withGroup, analysis });
  const container = doc.createElement('div');
  FR.render(container, model, {
    settings: {}, onAudioNormal: () => {}, onAudioSlow: () => {},
    manualRelations: [{ word: other, type: 'confusion' }]
  });
  const details = container.querySelector('details.relation-disclosure');
  assert.ok(details);
  assert.equal(details.querySelector('summary').textContent, 'Ähnliche Wörter anzeigen');
});

// --- Zuordnungs-Abschlussfeedback (Abschnitt 13) ------------------------------------------------

test('renderMatchingGroupSummary: zeigt alle Paare, keine rohen Wort-IDs, Audio je Wort', () => {
  const { FM, FR, doc } = loadModules();
  const words = [w('a', 'كتاب', 'Buch'), w('b', 'قلم', 'Stift')];
  const model = FM.buildMatchingGroupSummary({ groupWords: words, perWordCorrect: { a: true, b: false }, erroredWordIds: ['b'] });
  const container = doc.createElement('div');
  let audioCalls = 0;
  const panel = FR.renderMatchingGroupSummary(container, model, { settings: {}, onAudioFor: () => { audioCalls += 1; } });
  assert.equal(panel.getAttribute('role'), 'alert');
  assert.ok(container.textContent.includes('Buch'));
  assert.ok(container.textContent.includes('Stift'));
  assert.ok(!container.textContent.includes(' a ') && !container.textContent.includes(' b '));
  const audioButtons = container.querySelectorAll('button');
  audioButtons[audioButtons.length - 1].click();
  assert.equal(audioCalls, 1);
});

test('renderMatchingGroupSummary bei vollständig richtiger Gruppe: role=status', () => {
  const { FM, FR, doc } = loadModules();
  const words = [w('a', 'كتاب', 'Buch')];
  const model = FM.buildMatchingGroupSummary({ groupWords: words, perWordCorrect: { a: true }, erroredWordIds: [] });
  const container = doc.createElement('div');
  const panel = FR.renderMatchingGroupSummary(container, model, { settings: {} });
  assert.equal(panel.getAttribute('role'), 'status');
});
