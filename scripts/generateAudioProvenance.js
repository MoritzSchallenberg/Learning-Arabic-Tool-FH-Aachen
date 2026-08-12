#!/usr/bin/env node
// Entwicklungsauftrag 19, Abschnitt 7.5 -- erzeugt eine maschinenlesbare Herkunftsdokumentation
// für JEDE ausgelieferte Audiodatei unter language-packs/arabic/audio/. Erfindet keine Herkunft:
// stützt sich ausschließlich auf zwei bereits vorhandene, verifizierbare Fakten --
//
//   1. audio_generation_manifest.json (Entwicklungsauftrag 6/13) listet genau die 759 Vokabel-
//      dateien, die über die ElevenLabs-API (Feld generation.provider === "elevenlabs") erzeugt
//      wurden -- ausschließlich normale (nicht "_slow") Dateien, siehe README/LICENSES.md.
//   2. scripts/generate_audio.py erzeugt AUSSCHLIESSLICH mit espeak-ng (siehe Kopfkommentar dort)
//      und deckt laut eigenem Quellcode beide Ausgabeordner ab (vocabulary/ UND letters/) --
//      jede Datei unter language-packs/arabic/audio/, die NICHT im ElevenLabs-Manifest steht,
//      stammt folglich von diesem Weg: die 141 ursprünglichen Bestands-Vokabeldateien (normal),
//      deren 141 "_slow"-Varianten, sowie alle 56 Buchstaben-Dateien (28 normal + 28 "_slow").
//
// Ausgeführt einmalig zur Veröffentlichung (Entwicklungsauftrag 19); bei künftig neu erzeugten
// Audiodateien (z. B. für Kurs 2) erneut auszuführen, damit die Herkunftsdatei aktuell bleibt --
// siehe DEVELOPMENT_FOUNDATION.md.

'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const AUDIO_ROOT = path.join(ROOT, 'language-packs', 'arabic', 'audio');
const MANIFEST_PATH = path.join(ROOT, 'audio_generation_manifest.json');
const OUTPUT_PATH = path.join(ROOT, 'language-packs', 'arabic', 'audio-provenance.json');

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function listWavFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue; // .staging/ (Audio-Pipeline-Zwischenablage) auslassen
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listWavFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.wav')) out.push(full);
  }
  return out;
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const elevenLabsByOutputFile = new Map();
  for (const entry of manifest.entries) {
    if (entry.generation && entry.generation.provider === 'elevenlabs') {
      elevenLabsByOutputFile.set(entry.output_file, entry);
    }
  }

  const allFiles = listWavFiles(AUDIO_ROOT).sort();
  const files = [];
  let elevenCount = 0;
  let localCount = 0;

  for (const absPath of allFiles) {
    const relPath = path.relative(ROOT, absPath).split(path.sep).join('/');
    const baseName = path.basename(absPath);
    const manifestEntry = elevenLabsByOutputFile.get(baseName);

    if (manifestEntry) {
      elevenCount += 1;
      files.push({
        path: relPath,
        source: 'elevenlabs_free_tier',
        word_id: manifestEntry.id,
        generated_at: manifestEntry.generation.generated_at,
        checksum_sha256: manifestEntry.generation.checksum_sha256 || sha256(absPath)
      });
    } else {
      localCount += 1;
      files.push({
        path: relPath,
        source: 'local_generator_espeak_ng',
        checksum_sha256: sha256(absPath)
      });
    }
  }

  const doc = {
    _generated_by: 'scripts/generateAudioProvenance.js (Entwicklungsauftrag 19, Abschnitt 7.5)',
    _generated_at: new Date().toISOString(),
    note: 'Maschinenlesbare Herkunft jeder ausgelieferten Audiodatei unter language-packs/arabic/'
      + 'audio/. Herkunft wird NICHT geraten, sondern ausschließlich aus audio_generation_manifest.json'
      + ' (ElevenLabs-Aufträge) bzw. dem bekannten Funktionsumfang von scripts/generate_audio.py'
      + ' (espeak-ng, deckt alle übrigen Dateien ab) abgeleitet. Keine Datei in diesem Projekt stammt'
      + ' aus einer ungeklärten Fremdquelle.',
    sources: {
      elevenlabs_free_tier: {
        description: 'Per ElevenLabs-Text-to-Speech-API im Rahmen des KOSTENLOSEN Tarifs erzeugte '
          + 'Vorschau-Vokabelaufnahmen (ausschließlich normale Geschwindigkeit, keine "_slow"-Varianten).',
        provider: 'ElevenLabs (elevenlabs.io)',
        attribution_required: true,
        attribution_text: 'Audio generated with ElevenLabs (elevenlabs.io).',
        commercial_use: false,
        license_note: 'Nicht MIT, nicht CC BY-SA -- unterliegt den ElevenLabs-Nutzungsbedingungen für '
          + 'den kostenlosen Tarif. Nur nichtkommerzielle Verwendung, siehe NOTICE-AUDIO.md/LICENSES.md.',
        file_count: elevenCount
      },
      local_generator_espeak_ng: {
        description: 'Mit dem lokalen, quelloffenen Sprachsynthese-Werkzeug espeak-ng '
          + '(scripts/generate_audio.py) erzeugte Aufnahmen -- die 141 ursprünglichen '
          + 'Bestands-Vokabelwörter (normal + "_slow") sowie alle 56 Buchstaben-Dateien '
          + '(28 normal + 28 "_slow").',
        provider: 'espeak-ng (lokal, offline, GPL-3.0-lizenziertes Werkzeug)',
        attribution_required: false,
        commercial_use: true,
        license_note: 'CC BY-SA 4.0 (wie der übrige Kursinhalt) -- siehe LICENSES.md, Abschnitt 3.1 für '
          + 'die Begründung, warum die WERKZEUG-Lizenz (GPL-3.0) nicht automatisch für jede damit '
          + 'erzeugte Ausgabedatei gilt.',
        file_count: localCount
      }
    },
    total_file_count: files.length,
    files
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`Geschrieben: ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`  ElevenLabs (kostenloser Tarif): ${elevenCount}`);
  console.log(`  Lokaler Generator (espeak-ng):  ${localCount}`);
  console.log(`  Gesamt:                         ${files.length}`);
}

main();
