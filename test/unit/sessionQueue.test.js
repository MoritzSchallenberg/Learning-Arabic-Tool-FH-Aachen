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

// --- Entwicklungsauftrag 16, Abschnitt 8.4: { shuffle: false } für Stufe 8 (zwei feste Blöcke) --
test('create() mit { shuffle: false } übernimmt die Reihenfolge unverändert (für Teil-1/Teil-2-Blöcke)', () => {
  const items = Array.from({ length: 8 }, (_, i) => ({ wordId: `w${i}` }));
  const queue = SessionQueue.create(items, Math.random, { shuffle: false });
  assert.deepEqual(queue.pending.map((i) => i.wordId), items.map((i) => i.wordId));
});

test('create() ohne shuffle-Option (oder shuffle:true) mischt weiterhin wie zuvor', () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ wordId: `w${i}` }));
  const random = (() => { let seed = 42; return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; })();
  const queue = SessionQueue.create(items, random);
  assert.notDeepEqual(queue.pending.map((i) => i.wordId), items.map((i) => i.wordId), 'bei 30 Elementen ist eine unveränderte Reihenfolge nach dem Mischen praktisch ausgeschlossen');
  assert.equal(queue.pending.length, items.length);
});
