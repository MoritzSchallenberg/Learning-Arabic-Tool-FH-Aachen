#!/usr/bin/env node
// Entwicklungsauftrag 7, Batch 2 (Units 6-10) — hebt die 132 neuen Wörter dieser fünf Units vom
// Meilenstein-2-Minimalmodell (aus Entwicklungsauftrag 6) auf das volle Datenmodell an: findet
// die bereits bestehenden Wort-Objekte anhand ihrer ID (keine neuen IDs, keine neuen Kategorien)
// und ergänzt/überschreibt die inhaltlichen Felder aus scripts/data/kurs1Units6to10Full.js.
//
// Idempotent: kann mehrfach ausgeführt werden, überschreibt deterministisch mit denselben Werten.

const fs = require('fs');
const path = require('path');
const { writeJsonFileAtomic } = require('./writeJsonAtomic.js');

const ROOT = path.join(__dirname, '..');
const PACK = path.join(ROOT, 'language-packs', 'arabic');
const VOCAB_PATH = path.join(PACK, 'vocabulary.json');

const { UNIT_6, UNIT_7, UNIT_8, UNIT_9, UNIT_10 } = require('./data/kurs1Units6to10Full.js');
const ALL_ENTRIES = [...UNIT_6, ...UNIT_7, ...UNIT_8, ...UNIT_9, ...UNIT_10];

function stripDiacritics(text) {
  // Numerische \uXXXX-Escapes statt roher combining-mark-Zeichen im Quelltext -- siehe
  // Bugfix-Hinweis in build-kurs1-batch.js (eine falsch kopierte Zeichenklasse strippte dort
  // einmal ganze Woerter auf '').
  return text.replace(/[\u064B-\u0652\u0653-\u0655\u0656-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
}

const vocabulary = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf-8'));
const words = vocabulary.categories.flatMap((c) => c.words);
const byId = new Map(words.map((w) => [w.id, w]));

let upgraded = 0;
let missing = 0;
for (const entry of ALL_ENTRIES) {
  const w = byId.get(entry.id);
  if (!w) { console.error(`WARNUNG: Wort-ID "${entry.id}" nicht in vocabulary.json gefunden — übersprungen.`); missing += 1; continue; }

  w.arabic = entry.ar;
  w.arabic_vocalized = entry.ar;
  w.arabic_unvocalized = stripDiacritics(entry.ar);
  w.german = entry.de[0];
  w.german_answers = entry.de;
  w.transliteration = entry.tr;
  w.part_of_speech = entry.pos;
  w.gender = entry.g;
  w.plural = entry.pl;
  const arabicAnswers = [entry.ar, stripDiacritics(entry.ar)].filter((v, i, arr) => arr.indexOf(v) === i);
  w.accepted_arabic_answers = arabicAnswers;
  w.application_prompts = [{ type: 'context_choice', prompt: entry.app, expected_meaning: entry.de[0] }];
  if (entry.homonymGroup) w.homonym_group = entry.homonymGroup;
  // content_status bleibt "needs_language_review" (unverändert) — Sprachprüfung steht noch aus.
  upgraded += 1;
}

writeJsonFileAtomic(VOCAB_PATH, `${JSON.stringify(vocabulary, null, 2)}\n`);
console.log(`Wörter auf volles Datenmodell angehoben: ${upgraded}`);
if (missing > 0) console.log(`Nicht gefunden (bitte prüfen): ${missing}`);
