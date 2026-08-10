// Entwicklungsauftrag 15, Abschnitt 5/19 — Tests für das zentrale Stufenmodell
// (src/js/session/learningStages.js): genau fünf Stufen, feste Reihenfolge, korrekte
// Nachbar-/Grenzfall-Navigation, unabhängiger 0-100-Stufenfortschritt.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const LearningStages = require('../../src/js/session/learningStages.js');

test('genau fünf Stufen sind definiert, in der geforderten Reihenfolge', () => {
  assert.equal(LearningStages.STAGES.length, 5);
  assert.deepEqual(LearningStages.ORDER, [
    'learning_goals', 'theory', 'word_cards', 'audio_familiarization', 'word_overview'
  ]);
});

test('jede Stufe hat eine verständliche deutsche Beschriftung und eine Nummer 1-5', () => {
  LearningStages.STAGES.forEach((s, i) => {
    assert.equal(s.number, i + 1);
    assert.ok(s.label && s.label.length > 0);
    assert.notEqual(s.label, s.key, 'Label sollte kein technischer Rohschlüssel sein');
  });
});

test('TOTAL_DISPLAY_STAGES ist 10 (Abschnitt 6: "Stufe 1 von 10" … "Stufe 5 von 10")', () => {
  assert.equal(LearningStages.TOTAL_DISPLAY_STAGES, 10);
});

test('AFTER_STAGE_5_LABEL ist eine ehrliche Übergangsanzeige, keine erfundene Stufe 6-10', () => {
  assert.equal(LearningStages.AFTER_STAGE_5_LABEL, 'Als Nächstes: Übungen');
});

test('get() liefert die Stufe zu einem Schlüssel, null bei unbekanntem Schlüssel', () => {
  assert.equal(LearningStages.get('word_cards').number, 3);
  assert.equal(LearningStages.get('unbekannt'), null);
});

test('first() liefert "learning_goals"', () => {
  assert.equal(LearningStages.first(), 'learning_goals');
});

test('next()/previous() navigieren korrekt durch die Reihenfolge', () => {
  assert.equal(LearningStages.next('learning_goals'), 'theory');
  assert.equal(LearningStages.next('theory'), 'word_cards');
  assert.equal(LearningStages.next('word_cards'), 'audio_familiarization');
  assert.equal(LearningStages.next('audio_familiarization'), 'word_overview');
  assert.equal(LearningStages.next('word_overview'), null, 'nach der letzten Stufe gibt es keine nächste mehr');
  assert.equal(LearningStages.previous('theory'), 'learning_goals');
  assert.equal(LearningStages.previous('learning_goals'), null);
});

test('next()/previous() bei unbekanntem Schlüssel liefern null statt zu werfen', () => {
  assert.equal(LearningStages.next('unbekannt'), null);
  assert.equal(LearningStages.previous('unbekannt'), null);
});

test('isLast() erkennt nur "word_overview" als letzte Stufe', () => {
  assert.equal(LearningStages.isLast('word_overview'), true);
  assert.equal(LearningStages.isLast('word_cards'), false);
});

test('isValid() unterscheidet bekannte von unbekannten/alten Stufenwerten', () => {
  assert.equal(LearningStages.isValid('theory'), true);
  assert.equal(LearningStages.isValid('system'), false);
  assert.equal(LearningStages.isValid(undefined), false);
});

test('stageProgressPercent(): steigt mit der Stufe, 0% bei Stufe 1 ohne Unterfortschritt', () => {
  assert.equal(LearningStages.stageProgressPercent('learning_goals', 0), 0);
  const p2 = LearningStages.stageProgressPercent('word_cards', 0);
  const p1 = LearningStages.stageProgressPercent('theory', 0);
  assert.ok(p2 > p1, 'spätere Stufen sollten einen höheren Stufenfortschritt zeigen');
});

test('stageProgressPercent(): Unterfortschritt innerhalb einer Stufe erhöht den Wert, bleibt aber unter der nächsten Stufe', () => {
  const withoutSub = LearningStages.stageProgressPercent('word_cards', 0);
  const withSub = LearningStages.stageProgressPercent('word_cards', 0.9);
  const nextStage = LearningStages.stageProgressPercent('audio_familiarization', 0);
  assert.ok(withSub > withoutSub);
  assert.ok(withSub <= nextStage);
});

test('stageProgressPercent(): subProgress wird auf 0..1 begrenzt (kein Absturz bei falschen Werten)', () => {
  assert.equal(LearningStages.stageProgressPercent('word_cards', 5), LearningStages.stageProgressPercent('word_cards', 1));
  assert.equal(LearningStages.stageProgressPercent('word_cards', -3), LearningStages.stageProgressPercent('word_cards', 0));
});

test('stageProgressPercent(): unbekannte Stufe liefert sicher 0 statt zu werfen', () => {
  assert.equal(LearningStages.stageProgressPercent('unbekannt', 0.5), 0);
});
