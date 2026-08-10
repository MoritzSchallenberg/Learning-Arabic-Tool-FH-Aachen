// Entwicklungsauftrag 13, Abschnitt 5/18 — Tests für die zentrale Audio-Schlüssel-Auflösung.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

function loadResolver() {
  const warnings = [];
  const context = { console: { ...console, warn: (...args) => warnings.push(args.join(' ')) } };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'audioKeyResolver.js'), 'utf-8');
  vm.runInContext(`${src}\nthis.__AudioKeyResolver = AudioKeyResolver;`, context);
  return { AudioKeyResolver: context.__AudioKeyResolver, warnings };
}

test('resolveVocabularyAudioKey: bevorzugt ein vorhandenes word.audio_key', () => {
  const { AudioKeyResolver } = loadResolver();
  assert.equal(AudioKeyResolver.resolveVocabularyAudioKey({ id: 'w1', audio_key: 'vocabulary/custom' }), 'vocabulary/custom');
});

test('resolveVocabularyAudioKey: fällt kontrolliert auf "vocabulary/<id>" zurück, wenn audio_key komplett fehlt', () => {
  const { AudioKeyResolver, warnings } = loadResolver();
  assert.equal(AudioKeyResolver.resolveVocabularyAudioKey({ id: 'w1' }), 'vocabulary/w1');
  assert.equal(warnings.length, 0, 'ein schlicht fehlendes Feld (ältere Datensätze) ist kein Warnfall');
});

test('resolveVocabularyAudioKey: warnt sichtbar bei einem vorhandenen, aber leeren/ungültigen audio_key (verdeckt es nicht still)', () => {
  const { AudioKeyResolver, warnings } = loadResolver();
  const result = AudioKeyResolver.resolveVocabularyAudioKey({ id: 'w1', audio_key: '' });
  assert.equal(result, 'vocabulary/w1');
  assert.equal(warnings.length, 1);
  assert.ok(warnings[0].includes('w1'));
});

test('resolveVocabularyAudioKey: null/undefined-Wort liefert null, statt zu werfen', () => {
  const { AudioKeyResolver } = loadResolver();
  assert.equal(AudioKeyResolver.resolveVocabularyAudioKey(null), null);
  assert.equal(AudioKeyResolver.resolveVocabularyAudioKey(undefined), null);
});

test('resolveVocabularyAudioKey: Wort ganz ohne id und ohne audio_key liefert null', () => {
  const { AudioKeyResolver } = loadResolver();
  assert.equal(AudioKeyResolver.resolveVocabularyAudioKey({}), null);
});

test('resolveVocabularyAudioKey: stimmt für alle 900 echten Wörter exakt mit dem gespeicherten audio_key überein', () => {
  const { AudioKeyResolver } = loadResolver();
  const vocab = JSON.parse(fs.readFileSync(path.join(ROOT, 'language-packs', 'arabic', 'vocabulary.json'), 'utf-8'));
  const words = vocab.categories.flatMap((c) => c.words);
  assert.equal(words.length, 900);
  for (const w of words) {
    assert.equal(AudioKeyResolver.resolveVocabularyAudioKey(w), w.audio_key, `Wort "${w.id}"`);
  }
});

test('resolveLetterAudioKey: bevorzugt letter.audio_key, sonst "letters/<id>"', () => {
  const { AudioKeyResolver } = loadResolver();
  assert.equal(AudioKeyResolver.resolveLetterAudioKey({ id: 'alif', audio_key: 'letters/custom' }), 'letters/custom');
  assert.equal(AudioKeyResolver.resolveLetterAudioKey({ id: 'alif' }), 'letters/alif');
});
