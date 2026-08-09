#!/usr/bin/env node
// Entwicklungsauftrag 9, Abschnitt 6 — behebt eine echte Lücke, keinen Skriptfehler: batch_01.json
// und batch_02.json (Batches 1+2, Entwicklungsauftrag 6/7) wurden VOR der Einführung des
// theory_review-Feldes (Entwicklungsauftrag 8, Batch 3) erzeugt und haben deshalb schlicht kein
// theory_review-Array — `npm run report:language-review` meldete deswegen zu Recht nur 15
// vorgemerkte Theoriedokumente (aus batch_03.json), nicht 45. Die ROADMAP-Aussage, alle 45
// vollständigen Theoriedokumente aus Batch 1-3 hätten bereits Review-Metadaten, war schlicht
// falsch (siehe Untersuchung im Abschlussbericht zu Entwicklungsauftrag 9).
//
// Dieses Skript ergänzt NUR das fehlende theory_review-Feld in bestehenden batch_NN.json-Dateien
// -- die vorhandenen "entries" (Wort-Prüfeinträge) werden nicht verändert, damit eventuell bereits
// von einer Person eingetragene notes/review_status nicht überschrieben werden (zum Zeitpunkt
// dieses Skripts: noch keine, siehe Bericht). Alle Prüf-Booleans starten auf false -- es wird
// keine Sprachprüfung behauptet, die nicht stattgefunden hat. Idempotent.
//
// Aufruf: node scripts/backfill-theory-review.js <batchNummer> <unitNummer...>
// Beispiel (Batch 1, Units 1-5):  node scripts/backfill-theory-review.js 1 1 2 3 4 5
// Beispiel (Batch 2, Units 6-10): node scripts/backfill-theory-review.js 2 6 7 8 9 10

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Aufruf: node scripts/backfill-theory-review.js <batchNummer> <unitNummer...>');
  process.exit(1);
}
const batchNumber = parseInt(args[0], 10);
const unitNumbers = args.slice(1).map((n) => parseInt(n, 10));
const batchId = String(batchNumber).padStart(2, '0');
const unitIds = new Set(unitNumbers.map((n) => `vocab_unit_${String(n).padStart(2, '0')}`));

const batchPath = path.join(ROOT, 'language-review', `batch_${batchId}.json`);
if (!fs.existsSync(batchPath)) {
  console.error(`FEHLER: ${batchPath} existiert nicht.`);
  process.exit(1);
}
const batchDoc = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));

const vocabSessions = JSON.parse(fs.readFileSync(path.join(PACK, 'vocabSessions.json'), 'utf-8'));
const theoryData = JSON.parse(fs.readFileSync(path.join(PACK, 'theory.json'), 'utf-8'));

const batchSessions = vocabSessions.sessions.filter((s) => unitIds.has(s.unit_id));
const theoryIds = [...new Set(batchSessions.map((s) => s.theory_id))];

const existingByTheoryId = new Map((batchDoc.theory_review || []).map((t) => [t.theory_id, t]));
const theoryReview = theoryIds.map((theoryId) => {
  // Bereits vorhandene Einträge (z. B. bei erneutem Ausführen) unverändert übernehmen, statt
  // eventuell schon gesetzte Prüf-Booleans zurückzusetzen -- idempotent im eigentlichen Sinn.
  if (existingByTheoryId.has(theoryId)) return existingByTheoryId.get(theoryId);
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

const hadField = Array.isArray(batchDoc.theory_review);
batchDoc.theory_review = theoryReview;

writeJsonFileAtomic(batchPath, `${JSON.stringify(batchDoc, null, 2)}\n`);
console.log(`${path.relative(ROOT, batchPath)}: theory_review ${hadField ? 'aktualisiert' : 'ergänzt (fehlte bisher komplett)'} — ${theoryReview.length} Theoriedokument(e), "entries" unverändert (${batchDoc.entries.length} Wort-Einträge).`);
