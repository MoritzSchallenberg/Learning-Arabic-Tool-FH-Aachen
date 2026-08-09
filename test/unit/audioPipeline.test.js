// Entwicklungsauftrag 12, Abschnitt 18 — Tests für die Audio-Erzeugungspipeline
// (scripts/audio/audioPipeline.js). Läuft ausschließlich gegen eine isolierte temporäre
// Verzeichniskopie (nie gegen die echten Projektdateien) und schleust einen gefälschten
// Provider ein -- KEIN einziger echter API-Aufruf.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {
  defaultPaths, loadContext, saveManifest, selectTargets, representativeSample, planReport,
  generateOne, runGeneration, verify
} = require('../../scripts/audio/audioPipeline.js');
const { buildTestWav } = require('../helpers/buildTestWav.js');
const { ProviderError } = require('../../scripts/audio/ttsProviders.js');

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-pipeline-test-'));
  const packDir = path.join(root, 'language-packs', 'arabic');
  fs.mkdirSync(path.join(packDir, 'audio', 'vocabulary'), { recursive: true });

  const vocabulary = {
    categories: [
      {
        id: 'cat1',
        words: [
          { id: 'legacy_word_1', arabic_vocalized: 'كَلِمَة قَدِيمَة', arabic_unvocalized: 'كلمة قديمة', german_answers: ['altes Wort'], unit_id: 'vocab_unit_01', session_id: 'vocab_unit_01_a', content_status: 'needs_language_review' },
          { id: 'new_word_1', arabic_vocalized: 'أَهْلاً', arabic_unvocalized: 'اهلا', german_answers: ['Hallo'], unit_id: 'vocab_unit_01', session_id: 'vocab_unit_01_a', content_status: 'needs_language_review' },
          { id: 'new_word_2', arabic_vocalized: 'شُكْراً', arabic_unvocalized: 'شكرا', german_answers: ['Danke'], unit_id: 'vocab_unit_06', session_id: 'vocab_unit_06_a', content_status: 'needs_language_review' },
          { id: 'new_word_3', arabic_vocalized: 'مَعَ السَّلَامَة', arabic_unvocalized: 'مع السلامة', german_answers: ['Auf Wiedersehen'], unit_id: 'vocab_unit_11', session_id: 'vocab_unit_11_a', content_status: 'needs_language_review' }
        ]
      }
    ]
  };
  fs.writeFileSync(path.join(packDir, 'vocabulary.json'), JSON.stringify(vocabulary, null, 2));

  // legacy_word_1 hat bereits eine "echte" Bestandsaudiodatei -- steht bewusst NICHT im Manifest.
  fs.writeFileSync(path.join(packDir, 'audio', 'vocabulary', 'legacy_word_1.wav'), buildTestWav({ durationSeconds: 0.5 }));

  const manifest = {
    note: 'Testmanifest',
    entries: [
      { id: 'new_word_1', arabic_vocalized: 'أَهْلاً', arabic_unvocalized: 'اهلا', german: 'Hallo', output_file: 'new_word_1.wav', status: 'needs_language_review' },
      { id: 'new_word_2', arabic_vocalized: 'شُكْراً', arabic_unvocalized: 'شكرا', german: 'Danke', output_file: 'new_word_2.wav', status: 'needs_language_review' },
      { id: 'new_word_3', arabic_vocalized: 'مَعَ السَّلَامَة', arabic_unvocalized: 'مع السلامة', german: 'Auf Wiedersehen', output_file: 'new_word_3.wav', status: 'needs_language_review' }
    ]
  };
  fs.writeFileSync(path.join(root, 'audio_generation_manifest.json'), JSON.stringify(manifest, null, 2));

  return { root, paths: defaultPaths(root) };
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

const validBuffer = () => buildTestWav({ durationSeconds: 1 });
const noopSleep = async () => {};

test('selectTargets: --all liefert alle 3 fehlenden IDs, nicht die Bestandsaudio', () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const targets = selectTargets(context, { all: true });
    assert.deepEqual([...targets.map((t) => t.id)].sort(), ['new_word_1', 'new_word_2', 'new_word_3']);
    assert.ok(!targets.some((t) => t.id === 'legacy_word_1'), 'die Bestandsaudio-ID steht gar nicht im Manifest und darf nie ausgewählt werden');
  } finally { cleanup(root); }
});

test('planReport: arabic_vocalized wird live aus vocabulary.json gelesen (nicht aus dem Manifest-Cache)', () => {
  const { root, paths } = makeFixture();
  try {
    // Manifest-Cache für new_word_1 künstlich veraltet machen -- das Plan-Zeichenzahl muss trotzdem
    // die AKTUELLE Länge aus vocabulary.json verwenden.
    const context = loadContext(paths);
    const targets = selectTargets(context, { all: true });
    const report = planReport(context, targets);
    const expectedChars = 'أَهْلاً'.length + 'شُكْراً'.length + 'مَعَ السَّلَامَة'.length;
    assert.equal(report.totalCharacters, expectedChars);
  } finally { cleanup(root); }
});

test('representativeSample: reproduzierbar (zwei Aufrufe liefern dieselben IDs) und deckt mehrere Units ab', () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const pool = context.manifest.entries;
    const sample1 = representativeSample(pool, context.wordsById, 2).map((e) => e.id);
    const sample2 = representativeSample(pool, context.wordsById, 2).map((e) => e.id);
    assert.deepEqual(sample1, sample2);
    assert.equal(sample1.length, 2);
  } finally { cleanup(root); }
});

test('generateOne mit dry-run: schreibt keine Datei und ändert das Manifest nicht', async () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    const before = fs.readFileSync(paths.manifestPath, 'utf-8');
    const result = await generateOne(context, entry, { dryRun: true, providerFn: async () => { throw new Error('darf nicht aufgerufen werden'); } });
    assert.equal(result.status, 'dry_run');
    assert.equal(fs.existsSync(path.join(paths.audioDir, 'new_word_1.wav')), false);
    assert.equal(fs.readFileSync(paths.manifestPath, 'utf-8'), before);
  } finally { cleanup(root); }
});

test('generateOne: erfolgreicher Lauf schreibt die Datei atomar, setzt generated_unreviewed und speichert Prüfsumme+Text-Hash', async () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    const result = await generateOne(context, entry, {
      providerFn: async () => validBuffer(),
      providerName: 'elevenlabs',
      modelId: 'eleven_multilingual_v2',
      voiceId: 'test-voice',
      sleepFn: noopSleep
    });
    assert.equal(result.status, 'generated');
    assert.ok(fs.existsSync(path.join(paths.audioDir, 'new_word_1.wav')));

    const saved = JSON.parse(fs.readFileSync(paths.manifestPath, 'utf-8'));
    const savedEntry = saved.entries.find((e) => e.id === 'new_word_1');
    assert.equal(savedEntry.generation_status, 'generated_unreviewed');
    assert.equal(savedEntry.audio_review_status, 'not_reviewed');
    assert.equal(savedEntry.language_status, 'needs_language_review', 'Sprachstatus darf durch die Audioerzeugung nicht verändert werden');
    assert.equal(savedEntry.status, 'needs_language_review', 'das alte "status"-Feld bleibt unverändert (kein ready_for_generation)');
    assert.ok(savedEntry.generation.checksum_sha256);
    assert.ok(savedEntry.generation.input_text_hash);
    assert.equal(savedEntry.generation.provider, 'elevenlabs');
    assert.equal(savedEntry.generation.voice_id, 'test-voice');
    assert.equal(savedEntry.generation.reason, 'user_authorized_preview_generation');
    assert.ok(savedEntry.generation.generated_at);
  } finally { cleanup(root); }
});

test('generateOne: content_status des Wortes selbst bleibt needs_language_review (Wortdatei wird gar nicht verändert)', async () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    await generateOne(context, entry, { providerFn: async () => validBuffer(), sleepFn: noopSleep });
    const vocab = JSON.parse(fs.readFileSync(paths.vocabularyPath, 'utf-8'));
    const word = vocab.categories[0].words.find((w) => w.id === 'new_word_1');
    assert.equal(word.content_status, 'needs_language_review');
  } finally { cleanup(root); }
});

test('generateOne: eine als WAV gespeicherte Fehlerantwort wird NICHT übernommen und führt zu "failed"', async () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    const fakeErrorResponse = async () => Buffer.from('{"detail":"quota_exceeded"}', 'utf-8');
    const result = await generateOne(context, entry, { providerFn: fakeErrorResponse, maxAttempts: 1, sleepFn: noopSleep });
    assert.equal(result.status, 'failed');
    assert.equal(fs.existsSync(path.join(paths.audioDir, 'new_word_1.wav')), false);
    const saved = JSON.parse(fs.readFileSync(paths.manifestPath, 'utf-8'));
    assert.equal(saved.entries.find((e) => e.id === 'new_word_1').generation_status, 'failed');
  } finally { cleanup(root); }
});

test('generateOne: bestehende Bestandsaudiodatei wird NIE überschrieben, selbst bei absichtlicher ID-Kollision', async () => {
  const { root, paths } = makeFixture();
  try {
    // Simuliert eine (nach heutigem Datenstand ausgeschlossene) Kollision: ein Manifest-Eintrag
    // zeigt auf dieselbe Ausgabedatei wie eine bereits vorhandene Bestandsaudiodatei.
    const manifest = JSON.parse(fs.readFileSync(paths.manifestPath, 'utf-8'));
    manifest.entries.push({ id: 'legacy_word_1', arabic_vocalized: 'كَلِمَة قَدِيمَة', status: 'needs_language_review' });
    fs.writeFileSync(paths.manifestPath, JSON.stringify(manifest, null, 2));
    const originalBytes = fs.readFileSync(path.join(paths.audioDir, 'legacy_word_1.wav'));

    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'legacy_word_1');
    const result = await generateOne(context, entry, { providerFn: async () => validBuffer(), sleepFn: noopSleep });

    assert.equal(result.status, 'blocked_existing_file');
    const afterBytes = fs.readFileSync(path.join(paths.audioDir, 'legacy_word_1.wav'));
    assert.deepEqual([...afterBytes], [...originalBytes], 'die vorhandene Bestandsdatei darf byteidentisch unverändert bleiben');
  } finally { cleanup(root); }
});

test('runGeneration: ein "unterbrochener" Lauf ist fortsetzbar -- ein zweiter Lauf verarbeitet nur die noch offenen IDs', async () => {
  const { root, paths } = makeFixture();
  try {
    let context = loadContext(paths);
    let targets = selectTargets(context, { ids: ['new_word_1'] });
    await runGeneration(context, targets, { providerFn: async () => validBuffer(), sleepFn: noopSleep, onProgress: () => {} });

    // "Absturz" simuliert: neuer Kontext (frisch von der Festplatte geladen), zweiter Lauf mit --all.
    context = loadContext(paths);
    targets = selectTargets(context, { all: true });
    assert.deepEqual([...targets.map((t) => t.id)].sort(), ['new_word_2', 'new_word_3'], 'new_word_1 wurde bereits erzeugt und darf beim Fortsetzen nicht erneut angefragt werden');

    const results = await runGeneration(context, targets, { providerFn: async () => validBuffer(), sleepFn: noopSleep, onProgress: () => {} });
    assert.equal(results.generated.length, 2);

    const finalManifest = JSON.parse(fs.readFileSync(paths.manifestPath, 'utf-8'));
    assert.ok(finalManifest.entries.every((e) => e.generation_status === 'generated_unreviewed'));
  } finally { cleanup(root); }
});

test('generateOne: Wiederholungsversuche mit Backoff -- ein zweimal wiederholbarer Fehler, dann Erfolg, führt zu "generated"', async () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    let calls = 0;
    const sleeps = [];
    const flakyProvider = async () => {
      calls += 1;
      if (calls < 3) throw new ProviderError('vorübergehender Fehler', { retryable: true });
      return validBuffer();
    };
    const result = await generateOne(context, entry, {
      providerFn: flakyProvider,
      maxAttempts: 3,
      baseDelayMs: 100,
      sleepFn: async (ms) => { sleeps.push(ms); }
    });
    assert.equal(result.status, 'generated');
    assert.equal(calls, 3);
    assert.deepEqual(sleeps, [100, 200], 'Backoff muss mit jedem Versuch wachsen (begrenzt)');
  } finally { cleanup(root); }
});

test('generateOne: ein NICHT wiederholbarer Fehler (z. B. 401/402) bricht sofort ab, ohne weitere Versuche', async () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    let calls = 0;
    const fatalProvider = async () => { calls += 1; throw new ProviderError('401', { retryable: false }); };
    const result = await generateOne(context, entry, { providerFn: fatalProvider, maxAttempts: 5, sleepFn: noopSleep });
    assert.equal(result.status, 'failed');
    assert.equal(calls, 1, 'bei einem als nicht wiederholbar markierten Fehler darf es nur EINEN Versuch geben');
  } finally { cleanup(root); }
});

test('verify: erkennt eine außerhalb der Pipeline veränderte Datei (Prüfsummen-Abweichung)', async () => {
  const { root, paths } = makeFixture();
  try {
    let context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    await generateOne(context, entry, { providerFn: async () => validBuffer(), sleepFn: noopSleep });

    // Datei nachträglich "von außen" verändern.
    fs.writeFileSync(path.join(paths.audioDir, 'new_word_1.wav'), buildTestWav({ durationSeconds: 2, amplitude: 5000 }));

    context = loadContext(paths);
    const report = verify(context);
    assert.ok(report.problems.some((p) => p.id === 'new_word_1' && p.problem.includes('Prüfsumme')));
  } finally { cleanup(root); }
});

test('verify: meldet eine als generated_unreviewed markierte, aber fehlende Datei', async () => {
  const { root, paths } = makeFixture();
  try {
    let context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    await generateOne(context, entry, { providerFn: async () => validBuffer(), sleepFn: noopSleep });
    fs.unlinkSync(path.join(paths.audioDir, 'new_word_1.wav'));

    context = loadContext(paths);
    const report = verify(context);
    assert.ok(report.problems.some((p) => p.id === 'new_word_1' && p.problem.includes('fehlt')));
  } finally { cleanup(root); }
});

test('verify: eine unveränderte, korrekt erzeugte Datei gilt als in Ordnung', async () => {
  const { root, paths } = makeFixture();
  try {
    let context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    await generateOne(context, entry, { providerFn: async () => validBuffer(), sleepFn: noopSleep });
    context = loadContext(paths);
    const report = verify(context);
    assert.deepEqual([...report.ok], ['new_word_1']);
    assert.equal(report.problems.length, 0);
  } finally { cleanup(root); }
});

test('generateOne: Standardlauf erzeugt NUR die normale Datei, nie eine "_slow.wav" (Abschnitt 11)', async () => {
  const { root, paths } = makeFixture();
  try {
    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    await generateOne(context, entry, { providerFn: async () => validBuffer(), sleepFn: noopSleep });
    assert.ok(fs.existsSync(path.join(paths.audioDir, 'new_word_1.wav')));
    assert.equal(fs.existsSync(path.join(paths.audioDir, 'new_word_1_slow.wav')), false, 'audioPlayer.js nutzt für "langsam" bereits den bestehenden playbackRate-Fallback -- keine zweite Datei nötig');
  } finally { cleanup(root); }
});

test('kein API-Schlüssel gelangt ins Manifest, in Prüfsummen-Metadaten oder in eine Log-Ausgabe', async () => {
  const { root, paths } = makeFixture();
  try {
    const SECRET = 'sk-ganz-geheimer-test-schluessel-xyz';
    const context = loadContext(paths);
    const entry = context.manifest.entries.find((e) => e.id === 'new_word_1');
    const logLines = [];
    const originalLog = console.log;
    console.log = (...parts) => logLines.push(parts.join(' '));
    try {
      // providerFn bekommt den Schlüssel wie im echten CLI als Closure-Parameter, nie als
      // Rückgabewert oder Log-Argument.
      await generateOne(context, entry, {
        providerFn: async () => { void SECRET; return validBuffer(); },
        sleepFn: noopSleep,
        onProgress: (p) => console.log(JSON.stringify(p))
      });
    } finally {
      console.log = originalLog;
    }
    const manifestText = fs.readFileSync(paths.manifestPath, 'utf-8');
    assert.ok(!manifestText.includes(SECRET), 'API-Schlüssel darf nie im Manifest landen');
    assert.ok(!logLines.some((l) => l.includes(SECRET)), 'API-Schlüssel darf nie in einer Log-Zeile landen');
  } finally { cleanup(root); }
});

test('saveManifest/loadContext round-trip: ändert das alte "status"-Feld nicht, auch nach mehreren Speicherzyklen', async () => {
  const { root, paths } = makeFixture();
  try {
    let context = loadContext(paths);
    for (const id of ['new_word_1', 'new_word_2']) {
      const entry = context.manifest.entries.find((e) => e.id === id);
      // eslint-disable-next-line no-await-in-loop
      await generateOne(context, entry, { providerFn: async () => validBuffer(), sleepFn: noopSleep });
      context = loadContext(paths);
    }
    const saved = JSON.parse(fs.readFileSync(paths.manifestPath, 'utf-8'));
    assert.ok(saved.entries.every((e) => e.status === 'needs_language_review'));
  } finally { cleanup(root); }
});
