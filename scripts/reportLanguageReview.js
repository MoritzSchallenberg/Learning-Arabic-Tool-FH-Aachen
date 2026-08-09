#!/usr/bin/env node
// Entwicklungsauftrag 7, Abschnitt 19: "npm run report:language-review" — automatischer
// Sprachprüfbericht über den aktuellen Stand von Kurs 1. Rein lesend (ändert keine Dateien),
// druckt eine Zusammenfassung nach stdout und schreibt optional zusätzlich eine JSON-Datei
// (--json <pfad> bzw. Standard language-review/report.json).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const LANGUAGE_REVIEW_DIR = path.join(ROOT, 'language-review');

const args = process.argv.slice(2);
const jsonFlagIndex = args.indexOf('--json');
const jsonOutPath = jsonFlagIndex !== -1 ? (args[jsonFlagIndex + 1] || path.join(LANGUAGE_REVIEW_DIR, 'report.json')) : null;

const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const words = vocabulary.categories.flatMap((c) => c.words);
const AUDIO_DIR = path.join(PACK, 'audio', 'vocabulary');

// --- Gesamtstatus nach content_status --------------------------------------------------------
const statusCounts = new Map();
for (const w of words) {
  const status = w.content_status || '(kein content_status)';
  statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
}
const approved = statusCounts.get('approved') || 0;
const reviewed = statusCounts.get('reviewed') || 0;
const needsReview = statusCounts.get('needs_language_review') || 0;

// --- Batches aus language-review/*.json --------------------------------------------------------
let batchFiles = [];
if (fs.existsSync(LANGUAGE_REVIEW_DIR)) {
  batchFiles = fs.readdirSync(LANGUAGE_REVIEW_DIR).filter((f) => /^batch_\d+\.json$/.test(f)).sort();
}
const batches = batchFiles.map((file) => {
  const doc = JSON.parse(fs.readFileSync(path.join(LANGUAGE_REVIEW_DIR, file), 'utf-8'));
  return {
    file,
    batch: doc.batch,
    units_covered: doc.units_covered,
    word_count: Array.isArray(doc.entries) ? doc.entries.length : 0,
    theory_review: Array.isArray(doc.theory_review) ? doc.theory_review : []
  };
});

// --- Theorie-Prüfstand (Entwicklungsauftrag 8, Abschnitt 26) — nur Batches, die theory_review
// mitliefern (ab Batch 3); ältere Batch-Dateien ohne dieses Feld werden nicht mitgezählt, statt
// fälschlich 0 zu melden. ------------------------------------------------------------------------
const allTheoryReview = batches.flatMap((b) => b.theory_review);
const theoryFullyReviewed = allTheoryReview.filter((t) => t.arabic_examples_reviewed && t.german_explanation_reviewed && t.mini_check_reviewed && t.application_prompts_reviewed).length;

// --- Fehlende Felder (nur bei Wörtern, die überhaupt schon dran waren, d. h. minimal migriert) -
const missingVocalization = words.filter((w) => !w.arabic_vocalized).length;
const missingTransliteration = words.filter((w) => !w.transliteration).length;
const missingPartOfSpeech = words.filter((w) => !w.part_of_speech).length;

// --- Mehrdeutige deutsche Übersetzungen (identischer erster german_answers-Eintrag, case-
// insensitiv, über mehrere Wort-IDs hinweg) -----------------------------------------------------
const byGerman = new Map();
for (const w of words) {
  const g = ((w.german_answers && w.german_answers[0]) || w.german || '').trim().toLowerCase();
  if (!g) continue;
  if (!byGerman.has(g)) byGerman.set(g, []);
  byGerman.get(g).push(w.id);
}
const ambiguousGerman = [...byGerman.entries()].filter(([, ids]) => ids.length > 1);

// --- Mögliche Homonyme (identische arabic_unvocalized über mehrere Wort-IDs hinweg) -------------
const byUnvocalized = new Map();
for (const w of words) {
  const key = w.arabic_unvocalized || w.arabic;
  if (!key) continue;
  if (!byUnvocalized.has(key)) byUnvocalized.set(key, []);
  byUnvocalized.get(key).push(w);
}
const homonymGroups = [...byUnvocalized.entries()].filter(([, group]) => group.length > 1);
const confirmedHomonyms = homonymGroups.filter(([, group]) => {
  const tags = new Set(group.map((w) => w.homonym_group || null));
  return tags.size === 1 && group[0].homonym_group;
});
const unconfirmedHomonyms = homonymGroups.filter(([key]) => !confirmedHomonyms.some(([k2]) => k2 === key));

// --- Ausgabe ------------------------------------------------------------------------------------
console.log('=== Sprachprüfbericht: Kurs 1 ===\n');
console.log(`Gesamtwörter: ${words.length}\n`);
console.log(`Approved: ${approved}`);
console.log(`Reviewed: ${reviewed}`);
console.log(`Needs review: ${needsReview}`);
if (statusCounts.size > 3 || (approved + reviewed + needsReview) !== words.length) {
  for (const [status, n] of statusCounts.entries()) {
    if (status === 'approved' || status === 'reviewed' || status === 'needs_language_review') continue;
    console.log(`${status}: ${n}`);
  }
}

for (const b of batches) {
  const unitsLabel = Array.isArray(b.units_covered) ? b.units_covered.join(', ') : String(b.units_covered || '(unbekannt)');
  console.log(`\nBatch ${b.batch} (Units ${unitsLabel}):`);
  console.log(`${b.word_count} Wörter vorbereitet (${b.file})`);
  if (b.theory_review.length > 0) {
    const fullyReviewed = b.theory_review.filter((t) => t.arabic_examples_reviewed && t.german_explanation_reviewed && t.mini_check_reviewed && t.application_prompts_reviewed).length;
    console.log(`${b.theory_review.length} Theoriedokument(e) zur Prüfung vorgemerkt (${fullyReviewed} davon vollständig geprüft).`);
  }
}
// --- Bestandswörter mit vorhandener Audiodatei, aber (noch) in keiner Sprachprüfdatei
// (Entwicklungsauftrag 9, Abschnitt 7) — computed rein aus den tatsächlich vorhandenen
// batch_NN.json-Dateien und dem tatsächlichen Audioverzeichnis, nicht hart codiert. Ursache: die
// Batch-Erzeugungsskripte filtern bislang bewusst nur auf `id.startsWith('c1_')` (neue Wörter),
// weil die 141 ursprünglichen Wörter aus Lektionen 3/6/8 bereits eine Audiodatei UND einen
// funktionierenden Session-/Progress-Bezug haben — eine vorhandene Audiodatei bedeutet aber NICHT,
// dass eine Person mit Arabischkenntnissen die Angaben tatsächlich geprüft hat (`content_status`
// bleibt für sie ebenfalls "needs_language_review"). Diese Lücke ist bewusst noch offen, siehe
// ROADMAP-Folgepunkt "Batch 0: die 141 ursprünglichen Bestandswörter formal sprachprüfen".
const allBatchedIds = new Set(batches.flatMap((b) => JSON.parse(fs.readFileSync(path.join(LANGUAGE_REVIEW_DIR, b.file), 'utf-8')).entries.map((e) => e.id)));
const notInAnyBatch = words.filter((w) => !allBatchedIds.has(w.id));
const legacyWithAudioNotBatched = notInAnyBatch.filter((w) => fs.existsSync(path.join(AUDIO_DIR, `${w.id}.wav`)));
const stillMinimalNotBatched = notInAnyBatch.filter((w) => !fs.existsSync(path.join(AUDIO_DIR, `${w.id}.wav`)));
if (legacyWithAudioNotBatched.length > 0) {
  console.log(`\nUrsprüngliche Bestandswörter mit vorhandener Audiodatei, aber noch in keiner Sprachprüfdatei: ${legacyWithAudioNotBatched.length}`);
  console.log('  (bereits benutzbar/mit Audio, aber ebenfalls noch NICHT durch eine Person mit Arabischkenntnissen geprüft — content_status weiterhin "needs_language_review")');
  console.log(`  IDs: ${legacyWithAudioNotBatched.map((w) => w.id).sort().join(', ')}`);
}
if (stillMinimalNotBatched.length > 0) {
  console.log(`\nNoch in keiner Sprachprüfdatei erfasst (neue Wörter ohne Audiodatei, spätere Batches): ${stillMinimalNotBatched.length}`);
}
if (allTheoryReview.length > 0) {
  console.log(`\nTheorie-Prüfstand gesamt: ${allTheoryReview.length} Theoriedokument(e) vorgemerkt, ${theoryFullyReviewed} vollständig geprüft (alle 4 Aspekte: arabische Beispiele, deutsche Erklärung, Mini-Check, Application-Prompts).`);
}

console.log('\nFehlende Vokalisation:');
console.log(missingVocalization);
console.log('\nFehlende Umschrift:');
console.log(missingTransliteration);
console.log('\nFehlende Wortart:');
console.log(missingPartOfSpeech);

console.log('\nMehrdeutige deutsche Übersetzungen:');
console.log(ambiguousGerman.length);
if (ambiguousGerman.length > 0) {
  for (const [g, ids] of ambiguousGerman) console.log(`  "${g}": ${ids.join(', ')}`);
}

console.log('\nMögliche Homonyme:');
console.log(homonymGroups.length);
if (unconfirmedHomonyms.length > 0) {
  console.log(`  davon noch ungeklärt (kein übereinstimmender homonym_group-Tag): ${unconfirmedHomonyms.length}`);
  for (const [key, group] of unconfirmedHomonyms) console.log(`    "${key}": ${group.map((w) => w.id).join(', ')}`);
}
if (confirmedHomonyms.length > 0) {
  console.log(`  davon bestätigt (homonym_group gesetzt): ${confirmedHomonyms.length}`);
}

if (jsonOutPath) {
  const report = {
    generated_at: new Date().toISOString(),
    total_words: words.length,
    status_counts: Object.fromEntries(statusCounts),
    approved,
    reviewed,
    needs_language_review: needsReview,
    batches,
    theory_review_total: allTheoryReview.length,
    theory_review_fully_reviewed: theoryFullyReviewed,
    legacy_words_with_audio_not_yet_batched: legacyWithAudioNotBatched.map((w) => w.id).sort(),
    words_not_yet_batched_without_audio_count: stillMinimalNotBatched.length,
    missing_vocalization: missingVocalization,
    missing_transliteration: missingTransliteration,
    missing_part_of_speech: missingPartOfSpeech,
    ambiguous_german_translations: ambiguousGerman.map(([german, ids]) => ({ german, word_ids: ids })),
    possible_homonyms: homonymGroups.map(([key, group]) => ({
      arabic_unvocalized: key,
      confirmed: group.every((w) => w.homonym_group) && new Set(group.map((w) => w.homonym_group)).size === 1,
      word_ids: group.map((w) => w.id)
    }))
  };
  fs.mkdirSync(path.dirname(jsonOutPath), { recursive: true });
  fs.writeFileSync(jsonOutPath, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
  console.log(`\nJSON-Bericht geschrieben: ${path.relative(ROOT, jsonOutPath)}`);
}
