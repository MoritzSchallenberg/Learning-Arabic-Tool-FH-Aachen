// Tests für AudioPlayer (Entwicklungsauftrag 5, Abschnitt 22): keine überlagerte Wiedergabe,
// langsame Wiedergabe bevorzugt eine eigene "_slow"-Aufnahme, fällt ohne diese auf die normale
// Aufnahme mit reduziertem playbackRate zurück (statt sofort auf TTS auszuweichen), und erst
// ganz ohne jede Aufnahme kommt TTS zum Einsatz.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

class FakeAudio {
  constructor(src) {
    this.src = src;
    this.playbackRate = 1;
    this.paused = true;
    this.currentTime = 0;
    this.onended = null;
    this.onerror = null;
    FakeAudio.instances.push(this);
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  // Testhilfe: simuliert das natürliche Ende der Wiedergabe.
  finish() {
    if (this.onended) this.onended();
  }
}
FakeAudio.instances = [];

function loadAudioPlayer({ loadAudioImpl, ttsCalls }) {
  FakeAudio.instances = [];
  const context = {
    window: { api: { loadAudio: loadAudioImpl } },
    Audio: FakeAudio,
    TTS: { speak: (text, lang, opts) => { ttsCalls.push({ text, lang, opts }); return Promise.resolve(); } },
    console
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'audioPlayer.js'), 'utf-8');
  vm.runInContext(`${src}\nthis.__AudioPlayer = AudioPlayer;`, context);
  return context.__AudioPlayer;
}

test('zweite Wiedergabe stoppt eine noch laufende erste Wiedergabe (keine Überlagerung)', async () => {
  const AudioPlayer = loadAudioPlayer({
    loadAudioImpl: (lang, key) => Promise.resolve(Buffer.from(`data-for-${key}`).toString('base64')),
    ttsCalls: []
  });

  const firstPromise = AudioPlayer.speak('erstes Wort', 'ar-SA', { audioKey: 'vocabulary/word_a' });
  await new Promise((r) => setImmediate(r));
  const first = FakeAudio.instances[0];
  assert.ok(first, 'erste Audio-Instanz sollte erzeugt worden sein');
  assert.equal(first.paused, false, 'erste Wiedergabe sollte laufen');

  AudioPlayer.speak('zweites Wort', 'ar-SA', { audioKey: 'vocabulary/word_b' });
  await new Promise((r) => setImmediate(r));

  assert.equal(first.paused, true, 'erste Wiedergabe sollte durch die zweite gestoppt worden sein');
  assert.equal(first.currentTime, 0, 'Position der gestoppten Wiedergabe sollte zurückgesetzt sein');
  const second = FakeAudio.instances[1];
  assert.ok(second);
  assert.equal(second.paused, false);

  // Die erste (gestoppte) Wiedergabe wird nie regulär beendet — genau wie im echten Code
  // (AudioPlayer.speak(...).catch(() => {})) wird ihr Ergebnis hier bewusst nicht abgewartet,
  // um die Zusicherung des Tests nicht künstlich von einem nie eintretenden Event abhängig zu
  // machen. Nur die zweite (aktuelle) Wiedergabe wird sauber abgeschlossen.
  firstPromise.catch(() => {});
  second.finish();
});

test('langsame Wiedergabe nutzt eine vorhandene eigene "_slow"-Aufnahme ohne playbackRate-Anpassung', async () => {
  const AudioPlayer = loadAudioPlayer({
    loadAudioImpl: (lang, key) => Promise.resolve(key.endsWith('_slow') ? Buffer.from('slow-take').toString('base64') : Buffer.from('normal-take').toString('base64')),
    ttsCalls: []
  });

  const p = AudioPlayer.speak('Wort', 'ar-SA', { slow: true, audioKey: 'vocabulary/word_a' });
  await new Promise((r) => setImmediate(r));
  const instance = FakeAudio.instances[0];
  assert.ok(instance.src.includes(Buffer.from('slow-take').toString('base64')), 'sollte die eigene *_slow-Aufnahme verwenden');
  assert.equal(instance.playbackRate, 1, 'bei einer echten Slow-Aufnahme wird playbackRate nicht verändert');
  instance.finish();
  const result = await p;
  assert.equal(result.source, 'audio');
});

test('ohne "_slow"-Datei wird die normale Aufnahme mit playbackRate=0.75 verwendet (kein TTS)', async () => {
  const AudioPlayer = loadAudioPlayer({
    loadAudioImpl: (lang, key) => Promise.resolve(key.endsWith('_slow') ? null : Buffer.from('normal-take').toString('base64')),
    ttsCalls: []
  });

  const p = AudioPlayer.speak('Wort', 'ar-SA', { slow: true, audioKey: 'vocabulary/word_a' });
  await new Promise((r) => setImmediate(r));
  const instance = FakeAudio.instances[0];
  assert.ok(instance, 'sollte auf die normale Aufnahme zurückfallen, statt sofort TTS zu nutzen');
  assert.equal(instance.playbackRate, 0.75);
  instance.finish();
  const result = await p;
  assert.equal(result.source, 'audio');
});

test('ganz ohne Aufnahme (weder normal noch "_slow") wird auf TTS zurückgefallen', async () => {
  const ttsCalls = [];
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: () => Promise.resolve(null), ttsCalls });

  const result = await AudioPlayer.speak('Hallo', 'ar-SA', { audioKey: 'vocabulary/unknown' });
  assert.equal(result.source, 'tts');
  assert.equal(ttsCalls.length, 1);
  assert.equal(ttsCalls[0].text, 'Hallo');
});

test('ohne audioKey wird direkt TTS verwendet', async () => {
  const ttsCalls = [];
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: () => { throw new Error('sollte nicht aufgerufen werden'); }, ttsCalls });

  const result = await AudioPlayer.speak('Hallo', 'ar-SA', {});
  assert.equal(result.source, 'tts');
  assert.equal(ttsCalls.length, 1);
});
