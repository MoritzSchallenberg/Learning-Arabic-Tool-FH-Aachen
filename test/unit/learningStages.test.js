// Entwicklungsauftrag 15, Abschnitt 5/19; auf das vollständige Zehn-Stufen-Modell erweitert in
// Entwicklungsauftrag 16, Abschnitt 4/20 — Tests für das zentrale Stufenmodell
// (src/js/session/learningStages.js): genau zehn Stufen, feste Reihenfolge 1-10, korrekte
// Nachbar-/Grenzfall-Navigation, unabhängiger 0-100-Stufenfortschritt, kein Übergangstext mehr.

const { test } = require('node:test');
const assert = require('node:assert/strict');

const LearningStages = require('../../src/js/session/learningStages.js');

test('genau zehn Stufen sind definiert, in der geforderten Reihenfolge (Abschnitt 4)', () => {
  assert.equal(LearningStages.STAGES.length, 10);
  assert.deepEqual(LearningStages.ORDER, [
    'learning_goals', 'theory', 'word_cards', 'audio_familiarization', 'word_overview',
    'recognition', 'matching', 'guided_writing', 'independent_writing', 'summary'
  ]);
});

test('jede Stufe hat eine verständliche deutsche Beschriftung und eine Nummer 1-10', () => {
  LearningStages.STAGES.forEach((s, i) => {
    assert.equal(s.number, i + 1);
    assert.ok(s.label && s.label.length > 0);
    assert.notEqual(s.label, s.key, 'Label sollte kein technischer Rohschlüssel sein');
  });
});

test('TOTAL_DISPLAY_STAGES ist 10 und entspricht jetzt exakt STAGES.length (Abschnitt 4)', () => {
  assert.equal(LearningStages.TOTAL_DISPLAY_STAGES, 10);
  assert.equal(LearningStages.TOTAL_DISPLAY_STAGES, LearningStages.STAGES.length);
});

test('die frühere Übergangskonstante AFTER_STAGE_5_LABEL ("Als Nächstes: Übungen") existiert nicht mehr (Abschnitt 4: Übergangsanzeige entfernen)', () => {
  assert.equal(LearningStages.AFTER_STAGE_5_LABEL, undefined);
});

test('Stufen 6-10 tragen exakt dieselben Schlüssel wie die vier gradierten Phasentypen plus "summary" (Abschnitt 4: kein zweites Modell)', () => {
  assert.deepEqual(LearningStages.STAGES.slice(5).map((s) => s.key), [
    'recognition', 'matching', 'guided_writing', 'independent_writing', 'summary'
  ]);
});

test('get() liefert die Stufe zu einem Schlüssel, null bei unbekanntem Schlüssel', () => {
  assert.equal(LearningStages.get('word_cards').number, 3);
  assert.equal(LearningStages.get('independent_writing').number, 9);
  assert.equal(LearningStages.get('unbekannt'), null);
});

test('first() liefert "learning_goals"', () => {
  assert.equal(LearningStages.first(), 'learning_goals');
});

test('next()/previous() navigieren korrekt durch alle zehn Stufen', () => {
  const order = LearningStages.ORDER;
  for (let i = 0; i < order.length - 1; i += 1) {
    assert.equal(LearningStages.next(order[i]), order[i + 1], `next(${order[i]})`);
  }
  assert.equal(LearningStages.next('summary'), null, 'nach der letzten Stufe gibt es keine nächste mehr');
  for (let i = 1; i < order.length; i += 1) {
    assert.equal(LearningStages.previous(order[i]), order[i - 1], `previous(${order[i]})`);
  }
  assert.equal(LearningStages.previous('learning_goals'), null);
});

test('next()/previous() bei unbekanntem Schlüssel liefern null statt zu werfen', () => {
  assert.equal(LearningStages.next('unbekannt'), null);
  assert.equal(LearningStages.previous('unbekannt'), null);
});

test('isLast() erkennt nur "summary" als letzte Stufe', () => {
  assert.equal(LearningStages.isLast('summary'), true);
  assert.equal(LearningStages.isLast('independent_writing'), false);
  assert.equal(LearningStages.isLast('word_overview'), false, 'Stufe 5 ist seit Auftrag 16 nicht mehr die letzte Stufe');
});

test('isValid() unterscheidet bekannte von unbekannten/alten Stufenwerten', () => {
  assert.equal(LearningStages.isValid('theory'), true);
  assert.equal(LearningStages.isValid('matching'), true);
  assert.equal(LearningStages.isValid('reconstruction'), false, 'die alte sichtbare Phase "Rekonstruieren" ist keine gültige Stufe mehr');
  assert.equal(LearningStages.isValid('application'), false, 'die alte sichtbare Phase "Anwendung" ist keine gültige Stufe mehr');
  assert.equal(LearningStages.isValid(undefined), false);
});

test('stageProgressPercent(): steigt mit der Stufe, 0% bei Stufe 1 ohne Unterfortschritt', () => {
  assert.equal(LearningStages.stageProgressPercent('learning_goals', 0), 0);
  const p2 = LearningStages.stageProgressPercent('word_cards', 0);
  const p1 = LearningStages.stageProgressPercent('theory', 0);
  assert.ok(p2 > p1, 'spätere Stufen sollten einen höheren Stufenfortschritt zeigen');
});

test('stageProgressPercent(): steigt über alle zehn Stufen hinweg monoton', () => {
  let prev = -1;
  for (const key of LearningStages.ORDER) {
    const p = LearningStages.stageProgressPercent(key, 0);
    assert.ok(p >= prev, `Stufenfortschritt sollte nicht sinken (${key}: ${p} < ${prev})`);
    prev = p;
  }
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

test('stageProgressPercent(): "summary" (Stufe 10) liefert 90% ohne Unterfortschritt, nahe 100% mit vollem Unterfortschritt', () => {
  assert.equal(LearningStages.stageProgressPercent('summary', 0), 90);
  assert.equal(LearningStages.stageProgressPercent('summary', 1), 100);
});
