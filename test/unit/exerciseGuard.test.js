// Tests für src/js/exerciseGuard.js (P0.2 — zentrale Antwortsperre + Timer-Aufräumung).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ExerciseGuard = require('../../src/js/exerciseGuard.js');

test('submit() gibt beim ersten Aufruf true zurück, bei jedem weiteren false (Doppelklick-Schutz)', () => {
  const guard = ExerciseGuard.create();
  assert.equal(guard.submit(), true);
  assert.equal(guard.submit(), false);
  assert.equal(guard.submit(), false);
});

test('nextTask() setzt die Sperre für die nächste Aufgabe zurück', () => {
  const guard = ExerciseGuard.create();
  assert.equal(guard.submit(), true);
  guard.showFeedback();
  guard.transitioning();
  guard.nextTask();
  assert.equal(guard.submit(), true);
});

test('canSubmit() spiegelt den aktuellen Zustand wider', () => {
  const guard = ExerciseGuard.create();
  assert.equal(guard.canSubmit(), true);
  guard.submit();
  assert.equal(guard.canSubmit(), false);
  guard.nextTask();
  assert.equal(guard.canSubmit(), true);
});

test('destroy() sperrt endgültig gegen weitere Submits', () => {
  const guard = ExerciseGuard.create();
  guard.destroy();
  assert.equal(guard.canSubmit(), false);
  assert.equal(guard.submit(), false);
});

test('setTimeout-Callback feuert normal, wenn der Guard nicht zerstört wurde', async () => {
  const guard = ExerciseGuard.create();
  let fired = false;
  guard.setTimeout(() => { fired = true; }, 5);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(fired, true);
});

test('setTimeout-Callback feuert NICHT mehr, nachdem destroy() aufgerufen wurde (P0.2-Kernfall)', async () => {
  const guard = ExerciseGuard.create();
  let fired = false;
  guard.setTimeout(() => { fired = true; }, 10);
  guard.destroy(); // simuliert: Nutzer verlässt die Ansicht, bevor der Timer feuert
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(fired, false);
});

test('mehrere offene Timer werden alle durch destroy() abgebrochen', async () => {
  const guard = ExerciseGuard.create();
  let count = 0;
  guard.setTimeout(() => { count += 1; }, 5);
  guard.setTimeout(() => { count += 1; }, 10);
  guard.setTimeout(() => { count += 1; }, 15);
  guard.destroy();
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(count, 0);
});

test('realistischer Ablauf: Doppelklick auf "Prüfen" während eines simulierten Speichervorgangs führt nur zu einer Auswertung', async () => {
  const guard = ExerciseGuard.create();
  let evaluationCount = 0;

  function onCheckClick() {
    if (!guard.submit()) return; // zweiter Klick wird ignoriert
    evaluationCount += 1;
    guard.showFeedback();
    guard.setTimeout(() => {
      guard.transitioning();
      guard.nextTask();
    }, 10);
  }

  onCheckClick();
  onCheckClick(); // Doppelklick, bevor Feedback/Timeout durch sind
  onCheckClick();
  await new Promise((r) => setTimeout(r, 30));

  assert.equal(evaluationCount, 1);
});

test('Navigation weg von der Ansicht mitten im Feedback-Timer verursacht keinen verspäteten Callback', async () => {
  const guard = ExerciseGuard.create();
  let navigatedAwayEffectApplied = false;

  guard.submit();
  guard.showFeedback();
  guard.setTimeout(() => { navigatedAwayEffectApplied = true; }, 20);

  // Nutzer navigiert weg, bevor die 20ms um sind:
  guard.destroy();

  await new Promise((r) => setTimeout(r, 40));
  assert.equal(navigatedAwayEffectApplied, false);
});
