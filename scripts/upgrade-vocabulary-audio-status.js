#!/usr/bin/env node
// Entwicklungsauftrag 13, Abschnitt 3.2 — behebt den bei der Baseline-Prüfung gefundenen
// Widerspruch: 759 Wörter standen auf dem nie aktualisierten `audio_status: "missing"` aus
// scripts/build-kurs1-batch.js, obwohl für sie inzwischen (Entwicklungsauftrag 12) tatsächlich
// Audiodateien existieren; die 141 ursprünglichen Bestandswörter hatten das Feld nie.
//
// Setzt `audio_status` für ALLE 900 Wörter neu, abgeleitet aus dem tatsächlichen Dateisystem und
// dem Audio-Manifest (scripts/audio/audioStatusModel.js#computeAudioStatus) -- niemals aus einem
// zuvor gespeicherten Wert übernommen, damit das Feld nie wieder unbemerkt veralten kann.
// Ausnahme: ein bereits von einem Menschen über den Review-Modus gesetztes "reviewed" (abgeleitet
// aus audio_review_status "approved" im Manifest) bleibt erhalten/wird korrekt reproduziert --
// dieses Skript setzt selbst NIE "reviewed", das darf ausschließlich ein Mensch.
//
// Idempotent: ein zweiter Lauf ohne zwischenzeitliche Änderungen an Audiodateien/Manifest
// verändert die Datei nicht (byte-identisch).

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');
const { computeAudioStatus } = require('./audio/audioStatusModel.js');

const ROOT = process.env.AUDIO_PIPELINE_ROOT || path.join(__dirname, '..');
const VOCAB_PATH = path.join(ROOT, 'language-packs', 'arabic', 'vocabulary.json');
const MANIFEST_PATH = path.join(ROOT, 'audio_generation_manifest.json');
const AUDIO_DIR = path.join(ROOT, 'language-packs', 'arabic', 'audio', 'vocabulary');

const vocabulary = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
const beforeSerialized = JSON.stringify(vocabulary);

const manifest = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) : { entries: [] };
const manifestById = new Map(manifest.entries.map((e) => [e.id, e]));

const counts = {};
for (const category of vocabulary.categories) {
  for (const word of category.words) {
    const manifestEntry = manifestById.get(word.id) || null;
    const fileExists = fs.existsSync(path.join(AUDIO_DIR, `${word.id}.wav`));
    const audioReviewApproved = Boolean(manifestEntry && manifestEntry.audio_review_status === 'approved');
    word.audio_status = computeAudioStatus({ fileExists, manifestEntry, audioReviewApproved });
    counts[word.audio_status] = (counts[word.audio_status] || 0) + 1;
  }
}

const afterSerialized = JSON.stringify(vocabulary);
if (beforeSerialized === afterSerialized) {
  console.log('vocabulary.json: audio_status bereits für alle Wörter korrekt -- keine Änderung nötig.');
  console.log(counts);
  process.exit(0);
}

writeJsonFileAtomic(VOCAB_PATH, `${JSON.stringify(vocabulary, null, 2)}\n`);
console.log('vocabulary.json: audio_status für alle Wörter neu abgeleitet.');
console.log(counts);
