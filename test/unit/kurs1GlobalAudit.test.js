// Globaler Kurs-1-Gesamtaudit (Entwicklungsauftrag 11, Abschnitt 11+12) — jetzt, da Kurs 1 nach
// Batch 6 strukturell vollständig ist (900/900 Wörter, 90/90 Sessions, 90/90 Theoriedokumente),
// prüft diese Datei alle 25 im Auftrag genannten Punkte als automatisierte Tests gegen die
// ECHTEN Sprachpaketdateien. Bei Problemen werden konkrete IDs genannt, keine bloßen Summen.
// Ergänzt außerdem globale Tests für Review-Dateien/Audio-Manifest/Application-Prompts/
// Mini-Checks sowie einen Render-/Ablauftest für ALLE 90 Vokabel-Theoriedokumente.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createDocumentStub } = require('../helpers/domStub.js');
const { PART_OF_SPEECH_VALUES } = require('../../scripts/partOfSpeechVocabulary.js');

const ROOT = path.join(__dirname, '..', '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const AUDIO_DIR = path.join(PACK, 'audio', 'vocabulary');
const LANGUAGE_REVIEW_DIR = path.join(ROOT, 'language-review');

const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const vocabSessions = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabSessions.json'), 'utf-8'));
const theoryData = JSON.parse(fs.readFileSync(path.join(PACK, 'theory.json'), 'utf-8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'audio_generation_manifest.json'), 'utf-8'));

const words = vocabulary.categories.flatMap((c) => c.words);
const wordsById = new Map(words.map((w) => [w.id, w]));

const batchFiles = fs.readdirSync(LANGUAGE_REVIEW_DIR).filter((f) => /^batch_\d+\.json$/.test(f)).sort();
const batches = batchFiles.map((f) => ({ file: f, doc: JSON.parse(fs.readFileSync(path.join(LANGUAGE_REVIEW_DIR, f), 'utf-8')) }));

// 1. Genau 900 eindeutige Wort-IDs.
test('Audit 1: genau 900 eindeutige Wort-IDs', () => {
  assert.equal(words.length, 900);
  assert.equal(new Set(words.map((w) => w.id)).size, 900);
});

// 2. Genau 30 Units mit je 30 Wörtern.
test('Audit 2: genau 30 Units mit je 30 Wörtern', () => {
  assert.equal(vocabSessions.vocab_units.length, 30);
  const byUnit = new Map();
  for (const w of words) byUnit.set(w.unit_id, (byUnit.get(w.unit_id) || 0) + 1);
  const bad = [...byUnit.entries()].filter(([, n]) => n !== 30);
  assert.deepEqual(bad, [], `Units mit falscher Wortzahl: ${JSON.stringify(bad)}`);
});

// 3. Genau 90 Sessions mit je 10 Wörtern.
test('Audit 3: genau 90 Sessions mit je 10 Wörtern', () => {
  assert.equal(vocabSessions.sessions.length, 90);
  const bad = vocabSessions.sessions.filter((s) => s.new_word_ids.length !== 10).map((s) => s.session_id);
  assert.deepEqual(bad, [], `Sessions mit falscher Wortzahl: ${bad.join(', ')}`);
});

// 4. Jedes Wort gehört exakt zu einer Unit und einer Session.
test('Audit 4: jedes Wort gehört exakt zu einer Unit und einer Session', () => {
  const sessionOfWord = new Map();
  for (const s of vocabSessions.sessions) {
    for (const wid of s.new_word_ids) {
      if (sessionOfWord.has(wid)) assert.fail(`Wort "${wid}" ist mehreren Sessions zugeordnet: "${sessionOfWord.get(wid)}" und "${s.session_id}"`);
      sessionOfWord.set(wid, s.session_id);
    }
  }
  const withoutSession = words.filter((w) => !sessionOfWord.has(w.id)).map((w) => w.id);
  assert.deepEqual(withoutSession, [], `Wörter ohne Session-Zuordnung: ${withoutSession.join(', ')}`);
  const mismatched = words.filter((w) => sessionOfWord.get(w.id) !== w.session_id).map((w) => w.id);
  assert.deepEqual(mismatched, [], `Wörter, deren word.session_id nicht zur tatsächlichen Zuordnung passt: ${mismatched.join(', ')}`);
});

// 5. Keine unbekannten Wortverweise.
test('Audit 5: keine unbekannten Wortverweise (application_prompts.expected_word_id, opposite_id)', () => {
  const unknownRefs = [];
  for (const w of words) {
    for (const p of w.application_prompts || []) {
      if (p.expected_word_id && !wordsById.has(p.expected_word_id)) unknownRefs.push(`${w.id} -> application_prompt.expected_word_id "${p.expected_word_id}"`);
    }
    if (w.opposite_id && !wordsById.has(w.opposite_id)) unknownRefs.push(`${w.id} -> opposite_id "${w.opposite_id}"`);
  }
  assert.deepEqual(unknownRefs, []);
});

// 6. Alle Wörter erfüllen das vollständige Datenmodell.
test('Audit 6: alle 900 Wörter erfüllen das vollständige Datenmodell', () => {
  function isVollstaendig(w) {
    return w.arabic_vocalized && w.transliteration && w.part_of_speech
      && Array.isArray(w.accepted_arabic_answers) && w.accepted_arabic_answers.length > 0
      && ('gender' in w) && ('plural' in w)
      && Array.isArray(w.application_prompts) && w.application_prompts.length > 0;
  }
  const incomplete = words.filter((w) => !isVollstaendig(w)).map((w) => w.id);
  assert.deepEqual(incomplete, [], `Unvollständige Wörter: ${incomplete.join(', ')}`);
});

// 7. Alle Substantive besitzen bearbeitete Genus-/Pluralfelder.
test('Audit 7: alle Substantive besitzen bearbeitete Genus-/Pluralfelder', () => {
  const bad = words.filter((w) => w.part_of_speech && w.part_of_speech.startsWith('Substantiv') && (!('gender' in w) || !('plural' in w))).map((w) => w.id);
  assert.deepEqual(bad, []);
});

// 8. Alle Wortarten stammen aus der zentralen Liste.
test('Audit 8: alle part_of_speech-Werte stammen aus der zentralen Liste (scripts/partOfSpeechVocabulary.js)', () => {
  const known = new Set(PART_OF_SPEECH_VALUES);
  const bad = words.filter((w) => w.part_of_speech && !known.has(w.part_of_speech)).map((w) => `${w.id}:"${w.part_of_speech}"`);
  assert.deepEqual(bad, []);
});

// 9. Alle opposite_id-Beziehungen sind gegenseitig.
test('Audit 9: alle opposite_id-Beziehungen sind gegenseitig', () => {
  const bad = [];
  for (const w of words) {
    if (!w.opposite_id) continue;
    const partner = wordsById.get(w.opposite_id);
    if (!partner || partner.opposite_id !== w.id) bad.push(`${w.id} -> ${w.opposite_id}`);
  }
  assert.deepEqual(bad, []);
});

// 10 + 11. Alle Homonyme sind bewusst markiert / keine unerklärten identischen arabischen Formen.
test('Audit 10+11: identische unvokalisierte arabische Formen sind ausschließlich bewusst markierte Homonyme', () => {
  const byUnvocalized = new Map();
  for (const w of words) {
    const key = w.arabic_unvocalized || w.arabic;
    if (!key) continue;
    if (!byUnvocalized.has(key)) byUnvocalized.set(key, []);
    byUnvocalized.get(key).push(w);
  }
  const unexplained = [];
  for (const [key, group] of byUnvocalized.entries()) {
    if (group.length < 2) continue;
    const tags = new Set(group.map((w) => w.homonym_group || null));
    const allTaggedSame = tags.size === 1 && group[0].homonym_group;
    if (!allTaggedSame) unexplained.push(`"${key}": ${group.map((w) => w.id).join(', ')}`);
  }
  assert.deepEqual(unexplained, [], `Unerklärte identische arabische Formen (kein übereinstimmendes homonym_group): ${unexplained.join(' | ')}`);
});

// 12. Deutsche Übersetzungskollisionen sind dokumentiert oder behoben.
test('Audit 12: deutsche Übersetzungskollisionen entsprechen genau den 3 dokumentierten, bewusst akzeptierten Fällen', () => {
  const byGerman = new Map();
  for (const w of words) {
    const g = ((w.german_answers && w.german_answers[0]) || w.german || '').trim().toLowerCase();
    if (!g) continue;
    if (!byGerman.has(g)) byGerman.set(g, []);
    byGerman.get(g).push(w.id);
  }
  const collisions = [...byGerman.entries()].filter(([, ids]) => ids.length > 1);
  const documented = new Set(['gern geschehen', 'über', 'vor']);
  const undocumented = collisions.filter(([g]) => !documented.has(g));
  assert.deepEqual(undocumented, [], `Neue, nicht dokumentierte deutsche Übersetzungskollisionen: ${JSON.stringify(undocumented)}`);
  assert.equal(collisions.length, 3, `Erwartet genau 3 dokumentierte Kollisionen ("gern geschehen"/"über"/"vor"), gefunden: ${collisions.map(([g]) => g).join(', ')}`);
});

// 13. Keine Presentation Forms.
test('Audit 13: keine Arabic-Presentation-Forms-Codepoints in irgendeinem der 900 Wörter', () => {
  const ranges = [[0xFB50, 0xFDFF], [0xFE70, 0xFEFF]];
  const re = new RegExp(`[${ranges.map(([a, b]) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`).join('')}]`);
  const bad = [];
  for (const w of words) {
    for (const field of ['arabic', 'arabic_vocalized', 'arabic_unvocalized']) {
      if (typeof w[field] === 'string' && re.test(w[field])) bad.push(`${w.id}.${field}`);
    }
  }
  assert.deepEqual(bad, []);
});

// 14 + 15. Alle 90 Theoriedokumente sind vollständig, keine Platzhalter-Theorie mehr.
test('Audit 14+15: alle 90 Vokabel-Theoriedokumente sind vollständig, 0 Platzhalter', () => {
  const bad = [];
  let placeholderCount = 0;
  for (const s of vocabSessions.sessions) {
    const doc = theoryData.theories.find((t) => t.theory_id === s.theory_id);
    if (!doc) { bad.push(`${s.session_id}: Theoriedokument "${s.theory_id}" fehlt`); continue; }
    if (doc.is_placeholder) { placeholderCount += 1; bad.push(`${s.session_id}: "${doc.theory_id}" ist noch Platzhalter`); }
  }
  assert.deepEqual(bad, [], bad.join(' | '));
  assert.equal(placeholderCount, 0);
});

// 16. Jede Theorie referenziert exakt ihre Sessionwörter.
test('Audit 16: jede Theorie referenziert über word_preview exakt ihre 10 Sessionwörter', () => {
  const bad = [];
  for (const s of vocabSessions.sessions) {
    const doc = theoryData.theories.find((t) => t.theory_id === s.theory_id);
    const preview = doc.blocks.find((b) => b.type === 'word_preview');
    if (!preview) { bad.push(`${s.session_id}: word_preview fehlt`); continue; }
    const a = [...preview.word_ids].sort();
    const b = [...s.new_word_ids].sort();
    if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(`${s.session_id}: word_preview (${a.join(',')}) != Sessionwörter (${b.join(',')})`);
  }
  assert.deepEqual(bad, []);
});

// 17. Jeder Mini-Check besitzt eine eindeutige richtige Lösung.
test('Audit 17: jede Mini-Check-Frage in allen 90 Theoriedokumenten besitzt genau eine richtige Lösung', () => {
  const bad = [];
  for (const s of vocabSessions.sessions) {
    const doc = theoryData.theories.find((t) => t.theory_id === s.theory_id);
    const miniCheck = doc.blocks.find((b) => b.type === 'mini_check');
    if (!miniCheck || !Array.isArray(miniCheck.questions) || miniCheck.questions.length < 2) {
      bad.push(`${s.session_id}: mini_check fehlt oder hat weniger als 2 Fragen`);
      continue;
    }
    miniCheck.questions.forEach((q, i) => {
      const correctCount = q.options.filter((o) => o.correct).length;
      if (correctCount !== 1) bad.push(`${s.session_id}, Frage ${i + 1}: ${correctCount} richtige Optionen statt genau 1`);
    });
  }
  assert.deepEqual(bad, []);
});

// 18. Jeder Application-Prompt ist gültig.
test('Audit 18: jeder Application-Prompt aller 900 Wörter ist gültig (nicht-leer, konsistente Lösung)', () => {
  const bad = [];
  for (const w of words) {
    for (const p of w.application_prompts || []) {
      if (!p.prompt || !p.prompt.trim()) { bad.push(`${w.id}: leerer prompt`); continue; }
      if (!p.expected_word_id && !p.expected_meaning) { bad.push(`${w.id}: keine Lösung`); continue; }
      if (p.expected_word_id && p.expected_word_id !== w.id) bad.push(`${w.id}: expected_word_id zeigt auf anderes Wort (${p.expected_word_id})`);
      if (p.expected_meaning && !(w.german_answers || []).includes(p.expected_meaning)) bad.push(`${w.id}: expected_meaning "${p.expected_meaning}" nicht in german_answers`);
    }
  }
  assert.deepEqual(bad, []);
});

// 19. Jede Contextual-Choice-Aufgabe besitzt genau eine richtige Lösung (strukturelle Garantie +
// Stichprobe mit echtem Rendering über einen größeren, zufälligen Querschnitt aller 900 Wörter).
test('Audit 19: contextual_choice-Aufgaben haben strukturell und im echten Rendering genau eine richtige Option (Stichprobe)', () => {
  const context = { console };
  vm.createContext(context);
  const src = ['src/js/srs.js', 'src/js/exerciseGuard.js', 'src/js/session/exerciseRegistry.js']
    .map((p) => fs.readFileSync(path.join(ROOT, p), 'utf-8')).join('\n;\n');
  vm.runInContext(`${src}\nthis.__ExerciseRegistry = ExerciseRegistry;\nthis.__ExerciseGuard = ExerciseGuard;`, context);
  const doc = createDocumentStub();
  context.document = doc;
  const ExerciseRegistry = context.__ExerciseRegistry;
  const ExerciseGuard = context.__ExerciseGuard;

  // Stichprobe: jedes 15. Wort (60 Stichproben über alle Units verteilt) -- deckt einen breiten
  // Querschnitt ab, ohne alle 900 einzeln zu rendern (Performance).
  const sample = words.filter((_, i) => i % 15 === 0);
  const bad = [];
  for (const word of sample) {
    const container = doc.createElement('div');
    const guard = ExerciseGuard.create();
    ExerciseRegistry.render('contextual_choice', container, { word, allWords: words, helpConfig: { showDiacritics: 'full' }, settings: {} }, guard, () => {});
    const buttons = container.findAllButtons();
    const correctText = word.arabic_vocalized || word.arabic;
    const matching = buttons.filter((b) => b.textContent === correctText);
    if (matching.length !== 1) bad.push(`${word.id}: ${matching.length} passende Optionen statt genau 1`);
  }
  assert.deepEqual(bad, [], `Stichprobengröße: ${sample.length}`);
});

// 20 + 22. Alle 900 Wörter sind in genau einer Review-Datei erfasst, kein Review-Eintrag doppelt.
test('Audit 20+22: alle 900 Wörter sind in GENAU einer Sprachprüfdatei erfasst (keine Lücken, keine Duplikate)', () => {
  const countById = new Map();
  for (const { file, doc } of batches) {
    for (const e of doc.entries) {
      countById.set(e.id, [...(countById.get(e.id) || []), file]);
    }
  }
  const missing = words.filter((w) => !countById.has(w.id)).map((w) => w.id);
  assert.deepEqual(missing, [], `Wörter in keiner Review-Datei: ${missing.join(', ')}`);
  const duplicated = [...countById.entries()].filter(([, files]) => files.length > 1);
  assert.deepEqual(duplicated, [], `Wörter in mehreren Review-Dateien: ${JSON.stringify(duplicated)}`);
  const unknown = [...countById.keys()].filter((id) => !wordsById.has(id));
  assert.deepEqual(unknown, [], `Review-Einträge für unbekannte Wort-IDs: ${unknown.join(', ')}`);
});

// 21. Alle 90 Theorien sind in genau einem theory_review erfasst.
test('Audit 21: alle 90 Theoriedokumente sind in GENAU einem theory_review-Eintrag erfasst', () => {
  const countById = new Map();
  for (const { file, doc } of batches) {
    for (const t of doc.theory_review || []) {
      countById.set(t.theory_id, [...(countById.get(t.theory_id) || []), file]);
    }
  }
  const allTheoryIds = vocabSessions.sessions.map((s) => s.theory_id);
  assert.equal(new Set(allTheoryIds).size, 90);
  const missing = allTheoryIds.filter((id) => !countById.has(id));
  assert.deepEqual(missing, [], `Theoriedokumente ohne theory_review-Eintrag: ${missing.join(', ')}`);
  const duplicated = [...countById.entries()].filter(([, files]) => files.length > 1);
  assert.deepEqual(duplicated, [], `Theoriedokumente in mehreren theory_review-Listen: ${JSON.stringify(duplicated)}`);
});

// 23. Kein menschlicher Review-Status wurde vorgetäuscht.
test('Audit 23: kein menschlicher Review-Status wurde vorgetäuscht (alle Prüffelder/Status auf Ausgangswerten)', () => {
  const badWords = words.filter((w) => w.content_status !== 'needs_language_review').map((w) => w.id);
  assert.deepEqual(badWords, [], `Wörter mit verändertem content_status: ${badWords.join(', ')}`);
  const badEntries = [];
  for (const { file, doc } of batches) {
    for (const e of doc.entries) {
      if (e.review_status !== 'needs_language_review') badEntries.push(`${file}:${e.id}.review_status`);
      for (const flag of ['arabic_vocalization_reviewed', 'transliteration_reviewed', 'german_translation_reviewed', 'application_prompts_reviewed']) {
        if (e.review && e.review[flag] !== false) badEntries.push(`${file}:${e.id}.review.${flag}`);
      }
    }
    for (const t of doc.theory_review || []) {
      if (t.review_status !== 'needs_language_review') badEntries.push(`${file}:${t.theory_id}.review_status`);
      for (const flag of ['arabic_examples_reviewed', 'german_explanation_reviewed', 'mini_check_reviewed', 'application_prompts_reviewed']) {
        if (t[flag] !== false) badEntries.push(`${file}:${t.theory_id}.${flag}`);
      }
    }
  }
  assert.deepEqual(badEntries, []);
  assert.equal(manifest.entries.filter((e) => e.status === 'ready_for_generation').length, 0);
});

// 24. Manifest und Review-Dateien sind konsistent.
test('Audit 24: Audio-Manifest und Review-Dateien sind konsistent (Manifest = genau die c1_-Wörter aus Batch 1-6, Batch 0 fehlt bewusst)', () => {
  const manifestIds = new Set(manifest.entries.map((e) => e.id));
  const batch0Ids = new Set(batches.find((b) => b.file === 'batch_00.json').doc.entries.map((e) => e.id));
  const newBatchIds = new Set(batches.filter((b) => b.file !== 'batch_00.json').flatMap((b) => b.doc.entries.map((e) => e.id)));
  assert.equal(manifest.entries.length, newBatchIds.size);
  const missingFromManifest = [...newBatchIds].filter((id) => !manifestIds.has(id));
  assert.deepEqual(missingFromManifest, [], `In Batch 1-6, aber nicht im Manifest: ${missingFromManifest.join(', ')}`);
  const batch0InManifest = [...batch0Ids].filter((id) => manifestIds.has(id));
  assert.deepEqual(batch0InManifest, [], `Batch-0-Wörter, die fälschlich im Manifest stehen: ${batch0InManifest.join(', ')}`);
  for (const e of manifest.entries) {
    assert.ok(wordsById.has(e.id), `Manifest-Eintrag für unbekanntes Wort "${e.id}"`);
  }
});

// 25. Bestehende Audiodateien sind weiterhin vorhanden und unverändert.
test('Audit 25: alle 141 ursprünglichen Audiodateien sind weiterhin vorhanden, keine neuen Audiodateien für Batch 1-6 wurden erzeugt', () => {
  const batch0Ids = batches.find((b) => b.file === 'batch_00.json').doc.entries.map((e) => e.id);
  const missingAudio = batch0Ids.filter((id) => !fs.existsSync(path.join(AUDIO_DIR, `${id}.wav`)));
  assert.deepEqual(missingAudio, [], `Fehlende Audiodatei für ursprüngliche Bestandswörter: ${missingAudio.join(', ')}`);
  const newBatchIds = batches.filter((b) => b.file !== 'batch_00.json').flatMap((b) => b.doc.entries.map((e) => e.id));
  const unexpectedAudio = newBatchIds.filter((id) => fs.existsSync(path.join(AUDIO_DIR, `${id}.wav`)));
  assert.deepEqual(unexpectedAudio, [], `Unerwartete Audiodateien für noch nicht sprachlich geprüfte Wörter erzeugt: ${unexpectedAudio.join(', ')}`);
  const allAudioFiles = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith('.wav') && !f.endsWith('_slow.wav'));
  assert.equal(allAudioFiles.length, 141, `Erwartet weiterhin genau 141 normale Audiodateien, gefunden: ${allAudioFiles.length}`);
});

// --- Render-/Ablauftest für ALLE 90 Vokabel-Theoriedokumente (Auftrag Abschnitt 12, letzter
// Absatz: "wenn ohne unverhältnismäßigen Aufwand möglich, erweitere den Test auf alle 90
// Vokabel-Theoriedokumente") -- über den echten TheoryRenderer + DOM-Stub, keine Electron-UI.
function loadTheoryRenderer(doc) {
  const context = {
    console, setTimeout, document: doc,
    ExerciseGuard: require('../../src/js/exerciseGuard.js'),
    AppState: { markTheoryOpened: () => {}, markTheoryCompleted: () => {} }
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(ROOT, 'src', 'js', 'theoryRenderer.js'), 'utf-8');
  vm.runInContext(`${src}\nthis.__TheoryRenderer = TheoryRenderer;`, context);
  return context.__TheoryRenderer;
}

test('Render-/Ablauftest: ALLE 90 Vokabel-Theoriedokumente mounten und jeden Mini-Check mit der richtigen Antwort vollständig durchklicken', () => {
  assert.equal(vocabSessions.sessions.length, 90);
  for (const s of vocabSessions.sessions) {
    const doc = theoryData.theories.find((t) => t.theory_id === s.theory_id);
    assert.ok(doc, `${s.session_id}: Theoriedokument "${s.theory_id}" fehlt`);
    const docStub = createDocumentStub();
    const TheoryRenderer = loadTheoryRenderer(docStub);
    const container = docStub.createElement('div');
    let miniCheckResult = null;

    TheoryRenderer.mount(container, doc, {
      getWordById: (id) => wordsById.get(id),
      onMiniCheckComplete: (correct, total) => { miniCheckResult = { correct, total }; }
    });
    assert.ok(container.textContent.includes(doc.title), `${s.theory_id}: Titel wird nicht gerendert`);

    const miniCheckBlock = doc.blocks.find((b) => b.type === 'mini_check');
    assert.ok(miniCheckBlock, `${s.theory_id}: mini_check-Block fehlt`);
    for (const q of miniCheckBlock.questions) {
      const correctOption = q.options.find((o) => o.correct);
      const btn = container.findAllButtons().find((b) => b.textContent === correctOption.text);
      assert.ok(btn, `${s.theory_id}: Button für richtige Antwort "${correctOption.text}" nicht gefunden`);
      btn.click();
      assert.ok(container.textContent.includes('Richtig!'), `${s.theory_id}: kein "Richtig!"-Feedback`);
      const weiterBtn = container.findAllButtons().find((b) => b.textContent === 'Weiter');
      assert.ok(weiterBtn, `${s.theory_id}: "Weiter"-Button fehlt`);
      weiterBtn.click();
    }
    assert.deepEqual(miniCheckResult, { correct: miniCheckBlock.questions.length, total: miniCheckBlock.questions.length }, `${s.theory_id}: unerwartetes Mini-Check-Ergebnis`);
  }
});
