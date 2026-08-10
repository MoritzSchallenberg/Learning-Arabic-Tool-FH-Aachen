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

function loadAudioPlayer({ loadAudioImpl, ttsCalls, ttsShouldFail = false, feedbackCalls = null }) {
  FakeAudio.instances = [];
  const context = {
    window: { api: { loadAudio: loadAudioImpl } },
    Audio: FakeAudio,
    TTS: {
      speak: (text, lang, opts) => {
        ttsCalls.push({ text, lang, opts });
        return ttsShouldFail ? Promise.reject(new Error('TTS nicht verfügbar')) : Promise.resolve();
      }
    },
    AudioKeyResolver: { resolveVocabularyAudioKey: (word) => (word ? word.audio_key || (word.id ? `vocabulary/${word.id}` : null) : null) },
    AudioFeedback: {
      reportAudioError: (ctx, err) => { if (feedbackCalls) feedbackCalls.push({ type: 'error', ctx, err }); },
      reportTtsFallback: (ctx) => { if (feedbackCalls) feedbackCalls.push({ type: 'tts_fallback', ctx }); }
    },
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
  assert.equal(result.source, 'recorded_audio');
  assert.equal(result.mode, 'dedicated_slow');
  assert.equal(result.audioKey, 'vocabulary/word_a');
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
  assert.equal(result.source, 'recorded_audio');
  assert.equal(result.mode, 'slowed_normal');
});

test('normale (nicht-langsame) Wiedergabe einer vorhandenen Aufnahme liefert mode:"normal"', async () => {
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: () => Promise.resolve(Buffer.from('take').toString('base64')), ttsCalls: [] });
  const p = AudioPlayer.speak('Wort', 'ar-SA', { audioKey: 'vocabulary/word_a' });
  await new Promise((r) => setImmediate(r));
  FakeAudio.instances[0].finish();
  const result = await p;
  assert.equal(result.source, 'recorded_audio');
  assert.equal(result.mode, 'normal');
});

test('ganz ohne Aufnahme (weder normal noch "_slow") wird auf TTS zurückgefallen', async () => {
  const ttsCalls = [];
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: () => Promise.resolve(null), ttsCalls });

  const result = await AudioPlayer.speak('Hallo', 'ar-SA', { audioKey: 'vocabulary/unknown' });
  assert.equal(result.source, 'tts_fallback');
  assert.equal(result.mode, 'tts_fallback');
  assert.equal(ttsCalls.length, 1);
  assert.equal(ttsCalls[0].text, 'Hallo');
});

test('ohne audioKey wird direkt TTS verwendet', async () => {
  const ttsCalls = [];
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: () => { throw new Error('sollte nicht aufgerufen werden'); }, ttsCalls });

  const result = await AudioPlayer.speak('Hallo', 'ar-SA', {});
  assert.equal(result.source, 'tts_fallback');
  assert.equal(ttsCalls.length, 1);
});

test('speak(): schlägt sowohl die Aufnahme als auch TTS fehl, wird "failed" zurückgegeben statt zu werfen', async () => {
  const ttsCalls = [];
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: () => Promise.resolve(null), ttsCalls, ttsShouldFail: true });
  const result = await AudioPlayer.speak('Hallo', 'ar-SA', { audioKey: 'vocabulary/unknown' });
  assert.equal(result.source, 'failed');
  assert.equal(result.mode, 'failed');
});

test('speakWord(): löst den audioKey über AudioKeyResolver auf und spielt die Aufnahme ab', async () => {
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: (lang, key) => Promise.resolve(key === 'vocabulary/w1' ? Buffer.from('take').toString('base64') : null), ttsCalls: [] });
  const p = AudioPlayer.speakWord({ id: 'w1', arabic: 'كلمة' }, { context: 'Test' });
  await new Promise((r) => setImmediate(r));
  FakeAudio.instances[0].finish();
  const result = await p;
  assert.equal(result.source, 'recorded_audio');
  assert.equal(result.audioKey, 'vocabulary/w1');
});

test('speakWord(): bevorzugt word.audio_key gegenüber der ID-basierten Konstruktion', async () => {
  const seenKeys = [];
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: (lang, key) => { seenKeys.push(key); return Promise.resolve(null); }, ttsCalls: [] });
  await AudioPlayer.speakWord({ id: 'w1', audio_key: 'vocabulary/custom_key', arabic: 'كلمة' });
  assert.ok(seenKeys.includes('vocabulary/custom_key'));
  assert.ok(!seenKeys.includes('vocabulary/w1'));
});

test('speakWord(): meldet einen Fehlschlag über AudioFeedback statt ihn zu verschlucken', async () => {
  const feedbackCalls = [];
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: () => Promise.resolve(null), ttsCalls: [], ttsShouldFail: true, feedbackCalls });
  const result = await AudioPlayer.speakWord({ id: 'w1', arabic: 'كلمة' }, { context: 'Testkontext' });
  assert.equal(result.source, 'failed');
  assert.equal(feedbackCalls.length, 1);
  assert.equal(feedbackCalls[0].type, 'error');
  assert.equal(feedbackCalls[0].ctx, 'Testkontext');
});

test('speakWord(): meldet einen TTS-Fallback sichtbar über AudioFeedback', async () => {
  const feedbackCalls = [];
  const AudioPlayer = loadAudioPlayer({ loadAudioImpl: () => Promise.resolve(null), ttsCalls: [], feedbackCalls });
  const result = await AudioPlayer.speakWord({ id: 'w1', arabic: 'كلمة' }, { context: 'Testkontext' });
  assert.equal(result.source, 'tts_fallback');
  assert.equal(feedbackCalls.length, 1);
  assert.equal(feedbackCalls[0].type, 'tts_fallback');
});

test('speakWord(): schützt ein übergebenes Button-Element gegen schnelles Mehrfachstarten', async () => {
  let concurrentCalls = 0;
  let maxConcurrent = 0;
  const AudioPlayer = loadAudioPlayer({
    loadAudioImpl: () => new Promise((resolve) => {
      concurrentCalls += 1;
      maxConcurrent = Math.max(maxConcurrent, concurrentCalls);
      setTimeout(() => { concurrentCalls -= 1; resolve(null); }, 5);
    }),
    ttsCalls: []
  });
  const button = { disabled: false };
  const first = AudioPlayer.speakWord({ id: 'w1', arabic: 'كلمة' }, { button });
  assert.equal(button.disabled, true, 'Button muss sofort synchron deaktiviert werden');
  const second = AudioPlayer.speakWord({ id: 'w1', arabic: 'كلمة' }, { button });
  await Promise.all([first, second]);
  assert.equal(maxConcurrent, 1, 'ein zweiter Klick während des Ladens darf keine zweite Anfrage auslösen');
  assert.equal(button.disabled, false, 'Button muss nach Abschluss wieder aktiviert sein');
});
