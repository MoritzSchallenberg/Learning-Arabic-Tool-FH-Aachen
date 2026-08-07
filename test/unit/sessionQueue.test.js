// Tests für SessionQueue (Entwicklungsauftrag 4, Schritt 3; Repeat-Limit erweitert in
// Entwicklungsauftrag 5, Abschnitt 8).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const SessionQueue = require('../../src/js/session/sessionQueue.js');

test('scheduleRepeat() fügt die Aufgabe frühestens nach 3 und spätestens nach 5 weiteren Aufgaben erneut ein', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ wordId: `w${i}` }));
  const queue = SessionQueue.create(items);
  queue.index = 0;
  const task = queue.pending[0];
  SessionQueue.scheduleRepeat(queue, task);
  const repeatIndex = queue.pending.findIndex((t) => t.isRepeat && t.wordId === task.wordId);
  assert.ok(repeatIndex >= 1 + 3 && repeatIndex <= 1 + 5, `Wiederholung sollte 3-5 Aufgaben später eingeplant sein, war bei Index ${repeatIndex}`);
});

test('ein Wort darf mehrfach wiederholt werden, aber höchstens bis zum konfigurierten Limit (Standard 3)', () => {
  const items = [{ wordId: 'a' }, { wordId: 'b' }, { wordId: 'c' }, { wordId: 'd' }, { wordId: 'e' }];
  const queue = SessionQueue.create(items);
  const task = { wordId: 'a' };

  assert.equal(SessionQueue.scheduleRepeat(queue, task), true);
  assert.equal(SessionQueue.scheduleRepeat(queue, task), true);
  assert.equal(SessionQueue.scheduleRepeat(queue, task), true);
  assert.equal(SessionQueue.repeatCountFor(queue, 'a'), 3);
  assert.equal(SessionQueue.scheduleRepeat(queue, task), false, 'ein viertes Mal sollte am Limit scheitern');
  assert.equal(SessionQueue.repeatCountFor(queue, 'a'), 3, 'der Zähler darf über das Limit hinaus nicht weiter steigen');
});

test('ein eigenes Limit (maxRepeats) wird respektiert', () => {
  const queue = SessionQueue.create([{ wordId: 'a' }, { wordId: 'b' }]);
  const task = { wordId: 'a' };
  assert.equal(SessionQueue.scheduleRepeat(queue, task, { maxRepeats: 1 }), true);
  assert.equal(SessionQueue.scheduleRepeat(queue, task, { maxRepeats: 1 }), false);
});

test('isDone()/advance()/current() funktionieren wie erwartet', () => {
  const queue = SessionQueue.create([{ wordId: 'a' }, { wordId: 'b' }]);
  assert.equal(SessionQueue.isDone(queue), false);
  assert.ok(SessionQueue.current(queue));
  SessionQueue.advance(queue);
  SessionQueue.advance(queue);
  assert.equal(SessionQueue.isDone(queue), true);
  assert.equal(SessionQueue.current(queue), null);
});
