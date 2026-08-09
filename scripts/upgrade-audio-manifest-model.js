#!/usr/bin/env node
// Entwicklungsauftrag 12, Abschnitt 9 -- einmalige, idempotente Schemaerweiterung von
// audio_generation_manifest.json um die drei getrennten Statusachsen (language_status,
// generation_status, audio_review_status) und das generation-Metadatenobjekt. Das bisherige
// "status"-Feld bleibt unverändert erhalten. Mehrfaches Ausführen verändert bereits migrierte
// Einträge nicht erneut (siehe normalizeManifest -- füllt nur fehlende Felder auf).

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');
const { normalizeManifest, enrichManifestWithWordMeta } = require('./audio/audioManifestModel.js');

const ROOT = process.env.AUDIO_PIPELINE_ROOT || path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'audio_generation_manifest.json');
const VOCAB_PATH = path.join(ROOT, 'language-packs', 'arabic', 'vocabulary.json');

const before = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const beforeSerialized = JSON.stringify(before);

const vocabulary = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
const wordsById = new Map(vocabulary.categories.flatMap((c) => c.words).map((w) => [w.id, w]));

const after = enrichManifestWithWordMeta(normalizeManifest(before), wordsById);
const afterSerialized = JSON.stringify(after);

if (beforeSerialized === afterSerialized) {
  console.log('audio_generation_manifest.json hat bereits das erweiterte Statusmodell -- keine Änderung nötig.');
  process.exit(0);
}

// Stichprobenartige Rückwärtskompatibilitäts-Prüfung vor dem Schreiben: das alte "status"-Feld
// muss für jeden Eintrag exakt erhalten bleiben.
for (let i = 0; i < before.entries.length; i += 1) {
  if (before.entries[i].status !== after.entries[i].status) {
    console.error(`FEHLER: "status" von "${before.entries[i].id}" hätte sich geändert (${before.entries[i].status} -> ${after.entries[i].status}) -- Migration abgebrochen, nichts geschrieben.`);
    process.exit(1);
  }
}

writeJsonFileAtomic(MANIFEST_PATH, `${JSON.stringify(after, null, 2)}\n`);

const languageStatusCounts = {};
const generationStatusCounts = {};
const audioReviewStatusCounts = {};
for (const e of after.entries) {
  languageStatusCounts[e.language_status] = (languageStatusCounts[e.language_status] || 0) + 1;
  generationStatusCounts[e.generation_status] = (generationStatusCounts[e.generation_status] || 0) + 1;
  audioReviewStatusCounts[e.audio_review_status] = (audioReviewStatusCounts[e.audio_review_status] || 0) + 1;
}

console.log(`audio_generation_manifest.json migriert: ${after.entries.length} Einträge.`);
console.log('language_status:', languageStatusCounts);
console.log('generation_status:', generationStatusCounts);
console.log('audio_review_status:', audioReviewStatusCounts);
console.log('Das alte "status"-Feld wurde für alle Einträge unverändert beibehalten.');
