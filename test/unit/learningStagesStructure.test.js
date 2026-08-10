// Entwicklungsauftrag 15, Abschnitt 19 "Stufenstruktur" — prüft gegen die ECHTEN Kursdaten, dass
// alle 90 Sessions die strukturelle Voraussetzung für die neuen Lernstufen 1-5 erfüllen (die
// Stufen werden aus den ersten beiden bestehenden Phasentypen abgeleitet, siehe
// src/js/session/learningStages.js — kein zweites, per-Session gespeichertes Stufenfeld nötig),
// und dass die Lernziel-Ersatzformulierung (Abschnitt 7) für eine Session ohne
// learning_objectives korrekt greift.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { createDocumentStub, FakeKeyboardEvent } = require('../helpers/domStub.js');

const ROOT = path.join(__dirname, '..', '..');

function loadVocabSessions() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabSessions.json'), 'utf-8'));
}
function loadTheory() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'theory.json'), 'utf-8'));
}
function loadVocabularyWords() {
  const vocab = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabulary.json'), 'utf-8'));
  return vocab.categories.flatMap((c) => c.words);
}

test('alle 90 Sessions beginnen strukturell mit den Phasentypen "theory" dann "word_preview" (Voraussetzung für Stufe 2 und Stufe 3-5)', () => {
  const vs = loadVocabSessions();
  assert.equal(vs.sessions.length, 90, 'Baseline: genau 90 Sessions erwartet');
  const bad = vs.sessions.filter((s) => !(s.phases[0] && s.phases[0].type === 'theory' && s.phases[1] && s.phases[1].type === 'word_preview'));
  assert.deepEqual(bad.map((s) => s.session_id), [], 'jede Session muss mit theory, dann word_preview beginnen');
});

test('alle 30 Vokabel-Units mit ihren je 3 Sessions sind über die Lernstufen erreichbar (new_word_ids nicht leer)', () => {
  const vs = loadVocabSessions();
  const emptySessions = vs.sessions.filter((s) => !Array.isArray(s.new_word_ids) || s.new_word_ids.length === 0);
  assert.deepEqual(emptySessions.map((s) => s.session_id), [], 'keine Session ohne neue Wörter (würde Stufe 3-5 überspringen, siehe Sicherheitsnetz in sessionController.js)');
});

test('jede der 90 Sessions hat ein zugehöriges Theoriedokument mit theory_id-Übereinstimmung (Voraussetzung für Stufe 2)', () => {
  const vs = loadVocabSessions();
  const theory = loadTheory();
  const theoryIds = new Set(theory.theories.map((t) => t.theory_id));
  const missing = vs.sessions.filter((s) => !theoryIds.has(s.theory_id));
  assert.deepEqual(missing.map((s) => s.session_id), []);
});

// --- Lernziel-Ersatzformulierung (Abschnitt 7) gegen eine SYNTHETISCHE Session ohne
// learning_objectives -- bei den echten 90 Sessions ist dieser Pfad aktuell nie aktiv (alle 90
// haben bereits learning_objectives), soll aber robust bleiben, falls sich das ändert.
const SOURCE_FILES = [
  'src/js/srs.js', 'src/js/keyboardData.js', 'src/js/textEditing.js', 'src/js/wordShaping.js',
  'src/js/exerciseGuard.js', 'src/js/theoryRenderer.js', 'src/js/helpLevel.js', 'src/js/reviewScheduler.js',
  'src/js/views/virtualKeyboard.js', 'src/js/session/sessionState.js', 'src/js/session/phaseRegistry.js',
  'src/js/session/sessionCoverageTracker.js', 'src/js/session/sessionQueue.js', 'src/js/session/exerciseRegistry.js',
  'src/js/session/sessionEngine.js', 'src/js/session/learningStages.js', 'src/js/session/wordRelations.js',
  'src/js/session/sessionRenderer.js', 'src/js/session/sessionController.js'
];

function loadSessionModules(context) {
  vm.createContext(context);
  const combinedSrc = SOURCE_FILES.map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${combinedSrc}\nthis.__SessionController = SessionController;`, context);
  return context.__SessionController;
}

test('Lernziel-Ersatzformulierung: Session ohne learning_objectives bekommt eine sachliche, datenbasierte Ersatzformulierung (Abschnitt 7, kein erfundener Inhalt)', async () => {
  const realVocabSessions = loadVocabSessions();
  const realTheory = loadTheory();
  const realWords = loadVocabularyWords();
  const sessionDef = JSON.parse(JSON.stringify(realVocabSessions.sessions.find((s) => s.session_id === 'vocab_unit_01_a')));
  const theoryDoc = JSON.parse(JSON.stringify(realTheory.theories.find((t) => t.theory_id === sessionDef.theory_id)));
  delete theoryDoc.learning_objectives; // Session künstlich OHNE Lernziele

  const context = {
    document: createDocumentStub(),
    console, setTimeout, clearTimeout, Event, KeyboardEvent: FakeKeyboardEvent,
    AppState: {
      getCard: () => ({ difficulty: {}, consecutiveWrong: {} }),
      isWordMarkedDifficult: () => false,
      toggleWordDifficult: () => Promise.resolve(false),
      persistProgress: () => Promise.resolve(),
      getSessionState: () => null,
      saveSessionState: () => Promise.resolve(),
      clearSessionState: () => Promise.resolve(),
      getActiveSessionId: () => null,
      getSettings: () => ({ dailyNewLimit: 10, showTransliteration: true }),
      getDailyNewCount: () => 0,
      incrementDailyNewCount: () => Promise.resolve(1),
      markTheoryOpened: () => {},
      markTheoryMiniCheckResult: () => Promise.resolve(true),
      markTheoryCompleted: () => Promise.resolve(),
      getLanguagePack: () => Promise.resolve({
        keyboard: { letters: [] },
        vocabulary: { categories: [{ id: 'all', words: realWords }] },
        vocabSessions: { vocab_units: realVocabSessions.vocab_units, sessions: [sessionDef] },
        theory: { theories: [theoryDoc] }
      })
    },
    AudioPlayer: { speak: () => Promise.resolve({ source: 'audio' }), speakWord: () => Promise.resolve({ source: 'recorded_audio', mode: 'normal', audioKey: null }), stopCurrentAudio: () => {} },
    App: { registerCleanup: () => {}, navigateToCourse: () => {}, navigateToUnitDetail: () => {}, navigateToFreePractice: () => {}, navigateToSession: () => {}, renderHeader: () => {} }
  };
  const SessionController = loadSessionModules(context);
  const container = createDocumentStub().createElement('div');
  await SessionController.mount(container, { unitId: 'vocab_unit_01', sessionId: 'vocab_unit_01_a' });

  const text = container.textContent;
  assert.ok(text.includes('In dieser Session lernst du'));
  assert.ok(text.includes('Wörter zu'), 'Ersatzformulierung sollte die Wortanzahl+Thema nennen (Abschnitt 7 Beispiel)');
  assert.ok(text.includes('die Wörter zu erkennen und auszusprechen'));
  assert.ok(text.includes('sie anschließend in Übungen selbst anzuwenden'));
});
