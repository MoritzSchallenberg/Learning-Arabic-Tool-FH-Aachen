#!/usr/bin/env node
// Entwicklungsauftrag 6 Abschnitt 14+16 / Entwicklungsauftrag 7 Abschnitt 18+21 — erzeugt
// language-review/batch_NN.json (Sprachprüfdatei für die neuen Wörter eines Batches) und
// aktualisiert audio_generation_manifest.json um dieselben Wörter mit Status
// "needs_language_review" (NICHT "ready_for_generation" — das darf erst nach echter
// menschlicher Sprachfreigabe gesetzt werden).
//
// Aufruf: node scripts/build-language-review-and-manifest.js <batchNummer> <unitNummer...>
// Beispiel (Batch 2, Units 6-10): node scripts/build-language-review-and-manifest.js 2 6 7 8 9 10

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Aufruf: node scripts/build-language-review-and-manifest.js <batchNummer> <unitNummer...>');
  process.exit(1);
}
const batchNumber = parseInt(args[0], 10);
const unitNumbers = args.slice(1).map((n) => parseInt(n, 10));
const batchId = String(batchNumber).padStart(2, '0');
const unitIds = new Set(unitNumbers.map((n) => `vocab_unit_${String(n).padStart(2, '0')}`));

const vocabulary = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabulary.json'), 'utf-8'));
const words = vocabulary.categories.flatMap((c) => c.words);
const batchNewWords = words.filter((w) => unitIds.has(w.unit_id) && w.id.startsWith('c1_'));

// --- Theorie-Prüfmetadaten (Entwicklungsauftrag 8, Abschnitt 26) --------------------------------
// Für jedes Theoriedokument, das zu einer Session dieses Batches gehört, wird ein eigener
// Prüfeintrag mit vier Einzel-Booleans angelegt (statt nur einem globalen review_status), damit
// eine Person mit Arabischkenntnissen die vier Aspekte unabhängig voneinander abhaken kann.
const vocabSessionsPath = path.join(PACK, 'vocabSessions.json');
const theoryPath = path.join(PACK, 'theory.json');
let theoryReview = [];
if (fs.existsSync(vocabSessionsPath) && fs.existsSync(theoryPath)) {
  const vocabSessions = JSON.parse(fs.readFileSync(vocabSessionsPath, 'utf-8'));
  const theoryData = JSON.parse(fs.readFileSync(theoryPath, 'utf-8'));
  const batchSessions = vocabSessions.sessions.filter((s) => unitIds.has(s.session_id.replace(/_[abc]$/, '')));
  const theoryIds = [...new Set(batchSessions.map((s) => s.theory_id))];
  theoryReview = theoryIds.map((theoryId) => {
    const doc = theoryData.theories.find((t) => t.theory_id === theoryId);
    return {
      theory_id: theoryId,
      title: doc ? doc.title : null,
      review_status: 'needs_language_review',
      arabic_examples_reviewed: false,
      german_explanation_reviewed: false,
      mini_check_reviewed: false,
      application_prompts_reviewed: false
    };
  });
}

// --- language-review/batch_NN.json -------------------------------------------------------------
// Entwicklungsauftrag 9, Abschnitt 5: pro Wort müssen mindestens Genus, Plural, akzeptierte
// arabische Formen, Application-Prompts sowie Hinweise auf Homonyme/Gegensätze/
// Verwechslungsgruppen übersichtlich prüfbar sein, UND getrennte Prüffelder für die einzelnen
// sprachlich relevanten Aspekte existieren (nicht nur ein einziges review_status). Keines dieser
// Felder wird hier automatisch auf "geprüft" gesetzt.
const reviewEntries = batchNewWords.map((w) => ({
  id: w.id,
  unit_id: w.unit_id,
  session_id: w.session_id,
  arabic_unvocalized: w.arabic_unvocalized,
  proposed_arabic_vocalized: w.arabic_vocalized || null,
  proposed_transliteration: w.transliteration || null,
  german_answers: w.german_answers,
  part_of_speech: w.part_of_speech || null,
  gender: ('gender' in w) ? w.gender : null,
  plural: ('plural' in w) ? w.plural : null,
  accepted_arabic_answers: w.accepted_arabic_answers || [],
  application_prompts: w.application_prompts || [],
  homonym_group: w.homonym_group || null,
  opposite_id: w.opposite_id || null,
  confusion_group: w.confusion_group || null,
  notes: '',
  review_status: 'needs_language_review',
  review: {
    arabic_vocalization_reviewed: false,
    transliteration_reviewed: false,
    german_translation_reviewed: false,
    application_prompts_reviewed: false
  }
}));

const reviewDoc = {
  note: `Sprachprüfdatei für Kurs 1, Batch ${batchNumber} (Units ${unitNumbers.join(', ')}). Arabische Angaben (unvokalisiert + vorgeschlagene Vokalisierung/Umschrift/Grammatik) wurden neu erstellt, siehe Hinweis in scripts/data/kurs1UnitPlan.js zur Kodierungskorruption der ursprünglich vom Nutzer gelieferten Quelldateien. Vor Freigabe zur Audioerzeugung durch eine Person mit Arabischkenntnissen gegenlesen lassen. Zusätzlich pro Session zu prüfen (siehe zugehöriges Theoriedokument in theory.json): Theorietext, Beispiele, Mini-Check, Application-Prompts.`,
  batch: batchNumber,
  units_covered: unitNumbers,
  word_count: reviewEntries.length,
  entries: reviewEntries,
  theory_review: theoryReview
};

fs.mkdirSync(path.join(ROOT, 'language-review'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'language-review', `batch_${batchId}.json`), `${JSON.stringify(reviewDoc, null, 2)}\n`, 'utf-8');

// --- audio_generation_manifest.json (nur dieser Batch, Status "needs_language_review") ----------
const manifestPath = path.join(ROOT, 'audio_generation_manifest.json');
let manifest;
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
} else {
  manifest = {
    note: 'Audio-Generierungsmanifest für Kurs 1 (Entwicklungsauftrag 6 Abschnitt 16 / Entwicklungsauftrag 7 Abschnitt 21+22). Enthält nur Wörter, die entweder bereits sprachlich freigegeben sind (status "ready_for_generation") oder noch auf Freigabe warten (status "needs_language_review"). Solange ein Wort "needs_language_review" ist, DARF für dieses Wort keine Audiodatei erzeugt werden — dieses Skript ruft selbst keine TTS-API auf und erzeugt keine Audiodateien.',
    entries: []
  };
}
// Bestehende Einträge mit dem alten Status-Namen ("pending_language_review", Entwicklungsauftrag
// 6) auf den einheitlichen Namen "needs_language_review" (Entwicklungsauftrag 7, Abschnitt 21)
// normalisieren.
for (const e of manifest.entries) {
  if (e.status === 'pending_language_review') e.status = 'needs_language_review';
}
const byId = new Map(manifest.entries.map((e, i) => [e.id, i]));
for (const w of batchNewWords) {
  const entry = {
    id: w.id,
    arabic_vocalized: w.arabic_vocalized || null,
    arabic_unvocalized: w.arabic_unvocalized,
    german: (w.german_answers && w.german_answers[0]) || w.german,
    output_file: `${w.id}.wav`,
    status: 'needs_language_review'
  };
  if (byId.has(w.id)) manifest.entries[byId.get(w.id)] = entry;
  else { manifest.entries.push(entry); byId.set(w.id, manifest.entries.length - 1); }
}
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');

console.log(`language-review/batch_${batchId}.json: ${reviewEntries.length} Einträge geschrieben, ${theoryReview.length} Theoriedokument(e) zur Prüfung vorgemerkt.`);
console.log(`audio_generation_manifest.json: ${manifest.entries.length} Einträge insgesamt (davon ${batchNewWords.length} aus Batch ${batchNumber}, alle "needs_language_review").`);
